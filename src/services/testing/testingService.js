/**
 * Testing Service
 *
 * Service for managing agent testing sessions, including creation,
 * session management, results tracking, and history
 */
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where,
//   orderBy,
//   limit
// } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
// import { db, Collections } from '../../utils/firebase'; // REMOVED: Firebase/Firestore
import { agentBuilderApi } from '../config/apiConfig';
// import deploymentService from '../deployment/deploymentService';

/**
 * Get all deployed agents for the current organization
 * @param {string} organizationId - Organization ID
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of deployed agents
 */
export const getDeployedAgents = async (organizationId, ownerId) => {
  try {
    // REMOVED: Firestore query for agents
    // const agentsQuery = query(
    //   collection(db, Collections.AGENTS),
    //   where('owner_id', '==', ownerId),
    //   where('organization_id', '==', organizationId),
    //   orderBy('created_at', 'desc')
    // );
    // const agentsSnapshot = await getDocs(agentsQuery);
    // TODO: Replace with backend API call: GET /api/agents?organization_id={}&owner_id={}

    console.warn('getDeployedAgents: Firestore disabled, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting deployed agents:', error);
    throw error;
  }
};

/**
 * Get testing sessions for a specific agent from agent_sessions collection
 * @param {string} agentId - Agent ID
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of test sessions
 */
export const getTestingSessions = async (agentId, organizationId, options = {}) => {
  try {
    // REMOVED: Firestore query for testing sessions
    // const { limitCount = 50 } = options;
    // let q = query(
    //   collection(db, 'agent_sessions'),
    //   where('agent_id', '==', agentId),
    //   where('organization_id', '==', organizationId),
    //   where('mode', '==', 'testing'),
    //   orderBy('last_message_at', 'desc'),
    //   limit(limitCount)
    // );
    // const sessionsSnapshot = await getDocs(q);
    // TODO: Replace with backend API call: GET /api/testing/sessions?agent_id={}&organization_id={}

    console.warn('getTestingSessions: Firestore disabled, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting testing sessions:', error);
    throw error;
  }
};

/**
 * Create a new test session via backend API
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Created session data
 */
export const createTestSession = async (sessionData) => {
  try {
    const {
      agent_id,
      session_id, // reference to agent_sessions
      organization_id,
      owner_id,
      title = 'Untitled Test Session',
      description = '',
      metadata = {}
    } = sessionData;

    // Use backend API to create test session
    const response = await agentBuilderApi.post('/api/testing/sessions', {
      agent_id,
      session_id,
      organization_id,
      owner_id,
      title,
      description,
      metadata
    });

    console.log('Test session created via backend API:', response.data.test_session_id);

    return response.data.session_data;
  } catch (error) {
    console.error('Error creating test session:', error);
    throw error;
  }
};

/**
 * Update test session statistics via backend API
 * @param {string} testSessionId - Test session ID
 * @param {Object} stats - Session statistics
 * @returns {Promise<void>}
 */
export const updateTestSessionStats = async (testSessionId, stats) => {
  try {
    // Use backend API to update test session stats
    await agentBuilderApi.patch('/api/testing/sessions/stats', {
      test_session_id: testSessionId,
      stats
    });

    console.log('Test session stats updated via backend API:', testSessionId);
  } catch (error) {
    console.error('Error updating test session stats:', error);
    throw error;
  }
};

/**
 * Save test session results via backend API (mark as completed with analysis)
 * @param {string} testSessionId - Test session ID
 * @param {Object} results - Test results
 * @returns {Promise<void>}
 */
export const saveTestSessionResults = async (testSessionId, results) => {
  try {
    const {
      passed = null,
      notes = '',
      issues = [],
      rating = null
    } = results;

    // Use backend API to save test session results
    await agentBuilderApi.post('/api/testing/sessions/results', {
      test_session_id: testSessionId,
      results: {
        passed,
        notes,
        issues,
        rating
      }
    });

    console.log('Test session results saved via backend API:', testSessionId);
  } catch (error) {
    console.error('Error saving test session results:', error);
    throw error;
  }
};

/**
 * Get a specific test session
 * @param {string} testSessionId - Test session ID
 * @returns {Promise<Object>} Test session data
 */
