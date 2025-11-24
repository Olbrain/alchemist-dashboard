/**
 * File Upload Modal
 * 
 * Modal dialog for file upload with drag and drop support
 */
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Fade,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { formatFileSize, isValidFileType } from '../../../utils/agentEditorHelpers';
import FileIcon from '../../shared/FileIcon';

const FileUploadModal = ({ 
  open,
  onClose,
  onFilesUploaded,
  fileType = 'all', // 'image' or 'all'
  agentId = null,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // File type configurations
  const fileTypeConfig = {
    image: {
      accept: '.png,.jpg,.jpeg,.gif,.webp,.bmp',
      title: 'Upload Images',
      description: 'Select image files to attach to your message',
      icon: <ImageIcon />,
      types: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
    },
    all: {
      accept: '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.docx,.json,.yaml,.yml',
      title: 'Upload Files',
      description: 'Select images, documents, or code files',
      icon: <AttachFileIcon />,
      types: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'md', 'docx', 'json', 'yaml', 'yml']
    }
  };

  const config = fileTypeConfig[fileType] || fileTypeConfig.all;
  const acceptedTypes = config.types;

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }
    
    if (acceptedTypes.length > 0 && !isValidFileType(file, acceptedTypes)) {
      return `File "${file.name}" type is not supported for ${fileType === 'image' ? 'images' : 'this upload'}.`;
    }
    
    return null;
  };

  const handleFiles = (files) => {
    setError('');
    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      setError(`Too many files selected. Maximum is ${maxFiles} files.`);
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    setSelectedFiles(validFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProcessing(false);
    setError('');

    try {
      if (agentId) {
        setProcessing(true);
        
        // Import the service to avoid circular dependencies
        const { uploadFilesForAgentCreation } = await import('../../../services');
        
        // Upload and process files
        const result = await uploadFilesForAgentCreation(selectedFiles, agentId);

        // Call the callback with processed results
        await onFilesUploaded(result.processed_files || selectedFiles, result);
      } else {
        // Original behavior for non-agent contexts
        await onFilesUploaded(selectedFiles);
      }
      
      // Close modal after successful upload
      handleClose();
      
    } catch (err) {
      console.error('File upload/processing error:', err);
      setError(`Upload failed: ${err.message || 'Please try again.'}`);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setError('');
    setUploading(false);
    setProcessing(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {config.icon}
          <Typography variant="h6">
            {config.title}
          </Typography>
          {fileType === 'image' && (
            <Chip label="Images Only" size="small" color="primary" variant="outlined" />
          )}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* Upload Area */}
        <Paper
          variant="outlined"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragActive ? 'action.hover' : 'background.default',
            borderStyle: dragActive ? 'solid' : 'dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderWidth: 2,
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
              borderColor: 'primary.main'
            }
          }}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={config.accept}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              color: dragActive ? 'primary.main' : 'text.secondary',
              mb: 2 
            }} 
          />
          
          <Typography variant="h6" sx={{ mb: 1, color: dragActive ? 'primary.main' : 'text.primary' }}>
            {dragActive ? 'Drop files here' : 'Select Files'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {config.description}
          </Typography>

          <Button
            variant="outlined"
            startIcon={config.icon}
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            sx={{ mt: 1 }}
          >
            Browse Files
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Accepted: {fileType === 'image' ? 'Images' : 'Images, Documents, Code'} • 
            Max {maxFiles} files • Max {formatFileSize(maxSize)} each
          </Typography>
        </Paper>

        {/* Error Display */}
        {error && (
          <Fade in={true}>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Selected Files ({selectedFiles.length})
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflowY: 'auto' }}>
              {selectedFiles.map((file, index) => (
                <Fade in={true} key={index} timeout={300}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 1
                    }}
                  >
                    <FileIcon filename={file.name} sx={{ mr: 2, color: 'text.secondary' }} />
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      size="small"
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                </Fade>
              ))}
            </Box>

            {/* Upload Progress */}
            {(uploading || processing) && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  {processing ? 'Attaching files to message...' : 'Uploading files...'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={uploading || processing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={uploading || processing || selectedFiles.length === 0}
          startIcon={<CloudUploadIcon />}
        >
          {processing 
            ? `Processing ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}...`
            : uploading
              ? `Uploading ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}...`
              : `Process ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadModal;