# Complete Code for Remaining Tiledesk Components - Part 2

### 4. TiledeskStatus.js

**File:** `packages/frontend/project-dashboard/src/components/content/tiledesk/TiledeskStatus.js`

```javascript
/**
 * Tiledesk Status Component
 *
 * Displays bot health and status information
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Webhook as WebhookIcon
} from '@mui/icons-material';

import tiledeskService from '../../../services/tiledesk/tiledeskService';
import { CardTitle, HelperText } from '../../../utils/typography';
import EmptyState from '../../shared/EmptyState';
import { ChatBubbleOutline as TiledeskIcon } from '@mui/icons-material';

const TiledeskStatus = ({ agentId, bot, onError, onNotification }) => {
  const [botHealth, setBotHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBotHealth = useCallback(async () => {
    try {
      setLoading(true);
      const health = await tiledeskService.getBotHealth(agentId);
      setBotHealth(health);
    } catch (error) {
      console.error('Error loading bot health:', error);
      if (onError) onError('Failed to load bot health');
    } finally {
      setLoading(false);
    }
  }, [agentId, onError]);

  useEffect(() => {
    if (bot && bot.status === 'active') {
      loadBotHealth();
    }
  }, [bot, loadBotHealth]);

  const handleRefresh = async () => {
    await loadBotHealth();
    if (onNotification) onNotification('Health status refreshed');
  };

  if (!bot) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          icon={TiledeskIcon}
          title="No Bot Connected"
          description="Create or connect a Tiledesk bot to view status information"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <CardTitle>Bot Health & Status</CardTitle>
            <Button
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRefresh}
              size="small"
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {botHealth ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Bot Status
                    </HelperText>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={botHealth.status || 'Unknown'}
                        color={botHealth.status === 'active' ? 'success' : 'default'}
                        icon={<CheckCircleIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Webhook Status
                    </HelperText>
                    <Chip
                      label={botHealth.webhook_status || 'Unknown'}
                      color={botHealth.webhook_status === 'active' ? 'success' : 'warning'}
                      icon={<WebhookIcon />}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Health Score
                    </HelperText>
                    <Typography variant="h4">
                      {botHealth.health_score ? (botHealth.health_score * 100).toFixed(0) : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Last Activity
                    </HelperText>
                    <Typography variant="body1">
                      {botHealth.last_activity
                        ? new Date(botHealth.last_activity).toLocaleString()
                        : 'No activity yet'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <HelperText gutterBottom>
                      Bot Details
                    </HelperText>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <HelperText>
                          Bot ID
                        </HelperText>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {botHealth.bot_id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <HelperText>
                          Project ID
                        </HelperText>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {botHealth.project_id}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              {loading ? 'Loading health information...' : 'Health information unavailable'}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TiledeskStatus;
```

---

### 5. TiledeskDashboard.js

**File:** `packages/frontend/project-dashboard/src/components/content/tiledesk/TiledeskDashboard.js`

```javascript
/**
 * Tiledesk Dashboard Component
 *
 * Main authenticated dashboard with tabs for bot management
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
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

const TiledeskDashboard = ({ agentId, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState(null);
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get auth data
  const authData = TiledeskAuthStorage.getAuth();
  const { projectId, token, email } = authData;

  const loadBot = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tiledeskService.getBot(agentId);
      if (result && result.bot_id) {
        setBot(result);
      }
    } catch (error) {
      console.error('Error loading bot:', error);
    } finally {
      setLoading(false);
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

  const handleNotification = (message) => {
    setNotification(createNotification('success', message));
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
            <Typography variant="h6">Tiledesk Integration</Typography>
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
              <Typography variant="caption" color="text.secondary">
                {email}
              </Typography>
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
          />
        )}
      </Box>

      <NotificationSystem notification={notification} />
    </Box>
  );
};

export default TiledeskDashboard;
```

---

### 6. TiledeskIntegrationContent.js (Refactored Main Component)

**File:** `packages/frontend/project-dashboard/src/components/content/tiledesk/TiledeskIntegrationContent.js`

```javascript
/**
 * Tiledesk Integration Content (Main Container)
 *
 * Routes between authentication and dashboard based on auth state
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import TiledeskAuthStorage from './components/TiledeskAuthStorage';
import TiledeskAuth from './TiledeskAuth';
import TiledeskDashboard from './TiledeskDashboard';
import { PageTitle, PageDescription } from '../../../utils/typography';

const TiledeskIntegrationContent = ({ agentId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = TiledeskAuthStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
    setLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header - Only show if not authenticated */}
      {!isAuthenticated && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Box
              component="img"
              src="/img/integrations/tiledesk-logo.png"
              alt="Tiledesk"
              sx={{ width: 32, height: 32, objectFit: 'contain', mr: 1, borderRadius: '4px' }}
            />
            <PageTitle>Tiledesk Integration</PageTitle>
          </Box>
          <PageDescription>
            Connect your agent as an external bot in Tiledesk for live chat support
          </PageDescription>
        </Box>
      )}

      {/* Content - Auth or Dashboard */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isAuthenticated ? (
          <TiledeskDashboard agentId={agentId} onLogout={handleLogout} />
        ) : (
          <TiledeskAuth onAuthSuccess={handleAuthSuccess} />
        )}
      </Box>
    </Box>
  );
};

export default TiledeskIntegrationContent;
```

---

## What to Do with Old TiledeskIntegrationContent.js

**Location:** `packages/frontend/project-dashboard/src/components/content/TiledeskIntegrationContent.js` (old file)

### Option 1: Backup and Replace (Recommended)
```bash
# Backup old file
mv TiledeskIntegrationContent.js TiledeskIntegrationContent.js.backup

# Move new file from tiledesk/ to content/
mv tiledesk/TiledeskIntegrationContent.js ./TiledeskIntegrationContent.js
```

### Option 2: Keep for Reference
- Rename to `TiledeskIntegrationContent.OLD.js`
- Keep until new implementation is tested
- Delete after verification

---

## Import Statement Changes

### Files that import TiledeskIntegrationContent

**No changes needed!** The import path stays the same:

```javascript
import TiledeskIntegrationContent from './components/content/TiledeskIntegrationContent';
```

The component interface remains identical:
- Takes same prop: `agentId`
- Returns same structure
- Drop-in replacement

---

## File Structure Summary

```
components/content/
├── TiledeskIntegrationContent.js  (NEW - refactored main)
└── tiledesk/                       (NEW directory)
    ├── TiledeskAuth.js
    ├── TiledeskDashboard.js
    ├── TiledeskCreateBot.js
    ├── TiledeskConnectExisting.js
    ├── TiledeskStatus.js
    └── components/
        ├── TiledeskAuthStorage.js
        ├── TiledeskBotList.js
        └── TiledeskManualConfig.js
```

---

## Deployment Steps

1. ✅ Backend changes deployed first
2. ✅ Create all new component files
3. ✅ Test each component independently
4. ✅ Test complete flow (login → create/connect → status)
5. ✅ Backup old file
6. ✅ Deploy new files
7. ✅ Verify in production
8. ✅ Remove backup after 1 week

---

## Testing Checklist

- [ ] Can login with credentials
- [ ] Can login with JWT token
- [ ] Token persists on refresh
- [ ] Can create new bot
- [ ] Bot list loads correctly
- [ ] Can select bot from list
- [ ] Manual config shows correct URL
- [ ] Automated config connects bot
- [ ] Status tab shows health
- [ ] Can logout
- [ ] Logout clears storage
- [ ] Can re-login after logout
