/**
 * Project List Page
 * 
 * Browse, search, filter, and manage organization projects
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  SmartToy as SmartToyIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';
// import * as organizationService from '../services/organizations/organizationService'; // REMOVED: Organization service deleted
import * as projectService from '../services/projects/projectService';
// import { getUserProfile } from '../services/users/userProfileService'; // REMOVED: User profile service deleted
import { db } from '../utils/firebase';
// import { collection, query, where, getDocs, limit } from 'firebase/firestore'; // REMOVED: Firebase/Firestore
import { Collections } from '../constants/collections';
import PageLayout from '../components/shared/PageLayout';
import ProjectSidebar from '../components/shared/ProjectSidebar';
import { PageTitle, PageDescription, CardTitle, HelperText, EmptyStateText } from '../utils/typography';

const ProjectList = () => {
  const navigate = useNavigate();
  const { currentUser, currentOrganization, hasRoleOrHigher } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Team resources state
  const [activeTab, setActiveTab] = useState(0); // 0 = My Projects, 1 = Team Projects, 2 = Team Agents
  const [teamMembers, setTeamMembers] = useState({}); // Map of user_id -> user profile
  const [teamProjects, setTeamProjects] = useState([]);
  const [teamAgents, setTeamAgents] = useState([]);
  
  // Dialog states
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  
  // Form data for creating projects
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    priority: 'medium',
    team_members: [],
    tags: [],
    goals: []
  });

  // Project status configuration
  const projectStatuses = [
    { value: 'active', label: 'Active', color: 'success', icon: <PlayArrowIcon /> },
    { value: 'inactive', label: 'Inactive', color: 'default', icon: <PauseIcon /> },
    { value: 'archived', label: 'Archived', color: 'default', icon: <ArchiveIcon /> }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'critical', label: 'Critical', color: 'error' }
  ];

  // Debug function to inspect agent structure
  const debugAgentStructure = async () => {
    try {
      console.log('=== INSPECTING ALL AGENTS IN ORGANIZATION ===');
      const agentsRef = collection(db, Collections.AGENTS);
      const orgAgentsQuery = query(
        agentsRef,
        where('organization_id', '==', currentOrganization.organization_id),
        limit(5) // Limit to first 5 for debugging
      );
      
      const snapshot = await getDocs(orgAgentsQuery);
      console.log(`Found ${snapshot.size} agents in organization`);
      
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Agent ${index + 1} structure:`, {
          documentId: doc.id,
          hasProjectId: 'project_id' in data,
          projectIdValue: data.project_id,
          organizationId: data.organization_id,
          ownerIdValue: data.owner_id,
          agentName: data.name || data.basic_info?.name || 'Unnamed',
          allTopLevelFields: Object.keys(data),
          basicInfoFields: data.basic_info ? Object.keys(data.basic_info) : 'No basic_info',
          fullDocument: data
        });
      });
    } catch (error) {
      console.error('Error inspecting agents:', error);
    }
  };

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!currentOrganization?.organization_id) return;

      try {
        // const members = await organizationService.getOrganizationMembers(currentOrganization.organization_id); // REMOVED: Organization service deleted
        const members = []; // TODO: Replace with appropriate member fetching logic if needed
        const membersMap = {};

        for (const member of members) {
          try {
            const profile = await getUserProfile(member.user_id);
            membersMap[member.user_id] = {
              name: profile?.basic_info?.display_name || profile?.basic_info?.email || member.email || 'Unknown User',
              email: profile?.basic_info?.email || member.email,
              avatar: profile?.basic_info?.profile_picture_url
            };
          } catch (profileError) {
            console.warn(`Could not load profile for user ${member.user_id}:`, profileError);
            membersMap[member.user_id] = {
              name: member.email || member.name || 'Unknown User',
              email: member.email,
              avatar: null
            };
          }
        }

        setTeamMembers(membersMap);
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    };

    loadTeamMembers();
  }, [currentOrganization]);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!currentOrganization?.organization_id) {
        setError('No organization selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Debug: Inspect agent structure
        await debugAgentStructure();
        
        // Load real projects from Firestore
        const organizationProjects = await projectService.getOrganizationProjects(
          currentOrganization.organization_id
        );
        
        // Transform projects for UI compatibility (schema-aligned)
        const transformedProjects = await Promise.all(organizationProjects.map(async project => {
          const basicInfo = project.project_info || {};
          const teamAccess = project.team_access || {};
          
          // Get actual agent count for this project
          let agentCount = 0;
          try {
            const projectAgents = await projectService.getProjectAgents(project.id);
            agentCount = projectAgents.length;
            console.log(`Project ${project.id} has ${agentCount} agents:`, projectAgents.map(a => ({ id: a.id, name: a.name })));
          } catch (error) {
            console.error(`Error getting agents for project ${project.id}:`, error);
          }
          
          return {
            id: project.id,
            name: basicInfo.name || 'Untitled Project',
            description: basicInfo.description || '',
            status: basicInfo.status || 'active',
            priority: basicInfo.priority || 'medium',
            created_at: project.created_at?.toDate?.() || new Date(project.created_at) || new Date(),
            // Team members = owner + collaborators (schema-aligned)
            team_members: teamAccess.owner_id ? [teamAccess.owner_id, ...(teamAccess.collaborators || [])] : (teamAccess.collaborators || []),
            assigned_agents: Array(agentCount).fill(null), // Use actual count
            tags: [], // TODO: Implement via separate collection if needed
            goals: [], // TODO: Implement via separate collection if needed
            created_by: project.created_by || currentUser.uid
          };
        }));
        
        setProjects(transformedProjects);
        setError(null);
        
        // Auto-open create dialog if no projects exist (helps with agent creation flow)
        if (organizationProjects.length === 0) {
          setCreateProjectDialogOpen(true);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [currentOrganization, currentUser]);

  // Filter projects into my vs team projects
  useEffect(() => {
    if (!currentUser?.uid || !projects.length) {
      setTeamProjects([]);
      return;
    }

    // Separate projects into "mine" vs "team"
    const otherProjects = projects.filter(p => {
      const isOwner = p.created_by === currentUser.uid;
      const isCollaborator = p.team_members && p.team_members.includes(currentUser.uid);
      return !isOwner && !isCollaborator;
    });

    setTeamProjects(otherProjects);
  }, [projects, currentUser]);

  // Load team agents
  useEffect(() => {
    const loadTeamAgents = async () => {
      if (!currentOrganization?.organization_id || !currentUser?.uid) {
        setTeamAgents([]);
        return;
      }

      try {
        const agentsQuery = query(
          collection(db, Collections.AGENTS),
          where('organization_id', '==', currentOrganization.organization_id),
          where('lifecycle_state', '==', 'active')
        );

        const snapshot = await getDocs(agentsQuery);
        const allAgents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter out my agents
        const otherAgents = allAgents.filter(agent =>
          agent.owner_id !== currentUser.uid && agent.created_by !== currentUser.uid
        );

        setTeamAgents(otherAgents);
      } catch (error) {
        console.error('Error loading team agents:', error);
        setTeamAgents([]);
      }
    };

    loadTeamAgents();
  }, [currentOrganization, currentUser]);

  // Filter and sort projects
  useEffect(() => {
    let filtered = projects;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_date':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });
    
    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, priorityFilter, sortBy]);

  // Get status info
  const getStatusInfo = (status) => {
    return projectStatuses.find(s => s.value === status) || projectStatuses[0];
  };

  // Get priority info
  const getPriorityInfo = (priority) => {
    return priorityLevels.find(p => p.value === priority) || priorityLevels[1];
  };

  // Create project
  const handleCreateProject = async () => {
    if (!hasRoleOrHigher('editor') || !projectForm.name) {
      return;
    }

    try {
      const projectData = {
        name: projectForm.name,
        description: projectForm.description,
        priority: projectForm.priority,
        tags: projectForm.tags,
        goals: projectForm.goals.map((goal, index) => ({ id: index + 1, text: goal, completed: false }))
      };

      // Create project using real service
      const newProject = await projectService.createProject(
        currentOrganization.organization_id,
        projectData
      );
      
      // Transform for UI compatibility (schema-aligned)
      const teamAccess = newProject.team_access || {};
      const transformedProject = {
        id: newProject.id,
        name: newProject.project_info?.name || projectData.name,
        description: newProject.project_info?.description || projectData.description,
        status: newProject.project_info?.status || 'active',
        priority: newProject.project_info?.priority || projectData.priority,
        created_at: newProject.created_at?.toDate?.() || new Date(),
        // Team members = owner + collaborators (schema-aligned)
        team_members: teamAccess.owner_id ? [teamAccess.owner_id, ...(teamAccess.collaborators || [])] : (teamAccess.collaborators || []),
        assigned_agents: [], // TODO: Implement via separate collection
        tags: [], // TODO: Implement via separate collection if needed
        goals: [], // TODO: Implement via separate collection if needed
        created_by: newProject.created_by
      };
      
      setProjects(prev => [transformedProject, ...prev]);
      setSuccessMessage('Project created successfully');
      setCreateProjectDialogOpen(false);
      setProjectForm({
        name: '',
        description: '',
        priority: 'medium',
        team_members: [],
        tags: [],
        goals: []
      });
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!hasRoleOrHigher('admin') || !selectedProject) {
      return;
    }

    try {
      // Delete project using real service
      await projectService.deleteProject(selectedProject.id);
      
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
      setSuccessMessage('Project deleted successfully');
      setDeleteProjectDialogOpen(false);
      setSelectedProject(null);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  // Project Card Component
  const ProjectCard = ({ project, showOwner = false }) => {
    const statusInfo = getStatusInfo(project.status);
    const priorityInfo = getPriorityInfo(project.priority);
    const owner = teamMembers[project.created_by];

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme => theme.shadows[8],
            borderColor: 'primary.main',
            '& .project-actions': {
              opacity: 1
            }
          },
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Owner info (for team projects) */}
          {showOwner && owner && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Avatar
                src={owner.avatar}
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              >
                {owner.name?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                Created by {owner.name}
              </Typography>
            </Box>
          )}

          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <CardTitle gutterBottom>
                {project.name}
              </CardTitle>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {project.description}
              </Typography>
            </Box>
            {!showOwner && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX - 150 // Position to the left of button
                  });
                  setSelectedProject(project);
                  setDropdownOpen(true);
                }}
                className="project-actions"
                sx={{
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>
          
          {/* Status and Priority */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.label}
              size="small"
              color={statusInfo.color}
              variant="outlined"
            />
            <Chip
              label={priorityInfo.label}
              size="small"
              color={priorityInfo.color}
              variant="filled"
            />
          </Box>
          
          {/* Status */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={projectStatuses.find(s => s.value === project.status)?.label || 'Active'}
                color={projectStatuses.find(s => s.value === project.status)?.color || 'success'}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          
          {/* Team and Agents */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon fontSize="small" color="action" />
              <Typography variant="caption">
                {project.team_members.length} members
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon fontSize="small" color="action" />
              <Typography variant="caption">
                {project.assigned_agents.length > 0 
                  ? `${project.assigned_agents.length} agents`
                  : 'No agents yet'
                }
              </Typography>
            </Box>
          </Box>
          
          
          {/* Tags */}
          {project.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {project.tags.slice(0, 3).map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {project.tags.length > 3 && (
                <Chip
                  label={`+${project.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Agent Card Component (for team agents)
  const AgentCard = ({ agent }) => {
    const owner = teamMembers[agent.owner_id || agent.created_by];

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme => theme.shadows[8],
            borderColor: 'primary.main'
          }
        }}
        onClick={() => navigate(`/agent-profile/${agent.id}`)}
      >
        <CardContent>
          {/* Owner info */}
          {owner && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Avatar
                src={owner.avatar}
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              >
                {owner.name?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                Created by {owner.name}
              </Typography>
            </Box>
          )}

          {/* Agent name and description */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <SmartToyIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <CardTitle gutterBottom>
                {agent.name || agent.basic_info?.name || 'Unnamed Agent'}
              </CardTitle>
              <Typography variant="body2" color="text.secondary" noWrap>
                {agent.description || agent.basic_info?.description || 'No description'}
              </Typography>
            </Box>
          </Box>

          {/* Stage and status */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={agent.development_stage || 'draft'}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={agent.lifecycle_state || 'active'}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageLayout
      leftPanel={
        <ProjectSidebar 
          projects={projects}
          onCreateProject={() => setCreateProjectDialogOpen(true)}
        />
      }
    >
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        {/* Header with Tabs */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <PageTitle component="h1" gutterBottom>
                {activeTab === 0 ? 'My Projects' : activeTab === 1 ? 'Team Projects' : 'Team Agents'}
              </PageTitle>
              <PageDescription>
                {activeTab === 0
                  ? 'Projects you own or collaborate on'
                  : activeTab === 1
                  ? 'Projects owned by other team members'
                  : 'Agents created by other team members'
                }
              </PageDescription>
            </Box>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateProjectDialogOpen(true)}
                disabled={!hasRoleOrHigher('editor')}
                sx={{ px: 3, py: 1.5 }}
              >
                New Project
              </Button>
            )}
          </Box>

          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label={`My Projects (${filteredProjects.length})`} />
            <Tab label={`Team Projects (${teamProjects.length})`} />
            <Tab label={`Team Agents (${teamAgents.length})`} />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {successMessage}
            </Alert>
          )}
        </Box>

        {/* Filters and Controls (only for My Projects) */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search projects by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                {projectStatuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                <MenuItem value="all">All Priority</MenuItem>
                {priorityLevels.map(priority => (
                  <MenuItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={6} sm={3} md={4}>
              <TextField
                fullWidth
                select
                size="small"
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                <MenuItem value="created_date">Created Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="progress">Progress</MenuItem>
              </TextField>
            </Grid>
            
          </Grid>
          </Paper>
        )}

        {/* Content based on active tab */}
        {/* My Projects Tab */}
        {activeTab === 0 && filteredProjects.length > 0 && (
          <Grid container spacing={3}>
            {filteredProjects.map((project) => (
              <Grid
                item
                xs={12}
                key={project.id}
              >
                <ProjectCard project={project} showOwner={false} />
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 0 && filteredProjects.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 2, bgcolor: 'background.paper' }}>
            <AssignmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
            <EmptyStateText gutterBottom>
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </EmptyStateText>
            <PageDescription sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {projects.length === 0
                ? 'Create your first project to organize and manage your AI agent initiatives across teams and goals.'
                : 'Try adjusting your search terms or filter criteria to find the projects you\'re looking for.'
              }
            </PageDescription>
            {projects.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateProjectDialogOpen(true)}
                disabled={!hasRoleOrHigher('editor')}
                sx={{ px: 4, py: 1.5 }}
              >
                Create First Project
              </Button>
            )}
          </Paper>
        )}

        {/* Team Projects Tab */}
        {activeTab === 1 && teamProjects.length > 0 && (
          <Grid container spacing={3}>
            {teamProjects.map((project) => (
              <Grid
                item
                xs={12}
                key={project.id}
              >
                <ProjectCard project={project} showOwner={true} />
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 1 && teamProjects.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 2, bgcolor: 'background.paper' }}>
            <AssignmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
            <EmptyStateText gutterBottom>
              No team projects yet
            </EmptyStateText>
            <PageDescription sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Projects created by other team members will appear here. You'll have view-only access to explore their work.
            </PageDescription>
          </Paper>
        )}

        {/* Team Agents Tab */}
        {activeTab === 2 && teamAgents.length > 0 && (
          <Grid container spacing={3}>
            {teamAgents.map((agent) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={agent.id}
              >
                <AgentCard agent={agent} />
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 2 && teamAgents.length === 0 && (
          <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 2, bgcolor: 'background.paper' }}>
            <SmartToyIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
            <EmptyStateText gutterBottom>
              No team agents yet
            </EmptyStateText>
            <PageDescription sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Agents created by other team members will appear here. Click on any agent to view its profile and details.
            </PageDescription>
          </Paper>
        )}

        {/* Floating Action Button for Mobile - Only on My Projects tab */}
        {activeTab === 0 && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: { xs: 'flex', sm: 'none' }
            }}
            onClick={() => setCreateProjectDialogOpen(true)}
            disabled={!hasRoleOrHigher('editor')}
          >
            <AddIcon />
          </Fab>
        )}

      {/* Custom Actions Dropdown */}
      {dropdownOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <Paper
            sx={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 1001,
              minWidth: 160,
              boxShadow: 3,
              borderRadius: 1,
              py: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => {
                navigate(`/projects/${selectedProject?.id}`);
                setDropdownOpen(false);
              }}
            >
              <VisibilityIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">View Details</Typography>
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: hasRoleOrHigher('editor') ? 'pointer' : 'not-allowed',
                opacity: hasRoleOrHigher('editor') ? 1 : 0.5,
                '&:hover': hasRoleOrHigher('editor') ? {
                  bgcolor: 'action.hover',
                } : {},
              }}
              onClick={() => {
                if (hasRoleOrHigher('editor')) {
                  navigate(`/projects/${selectedProject?.id}/edit`);
                  setDropdownOpen(false);
                }
              }}
            >
              <EditIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2">Edit Project</Typography>
            </Box>
            
            <Divider />
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                cursor: hasRoleOrHigher('admin') ? 'pointer' : 'not-allowed',
                color: hasRoleOrHigher('admin') ? 'error.main' : 'text.disabled',
                opacity: hasRoleOrHigher('admin') ? 1 : 0.5,
                '&:hover': hasRoleOrHigher('admin') ? {
                  bgcolor: 'action.hover',
                } : {},
              }}
              onClick={() => {
                if (hasRoleOrHigher('admin')) {
                  setDeleteProjectDialogOpen(true);
                  setDropdownOpen(false);
                }
              }}
            >
              <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2" color="inherit">Delete Project</Typography>
            </Box>
          </Paper>
        </>
      )}

      {/* Create Project Dialog */}
      <Dialog 
        open={createProjectDialogOpen} 
        onClose={() => setCreateProjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={projectForm.priority}
                onChange={(e) => setProjectForm({...projectForm, priority: e.target.value})}
              >
                {priorityLevels.map(priority => (
                  <MenuItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProjectDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateProject}
            disabled={!projectForm.name || !hasRoleOrHigher('editor')}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog 
        open={deleteProjectDialogOpen} 
        onClose={() => setDeleteProjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All project data will be permanently deleted.
          </Alert>
          
          {selectedProject && (
            <Typography variant="body1">
              Are you sure you want to delete the project{' '}
              <strong>"{selectedProject.name}"</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProjectDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteProject}
            disabled={!hasRoleOrHigher('admin')}
          >
            Delete Project
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </PageLayout>
  );
};

export default ProjectList;