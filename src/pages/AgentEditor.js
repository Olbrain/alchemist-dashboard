/**
 * Agent Editor - Standalone Full-Featured Agent Editor
 *
 * Provides comprehensive agent editing with all sections:
 * - Build: Prompt Builder, Knowledge Base, Documents, Agent Tools
 * - Deploy: Agent Deployment
 * - Test: Agent Testing
 * - Publish: Agent Publish, API Key Management
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Collapse,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Create as CreateIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Extension as ExtensionIcon,
  RocketLaunch as RocketLaunchIcon,
  Cloud as CloudIcon,
  BugReport as BugReportIcon,
  Publish as PublishIcon,
  VpnKey as VpnKeyIcon,
  BarChart as BarChartIcon,
  Chat as ChatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Import content components
import AgentPromptBuilderContent from '../components/content/AgentPromptBuilderContent';
import KnowledgeBaseContent from '../components/content/KnowledgeBaseContent';
import AgentDocumentsContent from '../components/content/AgentDocumentsContent';
import ApiIntegrationsContent from '../components/content/ApiIntegrationsContent';
import AgentDeploymentContent from '../components/content/AgentDeploymentContent';
import McpDeploymentContent from '../components/AgentEditor/Deployment/McpDeploymentContent';
import AgentTestingContent from '../components/content/AgentTestingContent';
import AgentPublishContent from '../components/content/AgentPublishContent';
import ApiKeyManagementContent from '../components/content/ApiKeyManagementContent';
import AgentAnalyticsContent from '../components/content/AgentAnalyticsContent';
import AgentConversationsContent from '../components/content/AgentConversationsContent';
import WhatsAppIntegrationContent from '../components/content/WhatsAppIntegrationContent';
import TiledeskIntegrationContent from '../components/content/TiledeskIntegrationContent';

// Import agent service
import { getAgent } from '../services/agents/agentService';
import { CardTitle } from '../utils/typography';

// Import integration logos
import whatsappLogo from '../assets/img/integrations/whatsapp-logo.svg';
import tiledeskLogo from '../assets/img/integrations/tiledesk-logo.png';

const AgentEditor = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { agentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sidebar groups configuration
  const sidebarGroups = [
    {
      title: 'Build',
      items: [
        { tab: 'prompt-builder', label: 'Prompt Builder', icon: CreateIcon },
        { tab: 'knowledge-base', label: 'Knowledge Base', icon: FolderIcon },
        { tab: 'agent-documents', label: 'Documents', icon: DescriptionIcon },
        { tab: 'api-integrations', label: 'Agent Tools', icon: ExtensionIcon }
      ]
    },
    {
      title: 'Deploy',
      items: [
        { tab: 'mcp-deployment', label: 'MCP Deployment', icon: CloudIcon },
        { tab: 'agent-deployment', label: 'Agent Deployment', icon: RocketLaunchIcon }
      ]
    },
    {
      title: 'Test',
      items: [
        { tab: 'agent-testing', label: 'Agent Testing', icon: BugReportIcon }
      ]
    },
    {
      title: 'Publish',
      items: [
        { tab: 'agent-publish', label: 'Agent Publish', icon: PublishIcon },
        { tab: 'api-key-management', label: 'API Keys', icon: VpnKeyIcon }
      ]
    },
    {
      title: 'Channels',
      items: [
        {
          tab: 'whatsapp-integration',
          label: 'WhatsApp',
          icon: whatsappLogo,
          isImageIcon: true
        },
        {
          tab: 'tiledesk-integration',
          label: 'Tiledesk',
          icon: tiledeskLogo,
          isImageIcon: true
        }
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { tab: 'agent-analytics', label: 'Analytics', icon: BarChartIcon },
        { tab: 'agent-conversations', label: 'Conversations', icon: ChatIcon }
      ]
    }
  ];

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'prompt-builder');
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('agent-editor-expanded-sections');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all sections exist in saved state
      return sidebarGroups.reduce((acc, group) => {
        acc[group.title] = parsed[group.title] ?? false;
        return acc;
      }, {});
    }

    // Default: only Build section expanded
    return sidebarGroups.reduce((acc, group, index) => {
      acc[group.title] = index === 0; // First section (Build) expanded
      return acc;
    }, {});
  });

  // Load agent data
  useEffect(() => {
    const loadAgent = async () => {
      try {
        setLoading(true);
        const agentData = await getAgent(agentId);
        setAgent(agentData);
      } catch (error) {
        console.error('Error loading agent:', error);
        setAgent(null);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  // Persist expanded sections to localStorage
  useEffect(() => {
    localStorage.setItem('agent-editor-expanded-sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, setSearchParams]);

  // Auto-expand section on initial mount based on URL parameter
  useEffect(() => {
    if (activeTab) {
      const sectionWithTab = sidebarGroups.find(group =>
        group.items.some(item => item.tab === activeTab)
      );

      if (sectionWithTab && !expandedSections[sectionWithTab.title]) {
        setExpandedSections(prev => ({
          ...Object.keys(prev).reduce((acc, key) => {
            acc[key] = key === sectionWithTab.title;
            return acc;
          }, {})
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Handle section expansion toggle (accordion behavior)
  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => {
      // If clicking already expanded section, collapse it
      if (prev[sectionTitle]) {
        return {
          ...prev,
          [sectionTitle]: false
        };
      }

      // Otherwise, collapse all and expand only the clicked section
      const allCollapsed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      return {
        ...allCollapsed,
        [sectionTitle]: true
      };
    });
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Auto-expand the section containing this tab (accordion behavior)
    const sectionWithTab = sidebarGroups.find(group =>
      group.items.some(item => item.tab === tab)
    );

    if (sectionWithTab && !expandedSections[sectionWithTab.title]) {
      setExpandedSections(prev => {
        // Collapse all sections
        const allCollapsed = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});

        // Expand the section containing the tab
        return {
          ...allCollapsed,
          [sectionWithTab.title]: true
        };
      });
    }
  };

  // Handle back navigation
  const handleBackClick = () => {
    // Navigate back to the dashboard (always at root path in embedded mode)
    navigate('/');
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'prompt-builder':
        return <AgentPromptBuilderContent agentId={agentId} />;
      case 'knowledge-base':
        return <KnowledgeBaseContent agentId={agentId} />;
      case 'agent-documents':
        return <AgentDocumentsContent agentId={agentId} />;
      case 'api-integrations':
        return <ApiIntegrationsContent agentId={agentId} />;
      case 'agent-deployment':
        return <AgentDeploymentContent agentId={agentId} />;
      case 'mcp-deployment':
        return <McpDeploymentContent agentId={agentId} />;
      case 'agent-testing':
        return <AgentTestingContent agentId={agentId} />;
      case 'agent-publish':
        return <AgentPublishContent agentId={agentId} onTabChange={handleTabChange} />;
      case 'api-key-management':
        return <ApiKeyManagementContent agentId={agentId} />;
      case 'whatsapp-integration':
        return <WhatsAppIntegrationContent agentId={agentId} />;
      case 'tiledesk-integration':
        return <TiledeskIntegrationContent agentId={agentId} />;
      case 'agent-analytics':
        return <AgentAnalyticsContent agentId={agentId} />;
      case 'agent-conversations':
        return <AgentConversationsContent agentId={agentId} />;
      default:
        return <AgentPromptBuilderContent agentId={agentId} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const agentName = agent?.basic_info?.name || agent?.name || 'Untitled Agent';

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <Paper
        sx={{
          width: 280,
          borderRadius: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        elevation={0}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton
              size="small"
              onClick={handleBackClick}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <CardTitle noWrap sx={{ flex: 1 }}>
              Agent Editor
            </CardTitle>
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap>
            {agentName}
          </Typography>
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List sx={{ py: 0 }}>
            {sidebarGroups.map((group, groupIndex) => (
              <React.Fragment key={group.title}>
                {groupIndex > 0 && <Divider />}

                {/* Group Header */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => toggleSection(group.title)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }}
                  >
                    <ListItemText
                      primary={group.title}
                      primaryTypographyProps={{
                        variant: 'subtitle2',
                        fontWeight: 600,
                        color: 'text.secondary'
                      }}
                    />
                    {expandedSections[group.title] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>
                </ListItem>

                {/* Group Items */}
                <Collapse in={expandedSections[group.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.items.map((item) => {
                      const isActive = activeTab === item.tab;

                      return (
                        <ListItem key={item.tab} disablePadding>
                          <ListItemButton
                            selected={isActive}
                            onClick={() => handleTabChange(item.tab)}
                            sx={{
                              py: 1.25,
                              pl: 4,
                              pr: 2,
                              '&.Mui-selected': {
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                                }
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {item.isImageIcon ? (
                                <Box
                                  component="img"
                                  src={item.icon}
                                  alt={item.label}
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    objectFit: 'contain',
                                    opacity: isActive ? 1 : 0.7,
                                    ...(item.icon.endsWith('.png') && { borderRadius: '3px' })
                                  }}
                                />
                              ) : (
                                <item.icon
                                  sx={{
                                    fontSize: 20,
                                    color: isActive ? theme.palette.primary.main : 'text.secondary'
                                  }}
                                />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? 'primary.main' : 'text.primary'
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AgentEditor;
