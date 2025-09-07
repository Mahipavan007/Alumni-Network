const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const GroupMembership = require('../models/GroupMembership');
const TopicSubscription = require('../models/TopicSubscription');
const Group = require('../models/Group');
const Topic = require('../models/Topic');
const Event = require('../models/Event');
const EventRSVP = require('../models/EventRSVP');
const router = express.Router();

// @route   GET /api/user/groups
// @desc    Get groups the user is a member of
// @access  Private
router.get('/groups', auth, async (req, res) => {
  try {
    const memberships = await GroupMembership.find({ user: req.user._id, isActive: true }).populate('group');
    const groups = memberships.map(m => m.group);
    res.json({ groups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/topics
// @desc    Get topics the user is subscribed to
// @access  Private
router.get('/topics', auth, async (req, res) => {
  try {
    const subscriptions = await TopicSubscription.find({ user: req.user._id, isActive: true }).populate('topic');
    const topics = subscriptions.map(s => s.topic);
    res.json({ topics });
  } catch (error) {
    console.error('Get user topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/events
// @desc    Get events the user is invited to or created
// @access  Private
router.get('/events', auth, async (req, res) => {
  try {
    // Events created by user
    const createdEvents = await Event.find({ creator: req.user._id });
    // Events user RSVP'd to
    const rsvps = await EventRSVP.find({ user: req.user._id }).populate('event');
    const rsvpEvents = rsvps.map(r => r.event);
    // Merge and deduplicate
    const eventsMap = new Map();
    createdEvents.forEach(e => eventsMap.set(e._id.toString(), e));
    rsvpEvents.forEach(e => e && eventsMap.set(e._id.toString(), e));
    res.json({ events: Array.from(eventsMap.values()) });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/rsvps
// @desc    Get RSVPs for the user
// @access  Private
router.get('/rsvps', auth, async (req, res) => {
  try {
    const rsvps = await EventRSVP.find({ user: req.user._id }).populate('event');
    res.json({ rsvps });
  } catch (error) {
    console.error('Get user RSVPs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/:user_id
// @desc    Get user by ID
// @access  Private
router.get('/:user_id', auth, async (req, res) => {
  try {
// @route   GET /api/user/groups
// @desc    Get groups the user is a member of
// @access  Private
router.get('/groups', auth, async (req, res) => {
  try {
    const memberships = await GroupMembership.find({ user: req.user._id, isActive: true }).populate('group');
    const groups = memberships.map(m => m.group);
    res.json({ groups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/topics
// @desc    Get topics the user is subscribed to
// @access  Private
router.get('/topics', auth, async (req, res) => {
  try {
    const subscriptions = await TopicSubscription.find({ user: req.user._id, isActive: true }).populate('topic');
    const topics = subscriptions.map(s => s.topic);
    res.json({ topics });
  } catch (error) {
    console.error('Get user topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/events
// @desc    Get events the user is invited to or created
// @access  Private
router.get('/events', auth, async (req, res) => {
  try {
    // Events created by user
    const createdEvents = await Event.find({ creator: req.user._id });
    // Events user RSVP'd to
    const rsvps = await EventRSVP.find({ user: req.user._id }).populate('event');
    const rsvpEvents = rsvps.map(r => r.event);
    // Merge and deduplicate
    const eventsMap = new Map();
    createdEvents.forEach(e => eventsMap.set(e._id.toString(), e));
    rsvpEvents.forEach(e => e && eventsMap.set(e._id.toString(), e));
    res.json({ events: Array.from(eventsMap.values()) });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/rsvps
// @desc    Get RSVPs for the user
// @access  Private
router.get('/rsvps', auth, async (req, res) => {
  try {
    const rsvps = await EventRSVP.find({ user: req.user._id }).populate('event');
    res.json({ rsvps });
  } catch (error) {
    console.error('Get user RSVPs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
    const user = await User.findById(req.params.user_id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // SRS: 303 redirect to /api/user/:own_user_id
      return res.status(303).set('Location', `/api/user/${user._id}`).send();
  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/user/:user_id
// @desc    Update user profile
// @access  Private
router.patch('/:user_id', auth, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('workStatus').optional().isLength({ max: 200 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('funFact').optional().isLength({ max: 300 }),
  body('graduationYear').optional().isInt({ min: 1950, max: new Date().getFullYear() + 10 }),
  body('course').optional().trim(),
  body('location').optional().trim(),
  body('linkedIn').optional().isURL().withMessage('LinkedIn must be a valid URL'),
  body('github').optional().isURL().withMessage('GitHub must be a valid URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user can only update their own profile
    if (req.params.user_id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'profilePicture', 'workStatus', 'bio', 
      'funFact', 'graduationYear', 'course', 'location', 'linkedIn', 
      'github', 'website'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.user_id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
