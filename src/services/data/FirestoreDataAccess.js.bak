/**
 * Firestore Data Access
 *
 * Direct Firestore SDK access for cloud deployments.
 * Used when REACT_APP_DEPLOYMENT_TYPE === "cloud"
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Collections } from '../../constants/collections';
import { agentBuilderApi } from '../config/apiConfig';

class FirestoreDataAccess {
  // ============================================================================
  // ORGANIZATION OPERATIONS
  // ============================================================================

  async getOrganization(organizationId) {
    const orgRef = doc(db, Collections.ORGANIZATIONS, organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
      return null;
    }

    return { id: orgSnap.id, ...orgSnap.data() };
  }

  async listOrganizations(userId) {
    // Query organizations where user is a member
    const userRef = doc(db, Collections.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return [];
    }

    const userData = userSnap.data();
    const orgIds = Object.keys(userData.organizations || {});

    // Fetch each organization
    const organizations = [];
    for (const orgId of orgIds) {
      const org = await this.getOrganization(orgId);
      if (org) {
        organizations.push(org);
      }
    }

    return organizations;
  }

  async createOrganization(organizationData) {
    // Use backend API to create organization
    const response = await agentBuilderApi.post('/api/organizations', organizationData);
    return response.data.organization;
  }

  async updateOrganization(organizationId, updates) {
    // Use backend API to update organization
    await agentBuilderApi.put(`/api/organizations/${organizationId}`, updates);
    return this.getOrganization(organizationId);
  }

  async listOrganizationMembers(organizationId) {
    const membersRef = collection(db, Collections.ORGANIZATIONS, organizationId, 'members');
    const membersSnap = await getDocs(membersRef);

    const members = [];
    membersSnap.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });

    return members;
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async getProject(projectId) {
    const projectRef = doc(db, Collections.PROJECTS, projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return null;
    }

    return { id: projectSnap.id, ...projectSnap.data() };
  }

  async listProjects(organizationId = null) {
    let projectsQuery;

    if (organizationId) {
      projectsQuery = query(
        collection(db, Collections.PROJECTS),
        where('organization_id', '==', organizationId)
      );
    } else {
      projectsQuery = collection(db, Collections.PROJECTS);
    }

    const projectsSnap = await getDocs(projectsQuery);

    const projects = [];
    projectsSnap.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    return projects;
  }

  async createProject(projectData) {
    // Use backend API to create project
    const response = await agentBuilderApi.post('/api/projects', projectData);
    return response.data.project;
  }

  async updateProject(projectId, updates) {
    // Use backend API to update project
    await agentBuilderApi.put(`/api/projects/${projectId}`, updates);
    return this.getProject(projectId);
  }

  async deleteProject(projectId) {
    // Use backend API to delete project
    await agentBuilderApi.delete(`/api/projects/${projectId}`);
    return { success: true };
  }

  async listProjectMembers(projectId) {
    const membersRef = collection(db, Collections.PROJECTS, projectId, 'members');
    const membersSnap = await getDocs(membersRef);

    const members = [];
    membersSnap.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });

    return members;
  }

  async getUserProjects(userId) {
    // Get all projects where user is owner or member
    const projects = [];

    // Query projects where user is owner
    const ownerQuery = query(
      collection(db, Collections.PROJECTS),
      where('team_access.owner_id', '==', userId)
    );
    const ownerSnap = await getDocs(ownerQuery);
    ownerSnap.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    // Note: For member projects, we'd need a collection group query
    // which is more complex. For now, returning owner projects.
    return projects;
  }

  async getOrganizationProjects(organizationId, filters = {}) {
    let projectsQuery = query(collection(db, Collections.PROJECTS));

    // Apply organization filter
    if (organizationId) {
      projectsQuery = query(projectsQuery, where('organization_id', '==', organizationId));
    }

    // Apply status filter
    if (filters.status) {
      projectsQuery = query(projectsQuery, where('project_status.status', '==', filters.status));
    }

    // Apply priority filter
    if (filters.priority) {
      projectsQuery = query(projectsQuery, where('project_info.priority', '==', filters.priority));
    }

    // Apply owner filter
    if (filters.ownerId) {
      projectsQuery = query(projectsQuery, where('team_access.owner_id', '==', filters.ownerId));
    }

    // Apply ordering
    if (filters.orderBy) {
      projectsQuery = query(projectsQuery, orderBy(filters.orderBy, filters.orderDirection || 'desc'));
    }

    const projectsSnap = await getDocs(projectsQuery);
    const projects = [];
    projectsSnap.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    return projects;
  }

  async checkProjectMemberByEmail(projectId, email) {
    // Check if email exists in project members
    const membersRef = collection(db, Collections.PROJECTS, projectId, 'members');
    const membersSnap = await getDocs(membersRef);

    for (const doc of membersSnap.docs) {
      const memberData = doc.data();
      if (memberData.user_info?.email === email || memberData.invitation_email === email) {
        return {
          exists: true,
          member: { id: doc.id, ...memberData }
        };
      }
    }

    return { exists: false };
  }

  async getProjectAgents(projectId, filters = {}) {
    let agentsQuery = query(
      collection(db, Collections.AGENTS),
      where('project_id', '==', projectId)
    );

    // Apply filters
    if (filters.status) {
      agentsQuery = query(agentsQuery, where('agent_status.status', '==', filters.status));
    }

    if (filters.teamMemberId) {
      agentsQuery = query(agentsQuery, where('team_access.team_member_ids', 'array-contains', filters.teamMemberId));
    }

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      agents.push({ id: doc.id, ...doc.data() });
    });

    return agents;
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  async getAgent(agentId) {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return null;
    }

    return { id: agentSnap.id, ...agentSnap.data() };
  }

  async listAgents(filters = {}) {
    let agentsQuery = query(collection(db, 'agents'));

    // Apply filters
    if (filters.organizationId) {
      agentsQuery = query(agentsQuery, where('organization_id', '==', filters.organizationId));
    }

    if (filters.projectId) {
      agentsQuery = query(agentsQuery, where('project_id', '==', filters.projectId));
    }

    if (filters.status) {
      agentsQuery = query(agentsQuery, where('agent_status.status', '==', filters.status));
    }

    if (filters.ownerId) {
      agentsQuery = query(agentsQuery, where('team_access.owner_id', '==', filters.ownerId));
    }

    // Apply ordering
    if (filters.orderBy) {
      agentsQuery = query(agentsQuery, orderBy(filters.orderBy, filters.orderDirection || 'desc'));
    }

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      agents.push({ id: doc.id, ...doc.data() });
    });

    return agents;
  }

  async getActiveAgents(organizationId) {
    const agentsQuery = query(
      collection(db, 'agents'),
      where('organization_id', '==', organizationId),
      where('agent_status.status', '==', 'active')
    );

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      agents.push({ id: doc.id, ...doc.data() });
    });

    return agents;
  }

  async getDeletedAgents(organizationId) {
    const agentsQuery = query(
      collection(db, 'agents'),
      where('organization_id', '==', organizationId),
      where('agent_status.status', '==', 'deleted')
    );

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      agents.push({ id: doc.id, ...doc.data() });
    });

    return agents;
  }

  async getAgentsByTeamMember(userId) {
    // Query agents where user is in team_member_ids
    const agentsQuery = query(
      collection(db, 'agents'),
      where('team_access.team_member_ids', 'array-contains', userId)
    );

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      agents.push({ id: doc.id, ...doc.data() });
    });

    return agents;
  }

  async getUserAgents(userId, projectId = null, lifecycleState = 'active') {
    // Query user's own agents, optionally filtered by project and lifecycle state
    let agentsQuery = query(
      collection(db, Collections.AGENTS),
      where('owner_id', '==', userId)
    );

    if (lifecycleState) {
      agentsQuery = query(agentsQuery, where('lifecycle_state', '==', lifecycleState));
    }

    if (projectId) {
      agentsQuery = query(agentsQuery, where('project_id', '==', projectId));
    }

    agentsQuery = query(agentsQuery, orderBy('created_at', 'desc'));

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      agents.push({ id: doc.id, ...doc.data() });
    });

    return agents;
  }

  async getProjectAgentsExcludingUser(projectId, excludeUserId, lifecycleState = 'active') {
    // Query all agents in a project excluding a specific user
    let agentsQuery = query(
      collection(db, Collections.AGENTS),
      where('project_id', '==', projectId)
    );

    if (lifecycleState) {
      agentsQuery = query(agentsQuery, where('lifecycle_state', '==', lifecycleState));
    }

    agentsQuery = query(agentsQuery, orderBy('created_at', 'desc'));

    const agentsSnap = await getDocs(agentsQuery);
    const agents = [];
    agentsSnap.forEach(doc => {
      // Filter out the excluded user's agents
      const agentData = doc.data();
      if (agentData.owner_id !== excludeUserId) {
        agents.push({ id: doc.id, ...agentData });
      }
    });

    return agents;
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribeToOrganization(organizationId, callback) {
    const orgRef = doc(db, Collections.ORGANIZATIONS, organizationId);
    return onSnapshot(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  }

  subscribeToProject(projectId, callback) {
    const projectRef = doc(db, Collections.PROJECTS, projectId);
    return onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  }

  subscribeToProjects(organizationId, callback) {
    const projectsQuery = query(
      collection(db, Collections.PROJECTS),
      where('organization_id', '==', organizationId)
    );

    return onSnapshot(projectsQuery, (snapshot) => {
      const projects = [];
      snapshot.forEach(doc => {
        projects.push({ id: doc.id, ...doc.data() });
      });
      callback(projects);
    });
  }

  subscribeToAgent(agentId, callback) {
    const agentRef = doc(db, Collections.AGENTS, agentId);
    return onSnapshot(agentRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  }

  subscribeToAgents(filters, callback) {
    let agentsQuery = query(collection(db, Collections.AGENTS));

    // Apply filters
    if (filters.organizationId) {
      agentsQuery = query(agentsQuery, where('organization_id', '==', filters.organizationId));
    }

    if (filters.projectId) {
      agentsQuery = query(agentsQuery, where('project_id', '==', filters.projectId));
    }

    if (filters.ownerId) {
      agentsQuery = query(agentsQuery, where('owner_id', '==', filters.ownerId));
    }

    if (filters.lifecycleState) {
      agentsQuery = query(agentsQuery, where('lifecycle_state', '==', filters.lifecycleState));
    }

    // Apply ordering
    agentsQuery = query(agentsQuery, orderBy('created_at', 'desc'));

    return onSnapshot(agentsQuery, (snapshot) => {
      const agents = [];
      snapshot.forEach(doc => {
        agents.push({ id: doc.id, ...doc.data() });
      });
      callback(agents);
    });
  }

  // ============================================================================
  // USER PROFILE OPERATIONS
  // ============================================================================

  async getUserProfile(userId) {
    const userRef = doc(db, 'user_profiles', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return {
      id: userSnap.id,
      ...userSnap.data()
    };
  }

  async getCurrentSelections(userId) {
    const userRef = doc(db, 'user_profiles', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        organization_id: null,
        project_id: null,
        agent_id: null
      };
    }

    const userData = userSnap.data();
    return {
      organization_id: userData.current_organization || null,
      project_id: userData.current_project || null,
      agent_id: userData.current_agent || null
    };
  }

  async getUser(userId) {
    const userRef = doc(db, Collections.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return {
      id: userSnap.id,
      ...userSnap.data()
    };
  }

  async getUsersByIds(userIds) {
    // Get multiple users by their IDs
    const users = {};

    for (const userId of userIds) {
      const user = await this.getUser(userId);
      if (user) {
        users[userId] = user;
      }
    }

    return users;
  }

  // ============================================================================
  // INVITATION OPERATIONS
  // ============================================================================

  async getPendingInvitations(email) {
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('email', '==', email),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(invitationsQuery);
    const invitations = [];

    snapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return invitations;
  }

  async getInvitation(invitationId) {
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);

    if (!invitationSnap.exists()) {
      return null;
    }

    return {
      id: invitationSnap.id,
      ...invitationSnap.data()
    };
  }

  // ============================================================================
  // API KEY OPERATIONS
  // ============================================================================

  async listApiKeys(agentId, filters = {}) {
    let apiKeysQuery = query(
      collection(db, 'api_keys'),
      where('agent_id', '==', agentId)
    );

    // Add status filter if provided
    if (filters.status) {
      apiKeysQuery = query(apiKeysQuery, where('status', '==', filters.status));
    } else {
      // Default: exclude deleted keys
      apiKeysQuery = query(apiKeysQuery, where('status', 'in', ['active', 'revoked', 'expired']));
    }

    // Exclude system keys by default
    if (!filters.includeSystemKeys) {
      apiKeysQuery = query(apiKeysQuery, where('is_system', '==', false));
    }

    const snapshot = await getDocs(apiKeysQuery);
    const keys = [];

    snapshot.forEach(doc => {
      const keyData = doc.data();
      keys.push({
        id: doc.id,
        ...keyData,
        // Convert Firestore timestamps to JavaScript Dates
        created_at: keyData.created_at?.toDate(),
        last_used: keyData.last_used?.toDate(),
        expires_at: keyData.expires_at?.toDate()
      });
    });

    return keys;
  }

  async getApiKey(keyId) {
    const keyRef = doc(db, 'api_keys', keyId);
    const keySnap = await getDoc(keyRef);

    if (!keySnap.exists()) {
      return null;
    }

    const keyData = keySnap.data();
    return {
      id: keySnap.id,
      ...keyData,
      // Convert Firestore timestamps to JavaScript Dates
      created_at: keyData.created_at?.toDate(),
      last_used: keyData.last_used?.toDate(),
      expires_at: keyData.expires_at?.toDate()
    };
  }

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  async getAgentAnalytics(agentId) {
    const usageRef = doc(db, 'agent_usage', agentId);
    const usageSnap = await getDoc(usageRef);

    if (!usageSnap.exists()) {
      return {
        agent_id: agentId,
        total_sessions: 0,
        total_messages: 0,
        total_tokens: 0,
        last_used: null
      };
    }

    const usageData = usageSnap.data();

    return {
      agent_id: agentId,
      total_sessions: usageData.session_count || 0,
      total_messages: usageData.message_count || 0,
      total_tokens: usageData.total_tokens || 0,
      prompt_tokens: usageData.prompt_tokens || 0,
      completion_tokens: usageData.completion_tokens || 0,
      last_used: usageData.last_updated?.toDate(),
      created_at: usageData.created_at?.toDate()
    };
  }

  async getAgentSessions(agentId, limit = 50, offset = 0) {
    const sessionsQuery = query(
      collection(db, 'agent_sessions'),
      where('agent_id', '==', agentId),
      orderBy('created_at', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(sessionsQuery);
    const sessions = [];

    snapshot.forEach(doc => {
      const sessionData = doc.data();
      sessions.push({
        id: doc.id,
        ...sessionData,
        created_at: sessionData.created_at?.toDate(),
        updated_at: sessionData.updated_at?.toDate()
      });
    });

    return sessions;
  }

  async getDashboardMetrics(agentId, days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get agent usage
    const usageRef = doc(db, 'agent_usage', agentId);
    const usageSnap = await getDoc(usageRef);

    const usageData = usageSnap.exists() ? usageSnap.data() : {};

    // Get recent sessions
    const sessionsQuery = query(
      collection(db, 'agent_sessions'),
      where('agent_id', '==', agentId),
      where('created_at', '>=', startDate)
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);

    return {
      agent_id: agentId,
      time_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      },
      metrics: {
        total_sessions: usageData.session_count || 0,
        recent_sessions: sessionsSnapshot.size,
        total_messages: usageData.message_count || 0,
        total_tokens: usageData.total_tokens || 0,
        prompt_tokens: usageData.prompt_tokens || 0,
        completion_tokens: usageData.completion_tokens || 0
      },
      last_updated: usageData.last_updated?.toDate()
    };
  }

  async getSessionDetails(sessionId) {
    const sessionRef = doc(db, 'agent_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return null;
    }

    const sessionData = sessionSnap.data();

    return {
      id: sessionSnap.id,
      ...sessionData,
      created_at: sessionData.created_at?.toDate(),
      updated_at: sessionData.updated_at?.toDate()
    };
  }

  async getSessionMessages(sessionId, limit = 100, offset = 0) {
    const messagesQuery = query(
      collection(db, 'agent_sessions', sessionId, 'messages'),
      orderBy('created_at', 'asc'),
      limit(limit)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = [];

    snapshot.forEach(doc => {
      const messageData = doc.data();
      messages.push({
        id: doc.id,
        ...messageData,
        created_at: messageData.created_at?.toDate()
      });
    });

    return messages;
  }

  // ============================================================================
  // ACTIVITY OPERATIONS
  // ============================================================================

  async listActivities(resourceType, resourceId, organizationId = null, limit = 50, offset = 0) {
    // Determine collection path based on resource type
    let collectionPath;

    if (resourceType === 'user' && resourceId) {
      collectionPath = `user_profiles/${resourceId}/activities`;
    } else if (resourceType === 'agent' && resourceId) {
      collectionPath = `agents/${resourceId}/activities`;
    } else if (resourceType === 'project' && resourceId) {
      collectionPath = `projects/${resourceId}/activities`;
    } else if (resourceType === 'organization' && organizationId) {
      collectionPath = `organizations/${organizationId}/activities`;
    } else {
      throw new Error('Invalid resource type or missing required IDs');
    }

    const activitiesQuery = query(
      collection(db, collectionPath),
      orderBy('created_at', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(activitiesQuery);
    const activities = [];

    snapshot.forEach(doc => {
      const activityData = doc.data();
      activities.push({
        id: doc.id,
        ...activityData,
        created_at: activityData.created_at?.toDate()
      });
    });

    return activities;
  }

  // Real-time subscription for activities (Cloud mode)
  subscribeToActivities(resourceType, resourceId, organizationId, callback) {
    // Determine collection path
    let collectionPath;

    if (resourceType === 'user' && resourceId) {
      collectionPath = `user_profiles/${resourceId}/activities`;
    } else if (resourceType === 'agent' && resourceId) {
      collectionPath = `agents/${resourceId}/activities`;
    } else if (resourceType === 'project' && resourceId) {
      collectionPath = `projects/${resourceId}/activities`;
    } else if (resourceType === 'organization' && organizationId) {
      collectionPath = `organizations/${organizationId}/activities`;
    } else {
      throw new Error('Invalid resource type or missing required IDs');
    }

    const activitiesQuery = query(
      collection(db, collectionPath),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    return onSnapshot(activitiesQuery, (snapshot) => {
      const activities = [];
      snapshot.forEach(doc => {
        const activityData = doc.data();
        activities.push({
          id: doc.id,
          ...activityData,
          created_at: activityData.created_at?.toDate()
        });
      });
      callback(activities);
    });
  }

  // Real-time subscription for sessions (Cloud mode)
  subscribeToAgentSessions(agentId, callback) {
    const sessionsQuery = query(
      collection(db, 'agent_sessions'),
      where('agent_id', '==', agentId),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    return onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = [];
      snapshot.forEach(doc => {
        const sessionData = doc.data();
        sessions.push({
          id: doc.id,
          ...sessionData,
          created_at: sessionData.created_at?.toDate(),
          updated_at: sessionData.updated_at?.toDate()
        });
      });
      callback(sessions);
    });
  }

  // ============================================================================
  // WHATSAPP OPERATIONS
  // ============================================================================

  async listWhatsAppTemplates(agentId) {
    const templatesRef = collection(db, 'whatsapp_templates', agentId, 'templates');
    const templatesQuery = query(templatesRef, orderBy('created_at', 'desc'));

    const snapshot = await getDocs(templatesQuery);
    const templates = [];

    snapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return templates;
  }

  async getWhatsAppContacts(agentId) {
    const contactsRef = collection(db, 'outreach', agentId, 'contacts');
    const snapshot = await getDocs(contactsRef);
    const contacts = [];

    snapshot.forEach(doc => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return contacts;
  }

  async getWhatsAppTasks(agentId) {
    const tasksRef = collection(db, 'outreach', agentId, 'tasks');
    const snapshot = await getDocs(tasksRef);
    const tasks = [];

    snapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return tasks;
  }

  async getWhatsAppMessages(agentId) {
    const messagesRef = collection(db, 'outreach', agentId, 'messages');
    const snapshot = await getDocs(messagesRef);
    const messages = [];

    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return messages;
  }

  // ============================================================================
  // AGENT TOOLS OPERATIONS
  // ============================================================================

  async getAgentApiTools(agentId) {
    const apiToolsRef = collection(db, 'agents', agentId, 'api_tools');
    const snapshot = await getDocs(apiToolsRef);
    const tools = [];

    snapshot.forEach(doc => {
      tools.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return tools;
  }

  async getAgentToolConfigs(agentId) {
    const configsRef = collection(db, 'agents', agentId, 'tool_configs');
    const snapshot = await getDocs(configsRef);
    const configs = [];

    snapshot.forEach(doc => {
      configs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return configs;
  }

  // ============================================================================
  // AGENT SERVER OPERATIONS
  // ============================================================================

  async getAgentServer(agentId) {
    const serverRef = doc(db, 'agent_servers', agentId);
    const serverSnap = await getDoc(serverRef);

    if (!serverSnap.exists()) {
      return null;
    }

    return {
      id: serverSnap.id,
      ...serverSnap.data()
    };
  }

  // ============================================================================
  // ALCHEMIST TRACKER OPERATIONS
  // ============================================================================

  async getAlchemistTrackers(userId) {
    const trackersRef = collection(db, 'alchemist_conversations', userId, 'trackers');
    const snapshot = await getDocs(trackersRef);
    const trackers = [];

    snapshot.forEach(doc => {
      trackers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return trackers;
  }

  subscribeToAlchemistTrackers(userId, callback) {
    const trackersRef = collection(db, 'alchemist_conversations', userId, 'trackers');

    return onSnapshot(trackersRef, (snapshot) => {
      const trackers = [];
      snapshot.forEach(doc => {
        trackers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(trackers);
    });
  }

  // ============================================================================
  // WHATSAPP SUBSCRIPTION OPERATIONS
  // ============================================================================

  subscribeToWhatsAppContacts(agentId, callback) {
    const contactsRef = collection(db, 'outreach', agentId, 'contacts');
    const contactsQuery = query(contactsRef, orderBy('created_at', 'desc'));

    return onSnapshot(contactsQuery, (snapshot) => {
      const contacts = [];
      snapshot.forEach(doc => {
        contacts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(contacts);
    });
  }

  subscribeToWhatsAppOutreachTasks(agentId, callback) {
    const tasksRef = collection(db, 'outreach', agentId, 'tasks');
    const tasksQuery = query(tasksRef, orderBy('created_at', 'desc'));

    return onSnapshot(tasksQuery, (snapshot) => {
      const tasks = [];
      snapshot.forEach(doc => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(tasks);
    });
  }

  subscribeToWhatsAppOutreachMessages(taskId, callback) {
    const messagesRef = collection(db, 'outreach_messages');
    const messagesQuery = query(
      messagesRef,
      where('task_id', '==', taskId),
      orderBy('sent_at', 'desc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });
  }

  // ============================================================================
  // MCP / TOOLS SUBSCRIPTION OPERATIONS
  // ============================================================================

  subscribeToMcpConfigurations(agentId, callback) {
    const configsRef = collection(db, 'agent_tool_configs', agentId, 'configs');

    return onSnapshot(configsRef, (snapshot) => {
      const configs = {};
      snapshot.forEach(doc => {
        configs[doc.id] = doc.data();
      });
      callback(configs);
    });
  }

  // ============================================================================
  // ALCHEMIST STATUS SUBSCRIPTION OPERATIONS
  // ============================================================================

  subscribeToAlchemistStatus(userId, callback) {
    const statusRef = doc(db, 'alchemist_conversations', userId, 'status', 'current');

    return onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback(null);
      }
    });
  }

  // ============================================================================
  // KNOWLEDGE BASE SUBSCRIPTION OPERATIONS
  // ============================================================================

  subscribeToAgentKnowledge(agentId, callback) {
    const knowledgeRef = collection(db, 'agent_knowledge', agentId, 'files');
    const knowledgeQuery = query(knowledgeRef, orderBy('uploaded_at', 'desc'));

    return onSnapshot(knowledgeQuery, (snapshot) => {
      const files = [];
      snapshot.forEach(doc => {
        files.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(files);
    });
  }
}

export default FirestoreDataAccess;
