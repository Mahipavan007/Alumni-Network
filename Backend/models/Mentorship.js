const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  goals: [{
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    completedAt: Date
  }],
  focusAreas: [{
    type: String,
    required: true
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  meetingFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly'],
    required: true
  },
  nextMeeting: {
    date: Date,
    agenda: String,
    link: String
  },
  progress: [{
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    achievements: [String],
    challenges: [String],
    nextSteps: [String],
    mentorFeedback: String,
    menteeFeedback: String
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['article', 'video', 'book', 'course', 'other']
    },
    url: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    mentorRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      givenAt: Date
    },
    menteeRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      givenAt: Date
    }
  },
  certificates: [{
    type: {
      type: String,
      enum: ['completion', 'achievement', 'milestone'],
      default: 'completion'
    },
    title: String,
    description: String,
    issuedAt: {
      type: Date,
      default: Date.now
    },
    url: String
  }],
  communications: [{
    type: {
      type: String,
      enum: ['meeting', 'message', 'email', 'other']
    },
    date: {
      type: Date,
      default: Date.now
    },
    summary: String,
    duration: Number // in minutes
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  terminationReason: {
    reason: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: Date
  }
}, {
  timestamps: true
});

// Add indexes for common queries
mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ mentee: 1, status: 1 });
mentorshipSchema.index({ startDate: 1 });
mentorshipSchema.index({ endDate: 1 });

// Prevent multiple active mentorships between same mentor and mentee
mentorshipSchema.index(
  { mentor: 1, mentee: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = mongoose.model('Mentorship', mentorshipSchema);
