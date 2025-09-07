const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get recent notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.getRecent(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notifications count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.post('/read/all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.remove();
    res.json({ message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
      type: req.params.type
    })
      .sort({ createdAt: -1 })
      .populate('recipient', 'name email profilePicture');
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications for a specific related model
router.get('/related/:model/:id', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
      relatedModel: req.params.model,
      relatedId: req.params.id
    })
      .sort({ createdAt: -1 })
      .populate('recipient', 'name email profilePicture');
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
