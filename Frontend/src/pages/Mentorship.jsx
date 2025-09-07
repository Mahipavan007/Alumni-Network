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
  Tab,
  Tabs,
  Chip,
  Avatar,
  IconButton
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Mail as MailIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Mentorship() {
  const [value, setValue] = useState(0);
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMentorships();
  }, []);

  const fetchMentorships = async () => {
    try {
      const response = await api.get('/api/mentorship');
      setMentorships(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filterMentorships = () => {
    switch (value) {
      case 0: // All
        return mentorships;
      case 1: // As Mentor
        return mentorships.filter(m => m.mentor._id === user.id);
      case 2: // As Mentee
        return mentorships.filter(m => m.mentee._id === user.id);
      default:
        return mentorships;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mentorship Program
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/mentorship/find')}
        >
          Find a Mentor
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={value} onChange={handleTabChange}>
          <Tab label="All Mentorships" />
          <Tab label="As Mentor" />
          <Tab label="As Mentee" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {filterMentorships().map((mentorship) => (
          <Grid item xs={12} md={6} key={mentorship._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={mentorship.mentor.profilePicture}
                      alt={mentorship.mentor.name}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="h6">
                        {mentorship.mentor._id === user.id ? 'Mentee' : 'Mentor'}:&nbsp;
                        {mentorship.mentor._id === user.id
                          ? mentorship.mentee.name
                          : mentorship.mentor.name}
                      </Typography>
                      <Chip
                        label={mentorship.status}
                        color={getStatusColor(mentorship.status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={() => window.open(mentorship.nextMeeting?.link)}>
                      <VideoCallIcon />
                    </IconButton>
                    <IconButton onClick={() => navigate('/messages/' + (mentorship.mentor._id === user.id ? mentorship.mentee._id : mentorship.mentor._id))}>
                      <MailIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Focus Areas: {mentorship.focusAreas.join(', ')}
                </Typography>

                {mentorship.nextMeeting && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 1 }} color="primary" />
                    <Typography variant="body2">
                      Next Meeting: {new Date(mentorship.nextMeeting.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {mentorship.feedback?.menteeRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ mr: 1 }} color="primary" />
                    <Typography variant="body2">
                      Rating: {mentorship.feedback.menteeRating.rating}/5
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/mentorship/' + mentorship._id)}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {mentorships.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No mentorships found. Start by finding a mentor!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/mentorship/find')}
          >
            Find a Mentor
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Mentorship;
