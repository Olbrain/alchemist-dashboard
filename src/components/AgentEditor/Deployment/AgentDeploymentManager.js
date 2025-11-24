/**
 * Agent Deployment Manager
 *
 * Component for managing agent deployments within the Agent Editor
 * Extracted from AgentProfile DeploymentHistoryTab for better UX and unified agent management
 */
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Skeleton,
  Link,
  LinearProgress
} from '@mui/material';
import {
  CloudQueue as CloudIcon,
  CheckCircle as CheckCircleIcon,
  Launch as LaunchIcon,
  Verified as VerifiedIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Build as BuildIcon
} from '@mui/icons-material';

// Import services
import {
  getResourceSummary,
  getTimingInfo,
  getCostInfo,
  getVerificationResults,
  getDockerImageInfo,
  getErrorDetails
} from '../../../services';

// Helper functions (extracted from AgentProfile.js)
const convertFirestoreTimestamp = (timestamp) => {
  if (!timestamp) return new Date();

  // Handle Firestore timestamp object
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  // Handle Firestore timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Handle ISO string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  // Fallback to current date
  return new Date();
};

const calculateDeploymentTime = (deployment) => {
  try {
    if (!deployment.created_at || !deployment.updated_at) {
      return null;
    }

    const createdAt = convertFirestoreTimestamp(deployment.created_at);
    const updatedAt = convertFirestoreTimestamp(deployment.updated_at);

    // Calculate duration in milliseconds
    const durationMs = updatedAt.getTime() - createdAt.getTime();

    // Handle invalid durations
    if (durationMs < 0) {
      return null;
    }

    // Convert to human-readable format
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    console.error('Error calculating deployment time:', error);
    return null;
  }
};


