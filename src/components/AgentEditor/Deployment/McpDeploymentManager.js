/**
 * MCP Deployment Manager Component
 *
 * Main content area for MCP deployment management.
 * Displays current deployment status and enabled MCP servers.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,

  LinearProgress
} from '@mui/material';
import {
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import McpServerCard from './McpServerCard';
import McpToolsSection from './McpToolsSection';
import {
  getMcpServiceInfo,
  getEnabledMcpToolsWithFullDetails,
  checkToolConfigurationStatus,
  subscribeToMcpServiceStatus,
  subscribeToMcpDeployments,
  formatTimeAgo,
  deployMcpService
} from '../../../services/mcpDeployment/mcpDeploymentService';

const McpDeploymentManager = ({ agentId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceInfo, setServiceInfo] = useState({
    serviceUrl: null,
    updatedAt: null,
    status: null,
    isDeployed: false
  });
  const [enabledServers, setEnabledServers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [latestDeployment, setLatestDeployment] = useState(null);

  // Load initial data
  useEffect(() => {
    if (!agentId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load service info and enabled servers in parallel
        const [serviceData, serversData] = await Promise.all([
          getMcpServiceInfo(agentId),
          getEnabledMcpToolsWithFullDetails(agentId)
        ]);

        setServiceInfo(serviceData);
        setEnabledServers(serversData);
      } catch (err) {
        console.error('Error loading MCP deployment data:', err);
        setError(err.message || 'Failed to load deployment information');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [agentId]);

  // Subscribe to real-time service status updates
  useEffect(() => {
    if (!agentId) return;

    const unsubscribe = subscribeToMcpServiceStatus(
      agentId,
      (updatedInfo) => {
        setServiceInfo(updatedInfo);
      },
      (err) => {
        console.error('Error in MCP service status subscription:', err);
        setError(err.message || 'Failed to subscribe to status updates');
      }
    );

    return () => unsubscribe();
  }, [agentId]);

  // Subscribe to deployment updates to track latest deployment progress
  useEffect(() => {
    if (!agentId) return;

    const unsubscribe = subscribeToMcpDeployments(
      agentId,
      (deployments) => {
        // Get the latest deployment (first in the array since ordered by created_at desc)
        if (deployments.length > 0) {
          const latest = deployments[0];
          setLatestDeployment(latest);

          // Auto-hide deployment success message after deployment completes
          if (latest.status === 'deployed' && deploymentSuccess) {
            setTimeout(() => {
              setDeploymentSuccess(false);
            }, 5000);
          }
        } else {
          setLatestDeployment(null);
        }
      },
      (err) => {
        console.error('Error in MCP deployments subscription:', err);
      }
    );

    return () => unsubscribe();
  }, [agentId, deploymentSuccess]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [serviceData, serversData] = await Promise.all([
        getMcpServiceInfo(agentId),
        getEnabledMcpToolsWithFullDetails(agentId)
      ]);

      setServiceInfo(serviceData);
      setEnabledServers(serversData);
    } catch (err) {
      console.error('Error refreshing MCP deployment data:', err);
      setError(err.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle MCP deployment
  const handleDeploy = async () => {
    try {
      setDeploying(true);
      setError(null);
      setDeploymentSuccess(false);

      console.log('🚀 Starting MCP deployment for agent:', agentId);
      const result = await deployMcpService(agentId);

      console.log('✅ MCP deployment initiated:', result);
      setDeploymentSuccess(true);

      // Refresh data to show deployment status
      setTimeout(() => {
        handleRefresh();
      }, 1000);
    } catch (err) {
      console.error('❌ MCP deployment failed:', err);
      setError(err.message || 'Failed to deploy MCP service');
    } finally {
      setDeploying(false);
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            MCP Service Deployment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deploy and manage your agent's Model Context Protocol server
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleDeploy}
            disabled={deploying || enabledServers.length === 0}
            startIcon={deploying && <CircularProgress size={16} />}
          >
            {deploying ? 'Deploying...' : serviceInfo.isDeployed ? 'Redeploy' : 'Deploy'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Current Deployment Status Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {serviceInfo.isDeployed ? (
                  <CloudDoneIcon sx={{ color: 'success.main', fontSize: 28 }} />
                ) : (
                  <CloudOffIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
                )}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {serviceInfo.isDeployed ? 'Service Deployed' : 'Not Deployed'}
                </Typography>
              </Box>

              {serviceInfo.isDeployed ? (
                <>
                  {/* Service URL */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Service URL
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          bgcolor: 'background.default',
                          px: 1,
                          py: 0.5,
                          borderRadius: 0.5,
                          wordBreak: 'break-all'
                        }}
                      >
                        {serviceInfo.serviceUrl}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Last Updated */}
                  {serviceInfo.updatedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {formatTimeAgo(serviceInfo.updatedAt)}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No MCP service has been deployed for this agent yet.
                </Typography>
              )}
            </Box>

            {/* Status Chip */}
            <Chip
              label={serviceInfo.status || 'unknown'}
              size="small"
              color={serviceInfo.isDeployed ? 'success' : 'default'}
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Latest Deployment Progress */}
      {latestDeployment && ['queued', 'building', 'deploying', 'in_progress'].includes(latestDeployment.status?.toLowerCase()) && (
        <Card variant="outlined" sx={{ mb: 3, borderColor: 'info.main', bgcolor: 'info.lighter' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {latestDeployment.status?.toLowerCase() === 'queued' ? (
                  <HourglassEmptyIcon sx={{ color: 'warning.main', fontSize: 24 }} />
                ) : (
                  <BuildIcon sx={{ color: 'info.main', fontSize: 24 }} />
                )}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Deployment in Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {latestDeployment.deployment_stage || latestDeployment.status}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={latestDeployment.status}
                color="info"
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Started {formatTimeAgo(latestDeployment.created_at)}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Enabled MCP Servers */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Enabled MCP Servers ({enabledServers.length})
        </Typography>

        {enabledServers.length === 0 ? (
          <Alert severity="info" icon={false}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              No MCP servers enabled
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Enable MCP servers in the Tools section to deploy them with your agent.
            </Typography>
          </Alert>
        ) : (
          <Box>
            {enabledServers.map((server) => (
              <McpServerCard
                key={server.id}
                serverName={server.serverName}
                serverId={server.serverId}
                configurationStatus={checkToolConfigurationStatus(server)}
                serverCategory={server.serverCategory}
                serverTags={server.serverTags}
                estimatedToolsCount={server.estimatedToolsCount}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* All Available Tools Section */}
      <McpToolsSection servers={enabledServers} />

      {/* Deployment Success Alert */}
      {deploymentSuccess && (
        <Alert severity="success" sx={{ mt: 3 }}>
          MCP deployment initiated successfully! The service will be available shortly.
        </Alert>
      )}
    </Box>
  );
};

export default McpDeploymentManager;
