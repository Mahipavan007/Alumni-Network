import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Fab,
  useMediaQuery,
  useTheme,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { postAPI, eventAPI, groupAPI } from '../services/api';
import { formatRelativeTime, getAvatarColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CreatePostDialog from '../components/CreatePostDialog';

// Sidebar component for upcoming events
const UpcomingEvents = ({ events }) => {
  const navigate = useNavigate();
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upcoming Events
        </Typography>
        <List>
          {Array.isArray(events) && events.length > 0 ? (
            events.map((event) => (
              <ListItem
                key={event._id}
                button
                onClick={() => navigate(`/events/${event._id}`)}
                sx={{ pl: 0 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(event.title || '') }}>
                    <EventIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={event.title}
                  secondary={new Date(event.startDate || event.date).toLocaleDateString()}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No upcoming events"
                secondary="Check back later for new events"
              />
            </ListItem>
          )}
        </List>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => navigate('/events')}
          sx={{ mt: 1 }}
        >
          See All Events
        </Button>
      </CardContent>
    </Card>
  );
};

// Sidebar component for suggested groups
const SuggestedGroups = ({ groups, onJoinGroup }) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Suggested Groups
        </Typography>
        <List>
          {Array.isArray(groups) && groups.length > 0 ? (
            groups.map((group) => (
              <ListItem key={group._id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(group.name || '') }}>
                    <GroupIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={group.name}
                  secondary={`${group.memberCount || 0} members`}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onJoinGroup(group._id)}
                >
                  Join
                </Button>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No suggested groups"
                secondary="Join some groups to see suggestions"
              />
            </ListItem>
          )}
        </List>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => navigate('/groups')}
          sx={{ mt: 1 }}
        >
          Explore Groups
        </Button>
      </CardContent>
    </Card>
  );
};

// Post card component
const PostCard = ({ post, onLike, onComment, onShare }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Avatar 
              src={post.author.avatar}
              sx={{ bgcolor: getAvatarColor(post.author.name), mr: 2 }}
            >
              {post.author.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{post.author.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelativeTime(new Date(post.createdAt))}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Typography variant="h6" sx={{ mt: 2 }}>
          {post.title}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {post.body}
        </Typography>
        {post.image && (
          <Box
            component="img"
            src={post.image}
            sx={{
              width: '100%',
              borderRadius: 1,
              mt: 2
            }}
          />
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={post.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          onClick={() => onLike(post._id)}
        >
          {post.likes} Like{post.likes !== 1 && 's'}
        </Button>
        <Button
          size="small"
          startIcon={<CommentIcon />}
          onClick={() => onComment(post._id)}
        >
          {post.comments} Comment{post.comments !== 1 && 's'}
        </Button>
        <Button
          size="small"
          startIcon={<ShareIcon />}
          onClick={() => onShare(post._id)}
        >
          Share
        </Button>
      </CardActions>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>Edit</MenuItem>
        <MenuItem onClick={handleClose}>Delete</MenuItem>
        <MenuItem onClick={handleClose}>Report</MenuItem>
      </Menu>
    </Card>
  );
};

// Main Timeline component
const Timeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsData, eventsData, groupsData] = await Promise.all([
          postAPI.getPosts({ sort: '-createdAt' }),
          eventAPI.getEvents({ filter: 'upcoming', limit: 5 }),
          groupAPI.getGroups({ filter: 'suggested', limit: 5 })
        ]);
        
        // Ensure we're getting the posts array from the response
        const postsArray = Array.isArray(postsData?.data) ? postsData.data : 
                          postsData?.data?.posts || [];
        
        setPosts(postsArray);
        setEvents(eventsData?.data || []);
        setGroups(groupsData?.data || []);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCreatePost = () => {
    setCreatePostOpen(true);
  };

  const handleLikePost = async (postId) => {
    try {
      await postAPI.likePost(postId);
      setPosts(posts.map(post => 
        post._id === postId
          ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupAPI.joinGroup(groupId);
      setGroups(groups.filter(group => group._id !== groupId));
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <Paper
              sx={{ p: 2, cursor: 'pointer' }}
              onClick={() => setCreatePostOpen(true)}
            >
              <Box display="flex" alignItems="center">
                <Avatar 
                  src={user?.avatar}
                  sx={{ mr: 2, bgcolor: getAvatarColor(user?.name || '') }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="What's on your mind?"
                  InputProps={{
                    readOnly: true,
                    sx: { cursor: 'pointer' }
                  }}
                />
              </Box>
            </Paper>
          </Box>
          
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLikePost}
                onComment={(postId) => {/* TODO: Implement comments */}}
                onShare={(postId) => {/* TODO: Implement sharing */}}
              />
            ))
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>P</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Pavan</Typography>
                    <Typography variant="caption" color="text.secondary" gutterBottom>2 hours ago</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Just completed my certification in Cloud Computing! Looking forward to connecting with fellow alumni in the tech industry.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button startIcon={<FavoriteBorderIcon />} size="small">Like</Button>
                      <Button startIcon={<CommentIcon />} size="small">Comment</Button>
                      <Button startIcon={<ShareIcon />} size="small">Share</Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
              
              <Paper sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#388e3c', mr: 2 }}>R</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Ram</Typography>
                    <Typography variant="caption" color="text.secondary" gutterBottom>5 hours ago</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Excited to announce our upcoming Alumni Networking Event next month! Stay tuned for more details.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button startIcon={<FavoriteBorderIcon />} size="small">Like</Button>
                      <Button startIcon={<CommentIcon />} size="small">Comment</Button>
                      <Button startIcon={<ShareIcon />} size="small">Share</Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            <UpcomingEvents events={events} />
            <SuggestedGroups
              groups={groups}
              onJoinGroup={handleJoinGroup}
            />
          </Box>
        </Grid>
      </Grid>

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setCreatePostOpen(true)}
      >
        <AddIcon />
      </Fab>

      <CreatePostDialog
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
      />
    </Container>
  );
};

export default Timeline;
