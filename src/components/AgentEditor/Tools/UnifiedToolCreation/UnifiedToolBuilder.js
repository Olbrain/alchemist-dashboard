/**
 * Unified Tool Builder
 * 
 * Component for creating tools using the new unified structure.
 * Eliminates parameter replacement through component-based URL building.
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  Chip,
  FormHelperText,
  Card,
  CardContent,
  CardHeader,
  Tooltip
} from '@mui/material';
import {
  Api as ApiIcon,
  Security as SecurityIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import URLComponentsBuilder from './URLComponentsBuilder';
import UnifiedParameterManager from './UnifiedParameterManager';
import RequestBodyBuilder from './RequestBodyBuilder';
import AuthenticationBuilder from './AuthenticationBuilder';
import URLPreview from './URLPreview';

const steps = [
  'Basic Information',
  'URL Configuration',
  'Parameters',
  'Request Body',
  'Authentication',
  'Review & Test'
];

// Helper function to validate snake_case format
const isValidSnakeCase = (name) => {
  // Pattern: lowercase letters, numbers, and underscores
  // Must start with a lowercase letter
  // No consecutive underscores, no leading/trailing underscores
  const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
  return snakeCaseRegex.test(name);
};

const UnifiedToolBuilder = ({
  open,
  onClose,
  onToolCreate,
  agentId,
  existingTool = null
}) => {
  console.log('=== UNIFIED TOOL BUILDER PROPS ===');
  console.log('UnifiedToolBuilder received props:', { 
    open, 
    existingTool: !!existingTool, 
    agentId 
  });
  if (existingTool) {
    console.log('existingTool data:', existingTool);
    console.log('existingTool.url_components:', existingTool.url_components);
    console.log('existingTool keys:', Object.keys(existingTool));
  }

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tool configuration state
  const [toolConfig, setToolConfig] = useState({
    name: '',
    description: '',
    method: 'GET',
    url_components: {
      protocol: 'https',
      host: '',
      port: null,
      base_path: '',
      endpoint: '/'
    },
    parameters: [],
    request_body: {
      enabled: false,
      content_type: 'application/json',
      schema: {},
      example: null,
      required: false
    },
    authentication: {
      type: 'none',
      token_location: 'header',
      token_name: 'Authorization',
      token_prefix: 'Bearer ',
      token_value: '',
      username: '',
      password: ''
    },
    response_config: {
      expected_content_type: 'application/json',
      success_status_codes: [200, 201, 202, 204],
      timeout: 30
    },
    // visibility removed - always private for custom tools
    tags: [],
    version: '1.0.0'
  });

  // Initialize with existing tool data if editing
  useEffect(() => {
    console.log('=== UNIFIED TOOL BUILDER USE EFFECT ===');
    console.log('useEffect triggered with:', { 
      existingTool: !!existingTool, 
      open,
      existingToolData: existingTool 
    });
    
    if (existingTool && open) {
      console.log('Setting toolConfig with existingTool:', existingTool);
      console.log('existingTool.url_components before setToolConfig:', existingTool.url_components);
      // Use the Firestore document as-is, no transformation needed
      setToolConfig(existingTool);
      console.log('toolConfig updated with existingTool');
    } else if (open) {
      console.log('Opening for new tool creation - setting defaults');
      // Reset to defaults when opening for new tool creation
      setToolConfig({
        name: '',
        description: '',
        method: 'GET',
        url_components: {
          protocol: 'https',
          host: '',
          port: null,
          base_path: '',
          endpoint: '/'
        },
        parameters: [],
        request_body: {
          enabled: false,
          content_type: 'application/json',
          schema: {},
          example: null,
          required: false
        },
        authentication: {
          type: 'none',
          token_location: 'header',
          token_name: 'Authorization',
          token_prefix: 'Bearer ',
          token_value: '',
          username: '',
          password: ''
        },
        response_config: {
          expected_content_type: 'application/json',
          success_status_codes: [200, 201, 202, 204],
          timeout: 30
        },
        // visibility removed - always private for custom tools
        tags: [],
        version: '1.0.0'
      });
    }
  }, [existingTool, open]);

  const updateToolConfig = (section, data) => {
    if (!section || section === '') {
      // Update root-level fields directly
      setToolConfig(prev => ({
        ...prev,
        ...data
      }));
    } else {
      // Update nested section
      setToolConfig(prev => ({
        ...prev,
        [section]: { ...prev[section], ...data }
      }));
    }
    
    // Clear errors for the updated section or fields
    if (section && errors[section]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[section];
        return newErrors;
      });
    } else if (!section || section === '') {
      // Clear errors for root-level fields
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(data).forEach(key => {
          delete newErrors[key];
        });
        return newErrors;
      });
    }
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};

    switch (stepIndex) {
      case 0: // Basic Information
        if (!toolConfig.name?.trim()) {
          newErrors.name = 'Tool name is required';
        } else if (!isValidSnakeCase(toolConfig.name.trim())) {
          newErrors.name = 'Tool name must be in snake_case format (e.g., get_account_balance). Only lowercase letters, numbers, and underscores allowed. Must start with a letter.';
        }
        if (!toolConfig.method) {
          newErrors.method = 'HTTP method is required';
        }
        break;

      case 1: // URL Configuration
        if (!toolConfig.url_components.host?.trim()) {
          newErrors.host = 'Host is required';
        }
        if (!toolConfig.url_components.endpoint?.trim()) {
          newErrors.endpoint = 'Endpoint is required';
        }
        break;

      case 2: // Parameters
        // Validate parameter consistency with endpoint
        const endpointPathParams = extractPathParameters(toolConfig.url_components.endpoint);
        const definedPathParams = toolConfig.parameters
          .filter(p => p.location === 'path')
          .map(p => p.name);
        
        endpointPathParams.forEach(param => {
          if (!definedPathParams.includes(param)) {
            newErrors.parameters = `Path parameter '${param}' in endpoint not defined`;
          }
        });
        break;

      case 3: // Request Body
        if (toolConfig.request_body.enabled && ['GET', 'HEAD', 'DELETE'].includes(toolConfig.method)) {
          newErrors.request_body = `${toolConfig.method} requests cannot have request body`;
        }
        break;

      case 4: // Authentication
        if (toolConfig.authentication.type === 'bearer' && !toolConfig.authentication.token_value?.trim()) {
          newErrors.auth_token = 'Bearer token is required';
        }
        if (toolConfig.authentication.type === 'api_key' && !toolConfig.authentication.token_value?.trim()) {
          newErrors.auth_token = 'API key is required';
        }
        if (toolConfig.authentication.type === 'basic') {
          if (!toolConfig.authentication.username?.trim()) {
            newErrors.auth_username = 'Username is required for basic auth';
          }
          if (!toolConfig.authentication.password?.trim()) {
            newErrors.auth_password = 'Password is required for basic auth';
          }
        }
        break;

      default:
        // No validation needed for other steps
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const extractPathParameters = (endpoint) => {
    const matches = endpoint.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const toolData = {
        ...toolConfig,
        agent_id: agentId
      };

      await onToolCreate(toolData);
      handleClose();
    } catch (error) {
      console.error('Failed to create tool:', error);
      setErrors({ submit: error.message || 'Failed to create tool' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tool Name"
                  value={toolConfig.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateToolConfig('', { name: value });
                    // Provide real-time validation feedback
                    if (value && !isValidSnakeCase(value)) {
                      setErrors(prev => ({
                        ...prev,
                        name: 'Tool name must be in snake_case format (e.g., get_account_balance)'
                      }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                  error={!!errors.name}
                  helperText={errors.name || 'Use snake_case format (e.g., get_user_data, send_email, calculate_tax)'}
                  placeholder="get_account_balance"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={toolConfig.description}
                  onChange={(e) => updateToolConfig('', { description: e.target.value })}
                  helperText="Describe what this tool does"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!errors.method}>
                  <InputLabel>HTTP Method</InputLabel>
                  <Select
                    value={toolConfig.method}
                    onChange={(e) => updateToolConfig('', { method: e.target.value })}
                    label="HTTP Method"
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                    <MenuItem value="PATCH">PATCH</MenuItem>
                  </Select>
                  {errors.method && <FormHelperText>{errors.method}</FormHelperText>}
                </FormControl>
              </Grid>
              {/* Visibility removed - all custom tools are private by default */}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <URLComponentsBuilder
              urlComponents={toolConfig.url_components || {}}
              onChange={(data) => updateToolConfig('url_components', data)}
              errors={errors}
            />
            <Box sx={{ mt: 3 }}>
              <URLPreview
                urlComponents={toolConfig.url_components}
                parameters={toolConfig.parameters}
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <UnifiedParameterManager
              parameters={toolConfig.parameters}
              endpoint={toolConfig.url_components.endpoint}
              method={toolConfig.method}
              onChange={(parameters) => updateToolConfig('', { parameters })}
              errors={errors}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <RequestBodyBuilder
              requestBody={toolConfig.request_body}
              method={toolConfig.method}
              onChange={(data) => updateToolConfig('request_body', data)}
              errors={errors}
            />
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <AuthenticationBuilder
              authentication={toolConfig.authentication}
              onChange={(data) => updateToolConfig('authentication', data)}
              errors={errors}
            />
          </Box>
        );

      case 5:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Tool Configuration
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardHeader
                title="Basic Information"
                avatar={<ApiIcon />}
              />
              <CardContent>
                <Typography><strong>Name:</strong> {toolConfig.name}</Typography>
                <Typography><strong>Method:</strong> {toolConfig.method}</Typography>
                <Typography><strong>Description:</strong> {toolConfig.description || 'None'}</Typography>
                {/* Visibility removed - all custom tools are private */}
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardHeader 
                title="URL Configuration"
                avatar={<PreviewIcon />}
              />
              <CardContent>
                <URLPreview
                  urlComponents={toolConfig.url_components}
                  parameters={toolConfig.parameters}
                  showDetails={true}
                />
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardHeader 
                title="Parameters"
                avatar={<InfoIcon />}
              />
              <CardContent>
                {toolConfig.parameters.length === 0 ? (
                  <Typography color="textSecondary">No parameters defined</Typography>
                ) : (
                  toolConfig.parameters.map((param, index) => (
                    <Chip
                      key={index}
                      label={`${param.name} (${param.location})`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      color={param.required ? 'primary' : 'default'}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {toolConfig.request_body.enabled && (
              <Card sx={{ mb: 2 }}>
                <CardHeader 
                  title="Request Body"
                  avatar={<CodeIcon />}
                />
                <CardContent>
                  <Typography><strong>Content Type:</strong> {toolConfig.request_body.content_type}</Typography>
                  <Typography><strong>Required:</strong> {toolConfig.request_body.required ? 'Yes' : 'No'}</Typography>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader 
                title="Authentication"
                avatar={<SecurityIcon />}
              />
              <CardContent>
                <Typography><strong>Type:</strong> {toolConfig.authentication.type}</Typography>
                {toolConfig.authentication.type !== 'none' && (
                  <Typography><strong>Location:</strong> {toolConfig.authentication.token_location}</Typography>
                )}
              </CardContent>
            </Card>

            {errors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.submit}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ApiIcon />
          {existingTool ? 'Edit Tool' : 'Create New Tool'}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ width: '100%' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? null : <CheckIcon />}
          >
            {isSubmitting ? 'Creating...' : existingTool ? 'Update Tool' : 'Create Tool'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UnifiedToolBuilder;