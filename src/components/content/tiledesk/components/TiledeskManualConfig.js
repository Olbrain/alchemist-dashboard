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
import { SectionTitle, HelperText } from '../../../../utils/typography';

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
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Follow these steps to manually configure your existing bot's webhook URL
      </Typography>

      {/* Step 1: Get Webhook URL */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <SectionTitle gutterBottom fontWeight="medium">
          Step 1: Copy Your Agent's Webhook URL
        </SectionTitle>
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
        <SectionTitle gutterBottom fontWeight="medium">
          Step 2: Update Your Bot (Choose One Method)
        </SectionTitle>

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
          <HelperText display="block" mb={1}>
            Run this command in your terminal (replace placeholders with your values):
          </HelperText>
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
