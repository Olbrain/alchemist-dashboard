/**
 * Notification Dropdown Component
 * 
 * Shows recent organization activity in a dropdown from the navigation header
 */
import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  Typography,
  Box,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Grow,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  SmartToy as SmartToyIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  OpenInNew as OpenInNewIcon,
  Dashboard as DashboardIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useActivityFeed } from '../hooks/useActivity';
import { defaultActivityFilter } from '../utils/ActivityFilter';
import { 
  ACTIVITY_CATEGORIES, 
  ACTIVITY_SEVERITY,
  getActivityDescription 
} from '../constants/activityTypes';

const NotificationDropdown = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, currentOrganization } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  
  // Use the comprehensive activity feed system with debug logging
  // Use consistent organization ID from AuthContext with localStorage fallback
  const organizationId = currentOrganization?.organization_id || currentOrganization?.id || localStorage.getItem('currentOrganizationId');
  const { activities, loading, error } = useActivityFeed(organizationId, 15);

  // Use unified filtering for consistent results across all components
  // Temporarily disable strict filtering to debug the issue
  const relevantActivities = defaultActivityFilter.filterActivities(activities, {
    userRelevantOnly: false, // Disable to see all activities
    categories: null, // Remove category filtering temporarily
    timeRange: '24h',
    organizationId
  });

  const activityCount = relevantActivities.length;

  // Debug logging (removed test activity creation to prevent contamination)
  React.useEffect(() => {
    console.log('🔔 NotificationDropdown Debug:', {
      currentOrganization,
      organizationId,
      currentUser: currentUser?.email,
      activitiesCount: activities.length,
      relevantActivitiesCount: relevantActivities.length,
      loading,
      error,
      sampleActivities: activities.length > 0 ? activities.slice(0, 3).map(a => ({
        id: a.id,
        type: a.activity_type,
        category: a.metadata?.category,
        isRelevant: defaultActivityFilter.filterUserRelevantActivities([a]).length > 0
      })) : 'No activities'
    });
  }, [currentOrganization, organizationId, activities, relevantActivities, loading, error, currentUser]);

  // Additional debug for organization ID mismatch
  React.useEffect(() => {
    const localStorageOrgId = localStorage.getItem('currentOrganizationId');
    if (activities.length > 0) {
      console.log('🔍 Organization ID Analysis:', {
        'Used for filtering': organizationId,
        'localStorage': localStorageOrgId, 
        'currentOrganization.organization_id': currentOrganization?.organization_id,
        'Activities org IDs': activities.slice(0, 5).map(a => a.organization_id),
        'Matching activities': activities.filter(a => a.organization_id === organizationId).length
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, activities]);

  // Debug logging to help identify discrepancies
  React.useEffect(() => {
    if (activities.length > 0) {
      const debugInfo = defaultActivityFilter.debugFiltering(activities, {
        timeRange: '24h',
        organizationId,
        userRelevantOnly: true,
        categories: [
          ACTIVITY_CATEGORIES.AGENT,
          ACTIVITY_CATEGORIES.PROJECT,
          ACTIVITY_CATEGORIES.USER,
          ACTIVITY_CATEGORIES.ORGANIZATION
        ]
      });
      
      console.log('🔔 NotificationDropdown Filtering Debug:', debugInfo);
    }
  }, [activities, organizationId]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAllActivities = () => {
    navigate('/analytics/activity');
    handleClose();
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case ACTIVITY_CATEGORIES.AGENT:
        return <SmartToyIcon />;
      case ACTIVITY_CATEGORIES.PROJECT:
        return <AssignmentIcon />;
      case ACTIVITY_CATEGORIES.USER:
        return <PersonIcon />;
      case ACTIVITY_CATEGORIES.ORGANIZATION:
        return <BusinessIcon />;
      case ACTIVITY_CATEGORIES.SYSTEM:
        return <DashboardIcon />;
      default:
        return <TimelineIcon />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case ACTIVITY_SEVERITY.CRITICAL:
        return 'error';
      case ACTIVITY_SEVERITY.ERROR:
        return 'error';
      case ACTIVITY_SEVERITY.WARNING:
        return 'warning';
      case ACTIVITY_SEVERITY.INFO:
        return 'info';
      default:
        return 'default';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ACTIVITY_SEVERITY.CRITICAL:
        return <ErrorIcon />;
      case ACTIVITY_SEVERITY.ERROR:
        return <ErrorIcon />;
      case ACTIVITY_SEVERITY.WARNING:
        return <WarningIcon />;
      case ACTIVITY_SEVERITY.INFO:
        return <InfoIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  if (!organizationId) {
    return (
      <IconButton disabled>
        <NotificationsIcon />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: theme.palette.text.primary,
          bgcolor: 'transparent',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb'}`,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'
          }
        }}
      >
        <Badge 
          badgeContent={activityCount > 0 ? Math.min(activityCount, 9) : null} 
          color="primary"
          max={9}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 350,
            maxWidth: 400,
            maxHeight: 400,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              📈 Recent Activity
            </Typography>
            {activityCount > 0 && (
              <Chip 
                label={activityCount} 
                size="small" 
                color="primary" 
                sx={{ fontSize: '0.75rem', height: 20 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Latest updates from your organization
          </Typography>
        </Box>
        <Divider />
        
        <Box>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading activities...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
              <Typography variant="body2" color="error">
                Failed to load activities
              </Typography>
            </Box>
          ) : relevantActivities.length > 0 ? (
            <List sx={{ p: 0 }}>
              {relevantActivities.slice(0, 10).map((activity, index) => (
                <Grow in={true} timeout={200 + index * 50} key={activity.id}>
                  <ListItem sx={{ px: 2, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette[getSeverityColor(activity.metadata?.severity)].main, 0.1),
                          color: theme.palette[getSeverityColor(activity.metadata?.severity)].main,
                          width: 32,
                          height: 32
                        }}
                      >
                        {getCategoryIcon(activity.metadata?.category)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                            {activity.actorName} {getActivityDescription(activity.activity_type)}
                          </Typography>
                          {activity.metadata?.severity && activity.metadata.severity !== ACTIVITY_SEVERITY.INFO && (
                            <Chip
                              icon={getSeverityIcon(activity.metadata.severity)}
                              label={activity.metadata.severity}
                              size="small"
                              color={getSeverityColor(activity.metadata.severity)}
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {activity.timeAgo}
                          </Typography>
                          {activity.resourceName && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              • {activity.resourceName}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Grow>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No recent activity
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Activity will appear here as your team uses the platform
              </Typography>
            </Box>
          )}
        </Box>
        
        {relevantActivities.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={handleViewAllActivities}
                sx={{ textTransform: 'none' }}
              >
                View All Activities
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationDropdown;