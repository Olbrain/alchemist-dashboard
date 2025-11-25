/**
 * Agent Publishing Service
 *
 * Handles agent publishing/unpublishing and runtime tracking
 *
 * Architecture:
 * - Uses DataAccess layer for backend API calls
 * - Supports both embed mode and standalone mode
 */
import { getDataAccess } from '../data/DataAccessFactory';
import { getCurrentUser } from '../context';
import { getServiceApiUrl } from '../config/apiConfig';

/**
 * Format hours into human-readable string
 */
export const formatRuntime = (hours) => {
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (hours < 24) {
    const fullHours = Math.floor(hours);
    const minutes = Math.floor((hours - fullHours) * 60);
    return minutes > 0
      ? `${fullHours} hour${fullHours !== 1 ? 's' : ''} ${minutes} min`
      : `${fullHours} hour${fullHours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return remainingHours > 0
      ? `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
      : `${days} day${days !== 1 ? 's' : ''}`;
  }
};

/**
 * Check if agent has completed deployments
 */
export const checkDeploymentStatus = async (agentId) => {
  try {
    const dataAccess = getDataAccess();
    const deploymentStatus = await dataAccess.getDeploymentStatus(agentId);
    return deploymentStatus?.hasDeployment || false;
  } catch (error) {
    console.error('Error checking deployment status:', error);
    return false;
  }
};

/**
 * Validate if agent can be published
 */
export const validatePublishPrerequisites = async (agentId) => {
  try {
    const dataAccess = getDataAccess();

    // Check if agent exists
    const agentData = await dataAccess.getAgent(agentId);

    if (!agentData) {
      return {
        valid: false,
        error: 'Agent not found'
      };
    }

    // Check if agent development_stage is 'deployed' or 'published'
    const developmentStage = agentData.development_stage;
    if (developmentStage !== 'deployed' && developmentStage !== 'published') {
      return {
        valid: false,
        error: `Agent must be deployed before publishing. Current stage: ${developmentStage || 'unknown'}`
      };
    }

    // Check if agent has deployment records
    const hasDeployment = await checkDeploymentStatus(agentId);
    if (!hasDeployment) {
      return {
        valid: false,
        error: 'Agent must be deployed before publishing'
      };
    }

    return {
      valid: true,
      error: null
    };
  } catch (error) {
    console.error('Error validating publish prerequisites:', error);
    return {
      valid: false,
      error: error.message || 'Validation failed'
    };
  }
};

/**
 * Publish an agent via agent-bridge API
 * This updates both Firestore and Cloud Run environment variable
 */
export const publishAgent = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Validate prerequisites
    const validation = await validatePublishPrerequisites(agentId);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const dataAccess = getDataAccess();
    const agentData = await dataAccess.getAgent(agentId);

    if (!agentData) {
      throw new Error('Agent not found');
    }

    // If already published, don't change anything
    if (agentData.published_status === true) {
      return {
        success: true,
        message: 'Agent is already published',
        data: agentData
      };
    }

    // Call agent-builder-ai-service backend API to publish agent
    // Backend handles all Firestore updates (agent document + audit trail)
    const agentBuilderUrl = getServiceApiUrl('agent-builder-ai');

    // Use organization API key for embed mode authentication
    const apiKey = window.REACT_APP_ORGANIZATION_API_KEY || process.env.REACT_APP_ORGANIZATION_API_KEY;

    const response = await fetch(`${agentBuilderUrl}/api/agents/${agentId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to publish agent: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: result.message || 'Agent published successfully',
      data: {
        ...agentData,
        published_status: result.published_status,
        development_stage: result.development_stage
      }
    };
  } catch (error) {
    console.error('Error publishing agent:', error);
    return {
      success: false,
      message: error.message || 'Failed to publish agent',
      error
    };
  }
};

/**
 * Unpublish an agent via agent-bridge API
 * This updates both Firestore and Cloud Run environment variable
 */
export const unpublishAgent = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const dataAccess = getDataAccess();
    const agentData = await dataAccess.getAgent(agentId);

    if (!agentData) {
      throw new Error('Agent not found');
    }

    // If already unpublished, don't change anything
    if (agentData.published_status === false || !agentData.published_status) {
      return {
        success: true,
        message: 'Agent is already unpublished',
        data: agentData
      };
    }

    // Call agent-builder-ai-service backend API to unpublish agent
    // Backend handles all Firestore updates (agent document + audit trail)
    // Backend also calculates session runtime from last publish action
    const agentBuilderUrl = getServiceApiUrl('agent-builder-ai');

    // Use organization API key for embed mode authentication
    const apiKey = window.REACT_APP_ORGANIZATION_API_KEY || process.env.REACT_APP_ORGANIZATION_API_KEY;

    const response = await fetch(`${agentBuilderUrl}/api/agents/${agentId}/unpublish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to unpublish agent: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: result.message || 'Agent unpublished successfully',
      data: {
        ...agentData,
        published_status: result.published_status,
        development_stage: result.development_stage,
        total_runtime_hours: result.total_runtime_hours
      },
      session_hours: result.session_hours
    };
  } catch (error) {
    console.error('Error unpublishing agent:', error);
    return {
      success: false,
      message: error.message || 'Failed to unpublish agent',
      error
    };
  }
};

