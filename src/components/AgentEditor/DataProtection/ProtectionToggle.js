/**
 * Data Protection Toggle
 * 
 * Simple ON/OFF toggle for comprehensive data protection
 */
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  useTheme,
  Stack,
  Button
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Security as SecurityIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Verified as VerifiedIcon,
  Lock as LockIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const PROTECTION_BENEFITS = [
  {
    title: 'Regulatory Compliance',
    description: 'Meets industry standards and regulatory guidelines',
    icon: <VerifiedIcon />
  },
  {
    title: 'Complete PII Protection',
    description: 'Protects all customer data including financial and personal information',
    icon: <ShieldIcon />
  },
  {
    title: 'Audit Trail',
    description: 'Full logging and monitoring for compliance audits',
    icon: <SecurityIcon />
  },
  {
    title: 'Production Ready',
    description: 'Safe for customer-facing applications',
    icon: <CheckCircleIcon />
  }
];

const PROTECTION_REQUIREMENTS = [
  'Customer financial information must be protected',
  'Government IDs and personal data require masking',
  'All transactions must be auditable',
  'External API calls must not expose sensitive data',
  'Compliance with industry regulations is mandatory'
];

const ProtectionToggle = ({ 
  enabled, 
  onToggle, 
  disabled = false,
  hasChanges = false,
  onSave,
  status
}) => {
  const theme = useTheme();

  return (
    <Card>
      <CardHeader
        title="Data Protection"
        subheader="Comprehensive PII protection for sensitive data handling"
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            {status && (
              <Chip
                icon={status.icon}
                label={status.status}
                color={status.color}
                variant="outlined"
              />
            )}
            {hasChanges && onSave && (
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={onSave}
                disabled={disabled}
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
              elevation={enabled ? 3 : 1}
              sx={{
                p: 3,
                border: enabled 
                  ? `2px solid ${theme.palette.success.main}`
                  : `1px solid ${theme.palette.divider}`,
                bgcolor: enabled 
                  ? theme.palette.success.light + '10'
                  : 'background.paper',
                transition: 'all 0.3s ease'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                {enabled ? (
                  <ShieldIcon sx={{ fontSize: 48, color: 'success.main' }} />
                ) : (
                  <VisibilityOffIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                )}
              </Box>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Enterprise Grade Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {enabled 
                    ? 'All sensitive data is fully protected'
                    : 'Sensitive data is not protected'
                  }
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={(e) => onToggle(e.target.checked)}
                      disabled={disabled}
                      size="large"
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {enabled ? 'Protection Enabled' : 'Enable Protection'}
                    </Typography>
                  }
                />
              </Box>
            </Paper>
          </Grid>

          {/* Benefits/Requirements */}
          <Grid item xs={12} md={6}>
            {enabled ? (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main', fontWeight: 600 }}>
                  ✅ Data Protection Active
                </Typography>
                <List dense>
                  {PROTECTION_BENEFITS.map((benefit, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {React.cloneElement(benefit.icon, {
                          sx: { color: 'success.main', fontSize: 20 }
                        })}
                      </ListItemIcon>
                      <ListItemText
                        primary={benefit.title}
                        secondary={benefit.description}
                        primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Protection Requirements
                  </Typography>
                  <Typography variant="body2">
                    Agents handling sensitive data must have protection enabled to meet regulatory requirements.
                  </Typography>
                </Alert>
                
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'warning.main', fontWeight: 600 }}>
                  Why Enable Protection?
                </Typography>
                <List dense>
                  {PROTECTION_REQUIREMENTS.slice(0, 3).map((requirement, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <ErrorIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={requirement}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Compliance Indicators */}
        {enabled && (
          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<VerifiedIcon />}
              label="Industry Compliant"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<SecurityIcon />}
              label="Regulatory Guidelines"
              color="info"
              variant="outlined"
            />
            <Chip
              icon={<ShieldIcon />}
              label="Enterprise Grade Security"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        {/* Additional Info */}
        {enabled && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Data Protection includes:</strong> All financial data, government IDs, 
                personal information, and business-specific patterns. Masking strategies are 
                optimized for enterprise workflows with different rules for customer responses, 
                audit logs, and external API calls.
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProtectionToggle;