/**
 * Activity Service for Olbrain Platform
 * 
 * Direct Firestore-based activity logging system.
 * Handles all activity tracking and retrieval operations.
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  startAfter
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { getCurrentUser } from '../context';
import { DocumentFields } from '../../constants/collections';
import {
  getActivityCategory,
  getDefaultSeverity,
  RESOURCE_TYPES,
  ACTOR_TYPES
} from '../../constants/activityTypes';
import { agentBuilderApi } from '../config/apiConfig';

// ============================================================================
// ACTIVITY STORAGE ROUTING
// ============================================================================

/**
 * Determine the correct Firestore collection path for storing an activity
 * Routes activities to appropriate level: user, agent, project, or organization
 *
 * @param {Object} activityData - Activity data with resource info
 * @returns {string} Firestore collection path or null if invalid
 */
const getActivityStoragePath = (activityData) => {
  const { resource_type, resource_id, actor_id, organization_id } = activityData;

  // Route based on resource_type
  switch(resource_type) {
    case RESOURCE_TYPES.USER:
      // User-level activities → user_profiles/{userId}/activities
      const userId = resource_id || actor_id;
      if (!userId) {
        console.warn('No user ID available for user activity');
        return null;
      }
      return `user_profiles/${userId}/activities`;

    case RESOURCE_TYPES.AGENT:
      // Agent-level activities → agents/{agentId}/activities
      if (!resource_id) {
        console.warn('No agent ID available for agent activity');
        return null;
      }
      return `agents/${resource_id}/activities`;

    case RESOURCE_TYPES.PROJECT:
      // Project-level activities → projects/{projectId}/activities
      if (!resource_id) {
        console.warn('No project ID available for project activity');
        return null;
      }
      return `projects/${resource_id}/activities`;

    case RESOURCE_TYPES.ORGANIZATION:
      // Organization-level activities → organizations/{orgId}/activities
      const orgId = resource_id || organization_id;
      if (!orgId) {
        console.warn('No organization ID available for organization activity');
        return null;
      }
      return `organizations/${orgId}/activities`;

    default:
      // Default fallback to organization level
      if (!organization_id) {
        console.warn('No organization ID available for default activity storage');
        return null;
      }
      return `organizations/${organization_id}/activities`;
  }
};

