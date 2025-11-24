/**
 * Tiledesk Connect Existing Bot Component
 *
 * Connect an existing Tiledesk bot with manual or automated configuration
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Typography
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
  ChatBubbleOutline as TiledeskIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import tiledeskService from '../../../services/tiledesk/tiledeskService';
import TiledeskBotList from './components/TiledeskBotList';
import TiledeskManualConfig from './components/TiledeskManualConfig';
import { PageTitle, CardTitle, SectionTitle, SectionDescription, HelperText } from '../../../utils/typography';

const TiledeskConnectExisting = ({ agentId, projectId, apiToken, onSuccess, onError, onNotification }) => {
  const [bots, setBots] = useState([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [botsFetched, setBotsFetched] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [connectedBot, setConnectedBot] = useState(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [automatedModalOpen, setAutomatedModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  const loadConnectedBot = useCallback(async () => {
    try {
      const result = await tiledeskService.getBot(agentId);
      if (result && result.bot_id) {
        setConnectedBot(result);
      }
    } catch (error) {
      console.error('Error loading connected bot:', error);
      // Silently fail - it's okay if there's no connected bot
    }
  }, [agentId]);

  // Generate webhook URL and load connected bot on mount
  useEffect(() => {
    const generatedUrl = `https://agent-${agentId.toLowerCase()}.run.app/api/tiledesk/webhook`;
    setWebhookUrl(generatedUrl);
    loadConnectedBot();
  }, [agentId, loadConnectedBot]);

  const loadBots = async () => {
    try {
      setLoadingBots(true);
      const result = await tiledeskService.listBots(projectId, apiToken);
      setBots(result);
      setBotsFetched(true);
    } catch (error) {
      console.error('Error loading bots:', error);
      if (onError) onError('Failed to load bots. Please check your credentials.');
    } finally {
      setLoadingBots(false);
    }
  };

  // Return all bots - treating all as internal bots with REST API fallback
  const getFilteredBots = () => {
    return bots;
  };

  const handleSelectBot = (bot) => {
    setSelectedBot(bot);
    setAutomatedModalOpen(true);
  };

  const handleCloseManualModal = () => {
    setManualModalOpen(false);
  };

  const handleCloseAutomatedModal = () => {
    setAutomatedModalOpen(false);
  };

  const handleConnectAutomated = async () => {
    try {
      if (!selectedBot) {
        if (onError) onError('Please select a bot from the list');
        return;
      }

      setConnectLoading(true);

      // Step 1: Connect existing bot via agent-bridge
      const result = await tiledeskService.connectExistingBot(
        agentId,
        projectId,
        apiToken,
        selectedBot._id,
        selectedBot.name
      );

      if (result.success) {
        // Update connected bot state
        setConnectedBot({
          bot_id: selectedBot._id,
          bot_name: selectedBot.name,
          bot_type: result.bot_type,
          integration_type: result.integration_type
        });
        handleCloseAutomatedModal();

        // Show appropriate success message based on integration type
        if (result.integration_type === 'rest_fallback') {
          if (onNotification) onNotification(
            'Internal bot connected! Unknown queries will be handled by AI agent via REST API fallback.',
            'success'
          );
        } else {
          if (onNotification) onNotification(
            'External bot connected! All messages will be handled by AI agent.',
            'success'
          );
        }

        if (onSuccess) onSuccess(result);
      } else {
        if (onError) onError('Failed to connect existing bot');
      }
    } catch (error) {
      console.error('Error connecting existing bot:', error);
      if (onError) onError(error.message || 'Failed to connect existing bot');
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle gutterBottom sx={{ mb: 2 }}>
        Connect Existing Tiledesk Bot
      </PageTitle>

      <Alert severity="info" sx={{ mb: 3 }}>
        Choose how you want to configure your bot
      </Alert>

      {/* Side-by-Side Configuration Options */}
      <Grid container spacing={3}>
        {/* Manual Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 2,
                borderColor: 'primary.main'
              }
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <MenuBookIcon color="primary" fontSize="large" />
                <CardTitle fontWeight="medium">
                  Manual Configuration
                </CardTitle>
              </Box>
              <SectionDescription mb={3} sx={{ flex: 1 }}>
                Get webhook URL and instructions to manually configure any Tiledesk bot.
                No need to fetch bots from your project.
              </SectionDescription>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => setManualModalOpen(true)}
                startIcon={<MenuBookIcon />}
              >
                View Instructions
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Automated Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 2,
                borderColor: 'primary.main'
              }
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SettingsIcon color="primary" fontSize="large" />
                <CardTitle fontWeight="medium">
                  Automated Configuration
                </CardTitle>
              </Box>
              <SectionDescription mb={3} sx={{ flex: 1 }}>
                Select a bot from your Tiledesk project and automatically configure its webhook with one click.
              </SectionDescription>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={loadBots}
                disabled={loadingBots}
                startIcon={loadingBots ? <CircularProgress size={20} /> : <TiledeskIcon />}
              >
                {loadingBots ? 'Fetching Bots...' : 'Fetch Bots'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bot List - Shows after fetching */}
      {botsFetched && bots.length > 0 && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <SectionTitle gutterBottom fontWeight="medium">
              Select a Bot from Your Project
            </SectionTitle>
            <HelperText display="block" mb={2}>
              Click a bot to enable AI agent fallback. Your bot will handle known intents, and unknown queries will be forwarded to the AI agent.
            </HelperText>

            <TiledeskBotList
              bots={getFilteredBots()}
              loading={loadingBots}
              onSelectBot={handleSelectBot}
              selectedBotId={selectedBot?._id}
              connectedBotId={connectedBot?.bot_id}
            />
          </CardContent>
        </Card>
      )}

      {/* Manual Configuration Modal */}
      <Dialog
        open={manualModalOpen}
        onClose={handleCloseManualModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <MenuBookIcon color="primary" />
              <CardTitle>Manual Configuration</CardTitle>
            </Box>
            <IconButton onClick={handleCloseManualModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            Follow these steps to manually configure the webhook in your Tiledesk dashboard
          </Alert>
          <TiledeskManualConfig
            webhookUrl={webhookUrl}
            onCopy={onNotification}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseManualModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Automated Configuration Modal */}
      <Dialog
        open={automatedModalOpen}
        onClose={handleCloseAutomatedModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <SettingsIcon color="primary" />
              <Box>
                <CardTitle>Connect Bot Automatically</CardTitle>
                {selectedBot && (
                  <HelperText>
                    {selectedBot.name}
                  </HelperText>
                )}
              </Box>
            </Box>
            <IconButton onClick={handleCloseAutomatedModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedBot && (
            <Box>
              <Box mb={3}>
                <SectionTitle gutterBottom>
                  Selected Bot:
                </SectionTitle>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <CardTitle fontWeight="medium">
                    {selectedBot.name}
                  </CardTitle>
                  <HelperText sx={{ fontFamily: 'monospace' }}>
                    ID: {selectedBot._id}
                  </HelperText>
                </Card>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>AI Agent Fallback Integration</strong>
                </Typography>
                <Typography variant="body2">
                  • Your bot will handle known intents
                </Typography>
                <Typography variant="body2">
                  • Unknown queries will be automatically forwarded to the AI agent
                </Typography>
                <Typography variant="body2">
                  • The defaultFallback intent will be configured with REST API integration
                </Typography>
              </Alert>

              <Button
                variant="contained"
                fullWidth
                onClick={handleConnectAutomated}
                disabled={connectLoading}
                startIcon={connectLoading ? <CircularProgress size={20} /> : <TiledeskIcon />}
                size="large"
              >
                {connectLoading ? 'Connecting...' : 'Connect Bot Automatically'}
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseAutomatedModal}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TiledeskConnectExisting;
