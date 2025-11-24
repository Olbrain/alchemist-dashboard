/**
 * CompactAttachmentDisplay Component
 *
 * Space-efficient display of file attachments in message bubbles
 * Shows only essential info without processing status
 */
import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const CompactAttachmentDisplay = ({ attachments = [] }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (attachment) => {
    const fileName = attachment.name || attachment.filename || '';
    const fileType = attachment.type || attachment.content_type || '';

    // Check by file extension or MIME type
    if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) {
      return <ImageIcon sx={{ fontSize: 16 }} />;
    }
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return <PdfIcon sx={{ fontSize: 16 }} />;
    }
    if (/\.(doc|docx|txt|md)$/i.test(fileName)) {
      return <DocIcon sx={{ fontSize: 16 }} />;
    }
    if (/\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml|yaml|yml)$/i.test(fileName)) {
      return <CodeIcon sx={{ fontSize: 16 }} />;
    }
    return <FileIcon sx={{ fontSize: 16 }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round(bytes / Math.pow(1024, i) * 10) / 10;
    return `${size}${sizes[i]}`;
  };

  const getFileName = (attachment) => {
    const name = attachment.name || attachment.filename || 'File';
    // Truncate long names
    if (name.length > 20) {
      const ext = name.lastIndexOf('.') > -1 ? name.substring(name.lastIndexOf('.')) : '';
      return name.substring(0, 15) + '...' + ext;
    }
    return name;
  };

  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 0.5,
      mt: 1
    }}>
      {attachments.map((attachment, index) => {
        const fileName = getFileName(attachment);
        const fileSize = attachment.size || attachment.file_size;
        const fullName = attachment.name || attachment.filename || 'File';

        return (
          <Tooltip
            key={index}
            title={`${fullName}${fileSize ? ` • ${formatFileSize(fileSize)}` : ''}`}
            arrow
          >
            <Chip
              icon={getFileIcon(attachment)}
              label={`${fileName}${fileSize ? ` • ${formatFileSize(fileSize)}` : ''}`}
              size="small"
              variant="outlined"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                bgcolor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.15)',
                '& .MuiChip-icon': {
                  fontSize: 16,
                  ml: 0.5
                },
                '& .MuiChip-label': {
                  px: 1,
                  fontWeight: 500
                },
                cursor: attachment.url ? 'pointer' : 'default',
                '&:hover': attachment.url ? {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: 'primary.main'
                } : {}
              }}
              onClick={attachment.url ? () => window.open(attachment.url, '_blank') : undefined}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default CompactAttachmentDisplay;