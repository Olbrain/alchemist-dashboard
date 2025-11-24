/**
 * WhatsApp Session Service
 *
 * Handles Firestore operations for WhatsApp sessions and messages
 * Uses existing agent_sessions schema from agent-template
 */
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Collections } from '../../constants/collections';

/**
 * Get WhatsApp sessions for an agent
 */
export const getWhatsAppSessions = async (agentId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, Collections.AGENT_SESSIONS),
      where('agent_id', '==', agentId),
      where('channel', '==', 'whatsapp'),
      orderBy('last_message_at', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      last_message_at: doc.data().last_message_at?.toDate()
    }));

    return {
      success: true,
      data: sessions
    };
  } catch (error) {
    console.error('Error getting WhatsApp sessions:', error);
    return {
      success: false,
      error: error.message || 'Failed to get WhatsApp sessions',
      data: []
    };
  }
};

/**
 * Get a single session
 */
export const getSession = async (sessionId) => {
  try {
    const sessionRef = doc(db, Collections.AGENT_SESSIONS, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    const sessionData = sessionDoc.data();
    return {
      success: true,
      data: {
        id: sessionDoc.id,
        ...sessionData,
        created_at: sessionData.created_at?.toDate(),
        last_message_at: sessionData.last_message_at?.toDate()
      }
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return {
      success: false,
      error: error.message || 'Failed to get session'
    };
  }
};

/**
 * Get messages for a session
 */
export const getSessionMessages = async (sessionId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, `${Collections.AGENT_SESSIONS}/${sessionId}/messages`),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    return {
      success: true,
      data: messages
    };
  } catch (error) {
    console.error('Error getting session messages:', error);
    return {
      success: false,
      error: error.message || 'Failed to get session messages',
      data: []
    };
  }
};

/**
 * Subscribe to real-time session updates
 */
export const subscribeToSessions = (agentId, callback, limitCount = 50) => {
  try {
    const q = query(
      collection(db, Collections.AGENT_SESSIONS),
      where('agent_id', '==', agentId),
      where('channel', '==', 'whatsapp'),
      orderBy('last_message_at', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate(),
          last_message_at: doc.data().last_message_at?.toDate()
        }));

        callback({
          success: true,
          data: sessions
        });
      },
      (error) => {
        console.error('Error in sessions subscription:', error);
        callback({
          success: false,
          error: error.message,
          data: []
        });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to sessions:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Subscribe to real-time message updates for a session
 */
export const subscribeToMessages = (sessionId, callback, limitCount = 100) => {
  try {
    const q = query(
      collection(db, `${Collections.AGENT_SESSIONS}/${sessionId}/messages`),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));

        callback({
          success: true,
          data: messages
        });
      },
      (error) => {
        console.error('Error in messages subscription:', error);
        callback({
          success: false,
          error: error.message,
          data: []
        });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Search sessions by phone number or session name
 */
export const searchSessions = async (agentId, searchTerm, limitCount = 20) => {
  try {
    // Get all WhatsApp sessions for the agent
    const q = query(
      collection(db, Collections.AGENT_SESSIONS),
      where('agent_id', '==', agentId),
      where('channel', '==', 'whatsapp'),
      orderBy('last_message_at', 'desc'),
      limit(100) // Get more to search through
    );

    const snapshot = await getDocs(q);
    const allSessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
      last_message_at: doc.data().last_message_at?.toDate()
    }));

    // Filter by search term (session_name or phone number in metadata)
    const searchLower = searchTerm.toLowerCase();
    const filteredSessions = allSessions.filter(session => {
      const sessionName = (session.session_name || '').toLowerCase();
      const metadata = session.metadata || {};
      const phoneNumber = (metadata.phone_number || '').toLowerCase();

      return sessionName.includes(searchLower) || phoneNumber.includes(searchLower);
    }).slice(0, limitCount);

    return {
      success: true,
      data: filteredSessions
    };
  } catch (error) {
    console.error('Error searching sessions:', error);
    return {
      success: false,
      error: error.message || 'Failed to search sessions',
      data: []
    };
  }
};

/**
 * Get session statistics
 */
export const getSessionStats = async (sessionId) => {
  try {
    const sessionResult = await getSession(sessionId);
    if (!sessionResult.success) {
      return sessionResult;
    }

    const session = sessionResult.data;

    return {
      success: true,
      data: {
        message_count: session.message_count || 0,
        total_tokens: session.total_tokens || 0,
        prompt_tokens: session.prompt_tokens || 0,
        completion_tokens: session.completion_tokens || 0,
        cost: session.cost || 0,
        status: session.status || 'active',
        created_at: session.created_at,
        last_message_at: session.last_message_at
      }
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to get session stats'
    };
  }
};

/**
 * Format message for display
 */
export const formatMessage = (message) => {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    tokens: {
      total: message.total_tokens || 0,
      prompt: message.prompt_tokens || 0,
      completion: message.completion_tokens || 0
    },
    cost: message.cost || 0,
    metadata: message.metadata || {}
  };
};

/**
 * Get message attachments from metadata
 */
export const getMessageAttachments = (message) => {
  const metadata = message.metadata || {};
  return {
    hasAttachment: metadata.has_attachment || false,
    attachmentType: metadata.attachment_type || null,
    attachmentUrl: metadata.attachment_url || null,
    attachmentName: metadata.attachment_name || null,
    attachmentSize: metadata.attachment_size || null
  };
};
