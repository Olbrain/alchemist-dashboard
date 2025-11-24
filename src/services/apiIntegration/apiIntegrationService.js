/**
 * API Integration Service
 * 
 * Handles API integration-related operations including OpenAPI specifications,
 * API testing, and endpoint management
 */
import axios from 'axios';
import { getAuthToken } from '../auth/authService';
import { getCurrentUser } from '../context';
import { AGENT_ENGINE_URL } from '../config/apiConfig';
import { logActivity } from '../activity/activityService';
import { AGENT_ACTIVITIES, RESOURCE_TYPES, ACTIVITY_SEVERITY } from '../../constants/activityTypes';

/**
 * Upload an MCP configuration for an agent
 */
export const uploadMcpConfiguration = async (agentId, file, onUploadProgress = null) => {
  // Get current user ID and auth token outside try block for error logging
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid;

  try {

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    // Create form data with all required fields
    const formData = new FormData();

    // Validate that we have a valid file
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

    // Add required form fields matching backend API definition
    formData.append('file', file);
    formData.append('userId', userId);

    console.log(`Uploading MCP config file for agent ${agentId} with userId ${userId}`);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // Log all form data fields to debug
    const formEntries = [...formData.entries()];
    console.log('Form data fields:', formEntries.map(entry => `${entry[0]}: ${entry[1] instanceof File ? entry[1].name : entry[1]}`));

    // Use axios directly with proper authentication (calling agent-engine)
    const response = await axios({
      method: 'post',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/mcp-config`,
      data: formData,
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type manually for FormData, let axios set it with boundary
      },
      // Add upload progress tracking if callback provided
      ...(onUploadProgress && {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      })
    });

    // Log successful MCP config upload activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.MCP_CONFIG_UPLOADED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: agentId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        activity_details: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_method: 'mcp_configuration',
          agent_id: agentId,
          user_id: userId
        }
      });
    } catch (logError) {
      console.error('Failed to log MCP config upload activity:', logError);
    }

    return response.data;
  } catch (error) {
    console.error('Error uploading MCP config file:', error);

    // Log upload failure activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.MCP_CONFIG_UPLOAD_FAILED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: agentId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        severity: ACTIVITY_SEVERITY.ERROR,
        activity_details: {
          file_name: file?.name || 'unknown',
          file_size: file?.size || 0,
          file_type: file?.type || 'unknown',
          error_message: error.message,
          error_status: error.response?.status,
          agent_id: agentId,
          user_id: userId
        }
      });
    } catch (logError) {
      console.error('Failed to log MCP config upload failure activity:', logError);
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);

      // More detailed logging for 422 errors
      if (error.response.status === 422 && error.response.data.detail) {
        const details = error.response.data.detail || [];
        details.forEach(detail => {
          if (detail.loc && Array.isArray(detail.loc)) {
            console.error(`Field ${detail.loc.join('.')} error: ${detail.msg}`);
          } else {
            console.error('Validation error:', detail);
          }
        });
      }
    }
    throw error;
  }
};

/**
 * Upload an OpenAPI specification or MCP config for an agent
 */
export const uploadApiSpecification = async (agentId, file, onUploadProgress = null) => {
  // Get current user ID and auth token outside try block for error logging
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid;
  
  try {
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    // Create form data with all required fields
    const formData = new FormData();
    
    // Validate that we have a valid file
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }
    
    // Add required form fields matching backend API definition
    formData.append('file', file);
    formData.append('userId', userId);
    
    console.log(`Uploading config file for agent ${agentId} with userId ${userId}`);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    // Log all form data fields to debug
    const formEntries = [...formData.entries()];
    console.log('Form data fields:', formEntries.map(entry => `${entry[0]}: ${entry[1] instanceof File ? entry[1].name : entry[1]}`));
    
    // Use axios directly with proper authentication (calling agent-engine)
    const response = await axios({
      method: 'post',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/config`,
      data: formData,
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type manually for FormData, let axios set it with boundary
      },
      // Add upload progress tracking if callback provided
      ...(onUploadProgress && {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      })
    });
    
    // Log successful API specification upload activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.API_SPEC_UPLOADED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: agentId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        activity_details: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_method: 'openapi_specification',
          agent_id: agentId,
          user_id: userId
        }
      });
    } catch (logError) {
      console.error('Failed to log API specification upload activity:', logError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading config file:', error);
    
    // Log upload failure activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.API_SPEC_UPLOAD_FAILED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: agentId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        severity: ACTIVITY_SEVERITY.ERROR,
        activity_details: {
          file_name: file?.name || 'unknown',
          file_size: file?.size || 0,
          file_type: file?.type || 'unknown',
          error_message: error.message,
          error_status: error.response?.status,
          agent_id: agentId,
          user_id: userId
        }
      });
    } catch (logError) {
      console.error('Failed to log API specification upload failure activity:', logError);
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // More detailed logging for 422 errors
      if (error.response.status === 422 && error.response.data.detail) {
        const details = error.response.data.detail || [];
        details.forEach(detail => {
          if (detail.loc && Array.isArray(detail.loc)) {
            console.error(`Field ${detail.loc.join('.')} error: ${detail.msg}`);
          } else {
            console.error('Validation error:', detail);
          }
        });
      }
    }
    throw error;
  }
};

/**
 * Get API integrations for an agent
 */
export const getApiIntegrations = async (agentId) => {
  try {
    // Get current user ID
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    console.log(`Fetching API integrations for agent ${agentId}, userId: ${userId}`);
    
    // Use axios directly instead of the api instance to avoid interceptor issues
    const response = await axios({
      method: 'get',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/api-integrations-files`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'userId': userId
      },
      timeout: 10000
    });
    
    console.log('API integrations response:', response.data);
    
    // Handle different response formats
    if (response.data && response.data.api_integrations && Array.isArray(response.data.api_integrations)) {
      return response.data.api_integrations;
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && Array.isArray(response.data.integrations)) {
      return response.data.integrations;
    }
    
    // Look for the first array property in the response
    if (response.data && typeof response.data === 'object') {
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          console.log(`Found array in response.data.${key}`);
          return response.data[key];
        }
      }
    }
    
    console.warn('Could not find array of integrations in response:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching API integrations:', error);
    
    // Handle 405 Method Not Allowed - this endpoint might not exist
    if (error.response?.status === 405) {
      console.warn(`API integrations endpoint not available for agent ${agentId} (405), returning empty integrations`);
      return [];
    }
    
    // Check for OpenAPI validation error in the response
    if (
      error.response?.data?.detail?.includes?.('OpenAPIValidationError') ||
      error.response?.data?.message?.includes?.('openapi_spec_validator') ||
      error.message?.includes?.('OpenAPIValidationError')
    ) {
      console.error('OpenAPI validation error detected in the server response');
      
      const err = new Error('Server error with OpenAPI validator. This is a backend issue.');
      err.response = error.response;
      err.isOpenApiValidationError = true;
      throw err;
    }
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Delete an API integration
 */
export const deleteApiIntegration = async (agentId, integrationId) => {
  // Get current user ID outside try block for error logging
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid;
  
  try {
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    console.log(`Deleting API integration ${integrationId} for agent ${agentId}`);
    
    const response = await axios({
      method: 'delete',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/api-integrations/${integrationId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'userId': userId
      }
    });
    
    // Log successful API integration deletion activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.API_INTEGRATION_DELETED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: integrationId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        activity_details: {
          integration_id: integrationId,
          agent_id: agentId,
          user_id: userId,
          action: 'deleted'
        }
      });
    } catch (logError) {
      console.error('Failed to log API integration deletion activity:', logError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error deleting API integration:', error);
    
    // Log deletion failure activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.API_INTEGRATION_DELETE_FAILED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: integrationId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        severity: ACTIVITY_SEVERITY.ERROR,
        activity_details: {
          integration_id: integrationId,
          agent_id: agentId,
          user_id: userId,
          error_message: error.message,
          error_status: error.response?.status
        }
      });
    } catch (logError) {
      console.error('Failed to log API integration deletion failure activity:', logError);
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Get API specification content
 */
export const getApiSpecification = async (agentId, apiId) => {
  try {
    // Get current user ID
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    console.log(`Fetching API specification content for agent ${agentId}, API ${apiId}`);
    
    const response = await axios({
      method: 'get',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/api-integrations/${apiId}/spec`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'userId': userId
      }
    });
    
    console.log('API specification content response received');
    return response.data;
  } catch (error) {
    console.error('Error fetching API specification content:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Download API specification file
 */
export const downloadApiSpecification = async (agentId, apiId) => {
  try {
    // Get current user ID
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    console.log(`Generating download URL for API spec: agent ${agentId}, API ${apiId}`);
    
    // Return the full URL since this endpoint redirects to the file or serves it directly
    return `${AGENT_ENGINE_URL}/api/agents/${agentId}/api-integrations/${apiId}/download?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}`;
  } catch (error) {
    console.error('Error generating API spec download URL:', error);
    throw error;
  }
};

/**
 * Get testable endpoints for an API integration
 */
export const getTestableEndpoints = async (agentId) => {
  try {
    // Get current user ID
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    console.log(`Fetching testable endpoints for agent ${agentId}`);
    
    const response = await axios({
      method: 'get',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/testable-endpoints`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'userId': userId
      }
    });
    
    console.log('Testable endpoints response:', response.data);
    
    // Return the endpoints from the response
    if (response.data && response.data.endpoints) {
      return response.data.endpoints;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Look for any array in the response
    if (response.data && typeof response.data === 'object') {
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          console.log(`Found array in response.data.${key}`);
          return response.data[key];
        }
      }
    }
    
    console.warn('No testable endpoints found in response:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching testable endpoints:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Test an API endpoint
 */
export const testApiEndpoint = async (agentId, endpointId, queryParams = {}, pathParams = {}, headerParams = {}) => {
  // Get current user ID outside try block for error logging
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid;
  
  try {
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }

    const response = await axios({
      method: 'post',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/api-integrations/${endpointId}/test`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'userId': userId
      },
      data: {
        query_params: queryParams,
        path_params: pathParams,
        header_params: headerParams
      }
    });
    
    // Log successful API endpoint test activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.API_ENDPOINT_TESTED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: endpointId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        activity_details: {
          endpoint_id: endpointId,
          agent_id: agentId,
          user_id: userId,
          test_params: {
            query_params: Object.keys(queryParams).length,
            path_params: Object.keys(pathParams).length,
            header_params: Object.keys(headerParams).length
          },
          response_status: response.status,
          action: 'tested'
        }
      });
    } catch (logError) {
      console.error('Failed to log API endpoint test activity:', logError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error testing API endpoint:', error);
    
    // Log endpoint test failure activity
    try {
      await logActivity({
        activity_type: AGENT_ACTIVITIES.API_ENDPOINT_TEST_FAILED,
        resource_type: RESOURCE_TYPES.INTEGRATION,
        resource_id: endpointId,
        related_resource_type: RESOURCE_TYPES.AGENT,
        related_resource_id: agentId,
        severity: ACTIVITY_SEVERITY.ERROR,
        activity_details: {
          endpoint_id: endpointId,
          agent_id: agentId,
          user_id: userId || 'unknown',
          test_params: {
            query_params: Object.keys(queryParams).length,
            path_params: Object.keys(pathParams).length,
            header_params: Object.keys(headerParams).length
          },
          error_message: error.message,
          error_status: error.response?.status
        }
      });
    } catch (logError) {
      console.error('Failed to log API endpoint test failure activity:', logError);
    }
    
    throw error;
  }
};

/**
 * Get API integration files for an agent
 */
export const getApiIntegrationFiles = async (agentId) => {
  try {
    // Get current user ID
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Force token refresh to ensure we have a valid token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing or invalid');
    }
    
    console.log(`Fetching API integration files for agent ${agentId}`);
    
    const response = await axios({
      method: 'get',
      url: `${AGENT_ENGINE_URL}/api/agents/${agentId}/api-integrations-files`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'userId': userId
      }
    });
    
    console.log('API integration files response:', response.data);
    
    // Handle different response formats
    if (response.data && response.data.api_integrations && Array.isArray(response.data.api_integrations)) {
      return response.data.api_integrations;
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && response.data.files && Array.isArray(response.data.files)) {
      return response.data.files;
    }
    
    console.warn('Could not find array of API integration files in response:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching API integration files:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};