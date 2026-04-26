const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { register, login, me } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('role').isIn(['candidate', 'recruiter', 'admin']),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('profile.fullName').optional().isString(),
    body('profile.skills').optional().isArray(),
    body('profile.experienceYears').optional().isNumeric(),
    body('profile.expectedSalary').optional().isNumeric()
  ],
  asyncHandler(register)
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], asyncHandler(login));

router.get('/me', auth, asyncHandler(me));

module.exports = router;
