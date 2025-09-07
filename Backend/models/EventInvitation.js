const mongoose = require('mongoose');

const eventInvitationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  inviteeType: {
    type: String,
    enum: ['user', 'group', 'topic'],
    required: true
  },
  inviteeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'inviteeModel'
  },
  inviteeModel: {
    type: String,
    enum: ['User', 'Group', 'Topic'],
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate invitations
eventInvitationSchema.index({ event: 1, inviteeType: 1, inviteeId: 1 }, { unique: true });

module.exports = mongoose.model('EventInvitation', eventInvitationSchema);
