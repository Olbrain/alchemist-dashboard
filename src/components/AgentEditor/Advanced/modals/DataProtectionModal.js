/**
 * Data Protection Modal
 *
 * Configuration modal for data protection feature
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
  Grid,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

import { dataProtectionFeature } from '../features/DataProtectionFeature';

const DataProtectionModal = ({ open, onClose, onSave, agent }) => {
  const [config, setConfig] = useState(dataProtectionFeature.getDefaultConfig());
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (agent?.data_protection) {
      setConfig({ ...config, ...agent.data_protection });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  const handleSave = () => {
    const validationErrors = dataProtectionFeature.validateConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSave(dataProtectionFeature.id, config);
  };

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  const protectionLevels = dataProtectionFeature.getProtectionLevels();

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
        <SecurityIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
          Data Protection Configuration
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Data protection automatically masks sensitive information in conversations. Configure which types of data to protect.
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
          {/* Protection Level */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Protection Level</InputLabel>
              <Select
                value={config.protection_level}
                onChange={(e) => setConfig({ ...config, protection_level: e.target.value })}
                label="Protection Level"
              >
                {protectionLevels.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {level.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {level.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Data Types to Protect
            </Typography>
          </Grid>

          {/* Data Type Toggles */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.mask_pii}
                  onChange={(e) => setConfig({ ...config, mask_pii: e.target.checked })}
                />
              }
              label="Personal Identifiable Information (PII)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.mask_emails}
                  onChange={(e) => setConfig({ ...config, mask_emails: e.target.checked })}
                />
              }
              label="Email Addresses"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.mask_phones}
                  onChange={(e) => setConfig({ ...config, mask_phones: e.target.checked })}
                />
              }
              label="Phone Numbers"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.mask_credit_cards}
                  onChange={(e) => setConfig({ ...config, mask_credit_cards: e.target.checked })}
                />
              }
              label="Credit Card Numbers"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.mask_ssn}
                  onChange={(e) => setConfig({ ...config, mask_ssn: e.target.checked })}
                />
              }
              label="Social Security Numbers"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Masking Options
            </Typography>
          </Grid>

          {/* Masking Character */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Masking Character"
              value={config.masking_character}
              onChange={(e) => setConfig({ ...config, masking_character: e.target.value.charAt(0) })}
              inputProps={{ maxLength: 1 }}
              helperText="Character used to mask sensitive data"
            />
          </Grid>

          {/* Preserve Length */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.preserve_length}
                  onChange={(e) => setConfig({ ...config, preserve_length: e.target.checked })}
                />
              }
              label="Preserve original text length"
            />
          </Grid>

          {/* Protection Level Preview */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Protection Level: {protectionLevels.find(l => l.value === config.protection_level)?.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {protectionLevels.find(l => l.value === config.protection_level)?.description}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" fontWeight="medium">Features included:</Typography>
                <ul style={{ margin: '4px 0', paddingLeft: '1.2rem', fontSize: '0.75rem' }}>
                  {protectionLevels.find(l => l.value === config.protection_level)?.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </Box>
            </Box>
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
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataProtectionModal;