/**
 * Recent Conversations Component
 *
 * Displays the last 10 conversations for an agent using the same layout as agent-dashboard
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Chat as ChatIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { getSessionsForAgent } from '../../services/conversations/conversationService';

const RecentConversations = ({ agentId }) => {
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!agentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const sessionsData = await getSessionsForAgent(agentId, { limit: 10 });
        setSessions(sessionsData || []);
      } catch (err) {
        console.error('Error fetching recent conversations:', err);
        setError(err.message || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [agentId]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unknown';

    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'Invalid date';

    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return date.toLocaleString('en-US', options);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={24} />
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

  if (!sessions || sessions.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          No conversations yet
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Start chatting with this agent to see conversation history
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        overflow: 'auto',
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
      <List sx={{ px: 1.5, py: 0 }}>
        {sessions.map((session) => (
          <ListItem key={session.session_id} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
              sx={{
                borderRadius: 2,
                mx: 0.5,
                py: 0.75,
                px: 1.25,
                minHeight: 0,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                  transform: 'translateX(2px)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: theme.palette.text.secondary,
                  minWidth: 36,
                  transition: 'color 0.2s ease-in-out'
                }}
              >
                <ChatIcon />
              </ListItemIcon>

              <ListItemText
                primary={
                  session.profile_name ||
                  session.session_id?.split('-')[0] ||
                  'Untitled Session'
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {formatDateTime(session.last_message_at || session.created_at || session.start_time)}
                    {session.message_count > 0 && ` • ${session.message_count} msgs`}
                  </Typography>
                }
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  noWrap: true
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RecentConversations;
