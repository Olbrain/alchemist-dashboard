/**
 * MCP Deployment Service
 *
 * Service layer for MCP deployment operations.
 * Uses backend API for all data operations in embed mode.
 */
import { agentBuilderApi as apiConfigAxios } from '../config/apiConfig';

/**
 * Get MCP service info from agent document via backend API
 *
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Service info with URL, status, and timestamp
 */
export const getMcpServiceInfo = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get MCP service status
    const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/status`);

    // Backend returns { status, mcp_service_url, mcp_service_status, mcp_service_updated_at }
    const data = response.data;

    return {
      serviceUrl: data.mcp_service_url || null,
      updatedAt: data.mcp_service_updated_at || null,
      status: data.mcp_service_status || null,
      isDeployed: Boolean(data.mcp_service_url)
    };
  } catch (error) {
    console.error('Error getting MCP service info:', error);
    throw new Error(`Failed to get MCP service info: ${error.message}`);
  }
};

/**
 * Get all enabled MCP tools for agent via backend API
 *
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of enabled MCP tool configurations
 */
export const getEnabledMcpTools = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get MCP configurations
    const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/configurations`);

    // Backend returns { status: "success", count: n, data: [...] }
    const configsArray = response.data.data || [];

    // Filter for enabled tools only and map to expected format
    const enabledTools = configsArray
      .filter((config) => config.enabled === true)
      .map((config) => ({
        id: config.id,
        serverId: config.server_id || config.tool_id || config.id.replace('mcp_', ''),
        configuration: config.configuration || config.config || {},
        enabled: config.enabled,
        configured: config.configured || false,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }));

    return enabledTools;
  } catch (error) {
    console.error('Error getting enabled MCP tools:', error);
    throw new Error(`Failed to get enabled MCP tools: ${error.message}`);
  }
};

/**
 * Get MCP server details from public_mcp_servers collection via backend API
 *
 * @param {string} serverId - Server ID
 * @returns {Promise<Object|null>} Server details or null if not found
 */
export const getMcpServerDetails = async (serverId) => {
  try {
    if (!serverId) {
      console.warn('Server ID is required');
      return null;
    }

    // Use backend API to get public MCP servers
    const response = await apiConfigAxios.get('/api/public-mcp-servers');

    // Backend returns { status: "success", count: n, data: [...] }
    const serversArray = response.data.data || [];

    // Find the server by ID
    const serverData = serversArray.find((server) => server.id === serverId);

    if (!serverData) {
      console.warn(`MCP server not found: ${serverId}`);
      return null;
    }

    return {
      id: serverData.id,
      name: serverData.name || serverId,
      description: serverData.description || '',
      category: serverData.category || 'general',
      tags: serverData.tags || [],
      installation: serverData.installation || {},
      credentialMapping: serverData.credential_mapping || {},
      syncedFrom: serverData.synced_from,
      syncedAt: serverData.synced_at,
      estimated_tools_count: serverData.estimated_tools_count,
      tools: serverData.tools || [],
      version: serverData.version
    };
  } catch (error) {
    console.error(`Error getting MCP server details for ${serverId}:`, error);
    return null;
  }
};

/**
 * Get enabled MCP tools with server details
 * Combines tool configurations with server metadata
 *
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of enabled tools with server details
 */
export const getEnabledMcpToolsWithDetails = async (agentId) => {
  try {
    // Get enabled tools
    const enabledTools = await getEnabledMcpTools(agentId);

    // Fetch server details for each tool in parallel
    const toolsWithDetails = await Promise.all(
      enabledTools.map(async (tool) => {
        const serverDetails = await getMcpServerDetails(tool.serverId);
        return {
          ...tool,
          serverName: serverDetails?.name || tool.serverId,
          serverDescription: serverDetails?.description || '',
          serverCategory: serverDetails?.category || 'general',
          serverTags: serverDetails?.tags || [],
          credentialMapping: serverDetails?.credentialMapping || {}
        };
      })
    );

    return toolsWithDetails;
  } catch (error) {
    console.error('Error getting enabled MCP tools with details:', error);
    throw error;
  }
};

/**
 * Get enabled MCP tools with full details including tools array
 * Fetches complete server information including available tools
 *
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of enabled tools with full server details including tools
 */
