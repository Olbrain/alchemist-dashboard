/**
 * Communication Guidelines Form - Guided Form Component
 *
 * Structured form for collecting communication guidelines with dynamic AI-powered suggestions
 */
import React, { useState, useEffect } from 'react';
import { Box, TextField } from '@mui/material';
import ListItemForm from './ListItemForm';
import { validateCommunicationGuidelines } from '../../../services/prompts/structuredDataSchemas';
import { getDynamicSuggestions, getTemplateSuggestionsOnly } from '../../../services/prompts/dynamicSuggestionsService';

const CommunicationGuidelinesForm = ({
  data = { items: [], examplePhrases: '' },
  onChange,
  onFieldChange,
  disabled = false,
  agentId = null,
  agentContext = null
}) => {
  const [validation, setValidation] = useState({ isValid: false, errors: {} });
  const [examplePhrases, setExamplePhrases] = useState(data.examplePhrases || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Validate on data change
  useEffect(() => {
    const validationResult = validateCommunicationGuidelines(data);
    setValidation(validationResult);
  }, [data]);

  // Load dynamic suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      const templateSuggestions = getTemplateSuggestionsOnly(
        agentContext?.agent_type || 'general',
        'communication_guidelines'
      );
      setSuggestions(templateSuggestions);

      if (agentId && agentContext) {
        setLoadingSuggestions(true);
        try {
          const result = await getDynamicSuggestions(
            agentId,
            'communication_guidelines',
            agentContext,
            6
          );
          if (result.suggestions && result.suggestions.length > 0) {
            setSuggestions(result.suggestions);
          }
        } catch (error) {
          console.error('Failed to load dynamic suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      }
    };

    loadSuggestions();
  }, [agentId, agentContext]);

  // Handle items change
  const handleItemsChange = (items) => {
    // Call field-level API (immediate for list changes)
    if (onFieldChange) {
      onFieldChange('items', items, false);
    }
  };

  // Handle example phrases change
  const handleExamplePhrasesChange = (value) => {
    setExamplePhrases(value);
    // Call field-level API (debounced for text input)
    if (onFieldChange) {
      onFieldChange('examplePhrases', value, true);
    }
  };

  return (
    <Box>
      <ListItemForm
        title="Communication Guidelines"
        description="Provide specific guidelines for how the agent should structure responses and communicate effectively."
        items={data.items}
        onChange={handleItemsChange}
        disabled={disabled}
        placeholder="e.g., Always start with a greeting and acknowledge the customer's inquiry"
        minItems={3}
        validation={validation}
        suggestions={suggestions}
        loadingSuggestions={loadingSuggestions}
      />

      {/* Example Phrases */}
      <Box sx={{ mt: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Example Phrases (Optional)"
          value={examplePhrases}
          onChange={(e) => handleExamplePhrasesChange(e.target.value)}
          disabled={disabled}
          helperText="Provide specific phrases or expressions your agent should use in conversations"
          placeholder='e.g., "Happy to help!", "Let me look into that for you", "Great question!", "I appreciate your patience"'
        />
      </Box>
    </Box>
  );
};

export default React.memo(CommunicationGuidelinesForm);
