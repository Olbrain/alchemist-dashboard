/**
 * Agent Utility Functions
 * 
 * Centralized utilities for handling agent data across the application.
 * Provides consistent data extraction and formatting for agent objects.
 */

/**
 * Standardized Agent Lifecycle State Constants
 * Indicates if the agent is accessible
 */
export const AGENT_LIFECYCLE = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED'
};

/**
 * Standardized Agent Development Stage Constants
 * Indicates the operational status of the agent
 */
export const AGENT_DEVELOPMENT_STAGE = {
  DRAFT: 'DRAFT',
  DEVELOPMENT: 'DEVELOPMENT',
  TESTING: 'TESTING',
  DEPLOYED: 'DEPLOYED',
  PUBLISHED: 'PUBLISHED'
};

/**
 * Legacy AGENT_STATUS - kept for backward compatibility
 * Maps to development stages for existing code
 */
export const AGENT_STATUS = {
  DRAFT: 'DRAFT',
  DEVELOPMENT: 'DEVELOPMENT',
  TESTING: 'TESTING',
  DEPLOYED: 'DEPLOYED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',  // Actually a lifecycle state
  DELETED: 'DELETED'      // Actually a lifecycle state
};

/**
 * Lifecycle state mapping
 */
const LIFECYCLE_MAPPING = {
  'active': AGENT_LIFECYCLE.ACTIVE,
  'archived': AGENT_LIFECYCLE.ARCHIVED,
  'deleted': AGENT_LIFECYCLE.DELETED
};

/**
 * Development stage mapping
 */
const DEVELOPMENT_STAGE_MAPPING = {
  'draft': AGENT_DEVELOPMENT_STAGE.DRAFT,
  'development': AGENT_DEVELOPMENT_STAGE.DEVELOPMENT,
  'testing': AGENT_DEVELOPMENT_STAGE.TESTING,
  'deployed': AGENT_DEVELOPMENT_STAGE.DEPLOYED,
  'published': AGENT_DEVELOPMENT_STAGE.PUBLISHED
};

/**
 * Extract agent name with fallback chain
 * Handles v3 enterprise schema (basic_info.name) and legacy formats
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent name or "Untitled Agent" if not found
 */
export const getAgentName = (agent) => {
  if (!agent) {
    console.warn('getAgentName: Agent object is null or undefined');
    return 'Untitled Agent';
  }

  // Try v3 enterprise schema first: basic_info.name
  if (agent.basic_info?.name && typeof agent.basic_info.name === 'string' && agent.basic_info.name.trim()) {
    return agent.basic_info.name.trim();
  }

  // Try legacy flat structure: name
  if (agent.name && typeof agent.name === 'string' && agent.name.trim()) {
    return agent.name.trim();
  }

  // Try alternative field names
  if (agent.agent_name && typeof agent.agent_name === 'string' && agent.agent_name.trim()) {
    return agent.agent_name.trim();
  }

  // Log missing name for debugging
  console.warn('getAgentName: No valid name found for agent:', {
    id: agent.id || agent.agent_id,
    hasBasicInfo: !!agent.basic_info,
    basicInfoName: agent.basic_info?.name,
    topLevelName: agent.name,
    allFields: Object.keys(agent)
  });

  return 'Untitled Agent';
};

/**
 * Extract agent description with fallback chain
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent description or empty string if not found
 */
export const getAgentDescription = (agent) => {
  if (!agent) return '';

  // Try v3 enterprise schema first: basic_info.description
  if (agent.basic_info?.description && typeof agent.basic_info.description === 'string') {
    return agent.basic_info.description.trim();
  }

  // Try legacy flat structure: description
  if (agent.description && typeof agent.description === 'string') {
    return agent.description.trim();
  }

  return '';
};

/**
 * Extract agent type with fallback chain
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent type or 'general' if not found
 */
export const getAgentType = (agent) => {
  if (!agent) return 'general';

  // Try v3 enterprise schema first: basic_info.agent_type
  if (agent.basic_info?.agent_type && typeof agent.basic_info.agent_type === 'string') {
    return agent.basic_info.agent_type;
  }

  // Try legacy flat structure: type
  if (agent.type && typeof agent.type === 'string') {
    return agent.type;
  }

  // Try alternative field names
  if (agent.agent_type && typeof agent.agent_type === 'string') {
    return agent.agent_type;
  }

  return 'general';
};

/**
 * Extract agent lifecycle state
 * Returns one of: ACTIVE, ARCHIVED, DELETED
 *
 * @param {Object} agent - Agent object
 * @returns {string} Standardized lifecycle state from AGENT_LIFECYCLE enum
 */
