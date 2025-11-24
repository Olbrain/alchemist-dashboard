/**
 * Tiledesk Integration Content Component
 *
 * Dedicated page for Tiledesk integration management in Integration section
 *
 * Features:
 * - Tab 1: Setup - Bot creation, project configuration, webhook
 * - Tab 2: Status - Health monitoring and connection status
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  ChatBubbleOutline as TiledeskIcon,
  CheckCircle as CheckCircleIcon,
  Webhook as WebhookIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as MenuBookIcon,
  Link as LinkIcon,
  Code as CodeIcon
} from '@mui/icons-material';

// Import services
import tiledeskService from '../../services/tiledesk/tiledeskService';
import NotificationSystem, { createNotification } from '../shared/NotificationSystem';
import EmptyState from '../shared/EmptyState';
import { PageTitle, PageDescription, CardTitle, HelperText } from '../../utils/typography';

const TiledeskIntegrationContent = ({ agentId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Bot state
  const [bot, setBot] = useState(null);
  const [botHealth, setBotHealth] = useState(null);

  // Setup state
  const [projectId, setProjectId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);

  // Connect existing bot state
  const [existingProjectId, setExistingProjectId] = useState('');
  const [existingApiToken, setExistingApiToken] = useState('');
  const [existingBotId, setExistingBotId] = useState('');
  const [existingBotName, setExistingBotName] = useState('');
  const [showExistingApiToken, setShowExistingApiToken] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [manualConfigExpanded, setManualConfigExpanded] = useState(true);
  const [manualWebhookUrl, setManualWebhookUrl] = useState('');

  // Authentication method state
  const [authMethod, setAuthMethod] = useState('credentials'); // 'credentials' or 'token'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadBotHealth = useCallback(async () => {
    try {
      const health = await tiledeskService.getBotHealth(agentId);
      setBotHealth(health);
    } catch (error) {
      console.error('Error loading bot health:', error);
    }
  }, [agentId]);

  const loadBot = useCallback(async () => {
    try {
      console.log('[UI] loadBot called for agentId:', agentId);
      setLoading(true);
      const result = await tiledeskService.getBot(agentId);

      console.log('[UI] getBot returned:', result);
      console.log('[UI] Validation check - result exists:', !!result);
      console.log('[UI] Validation check - result.bot_id exists:', !!result?.bot_id);
      console.log('[UI] Validation check - result.bot_id value:', result?.bot_id);

      if (result && result.bot_id) {
        console.log('[UI] Validation passed! Setting bot state...');
        setBot(result);
        setProjectId(result.project_id || '');
        setBotName(result.bot_name || '');
        setBotDescription(result.bot_description || '');
        console.log('[UI] Bot state updated successfully');

        // Load health if bot is active
        if (result.status === 'active') {
          console.log('[UI] Bot is active, loading health...');
          loadBotHealth();
        }
      } else {
        console.warn('[UI] Validation failed! Bot will remain null');
        console.warn('[UI] Reason:', !result ? 'result is null/undefined' : 'result.bot_id is missing/falsy');
      }
    } catch (error) {
      console.error('[UI] Error loading bot:', error);
    } finally {
      setLoading(false);
      console.log('[UI] loadBot completed');
    }
  }, [agentId, loadBotHealth]);

  // Load initial data
  useEffect(() => {
    if (agentId) {
      loadBot();
    }
  }, [agentId, loadBot]);

  // Update webhook URL when bot data is loaded
  useEffect(() => {
    if (bot && bot.bot_url) {
      setWebhookUrl(bot.bot_url);
      setManualWebhookUrl(bot.bot_url);
    }
  }, [bot]);

  // Generate manual webhook URL from agent ID
  useEffect(() => {
    if (agentId && !manualWebhookUrl) {
      // Generate webhook URL pattern (will be validated/corrected by backend)
      const generatedUrl = `https://agent-${agentId.toLowerCase()}.run.app/api/tiledesk/webhook`;
      setManualWebhookUrl(generatedUrl);
    }
  }, [agentId, manualWebhookUrl]);

  const handleSetupBot = async () => {
    try {
      // Validate inputs
      if (!projectId.trim()) {
        setNotification(createNotification('error', 'Please enter Tiledesk Project ID'));
        return;
      }

      if (!tiledeskService.validateProjectId(projectId)) {
        setNotification(createNotification('error', 'Invalid Project ID format. It should be a 24-character hexadecimal string.'));
        return;
      }

      let userToken = apiToken.trim();

      // If using credentials method, sign in first to get token
      if (authMethod === 'credentials') {
        if (!email.trim()) {
          setNotification(createNotification('error', 'Please enter your Tiledesk email'));
          return;
        }

        if (!password.trim()) {
          setNotification(createNotification('error', 'Please enter your Tiledesk password'));
          return;
        }

        setSigningIn(true);
        setSetupLoading(true);

        try {
          // Sign in to get user JWT token
          const signInResult = await tiledeskService.signIn(
            email.trim(),
            password.trim(),
            projectId.trim()
          );

          userToken = signInResult.token;
          setNotification(createNotification('success', 'Signed in successfully!'));
        } catch (signInError) {
          setNotification(createNotification('error', signInError.message || 'Sign in failed'));
          return;
        } finally {
          setSigningIn(false);
        }
      } else {
        // Token method validation
        if (!apiToken.trim()) {
          setNotification(createNotification('error', 'Please enter Tiledesk API Token'));
          return;
        }

        if (!tiledeskService.validateApiToken(apiToken)) {
          setNotification(createNotification('error', 'Invalid API Token format. Token is too short.'));
          return;
        }
      }

      if (!botName.trim()) {
        setNotification(createNotification('error', 'Please enter Bot Name'));
        return;
      }

      setSetupLoading(true);

      // Create bot via agent-bridge
      const result = await tiledeskService.createBot(
        agentId,
        projectId.trim(),
        userToken,
        botName.trim(),
        botDescription.trim() || null
      );

      if (result.success) {
        setNotification(createNotification('success', 'Tiledesk bot created successfully!'));

        // Reload bot data
        await loadBot();

        // Clear sensitive data from form
        setApiToken('');
        setEmail('');
        setPassword('');
      } else {
        setNotification(createNotification('error', 'Failed to create bot'));
      }
    } catch (error) {
      console.error('Error setting up bot:', error);
      setNotification(createNotification('error', error.message || 'Failed to create bot'));
    } finally {
      setSetupLoading(false);
      setSigningIn(false);
    }
  };

  const handleConnectExisting = async () => {
    try {
      // Validate inputs
      if (!existingProjectId.trim()) {
        setNotification(createNotification('error', 'Please enter Tiledesk Project ID'));
        return;
      }

      if (!tiledeskService.validateProjectId(existingProjectId)) {
        setNotification(createNotification('error', 'Invalid Project ID format. It should be a 24-character hexadecimal string.'));
        return;
      }

      if (!existingApiToken.trim()) {
        setNotification(createNotification('error', 'Please enter Tiledesk API Token'));
        return;
      }

      if (!tiledeskService.validateApiToken(existingApiToken)) {
        setNotification(createNotification('error', 'Invalid API Token format. Token is too short.'));
        return;
      }

      if (!existingBotId.trim()) {
        setNotification(createNotification('error', 'Please enter Bot ID'));
        return;
      }

      if (!tiledeskService.validateProjectId(existingBotId)) {
        setNotification(createNotification('error', 'Invalid Bot ID format. It should be a 24-character hexadecimal string.'));
        return;
      }

      setConnectLoading(true);

      // Connect existing bot via agent-bridge
      const result = await tiledeskService.connectExistingBot(
        agentId,
        existingProjectId.trim(),
        existingApiToken.trim(),
        existingBotId.trim(),
        existingBotName.trim() || null
      );

      if (result.success) {
        setNotification(createNotification('success', 'Existing Tiledesk bot connected successfully!'));

        // Reload bot data
        await loadBot();

        // Clear sensitive data from form
        setExistingApiToken('');
        setExistingProjectId('');
        setExistingBotId('');
        setExistingBotName('');
      } else {
        setNotification(createNotification('error', 'Failed to connect existing bot'));
      }
    } catch (error) {
      console.error('Error connecting existing bot:', error);
      setNotification(createNotification('error', error.message || 'Failed to connect existing bot'));
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);

      await tiledeskService.deleteBot(agentId);

      setNotification(createNotification('success', 'Tiledesk bot disconnected successfully'));

      // Reset state
      setBot(null);
      setBotHealth(null);
      setProjectId('');
      setApiToken('');
      setBotName('');
      setBotDescription('');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting bot:', error);
      setNotification(createNotification('error', error.message || 'Failed to disconnect bot'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setNotification(createNotification('success', 'Webhook URL copied to clipboard'));
  };

  const handleRefreshHealth = async () => {
    await loadBotHealth();
    setNotification(createNotification('success', 'Health status refreshed'));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Render setup tab
  const renderSetupTab = () => {
    if (bot && bot.status === 'active') {
      return (
        <Box sx={{ p: 3 }}>
          <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <CardTitle>Bot Connected</CardTitle>
            </Box>

            <Alert severity="success" sx={{ mb: 3 }}>
              Your Tiledesk bot is successfully configured and ready to receive messages.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <HelperText gutterBottom>
                  Bot Name
                </HelperText>
                <Typography variant="body1">{bot.bot_name}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <HelperText gutterBottom>
                  Project ID
                </HelperText>
                <Typography variant="body1">{bot.project_id}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <HelperText gutterBottom>
                  Bot ID
                </HelperText>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {bot.bot_id}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <HelperText gutterBottom>
                  Status
                </HelperText>
                <Chip
                  label={bot.status}
                  color="success"
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <HelperText gutterBottom>
                  Webhook URL
                </HelperText>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    value={bot.bot_url || webhookUrl}
                    fullWidth
                    size="small"
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace', fontSize: '0.9rem' }
                    }}
                  />
                  <Tooltip title="Copy webhook URL">
                    <IconButton onClick={handleCopyWebhook} size="small">
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              {bot.bot_description && (
                <Grid item xs={12}>
                  <HelperText gutterBottom>
                    Description
                  </HelperText>
                  <Typography variant="body2">{bot.bot_description}</Typography>
                </Grid>
              )}
            </Grid>

            <Box mt={3}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDisconnect}
              >
                Disconnect Bot
              </Button>
            </Box>
          </CardContent>
        </Card>
        </Box>
      );
    }

    // Setup form
    return (
      <Box sx={{ p: 3 }}>
        <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SettingsIcon sx={{ mr: 1 }} />
            <CardTitle>Setup Tiledesk Bot</CardTitle>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Connect your agent as an external bot in Tiledesk. Choose your authentication method below.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Authentication Method
                </Typography>
                <Tabs
                  value={authMethod}
                  onChange={(e, newValue) => setAuthMethod(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab
                    label="Sign in with Credentials"
                    value="credentials"
                  />
                  <Tab
                    label="Use JWT Token"
                    value="token"
                  />
                </Tabs>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Tiledesk Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                fullWidth
                required
                placeholder="5f1234567890abcdef123456"
                helperText="24-character hexadecimal ID from your Tiledesk project"
              />
            </Grid>

            {authMethod === 'credentials' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Tiledesk Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    required
                    placeholder="your@email.com"
                    helperText="Your Tiledesk account email"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Tiledesk Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    required
                    placeholder="Enter your password"
                    helperText="Your Tiledesk account password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    We'll sign you in to Tiledesk and automatically obtain a user token with bot creation permissions.
                  </Alert>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Tiledesk User JWT Token"
                    type={showApiToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    fullWidth
                    required
                    placeholder="Enter your user JWT token"
                    helperText="Obtain by calling: POST https://api.tiledesk.com/v3/auth/signin with your credentials"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowApiToken(!showApiToken)}
                            edge="end"
                          >
                            {showApiToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                    <strong>Note:</strong> You need a <em>user</em> JWT token (not a bot token). Bot tokens don't have permission to create new bots.
                  </Alert>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Bot Name"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                fullWidth
                required
                placeholder="My AI Assistant"
                helperText="Display name for your bot in Tiledesk"
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
                The webhook URL will be automatically generated from your deployed agent's service URL and registered with your Tiledesk bot.
                Make sure your agent is deployed before creating the bot.
              </Alert>
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button
              variant="contained"
              onClick={handleSetupBot}
              disabled={setupLoading || signingIn}
              startIcon={setupLoading ? <CircularProgress size={20} /> : <TiledeskIcon />}
            >
              {signingIn ? 'Signing in...' : setupLoading ? 'Creating Bot...' : 'Create Bot'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      </Box>
    );
  };

  // Render connect existing bot tab
  const renderConnectExistingTab = () => {
    if (bot && bot.status === 'active') {
      return (
        <Box sx={{ p: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <CardTitle>Bot Already Connected</CardTitle>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                You already have a bot connected. Disconnect the current bot if you want to connect a different one.
              </Alert>
            </CardContent>
          </Card>
        </Box>
      );
    }

    const handleCopyManualWebhook = () => {
      navigator.clipboard.writeText(manualWebhookUrl);
      setNotification(createNotification('success', 'Webhook URL copied to clipboard'));
    };

    const curlCommand = `curl -X PUT "https://api.tiledesk.com/v3/{PROJECT_ID}/bots/{BOT_ID}" \\
  -H "Authorization: JWT {YOUR_API_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "external",
    "url": "${manualWebhookUrl}"
  }'`;

    // Connect existing form
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Connect Existing Tiledesk Bot
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Choose how you want to connect your existing Tiledesk bot to your agent
        </Alert>

        {/* Manual Configuration Section */}
        <Accordion
          expanded={manualConfigExpanded}
          onChange={() => setManualConfigExpanded(!manualConfigExpanded)}
          sx={{ mb: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <MenuBookIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">
                Option 1: Manual Configuration
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Follow these steps to manually configure your existing bot's webhook URL
              </Typography>

              {/* Step 1: Get Webhook URL */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                  Step 1: Copy Your Agent's Webhook URL
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1.5}>
                  <TextField
                    value={manualWebhookUrl}
                    fullWidth
                    size="small"
                    InputProps={{
                      readOnly: true,
                      style: {
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        backgroundColor: 'white'
                      }
                    }}
                  />
                  <Tooltip title="Copy webhook URL">
                    <IconButton onClick={handleCopyManualWebhook} size="small" color="primary">
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>

              {/* Step 2: Choose Method */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                  Step 2: Update Your Bot (Choose One Method)
                </Typography>

                {/* Method A: Dashboard */}
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LinkIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      Method A: Via Tiledesk Dashboard
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary">1.</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary="Navigate to Tiledesk Dashboard → Settings → Bots"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary">2.</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary="Select your existing bot from the list"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary">3.</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary='Change Bot Type to "External"'
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary">4.</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary="Paste the webhook URL from Step 1 into the Webhook URL field"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary">5.</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary="Click Save"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  </List>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Method B: API */}
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CodeIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      Method B: Via Tiledesk REST API
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Run this command in your terminal (replace placeholders with your values):
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: '#1e1e1e',
                      color: '#d4d4d4',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {curlCommand}
                    </pre>
                  </Paper>
                  <Box mt={1}>
                    <Tooltip title="Copy cURL command">
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => {
                          navigator.clipboard.writeText(curlCommand);
                          setNotification(createNotification('success', 'cURL command copied'));
                        }}
                      >
                        Copy Command
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>

              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="body2">
                  <strong>Done!</strong> Your bot is now manually configured. Messages will be forwarded to your agent.
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Divider */}
        <Box display="flex" alignItems="center" gap={2} my={3}>
          <Divider sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary" fontWeight="medium">
            OR
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        {/* Automated Configuration Section */}
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <SettingsIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">
                Option 2: Automated Configuration
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3, fontSize: '0.875rem' }}>
              Let us automatically update your bot's webhook URL via the Tiledesk API
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Tiledesk Project ID"
                  value={existingProjectId}
                  onChange={(e) => setExistingProjectId(e.target.value)}
                  fullWidth
                  required
                  placeholder="5f1234567890abcdef123456"
                  helperText="24-character hexadecimal ID from your Tiledesk project"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Bot ID"
                  value={existingBotId}
                  onChange={(e) => setExistingBotId(e.target.value)}
                  fullWidth
                  required
                  placeholder="5f9876543210fedcba654321"
                  helperText="24-character hexadecimal ID of your existing bot (found in Tiledesk Dashboard → Settings → Bots)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Tiledesk User JWT Token"
                  type={showExistingApiToken ? 'text' : 'password'}
                  value={existingApiToken}
                  onChange={(e) => setExistingApiToken(e.target.value)}
                  fullWidth
                  required
                  placeholder="Enter your user JWT token"
                  helperText="User JWT token with bot management permissions"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowExistingApiToken(!showExistingApiToken)}
                          edge="end"
                        >
                          {showExistingApiToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Bot Name (Optional)"
                  value={existingBotName}
                  onChange={(e) => setExistingBotName(e.target.value)}
                  fullWidth
                  placeholder="My Existing Bot"
                  helperText="Optional: Will be fetched from Tiledesk if not provided"
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                  <strong>Note:</strong> This will update your existing bot's webhook URL to point to your deployed agent.
                  The bot's existing configuration, intents, and rules will be preserved.
                </Alert>
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button
                variant="contained"
                onClick={handleConnectExisting}
                disabled={connectLoading}
                startIcon={connectLoading ? <CircularProgress size={20} /> : <TiledeskIcon />}
              >
                {connectLoading ? 'Connecting...' : 'Connect Existing Bot'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Render status tab
  const renderStatusTab = () => {
    if (!bot) {
      return (
        <Box sx={{ p: 3 }}>
          <EmptyState
            icon={TiledeskIcon}
            title="No Bot Connected"
            description="Set up your Tiledesk bot to view status information"
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
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefreshHealth}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {botHealth ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Bot Status
                    </HelperText>
                    <Box display="flex" alignItems="center" gap={1}>
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
                    <HelperText gutterBottom>
                      Webhook Status
                    </HelperText>
                    <Chip
                      label={botHealth.webhook_status || 'Unknown'}
                      color={botHealth.webhook_status === 'active' ? 'success' : 'warning'}
                      icon={<WebhookIcon />}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Health Score
                    </HelperText>
                    <Typography variant="h4">
                      {botHealth.health_score ? (botHealth.health_score * 100).toFixed(0) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Last Activity
                    </HelperText>
                    <Typography variant="body1">
                      {botHealth.last_activity
                        ? new Date(botHealth.last_activity).toLocaleString()
                        : 'No activity yet'}
                    </Typography>
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
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              Loading health information...
            </Alert>
          )}
        </CardContent>
      </Card>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header - Fixed */}
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            component="img"
            src="/img/integrations/tiledesk-logo.png"
            alt="Tiledesk"
            sx={{ width: 32, height: 32, objectFit: 'contain', mr: 1, borderRadius: '4px' }}
          />
          <PageTitle>Tiledesk Integration</PageTitle>
        </Box>
        <PageDescription>
          Connect your agent as an external bot in Tiledesk for live chat support
        </PageDescription>
      </Box>

      {/* Tabs - Fixed */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Create New Bot" />
          <Tab label="Connect Existing Bot" />
          <Tab label="Status" />
        </Tabs>
      </Box>

      {/* Tab Content - Scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && renderSetupTab()}
        {activeTab === 1 && renderConnectExistingTab()}
        {activeTab === 2 && renderStatusTab()}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Disconnect Tiledesk Bot?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect this Tiledesk bot? This will remove the bot from your Tiledesk project.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationSystem notification={notification} />
    </Box>
  );
};

export default TiledeskIntegrationContent;
