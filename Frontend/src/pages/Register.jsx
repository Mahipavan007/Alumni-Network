import React, { useState } from 'react';
import { Grid, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    graduationYear: '',
    major: '',
    skills: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showError, showSuccess } = useError();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('First name and last name are required');
      return;
    }
    if (!validateEmail(formData.email)) {
      showError('Please enter a valid email address');
      return;
    }
    if (!validatePassword(formData.password)) {
      showError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (!formData.graduationYear) {
      showError('Graduation year is required');
      return;
    }
    if (!formData.major) {
      showError('Major is required');
      return;
    }
    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        showSuccess('Account created successfully! Welcome to our alumni network.');
        navigate('/login');
      } else {
        showError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      showError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh' }}>
      <Grid item xs={12} sm={8} md={6} lg={4}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h4" align="center" gutterBottom>
            Register
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Graduation Year"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Major"
                name="major"
                value={formData.major}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Skills (comma separated)"
                name="skills"
                value={formData.skills}
                onChange={e => setFormData(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()) }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                style={{ marginTop: '16px' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>
    </Grid>
  );
};

export default Register;
