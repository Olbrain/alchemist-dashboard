/**
 * Centralized Firebase Collection Constants for Olbrain Platform
 * 
 * This module defines all Firestore collection names used across the platform
 * to ensure consistency and prevent typos in collection references.
 * 
 * Usage:
 *   import { Collections, DocumentFields } from './constants/collections';
 *   
 *   // Access collection name
 *   const agentsRef = collection(db, Collections.AGENTS);
 *   
 *   // Use in queries
 *   const q = query(collection(db, Collections.CONVERSATIONS), 
 *                   where(DocumentFields.Conversation.AGENT_ID, '==', agentId));
 */

/**
 * Centralized collection name constants.
 * All collection names follow snake_case convention for consistency.
 * Updated for owner-based access (non-enterprise schema).
 */
export const Collections = {
  // ============================================================================
  // FOUNDATION LAYER - Owner-based core
  // ============================================================================
  
  // User management (organization fields optional)
  ORGANIZATIONS: 'organizations',
  USER_PROFILES: 'user_profiles',
  PROJECTS: 'projects',
  
  // ============================================================================
  // CORE COLLECTIONS - Owner-based access
  // ============================================================================
  
  // Agent management (owner-based)
  AGENTS: 'agents',
  AGENT_DEPLOYMENTS: 'agent_deployments',
  AGENT_SESSIONS: 'agent_sessions',
  AGENT_USAGE_SUMMARY: 'agent_usage_summary',

  // Development productivity
  PROMPT_TEMPLATES: 'prompt_templates',
  TEST_CASES: 'test_cases',
  TEST_RUNS: 'test_runs',
  TEST_SESSIONS: 'test_sessions',
  
  // MCP Server management
  MCP_DEPLOYMENTS: 'mcp_deployments',
  PUBLIC_MCP_SERVERS: 'public_mcp_servers',
  
  // Conversation and messaging (enhanced with intelligence)
  CONVERSATIONS: 'conversations',
  ALCHEMIST_CONVERSATIONS: 'alchemist_conversations', // User-scoped Alchemist assistant conversations
  CONVERSATION_FEEDBACK: 'conversation_feedback',
  COMMUNICATION_LOGS: 'communication_logs',
  
  // User and billing management
  USER_ACCOUNTS: 'user_accounts',
  CREDIT_TRANSACTIONS: 'credit_transactions',
  
  // Knowledge base (v4.0.0 - Simplified knowledge management with direct assignment)
  KNOWLEDGE_LIBRARY: 'knowledge_library',
  KNOWLEDGE_EMBEDDINGS: 'knowledge_embeddings',
  
  // @deprecated - use KNOWLEDGE_LIBRARY instead
  KNOWLEDGE_FILES: 'knowledge_files',
  
  // Training and AI
  TRAINING_JOBS: 'training_jobs',
  
  // Integrations
  INTEGRATION_CHANNELS: 'integration_channels',
  
  // ============================================================================
  // MONITORING & OPERATIONS
  // ============================================================================
  
  // Activity tracking and monitoring
  ACTIVITIES: 'activities',
  NOTIFICATIONS: 'notifications',
  
  // Development operations
  FEATURE_FLAGS: 'feature_flags',
  
  // ============================================================================
  // SECURITY & COMPLIANCE
  // ============================================================================
  
  // KMS-encrypted secrets
  SECRETS: 'secrets',
  
  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================
  
  // Pre-aggregated business intelligence
  BUSINESS_INTELLIGENCE: 'business_intelligence',
  
  // Deprecated collection names
  Deprecated: {
    ALCHEMIST_AGENTS: 'alchemist_agents',
    DEV_CONVERSATIONS: 'dev_conversations', 
    KNOWLEDGE_BASE_FILES: 'knowledge_base_files',
    USER_CREDITS: 'user_credits',
    AGENT_BILLING_SUMMARY: 'agent_billing_summary',
    MANAGED_ACCOUNTS: 'managed_accounts',
    WEBHOOK_LOGS: 'webhook_logs',
    KNOWLEDGE_BASE_EMBEDDINGS: 'knowledge_base_embeddings'
  }
  
};

/**
 * Subcollection names used within parent collections
 */
export const SubCollections = {
  ORGANIZATION_MEMBERS: 'members',
  PROJECT_MEMBERS: 'members',
};

/**
 * Helper function to get organization members collection path
 */
export const getOrganizationMembersPath = (organizationId) => {
  return `${Collections.ORGANIZATIONS}/${organizationId}/${SubCollections.ORGANIZATION_MEMBERS}`;
};

/**
 * Helper function to get project members collection path
 */
export const getProjectMembersPath = (projectId) => {
  return `${Collections.PROJECTS}/${projectId}/${SubCollections.PROJECT_MEMBERS}`;
};

/**
 * Standardized document field names used across collections.
 * These ensure consistent field naming and help prevent typos.
 */
export const DocumentFields = {
  // ============================================================================
  // COMMON FIELDS - Owner-based schema
  // ============================================================================
  
  // Primary identifiers
  ID: 'id',
  AGENT_ID: 'agent_id',
  USER_ID: 'user_id',
  OWNER_ID: 'owner_id', // primary ownership field
  ORGANIZATION_ID: 'organization_id', // optional - for backwards compatibility
  DEPLOYMENT_ID: 'deployment_id',
  FILE_ID: 'file_id', // deprecated - use KNOWLEDGE_ID
  KNOWLEDGE_ID: 'knowledge_id', // standardized knowledge identifier
  MEMBERSHIP_ID: 'membership_id',
  PERMISSION_ID: 'permission_id',
  TEMPLATE_ID: 'template_id',
  SESSION_ID: 'session_id',
  
  // Timestamps (using snake_case for consistency)
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  TIMESTAMP: 'timestamp',
  VERSION: 'version',
  
  // Status fields
  STATUS: 'status',
  
  // ============================================================================
  // ACTIVITY FIELDS
  // ============================================================================
  
  Activity: {
    ACTIVITY_ID: 'activity_id',
    ORGANIZATION_ID: 'organization_id',
    ACTIVITY_TYPE: 'activity_type',
    RESOURCE_TYPE: 'resource_type',
    RESOURCE_ID: 'resource_id',
    ACTOR_ID: 'actor_id',
    ACTOR_TYPE: 'actor_type',
    ACTIVITY_DETAILS: 'activity_details',
    METADATA: 'metadata',
    SESSION_ID: 'session_id',
    IP_ADDRESS: 'ip_address',
    USER_AGENT: 'user_agent',
    CHANGES: 'changes',
    BEFORE_VALUES: 'before_values',
    AFTER_VALUES: 'after_values',
  },

  // ============================================================================
  // AGENT FIELDS
  // ============================================================================
  
  // ============================================================================
  // ORGANIZATION FIELDS
  // ============================================================================
  
  Organization: {
    ORGANIZATION_ID: 'organization_id',
    BASIC_INFO: 'basic_info',
    DESCRIPTION: 'description',
    NAME: 'name',
    DISPLAY_NAME: 'display_name',
    INDUSTRY: 'industry',
    ORGANIZATION_SIZE: 'organization_size',
    WEBSITE: 'website',
    LOGO_URL: 'logo_url',
    BILLING_CONFIG: 'billing_config',
    PLAN: 'plan',
    BILLING_CYCLE: 'billing_cycle',
    SSO_CONFIG: 'sso_config',
    ORGANIZATION_STATUS: 'organization_status',
  },
  
  // ============================================================================
  // USER PROFILE FIELDS
  // ============================================================================
  
  UserProfile: {
    USER_ID: 'user_id',
    BASIC_INFO: 'basic_info',
    DISPLAY_NAME: 'display_name',
    EMAIL: 'email',
    FIRST_NAME: 'first_name',
    LAST_NAME: 'last_name',
    JOB_TITLE: 'job_title',
    PHONE: 'phone',
    PROFILE_PICTURE_URL: 'profile_picture_url',
    BIO: 'bio',
    PREFERENCES: 'preferences',
    TIMEZONE: 'timezone',
    LANGUAGE: 'language',
    THEME: 'theme',
    NOTIFICATIONS: 'notifications',
    ONBOARDING_STATUS: 'onboarding_status',
    ONBOARDING_COMPLETED: 'completed',
    COMPLETED_AT: 'completed_at',
    STEPS_COMPLETED: 'steps_completed',
    VERIFICATION_STATUS: 'verification_status',
    EMAIL_VERIFIED: 'email_verified',
    EMAIL_VERIFIED_AT: 'email_verified_at',
    PHONE_VERIFIED: 'phone_verified',
    PHONE_VERIFIED_AT: 'phone_verified_at',
    PHONE_VERIFICATION_CODE: 'phone_verification_code',
    PHONE_VERIFICATION_EXPIRES: 'phone_verification_expires',
    DEFAULT_ORGANIZATION_ID: 'default_organization_id',
    CURRENT_PROJECT: 'current_project',
    CURRENT_AGENT: 'current_agent',
  },
  
  // ============================================================================
  // PROJECT FIELDS
  // ============================================================================
  
  Project: {
    PROJECT_ID: 'project_id',
    PROJECT_INFO: 'project_info',
    NAME: 'name',
    DESCRIPTION: 'description', 
    STATUS: 'status',
    PRIORITY: 'priority',
    TEAM_ACCESS: 'team_access',
    OWNER_ID: 'owner_id',
    COLLABORATORS: 'collaborators',
    VISIBILITY: 'visibility',
  },
  
  // ============================================================================
  // TEAM MEMBERSHIP FIELDS
  // ============================================================================
  
  Membership: {
    // Document ID is now user_id (for active members) or email (for pending invitations)
    // MEMBERSHIP_ID removed - document ID serves this purpose
    ORGANIZATION_ID: 'organization_id',
    USER_ID: 'user_id',
    NAME: 'name',
    EMAIL: 'email',
    ROLE: 'role',
    MEMBERSHIP_STATUS: 'membership_status',
    INVITE_STATUS: 'invite_status',
    INVITED_BY: 'invited_by',
    INVITED_AT: 'invited_at',
    JOINED_AT: 'joined_at',
    ACCESS_METADATA: 'access_metadata',
  },
  
  // ============================================================================
  // PERMISSION FIELDS
  // ============================================================================
  

  Agent: {
    NAME: 'name',
    DESCRIPTION: 'description',
    TYPE: 'type',
    OWNER_ID: 'owner_id',
    ORGANIZATION_ID: 'organization_id',
    DEPLOYMENT_STATUS: 'deployment_status',
    ACTIVE_DEPLOYMENT_ID: 'active_deployment_id',
    SERVICE_URL: 'service_url',
    LAST_DEPLOYED_AT: 'last_deployed_at',
    BASIC_INFO: 'basic_info',
    AGENT_TYPE: 'agent_type',
    INDUSTRY: 'industry',
    USE_CASE: 'use_case',
    SYSTEM_PROMPT: 'system_prompt',
    MODEL: 'model',
    TEMPERATURE: 'temperature',
    MAX_TOKENS: 'max_tokens',
    LIFECYCLE_STATUS: 'lifecycle_status',
    DEVELOPMENT_STAGE: 'development_stage',
    HEALTH_STATUS: 'health_status',
    PERFORMANCE_SUMMARY: 'performance_summary',
  },
  
  // ============================================================================
  // CONVERSATION FIELDS
  // ============================================================================
  
  Conversation: {
    CONVERSATION_ID: 'conversation_id',
    MESSAGE_CONTENT: 'message_content',
    AGENT_RESPONSE: 'agent_response',
    IS_PRODUCTION: 'is_production',
    DEPLOYMENT_TYPE: 'deployment_type',
    TOKENS: 'tokens',
    COST_USD: 'cost_usd',
    CONTEXT: 'context',
    
    // Token subfields
    PROMPT_TOKENS: 'prompt_tokens',
    COMPLETION_TOKENS: 'completion_tokens',
    TOTAL_TOKENS: 'total_tokens',
  },
  
  // ============================================================================
  // BILLING FIELDS
  // ============================================================================
  
  Billing: {
    CREDIT_BALANCE: 'credit_balance',
    TOTAL_CREDITS_PURCHASED: 'total_credits_purchased',
    TOTAL_CREDITS_USED: 'total_credits_used',
    ACCOUNT_STATUS: 'account_status',
    TRANSACTION_TYPE: 'transaction_type',
    AMOUNT: 'amount',
    PAYMENT_PROVIDER: 'payment_provider',
  },
  
  // ============================================================================
  // KNOWLEDGE BASE FIELDS (v3.1.0 Schema)
  // ============================================================================
  
  // Knowledge Library fields (organization-wide knowledge repository)
  KnowledgeLibrary: {
    KNOWLEDGE_ID: 'knowledge_id',
    ORGANIZATION_ID: 'organization_id',
    CONTENT_HASH: 'content_hash',
    KNOWLEDGE_INFO: 'knowledge_info',
    FILENAME: 'filename',
    CONTENT_TYPE: 'content_type',
    SIZE: 'size',
    STORAGE_PATH: 'storage_path',
    ACCESS_CONTROL: 'access_control',
    ACCESS_LEVEL: 'access_level',
    ALLOWED_ROLES: 'allowed_roles',
    ALLOWED_PROJECTS: 'allowed_projects',
    ALLOWED_AGENTS: 'allowed_agents',
    PROCESSING_METADATA: 'processing_metadata',
    INDEXED: 'indexed',
    CHUNK_COUNT: 'chunk_count',
    EMBEDDINGS_ID: 'embeddings_id',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
    CREATED_BY: 'created_by',
    VERSION: 'version'
  },
  
  // Knowledge Assignments removed in v4.0.0 - direct assignment via agent_id field
  
  // Legacy Knowledge fields (deprecated in v3.1.0)
  Knowledge: {
    ORIGINAL_FILENAME: 'original_filename',
    STORAGE_PATH: 'storage_path',
    FILE_SIZE_BYTES: 'file_size_bytes',
    FILE_TYPE: 'file_type',
    CHUNK_COUNT: 'chunk_count',
    TEXT_CONTENT: 'text_content',
    EMBEDDING_VECTOR: 'embedding_vector',
    PAGE_NUMBER: 'page_number',
    CHUNK_INDEX: 'chunk_index',
  },
  
};

/**
 * Standardized status values used across the platform.
 * Updated for v3 enterprise schema.
 */
export const StatusValues = {
  // ============================================================================
  // ORGANIZATION STATUS
  // ============================================================================
  
  Organization: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
    CHURNED: 'churned',
    PENDING_SETUP: 'pending_setup',
  },
  
  // ============================================================================
  // MEMBERSHIP STATUS
  // ============================================================================
  
  Membership: {
    ACTIVE: 'active',
    PENDING: 'pending',
    SUSPENDED: 'suspended',
    REMOVED: 'removed',
  },
  
  // ============================================================================
  // INVITE STATUS
  // ============================================================================
  
  Invite: {
    ACCEPTED: 'accepted',
    PENDING: 'pending',
    EXPIRED: 'expired',
    DECLINED: 'declined',
  },
  
  // ============================================================================
  // USER ROLES
  // ============================================================================
  
  Role: {
    OWNER: 'owner',
    ADMIN: 'admin',
    EDITOR: 'editor',
    VIEWER: 'viewer',
  },
  
  // ============================================================================
  // BILLING PLANS
  // ============================================================================
  
  Plan: {
    FREE: 'free',
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise',
    CUSTOM: 'custom',
  },
  
  // ============================================================================
  // DEPLOYMENT STATUS
  // ============================================================================
  
  Deployment: {
    NOT_DEPLOYED: 'not_deployed',
    DEPLOYING: 'deploying',
    DEPLOYED: 'deployed',
    FAILED: 'failed',
    MAINTENANCE: 'maintenance',
    SCALING: 'scaling',
  },
  
  // ============================================================================
  // AGENT LIFECYCLE STATE (Is the agent accessible?)
  // ============================================================================

  LifecycleState: {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    DELETED: 'deleted',
  },

  // ============================================================================
  // AGENT DEVELOPMENT STAGES (What's the operational status?)
  // ============================================================================

  DevelopmentStage: {
    DRAFT: 'draft',
    DEVELOPMENT: 'development',
    TESTING: 'testing',
    DEPLOYED: 'deployed',
    PUBLISHED: 'published',
  },
  
  // ============================================================================
  // HEALTH STATUS
  // ============================================================================
  
  Health: {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy',
    UNKNOWN: 'unknown',
  },
  
  
  // ============================================================================
  // ACCOUNT STATUS
  // ============================================================================
  
  Account: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
  },
  
  // ============================================================================
  // TRANSACTION TYPES
  // ============================================================================
  
  Transaction: {
    PURCHASE: 'purchase',
    USAGE: 'usage',
    ADJUSTMENT: 'adjustment',
    REFUND: 'refund',
  },
  
  // ============================================================================
  // AGENT TYPES - Updated for v3
  // ============================================================================
  
  AgentType: {
    CUSTOMER_SERVICE: 'customer_service',
    SALES: 'sales',
    SUPPORT: 'support',
    TECHNICAL: 'technical',
    CONTENT: 'content',
    GENERAL: 'general',
    SPECIALIZED: 'specialized',
  },
  
  // ============================================================================
  // INDUSTRIES
  // ============================================================================
  
  Industry: {
    FINANCE: 'finance',
    HEALTHCARE: 'healthcare',
    ECOMMERCE: 'ecommerce',
    EDUCATION: 'education',
    GOVERNMENT: 'government',
    TECHNOLOGY: 'technology',
    OTHER: 'other',
  },
  
  // ============================================================================
  // KNOWLEDGE MANAGEMENT STATUS VALUES (v3.1.0)
  // ============================================================================
  
  // Knowledge access levels
  KnowledgeAccessLevel: {
    PUBLIC: 'public',        // Available to entire organization
    RESTRICTED: 'restricted', // Limited to specific roles/projects/agents
    PRIVATE: 'private'       // Only creator and explicitly allowed users
  },
  
  // Assignment target types
  AssignmentTargetType: {
    PROJECT: 'project',
    AGENT: 'agent'
  },
  
  // Knowledge permissions
  KnowledgePermission: {
    READ: 'read',     // Can view knowledge content
    USE: 'use',       // Can use knowledge in AI responses
    MODIFY: 'modify'  // Can edit knowledge content and assignments
  },

  // Embedding status values (v4.0.0)
  EmbeddingStatus: {
    ACTIVE: 'active',     // Embedding is active and searchable
    ARCHIVED: 'archived', // Embedding is archived (soft deleted)
    DELETED: 'deleted'    // Embedding is marked for deletion
  },

  // Embedding cleanup status values (v4.0.0)
  EmbeddingCleanupStatus: {
    NONE: 'none',         // No cleanup required
    PENDING: 'pending',   // Cleanup requested, waiting for processing
    COMPLETED: 'completed', // Cleanup successfully completed
    FAILED: 'failed'      // Cleanup failed, manual intervention needed
  },
};

/**
 * Standardized error messages for common Firebase operations.
 */
export const ErrorMessages = {
  AGENT_NOT_FOUND: 'Agent not found',
  AGENT_ACCESS_DENIED: 'Access denied: You do not own this agent',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  INSUFFICIENT_CREDITS: 'Insufficient credits for this operation',
  INVALID_COLLECTION_NAME: 'Invalid collection name',
  DEPRECATED_COLLECTION_WARNING: 'Warning: Using deprecated collection name',
};

/**
 * Get list of all current collection names.
 * @returns {string[]} Array of collection names
 */
export const getAllCollections = () => {
  return [
    // Foundation layer
    Collections.ORGANIZATIONS,

    // Core collections
    Collections.AGENTS,
    Collections.AGENT_DEPLOYMENTS,
    Collections.AGENT_SESSIONS,
    Collections.AGENT_USAGE_SUMMARY,
    Collections.PROMPT_TEMPLATES,
    Collections.TEST_CASES,
    Collections.TEST_RUNS,
    Collections.TEST_SESSIONS,
    Collections.MCP_DEPLOYMENTS,
    
    // Conversation intelligence
    Collections.CONVERSATIONS,
    Collections.CONVERSATION_FEEDBACK,
    Collections.COMMUNICATION_LOGS,
    
    // User and billing
    Collections.USER_ACCOUNTS,
    Collections.CREDIT_TRANSACTIONS,
    
    // Knowledge base (v4.0.0 - Simplified knowledge management)
    Collections.KNOWLEDGE_LIBRARY,
    Collections.KNOWLEDGE_EMBEDDINGS,
    Collections.KNOWLEDGE_FILES, // @deprecated but still supported
    Collections.TRAINING_JOBS,
    
    // Integrations
    Collections.INTEGRATION_CHANNELS,
    
    // Monitoring & operations
    Collections.ACTIVITIES,
    Collections.NOTIFICATIONS,
    Collections.FEATURE_FLAGS,
    
    // Security & compliance
    Collections.SECRETS,
    
    // Analytics & reporting
    Collections.BUSINESS_INTELLIGENCE,
  ];
};

