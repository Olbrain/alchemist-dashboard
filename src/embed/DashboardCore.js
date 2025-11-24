/**
 * DashboardCore - Embeddable Dashboard Component
 *
 * This is the main entry point for embedding the dashboard in external applications.
 * It provides a self-contained dashboard that can be integrated with custom navigation,
 * authentication, and theming from the host application.
 */

import React, { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme';

// Import contexts and providers
import { SelectedAgentProvider } from '../contexts/SelectedAgentContext';
import { DataCacheProvider } from '../contexts/DataCacheContext';

// Import components
import ErrorBoundary from '../components/shared/ErrorBoundary';

// Import pages (embed mode - simplified)
import AgentEditor from '../pages/AgentEditor';
import MainContainer from '../pages/MainContainer';

/**
 * DashboardCore Props
 * @typedef {Object} DashboardCoreProps
 * @property {string} apiUrl - Base URL for backend API
 * @property {Object} authToken - Authentication token or user object
 * @property {Function} [onNavigate] - Callback when internal navigation occurs
 * @property {'light'|'dark'} [theme] - Theme mode
 * @property {Object} [config] - Additional configuration
 * @property {'docker'|'cloud'} [config.deploymentType] - Deployment type
 * @property {string} [initialPath] - Initial route path
 * @property {string} [width] - Dashboard width (default: '100%')
 * @property {string} [height] - Dashboard height (default: '100%')
 */

/**
 * Root component for embedded mode - shows MainContainer directly
 */
const RootComponent = () => {
  // Show MainContainer directly - it will handle its own loading states
  // Hide sidebar for embedded mode (host app has their own sidebar)
  return <MainContainer hideSidebar={true} />;
};

/**
 * Navigation event emitter for host app integration
 */
const NavigationEmitter = ({ onNavigate }) => {
  const location = useLocation();

  useEffect(() => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      });
    }
  }, [location, onNavigate]);

  return null;
};

/**
 * DashboardCore Component
 *
 * Example usage:
 * ```jsx
 * <DashboardCore
 *   apiUrl="https://api.sinch.io"
 *   authToken={{ uid: 'user123', email: 'user@example.com' }}
 *   onNavigate={(location) => console.log('Navigate to:', location)}
 *   theme="light"
 *   width="1200px"
 *   height="800px"
 *   config={{
 *     deploymentType: 'docker'
 *   }}
 * />
 * ```
 */
const DashboardCore = ({
  apiUrl,
  authToken,
  onNavigate,
  theme: themeMode = 'light',
  config = {},
  initialPath = '/',
  width = '100%',
  height = '100%',
}) => {
  const [loading, setLoading] = React.useState(true);
  const theme = createAppTheme(themeMode);

  // Initialize dashboard with external configuration
  useEffect(() => {
    // Set environment variables from props
    if (apiUrl) {
      window.REACT_APP_API_URL = apiUrl;
    }

    if (config.deploymentType) {
      window.REACT_APP_DEPLOYMENT_TYPE = config.deploymentType;
    }

    // Set all API URLs if provided
    if (config.apiUrls) {
      const { apiUrls } = config;
      if (apiUrls.agentEngine) window.REACT_APP_AGENT_ENGINE_URL = apiUrls.agentEngine;
      if (apiUrls.knowledgeVault) window.REACT_APP_KNOWLEDGE_VAULT_URL = apiUrls.knowledgeVault;
      if (apiUrls.billingService) window.REACT_APP_BILLING_SERVICE_URL = apiUrls.billingService;
      if (apiUrls.agentLauncher) window.REACT_APP_AGENT_LAUNCHER_URL = apiUrls.agentLauncher;
      if (apiUrls.analyticsService) window.REACT_APP_ANALYTICS_SERVICE_URL = apiUrls.analyticsService;
      if (apiUrls.agentBridge) window.REACT_APP_AGENT_BRIDGE_URL = apiUrls.agentBridge;
      if (apiUrls.agentBuilderAi) window.REACT_APP_AGENT_BUILDER_AI_SERVICE_URL = apiUrls.agentBuilderAi;
      if (apiUrls.agentDashboard) window.REACT_APP_AGENT_DASHBOARD_URL = apiUrls.agentDashboard;
    }

    // Mark dashboard as initialized
    setLoading(false);
  }, [apiUrl, config]);

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode);
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [themeMode]);

  return (
    <ErrorBoundary name="Embedded Dashboard">
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <Box
          sx={{
            width: width,
            height: height,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SelectedAgentProvider>
            <DataCacheProvider>
              <MemoryRouter initialEntries={[initialPath]}>
                {/* Emit navigation events to host app */}
                <NavigationEmitter onNavigate={onNavigate} />

                <Routes>
                  {/* Root route - shows MainContainer directly for authenticated users */}
                  <Route path="/" element={<RootComponent />} />

                  {/* Agent Editor */}
                  <Route path="/edit/:agentId" element={<AgentEditor />} />

                  {/* Fallback - show MainContainer for any other route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MemoryRouter>
            </DataCacheProvider>
          </SelectedAgentProvider>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default DashboardCore;
