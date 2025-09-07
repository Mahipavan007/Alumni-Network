import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
};

// User API
export const userAPI = {
  getProfile: (userId) => userId ? api.get(`/user/${userId}/profile`) : api.get('/user/profile'),
  updateProfile: (userId, data) => api.patch(`/user/${userId}/profile`, data),
  searchUsers: (query, params = {}) => api.get('/user/search', { params: { q: query, ...params } }),
  getUserGroups: (userId) => userId ? api.get(`/user/${userId}/groups`) : api.get('/user/groups'),
  getUserTopics: () => api.get('/user/topics'),

  // Profile Portfolio
  addPortfolioItem: (data) => api.post('/user/portfolio', data),
  updatePortfolioItem: (itemId, data) => api.put(`/user/portfolio/${itemId}`, data),
  deletePortfolioItem: (itemId) => api.delete(`/user/portfolio/${itemId}`),
  
  // Profile Experience
  addExperience: (data) => api.post('/user/experience', data),
  updateExperience: (expId, data) => api.put(`/user/experience/${expId}`, data),
  deleteExperience: (expId) => api.delete(`/user/experience/${expId}`),
  
  // Profile Education
  addEducation: (data) => api.post('/user/education', data),
  updateEducation: (eduId, data) => api.put(`/user/education/${eduId}`, data),
  deleteEducation: (eduId) => api.delete(`/user/education/${eduId}`),
  
  // Profile Skills
  addSkill: (data) => api.post('/user/skills', data),
  updateSkill: (skillId, data) => api.put(`/user/skills/${skillId}`, data),
  deleteSkill: (skillId) => api.delete(`/user/skills/${skillId}`),
  endorseSkill: (userId, skillId, data) => api.post(`/user/${userId}/skills/${skillId}/endorse`, data),
  removeEndorsement: (userId, skillId) => api.delete(`/user/${userId}/skills/${skillId}/endorse`),
  
  // Profile Achievements
  addAchievement: (data) => api.post('/user/achievements', data),
  updateAchievement: (achievementId, data) => api.put(`/user/achievements/${achievementId}`, data),
  deleteAchievement: (achievementId) => api.delete(`/user/achievements/${achievementId}`),
  
  // Profile Settings
  updateAvailability: (data) => api.patch('/user/availability', data),
  updatePrivacySettings: (data) => api.patch('/user/privacy', data),
  updateNotificationPreferences: (data) => api.patch('/user/notifications', data),
  
  // Profile Media
  uploadProfilePicture: (formData) => api.post('/user/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadCoverPicture: (formData) => api.post('/user/cover-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadPortfolioImage: (itemId, formData) => api.post(`/user/portfolio/${itemId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Group API
export const groupAPI = {
  getGroups: (params = {}) => api.get('/group', { params }),
  getGroup: (groupId) => api.get(`/group/${groupId}`),
  createGroup: (data) => api.post('/group', data),
  joinGroup: (groupId, userId) => api.post(`/group/${groupId}/join`, userId ? { user_id: userId } : {}),
  leaveGroup: (groupId) => api.delete(`/group/${groupId}/leave`),
  getMembers: (groupId, params = {}) => api.get(`/group/${groupId}/members`, { params }),
  getUserGroups: () => api.get('/user/groups')
};

// Topic API
export const topicAPI = {
  getTopics: (params = {}) => api.get('/topic', { params }),
  getTopic: (topicId) => api.get(`/topic/${topicId}`),
  createTopic: (data) => api.post('/topic', data),
  subscribeTopic: (topicId) => api.post(`/topic/${topicId}/join`),
  unsubscribeTopic: (topicId) => api.delete(`/topic/${topicId}/unsubscribe`),
  getSubscribers: (topicId, params = {}) => api.get(`/topic/${topicId}/subscribers`, { params }),
  getCategories: () => api.get('/topic/meta/categories'),
  getUserTopics: () => api.get('/user/topics')
};

// Post API
export const postAPI = {
  getPosts: (params = {}) => api.get('/post', { params }),
  getUserPosts: (params = {}) => api.get('/post/user', { params }),
  getConversation: (userId, params = {}) => api.get(`/post/user/${userId}`, { params }),
  getGroupPosts: (groupId, params = {}) => api.get(`/post/group/${groupId}`, { params }),
  getTopicPosts: (topicId, params = {}) => api.get(`/post/topic/${topicId}`, { params }),
  getThread: (postId) => api.get(`/post/${postId}/thread`),
  createPost: (data) => api.post('/post', data),
  updatePost: (postId, data) => api.put(`/post/${postId}`, data),
  likePost: (postId) => api.post(`/post/${postId}/like`)
};

// Event API
export const eventAPI = {
  getEvents: (params = {}) => api.get('/event', { params }),
  getEvent: (eventId) => api.get(`/event/${eventId}`),
  createEvent: (data) => api.post('/event', data),
  updateEvent: (eventId, data) => api.put(`/event/${eventId}`, data),
  rsvpToEvent: (eventId, { status }) => api.post(`/event/${eventId}/rsvp`, { status }),
  getAttendees: (eventId, params = {}) => api.get(`/event/${eventId}/attendees`, { params }),
  getUserEvents: () => api.get('/event', { params: { filter: 'user' } }),
  getUserRSVPs: () => api.get('/event', { params: { filter: 'rsvp' } })
};

// Resource API
export const resourceAPI = {
  getResources: (params = {}) => api.get('/resource', { params }),
  getResource: (resourceId) => api.get(`/resource/${resourceId}`),
  createResource: (data) => api.post('/resource', data),
  updateResource: (resourceId, data) => api.put(`/resource/${resourceId}`, data),
  deleteResource: (resourceId) => api.delete(`/resource/${resourceId}`),
  likeResource: (resourceId) => api.post(`/resource/${resourceId}/like`),
  bookmarkResource: (resourceId) => api.post(`/resource/${resourceId}/bookmark`),
  trackResourceDownload: (resourceId) => api.post(`/resource/${resourceId}/download`),
  getFeaturedResources: (params = {}) => api.get('/resource/featured', { params }),
  getBookmarkedResources: (params = {}) => api.get('/resource/bookmarked', { params }),
  getUserResources: (userId, params = {}) => api.get(`/resource/user/${userId}`, { params }),
  getGroupResources: (groupId, params = {}) => api.get(`/resource/group/${groupId}`, { params }),
  addComment: (resourceId, data) => api.post(`/resource/${resourceId}/comment`, data),
  getComments: (resourceId, params = {}) => api.get(`/resource/${resourceId}/comments`, { params })
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId, params = {}) => 
    api.get(`/conversations/${conversationId}/messages`, { params }),
  startConversation: (userId) => api.post('/conversations', { userId }),
  sendMessage: (conversationId, data) => 
    api.post(`/conversations/${conversationId}/messages`, data),
  editMessage: (messageId, data) => api.put(`/messages/${messageId}`, data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};

// Job API
export const jobAPI = {
  getJobs: (params = {}) => api.get('/job', { params }),
  getJob: (jobId) => api.get(`/job/${jobId}`),
  createJob: (data) => api.post('/job', data),
  updateJob: (jobId, data) => api.put(`/job/${jobId}`, data),
  deleteJob: (jobId) => api.delete(`/job/${jobId}`),
  applyForJob: (jobId, data) => api.post(`/job/${jobId}/apply`, data),
  getApplications: (jobId, params = {}) => api.get(`/job/${jobId}/applications`, { params }),
  updateApplication: (jobId, applicationId, data) => 
    api.put(`/job/${jobId}/applications/${applicationId}`, data)
};

// Mentorship API functions
api.getMentorships = () => api.get('/mentorship');

api.getMentorshipById = (id) => api.get(`/mentorship/${id}`);

api.requestMentorship = (data) => api.post('/mentorship/request', data);

api.updateMentorshipStatus = (id, status, reason) => 
  api.patch(`/mentorship/${id}/status`, { status, reason });

api.addProgress = (id, data) => api.post(`/mentorship/${id}/progress`, data);

api.scheduleMeeting = (id, data) => api.post(`/mentorship/${id}/meeting`, data);

api.addResource = (id, data) => api.post(`/mentorship/${id}/resources`, data);

api.submitFeedback = (id, data) => api.post(`/mentorship/${id}/feedback`, data);

api.getMentors = () => api.get('/users/mentors');

api.getSkills = () => api.get('/skills');

// Notification API functions
api.getNotifications = () => api.get('/notifications');

api.getUnreadNotificationCount = () => api.get('/notifications/unread/count');

api.markNotificationAsRead = (id) => api.patch(`/notifications/${id}/read`);

api.markAllNotificationsAsRead = () => api.post('/notifications/read/all');

api.deleteNotification = (id) => api.delete(`/notifications/${id}`);

api.getNotificationsByType = (type) => api.get(`/notifications/type/${type}`);

api.getRelatedNotifications = (model, id) => 
  api.get(`/notifications/related/${model}/${id}`);

// Resource API functions
api.getResources = (params) => api.get('/resources', { params });

api.getFeaturedResources = () => api.get('/resources/featured');

api.getResourceById = (id) => api.get(`/resources/${id}`);

api.createResource = (data) => api.post('/resources', data);

api.updateResource = (id, data) => api.patch(`/resources/${id}`, data);

api.deleteResource = (id) => api.delete(`/resources/${id}`);

api.likeResource = (id) => api.post(`/resources/${id}/like`);

api.commentOnResource = (id, content) => api.post(`/resources/${id}/comments`, { content });

api.trackResourceDownload = (id) => api.post(`/resources/${id}/download`);

export default api;
