const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    profile: {
      fullName: {
        type: String,
        trim: true,
        default: ''
      },
      contacts: {
        type: String,
        trim: true,
        default: ''
      },
      skills: {
        type: [String],
        default: []
      },
      experienceYears: {
        type: Number,
        default: 0,
        min: 0
      },
      expectedSalary: {
        type: Number,
        default: 0,
        min: 0
      },
      hidden: {
        type: Boolean,
        default: true
      }
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1, company_id: 1 });

module.exports = mongoose.model('User', userSchema);
