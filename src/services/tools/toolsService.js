/**
 * Tools Service
 *
 * Service for managing tools with public/private visibility
 * All operations via backend API (no direct Firestore access in embed mode)
 */
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where,
//   orderBy
// } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
// import { db } from '../../utils/firebase'; // REMOVED: Firebase/Firestore
import { agentBuilderApi } from '../config/apiConfig';
import { getCurrentUser } from '../context';
import toolManagerService from './toolManagerService';

/**
 * Create a new tool (always private, associated with specific agent)
 */
export const createTool = async (toolConfig, agentId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to create tool
    const response = await agentBuilderApi.post('/api/tools', {
      name: toolConfig.name,
      description: toolConfig.description,
      tool_type: 'manual',
      endpoint_url: toolConfig.baseUrl ? `${toolConfig.baseUrl}${toolConfig.endpoint}` : null,
      http_method: toolConfig.method || 'GET',
      parameters: toolConfig.parameters || [],
      authentication: toolConfig.authentication,
      headers: {},
      request_body_template: toolConfig.requestBody,
      response_parser: toolConfig.responseFormat,
      category: toolConfig.category || 'general',
      tags: toolConfig.tags || [],
      is_public: false,
      organization_id: agentId, // Using agentId as org context
      created_by: currentUser.uid,
      metadata: {
        timeout: toolConfig.timeout,
        retries: toolConfig.retries
      }
    });

    console.log('Tool created via backend API:', response.data.tool_id);

    return response.data.tool_data;
  } catch (error) {
    console.error('Error creating tool:', error);
    throw error;
  }
};

/**
 * Create tool from OpenAPI specification (always private)
 */
export const createToolFromOpenAPI = async (openApiData, agentId) => {
  try {
    console.log('Creating tools from OpenAPI specification');

    // Use tool-manager to parse OpenAPI spec and return configurations
    const toolConfigurations = await toolManagerService.parseOpenAPISpec(openApiData, agentId);

    // Create tools via backend API using the returned configurations
    const createdTools = [];
    const currentUser = getCurrentUser();

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    for (const toolConfig of toolConfigurations) {
      // Use backend API to create OpenAPI tool
      const response = await agentBuilderApi.post('/api/tools/openapi', {
        openapi_spec: openApiData,
        endpoint_path: toolConfig.endpoint,
        organization_id: agentId,
        created_by: currentUser.uid
      });

      createdTools.push(response.data.tool_data);
    }

    return createdTools;
  } catch (error) {
    console.error('Error creating OpenAPI tools:', error);
    throw error;
  }
};

/**
 * Get all tools for a specific agent (private tools owned by the agent)
 * Uses backend API instead of Firestore
 */
export const getToolsForAgent = async (agentId) => {
  try {
    console.log('Getting tools for agent:', agentId);

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get agent's private tools
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/tools`);

    // Backend returns { status: "success", count: n, data: [...] }
    const tools = response.data.data || [];

    console.log(`Found ${tools.length} private tools for agent`);
    return tools;
  } catch (error) {
    console.error('Error getting tools for agent:', error);
    throw new Error(`Failed to get tools for agent: ${error.message}`);
  }
};

/**
 * Get all public tools available for use
 * Uses backend API instead of Firestore
 */
export const getPublicTools = async () => {
  try {
    console.log('Getting public tools');

    // Use backend API to get public tools
    const response = await agentBuilderApi.get('/api/tools/public');

    // Backend returns { status: "success", count: n, data: [...] }
    const publicTools = response.data.data || [];

    console.log('Found public tools:', publicTools);
    return publicTools;
  } catch (error) {
    console.error('Error getting public tools:', error);
    throw new Error(`Failed to get public tools: ${error.message}`);
  }
};

// addToolToAgent and removeToolFromAgent removed - no longer needed
// Public tools are reference-only and don't need to be "added" to agents

/**
 * Update an existing tool
 */
export const updateTool = async (toolId, updates) => {
  try {
    console.log('Updating tool:', { toolId, updates });

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to update tool
    // Backend handles permission checks and test status reset logic
    const response = await agentBuilderApi.put(`/api/tools/${toolId}`, updates);

    console.log('Successfully updated tool via backend API');
    return response.data.success;
  } catch (error) {
    console.error('Error updating tool:', error);
    throw error;
  }
};

/**
 * Delete a tool
 */
export const deleteTool = async (toolId) => {
  try {
    console.log('Deleting tool:', toolId);

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to delete tool
    // Backend handles permission checks
    const response = await agentBuilderApi.delete(`/api/tools/${toolId}`);

    console.log('Successfully deleted tool via backend API');
    return response.data.success;
  } catch (error) {
    console.error('Error deleting tool:', error);
    throw error;
  }
};

/**
 * Get tool by ID
 * Uses backend API instead of Firestore
 */
export const getTool = async (toolId) => {
  try {
    console.log('Getting tool:', toolId);

    if (!toolId) {
      throw new Error('Tool ID is required');
    }

    // Use backend API to get tool by ID
    const response = await agentBuilderApi.get(`/api/tools/${toolId}`);

    // Backend returns { status: "success", data: {...} }
    const tool = response.data.data;

    if (!tool) {
      throw new Error('Tool not found');
    }

    console.log('Found tool:', tool);
    return tool;
  } catch (error) {
    console.error('Error getting tool:', error);
    throw new Error(`Failed to get tool: ${error.message}`);
  }
};

/**
 * Get all tools with optional filtering
 * Uses backend API instead of Firestore
 */
export const getTools = async (options = {}) => {
  try {
    console.log('Getting tools with options:', options);

    // Build query parameters for backend API
    const params = {};
    if (options.visibility) params.visibility = options.visibility;
    if (options.agentId) params.agent_id = options.agentId;
    if (options.category) params.category = options.category;
    if (options.limit) params.limit = options.limit;
    if (options.offset) params.offset = options.offset;

    // Use backend API to get tools with filters
    const response = await agentBuilderApi.get('/api/tools', { params });

    // Backend returns { status: "success", count: n, data: [...] }
    const tools = response.data.data || [];

    console.log('Found tools:', tools);
    return tools;
  } catch (error) {
    console.error('Error getting tools:', error);
    throw new Error(`Failed to get tools: ${error.message}`);
  }
};

/**
 * Helper function to build URL from URL components
 */
const buildUrlFromComponents = (urlComponents) => {
  try {
    if (!urlComponents || !urlComponents.host) return '';
    
    const protocol = urlComponents.protocol || 'https';
    const host = urlComponents.host;
    const port = urlComponents.port;
    const basePath = urlComponents.base_path || '';
    const endpoint = urlComponents.endpoint || '/';
    
    let url = `${protocol}://${host}`;
    
    // Add port if not default
    if (port && port !== (protocol === 'https' ? 443 : 80)) {
      url += `:${port}`;
    }
    
    // Add base path
    if (basePath) {
      url += basePath.startsWith('/') ? basePath : `/${basePath}`;
    }
    
    // Add endpoint
    url += endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return url;
  } catch (error) {
    console.warn('Error building URL from components:', error);
    return '';
  }
};

