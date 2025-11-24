/**
 * Constraints Form - Guided Form Component
 *
 * Structured form for collecting agent constraints and limitations with dynamic AI-powered suggestions
 */
import React, { useState, useEffect } from 'react';
import ListItemForm from './ListItemForm';
import { validateConstraints } from '../../../services/prompts/structuredDataSchemas';
import { getDynamicSuggestions, getTemplateSuggestionsOnly } from '../../../services/prompts/dynamicSuggestionsService';

const ConstraintsForm = ({
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
    const validationResult = validateConstraints(data);
    setValidation(validationResult);
  }, [data]);

  // Load dynamic suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      const templateSuggestions = getTemplateSuggestionsOnly(
        agentContext?.agent_type || 'general',
        'constraints'
      );
      setSuggestions(templateSuggestions);

      if (agentId && agentContext) {
        setLoadingSuggestions(true);
        try {
          const result = await getDynamicSuggestions(
            agentId,
            'constraints',
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
      title="Constraints"
      description="Define clear boundaries, limitations, and rules the agent must follow. Include what the agent should NOT do."
      items={data.items}
      onChange={handleChange}
      disabled={disabled}
      placeholder="e.g., Cannot process refunds over $500 without supervisor approval"
      minItems={3}
      validation={validation}
      suggestions={suggestions}
      loadingSuggestions={loadingSuggestions}
    />
  );
};

export default React.memo(ConstraintsForm);
