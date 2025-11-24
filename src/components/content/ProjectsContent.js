/**
 * Projects Content Component
 *
 * Contains the projects list view content - matches DashboardContent design
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  Chip,
  CardContent,
  useTheme,
  CircularProgress,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  TableChart as TableIcon,
  ViewModule as GridIcon
} from '@mui/icons-material';

import { useAuth } from '../../utils/AuthContext';
import * as projectService from '../../services/projects/projectService';
import { getUserProjectsByMembership } from '../../services/projects/projectService';

const ProjectsContent = ({ onProjectClick, triggerCreateProject }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectAgentCounts, setProjectAgentCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const loadProjectData = React.useCallback(async () => {
    try {
      setProjectsLoading(true);

      // Load projects where user is a member
      const projects = await getUserProjectsByMembership(currentUser.uid);

      // Sort projects by creation date
      projects.sort((a, b) => {
        const dateA = a.created_at?.seconds || 0;
        const dateB = b.created_at?.seconds || 0;
        return dateB - dateA;
      });

      setAllProjects(projects);

      // Load agent counts per project
      const agentCounts = {};
      for (const project of projects) {
        try {
          const agents = await projectService.getProjectAgents(project.id);
          agentCounts[project.id] = agents.length;
        } catch (error) {
          console.warn(`Failed to load agents for project ${project.id}:`, error);
          agentCounts[project.id] = 0;
        }
      }

      setProjectAgentCounts(agentCounts);
      setProjectsLoading(false);
    } catch (error) {
      console.error('Error loading projects:', error);
      setAllProjects([]);
      setProjectsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadProjectData();
    }
  }, [currentUser, loadProjectData]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    const now = new Date();
    const time = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'archived':
        return 'default';
      case 'deleted':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'archived':
        return 'Archived';
      case 'deleted':
        return 'Deleted';
      default:
        return 'Unknown';
    }
  };

  // Filter projects based on search term
  const filteredProjects = allProjects.filter((project) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const projectName = (project.project_info?.name || project.name || '').toLowerCase();
    const projectDescription = (project.project_info?.description || project.description || '').toLowerCase();

    return (
      projectName.includes(searchLower) ||
      projectDescription.includes(searchLower)
    );
  });

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="600" sx={{ mb: 0.5 }}>
          My Projects
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </Typography>
      </Box>

      {/* Search Bar and View Toggle */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search projects by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="table">
            <TableIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="grid">
            <GridIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content Area - Table or Grid View */}
      {viewMode === 'table' ? (
        /* Table View */
        <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Agents</TableCell>
                  <TableCell align="right">Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projectsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'No projects match your search' : 'You have not created any projects yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      hover
                      onClick={() => navigate(`/${project.id}`)}
                      sx={{ '&:hover': { cursor: 'pointer' } }}
                    >
                      <TableCell>{project.project_info?.name || project.name || 'Untitled Project'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getStatusLabel(project.project_info?.status || project.status)}
                          color={getStatusColor(project.project_info?.status || project.status)}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="right">{projectAgentCounts[project.id] || 0}</TableCell>
                      <TableCell align="right">{formatTimeAgo(project.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        /* Grid View - Project Cards (agent-studio pattern) */
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {projectsLoading ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8
            }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Loading projects...
              </Typography>
            </Box>
          ) : filteredProjects.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 3,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchTerm ? 'No projects found' : 'No projects yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first project to get started'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredProjects.map((project) => {
                const projectName = project.project_info?.name || project.name || 'Untitled Project';
                const firstLetter = projectName.charAt(0).toUpperCase();
                const projectStatus = project.project_info?.status || project.status || 'active';

                return (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 8px rgba(255, 255, 255, 0.1)'
                            : '0 4px 8px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                      onClick={() => navigate(`/${project.id}`)}
                    >
                      <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                        {/* Project Avatar */}
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            margin: '0 auto 16px',
                            bgcolor: theme.palette.primary.main,
                            fontSize: '1.5rem',
                            fontWeight: 600
                          }}
                        >
                          {firstLetter}
                        </Avatar>

                        {/* Project Name */}
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {projectName}
                        </Typography>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            height: 42,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {project.project_info?.description || project.description || 'No description'}
                        </Typography>

                        {/* Agent Count */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mb: 1,
                            fontWeight: 500
                          }}
                        >
                          {projectAgentCounts[project.id] || 0} {projectAgentCounts[project.id] === 1 ? 'agent' : 'agents'}
                        </Typography>

                        {/* Status Chip and Last Activity */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Chip
                            size="small"
                            label={getStatusLabel(projectStatus)}
                            color={getStatusColor(projectStatus)}
                            sx={{ fontWeight: 500 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(project.created_at)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProjectsContent;
