# Whitelabel Configuration

This document describes the configuration bundled into the whitelabel embed build.

## Backend API URLs (Bundled in Build)

All backend service URLs are **hardcoded** into the build. No configuration needed from integrators.

### Production API Endpoints

These URLs are bundled into `src/services/config/apiConfig.js`:

```javascript
AGENT_ENGINE_URL: 'https://alchemist-agent-engine-851487020021.us-central1.run.app'
KNOWLEDGE_VAULT_URL: 'https://alchemist-knowledge-vault-851487020021.us-central1.run.app'
BILLING_SERVICE_URL: 'https://alchemist-billing-service-851487020021.us-central1.run.app'
AGENT_LAUNCHER_URL: 'https://us-central1-alchemist-e69bb.cloudfunctions.net/alchemist-agent-launcher'
ANALYTICS_SERVICE_URL: 'https://alchemist-analytics-851487020021.us-central1.run.app'
AGENT_BRIDGE_URL: 'https://alchemist-agent-bridge-851487020021.us-central1.run.app'
AGENT_BUILDER_AI_SERVICE_URL: 'https://alchemist-agent-builder-ai-851487020021.us-central1.run.app'
AGENT_DASHBOARD_URL: 'https://alchemist-agent-dashboard-851487020021.us-central1.run.app'
TOOL_MANAGER_URL: 'https://alchemist-tool-manager-851487020021.us-central1.run.app'
```

## Authentication Configuration (Provided by Alchemist)

### Required Credentials

Alchemist will provide these credentials to Sinch for integration:

1. **Organization ID**: Unique identifier for Sinch organization
   - Example: `sinch-prod-org-12345`
   - Used for: Identifying the Sinch tenant in multi-tenant architecture

2. **Organization API Key**: Authentication token for API requests
   - Example: `alch_live_abc123xyz456def789...`
   - Used for: Authenticating all backend API requests
   - Security:
     - API key has organization-level permissions
     - Backend validates on every request
     - Scoped to Sinch organization only

### How Sinch Uses These Credentials

Sinch needs to set these as **window variables** before loading the dashboard:

```html
<script>
  // Set before loading dashboard bundle
  window.REACT_APP_ORGANIZATION_ID = 'sinch-prod-org-12345';
  window.REACT_APP_ORGANIZATION_API_KEY = 'alch_live_abc123xyz456def789...';
</script>

<!-- Then load dashboard -->
<script src="https://cdn.alchemist.ai/dashboard/remoteEntry.js"></script>
```

## Integration Flow

### 1. Alchemist Setup (One-time)
- Create Sinch organization in Alchemist backend
- Generate organization API key with appropriate permissions
- Provide credentials to Sinch team

### 2. Sinch Integration (One-time)
- Receive organization_id and api_key from Alchemist
- Set window variables in their platform code
- Load dashboard bundle from Alchemist CDN

### 3. Runtime (Every user session)
- Dashboard reads credentials from window variables
- All API requests include: `Authorization: ApiKey ${api_key}`
- Backend validates API key and organization_id
- User actions are scoped to Sinch organization

## Security Notes

### API Key Security
- API key should be treated as sensitive credential
- Should be stored securely in Sinch's backend config
- Should be injected at runtime (not committed to git)
- Backend validates key on every request

### Organization Isolation
- All data is scoped to organization_id
- API key can only access Sinch's data
- Multi-tenant architecture ensures data isolation
- Backend enforces organization boundaries

### CORS Configuration
- Alchemist backend CORS is configured to accept requests from Sinch domain
- Example: `https://platform.sinch.com`

## Environment Files

This package includes simplified environment files:

### `.env.development`
Empty template - Alchemist team uses this during local development

### `.env.production`
Empty template - Not used in production build (values hardcoded)

## No Firebase Required

Firebase configuration is **not needed** for whitelabel integration:
- ❌ No Firebase Auth
- ❌ No Firebase Firestore direct access
- ❌ No Firebase Storage direct access
- ✅ All data operations via Alchemist backend APIs
- ✅ Backend handles authentication via API key

## Build Configuration

### Build Command
```bash
npm run build
```

### Output
- Build artifacts in `build/` directory
- Main bundle: `build/static/js/main.[hash].js`
- Module Federation entry: `build/remoteEntry.js`
- Can be deployed to CDN or served directly

### Build Mode
- Always builds in **embed mode** (default)
- Module Federation enabled
- Optimized for integration into host applications
- No standalone mode available

## Deployment

### Option 1: Alchemist-Hosted (Recommended)
- Alchemist hosts build on CDN
- Sinch loads from: `https://cdn.alchemist.ai/dashboard/remoteEntry.js`
- Alchemist controls updates and versioning

### Option 2: Sinch-Hosted
- Alchemist provides build artifacts to Sinch
- Sinch hosts on their infrastructure
- Sinch controls deployment and updates
- Requires coordination for version updates

## Summary

**What Alchemist Provides:**
- ✅ Pre-built dashboard bundle
- ✅ Organization ID for Sinch
- ✅ Organization API Key for authentication
- ✅ Backend API access
- ✅ Technical support

**What Sinch Needs to Do:**
- ✅ Set 2 window variables (organization_id, api_key)
- ✅ Load dashboard bundle
- ✅ Integrate into their platform UI

**What's Bundled in Build:**
- ✅ All backend API URLs
- ✅ All UI components
- ✅ Authentication logic
- ✅ Complete functionality

**Configuration Complexity:**
- Just 2 variables to set
- No environment files to manage
- No Firebase setup required
- Plug-and-play integration
