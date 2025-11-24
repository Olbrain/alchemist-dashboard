/**
 * Data Protection Feature
 *
 * Configuration and logic for data protection functionality
 */
import { Security as SecurityIcon } from '@mui/icons-material';

export const dataProtectionFeature = {
  id: 'data_protection',
  title: 'Data Protection',
  description: 'Automatically detect and mask sensitive information like PII, phone numbers, emails, and credit cards in conversations.',
  icon: SecurityIcon,
  comingSoon: false,

  // Feature configuration
  getDefaultConfig: () => ({
    enabled: true,
    protection_level: 'moderate',
    mask_pii: true,
    mask_emails: true,
    mask_phones: true,
    mask_credit_cards: true,
    mask_ssn: false,
    custom_patterns: [],
    masking_character: '*',
    preserve_length: true
  }),

  // Get feature status from agent
  getStatus: (agent) => {
    const enabled = agent?.data_protection_enabled || false;
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
      data_protection_enabled: true,
      data_protection: configuration
    };
  },

  // Disable feature in agent
  disableFeature: (agent) => {
    return {
      ...agent,
      data_protection_enabled: false
    };
  },

  // Validate configuration
  validateConfig: (config) => {
    const errors = [];

    if (config.masking_character && config.masking_character.length !== 1) {
      errors.push('Masking character must be exactly one character');
    }

    if (config.custom_patterns && config.custom_patterns.some(pattern => !pattern.regex)) {
      errors.push('All custom patterns must have a valid regex');
    }

    return errors;
  },

  // Get protection levels
  getProtectionLevels: () => [
    {
      value: 'basic',
      label: 'Basic',
      description: 'Mask common PII patterns',
      features: ['Email addresses', 'Phone numbers']
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: 'Comprehensive PII protection',
      features: ['Email addresses', 'Phone numbers', 'Credit cards', 'Basic PII']
    },
    {
      value: 'strict',
      label: 'Strict',
      description: 'Maximum protection with custom patterns',
      features: ['All moderate features', 'SSN', 'Custom patterns', 'Advanced PII detection']
    }
  ],

  // Get feature-specific help text
  getHelpText: () => ({
    title: 'Data Protection Help',
    content: `
      Data Protection automatically identifies and masks sensitive information in conversations
      to protect user privacy and ensure compliance with data protection regulations.

      **Protection Levels:**
      • Basic: Essential protection for common data types
      • Moderate: Comprehensive protection for most use cases
      • Strict: Maximum protection with custom pattern support

      **Data Types Protected:**
      • Personal Identifiable Information (PII)
      • Email addresses
      • Phone numbers
      • Credit card numbers
      • Social Security Numbers (SSN)
      • Custom patterns (regex-based)

      **Masking Options:**
      • Choose masking character (*, #, X, etc.)
      • Preserve original text length
      • Custom replacement patterns
    `
  })
};

export default dataProtectionFeature;