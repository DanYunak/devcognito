const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/roles');
const {
  getMyBookmarks,
  addBookmark,
  removeBookmark
} = require('../controllers/bookmarkController');

const router = express.Router();

router.get('/', auth, allowRoles('candidate'), asyncHandler(getMyBookmarks));

router.post(
  '/',
  auth,
  allowRoles('candidate'),
  [body('vacancy_id').isMongoId()],
  asyncHandler(addBookmark)
);

router.delete(
  '/:vacancyId',
  auth,
  allowRoles('candidate'),
  [param('vacancyId').isMongoId()],
  asyncHandler(removeBookmark)
);

module.exports = router;
