/**
 * Agent Analytics Content Component
 *
 * Analytics dashboard showing usage metrics for a specific selected agent
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  SmartToy as AgentIcon,
  Chat as MessageIcon,
  Token as TokenIcon,
  People as SessionIcon,
  AttachMoney as CostIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import { usageService } from '../../services/usage/usageService';
import { UsageMetricsCard, UsageChart } from '../analytics';
import EmptyState from '../shared/EmptyState';
import { AGENT_DASHBOARD_URL } from '../../services/config/apiConfig';

const AgentAnalyticsContent = ({ agentId }) => {
  const { currentUser } = useAuth();

  // State management
  const [selectedMonth] = useState(() => {
    // Auto-select current month in YYYY-MM format
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('messages'); // New state for metric selector

  // Data state
  const [agentData, setAgentData] = useState(null);
  const [sessionsData, setSessionsData] = useState([]);
  const [apiCallsTrendData, setApiCallsTrendData] = useState(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState(null);

  const loadAgentAnalytics = useCallback(async () => {
    if (!agentId || !selectedMonth) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`🔥 Loading analytics for agent: ${agentId}, month: ${selectedMonth}`);

      // Load agent usage data
      const agentUsage = await usageService.getAgentUsage(agentId);
      setAgentData(agentUsage);

      // Load agent sessions for selected month
      const sessions = await usageService.getAgentSessions(agentId, selectedMonth);
      setSessionsData(sessions);

      // Load API calls trend data for selected month
      const apiCallsData = await usageService.getAgentApiCalls(agentId, { selectedMonth });
      setApiCallsTrendData(apiCallsData.trendData);

      // Calculate monthly metrics
      const totalMessages = sessions.reduce((sum, session) => sum + (session.total_messages || 0), 0);
      const totalSessions = sessions.length;
      const totalTokens = apiCallsData.monthlySummary.total_tokens;
      const totalCost = apiCallsData.monthlySummary.total_cost;

      setMonthlyMetrics({
        total_messages: totalMessages,
        total_tokens: totalTokens,
        total_sessions: totalSessions,
        cost: totalCost,
        avg_messages_per_session: totalSessions > 0 ? totalMessages / totalSessions : 0,
        avg_tokens_per_session: totalSessions > 0 ? totalTokens / totalSessions : 0,
        avg_cost_per_session: totalSessions > 0 ? totalCost / totalSessions : 0
      });

      console.log(`✅ Loaded agent analytics:`, agentUsage, apiCallsData);
    } catch (err) {
      console.error('Error loading agent analytics:', err);
      setError('Failed to load agent analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [agentId, selectedMonth]);

  // Load analytics when component mounts
  useEffect(() => {
    if (agentId && currentUser && selectedMonth) {
      loadAgentAnalytics();
    }
  }, [agentId, currentUser, selectedMonth, loadAgentAnalytics]);

  const handleViewHistoricalAnalytics = () => {
    if (!AGENT_DASHBOARD_URL) {
      alert('Agent Dashboard URL is not configured. Please contact support.');
      return;
    }

    const url = `${AGENT_DASHBOARD_URL}/${agentId}`;
    const newWindow = window.open(url, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert('Popup blocked! Please allow popups for this site to view historical analytics.');
    }
  };

  const handleExport = () => {
    // Prepare comprehensive export data
    const exportData = {
      agentInfo: {
        agent_id: agentId,
        selected_month: selectedMonth,
        export_date: new Date().toISOString()
      },
      monthlySummary: {
        total_messages: monthlyMetrics?.total_messages || 0,
        total_sessions: monthlyMetrics?.total_sessions || 0,
        total_tokens: monthlyMetrics?.total_tokens || 0,
        total_cost: monthlyMetrics?.cost || 0
      },
      dailyData: (apiCallsTrendData?.daily || []).map(day => ({
        date: day.date,
        total_tokens: day.total_tokens,
        prompt_tokens: day.prompt_tokens,
        completion_tokens: day.completion_tokens,
        cost: day.cost,
        api_calls: day.api_calls
      })),
      sessions: sessionsData.map(session => ({
        session_id: session.session_id,
        session_name: session.session_name || session.name,
        total_messages: session.total_messages,
        total_tokens: session.total_tokens,
        cost: session.cost,
        created_at: session.created_at,
        status: session.status
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-analytics-${agentId}-${selectedMonth || 'all'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Show "no agent selected" message
  if (!agentId) {
    return (
      <EmptyState
        icon={AgentIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to view its analytics."
        useCard={true}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Actions header - Current month analytics */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing analytics for current month
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={handleViewHistoricalAnalytics}
          >
            View Historical Analytics
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading || !agentData}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Main Content - Scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ fontSize: '0.75rem' }}>{error}</Alert>
        ) : monthlyMetrics ? (
          <Box>
            {/* Metrics Cards - All in Single Row */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <UsageMetricsCard
                  title="Total Messages"
                  value={monthlyMetrics.total_messages || 0}
                  icon={MessageIcon}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <UsageMetricsCard
                  title="Total Tokens"
                  value={(monthlyMetrics.total_tokens || 0).toLocaleString()}
                  icon={TokenIcon}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <UsageMetricsCard
                  title="Total Sessions"
                  value={monthlyMetrics.total_sessions || 0}
                  icon={SessionIcon}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <UsageMetricsCard
                  title="Monthly Cost"
                  value={`$${(monthlyMetrics.cost || 0).toFixed(4)}`}
                  icon={CostIcon}
                />
              </Grid>
            </Grid>

            {/* Usage Trend Chart with Metric Selector */}
            {apiCallsTrendData && apiCallsTrendData.daily && apiCallsTrendData.daily.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <UsageChart
                    title="Usage Trends"
                    data={apiCallsTrendData.daily}
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

          </Box>
        ) : (
          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
            No analytics data available for this agent.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default AgentAnalyticsContent;
