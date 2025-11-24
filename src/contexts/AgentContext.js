import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { getAgent } from '../services/agents/agentService';
import deploymentService from '../services/deployment/deploymentService';
import { testAgentEndpoint } from '../services/conversations/conversationService';

// Cache TTL in milliseconds
const CACHE_TTL = {
  AGENT_DATA: 10 * 60 * 1000, // 10 minutes - agent data rarely changes
  DEPLOYMENT_STATUS: 2 * 60 * 1000, // 2 minutes - deployment status can change
  HEALTH_STATUS: 30 * 1000, // 30 seconds - health status changes frequently
};

// Initial state
const initialState = {
  agents: {}, // agentId -> { data, deploymentStatus, healthStatus, loading, error, lastUpdated }
  activeSubscriptions: {}, // agentId -> unsubscribe function
};

// Action types
const AGENT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_AGENT_DATA: 'SET_AGENT_DATA',
  SET_DEPLOYMENT_STATUS: 'SET_DEPLOYMENT_STATUS',
  SET_HEALTH_STATUS: 'SET_HEALTH_STATUS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_AGENT: 'CLEAR_AGENT',
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  CLEAR_SUBSCRIPTION: 'CLEAR_SUBSCRIPTION',
};

// Reducer
function agentReducer(state, action) {
  switch (action.type) {
    case AGENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agentId]: {
            ...state.agents[action.agentId],
            loading: action.loading,
            ...(action.loadingType && {
              [`${action.loadingType}Loading`]: action.loading
            })
          }
        }
      };

    case AGENT_ACTIONS.SET_AGENT_DATA:
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agentId]: {
            ...state.agents[action.agentId],
            data: action.data,
            loading: false,
            agentDataLoading: false,
            error: null,
            lastUpdated: {
              ...state.agents[action.agentId]?.lastUpdated,
              agentData: Date.now()
            }
          }
        }
      };

    case AGENT_ACTIONS.SET_DEPLOYMENT_STATUS:
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agentId]: {
            ...state.agents[action.agentId],
            deploymentStatus: action.status,
            deploymentStatusLoading: false,
            lastUpdated: {
              ...state.agents[action.agentId]?.lastUpdated,
              deploymentStatus: Date.now()
            }
          }
        }
      };

    case AGENT_ACTIONS.SET_HEALTH_STATUS:
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agentId]: {
            ...state.agents[action.agentId],
            healthStatus: action.status,
            healthStatusLoading: false,
            lastUpdated: {
              ...state.agents[action.agentId]?.lastUpdated,
              healthStatus: Date.now()
            }
          }
        }
      };

    case AGENT_ACTIONS.SET_ERROR:
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agentId]: {
            ...state.agents[action.agentId],
            error: action.error,
            loading: false,
            agentDataLoading: false,
            deploymentStatusLoading: false,
            healthStatusLoading: false,
          }
        }
      };

    case AGENT_ACTIONS.CLEAR_AGENT:
      const newAgents = { ...state.agents };
      delete newAgents[action.agentId];
      return {
        ...state,
        agents: newAgents
      };

    case AGENT_ACTIONS.SET_SUBSCRIPTION:
      return {
        ...state,
        activeSubscriptions: {
          ...state.activeSubscriptions,
          [action.agentId]: action.unsubscribe
        }
      };

    case AGENT_ACTIONS.CLEAR_SUBSCRIPTION:
      const newSubscriptions = { ...state.activeSubscriptions };
      delete newSubscriptions[action.agentId];
      return {
        ...state,
        activeSubscriptions: newSubscriptions
      };

    default:
      return state;
  }
}

// Create context
const AgentContext = createContext();

// Provider component
export const AgentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const timeoutRefs = useRef({}); // For background refresh timers

  // Helper to check if data is stale - use ref to avoid recreating function
  const isDataStale = useCallback((agentId, dataType) => {
    const agent = state.agents[agentId];
    if (!agent?.lastUpdated?.[dataType]) return true;
    
    const ttl = CACHE_TTL[dataType.toUpperCase().replace('_STATUS', '_STATUS')] || CACHE_TTL.AGENT_DATA;
    return Date.now() - agent.lastUpdated[dataType] > ttl;
  }, []); // Remove state.agents dependency to prevent recreation

  // Load agent basic data
  const loadAgentData = useCallback(async (agentId, force = false) => {
    // Use state directly instead of depending on it in callback deps
    const agent = state.agents[agentId];
    
    // Skip if data is fresh and not forced
    if (!force && agent?.data && !isDataStale(agentId, 'agentData')) {
      return agent.data;
    }

    dispatch({ type: AGENT_ACTIONS.SET_LOADING, agentId, loading: true, loadingType: 'agentData' });

    try {
      const agentData = await getAgent(agentId);
      if (!agentData) {
        throw new Error('Agent not found');
      }

      dispatch({ type: AGENT_ACTIONS.SET_AGENT_DATA, agentId, data: agentData });
      return agentData;
    } catch (error) {
      console.error(`Error loading agent data for ${agentId}:`, error);
      dispatch({ type: AGENT_ACTIONS.SET_ERROR, agentId, error: error.message });
      throw error;
    }
  }, [isDataStale]); // Remove state.agents dependency

  // Load deployment status
  const loadDeploymentStatus = useCallback(async (agentId, force = false) => {
    const agent = state.agents[agentId];
    
    // Skip if data is fresh and not forced
    if (!force && agent?.deploymentStatus !== undefined && !isDataStale(agentId, 'deploymentStatus')) {
      return agent.deploymentStatus;
    }

    dispatch({ type: AGENT_ACTIONS.SET_LOADING, agentId, loading: true, loadingType: 'deploymentStatus' });

    try {
      const isDeployed = await deploymentService.getAgentServerStatus(agentId);
      dispatch({ type: AGENT_ACTIONS.SET_DEPLOYMENT_STATUS, agentId, status: isDeployed });
      return isDeployed;
    } catch (error) {
      console.error(`Error loading deployment status for ${agentId}:`, error);
      dispatch({ type: AGENT_ACTIONS.SET_DEPLOYMENT_STATUS, agentId, status: false });
      return false;
    }
  }, [state.agents, isDataStale]);

  // Load health status (with timeout)
  const loadHealthStatus = useCallback(async (agentId, force = false) => {
    const agent = state.agents[agentId];
    
    // Skip if data is fresh and not forced
    if (!force && agent?.healthStatus && !isDataStale(agentId, 'healthStatus')) {
      return agent.healthStatus;
    }

    dispatch({ type: AGENT_ACTIONS.SET_LOADING, agentId, loading: true, loadingType: 'healthStatus' });

    try {
      const healthData = await testAgentEndpoint(agentId);
      dispatch({ type: AGENT_ACTIONS.SET_HEALTH_STATUS, agentId, status: healthData });
      return healthData;
    } catch (error) {
      console.warn(`Health check failed for agent ${agentId}:`, error);
      const failedHealthStatus = { available: false, error: error.message };
      dispatch({ type: AGENT_ACTIONS.SET_HEALTH_STATUS, agentId, status: failedHealthStatus });
      return failedHealthStatus;
    }
  }, [state.agents, isDataStale]);

  // Set up real-time deployment status subscription with stable callbacks
  const setupDeploymentSubscription = useCallback((agentId) => {
    // Don't create duplicate subscriptions
    if (state.activeSubscriptions[agentId]) {
      return;
    }

    try {
      // Use stable callback references to prevent subscription recreation
      const onStatusUpdate = (isDeployed, serverData) => {
        dispatch({ type: AGENT_ACTIONS.SET_DEPLOYMENT_STATUS, agentId, status: isDeployed });
        console.log(`Real-time deployment status update for ${agentId}:`, isDeployed);
      };
      
      const onError = (error) => {
        console.error(`Deployment subscription error for ${agentId}:`, error);
      };

      const unsubscribe = deploymentService.subscribeToAgentServerStatus(
        agentId,
        onStatusUpdate,
        onError
      );

      dispatch({ type: AGENT_ACTIONS.SET_SUBSCRIPTION, agentId, unsubscribe });
    } catch (error) {
      console.error(`Failed to setup deployment subscription for ${agentId}:`, error);
    }
  }, []); // Removed state.activeSubscriptions dependency

  // Background refresh for health status with stable reference
  const scheduleHealthRefresh = useCallback((agentId) => {
    // Clear existing timeout
    if (timeoutRefs.current[`${agentId}_health`]) {
      clearTimeout(timeoutRefs.current[`${agentId}_health`]);
    }

    // Schedule next refresh only if agent is still deployed
    const scheduleNext = () => {
      timeoutRefs.current[`${agentId}_health`] = setTimeout(() => {
        // Double-check agent still exists and is deployed before refreshing
        if (state.agents[agentId]?.deploymentStatus) {
          loadHealthStatus(agentId, true)
            .then(() => {
              // Only reschedule if agent is still deployed
              if (state.agents[agentId]?.deploymentStatus) {
                scheduleNext(); // Use stable reference
              }
            })
            .catch((error) => {
              console.warn(`Health refresh failed for ${agentId}, stopping refresh cycle:`, error);
            });
        }
      }, CACHE_TTL.HEALTH_STATUS);
    };
    
    scheduleNext();
  }, [loadHealthStatus]); // Removed state.agents dependency to prevent recreation

  // Main function to load all agent data
  const loadAgentInfo = useCallback(async (agentId, options = {}) => {
    const { 
      includeHealth = true, 
      backgroundHealth = true,
      setupSubscription = true 
    } = options;

    try {
      // Load agent data and deployment status in parallel (critical data)
      const [agentData, isDeployed] = await Promise.all([
        loadAgentData(agentId),
        loadDeploymentStatus(agentId)
      ]);

      // Set up real-time subscription for deployment status
      if (setupSubscription) {
        setupDeploymentSubscription(agentId);
      }

      // Handle health check
      if (includeHealth && isDeployed) {
        if (backgroundHealth) {
          // Load health in background, don't block UI
          loadHealthStatus(agentId).then(() => {
            scheduleHealthRefresh(agentId);
          });
        } else {
          // Load health synchronously
          await loadHealthStatus(agentId);
          scheduleHealthRefresh(agentId);
        }
      }

      return { agentData, isDeployed };
    } catch (error) {
      console.error(`Error loading agent info for ${agentId}:`, error);
      throw error;
    }
  }, [loadAgentData, loadDeploymentStatus, loadHealthStatus, setupDeploymentSubscription, scheduleHealthRefresh]);

  // Cleanup function
  const cleanupAgent = useCallback((agentId) => {
    // Clear subscription - use state directly to avoid dependency
    const unsubscribe = state.activeSubscriptions[agentId];
    if (unsubscribe) {
      unsubscribe();
      dispatch({ type: AGENT_ACTIONS.CLEAR_SUBSCRIPTION, agentId });
    }

    // Clear timeouts
    if (timeoutRefs.current[`${agentId}_health`]) {
      clearTimeout(timeoutRefs.current[`${agentId}_health`]);
      delete timeoutRefs.current[`${agentId}_health`];
    }

    // Clear agent data
    dispatch({ type: AGENT_ACTIONS.CLEAR_AGENT, agentId });
  }, []); // Remove state.activeSubscriptions dependency

  // Invalidate cache (useful after deployments)
  const invalidateCache = useCallback((agentId, dataTypes = ['all']) => {
    if (dataTypes.includes('all')) {
      dispatch({ type: AGENT_ACTIONS.CLEAR_AGENT, agentId });
    } else {
      // Selective invalidation by updating lastUpdated timestamps
      const agent = state.agents[agentId];
      if (agent) {
        const updates = {};
        dataTypes.forEach(type => {
          if (type === 'deployment') {
            loadDeploymentStatus(agentId, true);
          } else if (type === 'health') {
            loadHealthStatus(agentId, true);
          }
        });
      }
    }
  }, [state.agents, loadDeploymentStatus, loadHealthStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all subscriptions and timeouts
      Object.values(state.activeSubscriptions).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Error during subscription cleanup:', error);
          }
        }
      });
      
      Object.values(timeoutRefs.current).forEach(timeoutId => {
        try {
          clearTimeout(timeoutId);
        } catch (error) {
          console.error('Error during timeout cleanup:', error);
        }
      });
      
      // Clear timeout refs object
      timeoutRefs.current = {};
    };
  }, []); // Empty dependency array for cleanup on unmount only

  const contextValue = {
    // State
    agents: state.agents,
    
    // Actions
    loadAgentInfo,
    loadAgentData,
    loadDeploymentStatus,
    loadHealthStatus,
    cleanupAgent,
    invalidateCache,
    
    // Utilities
    isDataStale,
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
};

// Custom hook to use the context
export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

export default AgentContext;