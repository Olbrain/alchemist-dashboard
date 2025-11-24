/**
 * WhatsApp Integration Manager - Organization Level
 * 
 * Component for organization-wide WhatsApp Business API integration
 * Adapted from agent-specific version to be organization-level
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  VoiceChat as VoiceChatIcon,
  Sms as SmsIcon,
  Security as SecurityIcon,
  BusinessCenter as BusinessIcon,
  Webhook as WebhookIcon,
  Link as LinkIcon,
  Add as AddIcon
} from '@mui/icons-material';

import WhatsAppService from '../../services/whatsapp/whatsappService';
import { useAuth } from '../../utils/AuthContext';

const WhatsAppIntegrationManager = ({ 
  organizationId,
  onNotification, 
  onIntegrationUpdate,
  disabled = false 
}) => {
  const { currentUser, currentOrganization } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Setup wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  
  // Verification state
  const [verificationMethod, setVerificationMethod] = useState('SMS');
  const [verificationCode, setVerificationCode] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  
  useEffect(() => {
    if (currentUser && currentOrganization) {
      loadWhatsAppAccounts();
    }
  }, [currentUser, currentOrganization]);

  const loadWhatsAppAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load organization-level WhatsApp accounts
      const response = await WhatsAppService.getOrganizationAccounts(
        currentUser.uid, 
        currentOrganization.id
      );
      
      if (response.success) {
        setAccounts(response.accounts || []);
      } else {
        setError(response.error || 'Failed to load WhatsApp accounts');
      }
    } catch (error) {
      console.error('Error loading WhatsApp accounts:', error);
      setError('Failed to load WhatsApp accounts');
      onNotification?.({
        type: 'error',
        message: 'Failed to load WhatsApp accounts'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAccounts = async () => {
    setRefreshing(true);
    await loadWhatsAppAccounts();
    setRefreshing(false);
    
    onNotification?.({
      type: 'success',
      message: 'WhatsApp accounts refreshed'
    });
  };

  const handleStartSetup = () => {
    setShowSetupWizard(true);
    setCurrentStep(0);
    setPhoneNumber('');
    setBusinessName('');
    setVerificationCode('');
    setError(null);
  };

  const handleCreateAccount = async () => {
    if (!phoneNumber || !businessName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreatingAccount(true);
      setError(null);

      const response = await WhatsAppService.createOrganizationAccount(
        currentUser.uid,
        currentOrganization.id,
        {
          phone_number: phoneNumber,
          business_name: businessName,
          verification_method: verificationMethod
        }
      );

      if (response.success) {
        setCurrentStep(1);
        onNotification?.({
          type: 'success',
          message: 'WhatsApp account created successfully'
        });
      } else {
        setError(response.error || 'Failed to create WhatsApp account');
      }
    } catch (error) {
      console.error('Error creating WhatsApp account:', error);
      setError('Failed to create WhatsApp account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleRequestVerificationCode = async () => {
    try {
      setRequestingCode(true);
      setError(null);

      const response = await WhatsAppService.requestVerificationCode(
        phoneNumber,
        verificationMethod
      );

      if (response.success) {
        setCurrentStep(2);
        setRetryCountdown(60);
        
        // Start countdown timer
        const timer = setInterval(() => {
          setRetryCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        onNotification?.({
          type: 'success',
          message: `Verification code sent via ${verificationMethod}`
        });
      } else {
        setError(response.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error requesting verification code:', error);
      setError('Failed to send verification code');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setVerifyingCode(true);
      setError(null);

      const response = await WhatsAppService.verifyCode(
        phoneNumber,
        verificationCode
      );

      if (response.success) {
        setShowSetupWizard(false);
        await loadWhatsAppAccounts();
        onIntegrationUpdate?.();
        
        onNotification?.({
          type: 'success',
          message: 'WhatsApp account verified successfully!'
        });
      } else {
        setError(response.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Failed to verify code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this WhatsApp account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await WhatsAppService.deleteAccount(accountId);
      
      if (response.success) {
        await loadWhatsAppAccounts();
        onIntegrationUpdate?.();
        
        onNotification?.({
          type: 'success',
          message: 'WhatsApp account deleted successfully'
        });
      } else {
        onNotification?.({
          type: 'error',
          message: response.error || 'Failed to delete WhatsApp account'
        });
      }
    } catch (error) {
      console.error('Error deleting WhatsApp account:', error);
      onNotification?.({
        type: 'error',
        message: 'Failed to delete WhatsApp account'
      });
    }
  };

  const renderSetupWizard = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon color="success" />
          WhatsApp Business Setup
        </Typography>
        
        <Stepper activeStep={currentStep} orientation="vertical">
          <Step>
            <StepLabel>Account Information</StepLabel>
            <StepContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Verification Method</FormLabel>
                    <RadioGroup
                      value={verificationMethod}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                      row
                    >
                      <FormControlLabel value="SMS" control={<Radio />} label="SMS" />
                      <FormControlLabel value="VOICE" control={<Radio />} label="Voice Call" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleCreateAccount}
                  disabled={creatingAccount || disabled}
                  startIcon={creatingAccount ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                >
                  {creatingAccount ? 'Creating...' : 'Create Account'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowSetupWizard(false)}
                  disabled={creatingAccount}
                >
                  Cancel
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Request Verification</StepLabel>
            <StepContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Request a verification code to be sent to {phoneNumber} via {verificationMethod}.
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleRequestVerificationCode}
                  disabled={requestingCode || disabled}
                  startIcon={requestingCode ? <CircularProgress size={16} /> : 
                    (verificationMethod === 'SMS' ? <SmsIcon /> : <VoiceChatIcon />)}
                >
                  {requestingCode ? 'Sending...' : `Send ${verificationMethod} Code`}
                </Button>
                <Button variant="outlined" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Enter Verification Code</StepLabel>
            <StepContent>
              <TextField
                fullWidth
                label="Verification Code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={disabled}
                sx={{ mb: 2 }}
              />
              
              {retryCountdown > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You can request a new code in {retryCountdown} seconds
                </Typography>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleVerifyCode}
                  disabled={verifyingCode || disabled}
                  startIcon={verifyingCode ? <CircularProgress size={16} /> : <VerifiedIcon />}
                >
                  {verifyingCode ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRequestVerificationCode}
                  disabled={requestingCode || retryCountdown > 0 || disabled}
                >
                  Resend Code
                </Button>
                <Button variant="outlined" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </CardContent>
    </Card>
  );

  const renderAccountsList = () => (
    <Grid container spacing={3}>
      {accounts.map((account) => (
        <Grid item xs={12} md={6} key={account.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <WhatsAppIcon color="success" />
                <Box>
                  <Typography variant="h6">
                    {account.business_name || 'WhatsApp Business'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {account.phone_number}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={account.status === 'verified' ? 'Active' : account.status}
                    color={account.status === 'verified' ? 'success' : 'default'}
                    icon={account.status === 'verified' ? <CheckIcon /> : <WarningIcon />}
                    size="small"
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Phone Number" 
                    secondary={account.phone_number} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BusinessIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Business Name" 
                    secondary={account.business_name || 'Not set'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><WebhookIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Webhook Status" 
                    secondary={account.webhook_status || 'Not configured'} 
                  />
                </ListItem>
              </List>
            </CardContent>
            
            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
              <Tooltip title="Delete Account">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteAccount(account.id)}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading WhatsApp integration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            WhatsApp Business Integration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect WhatsApp Business accounts to enable messaging for your AI agents
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Accounts">
            <IconButton
              onClick={handleRefreshAccounts}
              disabled={refreshing || disabled}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleStartSetup}
            disabled={disabled}
          >
            Add Account
          </Button>
        </Box>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {accounts.length === 0 && !showSetupWizard && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <WhatsAppIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No WhatsApp Accounts Connected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect your WhatsApp Business account to start messaging with your AI agents
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleStartSetup}
              disabled={disabled}
              size="large"
            >
              Connect WhatsApp Business
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      {accounts.length > 0 && renderAccountsList()}

      {/* Setup Wizard */}
      {showSetupWizard && renderSetupWizard()}
    </Box>
  );
};

export default WhatsAppIntegrationManager;