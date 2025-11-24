/**
 * Activity Analytics Dashboard
 * 
 * Real-time analytics dashboard for the Firestore-based activity logging system.
 * Uses live Firestore listeners for automatic updates - no manual refresh needed.
 * Replaces the external LoggingDashboard with direct Firestore integration.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  Skeleton,
  Divider,
  Button,
  LinearProgress,
  Paper,
  Stack
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  FiberManualRecord as LiveIcon
} from '@mui/icons-material';
import { useActivityFeed } from '../../hooks/useActivity';
import { useAuth } from '../../utils/AuthContext';
import { defaultActivityFilter } from '../../utils/ActivityFilter';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_SEVERITY,
  getActivityDescription
} from '../../constants/activityTypes';
import { PageTitle, MetricValue } from '../../utils/typography';

const ActivityAnalytics = () => {
  const { currentOrganization } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [timeRange, setTimeRange] = useState('24h');

  const organizationId = currentOrganization?.organization_id;
  const { activities, loading, error } = useActivityFeed(organizationId, 100);

  // Calculate analytics from activities using unified filtering
  const analytics = useMemo(() => {
    // Always return analytics object, even for empty arrays
    const hasRawActivities = activities.length > 0;
    
    // Use unified filtering for consistent results with NotificationDropdown
    const filteredActivities = hasRawActivities 
      ? defaultActivityFilter.getAnalyticsActivities(activities, {
          timeRange,
          organizationId
        })
      : [];

    // Debug logging to identify discrepancies
    const debugInfo = defaultActivityFilter.debugFiltering(activities, {
      timeRange,
      organizationId,
      userRelevantOnly: true
    });
    
    console.log('📊 ActivityAnalytics Filtering Debug:', {
      ...debugInfo,
      timeRange,
      organizationId,
      finalCount: filteredActivities.length
    });

    // Calculate metrics
    const total_activities = filteredActivities.length;
    
    const activities_by_category = Object.values(ACTIVITY_CATEGORIES).reduce((acc, category) => {
      acc[category] = filteredActivities.filter(a => a.metadata?.category === category).length;
      return acc;
    }, {});

    const activities_by_severity = Object.values(ACTIVITY_SEVERITY).reduce((acc, severity) => {
      acc[severity] = filteredActivities.filter(a => a.metadata?.severity === severity).length;
      return acc;
    }, {});

    const top_actors = filteredActivities.reduce((acc, activity) => {
      const actor = activity.actorName || 'Unknown';
      acc[actor] = (acc[actor] || 0) + 1;
      return acc;
    }, {});

    const top_resources = filteredActivities.reduce((acc, activity) => {
      const resource = activity.resourceName || activity.resource_id || 'Unknown';
      acc[resource] = (acc[resource] || 0) + 1;
      return acc;
    }, {});

    const activity_types = filteredActivities.reduce((acc, activity) => {
      const type = activity.activity_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total_activities,
      activities_by_category,
      activities_by_severity,
      top_actors,
      top_resources,
      activity_types,
      error_rate: (activities_by_severity.error || 0) + (activities_by_severity.critical || 0),
      success_rate: (activities_by_severity.info || 0) + (activities_by_severity.success || 0),
      // Additional context for empty states
      has_raw_activities: hasRawActivities,
      filtered_activities_count: filteredActivities.length,
      time_range: timeRange,
      organization_id: organizationId
    };
  }, [activities, timeRange, organizationId]);

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      case 'success': return <CheckCircleIcon />;
      default: return <InfoIcon />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'agent': return <SmartToyIcon />;
      case 'project': return <AssignmentIcon />;
      case 'user': return <PersonIcon />;
      case 'organization': return <BusinessIcon />;
      default: return <TimelineIcon />;
    }
  };

  // Handle menu actions
  const handleMenuClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX - 150
    });
    setDropdownOpen(true);
  };

  const handleExportData = () => {
    try {
      const exportData = {
        organization_id: organizationId,
        exported_at: new Date().toISOString(),
        time_range: timeRange,
        analytics: analytics,
        activities: activities.slice(0, 50) // Limit export size
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-analytics-${organizationId}-${timeRange}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setDropdownOpen(false);
  };

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    setDropdownOpen(false);
  };

  if (!organizationId) {
    return (
      <Alert severity="warning">
        Please select an organization to view activity analytics.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle component="h1">
          Activity Analytics
        </PageTitle>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={<TimelineIcon />}
            label={`Last ${timeRange}`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<VisibilityIcon />}
            label={`${defaultActivityFilter.getActivityCount(activities, { 
              timeRange: 'all', 
              organizationId, 
              userRelevantOnly: true 
            })} activities`}
            color="info"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<LiveIcon sx={{ color: 'success.main', fontSize: '12px !important' }} />}
            label="Live Updates"
            color="success"
            variant="outlined"
            size="small"
            sx={{ 
              '& .MuiChip-icon': { 
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 }
                }
              }
            }}
          />
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Custom Actions Dropdown */}
      {dropdownOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <Paper
            sx={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 1001,
              minWidth: 160,
              boxShadow: 3,
              borderRadius: 1,
              py: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleTimeRangeChange('1h')}
            >
              <FilterListIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Last Hour</Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleTimeRangeChange('24h')}
            >
              <FilterListIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Last 24 Hours</Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleTimeRangeChange('7d')}
            >
              <FilterListIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Last 7 Days</Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleTimeRangeChange('30d')}
            >
              <FilterListIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Last 30 Days</Typography>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={handleExportData}
            >
              <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Export Data</Typography>
            </Box>
          </Paper>
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load analytics: {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {/* Analytics Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AssessmentIcon />
                </Avatar>
                <Typography variant="h6">Total Activities</Typography>
              </Box>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <MetricValue>
                  {analytics?.total_activities || 0}
                </MetricValue>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <ErrorIcon />
                </Avatar>
                <Typography variant="h6">Issues</Typography>
              </Box>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <MetricValue>
                  {analytics?.error_rate || 0}
                </MetricValue>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <SmartToyIcon />
                </Avatar>
                <Typography variant="h6">Agent Activities</Typography>
              </Box>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <MetricValue>
                  {analytics?.activities_by_category?.agent || 0}
                </MetricValue>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6">User Activities</Typography>
              </Box>
              {loading ? (
                <Skeleton height={40} />
              ) : (
                <MetricValue>
                  {analytics?.activities_by_category?.user || 0}
                </MetricValue>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Activities by Category" />
            <CardContent>
              {loading ? (
                <Skeleton height={200} />
              ) : (
                <List>
                  {Object.entries(analytics?.activities_by_category || {})
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                    <ListItem key={category}>
                      <ListItemIcon>
                        {getCategoryIcon(category)}
                      </ListItemIcon>
                      <ListItemText
                        primary={category.charAt(0).toUpperCase() + category.slice(1)}
                        secondary={`${count} activities`}
                      />
                      <Chip
                        label={count}
                        color="default"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Activities by Severity" />
            <CardContent>
              {loading ? (
                <Skeleton height={200} />
              ) : (
                <List>
                  {Object.entries(analytics?.activities_by_severity || {})
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([severity, count]) => (
                    <ListItem key={severity}>
                      <ListItemIcon>
                        {getSeverityIcon(severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={severity.charAt(0).toUpperCase() + severity.slice(1)}
                        secondary={`${count} activities`}
                      />
                      <Chip
                        label={count}
                        color={getSeverityColor(severity)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Recent Activities"
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {analytics?.total_activities || 0} total
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              {error ? (
                <Box sx={{ 
                  py: 6, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
                  <Typography variant="h6" color="error.main">
                    Failed to Load Activities
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
                    We couldn't load your recent activities. Please check your connection - the data will automatically refresh when the connection is restored.
                  </Typography>
                </Box>
              ) : loading ? (
                <Box sx={{ py: 4 }}>
                  {[...Array(5)].map((_, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={16} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : analytics?.total_activities === 0 ? (
                <Box sx={{ 
                  py: 8, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <TimelineIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography variant="h6" color="text.secondary">
                    No Recent Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
                    {analytics?.has_raw_activities ? (
                      <>
                        No activities found for the <strong>{timeRange}</strong> time range. 
                        Try selecting a different time period or check back later as team members use the platform.
                      </>
                    ) : (
                      <>
                        This is where you'll see your team's activity! Activities will appear here as you and your team members 
                        login, create agents, deploy services, and use the platform features.
                      </>
                    )}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    {analytics?.has_raw_activities && (
                      <Chip 
                        size="small" 
                        label={`${activities.length} total activities available`} 
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Stack>
                  {analytics?.has_raw_activities && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Try a different time range:
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                        {['1h', '24h', '7d', '30d'].map((range) => (
                          <Button
                            key={range}
                            size="small"
                            variant={timeRange === range ? "contained" : "outlined"}
                            onClick={() => handleTimeRangeChange(range)}
                            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                          >
                            {range === '1h' ? 'Last Hour' : 
                             range === '24h' ? 'Last Day' :
                             range === '7d' ? 'Last Week' :
                             'Last Month'}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {defaultActivityFilter.getAnalyticsActivities(activities, {
                    timeRange,
                    organizationId
                  }).slice(0, 20)
                    .map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: `${getSeverityColor(activity.metadata?.severity)}.main` 
                          }}>
                            {getCategoryIcon(activity.metadata?.category)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {activity.actorName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {getActivityDescription(activity.activity_type)}
                              </Typography>
                              {activity.resourceName && (
                                <Typography variant="body2" fontWeight="medium">
                                  {activity.resourceName}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {activity.timeAgo} • {activity.metadata?.category}
                              </Typography>
                              {activity.changes && Object.keys(activity.changes).length > 0 && (
                                <Chip
                                  label={`${Object.keys(activity.changes).length} changes`}
                                  size="small"
                                  color="info"
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                        />
                        <Chip
                          label={activity.metadata?.severity || 'info'}
                          color={getSeverityColor(activity.metadata?.severity)}
                          size="small"
                        />
                      </ListItem>
                      {index < Math.min(activities.length - 1, 19) && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Actors */}
        {analytics?.top_actors && Object.keys(analytics.top_actors).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Most Active Users" />
              <CardContent>
                <List>
                  {Object.entries(analytics.top_actors)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([actor, count]) => (
                    <ListItem key={actor}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={actor}
                        secondary={`${count} activities`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top Activity Types */}
        {analytics?.activity_types && Object.keys(analytics.activity_types).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Common Activity Types" />
              <CardContent>
                <List>
                  {Object.entries(analytics.activity_types)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([type, count]) => (
                    <ListItem key={type}>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={getActivityDescription(type) || type}
                        secondary={`${count} activities`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ActivityAnalytics;