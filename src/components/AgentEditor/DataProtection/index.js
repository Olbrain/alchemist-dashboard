/**
 * Data Protection Components Export
 * 
 * Centralized exports for all data protection components
 */

import DataProtectionTab from './DataProtectionTab';
import ProtectionToggle from './ProtectionToggle';
import ProtectedDataTypes from './ProtectedDataTypes';
import MaskingPreview from './MaskingPreview';
import ProtectionTester from './ProtectionTester';

// Legacy components (kept for backward compatibility)
import ProtectionLevelSelector from './ProtectionLevelSelector';
import PIIPatternManager from './PIIPatternManager';
import MaskingStrategyConfig from './MaskingStrategyConfig';

// Main component
export default DataProtectionTab;

// New comprehensive protection components
export {
  DataProtectionTab,
  ProtectionToggle,
  ProtectedDataTypes,
  MaskingPreview,
  ProtectionTester
};

// Legacy components (for backward compatibility)
export {
  ProtectionLevelSelector,
  PIIPatternManager,
  MaskingStrategyConfig
};

// Simple data protection constant
export const DATA_PROTECTION_DEFAULT = false;

// Protected data types (for informational display)
export const PROTECTED_DATA_TYPES = [
  'Credit/Debit Cards',
  'Bank Account Numbers',
  'PAN Numbers',
  'Aadhaar Numbers',
  'Phone Numbers',
  'Email Addresses',
  'Passport Numbers',
  'Customer IDs',
  'Transaction IDs',
  'Government IDs'
];

// Helper function to validate boolean data protection setting
export const validateDataProtectionEnabled = (enabled) => {
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    return { valid: false, errors: ['Data protection enabled must be true or false'] };
  }
  return { valid: true, errors: [] };
};