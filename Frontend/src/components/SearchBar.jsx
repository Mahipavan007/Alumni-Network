import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Popper,
  Fade,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Article as ArticleIcon,
  Group as GroupIcon,
  Event as EventIcon,
  Work as JobIcon,
  School as MentorIcon,
  LibraryBooks as ResourceIcon,
  Topic as TopicIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../utils/helpers';
import searchService from '../services/searchService';

const contentTypeIcons = {
  post: ArticleIcon,
  group: GroupIcon,
  event: EventIcon,
  job: JobIcon,
  mentor: MentorIcon,
  resource: ResourceIcon,
  topic: TopicIcon
};

const SearchBar = ({ onSearch, placeholder = "Search...", fullWidth = true }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    contentTypes: [],
    date: 'all',
    sort: 'relevance',
    tags: []
  });
  const [trendingTags, setTrendingTags] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const fetchSuggestions = debounce(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await searchService.getSuggestions(searchQuery);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  const fetchTrendingTags = async () => {
    try {
      const response = await searchService.getTrendingTags();
      setTrendingTags(response.data);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  useEffect(() => {
    fetchTrendingTags();
  }, []);

  useEffect(() => {
    if (query) {
      fetchSuggestions(query);
      setAnchorEl(inputRef.current);
    } else {
      setSuggestions([]);
      setAnchorEl(null);
    }
  }, [query]);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    try {
      const response = await searchService.advancedSearch({
        query: searchQuery,
        ...filters
      });
      
      if (onSearch) {
        onSearch(response.data);
      }
      
      // Navigate to search results page
      navigate('/search', { 
        state: { 
          results: response.data,
          query: searchQuery,
          filters 
        } 
      });
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
      setAnchorEl(null);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
    setAnchorEl(null);
  };

  const handleTagClick = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    setFilters({ ...filters, tags: newTags });
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', position: 'relative' }}>
      <TextField
        fullWidth={fullWidth}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        inputRef={inputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: loading ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setQuery('')}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ) : (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShowAdvancedSearch(true)}>
                <FilterIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
      />

      <Popper
        open={open && (suggestions.length > 0 || trendingTags.length > 0)}
        anchorEl={anchorEl}
        placement="bottom-start"
        transition
        sx={{ width: anchorEl?.clientWidth, zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper elevation={3} sx={{ mt: 1, maxHeight: 400, overflow: 'auto' }}>
              {suggestions.length > 0 && (
                <>
                  <List dense>
                    {suggestions.map((suggestion, index) => {
                      const Icon = contentTypeIcons[suggestion.type] || ArticleIcon;
                      return (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <ListItemIcon>
                            <Icon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={suggestion.text}
                            secondary={suggestion.description}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                  <Divider />
                </>
              )}

              {trendingTags.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    <TrendingIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Trending Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {trendingTags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={`#${tag.name}`}
                        size="small"
                        onClick={() => handleTagClick(tag.name)}
                        color={filters.tags.includes(tag.name) ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>

      {/* Advanced Search Dialog */}
      <Dialog
        open={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Advanced Search</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Content Types */}
            <FormGroup row>
              <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>
                Content Types
              </Typography>
              {Object.entries(contentTypeIcons).map(([type, Icon]) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={filters.contentTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.contentTypes, type]
                          : filters.contentTypes.filter(t => t !== type);
                        handleFilterChange('contentTypes', newTypes);
                      }}
                      icon={<Icon />}
                      checkedIcon={<Icon color="primary" />}
                    />
                  }
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  sx={{ width: '33%' }}
                />
              ))}
            </FormGroup>

            {/* Date Filter */}
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.date}
                label="Date Range"
                onChange={(e) => handleFilterChange('date', e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Past Week</MenuItem>
                <MenuItem value="month">Past Month</MenuItem>
                <MenuItem value="year">Past Year</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Order */}
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sort}
                label="Sort By"
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="popularity">Popularity</MenuItem>
              </Select>
            </FormControl>

            {/* Selected Tags */}
            {filters.tags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {filters.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={`#${tag}`}
                      onDelete={() => handleTagClick(tag)}
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdvancedSearch(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleSearch();
              setShowAdvancedSearch(false);
            }}
          >
            Search
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchBar;
