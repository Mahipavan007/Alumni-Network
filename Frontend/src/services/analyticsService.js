import api from './api';

export const analyticsService = {
  // User Engagement Metrics
  getUserEngagement: (userId, timeRange) => 
    api.get(`/analytics/engagement/${userId}`, { params: { timeRange } }),

  // Platform Overview Stats
  getPlatformStats: (timeRange) => 
    api.get('/analytics/platform', { params: { timeRange } }),

  // Content Performance
  getContentPerformance: (contentType, timeRange) => 
    api.get('/analytics/content', { params: { contentType, timeRange } }),

  // User Activity Timeline
  getUserActivity: (userId, timeRange) => 
    api.get(`/analytics/activity/${userId}`, { params: { timeRange } }),

  // Group Analytics
  getGroupAnalytics: (groupId, timeRange) => 
    api.get(`/analytics/group/${groupId}`, { params: { timeRange } }),

  // Event Analytics
  getEventAnalytics: (eventId) => 
    api.get(`/analytics/event/${eventId}`),

  // Resource Usage Stats
  getResourceAnalytics: (resourceId) => 
    api.get(`/analytics/resource/${resourceId}`),

  // Job Board Stats
  getJobStats: (timeRange) => 
    api.get('/analytics/jobs', { params: { timeRange } }),

  // Mentorship Program Stats
  getMentorshipStats: (timeRange) => 
    api.get('/analytics/mentorship', { params: { timeRange } }),

  // Topic Engagement
  getTopicAnalytics: (topicId, timeRange) => 
    api.get(`/analytics/topic/${topicId}`, { params: { timeRange } }),

  // User Growth
  getUserGrowthStats: (timeRange) => 
    api.get('/analytics/growth', { params: { timeRange } })
};
