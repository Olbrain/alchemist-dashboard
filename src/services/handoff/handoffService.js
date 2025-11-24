/**
 * Human Handoff Service
 *
 * Manages human takeover of agent conversations, allowing human operators
 * to respond in place of AI agents through WhatsApp channel.
 */

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { agentBuilderApi } from '../config/apiConfig';
import { getCurrentUser } from '../context';
import { logActivity } from '../activity/activityService';
import { AGENT_ACTIVITIES, RESOURCE_TYPES } from '../../constants/activityTypes';

/**
 * Toggle handoff state for a session
 * When enabled, prevents AI from processing messages and allows human responses
 */
export const toggleHandoff = async (sessionId, enabled) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to toggle handoff');
    }

    // Toggle handoff via backend API
    await agentBuilderApi.patch(`/api/handoff/${sessionId}/toggle?enabled=${enabled}&reason=${enabled ? 'handoff_started' : 'handoff_ended'}`);

    // Log the handoff state change
    await logActivity({
      activity_type: enabled ? AGENT_ACTIVITIES.HANDOFF_STARTED : AGENT_ACTIVITIES.HANDOFF_ENDED,
      resource_type: RESOURCE_TYPES.CONVERSATION,
      resource_id: sessionId,
      activity_details: {
        session_id: sessionId,
        operator: currentUser.email,
        action: enabled ? 'handoff_started' : 'handoff_ended'
      }
    });

    console.log(`✅ Handoff ${enabled ? 'enabled' : 'disabled'} for session ${sessionId} via backend API`);
    return enabled;
  } catch (error) {
    console.error('Error toggling handoff:', error);
    throw error;
  }
};

/**
 * Get handoff state for a session
 */
export const getHandoffState = async (sessionId) => {
  try {
    // REMOVED: Firestore read for handoff state
    // const sessionRef = doc(db, `agent_sessions/${sessionId}`);
    // const sessionDoc = await getDoc(sessionRef);
    // TODO: Replace with backend API call: GET /api/handoff/{sessionId}/state

    console.warn('getHandoffState: Firestore disabled, returning default');
    return { enabled: false };
  } catch (error) {
    console.error('Error getting handoff state:', error);
    return { enabled: false };
  }
};

/**
 * Send human response through WhatsApp channel
 * Uses the deployed agent's endpoint to send via Twilio WhatsApp
 *
 * Flow: Store in Firestore FIRST, then send via API
 * This ensures message is persisted even if sending fails
 */
export const sendHumanResponse = async (sessionId, agentId, message) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to send human responses');
    }

    // REMOVED: Firestore reads for session details and agent server
    // const sessionRef = doc(db, `agent_sessions/${sessionId}`);
    // const sessionDoc = await getDoc(sessionRef);
    // const agentServerRef = doc(db, 'agent_servers', agentId);
    // const agentServerDoc = await getDoc(agentServerRef);
    // TODO: Replace with backend API calls or use existing backend API

    console.warn('sendHumanResponse: Firestore disabled, skipping validation checks');

    // Skip Firestore validation, proceed directly with backend API
    // Backend will validate session, handoff state, and agent status
    const userPhone = null; // Will be retrieved by backend
    const agentEndpoint = null; // Will be retrieved by backend

    // STEP 1: Store human message via backend API FIRST (before sending)
    // This ensures message is persisted even if WhatsApp API call fails
    await agentBuilderApi.post(`/api/handoff/${sessionId}/message`, {
      message: message,
      human_name: currentUser.email,
      metadata: {
        operator_id: currentUser.uid,
        operator_email: currentUser.email,
        agent_id: agentId,
        sent_via: 'whatsapp'
      }
    });

    console.log(`✅ Human message stored via backend API for session ${sessionId}`);

    // STEP 2: Send message through agent's WhatsApp endpoint
    // No Authorization header needed - backend validates WhatsApp API key internally
    const response = await fetch(`${agentEndpoint}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        to: userPhone,
        message: message,
        is_human_response: true,
        operator_id: currentUser.uid,
        skip_ai_processing: true
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.detail || `Failed to send message: ${response.status}`);
    }

    // STEP 3: Log human response activity
    await logActivity({
      activity_type: AGENT_ACTIVITIES.HUMAN_MESSAGE_SENT,
      resource_type: RESOURCE_TYPES.CONVERSATION,
      resource_id: sessionId,
      activity_details: {
        session_id: sessionId,
        agent_id: agentId,
        operator: currentUser.email,
        message_length: message.length,
        sent_to: userPhone.substring(0, 6) + '***' // Mask phone for privacy
      }
    });

    console.log(`✅ Human response sent via WhatsApp for session ${sessionId}`);
    return result;
  } catch (error) {
    console.error('Error sending human response:', error);
    throw error;
  }
};

/**
 * Get all active handoff sessions for current organization
 */
export const getActiveHandoffSessions = async (organizationId) => {
  try {
    // REMOVED: Firestore query for active handoff sessions
    // const sessionsRef = collection(db, 'agent_sessions');
    // const q = query(
    //   sessionsRef,
    //   where('organization_id', '==', organizationId),
    //   where('handoff.enabled', '==', true)
    // );
    // const querySnapshot = await getDocs(q);
    // TODO: Replace with backend API call: GET /api/handoff/sessions?organization_id={}&active=true

    console.warn('getActiveHandoffSessions: Firestore disabled, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting active handoff sessions:', error);
    return [];
  }
};

/**
 * Check if a session has handoff enabled
 */
export const isHandoffEnabled = async (sessionId) => {
  const state = await getHandoffState(sessionId);
  return state?.enabled || false;
};

/**
 * Auto-disable handoff after timeout (30 minutes of inactivity)
 */
export const checkHandoffTimeouts = async () => {
  try {
    // REMOVED: Firestore query for handoff timeout checking
    // const sessionsRef = collection(db, 'agent_sessions');
    // const q = query(sessionsRef, where('handoff.enabled', '==', true));
    // const querySnapshot = await getDocs(q);
    // TODO: Replace with backend API call: POST /api/handoff/check-timeouts
    // Backend should handle timeout checking as a scheduled task

    console.warn('checkHandoffTimeouts: Firestore disabled, skipping timeout check');
    // Backend should handle this via scheduled task
  } catch (error) {
    console.error('Error checking handoff timeouts:', error);
  }
};

/**
 * Get handoff statistics for an agent
 */
export const getHandoffStats = async (agentId, timeframe = 7) => {
  try {
    // REMOVED: Firestore query for handoff statistics
    // const sessionsRef = collection(db, 'agent_sessions');
    // const q = query(
    //   sessionsRef,
    //   where('agent_id', '==', agentId),
    //   where('handoff.started_at', '>=', startDate)
    // );
    // const querySnapshot = await getDocs(q);
    // TODO: Replace with backend API call: GET /api/handoff/stats?agent_id={}&timeframe={}

    console.warn('getHandoffStats: Firestore disabled, returning zero stats');
    return {
      totalHandoffs: 0,
      activeHandoffs: 0,
      averageDuration: 0,
      timeframe
    };
  } catch (error) {
    console.error('Error getting handoff stats:', error);
    return {
      totalHandoffs: 0,
      activeHandoffs: 0,
      averageDuration: 0,
      timeframe
    };
  }
};

// Export all functions
export default {
  toggleHandoff,
  getHandoffState,
  sendHumanResponse,
  getActiveHandoffSessions,
  isHandoffEnabled,
  checkHandoffTimeouts,
  getHandoffStats
};