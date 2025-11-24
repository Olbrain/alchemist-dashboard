/**
 * Public Tools Management Content
 *
 * Admin page for creating and managing public tools available to all clients
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import {
  createPublicTool,
  updatePublicTool,
  deletePublicTool,
  getPublicToolsWithStats
} from '../../services/tools/toolsService';
import NotificationSystem, { createNotification } from '../shared/NotificationSystem';

const PublicToolsManagementContent = () => {
  // State
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createToolName, setCreateToolName] = useState('');
  const [createToolDescription, setCreateToolDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [editToolName, setEditToolName] = useState('');
  const [editToolDescription, setEditToolDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTool, setDeletingTool] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load tools on mount
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const fetchedTools = await getPublicToolsWithStats();
      setTools(fetchedTools);
    } catch (error) {
      console.error('Error loading public tools:', error);
      setNotification(createNotification(
        'Failed to load public tools',
        'error'
      ));
    } finally {
      setLoading(false);
    }
  };

  // Create Tool Handlers
  const handleOpenCreateModal = () => {
    setCreateToolName('');
    setCreateToolDescription('');
    setCreateError('');
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (!creating) {
      setCreateModalOpen(false);
      setCreateToolName('');
      setCreateToolDescription('');
      setCreateError('');
    }
  };

  const handleCreateTool = async () => {
    // Validation
    if (!createToolName.trim()) {
      setCreateError('Tool name is required');
      return;
    }
    if (!createToolDescription.trim()) {
      setCreateError('Tool functionality/description is required');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await createPublicTool(createToolName.trim(), createToolDescription.trim());

      // Success
      setNotification(createNotification(
        'Public tool created successfully',
        'success'
      ));

      // Close modal and reload tools
      setCreateModalOpen(false);
      setCreateToolName('');
      setCreateToolDescription('');
      await loadTools();
    } catch (error) {
      console.error('Error creating public tool:', error);
      setCreateError(error.message || 'Failed to create tool');
    } finally {
      setCreating(false);
    }
  };

  // Edit Tool Handlers
  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setEditToolName(tool.name);
    setEditToolDescription(tool.description);
    setEditError('');
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (!updating) {
      setEditModalOpen(false);
      setEditingTool(null);
      setEditToolName('');
      setEditToolDescription('');
      setEditError('');
    }
  };

  const handleUpdateTool = async () => {
    // Validation
    if (!editToolName.trim()) {
      setEditError('Tool name is required');
      return;
    }
    if (!editToolDescription.trim()) {
      setEditError('Tool functionality/description is required');
      return;
    }

    setUpdating(true);
    setEditError('');

    try {
      await updatePublicTool(editingTool.id, editToolName.trim(), editToolDescription.trim());

      // Success
      setNotification(createNotification(
        'Public tool updated successfully',
        'success'
      ));

      // Close modal and reload tools
      setEditModalOpen(false);
      setEditingTool(null);
      setEditToolName('');
      setEditToolDescription('');
      await loadTools();
    } catch (error) {
      console.error('Error updating public tool:', error);
      setEditError(error.message || 'Failed to update tool');
    } finally {
      setUpdating(false);
    }
  };

  // Delete Tool Handlers
  const handleOpenDeleteDialog = (tool) => {
    setDeletingTool(tool);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
      setDeletingTool(null);
    }
  };

  const handleDeleteTool = async () => {
    setDeleting(true);

    try {
      await deletePublicTool(deletingTool.id);

      // Success
      setNotification(createNotification(
        'Public tool deleted successfully',
        'success'
      ));

      // Close dialog and reload tools
      setDeleteDialogOpen(false);
      setDeletingTool(null);
      await loadTools();
    } catch (error) {
      console.error('Error deleting public tool:', error);
      setNotification(createNotification(
        error.message || 'Failed to delete tool',
        'error'
      ));
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Empty State
  const EmptyState = () => (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        color: 'text.secondary'
      }}
    >
      <BuildIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        No Public Tools Yet
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Create your first public tool to make it available to all clients
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenCreateModal}
      >
        Create Public Tool
      </Button>
    </Box>
  );

  // Loading State
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading public tools...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: 3,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
              Public Tools Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
          >
            Create Public Tool
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Create and manage public tools available to all clients
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {tools.length === 0 ? (
          <EmptyState />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tool Name</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tools.map((tool) => (
                  <TableRow key={tool.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BuildIcon fontSize="small" color="primary" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {tool.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 400 }}>
                        {tool.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(tool.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Tool">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(tool)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Tool">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(tool)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Create Tool Modal */}
      <Dialog
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={creating}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon color="primary" />
            Create Public Tool
          </Box>
        </DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Tool Name"
            fullWidth
            required
            variant="outlined"
            value={createToolName}
            onChange={(e) => setCreateToolName(e.target.value)}
            disabled={creating}
            placeholder="e.g., Google Search, Weather API"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Tool Functionality"
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            value={createToolDescription}
            onChange={(e) => setCreateToolDescription(e.target.value)}
            disabled={creating}
            placeholder="Describe what this tool does and how it can be used..."
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            This tool will be available for all clients to browse and enable for their agents.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateModal} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTool}
            variant="contained"
            disabled={creating || !createToolName.trim() || !createToolDescription.trim()}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creating ? 'Creating...' : 'Create Tool'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tool Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={updating}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            Edit Public Tool
          </Box>
        </DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Tool Name"
            fullWidth
            required
            variant="outlined"
            value={editToolName}
            onChange={(e) => setEditToolName(e.target.value)}
            disabled={updating}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Tool Functionality"
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            value={editToolDescription}
            onChange={(e) => setEditToolDescription(e.target.value)}
            disabled={updating}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTool}
            variant="contained"
            disabled={updating || !editToolName.trim() || !editToolDescription.trim()}
            startIcon={updating ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {updating ? 'Updating...' : 'Update Tool'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Public Tool?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingTool?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTool}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};

export default PublicToolsManagementContent;
