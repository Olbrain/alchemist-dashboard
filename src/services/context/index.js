/**
 * Context Service Exports
 */
export {
  contextService,
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
} from './contextService';

export { contextService as default } from './contextService';
