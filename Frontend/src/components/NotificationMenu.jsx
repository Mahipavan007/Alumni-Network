import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Topic as TopicIcon,
  Message as MessageIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Book as BookIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatRelativeTime } from '../utils/helpers';

function NotificationMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
      updateUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    updateUnreadCount();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await api.patch(`/api/notifications/${notification._id}/read`);
      updateUnreadCount();
      
      // Navigate to related content
      handleClose();
      navigate(notification.link);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/read/all');
      updateUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_invitation':
      case 'event_reminder':
        return <EventIcon color="primary" />;
      case 'group_invitation':
      case 'group_post':
        return <GroupIcon color="primary" />;
      case 'topic_post':
        return <TopicIcon color="primary" />;
      case 'message_received':
        return <MessageIcon color="primary" />;
      case 'job_application_status':
        return <WorkIcon color="primary" />;
      case 'mentorship_request':
      case 'mentorship_accepted':
      case 'mentorship_meeting':
        return <SchoolIcon color="primary" />;
      case 'resource_shared':
        return <BookIcon color="primary" />;
      default:
        return <NotificationsIcon color="primary" />;
    }
  };

  const notificationsToShow = showAll ? notifications : notifications.slice(0, 5);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: '80vh'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length > 0 ? (
          <>
            <List>
              {notificationsToShow.map((notification) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover'
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          {notification.content}
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ display: 'block', mt: 0.5 }}
                            color="text.secondary"
                          >
                            {formatRelativeTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                    {notification.read && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {notifications.length > 5 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show Less' : 'Show More'}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        )}
      </Menu>
    </>
  );
}

export default NotificationMenu;
