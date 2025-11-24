/**
 * Activity Types Constants for Olbrain Platform
 * 
 * Standardized activity types for all platform operations.
 * These constants ensure consistency in activity logging across the platform.
 */

// ============================================================================
// USER ACTIVITIES
// ============================================================================

export const USER_ACTIVITIES = {
  // Authentication
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  SIGNUP: 'user_signup',
  PASSWORD_RESET: 'user_password_reset',
  
  // Profile Management
  PROFILE_UPDATED: 'user_profile_updated',
  EMAIL_VERIFIED: 'user_email_verified',
  PHONE_VERIFIED: 'user_phone_verified',
  AVATAR_UPDATED: 'user_avatar_updated',
  ACCOUNT_DELETED: 'user_account_deleted',

  // Organization Switching
  ORGANIZATION_SWITCHED: 'user_organization_switched',
  
  // Subscription Management
  SUBSCRIPTION_CREATED: 'user_subscription_created',
  SUBSCRIPTION_CANCELLED: 'user_subscription_cancelled',
  SUBSCRIPTION_UPGRADED: 'user_subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'user_subscription_downgraded',
};

// ============================================================================
// AGENT ACTIVITIES
// ============================================================================

export const AGENT_ACTIVITIES = {
  // Lifecycle
  CREATED: 'agent_created',
  UPDATED: 'agent_updated',
  DELETED: 'agent_deleted',
  ARCHIVED: 'agent_archived',
  RESTORED: 'agent_restored',
  
  // Configuration
  CONFIGURATION_UPDATED: 'agent_configuration_updated',
  PROMPT_UPDATED: 'agent_prompt_updated',
  MODEL_CHANGED: 'agent_model_changed',
  
  // Deployment
  DEPLOYED: 'agent_deployed',
  DEPLOYMENT_FAILED: 'agent_deployment_failed',
  UNDEPLOYED: 'agent_undeployed',
  
  // Status Changes
  PAUSED: 'agent_paused',
  RESUMED: 'agent_resumed',
  STATUS_CHANGED: 'agent_status_changed',
  
  // Testing
  TEST_STARTED: 'agent_test_started',
  TEST_COMPLETED: 'agent_test_completed',
  TEST_FAILED: 'agent_test_failed',
  CONVERSATION_CLEARED: 'agent_conversation_cleared',
  CONVERSATION_CLEAR_FAILED: 'agent_conversation_clear_failed',
  
  // Knowledge Base
  KNOWLEDGE_ADDED: 'agent_knowledge_added',
  KNOWLEDGE_REMOVED: 'agent_knowledge_removed',
  KNOWLEDGE_ASSIGNED: 'agent_knowledge_assigned',
  KNOWLEDGE_UPLOAD_FAILED: 'agent_knowledge_upload_failed',
  
  // Integrations
  WHATSAPP_CONNECTED: 'agent_whatsapp_connected',
  WHATSAPP_DISCONNECTED: 'agent_whatsapp_disconnected',
  WHATSAPP_TEMPLATE_CREATED: 'agent_whatsapp_template_created',
  WHATSAPP_TEMPLATE_UPDATED: 'agent_whatsapp_template_updated',
  WHATSAPP_TEMPLATE_DELETED: 'agent_whatsapp_template_deleted',
  WHATSAPP_TEMPLATE_SUBMITTED: 'agent_whatsapp_template_submitted',
  API_INTEGRATED: 'agent_api_integrated',
  API_SPEC_UPLOADED: 'agent_api_spec_uploaded',
  API_SPEC_UPLOAD_FAILED: 'agent_api_spec_upload_failed',
  API_INTEGRATION_DELETED: 'agent_api_integration_deleted',
  API_INTEGRATION_DELETE_FAILED: 'agent_api_integration_delete_failed',
  API_ENDPOINT_TESTED: 'agent_api_endpoint_tested',
  API_ENDPOINT_TEST_FAILED: 'agent_api_endpoint_test_failed',

  // MCP Configuration
  MCP_CONFIG_UPLOADED: 'agent_mcp_config_uploaded',
  MCP_CONFIG_UPLOAD_FAILED: 'agent_mcp_config_upload_failed',
  MCP_CONFIG_DELETED: 'agent_mcp_config_deleted',

  // Analytics
  PERFORMANCE_EXPORTED: 'agent_performance_exported',

  // Human Handoff
  HANDOFF_STARTED: 'agent_handoff_started',
  HANDOFF_ENDED: 'agent_handoff_ended',
  HUMAN_MESSAGE_SENT: 'agent_human_message_sent',
};

