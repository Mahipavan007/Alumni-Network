const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    }
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  requirements: [{
    type: String,
    required: true
  }],
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  category: {
    type: String,
    enum: ['software-development', 'data-science', 'design', 'product-management', 'marketing', 'sales', 'other'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead'],
    required: true
  },
  salary: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  skills: [{
    type: String,
    required: true
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open'
  },
  workLocation: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    required: true
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  applicationUrl: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  benefits: [{
    type: String
  }],
  isPromoted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add text search indexes
jobSchema.index({
  title: 'text',
  'company.name': 'text',
  'company.location': 'text',
  description: 'text',
  skills: 'text'
});

// Add compound indexes for common queries
jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ status: 1, experienceLevel: 1 });
jobSchema.index({ status: 1, workLocation: 1 });
jobSchema.index({ deadline: 1 });

module.exports = mongoose.model('Job', jobSchema);
