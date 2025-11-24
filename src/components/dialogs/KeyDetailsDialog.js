/**
 * API Key Details Dialog Component
 *
 * Dialog for displaying API key details with usage analytics and management actions
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  VpnKey as VpnKeyIcon,
  TrendingUp as TrendingUpIcon,
  Token as TokenIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Block as RevokeIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { MetricValue } from '../../utils/typography';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import apiKeyService from '../../services/apiKeys/apiKeyService';
import { formatDistanceToNow } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const KeyDetailsDialog = ({
  open,
  onClose,
  apiKey,
  onKeyAction
}) => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const loadUsageData = React.useCallback(async () => {
    if (!apiKey?.agent_id) {
      setError('No agent ID found for this API key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Read usage from the nested usage object in the API key document
      const usage = apiKey.usage || {};
      const totalMessages = usage.total_messages || 0;
      const totalTokens = usage.total_tokens || 0;
      const firstUsed = usage.first_used;
      const lastUsed = usage.last_used || apiKey.last_used;

      // Try to load daily breakdown from agent_usage collection (optional)
      let dailyUsage = [];
      let topEndpoints = [];

      try {
        const result = await apiKeyService.getApiKeyUsageStatistics(apiKey.agent_id, apiKey.id);
        if (result.success && result.stats) {
          dailyUsage = result.stats.dailyUsage || [];
          topEndpoints = result.stats.apiKeyBreakdown || [];
        }
      } catch (err) {
        console.log('Could not load detailed usage breakdown:', err);
        // Continue with basic usage data
      }

      const usageData = {
        dailyUsage,
        totalCalls: totalMessages,
        totalTokens,
        averageCallsPerDay: dailyUsage.length > 0 ?
          Math.round(totalMessages / dailyUsage.length) : 0,
        firstUsed,
        lastUsed,
        topEndpoints
      };

      setUsageData(usageData);
    } catch (error) {
      console.error('Error loading usage data:', error);
      setError('Failed to load usage statistics');

      // Fallback to basic API key info
      const usage = apiKey.usage || {};
      const fallbackData = {
        dailyUsage: [],
        totalCalls: usage.total_messages || 0,
        totalTokens: usage.total_tokens || 0,
        averageCallsPerDay: 0,
        firstUsed: usage.first_used,
        lastUsed: usage.last_used || apiKey.last_used,
        topEndpoints: []
      };
      setUsageData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (open && apiKey) {
      loadUsageData();
    }
  }, [open, apiKey, loadUsageData]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleKeyAction = async (action) => {
    handleMenuClose();
    if (onKeyAction) {
      await onKeyAction(apiKey.id, action);
      if (action !== 'delete') {
        loadUsageData(); // Refresh data after action
      }
    }
  };

  const handleCopyKeyPrefix = async () => {
    if (apiKey?.key_prefix) {
      try {
        await navigator.clipboard.writeText(apiKey.key_prefix);
      } catch (error) {
        console.error('Failed to copy key prefix:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };


  const renderUsageChart = () => {
    if (!usageData?.dailyUsage) return null;

    const chartData = {
      labels: usageData.dailyUsage.map(item =>
        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'API Calls',
          data: usageData.dailyUsage.map(item => item.calls),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Tokens Used',
          data: usageData.dailyUsage.map(item => item.tokens),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1'
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: 'Daily Usage Statistics'
        },
        legend: {
          position: 'top'
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'API Calls'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Tokens'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ height: 300 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!apiKey) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VpnKeyIcon />
            <Typography variant="h6" component="span">
              API Key Details
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={loadUsageData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Key Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Key Name
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {apiKey.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={apiKey.status?.toUpperCase() || 'UNKNOWN'}
                  color={getStatusColor(apiKey.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Key Prefix
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontFamily="monospace">
                    {apiKey.key_prefix}...
                  </Typography>
                  <IconButton size="small" onClick={handleCopyKeyPrefix}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body1">
                  {apiKey.created_at ? formatDistanceToNow(apiKey.created_at, { addSuffix: true }) : 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  First Used
                </Typography>
                <Typography variant="body1">
                  {(() => {
                    if (!usageData?.firstUsed) return 'Never';
                    try {
                      const date = usageData.firstUsed.toDate ? usageData.firstUsed.toDate() : new Date(usageData.firstUsed);
                      return formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return 'Never';
                    }
                  })()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Used
                </Typography>
                <Typography variant="body1">
                  {(() => {
                    if (!usageData?.lastUsed) return 'Never';
                    try {
                      const date = usageData.lastUsed.toDate ? usageData.lastUsed.toDate() : new Date(usageData.lastUsed);
                      return formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return 'Never';
                    }
                  })()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created By
                </Typography>
                <Typography variant="body1">
                  {apiKey.created_by_name || 'Unknown'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : usageData && (
          <>
            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Calls
                      </Typography>
                    </Box>
                    <MetricValue fontWeight="700">
                      {usageData.totalCalls.toLocaleString()}
                    </MetricValue>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TokenIcon sx={{ color: 'secondary.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Tokens
                      </Typography>
                    </Box>
                    <MetricValue fontWeight="700">
                      {usageData.totalTokens.toLocaleString()}
                    </MetricValue>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ScheduleIcon sx={{ color: 'success.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Avg Calls/Day
                      </Typography>
                    </Box>
                    <MetricValue fontWeight="700">
                      {usageData.averageCallsPerDay}
                    </MetricValue>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Usage Chart */}
            {renderUsageChart()}

            {/* Top Endpoints */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Endpoints
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usageData.topEndpoints?.map((endpoint, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            <Typography variant="body2" fontFamily="monospace">
                              {endpoint.endpoint}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {endpoint.calls.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {endpoint.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleKeyAction('regenerate')}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Regenerate Key</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleKeyAction('revoke')}>
          <ListItemIcon>
            <RevokeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Revoke Key</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleKeyAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Key</ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default KeyDetailsDialog;