/**
 * Knowledge Library Service (v4.0.0) - Owner-based Access
 * 
 * Handles owner-based knowledge management with direct agent assignment
 * Implements direct Firestore access instead of API calls for better performance and reliability
 */

import { db, Collections } from '../../utils/firebase';
import { getCurrentUser } from '../context';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { ENDPOINTS, agentBuilderApi } from '../config/apiConfig';
import { logActivity } from '../activity/activityService';
import { AGENT_ACTIVITIES, RESOURCE_TYPES, ACTIVITY_SEVERITY } from '../../constants/activityTypes';

// ============================================================================
// Organization Knowledge Library Operations - Direct Firestore Access
// ============================================================================

// Organization knowledge library functions removed - using agent-only knowledge system

// Assignment functions removed in v4.0.0 - knowledge is now directly assigned via agent_id field

// getAgentAccessibleKnowledge removed - redundant with getAgentKnowledge

// searchOrganizationKnowledge removed - using agent-only knowledge system


// createKnowledgeAssignment removed in v4.0.0 - knowledge is assigned directly via agent_id field during upload

/**
 * Delete agent knowledge (soft delete) with embedding archival
 * @param {string} knowledgeId - Knowledge ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAgentKnowledge = async (knowledgeId) => {
  try {
    console.log('Deleting agent knowledge via knowledge-vault API:', knowledgeId);

    if (!knowledgeId) {
      throw new Error('Knowledge ID is required');
    }

    // Get knowledge details before deletion for logging
    const knowledgeRef = doc(db, Collections.KNOWLEDGE_LIBRARY, knowledgeId);
    const knowledgeDoc = await getDoc(knowledgeRef);
    const knowledgeData = knowledgeDoc.exists() ? knowledgeDoc.data() : null;

    if (!knowledgeDoc.exists()) {
      throw new Error('Knowledge item not found');
    }

    // Get current user ID
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call knowledge-vault deletion endpoint with user_id as query parameter
    const { kbApi } = await import('../config/apiConfig');

    const response = await kbApi.delete(
      `/api/knowledge-base/files/${knowledgeId}`,
      {
        params: { user_id: userId }
      }
    );

    console.log('Knowledge-vault deletion response:', response.data);

    // Log successful knowledge deletion activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.KNOWLEDGE_REMOVED,
        resource_type: RESOURCE_TYPES.KNOWLEDGE,
        resource_id: knowledgeId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: knowledgeData?.agent_id || 'unknown',
        activity_details: {
          knowledge_id: knowledgeId,
          filename: knowledgeData?.knowledge_info?.filename || 'unknown',
          agent_id: knowledgeData?.agent_id,
          owner_id: knowledgeData?.owner_id,
          action: 'deleted',
          deletion_method: 'knowledge_vault_api'
        }
      });
    } catch (logError) {
      console.error('Failed to log knowledge deletion activity:', logError);
    }

    console.log('Agent knowledge deleted successfully via knowledge-vault API');
    return true;

  } catch (error) {
    console.error('Error deleting agent knowledge via knowledge-vault API:', error);

    // Provide more specific error messages
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;

      if (status === 404) {
        throw new Error('Knowledge file not found or already deleted');
      } else if (status === 403) {
        throw new Error('Permission denied: You do not have access to delete this file');
      } else if (status === 401) {
        throw new Error('Authentication failed: Please refresh the page and try again');
      } else {
        throw new Error(`Failed to delete knowledge: ${message}`);
      }
    }

    throw new Error(`Failed to delete knowledge: ${error.message}`);
  }
};

// Keep the old function for backward compatibility during transition
export const deleteKnowledgeAssignment = deleteAgentKnowledge;

/**
 * Add URL to knowledge library for scraping and indexing
 * @param {string} agentId - Agent ID for direct assignment
 * @param {string} url - URL to scrape and add
 * @param {Object} options - Additional options (title, description)
 * @returns {Promise<Object>} Added knowledge item
 */
