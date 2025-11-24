/**
 * API Services Index
 * 
 * Central export for all API services to maintain backward compatibility
 * and provide a single import point for all API operations
 */

// Core services
export { getAuthToken } from './auth/authService';
export { AGENT_ENGINE_URL, KNOWLEDGE_VAULT_URL, ENDPOINTS, api, kbApi, getApiConfig } from './config/apiConfig';

// Agent services
export {
  createAgent,
  deleteAgent,
  markAgentAsDeleted,
  archiveAgentDirectly,
  restoreAgent,
  pauseAgent,
  resumeAgent,
  executeAgentAction,
  executeUserAgentAction,
  getAgentTypes,
  getAgentPrompt,
  updateAgentPrompt
} from './agents/agentService';

// Conversation services
export {
  getAgentConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
  // Real-time Firestore conversation functions
  subscribeToAgentConversations,
  sendUserMessage,
  initializeConversationSession,
  clearConversationHistory
} from './conversations/conversationService';

// Legacy knowledge base services removed - use knowledgeLibraryService (v3.1.0) instead

// Knowledge Library services (v4.0.0 - Agent-only knowledge management)
export {
  uploadToKnowledgeLibrary,
  uploadAgentKnowledgeFiles,
  deleteAgentKnowledge,
  getAgentKnowledge,
  canUserAccessKnowledge,
  filterKnowledgeByAccess,
  checkLegacyKnowledgeFiles,
  getKnowledgeMigrationStatus,
  getKnowledgeItemsByIds,
  deduplicateKnowledge,
  downloadKnowledgeFile
} from './knowledgeBase/knowledgeLibraryService';

// Artifact services
export {
  getAgentArtifacts,
  createArtifact,
  updateArtifact,
  deleteArtifact
} from './artifacts/artifactService';

// Alchemist services
export {
  interactWithAlchemist,
  getAlchemistConversations,
  clearAlchemistConversation,
  uploadFilesForAgentCreation,
  sendUserMessageWithAttachments,
  getAlchemistActions,
  getAlchemistActionsSummary,
  deleteAlchemistActions,
  subscribeToAlchemistActions
} from './alchemist/alchemistService';

// API Integration services
export {
  uploadApiSpecification,
  uploadMcpConfiguration,
  getApiIntegrations,
  deleteApiIntegration,
  getApiSpecification,
  downloadApiSpecification,
  getTestableEndpoints,
  testApiEndpoint,
  getApiIntegrationFiles
} from './apiIntegration/apiIntegrationService';

// Agent Deployment services
export {
  deployAgent,
  getDeploymentStatus,
  cancelDeployment,
  getQueueStatus,
  getServiceHealth,
  pollDeploymentStatus,
  subscribeToDeploymentUpdates,
  getDeployment
} from './deployment/deploymentService';

// Billing Service (microservice-based)
// export {
//   billingServiceV2 // REMOVED: Billing service deleted
// } from './billing/billingServiceV2';

// MCP Server services
export {
  getAgentMcpConfigurations,
  saveMcpConfiguration,
  getMcpConfiguration,
  deleteMcpConfiguration,
  testMcpConfiguration,
  toggleMcpConfiguration,
  getAvailableMcpServers
} from './mcp/mcpService';

// Clean exports for v4.0.0 - simplified knowledge management
export * from './agents/agentService';
export * from './conversations/conversationService';
export * from './knowledgeBase/knowledgeLibraryService'; // v4.0.0 simplified knowledge management
export * from './artifacts/artifactService';
export * from './alchemist/alchemistService';
export * from './apiIntegration/apiIntegrationService';
export * from './deployment/deploymentService';
export * from './mcp/mcpService';

// Note: Assignment-based knowledge functions removed in v4.0.0
// Knowledge is now directly assigned to agents via agent_id field