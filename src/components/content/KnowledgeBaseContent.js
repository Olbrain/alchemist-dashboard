/**
 * Knowledge Base Content Component
 *
 * Standalone knowledge base manager for MainContainer Build section
 */
import React, { useState } from 'react';
import {
  Box
} from '@mui/material';
import {
  MenuBook as KnowledgeBaseIcon
} from '@mui/icons-material';

// Import components
import SimpleAgentKnowledge from '../AgentEditor/KnowledgeBase/SimpleAgentKnowledge';
import NotificationSystem from '../shared/NotificationSystem';
import EmptyState from '../shared/EmptyState';

const KnowledgeBaseContent = ({ agentId }) => {
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
        icon={KnowledgeBaseIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to manage its knowledge base."
        useCard={true}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Main Panel - Files Content */}
      <SimpleAgentKnowledge
        agentId={agentId}
        onNotification={handleNotification}
        disabled={false}
      />

      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};

export default KnowledgeBaseContent;
