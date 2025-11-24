/**
 * Enabled MCP List Component
 *
 * Displays all enabled/configured MCP servers for an agent
 * Provides quick actions: Test, Configure, Disable
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  PlayArrow as TestIcon,
  Cancel as DisableIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Help as UnknownIcon
} from '@mui/icons-material';

const EnabledMcpList = ({
  enabledServers = {},
  allServers = [],
  onTest,
  onConfigure,
  onDisable,
  testResults = {},
  testingServerId = null
}) => {
  const [expanded, setExpanded] = useState(true);

  // Get enabled server IDs
  const enabledServerIds = Object.keys(enabledServers);

  // Get server definitions for enabled servers
  const enabledServersList = enabledServerIds.map(serverId => {
    const serverDef = allServers.find(s => s.id === serverId);
    return {
      id: serverId,
      ...serverDef,
      config: enabledServers[serverId]
    };
  }).filter(s => s.name); // Filter out servers without definitions

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getTestStatusIcon = (serverId) => {
    if (testingServerId === serverId) {
      return <CircularProgress size={20} />;
    }

    const result = testResults[serverId];
    if (!result) {
      return <UnknownIcon sx={{ color: 'text.disabled' }} />;
    }

    if (result.success) {
      return <SuccessIcon sx={{ color: 'success.main' }} />;
    }

    return <ErrorIcon sx={{ color: 'error.main' }} />;
  };

  const getTestStatusText = (serverId) => {
    if (testingServerId === serverId) {
      return 'Testing...';
    }

    const result = testResults[serverId];
    if (!result) {
      return 'Not tested';
    }

    if (result.success) {
      return `Connected • ${result.tools_count || 0} tools`;
    }

    return 'Connection failed';
  };

  if (enabledServersList.length === 0) {
    return null; // Don't show section if no servers enabled
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Card variant="outlined">
        {/* Header */}
        <Box
          sx={{
            p: 2,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
          onClick={handleToggleExpanded}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Enabled MCP Servers ({enabledServersList.length})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Currently configured and active MCP server connections
            </Typography>
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* List */}
        <Collapse in={expanded}>
          <Box sx={{ p: 2, pt: 0 }}>
            <Grid container spacing={2}>
              {enabledServersList.map((server) => (
                <Grid item xs={12} sm={6} md={4} key={server.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {server.name}
                        </Typography>
                        {server.is_private && (
                          <Chip
                            label="Private"
                            size="small"
                            color="secondary"
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getTestStatusIcon(server.id)}
                        <Typography variant="caption" color="text.secondary">
                          {getTestStatusText(server.id)}
                        </Typography>
                      </Box>

                      {testResults[server.id] && !testResults[server.id].success && (
                        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            {testResults[server.id].error || 'Connection failed'}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5 }}>
                      <Button
                        size="small"
                        startIcon={<TestIcon />}
                        onClick={() => onTest(server)}
                        disabled={testingServerId === server.id}
                      >
                        Test
                      </Button>
                      <Button
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() => onConfigure(server)}
                      >
                        Configure
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DisableIcon />}
                        onClick={() => onDisable(server.id)}
                      >
                        Disable
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Card>
    </Box>
  );
};

export default EnabledMcpList;
