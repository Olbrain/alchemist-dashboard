/**
 * Projects Analytics Sidebar Component
 *
 * Sidebar for analytics tab showing list of all user projects
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  alpha,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Folder as ProjectIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import { getOrganizationProjects } from '../../services/projects/projectService';

const ProjectsAnalyticsSidebar = ({
  selectedProjectId,
  onProjectSelect
}) => {
  const theme = useTheme();
  const { userMemberships } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all projects from all organizations
  useEffect(() => {
    const loadAllProjects = async () => {
      if (!userMemberships || userMemberships.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allProjects = [];

        // Fetch projects from each organization
        for (const membership of userMemberships) {
          const orgId = membership.organizationData?.id || membership.organization_id;
          if (!orgId) continue;

          try {
            const orgProjects = await getOrganizationProjects(orgId);
            // Add organization info to each project
            allProjects.push(...orgProjects.map(p => ({
              ...p,
              organizationName: membership.organizationName || 'Unknown Organization'
            })));
          } catch (error) {
            console.warn(`Failed to load projects for org ${orgId}:`, error);
          }
        }

        setProjects(allProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllProjects();
  }, [userMemberships]);

  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    const projectName = project.project_info?.name || project.name || '';
    const orgName = project.organizationName || '';
    const searchLower = searchQuery.toLowerCase();
    return (
      projectName.toLowerCase().includes(searchLower) ||
      orgName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: theme.palette.mode === 'dark' ? '#1a1f2e' : '#ffffff',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? '#0f1419' : '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? '#333' : '#888',
          borderRadius: '4px',
          '&:hover': {
            background: theme.palette.mode === 'dark' ? '#555' : '#555',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <ProjectIcon sx={{ fontSize: '1.3rem' }} />
          Projects
        </Typography>

        {/* Search */}
        {projects.length > 5 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              }
            }}
          />
        )}
      </Box>

      {/* Project List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No projects found' : 'No projects available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1.5, py: 0 }}>
            {filteredProjects.map((project) => {
              const projectId = project.id || project.project_id;
              const projectName = project.project_info?.name || project.name || 'Unnamed Project';
              const orgName = project.organizationName;
              const isSelected = selectedProjectId === projectId;
              const firstLetter = projectName.charAt(0).toUpperCase();

              return (
                <ListItem key={projectId} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => onProjectSelect && onProjectSelect(projectId)}
                    selected={isSelected}
                    sx={{
                      borderRadius: 3,
                      py: 1,
                      px: 1.5,
                      mx: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                        '&:hover': {
                          bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
                          transform: 'translateX(2px)',
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.08),
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        mr: 1.5,
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {firstLetter}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? theme.palette.primary.main : 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {projectName}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block'
                          }}
                        >
                          {orgName}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ProjectsAnalyticsSidebar;
