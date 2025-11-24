/**
 * Usage Analytics Content Component
 *
 * Comprehensive usage analytics dashboard consolidating all usage data
 * across organization, project, agent, and session levels
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Assignment as ProjectIcon,
  SmartToy as AgentIcon,
  Chat as MessageIcon,
  Token as TokenIcon,
  People as SessionIcon,
  AttachMoney as CostIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import { usageService } from '../../services/usage/usageService';
import { UsageMetricsCard, UsageChart, UsageTable } from '../analytics';

const UsageAnalyticsContent = () => {
  const { currentUser, currentProject } = useAuth();

  // State management
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('total_tokens');

  // Data state
  const [projectData, setProjectData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [topAgents, setTopAgents] = useState([]);

  const loadAvailableMonths = React.useCallback(async () => {
    try {
      // Generate months for the current project
      const months = await usageService.generateAvailableMonthsForProject(currentProject);
      setAvailableMonths(months);

      // Auto-select the most recent month (first in the list)
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0].value);
      }
    } catch (err) {
      console.error('Error loading available months:', err);
    }
  }, [currentProject, selectedMonth]);

  const loadAnalyticsData = React.useCallback(async (isInitial = false) => {
    if (!currentProject) return;

    try {
      setInitialLoading(true); // Always show loading indicator
      setError(null);

      console.log('🔍 Loading analytics for month:', selectedMonth, 'project:', currentProject);

      // Load current project's monthly data
      const projectMonthlyData = await usageService.getProjectUsageByMonth(currentProject, selectedMonth);

      // Load top agents data
      const agentsData = await usageService.getProjectAgentsUsageByMonth(currentProject, selectedMonth);

      console.log('✅ Data loaded:', {
        projectData: projectMonthlyData.monthlyMetrics,
        trendsCount: projectMonthlyData.trendData?.daily?.length,
        agentsCount: agentsData?.length
      });

      setProjectData(projectMonthlyData.monthlyMetrics);
      setTrendData(projectMonthlyData.trendData);
      setTopAgents(agentsData || []);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, [currentProject, selectedMonth]);

  // Load available months when user logs in
  useEffect(() => {
    if (currentUser && currentProject) {
      loadAvailableMonths();
    }
  }, [currentUser, currentProject, loadAvailableMonths]);

  // Load analytics when month or current project changes
  useEffect(() => {
    console.log('📅 Month/Project changed:', { currentProject, selectedMonth });
    if (currentUser && currentProject && selectedMonth) {
      loadAnalyticsData(false);
    }
  }, [currentUser, currentProject, selectedMonth, loadAnalyticsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData(false);
    setRefreshing(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `usage-analytics-project-${currentProject}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMetrics = () => {
    if (!projectData) return [];

    return [
      {
        title: 'Active Agents',
        value: projectData.total_agents || 0,
        icon: AgentIcon
      },
      {
        title: 'Sessions',
        value: projectData.total_sessions || 0,
        icon: SessionIcon
      },
      {
        title: 'Messages',
        value: projectData.total_messages || 0,
        icon: MessageIcon
      },
      {
        title: 'Total Tokens',
        value: projectData.total_tokens || 0,
        icon: TokenIcon
      },
      {
        title: 'Cost',
        value: `$${(projectData.cost || 0).toFixed(4)}`,
        icon: CostIcon
      }
    ];
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="body1" color="text.secondary" fontWeight="500">
          Loading usage analytics...
        </Typography>
      </Box>
    );
  }

  // Show "Select a project" message if no project is selected
  if (!currentProject) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <ProjectIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 1 }}>
              No Project Selected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Please select a project from the AppBar to view its usage analytics.
            </Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content Card */}
      <Card sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="body1" fontWeight="700" gutterBottom>
                Project Usage Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Analytics for the currently selected project
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                  disabled={availableMonths.length === 0}
                >
                  {availableMonths.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
              >
                Refresh
              </Button>

              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                size="small"
                disabled={!projectData}
              >
                Export
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, pt: 2, position: 'relative' }}>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Metrics Cards */}
          {getMetrics().length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {getMetrics().map((metric, index) => (
                <Grid item xs={12} sm={6} md={3} lg={12 / getMetrics().length} key={index}>
                  <UsageMetricsCard
                    title={metric.title}
                    value={typeof metric.value === 'string' ? metric.value : formatNumber(metric.value)}
                    icon={metric.icon}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Usage Trends Chart */}
          {trendData && trendData.daily && trendData.daily.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <UsageChart
                  title="Usage Trends"
                  data={trendData.daily}
                  type="line"
                  metric={selectedMetric}
                  showMetricSelector={true}
                  onMetricChange={setSelectedMetric}
                  showPeriodSelector={false}
                  height={350}
                />
              </CardContent>
            </Card>
          )}

          {/* Top Agents by Usage */}
          {topAgents && topAgents.length > 0 && (
            <UsageTable
              title="Top Agents by Usage"
              data={topAgents}
              type="agents"
              columns={['name', 'sessions', 'messages', 'tokens', 'cost']}
              maxRows={8}
            />
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default UsageAnalyticsContent;