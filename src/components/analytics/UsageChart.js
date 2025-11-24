/**
 * Usage Chart Component
 *
 * Displays usage data in various chart formats using Chart.js
 */
import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const UsageChart = ({
  title,
  data = [],
  type = 'line',
  metric = 'usage',
  metrics = null, // New prop for multiple metrics
  period = 'daily',
  onPeriodChange,
  showPeriodSelector = true,
  showMetricSelector = false,
  onMetricChange,
  height = 300,
  color
}) => {
  const theme = useTheme();

  const chartColor = color || theme.palette.primary.main;

  // Define colors for multiple metrics
  const metricColors = {
    messages: theme.palette.primary.main,
    sessions: theme.palette.success.main,
    total_messages: theme.palette.primary.main,
    total_sessions: theme.palette.success.main,
    total_tokens: theme.palette.info.main,
    cost: theme.palette.warning.main
  };

  // Helper function to get month/year label from data
  const getMonthYearLabel = (data) => {
    if (!data || data.length === 0) return '';
    // Parse date string manually to avoid timezone issues
    const [yearStr, monthStr] = data[0].date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const date = new Date(year, month, 1); // Create date in local timezone
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Helper function to fill missing dates in the month
  const fillMissingDates = (data) => {
    if (!data || data.length === 0) return [];

    // Parse date string manually to avoid timezone issues
    // Date format is "YYYY-MM-DD"
    const [yearStr, monthStr] = data[0].date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // Convert to 0-indexed (0=Jan, 11=Dec)

    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Create a map of existing dates
    const dataMap = {};
    data.forEach(item => {
      dataMap[item.date] = item;
    });

    // Generate all dates for the month
    const completeData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      if (dataMap[dateStr]) {
        completeData.push(dataMap[dateStr]);
      } else {
        // Add missing date with 0 values
        completeData.push({
          date: dateStr,
          messages: 0,
          sessions: 0,
          total_messages: 0,
          total_sessions: 0,
          total_tokens: 0,
          cost: 0
        });
      }
    }

    return completeData;
  };

  const chartData = useMemo(() => {
    // Fill in missing dates to show complete month
    const completeData = fillMissingDates(data);

    const labels = completeData.map(item => {
      const date = new Date(item.date);
      // Show only day number since month/year is selected at top
      return date.getDate();
    });

    // Support multiple metrics
    const metricsToShow = metrics || [metric];
    const datasets = metricsToShow.map((m, index) => {
      const values = completeData.map(item => item[m] || 0);
      const metricColor = metricColors[m] || chartColor;

      return {
        label: getMetricLabel(m),
        data: values,
        borderColor: metricColor,
        backgroundColor: type === 'line'
          ? `${metricColor}20`
          : metricColor,
        borderWidth: 2,
        fill: type === 'line' && metricsToShow.length === 1, // Only fill for single metric
        tension: 0.4,
        pointBackgroundColor: metricColor,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    return {
      labels,
      datasets
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, metric, metrics, chartColor, theme.palette.background.paper, theme.palette.primary.main, theme.palette.success.main, theme.palette.info.main, theme.palette.warning.main, type, metricColors]);

  const chartOptions = useMemo(() => {
    const metricsToShow = metrics || [metric];
    const showLegend = metricsToShow.length > 1;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 15,
            color: theme.palette.text.primary,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const metricKey = metricsToShow[context.datasetIndex];
              const value = formatValue(context.parsed.y, metricKey);
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: `Date (${getMonthYearLabel(data)})`,
            color: theme.palette.text.secondary,
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            color: theme.palette.text.secondary,
            font: {
              size: 12
            }
          }
        },
        y: {
          title: {
            display: true,
            text: getMetricLabel(metricsToShow.length > 0 ? metricsToShow[0] : metric),
            color: theme.palette.text.secondary,
            font: {
              size: 12,
              weight: '500'
            }
          },
          beginAtZero: true,
          grid: {
            color: theme.palette.divider + '40',
            drawBorder: false
          },
          border: {
            display: false
          },
          ticks: {
            color: theme.palette.text.secondary,
            font: {
              size: 12
            },
            // Force integer steps for messages/sessions
            stepSize: (() => {
              const metricKey = metricsToShow.length > 0 ? metricsToShow[0] : metric;
              return (metricKey === 'messages' || metricKey === 'sessions' ||
                      metricKey === 'total_messages' || metricKey === 'total_sessions')
                ? 1
                : undefined;
            })(),
            callback: function(value) {
              // For multiple metrics, use the first metric for formatting
              const metricKey = metricsToShow.length > 0 ? metricsToShow[0] : metric;

              // For messages/sessions, only show integers
              if (metricKey === 'messages' || metricKey === 'sessions' ||
                  metricKey === 'total_messages' || metricKey === 'total_sessions') {
                if (!Number.isInteger(value)) return null; // Skip non-integer ticks
              }

              return formatValue(value, metricKey);
            }
          }
        }
      },
      elements: {
        point: {
          hoverBorderWidth: 3
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, metric, metrics]);

  function getMetricLabel(metric) {
    switch (metric) {
      case 'usage':
      case 'total_tokens':
        return 'Tokens';
      case 'messages':
      case 'total_messages':
        return 'Messages';
      case 'sessions':
      case 'total_sessions':
        return 'Sessions';
      case 'cost':
        return 'Cost (USD)';
      case 'api_calls':
        return 'API Calls';
      default:
        return 'Usage';
    }
  }

  function formatValue(value, metric) {
    // Format cost with dollar sign
    if (metric === 'cost') {
      return '$' + value;
    }

    // Format large numbers for tokens and api_calls
    if (metric === 'usage' || metric === 'total_tokens' || metric === 'api_calls') {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
      }
    }

    return value.toLocaleString();
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" fontWeight="600">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              height: height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No usage data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body1" fontWeight="600">
            {title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {showMetricSelector && onMetricChange && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={metric}
                  onChange={(e) => onMetricChange(e.target.value)}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <MenuItem value="messages">Messages</MenuItem>
                  <MenuItem value="sessions">Sessions</MenuItem>
                  <MenuItem value="total_tokens">Tokens</MenuItem>
                  <MenuItem value="cost">Cost</MenuItem>
                </Select>
              </FormControl>
            )}

            {showPeriodSelector && onPeriodChange && (
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={period}
                  onChange={(e) => onPeriodChange(e.target.value)}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>

        <Box sx={{ height: height, position: 'relative' }}>
          {type === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UsageChart;