/**
 * Get list of deprecated collection names.
 * @returns {string[]} Array of deprecated collection names
 */
export const getDeprecatedCollections = () => {
  return Object.values(Collections.Deprecated);
};

/**
 * Check if collection name is in current valid set.
 * @param {string} collectionName - The collection name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidCollection = (collectionName) => {
  return getAllCollections().includes(collectionName);
};

/**
 * Check if collection name is deprecated.
 * @param {string} collectionName - The collection name to check
 * @returns {boolean} True if deprecated, false otherwise
 */
export const isDeprecatedCollection = (collectionName) => {
  return getDeprecatedCollections().includes(collectionName);
};

/**
 * Validate collection name usage and log warnings for deprecated names.
 * @param {string} collectionName - The collection name to validate
 * @throws {Error} If collection name is not recognized
 */
export const validateCollectionUsage = (collectionName) => {
  if (isDeprecatedCollection(collectionName)) {
    console.warn(`${ErrorMessages.DEPRECATED_COLLECTION_WARNING}: ${collectionName}`);
  } else if (!isValidCollection(collectionName)) {
    throw new Error(`${ErrorMessages.INVALID_COLLECTION_NAME}: ${collectionName}`);
  }
};

/**
 * Get mapping from old collection names to new standardized names.
 * @returns {Object} Dictionary mapping deprecated names to current names
 */
