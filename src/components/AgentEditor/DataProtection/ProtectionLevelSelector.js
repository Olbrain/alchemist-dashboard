/**
 * Protection Level Selector
 * 
 * Component for selecting predefined data protection levels with quick setup
 */
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Security as SecurityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Star as StarIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Protection level configurations
const PROTECTION_LEVELS = {
  none: {
    label: 'No Protection',
    icon: <VisibilityOffIcon />,
    color: 'default',
    description: 'Data protection is disabled',
    features: [],
    config: {
      enabled: false,
      pii_patterns: {},
      masking_strategy: { default_method: 'none' }
    }
  },
  basic: {
    label: 'Basic Protection',
    icon: <ShieldIcon />,
    color: 'warning',
    description: 'Essential PII protection for common data types',
    features: [
      'Credit card numbers',
      'Phone numbers',
      'Email addresses',
      'Simple masking'
    ],
    config: {
      enabled: true,
      pii_patterns: {
        credit_card: true,
        phone_number: true,
        email: true,
        pan_number: false,
        aadhaar_number: false,
        ssn: false,
        bank_account: false,
        passport: false,
        custom_patterns: []
      },
      masking_strategy: {
        default_method: 'mask',
        show_last_digits: 4,
        replacement_char: '*',
        context_rules: {
          user_response: 'mask',
          audit_log: 'mask',
          tool_parameters: 'redact'
        }
      }
    }
  },
  standard: {
    label: 'Standard Protection',
    icon: <SecurityIcon />,
    color: 'info',
    description: 'Comprehensive protection for business environments',
    recommended: true,
    features: [
      'All basic patterns',
      'PAN numbers',
      'Bank account numbers',
      'SSN/National IDs',
      'Advanced masking strategies',
      'Context-aware protection'
    ],
    config: {
      enabled: true,
      pii_patterns: {
        credit_card: true,
        phone_number: true,
        email: true,
        pan_number: true,
        aadhaar_number: true,
        ssn: true,
        bank_account: true,
        passport: false,
        custom_patterns: []
      },
      masking_strategy: {
        default_method: 'mask',
        show_last_digits: 4,
        replacement_char: '*',
        context_rules: {
          user_response: 'mask',
          audit_log: 'tokenize',
          tool_parameters: 'redact'
        }
      },
      sensitivity_threshold: 0.8,
      audit_protection_events: true
    }
  },
  strict: {
    label: 'Strict Protection',
    icon: <ShieldIcon />,
    color: 'success',
    description: 'Maximum protection for highly sensitive environments',
    features: [
      'All standard patterns',
      'Passport numbers',
      'Full redaction option',
      'High sensitivity threshold',
      'Complete audit logging',
      'Advanced threat detection'
    ],
    config: {
      enabled: true,
      pii_patterns: {
        credit_card: true,
        phone_number: true,
        email: true,
        pan_number: true,
        aadhaar_number: true,
        ssn: true,
        bank_account: true,
        passport: true,
        custom_patterns: []
      },
      masking_strategy: {
        default_method: 'redact',
        show_last_digits: 0,
        replacement_char: '█',
        context_rules: {
          user_response: 'redact',
          audit_log: 'tokenize',
          tool_parameters: 'redact'
        }
      },
      sensitivity_threshold: 0.95,
      audit_protection_events: true
    }
  },
  custom: {
    label: 'Custom Configuration',
    icon: <SettingsIcon />,
    color: 'primary',
    description: 'Manually configure protection settings',
    features: [
      'Custom PII patterns',
      'Flexible masking rules',
      'Industry-specific settings',
      'Advanced configuration options'
    ],
    config: null // Will use existing config
  }
};

const ProtectionLevelSelector = ({ 
  selectedLevel, 
  onLevelChange, 
  disabled = false 
}) => {
  const theme = useTheme();

  const handleLevelChange = (event) => {
    const level = event.target.value;
    const levelConfig = PROTECTION_LEVELS[level];
    
    if (levelConfig.config) {
      onLevelChange(level, levelConfig.config);
    } else {
      // For custom level, just change the level without config
      onLevelChange(level, {});
    }
  };

  return (
    <Card>
      <CardHeader
        title="Protection Level"
        subheader="Choose a preset protection level or configure custom settings"
      />
      <CardContent>
        <FormControl component="fieldset" fullWidth disabled={disabled}>
          <RadioGroup
            value={selectedLevel}
            onChange={handleLevelChange}
            name="protection-level"
          >
            <Grid container spacing={2}>
              {Object.entries(PROTECTION_LEVELS).map(([level, config]) => (
                <Grid item xs={12} md={6} key={level}>
                  <Paper
                    elevation={selectedLevel === level ? 3 : 1}
                    sx={{
                      p: 0,
                      border: selectedLevel === level 
                        ? `2px solid ${config.color === 'default' ? theme.palette.grey[400] : theme.palette[config.color].main}`
                        : `1px solid ${theme.palette.divider}`,
                      bgcolor: selectedLevel === level 
                        ? alpha(config.color === 'default' ? theme.palette.grey[400] : theme.palette[config.color].main, 0.05)
                        : 'background.paper',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': !disabled ? {
                        elevation: 2,
                        transform: 'translateY(-2px)'
                      } : {}
                    }}
                    onClick={() => !disabled && handleLevelChange({ target: { value: level } })}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <FormControlLabel
                          value={level}
                          control={<Radio color={config.color} />}
                          label=""
                          sx={{ mr: 1, mt: -0.5 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {React.cloneElement(config.icon, {
                              sx: { 
                                color: config.color === 'default' ? theme.palette.grey[600] : theme.palette[config.color].main,
                                fontSize: 20
                              }
                            })}
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {config.label}
                            </Typography>
                            {config.recommended && (
                              <Chip
                                icon={<StarIcon />}
                                label="Recommended"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {config.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Features List */}
                      {config.features.length > 0 && (
                        <List dense sx={{ pt: 0 }}>
                          {config.features.slice(0, 4).map((feature, index) => (
                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 20 }}>
                                <CheckIcon 
                                  sx={{ 
                                    fontSize: 16, 
                                    color: config.color === 'default' ? theme.palette.grey[600] : theme.palette[config.color].main 
                                  }} 
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={feature}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { fontSize: '0.85rem' }
                                }}
                              />
                            </ListItem>
                          ))}
                          {config.features.length > 4 && (
                            <ListItem sx={{ px: 0, py: 0.5 }}>
                              <ListItemText 
                                primary={`+ ${config.features.length - 4} more features`}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { 
                                    fontSize: '0.85rem',
                                    fontStyle: 'italic',
                                    color: 'text.secondary'
                                  }
                                }}
                              />
                            </ListItem>
                          )}
                        </List>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </FormControl>

        {/* Level-specific Information */}
        {selectedLevel && selectedLevel !== 'none' && (
          <Alert 
            severity="info" 
            sx={{ mt: 3 }}
            icon={PROTECTION_LEVELS[selectedLevel].icon}
          >
            <Typography variant="subtitle2" gutterBottom>
              {PROTECTION_LEVELS[selectedLevel].label} Configuration
            </Typography>
            <Typography variant="body2">
              {selectedLevel === 'custom' 
                ? 'Use the sections below to configure your custom protection settings.'
                : `This preset will automatically configure ${PROTECTION_LEVELS[selectedLevel].features.length} protection features. You can further customize these settings in the sections below.`
              }
            </Typography>
          </Alert>
        )}

        {/* Additional Notes */}
        {selectedLevel === 'strict' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              High Security Mode
            </Typography>
            <Typography variant="body2">
              Strict protection may impact agent performance and user experience. 
              Test thoroughly before deployment in production environments.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProtectionLevelSelector;