const express = require('express');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Topic = require('../models/Topic');
const User = require('../models/User');
const GroupMembership = require('../models/GroupMembership');
const TopicSubscription = require('../models/TopicSubscription');
const auth = require('../middleware/auth');
const { postValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Helper function to check if user can post to target
async function canPostToTarget(userId, targetType, targetId) {
  switch (targetType) {
    case 'user':
      // Can always send direct messages
      return true;
    case 'group':
      const membership = await GroupMembership.findOne({
        user: userId,
        group: targetId,
        isActive: true
      });
      return !!membership;
    case 'topic':
      const subscription = await TopicSubscription.findOne({
        user: userId,
        topic: targetId,
        isActive: true
      });
      return !!subscription;
    default:
      return false;
  }
}

// Helper function to get posts with user access check
async function getPostsForUser(userId, query, options = {}) {
  // Get user's groups and topics
  const userMemberships = await GroupMembership.find({ 
    user: userId, 
    isActive: true 
  }).select('group');
  const userGroups = userMemberships.map(m => m.group);

  const userSubscriptions = await TopicSubscription.find({ 
    user: userId, 
    isActive: true 
  }).select('topic');
  const userTopics = userSubscriptions.map(s => s.topic);

  // Build access query
  const accessQuery = {
    $or: [
      { targetType: 'user', targetId: userId }, // Direct messages to user
      { targetType: 'group', targetId: { $in: userGroups } },
      { targetType: 'topic', targetId: { $in: userTopics } }
    ]
  };

  // Combine with provided query
  const finalQuery = query ? { $and: [query, accessQuery] } : accessQuery;

  return Post.find(finalQuery, null, options)
    .populate('author', 'firstName lastName profilePicture')
    .populate({
      path: 'targetId',
      select: 'name firstName lastName'
    });
}

// @route   GET /api/post
// @desc    Get timeline posts for user's subscribed groups and topics
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { isReply: false }; // Only top-level posts for timeline
    
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await getPostsForUser(req.user._id, query, {
      limit: parseInt(limit),
      skip,
      sort: search ? { score: { $meta: 'textScore' } } : { lastUpdated: -1 }
    });

    // Get reply counts for each post
    const postsWithReplies = await Promise.all(posts.map(async (post) => {
      const replyCount = await Post.countDocuments({ threadRoot: post._id });
      return {
        ...post.toJSON(),
        replyCount
      };
    }));

    res.json({
      posts: postsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/post/user
// @desc    Get direct messages to current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { 
      targetType: 'user',
      targetId: req.user._id,
      isReply: false
    };
    
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(search ? { score: { $meta: 'textScore' } } : { lastUpdated: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/post/user/:user_id
// @desc    Get conversation with specific user
// @access  Private
router.get('/user/:user_id', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { 
          targetType: 'user',
          targetId: req.user._id,
          author: req.params.user_id
        },
        {
          targetType: 'user',
          targetId: req.params.user_id,
          author: req.user._id
        }
      ],
      isReply: false
    };

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/post/group/:group_id
// @desc    Get posts for specific group
// @access  Private
router.get('/group/:group_id', auth, async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if user is member of group
    const membership = await GroupMembership.findOne({
      user: req.user._id,
      group: req.params.group_id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'You must be a member to view group posts' });
    }

    let query = { 
      targetType: 'group',
      targetId: req.params.group_id,
      isReply: false
    };
    
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(search ? { score: { $meta: 'textScore' } } : { lastUpdated: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get group posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/post/topic/:topic_id
// @desc    Get posts for specific topic
// @access  Private
router.get('/topic/:topic_id', auth, async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if user is subscribed to topic
    const subscription = await TopicSubscription.findOne({
      user: req.user._id,
      topic: req.params.topic_id,
      isActive: true
    });

    if (!subscription) {
      return res.status(403).json({ message: 'You must be subscribed to view topic posts' });
    }

    let query = { 
      targetType: 'topic',
      targetId: req.params.topic_id,
      isReply: false
    };
    
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(search ? { score: { $meta: 'textScore' } } : { lastUpdated: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get topic posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/post/:post_id/thread
// @desc    Get post thread (post and all replies)
// @access  Private
router.get('/:post_id/thread', auth, async (req, res) => {
  try {
    // Get the root post
    const rootPost = await Post.findById(req.params.post_id)
      .populate('author', 'firstName lastName profilePicture')
      .populate({
        path: 'targetId',
        select: 'name firstName lastName'
      });

    if (!rootPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check access to the post
    const canAccess = await canPostToTarget(req.user._id, rootPost.targetType, rootPost.targetId);
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all replies in the thread
    const replies = await Post.find({ 
      threadRoot: rootPost.isReply ? rootPost.threadRoot : rootPost._id 
    })
      .populate('author', 'firstName lastName profilePicture')
      .sort({ createdAt: 1 });

    res.json({
      rootPost,
      replies,
      totalReplies: replies.length
    });
  } catch (error) {
    console.error('Get post thread error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/post
// @desc    Create new post
// @access  Private
router.post('/', auth, postValidation, handleValidationErrors, async (req, res) => {
  try {
    const { title, body, targetType, targetId, parentPost, tags } = req.body;

    // Validate target model
    let targetModel;
    switch (targetType) {
      case 'user':
        targetModel = 'User';
        break;
      case 'group':
        targetModel = 'Group';
        break;
      case 'topic':
        targetModel = 'Topic';
        break;
      default:
        return res.status(400).json({ message: 'Invalid target type' });
    }

    // Check if user can post to target
    const canPost = await canPostToTarget(req.user._id, targetType, targetId);
    if (!canPost) {
      return res.status(403).json({ message: 'You do not have permission to post to this target' });
    }

    let threadRoot = null;
    let isReply = false;

    // Handle reply logic
    if (parentPost) {
      const parent = await Post.findById(parentPost);
      if (!parent) {
        return res.status(400).json({ message: 'Parent post not found' });
      }
      
      threadRoot = parent.threadRoot || parent._id;
      isReply = true;

      // Update parent's reply count
      await Post.findByIdAndUpdate(parent._id, { $inc: { replyCount: 1 } });
    }

    const post = new Post({
      title,
      body,
      author: req.user._id,
      targetType,
      targetId,
      targetModel,
      parentPost: parentPost || null,
      threadRoot,
      isReply,
      tags: tags || []
    });

    await post.save();

    // Populate author and target info
    await post.populate('author', 'firstName lastName profilePicture');
    await post.populate({
      path: 'targetId',
      select: 'name firstName lastName'
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
      location: `/api/post/${post._id}`
    });
  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/post/:post_id
// @desc    Update existing post
// @access  Private
router.put('/:post_id', auth, async (req, res) => {
  try {
    const { title, body, tags } = req.body;

    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    // Don't allow changing audience (as per SRS)
    if (req.body.targetType || req.body.targetId) {
      return res.status(403).json({ message: 'Cannot change post audience after creation' });
    }

    // Store original content for edit history
    if (body && body !== post.body) {
      post.editHistory.push({
        editedAt: new Date(),
        originalBody: post.body
      });
      post.isEdited = true;
    }

    // Update allowed fields
    if (title) post.title = title;
    if (body) post.body = body;
    if (tags) post.tags = tags;

    post.lastUpdated = new Date();
    await post.save();

    await post.populate('author', 'firstName lastName profilePicture');
    await post.populate({
      path: 'targetId',
      select: 'name firstName lastName'
    });

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/post/:post_id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:post_id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check access to the post
    const canAccess = await canPostToTarget(req.user._id, post.targetType, post.targetId);
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const existingLike = post.likes.find(like => 
      like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(like => 
        like.user.toString() !== req.user._id.toString()
      );
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      // Like
      post.likes.push({ user: req.user._id });
      post.likeCount += 1;
    }

    await post.save();

    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      likeCount: post.likeCount,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
