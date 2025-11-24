# Alchemist Dashboard

**Embeddable AI Agent Dashboard for Platform Integration**

## Overview

`@olbrain/alchemist-dashboard` is a React-based embeddable dashboard that allows platforms like Sinch to integrate a full-featured AI agent management interface within their own application - with their own header, sidebar, and navigation.

This package uses **Webpack Module Federation** for seamless micro-frontend integration.

## Key Features

- 🎯 **No URL Redirection** - Renders within your app's layout
- 🔐 **External Authentication** - Use your own auth system (Firebase optional)
- 🎨 **Themeable** - Light/dark modes + custom themes
- 📦 **Module Federation** - Micro-frontend architecture support
- ⚛️ **React Components** - Easy integration in React apps
- 🌐 **CDN Support** - Works with any framework via script tag
- 🚀 **Production Ready** - Optimized builds, code splitting

## Installation

```bash
npm install @olbrain/alchemist-dashboard
```

## Quick Start

### Module Federation Integration (Recommended)

```html
<!-- Load React from CDN or your bundle -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Set required configuration -->
<script>
  window.REACT_APP_ORGANIZATION_ID = 'your-org-id';
  window.REACT_APP_ORGANIZATION_API_KEY = 'your-api-key';
</script>

<!-- Load dashboard via Module Federation -->
<script src="node_modules/@olbrain/alchemist-dashboard/build/remoteEntry.js"></script>

<div id="dashboard-root"></div>

<script>
  async function loadDashboard() {
    // Initialize Module Federation
    await window.projectDashboard.init({
      react: { '18.2.0': { get: () => Promise.resolve(() => window.React), loaded: 1 }},
      'react-dom': { '18.2.0': { get: () => Promise.resolve(() => window.ReactDOM), loaded: 1 }}
    });

    // Load dashboard components
    const DashboardProviderModule = await window.projectDashboard.get('./DashboardProvider');
    const DashboardProvider = DashboardProviderModule().DashboardProvider;

    const DashboardCoreModule = await window.projectDashboard.get('./DashboardCore');
    const DashboardCore = DashboardCoreModule().default;

    // Render dashboard
    const dashboard = React.createElement(
      DashboardProvider,
      {
        user: {
          uid: 'user-123',
          email: 'user@example.com',
          displayName: 'User Name',
          organizationId: 'your-org-id'
        },
        onAuthError: (error) => console.error('Auth error:', error)
      },
      React.createElement(DashboardCore, {
        width: '100%',   // Optional: Set dashboard width
        height: '100%'   // Optional: Set dashboard height
      })
    );

    const container = document.getElementById('dashboard-root');
    const root = ReactDOM.createRoot(container);
    root.render(dashboard);
  }

  loadDashboard();
</script>
```

### React Integration (Alternative)

```jsx
// Set required configuration BEFORE importing/rendering dashboard
window.REACT_APP_ORGANIZATION_ID = 'your-org-id';
window.REACT_APP_ORGANIZATION_API_KEY = 'your-api-key';

import { DashboardCore, DashboardProvider } from '@olbrain/alchemist-dashboard';

function App() {
  const user = {
    uid: 'user-123',
    email: 'user@example.com',
    displayName: 'User Name',
    organizationId: 'your-org-id'  // Must match REACT_APP_ORGANIZATION_ID
  };

  return (
    <div className="your-layout">
      <header>Your Header</header>
      <aside>Your Sidebar</aside>
      <main>
        <DashboardProvider user={user} onAuthError={(err) => console.error(err)}>
          <DashboardCore
            width="100%"
            height="100%"
          />
        </DashboardProvider>
      </main>
    </div>
  );
}
```

### CDN / Script Tag

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Set configuration BEFORE loading dashboard -->
<script>
  window.REACT_APP_ORGANIZATION_ID = 'your-org-id';
  window.REACT_APP_ORGANIZATION_API_KEY = 'your-api-key';
</script>

<script src="./node_modules/@olbrain/alchemist-dashboard/build/remoteEntry.js"></script>

