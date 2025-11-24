/**
 * Agent Editor Content Component
 *
 * Simplified agent editor for MainContainer Build section
 * Provides direct access to Alchemist conversation interface
 */
import React, { useState } from 'react';
import {
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

// Import components
import AgentConversationPanel from '../Alchemist/AgentConversationPanel';
import NotificationSystem from '../shared/NotificationSystem';
import EmptyState from '../shared/EmptyState';

// Import hooks
import useAgentState from '../../hooks/useAgentState';

const AgentEditorContent = ({ agentId, onBack }) => {
  // Core state management
  const {
    agent,
    loading,
    error
  } = useAgentState(agentId);

  // UI state
  const [notification, setNotification] = useState(null);
  const [messages, setMessages] = useState([]);
  const [thoughtProcess, setThoughtProcess] = useState([]);

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Show loading spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  // Show no agent selected state
  if (!agentId) {
    return (
      <EmptyState
        icon={EditIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to start editing."
        useCard={true}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
          Agent Editor
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Chat with Alchemist to build and refine your agent
        </Typography>
      </Box>

      {/* Main Content - Alchemist Conversation */}
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <AgentConversationPanel
          agentId={agentId}
          projectId={agent?.project_id}
          messages={messages}
          onMessagesUpdate={setMessages}
          thoughtProcess={thoughtProcess}
          onThoughtProcessUpdate={setThoughtProcess}
          disabled={false}
          fullHeight={true}
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

export default AgentEditorContent;
