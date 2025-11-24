/**
 * Project Helper Utilities
 *
 * Helper functions for working with projects in the new user → projects → agents hierarchy
 */

import { getDataAccess } from '../services/data/DataAccessFactory';

/**
 * Get the organization_id from a project document
 * @param {string} projectId - The project ID
 * @returns {Promise<string|null>} The organization_id or null if not found
 */
export const getProjectOrganizationId = async (projectId) => {
  if (!projectId) {
    console.warn('getProjectOrganizationId: No projectId provided');
    return null;
  }

  try {
    const dataAccess = getDataAccess();
    const projectData = await dataAccess.getProject(projectId);

    if (!projectData) {
      console.warn(`getProjectOrganizationId: Project ${projectId} not found`);
      return null;
    }

    const organizationId = projectData.organization_id;

    if (!organizationId) {
      console.warn(`getProjectOrganizationId: No organization_id in project ${projectId}`);
    }

    return organizationId || null;
  } catch (error) {
    console.error(`Error fetching organization_id for project ${projectId}:`, error);
    return null;
  }
};

/**
 * Get full project data including organization_id
 * @param {string} projectId - The project ID
 * @returns {Promise<Object|null>} The project data or null if not found
 */
export const getProjectData = async (projectId) => {
  if (!projectId) {
    console.warn('getProjectData: No projectId provided');
    return null;
  }

  try {
    const dataAccess = getDataAccess();
    const projectData = await dataAccess.getProject(projectId);

    if (!projectData) {
      console.warn(`getProjectData: Project ${projectId} not found`);
      return null;
    }

    return projectData;
  } catch (error) {
    console.error(`Error fetching project data for ${projectId}:`, error);
    return null;
  }
};
