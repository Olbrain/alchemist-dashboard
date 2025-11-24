/**
 * Analytics Service
 *
 * Handles analytics-related operations for agent performance and usage metrics
 * Now includes direct Firestore access alongside API operations
 */
import { db } from '../../utils/firebase';
// import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
import { analyticsApi } from '../config/apiConfig';

// FIRESTORE STUBS - These functions are stubbed because Firestore is disabled
const collection = (...args) => { console.warn('Firestore disabled: collection() called'); return null; };
const doc = (...args) => { console.warn('Firestore disabled: doc() called'); return null; };
const getDoc = async (...args) => { console.warn('Firestore disabled: getDoc() called'); return { exists: () => false, data: () => ({}) }; };
const getDocs = async (...args) => { console.warn('Firestore disabled: getDocs() called'); return { docs: [], size: 0, forEach: () => {} }; };
const query = (...args) => { console.warn('Firestore disabled: query() called'); return null; };
const where = (...args) => { console.warn('Firestore disabled: where() called'); return null; };
const orderBy = (...args) => { console.warn('Firestore disabled: orderBy() called'); return null; };
const limit = (...args) => { console.warn('Firestore disabled: limit() called'); return null; };
const onSnapshot = (...args) => { console.warn('Firestore disabled: onSnapshot() called'); const callback = args.find(a => typeof a === 'function'); if (callback) setTimeout(() => callback({ docs: [], size: 0, forEach: () => {} }), 0); return () => {}; };

//import { calculateCostFromTokens } from '../conversations/conversationService';

/**
 * Get basic agent usage from backend API (for embed mode)
 * Returns simplified usage data without Firestore dependency
 */
export const getAgentUsageFromAPI = async (agentId) => {
  try {
    const response = await analyticsApi.get(`/api/agents/${agentId}/usage`);
    return {
      total_sessions: response.data.total_sessions || 0,
      total_messages: response.data.total_messages || 0,
      total_tokens: response.data.total_tokens || 0,
      cost: response.data.cost || 0
    };
  } catch (error) {
    console.warn(`Failed to fetch usage for agent ${agentId}:`, error);
    return {
      total_sessions: 0,
      total_messages: 0,
      total_tokens: 0,
      cost: 0
    };
  }
};

/**
 * Get comprehensive analytics for an agent (uses Firestore direct access only)
 */
export const getAgentAnalytics = async (agentId) => {
  try {
    console.log(`🔥 Getting agent analytics from Firestore: ${agentId}`);
    return await getAgentAnalyticsFromFirestore(agentId);
  } catch (error) {
    console.error(`Error getting analytics for agent ${agentId}:`, error);
    // Return empty analytics data instead of throwing
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      estimatedCost: 0,
      averageTokensPerSession: 0,
      averageMessagesPerSession: 0,
      tokenBreakdown: { completion: 0, prompt: 0, total: 0 },
      dailyBreakdown: {},
      timeSeries: [],
      firstSession: null,
      lastSession: null
    };
  }
};

/**
 * Get token usage statistics for an agent (uses Firestore direct access only)
 */
export const getAgentTokenUsage = async (agentId) => {
  try {
    console.log(`🔥 Getting agent token usage from Firestore: ${agentId}`);
    const analyticsData = await getAgentAnalyticsFromFirestore(agentId);
    return {
      totalTokens: analyticsData.totalTokens,
      tokenBreakdown: analyticsData.tokenBreakdown,
      estimatedCost: analyticsData.estimatedCost
    };
  } catch (error) {
    console.error(`Error getting token usage for agent ${agentId}:`, error);
    // Return empty token usage data instead of throwing
    return {
      totalTokens: 0,
      tokenBreakdown: { completion: 0, prompt: 0, total: 0 },
      estimatedCost: 0
    };
  }
};

/**
 * Get performance metrics for an agent (uses Firestore direct access only)
 */
export const getAgentMetrics = async (agentId) => {
  try {
    console.log(`🔥 Getting agent metrics from Firestore: ${agentId}`);
    const analyticsData = await getAgentAnalyticsFromFirestore(agentId);
    return {
      totalSessions: analyticsData.totalSessions,
      totalMessages: analyticsData.totalMessages,
      averageTokensPerSession: analyticsData.averageTokensPerSession,
      averageMessagesPerSession: analyticsData.averageMessagesPerSession,
      estimatedCost: analyticsData.estimatedCost
    };
  } catch (error) {
    console.error(`Error getting metrics for agent ${agentId}:`, error);
    // Return empty metrics data instead of throwing
    return {
      totalSessions: 0,
      totalMessages: 0,
      averageTokensPerSession: 0,
      averageMessagesPerSession: 0,
      estimatedCost: 0
    };
  }
};

/**
 * Get time series data for an agent (uses Firestore direct access only)
 */
export const getAgentTimeSeries = async (agentId, days = 30) => {
  try {
    console.log(`🔥 Getting agent time series from Firestore: ${agentId}`);
    const analyticsData = await getAgentAnalyticsFromFirestore(agentId);
    return {
      timeSeries: analyticsData.timeSeries || [],
      dailyBreakdown: analyticsData.dailyBreakdown || {}
    };
  } catch (error) {
    console.error(`Error getting time series for agent ${agentId}:`, error);
    // Return empty time series data instead of throwing
    return {
      timeSeries: [],
      dailyBreakdown: {}
    };
  }
};

/**
 * Get user analytics across all agents (uses Firestore direct access only)
 */
export const getUserAnalytics = async (userId) => {
  try {
    console.log(`🔥 Getting user analytics from Firestore: ${userId}`);
    return await getUserAnalyticsFromFirestore(userId);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    // Return empty user analytics data instead of throwing
    return {
      totalAgents: 0,
      totalSessions: 0,
      totalMessages: 0,
      totalCosts: 0,
      agentBreakdown: {}
    };
  }
};

/**
 * Get dashboard data for an agent (uses Firestore direct access only)
 */
