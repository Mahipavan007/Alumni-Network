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
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HelpOutline as MaybeIcon,
  DateRange as DateRangeIcon,
  ViewList as ListIcon,
  ViewModule as CalendarViewIcon
} from '@mui/icons-material';
import Calendar from '../components/Calendar';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { eventAPI } from '../services/api';
import { formatDate, formatTime, getAvatarColor, debounce } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateEventDialog from '../components/CreateEventDialog';
const EventCard = ({ event, handleEventClick, userRSVPs, onRSVP }) => {
  const { user } = useAuth();
  const onClick = () => handleEventClick(event);
  const userResponse = userRSVPs ? userRSVPs[event._id] : null;
  
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const getRSVPIcon = () => {
    switch (userResponse) {
      case 'yes':
        return <CheckIcon color="success" />;
      case 'no':
        return <CancelIcon color="error" />;
      case 'maybe':
        return <MaybeIcon color="warning" />;
      default:
        return <PeopleIcon />;
    }
  };

  const handleRSVPClick = (e) => {
    e.stopPropagation();
    // Toggle RSVP status: null -> yes -> maybe -> no -> yes
    const nextStatus = !userResponse ? 'yes' : 
                      userResponse === 'yes' ? 'maybe' : 
                      userResponse === 'maybe' ? 'no' : 'yes';
    onRSVP(event._id, nextStatus);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 6
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" gutterBottom>
            {event.title}
          </Typography>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DateRangeIcon fontSize="small" />
            {formatDate(new Date(event.date))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TimeIcon fontSize="small" />
            {formatTime(new Date(event.date))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon fontSize="small" />
            {event.isVirtual ? 'Virtual Event' : event.location}
          </Box>
        </Typography>

        {event.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 2,
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {event.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={getRSVPIcon()}
              label={userResponse ? `RSVP: ${userResponse.toUpperCase()}` : 'RSVP'}
              onClick={handleRSVPClick}
              color={userResponse === 'yes' ? 'success' : userResponse === 'no' ? 'error' : 'default'}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {event.attendees?.length || 0} attending
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem>Share Event</MenuItem>
        {event.creator === user?._id && (
          <>
            <MenuItem>Edit Event</MenuItem>
            <MenuItem sx={{ color: 'error.main' }}>Delete Event</MenuItem>
          </>
        )}
      </Menu>
    </Card>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list');
  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [userRSVPs, setUserRSVPs] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('upcoming');
  const [category, setCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchEvents();
    fetchUserEvents();
    fetchUserRSVPs();
  }, [filterType, category, dateRange.start, dateRange.end]);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery]);

  const debouncedSearch = debounce((query) => {
    fetchEvents(query);
  }, 500);

  const fetchEvents = async (search = searchQuery) => {
    try {
      const params = {
        ...(search && { search }),
        ...(category !== 'all' && { category }),
        ...(dateRange.start && { startDate: dateRange.start.toISOString() }),
        ...(dateRange.end && { endDate: dateRange.end.toISOString() }),
        filter: filterType
      };
      
      const response = await eventAPI.getEvents(params);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    try {
      const response = await eventAPI.getUserEvents();
      setUserEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const fetchUserRSVPs = async () => {
    try {
      const response = await eventAPI.getUserRSVPs();
      const rsvpMap = {};
      if (response.data.rsvps) {
        response.data.rsvps.forEach(rsvp => {
          if (rsvp.event && rsvp.event._id) {
            rsvpMap[rsvp.event._id] = rsvp.status;
          }
        });
      }
      setUserRSVPs(rsvpMap);
    } catch (error) {
      console.error('Error fetching user RSVPs:', error);
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleEventClick = (event) => {
    navigate(`/events/${event._id}`);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const response = await eventAPI.createEvent(eventData);
      setEvents(prevEvents => [response.data.event, ...prevEvents]);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleRSVP = async (eventId, currentResponse) => {
    try {
      const newStatus = !currentResponse ? 'yes' : 
        currentResponse === 'yes' ? 'no' : 
        currentResponse === 'no' ? 'maybe' : null;
      
      if (newStatus) {
        await eventAPI.rsvpToEvent(eventId, { status: newStatus });
        setUserRSVPs(prev => ({ ...prev, [eventId]: newStatus }));
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const getUserResponse = (eventId) => userRSVPs[eventId] || null;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Events
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
            >
              <ToggleButton value="list" aria-label="list view">
                <ListIcon />
              </ToggleButton>
              <ToggleButton value="calendar" aria-label="calendar view">
                <CalendarViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Event
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="workshop">Workshop</MenuItem>
              <MenuItem value="networking">Networking</MenuItem>
              <MenuItem value="social">Social</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="academic">Academic</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date"
              value={dateRange.start}
              onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DateTimePicker
              label="End Date"
              value={dateRange.end}
              onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="filter-label">Filter</InputLabel>
            <Select
              labelId="filter-label"
              value={filterType}
              label="Filter"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Events</MenuItem>
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="past">Past Events</MenuItem>
              <MenuItem value="rsvped">My RSVPs</MenuItem>
              <MenuItem value="created">Created by Me</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {viewMode === 'calendar' ? (
        <Calendar 
          events={events}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <EventCard 
                event={event} 
                handleEventClick={handleEventClick}
                userRSVPs={userRSVPs}
                onRSVP={handleRSVP}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        selectedDate={selectedDate}
        onSubmit={handleCreateEvent}
      />
    </Container>
  );
};

export default Events;
