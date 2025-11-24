/**
 * Agent Builder AI Service API Client
 *
 * Centralized API client for agent-builder-ai-service backend
 * Replaces direct Firestore writes with proper backend API calls
 */

import { getCurrentUser } from '../context';

/**
 * Get the agent-builder-ai-service base URL from environment
 */
const getAgentBuilderUrl = () => {
  const url = process.env.REACT_APP_AGENT_BUILDER_AI_SERVICE_URL;

  if (!url) {
    console.error('Agent Builder URL not configured in environment');
    throw new Error('Agent Builder service URL is not configured');
  }

  return url;
};

/**
 * Get auth token for API requests
 * Handles both embed mode (external token) and standalone mode (Firebase token)
 */
const getAuthToken = async () => {
  try {
    // Check for external auth token first (embed mode)
    if (window.EXTERNAL_AUTH_TOKEN) {
      return window.EXTERNAL_AUTH_TOKEN;
    }

    // Fall back to Firebase auth (standalone mode)
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Check if this is a custom user object with a token property (embed mode)
    if (currentUser.token) {
      return currentUser.token;
    }

    // Check if getIdToken method exists (Firebase User)
    if (typeof currentUser.getIdToken === 'function') {
      return await currentUser.getIdToken();
    }

    throw new Error('No authentication token available');
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
};

/**
 * Make an authenticated API request
 *
 * @param {string} endpoint - API endpoint path (e.g., '/api/v1/agents')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} API response data
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const baseUrl = getAgentBuilderUrl();
    const url = `${baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    console.log(`[API Request] ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, config);

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.code = errorData.error?.code;
      error.details = errorData.error?.details;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    console.log(`[API Response] ${options.method || 'GET'} ${endpoint} - Success`);
    return data;

  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
    throw error;
  }
};

/**
 * API Client for Agent Builder AI Service
 */
export const agentBuilderApi = {
  // ============================================================================
  // API KEY MANAGEMENT
  // ============================================================================

  /**
   * Create a new API key for an agent
   */
  createApiKey: async (agentId, keyData) => {
    return apiRequest(`/api/v1/agents/${agentId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(keyData)
    });
  },

  /**
   * List all API keys for an agent
   */
  listApiKeys: async (agentId, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/v1/agents/${agentId}/api-keys${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Update an API key
   */
  updateApiKey: async (agentId, keyId, updates) => {
    return apiRequest(`/api/v1/agents/${agentId}/api-keys/${keyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Revoke (delete) an API key
   */
  revokeApiKey: async (agentId, keyId) => {
    return apiRequest(`/api/v1/agents/${agentId}/api-keys/${keyId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Regenerate an API key
   */
  regenerateApiKey: async (agentId, keyId) => {
    return apiRequest(`/api/v1/agents/${agentId}/api-keys/${keyId}/regenerate`, {
      method: 'POST'
    });
  },

  // ============================================================================
  // AGENT MANAGEMENT
  // ============================================================================

  /**
   * Update agent metadata
   */
  updateAgent: async (agentId, updates) => {
    return apiRequest(`/api/v1/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Update agent lifecycle state (archive, delete, etc.)
   */
  updateAgentLifecycle: async (agentId, state, reason = null) => {
    return apiRequest(`/api/v1/agents/${agentId}/lifecycle`, {
      method: 'PUT',
      body: JSON.stringify({ state, reason })
    });
  },

  /**
   * Restore an archived or deleted agent
   */
  restoreAgent: async (agentId) => {
    return apiRequest(`/api/v1/agents/${agentId}/restore`, {
      method: 'PUT'
    });
  },

  /**
   * Update agent team sharing configuration
   */
  updateAgentSharing: async (agentId, sharingConfig) => {
    return apiRequest(`/api/v1/agents/${agentId}/sharing`, {
      method: 'PUT',
      body: JSON.stringify(sharingConfig)
    });
  },

  /**
   * Enable a tool for an agent
   */
  enableAgentTool: async (agentId, toolId) => {
    return apiRequest(`/api/v1/agents/${agentId}/tools/${toolId}/enable`, {
      method: 'POST'
    });
  },

  /**
   * Disable a tool for an agent
   */
  disableAgentTool: async (agentId, toolId) => {
    return apiRequest(`/api/v1/agents/${agentId}/tools/${toolId}`, {
      method: 'DELETE'
    });
  },

  // ============================================================================
  // PROJECT MANAGEMENT
  // ============================================================================

  /**
   * Create a new project
   */
  createProject: async (projectData) => {
    return apiRequest('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },

  /**
   * Update project metadata
   */
  updateProject: async (projectId, updates) => {
    return apiRequest(`/api/v1/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Delete a project
   */
  deleteProject: async (projectId, force = false) => {
    return apiRequest(`/api/v1/projects/${projectId}?force=${force}`, {
      method: 'DELETE'
    });
  },

  /**
   * Add a member to a project
   */
  addProjectMember: async (projectId, memberData) => {
    return apiRequest(`/api/v1/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  },

  /**
   * Remove a member from a project
   */
  removeProjectMember: async (projectId, userId) => {
    return apiRequest(`/api/v1/projects/${projectId}/members/${userId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Assign an agent to a project
   */
  assignAgentToProject: async (projectId, agentId) => {
    return apiRequest(`/api/v1/projects/${projectId}/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify({ agent_id: agentId, project_id: projectId })
    });
  },

  /**
   * Remove an agent from a project
   */
  removeAgentFromProject: async (projectId, agentId) => {
    return apiRequest(`/api/v1/projects/${projectId}/agents/${agentId}`, {
      method: 'DELETE'
    });
  },

  // ============================================================================
  // MCP CONFIGURATION MANAGEMENT
  // ============================================================================

  /**
   * Save MCP configuration
   */
  saveMcpConfiguration: async (agentId, configData) => {
    return apiRequest(`/api/agents/${agentId}/mcp/configurations`, {
      method: 'POST',
      body: JSON.stringify(configData)
    });
  },

  /**
   * Toggle MCP configuration on/off
   */
  toggleMcpConfiguration: async (agentId, configId, enabled) => {
    return apiRequest(`/api/agents/${agentId}/mcp/configurations/${configId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled })
    });
  },

  /**
   * Save API tool configuration
   */
  saveMcpTool: async (agentId, toolData) => {
    return apiRequest(`/api/agents/${agentId}/mcp/tools`, {
      method: 'POST',
      body: JSON.stringify(toolData)
    });
  },

  /**
   * Delete an API tool
   */
  deleteMcpTool: async (agentId, toolId) => {
    return apiRequest(`/api/agents/${agentId}/mcp/tools/${toolId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Save private MCP server
   */
  savePrivateMcpServer: async (agentId, serverData) => {
    return apiRequest(`/api/agents/${agentId}/mcp/servers/private`, {
      method: 'POST',
      body: JSON.stringify(serverData)
    });
  },

  /**
   * Delete private MCP server
   */
  deletePrivateMcpServer: async (agentId, serverId) => {
    return apiRequest(`/api/agents/${agentId}/mcp/servers/private/${serverId}`, {
      method: 'DELETE'
    });
  },

  // ============================================================================
  // ORGANIZATION MANAGEMENT
  // ============================================================================

  /**
   * Create a new organization
   */
  createOrganization: async (orgData) => {
    return apiRequest('/api/v1/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData)
    });
  },

  /**
   * Update organization metadata
   */
  updateOrganization: async (orgId, updates) => {
    return apiRequest(`/api/v1/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Delete an organization
   */
  deleteOrganization: async (orgId) => {
    return apiRequest(`/api/v1/organizations/${orgId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Add a member to an organization
   */
  addOrganizationMember: async (orgId, memberData) => {
    return apiRequest(`/api/v1/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  },

  /**
   * Remove a member from an organization
   */
  removeOrganizationMember: async (orgId, userId) => {
    return apiRequest(`/api/v1/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE'
    });
  },

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Update user profile
   */
  updateUserProfile: async (userId, profileData) => {
    return apiRequest(`/api/v1/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  /**
   * Update user settings
   */
  updateUserSettings: async (userId, settings) => {
    return apiRequest(`/api/v1/users/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Upload a document to agent's document library
   */
  uploadDocument: async (agentId, file, metadata, onProgress = null) => {
    try {
      const token = await getAuthToken();
      const baseUrl = getAgentBuilderUrl();
      const url = `${baseUrl}/api/agents/${agentId}/documents`;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      if (metadata.name) formData.append('name', metadata.name);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.tags && metadata.tags.length > 0) {
        formData.append('tags', metadata.tags.join(','));
      }
      if (metadata.keywords && metadata.keywords.length > 0) {
        formData.append('keywords', metadata.keywords.join(','));
      }

      console.log(`[API Request] POST /api/agents/${agentId}/documents`);

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }

        // Success handler
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log(`[API Response] POST /api/agents/${agentId}/documents - Success`);
              resolve(data);
            } catch (e) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.detail || `HTTP ${xhr.status}: ${xhr.statusText}`));
            } catch (e) {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });

        // Error handler
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Setup request
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // Send request
        xhr.send(formData);
      });

    } catch (error) {
      console.error('[API Error] Document upload:', error);
      throw error;
    }
  },

  /**
   * List all documents for an agent
   */
  listDocuments: async (agentId, filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.format) queryParams.append('format', filters.format);
    if (filters.tag) queryParams.append('tag', filters.tag);

    const query = queryParams.toString();
    const endpoint = `/api/agents/${agentId}/documents${query ? `?${query}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Get document statistics
   */
  getDocumentStats: async (agentId) => {
    return apiRequest(`/api/agents/${agentId}/documents/stats`);
  },

  /**
   * Get a single document by ID
   */
  getDocument: async (agentId, documentId) => {
    return apiRequest(`/api/agents/${agentId}/documents/${documentId}`);
  },

  /**
   * Update document metadata
   */
  updateDocument: async (agentId, documentId, updates) => {
    return apiRequest(`/api/agents/${agentId}/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Delete a document
   */
  deleteDocument: async (agentId, documentId) => {
    return apiRequest(`/api/agents/${agentId}/documents/${documentId}`, {
      method: 'DELETE'
    });
  }
};

export default agentBuilderApi;
