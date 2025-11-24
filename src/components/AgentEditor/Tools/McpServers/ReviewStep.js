/**
 * Review Step - Step 4 of API to MCP Wizard
 *
 * Final review of the generated MCP server configuration:
 * - Summary of tested endpoints
 * - Authentication configuration
 * - MCP server metadata
 * - Generated configuration preview
 */
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const ReviewStep = ({ data, onSave, saving, onBack }) => {
  const [expanded, setExpanded] = useState('endpoints');

  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getAuthTypeLabel = (authType) => {
    const labels = {
      none: 'No Authentication',
      bearer: 'Bearer Token',
      api_key: 'API Key',
      basic: 'Basic Auth',
      oauth: 'OAuth 2.0'
    };
    return labels[authType] || authType;
  };

  const passingEndpoints = data.selectedEndpoints || [];
  const config = data.generatedConfig;

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        Review your MCP server configuration before saving
      </Typography>

      <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
        Your MCP server is ready! Review the details below and click Save to complete.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <ApiIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{passingEndpoints.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              API Endpoints
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SecurityIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6">{getAuthTypeLabel(data.authType)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Authentication
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SettingsIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h6">{data.mcpCategory}</Typography>
            <Typography variant="body2" color="text.secondary">
              Category
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* MCP Server Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          MCP Server Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Name
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.mcpName}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Category
            </Typography>
            <Chip label={data.mcpCategory} size="small" />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">
              {data.mcpDescription}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Base URL
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {data.baseUrl}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Expandable Details */}
      <Box sx={{ mb: 3 }}>
        {/* Endpoints Accordion */}
        <Accordion
          expanded={expanded === 'endpoints'}
          onChange={handleExpandChange('endpoints')}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApiIcon color="primary" />
              <Typography fontWeight={600}>
                Tested Endpoints ({passingEndpoints.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {passingEndpoints.map((endpointName, idx) => {
                const endpoint = data.parsedEndpoints.find(e => e.name === endpointName);
                const result = data.testResults[endpointName];

                return (
                  <React.Fragment key={endpointName}>
                    {idx > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckIcon color="success" fontSize="small" />
                            <Typography variant="body2" fontWeight={500}>
                              {endpoint.name}
                            </Typography>
                            <Chip label={endpoint.method} size="small" />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {endpoint.path}
                            </Typography>
                            {result && (
                              <Typography variant="caption" color="success.main">
                                ✓ Tested successfully ({result.response_time}ms)
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Authentication Accordion */}
        <Accordion
          expanded={expanded === 'auth'}
          onChange={handleExpandChange('auth')}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="success" />
              <Typography fontWeight={600}>
                Authentication Configuration
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Type:</strong> {getAuthTypeLabel(data.authType)}
              </Typography>

              {data.authType !== 'none' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    Required Credentials:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {data.authType === 'bearer' && (
                      <Typography variant="body2">• Bearer Token</Typography>
                    )}
                    {data.authType === 'api_key' && (
                      <>
                        <Typography variant="body2">• API Key</Typography>
                        <Typography variant="body2">• Header Name (optional)</Typography>
                      </>
                    )}
                    {data.authType === 'basic' && (
                      <>
                        <Typography variant="body2">• Username</Typography>
                        <Typography variant="body2">• Password</Typography>
                      </>
                    )}
                    {data.authType === 'oauth' && (
                      <Typography variant="body2">• Access Token</Typography>
                    )}
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    Users will be prompted to provide these credentials when enabling this MCP server
                  </Alert>
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Configuration Accordion */}
        <Accordion
          expanded={expanded === 'config'}
          onChange={handleExpandChange('config')}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon color="info" />
              <Typography fontWeight={600}>
                Generated Configuration
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'background.default',
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {JSON.stringify(config, null, 2)}
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Important Notes */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Important Notes:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <Typography variant="body2">
              This MCP server uses <code>@olbrain/generic-api-mcp</code> npm package
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Users will need to provide authentication credentials when enabling
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              The server will be deployed automatically when an agent enables it
            </Typography>
          </li>
        </ul>
      </Alert>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          size="large"
        >
          {saving ? 'Saving...' : 'Save MCP Server'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewStep;
