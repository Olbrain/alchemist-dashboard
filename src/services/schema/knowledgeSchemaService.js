/**
 * Knowledge Document Schema Service
 * 
 * Service for interacting with knowledge-vault schema API endpoints.
 * Provides schema definition retrieval and document validation capabilities.
 */

import { apiConfig } from '../config/apiConfig';

/**
 * Cache for schema definitions to avoid repeated API calls
 */
let schemaCache = new Map();
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get knowledge document schema definition from knowledge-vault service
 * 
 * @param {string} version - Schema version (optional, defaults to latest)
 * @returns {Promise<Object>} Schema definition
 */
export const getKnowledgeDocumentSchema = async (version = null) => {
  try {
    // Check cache first
    const cacheKey = version || 'latest';
    const now = Date.now();
    
    if (schemaCache.has(cacheKey) && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log(`📋 [Schema Cache] Using cached schema for version: ${cacheKey}`);
      return schemaCache.get(cacheKey);
    }

    console.log(`📋 [Schema API] Fetching schema from knowledge-vault, version: ${version || 'latest'}`);
    
    const url = new URL(`${apiConfig.KNOWLEDGE_VAULT_URL}/api/schema/knowledge-documents/schema`);
    if (version) {
      url.searchParams.append('version', version);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Schema API request failed: ${response.status} ${response.statusText}`);
    }

    const schema = await response.json();
    
    // Cache the result
    schemaCache.set(cacheKey, schema);
    cacheTimestamp = now;
    
    console.log(`📋 [Schema API] Retrieved schema version: ${schema.version}`);
    return schema;

  } catch (error) {
    console.error('❌ [Schema API] Failed to fetch knowledge document schema:', error);
    throw new Error(`Failed to retrieve knowledge document schema: ${error.message}`);
  }
};

/**
 * Get supported schema versions from knowledge-vault service
 * 
 * @returns {Promise<Object>} Supported versions info
 */
export const getSupportedSchemaVersions = async () => {
  try {
    console.log('📋 [Schema API] Fetching supported schema versions');
    
    const response = await fetch(`${apiConfig.KNOWLEDGE_VAULT_URL}/api/schema/knowledge-documents/schema/versions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Schema versions API request failed: ${response.status} ${response.statusText}`);
    }

    const versions = await response.json();
    console.log(`📋 [Schema API] Supported versions:`, versions.supported_versions);
    
    return versions;

  } catch (error) {
    console.error('❌ [Schema API] Failed to fetch supported schema versions:', error);
    throw new Error(`Failed to retrieve supported schema versions: ${error.message}`);
  }
};

/**
 * Validate a knowledge document structure against the canonical schema
 * 
 * @param {Object} document - Document to validate
 * @param {string} schemaVersion - Schema version to validate against (optional)
 * @returns {Promise<Object>} Validation result
 */
export const validateKnowledgeDocument = async (document, schemaVersion = null) => {
  try {
    console.log(`📋 [Schema Validation] Validating document against schema version: ${schemaVersion || 'latest'}`);
    
    const requestBody = {
      document: document,
      schema_version: schemaVersion
    };

    const response = await fetch(`${apiConfig.KNOWLEDGE_VAULT_URL}/api/schema/knowledge-documents/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Schema validation API request failed: ${response.status} ${response.statusText}`);
    }

    const validationResult = await response.json();
    
    if (validationResult.valid) {
      console.log(`✅ [Schema Validation] Document is valid`);
      if (validationResult.warnings.length > 0) {
        console.warn(`⚠️ [Schema Validation] Warnings:`, validationResult.warnings);
      }
    } else {
      console.error(`❌ [Schema Validation] Document is invalid:`, validationResult.errors);
    }
    
    return validationResult;

  } catch (error) {
    console.error('❌ [Schema Validation] Validation request failed:', error);
    throw new Error(`Failed to validate knowledge document: ${error.message}`);
  }
};

/**
 * Create a compliant knowledge document structure based on the current schema
 * 
 * @param {Object} baseData - Base document data
 * @returns {Promise<Object>} Compliant document structure
 */
export const createCompliantDocument = async (baseData) => {
  try {
    // Get current schema to ensure compliance
    await getKnowledgeDocumentSchema();

    // Extract domain for filename if URL upload
    let filename = baseData.filename;
    if (baseData.contentType === 'url' && baseData.sourceUrl) {
      try {
        const urlObj = new URL(baseData.sourceUrl);
        filename = `${urlObj.hostname}_content.md`;
      } catch (urlError) {
        console.warn('Failed to extract domain from URL, using fallback filename');
        filename = 'url_content.md';
      }
    }

    // Create document following the new canonical schema
    const document = {
      knowledge_id: baseData.id,
      organization_id: baseData.organizationId,
      agent_id: baseData.agentId,
      owner_id: baseData.userId,
      created_by: baseData.userId,
      status: "active",

      knowledge_info: {
        filename: filename,
        content_type: baseData.contentType || "file",
        file_type: baseData.fileType || baseData.contentType || "application/octet-stream",
        file_size: baseData.size || 0,
        upload_timestamp: new Date().toISOString(),
        source_url: baseData.sourceUrl || null,
        storage_info: baseData.storageInfo || null
      },

      summary: null,
      text_snippet: null,

      indexing_status: "pending",
      processing_metadata: {
        indexed: false,
        progress_percent: 0,
        indexing_phase: baseData.contentType === 'url' ? "queued" : "queued",
        indexing_error: null,
        chunk_count: 0,
        embedding_model: null
      },

      embeddings_meta: {
        embeddings_collection_path: `knowledge_embeddings/${baseData.agentId}/chunks`,
        embeddings_count: 0
      },

      access_control: {
        access_level: "private",
        visibility: "organization",
        shared_with: [],
        allowed_roles: [],
        allowed_agents: []
      },

      metadata: {
        tags: baseData.tags || [],
        category: baseData.category || "reference",
        priority: baseData.priority || "normal",
        upload_method: baseData.uploadMethod || "knowledge_library",
        source: "knowledge_vault_backend"
      },

      cost_metrics_summary: {
        tokens_used: 0,
        cost_incurred: 0.0,
        calculated_at: null
      },

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };

    console.log(`📋 [Schema Compliance] Created compliant document structure for ${baseData.contentType}`);
    return document;

  } catch (error) {
    console.error('❌ [Schema Compliance] Failed to create compliant document:', error);
    throw new Error(`Failed to create compliant document structure: ${error.message}`);
  }
};

/**
 * Validate document before Firestore creation (used by knowledgeLibraryService)
 * 
 * @param {Object} document - Document to validate
 * @returns {Promise<boolean>} True if valid, throws error if invalid
 */
export const validateBeforeCreation = async (document) => {
  try {
    const validationResult = await validateKnowledgeDocument(document);
    
    if (!validationResult.valid) {
      const errorMessage = `Document validation failed: ${validationResult.errors.join(', ')}`;
      throw new Error(errorMessage);
    }
    
    // Log warnings but don't fail
    if (validationResult.warnings.length > 0) {
      console.warn(`⚠️ [Schema Validation] Document has warnings:`, validationResult.warnings);
    }
    
    return true;

  } catch (error) {
    console.error('❌ [Schema Validation] Pre-creation validation failed:', error);
    throw error;
  }
};

/**
 * Create a compliant embedding chunk document for storage
 *
 * @param {Object} chunkData - Chunk data including agent_id, knowledge_id, chunk_index, content, embedding
 * @returns {Object} Compliant embedding chunk document
 */
export const createEmbeddingChunkDocument = (chunkData) => {
  const chunkId = `${chunkData.agentId}__${chunkData.knowledgeId}__chunk_${chunkData.chunkIndex}`;

  return {
    chunk_id: chunkId,
    agent_id: chunkData.agentId,
    organization_id: chunkData.organizationId,
    knowledge_id: chunkData.knowledgeId,
    chunk_index: chunkData.chunkIndex,
    content_snippet: chunkData.contentSnippet ? chunkData.contentSnippet.substring(0, 1000) : null,
    content_hash: chunkData.contentHash || null,

    // Embedding storage
    embedding_encoding: chunkData.embeddingEncoding || "f32-base64",
    embedding_dims: chunkData.embeddingDims || 1536,
    embedding: chunkData.embedding || null,

    embedding_exists: !!chunkData.embedding,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * Clear schema cache (useful for testing or when schema updates are expected)
 */
export const clearSchemaCache = () => {
  schemaCache.clear();
  cacheTimestamp = null;
  console.log('📋 [Schema Cache] Cache cleared');
};

const knowledgeSchemaService = {
  getKnowledgeDocumentSchema,
  getSupportedSchemaVersions,
  validateKnowledgeDocument,
  createCompliantDocument,
  validateBeforeCreation,
  createEmbeddingChunkDocument,
  clearSchemaCache
};

export default knowledgeSchemaService;