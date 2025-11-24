import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Typography,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Api as ApiToolsIcon,
} from '@mui/icons-material';

/**
 * Sidebar component for MCP server navigation
 * Matches DashboardSidebar design pattern (280px width)
 */
const McpServerSidebar = ({
  activeTab,
  onTabChange,
  activeMcpCount = 0,
  publicMcpCount = 0,
  privateMcpCount = 0,
  apiToolsCount = 0,
}) => {
  const theme = useTheme();

  const tabs = [
    {
      value: 'active',
      label: 'Active MCPs',
      icon: <ActiveIcon />,
      count: activeMcpCount,
      description: 'Configured servers'
    },
    {
      value: 'public',
      label: 'Public MCPs',
      icon: <PublicIcon />,
      count: publicMcpCount,
      description: 'Available servers'
    },
    {
      value: 'private',
      label: 'Private MCPs',
      icon: <PrivateIcon />,
      count: privateMcpCount,
      description: 'Custom servers'
    },
    {
      value: 'api-tools',
      label: 'API Tools',
      icon: <ApiToolsIcon />,
      count: apiToolsCount,
      description: 'Custom API endpoints'
    }
  ];

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
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            mb: 0.5,
          }}
        >
          Agent Tools
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            display: 'block',
            mt: 0.5,
          }}
        >
          Enable servers to add tools
        </Typography>
      </Box>

      <Divider />

      {/* Navigation List */}
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
        <List sx={{ px: 1.5, py: 0 }}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.value;

            return (
              <ListItem key={tab.value} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onTabChange(tab.value)}
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
                    {tab.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={tab.label}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.85rem',
                      color: isSelected ? theme.palette.primary.main : 'inherit'
                    }}
                  />

                  {tab.count > 0 && (
                    <Badge
                      badgeContent={tab.count}
                      color={tab.value === 'active' ? 'success' : 'default'}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          minWidth: '20px',
                          height: '20px',
                          bgcolor: tab.value === 'active'
                            ? theme.palette.success.main
                            : alpha(theme.palette.text.primary, 0.08),
                          color: tab.value === 'active'
                            ? 'white'
                            : theme.palette.text.secondary,
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default McpServerSidebar;
