/**
 * React Hook for Activity Logging and Management
 * 
 * Provides easy access to activity logging functionality in React components.
 * Handles common activity operations with proper error handling and state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../utils/AuthContext';
import * as activityService from '../services/activity/activityService';
import { 
  USER_ACTIVITIES, 
  AGENT_ACTIVITIES, 
  PROJECT_ACTIVITIES, 
  ORGANIZATION_ACTIVITIES,
  RESOURCE_TYPES 
} from '../constants/activityTypes';

// ============================================================================
// MAIN ACTIVITY HOOK
// ============================================================================

export const useActivity = () => {
  const { currentUser, currentOrganization } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  // Get organization ID from context or localStorage
  const organizationId = currentOrganization?.organization_id || 
                        localStorage.getItem('currentOrganizationId');

  /**
   * Log an activity with automatic context
   */
  const logActivity = useCallback(async (activityData) => {
    if (!currentUser && !activityData.actor_id) {
      console.warn('No user context for activity logging');
      return null;
    }

    setIsLogging(true);
    try {
      const result = await activityService.logActivity({
        ...activityData,
        organization_id: organizationId,
        actor_id: activityData.actor_id || currentUser?.uid
      });
      
      return result;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    } finally {
      setIsLogging(false);
    }
  }, [currentUser, organizationId]);

  /**
   * Log activity with change tracking
   */
  const logActivityWithChanges = useCallback(async (
    activityType, 
    resourceType, 
    resourceId, 
    beforeValues, 
    afterValues, 
    additionalDetails = {}
  ) => {
    setIsLogging(true);
    try {
      const result = await activityService.logActivityWithChanges(
        activityType,
        resourceType,
        resourceId,
        beforeValues,
        afterValues,
        {
          ...additionalDetails,
          organization_id: organizationId,
          actor_id: currentUser?.uid
        }
      );
      
      return result;
    } catch (error) {
      console.error('Failed to log activity with changes:', error);
      return null;
    } finally {
      setIsLogging(false);
    }
  }, [currentUser, organizationId]);

  return {
    logActivity,
    logActivityWithChanges,
    isLogging,
    organizationId,
    currentUser
  };
};

// ============================================================================
// ACTIVITY FEED HOOK
// ============================================================================

