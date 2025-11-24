/**
 * Agent Conversations Content Component
 *
 * Two-panel conversation interface matching agent-dashboard design
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import ConversationSidebar from '../conversations/ConversationSidebar';
import ConversationMessagesView from '../conversations/ConversationMessagesView';
import EmptyState from '../shared/EmptyState';
import { getMessagesForSession, subscribeToAgentSessions } from '../../services/conversations/conversationService';
import { getAgent } from '../../services/agents/agentService';
import { AGENT_DASHBOARD_URL } from '../../services/config/apiConfig';

const AgentConversationsContent = ({ agentId }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [agentName, setAgentName] = useState(null);

  // Load agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId) return;

      try {
        const agentData = await getAgent(agentId);
        setAgentName(agentData?.basic_info?.name || agentData?.name || null);
      } catch (err) {
        console.error('Error fetching agent:', err);
      }
    };

    fetchAgentData();
  }, [agentId]);

  // Load sessions with real-time listener
  useEffect(() => {
    if (!agentId) {
      setLoadingSessions(false);
      return;
    }

    setLoadingSessions(true);

    // Set up real-time listener
    const unsubscribe = subscribeToAgentSessions(
      agentId,
      (sessionsData) => {
        console.log(`🔔 Received ${sessionsData.length} sessions from real-time listener`);
        setSessions(sessionsData || []);

        // Auto-select first session if available and none selected
        if (sessionsData && sessionsData.length > 0 && !selectedSession) {
          setSelectedSession(sessionsData[0]);
        }

        setLoadingSessions(false);
      },
      { limitCount: 10 }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('🔔 Cleaning up sessions listener');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]); // selectedSession intentionally omitted to avoid recreating listener on selection changes

  // Load messages when session is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedSession) {
        setSessionMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);

        const messagesData = await getMessagesForSession(
          selectedSession.session_id,
          agentId
        );
        setSessionMessages(messagesData || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setSessionMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [agentId, selectedSession]);

  // Handle session selection
  const handleSessionSelect = (session) => {
    if (selectedSession?.session_id === session.session_id) {
      return; // Already selected
    }
    setSelectedSession(session);
  };

  // Handle view all conversations
  const handleViewAllConversations = () => {
    if (!AGENT_DASHBOARD_URL) {
      alert('Agent Dashboard URL is not configured. Please contact support.');
      return;
    }

    const url = `${AGENT_DASHBOARD_URL}/${agentId}`;
    const newWindow = window.open(url, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert('Popup blocked! Please allow popups for this site to view conversations.');
    }
  };

  // Show "no agent selected" message
  if (!agentId) {
    return (
      <EmptyState
        icon={ChatIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to view its conversations."
        useCard={true}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left Panel: Sessions List */}
      <ConversationSidebar
        sessions={sessions}
        selectedSession={selectedSession}
        onSessionSelect={handleSessionSelect}
        loading={loadingSessions}
        onViewAll={handleViewAllConversations}
      />

      {/* Right Panel: Messages View */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ConversationMessagesView
          session={selectedSession}
          messages={sessionMessages}
          loading={loadingMessages}
          agentName={agentName}
        />
      </Box>
    </Box>
  );
};

export default AgentConversationsContent;
