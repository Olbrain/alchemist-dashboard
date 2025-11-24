/**
 * Create Project Dialog Component
 *
 * Modal dialog for quick project creation
 */
import React, { useState } from 'react';
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
import { Assignment as ProjectIcon } from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import { createProject } from '../../services/projects/projectService';

const CreateProjectDialog = ({ open, onClose, onProjectCreated, organizationId: propOrganizationId }) => {
  const { organizationId: contextOrgId } = useAuth();

  // Use prop organizationId if provided, otherwise use context organizationId
  const organizationId = propOrganizationId || contextOrgId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [projectData, setProjectData] = useState({
    name: '',
    description: ''
  });

  const handleInputChange = (field) => (event) => {
    setProjectData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      setProjectData({
        name: '',
        description: ''
      });
      setError('');
      onClose();
    }
  };

  const handleCreate = async () => {
    // Validate
    if (!projectData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!organizationId) {
      setError('No organization selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createdProject = await createProject(
        organizationId,
        {
          name: projectData.name.trim(),
          description: projectData.description.trim(),
          status: 'active'
        }
      );

      console.log('Project created successfully:', createdProject);

      // Notify parent component
      if (onProjectCreated) {
        onProjectCreated(createdProject.id);
      }

      // Reset and close
      setProjectData({
        name: '',
        description: ''
      });
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && projectData.name.trim()) {
      event.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <ProjectIcon color="primary" />
        <Typography variant="h6" fontWeight="600">
          Create New Project
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            label="Project Name"
            placeholder="e.g., My Awesome Project"
            fullWidth
            required
            value={projectData.name}
            onChange={handleInputChange('name')}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            helperText="Give your project a descriptive name"
          />

          <TextField
            label="Description"
            placeholder="What is this project about?"
            fullWidth
            multiline
            rows={3}
            value={projectData.description}
            onChange={handleInputChange('description')}
            disabled={loading}
            variant="outlined"
            helperText="Optional: Describe the purpose of this project"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!projectData.name.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <ProjectIcon />}
          sx={{
            textTransform: 'none',
            minWidth: 120
          }}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectDialog;
