/**
 * API Key Management Service
 * 
 * Handles CRUD operations for API keys with flexible Firestore structure
 * Collection: api_keys/{keyId}
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { agentBuilderApi } from '../config/apiConfig';
import { getDataAccess } from '../data/DataAccessFactory';

class ApiKeyService {
  constructor() {
    this.collectionName = 'api_keys';
  }

  /**
   * Generate a secure API key
   */
  generateSecureKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `ak_${key}`; // ak_ prefix for "api key"
  }

  /**
   * Create a secure hash of an API key
   * Uses SHA-256 for cryptographic security
   */
  async hashApiKey(apiKey) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error hashing API key:', error);
      throw new Error('Failed to hash API key');
    }
  }

  /**
   * Extract a safe prefix from API key for identification
   * Returns first 12 characters (ak_ + 8 hex chars)
   */
  getKeyPrefix(apiKey) {
    return apiKey.substring(0, 12); // ak_12345678
  }

  /**
   * Create a new API key for an agent via backend API
   * IMPORTANT: agentId is now REQUIRED - organization/project level keys are deprecated
   * Supports system keys (test keys) that are hidden from management interface
   */
  async createApiKey({ name, agentId, organizationId, projectId, userId, isSystem = false }) {
    try {
      // Validate agentId is provided
      if (!agentId) {
        throw new Error('agentId is required - API keys must be agent-specific. Organization and project-level keys are no longer supported.');
      }

      // Use backend API to create API key
      const response = await agentBuilderApi.post(`/api/v1/agents/${agentId}/api-keys`, {
        name: name || 'Untitled API Key',
        description: '',
        permissions: ['read', 'write'],
        rate_limit: 1000
      });

      console.log(`✅ API key created via backend API for agent ${agentId}${isSystem ? ' [SYSTEM KEY - HIDDEN FROM UI]' : ''}`);

      return {
        success: true,
        keyId: response.data.key_id,
        apiKey: response.data.api_key, // ⚠️ Returned ONLY ONCE from backend
        keyData: response.data.key_data
      };
    } catch (error) {
      console.error('Error creating API key:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      return {
        success: false,
        error: errorMessage
      };
    }
  }


  /**
   * Get all API keys with optional filters
   * Excludes system/test keys by default
   */
  async getAllApiKeys(filters = {}) {
    try {
      let q = query(collection(db, this.collectionName));

      // Filter out system/test keys by default unless specifically requested
      if (!filters.includeSystemKeys) {
        q = query(q, where('is_system', '==', false));
        console.log('🔒 Filtering out system/test keys from API key query');
      } else {
        console.log('🔓 Including system/test keys in API key query');
      }

      // Filter by organization_id if specified
      if (filters.organizationId) {
        q = query(q, where('organization_id', '==', filters.organizationId));
      }

      // Filter by project_id if specified
      if (filters.projectId) {
        q = query(q, where('project_id', '==', filters.projectId));
      }

      // Filter by agent_id if specified
      if (filters.agentId) {
        q = query(q, where('agent_id', '==', filters.agentId));
      }

      // Filter by status (default: exclude deleted)
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      } else {
        q = query(q, where('status', 'in', ['active', 'revoked', 'expired']));
      }

      // Order by creation date
      q = query(q, orderBy('created_at', 'desc'));

      const snapshot = await getDocs(q);
      const keys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to JavaScript Date
        created_at: doc.data().created_at?.toDate(),
        last_used: doc.data().last_used?.toDate()
      }));

      return {
        success: true,
        keys
      };
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return {
        success: false,
        error: error.message,
        keys: []
      };
    }
  }

  /**
   * Get API keys for a specific agent (excludes system/test keys by default)
   */
  async getAgentApiKeys(agentId, includeSystemKeys = false) {
    try {
      const dataAccess = getDataAccess();

      // Build filters
      const filters = {};
      if (!includeSystemKeys) {
        filters.include_system = false;
      }

      // Call backend API via DataAccess
      const keys = await dataAccess.listApiKeys(agentId, filters);

      // Convert timestamp strings to Date objects if needed
      const processedKeys = keys.map(key => ({
        ...key,
        created_at: key.created_at ? new Date(key.created_at) : null,
        last_used: key.last_used ? new Date(key.last_used) : null,
        expires_at: key.expires_at ? new Date(key.expires_at) : null
      }));

      return {
        success: true,
        keys: processedKeys
      };
    } catch (error) {
      console.error('Error fetching agent API keys:', error);
      return {
        success: false,
        error: error.message,
        keys: []
      };
    }
  }

  /**
   * Get the most recent usage timestamp for an API key from agent_usage/[agent_id]/api_calls
   */
  async getApiKeyLastUsed(agentId, apiKeyId) {
    try {
      const apiCallsRef = collection(db, 'agent_usage', agentId, 'api_calls');
      const q = query(
        apiCallsRef,
        where('api_key_id', '==', apiKeyId),
        orderBy('created_at', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Get the most recent API call timestamp
      const mostRecentCall = snapshot.docs[0].data();
      return mostRecentCall.created_at?.toDate() || null;
    } catch (error) {
      console.error(`Error fetching last_used for API key ${apiKeyId}:`, error);
      return null;
    }
  }


  /**
   * Get system/test keys only (for debugging or admin purposes)
   */
  async getSystemApiKeys(organizationId = null, agentId = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('is_system', '==', true)
      );

      if (organizationId) {
        q = query(q, where('organization_id', '==', organizationId));
      }

      if (agentId) {
        q = query(q, where('agent_id', '==', agentId));
      }

      q = query(q, orderBy('created_at', 'desc'));

      const snapshot = await getDocs(q);
      const keys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
        last_used: doc.data().last_used?.toDate()
      }));

      return {
        success: true,
        keys
      };
    } catch (error) {
      console.error('Error fetching system API keys:', error);
      return {
        success: false,
        error: error.message,
        keys: []
      };
    }
  }

  /**
   * Get a specific API key by ID
   */
  async getApiKey(keyId) {
    try {
      const docRef = doc(db, this.collectionName, keyId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'API key not found'
        };
      }

      const keyData = {
        id: docSnap.id,
        ...docSnap.data(),
        // Convert Firestore timestamp to JavaScript Date
        created_at: docSnap.data().created_at?.toDate(),
        last_used: docSnap.data().last_used?.toDate(),
        expires_at: docSnap.data().expires_at?.toDate()
      };

      return {
        success: true,
        keyData
      };
    } catch (error) {
      console.error('Error fetching API key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Revoke an API key with reason and user tracking
   */
  async revokeApiKey(keyId, reason = 'No reason provided', agentId) {
    try {
      if (!agentId) {
        throw new Error('agentId is required for revokeApiKey');
      }

      // Use backend API to revoke API key
      const response = await agentBuilderApi.delete(
        `/api/v1/agents/${agentId}/api-keys/${keyId}`
      );

      return {
        success: true,
        message: 'API key revoked successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Error revoking API key:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Soft delete an API key (revoke it via backend API)
   */
  async deleteApiKey(keyId, agentId = null) {
    try {
      // Use the revoke endpoint which marks key as revoked
      return await this.revokeApiKey(keyId, 'Deleted by user', agentId);
    } catch (error) {
      console.error('Error deleting API key:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Regenerate an API key via backend API
   */
  async regenerateApiKey(keyId, agentId) {
    try {
      if (!agentId) {
        throw new Error('agentId is required for regenerateApiKey');
      }

      // Use backend API to regenerate
      const response = await agentBuilderApi.post(
        `/api/v1/agents/${agentId}/api-keys/${keyId}/regenerate`
      );

      console.log(`✅ API key regenerated via backend API for key ID ${keyId}`);

      return {
        success: true,
        apiKey: response.data.api_key,
        message: 'API key regenerated successfully'
      };
    } catch (error) {
      console.error('Error regenerating API key:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track API key usage via backend API
   */
  async trackApiUsage(keyId) {
    try {
      await agentBuilderApi.post(`/api/v1/agents/api-keys/${keyId}/track-usage`);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error tracking API usage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update API key metadata
   */
  async updateApiKey(keyId, updates, agentId) {
    try {
      if (!agentId) {
        throw new Error('agentId is required for updateApiKey');
      }

      // Use backend API to update API key
      const response = await agentBuilderApi.put(
        `/api/v1/agents/${agentId}/api-keys/${keyId}`,
        updates
      );

      return {
        success: true,
        message: 'API key updated successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Error updating API key:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Bulk operations for multiple keys
   */
  async bulkRevokeKeys(keyIds) {
    try {
      const promises = keyIds.map(keyId => this.revokeApiKey(keyId));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
      const failed = results.length - successful;

      return {
        success: true,
        message: `Revoked ${successful} keys successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        successful,
        failed
      };
    } catch (error) {
      console.error('Error in bulk revoke operation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get API key statistics for an organization
   */
  async getOrganizationKeyStats(organizationId) {
    try {
      const result = await this.getOrganizationApiKeys(organizationId);
      
      if (!result.success) {
        return result;
      }

      const keys = result.keys;
      const stats = {
        total: keys.length,
        active: keys.filter(key => key.status === 'active').length,
        revoked: keys.filter(key => key.status === 'revoked').length,
        totalCalls: keys.reduce((sum, key) => sum + (key.total_calls || 0), 0),
        recentlyUsed: keys.filter(key => 
          key.last_used && 
          (Date.now() - key.last_used.getTime()) < (7 * 24 * 60 * 60 * 1000) // Last 7 days
        ).length
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error calculating key statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log API key events for audit trail via backend API
   */
  async logApiKeyEvent(keyId, eventType, eventData = {}) {
    try {
      await agentBuilderApi.post(`/api/v1/agents/api-keys/${keyId}/log-event`, {
        key_id: keyId,
        event_type: eventType,
        event_details: {
          ...eventData,
          user_agent: navigator.userAgent
        }
      });
    } catch (error) {
      console.warn('Failed to log API key event:', error);
      // Don't fail the main operation if logging fails
    }
  }

  /**
   * Check if keys are expiring within specified days
   */
  checkExpiringKeys(keys, days = 15) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return keys
      .filter(key => key.status === 'active' && key.expires_at)
      .filter(key => key.expires_at <= cutoffDate)
      .map(key => ({
        ...key,
        daysUntilExpiry: Math.ceil((key.expires_at - new Date()) / (1000 * 60 * 60 * 24))
      }));
  }

  /**
   * Get expiration warnings for active keys
   */
  getExpirationWarnings(keys) {
    const warnings = {
      expiringSoon: this.checkExpiringKeys(keys, 15), // 15 days
      expiringCritical: this.checkExpiringKeys(keys, 7), // 7 days
      expired: keys.filter(key => key.expires_at && key.expires_at < new Date())
    };

    return {
      ...warnings,
      totalWarnings: warnings.expiringSoon.length + warnings.expired.length
    };
  }

  /**
   * Find or create a test API key for live agent testing
   * Stores the key in agent_servers/[agent_id]/testing for persistence
   */
  async findOrCreateTestApiKey(agentId, userId) {
    try {
      // Check if test API key exists via backend API (agent_servers collection)
      try {
        const { getDataAccess } = require('../data/DataAccessFactory');
        const dataAccess = getDataAccess();
        const serverData = await dataAccess.getAgentServer(agentId);

        if (serverData && serverData.testing) {
          const testing = serverData.testing;

          // If test API key exists and is valid, return it
          if (testing.api_key && testing.status === 'active') {
            console.log('Found existing test API key in agent_servers:', testing.api_key_id);
            return {
              success: true,
              keyId: testing.api_key_id,
              apiKey: testing.api_key,
              exists: true
            };
          }
        }
      } catch (error) {
        // Agent server not found or no testing data - proceed to create
        console.log('No existing test API key found, will create new one');
      }

      console.log('Creating new test API key for agent:', agentId);

      // Check if a test key exists in api_keys collection (legacy check)
      const existingKeys = await this.getAgentApiKeys(agentId, true);
      const testKey = existingKeys.keys?.find(key =>
        key.name === 'agent_testing' &&
        key.status === 'active'
      );

      let apiKey, keyId;

      if (testKey) {
        // Regenerate existing test key to get the actual key value
        console.log('Regenerating existing test key:', testKey.id);
        const regenResult = await this.regenerateApiKey(testKey.id);
        if (!regenResult.success) {
          throw new Error('Failed to regenerate test API key');
        }
        apiKey = regenResult.apiKey;
        keyId = testKey.id;
      } else {
        // Create a new test key
        const result = await this.createApiKey({
          name: 'agent_testing',
          agentId,
          organizationId: null, // Test keys don't need org/project filtering
          projectId: null,
          userId,
          isSystem: true // Mark as system key to hide from management UI
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create test API key');
        }

        apiKey = result.apiKey;
        keyId = result.keyId;
      }

      // Store the test API key in agent_servers/[agent_id]/testing via backend API
      await agentBuilderApi.post('/api/v1/agents/api-keys/store-test-key', {
        agent_id: agentId,
        api_key: apiKey,
        key_id: keyId
      });

      console.log('Test API key stored in agent_servers via backend API');

      return {
        success: true,
        keyId: keyId,
        apiKey: apiKey,
        exists: false
      };
    } catch (error) {
      console.error('Error in findOrCreateTestApiKey:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  /**
   * Get or create test API key stored in agent_sessions/test_{agent_id}
   * Always uses the same key name: 'agent_testing'
   */
  async getOrCreateTestApiKeyInSession(agentId, userId) {
    try {
      const testSessionId = `test_${agentId}`;

      // Check if test API key exists in session via backend API
      try {
        const { getDataAccess } = require('../data/DataAccessFactory');
        const dataAccess = getDataAccess();
        const sessionData = await dataAccess.getTestingSessionDetails(testSessionId);

        if (sessionData && sessionData.test_api_key) {
          const keyCreatedAt = sessionData.test_api_key_created_at
            ? new Date(sessionData.test_api_key_created_at).getTime()
            : 0;
          const keyAge = Date.now() - keyCreatedAt;

          // Check if key exists and is still valid (< 24 hours)
          if (keyAge < 24 * 60 * 60 * 1000) {
            console.log('Using existing valid test API key from session');
            return { success: true, apiKey: sessionData.test_api_key };
          }
        }
      } catch (error) {
        // Session not found or no test key - proceed to create
        console.log('No existing test API key in session, will create new one');
      }

      // Key doesn't exist or is expired - find or create 'agent_testing' key (include system keys)
      const existingKeys = await this.getAgentApiKeys(agentId, true);
      const testKey = existingKeys.keys?.find(k =>
        k.name === 'agent_testing' &&
        k.status === 'active'
      );

      let apiKey;
      let keyId;

      if (testKey) {
        // Regenerate existing 'agent_testing' key
        console.log('Regenerating expired agent_testing key...');
        const result = await this.regenerateApiKey(testKey.id);
        if (result.success) {
          apiKey = result.apiKey;
          keyId = testKey.id;
        } else {
          throw new Error('Failed to regenerate API key');
        }
      } else {
        // Create new 'agent_testing' key
        console.log('Creating new agent_testing key...');
        const result = await this.createApiKey({
          name: 'agent_testing',
          agentId,
          organizationId: null, // Test keys don't need org/project filtering
          projectId: null,
          userId,
          isSystem: true // Mark as system key to hide from management UI
        });
        if (result.success) {
          apiKey = result.apiKey;
          keyId = result.keyId;
        } else {
          throw new Error('Failed to create API key');
        }
      }

      // Store/update in agent_sessions document via backend API
      await agentBuilderApi.post('/api/v1/agents/api-keys/store-test-key', {
        agent_id: agentId,
        api_key: apiKey,
        key_id: keyId,
        session_id: testSessionId
      });

      console.log('Test API key stored in session document via backend API');
      return { success: true, apiKey };

    } catch (error) {
      console.error('Error managing test API key in session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a WhatsApp API key for webhook authentication
   */
  async createWhatsAppApiKey(agentId, userId, organizationId, projectId = null) {
    try {
      // First check if a WhatsApp key already exists
      const existing = await this.getWhatsAppIntegration(agentId);
      if (existing.success && existing.key) {
        // Delete the old key before creating a new one
        await this.deleteApiKey(existing.key.id, agentId);
      }

      // Create a new WhatsApp API key via backend API
      const response = await agentBuilderApi.post(`/api/v1/agents/${agentId}/api-keys`, {
        name: 'WhatsApp Integration',
        description: 'API key for WhatsApp webhook authentication',
        permissions: ['read', 'write'],
        rate_limit: 1000
      });

      // Update to mark it as WhatsApp type
      if (response.data.key_id) {
        await this.updateApiKey(response.data.key_id, {
          type: 'whatsapp'
        }, agentId);
      }

      return {
        success: true,
        keyId: response.data.key_id,
        apiKey: response.data.api_key,
        keyData: response.data.key_data
      };
    } catch (error) {
      console.error('Error creating WhatsApp API key:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get WhatsApp integration details for an agent
   */
  async getWhatsAppIntegration(agentId) {
    try {
      // Query for WhatsApp type API key
      const q = query(
        collection(db, this.collectionName),
        where('agent_id', '==', agentId),
        where('type', '==', 'whatsapp'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          success: true,
          key: null
        };
      }

      // Get the first (and should be only) WhatsApp key
      const doc = snapshot.docs[0];
      const data = doc.data();
      const keyData = {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        last_used: data.last_used?.toDate ? data.last_used.toDate() : data.last_used,
        expires_at: data.expires_at?.toDate ? data.expires_at.toDate() : data.expires_at,
        total_calls: data.total_calls || 0
      };

      return {
        success: true,
        key: keyData
      };
    } catch (error) {
      console.error('Error getting WhatsApp integration:', error);
      return {
        success: false,
        error: error.message,
        key: null
      };
    }
  }

  /**
   * Get API key usage statistics from agent_usage/[agent_id]/api_calls collection
   * This integrates with the actual Firestore schema mentioned by user
   */
  async getApiKeyUsageStatistics(agentId, apiKeyId = null) {
    try {
      const apiCallsRef = collection(db, 'agent_usage', agentId, 'api_calls');
      let q = query(apiCallsRef, orderBy('timestamp', 'desc'));

      // Filter by specific API key if provided
      if (apiKeyId) {
        q = query(apiCallsRef, where('api_key_id', '==', apiKeyId), orderBy('timestamp', 'desc'));
      }

      const snapshot = await getDocs(q);
      const apiCalls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      // Aggregate usage statistics
      const stats = {
        totalCalls: apiCalls.length,
        totalTokensUsage: apiCalls.reduce((sum, call) => sum + (call.tokens_usage || 0), 0),
        recentCalls: apiCalls.slice(0, 10), // Last 10 calls
        dailyUsage: this.aggregateDailyUsage(apiCalls),
        apiKeyBreakdown: this.aggregateByApiKey(apiCalls)
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error fetching API key usage statistics:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  /**
   * Aggregate daily usage from API calls
   */
  aggregateDailyUsage(apiCalls) {
    const dailyMap = {};

    apiCalls.forEach(call => {
      const date = call.timestamp ? call.timestamp.toISOString().split('T')[0] : 'unknown';
      if (!dailyMap[date]) {
        dailyMap[date] = { date, calls: 0, tokens: 0 };
      }
      dailyMap[date].calls += 1;
      dailyMap[date].tokens += call.tokens_usage || 0;
    });

    return Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7); // Last 7 days
  }

  /**
   * Aggregate usage by API key
   */
  aggregateByApiKey(apiCalls) {
    const keyMap = {};

    apiCalls.forEach(call => {
      const keyId = call.api_key_id || 'unknown';
      if (!keyMap[keyId]) {
        keyMap[keyId] = { api_key_id: keyId, calls: 0, tokens: 0 };
      }
      keyMap[keyId].calls += 1;
      keyMap[keyId].tokens += call.tokens_usage || 0;
    });

    return Object.values(keyMap).sort((a, b) => b.calls - a.calls);
  }

  /**
   * Get aggregated organization usage statistics (legacy method for compatibility)
   * This integrates with agent-launcher/agent-template/core/usage_aggregator.py
   */
  async getApiUsageStatistics(organizationId, filters = {}) {
    try {
      const collections = {
        ORGANIZATIONS: 'organizations',
        PROJECTS: 'projects',
        AGENTS: 'agents'
      };

      let usageData = [];

      // Get organization level usage
      if (filters.level === 'organization' || !filters.level) {
        try {
          const orgUsageRef = collection(db, collections.ORGANIZATIONS, organizationId, 'usage');
          const orgSnapshot = await getDocs(orgUsageRef);

          orgSnapshot.docs.forEach(doc => {
            const data = doc.data();
            usageData.push({
              type: 'organization',
              id: organizationId,
              name: 'Organization Usage',
              message_count: data.message_count || 0,
              session_count: data.session_count || 0,
              total_tokens: data.total_tokens || 0,
              prompt_tokens: data.prompt_tokens || 0,
              completion_tokens: data.completion_tokens || 0,
              last_updated: data.last_updated?.toDate() || null
            });
          });
        } catch (error) {
          console.warn('Could not fetch organization usage:', error);
        }
      }

      // Get project level usage
      if (filters.level === 'project' || !filters.level) {
        try {
          // Get all projects in organization first
          const projectsRef = collection(db, collections.PROJECTS);
          const projectsQuery = query(projectsRef, where('organization_id', '==', organizationId));
          const projectsSnapshot = await getDocs(projectsQuery);

          for (const projectDoc of projectsSnapshot.docs) {
            const projectData = projectDoc.data();
            const projectUsageRef = collection(db, collections.PROJECTS, projectDoc.id, 'usage');
            const usageSnapshot = await getDocs(projectUsageRef);

            let projectUsage = {
              type: 'project',
              id: projectDoc.id,
              name: projectData.basic_info?.name || 'Unknown Project',
              message_count: 0,
              session_count: 0,
              total_tokens: 0,
              prompt_tokens: 0,
              completion_tokens: 0,
              last_updated: null
            };

            usageSnapshot.docs.forEach(usageDoc => {
              const data = usageDoc.data();
              projectUsage.message_count += data.message_count || 0;
              projectUsage.session_count += data.session_count || 0;
              projectUsage.total_tokens += data.total_tokens || 0;
              projectUsage.prompt_tokens += data.prompt_tokens || 0;
              projectUsage.completion_tokens += data.completion_tokens || 0;

              if (data.last_updated) {
                const lastUpdated = data.last_updated.toDate();
                if (!projectUsage.last_updated || lastUpdated > projectUsage.last_updated) {
                  projectUsage.last_updated = lastUpdated;
                }
              }
            });

            if (projectUsage.message_count > 0 || projectUsage.session_count > 0) {
              usageData.push(projectUsage);
            }
          }
        } catch (error) {
          console.warn('Could not fetch project usage:', error);
        }
      }

      // Get agent level usage
      if (filters.level === 'agent' || !filters.level) {
        try {
          // Get all agents in organization
          const agentsRef = collection(db, collections.AGENTS);
          const agentsQuery = query(agentsRef, where('organization_id', '==', organizationId));
          const agentsSnapshot = await getDocs(agentsQuery);

          for (const agentDoc of agentsSnapshot.docs) {
            const agentData = agentDoc.data();

            // Get agent usage from agent_usage collection
            const agentUsageRef = doc(db, 'agent_usage', agentDoc.id);
            const agentUsageDoc = await getDoc(agentUsageRef);

            if (agentUsageDoc.exists()) {
              const data = agentUsageDoc.data();
              usageData.push({
                type: 'agent',
                id: agentDoc.id,
                name: agentData.basic_info?.name || 'Unknown Agent',
                message_count: data.message_count || 0,
                session_count: data.session_count || 0,
                total_tokens: data.total_tokens || 0,
                prompt_tokens: data.prompt_tokens || 0,
                completion_tokens: data.completion_tokens || 0,
                last_updated: data.last_updated?.toDate() || null
              });
            }
          }
        } catch (error) {
          console.warn('Could not fetch agent usage:', error);
        }
      }

      // Sort by usage (total_tokens) descending
      usageData.sort((a, b) => (b.total_tokens || 0) - (a.total_tokens || 0));

      // Calculate totals
      const totals = usageData.reduce((acc, item) => ({
        message_count: acc.message_count + item.message_count,
        session_count: acc.session_count + item.session_count,
        total_tokens: acc.total_tokens + item.total_tokens,
        prompt_tokens: acc.prompt_tokens + item.prompt_tokens,
        completion_tokens: acc.completion_tokens + item.completion_tokens
      }), {
        message_count: 0,
        session_count: 0,
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0
      });

      return {
        success: true,
        usageData,
        totals,
        count: usageData.length
      };
    } catch (error) {
      console.error('Error fetching API usage statistics:', error);
      return {
        success: false,
        error: error.message,
        usageData: [],
        totals: {
          message_count: 0,
          session_count: 0,
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0
        },
        count: 0
      };
    }
  }
}

// Export singleton instance
const apiKeyService = new ApiKeyService();
export default apiKeyService;