// ============================================================================
// PROJECT ACTIVITIES
// ============================================================================

export const PROJECT_ACTIVITIES = {
  // Lifecycle
  CREATED: 'project_created',
  UPDATED: 'project_updated',
  DELETED: 'project_deleted',
  ARCHIVED: 'project_archived',
  
  // Team Management
  MEMBER_ADDED: 'project_member_added',
  MEMBER_REMOVED: 'project_member_removed',
  ROLE_CHANGED: 'project_role_changed',
  
  // Agent Management
  AGENT_ASSIGNED: 'project_agent_assigned',
  AGENT_UNASSIGNED: 'project_agent_unassigned',
  
  // Status Changes
  STATUS_CHANGED: 'project_status_changed',
  PRIORITY_CHANGED: 'project_priority_changed',
};

// ============================================================================
// ORGANIZATION ACTIVITIES
// ============================================================================

export const ORGANIZATION_ACTIVITIES = {
  // Lifecycle
  CREATED: 'organization_created',
  UPDATED: 'organization_updated',
  SETTINGS_CHANGED: 'organization_settings_changed',
  
  // Member Management
  MEMBER_INVITED: 'organization_member_invited',
  MEMBER_JOINED: 'organization_member_joined',
  MEMBER_REMOVED: 'organization_member_removed',
  MEMBER_ROLE_CHANGED: 'organization_member_role_changed',
  
  // Invitations
  INVITATION_SENT: 'organization_invitation_sent',
  INVITATION_CANCELLED: 'organization_invitation_cancelled',
  INVITATION_ACCEPTED: 'organization_invitation_accepted',
  INVITATION_DECLINED: 'organization_invitation_declined',
  
  // Billing
  PLAN_CHANGED: 'organization_plan_changed',
  
  // Invoicing
  INVOICE_GENERATED: 'organization_invoice_generated',
  INVOICE_SENT: 'organization_invoice_sent',
  INVOICE_PAID: 'organization_invoice_paid',
  INVOICE_EXPIRED: 'organization_invoice_expired',
  INVOICE_CANCELLED: 'organization_invoice_cancelled',
};

// ============================================================================
// SYSTEM ACTIVITIES
// ============================================================================

export const SYSTEM_ACTIVITIES = {
  // Errors
  ERROR_OCCURRED: 'system_error_occurred',
  SERVICE_UNAVAILABLE: 'system_service_unavailable',
  AUTH_ERROR_OCCURRED: 'auth_error_occurred',
  
  // Maintenance
  BACKUP_CREATED: 'system_backup_created',
  MAINTENANCE_STARTED: 'system_maintenance_started',
  MAINTENANCE_COMPLETED: 'system_maintenance_completed',
  
  // Security
  UNAUTHORIZED_ACCESS: 'system_unauthorized_access',
  SUSPICIOUS_ACTIVITY: 'system_suspicious_activity',
};

// ============================================================================
// ACTIVITY SEVERITY LEVELS
// ============================================================================

export const ACTIVITY_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export const RESOURCE_TYPES = {
  USER: 'user',
  AGENT: 'agent',
  PROJECT: 'project',
  ORGANIZATION: 'organization',
  CONVERSATION: 'conversation',
  DEPLOYMENT: 'deployment',
  KNOWLEDGE: 'knowledge',
  ASSIGNMENT: 'assignment',
  INTEGRATION: 'integration',
  SYSTEM: 'system',
};

