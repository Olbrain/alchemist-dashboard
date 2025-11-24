# Tiledesk Integration Refactoring - Implementation Guide

## Status: IN PROGRESS ✅

### Completed Files:
1. ✅ `components/TiledeskAuthStorage.js` - Token storage utility
2. ✅ `TiledeskAuth.js` - Authentication component

### Remaining Files to Create:

---

## Backend Implementation

### 1. Add listBots endpoint in app.py

**Location:** `packages/integrations/agent-bridge/app.py`

Add after the existing Tiledesk endpoints (around line 2463):

```python
@app.get("/api/tiledesk/projects/{project_id}/bots")
async def list_tiledesk_bots(
    project_id: str,
    api_token: str = Body(...)
):
    """List all bots in a Tiledesk project"""
    try:
        logger.info(f"Listing bots for Tiledesk project: {project_id}")

        # Create Tiledesk provider with user credentials
        from services.tiledesk_provider import TiledeskProvider
        tiledesk_config = {
            'tiledesk_project_id': project_id,
            'tiledesk_api_key': api_token
        }
        provider = TiledeskProvider(tiledesk_config)

        # List bots
        bots = await provider.list_bots()

        # Cleanup
        await provider.cleanup()

        return {
            "success": True,
            "bots": bots,
            "project_id": project_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list Tiledesk bots: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list bots: {str(e)}")
```

### 2. Add list_bots method to TiledeskProvider

**Location:** `packages/integrations/agent-bridge/services/tiledesk_provider.py`

Add after the `validate_bot_access` method (around line 483):

```python
async def list_bots(self) -> List[Dict[str, Any]]:
    """List all bots in the Tiledesk project"""
    try:
        bots_url = f"{self.api_base_url}/{self.tiledesk_project_id}/faq_kb"

        response = await self._client.get(
            bots_url,
            headers=self.headers
        )

        if response.status_code == 200:
            bots_data = response.json()
            logger.info(f"Successfully fetched {len(bots_data)} bots")
            return bots_data
        else:
            logger.error(f"Failed to list bots: {response.status_code} - {response.text}")
            return []

    except Exception as e:
        logger.error(f"Error listing bots: {str(e)}")
        return []
```

---

## Frontend Service Implementation

### 3. Add listBots method to tiledeskService.js

**Location:** `packages/frontend/project-dashboard/src/services/tiledesk/tiledeskService.js`

Add after the `connectExistingBot` method (around line 317):

```javascript
/**
 * List all bots in a Tiledesk project
 */
async listBots(projectId, apiToken) {
  try {
    const response = await fetch(`${this.baseURL}/api/tiledesk/projects/${projectId}/bots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({ api_token: apiToken })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to list bots: ${response.status}`);
    }

    const result = await response.json();
    return result.bots || [];
  } catch (error) {
    console.error('Error listing Tiledesk bots:', error);
    throw error;
  }
}
```

---

## Frontend Components

### 4. TiledeskBotList.js

**Location:** `packages/frontend/project-dashboard/src/components/content/tiledesk/components/TiledeskBotList.js`

```javascript
/**
 * Tiledesk Bot List Component
 *
 * Displays list of bots from Tiledesk for selection
 */
import React from 'react';
import {
  Box,
  Typography,
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
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const TiledeskBotList = ({ bots, loading, onSelectBot, selectedBotId }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading bots...
        </Typography>
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
      {bots.map((bot) => (
        <Grid item xs={12} sm={6} md={4} key={bot._id}>
          <Card
            variant="outlined"
            sx={{
              border: selectedBotId === bot._id ? 2 : 1,
              borderColor: selectedBotId === bot._id ? 'primary.main' : 'divider'
            }}
          >
            <CardActionArea onClick={() => onSelectBot(bot)}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BotIcon color={selectedBotId === bot._id ? 'primary' : 'action'} />
                    <Typography variant="subtitle2" fontWeight="medium">
                      {bot.name}
                    </Typography>
                  </Box>
                  {selectedBotId === bot._id && (
                    <CheckIcon color="primary" fontSize="small" />
                  )}
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1, fontFamily: 'monospace' }}
                >
                  ID: {bot._id}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={bot.type || 'internal'}
                    size="small"
                    color={bot.type === 'external' ? 'success' : 'default'}
                  />
                  {bot.language && (
                    <Chip label={bot.language} size="small" variant="outlined" />
                  )}
                </Box>

                {bot.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {bot.description}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TiledeskBotList;
```

### 5. TiledeskManualConfig.js

**Extract from existing TiledeskIntegrationContent.js** - Lines 709-869 (the manual configuration accordion)

### 6. TiledeskCreateBot.js

**Extract from existing TiledeskIntegrationContent.js** - Lines 379-562 (the create bot form)

### 7. TiledeskConnectExisting.js

**Refactor from existing** - Add bot list integration + manual/automated options

### 8. TiledeskStatus.js

**Extract from existing TiledeskIntegrationContent.js** - Lines 767-906 (the status tab)

### 9. TiledeskDashboard.js

New component that contains tabs and routes to Create/Connect/Status components

### 10. TiledeskIntegrationContent.js (Main)

Refactor to become routing component:
- Check auth status
- Show TiledeskAuth OR TiledeskDashboard
- Manage auth state

---

## File Size Estimate

| File | Estimated Lines | Status |
|------|----------------|--------|
| TiledeskAuthStorage.js | 120 | ✅ Complete |
| TiledeskAuth.js | 300 | ✅ Complete |
| TiledeskBotList.js | 100 | 📝 Provided above |
| TiledeskManualConfig.js | 180 | 🔄 Extract from existing |
| TiledeskCreateBot.js | 200 | 🔄 Extract from existing |
| TiledeskConnectExisting.js | 250 | 🔄 Refactor with bot list |
| TiledeskStatus.js | 150 | 🔄 Extract from existing |
| TiledeskDashboard.js | 150 | 📝 New component |
| TiledeskIntegrationContent.js | 120 | 🔄 Simplified routing |
| Backend endpoints | 50 | 📝 Provided above |

**Total: ~1,620 lines** (vs current 1,100 lines in single file)

---

## Next Steps

1. ✅ **DONE**: Create directory structure
2. ✅ **DONE**: Create TiledeskAuthStorage.js
3. ✅ **DONE**: Create TiledeskAuth.js
4. **TODO**: Add backend listBots endpoint and provider method
5. **TODO**: Add listBots to tiledeskService.js
6. **TODO**: Create TiledeskBotList.js (code provided above)
7. **TODO**: Extract and create remaining components
8. **TODO**: Create TiledeskDashboard.js
9. **TODO**: Refactor main TiledeskIntegrationContent.js
10. **TODO**: Test complete flow

---

## Testing Checklist

- [ ] Login with credentials works
- [ ] Login with JWT token works
- [ ] Logout clears storage
- [ ] Create new bot works
- [ ] Bot list loads and displays
- [ ] Manual config shows correct webhook URL
- [ ] Automated config connects bot
- [ ] Status tab shows health
- [ ] Navigation between tabs works
- [ ] Auth persists on page refresh
- [ ] Token expiry handled gracefully

---

## Migration Notes

- Original file backed up before refactoring
- Import paths need updating in parent components
- Test each component independently before integration
- Deploy backend changes before frontend deployment