export const getAgentDashboard = async (agentId, timeframe = '30') => {
  try {
    // Use Firestore direct access only - no API fallback
    console.log(`🔥 Getting agent dashboard data from Firestore: ${agentId}`);
    const firestoreData = await getAgentDashboardFromFirestore(agentId, timeframe);
    
    // Always return Firestore data (even if empty) to avoid 405 errors
    console.log(`✅ Using Firestore data for agent ${agentId}:`, firestoreData);
    return firestoreData;
    
  } catch (error) {
    console.error(`Error getting dashboard data from Firestore for agent ${agentId}:`, error);
    
    // Return empty data structure on error
    console.log(`📦 Returning empty analytics data for agent ${agentId} due to error`);
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      averageTokensPerSession: 0,
      averageMessagesPerSession: 0,
      estimatedCost: 0,
      tokenBreakdown: {
        completion: 0,
        prompt: 0,
        total: 0
      },
      dailyBreakdown: {},
      timeSeries: [],
      firstSession: null,
      lastSession: null
    };
  }
};

/**
 * Calculate estimated cost based on token usage
 * @param {number} totalTokens - Total tokens used
 * @returns {number} Estimated cost
 */
// eslint-disable-next-line no-unused-vars
const calculateEstimatedCost = (totalTokens) => {
  if (!totalTokens) return 0;

  return totalTokens / 250;
};

/**
 * Format analytics data for charts
 */
export const formatTimeSeriesForChart = (timeSeries, metric = 'tokens') => {
  if (!timeSeries || !Array.isArray(timeSeries)) return [];
  
  return timeSeries.map(point => ({
    x: point.date,
    y: point[metric] || 0
  }));
};

/**
 * Get recent activity for an agent (uses Firestore direct access)
 */
export const getAgentRecentActivity = async (agentId) => {
  try {
    console.log(`🔥 Getting recent activity from Firestore for agent: ${agentId}`);
    
    // Get recent sessions from agent_sessions collection
    const recentSessions = await getAgentSessionsFromFirestore(agentId, 7, 10, 0);
    
    // Transform sessions into activity format
    const activities = recentSessions.sessions.map(session => ({
      id: session.session_id,
      type: 'session',
      timestamp: session.start_time,
      user_id: session.user_id || 'anonymous',
      message_count: session.message_count,
      tokens: session.total_tokens,
      cost: session.estimated_cost,
      status: session.status
    }));
    
    return { activities, total: activities.length };
  } catch (error) {
    console.error(`Error getting recent activity for agent ${agentId}:`, error);
    // Return empty activity instead of throwing
    return { activities: [], total: 0 };
  }
};

/**
 * Get performance insights for an agent (uses Firestore direct access)
 */
export const getAgentInsights = async (agentId) => {
  try {
    console.log(`🔥 Getting insights from Firestore for agent: ${agentId}`);
    
    // Get analytics data from agent_analytics collection
    const analyticsData = await getAgentAnalyticsFromFirestore(agentId);
    
    // Generate insights based on the data
    const insights = [];
    
    if (analyticsData.totalSessions > 0) {
      insights.push({
        type: 'performance',
        message: `Agent has processed ${analyticsData.totalSessions} sessions with ${analyticsData.totalMessages} messages`,
        severity: 'info'
      });
      
      if (analyticsData.averageTokensPerSession > 1000) {
        insights.push({
          type: 'optimization',
          message: 'Consider optimizing prompts to reduce token usage per session',
          severity: 'warning'
        });
      }
      
      if (analyticsData.estimatedCost > 10) {
        insights.push({
          type: 'cost',
          severity: 'info'
        });
      }
    } else {
      insights.push({
        type: 'usage',
        message: 'No sessions found for this agent yet',
        severity: 'info'
      });
    }
    
    return { insights };
  } catch (error) {
    console.error(`Error getting insights for agent ${agentId}:`, error);
    // Return empty insights instead of throwing
    return { insights: [] };
  }
};

/**
 * Get analytics health check (checks Firestore connectivity)
 */
