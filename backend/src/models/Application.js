const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    vacancy_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: true
    },
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cover_letter: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['new', 'interview', 'offer', 'rejected'],
      default: 'new'
    },
    status_history: [
      {
        from: {
          type: String,
          enum: ['new', 'interview', 'offer', 'rejected', null],
          default: null
        },
        to: {
          type: String,
          enum: ['new', 'interview', 'offer', 'rejected'],
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        at: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

applicationSchema.index({ vacancy_id: 1, candidate_id: 1 }, { unique: true });
applicationSchema.index({ candidate_id: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
