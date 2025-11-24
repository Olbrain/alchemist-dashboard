/**
 * AttachmentDisplay Component
 *
 * Displays file attachments within chat messages with visual previews,
 * processing status, and AI analysis results
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import FileIcon, { getFileTypeFromName } from '../../shared/FileIcon';

const AttachmentDisplay = ({ attachments = [] }) => {
  const [expandedAttachments, setExpandedAttachments] = useState({});

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const toggleExpanded = (index) => {
    setExpandedAttachments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getStatusIcon = (attachment) => {
    if (attachment.error || attachment.content_error) {
      return <ErrorIcon color="error" fontSize="small" />;
    }
    if (attachment.processed) {
      return <CheckCircleIcon color="success" fontSize="small" />;
    }
    return <CircularProgress size={16} />;
  };

  const getStatusColor = (attachment) => {
    if (attachment.error || attachment.content_error) {
      return 'error';
    }
    if (attachment.processed) {
      return 'success';
    }
    return 'info';
  };

  const getStatusText = (attachment) => {
    if (attachment.error || attachment.content_error) {
      return 'Processing Failed';
    }
    if (attachment.processed) {
      return 'Processed Successfully';
    }
    return 'Processing...';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const renderImagePreview = (attachment) => {
    if (attachment.category !== 'image' || !attachment.storage_path) {
      return null;
    }

    // For now, we'll show a placeholder since we'd need to generate signed URLs
    // for Firebase Storage to actually display the image
    return (
      <Box
        sx={{
          width: 80,
          height: 80,
          bgcolor: 'grey.100',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: 'grey.300'
        }}
      >
        <FileIcon 
          filename={attachment.name} 
          sx={{ fontSize: 32, color: 'grey.500' }} 
        />
      </Box>
    );
  };

  const renderProcessingResults = (attachment) => {
    const { content } = attachment;
    if (!content) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          AI Analysis Results:
        </Typography>
        
        {content.analysis && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Content Analysis:
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {content.analysis}
              </Typography>
            </Paper>
          </Box>
        )}

        {content.extracted_text && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Extracted Text:
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: '1px solid',
                borderColor: 'grey.200',
                maxHeight: 150,
                overflowY: 'auto'
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {content.extracted_text.length > 500 
                  ? content.extracted_text.substring(0, 500) + '...'
                  : content.extracted_text
                }
              </Typography>
            </Paper>
          </Box>
        )}

        {content.raw_content && attachment.category === 'code' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Code Content Preview:
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.900', 
                border: '1px solid',
                borderColor: 'grey.300',
                maxHeight: 150,
                overflowY: 'auto'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'white'
                }}
              >
                {content.raw_content.length > 800 
                  ? content.raw_content.substring(0, 800) + '...'
                  : content.raw_content
                }
              </Typography>
            </Paper>
          </Box>
        )}

        {(content.error || attachment.content_error) && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {content.error || attachment.content_error}
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        📎 Attachments ({attachments.length})
      </Typography>
      
      <Grid container spacing={1}>
        {attachments.map((attachment, index) => (
          <Grid item xs={12} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* File Preview/Icon */}
                  <Box sx={{ flexShrink: 0 }}>
                    {attachment.category === 'image' ? (
                      renderImagePreview(attachment)
                    ) : (
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: 'primary.light'
                        }}
                      >
                        <FileIcon 
                          filename={attachment.name} 
                          sx={{ fontSize: 20 }} 
                        />
                      </Avatar>
                    )}
                  </Box>

                  {/* File Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {attachment.name}
                      </Typography>
                      {getStatusIcon(attachment)}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={getFileTypeFromName(attachment.name)}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Chip
                        label={getStatusText(attachment)}
                        size="small"
                        color={getStatusColor(attachment)}
                        variant="outlined"
                      />
                      {attachment.size && (
                        <Chip
                          label={formatFileSize(attachment.size)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {attachment.category && (
                        <Chip
                          label={attachment.category}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      )}
                    </Box>

                    {/* Processing Method Info */}
                    {attachment.content && attachment.content.processing_method && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Processed using: {attachment.content.processing_method}
                      </Typography>
                    )}

                    {/* Expand Button */}
                    {attachment.content && (attachment.content.analysis || attachment.content.extracted_text || attachment.content.raw_content) && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpanded(index)}
                          sx={{ p: 0.5 }}
                        >
                          {expandedAttachments[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {expandedAttachments[index] ? 'Hide Details' : 'Show Details'}
                          </Typography>
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Expanded Content */}
                <Collapse in={expandedAttachments[index]}>
                  {renderProcessingResults(attachment)}
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AttachmentDisplay;