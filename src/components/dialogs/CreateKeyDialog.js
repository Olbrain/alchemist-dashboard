/**
 * Create API Key Dialog Component
 *
 * Dialog for creating new API keys at organization, project, or agent level
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import apiKeyService from '../../services/apiKeys/apiKeyService';

const CreateKeyDialog = ({
  open,
  onClose,
  onKeyCreated,
  agentContext // Required prop - agent context is now required
}) => {
  const { currentUser, organizationId } = useAuth();
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Validate agentContext is provided
  useEffect(() => {
    if (open && !agentContext) {
      setError('Agent context is required to create API keys');
    } else {
      setError('');
    }
  }, [open, agentContext]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleCreateKey = async () => {
    if (!formData.name.trim()) {
      setError('API key name is required');
      return;
    }

    if (!agentContext) {
      setError('Agent context is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const keyData = {
        name: formData.name.trim(),
        agentId: agentContext.id,
        organizationId: agentContext.organization_id || organizationId,
        projectId: agentContext.project_id || null,
        userId: currentUser?.uid
      };

      const result = await apiKeyService.createApiKey(keyData);

      if (result.success) {
        setCreatedKey(result.apiKey);
        setSuccess(true);
        if (onKeyCreated) {
          onKeyCreated(result);
        }
      } else {
        setError(result.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      try {
        await navigator.clipboard.writeText(createdKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy key:', error);
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: ''
      });
      setError('');
      setSuccess(false);
      setCreatedKey(null);
      setShowKey(false);
      setCopied(false);
      onClose();
    }
  };


  const renderKeyDisplay = () => {
    if (!success || !createdKey) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          API key created successfully! Make sure to copy and save it now - you won't be able to see it again.
        </Alert>

        <TextField
          fullWidth
          label="Your API Key"
          value={createdKey}
          type={showKey ? 'text' : 'password'}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowKey(!showKey)}
                  edge="end"
                >
                  {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
                <IconButton
                  onClick={handleCopyKey}
                  edge="end"
                  color={copied ? 'success' : 'default'}
                >
                  <CopyIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {copied && (
          <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
            ✓ API key copied to clipboard
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: success ? 400 : 300 }
      }}
    >
      <DialogTitle>
        Create New API Key
        {agentContext && (
          <Typography variant="body2" color="text.secondary">
            for {agentContext?.name || agentContext?.basic_info?.name}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!success && (
          <>
            <TextField
              autoFocus
              fullWidth
              label="API Key Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Production Key, Testing Key, Integration Key"
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary">
              This API key will provide access to this agent and its endpoints.
            </Typography>
          </>
        )}

        {renderKeyDisplay()}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          {success ? 'Done' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            onClick={handleCreateKey}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Creating...' : 'Create API Key'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateKeyDialog;