/**
 * MCP Deployment History Component
 *
 * Displays real-time deployment history from mcp_deployments collection
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Build as BuildIcon,
  CloudDone as CloudDoneIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import {
  subscribeToMcpDeployments,
  formatTimeAgo
} from '../../../services/mcpDeployment/mcpDeploymentService';

const McpDeploymentHistory = ({ agentId }) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to deployment updates
  useEffect(() => {
    if (!agentId) return;

    setLoading(true);
    const unsubscribe = subscribeToMcpDeployments(
      agentId,
      (updatedDeployments) => {
        setDeployments(updatedDeployments);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in deployment subscription:', err);
        setError(err.message || 'Failed to load deployment history');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [agentId]);

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'deployed':
      case 'completed':
      case 'success':
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
      case 'in_progress':
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (deployments.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" icon={false}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            No deployment history
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Deploy your MCP service to see deployment history here.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Deployment History
      </Typography>

      <Stack spacing={2}>
        {deployments.map((deployment) => {
          const statusInfo = getStatusInfo(deployment.status);
          const isInProgress = ['building', 'deploying', 'in_progress'].includes(
            deployment.status?.toLowerCase()
          );

          return (
            <Card key={deployment.id} variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Deployment #{deployment.id?.slice(-8)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(deployment.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={statusInfo.label}
                    color={statusInfo.color}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LinkIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: 'background.default',
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            wordBreak: 'break-all'
                          }}
                        >
                          {deployment.service_url}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Deployment Stage */}
                  {deployment.deployment_stage && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Stage
                      </Typography>
                      <Chip
                        label={deployment.deployment_stage}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  )}

                  {/* Error Message */}
                  {deployment.error_message && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Error Details
                      </Typography>
                      <Alert severity="error" sx={{ py: 0.5 }}>
                        <Typography variant="caption">{deployment.error_message}</Typography>
                      </Alert>
                    </Box>
                  )}

                  {/* Enabled Servers Count */}
                  {deployment.enabled_servers_count !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudDoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {deployment.enabled_servers_count} MCP server{deployment.enabled_servers_count !== 1 ? 's' : ''} enabled
                      </Typography>
                    </Box>
                  )}

                  {/* Timestamps */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {deployment.created_at && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Created
                        </Typography>
                        <Typography variant="caption">
                          {formatTimeAgo(deployment.created_at)}
                        </Typography>
                      </Box>
                    )}
                    {deployment.updated_at && deployment.updated_at !== deployment.created_at && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Updated
                        </Typography>
                        <Typography variant="caption">
                          {formatTimeAgo(deployment.updated_at)}
                        </Typography>
                      </Box>
                    )}
                    {deployment.deployed_at && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Deployed
                        </Typography>
                        <Typography variant="caption">
                          {formatTimeAgo(deployment.deployed_at)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default McpDeploymentHistory;
