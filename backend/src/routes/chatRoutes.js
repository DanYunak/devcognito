const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const { getChatMessages } = require('../controllers/chatController');

const router = express.Router();

router.get(
  '/:applicationId/messages',
  auth,
  allowRoles('candidate', 'recruiter', 'admin'),
  asyncHandler(getChatMessages)
);

module.exports = router;
