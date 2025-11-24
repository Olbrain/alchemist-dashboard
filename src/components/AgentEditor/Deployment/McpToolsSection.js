/**
 * MCP Tools Section Component
 *
 * Displays aggregated tools from all enabled MCP servers
 * Groups tools by server with expandable sections
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Stack,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Build as BuildIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const McpToolsSection = ({ servers = [] }) => {
  const [expandedServers, setExpandedServers] = useState({});

  // Calculate total tools across all servers
  const totalTools = servers.reduce((sum, server) => {
    return sum + (server.tools?.length || 0);
  }, 0);

  // Toggle server expansion
  const toggleServer = (serverId) => {
    setExpandedServers(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }));
  };

  // If no servers or no tools, show empty state
  if (servers.length === 0 || totalTools === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            All Available Tools
          </Typography>
          <Chip
            label={`${totalTools} total`}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          />
        </Box>
      </Box>

      <Stack spacing={2}>
        {servers.map((server) => {
          const hasTools = server.tools && server.tools.length > 0;
          if (!hasTools) return null;

          const isExpanded = expandedServers[server.serverId] || false;
          const toolCount = server.tools.length;

          return (
            <Card key={server.serverId} variant="outlined">
              {/* Server Header */}
              <CardContent
                sx={{
                  p: 2,
                  '&:last-child': { pb: 2 },
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => toggleServer(server.serverId)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <BuildIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {server.serverName}
                    </Typography>
                    <Chip
                      label={`${toolCount} tool${toolCount !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    {server.serverCategory && server.serverCategory !== 'general' && (
                      <Chip
                        label={server.serverCategory}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <IconButton size="small">
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                {server.serverDescription && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {server.serverDescription}
                  </Typography>
                )}
              </CardContent>

              {/* Tools List */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Divider />
                <CardContent sx={{ p: 2, pt: 2, bgcolor: 'background.default' }}>
                  <Stack spacing={1.5}>
                    {server.tools.map((tool, index) => {
                      const toolName = typeof tool === 'string' ? tool : tool.name;
                      const toolDescription = typeof tool === 'object' ? tool.description : null;
                      const toolCategory = typeof tool === 'object' ? tool.category : null;

                      return (
                        <Box
                          key={index}
                          sx={{
                            p: 1.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'divider'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <BuildIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: toolDescription ? 0.5 : 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 500,
                                    color: 'text.primary'
                                  }}
                                >
                                  {toolName}
                                </Typography>
                                {toolCategory && (
                                  <Chip
                                    label={toolCategory}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.65rem',
                                      bgcolor: 'primary.lighter'
                                    }}
                                  />
                                )}
                              </Box>
                              {toolDescription && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {toolDescription}
                                </Typography>
                              )}
                            </Box>
                            {toolDescription && (
                              <Tooltip title={toolDescription} arrow>
                                <InfoIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default McpToolsSection;
