/**
 * URL Components Builder
 * 
 * Component for building URL from separate components instead of single URL field.
 * Eliminates parameter replacement issues by constructing URLs dynamically.
 */
import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  FormHelperText,
  Chip,
  Paper
} from '@mui/material';
import {
  Info as InfoIcon,
  Language as UrlIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const URLComponentsBuilder = ({ urlComponents, onChange, errors = {} }) => {

  const handleComponentChange = (field, value) => {
    onChange({
      ...urlComponents,
      [field]: value === '' ? (field === 'port' ? null : '') : value
    });
  };

  const validateHost = (host) => {
    if (!host) return false;
    // Basic hostname validation
    const hostRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostRegex.test(host);
  };

  const validateEndpoint = (endpoint) => {
    if (!endpoint) return false;
    // Must start with /
    return endpoint.startsWith('/');
  };

  const extractPathParameters = (endpoint) => {
    const matches = endpoint.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const getPortPlaceholder = () => {
    return urlComponents.protocol === 'https' ? '443' : '80';
  };

  const pathParams = extractPathParameters(urlComponents.endpoint);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UrlIcon />
        URL Configuration
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Configure your API endpoint by breaking it into components. This eliminates parameter replacement issues.
      </Typography>

      <Grid container spacing={3}>
        {/* Protocol */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Protocol</InputLabel>
            <Select
              value={urlComponents?.protocol || 'https'}
              onChange={(e) => handleComponentChange('protocol', e.target.value)}
              label="Protocol"
            >
              <MenuItem value="https">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon fontSize="small" />
                  HTTPS
                </Box>
              </MenuItem>
              <MenuItem value="http">HTTP</MenuItem>
            </Select>
            <FormHelperText>Recommended: HTTPS for security</FormHelperText>
          </FormControl>
        </Grid>

        {/* Host */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Host"
            placeholder="api.example.com"
            value={urlComponents?.host || ''}
            onChange={(e) => handleComponentChange('host', e.target.value)}
            error={!!(errors.host || (urlComponents.host && !validateHost(urlComponents.host)))}
            helperText={
              errors.host || 
              (urlComponents.host && !validateHost(urlComponents.host) ? 'Invalid host format' : 'API server hostname or IP')
            }
            required
          />
        </Grid>

        {/* Port */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Port"
            placeholder={getPortPlaceholder()}
            type="number"
            value={urlComponents?.port || ''}
            onChange={(e) => handleComponentChange('port', e.target.value ? parseInt(e.target.value) : null)}
            helperText={`Default: ${getPortPlaceholder()}`}
            inputProps={{ min: 1, max: 65535 }}
          />
        </Grid>

        {/* Base Path */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Base Path"
            placeholder="/v1/api"
            value={urlComponents?.base_path || ''}
            onChange={(e) => handleComponentChange('base_path', e.target.value)}
            helperText="Optional: API version or base path"
          />
        </Grid>

        {/* Endpoint */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Endpoint"
            placeholder="/users/{id}/orders"
            value={urlComponents?.endpoint || '/'}
            onChange={(e) => handleComponentChange('endpoint', e.target.value)}
            error={!!(errors.endpoint || (urlComponents.endpoint && !validateEndpoint(urlComponents.endpoint)))}
            helperText={
              errors.endpoint || 
              (urlComponents.endpoint && !validateEndpoint(urlComponents.endpoint) 
                ? 'Endpoint must start with /' 
                : 'Use {param} for path parameters')
            }
            required
          />
        </Grid>
      </Grid>

      {/* Path Parameters Detection */}
      {pathParams.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon fontSize="small" />
            <Typography variant="subtitle2">
              Path Parameters Detected
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The following path parameters were found in your endpoint:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {pathParams.map((param, index) => (
              <Chip
                key={index}
                label={param}
                size="small"
                color="primary"
              />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            These will be automatically added as path parameters in the next step.
          </Typography>
        </Paper>
      )}

      {/* URL Preview */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          URL Preview
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {urlComponents.protocol}://{urlComponents.host || 'HOST'}
          {urlComponents.port && urlComponents.port !== (urlComponents.protocol === 'https' ? 443 : 80) 
            ? `:${urlComponents.port}` 
            : ''
          }
          {urlComponents.base_path}
          {urlComponents.endpoint || '/ENDPOINT'}
        </Typography>
      </Paper>

      {/* Validation Alerts */}
      {urlComponents.host && !validateHost(urlComponents.host) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Invalid Host Format:</strong> Please enter a valid hostname or IP address.
        </Alert>
      )}

      {urlComponents.endpoint && !validateEndpoint(urlComponents.endpoint) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Invalid Endpoint:</strong> Endpoints must start with a forward slash (/).
        </Alert>
      )}

      {/* Protocol Security Warning */}
      {urlComponents.protocol === 'http' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Security Warning:</strong> HTTP is not secure. Consider using HTTPS for production APIs.
        </Alert>
      )}
    </Box>
  );
};

export default URLComponentsBuilder;