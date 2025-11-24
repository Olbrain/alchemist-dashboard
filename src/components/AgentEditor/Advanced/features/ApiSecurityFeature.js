/**
 * API Security Feature
 *
 * Configuration and logic for API security functionality
 */
import { Shield as ShieldIcon } from '@mui/icons-material';

export const apiSecurityFeature = {
  id: 'api_security',
  title: 'API Security',
  description: 'Configure advanced API security features including CORS, authentication tokens, and request validation.',
  icon: ShieldIcon,
  comingSoon: true,

  // Feature configuration
  getDefaultConfig: () => ({
    enabled: false,
    cors_enabled: true,
    allowed_origins: ['*'],
    allowed_methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowed_headers: ['Content-Type', 'Authorization'],
    require_https: true,
    api_key_required: false,
    api_key_header: 'X-API-Key',
    jwt_validation: false,
    jwt_secret: '',
    request_signing: false,
    ip_whitelist: [],
    user_agent_validation: false,
    allowed_user_agents: []
  }),

  // Get feature status from agent
  getStatus: (agent) => {
    return {
      enabled: false,
      status: null,
      statusColor: 'default'
    };
  },

  // Update agent with feature configuration
  updateAgent: (agent, configuration) => {
    return {
      ...agent,
      api_security: {
        ...configuration,
        enabled: true
      }
    };
  },

  // Disable feature in agent
  disableFeature: (agent) => {
    return {
      ...agent,
      api_security: {
        ...agent?.api_security,
        enabled: false
      }
    };
  },

  // Validate configuration
  validateConfig: (config) => {
    const errors = [];

    if (config.cors_enabled && (!config.allowed_origins || config.allowed_origins.length === 0)) {
      errors.push('At least one allowed origin must be specified when CORS is enabled');
    }

    if (config.api_key_required && (!config.api_key_header || !config.api_key_header.trim())) {
      errors.push('API key header name is required when API key validation is enabled');
    }

    if (config.jwt_validation && (!config.jwt_secret || !config.jwt_secret.trim())) {
      errors.push('JWT secret is required when JWT validation is enabled');
    }

    if (config.ip_whitelist) {
      config.ip_whitelist.forEach((ip, index) => {
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) && !/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)) {
          errors.push(`IP address ${index + 1} is not valid`);
        }
      });
    }

    return errors;
  },

  // Get security presets
  getSecurityPresets: () => [
    {
      name: 'Basic Security',
      description: 'Essential security features',
      config: {
        cors_enabled: true,
        allowed_origins: ['*'],
        require_https: true,
        api_key_required: false
      }
    },
    {
      name: 'Enhanced Security',
      description: 'Recommended for production',
      config: {
        cors_enabled: true,
        allowed_origins: [],
        require_https: true,
        api_key_required: true,
        request_signing: false
      }
    },
    {
      name: 'Maximum Security',
      description: 'Highest security level',
      config: {
        cors_enabled: true,
        allowed_origins: [],
        require_https: true,
        api_key_required: true,
        jwt_validation: true,
        request_signing: true,
        ip_whitelist: []
      }
    }
  ],

  // Get feature-specific help text
  getHelpText: () => ({
    title: 'API Security Help',
    content: `
      API Security provides comprehensive protection for your agent's API endpoints
      with multiple layers of security controls.

      **Security Features:**
      • CORS (Cross-Origin Resource Sharing) configuration
      • HTTPS enforcement
      • API key validation
      • JWT token validation
      • Request signing verification
      • IP address whitelisting
      • User agent validation

      **Security Levels:**
      • Basic: HTTPS + CORS
      • Enhanced: Basic + API keys
      • Maximum: Enhanced + JWT + Request signing

      **Best Practices:**
      • Always use HTTPS in production
      • Restrict CORS origins to known domains
      • Use strong API keys and rotate regularly
      • Implement request signing for sensitive data
      • Monitor and log security events
    `
  })
};

export default apiSecurityFeature;