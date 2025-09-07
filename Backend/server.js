const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.'
});

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // More generous limit for standard API endpoints
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting
app.use('/api/auth/login', authLimiter); // Strict limit for login
app.use('/api/auth/register', authLimiter); // Strict limit for registration
app.use('/api/', standardLimiter); // Standard limit for other routes

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(require('./middleware/debug'));

// Additional rate limiters for specific endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many search requests, please try again later.'
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
  message: 'Message rate limit exceeded, please try again later.'
});

// Routes with specific rate limits
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/resource', require('./routes/resource'));
app.use('/api/user/search', searchLimiter); // Search-specific limit
app.use('/api/user', require('./routes/user-profile')); // Profile routes
app.use('/api/user', require('./routes/user')); // Other user routes
app.use('/api/event', require('./routes/event'));
app.use('/api/group', require('./routes/group'));
app.use('/api/job', require('./routes/job'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/conversations', messageLimiter, require('./routes/message')); // Message-specific limit
app.use('/api/topic', require('./routes/topic'));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_network';

console.log('Attempting to connect to MongoDB:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  // Test database connection by trying to fetch the test user
  const User = require('./models/User');
  return User.findOne({ email: 'test@example.com' })
    .then(user => {
      if (user) {
        console.log('Test user found in database');
        console.log('User details:', user);
      } else {
        console.log('Test user not found in database');
      }
    });
})
.catch(err => console.error('MongoDB connection error:', err));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Alumni Network API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
