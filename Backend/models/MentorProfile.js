const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertise: [{
    type: String,
    required: true
  }],
  yearsOfExperience: {
    type: Number,
    required: true
  },
  currentRole: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  menteeCapacity: {
    type: Number,
    default: 3
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'full', 'unavailable'],
    default: 'available'
  },
  preferredMenteeLevel: [{
    type: String,
    enum: ['student', 'fresh-graduate', 'junior-professional', 'mid-career'],
    default: ['fresh-graduate']
  }],
  mentoringSince: {
    type: Date,
    default: Date.now
  },
  activePrograms: {
    type: Number,
    default: 0
  },
  completedPrograms: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  bio: {
    type: String,
    required: true,
    maxlength: 1000
  },
  expectations: {
    type: String,
    maxlength: 500
  },
  availability: {
    hours: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      slots: [{
        start: String,
        end: String
      }]
    }],
    timeZone: {
      type: String,
      default: 'UTC'
    }
  },
  preferredCommunication: [{
    type: String,
    enum: ['video-call', 'audio-call', 'chat', 'email', 'in-person'],
    default: ['video-call', 'chat']
  }],
  languages: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add text search indexes
mentorProfileSchema.index({
  'expertise': 'text',
  'currentRole': 'text',
  'company': 'text',
  'bio': 'text'
});

// Add compound indexes for common queries
mentorProfileSchema.index({ availabilityStatus: 1, expertise: 1 });
mentorProfileSchema.index({ availabilityStatus: 1, 'rating.average': -1 });

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);
