/**
 * Masking Preview
 * 
 * Read-only preview of comprehensive masking strategies
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  Alert,
  useTheme
} from '@mui/material';
import {
  Person as CustomerIcon,
  History as AuditIcon,
  Api as ExternalApiIcon,
  Lock as InternalIcon,
  Visibility as PreviewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Comprehensive masking strategies
const MASKING_STRATEGIES = {
  customer_response: {
    label: 'Customer Facing',
    method: 'Partial Masking',
    description: 'Shows last 4 digits to customers for verification',
    icon: <CustomerIcon />,
    color: 'info',
    example: {
      'Credit Card 4111-1111-1111-1234': '****-****-****-1234',
      'Account 123456789012': '********9012', 
      'PAN ABCDE1234F': '*****1234F',
      'Phone +91 98765 43210': '+91 *****3210'
    }
  },
  audit_log: {
    label: 'Audit Logs',
    method: 'Tokenization',
    description: 'Secure tokens for auditing and compliance',
    icon: <AuditIcon />,
    color: 'warning',
    example: {
      'Credit Card 4111-1111-1111-1234': '[TOKEN_CC_A7B2C9D1]',
      'Account 123456789012': '[TOKEN_ACC_X9Y3Z8W5]',
      'PAN ABCDE1234F': '[TOKEN_PAN_M4N8P2Q6]',
      'Phone +91 98765 43210': '[TOKEN_PH_K5L9M3N7]'
    }
  },
  external_api: {
    label: 'External APIs',
    method: 'Full Redaction',
    description: 'Complete removal for third-party services',
    icon: <ExternalApiIcon />,
    color: 'error',
    example: {
      'Credit Card 4111-1111-1111-1234': '[REDACTED]',
      'Account 123456789012': '[REDACTED]',
      'PAN ABCDE1234F': '[REDACTED]',
      'Phone +91 98765 43210': '[REDACTED]'
    }
  },
  internal_processing: {
    label: 'Internal Processing',
    method: 'Encryption',
    description: 'Reversible encryption for authorized internal use',
    icon: <InternalIcon />,
    color: 'success',
    example: {
      'Credit Card 4111-1111-1111-1234': '[ENC_NDExMS0xMTEx]',
      'Account 123456789012': '[ENC_MTIzNDU2Nzg5]',
      'PAN ABCDE1234F': '[ENC_QUJDREU1MjM0]',
      'Phone +91 98765 43210': '[ENC_KzkxIDk4NzY1]'
    }
  }
};

// Sample conversation for preview
const SAMPLE_TEXT = `Hello, I need help with my account. My details are:
- Account number: 123456789012
- Credit card: 4111-1111-1111-1234  
- PAN: ABCDE1234F
- Phone: +91 98765 43210
- Email: customer@email.com
Can you help me check my balance?`;

const MaskingPreview = ({ 
  strategy, 
  disabled = false 
}) => {
  const [previewText, setPreviewText] = useState(SAMPLE_TEXT);
  const [currentStrategy, setCurrentStrategy] = useState('customer_response');

  // Apply masking to sample text based on strategy
  const applyMaskingToText = (text, strategyKey) => {
    const strategyConfig = MASKING_STRATEGIES[strategyKey];
    if (!strategyConfig) return text;

    let maskedText = text;
    Object.entries(strategyConfig.example).forEach(([pattern, replacement]) => {
      // Extract the actual sensitive data (part after the colon)
      const originalData = pattern.split(' ').slice(1).join(' ');
      maskedText = maskedText.replace(new RegExp(originalData.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });
    
    return maskedText;
  };

  return (
    <Card>
      <CardHeader
        title="Masking Strategies"
        subheader="How different contexts handle sensitive data with comprehensive protection"
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Strategy Overview */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Data Protection Strategy:</strong> Different contexts require different levels of data visibility. 
                Customer-facing responses show partial data for verification, while external APIs receive completely redacted data.
              </Typography>
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Context</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Example Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(MASKING_STRATEGIES).map(([key, strategy]) => (
                    <TableRow 
                      key={key}
                      sx={{ 
                        '&:hover': { bgcolor: 'grey.50' },
                        cursor: 'pointer'
                      }}
                      onClick={() => setCurrentStrategy(key)}
                      selected={currentStrategy === key}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {React.cloneElement(strategy.icon, {
                            sx: { color: `${strategy.color}.main` }
                          })}
                          <Typography variant="subtitle2">
                            {strategy.label}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={strategy.method}
                          color={strategy.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {strategy.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace',
                            bgcolor: `${strategy.color}.50`,
                            p: 0.5,
                            borderRadius: 0.5
                          }}
                        >
                          ****-****-****-1234
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Live Preview */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PreviewIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Live Masking Preview
                </Typography>
                <Chip
                  label={MASKING_STRATEGIES[currentStrategy].label}
                  color={MASKING_STRATEGIES[currentStrategy].color}
                  variant="outlined"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Original Text:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    disabled={disabled}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    {MASKING_STRATEGIES[currentStrategy].label} Result:
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      minHeight: 120,
                      bgcolor: `${MASKING_STRATEGIES[currentStrategy].color}.50`,
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      whiteSpace: 'pre-wrap',
                      overflow: 'auto'
                    }}
                  >
                    {applyMaskingToText(previewText, currentStrategy)}
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setPreviewText(SAMPLE_TEXT)}
                  disabled={disabled}
                >
                  Reset Sample
                </Button>
                {Object.keys(MASKING_STRATEGIES).map((strategyKey) => (
                  <Button
                    key={strategyKey}
                    size="small"
                    variant={currentStrategy === strategyKey ? 'contained' : 'outlined'}
                    onClick={() => setCurrentStrategy(strategyKey)}
                    disabled={disabled}
                  >
                    {MASKING_STRATEGIES[strategyKey].label}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MaskingPreview;