// ============================================================================
// ACTOR TYPES
// ============================================================================

export const ACTOR_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  API: 'api',
  WEBHOOK: 'webhook',
};

// ============================================================================
// ACTIVITY CATEGORIES
// ============================================================================

export const ACTIVITY_CATEGORIES = {
  USER: 'user',
  AGENT: 'agent',
  PROJECT: 'project',
  ORGANIZATION: 'organization',
  SYSTEM: 'system',
  SECURITY: 'security',
  BILLING: 'billing',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get activity category from activity type
 */
export const getActivityCategory = (activityType) => {
  if (Object.values(USER_ACTIVITIES).includes(activityType)) {
    return ACTIVITY_CATEGORIES.USER;
  }
  if (Object.values(AGENT_ACTIVITIES).includes(activityType)) {
    return ACTIVITY_CATEGORIES.AGENT;
  }
  if (Object.values(PROJECT_ACTIVITIES).includes(activityType)) {
    return ACTIVITY_CATEGORIES.PROJECT;
  }
  if (Object.values(ORGANIZATION_ACTIVITIES).includes(activityType)) {
    return ACTIVITY_CATEGORIES.ORGANIZATION;
  }
  if (Object.values(SYSTEM_ACTIVITIES).includes(activityType)) {
    return ACTIVITY_CATEGORIES.SYSTEM;
  }
  return ACTIVITY_CATEGORIES.SYSTEM; // Default
};

/**
 * Get activity severity for different activity types
 */
export const getDefaultSeverity = (activityType) => {
  // Handle undefined/null activity types
  if (!activityType || typeof activityType !== 'string') {
    return ACTIVITY_SEVERITY.INFO;
  }
  
  // Error activities
  if (activityType.includes('error') || activityType.includes('failed')) {
    return ACTIVITY_SEVERITY.ERROR;
  }
  
  // Critical activities
  if (activityType.includes('deleted') || activityType.includes('unauthorized')) {
    return ACTIVITY_SEVERITY.CRITICAL;
  }
  
  // Warning activities
  if (activityType.includes('suspended') || activityType.includes('disconnected')) {
    return ACTIVITY_SEVERITY.WARNING;
  }
  
  // Default to info
  return ACTIVITY_SEVERITY.INFO;
};

/**
 * Check if activity should be shown in public feed
 */
export const isPublicActivity = (activityType) => {
  const publicActivities = [
    AGENT_ACTIVITIES.CREATED,
    AGENT_ACTIVITIES.DEPLOYED,
    PROJECT_ACTIVITIES.CREATED,
    ORGANIZATION_ACTIVITIES.MEMBER_JOINED,
  ];
  
  return publicActivities.includes(activityType);
};

/**
 * Get human-readable activity description
 */
export const getActivityDescription = (activityType) => {
  const descriptions = {
    // User Activities
    [USER_ACTIVITIES.LOGIN]: 'logged in',
    [USER_ACTIVITIES.LOGOUT]: 'logged out',
    [USER_ACTIVITIES.PROFILE_UPDATED]: 'updated the profile',
    [USER_ACTIVITIES.EMAIL_VERIFIED]: 'verified the email',
    [USER_ACTIVITIES.PHONE_VERIFIED]: 'verified the phone number',
    [USER_ACTIVITIES.SUBSCRIPTION_CREATED]: 'created a subscription',
    [USER_ACTIVITIES.SUBSCRIPTION_CANCELLED]: 'cancelled subscription',
    [USER_ACTIVITIES.SUBSCRIPTION_UPGRADED]: 'upgraded subscription',
    [USER_ACTIVITIES.SUBSCRIPTION_DOWNGRADED]: 'downgraded subscription',
    
    // Agent Activities
    [AGENT_ACTIVITIES.CREATED]: 'created an agent',
    [AGENT_ACTIVITIES.UPDATED]: 'updated an agent',
    [AGENT_ACTIVITIES.DEPLOYED]: 'deployed an agent',
    [AGENT_ACTIVITIES.ARCHIVED]: 'archived an agent',
    [AGENT_ACTIVITIES.TEST_STARTED]: 'started testing an agent',
    [AGENT_ACTIVITIES.TEST_COMPLETED]: 'completed agent test',
    [AGENT_ACTIVITIES.TEST_FAILED]: 'agent test failed',
    [AGENT_ACTIVITIES.CONVERSATION_CLEARED]: 'cleared conversation history',
    [AGENT_ACTIVITIES.CONVERSATION_CLEAR_FAILED]: 'failed to clear conversation history',
    [AGENT_ACTIVITIES.KNOWLEDGE_ADDED]: 'uploaded knowledge file',
    [AGENT_ACTIVITIES.KNOWLEDGE_REMOVED]: 'removed knowledge file',
    [AGENT_ACTIVITIES.KNOWLEDGE_ASSIGNED]: 'assigned knowledge to agent',
    [AGENT_ACTIVITIES.KNOWLEDGE_UPLOAD_FAILED]: 'failed to upload knowledge file',
    [AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_CREATED]: 'created WhatsApp template',
    [AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_UPDATED]: 'updated WhatsApp template',
    [AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_DELETED]: 'deleted WhatsApp template',
    [AGENT_ACTIVITIES.WHATSAPP_TEMPLATE_SUBMITTED]: 'submitted WhatsApp template for approval',
    [AGENT_ACTIVITIES.API_SPEC_UPLOADED]: 'uploaded API specification',
    [AGENT_ACTIVITIES.API_SPEC_UPLOAD_FAILED]: 'failed to upload API specification',
    [AGENT_ACTIVITIES.API_INTEGRATION_DELETED]: 'removed API integration',
    [AGENT_ACTIVITIES.API_INTEGRATION_DELETE_FAILED]: 'failed to remove API integration',
    [AGENT_ACTIVITIES.API_ENDPOINT_TESTED]: 'tested API endpoint',
    [AGENT_ACTIVITIES.API_ENDPOINT_TEST_FAILED]: 'API endpoint test failed',
    [AGENT_ACTIVITIES.HANDOFF_STARTED]: 'started human handoff',
    [AGENT_ACTIVITIES.HANDOFF_ENDED]: 'ended human handoff',
    [AGENT_ACTIVITIES.HUMAN_MESSAGE_SENT]: 'sent human response',

    // Project Activities
    [PROJECT_ACTIVITIES.CREATED]: 'created a project',
    [PROJECT_ACTIVITIES.AGENT_ASSIGNED]: 'assigned an agent to project',
    
    // Organization Activities
    [ORGANIZATION_ACTIVITIES.MEMBER_INVITED]: 'invited a team member',
    [ORGANIZATION_ACTIVITIES.MEMBER_JOINED]: 'joined the organization',
    [ORGANIZATION_ACTIVITIES.INVOICE_GENERATED]: 'generated an invoice',
    [ORGANIZATION_ACTIVITIES.INVOICE_SENT]: 'sent an invoice',
    [ORGANIZATION_ACTIVITIES.INVOICE_PAID]: 'invoice was paid',
  };
  
  return descriptions[activityType] || activityType.replace(/_/g, ' ');
};

const ActivityTypes = {
  USER_ACTIVITIES,
  AGENT_ACTIVITIES,
  PROJECT_ACTIVITIES,
  ORGANIZATION_ACTIVITIES,
  SYSTEM_ACTIVITIES,
  ACTIVITY_SEVERITY,
  RESOURCE_TYPES,
  ACTOR_TYPES,
  ACTIVITY_CATEGORIES,
  getActivityCategory,
  getDefaultSeverity,
  isPublicActivity,
  getActivityDescription,
};

export default ActivityTypes;