export const getAgentLifecycle = (agent) => {
  if (!agent) return AGENT_LIFECYCLE.ACTIVE;

  // Check lifecycle_state field
  if (agent.lifecycle_state && LIFECYCLE_MAPPING[agent.lifecycle_state.toLowerCase()]) {
    return LIFECYCLE_MAPPING[agent.lifecycle_state.toLowerCase()];
  }

  // Legacy: check old 'status' field for archived/deleted
  if (agent.status) {
    const lowerStatus = agent.status.toLowerCase();
    if (lowerStatus === 'archived') return AGENT_LIFECYCLE.ARCHIVED;
    if (lowerStatus === 'deleted') return AGENT_LIFECYCLE.DELETED;
  }

  // Default to ACTIVE
  return AGENT_LIFECYCLE.ACTIVE;
};

/**
 * Extract agent development stage
 * Returns one of: DRAFT, DEVELOPMENT, TESTING, DEPLOYED, PUBLISHED
 *
 * @param {Object} agent - Agent object
 * @returns {string} Standardized development stage from AGENT_DEVELOPMENT_STAGE enum
 */
export const getAgentDevelopmentStage = (agent) => {
  if (!agent) return AGENT_DEVELOPMENT_STAGE.DRAFT;

  // Check development_stage field
  if (agent.development_stage && DEVELOPMENT_STAGE_MAPPING[agent.development_stage.toLowerCase()]) {
    return DEVELOPMENT_STAGE_MAPPING[agent.development_stage.toLowerCase()];
  }

  // Legacy: check old 'status' field for development stages
  if (agent.status) {
    const lowerStatus = agent.status.toLowerCase();
    if (DEVELOPMENT_STAGE_MAPPING[lowerStatus]) {
      return DEVELOPMENT_STAGE_MAPPING[lowerStatus];
    }
    // Map legacy 'active' to DRAFT
    if (lowerStatus === 'active') return AGENT_DEVELOPMENT_STAGE.DRAFT;
  }

  // Default to DRAFT
  return AGENT_DEVELOPMENT_STAGE.DRAFT;
};

/**
 * Legacy function: Extract standardized agent status
 * DEPRECATED: Use getAgentLifecycle() and getAgentDevelopmentStage() instead
 *
 * Returns development stage, but returns ARCHIVED/DELETED for non-active agents
 * Kept for backward compatibility with existing code
 *
 * @param {Object} agent - Agent object
 * @returns {string} Standardized agent status from AGENT_STATUS enum
 */
export const getAgentStatus = (agent) => {
  if (!agent) return AGENT_STATUS.DRAFT;

  // First check lifecycle - if archived or deleted, return that
  const lifecycle = getAgentLifecycle(agent);
  if (lifecycle === AGENT_LIFECYCLE.ARCHIVED) return AGENT_STATUS.ARCHIVED;
  if (lifecycle === AGENT_LIFECYCLE.DELETED) return AGENT_STATUS.DELETED;

  // Otherwise return development stage
  return getAgentDevelopmentStage(agent);
};

/**
 * Get Material-UI color variant for standardized agent status
 *
 * @param {string} status - Standardized status value from AGENT_STATUS enum
 * @returns {string} Material-UI color variant (success, error, warning, info, default, secondary)
 */
export const getStatusColor = (status) => {
  switch (status) {
    case AGENT_STATUS.PUBLISHED:
    case AGENT_DEVELOPMENT_STAGE.PUBLISHED:
      return 'success'; // Green - published and operational

    case AGENT_STATUS.DEPLOYED:
    case AGENT_DEVELOPMENT_STAGE.DEPLOYED:
      return 'success'; // Green - deployed and operational

    case AGENT_STATUS.TESTING:
    case AGENT_DEVELOPMENT_STAGE.TESTING:
      return 'info'; // Blue - under testing

    case AGENT_STATUS.DEVELOPMENT:
    case AGENT_DEVELOPMENT_STAGE.DEVELOPMENT:
      return 'warning'; // Orange - in development

    case AGENT_STATUS.ARCHIVED:
    case AGENT_LIFECYCLE.ARCHIVED:
    case AGENT_STATUS.DELETED:
    case AGENT_LIFECYCLE.DELETED:
      return 'error'; // Red - inactive/removed

    case AGENT_STATUS.DRAFT:
    case AGENT_DEVELOPMENT_STAGE.DRAFT:
    default:
      return 'default'; // Gray - default state
  }
};

