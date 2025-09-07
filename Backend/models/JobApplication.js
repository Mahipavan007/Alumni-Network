const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    url: {
      type: String,
      required: true
    },
    filename: String
  },
  coverLetter: {
    type: String,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
    default: 'pending'
  },
  experience: {
    type: String,
    required: true
  },
  relevantSkills: [{
    type: String
  }],
  portfolioUrl: {
    type: String,
    trim: true
  },
  expectedSalary: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  noticePeriod: {
    type: Number, // in days
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  withdrawnAt: Date,
  withdrawReason: String
}, {
  timestamps: true
});

// Prevent multiple applications for the same job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Add indexes for common queries
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ applicant: 1, createdAt: -1 });
jobApplicationSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
