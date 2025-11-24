import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Box,
  useTheme,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const SubscriptionStatusCard = ({
  subscriptionData,
  loading,
  onCancelSubscription,
  onManageSubscription
}) => {

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'cancelled':
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon />;
      case 'cancelled':
      case 'expired':
        return <CancelIcon />;
      case 'pending':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading subscription status...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const subscription = subscriptionData.status?.subscription;
  const hasActiveSubscription = subscription && subscription.status === 'active';
  
  // Debug logging
  console.log('🔍 SubscriptionData in Component:', JSON.stringify(subscriptionData, null, 2));
  console.log('🔍 Subscription Object in Component:', JSON.stringify(subscription, null, 2));
  console.log('🔍 Has Active Subscription:', hasActiveSubscription);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Subscription Status
          </Typography>
          {hasActiveSubscription && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SettingsIcon />}
              onClick={onManageSubscription}
            >
              Manage
            </Button>
          )}
        </Box>

        {!hasActiveSubscription ? (
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>No Active Subscription:</strong> You need a subscription plan to access the platform. 
              Choose a plan below to get started.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Plan
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                    {subscription.tier || subscription.plan_name || 'Unknown Plan'}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(subscription.status)}
                    label={subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1) || 'Unknown'}
                    color={getStatusColor(subscription.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {subscription.description || `${subscription.tier || 'Subscription'} plan with ${subscription.billing_cycle || 'monthly'} billing`}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Billing Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                    {(() => {
                      // Handle the API's misleading field name - monthly_amount_usd contains INR value when currency is INR
                      const amount = subscription.monthly_amount_inr || subscription.amount_inr || 
                                   subscription.monthly_amount_usd || subscription.amount_usd || 0;
                      const currency = subscription.currency || 'INR';
                      const symbol = currency === 'USD' ? '$' : '₹';
                      
                      // Debug logging for amount calculation
                      console.log('🔍 Amount Calculation Debug:');
                      console.log('  monthly_amount_inr:', subscription.monthly_amount_inr);
                      console.log('  amount_inr:', subscription.amount_inr);
                      console.log('  monthly_amount_usd:', subscription.monthly_amount_usd);
                      console.log('  amount_usd:', subscription.amount_usd);
                      console.log('  Final amount used:', amount);
                      console.log('  Currency:', currency);
                      console.log('  Display string:', `${symbol}${amount}/month`);
                      
                      return `${symbol}${amount}/month`;
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    billed {subscription.billing_cycle || 'monthly'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Next billing: {formatDate(subscription.next_billing_date)}
                </Typography>
                
                {subscription.status === 'cancelled' && subscription.end_date && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                    Expires: {formatDate(subscription.end_date)}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        )}

        {hasActiveSubscription && subscription.status === 'active' && (
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onCancelSubscription}
              startIcon={<CancelIcon />}
            >
              Cancel Subscription
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;