// Helper function to remove undefined values from objects
const cleanObject = (obj) => {
  if (obj === null || obj === undefined) return {};
  if (typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cleaned[key] = cleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log an activity to Firestore via backend API
 * @param {Object} activityData - Activity data
 * @param {string} activityData.activity_type - Type of activity
 * @param {string} activityData.resource_type - Type of resource
 * @param {string} activityData.resource_id - ID of the resource
 * @param {Object} activityData.activity_details - Activity-specific details
 * @param {string} activityData.organization_id - Organization ID (optional, will be auto-detected)
 * @param {string} activityData.actor_id - Actor ID (optional, will use current user)
 * @param {Object} activityData.changes - Before/after changes (optional)
 */
export const logActivity = async (activityData) => {
  try {
    const user = getCurrentUser();
    if (!user && !activityData.actor_id) {
      console.warn('No authenticated user for activity logging');
      return null;
    }

    // Get organization from localStorage or activityData
    const organizationId = activityData.organization_id ||
                          localStorage.getItem('currentOrganizationId');

    if (!organizationId) {
      console.warn('No organization context for activity logging');
      return null;
    }

    // Generate session ID if not exists
    let sessionId = sessionStorage.getItem('activitySessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('activitySessionId', sessionId);
    }

    // Build metadata
    const metadata = {
      category: getActivityCategory(activityData.activity_type),
      severity: activityData.severity || getDefaultSeverity(activityData.activity_type),
      source_service: 'project-dashboard',
      user_email: user?.email || 'system',
      url: window.location.href,
      referrer: document.referrer,
      session_id: sessionId,
      user_agent: navigator.userAgent
    };

    // Build activity request for backend API
    const activityRequest = {
      organization_id: organizationId,
      activity_type: activityData.activity_type,
      resource_type: activityData.resource_type || RESOURCE_TYPES.SYSTEM,
      resource_id: activityData.resource_id || null,
      actor_id: activityData.actor_id || user?.uid,
      actor_type: activityData.actor_type || ACTOR_TYPES.USER,
      activity_details: cleanObject(activityData.activity_details || {}),
      metadata: metadata,
      changes: activityData.changes || null,
      before_values: activityData.before_values || null,
      after_values: activityData.after_values || null,
      severity: activityData.severity
    };

    // Log activity via backend API
    const response = await agentBuilderApi.post('/api/activities/log', activityRequest);

    const result = response.data;

    if (result.success) {
      console.log('✅ Activity logged via backend API:', {
        id: result.data.activity_id,
        type: activityData.activity_type,
        resource: `${activityData.resource_type}:${activityData.resource_id}`,
        actor: user?.email || 'system',
        path: result.data.collection_path
      });

      return result.data.activity_id;
    } else {
      console.warn('Activity logging failed:', result.message);
      return null;
    }

  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking main application flow
    return null;
  }
};

/**
 * Log activity with change tracking
 * @param {string} activityType - Type of activity
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @param {Object} beforeValues - Values before change
 * @param {Object} afterValues - Values after change
 * @param {Object} additionalDetails - Additional activity details
 */
export const logActivityWithChanges = async (
  activityType, 
  resourceType, 
  resourceId, 
  beforeValues, 
  afterValues, 
  additionalDetails = {}
) => {
  const changes = getChanges(beforeValues, afterValues);
  
  return logActivity({
    activity_type: activityType,
    resource_type: resourceType,
    resource_id: resourceId,
    activity_details: {
      changes_count: Object.keys(changes).length,
      changed_fields: Object.keys(changes),
      ...additionalDetails
    },
    changes,
    before_values: beforeValues,
    after_values: afterValues
  });
};

// ============================================================================
// ACTIVITY RETRIEVAL
// ============================================================================

/**
 * Get activities with filters
 * @param {Object} filters - Filter options
 * @param {string} filters.organization_id - Organization ID
 * @param {string} filters.resource_type - Resource type filter
 * @param {string} filters.resource_id - Resource ID filter
 * @param {string} filters.actor_id - Actor ID filter
 * @param {string} filters.activity_type - Activity type filter
 * @param {number} filters.limit - Number of activities to retrieve (default 50)
 * @param {Object} filters.after - Pagination cursor
 */
export const getActivities = async (filters = {}) => {
  try {
    const {
      organization_id,
      resource_type,
      resource_id,
      actor_id,
      activity_type,
      limit: queryLimit = 50,
      after = null
    } = filters;

    // Determine collection path based on resource type (multi-level routing)
    const collectionPath = getActivityStoragePath({
      resource_type,
      resource_id,
      actor_id,
      organization_id
    });

    if (!collectionPath) {
      console.warn('Unable to determine activity collection path - missing required IDs');
      return [];
    }

    // Check if this is a scoped subcollection query (user/agent/project level)
    // For subcollections, we don't need to filter by resource_type/resource_id as they're implicit in the path
    const isSubcollectionQuery = collectionPath.includes('/activities') &&
                                   (collectionPath.startsWith('user_profiles/') ||
                                    collectionPath.startsWith('agents/') ||
                                    collectionPath.startsWith('projects/'));

    let activitiesQuery = query(collection(db, collectionPath));

    // Apply filters only if NOT a subcollection query (to avoid unnecessary composite indexes)
    if (!isSubcollectionQuery) {
      if (organization_id) {
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.ORGANIZATION_ID, '==', organization_id)
        );
      }

      if (resource_type) {
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.RESOURCE_TYPE, '==', resource_type)
        );
      }

      if (resource_id) {
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.RESOURCE_ID, '==', resource_id)
        );
      }
    }

    // These filters can be applied to both types of queries
    if (actor_id && !isSubcollectionQuery) {
      activitiesQuery = query(activitiesQuery,
        where(DocumentFields.Activity.ACTOR_ID, '==', actor_id)
      );
    }

    if (activity_type) {
      activitiesQuery = query(activitiesQuery,
        where(DocumentFields.Activity.ACTIVITY_TYPE, '==', activity_type)
      );
    }

    // Note: Nested field queries (category, severity) removed to avoid Firestore 400 errors
    // These can be filtered client-side if needed

    // Add ordering and pagination
    activitiesQuery = query(activitiesQuery,
      orderBy(DocumentFields.CREATED_AT, 'desc'),
      limit(queryLimit)
    );

    if (after) {
      activitiesQuery = query(activitiesQuery, startAfter(after));
    }

    const snapshot = await getDocs(activitiesQuery);
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date()
    }));

    return {
      activities,
      hasMore: snapshot.docs.length === queryLimit,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
};

