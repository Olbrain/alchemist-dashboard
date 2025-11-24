/**
 * Public Tools Browser
 *
 * Component for browsing and selecting public tools for agents
 * Redesigned with simplified cards and two-section layout
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  LinearProgress,
  Switch,
  FormControlLabel,
  Collapse,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  getAllToolConfigs,
  toggleToolConfiguration,
  saveToolConfiguration
} from '../../../../services/tools/toolConfigurationService';
import ToolConfigDialog from '../ToolConfigDialog';
import PublicToolDetailsDialog from './PublicToolDetailsDialog';

const PublicToolsBrowser = ({
  agentId,
  publicTools = [],
  loading = false,
  disabled = false,
  onNotification
}) => {
  const [togglingToolId, setTogglingToolId] = useState(null);
  const [configuredToolIds, setConfiguredToolIds] = useState([]);
  const [toolConfigs, setToolConfigs] = useState({}); // Store full config objects keyed by tool_id
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [expandedSuites, setExpandedSuites] = useState({}); // Track which suites are expanded
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogTool, setDetailsDialogTool] = useState(null);

  // Toggle expand/collapse for tool details
  const handleToggleExpand = (suiteId) => {
    setExpandedSuites(prev => ({
      ...prev,
      [suiteId]: !prev[suiteId]
    }));
  };

  // Load tool configurations when component mounts or agentId changes
  useEffect(() => {
    const loadConfiguredTools = async () => {
      if (agentId) {
        try {
          const configs = await getAllToolConfigs(agentId);

          // Store configs in a map for easy lookup
          const configsMap = {};
          configs.forEach(config => {
            configsMap[config.tool_id] = config;
          });
          setToolConfigs(configsMap);

          // Store IDs of configured tools (regardless of enabled status)
          const configuredIds = configs.map(config => config.tool_id);
          setConfiguredToolIds(configuredIds);
        } catch (error) {
          console.error('Error loading configured tools:', error);
        }
      }
    };

    loadConfiguredTools();
  }, [agentId]);

  const handleEnableTool = async (toolId, toolName) => {
    try {
      setTogglingToolId(toolId);

      // Save tool configuration with empty config and enabled=true
      await saveToolConfiguration(agentId, toolId, {
        configuration: {},
        enabled: true,
        enabled_subtools: []
      });

      // Update local state
      setToolConfigs(prev => ({
        ...prev,
        [toolId]: {
          tool_id: toolId,
          enabled: true,
          configuration: {},
          enabled_subtools: []
        }
      }));

      setConfiguredToolIds(prev => [...prev, toolId]);

      if (onNotification) {
        onNotification({
          type: 'success',
          message: `Successfully enabled ${toolName}`
        });
      }
    } catch (error) {
      console.error('Error enabling tool:', error);
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to enable ${toolName}: ${error.message}`
        });
      }
    } finally {
      setTogglingToolId(null);
    }
  };

  const handleOpenConfig = (tool) => {
    setSelectedTool(tool);
    setConfigDialogOpen(true);
  };

  const handleCloseConfig = () => {
    setSelectedTool(null);
    setConfigDialogOpen(false);
  };

  const handleOpenDetailsDialog = (tool) => {
    setDetailsDialogTool(tool);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogTool(null);
    setDetailsDialogOpen(false);
  };

  const handleToggleEnabled = async (toolId, toolName, currentlyEnabled) => {
    try {
      setTogglingToolId(toolId);
      const newEnabledState = !currentlyEnabled;

      await toggleToolConfiguration(agentId, toolId, newEnabledState);

      // Update local state
      setToolConfigs(prev => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          enabled: newEnabledState
        }
      }));

      if (onNotification) {
        onNotification({
          type: 'success',
          message: `${toolName} ${newEnabledState ? 'enabled' : 'disabled'} successfully`
        });
      }
    } catch (error) {
      console.error('Error toggling tool:', error);
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to ${currentlyEnabled ? 'disable' : 'enable'} ${toolName}: ${error.message}`
        });
      }
    } finally {
      setTogglingToolId(null);
    }
  };

  const handleConfigSaved = async () => {
    // Reload configured tools
    try {
      const configs = await getAllToolConfigs(agentId);

      // Store configs in a map for easy lookup
      const configsMap = {};
      configs.forEach(config => {
        configsMap[config.tool_id] = config;
      });
      setToolConfigs(configsMap);

      // Store IDs of configured tools
      const configuredIds = configs.map(config => config.tool_id);
      setConfiguredToolIds(configuredIds);

      if (onNotification) {
        // Check if WooCommerce was just configured (which auto-enables Twilio Verify)
        if (selectedTool?.id === 'woocommerce') {
          onNotification({
            type: 'success',
            message: `${selectedTool?.name} configured successfully. Twilio Verify has been auto-enabled for customer authentication.`
          });
        } else {
          onNotification({
            type: 'success',
            message: `Configuration saved for ${selectedTool?.name}`
          });
        }
      }
    } catch (error) {
      console.error('Error reloading configured tools:', error);
    }
  };

  // All tools for browsing
  const allTools = publicTools;

  // Loading State
  const LoadingState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading public tools...
      </Typography>
    </Box>
  );

  // Empty State
  const EmptyState = () => (
    <Box
      sx={{
        textAlign: 'center',
        py: 4,
        color: 'text.secondary'
      }}
    >
      <BuildIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
      <Typography variant="body2">
        No public tools available
      </Typography>
    </Box>
  );

  // Simplified Tool Card Component
  const ToolCard = ({ tool }) => {
    const isConfigured = configuredToolIds.includes(tool.id);
    const toolConfig = toolConfigs[tool.id];
    const isToolEnabled = toolConfig?.enabled ?? false;
    const isToggling = togglingToolId === tool.id;
    const clickLockRef = useRef(false);
    const hasConfigSchema = tool.configuration_schema && Object.keys(tool.configuration_schema).length > 0;

    // Prevent double-clicks while operation is in progress
    const handleClick = async (action) => {
      if (clickLockRef.current || disabled) return;

      clickLockRef.current = true;
      try {
        await action();
      } finally {
        clickLockRef.current = false;
      }
    };

    return (
      <Card
        sx={{
          minHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease',
          border: '1px solid',
          borderColor: isConfigured && isToolEnabled ? 'success.main' : 'divider',
          position: 'relative',
          opacity: isConfigured && !isToolEnabled ? 0.7 : 1,
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 2,
            borderColor: isConfigured && isToolEnabled ? 'success.main' : 'primary.main'
          }
        }}
        onClick={() => handleOpenDetailsDialog(tool)}
      >
        {/* Subtle loading indicator at top of card */}
        {isToggling && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2
            }}
          />
        )}

        <CardContent sx={{ flex: 1, pb: 1, pt: isToggling ? 2.5 : 2 }}>
          {/* Status Indicator (Centered) */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1.5 }}>
            {/* Success Checkmark for Enabled Tools */}
            {isConfigured && isToolEnabled && (
              <CheckCircleIcon
                sx={{
                  color: 'success.main',
                  fontSize: 20,
                  flexShrink: 0
                }}
              />
            )}
          </Box>

          {/* Tool Name (Centered) */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: 'center',
              mb: 1
            }}
          >
            {tool.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              fontSize: '0.875rem'
            }}
          >
            {tool.description || 'No description available'}
          </Typography>

          {/* Tool Details Section - Show individual tools in suite */}
          {tool.tools && tool.tools.length > 0 && (
            <>
              <Box sx={{ mt: 1.5, mb: 0 }}>
                <Button
                  size="small"
                  fullWidth
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(tool.id);
                  }}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform: expandedSuites[tool.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: '0.3s'
                      }}
                    />
                  }
                  sx={{ textTransform: 'none', justifyContent: 'space-between', py: 0.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InfoIcon fontSize="small" />
                    <Typography variant="body2" fontWeight="500">
                      {tool.tools.length} Individual Tool{tool.tools.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Button>
              </Box>

              <Collapse in={expandedSuites[tool.id]} timeout="auto">
                <Box sx={{
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  p: 1,
                  maxHeight: 200,
                  overflowY: 'auto',
                  mt: 1,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  }
                }}>
                  <List dense disablePadding>
                    {tool.tools.map((individualTool, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5, px: 1, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={
                            <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.75rem' }}>
                              {individualTool.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
                              {individualTool.description || 'No description'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Collapse>
            </>
          )}
        </CardContent>

        <CardActions sx={{ p: 1.5, pt: 0, flexDirection: 'column', gap: 1 }}>
          {/* Show enable/disable switch and configure button for configured tools */}
          {hasConfigSchema && isConfigured && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={isToolEnabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleEnabled(tool.id, tool.name, isToolEnabled);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={disabled || isToggling}
                    size="small"
                  />
                }
                label={isToolEnabled ? 'Enabled' : 'Disabled'}
                sx={{ width: '100%', m: 0, justifyContent: 'space-between' }}
                labelPlacement="start"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                fullWidth
                size="small"
                variant="outlined"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenConfig(tool);
                }}
                startIcon={<SettingsIcon />}
                disabled={disabled}
              >
                Configure
              </Button>
            </>
          )}
          {/* Show configure button for non-configured tools with schema */}
          {hasConfigSchema && !isConfigured && (
            <Button
              fullWidth
              size="small"
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenConfig(tool);
              }}
              startIcon={<SettingsIcon />}
              disabled={disabled}
            >
              Configure
            </Button>
          )}
          {/* Show enable/disable switch for tools without schema that are configured */}
          {!hasConfigSchema && isConfigured && (
            <FormControlLabel
              control={
                <Switch
                  checked={isToolEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleEnabled(tool.id, tool.name, isToolEnabled);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={disabled || isToggling}
                  size="small"
                />
              }
              label={isToolEnabled ? 'Enabled' : 'Disabled'}
              sx={{ width: '100%', m: 0, justifyContent: 'space-between' }}
              labelPlacement="start"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {/* Show add button for tools without schema that are not configured */}
          {!hasConfigSchema && !isConfigured && (
            <Button
              fullWidth
              size="small"
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(() => handleEnableTool(tool.id, tool.name));
              }}
              startIcon={isToggling ? <CircularProgress size={16} /> : <AddIcon />}
              disabled={disabled}
            >
              Add
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  if (loading) {
    return <LoadingState />;
  }

  // Count enabled tools
  const enabledConfiguredCount = Object.values(toolConfigs).filter(config => config.enabled).length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">
            Browse Public Tools
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${enabledConfiguredCount} Enabled`}
              color="success"
              size="small"
              icon={<CheckCircleIcon />}
            />
            <Chip
              label={`${configuredToolIds.length} Configured`}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure public tools for your agent. Only enabled tools will be available during agent conversations.
        </Typography>
      </Box>

      {/* Content Area with Scrolling */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {publicTools.length === 0 ? (
          <EmptyState />
        ) : (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                pb: 1,
                borderBottom: 2,
                borderColor: 'primary.main'
              }}
            >
              <BuildIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                All Public Tools
              </Typography>
              <Chip
                label={allTools.length}
                size="small"
                color="primary"
                sx={{ height: 20, minWidth: 32 }}
              />
            </Box>
            <Grid container spacing={2}>
              {allTools.map((tool) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={tool.id}>
                  <ToolCard tool={tool} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Tool Configuration Dialog */}
      <ToolConfigDialog
        open={configDialogOpen}
        onClose={handleCloseConfig}
        tool={selectedTool}
        agentId={agentId}
        onSave={handleConfigSaved}
      />

      {/* Tool Details Dialog */}
      <PublicToolDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        tool={detailsDialogTool}
        isConfigured={detailsDialogTool ? configuredToolIds.includes(detailsDialogTool.id) : false}
        isEnabled={detailsDialogTool ? (toolConfigs[detailsDialogTool.id]?.enabled ?? false) : false}
        onEnableTool={handleEnableTool}
        onToggleEnabled={handleToggleEnabled}
        onOpenConfig={handleOpenConfig}
        isToggling={detailsDialogTool ? togglingToolId === detailsDialogTool.id : false}
        disabled={disabled}
      />
    </Box>
  );
};

export default PublicToolsBrowser;