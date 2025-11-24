/**
 * Agent Service - Embed Mode
 *
 * Handles all agent-related API operations using backend APIs only.
 * No Firebase dependencies - authentication via organization API key.
 */
import { Collections, DocumentFields, ErrorMessages } from '../../utils/firebase';
import { api } from '../config/apiConfig';
import { ENDPOINTS } from '../config/apiConfig';
import { StatusValues } from '../../constants/collections';
import dataAccess from '../data/DataAccessFactory';
import { agentBuilderApi } from '../config/apiConfig';
import { getCurrentUser } from '../context';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current user's organization context - DEPRECATED
 * Removed - using owner-based access control instead
 */
// const getCurrentOrganizationContext = () => {
//   // DEPRECATED: Organization scoping removed
//   return null;
// };

/**
 * Check if user has permission for action - SIMPLIFIED
 * Now returns true for authenticated users since agents use owner-based access control
 */
const checkUserPermission = async (permission) => {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return false;
    }

    // With owner-based access control, authenticated users can perform actions on their own agents
    // The backend enforces ownership-based permissions
    console.info(`Permission check simplified: ${permission} granted for authenticated user`);
    return true;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

// ============================================================================
// AGENT TRANSFER OPERATIONS
// ============================================================================

/**
 * Transfer agent to another user
 */
export const transferAgent = async (agentId, targetUserId, reason = "") => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    const response = await api.post(`/agents/${agentId}/transfer`, {
      target_user_id: targetUserId,
      reason: reason
    });

    return response.data;
  } catch (error) {
    console.error('Error transferring agent:', error);
    throw new Error(error.response?.data?.message || 'Failed to transfer agent');
  }
};

/**
 * Get transfer history for an agent
 */
export const getAgentTransferHistory = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    const response = await api.get(`/agents/${agentId}/transfer-history`);
    return response.data;
  } catch (error) {
    console.error('Error getting agent transfer history:', error);
    throw new Error(error.response?.data?.message || 'Failed to get transfer history');
  }
};

/**
 * Transfer multiple agents to another user
 */
export const bulkTransferAgents = async (agentIds, targetUserId, reason = "") => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    const response = await api.post('/agents/bulk-transfer', {
      agent_ids: agentIds,
      target_user_id: targetUserId,
      reason: reason
    });

    return response.data;
  } catch (error) {
    console.error('Error bulk transferring agents:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk transfer agents');
  }
};

// ============================================================================
// AGENT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new agent via backend API
 */
