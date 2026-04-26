const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { register, login, me } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('role')
      .isIn(['candidate', 'recruiter', 'admin']),

    body('email')
      .isEmail()
      .withMessage('A valid email is required'),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),

    body('profile.fullName')
      .optional()
      .isString(),

    body('profile.skills')
      .optional()
      .isArray(),

    body('profile.experienceYears')
      .optional()
      .isNumeric(),

    body('profile.expectedSalary')
      .optional()
      .isNumeric(),

    // companyName is required when role === 'recruiter', ignored otherwise.
    body('companyName')
      .if(body('role').equals('recruiter'))
      .notEmpty()
      .withMessage('Company name is required for recruiter accounts')
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters')
      .trim()
  ],
  asyncHandler(register)
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  asyncHandler(login)
);

router.get('/me', auth, asyncHandler(me));

module.exports = router;