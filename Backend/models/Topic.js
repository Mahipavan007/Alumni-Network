const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['technology', 'business', 'career', 'education', 'lifestyle', 'entertainment', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  color: {
    type: String,
    default: '#1976d2'
  },
  subscriberCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for search functionality
topicSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Topic', topicSchema);
