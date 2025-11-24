import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as EnabledIcon,
  Settings as ConfigureIcon,
  PlayArrow as TestIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
  MenuBook as DocsIcon,
  Code as CodeIcon,
  Lock as PrivateIcon,
  Language as LanguageIcon,
  CloudDownload as InstallIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`server-tabpanel-${index}`}
      aria-labelledby={`server-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/**
 * McpServerDetailDialog - Shows comprehensive server information
 * Follows Dialog pattern from codebase (maxWidth="md", fullWidth)
 */
const McpServerDetailDialog = ({
  open,
  onClose,
  server,
  isEnabled = false,
  isConfigured = false,
  onEnable,
  onConfigure,
  onDisable,
  onTest,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  if (!server) return null;

  const getCategoryColor = (category) => {
    const colors = {
      ecommerce: '#4CAF50',
      payments: '#2196F3',
      crm: '#FF9800',
      marketing: '#9C27B0',
      email: '#00BCD4',
      sms: '#E91E63',
      analytics: '#795548',
      support: '#607D8B',
      other: '#9E9E9E'
    };
    return colors[category] || colors.other;
  };

  const getIconDisplay = () => {
    if (server.icon_type === 'url') {
      return (
        <Avatar
          src={server.icon}
          alt={server.name}
          sx={{ width: 64, height: 64 }}
          imgProps={{
            style: {
              objectFit: 'contain',
              padding: '4px'
            }
          }}
        />
      );
    } else if (server.icon) {
      return (
        <Avatar
          src={`/mcp_servers/${server.id}/${server.icon}`}
          alt={server.name}
          sx={{ width: 64, height: 64 }}
          imgProps={{
            style: {
              objectFit: 'contain',
              padding: '4px'
            }
          }}
        />
      );
    }
    return (
      <Avatar sx={{ width: 64, height: 64, bgcolor: getCategoryColor(server.category), fontSize: '1.5rem' }}>
        {server.name.charAt(0)}
      </Avatar>
    );
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDownloadConfig = () => {
    // Create a clean config object for download
    const configToDownload = {
      id: server.id,
      name: server.name,
      description: server.description,
      type: server.type,
      category: server.category,
      installation: server.installation,
      configuration_schema: server.configuration_schema,
      credential_mapping: server.credential_mapping,
      capabilities: server.capabilities,
      estimated_tools_count: server.estimated_tools_count,
      version: server.version,
      tags: server.tags,
      ...(server._endpoints_config_preview && { endpoints: server._endpoints_config_preview }),
      ...(server._endpoints_base64 && { endpoints_base64: server._endpoints_base64 })
    };

    // Create blob and trigger download
    const jsonString = JSON.stringify(configToDownload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${server.id}_config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '85vh',
        }
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {getIconDisplay()}

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {server.name}
              </Typography>
              {isEnabled && (
                <Chip
                  icon={<EnabledIcon />}
                  label="Enabled"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {server.is_private && (
                <Chip
                  icon={<PrivateIcon />}
                  label="Private"
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={server.category}
                size="small"
                sx={{
                  bgcolor: getCategoryColor(server.category),
                  color: 'white',
                  fontWeight: 500,
                }}
              />
              {server.version && (
                <Chip label={`v${server.version}`} size="small" variant="outlined" />
              )}
              {server.estimated_tools_count && (
                <Chip label={`~${server.estimated_tools_count} tools`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>

          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<BuildIcon />} iconPosition="start" label="Installation" />
          <Tab icon={<DocsIcon />} iconPosition="start" label="Documentation" />
          {server.is_private && <Tab icon={<CodeIcon />} iconPosition="start" label="Full Config" />}
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent dividers sx={{ minHeight: 300 }}>
        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Description */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {server.description}
              </Typography>
            </Box>

            {/* Capabilities */}
            {server.capabilities && Object.keys(server.capabilities).length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Capabilities
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(server.capabilities).map(([key, value]) => (
                    value && (
                      <Chip
                        key={key}
                        label={key}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    )
                  ))}
                </Box>
              </Box>
            )}

            {/* Tags */}
            {server.tags && server.tags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {server.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Metadata */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Information
              </Typography>
              <List dense>
                {server.estimated_tools_count && (
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <BuildIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tools"
                      secondary={`~${server.estimated_tools_count} tools available`}
                    />
                  </ListItem>
                )}
                {server.version && (
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CodeIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Version"
                      secondary={`v${server.version}`}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LanguageIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Type"
                    secondary={server.is_private ? 'Private Server' : 'Public Server'}
                  />
                </ListItem>
              </List>
            </Box>
          </Box>
        </TabPanel>

        {/* Installation Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {server.installation ? (
              <>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Installation Method
                  </Typography>
                  <Chip
                    label={server.installation.method || 'npm'}
                    icon={<InstallIcon />}
                    size="small"
                    sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                  />
                </Box>

                {server.installation.command && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Install Command
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.grey[500], 0.08),
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflowX: 'auto',
                      }}
                    >
                      {server.installation.command}
                    </Box>
                  </Box>
                )}

                {server.installation.args && server.installation.args.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Arguments
                    </Typography>
                    <List dense>
                      {server.installation.args.map((arg, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={arg}
                            sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No installation information available.
              </Typography>
            )}

            {server.configuration_schema && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Configuration Required
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This server requires configuration before use. Click "Configure" to set up.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Documentation Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {server.documentation_url ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  For detailed information about this MCP server, please visit the official documentation.
                </Typography>
                <Button
                  variant="contained"
                  href={server.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<DocsIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  View Documentation
                </Button>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No documentation available for this server.
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* Full Config Tab - Only for Private Servers */}
        {server.is_private && (
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Complete MCP server configuration in JSON format. This can be used for deployment or sharing.
              </Typography>

              {/* Configuration Schema Section */}
              {server.configuration_schema && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Configuration Schema
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      maxHeight: 200,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      border: 1,
                      borderColor: 'divider'
                    }}
                  >
                    {JSON.stringify(server.configuration_schema, null, 2)}
                  </Paper>
                </Box>
              )}

              {/* API Endpoints Preview Section */}
              {server._endpoints_config_preview && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    API Endpoints ({server._endpoints_config_preview.length})
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      maxHeight: 300,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      border: 1,
                      borderColor: 'divider'
                    }}
                  >
                    {JSON.stringify(server._endpoints_config_preview, null, 2)}
                  </Paper>
                </Box>
              )}

              {/* Download Button */}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadConfig}
                sx={{ alignSelf: 'flex-start' }}
              >
                Download Full Config as JSON
              </Button>
            </Box>
          </TabPanel>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>

        {/* Download button for private servers */}
        {server.is_private && (
          <Button
            onClick={handleDownloadConfig}
            startIcon={<DownloadIcon />}
            variant="outlined"
          >
            Download Config
          </Button>
        )}

        {/* Test only available for enabled servers */}
        {isEnabled && onTest && (
          <Button
            onClick={() => {
              onTest(server);
              onClose();
            }}
            startIcon={<TestIcon />}
            variant="outlined"
          >
            Test
          </Button>
        )}

        {isEnabled ? (
          <>
            {/* Only show Configure button for public MCP Servers with installation */}
            {server.installation && !server.is_private && (
              <Button
                onClick={() => {
                  onConfigure();
                  onClose();
                }}
                startIcon={<ConfigureIcon />}
                variant="outlined"
              >
                {isConfigured ? 'Reconfigure' : 'Configure'}
              </Button>
            )}
            <Button
              onClick={() => {
                onDisable();
                onClose();
              }}
              variant="outlined"
              color="error"
            >
              Disable
            </Button>
          </>
        ) : (
          <Button
            onClick={() => {
              onEnable();
              onClose();
            }}
            variant="contained"
            startIcon={<EnabledIcon />}
          >
            Enable
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default McpServerDetailDialog;
