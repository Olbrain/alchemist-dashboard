import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Grid,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Api as ApiIcon,
  Visibility as ViewIcon,
  PlayArrow as TestIcon,
  AutoAwesome as GenerateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import McpServerCard from './McpServerCard';
import McpServerDetailDialog from './McpServerDetailDialog';
import ApiToolDetailDialog from './ApiToolDetailDialog';
import TestApiDialog from './TestApiDialog';
import PrivateMcpUploadDialog from './PrivateMcpUploadDialog';
import ManualApiTool from './ManualApiTool';
import { testUnifiedToolConfiguration } from '../../../../services/tools/toolManagerService';
import { generatePrivateMcpConfig } from '../../../../services/mcp/mcpService';
import { createNotification } from '../../../shared/NotificationSystem';

/**
 * McpServerBrowser - Browse and filter available MCP servers
 * Now works with external sidebar navigation (no internal tabs)
 */
const McpServerBrowser = ({
  agentId,
  servers = [], // MCP Servers passed from parent (pre-filtered by tab)
  apiTools = [], // API Tools passed separately
  activeTab, // Current tab from sidebar: 'active', 'public', 'private'
  enabledServers = {}, // { serverId: configData }
  onEnableServer,
  onConfigureServer,
  onDisableServer,
  onTestServer,
  onAddPrivateServer,
  onDeletePrivateServer,
  onAddApiTool,
  onDeleteApiTool,
  onRefreshServers,
  testResults = {},
  testingServerId = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPrivateUploadDialog, setShowPrivateUploadDialog] = useState(false);
  const [showManualApiTool, setShowManualApiTool] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApiToolDialog, setShowApiToolDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [toolToTest, setToolToTest] = useState(null);
  const [generatingMcpConfig, setGeneratingMcpConfig] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuServer, setMenuServer] = useState(null);
  const [editingTool, setEditingTool] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);

  // Reset filters when tab changes
  useEffect(() => {
    setSearchQuery('');
    setCategoryFilter('all');
  }, [activeTab]);

  // Get unique categories from current servers
  const categories = ['all', ...new Set(servers.map(s => s.category).filter(Boolean))];

  // Use servers directly as mcpServers (already separated by parent)
  const mcpServers = servers;

  // Filter based on search and category
  const applyFilters = (items) => items.filter(server => {
    const matchesSearch =
      searchQuery === '' ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (server.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' ||
      server.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const filteredApiTools = applyFilters(apiTools);
  const filteredMcpServers = applyFilters(mcpServers);

  const handleAddPrivateServer = () => {
    setShowPrivateUploadDialog(true);
  };

  const handleSavePrivateServer = async (serverConfig) => {
    try {
      await onAddPrivateServer(serverConfig);
      setShowPrivateUploadDialog(false);
    } catch (error) {
      console.error('Error saving private server:', error);
      throw error;
    }
  };

  const handleViewDetails = (server) => {
    setSelectedServer(server);
    // Check if it's an API Tool (no installation field) or MCP Server
    if (!server.installation) {
      setShowApiToolDialog(true);
    } else {
      setShowDetailDialog(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setShowDetailDialog(false);
    setSelectedServer(null);
  };

  const handleCloseApiToolDialog = () => {
    setShowApiToolDialog(false);
    setSelectedServer(null);
  };

  // Helper function to get authentication label
  const getAuthLabel = (authType) => {
    const authLabels = {
      'none': 'None',
      'bearer': 'Bearer Token',
      'api_key': 'API Key',
      'basic': 'Basic Auth',
      'oauth': 'OAuth 2.0'
    };
    return authLabels[authType] || authType || 'None';
  };

  const handleCreateFromApi = () => {
    setShowManualApiTool(true);
  };

  const handleGenerateMcpConfig = async () => {
    try {
      setGeneratingMcpConfig(true);

      const result = await generatePrivateMcpConfig(agentId);

      if (result.config) {
        createNotification({
          type: 'success',
          title: 'MCP Config Generated',
          message: `Successfully generated MCP server config with ${result.config.estimated_tools_count} API tool(s)`
        });

        // Refresh the servers list to show the newly generated MCP server
        if (onRefreshServers) {
          await onRefreshServers();
        }
      } else {
        createNotification({
          type: 'info',
          title: 'No API Tools',
          message: 'No API tools found to generate MCP configuration'
        });
      }
    } catch (error) {
      console.error('Failed to generate MCP config:', error);
      createNotification({
        type: 'error',
        title: 'Generation Failed',
        message: error.message || 'Failed to generate MCP configuration'
      });
    } finally {
      setGeneratingMcpConfig(false);
    }
  };

  const handleSaveApiTool = async (toolData) => {
    try {
      await onAddApiTool(agentId, toolData);
      setShowManualApiTool(false);
      setEditingTool(null);

      createNotification({
        type: 'success',
        title: toolData.id ? 'Tool Updated' : 'Tool Created',
        message: toolData.id
          ? 'API tool has been successfully updated.'
          : 'API tool has been successfully created.'
      });
    } catch (error) {
      console.error('Error saving API tool:', error);
      throw error;
    }
  };

  const handleTestApiClick = (tool) => {
    setToolToTest(tool);
    setShowTestDialog(true);
  };

  const handleEditApiTool = (tool) => {
    console.log('Edit API tool:', tool);
    setEditingTool(tool);
    setShowManualApiTool(true);
  };

  const handleDeleteApiTool = (tool) => {
    console.log('Delete API tool:', tool);
    setToolToDelete(tool);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!toolToDelete) return;

    try {
      await onDeleteApiTool(agentId, toolToDelete.id);

      createNotification({
        type: 'success',
        title: 'Tool Deleted',
        message: `"${toolToDelete.name}" has been successfully deleted.`
      });

      setShowDeleteConfirmation(false);
      setToolToDelete(null);
    } catch (error) {
      console.error('Failed to delete API tool:', error);
      createNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete API tool. Please try again.'
      });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setToolToDelete(null);
  };

  // Menu handlers
  const handleMenuOpen = (event, server) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuServer(server);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuServer(null);
  };

  const handleMenuAction = (action) => {
    if (!menuServer) return;

    switch (action) {
      case 'test':
        handleTestApiClick(menuServer);
        break;
      case 'view':
        handleViewDetails(menuServer);
        break;
      case 'edit':
        handleEditApiTool(menuServer);
        break;
      case 'delete':
        handleDeleteApiTool(menuServer);
        break;
      default:
        break;
    }

    handleMenuClose();
  };

  const handleExecuteTest = async (parameterValues) => {
    if (!toolToTest) return;

    try {
      // Parse URL into components
      const urlObj = new URL(toolToTest.path.trim());
      const urlComponents = {
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname,
        port: urlObj.port ? parseInt(urlObj.port) : null,
        base_path: '',
        endpoint: urlObj.pathname || '/'
      };

      // Build tool configuration
      const toolConfig = {
        method: toolToTest.method,
        url_components: urlComponents,
        authentication: {
          type: toolToTest.authentication || 'none'
          // Note: credentials are not stored in the tool object for security
        },
        parameters: toolToTest.parameters?.map(p => ({
          name: p.name,
          location: p.location || p.in,
          type: p.type,
          required: p.required || false,
          example: p.example
        })) || []
      };

      // Build test request with parameter values
      const testRequest = {
        parameters: parameterValues
      };

      // Call test service
      const result = await testUnifiedToolConfiguration(toolConfig, testRequest);
      return result;
    } catch (error) {
      console.error('Error testing API:', error);
      throw error;
    }
  };

  // Get tab-specific content
  const getTabTitle = () => {
    switch (activeTab) {
      case 'active':
        return 'Active MCP Servers';
      case 'public':
        return 'Public MCP Servers';
      case 'private':
        return 'Private MCP Servers';
      case 'api-tools':
        return 'API Tools';
      default:
        return 'MCP Servers';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'active':
        return 'Manage your currently enabled and configured MCP servers.';
      case 'public':
        return 'Browse and enable public MCP servers from the official repository.';
      case 'private':
        return 'Manage your custom private MCP server configurations.';
      case 'api-tools':
        return 'Manage custom API endpoints configured as tools.';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Title and Description */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {getTabTitle()}
          </Typography>
          {activeTab === 'private' && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddPrivateServer}
            >
              Add Private Server
            </Button>
          )}
          {activeTab === 'api-tools' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ApiIcon />}
                onClick={handleCreateFromApi}
              >
                Create from API
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<GenerateIcon />}
                onClick={handleGenerateMcpConfig}
                disabled={generatingMcpConfig}
              >
                {generatingMcpConfig ? 'Generating...' : 'Generate MCP Config'}
              </Button>
            </Box>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {getTabDescription()}
        </Typography>
      </Box>

      {/* Filters */}
      {servers.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search servers..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ flexGrow: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Server Tables */}
      {(activeTab === 'private' ? servers.length === 0 : activeTab === 'api-tools' ? apiTools.length === 0 : servers.length === 0) ? (
        <Alert severity="info">
          {activeTab === 'active' && 'No MCP servers are currently enabled. Browse public or private servers to get started.'}
          {activeTab === 'public' && 'No public MCP servers available.'}
          {activeTab === 'private' && 'No private MCP servers configured yet. Add your first private server to get started.'}
          {activeTab === 'api-tools' && 'No API tools configured yet. Create your first API tool to get started.'}
        </Alert>
      ) : activeTab === 'api-tools' ? (
        /* API Tools tab: Show API Tools table */
        apiTools.length > 0 && (
          <Box>
            {filteredApiTools.length === 0 ? (
              <Alert severity="info">No API tools found matching your filters.</Alert>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Method</strong></TableCell>
                        <TableCell><strong>Authentication</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredApiTools.map(server => {
                        return (
                          <TableRow key={server.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {server.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                                {server.description || 'No description'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {server.method && (
                                <Chip label={server.method} size="small" color="primary" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getAuthLabel(server.authentication)}
                                size="small"
                                color={server.authentication === 'none' || !server.authentication ? 'default' : 'info'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, server)}
                                title="More actions"
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredApiTools.length} of {apiTools.length} API tools
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )
      ) : activeTab === 'private' ? (
        /* Private tab: Show two separate sections */
        <>
          {/* Private MCP Servers Section */}
          {mcpServers.length > 0 && (
            <Box>
              {filteredMcpServers.length === 0 ? (
                <Alert severity="info">No private MCP servers found matching your filters.</Alert>
              ) : (
                <>
                  <Grid container spacing={2}>
                    {filteredMcpServers.map(server => {
                      const isEnabled = !!enabledServers[server.id];
                      const isConfigured = !!enabledServers[server.id]?.configured;

                      return (
                        <Grid item xs={12} sm={6} md={4} key={server.id}>
                          <McpServerCard
                            server={server}
                            isEnabled={isEnabled}
                            isConfigured={isConfigured}
                            onEnable={() => onEnableServer(server)}
                            onConfigure={() => onConfigureServer(server)}
                            onDisable={() => onDisableServer(server.id)}
                            onViewDetails={() => handleViewDetails(server)}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>

                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {filteredMcpServers.length} of {mcpServers.length} private MCP servers
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </>
      ) : (
        /* Active and Public tabs: Show card grid */
        filteredMcpServers.length === 0 ? (
          <Alert severity="info">
            No MCP servers found matching your filters.
          </Alert>
        ) : (
          <>
            <Grid container spacing={2}>
              {filteredMcpServers.map(server => {
                const isEnabled = !!enabledServers[server.id];
                const isConfigured = !!enabledServers[server.id]?.configured;

                return (
                  <Grid item xs={12} sm={6} md={4} key={server.id}>
                    <McpServerCard
                      server={server}
                      isEnabled={isEnabled}
                      isConfigured={isConfigured}
                      onEnable={() => onEnableServer(server)}
                      onConfigure={() => onConfigureServer(server)}
                      onDisable={() => onDisableServer(server.id)}
                      onViewDetails={() => handleViewDetails(server)}
                    />
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredMcpServers.length} of {servers.length} {activeTab} MCP servers
              </Typography>
            </Box>
          </>
        )
      )}

      {/* MCP Server Detail Dialog */}
      <McpServerDetailDialog
        open={showDetailDialog}
        onClose={handleCloseDetailDialog}
        server={selectedServer}
        isEnabled={selectedServer ? !!enabledServers[selectedServer.id] : false}
        isConfigured={selectedServer ? !!enabledServers[selectedServer.id]?.configured : false}
        onEnable={() => selectedServer && onEnableServer(selectedServer)}
        onConfigure={() => selectedServer && onConfigureServer(selectedServer)}
        onDisable={() => selectedServer && onDisableServer(selectedServer.id)}
        onTest={onTestServer}
      />

      {/* API Tool Detail Dialog */}
      <ApiToolDetailDialog
        open={showApiToolDialog}
        onClose={handleCloseApiToolDialog}
        tool={selectedServer}
        isEnabled={selectedServer ? !!enabledServers[selectedServer.id] : false}
        isConfigured={selectedServer ? !!enabledServers[selectedServer.id]?.configured : false}
        onEnable={() => selectedServer && onEnableServer(selectedServer)}
        onDisable={() => selectedServer && onDisableServer(selectedServer.id)}
      />

      {/* Private Server Upload Dialog */}
      <PrivateMcpUploadDialog
        open={showPrivateUploadDialog}
        onClose={() => setShowPrivateUploadDialog(false)}
        onSave={handleSavePrivateServer}
        onTest={onTestServer}
      />

      {/* Manual API Tool Dialog */}
      <Dialog
        open={showManualApiTool}
        onClose={() => {
          setShowManualApiTool(false);
          setEditingTool(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <ManualApiTool
            agentId={agentId}
            onSave={handleSaveApiTool}
            onCancel={() => {
              setShowManualApiTool(false);
              setEditingTool(null);
            }}
            tool={editingTool}
          />
        </DialogContent>
      </Dialog>

      {/* Test API Dialog */}
      <TestApiDialog
        open={showTestDialog}
        onClose={() => setShowTestDialog(false)}
        tool={toolToTest}
        onTest={handleExecuteTest}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete API Tool?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{toolToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu for API Tools */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuAction('test')}>
          <ListItemIcon>
            <TestIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Test API</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default McpServerBrowser;
