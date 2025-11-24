/**
 * Personality Form - Guided Form Component
 *
 * Structured form for defining agent personality with sliders and trait selection
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  Chip,
  Grid,
  Paper,
  Button,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  PERSONALITY_SCHEMA,
  PERSONALITY_TRAITS,
  validatePersonality
} from '../../../services/prompts/structuredDataSchemas';

const PersonalityForm = ({
  data = PERSONALITY_SCHEMA,
  onChange,
  onFieldChange,
  disabled = false
}) => {
  // Initialize with complete structure to prevent undefined access
  const [formData, setFormData] = useState(() => ({
    tone: {
      formality: data?.tone?.formality ?? PERSONALITY_SCHEMA.tone.formality,
      directness: data?.tone?.directness ?? PERSONALITY_SCHEMA.tone.directness,
      enthusiasm: data?.tone?.enthusiasm ?? PERSONALITY_SCHEMA.tone.enthusiasm,
      empathy: data?.tone?.empathy ?? PERSONALITY_SCHEMA.tone.empathy
    },
    traits: Array.isArray(data?.traits) ? data.traits : []
  }));
  const [validation, setValidation] = useState({ isValid: false, errors: {} });

  // Normalize incoming data to ensure proper structure (handles old schema data)
  useEffect(() => {
    const normalizedData = {
      tone: {
        formality: data?.tone?.formality ?? PERSONALITY_SCHEMA.tone.formality,
        directness: data?.tone?.directness ?? PERSONALITY_SCHEMA.tone.directness,
        enthusiasm: data?.tone?.enthusiasm ?? PERSONALITY_SCHEMA.tone.enthusiasm,
        empathy: data?.tone?.empathy ?? PERSONALITY_SCHEMA.tone.empathy
      },
      traits: Array.isArray(data?.traits) ? data.traits : []
    };

    // Only update if data actually changed (prevents feedback loop from Firestore listener)
    const hasChanged =
      formData.tone.formality !== normalizedData.tone.formality ||
      formData.tone.directness !== normalizedData.tone.directness ||
      formData.tone.enthusiasm !== normalizedData.tone.enthusiasm ||
      formData.tone.empathy !== normalizedData.tone.empathy ||
      JSON.stringify(formData.traits) !== JSON.stringify(normalizedData.traits);

    if (hasChanged) {
      setFormData(normalizedData);
    }
  }, [data, formData]);

  // Validate on data change
  useEffect(() => {
    const validationResult = validatePersonality(formData);
    setValidation(validationResult);
  }, [formData]);

  // Handle slider change
  const handleSliderChange = (dimension, value) => {
    const updatedTone = {
      ...formData.tone,
      [dimension]: value
    };

    setFormData(prev => ({
      ...prev,
      tone: updatedTone
    }));

    // Call field-level API (immediate for slider)
    if (onFieldChange) {
      onFieldChange('tone', updatedTone, false);
    }
  };

  // Handle trait toggle
  const handleTraitToggle = (traitId) => {
    const currentTraits = formData.traits || [];
    let updatedTraits;

    if (currentTraits.includes(traitId)) {
      updatedTraits = currentTraits.filter(id => id !== traitId);
    } else {
      // Limit to 6 traits
      if (currentTraits.length >= 6) {
        return; // Don't add more than 6
      }
      updatedTraits = [...currentTraits, traitId];
    }

    setFormData(prev => ({
      ...prev,
      traits: updatedTraits
    }));

    // Call field-level API (immediate for trait selection)
    if (onFieldChange) {
      onFieldChange('traits', updatedTraits, false);
    }
  };

  // Get slider label
  const getSliderLabel = (dimension, value) => {
    const labels = {
      formality: {
        0: 'Very Formal',
        33: 'Formal',
        50: 'Balanced',
        67: 'Casual',
        100: 'Very Casual'
      },
      directness: {
        0: 'Very Direct',
        33: 'Direct',
        50: 'Balanced',
        67: 'Conversational',
        100: 'Very Conversational'
      },
      enthusiasm: {
        0: 'Reserved',
        33: 'Moderate',
        50: 'Balanced',
        67: 'Enthusiastic',
        100: 'Very Enthusiastic'
      },
      empathy: {
        0: 'Neutral',
        33: 'Considerate',
        50: 'Balanced',
        67: 'Empathetic',
        100: 'Highly Empathetic'
      }
    };

    const dimensionLabels = labels[dimension];
    if (!dimensionLabels) return '';

    // Find closest label
    const keys = Object.keys(dimensionLabels).map(Number).sort((a, b) => a - b);
    const closest = keys.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );

    return dimensionLabels[closest];
  };

  // Group traits by category
  const traitsByCategory = PERSONALITY_TRAITS.reduce((acc, trait) => {
    if (!acc[trait.category]) {
      acc[trait.category] = [];
    }
    acc[trait.category].push(trait);
    return acc;
  }, {});

  const categoryLabels = {
    social: 'Social',
    conduct: 'Professional Conduct',
    emotional: 'Emotional',
    energy: 'Energy Level',
    attitude: 'Attitude',
    work_style: 'Work Style',
    thinking: 'Thinking Style'
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Section Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Agent Personality
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define how your agent communicates and behaves. Adjust tone dimensions and select personality traits.
        </Typography>
      </Box>

      {/* Tone Sliders - 2x2 Grid Layout */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Communication Tone
        </Typography>

        <Grid container spacing={3}>
          {/* Formality */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Formality
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  {getSliderLabel('formality', formData.tone?.formality)}
                </Typography>
              </Box>
              <Slider
                value={formData.tone?.formality}
                onChangeCommitted={(e, value) => handleSliderChange('formality', value)}
                disabled={disabled}
                min={0}
                max={100}
                marks={[
                  { value: 0 },
                  { value: 50 },
                  { value: 100 }
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* Directness */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Directness
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  {getSliderLabel('directness', formData.tone?.directness)}
                </Typography>
              </Box>
              <Slider
                value={formData.tone?.directness}
                onChangeCommitted={(e, value) => handleSliderChange('directness', value)}
                disabled={disabled}
                min={0}
                max={100}
                marks={[
                  { value: 0 },
                  { value: 50 },
                  { value: 100 }
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* Enthusiasm */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Enthusiasm
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  {getSliderLabel('enthusiasm', formData.tone?.enthusiasm)}
                </Typography>
              </Box>
              <Slider
                value={formData.tone?.enthusiasm}
                onChangeCommitted={(e, value) => handleSliderChange('enthusiasm', value)}
                disabled={disabled}
                min={0}
                max={100}
                marks={[
                  { value: 0 },
                  { value: 50 },
                  { value: 100 }
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* Empathy */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Empathy
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  {getSliderLabel('empathy', formData.tone?.empathy)}
                </Typography>
              </Box>
              <Slider
                value={formData.tone?.empathy}
                onChangeCommitted={(e, value) => handleSliderChange('empathy', value)}
                disabled={disabled}
                min={0}
                max={100}
                marks={[
                  { value: 0 },
                  { value: 50 },
                  { value: 100 }
                ]}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Personality Traits - Two Column Layout */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Personality Traits
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column: Selected Traits */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Selected Traits
              </Typography>
              <Chip
                label={`${formData.traits?.length || 0}/6`}
                size="small"
                color={formData.traits?.length > 0 ? 'primary' : 'default'}
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            </Box>

            {formData.traits && formData.traits.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {formData.traits.map((traitId) => {
                  const trait = PERSONALITY_TRAITS.find(t => t.id === traitId);
                  if (!trait) return null;

                  return (
                    <Box
                      key={traitId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        bgcolor: 'primary.lighter',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'primary.light'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {trait.label}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleTraitToggle(traitId)}
                        disabled={disabled}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                No traits selected yet. Choose from the options on the right.
              </Typography>
            )}

            {validation.errors.traits && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                {validation.errors.traits}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Available Traits */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              position: { md: 'sticky' },
              top: { md: 16 }
            }}
          >
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', maxHeight: { md: '500px' }, overflowY: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem', color: 'primary.main' }}>
                Available Traits
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Click any trait below to add it
              </Typography>

              {Object.entries(traitsByCategory).map(([category, traits]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      display: 'block',
                      mb: 0.5,
                      fontSize: '0.7rem'
                    }}
                  >
                    {categoryLabels[category]}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {traits.map((trait) => {
                      const isSelected = formData.traits?.includes(trait.id);
                      const isDisabled = disabled || (!isSelected && formData.traits?.length >= 6);

                      return (
                        <Button
                          key={trait.id}
                          variant={isSelected ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => !isDisabled && handleTraitToggle(trait.id)}
                          disabled={isDisabled}
                          sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            '&:hover': !isDisabled && !isSelected ? {
                              bgcolor: 'primary.lighter'
                            } : {}
                          }}
                        >
                          {trait.label}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Validation Summary */}
      {!validation.isValid && Object.keys(validation.errors).length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, borderLeft: 3, borderColor: 'warning.main' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'warning.dark' }}>
            Validation issues:
          </Typography>
          {Object.values(validation.errors).map((error, index) => (
            <Typography key={index} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              • {error}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default React.memo(PersonalityForm);