export const addUrlToKnowledgeLibrary = async (agentId, url, options = {}) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`Adding URL to knowledge library: ${url} for agent ${agentId}`);

    // Prepare request data
    const requestData = {
      url: url,
      agent_id: agentId,
      created_by: userId,
      title: options.title || null,
      description: options.description || null
    };

    // Call the new add-url endpoint
    const { kbApi } = await import('../config/apiConfig');

    const response = await kbApi.post(
      `/api/knowledge-base/add-url`,
      requestData
    );

    console.log(`Successfully added URL: ${url}`);
    console.log('URL addition response:', response.data);

    const addResponse = response.data;

    if (addResponse.status === 'success') {
      console.log(`URL added successfully. Knowledge ID: ${addResponse.knowledge_id}`);

      // Log successful URL addition activity
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.KNOWLEDGE_ADDED,
          resource_type: RESOURCE_TYPES.KNOWLEDGE,
          resource_id: addResponse.knowledge_id,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: addResponse.agent_id,
          activity_details: {
            knowledge_id: addResponse.knowledge_id,
            url: url,
            content_type: 'url',
            owner_id: addResponse.owner_id,
            agent_id: addResponse.agent_id,
            upload_method: 'url_scraping',
            user_id: userId
          }
        });
      } catch (logError) {
        console.error('Failed to log URL addition activity:', logError);
      }

      return addResponse;
    } else {
      throw new Error('URL addition failed: ' + (addResponse.message || 'Unknown error'));
    }

  } catch (error) {
    console.error('Error adding URL to knowledge library:', error);
    throw error;
  }
};

/**
 * Check if user can access knowledge item based on access control
 * @param {Object} knowledgeItem - Knowledge item
 * @param {Object} userContext - User context (user_id, role, owner_id, etc.)
 * @param {string} requiredPermission - Required permission level
 * @returns {boolean} Access granted
 */
export const canUserAccessKnowledge = (knowledgeItem, userContext, requiredPermission = 'read') => {
  try {
    if (!knowledgeItem || !userContext) {
      return false;
    }

    const accessControl = knowledgeItem.access_control;
    
    // If no access control defined, default to restricted
    if (!accessControl) {
      return false;
    }

    // Public access for entire organization
    if (accessControl.access_level === 'public') {
      return true;
    }

    // Private access only for creator
    if (accessControl.access_level === 'private') {
      return userContext.user_id === knowledgeItem.created_by;
    }

    // Restricted access - check specific permissions
    if (accessControl.access_level === 'restricted') {
      // Check role-based access
      if (accessControl.allowed_roles && accessControl.allowed_roles.includes(userContext.role)) {
        return true;
      }
      
      // Check project-based access
      if (accessControl.allowed_projects && userContext.project_id && 
          accessControl.allowed_projects.includes(userContext.project_id)) {
        return true;
      }
      
      // Check agent-based access
      if (accessControl.allowed_agents && userContext.agent_id && 
          accessControl.allowed_agents.includes(userContext.agent_id)) {
        return true;
      }
    }

    return false;

  } catch (error) {
    console.error('Error checking knowledge access:', error);
    return false;
  }
};

/**
 * Upload knowledge item to library (placeholder - would need file upload handling)
 * @param {string} organizationId - Organization ID (deprecated in v4.0.0 - kept for backwards compatibility)
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
/**
 * Upload files to Knowledge Vault and create library entries
 * @param {string} agentId - Agent ID for direct assignment (v4.0.0)
 * @param {Array|File} files - File(s) to upload
 * @param {Object} options - Upload options 
 * @returns {Promise<Array>} Uploaded knowledge items
 */
