/**
 * Protected Data Types
 * 
 * Read-only display of all data types protected by comprehensive security
 */
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  PersonPin as PersonPinIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  SwapHoriz as TransferIcon,
  Person as PersonIcon,
  FlightTakeoff as PassportIcon,
  ContactMail as ContactIcon
} from '@mui/icons-material';
import { MetricValue } from '../../../utils/typography';

// Comprehensive protected data types organized by category
const PROTECTED_DATA_CATEGORIES = {
  'Financial Information': {
    color: 'error',
    icon: <CreditCardIcon />,
    description: 'All financial data is automatically protected',
    patterns: [
      {
        name: 'Credit/Debit Cards',
        example: '4111-1111-1111-1234',
        icon: <CreditCardIcon />,
        description: 'All card numbers including Visa, MasterCard, Amex, etc.'
      },
      {
        name: 'Bank Account Numbers',
        example: '123456789012',
        icon: <AccountBalanceIcon />,
        description: 'Savings, checking, and investment account numbers'
      },
      {
        name: 'IFSC Codes',
        example: 'SBIN0001234',
        icon: <TransferIcon />,
        description: 'Indian Financial System Codes for bank branches'
      },
      {
        name: 'UPI IDs',
        example: 'user@paytm',
        icon: <PhoneIcon />,
        description: 'Unified Payments Interface identifiers'
      }
    ]
  },
  'Government IDs': {
    color: 'warning',
    icon: <BadgeIcon />,
    description: 'All government-issued identification numbers',
    patterns: [
      {
        name: 'PAN Numbers',
        example: 'ABCDE1234F',
        icon: <BadgeIcon />,
        description: 'Permanent Account Numbers for tax identification'
      },
      {
        name: 'Aadhaar Numbers',
        example: '1234 5678 9012',
        icon: <PersonPinIcon />,
        description: 'Unique Identification Authority numbers'
      },
      {
        name: 'Passport Numbers',
        example: 'A12345678',
        icon: <PassportIcon />,
        description: 'Indian and international passport numbers'
      },
      {
        name: 'Voter IDs',
        example: 'ABC1234567',
        icon: <PersonIcon />,
        description: 'Electoral photo identity cards'
      }
    ]
  },
  'Personal Information': {
    color: 'info',
    icon: <ContactIcon />,
    description: 'Personal contact and identification details',
    patterns: [
      {
        name: 'Phone Numbers',
        example: '+91 98765 43210',
        icon: <PhoneIcon />,
        description: 'Mobile and landline numbers in all formats'
      },
      {
        name: 'Email Addresses',
        example: 'customer@email.com',
        icon: <EmailIcon />,
        description: 'Personal and business email addresses'
      },
      {
        name: 'Home Addresses',
        example: '123 Main Street, Mumbai',
        icon: <HomeIcon />,
        description: 'Residential and business addresses'
      },
      {
        name: 'Date of Birth',
        example: '15/08/1990',
        icon: <CalendarIcon />,
        description: 'Birth dates in various formats'
      }
    ]
  },
  'Business Operations': {
    color: 'success',
    icon: <AccountBalanceIcon />,
    description: 'Business-specific identifiers and transaction data',
    patterns: [
      {
        name: 'Customer IDs',
        example: 'CUST123456789',
        icon: <PersonIcon />,
        description: 'Unique customer identification numbers'
      },
      {
        name: 'Transaction IDs',
        example: 'TXN202409031234',
        icon: <ReceiptIcon />,
        description: 'Payment and transfer transaction identifiers'
      },
      {
        name: 'Account References',
        example: 'REF987654321',
        icon: <AccountBalanceIcon />,
        description: 'Internal account reference numbers'
      },
      {
        name: 'MICR Codes',
        example: '400002001',
        icon: <ContactIcon />,
        description: 'Magnetic Ink Character Recognition codes'
      }
    ]
  }
};

const ProtectedDataTypes = ({ 
  config, 
  disabled = false 
}) => {

  return (
    <Card>
      <CardHeader
        title="Protected Data Types"
        subheader={`${config.enabled ? 'All sensitive data types are automatically protected' : 'Preview of data types that will be protected'}`}
      />
      <CardContent>
        {/* Protection Status */}
        <Alert 
          severity={config.enabled ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {config.enabled ? '🛡️ Data Protection Active' : '⚠️ Protection Disabled'}
          </Typography>
          <Typography variant="body2">
            {config.enabled 
              ? 'All data types listed below are being automatically detected and protected according to enterprise security standards.'
              : 'Enable data protection to safeguard all the data types listed below.'
            }
          </Typography>
        </Alert>

        {/* Protected Categories */}
        {Object.entries(PROTECTED_DATA_CATEGORIES).map(([categoryName, category]) => (
          <Accordion key={categoryName} defaultExpanded>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: config.enabled ? `${category.color}.50` : 'grey.50',
                '&:hover': {
                  bgcolor: config.enabled ? `${category.color}.100` : 'grey.100'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {React.cloneElement(category.icon, {
                  sx: { 
                    color: config.enabled ? `${category.color}.main` : 'text.disabled'
                  }
                })}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {categoryName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </Box>
                <Chip
                  label={`${category.patterns.length} patterns`}
                  size="small"
                  color={config.enabled ? category.color : 'default'}
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {category.patterns.map((pattern, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        opacity: config.enabled ? 1 : 0.6,
                        bgcolor: config.enabled ? 'background.paper' : 'grey.50'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        {React.cloneElement(pattern.icon, {
                          sx: { 
                            color: config.enabled ? `${category.color}.main` : 'text.disabled',
                            fontSize: 24
                          }
                        })}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {pattern.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {pattern.description}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontFamily: 'monospace',
                              bgcolor: config.enabled ? 'success.50' : 'grey.100',
                              color: config.enabled ? 'success.dark' : 'text.disabled',
                              p: 0.5,
                              borderRadius: 0.5,
                              display: 'block'
                            }}
                          >
                            Example: {pattern.example}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Summary Stats */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mt: 3, 
            bgcolor: config.enabled ? 'success.50' : 'grey.50',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Total Protection Coverage
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
            <Box>
              <MetricValue sx={{ fontWeight: 700, color: config.enabled ? 'success.main' : 'text.disabled' }}>
                {Object.values(PROTECTED_DATA_CATEGORIES).reduce((total, category) => total + category.patterns.length, 0)}
              </MetricValue>
              <Typography variant="body2" color="text.secondary">
                Data Types Protected
              </Typography>
            </Box>
            <Box>
              <MetricValue sx={{ fontWeight: 700, color: config.enabled ? 'success.main' : 'text.disabled' }}>
                4
              </MetricValue>
              <Typography variant="body2" color="text.secondary">
                Masking Strategies
              </Typography>
            </Box>
            <Box>
              <MetricValue sx={{ fontWeight: 700, color: config.enabled ? 'success.main' : 'text.disabled' }}>
                {Object.keys(PROTECTED_DATA_CATEGORIES).length}
              </MetricValue>
              <Typography variant="body2" color="text.secondary">
                Categories Covered
              </Typography>
            </Box>
          </Box>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default ProtectedDataTypes;