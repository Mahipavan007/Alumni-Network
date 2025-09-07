import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  IconButton,
  Chip,
  Divider,
  TextField,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  CloudDownload as CloudDownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function ResourceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchResourceDetails();
    fetchComments();
  }, [id]);

  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getResource(id);
      setResource(response.data);
      setEditData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resource:', error);
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.getComments(id);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await api.likeResource(id);
      fetchResourceDetails();
    } catch (error) {
      console.error('Error liking resource:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await api.bookmarkResource(id);
      fetchResourceDetails();
    } catch (error) {
      console.error('Error bookmarking resource:', error);
    }
  };

  const handleDownload = async () => {
    try {
      await api.trackResourceDownload(id);
      window.open(resource.url, '_blank');
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // Show a notification or toast here
  };

  const handleSubmitComment = async () => {
    try {
      await api.addComment(id, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.updateResource(id, editData);
      setEditMode(false);
      fetchResourceDetails();
    } catch (error) {
      console.error('Error updating resource:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteResource(id);
      navigate('/resources');
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!resource) {
    return (
      <Container>
        <Typography variant="h5" color="error">Resource not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ mb: 4 }}>
        <CardMedia
          component="img"
          height="300"
          image={resource.thumbnail || '/default-resource.jpg'}
          alt={resource.title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              {editMode ? (
                <TextField
                  fullWidth
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="h4" gutterBottom>
                  {resource.title}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={resource.type} color="primary" />
                <Chip label={resource.category} variant="outlined" />
                {resource.tags.map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" size="small" />
                ))}
              </Box>
            </Box>
            
            {resource.user._id === user.id && (
              <Box>
                <IconButton onClick={() => setEditMode(!editMode)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => setDeleteDialog(true)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          {editMode ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
          ) : (
            <Typography variant="body1" paragraph>
              {resource.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleLike}>
                {resource.likes.includes(user.id) ? (
                  <ThumbUpIcon color="primary" />
                ) : (
                  <ThumbUpOutlinedIcon />
                )}
              </IconButton>
              <IconButton onClick={handleBookmark}>
                {resource.bookmarks.includes(user.id) ? (
                  <BookmarkIcon color="primary" />
                ) : (
                  <BookmarkBorderIcon />
                )}
              </IconButton>
              <IconButton onClick={handleDownload}>
                <CloudDownloadIcon />
              </IconButton>
              <IconButton onClick={handleShare}>
                <ShareIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Tooltip title="Views">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon fontSize="small" />
                  <Typography>{resource.views}</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Downloads">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudDownloadIcon fontSize="small" />
                  <Typography>{resource.downloads}</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Likes">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ThumbUpIcon fontSize="small" />
                  <Typography>{resource.likes.length}</Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>

          {editMode && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={handleUpdate}>
                Save Changes
              </Button>
              <Button onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Comments ({comments.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            multiline
            rows={2}
          />
          <IconButton 
            color="primary" 
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>

        <List>
          {comments.map((comment) => (
            <React.Fragment key={comment._id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={comment.user.avatar} alt={comment.user.name}>
                    {comment.user.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">
                        {comment.user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                  secondary={comment.content}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Resource</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this resource? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ResourceDetails;