/**
 * Get agent publish status and runtime information
 */
export const getPublishStatus = async (agentId) => {
  try {
    const dataAccess = getDataAccess();
    const publishStatus = await dataAccess.getPublishStatus(agentId);

    if (!publishStatus) {
      return {
        success: false,
        error: 'Failed to get publish status'
      };
    }

    // Format the response to match expected structure
    return {
      success: true,
      data: {
        published: publishStatus.isPublished || false,
        current_session_runtime: publishStatus.current_session_runtime || 0,
        total_runtime: publishStatus.total_runtime || 0,
        total_runtime_formatted: publishStatus.total_runtime ? formatRuntime(publishStatus.total_runtime) : '0 minutes',
        current_session_formatted: publishStatus.current_session_runtime ? formatRuntime(publishStatus.current_session_runtime) : '0 minutes'
      }
    };
  } catch (error) {
    console.error('Error getting publish status:', error);
    return {
      success: false,
      error: error.message || 'Failed to get publish status'
    };
  }
};

/**
 * Subscribe to publish status changes
 */
export const subscribeToPublishStatus = (agentId, callback) => {
  try {
    const dataAccess = getDataAccess();

    const unsubscribe = dataAccess.subscribeToPublishStatus(agentId, (publishStatus) => {
      if (publishStatus) {
        callback({
          success: true,
          data: {
            published: publishStatus.isPublished || false,
            current_session_runtime: publishStatus.current_session_runtime || 0,
            total_runtime: publishStatus.total_runtime || 0,
            total_runtime_formatted: publishStatus.total_runtime ? formatRuntime(publishStatus.total_runtime) : '0 minutes',
            current_session_formatted: publishStatus.current_session_runtime ? formatRuntime(publishStatus.current_session_runtime) : '0 minutes'
          }
        });
      } else {
        callback({
          success: false,
          error: 'Agent not found'
        });
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to publish status:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * DEPRECATED: Not currently used. Integration channels should be fetched via backend API.
 * TODO: Implement /api/agents/{agentId}/integration-channels endpoint if needed.
 *
 * Get integration channels for an agent
 */
/*
export const getIntegrationChannels = async (agentId) => {
  try {
    const channelsQuery = query(
      collection(db, Collections.INTEGRATION_CHANNELS),
      where('agent_id', '==', agentId)
    );

    const snapshot = await getDocs(channelsQuery);
    const channels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: channels
    };
  } catch (error) {
    console.error('Error getting integration channels:', error);
    return {
      success: false,
      error: error.message || 'Failed to get integration channels',
      data: []
    };
  }
};
*/

/**
 * Calculate total runtime for an agent
 */
export const calculateRuntime = async (agentId) => {
  try {
    const status = await getPublishStatus(agentId);
    if (!status.success) {
      return {
        success: false,
        error: status.error
      };
    }

    return {
      success: true,
      data: {
        total_hours: status.data.total_runtime,
        current_session_hours: status.data.current_session_runtime,
        formatted: status.data.total_runtime_formatted,
        current_session_formatted: status.data.current_session_formatted
      }
    };
  } catch (error) {
    console.error('Error calculating runtime:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate runtime'
    };
  }
};

/**
 * DEPRECATED: Not currently used. Publishing history should be fetched via backend API.
 * TODO: Implement /api/agents/{agentId}/publishing-history endpoint if needed.
 *
 * Get publishing history for an agent
 */
/*
export const getPublishingHistory = async (agentId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, `${Collections.AGENTS}/${agentId}/publishing`),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: history
    };
  } catch (error) {
    console.error('Error getting publishing history:', error);
    return {
      success: false,
      error: error.message || 'Failed to get publishing history',
      data: []
    };
  }
};
*/
