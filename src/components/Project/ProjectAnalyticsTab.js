/**
 * Project Analytics Tab Component
 *
 * Displays comprehensive usage analytics at the project level
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Timeline as TimelineIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  AttachMoney as CostIcon,
  People as SessionIcon
} from '@mui/icons-material';

import { UsageMetricsCard, UsageChart, UsageTable } from '../analytics';
import { usageService } from '../../services/usage/usageService';
import { useDataCache } from '../../contexts/DataCacheContext';

const ProjectAnalyticsTab = ({ projectId }) => {
  const { getAgentName } = useDataCache();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('messages');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);

  const [analyticsData, setAnalyticsData] = useState({
    project: null,
    topAgents: [],
    trends: []
  });

  const projId = projectId;

  const loadAvailableMonths = React.useCallback(async () => {
    if (!projId) return;

    try {
      const months = await usageService.generateAvailableMonthsForProject(projId);
      setAvailableMonths(months);

      // Auto-select the most recent month if none selected
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0].value);
      }
    } catch (error) {
      console.error('Error loading available months:', error);
      setAvailableMonths([]);
    }
  }, [projId, selectedMonth]);

  const loadAnalyticsData = React.useCallback(async () => {
    if (!projId || !selectedMonth) return;

    try {
      setLoading(true);
      setError(null);

      // Project analytics
      const [monthlyData, topAgents] = await Promise.all([
        usageService.getProjectUsageByMonth(projId, selectedMonth),
        usageService.getProjectAgentsUsageByMonth(projId, selectedMonth)
      ]);

      console.log('=== Project Analytics Data Received ===');
      console.log('Monthly Data:', monthlyData);
      console.log('Monthly Metrics:', monthlyData.monthlyMetrics);
      console.log('Top Agents:', topAgents?.length || 0);
      console.log('Trend Data Points:', monthlyData.trendData?.daily?.length || 0);

      // Enrich agent names using DataCache
      const enrichedAgents = await Promise.all(
        (topAgents || []).map(async (agent) => {
          const realAgentName = await getAgentName(agent.agent_id);
          return {
            ...agent,
            name: realAgentName,
            agent_name: realAgentName
          };
        })
      );

      console.log('✅ Enriched agents with real names:', enrichedAgents);

      setAnalyticsData({
        project: {
          total_tokens: monthlyData.monthlyMetrics?.total_tokens || 0,
          total_messages: monthlyData.monthlyMetrics?.total_messages || 0,
          total_sessions: monthlyData.monthlyMetrics?.total_sessions || 0,
          total_cost: monthlyData.monthlyMetrics?.cost || 0
        },
        topAgents: enrichedAgents,
        trends: monthlyData.trendData?.daily || []
      });

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projId, selectedMonth, getAgentName]);

  // Load available months when project changes
  useEffect(() => {
    if (projId) {
      loadAvailableMonths();
    }
  }, [projId, loadAvailableMonths]);

  // Load analytics when project or selected month changes
  useEffect(() => {
    if (projId && selectedMonth) {
      loadAnalyticsData();
    }
  }, [projId, selectedMonth, loadAnalyticsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const exportData = () => {
    try {
      // Create CSV data
      const csvData = [];

      // Headers
      csvData.push([
        'Type',
        'Name',
        'ID',
        'Total Tokens',
        'Total Messages',
        'Total Sessions'
      ]);

      // Project data
      if (analyticsData.project) {
        csvData.push([
          'Project',
          'Project Analytics',
          projId,
          analyticsData.project.total_tokens || 0,
          analyticsData.project.total_messages || 0,
          analyticsData.project.total_sessions || 0
        ]);
      }

      // Convert to CSV string
      const csvContent = csvData.map(row =>
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `project-analytics-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const { project, topAgents, trends } = analyticsData;

  // Debug: Log what we have at render time
  console.log('=== Render Time Check ===');
  console.log('project object:', project);
  console.log('project?.total_tokens:', project?.total_tokens);
  console.log('project?.total_messages:', project?.total_messages);
  console.log('project?.total_sessions:', project?.total_sessions);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="body1" fontWeight="600" gutterBottom>
            Usage Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly usage metrics for this project
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={exportData}
            size="small"
          >
            Export
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <UsageMetricsCard
            title="Total Sessions"
            value={project?.total_sessions || 0}
            formattedValue={usageService.formatNumber(project?.total_sessions || 0)}
            icon={SessionIcon}
            color="primary"
            subtitle="User interactions"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <UsageMetricsCard
            title="Total Messages"
            value={project?.total_messages || 0}
            formattedValue={usageService.formatNumber(project?.total_messages || 0)}
            icon={TimelineIcon}
            color="success"
            subtitle="Conversations processed"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <UsageMetricsCard
            title="Total Tokens"
            value={project?.total_tokens || 0}
            formattedValue={usageService.formatNumber(project?.total_tokens || 0)}
            icon={TrendingIcon}
            color="info"
            subtitle="Monthly usage"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <UsageMetricsCard
            title="Monthly Cost"
            value={project?.total_cost || 0}
            formattedValue={`$${(project?.total_cost || 0).toFixed(2)}`}
            icon={CostIcon}
            color="warning"
            subtitle="This month"
          />
        </Grid>

        {/* Usage Trend Chart */}
        <Grid item xs={12}>
          <UsageChart
            title="Usage Trends"
            data={trends}
            type="bar"
            metric={selectedMetric}
            showMetricSelector={true}
            onMetricChange={setSelectedMetric}
            showPeriodSelector={false}
            height={350}
          />
        </Grid>

        {/* Top Agents Table */}
        <Grid item xs={12}>
          <UsageTable
            title="Top Agents by Usage"
            data={topAgents}
            type="agents"
            columns={['name', 'sessions', 'messages', 'tokens', 'cost']}
            maxRows={8}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectAnalyticsTab;
