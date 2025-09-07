const express = require('express');
const Topic = require('../models/Topic');
const TopicSubscription = require('../models/TopicSubscription');
const auth = require('../middleware/auth');
const { topicValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/topic
// @desc    Get all topics (with search, pagination)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const topics = await Topic.find(query)
      .populate('creator', 'firstName lastName profilePicture')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 });

    // Get user's subscriptions
    const userSubscriptions = await TopicSubscription.find({ 
      user: req.user._id, 
      isActive: true 
    }).select('topic');
    const subscribedTopicIds = userSubscriptions.map(s => s.topic.toString());

    // Add subscription info for each topic
    const topicsWithSubscription = topics.map(topic => ({
      ...topic.toJSON(),
      isSubscribed: subscribedTopicIds.includes(topic._id.toString())
    }));

    const total = await Topic.countDocuments(query);

    res.json({
      topics: topicsWithSubscription,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/topic/meta/categories
// @desc    Get available topic categories
// @access  Private
router.get('/meta/categories', auth, async (req, res) => {
  try {
    const categories = [
      { value: 'technology', label: 'Technology', icon: 'tech' },
      { value: 'business', label: 'Business', icon: 'business' },
      { value: 'career', label: 'Career', icon: 'career' },
      { value: 'education', label: 'Education', icon: 'education' },
      { value: 'lifestyle', label: 'Lifestyle', icon: 'lifestyle' },
      { value: 'entertainment', label: 'Entertainment', icon: 'entertainment' },
      { value: 'other', label: 'Other', icon: 'other' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get topic categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/topic/:topic_id
// @desc    Get topic by ID
// @access  Private
router.get('/:topic_id', auth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topic_id)
      .populate('creator', 'firstName lastName profilePicture');

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Get subscription info
    const subscription = await TopicSubscription.findOne({
      user: req.user._id,
      topic: topic._id,
      isActive: true
    });

    // Get recent subscribers (last 10)
    const recentSubscribers = await TopicSubscription.find({
      topic: topic._id,
      isActive: true
    })
    .populate('user', 'firstName lastName profilePicture')
    .sort({ subscribedAt: -1 })
    .limit(10);

    res.json({
      topic: {
        ...topic.toJSON(),
        isSubscribed: !!subscription,
        recentSubscribers: recentSubscribers.map(s => s.user)
      }
    });
  } catch (error) {
    console.error('Get topic error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid topic ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/topic
// @desc    Create new topic
// @access  Private
router.post('/', auth, topicValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, description, category, tags, color } = req.body;

    // Check if topic name already exists
    const existingTopic = await Topic.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingTopic) {
      return res.status(400).json({ message: 'A topic with this name already exists' });
    }

    const topic = new Topic({
      name,
      description,
      category: category || 'other',
      tags: tags || [],
      color: color || '#1976d2',
      creator: req.user._id
    });

    await topic.save();

    // Create initial subscription for creator
    const subscription = new TopicSubscription({
      user: req.user._id,
      topic: topic._id
    });

    await subscription.save();

    // Populate creator info
    await topic.populate('creator', 'firstName lastName profilePicture');

    res.status(201).json({
      message: 'Topic created successfully',
      topic: {
        ...topic.toJSON(),
        isSubscribed: true
      }
    });
  } catch (error) {
    console.error('Create topic error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/topic/:topic_id/join
// @desc    Subscribe to a topic
// @access  Private
router.post('/:topic_id/join', auth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topic_id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user is already subscribed
    const existingSubscription = await TopicSubscription.findOne({
      user: req.user._id,
      topic: topic._id
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({ message: 'You are already subscribed to this topic' });
      } else {
        // Reactivate subscription
        existingSubscription.isActive = true;
        existingSubscription.subscribedAt = new Date();
        await existingSubscription.save();
      }
    } else {
      // Create new subscription
      const subscription = new TopicSubscription({
        user: req.user._id,
        topic: topic._id
      });
      await subscription.save();
    }

    // Update subscriber count
    topic.subscriberCount = await TopicSubscription.countDocuments({
      topic: topic._id,
      isActive: true
    });
    await topic.save();

    res.status(201).json({
      message: 'Successfully subscribed to topic',
      location: `/api/topic/${topic._id}`
    });
  } catch (error) {
    console.error('Subscribe to topic error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid topic ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/topic/:topic_id/unsubscribe
// @desc    Unsubscribe from a topic
// @access  Private
router.delete('/:topic_id/unsubscribe', auth, async (req, res) => {
  try {
    const subscription = await TopicSubscription.findOne({
      user: req.user._id,
      topic: req.params.topic_id,
      isActive: true
    });

    if (!subscription) {
      return res.status(400).json({ message: 'You are not subscribed to this topic' });
    }

    subscription.isActive = false;
    await subscription.save();

    // Update subscriber count
    const topic = await Topic.findById(req.params.topic_id);
    if (topic) {
      topic.subscriberCount = await TopicSubscription.countDocuments({
        topic: topic._id,
        isActive: true
      });
      await topic.save();
    }

    res.json({ message: 'Successfully unsubscribed from topic' });
  } catch (error) {
    console.error('Unsubscribe from topic error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid topic ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/topic/:topic_id/subscribers
// @desc    Get topic subscribers
// @access  Private
router.get('/:topic_id/subscribers', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const topic = await Topic.findById(req.params.topic_id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const subscribers = await TopicSubscription.find({
      topic: req.params.topic_id,
      isActive: true
    })
    .populate('user', 'firstName lastName profilePicture graduationYear course location')
    .sort({ subscribedAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    const total = await TopicSubscription.countDocuments({
      topic: req.params.topic_id,
      isActive: true
    });

    res.json({
      subscribers: subscribers.map(s => ({
        ...s.user.toJSON(),
        subscribedAt: s.subscribedAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get topic subscribers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
