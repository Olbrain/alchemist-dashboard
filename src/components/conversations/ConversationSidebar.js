/**
 * Conversation Sidebar Component
 *
 * Displays session list with selection - matches agent-dashboard design
 */
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  CircularProgress,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Chat as ChatIcon,
  History as HistoryIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

// Import assets
import whatsappLogo from '../../assets/img/integrations/whatsapp-logo.svg';
import tiledeskLogo from '../../assets/img/integrations/tiledesk-logo.png';

const ConversationSidebar = ({
  sessions = [],
  selectedSession,
  onSessionSelect,
  loading = false,
  onViewAll
}) => {
  const theme = useTheme();

  // Helper function to render channel icon
  const renderChannelIcon = (channel, isSelected) => {
    const iconStyle = {
      width: 20,
      height: 20,
      objectFit: 'contain',
      opacity: isSelected ? 1 : 0.7
    };

    switch (channel?.toLowerCase()) {
      case 'whatsapp':
        return (
          <Box
            component="img"
            src={whatsappLogo}
            alt="WhatsApp"
            sx={iconStyle}
          />
        );
      case 'tiledesk':
        return (
          <Box
            component="img"
            src={tiledeskLogo}
            alt="Tiledesk"
            sx={{ ...iconStyle, borderRadius: '3px' }}
          />
        );
      default:
        return <ChatIcon sx={{ color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary }} />;
    }
  };

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

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Recent Conversations
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            display: 'block',
            mt: 0.5,
          }}
        >
          {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
        </Typography>

        {/* View All Button */}
        {onViewAll && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            endIcon={<OpenInNewIcon />}
            onClick={onViewAll}
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            View All
          </Button>
        )}
      </Box>

      <Divider />

      {/* Sessions List */}
      <Box sx={{
        flexGrow: 1,
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
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Start chatting with this agent to see conversations
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1.5, py: 0 }}>
            {sessions.map((session) => {
              const isSelected = selectedSession?.session_id === session.session_id;

              return (
                <ListItem key={session.session_id} disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSessionSelect(session)}
                    sx={{
                      borderRadius: 2,
                      mx: 0.5,
                      py: 0.75,
                      px: 1.25,
                      minHeight: 0,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                        '&:hover': {
                          bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
                          transform: 'translateX(2px)',
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.08),
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {renderChannelIcon(session.channel, isSelected)}
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
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.85rem',
                        color: isSelected ? theme.palette.primary.main : 'inherit',
                        noWrap: true
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ConversationSidebar;
