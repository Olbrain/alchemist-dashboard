/**
 * API Input Step - Step 1 of API to MCP Wizard
 *
 * Allows users to provide their API specification via:
 * - Upload OpenAPI spec file (JSON/YAML)
 * - Paste OpenAPI spec URL
 * - Manual endpoint entry
 */
import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Grid
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import jsyaml from 'js-yaml';
import { createToolFromManual, testUnifiedTool } from '../../../../services/tools/toolManagerService';

const ApiInputStep = ({ data, onComplete, onError, agentId }) => {
  const [inputMethod, setInputMethod] = useState(data.inputMethod || 'upload');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(data.apiUrl || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedSpec, setParsedSpec] = useState(data.openApiSpec || null);
  const [parsedEndpoints, setParsedEndpoints] = useState(data.parsedEndpoints || []);
  const fileInputRef = useRef(null);

  // Manual entry state
  const [manualEndpoints, setManualEndpoints] = useState([]);
  const [manualBaseUrl, setManualBaseUrl] = useState('');
  const [manualForm, setManualForm] = useState({
    name: '',
    method: 'GET',
    path: '',
    description: '',
    authentication: 'none'
  });
  const [parametersList, setParametersList] = useState([{ name: '', in: 'query', type: 'string', example: '' }]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);
    onError('');

    try {
      const text = await file.text();
      let spec;

      // Parse based on file extension
      if (file.name.endsWith('.json')) {
        spec = JSON.parse(text);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        spec = jsyaml.load(text);
      } else {
        throw new Error('Unsupported file format. Please use .json, .yaml, or .yml');
      }

      // Validate it's an OpenAPI spec
      if (!spec.openapi && !spec.swagger) {
        throw new Error('Not a valid OpenAPI specification');
      }

      // Extract endpoints
      const endpoints = extractEndpointsFromSpec(spec);

      setParsedSpec(spec);
      setParsedEndpoints(endpoints);
      setLoading(false);
    } catch (err) {
      onError(err.message || 'Failed to parse file');
      setUploadedFile(null);
      setLoading(false);
    }
  };

  const handleFetchUrl = async () => {
    if (!apiUrl.trim()) {
      onError('Please enter an OpenAPI specification URL');
      return;
    }

    setLoading(true);
    onError('');

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let spec;

      if (contentType?.includes('application/json')) {
        spec = await response.json();
      } else if (contentType?.includes('yaml') || contentType?.includes('yml')) {
        const text = await response.text();
        spec = jsyaml.load(text);
      } else {
        // Try to parse as JSON first, then YAML
        const text = await response.text();
        try {
          spec = JSON.parse(text);
        } catch {
          spec = jsyaml.load(text);
        }
      }

      // Validate it's an OpenAPI spec
      if (!spec.openapi && !spec.swagger) {
        throw new Error('Not a valid OpenAPI specification');
      }

      // Extract endpoints
      const endpoints = extractEndpointsFromSpec(spec);

      setParsedSpec(spec);
      setParsedEndpoints(endpoints);
      setLoading(false);
    } catch (err) {
      onError(err.message || 'Failed to fetch OpenAPI specification');
      setLoading(false);
    }
  };

  const extractEndpointsFromSpec = (spec) => {
    const endpoints = [];
    const baseUrl = getBaseUrl(spec);

    if (!spec.paths) {
      throw new Error('No paths found in OpenAPI specification');
    }

    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      ['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
        if (pathItem[method]) {
          const operation = pathItem[method];
          endpoints.push({
            name: generateToolName(method, path, operation),
            method: method.toUpperCase(),
            path: path,
            description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
            parameters: extractParameters(operation, pathItem),
            requestBody: operation.requestBody,
            operationId: operation.operationId
          });
        }
      });
    });

    return endpoints;
  };

  const getBaseUrl = (spec) => {
    if (spec.servers && spec.servers.length > 0) {
      return spec.servers[0].url;
    }
    if (spec.host) {
      const scheme = spec.schemes?.[0] || 'https';
      const basePath = spec.basePath || '';
      return `${scheme}://${spec.host}${basePath}`;
    }
    return '';
  };

  const generateToolName = (method, path, operation) => {
    if (operation.operationId) {
      return operation.operationId;
    }

    // Generate from method and path
    const pathParts = path.split('/').filter(p => p && !p.startsWith('{'));
    const name = [method, ...pathParts].join('_').replace(/[^a-zA-Z0-9_]/g, '_');
    return name.toLowerCase();
  };

  const extractParameters = (operation, pathItem) => {
    const params = [];
    const allParams = [
      ...(pathItem.parameters || []),
      ...(operation.parameters || [])
    ];

    allParams.forEach(param => {
      params.push({
        name: param.name,
        in: param.in,
        required: param.required || false,
        type: param.schema?.type || param.type || 'string',
        description: param.description || ''
      });
    });

    return params;
  };

  // Manual entry handlers
  const getExamplePlaceholder = (type) => {
    const placeholders = {
      string: 'e.g., john_doe',
      number: 'e.g., 10',
      boolean: 'e.g., true',
      object: 'e.g., {}',
      array: 'e.g., []'
    };
    return placeholders[type] || 'e.g., value';
  };

  const getDefaultLocation = () => {
    // Default location based on HTTP method
    const method = manualForm.method;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return 'body';
    }
    return 'query';
  };

  const handleAddParameter = () => {
    setParametersList([...parametersList, { name: '', in: getDefaultLocation(), type: 'string', example: '' }]);
  };

  const handleUpdateParameter = (index, field, value) => {
    const updated = [...parametersList];
    updated[index][field] = value;
    setParametersList(updated);
  };

  const handleDeleteParameter = (index) => {
    if (parametersList.length === 1) {
      // Keep at least one empty parameter
      setParametersList([{ name: '', in: getDefaultLocation(), type: 'string', example: '' }]);
    } else {
      setParametersList(parametersList.filter((_, i) => i !== index));
    }
  };

  const handleAddManualEndpoint = async () => {
    if (!manualForm.name.trim() || !manualForm.path.trim()) {
      onError('Please provide endpoint name and path');
      return;
    }

    if (!agentId) {
      onError('Agent ID is required to create tools');
      return;
    }

    setLoading(true);
    onError('');

    try {
      // Build parameters from parametersList (only non-empty ones)
      const parsedParams = parametersList
        .filter(p => p.name.trim())
        .map(p => ({
          name: p.name.trim(),
          in: p.in,
          type: p.type,
          example: p.example.trim() || undefined
        }));

      // Prepare data for API call
      const manualToolData = {
        name: manualForm.name.trim(),
        method: manualForm.method,
        path: manualForm.path.trim(),
        description: manualForm.description.trim() || `${manualForm.method} ${manualForm.path}`,
        parameters: parsedParams,
        authentication: manualForm.authentication,
        agent_id: agentId,
        visibility: 'private'
      };

      // Create the tool via API
      const createdTool = await createToolFromManual(manualToolData);

      // Add to local endpoint list with tool ID for tracking
      const newEndpoint = {
        id: createdTool.id, // Store tool ID for later use
        name: manualForm.name.trim(),
        method: manualForm.method,
        path: manualForm.path.trim(),
        description: manualForm.description.trim() || `${manualForm.method} ${manualForm.path}`,
        parameters: parsedParams.map(p => ({
          ...p,
          required: p.in === 'path',
          description: ''
        })),
        authentication: manualForm.authentication,
        requestBody: null,
        operationId: manualForm.name.trim(),
        created: true,
        tool: createdTool
      };

      const updatedEndpoints = [...manualEndpoints, newEndpoint];
      setManualEndpoints(updatedEndpoints);
      setParsedEndpoints(updatedEndpoints);

      // Reset form
      setManualForm({
        name: '',
        method: 'GET',
        path: '',
        description: '',
        authentication: 'none'
      });
      setParametersList([{ name: '', in: getDefaultLocation(), type: 'string', example: '' }]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to create tool:', error);
      onError(error.message || 'Failed to create tool');
      setLoading(false);
    }
  };

  const handleDeleteManualEndpoint = (index) => {
    const updatedEndpoints = manualEndpoints.filter((_, i) => i !== index);
    setManualEndpoints(updatedEndpoints);
    setParsedEndpoints(updatedEndpoints);
  };

  const handleContinue = () => {
    if (parsedEndpoints.length === 0) {
      onError('Please provide at least one endpoint');
      return;
    }

    // For manual entry, we don't have a parsedSpec or baseUrl
    if (inputMethod === 'manual') {
      onComplete({
        inputMethod,
        openApiSpec: null,
        apiUrl: '',
        parsedEndpoints,
        baseUrl: ''
      });
    } else {
      if (!parsedSpec) {
        onError('Please provide a valid OpenAPI specification');
        return;
      }

      onComplete({
        inputMethod,
        openApiSpec: parsedSpec,
        apiUrl: inputMethod === 'url' ? apiUrl : '',
        parsedEndpoints,
        baseUrl: getBaseUrl(parsedSpec)
      });
    }
  };

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        Provide your API specification to generate an MCP server
      </Typography>

      {/* Input Method Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={inputMethod} onChange={(e, v) => setInputMethod(v)}>
          <Tab label="Upload File" value="upload" icon={<UploadIcon />} iconPosition="start" />
          <Tab label="From URL" value="url" icon={<LinkIcon />} iconPosition="start" />
          <Tab label="Manual Entry" value="manual" icon={<EditIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Upload Tab */}
      {inputMethod === 'upload' && (
        <Box>
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'background.default',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Click to upload OpenAPI specification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports JSON, YAML formats
            </Typography>
            {uploadedFile && (
              <Box sx={{ mt: 2 }}>
                <Chip label={uploadedFile.name} color="primary" onDelete={() => {
                  setUploadedFile(null);
                  setParsedSpec(null);
                  setParsedEndpoints([]);
                }} />
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* URL Tab */}
      {inputMethod === 'url' && (
        <Box>
          <TextField
            fullWidth
            label="OpenAPI Specification URL"
            placeholder="https://api.example.com/openapi.json"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleFetchUrl}
            disabled={loading || !apiUrl.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
          >
            {loading ? 'Fetching...' : 'Fetch Specification'}
          </Button>
        </Box>
      )}

      {/* Manual Entry Tab */}
      {inputMethod === 'manual' && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Endpoint
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Endpoint Name"
                  placeholder="get_users"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  helperText="Unique identifier for this endpoint"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>HTTP Method</InputLabel>
                  <Select
                    value={manualForm.method}
                    label="HTTP Method"
                    onChange={(e) => setManualForm({ ...manualForm, method: e.target.value })}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="PATCH">PATCH</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endpoint Path"
                  placeholder="/api/users"
                  value={manualForm.path}
                  onChange={(e) => setManualForm({ ...manualForm, path: e.target.value })}
                  helperText="The URL path for this endpoint"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  placeholder="Retrieve a list of all users"
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  multiline
                  rows={2}
                  helperText="Brief description of what this endpoint does"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Parameters (Optional)
                </Typography>
                {parametersList.map((param, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Parameter name"
                      value={param.name}
                      onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={param.in}
                        onChange={(e) => handleUpdateParameter(index, 'in', e.target.value)}
                      >
                        <MenuItem value="query">Query</MenuItem>
                        <MenuItem value="body">Body</MenuItem>
                        <MenuItem value="path">Path</MenuItem>
                        <MenuItem value="header">Header</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={param.type}
                        onChange={(e) => handleUpdateParameter(index, 'type', e.target.value)}
                      >
                        <MenuItem value="string">String</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="object">Object</MenuItem>
                        <MenuItem value="array">Array</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      placeholder={getExamplePlaceholder(param.type)}
                      value={param.example}
                      onChange={(e) => handleUpdateParameter(index, 'example', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteParameter(index)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddParameter}
                  sx={{ mt: 1 }}
                >
                  Add Parameter
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Authentication</InputLabel>
                  <Select
                    value={manualForm.authentication}
                    label="Authentication"
                    onChange={(e) => setManualForm({ ...manualForm, authentication: e.target.value })}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="api_key">API Key</MenuItem>
                    <MenuItem value="bearer">Bearer Token</MenuItem>
                    <MenuItem value="basic">Basic Auth</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddManualEndpoint}
                  disabled={!manualForm.name.trim() || !manualForm.path.trim()}
                >
                  Add Endpoint
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Manual Endpoints List */}
          {manualEndpoints.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Added Endpoints ({manualEndpoints.length})
              </Typography>
              <List>
                {manualEndpoints.map((endpoint, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1
                    }}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeleteManualEndpoint(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip label={endpoint.method} size="small" color="primary" />
                          <Typography variant="body1" fontWeight="600">
                            {endpoint.name}
                          </Typography>
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <Chip
                              label={`${endpoint.parameters.length} param${endpoint.parameters.length > 1 ? 's' : ''}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {endpoint.authentication && endpoint.authentication !== 'none' && (
                            <Chip
                              label={endpoint.authentication.replace('_', ' ')}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {endpoint.path}
                          </Typography>
                          {endpoint.description && (
                            <Typography variant="caption" color="text.secondary">
                              {endpoint.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Parsed Endpoints Preview */}
      {parsedEndpoints.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
            Found {parsedEndpoints.length} endpoints
          </Alert>

          <Typography variant="subtitle2" gutterBottom>
            Endpoints Preview:
          </Typography>
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {parsedEndpoints.slice(0, 10).map((endpoint, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={endpoint.name}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={endpoint.method} size="small" />
                        <Typography variant="caption">{endpoint.path}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {parsedEndpoints.length > 10 && (
                <ListItem>
                  <ListItemText secondary={`... and ${parsedEndpoints.length - 10} more`} />
                </ListItem>
              )}
            </List>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleContinue}
              endIcon={<CheckIcon />}
            >
              Continue to Testing
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ApiInputStep;
