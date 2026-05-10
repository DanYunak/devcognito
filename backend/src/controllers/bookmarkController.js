const { validationResult } = require('express-validator');
const Bookmark = require('../models/Bookmark');
const Vacancy = require('../models/Vacancy');

const getMyBookmarks = async (req, res) => {
  const bookmarks = await Bookmark.find({ user_id: req.user.id })
    .populate({
      path: 'vacancy_id',
      populate: { path: 'company_id', select: 'name verified' }
    })
    .sort({ createdAt: -1 });

  return res.json({ bookmarks: bookmarks.map((b) => b.vacancy_id) });
};

const addBookmark = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { vacancy_id } = req.body;

  const vacancy = await Vacancy.findById(vacancy_id);
  if (!vacancy || vacancy.status !== 'active') {
    return res.status(404).json({ message: 'Vacancy not found or not active' });
  }

  try {
    await Bookmark.create({ user_id: req.user.id, vacancy_id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already bookmarked' });
    }
    throw error;
  }

  return res.status(201).json({ message: 'Bookmarked' });
};

const removeBookmark = async (req, res) => {
  const { vacancyId } = req.params;

  const removed = await Bookmark.findOneAndDelete({
    user_id: req.user.id,
    vacancy_id: vacancyId
  });

  if (!removed) {
    return res.status(404).json({ message: 'Bookmark not found' });
  }

  return res.json({ message: 'Bookmark removed' });
};

module.exports = {
  getMyBookmarks,
  addBookmark,
  removeBookmark
};