/**
 * Get activity feed for organization
 * @param {string} organizationId - Organization ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getActivityFeed = async (organizationId, limit = 50) => {
  return getActivities({
    organization_id: organizationId,
    limit
  });
};

/**
 * Get activities for a specific resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getResourceActivities = async (resourceType, resourceId, limit = 50) => {
  return getActivities({
    resource_type: resourceType,
    resource_id: resourceId,
    limit
  });
};

/**
 * Get activities by actor
 * @param {string} actorId - Actor ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getActorActivities = async (actorId, limit = 50) => {
  return getActivities({
    actor_id: actorId,
    limit
  });
};

// ============================================================================
// REAL-TIME ACTIVITY SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to activities with real-time updates
 * @param {Function} callback - Callback function for activity updates
 * @param {Object} filters - Filter options (same as getActivities)
 */
export const subscribeToActivities = (callback, filters = {}) => {
  try {
    console.log('🔧 subscribeToActivities: Setting up subscription with filters:', filters);

    const {
      organization_id,
      resource_type,
      resource_id,
      actor_id,
      limit: queryLimit = 50
    } = filters;

    // Determine collection path based on resource type (multi-level routing)
    const collectionPath = getActivityStoragePath({
      resource_type,
      resource_id,
      actor_id,
      organization_id
    });

    if (!collectionPath) {
      console.warn('Unable to determine activity collection path for subscription - missing required IDs');
      callback([]);
      return () => {};
    }

    console.log('🔧 subscribeToActivities: Using collection path:', collectionPath);

    // Check if this is a scoped subcollection query (user/agent/project level)
    const isSubcollectionQuery = collectionPath.includes('/activities') &&
                                   (collectionPath.startsWith('user_profiles/') ||
                                    collectionPath.startsWith('agents/') ||
                                    collectionPath.startsWith('projects/'));

    // Build query step by step with validation
    let activitiesQuery = collection(db, collectionPath);

    // Apply filters only if NOT a subcollection query (to avoid unnecessary composite indexes)
    if (!isSubcollectionQuery) {
      if (organization_id) {
        console.log('🔧 Adding organization filter:', organization_id);
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.ORGANIZATION_ID, '==', organization_id)
        );
      }

      if (resource_type) {
        console.log('🔧 Adding resource_type filter:', resource_type);
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.RESOURCE_TYPE, '==', resource_type)
        );
      }

      if (resource_id) {
        console.log('🔧 Adding resource_id filter:', resource_id);
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.RESOURCE_ID, '==', resource_id)
        );
      }

      if (actor_id) {
        console.log('🔧 Adding actor_id filter:', actor_id);
        activitiesQuery = query(activitiesQuery,
          where(DocumentFields.Activity.ACTOR_ID, '==', actor_id)
        );
      }
    } else {
      console.log('🔧 Subcollection query detected, skipping redundant filters');
    }

    // Add ordering and limit
    console.log('🔧 Adding orderBy and limit:', queryLimit);
    activitiesQuery = query(activitiesQuery,
      orderBy(DocumentFields.CREATED_AT, 'desc'),
      limit(queryLimit)
    );

    console.log('🔧 Final query created, setting up onSnapshot...');

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      console.log('🔧 onSnapshot triggered, docs received:', snapshot.docs.length);
      
      const activities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.() || new Date()
        };
      });

      console.log('🔧 Processed activities:', activities.length);
      callback(activities);
    }, (error) => {
      console.error('❌ Error in activity subscription:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      callback([]); // Return empty array on error
    });

    console.log('🔧 Subscription set up successfully');
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up activity subscription:', error);
    console.error('❌ Setup error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return () => {}; // Return no-op function
  }
};

