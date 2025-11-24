/**
 * IndexingProgressIndicator Component
 *
 * Shows OpenAI Vector Store processing status
 */
import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as ProcessingIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  HourglassEmpty as WaitingIcon
} from '@mui/icons-material';

const IndexingProgressIndicator = ({
  file,
  progressInfo,
  showProgressBar = true,
  showPhase = true,
  size = 'medium',
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Get status from OpenAI Vector Store
  const status = progressInfo?.status || file?.openai_status || 'unknown';
  const error = progressInfo?.error || file?.openai_error;

  // Status configurations for OpenAI Vector Store
  const getStatusConfig = (status) => {
    const configs = {
      'in_progress': {
        label: 'Processing',
        color: 'primary',
        icon: ProcessingIcon,
        description: 'OpenAI is processing the file',
        animated: true
      },
      'completed': {
        label: 'Ready',
        color: 'success',
        icon: CompletedIcon,
        description: 'File is ready for search'
      },
      'failed': {
        label: 'Failed',
        color: 'error',
        icon: ErrorIcon,
        description: error || 'Processing failed'
      },
      'unknown': {
        label: 'Unknown',
        color: 'default',
        icon: WaitingIcon,
        description: 'Status unknown'
      }
    };

    return configs[status] || configs['unknown'];
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const isProcessing = status === 'in_progress';
  const isSmall = size === 'small';

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* Status Chip */}
        <Tooltip title={statusConfig.description}>
          <Chip
            icon={
              isProcessing && statusConfig.animated ? (
                <CircularProgress size={16} sx={{ color: 'inherit' }} />
              ) : (
                <StatusIcon />
              )
            }
            label={statusConfig.label}
            color={statusConfig.color}
            size={isSmall ? 'small' : 'medium'}
            variant="outlined"
            sx={{
              minWidth: isSmall ? 'auto' : 80,
              '& .MuiChip-label': {
                fontSize: isSmall ? '0.75rem' : '0.875rem'
              }
            }}
          />
        </Tooltip>

        {/* Error Message */}
        {status === 'failed' && error && !isSmall && (
          <Typography
            variant="caption"
            sx={{
              color: 'error.main',
              fontSize: '0.75rem',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={error}
          >
            {error}
          </Typography>
        )}
      </Box>

      {/* Refresh Button - Only show when processing */}
      {isProcessing && onRefresh && (
        <Tooltip title="Check current status">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              ml: 0.5,
              opacity: isRefreshing ? 0.5 : 1
            }}
          >
            {isRefreshing ? (
              <CircularProgress size={16} />
            ) : (
              <RefreshIcon sx={{ fontSize: isSmall ? 16 : 18 }} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default IndexingProgressIndicator;