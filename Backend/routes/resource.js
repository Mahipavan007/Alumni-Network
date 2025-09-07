const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resource = require('../models/Resource');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

// Get all resources (with filters and search)
router.get('/', auth, async (req, res) => {
  try {
    const {
      search,
      type,
      category,
      visibility,
      page = 1,
      limit = 10
    } = req.query;

    let query = { status: 'active' };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (visibility) {
      if (visibility === 'public') {
        query.visibility = 'public';
      } else if (visibility === 'private') {
        query.visibility = 'private';
        query.author = req.user.id;
      } else if (visibility === 'groups') {
        const userGroups = await Group.find({
          members: req.user.id
        }).select('_id');
        query.$or = [
          { visibility: 'public' },
          {
            visibility: 'groups',
            accessGroups: { $in: userGroups.map(g => g._id) }
          },
          { author: req.user.id }
        ];
      }
    }

    const skip = (page - 1) * limit;
    
    const resources = await Resource.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name profilePicture')
      .populate('accessGroups', 'name');

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured resources
router.get('/featured', auth, async (req, res) => {
  try {
    const resources = await Resource.getFeatured();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific resource
router.get('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate('accessGroups', 'name')
      .populate('comments.user', 'name profilePicture');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check access permissions
    if (resource.visibility === 'private' && resource.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (resource.visibility === 'groups') {
      const userGroups = await Group.find({ members: req.user.id }).select('_id');
      const hasAccess = resource.accessGroups.some(groupId => 
        userGroups.some(userGroup => userGroup._id.equals(groupId))
      );
      if (!hasAccess && resource.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Increment view count
    await resource.incrementViews();

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new resource
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      url,
      fileUrl,
      thumbnail,
      tags,
      visibility,
      accessGroups,
      metadata
    } = req.body;

    const resource = new Resource({
      title,
      description,
      type,
      category,
      url,
      fileUrl,
      thumbnail,
      tags,
      author: req.user.id,
      visibility,
      accessGroups,
      metadata
    });

    await resource.save();

    // Notify group members if resource is shared with groups
    if (visibility === 'groups' && accessGroups?.length) {
      const groupMembers = await Group.find({
        _id: { $in: accessGroups }
      }).distinct('members');

      const uniqueMembers = [...new Set(groupMembers)];
      const notifications = uniqueMembers
        .filter(memberId => memberId.toString() !== req.user.id)
        .map(memberId => ({
          recipient: memberId,
          type: 'resource_shared',
          title: 'New Resource Shared',
          content: `${req.user.name} shared a new resource: ${title}`,
          link: `/resources/${resource._id}`,
          relatedModel: 'Resource',
          relatedId: resource._id
        }));

      if (notifications.length) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a resource
router.patch('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      resource[key] = updates[key];
    });

    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a resource
router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await resource.remove();
    res.json({ message: 'Resource removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike a resource
router.post('/:id/like', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const liked = await resource.toggleLike(req.user.id);
    res.json({ liked });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const comment = await resource.addComment(req.user.id, req.body.content);
    const populatedComment = await Resource.populate(comment, {
      path: 'user',
      select: 'name profilePicture'
    });

    // Notify resource author if it's not their own comment
    if (resource.author.toString() !== req.user.id) {
      await Notification.createNotification({
        recipient: resource.author,
        type: 'resource_comment',
        title: 'New Comment on Your Resource',
        content: `${req.user.name} commented on your resource: ${resource.title}`,
        link: `/resources/${resource._id}`,
        relatedModel: 'Resource',
        relatedId: resource._id
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Track resource download
router.post('/:id/download', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await resource.incrementDownloads();
    res.json({ downloads: resource.downloads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