export const createAgent = async (agentData) => {
  try {
    // Get current user
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    // Prepare API payload following backend AgentCreateRequest model
    const apiPayload = {
      name: agentData.name,
      description: agentData.description || '',
      project_id: agentData.project_id,
      agent_type: agentData.agent_type || agentData.type || null,
      industry: agentData.industry || null,
      use_case: agentData.use_case || null
    };

    console.log('🚀 Creating agent via backend API:', apiPayload);

    // Call backend API to create agent (uses Firestore auto-generated ID)
    const { agentBuilderApi } = await import('../config/apiConfig');
    const response = await agentBuilderApi.post('/api/agents', apiPayload);
    const responseData = response.data;

    console.log('✅ Backend API response:', responseData);

    // Wait for Firestore sync (following same pattern as project creation)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch via data access layer to confirm creation and get full data
    const createdAgent = await dataAccess.getAgent(responseData.agent_id);

    if (createdAgent) {
      console.log('✅ Agent confirmed via data access:', responseData.agent_id);
      return {
        id: createdAgent.id,
        ...createdAgent,
        // Add computed fields for UI compatibility
        name: createdAgent.basic_info?.name || createdAgent.name,
        description: createdAgent.basic_info?.description || createdAgent.description
      };
    }

    // Fallback if Firestore sync hasn't completed yet
    console.log('⚠️ Agent not yet in Firestore, returning API response');
    return {
      id: responseData.agent_id,
      agent_id: responseData.agent_id,
      ...responseData.agent,
      name: responseData.agent.basic_info?.name,
      description: responseData.agent.basic_info?.description
    };

  } catch (error) {
    console.error('Error creating agent:', error);
    // Extract error message from axios error response
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Update an existing agent directly in Firestore
 */
export const updateAgentDirectly = async (agentId, formData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to update agent
    const response = await agentBuilderApi.put(`/api/agents/${agentId}`, formData);

    console.log(`Agent ${agentId} updated successfully via backend API`);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Archive an agent via backend API
 */
export const archiveAgentDirectly = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to archive agent
    const response = await agentBuilderApi.post(`/api/agents/${agentId}/archive`);

    console.log(`Agent ${agentId} archived successfully via backend API`);
    return response.data;
  } catch (error) {
    console.error(`Error archiving agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};


/**
 * Create a lifecycle event for agent creation
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {string} agentName - Agent name
 */
// eslint-disable-next-line no-unused-vars
const createAgentCreationEvent = async (agentId, userId, agentName) => {
  try {
    const { db } = await import('../../utils/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    const eventData = {
      // organization_id removed in v4.0.0 owner-based schema
      event_info: {
        event_type: 'agent_created',
        event_category: 'agent',
        severity: 'info',
        source_service: 'agent-studio'
      },
      event_data: {
        resource_type: 'agent',
        resource_id: agentId,
        actor_id: userId,
        actor_type: 'user',
        event_payload: {
          agent_name: agentName,
          creation_method: 'frontend_service'
        },
        metadata: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          session_id: sessionStorage.getItem('sessionId') || 'unknown'
        }
      },
      event_timestamp: serverTimestamp(),
      [DocumentFields.CREATED_AT]: serverTimestamp(),
      [DocumentFields.UPDATED_AT]: serverTimestamp(),
      [DocumentFields.CREATED_BY]: userId,
      [DocumentFields.VERSION]: 1
    };
    
    const eventsRef = collection(db, Collections.EVENTS);
    await addDoc(eventsRef, eventData);
    
    console.log('Agent creation event logged:', agentId);
  } catch (error) {
    console.error('Error creating agent creation event:', error);
    // Don't throw error as it's not critical for agent creation
  }
};

/**
 * Get all agents for the current organization (with team-based filtering)
 */
export const getActiveAgents = async (organizationId, includeTeamAgents = true) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    // If no organizationId provided, we can't fetch active agents
    // This is a breaking change - callers must provide organizationId
    if (!organizationId) {
      console.warn('getActiveAgents called without organizationId - returning empty array');
      return [];
    }

    // Get active agents via data access layer
    const agents = await dataAccess.getActiveAgents(organizationId);

    // Process and add computed fields
    return agents.map(agentData => ({
      [DocumentFields.ID]: agentData.id || agentData.agent_id,
      [DocumentFields.AGENT_ID]: agentData.id || agentData.agent_id,
      ...agentData,
      // Add computed fields for UI compatibility
      name: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.NAME] || agentData.basic_info?.name || agentData.name,
      description: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.DESCRIPTION] || agentData.basic_info?.description || agentData.description,
      type: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.AGENT_TYPE] || agentData.basic_info?.agent_type || agentData.type,
      status: agentData.status || agentData[DocumentFields.Agent.LIFECYCLE_STATUS]?.[DocumentFields.Agent.DEVELOPMENT_STAGE] || agentData.lifecycle_status?.development_stage || 'draft',
      isOwnedByCurrentUser: (agentData[DocumentFields.Agent.OWNER_ID] || agentData.owner_id) === userId
    }));
  } catch (error) {
    console.error('Error getting active agents:', error);
    throw error;
  }
};

/**
 * Get archived agents for the current user (archives)
 */
export const getDeletedAgents = async (organizationId) => {
  try {
    console.log('🔍 Starting archived agents query...');

    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    // If no organizationId provided, we can't fetch deleted agents
    if (!organizationId) {
      console.warn('getDeletedAgents called without organizationId - returning empty array');
      return [];
    }

    console.log('👤 Fetching deleted agents for organization:', organizationId);

    // Get deleted agents via data access layer
    const agents = await dataAccess.getDeletedAgents(organizationId);

    console.log(`📋 Query returned ${agents.length} documents`);

    // Process and add computed fields
    const archivedAgents = agents.map(agentData => {
      // Extract agent name from nested structure (enterprise schema v3)
      const agentName = agentData?.basic_info?.name ||
                       agentData?.name ||
                       `Agent ${(agentData.id || agentData.agent_id || '').slice(-4)}`;

      const agentDescription = agentData?.basic_info?.description ||
                              agentData?.description ||
                              '';

      const agentType = agentData?.basic_info?.agent_type ||
                       agentData?.type ||
                       'general';

      console.log(`📄 Processing agent: ${agentData.id || agentData.agent_id}`, {
        status: agentData.status,
        archived_at: agentData.archived_at,
        owner_id: agentData.owner_id,
        extracted_name: agentName
      });

      return {
        [DocumentFields.ID]: agentData.id || agentData.agent_id,
        [DocumentFields.AGENT_ID]: agentData.id || agentData.agent_id,
        ...agentData,
        // Add computed fields for UI compatibility
        name: agentName,
        description: agentDescription,
        type: agentType
      };
    });

    // Sort manually by archived_at (newest first)
    archivedAgents.sort((a, b) => {
      const getTime = (timestamp) => {
        if (!timestamp) return 0;
        if (timestamp.seconds) return timestamp.seconds;
        if (timestamp instanceof Date) return timestamp.getTime() / 1000;
        if (typeof timestamp === 'string') return new Date(timestamp).getTime() / 1000;
        return timestamp;
      };

      const aTime = getTime(a.archived_at);
      const bTime = getTime(b.archived_at);
      return bTime - aTime; // Descending order (newest first)
    });

    console.log(`✅ Found ${archivedAgents.length} archived agents`);
    return archivedAgents;
  } catch (error) {
    console.error('💥 Error getting archived agents:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get an agent by ID with organization and team permission checking
 */
export const getAgent = async (agentId) => {
  try {
    // Get current user
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    // Get agent via data access layer (routes to Firestore or API based on deployment)
    const agentData = await dataAccess.getAgent(agentId);

    if (!agentData) {
      throw new Error(ErrorMessages.AGENT_NOT_FOUND);
    }

    // Check access permissions
    const agentOwnerId = agentData[DocumentFields.Agent.OWNER_ID] || agentData.userId || agentData.owner_id;
    const isOwner = agentOwnerId === userId;

    if (!isOwner) {
      // v4.0.0: Owner-based access - only owners can access their agents
      throw new Error(ErrorMessages.AGENT_ACCESS_DENIED);
    }

    return {
      [DocumentFields.ID]: agentData.id || agentData.agent_id,
      [DocumentFields.AGENT_ID]: agentData.id || agentData.agent_id,
      ...agentData,
      // Add computed fields for UI compatibility
      name: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.NAME] || agentData.basic_info?.name || agentData.name,
      description: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.DESCRIPTION] || agentData.basic_info?.description || agentData.description,
      type: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.AGENT_TYPE] || agentData.basic_info?.agent_type || agentData.type,
      status: agentData.status || agentData[DocumentFields.Agent.LIFECYCLE_STATUS]?.[DocumentFields.Agent.DEVELOPMENT_STAGE] || agentData.lifecycle_status?.development_stage || 'draft',
      isOwnedByCurrentUser: isOwner
    };
  } catch (error) {
    console.error(`Error getting agent ${agentId}:`, error);
    throw error;
  }
};

/**
 * Mark an agent as deleted (soft delete) - Sets lifecycle_state to 'deleted'
 */
export const markAgentAsDeleted = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to archive agent (soft delete)
    const response = await agentBuilderApi.post(`/api/agents/${agentId}/archive`);

    console.log(`Agent ${agentId} marked as deleted via backend API`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error marking agent ${agentId} as deleted:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Create a lifecycle event for agent deletion
 *
 * STANDARDIZED: This follows the exact format used by the backend AgentLifecycleService
 * to ensure consistency across all lifecycle event recording.
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {string} agentName - Agent name
 */
// eslint-disable-next-line no-unused-vars
const createAgentDeletionEvent = async (agentId, userId, agentName) => {
  try {
    const { db } = await import('../../utils/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Follow exact AgentLifecycleService format for consistency
    const eventData = {
      agent_id: agentId,
      event_type: 'agent_deleted',
      title: 'Agent Deleted',
      description: `Agent "${agentName}" has been marked as deleted and removed from active use`,
      user_id: userId,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
      metadata: {
        agent_name: agentName,
        deleted_by: userId,
        deletion_reason: 'user_initiated',
        final_lifecycle_state: 'archived',
        deletion_method: 'frontend_service'
      },
      priority: 'high' // Matches AgentLifecycleService.record_agent_deleted priority
    };
    
    const eventsRef = collection(db, 'agent_lifecycle_events');
    const docRef = await addDoc(eventsRef, eventData);
    
    // Update document with its own ID (matching backend pattern)
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'agent_lifecycle_events', docRef.id), {
      event_id: docRef.id
    });
    
    console.log('Agent deletion lifecycle event created:', agentId, 'Event ID:', docRef.id);
    
    // TODO: Consider migrating to use backend lifecycle API endpoint for better consistency
    // This would eliminate direct Firebase access from frontend
    
  } catch (error) {
    console.error('Error creating agent deletion lifecycle event:', error);
    // Log additional context for debugging
    console.error('Event data that failed:', {
      agent_id: agentId,
      user_id: userId,
      agent_name: agentName
    });
    // Don't throw error here as it's not critical for the deletion process
  }
};

/**
 * Create a lifecycle event for agent restoration
 */
// eslint-disable-next-line no-unused-vars
const createAgentRestorationEvent = async (agentId, userId, agentName) => {
  try {
    const { db } = await import('../../utils/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Follow exact AgentLifecycleService format for consistency
    const eventData = {
      agent_id: agentId,
      event_type: 'agent_restored',
      title: 'Agent Restored',
      description: `Agent "${agentName}" has been restored from archives and is now available for use`,
      user_id: userId,
      timestamp: serverTimestamp(),
      metadata: {
        agent_name: agentName,
        restored_by: userId,
        restoration_reason: 'user_initiated',
        new_lifecycle_state: 'active',
        restoration_method: 'frontend_service'
      },
      priority: 'medium'
    };
    
    const eventsRef = collection(db, 'agent_lifecycle_events');
    const docRef = await addDoc(eventsRef, eventData);
    
    // Update document with its own ID (matching backend pattern)
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'agent_lifecycle_events', docRef.id), {
      event_id: docRef.id
    });
    
    console.log('Agent restoration lifecycle event created:', agentId, 'Event ID:', docRef.id);
    
  } catch (error) {
    console.error('Error creating agent restoration lifecycle event:', error);
    console.error('Event data that failed:', {
      agent_id: agentId,
      user_id: userId,
      agent_name: agentName
    });
    // Don't throw error here as it's not critical for the restoration process
  }
};

/**
 * Restore an agent from archived status - DIRECT FIRESTORE
 */
export const restoreAgent = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to restore agent
    const response = await agentBuilderApi.post(`/api/agents/${agentId}/restore`);

    console.log(`Agent ${agentId} restored successfully via backend API`);
    return response.data;
  } catch (error) {
    console.error(`Error restoring agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Delete an agent with conditional logic based on development stage
 * - Draft/Development agents: Permanently deleted (hard delete)
 * - Testing/Deployed/Published agents: Archived (soft delete, can be restored)
 */
export const deleteAgent = async (agentId) => {
  console.log('[deleteAgent] Starting delete for agent:', agentId);

  try {
    const currentUser = getCurrentUser();
    console.log('[deleteAgent] Current user:', currentUser?.uid);

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    console.log('[deleteAgent] Calling DELETE /api/agents/' + agentId);
    console.log('[deleteAgent] Using agentBuilderApi with baseURL:', agentBuilderApi.defaults.baseURL);

    // Use backend API with conditional delete logic
    const response = await agentBuilderApi.delete(`/api/agents/${agentId}`);

    console.log('[deleteAgent] Success! Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[deleteAgent] Error deleting agent:', agentId);
    console.error('[deleteAgent] Error details:', error);
    console.error('[deleteAgent] Error response:', error.response?.data);
    console.error('[deleteAgent] Error status:', error.response?.status);

    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Execute an action on an agent
 */
export const executeAgentAction = async (agentId, action, payload = {}) => {
  try {
    // Determine which endpoint to use based on agent type
    const endpoint = `${ENDPOINTS.AGENTS}/${agentId}/action`;
    const response = await api.post(endpoint, {
      agent_id: agentId,
      action,
      payload
    });
    return response.data;
  } catch (error) {
    console.error(`Error executing action on agent ${agentId}:`, error);
    throw error;
  }
};

/**
 * Execute an action on a user agent
 */
export const executeUserAgentAction = async (agentId, action, payload = {}) => {
  try {
    const response = await api.post(`/api/user-agents/${agentId}/action`, {
      agent_id: agentId,
      action,
      payload
    });
    return response.data;
  } catch (error) {
    console.error(`Error executing action on user agent ${agentId}:`, error);
    throw error;
  }
};

// ============================================================================
// ORGANIZATION-SPECIFIC AGENT FUNCTIONS
// ============================================================================

/**
 * Get organization-wide agent analytics
 */
export const getOrganizationAgentAnalytics = async () => {
  try {
    // v4.0.0: Using owner-based access instead of organization
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }
    
    // Check if user can view organization analytics
    const canViewAnalytics = await checkUserPermission('view_analytics');
    if (!canViewAnalytics) {
      throw new Error('You do not have permission to view organization analytics');
    }
    
    const { db } = await import('../../utils/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    // Get all organization agents
    const agentsRef = collection(db, Collections.AGENTS);
    const agentsQuery = query(
      agentsRef,
      where(DocumentFields.OWNER_ID, '==', userId)
    );
    
    const snapshot = await getDocs(agentsQuery);
    const agents = snapshot.docs.map(doc => doc.data());
    
    // Calculate analytics
    const analytics = {
      total_agents: agents.length,
      agents_by_status: {},
      agents_by_type: {},
      agents_by_owner: {},
      total_conversations: 0,
      avg_success_rate: 0
    };
    
    agents.forEach(agent => {
      // Count by development stage
      const stage = agent[DocumentFields.Agent.LIFECYCLE_STATUS]?.[DocumentFields.Agent.DEVELOPMENT_STAGE] || 'draft';
      analytics.agents_by_status[stage] = (analytics.agents_by_status[stage] || 0) + 1;
      
      // Count by type
      const type = agent[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.AGENT_TYPE] || 'general';
      analytics.agents_by_type[type] = (analytics.agents_by_type[type] || 0) + 1;
      
      // Count by owner
      const owner = agent[DocumentFields.Agent.OWNER_ID] || 'unknown';
      analytics.agents_by_owner[owner] = (analytics.agents_by_owner[owner] || 0) + 1;
      
      // Aggregate performance metrics
      const performance = agent[DocumentFields.Agent.PERFORMANCE_SUMMARY];
      if (performance) {
        analytics.total_conversations += performance.total_conversations || 0;
        analytics.avg_success_rate += performance.success_rate || 0;
      }
    });
    
    if (agents.length > 0) {
      analytics.avg_success_rate /= agents.length;
    }
    
    return analytics;
  } catch (error) {
    console.error('Error getting organization agent analytics:', error);
    throw error;
  }
};

/**
 * Get agents by team member
 */
export const getAgentsByTeamMember = async (userId) => {
  try {
    // v4.0.0: Using owner-based access instead of organization
    const currentUser = getCurrentUser();

    if (!currentUser) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    // Check if user can view team agents
    const canViewTeamAgents = await checkUserPermission('view_agents');
    if (!canViewTeamAgents) {
      throw new Error('You do not have permission to view team member agents');
    }

    // Get agents via data access layer
    const agents = await dataAccess.getAgentsByTeamMember(userId);

    // Process and add computed fields
    return agents.map(agentData => ({
      [DocumentFields.ID]: agentData.id || agentData.agent_id,
      [DocumentFields.AGENT_ID]: agentData.id || agentData.agent_id,
      ...agentData,
      // Add computed fields for UI compatibility
      name: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.NAME] || agentData.basic_info?.name || agentData.name,
      description: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.DESCRIPTION] || agentData.basic_info?.description || agentData.description,
      type: agentData[DocumentFields.Agent.BASIC_INFO]?.[DocumentFields.Agent.AGENT_TYPE] || agentData.basic_info?.agent_type || agentData.type
    }));
  } catch (error) {
    console.error('Error getting agents by team member:', error);
    throw error;
  }
};

/**
 * Share agent with team members
 */
export const shareAgentWithTeam = async (agentId, permissions = ['view']) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error(ErrorMessages.USER_NOT_AUTHENTICATED);
    }

    // Update agent with team sharing configuration via backend API
    const updateData = {
      team_sharing: {
        enabled: true,
        permissions: permissions,
        shared_at: new Date().toISOString(),
        shared_by: currentUser.uid
      }
    };

    const response = await agentBuilderApi.put(`/api/agents/${agentId}`, updateData);

    console.log(`Agent ${agentId} shared with team successfully via backend API`);
    return { success: true, message: 'Agent shared with team successfully', data: response.data };
  } catch (error) {
    console.error('Error sharing agent with team:', error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Create agent sharing event
 */
// eslint-disable-next-line no-unused-vars
const createAgentSharingEvent = async (agentId, userId, permissions) => {
  try {
    const { db } = await import('../../utils/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    const eventData = {
      // organization_id removed in v4.0.0 owner-based schema
      event_info: {
        event_type: 'agent_shared',
        event_category: 'agent',
        severity: 'info',
        source_service: 'agent-studio'
      },
      event_data: {
        resource_type: 'agent',
        resource_id: agentId,
        actor_id: userId,
        actor_type: 'user',
        event_payload: {
          sharing_permissions: permissions,
          sharing_method: 'team_sharing'
        }
      },
      event_timestamp: serverTimestamp(),
      [DocumentFields.CREATED_AT]: serverTimestamp(),
      [DocumentFields.UPDATED_AT]: serverTimestamp(),
      [DocumentFields.CREATED_BY]: userId,
      [DocumentFields.VERSION]: 1
    };
    
    const eventsRef = collection(db, Collections.EVENTS);
    await addDoc(eventsRef, eventData);
    
    console.log('Agent sharing event logged:', agentId);
  } catch (error) {
    console.error('Error creating agent sharing event:', error);
    // Don't throw error as it's not critical
  }
};

/**
 * Get available agent types (updated for v3 schema)
 */
export const getAgentTypes = () => {
  return Promise.resolve([
    { id: StatusValues.AgentType.CUSTOMER_SERVICE, name: 'Customer Service', description: 'Designed for customer support interactions' },
    { id: StatusValues.AgentType.SALES, name: 'Sales Assistant', description: 'Specialized in sales and lead generation' },
    { id: StatusValues.AgentType.SUPPORT, name: 'Technical Support', description: 'Focused on technical assistance and troubleshooting' },
    { id: StatusValues.AgentType.TECHNICAL, name: 'Technical Assistant', description: 'Specialized in programming and technical tasks' },
    { id: StatusValues.AgentType.CONTENT, name: 'Content Creator', description: 'Specialized in content creation and editing' },
    { id: StatusValues.AgentType.GENERAL, name: 'General Assistant', description: 'A versatile AI assistant for general tasks' },
    { id: StatusValues.AgentType.SPECIALIZED, name: 'Specialized Agent', description: 'Custom specialized agent for specific use cases' }
  ]);
};

/**
 * Get agent prompt
 */
export const getAgentPrompt = async (agentId) => {
  try {
    const response = await api.get(`${ENDPOINTS.AGENT_PROMPTS}/${agentId}`);
    console.log('API response for agent prompt:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error getting prompt for agent ${agentId}:`, error);
    throw error;
  }
};

/**
 * Update agent prompt
 */
export const updateAgentPrompt = async (agentId, promptData) => {
  try {
    const response = await api.put(`${ENDPOINTS.AGENT_PROMPTS}/${agentId}`, promptData);
    console.log('API response for updating agent prompt:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating prompt for agent ${agentId}:`, error);
    throw error;
  }
};

// ============================================================================
// AGENT LIFECYCLE MANAGEMENT (PAUSE/RESUME FUNCTIONALITY)
// ============================================================================

/**
 * Pause an agent (soft pause - preserves data but stops processing)
 */
export const pauseAgent = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get agent data to check current status
    const agent = await getAgent(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.development_stage === 'paused') {
      throw new Error('Agent is already paused');
    }

    // Prepare pause data
    const pauseData = {
      development_stage: 'paused',
      paused_at: new Date().toISOString(),
      paused_by: currentUser.uid,
      previous_development_stage: agent.development_stage || 'draft'
    };

    // Use backend API to update agent
    const response = await agentBuilderApi.put(`/api/agents/${agentId}`, pauseData);

    console.log(`Agent ${agentId} paused successfully via backend API`);
    return response.data;
  } catch (error) {
    console.error(`Error pausing agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Resume an agent from paused status
 */
export const resumeAgent = async (agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get agent data to check current status
    const agent = await getAgent(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.development_stage !== 'paused') {
      throw new Error('Agent is not currently paused');
    }

    // Prepare resume data
    const resumeData = {
      development_stage: agent.previous_development_stage || 'draft',
      paused_at: null,
      paused_by: null,
      previous_development_stage: null,
      resumed_at: new Date().toISOString(),
      resumed_by: currentUser.uid
    };

    // Use backend API to update agent
    const response = await agentBuilderApi.put(`/api/agents/${agentId}`, resumeData);

    console.log(`Agent ${agentId} resumed successfully via backend API`);
    return response.data;
  } catch (error) {
    console.error(`Error resuming agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Create a lifecycle event for agent pause
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {string} agentName - Agent name
 */
// eslint-disable-next-line no-unused-vars
const createAgentPauseEvent = async (agentId, userId, agentName) => {
  try {
    const { db } = await import('../../utils/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    const eventData = {
      agent_id: agentId,
      event_type: 'agent_paused',
      title: 'Agent Paused',
      description: `Agent "${agentName}" has been paused and will not process new requests`,
      user_id: userId,
      timestamp: serverTimestamp(),
      metadata: {
        agent_name: agentName,
        paused_by: userId,
        pause_reason: 'user_initiated',
        pause_method: 'frontend_service'
      },
      priority: 'medium'
    };
    
    const eventsRef = collection(db, 'agent_lifecycle_events');
    const docRef = await addDoc(eventsRef, eventData);
    
    // Update document with its own ID
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'agent_lifecycle_events', docRef.id), {
      event_id: docRef.id
    });
    
    console.log('Agent pause lifecycle event created:', agentId, 'Event ID:', docRef.id);
    
  } catch (error) {
    console.error('Error creating agent pause lifecycle event:', error);
    console.error('Event data that failed:', {
      agent_id: agentId,
      user_id: userId,
      agent_name: agentName
    });
  }
};

/**
 * Create a lifecycle event for agent resume
 * @param {string} agentId - Agent ID
 * @param {string} userId - User ID
 * @param {string} agentName - Agent name
 * @param {string} newStatus - New status
 */
// eslint-disable-next-line no-unused-vars
const createAgentResumeEvent = async (agentId, userId, agentName, newStatus) => {
  try {
    const { db } = await import('../../utils/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    const eventData = {
      agent_id: agentId,
      event_type: 'agent_resumed',
      title: 'Agent Resumed',
      description: `Agent "${agentName}" has been resumed and is now active with status: ${newStatus}`,
      user_id: userId,
      timestamp: serverTimestamp(),
      metadata: {
        agent_name: agentName,
        resumed_by: userId,
        resume_reason: 'user_initiated',
        new_status: newStatus,
        resume_method: 'frontend_service'
      },
      priority: 'medium'
    };
    
    const eventsRef = collection(db, 'agent_lifecycle_events');
    const docRef = await addDoc(eventsRef, eventData);
    
    // Update document with its own ID
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'agent_lifecycle_events', docRef.id), {
      event_id: docRef.id
    });
    
    console.log('Agent resume lifecycle event created:', agentId, 'Event ID:', docRef.id);
    
  } catch (error) {
    console.error('Error creating agent resume lifecycle event:', error);
    console.error('Event data that failed:', {
      agent_id: agentId,
      user_id: userId,
      agent_name: agentName,
      new_status: newStatus
    });
  }
};

// ============================================================================
// PUBLIC TOOLS MANAGEMENT
// ============================================================================

/**
 * Enable a public tool for an agent
 * Adds the tool ID to the agent's tools_enabled array
 */
export const enablePublicTool = async (agentId, toolId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to enable tool
    const response = await agentBuilderApi.post(
      `/api/agents/${agentId}/tools/enable`,
      { tool_id: toolId }
    );

    console.log(`Successfully enabled public tool ${toolId} for agent ${agentId} via backend API`);
    return response.data;
  } catch (error) {
    console.error(`Error enabling public tool ${toolId} for agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Disable a public tool for an agent
 * Removes the tool ID from the agent's tools_enabled array
 */
export const disablePublicTool = async (agentId, toolId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to disable tool
    const response = await agentBuilderApi.post(
      `/api/agents/${agentId}/tools/disable`,
      { tool_id: toolId }
    );

    console.log(`Successfully disabled public tool ${toolId} for agent ${agentId} via backend API`);
    return response.data;
  } catch (error) {
    console.error(`Error disabling public tool ${toolId} for agent ${agentId}:`, error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Get enabled public tools for an agent
 * Returns the array of tool IDs enabled for the agent
 */
export const getEnabledPublicTools = async (agentId) => {
  try {
    console.log(`Getting enabled public tools for agent ${agentId}`);

    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get agent document via data access layer
    const agentData = await dataAccess.getAgent(agentId);

    if (!agentData) {
      throw new Error('Agent not found');
    }

    const enabledTools = agentData.tools_enabled || [];

    console.log(`Agent ${agentId} has ${enabledTools.length} enabled public tools:`, enabledTools);

    return enabledTools;
  } catch (error) {
    console.error(`Error getting enabled public tools for agent ${agentId}:`, error);
    throw error;
  }
};