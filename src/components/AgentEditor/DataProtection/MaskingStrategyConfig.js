/**
 * Masking Strategy Config
 * 
 * Component for configuring how detected PII should be masked or redacted
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Token as TokenIcon,
  Block as BlockIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Api as ApiIcon
} from '@mui/icons-material';

// Masking method configurations
const MASKING_METHODS = {
  redact: {
    label: 'Full Redaction',
    description: 'Completely remove sensitive data',
    icon: <BlockIcon />,
    example: 'Credit Card: [REDACTED]',
    color: 'error',
    settings: []
  },
  mask: {
    label: 'Partial Masking',
    description: 'Show only last few characters',
    icon: <VisibilityOffIcon />,
    example: 'Credit Card: ****-****-****-1234',
    color: 'warning',
    settings: ['show_last_digits', 'replacement_char']
  },
  tokenize: {
    label: 'Tokenization',
    description: 'Replace with secure tokens',
    icon: <TokenIcon />,
    example: 'Credit Card: [TOKEN_CC_001]',
    color: 'info',
    settings: []
  },
  encrypt: {
    label: 'Encryption',
    description: 'Encrypt data (reversible)',
    icon: <LockIcon />,
    example: 'Credit Card: [ENC_MTIzNDU2Nzg]',
    color: 'success',
    settings: []
  }
};

// Context types for different masking rules
const CONTEXT_TYPES = {
  user_response: {
    label: 'User Response',
    description: 'Data shown to users in chat responses',
    icon: <PersonIcon />,
    recommended: 'mask'
  },
  audit_log: {
    label: 'Audit Logs',
    description: 'Data stored in system logs',
    icon: <HistoryIcon />,
    recommended: 'tokenize'
  },
  tool_parameters: {
    label: 'Tool Parameters',
    description: 'Data sent to external APIs/tools',
    icon: <ApiIcon />,
    recommended: 'redact'
  }
};

const MaskingStrategyConfig = ({ 
  strategy, 
  onStrategyChange, 
  disabled = false 
}) => {
  const theme = useTheme();
  const [previewText, setPreviewText] = useState('My credit card is 4111-1111-1111-1234 and phone is +91 98765 43210');

  // Handle strategy field changes
  const handleFieldChange = (field, value) => {
    const newStrategy = {
      ...strategy,
      [field]: value
    };
    onStrategyChange(newStrategy);
  };

  // Handle context rule changes
  const handleContextRuleChange = (context, method) => {
    const newStrategy = {
      ...strategy,
      context_rules: {
        ...strategy.context_rules,
        [context]: method
      }
    };
    onStrategyChange(newStrategy);
  };

  // Generate preview of masking
  const generatePreview = (text, method, settings = {}) => {
    const examples = {
      '4111-1111-1111-1234': {
        redact: '[REDACTED]',
        mask: generateMask('4111-1111-1111-1234', settings.show_last_digits || 4, settings.replacement_char || '*'),
        tokenize: '[TOKEN_CC_001]',
        encrypt: '[ENC_MTIzNDU2Nzg]'
      },
      '+91 98765 43210': {
        redact: '[REDACTED]',
        mask: generateMask('+91 98765 43210', settings.show_last_digits || 4, settings.replacement_char || '*'),
        tokenize: '[TOKEN_PH_002]',
        encrypt: '[ENC_OTg3NjU0MzIx]'
      }
    };

    let result = text;
    Object.entries(examples).forEach(([original, replacements]) => {
      result = result.replace(original, replacements[method] || original);
    });

    return result;
  };

  // Generate masked text
  const generateMask = (text, showLast, char) => {
    if (text.length <= showLast) return text;
    const visiblePart = text.slice(-showLast);
    const maskedLength = Math.max(4, text.length - showLast);
    return char.repeat(maskedLength) + visiblePart;
  };

  const currentMethod = MASKING_METHODS[strategy.default_method] || MASKING_METHODS.redact;

  return (
    <Card>
      <CardHeader
        title="Masking Strategy Configuration"
        subheader="Configure how detected sensitive data should be handled"
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Primary Masking Method */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Default Masking Method
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(MASKING_METHODS).map(([key, method]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper
                    elevation={strategy.default_method === key ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      border: strategy.default_method === key 
                        ? `2px solid ${theme.palette[method.color].main}`
                        : `1px solid ${theme.palette.divider}`,
                      bgcolor: strategy.default_method === key
                        ? theme.palette[method.color].light + '20'
                        : 'background.paper',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': !disabled ? {
                        elevation: 2,
                        transform: 'translateY(-1px)'
                      } : {}
                    }}
                    onClick={() => !disabled && handleFieldChange('default_method', key)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {React.cloneElement(method.icon, {
                        sx: { 
                          color: theme.palette[method.color].main,
                          mr: 1
                        }
                      })}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {method.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {method.description}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 0.5,
                        borderRadius: 0.5,
                        display: 'block'
                      }}
                    >
                      {method.example}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Method-specific Settings */}
            {currentMethod.settings.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {currentMethod.label} Settings
                </Typography>
                
                {currentMethod.settings.includes('show_last_digits') && (
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>
                      Show Last Digits: {strategy.show_last_digits || 0}
                    </Typography>
                    <Slider
                      value={strategy.show_last_digits || 0}
                      onChange={(e, value) => handleFieldChange('show_last_digits', value)}
                      min={0}
                      max={8}
                      marks={[
                        { value: 0, label: 'None' },
                        { value: 2, label: '2' },
                        { value: 4, label: '4' },
                        { value: 6, label: '6' },
                        { value: 8, label: '8' }
                      ]}
                      disabled={disabled}
                      sx={{ maxWidth: 300 }}
                    />
                  </Box>
                )}

                {currentMethod.settings.includes('replacement_char') && (
                  <TextField
                    label="Replacement Character"
                    value={strategy.replacement_char || '*'}
                    onChange={(e) => handleFieldChange('replacement_char', e.target.value.slice(0, 1))}
                    disabled={disabled}
                    sx={{ mb: 2, width: 120 }}
                    inputProps={{ maxLength: 1 }}
                    helperText="Single character to use for masking"
                  />
                )}
              </Box>
            )}
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: 'fit-content' }}>
              <Typography variant="subtitle1" gutterBottom>
                Live Preview
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Test Text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                disabled={disabled}
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Masked Result:
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                {generatePreview(previewText, strategy.default_method, {
                  show_last_digits: strategy.show_last_digits,
                  replacement_char: strategy.replacement_char
                })}
              </Paper>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Context-Specific Rules */}
        <Typography variant="h6" gutterBottom>
          Context-Specific Masking Rules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Apply different masking strategies based on where the data is used
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(CONTEXT_TYPES).map(([contextKey, context]) => (
            <Grid item xs={12} md={4} key={contextKey}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {context.icon}
                  <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                    {context.label}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {context.description}
                </Typography>
                
                <FormControl fullWidth disabled={disabled}>
                  <InputLabel>Masking Method</InputLabel>
                  <Select
                    value={strategy.context_rules?.[contextKey] || strategy.default_method}
                    onChange={(e) => handleContextRuleChange(contextKey, e.target.value)}
                    label="Masking Method"
                  >
                    {Object.entries(MASKING_METHODS).map(([key, method]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {method.icon}
                          <Typography sx={{ ml: 1 }}>
                            {method.label}
                          </Typography>
                          {key === context.recommended && (
                            <Chip 
                              label="Recommended" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Advanced Settings */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Advanced Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sensitivity Threshold"
                  value={strategy.sensitivity_threshold || 0.8}
                  onChange={(e) => handleFieldChange('sensitivity_threshold', parseFloat(e.target.value))}
                  disabled={disabled}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  helperText="Confidence level required for PII detection (0.0 - 1.0)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={strategy.preserve_format || false}
                      onChange={(e) => handleFieldChange('preserve_format', e.target.checked)}
                      disabled={disabled}
                    />
                  }
                  label="Preserve Original Format"
                />
                <Typography variant="body2" color="text.secondary">
                  Keep spacing and special characters in masked data
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Security Note:</strong> Higher sensitivity thresholds reduce false positives 
                    but may miss some sensitive data. Lower thresholds catch more data but may have 
                    more false positives.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default MaskingStrategyConfig;