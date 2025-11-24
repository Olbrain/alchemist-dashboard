/**
 * File Upload Area
 * 
 * Reusable file upload component with drag and drop support
 */
import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Fade
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatFileSize, isValidFileType } from '../../../utils/agentEditorHelpers';
import FileIcon from '../../shared/FileIcon';

const FileUploadArea = ({ 
  onFilesUploaded,
  onCancel,
  accept = "*",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  title = "Upload Files",
  description = "Drag and drop files here or click to browse",
  agentId = null // Add agentId prop for processing
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState(null);
  const fileInputRef = useRef(null);

  const acceptedTypes = accept === "*" ? [] : accept.split(',').map(type => type.trim().replace('.', ''));

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }
    
    if (acceptedTypes.length > 0 && !isValidFileType(file, acceptedTypes)) {
      return `File "${file.name}" type is not supported. Accepted types: ${accept}`;
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

    if (!multiple && validFiles.length > 1) {
      setError('Only one file can be selected.');
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
    setProcessingResults(null);

    try {
      // If agentId is provided, process files through the backend
      if (agentId) {
        setProcessing(true);
        
        // Import the service here to avoid circular dependencies
        const { uploadFilesForAgentCreation } = await import('../../../services');
        
        // Upload and process files
        const result = await uploadFilesForAgentCreation(selectedFiles, agentId);

        setProcessingResults(result);
        
        // Call the onFilesUploaded callback with processed results
        await onFilesUploaded(result.processed_files || selectedFiles, result);
      } else {
        // Original behavior for non-agent contexts
        await onFilesUploaded(selectedFiles);
      }
      
      setSelectedFiles([]);
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        {onCancel && (
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Upload Area */}
      <Paper
        variant="outlined"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: title ? 4 : 2.5,
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
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <CloudUploadIcon
          sx={{
            fontSize: title ? 48 : 40,
            color: dragActive ? 'primary.main' : 'text.secondary',
            mb: title ? 2 : 1.5
          }}
        />

        {title && (
          <Typography variant="h6" sx={{ mb: 1, color: dragActive ? 'primary.main' : 'text.primary' }}>
            {dragActive ? 'Drop files here' : title}
          </Typography>
        )}

        <Typography variant={title ? "body2" : "body1"} color="text.secondary" sx={{ mb: title ? 2 : 1.5 }}>
          {dragActive ? 'Drop file here' : description}
        </Typography>

        <Button
          variant="outlined"
          startIcon={<AttachFileIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
          sx={{ mt: 1 }}
        >
          Browse Files
        </Button>

        {acceptedTypes.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Accepted types: {accept} • Max size: {formatFileSize(maxSize)}
          </Typography>
        )}
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
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {processing ? 'Processing files with AI...' : 'Uploading files...'}
              </Typography>
            </Box>
          )}
          
          {/* Processing Results */}
          {processingResults && !uploading && !processing && (
            <Box sx={{ mt: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📄 Processing Complete
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {processingResults.summary}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Upload Button */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
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
                  : `${agentId ? 'Process' : 'Upload'} ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
              }
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedFiles([]);
                setProcessingResults(null);
              }}
              disabled={uploading || processing}
            >
              Clear
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUploadArea;