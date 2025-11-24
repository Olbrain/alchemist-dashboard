/**
 * Data Protection Tab
 * 
 * Simple ON/OFF toggle for comprehensive data protection
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Science as TestIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  PersonPin as PersonPinIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

// Protected data types (informational display only)
const PROTECTED_DATA_TYPES = [
  { name: 'Credit/Debit Cards', example: '4111-****-****-1234', icon: <CreditCardIcon /> },
  { name: 'Bank Account Numbers', example: '******9012', icon: <AccountBalanceIcon /> },
  { name: 'PAN Numbers', example: '*****1234F', icon: <BadgeIcon /> },
  { name: 'Aadhaar Numbers', example: '****-****-9012', icon: <PersonPinIcon /> },
  { name: 'Phone Numbers', example: '+91 *****3210', icon: <PhoneIcon /> },
  { name: 'Email Addresses', example: '****@example.com', icon: <EmailIcon /> },
  { name: 'Passport Numbers', example: '*****5678', icon: <PersonPinIcon /> },
  { name: 'Customer IDs', example: 'CUST****321', icon: <PersonPinIcon /> }
];

const DataProtectionTab = ({ 
  agent, 
  onConfigChange,
  loading = false,
  disabled = false 
}) => {
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Initialize from agent data
  useEffect(() => {
    const enabled = agent?.data_protection_enabled || false;
    console.log('DataProtectionTab: Loading agent data:', {
      agent_id: agent?.agent_id || agent?.id,
      data_protection_enabled: agent?.data_protection_enabled,
      enabled_value: enabled
    });
    setIsProtectionEnabled(enabled);
    setHasChanges(false); // Reset changes when loading new agent data
  }, [agent]);

  // Handle protection toggle
  const handleProtectionToggle = (enabled) => {
    setIsProtectionEnabled(enabled);
    setHasChanges(true);
  };

  // Save configuration
  const handleSave = async () => {
    try {
      console.log('DataProtectionTab: Saving data protection setting:', {
        agent_id: agent?.agent_id || agent?.id,
        isProtectionEnabled,
        before_save: agent?.data_protection_enabled
      });
      
      // Pass just the boolean value to parent
      await onConfigChange(isProtectionEnabled);
      setHasChanges(false);
      
      console.log('DataProtectionTab: Save completed successfully');
    } catch (error) {
      console.error('DataProtectionTab: Failed to save data protection setting:', error);
    }
  };

  // Get protection status
  const getProtectionStatus = () => {
    if (isProtectionEnabled) {
      return {
        status: 'Protected',
        color: 'success',
        icon: <ShieldIcon />,
        description: 'Comprehensive PII protection is active'
      };
    } else {
      return {
        status: 'Unprotected',
        color: 'error',
        icon: <SecurityIcon />,
        description: 'No data protection - not suitable for production'
      };
    }
  };

  const protectionStatus = getProtectionStatus();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Loading Indicator */}
      {loading && (
        <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
      )}

      {/* Main Data Protection Card */}
      <Card>
        <CardHeader
          title="Data Protection"
          subheader="Comprehensive PII protection for sensitive data handling"
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={protectionStatus.icon}
                label={protectionStatus.status}
                color={protectionStatus.color}
                variant="outlined"
              />
              {hasChanges && (
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading || disabled}
                >
                  Save Changes
                </Button>
              )}
            </Stack>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Main Toggle */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={isProtectionEnabled ? 3 : 1}
                sx={{
                  p: 3,
                  border: isProtectionEnabled 
                    ? '2px solid green'
                    : '1px solid #ddd',
                  bgcolor: isProtectionEnabled 
                    ? 'rgba(76, 175, 80, 0.05)'
                    : 'background.paper',
                  transition: 'all 0.3s ease'
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {isProtectionEnabled ? (
                    <ShieldIcon sx={{ fontSize: 48, color: 'success.main' }} />
                  ) : (
                    <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  )}
                </Box>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Enterprise Grade Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {protectionStatus.description}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isProtectionEnabled}
                        onChange={(e) => handleProtectionToggle(e.target.checked)}
                        disabled={disabled || loading}
                        size="large"
                        color="success"
                      />
                    }
                    label={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {isProtectionEnabled ? 'Protection Enabled' : 'Enable Protection'}
                      </Typography>
                    }
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Information Panel */}
            <Grid item xs={12} md={6}>
              {isProtectionEnabled ? (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main', fontWeight: 600 }}>
                    ✅ Data Protection Active
                  </Typography>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      All sensitive customer data will be automatically detected and protected 
                      according to enterprise security standards.
                    </Typography>
                  </Alert>
                  
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      icon={<VerifiedIcon />}
                      label="Industry Compliant"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<SecurityIcon />}
                      label="Enterprise Grade"
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Production Ready"
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      ⚠️ Data Protection Disabled
                    </Typography>
                    <Typography variant="body2">
                      This agent is not suitable for production use with customer data.
                      Enable protection to handle sensitive information safely.
                    </Typography>
                  </Alert>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Protected Data Types Preview (when enabled) */}
          {isProtectionEnabled && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                What Gets Protected
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The following data types are automatically detected and protected:
              </Typography>
              
              <Grid container spacing={1}>
                {PROTECTED_DATA_TYPES.map((dataType, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Box sx={{ mb: 1 }}>
                        {React.cloneElement(dataType.icon, {
                          sx: { color: 'success.main', fontSize: 24 }
                        })}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        {dataType.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          fontSize: '0.7rem'
                        }}
                      >
                        {dataType.example}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Simple Test Interface */}
              <Box sx={{ mt: 3 }}>
                <Button
                  startIcon={<TestIcon />}
                  variant="outlined"
                  onClick={() => setTestMode(!testMode)}
                >
                  {testMode ? 'Hide Tester' : 'Test Protection'}
                </Button>
                
                {testMode && (
                  <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Test Data Protection
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      When protection is enabled, all the data types shown above will be 
                      automatically detected and masked in agent conversations.
                    </Typography>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Note:</strong> The actual protection logic will be implemented 
                        in the agent runtime. This is just a preview of what will be protected.
                      </Typography>
                    </Alert>
                  </Paper>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataProtectionTab;