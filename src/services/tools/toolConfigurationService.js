/**
 * Tool Configuration Service
 *
 * Manages agent-specific configurations for public tools
 * All operations via backend API (no direct Firestore access in embed mode)
 */
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where
// } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
// import { db } from '../../utils/firebase'; // REMOVED: Firebase/Firestore
import { agentBuilderApi } from '../config/apiConfig';
import { getCurrentUser } from '../context';
import { fetchAndCacheToolMetadata, removeCachedToolMetadata } from './toolMetadataService';

/**
 * Save or update tool configuration for an agent
 * @param {string} agentId - Agent ID
 * @param {string} toolId - Tool ID (public tool)
 * @param {Object} configData - Configuration data
 * @returns {Promise<Object>} Saved configuration
 */
export const saveToolConfiguration = async (agentId, toolId, configData) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const {
      configuration,
      enabled = true,
      enabled_subtools = []
    } = configData;

    // Validate required fields
    if (!configuration || typeof configuration !== 'object') {
      throw new Error('Configuration object is required');
    }

    // Use backend API to save tool configuration
    await agentBuilderApi.post('/api/tools/configurations', {
      agent_id: agentId,
      tool_id: toolId,
      enabled,
      configuration,
      custom_parameters: {
        enabled_subtools
      }
    });

    console.log('Saved tool configuration via backend API:', { agentId, toolId });

    // Auto-enable required tools
    const autoEnabled = await autoEnableRequiredTools(agentId, toolId);

    // Cache tool metadata if enabled
    if (enabled) {
      try {
        await fetchAndCacheToolMetadata(agentId, toolId);
        console.log(`Cached metadata for enabled tool: ${toolId}`);
      } catch (error) {
        console.error(`Failed to cache metadata for ${toolId}:`, error);
        // Don't fail the save operation if metadata caching fails
      }
    }

    return {
      id: toolId,
      enabled,
      configuration,
      enabled_subtools,
      auto_enabled_tools: autoEnabled
    };
  } catch (error) {
    console.error('Error saving tool configuration:', error);
    throw error;
  }
};

/**
 * Auto-enable required tools when a tool with dependencies is configured
 * Uses backend API instead of Firestore
 * @param {string} agentId - Agent ID
 * @param {string} toolId - Tool ID that was just configured
 * @returns {Promise<Array>} Array of tool IDs that were auto-enabled
 */
const autoEnableRequiredTools = async (agentId, toolId) => {
  try {
    // Load tool definition to check for required_tools field using backend API
    const response = await agentBuilderApi.get(`/api/tools/${toolId}`);
    const toolData = response.data.data;

    if (!toolData) {
      console.log('Tool not found for auto-enable check:', toolId);
      return [];
    }

    const requiredTools = toolData.required_tools || [];

    if (requiredTools.length === 0) {
      return [];
    }

    console.log(`Tool ${toolId} requires: ${requiredTools.join(', ')}`);

    const autoEnabledTools = [];

    for (const requiredToolId of requiredTools) {
      try {
        // Check if required tool is already configured
        const existing = await getToolConfiguration(agentId, requiredToolId);

        if (!existing) {
          // Auto-enable required tool with empty configuration
          console.log(`Auto-enabling required tool: ${requiredToolId}`);
          await saveToolConfiguration(agentId, requiredToolId, {
            configuration: {},
            enabled: true,
            enabled_subtools: []
          });
          autoEnabledTools.push(requiredToolId);
        } else {
          console.log(`Required tool ${requiredToolId} already configured, skipping auto-enable`);
        }
      } catch (error) {
        console.error(`Error auto-enabling required tool ${requiredToolId}:`, error);
        // Continue with other required tools even if one fails
      }
    }

    if (autoEnabledTools.length > 0) {
      console.log(`Auto-enabled ${autoEnabledTools.length} required tools:`, autoEnabledTools);
    }

    return autoEnabledTools;
  } catch (error) {
    console.error('Error in autoEnableRequiredTools:', error);
    return [];
  }
};

/**
 * Get tool configuration for an agent
 * Uses backend API instead of Firestore
 * @param {string} agentId - Agent ID
 * @param {string} toolId - Tool ID
 * @returns {Promise<Object|null>} Configuration or null if not found
 */
export const getToolConfiguration = async (agentId, toolId) => {
  try {
    if (!agentId || !toolId) {
      throw new Error('Agent ID and Tool ID are required');
    }

    // Use backend API to get tool configuration
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/tool-configs/${toolId}`);

    // Backend returns { status: "success", data: {...}, message: "..." }
    const config = response.data.data;

    if (!config) {
      console.log('Tool configuration not found:', { agentId, toolId });
      return null;
    }

    return config;
  } catch (error) {
    // If 404, return null (not found)
    if (error.response && error.response.status === 404) {
      console.log('Tool configuration not found:', { agentId, toolId });
      return null;
    }
    console.error('Error getting tool configuration:', error);
    throw new Error(`Failed to get tool configuration: ${error.message}`);
  }
};

/**
 * Get all enabled tool configurations for an agent
 * Uses backend API instead of Firestore
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of enabled tool configurations
 */
export const getEnabledToolConfigs = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get enabled tool configs
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/tool-configs/enabled`);

    // Backend returns { status: "success", count: n, data: [...] }
    const configs = response.data.data || [];

    console.log(`Found ${configs.length} enabled tool configurations for agent ${agentId}`);
    return configs;
  } catch (error) {
    console.error('Error getting enabled tool configurations:', error);
    throw new Error(`Failed to get enabled tool configurations: ${error.message}`);
  }
};

/**
 * Get all tool configurations for an agent (enabled and disabled)
 * Uses backend API instead of Firestore
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of all tool configurations
 */
export const getAllToolConfigs = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get all tool configs (enabled and disabled)
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/tool-configs`);

    // Backend returns { status: "success", count: n, data: [...] }
    const configs = response.data.data || [];

    console.log(`Found ${configs.length} tool configurations for agent ${agentId}`);
    return configs;
  } catch (error) {
    console.error('Error getting all tool configurations:', error);
    throw new Error(`Failed to get all tool configurations: ${error.message}`);
  }
};

/**
 * Delete tool configuration for an agent
 * @param {string} agentId - Agent ID
 * @param {string} toolId - Tool ID
 * @returns {Promise<void>}
 */
export const deleteToolConfiguration = async (agentId, toolId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to delete tool configuration
    await agentBuilderApi.delete(`/api/tools/configurations/${agentId}/${toolId}`);
    console.log('Deleted tool configuration via backend API:', { agentId, toolId });
  } catch (error) {
    console.error('Error deleting tool configuration:', error);
    throw error;
  }
};

/**
 * Enable/disable a tool configuration
 * @param {string} agentId - Agent ID
 * @param {string} toolId - Tool ID
 * @param {boolean} enabled - Whether to enable or disable
 * @returns {Promise<void>}
 */
export const toggleToolConfiguration = async (agentId, toolId, enabled) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Use backend API to toggle tool configuration
    await agentBuilderApi.patch('/api/tools/configurations/toggle', {
      agent_id: agentId,
      tool_id: toolId,
      enabled
    });

    console.log(`${enabled ? 'Enabled' : 'Disabled'} tool configuration via backend API:`, { agentId, toolId });

    // Cache or remove metadata based on enabled status
    if (enabled) {
      try {
        await fetchAndCacheToolMetadata(agentId, toolId);
        console.log(`Cached metadata for enabled tool: ${toolId}`);
      } catch (error) {
        console.error(`Failed to cache metadata for ${toolId}:`, error);
        // Don't fail the toggle operation if metadata caching fails
      }
    } else {
      try {
        await removeCachedToolMetadata(agentId, toolId);
        console.log(`Removed cached metadata for disabled tool: ${toolId}`);
      } catch (error) {
        console.error(`Failed to remove cached metadata for ${toolId}:`, error);
        // Don't fail the toggle operation if metadata removal fails
      }
    }
  } catch (error) {
    console.error('Error toggling tool configuration:', error);
    throw error;
  }
};

/**
 * Check if a tool is configured and enabled for an agent
 * @param {string} agentId - Agent ID
 * @param {string} toolId - Tool ID
 * @returns {Promise<boolean>} True if configured and enabled
 */
export const isToolConfigured = async (agentId, toolId) => {
  try {
    const config = await getToolConfiguration(agentId, toolId);
    return config !== null && config.enabled === true;
  } catch (error) {
    console.error('Error checking tool configuration:', error);
    return false;
  }
};

// Export all functions as default object
const toolConfigurationService = {
  saveToolConfiguration,
  getToolConfiguration,
  getEnabledToolConfigs,
  getAllToolConfigs,
  deleteToolConfiguration,
  toggleToolConfiguration,
  isToolConfigured
};

export default toolConfigurationService;
