/**
 * Advanced Features - Export Index
 */
export { default as AdvancedFeatures } from './AdvancedFeatures';
export { default as AdvancedFeatureCard } from './AdvancedFeatureCard';
export { default as FeatureRegistry } from './FeatureRegistry';

// Export individual features
export { userAuthenticationFeature } from './features/UserAuthenticationFeature';
export { dataProtectionFeature } from './features/DataProtectionFeature';
export { rateLimitingFeature } from './features/RateLimitingFeature';
export { customHeadersFeature } from './features/CustomHeadersFeature';
export { apiSecurityFeature } from './features/ApiSecurityFeature';
export { encryptionFeature } from './features/EncryptionFeature';

// Export individual modals
export { default as UserAuthenticationModal } from './modals/UserAuthenticationModal';
export { default as DataProtectionModal } from './modals/DataProtectionModal';