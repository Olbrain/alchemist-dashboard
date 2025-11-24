/**
 * Simple Agent Knowledge Manager (v4.0.0)
 * 
 * Simplified agent-centric knowledge management focused on core workflow:
 * 1. Upload files to agent
 * 2. Copy files from organization library  
 * 3. Manage agent's files (view, remove, download)
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Remove as RemoveIcon,
  GetApp as DownloadIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import {
  subscribeToAgentKnowledge,
  deleteAgentKnowledge,
  uploadAgentKnowledgeFiles,
  downloadKnowledgeFile,
  refreshFileStatus
} from '../../../services/knowledgeBase/knowledgeLibraryService';
import { useAuth } from '../../../utils/AuthContext';
import FileUploadArea from '../../Alchemist/FileUpload/FileUploadArea';
import useIndexingProgress from '../../../hooks/useIndexingProgress';
import IndexingProgressIndicator from './IndexingProgressIndicator';

const SimpleAgentKnowledge = ({
  agentId,
  onNotification,
  disabled = false
}) => {
  // Get auth context
  const { currentUser } = useAuth();

  // Core state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Agent knowledge state - simplified
  const [agentFiles, setAgentFiles] = useState([]);

  // File upload dialog states
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Menu state for actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Delete confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, file: null, deleting: false });
  
  // Extract file IDs for progress tracking (only non-completed files)
  const FINAL_STATES = ['completed', 'failed', 'cancelled'];
  const fileIds = agentFiles
    .filter(file => !FINAL_STATES.includes(file.openai_status))
    .map(file => file.knowledge_id || file.id)
    .filter(id => id);

  // Use indexing progress hook for real-time updates (simplified direct approach)
  const { hasProcessingFiles, getFileProgress } = useIndexingProgress(fileIds);

  // Set up real-time listener for agent knowledge
  useEffect(() => {
    if (!agentId) {
      setError('Agent ID required. Invalid agent context.');
      setLoading(false);
      return;
    }

    console.log('📚 [Agent Knowledge] Setting up real-time listener for agent:', agentId);
    setLoading(true);
    setError('');

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAgentKnowledge(
      agentId,
      (knowledgeData) => {
        console.log('📚 [Agent Knowledge] Received real-time update:', {
          count: knowledgeData?.length || 0,
          files: knowledgeData?.map(f => ({
            knowledge_id: f.knowledge_id,
            filename: f.knowledge_info?.filename,
            usage_metadata: f.usage_metadata ? 'present' : 'missing'
          })) || []
        });

        setAgentFiles(knowledgeData || []);
        setLoading(false);
      },
      (error) => {
        console.error('📚 [Agent Knowledge] Error in real-time listener:', error);
        setError(`Failed to load agent knowledge: ${error.message}`);
        setLoading(false);

        if (onNotification) {
          onNotification(`Failed to load knowledge: ${error.message}`, 'error');
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('📚 [Agent Knowledge] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [agentId, onNotification]);

  /**
   * Handle file upload to agent
   */
  const handleFileUpload = () => {
    setUploadDialog(true);
  };

  /**
   * Handle files uploaded via FileUploadArea
   */
  const handleFilesUploaded = async (files) => {
    try {
      setUploading(true);
      setError('');

      // Validate inputs
      if (!files || files.length === 0) {
        throw new Error('No files selected for upload');
      }

      if (!agentId) {
        throw new Error('Agent context not available. Please refresh the page and try again.');
      }

      console.log(`Uploading ${files.length} files to agent ${agentId}`);

      // Additional client-side validation
      const maxFileSize = 25 * 1024 * 1024; // 25MB
      if (files.length > 1) {
        throw new Error('Please upload one file at a time.');
      }
      
      const file = files[0];
      if (file.size > maxFileSize) {
        throw new Error(`File "${file.name}" is too large. Maximum size is 25MB.`);
      }

      // Storage quota validation will be handled by knowledge-vault service during upload

      // Upload files directly to agent
      await uploadAgentKnowledgeFiles(agentId, files);

      // Files will auto-update via real-time listener

      if (onNotification) {
        onNotification(`Successfully uploaded "${files[0].name}" to agent`, 'success');
      }

      // Close upload dialog
      setUploadDialog(false);

    } catch (error) {
      console.error('Error uploading files:', error);
      
      let errorMessage = 'Failed to upload files';
      
      // Provide more specific error messages
      if (error.response && error.response.status === 413) {
        errorMessage = 'Files are too large. Please try with smaller files (max 25MB each).';
      } else if (error.response && error.response.status === 400) {
        errorMessage = 'Invalid file format or file corrupted. Please check your files and try again.';
      } else if (error.response && error.response.status === 401) {
        errorMessage = 'Authentication expired. Please refresh the page and try again.';
      } else if (error.response && error.response.status === 403) {
        errorMessage = 'Permission denied. You may not have access to upload files for this agent.';
      } else if (error.message) {
        // Handle specific Firestore-related errors from our upload service
        if (error.message.includes('failed to initialize indexing')) {
          errorMessage = error.message; // Use the detailed message from the service
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'You do not have permission to create knowledge library entries. Please check your permissions.';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Database is temporarily unavailable. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (onNotification) {
        onNotification(errorMessage, 'error');
      }
      
      // Don't close dialog on error so user can retry
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle upload dialog cancel
   */
  const handleUploadCancel = () => {
    if (!uploading) {
      setUploadDialog(false);
    }
  };

  /**
   * Handle remove file click - show confirmation dialog
   */
  const handleRemoveFileClick = (file) => {
    setDeleteConfirmation({ open: true, file, deleting: false });
  };

  /**
   * Handle confirmed file deletion
   */
  const handleConfirmDelete = async () => {
    const file = deleteConfirmation.file;
    if (!file) return;

    try {
      setDeleteConfirmation(prev => ({ ...prev, deleting: true }));

      console.log('🗑️ [File Deletion] Starting deletion process for file:', {
        filename: file.knowledge_info?.filename || file.filename,
        knowledge_id: file.knowledge_id,
        agent_id: file.agent_id,
        full_file: file
      });

      if (!file.knowledge_id) {
        throw new Error('Knowledge ID is missing from file data');
      }

      // Log current agent files before deletion
      console.log('🗑️ [File Deletion] Agent files before deletion:', {
        count: agentFiles.length,
        fileIds: agentFiles.map(f => ({ knowledge_id: f.knowledge_id, filename: f.knowledge_info?.filename }))
      });

      // Delete the knowledge item directly (soft delete)
      await deleteAgentKnowledge(file.knowledge_id);
      console.log('🗑️ [File Deletion] Knowledge item deleted successfully');
      // File list will auto-update via real-time listener

      if (onNotification) {
        onNotification('File removed from agent', 'success');
      }

      // Close dialog
      setDeleteConfirmation({ open: false, file: null, deleting: false });

    } catch (error) {
      console.error('🗑️ [File Deletion] Error removing file:', error);
      if (onNotification) {
        onNotification(`Failed to remove file: ${error.message}`, 'error');
      }
      setDeleteConfirmation(prev => ({ ...prev, deleting: false }));
    }
  };

  /**
   * Handle cancel deletion
   */
  const handleCancelDelete = () => {
    if (!deleteConfirmation.deleting) {
      setDeleteConfirmation({ open: false, file: null, deleting: false });
    }
  };

  /**
   * Handle downloading file from agent
   */
  // Menu handlers
  const handleMenuClick = (event, file) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleMenuDownload = () => {
    if (selectedFile) {
      handleDownloadFile(selectedFile);
    }
    handleMenuClose();
  };

  const handleMenuRemove = () => {
    if (selectedFile) {
      handleRemoveFileClick(selectedFile);
    }
    handleMenuClose();
  };

  const handleDownloadFile = async (file) => {
    try {
      console.log('💾 [File Download] Starting download for file:', {
        filename: file.knowledge_info?.filename || file.filename,
        knowledge_id: file.knowledge_id,
        content_type: file.content_type
      });

      await downloadKnowledgeFile(file);

      if (onNotification) {
        onNotification(`Downloaded "${file.knowledge_info?.filename || file.filename}"`, 'success');
      }

    } catch (error) {
      console.error('💾 [File Download] Error downloading file:', error);
      if (onNotification) {
        onNotification(`Failed to download file: ${error.message}`, 'error');
      }
    }
  };

  /**
   * Handle refreshing file status from OpenAI
   */
  const handleRefreshFileStatus = async (file) => {
    try {
      console.log('🔄 [Status Refresh] Checking status for file:', file.knowledge_id);

      const result = await refreshFileStatus(file.knowledge_id, currentUser.uid);

      console.log('✅ [Status Refresh] Status updated:', result);

      if (onNotification) {
        const statusMessages = {
          'completed': 'File is ready for search',
          'in_progress': 'File is still processing',
          'failed': 'File processing failed'
        };
        onNotification(
          statusMessages[result.status] || 'Status checked',
          result.status === 'failed' ? 'error' : 'info'
        );
      }

    } catch (error) {
      console.error('❌ [Status Refresh] Error refreshing status:', error);
      if (onNotification) {
        onNotification(`Failed to check status: ${error.message}`, 'error');
      }
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    
    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }
    
    return `${Math.round(size * 100) / 100} ${sizes[i]}`;
  };

  /**
   * Get friendly file type from file extension
   */
  const getFileType = (fileType) => {
    if (!fileType) return 'Unknown';

    const extensionMap = {
      'url': 'Web Page',  // Special type for URL content
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'txt': 'Text',
      'md': 'Markdown',
      'json': 'JSON',
      'csv': 'CSV',
      'html': 'HTML',
      'htm': 'HTML',
      'xml': 'XML',
      'rtf': 'RTF',
      'png': 'Image',
      'jpg': 'Image',
      'jpeg': 'Image',
      'gif': 'Image',
      'svg': 'Image',
      'mp4': 'Video',
      'avi': 'Video',
      'mov': 'Video',
      'mp3': 'Audio',
      'wav': 'Audio',
      'zip': 'Archive',
      'rar': 'Archive',
      'tar': 'Archive',
      'gz': 'Archive'
    };

    return extensionMap[fileType.toLowerCase()] || fileType.toUpperCase();
  };

  /**
   * Format upload date for display
   */
  const formatUploadDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Unknown';
    }
  };

  // Removed legacy cost/token/chunk tracking functions (no longer needed with OpenAI Vector Store)

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
          Loading agent knowledge...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Action Buttons */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleFileUpload}
          disabled={disabled}
          data-kb-upload-btn
        >
          Upload Files
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Agent Files Display */}
      <Box sx={{ flexGrow: 1 }}>
          {hasProcessingFiles && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="primary">
                Processing {agentFiles.filter(f => f.status === 'in_progress').length} files...
              </Typography>
            </Box>
          )}

          {agentFiles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No files added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload files or add from library to get started
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agentFiles.map((file, index) => {
                    const fileId = file.knowledge_id || file.id;
                    const progressInfo = getFileProgress(fileId);

                    return (
                      <TableRow key={fileId || index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FileIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {file.knowledge_info?.filename || file.filename || 'Unknown file'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {getFileType(file.knowledge_info?.file_type)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(file.knowledge_info?.file_size || file.knowledge_info?.size || file.size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IndexingProgressIndicator
                            file={file}
                            progressInfo={progressInfo}
                            size="small"
                            showProgressBar={true}
                            showPhase={false}
                            onRefresh={() => handleRefreshFileStatus(file)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatUploadDate(file.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, file)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuDownload}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuRemove} sx={{ color: 'error.main' }}>
          <RemoveIcon fontSize="small" sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>

      {/* File Upload Dialog - Simplified */}
      <Dialog
        open={uploadDialog}
        onClose={handleUploadCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Upload Knowledge File</Typography>
            <IconButton onClick={handleUploadCancel} size="small" disabled={uploading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <FileUploadArea
            onFilesUploaded={handleFilesUploaded}
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.html,.rtf,.xls,.xlsx"
            maxFiles={1}
            maxSize={25 * 1024 * 1024} // 25MB
            multiple={false}
            title=""
            description="Drag and drop or click to select a file (PDF, Word, Text, Excel, etc.)"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm File Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{deleteConfirmation.file?.knowledge_info?.filename || deleteConfirmation.file?.filename || 'this file'}" from the agent?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            disabled={deleteConfirmation.deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteConfirmation.deleting}
            startIcon={deleteConfirmation.deleting ? <CircularProgress size={20} /> : <RemoveIcon />}
          >
            {deleteConfirmation.deleting ? 'Removing...' : 'Remove File'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleAgentKnowledge;