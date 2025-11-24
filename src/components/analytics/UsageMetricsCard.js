/**
 * Usage Metrics Card Component
 *
 * Displays key usage metrics in a card format
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';

const UsageMetricsCard = ({
  title,
  value,
  formattedValue,
  subtitle,
  icon: Icon,
  quota,
  showProgress = false,
  color = 'primary',
  onClick
}) => {
  const theme = useTheme();

  const getProgressPercentage = () => {
    if (!quota || quota === 0) return 0;
    return Math.min((value / quota) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
        {/* Row 1: Icon */}
        {Icon && (
          <Box
            sx={{
              display: 'inline-flex',
              p: 0.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              mb: 1
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        )}

        {/* Row 2: Title */}
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight="500"
          sx={{ fontSize: '0.8rem', mb: 0.5, lineHeight: 1.3 }}
        >
          {title}
        </Typography>

        {/* Row 3: Value */}
        <Typography
          variant="body1"
          fontWeight="700"
          sx={{
            color: theme.palette[color].main,
            fontSize: { xs: '1rem', sm: '1.125rem' },
            lineHeight: 1.2
          }}
        >
          {formattedValue || value}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}

        {/* Progress Bar */}
        {showProgress && quota && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Usage
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getProgressPercentage().toFixed(1)}% of {quota}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressPercentage()}
              color={getProgressColor()}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[300], 0.3)
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageMetricsCard;