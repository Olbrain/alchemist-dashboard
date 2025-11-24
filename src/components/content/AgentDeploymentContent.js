/**
 * Agent Deployment Content Component
 *
 * Standalone deployment manager for MainContainer Deploy section
 */
import React, { useState, useEffect } from 'react';
import {
  Box
} from '@mui/material';
import { CloudQueue as DeployIcon } from '@mui/icons-material';

// Import components
import AgentDeploymentManager from '../AgentEditor/Deployment/AgentDeploymentManager';
import DeploymentSidebar from '../AgentEditor/Deployment/DeploymentSidebar';
import NotificationSystem, { createNotification } from '../shared/NotificationSystem';
import EmptyState from '../shared/EmptyState';
import { deployAgent, subscribeToDeploymentUpdates, subscribeToSingleDeployment } from '../../services';

const AgentDeploymentContent = ({ agentId }) => {
  // UI state
  const [notification, setNotification] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [activeDeployment, setActiveDeployment] = useState(null); // Track the currently deploying item
  const [activeDeploymentUnsubscribe, setActiveDeploymentUnsubscribe] = useState(null);
  const [activeTab, setActiveTab] = useState('status');

  // Handle notifications
  const handleNotification = (newNotification) => {
    setNotification(newNotification);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Subscribe to deployment updates to track status
  useEffect(() => {
    if (!agentId) return;

    const unsubscribePromise = subscribeToDeploymentUpdates(
      agentId,
      (deploymentUpdates) => {
        setDeployments(deploymentUpdates);

        // Debug: Log all deployment statuses including progress
        console.log('📊 [AgentDeploymentContent] Deployment update received at:', new Date().toISOString());
        console.log('📊 [AgentDeploymentContent] Deployment statuses:',
          deploymentUpdates.map(d => ({
            id: d.deployment_id?.slice(0, 8) || d.id?.slice(0, 8),
            status: d.status,
            progress_percent: d.progress_percent,
            updated_at: d.updated_at,
            created: d.created_at
          }))
        );
      },
      (error) => {
        console.error('Deployment subscription error:', error);
      }
    );

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [agentId]);

  // Cleanup active deployment listener when component unmounts or agentId changes
  useEffect(() => {
    return () => {
      if (activeDeploymentUnsubscribe) {
        console.log('🧹 [AgentDeploymentContent] Cleaning up active deployment listener');
        activeDeploymentUnsubscribe();
      }
    };
  }, [activeDeploymentUnsubscribe]);

  // Handle agent deployment
  const handleDeployAgent = async () => {
    try {
      setNotification(createNotification('info', 'Starting deployment...'));
      const result = await deployAgent(agentId);

      if (result.deployment_id) {
        setNotification(createNotification('success', 'Agent deployment started successfully!'));

        // Clean up any existing active deployment listener
        if (activeDeploymentUnsubscribe) {
          activeDeploymentUnsubscribe();
          setActiveDeploymentUnsubscribe(null);
        }

        // Set up real-time listener for this specific deployment
        console.log('📡 [AgentDeploymentContent] Setting up listener for deployment:', result.deployment_id);

        const unsubscribe = subscribeToSingleDeployment(
          result.deployment_id,
          (deploymentData) => {
            console.log('📊 [AgentDeploymentContent] Deployment update:', {
              id: deploymentData.deployment_id,
              status: deploymentData.status,
              progress: deploymentData.progress_percent
            });

            setActiveDeployment(deploymentData);

            // Auto-cleanup when deployment reaches terminal state
            const terminalStates = ['completed', 'failed', 'cancelled'];
            if (terminalStates.includes(deploymentData.status?.toLowerCase())) {
              console.log('✅ [AgentDeploymentContent] Deployment completed, cleaning up listener');
              setTimeout(() => {
                setActiveDeployment(null);
                if (unsubscribe) {
                  unsubscribe();
                  setActiveDeploymentUnsubscribe(null);
                }
              }, 2000); // Keep showing for 2 seconds before clearing
            }
          },
          (error) => {
            console.error('❌ [AgentDeploymentContent] Deployment listener error:', error);
            setNotification(createNotification('error', 'Lost connection to deployment status'));
          }
        );

        setActiveDeploymentUnsubscribe(() => unsubscribe);
      } else {
        setNotification(createNotification('error', result.message || 'Deployment failed'));
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setNotification(createNotification('error', error.message || 'Failed to deploy agent'));
    }
  };

  // Show no agent selected state
  if (!agentId) {
    return (
      <EmptyState
        icon={DeployIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to deploy it."
        useCard={true}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <DeploymentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Panel */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
        <AgentDeploymentManager
          key={`${activeDeployment?.deployment_id || deployments[0]?.deployment_id}_${activeDeployment?.progress_percent || deployments[0]?.progress_percent || 0}`}
          agentId={agentId}
          onNotification={handleNotification}
          disabled={false}
          onDeployAgent={handleDeployAgent}
          deploymentHistory={deployments}
          activeDeployment={activeDeployment}
          activeTab={activeTab}
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

export default AgentDeploymentContent;
