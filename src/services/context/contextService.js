/**
 * Context Service - Centralized User/Project/Organization Context
 *
 * Provides unified access to current user, project, and organization context
 * for both React components (via useAuth hook) and service files (via singleton)
 *
 * Architecture:
 * - Singleton pattern for service layer (synchronous access)
 * - Reads from window.__DASHBOARD_CURRENT_USER__ (set by DashboardProvider)
 * - Works in both standalone and embed modes
 *
 * Usage:
 * - Services: import { contextService } from '../context'
 * - Components: use existing useAuth() hook
 */

class ContextService {
  constructor() {
    this._listeners = new Set();
  }

  /**
   * Get current user from context
   * Returns null if not authenticated
   */
  getCurrentUser() {
    // In embed mode, DashboardProvider sets window.__DASHBOARD_CURRENT_USER__
    if (window.__DASHBOARD_CURRENT_USER__) {
      return window.__DASHBOARD_CURRENT_USER__;
    }

    return null;
  }

  /**
   * Get current user ID
   * Convenience method for most common use case
   */
  getUserId() {
    const user = this.getCurrentUser();
    return user?.uid || null;
  }

  /**
   * Get current project context
   * Returns { projectId, projectName } or null
   */
  getCurrentProject() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      projectId: user.projectId || null,
      projectName: user.projectName || null
    };
  }

  /**
   * Get current project ID
   * Convenience method
   */
  getProjectId() {
    const project = this.getCurrentProject();
    return project?.projectId || null;
  }

  /**
   * Get current organization context
   * Returns { organizationId, organizationName } or null
   */
  getCurrentOrganization() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      organizationId: user.organizationId || null,
      organizationName: user.organizationName || null
    };
  }

  /**
   * Get current organization ID
   * Convenience method
   */
  getOrganizationId() {
    const org = this.getCurrentOrganization();
    return org?.organizationId || null;
  }

  /**
   * Get authentication token
   * For API requests
   */
  async getAuthToken() {
    // Check for external auth token first (embed mode)
    if (window.EXTERNAL_AUTH_TOKEN) {
      return window.EXTERNAL_AUTH_TOKEN;
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Require authentication - throws if not authenticated
   * Use in services that require auth
   */
  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Require project context - throws if not available
   */
  requireProject() {
    const project = this.getCurrentProject();
    if (!project || !project.projectId) {
      throw new Error('Project context not available');
    }
    return project;
  }

  /**
   * Get full context (user + project + organization)
   * Returns everything in one object
   */
  getFullContext() {
    const user = this.getCurrentUser();
    const project = this.getCurrentProject();
    const organization = this.getCurrentOrganization();

    return {
      user,
      userId: user?.uid || null,
      project,
      projectId: project?.projectId || null,
      projectName: project?.projectName || null,
      organization,
      organizationId: organization?.organizationId || null,
      organizationName: organization?.organizationName || null,
      isAuthenticated: user !== null
    };
  }
}

// Export singleton instance
export const contextService = new ContextService();

// Export individual methods as named exports for convenience
export const {
  getCurrentUser,
  getUserId,
  getCurrentProject,
  getProjectId,
  getCurrentOrganization,
  getOrganizationId,
  getAuthToken,
  isAuthenticated,
  requireAuth,
  requireProject,
  getFullContext
} = contextService;

// Default export
export default contextService;
