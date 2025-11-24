/**
 * Alchemist Service
 * 
 * Handles direct interactions with the Alchemist agent
 */
// import { db } from '../../utils/firebase';
import { getCurrentUser } from '../context';
import { api } from '../config/apiConfig';
import { ENDPOINTS } from '../config/apiConfig';
// import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'; // REMOVED: Firebase/Firestore

/**
 * Interact directly with the Alchemist agent
 * Alchemist interactions are user-scoped within a project context
 * @param {string} message - The message to send
 * @param {string|null} projectId - The project ID for access control
 */
export const interactWithAlchemist = async (message, projectId = null) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    const payload = {
      message,
      user_id: userId,
      project_id: projectId, // Pass project context for access control
      source: 'project-dashboard' // Identify request source for project-scoped access
    };

    const response = await api.post(`${ENDPOINTS.ALCHEMIST}/interact`, payload);
    console.log('API response for Alchemist interaction:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error interacting with Alchemist agent:', error);
    throw error;
  }
};

/**
 * Get Alchemist conversation history
 */
export const getAlchemistConversations = async (agentId = null) => {
  try {
    const params = agentId ? { agent_id: agentId } : {};
    const response = await api.get(`${ENDPOINTS.ALCHEMIST}/conversations`, { params });
    console.log('API response for Alchemist conversations:', response.data);
    return response.data.conversations || [];
  } catch (error) {
    console.error('Error getting Alchemist conversations:', error);
    throw error;
  }
};

/**
 * Clear Alchemist conversation history
 */
export const clearAlchemistConversation = async (agentId = null) => {
  try {
    const payload = agentId ? { agent_id: agentId } : {};
    const response = await api.delete(`${ENDPOINTS.ALCHEMIST}/conversations`, { data: payload });
    console.log('API response for clearing Alchemist conversation:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error clearing Alchemist conversation:', error);
    throw error;
  }
};

/**
 * Upload files for agent creation and process them with AI
 */
export const uploadFilesForAgentCreation = async (files, agentId) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('agent_id', agentId);

    // Add files to form data
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append(`file_${i}`, file, file.name);
    }

    console.log(`Uploading ${files.length} files for agent ${agentId}...`);

    // Upload files to the processing endpoint
    const response = await api.post(`${ENDPOINTS.ALCHEMIST}/upload-files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for file processing
    });

    console.log('API response for file upload:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading files for agent creation:', error);
    throw new Error(error.response?.data?.message || error.message || 'File upload failed');
  }
};

/**
 * Send user message with optional attachments to Alchemist
 * Alchemist interactions are user-scoped within a project context
 * @param {string} message - The message to send
 * @param {Array|null} attachments - Optional attachments
 * @param {string|null} projectId - The project ID for access control
 */
export const sendUserMessageWithAttachments = async (message, attachments = null, projectId = null) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    const payload = {
      message,
      user_id: userId,
      project_id: projectId, // Pass project context for access control
      source: 'project-dashboard', // Identify request source for project-scoped access
      attachments: attachments
    };

    const response = await api.post(`${ENDPOINTS.ALCHEMIST}/interact`, payload);
    console.log('API response for message with attachments:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message with attachments:', error);
    throw error;
  }
};

/**
 * Get Alchemist actions for an agent
 */
export const getAlchemistActions = async (agentId, options = {}) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    const params = {
      user_id: userId,
      limit: options.limit || 50,
      start_after: options.start_after,
      filter_category: options.filter_category
    };
    
    const response = await api.get(`${ENDPOINTS.ALCHEMIST}/agents/${agentId}/actions`, { params });
    console.log('API response for Alchemist actions:', response.data);
    return response.data.actions || [];
  } catch (error) {
    console.error('Error getting Alchemist actions:', error);
    throw error;
  }
};

/**
 * Get Alchemist actions summary for an agent
 */
export const getAlchemistActionsSummary = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    const params = { user_id: userId };
    
    const response = await api.get(`${ENDPOINTS.ALCHEMIST}/agents/${agentId}/actions/summary`, { params });
    console.log('API response for Alchemist actions summary:', response.data);
    return response.data.summary || {};
  } catch (error) {
    console.error('Error getting Alchemist actions summary:', error);
    throw error;
  }
};

/**
 * Delete all Alchemist actions for an agent (for cleanup/testing)
 */
export const deleteAlchemistActions = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    const payload = { user_id: userId };
    
    const response = await api.delete(`${ENDPOINTS.ALCHEMIST}/agents/${agentId}/actions`, { data: payload });
    console.log('API response for deleting Alchemist actions:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting Alchemist actions:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time Alchemist actions for an agent
 * 
 * @param {string} agentId - The agent ID to subscribe to
 * @param {function} onUpdate - Callback function called with updated actions array
 * @param {function} onError - Callback function called when an error occurs
 * @returns {function} Unsubscribe function
 */
export const subscribeToAlchemistActions = (agentId, onUpdate, onError) => {
  console.log(`Setting up real-time Alchemist actions listener for agent ${agentId}`);

  if (!agentId) {
    const error = new Error('Agent ID is required for subscription');
    console.error('Subscription error:', error);
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }

  try {
    // REMOVED: Firestore real-time listener
    // const actionsCollection = collection(db, 'agents', agentId, 'alchemist_actions');
    // const actionsQuery = query(
    //   actionsCollection,
    //   orderBy('metadata.timestamp', 'desc')
    // );
    // const unsubscribe = onSnapshot(actionsQuery, callback);
    // TODO: Replace with WebSocket or polling for real-time updates

    console.warn('subscribeToAlchemistActions: Firestore disabled, no real-time updates');

    // Call onUpdate immediately with empty array to prevent UI errors
    setTimeout(() => {
      console.log(`Stub update: 0 Alchemist actions for agent ${agentId}`);
      onUpdate([]);
    }, 0);

    // Return no-op unsubscribe function
    return () => {
      console.log(`Unsubscribe from Alchemist actions for agent ${agentId} (no-op)`);
    };

  } catch (error) {
    console.error('Error setting up Alchemist actions subscription:', error);
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};