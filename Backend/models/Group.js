const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
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
  isPrivate: {
    type: Boolean,
    default: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'professional', 'social', 'sports', 'hobbies', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    default: ''
  },
  memberCount: {
    type: Number,
    default: 1
  },
  rules: {
    type: String,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true
});

// Index for search functionality
groupSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Group', groupSchema);
