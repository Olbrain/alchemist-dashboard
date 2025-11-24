/**
 * WhatsApp Twilio Integration Manager - DEPRECATED
 * 
 * This component is deprecated in favor of MetaWhatsAppIntegrationManager
 * which provides direct Meta WhatsApp Business API integration
 */
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  IconButton
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  ArrowBack as ArrowBackIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

const WhatsAppIntegrationManager = ({ 
  agentId,
  onNotification, 
  disabled = false, 
  onBack 
}) => {
  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
            <Box display="flex" alignItems="center">
              {onBack && (
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              <WhatsAppIcon sx={{ fontSize: 40, color: '#25D366', mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  WhatsApp Integration (Deprecated)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This Twilio-based integration has been deprecated
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Deprecation Notice */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          <strong>Integration Deprecated</strong>
        </Typography>
        <Typography variant="body2" gutterBottom>
          This Twilio-based WhatsApp integration has been deprecated in favor of our new direct Meta WhatsApp Business API integration, which provides:
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 2 }}>
          <li>Direct Meta Graph API integration (no third-party BSP)</li>
          <li>Lower latency and costs</li>
          <li>Better compliance with Meta's standards</li>
          <li>More reliable message delivery</li>
          <li>Full control over the integration</li>
        </Box>
        <Typography variant="body2">
          Please use the new Meta WhatsApp Integration from the main integration menu.
        </Typography>
      </Alert>

      {/* Migration Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Migration Instructions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            To migrate to the new Meta WhatsApp Integration:
          </Typography>
          <Box component="ol" sx={{ ml: 2 }}>
            <li>
              <Typography variant="body2">
                Go back to the main Integration menu
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Select "WhatsApp Integration" (the new Meta-based one)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Follow the setup flow to register your phone number with Meta
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Complete the verification process directly with Meta
              </Typography>
            </li>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {onBack && (
              <Button
                variant="contained"
                onClick={onBack}
                startIcon={<ArrowBackIcon />}
              >
                Back to Integration Menu
              </Button>
            )}
            <Button
              variant="outlined"
              href="https://developers.facebook.com/docs/whatsapp/business-management-api"
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LaunchIcon />}
            >
              Meta WhatsApp Documentation
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WhatsAppIntegrationManager;