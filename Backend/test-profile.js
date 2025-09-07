const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';

const testProfile = async () => {
  try {
    // 1. Login to get token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    token = loginResponse.data.token;
    userId = loginResponse.data.user._id;

    console.log('✓ Login successful');

    // Set default headers for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Test adding a new skill
    const skillResponse = await axios.post(`${API_URL}/user/skills`, {
      name: 'JavaScript',
      level: 'advanced',
      category: 'technical'
    });

    console.log('✓ Skill added successfully');
    const skillId = skillResponse.data.skills[skillResponse.data.skills.length - 1]._id;

    // 3. Test adding an experience
    const experienceResponse = await axios.post(`${API_URL}/user/experience`, {
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      type: 'full-time',
      startDate: '2024-01-01',
      description: 'Full stack development',
      isCurrentPosition: true
    });

    console.log('✓ Experience added successfully');

    // 4. Test adding education
    const educationResponse = await axios.post(`${API_URL}/user/education`, {
      institution: 'Tech University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startYear: 2020,
      endYear: 2024,
      achievements: ['Dean\'s List', 'First Class Honors']
    });

    console.log('✓ Education added successfully');

    // 5. Test adding a portfolio item
    const portfolioResponse = await axios.post(`${API_URL}/user/portfolio`, {
      title: 'E-commerce Platform',
      description: 'Built a full-stack e-commerce platform',
      type: 'project',
      technologies: ['React', 'Node.js', 'MongoDB'],
      url: 'https://github.com/example/project'
    });

    console.log('✓ Portfolio item added successfully');

    // 6. Test endorsing a skill
    const endorsementResponse = await axios.post(`${API_URL}/user/${userId}/skills/${skillId}/endorse`, {
      note: 'Great JavaScript developer!'
    });

    console.log('✓ Skill endorsed successfully');

    // 7. Test updating availability
    const availabilityResponse = await axios.patch(`${API_URL}/user/availability`, {
      forMentoring: true,
      forJobOpportunities: true,
      forNetworking: true
    });

    console.log('✓ Availability updated successfully');

    console.log('\nAll tests passed successfully! ✨');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    console.error('Full error:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
  }
};

testProfile();
