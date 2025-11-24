# Complete Code for All Remaining Tiledesk Components

## Files Already Created ✅
1. ✅ TiledeskAuthStorage.js
2. ✅ TiledeskAuth.js
3. ✅ TiledeskBotList.js
4. ✅ Backend: list_bots method in TiledeskProvider
5. ✅ Backend: list_tiledesk_bots endpoint in app.py
6. ✅ Frontend: listBots method in tiledeskService.js

---

## Remaining Files to Create

### 1. TiledeskManualConfig.js

**File:** `packages/frontend/project-dashboard/src/components/content/tiledesk/components/TiledeskManualConfig.js`

```javascript
/**
 * Tiledesk Manual Configuration Component
 *
 * Shows manual steps to configure bot webhook
 */
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const TiledeskManualConfig = ({ webhookUrl, onCopy }) => {
  const curlCommand = `curl -X PUT "https://api.tiledesk.com/v3/{PROJECT_ID}/bots/{BOT_ID}" \\
  -H "Authorization: JWT {YOUR_API_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "external",
    "url": "${webhookUrl}"
  }'`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    if (onCopy) onCopy('Webhook URL copied to clipboard');
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    if (onCopy) onCopy('cURL command copied to clipboard');
  };

  return (
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
            value={webhookUrl}
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
            <IconButton onClick={handleCopyWebhook} size="small" color="primary">
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
                onClick={handleCopyCurl}
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
  );
};

export default TiledeskManualConfig;
```

---

### 2. TiledeskCreateBot.js

**File:** `packages/frontend/project-dashboard/src/components/content/tiledesk/TiledeskCreateBot.js`

```javascript
/**
 * Tiledesk Create Bot Component
 *
 * Form to create a new Tiledesk bot
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
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
```

---

### 3. TiledeskConnectExisting.js

**File:** `packages/frontend/project-dashboard/src/components/content/tiledesk/TiledeskConnectExisting.js`

```javascript
/**
 * Tiledesk Connect Existing Bot Component
 *
 * Connect an existing Tiledesk bot with manual or automated configuration
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ChatBubbleOutline as TiledeskIcon
} from '@mui/icons-material';

import tiledeskService from '../../../services/tiledesk/tiledeskService';
import TiledeskBotList from './components/TiledeskBotList';
import TiledeskManualConfig from './components/TiledeskManualConfig';

const TiledeskConnectExisting = ({ agentId, projectId, apiToken, onSuccess, onError, onNotification }) => {
  const [bots, setBots] = useState([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [manualConfigExpanded, setManualConfigExpanded] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Automated config state
  const [showApiToken, setShowApiToken] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  // Load bots on mount
  useEffect(() => {
    loadBots();
    // Generate webhook URL
    const generatedUrl = `https://agent-${agentId.toLowerCase()}.run.app/api/tiledesk/webhook`;
    setWebhookUrl(generatedUrl);
  }, [agentId, projectId, apiToken]);

  const loadBots = async () => {
    try {
      setLoadingBots(true);
      const result = await tiledeskService.listBots(projectId, apiToken);
      setBots(result);
    } catch (error) {
      console.error('Error loading bots:', error);
      if (onError) onError('Failed to load bots. Please check your credentials.');
    } finally {
      setLoadingBots(false);
    }
  };

  const handleSelectBot = (bot) => {
    setSelectedBot(bot);
  };

  const handleConnectAutomated = async () => {
    try {
      if (!selectedBot) {
        if (onError) onError('Please select a bot from the list');
        return;
      }

      setConnectLoading(true);

      // Connect existing bot via agent-bridge
      const result = await tiledeskService.connectExistingBot(
        agentId,
        projectId,
        apiToken,
        selectedBot._id,
        selectedBot.name
      );

      if (result.success) {
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
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Connect Existing Tiledesk Bot
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Select a bot from your Tiledesk project and choose how you want to connect it
      </Alert>

      {/* Bot List */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom fontWeight="medium">
            Select a Bot from Your Project
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Choose the bot you want to connect to your agent
          </Typography>

          <TiledeskBotList
            bots={bots}
            loading={loadingBots}
            onSelectBot={handleSelectBot}
            selectedBotId={selectedBot?._id}
          />

          {!loadingBots && bots.length > 0 && (
            <Box mt={2}>
              <Button size="small" onClick={loadBots}>
                Refresh Bot List
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedBot && (
        <>
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
              <TiledeskManualConfig
                webhookUrl={webhookUrl}
                onCopy={onNotification}
              />
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
                Automatically update the selected bot's webhook URL to point to your agent
              </Alert>

              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Bot:
                </Typography>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedBot.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    ID: {selectedBot._id}
                  </Typography>
                </Card>
              </Box>

              <Alert severity="warning" sx={{ mb: 3, fontSize: '0.875rem' }}>
                <strong>Note:</strong> This will update the bot's webhook URL to point to your deployed agent.
                The bot's existing configuration, intents, and rules will be preserved.
              </Alert>

              <Button
                variant="contained"
                fullWidth
                onClick={handleConnectAutomated}
                disabled={connectLoading}
                startIcon={connectLoading ? <CircularProgress size={20} /> : <TiledeskIcon />}
              >
                {connectLoading ? 'Connecting...' : 'Connect Bot Automatically'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default TiledeskConnectExisting;
```

---

### Continue in next file due to length...
