/**
 * End-to-End Encryption Feature
 *
 * Configuration and logic for encryption functionality
 */
import { VpnKey as VpnKeyIcon } from '@mui/icons-material';

export const encryptionFeature = {
  id: 'encryption',
  title: 'End-to-End Encryption',
  description: 'Encrypt all communications between users and the agent for maximum privacy and security.',
  icon: VpnKeyIcon,
  comingSoon: true,

  // Feature configuration
  getDefaultConfig: () => ({
    enabled: false,
    encryption_algorithm: 'AES-256-GCM',
    key_rotation_days: 30,
    encrypt_messages: true,
    encrypt_metadata: false,
    encrypt_storage: true,
    perfect_forward_secrecy: true,
    key_derivation: 'PBKDF2',
    salt_length: 32,
    compression_before_encryption: true,
    backup_keys: 3
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
      encryption: {
        ...configuration,
        enabled: true
      }
    };
  },

  // Disable feature in agent
  disableFeature: (agent) => {
    return {
      ...agent,
      encryption: {
        ...agent?.encryption,
        enabled: false
      }
    };
  },

  // Validate configuration
  validateConfig: (config) => {
    const errors = [];

    if (config.key_rotation_days < 1 || config.key_rotation_days > 365) {
      errors.push('Key rotation period must be between 1 and 365 days');
    }

    if (config.salt_length < 16 || config.salt_length > 64) {
      errors.push('Salt length must be between 16 and 64 bytes');
    }

    if (config.backup_keys < 1 || config.backup_keys > 10) {
      errors.push('Number of backup keys must be between 1 and 10');
    }

    return errors;
  },

  // Get encryption algorithms
  getEncryptionAlgorithms: () => [
    {
      value: 'AES-256-GCM',
      label: 'AES-256-GCM',
      description: 'Advanced Encryption Standard with 256-bit key (Recommended)',
      security: 'High'
    },
    {
      value: 'ChaCha20-Poly1305',
      label: 'ChaCha20-Poly1305',
      description: 'Modern stream cipher with authentication',
      security: 'High'
    },
    {
      value: 'AES-128-GCM',
      label: 'AES-128-GCM',
      description: 'AES with 128-bit key (Faster, less secure)',
      security: 'Medium'
    }
  ],

  // Get key derivation functions
  getKeyDerivationFunctions: () => [
    {
      value: 'PBKDF2',
      label: 'PBKDF2',
      description: 'Password-Based Key Derivation Function 2',
      iterations: 100000
    },
    {
      value: 'scrypt',
      label: 'scrypt',
      description: 'Memory-hard key derivation function',
      iterations: 32768
    },
    {
      value: 'Argon2id',
      label: 'Argon2id',
      description: 'Latest password hashing competition winner',
      iterations: 3
    }
  ],

  // Get feature-specific help text
  getHelpText: () => ({
    title: 'End-to-End Encryption Help',
    content: `
      End-to-End Encryption ensures that all data is encrypted before transmission and
      only decrypted on the recipient's device, providing maximum privacy and security.

      **Encryption Features:**
      • Message encryption with authenticated encryption
      • Metadata protection
      • Encrypted storage
      • Perfect Forward Secrecy (PFS)
      • Automatic key rotation
      • Secure key derivation

      **Security Properties:**
      • Only communicating parties can read messages
      • No third party (including service provider) can decrypt
      • Each session uses unique encryption keys
      • Past sessions remain secure if keys are compromised

      **Performance Considerations:**
      • Encryption adds computational overhead
      • Larger message sizes due to encryption metadata
      • Key management complexity
      • Regular key rotation requirements

      **Compliance:**
      • Meets GDPR encryption requirements
      • HIPAA compliant encryption
      • SOC 2 encryption standards
      • Industry best practices
    `
  })
};

export default encryptionFeature;