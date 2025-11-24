/**
 * User Authentication Tab
 * 
 * Configure SMS OTP and Email OTP authentication methods for users
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import {
  Lock as LockIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Api as ApiIcon,
  Webhook as WebhookIcon,
  Settings as SettingsIcon,
  Science as TestIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const INTEGRATION_METHODS = [
  { 
    value: 'api', 
    label: 'API Endpoint', 
    description: 'Call your REST API endpoint to send OTP',
    icon: <ApiIcon />
  },
  { 
    value: 'service', 
    label: 'Service Provider', 
    description: 'Use your SMS/Email service credentials',
    icon: <SettingsIcon />
  },
  { 
    value: 'webhook', 
    label: 'Webhook', 
    description: 'Trigger your webhook to send OTP',
    icon: <WebhookIcon />
  }
];

const SMS_PROVIDERS = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'msg91', label: 'MSG91' },
  { value: 'fast2sms', label: 'Fast2SMS' },
  { value: 'textlocal', label: 'TextLocal' },
  { value: 'custom', label: 'Custom Provider' }
];

const EMAIL_PROVIDERS = [
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'Amazon SES' },
  { value: 'smtp', label: 'SMTP Server' },
  { value: 'custom', label: 'Custom Provider' }
];

const UserAuthenticationTab = ({ 
  agent, 
  onConfigChange, 
  loading = false, 
  disabled = false 
}) => {
  const [config, setConfig] = useState({
    enabled: false,
    sms_otp: {
      enabled: false,
      method: 'api',
      config: {
        api_endpoint: '',
        auth_type: 'bearer_token',
        auth_value: '',
        phone_field: 'phone_number',
        message_field: 'message',
        provider: 'twilio',
        account_sid: '',
        auth_token: '',
        from_number: '',
        webhook_url: '',
        webhook_auth_type: 'none'
      },
      settings: {
        code_length: 6,
        expiry_minutes: 5,
        max_attempts: 3
      }
    },
    email_otp: {
      enabled: false,
      method: 'api',
      config: {
        api_endpoint: '',
        auth_type: 'bearer_token',
        auth_value: '',
        email_field: 'email',
        message_field: 'message',
        subject_field: 'subject',
        provider: 'sendgrid',
        api_key: '',
        from_email: '',
        webhook_url: '',
        webhook_auth_type: 'none'
      },
      settings: {
        code_length: 6,
        expiry_minutes: 5,
        max_attempts: 3,
        subject_template: 'Your verification code is {code}'
      }
    }
  });

  // Load configuration from agent data
  useEffect(() => {
    if (agent?.user_authentication) {
      setConfig(agent.user_authentication);
    }
  }, [agent]);

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleToggleAuthentication = (enabled) => {
    const newConfig = { ...config, enabled };
    handleConfigChange(newConfig);
  };

  const handleToggleMethod = (method, enabled) => {
    const newConfig = {
      ...config,
      [method]: {
        ...config[method],
        enabled
      }
    };
    handleConfigChange(newConfig);
  };

  const handleMethodConfigChange = (method, field, value) => {
    const newConfig = {
      ...config,
      [method]: {
        ...config[method],
        config: {
          ...config[method].config,
          [field]: value
        }
      }
    };
    handleConfigChange(newConfig);
  };

  const handleSettingsChange = (method, field, value) => {
    const newConfig = {
      ...config,
      [method]: {
        ...config[method],
        settings: {
          ...config[method].settings,
          [field]: value
        }
      }
    };
    handleConfigChange(newConfig);
  };

  const handleMethodChange = (method, integrationMethod) => {
    const newConfig = {
      ...config,
      [method]: {
        ...config[method],
        method: integrationMethod
      }
    };
    handleConfigChange(newConfig);
  };

  const renderMethodConfiguration = (method, methodConfig, title, icon) => {
    const isEnabled = methodConfig.enabled;
    const selectedMethod = methodConfig.method;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={icon}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">{title}</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={(e) => handleToggleMethod(method, e.target.checked)}
                    disabled={disabled || !config.enabled}
                  />
                }
                label={isEnabled ? 'Enabled' : 'Disabled'}
              />
            </Box>
          }
        />
        
        {isEnabled && (
          <CardContent>
            {/* Integration Method Selection */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Integration Method</InputLabel>
                  <Select
                    value={selectedMethod}
                    onChange={(e) => handleMethodChange(method, e.target.value)}
                    label="Integration Method"
                    disabled={disabled}
                  >
                    {INTEGRATION_METHODS.map((intMethod) => (
                      <MenuItem key={intMethod.value} value={intMethod.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {intMethod.icon}
                          <Box>
                            <Typography variant="body2">{intMethod.label}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {intMethod.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* API Endpoint Configuration */}
              {selectedMethod === 'api' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Endpoint URL"
                      value={methodConfig.config.api_endpoint}
                      onChange={(e) => handleMethodConfigChange(method, 'api_endpoint', e.target.value)}
                      placeholder={`https://api.yourservice.com/send-${method === 'sms_otp' ? 'sms' : 'email'}-otp`}
                      disabled={disabled}
                      helperText="The REST API endpoint that will send the OTP"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Authentication Type</InputLabel>
                      <Select
                        value={methodConfig.config.auth_type}
                        onChange={(e) => handleMethodConfigChange(method, 'auth_type', e.target.value)}
                        label="Authentication Type"
                        disabled={disabled}
                      >
                        <MenuItem value="bearer_token">Bearer Token</MenuItem>
                        <MenuItem value="api_key">API Key</MenuItem>
                        <MenuItem value="basic_auth">Basic Auth</MenuItem>
                        <MenuItem value="none">None</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Authentication Value"
                      type="password"
                      value={methodConfig.config.auth_value}
                      onChange={(e) => handleMethodConfigChange(method, 'auth_value', e.target.value)}
                      disabled={disabled}
                      helperText="API key, token, or credentials"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={method === 'sms_otp' ? 'Phone Number Field' : 'Email Field'}
                      value={method === 'sms_otp' ? methodConfig.config.phone_field : methodConfig.config.email_field}
                      onChange={(e) => handleMethodConfigChange(method, method === 'sms_otp' ? 'phone_field' : 'email_field', e.target.value)}
                      placeholder={method === 'sms_otp' ? 'phone_number' : 'email'}
                      disabled={disabled}
                      helperText="JSON field name for the recipient"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Message Field"
                      value={methodConfig.config.message_field}
                      onChange={(e) => handleMethodConfigChange(method, 'message_field', e.target.value)}
                      placeholder="message"
                      disabled={disabled}
                      helperText="JSON field name for OTP message"
                    />
                  </Grid>
                  {method === 'email_otp' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Subject Field"
                        value={methodConfig.config.subject_field}
                        onChange={(e) => handleMethodConfigChange(method, 'subject_field', e.target.value)}
                        placeholder="subject"
                        disabled={disabled}
                        helperText="JSON field name for email subject"
                      />
                    </Grid>
                  )}
                </>
              )}

              {/* Service Provider Configuration */}
              {selectedMethod === 'service' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Service Provider</InputLabel>
                      <Select
                        value={methodConfig.config.provider}
                        onChange={(e) => handleMethodConfigChange(method, 'provider', e.target.value)}
                        label="Service Provider"
                        disabled={disabled}
                      >
                        {(method === 'sms_otp' ? SMS_PROVIDERS : EMAIL_PROVIDERS).map((provider) => (
                          <MenuItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* SMS Service Configuration */}
                  {method === 'sms_otp' && (
                    <>
                      {methodConfig.config.provider === 'twilio' && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Account SID"
                              value={methodConfig.config.account_sid}
                              onChange={(e) => handleMethodConfigChange(method, 'account_sid', e.target.value)}
                              disabled={disabled}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Auth Token"
                              type="password"
                              value={methodConfig.config.auth_token}
                              onChange={(e) => handleMethodConfigChange(method, 'auth_token', e.target.value)}
                              disabled={disabled}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="From Phone Number"
                              value={methodConfig.config.from_number}
                              onChange={(e) => handleMethodConfigChange(method, 'from_number', e.target.value)}
                              placeholder="+1234567890"
                              disabled={disabled}
                            />
                          </Grid>
                        </>
                      )}
                    </>
                  )}

                  {/* Email Service Configuration */}
                  {method === 'email_otp' && (
                    <>
                      {methodConfig.config.provider === 'sendgrid' && (
                        <>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="SendGrid API Key"
                              type="password"
                              value={methodConfig.config.api_key}
                              onChange={(e) => handleMethodConfigChange(method, 'api_key', e.target.value)}
                              disabled={disabled}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="From Email Address"
                              value={methodConfig.config.from_email}
                              onChange={(e) => handleMethodConfigChange(method, 'from_email', e.target.value)}
                              placeholder="noreply@yourservice.com"
                              disabled={disabled}
                            />
                          </Grid>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Webhook Configuration */}
              {selectedMethod === 'webhook' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      value={methodConfig.config.webhook_url}
                      onChange={(e) => handleMethodConfigChange(method, 'webhook_url', e.target.value)}
                      placeholder={`https://yourservice.com/webhooks/send-${method === 'sms_otp' ? 'sms' : 'email'}-otp`}
                      disabled={disabled}
                      helperText="URL that agent will call to trigger OTP sending"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Webhook Authentication</InputLabel>
                      <Select
                        value={methodConfig.config.webhook_auth_type}
                        onChange={(e) => handleMethodConfigChange(method, 'webhook_auth_type', e.target.value)}
                        label="Webhook Authentication"
                        disabled={disabled}
                      >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="bearer_token">Bearer Token</MenuItem>
                        <MenuItem value="api_key">API Key</MenuItem>
                        <MenuItem value="basic_auth">Basic Auth</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {methodConfig.config.webhook_auth_type !== 'none' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Authentication Value"
                        type="password"
                        value={methodConfig.config.auth_value}
                        onChange={(e) => handleMethodConfigChange(method, 'auth_value', e.target.value)}
                        disabled={disabled}
                        helperText="Token, key, or credentials for webhook authentication"
                      />
                    </Grid>
                  )}
                </>
              )}

              {/* OTP Settings */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  OTP Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Code Length"
                  type="number"
                  value={methodConfig.settings.code_length}
                  onChange={(e) => handleSettingsChange(method, 'code_length', parseInt(e.target.value))}
                  inputProps={{ min: 4, max: 10 }}
                  disabled={disabled}
                  helperText="4-10 digits"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Expiry (minutes)"
                  type="number"
                  value={methodConfig.settings.expiry_minutes}
                  onChange={(e) => handleSettingsChange(method, 'expiry_minutes', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  disabled={disabled}
                  helperText="1-10 minutes"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Attempts"
                  type="number"
                  value={methodConfig.settings.max_attempts}
                  onChange={(e) => handleSettingsChange(method, 'max_attempts', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  disabled={disabled}
                  helperText="1-10 attempts"
                />
              </Grid>

              {/* Email Subject Template */}
              {method === 'email_otp' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject Template"
                    value={methodConfig.settings.subject_template}
                    onChange={(e) => handleSettingsChange(method, 'subject_template', e.target.value)}
                    placeholder="Your verification code is {code}"
                    disabled={disabled}
                    helperText="Use {code} placeholder for the OTP code"
                  />
                </Grid>
              )}

              {/* Test Configuration */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<TestIcon />}
                    disabled={disabled || loading}
                    onClick={() => console.log('Test OTP sending for', method)}
                  >
                    Test {method === 'sms_otp' ? 'SMS' : 'Email'} OTP
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    Send a test OTP to verify your configuration
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon />
          User Authentication
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configure how your agent authenticates users before providing services. 
          Users will need to verify their identity via SMS or Email OTP.
        </Typography>
      </Box>

      {/* Main Authentication Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Enable User Authentication
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Require users to verify their identity before accessing your agent
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => handleToggleAuthentication(e.target.checked)}
                  disabled={disabled}
                />
              }
              label={config.enabled ? 'Enabled' : 'Disabled'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Authentication Methods */}
      {config.enabled && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              How It Works
            </Typography>
            <Typography variant="body2">
              When users interact with your agent, they will first need to verify their phone number or email address. 
              Your agent will use the methods configured below to send verification codes.
            </Typography>
          </Alert>

          {/* SMS OTP Configuration */}
          {renderMethodConfiguration(
            'sms_otp',
            config.sms_otp,
            'SMS OTP',
            <SmsIcon color="primary" />
          )}

          {/* Email OTP Configuration */}
          {renderMethodConfiguration(
            'email_otp',
            config.email_otp,
            'Email OTP',
            <EmailIcon color="primary" />
          )}

          {/* Save Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={disabled || loading}
              onClick={() => console.log('Save authentication configuration', config)}
            >
              Save Authentication Settings
            </Button>
          </Box>
        </Box>
      )}

      {/* Security Information */}
      {config.enabled && (config.sms_otp.enabled || config.email_otp.enabled) && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Security Notice
          </Typography>
          <Typography variant="body2">
            • Authentication credentials are stored securely and encrypted
            • OTP codes are automatically expired after the configured time
            • Failed verification attempts are rate-limited for security
            • All authentication events are logged for audit purposes
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default UserAuthenticationTab;