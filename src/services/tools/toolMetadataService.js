/**
 * Tool Metadata Service
 *
 * Manages caching and retrieval of tool metadata for agent capabilities display
 * All operations via backend API (no direct Firestore access in embed mode)
 */
// import { doc, getDoc } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
// import { db } from '../../utils/firebase'; // REMOVED: Firebase/Firestore
import { agentBuilderApi } from '../config/apiConfig';
import { getPublicTools } from './toolManagerService';
import { getEnabledToolConfigs } from './toolConfigurationService';

/**
 * Fetch tool metadata from tool-manager API and cache it in Firestore
 * @param {string} agentId - Agent ID
 * @param {string} suiteId - Tool suite ID (e.g., 'woocommerce', 'file_manager')
 * @returns {Promise<Object>} Cached metadata
 */
export const fetchAndCacheToolMetadata = async (agentId, suiteId) => {
  try {
    console.log(`Fetching and caching metadata for suite: ${suiteId}`);

    // Fetch public tools from tool-manager API
    const publicTools = await getPublicTools();

    // Find the specific suite
    const suite = publicTools.find(tool => tool.id === suiteId);

    if (!suite) {
      console.warn(`Suite ${suiteId} not found in public tools`);
      return null;
    }

    // Extract suite info and individual tools
    // Only include fields that are defined (Firestore doesn't allow undefined values)
    const suite_info = {
      id: suite.id,
      name: suite.name || suite.id, // Fallback to ID if name is missing
    };

    // Add optional fields only if they exist
    if (suite.description !== undefined) suite_info.description = suite.description;
    if (suite.icon !== undefined) suite_info.icon = suite.icon;
    if (suite.type !== undefined) suite_info.type = suite.type;

    const metadata = {
      suite_info,
      tools: suite.tools || [], // Array of individual tools
      cached_at: new Date().toISOString()
    };

    // Save metadata via backend API
    await agentBuilderApi.post('/api/tools/metadata/cache', {
      agent_id: agentId,
      tool_id: suiteId,
      metadata: metadata
    });

    console.log(`✓ Cached metadata for suite "${metadata.suite_info.name}" (${suiteId}): ${metadata.tools.length} tools via backend API`);

    return metadata;
  } catch (error) {
    console.error(`Error fetching and caching metadata for ${suiteId}:`, error);
    throw error;
  }
};

/**
 * Get cached tool metadata via backend API
 * @param {string} agentId - Agent ID
 * @param {string} suiteId - Tool suite ID
 * @returns {Promise<Object|null>} Cached metadata or null if not found
 */
export const getCachedToolMetadata = async (agentId, suiteId) => {
  try {
    if (!agentId || !suiteId) {
      throw new Error('Agent ID and Suite ID are required');
    }

    // Get tool configuration which includes metadata
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/tool-configs/${suiteId}`);

    const config = response.data.data;
    if (!config) {
      return null;
    }

    return config.tool_metadata || null;
  } catch (error) {
    // If 404, return null (not found)
    if (error.response && error.response.status === 404) {
      console.log(`Cached metadata not found for ${suiteId}`);
      return null;
    }
    console.error(`Error getting cached metadata for ${suiteId}:`, error);
    return null;
  }
};

/**
 * Remove cached tool metadata from Firestore
 * @param {string} agentId - Agent ID
 * @param {string} suiteId - Tool suite ID
 * @returns {Promise<void>}
 */
export const removeCachedToolMetadata = async (agentId, suiteId) => {
  try {
    // Remove cached metadata via backend API
    await agentBuilderApi.delete(`/api/tools/metadata/${agentId}/${suiteId}`);

    console.log(`Removed cached metadata for ${suiteId} via backend API`);
  } catch (error) {
    console.error(`Error removing cached metadata for ${suiteId}:`, error);
    throw error;
  }
};

/**
 * Get all enabled tools with their metadata (from cache)
 * Returns a flat array of individual tools from all enabled suites
 * Uses backend API endpoint that returns flattened tool metadata
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>} Array of individual tools with suite info
 */
export const getEnabledToolsWithMetadata = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use backend API to get flattened tool metadata
    // This endpoint automatically handles extracting individual tools from enabled suites
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/tool-metadata`);

    // Backend returns { status: "success", count: n, data: [...] }
    const allTools = response.data.data || [];

    console.log(`✓ Total: ${allTools.length} individual tool(s) from enabled suites via backend API`);

    return allTools;
  } catch (error) {
    console.error('Error getting enabled tools with metadata:', error);
    throw new Error(`Failed to get enabled tools with metadata: ${error.message}`);
  }
};

/**
 * Refresh metadata cache for all enabled tools
 * Useful for manual refresh or maintenance
 * @param {string} agentId - Agent ID
 * @returns {Promise<number>} Number of suites refreshed
 */
export const refreshAllToolMetadata = async (agentId) => {
  try {
    const enabledConfigs = await getEnabledToolConfigs(agentId);

    let refreshed = 0;
    for (const config of enabledConfigs) {
      try {
        await fetchAndCacheToolMetadata(agentId, config.id);
        refreshed++;
      } catch (error) {
        console.error(`Failed to refresh metadata for ${config.id}:`, error);
      }
    }

    console.log(`Refreshed metadata for ${refreshed}/${enabledConfigs.length} suites`);
    return refreshed;
  } catch (error) {
    console.error('Error refreshing all tool metadata:', error);
    throw error;
  }
};

// Export all functions as default object
const toolMetadataService = {
  fetchAndCacheToolMetadata,
  getCachedToolMetadata,
  removeCachedToolMetadata,
  getEnabledToolsWithMetadata,
  refreshAllToolMetadata
};

export default toolMetadataService;
