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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Fab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as LeaveIcon
} from '@mui/icons-material';
import { groupAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getAvatarColor, debounce } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const GroupCard = ({ group, onJoin, onLeave, isMember }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public':
        return <PublicIcon fontSize="small" />;
      case 'private':
        return <LockIcon fontSize="small" />;
      default:
        return <GroupIcon fontSize="small" />;
    }
  };

  const getPrivacyColor = (privacy) => {
    switch (privacy) {
      case 'public':
        return 'success';
      case 'private':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Group Header */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: getAvatarColor(group.name),
                fontSize: '1.25rem'
              }}
              src={group.image}
            >
              {group.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {group.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  icon={getPrivacyIcon(group.privacy)}
                  label={group.privacy}
                  size="small"
                  color={getPrivacyColor(group.privacy)}
                  variant="outlined"
                />
                <Typography variant="caption" color="textSecondary">
                  {group.memberCount} members
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
            <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
            <MenuItem onClick={handleMenuClose}>Report</MenuItem>
            {group.createdBy === user._id && (
              <MenuItem onClick={handleMenuClose}>Manage Group</MenuItem>
            )}
          </Menu>
        </Box>

        {/* Group Description */}
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
          {group.description}
        </Typography>

        {/* Group Stats */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="caption" color="textSecondary">
              {group.memberCount} members
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary">
            Created {formatDate(group.createdAt)}
          </Typography>
        </Box>
      </CardContent>
      
      {/* Action Button */}
      <Box sx={{ p: 2, pt: 0 }}>
        {isMember ? (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LeaveIcon />}
            onClick={() => onLeave(group._id)}
          >
            Leave Group
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => onJoin(group._id)}
          >
            Join Group
          </Button>
        )}
      </Box>
    </Card>
  );
};

const CreateGroupDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ name: '', description: '', privacy: 'public' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Group</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          <TextField
            label="Group Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
          />
          
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
          />
          
          <FormControl component="fieldset">
            <FormLabel component="legend">Privacy</FormLabel>
            <RadioGroup
              value={formData.privacy}
              onChange={(e) => handleChange('privacy', e.target.value)}
            >
              <FormControlLabel 
                value="public" 
                control={<Radio />} 
                label="Public - Anyone can join" 
              />
              <FormControlLabel 
                value="private" 
                control={<Radio />} 
                label="Private - Approval required" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.name || !formData.description}
        >
          Create Group
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, []);

  const fetchGroups = async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await groupAPI.getGroups(params);
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const response = await groupAPI.getUserGroups();
      setUserGroups(response.data.groups);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const debouncedSearch = debounce((query) => {
    fetchGroups(query);
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery]);

  const handleJoinGroup = async (groupId) => {
    try {
      await groupAPI.joinGroup(groupId);
      // Refresh groups to update member count and status
      fetchGroups(searchQuery);
      fetchUserGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await groupAPI.leaveGroup(groupId);
      // Refresh groups to update member count and status
      fetchGroups(searchQuery);
      fetchUserGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      await groupAPI.createGroup(groupData);
      setCreateDialogOpen(false);
      fetchGroups(searchQuery);
      fetchUserGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const isMemberOfGroup = (groupId) => {
    return userGroups.some(group => group._id === groupId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Groups
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Connect with fellow alumni through interest-based groups
        </Typography>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search groups..."
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

      {/* My Groups Section */}
      {userGroups.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            My Groups ({userGroups.length})
          </Typography>
          <Grid container spacing={3}>
            {userGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group._id}>
                <GroupCard
                  group={group}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                  isMember={true}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* All Groups Section */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Discover Groups
        </Typography>
        
        {groups.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No groups found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to create a group for your interests!'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {groups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group._id}>
                <GroupCard
                  group={group}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                  isMember={isMemberOfGroup(group._id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create group"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 32,
          right: 32,
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </Container>
  );
};

export default Groups;
