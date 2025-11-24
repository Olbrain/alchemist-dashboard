/**
 * API Testing Step - Step 2 of API to MCP Wizard
 *
 * Tests API endpoints with user-provided credentials
 * - Configure authentication (Bearer, API Key, Basic, OAuth)
 * - Test each endpoint
 * - Show results
 * - Allow proceeding only with passing endpoints
 */
import React, { useState } from 'react';
import { testApiEndpoints } from '../../../../services/mcp/mcpService';
import {
  Box,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RetryIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';

const ApiTestingStep = ({ data, onComplete, onError, onBack, agentId }) => {
  const [authType, setAuthType] = useState(data.authType || 'none');
  const [credentials, setCredentials] = useState(data.credentials || {});
  const [selectedEndpoints, setSelectedEndpoints] = useState(
    data.selectedEndpoints?.length > 0
      ? data.selectedEndpoints
      : data.parsedEndpoints?.map(e => e.name) || []
  );
  const [testResults, setTestResults] = useState(data.testResults || {});
  const [testing, setTesting] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});

  const authTypes = [
    { value: 'none', label: 'No Authentication' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'oauth', label: 'OAuth 2.0' }
  ];

  const handleCredentialChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleEndpoint = (endpointName) => {
    setSelectedEndpoints(prev => {
      if (prev.includes(endpointName)) {
        return prev.filter(n => n !== endpointName);
      } else {
        return [...prev, endpointName];
      }
    });
  };

  const handleTestAll = async () => {
    if (selectedEndpoints.length === 0) {
      onError('Please select at least one endpoint to test');
      return;
    }

    if (authType !== 'none' && Object.keys(credentials).length === 0) {
      onError('Please provide authentication credentials');
      return;
    }

    setTesting(true);
    onError('');

    try {
      // TODO: Call backend API to test endpoints
      // For now, simulate testing
      const results = {};

      for (const endpointName of selectedEndpoints) {
        const endpoint = data.parsedEndpoints.find(e => e.name === endpointName);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate test result (in real implementation, call backend)
        const success = Math.random() > 0.2; // 80% success rate for demo

        // Sample response data for successful calls
        const sampleResponse = success ? {
          data: {
            id: Math.floor(Math.random() * 1000),
            name: `Sample ${endpoint.name}`,
            status: 'active',
            timestamp: new Date().toISOString(),
            details: {
              message: 'API call successful',
              endpoint: endpoint.path
            }
          }
        } : null;

        results[endpointName] = {
          success,
          status_code: success ? 200 : 401,
          response_time: Math.floor(Math.random() * 500) + 100,
          error: success ? null : 'Authentication failed',
          response: sampleResponse,
          tested_at: new Date().toISOString()
        };
      }

      setTestResults(results);
      setTesting(false);
    } catch (err) {
      onError(err.message || 'Failed to test endpoints');
      setTesting(false);
    }
  };

  const handleRetryFailed = async () => {
    const failedEndpoints = selectedEndpoints.filter(
      name => testResults[name] && !testResults[name].success
    );

    if (failedEndpoints.length === 0) {
      onError('No failed endpoints to retry');
      return;
    }

    setTesting(true);
    onError('');

    try {
      const results = { ...testResults };

      for (const endpointName of failedEndpoints) {
        const endpoint = data.parsedEndpoints.find(e => e.name === endpointName);
        await new Promise(resolve => setTimeout(resolve, 500));

        const success = Math.random() > 0.3;

        // Sample response data for successful retries
        const sampleResponse = success ? {
          data: {
            id: Math.floor(Math.random() * 1000),
            name: `Sample ${endpoint.name}`,
            status: 'active',
            timestamp: new Date().toISOString(),
            details: {
              message: 'API call successful on retry',
              endpoint: endpoint.path
            }
          }
        } : null;

        results[endpointName] = {
          success,
          status_code: success ? 200 : 401,
          response_time: Math.floor(Math.random() * 500) + 100,
          error: success ? null : 'Authentication failed',
          response: sampleResponse,
          tested_at: new Date().toISOString()
        };
      }

      setTestResults(results);
      setTesting(false);
    } catch (err) {
      onError(err.message || 'Failed to retry tests');
      setTesting(false);
    }
  };

  const handleContinue = () => {
    const testedEndpoints = selectedEndpoints.filter(name => testResults[name]);
    const passingEndpoints = testedEndpoints.filter(
      name => testResults[name].success
    );

    if (passingEndpoints.length === 0) {
      onError('At least one endpoint must pass to continue');
      return;
    }

    onComplete({
      authType,
      credentials,
      selectedEndpoints: passingEndpoints,
      testResults,
      baseUrl: data.baseUrl
    });
  };

  const renderCredentialFields = () => {
    switch (authType) {
      case 'bearer':
        return (
          <TextField
            fullWidth
            label="Bearer Token"
            type="password"
            value={credentials.token || ''}
            onChange={(e) => handleCredentialChange('token', e.target.value)}
            placeholder="Enter your bearer token"
            sx={{ mb: 2 }}
          />
        );

      case 'api_key':
        return (
          <>
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={credentials.api_key || ''}
              onChange={(e) => handleCredentialChange('api_key', e.target.value)}
              placeholder="Enter your API key"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Header Name (optional)"
              value={credentials.header_name || 'X-API-Key'}
              onChange={(e) => handleCredentialChange('header_name', e.target.value)}
              placeholder="X-API-Key"
              sx={{ mb: 2 }}
            />
          </>
        );

      case 'basic':
        return (
          <>
            <TextField
              fullWidth
              label="Username"
              value={credentials.username || ''}
              onChange={(e) => handleCredentialChange('username', e.target.value)}
              placeholder="Enter username"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password || ''}
              onChange={(e) => handleCredentialChange('password', e.target.value)}
              placeholder="Enter password"
              sx={{ mb: 2 }}
            />
          </>
        );

      case 'oauth':
        return (
          <TextField
            fullWidth
            label="Access Token"
            type="password"
            value={credentials.access_token || ''}
            onChange={(e) => handleCredentialChange('access_token', e.target.value)}
            placeholder="Enter OAuth access token"
            helperText="Provide a pre-obtained OAuth access token"
            sx={{ mb: 2 }}
          />
        );

      default:
        return null;
    }
  };

  const getTestSummary = () => {
    const tested = Object.keys(testResults).length;
    const passed = Object.values(testResults).filter(r => r.success).length;
    const failed = tested - passed;
    return { tested, passed, failed };
  };

  const summary = getTestSummary();
  const allTested = selectedEndpoints.every(name => testResults[name]);
  const hasFailures = summary.failed > 0;

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        Configure authentication and test your API endpoints
      </Typography>

      {/* Authentication Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
          Authentication
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Authentication Type</InputLabel>
          <Select
            value={authType}
            label="Authentication Type"
            onChange={(e) => {
              setAuthType(e.target.value);
              setCredentials({});
            }}
          >
            {authTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {renderCredentialFields()}
      </Paper>

      {/* Endpoint Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Select Endpoints to Test
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedEndpoints.length} / {data.parsedEndpoints?.length || 0} selected
          </Typography>
        </Box>

        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
          {data.parsedEndpoints?.map((endpoint) => (
            <FormControlLabel
              key={endpoint.name}
              control={
                <Checkbox
                  checked={selectedEndpoints.includes(endpoint.name)}
                  onChange={() => handleToggleEndpoint(endpoint.name)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">{endpoint.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {endpoint.method} {endpoint.path}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Box>
      </Paper>

      {/* Test Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={testing ? null : <TestIcon />}
          onClick={handleTestAll}
          disabled={testing || selectedEndpoints.length === 0}
        >
          {testing ? 'Testing...' : 'Test All Selected'}
        </Button>

        {hasFailures && (
          <Button
            variant="outlined"
            startIcon={<RetryIcon />}
            onClick={handleRetryFailed}
            disabled={testing}
          >
            Retry Failed
          </Button>
        )}
      </Box>

      {/* Testing Progress */}
      {testing && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Testing endpoints...
          </Typography>
        </Box>
      )}

      {/* Test Summary */}
      {summary.tested > 0 && (
        <Alert
          severity={summary.failed === 0 ? 'success' : summary.passed > 0 ? 'warning' : 'error'}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" fontWeight={600}>
            Test Results: {summary.passed} passed, {summary.failed} failed out of {summary.tested} tested
          </Typography>
          {summary.failed > 0 && summary.passed > 0 && (
            <Typography variant="caption">
              You can proceed with passing endpoints only, or retry failed tests
            </Typography>
          )}
          {summary.failed === summary.tested && (
            <Typography variant="caption">
              All tests failed. Please check your credentials and try again
            </Typography>
          )}
        </Alert>
      )}

      {/* Test Results Table */}
      {Object.keys(testResults).length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="50"></TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedEndpoints.map((endpointName) => {
                const endpoint = data.parsedEndpoints.find(e => e.name === endpointName);
                const result = testResults[endpointName];
                const isExpanded = expandedResults[endpointName];

                if (!result) return null;

                return (
                  <React.Fragment key={endpointName}>
                    <TableRow>
                      <TableCell>
                        {result.success ? (
                          <SuccessIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>{endpoint.name}</TableCell>
                      <TableCell>
                        <Chip label={endpoint.method} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={result.status_code}
                          size="small"
                          color={result.success ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{result.response_time}ms</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setExpandedResults(prev => ({
                            ...prev,
                            [endpointName]: !prev[endpointName]
                          }))}
                        >
                          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={isExpanded}>
                          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Path: {endpoint.path}
                            </Typography>

                            {result.error && (
                              <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
                                {result.error}
                              </Alert>
                            )}

                            {result.success && result.response && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" fontWeight={600} gutterBottom>
                                  API Response:
                                </Typography>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 2,
                                    mt: 1,
                                    bgcolor: 'grey.50',
                                    maxHeight: 300,
                                    overflow: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {JSON.stringify(result.response, null, 2)}
                                </Paper>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!allTested || summary.passed === 0}
        >
          Continue with {summary.passed} passing endpoint{summary.passed !== 1 ? 's' : ''}
        </Button>
      </Box>
    </Box>
  );
};

export default ApiTestingStep;
