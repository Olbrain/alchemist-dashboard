/**
 * API Configuration - Whitelabel Embed Version
 *
 * All API URLs are bundled into the build from configuration files.
 * Only organization_id and api_key need to be provided by integrators.
 *
 * AUTHENTICATION:
 * Organization API Key authentication via request headers
 * Set window.REACT_APP_ORGANIZATION_API_KEY before loading the dashboard
 *
 * CONFIGURATION:
 * Set window.REACT_APP_ORGANIZATION_ID for organization context
 */
import axios from 'axios';

// Import backend URLs from bundled configuration files
// Uses appropriate file based on REACT_APP_ENV (development/production)
const environment = process.env.REACT_APP_ENV || 'production';
const isDevelopment = environment === 'development';
const backendConfig = isDevelopment
  ? require('../../config/backend-urls.development.json')
  : require('../../config/backend-urls.production.json');

// Get organization configuration from window (set by integrator)
const getOrganizationId = () => {
  return window.REACT_APP_ORGANIZATION_ID || process.env.REACT_APP_ORGANIZATION_ID;
};

const getOrganizationApiKey = () => {
  return window.REACT_APP_ORGANIZATION_API_KEY || process.env.REACT_APP_ORGANIZATION_API_KEY;
};

// Backend API URLs - Loaded from bundled configuration files
export const AGENT_ENGINE_URL = backendConfig.AGENT_ENGINE_URL;
export const KNOWLEDGE_VAULT_URL = backendConfig.KNOWLEDGE_VAULT_URL;
export const BILLING_SERVICE_URL = backendConfig.BILLING_SERVICE_URL;
export const AGENT_LAUNCHER_URL = backendConfig.AGENT_LAUNCHER_URL;
export const ANALYTICS_SERVICE_URL = backendConfig.ANALYTICS_SERVICE_URL;
export const AGENT_BRIDGE_URL = backendConfig.AGENT_BRIDGE_URL;
export const AGENT_BUILDER_AI_SERVICE_URL = backendConfig.AGENT_BUILDER_AI_SERVICE_URL;
export const AGENT_DASHBOARD_URL = backendConfig.AGENT_DASHBOARD_URL;
export const TOOL_MANAGER_URL = backendConfig.TOOL_MANAGER_URL;

// Log configuration on load (for debugging integration)
console.log('🔧 Alchemist Dashboard - Whitelabel Configuration');
console.log('Environment:', environment);
console.log('Organization ID:', getOrganizationId() || '❌ NOT SET');
console.log('API Key:', getOrganizationApiKey() ? '✅ SET' : '❌ NOT SET');
console.log('Backend URLs loaded from:', isDevelopment ? 'backend-urls.development.json' : 'backend-urls.production.json');

// Export URLs as an object for easier import
export const apiConfig = {
  AGENT_ENGINE_URL,
  KNOWLEDGE_VAULT_URL,
  BILLING_SERVICE_URL,
  AGENT_LAUNCHER_URL,
  ANALYTICS_SERVICE_URL,
  AGENT_BRIDGE_URL,
  AGENT_BUILDER_AI_SERVICE_URL,
  AGENT_DASHBOARD_URL,
  TOOL_MANAGER_URL
};

// Create axios instances with default config
export const api = axios.create({
  baseURL: AGENT_ENGINE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const kbApi = axios.create({
  baseURL: KNOWLEDGE_VAULT_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


// Billing service axios instance
export const billingApi = axios.create({
  baseURL: BILLING_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Analytics service axios instance
export const analyticsApi = axios.create({
  baseURL: ANALYTICS_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});



// Agent Launcher service axios instance
export const agentLauncherApi = axios.create({
  baseURL: AGENT_LAUNCHER_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Agent Bridge service axios instance
export const agentBridgeApi = axios.create({
  baseURL: AGENT_BRIDGE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Agent Builder AI service axios instance
export const agentBuilderApi = axios.create({
  baseURL: AGENT_BUILDER_AI_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Tool Manager service axios instance
export const toolManagerApi = axios.create({
  baseURL: TOOL_MANAGER_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Common configuration
export const API_CONFIG = {
  timeout: 30000
};

// API endpoints
export const ENDPOINTS = {
  // Agent endpoints
  AGENTS: '/agents',
  AGENT_ACTIONS: '/api/agent-actions',
  AGENT_PROMPTS: '/api/agent-prompts',
  
  // Conversation endpoints
  CONVERSATIONS: '/conversations',
  
  // v3.1.0 Knowledge Library endpoints (organization-wide)
  KNOWLEDGE_LIBRARY: '/api/v1/knowledge-library',
  KNOWLEDGE_LIBRARY_SEARCH: '/api/v1/knowledge-library/search',
  KNOWLEDGE_LIBRARY_UPLOAD: '/api/upload-knowledge-base',
  KNOWLEDGE_LIBRARY_BULK_UPLOAD: '/api/v1/knowledge-library/bulk-upload',
  
  // v4.0.0 Knowledge Embeddings management endpoints
  // Note: Embedding cleanup is handled by the knowledge-vault file deletion endpoint
  KNOWLEDGE_EMBEDDINGS_STATUS: '/api/v1/knowledge-embeddings/{embedding_id}/status',
  
  // Knowledge assignments endpoints removed in v4.0.0 - direct assignment via agent_id field
  
  // Organization Knowledge endpoints (v3.1.0)
  ORG_KNOWLEDGE_STATS: '/api/v1/organizations/{org_id}/knowledge/stats',
  ORG_KNOWLEDGE_ANALYTICS: '/api/v1/organizations/{org_id}/knowledge/analytics',
  
  // Knowledge Storage endpoints
  KNOWLEDGE_STORAGE_USAGE: '/api/v1/knowledge/storage-usage',
  KNOWLEDGE_STORAGE_VALIDATE: '/api/v1/knowledge/validate-upload',
  
  // Artifact endpoints
  ARTIFACTS: '/api/artifacts',
  
  // Alchemist endpoints
  ALCHEMIST: '/api/alchemist',
  
  // API Integration endpoints
  API_INTEGRATIONS: '/api/api-integrations',
  API_SPECS: '/api/api-specifications',
  API_ENDPOINTS: '/api/api-endpoints',
  
  // MCP Server endpoints
  MCP_SERVERS: '/api/mcp-servers',
  MCP_DEPLOYMENT: '/api/mcp-deployment',
  MCP_TOOLS: '/api/mcp-tools',
  
  // Health check
  HEALTH: '/api/health',
  
  // Billing Service endpoints (subscription + credits system)
  BILLING_CREDITS_STATUS: '/api/v1/credits/status',
  BILLING_CREDITS_PURCHASE: '/api/v1/credits/purchase',
  BILLING_CREDITS_COMPLETE_ORDER: '/api/v1/credits/complete-order',
  BILLING_TRANSACTIONS: '/api/v1/transactions',
  BILLING_HEALTH: '/api/v1/health',
  
  // Subscription endpoints
  BILLING_SUBSCRIPTIONS_STATUS: '/api/v1/subscriptions/status',
  BILLING_SUBSCRIPTIONS_PLANS: '/api/v1/subscriptions/plans',
  BILLING_SUBSCRIPTIONS_SUBSCRIBE: '/api/v1/subscriptions/subscribe',
  BILLING_SUBSCRIPTIONS_CANCEL: '/api/v1/subscriptions/cancel',
  
  
  // Subscription payment endpoints
  BILLING_SUBSCRIPTIONS_RAZORPAY_CREATE: '/api/v1/subscriptions/razorpay/create',
  BILLING_SUBSCRIPTIONS_PAYMENT_VERIFY: '/api/v1/subscriptions/payment/verify',
  BILLING_PAYMENTS_VERIFY: '/api/v1/credits/payments/verify',
  
  // Invoice endpoints
  BILLING_INVOICES: '/api/v1/invoices',
  BILLING_INVOICES_CREATE: '/api/v1/invoices/create',
  BILLING_INVOICES_SUMMARY: '/api/v1/invoices/summary',
  BILLING_INVOICES_RESEND: '/api/v1/invoices/{invoice_id}/resend',
  BILLING_INVOICES_STATUS: '/api/v1/invoices/{invoice_id}/status',
  BILLING_BUSINESS_INFO: '/api/v1/invoices/business-info',
  
  // Agent Launcher endpoints
  AGENT_DEPLOYMENTS: '/api/deployments',
  AGENT_DEPLOYMENT_STATUS: '/api/deployment',
  AGENT_DEPLOYMENT_QUEUE: '/api/queue',
  
};

// Get API configuration from environment variables
export const getApiConfig = () => {
  const config = {
    baseUrl: AGENT_ENGINE_URL,
    alchemist: {
      url: AGENT_ENGINE_URL,
      timeout: 30000
    },
    knowledgeBase: {
      url: KNOWLEDGE_VAULT_URL,
      timeout: 60000
    },
    billingService: {
      url: BILLING_SERVICE_URL,
      timeout: 30000
    },
    agentLauncher: {
      url: AGENT_LAUNCHER_URL,
      timeout: 30000
    }
  };
  
  return config;
};

// Synchronous version of API config
export const getApiConfigSync = () => {
  return getApiConfig();
};

// Get service URL - Returns hardcoded production URLs for whitelabel deployment
export const getServiceApiUrl = (serviceName) => {
  const serviceUrls = {
    'alchemist-agent-engine': AGENT_ENGINE_URL,
    'alchemist-knowledge-vault': KNOWLEDGE_VAULT_URL,
    'agent-launcher': AGENT_LAUNCHER_URL,
    'analytics-service': ANALYTICS_SERVICE_URL,
    'billing-service': BILLING_SERVICE_URL,
    'agent-bridge': AGENT_BRIDGE_URL,
    'agent-builder-ai': AGENT_BUILDER_AI_SERVICE_URL,
    'tool-manager': TOOL_MANAGER_URL
  };

  const url = serviceUrls[serviceName];
  if (!url) {
    throw new Error(`Service ${serviceName} not configured`);
  }

  return url;
};

// Add authentication interceptor to main API instance
// Uses organization API key authentication
api.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add authentication interceptor to knowledge base API
kbApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});


// Add authentication interceptor to billing API
billingApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add authentication interceptor to analytics API
analyticsApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});


// Add authentication interceptor to agent launcher API
agentLauncherApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add authentication interceptor to agent bridge API
agentBridgeApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add authentication interceptor to agent builder AI API
agentBuilderApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add authentication interceptor to tool manager API
toolManagerApi.interceptors.request.use(async (config) => {
  const apiKey = getOrganizationApiKey();

  if (apiKey) {
    config.headers.Authorization = `ApiKey ${apiKey}`;
  } else {
    console.warn('⚠️ API Key not set - requests will fail');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for 401 handling to all APIs
const handle401Error = (error) => {
  if (error.response && error.response.status === 401) {
    console.error('❌ Authentication failed - Invalid or expired API key');
  }
  return Promise.reject(error);
};

// Apply 401 interceptor to all API instances
agentBuilderApi.interceptors.response.use(response => response, handle401Error);
api.interceptors.response.use(response => response, handle401Error);
kbApi.interceptors.response.use(response => response, handle401Error);
billingApi.interceptors.response.use(response => response, handle401Error);
analyticsApi.interceptors.response.use(response => response, handle401Error);
agentLauncherApi.interceptors.response.use(response => response, handle401Error);
agentBridgeApi.interceptors.response.use(response => response, handle401Error);
toolManagerApi.interceptors.response.use(response => response, handle401Error);