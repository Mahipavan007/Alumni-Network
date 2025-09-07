import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Topic as TopicIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  People as PeopleIcon,
  PostAdd as PostAddIcon
} from '@mui/icons-material';
import { topicAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getAvatarColor, debounce } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const TopicCard = ({ topic, onSubscribe, onUnsubscribe, isSubscribed }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Topic Header */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: getAvatarColor(topic.name),
                fontSize: '1.25rem'
              }}
              src={topic.image}
            >
              {topic.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {topic.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="caption" color="textSecondary">
                  {topic.subscriberCount} subscribers
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  • {topic.postCount || 0} posts
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>View Posts</MenuItem>
            <MenuItem onClick={handleMenuClose}>Report</MenuItem>
            {topic.createdBy === user._id && (
              <MenuItem onClick={handleMenuClose}>Manage Topic</MenuItem>
            )}
          </Menu>
        </Box>

        {/* Topic Description */}
        <Typography 
          variant="body2" 
          color="textSecondary" 
          paragraph
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {topic.description}
        </Typography>

        {/* Topic Tags */}
        {topic.tags && topic.tags.length > 0 && (
          <Box mb={2}>
            {topic.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {topic.tags.length > 3 && (
              <Chip
                label={`+${topic.tags.length - 3} more`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
          </Box>
        )}

        {/* Topic Stats */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="caption" color="textSecondary">
              {topic.subscriberCount} subscribers
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <PostAddIcon fontSize="small" color="action" />
            <Typography variant="caption" color="textSecondary">
              {topic.postCount || 0} posts
            </Typography>
          </Box>
        </Box>

        {/* Created Date */}
        <Typography variant="caption" color="textSecondary">
          Created {formatDate(topic.createdAt)}
        </Typography>
      </CardContent>
      
      {/* Action Button */}
      <Box sx={{ p: 2, pt: 0 }}>
        {isSubscribed ? (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<NotificationsOffIcon />}
            onClick={() => onUnsubscribe(topic._id)}
          >
            Unsubscribe
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<NotificationsIcon />}
            onClick={() => onSubscribe(topic._id)}
          >
            Subscribe
          </Button>
        )}
      </Box>
    </Card>
  );
};

const CreateTopicDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    onSubmit(submitData);
    setFormData({ name: '', description: '', tags: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Topic</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          <TextField
            label="Topic Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            helperText="Choose a clear, descriptive name for your topic"
          />
          
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            helperText="Describe what this topic is about and what kind of discussions you expect"
          />
          
          <TextField
            label="Tags"
            value={formData.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            fullWidth
            helperText="Add relevant tags separated by commas (e.g., technology, career, networking)"
            placeholder="technology, career, networking"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.name || !formData.description}
        >
          Create Topic
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Topics = () => {
  const [topics, setTopics] = useState([]);
  const [userTopics, setUserTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchTopics();
    fetchUserTopics();
  }, []);

  const fetchTopics = async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await topicAPI.getTopics(params);
      setTopics(response.data.topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTopics = async () => {
    try {
      const response = await topicAPI.getUserTopics();
      setUserTopics(response.data.topics);
    } catch (error) {
      console.error('Error fetching user topics:', error);
    }
  };

  const debouncedSearch = debounce((query) => {
    fetchTopics(query);
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery]);

  const handleSubscribeTopic = async (topicId) => {
    try {
      await topicAPI.subscribeTopic(topicId);
      // Refresh topics to update subscriber count and status
      fetchTopics(searchQuery);
      fetchUserTopics();
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  };

  const handleUnsubscribeTopic = async (topicId) => {
    try {
      await topicAPI.unsubscribeTopic(topicId);
      // Refresh topics to update subscriber count and status
      fetchTopics(searchQuery);
      fetchUserTopics();
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  };

  const handleCreateTopic = async (topicData) => {
    try {
      await topicAPI.createTopic(topicData);
      setCreateDialogOpen(false);
      fetchTopics(searchQuery);
      fetchUserTopics();
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const isSubscribedToTopic = (topicId) => {
    return userTopics.some(topic => topic._id === topicId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Topics
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Discover and follow topics that interest you
        </Typography>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </CardContent>
      </Card>

      {/* My Topics Section */}
      {userTopics.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            My Topics ({userTopics.length})
          </Typography>
          <Grid container spacing={3}>
            {userTopics.map((topic) => (
              <Grid item xs={12} sm={6} md={4} key={topic._id}>
                <TopicCard
                  topic={topic}
                  onSubscribe={handleSubscribeTopic}
                  onUnsubscribe={handleUnsubscribeTopic}
                  isSubscribed={true}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* All Topics Section */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Discover Topics
        </Typography>
        
        {topics.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <TopicIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No topics found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to create a topic for discussion!'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {topics.map((topic) => (
              <Grid item xs={12} sm={6} md={4} key={topic._id}>
                <TopicCard
                  topic={topic}
                  onSubscribe={handleSubscribeTopic}
                  onUnsubscribe={handleUnsubscribeTopic}
                  isSubscribed={isSubscribedToTopic(topic._id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create topic"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 32,
          right: 32,
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Topic Dialog */}
      <CreateTopicDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTopic}
      />
    </Container>
  );
};

export default Topics;
