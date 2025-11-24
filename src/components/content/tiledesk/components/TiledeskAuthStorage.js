/**
 * Tiledesk Authentication Storage Utility
 *
 * Manages JWT token storage and retrieval for Tiledesk integration
 */

const STORAGE_KEYS = {
  TOKEN: 'tiledesk_auth_token',
  PROJECT_ID: 'tiledesk_project_id',
  TIMESTAMP: 'tiledesk_auth_timestamp',
  USER_EMAIL: 'tiledesk_user_email'
};

class TiledeskAuthStorage {
  /**
   * Store authentication data
   */
  static setAuth(authData) {
    const { token, projectId, email } = authData;

    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }

    if (projectId) {
      localStorage.setItem(STORAGE_KEYS.PROJECT_ID, projectId);
    }

    if (email) {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    }

    // Store timestamp
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
  }

  /**
   * Get stored JWT token
   */
  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Get stored project ID
   */
  static getProjectId() {
    return localStorage.getItem(STORAGE_KEYS.PROJECT_ID);
  }

  /**
   * Get stored user email
   */
  static getUserEmail() {
    return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
  }

  /**
   * Get authentication timestamp
   */
  static getTimestamp() {
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  /**
   * Get all authentication data
   */
  static getAuth() {
    return {
      token: this.getToken(),
      projectId: this.getProjectId(),
      email: this.getUserEmail(),
      timestamp: this.getTimestamp()
    };
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    const token = this.getToken();
    const projectId = this.getProjectId();
    return !!(token && projectId);
  }

  /**
   * Clear all authentication data
   */
  static clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PROJECT_ID);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  }

  /**
   * Update token (for token refresh scenarios)
   */
  static updateToken(newToken) {
    if (newToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    }
  }

  /**
   * Check if authentication is expired (optional, based on timestamp)
   * Default: 7 days
   */
  static isExpired(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const timestamp = this.getTimestamp();
    if (!timestamp) return true;

    const now = Date.now();
    const age = now - timestamp;
    return age > maxAgeMs;
  }

  /**
   * Get authentication age in milliseconds
   */
  static getAuthAge() {
    const timestamp = this.getTimestamp();
    if (!timestamp) return null;

    return Date.now() - timestamp;
  }
}

export default TiledeskAuthStorage;
