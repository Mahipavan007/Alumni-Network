import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Comment as CommentIcon,
  CloudDownload as CloudDownloadIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { resourceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Resources() {
  const [resources, setResources] = useState([]);
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    visibility: 'public'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    url: '',
    tags: [],
    visibility: 'public',
    accessGroups: []
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
    fetchFeaturedResources();
  }, [page, filters]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourceAPI.getResources({
        page,
        ...filters,
        search: searchTerm
      });
      setResources(response.data.resources);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setLoading(false);
    }
  };

  const fetchFeaturedResources = async () => {
    try {
      const response = await resourceAPI.getFeaturedResources();
      setFeaturedResources(response.data);
    } catch (error) {
      console.error('Error fetching featured resources:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
  };

  const handleCreateResource = async () => {
    try {
      await resourceAPI.createResource(newResource);
      setOpenDialog(false);
      fetchResources();
      setNewResource({
        title: '',
        description: '',
        type: 'article', // Set default type
        category: 'other', // Set default category
        url: '',
        tags: [],
        visibility: 'public',
        accessGroups: []
      });
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const handleLikeResource = async (resourceId) => {
    try {
      await resourceAPI.likeResource(resourceId);
      fetchResources();
    } catch (error) {
      console.error('Error liking resource:', error);
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      await resourceAPI.trackResourceDownload(resourceId);
      // Handle download logic here
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const resourceTypes = [
    'article',
    'video',
    'document',
    'book',
    'website',
    'course',
    'tool',
    'other'
  ];

  const categories = [
    'career_development',
    'technical_skills',
    'soft_skills',
    'entrepreneurship',
    'industry_insights',
    'academic_resources',
    'research_papers',
    'alumni_publications',
    'learning_materials',
    'other'
  ];

  if (loading && page === 1) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Resource Library
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Resource
        </Button>
      </Box>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Featured Resources
          </Typography>
          <Grid container spacing={3}>
            {featuredResources.map((resource) => (
              <Grid item xs={12} sm={6} md={4} key={resource._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={resource.thumbnail || '/default-resource.jpg'}
                    alt={resource.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {resource.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {resource.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={resource.type}
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={resource.category}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/resources/${resource._id}`)}
                    >
                      Learn More
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {resourceTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={filters.visibility}
                  label="Visibility"
                  onChange={(e) => handleFilterChange('visibility', e.target.value)}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="groups">Groups</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </Box>

      {/* Resource List */}
      <Grid container spacing={3}>
        {resources.map((resource) => (
          <Grid item xs={12} sm={6} md={4} key={resource._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={resource.thumbnail || '/default-resource.jpg'}
                alt={resource.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {resource.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {resource.description}
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Chip
                    label={resource.type}
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={resource.category}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Tooltip title="Views">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{resource.views}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Downloads">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CloudDownloadIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{resource.downloads}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Likes">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ThumbUpOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{resource.likeCount}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/resources/${resource._id}`)}
                >
                  View Details
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleLikeResource(resource._id)}
                  color={resource.likes.includes(user.id) ? 'primary' : 'default'}
                >
                  {resource.likes.includes(user.id) ? (
                    <ThumbUpIcon fontSize="small" />
                  ) : (
                    <ThumbUpOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(resource._id)}
                >
                  <CloudDownloadIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            sx={{ mr: 1 }}
          >
            Previous
          </Button>
          <Typography sx={{ mx: 2, lineHeight: '36px' }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            sx={{ ml: 1 }}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Create Resource Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Resource</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={newResource.title}
              onChange={(e) => setNewResource(prev => ({
                ...prev,
                title: e.target.value
              }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newResource.description}
              onChange={(e) => setNewResource(prev => ({
                ...prev,
                description: e.target.value
              }))}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={newResource.type}
                label="Type"
                onChange={(e) => setNewResource(prev => ({
                  ...prev,
                  type: e.target.value
                }))}
              >
                {resourceTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={newResource.category}
                label="Category"
                onChange={(e) => setNewResource(prev => ({
                  ...prev,
                  category: e.target.value
                }))}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="URL"
              value={newResource.url}
              onChange={(e) => setNewResource(prev => ({
                ...prev,
                url: e.target.value
              }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={newResource.tags.join(', ')}
              onChange={(e) => setNewResource(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim())
              }))}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Visibility</InputLabel>
              <Select
                value={newResource.visibility}
                label="Visibility"
                onChange={(e) => setNewResource(prev => ({
                  ...prev,
                  visibility: e.target.value
                }))}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="groups">Groups</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateResource}
            variant="contained"
            disabled={!newResource.title || !newResource.url}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Resources;