export const uploadToKnowledgeLibrary = async (agentId, files, options = {}) => {
  // Move variable declarations outside try block for error handling
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid;
  const fileArray = Array.isArray(files) ? files : [files];

  try {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!agentId) {
      throw new Error('Agent ID is required for v4.0.0 direct assignment');
    }

    if (fileArray.length === 0) {
      throw new Error('No files provided');
    }

    console.log(`Uploading ${fileArray.length} files to knowledge library for agent ${agentId}`);
    console.log('Upload context:', {
      userId,
      agentId,
      userEmail: currentUser?.email,
      fileName: fileArray[0]?.name
    });

    // Create FormData for upload
    const formData = new FormData();

    // For now, handle single file upload (backend expects single file)
    if (fileArray.length > 1) {
      throw new Error('Backend currently supports single file upload only. Please upload files one at a time.');
    }

    const file = fileArray[0];

    // Add file (backend expects 'file', not 'files')
    formData.append('file', file);

    // Ensure all required fields are present and valid
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new Error('Valid user ID is required for upload');
    }

    // Backend only expects these 2 fields as Form data:
    // - agent_id
    // - created_by
    // All other fields are generated server-side
    formData.append('agent_id', agentId);
    formData.append('created_by', userId);

    // Log what we're sending for debugging
    console.log('Sending FormData with fields:', {
      file: file.name,
      agent_id: agentId,
      created_by: userId
    });

    // Upload to Knowledge Vault
    const { kbApi } = await import('../config/apiConfig');

    const response = await kbApi.post(
      ENDPOINTS.KNOWLEDGE_LIBRARY_UPLOAD,
      formData
      // Don't set Content-Type manually for FormData, let axios set it with boundary
    );
    
    console.log(`Successfully uploaded file: ${file.name}`);
    console.log('Upload response:', response.data);
    
    // Backend now returns simple status response
    const uploadResponse = response.data;
    
    if (uploadResponse.status === 'success') {
      console.log(`File uploaded successfully. Knowledge ID: ${uploadResponse.knowledge_id}`);

      // Log successful knowledge upload activity
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.KNOWLEDGE_ADDED,
          resource_type: RESOURCE_TYPES.KNOWLEDGE,
          resource_id: uploadResponse.knowledge_id,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: uploadResponse.agent_id || userId,
          activity_details: {
            knowledge_id: uploadResponse.knowledge_id,
            filename: uploadResponse.filename,
            file_size: file.size,
            file_type: file.type,
            owner_id: uploadResponse.owner_id,
            agent_id: uploadResponse.agent_id,
            upload_method: 'knowledge_library',
            user_id: userId
          }
        });
      } catch (logError) {
        console.error('Failed to log knowledge upload activity:', logError);
      }

      // Return the backend response directly - no need for frontend to create Firestore documents
      return [uploadResponse];
    } else {
      throw new Error('Upload failed: ' + (uploadResponse.message || 'Unknown error'));
    }
    
  } catch (error) {
    console.error('Error uploading to knowledge library:', error);
    
    // Log upload failure activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.KNOWLEDGE_UPLOAD_FAILED,
        resource_type: RESOURCE_TYPES.KNOWLEDGE,
        resource_id: userId,
        related_resource_type: RESOURCE_TYPES.USER,
        related_resource_id: userId,
        severity: ACTIVITY_SEVERITY.ERROR,
        activity_details: {
          filename: fileArray[0]?.name || 'unknown',
          file_size: fileArray[0]?.size || 0,
          file_type: fileArray[0]?.type || 'unknown',
          owner_id: userId,
          agent_id: options.agent_id,
          error_message: error.message,
          error_status: error.response?.status,
          user_id: userId || 'unknown'
        }
      });
    } catch (logError) {
      console.error('Failed to log knowledge upload failure activity:', logError);
    }
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Upload files directly to an agent's knowledge base
 * This function uploads files to the knowledge library and automatically assigns them to the agent
 * @param {string} agentId - Agent ID
 * @param {Array|File} files - File(s) to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Uploaded and assigned knowledge items
 */
export const uploadAgentKnowledgeFiles = async (agentId, files, options = {}) => {
  try {
    console.log(`Uploading files directly to agent ${agentId} (v4.0.0 owner-based access)`);

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Get organization ID from localStorage or options
    const organizationId = options.organizationId ||
                          localStorage.getItem('currentOrganizationId') ||
                          getCurrentUser()?.organizationId;

    // Upload files to knowledge library with agent_id
    // This will automatically create the Firestore document and agent assignment
    const uploadedItems = await uploadToKnowledgeLibrary(agentId, files, {
      ...options,
      agent_id: agentId,
      organizationId: organizationId
    });
    
    // Assignment creation is now handled automatically in uploadToKnowledgeLibrary
    // when agent_id is provided in options
    
    console.log(`Successfully uploaded file to agent ${agentId}`);
    return uploadedItems;
    
  } catch (error) {
    console.error('Error uploading agent knowledge files:', error);
    throw error;
  }
};

