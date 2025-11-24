/**
 * Agent Integration Page
 * 
 * Standalone page for managing agent integrations (WhatsApp, Website, etc.)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress,
  Container 
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Import components
import AgentIntegrationManager from '../components/AgentEditor/AgentIntegration/AgentIntegrationManager';
import NotificationSystem, { createNotification } from '../components/shared/NotificationSystem';

// Import hooks and services
import useAgentState from '../hooks/useAgentState';
import { subscribeToDeploymentUpdates } from '../services';
import { SectionTitle, PageDescription } from '../utils/typography';

const AgentIntegration = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Core state management
  const { agent, loading, error } = useAgentState(agentId);
  
  
  // UI state
  const [notification, setNotification] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loadingDeployments, setLoadingDeployments] = useState(true);

  // Determine active section from URL query params or path
  const getActiveSection = () => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    if (section === 'whatsapp' || section === 'website') {
      return section;
    }
    return 'integration'; // Default to integration overview
  };

  const [activeSection, setActiveSection] = useState(getActiveSection());

  // Update active section when URL changes
  useEffect(() => {
    setActiveSection(getActiveSection());
  }, [location.search]);

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
    navigate(`/agent-profile/${agentId}`);
  };


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
            color: '#6366f1',
            '&:hover': {
              bgcolor: '#6366f115',
              color: '#4f46e5'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Integrate Agent: {agent?.name || 'Untitled Agent'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect your deployed agent to WhatsApp, websites, and other platforms
          </Typography>
        </Box>
      </Box>


      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <AgentIntegrationManager
          agentId={agentId}
          deployments={deployments}
          onNotification={handleNotification}
          disabled={false}
          activeSection={activeSection}
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

export default AgentIntegration;