export const getEnabledMcpToolsWithFullDetails = async (agentId) => {
  try {
    // Get enabled tools
    const enabledTools = await getEnabledMcpTools(agentId);

    // Fetch server details for each tool in parallel
    const toolsWithFullDetails = await Promise.all(
      enabledTools.map(async (tool) => {
        const serverDetails = await getMcpServerDetails(tool.serverId);
        return {
          ...tool,
          serverName: serverDetails?.name || tool.serverId,
          serverDescription: serverDetails?.description || '',
          serverCategory: serverDetails?.category || 'general',
          serverTags: serverDetails?.tags || [],
          credentialMapping: serverDetails?.credentialMapping || {},
          estimatedToolsCount: serverDetails?.estimated_tools_count || 0,
          tools: serverDetails?.tools || [],
          serverVersion: serverDetails?.version || 'unknown'
        };
      })
    );

    return toolsWithFullDetails;
  } catch (error) {
    console.error('Error getting enabled MCP tools with full details:', error);
    throw error;
  }
};

/**
 * Check if tool configuration is complete
 *
 * @param {Object} tool - Tool object with configuration and credential mapping
 * @returns {Object} Status object with isComplete flag and missing credentials
 */
export const checkToolConfigurationStatus = (tool) => {
  if (!tool.credentialMapping || Object.keys(tool.credentialMapping).length === 0) {
    // No credentials required
    return {
      isComplete: true,
      configuredCount: 0,
      requiredCount: 0,
      missingCredentials: []
    };
  }

  const configuration = tool.configuration || {};
  const requiredCredentials = Object.keys(tool.credentialMapping);
  const configuredCredentials = Object.keys(configuration).filter(key =>
    configuration[key] !== undefined &&
    configuration[key] !== null &&
    configuration[key] !== ''
  );

  const missingCredentials = requiredCredentials.filter(
    key => !configuredCredentials.includes(key)
  );

  return {
    isComplete: missingCredentials.length === 0,
    configuredCount: configuredCredentials.length,
    requiredCount: requiredCredentials.length,
    missingCredentials
  };
};

/**
 * Deploy MCP service via backend API
 *
 * Creates a deployment record and triggers the MCP deployment job.
 * The backend handles Firestore document creation and Cloud Run job execution.
 *
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Deployment status with deployment_id
 */
export const deployMcpService = async (agentId) => {
  try {
    // Call backend API to deploy MCP service
    const { agentBuilderApi } = await import('../config/apiConfig');
    const response = await agentBuilderApi.post(`/api/agents/${agentId}/mcp/deploy`);
    const responseData = response.data;

    console.log('✅ Backend API MCP deployment response:', responseData);

    // Return response in format expected by frontend
    return {
      deployment_id: responseData.deployment_id,
      status: responseData.status || 'queued',
      message: responseData.message || 'MCP deployment initiated successfully',
      agent_id: responseData.agent_id
    };
  } catch (error) {
    console.error('Error deploying MCP service via backend API:', error);

    // Extract error message from axios error response
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Subscribe to MCP service status changes
 * Uses polling approach instead of Firestore real-time listener
 *
 * @param {string} agentId - Agent ID
 * @param {Function} onUpdate - Callback for updates
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMcpServiceStatus = (agentId, onUpdate, onError) => {
  console.log(`Setting up polling for MCP service status: ${agentId}`);

  // Polling function to fetch MCP service status
  const pollStatus = async () => {
    try {
      const serviceInfo = await getMcpServiceInfo(agentId);
      onUpdate(serviceInfo);
    } catch (error) {
      console.error('Error polling MCP service status:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Initial fetch
  pollStatus();

  // Poll every 5 seconds
  const intervalId = setInterval(pollStatus, 5000);

  // Return unsubscribe function
  return () => {
    console.log('Unsubscribing from MCP service status polling');
    clearInterval(intervalId);
  };
};

/**
 * Subscribe to MCP deployment history
 * Uses polling approach instead of Firestore real-time listener
 *
 * @param {string} agentId - Agent ID
 * @param {Function} onUpdate - Callback for updates with array of deployments
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMcpDeployments = (agentId, onUpdate, onError) => {
  console.log(`Setting up polling for MCP deployments: ${agentId}`);

  // Polling function to fetch deployment history
  const pollDeployments = async () => {
    try {
      if (!agentId) {
        console.warn('Agent ID is required for deployment polling');
        return;
      }

      // Use backend API to get deployment history
      const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/deployments`, {
        params: {
          limit: 10,
          offset: 0
        }
      });

      // Backend returns { success, agent_id, deployments: [...], pagination: {...} }
      const deployments = response.data.deployments || [];
      onUpdate(deployments);
    } catch (error) {
      console.error('Error polling MCP deployments:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Initial fetch
  pollDeployments();

  // Poll every 10 seconds (less frequent since this is historical data)
  const intervalId = setInterval(pollDeployments, 10000);

  // Return unsubscribe function
  return () => {
    console.log('Unsubscribing from MCP deployments polling');
    clearInterval(intervalId);
  };
};

/**
 * Format timestamp for display
 *
 * @param {any} timestamp - Firestore timestamp or Date
 * @returns {string} Formatted time ago string
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Never';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};
