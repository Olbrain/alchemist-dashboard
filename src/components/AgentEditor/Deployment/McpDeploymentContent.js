/**
 * MCP Deployment Content Component
 *
 * Wrapper component that combines McpDeploymentSidebar and McpDeploymentManager.
 * Provides navigation between Status and History views.
 */
import React, { useState } from 'react';
import { Box } from '@mui/material';
import McpDeploymentSidebar from './McpDeploymentSidebar';
import McpDeploymentManager from './McpDeploymentManager';
import McpDeploymentHistory from './McpDeploymentHistory';

const McpDeploymentContent = ({ agentId }) => {
  const [activeTab, setActiveTab] = useState('status');

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar Navigation */}
      <McpDeploymentSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {activeTab === 'status' && (
          <McpDeploymentManager agentId={agentId} />
        )}

        {activeTab === 'history' && (
          <McpDeploymentHistory agentId={agentId} />
        )}
      </Box>
    </Box>
  );
};

export default McpDeploymentContent;