/**
 * Subscribe to activity feed for organization
 * @param {string} organizationId - Organization ID
 * @param {Function} callback - Callback function
 * @param {number} limit - Number of activities to retrieve
 */
export const subscribeToActivityFeed = (organizationId, callback, queryLimit = 50) => {
  console.log('🔧 subscribeToActivityFeed: Called with:', { organizationId, queryLimit });

  // Organization-level activity feed queries from organizations/{orgId}/activities
  try {
    if (!organizationId) {
      console.warn('🔧 subscribeToActivityFeed: No organizationId provided');
      callback([]);
      return () => {};
    }

    const activitiesQuery = query(
      collection(db, `organizations/${organizationId}/activities`),
      orderBy(DocumentFields.CREATED_AT, 'desc'),
      limit(queryLimit)
    );

    console.log('🔧 subscribeToActivityFeed: Setting up query for organization:', organizationId);

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      console.log('🔧 subscribeToActivityFeed: Got snapshot with', snapshot.docs.length, 'docs');

      const activities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.() || new Date()
        };
      });

      console.log('🔧 subscribeToActivityFeed: Retrieved activities:', {
        count: activities.length,
        organizationId,
        sample: activities[0]
      });

      callback(activities);
    }, (error) => {
      console.error('❌ subscribeToActivityFeed: Subscription error:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ subscribeToActivityFeed: Setup error:', error);
    return () => {};
  }
};

/**
 * Subscribe to resource activities
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {Function} callback - Callback function
 * @param {number} limit - Number of activities to retrieve
 */
