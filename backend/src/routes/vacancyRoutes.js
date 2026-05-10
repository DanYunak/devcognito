const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const {
  createVacancy,
  getPublicVacancies,
  getMatchedVacancies,
  getMyVacancies,
  getCandidatesForVacancy,
  updateVacancy,
  updateVacancyStatus,
  deleteVacancy
} = require('../controllers/vacancyController');

const router = express.Router();

router.get('/', asyncHandler(getPublicVacancies));

router.get('/matched', auth, allowRoles('candidate'), asyncHandler(getMatchedVacancies));

router.get('/mine', auth, allowRoles('recruiter', 'admin'), asyncHandler(getMyVacancies));

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

router.patch(
  '/:vacancyId/status',
  auth,
  allowRoles('recruiter', 'admin'),
  [body('status').isIn(['active', 'paused', 'closed'])],
  asyncHandler(updateVacancyStatus)
);

router.get(
  '/:vacancyId/candidates',
  auth,
  allowRoles('recruiter', 'admin'),
  asyncHandler(getCandidatesForVacancy)
);

router.patch(
  '/:vacancyId',
  auth,
  allowRoles('recruiter', 'admin'),
  [
    body('title').optional().isString().isLength({ min: 2, max: 120 }),
    body('skills_required').optional().isArray(),
    body('experience_required').optional().isNumeric(),
    body('salary_range')
      .optional()
      .custom((range) => {
        if (!range) return true;
        const min = range.min !== undefined ? Number(range.min) : null;
        const max = range.max !== undefined ? Number(range.max) : null;
        if (min !== null && max !== null && min > max) {
          throw new Error('salary_range.min cannot exceed salary_range.max');
        }
        return true;
      }),
    body('salary_range.min').optional().isNumeric(),
    body('salary_range.max').optional().isNumeric()
  ],
  asyncHandler(updateVacancy)
);

router.delete(
  '/:vacancyId',
  auth,
  allowRoles('recruiter', 'admin'),
  asyncHandler(deleteVacancy)
);

module.exports = router;
