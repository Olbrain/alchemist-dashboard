/**
 * Status Activity Display Component
 *
 * Self-contained component that displays real-time status updates from the orchestrator agent
 * showing what actions are being performed during processing.
 * Manages its own Firestore subscription to prevent parent re-renders.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  keyframes,
  useTheme
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { getDataAccess } from '../../services/data/DataAccessFactory';

// Define pulse animation
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`;

const StatusActivityDisplay = ({
  userId,
  loading = false,
  localElapsedTime = 0,
  useLocalTimer = false,
  showFullDetails = false
}) => {
  const theme = useTheme();
  const [status, setStatus] = useState(null);
  const [displayStatus, setDisplayStatus] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const intervalRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [localLoadingTimer, setLocalLoadingTimer] = useState(null);
  const [localLoadingElapsed, setLocalLoadingElapsed] = useState(0);
  const localLoadingIntervalRef = useRef(null);

  // StatusDot component for visual status indicator
  const StatusDot = ({ statusType }) => {
    const dotStyles = {
      width: 8,
      height: 8,
      borderRadius: '50%',
      flexShrink: 0
    };

    switch(statusType) {
      case 'idle':
        return <Box sx={{ ...dotStyles, bgcolor: 'grey.400' }} />;
      case 'queued':
        return <Box sx={{ ...dotStyles, bgcolor: 'grey.500' }} />;
      case 'active':
      case 'processing':
      case 'planning':
      case 'executing':
        return (
          <Box sx={{
            ...dotStyles,
            bgcolor: 'success.main',
            animation: `${pulse} 1.5s ease-in-out infinite`
          }} />
        );
      case 'error':
        return <Box sx={{ ...dotStyles, bgcolor: 'error.main' }} />;
      case 'completed':
      case 'complete':
        return <CheckIcon sx={{ fontSize: 12, color: 'success.main' }} />;
      default:
        return <Box sx={{ ...dotStyles, bgcolor: 'grey.400' }} />;
    }
  };

  // Set up real-time status listener
  useEffect(() => {
    if (!userId) return;

    const dataAccess = getDataAccess();
    const unsubscribe = dataAccess.subscribeToAlchemistStatus(userId, (statusData) => {
      if (statusData) {
        setStatus(statusData);

        // Start timer when status becomes active
        if (statusData.status === 'active' && !startTime) {
          const now = Date.now();
          setStartTime(now);
          setElapsedTime(0);
        }

        // Stop timer when complete but keep status visible
        if (statusData.status === 'complete') {
          setStartTime(null);
          setElapsedTime(0);
        }
      } else {
        setStatus(null);
        setStartTime(null);
        setElapsedTime(0);
      }
    });

    return () => unsubscribe();
  }, [userId, startTime]);

  // Timer effect - updates elapsed time every second
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval if status is active
    if (status?.status === 'active' && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
      }, 100);
    }

    // Cleanup on unmount or status change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status?.status, startTime]);

  // Debounce status changes to prevent flicker
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Handle immediate updates for critical states
    const isProcessingState = status?.status === 'active' ||
                             status?.status === 'initializing' ||
                             status?.status === 'processing' ||
                             status?.status === 'planning' ||
                             status?.status === 'executing';

    const isErrorState = status?.status === 'error';
    const isCompletedState = status?.status === 'completed' || status?.status === 'complete';

    // Immediate updates for processing, error, or completed states
    if (isProcessingState || isErrorState) {
      setDisplayStatus(status);
      setIsInitialLoad(false);
      return;
    }

    // Debounce other state changes (especially idle/null transitions)
    if (isCompletedState) {
      // Show completed immediately, but debounce the return to idle/ready
      setDisplayStatus(status);
      setIsInitialLoad(false);
    } else {
      // Debounce transitions to idle/ready states
      debounceTimerRef.current = setTimeout(() => {
        setDisplayStatus(status);
        setIsInitialLoad(false);
      }, isInitialLoad ? 0 : 500); // No delay on initial load, 500ms delay on subsequent changes
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [status, isInitialLoad]);

  // Local loading timer effect - tracks elapsed time during API calls
  useEffect(() => {
    // Clear any existing local loading interval
    if (localLoadingIntervalRef.current) {
      clearInterval(localLoadingIntervalRef.current);
      localLoadingIntervalRef.current = null;
    }

    if (loading) {
      // Start local timer when loading begins
      const startTime = Date.now();
      setLocalLoadingTimer(startTime);
      setLocalLoadingElapsed(0);

      // Start interval to update elapsed time
      localLoadingIntervalRef.current = setInterval(() => {
        setLocalLoadingElapsed((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      // Clear local timer when loading stops
      if (localLoadingTimer) {
        setLocalLoadingTimer(null);
        setLocalLoadingElapsed(0);
      }
    }

    return () => {
      if (localLoadingIntervalRef.current) {
        clearInterval(localLoadingIntervalRef.current);
        localLoadingIntervalRef.current = null;
      }
    };
  }, [loading, localLoadingTimer]);

  const formatElapsedTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // If using local timer, show Firestore status data with local timer fallback
  if (useLocalTimer) {
    // Use displayStatus for stable transitions, fallback to status for processing states
    const currentStatus = displayStatus || status;
    const isIdle = !currentStatus || !currentStatus?.status;
    const actualDisplayStatus = loading ? 'active' :
                               currentStatus?.status === 'error' ? 'error' :
                               currentStatus?.status === 'completed' ? 'completed' :
                               currentStatus?.status ? currentStatus.status : 'Ready';

    const isComplete = currentStatus?.status === 'completed';
    const isError = currentStatus?.status === 'error';

    // Improved status text logic
    const statusText = loading ? 'Processing' :
                       isError ? 'Error occurred' :
                       isComplete ? 'Ready' :
                       currentStatus?.status === 'active' ||
                       currentStatus?.status === 'processing' ||
                       currentStatus?.status === 'planning' ||
                       currentStatus?.status === 'executing' ?
                       (currentStatus.current_action || 'Processing...') :
                       'Ready';

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 0.5
        }}
      >
        <StatusDot statusType={actualDisplayStatus} />
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem'
          }}
        >
          {statusText}
        </Typography>

        {/* Show mode if available and not complete */}
        {currentStatus?.mode && !isComplete && !isError && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7 }}>•</Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: currentStatus.mode === 'conversational' ? 'success.light' :
                         currentStatus.mode === 'planning' ? 'primary.light' : 'secondary.light',
                color: currentStatus.mode === 'conversational' ? 'success.dark' :
                       currentStatus.mode === 'planning' ? 'primary.dark' : 'secondary.dark',
                px: 0.75,
                py: 0.125,
                borderRadius: 0.375,
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
                opacity: 0.9
              }}
            >
              {currentStatus.mode}
            </Box>
          </>
        )}

        {/* Show elapsed time when processing (not when complete) */}
        {(loading || (!isIdle && !isComplete && (currentStatus?.status === 'active' || currentStatus?.status === 'processing' || currentStatus?.status === 'planning' || currentStatus?.status === 'executing'))) &&
         (localElapsedTime > 0 || localLoadingElapsed > 0 || elapsedTime > 0) && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              opacity: 0.7
            }}
          >
            • {loading && localLoadingElapsed > 0 ? `${localLoadingElapsed.toFixed(1)} sec` :
               localElapsedTime > 0 ? `${localElapsedTime.toFixed(1)} sec` :
               formatElapsedTime(elapsedTime)}
          </Typography>
        )}
      </Box>
    );
  }

  // Original Firestore-based display logic with loading state priority
  const currentStatus = displayStatus || status;
  const isIdle = !loading && (!currentStatus || !currentStatus?.status);  // Not idle if loading
  const isError = !loading && currentStatus?.status === 'error';
  const isComplete = !loading && (currentStatus?.status === 'completed' || currentStatus?.status === 'complete');

  // Prioritize loading state
  const finalDisplayStatus = loading ? 'active' :
                            currentStatus?.status === 'error' ? 'error' :
                            currentStatus?.status === 'completed' || currentStatus?.status === 'complete' ? 'completed' :
                            currentStatus?.status || 'Ready';

  const displayText = loading ? 'Processing' :
                     isError ? 'Error occurred' :
                     isComplete ? 'Ready' :
                     isIdle ? 'Ready' :
                     (currentStatus.current_action || 'Processing...');

  const showTimer = loading ||
                   (!isIdle && !isComplete && !isError &&
                   (currentStatus?.status === 'active' ||
                    currentStatus?.status === 'processing' ||
                    currentStatus?.status === 'planning' ||
                    currentStatus?.status === 'executing'));

  // Full details mode for status bar
  if (showFullDetails) {
    const getStatusColor = (statusType) => {
      switch(statusType) {
        case 'active':
        case 'processing':
          return theme.palette.success.main;
        case 'planning':
          return theme.palette.primary.main;
        case 'executing':
          return theme.palette.secondary.main;
        case 'error':
          return theme.palette.error.main;
        case 'completed':
        case 'complete':
          return theme.palette.info.main;
        case 'queued':
          return theme.palette.warning.main;
        default:
          return theme.palette.grey[500];
      }
    };

    const getStatusText = (statusType) => {
      switch(statusType) {
        case 'active':
          return 'Active';
        case 'processing':
          return 'Processing';
        case 'planning':
          return 'Planning';
        case 'executing':
          return 'Executing';
        case 'error':
          return 'Error';
        case 'completed':
        case 'complete':
          return 'Ready';
        case 'queued':
          return 'Queued';
        default:
          return 'Ready';
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          pl: 2
        }}
      >
        <StatusDot statusType={finalDisplayStatus} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 1 auto' }}>
          <Typography
            variant="body2"
            sx={{
              color: getStatusColor(finalDisplayStatus),
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          >
            {getStatusText(finalDisplayStatus)}
          </Typography>

          {currentStatus?.mode && !isComplete && !isError && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>•</Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.625rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3
                }}
              >
                {currentStatus.mode}
              </Typography>
            </>
          )}

          {currentStatus?.current_action && !isIdle && !isComplete && !isError && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>•</Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.625rem',
                  fontStyle: 'italic'
                }}
              >
                {currentStatus.current_action}
              </Typography>
            </>
          )}
        </Box>

        {showTimer && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.625rem',
              fontWeight: 500
            }}
          >
            {loading && localLoadingElapsed >= 0 ? `${localLoadingElapsed.toFixed(1)} sec` : formatElapsedTime(elapsedTime)}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 0.5
      }}
    >
      <StatusDot statusType={finalDisplayStatus} />
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontSize: '0.875rem'
        }}
      >
        {displayText}
      </Typography>
      {showTimer && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem',
            opacity: 0.7,
            ml: 'auto'
          }}
        >
          • {loading && localLoadingElapsed >= 0 ? `${localLoadingElapsed.toFixed(1)} sec` : formatElapsedTime(elapsedTime)}
        </Typography>
      )}
    </Box>
  );
};

export default StatusActivityDisplay;