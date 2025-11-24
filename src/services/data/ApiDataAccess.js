/**
 * API Data Access - Embed Mode
 *
 * Backend API access for whitelabel embed deployments.
 * Uses organization API key authentication.
 */

import axios from 'axios';

// Load backend URLs from bundled configuration files
// Uses appropriate file based on REACT_APP_ENV (development/production)
const environment = process.env.REACT_APP_ENV || 'production';
const isDevelopment = environment === 'development';
const backendConfig = isDevelopment
  ? require('../../config/backend-urls.development.json')
  : require('../../config/backend-urls.production.json');

// Get API base URLs from bundled config
const API_BASE_URL = backendConfig.AGENT_BUILDER_AI_SERVICE_URL;
const AGENT_BRIDGE_URL = backendConfig.AGENT_BRIDGE_URL;

// Helper to get organization API key (matches pattern from apiConfig.js)
const getOrganizationApiKey = () => {
  return window.REACT_APP_ORGANIZATION_API_KEY || process.env.REACT_APP_ORGANIZATION_API_KEY;
};

class ApiDataAccess {
  constructor() {
    // Create axios instance with interceptors
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add organization API key to all requests
    this.api.interceptors.request.use(async (config) => {
      const apiKey = getOrganizationApiKey();

      if (apiKey) {
        config.headers.Authorization = `ApiKey ${apiKey}`;
      } else {
        console.warn('⚠️ API Key not set - requests will fail');
      }

      return config;
    });

    // Handle errors consistently
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ============================================================================
  // ORGANIZATION OPERATIONS
  // ============================================================================

  async getOrganization(organizationId) {
    const response = await this.api.get(`/api/organizations/${organizationId}`);
    return response.data.data || null;
  }

  async listOrganizations(userId) {
    // userId is handled by auth token in backend
    const response = await this.api.get('/api/organizations');
    return response.data.data || [];
  }

  async createOrganization(organizationData) {
    const response = await this.api.post('/api/organizations', organizationData);
    return response.data.data;
  }

  async updateOrganization(organizationId, updates) {
    const response = await this.api.put(`/api/organizations/${organizationId}`, updates);
    return response.data.data;
  }

  async listOrganizationMembers(organizationId) {
    const response = await this.api.get(`/api/organizations/${organizationId}/members`);
    return response.data.data || [];
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async getProject(projectId) {
    const response = await this.api.get(`/api/projects/${projectId}`);
    const project = response.data.data || null;

    // Normalize field names: backend returns project_id, frontend expects id
    if (project) {
      return {
        ...project,
        id: project.project_id || project.id
      };
    }

    return null;
  }

  async listProjects(organizationId = null) {
    const params = organizationId ? { organization_id: organizationId } : {};
    const response = await this.api.get('/api/projects', { params });
    const projects = response.data.data || [];

    // Normalize field names: backend returns project_id, frontend expects id
    return projects.map(project => ({
      ...project,
      id: project.project_id || project.id
    }));
  }

  async createProject(projectData) {
    const response = await this.api.post('/api/projects', projectData);
    return response.data;
  }

  async updateProject(projectId, updates) {
    const response = await this.api.patch(`/api/projects/${projectId}`, updates);
    return response.data.data;
  }

  async deleteProject(projectId) {
    const response = await this.api.delete(`/api/projects/${projectId}`);
    return response.data;
  }

  async listProjectMembers(projectId) {
    const response = await this.api.get(`/api/projects/${projectId}/members`);
    return response.data.data || [];
  }

  async getUserProjects(userId) {
    // Backend will use auth token to determine user, but we pass userId for clarity
    const response = await this.api.get(`/api/projects/user/${userId}`);
    const projects = response.data.data || [];

    // Normalize field names: backend returns project_id, frontend expects id
    return projects.map(project => ({
      ...project,
      id: project.project_id || project.id
    }));
  }

  async getOrganizationProjects(organizationId, filters = {}) {
    const params = {
      organization_id: organizationId,
      ...filters
    };
    const response = await this.api.get('/api/projects', { params });
    const projects = response.data.data || [];

    // Normalize field names: backend returns project_id, frontend expects id
    return projects.map(project => ({
      ...project,
      id: project.project_id || project.id
    }));
  }

  async checkProjectMemberByEmail(projectId, email) {
    const response = await this.api.get(`/api/projects/${projectId}/members/check`, {
      params: { email }
    });
    return response.data;
  }

  async getProjectAgents(projectId, filters = {}) {
    const response = await this.api.get(`/api/projects/${projectId}/agents`, {
      params: filters
    });
    return response.data.data || [];
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  async getAgent(agentId) {
    const response = await this.api.get(`/api/agents/${agentId}`);
    return response.data || null;
  }

  async listAgents(filters = {}) {
    const response = await this.api.get('/api/agents', { params: filters });
    console.log('[ApiDataAccess] listAgents response:', {
      fullResponse: response.data,
      agentsField: response.data.agents,
      filters
    });
    return response.data.agents || [];
  }

  async getActiveAgents(organizationId) {
    const response = await this.api.get(`/api/agents/organization/${organizationId}/active`);
    return response.data.data || [];
  }

  async getDeletedAgents(organizationId) {
    const response = await this.api.get(`/api/agents/organization/${organizationId}/deleted`);
    return response.data.data || [];
  }

  async getAgentsByTeamMember(userId) {
    const response = await this.api.get(`/api/agents/user/${userId}/team-agents`);
    return response.data.data || [];
  }

  async getUserAgents(userId, projectId = null, lifecycleState = 'active') {
    const params = { lifecycle_state: lifecycleState };
    if (projectId) {
      params.project_id = projectId;
    }
    const response = await this.api.get(`/api/agents/user/${userId}`, { params });
    return response.data.data || [];
  }

  async getProjectAgentsExcludingUser(projectId, excludeUserId, lifecycleState = 'active') {
    const params = {
      exclude_user_id: excludeUserId,
      lifecycle_state: lifecycleState
    };
    const response = await this.api.get(`/api/projects/${projectId}/agents`, { params });
    return response.data.data || [];
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Note: Real-time subscriptions are not available via REST API.
   * For Docker deployments, we use polling instead.
   * Returns an unsubscribe function for consistency with Firestore API.
   */
  subscribeToOrganization(organizationId, callback) {
    // Poll every 5 seconds
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const org = await this.getOrganization(organizationId);
        callback(org);
      } catch (error) {
        console.error('Error polling organization:', error);
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
  }

  subscribeToProject(projectId, callback) {
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const project = await this.getProject(projectId);
        callback(project);
      } catch (error) {
        console.error('Error polling project:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  subscribeToProjects(organizationId, callback) {
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const projects = await this.listProjects(organizationId);
        callback(projects);
      } catch (error) {
        console.error('Error polling projects:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  subscribeToAgent(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const agent = await this.getAgent(agentId);
        callback(agent);
      } catch (error) {
        console.error('Error polling agent:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  subscribeToAgents(filters, callback) {
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const agents = await this.listAgents(filters);
        console.log('[ApiDataAccess] subscribeToAgents - calling callback with agents:', {
          count: agents.length,
          agents: agents.slice(0, 2), // Log first 2 agents to avoid too much console spam
          filters
        });
        callback(agents);
      } catch (error) {
        console.error('Error polling agents:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // AGENT PUBLISHING OPERATIONS
  // ============================================================================

  async getPublishStatus(agentId) {
    try {
      const response = await this.api.get(`/api/agents/${agentId}/publish-status`);
      return response.data || null;
    } catch (error) {
      console.error('Error getting publish status:', error);
      // Return default status if endpoint doesn't exist yet
      return {
        isPublished: false,
        publishedAt: null,
        runtime: null
      };
    }
  }

  subscribeToPublishStatus(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const status = await this.getPublishStatus(agentId);
        callback(status);
      } catch (error) {
        console.error('Error polling publish status:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  async getDeploymentStatus(agentId) {
    try {
      const response = await this.api.get(`/api/agents/${agentId}/deployment-status`);
      return response.data || null;
    } catch (error) {
      console.error('Error getting deployment status:', error);
      // Return default status if endpoint doesn't exist yet
      return {
        hasDeployment: false,
        deploymentCount: 0
      };
    }
  }

  async getAgentServerStatus(agentId) {
    try {
      const response = await this.api.get(`/api/agents/${agentId}/server-status`);
      return response.data || null;
    } catch (error) {
      console.error('Error getting agent server status:', error);
      // Return default status if endpoint doesn't exist yet
      return {
        isRunning: false,
        status: 'unknown'
      };
    }
  }

  subscribeToAgentServerStatus(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;

    const poll = async () => {
      try {
        const status = await this.getAgentServerStatus(agentId);
        callback(status);
      } catch (error) {
        console.error('Error polling agent server status:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // USER PROFILE OPERATIONS
  // ============================================================================

  async getUserProfile(userId) {
    const response = await this.api.get(`/api/users/${userId}/profile`);
    return response.data.data || null;
  }

  async getCurrentSelections(userId) {
    const response = await this.api.get(`/api/users/${userId}/current-selections`);
    return response.data.data || null;
  }

  async getUser(userId) {
    const response = await this.api.get(`/api/users/${userId}`);
    return response.data.data || null;
  }

  async getUsersByIds(userIds) {
    // Get multiple users by their IDs
    const response = await this.api.post(`/api/users/batch`, { user_ids: userIds });
    return response.data.data || {};
  }

  // ============================================================================
  // INVITATION OPERATIONS
  // ============================================================================

  async getPendingInvitations(email) {
    const params = email ? { email, status: 'pending' } : { status: 'pending' };
    const response = await this.api.get('/api/invitations', { params });
    return response.data.data || [];
  }

  async getInvitation(invitationId) {
    const response = await this.api.get(`/api/invitations/${invitationId}`);
    return response.data.data || null;
  }

  // ============================================================================
  // API KEY OPERATIONS
  // ============================================================================

  async listApiKeys(agentId, filters = {}) {
    const response = await this.api.get(`/api/v1/agents/${agentId}/api-keys`, { params: filters });
    return response.data.keys || [];
  }

  async getApiKey(keyId) {
    const response = await this.api.get(`/api/agents/api-keys/${keyId}`);
    return response.data.data || null;
  }

  async createAgentApiKey(agentId, keyData) {
    const response = await this.api.post(`/api/v1/agents/${agentId}/api-keys`, keyData);
    return response.data || null;
  }

  async updateAgentApiKey(agentId, keyId, updates) {
    const response = await this.api.put(`/api/v1/agents/${agentId}/api-keys/${keyId}`, updates);
    return response.data || null;
  }

  async deleteAgentApiKey(agentId, keyId) {
    const response = await this.api.delete(`/api/v1/agents/${agentId}/api-keys/${keyId}`);
    return response.data || null;
  }

  async regenerateAgentApiKey(agentId, keyId) {
    const response = await this.api.post(`/api/v1/agents/${agentId}/api-keys/${keyId}/regenerate`);
    return response.data || null;
  }

  async revokeAgentApiKey(agentId, keyId) {
    // Revoke is same as delete
    return await this.deleteAgentApiKey(agentId, keyId);
  }

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  async getAgentAnalytics(agentId) {
    const response = await this.api.get(`/api/analytics/agents/${agentId}`);
    return response.data.data || null;
  }

  async getAgentSessions(agentId, limit = 50, offset = 0) {
    const params = { limit, offset };
    const response = await this.api.get(`/api/analytics/agents/${agentId}/sessions`, { params });
    return response.data.data || [];
  }

  async getDashboardMetrics(agentId, days = 7) {
    const params = { days };
    const response = await this.api.get(`/api/analytics/agents/${agentId}/dashboard`, { params });
    return response.data.data || null;
  }

  async getSessionDetails(sessionId) {
    const response = await this.api.get(`/api/analytics/sessions/${sessionId}`);
    return response.data.data || null;
  }

  async getSessionMessages(sessionId, limit = 100, offset = 0) {
    const params = { limit, offset };
    const response = await this.api.get(`/api/analytics/sessions/${sessionId}/messages`, { params });
    return response.data.data || [];
  }

  // ============================================================================
  // TILEDESK INTEGRATION OPERATIONS
  // ============================================================================

  async getTiledeskBot(agentId) {
    try {
      // Tiledesk endpoints are in agent-bridge service, not agent-builder-ai-service
      const apiKey = getOrganizationApiKey();
      const response = await axios.get(`${AGENT_BRIDGE_URL}/api/tiledesk/accounts/${agentId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${apiKey}`
        }
      });
      return response.data?.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Bot not found
      }
      console.error('Error getting Tiledesk bot:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACTIVITY OPERATIONS
  // ============================================================================

  async listActivities(resourceType, resourceId, organizationId = null, limit = 50, offset = 0) {
    const params = {
      resource_type: resourceType,
      limit,
      offset
    };

    if (resourceId) {
      params.resource_id = resourceId;
    }

    if (organizationId) {
      params.organization_id = organizationId;
    }

    const response = await this.api.get('/api/activities', { params });
    return response.data.data || [];
  }

  // Polling-based subscription for activities (Docker mode)
  subscribeToActivities(resourceType, resourceId, organizationId, callback) {
    const pollInterval = 5000; // 5 seconds
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const activities = await this.listActivities(resourceType, resourceId, organizationId, 20, 0);

        // Only call callback if data changed
        const currentDataStr = JSON.stringify(activities);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(activities);
        }
      } catch (error) {
        console.error('Error polling activities:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll(); // Start immediately

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // Polling-based subscription for sessions (Docker mode)
  subscribeToAgentSessions(agentId, callback) {
    const pollInterval = 10000; // 10 seconds for sessions
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const sessions = await this.getAgentSessions(agentId, 20, 0);

        // Only call callback if data changed
        const currentDataStr = JSON.stringify(sessions);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(sessions);
        }
      } catch (error) {
        console.error('Error polling sessions:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // WHATSAPP OPERATIONS
  // ============================================================================

  async listWhatsAppTemplates(agentId) {
    const response = await this.api.get(`/api/whatsapp/agents/${agentId}/templates`);
    return response.data.data || [];
  }

  async getWhatsAppContacts(agentId) {
    const response = await this.api.get(`/api/whatsapp/agents/${agentId}/contacts`);
    return response.data.data || [];
  }

  async getWhatsAppTasks(agentId) {
    const response = await this.api.get(`/api/whatsapp/agents/${agentId}/tasks`);
    return response.data.data || [];
  }

  async getWhatsAppMessages(agentId) {
    const response = await this.api.get(`/api/whatsapp/agents/${agentId}/messages`);
    return response.data.data || [];
  }

  // ============================================================================
  // AGENT TOOLS OPERATIONS
  // ============================================================================

  async getAgentApiTools(agentId) {
    const response = await this.api.get(`/api/agents/${agentId}/api-tools`);
    return response.data.data || [];
  }

  async getAgentToolConfigs(agentId) {
    const response = await this.api.get(`/api/agents/${agentId}/tool-configs`);
    return response.data.data || [];
  }

  // ============================================================================
  // AGENT SERVER OPERATIONS
  // ============================================================================

  async getAgentServer(agentId) {
    const response = await this.api.get(`/api/agents/${agentId}/server`);
    return response.data.data || null;
  }

  // ============================================================================
  // ALCHEMIST TRACKER OPERATIONS
  // ============================================================================

  async getAlchemistTrackers(userId) {
    const response = await this.api.get(`/api/alchemist/users/${userId}/trackers`);
    return response.data.data || [];
  }

  subscribeToAlchemistTrackers(userId, callback) {
    const pollInterval = 5000;
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const trackers = await this.getAlchemistTrackers(userId);

        // Only call callback if data changed
        const currentDataStr = JSON.stringify(trackers);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(trackers);
        }
      } catch (error) {
        console.error('Error polling trackers:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // WHATSAPP SUBSCRIPTION OPERATIONS (polling-based)
  // ============================================================================

  subscribeToWhatsAppContacts(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const contacts = await this.getWhatsAppContacts(agentId);
        const currentDataStr = JSON.stringify(contacts);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(contacts);
        }
      } catch (error) {
        console.error('Error polling WhatsApp contacts:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  subscribeToWhatsAppOutreachTasks(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const tasks = await this.getWhatsAppTasks(agentId);
        const currentDataStr = JSON.stringify(tasks);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(tasks);
        }
      } catch (error) {
        console.error('Error polling WhatsApp outreach tasks:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  subscribeToWhatsAppOutreachMessages(taskId, callback) {
    const pollInterval = 5000;
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const messages = await this.getWhatsAppMessages(taskId);
        const currentDataStr = JSON.stringify(messages);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(messages);
        }
      } catch (error) {
        console.error('Error polling WhatsApp outreach messages:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // MCP / TOOLS SUBSCRIPTION OPERATIONS (polling-based)
  // ============================================================================

  subscribeToMcpConfigurations(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        const configs = await this.getAgentToolConfigs(agentId);
        const currentDataStr = JSON.stringify(configs);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(configs);
        }
      } catch (error) {
        console.error('Error polling MCP configurations:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // ALCHEMIST STATUS SUBSCRIPTION OPERATIONS (polling-based)
  // ============================================================================

  subscribeToAlchemistStatus(userId, callback) {
    const pollInterval = 2000; // Faster polling for status
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        // API endpoint would need to be added to backend
        const response = await this.api.get(`/api/alchemist/status/${userId}`);
        const status = response.data;
        const currentDataStr = JSON.stringify(status);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(status);
        }
      } catch (error) {
        console.error('Error polling Alchemist status:', error);
        callback(null);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // ============================================================================
  // KNOWLEDGE BASE SUBSCRIPTION OPERATIONS (polling-based)
  // ============================================================================

  subscribeToAgentKnowledge(agentId, callback) {
    const pollInterval = 5000;
    let timeoutId;
    let lastData = null;

    const poll = async () => {
      try {
        // API endpoint would need to be added to backend
        const response = await this.api.get(`/api/agents/${agentId}/knowledge`);
        const files = response.data.files || [];
        const currentDataStr = JSON.stringify(files);
        if (currentDataStr !== lastData) {
          lastData = currentDataStr;
          callback(files);
        }
      } catch (error) {
        console.error('Error polling agent knowledge:', error);
      }
      timeoutId = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }
}

export default ApiDataAccess;
