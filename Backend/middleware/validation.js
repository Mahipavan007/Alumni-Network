const { body, validationResult } = require('express-validator');

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('body')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Post body must be between 1 and 10000 characters'),
  body('targetType')
    .isIn(['user', 'group', 'topic'])
    .withMessage('Target type must be user, group, or topic'),
  body('targetId')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ID')
];

const eventValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date')
    .custom((date) => {
      if (new Date(date) < new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('isVirtual')
    .optional()
    .isBoolean()
    .withMessage('isVirtual must be a boolean'),
  body('maxAttendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxAttendees must be a positive number'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('invitedGroups')
    .optional()
    .isArray()
    .withMessage('invitedGroups must be an array'),
  body('invitedGroups.*')
    .optional()
    .isMongoId()
    .withMessage('Each group ID must be valid'),
  body('invitedTopics')
    .optional()
    .isArray()
    .withMessage('invitedTopics must be an array'),
  body('invitedTopics.*')
    .optional()
    .isMongoId()
    .withMessage('Each topic ID must be valid'),
  body('invitedUsers')
    .optional()
    .isArray()
    .withMessage('invitedUsers must be an array'),
  body('invitedUsers.*')
    .optional()
    .isMongoId()
    .withMessage('Each user ID must be valid')
];

const groupValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters')
];

const topicValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Topic name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters')
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  postValidation,
  eventValidation,
  groupValidation,
  topicValidation,
  handleValidationErrors
};