export const subscribeToResourceActivities = (resourceType, resourceId, callback, limit = 50) => {
  return subscribeToActivities(callback, {
    resource_type: resourceType,
    resource_id: resourceId,
    limit
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get changes between two objects
 * @param {Object} before - Before values
 * @param {Object} after - After values
 * @returns {Object} Changes object
 */
export const getChanges = (before, after) => {
  const changes = {};

  if (!before || !after) return changes;

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  allKeys.forEach(key => {
    const beforeValue = before[key];
    const afterValue = after[key];

    // Check if values are empty (undefined, null, or empty string)
    const beforeEmpty = beforeValue === undefined || beforeValue === null || beforeValue === '';
    const afterEmpty = afterValue === undefined || afterValue === null || afterValue === '';

    // Determine change type
    if (beforeEmpty && !afterEmpty) {
      // Field was added
      changes[key] = {
        type: 'added',
        from: beforeValue,
        to: afterValue
      };
    } else if (!beforeEmpty && afterEmpty) {
      // Field was removed
      changes[key] = {
        type: 'removed',
        from: beforeValue,
        to: afterValue
      };
    } else if (!beforeEmpty && !afterEmpty) {
      // Check if values actually changed
      // Deep comparison for objects
      if (typeof beforeValue === 'object' && typeof afterValue === 'object') {
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
          changes[key] = {
            type: 'changed',
            from: beforeValue,
            to: afterValue
          };
        }
      } else if (beforeValue !== afterValue) {
        changes[key] = {
          type: 'changed',
          from: beforeValue,
          to: afterValue
        };
      }
    }
    // If both are empty, no change to track
  });

  return changes;
};

/**
 * Check if activity should be shown to users (filter out technical/test activities)
 * @deprecated Use ActivityFilter.filterUserRelevantActivities() for consistent filtering
 * @param {Object} activity - Activity object
 * @returns {boolean} True if activity should be displayed to users
 */
export const isUserRelevantActivity = (activity) => {
  // Simplified implementation to avoid circular import
  const activityType = activity.activity_type;
  
  if (!activityType) return false;

  // Filter out test and debug activities
  if (activityType.includes('test_') || 
      activityType.includes('debug_') || 
      activityType.includes('_test') ||
      activityType.includes('_debug')) {
    return false;
  }
  
  // Filter out system maintenance activities
  if (activityType.includes('maintenance') || 
      activityType.includes('cleanup') ||
      activityType.includes('migration') ||
      activityType.includes('backup')) {
    return false;
  }
  
  // Filter out very technical activities
  if (activityType.includes('firestore_') ||
      activityType.includes('database_') ||
      activityType.includes('auth_token') ||
      activityType.includes('session_') ||
      activityType.includes('cache_')) {
    return false;
  }
  
  return true;
};

/**
 * Format activity for display
 * @param {Object} activity - Activity object
 * @returns {Object} Formatted activity
 */
export const formatActivity = (activity) => {
  return {
    ...activity,
    timeAgo: getTimeAgo(activity.created_at),
    displayName: getActivityDisplayName(activity),
    actorName: getActorDisplayName(activity),
    resourceName: getResourceDisplayName(activity)
  };
};

/**
 * Get time ago string
 */
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString();
};

/**
 * Get display name for activity
 */
const getActivityDisplayName = (activity) => {
  return activity.activity_type.replace(/_/g, ' ').toLowerCase();
};

/**
 * Get actor display name
 */
const getActorDisplayName = (activity) => {
  // Prefer user email, then try to extract name from email
  if (activity.metadata?.user_email) {
    const email = activity.metadata.user_email;
    // Extract name part from email (e.g., "john.smith@company.com" → "John Smith")
    const namePart = email.split('@')[0];
    const formattedName = namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return formattedName || email;
  }
  
  // Fallback to generic names instead of showing raw UIDs
  if (activity.actor_type === 'system' || activity.actor_id === 'system') {
    return 'System';
  }
  
  return 'Team Member'; // Better than showing random UID
};

/**
 * Get resource display name
 */
const getResourceDisplayName = (activity) => {
  const details = activity.activity_details || {};
  
  // Try to get a meaningful name from activity details
  if (details.name) return details.name;
  if (details.resource_name) return details.resource_name;
  if (details.agent_name) return details.agent_name;
  if (details.project_name) return details.project_name;
  
  // If we have a resource type, provide a generic but meaningful name
  const resourceType = activity.resource_type;
  if (resourceType === 'agent') return 'an agent';
  if (resourceType === 'project') return 'a project';
  if (resourceType === 'user') return 'user profile';
  if (resourceType === 'organization') return 'organization';
  if (resourceType === 'system') return 'system';
  
  // Last resort - don't show random IDs, use generic term
  return 'item';
};

// ============================================================================
// CONVENIENCE FUNCTIONS FOR RESOURCE-SPECIFIC ACTIVITIES
// ============================================================================

/**
 * Get activities for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getUserActivities = (userId, limit = 50) => {
  return getActivities({
    resource_type: RESOURCE_TYPES.USER,
    resource_id: userId,
    limit
  });
};

/**
 * Get activities for a specific agent
 * @param {string} agentId - Agent ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getAgentActivities = (agentId, limit = 50) => {
  return getActivities({
    resource_type: RESOURCE_TYPES.AGENT,
    resource_id: agentId,
    limit
  });
};

/**
 * Get activities for a specific project
 * @param {string} projectId - Project ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getProjectActivities = (projectId, limit = 50) => {
  return getActivities({
    resource_type: RESOURCE_TYPES.PROJECT,
    resource_id: projectId,
    limit
  });
};

/**
 * Get activities for a specific organization
 * @param {string} orgId - Organization ID
 * @param {number} limit - Number of activities to retrieve
 */
export const getOrganizationActivities = (orgId, limit = 50) => {
  return getActivities({
    resource_type: RESOURCE_TYPES.ORGANIZATION,
    resource_id: orgId,
    limit
  });
};

const ActivityService = {
  logActivity,
  logActivityWithChanges,
  getActivities,
  getActivityFeed,
  getResourceActivities,
  getActorActivities,
  getUserActivities,
  getAgentActivities,
  getProjectActivities,
  getOrganizationActivities,
  subscribeToActivities,
  subscribeToActivityFeed,
  subscribeToResourceActivities,
  getChanges,
  formatActivity,
  isUserRelevantActivity
};

export default ActivityService;