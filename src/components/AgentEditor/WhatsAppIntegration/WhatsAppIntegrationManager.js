/**
 * WhatsApp Integration Manager
 * 
 * Component for direct WhatsApp Business API integration
 * Uses step-by-step layout with left sidebar instructions
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
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
  Link as LinkIcon
} from '@mui/icons-material';

import WhatsAppService from '../../../services/whatsapp/whatsappService';
import WhatsAppWebhookService from '../../../services/whatsapp/whatsappWebhookService';
import { getAgentServerStatus, subscribeToAgentServerStatus } from '../../../services/deployment/deploymentService';
import { useAuth } from '../../../utils/AuthContext';

const WhatsAppIntegrationManager = ({ 
  agentId,
  onNotification, 
  disabled = false, 
  onBack 
}) => {
  // Get organization context for API calls
  const { organizationId, currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [Account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [deploymentLoading, setDeploymentLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Step-by-step form state
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
  const [codeSentAt, setCodeSentAt] = useState(null);
  
  // Meta verification state
  const [metaVerificationCode, setMetaVerificationCode] = useState('');
  const [metaVerificationMethod, setMetaVerificationMethod] = useState('sms');
  const [metaRegistrationLoading, setMetaRegistrationLoading] = useState(false);
  const [metaVerificationLoading, setMetaVerificationLoading] = useState(false);
  const [comprehensiveStatus, setComprehensiveStatus] = useState(null);
  
  // Webhook registration state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookRegistering, setWebhookRegistering] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState(null);
  
  // Business name validation (simple)
  const [businessNameValidation, setBusinessNameValidation] = useState({ is_valid: true, violations: [] });
  const [validatingBusinessName, setValidatingBusinessName] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (retryCountdown > 0) {
      interval = setInterval(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
    } else if (retryCountdown === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [retryCountdown]);

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have organization context
      if (!organizationId || !currentUser?.uid) {
        console.warn('Missing organization context for WhatsApp API call');
        setError('Unable to load WhatsApp account: missing organization context. Please try refreshing the page.');
        setLoading(false);
        return;
      }
      
      const account = await WhatsAppService.getAccount(agentId, organizationId, currentUser?.uid);
      setAccount(account);
      
      // Debug: Log account status
      console.log('Account status:', account);
      
      // Set step based on account status
      if (account) {
        // Log account status for debugging
        console.log('Account verification status:', {
          status: account.status,
          verified: account.verified,
          verification_step: account.verification_step,
          meta_registration_attempted: account.meta_registration_attempted,
          meta_phone_number_id: account.meta_phone_number_id,
          meta_verification_submitted: account.meta_verification_submitted
        });

        // Check for completion first
        if (account.status === 'active' && account.webhook_registered) {
          setCurrentStep(5); // Complete
        } else if (account.webhook_registered) {
          setCurrentStep(5); // Complete
        }
        // Check for Twilio verification complete - check if Meta is already ready
        else if (account.verified === true || account.status === 'active') {
          // Check comprehensive status to see if Meta verification is needed
          handleCheckMetaStatus(account);
        }
        // Check for Meta verification step (only if explicitly attempted)
        else if (account.meta_registration_attempted && !account.meta_verification_submitted) {
          setCurrentStep(3); // Meta verification
        } 
        // Check for Meta registration step (only if Twilio complete but Meta not ready)
        else if ((account.verified === true || account.status === 'active') && !account.meta_phone_number_id) {
          setCurrentStep(2); // Meta registration
        }
        // Check for Twilio verification pending
        else if (account.verification_step === 'code_requested' || account.status === 'verification_pending') {
          setCurrentStep(1); // Twilio verification
        } 
        // Default to phone setup
        else {
          setCurrentStep(0); // Phone setup
        }
        
        setPhoneNumber(account.phone_number || '');
        setBusinessName(account.business_name || '');
      }
      
    } catch (err) {
      console.error('Error loading account:', err);
      setError('Failed to load WhatsApp configuration');
      if (onNotification) {
        onNotification({
          message: 'Failed to load WhatsApp configuration',
          severity: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setLoading(false);
    }
  }, [agentId, organizationId, currentUser?.uid, onNotification]);

  const loadDeploymentStatus = useCallback(async () => {
    try {
      setDeploymentLoading(true);
      const deployed = await getAgentServerStatus(agentId);
      setIsDeployed(deployed);
    } catch (err) {
      console.error('Error loading deployment status:', err);
      setIsDeployed(false);
    } finally {
      setDeploymentLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      loadAccount();
      loadDeploymentStatus();
      
      // Set webhook URL based on agent deployment
      const loadWebhookUrl = async () => {
        try {
          const webhookUrl = await WhatsAppWebhookService.getAgentWebhookUrl(agentId);
          setWebhookUrl(webhookUrl);
        } catch (error) {
          console.error('Error loading webhook URL:', error);
          // Fallback to expected format
          setWebhookUrl(`https://agent-${agentId}-851487020021.us-central1.run.app/api/whatsapp/webhook`);
        }
      };
      
      loadWebhookUrl();
      
      // Set up real-time listener for deployment status
      const unsubscribe = subscribeToAgentServerStatus(
        agentId,
        (deployed, serverData) => {
          setIsDeployed(deployed);
          setDeploymentLoading(false);
          
          // Update webhook URL when deployment status changes
          if (deployed) {
            loadWebhookUrl();
          }
        },
        (error) => {
          console.error('Deployment subscription error:', error);
          setDeploymentLoading(false);
        }
      );
      
      return () => unsubscribe();
    }
  }, [agentId, loadAccount, loadDeploymentStatus]);

  // Simple business name validation
  const validateBusinessName = async (name) => {
    if (!name.trim()) {
      setBusinessNameValidation({ is_valid: true, violations: [] });
      return;
    }

    setValidatingBusinessName(true);
    try {
      const validation = await WhatsAppService.validateBusinessName(name, organizationId, currentUser?.uid);
      setBusinessNameValidation(validation);
    } catch (error) {
      console.error('Error validating business name:', error);
      setBusinessNameValidation({ is_valid: true, violations: [] }); // Non-blocking
    } finally {
      setValidatingBusinessName(false);
    }
  };

  const handleBusinessNameChange = (value) => {
    setBusinessName(value);
    validateBusinessName(value);
  };

  const handleIntegrate = async () => {
    if (!phoneNumber || !businessName) {
      setError('Phone number and business name are required');
      return;
    }

    if (!WhatsAppService.validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number in international format (e.g., +1234567890)');
      return;
    }

    try {
      setCreatingAccount(true);
      setError(null);
      
      const account = await WhatsAppService.createAccount(
        agentId,
        phoneNumber,
        businessName,
        organizationId,
        currentUser?.uid
      );
      
      setAccount(account);
      setCurrentStep(1); // Move to verification step
      
      if (onNotification) {
        onNotification({
          message: 'WhatsApp account created successfully',
          severity: 'success',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create WhatsApp account');
      if (onNotification) {
        onNotification({
          message: err.message || 'Failed to create WhatsApp account',
          severity: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleRequestVerificationCode = async () => {
    try {
      setRequestingCode(true);
      setError(null);
      
      const result = await WhatsAppService.requestVerificationCode(agentId, verificationMethod, organizationId, currentUser?.uid);
      
      if (result.success) {
        setAccount(prev => ({ ...prev, verification_step: 'code_requested' }));
        setCodeSentAt(new Date());
        setRetryCountdown(60); // 60-second cooldown
        
        if (onNotification) {
          onNotification({
            message: `Verification code sent via ${verificationMethod}! Please check your phone. You can request another code in 60 seconds if not received.`,
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        setError(result.message || 'Failed to request verification code');
      }
    } catch (err) {
      console.error('Error requesting verification code:', err);
      setError(err.message || 'Failed to request verification code');
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
      
      const result = await WhatsAppService.verifyPhoneNumber(agentId, verificationCode, organizationId, currentUser?.uid);
      
      if (result.verified) {
        setAccount(prev => ({ 
          ...prev, 
          verification_step: 'verified',
          status: 'verified',
          verified: true
        }));
        
        setCurrentStep(2); // Move to Meta registration step
        
        if (onNotification) {
          onNotification({
            message: 'Phone number verified successfully',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Failed to verify code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleCompleteMetaVerification = async () => {
    try {
      setMetaRegistrationLoading(true);
      setError(null);
      
      console.log('🚀 Starting Meta verification for agent:', agentId);
      
      const result = await WhatsAppService.completeVerification(agentId, organizationId, currentUser?.uid);
      
      console.log('📋 Meta verification result:', result);
      
      if (result.success) {
        setAccount(prev => ({ 
          ...prev, 
          meta_registration_attempted: true,
          meta_phone_number_id: result.meta_registration_result?.phone_number_id || result.phone_number_id
        }));
        
        setCurrentStep(3); // Move to Meta verification step
        
        if (onNotification) {
          onNotification({
            message: 'Meta registration initiated successfully. Check your phone for verification code.',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        const errorMsg = result.error || 'Meta registration failed';
        console.error('❌ Meta registration failed:', result);
        setError(errorMsg);
        
        if (onNotification) {
          onNotification({
            message: `Meta registration failed: ${errorMsg}`,
            severity: 'error',
            timestamp: Date.now()
          });
        }
      }
    } catch (err) {
      console.error('💥 Exception during Meta verification:', err);
      
      // Extract more specific error information
      let errorMessage = 'Failed to complete Meta registration';
      
      if (err.message) {
        // Check for specific error types
        if (err.message.includes('configuration')) {
          errorMessage = 'Meta API configuration is incomplete. Please check your Meta app settings.';
        } else if (err.message.includes('authentication')) {
          errorMessage = 'Meta API authentication failed. Please check your access token.';
        } else if (err.message.includes('not found')) {
          errorMessage = 'WhatsApp account not found. Please create an account first.';
        } else if (err.message.includes('Network Error') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = `Meta registration failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      
      if (onNotification) {
        onNotification({
          message: errorMessage,
          severity: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setMetaRegistrationLoading(false);
    }
  };

  const handleSubmitMetaCode = async () => {
    if (!metaVerificationCode) {
      setError('Please enter the Meta verification code');
      return;
    }

    try {
      setMetaVerificationLoading(true);
      setError(null);
      
      console.log('🔐 Submitting Meta verification code for agent:', agentId);
      
      const result = await WhatsAppService.submitMetaVerificationCode(agentId, metaVerificationCode, organizationId, currentUser?.uid);
      
      console.log('📋 Meta code submission result:', result);
      
      if (result.verification_result && result.verification_result.success) {
        setAccount(prev => ({ 
          ...prev, 
          meta_verification_submitted: true,
          status: 'active'
        }));
        
        setCurrentStep(4); // Move to webhook registration step
        
        if (onNotification) {
          onNotification({
            message: 'Meta verification completed successfully! Phone number is now verified.',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        // Extract error message from result
        const errorMessage = result.verification_result?.error || result.error || 'Meta verification failed';
        
        console.error('❌ Meta code verification failed:', result);
        
        // Provide specific error messages based on common failure scenarios
        let userFriendlyError = errorMessage;
        
        if (errorMessage.includes('too many invalid verification codes') || 
            errorMessage.includes('wait a little while before trying again') ||
            errorMessage.includes('rate limit')) {
          userFriendlyError = 'You\'ve tried too many invalid verification codes. Please wait 15 minutes before trying again.';
        } else if (errorMessage.includes('verification code is invalid') || 
                   errorMessage.includes('invalid code')) {
          userFriendlyError = 'Invalid verification code. Please check your SMS and enter the correct 6-digit code.';
        } else if (errorMessage.includes('verification code has expired')) {
          userFriendlyError = 'Verification code has expired. Please request a new code.';
        } else if (errorMessage.includes('Meta verification code request failed: 400')) {
          userFriendlyError = 'Meta verification failed due to configuration issues. Please contact support.';
        } else if (errorMessage.includes('phone_number_id')) {
          userFriendlyError = 'Phone number registration issue. Please restart the verification process.';
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error submitting Meta verification code:', err);
      
      // Handle different error scenarios
      const errorMessage = err.message || 'Failed to submit Meta verification code';
      
      // Check for rate limiting in error message
      if (errorMessage.includes('too many invalid verification codes') || 
          errorMessage.includes('wait a little while before trying again') ||
          errorMessage.includes('rate limit')) {
        setError('You\'ve tried too many invalid verification codes. Please wait a little while before trying again.');
      } else if (errorMessage.includes('Meta verification code request failed: 400')) {
        setError('Meta verification code request failed. Please check your Meta configuration and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setMetaVerificationLoading(false);
    }
  };

  const handleRetryMetaVerification = async () => {
    try {
      setMetaRegistrationLoading(true);
      setError(null);
      
      const result = await WhatsAppService.retryVerificationCode(agentId, metaVerificationMethod, organizationId, currentUser?.uid);
      
      if (result.success) {
        if (onNotification) {
          onNotification({
            message: 'Meta verification code resent successfully',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        // Extract error message from result
        const errorMessage = result.message || result.error || 'Failed to resend Meta verification code';
        
        // Check for rate limiting error
        if (errorMessage.includes('too many invalid verification codes') || 
            errorMessage.includes('wait a little while before trying again') ||
            errorMessage.includes('rate limit')) {
          setError('You\'ve tried too many invalid verification codes. Please wait a little while before trying again.');
        } else if (errorMessage.includes('Meta verification code request failed: 400')) {
          setError('Meta verification code request failed. Please check your Meta configuration and try again.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error retrying Meta verification:', err);
      
      // Handle different error scenarios
      const errorMessage = err.message || 'Failed to retry Meta verification';
      
      // Check for rate limiting in error message
      if (errorMessage.includes('too many invalid verification codes') || 
          errorMessage.includes('wait a little while before trying again') ||
          errorMessage.includes('rate limit')) {
        setError('You\'ve tried too many invalid verification codes. Please wait a little while before trying again.');
      } else if (errorMessage.includes('Meta verification code request failed: 400')) {
        setError('Meta verification code request failed. Please check your Meta configuration and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setMetaRegistrationLoading(false);
    }
  };

  const handleGetComprehensiveStatus = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const status = await WhatsAppService.getComprehensiveStatus(agentId, organizationId, currentUser?.uid);
      setComprehensiveStatus(status);
      
      if (onNotification) {
        onNotification({
          message: 'Status refreshed successfully',
          severity: 'success',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Error getting comprehensive status:', err);
      setError(err.message || 'Failed to get comprehensive status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckMetaStatus = async (account) => {
    try {
      const status = await WhatsAppService.getComprehensiveStatus(agentId, organizationId, currentUser?.uid);
      setComprehensiveStatus(status);
      
      // Check if Meta is already connected/approved
      const metaStatus = status.comprehensive_status?.meta_status?.whatsapp_status;
      const isMetaReady = metaStatus === 'CONNECTED' || metaStatus === 'APPROVED';
      
      if (isMetaReady) {
        // Meta is already ready, skip to webhook registration
        setCurrentStep(4);
        if (onNotification) {
          onNotification({
            message: 'Meta WhatsApp is already connected! Proceeding to webhook registration.',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        // Meta verification is needed
        setCurrentStep(2); // Meta registration
      }
    } catch (err) {
      console.error('Error checking Meta status:', err);
      // If we can't check status, default to Meta registration step
      setCurrentStep(2);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!webhookUrl) {
      setError('Please enter a webhook URL');
      return;
    }

    try {
      setWebhookRegistering(true);
      setError(null);
      
      const result = await WhatsAppService.registerWebhook(agentId, webhookUrl, organizationId, currentUser?.uid);
      
      if (result.success) {
        setAccount(prev => ({ 
          ...prev, 
          webhook_registered: true,
          webhook_url: result.webhook_url
        }));
        
        setCurrentStep(5); // Move to complete step
        
        if (onNotification) {
          onNotification({
            message: 'Webhook registered successfully',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        setError(result.message || 'Failed to register webhook');
      }
    } catch (err) {
      console.error('Error registering webhook:', err);
      setError(err.message || 'Failed to register webhook');
    } finally {
      setWebhookRegistering(false);
    }
  };

  const handleGetWebhookStatus = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const status = await WhatsAppService.getWebhookStatus(agentId, organizationId, currentUser?.uid);
      setWebhookStatus(status);
      
      if (onNotification) {
        onNotification({
          message: 'Webhook status refreshed successfully',
          severity: 'success',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Error getting webhook status:', err);
      setError(err.message || 'Failed to get webhook status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!Account || !window.confirm('Are you sure you want to delete the WhatsApp account?')) {
      return;
    }

    try {
      setDeleting(true);
      await WhatsAppService.deleteAccount(agentId, organizationId, currentUser?.uid);
      setAccount(null);
      setCurrentStep(0);
      setPhoneNumber('');
      setBusinessName('');
      
      // Reset webhook URL to agent deployment format
      try {
        const webhookUrl = await WhatsAppWebhookService.getAgentWebhookUrl(agentId);
        setWebhookUrl(webhookUrl);
      } catch (error) {
        console.error('Error loading webhook URL:', error);
        setWebhookUrl(`https://agent-${agentId}-851487020021.us-central1.run.app/api/whatsapp/webhook`);
      }
      
      setWebhookStatus(null);
      if (onNotification) {
        onNotification({
          message: 'WhatsApp account removed successfully',
          severity: 'success',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      setError('Failed to delete WhatsApp account');
      if (onNotification) {
        onNotification({
          message: 'Failed to delete WhatsApp account',
          severity: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleStartOver = async () => {
    if (!Account) return;
    
    const confirmMessage = `This will delete your current WhatsApp integration (${phoneNumber}) and let you start over with a new phone number. Continue?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      
      await WhatsAppService.deleteAccount(agentId, organizationId, currentUser?.uid);
      
      // Reset all state to start fresh
      setAccount(null);
      setCurrentStep(0);
      setPhoneNumber('');
      setBusinessName('');
      setVerificationCode('');
      setMetaVerificationCode('');
      setRetryCountdown(0);
      setCodeSentAt(null);
      setComprehensiveStatus(null);
      setWebhookStatus(null);
      
      // Reset webhook URL to agent deployment format
      try {
        const webhookUrl = await WhatsAppWebhookService.getAgentWebhookUrl(agentId);
        setWebhookUrl(webhookUrl);
      } catch (error) {
        console.error('Error loading webhook URL:', error);
        setWebhookUrl(`https://agent-${agentId}-851487020021.us-central1.run.app/api/whatsapp/webhook`);
      }
      
      if (onNotification) {
        onNotification({
          message: 'Integration reset successfully. You can now enter a new phone number.',
          severity: 'success',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Error starting over:', err);
      setError('Failed to reset integration');
      if (onNotification) {
        onNotification({
          message: 'Failed to reset integration',
          severity: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!Account) return;

    try {
      setRefreshing(true);
      setError(null);
      
      const health = await WhatsAppService.getAccountHealth(agentId, organizationId, currentUser?.uid);
      
      setAccount(prev => ({
        ...prev,
        status: health.status,
        quality_rating: health.quality_rating,
        last_activity: health.last_activity
      }));
      
      if (onNotification) {
        onNotification({
          message: 'Status refreshed successfully',
          severity: 'success',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
      setError(err.message || 'Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const setupSteps = [
    {
      title: 'Phone Number Registration',
      description: 'Register your phone number with Twilio BSP',
      active: currentStep === 0
    },
    {
      title: 'Twilio Verification',
      description: 'Enter the verification code sent to your phone',
      active: currentStep === 1
    },
    {
      title: 'Meta Registration',
      description: 'Register with Meta WhatsApp Business API',
      active: currentStep === 2
    },
    {
      title: 'Meta Verification',
      description: 'Enter Meta verification code',
      active: currentStep === 3
    },
    {
      title: 'Webhook Registration',
      description: 'Register webhook via Twilio for agent message handling',
      active: currentStep === 4
    },
    {
      title: 'Integration Complete',
      description: 'Your WhatsApp integration is ready to use',
      active: currentStep === 5
    }
  ];

  return (
    <Box 
      sx={{ 
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1100
      }}>
        <Box display="flex" alignItems="center">
          <WhatsAppIcon sx={{ mr: 1, color: '#757575' }} />
          <Typography variant="h6">
            WhatsApp Integration
          </Typography>
        </Box>
        {Account && (
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Status">
              <IconButton onClick={handleRefreshStatus} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Account">
              <IconButton onClick={handleDeleteAccount} disabled={deleting} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Content Area */}
      <Box 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          px: 3,
          py: 3,
          minHeight: 0,
          width: '100%'
        }}
      >
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

      {/* Deployment Status */}
      {deploymentLoading ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography>Checking deployment status...</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : !isDeployed ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Your agent must be deployed before setting up WhatsApp integration.
          </Typography>
        </Alert>
      ) : null}

      {/* Main Content - Step by Step Layout */}
      <Grid container spacing={3}>
        {/* Left Side - Instructions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Setup Instructions
              </Typography>
              
              <Stepper orientation="vertical" activeStep={currentStep}>
                {setupSteps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel>
                      <Typography variant="subtitle2">{step.title}</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="textSecondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Active Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {setupSteps[currentStep]?.title || 'Setup'}
              </Typography>

              {/* Step 0: Phone Number Registration */}
              {currentStep === 0 && (
                <Box>
                  {Account && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Existing WhatsApp Integration Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {phoneNumber} | Business: {businessName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          You can use the "Start Over" button below to set up a different phone number.
                        </Typography>
                      </Box>
                    </Alert>
                  )}
                  
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    margin="normal"
                    disabled={disabled || !isDeployed}
                    helperText="Enter your phone number in international format"
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    placeholder="Your Business Name"
                    margin="normal"
                    disabled={disabled || !isDeployed}
                    error={!businessNameValidation.is_valid}
                    helperText={
                      !businessNameValidation.is_valid && businessNameValidation.violations.length > 0
                        ? businessNameValidation.violations[0]
                        : "This will be displayed to your customers"
                    }
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: validatingBusinessName ? <CircularProgress size={20} /> : null
                    }}
                  />
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleIntegrate}
                      disabled={disabled || creatingAccount || !phoneNumber || !businessName || !isDeployed}
                      startIcon={creatingAccount ? <CircularProgress size={20} /> : <WhatsAppIcon />}
                      fullWidth
                      size="large"
                    >
                      {creatingAccount ? 'Integrating...' : Account ? 'Update Integration' : 'Integrate'}
                    </Button>
                    
                    {Account && (
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={handleStartOver}
                        disabled={disabled || deleting || !isDeployed}
                        startIcon={deleting ? <CircularProgress size={20} /> : <RefreshIcon />}
                        sx={{ minWidth: '140px' }}
                      >
                        {deleting ? 'Resetting...' : 'Start Over'}
                      </Button>
                    )}
                  </Box>
                </Box>
              )}

              {/* Step 1: Verification Code */}
              {currentStep === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Phone: {phoneNumber}
                    </Typography>
                    <Button
                      variant="text"
                      color="warning"
                      size="small"
                      onClick={handleStartOver}
                      disabled={deleting}
                      startIcon={deleting ? <CircularProgress size={16} /> : <RefreshIcon />}
                    >
                      {deleting ? 'Resetting...' : 'Wrong Number?'}
                    </Button>
                  </Box>

                  <FormControl component="fieldset" margin="normal" fullWidth>
                    <FormLabel component="legend">Verification Method</FormLabel>
                    <RadioGroup
                      value={verificationMethod}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                      row
                    >
                      <FormControlLabel 
                        value="SMS" 
                        control={<Radio />} 
                        label="SMS" 
                        icon={<SmsIcon />}
                      />
                      <FormControlLabel 
                        value="VOICE" 
                        control={<Radio />} 
                        label="Voice Call" 
                        icon={<VoiceChatIcon />}
                      />
                    </RadioGroup>
                  </FormControl>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleRequestVerificationCode}
                      disabled={requestingCode || retryCountdown > 0}
                      startIcon={requestingCode ? <CircularProgress size={20} /> : <PhoneIcon />}
                      fullWidth
                    >
                      {requestingCode 
                        ? 'Sending Code...' 
                        : retryCountdown > 0 
                          ? `Wait ${retryCountdown}s to Retry`
                          : codeSentAt 
                            ? 'Resend Verification Code'
                            : 'Request Verification Code'
                      }
                    </Button>
                  </Box>

                  {codeSentAt && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Verification code sent via {verificationMethod}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sent at {codeSentAt.toLocaleTimeString()}. 
                          {retryCountdown > 0 
                            ? ` Wait ${retryCountdown} seconds before requesting again.`
                            : ' If you didn\'t receive it, you can request another one.'
                          }
                        </Typography>
                      </Box>
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    margin="normal"
                    helperText={codeSentAt 
                      ? `Enter the ${verificationMethod} verification code you received`
                      : "Request a verification code first"
                    }
                  />
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode || !verificationCode}
                      startIcon={verifyingCode ? <CircularProgress size={20} /> : <VerifiedIcon />}
                      fullWidth
                      size="large"
                    >
                      {verifyingCode ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 2: Meta Registration */}
              {currentStep === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Twilio verification complete. Now registering with Meta WhatsApp Business API.
                    </Typography>
                    <Button
                      variant="text"
                      color="warning"
                      size="small"
                      onClick={handleStartOver}
                      disabled={deleting}
                      startIcon={deleting ? <CircularProgress size={16} /> : <RefreshIcon />}
                    >
                      {deleting ? 'Resetting...' : 'Start Over'}
                    </Button>
                  </Box>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Your phone number ({phoneNumber}) is registered with Twilio. Next, we'll register it with Meta WhatsApp Business API to make it visible in your Meta Business Manager.
                    </Typography>
                  </Alert>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleCompleteMetaVerification}
                      disabled={metaRegistrationLoading}
                      startIcon={metaRegistrationLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
                      fullWidth
                      size="large"
                    >
                      {metaRegistrationLoading ? 'Registering with Meta...' : 'Register with Meta'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 3: Meta Verification */}
              {currentStep === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Meta registration initiated. Enter the verification code sent to {phoneNumber}.
                    </Typography>
                    <Button
                      variant="text"
                      color="warning"
                      size="small"
                      onClick={handleStartOver}
                      disabled={deleting}
                      startIcon={deleting ? <CircularProgress size={16} /> : <RefreshIcon />}
                    >
                      {deleting ? 'Resetting...' : 'Start Over'}
                    </Button>
                  </Box>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Meta will send a verification code to your phone number. This is separate from the previous Twilio verification.
                    </Typography>
                  </Alert>

                  <FormControl component="fieldset" margin="normal" fullWidth>
                    <FormLabel component="legend">Verification Method</FormLabel>
                    <RadioGroup
                      value={metaVerificationMethod}
                      onChange={(e) => setMetaVerificationMethod(e.target.value)}
                      row
                    >
                      <FormControlLabel 
                        value="sms" 
                        control={<Radio />} 
                        label="SMS" 
                        icon={<SmsIcon />}
                      />
                      <FormControlLabel 
                        value="voice" 
                        control={<Radio />} 
                        label="Voice Call" 
                        icon={<VoiceChatIcon />}
                      />
                    </RadioGroup>
                  </FormControl>

                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleRetryMetaVerification}
                      disabled={metaRegistrationLoading}
                      startIcon={metaRegistrationLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                      fullWidth
                    >
                      {metaRegistrationLoading ? 'Resending...' : 'Resend Meta Verification Code'}
                    </Button>
                  </Box>

                  <TextField
                    fullWidth
                    label="Meta Verification Code"
                    value={metaVerificationCode}
                    onChange={(e) => setMetaVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code from Meta"
                    margin="normal"
                    helperText="Enter the verification code received from Meta WhatsApp Business API"
                    InputProps={{
                      startAdornment: <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmitMetaCode}
                      disabled={metaVerificationLoading || !metaVerificationCode}
                      startIcon={metaVerificationLoading ? <CircularProgress size={20} /> : <VerifiedIcon />}
                      fullWidth
                      size="large"
                    >
                      {metaVerificationLoading ? 'Verifying...' : 'Verify Meta Code'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 4: Webhook Registration */}
              {currentStep === 4 && (
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Meta verification complete. Now register webhook via Twilio for agent message handling.
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      The webhook will be registered with Twilio WhatsApp Business Service, allowing messages to route from WhatsApp to your AI agent through Twilio's infrastructure.
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://agent-your-agent-id-851487020021.us-central1.run.app/api/whatsapp/webhook"
                    margin="normal"
                    helperText="This URL will receive incoming WhatsApp messages directly from your deployed agent"
                    InputProps={{
                      startAdornment: <WebhookIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  {webhookStatus && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Webhook Status
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        URL: {webhookStatus.webhook_url || 'Not registered'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Status: {webhookStatus.status || 'Unknown'}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleRegisterWebhook}
                      disabled={webhookRegistering || !webhookUrl}
                      startIcon={webhookRegistering ? <CircularProgress size={20} /> : <WebhookIcon />}
                      fullWidth
                      size="large"
                    >
                      {webhookRegistering ? 'Registering Webhook...' : 'Register Webhook'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleGetWebhookStatus}
                      disabled={refreshing}
                      startIcon={refreshing ? <CircularProgress size={20} /> : <InfoIcon />}
                    >
                      Check Status
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 5: Integration Complete */}
              {currentStep === 5 && (
                <Box textAlign="center">
                  <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Integration Complete!
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Your WhatsApp number {phoneNumber} is now connected to your AI agent via Twilio webhook. Messages route from WhatsApp → Twilio → Your Agent for reliable message handling.
                  </Typography>
                  
                  {Account && (
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Status: ${Account.status}`}
                        color="success"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip 
                        label={`Business: ${Account.business_name}`}
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      {Account.meta_verification_submitted && (
                        <Chip 
                          label="Meta Verified"
                          color="success"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {Account.webhook_registered && (
                        <Chip 
                          label="Meta Webhook Active"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                    </Box>
                  )}

                  {comprehensiveStatus && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Comprehensive Status
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Twilio: {comprehensiveStatus.comprehensive_status?.twilio_status?.status || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Meta: {comprehensiveStatus.comprehensive_status?.meta_status?.status || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Overall: {comprehensiveStatus.comprehensive_status?.overall_status || 'Unknown'}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={handleRefreshStatus}
                      disabled={refreshing}
                      startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                    >
                      Refresh Status
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleGetComprehensiveStatus}
                      disabled={refreshing}
                      startIcon={refreshing ? <CircularProgress size={20} /> : <InfoIcon />}
                    >
                      Get Comprehensive Status
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
};

export default WhatsAppIntegrationManager;