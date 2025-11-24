/**
 * MCP Service
 *
 * Handles all MCP server related operations:
 * - Configuration management
 * - Testing MCP server connections
 * - All CRUD operations via backend API (no direct Firestore access in embed mode)
 */

// import { db } from '../../utils/firebase'; // REMOVED: Firebase/Firestore
// import { doc, getDoc, getDocs, deleteDoc, collection } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
import { getAuthToken } from '../auth/authService';
import { AGENT_ENGINE_URL, TOOL_MANAGER_URL } from '../config/apiConfig';
import { agentBuilderApi } from '../api/agentBuilderApiClient';
import axios from 'axios';
import { agentBuilderApi as apiConfigAxios } from '../config/apiConfig';


/**
 * Get all MCP configurations for an agent
 * Uses backend API instead of Firestore
 */
export const getAgentMcpConfigurations = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get MCP configurations
    const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/configurations`);

    // Backend returns { status: "success", count: n, data: [...] }
    const configsArray = response.data.data || [];

    // Convert array to object keyed by server ID (without 'mcp_' prefix)
    const configs = {};
    configsArray.forEach((config) => {
      const serverId = config.id.replace('mcp_', '');
      configs[serverId] = config;
    });

    return configs;
  } catch (error) {
    console.error('Error getting MCP configurations:', error);
    throw new Error(`Failed to get MCP configurations: ${error.message}`);
  }
};

/**
 * Save MCP configuration via backend API
 */
export const saveMcpConfiguration = async (agentId, serverId, configData, isPrivate = false) => {
  try {
    const response = await agentBuilderApi.saveMcpConfiguration(agentId, {
      server_name: serverId,
      config: configData,
      enabled: true,
      is_private: isPrivate
    });

    return response;
  } catch (error) {
    console.error('Error saving MCP configuration:', error);
    throw error;
  }
};

/**
 * Get a specific MCP configuration
 * Uses backend API instead of Firestore
 */
export const getMcpConfiguration = async (agentId, serverId) => {
  try {
    if (!agentId || !serverId) {
      throw new Error('Agent ID and Server ID are required');
    }

    const configId = `mcp_${serverId}`;

    // Use backend API to get MCP configuration
    const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/configurations/${configId}`);

    // Backend returns { status: "success", data: {...} }
    return response.data.data;
  } catch (error) {
    // If 404, return null (not found)
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Error getting MCP configuration:', error);
    throw new Error(`Failed to get MCP configuration: ${error.message}`);
  }
};

/**
 * Delete MCP configuration via backend API
 */
export const deleteMcpConfiguration = async (agentId, serverId) => {
  try {
    if (!agentId || !serverId) {
      throw new Error('Agent ID and Server ID are required');
    }

    const configId = `mcp_${serverId}`;

    // Use agentBuilderApi (fetch-based) for delete operation
    await agentBuilderApi.deleteMcpConfiguration(agentId, configId);

    console.log(`Deleted MCP configuration: ${configId}`);
  } catch (error) {
    console.error('Error deleting MCP configuration:', error);
    throw new Error(`Failed to delete MCP configuration: ${error.message}`);
  }
};

/**
 * Test MCP server configuration
 * Calls backend to start MCP server, connect client, and test tools
 */
export const testMcpConfiguration = async (agentId, serverId, configData, serverDefinition) => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${AGENT_ENGINE_URL}/api/agents/${agentId}/test-mcp-config`,
      {
        server_id: serverId,
        configuration: configData,
        server_definition: {
          installation: serverDefinition.installation,
          name: serverDefinition.name
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error testing MCP configuration:', error);

    if (error.response) {
      // Backend returned an error
      throw new Error(error.response.data.error || 'Failed to test MCP configuration');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please try again.');
    } else {
      // Error setting up request
      throw new Error(error.message || 'Failed to test MCP configuration');
    }
  }
};

/**
 * Toggle MCP configuration enabled/disabled via backend API
 */
export const toggleMcpConfiguration = async (agentId, configId, enabled) => {
  try {
    const response = await agentBuilderApi.toggleMcpConfiguration(agentId, configId, enabled);
    return response;
  } catch (error) {
    console.error('Error toggling MCP configuration:', error);
    throw error;
  }
};

/**
 * Save an API tool for an agent via backend API
 */
export const saveApiTool = async (agentId, toolData) => {
  try {
    const response = await agentBuilderApi.saveMcpTool(agentId, {
      name: toolData.name,
      path: toolData.path || toolData.endpoint,
      method: toolData.method || 'GET',
      authentication: toolData.authentication,
      credentials: toolData.credentials,
      parameters: toolData.parameters || [],
      description: toolData.description
    });

    return response;
  } catch (error) {
    console.error('Error saving API tool:', error);
    throw error;
  }
};

/**
 * Save a private MCP server definition for an agent via backend API
 */
export const savePrivateMcpServer = async (agentId, serverData) => {
  try {
    const response = await agentBuilderApi.savePrivateMcpServer(agentId, {
      server_name: serverData.name || serverData.server_name,
      url: serverData.url,
      authentication: serverData.authentication,
      description: serverData.description,
      enabled: serverData.enabled !== false,
      is_private: serverData.is_private !== false
    });

    return response;
  } catch (error) {
    console.error('Error saving private MCP server:', error);
    throw error;
  }
};

/**
 * Get all API tools for an agent
 * Uses backend API instead of Firestore
 */
export const getApiTools = async (agentId) => {
  try {
    console.log('getApiTools called with agentId:', agentId);

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get API tools
    const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/tools`);

    // Backend returns { status: "success", count: n, data: [...] }
    const tools = response.data.data || [];

    console.log('getApiTools returning:', tools);
    return tools;
  } catch (error) {
    console.error('ERROR in getApiTools:', {
      code: error.code,
      message: error.message,
      agentId,
      fullError: error
    });
    throw new Error(`Failed to get API tools: ${error.message}`);
  }
};

