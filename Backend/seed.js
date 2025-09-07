const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Group = require('./models/Group');
const Topic = require('./models/Topic');
const GroupMembership = require('./models/GroupMembership');
const TopicSubscription = require('./models/TopicSubscription');
const Post = require('./models/Post');
const Event = require('./models/Event');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_network';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Group.deleteMany({});
    await Topic.deleteMany({});
    await GroupMembership.deleteMany({});
    await TopicSubscription.deleteMany({});
    await Post.deleteMany({});
    await Event.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        graduationYear: 2020,
        course: 'Fullstack Development',
        workStatus: 'Software Developer at TechCorp',
        bio: 'Passionate full-stack developer with expertise in React and Node.js',
        funFact: 'I once debugged code for 12 hours straight!',
        location: 'Oslo, Norway',
        profilePicture: 'https://via.placeholder.com/150'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        graduationYear: 2021,
        course: 'Frontend Development',
        workStatus: 'UI/UX Designer at DesignStudio',
        bio: 'Creative designer who loves turning ideas into beautiful interfaces',
        funFact: 'I collect vintage typography books',
        location: 'Bergen, Norway',
        profilePicture: 'https://via.placeholder.com/150'
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        password: 'password123',
        graduationYear: 2019,
        course: 'Backend Development',
        workStatus: 'Senior Backend Engineer at CloudTech',
        bio: 'Backend specialist focused on scalable systems and microservices',
        funFact: 'I built my first computer at age 12',
        location: 'Stavanger, Norway',
        profilePicture: 'https://via.placeholder.com/150'
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah@example.com',
        password: 'password123',
        graduationYear: 2022,
        course: 'Fullstack Development',
        workStatus: 'Junior Developer at StartupHub',
        bio: 'New graduate excited about learning and growing in tech',
        funFact: 'I taught myself to code while working as a barista',
        location: 'Trondheim, Norway',
        profilePicture: 'https://via.placeholder.com/150'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users');

    // Create groups
    const groups = [
      {
        name: 'SITER Fullstack Alumni',
        description: 'Connect with fellow fullstack development graduates',
        creator: createdUsers[0]._id,
        category: 'academic',
        tags: ['fullstack', 'coding', 'alumni'],
        isPrivate: false
      },
      {
        name: 'React Developers',
        description: 'Share React tips, tricks, and job opportunities',
        creator: createdUsers[1]._id,
        category: 'professional',
        tags: ['react', 'frontend', 'javascript'],
        isPrivate: false
      },
      {
        name: 'Career Network',
        description: 'Professional networking and career opportunities',
        creator: createdUsers[2]._id,
        category: 'professional',
        tags: ['jobs', 'networking', 'career'],
        isPrivate: false
      }
    ];

    const createdGroups = await Group.insertMany(groups);
    console.log('Created groups');

    // Create topics
    const topics = [
      {
        name: 'JavaScript',
        description: 'Everything about JavaScript programming',
        creator: createdUsers[0]._id,
        category: 'technology',
        tags: ['javascript', 'programming', 'web'],
        color: '#f7df1e'
      },
      {
        name: 'Career Advice',
        description: 'Tips and advice for advancing your career',
        creator: createdUsers[2]._id,
        category: 'career',
        tags: ['career', 'advice', 'professional'],
        color: '#2196f3'
      },
      {
        name: 'Tech News',
        description: 'Latest news and trends in technology',
        creator: createdUsers[1]._id,
        category: 'technology',
        tags: ['news', 'technology', 'trends'],
        color: '#ff5722'
      }
    ];

    const createdTopics = await Topic.insertMany(topics);
    console.log('Created topics');

    // Create group memberships
    const memberships = [];
    // Add creators as admins
    createdGroups.forEach((group, index) => {
      memberships.push({
        user: group.creator,
        group: group._id,
        role: 'admin'
      });
    });

    // Add other users as members
    createdUsers.forEach(user => {
      createdGroups.forEach(group => {
        if (group.creator.toString() !== user._id.toString()) {
          memberships.push({
            user: user._id,
            group: group._id,
            role: 'member'
          });
        }
      });
    });

    await GroupMembership.insertMany(memberships);
    console.log('Created group memberships');

    // Update group member counts
    for (const group of createdGroups) {
      const memberCount = await GroupMembership.countDocuments({
        group: group._id,
        isActive: true
      });
      group.memberCount = memberCount;
      await group.save();
    }

    // Create topic subscriptions
    const subscriptions = [];
    // Add creators as subscribers
    createdTopics.forEach(topic => {
      subscriptions.push({
        user: topic.creator,
        topic: topic._id
      });
    });

    // Add other users as subscribers
    createdUsers.forEach(user => {
      createdTopics.forEach(topic => {
        if (topic.creator.toString() !== user._id.toString()) {
          subscriptions.push({
            user: user._id,
            topic: topic._id
          });
        }
      });
    });

    await TopicSubscription.insertMany(subscriptions);
    console.log('Created topic subscriptions');

    // Update topic subscriber counts
    for (const topic of createdTopics) {
      const subscriberCount = await TopicSubscription.countDocuments({
        topic: topic._id,
        isActive: true
      });
      topic.subscriberCount = subscriberCount;
      await topic.save();
    }

    // Create some posts
    const posts = [
      {
        title: 'Welcome to SITER Alumni Network!',
        body: 'Welcome everyone to our new alumni network! This is a great place to stay connected, share experiences, and help each other grow in our careers. Feel free to introduce yourselves and share what you\'re working on.',
        author: createdUsers[0]._id,
        targetType: 'group',
        targetId: createdGroups[0]._id,
        targetModel: 'Group',
        tags: ['welcome', 'introduction']
      },
      {
        title: 'React 18 New Features',
        body: 'Just explored the new features in React 18. The automatic batching and concurrent features are game-changers! Has anyone else tried implementing these in production?',
        author: createdUsers[1]._id,
        targetType: 'group',
        targetId: createdGroups[1]._id,
        targetModel: 'Group',
        tags: ['react', 'features', 'react18']
      },
      {
        title: 'Job Opening: Senior Developer',
        body: 'My company is looking for a senior full-stack developer. Great benefits, remote work options, and working with cutting-edge tech. DM me if interested!',
        author: createdUsers[2]._id,
        targetType: 'group',
        targetId: createdGroups[2]._id,
        targetModel: 'Group',
        tags: ['job', 'hiring', 'senior']
      },
      {
        title: 'Tips for First Job Interview',
        body: 'As a recent graduate, I\'m nervous about upcoming interviews. Any tips for technical interviews? What should I expect?',
        author: createdUsers[3]._id,
        targetType: 'topic',
        targetId: createdTopics[1]._id,
        targetModel: 'Topic',
        tags: ['interview', 'tips', 'junior']
      }
    ];

    const createdPosts = await Post.insertMany(posts);
    console.log('Created posts');

    // Create some replies
    const replies = [
      {
        title: 'Re: Welcome to SITER Alumni Network!',
        body: 'Thanks for setting this up! I\'m Jane, graduated last year and now working as a UI/UX designer. Looking forward to connecting with everyone!',
        author: createdUsers[1]._id,
        targetType: 'group',
        targetId: createdGroups[0]._id,
        targetModel: 'Group',
        parentPost: createdPosts[0]._id,
        threadRoot: createdPosts[0]._id,
        isReply: true
      },
      {
        title: 'Re: Tips for First Job Interview',
        body: 'Great question! Here are some tips: 1) Review fundamentals, 2) Practice coding problems, 3) Prepare questions about the company, 4) Be honest about what you don\'t know. You\'ve got this!',
        author: createdUsers[0]._id,
        targetType: 'topic',
        targetId: createdTopics[1]._id,
        targetModel: 'Topic',
        parentPost: createdPosts[3]._id,
        threadRoot: createdPosts[3]._id,
        isReply: true
      }
    ];

    await Post.insertMany(replies);
    console.log('Created replies');

    // Update post reply counts
    await Post.findByIdAndUpdate(createdPosts[0]._id, { replyCount: 1 });
    await Post.findByIdAndUpdate(createdPosts[3]._id, { replyCount: 1 });

    // Create some events
    const events = [
      {
        title: 'Alumni Networking Meetup',
        description: 'Join us for an informal networking session where alumni can meet, share experiences, and discuss career opportunities. Light refreshments will be provided.',
        creator: createdUsers[0]._id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
        location: {
          type: 'physical',
          address: 'SITER Academy, Oslo'
        },
        category: 'networking',
        maxAttendees: 50,
        isPrivate: false,
        tags: ['networking', 'alumni', 'meetup']
      },
      {
        title: 'React Workshop: Advanced Patterns',
        description: 'Deep dive into advanced React patterns including render props, higher-order components, and the compound component pattern. Bring your laptop!',
        creator: createdUsers[1]._id,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
        location: {
          type: 'virtual',
          virtualLink: 'https://zoom.us/j/example123'
        },
        category: 'workshop',
        maxAttendees: 25,
        isPrivate: false,
        tags: ['react', 'workshop', 'advanced']
      }
    ];

    await Event.insertMany(events);
    console.log('Created events');

    console.log('Seed data created successfully!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

seedData();