export const getCollectionMapping = () => {
  return {
    [Collections.Deprecated.ALCHEMIST_AGENTS]: Collections.AGENTS,
    [Collections.Deprecated.DEV_CONVERSATIONS]: Collections.CONVERSATIONS,
    [Collections.Deprecated.KNOWLEDGE_BASE_FILES]: Collections.KNOWLEDGE_LIBRARY, // v3.1.0: Redirect to organization-wide library
    [Collections.Deprecated.USER_CREDITS]: Collections.USER_ACCOUNTS,
    [Collections.Deprecated.AGENT_BILLING_SUMMARY]: Collections.AGENT_USAGE_SUMMARY,
    [Collections.Deprecated.MANAGED_ACCOUNTS]: Collections.INTEGRATION_CHANNELS,
    [Collections.Deprecated.WEBHOOK_LOGS]: Collections.COMMUNICATION_LOGS,
    [Collections.Deprecated.KNOWLEDGE_BASE_EMBEDDINGS]: Collections.KNOWLEDGE_EMBEDDINGS,
    // Additional v3.1.0 migration mappings
    [Collections.KNOWLEDGE_FILES]: Collections.KNOWLEDGE_LIBRARY,
  };
};

/**
 * Get the current collection name for a potentially deprecated name.
 * @param {string} collectionName - The collection name (may be deprecated)
 * @returns {string} The current standardized collection name
 */
export const getCurrentCollectionName = (collectionName) => {
  const mapping = getCollectionMapping();
  return mapping[collectionName] || collectionName;
};