/**
 * Data Access Factory - Embed Mode Only
 *
 * This is a whitelabel embed build that always uses backend APIs.
 * No Firestore access - all data operations go through backend services.
 */

import ApiDataAccess from './ApiDataAccess';

console.log('[DataAccessFactory] Using API data access (Embed mode)');

// Create singleton instance
const dataAccessInstance = new ApiDataAccess();

/**
 * Get the data access instance
 * @returns {ApiDataAccess}
 */
export const getDataAccess = () => dataAccessInstance;

/**
 * Always returns false in embed mode (no Docker/Cloud distinction)
 * @returns {boolean}
 */
export const isDockerDeployment = () => false;

/**
 * Real-time subscriptions not supported in embed mode (uses polling)
 * @returns {boolean}
 */
export const supportsRealTimeSubscriptions = () => false;

// Export the instance directly for convenience
export default dataAccessInstance;
