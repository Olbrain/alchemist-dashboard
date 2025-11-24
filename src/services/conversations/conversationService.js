/**
 * Conversation Service
 *
 * Handles conversation-related API operations including billing tracking for deployed agents
 * Uses DataAccess layer for backend API calls (no direct Firestore access)
 *
 * NOTE: Many unused functions have been removed for embed mode.
 * Only actively used functions are included.
 */
import { getDataAccess } from '../data/DataAccessFactory';

/**
 * Test agent endpoint health/availability
 * Used by AgentContext for deployment status checking
 */
export const testAgentEndpoint = async (agentId) => {
  try {
    // Get agent service URL from Firestore via backend
    const dataAccess = getDataAccess();
    const agent = await dataAccess.getAgent(agentId);

    if (!agent) {
      console.error(`Agent ${agentId} not found`);
      return {
        success: false,
        error: 'Agent not found'
      };
    }

    // Try to get server status from backend
    const serverStatus = await dataAccess.getAgentServerStatus(agentId);

    if (!serverStatus || !serverStatus.service_url) {
      return {
        success: false,
        error: 'Agent not deployed - no service URL'
      };
    }

    // Test the agent endpoint
    const testUrl = `${serverStatus.service_url}/health`;

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        return {
          success: true,
          url: serverStatus.service_url,
          status: 'healthy'
        };
      } else {
        return {
          success: false,
          error: `Health check failed: ${response.status}`,
          url: serverStatus.service_url
        };
      }
    } catch (fetchError) {
      console.error('Error testing agent endpoint:', fetchError);
      return {
        success: false,
        error: `Cannot reach agent: ${fetchError.message}`,
        url: serverStatus.service_url
      };
    }
  } catch (error) {
    console.error('Error in testAgentEndpoint:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get sessions for an agent (paginated)
 * Used by AgentConversationsContent and RecentConversations
 */
export const getSessionsForAgent = async (agentId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;
    const dataAccess = getDataAccess();

    const sessions = await dataAccess.getAgentSessions(agentId, limit, offset);

    return sessions.map(session => ({
      session_id: session.id || session.session_id,
      created_at: session.created_at,
      last_message_at: session.last_message_at,
      message_count: session.message_count || 0,
      total_tokens: session.total_tokens || 0,
      cost: session.cost || 0,
      status: session.status || 'completed',
      organization_id: session.organization_id,
      profile_name: session.profile_name || null,
      mode: session.mode || 'production',
      channel: session.channel || 'api'
    }));
  } catch (error) {
    console.error('Error getting sessions for agent:', error);
    return [];
  }
};

/**
 * Subscribe to agent sessions via polling (replaces Firestore real-time listener)
 * Returns unsubscribe function
 * Used by AgentConversationsContent
 */
export const subscribeToAgentSessions = (agentId, callback, options = {}) => {
  try {
    const { limitCount = 10 } = options;
    const dataAccess = getDataAccess();

    console.log(`🔔 Setting up polling listener for agent sessions: ${agentId}`);

    // Polling function
    const fetchSessions = async () => {
      try {
        const data = await dataAccess.getAgentSessions(agentId, limitCount, 0);

        console.log(`🔔 Polling update: ${data?.length || 0} sessions`);

        // Transform API response to session format
        const sessions = (data || []).map(session => ({
          session_id: session.id || session.session_id,
          start_time: session.created_at || session.start_time,
          end_time: session.end_time,
          last_message_time: session.last_message_at,
          last_message_at: session.last_message_at,
          created_at: session.created_at,
          duration_seconds: session.duration_seconds || 0,
          message_count: session.message_count || 0,
          actual_message_count: session.message_count || 0,
          total_tokens: session.total_tokens || 0,
          estimated_cost: session.cost || 0,
          has_messages: (session.message_count || 0) > 0,
          message_preview: null,
          status: session.status || 'completed',
          organization_id: session.organization_id,
          profile_name: session.profile_name || null,
          mode: session.mode || 'production',
          channel: session.channel || 'api'
        }));

        // Call the callback with updated sessions
        callback(sessions);
      } catch (error) {
        console.error(`❌ Error fetching sessions:`, error);
        callback([]);
      }
    };

    // Initial fetch
    fetchSessions();

    // Set up polling every 5 seconds
    const pollInterval = setInterval(fetchSessions, 5000);

    // Return unsubscribe function that clears the interval
    return () => {
      console.log(`🔔 Clearing sessions polling for agent: ${agentId}`);
      clearInterval(pollInterval);
    };

  } catch (error) {
    console.error(`Error setting up sessions subscription for agent ${agentId}:`, error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Get messages for a specific session
 * Returns individual messages for the conversation view
 * Used by AgentConversationsContent
 */
export const getMessagesForSession = async (sessionId, agentId) => {
  try {
    console.log(`🔥 Getting messages for session: ${sessionId}`);

    const dataAccess = getDataAccess();

    // Get messages from backend
    const messages = await dataAccess.getSessionMessages(sessionId, 500, 0);

    if (!messages || messages.length === 0) {
      console.warn(`No messages found for session ${sessionId}`);
      return [];
    }

    // Transform to expected format
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp || msg.created_at,
      created_at: msg.created_at,
      tokens: msg.tokens || 0,
      cost: msg.cost || 0,
      metadata: msg.metadata || {}
    }));
  } catch (error) {
    console.error('Error getting messages for session:', error);
    return [];
  }
};

// ============================================================================
// STUB FUNCTIONS FOR ALCHEMIST CONVERSATION PANEL
// These are imported by AgentConversationPanel but not actively used in embed mode
// ============================================================================

export const subscribeToAgentConversations = (userId, onMessagesUpdate, onError) => {
  console.warn('subscribeToAgentConversations: Not implemented in embed mode');
  return () => {}; // Return empty unsubscribe
};

export const subscribeToConversationStatistics = (userId, onUpdate, onError) => {
  console.warn('subscribeToConversationStatistics: Not implemented in embed mode');
  return () => {}; // Return empty unsubscribe
};

export const sendMessageToAPI = async (userId, message, attachments = null, projectId = null) => {
  console.warn('sendMessageToAPI: Not implemented in embed mode');
  return null;
};

export const storeUserMessageToFirestore = async (userId, message, attachments = null, sentTimestamp = null) => {
  console.warn('storeUserMessageToFirestore: Not implemented in embed mode');
  return null;
};

export const getSessionMessagesFromFirestore = async (sessionId, organizationId, options = {}) => {
  try {
    const { getDataAccess } = require('../data/DataAccessFactory');
    const dataAccess = getDataAccess();
    const messages = await dataAccess.getTestingSessionMessages(sessionId, 100);
    return messages;
  } catch (error) {
    console.error('Error getting session messages:', error);
    return [];
  }
};

export const subscribeToSessionMessages = (sessionId, organizationId, onMessagesUpdate, onError, options = {}) => {
  try {
    const { getDataAccess } = require('../data/DataAccessFactory');
    const dataAccess = getDataAccess();

    const unsubscribe = dataAccess.subscribeToTestingSessionMessages(sessionId, (messages) => {
      if (onMessagesUpdate) {
        onMessagesUpdate(messages);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to session messages:', error);
    if (onError) {
      onError(error);
    }
    return () => {}; // Return empty unsubscribe on error
  }
};

// Additional stub functions exported by services/index.js
export const getAgentConversations = async (agentId) => {
  console.warn('getAgentConversations: Not implemented in embed mode');
  return [];
};

export const getConversationMessages = async (conversationId) => {
  console.warn('getConversationMessages: Not implemented in embed mode');
  return [];
};

export const createConversation = async (agentId, conversationData) => {
  console.warn('createConversation: Not implemented in embed mode');
  return null;
};

export const deleteConversation = async (conversationId) => {
  console.warn('deleteConversation: Not implemented in embed mode');
  return { success: false };
};

export const sendUserMessage = async (agentId, message, attachments = null) => {
  console.warn('sendUserMessage: Not implemented in embed mode (DEPRECATED)');
  return null;
};

export const initializeConversationSession = async (userId) => {
  console.warn('initializeConversationSession: Not implemented in embed mode');
  return null;
};

export const clearConversationHistory = async (userId) => {
  console.warn('clearConversationHistory: Not implemented in embed mode');
  return { success: false };
};