/**
 * Upload URLs to knowledge library for processing by indexing job
 * @param {string} agentId - Agent ID
 * @param {Array} urls - Array of URL strings
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Uploaded URL items
 */
export const uploadURLsToKnowledgeLibrary = async (agentId, urls, options = {}) => {
  try {
    console.log(`Uploading ${urls.length} URLs to agent ${agentId} via backend API`);

    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('URLs array is required and cannot be empty');
    }

    // Get organization_id from multiple sources
    const organizationId = options.organizationId ||
                          localStorage.getItem('currentOrganizationId') ||
                          currentUser?.organizationId ||
                          'default-org';

    // Upload URLs via backend API
    const response = await agentBuilderApi.post('/api/knowledge/upload-urls', {
      agent_id: agentId,
      urls: urls,
      organization_id: organizationId
    });

    const result = response.data;

    if (!result.success) {
      throw new Error(result.message || 'Failed to upload URLs');
    }

    console.log(`✅ Successfully uploaded ${result.data.successful_count} URLs via backend API`);

    // Log activities for successfully uploaded URLs
    const successfulItems = result.data.uploaded_items.filter(item => item.status !== 'failed');

    for (const item of successfulItems) {
      try {
        await logActivity({
          activity_type: AGENT_ACTIVITIES.KNOWLEDGE_ADDED,
          resource_type: RESOURCE_TYPES.KNOWLEDGE,
          resource_id: item.knowledge_id,
          related_resource_type: RESOURCE_TYPES.AGENT,
          related_resource_id: agentId,
          activity_details: {
            knowledge_id: item.knowledge_id,
            filename: item.filename,
            source_url: item.url,
            owner_id: userId,
            agent_id: agentId,
            upload_method: 'url_upload_batch',
            user_id: userId
          }
        });
      } catch (logError) {
        console.error('Failed to log URL upload activity:', logError);
      }
    }

    return result.data.uploaded_items;

  } catch (error) {
    console.error('Error uploading URLs to knowledge library:', error);
    throw error;
  }
};

/**
 * Bulk upload to knowledge library (uses the main upload function)
 */
export const bulkUploadToKnowledgeLibrary = async (agentId, files, options = {}) => {
  return uploadToKnowledgeLibrary(agentId, files, options);
};

// Additional placeholder functions for API compatibility
export const updateKnowledgeLibraryItem = async (knowledgeId, updates) => {
  throw new Error('updateKnowledgeLibraryItem: Not implemented in Firestore version');
};

export const deleteKnowledgeLibraryItem = async (knowledgeId) => {
  throw new Error('deleteKnowledgeLibraryItem: Not implemented in Firestore version');
};

// Assignment functions removed in v4.0.0

// Project knowledge functions removed in v4.0.0 - simplified to direct agent assignment only


export const filterKnowledgeByAccess = (knowledgeItems, userContext) => {
  return knowledgeItems.filter(item => canUserAccessKnowledge(item, userContext));
};

export const createAccessControl = async (accessControlData) => {
  throw new Error('createAccessControl: Not implemented in Firestore version');
};

export const checkLegacyKnowledgeFiles = async (agentId) => {
  // Return empty array since we're moving away from legacy files
  console.log('checkLegacyKnowledgeFiles: No legacy files in v3.1.0 Firestore version');
  return [];
};

export const getKnowledgeMigrationStatus = async (organizationId) => {
  // Return completed status since we're using direct Firestore access
  return {
    migration_complete: true,
    total_files: 0,
    migrated_files: 0,
    status: 'completed'
  };
};

/**
 * Helper function to get knowledge items by their IDs
 * @param {Array<string>} knowledgeIds - Array of knowledge IDs
 * @returns {Promise<Array>} Knowledge items
 */
