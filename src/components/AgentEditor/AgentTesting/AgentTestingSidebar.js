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
  Button,
  IconButton,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Science as ScienceIcon,
  Chat as SessionIcon,
} from '@mui/icons-material';

/**
 * Sidebar component for Agent Testing session navigation
 * Matches DeploymentSidebar/KnowledgeBaseSidebar design pattern (280px width)
 */
const AgentTestingSidebar = ({
  sessions = [],
  selectedSession,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  loading = false,
}) => {
  const theme = useTheme();

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
            Test Sessions
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onCreateSession}
            sx={{
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            New
          </Button>
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
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </Typography>
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
            <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              No test sessions yet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Create a new session to start testing
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1.5, py: 0 }}>
            {sessions.map((session) => {
              const isSelected = selectedSession?.id === session.id;

              return (
                <ListItem key={session.id} disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSelectSession(session)}
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
                        color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                        minWidth: 36,
                        transition: 'color 0.2s ease-in-out'
                      }}
                    >
                      <SessionIcon />
                    </ListItemIcon>

                    <ListItemText
                      primary={session.title || 'Untitled Session'}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.7rem',
                              display: 'block'
                            }}
                          >
                            {formatDateTime(session.created_at)}
                          </Typography>
                          {session.description && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                display: 'block',
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {session.description}
                            </Typography>
                          )}
                        </Box>
                      }
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.85rem',
                        color: isSelected ? theme.palette.primary.main : 'inherit',
                        noWrap: true
                      }}
                    />
                    {onDeleteSession && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        sx={{
                          ml: 0.5,
                          opacity: isSelected ? 1 : 0.6,
                          '&:hover': {
                            opacity: 1,
                            color: theme.palette.error.main
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
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

export default AgentTestingSidebar;
