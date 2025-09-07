const express = require('express');
const Event = require('../models/Event');
const EventInvitation = require('../models/EventInvitation');
const EventRSVP = require('../models/EventRSVP');
const GroupMembership = require('../models/GroupMembership');
const TopicSubscription = require('../models/TopicSubscription');
const auth = require('../middleware/auth');
const { eventValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Helper function to get events user can access
async function getEventsForUser(userId, query = {}, options = {}) {
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

  // Get events where user is invited
  const invitations = await EventInvitation.find({
    $or: [
      { inviteeType: 'user', inviteeId: userId },
      { inviteeType: 'group', inviteeId: { $in: userGroups } },
      { inviteeType: 'topic', inviteeId: { $in: userTopics } }
    ],
    isActive: true
  }).select('event');
  
  const invitedEventIds = invitations.map(inv => inv.event);

  // Combine query with access control
  const accessQuery = {
    $or: [
      { creator: userId }, // Events created by user
      { _id: { $in: invitedEventIds } }, // Events user is invited to
      { isPrivate: false } // Public events
    ]
  };

  const finalQuery = Object.keys(query).length > 0 ? { $and: [query, accessQuery] } : accessQuery;

  return Event.find(finalQuery, null, options)
    .populate('creator', 'firstName lastName profilePicture');
}

// @route   GET /api/event
// @desc    Get events for user's subscribed groups and topics
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, startDate, endDate, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    // Date filtering
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const events = await getEventsForUser(req.user._id, query, {
      limit: parseInt(limit),
      skip,
      sort: search ? { score: { $meta: 'textScore' } } : { startDate: 1 }
    });

    // Get RSVP status for each event
    const eventsWithRSVP = await Promise.all(events.map(async (event) => {
      const rsvp = await EventRSVP.findOne({
        event: event._id,
        user: req.user._id
      });

      return {
        ...event.toJSON(),
        userRSVP: rsvp ? rsvp.status : null
      };
    }));

    res.json({
      events: eventsWithRSVP,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: events.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/event/:event_id
// @desc    Get event by ID
// @access  Private
router.get('/:event_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id)
      .populate('creator', 'firstName lastName profilePicture');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check access if private event
    if (event.isPrivate && event.creator._id.toString() !== req.user._id.toString()) {
      // Check if user is invited
      const userMemberships = await GroupMembership.find({ 
        user: req.user._id, 
        isActive: true 
      }).select('group');
      const userGroups = userMemberships.map(m => m.group);

      const userSubscriptions = await TopicSubscription.find({ 
        user: req.user._id, 
        isActive: true 
      }).select('topic');
      const userTopics = userSubscriptions.map(s => s.topic);

      const invitation = await EventInvitation.findOne({
        event: event._id,
        $or: [
          { inviteeType: 'user', inviteeId: req.user._id },
          { inviteeType: 'group', inviteeId: { $in: userGroups } },
          { inviteeType: 'topic', inviteeId: { $in: userTopics } }
        ],
        isActive: true
      });

      if (!invitation) {
        return res.status(403).json({ message: 'Access denied to private event' });
      }
    }

    // Get user's RSVP status
    const rsvp = await EventRSVP.findOne({
      event: event._id,
      user: req.user._id
    });

    // Get attendee count by RSVP status
    const rsvpCounts = await EventRSVP.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const rsvpStats = {
      going: 0,
      maybe: 0,
      not_going: 0
    };

    rsvpCounts.forEach(item => {
      rsvpStats[item._id] = item.count;
    });

    res.json({
      event: {
        ...event.toJSON(),
        userRSVP: rsvp ? rsvp.status : null,
        rsvpStats,
        isCreator: event.creator._id.toString() === req.user._id.toString()
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event
// @desc    Create new event
// @access  Private
router.post('/', auth, eventValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      isVirtual,
      maxAttendees,
      invitedGroups,
      invitedTopics,
      invitedUsers,
      isPrivate = false
    } = req.body;

    const event = new Event({
      title,
      description,
      creator: req.user._id,
      date: new Date(date),
      location,
      isVirtual,
      maxAttendees,
      isPrivate
    });

    await event.save();

    // Create invitations in parallel
    const invitationPromises = [
      // Create group invitations
      ...(invitedGroups || []).map(groupId => 
        new EventInvitation({
          event: event._id,
          inviteeType: 'group',
          inviteeId: groupId,
          inviteeModel: 'Group',
          invitedBy: req.user._id
        }).save()
      ),
      // Create topic invitations
      ...(invitedTopics || []).map(topicId =>
        new EventInvitation({
          event: event._id,
          inviteeType: 'topic',
          inviteeId: topicId,
          inviteeModel: 'Topic',
          invitedBy: req.user._id
        }).save()
      ),
      // Create user invitations
      ...(invitedUsers || []).map(userId =>
        new EventInvitation({
          event: event._id,
          inviteeType: 'user',
          inviteeId: userId,
          inviteeModel: 'User',
          invitedBy: req.user._id
        }).save()
      )
    ];

    await Promise.all(invitationPromises);
    await event.populate('creator', 'firstName lastName profilePicture');

    res.status(201).json({
      message: 'Event created successfully',
      event,
      location: `/api/event/${event._id}`
    });
  } catch (error) {
    console.error('Create event error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/event/:event_id
// @desc    Update existing event
// @access  Private
router.put('/:event_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can update the event' });
    }

    const allowedUpdates = [
      'title', 'description', 'startDate', 'endDate', 'isAllDay',
      'location', 'category', 'maxAttendees', 'registrationRequired',
      'registrationDeadline', 'tags', 'image', 'status'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'startDate' || key === 'endDate' || key === 'registrationDeadline') {
          updates[key] = req.body[key] ? new Date(req.body[key]) : req.body[key];
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    // Validate dates if both are being updated
    if (updates.startDate && updates.endDate) {
      if (updates.endDate <= updates.startDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.event_id,
      updates,
      { new: true, runValidators: true }
    ).populate('creator', 'firstName lastName profilePicture');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event/:event_id/invite/group/:group_id
// @desc    Invite group to event
// @access  Private
router.post('/:event_id/invite/group/:group_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can send invitations' });
    }

    // Check if invitation already exists
    const existingInvitation = await EventInvitation.findOne({
      event: req.params.event_id,
      inviteeType: 'group',
      inviteeId: req.params.group_id
    });

    if (existingInvitation) {
      if (existingInvitation.isActive) {
        return res.status(400).json({ message: 'Group is already invited' });
      } else {
        existingInvitation.isActive = true;
        await existingInvitation.save();
      }
    } else {
      const invitation = new EventInvitation({
        event: req.params.event_id,
        inviteeType: 'group',
        inviteeId: req.params.group_id,
        inviteeModel: 'Group',
        invitedBy: req.user._id
      });
      await invitation.save();
    }

    res.status(201).json({
      message: 'Group invited successfully',
      location: `/api/event/${req.params.event_id}`
    });
  } catch (error) {
    console.error('Invite group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/event/:event_id/invite/group/:group_id
// @desc    Remove group invitation
// @access  Private
router.delete('/:event_id/invite/group/:group_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can remove invitations' });
    }

    await EventInvitation.findOneAndUpdate(
      {
        event: req.params.event_id,
        inviteeType: 'group',
        inviteeId: req.params.group_id
      },
      { isActive: false }
    );

    res.json({ message: 'Group invitation removed' });
  } catch (error) {
    console.error('Remove group invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event/:event_id/invite/topic/:topic_id
// @desc    Invite topic subscribers to event
// @access  Private
router.post('/:event_id/invite/topic/:topic_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can send invitations' });
    }

    const existingInvitation = await EventInvitation.findOne({
      event: req.params.event_id,
      inviteeType: 'topic',
      inviteeId: req.params.topic_id
    });

    if (existingInvitation) {
      if (existingInvitation.isActive) {
        return res.status(400).json({ message: 'Topic is already invited' });
      } else {
        existingInvitation.isActive = true;
        await existingInvitation.save();
      }
    } else {
      const invitation = new EventInvitation({
        event: req.params.event_id,
        inviteeType: 'topic',
        inviteeId: req.params.topic_id,
        inviteeModel: 'Topic',
        invitedBy: req.user._id
      });
      await invitation.save();
    }

    res.status(201).json({
      message: 'Topic subscribers invited successfully',
      location: `/api/event/${req.params.event_id}`
    });
  } catch (error) {
    console.error('Invite topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/event/:event_id/invite/topic/:topic_id
// @desc    Remove topic invitation
// @access  Private
router.delete('/:event_id/invite/topic/:topic_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can remove invitations' });
    }

    await EventInvitation.findOneAndUpdate(
      {
        event: req.params.event_id,
        inviteeType: 'topic',
        inviteeId: req.params.topic_id
      },
      { isActive: false }
    );

    res.json({ message: 'Topic invitation removed' });
  } catch (error) {
    console.error('Remove topic invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event/:event_id/invite/user/:user_id
// @desc    Invite user to event
// @access  Private
router.post('/:event_id/invite/user/:user_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can send invitations' });
    }

    const existingInvitation = await EventInvitation.findOne({
      event: req.params.event_id,
      inviteeType: 'user',
      inviteeId: req.params.user_id
    });

    if (existingInvitation) {
      if (existingInvitation.isActive) {
        return res.status(400).json({ message: 'User is already invited' });
      } else {
        existingInvitation.isActive = true;
        await existingInvitation.save();
      }
    } else {
      const invitation = new EventInvitation({
        event: req.params.event_id,
        inviteeType: 'user',
        inviteeId: req.params.user_id,
        inviteeModel: 'User',
        invitedBy: req.user._id
      });
      await invitation.save();
    }

    res.status(201).json({
      message: 'User invited successfully',
      location: `/api/event/${req.params.event_id}`
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/event/:event_id/invite/user/:user_id
// @desc    Remove user invitation
// @access  Private
router.delete('/:event_id/invite/user/:user_id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only event creator can remove invitations' });
    }

    await EventInvitation.findOneAndUpdate(
      {
        event: req.params.event_id,
        inviteeType: 'user',
        inviteeId: req.params.user_id
      },
      { isActive: false }
    );

    res.json({ message: 'User invitation removed' });
  } catch (error) {
    console.error('Remove user invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/event/:event_id/rsvp
// @desc    RSVP to event
// @access  Private
router.post('/:event_id/rsvp', auth, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }

    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is invited (unless it's a public event)
    if (event.isPrivate) {
      const userMemberships = await GroupMembership.find({ 
        user: req.user._id, 
        isActive: true 
      }).select('group');
      const userGroups = userMemberships.map(m => m.group);

      const userSubscriptions = await TopicSubscription.find({ 
        user: req.user._id, 
        isActive: true 
      }).select('topic');
      const userTopics = userSubscriptions.map(s => s.topic);

      const invitation = await EventInvitation.findOne({
        event: event._id,
        $or: [
          { inviteeType: 'user', inviteeId: req.user._id },
          { inviteeType: 'group', inviteeId: { $in: userGroups } },
          { inviteeType: 'topic', inviteeId: { $in: userTopics } }
        ],
        isActive: true
      });

      if (!invitation && event.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not invited to this event' });
      }
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if event is full (only for 'going' status)
    if (status === 'going' && event.maxAttendees) {
      const goingCount = await EventRSVP.countDocuments({
        event: event._id,
        status: 'going'
      });

      if (goingCount >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }

    // Update or create RSVP
    const existingRSVP = await EventRSVP.findOne({
      event: req.params.event_id,
      user: req.user._id
    });

    if (existingRSVP) {
      existingRSVP.status = status;
      existingRSVP.note = note || '';
      await existingRSVP.save();
    } else {
      const rsvp = new EventRSVP({
        event: req.params.event_id,
        user: req.user._id,
        status,
        note: note || ''
      });
      await rsvp.save();
    }

    // Update event attendee count
    const goingCount = await EventRSVP.countDocuments({
      event: event._id,
      status: 'going'
    });

    event.attendeeCount = goingCount;
    await event.save();

    res.status(201).json({
      message: 'RSVP updated successfully',
      status,
      location: `/api/event/${req.params.event_id}`
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/event/:event_id/attendees
// @desc    Get event attendees
// @access  Private
router.get('/:event_id/attendees', auth, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const event = await Event.findById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let query = { event: req.params.event_id };
    if (status && ['going', 'maybe', 'not_going'].includes(status)) {
      query.status = status;
    }

    const rsvps = await EventRSVP.find(query)
      .populate('user', 'firstName lastName profilePicture graduationYear course')
      .sort({ rsvpAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await EventRSVP.countDocuments(query);

    res.json({
      attendees: rsvps.map(rsvp => ({
        ...rsvp.user.toJSON(),
        rsvpStatus: rsvp.status,
        rsvpAt: rsvp.rsvpAt,
        note: rsvp.note
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
