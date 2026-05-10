const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const Application = require('../models/Application');
const User = require('../models/User');
const { canRevealCandidatePII } = require('../utils/anonymity');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

router.get(
  '/resume/:publicId',
  auth,
  allowRoles('candidate', 'recruiter', 'admin'),
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const resolvedPublicId = publicId.includes('/') ? publicId : `resumes/${publicId}`;
    const normalizedPublicId = decodeURIComponent(resolvedPublicId);
    const candidate = await User.findOne({ 'profile.resumePublicId': normalizedPublicId });
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

    const signedUrl = cloudinary.url(normalizedPublicId, {
      resource_type: 'raw',
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 300
    });

    return res.json({ url: signedUrl });
  })
);

module.exports = router;
