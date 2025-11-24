/**
 * Tool Manager Service
 *
 * Service for comprehensive tool management via the tool-manager API
 * Uses toolManagerApi axios instance with automatic auth token management
 */
import { toolManagerApi } from '../config/apiConfig';

/**
 * Get all tools for the current user
 */
export const getTools = async (agentId = null, visibility = null) => {
  try {
    const params = {};
    if (agentId) params.agent_id = agentId;
    if (visibility) params.visibility = visibility;

    const response = await toolManagerApi.get('/api/v1/tools', {
      params,
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get tools:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch tools');
  }
};

/**
 * Get a specific tool by ID
 */
export const getTool = async (toolId) => {
  try {
    const response = await toolManagerApi.get(`/api/v1/tools/${toolId}`, {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to get tool ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch tool');
  }
};

/**
 * Create a new tool
 */
export const createTool = async (toolData) => {
  try {
    const response = await toolManagerApi.post('/api/v1/tools', toolData, {
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to create tool:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create tool');
  }
};

/**
 * Update an existing tool
 */
export const updateTool = async (toolId, toolData) => {
  try {
    const response = await toolManagerApi.put(`/api/v1/tools/${toolId}`, toolData, {
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to update tool ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to update tool');
  }
};

/**
 * Delete a tool
 */
export const deleteTool = async (toolId) => {
  try {
    await toolManagerApi.delete(`/api/v1/tools/${toolId}`, {
      timeout: 10000
    });

    return true;
  } catch (error) {
    console.error(`Failed to delete tool ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to delete tool');
  }
};

/**
 * Get public tools available for adding to agents
 */
export const getPublicTools = async () => {
  try {
    const response = await toolManagerApi.get('/api/v1/public-tools', {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get public tools:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch public tools');
  }
};

/**
 * Add a public tool to an agent
 */
export const addToolToAgent = async (agentId, toolId) => {
  try {
    await toolManagerApi.post(`/api/v1/agents/${agentId}/tools/${toolId}`, null, {
      timeout: 10000
    });

    return true;
  } catch (error) {
    console.error(`Failed to add tool ${toolId} to agent ${agentId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to add tool to agent');
  }
};

/**
 * Remove a tool from an agent
 */
export const removeToolFromAgent = async (agentId, toolId) => {
  try {
    await toolManagerApi.delete(`/api/v1/agents/${agentId}/tools/${toolId}`, {
      timeout: 10000
    });

    return true;
  } catch (error) {
    console.error(`Failed to remove tool ${toolId} from agent ${agentId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to remove tool from agent');
  }
};

/**
 * Import tools from OpenAPI specification
 */
export const importFromOpenAPI = async (openApiSpec, agentId, visibility = 'private') => {
  try {
    const response = await toolManagerApi.post('/api/v1/tools/import/openapi', {
      openapi_spec: openApiSpec,
      agent_id: agentId,
      visibility: visibility
    }, {
      timeout: 30000 // OpenAPI import can take longer
    });

    return response.data;
  } catch (error) {
    console.error('Failed to import tools from OpenAPI:', error);
    throw new Error(error.response?.data?.detail || 'Failed to import tools from OpenAPI');
  }
};

/**
 * Test a tool
 */
export const testTool = async (toolId, parameters = {}) => {
  try {
    const response = await toolManagerApi.post(`/api/v1/tools/${toolId}/test`, {
      parameters,
      timeout: 30,
      follow_redirects: true
    }, {
      timeout: 35000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to test tool ${toolId}:`, error);

    if (error.response) {
      return {
        success: false,
        status_code: error.response.status,
        error: error.response.data?.detail || error.response.statusText,
        response_time: 0,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      status_code: 500,
      error: error.message || 'Test failed',
      response_time: 0,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test a tool configuration directly without creating it
 */
export const testToolConfiguration = async (toolConfig, parameters = {}) => {
  try {
    const response = await toolManagerApi.post('/api/v1/test-configuration', {
      config: toolConfig,
      parameters: parameters
    }, {
      timeout: 35000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to test tool configuration:', error);

    if (error.response) {
      return {
        success: false,
        status_code: error.response.status,
        error: error.response.data?.detail || error.response.statusText,
        response_time: 0,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      status_code: 500,
      error: error.message || 'Configuration test failed',
      response_time: 0,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Parse OpenAPI specification and return tool configurations
 */
export const parseOpenAPISpec = async (openApiSpec, agentId, visibility = 'private') => {
  try {
    const response = await toolManagerApi.post('/api/v1/parse-openapi', {
      openapi_spec: openApiSpec,
      agent_id: agentId,
      visibility: visibility
    }, {
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to parse OpenAPI specification:', error);
    throw new Error(error.response?.data?.detail || 'Failed to parse OpenAPI specification');
  }
};

/**
 * Health check for the tool manager service
 */
export const healthCheck = async () => {
  try {
    const response = await toolManagerApi.get('/health', {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    console.error('Tool Manager health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// ============================================================================
// UNIFIED TOOL API METHODS
// ============================================================================

/**
 * Get all unified tools for the current user
 */
export const getUnifiedTools = async (agentId = null, visibility = null) => {
  try {
    const params = {};
    if (agentId) params.agent_id = agentId;
    if (visibility) params.visibility = visibility;

    const response = await toolManagerApi.get('/api/v1/unified-tools', {
      params,
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get unified tools:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch unified tools');
  }
};

/**
 * Get a specific unified tool by ID
 */
export const getUnifiedTool = async (toolId) => {
  try {
    const response = await toolManagerApi.get(`/api/v1/unified-tools/${toolId}`, {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to get unified tool ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch unified tool');
  }
};

/**
 * Create a new unified tool
 */
export const createUnifiedTool = async (toolData) => {
  try {
    const response = await toolManagerApi.post('/api/v1/unified-tools', toolData, {
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to create unified tool:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create unified tool');
  }
};

/**
 * Update an existing unified tool
 */
export const updateUnifiedTool = async (toolId, toolData) => {
  try {
    const response = await toolManagerApi.put(`/api/v1/unified-tools/${toolId}`, toolData, {
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to update unified tool ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to update unified tool');
  }
};

/**
 * Delete a unified tool
 */
export const deleteUnifiedTool = async (toolId) => {
  try {
    await toolManagerApi.delete(`/api/v1/unified-tools/${toolId}`, {
      timeout: 10000
    });

    return true;
  } catch (error) {
    console.error(`Failed to delete unified tool ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to delete unified tool');
  }
};

/**
 * Test a unified tool
 */
export const testUnifiedTool = async (toolId, testRequest) => {
  try {
    const response = await toolManagerApi.post(`/api/v1/unified-tools/${toolId}/test`, testRequest, {
      timeout: 35000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to test unified tool ${toolId}:`, error);

    if (error.response) {
      return {
        success: false,
        status_code: error.response.status,
        error: error.response.data?.detail || error.response.statusText,
        response_time: 0,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      status_code: 500,
      error: error.message || 'Test failed',
      response_time: 0,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test a unified tool configuration directly without creating it
 */
export const testUnifiedToolConfiguration = async (toolConfig, testRequest) => {
  try {
    const response = await toolManagerApi.post('/api/v1/test-unified-configuration', {
      config: toolConfig,
      test_request: testRequest
    }, {
      timeout: 35000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to test unified tool configuration:', error);

    if (error.response) {
      return {
        success: false,
        status_code: error.response.status,
        error: error.response.data?.detail || error.response.statusText,
        response_time: 0,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      status_code: 500,
      error: error.message || 'Configuration test failed',
      response_time: 0,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get URL preview for a unified tool
 */
export const getUnifiedToolPreview = async (toolId) => {
  try {
    const response = await toolManagerApi.get(`/api/v1/unified-tools/${toolId}/preview`, {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to get unified tool preview ${toolId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to get tool preview');
  }
};

/**
 * Add a public unified tool to an agent
 */
export const addUnifiedToolToAgent = async (agentId, toolId) => {
  try {
    await toolManagerApi.post(`/api/v1/agents/${agentId}/unified-tools/${toolId}`, null, {
      timeout: 10000
    });

    return true;
  } catch (error) {
    console.error(`Failed to add unified tool ${toolId} to agent ${agentId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to add unified tool to agent');
  }
};

/**
 * Remove a unified tool from an agent
 */
export const removeUnifiedToolFromAgent = async (agentId, toolId) => {
  try {
    await toolManagerApi.delete(`/api/v1/agents/${agentId}/unified-tools/${toolId}`, {
      timeout: 10000
    });

    return true;
  } catch (error) {
    console.error(`Failed to remove unified tool ${toolId} from agent ${agentId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to remove unified tool from agent');
  }
};

/**
 * Create a tool from manual entry
 * Simplified endpoint for creating tools from manually entered API details
 */
export const createToolFromManual = async (manualData) => {
  try {
    const response = await toolManagerApi.post('/api/v1/unified-tools/create-from-manual', manualData, {
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    console.error('Failed to create tool from manual entry:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create tool from manual entry');
  }
};

// Export all functions as default object for backward compatibility
const toolManagerServiceDefault = {
  // Legacy tool methods
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  getPublicTools,
  addToolToAgent,
  removeToolFromAgent,
  importFromOpenAPI,
  testTool,
  testToolConfiguration,
  parseOpenAPISpec,
  healthCheck,

  // Unified tool methods
  getUnifiedTools,
  getUnifiedTool,
  createUnifiedTool,
  updateUnifiedTool,
  deleteUnifiedTool,
  testUnifiedTool,
  testUnifiedToolConfiguration,
  getUnifiedToolPreview,
  addUnifiedToolToAgent,
  removeUnifiedToolFromAgent,
  createToolFromManual
};

export default toolManagerServiceDefault;
