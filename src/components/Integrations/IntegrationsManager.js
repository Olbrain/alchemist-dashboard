/**
 * Integrations Manager
 * 
 * Generic integrations management component for all platforms
 * Supports WhatsApp, Slack, Telegram, Instagram and more
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

// Platform-specific imports (to be created)
import WhatsAppIntegrationManager from './WhatsAppIntegrationManager';
import { PageTitle } from '../../utils/typography';
// import SlackIntegrationManager from './SlackIntegrationManager';
// import TelegramIntegrationManager from './TelegramIntegrationManager';
// import InstagramIntegrationManager from './InstagramIntegrationManager';

const IntegrationsManager = ({ organizationId, onNotification }) => {
  const theme = useTheme();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);

  // Define available platforms
  const platforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Connect to WhatsApp Business API for customer messaging',
      icon: WhatsAppIcon,
      color: '#25D366',
      status: 'available',
      category: 'messaging'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Integrate with Slack workspaces and channels',
      icon: 'slack', // Will use custom icon
      color: '#4A154B',
      status: 'coming_soon',
      category: 'collaboration'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Connect to Telegram Bot API for messaging',
      icon: 'telegram', // Will use custom icon
      color: '#0088CC',
      status: 'coming_soon',
      category: 'messaging'
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      description: 'Manage Instagram business messages and comments',
      icon: 'instagram', // Will use custom icon
      color: '#E4405F',
      status: 'coming_soon',
      category: 'social'
    }
  ];

  useEffect(() => {
    loadIntegrations();
  }, [organizationId]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      // TODO: Load existing integrations from backend
      // For now, simulate loading
      setTimeout(() => {
        setIntegrations({
          whatsapp: {
            connected: false,
            accounts: []
          }
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setLoading(false);
      onNotification?.({
        type: 'error',
        message: 'Failed to load integrations'
      });
    }
  };

  const handlePlatformClick = (platform) => {
    if (platform.status === 'available') {
      setSelectedPlatform(platform);
      setIntegrationDialogOpen(true);
    } else {
      onNotification?.({
        type: 'info',
        message: `${platform.name} integration is coming soon!`
      });
    }
  };

  const handleCloseDialog = () => {
    setIntegrationDialogOpen(false);
    setSelectedPlatform(null);
  };

  const getIntegrationStatus = (platformId) => {
    const integration = integrations[platformId];
    if (!integration) return { status: 'not_configured', count: 0 };
    
    if (integration.connected && integration.accounts?.length > 0) {
      return { status: 'connected', count: integration.accounts.length };
    } else if (integration.connected) {
      return { status: 'configured', count: 0 };
    } else {
      return { status: 'not_configured', count: 0 };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'configured': return 'warning';
      case 'not_configured': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status, count = 0) => {
    switch (status) {
      case 'connected': return `Connected (${count})`;
      case 'configured': return 'Configured';
      case 'not_configured': return 'Not Connected';
      default: return 'Unknown';
    }
  };

  const renderPlatformIcon = (platform) => {
    if (typeof platform.icon === 'string') {
      // For string icons, we'll use a placeholder for now
      return <PageTitle>{platform.name.charAt(0)}</PageTitle>;
    } else {
      const IconComponent = platform.icon;
      return <IconComponent />;
    }
  };

  const renderIntegrationDialog = () => {
    if (!selectedPlatform) return null;

    return (
      <Dialog
        open={integrationDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha(selectedPlatform.color, 0.1), color: selectedPlatform.color }}>
              {renderPlatformIcon(selectedPlatform)}
            </Avatar>
            <Typography variant="h6">
              {selectedPlatform.name} Integration
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 400 }}>
          {selectedPlatform.id === 'whatsapp' && (
            <WhatsAppIntegrationManager
              organizationId={organizationId}
              onNotification={onNotification}
              onIntegrationUpdate={loadIntegrations}
            />
          )}
          {/* Add other platform managers here */}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading integrations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <PageTitle fontWeight="bold" gutterBottom>
          Platform Integrations
        </PageTitle>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Connect your AI agents to popular platforms and services
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          Integrations are organization-wide and can be used by all agents in your workspace.
        </Alert>
      </Box>

      {/* Platform Categories */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Messaging Platforms
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {platforms.filter(p => p.category === 'messaging').map((platform) => {
            const integrationStatus = getIntegrationStatus(platform.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={platform.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                  onClick={() => handlePlatformClick(platform)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(platform.color, 0.1),
                          color: platform.color,
                          width: 56,
                          height: 56
                        }}
                      >
                        {renderPlatformIcon(platform)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {platform.name}
                        </Typography>
                        <Chip
                          label={platform.status === 'available' 
                            ? getStatusText(integrationStatus.status, integrationStatus.count)
                            : 'Coming Soon'
                          }
                          size="small"
                          color={platform.status === 'available' 
                            ? getStatusColor(integrationStatus.status)
                            : 'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {platform.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={integrationStatus.status === 'connected' ? <SettingsIcon /> : <AddIcon />}
                      disabled={platform.status !== 'available'}
                    >
                      {integrationStatus.status === 'connected' ? 'Manage' : 'Connect'}
                    </Button>
                    {integrationStatus.status === 'connected' && (
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Other Platforms
        </Typography>
        <Grid container spacing={3}>
          {platforms.filter(p => p.category !== 'messaging').map((platform) => {
            const integrationStatus = getIntegrationStatus(platform.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={platform.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    opacity: platform.status !== 'available' ? 0.7 : 1,
                    '&:hover': {
                      transform: platform.status === 'available' ? 'translateY(-4px)' : 'none',
                      boxShadow: platform.status === 'available' ? theme.shadows[8] : theme.shadows[1]
                    }
                  }}
                  onClick={() => handlePlatformClick(platform)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(platform.color, 0.1),
                          color: platform.color,
                          width: 56,
                          height: 56
                        }}
                      >
                        {renderPlatformIcon(platform)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {platform.name}
                        </Typography>
                        <Chip
                          label={platform.status === 'available' 
                            ? getStatusText(integrationStatus.status, integrationStatus.count)
                            : 'Coming Soon'
                          }
                          size="small"
                          color={platform.status === 'available' 
                            ? getStatusColor(integrationStatus.status)
                            : 'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {platform.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={integrationStatus.status === 'connected' ? <SettingsIcon /> : <AddIcon />}
                      disabled={platform.status !== 'available'}
                    >
                      {integrationStatus.status === 'connected' ? 'Manage' : 'Connect'}
                    </Button>
                    {integrationStatus.status === 'connected' && (
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Integration Dialog */}
      {renderIntegrationDialog()}
    </Box>
  );
};

export default IntegrationsManager;