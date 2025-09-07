const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

// Get all mentorships for the authenticated user (as either mentor or mentee)
router.get('/', auth, async (req, res) => {
  try {
    const mentorships = await Mentorship.find({
      $or: [
        { mentor: req.user.id },
        { mentee: req.user.id }
      ]
    }).populate('mentor mentee', 'name email profilePicture');
    
    res.json(mentorships);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request a new mentorship
router.post('/request', auth, async (req, res) => {
  try {
    const {
      mentorId,
      goals,
      focusAreas,
      startDate,
      endDate,
      meetingFrequency
    } = req.body;

    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Check for existing active mentorship
    const existingMentorship = await Mentorship.findOne({
      mentor: mentorId,
      mentee: req.user.id,
      status: 'active'
    });

    if (existingMentorship) {
      return res.status(400).json({ message: 'Active mentorship already exists' });
    }

    const mentorship = new Mentorship({
      mentor: mentorId,
      mentee: req.user.id,
      goals: goals.map(goal => ({ description: goal })),
      focusAreas,
      startDate,
      endDate,
      meetingFrequency
    });

    await mentorship.save();
    res.status(201).json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mentorship status (accept/reject/complete/cancel)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Verify user is either mentor or mentee
    if (mentorship.mentor.toString() !== req.user.id && 
        mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    mentorship.status = status;
    if (status === 'cancelled') {
      mentorship.terminationReason = {
        reason: req.body.reason,
        requestedBy: req.user.id,
        requestedAt: new Date()
      };
    }

    await mentorship.save();
    res.json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add progress update
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id && 
        mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const {
      notes,
      achievements,
      challenges,
      nextSteps,
      mentorFeedback,
      menteeFeedback
    } = req.body;

    mentorship.progress.push({
      notes,
      achievements,
      challenges,
      nextSteps,
      mentorFeedback,
      menteeFeedback
    });

    await mentorship.save();
    res.status(201).json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Schedule next meeting
router.post('/:id/meeting', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id && 
        mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { date, agenda, link } = req.body;
    mentorship.nextMeeting = { date, agenda, link };
    await mentorship.save();
    res.json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add resource
router.post('/:id/resources', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id && 
        mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, type, url } = req.body;
    mentorship.resources.push({
      title,
      type,
      url,
      addedBy: req.user.id
    });

    await mentorship.save();
    res.status(201).json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit feedback
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id && 
        mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { rating, comment } = req.body;
    const isMentor = mentorship.mentor.toString() === req.user.id;

    if (isMentor) {
      mentorship.feedback.mentorRating = {
        rating,
        comment,
        givenAt: new Date()
      };
    } else {
      mentorship.feedback.menteeRating = {
        rating,
        comment,
        givenAt: new Date()
      };
    }

    await mentorship.save();
    res.json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Issue certificate
router.post('/:id/certificates', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Only mentors can issue certificates
    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { type, title, description, url } = req.body;
    mentorship.certificates.push({
      type,
      title,
      description,
      url
    });

    await mentorship.save();
    res.status(201).json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Log communication
router.post('/:id/communications', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id && 
        mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { type, summary, duration } = req.body;
    mentorship.communications.push({
      type,
      summary,
      duration
    });

    await mentorship.save();
    res.status(201).json(mentorship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