export const getAnalyticsHealth = async () => {
  try {
    console.log('🔥 Checking Firestore analytics connectivity');
    
    // Test Firestore connectivity by trying to read from analytics collections
    const testRef = doc(db, 'agent_analytics', 'health-check');
    await getDoc(testRef); // This will succeed even if document doesn't exist
    
    return {
      status: 'healthy',
      service: 'firestore-direct-access',
      timestamp: new Date().toISOString(),
      message: 'Firestore analytics connectivity verified'
    };
  } catch (error) {
    console.error('Error checking Firestore analytics health:', error);
    return {
      status: 'unhealthy',
      service: 'firestore-direct-access',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Get sessions for an agent with detailed analytics per session (uses Firestore direct access)
 */
export const getAgentSessions = async (agentId, days = 30, pageSize = 20, offset = 0) => {
  try {
    console.log(`🔥 Getting sessions from Firestore for agent: ${agentId}`);
    
    // Use the existing Firestore function
    const sessionsData = await getAgentSessionsFromFirestore(agentId, days, pageSize, offset);
    
    return {
      sessions: sessionsData.sessions,
      total_sessions: sessionsData.total_sessions,
      has_more: sessionsData.has_more,
      page_size: pageSize,
      offset: offset
    };
  } catch (error) {
    console.error(`Error getting sessions for agent ${agentId}:`, error);
    // Return empty data instead of throwing
    return {
      sessions: [],
      total_sessions: 0,
      has_more: false,
      page_size: pageSize,
      offset: offset
    };
  }
};

/**
 */
export const getEnhancedAnalytics = async (agentId, forceRefresh = false) => {
  try {
    console.log(`🔥 Getting enhanced analytics from Firestore for agent: ${agentId}`);
    
    // Read from agent_analytics/{agent_id} collection  
    const agentAnalyticsRef = doc(db, 'agent_analytics', agentId);
    const agentAnalyticsDoc = await getDoc(agentAnalyticsRef);
    
    if (!agentAnalyticsDoc.exists()) {
      console.log(`No enhanced analytics data found for agent ${agentId}, returning null`);
      return null;
    }
    
    const analyticsData = agentAnalyticsDoc.data();
    console.log(`✅ Found enhanced analytics data:`, analyticsData);
    
    // Transform Firestore data to expected format (only use real data)
    const enhancedAnalytics = {
      data: {
        business_metrics: analyticsData.business_metrics || null,
        optimization_suggestions: analyticsData.optimization_suggestions || null,
        active_alerts: analyticsData.active_alerts || []
      },
      cacheStatus: 'FIRESTORE',
      generatedAt: analyticsData.last_updated ? new Date(analyticsData.last_updated) : new Date()
    };
    
    return enhancedAnalytics;
  } catch (error) {
    console.error(`Error getting enhanced analytics for agent ${agentId}:`, error);
    console.warn('Firestore error, returning null');
    return null;
  }
};




/**
 * FIRESTORE DIRECT ACCESS FUNCTIONS
 * These functions read analytics data directly from Firestore collections
 */

/**
 * Get agent analytics data directly from Firestore
 */
export const getAgentAnalyticsFromFirestore = async (agentId) => {
  try {
    // REMOVED: Firestore read for agent analytics
    // const agentAnalyticsRef = doc(db, 'agent_analytics', agentId);
    // const agentAnalyticsDoc = await getDoc(agentAnalyticsRef);
    // TODO: Replace with backend API call: GET /api/analytics/agents/{agentId}

    console.warn(`getAgentAnalyticsFromFirestore: Firestore disabled for agent ${agentId}, returning empty analytics`);

    // Return empty analytics data (same as when doc doesn't exist)
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      estimatedCost: 0,
      averageTokensPerSession: 0,
      averageMessagesPerSession: 0,
      tokenBreakdown: {
        completion: 0,
        prompt: 0,
        total: 0
      },
      dailyBreakdown: {},
      timeSeries: [],
      firstSession: null,
      lastSession: null
    };
  } catch (error) {
    console.error('Error getting agent analytics:', error);
    throw error;
  }
};

/**
 * Get user analytics data directly from Firestore
 */
export const getUserAnalyticsFromFirestore = async (userId) => {
  try {
    console.log(`🔥 Reading user analytics from Firestore for user: ${userId}`);
    
    // Read from user_analytics/{user_id} collection
    const userAnalyticsRef = doc(db, 'user_analytics', userId);
    const userAnalyticsDoc = await getDoc(userAnalyticsRef);
    
    if (!userAnalyticsDoc.exists()) {
      console.log(`No user analytics data found for user ${userId}`);
      return {
        totalAgents: 0,
        totalSessions: 0,
        totalMessages: 0,
        totalCosts: 0,
        agentBreakdown: {}
      };
    }
    
    const userData = userAnalyticsDoc.data();
    console.log(`✅ Found user analytics data:`, userData);
    
    return {
      totalAgents: userData.total_agents || 0,
      totalSessions: userData.total_sessions || 0,
      totalMessages: userData.total_messages || 0,
      totalCosts: userData.total_costs || 0,
      agentBreakdown: userData.agent_breakdown || {}
    };
  } catch (error) {
    console.error(`Error reading user analytics from Firestore for ${userId}:`, error);
    throw error;
  }
};

/**
 * Transform raw Firestore session data to standardized format
 */
const transformSessionData = (docId, sessionData, dateThreshold, queryStrategy) => {
  try {
    // Debug: Log sessionData structure to see channel field location
    console.log('🔍 [transformSessionData] Session:', docId);
    console.log('🔍 [transformSessionData] sessionData keys:', Object.keys(sessionData));
    console.log('🔍 [transformSessionData] sessionData.channel:', sessionData.channel);
    console.log('🔍 [transformSessionData] sessionData.session_info?.channel:', sessionData.session_info?.channel);

    // Handle different timestamp formats
    const parseTimestamp = (timestamp) => {
      if (!timestamp) return null;
      
      if (timestamp?.toDate) {
        return timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp);
      } else if (timestamp?.seconds) {
        // Handle Firestore Timestamp object with seconds/nanoseconds
        return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      } else if (timestamp?._seconds) {
        // Handle alternative Firestore Timestamp format
        return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
      } else if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // Fallback: try to parse as date
      try {
        return new Date(timestamp);
      } catch {
        return null;
      }
    };
    
    // Parse timestamps
    const startTime = parseTimestamp(sessionData.created_at || sessionData.start_time);
    const endTime = parseTimestamp(sessionData.last_message_at || sessionData.end_time);
    
    // Skip sessions that don't meet date threshold for manual filtering strategies
    if (queryStrategy === 'simple_fallback' && startTime && startTime < dateThreshold) {
      return null;
    }
    
    // Calculate duration if we have both start and end times
    let durationSeconds = 0;
    if (startTime && endTime) {
      durationSeconds = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
    }
    
    // Extract token information from nested session_stats structure
    const totalTokens = sessionData.total_tokens || 0;
    const completionTokens = sessionData.completion_tokens || 0;
    const promptTokens = sessionData.prompt_tokens || 0;
    
    // Read cost directly from session document, do not show if missing
    const estimatedCost = sessionData.cost || 0; // Only use actual stored cost, 0 if missing
    
    // Get message count from nested session_stats structure (primary) with fallbacks
    const messageCount = sessionData.message_count || 0;
    
    // Extract session info from nested structure
    const sessionInfo = sessionData.session_info || {};
    
    return {
      session_id: docId,
      agent_id: sessionData.agent_id,
      start_time: startTime,
      end_time: endTime,
      duration_seconds: sessionInfo.duration_seconds || durationSeconds,
      message_count: messageCount,
      total_tokens: totalTokens,
      completion_tokens: completionTokens,
      prompt_tokens: promptTokens,
      estimated_cost: estimatedCost,
      status: sessionInfo.status || sessionData.status || 'completed',
      title: sessionInfo.title || sessionData.title || sessionData.session_title || 'Untitled Session',
      user_id: sessionInfo.user_identifier || sessionData.user_id || sessionData.userId,
      created_at: startTime,
      updated_at: endTime || startTime,
      channel: sessionData.channel || sessionInfo.channel || 'api',
      phone_number: sessionInfo.phone_number || null,
      profile_name: sessionData.profile_name || null,
      mode: sessionData.mode || 'production' // development, testing, or production
    };

  } catch (error) {
    console.warn(`⚠️ Error transforming session data for ${docId}:`, error.message);
    return null;
  }
};

/**
 * Get agent sessions directly from Firestore (reads from agent_sessions collection and subcollection messages)
 */
export const getAgentSessionsFromFirestore = async (agentId, days = 30, pageSize = 20, offset = 0) => {
  try {
    console.log(`🔥 Reading agent sessions from agent_sessions collection and aggregating subcollection messages for agent: ${agentId}, days: ${days}, pageSize: ${pageSize}, offset: ${offset}`);
    
    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    console.log(`📅 Date threshold: ${dateThreshold.toISOString()}`);
    
    const sessionsRef = collection(db, 'agent_sessions');
    console.log(`🔍 Querying agent_sessions collection for agent_id: ${agentId}`);
    
    let sessionsSnapshot;
    let allSessions = [];
    let queryStrategy = 'unknown';
    
    // Strategy 1: Try optimized composite query with limit optimization
    try {
      // Use a larger limit to account for pagination and filtering
      const optimizedLimit = Math.max(pageSize + offset + 20, 100);
      
      const optimizedQuery = query(
        sessionsRef,
        where('agent_id', '==', agentId),
        orderBy('last_message_at', 'desc'),
        limit(optimizedLimit)
      );
      
      console.log(`🔍 Executing optimized composite query (limit: ${optimizedLimit})`);
      sessionsSnapshot = await getDocs(optimizedQuery);
      queryStrategy = 'optimized_composite';
      
    } catch (compositeError) {
      console.warn(`⚠️ Optimized composite query failed: ${compositeError.message}`);
      
      // Strategy 2: Try basic composite query
      try {
        const basicQuery = query(
          sessionsRef,
          where('agent_id', '==', agentId),
          orderBy('last_message_at', 'desc'),
          limit(pageSize + offset)
        );
        
        console.log(`🔍 Executing basic composite query`);
        sessionsSnapshot = await getDocs(basicQuery);
        queryStrategy = 'basic_composite';
        
      } catch (basicError) {
        console.warn(`⚠️ Basic composite query failed: ${basicError.message}`);
        
        // Strategy 3: Fallback to simple query with manual filtering
        const fallbackLimit = Math.max(pageSize + offset + 50, 200);
        const simpleQuery = query(
          sessionsRef,
          where('agent_id', '==', agentId),
          limit(fallbackLimit) // Get more to filter manually
        );
        
        console.log(`🔍 Executing fallback simple query (limit: ${fallbackLimit})`);
        sessionsSnapshot = await getDocs(simpleQuery);
        queryStrategy = 'simple_fallback';
      }
    }
    
    console.log(`📊 Raw query returned ${sessionsSnapshot.size} documents using ${queryStrategy} strategy`);
    
    // Process all sessions with enhanced error handling
    let processedCount = 0;
    let errorCount = 0;
    
    sessionsSnapshot.forEach((doc) => {
      try {
        const sessionData = doc.data();
        
        // Enhanced session data transformation
        const transformedSession = transformSessionData(doc.id, sessionData, dateThreshold, queryStrategy);
        
        if (transformedSession) {
          allSessions.push(transformedSession);
          processedCount++;
        }
        
      } catch (sessionError) {
        console.warn(`⚠️ Error processing session ${doc.id}:`, sessionError.message);
        errorCount++;
      }
    });
    
    // Sort by start time (descending) if we did manual filtering or used fallback
    if (queryStrategy === 'simple_fallback') {
      allSessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    }
    
    // Apply pagination
    allSessions = allSessions.slice(offset, offset + pageSize);

    // Get total count for this agent

    console.log(`✅ Processed ${processedCount} sessions, ${errorCount} errors using ${queryStrategy} strategy`);
    
    // PHASE 2: Check if we found any sessions (discovery simplified)
    if (allSessions.length === 0) {
      console.log(`📭 No sessions found in agent_sessions, discovery simplified for new architecture`);
      try {
        const discoveredSessions = await discoverSessionsFromMessages(agentId, days);
        console.log(`🔍 Discovered ${discoveredSessions.length} sessions (simplified)`);
        
        // Apply pagination to discovered sessions
        const paginatedDiscoveredSessions = discoveredSessions.slice(offset, offset + pageSize);
        
        return {
          sessions: paginatedDiscoveredSessions,
          total_sessions: discoveredSessions.length,
          has_more: (offset + pageSize) < discoveredSessions.length,
          query_strategy: 'discovered_from_messages',
          processed_count: discoveredSessions.length,
          error_count: 0,
          message_aggregation: true,
          discovered_sessions: true
        };
      } catch (discoveryError) {
        console.error(`❌ Error discovering sessions from messages:`, discoveryError);
      }
    }

    // PHASE 3: Aggregate message data from agent_sessions/{sessionId}/messages subcollections
    console.log(`📨 Aggregating message data from subcollections for ${allSessions.length} sessions`);
    const sessionsWithMessages = await aggregateSessionMessages(allSessions, agentId);
    
    // Apply pagination to sessions with message data
    const paginatedSessionsWithMessages = sessionsWithMessages.slice(offset, offset + pageSize);
    
    console.log(`📄 Returning ${paginatedSessionsWithMessages.length} sessions with message data (${sessionsWithMessages.length} total after filtering)`);
    console.log(`🔍 Sample enhanced session data:`, JSON.stringify(paginatedSessionsWithMessages[0] || {}, null, 2));
    
    return {
      sessions: paginatedSessionsWithMessages,
      total_sessions: sessionsWithMessages.length,
      has_more: (offset + pageSize) < sessionsWithMessages.length,
      query_strategy: queryStrategy,
      processed_count: processedCount,
      error_count: errorCount,
      message_aggregation: true
    };
  } catch (error) {
    console.error(`❌ Error reading sessions from Firestore for ${agentId}:`, error);
    console.error(`Error details:`, error.message, error.code);
    
    // Return empty result instead of throwing
    return {
      sessions: [],
      total_sessions: 0,
      has_more: false
    };
  }
};

/**
 * Enhanced dashboard data that reads from Firestore directly (no API fallback)
 */
export const getAgentDashboardFromFirestore = async (agentId, timeframe = '30') => {
  try {
    console.log(`🔥 Getting dashboard data from Firestore for agent: ${agentId}, timeframe: ${timeframe} days`);
    
    // Get data directly from Firestore - no API fallback
    const firestoreData = await getAgentAnalyticsFromFirestore(agentId);
    
    console.log(`✅ Using Firestore data for dashboard`);
    return firestoreData;
    
  } catch (error) {
    console.error(`Error getting dashboard data from Firestore for ${agentId}:`, error);
    
    // Return empty data structure instead of failing API call
    console.log(`📊 Returning empty analytics data due to Firestore error`);
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      estimatedCost: 0,
      averageTokensPerSession: 0,
      averageMessagesPerSession: 0,
      tokenBreakdown: {
        completion: 0,
        prompt: 0,
        total: 0
      },
      dailyBreakdown: {},
      timeSeries: [],
      firstSession: null,
      lastSession: null
    };
  }
};

/**
 * REAL-TIME FIRESTORE LISTENERS
 * These functions provide real-time updates for analytics data
 */

/**
 * Subscribe to real-time agent analytics updates
 * @param {string} agentId - The agent ID to monitor
 * @param {function} onUpdate - Callback function to receive updates
 * @param {function} onError - Callback function for errors
 * @returns {function} Unsubscribe function
 */
export const subscribeToAgentAnalytics = (agentId, onUpdate, onError = null) => {
  console.log(`🔥 Setting up real-time listener for agent analytics: ${agentId}`);
  
  const agentAnalyticsRef = doc(db, 'agent_analytics', agentId);
  
  const unsubscribe = onSnapshot(
    agentAnalyticsRef,
    async (doc) => {
      console.log(`📥 Real-time update received for agent ${agentId}`);
      
      if (doc.exists()) {
        const analyticsData = doc.data();
        console.log(`✅ Analytics data found in agent_analytics:`, analyticsData);
        
        // Check if the analytics data has meaningful values
        const hasData = analyticsData.total_messages > 0 || analyticsData.basic_metrics?.total_messages > 0;
        console.log(`🔍 Analytics data has meaningful values:`, hasData);
        
        if (hasData) {
          // Transform Firestore data to expected format
          const transformedData = transformFirestoreAnalytics(analyticsData);
          console.log(`📤 Sending transformed analytics:`, transformedData);
          onUpdate(transformedData);
        } else {
          console.log(`📊 Analytics data exists but is empty, falling back to sessions calculation`);
          try {
            const calculatedAnalytics = await calculateAnalyticsFromSessions(agentId);
            console.log(`✅ Calculated analytics from sessions (fallback):`, calculatedAnalytics);
            onUpdate(calculatedAnalytics);
          } catch (error) {
            console.error(`❌ Error calculating analytics from sessions:`, error);
            onUpdate(getEmptyAnalyticsData());
          }
        }
      } else {
        console.log(`📭 No analytics data found in agent_analytics for agent ${agentId}`);
        console.log(`🔢 Falling back to calculating analytics from sessions...`);
        
        try {
          // FALLBACK: Calculate from sessions when analytics data doesn't exist
          const calculatedAnalytics = await calculateAnalyticsFromSessions(agentId);
          console.log(`✅ Calculated analytics from sessions:`, calculatedAnalytics);
          onUpdate(calculatedAnalytics);
        } catch (error) {
          console.error(`❌ Error calculating analytics from sessions:`, error);
          onUpdate(getEmptyAnalyticsData());
        }
      }
    },
    (error) => {
      console.error(`❌ Real-time listener error for agent ${agentId}:`, error);
      if (onError) {
        onError(error);
      }
    }
  );
  
  console.log(`🔔 Real-time listener active for agent ${agentId}`);
  return unsubscribe;
};

