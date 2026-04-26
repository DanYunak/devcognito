const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const {
  applyToVacancy,
  getMyApplications,
  getApplicationsForVacancy,
  updateApplicationStatus,
  getRecruiterApplicationsBoard
} = require('../controllers/applicationController');

const router = express.Router();

router.post(
  '/',
  auth,
  allowRoles('candidate'),
  [body('vacancy_id').isString(), body('cover_letter').optional().isString().isLength({ max: 5000 })],
  asyncHandler(applyToVacancy)
);

router.get('/me', auth, allowRoles('candidate'), asyncHandler(getMyApplications));

router.get('/board', auth, allowRoles('recruiter', 'admin'), asyncHandler(getRecruiterApplicationsBoard));

router.get(
  '/vacancy/:vacancyId',
  auth,
  allowRoles('recruiter', 'admin'),
  asyncHandler(getApplicationsForVacancy)
);

router.patch(
  '/:applicationId/status',
  auth,
  allowRoles('recruiter', 'admin'),
  [body('status').isIn(['new', 'interview', 'offer', 'rejected'])],
  asyncHandler(updateApplicationStatus)
);

module.exports = router;