const AgentDeploymentManager = ({
  agentId,
  onNotification,
  disabled = false,
  onDeployAgent,
  deploymentHistory,
  activeDeployment, // The currently deploying item being tracked in real-time
  activeTab = 'status' // 'status' or 'history'
}) => {
  const [loading] = useState(false);

  // Use deployments from parent prop (deploymentHistory) instead of local state
  // Parent already has subscription, no need to duplicate
  const deployments = deploymentHistory || [];
  const loadingData = false; // Parent handles loading state

  // Check activeDeployment first (real-time tracked deployment), then fall back to latest from history
  // activeDeployment takes priority because it's updated in real-time via document listener
  const currentDeployment = activeDeployment || deployments[0];
  const isCurrentlyDeploying = currentDeployment &&
    ['queued', 'deploying'].includes(currentDeployment.status?.toLowerCase());

  // Debug logging for deployment data and button state
  console.log('🚀 [AgentDeploymentManager] Component rendered at', new Date().toISOString(), ':', {
    agentId,
    deployments_length: deployments?.length || 0,
    hasActiveDeployment: !!activeDeployment,
    currentDeployment: currentDeployment ? {
      id: currentDeployment.deployment_id?.slice(0, 8),
      status: currentDeployment.status,
      progress: currentDeployment.progress_percent,
      updated_at: currentDeployment.updated_at,
      source: activeDeployment ? 'active (real-time)' : 'history'
    } : null,
    isCurrentlyDeploying,
    buttonDisabled: loading || isCurrentlyDeploying || disabled || !onDeployAgent
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'deployed':
        return 'success';
      case 'pending':
      case 'deploying':
      case 'building':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status info with icon and color (matches MCP pattern)
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'deployed':
      case 'completed':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Deployed'
        };
      case 'failed':
      case 'error':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Failed'
        };
      case 'building':
      case 'deploying':
        return {
          color: 'info',
          icon: <BuildIcon />,
          label: 'In Progress'
        };
      case 'queued':
      case 'pending':
        return {
          color: 'warning',
          icon: <HourglassEmptyIcon />,
          label: 'Queued'
        };
      default:
        return {
          color: 'default',
          icon: <HourglassEmptyIcon />,
          label: status || 'Unknown'
        };
    }
  };

  return (
    <Box sx={{ height: '100%' }}>
      {/* STATUS TAB */}
      {activeTab === 'status' && (
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>

        {/* Agent Management Actions Bar */}
        <Box sx={{
          mb: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Deploy Agent
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Deploy your agent to make it available for use
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={(loading || isCurrentlyDeploying) ? <CircularProgress size={16} /> : <LaunchIcon />}
              onClick={onDeployAgent}
              color="primary"
              disabled={loading || isCurrentlyDeploying || disabled || !onDeployAgent}
              sx={{
                py: 1,
                px: 2.5,
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {(() => {
                if (loading || isCurrentlyDeploying) {
                  // Use currentDeployment (activeDeployment if available, otherwise latest from history)
                  const progress = currentDeployment?.progress_percent || 0;
                  console.log('🎯 [BUTTON] Current deployment progress at', new Date().toISOString(), ':', {
                    id: currentDeployment?.deployment_id?.slice(0, 8),
                    status: currentDeployment?.status,
                    progress: progress,
                    updated_at: currentDeployment?.updated_at,
                    source: activeDeployment ? 'active (real-time)' : 'history'
                  });
                  return `Deploying... ${progress}%`;
                }
                return 'Deploy Agent';
              })()}
            </Button>
          </Box>
        </Box>

        {/* Current Deployment Card */}
        <Card sx={{ height: 'fit-content' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 2 }}>
              <CloudIcon sx={{ mr: 1, fontSize: 20 }} />
              Current Deployment
            </Typography>



            {/* Last Deployment Details */}
            {(() => {
              // Find the last COMPLETED deployment (not in-progress)
              // This ensures we show historical deployment while new one is running
              const finalStatuses = ['completed', 'failed', 'cancelled'];
              const lastCompletedDeployment = deployments.find(d => {
                const status = d.status?.toLowerCase();
                return finalStatuses.includes(status);
              });

              return lastCompletedDeployment && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Last Deployment
                  </Typography>

                  {/* Service URL - Prominently displayed when available */}
                  {lastCompletedDeployment?.service_url && (
                    <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'success.50', borderRadius: 1, border: 1, borderColor: 'success.200' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', mb: 0.5 }}>
                        Service URL:
                      </Typography>
                      <Link
                        href={lastCompletedDeployment.service_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          color: (theme) => theme.palette.mode === 'dark' ? '#81c784' : '#4caf50',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {lastCompletedDeployment.service_url}
                        <LaunchIcon sx={{ fontSize: 14 }} />
                      </Link>
                    </Box>
                  )}

                  <Card variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Header with icon box */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 36,
                              height: 36,
                              borderRadius: 1,
                              bgcolor: `${getStatusInfo(lastCompletedDeployment.status).color}.lighter`,
                              color: `${getStatusInfo(lastCompletedDeployment.status).color}.main`
                            }}
                          >
                            {getStatusInfo(lastCompletedDeployment.status).icon}
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Version {deployments.length}
                              </Typography>
                              {deployments.some(d => d.status === 'completed' || d.status === 'deployed') && (
                                <Chip
                                  label="Current"
                                  color="primary"
                                  size="small"
                                  sx={{ height: 20 }}
                                />
                              )}
                              {(() => {
                                const verificationResults = getVerificationResults(lastCompletedDeployment);
                                return verificationResults?.health_check_passed && (
                                  <VerifiedIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                );
                              })()}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              ID: {lastCompletedDeployment.deployment_id?.slice(-12) || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={getStatusInfo(lastCompletedDeployment.status).label}
                            color={getStatusInfo(lastCompletedDeployment.status).color}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {new Date(lastCompletedDeployment.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Details with dividers */}
                      <Stack spacing={1.5} divider={<Divider />}>
                        {/* Duration */}
                        {(() => {
                          const timingInfo = getTimingInfo(lastCompletedDeployment);
                          const deploymentTime = timingInfo?.totalTime > 0
                            ? `${timingInfo.totalTime.toFixed(1)}s`
                            : calculateDeploymentTime(lastCompletedDeployment);

                          return deploymentTime && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Duration
                              </Typography>
                              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                                {deploymentTime}
                              </Typography>
                            </Box>
                          );
                        })()}

                        {/* Error Details */}
                        {(() => {
                          const errorDetails = getErrorDetails(lastCompletedDeployment);
                          return errorDetails && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Error Details
                              </Typography>
                              <Box sx={{ p: 1.5, bgcolor: 'error.lighter', borderRadius: 1 }}>
                                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {errorDetails.error_code || 'UNKNOWN_ERROR'}
                                </Typography>
                                <Typography variant="caption" color="error.dark" sx={{ display: 'block', mb: 0.5 }}>
                                  {errorDetails.error_message || 'No error message available'}
                                </Typography>
                                {errorDetails.suggested_fix && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Fix: {errorDetails.suggested_fix}
                                  </Typography>
                                )}
                              </Box>
                              {lastCompletedDeployment.status === 'failed' && (
                                <Button
                                  size="small"
                                  color="info"
                                  startIcon={<InfoIcon />}
                                  onClick={() => {
                                    onNotification({
                                      message: `Error: ${errorDetails.error_code} - ${errorDetails.error_message}`,
                                      severity: 'error',
                                      timestamp: Date.now()
                                    });
                                  }}
                                  sx={{ mt: 1 }}
                                >
                                  View Details
                                </Button>
                              )}
                            </Box>
                          );
                        })()}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              );
            })()}


            {/* No Deployments State */}
            {deployments.length === 0 && !loadingData && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CloudIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                  No Deployments Yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deploy this agent to see current deployment status
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        </Box>
        </Box>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              New versions are created automatically when you change agent configuration and redeploy.
            </Typography>
          </Alert>

          {/* Deployment History Cards */}
          {loadingData ? (
            <Box sx={{ py: 4 }}>
              {[...Array(3)].map((_, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width={120} />
                      <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Skeleton variant="text" width={200} />
                    <Skeleton variant="text" width={150} />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : deployments.length > 0 ? (
            <Stack spacing={2}>
              {deployments.map((deployment, index) => {
                const statusInfo = getStatusInfo(deployment.status);
                const isInProgress = ['building', 'deploying', 'in_progress', 'queued'].includes(
                  deployment.status?.toLowerCase()
                );

                return (
                  <Card key={deployment.deployment_id} variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 36,
                              height: 36,
                              borderRadius: 1,
                              bgcolor: `${statusInfo.color}.lighter`,
                              color: `${statusInfo.color}.main`
                            }}
                          >
                            {statusInfo.icon}
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Version {deployments.length - index}
                              </Typography>
                              {index === 0 && deployment.status === 'completed' && (
                                <Chip
                                  label="Current"
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {(() => {
                                const verificationResults = getVerificationResults(deployment);
                                return verificationResults?.health_check_passed && (
                                  <VerifiedIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                );
                              })()}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              ID: {deployment.deployment_id?.slice(-12) || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                            sx={{ textTransform: 'capitalize', mb: 0.5 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {new Date(deployment.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress Bar for In-Progress Deployments */}
                      {isInProgress && (
                        <Box sx={{ mb: 2 }}>
                          <LinearProgress />
                        </Box>
                      )}

                      {/* Deployment Details */}
                      <Stack spacing={1.5} divider={<Divider />}>
                        {/* Service URL */}
                        {deployment.service_url && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              Service URL
                            </Typography>
                            <Link
                              href={deployment.service_url}
                              target="_blank"
                              rel="noopener"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                bgcolor: 'success.lighter',
                                px: 1,
                                py: 0.5,
                                borderRadius: 0.5,
                                textDecoration: 'none',
                                '&:hover': { bgcolor: 'success.light' }
                              }}
                            >
                              {deployment.service_url}
                              <LaunchIcon sx={{ fontSize: 12 }} />
                            </Link>
                          </Box>
                        )}

                        {/* Metadata */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Details
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                <strong>Region:</strong> {deployment.environment?.gcp_region || deployment.region || 'us-central1'}
                              </Typography>
                            </Grid>
                            {(() => {
                              const resourceSummary = getResourceSummary(deployment);
                              return resourceSummary && (resourceSummary.knowledgeFiles > 0 || resourceSummary.mcpTools > 0) && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    <strong>Resources:</strong> {resourceSummary.knowledgeFiles} files, {resourceSummary.mcpTools} tools
                                  </Typography>
                                </Grid>
                              );
                            })()}
                            {(() => {
                              const costInfo = getCostInfo(deployment);
                              return costInfo?.estimatedMonthlyCost > 0 && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    <strong>Est. Cost:</strong> ${costInfo.estimatedMonthlyCost.toFixed(2)}/mo
                                  </Typography>
                                </Grid>
                              );
                            })()}
                            {(() => {
                              const dockerInfo = getDockerImageInfo(deployment);
                              return dockerInfo?.image_size_mb > 0 && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    <strong>Image Size:</strong> {dockerInfo.image_size_mb}MB
                                  </Typography>
                                </Grid>
                              );
                            })()}
                            {(() => {
                              const timingInfo = getTimingInfo(deployment);
                              const deploymentTime = timingInfo?.totalTime > 0
                                ? `${timingInfo.totalTime.toFixed(1)}s`
                                : calculateDeploymentTime(deployment);
                              return deploymentTime && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    <strong>Duration:</strong> {deploymentTime}
                                  </Typography>
                                </Grid>
                              );
                            })()}
                          </Grid>
                        </Box>

                        {/* Verification Status */}
                        {(() => {
                          const verificationResults = getVerificationResults(deployment);
                          return verificationResults && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Verification
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <Typography variant="caption" color={verificationResults.health_check_passed ? 'success.main' : 'error.main'}>
                                  Health: {verificationResults.health_check_passed ? '✓ Passed' : '✗ Failed'}
                                </Typography>
                                <Typography variant="caption" color={verificationResults.config_validation_passed ? 'success.main' : 'error.main'}>
                                  Config: {verificationResults.config_validation_passed ? '✓ Valid' : '✗ Invalid'}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })()}

                        {/* Error Details */}
                        {(() => {
                          const errorDetails = getErrorDetails(deployment);
                          return errorDetails && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Error Details
                              </Typography>
                              <Alert severity="error" sx={{ py: 0.5 }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium' }}>
                                  {errorDetails.error_code || 'UNKNOWN_ERROR'}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                  {errorDetails.error_message || 'No error message available'}
                                </Typography>
                                {errorDetails.suggested_fix && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                    Fix: {errorDetails.suggested_fix}
                                  </Typography>
                                )}
                              </Alert>
                            </Box>
                          );
                        })()}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CloudIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Updates Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Deploy this agent to start tracking version updates
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AgentDeploymentManager;