/**
 * Subscribe to real-time user analytics updates
 * @param {string} userId - The user ID to monitor
 * @param {function} onUpdate - Callback function to receive updates
 * @param {function} onError - Callback function for errors
 * @returns {function} Unsubscribe function
 */
export const subscribeToUserAnalytics = (userId, onUpdate, onError = null) => {
  console.log(`🔥 Setting up real-time listener for user analytics: ${userId}`);
  
  const userAnalyticsRef = doc(db, 'user_analytics', userId);
  
  const unsubscribe = onSnapshot(
    userAnalyticsRef,
    (doc) => {
      console.log(`📥 Real-time update received for user ${userId}`);
      
      if (doc.exists()) {
        const analyticsData = doc.data();
        console.log(`✅ User analytics data updated:`, analyticsData);
        
        onUpdate({
          totalAgents: analyticsData.total_agents || 0,
          totalSessions: analyticsData.total_sessions || 0,
          totalMessages: analyticsData.total_messages || 0,
          totalCosts: analyticsData.total_costs || 0,
          agentBreakdown: analyticsData.agent_breakdown || {}
        });
      } else {
        console.log(`📭 No user analytics data found for user ${userId}`);
        onUpdate({
          totalAgents: 0,
          totalSessions: 0,
          totalMessages: 0,
          totalCosts: 0,
          agentBreakdown: {}
        });
      }
    },
    (error) => {
      console.error(`❌ Real-time listener error for user ${userId}:`, error);
      if (onError) {
        onError(error);
      }
    }
  );
  
  console.log(`🔔 Real-time listener active for user ${userId}`);
  return unsubscribe;
};

/**
 * Subscribe to real-time enhanced analytics updates
 * @param {string} agentId - The agent ID to monitor
 * @param {function} onUpdate - Callback function to receive updates
 * @param {function} onError - Callback function for errors  
 * @returns {function} Unsubscribe function
 */
export const subscribeToEnhancedAnalytics = (agentId, onUpdate, onError = null) => {
  console.log(`🔥 Setting up real-time listener for enhanced analytics: ${agentId}`);
  
  const agentAnalyticsRef = doc(db, 'agent_analytics', agentId);
  
  const unsubscribe = onSnapshot(
    agentAnalyticsRef,
    (doc) => {
      console.log(`📥 Real-time enhanced analytics update received for agent ${agentId}`);
      
      if (doc.exists()) {
        const analyticsData = doc.data();
        console.log(`✅ Enhanced analytics data updated:`, analyticsData);
        
        // Transform to enhanced analytics format (only use real data)
        const enhancedData = {
          data: {
            business_metrics: analyticsData.business_metrics || null,
            optimization_suggestions: analyticsData.optimization_suggestions || null,
            active_alerts: analyticsData.active_alerts || []
          },
          cacheStatus: 'FIRESTORE_REALTIME',
          generatedAt: analyticsData.last_updated ? new Date(analyticsData.last_updated) : new Date()
        };
        
        onUpdate(enhancedData);
      } else {
        console.log(`📭 No enhanced analytics data found for agent ${agentId}`);
        onUpdate(null);
      }
    },
    (error) => {
      console.error(`❌ Real-time enhanced analytics listener error for agent ${agentId}:`, error);
      if (onError) {
        onError(error);
      }
    }
  );
  
  console.log(`🔔 Real-time enhanced analytics listener active for agent ${agentId}`);
  return unsubscribe;
};

