/**
 * Tiledesk Create Bot Component
 *
 * Form to create a new Tiledesk bot
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Webhook as WebhookIcon
} from '@mui/icons-material';

import tiledeskService from '../../../services/tiledesk/tiledeskService';
import { CardTitle, HelperText } from '../../../utils/typography';

const TiledeskCreateBot = ({ agentId, projectId, apiToken, onSuccess, onError }) => {
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      if (!botName.trim()) {
        if (onError) onError('Please enter Bot Name');
        return;
      }

      setLoading(true);

      // Create bot via agent-bridge
      const result = await tiledeskService.createBot(
        agentId,
        projectId,
        apiToken,
        botName.trim(),
        botDescription.trim() || null
      );

      if (result.success) {
        if (onSuccess) onSuccess(result);
        // Clear form
        setBotName('');
        setBotDescription('');
      } else {
        if (onError) onError('Failed to create bot');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      if (onError) onError(error.message || 'Failed to create bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <CardTitle sx={{ mb: 2 }}>
            Create New Bot
          </CardTitle>

          <Alert severity="info" sx={{ mb: 3 }}>
            Create a new external bot in Tiledesk that will be connected to your agent.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Bot Name"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                fullWidth
                required
                placeholder="My AI Assistant"
                helperText="Display name for your bot in Tiledesk"
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Bot Description"
                value={botDescription}
                onChange={(e) => setBotDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="AI-powered customer support assistant"
                helperText="Optional description for your bot"
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WebhookIcon color="action" />
                <HelperText>
                  Webhook URL (Auto-configured)
                </HelperText>
              </Box>
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                The webhook URL will be automatically generated from your deployed agent's service URL
                and registered with your Tiledesk bot. Make sure your agent is deployed before creating the bot.
              </Alert>
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCreate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {loading ? 'Creating Bot...' : 'Create Bot'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TiledeskCreateBot;