/**
 * Get all private MCP servers for an agent
 * Uses backend API instead of Firestore
 */
export const getPrivateMcpServers = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get private MCP servers
    const response = await apiConfigAxios.get(`/api/agents/${agentId}/mcp/servers/private`);

    // Backend returns { status: "success", count: n, data: [...] }
    const servers = response.data.data || [];

    // Filter out API tools - they should be in api_tools collection
    const filteredServers = servers.filter(server => server.type !== 'api_tool');

    return filteredServers;
  } catch (error) {
    console.error('Error getting private MCP servers:', error);
    throw new Error(`Failed to get private MCP servers: ${error.message}`);
  }
};

/**
 * Delete an API tool via backend API
 */
export const deleteApiTool = async (agentId, toolId) => {
  try {
    const response = await agentBuilderApi.deleteMcpTool(agentId, toolId);
    return response;
  } catch (error) {
    console.error('Error deleting API tool:', error);
    throw error;
  }
};

/**
 * Delete a private MCP server definition via backend API
 */
export const deletePrivateMcpServer = async (agentId, serverId) => {
  try {
    const response = await agentBuilderApi.deletePrivateMcpServer(agentId, serverId);
    return response;
  } catch (error) {
    console.error('Error deleting private MCP server:', error);
    throw error;
  }
};

/**
 * Test an already-enabled MCP server
 * Convenience function that loads the server definition and config, then tests
 */
export const testEnabledMcpServer = async (agentId, serverId, serverDefinition) => {
  try {
    // Get the configuration
    const config = await getMcpConfiguration(agentId, serverId);

    if (!config || !config.configuration) {
      throw new Error('Server configuration not found');
    }

    // Test using the existing test function
    return await testMcpConfiguration(
      agentId,
      serverId,
      config.configuration,
      serverDefinition
    );
  } catch (error) {
    console.error('Error testing enabled MCP server:', error);
    throw error;
  }
};

/**
 * Test API endpoints with credentials
 * Used by API-to-MCP wizard to validate endpoints before creating MCP server
 */
export const testApiEndpoints = async (agentId, testConfig) => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${AGENT_ENGINE_URL}/api/agents/${agentId}/test-api-endpoints`,
      testConfig,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for testing multiple endpoints
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error testing API endpoints:', error);

    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to test API endpoints');
    } else if (error.request) {
      throw new Error('No response from server. Please try again.');
    } else {
      throw new Error(error.message || 'Failed to test API endpoints');
    }
  }
};

/**
 * Get available MCP servers from backend API
 * Merged with private servers for the agent
 * Uses backend API instead of Firestore
 */
export const getAvailableMcpServers = async (agentId = null) => {
  try {
    // Fetch public MCP servers from backend API
    const publicResponse = await apiConfigAxios.get('/api/public-mcp-servers');
    const publicServers = publicResponse.data.data || [];

    // If agentId provided, merge with private servers
    if (agentId) {
      try {
        const privateServers = await getPrivateMcpServers(agentId);
        // Merge arrays, private servers come after public ones
        return [...publicServers, ...privateServers];
      } catch (privateError) {
        console.error('Error loading private servers:', privateError);
        // Return just public servers if private servers fail to load
        return publicServers;
      }
    }

    return publicServers;
  } catch (error) {
    console.error('Error fetching MCP servers:', error);

    // If we have an agentId, try to return just private servers
    if (agentId) {
      try {
        const privateServers = await getPrivateMcpServers(agentId);
        return privateServers;
      } catch (privateError) {
        // Both failed, throw error
      }
    }

    // Return empty array on error - UI will handle gracefully
    throw new Error(error.message || 'Failed to fetch MCP servers');
  }
};

/**
 * Generate private MCP server config from API tools
 */
export const generatePrivateMcpConfig = async (agentId) => {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${TOOL_MANAGER_URL}/api/v1/agents/${agentId}/private-mcp-config/generate`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error generating private MCP config:', error);
    throw new Error(error.response?.data?.detail || 'Failed to generate MCP configuration');
  }
};

const McpService = {
  getAgentMcpConfigurations,
  saveMcpConfiguration,
  getMcpConfiguration,
  deleteMcpConfiguration,
  testMcpConfiguration,
  toggleMcpConfiguration,
  getAvailableMcpServers,
  savePrivateMcpServer,
  getPrivateMcpServers,
  deletePrivateMcpServer,
  testEnabledMcpServer,
  testApiEndpoints,
  generatePrivateMcpConfig
};

export default McpService;
