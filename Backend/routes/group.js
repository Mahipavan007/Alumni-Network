const express = require('express');
const Group = require('../models/Group');
const GroupMembership = require('../models/GroupMembership');
const auth = require('../middleware/auth');
const { groupValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/group
// @desc    Get all groups (with search, pagination)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};
    
    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Get user's group memberships
    const userMemberships = await GroupMembership.find({ 
      user: req.user._id, 
      isActive: true 
    }).select('group');
    const userGroupIds = userMemberships.map(m => m.group.toString());

    // For private groups, only show ones the user is a member of
    query.$or = [
      { isPrivate: false },
      { _id: { $in: userGroupIds } }
    ];

    const groups = await Group.find(query)
      .populate('creator', 'firstName lastName profilePicture')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 });

    // Add membership info for each group
    const groupsWithMembership = await Promise.all(groups.map(async (group) => {
      const isMember = userGroupIds.includes(group._id.toString());
      const membership = isMember ? await GroupMembership.findOne({ 
        user: req.user._id, 
        group: group._id 
      }).select('role') : null;

      return {
        ...group.toJSON(),
        isMember,
        userRole: membership ? membership.role : null
      };
    }));

    const total = await Group.countDocuments(query);

    res.json({
      groups: groupsWithMembership,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/group/:group_id
// @desc    Get group by ID
// @access  Private
router.get('/:group_id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.group_id)
      .populate('creator', 'firstName lastName profilePicture');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can access private group
    if (group.isPrivate) {
      const membership = await GroupMembership.findOne({
        user: req.user._id,
        group: group._id,
        isActive: true
      });

      if (!membership) {
        return res.status(403).json({ message: 'Access denied to private group' });
      }
    }

    // Get membership info
    const membership = await GroupMembership.findOne({
      user: req.user._id,
      group: group._id,
      isActive: true
    });

    // Get recent members (last 10)
    const recentMembers = await GroupMembership.find({
      group: group._id,
      isActive: true
    })
    .populate('user', 'firstName lastName profilePicture')
    .sort({ joinedAt: -1 })
    .limit(10);

    res.json({
      group: {
        ...group.toJSON(),
        isMember: !!membership,
        userRole: membership ? membership.role : null,
        recentMembers: recentMembers.map(m => m.user)
      }
    });
  } catch (error) {
    console.error('Get group error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid group ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/group
// @desc    Create new group
// @access  Private
router.post('/', auth, groupValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, description, isPrivate, category, tags, rules } = req.body;

    // Check if group name already exists
    const existingGroup = await Group.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingGroup) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    const group = new Group({
      name,
      description,
      isPrivate: isPrivate || false,
      category: category || 'other',
      tags: tags || [],
      rules: rules || '',
      creator: req.user._id
    });

    await group.save();

    // Create initial membership for creator
    const membership = new GroupMembership({
      user: req.user._id,
      group: group._id,
      role: 'admin'
    });

    await membership.save();

    // Populate creator info
    await group.populate('creator', 'firstName lastName profilePicture');

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...group.toJSON(),
        isMember: true,
        userRole: 'admin'
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/group/:group_id/join
// @desc    Join a group
// @access  Private
router.post('/:group_id/join', auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    const targetUserId = user_id || req.user._id;

    const group = await Group.findById(req.params.group_id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if it's a private group and user has permission
    if (group.isPrivate && targetUserId !== req.user._id.toString()) {
      const requesterMembership = await GroupMembership.findOne({
        user: req.user._id,
        group: group._id,
        isActive: true
      });

      if (!requesterMembership || !['admin', 'moderator'].includes(requesterMembership.role)) {
        return res.status(403).json({ message: 'Permission denied to add members to private group' });
      }
    }

    // Check if user is already a member
    const existingMembership = await GroupMembership.findOne({
      user: targetUserId,
      group: group._id
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        return res.status(400).json({ message: 'User is already a member of this group' });
      } else {
        // Reactivate membership
        existingMembership.isActive = true;
        existingMembership.joinedAt = new Date();
        await existingMembership.save();
      }
    } else {
      // Create new membership
      const membership = new GroupMembership({
        user: targetUserId,
        group: group._id,
        role: 'member'
      });
      await membership.save();
    }

    // Update member count
    group.memberCount = await GroupMembership.countDocuments({
      group: group._id,
      isActive: true
    });
    await group.save();

    res.status(201).json({
      message: 'Successfully joined group',
      location: `/api/group/${group._id}`
    });
  } catch (error) {
    console.error('Join group error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid group ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/group/:group_id/leave
// @desc    Leave a group
// @access  Private
router.delete('/:group_id/leave', auth, async (req, res) => {
  try {
    const membership = await GroupMembership.findOne({
      user: req.user._id,
      group: req.params.group_id,
      isActive: true
    });

    if (!membership) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Check if user is the last admin
    if (membership.role === 'admin') {
      const adminCount = await GroupMembership.countDocuments({
        group: req.params.group_id,
        role: 'admin',
        isActive: true
      });

      if (adminCount === 1) {
        return res.status(400).json({ 
          message: 'Cannot leave group as the last admin. Please promote another member to admin first.' 
        });
      }
    }

    membership.isActive = false;
    await membership.save();

    // Update member count
    const group = await Group.findById(req.params.group_id);
    if (group) {
      group.memberCount = await GroupMembership.countDocuments({
        group: group._id,
        isActive: true
      });
      await group.save();
    }

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid group ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/group/:group_id/members
// @desc    Get group members
// @access  Private
router.get('/:group_id/members', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const group = await Group.findById(req.params.group_id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check access for private groups
    if (group.isPrivate) {
      const membership = await GroupMembership.findOne({
        user: req.user._id,
        group: group._id,
        isActive: true
      });

      if (!membership) {
        return res.status(403).json({ message: 'Access denied to private group' });
      }
    }

    const members = await GroupMembership.find({
      group: req.params.group_id,
      isActive: true
    })
    .populate('user', 'firstName lastName profilePicture graduationYear course location')
    .sort({ role: 1, joinedAt: 1 })
    .limit(parseInt(limit))
    .skip(skip);

    const total = await GroupMembership.countDocuments({
      group: req.params.group_id,
      isActive: true
    });

    res.json({
      members: members.map(m => ({
        ...m.user.toJSON(),
        role: m.role,
        joinedAt: m.joinedAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
