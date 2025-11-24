/**
 * Agent Deployment Page
 * 
 * Standalone page for managing agent deployments
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress,
  Container 
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Import components
import AgentDeploymentManager from '../components/AgentEditor/Deployment/AgentDeploymentManager';
import NotificationSystem, { createNotification } from '../components/shared/NotificationSystem';

// Import hooks and services
import useAgentState from '../hooks/useAgentState';
import { subscribeToDeploymentUpdates, deployAgent } from '../services';
import { SectionTitle, PageDescription } from '../utils/typography';

const AgentDeployment = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  
  // Core state management
  const { agent, loading, error } = useAgentState(agentId);
  
  
  // UI state
  const [notification, setNotification] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loadingDeployments, setLoadingDeployments] = useState(true);

  // Subscribe to real-time deployment updates
  useEffect(() => {
    if (!agentId) {
      setLoadingDeployments(false);
      return;
    }

    setLoadingDeployments(true);

    // Set up real-time subscription
    const unsubscribe = subscribeToDeploymentUpdates(
      agentId,
      (deployments) => {
        // Handle real-time updates
        setDeployments(deployments || []);
        setLoadingDeployments(false);
      },
      (error) => {
        // Handle subscription errors
        console.error('Error subscribing to deployments:', error);
        setNotification(createNotification(
          'Failed to load deployment history',
          'error'
        ));
        setLoadingDeployments(false);
      }
    );

    // Cleanup subscription on unmount or agentId change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [agentId]);

  // Handle notifications
  const handleNotification = (newNotification) => {
    setNotification(newNotification);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Handle back navigation
  const handleBackClick = () => {
    navigate(`/agents`);
  };

  // Handle agent deployment
  const handleDeployAgent = async () => {
    try {
      setNotification(createNotification('info', 'Starting deployment...'));
      const result = await deployAgent(agentId);

      if (result.success) {
        setNotification(createNotification('success', 'Agent deployment started successfully!'));
      } else {
        setNotification(createNotification('error', result.message || 'Deployment failed'));
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setNotification(createNotification('error', error.message || 'Failed to deploy agent'));
    }
  };

  // Debug log before render
  console.log('🚀 [AgentDeployment] Rendering with:', {
    agentId,
    hasAgent: !!agent,
    handleDeployAgentType: typeof handleDeployAgent
  });

  // Show loading spinner while agent data is loading
  if (loading || loadingDeployments) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh'
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error if agent not found
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <SectionTitle color="error" gutterBottom>
            Error Loading Agent
          </SectionTitle>
          <PageDescription>
            {error}
          </PageDescription>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <IconButton 
          onClick={handleBackClick} 
          sx={{ 
            mr: 2,
            color: '#616161',
            '&:hover': {
              bgcolor: 'rgba(97, 97, 97, 0.15)',
              color: '#424242'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Deploy Agent: {agent?.name || 'Untitled Agent'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deploy your agent to production with optimized performance
          </Typography>
        </Box>
      </Box>


      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <AgentDeploymentManager
          agentId={agentId}
          onNotification={handleNotification}
          disabled={false}
          onDeployAgent={handleDeployAgent}
        />
      </Box>

      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};

export default AgentDeployment;