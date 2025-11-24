/**
 * Agent Creation Utility Functions
 * 
 * Centralized logic for handling agent creation with project validation
 */

// import * as organizationService from '../services/organizations/organizationService'; // REMOVED: Organization service deleted

/**
 * Check if projects exist for agent creation
 * 
 * @param {Object} currentOrganization - Current organization context
 * @returns {Promise<{needsProject: boolean, projectCount: number}>}
 */
export const checkProjectRequirement = async (currentOrganization) => {
  if (!currentOrganization) {
    throw new Error('No organization selected');
  }
  
  try {
    // const projects = await organizationService.getOrganizationProjects(currentOrganization.id); // REMOVED: Organization service deleted
    const projects = []; // TODO: Replace with appropriate project fetching logic if needed
    return {
      needsProject: projects.length === 0,
      projectCount: projects.length
    };
  } catch (error) {
    console.error('Error checking projects:', error);
    // Fallback: assume projects exist to avoid blocking
    return {
      needsProject: false,
      projectCount: 0
    };
  }
};

/**
 * Handle agent creation with project validation
 * 
 * @param {Object} currentOrganization - Current organization context
 * @param {Function} navigate - React Router navigate function
 * @param {Object} options - Additional options
 * @param {boolean} options.skipProjectCheck - Skip project validation (e.g., when creating from project detail)
 * @param {Function} options.onProjectRequired - Callback when projects are required
 * @returns {Promise<void>}
 */
export const handleAgentCreation = async (currentOrganization, navigate, options = {}) => {
  if (!currentOrganization) {
    console.error('No organization selected');
    return;
  }
  
  // Skip project check if explicitly requested (e.g., creating from project detail page)
  if (options.skipProjectCheck) {
    // Agent creation should be handled through CreateAgentDialog
    navigate('/agents');
    return;
  }

  try {
    const { needsProject } = await checkProjectRequirement(currentOrganization);

    if (needsProject) {
      // Projects are required - call callback if provided, otherwise redirect
      if (options.onProjectRequired) {
        options.onProjectRequired();
      } else {
        // Fallback: direct redirect (legacy behavior)
        navigate('/projects');
      }
    } else {
      // Projects exist - agent creation handled through CreateAgentDialog
      navigate('/agents');
    }
  } catch (error) {
    console.error('Error checking projects:', error);
    // Fallback: go to agents page
    navigate('/agents');
  }
};

/**
 * Navigate to project creation
 * 
 * @param {Function} navigate - React Router navigate function
 */
export const navigateToProjectCreation = (navigate) => {
  navigate('/projects');
};

export default {
  handleAgentCreation,
  checkProjectRequirement,
  navigateToProjectCreation
};