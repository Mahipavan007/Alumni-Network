const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
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
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    editedAt: Date,
    originalContent: String
  }]
}, {
  timestamps: true
});

// Indexes for querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Add read receipt
messageSchema.methods.addReadReceipt = async function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    await this.save();
  }
};

// Update message content with history
messageSchema.methods.updateContent = async function(newContent) {
  this.editHistory.push({
    editedAt: new Date(),
    originalContent: this.content
  });
  this.content = newContent;
  this.isEdited = true;
  await this.save();
};

module.exports = mongoose.model('Message', messageSchema);
