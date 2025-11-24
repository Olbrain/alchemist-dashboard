/**
 * Tiledesk Dashboard Component
 *
 * Main authenticated dashboard with tabs for bot management
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert
} from '@mui/material';
import {
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import TiledeskAuthStorage from './components/TiledeskAuthStorage';
import TiledeskCreateBot from './TiledeskCreateBot';
import TiledeskConnectExisting from './TiledeskConnectExisting';
import TiledeskStatus from './TiledeskStatus';
import tiledeskService from '../../../services/tiledesk/tiledeskService';
import NotificationSystem, { createNotification } from '../../shared/NotificationSystem';
import { PageTitle, HelperText } from '../../../utils/typography';

const TiledeskDashboard = ({ agentId, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState(null);
  const [bot, setBot] = useState(null);

  // Get auth data
  const authData = TiledeskAuthStorage.getAuth();
  const { projectId, token, email } = authData;

  const loadBot = useCallback(async () => {
    try {
      const result = await tiledeskService.getBot(agentId);
      if (result && result.bot_id) {
        setBot(result);
      }
    } catch (error) {
      console.error('Error loading bot:', error);
    }
  }, [agentId]);

  useEffect(() => {
    loadBot();
  }, [loadBot]);

  const handleLogout = () => {
    TiledeskAuthStorage.clearAuth();
    if (onLogout) onLogout();
  };

  const handleSuccess = (message) => {
    setNotification(createNotification('success', message || 'Operation successful'));
    // Reload bot data
    loadBot();
  };

  const handleError = (message) => {
    setNotification(createNotification('error', message || 'Operation failed'));
  };

  const handleNotification = (message, severity = 'success') => {
    setNotification(createNotification(severity, message));
  };

  const handleBotDisconnected = () => {
    // Clear bot state and reload
    setBot(null);
    loadBot();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={2}>
            <PageTitle>Tiledesk Integration</PageTitle>
            {bot && bot.status === 'active' && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Bot Connected"
                color="success"
                size="small"
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {email && (
              <HelperText>
                {email}
              </HelperText>
            )}
            <Button
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {bot && bot.status === 'active' && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Your Tiledesk bot <strong>{bot.bot_name}</strong> is successfully configured and ready to receive messages.
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Create New Bot" />
          <Tab label="Connect Existing Bot" />
          <Tab label="Status" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <TiledeskCreateBot
            agentId={agentId}
            projectId={projectId}
            apiToken={token}
            onSuccess={(result) => handleSuccess('Bot created successfully!')}
            onError={handleError}
          />
        )}
        {activeTab === 1 && (
          <TiledeskConnectExisting
            agentId={agentId}
            projectId={projectId}
            apiToken={token}
            onSuccess={(result) => handleSuccess('Existing bot connected successfully!')}
            onError={handleError}
            onNotification={handleNotification}
          />
        )}
        {activeTab === 2 && (
          <TiledeskStatus
            agentId={agentId}
            bot={bot}
            onError={handleError}
            onNotification={handleNotification}
            onBotDisconnected={handleBotDisconnected}
          />
        )}
      </Box>

      <NotificationSystem notification={notification} />
    </Box>
  );
};

export default TiledeskDashboard;
