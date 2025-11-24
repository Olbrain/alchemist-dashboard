/**
 * DataCacheContext
 *
 * Provides caching for organization, project, and agent names to avoid
 * repeated backend API calls across the application. Uses lazy loading
 * with on-demand fetching.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { getDataAccess } from '../services/data/DataAccessFactory';

const DataCacheContext = createContext(null);

export const DataCacheProvider = ({ children }) => {
  // Cache stores: Map<id, name>
  const [organizations, setOrganizations] = useState(new Map());
  const [projects, setProjects] = useState(new Map());
  const [agents, setAgents] = useState(new Map());

  // Loading states
  const [loading, setLoading] = useState({
    organizations: false,
    projects: false,
    agents: false
  });

  /**
   * Get organization name from cache or fetch if missing
   */
  const getOrganizationName = useCallback(async (orgId) => {
    if (!orgId) return 'Unknown Organization';

    // Check cache first
    if (organizations.has(orgId)) {
      return organizations.get(orgId);
    }

    // Fetch from backend API
    try {
      const dataAccess = getDataAccess();
      const orgData = await dataAccess.getOrganization(orgId);
      if (orgData) {
        const name = orgData.display_name || orgData.name || 'Unknown Organization';

        // Update cache
        setOrganizations(prev => new Map(prev).set(orgId, name));
        return name;
      }
    } catch (error) {
      console.error(`Error fetching organization ${orgId}:`, error);
    }

    return 'Unknown Organization';
  }, [organizations]);

  /**
   * Get project name from cache or fetch if missing
   */
  const getProjectName = useCallback(async (projectId) => {
    if (!projectId) return 'Unknown Project';

    // Check cache first
    if (projects.has(projectId)) {
      return projects.get(projectId);
    }

    // Fetch from backend API
    try {
      const dataAccess = getDataAccess();
      const projectData = await dataAccess.getProject(projectId);
      if (projectData) {
        const name = projectData.project_info?.name || projectData.name || 'Unknown Project';

        // Update cache
        setProjects(prev => new Map(prev).set(projectId, name));
        return name;
      }
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
    }

    return 'Unknown Project';
  }, [projects]);

  /**
   * Get agent name from cache or fetch if missing
   */
  const getAgentName = useCallback(async (agentId) => {
    if (!agentId) return 'Unknown Agent';

    // Check cache first
    if (agents.has(agentId)) {
      return agents.get(agentId);
    }

    // Fetch from backend API
    try {
      const dataAccess = getDataAccess();
      const agentData = await dataAccess.getAgent(agentId);
      if (agentData) {
        const name = agentData.name || agentData.basic_info?.name || 'Unknown Agent';

        // Update cache
        setAgents(prev => new Map(prev).set(agentId, name));
        return name;
      }
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
    }

    return 'Unknown Agent';
  }, [agents]);

  /**
   * Batch load all projects for an organization
   */
  const loadProjects = useCallback(async (organizationId) => {
    if (!organizationId || loading.projects) return;

    setLoading(prev => ({ ...prev, projects: true }));

    try {
      const dataAccess = getDataAccess();

      // Use DataAccess to fetch projects
      // Note: subscribeToProjects returns a subscription, we need a one-time fetch
      // For now, we'll use a promise wrapper
      const projectsList = await new Promise((resolve) => {
        const unsubscribe = dataAccess.subscribeToProjects({ organizationId }, (projects) => {
          unsubscribe();
          resolve(projects);
        });
      });

      const newProjects = new Map(projects);
      projectsList.forEach(projectData => {
        const name = projectData.project_info?.name || projectData.name || 'Unknown Project';
        newProjects.set(projectData.id, name);
      });

      setProjects(newProjects);
      console.log(`✅ Loaded ${projectsList.length} projects for organization ${organizationId}`);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, [loading.projects, projects]);

  /**
   * Batch load all agents for a project
   */
  const loadAgentsForProject = useCallback(async (projectId) => {
    if (!projectId || loading.agents) return;

    setLoading(prev => ({ ...prev, agents: true }));

    try {
      const dataAccess = getDataAccess();

      const agentsList = await new Promise((resolve) => {
        const unsubscribe = dataAccess.subscribeToAgents({
          projectId,
          lifecycleState: 'active'
        }, (agents) => {
          unsubscribe();
          resolve(agents);
        });
      });

      const newAgents = new Map(agents);

      agentsList.forEach(agentData => {
        const name = agentData.name || agentData.basic_info?.name || 'Unknown Agent';
        newAgents.set(agentData.id, name);
      });

      setAgents(newAgents);
      console.log(`✅ Loaded ${agentsList.length} agents for project ${projectId}`);
    } catch (error) {
      console.error('Error loading agents for project:', error);
    } finally {
      setLoading(prev => ({ ...prev, agents: false }));
    }
  }, [loading.agents, agents]);

  /**
   * Batch load all agents for an organization (across all projects)
   */
  const loadAgentsForOrganization = useCallback(async (organizationId) => {
    if (!organizationId || loading.agents) return;

    setLoading(prev => ({ ...prev, agents: true }));

    try {
      const dataAccess = getDataAccess();

      // Load agents by organization
      const agentsList = await new Promise((resolve) => {
        const unsubscribe = dataAccess.subscribeToAgents({
          organizationId,
          lifecycleState: 'active'
        }, (agents) => {
          unsubscribe();
          resolve(agents);
        });
      });

      const newAgents = new Map(agents);

      agentsList.forEach(agentData => {
        const name = agentData.name || agentData.basic_info?.name || 'Unknown Agent';
        newAgents.set(agentData.id, name);
      });

      setAgents(newAgents);
      console.log(`✅ Loaded ${agentsList.length} agents for organization ${organizationId}`);
    } catch (error) {
      console.error('Error loading agents for organization:', error);
    } finally {
      setLoading(prev => ({ ...prev, agents: false }));
    }
  }, [loading.agents, agents]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(() => {
    setOrganizations(new Map());
    setProjects(new Map());
    setAgents(new Map());
    console.log('🗑️ Cache cleared');
  }, []);

  /**
   * Refresh cache by clearing and allowing lazy reload
   */
  const refreshCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  const value = {
    // Lookup functions
    getOrganizationName,
    getProjectName,
    getAgentName,

    // Batch loading functions
    loadProjects,
    loadAgentsForProject,
    loadAgentsForOrganization,

    // Cache management
    refreshCache,
    clearCache,

    // Loading states
    loading,

    // Cache sizes (for debugging)
    cacheSize: {
      organizations: organizations.size,
      projects: projects.size,
      agents: agents.size
    }
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};

export default DataCacheContext;
