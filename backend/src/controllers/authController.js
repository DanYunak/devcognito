const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
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

  const { role, email, password, profile, company_id } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await User.create({
    role,
    email: email.toLowerCase(),
    password: hashed,
    profile: profile || {},
    company_id: role === 'recruiter' ? company_id : null
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

module.exports = {
  register,
  login,
  me
};
