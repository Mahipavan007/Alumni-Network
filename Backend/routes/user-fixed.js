const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/user
// @desc    Get current user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { course: searchRegex },
        { location: searchRegex }
      ]
    })
    .select('-password')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ lastName: 1, firstName: 1 });

    const total = await User.countDocuments({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { course: searchRegex },
        { location: searchRegex }
      ]
    });

    res.json({
      users: users.map(user => user.toJSON()),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user/:user_id
// @desc    Get user by ID
// @access  Private
router.get('/:user_id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.user_id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: user.toJSON()
    });
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
