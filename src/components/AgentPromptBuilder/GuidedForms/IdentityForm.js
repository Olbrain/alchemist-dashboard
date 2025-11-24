/**
 * Identity Form - Guided Form Component
 *
 * Structured form for collecting agent identity information
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import {
  IDENTITY_SCHEMA,
  IDENTITY_ROLES,
  validateIdentity
} from '../../../services/prompts/structuredDataSchemas';

const IdentityForm = ({
  data = IDENTITY_SCHEMA,
  onChange,
  onFieldChange,
  disabled = false
}) => {
  const [formData, setFormData] = useState(data);
  const [validation, setValidation] = useState({ isValid: false, errors: {} });

  // Validate on data change
  useEffect(() => {
    const validationResult = validateIdentity(formData);
    setValidation(validationResult);
  }, [formData]);

  // Handle field change - calls API directly via parent
  const handleFieldChange = (field, value, isTextInput = true) => {
    // Update local state immediately for responsive UI
    const updatedData = {
      ...formData,
      [field]: value
    };
    setFormData(updatedData);

    // Call parent's field change handler (calls API directly for this ONE field)
    if (onFieldChange) {
      onFieldChange(field, value, isTextInput);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Section Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Agent Identity
        </Typography>
        <Chip
          icon={validation.isValid ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          label={validation.isValid ? 'Complete' : 'Incomplete'}
          color={validation.isValid ? 'success' : 'default'}
          size="small"
          sx={{ height: 22 }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define your agent's core identity, role, and purpose. This information helps shape how your agent presents itself.
      </Typography>

      {/* Agent Name */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Agent Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value, true)}
          disabled={disabled}
          error={!!validation.errors.name}
          helperText={validation.errors.name || 'What should we call your agent?'}
          placeholder="e.g., Sarah, TechBot, Support Assistant"
          required
        />
      </Box>

      {/* Role Selection */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          select
          label="Primary Role"
          value={formData.role}
          onChange={(e) => handleFieldChange('role', e.target.value, false)}
          disabled={disabled}
          error={!!validation.errors.role}
          helperText={validation.errors.role || 'Select the primary role that best describes your agent'}
          required
        >
          <MenuItem value="" disabled>
            <em>Select a role</em>
          </MenuItem>
          {IDENTITY_ROLES.map((role) => (
            <MenuItem key={role.value} value={role.value}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {role.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Domain/Industry */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Domain / Industry"
          value={formData.domain}
          onChange={(e) => handleFieldChange('domain', e.target.value, true)}
          disabled={disabled}
          helperText="What industry or domain does your agent specialize in?"
          placeholder="e.g., E-commerce, Healthcare, Education, Technology"
        />
      </Box>

      {/* Purpose */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Main Purpose"
          value={formData.purpose}
          onChange={(e) => handleFieldChange('purpose', e.target.value, true)}
          disabled={disabled}
          error={!!validation.errors.purpose}
          helperText={
            validation.errors.purpose ||
            'Describe the main purpose of your agent in 1-2 sentences (at least 20 characters)'
          }
          placeholder="e.g., Help customers find products, answer questions, and complete purchases quickly"
          required
        />
      </Box>

      {/* Target Users */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Target Users"
          value={formData.users}
          onChange={(e) => handleFieldChange('users', e.target.value, true)}
          disabled={disabled}
          error={!!validation.errors.users}
          helperText={validation.errors.users || 'Who will interact with this agent?'}
          placeholder="e.g., Online shoppers, business owners, students"
          required
        />
      </Box>

      {/* Additional Context (Optional) */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Additional Context (Optional)"
          value={formData.context}
          onChange={(e) => handleFieldChange('context', e.target.value, true)}
          disabled={disabled}
          helperText="Any other important context or background information about your agent"
          placeholder="e.g., Works 24/7, integrates with our CRM, supports multiple languages"
        />
      </Box>

      {/* Validation Summary */}
      {!validation.isValid && Object.keys(validation.errors).length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, borderLeft: 3, borderColor: 'warning.main' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'warning.dark' }}>
            Required fields missing:
          </Typography>
          {Object.values(validation.errors).map((error, index) => (
            <Typography key={index} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              • {error}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default React.memo(IdentityForm);