/**
 * Get user-friendly status label for standardized agent status
 *
 * @param {string} status - Standardized status value from AGENT_STATUS or AGENT_DEVELOPMENT_STAGE enum
 * @returns {string} User-friendly status label
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case AGENT_STATUS.DRAFT:
    case AGENT_DEVELOPMENT_STAGE.DRAFT:
      return 'Draft';
    case AGENT_STATUS.DEVELOPMENT:
    case AGENT_DEVELOPMENT_STAGE.DEVELOPMENT:
      return 'Development';
    case AGENT_STATUS.TESTING:
    case AGENT_DEVELOPMENT_STAGE.TESTING:
      return 'Testing';
    case AGENT_STATUS.DEPLOYED:
    case AGENT_DEVELOPMENT_STAGE.DEPLOYED:
      return 'Deployed';
    case AGENT_STATUS.PUBLISHED:
    case AGENT_DEVELOPMENT_STAGE.PUBLISHED:
      return 'Published';
    case AGENT_STATUS.ARCHIVED:
    case AGENT_LIFECYCLE.ARCHIVED:
      return 'Archived';
    case AGENT_STATUS.DELETED:
    case AGENT_LIFECYCLE.DELETED:
      return 'Deleted';
    default:
      // Handle any unmapped legacy values
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }
};

/**
 * Extract agent industry with fallback chain
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent industry or empty string if not found
 */
export const getAgentIndustry = (agent) => {
  if (!agent) return '';

  // Try v3 enterprise schema first: basic_info.industry
  if (agent.basic_info?.industry && typeof agent.basic_info.industry === 'string') {
    return agent.basic_info.industry;
  }

  // Try legacy flat structure: industry
  if (agent.industry && typeof agent.industry === 'string') {
    return agent.industry;
  }

  return '';
};

/**
 * Extract agent use case with fallback chain
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent use case or empty string if not found
 */
export const getAgentUseCase = (agent) => {
  if (!agent) return '';

  // Try v3 enterprise schema first: basic_info.use_case
  if (agent.basic_info?.use_case && typeof agent.basic_info.use_case === 'string') {
    return agent.basic_info.use_case;
  }

  // Try legacy flat structure: use_case
  if (agent.use_case && typeof agent.use_case === 'string') {
    return agent.use_case;
  }

  return '';
};

/**
 * Extract agent model with fallback chain
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent model or 'gpt-4o' if not found
 */
export const getAgentModel = (agent) => {
  if (!agent) return 'gpt-4o';

  // Try legacy flat structure: model
  if (agent.model && typeof agent.model === 'string') {
    return agent.model;
  }

  return 'gpt-4o';
};

/**
 * Extract agent system prompt with fallback chain
 * 
 * @param {Object} agent - Agent object
 * @returns {string} Agent system prompt or empty string if not found
 */
export const getAgentSystemPrompt = (agent) => {
  if (!agent) return '';

  // Try legacy flat structure: system_prompt
  if (agent.system_prompt && typeof agent.system_prompt === 'string') {
    return agent.system_prompt;
  }

  // Try alternative field names
  if (agent.instructions && typeof agent.instructions === 'string') {
    return agent.instructions;
  }

  return '';
};

/**
 * Check if agent has valid nested v3 structure
 * 
 * @param {Object} agent - Agent object
 * @returns {boolean} True if agent has v3 nested structure
 */
export const hasV3Structure = (agent) => {
  if (!agent) return false;
  
  return !!(agent.basic_info && agent.lifecycle_status);
};

/**
 * Get a standardized agent object with consistent field access
 * 
 * @param {Object} agent - Raw agent object
 * @returns {Object} Standardized agent object with consistent field access
 */
export const getStandardizedAgent = (agent) => {
  if (!agent) return null;

  return {
    id: agent.id || agent.agent_id,
    agent_id: agent.agent_id || agent.id,
    name: getAgentName(agent),
    description: getAgentDescription(agent),
    type: getAgentType(agent),
    status: getAgentStatus(agent), // Now returns standardized AGENT_STATUS enum value
    industry: getAgentIndustry(agent),
    use_case: getAgentUseCase(agent),
    model: getAgentModel(agent),
    system_prompt: getAgentSystemPrompt(agent),
    organization_id: agent.organization_id,
    owner_id: agent.owner_id,
    project_id: agent.project_id,
    created_at: agent.created_at,
    updated_at: agent.updated_at,
    hasV3Structure: hasV3Structure(agent),
    // Keep original object for fallback
    _original: agent
  };
};

/**
 * Validate agent data structure and log issues
 * 
 * @param {Object} agent - Agent object to validate
 * @returns {Object} Validation result with issues found
 */
export const validateAgentData = (agent) => {
  const issues = [];
  
  if (!agent) {
    issues.push('Agent object is null or undefined');
    return { isValid: false, issues };
  }

  // Check required fields
  if (!agent.id && !agent.agent_id) {
    issues.push('Missing agent ID');
  }

  if (!getAgentName(agent) || getAgentName(agent) === 'Untitled Agent') {
    issues.push('Missing or invalid agent name');
  }

  if (!agent.organization_id) {
    issues.push('Missing organization_id');
  }

  if (!agent.owner_id) {
    issues.push('Missing owner_id');
  }

  // Check data structure
  if (!hasV3Structure(agent)) {
    issues.push('Agent does not have v3 nested structure');
  }

  return {
    isValid: issues.length === 0,
    issues,
    hasV3Structure: hasV3Structure(agent)
  };
};