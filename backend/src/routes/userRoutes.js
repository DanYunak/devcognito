const express = require('express');
const path = require('path');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const Application = require('../models/Application');
const User = require('../models/User');
const { canRevealCandidatePII } = require('../utils/anonymity');

const router = express.Router();

router.get(
  '/resume/:filename',
  auth,
  allowRoles('candidate', 'recruiter', 'admin'),
  asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const resumePath = path.join('uploads', 'resumes', filename);

    const candidate = await User.findOne({ 'profile.resumePath': resumePath });
    if (!candidate) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const isOwner = String(candidate._id) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    let canAccess = isOwner || isAdmin;

    if (!canAccess && req.user.role === 'recruiter') {
      const application = await Application.findOne({
        candidate_id: candidate._id,
        status: { $in: ['interview', 'offer'] }
      }).select('status');

      if (application && canRevealCandidatePII(application.status)) {
        canAccess = true;
      }
    }

    if (!canAccess) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.sendFile(path.resolve(resumePath));
  })
);

module.exports = router;
