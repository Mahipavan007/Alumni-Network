import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  TextField,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Book as BookIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mentorship-tabpanel-${index}`}
      aria-labelledby={`mentorship-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function MentorshipDetails() {
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [openMeetingDialog, setOpenMeetingDialog] = useState(false);
  const [openResourceDialog, setOpenResourceDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [progressData, setProgressData] = useState({
    notes: '',
    achievements: [''],
    challenges: [''],
    nextSteps: ['']
  });
  const [meetingData, setMeetingData] = useState({
    date: '',
    agenda: '',
    link: ''
  });
  const [resourceData, setResourceData] = useState({
    title: '',
    type: 'article',
    url: ''
  });
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    comment: ''
  });

  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMentorship();
  }, [id]);

  const fetchMentorship = async () => {
    try {
      const response = await api.get(`/api/mentorship/${id}`);
      setMentorship(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentorship:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/api/mentorship/${id}/status`, { status: newStatus });
      fetchMentorship();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddProgress = async () => {
    try {
      await api.post(`/api/mentorship/${id}/progress`, {
        notes: progressData.notes,
        achievements: progressData.achievements.filter(a => a.trim()),
        challenges: progressData.challenges.filter(c => c.trim()),
        nextSteps: progressData.nextSteps.filter(s => s.trim())
      });
      setOpenProgressDialog(false);
      fetchMentorship();
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  const handleScheduleMeeting = async () => {
    try {
      await api.post(`/api/mentorship/${id}/meeting`, meetingData);
      setOpenMeetingDialog(false);
      fetchMentorship();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    }
  };

  const handleAddResource = async () => {
    try {
      await api.post(`/api/mentorship/${id}/resources`, resourceData);
      setOpenResourceDialog(false);
      fetchMentorship();
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await api.post(`/api/mentorship/${id}/feedback`, feedbackData);
      setOpenFeedbackDialog(false);
      fetchMentorship();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!mentorship) {
    return (
      <Container>
        <Typography>Mentorship not found</Typography>
      </Container>
    );
  }

  const isMentor = mentorship.mentor._id === user.id;
  const otherParty = isMentor ? mentorship.mentee : mentorship.mentor;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1">
              Mentorship with {otherParty.name}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={mentorship.status}
                color={
                  mentorship.status === 'active' ? 'success' :
                  mentorship.status === 'pending' ? 'warning' :
                  mentorship.status === 'completed' ? 'info' : 'error'
                }
                sx={{ mr: 1 }}
              />
              <Chip
                label={`${mentorship.meetingFrequency} meetings`}
                variant="outlined"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            {mentorship.status === 'pending' && isMentor && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusChange('active')}
                  sx={{ mr: 1 }}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusChange('cancelled')}
                >
                  Decline
                </Button>
              </>
            )}
            {mentorship.status === 'active' && (
              <Button
                variant="contained"
                onClick={() => setOpenProgressDialog(true)}
              >
                Add Progress
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Progress" />
          <Tab label="Resources" />
          <Tab label="Feedback" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mentor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={mentorship.mentor.profilePicture}
                    alt={mentorship.mentor.name}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box>
                    <Typography>{mentorship.mentor.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mentorship.mentor.title || 'Alumni'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mentee
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={mentorship.mentee.profilePicture}
                    alt={mentorship.mentee.name}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box>
                    <Typography>{mentorship.mentee.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mentorship.mentee.title || 'Alumni'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body2">
                  Started: {new Date(mentorship.startDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  Ends: {new Date(mentorship.endDate).toLocaleDateString()}
                </Typography>
                {mentorship.nextMeeting && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Next Meeting
                    </Typography>
                    <Typography variant="body2">
                      {new Date(mentorship.nextMeeting.date).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mentorship.nextMeeting.agenda}
                    </Typography>
                  </Box>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setOpenMeetingDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Goals
                </Typography>
                <List>
                  {mentorship.goals.map((goal, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {goal.status === 'completed' ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <AssignmentIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={goal.description}
                        secondary={goal.status}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {mentorship.progress.map((entry, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {new Date(entry.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {entry.notes}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Achievements:
                  </Typography>
                  <List dense>
                    {entry.achievements.map((achievement, i) => (
                      <ListItem key={i}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={achievement} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" gutterBottom>
                    Challenges:
                  </Typography>
                  <List dense>
                    {entry.challenges.map((challenge, i) => (
                      <ListItem key={i}>
                        <ListItemIcon>
                          <AssignmentIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={challenge} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" gutterBottom>
                    Next Steps:
                  </Typography>
                  <List dense>
                    {entry.nextSteps.map((step, i) => (
                      <ListItem key={i}>
                        <ListItemIcon>
                          <ScheduleIcon color="info" />
                        </ListItemIcon>
                        <ListItemText primary={step} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Button
          variant="contained"
          onClick={() => setOpenResourceDialog(true)}
          sx={{ mb: 3 }}
        >
          Add Resource
        </Button>

        <Grid container spacing={3}>
          {mentorship.resources.map((resource, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BookIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {resource.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {resource.type}
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Resource
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mentor Feedback
                </Typography>
                {mentorship.feedback?.mentorRating ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={mentorship.feedback.mentorRating.rating} readOnly />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({mentorship.feedback.mentorRating.rating}/5)
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {mentorship.feedback.mentorRating.comment}
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    No feedback provided yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mentee Feedback
                </Typography>
                {mentorship.feedback?.menteeRating ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={mentorship.feedback.menteeRating.rating} readOnly />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({mentorship.feedback.menteeRating.rating}/5)
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {mentorship.feedback.menteeRating.comment}
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    No feedback provided yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            {!mentorship.feedback?.[isMentor ? 'mentorRating' : 'menteeRating'] && (
              <Button
                variant="contained"
                onClick={() => setOpenFeedbackDialog(true)}
                startIcon={<StarIcon />}
              >
                Provide Feedback
              </Button>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Progress Dialog */}
      <Dialog
        open={openProgressDialog}
        onClose={() => setOpenProgressDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Progress Update</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            value={progressData.notes}
            onChange={(e) => setProgressData(prev => ({ ...prev, notes: e.target.value }))}
            margin="normal"
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Achievements
          </Typography>
          {progressData.achievements.map((achievement, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Achievement ${index + 1}`}
              value={achievement}
              onChange={(e) => setProgressData(prev => ({
                ...prev,
                achievements: prev.achievements.map((a, i) => i === index ? e.target.value : a)
              }))}
              margin="dense"
            />
          ))}
          <Button onClick={() => setProgressData(prev => ({
            ...prev,
            achievements: [...prev.achievements, '']
          }))}>
            Add Achievement
          </Button>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Challenges
          </Typography>
          {progressData.challenges.map((challenge, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Challenge ${index + 1}`}
              value={challenge}
              onChange={(e) => setProgressData(prev => ({
                ...prev,
                challenges: prev.challenges.map((c, i) => i === index ? e.target.value : c)
              }))}
              margin="dense"
            />
          ))}
          <Button onClick={() => setProgressData(prev => ({
            ...prev,
            challenges: [...prev.challenges, '']
          }))}>
            Add Challenge
          </Button>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Next Steps
          </Typography>
          {progressData.nextSteps.map((step, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Step ${index + 1}`}
              value={step}
              onChange={(e) => setProgressData(prev => ({
                ...prev,
                nextSteps: prev.nextSteps.map((s, i) => i === index ? e.target.value : s)
              }))}
              margin="dense"
            />
          ))}
          <Button onClick={() => setProgressData(prev => ({
            ...prev,
            nextSteps: [...prev.nextSteps, '']
          }))}>
            Add Step
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProgressDialog(false)}>Cancel</Button>
          <Button onClick={handleAddProgress} variant="contained">
            Save Progress
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meeting Dialog */}
      <Dialog
        open={openMeetingDialog}
        onClose={() => setOpenMeetingDialog(false)}
      >
        <DialogTitle>Schedule Meeting</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Date & Time"
            type="datetime-local"
            value={meetingData.date}
            onChange={(e) => setMeetingData(prev => ({ ...prev, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Agenda"
            multiline
            rows={3}
            value={meetingData.agenda}
            onChange={(e) => setMeetingData(prev => ({ ...prev, agenda: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Meeting Link"
            value={meetingData.link}
            onChange={(e) => setMeetingData(prev => ({ ...prev, link: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMeetingDialog(false)}>Cancel</Button>
          <Button onClick={handleScheduleMeeting} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog
        open={openResourceDialog}
        onClose={() => setOpenResourceDialog(false)}
      >
        <DialogTitle>Add Resource</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={resourceData.title}
            onChange={(e) => setResourceData(prev => ({ ...prev, title: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Type"
            value={resourceData.type}
            onChange={(e) => setResourceData(prev => ({ ...prev, type: e.target.value }))}
            margin="normal"
            SelectProps={{
              native: true
            }}
          >
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="book">Book</option>
            <option value="course">Course</option>
            <option value="other">Other</option>
          </TextField>
          <TextField
            fullWidth
            label="URL"
            value={resourceData.url}
            onChange={(e) => setResourceData(prev => ({ ...prev, url: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResourceDialog(false)}>Cancel</Button>
          <Button onClick={handleAddResource} variant="contained">
            Add Resource
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={openFeedbackDialog}
        onClose={() => setOpenFeedbackDialog(false)}
      >
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={feedbackData.rating}
              onChange={(e, newValue) => setFeedbackData(prev => ({
                ...prev,
                rating: newValue
              }))}
            />
            <TextField
              fullWidth
              label="Comments"
              multiline
              rows={4}
              value={feedbackData.comment}
              onChange={(e) => setFeedbackData(prev => ({
                ...prev,
                comment: e.target.value
              }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFeedbackDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitFeedback}
            variant="contained"
            disabled={!feedbackData.rating}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MentorshipDetails;
