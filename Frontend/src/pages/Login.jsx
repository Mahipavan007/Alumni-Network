import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Link, 
  Alert,
  IconButton,
  InputAdornment,
  Container,
  Paper
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  School as SchoolIcon 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';
import { validateEmail } from '../utils/helpers';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loading, clearError: clearAuthError } = useAuth();
  const { showError, clearError } = useError();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
  // Always clear general error on change
  clearError();
  clearAuthError();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    
    // Show first error if any
    const errorMessages = Object.values(newErrors);
    if (errorMessages.length > 0) {
      showError(errorMessages[0]);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      showError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #00C851 0%, #4CAF50 50%, #81C784 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          className="enhanced-card"
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #00C851 0%, #4CAF50 100%)',
              p: { xs: 3, sm: 4 },
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #00C851, #4CAF50, #81C784)'
              }
            }}
          >
            <SchoolIcon sx={{ fontSize: { xs: 40, sm: 48 }, mb: 2 }} />
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.95,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Sign in to your SITER Alumni account
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                className="enhanced-textfield"
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                margin="normal"
                autoComplete="email"
                autoFocus
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2
                    }
                  }
                }}
              />

              <TextField
                className="enhanced-textfield"
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                margin="normal"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2
                    }
                  }
                }}
              />

              <Button
                className="gradient-button"
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 2,
                  mb: 3,
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,200,81,0.3)',
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)'
                  }
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box textAlign="center">
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Don't have an account?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/register" 
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.dark'
                      },
                      transition: 'color 0.2s ease'
                    }}
                  >
                    Create one here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card
          className="enhanced-card"
          sx={{
            mt: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Demo Credentials
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                color: 'text.secondary',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Use these credentials to explore the application:
            </Typography>
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0,200,81,0.1)',
                  padding: '8px 12px',
                  borderRadius: 2,
                  color: 'primary.dark',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Email: demo@siter.edu
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0,200,81,0.1)',
                  padding: '8px 12px',
                  borderRadius: 2,
                  color: 'primary.dark',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Password: Demo123!
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;

// MUI Grid v2 migration: Remove item, xs, md props from Grid components and use new layout system
// Example: <Grid item xs={12} md={6}> becomes <Grid columns={12} width={{ md: 6 }}>
