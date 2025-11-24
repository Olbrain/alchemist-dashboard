/**
 * User Authentication Modal
 *
 * Configuration modal for user authentication feature
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Lock as LockIcon
} from '@mui/icons-material';

import { userAuthenticationFeature } from '../features/UserAuthenticationFeature';

const UserAuthenticationModal = ({ open, onClose, onSave, agent }) => {
  const [config, setConfig] = useState(userAuthenticationFeature.getDefaultConfig());
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (agent?.user_authentication) {
      setConfig({ ...config, ...agent.user_authentication });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  const handleProviderToggle = (provider) => {
    const providers = config.providers.includes(provider)
      ? config.providers.filter(p => p !== provider)
      : [...config.providers, provider];
    setConfig({ ...config, providers });
  };

  const handleSave = () => {
    const validationErrors = userAuthenticationFeature.validateConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSave(userAuthenticationFeature.id, config);
  };

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LockIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
          User Authentication Configuration
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          Configure user authentication to verify user identity before allowing interaction with your agent.
        </Alert>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Authentication Providers */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Authentication Methods
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label="SMS OTP"
                clickable
                color={config.providers.includes('sms') ? 'primary' : 'default'}
                variant={config.providers.includes('sms') ? 'filled' : 'outlined'}
                onClick={() => handleProviderToggle('sms')}
              />
              <Chip
                label="Email OTP"
                clickable
                color={config.providers.includes('email') ? 'primary' : 'default'}
                variant={config.providers.includes('email') ? 'filled' : 'outlined'}
                onClick={() => handleProviderToggle('email')}
              />
            </Box>
          </Grid>

          {/* SMS Configuration */}
          {config.providers.includes('sms') && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>SMS Provider</InputLabel>
                <Select
                  value={config.sms_provider}
                  onChange={(e) => setConfig({ ...config, sms_provider: e.target.value })}
                  label="SMS Provider"
                >
                  <MenuItem value="twilio">Twilio</MenuItem>
                  <MenuItem value="aws_sns">AWS SNS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Email Configuration */}
          {config.providers.includes('email') && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Email Provider</InputLabel>
                <Select
                  value={config.email_provider}
                  onChange={(e) => setConfig({ ...config, email_provider: e.target.value })}
                  label="Email Provider"
                >
                  <MenuItem value="sendgrid">SendGrid</MenuItem>
                  <MenuItem value="aws_ses">AWS SES</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
          </Grid>

          {/* Session Duration */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Session Duration (minutes)"
              type="number"
              value={config.session_duration_minutes}
              onChange={(e) => setConfig({ ...config, session_duration_minutes: parseInt(e.target.value) })}
              inputProps={{ min: 5, max: 1440 }}
              helperText="How long authenticated sessions last (5-1440 minutes)"
            />
          </Grid>

          {/* Max Attempts */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Verification Attempts"
              type="number"
              value={config.max_attempts}
              onChange={(e) => setConfig({ ...config, max_attempts: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 10 }}
              helperText="Maximum failed attempts before cooldown (1-10)"
            />
          </Grid>

          {/* Cooldown Duration */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cooldown Duration (minutes)"
              type="number"
              value={config.cooldown_minutes}
              onChange={(e) => setConfig({ ...config, cooldown_minutes: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 60 }}
              helperText="Cooldown period after max attempts (1-60 minutes)"
            />
          </Grid>

          {/* Verification Requirements */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.require_phone_verification}
                  onChange={(e) => setConfig({ ...config, require_phone_verification: e.target.checked })}
                />
              }
              label="Require phone number verification"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.require_email_verification}
                  onChange={(e) => setConfig({ ...config, require_email_verification: e.target.checked })}
                />
              }
              label="Require email verification"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={config.providers.length === 0}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserAuthenticationModal;