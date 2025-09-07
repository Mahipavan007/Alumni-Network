const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['article', 'video', 'document', 'book', 'website', 'course', 'tool', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'career_development',
      'technical_skills',
      'soft_skills',
      'entrepreneurship',
      'industry_insights',
      'academic_resources',
      'research_papers',
      'alumni_publications',
      'learning_materials',
      'other'
    ],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String
  },
  thumbnail: {
    type: String
  },
  tags: [{
    type: String
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'groups'],
    default: 'public'
  },
  accessGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    fileSize: Number,
    format: String,
    duration: Number, // For videos/courses
    pages: Number, // For documents/books
    language: String,
    publishedDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'under_review', 'rejected'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  verifiedResource: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for common queries
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ type: 1, category: 1 });
resourceSchema.index({ author: 1, visibility: 1 });
resourceSchema.index({ featured: 1 });
resourceSchema.index({ status: 1 });

// Virtual field for like count
resourceSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual field for comment count
resourceSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to update view count
resourceSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// Method to update download count
resourceSchema.methods.incrementDownloads = async function() {
  this.downloads += 1;
  await this.save();
};

// Method to add a like
resourceSchema.methods.toggleLike = async function(userId) {
  const userLikeIndex = this.likes.indexOf(userId);
  if (userLikeIndex === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(userLikeIndex, 1);
  }
  await this.save();
  return userLikeIndex === -1; // returns true if liked, false if unliked
};

// Method to add a comment
resourceSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    user: userId,
    content
  });
  await this.save();
  return this.comments[this.comments.length - 1];
};

// Static method to find featured resources
resourceSchema.statics.getFeatured = function() {
  return this.find({ featured: true, status: 'active' })
    .sort('-createdAt')
    .populate('author', 'name profilePicture');
};

// Static method to search resources
resourceSchema.statics.searchResources = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };

  // Apply filters
  if (filters.type) searchQuery.type = filters.type;
  if (filters.category) searchQuery.category = filters.category;
  if (filters.visibility) searchQuery.visibility = filters.visibility;

  return this.find(searchQuery)
    .sort('-createdAt')
    .populate('author', 'name profilePicture');
};

// Configure to include virtuals in JSON
resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resource', resourceSchema);
