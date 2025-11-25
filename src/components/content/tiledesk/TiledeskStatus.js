/**
 * Tiledesk Status Component
 *
 * Displays bot health and status information
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Webhook as WebhookIcon,
  ChatBubbleOutline as TiledeskIcon,
  LinkOff as DisconnectIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import tiledeskService from '../../../services/tiledesk/tiledeskService';
import { CardTitle, HelperText } from '../../../utils/typography';
import EmptyState from '../../shared/EmptyState';

const TiledeskStatus = ({ agentId, bot, onError, onNotification, onBotDisconnected }) => {
  const [botHealth, setBotHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadBotHealth = useCallback(async () => {
    try {
      setLoading(true);
      const health = await tiledeskService.getBotHealth(agentId);
      setBotHealth(health);
    } catch (error) {
      console.error('Error loading bot health:', error);
      if (onError) onError('Failed to load bot health');
    } finally {
      setLoading(false);
    }
  }, [agentId, onError]);

  useEffect(() => {
    if (bot && bot.status === 'active') {
      loadBotHealth();
    }
  }, [bot, loadBotHealth]);

  const handleRefresh = async () => {
    await loadBotHealth();
    if (onNotification) onNotification('Health status refreshed');
  };

  const handleDisconnectClick = () => {
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialogOpen(false);
  };

  const handleDisconnectConfirm = async () => {
    try {
      setDisconnecting(true);
      setDisconnectDialogOpen(false);

      await tiledeskService.deleteBot(agentId);

      if (onNotification) {
        onNotification('Bot disconnected successfully', 'success');
      }

      // Notify parent component to reload bot state
      if (onBotDisconnected) {
        onBotDisconnected();
      }
    } catch (error) {
      console.error('Error disconnecting bot:', error);
      if (onError) {
        onError(`Failed to disconnect bot: ${error.message}`);
      }
    } finally {
      setDisconnecting(false);
    }
  };

  if (!bot) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          icon={TiledeskIcon}
          title="No Bot Connected"
          description="Create or connect a Tiledesk bot to view status information"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <CardTitle>Bot Health & Status</CardTitle>
            <Box display="flex" gap={1}>
              <Button
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleRefresh}
                size="small"
                disabled={loading || disconnecting}
              >
                Refresh
              </Button>
              <Button
                startIcon={disconnecting ? <CircularProgress size={20} /> : <DisconnectIcon />}
                onClick={handleDisconnectClick}
                size="small"
                color="error"
                variant="outlined"
                disabled={loading || disconnecting}
              >
                Disconnect
              </Button>
            </Box>
          </Box>

          {botHealth ? (
            <>
            {/* AI Agent Fallback Integration Info */}
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>AI Agent Fallback Enabled</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Your bot handles known intents. Unknown queries are automatically forwarded to the AI agent via REST API.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                ✅ Web Request Action configured automatically
              </Typography>
            </Alert>

                {/* Configuration Instructions - For Manual Setup or Troubleshooting */}
                <Accordion sx={{ mb: 3 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="config-instructions"
                    id="config-instructions-header"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <SettingsIcon color="action" fontSize="small" />
                      <CardTitle>
                        Manual Configuration Guide (For Troubleshooting)
                      </CardTitle>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        ℹ️ Automatic Configuration
                      </Typography>
                      <Typography variant="body2">
                        The Web Request Action is configured automatically when you connect an internal bot.
                        Use this guide only if you need to manually verify or recreate the configuration.
                      </Typography>
                    </Alert>

                    {/* Step 1 */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Step 1: Navigate to Your Bot
                      </Typography>
                      <List dense>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">1.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary="Go to Tiledesk Dashboard → Bots"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">2.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={`Select "${bot?.bot_name}" from the list`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">3.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary='Go to "Intents" tab and find or create "defaultFallback" intent'
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                    </Paper>

                    {/* Step 2 */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Step 2: Add Web Request Action
                      </Typography>
                      <List dense>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">1.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary='Click "Add Action" → Select "Web Request"'
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">2.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary="Set Method to: POST"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">3.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary="Set URL to the fallback endpoint below:"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>

                      <Box display="flex" alignItems="center" gap={1} mt={1} mb={2}>
                        <Paper
                          sx={{
                            p: 1.5,
                            flex: 1,
                            bgcolor: 'white',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            wordBreak: 'break-all'
                          }}
                        >
                          {bot?.bot_url || 'Loading...'}
                        </Paper>
                        <Tooltip title="Copy URL">
                          <IconButton
                            onClick={() => {
                              navigator.clipboard.writeText(bot?.bot_url || '');
                              if (onNotification) onNotification('URL copied to clipboard', 'success');
                            }}
                            size="small"
                            color="primary"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <List dense>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">4.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary='Add Header: Content-Type = application/json'
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                    </Paper>

                    {/* Step 3 */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Step 3: Configure JSON Body
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Copy and paste this JSON template into the "Body" field:
                      </Typography>

                      <Box display="flex" flexDirection="column" gap={1}>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: '#1e1e1e',
                            color: '#d4d4d4',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            position: 'relative'
                          }}
                        >
                          <Tooltip title="Copy JSON">
                            <IconButton
                              onClick={() => {
                                const jsonBody = `{
    "text": "{{lastUserText}}",
    "user_id": "{{user_id}}",
    "conversation_id": "{{conversation_id}}",
    "project_id": "{{project_id}}",
    "language": "{{language}}"
}`;
                                navigator.clipboard.writeText(jsonBody);
                                if (onNotification) onNotification('JSON copied to clipboard', 'success');
                              }}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: 'white',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <pre style={{ margin: 0 }}>
{`{
    "text": "{{lastUserText}}",
    "user_id": "{{user_id}}",
    "conversation_id": "{{conversation_id}}",
    "project_id": "{{project_id}}",
    "language": "{{language}}"
}`}
                          </pre>
                        </Paper>
                      </Box>
                    </Paper>

                    {/* Step 4 */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Step 4: Add Reply Action
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        After the Web Request Action, add a Reply action to display the AI response:
                      </Typography>
                      <List dense>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">1.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary='Click "Add Action" → Select "Reply"'
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">2.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary="In the Reply text field, enter: {{result.text}}"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="primary">3.</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary="Save the defaultFallback intent"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          The Web Request stores the response in the &quot;result&quot; variable. The Reply action displays {'{result.text}'}.
                        </Typography>
                      </Alert>
                    </Paper>

                    <Alert severity="success" icon={<CheckCircleIcon />}>
                      <Typography variant="body2">
                        <strong>Done!</strong> Your internal bot will now forward unknown queries to the AI agent via REST API.
                      </Typography>
                    </Alert>
                  </AccordionDetails>
                </Accordion>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <HelperText>
                        Bot Status
                      </HelperText>
                      <Chip
                        label={botHealth.status || 'Unknown'}
                        color={botHealth.status === 'active' ? 'success' : 'default'}
                        icon={<CheckCircleIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <HelperText>
                        {botHealth.integration_type === 'rest_fallback'
                          ? 'Integration Type'
                          : 'Webhook Status'}
                      </HelperText>
                      <Chip
                        label={
                          botHealth.integration_type === 'rest_fallback'
                            ? 'REST API Fallback'
                            : (botHealth.webhook_status || 'Unknown')
                        }
                        color={
                          botHealth.integration_type === 'rest_fallback'
                            ? 'info'
                            : (botHealth.webhook_status === 'active' ? 'success' : 'warning')
                        }
                        icon={<WebhookIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <HelperText>
                        Health Score
                      </HelperText>
                      <Chip
                        label={`${botHealth.health_score ? (botHealth.health_score * 100).toFixed(0) : 0}%`}
                        color={botHealth.health_score >= 0.7 ? 'success' : botHealth.health_score >= 0.4 ? 'warning' : 'error'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <HelperText>
                        Last Activity
                      </HelperText>
                      <Chip
                        label={botHealth.last_activity
                          ? new Date(botHealth.last_activity).toLocaleString()
                          : 'No activity yet'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Bot Details
                    </HelperText>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <HelperText>
                          Bot Name
                        </HelperText>
                        <Typography variant="body2">
                          {bot?.bot_name || 'Unknown'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <HelperText>
                          Bot ID
                        </HelperText>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {botHealth.bot_id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <HelperText>
                          Project ID
                        </HelperText>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {botHealth.project_id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <HelperText>
                          REST API Fallback URL
                        </HelperText>
                        <HelperText sx={{ fontSize: '0.75rem', mb: 1, color: 'text.secondary' }}>
                          Called when bot encounters unknown queries
                        </HelperText>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {bot?.bot_url || botHealth.webhook_url || 'Not configured'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            </>
          ) : (
            <Alert severity="info">
              {loading ? 'Loading health information...' : 'Health information unavailable'}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={handleDisconnectCancel}
        aria-labelledby="disconnect-dialog-title"
        aria-describedby="disconnect-dialog-description"
      >
        <DialogTitle id="disconnect-dialog-title">
          Disconnect Tiledesk Bot?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="disconnect-dialog-description">
            Are you sure you want to disconnect <strong>{bot?.bot_name}</strong>?
            <Box sx={{ mt: 2 }}>
              This will:
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Remove the bot from your agent</li>
                <li>Delete the bot configuration from Firestore</li>
                <li>Disable webhook integration</li>
              </ul>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              You can reconnect or create a new bot anytime after disconnecting.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisconnectCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDisconnectConfirm} color="error" variant="contained" autoFocus>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TiledeskStatus;
