/**
 * User Authentication Feature
 *
 * Configuration and logic for user authentication functionality
 */
import { Lock as LockIcon } from '@mui/icons-material';

export const userAuthenticationFeature = {
  id: 'user_authentication',
  title: 'User Authentication',
  description: 'Require users to verify their identity before interacting with the agent using SMS or Email OTP verification.',
  icon: LockIcon,
  comingSoon: false,

  // Feature configuration
  getDefaultConfig: () => ({
    enabled: true,
    providers: ['sms'],
    sms_provider: 'twilio',
    email_provider: 'sendgrid',
    require_phone_verification: true,
    require_email_verification: false,
    session_duration_minutes: 60,
    max_attempts: 3,
    cooldown_minutes: 5
  }),

  // Get feature status from agent
  getStatus: (agent) => {
    const enabled = agent?.user_authentication?.enabled || false;
    return {
      enabled,
      status: enabled ? 'Active' : null,
      statusColor: 'success'
    };
  },

  // Update agent with feature configuration
  updateAgent: (agent, configuration) => {
    return {
      ...agent,
      user_authentication: {
        ...configuration,
        enabled: true
      }
    };
  },

  // Disable feature in agent
  disableFeature: (agent) => {
    return {
      ...agent,
      user_authentication: {
        ...agent?.user_authentication,
        enabled: false
      }
    };
  },

  // Validate configuration
  validateConfig: (config) => {
    const errors = [];

    if (!config.providers || config.providers.length === 0) {
      errors.push('At least one authentication provider must be selected');
    }

    if (config.session_duration_minutes < 5 || config.session_duration_minutes > 1440) {
      errors.push('Session duration must be between 5 and 1440 minutes');
    }

    if (config.max_attempts < 1 || config.max_attempts > 10) {
      errors.push('Max attempts must be between 1 and 10');
    }

    if (config.cooldown_minutes < 1 || config.cooldown_minutes > 60) {
      errors.push('Cooldown duration must be between 1 and 60 minutes');
    }

    return errors;
  },

  // Get feature-specific help text
  getHelpText: () => ({
    title: 'User Authentication Help',
    content: `
      User Authentication adds an extra layer of security by requiring users to verify their identity
      before they can interact with your agent. This is especially useful for agents that handle
      sensitive information or business processes.

      **Authentication Methods:**
      • SMS OTP: Send verification codes via SMS
      • Email OTP: Send verification codes via email

      **Security Settings:**
      • Session Duration: How long users stay authenticated
      • Max Attempts: Number of failed verification attempts allowed
      • Cooldown: Time to wait after max attempts exceeded
    `
  })
};

export default userAuthenticationFeature;