/**
 * Project Pages Sidebar Component
 * 
 * Standardized left panel for project-related pages
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Chip,
  Button,
  Stack
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Group as TeamIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as ActiveIcon,
  Pause as OnHoldIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';

const ProjectSidebar = ({ currentProject = null, projects = [], onCreateProject = null }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const projectNavItems = [
    {
      label: 'All Projects',
      path: '/projects',
      icon: <ProjectIcon />,
      description: 'Browse all projects'
    },
    {
      label: 'Active Projects',
      path: '/projects?status=active',
      icon: <ActiveIcon />,
      description: 'Currently running projects'
    },
    {
      label: 'Deleted Projects',
      path: '/projects?status=deleted',
      icon: <OnHoldIcon />,
      description: 'Deleted projects'
    },
    {
      label: 'Archived',
      path: '/projects?status=archived',
      icon: <ArchiveIcon />,
      description: 'Archived projects'
    }
  ];

  const quickActions = [
    {
      label: 'Create Project',
      action: onCreateProject || (() => navigate('/projects')),
      icon: <AddIcon />,
      disabled: !hasPermission('projects.create'),
      variant: 'contained'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'deleted': return 'error';
      case 'archived': return 'default';
      default: return 'info';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <ActiveIcon fontSize="small" />;
      case 'deleted': return <OnHoldIcon fontSize="small" />;
      case 'archived': return <ArchiveIcon fontSize="small" />;
      default: return <ScheduleIcon fontSize="small" />;
    }
  };

  const isActivePath = (path) => {
    if (path === '/projects' && location.pathname === '/projects' && !location.search) {
      return true;
    }
    return location.pathname + location.search === path;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight="700" gutterBottom>
          Projects
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage and organize your initiatives
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              fullWidth
              variant={action.variant}
              startIcon={action.icon}
              onClick={action.action}
              disabled={action.disabled}
              sx={{
                py: 1.5,
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ px: 1 }}>
          {projectNavItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActivePath(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.text.primary, 0.08),
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.text.primary, 0.12),
                    },
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.3),
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActivePath(item.path) ? theme.palette.text.primary : 'inherit',
                    minWidth: 40 
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: isActivePath(item.path) ? 600 : 500,
                    fontSize: '0.9rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <>
            <Divider sx={{ mx: 2, my: 2 }} />
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary" gutterBottom>
                Recent Projects
              </Typography>
            </Box>
            <List sx={{ px: 1 }}>
              {projects.slice(0, 5).map((project, index) => (
                <ListItem key={project.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(`/projects/${project.id}`)}
                    selected={location.pathname === `/projects/${project.id}`}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      py: 1,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.8),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          bgcolor: theme.palette.grey[600]
                        }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="500"
                            sx={{ 
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {project.name}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(project.status)}
                            label={project.status}
                            size="small"
                            color={getStatusColor(project.status)}
                            variant="outlined"
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': {
                                fontSize: '0.7rem'
                              }
                            }}
                          />
                        </Box>
                      }
                      secondary={`Status: ${project.status || 'active'}`}
                      secondaryTypographyProps={{
                        fontSize: '0.7rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>

      {/* Current Project Info (if viewing a specific project) */}
      {currentProject && (
        <>
          <Divider />
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
            <Typography variant="subtitle2" fontWeight="600" color="text.secondary" gutterBottom>
              Current Project
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main
                }}
              >
                {currentProject.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  fontWeight="600"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {currentProject.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status: {currentProject.status || 'active'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProjectSidebar;