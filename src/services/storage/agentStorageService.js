/**
 * Agent Storage Service
 *
 * Tracks and manages storage usage for individual agents by querying
 * the existing agent_storage/{agent_id}/attachments/ Firestore collection
 */

import { db } from '../../utils/firebase';
// import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'; // REMOVED: Firebase/Firestore

/**
 * Get storage usage statistics for an agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Storage usage statistics
 */
export const getAgentStorageUsage = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // REMOVED: Firestore reads for storage metadata and attachments
    // const metadataRef = doc(db, 'agent_storage', agentId);
    // const metadataDoc = await getDoc(metadataRef);
    // const attachmentsRef = collection(db, 'agent_storage', agentId, 'attachments');
    // const activeQuery = query(attachmentsRef, where('status', '==', 'active'));
    // const snapshot = await getDocs(activeQuery);
    // TODO: Replace with backend API call: GET /api/storage/agents/{agentId}/usage

    console.warn('getAgentStorageUsage: Firestore disabled, returning default empty usage');

    return {
      usage: {
        total_bytes: 0,
        total_mb: 0,
        file_count: 0,
        last_updated: new Date().toISOString(),
        last_upload: null
      },
      quota: {
        total_mb: 1024, // 1GB default
        total_bytes: 1024 * 1024 * 1024,
        tier: 'standard'
      },
      breakdown: {
        images: { count: 0, size_mb: 0 },
        documents: { count: 0, size_mb: 0 },
        others: { count: 0, size_mb: 0 }
      },
      usage_percentage: 0
    };
  } catch (error) {
    console.error('Error getting agent storage usage:', error);
    throw error;
  }
};

/**
 * Get list of attachments for an agent
 * @param {string} agentId - Agent ID
 * @param {number} limitCount - Limit number of results (default 20)
 * @returns {Promise<Array>} Array of attachment metadata
 */
export const getAttachmentsList = async (agentId, limitCount = 20) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // REMOVED: Firestore query for attachments
    // const attachmentsRef = collection(db, 'agent_storage', agentId, 'attachments');
    // const q = query(
    //   attachmentsRef,
    //   where('status', '==', 'active'),
    //   orderBy('uploaded_at', 'desc'),
    //   limit(limitCount)
    // );
    // const snapshot = await getDocs(q);
    // TODO: Replace with backend API call: GET /api/storage/agents/{agentId}/attachments?limit={limitCount}

    console.warn('getAttachmentsList: Firestore disabled, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting attachments list:', error);
    throw error;
  }
};

/**
 * Get storage statistics summary
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Storage statistics
 */
export const getStorageStats = async (agentId) => {
  try {
    const [usage, recentFiles] = await Promise.all([
      getAgentStorageUsage(agentId),
      getAttachmentsList(agentId, 10)
    ]);

    const averageFileSize = usage.usage.file_count > 0
      ? usage.usage.total_mb / usage.usage.file_count
      : 0;

    // Use uploaded_at from recent files or from usage stats
    const lastUpload = recentFiles.length > 0 && recentFiles[0].uploaded_at
      ? recentFiles[0].uploaded_at
      : usage.usage.last_upload || null;

    return {
      ...usage,
      statistics: {
        average_file_size_mb: Math.round(averageFileSize * 100) / 100,
        last_upload: lastUpload,
        storage_path: `/agent_storage/${agentId}/attachments/`
      },
      recent_attachments: recentFiles.slice(0, 5) // Show only last 5
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
};

/**
 * Listen to real-time storage changes
 * @param {string} agentId - Agent ID
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
export const listenToStorageChanges = (agentId, callback) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // REMOVED: Firestore real-time listener for storage changes
    // const metadataRef = doc(db, 'agent_storage', agentId);
    // return onSnapshot(metadataRef, async (docSnapshot) => {...});
    // TODO: Replace with WebSocket or polling for real-time storage updates

    console.warn('listenToStorageChanges: Firestore disabled, no real-time updates');

    // Call callback immediately with empty storage data
    setTimeout(async () => {
      try {
        const stats = await getStorageStats(agentId);
        callback(stats);
      } catch (error) {
        console.error('Error in stub storage listener:', error);
      }
    }, 0);

    // Return no-op unsubscribe function
    return () => {
      console.log(`Unsubscribe from storage changes for agent ${agentId} (no-op)`);
    };
  } catch (error) {
    console.error('Error setting up storage listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Check if storage is in warning range (>80% used)
 * @param {Object} storageStats - Storage statistics object
 * @returns {boolean} True if in warning range
 */
export const isStorageInWarning = (storageStats) => {
  return storageStats?.usage_percentage > 80;
};

/**
 * Check if storage is nearly full (>90% used)
 * @param {Object} storageStats - Storage statistics object
 * @returns {boolean} True if nearly full
 */
export const isStorageNearlyFull = (storageStats) => {
  return storageStats?.usage_percentage > 90;
};

/**
 * Format storage size for display
 * @param {number} sizeInMB - Size in MB
 * @returns {string} Formatted size string
 */
export const formatStorageSize = (sizeInMB) => {
  if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  } else if (sizeInMB >= 1) {
    return `${Math.round(sizeInMB * 10) / 10} MB`;
  } else {
    return `${Math.round(sizeInMB * 1024)} KB`;
  }
};

/**
 * Calculate remaining storage
 * @param {Object} storageStats - Storage statistics object
 * @returns {number} Remaining storage in MB
 */
export const calculateRemainingStorage = (storageStats) => {
  if (!storageStats?.quota || !storageStats?.usage) {
    return 0;
  }

  // Use MB values if available
  if (storageStats.quota.total_mb !== undefined && storageStats.usage.total_mb !== undefined) {
    return Math.max(0, storageStats.quota.total_mb - storageStats.usage.total_mb);
  }

  // Fall back to calculating from bytes
  if (storageStats.quota.total_bytes !== undefined && storageStats.usage.total_bytes !== undefined) {
    const quotaMB = bytesToMB(storageStats.quota.total_bytes);
    const usedMB = bytesToMB(storageStats.usage.total_bytes);
    return Math.max(0, quotaMB - usedMB);
  }

  return 0;
};

// Helper functions
const bytesToMB = (bytes) => {
  return bytes / (1024 * 1024);
};

const isImageFile = (filename, contentType) => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const imageContentTypes = ['image/'];

  const hasImageExtension = imageExtensions.some(ext =>
    filename.toLowerCase().endsWith(ext)
  );

  const hasImageContentType = imageContentTypes.some(type =>
    contentType.toLowerCase().startsWith(type)
  );

  return hasImageExtension || hasImageContentType;
};

const isDocumentFile = (filename, contentType) => {
  const docExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json', '.yaml', '.yml'];
  const docContentTypes = ['application/pdf', 'application/msword', 'text/', 'application/json'];

  const hasDocExtension = docExtensions.some(ext =>
    filename.toLowerCase().endsWith(ext)
  );

  const hasDocContentType = docContentTypes.some(type =>
    contentType.toLowerCase().startsWith(type)
  );

  return hasDocExtension || hasDocContentType;
};