<div id="dashboard-root"></div>

<script>
  async function loadDashboard() {
    await window.projectDashboard.init({
      react: { '18.2.0': { get: () => Promise.resolve(() => window.React), loaded: 1 }},
      'react-dom': { '18.2.0': { get: () => Promise.resolve(() => window.ReactDOM), loaded: 1 }}
    });

    const DashboardProviderModule = await window.projectDashboard.get('./DashboardProvider');
    const DashboardProvider = DashboardProviderModule().DashboardProvider;

    const DashboardCoreModule = await window.projectDashboard.get('./DashboardCore');
    const DashboardCore = DashboardCoreModule().default;

    const user = {
      uid: 'user-123',
      email: 'user@example.com',
      displayName: 'User Name',
      organizationId: 'your-org-id'
    };

    const dashboard = React.createElement(
      DashboardProvider,
      { user: user, onAuthError: (error) => console.error(error) },
      React.createElement(DashboardCore, {
        width: '100%',
        height: '100%'
      })
    );

    ReactDOM.createRoot(document.getElementById('dashboard-root')).render(dashboard);
  }

  loadDashboard();
</script>
```

## Customizing Dashboard Size

The dashboard provides flexible sizing options through `width` and `height` props to fit various integration scenarios.

### Common Use Cases

#### 1. Full-Page Dashboard (Default)
Fill the entire parent container:
```jsx
<DashboardCore width="100%" height="100%" />
```

#### 2. Sidebar Layout
Dashboard alongside your platform's sidebar:
```jsx
<div style={{ display: 'flex', height: '100vh' }}>
  <YourSidebar style={{ width: '240px' }} />
  <DashboardCore width="100%" height="100%" />
</div>
```

#### 3. Fixed Size Container
Dashboard with specific dimensions:
```jsx
<DashboardCore width="1200px" height="800px" />
```

#### 4. Responsive with Viewport Units
Dashboard that scales with viewport:
```jsx
<DashboardCore width="90vw" height="85vh" />
```

#### 5. Modal or Dialog
Dashboard embedded in a modal:
```jsx
<Modal>
  <DashboardCore width="800px" height="600px" />
</Modal>
```

### Responsive Design Tips

- **Use percentage values** (`100%`) when dashboard should fill its container
- **Use viewport units** (`vw`, `vh`) for viewport-relative sizing
- **Use pixel values** (`px`) for fixed dimensions in modals/dialogs
- **Combine with CSS** for complex responsive layouts

## Documentation

- **[EMBEDDING_GUIDE.md](./EMBEDDING_GUIDE.md)** - Complete integration guide
- **[examples/](./examples/)** - Working examples for React, Webpack, Vanilla JS
- **[DATA_ACCESS_ARCHITECTURE.md](./DATA_ACCESS_ARCHITECTURE.md)** - Architecture details

## Examples

### 1. React Host App

See [`examples/react-host/App.jsx`](./examples/react-host/App.jsx)

### 2. Webpack Module Federation

See [`examples/webpack-host/`](./examples/webpack-host/)

### 3. Vanilla JavaScript

See [`examples/vanilla-js/index.html`](./examples/vanilla-js/index.html)

## Build Commands

```bash
# Development server
npm start

# Build for standalone testing
npm run build:standalone

# Build for embedding (Module Federation)
npm run build:embed

# Run tests
npm test
```

## Integration Methods

| Method | Best For | Complexity |
|--------|----------|------------|
| **NPM Package** | React apps | Low |
| **Module Federation** | Micro-frontends | Medium |
| **CDN Script** | Non-React apps | Medium |

## API Reference

### Required Configuration

Before using the dashboard, set these global configuration variables:

```javascript
window.REACT_APP_ORGANIZATION_ID = 'your-organization-id';
window.REACT_APP_ORGANIZATION_API_KEY = 'your-api-key';
```

These must be set **before** loading or rendering the dashboard components.

### DashboardCore

```typescript
interface DashboardCoreProps {
  width?: string;   // Optional: Dashboard width (default: '100%')
  height?: string;  // Optional: Dashboard height (default: '100%')
}
```

#### Dimension Configuration

Control dashboard size using the `width` and `height` props to match your layout requirements.

**Supported CSS values:**
- **Percentage:** `'100%'`, `'80%'` - Relative to parent container
- **Pixels:** `'1200px'`, `'800px'` - Fixed dimensions
- **Viewport units:** `'80vw'`, `'80vh'` - Relative to viewport
- **Auto:** `'auto'` - Fits content (rare use case)
- **Default:** `'100%'` for both width and height

**Examples:**

```jsx
// Fill container (default behavior)
<DashboardCore width="100%" height="100%" />

// Fixed dimensions (modals, dialogs)
<DashboardCore width="1200px" height="800px" />

// Viewport-relative (responsive full-screen)
<DashboardCore width="100vw" height="100vh" />

// Mixed units (common for responsive layouts)
<DashboardCore width="100%" height="calc(100vh - 64px)" />
```

**Platform Integration Example:**

```jsx
// Sinch/Twilio-style platform layout
<PlatformLayout>
  <Header height="64px" />
  <Sidebar width="240px" />
  <MainContent>
    <DashboardCore
      width="100%"                    // Fill remaining width
      height="calc(100vh - 64px)"     // Full height minus header
    />
  </MainContent>
</PlatformLayout>
```

### DashboardProvider

```typescript
interface DashboardProviderProps {
  user: {
    uid: string;                // Required: Unique user identifier
    email: string;              // Required: User email address
    displayName?: string;       // Optional: User display name
    organizationId: string;     // Required: Organization ID (must match REACT_APP_ORGANIZATION_ID)
  };
  onAuthError?: (error: Error) => void;  // Optional: Auth error callback
  children: React.ReactNode;    // Required: Dashboard components
}
```

## Directory Structure

```
project-dashboard-embed/
├── src/
│   ├── embed/              # Embed entry points
│   │   ├── index.js        # Main export
│   │   ├── DashboardCore.js
│   │   └── DashboardProvider.js
│   ├── components/         # Dashboard components
│   ├── services/           # API services
│   └── utils/              # Utilities
├── examples/               # Integration examples
│   ├── react-host/
│   ├── webpack-host/
│   └── vanilla-js/
├── craco.config.js         # Webpack/Module Federation config
├── package.json
├── EMBEDDING_GUIDE.md      # Detailed integration guide
└── README.md               # This file
```

## Deployment

### CDN Deployment

```bash
# Build for embedding
npm run build:embed

# Upload to CDN
aws s3 sync build/embed/ s3://your-cdn-bucket/dashboard/

# Configure CORS
# Allow origins: https://yourplatform.com
```

### NPM Deployment

```bash
npm publish
```

## Use Cases

### Platform Integration (Sinch, Twilio, etc.)

Embed dashboard within your platform's UI:

```jsx
// Set configuration before rendering
window.REACT_APP_ORGANIZATION_ID = 'your-org-id';
window.REACT_APP_ORGANIZATION_API_KEY = 'your-api-key';

<SinchPlatform>
  <SinchHeader />
  <SinchSidebar />
  <DashboardProvider user={user}>
    <DashboardCore width="100%" height="100%" />
  </DashboardProvider>
</SinchPlatform>
```

### Micro-Frontends

Load dashboard as remote module:

```javascript
// webpack.config.js
new ModuleFederationPlugin({
  remotes: {
    dashboard: 'projectDashboard@https://cdn.example.com/remoteEntry.js'
  }
})
```

## Requirements

- React 18+
- Material-UI 5+
- Node.js 18+

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see LICENSE file for details

## Support

- Documentation: See EMBEDDING_GUIDE.md
- Examples: See examples/ directory
- Issues: GitHub Issues
- Email: support@yourcompany.com

## Version

Current: `0.1.0`

---

**Built with ❤️ for seamless platform integration**
