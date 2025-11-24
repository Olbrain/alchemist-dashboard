/**
 * Tools Manager
 *
 * Main component for managing MCP (Model Context Protocol) server integrations
 * All operations via backend API (no real-time Firestore listeners in embed mode)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
// import { collection, onSnapshot } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
// import { db } from '../../../utils/firebase'; // REMOVED: Firebase/Firestore
import { createNotification } from '../../shared/NotificationSystem';
import McpServerBrowser from './McpServers/McpServerBrowser';
import McpConfigDialog from './McpServers/McpConfigDialog';
import McpServerSidebar from './McpServers/McpServerSidebar';
import useAgentState from '../../../hooks/useAgentState';
import {
  getAgentMcpConfigurations,
  saveMcpConfiguration,
  deleteMcpConfiguration,
  testMcpConfiguration,
  testEnabledMcpServer,
  getAvailableMcpServers,
  savePrivateMcpServer,
  deletePrivateMcpServer,
  getApiTools,
  saveApiTool,
  deleteApiTool
} from '../../../services/mcp/mcpService';

const ToolsManager = ({
  onNotification,
  disabled = false,
  agentId: providedAgentId = null
}) => {
  const { agent, agentId, loading: agentLoading, error: agentError } = useAgentState(providedAgentId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // MCP Server state
  const [mcpServers, setMcpServers] = useState([]);
  const [enabledMcpServers, setEnabledMcpServers] = useState({});
  const [showMcpConfigDialog, setShowMcpConfigDialog] = useState(false);
  const [configuringMcpServer, setConfiguringMcpServer] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testingServerId, setTestingServerId] = useState(null);

  // API Tools state (separate from MCP servers)
  const [apiTools, setApiTools] = useState([]);

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState('active');

  // Helper functions for server filtering and counts
  const getActiveServers = () => {
    // Show all enabled servers (both public and private)
    return mcpServers.filter(server => enabledMcpServers[server.id]);
  };

  const getPublicServers = () => {
    // Only show public servers (exclude private ones)
    return mcpServers.filter(server => (server.type === 'mcp_server' || !server.type) && server.is_private !== true);
  };

  const getPrivateServers = () => {
    return mcpServers.filter(server =>
      (server.is_private === true || server.type === 'private_mcp_server') &&
      server.installation  // Only include servers with installation field
    );
  };

  const getFilteredServers = () => {
    switch (activeTab) {
      case 'active':
        return getActiveServers();
      case 'public':
        return getPublicServers();
      case 'private':
        return getPrivateServers();
      case 'api-tools':
        return []; // API tools passed separately, no servers for this tab
      default:
        return mcpServers;
    }
  };

  // Add debug logging
  console.log('ToolsManager - State:', {
    agent: !!agent,
    agentId,
    agentLoading,
    agentError,
    loading,
    error
  });

  // Load MCP servers, API tools, and configurations
  const loadMcpServers = useCallback(async () => {
    if (!agentId) {
      console.log('loadMcpServers: No agentId, skipping load');
      return;
    }

    // Load MCP servers
    try {
      const availableServers = await getAvailableMcpServers(agentId);
      setMcpServers(availableServers);
      console.log('Loaded MCP servers:', availableServers);
    } catch (error) {
      console.error('Error loading MCP servers:', error);
      setMcpServers([]);
    }

    // Load API tools separately
    try {
      console.log('Loading API tools for agentId:', agentId);
      const tools = await getApiTools(agentId);
      setApiTools(tools);
      console.log('Loaded API tools:', tools);
    } catch (error) {
      console.error('Error loading API tools:', error);
      console.error('AgentId at time of error:', agentId);
      setApiTools([]);
    }

    // Load enabled configurations
    try {
      const enabledConfigs = await getAgentMcpConfigurations(agentId);
      setEnabledMcpServers(enabledConfigs);
      console.log('Enabled MCP configs:', enabledConfigs);
    } catch (error) {
      console.error('Error loading MCP configs:', error);
      setEnabledMcpServers({});
    }
  }, [agentId]);

  // Load data on mount and when agentId changes (no real-time listeners in embed mode)
  useEffect(() => {
    if (!agentId || agentLoading) {
      return;
    }

    setLoading(true);
    setError('');

    console.log('ToolsManager - Loading MCP data for agentId:', agentId);

    // Load all data via API (no real-time Firestore listeners)
    loadMcpServers()
      .then(() => {
        console.log('ToolsManager - Successfully loaded MCP data');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading MCP data:', err);
        setError('Failed to load MCP data');
        setLoading(false);
      });
  }, [agentId, agentLoading, loadMcpServers]);

  // MCP Server handlers
  const handleEnableMcpServer = async (server) => {
    // Check if this is an API Tool (no installation field) or a private generic-api-mcp server
    const isPrivateGenericApiMcp = server.is_private &&
                                    server.installation?.args?.some(arg => arg.includes('@olbrain/generic-api-mcp'));

    if (!server.installation || isPrivateGenericApiMcp) {
      // API Tool or Private MCP Server - enable directly without configuration
      try {
        await saveMcpConfiguration(agentId, server.id, {}, server.is_private || false);
        await loadMcpServers();

        createNotification({
          type: 'success',
          title: isPrivateGenericApiMcp ? 'Private MCP Server Enabled' : 'API Tool Enabled',
          message: isPrivateGenericApiMcp
            ? 'Private MCP server has been successfully enabled using API tool credentials.'
            : 'API tool has been successfully enabled.'
        });
      } catch (error) {
        console.error('Failed to enable:', error);
        createNotification({
          type: 'error',
          title: 'Failed to Enable',
          message: error.message || 'Failed to enable. Please try again.'
        });
      }
    } else {
      // Public MCP Server - show configuration dialog
      setConfiguringMcpServer(server);
      setShowMcpConfigDialog(true);
    }
  };

  const handleConfigureMcpServer = (server) => {
    setConfiguringMcpServer(server);
    setShowMcpConfigDialog(true);
  };

  const handleDisableMcpServer = async (serverId) => {
    try {
      await deleteMcpConfiguration(agentId, serverId);
      await loadMcpServers();

      createNotification({
        type: 'success',
        title: 'MCP Server Disabled',
        message: 'MCP server has been successfully disabled.'
      });
    } catch (error) {
      console.error('Failed to disable MCP server:', error);
      createNotification({
        type: 'error',
        title: 'Failed to Disable',
        message: error.message || 'Failed to disable MCP server. Please try again.'
      });
    }
  };

  const handleSaveMcpConfig = async (serverId, configData) => {
    try {
      // Pass is_private flag from configuringMcpServer
      const isPrivate = configuringMcpServer?.is_private || false;
      await saveMcpConfiguration(agentId, serverId, configData, isPrivate);
      await loadMcpServers();

      createNotification({
        type: 'success',
        title: 'MCP Server Configured',
        message: 'MCP server configuration has been saved successfully.'
      });
    } catch (error) {
      console.error('Failed to save MCP configuration:', error);
      throw error;
    }
  };

  const handleCloseMcpConfigDialog = () => {
    setConfiguringMcpServer(null);
    setShowMcpConfigDialog(false);
  };

  // Test MCP server (for enabled servers or new configurations)
  const handleTestMcpServer = async (server) => {
    try {
      setTestingServerId(server.id);
      setTestResults(prev => ({ ...prev, [server.id]: null }));

      // Check if server is already enabled/configured
      const isEnabled = enabledMcpServers[server.id];

      let result;
      if (isEnabled) {
        // Test using existing configuration
        result = await testEnabledMcpServer(agentId, server.id, server);
      } else {
        // Test with empty configuration (for servers that don't require config)
        result = await testMcpConfiguration(agentId, server.id, {}, server);
      }

      setTestResults(prev => ({
        ...prev,
        [server.id]: {
          success: result.success || false,
          error: result.error || null,
          tools_count: result.tools_discovered?.length || 0,
          timestamp: new Date()
        }
      }));

      if (result.success) {
        createNotification({
          type: 'success',
          title: 'Connection Successful',
          message: `Successfully connected to ${server.name}. Discovered ${result.tools_discovered?.length || 0} tools.`
        });
      } else {
        createNotification({
          type: 'error',
          title: 'Connection Failed',
          message: result.error || 'Failed to connect to MCP server.'
        });
      }
    } catch (error) {
      console.error('Failed to test MCP server:', error);
      setTestResults(prev => ({
        ...prev,
        [server.id]: {
          success: false,
          error: error.message || 'Test failed',
          timestamp: new Date()
        }
      }));

      createNotification({
        type: 'error',
        title: 'Test Failed',
        message: error.message || 'Failed to test MCP server connection.'
      });
    } finally {
      setTestingServerId(null);
    }
  };

  // Add private MCP server
  const handleAddPrivateServer = async (serverConfig) => {
    try {
      await savePrivateMcpServer(agentId, serverConfig);
      await loadMcpServers();

      createNotification({
        type: 'success',
        title: 'Private Server Added',
        message: `Successfully added private server "${serverConfig.name}".`
      });
    } catch (error) {
      console.error('Failed to add private server:', error);
      createNotification({
        type: 'error',
        title: 'Failed to Add Server',
        message: error.message || 'Failed to add private MCP server.'
      });
      throw error;
    }
  };

  // Delete private MCP server
  const handleDeletePrivateServer = async (serverId) => {
    try {
      await deletePrivateMcpServer(agentId, serverId);
      await loadMcpServers();

      createNotification({
        type: 'success',
        title: 'Private Server Deleted',
        message: 'Successfully deleted private MCP server.'
      });
    } catch (error) {
      console.error('Failed to delete private server:', error);
      createNotification({
        type: 'error',
        title: 'Failed to Delete',
        message: error.message || 'Failed to delete private MCP server.'
      });
    }
  };

  // Handle loading states
  if (agentLoading || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {agentLoading ? 'Loading agent...' : 'Loading MCP servers...'}
        </Typography>
      </Box>
    );
  }

  // Handle agent errors
  if (agentError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          Failed to load agent data: {agentError}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Unable to load MCP servers
        </Typography>
      </Box>
    );
  }

  // Handle missing agent ID
  if (!agentId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Alert severity="warning" sx={{ mb: 2, maxWidth: 400 }}>
          No agent selected
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Select an agent to configure MCP servers
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Horizontal Split Layout: Sidebar + Main Panel */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <McpServerSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeMcpCount={getActiveServers().length}
          publicMcpCount={getPublicServers().length}
          privateMcpCount={getPrivateServers().length}
          apiToolsCount={apiTools.length}
        />

        {/* Main Panel - MCP Server Browser */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <McpServerBrowser
            agentId={agentId}
            servers={getFilteredServers()}
            apiTools={apiTools}
            activeTab={activeTab}
            enabledServers={enabledMcpServers}
            onEnableServer={handleEnableMcpServer}
            onConfigureServer={handleConfigureMcpServer}
            onDisableServer={handleDisableMcpServer}
            onTestServer={handleTestMcpServer}
            onAddPrivateServer={handleAddPrivateServer}
            onDeletePrivateServer={handleDeletePrivateServer}
            onAddApiTool={saveApiTool}
            onDeleteApiTool={deleteApiTool}
            onRefreshServers={loadMcpServers}
            testResults={testResults}
            testingServerId={testingServerId}
          />
        </Box>
      </Box>

      {/* MCP Configuration Dialog */}
      {configuringMcpServer && (
        <McpConfigDialog
          open={showMcpConfigDialog}
          onClose={handleCloseMcpConfigDialog}
          server={configuringMcpServer}
          existingConfig={enabledMcpServers[configuringMcpServer.id]?.configuration}
          onSave={handleSaveMcpConfig}
        />
      )}
    </Box>
  );
};

export default ToolsManager;