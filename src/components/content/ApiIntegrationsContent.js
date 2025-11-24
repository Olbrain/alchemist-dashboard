/**
 * API Integrations Content Component
 *
 * Manage MCP (Model Context Protocol) server integrations for agents
 */
import React, { useState } from 'react';
import {
  Box
} from '@mui/material';
import {
  Api as ApiIcon
} from '@mui/icons-material';

// Import components
import ToolsManager from '../AgentEditor/Tools/ToolsManager';
import NotificationSystem from '../shared/NotificationSystem';
import EmptyState from '../shared/EmptyState';

const ApiIntegrationsContent = ({ agentId }) => {
  // UI state
  const [notification, setNotification] = useState(null);

  // Handle notifications
  const handleNotification = (newNotification) => {
    setNotification(newNotification);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Show no agent selected state
  if (!agentId) {
    return (
      <EmptyState
        icon={ApiIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to configure MCP server integrations."
        useCard={true}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <ToolsManager
          agentId={agentId}
          onNotification={handleNotification}
          disabled={false}
        />
      </Box>

      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};

export default ApiIntegrationsContent;
