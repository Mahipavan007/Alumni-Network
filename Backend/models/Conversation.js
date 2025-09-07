const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Each participant's unread message count
  unreadCounts: [{
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Compound index for participants to ensure unique conversations
conversationSchema.index({ participants: 1 });

// Helper method to update unread counts
conversationSchema.methods.updateUnreadCount = async function(messageAuthorId) {
  this.participants.forEach(participantId => {
    if (participantId.toString() !== messageAuthorId.toString()) {
      const unreadEntry = this.unreadCounts.find(
        uc => uc.participant.toString() === participantId.toString()
      );
      if (unreadEntry) {
        unreadEntry.count += 1;
      } else {
        this.unreadCounts.push({
          participant: participantId,
          count: 1
        });
      }
    }
  });
  this.lastActivity = new Date();
  await this.save();
};

// Helper method to reset unread count for a participant
conversationSchema.methods.resetUnreadCount = async function(participantId) {
  const unreadEntry = this.unreadCounts.find(
    uc => uc.participant.toString() === participantId.toString()
  );
  if (unreadEntry) {
    unreadEntry.count = 0;
    await this.save();
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);
