import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Work as WorkIcon,
  Search as SearchIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  AttachMoney as SalaryIcon,
  Timer as TimerIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';

const JobForm = ({ job, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    company: {
      name: job?.company?.name || '',
      logo: job?.company?.logo || '',
      website: job?.company?.website || '',
      location: job?.company?.location || ''
    },
    description: job?.description || '',
    requirements: job?.requirements || [''],
    type: job?.type || 'full-time',
    category: job?.category || 'software-development',
    experienceLevel: job?.experienceLevel || 'entry',
    salary: {
      min: job?.salary?.min || '',
      max: job?.salary?.max || '',
      currency: job?.salary?.currency || 'USD'
    },
    skills: job?.skills || [''],
    deadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
    workLocation: job?.workLocation || 'onsite',
    applicationUrl: job?.applicationUrl || '',
    benefits: job?.benefits || ['']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayField = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          label="Job Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          fullWidth
        />

        <Typography variant="h6">Company Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Name"
              value={formData.company.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                company: { ...prev.company, name: e.target.value }
              }))}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Location"
              value={formData.company.location}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                company: { ...prev.company, location: e.target.value }
              }))}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Website"
              value={formData.company.website}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                company: { ...prev.company, website: e.target.value }
              }))}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Logo URL"
              value={formData.company.logo}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                company: { ...prev.company, logo: e.target.value }
              }))}
              fullWidth
            />
          </Grid>
        </Grid>

        <TextField
          label="Job Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          multiline
          rows={4}
          fullWidth
        />

        <Typography variant="h6">Requirements</Typography>
        {formData.requirements.map((req, index) => (
          <Box key={index} display="flex" gap={1}>
            <TextField
              value={req}
              onChange={(e) => updateArrayField('requirements', index, e.target.value)}
              required
              fullWidth
            />
            <IconButton 
              onClick={() => removeArrayField('requirements', index)}
              disabled={formData.requirements.length === 1}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button onClick={() => addArrayField('requirements')} startIcon={<AddIcon />}>
          Add Requirement
        </Button>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!formData.type}>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="internship">Internship</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="software-development">Software Development</MenuItem>
                <MenuItem value="data-science">Data Science</MenuItem>
                <MenuItem value="design">Design</MenuItem>
                <MenuItem value="product-management">Product Management</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={formData.experienceLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
              >
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="junior">Junior</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Work Location</InputLabel>
              <Select
                value={formData.workLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, workLocation: e.target.value }))}
              >
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="onsite">On-site</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="h6">Salary Range</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Minimum"
              type="number"
              value={formData.salary.min}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                salary: { ...prev.salary, min: e.target.value }
              }))}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Maximum"
              type="number"
              value={formData.salary.max}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                salary: { ...prev.salary, max: e.target.value }
              }))}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.salary.currency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  salary: { ...prev.salary, currency: e.target.value }
                }))}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="h6">Skills</Typography>
        {formData.skills.map((skill, index) => (
          <Box key={index} display="flex" gap={1}>
            <TextField
              value={skill}
              onChange={(e) => updateArrayField('skills', index, e.target.value)}
              required
              fullWidth
            />
            <IconButton 
              onClick={() => removeArrayField('skills', index)}
              disabled={formData.skills.length === 1}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button onClick={() => addArrayField('skills')} startIcon={<AddIcon />}>
          Add Skill
        </Button>

        <TextField
          label="Application Deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
          required
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="External Application URL"
          value={formData.applicationUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, applicationUrl: e.target.value }))}
          fullWidth
        />

        <Typography variant="h6">Benefits</Typography>
        {formData.benefits.map((benefit, index) => (
          <Box key={index} display="flex" gap={1}>
            <TextField
              value={benefit}
              onChange={(e) => updateArrayField('benefits', index, e.target.value)}
              fullWidth
            />
            <IconButton onClick={() => removeArrayField('benefits', index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button onClick={() => addArrayField('benefits')} startIcon={<AddIcon />}>
          Add Benefit
        </Button>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {job ? 'Update Job' : 'Post Job'}
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
};

const JobCard = ({ job, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isOwner = job.postedBy._id === user._id;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" gutterBottom>
              {job.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">
                {job.company.name}
              </Typography>
            </Stack>
          </Box>
          {job.company.logo && (
            <Box
              component="img"
              src={job.company.logo}
              alt={job.company.name}
              sx={{ width: 50, height: 50, objectFit: 'contain' }}
            />
          )}
        </Box>

        <Stack direction="row" spacing={2} mb={2}>
          <Chip
            icon={<LocationIcon />}
            label={job.company.location}
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<WorkIcon />}
            label={job.type.replace('-', ' ')}
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<SalaryIcon />}
            label={`${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)} ${job.salary.currency}`}
            variant="outlined"
            size="small"
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.length > 200
            ? job.description.slice(0, 200) + '...'
            : job.description}
        </Typography>

        <Box mb={2}>
          {job.skills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block">
          <TimerIcon fontSize="inherit" sx={{ mr: 0.5 }} />
          Apply by {formatDate(job.deadline)}
        </Typography>
      </CardContent>

      <CardActions>
        <Button variant="contained" color="primary" href={`/jobs/${job._id}`}>
          View Details
        </Button>
        {isOwner && (
          <>
            <IconButton onClick={() => onEdit(job)} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => onDelete(job._id)} color="error">
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </CardActions>
    </Card>
  );
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    experienceLevel: '',
    workLocation: '',
    minSalary: ''
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobs(filters);
      setJobs(response.data.jobs);
      setError(null);
    } catch (err) {
      setError('Error fetching jobs. Please try again.');
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      // Validate required fields
      const requiredFields = [
        'title',
        'description',
        'type',
        'category',
        'experienceLevel',
        'workLocation',
        'deadline'
      ];

      const requiredCompanyFields = ['name', 'location'];
      const requiredArrayFields = ['requirements', 'skills'];
      const requiredSalaryFields = ['min', 'max'];

      // Check main fields
      for (const field of requiredFields) {
        if (!jobData[field]) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }

      // Check company fields
      for (const field of requiredCompanyFields) {
        if (!jobData.company?.[field]) {
          throw new Error(`Company ${field} is required`);
        }
      }

      // Check array fields
      for (const field of requiredArrayFields) {
        if (!jobData[field]?.length || !jobData[field].every(item => item.trim())) {
          throw new Error(`At least one ${field.slice(0, -1)} is required`);
        }
      }

      // Check salary fields
      for (const field of requiredSalaryFields) {
        if (!jobData.salary?.[field] || isNaN(jobData.salary[field])) {
          throw new Error(`Salary ${field} must be a valid number`);
        }
      }

      // Validate salary range
      if (parseFloat(jobData.salary.min) > parseFloat(jobData.salary.max)) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }

      // Validate deadline
      const deadline = new Date(jobData.deadline);
      if (deadline < new Date()) {
        throw new Error('Deadline cannot be in the past');
      }

      // Clean up data before sending
      const cleanData = {
        ...jobData,
        salary: {
          min: parseFloat(jobData.salary.min),
          max: parseFloat(jobData.salary.max),
          currency: jobData.salary.currency || 'USD'
        },
        requirements: jobData.requirements.filter(req => req.trim()),
        skills: jobData.skills.filter(skill => skill.trim())
      };

      setLoading(true);
      await jobAPI.createJob(cleanData);
      setCreateDialogOpen(false);
      fetchJobs();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating job. Please try again.');
      console.error('Create job error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (jobData) => {
    try {
      setLoading(true);
      await jobAPI.updateJob(editJob._id, jobData);
      setEditJob(null);
      fetchJobs();
      setError(null);
    } catch (err) {
      setError('Error updating job. Please try again.');
      console.error('Update job error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      setLoading(true);
      await jobAPI.deleteJob(jobId);
      fetchJobs();
      setError(null);
    } catch (err) {
      setError('Error deleting job. Please try again.');
      console.error('Delete job error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Job Board
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Post a Job
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="software-development">Software Development</MenuItem>
                <MenuItem value="data-science">Data Science</MenuItem>
                <MenuItem value="design">Design</MenuItem>
                <MenuItem value="product-management">Product Management</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="internship">Internship</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Experience</InputLabel>
              <Select
                value={filters.experienceLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, experienceLevel: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="junior">Junior</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={filters.workLocation}
                onChange={(e) => setFilters(prev => ({ ...prev, workLocation: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="onsite">On-site</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {jobs.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No jobs found. Try adjusting your filters or post a new job.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          jobs.map((job) => (
            <Grid item xs={12} key={job._id}>
              <JobCard
                job={job}
                onEdit={setEditJob}
                onDelete={handleDeleteJob}
              />
            </Grid>
          ))
        )}
      </Grid>

      <Dialog
        open={createDialogOpen || !!editJob}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditJob(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editJob ? 'Edit Job' : 'Post a New Job'}
        </DialogTitle>
        <DialogContent>
          <JobForm
            job={editJob}
            onSubmit={editJob ? handleUpdateJob : handleCreateJob}
            onClose={() => {
              setCreateDialogOpen(false);
              setEditJob(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Jobs;
