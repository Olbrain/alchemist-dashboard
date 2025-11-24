/**
 * MCP Config Step - Step 3 of API to MCP Wizard
 *
 * Configure MCP server metadata:
 * - Name
 * - Description
 * - Category
 * - Icon
 */
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const CATEGORIES = [
  { value: 'custom', label: 'Custom' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'payments', label: 'Payments' },
  { value: 'crm', label: 'CRM' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'support', label: 'Support' },
  { value: 'social', label: 'Social' },
  { value: 'storage', label: 'Storage' },
  { value: 'database', label: 'Database' },
  { value: 'other', label: 'Other' }
];

const McpConfigStep = ({ data, onComplete, onError, onBack }) => {
  const [mcpName, setMcpName] = useState(data.mcpName || '');
  const [mcpDescription, setMcpDescription] = useState(data.mcpDescription || '');
  const [mcpCategory, setMcpCategory] = useState(data.mcpCategory || 'custom');
  const [mcpIcon, setMcpIcon] = useState(data.mcpIcon || '');

  const handleContinue = () => {
    // Validation
    if (!mcpName.trim()) {
      onError('Please provide a name for the MCP server');
      return;
    }

    if (!mcpDescription.trim()) {
      onError('Please provide a description for the MCP server');
      return;
    }

    // Generate MCP server ID from name
    const mcpId = mcpName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Build the MCP server configuration
    const mcpConfig = {
      id: `custom-${mcpId}-${Date.now()}`,
      name: mcpName,
      description: mcpDescription,
      category: mcpCategory,
      type: 'private_mcp_server',
      is_private: true,
      icon: mcpIcon || 'api.png',
      icon_type: mcpIcon.startsWith('http') ? 'url' : 'file',

      // Installation config for @olbrain/generic-api-mcp
      installation: {
        method: 'npx',
        command: 'npx',
        args: ['-y', '@olbrain/generic-api-mcp'],
        env: {
          API_BASE_URL: data.baseUrl,
          API_AUTH_TYPE: data.authType,
          API_ENDPOINTS_CONFIG: '' // Will be base64 encoded
        }
      },

      // Credential mapping
      credential_mapping: buildCredentialMapping(data.authType),

      // Tools (from tested endpoints)
      tools: data.selectedEndpoints.map(endpointName => {
        const endpoint = data.parsedEndpoints.find(e => e.name === endpointName);
        return {
          name: endpoint.name,
          description: endpoint.description,
          method: endpoint.method,
          path: endpoint.path,
          inputSchema: buildInputSchema(endpoint),
          test_result: data.testResults[endpointName]
        };
      }),

      // Source API metadata
      source_api: {
        type: 'openapi',
        tested_at: new Date().toISOString(),
        test_summary: {
          total: data.selectedEndpoints.length,
          passed: data.selectedEndpoints.length,
          failed: 0
        }
      },

      // Metadata
      visibility: 'private',
      estimated_tools_count: data.selectedEndpoints.length,
      version: '1.0.0'
    };

    onComplete({
      mcpName,
      mcpDescription,
      mcpCategory,
      mcpIcon,
      generatedConfig: mcpConfig
    });
  };

  const buildCredentialMapping = (authType) => {
    switch (authType) {
      case 'bearer':
        return { BEARER_TOKEN: 'bearer_token' };
      case 'api_key':
        return { API_KEY: 'api_key', API_KEY_HEADER: 'api_key_header' };
      case 'basic':
        return { USERNAME: 'username', PASSWORD: 'password' };
      case 'oauth':
        return { ACCESS_TOKEN: 'access_token' };
      default:
        return {};
    }
  };

  const buildInputSchema = (endpoint) => {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        schema.properties[param.name] = {
          type: param.type || 'string',
          description: param.description || ''
        };

        if (param.required) {
          schema.required.push(param.name);
        }
      });
    }

    return schema;
  };

  const passingEndpoints = data.selectedEndpoints?.length || 0;

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        Configure your MCP server details
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This MCP server will expose {passingEndpoints} API endpoint{passingEndpoints !== 1 ? 's' : ''} as tools
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="MCP Server Name"
              value={mcpName}
              onChange={(e) => setMcpName(e.target.value)}
              placeholder="e.g., My Shopify API"
              helperText="A descriptive name for your MCP server"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Description"
              value={mcpDescription}
              onChange={(e) => setMcpDescription(e.target.value)}
              placeholder="e.g., Custom Shopify integration with product and order management"
              helperText="Brief description of what this MCP server does"
              multiline
              rows={3}
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={mcpCategory}
                label="Category"
                onChange={(e) => setMcpCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Icon URL */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Icon URL (optional)"
              value={mcpIcon}
              onChange={(e) => setMcpIcon(e.target.value)}
              placeholder="https://example.com/icon.png"
              helperText="URL to an icon for your MCP server"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Preview */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
          Preview
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {mcpName || 'MCP Server Name'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {mcpDescription || 'Description of the MCP server'}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Category: {CATEGORIES.find(c => c.value === mcpCategory)?.label}
            </Typography>
            {' • '}
            <Typography variant="caption" color="text.secondary">
              {passingEndpoints} tool{passingEndpoints !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          endIcon={<CheckIcon />}
          disabled={!mcpName.trim() || !mcpDescription.trim()}
        >
          Continue to Review
        </Button>
      </Box>
    </Box>
  );
};

export default McpConfigStep;