export const getKnowledgeItemsByIds = async (knowledgeIds) => {
  if (!knowledgeIds || knowledgeIds.length === 0) {
    return [];
  }

  try {
    const knowledgeItems = [];
    const knowledgeRef = collection(db, Collections.KNOWLEDGE_LIBRARY);

    // Firestore 'in' queries are limited to 10 items, so batch them
    const batchSize = 10;
    
    for (let i = 0; i < knowledgeIds.length; i += batchSize) {
      const batch = knowledgeIds.slice(i, i + batchSize);
      const q = query(
        knowledgeRef,
        where('__name__', 'in', batch.map(id => doc(knowledgeRef, id))),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        knowledgeItems.push({
          knowledge_id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
        });
      });
    }

    return knowledgeItems;

  } catch (error) {
    console.error('Error getting knowledge items by IDs:', error);
    throw new Error(`Failed to load knowledge items: ${error.message}`);
  }
};

/**
 * Helper function to deduplicate knowledge items (prioritizes direct assignments over inherited)
 * @param {Array} knowledgeItems - Array of knowledge items with potential duplicates
 * @returns {Array} Deduplicated knowledge items
 */
export const deduplicateKnowledge = (knowledgeItems) => {
  const knowledgeMap = new Map();

  knowledgeItems.forEach(item => {
    const existingItem = knowledgeMap.get(item.knowledge_id);
    
    if (!existingItem) {
      // First occurrence, add it
      knowledgeMap.set(item.knowledge_id, item);
    } else {
      // Duplicate found, prioritize based on source
      const sourcePriority = {
        'agent_direct': 3,
        'project_direct': 2,
        'organization_inherited': 1
      };
      
      const currentPriority = sourcePriority[item.knowledge_source] || 0;
      const existingPriority = sourcePriority[existingItem.knowledge_source] || 0;
      
      if (currentPriority > existingPriority) {
        // Replace with higher priority item
        knowledgeMap.set(item.knowledge_id, {
          ...item,
          duplicate_sources: [
            ...(existingItem.duplicate_sources || [existingItem.knowledge_source]),
            item.knowledge_source
          ]
        });
      } else {
        // Keep existing item but track the duplicate source
        knowledgeMap.set(item.knowledge_id, {
          ...existingItem,
          duplicate_sources: [
            ...(existingItem.duplicate_sources || [existingItem.knowledge_source]),
            item.knowledge_source
          ]
        });
      }
    }
  });

  return Array.from(knowledgeMap.values());
};

/**
 * Get agent's knowledge files (simplified version)
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of knowledge items assigned to agent
 */