export const useActivityFeed = (organizationId = null, limit = 50) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const unsubscribeRef = useRef(null);

  const orgId = organizationId || localStorage.getItem('currentOrganizationId');

  // Load initial activities
  const loadActivities = useCallback(async (refresh = false) => {
    if (!orgId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await activityService.getActivityFeed(orgId, limit);
      
      if (refresh) {
        setActivities(result.activities);
      } else {
        setActivities(prev => [...prev, ...result.activities]);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (err) {
      setError(err.message);
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, limit]);

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;

    try {
      setLoading(true);
      const result = await activityService.getActivities({
        organization_id: orgId,
        limit,
        after: lastDoc
      });

      setActivities(prev => [...prev, ...result.activities]);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (err) {
      setError(err.message);
      console.error('Error loading more activities:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, limit, hasMore, loading, lastDoc]);

  // Refresh activities
  const refresh = useCallback(() => {
    loadActivities(true);
  }, [loadActivities]);

  // Set up real-time subscription with debug logging
  useEffect(() => {
    if (!orgId) {
      console.log('📡 useActivityFeed: No organization ID provided');
      return;
    }

    console.log('📡 useActivityFeed: Setting up subscription for org:', orgId);
    console.log('📡 useActivityFeed: Limit:', limit);

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      console.log('📡 useActivityFeed: Cleaning up previous subscription');
      unsubscribeRef.current();
    }

    // Set up new subscription
    console.log('📡 useActivityFeed: Calling subscribeToActivityFeed...');
    unsubscribeRef.current = activityService.subscribeToActivityFeed(
      orgId,
      (newActivities) => {
        console.log('📡 useActivityFeed: Received activities callback:', {
          count: newActivities.length,
          orgId,
          sample: newActivities.length > 0 ? newActivities[0] : null,
          allActivities: newActivities
        });
        setActivities(newActivities);
        setLoading(false);
      },
      limit
    );

    console.log('📡 useActivityFeed: Subscription setup complete');

    return () => {
      if (unsubscribeRef.current) {
        console.log('📡 useActivityFeed: Cleaning up subscription on unmount');
        unsubscribeRef.current();
      }
    };
  }, [orgId, limit]);

  return {
    activities: activities.map(activityService.formatActivity),
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

// ============================================================================
// RESOURCE ACTIVITY HOOK
// ============================================================================

export const useResourceActivity = (resourceType, resourceId, limit = 20) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Load resource activities
  const loadActivities = useCallback(async () => {
    if (!resourceType || !resourceId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await activityService.getResourceActivities(
        resourceType, 
        resourceId, 
        limit
      );
      
      setActivities(result.activities);
    } catch (err) {
      setError(err.message);
      console.error('Error loading resource activities:', err);
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId, limit]);

  // Refresh activities
  const refresh = useCallback(() => {
    loadActivities();
  }, [loadActivities]);

  // Set up real-time subscription
  useEffect(() => {
    if (!resourceType || !resourceId) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Set up new subscription
    unsubscribeRef.current = activityService.subscribeToResourceActivities(
      resourceType,
      resourceId,
      (newActivities) => {
        setActivities(newActivities);
        setLoading(false);
      },
      limit
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [resourceType, resourceId, limit]);

  return {
    activities: activities.map(activityService.formatActivity),
    loading,
    error,
    refresh
  };
};

// ============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC ACTIVITIES
// ============================================================================

/**
 * Hook for user activity logging
 */
export const useUserActivity = () => {
  const { logActivity } = useActivity();

  const logLogin = useCallback(() => {
    return logActivity({
      activity_type: USER_ACTIVITIES.LOGIN,
      resource_type: RESOURCE_TYPES.USER
    });
  }, [logActivity]);

  const logLogout = useCallback(() => {
    return logActivity({
      activity_type: USER_ACTIVITIES.LOGOUT,
      resource_type: RESOURCE_TYPES.USER
    });
  }, [logActivity]);

  const logProfileUpdate = useCallback((details = {}) => {
    return logActivity({
      activity_type: USER_ACTIVITIES.PROFILE_UPDATED,
      resource_type: RESOURCE_TYPES.USER,
      activity_details: details
    });
  }, [logActivity]);

  const logEmailVerified = useCallback(() => {
    return logActivity({
      activity_type: USER_ACTIVITIES.EMAIL_VERIFIED,
      resource_type: RESOURCE_TYPES.USER
    });
  }, [logActivity]);

  const logPhoneVerified = useCallback(() => {
    return logActivity({
      activity_type: USER_ACTIVITIES.PHONE_VERIFIED,
      resource_type: RESOURCE_TYPES.USER
    });
  }, [logActivity]);

  return {
    logLogin,
    logLogout,
    logProfileUpdate,
    logEmailVerified,
    logPhoneVerified
  };
};

/**
 * Hook for agent activity logging
 */
export const useAgentActivity = () => {
  const { logActivity, logActivityWithChanges } = useActivity();

  const logAgentCreated = useCallback((agentId, agentData = {}) => {
    return logActivity({
      activity_type: AGENT_ACTIVITIES.CREATED,
      resource_type: RESOURCE_TYPES.AGENT,
      resource_id: agentId,
      activity_details: {
        name: agentData.name,
        type: agentData.type,
        ...agentData
      }
    });
  }, [logActivity]);

  const logAgentUpdated = useCallback((agentId, beforeData, afterData) => {
    return logActivityWithChanges(
      AGENT_ACTIVITIES.UPDATED,
      RESOURCE_TYPES.AGENT,
      agentId,
      beforeData,
      afterData,
      { name: afterData.name }
    );
  }, [logActivityWithChanges]);

  const logAgentDeployed = useCallback((agentId, deploymentData = {}) => {
    return logActivity({
      activity_type: AGENT_ACTIVITIES.DEPLOYED,
      resource_type: RESOURCE_TYPES.AGENT,
      resource_id: agentId,
      activity_details: deploymentData
    });
  }, [logActivity]);

  const logAgentArchived = useCallback((agentId, agentData = {}) => {
    return logActivity({
      activity_type: AGENT_ACTIVITIES.ARCHIVED,
      resource_type: RESOURCE_TYPES.AGENT,
      resource_id: agentId,
      activity_details: {
        name: agentData.name,
        reason: agentData.reason
      }
    });
  }, [logActivity]);

  const logAgentTestStarted = useCallback((agentId, testData = {}) => {
    return logActivity({
      activity_type: AGENT_ACTIVITIES.TEST_STARTED,
      resource_type: RESOURCE_TYPES.AGENT,
      resource_id: agentId,
      activity_details: testData
    });
  }, [logActivity]);

  return {
    logAgentCreated,
    logAgentUpdated,
    logAgentDeployed,
    logAgentArchived,
    logAgentTestStarted
  };
};

/**
 * Hook for project activity logging
 */
export const useProjectActivity = () => {
  const { logActivity } = useActivity();

  const logProjectCreated = useCallback((projectId, projectData = {}) => {
    return logActivity({
      activity_type: PROJECT_ACTIVITIES.CREATED,
      resource_type: RESOURCE_TYPES.PROJECT,
      resource_id: projectId,
      activity_details: {
        name: projectData.name,
        description: projectData.description,
        priority: projectData.priority
      }
    });
  }, [logActivity]);

  const logAgentAssigned = useCallback((projectId, agentId, agentData = {}) => {
    return logActivity({
      activity_type: PROJECT_ACTIVITIES.AGENT_ASSIGNED,
      resource_type: RESOURCE_TYPES.PROJECT,
      resource_id: projectId,
      activity_details: {
        agent_id: agentId,
        agent_name: agentData.name
      }
    });
  }, [logActivity]);

  return {
    logProjectCreated,
    logAgentAssigned
  };
};

/**
 * Hook for organization activity logging
 */
export const useOrganizationActivity = () => {
  const { logActivity } = useActivity();

  const logMemberInvited = useCallback((email, role, invitedBy) => {
    return logActivity({
      activity_type: ORGANIZATION_ACTIVITIES.MEMBER_INVITED,
      resource_type: RESOURCE_TYPES.ORGANIZATION,
      activity_details: {
        invited_email: email,
        role: role,
        invited_by: invitedBy
      }
    });
  }, [logActivity]);

  const logMemberJoined = useCallback((userId, userData = {}) => {
    return logActivity({
      activity_type: ORGANIZATION_ACTIVITIES.MEMBER_JOINED,
      resource_type: RESOURCE_TYPES.ORGANIZATION,
      resource_id: userId,
      activity_details: {
        user_email: userData.email,
        role: userData.role
      }
    });
  }, [logActivity]);

  return {
    logMemberInvited,
    logMemberJoined
  };
};

export default useActivity;