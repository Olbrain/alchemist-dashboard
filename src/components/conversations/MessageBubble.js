/**
 * Message Bubble Component
 *
 * Displays individual messages with sender info, content, and metadata
 */
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  Token as TokenIcon,
  AttachMoney as AttachMoneyIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const MessageBubble = ({ message, agentName, profileName }) => {
  const isUser = message.role === 'user' || message.sender === 'user';
  const isHuman = message.is_human_response || false;

  // Color scheme
  const colors = {
    user: {
      bg: 'rgba(25, 118, 210, 0.08)',
      border: 'rgba(25, 118, 210, 0.2)',
      text: '#1976d2',
      avatar: '#1976d2'
    },
    ai: {
      bg: 'rgba(46, 125, 50, 0.08)',
      border: 'rgba(46, 125, 50, 0.2)',
      text: '#2e7d32',
      avatar: '#2e7d32'
    },
    human: {
      bg: 'rgba(156, 39, 176, 0.08)',
      border: 'rgba(156, 39, 176, 0.2)',
      text: '#9c27b0',
      avatar: '#9c27b0'
    }
  };

  const colorScheme = isHuman ? colors.human : (isUser ? colors.user : colors.ai);

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Get delivery status icon
  const getDeliveryStatusIcon = () => {
    const status = message.delivery_status || 'sent';
    const iconProps = { sx: { fontSize: 14, ml: 0.5 } };

    switch (status) {
      case 'sent':
        return <CheckIcon {...iconProps} sx={{ ...iconProps.sx, color: '#666' }} />;
      case 'delivered':
        return <DoneAllIcon {...iconProps} sx={{ ...iconProps.sx, color: '#666' }} />;
      case 'read':
        return <DoneAllIcon {...iconProps} sx={{ ...iconProps.sx, color: '#0088cc' }} />;
      case 'failed':
        return <ErrorIcon {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
      case 'pending':
        return <ScheduleIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ff9800' }} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-start' : 'flex-end',
        mb: 1.5,
        alignItems: 'flex-end',
        gap: 1
      }}
    >
      {/* Avatar - Left side for user */}
      {isUser && (
        <Avatar
          sx={{
            width: 16,
            height: 16,
            bgcolor: colorScheme.avatar,
            fontSize: 10
          }}
        >
          <PersonIcon sx={{ fontSize: 12 }} />
        </Avatar>
      )}

      {/* Message Bubble */}
      <Paper
        elevation={0}
        sx={{
          maxWidth: '75%',
          bgcolor: colorScheme.bg,
          border: `1px solid ${colorScheme.border}`,
          borderRadius: 1.5,
          borderTopLeftRadius: isUser ? 0.25 : 1.5,
          borderTopRightRadius: isUser ? 1.5 : 0.25,
          p: 0.75,
          position: 'relative'
        }}
      >
        {/* Sender Name + Human Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: colorScheme.text
            }}
          >
            {isUser
              ? (profileName || 'User')
              : message.is_human_response && message.operator_email
                ? message.operator_email
                : (agentName || 'AI Agent')
            }
          </Typography>
          {isHuman && (
            <Chip
              label="H"
              size="small"
              sx={{
                height: 14,
                fontSize: '0.65rem',
                bgcolor: colors.human.avatar,
                color: 'white',
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
          )}
        </Box>

        {/* Message Content */}
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            pr: 6
          }}
        >
          {message.content || message.message || ''}
        </Typography>

        {/* Footer: Time + Delivery Status + Tokens + Cost */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 0.5,
            gap: 1
          }}
        >
          {/* Left side: Time + Status */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: 'text.secondary'
              }}
            >
              {formatTimeAgo(message.timestamp || message.created_at)}
            </Typography>
            {getDeliveryStatusIcon()}
          </Box>

          {/* Right side: Tokens + Cost */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {message.total_tokens > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <TokenIcon sx={{ fontSize: 12, color: '#1976d2' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                  {message.total_tokens}
                </Typography>
              </Box>
            )}
            {message.cost > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <AttachMoneyIcon sx={{ fontSize: 12, color: '#2e7d32' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                  {message.cost.toFixed(4)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Avatar - Right side for AI */}
      {!isUser && (
        <Avatar
          sx={{
            width: 16,
            height: 16,
            bgcolor: colorScheme.avatar,
            fontSize: 10
          }}
        >
          <BotIcon sx={{ fontSize: 12 }} />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;
