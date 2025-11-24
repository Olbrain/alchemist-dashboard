/**
 * Objectives Form - Guided Form Component
 *
 * Structured form for collecting agent objectives with dynamic AI-powered suggestions
 */
import React, { useState, useEffect } from 'react';
import ListItemForm from './ListItemForm';
import { validateObjectives } from '../../../services/prompts/structuredDataSchemas';
import { getDynamicSuggestions, getTemplateSuggestionsOnly } from '../../../services/prompts/dynamicSuggestionsService';

const ObjectivesForm = ({
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
    const validationResult = validateObjectives(data);
    setValidation(validationResult);
  }, [data]);

  // Load dynamic suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      // Show template suggestions immediately
      const templateSuggestions = getTemplateSuggestionsOnly(
        agentContext?.agent_type || 'general',
        'objectives'
      );
      setSuggestions(templateSuggestions);

      // If we have agentId and context, fetch AI-powered suggestions
      if (agentId && agentContext) {
        setLoadingSuggestions(true);
        try {
          const result = await getDynamicSuggestions(
            agentId,
            'objectives',
            agentContext,
            6
          );
          if (result.suggestions && result.suggestions.length > 0) {
            setSuggestions(result.suggestions);
          }
        } catch (error) {
          console.error('Failed to load dynamic suggestions:', error);
          // Keep template suggestions on error
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
      title="Objectives"
      description="Define what the agent aims to achieve in interactions. List the main goals and desired outcomes."
      items={data.items}
      onChange={handleChange}
      disabled={disabled}
      placeholder="e.g., Understand customer needs through thoughtful questioning"
      minItems={3}
      validation={validation}
      suggestions={suggestions}
      loadingSuggestions={loadingSuggestions}
    />
  );
};

export default React.memo(ObjectivesForm);
