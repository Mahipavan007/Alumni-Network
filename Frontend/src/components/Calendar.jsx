import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Calendar = ({ events = [], onEventClick, onDateClick, viewOnly = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Generate calendar days for current month
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
    }
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      isSameDay(new Date(event.startDate), date)
    );
  };

  const closeEventDialog = () => {
    setSelectedEvent(null);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2 }}>
        {/* Calendar Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Calendar Grid */}
        <Grid container spacing={1}>
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs key={day}>
              <Typography variant="subtitle2" align="center">
                {day}
              </Typography>
            </Grid>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <Grid item xs key={day.toISOString()}>
                <Paper
                  elevation={isSelected ? 8 : 1}
                  sx={{
                    p: 1,
                    height: 80,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'primary.light' : isCurrentMonth ? 'background.paper' : 'action.disabledBackground',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    overflow: 'hidden'
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <Typography 
                    variant="body2"
                    sx={{
                      color: isCurrentMonth ? 'text.primary' : 'text.disabled'
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {dayEvents.map((event) => (
                    <Box
                      key={event._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        my: 0.5,
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <EventIcon sx={{ fontSize: '0.875rem' }} />
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ flex: 1 }}
                      >
                        {event.title}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onClose={closeEventDialog}>
        <DialogTitle>{selectedEvent?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>Date:</strong> {selectedEvent && format(new Date(selectedEvent.startDate), 'PPP')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Location:</strong> {selectedEvent?.location.address || selectedEvent?.location.virtualLink}
          </Typography>
          <Typography variant="body1">
            {selectedEvent?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEventDialog}>Close</Button>
          {!viewOnly && (
            <Button 
              color="primary"
              onClick={() => {
                navigate(`/events/${selectedEvent._id}`);
                closeEventDialog();
              }}
            >
              View Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;
