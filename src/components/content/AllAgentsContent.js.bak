/**
 * All Agents Content Component
 *
 * Contains the agents list view content for current user
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Skeleton,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Add as AddIcon
} from '@mui/icons-material';

import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
import { db } from '../../utils/firebase';
import { Collections, DocumentFields } from '../../constants/collections';
import * as projectService from '../../services/projects/projectService';
import { getAgentStatus, getStatusColor, AGENT_STATUS } from '../../utils/agentUtils';

const AllAgentsContent = ({ onCreateAgent, onAgentClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, currentProject } = useAuth();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState({});

  useEffect(() => {
    if (currentUser) {
      loadAgents();
    }
  }, [currentUser, currentProject]);

  const loadAgents = async () => {
    try {
      setLoading(true);

      // If no project is selected, show empty list
      if (!currentProject) {
        console.log('No project selected, showing empty agents list');
        setAgents([]);
        setLoading(false);
        return;
      }

      // Query agents in current project only (no organization_id needed)
      const agentsQuery = query(
        collection(db, Collections.AGENTS),
        where('owner_id', '==', currentUser.uid),
        where('project_id', '==', currentProject),
        orderBy('created_at', 'desc')
      );

      const agentsSnapshot = await getDocs(agentsQuery);
      const agentsList = [];
      const projectIds = new Set();

      agentsSnapshot.forEach((doc) => {
        const agentData = doc.data();
        agentsList.push({
          id: doc.id,
          ...agentData
        });

        // Collect unique project IDs
        if (agentData.project_id) {
          projectIds.add(agentData.project_id);
        }
      });

      // Filter out deleted and archived agents
      const filteredAgents = agentsList.filter(agent => {
        const status = getAgentStatus(agent);
        return status !== AGENT_STATUS.DELETED && status !== AGENT_STATUS.ARCHIVED;
      });

      // Load project names for all agents
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
      setAgents(filteredAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgents([]);
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

  // Helper to convert MUI color variant to hex color for status dot
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
    if (onAgentClick) {
      onAgentClick(agentId);
    } else {
      navigate(`/agent-profile/${agentId}`);
    }
  };

  const handleCreateAgent = () => {
    if (onCreateAgent) {
      onCreateAgent();
    } else {
      // Navigate to agents list - creation handled by CreateAgentDialog
      navigate('/agents');
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Breadcrumbs Header with Create Button */}
      <Box sx={{ mb: 2, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SmartToyIcon fontSize="small" />
            <Typography variant="body1" color="text.primary" fontWeight="600">
              All Agents
            </Typography>
          </Box>
        </Breadcrumbs>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleCreateAgent}
          sx={{
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Create Agent
        </Button>
      </Box>

      {/* Scrollable Agents Card */}
      <Card sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0
      }}>
        <CardContent sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          }
        }}>
          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={80} />
              ))}
            </Stack>
          ) : agents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {currentProject
                  ? 'No agents in this project yet'
                  : 'Select a project from the top bar to view agents'}
              </Typography>
              {currentProject && (
                <Button
                  variant="contained"
                  startIcon={<SmartToyIcon />}
                  onClick={handleCreateAgent}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                Create Your First Agent
              </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {agents.map((agent) => {
                const agentName = agent.name || agent.basic_info?.name || agent.agent_info?.name || 'Untitled Agent';
                const agentDescription = agent.description || agent.purpose || agent.basic_info?.description || agent.basic_info?.purpose || agent.agent_info?.description || 'No description';
                const agentStatus = getAgentStatus(agent);
                const projectName = projects[agent.project_id] || 'No project';

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                      onClick={() => handleAgentClick(agent.id)}
                    >
                      {/* Status Dot in Top Right */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getStatusDotColor(agentStatus),
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          zIndex: 1
                        }}
                      />
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography
                          variant="body1"
                          fontWeight="600"
                          noWrap
                          sx={{ mb: 0.5 }}
                        >
                          {agentName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '1.2em'
                          }}
                        >
                          {agentDescription}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {projectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(agent.created_at)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AllAgentsContent;