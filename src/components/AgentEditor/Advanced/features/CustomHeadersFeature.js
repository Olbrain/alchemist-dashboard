/**
 * Custom Headers Feature
 *
 * Configuration and logic for custom headers functionality
 */
import { Http as HttpIcon } from '@mui/icons-material';

export const customHeadersFeature = {
  id: 'custom_headers',
  title: 'Custom Headers',
  description: 'Add custom HTTP headers to API requests for enhanced security, tracking, or integration requirements.',
  icon: HttpIcon,
  comingSoon: true,

  // Feature configuration
  getDefaultConfig: () => ({
    enabled: false,
    headers: [],
    apply_to_all_requests: true,
    apply_to_external_apis: true,
    apply_to_webhooks: true,
    secure_headers_only: false,
    header_validation: true
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
      custom_headers: {
        ...configuration,
        enabled: true
      }
    };
  },

  // Disable feature in agent
  disableFeature: (agent) => {
    return {
      ...agent,
      custom_headers: {
        ...agent?.custom_headers,
        enabled: false
      }
    };
  },

  // Validate configuration
  validateConfig: (config) => {
    const errors = [];

    if (config.headers) {
      config.headers.forEach((header, index) => {
        if (!header.name || !header.name.trim()) {
          errors.push(`Header ${index + 1}: Name is required`);
        }

        if (!header.value || !header.value.trim()) {
          errors.push(`Header ${index + 1}: Value is required`);
        }

        // Validate header name format
        if (header.name && !/^[a-zA-Z0-9\-_]+$/.test(header.name)) {
          errors.push(`Header ${index + 1}: Name contains invalid characters`);
        }
      });
    }

    return errors;
  },

  // Get predefined header templates
  getHeaderTemplates: () => [
    {
      name: 'Security Headers',
      headers: [
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'X-XSS-Protection', value: '1; mode=block' }
      ]
    },
    {
      name: 'CORS Headers',
      headers: [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
      ]
    },
    {
      name: 'Tracking Headers',
      headers: [
        { name: 'X-Request-ID', value: '{{request_id}}' },
        { name: 'X-User-Agent', value: '{{user_agent}}' },
        { name: 'X-Timestamp', value: '{{timestamp}}' }
      ]
    }
  ],

  // Get feature-specific help text
  getHelpText: () => ({
    title: 'Custom Headers Help',
    content: `
      Custom Headers allow you to add specific HTTP headers to API requests made by your agent.
      This is useful for security, tracking, compliance, or integration requirements.

      **Common Use Cases:**
      • Security headers (CORS, CSP, etc.)
      • Authentication tokens
      • Request tracking and correlation IDs
      • API versioning headers
      • Custom business logic headers

      **Header Variables:**
      • {{request_id}}: Unique request identifier
      • {{timestamp}}: Current timestamp
      • {{user_agent}}: Agent user agent string
      • {{agent_id}}: Your agent's ID

      **Security Considerations:**
      • Avoid exposing sensitive information
      • Validate header values
      • Use secure headers only when needed
    `
  })
};

export default customHeadersFeature;