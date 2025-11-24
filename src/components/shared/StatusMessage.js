/**
 * StatusMessage Component
 *
 * Reusable component for displaying alerts, errors, warnings, info, and success messages
 * with consistent styling across the application.
 *
 * Usage:
 *   <StatusMessage
 *     type="error"
 *     title="Authentication Failed"
 *     message="Invalid credentials"
 *     variant="fullPage"
 *   />
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon
} from '@mui/icons-material';

// Type configuration with icons and colors
const TYPE_CONFIG = {
  error: {
    icon: ErrorIcon,
    color: 'error.main',
    bgColor: 'error.lighter',
    iconColor: 'error.main'
  },
  warning: {
    icon: WarningIcon,
    color: 'warning.main',
    bgColor: 'warning.lighter',
    iconColor: 'warning.main'
  },
  info: {
    icon: InfoIcon,
    color: 'info.main',
    bgColor: 'info.lighter',
    iconColor: 'info.main'
  },
  success: {
    icon: CheckCircleIcon,
    color: 'success.main',
    bgColor: 'success.lighter',
    iconColor: 'success.main'
  },
  auth: {
    icon: LockIcon,
    color: 'error.main',
    bgColor: 'error.lighter',
    iconColor: 'error.main'
  }
};

// Variant configuration for different layouts
const VARIANT_CONFIG = {
  fullPage: {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      p: 3
    },
    maxWidth: 500,
    iconSize: 48
  },
  content: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      py: 8
    },
    maxWidth: 500,
    iconSize: 48
  },
  inline: {
    container: {
      mb: 2
    },
    maxWidth: '100%',
    iconSize: 24
  },
  compact: {
    container: {
      p: 2
    },
    maxWidth: '100%',
    iconSize: 20
  }
};

/**
 * StatusMessage Component
 *
 * @param {string} type - Message type: 'error', 'warning', 'info', 'success', 'auth'
 * @param {string} title - Main heading
 * @param {string} message - Detailed message
 * @param {string} variant - Layout variant: 'fullPage', 'content', 'inline', 'compact'
 * @param {React.Component} icon - Custom icon (optional, auto-selected based on type)
 * @param {Array} actions - Array of action button configurations
 * @param {object} sx - Additional sx styling
 */
const StatusMessage = ({
  type = 'info',
  title,
  message,
  variant = 'content',
  icon: CustomIcon,
  actions = [],
  code,
  sx = {}
}) => {
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const variantConfig = VARIANT_CONFIG[variant] || VARIANT_CONFIG.content;

  const Icon = CustomIcon || typeConfig.icon;

  return (
    <Box sx={{ ...variantConfig.container, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: variantConfig.maxWidth,
          width: '100%'
        }}
      >
        {/* Icon */}
        <Icon
          sx={{
            fontSize: variantConfig.iconSize,
            color: typeConfig.iconColor,
            mb: 2,
            opacity: 0.9
          }}
        />

        {/* Title */}
        {title && (
          <Typography
            variant={variant === 'fullPage' || variant === 'content' ? 'h6' : 'subtitle1'}
            sx={{
              fontWeight: 600,
              color: typeConfig.color,
              mb: message ? 1 : 0
            }}
          >
            {title}
          </Typography>
        )}

        {/* Message */}
        {message && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              maxWidth: 400,
              mb: code || actions.length > 0 ? 2 : 0
            }}
          >
            {message}
          </Typography>
        )}

        {/* Error/Status Code */}
        {code && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              color: 'text.disabled',
              mb: actions.length > 0 ? 2 : 0
            }}
          >
            {code}
          </Typography>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'contained'}
                color={action.color || type}
                size={action.size || 'small'}
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StatusMessage;
