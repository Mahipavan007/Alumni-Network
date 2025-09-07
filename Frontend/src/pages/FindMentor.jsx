import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Autocomplete,
  Avatar,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function FindMentor() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestData, setRequestData] = useState({
    goals: [''],
    startDate: '',
    endDate: '',
    meetingFrequency: 'weekly'
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMentors();
    fetchSkills();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await api.get('/api/users/mentors');
      setMentors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/api/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const filterMentors = () => {
    return mentors.filter(mentor => {
      const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSkills = selectedSkills.length === 0 ||
        selectedSkills.every(skill => mentor.expertise.includes(skill));

      return matchesSearch && matchesSkills;
    });
  };

  const handleRequestMentorship = (mentor) => {
    setSelectedMentor(mentor);
    setOpenDialog(true);
  };

  const handleAddGoal = () => {
    setRequestData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const handleGoalChange = (index, value) => {
    setRequestData(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => i === index ? value : goal)
    }));
  };

  const handleSubmitRequest = async () => {
    try {
      await api.post('/api/mentorship/request', {
        mentorId: selectedMentor._id,
        goals: requestData.goals.filter(goal => goal.trim()),
        focusAreas: selectedSkills,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        meetingFrequency: requestData.meetingFrequency
      });

      setOpenDialog(false);
      navigate('/mentorship');
    } catch (error) {
      console.error('Error requesting mentorship:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Find a Mentor
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search by name or expertise"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={skills}
              value={selectedSkills}
              onChange={(e, newValue) => setSelectedSkills(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by skills"
                  placeholder="Select skills"
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filterMentors().map((mentor) => (
          <Grid item xs={12} md={6} key={mentor._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={mentor.profilePicture}
                    alt={mentor.name}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">{mentor.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mentor.title || 'Alumni'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  {mentor.expertise.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {mentor.bio || 'No bio available'}
                  </Typography>
                </Box>

                {mentor.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={mentor.rating} readOnly precision={0.5} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({mentor.totalRatings} ratings)
                    </Typography>
                  </Box>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleRequestMentorship(mentor)}
                >
                  Request Mentorship
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filterMentors().length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No mentors found matching your criteria
          </Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Mentorship</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              What are your goals for this mentorship?
            </Typography>
            {requestData.goals.map((goal, index) => (
              <TextField
                key={index}
                fullWidth
                label={`Goal ${index + 1}`}
                value={goal}
                onChange={(e) => handleGoalChange(index, e.target.value)}
                margin="normal"
              />
            ))}
            <Button onClick={handleAddGoal}>Add Another Goal</Button>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={requestData.startDate}
                  onChange={(e) => setRequestData(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={requestData.endDate}
                  onChange={(e) => setRequestData(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Meeting Frequency"
                  value={requestData.meetingFrequency}
                  onChange={(e) => setRequestData(prev => ({
                    ...prev,
                    meetingFrequency: e.target.value
                  }))}
                  SelectProps={{
                    native: true
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitRequest}
            variant="contained"
            disabled={
              !requestData.goals[0] ||
              !requestData.startDate ||
              !requestData.endDate ||
              !requestData.meetingFrequency
            }
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FindMentor;
