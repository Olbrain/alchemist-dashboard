/**
 * Private MCP Upload Dialog Component
 *
 * Allows users to upload and validate private MCP server configurations
 * Supports JSON and YAML formats
 */
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import jsyaml from 'js-yaml';

const PrivateMcpUploadDialog = ({ open, onClose, onSave, onTest }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedConfig, setParsedConfig] = useState(null);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setError('');
    setParsedConfig(null);
    setTestResult(null);

    try {
      const text = await file.text();
      let config;

      // Parse based on file extension
      if (file.name.endsWith('.json')) {
        config = JSON.parse(text);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        config = jsyaml.load(text);
      } else {
        throw new Error('Unsupported file format. Please use .json, .yaml, or .yml');
      }

      // Validate required fields
      validateConfig(config);

      setParsedConfig(config);
    } catch (err) {
      setError(err.message || 'Failed to parse file');
      setUploadedFile(null);
    }
  };

  const validateConfig = (config) => {
    const errors = [];

    // Required fields
    if (!config.id) {
      errors.push('Missing required field: id');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.id)) {
      errors.push('Invalid id: must contain only alphanumeric characters, dashes, and underscores');
    }

    if (!config.name) {
      errors.push('Missing required field: name');
    }

    if (!config.installation) {
      errors.push('Missing required field: installation');
    } else {
      if (!config.installation.command) {
        errors.push('Missing required field: installation.command');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    // Set defaults
    if (!config.type) {
      config.type = 'mcp_server';
    }

    if (!config.category) {
      config.category = 'custom';
    }

    if (!config.description) {
      config.description = '';
    }

    if (!config.installation.args) {
      config.installation.args = [];
    }

    if (!config.installation.env) {
      config.installation.env = {};
    }

    return true;
  };

  const handleTest = async () => {
    if (!parsedConfig) return;

    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      // Call test function - needs agentId and empty config for now
      const result = await onTest(parsedConfig.id, {}, parsedConfig);
      setTestResult(result);
    } catch (err) {
      setError(err.message || 'Test failed');
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!parsedConfig) return;

    setSaving(true);
    setError('');

    try {
      await onSave(parsedConfig);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save server configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUploadedFile(null);
    setParsedConfig(null);
    setError('');
    setTestResult(null);
    setTesting(false);
    setSaving(false);
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a synthetic event to reuse handleFileSelect
      const syntheticEvent = {
        target: {
          files: [file]
        }
      };
      handleFileSelect(syntheticEvent);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Private MCP Server</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a JSON or YAML configuration file for your private MCP server.
          The configuration must include server ID, name, and installation details.
        </Typography>

        {/* Upload Area */}
        <Paper
          variant="outlined"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: uploadedFile ? 'success.main' : 'divider',
            bgcolor: uploadedFile ? 'success.50' : 'background.default',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
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

          {uploadedFile ? (
            <Box>
              <SuccessIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {uploadedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to select a different file
              </Typography>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Drop your config file here or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports .json, .yaml, and .yml files
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Parsed Config Preview */}
        {parsedConfig && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration Preview
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Server ID:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {parsedConfig.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Name:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {parsedConfig.name}
                </Typography>
              </Box>

              {parsedConfig.description && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Description:
                  </Typography>
                  <Typography variant="body2">
                    {parsedConfig.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Command:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {parsedConfig.installation?.command}
                </Typography>
              </Box>

              {parsedConfig.installation?.args && parsedConfig.installation.args.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Arguments:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {parsedConfig.installation.args.join(' ')}
                  </Typography>
                </Box>
              )}

              {parsedConfig.installation?.env && Object.keys(parsedConfig.installation.env).length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Environment Variables:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {Object.keys(parsedConfig.installation.env).join(', ')}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Test Result */}
        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
            {testResult.success ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Connection successful!
                </Typography>
                {testResult.tools_count !== undefined && (
                  <Typography variant="caption">
                    Discovered {testResult.tools_count} tools
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Connection failed
                </Typography>
                <Typography variant="caption">
                  {testResult.error || 'Unknown error'}
                </Typography>
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving || testing}>
          Cancel
        </Button>
        {parsedConfig && (
          <Button
            onClick={handleTest}
            disabled={testing || saving}
            startIcon={testing ? <CircularProgress size={16} /> : null}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!parsedConfig || saving || testing}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Add Server'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivateMcpUploadDialog;
