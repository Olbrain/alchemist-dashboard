/**
 * Create Agent Dialog Component
 *
 * Modal dialog for quick agent creation
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { SmartToy as SmartToyIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { createAgent } from '../../services/agents/agentService';
import { getProjectOrganizationId } from '../../utils/projectHelpers';

const CreateAgentDialog = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    project_id: currentProject || ''
  });

  // Update project_id when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setAgentData(prev => ({ ...prev, project_id: currentProject }));
    }
  }, [currentProject]);

  const handleInputChange = (field) => (event) => {
    setAgentData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      setAgentData({
        name: '',
        description: '',
        project_id: currentProject || ''
      });
      setError('');
      onClose();
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!agentData.name.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!agentData.project_id) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch organization_id from the selected project
      const organizationId = await getProjectOrganizationId(agentData.project_id);

      if (!organizationId) {
        setError('Could not determine organization for selected project');
        setLoading(false);
        return;
      }

      // Create the agent with minimal fields only
      const newAgentData = {
        name: agentData.name.trim(),
        description: agentData.description.trim(),
        project_id: agentData.project_id,
        organization_id: organizationId
      };

      const createdAgent = await createAgent(newAgentData);

      // Close dialog
      handleClose();

      // Navigate to agent editor with prompt builder tab active
      navigate(`/edit/${createdAgent.id}?tab=prompt-builder`);

    } catch (error) {
      console.error('Failed to create agent:', error);
      setError(error.message || 'Failed to create agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6">Create New Agent</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!currentProject ? (
          <Alert severity="warning">
            No project selected. Please select a project first.
          </Alert>
        ) : (
          <>
            <TextField
              autoFocus
              margin="dense"
              label="Agent Name"
              fullWidth
              variant="outlined"
              value={agentData.name}
              onChange={handleInputChange('name')}
              disabled={loading}
              placeholder="e.g., Customer Support Agent"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              value={agentData.description}
              onChange={handleInputChange('description')}
              disabled={loading}
              placeholder="Brief description of what this agent does"
              sx={{ mb: 2 }}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading || !agentData.name.trim() || !agentData.project_id}
          startIcon={loading ? <CircularProgress size={20} /> : <SmartToyIcon />}
        >
          {loading ? 'Creating...' : 'Create Agent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAgentDialog;