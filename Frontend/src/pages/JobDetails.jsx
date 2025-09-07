import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  AttachMoney as SalaryIcon,
  Timer as TimerIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applicationData, setApplicationData] = useState({
    resume: { url: '', filename: '' },
    coverLetter: '',
    experience: '',
    relevantSkills: [],
    portfolioUrl: '',
    expectedSalary: {
      amount: '',
      currency: 'USD'
    },
    noticePeriod: 30
  });

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJob(id);
      setJob(response.data.job);
      
      if (response.data.job.postedBy._id === user._id) {
        const applicationsResponse = await jobAPI.getApplications(id);
        setApplications(applicationsResponse.data.applications);
      }
      
      setError(null);
    } catch (err) {
      setError('Error fetching job details. Please try again.');
      console.error('Fetch job details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      await jobAPI.applyForJob(id, applicationData);
      setApplyDialogOpen(false);
      fetchJobDetails();
      setError(null);
    } catch (err) {
      setError('Error submitting application. Please try again.');
      console.error('Job application error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await jobAPI.updateApplication(id, applicationId, { status });
      fetchJobDetails();
    } catch (err) {
      setError('Error updating application status. Please try again.');
      console.error('Update application status error:', err);
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      setLoading(true);
      await jobAPI.deleteJob(id);
      navigate('/jobs');
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

  if (!job) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Job not found</Alert>
      </Container>
    );
  }

  const isOwner = job.postedBy._id === user._id;
  const hasDeadlinePassed = new Date(job.deadline) < new Date();
  const canApply = !isOwner && job.status === 'open' && !hasDeadlinePassed && !job.hasApplied;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/jobs')}
        sx={{ mb: 3 }}
      >
        Back to Jobs
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h4" gutterBottom>
                  {job.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <BusinessIcon color="action" />
                  <Typography variant="h6">
                    {job.company.name}
                  </Typography>
                </Stack>
              </Box>
              {job.company.logo && (
                <Avatar
                  src={job.company.logo}
                  alt={job.company.name}
                  sx={{ width: 64, height: 64 }}
                />
              )}
            </Box>

            <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
              <Chip
                icon={<LocationIcon />}
                label={job.company.location}
                variant="outlined"
              />
              <Chip
                icon={<WorkIcon />}
                label={job.type.replace('-', ' ')}
                variant="outlined"
              />
              <Chip
                icon={<SalaryIcon />}
                label={`${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)} ${job.salary.currency}`}
                variant="outlined"
              />
              <Chip
                icon={<TimerIcon />}
                label={`Apply by ${formatDate(job.deadline)}`}
                variant="outlined"
                color={hasDeadlinePassed ? 'error' : 'default'}
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography paragraph style={{ whiteSpace: 'pre-line' }}>
              {job.description}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <List>
              {job.requirements.map((req, index) => (
                <ListItem key={index}>
                  <ListItemText primary={req} />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" gutterBottom>
              Skills
            </Typography>
            <Box mb={3}>
              {job.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>

            {job.benefits.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Benefits
                </Typography>
                <List>
                  {job.benefits.map((benefit, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            <Box mt={3}>
              {isOwner ? (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/jobs/${id}/edit`)}
                  >
                    Edit Job
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteJob}
                  >
                    Delete Job
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!canApply}
                  onClick={() => setApplyDialogOpen(true)}
                >
                  {job.hasApplied ? 'Already Applied' : 'Apply Now'}
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Experience Level"
                  secondary={job.experienceLevel.replace('-', ' ')}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Work Location"
                  secondary={job.workLocation}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Category"
                  secondary={job.category.replace('-', ' ')}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Posted By"
                  secondary={`${job.postedBy.firstName} ${job.postedBy.lastName}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Posted On"
                  secondary={formatDate(job.createdAt)}
                />
              </ListItem>
              {job.applicationUrl && (
                <ListItem>
                  <ListItemText
                    primary="External Application"
                    secondary={
                      <Button
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apply on Company Website
                      </Button>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {isOwner && applications.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Applications ({applications.length})
              </Typography>
              <List>
                {applications.map((application) => (
                  <ListItem
                    key={application._id}
                    secondaryAction={
                      <FormControl size="small">
                        <Select
                          value={application.status}
                          onChange={(e) => handleUpdateApplicationStatus(application._id, e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="reviewed">Reviewed</MenuItem>
                          <MenuItem value="shortlisted">Shortlisted</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                          <MenuItem value="accepted">Accepted</MenuItem>
                        </Select>
                      </FormControl>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={application.applicant.profilePicture} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${application.applicant.firstName} ${application.applicant.lastName}`}
                      secondary={formatDate(application.createdAt)}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Apply for {job.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Resume URL"
              value={applicationData.resume.url}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                resume: { ...prev.resume, url: e.target.value }
              }))}
              required
              fullWidth
              helperText="Upload your resume to a cloud storage and provide the URL"
            />

            <TextField
              label="Cover Letter"
              value={applicationData.coverLetter}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                coverLetter: e.target.value
              }))}
              multiline
              rows={4}
              fullWidth
            />

            <TextField
              label="Experience"
              value={applicationData.experience}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                experience: e.target.value
              }))}
              required
              fullWidth
              helperText="Briefly describe your relevant experience"
            />

            <TextField
              label="Relevant Skills"
              value={applicationData.relevantSkills.join(', ')}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                relevantSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              fullWidth
              helperText="Enter skills separated by commas"
            />

            <TextField
              label="Portfolio URL"
              value={applicationData.portfolioUrl}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                portfolioUrl: e.target.value
              }))}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expected Salary"
                  type="number"
                  value={applicationData.expectedSalary.amount}
                  onChange={(e) => setApplicationData(prev => ({
                    ...prev,
                    expectedSalary: {
                      ...prev.expectedSalary,
                      amount: e.target.value
                    }
                  }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={applicationData.expectedSalary.currency}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      expectedSalary: {
                        ...prev.expectedSalary,
                        currency: e.target.value
                      }
                    }))}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Notice Period (days)"
              type="number"
              value={applicationData.noticePeriod}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                noticePeriod: e.target.value
              }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApply}
            variant="contained"
            color="primary"
            disabled={!applicationData.resume.url || !applicationData.experience}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobDetails;
