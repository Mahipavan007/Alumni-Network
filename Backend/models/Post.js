const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Target audience - can be user, group, or topic
  targetType: {
    type: String,
    enum: ['user', 'group', 'topic'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Group', 'Topic'],
    required: true
  },
  // For threading - reply to another post
  parentPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  // Root post for threading
  threadRoot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  isReply: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    },
    url: String,
    filename: String,
    size: Number
  }],
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  replyCount: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    editedAt: Date,
    originalBody: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
postSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for search and performance
postSchema.index({ 
  title: 'text', 
  body: 'text', 
  tags: 'text' 
});
postSchema.index({ targetType: 1, targetId: 1 });
postSchema.index({ threadRoot: 1 });
postSchema.index({ author: 1 });
postSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Post', postSchema);
