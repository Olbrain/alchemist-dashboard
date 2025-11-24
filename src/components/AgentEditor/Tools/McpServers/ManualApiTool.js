/**
 * Manual API Tool Entry
 *
 * Simplified flow: Enter API details → Test → Save
 * One API at a time
 */
import React, { useState, useEffect } from 'react';
import { testUnifiedToolConfiguration } from '../../../../services/tools/toolManagerService';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Save as SaveIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

const ManualApiTool = ({ agentId, onSave, onCancel, tool = null }) => {
  // API Details
  const [apiUrl, setApiUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Authentication
  const [authType, setAuthType] = useState('none');
  const [authCredentials, setAuthCredentials] = useState({
    token: '',
    api_key: '',
    header_name: 'X-API-Key',
    username: '',
    password: '',
    access_token: ''
  });

  // Parameters
  const [parameters, setParameters] = useState([]);

  // Testing
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate form when editing existing tool
  useEffect(() => {
    if (tool) {
      setApiUrl(tool.path || '');
      setMethod(tool.method || 'GET');
      setName(tool.name || '');
      setDescription(tool.description || '');
      setAuthType(tool.authentication || 'none');

      if (tool.credentials) {
        setAuthCredentials(tool.credentials);
      }

      if (tool.parameters && Array.isArray(tool.parameters)) {
        setParameters(tool.parameters);
      }

      // If tool has test_result, set it
      if (tool.test_result) {
        setTestResult(tool.test_result);
      }
    }
  }, [tool]);

  const isEditMode = !!tool;

  const authTypes = [
    { value: 'none', label: 'No Authentication' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'oauth', label: 'OAuth 2.0' }
  ];

  const handleAddParameter = () => {
    setParameters([...parameters, {
      name: '',
      in: 'query',
      type: 'string',
      required: false,
      example: ''
    }]);
  };

  const handleRemoveParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (index, field, value) => {
    const updated = [...parameters];
    updated[index][field] = value;
    setParameters(updated);
  };

  const handleTest = async () => {
    // Validation
    if (!apiUrl.trim()) {
      setError('Please enter API URL');
      return;
    }

    // Parse URL but extract endpoint from raw string to preserve {param} format
    const urlObj = new URL(apiUrl.trim());

    // Extract endpoint from raw URL string before URL encoding happens
    // URL() constructor encodes { and } to %7B and %7D
    const rawUrl = apiUrl.trim();
    const protocolEnd = rawUrl.indexOf('://') + 3;
    const pathStart = rawUrl.indexOf('/', protocolEnd);
    const endpoint = pathStart >= 0 ? rawUrl.substring(pathStart).split('?')[0].split('#')[0] : '/';

    // Extract placeholders from endpoint (e.g., {user_id})
    const urlPlaceholders = new Set(
      (endpoint.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1))
    );

    // Get defined path parameters
    const pathParams = parameters.filter(p => p.in === 'path' && p.name.trim());

    // Validate each path parameter
    for (const param of pathParams) {
      if (!urlPlaceholders.has(param.name)) {
        setError(
          `Path parameter "${param.name}" is defined but not found in URL. ` +
          `Add it as {${param.name}} in the endpoint URL.`
        );
        return;
      }
    }

    // Check for orphaned placeholders
    for (const placeholder of urlPlaceholders) {
      if (!pathParams.some(p => p.name === placeholder)) {
        setError(
          `URL contains placeholder {${placeholder}} but no path parameter named "${placeholder}" is defined.`
        );
        return;
      }
    }

    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      // Build URL components using the raw endpoint (with {param} format)
      const urlComponents = {
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname,
        port: urlObj.port ? parseInt(urlObj.port) : null,
        base_path: '',
        endpoint: endpoint  // Use raw endpoint, not encoded pathname
      };

      // Debug logging
      console.log('ManualApiTool - Building tool config:');
      console.log('  Raw endpoint extracted:', endpoint);
      console.log('  URL pathname (encoded):', urlObj.pathname);
      console.log('  urlComponents.endpoint:', urlComponents.endpoint);

      // Check if we have body parameters
      const hasBodyParams = parameters.some(p => p.in === 'body' && p.name.trim());

      // Build tool configuration for testing
      const toolConfig = {
        method,
        url_components: urlComponents,
        authentication: {
          type: authType,
          // Backend expects token_value for both bearer and api_key
          ...((authType === 'bearer' && authCredentials.token) ? {
            token_value: authCredentials.token,
            token_prefix: 'Bearer '
          } : {}),
          ...((authType === 'api_key' && authCredentials.api_key) ? {
            token_value: authCredentials.api_key,
            token_name: authCredentials.header_name || 'X-API-Key'
          } : {}),
          ...((authType === 'basic' && authCredentials.username) ? {
            username: authCredentials.username,
            password: authCredentials.password
          } : {}),
          ...((authType === 'oauth' && authCredentials.access_token) ? {
            token_value: authCredentials.access_token,
            token_prefix: 'Bearer '
          } : {})
        },
        parameters: parameters.filter(p => p.name.trim()).map(p => ({
          name: p.name,
          location: p.in,  // Backend expects 'location' not 'in'
          type: p.type,
          required: false,
          example: p.example || undefined
        })),
        request_body: {
          enabled: hasBodyParams,
          content_type: 'application/json'
        }
      };

      // Helper function to convert parameter value to correct type
      const convertParameterValue = (param) => {
        const value = param.example.trim();
        if (!value) return value;

        switch (param.type) {
          case 'integer':
            const intValue = parseInt(value, 10);
            return isNaN(intValue) ? value : intValue;
          case 'number':
            const numValue = parseFloat(value);
            return isNaN(numValue) ? value : numValue;
          case 'boolean':
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            return value === '1' ? true : value === '0' ? false : value;
          default:
            return value;
        }
      };

      // Separate body parameters from other parameters
      const bodyParams = {};
      const otherParams = {};

      parameters
        .filter(p => p.name.trim() && p.example.trim())
        .forEach(p => {
          const convertedValue = convertParameterValue(p);
          if (p.in === 'body') {
            bodyParams[p.name] = convertedValue;
          } else {
            otherParams[p.name] = convertedValue;
          }
        });

      // Build test request with parameter examples (with proper type conversion)
      const testRequest = {
        parameters: otherParams,
        request_body: Object.keys(bodyParams).length > 0 ? bodyParams : undefined
      };

      // Call backend to test the API
      const result = await testUnifiedToolConfiguration(toolConfig, testRequest);

      setTestResult(result);
      setTesting(false);
    } catch (err) {
      setError(err.message || 'Failed to test API');
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testResult || !testResult.success) {
      setError('Please test the API successfully before saving');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a name for this tool');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const toolData = {
        name: name.trim(),
        method,
        path: apiUrl.trim(),
        description: description.trim() || `${method} ${apiUrl}`,
        parameters: parameters.filter(p => p.name.trim()),
        authentication: authType,
        credentials: authType !== 'none' ? authCredentials : null,
        test_result: testResult,
        agent_id: agentId,
        visibility: 'private'
      };

      // Include tool ID if editing
      if (isEditMode && tool.id) {
        toolData.id = tool.id;
      }

      await onSave(toolData);
      setSaving(false);
    } catch (err) {
      setError(err.message || 'Failed to save tool');
      setSaving(false);
    }
  };

  const renderAuthFields = () => {
    switch (authType) {
      case 'bearer':
        return (
          <TextField
            fullWidth
            label="Bearer Token"
            type="password"
            value={authCredentials.token}
            onChange={(e) => setAuthCredentials({ ...authCredentials, token: e.target.value })}
            placeholder="Enter your bearer token"
          />
        );

      case 'api_key':
        return (
          <>
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={authCredentials.api_key}
              onChange={(e) => setAuthCredentials({ ...authCredentials, api_key: e.target.value })}
              placeholder="Enter your API key"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Header Name"
              value={authCredentials.header_name}
              onChange={(e) => setAuthCredentials({ ...authCredentials, header_name: e.target.value })}
              placeholder="X-API-Key"
            />
          </>
        );

      case 'basic':
        return (
          <>
            <TextField
              fullWidth
              label="Username"
              value={authCredentials.username}
              onChange={(e) => setAuthCredentials({ ...authCredentials, username: e.target.value })}
              placeholder="Enter username"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={authCredentials.password}
              onChange={(e) => setAuthCredentials({ ...authCredentials, password: e.target.value })}
              placeholder="Enter password"
            />
          </>
        );

      case 'oauth':
        return (
          <TextField
            fullWidth
            label="Access Token"
            type="password"
            value={authCredentials.access_token}
            onChange={(e) => setAuthCredentials({ ...authCredentials, access_token: e.target.value })}
            placeholder="Enter OAuth access token"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {isEditMode ? 'Edit API Tool' : 'Add API Tool'}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {isEditMode
          ? 'Update API details and test to save changes'
          : 'Enter API details, test it, and save as a tool for your agent'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          API Details
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="API URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/users/{user_id}"
              helperText="Full URL including host and path. Use {param_name} for path parameters"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Method</InputLabel>
              <Select
                value={method}
                label="Method"
                onChange={(e) => setMethod(e.target.value)}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Tool Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="get_users"
              helperText="Name for this tool"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fetches list of users"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Authentication */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Authentication
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Authentication Type</InputLabel>
          <Select
            value={authType}
            label="Authentication Type"
            onChange={(e) => setAuthType(e.target.value)}
          >
            {authTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {renderAuthFields()}
      </Paper>

      {/* Parameters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Parameters (optional)
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddParameter}
          >
            Add Parameter
          </Button>
        </Box>

        {parameters.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No parameters added
          </Typography>
        ) : (
          parameters.map((param, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={param.name}
                    onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                    placeholder="userId"
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Location</InputLabel>
                    <Select
                      value={param.in}
                      label="Location"
                      onChange={(e) => handleParameterChange(index, 'in', e.target.value)}
                    >
                      <MenuItem value="query">Query</MenuItem>
                      <MenuItem value="path">Path</MenuItem>
                      <MenuItem value="header">Header</MenuItem>
                      <MenuItem value="body">Body</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={param.type}
                      label="Type"
                      onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                    >
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={10} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Example"
                    value={param.example}
                    onChange={(e) => handleParameterChange(index, 'example', e.target.value)}
                    placeholder="123"
                  />
                </Grid>
                <Grid item xs={2} sm={1}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveParameter(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))
        )}
      </Paper>

      {/* URL Preview with Path Parameters */}
      {parameters.some(p => p.in === 'path' && p.name.trim()) && apiUrl.trim() && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            URL Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This is how the URL will look with example values:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
            {(() => {
              try {
                const urlObj = new URL(apiUrl.trim());

                // Extract endpoint from raw URL to preserve {param} format
                const rawUrl = apiUrl.trim();
                const protocolEnd = rawUrl.indexOf('://') + 3;
                const pathStart = rawUrl.indexOf('/', protocolEnd);
                let endpoint = pathStart >= 0 ? rawUrl.substring(pathStart).split('?')[0].split('#')[0] : '/';

                // Replace path parameters with example values
                parameters
                  .filter(p => p.in === 'path' && p.name.trim() && p.example)
                  .forEach(p => {
                    endpoint = endpoint.replace(`{${p.name}}`, p.example);
                  });

                return `${urlObj.protocol}//${urlObj.host}${endpoint}${urlObj.search}`;
              } catch (e) {
                return 'Invalid URL format';
              }
            })()}
          </Paper>
        </Paper>
      )}

      {/* Test Result */}
      {testResult && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: testResult.success ? 'success.50' : 'error.50' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Test Result
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {testResult.success ? (
              <Chip icon={<SuccessIcon />} label="Success" color="success" />
            ) : (
              <Chip label="Failed" color="error" />
            )}
            <Chip label={`${testResult.status_code}`} size="small" />
            <Chip label={`${testResult.response_time}ms`} size="small" />
          </Box>

          {testResult.response_data && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                maxHeight: 200,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap'
              }}
            >
              {JSON.stringify(testResult.response_data, null, 2)}
            </Paper>
          )}
        </Paper>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button onClick={onCancel}>
          Cancel
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={testing ? <CircularProgress size={20} /> : <TestIcon />}
            onClick={handleTest}
            disabled={testing || !apiUrl.trim()}
          >
            {testing ? 'Testing...' : 'Test API'}
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !testResult || !testResult.success || !name.trim()}
          >
            {saving ? 'Saving...' : (isEditMode ? 'Update Tool' : 'Save Tool')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ManualApiTool;
