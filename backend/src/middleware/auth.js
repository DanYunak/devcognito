const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization token' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      companyId: user.company_id ? String(user.company_id) : null
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token verification failed' });
  }
};

module.exports = auth;