export const getAgentKnowledge = async (agentId) => {
  try {
    console.log(`🤖 [Simplified Agent Knowledge] Loading knowledge for agent: ${agentId}`);

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // EMBED MODE: Use knowledge-vault API instead of Firestore
    const { kbApi } = await import('../config/apiConfig');
    const response = await kbApi.get(`/api/knowledge-base/${agentId}/files`);

    // knowledge-vault returns: { files: [...] }
    const knowledgeData = response.data.files || response.data || [];

    if (!Array.isArray(knowledgeData) || knowledgeData.length === 0) {
      console.log('🤖 [Simplified Agent Knowledge] No knowledge items found for agent');
      return [];
    }

    // Map API response to knowledge items using new schema
    const agentKnowledge = knowledgeData.map(data => {

      const knowledgeInfo = data.knowledge_info || {};

      return {
        knowledge_id: data.id || data.knowledge_id,
        id: data.id || data.knowledge_id, // Some components expect 'id' field
        agent_id: data.agent_id,
        owner_id: data.owner_id,
        organization_id: data.organization_id,
        created_by: data.created_by,

        // Knowledge info structure
        knowledge_info: {
          filename: knowledgeInfo.filename,
          content_type: knowledgeInfo.content_type || 'file',
          file_type: knowledgeInfo.file_type,
          file_size: knowledgeInfo.file_size,
          upload_timestamp: knowledgeInfo.upload_timestamp,
          source_url: knowledgeInfo.source_url,
          storage_info: knowledgeInfo.storage_info
        },

        // OpenAI Vector Store fields (replaces indexing/embeddings)
        vector_store_id: data.vector_store_id,
        openai_file_id: data.openai_file_id,
        openai_status: data.openai_status || 'unknown', // in_progress | completed | failed

        // Access control
        access_control: data.access_control || {
          access_level: 'private',
          visibility: 'organization',
          shared_with: [],
          allowed_roles: [],
          allowed_agents: []
        },

        // Metadata
        metadata: data.metadata || {
          tags: [],
          category: 'reference',
          priority: 'normal',
          upload_method: 'knowledge_library',
          source: 'knowledge_vault_backend'
        },

        // Status fields
        status: data.status || 'active',

        // Timestamps (already in ISO format from API)
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    });

    console.log(`🤖 [Simplified Agent Knowledge] Loaded ${agentKnowledge.length} knowledge items directly from knowledge_library`);
    return agentKnowledge;
    
  } catch (error) {
    console.error('Error loading agent knowledge:', error);
    throw new Error(`Failed to load agent knowledge: ${error.message}`);
  }
};

/**
 * Subscribe to real-time updates of agent knowledge - EMBED MODE (Polling)
 * @param {string} agentId - Agent ID to subscribe to
 * @param {Function} onUpdate - Callback function when data updates
 * @param {Function} onError - Callback function for errors
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAgentKnowledge = (agentId, onUpdate, onError) => {
  console.log(`🔄 [Knowledge Subscription] Setting up polling for agent: ${agentId} (Embed mode)`);

  if (!agentId) {
    onError(new Error('Agent ID is required'));
    return () => {}; // Return empty unsubscribe function
  }

  // EMBED MODE: Use polling instead of Firestore real-time listeners
  const pollInterval = 5000; // Poll every 5 seconds
  let timeoutId;

  const poll = async () => {
    try {
      // Call getAgentKnowledge which uses backend API
      const knowledge = await getAgentKnowledge(agentId);
      onUpdate(knowledge);
    } catch (error) {
      console.error('Error polling agent knowledge:', error);
      if (onError) onError(error);
    }
    timeoutId = setTimeout(poll, pollInterval);
  };

  // Start polling
  poll();

  // Return unsubscribe function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  /* DISABLED: Firestore real-time listener
  const knowledgeQuery = query(
    collection(db, Collections.KNOWLEDGE_LIBRARY),
    where('agent_id', '==', agentId),
    where('status', '==', 'active'),
    orderBy('created_at', 'desc')
  );

  // Set up real-time listener
  const unsubscribe = onSnapshot(
    knowledgeQuery,
    (snapshot) => {
      console.log(`📚 [Knowledge Subscription] Received update for agent ${agentId}: ${snapshot.docs.length} documents`);

      // Map documents to knowledge items using the same schema as getAgentKnowledge
      const agentKnowledge = snapshot.docs.map(doc => {
        const data = doc.data();

        const knowledgeInfo = data.knowledge_info || {};

        return {
          knowledge_id: doc.id,
          id: doc.id, // Some components expect 'id' field
          agent_id: data.agent_id,
          owner_id: data.owner_id,
          organization_id: data.organization_id,
          created_by: data.created_by,

          // Knowledge info structure
          knowledge_info: {
            filename: knowledgeInfo.filename,
            content_type: knowledgeInfo.content_type || 'file',
            file_type: knowledgeInfo.file_type,
            file_size: knowledgeInfo.file_size,
            upload_timestamp: knowledgeInfo.upload_timestamp,
            source_url: knowledgeInfo.source_url,
            storage_info: knowledgeInfo.storage_info
          },

          // Summary and snippet
          summary: data.summary,
          text_snippet: data.text_snippet,

          // OpenAI Vector Store fields
          vector_store_id: data.vector_store_id,
          openai_file_id: data.openai_file_id,
          openai_status: data.openai_status || 'unknown',
          openai_error: data.openai_error,

          // Access control
          access_control: data.access_control || {
            access_level: 'private',
            visibility: 'organization',
            shared_with: [],
            allowed_roles: [],
            allowed_agents: []
          },

          // Metadata
          metadata: data.metadata || {
            tags: [],
            category: 'reference',
            priority: 'normal',
            upload_method: 'knowledge_library',
            source: 'knowledge_vault_backend'
          },

          // Status fields
          status: data.status || 'active',
          version: data.version || 1,

          // Timestamps
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
          updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at,
          deleted_at: data.deleted_at?.toDate ? data.deleted_at.toDate().toISOString() : data.deleted_at,

          // Additional fields for compatibility
          content_type: knowledgeInfo.content_type || 'file',
          filename: knowledgeInfo.filename,
          size: knowledgeInfo.file_size,
          storage_info: knowledgeInfo.storage_info,
          source_url: knowledgeInfo.source_url
        };
      });

      // Call the update callback with the processed data
      onUpdate(agentKnowledge);
    },
    (error) => {
      console.error(`❌ [Knowledge Subscription] Error in listener for agent ${agentId}:`, error);
      onError(error);
    }
  );

  console.log(`✅ [Knowledge Subscription] Listener established for agent ${agentId}`);
  return unsubscribe;
  */ // End of disabled Firestore listener
};

