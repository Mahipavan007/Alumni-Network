import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  FormHelperText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { eventAPI, groupAPI, topicAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { debounce } from '../utils/helpers';

const CreateEventDialog = ({ open, onClose, onSubmit, selectedDate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: selectedDate || null,
    location: '',
    isVirtual: false,
    maxAttendees: '',
    invitedGroups: [],
    invitedTopics: [],
    invitedUsers: []
  });

  const [groups, setGroups] = useState([]);
  const [topics, setTopics] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({
    groups: false,
    topics: false,
    users: false
  });

  useEffect(() => {
    if (open) {
      fetchGroups();
      fetchTopics();
    }
  }, [open]);

  const fetchGroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    try {
      const response = await groupAPI.getUserGroups();
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const fetchTopics = async () => {
    setLoading(prev => ({ ...prev, topics: true }));
    try {
      const response = await topicAPI.getUserTopics();
      setTopics(response.data.topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(prev => ({ ...prev, topics: false }));
    }
  };

  const searchUsersDebounced = debounce(async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await userAPI.searchUsers({ query });
      setSearchResults(response.data.users.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, 300);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
      invitedGroups: formData.invitedGroups.map(g => g._id),
      invitedTopics: formData.invitedTopics.map(t => t._id),
      invitedUsers: formData.invitedUsers.map(u => u._id)
    };
    onSubmit(submitData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      date: null,
      location: '',
      isVirtual: false,
      maxAttendees: '',
      invitedGroups: [],
      invitedTopics: [],
      invitedUsers: []
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Event</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Event Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
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
            
            <DateTimePicker
              label="Date & Time"
              value={formData.date}
              onChange={(value) => handleChange('date', value)}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              minDateTime={new Date()}
            />
            
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth
              helperText="Enter venue address or 'Online' for virtual events"
            />
            
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.isVirtual ? 'virtual' : 'physical'}
                onChange={(e) => handleChange('isVirtual', e.target.value === 'virtual')}
                label="Event Type"
              >
                <MenuItem value="physical">In-Person Event</MenuItem>
                <MenuItem value="virtual">Virtual Event</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Max Attendees (Optional)"
              value={formData.maxAttendees}
              onChange={(e) => handleChange('maxAttendees', e.target.value)}
              type="number"
              fullWidth
              helperText="Leave empty for unlimited attendance"
            />

            <Autocomplete
              multiple
              options={groups}
              value={formData.invitedGroups}
              onChange={(_, newValue) => handleChange('invitedGroups', newValue)}
              getOptionLabel={(option) => option.name}
              loading={loading.groups}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invite Groups"
                  helperText="Select groups to invite to this event"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option._id}
                  />
                ))
              }
            />

            <Autocomplete
              multiple
              options={topics}
              value={formData.invitedTopics}
              onChange={(_, newValue) => handleChange('invitedTopics', newValue)}
              getOptionLabel={(option) => option.name}
              loading={loading.topics}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invite Topics"
                  helperText="Select topics to invite to this event"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option._id}
                  />
                ))
              }
            />

            <Autocomplete
              multiple
              options={searchResults}
              value={formData.invitedUsers}
              onChange={(_, newValue) => handleChange('invitedUsers', newValue)}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              onInputChange={(_, newValue) => {
                setSearchUsers(newValue);
                searchUsersDebounced(newValue);
              }}
              loading={loading.users}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invite Users"
                  helperText="Search and select users to invite directly"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={`${option.firstName} ${option.lastName}`}
                    {...getTagProps({ index })}
                    key={option._id}
                  />
                ))
              }
            />
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.title || !formData.description || !formData.date}
        >
          Create Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventDialog;