/**
 * Test a tool using tool-manager
 */
export const testTool = async (toolId, parameters = {}) => {
  try {
    console.log('Testing tool:', { toolId, parameters });

    // Use tool-manager testing service directly with tool ID
    // This will load the tool from Firestore and update the test status
    const result = await toolManagerService.testTool(toolId, parameters);

    console.log('Tool test result:', result);
    return result;
  } catch (error) {
    console.error('Error testing tool:', error);
    throw error;
  }
};

/**
 * Create a public tool (admin only)
 * Simplified version with just name and description
 */
export const createPublicTool = async (name, description) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to create public tool
    const response = await agentBuilderApi.post('/api/tools', {
      name: name,
      description: description,
      tool_type: 'public_tool',
      is_public: true,
      organization_id: 'public', // Public tools are global
      created_by: currentUser.uid,
      parameters: [],
      tags: [],
      headers: {},
      metadata: {}
    });

    console.log('Public tool created via backend API:', response.data.tool_id);
    return response.data.tool_data;
  } catch (error) {
    console.error('Error creating public tool:', error);
    throw error;
  }
};

/**
 * Update a public tool (admin only)
 */
export const updatePublicTool = async (toolId, name, description) => {
  try {
    console.log('Updating public tool:', { toolId, name, description });

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to update public tool
    const response = await agentBuilderApi.put(`/api/tools/${toolId}`, {
      name: name,
      description: description
    });

    console.log('Successfully updated public tool via backend API');
    return response.data.success;
  } catch (error) {
    console.error('Error updating public tool:', error);
    throw error;
  }
};

/**
 * Delete a public tool (admin only)
 */
export const deletePublicTool = async (toolId) => {
  try {
    console.log('Deleting public tool:', toolId);

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to delete public tool
    const response = await agentBuilderApi.delete(`/api/tools/${toolId}`);

    console.log('Successfully deleted public tool via backend API');
    return response.data.success;
  } catch (error) {
    console.error('Error deleting public tool:', error);
    throw error;
  }
};

/**
 * Get all public tools (without usage tracking)
 * Uses backend API instead of Firestore
 */
export const getPublicToolsWithStats = async () => {
  try {
    console.log('Getting public tools');

    // Use backend API to get public tools
    const response = await agentBuilderApi.get('/api/tools/public');

    // Backend returns { status: "success", count: n, data: [...] }
    const publicTools = response.data.data || [];

    console.log('Found public tools:', publicTools);
    return publicTools;
  } catch (error) {
    console.error('Error getting public tools:', error);
    throw new Error(`Failed to get public tools: ${error.message}`);
  }
};

// Legacy function names for backward compatibility
export const loadToolsFromNewService = getToolsForAgent;
export const getAvailablePublicTools = getPublicTools;

// Export all functions as default object
const toolsServiceDefault = {
  createTool,
  createToolFromOpenAPI,
  getToolsForAgent,
  getPublicTools,
  // addToolToAgent and removeToolFromAgent removed
  updateTool,
  deleteTool,
  getTool,
  getTools,
  testTool,
  loadToolsFromNewService,
  getAvailablePublicTools,
  createPublicTool,
  updatePublicTool,
  deletePublicTool,
  getPublicToolsWithStats
};

export default toolsServiceDefault;