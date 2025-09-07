const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  maxAttendees: {
    type: Number,
    min: 1,
    default: null // null means unlimited
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  attendeeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
eventSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for search and performance
eventSchema.index({ 
  title: 'text', 
  description: 'text'
});
eventSchema.index({ date: 1 });
eventSchema.index({ creator: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
