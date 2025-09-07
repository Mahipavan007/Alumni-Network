import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Group as GroupIcon,
  School as MentorIcon,
  Work as JobIcon,
  LibraryBooks as ResourceIcon,
  Topic as TopicIcon,
  Timeline as TimelineIcon,
  BarChart as ChartIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsService } from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#00C851', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#795548'];

function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    platformStats: null,
    userEngagement: null,
    contentPerformance: null,
    userGrowth: null,
    topPerformers: null
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        platformStats,
        userEngagement,
        contentPerformance,
        userGrowth,
        topPerformers
      ] = await Promise.all([
        analyticsService.getPlatformStats(timeRange),
        analyticsService.getUserEngagement(user.id, timeRange),
        analyticsService.getContentPerformance(null, timeRange),
        analyticsService.getUserGrowthStats(timeRange),
        fetchTopPerformers()
      ]);

      setData({
        platformStats: platformStats.data,
        userEngagement: userEngagement.data,
        contentPerformance: contentPerformance.data,
        userGrowth: userGrowth.data,
        topPerformers
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async () => {
    const topContent = {
      posts: await analyticsService.getContentPerformance('post', timeRange),
      events: await analyticsService.getContentPerformance('event', timeRange),
      resources: await analyticsService.getContentPerformance('resource', timeRange),
      groups: await analyticsService.getContentPerformance('group', timeRange)
    };
    return topContent;
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleExport = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  const renderOverviewCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <PeopleIcon color="primary" />
            </Box>
            <Typography variant="h4">
              {data.platformStats?.totalUsers.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              +{data.platformStats?.userGrowth}% from last {timeRange}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Active Groups
              </Typography>
              <GroupIcon color="primary" />
            </Box>
            <Typography variant="h4">
              {data.platformStats?.activeGroups.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              {data.platformStats?.groupEngagement}% engagement rate
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Events This Month
              </Typography>
              <EventIcon color="primary" />
            </Box>
            <Typography variant="h4">
              {data.platformStats?.monthlyEvents.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              {data.platformStats?.eventParticipation}% participation rate
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Resource Downloads
              </Typography>
              <ResourceIcon color="primary" />
            </Box>
            <Typography variant="h4">
              {data.platformStats?.resourceDownloads.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              +{data.platformStats?.downloadGrowth}% from last {timeRange}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEngagementChart = () => (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="User Engagement Over Time"
        action={
          <Tooltip title="Engagement metrics include posts, comments, likes, and shares">
            <IconButton>
              <ChartIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.userEngagement?.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip />
            <Legend />
            <Line type="monotone" dataKey="posts" stroke="#00C851" />
            <Line type="monotone" dataKey="comments" stroke="#2196F3" />
            <Line type="monotone" dataKey="likes" stroke="#FF9800" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderContentDistribution = () => (
    <Card sx={{ mt: 3 }}>
      <CardHeader title="Content Distribution" />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.contentPerformance?.distribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.contentPerformance?.distribution.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderTopPerformers = () => (
    <Card sx={{ mt: 3 }}>
      <CardHeader title="Top Performing Content" />
      <CardContent>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Posts" value="posts" />
          <Tab label="Events" value="events" />
          <Tab label="Resources" value="resources" />
          <Tab label="Groups" value="groups" />
        </Tabs>
        <List>
          {data.topPerformers?.[activeTab]?.data.slice(0, 5).map((item, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                  {index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                secondary={`${item.engagementRate}% engagement rate`}
              />
              <Chip
                label={`${item.interactions} interactions`}
                color="primary"
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            variant="contained"
          >
            Export
          </Button>
        </Box>
      </Box>

      {renderOverviewCards()}
      {renderEngagementChart()}
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          {renderContentDistribution()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderTopPerformers()}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Analytics;
