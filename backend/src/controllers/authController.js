const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

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
  company_id: user.company_id,
  profile: user.profile
});

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

  const token = signToken(user);

  return res.status(201).json({
    token,
    user: toAuthResponse(user)
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

  const oldPath = user.profile?.resumePath;
  if (oldPath) {
    const absoluteOldPath = path.join(__dirname, '..', '..', oldPath);
    fs.unlink(absoluteOldPath, (err) => {
      if (err && process.env.NODE_ENV !== 'production') {
        console.warn('Failed to remove old resume:', err.message);
      }
    });
  }

  user.profile.resumePath = req.file.path;
  await user.save();

  return res.json({ resumePath: req.file.path });
};

module.exports = { register, login, me, updateMe, uploadResume };
