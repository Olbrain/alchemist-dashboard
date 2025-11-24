/**
 * Agent Conversation Panel
 * 
 * Interactive conversation interface with the Alchemist agent for agent configuration
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Fade,
  IconButton,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  subscribeToAgentConversations,
  subscribeToConversationStatistics,
  sendMessageToAPI,
  storeUserMessageToFirestore,
  initializeConversationSession
} from '../../services';
import ThoughtProcessDisplay from './ThoughtProcessDisplay';
import FileUploadModal from './FileUpload/FileUploadModal';
import TrackerProgressDisplay from './TrackerProgressDisplay';
import StatusActivityDisplay from './StatusActivityDisplay';
import TrackerPanel from './TrackerPanel';
import MessageContent from './MessageContent';
import { useAuth } from '../../utils/AuthContext';

const AgentConversationPanel = ({
  agentId,
  projectId,
  messages = [],
  onMessagesUpdate,
  thoughtProcess = [],
  onThoughtProcessUpdate,
  disabled = false,
  fullHeight = false,
  hideStats = false
}) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState('');
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const timerRef = useRef(null);
  const [messageStats, setMessageStats] = useState({
    totalMessages: 0,
    totalTokens: 0
  });
  const [inputAreaHeight, setInputAreaHeight] = useState(120); // Default height
  const [displayedMessageCount, setDisplayedMessageCount] = useState(20); // Initially show last 20 messages
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const inputAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto scroll to bottom when messages change
  // Timer effect for elapsed time
  useEffect(() => {
    if (loading && !timerRef.current) {
      // Start timer
      timerRef.current = setInterval(() => {
        // Timer running
      }, 100);
    } else if (!loading && timerRef.current) {
      // Stop timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Measure input area height dynamically
  useEffect(() => {
    if (!inputAreaRef.current) return;

    const measureHeight = () => {
      if (inputAreaRef.current) {
        const height = inputAreaRef.current.offsetHeight;
        setInputAreaHeight(height);
      }
    };

    // Initial measurement
    measureHeight();

    // Set up ResizeObserver for dynamic updates
    const currentRef = inputAreaRef.current;
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(currentRef);

    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }
      resizeObserver.disconnect();
    };
  }, [pendingAttachments, fullHeight]); // Re-measure when attachments change

  // Set up real-time conversation listener
  useEffect(() => {
    // All Alchemist conversations are now user-scoped
    const userId = currentUser?.uid;

    if (!userId) {
      console.warn('No userId available for conversation');
      return;
    }

    console.log(`Setting up real-time conversation listener for user: ${userId}`);
    setLoadingConversations(true);

    // Initialize conversation session
    initializeConversationSession(userId).catch(error => {
      console.warn('Failed to initialize conversation session:', error);
    });

    // Set up real-time message listener
    const unsubscribeMessages = subscribeToAgentConversations(
      userId,
      (messages) => {
        console.log(`Real-time update: received ${messages.length} messages`);

        // Check if we have a new assistant message (clear loading if so)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          setLoading(false); // Clear loading state when assistant responds
        }

        onMessagesUpdate(messages);
        setLoadingConversations(false);
        setError(''); // Clear any previous errors
      },
      (error) => {
        console.error('Real-time conversation subscription error:', error);
        setError('Failed to load conversation history');
        setLoadingConversations(false);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    // Set up real-time statistics listener
    const unsubscribeStats = subscribeToConversationStatistics(
      userId,
      (stats) => {
        console.log(`📊 Received statistics update:`, stats);
        setMessageStats({
          totalMessages: stats.totalMessages,
          totalTokens: stats.totalTokens
        });
      },
      (error) => {
        console.error('Failed to load conversation statistics:', error);
      }
    );

    return () => {
      console.log(`Cleaning up conversation listeners for user: ${userId}`);
      unsubscribeMessages();
      unsubscribeStats();
    };
  }, [currentUser?.uid, onMessagesUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate displayed messages (show last N messages)
  const displayedMessages = useMemo(() => {
    if (!messages.length) return [];
    return messages.slice(-displayedMessageCount);
  }, [messages, displayedMessageCount]);

  // Check if there are more messages to load
  const hasMoreMessages = messages.length > displayedMessageCount;

  // Load more messages function
  const loadMoreMessages = async () => {
    setLoadingMoreMessages(true);
    // Increase displayed count by 20 more messages
    const newCount = Math.min(displayedMessageCount + 20, messages.length);
    setDisplayedMessageCount(newCount);

    // Small delay to show loading state
    setTimeout(() => {
      setLoadingMoreMessages(false);
    }, 200);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || loading) return;

    const message = userInput.trim();

    // All Alchemist conversations are now user-scoped
    const userId = currentUser?.uid;

    if (!userId) {
      setError('Unable to send message: User not authenticated');
      return;
    }

    // Capture timestamp for response time tracking
    const messageSentTime = Date.now();

    // Extract only file references from pendingAttachments (not the local file objects)
    const attachmentRefs = pendingAttachments.length > 0
      ? pendingAttachments.map(att => ({
          attachment_id: att.attachment_id,
          name: att.name,
          url: att.url,
          type: att.type,
          size: att.size
        }))
      : null;

    const savedAttachments = [...pendingAttachments];
    setUserInput('');
    setPendingAttachments([]); // Clear pending attachments
    setError('');
    setLoading(true);

    try {
      // First, store user message with attachments and timestamp directly to Firestore
      console.log('📝 Storing user message to Firestore with attachments and timestamp');
      await storeUserMessageToFirestore(userId, message, attachmentRefs, messageSentTime);

      // Then send to API for processing (assistant response generation)
      console.log('📤 Sending message to API for processing');
      const response = await sendMessageToAPI(userId, message, attachmentRefs, projectId);

      console.log('✅ Message sent to API for processing');

      // If response includes tracker, it will be displayed automatically
      // when the message appears via the real-time listener
      if (response.tracker) {
        console.log('📊 Response includes tracker for real-time progress');
      }

      // Loading will be cleared when the assistant message appears
      // via the real-time listener (subscribeToAgentConversations)

    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setLoading(false);

      // Restore attachments on error (use the saved attachments)
      if (savedAttachments.length > 0) {
        setPendingAttachments(savedAttachments);
      }
    }
    // Don't clear loading here - let the real-time listener handle it
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (processedFiles, processingResults) => {
    console.log('Files processed:', processedFiles);
    console.log('Processing results:', processingResults);
    
    // Store processed files as pending attachments for the next message
    if (processedFiles && processedFiles.length > 0) {
      setPendingAttachments(processedFiles);

      // File attachments are now visually indicated - no need for text in input
    }
  };

  // Direct file selection handler
  const handleDirectFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setIsProcessingFiles(true);
    setError('');

    try {
      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setError('No valid files selected. Files must be under 10MB.');
        return;
      }

      // Process files if agentId exists
      if (agentId) {
        try {
          // Show local files immediately with loading state
          const localFiles = validFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            isUploading: true,
            localFile: file
          }));
          setPendingAttachments(prev => [...prev, ...localFiles]);

          // Upload files and get references
          const { uploadFilesForAgentCreation } = await import('../../services');
          const result = await uploadFilesForAgentCreation(validFiles, agentId);

          // Replace local files with uploaded file references
          const processedFiles = result.processed_files || [];

          // Update pending attachments with uploaded references
          setPendingAttachments(prev => {
            // Remove the uploading files and add the processed ones
            const withoutLocal = prev.filter(att => !att.isUploading);
            return [...withoutLocal, ...processedFiles.map(file => ({
              // Use the exact structure from API response
              attachment_id: file.attachment_id,
              name: file.name,
              url: file.url,
              type: file.type,
              size: file.size,
              isUploaded: true
            }))];
          });

          // File upload successful - visual indicators are sufficient
          // No need to add text to input field
        } catch (err) {
          console.error('File upload error:', err);
          setError(`Failed to upload files: ${err.message || 'Please try again.'}`);
          // Remove the uploading files on error
          setPendingAttachments(prev => prev.filter(att => !att.isUploading));
        }
      } else {
        // Add files directly without processing (no agentId)
        setPendingAttachments(prev => [...prev, ...validFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          localFile: file
        }))]);
      }

    } catch (err) {
      console.error('File selection error:', err);
      setError(`Failed to attach files: ${err.message || 'Please try again.'}`);
    } finally {
      setIsProcessingFiles(false);
      // Clear input for next selection
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      // Create a synthetic event for the file handler
      const syntheticEvent = { target: { files } };
      await handleDirectFileSelect(syntheticEvent);
    }
  };


  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    const isError = message.isError;

    // Determine sender name
    const senderName = isUser
      ? (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'You')
      : 'Alchemist';

    return (
      <Fade in={true} key={message.id}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 2
          }}
        >
          <Paper
            elevation={0}
            sx={{
              py: 1.5,
              px: 2,
              maxWidth: '80%',
              bgcolor: isUser
                ? (theme) => theme.palette.mode === 'dark' ? '#0d47a1' : '#e3f2fd'
                : isError
                  ? (theme) => theme.palette.mode === 'dark' ? '#444444' : '#f0f0f0'
                  : (theme) => theme.palette.mode === 'dark' ? '#1b5e20' : '#e8f5e9',
              color: isUser
                ? (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                : isError
                  ? (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                  : (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              borderRadius: 2,
              border: '1px solid',
              borderColor: isUser
                ? (theme) => theme.palette.mode === 'dark' ? '#1976d2' : '#90caf9'
                : (theme) => theme.palette.mode === 'dark' ? '#2e7d32' : '#66bb6a'
            }}
          >
            {/* Sender Name Header */}
            <Typography
              variant="body2"
              sx={{
                display: 'block',
                mb: 0.5,
                fontWeight: 'bold',
                color: isUser
                  ? (theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2')  // Blue for user
                  : (theme.palette.mode === 'dark' ? '#66bb6a' : '#2e7d32'),  // Green for AI
                fontSize: '0.85rem'  // Smaller font size
              }}
            >
              {senderName} {!isUser && '🤖'}
            </Typography>

            {/* Use MessageContent for rich text rendering */}
            <MessageContent
              content={message.content}
              attachments={message.attachments}
              metadata={message.metadata}
              isUser={isUser}
              darkMode={theme.palette.mode === 'dark'}
              fontSize="body2"
              isStreaming={false}
            />

            {/* Display tracker progress if present */}
            {message.metadata?.tracker && (
              <TrackerProgressDisplay tracker={message.metadata.tracker} />
            )}

            {/* Time and Response Time - Separated */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.75 }}>
              {/* Timestamp - Bottom Left */}
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.7,
                  fontSize: '0.65rem'
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>

              {/* Response Time - Bottom Right (agent messages only) */}
              {!isUser && message.response_time > 0 && (
                <Typography
                  variant="caption"
                  color="success.main"
                  fontSize="0.65rem"
                  sx={{
                    opacity: 0.8,
                    fontWeight: 500,
                    px: 0.5,
                    py: 0.1,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderRadius: 0.5
                  }}
                >
                  {message.response_time >= 1000
                    ? `${(message.response_time / 1000).toFixed(1)}s`
                    : `${message.response_time}ms`}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Fade>
    );
  };

  if (fullHeight) {
    // Full height layout with tabs and fixed input at bottom
    return (
      <Box
        sx={{
          flex: 1, // Use flex to take remaining space when used with external header
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          position: 'relative',
          minHeight: 0 // Prevent flex item from overflowing
        }}
      >

        {/* Content Area - Takes full height minus input */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            width: '100%'
          }}
        >
          {/* Conversation Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 3,
                py: 2,
                pb: `${inputAreaHeight + 40}px`, // Increased buffer space for input area
                minHeight: 0,
                width: '100%',
                // Add smooth scrolling and performance optimizations
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                }
              }}
            >
          {loadingConversations ? (
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Loading conversation history...
              </Typography>
              <Typography variant="body2">
                Fetching your previous conversations with Alchemist
              </Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              <PsychologyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Start a conversation
              </Typography>
              <Typography variant="body2">
                Ask Alchemist to help you configure your agent
              </Typography>
            </Box>
          ) : (
            <>
              {/* Load More Messages Button */}
              {hasMoreMessages && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={loadMoreMessages}
                    disabled={loadingMoreMessages}
                    startIcon={loadingMoreMessages ? <CircularProgress size={16} /> : null}
                    sx={{ textTransform: 'none' }}
                  >
                    {loadingMoreMessages ? 'Loading...' : `Load ${Math.min(20, messages.length - displayedMessageCount)} earlier messages`}
                  </Button>
                </Box>
              )}

              {displayedMessages.map(renderMessage)}
              {/* Scroll spacer to ensure last message is visible */}
              <Box sx={{ minHeight: 20, height: 20 }} />
              <div ref={messagesEndRef} />
            </>
          )}
            </Box>
        </Box>

        {/* Thought Process - Above input */}
        {thoughtProcess.length > 0 && (
          <Box sx={{
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <ThoughtProcessDisplay thoughtProcess={thoughtProcess} />
          </Box>
        )}

        {/* Error Display - Above input */}
        {error && (
          <Box sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        )}

        {/* File Upload Modal */}
        <FileUploadModal
          open={fileUploadModalOpen}
          onClose={() => setFileUploadModalOpen(false)}
          onFilesUploaded={handleFileUpload}
          fileType="all"
          agentId={agentId}
          maxFiles={5}
        />

        {/* Sticky Input Area at Bottom - Redesigned */}
        <Box
          ref={inputAreaRef}
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            bottom: 0,
            zIndex: 100,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Tracker Panel */}
            <TrackerPanel
              agentId={agentId}
              sx={{
                borderRadius: 0,
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            />

            {/* Main Input Container */}
            <Box sx={{ p: 2 }}>
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.docx,.json,.yaml,.yml"
                onChange={handleDirectFileSelect}
                style={{ display: 'none' }}
              />

              {/* Unified Input Container with Attachments and Drag & Drop */}
              <Paper
                elevation={0}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: '2px solid',
                  borderColor: isDragging ? 'primary.main' : 'divider',
                  borderStyle: isDragging ? 'dashed' : 'solid',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: isDragging ? 'action.hover' : 'background.paper',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Drag Overlay */}
                {isDragging && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        bgcolor: 'primary.main',
                        px: 3,
                        py: 1.5,
                        borderRadius: 2
                      }}
                    >
                      📎 Drop files here to attach
                    </Typography>
                  </Box>
                )}


              {/* Compact Attachments Section */}
              {pendingAttachments.length > 0 && (
                <Box sx={{
                  px: 1,
                  py: 0.5,
                  borderBottom: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(58, 69, 83, 0.5)' : 'rgba(225, 232, 237, 0.5)',
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(26, 35, 50, 0.5)'
                    : 'rgba(245, 247, 250, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': {
                    height: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                  }
                }}>
                  {/* Compact file count badge */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.75,
                    py: 0.25,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 1,
                    minWidth: 'fit-content'
                  }}>
                    <AttachFileIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      {pendingAttachments.length}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', alignItems: 'center' }}>
                    {pendingAttachments.slice(0, 3).map((attachment, index) => (
                      <Chip
                        key={index}
                        size="small"
                        sx={{
                          height: 24,
                          maxWidth: 150,
                          bgcolor: attachment.isUploading
                            ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 183, 77, 0.2)' : 'rgba(255, 183, 77, 0.15)'
                            : attachment.isUploaded
                              ? (theme) => theme.palette.mode === 'dark' ? 'rgba(102, 187, 106, 0.2)' : 'rgba(102, 187, 106, 0.15)'
                              : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                          border: '1px solid',
                          borderColor: attachment.isUploading
                            ? 'rgba(255, 183, 77, 0.5)'
                            : attachment.isUploaded
                              ? 'rgba(102, 187, 106, 0.5)'
                              : 'transparent',
                          '& .MuiChip-label': {
                            px: 0.75,
                            fontSize: '0.7rem',
                            fontWeight: 500
                          },
                          '& .MuiChip-deleteIcon': {
                            fontSize: 14,
                            ml: -0.5
                          }
                        }}
                        icon={
                          attachment.isUploading ? (
                            <CircularProgress size={14} thickness={5} sx={{ color: '#FFB74D' }} />
                          ) : attachment.type?.startsWith('image/') ? (
                            <ImageIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <AttachFileIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        label={attachment.name ?
                          (attachment.name.length > 15 ?
                            attachment.name.substring(0, 12) + '...' :
                            attachment.name) :
                          `File ${index + 1}`
                        }
                        onDelete={() => setPendingAttachments(prev => prev.filter((_, i) => i !== index))}
                        deleteIcon={<CloseIcon />}
                      />
                    ))}

                    {/* Show +N more if there are more than 3 files */}
                    {pendingAttachments.length > 3 && (
                      <Chip
                        size="small"
                        label={`+${pendingAttachments.length - 3} more`}
                        sx={{
                          height: 24,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Input Field Section */}
              <Box sx={{
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                p: 1
              }}>
                {/* Direct Attachment Button */}
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || loading || isProcessingFiles}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    opacity: isProcessingFiles ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      bgcolor: isProcessingFiles ? 'transparent' : 'action.hover'
                    }
                  }}
                >
                  <AttachFileIcon />
                </IconButton>

                {/* Input Field */}
                <TextField
                  ref={inputRef}
                  fullWidth
                  multiline
                  maxRows={3}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Alchemist to help configure your agent..."
                  disabled={disabled || loading}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: '0.95rem'
                    }
                  }}
                />

                {/* Send Button */}
                <IconButton
                  onClick={handleSendMessage}
                  disabled={disabled || loading || (!userInput.trim() && pendingAttachments.length === 0)}
                  color="primary"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                </IconButton>
              </Box>
            </Paper>
          </Box>

          {/* Status and Statistics Bar */}
          {!hideStats && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}>
              {/* Left side: Orchestrator Status - 70% width */}
              <Box sx={{ flex: '0 0 70%' }}>
                <StatusActivityDisplay
                  agentId={agentId}
                  showFullDetails={true}
                  loading={loading}
                />
              </Box>

              {/* Right side: Messages and Tokens - 30% width */}
              <Box sx={{
                flex: '0 0 30%',
                display: 'flex',
                justifyContent: 'flex-end',
                px: 2,
                py: 0.5
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  Messages: {messageStats.totalMessages.toLocaleString()} • Tokens: {messageStats.totalTokens.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Original layout for other sections
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, bgcolor: 'background.default', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            Alchemist Assistant
          </Typography>
          <Chip
            label="AI-Powered"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 2 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Chat with Alchemist to configure your agent using natural language
        </Typography>
      </Box>

      {/* Status Bar */}
      <Box sx={{ px: 3, pb: 2 }}>
        <StatusActivityDisplay
          agentId={agentId}
          showFullDetails={true}
          loading={loading}
        />
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Conversation Content */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              }
            }}
          >
        {loadingConversations ? (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Loading conversation history...
            </Typography>
            <Typography variant="body2">
              Fetching your previous conversations with Alchemist
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            <PsychologyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Start a conversation
            </Typography>
            <Typography variant="body2">
              Ask Alchemist to help you configure your agent
            </Typography>
          </Box>
        ) : (
          <>
            {/* Load More Messages Button */}
            {hasMoreMessages && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadMoreMessages}
                  disabled={loadingMoreMessages}
                  startIcon={loadingMoreMessages ? <CircularProgress size={16} /> : null}
                  sx={{ textTransform: 'none' }}
                >
                  {loadingMoreMessages ? 'Loading...' : `Load ${Math.min(20, messages.length - displayedMessageCount)} earlier messages`}
                </Button>
              </Box>
            )}

            {displayedMessages.map(renderMessage)}
            {/* Scroll spacer to ensure last message is visible */}
            <Box sx={{ minHeight: 20, height: 20 }} />
            <div ref={messagesEndRef} />
          </>
        )}
          </Box>
      </Box>

      {/* Thought Process */}
      {thoughtProcess.length > 0 && (
        <>
          <Divider />
          <ThoughtProcessDisplay thoughtProcess={thoughtProcess} />
        </>
      )}

      {/* Error Display */}
      {error && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        </>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        open={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
        onFilesUploaded={handleFileUpload}
        fileType="all"
        agentId={agentId}
        maxFiles={5}
      />

      {/* Input Area - Redesigned */}
      <>
        {/* Tracker Panel for regular layout */}
        <TrackerPanel
          agentId={agentId}
          sx={{
            borderRadius: 0,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        />

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper'
        }}>
          {/* Main Input Container */}
          <Box sx={{ p: 2 }}>
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.docx,.json,.yaml,.yml"
              onChange={handleDirectFileSelect}
              style={{ display: 'none' }}
            />

            {/* Unified Input Container with Attachments and Drag & Drop */}
            <Paper
              elevation={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: '2px solid',
                borderColor: isDragging ? 'primary.main' : 'divider',
                borderStyle: isDragging ? 'dashed' : 'solid',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: isDragging ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Drag Overlay */}
              {isDragging && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      bgcolor: 'primary.main',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2
                    }}
                  >
                    📎 Drop files here to attach
                  </Typography>
                </Box>
              )}


              {/* Compact Attachments Section */}
              {pendingAttachments.length > 0 && (
                <Box sx={{
                  px: 1,
                  py: 0.5,
                  borderBottom: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(58, 69, 83, 0.5)' : 'rgba(225, 232, 237, 0.5)',
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(26, 35, 50, 0.5)'
                    : 'rgba(245, 247, 250, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': {
                    height: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                  }
                }}>
                  {/* Compact file count badge */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.75,
                    py: 0.25,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 1,
                    minWidth: 'fit-content'
                  }}>
                    <AttachFileIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      {pendingAttachments.length}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', alignItems: 'center' }}>
                    {pendingAttachments.slice(0, 3).map((attachment, index) => (
                      <Chip
                        key={index}
                        size="small"
                        sx={{
                          height: 24,
                          maxWidth: 150,
                          bgcolor: attachment.isUploading
                            ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 183, 77, 0.2)' : 'rgba(255, 183, 77, 0.15)'
                            : attachment.isUploaded
                              ? (theme) => theme.palette.mode === 'dark' ? 'rgba(102, 187, 106, 0.2)' : 'rgba(102, 187, 106, 0.15)'
                              : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                          border: '1px solid',
                          borderColor: attachment.isUploading
                            ? 'rgba(255, 183, 77, 0.5)'
                            : attachment.isUploaded
                              ? 'rgba(102, 187, 106, 0.5)'
                              : 'transparent',
                          '& .MuiChip-label': {
                            px: 0.75,
                            fontSize: '0.7rem',
                            fontWeight: 500
                          },
                          '& .MuiChip-deleteIcon': {
                            fontSize: 14,
                            ml: -0.5
                          }
                        }}
                        icon={
                          attachment.isUploading ? (
                            <CircularProgress size={14} thickness={5} sx={{ color: '#FFB74D' }} />
                          ) : attachment.type?.startsWith('image/') ? (
                            <ImageIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <AttachFileIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        label={attachment.name ?
                          (attachment.name.length > 15 ?
                            attachment.name.substring(0, 12) + '...' :
                            attachment.name) :
                          `File ${index + 1}`
                        }
                        onDelete={() => setPendingAttachments(prev => prev.filter((_, i) => i !== index))}
                        deleteIcon={<CloseIcon />}
                      />
                    ))}

                    {/* Show +N more if there are more than 3 files */}
                    {pendingAttachments.length > 3 && (
                      <Chip
                        size="small"
                        label={`+${pendingAttachments.length - 3} more`}
                        sx={{
                          height: 24,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Input Field Section */}
              <Box sx={{
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                p: 1
              }}>
                {/* Direct Attachment Button */}
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || loading || isProcessingFiles}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    opacity: isProcessingFiles ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      bgcolor: isProcessingFiles ? 'transparent' : 'action.hover'
                    }
                  }}
                >
                  <AttachFileIcon />
                </IconButton>

                {/* Input Field */}
                <TextField
                  ref={inputRef}
                  fullWidth
                  multiline
                  maxRows={3}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Alchemist to help configure your agent..."
                  disabled={disabled || loading}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: '0.95rem'
                    }
                  }}
                />

                {/* Send Button */}
                <IconButton
                  onClick={handleSendMessage}
                  disabled={disabled || loading || (!userInput.trim() && pendingAttachments.length === 0)}
                  color="primary"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                </IconButton>
              </Box>
            </Paper>
          </Box>

          {/* Status and Statistics Bar */}
          {!hideStats && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}>
              {/* Left side: Orchestrator Status - 70% width */}
              <Box sx={{ flex: '0 0 70%' }}>
                <StatusActivityDisplay
                  agentId={agentId}
                  showFullDetails={true}
                  loading={loading}
                />
              </Box>

              {/* Right side: Messages and Tokens - 30% width */}
              <Box sx={{
                flex: '0 0 30%',
                display: 'flex',
                justifyContent: 'flex-end',
                px: 2,
                py: 0.5
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  Messages: {messageStats.totalMessages.toLocaleString()} • Tokens: {messageStats.totalTokens.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </>
    </Paper>
  );
};

export default AgentConversationPanel;