/**
 * Download a knowledge file
 * @param {Object} knowledgeFile - Knowledge file object
 * @returns {Promise<void>} - Triggers browser download
 */
export const downloadKnowledgeFile = async (knowledgeFile) => {
  try {
    console.log('📥 [Download] Starting download for file:', {
      knowledge_id: knowledgeFile.knowledge_id,
      filename: knowledgeFile.knowledge_info?.filename || knowledgeFile.filename,
      storage_info: knowledgeFile.storage_info
    });

    if (!knowledgeFile) {
      throw new Error('Knowledge file data is required');
    }

    const filename = knowledgeFile.knowledge_info?.filename || knowledgeFile.filename || 'download';
    
    // Check if this is URL content (special handling)
    if (knowledgeFile.content_type === 'url' || knowledgeFile.source_url) {
      // For URL content, we need to get the processed content from the backend
      const { kbApi } = await import('../config/apiConfig');

      const response = await kbApi.get(
        `/api/download/knowledge/${knowledgeFile.knowledge_id}`,
        {
          responseType: 'blob'
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('📥 [Download] URL content downloaded successfully');
      return;
    }

    // For regular files, check storage info
    if (!knowledgeFile.storage_info) {
      throw new Error('No storage information available for this file');
    }

    // Try to get download URL from Firebase Storage
    try {
      const { kbApi } = await import('../config/apiConfig');

      // Call backend API to get signed download URL
      const response = await kbApi.get(
        `/api/download/knowledge/${knowledgeFile.knowledge_id}`,
        {
          responseType: 'blob'
        }
      );

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('📥 [Download] File downloaded successfully');

    } catch (storageError) {
      console.error('📥 [Download] Storage download failed:', storageError);
      
      // Fallback: if file has text content, download that
      if (knowledgeFile.text_content) {
        console.log('📥 [Download] Using text content fallback');
        const blob = new Blob([knowledgeFile.text_content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Unable to download file: no storage access and no text content available');
      }
    }

  } catch (error) {
    console.error('📥 [Download] Error downloading knowledge file:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Refresh file status from OpenAI Vector Store
 * Manually checks OpenAI and updates Firestore with latest status
 *
 * @param {string} knowledgeId - Knowledge file ID
 * @param {string} userId - User ID for access control
 * @returns {Promise<Object>} Updated status information
 */
export const refreshFileStatus = async (knowledgeId, userId) => {
  try {
    console.log(`🔄 [Refresh Status] Checking status for file: ${knowledgeId}`);

    const { kbApi } = await import('../config/apiConfig');

    const response = await kbApi.get(
      `/api/knowledge-base/files/${knowledgeId}/status`,
      {
        params: { user_id: userId }
      }
    );

    console.log(`✅ [Refresh Status] Status updated:`, response.data);
    return response.data;

  } catch (error) {
    console.error('❌ [Refresh Status] Error refreshing file status:', error);
    throw new Error(`Failed to refresh status: ${error.response?.data?.message || error.message}`);
  }
};

