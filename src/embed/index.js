/**
 * Embed Entry Point
 *
 * Main exports for embedding the dashboard in external applications.
 * This file is the primary entry point for Module Federation and NPM package.
 */

// Core components
export { default as DashboardCore } from './DashboardCore';
export {
  DashboardProvider,
  useExternalAuth,
  withExternalAuth,
} from './DashboardProvider';

// Theme utilities
export { createAppTheme } from '../theme';

// Type definitions (for TypeScript users)
/**
 * @typedef {Object} DashboardCoreProps
 * @property {string} apiUrl - Base URL for backend API
 * @property {Object} authToken - Authentication token or user object
 * @property {Function} [onNavigate] - Callback when internal navigation occurs
 * @property {'light'|'dark'} [theme] - Theme mode
 * @property {Object} [config] - Additional configuration
 * @property {string} [initialPath] - Initial route path
 */

/**
 * @typedef {Object} DashboardProviderProps
 * @property {Object} user - User object from host app
 * @property {string} token - Authentication token
 * @property {Function} [onAuthError] - Callback when auth error occurs
 * @property {React.ReactNode} children - Child components
 */

// Version
export const VERSION = '0.1.0';

// Initialization helper for vanilla JS usage
export const init = (config) => {
  console.warn(
    'init() is not yet implemented. Use React components directly or wait for vanilla JS support.'
  );
  return {
    version: VERSION,
    config,
  };
};
