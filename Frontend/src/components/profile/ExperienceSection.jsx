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
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ExperienceSection = ({ experience = [], onAddExperience, onDeleteExperience, currentUserId, userId }) => {
  const [open, setOpen] = React.useState(false);
  const [newExperience, setNewExperience] = React.useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    startDate: null,
    endDate: null,
    isCurrentPosition: false,
    description: ''
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewExperience({
      title: '',
      company: '',
      location: '',
      type: 'full-time',
      startDate: null,
      endDate: null,
      isCurrentPosition: false,
      description: ''
    });
  };

  const handleSubmit = () => {
    onAddExperience(newExperience);
    handleClose();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Professional Experience</Typography>
          {currentUserId === userId && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleOpen}
              variant="outlined"
              size="small"
            >
              Add Experience
            </Button>
          )}
        </Box>

        {experience.map((exp, index) => (
          <Box key={index} sx={{ mb: 3, position: 'relative' }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {exp.title}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary">
                  {exp.company} • {exp.location}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(exp.startDate).toLocaleDateString()} - 
                  {exp.isCurrentPosition ? ' Present' : 
                    exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ''}
                </Typography>
              </Grid>
              {exp.description && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    {exp.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
            {currentUserId === userId && (
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 0, right: 0 }}
                onClick={() => onDeleteExperience(exp._id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Experience</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    autoFocus
                    label="Job Title"
                    fullWidth
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Company"
                    fullWidth
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    fullWidth
                    value={newExperience.location}
                    onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Employment Type</InputLabel>
                    <Select
                      value={newExperience.type}
                      label="Employment Type"
                      onChange={(e) => setNewExperience({ ...newExperience, type: e.target.value })}
                    >
                      <MenuItem value="full-time">Full-time</MenuItem>
                      <MenuItem value="part-time">Part-time</MenuItem>
                      <MenuItem value="internship">Internship</MenuItem>
                      <MenuItem value="freelance">Freelance</MenuItem>
                      <MenuItem value="contract">Contract</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={newExperience.startDate}
                      onChange={(date) => setNewExperience({ ...newExperience, startDate: date })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={newExperience.endDate}
                      onChange={(date) => setNewExperience({ ...newExperience, endDate: date })}
                      disabled={newExperience.isCurrentPosition}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    value={newExperience.description}
                    onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!newExperience.title || !newExperience.company || !newExperience.startDate}
            >
              Add Experience
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ExperienceSection;
