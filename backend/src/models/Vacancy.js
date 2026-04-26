const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    recruiter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    skills_required: {
      type: [String],
      default: []
    },
    experience_required: {
      type: Number,
      default: 0,
      min: 0
    },
    salary_range: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0
      }
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

vacancySchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model('Vacancy', vacancySchema);
