const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validatePortfolioItem = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').isIn(['project', 'research', 'publication', 'presentation', 'other']),
  body('technologies').isArray(),
  body('url').optional().isURL().withMessage('Must be a valid URL'),
  body('githubUrl').optional().isURL().withMessage('Must be a valid GitHub URL'),
  body('startDate').optional().isISO8601().withMessage('Must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('Must be a valid date'),
  body('isOngoing').optional().isBoolean(),
  body('images').isArray()
];

const validateExperience = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601(),
  body('type').isIn(['full-time', 'part-time', 'internship', 'freelance', 'contract'])
];

const validateSkillEndorsement = [
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters')
];

const validateEducation = [
  body('institution').trim().notEmpty().withMessage('Institution is required'),
  body('degree').trim().notEmpty().withMessage('Degree is required'),
  body('field').trim().notEmpty().withMessage('Field of study is required'),
  body('startYear').isInt({ min: 1950, max: new Date().getFullYear() + 10 })
];

const validateSkill = [
  body('name').trim().notEmpty().withMessage('Skill name is required'),
  body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('category').isIn(['technical', 'soft', 'language', 'other'])
];

const validateAchievement = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['award', 'certification', 'publication', 'project', 'other']),
  body('date').optional().isISO8601()
];

// Portfolio Routes
router.post('/portfolio', [auth, ...validatePortfolioItem], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    user.portfolio.push(req.body);
    await user.save();

    res.json({ portfolio: user.portfolio });
  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/portfolio/:itemId', [auth, ...validatePortfolioItem], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const portfolioItem = user.portfolio.id(req.params.itemId);
    
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    Object.assign(portfolioItem, req.body);
    await user.save();

    res.json({ portfolio: user.portfolio });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/portfolio/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.portfolio.pull(req.params.itemId);
    await user.save();

    res.json({ portfolio: user.portfolio });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Experience Routes
router.post('/experience', [auth, ...validateExperience], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    user.experience.push(req.body);
    await user.save();

    res.json({ experience: user.experience });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/experience/:expId', [auth, ...validateExperience], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const experience = user.experience.id(req.params.expId);
    
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    Object.assign(experience, req.body);
    await user.save();

    res.json({ experience: user.experience });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/experience/:expId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.experience.pull(req.params.expId);
    await user.save();

    res.json({ experience: user.experience });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Skill Endorsement Route
router.post('/skills/:skillId/endorse', [auth, ...validateSkillEndorsement], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skill = user.skills.id(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Check if user has already endorsed this skill
    if (skill.endorsements.some(e => e.endorser.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already endorsed this skill' });
    }

    skill.endorsements.push({
      endorser: req.user._id,
      note: req.body.note
    });

    await user.save();
    
    // Return the updated skill with populated endorser information
    const populatedUser = await User.findById(user._id)
      .populate('skills.endorsements.endorser', 'firstName lastName profilePicture');
    
    res.json({ 
      skill: populatedUser.skills.id(req.params.skillId)
    });
  } catch (error) {
    console.error('Endorse skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Education Routes
router.post('/education', [auth, ...validateEducation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    user.education.push(req.body);
    await user.save();

    res.json({ education: user.education });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/education/:eduId', [auth, ...validateEducation], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const education = user.education.id(req.params.eduId);
    
    if (!education) {
      return res.status(404).json({ message: 'Education not found' });
    }

    Object.assign(education, req.body);
    await user.save();

    res.json({ education: user.education });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/education/:eduId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.education.pull(req.params.eduId);
    await user.save();

    res.json({ education: user.education });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Skills Routes
router.post('/skills', [auth, ...validateSkill], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    user.skills.push(req.body);
    await user.save();

    res.json({ skills: user.skills });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:userId/skills/:skillId/endorse', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const skill = user.skills.id(req.params.skillId);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Check if user has already endorsed
    const existingEndorsement = skill.endorsements.find(
      e => e.endorser.toString() === req.user._id.toString()
    );

    if (existingEndorsement) {
      return res.status(400).json({ message: 'Already endorsed this skill' });
    }

    skill.endorsements.push({
      endorser: req.user._id,
      note: req.body.note
    });

    await user.save();
    res.json({ skills: user.skills });
  } catch (error) {
    console.error('Endorse skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Achievements Routes
router.post('/achievements', [auth, ...validateAchievement], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    user.achievements.push(req.body);
    await user.save();

    res.json({ achievements: user.achievements });
  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile Settings Routes
router.patch('/availability', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.availability = { ...user.availability, ...req.body };
    await user.save();
    res.json({ availability: user.availability });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/privacy', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.preferences = { ...user.preferences, ...req.body };
    await user.save();
    res.json({ preferences: user.preferences });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Media Upload Routes
router.post('/profile-picture', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/cover-picture', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    user.coverPicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ coverPicture: user.coverPicture });
  } catch (error) {
    console.error('Upload cover picture error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
