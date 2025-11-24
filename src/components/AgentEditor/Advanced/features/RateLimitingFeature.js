/**
 * Rate Limiting Feature
 *
 * Configuration and logic for rate limiting functionality
 */
import { Speed as SpeedIcon } from '@mui/icons-material';

export const rateLimitingFeature = {
  id: 'rate_limiting',
  title: 'Rate Limiting',
  description: 'Control the number of requests users can make per minute/hour to prevent abuse and manage costs.',
  icon: SpeedIcon,
  comingSoon: true,

  // Feature configuration
  getDefaultConfig: () => ({
    enabled: false,
    requests_per_minute: 10,
    requests_per_hour: 100,
    requests_per_day: 1000,
    burst_allowance: 5,
    rate_limit_by: 'ip_address', // ip_address, user_id, session
    whitelist_ips: [],
    error_message: 'Rate limit exceeded. Please try again later.',
    retry_after_seconds: 60
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
      rate_limiting: {
        ...configuration,
        enabled: true
      }
    };
  },

  // Disable feature in agent
  disableFeature: (agent) => {
    return {
      ...agent,
      rate_limiting: {
        ...agent?.rate_limiting,
        enabled: false
      }
    };
  },

  // Validate configuration
  validateConfig: (config) => {
    const errors = [];

    if (config.requests_per_minute < 1 || config.requests_per_minute > 1000) {
      errors.push('Requests per minute must be between 1 and 1000');
    }

    if (config.requests_per_hour < config.requests_per_minute) {
      errors.push('Requests per hour must be greater than or equal to requests per minute');
    }

    if (config.burst_allowance < 0) {
      errors.push('Burst allowance cannot be negative');
    }

    return errors;
  },

  // Get feature-specific help text
  getHelpText: () => ({
    title: 'Rate Limiting Help',
    content: `
      Rate Limiting helps control API usage and prevents abuse by limiting the number of
      requests users can make within specific time periods.

      **Limiting Options:**
      • Per minute, hour, and daily limits
      • Burst allowance for temporary spikes
      • IP-based or user-based limiting
      • Whitelist support for trusted sources

      **Use Cases:**
      • Prevent API abuse
      • Manage infrastructure costs
      • Ensure fair usage among users
      • Protect against DDoS attacks
    `
  })
};

export default rateLimitingFeature;