/**
 * Main Container - Single Page Application Container
 *
 * Contains all main application content with tab-based navigation
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box
} from '@mui/material';
import { useAuth } from '../utils/AuthContext';
import { useSelectedAgent } from '../contexts/SelectedAgentContext';
import PageLayout from '../components/shared/PageLayout';
import CreateAgentDialog from '../components/shared/CreateAgentDialog';

// Import content components
import DashboardContent from '../components/content/DashboardContent';
import ApiDocsContent from '../components/content/ApiDocsContent';
import UsageAnalyticsContent from '../components/content/UsageAnalyticsContent';
import ProjectAnalyticsContent from '../components/content/ProjectAnalyticsContent';
// import ProjectMembershipContent from '../components/content/ProjectMembershipContent'; // REMOVED: One project per user

const MainContainer = ({ hideSidebar = false }) => {
  const location = useLocation();
  const {
    currentProject: _currentProject // eslint-disable-line no-unused-vars
  } = useAuth();
  const { selectedAgentId: _selectedAgentId, setSelectedAgentId } = useSelectedAgent(); // eslint-disable-line no-unused-vars

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null); // eslint-disable-line no-unused-vars
  const [createAgentDialogOpen, setCreateAgentDialogOpen] = useState(false);

  // Track if we're in /project/:projectId URL context
  const [isProjectUrlContext, setIsProjectUrlContext] = useState(false);
  const [projectUrlId, setProjectUrlId] = useState(null);

  // Parse URL to determine active tab
  useEffect(() => {
    const path = location.pathname;

    // Check if we're in /:projectId URL context
    // Project IDs are typically Firebase IDs (alphanumeric strings)
    // We need to distinguish from routes like /login, /onboarding, etc.
    const pathParts = path.substring(1).split('/'); // Remove leading '/'
    const firstSegment = pathParts[0];

    // Check if first segment looks like a project ID (not a known route)
    const knownRoutes = ['login', 'signup', 'forgot-password', 'onboarding', 'invitation'];
    const isProjectId = firstSegment && !knownRoutes.includes(firstSegment) && firstSegment.length > 10;

    if (isProjectId) {
      const projectId = firstSegment;
      setIsProjectUrlContext(true);
      setProjectUrlId(projectId);

      // Determine active tab from the rest of the path
      // If path is exactly /:projectId (no second segment), show dashboard
      if (pathParts.length === 1 || !pathParts[1]) {
        setActiveTab('dashboard');
      } else {
        // Map the URL segment to the tab name
        setActiveTab(pathParts[1]);
      }
    } else if (path.includes('/api-docs')) {
      setActiveTab('api-docs');
      setSelectedProjectId(null);
    } else if (path.includes('/usage-analytics')) {
      setActiveTab('usage-analytics');
      setSelectedProjectId(null);
    } else if (path.includes('/project-analytics')) {
      setActiveTab('project-analytics');
      setSelectedProjectId(null);
    // REMOVED: project-membership - one project per user
    // } else if (path.includes('/project-membership')) {
    //   setActiveTab('project-membership');
      setSelectedProjectId(null);
    } else if (path.includes('/api-key-management')) {
      setActiveTab('api-key-management');
      setSelectedProjectId(null);
    } else if (path.includes('/agent-testing')) {
      setActiveTab('agent-testing');
      setSelectedProjectId(null);
    } else if (path.includes('/agent-editor')) {
      setActiveTab('agent-editor');
      setSelectedProjectId(null);
    } else if (path.includes('/prompt-builder')) {
      // Prompt builder view - extract agentId if present
      const pathParts = path.split('/prompt-builder/');
      if (pathParts.length > 1 && pathParts[1]) {
        const agentId = pathParts[1];
        setSelectedAgentId(agentId);
      }
      setActiveTab('prompt-builder');
      setSelectedProjectId(null);
    } else if (path.includes('/knowledge-base')) {
      setActiveTab('knowledge-base');
      setSelectedProjectId(null);
    } else if (path.includes('/agent-documents')) {
      setActiveTab('agent-documents');
      setSelectedProjectId(null);
    } else if (path.includes('/api-integrations')) {
      setActiveTab('api-integrations');
      setSelectedProjectId(null);
    } else if (path.includes('/agent-deployment')) {
      setActiveTab('agent-deployment');
      setSelectedProjectId(null);
    } else if (path.includes('/agent-publish')) {
      setActiveTab('agent-publish');
      setSelectedProjectId(null);
    } else if (path.includes('/whatsapp-integration')) {
      setActiveTab('whatsapp-integration');
      setSelectedProjectId(null);
    } else if (path.includes('/organization')) {
      setActiveTab('organization');
      setSelectedProjectId(null);
    } else {
      setActiveTab('dashboard');
      setSelectedProjectId(null);
    }
  }, [location.pathname, setSelectedAgentId]);

  // Handle tab change
  // Helper function to get URL with project prefix if in project context
  const getUrlForTab = (tab, projectId = null, agentId = null) => {
    const baseUrl = isProjectUrlContext && projectUrlId
      ? `/${projectUrlId}`
      : '';

    // Standard tab URLs
    const tabUrls = {
      'dashboard': '',  // No /dashboard suffix - just /:projectId
      // 'project-membership': '/project-membership', // REMOVED: One project per user
      'api-docs': '/api-docs',
      'usage-analytics': '/usage-analytics',
      'project-analytics': '/project-analytics',
      'api-key-management': '/api-key-management',
      'agent-testing': '/agent-testing',
      'agent-editor': '/agent-editor',
      'prompt-builder': '/prompt-builder',
      'knowledge-base': '/knowledge-base',
      'agent-documents': '/agent-documents',
      'api-integrations': '/api-integrations',
      'agent-deployment': '/agent-deployment',
      'agent-publish': '/agent-publish',
      'whatsapp-integration': '/whatsapp-integration'
    };

    return `${baseUrl}${tabUrls[tab] || ''}`;
  };

  // eslint-disable-next-line no-unused-vars
  const handleTabChange = (tab, projectId = null, agentId = null, organizationId = null) => {
    setActiveTab(tab);
    setSelectedProjectId(projectId);
    // Only update agentId if explicitly provided (preserve global agent selection)
    if (agentId !== null && agentId !== undefined) {
      setSelectedAgentId(agentId);
    }
    // Update URL without page reload - preserve project prefix if in project context
    const newUrl = getUrlForTab(tab, projectId, agentId);
    window.history.pushState({}, '', newUrl);
  };

  // Handle project creation
  // eslint-disable-next-line no-unused-vars
  const handleCreateProject = () => {
    // This will be handled by the DashboardContent component
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      const baseUrl = isProjectUrlContext && projectUrlId ? `/${projectUrlId}` : '/';
      window.history.pushState({}, '', baseUrl);
    }
    // Trigger create project modal in DashboardContent
    setActiveTab('dashboard-create-project');
    setTimeout(() => setActiveTab('dashboard'), 100);
  };

  // Handle agent creation
  const handleCreateAgent = () => {
    setCreateAgentDialogOpen(true);
  };

  // Handle global agent selection from sidebar
  // eslint-disable-next-line no-unused-vars
  const handleAgentSelect = (agentId) => {
    setSelectedAgentId(agentId);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'dashboard-create-project':
        return (
          <DashboardContent
            onCreateAgent={handleCreateAgent}
          />
        );

      case 'api-docs':
        return <ApiDocsContent />;

      case 'usage-analytics':
        return <UsageAnalyticsContent />;

      case 'project-analytics':
        return <ProjectAnalyticsContent />;

      // REMOVED: project-membership - one project per user
      // case 'project-membership':
      //   return <ProjectMembershipContent />;

      default:
        return (
          <DashboardContent
            onCreateAgent={handleCreateAgent}
          />
        );
    }
  };

  return (
    <>
      <PageLayout
        leftPanel={null}
        leftPanelWidth={0}
      >
        <Box sx={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {renderContent()}
        </Box>
      </PageLayout>

      {/* Create Agent Dialog */}
      <CreateAgentDialog
        open={createAgentDialogOpen}
        onClose={() => setCreateAgentDialogOpen(false)}
      />
    </>
  );
};

export default MainContainer;