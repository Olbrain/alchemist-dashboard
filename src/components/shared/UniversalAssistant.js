/**
 * Universal Assistant Component
 *
 * Drawer component for Alchemist conversation
 * Works independently without requiring an agent to be selected
 * Controlled component - open state managed by parent
 */
import React, { useState } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AutoAwesome as AlchemistIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AgentConversationPanel from '../Alchemist/AgentConversationPanel';
import { CardTitle } from '../../utils/typography';
import { useAuth } from '../../utils/AuthContext';

const UniversalAssistant = ({ open, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [thoughtProcess, setThoughtProcess] = useState([]);
  const { currentProject } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onToggle}
      PaperProps={{
          sx: {
            width: isMobile ? '100%' : 450,
            height: isMobile ? '85vh' : '100vh',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlchemistIcon />
            <CardTitle>
              Alchemist Assistant
            </CardTitle>
          </Box>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{ color: 'inherit' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Conversation Panel */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AgentConversationPanel
            projectId={currentProject}
            messages={messages}
            onMessagesUpdate={setMessages}
            thoughtProcess={thoughtProcess}
            onThoughtProcessUpdate={setThoughtProcess}
            fullHeight={true}
            hideStats={true}
          />
        </Box>
      </Drawer>
  );
};

export default UniversalAssistant;
