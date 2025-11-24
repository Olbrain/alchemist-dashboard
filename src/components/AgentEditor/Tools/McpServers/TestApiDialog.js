import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RetryIcon,
} from '@mui/icons-material';

/**
 * TestApiDialog - Test API Tool with custom parameter values
 * Allows users to input parameter values, test the API, and see results
 */
const TestApiDialog = ({
  open,
  onClose,
  tool,
  onTest,
}) => {
  const theme = useTheme();
  const [parameterValues, setParameterValues] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState('');

  // Initialize parameter values with examples when dialog opens
  useEffect(() => {
    if (open && tool && tool.parameters) {
      const initialValues = {};
      tool.parameters.forEach(param => {
        if (param.example) {
          initialValues[param.name] = param.example;
        }
      });
      setParameterValues(initialValues);
    }
  }, [open, tool]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setParameterValues({});
      setTesting(false);
      setTestResult(null);
      setError('');
    }
  }, [open]);

  const handleParameterChange = (paramName, value) => {
    setParameterValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      const result = await onTest(parameterValues);
      setTestResult(result);
      setTesting(false);
    } catch (err) {
      setError(err.message || 'Failed to test API');
      setTesting(false);
    }
  };

  const handleRetry = () => {
    setTestResult(null);
    setError('');
  };

  if (!tool) return null;

  // Group parameters by location
  const groupedParams = {
    query: [],
    path: [],
    header: [],
    body: []
  };

  tool.parameters?.forEach(param => {
    const location = param.location || param.in || 'query';
    if (groupedParams[location]) {
      groupedParams[location].push(param);
    }
  });

  const hasParameters = tool.parameters && tool.parameters.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10]
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Test API Tool
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={tool.method} size="small" color="primary" />
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {tool.name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* API Endpoint */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Endpoint
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50', mb: hasParameters ? 1 : 0 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Template:
            </Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
              {tool.path}
            </Typography>
          </Paper>

          {/* Show final URL with substituted path parameters */}
          {tool.parameters?.some(p => (p.location || p.in) === 'path') && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.50' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Final URL (with values):
              </Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                {(() => {
                  let url = tool.path;
                  // Substitute path parameters with current values or placeholders
                  tool.parameters
                    ?.filter(p => (p.location || p.in) === 'path')
                    .forEach(param => {
                      const value = parameterValues[param.name] || `{${param.name}}`;
                      url = url.replace(`{${param.name}}`, value);
                    });
                  return url;
                })()}
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Parameters Input */}
        {hasParameters ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Parameters
            </Typography>

            {Object.entries(groupedParams).map(([location, params]) => {
              if (params.length === 0) return null;

              return (
                <Box key={location} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    {location} Parameters
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    {params.map(param => (
                      <Grid item xs={12} sm={6} key={param.name}>
                        <TextField
                          fullWidth
                          size="small"
                          label={param.name}
                          value={parameterValues[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          placeholder={param.example || `Enter ${param.type}`}
                          helperText={`${param.type}${param.required ? ' (required)' : ''}`}
                          InputProps={{
                            sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            This API has no parameters to configure.
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Test Results */}
        {testResult && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Test Results
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: testResult.success
                  ? alpha(theme.palette.success.main, 0.05)
                  : alpha(theme.palette.error.main, 0.05)
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {testResult.success ? (
                  <Chip
                    icon={<SuccessIcon />}
                    label="Success"
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<ErrorIcon />}
                    label="Failed"
                    color="error"
                    size="small"
                  />
                )}
                <Chip
                  label={`Status: ${testResult.status_code}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${testResult.response_time}ms`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {testResult.error && (
                <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                  {testResult.error}
                </Typography>
              )}

              {testResult.response_data && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Response Data:
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      maxHeight: 300,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {JSON.stringify(testResult.response_data, null, 2)}
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {testResult && (
          <Button
            variant="outlined"
            startIcon={<RetryIcon />}
            onClick={handleRetry}
          >
            Retry
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={testing ? <CircularProgress size={20} /> : <TestIcon />}
          onClick={handleTest}
          disabled={testing}
        >
          {testing ? 'Testing...' : 'Test API'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestApiDialog;
