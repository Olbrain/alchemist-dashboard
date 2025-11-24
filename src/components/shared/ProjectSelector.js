/**
 * Project Selector Component
 *
 * Dropdown in AppBar to switch between projects (similar to Firebase, GCP, etc.)
 */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FolderOpen as ProjectIcon,
  ViewList as ViewListIcon,
  Check as CheckIcon,
  Business as OrganizationIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProjectsByMembership } from '../../services/projects/projectService';
import { DocumentFields } from '../../constants/collections';

const ProjectSelector = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, currentProject, switchProject } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const dropdownOpen = Boolean(anchorEl);

  // Fetch projects function - now based on user membership
  const fetchProjects = async () => {
    if (!currentUser?.uid) {
      setProjects([]);
      return;
    }

    setLoading(true);
    try {
      const projectData = await getUserProjectsByMembership(currentUser.uid);
      setProjects(projectData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects when user changes (on login/logout)
  useEffect(() => {
    fetchProjects();
  }, [currentUser]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectProject = (projectId) => {
    switchProject(projectId);
    handleClose();
  };

  const handleViewAllProjects = () => {
    handleClose();
    navigate('/projects');
  };

  // Get current project details
  const getCurrentProjectDetails = () => {
    if (!currentProject || projects.length === 0) return null;
    return projects.find(p => p.id === currentProject || p.project_id === currentProject);
  };

  const currentProjectData = getCurrentProjectDetails();
  const projectName = currentProjectData?.project_info?.name || 'Select Project';
  const hasProjects = projects.length > 0;

  // Don't show if no user
  if (!currentUser) {
    return null;
  }

  return (
    <>
      <Button
        id="project-selector-button"
        aria-controls={dropdownOpen ? 'project-selector-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={dropdownOpen ? 'true' : undefined}
        onClick={handleClick}
        endIcon={loading ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
        sx={{
          height: 40,
          px: 2,
          color: theme.palette.text.primary,
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
          borderRadius: 2,
          minWidth: 200,
          maxWidth: 300,
          textTransform: 'none',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e9ecef',
            borderColor: theme.palette.primary.main,
            transform: 'translateY(-1px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(99, 102, 241, 0.2)'
              : '0 4px 12px rgba(99, 102, 241, 0.15)'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              lineHeight: 1,
              mb: 0.25
            }}
          >
            My Projects
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              textAlign: 'left'
            }}
          >
            {currentProjectData ? projectName : (hasProjects ? 'Select Project' : 'No Projects')}
          </Typography>
        </Box>
      </Button>

      {/* Project Menu */}
      <Menu
        id="project-selector-menu"
        anchorEl={anchorEl}
        open={dropdownOpen}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 500,
            mt: 1,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(255, 255, 255, 0.1)'
              : '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e5e7eb'}`,
            '& .MuiList-root': {
              padding: 0
            }
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ProjectIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              My Projects
            </Typography>
          </Box>
          {currentProjectData && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {projectName}
              </Typography>
              {currentProjectData.userRole && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Role: {currentProjectData.userRole}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Projects List */}
        {hasProjects ? (
          <>
            <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#fafafa' }}>
              <Typography variant="caption" color="text.secondary" sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                Your Projects ({projects.length})
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {projects.map((project) => {
                const projectId = project.id || project.project_id;
                const projectName = project.project_info?.name || 'Unnamed Project';
                const isSelected = currentProject === projectId;

                return (
                  <MenuItem
                    key={projectId}
                    onClick={() => handleSelectProject(projectId)}
                    selected={isSelected}
                    sx={{
                      py: 1.5,
                      minHeight: 'auto',
                      bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.12)
                          : theme.palette.action.hover
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {isSelected ? (
                        <CheckIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      ) : (
                        <ProjectIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={projectName}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isSelected ? 600 : 500,
                        noWrap: true
                      }}
                    />
                  </MenuItem>
                );
              })}
            </Box>
            <Divider />
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ProjectIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No projects found
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ p: 1 }}>
          <MenuItem onClick={handleViewAllProjects} sx={{ borderRadius: 1, py: 1.5 }}>
            <ListItemIcon>
              <ViewListIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View All Projects" />
          </MenuItem>
        </Box>
      </Menu>
    </>
  );
};

export default ProjectSelector;
