/**
 * Client-side Schema Validation Utilities
 * 
 * Provides validation functions for Alchemist v3.1.0 Enterprise Schema
 * to ensure data integrity before sending to Firestore
 * 
 * v3.1.0 adds organization-wide knowledge management layer with multi-level assignment
 */

// Enum definitions from v3.1.0 schema
export const SCHEMA_ENUMS = {
  AGENT_TYPE: ['customer_service', 'sales', 'support', 'technical', 'content', 'general', 'specialized'],
  INDUSTRY: ['finance', 'healthcare', 'ecommerce', 'education', 'government', 'technology', 'other'],
  MODEL: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4o', 'gpt-4o-mini', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-pro'],
  DEVELOPMENT_STAGE: ['draft', 'development', 'testing', 'deployed', 'archived', 'deprecated'],
  DEPLOYMENT_STATUS: ['not_deployed', 'deploying', 'deployed', 'failed', 'maintenance', 'scaling'],
  HEALTH_STATUS: ['healthy', 'degraded', 'unhealthy', 'unknown'],
  RESPONSE_STYLE: ['detailed', 'concise', 'conversational', 'formal', 'technical'],
  PERSONALITY_TRAITS: ['professional', 'friendly', 'technical', 'empathetic', 'concise', 'detailed', 'creative'],
  PROJECT_STATUS: ['active', 'archived', 'deleted'],
  PROJECT_PRIORITY: ['low', 'medium', 'high', 'critical'],
  PROJECT_VISIBILITY: ['organization', 'team', 'private'],
  
  // v3.1.0 Knowledge Management Enums
  KNOWLEDGE_ACCESS_LEVEL: ['public', 'restricted', 'private'],
  ASSIGNMENT_TARGET_TYPE: ['project', 'agent'],
  KNOWLEDGE_PERMISSION: ['read', 'use', 'modify'],
  
};

// Default values for schema fields
export const SCHEMA_DEFAULTS = {
  AGENT: {
    LIFECYCLE_STATUS: {
      development_stage: 'draft',
      deployment_status: 'not_deployed',
      health_status: 'unknown'
    },
    PERFORMANCE_SUMMARY: {
      total_conversations: 0,
      success_rate: 0.0,
      cost_per_interaction: 0.0,
      escalation_rate: 0.0
    },
    DATA_PROTECTION_ENABLED: false
  },
  PROJECT: {
    PROJECT_INFO: {
      status: 'active',
      priority: 'medium'
    },
    TEAM_ACCESS: {
      visibility: 'organization',
      collaborators: []
    }
  },
  
  // v3.1.0 Knowledge Management Defaults
  KNOWLEDGE_LIBRARY: {
    ACCESS_CONTROL: {
      access_level: 'restricted',
      allowed_roles: [],
      allowed_projects: [],
      allowed_agents: []
    },
    PROCESSING_METADATA: {
      indexed: false,
      chunk_count: 0,
      embeddings_id: null
    }
  },
  
  KNOWLEDGE_ASSIGNMENT: {
    ACCESS_PERMISSIONS: {
      permissions: ['read', 'use'],
      priority: 1,
      context_weight: 1.0
    }
  }
};

// Validation functions
export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true };
};

export const validateString = (value, fieldName, minLength = 1, maxLength = 500) => {
  if (typeof value !== 'string') {
    return { valid: false, message: `${fieldName} must be a string` };
  }
  if (value.length < minLength) {
    return { valid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }
  if (value.length > maxLength) {
    return { valid: false, message: `${fieldName} must be no more than ${maxLength} characters` };
  }
  return { valid: true };
};

export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, message: `${fieldName} must be a number` };
  }
  if (min !== null && value < min) {
    return { valid: false, message: `${fieldName} must be at least ${min}` };
  }
  if (max !== null && value > max) {
    return { valid: false, message: `${fieldName} must be no more than ${max}` };
  }
  return { valid: true };
};

export const validateEnum = (value, fieldName, enumValues) => {
  if (!enumValues.includes(value)) {
    return { 
      valid: false, 
      message: `${fieldName} must be one of: ${enumValues.join(', ')}` 
    };
  }
  return { valid: true };
};

export const validateArray = (value, fieldName, itemValidator = null) => {
  if (!Array.isArray(value)) {
    return { valid: false, message: `${fieldName} must be an array` };
  }
  
  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const itemResult = itemValidator(value[i], `${fieldName}[${i}]`);
      if (!itemResult.valid) {
        return itemResult;
      }
    }
  }
  
  return { valid: true };
};

