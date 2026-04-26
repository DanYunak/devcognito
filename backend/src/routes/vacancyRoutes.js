const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const {
  createVacancy,
  getPublicVacancies,
  getMatchedVacancies,
  getCandidatesForVacancy
} = require('../controllers/vacancyController');

const router = express.Router();

router.get('/', asyncHandler(getPublicVacancies));

router.get('/matched', auth, allowRoles('candidate'), asyncHandler(getMatchedVacancies));

router.post(
  '/',
  auth,
  allowRoles('recruiter', 'admin'),
  [
    body('title').isString().isLength({ min: 2, max: 120 }),
    body('skills_required').optional().isArray(),
    body('experience_required').optional().isNumeric(),
    body('salary_range.min').isNumeric(),
    body('salary_range.max').isNumeric(),
    body('status').optional().isIn(['active', 'paused', 'closed'])
  ],
  asyncHandler(createVacancy)
);

router.get(
  '/:vacancyId/candidates',
  auth,
  allowRoles('recruiter', 'admin'),
  asyncHandler(getCandidatesForVacancy)
);

module.exports = router;
