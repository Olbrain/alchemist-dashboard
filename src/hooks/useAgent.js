import { useState, useEffect, useCallback } from 'react';
import { useAgentContext } from '../contexts/AgentContext';
import { useAuth } from '../utils/AuthContext';

/**
 * Custom hook for accessing and managing agent data with smart caching
 * 
 * @param {string} agentId - The ID of the agent to load
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoLoad - Whether to automatically load agent data on mount (default: true)
 * @param {boolean} options.includeHealth - Whether to include health check (default: true)
 * @param {boolean} options.backgroundHealth - Whether to load health check in background (default: true)
 * @param {boolean} options.requireOwnership - Whether to verify user owns the agent (default: true)
 * @param {boolean} options.setupSubscription - Whether to setup real-time subscriptions (default: true)
 * 
 * @returns {Object} Agent data and control functions
 */
export const useAgent = (agentId, options = {}) => {
  const {
    autoLoad = true,
    includeHealth = true,
    backgroundHealth = true,
    requireOwnership = true,
    setupSubscription = true
  } = options;

  const { currentUser } = useAuth();
  const {
    agents,
    loadAgentInfo,
    loadAgentData,
    loadDeploymentStatus,
    loadHealthStatus,
    cleanupAgent,
    invalidateCache,
    isDataStale
  } = useAgentContext();

  const [initError, setInitError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  // Get current agent state from context
  const agentState = agents[agentId] || {
    loading: false,
    agentDataLoading: false,
    deploymentStatusLoading: false,
    healthStatusLoading: false,
    data: null,
    deploymentStatus: null,
    healthStatus: null,
    error: null,
    lastUpdated: {}
  };

  // Check ownership when agent data is available
  useEffect(() => {
    if (agentState.data && requireOwnership && currentUser) {
      const ownerId = agentState.data.owner_id || agentState.data.userId;
      const userHasPermission = ownerId === currentUser.uid;
      setHasPermission(userHasPermission);
      
      if (!userHasPermission) {
        setInitError('You do not have permission to access this agent');
      } else {
        setInitError(null);
      }
    }
  }, [agentState.data, requireOwnership, currentUser]);

  // Auto-load agent data on mount
  useEffect(() => {
    if (!agentId || !currentUser || !autoLoad) return;

    const loadData = async () => {
      try {
        await loadAgentInfo(agentId, {
          includeHealth,
          backgroundHealth,
          setupSubscription
        });
      } catch (error) {
        setInitError(error.message);
      }
    };

    loadData();

    // Cleanup on unmount or agentId change
    return () => {
      if (agentId) {
        cleanupAgent(agentId);
      }
    };
  }, [agentId, currentUser, autoLoad, includeHealth, backgroundHealth, setupSubscription, loadAgentInfo, cleanupAgent]);

  // Manual refresh functions
  const refreshAgentData = useCallback(async () => {
    if (!agentId) return;
    try {
      return await loadAgentData(agentId, true);
    } catch (error) {
      setInitError(error.message);
      throw error;
    }
  }, [agentId, loadAgentData]);

  const refreshDeploymentStatus = useCallback(async () => {
    if (!agentId) return;
    return await loadDeploymentStatus(agentId, true);
  }, [agentId, loadDeploymentStatus]);

  const refreshHealthStatus = useCallback(async () => {
    if (!agentId) return;
    return await loadHealthStatus(agentId, true);
  }, [agentId, loadHealthStatus]);

  const refreshAll = useCallback(async () => {
    if (!agentId) return;
    try {
      return await loadAgentInfo(agentId, {
        includeHealth: true,
        backgroundHealth: false, // Load synchronously for manual refresh
        setupSubscription: false // Don't recreate subscription
      });
    } catch (error) {
      setInitError(error.message);
      throw error;
    }
  }, [agentId, loadAgentInfo]);

  // Cache invalidation
  const invalidateAgentCache = useCallback((dataTypes) => {
    if (!agentId) return;
    invalidateCache(agentId, dataTypes);
  }, [agentId, invalidateCache]);

  // Data staleness checks
  const isAgentDataStale = useCallback(() => {
    if (!agentId) return true;
    return isDataStale(agentId, 'agentData');
  }, [agentId, isDataStale]);

  const isDeploymentStatusStale = useCallback(() => {
    if (!agentId) return true;
    return isDataStale(agentId, 'deploymentStatus');
  }, [agentId, isDataStale]);

  const isHealthStatusStale = useCallback(() => {
    if (!agentId) return true;
    return isDataStale(agentId, 'healthStatus');
  }, [agentId, isDataStale]);

  // Computed values
  const isLoading = agentState.loading || agentState.agentDataLoading;
  const isDeploymentLoading = agentState.deploymentStatusLoading;
  const isHealthLoading = agentState.healthStatusLoading;
  const isDeployed = agentState.deploymentStatus === true;
  const isHealthy = agentState.healthStatus?.available === true;
  const hasError = !!(agentState.error || initError);
  const errorMessage = agentState.error || initError;

  // Authentication and permission checks
  const isAuthenticated = !!currentUser;
  const isReady = isAuthenticated && (requireOwnership ? hasPermission === true : true);
  const canAccess = isReady && !hasError;

  // Data availability flags
  const hasAgentData = !!agentState.data;
  const hasDeploymentStatus = agentState.deploymentStatus !== null;
  const hasHealthStatus = !!agentState.healthStatus;

  return {
    // Core data
    agentData: agentState.data,
    isDeployed,
    deploymentStatus: agentState.deploymentStatus,
    healthStatus: agentState.healthStatus,
    isHealthy,

    // Loading states
    isLoading,
    isDeploymentLoading,
    isHealthLoading,
    agentDataLoading: agentState.agentDataLoading,
    
    // Error handling
    hasError,
    error: errorMessage,
    
    // Permission and authentication
    isAuthenticated,
    hasPermission,
    isReady,
    canAccess,
    
    // Data availability
    hasAgentData,
    hasDeploymentStatus,
    hasHealthStatus,
    
    // Manual refresh functions
    refreshAgentData,
    refreshDeploymentStatus,
    refreshHealthStatus,
    refreshAll,
    
    // Cache management
    invalidateCache: invalidateAgentCache,
    isAgentDataStale,
    isDeploymentStatusStale,
    isHealthStatusStale,
    
    // Cache timestamps (for debugging)
    lastUpdated: agentState.lastUpdated,
    
    // Agent info shorthand
    agentName: agentState.data?.name,
    agentId: agentId,
    ownerId: agentState.data?.owner_id || agentState.data?.userId,
  };
};

/**
 * Lightweight hook for just checking if an agent exists and user has permission
 * Useful for route guards and permission checks without loading full data
 */
export const useAgentPermission = (agentId) => {
  const { currentUser } = useAuth();
  const { loadAgentData } = useAgentContext();
  const [checking, setChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentId || !currentUser) {
      setChecking(false);
      setHasPermission(false);
      return;
    }

    const checkPermission = async () => {
      try {
        setChecking(true);
        const agentData = await loadAgentData(agentId);
        const ownerId = agentData.owner_id || agentData.userId;
        const userHasPermission = ownerId === currentUser.uid;
        
        setHasPermission(userHasPermission);
        setError(userHasPermission ? null : 'You do not have permission to access this agent');
      } catch (err) {
        setHasPermission(false);
        setError(err.message);
      } finally {
        setChecking(false);
      }
    };

    checkPermission();
  }, [agentId, currentUser, loadAgentData]);

  return {
    checking,
    hasPermission,
    error,
    canAccess: hasPermission && !error
  };
};

export default useAgent;