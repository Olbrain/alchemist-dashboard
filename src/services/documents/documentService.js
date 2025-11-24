/**
 * Document Service
 *
 * Service for managing agent document library
 * All operations (CRUD) via agent-builder-ai-service backend API
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
// import { Collections } from '../../constants/collections'; // REMOVED: Firebase/Firestore

import { agentBuilderApi } from '../config/apiConfig';

/**
 * Upload a document to agent's document library
 * Uses backend API for upload
 *
 * @param {string} agentId - Agent ID
 * @param {File} file - File object to upload
 * @param {Object} metadata - Document metadata
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Document data with ID
 */
export const uploadDocument = async (agentId, file, metadata, onProgress = null) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    // Validate file size (max 50MB)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata fields
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.tags && metadata.tags.length > 0) {
      formData.append('tags', metadata.tags.join(','));
    }
    if (metadata.keywords && metadata.keywords.length > 0) {
      formData.append('keywords', metadata.keywords.join(','));
    }

    // Upload via axios
    const response = await agentBuilderApi.post(
      `/api/agents/${agentId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
};

/**
 * List all documents for an agent with optional filters
 * Uses backend API instead of Firestore
 *
 * @param {string} agentId - Agent ID
 * @param {Object} filters - Optional filters (category, tag, format)
 * @returns {Promise<Array>} Array of documents
 */
export const listDocuments = async (agentId, filters = {}) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Build query parameters
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.format) params.format = filters.format;
    if (filters.tag) params.tag = filters.tag;

    // Use axios to call backend API
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/documents`, { params });

    // Backend returns { documents: [...] }
    return response.data.documents || [];
  } catch (error) {
    console.error('Error listing documents:', error);
    throw new Error(`Failed to list documents: ${error.message}`);
  }
};

/**
 * Get a single document by ID
 * Uses backend API instead of Firestore
 *
 * @param {string} agentId - Agent ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document data
 */
export const getDocument = async (agentId, documentId) => {
  try {
    if (!agentId || !documentId) {
      throw new Error('Agent ID and Document ID are required');
    }

    // Use axios to call backend API
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/documents/${documentId}`);

    // Backend returns the document directly
    return response.data;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Update document metadata
 * Uses backend API for update
 *
 * @param {string} agentId - Agent ID
 * @param {string} documentId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated document
 */
export const updateDocument = async (agentId, documentId, updates) => {
  try {
    if (!agentId || !documentId) {
      throw new Error('Agent ID and Document ID are required');
    }

    // Only allow updating certain fields
    const allowedFields = ['name', 'description', 'category', 'tags', 'keywords'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Use axios to call backend API
    const response = await agentBuilderApi.put(`/api/agents/${agentId}/documents/${documentId}`, filteredUpdates);

    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }
};

/**
 * Delete a document and its file from storage
 * Uses backend API for delete
 *
 * @param {string} agentId - Agent ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteDocument = async (agentId, documentId) => {
  try {
    if (!agentId || !documentId) {
      throw new Error('Agent ID and Document ID are required');
    }

    // Use axios to call backend API
    const response = await agentBuilderApi.delete(`/api/agents/${agentId}/documents/${documentId}`);

    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

/**
 * Search documents by name, description, tags, keywords
 *
 * @param {string} agentId - Agent ID
 * @param {string} searchQuery - Search query string
 * @returns {Promise<Array>} Array of matching documents sorted by relevance
 */
export const searchDocuments = async (agentId, searchQuery) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    if (!searchQuery || searchQuery.trim().length === 0) {
      return await listDocuments(agentId);
    }

    // Get all documents
    const allDocuments = await listDocuments(agentId);

    // Calculate relevance score for each document
    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/);

    const scoredDocuments = allDocuments.map(doc => {
      let score = 0;

      const name = (doc.name || '').toLowerCase();
      const description = (doc.description || '').toLowerCase();
      const category = (doc.category || '').toLowerCase();
      const tags = (doc.tags || []).map(t => t.toLowerCase());
      const keywords = (doc.keywords || []).map(k => k.toLowerCase());

      // Exact name match = highest score
      if (query === name) {
        score += 100;
      } else if (name.includes(query)) {
        score += 50;
      }

      // Query words in name
      queryWords.forEach(word => {
        if (name.includes(word)) {
          score += 20;
        }
      });

      // Description contains query
      if (description.includes(query)) {
        score += 15;
      }

      // Category match
      if (query === category) {
        score += 30;
      } else if (category.includes(query)) {
        score += 10;
      }

      // Tags match
      tags.forEach(tag => {
        if (query === tag) {
          score += 40;
        } else if (tag.includes(query)) {
          score += 15;
        }
      });

      // Keywords match
      keywords.forEach(keyword => {
        if (query === keyword) {
          score += 35;
        } else if (keyword.includes(query)) {
          score += 12;
        }
      });

      return {
        ...doc,
        relevance_score: score
      };
    });

    // Filter documents with score > 0 and sort by relevance
    const matchingDocuments = scoredDocuments
      .filter(doc => doc.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score);

    return matchingDocuments;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw new Error(`Failed to search documents: ${error.message}`);
  }
};

/**
 * Get document statistics for an agent
 * Uses backend API instead of calculating locally
 *
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Statistics object
 */
export const getDocumentStats = async (agentId) => {
  try {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Use axios to call backend API
    const response = await agentBuilderApi.get(`/api/agents/${agentId}/documents/stats`);

    // Backend returns stats directly
    return response.data;
  } catch (error) {
    console.error('Error getting document stats:', error);
    throw new Error(`Failed to get document stats: ${error.message}`);
  }
};

/**
 * Helper: Get MIME type from format
 */
export const getMimeType = (format) => {
  const mimeTypes = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };

  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
};

/**
 * Helper: Format file size for display
 */
export const formatFileSize = (sizeKb) => {
  if (sizeKb < 1024) {
    return `${sizeKb} KB`;
  } else {
    const sizeMb = (sizeKb / 1024).toFixed(2);
    return `${sizeMb} MB`;
  }
};

/**
 * Helper: Get icon name for format
 */
export const getFormatIcon = (format) => {
  const iconMap = {
    'pdf': 'PictureAsPdf',
    'docx': 'Description',
    'doc': 'Description',
    'xlsx': 'TableChart',
    'xls': 'TableChart',
    'csv': 'TableChart',
    'txt': 'Description',
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'mp4': 'VideoFile',
    'mp3': 'AudioFile',
    'zip': 'FolderZip',
    'rar': 'FolderZip'
  };

  return iconMap[format.toLowerCase()] || 'InsertDriveFile';
};

const DocumentService = {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  getDocumentStats,
  getMimeType,
  formatFileSize,
  getFormatIcon
};

export default DocumentService;
