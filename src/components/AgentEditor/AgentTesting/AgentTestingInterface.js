/**
 * Agent Testing Interface
 *
 * Component for live agent testing within the Agent Editor
 * Uses a context-free embedded testing component with real-time deployment status updates
 */
import React, { useState, useEffect } from 'react';
import EmbeddedAgentTesting from './EmbeddedAgentTesting';
import { subscribeToAgentServerStatus } from '../../../services';

const AgentTestingInterface = ({
  agent,
  onNotification,
  disabled = false,
  isAgentDeployed = null, // Accept deployment status from parent
  agentServerData = null   // Accept server data from parent
}) => {
  const agentId = agent?.id;
  const [deploymentStatus, setDeploymentStatus] = useState({
    isDeployed: false,
    healthStatus: null,
    isLoading: true,
    hasError: false,
    error: null
  });

  // Subscribe to real-time deployment status updates
  useEffect(() => {
    if (!agentId) {
      setDeploymentStatus({
        isDeployed: false,
        healthStatus: null,
        isLoading: false,
        hasError: true,
        error: 'No agent ID provided'
      });
      return;
    }

    console.log('🧪 [AgentTestingInterface] Setting up deployment status subscription for agentId:', agentId);

    // If parent provides deployment status, use it directly
    if (isAgentDeployed !== null) {
      console.log('🧪 [AgentTestingInterface] Using deployment status from parent:', isAgentDeployed);
      setDeploymentStatus({
        isDeployed: isAgentDeployed,
        healthStatus: isAgentDeployed ? { available: true } : null,
        isLoading: false,
        hasError: false,
        error: null
      });
    }

    // Set up real-time subscription for updates
    const unsubscribe = subscribeToAgentServerStatus(
      agentId,
      (isDeployed, serverData) => {
        console.log('🧪 [AgentTestingInterface] Deployment status updated:', {
          agentId,
          isDeployed,
          serverData: serverData ? { service_url: serverData.service_url, status: serverData.status } : null
        });

        setDeploymentStatus({
          isDeployed,
          healthStatus: isDeployed ? { available: true } : null,
          isLoading: false,
          hasError: false,
          error: null
        });
      },
      (error) => {
        console.error('🧪 [AgentTestingInterface] Deployment status subscription error:', error);
        setDeploymentStatus(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
          error: error.message
        }));
      }
    );

    return () => {
      console.log('🧪 [AgentTestingInterface] Cleaning up deployment status subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [agentId, isAgentDeployed]);

  // Update deployment status when parent prop changes
  useEffect(() => {
    if (isAgentDeployed !== null) {
      console.log('🧪 [AgentTestingInterface] Parent deployment status changed:', isAgentDeployed);
      setDeploymentStatus(prev => ({
        ...prev,
        isDeployed: isAgentDeployed,
        healthStatus: isAgentDeployed ? { available: true } : null,
        isLoading: false
      }));
    }
  }, [isAgentDeployed]);

  return (
    <EmbeddedAgentTesting
      agent={agent}
      isDeployed={deploymentStatus.isDeployed}
      healthStatus={deploymentStatus.healthStatus}
      isLoading={deploymentStatus.isLoading}
      hasError={deploymentStatus.hasError}
      error={deploymentStatus.error}
    />
  );
};

export default AgentTestingInterface;