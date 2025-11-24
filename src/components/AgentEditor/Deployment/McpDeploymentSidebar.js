/**
 * MCP Deployment Sidebar
 *
 * Navigation sidebar for MCP deployment status and history
 */
import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const McpDeploymentSidebar = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      value: 'status',
      label: 'Status',
      icon: <InfoIcon />
    },
    {
      value: 'history',
      label: 'History',
      icon: <HistoryIcon />
    }
  ];

  return (
    <Box
      sx={{
        width: 280,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
          MCP Deployment
        </Typography>
      </Box>

      <Divider />

      {/* Navigation List */}
      <List sx={{ flex: 1, p: 1 }}>
        {tabs.map((tab) => (
          <ListItemButton
            key={tab.value}
            selected={activeTab === tab.value}
            onClick={() => onTabChange(tab.value)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.primary.light}20 100%)`,
                '&:hover': {
                  bgcolor: 'primary.light',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main}20 100%)`
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.main'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: 'primary.main'
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {tab.icon}
            </ListItemIcon>
            <ListItemText
              primary={tab.label}
              primaryTypographyProps={{
                variant: 'body2'
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default McpDeploymentSidebar;
