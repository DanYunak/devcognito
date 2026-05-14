const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PassThrough } = require('stream');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const { sendMail } = require('../config/mailer');

const signToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      companyId: user.company_id ? String(user.company_id) : null
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

const toAuthResponse = (user) => ({
  id: String(user._id),
  role: user.role,
  email: user.email,
  emailVerified: user.emailVerified,
  company_id: user.company_id,
  profile: user.profile
});

const buildVerifyEmail = ({ email, code }) => {
  const verifyUrl = `${env.appBaseUrl}/verify-email?code=${code}&email=${encodeURIComponent(email)}`;
  const subject = 'Confirm your email';
  const text = `Your confirmation code: ${code}. You can also open: ${verifyUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
      <p>Confirm your email to finish registration.</p>
      <p><strong>Code: ${code}</strong></p>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not create an account, ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
};

const generateVerifyCode = () => String(Math.floor(100000 + Math.random() * 900000));

const setEmailVerifyCode = (user) => {
  const code = env.enableEmails ? generateVerifyCode() : '000000';
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  user.emailVerifyCode = codeHash;
  user.emailVerifyCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
  return code;
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role, email, password, profile, companyName } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  let company_id = null;

  if (role === 'recruiter') {
    // companyName is guaranteed to be present here because the
    // validator in authRoutes enforces it for the recruiter role.
    const normalised = companyName.trim();

    // Case-insensitive search using a collation index-friendly regex.
    let company = await Company.findOne({
      name: { $regex: new RegExp(`^${normalised}$`, 'i') }
    });

    if (!company) {
      company = await Company.create({
        name: normalised,
        verified: false
      });
    }

    company_id = company._id;
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await User.create({
    role,
    email: email.toLowerCase(),
    password: hashed,
    profile: profile || {},
    company_id
  });

  const verifyCode = setEmailVerifyCode(user);
  await user.save();

  const mail = buildVerifyEmail({ email: user.email, code: verifyCode });

  sendMail({
    to: user.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html
  }).catch((mailErr) => {
    console.warn('Failed to send verification email:', mailErr.message);
  });

  return res.status(201).json({
    user: toAuthResponse(user),
    emailSent: true,
    requiresVerification: true
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ message: 'Email not verified', code: 'email_unverified' });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: toAuthResponse(user)
  });
};

const me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: toAuthResponse(user) });
};

const updateMe = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { profile = {} } = req.body;
  const updates = {};

  if (profile.fullName !== undefined) {
    updates['profile.fullName'] = profile.fullName;
  }
  if (profile.contacts !== undefined) {
    updates['profile.contacts'] = profile.contacts;
  }
  if (profile.skills !== undefined) {
    updates['profile.skills'] = profile.skills;
  }
  if (profile.experienceYears !== undefined) {
    updates['profile.experienceYears'] = profile.experienceYears;
  }
  if (profile.expectedSalary !== undefined) {
    updates['profile.expectedSalary'] = profile.expectedSalary;
  }

  let user;
  if (Object.keys(updates).length > 0) {
    user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, {
      new: true,
      runValidators: true
    });
  } else {
    user = await User.findById(req.user.id);
  }

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: toAuthResponse(user) });
};

const uploadResume = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Resume file is required' });
  }

  let uploadResult;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );

      const bufferStream = new PassThrough();
      bufferStream.on('error', reject);
      bufferStream.end(req.file.buffer);
      bufferStream.pipe(stream);
    });
  } catch (error) {
    return res.status(500).json({ message: 'Resume upload failed' });
  }

  const oldPublicId = user.profile?.resumePublicId;
  if (oldPublicId) {
    cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to remove old resume:', err.message);
      }
    });
  }

  user.profile.resumePath = uploadResult.secure_url;
  user.profile.resumePublicId = uploadResult.public_id;
  await user.save();

  return res.json({
    resumePath: uploadResult.secure_url,
    resumePublicId: uploadResult.public_id
  });
};

const verifyEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, email } = req.body;
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerifyCode: codeHash,
    emailVerifyCodeExpires: { $gt: new Date() }
  }).select('+emailVerifyCode');

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  user.emailVerified = true;
  user.emailVerifyCode = null;
  user.emailVerifyCodeExpires = null;
  await user.save();

  const token = signToken(user);

  return res.json({
    message: 'Email verified',
    token,
    user: toAuthResponse(user)
  });
};

const resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.emailVerified) {
    return res.status(200).json({ message: 'Email already verified' });
  }

  const verifyCode = setEmailVerifyCode(user);
  await user.save();

  const mail = buildVerifyEmail({ email: user.email, code: verifyCode });

  sendMail({
    to: user.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html
  }).catch((mailErr) => {
    console.warn('Failed to send verification email:', mailErr.message);
  });

  return res.json({ message: 'Verification email sent', emailSent: true });
};

module.exports = {
  register,
  login,
  me,
  updateMe,
  uploadResume,
  verifyEmail,
  resendVerification
};
