import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

/**
 * McpConfigDialog - Dynamic configuration dialog for MCP servers
 * Generates form fields based on server's configuration_schema
 */
const McpConfigDialog = ({
  open,
  onClose,
  server,
  existingConfig = null,
  onSave
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form data from existing config or defaults
  useEffect(() => {
    if (open && server) {
      const initialData = {};
      const schema = server.configuration_schema || {};

      Object.keys(schema).forEach(fieldName => {
        const field = schema[fieldName];
        if (existingConfig && existingConfig[fieldName]) {
          initialData[fieldName] = existingConfig[fieldName];
        } else if (field.default !== undefined) {
          initialData[fieldName] = field.default;
        } else {
          initialData[fieldName] = '';
        }
      });

      setFormData(initialData);
      setErrors({});
    }
  }, [open, server, existingConfig]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateField = (fieldName, value, fieldConfig) => {
    const validation = fieldConfig.validation || {};

    // Required check
    if (fieldConfig.required && !value) {
      return `${fieldConfig.label} is required`;
    }

    if (value) {
      // Pattern validation
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          return `${fieldConfig.label} format is invalid`;
        }
      }

      // Min/Max length
      if (validation.minLength && value.length < validation.minLength) {
        return `${fieldConfig.label} must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return `${fieldConfig.label} must be at most ${validation.maxLength} characters`;
      }

      // Min/Max value (for numbers)
      if (validation.minimum !== undefined && Number(value) < validation.minimum) {
        return `${fieldConfig.label} must be at least ${validation.minimum}`;
      }
      if (validation.maximum !== undefined && Number(value) > validation.maximum) {
        return `${fieldConfig.label} must be at most ${validation.maximum}`;
      }

      // Enum validation (for select)
      if (validation.enum && !validation.enum.includes(value)) {
        return `${fieldConfig.label} must be one of: ${validation.enum.join(', ')}`;
      }
    }

    return null;
  };

  const validateForm = () => {
    const schema = server.configuration_schema || {};
    const newErrors = {};

    console.log('🔍 DEBUG validateForm: schema =', schema);
    console.log('🔍 DEBUG validateForm: formData =', formData);

    Object.keys(schema).forEach(fieldName => {
      const field = schema[fieldName];
      const value = formData[fieldName];
      console.log(`🔍 DEBUG validateForm: Checking field "${fieldName}"`, {
        value,
        required: field.required,
        type: field.type,
        validation: field.validation
      });
      const error = validateField(fieldName, value, field);
      if (error) {
        console.log(`❌ DEBUG validateForm: Field "${fieldName}" has error:`, error);
        newErrors[fieldName] = error;
      } else {
        console.log(`✅ DEBUG validateForm: Field "${fieldName}" is valid`);
      }
    });

    console.log('🔍 DEBUG validateForm: newErrors =', newErrors);
    console.log('🔍 DEBUG validateForm: newErrors count =', Object.keys(newErrors).length);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('🔍 DEBUG: handleSave called');
    console.log('🔍 DEBUG: server.id =', server?.id);
    console.log('🔍 DEBUG: formData =', formData);
    console.log('🔍 DEBUG: server.configuration_schema =', server?.configuration_schema);

    const isValid = validateForm();
    console.log('🔍 DEBUG: Form validation result =', isValid);
    console.log('🔍 DEBUG: Validation errors =', errors);

    if (!isValid) {
      console.error('❌ SAVE BLOCKED: Validation failed', errors);
      // Show error to user
      setErrors(prev => ({
        ...prev,
        _general: 'Please fix the validation errors before saving.'
      }));
      return;
    }

    console.log('✅ Validation passed, calling onSave...');
    setSaving(true);
    try {
      await onSave(server.id, formData);
      console.log('✅ onSave completed successfully');
      onClose();
    } catch (error) {
      console.error('❌ Save failed in handleSave:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setErrors({
        _general: error.message || 'Failed to save configuration'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldName, fieldConfig) => {
    const value = formData[fieldName] || '';
    const error = errors[fieldName];

    switch (fieldConfig.type) {
      case 'password':
        return (
          <TextField
            key={fieldName}
            fullWidth
            label={fieldConfig.label}
            type={showPassword[fieldName] ? 'text' : 'password'}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            error={!!error}
            helperText={error || fieldConfig.help_text}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(prev => ({
                      ...prev,
                      [fieldName]: !prev[fieldName]
                    }))}
                    edge="end"
                  >
                    {showPassword[fieldName] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        );

      case 'url':
      case 'email':
      case 'text':
        return (
          <TextField
            key={fieldName}
            fullWidth
            label={fieldConfig.label}
            type={fieldConfig.type === 'url' ? 'url' : fieldConfig.type === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            error={!!error}
            helperText={error || fieldConfig.help_text}
          />
        );

      case 'number':
      case 'port':
        return (
          <TextField
            key={fieldName}
            fullWidth
            label={fieldConfig.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            error={!!error}
            helperText={error || fieldConfig.help_text}
            inputProps={{
              min: fieldConfig.validation?.minimum,
              max: fieldConfig.validation?.maximum
            }}
          />
        );

      case 'select':
        const options = fieldConfig.validation?.enum || [];
        return (
          <FormControl key={fieldName} fullWidth error={!!error}>
            <InputLabel required={fieldConfig.required}>
              {fieldConfig.label}
            </InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              label={fieldConfig.label}
            >
              {options.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {error || fieldConfig.help_text}
            </FormHelperText>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl key={fieldName} fullWidth>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Select
                value={value ? 'true' : 'false'}
                onChange={(e) => handleFieldChange(fieldName, e.target.value === 'true')}
                size="small"
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
              <Typography variant="body2">{fieldConfig.label}</Typography>
            </Box>
            {(error || fieldConfig.help_text) && (
              <FormHelperText error={!!error}>
                {error || fieldConfig.help_text}
              </FormHelperText>
            )}
          </FormControl>
        );

      default:
        return (
          <TextField
            key={fieldName}
            fullWidth
            label={fieldConfig.label}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
            error={!!error}
            helperText={error || fieldConfig.help_text}
          />
        );
    }
  };

  if (!server) return null;

  const schema = server.configuration_schema || {};
  const hasFields = Object.keys(schema).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">
              Configure {server.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {server.description}
            </Typography>
          </Box>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {errors._general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._general}
          </Alert>
        )}

        {!hasFields ? (
          <Alert severity="info">
            This MCP server does not require any configuration.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Server Info */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={server.category} size="small" />
              {server.capabilities?.map(cap => (
                <Chip key={cap} label={cap} size="small" variant="outlined" />
              ))}
            </Box>

            {/* Dynamic Form Fields */}
            {Object.entries(schema).map(([fieldName, fieldConfig]) =>
              renderField(fieldName, fieldConfig)
            )}

          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default McpConfigDialog;
