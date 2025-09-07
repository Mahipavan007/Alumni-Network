const mongoose = require('mongoose');

const eventRSVPSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['going', 'maybe', 'not_going'],
    required: true
  },
  note: {
    type: String,
    maxlength: 500,
    default: ''
  },
  rsvpAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate RSVPs
eventRSVPSchema.index({ event: 1, user: 1 }, { unique: true });

// Update lastUpdated on save
eventRSVPSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('EventRSVP', eventRSVPSchema);
