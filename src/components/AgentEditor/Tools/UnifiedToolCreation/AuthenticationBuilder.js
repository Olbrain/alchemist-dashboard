/**
 * Authentication Builder
 * 
 * Component for configuring API authentication methods.
 */
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Alert,
  Paper,
  FormHelperText
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  VpnKey as KeyIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const AUTH_TYPES = [
  { value: 'none', label: 'None', description: 'No authentication required' },
  { value: 'bearer', label: 'Bearer Token', description: 'JWT or API token in Authorization header' },
  { value: 'api_key', label: 'API Key', description: 'API key in header or query parameter' },
  { value: 'basic', label: 'Basic Auth', description: 'Username and password authentication' }
];

const AuthenticationBuilder = ({ 
  authentication, 
  onChange, 
  errors = {} 
}) => {
  const handleChange = (field, value) => {
    onChange({
      ...authentication,
      [field]: value
    });
  };

  const getAuthIcon = (type) => {
    const icons = {
      none: null,
      bearer: <KeyIcon />,
      api_key: <KeyIcon />,
      basic: <PersonIcon />
    };
    return icons[type];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon />
        Authentication Configuration
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Configure how your tool authenticates with the API endpoint.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Authentication Type */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Authentication Type</InputLabel>
              <Select
                value={authentication.type}
                onChange={(e) => handleChange('type', e.target.value)}
                label="Authentication Type"
              >
                {AUTH_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getAuthIcon(type.value)}
                      <Box>
                        <Typography variant="body2">{type.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Bearer Token Configuration */}
          {authentication.type === 'bearer' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Header Name"
                  value={authentication.token_name}
                  onChange={(e) => handleChange('token_name', e.target.value)}
                  placeholder="Authorization"
                  helperText="Header name for the bearer token"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Token Prefix"
                  value={authentication.token_prefix}
                  onChange={(e) => handleChange('token_prefix', e.target.value)}
                  placeholder="Bearer "
                  helperText="Prefix before the token (include space)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bearer Token"
                  type="password"
                  value={authentication.token_value}
                  onChange={(e) => handleChange('token_value', e.target.value)}
                  error={!!errors.auth_token}
                  helperText={errors.auth_token || "The actual bearer token value"}
                  required
                />
              </Grid>
            </>
          )}

          {/* API Key Configuration */}
          {authentication.type === 'api_key' && (
            <>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={authentication.token_location}
                    onChange={(e) => handleChange('token_location', e.target.value)}
                    label="Location"
                  >
                    <MenuItem value="header">Header</MenuItem>
                    <MenuItem value="query">Query Parameter</MenuItem>
                  </Select>
                  <FormHelperText>Where to send the API key</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Key Name"
                  value={authentication.token_name}
                  onChange={(e) => handleChange('token_name', e.target.value)}
                  placeholder="X-API-Key"
                  helperText="Header/parameter name"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={authentication.token_value}
                  onChange={(e) => handleChange('token_value', e.target.value)}
                  error={!!errors.auth_token}
                  helperText={errors.auth_token || "The API key value"}
                  required
                />
              </Grid>
            </>
          )}

          {/* Basic Auth Configuration */}
          {authentication.type === 'basic' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={authentication.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  error={!!errors.auth_username}
                  helperText={errors.auth_username || "Username for basic authentication"}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={authentication.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={!!errors.auth_password}
                  helperText={errors.auth_password || "Password for basic authentication"}
                  required
                />
              </Grid>
            </>
          )}
        </Grid>

        {/* Authentication Preview */}
        {authentication.type !== 'none' && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Authentication Preview:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {authentication.type === 'bearer' && 
                `${authentication.token_name || 'Authorization'}: ${authentication.token_prefix || 'Bearer '}***`
              }
              {authentication.type === 'api_key' && authentication.token_location === 'header' &&
                `${authentication.token_name || 'X-API-Key'}: ***`
              }
              {authentication.type === 'api_key' && authentication.token_location === 'query' &&
                `?${authentication.token_name || 'api_key'}=***`
              }
              {authentication.type === 'basic' &&
                `Authorization: Basic ${btoa((authentication.username || 'username') + ':***').slice(0, -3)}***`
              }
            </Typography>
          </Alert>
        )}

        {/* Security Warning */}
        {authentication.type !== 'none' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <LockIcon sx={{ mr: 1 }} />
            <strong>Security Notice:</strong> Authentication credentials will be stored securely. 
            Never share tools containing sensitive credentials publicly.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default AuthenticationBuilder;