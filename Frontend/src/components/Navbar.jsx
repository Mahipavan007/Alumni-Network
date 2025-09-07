import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Badge,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Group as GroupIcon,
  Topic as TopicIcon,
  Event as EventIcon,
  Message as MessageIcon,
  
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarColor } from '../utils/helpers';
import NotificationMenu from './NotificationMenu';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { label: 'Timeline', icon: <HomeIcon />, path: '/' },
    { label: 'Groups', icon: <GroupIcon />, path: '/groups' },
    { label: 'Topics', icon: <TopicIcon />, path: '/topics' },
    { label: 'Events', icon: <EventIcon />, path: '/events' },
    { label: 'Messages', icon: <MessageIcon />, path: '/messages' },
    { label: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
    { label: 'Mentorship', icon: <SchoolIcon />, path: '/mentorship' },
    { label: 'Resources', icon: <LibraryBooksIcon />, path: '/resources' },
  ];

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ width: 280, height: '100%' }}>
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #00C851, #4CAF50)',
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          SITER Alumni
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Stay Connected
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.label}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white'
                },
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              },
              '&:hover': {
                backgroundColor: 'action.hover',
                borderRadius: 2
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? 'white' : 'text.secondary',
                minWidth: 40
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              sx={{ 
                '& .MuiListItemText-primary': { 
                  fontWeight: location.pathname === item.path ? 600 : 400 
                } 
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #00C851, #4CAF50)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
            onClick={() => navigate('/')}
          >
            🎓 ALUMNI NETWORK
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              {menuItems.map((item) => (
                <IconButton
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    backgroundColor: location.pathname === item.path ? 'rgba(0, 200, 81, 0.1)' : 'transparent',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 200, 81, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                  title={item.label}
                >
                  {item.icon}
                </IconButton>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationMenu />
            
            <IconButton 
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                '&:hover': {
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Avatar 
                className="enhanced-avatar"
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: getAvatarColor(user?.fullName || user?.firstName + ' ' + user?.lastName),
                  fontSize: '1rem',
                  fontWeight: 600
                }}
                src={user?.profilePicture}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
