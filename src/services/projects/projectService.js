/**
 * Project Service
 *
 * Handles project management operations with organization awareness
 * following the Alchemist v3 Enterprise Schema
 *
 * Data Access Strategy:
 * - READ operations: Use dataAccess (Firestore in cloud, API in Docker)
 * - WRITE operations: Use agentBuilderApi (API for both deployments)
 * - Real-time subscriptions: Use dataAccess.subscribeToX() methods
 */

import { DocumentFields } from '../../utils/firebase';
import { dataAccess } from '../data';
import { agentBuilderApi } from '../config/apiConfig';
import { getCurrentUser } from '../context';
// import { getUserProfile } from '../users/userProfileService'; // REMOVED: User profile service deleted

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

/**
 * Create a new project
 */
export const createProject = async (organizationId, projectData) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to create project
    const response = await agentBuilderApi.post('/api/projects', {
      organization_id: organizationId,
      project_info: {
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium'
      },
      team_access: {
        collaborators: projectData.collaborators || [],
        visibility: projectData.visibility || 'organization'
      }
    });

    console.log('Project created via backend API:', response.data.project_id);

    return response.data.data;
  } catch (error) {
    console.error('Error creating project:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Get project by ID
 * Uses dataAccess for deployment-aware read operation
 */
export const getProject = async (projectId) => {
  try {
    const project = await dataAccess.getProject(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

/**
 * Get all projects for an organization
 * Uses dataAccess for deployment-aware read operation
 */
export const getOrganizationProjects = async (organizationId, options = {}) => {
  try {
    const {
      status = null,
      priority = null,
      ownerId = null,
      orderByField = 'created_at',
      orderDirection = 'desc'
    } = options;

    // Build filters object for data access layer
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (ownerId) filters.ownerId = ownerId;
    if (orderByField) {
      filters.orderBy = orderByField;
      filters.orderDirection = orderDirection;
    }

    const projects = await dataAccess.getOrganizationProjects(organizationId, filters);
    return projects; // Already formatted with id
  } catch (error) {
    console.error('Error getting organization projects:', error);
    throw error;
  }
};

/**
 * Get all projects where user is a member (based on project membership)
 * Uses dataAccess for deployment-aware read operation
 */
export const getUserProjectsByMembership = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    console.log('Loading projects where user is a member:', userId);

    // Get user projects via data access layer
    const projects = await dataAccess.getUserProjects(userId);

    console.log(`Successfully loaded ${projects.length} projects for user`);
    return projects;
  } catch (error) {
    console.error('Error getting user projects by membership:', error);
    throw error;
  }
};

/**
 * Update project information
 */
export const updateProject = async (projectId, updates) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to update project
    const response = await agentBuilderApi.patch(`/api/projects/${projectId}`, updates);

    console.log('Project updated via backend API:', projectId);

    return response.data.data;
  } catch (error) {
    console.error('Error updating project:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Delete project
 */
export const deleteProject = async (projectId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to delete project
    const response = await agentBuilderApi.delete(`/api/projects/${projectId}`);

    console.log('Project deleted via backend API:', projectId);

    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

/**
 * Add team member to project
 */
/**
 * @deprecated Use addProjectMember() instead. This legacy function directly modifies
 * the team_access.collaborators array, while the new approach uses a proper members
 * subcollection with role management via backend API.
 */
export const addTeamMember = async (projectId, userId, role = 'collaborator') => {
  console.warn('addTeamMember is deprecated. Use addProjectMember() instead.');
  // Redirect to new implementation
  return addProjectMember(projectId, userId, { role });
};

/**
 * @deprecated Use removeProjectMember() instead. This legacy function directly modifies
 * the team_access.collaborators array, while the new approach uses a proper members
 * subcollection with role management via backend API.
 */
export const removeTeamMember = async (projectId, userId) => {
  console.warn('removeTeamMember is deprecated. Use removeProjectMember() instead.');
  // Redirect to new implementation
  return removeProjectMember(projectId, userId);
};

/**
 * Get project team members with profile data
 * Uses dataAccess for deployment-aware read operation
 */
export const getProjectTeamMembers = async (projectId) => {
  try {
    const members = await dataAccess.listProjectMembers(projectId);

    // Enrich with profile data if needed
    const teamMembers = await Promise.all(
      members.map(async (member) => {
        try {
          const userId = member.user_id || member.id;
          // const userProfile = await getUserProfile(userId); // REMOVED: getUserProfile deleted
          const userProfile = null; // TODO: Replace with appropriate profile fetching if needed
          return {
            ...member,
            userId,
            profile: userProfile
          };
        } catch (error) {
          console.warn(`Failed to load profile for user ${member.user_id}:`, error);
          return {
            ...member,
            profile: null
          };
        }
      })
    );

    return teamMembers;
  } catch (error) {
    console.error('Error getting project team members:', error);
    throw error;
  }
};

// ============================================================================
// AGENT ASSIGNMENT
// ============================================================================

/**
 * Assign agent to project
 * TODO: Implement agent assignment using separate collection or agent.project_id field
 * Since we removed project_metrics.assigned_agents to align with schema
 */
/**
 * Create an agent and assign it to a project in one operation
 */
export const createAndAssignAgent = async (projectId, agentData) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Import agent service
    const agentService = await import('../agents/agentService');
    
    // Create the agent
    const newAgent = await agentService.createAgent({
      ...agentData,
      project_id: projectId
    });
    
    // Assign the agent to the project
    const agentId = newAgent.agent_id || newAgent.id;
    await assignAgentToProject(projectId, agentId);
    
    return {
      agent: newAgent,
      agentId: agentId
    };
  } catch (error) {
    console.error('Error creating and assigning agent:', error);
    throw error;
  }
};

export const assignAgentToProject = async (projectId, agentId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to assign agent to project
    const response = await agentBuilderApi.post(
      `/api/projects/${projectId}/agents/${agentId}/assign`
    );

    console.log('Agent assigned to project via backend API:', { agentId, projectId });

    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error assigning agent to project:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Get all agents assigned to a project
 * @param {string} projectId - The project ID to filter by
 * @param {Object} options - Optional filters (e.g., { status: 'active' })
 */
export const getProjectAgents = async (projectId, options = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`Getting agents for project ${projectId} with filters:`, options);

    // Build filters for data access layer
    const filters = {};
    if (options.status) filters.status = options.status;
    if (options.teamMemberId) filters.teamMemberId = options.teamMemberId;

    const agents = await dataAccess.getProjectAgents(projectId, filters);

    // Add computed fields for UI compatibility
    const processedAgents = agents.map(agentData => {
      const agentStatus = agentData.status || agentData.agent_info?.status || 'draft';

      return {
        id: agentData.id || agentData.agent_id,
        agent_id: agentData.id || agentData.agent_id,
        ...agentData,
        name: agentData.basic_info?.name || agentData.name || 'Unnamed Agent',
        description: agentData.basic_info?.description || agentData.description || '',
        type: agentData.basic_info?.agent_type || agentData.type || 'general',
        status: agentStatus,
        performance: agentData.performance_summary?.success_rate || 0,
        assigned_at: agentData.updated_at?.toDate?.() || agentData.created_at?.toDate?.() || new Date()
      };
    });

    console.log(`Returning ${processedAgents.length} processed agents for project ${projectId}`);
    return processedAgents;
  } catch (error) {
    console.error('Error getting project agents:', error);
    throw error;
  }
};

/**
 * Remove agent from project
 */
export const removeAgentFromProject = async (projectId, agentId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to remove agent from project
    const response = await agentBuilderApi.delete(
      `/api/projects/${projectId}/agents/${agentId}`
    );

    console.log('Agent removed from project via backend API:', { agentId, projectId });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error removing agent from project:', error);
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Get projects for a specific agent
 * TODO: Implement agent project lookup using separate collection or agent.project_id field
 * Since we removed project_metrics.assigned_agents to align with schema
 */
export const getAgentProjects = async (agentId, organizationId) => {
  try {
    // TODO: Implement agent project lookup logic
    // Option 1: Query agents collection by project_id field
    // Option 2: Query separate project_agents collection
    console.log('Agent project lookup temporarily disabled during schema alignment');
    return [];
  } catch (error) {
    console.error('Error getting agent projects:', error);
    throw error;
  }
};

// ============================================================================
// PROJECT ANALYTICS
// ============================================================================


/**
 * Get project analytics summary
 */
export const getProjectAnalytics = async (projectId) => {
  try {
    const project = await getProject(projectId);
    const teamMembers = await getProjectTeamMembers(projectId);
    
    // Calculate basic metrics (schema-aligned)
    const metrics = {
      basic_info: {
        name: project[DocumentFields.Project.PROJECT_INFO]?.[DocumentFields.Project.NAME],
        status: project[DocumentFields.Project.PROJECT_INFO]?.[DocumentFields.Project.STATUS],
        priority: project[DocumentFields.Project.PROJECT_INFO]?.[DocumentFields.Project.PRIORITY]
      },
      team_stats: {
        total_members: teamMembers.length,
        active_members: teamMembers.filter(m => m.profile).length,
        owner: teamMembers.find(m => m.isOwner)?.profile || null
      },
      agent_stats: {
        assigned_agents: 0, // TODO: Implement agent counting via separate collection
        agents_list: [] // TODO: Implement agent listing via separate collection
      },
      timeline: {
        created_at: project[DocumentFields.CREATED_AT],
        updated_at: project[DocumentFields.UPDATED_AT]
      }
    };

    return metrics;
  } catch (error) {
    console.error('Error getting project analytics:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user has access to project
 */
export const checkProjectAccess = async (projectId, userId) => {
  try {
    const project = await getProject(projectId);
    
    const isOwner = project[DocumentFields.Project.TEAM_ACCESS]?.[DocumentFields.Project.OWNER_ID] === userId;
    const isCollaborator = project[DocumentFields.Project.TEAM_ACCESS]?.[DocumentFields.Project.COLLABORATORS]?.includes(userId);
    // Team member is now owner + collaborator (schema-aligned)
    const isTeamMember = isOwner || isCollaborator;
    
    return {
      hasAccess: isOwner || isCollaborator,
      isOwner,
      isCollaborator,
      isTeamMember,
      accessLevel: isOwner ? 'owner' : isCollaborator ? 'collaborator' : 'none'
    };
  } catch (error) {
    console.error('Error checking project access:', error);
    return { hasAccess: false, accessLevel: 'none' };
  }
};

/**
 * Search projects
 */
export const searchProjects = async (organizationId, searchTerm, options = {}) => {
  try {
    // Get all projects first (simple search implementation)
    const allProjects = await getOrganizationProjects(organizationId, { limit: 100 });
    
    if (!searchTerm) return allProjects;

    const searchTermLower = searchTerm.toLowerCase();
    
    return allProjects.filter(project => {
      const name = project[DocumentFields.Project.PROJECT_INFO]?.[DocumentFields.Project.NAME]?.toLowerCase() || '';
      const description = project[DocumentFields.Project.PROJECT_INFO]?.[DocumentFields.Project.DESCRIPTION]?.toLowerCase() || '';
      // TODO: Implement tag search if needed via separate collection
      
      return name.includes(searchTermLower) || 
             description.includes(searchTermLower);
    });
  } catch (error) {
    console.error('Error searching projects:', error);
    throw error;
  }
};

// ============================================================================
// PROJECT MEMBERS MANAGEMENT
// ============================================================================

/**
 * Get all members of a project
 */
export const getProjectMembers = async (projectId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Loading project members for:', projectId);

    const members = await dataAccess.listProjectMembers(projectId);

    // Ensure flattened fields are available for easier access
    const memberData = members.map(data => ({
      id: data.id || data.member_id,
      ...data,
      role: data.role || 'member',
      status: data.membership_status?.status || data.status || 'active',
      invite_status: data.membership_status?.invite_status || data.invite_status || 'accepted',
      joined_at: data.membership_status?.joined_at || data[DocumentFields.CREATED_AT] || null
    }));

    console.log('Project members data:', memberData);
    return memberData;
  } catch (error) {
    console.error('Error getting project members:', error);
    throw error;
  }
};

/**
 * Check if email already exists in project (including pending invitations)
 * Used for duplicate validation before sending invitations
 */
export const checkProjectMemberByEmail = async (projectId, email) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const result = await dataAccess.checkProjectMemberByEmail(projectId, email);
    return result;
  } catch (error) {
    console.error('Error checking project member by email:', error);
    throw error;
  }
};

/**
 * Add a member to project
 */
export const addProjectMember = async (projectId, userId, memberData = {}) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to add project member
    const response = await agentBuilderApi.post(
      `/api/projects/${projectId}/members`,
      {
        user_id: userId,
        role: memberData.role || 'viewer'
      }
    );

    console.log('Project member added via backend API:', userId);

    return response.data.data;
  } catch (error) {
    console.error('Error adding project member:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Remove a member from project
 */
export const removeProjectMember = async (projectId, memberId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to remove project member
    const response = await agentBuilderApi.delete(
      `/api/projects/${projectId}/members/${memberId}`
    );

    console.log('Project member removed via backend API:', memberId);

    return response.data;
  } catch (error) {
    console.error('Error removing project member:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

/**
 * Check if user is a member of the project
 */
export const isUserProjectMember = async (projectId, userId) => {
  try {
    const members = await dataAccess.listProjectMembers(projectId);

    // Find the specific user
    const memberData = members.find(m => m.user_id === userId || m.id === userId);

    if (!memberData) {
      return null;
    }

    // Validate membership status
    const membershipStatus = memberData.membership_status;

    if (!membershipStatus) {
      console.warn('Membership document missing membership_status field');
      return null;
    }

    // Check if membership is active and invitation is accepted
    const isActive = membershipStatus.status === 'active';
    const isAccepted = membershipStatus.invite_status === 'accepted';

    if (!isActive || !isAccepted) {
      console.log(`Membership validation failed for user ${userId} in project ${projectId}:`, {
        status: membershipStatus.status,
        invite_status: membershipStatus.invite_status,
        isActive,
        isAccepted
      });
      return null;
    }

    return memberData;
  } catch (error) {
    console.error('Error checking project membership:', error);
    return null;
  }
};

/**
 * Invite member to project via email
 * Creates pending membership and sends email invitation
 */
export const inviteMemberToProject = async (projectId, organizationId, inviteData) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Use backend API to invite member to project
    const response = await agentBuilderApi.post(
      `/api/projects/${projectId}/invitations`,
      {
        email: inviteData.email,
        project_role: inviteData.projectRole || 'viewer',
        message: inviteData.message || ''
      }
    );

    console.log(`Project invitation sent to ${inviteData.email} via backend API`);

    return {
      success: true,
      message: `Invitation sent to ${inviteData.email}`,
      ...response.data
    };
  } catch (error) {
    console.error('Error inviting member to project:', error);
    // Extract error message from API response
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(errorMessage);
  }
};

const projectService = {
  // Project CRUD
  createProject,
  getProject,
  getOrganizationProjects,
  getUserProjectsByMembership,
  updateProject,
  deleteProject,

  // Team management
  addTeamMember,
  removeTeamMember,
  getProjectTeamMembers,

  // Agent assignment
  createAndAssignAgent,
  assignAgentToProject,
  getProjectAgents,
  removeAgentFromProject,
  getAgentProjects,

  // Analytics
  getProjectAnalytics,

  // Utilities
  checkProjectAccess,
  searchProjects,

  // Project members
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  isUserProjectMember
};

export default projectService;