/**
 * Agent Prompt Builder Content Component
 *
 * Main component for the Build section's Prompt Builder page
 * Provides a form-based interface for creating agent prompts
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Article as ArticleIcon
} from '@mui/icons-material';

// Import components
import PromptSectionForm from '../AgentPromptBuilder/PromptSectionForm';
import PromptSectionSidebar from '../AgentPromptBuilder/PromptSectionSidebar';
import EmptyState from '../shared/EmptyState';
import NotificationSystem from '../shared/NotificationSystem';

// Import hooks and services
import usePromptBuilder from '../../hooks/usePromptBuilder';
import { getAllSectionNames, SECTION_METADATA, clearPromptSection } from '../../services/prompts/promptBuilderService';

const AgentPromptBuilderContent = ({ agentId }) => {
  const {
    sections,
    progress,
    loading,
    saving,
    error,
    activeSection,
    setActiveSection,
    updateSection,
    isComplete,
    completionPercentage
  } = usePromptBuilder(agentId);

  // Extract agent context from Identity section
  const agentContext = React.useMemo(() => {
    const identitySection = sections?.identity;
    let role = 'assistant';
    let domain = 'general';
    let purpose = '';
    let users = 'users';

    if (identitySection?.content) {
      // Content is already an object (transformed by hook), no parsing needed
      const identityData = identitySection.content;
      role = identityData.role || 'assistant';
      domain = identityData.domain || 'general';
      purpose = identityData.purpose || '';
      users = identityData.users || 'users';
    }

    return {
      agent_type: role,
      industry: domain,
      use_case: purpose,
      target_users: users
    };
  }, [sections]);

  const [notification, setNotification] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [sectionToClear, setSectionToClear] = useState(null);

  // Get all section names
  const allSections = getAllSectionNames();

  // Handle section change from sidebar
  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
  }, [setActiveSection]);

  // Handle clear section
  const handleClearSection = useCallback((sectionName) => {
    setSectionToClear(sectionName);
    setClearDialogOpen(true);
  }, []);

  // Confirm clear section
  const confirmClearSection = useCallback(async () => {
    if (!sectionToClear || !agentId) return;

    try {
      await clearPromptSection(agentId, sectionToClear);
      updateSection(sectionToClear, '', false);
      setNotification({
        type: 'success',
        message: `${SECTION_METADATA[sectionToClear].title} section cleared`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Failed to clear section: ${err.message}`
      });
    } finally {
      setClearDialogOpen(false);
      setSectionToClear(null);
    }
  }, [sectionToClear, agentId, updateSection]);

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Build section status for sidebar (must be before early returns)
  const currentSection = sections?.[activeSection] || {
    content: {},
    completed: false
  };
  const sectionStatus = React.useMemo(() => {
    const status = {};
    allSections.forEach(sectionName => {
      const sectionData = sections?.[sectionName];
      status[sectionName] = {
        completed: sectionData?.completed || false,
        progress: 0 // Can be calculated based on content length if needed
      };
    });
    return status;
  }, [sections, allSections]);

  // Show loading spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show no agent selected state
  if (!agentId) {
    return (
      <EmptyState
        icon={ArticleIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to start building prompts."
        useCard={true}
      />
    );
  }

  // Show error state
  if (error && !sections) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Error Loading Prompt Builder
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Left Sidebar with Progress */}
      <PromptSectionSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        sectionStatus={sectionStatus}
        progress={progress}
        completionPercentage={completionPercentage}
        isComplete={isComplete}
        saving={saving}
      />

      {/* Main Panel - Section Form with AI Assistant */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3, pb: 8, display: 'flex', gap: 2 }}>
        {/* Left: Form */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {currentSection && (
            <>
              <PromptSectionForm
                key={activeSection}
                sectionName={activeSection}
                content={currentSection.content}
                completed={currentSection.completed}
                onUpdate={(content) => updateSection(activeSection, content)}
                onClear={handleClearSection}
                disabled={false}
                autoSave={true}
                agentId={agentId}
                agentContext={agentContext}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Clear Section Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Clear Section?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear the {sectionToClear && SECTION_METADATA[sectionToClear]?.title} section?
            This will remove all content and mark it as incomplete. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmClearSection} color="error" variant="contained">
            Clear Section
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};

export default AgentPromptBuilderContent;
