/**
 * Tiledesk Bot List Component
 *
 * Displays list of bots from Tiledesk for selection
 */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  SmartToy as BotIcon,
  CheckCircle as CheckIcon,
  Webhook as WebhookIcon
} from '@mui/icons-material';
import { CardTitle, HelperText } from '../../../../utils/typography';

const TiledeskBotList = ({ bots, loading, onSelectBot, selectedBotId, connectedBotId }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <HelperText sx={{ ml: 2 }}>
          Loading bots...
        </HelperText>
      </Box>
    );
  }

  if (!bots || bots.length === 0) {
    return (
      <Alert severity="info">
        No bots found in this Tiledesk project. Create a bot in Tiledesk Dashboard first.
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      {bots.map((bot) => {
        const isConnected = connectedBotId === bot._id;
        const isSelected = selectedBotId === bot._id;

        return (
          <Grid item xs={12} sm={6} md={4} key={bot._id}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : isConnected ? 'success.main' : 'divider',
                bgcolor: isConnected ? 'rgba(76, 175, 80, 0.08)' : 'background.paper',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2
                }
              }}
            >
              <CardActionArea onClick={() => onSelectBot(bot)} sx={{ height: '100%' }}>
                <CardContent sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Top section - Bot info */}
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BotIcon color={isSelected ? 'primary' : isConnected ? 'success' : 'action'} />
                        <CardTitle fontWeight="medium">
                          {bot.name}
                        </CardTitle>
                      </Box>
                      {isConnected && (
                        <CheckIcon color="success" fontSize="small" />
                      )}
                      {isSelected && !isConnected && (
                        <CheckIcon color="primary" fontSize="small" />
                      )}
                    </Box>

                    <HelperText sx={{ display: 'block', mb: 1, fontFamily: 'monospace' }}>
                      ID: {bot._id}
                    </HelperText>

                    {bot.description && (
                      <HelperText
                        sx={{
                          display: '-webkit-box',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 1
                        }}
                      >
                        {bot.description}
                      </HelperText>
                    )}
                  </Box>

                  {/* Bottom section - Chips and Integration info */}
                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      <Chip
                        label={bot.type === 'external' ? 'External Bot' : 'Internal Bot'}
                        size="small"
                        color={bot.type === 'external' ? 'success' : 'primary'}
                        icon={bot.type === 'external' ? <WebhookIcon /> : <BotIcon />}
                      />
                      {bot.language && (
                        <Chip label={bot.language} size="small" variant="outlined" />
                      )}
                    </Box>
                    {/* Integration explanation */}
                    <HelperText sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {bot.type === 'external'
                        ? '📡 All messages → AI Agent'
                        : '🤖 Known intents → Bot, Unknown → AI'}
                    </HelperText>
                  </Box>
                </CardContent>
              </CardActionArea>
          </Card>
        </Grid>
        );
      })}
    </Grid>
  );
};

export default TiledeskBotList;
