const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { body, validationResult } = require('express-validator');

// Validation middleware
const jobValidation = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('company.name').trim().notEmpty().withMessage('Company name is required'),
  body('company.location').trim().notEmpty().withMessage('Company location is required'),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('requirements').isArray().notEmpty().withMessage('At least one requirement is required'),
  body('type').isIn(['full-time', 'part-time', 'contract', 'internship']).withMessage('Invalid job type'),
  body('category').isIn(['software-development', 'data-science', 'design', 'product-management', 'marketing', 'sales', 'other']).withMessage('Invalid category'),
  body('experienceLevel').isIn(['entry', 'junior', 'mid', 'senior', 'lead']).withMessage('Invalid experience level'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number'),
  body('skills').isArray().notEmpty().withMessage('At least one skill is required'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required'),
  body('workLocation').isIn(['remote', 'onsite', 'hybrid']).withMessage('Invalid work location')
];

// @route   GET /api/jobs
// @desc    Get all jobs with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      search,
      category,
      type,
      experienceLevel,
      workLocation,
      minSalary,
      status = 'open',
      limit = 20,
      page = 1
    } = req.query;

    const query = { status };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (workLocation) {
      query.workLocation = workLocation;
    }

    if (minSalary) {
      query['salary.min'] = { $gte: parseInt(minSalary) };
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName profilePicture')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName profilePicture');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has already applied
    const application = await JobApplication.findOne({
      job: job._id,
      applicant: req.user._id
    }).select('status');

    res.json({
      job,
      hasApplied: !!application,
      applicationStatus: application?.status
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Create a job
// @access  Private
router.post('/', [auth, jobValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = new Job({
      ...req.body,
      postedBy: req.user._id
    });

    await job.save();
    await job.populate('postedBy', 'firstName lastName profilePicture');

    res.status(201).json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private
router.put('/:id', [auth, jobValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    Object.assign(job, req.body);
    await job.save();
    await job.populate('postedBy', 'firstName lastName profilePicture');

    res.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.remove();
    res.json({ message: 'Job removed' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private
router.post('/:id/apply', [
  auth,
  body('resume.url').trim().notEmpty().withMessage('Resume is required'),
  body('experience').trim().notEmpty().withMessage('Experience is required'),
  body('coverLetter').trim().optional(),
  body('relevantSkills').isArray().optional(),
  body('portfolioUrl').isURL().optional(),
  body('expectedSalary.amount').isNumeric().optional(),
  body('noticePeriod').isNumeric().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    if (job.deadline < new Date()) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job: job._id,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new JobApplication({
      job: job._id,
      applicant: req.user._id,
      ...req.body
    });

    await application.save();

    // Increment application count
    job.applicationCount += 1;
    await job.save();

    res.status(201).json({ application });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/:id/applications
// @desc    Get applications for a job
// @access  Private (Job poster only)
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view applications' });
    }

    const { status, limit = 20, page = 1 } = req.query;
    const query = { job: job._id };

    if (status) {
      query.status = status;
    }

    const applications = await JobApplication.find(query)
      .populate('applicant', 'firstName lastName profilePicture graduationYear course')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await JobApplication.countDocuments(query);

    res.json({
      applications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:jobId/applications/:applicationId
// @desc    Update application status
// @access  Private (Job poster only)
router.put('/:jobId/applications/:applicationId', [
  auth,
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted']).withMessage('Invalid status'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update applications' });
    }

    const application = await JobApplication.findOne({
      _id: req.params.applicationId,
      job: req.params.jobId
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = req.body.status;
    if (req.body.notes) {
      application.notes = req.body.notes;
    }
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();
    res.json({ application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
