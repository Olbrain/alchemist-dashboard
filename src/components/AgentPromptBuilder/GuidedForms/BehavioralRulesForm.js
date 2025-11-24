/**
 * Behavioral Rules Form - Guided Form Component
 *
 * Structured form for collecting behavioral rules and protocols with dynamic AI-powered suggestions
 */
import React, { useState, useEffect } from 'react';
import ListItemForm from './ListItemForm';
import { validateBehavioralRules } from '../../../services/prompts/structuredDataSchemas';
import { getDynamicSuggestions, getTemplateSuggestionsOnly } from '../../../services/prompts/dynamicSuggestionsService';

const BehavioralRulesForm = ({
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
    const validationResult = validateBehavioralRules(data);
    setValidation(validationResult);
  }, [data]);

  // Load dynamic suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      const templateSuggestions = getTemplateSuggestionsOnly(
        agentContext?.agent_type || 'general',
        'behavioral_rules'
      );
      setSuggestions(templateSuggestions);

      if (agentId && agentContext) {
        setLoadingSuggestions(true);
        try {
          const result = await getDynamicSuggestions(
            agentId,
            'behavioral_rules',
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
      title="Behavioral Rules"
      description="List specific behavioral rules, protocols, and procedures the agent must always follow. Include compliance and safety rules."
      items={data.items}
      onChange={handleChange}
      disabled={disabled}
      placeholder="e.g., Always apologize for any inconvenience before providing solutions"
      minItems={3}
      validation={validation}
      suggestions={suggestions}
      loadingSuggestions={loadingSuggestions}
    />
  );
};

export default React.memo(BehavioralRulesForm);
