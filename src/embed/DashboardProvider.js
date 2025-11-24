/**
 * DashboardProvider - External Authentication Wrapper
 *
 * Provides authentication context for embedded dashboard when using
 * external authentication from the host application (e.g., Sinch's auth system).
 *
 * This allows the dashboard to work without Firebase Auth, using tokens
 * provided by the host application instead.
 *
 * IMPORTANT: This provides the same AuthContext that the rest of the app uses,
 * ensuring compatibility with all existing components that call useAuth().
 */

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { AuthContext } from '../utils/AuthContext';
import { agentBuilderApi } from '../services/config/apiConfig';
import ErrorDisplay from '../components/shared/ErrorDisplay';

/**
 * Hook to access external auth state (alias for useAuth for backwards compatibility)
 */
export const useExternalAuth = () => {
  // This is now just an alias - components should use useAuth() from AuthContext
  const { useAuth } = require('../utils/AuthContext');
  return useAuth();
};

/**
 * DashboardProvider Props
 * @typedef {Object} DashboardProviderProps
 * @property {Object} user - User object from host app
 * @property {string} user.uid - User ID
 * @property {string} user.email - User email
 * @property {string} [user.displayName] - User display name
 * @property {string} [user.photoURL] - User photo URL
 * @property {string} token - Authentication token
 * @property {Function} [onAuthError] - Callback when auth error occurs
 * @property {React.ReactNode} children - Child components
 */

/**
 * DashboardProvider Component
 *
 * Wraps the dashboard to provide external authentication.
 * Use this when integrating with non-Firebase auth systems.
 *
 * Example usage:
 * ```jsx
 * <DashboardProvider
 *   user={{ uid: 'user123', email: 'user@example.com', displayName: 'John Doe' }}
 *   token="sinch-auth-token-xyz"
 *   onAuthError={(error) => console.error('Auth error:', error)}
 * >
 *   <DashboardCore {...props} />
 * </DashboardProvider>
 * ```
 */
export const DashboardProvider = ({
  user,
  token,
  onAuthError,
  children,
}) => {
  const [authState, setAuthState] = useState({
    currentUser: null,
    loading: true,
    error: null,
  });
  const [projectState, setProjectState] = useState({
    projectId: null,
    projectName: null,
    loading: true,
  });

  // Initialize auth state with external user and fetch/create project
  useEffect(() => {
    if (!user) {
      setAuthState({
        currentUser: null,
        loading: false,
        error: new Error('User not provided'),
      });

      if (onAuthError) {
        onAuthError(new Error('User not provided'));
      }
      return;
    }

    const initializeUserAndProject = async () => {
      try {
        // Transform external user to internal format
        const internalUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || null,
          // Add custom fields if needed
          externalAuth: true,
          token: token || null,
        };

        // Store token for API requests (if provided)
        if (token) {
          window.EXTERNAL_AUTH_TOKEN = token;
        }

        // Fetch or create user's project using backend API
        // The agentBuilderApi interceptor will use the organization API key
        // set via window.REACT_APP_ORGANIZATION_API_KEY
        const response = await agentBuilderApi.get(
          `/api/users/${user.uid}/project`,
          {
            params: user.organizationId ? { organization_id: user.organizationId } : {}
          }
        );

        const projectData = response.data;

        // Update project state
        setProjectState({
          projectId: projectData.project_id,
          projectName: projectData.project_name,
          loading: false,
        });

        // Add project to user object
        internalUser.projectId = projectData.project_id;
        internalUser.projectName = projectData.project_name;

        // Set global user object for service files (non-React code)
        window.__DASHBOARD_CURRENT_USER__ = internalUser;

        // Update auth state with user and project
        setAuthState({
          currentUser: internalUser,
          loading: false,
          error: null,
        });

        console.log('✅ User and project initialized:', {
          userId: user.uid,
          projectId: projectData.project_id,
          projectName: projectData.project_name,
          wasCreated: projectData.created,
        });

      } catch (error) {
        console.error('❌ Failed to initialize user project:', error);

        setAuthState({
          currentUser: null,
          loading: false,
          error: error,
        });

        setProjectState({
          projectId: null,
          projectName: null,
          loading: false,
        });

        if (onAuthError) {
          onAuthError(error);
        }
      }
    };

    initializeUserAndProject();
  }, [user, token, onAuthError]);

  // Provide auth context value
  const authContextValue = {
    ...authState,
    // Add project information
    currentProject: projectState.projectId,
    currentProjectName: projectState.projectName,
    projectLoading: projectState.loading,
    // Methods for compatibility with existing auth hooks
    switchProject: async (projectId) => {
      console.log('🔄 [DashboardProvider] Switching to project:', projectId);
      setProjectState({
        projectId: projectId,
        projectName: projectState.projectName, // Keep existing name
        loading: false,
      });
    },
    signOut: () => {
      setAuthState({
        currentUser: null,
        loading: false,
        error: null,
      });
      setProjectState({
        projectId: null,
        projectName: null,
        loading: false,
      });
      window.EXTERNAL_AUTH_TOKEN = null;
    },
    refreshToken: async () => {
      // Host app should provide new token
      return token;
    },
    getIdToken: async () => {
      return token;
    },
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {authState.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : authState.error ? (
        <ErrorDisplay
          error={authState.error}
          variant="fullPage"
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

/**
 * Higher-order component to inject external auth into legacy components
 */
export const withExternalAuth = (Component) => {
  return (props) => {
    const { useAuth } = require('../utils/AuthContext');
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
};

export default DashboardProvider;
