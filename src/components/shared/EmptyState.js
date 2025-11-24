/**
 * EmptyState Component
 *
 * A reusable component for displaying empty states with consistent styling
 */
import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import { SmartToy as SmartToyIcon } from '@mui/icons-material';
import { EmptyStateText } from '../../utils/typography';

const EmptyState = ({
  icon: Icon = SmartToyIcon,
  title = 'No Selection',
  subtitle = null,
  useCard = false,
  iconSize = 48,
  iconColor = 'text.secondary'
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4,
        height: '100%'
      }}
    >
      <Icon
        sx={{
          fontSize: iconSize,
          color: iconColor,
          mb: 2,
          opacity: 0.5
        }}
      />
      <EmptyStateText sx={{ mb: subtitle ? 1 : 0 }}>
        {title}
      </EmptyStateText>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            maxWidth: 400
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  if (useCard) {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {content}
      </Card>
    );
  }

  return content;
};

export default EmptyState;
