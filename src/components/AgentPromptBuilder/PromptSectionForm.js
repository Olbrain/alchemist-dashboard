/**
 * Prompt Section Form Component
 *
 * Form for editing a single prompt section with validation and auto-save
 * Uses guided (structured) forms for all sections
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getDefaultData } from '../../services/prompts/structuredDataSchemas';
import { getAgent } from '../../services/agents/agentService';
import IdentityForm from './GuidedForms/IdentityForm';
import PersonalityForm from './GuidedForms/PersonalityForm';
import ObjectivesForm from './GuidedForms/ObjectivesForm';
import ExpertiseForm from './GuidedForms/ExpertiseForm';
import ConstraintsForm from './GuidedForms/ConstraintsForm';
import CommunicationGuidelinesForm from './GuidedForms/CommunicationGuidelinesForm';
import BehavioralRulesForm from './GuidedForms/BehavioralRulesForm';

const PromptSectionForm = ({
  sectionName,
  content,
  completed,
  onUpdate,
  onClear,
  disabled = false,
  autoSave = true,
  agentId = null,
  agentContext = null
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [guidedData, setGuidedData] = useState(null);

  // Initialize guided data on mount or section change
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Content is already an object (transformed by hook), no parsing needed
        if (content && typeof content === 'object' && Object.keys(content).length > 0) {
          setGuidedData(content);
        } else {
          // Initialize with default schema
          let defaultData = getDefaultData(sectionName);

          // For identity section with no content, pre-fill agent name
          if (sectionName === 'identity' && agentId) {
            try {
              const agent = await getAgent(agentId);
              const agentName = agent?.basic_info?.name || agent?.name || '';

              if (agentName) {
                defaultData = {
                  ...defaultData,
                  name: agentName
                };
              }
            } catch (err) {
              console.error('Error fetching agent for pre-fill:', err);
              // Continue with default data if fetch fails
            }
          }

          setGuidedData(defaultData);
        }
      } catch (e) {
        console.error('Error initializing form data:', e);
        setGuidedData(getDefaultData(sectionName));
      }
    };

    initializeData();
  }, [sectionName, content, agentId]);

  // Handle guided form change
  const handleGuidedChange = useCallback((data, isValid) => {
    setGuidedData(data);
    setHasChanges(true);

    // Trigger update callback with JSON stringified data
    if (onUpdate) {
      onUpdate(JSON.stringify(data, null, 2));
    }
  }, [onUpdate]);

  // Timeout refs for field-level debouncing
  const fieldTimeouts = React.useRef({});

  // Handle single field change (for direct API call)
  const handleFieldChange = useCallback((fieldName, fieldValue, isTextInput = true) => {
    // Update local state immediately
    setGuidedData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
    setHasChanges(true);

    // Clear existing timeout for this field
    if (fieldTimeouts.current[fieldName]) {
      clearTimeout(fieldTimeouts.current[fieldName]);
    }

    // API call function
    const saveField = async () => {
      try {
        const { updatePromptField } = await import('../../services/prompts/promptBuilderService');
        await updatePromptField(agentId, sectionName, fieldName, fieldValue);

        // Clear "saving" indicator after successful save
        // Firestore listener will update the data automatically
        setHasChanges(false);
      } catch (err) {
        console.error(`Error updating field ${fieldName}:`, err);
        // Clear indicator even on error
        setHasChanges(false);
      }
    };

    if (isTextInput) {
      // Debounce text inputs (1 second)
      fieldTimeouts.current[fieldName] = setTimeout(saveField, 1000);
    } else {
      // Immediate save for dropdowns/selects
      saveField();
    }
  }, [agentId, sectionName]);

  // Render guided form component based on section
  const renderGuidedForm = () => {
    if (!guidedData) return null;

    switch (sectionName) {
      case 'identity':
        return (
          <IdentityForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
          />
        );
      case 'personality':
        return (
          <PersonalityForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
          />
        );
      case 'objectives':
        return (
          <ObjectivesForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
            agentId={agentId}
            agentContext={agentContext}
          />
        );
      case 'expertise':
        return (
          <ExpertiseForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
            agentId={agentId}
            agentContext={agentContext}
          />
        );
      case 'constraints':
        return (
          <ConstraintsForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
            agentId={agentId}
            agentContext={agentContext}
          />
        );
      case 'communication_guidelines':
        return (
          <CommunicationGuidelinesForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
            agentId={agentId}
            agentContext={agentContext}
          />
        );
      case 'behavioral_rules':
        return (
          <BehavioralRulesForm
            data={guidedData}
            onChange={handleGuidedChange}
            onFieldChange={handleFieldChange}
            disabled={disabled}
            agentId={agentId}
            agentContext={agentContext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Auto-save indicator */}
      {hasChanges && autoSave && (
        <Box sx={{ mb: 2 }}>
          <Chip label="Saving..." size="small" color="info" variant="outlined" sx={{ height: 28 }} />
        </Box>
      )}

      {/* Render Guided Form */}
      {renderGuidedForm()}

      {/* Completion Status and Actions */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Completion Status Indicator (Read-only) */}
        <Chip
          icon={completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          label={completed ? 'Section Complete' : 'In Progress'}
          color={completed ? 'success' : 'default'}
          size="small"
          variant={completed ? 'filled' : 'outlined'}
          sx={{ height: 28 }}
        />

        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => onClear && onClear(sectionName)}
          disabled={disabled}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
};

export default React.memo(PromptSectionForm);
