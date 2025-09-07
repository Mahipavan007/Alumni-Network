const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const GroupMembership = require('../models/GroupMembership');
const TopicSubscription = require('../models/TopicSubscription');
const Post = require('../models/Post');
const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('skills.endorsements.endorser', 'firstName lastName profilePicture')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    // Get user's posts count and other data in parallel
    const [postsCount, memberships, subscriptions] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      GroupMembership.find({ user: user._id, isActive: true })
        .populate('group', 'name description memberCount')
        .lean(),
      TopicSubscription.find({ user: user._id, isActive: true })
        .populate('topic', 'name description followerCount')
        .lean()
    ]);

    res.json({
      success: true,
      user: {
        ...user,
        postsCount,
        groups: memberships.map(m => m.group) || [],
        topics: subscriptions.map(s => s.topic) || []
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/user/:id/profile
// @desc    Get user profile by ID
// @access  Private
router.get('/:id/profile', auth, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.redirect('/api/user/profile');
    }

    const user = await User.findById(req.params.id)
      .select('-password -email')  // Exclude sensitive info for other users
      .populate('skills.endorsements.endorser', 'firstName lastName profilePicture')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    // Get user's posts count and other data in parallel
    const [postsCount, memberships, subscriptions] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      GroupMembership.find({ user: user._id, isActive: true })
        .populate('group', 'name description memberCount')
        .lean(),
      TopicSubscription.find({ user: user._id, isActive: true })
        .populate('topic', 'name description followerCount')
        .lean()
    ]);

    res.json({
      success: true,
      user: {
        ...user,
        postsCount,
        groups: memberships.map(m => m.group) || [],
        topics: subscriptions.map(s => s.topic) || []
      }
    });

  } catch (error) {
    console.error('Get profile by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found'
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