/**
 * Subscribe to real-time agent sessions updates (sessions only - message monitoring simplified)
 * @param {string} agentId - The agent ID to monitor
 * @param {function} onUpdate - Callback function to receive session updates
 * @param {function} onError - Callback function for errors
 * @param {number} days - Number of days to monitor (default: 30)
 * @returns {function} Unsubscribe function
 */
export const subscribeToAgentSessions = (agentId, onUpdate, onError = null, days = 30) => {
  console.log(`🔥 Setting up enhanced real-time listener for agent sessions and messages: ${agentId}`);
  
  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  let sessionsUnsubscribe = null;
  let messagesUnsubscribe = null;
  
  // Throttle updates to avoid excessive calls
  const throttledUpdate = (() => {
    let timeout = null;
    return () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          console.log(`🔄 Triggering enhanced session data refresh for agent ${agentId}`);
          // Fetch fresh session data with message aggregation
          const freshSessionsData = await getAgentSessionsFromFirestore(agentId, days, 100, 0);
          
          onUpdate({
            ...freshSessionsData,
            query_strategy: 'realtime_enhanced',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`❌ Error in throttled update:`, error);
          if (onError) onError(error);
        }
      }, 1000); // 1 second throttle
    };
  })();
  
  // 1. Listen to agent_sessions changes
  const sessionsRef = collection(db, 'agent_sessions');
  let sessionsQuery;
  
  try {
    sessionsQuery = query(
      sessionsRef,
      where('agent_id', '==', agentId),
      orderBy('last_message_at', 'desc'),
      limit(100)
    );
  } catch (queryError) {
    console.warn('⚠️ Real-time sessions query with date filter failed, using simple query:', queryError.message);
    sessionsQuery = query(
      sessionsRef,
      where('agent_id', '==', agentId),
      limit(100)
    );
  }
  
  sessionsUnsubscribe = onSnapshot(
    sessionsQuery,
    (snapshot) => {
      console.log(`📥 Real-time sessions update: ${snapshot.size} session documents for agent ${agentId}`);
      throttledUpdate();
    },
    (error) => {
      console.error(`❌ Real-time sessions listener error for agent ${agentId}:`, error);
      if (onError) onError(error);
    }
  );
  
  // 2. Message monitoring simplified - not subscribing to subcollections
  // With the new architecture, messages are in agent_sessions/{sessionId}/messages
  // Real-time monitoring of all message subcollections would be complex
  console.log(`ℹ️ Message real-time monitoring simplified - using session-level updates only`);

  // Simplified - no message subscription for now
  messagesUnsubscribe = null;
  
  console.log(`🔔 Real-time listeners active for agent ${agentId} (sessions only)`);
  
  // Return composite unsubscribe function
  return () => {
    console.log(`🔇 Cleaning up real-time listeners for agent ${agentId}`);
    if (sessionsUnsubscribe) sessionsUnsubscribe();
    if (messagesUnsubscribe) messagesUnsubscribe();
  };
};

/**
 * Helper function to transform Firestore analytics data to expected format
 */
const transformFirestoreAnalytics = (analyticsData) => {
  const basicMetrics = analyticsData.basic_metrics || {};
  
  const extractValue = (field) => {
    return analyticsData[field] || 
           basicMetrics[field] || 
           0;
  };
  
  const extractDailyBreakdown = () => {
    const daily = analyticsData.daily_breakdown || 
                 basicMetrics.daily_breakdown || 
                 {};
    
    if (Object.keys(daily).length === 0) {
      const totalMessages = extractValue('total_messages');
      const totalTokens = extractValue('total_tokens');
      const estimatedCost = extractValue('estimated_cost');
      
      if (totalMessages > 0 || totalTokens > 0) {
        const today = new Date().toISOString().split('T')[0];
        return {
          [today]: {
            messages: totalMessages,
            tokens: totalTokens,
            cost: estimatedCost|| 0
          }
        };
      }
    }
    
    return daily;
  };
  
  const totalSessions = extractValue('total_sessions');
  const totalMessages = extractValue('total_messages');
  const totalTokens = extractValue('total_tokens');
  const estimatedCost = extractValue('estimated_cost') || 0;
  
  return {
    totalSessions,
    totalMessages,
    totalTokens,
    estimatedCost,
    averageTokensPerSession: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
    averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
    tokenBreakdown: {
      completion: extractValue('completion_tokens'),
      prompt: extractValue('prompt_tokens'),
      total: totalTokens
    },
    dailyBreakdown: extractDailyBreakdown(),
    timeSeries: analyticsData.time_series || basicMetrics.time_series || [],
    firstSession: analyticsData.first_session_date || basicMetrics.first_session_date,
    lastSession: analyticsData.last_session_date || basicMetrics.last_session_date
  };
};

/**
 * Calculate analytics from sessions when agent_analytics collection is empty
 * Now uses enhanced session data that includes actual message statistics from subcollections
 */
