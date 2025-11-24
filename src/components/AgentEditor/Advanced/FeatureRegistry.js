/**
 * Feature Registry
 *
 * Central registry for all advanced features
 */

// Import all features
import { userAuthenticationFeature } from './features/UserAuthenticationFeature';
import { dataProtectionFeature } from './features/DataProtectionFeature';
import { rateLimitingFeature } from './features/RateLimitingFeature';
import { customHeadersFeature } from './features/CustomHeadersFeature';
import { apiSecurityFeature } from './features/ApiSecurityFeature';
import { encryptionFeature } from './features/EncryptionFeature';

// Import modals
import UserAuthenticationModal from './modals/UserAuthenticationModal';
import DataProtectionModal from './modals/DataProtectionModal';

/**
 * Feature Registry Class
 *
 * Manages all advanced features and their configurations
 */
class FeatureRegistry {
  constructor() {
    this.features = new Map();
    this.modals = new Map();
    this.initializeFeatures();
    this.initializeModals();
  }

  /**
   * Initialize all features
   */
  initializeFeatures() {
    const features = [
      userAuthenticationFeature,
      dataProtectionFeature,
      rateLimitingFeature,
      customHeadersFeature,
      apiSecurityFeature,
      encryptionFeature
    ];

    features.forEach(feature => {
      this.features.set(feature.id, feature);
    });
  }

  /**
   * Initialize modal components
   */
  initializeModals() {
    this.modals.set('user_authentication', UserAuthenticationModal);
    this.modals.set('data_protection', DataProtectionModal);
  }

  /**
   * Get all features
   */
  getAllFeatures() {
    return Array.from(this.features.values());
  }

  /**
   * Get available features (not coming soon)
   */
  getAvailableFeatures() {
    return this.getAllFeatures().filter(feature => !feature.comingSoon);
  }

  /**
   * Get coming soon features
   */
  getComingSoonFeatures() {
    return this.getAllFeatures().filter(feature => feature.comingSoon);
  }

  /**
   * Get feature by ID
   */
  getFeature(featureId) {
    return this.features.get(featureId);
  }

  /**
   * Get modal component for feature
   */
  getModal(featureId) {
    return this.modals.get(featureId);
  }

  /**
   * Check if feature has a modal
   */
  hasModal(featureId) {
    return this.modals.has(featureId);
  }

  /**
   * Get feature status from agent
   */
  getFeatureStatus(featureId, agent) {
    const feature = this.getFeature(featureId);
    return feature ? feature.getStatus(agent) : null;
  }

  /**
   * Update agent with feature configuration
   */
  updateAgentWithFeature(featureId, agent, configuration) {
    const feature = this.getFeature(featureId);
    return feature ? feature.updateAgent(agent, configuration) : agent;
  }

  /**
   * Disable feature in agent
   */
  disableFeature(featureId, agent) {
    const feature = this.getFeature(featureId);
    return feature ? feature.disableFeature(agent) : agent;
  }

  /**
   * Validate feature configuration
   */
  validateFeatureConfig(featureId, configuration) {
    const feature = this.getFeature(featureId);
    return feature ? feature.validateConfig(configuration) : [];
  }

  /**
   * Get default configuration for feature
   */
  getDefaultConfig(featureId) {
    const feature = this.getFeature(featureId);
    return feature ? feature.getDefaultConfig() : {};
  }

  /**
   * Get help text for feature
   */
  getHelpText(featureId) {
    const feature = this.getFeature(featureId);
    return feature ? feature.getHelpText() : null;
  }

  /**
   * Register a new feature
   */
  registerFeature(feature) {
    if (!feature.id || !feature.title) {
      throw new Error('Feature must have id and title');
    }
    this.features.set(feature.id, feature);
  }

  /**
   * Register a modal for a feature
   */
  registerModal(featureId, modalComponent) {
    this.modals.set(featureId, modalComponent);
  }

  /**
   * Get features grouped by category
   */
  getFeaturesByCategory() {
    const features = this.getAllFeatures();

    return {
      security: features.filter(f =>
        ['user_authentication', 'data_protection', 'encryption'].includes(f.id)
      ),
      performance: features.filter(f =>
        ['rate_limiting'].includes(f.id)
      ),
      integration: features.filter(f =>
        ['custom_headers', 'api_security'].includes(f.id)
      )
    };
  }

  /**
   * Get enabled features count for agent
   */
  getEnabledFeaturesCount(agent) {
    return this.getAvailableFeatures()
      .map(feature => this.getFeatureStatus(feature.id, agent))
      .filter(status => status?.enabled)
      .length;
  }

  /**
   * Get feature recommendations based on agent configuration
   */
  getFeatureRecommendations(agent) {
    const recommendations = [];

    // Recommend user authentication for agents with sensitive data
    if (!this.getFeatureStatus('user_authentication', agent)?.enabled) {
      if (agent?.knowledge_base?.files?.length > 0) {
        recommendations.push({
          featureId: 'user_authentication',
          reason: 'Your agent has knowledge base files. User authentication adds security.',
          priority: 'high'
        });
      }
    }

    // Recommend data protection for customer service agents
    if (!this.getFeatureStatus('data_protection', agent)?.enabled) {
      const agentDescription = agent?.description?.toLowerCase() || '';
      if (agentDescription.includes('customer') || agentDescription.includes('support')) {
        recommendations.push({
          featureId: 'data_protection',
          reason: 'Customer service agents should protect sensitive data.',
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }
}

// Create singleton instance
const featureRegistry = new FeatureRegistry();

export default featureRegistry;