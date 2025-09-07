const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Password hashing middleware
const hashPassword = async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
};

// Compare password method
const comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date
  },
  type: {
    type: String,
    enum: ['award', 'certification', 'publication', 'project', 'other'],
    default: 'other'
  },
  url: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const portfolioItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['project', 'research', 'publication', 'presentation', 'other'],
    default: 'project'
  },
  technologies: [{
    type: String,
    trim: true
  }],
  url: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isOngoing: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const skillEndorsementSchema = new mongoose.Schema({
  endorser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: ''
  },
  coverPicture: {
    type: String,
    default: ''
  },
  workStatus: {
    type: String,
    default: '',
    maxlength: 200
  },
  currentPosition: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: 1000
  },
  funFact: {
    type: String,
    default: '',
    maxlength: 300
  },
  graduationYear: {
    type: Number,
    min: 1950,
    max: new Date().getFullYear() + 10
  },
  course: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  linkedIn: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    endorsements: [skillEndorsementSchema],
    category: {
      type: String,
      enum: ['technical', 'soft', 'language', 'other'],
      default: 'technical'
    }
  }],
  achievements: [achievementSchema],
  portfolio: [portfolioItemSchema],
  experience: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    isCurrentPosition: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'freelance', 'contract'],
      default: 'full-time'
    }
  }],
  education: [{
    institution: {
      type: String,
      required: true,
      trim: true
    },
    degree: {
      type: String,
      required: true,
      trim: true
    },
    field: {
      type: String,
      required: true,
      trim: true
    },
    startYear: {
      type: Number,
      required: true
    },
    endYear: {
      type: Number
    },
    isCurrentlyStudying: {
      type: Boolean,
      default: false
    },
    achievements: [String]
  }],
  interests: [{
    type: String,
    trim: true
  }],
  availability: {
    forMentoring: {
      type: Boolean,
      default: false
    },
    forJobOpportunities: {
      type: Boolean,
      default: true
    },
    forNetworking: {
      type: Boolean,
      default: true
    }
  },
  socialLinks: {
    twitter: String,
    facebook: String,
    instagram: String,
    youtube: String,
    medium: String,
    dribbble: String,
    behance: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'alumni-only', 'connections-only'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showPhone: {
      type: Boolean,
      default: false
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
