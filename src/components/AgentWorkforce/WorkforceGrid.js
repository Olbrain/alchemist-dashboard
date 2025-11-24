/**
 * Workforce Grid Component
 * 
 * Displays AI agents as employee cards with comprehensive workforce metrics
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Skeleton,
  Grow,
  useTheme
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { workforceService } from '../../services/workforce/workforceService';
import { getAgentName, getAgentDescription, getAgentType, getAgentStatus, getStatusColor } from '../../utils/agentUtils';
import { CardTitle } from '../../utils/typography';

const WorkforceGrid = ({ 
  agents, 
  loading, 
  viewMode = 'grid',
  searchTerm = '',
  sortBy = 'name',
  statusFilter = 'all',
  showActions = true,
  maxItems = null,
  workforceData: externalWorkforceData = null,
  agentIdentities: externalAgentIdentities = null,
  deployments = [],
  agentServers = []
}) => {
  const navigate = useNavigate();
  const [agentIdentities, setAgentIdentities] = useState({});
  const [workforceData, setWorkforceData] = useState({});
  const [identitiesLoading, setIdentitiesLoading] = useState(true);
  
  // Add totalTasks to component scope
  const getTotalTasks = (agentId) => {
    const agentData = workforceData[agentId];
    return agentData?.conversations?.length || 0;
  // Helper function to check if agent is actually deployed
  const getAgentDeploymentStatus = (agentId) => {
    // Debug logging
    console.log(`Checking deployment status for agent ${agentId}`);
    console.log('Available agent servers:', agentServers);
    
    // Only check agent_servers collection (this is the most reliable)
    const agentServer = agentServers.find(server => server.id === agentId);
    console.log(`Found agent server for ${agentId}:`, agentServer);
    
    if (agentServer) {
      // Agent is deployed if it has a service_url and status is active
      const isDeployed = Boolean(agentServer.service_url && agentServer.status === 'active');
      console.log(`Agent server status for ${agentId}: ${agentServer.status}, service_url: ${agentServer.service_url}, isDeployed: ${isDeployed}`);
      return isDeployed;
    }
    
    // No fallbacks - if not in agent_servers, then not deployed
    console.log(`No agent server found for ${agentId}, not deployed`);
    return false;
  // Helper functions for real data processing
  const generateJobTitle = (agentId) => {
    const agentData = workforceData[agentId];
    if (!agentData) return 'AI Specialist';
    return workforceService.generateJobTitle(agentData);
  };
  
  
  const generateProfilePicture = (identity) => {
    if (!identity) return '#757575';
    const stage = identity.development_stage;
    const colors = {
      nascent: '#4CAF50',
      developing: '#2196F3', 
      mature: '#9C27B0',
      expert: '#FF9800'
    };
    return colors[stage] || '#757575';
  const getAgentProfilePicture = (agent) => {
    // Return the agent's profile picture URL if available
    return agent.profilePictureUrl || agent.profile_picture_url || null;
  };
  
  const calculateExperienceYears = (agentId) => {
    const agentData = workforceData[agentId];
    if (!agentData) return 0;
    const experience = workforceService.calculateExperience(agentData);
    return experience.years;
  };
  
  const calculateUsageCosts = (agentId) => {
    const agentData = workforceData[agentId];
    if (!agentData) return 0;
    const performance = workforceService.calculatePerformanceMetrics(agentData);
    const costs = workforceService.calculateUsageCosts(agentData, performance);
    return costs.totalCost;
  };
  
  const getPerformanceScore = (agentId) => {
    const agentData = workforceData[agentId];
    if (!agentData) return 0;
    const performance = workforceService.calculatePerformanceMetrics(agentData);
    return performance.successRate;
  // Load real workforce data
  useEffect(() => {
    // Use external data if provided, otherwise load our own
    if (externalWorkforceData && externalAgentIdentities) {
      setWorkforceData(externalWorkforceData);
      setAgentIdentities(externalAgentIdentities);
      setIdentitiesLoading(false);
      return;
    }

    const loadRealWorkforceData = async () => {
      if (agents.length === 0) {
        setIdentitiesLoading(false);
        return;
      }

      try {
        const identities = {};
        const workforceDataMap = {};
        
        for (const agent of agents) {
          try {
            // Get comprehensive workforce data for each agent
            const agentData = await workforceService.getAgentWorkforceData(agent.id, agent.owner_id || agent.userId);
            workforceDataMap[agent.id] = agentData;
            identities[agent.id] = agentData.identity;
          } catch (error) {
            console.warn(`Failed to load workforce data for agent ${agent.id}:`, error);
            // Don't set fallback data - let the error propagate
            throw error;
          }
        }
        
        setWorkforceData(workforceDataMap);
        setAgentIdentities(identities);
      } catch (error) {
        console.error('Error loading workforce data:', error);
      } finally {
        setIdentitiesLoading(false);
      }
      loadRealWorkforceData();
  }, [agents, externalWorkforceData, externalAgentIdentities]);

  // Filter and sort agents
  const filterAgents = () => {
    let filtered = agents;
    
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        getAgentName(agent).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAgentDescription(agent).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(agent => {
        const status = agent.status || 'draft';
        return status === statusFilter;
      });
    }
    
    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'performance':
          return getPerformanceScore(b.id) - getPerformanceScore(a.id);
        case 'costs':
          return calculateUsageCosts(b.id) - calculateUsageCosts(a.id);
        case 'experience':
          return parseFloat(calculateExperienceYears(b.id)) - parseFloat(calculateExperienceYears(a.id));
        default:
          return 0;
      }
    });
    
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }
    
    return filtered;

  const EmployeeCard = ({ agent, index }) => {
    const identity = agentIdentities[agent.id];
    const jobTitle = generateJobTitle(agent.id);
    const profileColor = generateProfilePicture(identity);
    const profilePictureUrl = getAgentProfilePicture(agent);
    
    // Check if agent is actually deployed using deployment records
    const isDeployed = getAgentDeploymentStatus(agent.id);
    const agentData = workforceData[agent.id];
    const hasConversations = agentData?.conversations?.length > 0;
    
    // Only calculate metrics for deployed agents with conversations
    const experience = isDeployed && hasConversations ? calculateExperienceYears(agent.id) : 0;
    const costs = isDeployed && hasConversations ? calculateUsageCosts(agent.id) : 0;
    const performance = isDeployed && hasConversations ? getPerformanceScore(agent.id) : 0;
    const totalTasks = isDeployed && hasConversations ? getTotalTasks(agent.id) : 0;
    
    if (viewMode === 'list') {
      return (
        <Card 
          sx={{ 
            mb: 1.5,
            border: 1,
            borderColor: isDeployed ? 'primary.light' : 'grey.200',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: 2,
              transform: 'translateY(-1px)'
            },
            cursor: 'pointer'
          }}
          onClick={() => navigate(`/agent-profile/${agent.id}`)}
        >
          <CardContent sx={{ py: 2.5, px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* Agent Avatar & Basic Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Avatar 
                  src={profilePictureUrl}
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: profilePictureUrl ? 'transparent' : (isDeployed ? profileColor : 'grey.300'),
                    border: 2,
                    borderColor: isDeployed ? 'primary.main' : 'grey.400',
                    opacity: isDeployed ? 1 : 0.7
                  }}
                >
                  {!profilePictureUrl && <SmartToyIcon sx={{ fontSize: '1.5rem' }} />}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <CardTitle
                    sx={{
                      mb: 0.5,
                      color: isDeployed ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {getAgentName(agent)}
                  </CardTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={getAgentStatus(agent)} 
                      size="small" 
                      variant={isDeployed ? 'filled' : 'outlined'}
                      color={getStatusColor(getAgentStatus(agent))}
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {jobTitle}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Metrics - Only show for deployed agents */}
              {isDeployed && hasConversations && (
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box sx={{ textAlign: 'center', minWidth: 70 }}>
                    <Typography variant="h6" fontWeight="600" color="primary.main">
                      {performance}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Success
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="h6" fontWeight="600" color="warning.main">
                      {costs.toFixed(1)} credits
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Usage Cost
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                    <Typography variant="h6" fontWeight="600">
                      {totalTasks}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tasks
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* Draft/Not Deployed State */}
              {!isDeployed && (
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Ready to deploy
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Grow in={true} timeout={300 + index * 50}>
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: 1,
            borderColor: isDeployed ? 'success.light' : 'grey.200',
            borderRadius: 3,
            borderLeft: 4,
            borderLeftColor: isDeployed ? 'success.main' : 'grey.400',
            transition: 'all 0.3s ease-in-out',
            cursor: 'pointer',
            '&:hover': {
              borderColor: isDeployed ? 'success.main' : 'primary.main',
              borderLeftColor: isDeployed ? 'success.dark' : 'grey.600',
              boxShadow: 6,
              transform: 'translateY(-4px)'
            },
            overflow: 'hidden',
            bgcolor: isDeployed ? 'success.50' : 'background.paper'
          }}
          onClick={() => navigate(`/agent-profile/${agent.id}`)}
        >
          {/* Status Header */}
          <Box 
            sx={{ 
              p: 2,
              bgcolor: isDeployed ? 'success.main' : 'grey.100',
              color: isDeployed ? 'white' : 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Chip 
              label={isDeployed ? 'ACTIVE' : (agent.status === 'draft' ? 'DRAFT' : 'INACTIVE')}
              size="small" 
              sx={{ 
                bgcolor: isDeployed ? 'success.dark' : 'grey.300',
                color: isDeployed ? 'white' : 'text.secondary',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: 24
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isDeployed ? (
                <CheckCircleIcon sx={{ fontSize: 18, color: 'white' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
              )}
            </Box>
          </Box>
          
          <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
            {/* Avatar */}
            <Box sx={{ mb: 3 }}>
              <Avatar
                src={profilePictureUrl}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: profilePictureUrl ? 'transparent' : (isDeployed ? profileColor : 'grey.300'),
                  mx: 'auto',
                  border: 4,
                  borderColor: isDeployed ? 'success.main' : 'grey.400',
                  boxShadow: isDeployed ? 4 : 2,
                  opacity: isDeployed ? 1 : 0.8,
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {!profilePictureUrl && <SmartToyIcon sx={{ fontSize: '2.2rem', color: isDeployed ? 'white' : 'text.secondary' }} />}
              </Avatar>
            </Box>
            
            {/* Agent Name */}
            <CardTitle
              sx={{
                mb: 1,
                color: isDeployed ? 'text.primary' : 'text.secondary',
                lineHeight: 1.2,
                fontSize: '1.1rem'
              }}
            >
              {getAgentName(agent)}
            </CardTitle>
            
            {/* Secondary Status */}
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 3,
                color: isDeployed ? 'success.main' : 'text.secondary',
                fontWeight: 'medium',
                fontSize: '0.875rem'
              }}
            >
              {isDeployed ? '🟢 Online' : (agent.status === 'draft' ? '⚪ Draft Mode' : '🔴 Offline')}
            </Typography>
            
            {/* Key Metrics for Deployed Agents */}
            {isDeployed && hasConversations ? (
              <Box 
                sx={{ 
                  mb: 2,
                  p: 2,
                  bgcolor: 'success.50',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'success.200'
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h6" fontWeight="700" color="success.dark">
                      {performance}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Success
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" fontWeight="700" color="primary.main">
                      {totalTasks}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Tasks
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" fontWeight="700" color="warning.main">
                      {costs >= 1000 ? `${(costs/1000).toFixed(1)}k` : costs.toFixed(1)} credits
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Usage
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  mb: 2, 
                  py: 2,
                  px: 3,
                  bgcolor: agent.status === 'draft' ? 'info.50' : 'grey.50',
                  borderRadius: 2,
                  border: 1,
                  borderColor: agent.status === 'draft' ? 'info.200' : 'grey.200'
                }}
              >
                <Typography 
                  variant="body2" 
                  color={agent.status === 'draft' ? 'info.main' : 'text.secondary'} 
                  sx={{ 
                    fontWeight: 'medium',
                    fontSize: '0.875rem'
                  }}
                >
                  {agent.status === 'draft' ? '⚡ Ready to configure' : (isDeployed ? '✅ Ready for tasks' : '🚀 Ready to deploy')}
                </Typography>
              </Box>
            )}
            
            {/* Job Title */}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                fontStyle: 'italic',
                opacity: 0.8
              }}
            >
              {jobTitle}
            </Typography>
          </CardContent>
        </Card>
      </Grow>
    );
  const filteredAgents = filterAgents();

  if (loading || identitiesLoading) {
    return (
      <Grid container spacing={viewMode === 'grid' ? 3 : 1}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} key={index}>
            <Skeleton variant="rectangular" height={viewMode === 'grid' ? 350 : 80} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <>
      {filteredAgents.length > 0 ? (
        viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {filteredAgents.map((agent, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                <EmployeeCard agent={agent} index={index} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box>
            {filteredAgents.map((agent, index) => (
              <EmployeeCard key={agent.id} agent={agent} index={index} />
            ))}
          </Box>
        )
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <GroupIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {agents.length === 0 ? 'No employees yet' : 'No employees match your filters'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {agents.length === 0 
              ? 'Start building your AI workforce by hiring your first agent'
              : 'Try adjusting your search or filter criteria'
            }
          </Typography>
        </Box>
      )}
    </>
  );
};

export default WorkforceGrid;