/**
 * Advanced Feature Card
 *
 * Reusable card component for displaying advanced agent features
 */
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const AdvancedFeatureCard = ({
  title,
  description,
  icon: IconComponent,
  enabled = false,
  onConfigure,
  onToggle,
  status,
  statusColor = 'default',
  disabled = false,
  comingSoon = false
}) => {
  const theme = useTheme();

  const getStatusChip = () => {
    if (comingSoon) {
      return <Chip label="Coming Soon" size="small" color="info" variant="outlined" />;
    }

    if (status) {
      return <Chip label={status} size="small" color={statusColor} />;
    }

    return (
      <Chip
        label={enabled ? 'Enabled' : 'Disabled'}
        size="small"
        color={enabled ? 'success' : 'default'}
        variant={enabled ? 'filled' : 'outlined'}
      />
    );
  };

  return (
    <Card
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: enabled
          ? alpha(theme.palette.success.main, 0.02)
          : 'background.paper',
        borderColor: enabled
          ? alpha(theme.palette.success.main, 0.2)
          : theme.palette.divider,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: enabled
            ? alpha(theme.palette.success.main, 0.4)
            : alpha(theme.palette.primary.main, 0.3),
          boxShadow: 2
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: enabled
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.primary.main, 0.1),
              color: enabled
                ? theme.palette.success.main
                : theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconComponent />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              {getStatusChip()}
            </Box>
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, lineHeight: 1.5 }}
        >
          {description}
        </Typography>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2, gap: 1 }}>
        {!comingSoon ? (
          <>
            <Button
              variant={enabled ? 'outlined' : 'contained'}
              color={enabled ? 'success' : 'primary'}
              size="small"
              onClick={onConfigure}
              disabled={disabled}
              startIcon={<SettingsIcon />}
              sx={{ minWidth: 120 }}
            >
              {enabled ? 'Configure' : 'Enable & Configure'}
            </Button>

            {enabled && onToggle && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => onToggle(false)}
                disabled={disabled}
                sx={{ minWidth: 80 }}
              >
                Disable
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outlined"
            size="small"
            disabled
            sx={{ minWidth: 120 }}
          >
            Coming Soon
          </Button>
        )}

        {/* Info Icon */}
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title={`Learn more about ${title}`}>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default AdvancedFeatureCard;