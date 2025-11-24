/**
 * Agent Configuration Form
 * 
 * Form component for configuring basic agent settings (name, description, personality)
 * LLM model configuration is now fixed to gpt-5-mini with standard parameters
 * Human escalation configuration moved to separate tab for better UX
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { validateAgentConfig } from '../../../utils/agentEditorHelpers';
import { useAuth } from '../../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import DescriptionRewriteModal from './DescriptionRewriteModal';

// Utility function to determine provider from model name
const getProviderFromModel = (model) => {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  return 'openai'; // default fallback
};

const AgentConfigurationForm = ({ 
  agent, 
  onAgentUpdate, 
  onSave, 
  saving = false,
  disabled = false,
  isNewAgent = false,
  onAgentCreated = null
}) => {
  const [formData, setFormData] = useState(() => {
    const defaultModel = 'gpt-5-mini';
    return {
      name: '',
      description: '',
      model: defaultModel,
      temperature: 0.7,
      max_tokens: 2000,
      provider: getProviderFromModel(defaultModel),
      project_id: null,
      personality_template: 'general_assistant'
    };
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [organizationError, setOrganizationError] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [initializedAgentId, setInitializedAgentId] = useState(null);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);

  // Auth context for organization validation
  const { currentOrganization } = useAuth();
  const navigate = useNavigate();

  // Check organization context on component mount and when creating new agents
  useEffect(() => {
    if (isNewAgent && !currentOrganization) {
      setOrganizationError('You need to set up an organization before creating agents.');
    } else {
      setOrganizationError(null);
    }
  }, [isNewAgent, currentOrganization]);

  // Load available projects when organization changes
  useEffect(() => {
    const loadProjects = async () => {
      if (currentOrganization && isNewAgent) {
        setProjectsLoading(true);
        try {
          const { getOrganizationProjects } = await import('../../../services/projects/projectService');
          const projects = await getOrganizationProjects(currentOrganization.id);
          setAvailableProjects(projects);
        } catch (error) {
          console.error('Error loading projects:', error);
          setAvailableProjects([]);
        } finally {
          setProjectsLoading(false);
        }
      }
    };

    loadProjects();
  }, [currentOrganization, isNewAgent]);


  // Simple agent data loading - only when agent changes
  useEffect(() => {
    if (agent && agent.id !== initializedAgentId) {
      console.log('📋 AgentConfigurationForm: Loading agent data:', agent);

      const loadedData = {
        name: agent.basic_info?.name || agent.name || '',
        description: agent.basic_info?.description || agent.description || '',
        project_id: agent.project_id || null,
      };

      console.log('📋 AgentConfigurationForm: Setting form data:', loadedData);
      setFormData(loadedData);
      setInitializedAgentId(agent.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  // Validate form data
  useEffect(() => {
    const validation = validateAgentConfig(formData);
    setValidationErrors(validation.errors);
  }, [formData]);

  // Memoize the input change handler to prevent re-renders
  const handleInputChange = useCallback((field) => (event) => {
    let value = event.target.value;
    
    // Handle project selection - empty string means no project
    if (field === 'project_id') {
      value = value === '' ? null : value;
    }
    
    const newFormData = { ...formData, [field]: value };
    
    setFormData(newFormData);
  }, [formData]);

  const handleSave = useCallback(async () => {
    // First check organization context for new agents
    if (isNewAgent && !currentOrganization) {
      setOrganizationError('You need to set up an organization before creating agents.');
      return;
    }

    const validation = validateAgentConfig(formData);
    setValidationErrors(validation.errors);

    if (validation.isValid) {
      if (isNewAgent) {
        // Create new agent with organization context
        try {
          const { createAgent } = await import('../../../services/agents/agentService');

          const agentData = {
            name: formData.name,
            description: formData.description,
            type: 'general',
            industry: 'other',
            provider: formData.provider,
            model: formData.model,
            temperature: formData.temperature,
            max_tokens: formData.max_tokens,
            personality_template: formData.personality_template,
            status: 'draft',
            // Include organization context
            organization_id: currentOrganization.id,
            project_id: formData.project_id
          };

          const createdAgent = await createAgent(agentData);
          onAgentCreated && onAgentCreated(createdAgent);
        } catch (error) {
          console.error('Error creating agent:', error);
          if (error.message.includes('organization')) {
            setOrganizationError(error.message);
          }
          // Error handling could be improved here
        }
      } else if (onSave) {
        // Update existing agent
        onSave(formData);
      }
    }
  }, [formData, onSave, isNewAgent, onAgentCreated, currentOrganization]);

  // Handle description update from AI modal
  const handleDescriptionUpdate = useCallback((newDescription) => {
    const newFormData = { ...formData, description: newDescription };
    setFormData(newFormData);
    // If not a new agent, trigger save
    if (!isNewAgent && onAgentUpdate) {
      onAgentUpdate(newFormData);
    }
  }, [formData, isNewAgent, onAgentUpdate]);


  // Personality template options matching agent personalities.json
  const personalityOptions = [
    { 
      value: 'sales_assistant', 
      label: 'Sales Assistant', 
      description: 'Persuasive agent focused on converting visitors into customers' 
    },
    { 
      value: 'support_agent', 
      label: 'Support Agent', 
      description: 'Helpful agent focused on solving customer problems and providing assistance' 
    },
    { 
      value: 'knowledge_expert', 
      label: 'Knowledge Expert', 
      description: 'Educational agent focused on sharing information and expertise' 
    },
    { 
      value: 'customer_success', 
      label: 'Customer Success Manager', 
      description: 'Relationship-focused agent that ensures customer satisfaction and growth' 
    },
    { 
      value: 'general_assistant', 
      label: 'General Assistant', 
      description: 'Versatile, balanced agent suitable for general customer interactions' 
    }
  ];


  return (
    <Paper elevation={1} sx={{ p: 0, height: 'fit-content' }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Agent Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your agent's basic settings and AI model parameters
          </Typography>
        </Box>

      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Basic Information */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
            Basic Information
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Agent Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={disabled}
              required
              helperText="Choose a descriptive name for your agent"
              sx={{ width: '100%' }}
            />
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                disabled={disabled}
                multiline
                rows={3}
                placeholder="Describe what your agent does and its primary purpose..."
                helperText="Provide a clear description of your agent's purpose and capabilities"
                sx={{ width: '100%' }}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <Tooltip title="Generate description with AI">
                        <IconButton
                          onClick={() => setDescriptionModalOpen(true)}
                          disabled={disabled}
                          size="small"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          <AutoAwesomeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                }}
              />
            </Box>

            {/* Agent Type Selection */}
            <FormControl fullWidth disabled={disabled}>
              <InputLabel>Agent Type</InputLabel>
              <Select
                value={formData.personality_template}
                onChange={handleInputChange('personality_template')}
                label="Agent Type"
              >
                {personalityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Choose a personality template that matches your agent's role
              </Typography>
            </FormControl>

            {/* Project Selection - Only for new agents */}
            {isNewAgent && currentOrganization && (
              <FormControl fullWidth disabled={disabled || projectsLoading}>
                <InputLabel>Project (Optional)</InputLabel>
                <Select
                  value={formData.project_id || ''}
                  onChange={handleInputChange('project_id')}
                  label="Project (Optional)"
                >
                  <MenuItem value="">
                    <em>No Project (General Agent)</em>
                  </MenuItem>
                  {availableProjects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">
                          {project.project_info?.name || project.name || 'Untitled Project'}
                        </Typography>
                        {project.project_info?.description && (
                          <Typography variant="caption" color="text.secondary">
                            {project.project_info.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {projectsLoading ? (
                  <Typography variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={12} />
                    Loading projects...
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Assign this agent to a specific project or leave unassigned
                  </Typography>
                )}
              </FormControl>
            )}
          </Box>
        </Box>


        {/* Organization Setup Warning */}
        {organizationError && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Organization Setup Required
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {organizationError}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/organization/create')}
                  sx={{ fontSize: '0.875rem' }}
                >
                  Create Organization
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/')}
                  sx={{ fontSize: '0.875rem' }}
                >
                  Go to Projects
                </Button>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Save Button */}
        <Box sx={{ pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={disabled || saving || validationErrors.length > 0 || organizationError}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            fullWidth
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
{saving ? (isNewAgent ? 'Creating Agent...' : 'Saving...') : (isNewAgent ? 'Create Agent' : 'Save Configuration')}
          </Button>
          
          {validationErrors.length > 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Please fix the validation errors above
            </Typography>
          )}
          
          {organizationError && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Complete organization setup to create agents
            </Typography>
          )}
        </Box>
      </Box>
      </Box>

      {/* Description Rewrite Modal */}
      <DescriptionRewriteModal
        open={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        currentDescription={formData.description}
        agentName={formData.name}
        agentType={formData.personality_template}
        onDescriptionSelect={handleDescriptionUpdate}
      />
    </Paper>
  );
};

export default React.memo(AgentConfigurationForm);