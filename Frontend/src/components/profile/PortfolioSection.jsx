import React, { useState } from 'react';
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
  Chip,
  CardMedia,
  CardActionArea
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  GitHub as GitHubIcon,
  Language as WebsiteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const PortfolioSection = ({ portfolio = [], onAddPortfolio, onDeletePortfolio, currentUserId, userId }) => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    type: 'project',
    technologies: [],
    url: '',
    githubUrl: '',
    images: [],
    startDate: null,
    endDate: null,
    isOngoing: false
  });

  const handleOpen = (mode = 'add', item = null) => {
    setDialogMode(mode);
    if (item) {
      setNewPortfolio(item);
      setSelectedItem(item);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewPortfolio({
      title: '',
      description: '',
      type: 'project',
      technologies: [],
      url: '',
      githubUrl: '',
      images: [],
      startDate: null,
      endDate: null,
      isOngoing: false
    });
    setSelectedItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dialogMode === 'add') {
      onAddPortfolio(newPortfolio);
    } else {
      onEditPortfolio(selectedItem._id, newPortfolio);
    }
    handleClose();
  };

  const handleTechnologyAdd = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      setNewPortfolio(prev => ({
        ...prev,
        technologies: [...prev.technologies, e.target.value]
      }));
      e.target.value = '';
    }
  };

  const handleTechnologyDelete = (techToDelete) => {
    setNewPortfolio(prev => ({
      ...prev,
      technologies: prev.technologies.filter(tech => tech !== techToDelete)
    }));
  };

  const projectTypes = [
    { value: 'project', label: 'Project' },
    { value: 'research', label: 'Research' },
    { value: 'publication', label: 'Publication' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Portfolio</Typography>
          {currentUserId === userId && (
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => handleOpen('add')}
              size="small"
            >
              Add Project
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          {portfolio.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card variant="outlined">
                <CardActionArea onClick={() => item.url && window.open(item.url, '_blank')}>
                  {item.images?.[0] && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.images[0]}
                      alt={item.title}
                    />
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {item.title}
                      </Typography>
                      {currentUserId === userId && (
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpen('edit', item);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePortfolio(index);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    
                    <Chip 
                      label={item.type.toUpperCase()}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>

                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.technologies.map((tech, techIndex) => (
                        <Chip
                          key={techIndex}
                          label={tech}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    {(item.url || item.githubUrl) && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {item.url && (
                          <Button
                            size="small"
                            startIcon={<WebsiteIcon />}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visit
                          </Button>
                        )}
                        {item.githubUrl && (
                          <Button
                            size="small"
                            startIcon={<GitHubIcon />}
                            href={item.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Code
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogMode === 'add' ? 'Add Project' : 'Edit Project'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newPortfolio.title}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newPortfolio.type}
                    label="Type"
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, type: e.target.value })}
                  >
                    {projectTypes.map(type => (
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
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Technologies (Press Enter to add)"
                  onKeyDown={handleTechnologyAdd}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {newPortfolio.technologies.map((tech, index) => (
                    <Chip
                      key={index}
                      label={tech}
                      onDelete={() => handleTechnologyDelete(tech)}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project URL"
                  value={newPortfolio.url}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, url: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GitHub URL"
                  value={newPortfolio.githubUrl}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, githubUrl: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={newPortfolio.startDate}
                    onChange={(date) => setNewPortfolio({ ...newPortfolio, startDate: date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={newPortfolio.endDate}
                    onChange={(date) => setNewPortfolio({ ...newPortfolio, endDate: date })}
                    disabled={newPortfolio.isOngoing}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PortfolioSection;
