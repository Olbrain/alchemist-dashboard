import React from 'react';
import {
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Chip
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Build as ToolIcon
} from '@mui/icons-material';

/**
 * McpTestResults - Display test results for MCP server configuration
 * Shows connection status, discovered tools, and any errors
 */
const McpTestResults = ({ results, serverName }) => {
  const [expanded, setExpanded] = React.useState(true);

  if (!results) return null;

  const {
    success,
    connection_status,
    tools_discovered,
    tools_count,
    sample_tool_test,
    error,
    warnings = []
  } = results;

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1
        }}
      >
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {success ? (
            <SuccessIcon color="success" fontSize="small" />
          ) : (
            <ErrorIcon color="error" fontSize="small" />
          )}
          Test Results
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Overall Status */}
          <Alert severity={success ? 'success' : 'error'}>
            {success
              ? `Successfully connected to ${serverName}!`
              : `Failed to connect to ${serverName}`}
          </Alert>

          {/* Error Details */}
          {error && (
            <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Error Details:
              </Typography>
              {error}
            </Alert>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert severity="warning">
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Warnings:
              </Typography>
              <List dense>
                {warnings.map((warning, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          {/* Test Steps */}
          {success && (
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2
              }}
            >
              <List>
                {/* Connection Status */}
                <ListItem disableGutters>
                  <ListItemIcon>
                    <SuccessIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Connection Established"
                    secondary={connection_status || 'Successfully connected to MCP server'}
                  />
                </ListItem>

                {/* Tools Discovery */}
                {tools_discovered !== undefined && (
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <SuccessIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>Tools Discovered</span>
                          <Chip
                            label={`${tools_count || tools_discovered.length} tools`}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                      secondary={
                        tools_discovered.length > 0
                          ? `Available tools: ${tools_discovered.slice(0, 5).join(', ')}${
                              tools_discovered.length > 5 ? '...' : ''
                            }`
                          : 'Tool discovery successful'
                      }
                    />
                  </ListItem>
                )}

                {/* Sample Tool Test */}
                {sample_tool_test && (
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <SuccessIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sample Tool Executed"
                      secondary={
                        sample_tool_test.success
                          ? `Successfully executed: ${sample_tool_test.tool_name || 'sample tool'}`
                          : `Failed to execute sample tool: ${sample_tool_test.error}`
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}

          {/* Discovered Tools List */}
          {success && tools_discovered && tools_discovered.length > 0 && (
            <Box>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Available Tools ({tools_discovered.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {tools_discovered.map((tool, index) => (
                  <Chip
                    key={index}
                    label={tool}
                    size="small"
                    icon={<ToolIcon fontSize="small" />}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Next Steps */}
          {success && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Next Steps:</strong> Click "Save Configuration" to enable this MCP
                server for your agent. The tools will be available after you deploy the agent.
              </Typography>
            </Alert>
          )}

          {/* Troubleshooting */}
          {!success && (
            <Alert severity="info">
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Troubleshooting:
              </Typography>
              <List dense>
                <ListItem disableGutters>
                  • Verify all required fields are filled correctly
                </ListItem>
                <ListItem disableGutters>
                  • Check that API credentials are valid and not expired
                </ListItem>
                <ListItem disableGutters>
                  • Ensure the service is accessible and not experiencing downtime
                </ListItem>
                <ListItem disableGutters>
                  • Review the service's documentation for setup requirements
                </ListItem>
              </List>
            </Alert>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default McpTestResults;
