import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Article as ArticleIcon,
  Group as GroupIcon,
  Event as EventIcon,
  Work as JobIcon,
  School as MentorIcon,
  LibraryBooks as ResourceIcon,
  Topic as TopicIcon,
  FilterList as FilterIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import SearchBar from '../components/SearchBar';
import { searchService } from '../services/searchService';
import LoadingSpinner from '../components/LoadingSpinner';

const contentTypeIcons = {
  post: ArticleIcon,
  group: GroupIcon,
  event: EventIcon,
  job: JobIcon,
  mentor: MentorIcon,
  resource: ResourceIcon,
  topic: TopicIcon
};

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  const initialState = location.state || {
    query: '',
    filters: {
      contentTypes: [],
      date: 'all',
      sort: 'relevance',
      tags: []
    }
  };

  const [searchState, setSearchState] = useState(initialState);

  useEffect(() => {
    if (searchState.query) {
      performSearch();
    }
    fetchRecommendations();
  }, [searchState]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const response = await searchService.advancedSearch({
        query: searchState.query,
        ...searchState.filters
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await searchService.getRecommendations();
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleSearch = (searchResults) => {
    setResults(searchResults);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getContentIcon = (type) => {
    const Icon = contentTypeIcons[type] || ArticleIcon;
    return <Icon />;
  };

  const renderResultCard = (result) => {
    const Icon = contentTypeIcons[result.type] || ArticleIcon;

    return (
      <Card 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
            transition: 'all 0.3s ease'
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Icon color="action" sx={{ mr: 1 }} />
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
              {result.type}
            </Typography>
          </Box>
          <Typography variant="h6" gutterBottom>
            {result.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {result.description}
          </Typography>
          {result.tags && result.tags.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {result.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          )}
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => navigate(result.link)}>
            View Details
          </Button>
          <IconButton size="small">
            <ShareIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  const filteredResults = activeTab === 'all' 
    ? Object.values(results).flat()
    : results[activeTab] || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <SearchBar
          onSearch={handleSearch}
          initialQuery={searchState.query}
          initialFilters={searchState.filters}
        />
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Search Results
              {searchState.query && (
                <Typography component="span" color="textSecondary">
                  {' '}for "{searchState.query}"
                </Typography>
              )}
            </Typography>
            
            {/* Results Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab 
                label={`All (${Object.values(results).flat().length})`}
                value="all"
              />
              {Object.entries(results).map(([type, typeResults]) => (
                <Tab
                  key={type}
                  label={`${type} (${typeResults.length})`}
                  value={type}
                  icon={getContentIcon(type)}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* Search Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchState.filters.contentTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onDelete={() => {/* Handle filter removal */}}
                  />
                ))}
                {searchState.filters.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    onDelete={() => {/* Handle tag removal */}}
                  />
                ))}
                {searchState.filters.date !== 'all' && (
                  <Chip
                    label={`Date: ${searchState.filters.date}`}
                    onDelete={() => {/* Handle date filter removal */}}
                  />
                )}
              </Box>
            </Paper>

            {/* Results Grid */}
            <Grid container spacing={3}>
              {filteredResults.map((result, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  {renderResultCard(result)}
                </Grid>
              ))}
            </Grid>

            {filteredResults.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  No results found
                </Typography>
                {recommendations.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 3 }}>
                      Recommended for you
                    </Typography>
                    <Grid container spacing={3}>
                      {recommendations.map((recommendation, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          {renderResultCard(recommendation)}
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </Container>
  );
}

export default SearchResults;