export const getTestSession = async (testSessionId) => {
  try {
    // REMOVED: Firestore read for test session
    // const testSessionRef = doc(db, 'test_sessions', testSessionId);
    // const testSessionDoc = await getDoc(testSessionRef);
    // TODO: Replace with backend API call: GET /api/testing/sessions/{testSessionId}

    console.warn('getTestSession: Firestore disabled, returning null');
    throw new Error('Test session not found');
  } catch (error) {
    console.error('Error getting test session:', error);
    throw error;
  }
};

/**
 * Delete a test session via backend API
 * @param {string} testSessionId - Test session ID
 * @returns {Promise<void>}
 */
export const deleteTestSession = async (testSessionId) => {
  try {
    console.log('🗑️ [deleteTestSession] Attempting to delete session via backend API:', testSessionId);

    // Use backend API to delete test session
    await agentBuilderApi.delete('/api/testing/sessions', {
      data: { test_session_id: testSessionId }
    });

    console.log('🗑️ [deleteTestSession] Session deleted successfully via backend API:', testSessionId);
  } catch (error) {
    console.error('🗑️ [deleteTestSession] Error deleting test session:', error);
    throw error;
  }
};

/**
 * Archive a test session via backend API
 * @param {string} testSessionId - Test session ID
 * @returns {Promise<void>}
 */
export const archiveTestSession = async (testSessionId) => {
  try {
    // Use backend API to archive test session
    await agentBuilderApi.patch('/api/testing/sessions/archive', {
      test_session_id: testSessionId
    });

    console.log('Test session archived via backend API:', testSessionId);
  } catch (error) {
    console.error('Error archiving test session:', error);
    throw error;
  }
};

/**
 * Update test session title and description via backend API
 * @param {string} testSessionId - Test session ID
 * @param {string} title - Session title
 * @param {string} description - Session description
 * @returns {Promise<void>}
 */
export const updateTestSessionInfo = async (testSessionId, title, description) => {
  try {
    // Use backend API to update test session info
    await agentBuilderApi.patch('/api/testing/sessions/info', {
      test_session_id: testSessionId,
      title,
      description
    });

    console.log('Test session info updated via backend API:', testSessionId);
  } catch (error) {
    console.error('Error updating test session info:', error);
    throw error;
  }
};

/**
 * Get test session history for an agent
 * @param {string} agentId - Agent ID
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of completed test sessions
 */
export const getTestSessionHistory = async (agentId, ownerId) => {
  try {
    // REMOVED: Firestore query for test session history
    // const q = query(
    //   collection(db, 'test_sessions'),
    //   where('agent_id', '==', agentId),
    //   where('owner_id', '==', ownerId),
    //   where('status', '==', 'completed'),
    //   orderBy('completed_at', 'desc'),
    //   limit(100)
    // );
    // const sessionsSnapshot = await getDocs(q);
    // TODO: Replace with backend API call: GET /api/testing/sessions/history?agent_id={}&owner_id={}

    console.warn('getTestSessionHistory: Firestore disabled, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting test session history:', error);
    throw error;
  }
};

/**
 * Export test session data
 * @param {string} testSessionId - Test session ID
 * @returns {Promise<Object>} Exportable session data
 */
export const exportTestSession = async (testSessionId) => {
  try {
    // REMOVED: Firestore reads for test session export
    // const testSession = await getTestSession(testSessionId);
    // const sessionRef = doc(db, 'agent_sessions', testSession.session_id);
    // const sessionDoc = await getDoc(sessionRef);
    // TODO: Replace with backend API call: GET /api/testing/sessions/{testSessionId}/export

    console.warn('exportTestSession: Firestore disabled, returning empty export');
    return {
      test_session: null,
      agent_session: null,
      exported_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting test session:', error);
    throw error;
  }
};

const testingService = {
  getDeployedAgents,
  getTestingSessions,
  createTestSession,
  updateTestSessionStats,
  saveTestSessionResults,
  getTestSession,
  deleteTestSession,
  archiveTestSession,
  updateTestSessionInfo,
  getTestSessionHistory,
  exportTestSession
};

export default testingService;
