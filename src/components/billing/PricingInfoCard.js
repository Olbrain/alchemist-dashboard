import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  useTheme
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const PricingInfoCard = () => {
  const theme = useTheme();

  const subscriptionFeatures = [
    "Tier 1: $100/month - 5 agents, 250 MB storage",
    "Tier 2: $300/month - 15 agents, 1 GB storage", 
    "Tier 3: $500/month - 30 agents, 2 GB storage",
    "LLM credits charged separately for actual AI usage",
    "Different models cost different amounts per token",
    "Only pay for the AI you actually use"
  ];

  const modelPricing = [
    { model: "GPT-4o-mini", cost: "~0.0004 credits per 1K tokens" },
    { model: "GPT-3.5-turbo", cost: "~0.001 credits per 1K tokens" },
    { model: "GPT-4o", cost: "~0.01 credits per 1K tokens" },
    { model: "Claude 3.5 Sonnet", cost: "~0.009 credits per 1K tokens" }
  ];

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <InfoIcon sx={{ color: theme.palette.primary.main, mr: 2 }} />
          <Typography variant="h6" fontWeight="bold">
            How Credit Pricing Works
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Our platform uses a <strong>hybrid pricing model</strong>: monthly subscriptions for platform access + pay-as-you-go credits for AI usage.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Subscription + Credits Model:
            </Typography>
            <List dense>
              {subscriptionFeatures.map((item, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              LLM Credit Costs (1 USD = 1000 credits):
            </Typography>
            <List dense>
              {modelPricing.map((item, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.cost}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Two-Part Pricing:</strong> Choose a monthly subscription tier for platform access and agent limits, 
            then add LLM credits as needed for actual AI model usage. This ensures predictable platform costs with 
            flexible AI usage billing.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PricingInfoCard;