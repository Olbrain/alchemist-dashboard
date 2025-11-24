import { useEffect, useCallback, useRef } from 'react';
import { useAgentContext } from '../contexts/AgentContext';
import deploymentService from '../services/deployment/deploymentService';

/**
 * Hook for managing smart cache invalidation based on deployment events
 * and other agent state changes
 */
export const useAgentCacheInvalidation = (agentId) => {
  const { invalidateCache } = useAgentContext();

  // Invalidate cache after deployment events
  const invalidateAfterDeployment = useCallback(async () => {
    if (!agentId) return;
    
    try {
      console.log(`[Cache Invalidation] Invalidating cache after deployment for agent: ${agentId}`);
      
      // Invalidate deployment status and health status immediately
      invalidateCache(agentId, ['deployment', 'health']);
      
      // Wait a bit for deployment to propagate, then refresh all data
      setTimeout(() => {
        invalidateCache(agentId, ['all']);
        console.log(`[Cache Invalidation] Full cache refresh completed for agent: ${agentId}`);
      }, 5000);
      
    } catch (error) {
      console.error('[Cache Invalidation] Error during post-deployment cache invalidation:', error);
    }
  }, [agentId, invalidateCache]);

  // Invalidate cache when agent is updated
  const invalidateAfterAgentUpdate = useCallback(async () => {
    if (!agentId) return;
    
    try {
      console.log(`[Cache Invalidation] Invalidating agent data cache after update: ${agentId}`);
      
      // Only invalidate agent data, keep deployment status
      invalidateCache(agentId, ['agentData']);
      
    } catch (error) {
      console.error('[Cache Invalidation] Error during post-update cache invalidation:', error);
    }
  }, [agentId, invalidateCache]);

  // Invalidate deployment status cache (useful for real-time updates)
  const invalidateDeploymentStatus = useCallback(async () => {
    if (!agentId) return;
    
    try {
      console.log(`[Cache Invalidation] Invalidating deployment status for agent: ${agentId}`);
      invalidateCache(agentId, ['deployment']);
      
    } catch (error) {
      console.error('[Cache Invalidation] Error invalidating deployment status:', error);
    }
  }, [agentId, invalidateCache]);

  // Refresh health status cache
  const refreshHealthStatus = useCallback(async () => {
    if (!agentId) return;
    
    try {
      console.log(`[Cache Invalidation] Refreshing health status for agent: ${agentId}`);
      invalidateCache(agentId, ['health']);
      
    } catch (error) {
      console.error('[Cache Invalidation] Error refreshing health status:', error);
    }
  }, [agentId, invalidateCache]);

  // Full cache refresh (nuclear option)
  const refreshAllCache = useCallback(async () => {
    if (!agentId) return;
    
    try {
      console.log(`[Cache Invalidation] Full cache refresh for agent: ${agentId}`);
      invalidateCache(agentId, ['all']);
      
    } catch (error) {
      console.error('[Cache Invalidation] Error during full cache refresh:', error);
    }
  }, [agentId, invalidateCache]);

  // Debounced visibility change handler
  const visibilityTimeoutRef = useRef(null);
  
  // Listen for page visibility changes to refresh stale data
  useEffect(() => {
    if (!agentId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(`[Cache Invalidation] Page became visible, checking for stale data: ${agentId}`);
        
        // Clear existing timeout to debounce
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        // Debounce the cache invalidation to prevent excessive calls
        visibilityTimeoutRef.current = setTimeout(() => {
          invalidateCache(agentId, ['health', 'deployment']);
        }, 2000); // Increased debounce time
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [agentId, invalidateCache]);

  // Debounced focus handler
  const focusTimeoutRef = useRef(null);
  
  // Listen for focus events to refresh data
  useEffect(() => {
    if (!agentId) return;

    const handleFocus = () => {
      console.log(`[Cache Invalidation] Window focused, refreshing critical data: ${agentId}`);
      
      // Clear existing timeout to debounce
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      
      // Debounce the cache invalidation to prevent excessive calls
      focusTimeoutRef.current = setTimeout(() => {
        invalidateCache(agentId, ['deployment', 'health']);
      }, 1500); // Debounce focus events
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [agentId, invalidateCache]);

  return {
    invalidateAfterDeployment,
    invalidateAfterAgentUpdate,
    invalidateDeploymentStatus,
    refreshHealthStatus,
    refreshAllCache,
  };
};

/**
 * Hook specifically for deployment-related cache management
 * Integrates with deployment service events
 */
export const useDeploymentCacheInvalidation = (agentId) => {
  const { invalidateAfterDeployment } = useAgentCacheInvalidation(agentId);

  // Set up deployment event listeners
  useEffect(() => {
    if (!agentId) return;

    let deploymentSubscription;

    const setupDeploymentListener = async () => {
      try {
        // Subscribe to deployment status changes
        deploymentSubscription = await deploymentService.subscribeToDeploymentUpdates(
          agentId,
          (deployments) => {
            // Check if any deployment completed or failed
            const hasRecentDeploymentEvent = deployments.some(deployment => {
              const updatedRecently = deployment.updated_at && 
                Date.now() - new Date(deployment.updated_at).getTime() < 60000; // Within last minute
              const statusChanged = deployment.status === 'completed' || deployment.status === 'failed';
              
              return updatedRecently && statusChanged;
            });

            if (hasRecentDeploymentEvent) {
              console.log(`[Deployment Cache] Detected recent deployment event for ${agentId}, invalidating cache`);
              invalidateAfterDeployment();
            }
          },
          (error) => {
            console.error(`[Deployment Cache] Deployment subscription error for ${agentId}:`, error);
          }
        );

        console.log(`[Deployment Cache] Set up deployment listener for agent: ${agentId}`);
        
      } catch (error) {
        console.error(`[Deployment Cache] Failed to setup deployment listener for ${agentId}:`, error);
      }
    };

    setupDeploymentListener();

    return () => {
      if (deploymentSubscription && typeof deploymentSubscription === 'function') {
        console.log(`[Deployment Cache] Cleaning up deployment listener for agent: ${agentId}`);
        try {
          deploymentSubscription();
        } catch (error) {
          console.error(`[Deployment Cache] Error cleaning up deployment subscription for ${agentId}:`, error);
        }
      }
    };
  }, [agentId, invalidateAfterDeployment]);

  return {
    invalidateAfterDeployment
  };
};

export default useAgentCacheInvalidation;