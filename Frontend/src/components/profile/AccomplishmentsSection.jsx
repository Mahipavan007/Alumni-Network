import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const AccomplishmentsSection = ({ achievements = [], onAddAchievement, onDeleteAchievement, currentUserId, userId }) => {
  const [open, setOpen] = React.useState(false);
  const [newAchievement, setNewAchievement] = React.useState({
    title: '',
    description: '',
    date: null,
    type: 'award',
    url: ''
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewAchievement({
      title: '',
      description: '',
      date: null,
      type: 'award',
      url: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddAchievement(newAchievement);
    handleClose();
  };

  const achievementTypes = [
    { value: 'award', label: 'Award' },
    { value: 'certification', label: 'Certification' },
    { value: 'publication', label: 'Publication' },
    { value: 'project', label: 'Project' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Accomplishments</Typography>
          {currentUserId === userId && (
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleOpen}
              size="small"
            >
              Add Accomplishment
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          {achievements.map((achievement, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" component="div" gutterBottom>
                        {achievement.title}
                      </Typography>
                      <Chip 
                        label={achievement.type.toUpperCase()}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                      {achievement.date && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {format(new Date(achievement.date), 'MMMM yyyy')}
                        </Typography>
                      )}
                      {achievement.url && (
                        <Button 
                          href={achievement.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          View Details
                        </Button>
                      )}
                    </Box>
                    {currentUserId === userId && (
                      <IconButton
                        size="small"
                        onClick={() => onDeleteAchievement(index)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add Accomplishment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newAchievement.type}
                    label="Type"
                    onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value })}
                  >
                    {achievementTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={newAchievement.date}
                    onChange={(date) => setNewAchievement({ ...newAchievement, date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL (optional)"
                  value={newAchievement.url}
                  onChange={(e) => setNewAchievement({ ...newAchievement, url: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">Add</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AccomplishmentsSection;
