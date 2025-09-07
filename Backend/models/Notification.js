const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'event_invitation',
      'event_reminder',
      'group_invitation',
      'group_post',
      'topic_post',
      'message_received',
      'mentorship_request',
      'mentorship_accepted',
      'mentorship_meeting',
      'job_application_status',
      'resource_shared'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedModel: {
    type: String,
    enum: ['Event', 'Group', 'Topic', 'Message', 'Mentorship', 'Job', 'Resource']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes for common queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  await this.save();
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      content: data.content,
      link: data.link,
      relatedModel: data.relatedModel,
      relatedId: data.relatedId,
      additionalData: data.additionalData
    });
    await notification.save();
    return notification;
  } catch (error) {
    throw error;
  }
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function(userId, limit = 10) {
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('recipient', 'name email profilePicture');
};

module.exports = mongoose.model('Notification', notificationSchema);
