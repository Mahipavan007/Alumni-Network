import api from './api';

export const searchService = {
  // Global search across all content types
  globalSearch: (query, filters = {}) => 
    api.get('/search', { params: { query, ...filters } }),

  // Advanced search with filters
  advancedSearch: (params) => 
    api.get('/search/advanced', { params }),

  // Tag-based search
  searchByTags: (tags, contentType) => 
    api.get('/search/tags', { params: { tags, contentType } }),

  // Search suggestions/autocomplete
  getSuggestions: (query, type) => 
    api.get('/search/suggestions', { params: { query, type } }),

  // Get trending tags
  getTrendingTags: (contentType) => 
    api.get('/search/trending-tags', { params: { contentType } }),

  // Get recommended content
  getRecommendations: (userId, contentType) => 
    api.get('/search/recommendations', { params: { userId, contentType } })
};

export default searchService;