const calculateAnalyticsFromSessions = async (agentId, days = 30) => {
  try {
    console.log(`🔢 Calculating analytics from enhanced sessions (with message data) for agent: ${agentId}`);
    
    // Get all sessions for the agent (now includes message aggregation)
    const sessionsData = await getAgentSessionsFromFirestore(agentId, days, 1000, 0);
    const sessions = sessionsData.sessions;
    
    if (sessions.length === 0) {
      console.log(`📭 No sessions found for agent ${agentId}, returning empty analytics`);
      return getEmptyAnalyticsData();
    }
    
    console.log(`📊 Aggregating data from ${sessions.length} enhanced sessions`);
    console.log(`📨 Sessions with message data: ${sessions.filter(s => s.has_messages).length}`);
    console.log(`📭 Sessions without message data: ${sessions.filter(s => !s.has_messages).length}`);
    
    // Debug: Log first few sessions to see their enhanced structure
    console.log(`🔍 First enhanced session data:`, {
      session_id: sessions[0]?.session_id,
      message_count: sessions[0]?.message_count,
      actual_message_count: sessions[0]?.actual_message_count,
      has_messages: sessions[0]?.has_messages,
      total_tokens: sessions[0]?.total_tokens,
      estimated_cost: sessions[0]?.estimated_cost,
      message_preview: sessions[0]?.message_preview
    });
    
    // Aggregate totals from enhanced sessions
    const totals = sessions.reduce((acc, session) => {
      // Use actual message-based counts when available, fall back to session metadata
      const messageCount = session.actual_message_count || session.message_count || 0;
      const tokenCount = session.total_tokens || 0;
      const cost = session.estimated_cost || 0;
      
      // Debug: Log each session's contribution (only for first few sessions to avoid spam)
      if (acc.totalSessions < 5) {
        console.log(`📊 Session ${session.session_id}: messages=${messageCount}${session.actual_message_count ? ' (from messages)' : ' (from metadata)'}, tokens=${tokenCount}, cost=${cost.toFixed(4)}, has_messages=${session.has_messages}`);
      }
      
      acc.totalSessions += 1;
      acc.totalMessages += messageCount;
      acc.totalTokens += tokenCount;
      acc.estimatedCost += cost;
      acc.completionTokens += session.completion_tokens || 0;
      acc.promptTokens += session.prompt_tokens || 0;
      
      // Track sessions with actual message data
      if (session.has_messages) {
        acc.sessionsWithMessages += 1;
        acc.averageProcessingTime += session.average_processing_time || 0;
      }
      
      return acc;
    }, {
      totalSessions: 0,
      totalMessages: 0, 
      totalTokens: 0,
      estimatedCost: 0,
      completionTokens: 0,
      promptTokens: 0,
      sessionsWithMessages: 0,
      averageProcessingTime: 0
    });
    
    console.log(`🎯 Final aggregated totals:`, {
      totalSessions: totals.totalSessions,
      totalMessages: totals.totalMessages,
      totalTokens: totals.totalTokens,
      estimatedCost: totals.estimatedCost.toFixed(4),
      sessionsWithMessages: totals.sessionsWithMessages
    });
    
    // Calculate daily breakdown using actual activity dates (last_message_time or start_time)
    const dailyBreakdown = {};
    sessions.forEach(session => {
      // Use last message time if available (more accurate for recent activity)
      const activityDate = session.last_message_time || session.start_time;
      if (activityDate) {
        const date = new Date(activityDate).toISOString().split('T')[0];
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { messages: 0, tokens: 0, cost: 0, sessions: 0 };
        }
        dailyBreakdown[date].messages += session.actual_message_count || session.message_count || 0;
        dailyBreakdown[date].tokens += session.total_tokens || 0;
        dailyBreakdown[date].cost += session.estimated_cost || 0;
        dailyBreakdown[date].sessions += 1;
      }
    });
    
    // Generate time series from daily breakdown
    const timeSeries = Object.entries(dailyBreakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        messages: data.messages,
        tokens: data.tokens,
        cost: data.cost,
        sessions: data.sessions
      }));
    
    // Calculate average processing time
    const avgProcessingTime = totals.sessionsWithMessages > 0 ? 
      Math.round(totals.averageProcessingTime / totals.sessionsWithMessages) : 0;
    
    console.log(`✅ Calculated enhanced analytics - Sessions: ${totals.totalSessions}, Messages: ${totals.totalMessages}, Tokens: ${totals.totalTokens}, Processing Time: ${avgProcessingTime}ms`);
    console.log(`📅 Daily breakdown covers ${Object.keys(dailyBreakdown).length} days`);
    
    return {
      totalSessions: totals.totalSessions,
      totalMessages: totals.totalMessages,
      totalTokens: totals.totalTokens,
      estimatedCost: totals.estimatedCost,
      averageTokensPerSession: totals.totalSessions > 0 ? Math.round(totals.totalTokens / totals.totalSessions) : 0,
      averageMessagesPerSession: totals.totalSessions > 0 ? Math.round(totals.totalMessages / totals.totalSessions) : 0,
      tokenBreakdown: { 
        completion: totals.completionTokens || Math.round(totals.totalTokens * 0.7), // Use actual or estimate
        prompt: totals.promptTokens || Math.round(totals.totalTokens * 0.3), // Use actual or estimate  
        total: totals.totalTokens 
      },
      dailyBreakdown,
      timeSeries,
      firstSession: sessions[sessions.length - 1]?.start_time || null,
      lastSession: sessions[0]?.last_message_time || sessions[0]?.start_time || null,
      
      // Additional insights from enhanced data
      sessionsWithMessages: totals.sessionsWithMessages,
      averageProcessingTime: avgProcessingTime,
      recentActivity: sessions.slice(0, 5).filter(s => s.has_messages).map(s => ({
        session_id: s.session_id,
        last_message_time: s.last_message_time,
        message_count: s.actual_message_count,
        preview: s.message_preview?.content
      }))
    };
    
  } catch (error) {
    console.error(`❌ Error calculating analytics from enhanced sessions for agent ${agentId}:`, error);
    return getEmptyAnalyticsData();
  }
};

/**
 * Session discovery simplified - relies on agent_sessions collection
 * This handles cases where conversations exist but session metadata is missing
 * @param {string} agentId - Agent ID
 * @param {number} days - Days to look back
 * @returns {Promise<Array>} Discovered sessions
 */
// eslint-disable-next-line no-unused-vars
const discoverSessionsFromMessages = async (agentId, days = 30) => {
  try {
    console.log(`🕵️ Session discovery not needed - sessions should exist in agent_sessions collection for agent: ${agentId}`);

    // With the new architecture, sessions are stored in agent_sessions collection
    // and messages in agent_sessions/{sessionId}/messages subcollections
    // No need to discover from a flat collection - using subcollections
    return [];

  } catch (error) {
    console.error(`❌ Error discovering sessions (simplified):`, error);
    return [];
  }
};

