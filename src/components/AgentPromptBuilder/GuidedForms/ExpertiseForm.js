/**
 * Expertise Form - Guided Form Component
 *
 * Structured form for collecting agent expertise areas with dynamic AI-powered suggestions
 */
import React, { useState, useEffect } from 'react';
import ListItemForm from './ListItemForm';
import { validateExpertise } from '../../../services/prompts/structuredDataSchemas';
import { getDynamicSuggestions, getTemplateSuggestionsOnly } from '../../../services/prompts/dynamicSuggestionsService';

const ExpertiseForm = ({
  data = { items: [] },
  onChange,
  onFieldChange,
  disabled = false,
  agentId = null,
  agentContext = null
}) => {
  const [validation, setValidation] = useState({ isValid: false, errors: {} });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Validate on data change
  useEffect(() => {
    const validationResult = validateExpertise(data);
    setValidation(validationResult);
  }, [data]);

  // Load dynamic suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      const templateSuggestions = getTemplateSuggestionsOnly(
        agentContext?.agent_type || 'general',
        'expertise'
      );
      setSuggestions(templateSuggestions);

      if (agentId && agentContext) {
        setLoadingSuggestions(true);
        try {
          const result = await getDynamicSuggestions(
            agentId,
            'expertise',
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

  // Handle change
  const handleChange = (items) => {
    // Call field-level API (immediate for list changes)
    if (onFieldChange) {
      onFieldChange('items', items, false);
    }
  };

  return (
    <ListItemForm
      title="Expertise"
      description="Define the agent's areas of specialization and knowledge domains. List specific expertise areas."
      items={data.items}
      onChange={handleChange}
      disabled={disabled}
      placeholder="e.g., Sales methodology including consultative selling and SPIN selling"
      minItems={3}
      validation={validation}
      suggestions={suggestions}
      loadingSuggestions={loadingSuggestions}
    />
  );
};

export default React.memo(ExpertiseForm);
