/**
 * Tool Configuration Dialog
 *
 * Generic dialog for configuring public tools
 * Dynamically renders form fields based on tool's configuration_schema
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import {
  saveToolConfiguration,
  getToolConfiguration
} from '../../../services/tools/toolConfigurationService';

const ToolConfigDialog = ({
  open,
  onClose,
  tool,
  agentId,
  onSave
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [error, setError] = useState(null);
  const [enabled, setEnabled] = useState(true);

  // Load existing configuration when dialog opens
  useEffect(() => {
    const loadConfiguration = async () => {
      if (open && tool && agentId) {
        setLoading(true);
        setError(null);

        try {
          const existingConfig = await getToolConfiguration(agentId, tool.id);

          if (existingConfig && existingConfig.configuration) {
            setFormData(existingConfig.configuration);
            setEnabled(existingConfig.enabled ?? true);
          } else {
            // Initialize with empty values
            const initialData = {};
            const schema = tool.configuration_schema || {};

            Object.keys(schema).forEach((fieldName) => {
              initialData[fieldName] = '';
            });

            setFormData(initialData);
            setEnabled(true);
          }
        } catch (err) {
          console.error('Error loading configuration:', err);
          setError('Failed to load existing configuration');
        } finally {
          setLoading(false);
        }
      }
    };

    loadConfiguration();
  }, [open, tool, agentId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({});
      setErrors({});
      setShowPasswords({});
      setError(null);
      setEnabled(true);
    }
  }, [open]);

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const schema = tool.configuration_schema || {};

    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
      const value = formData[fieldName];

      // Required field validation
      if (fieldConfig.required && (!value || value.trim() === '')) {
        newErrors[fieldName] = `${fieldConfig.label || fieldName} is required`;
      }

      // URL validation
      if (fieldConfig.type === 'url' && value && value.trim() !== '') {
        try {
          new URL(value);
        } catch (e) {
          newErrors[fieldName] = 'Please enter a valid URL';
        }
      }

      // Number validation
      if (fieldConfig.type === 'number' && value !== '') {
        if (isNaN(value)) {
          newErrors[fieldName] = 'Please enter a valid number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveToolConfiguration(agentId, tool.id, {
        configuration: formData,
        enabled: enabled,
        enabled_subtools: [] // Can be extended later for subtool selection
      });

      onSave?.();
      onClose();
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldName, fieldConfig) => {
    const value = formData[fieldName] || '';
    const fieldError = errors[fieldName];
    const isPassword = fieldConfig.type === 'password';
    const showPassword = showPasswords[fieldName];

    // Determine input type
    let inputType = 'text';
    if (isPassword && !showPassword) {
      inputType = 'password';
    } else if (fieldConfig.type === 'number') {
      inputType = 'number';
    } else if (fieldConfig.type === 'url') {
      inputType = 'url';
    }

    return (
      <FormControl key={fieldName} fullWidth sx={{ mb: 2 }}>
        <FormLabel sx={{ mb: 0.5, fontWeight: 500 }}>
          {fieldConfig.label || fieldName}
          {fieldConfig.required && <span style={{ color: 'error.main' }}> *</span>}
        </FormLabel>

        <TextField
          value={value}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          type={inputType}
          placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label || fieldName}`}
          error={!!fieldError}
          helperText={fieldError || fieldConfig.description}
          fullWidth
          size="small"
          InputProps={
            isPassword
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility(fieldName)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              : undefined
          }
        />

        {fieldConfig.help_text && !fieldError && (
          <FormHelperText>{fieldConfig.help_text}</FormHelperText>
        )}
      </FormControl>
    );
  };

  if (!tool) {
    return null;
  }

  const schema = tool.configuration_schema || {};
  const hasSchema = Object.keys(schema).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 300 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" component="div">
            Configure {tool.name}
          </Typography>
          {tool.description && (
            <Typography variant="caption" color="text.secondary">
              {tool.description}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : !hasSchema ? (
          <Alert severity="warning">
            This tool does not have a configuration schema defined.
          </Alert>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the required configuration details below. These will be securely stored for this agent.
            </Typography>

            {/* Enable/Disable Toggle */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {enabled ? 'Tool Enabled' : 'Tool Disabled'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {enabled
                        ? 'This tool will be available during agent conversations'
                        : 'This tool will not be available during agent conversations'
                      }
                    </Typography>
                  </Box>
                }
              />
            </Box>

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
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving || !hasSchema}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ToolConfigDialog;