/**
 * Aggregate message data from agent_sessions/{sessionId}/messages subcollections for sessions
 * This connects session metadata with actual conversation messages
 */
const aggregateSessionMessages = async (sessions, agentId) => {
  try {
    console.log(`📨 Starting message aggregation for ${sessions.length} sessions`);
    
    if (sessions.length === 0) {
      return sessions;
    }
    
    // Get all session IDs
    const sessionIds = sessions.map(session => session.session_id);
    console.log(`🔍 Session IDs to aggregate: ${sessionIds.slice(0, 5).join(', ')}${sessionIds.length > 5 ? '...' : ''}`);
    
    // Query agent_sessions/{sessionId}/messages subcollections for all sessions
    const messagesBySession = {};

    // Process each session individually (subcollections don't support batch 'in' queries)
    for (const sessionId of sessionIds) {
      try {
        const messagesRef = collection(db, `agent_sessions/${sessionId}/messages`);
        const messagesQuery = query(
          messagesRef,
          orderBy('timestamp', 'asc')
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        console.log(`📊 Session ${sessionId}: Found ${messagesSnapshot.size} messages`);

        // Collect messages for this session
        messagesBySession[sessionId] = [];
        messagesSnapshot.forEach((doc) => {
          const messageData = doc.data();

          messagesBySession[sessionId].push({
            message_id: doc.id,
            role: messageData.role || 'user',
            content: messageData.content || '',
            timestamp: messageData.timestamp,
            agent_id: messageData.agent_id,
            token_usage: messageData.token_usage || {},
            processing_time_ms: 0 // Not available in new schema
          });
        });
      } catch (sessionError) {
        console.warn(`⚠️ Error processing messages for session ${sessionId}:`, sessionError.message);
        messagesBySession[sessionId] = [];
      }
    }
    
    console.log(`📊 Message aggregation complete. Found messages for ${Object.keys(messagesBySession).length} sessions`);
    
    // Enhance each session with message statistics
    const enhancedSessions = sessions.map(session => {
      const sessionMessages = messagesBySession[session.session_id] || [];
      
      if (sessionMessages.length === 0) {
        // No messages found, return session as-is
        return {
          ...session,
          actual_message_count: 0,
          message_preview: null,
          last_message_time: null,
          has_messages: false
        };
      }
      
      // Sort messages by sequence number
      sessionMessages.sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
      
      // Calculate aggregate statistics from actual messages
      const messageStats = sessionMessages.reduce((acc, msg) => {
        const tokenUsage = msg.token_usage || {};
        const totalTokens = tokenUsage.total_tokens || 0;
        const completionTokens = tokenUsage.completion_tokens || 0;
        const promptTokens = tokenUsage.prompt_tokens || 0;
        
        acc.messageCount += 1;
        acc.totalTokens += totalTokens;
        acc.completionTokens += completionTokens;
        acc.promptTokens += promptTokens;
        acc.processingTime += msg.processing_time_ms || 0;
        
        return acc;
      }, {
        messageCount: 0,
        totalTokens: 0,
        completionTokens: 0,
        promptTokens: 0,
        processingTime: 0
      });
      
      // Get last message for preview
      const lastMessage = sessionMessages[sessionMessages.length - 1];
      const firstMessage = sessionMessages[0];
      
      // Calculate estimated cost from actual tokens
      //const estimatedCost = calculateCostFromTokens(messageStats.totalTokens);
      
      // Handle timestamp parsing for last message
      let lastMessageTime = null;
      if (lastMessage?.timestamp) {
        if (lastMessage.timestamp?.toDate) {
          lastMessageTime = lastMessage.timestamp.toDate();
        } else if (typeof lastMessage.timestamp === 'string') {
          lastMessageTime = new Date(lastMessage.timestamp);
        } else if (lastMessage.timestamp?.seconds) {
          lastMessageTime = new Date(lastMessage.timestamp.seconds * 1000);
        }
      }
      
      // Enhanced session with actual message data
      return {
        ...session,
        // Override with actual message-based statistics
        message_count: messageStats.messageCount,
        total_tokens: messageStats.totalTokens,
        completion_tokens: messageStats.completionTokens,
        prompt_tokens: messageStats.promptTokens,
        estimated_cost: session.estimated_cost || 0,
        
        // Additional message-based fields
        actual_message_count: messageStats.messageCount,
        message_preview: lastMessage ? {
          role: lastMessage.role,
          content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
          timestamp: lastMessageTime
        } : null,
        last_message_time: lastMessageTime,
        first_message_time: firstMessage?.timestamp,
        has_messages: true,
        average_processing_time: messageStats.messageCount > 0 ? Math.round(messageStats.processingTime / messageStats.messageCount) : 0,
        conversation_length: sessionMessages.length,
        
        // Update end_time with last message time if available
        end_time: lastMessageTime || session.end_time,
        updated_at: lastMessageTime || session.updated_at
      };
    });
    
    // Sort sessions by last activity (sessions with recent messages first)
    enhancedSessions.sort((a, b) => {
      const aTime = a.last_message_time || a.end_time || a.start_time || new Date(0);
      const bTime = b.last_message_time || b.end_time || b.start_time || new Date(0);
      return new Date(bTime) - new Date(aTime);
    });
    
    console.log(`✅ Enhanced ${enhancedSessions.length} sessions with message data`);
    console.log(`📊 Sessions with messages: ${enhancedSessions.filter(s => s.has_messages).length}`);
    console.log(`📊 Sessions without messages: ${enhancedSessions.filter(s => !s.has_messages).length}`);
    
    return enhancedSessions;
    
  } catch (error) {
    console.error(`❌ Error aggregating session messages:`, error);
    // Return original sessions on error
    return sessions;
  }
};

/**
 * Helper function to get empty analytics data structure
 */
const getEmptyAnalyticsData = () => {
  return {
    totalSessions: 0,
    totalMessages: 0,
    totalTokens: 0,
    estimatedCost: 0,
    averageTokensPerSession: 0,
    averageMessagesPerSession: 0,
    tokenBreakdown: { completion: 0, prompt: 0, total: 0 },
    dailyBreakdown: {},
    timeSeries: [],
    firstSession: null,
    lastSession: null
  };
};