// Agent-specific validation functions
export const validateAgentBasicInfo = (basicInfo) => {
  const errors = [];
  
  // Required fields
  const nameValidation = validateRequired(basicInfo.name, 'Agent Name');
  if (!nameValidation.valid) errors.push(nameValidation.message);
  else {
    const nameStringValidation = validateString(basicInfo.name, 'Agent Name', 2, 100);
    if (!nameStringValidation.valid) errors.push(nameStringValidation.message);
  }
  
  const typeValidation = validateRequired(basicInfo.agent_type, 'Agent Type');
  if (!typeValidation.valid) errors.push(typeValidation.message);
  else {
    const typeEnumValidation = validateEnum(basicInfo.agent_type, 'Agent Type', SCHEMA_ENUMS.AGENT_TYPE);
    if (!typeEnumValidation.valid) errors.push(typeEnumValidation.message);
  }
  
  // Optional fields
  if (basicInfo.description) {
    const descValidation = validateString(basicInfo.description, 'Description', 0, 500);
    if (!descValidation.valid) errors.push(descValidation.message);
  }
  
  if (basicInfo.industry) {
    const industryValidation = validateEnum(basicInfo.industry, 'Industry', SCHEMA_ENUMS.INDUSTRY);
    if (!industryValidation.valid) errors.push(industryValidation.message);
  }
  
  if (basicInfo.use_case) {
    const useCaseValidation = validateString(basicInfo.use_case, 'Use Case', 0, 200);
    if (!useCaseValidation.valid) errors.push(useCaseValidation.message);
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateAgentAIConfiguration = (aiConfig) => {
  const errors = [];
  
  // Required fields
  const promptValidation = validateRequired(aiConfig.system_prompt, 'System Prompt');
  if (!promptValidation.valid) errors.push(promptValidation.message);
  else {
    const promptStringValidation = validateString(aiConfig.system_prompt, 'System Prompt', 10, 5000);
    if (!promptStringValidation.valid) errors.push(promptStringValidation.message);
  }
  
  const modelValidation = validateRequired(aiConfig.model, 'Model');
  if (!modelValidation.valid) errors.push(modelValidation.message);
  else {
    const modelEnumValidation = validateEnum(aiConfig.model, 'Model', SCHEMA_ENUMS.MODEL);
    if (!modelEnumValidation.valid) errors.push(modelEnumValidation.message);
  }
  
  const tempValidation = validateRequired(aiConfig.temperature, 'Temperature');
  if (!tempValidation.valid) errors.push(tempValidation.message);
  else {
    const tempNumberValidation = validateNumber(aiConfig.temperature, 'Temperature', 0.0, 2.0);
    if (!tempNumberValidation.valid) errors.push(tempNumberValidation.message);
  }
  
  const tokensValidation = validateRequired(aiConfig.max_tokens, 'Max Tokens');
  if (!tokensValidation.valid) errors.push(tokensValidation.message);
  else {
    const tokensNumberValidation = validateNumber(aiConfig.max_tokens, 'Max Tokens', 100, 8000);
    if (!tokensNumberValidation.valid) errors.push(tokensNumberValidation.message);
  }
  
  // Optional fields
  if (aiConfig.response_style) {
    const styleValidation = validateEnum(aiConfig.response_style, 'Response Style', SCHEMA_ENUMS.RESPONSE_STYLE);
    if (!styleValidation.valid) errors.push(styleValidation.message);
  }
  
  if (aiConfig.personality_traits) {
    const traitsValidation = validateArray(aiConfig.personality_traits, 'Personality Traits', 
      (trait) => validateEnum(trait, 'Personality Trait', SCHEMA_ENUMS.PERSONALITY_TRAITS));
    if (!traitsValidation.valid) errors.push(traitsValidation.message);
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateAgentLifecycleStatus = (lifecycleStatus) => {
  const errors = [];
  
  // Required fields
  const stageValidation = validateRequired(lifecycleStatus.development_stage, 'Development Stage');
  if (!stageValidation.valid) errors.push(stageValidation.message);
  else {
    const stageEnumValidation = validateEnum(lifecycleStatus.development_stage, 'Development Stage', SCHEMA_ENUMS.DEVELOPMENT_STAGE);
    if (!stageEnumValidation.valid) errors.push(stageEnumValidation.message);
  }
  
  const deploymentValidation = validateRequired(lifecycleStatus.deployment_status, 'Deployment Status');
  if (!deploymentValidation.valid) errors.push(deploymentValidation.message);
  else {
    const deploymentEnumValidation = validateEnum(lifecycleStatus.deployment_status, 'Deployment Status', SCHEMA_ENUMS.DEPLOYMENT_STATUS);
    if (!deploymentEnumValidation.valid) errors.push(deploymentEnumValidation.message);
  }
  
  const healthValidation = validateRequired(lifecycleStatus.health_status, 'Health Status');
  if (!healthValidation.valid) errors.push(healthValidation.message);
  else {
    const healthEnumValidation = validateEnum(lifecycleStatus.health_status, 'Health Status', SCHEMA_ENUMS.HEALTH_STATUS);
    if (!healthEnumValidation.valid) errors.push(healthEnumValidation.message);
  }
  
  return { valid: errors.length === 0, errors };
};

// Complete agent validation
export const validateAgentData = (agentData) => {
  const errors = [];
  
  // Required top-level fields
  if (!agentData.organization_id) errors.push('Organization ID is required');
  if (!agentData.owner_id) errors.push('Owner ID is required');
  if (!agentData.project_id) errors.push('Project ID is required');
  
  // Validate nested objects
  if (!agentData.basic_info) {
    errors.push('Basic info is required');
  } else {
    const basicInfoValidation = validateAgentBasicInfo(agentData.basic_info);
    if (!basicInfoValidation.valid) {
      errors.push(...basicInfoValidation.errors);
    }
  }
    
  if (!agentData.lifecycle_status) {
    errors.push('Lifecycle status is required');
  } else {
    const lifecycleValidation = validateAgentLifecycleStatus(agentData.lifecycle_status);
    if (!lifecycleValidation.valid) {
      errors.push(...lifecycleValidation.errors);
    }
  }
  
  return { valid: errors.length === 0, errors };
};

// Project-specific validation functions
export const validateProjectBasicInfo = (projectInfo) => {
  const errors = [];
  
  // Required fields
  const nameValidation = validateRequired(projectInfo.name, 'Project Name');
  if (!nameValidation.valid) errors.push(nameValidation.message);
  else {
    const nameStringValidation = validateString(projectInfo.name, 'Project Name', 2, 100);
    if (!nameStringValidation.valid) errors.push(nameStringValidation.message);
  }
  
  // Optional fields with validation
  if (projectInfo.description) {
    const descValidation = validateString(projectInfo.description, 'Project Description', 0, 500);
    if (!descValidation.valid) errors.push(descValidation.message);
  }
  
  if (projectInfo.status) {
    const statusValidation = validateEnum(projectInfo.status, 'Project Status', SCHEMA_ENUMS.PROJECT_STATUS);
    if (!statusValidation.valid) errors.push(statusValidation.message);
  }
  
  if (projectInfo.priority) {
    const priorityValidation = validateEnum(projectInfo.priority, 'Project Priority', SCHEMA_ENUMS.PROJECT_PRIORITY);
    if (!priorityValidation.valid) errors.push(priorityValidation.message);
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateProjectTeamAccess = (teamAccess) => {
  const errors = [];
  
  // Required fields
  if (!teamAccess.owner_id) errors.push('Project owner is required');
  
  // Optional fields with validation
  if (teamAccess.visibility) {
    const visibilityValidation = validateEnum(teamAccess.visibility, 'Project Visibility', SCHEMA_ENUMS.PROJECT_VISIBILITY);
    if (!visibilityValidation.valid) errors.push(visibilityValidation.message);
  }
  
  if (teamAccess.collaborators) {
    const collaboratorsValidation = validateArray(teamAccess.collaborators, 'Collaborators', 
      (collab) => validateString(collab, 'Collaborator ID', 1, 50));
    if (!collaboratorsValidation.valid) errors.push(collaboratorsValidation.message);
  }
  
  return { valid: errors.length === 0, errors };
};

// Complete project validation
export const validateProjectData = (projectData) => {
  const errors = [];
  
  // Required top-level fields
  if (!projectData.organization_id) errors.push('Organization ID is required');
  if (!projectData.project_id) errors.push('Project ID is required');
  
  // Validate nested objects
  if (!projectData.project_info) {
    errors.push('Project info is required');
  } else {
    const projectInfoValidation = validateProjectBasicInfo(projectData.project_info);
    if (!projectInfoValidation.valid) {
      errors.push(...projectInfoValidation.errors);
    }
  }
  
  if (!projectData.team_access) {
    errors.push('Team access is required');
  } else {
    const teamAccessValidation = validateProjectTeamAccess(projectData.team_access);
    if (!teamAccessValidation.valid) {
      errors.push(...teamAccessValidation.errors);
    }
  }
  
  return { valid: errors.length === 0, errors };
};

// Utility functions for form validation
export const getFieldError = (validationResult, fieldName) => {
  if (!validationResult || validationResult.valid) return null;
  
  const error = validationResult.errors?.find(err => 
    err.toLowerCase().includes(fieldName.toLowerCase())
  );
  
  return error || null;
};

export const hasFieldError = (validationResult, fieldName) => {
  return getFieldError(validationResult, fieldName) !== null;
};

// Generate system prompt based on agent type
// ============================================================================
// v3.1.0 Knowledge Management Validation Functions
// ============================================================================

/**
 * Validate Knowledge Library data structure
 */
export const validateKnowledgeLibraryData = (knowledgeData) => {
  const errors = [];
  
  // Required top-level fields
  if (!knowledgeData.organization_id) errors.push('Organization ID is required');
  if (!knowledgeData.content_hash) errors.push('Content hash is required');
  
  // Validate knowledge_info structure
  if (!knowledgeData.knowledge_info) {
    errors.push('Knowledge info is required');
  } else {
    if (!knowledgeData.knowledge_info.filename) errors.push('Filename is required');
    if (!knowledgeData.knowledge_info.content_type) errors.push('Content type is required');
    if (typeof knowledgeData.knowledge_info.size !== 'number') errors.push('File size must be a number');
  }
  
  // Validate access_control if provided
  if (knowledgeData.access_control) {
    const accessControl = knowledgeData.access_control;
    if (accessControl.access_level && !SCHEMA_ENUMS.KNOWLEDGE_ACCESS_LEVEL.includes(accessControl.access_level)) {
      errors.push(`Invalid access level: ${accessControl.access_level}`);
    }
    if (accessControl.allowed_roles && !Array.isArray(accessControl.allowed_roles)) {
      errors.push('Allowed roles must be an array');
    }
    if (accessControl.allowed_projects && !Array.isArray(accessControl.allowed_projects)) {
      errors.push('Allowed projects must be an array');
    }
    if (accessControl.allowed_agents && !Array.isArray(accessControl.allowed_agents)) {
      errors.push('Allowed agents must be an array');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate Knowledge Assignment data structure
 */
export const validateKnowledgeAssignmentData = (assignmentData) => {
  const errors = [];
  
  // Required top-level fields
  if (!assignmentData.organization_id) errors.push('Organization ID is required');
  if (!assignmentData.knowledge_id) errors.push('Knowledge ID is required');
  
  // Validate assignment_target
  if (!assignmentData.assignment_target) {
    errors.push('Assignment target is required');
  } else {
    const target = assignmentData.assignment_target;
    if (!target.target_type || !SCHEMA_ENUMS.ASSIGNMENT_TARGET_TYPE.includes(target.target_type)) {
      errors.push(`Invalid target type: ${target.target_type}`);
    }
    if (!target.target_id) {
      errors.push('Target ID is required');
    }
    if (target.target_type === 'agent' && !target.project_id) {
      errors.push('Project ID is required for agent assignments');
    }
  }
  
  // Validate access_permissions if provided
  if (assignmentData.access_permissions) {
    const permissions = assignmentData.access_permissions;
    if (permissions.permissions && Array.isArray(permissions.permissions)) {
      for (const permission of permissions.permissions) {
        if (!SCHEMA_ENUMS.KNOWLEDGE_PERMISSION.includes(permission)) {
          errors.push(`Invalid permission: ${permission}`);
        }
      }
    }
    if (permissions.priority && typeof permissions.priority !== 'number') {
      errors.push('Priority must be a number');
    }
    if (permissions.context_weight && typeof permissions.context_weight !== 'number') {
      errors.push('Context weight must be a number');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate access control structure for knowledge library
 */
export const validateAccessControl = (accessControl) => {
  const errors = [];
  
  if (accessControl.access_level && !SCHEMA_ENUMS.KNOWLEDGE_ACCESS_LEVEL.includes(accessControl.access_level)) {
    errors.push(`Invalid access level: ${accessControl.access_level}`);
  }
  
  if (accessControl.allowed_roles && !Array.isArray(accessControl.allowed_roles)) {
    errors.push('Allowed roles must be an array');
  }
  
  if (accessControl.allowed_projects && !Array.isArray(accessControl.allowed_projects)) {
    errors.push('Allowed projects must be an array');
  }
  
  if (accessControl.allowed_agents && !Array.isArray(accessControl.allowed_agents)) {
    errors.push('Allowed agents must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Check if user has knowledge access based on assignment and permissions
 */
export const checkKnowledgeAccess = (knowledgeItem, userContext, requiredPermission = 'read') => {
  // If no access control, default to restricted
  if (!knowledgeItem.access_control) {
    return false;
  }
  
  const accessControl = knowledgeItem.access_control;
  
  // Check access level
  if (accessControl.access_level === 'public') {
    return true; // Public access for entire organization
  }
  
  if (accessControl.access_level === 'private') {
    return userContext.user_id === knowledgeItem.created_by;
  }
  
  // For restricted access, check specific permissions
  if (accessControl.access_level === 'restricted') {
    // Check role-based access
    if (accessControl.allowed_roles && accessControl.allowed_roles.includes(userContext.role)) {
      return true;
    }
    
    // Check project-based access
    if (accessControl.allowed_projects && userContext.project_id && 
        accessControl.allowed_projects.includes(userContext.project_id)) {
      return true;
    }
    
    // Check agent-based access
    if (accessControl.allowed_agents && userContext.agent_id && 
        accessControl.allowed_agents.includes(userContext.agent_id)) {
      return true;
    }
  }
  
  return false;
};

export const generateSystemPrompt = (agentType, agentName, description = '') => {
  const prompts = {
    customer_service: `You are ${agentName}, a helpful customer service agent. ${description}\n\nYour role is to:\n- Assist customers with their questions and concerns\n- Provide accurate information about products and services\n- Resolve issues in a friendly and professional manner\n- Escalate complex problems when necessary\n\nAlways be polite, patient, and solution-focused in your responses.`,
    
    sales: `You are ${agentName}, a skilled sales assistant. ${description}\n\nYour role is to:\n- Help customers find the right products or services\n- Provide detailed product information and comparisons\n- Guide customers through the purchase process\n- Build rapport and trust with potential customers\n\nAlways be helpful, knowledgeable, and customer-focused in your approach.`,
    
    support: `You are ${agentName}, a technical support specialist. ${description}\n\nYour role is to:\n- Help users troubleshoot technical issues\n- Provide step-by-step solutions to problems\n- Explain technical concepts in simple terms\n- Document and escalate complex issues\n\nAlways be patient, thorough, and clear in your explanations.`,
    
    technical: `You are ${agentName}, a technical expert. ${description}\n\nYour role is to:\n- Provide detailed technical information and guidance\n- Help with complex technical problems and solutions\n- Explain technical concepts and best practices\n- Assist with implementation and troubleshooting\n\nAlways be precise, comprehensive, and technically accurate.`,
    
    content: `You are ${agentName}, a content creation specialist. ${description}\n\nYour role is to:\n- Create engaging and relevant content\n- Provide writing assistance and suggestions\n- Help with content planning and strategy\n- Ensure content quality and consistency\n\nAlways be creative, clear, and audience-focused.`,
    
    general: `You are ${agentName}, a helpful AI assistant. ${description}\n\nYour role is to:\n- Assist with a wide variety of tasks and questions\n- Provide accurate and helpful information\n- Adapt your communication style to user needs\n- Be supportive and professional in all interactions\n\nAlways be helpful, informative, and user-focused.`,
    
    specialized: `You are ${agentName}, a specialized AI assistant. ${description}\n\nYour role is to:\n- Provide expert assistance in your area of specialization\n- Offer detailed, accurate information and guidance\n- Adapt to specific user needs and requirements\n- Maintain high quality standards in your responses\n\nAlways be knowledgeable, professional, and focused on excellence.`
  };
  
  return prompts[agentType] || prompts.general;
};

// Simple data protection validation - just boolean
export const validateDataProtectionEnabled = (dataProtectionEnabled) => {
  if (dataProtectionEnabled !== undefined && typeof dataProtectionEnabled !== 'boolean') {
    return { 
      valid: false, 
      errors: ['Data protection enabled must be a boolean value'] 
    };
  }
  return { valid: true, errors: [] };
};

// Helper function to check if data protection setting is valid
export const isDataProtectionValid = (agent) => {
  const validation = validateDataProtectionEnabled(agent?.data_protection_enabled);
  return validation.valid;
};

const schemaValidation = {
  SCHEMA_ENUMS,
  SCHEMA_DEFAULTS,
  validateAgentData,
  validateProjectData,
  validateAgentBasicInfo,
  validateAgentAIConfiguration,
  validateAgentLifecycleStatus,
  validateProjectBasicInfo,
  validateProjectTeamAccess,
  getFieldError,
  hasFieldError,
  generateSystemPrompt,
  
  // v3.1.0 Knowledge Management Functions
  validateKnowledgeLibraryData,
  validateKnowledgeAssignmentData,
  validateAccessControl,
  checkKnowledgeAccess,
  
  // Data Protection Functions
  validateDataProtectionEnabled,
  isDataProtectionValid
};

export default schemaValidation;