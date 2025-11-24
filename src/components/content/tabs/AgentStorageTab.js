/**
 * Agent Storage Tab Component
 *
 * Displays storage usage and management for individual agents
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  LinearProgress,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  Storage as StorageIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  AttachFile as FileIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

import {
  getStorageStats,
  listenToStorageChanges,
  formatStorageSize,
  calculateRemainingStorage,
  isStorageInWarning,
  isStorageNearlyFull
} from '../../../services/storage/agentStorageService';

const AgentStorageTab = ({ agentId }) => {
  const theme = useTheme();
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStorageData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStorageStats(agentId);
      setStorageData(data);
    } catch (err) {
      console.error('Error loading storage data:', err);
      setError('Failed to load storage information');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Load storage data on mount
  useEffect(() => {
    if (!agentId) return;

    loadStorageData();

    // Set up real-time listener
    const unsubscribe = listenToStorageChanges(agentId, (updatedData) => {
      setStorageData(updatedData);
    });

    return () => unsubscribe();
  }, [agentId, loadStorageData]);

  const getStorageColor = () => {
    if (!storageData) return theme.palette.primary.main;

    if (isStorageNearlyFull(storageData)) return theme.palette.error.main;
    if (isStorageInWarning(storageData)) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getStorageIcon = () => {
    if (!storageData) return <CheckCircleIcon />;

    if (isStorageNearlyFull(storageData)) return <ErrorIcon color="error" />;
    if (isStorageInWarning(storageData)) return <WarningIcon color="warning" />;
    return <CheckCircleIcon color="success" />;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';

    const now = new Date();
    let time;

    // Handle Firestore timestamp objects
    if (timestamp.seconds) {
      // Firestore Timestamp object
      time = new Date(timestamp.seconds * 1000);
    } else if (timestamp._seconds) {
      // Alternative Firestore timestamp format
      time = new Date(timestamp._seconds * 1000);
    } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp with toDate() method
      time = timestamp.toDate();
    } else if (typeof timestamp === 'string' || timestamp instanceof Date) {
      // Regular date string or Date object
      time = new Date(timestamp);
    } else {
      // Unknown format
      console.warn('Unknown timestamp format:', timestamp);
      return 'Unknown';
    }

    // Check if the date is valid
    if (isNaN(time.getTime())) {
      console.warn('Invalid date from timestamp:', timestamp);
      return 'Invalid date';
    }

    const diffMs = now - time;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const getFileIcon = (filename, contentType = '') => {
    const name = filename?.toLowerCase() || '';
    const type = contentType?.toLowerCase() || '';

    if (name.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/) || type.startsWith('image/')) {
      return <ImageIcon color="primary" />;
    }
    if (name.match(/\.(pdf|doc|docx|txt|md)$/) || type.includes('document') || type.includes('text')) {
      return <DocumentIcon color="secondary" />;
    }
    return <FileIcon color="action" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!storageData) {
    return (
      <Alert severity="info">
        No storage data available for this agent.
      </Alert>
    );
  }

  const usagePercentage = storageData.usage_percentage || 0;
  const remainingStorage = calculateRemainingStorage(storageData);

  return (
    <Box>
      {/* Compact Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" fontWeight="600">
          Storage Management
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Combined Storage Overview - Full Width */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              {/* Left: Storage Usage Bar */}
              <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1" fontWeight="500">
                    Storage Usage
                  </Typography>
                  <Box sx={{ ml: 1 }}>{getStorageIcon()}</Box>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={usagePercentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(getStorageColor(), 0.15),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStorageColor(),
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: getStorageColor(), fontWeight: 500 }}>
                    {formatStorageSize(storageData.usage.total_mb)} / {formatStorageSize(storageData.quota.total_mb)} ({usagePercentage.toFixed(1)}%)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatStorageSize(remainingStorage)} available
                  </Typography>
                </Box>
              </Box>

              {/* Right: Quick Stats */}
              <Box sx={{ display: 'flex', gap: 2.5 }}>
                <Box sx={{ textAlign: 'center', minWidth: 50 }}>
                  <Typography variant="body1" fontWeight="500">
                    {storageData.usage.file_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                    Files
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                  <Typography variant="body1" fontWeight="500">
                    {formatStorageSize(storageData.statistics.average_file_size_mb)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                    Avg Size
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="body2" fontWeight="500">
                    {formatTimeAgo(storageData.statistics.last_upload)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                    Last Upload
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Storage Warnings */}
            {isStorageNearlyFull(storageData) && (
              <Alert severity="error" sx={{ mt: 2 }} variant="outlined">
                <Typography variant="body2">Storage nearly full! Consider removing unused files.</Typography>
              </Alert>
            )}
            {isStorageInWarning(storageData) && !isStorageNearlyFull(storageData) && (
              <Alert severity="warning" sx={{ mt: 2 }} variant="outlined">
                <Typography variant="body2">Storage usage is high. Monitor file uploads carefully.</Typography>
              </Alert>
            )}
          </Card>
        </Grid>

        {/* File Type Breakdown - Compact Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight="500" sx={{ mb: 2 }}>
              File Type Breakdown
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: 0, py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ImageIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">Images</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ border: 0, py: 1 }}>
                      <Typography variant="body2">{storageData.breakdown.images.count}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ border: 0, py: 1 }}>
                      <Typography variant="body2">{formatStorageSize(storageData.breakdown.images.size_mb)}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 0, py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DocumentIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />
                        <Typography variant="body2">Documents</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ border: 0, py: 1 }}>
                      <Typography variant="body2">{storageData.breakdown.documents.count}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ border: 0, py: 1 }}>
                      <Typography variant="body2">{formatStorageSize(storageData.breakdown.documents.size_mb)}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 0, py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FileIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">Others</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ border: 0, py: 1 }}>
                      <Typography variant="body2">{storageData.breakdown.others.count}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ border: 0, py: 1 }}>
                      <Typography variant="body2">{formatStorageSize(storageData.breakdown.others.size_mb)}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Storage Configuration - Compact */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight="500" sx={{ mb: 2 }}>
              Storage Configuration
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Storage Tier
              </Typography>
              <Chip
                label={storageData.quota.tier}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Recent Attachments */}
        {storageData.recent_attachments && storageData.recent_attachments.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body1" fontWeight="500" sx={{ mb: 2 }}>
                Recent Attachments
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1 }}>File</TableCell>
                      <TableCell sx={{ py: 1 }}>Type</TableCell>
                      <TableCell sx={{ py: 1 }}>Size</TableCell>
                      <TableCell sx={{ py: 1 }}>Uploaded</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {storageData.recent_attachments.slice(0, 5).map((file, index) => (
                      <TableRow key={file.id || file.attachment_id || index} hover>
                        <TableCell sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getFileIcon(file.name, file.type)}
                            <Typography variant="body2" sx={{ ml: 1, fontSize: '0.875rem' }}>
                              {file.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {file.source || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="body2" fontSize="0.875rem">
                            {formatStorageSize(file.size_mb)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(file.uploaded_at)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {storageData.recent_attachments.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Showing 5 of {storageData.recent_attachments.length} files
                </Typography>
              )}
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AgentStorageTab;