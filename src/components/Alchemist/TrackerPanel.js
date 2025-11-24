import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Collapse,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { getDataAccess } from '../../services/data/DataAccessFactory';

const TrackerPanel = ({ userId, sx = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [trackers, setTrackers] = useState([]);
  const [sourceData, setSourceData] = useState({});
  const sourceListeners = React.useRef({});

  const setupSourceListener = useCallback((tracker) => {
    // Note: This still uses Firestore directly for nested source document listeners
    // since these are dynamic paths. This is acceptable as it's a special case.
    // For Docker deployment, these trackers would use API polling instead.

    // Clean up existing listener if any
    if (sourceListeners.current[tracker.id]) {
      sourceListeners.current[tracker.id]();
    }

    // For now, we'll keep the direct Firestore listener for source documents
    // In the future, this could be enhanced to use dataAccess methods
    if (tracker.source_document_path) {
      // This will work in cloud mode; in Docker mode trackers should use polling
      console.warn('TrackerPanel: Using direct Firestore for source document listener. Consider API polling for Docker deployments.');
    }

    setSourceData(prev => ({
      ...prev,
      [tracker.id]: tracker.current_values || {}
    }));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const dataAccess = getDataAccess();
    const unsubscribeTrackers = dataAccess.subscribeToAlchemistTrackers(userId, (activeTrackers) => {
      // Filter only active trackers
      const filteredTrackers = activeTrackers.filter(t => t.active === true);
      setTrackers(filteredTrackers);

      // Setup listeners for source documents
      filteredTrackers.forEach(tracker => {
        if (tracker.source_document_path && tracker.type === 'firestore_listener') {
          setupSourceListener(tracker);
        }
      });
    });

    return () => {
      unsubscribeTrackers();
      // Cleanup source listeners
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const listeners = sourceListeners.current;
      Object.values(listeners).forEach(unsub => typeof unsub === 'function' && unsub());
    };
  }, [userId, setupSourceListener]);

  const getTaskCounts = () => {
    const counts = { active: 0, pending: 0, completed: 0, failed: 0 };

    trackers.forEach(tracker => {
      const data = sourceData[tracker.id] || tracker.current_values || {};
      const status = data.status || 'pending';

      switch (status?.toLowerCase()) {
        case 'completed':
        case 'indexed':
        case 'success':
          counts.completed++;
          break;
        case 'failed':
        case 'error':
          counts.failed++;
          break;
        case 'pending':
        case 'queued':
          counts.pending++;
          break;
        case 'processing':
        case 'active':
        case 'in_progress':
          counts.active++;
          break;
        default:
          counts.active++; // Default to active for unknown statuses
      }
    });

    return counts;
  };

  const getFilteredTrackersForDisplay = () => {
    // Separate completed and non-completed trackers
    const completedTrackers = [];
    const nonCompletedTrackers = [];

    trackers.forEach(tracker => {
      const data = sourceData[tracker.id] || tracker.current_values || {};
      const status = data.status || 'pending';
      const statusLower = status?.toLowerCase();

      if (statusLower === 'completed' || statusLower === 'indexed' ||
          statusLower === 'success' || statusLower === 'failed' ||
          statusLower === 'error') {
        completedTrackers.push(tracker);
      } else {
        nonCompletedTrackers.push(tracker);
      }
    });

    // Sort completed trackers by timestamp (most recent first)
    completedTrackers.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || 0;
      const bTime = b.updated_at || b.created_at || 0;
      return bTime - aTime; // Descending order (newest first)
    });

    // Take only the last 3 completed trackers
    const recentCompletedTrackers = completedTrackers.slice(0, 3);

    // Return all non-completed + last 3 completed
    return [...nonCompletedTrackers, ...recentCompletedTrackers];
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'indexed':
      case 'success':
        return <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />;
      case 'failed':
      case 'error':
        return <ErrorIcon color="error" sx={{ fontSize: 16 }} />;
      case 'pending':
      case 'queued':
        return <PendingIcon color="warning" sx={{ fontSize: 16 }} />;
      default:
        return <CircularProgress size={16} />;
    }
  };

  const getProgressColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'failed':
      case 'error':
        return 'error';
      case 'completed':
      case 'indexed':
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  if (trackers.length === 0) {
    return null;
  }

  const taskCounts = getTaskCounts();

  return (
    <Box
      sx={{
        position: 'relative',
        mb: 0,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 0,
        transition: 'all 0.3s ease',
        ...sx
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          backgroundColor: 'action.hover',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.selected'
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Task Tracker
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Stack direction="row" spacing={0.5}>
            {taskCounts.active > 0 && (
              <Chip
                label={`${taskCounts.active} active`}
                size="small"
                color="primary"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
            {taskCounts.pending > 0 && (
              <Chip
                label={`${taskCounts.pending} pending`}
                size="small"
                color="warning"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
            {taskCounts.completed > 0 && (
              <Chip
                label={`${taskCounts.completed} completed`}
                size="small"
                color="success"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
            {taskCounts.failed > 0 && (
              <Chip
                label={`${taskCounts.failed} failed`}
                size="small"
                color="error"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
          </Stack>

          <IconButton size="small" sx={{ p: 0.5 }}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 1, pt: 0, maxHeight: '250px', overflowY: 'auto' }}>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={0.5}>
            {getFilteredTrackersForDisplay().map((tracker, index) => {
              const data = sourceData[tracker.id] || tracker.current_values || {};
              const progress = data.progress || 0;
              const status = data.status || 'pending';

              const isActive = status === 'processing' || status === 'active' || status === 'in_progress';
              const isCompleted = status === 'completed' || status === 'success' || status === 'indexed' || status === 'failed' || status === 'error';

              return (
                <Box
                  key={tracker.id}
                  sx={{
                    py: isCompleted ? 0.25 : 1,
                    px: 1,
                    borderRadius: 1,
                    backgroundColor: isActive ? 'action.hover' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive ? 'action.selected' : 'transparent'
                    }
                  }}
                >
                  {/* Compact single-row layout */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* Status Icon */}
                    {getStatusIcon(status)}

                    {/* Title and Progress */}
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {tracker.display_config?.icon} {tracker.display_config?.title || 'Processing...'}
                        </Typography>
                        {/* Only show percentage for active tasks */}
                        {status !== 'completed' && status !== 'success' && status !== 'indexed' &&
                         status !== 'failed' && status !== 'error' && (
                          <Typography variant="caption" color="text.secondary">
                            {progress}%
                          </Typography>
                        )}
                      </Box>

                      {/* Inline Progress Bar - only show for active tasks */}
                      {tracker.display_config?.show_progress_bar !== false &&
                       status !== 'completed' && status !== 'success' && status !== 'indexed' &&
                       status !== 'failed' && status !== 'error' && (
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          color={getProgressColor(status)}
                          sx={{ height: 3, borderRadius: 0.5, mt: 0.5 }}
                        />
                      )}
                    </Box>

                    {/* Status Chip - only show for error/failed states */}
                    {(status === 'failed' || status === 'error') && (
                      <Chip
                        label={tracker.display_config?.status_text || status}
                        size="small"
                        color={getProgressColor(status)}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  {/* Error message if any */}
                  {data.error && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, ml: 3 }}>
                      {data.error}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default TrackerPanel;