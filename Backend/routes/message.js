const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation middleware
const messageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('attachments.*.type')
    .optional()
    .isIn(['image', 'document', 'link'])
    .withMessage('Invalid attachment type')
];

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation
      .find({ 
        participants: req.user._id,
        isActive: true
      })
      .populate('participants', 'firstName lastName profilePicture')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    // Format conversations for response
    const formattedConversations = conversations.map(conv => {
      const otherParticipants = conv.participants.filter(
        p => p._id.toString() !== req.user._id.toString()
      );
      
      const unreadCount = conv.unreadCounts.find(
        uc => uc.participant.toString() === req.user._id.toString()
      )?.count || 0;

      return {
        _id: conv._id,
        participants: otherParticipants,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'firstName lastName profilePicture');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const { before = Date.now(), limit = 50 } = req.query;

    const messages = await Message.find({
      conversation: req.params.conversationId,
      createdAt: { $lt: new Date(before) }
    })
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mark messages as read
    const unreadMessages = messages.filter(
      msg => msg.sender._id.toString() !== req.user._id.toString() &&
      !msg.readBy.some(r => r.user.toString() === req.user._id.toString())
    );

    if (unreadMessages.length > 0) {
      await Promise.all([
        // Add read receipts to messages
        ...unreadMessages.map(msg => msg.addReadReceipt(req.user._id)),
        // Reset unread count in conversation
        conversation.resetUnreadCount(req.user._id)
      ]);
    }

    res.json({
      conversation: {
        _id: conversation._id,
        participants: conversation.participants
      },
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/conversation
// @desc    Start new conversation
// @access  Private
router.post('/conversation', auth, async (req, res) => {
  try {
    const { participantId } = req.body;

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { 
        $all: [req.user._id, participantId],
        $size: 2
      },
      isActive: true
    });

    if (existingConversation) {
      return res.json({ conversation: existingConversation });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.user._id, participantId]
    });

    await conversation.save();
    await conversation.populate('participants', 'firstName lastName profilePicture');

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:conversationId
// @desc    Send message in conversation
// @access  Private
router.post('/:conversationId', 
  auth,
  messageValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { content, attachments } = req.body;
      
      const conversation = await Conversation.findById(req.params.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Check if user is a participant
      if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
      }

      const message = new Message({
        conversation: conversation._id,
        sender: req.user._id,
        content,
        attachments: attachments || []
      });

      await message.save();
      await message.populate('sender', 'firstName lastName profilePicture');

      // Update conversation
      conversation.lastMessage = message._id;
      await conversation.updateUnreadCount(req.user._id);

      res.status(201).json({ message });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/messages/:messageId
// @desc    Edit message
// @access  Private
router.put('/:messageId', auth, messageValidation, handleValidationErrors, async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = await Message.findById(req.params.messageId)
      .populate('sender', 'firstName lastName profilePicture');
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    await message.updateContent(content);
    res.json({ message });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.remove();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
