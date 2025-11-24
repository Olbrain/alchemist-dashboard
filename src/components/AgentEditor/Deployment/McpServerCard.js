/**
 * MCP Server Card Component
 *
 * Displays a single enabled MCP server with configuration status
 */
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Extension as ExtensionIcon,
  Build as BuildIcon
} from '@mui/icons-material';

const McpServerCard = ({
  serverName,
  serverId,
  configurationStatus,
  serverCategory,
  serverTags = [],
  estimatedToolsCount
}) => {
  // Determine status icon and color
  const getStatusIcon = () => {
    if (configurationStatus.isComplete) {
      return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />;
    } else if (configurationStatus.configuredCount > 0) {
      return <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
    } else {
      return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
    }
  };

  const getStatusText = () => {
    if (configurationStatus.isComplete) {
      return `Configured (${configurationStatus.configuredCount} credentials)`;
    } else if (configurationStatus.configuredCount > 0) {
      return `Partial (${configurationStatus.configuredCount}/${configurationStatus.requiredCount} credentials)`;
    } else {
      return 'Not configured';
    }
  };

  const getStatusColor = () => {
    if (configurationStatus.isComplete) return 'success.lighter';
    if (configurationStatus.configuredCount > 0) return 'warning.lighter';
    return 'error.lighter';
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        bgcolor: getStatusColor(),
        borderColor: configurationStatus.isComplete ? 'success.light' :
                     configurationStatus.configuredCount > 0 ? 'warning.light' : 'error.light',
        '&:hover': {
          borderColor: configurationStatus.isComplete ? 'success.main' :
                       configurationStatus.configuredCount > 0 ? 'warning.main' : 'error.main',
          boxShadow: 1
        },
        transition: 'all 0.2s'
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Left side: Icon and info */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
            {/* Server Icon */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: 'background.paper',
                mr: 1.5,
                flexShrink: 0
              }}
            >
              <ExtensionIcon sx={{ fontSize: 24, color: 'primary.main' }} />
            </Box>

            {/* Server Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {serverName}
              </Typography>

              {/* Configuration Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                {getStatusIcon()}
                <Typography variant="caption" color="text.secondary">
                  {getStatusText()}
                </Typography>
              </Box>

              {/* Tool Count */}
              {estimatedToolsCount !== undefined && estimatedToolsCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <BuildIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" color="text.secondary">
                    ~{estimatedToolsCount} tools available
                  </Typography>
                </Box>
              )}

              {/* Server Category/Tags */}
              {(serverCategory || serverTags.length > 0) && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {serverCategory && serverCategory !== 'general' && (
                    <Chip
                      label={serverCategory}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.7rem',
                        bgcolor: 'background.paper'
                      }}
                    />
                  )}
                  {serverTags.slice(0, 2).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.7rem',
                        bgcolor: 'background.paper'
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default McpServerCard;
