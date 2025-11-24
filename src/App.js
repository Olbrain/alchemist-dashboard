import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRoutes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './utils/AuthContext';
import { debugAuthState } from './utils/AuthDebug';
import { SelectedAgentProvider } from './contexts/SelectedAgentContext';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { createAppTheme } from './theme';

// Import components
import Layout from './components/Layout';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Import pages
import AgentEditor from './pages/AgentEditor';
import MainContainer from './pages/MainContainer';

// Theme Context
const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

// Root component - for whitelabel embed
// Note: This App.js is not used in embed mode (DashboardCore is the entry point)
// Kept for potential standalone builds
const RootComponent = () => {
  // For embed mode, just show MainContainer
  // Host application (Sinch) handles authentication
  return <MainContainer hideSidebar={true} />;
};

// Protected route component - simplified for embed mode
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // For embed mode, host handles auth
  // Just render children if we have a user
  return currentUser ? children : <div>Authentication required</div>;
};

function App() {
  const { loading: authLoading, currentUser } = useAuth();
  const [themeMode, setThemeMode] = useState(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('themeMode');
    return savedTheme || 'light';
  });
  const location = useLocation();
  
  const theme = createAppTheme(themeMode);
  
  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
    document.body.setAttribute('data-theme', newMode);
  };
  
  // Set initial theme attribute on body
  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode);
  }, [themeMode]);
  
  const themeContextValue = {
    mode: themeMode,
    toggleTheme,
  };
  
  // Run auth debugging on mount and when auth state changes
  useEffect(() => {
    const runDebug = async () => {
      await debugAuthState();
    };
    
    runDebug();
  }, [currentUser]);
  
  // Log navigation
  useEffect(() => {
    console.log(`Navigation to: ${location.pathname}`);
  }, [location.pathname]);
  
  useEffect(() => {
    if (!authLoading) {
      console.log(`Auth loading complete. User authenticated: ${!!currentUser}`);
    }
  }, [authLoading, currentUser]);

  // Define routes - simplified for embed mode
  // Note: In embed mode, DashboardCore is used instead of this router
  const routes = useRoutes([
    // Root route
    {
      path: '/',
      element: <RootComponent />
    },
    // Agent Editor route
    {
      path: '/edit/:agentId',
      element: <ProtectedRoute><AgentEditor /></ProtectedRoute>
    },
    // Catch-all for any other routes
    {
      path: '*',
      element: <RootComponent />
    }
  ]);

  return (
    <ErrorBoundary name="Main App">
      <ThemeContext.Provider value={themeContextValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <DataCacheProvider>
            <SelectedAgentProvider>
              <Layout>
                {routes}
              </Layout>
            </SelectedAgentProvider>
          </DataCacheProvider>
        </ThemeProvider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
