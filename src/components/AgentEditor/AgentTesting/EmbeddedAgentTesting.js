/**
 * Embedded Agent Testing Component
 *
 * Simplified version of AgentTesting without context dependencies
 * Used specifically within AgentEditor
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Alert,
  Stack,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../../utils/AuthContext';
import {
  subscribeToSessionMessages
} from '../../../services/conversations/conversationService';
import { getDataAccess } from '../../../services/data/DataAccessFactory';
import apiKeyService from '../../../services/apiKeys/apiKeyService';

const EmbeddedAgentTesting = ({
  agent,
  isDeployed,
  healthStatus,
  isLoading,
  hasError,
  error
}) => {
  const { currentUser } = useAuth();
  const agentId = agent?.id;

  // Refs for stable references
  const agentEndpointRef = useRef(null);
  const sessionIdRef = useRef(null);
  const subscriptionRefs = useRef({ message: null, stats: null });
  const sessionStatsUnsubscribe = useRef(null);

  // API Key state
  const [testApiKey, setTestApiKey] = useState(null);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(null);

  // Session state
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Stats tracking
  const [messageStartTime, setMessageStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef(null);

  // Helper function to format elapsed time
  const formatElapsedTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Timer effect - updates elapsed time only while processing
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start timer only if we're actively processing a message
    if (isProcessing && messageStartTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - messageStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isProcessing, messageStartTime]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (sessionStatsUnsubscribe.current) {
        sessionStatsUnsubscribe.current();
        sessionStatsUnsubscribe.current = null;
      }
    };
  }, []);

  // Get agent endpoint
  const getAgentEndpoint = useCallback(async (agentId) => {
    try {
      const dataAccess = getDataAccess();
      const serverData = await dataAccess.getAgentServer(agentId);

      if (!serverData) {
        throw new Error('Agent server not found - agent may not be deployed');
      }

      if (!serverData.service_url || serverData.status !== 'active') {
        throw new Error(`Agent server not active (status: ${serverData.status || 'unknown'})`);
      }

      agentEndpointRef.current = serverData.service_url;
      return serverData.service_url;
    } catch (error) {
      console.error('Error getting agent endpoint:', error);
      throw error;
    }
  }, []);

  // Ensure test API key from agent_sessions
  const ensureTestApiKey = useCallback(async () => {
    if (testApiKey) return testApiKey;

    setIsCreatingApiKey(true);
    setApiKeyError(null);

    try {
      // Get or create API key from agent_sessions/test_{agent_id}
      const result = await apiKeyService.getOrCreateTestApiKeyInSession(
        agentId,
        currentUser?.uid
      );

      if (result.success && result.apiKey) {
        setTestApiKey(result.apiKey);
        // Cache in component state only (not localStorage)
        return result.apiKey;
      }

      throw new Error(result.error || 'Failed to get test API key');
    } catch (error) {
      console.error('Error ensuring test API key:', error);
      setApiKeyError(error.message);
      throw error;
    } finally {
      setIsCreatingApiKey(false);
    }
  }, [testApiKey, agentId, currentUser]);

  // Create testing session
  const getOrCreateTestingSession = useCallback(async () => {
    try {
      const testSessionId = `test_${agentId}`;

      // Get API key first (this also ensures session doc exists)
      const apiKey = await ensureTestApiKey();
      const agentEndpoint = await getAgentEndpoint(agentId);

      // Check if session exists on backend
      try {
        const checkResponse = await fetch(`${agentEndpoint}/sessions/${testSessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (checkResponse.ok) {
          console.log(`Using existing test session: ${testSessionId}`);
          sessionIdRef.current = testSessionId;
          return testSessionId;
        }
      } catch (error) {
        console.log('Test session not found, creating new one');
      }

      // Create new test session with test=true
      const currentOrgId = currentUser?.uid || 'default-org';

      const sessionPayload = {
        test: true, // This tells backend to create test_{agent_id} session
        agent_id: agentId,
        organization_id: currentOrgId,
        user_id: currentUser?.uid || 'test-user',
        title: `Testing Session for ${agent?.name || 'Agent'}`,
        channel: 'api',
        metadata: {
          user_context: {
            testing_mode: true,
            user_id: currentUser?.uid || 'test-user',
            user_email: currentUser?.email || null
          },
          integration_info: {
            source: 'agent_studio',
            interface: 'testing_panel',
            version: '1.0'
          },
          custom_fields: {
            session_type: 'agent_studio_testing',
            created_by: 'agent_studio',
            agent_id: agentId,
            is_persistent_test_session: true
          }
        }
      };

      const createResponse = await fetch(`${agentEndpoint}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(sessionPayload)
      });

      if (!createResponse.ok) {
        let errorMessage = `HTTP error! status: ${createResponse.status}`;

        if (createResponse.status === 401 || createResponse.status === 403) {
          // Clear cached key on auth failure
          setTestApiKey(null);
          errorMessage = `Authentication failed (${createResponse.status}). The test API key may be invalid. Please try again.`;
        } else {
          try {
            const errorData = await createResponse.json();
            if (errorData.detail) {
              errorMessage = `${errorData.detail} (HTTP ${createResponse.status})`;
            }
          } catch (parseError) {
            errorMessage = `HTTP ${createResponse.status}: ${createResponse.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await createResponse.json();
      sessionIdRef.current = data.session_id;
      console.log(`Created test session: ${data.session_id}`);
      return data.session_id;
    } catch (error) {
      console.error('Error in getOrCreateTestingSession:', error);
      throw new Error(error.message || 'Failed to create testing session');
    }
  }, [agentId, getAgentEndpoint, currentUser, ensureTestApiKey, agent]);

  // Subscribe to session stats for token usage tracking
  const subscribeToSessionStats = useCallback((sessionId) => {
    if (!sessionId) return;

    // Clean up any existing subscription
    if (sessionStatsUnsubscribe.current) {
      sessionStatsUnsubscribe.current();
      sessionStatsUnsubscribe.current = null;
    }

    const dataAccess = getDataAccess();

    // Use polling-based subscription to session stats
    const unsubscribe = dataAccess.subscribeToTestingSessionStats(sessionId, (stats) => {
      // Update total tokens from API polling
      if (stats.total_tokens) {
        setTotalTokens(stats.total_tokens);
        console.log('Token usage updated from API:', stats.total_tokens);
      }
    });

    sessionStatsUnsubscribe.current = unsubscribe;
    return unsubscribe;
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isSending || !isDeployed) return;

    const messageToSend = currentMessage.trim();
    setCurrentMessage('');
    setIsSending(true);

    // Start processing and timer for this message
    setIsProcessing(true);
    setMessageStartTime(Date.now());
    setElapsedTime(0); // Reset elapsed time for new message

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        setIsCreatingSession(true);

        try {
          currentSessionId = await getOrCreateTestingSession();
          setSessionId(currentSessionId);
          // Subscribe to session stats for token tracking
          subscribeToSessionStats(currentSessionId);
        } catch (sessionError) {
          console.error('Failed to create session:', sessionError);
          const errorMessage = {
            id: `msg-${Date.now()}`,
            type: 'error',
            content: `❌ Failed to create session: ${sessionError.message}`,
            timestamp: new Date().toISOString(),
            isDebugError: true
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        } finally {
          setIsCreatingSession(false);
        }
      }

      // Add user message
      const userMessage = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content: messageToSend,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      const agentEndpoint = await getAgentEndpoint(agentId);
      const apiKey = await ensureTestApiKey();

      const response = await fetch(`${agentEndpoint}/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          message: messageToSend,
          stream: false,
          user_id: currentUser?.uid || 'test-user',
          organization_id: currentUser?.uid || 'default-org',
          metadata: {
            channel_data: {
              source: 'agent_studio',
              interface: 'testing_panel',
              user_type: 'tester'
            },
            user_context: {
              user_id: currentUser?.uid || 'test-user',
              user_email: currentUser?.email || null,
              testing_mode: true
            },
          }
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          // Clear cached key on auth failure
          setTestApiKey(null);
          errorMessage = `Authentication failed (${response.status}). The test API key may be invalid. A new key will be created on the next message.`;
        } else {
          try {
            const errorData = await response.json();
            if (errorData.detail) {
              errorMessage = `${errorData.detail} (HTTP ${response.status})`;
            }
          } catch (parseError) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Stop processing and calculate final elapsed time
      setIsProcessing(false);
      if (messageStartTime) {
        const finalElapsedTime = Math.floor((Date.now() - messageStartTime) / 1000);
        setElapsedTime(finalElapsedTime);
      }

      // Token usage is tracked via Firestore subscription, not API response

      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'ai',
        content: responseData.response || responseData.message || responseData.content || 'No response received',
        timestamp: new Date().toISOString(),
        processing_time_ms: responseData.response_time_ms || 0,
        streaming: false
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Error sending message:', err);

      // Stop processing and calculate final elapsed time even on error
      setIsProcessing(false);
      if (messageStartTime) {
        const finalElapsedTime = Math.floor((Date.now() - messageStartTime) / 1000);
        setElapsedTime(finalElapsedTime);
      }

      let errorContent = 'Unknown error occurred';

      if (err.message) {
        errorContent = err.message;
      } else if (err.response?.data?.detail) {
        errorContent = err.response.data.detail;
      } else if (err.response?.statusText) {
        errorContent = `HTTP Error ${err.response.status}: ${err.response.statusText}`;
      } else if (typeof err === 'string') {
        errorContent = err;
      }

      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'error',
        content: `❌ Error: ${errorContent}`,
        timestamp: new Date().toISOString(),
        isDebugError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [currentMessage, isSending, isDeployed, agentId, sessionId, currentUser, getOrCreateTestingSession, getAgentEndpoint, ensureTestApiKey, messageStartTime]);

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Cannot access this agent'}
        </Alert>
      </Box>
    );
  }

  // Check for agent
  if (!agent) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Agent not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        position: 'relative'
      }}
    >
      {/* Chat Header */}
      <Box sx={{
        p: 3,
        pt: '88px',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'fixed',
        top: 0,
        left: { xs: 0, md: '280px' },
        right: 0,
        zIndex: 1200,
        boxSizing: 'border-box'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Live Agent Testing</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {isDeployed ? (
                <CheckIcon color="success" sx={{ fontSize: 16 }} />
              ) : (
                <ErrorIcon color="error" sx={{ fontSize: 16 }} />
              )}
              <Chip
                label={isDeployed ? "Deployed" : "Not Deployed"}
                color={isDeployed ? "success" : "error"}
                size="small"
                variant="outlined"
              />
              {/* API Key Status */}
              {isDeployed && (
                <>
                  {isCreatingApiKey ? (
                    <Chip
                      label="Creating API Key..."
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  ) : testApiKey ? (
                    <Chip
                      label="API Key Ready"
                      size="small"
                      variant="outlined"
                      color="success"
                    />
                  ) : apiKeyError ? (
                    <Chip
                      label="API Key Error"
                      size="small"
                      variant="outlined"
                      color="error"
                    />
                  ) : null}
                </>
              )}
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {healthStatus && (
              <Typography variant="caption" color={healthStatus.available ? 'success.main' : 'warning.main'}>
                {healthStatus.available ? '✓ Healthy' : '⚠ Health check failed'}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* API Key Error Alert */}
      {apiKeyError && (
        <Alert
          severity="warning"
          sx={{
            mx: 3,
            mt: '185px',
            mb: 2
          }}
          onClose={() => setApiKeyError(null)}
        >
          {apiKeyError}
        </Alert>
      )}

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 3,
          py: 2,
          pb: messages.length > 0 ? '220px' : '105px', // Extra space for stats bar when messages exist
          pt: apiKeyError ? '220px' : '185px',
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {messages.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
          >
            <BotIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Start chatting with {agent?.name || 'your agent'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {isDeployed ? 'Type a message below to start a new session and begin the conversation.' : 'Agent needs to be deployed first.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    backgroundColor:
                      message.type === 'error' ? (message.isDebugError ? '#d32f2f' : '#f44336') : '#f5f5f5',
                    color:
                      message.type === 'error' ? '#ffffff' : '#212121',
                    borderRadius: 2
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 1,
                        backgroundColor: '#222222'
                      }}
                    >
                      {message.type === 'user' ? (
                        <PersonIcon sx={{ fontSize: 16, color: 'white' }} />
                      ) : (
                        <BotIcon sx={{ fontSize: 16, color: 'white' }} />
                      )}
                    </Avatar>
                    <Typography variant="caption" sx={{color: '#000000'}}>
                      {message.type === 'user' ? 'You' : (agent?.name || 'Agent')}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#000000' }}>
                    {message.content}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                    {message.type === 'ai' && message.processing_time_ms > 0 && (
                      <Typography variant="caption" sx={{ opacity: 0.7, ml: 2 }}>
                        Response: {message.processing_time_ms < 1000 ? `${message.processing_time_ms}ms` : `${(message.processing_time_ms / 1000).toFixed(2)}s`}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Stats Bar - Fixed above input area */}
      {messages.length > 0 && (
        <Box sx={{
          position: 'fixed',
          bottom: '89px', // Height of input area
          left: { xs: 0, md: '280px' },
          right: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          px: 3,
          py: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          zIndex: 1199,
          minHeight: '32px'
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Messages: {messages.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tokens: {totalTokens.toLocaleString()}
            </Typography>
            {(isProcessing || elapsedTime > 0) && (
              <Typography variant="caption" color="text.secondary">
                Time: {formatElapsedTime(elapsedTime)}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Fixed Input Area */}
      <Box sx={{
        p: 3,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'fixed',
        bottom: 0,
        left: { xs: 0, md: '280px' },
        right: 0,
        zIndex: 1200,
        boxSizing: 'border-box',
        minHeight: '89px'
      }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder={isDeployed ? (isCreatingSession ? "Creating session..." : "Type your message...") : "Agent needs to be deployed first"}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isDeployed || isSending || isCreatingSession}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.default'
              }
            }}
          />
          <IconButton
            onClick={sendMessage}
            disabled={!isDeployed || !currentMessage.trim() || isSending || isCreatingSession}
            color="primary"
            sx={{ alignSelf: 'flex-end' }}
          >
            {isSending || isCreatingSession ? (
              <CircularProgress size={24} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default EmbeddedAgentTesting;