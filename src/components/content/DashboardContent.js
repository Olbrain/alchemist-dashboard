/**
 * Dashboard Content Component
 *
 * Personal dashboard showing only user's own agents
 * Includes both table view (performance) and grid view (browsing)
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  useTheme,
  alpha,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  TableChart as TableIcon,
  ViewModule as GridIcon,
  Search as SearchIcon,
  SmartToy as SmartToyIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import ErrorDisplay from '../shared/ErrorDisplay';
import { useNavigate } from 'react-router-dom';
import * as agentService from '../../services/agents/agentService';
import { getDataAccess } from '../../services/data/DataAccessFactory';
import { getAgentDevelopmentStage, getStatusColor, getStatusLabel } from '../../utils/agentUtils';
import * as projectService from '../../services/projects/projectService';
import { SectionTitle } from '../../utils/typography';

const DashboardContent = ({ onCreateAgent, onAgentClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, currentProject, loading: authLoading, error: authError } = useAuth();

  // Agent performance data state - optimized for single project embed mode
  const [agentsData, setAgentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'table' or 'grid' - default to grid
  const [projects, setProjects] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Action menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load dashboard data on mount
  useEffect(() => {
    if (authLoading) {
      // Auth is still loading, wait
      return;
    }

    if (authError || !currentUser) {
      // Auth error or no user - stop loading
      setLoading(false);
      return;
    }

    if (currentUser) {
      loadDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, currentProject, authLoading, authError]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dataAccess = getDataAccess();

      // Get organization ID from window (set by host application)
      const organizationId = window.REACT_APP_ORGANIZATION_ID || process.env.REACT_APP_ORGANIZATION_ID;

      // Optimized: Single query for all project agents scoped by organization
      // This shows all agents in the project (team collaboration mode)
      const agentsPromise = new Promise((resolve) => {
        const unsubscribe = dataAccess.subscribeToAgents({
          organizationId: organizationId,
          projectId: currentProject,
          lifecycleState: 'active'
        }, (agents) => {
          console.log('[DashboardContent] Received agents:', {
            count: agents.length,
            agents: agents.slice(0, 2),
            organizationId,
            projectId: currentProject
          });
          unsubscribe(); // Unsubscribe immediately after first result
          resolve(agents);
        });
      });

      // Wait for agents
      const agents = await agentsPromise;

      console.log('[DashboardContent] Loaded agents:', {
        agentsCount: agents.length
      });

      // Collect unique project IDs
      const projectIds = new Set();
      agents.forEach(agent => {
        if (agent.project_id) {
          projectIds.add(agent.project_id);
        }
      });

      // Load project names
      const projectsData = {};
      for (const projectId of projectIds) {
        try {
          const projectDoc = await projectService.getProject(projectId);
          projectsData[projectId] = projectDoc?.project_info?.name || projectDoc?.name || 'Unknown Project';
        } catch (error) {
          console.warn(`Failed to load project ${projectId}:`, error);
          projectsData[projectId] = 'Unknown Project';
        }
      }
      setProjects(projectsData);

      // Helper function to process agents data
      const processAgents = (agentsList) => {
        return agentsList.map((agent) => {
          return {
            id: agent.id,
            name: agent.basic_info?.name || agent.name || 'Untitled Agent',
            description: agent.description || agent.purpose || agent.basic_info?.description || agent.basic_info?.purpose || agent.agent_info?.description || 'No description',
            project_id: agent.project_id,
            created_at: agent.created_at,
            development_stage: getAgentDevelopmentStage(agent),
            owner_id: agent.owner_id
          };
        });
      };

      // Process agents data
      const processedAgents = processAgents(agents);

      console.log('[DashboardContent] Setting state with processed agents:', {
        processedAgentsCount: processedAgents.length,
        agentsSample: processedAgents.slice(0, 1)
      });

      setAgentsData(processedAgents);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setAgentsData([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

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

  // Helper to convert MUI color variant to hex color for status chip
  const getStatusDotColor = (status) => {
    const colorVariant = getStatusColor(status);
    switch (colorVariant) {
      case 'success':
        return '#4caf50'; // green
      case 'info':
        return '#2196f3'; // blue
      case 'warning':
        return '#ff9800'; // orange
      case 'error':
        return '#f44336'; // red
      case 'default':
      default:
        return '#9e9e9e'; // gray
    }
  };

  const handleAgentClick = (agentId) => {
    // Navigate to Agent Editor
    navigate(`/edit/${agentId}`);
  };

  const handleCreateAgent = () => {
    if (onCreateAgent) {
      onCreateAgent();
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Action menu handlers
  const handleMenuClick = (event, agent) => {
    event.stopPropagation(); // Prevent card click
    setAnchorEl(event.currentTarget);
    setSelectedAgent(agent);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAgent(null);
  };

  const handleEditAgent = () => {
    if (selectedAgent) {
      navigate(`/edit/${selectedAgent.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteAgent = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);  // Close menu but keep selectedAgent for the dialog
  };

  const handleConfirmDelete = async () => {
    console.log('[Dashboard] handleConfirmDelete called');
    console.log('[Dashboard] selectedAgent:', selectedAgent);

    if (!selectedAgent) {
      console.log('[Dashboard] No selected agent, returning');
      return;
    }

    try {
      console.log('[Dashboard] Calling agentService.deleteAgent with ID:', selectedAgent.id);
      const result = await agentService.deleteAgent(selectedAgent.id);
      console.log('[Dashboard] Delete successful, result:', result);

      setDeleteDialogOpen(false);
      setSelectedAgent(null);
      // Reload dashboard data
      console.log('[Dashboard] Reloading dashboard data');
      loadDashboardData();
    } catch (error) {
      console.error('[Dashboard] Error deleting agent:', error);
      // Show more descriptive error message from backend
      const errorMessage = error.message || 'Failed to delete agent. Please try again.';
      alert(`Failed to delete agent: ${errorMessage}`);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedAgent(null);
  };

  // Filter agents based on search term
  const filterAgents = (agentsList) => {
    return agentsList.filter((agent) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const agentName = agent.name?.toLowerCase() || '';
      const agentDescription = agent.description?.toLowerCase() || '';
      const projectName = projects[agent.project_id]?.toLowerCase() || '';

      return (
        agentName.includes(searchLower) ||
        agentDescription.includes(searchLower) ||
        projectName.includes(searchLower)
      );
    });
  };

  const filteredAgents = filterAgents(agentsData);

  // Helper function to render agent table rows
  const renderAgentTableRows = (agents) => {
    if (agents.length === 0) return null;

    return agents.map((agent) => {
      const projectName = projects[agent.project_id] || 'No project';

      return (
        <TableRow
          key={agent.id}
          hover
          onClick={() => handleAgentClick(agent.id)}
          sx={{ '&:hover': { cursor: 'pointer' } }}
        >
          <TableCell>{agent.name}</TableCell>
          <TableCell>{projectName}</TableCell>
          <TableCell>
            <Chip
              size="small"
              label={getStatusLabel(agent.development_stage)}
              sx={{
                bgcolor: getStatusDotColor(agent.development_stage),
                color: 'white',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
          </TableCell>
          <TableCell align="right">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e, agent);
              }}
              sx={{
                opacity: 0.6,
                '&:hover': {
                  opacity: 1
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    });
  };

  // Helper function to render agent grid cards
  const renderAgentCards = (agents) => {
    if (agents.length === 0) return null;

    return agents.map((agent) => {
      const projectName = projects[agent.project_id] || 'No project';
      const firstLetter = agent.name ? agent.name.charAt(0).toUpperCase() : 'A';

      return (
        <Grid item xs={12} sm={6} md={4} key={agent.id}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 8px rgba(255, 255, 255, 0.1)'
                  : '0 4px 8px rgba(0, 0, 0, 0.1)',
              },
              '&:hover .card-actions': {
                opacity: 1
              }
            }}
            onClick={() => handleAgentClick(agent.id)}
          >
            {/* Action Menu Button */}
            <IconButton
              size="small"
              className="card-actions"
              onClick={(e) => handleMenuClick(e, agent)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                opacity: 0.6,
                transition: 'opacity 0.2s ease',
                zIndex: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              {/* Agent Avatar */}
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  margin: '0 auto 12px',
                  bgcolor: theme.palette.primary.main,
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}
              >
                {firstLetter}
              </Avatar>

              {/* Agent Name */}
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{
                  mb: 0.75,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {agent.name}
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  height: 36,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  fontSize: '0.875rem',
                  lineHeight: 1.3
                }}
              >
                {agent.description}
              </Typography>

              {/* Project Name */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  fontWeight: 500
                }}
              >
                {projectName}
              </Typography>

              {/* Status Chip and Last Activity */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={getStatusLabel(agent.development_stage)}
                  color={getStatusColor(agent.development_stage)}
                  sx={{ fontWeight: 500 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(agent.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      );
    });
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Create Button - Fixed at top */}
      <Box sx={{ mb: 3, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateAgent}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2
            }}
          >
            Create Agent
          </Button>
        </Box>
      </Box>

      {/* Search Bar and View Toggle */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search agents by name, description, or project..."
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

      {/* Auth Error State */}
      {authError ? (
        <ErrorDisplay
          error={authError}
          variant="content"
        />
      ) : error ? (
        <ErrorDisplay
          error={error}
          variant="content"
          onRetry={() => loadDashboardData()}
        />
      ) : loading ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          py: 8
        }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading agents...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* All Agents Section - Optimized for single project embed mode */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle component="h2" sx={{ mb: 2 }}>
              Agents ({filteredAgents.length})
            </SectionTitle>

            {viewMode === 'table' ? (
              /* Agents Table View */
              <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent Name</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Stage</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAgents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              {searchTerm ? 'No agents match your search' : 'No agents in this project yet'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        renderAgentTableRows(filteredAgents)
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              /* Agents Grid View */
              filteredAgents.length === 0 ? (
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
                  <SmartToyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    {searchTerm ? 'No agents found' : 'No agents yet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Create your first agent to get started'}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {renderAgentCards(filteredAgents)}
                </Grid>
              )
            )}
          </Box>
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Only show Edit and Delete for user's own agents */}
        {selectedAgent && selectedAgent.owner_id === currentUser.uid && (
          <>
            <MenuItem onClick={handleEditAgent}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit Agent
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteAgent} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Agent
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The agent and all its data will be permanently deleted.
          </Alert>

          {selectedAgent && (
            <Typography variant="body1">
              Are you sure you want to delete the agent{' '}
              <strong>"{selectedAgent.name}"</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete Agent
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardContent;