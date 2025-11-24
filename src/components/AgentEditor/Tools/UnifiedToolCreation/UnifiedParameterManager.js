/**
 * Unified Parameter Manager
 * 
 * Manages parameters for the unified tool structure with automatic path parameter detection
 * and support for all parameter locations (path, query, header, body).
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const PARAMETER_TYPES = [
  'string', 'number', 'integer', 'boolean', 'array', 'object'
];

const PARAMETER_LOCATIONS = [
  { value: 'path', label: 'Path', description: 'URL path parameter (e.g., /users/{id})' },
  { value: 'query', label: 'Query', description: 'URL query parameter (e.g., ?status=active)' },
  { value: 'header', label: 'Header', description: 'HTTP header (e.g., Authorization)' },
  { value: 'body', label: 'Body', description: 'Request body parameter (for POST/PUT)' }
];

const UnifiedParameterManager = ({ 
  parameters = [], 
  endpoint = '/', 
  method = 'GET', 
  onChange, 
  errors = {} 
}) => {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newParameter, setNewParameter] = useState({
    name: '',
    type: 'string',
    location: 'query',
    required: false,
    description: '',
    example: '',
    default: '',
    enum: [],
    validation: {}
  });

  // Extract path parameters from endpoint
  const extractPathParameters = (endpoint) => {
    const matches = endpoint.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  // Auto-sync path parameters with endpoint
  useEffect(() => {
    const endpointPathParams = extractPathParameters(endpoint);
    const currentPathParams = parameters.filter(p => p.location === 'path').map(p => p.name);
    const otherParams = parameters.filter(p => p.location !== 'path');

    // Add missing path parameters
    const missingPathParams = endpointPathParams.filter(name => !currentPathParams.includes(name));
    const removedPathParams = currentPathParams.filter(name => !endpointPathParams.includes(name));

    if (missingPathParams.length > 0 || removedPathParams.length > 0) {
      const updatedPathParams = endpointPathParams.map(name => {
        // Find existing parameter or create new one
        const existing = parameters.find(p => p.name === name && p.location === 'path');
        return existing || {
          name,
          type: 'string',
          location: 'path',
          required: true,
          description: `Path parameter: ${name}`,
          example: `example-${name}`,
          default: '',
          enum: [],
          validation: {}
        };
      });

      onChange([...updatedPathParams, ...otherParams]);
    }
  }, [endpoint, parameters, onChange]);

  const handleAddParameter = () => {
    if (!newParameter.name.trim()) return;

    const updatedParameters = [...parameters, { ...newParameter }];
    onChange(updatedParameters);
    
    // Reset form
    setNewParameter({
      name: '',
      type: 'string',
      location: 'query',
      required: false,
      description: '',
      example: '',
      default: '',
      enum: [],
      validation: {}
    });
  };

  const handleEditParameter = (index) => {
    setEditingIndex(index);
    setNewParameter({ ...parameters[index] });
  };

  const handleUpdateParameter = () => {
    const updatedParameters = [...parameters];
    updatedParameters[editingIndex] = { ...newParameter };
    onChange(updatedParameters);
    
    setEditingIndex(-1);
    setNewParameter({
      name: '',
      type: 'string',
      location: 'query',
      required: false,
      description: '',
      example: '',
      default: '',
      enum: [],
      validation: {}
    });
  };

  const handleDeleteParameter = (index) => {
    const parameter = parameters[index];
    
    // Prevent deletion of required path parameters
    if (parameter.location === 'path' && extractPathParameters(endpoint).includes(parameter.name)) {
      return;
    }

    const updatedParameters = parameters.filter((_, i) => i !== index);
    onChange(updatedParameters);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setNewParameter({
      name: '',
      type: 'string',
      location: 'query',
      required: false,
      description: '',
      example: '',
      default: '',
      enum: [],
      validation: {}
    });
  };

  const isValidParameterName = (name) => {
    return /^[a-zA-Z0-9_-]+$/.test(name);
  };

  const canDeleteParameter = (parameter) => {
    // Can't delete path parameters that are in the endpoint
    if (parameter.location === 'path') {
      return !extractPathParameters(endpoint).includes(parameter.name);
    }
    return true;
  };

  const getLocationColor = (location) => {
    const colors = {
      path: 'primary',
      query: 'info',
      header: 'warning', 
      body: 'success'
    };
    return colors[location] || 'default';
  };

  const getAvailableLocations = () => {
    // Body parameters only available for POST/PUT/PATCH
    if (['GET', 'HEAD', 'DELETE'].includes(method)) {
      return PARAMETER_LOCATIONS.filter(loc => loc.value !== 'body');
    }
    return PARAMETER_LOCATIONS;
  };

  const endpointPathParams = extractPathParameters(endpoint);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Parameter Configuration
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Define parameters for your API endpoint. Path parameters are automatically detected from your endpoint pattern.
      </Typography>

      {/* Path Parameters Auto-Detection Info */}
      {endpointPathParams.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon fontSize="small" />
            <Typography variant="subtitle2">Auto-detected Path Parameters</Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Path parameters from endpoint <code>{endpoint}</code>:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {endpointPathParams.map((param, index) => (
              <Chip key={index} label={param} size="small" color="primary" />
            ))}
          </Box>
        </Alert>
      )}

      {/* Current Parameters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Parameters ({parameters.length})
        </Typography>

        {parameters.length === 0 ? (
          <Alert severity="info">
            No parameters defined yet. Add parameters below or use path parameters in your endpoint.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {parameters.map((parameter, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    border: parameter.location === 'path' ? 2 : 1,
                    borderColor: parameter.location === 'path' ? 'primary.main' : 'divider'
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {parameter.name}
                        </Typography>
                        <Chip
                          label={parameter.location}
                          size="small"
                          color={getLocationColor(parameter.location)}
                        />
                      </Box>
                    }
                    action={
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditParameter(index)}
                        >
                          <EditIcon />
                        </IconButton>
                        {canDeleteParameter(parameter) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteParameter(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    }
                    sx={{ pb: 1 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {parameter.type}
                      {parameter.required && (
                        <Chip label="Required" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    {parameter.description && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {parameter.description}
                      </Typography>
                    )}
                    {parameter.example && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        Example: {parameter.example}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Add/Edit Parameter Form */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            {editingIndex >= 0 ? 'Edit Parameter' : 'Add New Parameter'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Parameter Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parameter Name"
                value={newParameter.name}
                onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                error={newParameter.name && !isValidParameterName(newParameter.name)}
                helperText={
                  newParameter.name && !isValidParameterName(newParameter.name)
                    ? 'Use only letters, numbers, underscore, and hyphen'
                    : 'Unique parameter identifier'
                }
                required
              />
            </Grid>

            {/* Parameter Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newParameter.type}
                  onChange={(e) => setNewParameter({ ...newParameter, type: e.target.value })}
                  label="Type"
                >
                  {PARAMETER_TYPES.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Parameter Location */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={newParameter.location}
                  onChange={(e) => setNewParameter({ ...newParameter, location: e.target.value })}
                  label="Location"
                  disabled={editingIndex >= 0 && parameters[editingIndex]?.location === 'path'}
                >
                  {getAvailableLocations().map(location => (
                    <MenuItem key={location.value} value={location.value}>
                      {location.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {PARAMETER_LOCATIONS.find(l => l.value === newParameter.location)?.description}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Required Switch */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newParameter.required}
                    onChange={(e) => setNewParameter({ ...newParameter, required: e.target.checked })}
                    disabled={newParameter.location === 'path'} // Path params are always required
                  />
                }
                label="Required Parameter"
              />
              {newParameter.location === 'path' && (
                <FormHelperText>Path parameters are always required</FormHelperText>
              )}
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newParameter.description}
                onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                multiline
                rows={2}
                helperText="Describe what this parameter is used for"
              />
            </Grid>

            {/* Example Value */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Example Value"
                value={newParameter.example}
                onChange={(e) => setNewParameter({ ...newParameter, example: e.target.value })}
                helperText="Example value for documentation"
              />
            </Grid>

            {/* Default Value */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Value"
                value={newParameter.default}
                onChange={(e) => setNewParameter({ ...newParameter, default: e.target.value })}
                helperText="Default value (optional)"
                disabled={newParameter.required}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {editingIndex >= 0 ? (
              <>
                <Button onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateParameter}
                  disabled={!newParameter.name || !isValidParameterName(newParameter.name)}
                  startIcon={<CheckIcon />}
                >
                  Update Parameter
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleAddParameter}
                disabled={!newParameter.name || !isValidParameterName(newParameter.name)}
                startIcon={<AddIcon />}
              >
                Add Parameter
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Validation Errors */}
      {errors.parameters && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.parameters}
        </Alert>
      )}

      {/* Method-specific Warnings */}
      {method === 'GET' && parameters.some(p => p.location === 'body') && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <WarningIcon sx={{ mr: 1 }} />
          GET requests cannot have body parameters. Consider using query parameters instead.
        </Alert>
      )}
    </Box>
  );
};

export default UnifiedParameterManager;