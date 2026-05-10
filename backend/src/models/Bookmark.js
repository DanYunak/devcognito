const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vacancy_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: true
    }
  },
  {
    timestamps: true
  }
);

bookmarkSchema.index({ user_id: 1, vacancy_id: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
