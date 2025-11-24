/**
 * Usage Service
 *
 * Service layer for fetching and processing usage analytics data
 * via backend API (DataAccess layer)
 *
 * NOTE: Many unused functions have been removed for embed mode.
 * Only actively used functions are included.
 */

import { getDataAccess } from '../data/DataAccessFactory';

class UsageService {
  constructor() {
    this.collections = {
      AGENT_USAGE: 'agent_usage',
      ORGANIZATIONS: 'organizations',
      PROJECTS: 'projects',
      AGENTS: 'agents',
      AGENT_SESSIONS: 'agent_sessions'
    };
  }

  // ========== AGENT USAGE ==========

  /**
   * Get agent-level usage analytics via backend API
   */
  async getAgentUsage(agentId) {
    try {
      const dataAccess = getDataAccess();
      const data = await dataAccess.getAgentAnalytics(agentId);

      if (!data) {
        return {
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_messages: 0,
          total_sessions: 0,
          total_api_calls: 0,
          cost: 0,
          session_details: []
        };
      }

      // Return with correct field names
      return {
        total_tokens: data.total_tokens || 0,
        prompt_tokens: data.prompt_tokens || 0,
        completion_tokens: data.completion_tokens || 0,
        total_messages: data.total_messages || 0,
        total_sessions: data.total_sessions || 0,
        total_api_calls: data.total_api_calls || 0,
        cost: data.cost || 0,
        session_details: data.session_details || []
      };
    } catch (error) {
      console.error('Error getting agent usage:', error);
      throw error;
    }
  }

  /**
   * Get agent sessions for a specific month via backend API
   * TODO: Backend needs month filtering support
   */
  async getAgentSessions(agentId, selectedMonth = null) {
    try {
      const dataAccess = getDataAccess();

      // Get sessions from backend
      const sessions = await dataAccess.getAgentSessions(agentId, 100, 0);

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Filter by month if provided
      let filteredSessions = sessions;
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        filteredSessions = sessions.filter(session => {
          const sessionDate = session.created_at?.toDate?.() || new Date(session.created_at);
          return sessionDate.getFullYear() === year && sessionDate.getMonth() + 1 === month;
        });
      }

      // Transform to expected format
      return filteredSessions.map(session => ({
        session_id: session.id || session.session_id,
        created_at: session.created_at,
        total_tokens: session.total_tokens || 0,
        message_count: session.message_count || 0,
        cost: session.cost || 0
      }));
    } catch (error) {
      console.error('Error getting agent sessions:', error);
      return [];
    }
  }

  /**
   * Get agent API calls with trend data
   * TODO: Backend needs API calls endpoint
   */
  async getAgentApiCalls(agentId, options = {}) {
    // For now, return empty data structure
    // Backend doesn't have dedicated API calls endpoint yet
    return {
      total_calls: 0,
      calls_by_date: [],
      monthly_breakdown: []
    };
  }

  /**
   * Get project usage for a specific month
   * TODO: Backend needs project-level endpoints
   */
  async getProjectUsageByMonth(projectId, selectedMonth) {
    // Placeholder: Backend doesn't have project usage endpoint yet
    return {
      total_tokens: 0,
      total_messages: 0,
      total_sessions: 0,
      total_cost: 0,
      agents: []
    };
  }

  /**
   * Get usage for all agents in a project for a specific month
   * TODO: Backend needs project agents usage endpoint
   */
  async getProjectAgentsUsageByMonth(projectId, selectedMonth) {
    // Placeholder: Backend doesn't have project agents usage endpoint yet
    return [];
  }

  /**
   * Generate list of available months for project analytics
   * TODO: Backend needs project timeline endpoint
   */
  async generateAvailableMonthsForProject(projectId) {
    try {
      // Placeholder: Return last 12 months
      const months = [];
      const now = new Date();

      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(yearMonth);
      }

      return months;
    } catch (error) {
      console.error('Error generating available months:', error);
      return [];
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Format large numbers with K, M suffixes
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

export const usageService = new UsageService();
export default usageService;
