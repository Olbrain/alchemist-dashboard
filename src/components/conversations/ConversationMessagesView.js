/**
 * Conversation Messages View Component
 *
 * Displays messages for the selected session with header
 */
import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon
} from '@mui/icons-material';
import MessageBubble from './MessageBubble';

const ConversationMessagesView = ({ session, messages, loading, agentName }) => {
  const theme = useTheme();

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';

    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Empty state - no session selected
  if (!session) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}
      >
        <ChatIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" color="text.secondary">
          Select a conversation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Choose a conversation from the list to view messages
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Session Header */}
      <Box
        sx={{
          p: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          {session.profile_name || session.session_id?.split('-')[0] || 'Conversation'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.7rem'
          }}
        >
          {session.message_count || 0} messages • Started {formatDateTime(session.created_at || session.start_time)}
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1.5,
          py: 1.5,
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? '#555555' : '#c1c1c1',
            borderRadius: '3px',
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : messages && messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              agentName={agentName}
              profileName={session?.profile_name}
            />
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages in this conversation
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ConversationMessagesView;
