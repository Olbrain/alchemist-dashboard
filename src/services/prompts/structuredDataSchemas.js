/**
 * Structured Data Schemas
 *
 * Defines the structure for guided form data instead of prose
 */

export const SECTION_TYPES = {
  GUIDED: 'guided',  // Structured form data
  PROSE: 'prose'     // Free-form text (legacy)
};

/**
 * Identity Section Schema
 */
export const IDENTITY_SCHEMA = {
  name: '',           // Agent name
  role: '',           // Primary role (dropdown)
  domain: '',         // Industry/domain
  purpose: '',        // Main purpose (1-2 sentences)
  users: '',          // Target users
  context: ''         // Additional context (optional)
};

export const IDENTITY_ROLES = [
  { value: 'assistant', label: 'Assistant', description: 'General purpose helper' },
  { value: 'advisor', label: 'Advisor', description: 'Provides guidance and recommendations' },
  { value: 'specialist', label: 'Specialist', description: 'Expert in specific domain' },
  { value: 'support_agent', label: 'Support Agent', description: 'Handles customer issues' },
  { value: 'sales_rep', label: 'Sales Representative', description: 'Drives conversions' },
  { value: 'educator', label: 'Educator', description: 'Teaches and informs' },
  { value: 'consultant', label: 'Consultant', description: 'Strategic advisor' },
  { value: 'concierge', label: 'Concierge', description: 'Personalized service provider' }
];

/**
 * Personality Section Schema
 */
export const PERSONALITY_SCHEMA = {
  tone: {
    formality: 50,      // 0=Very Formal, 100=Very Casual
    directness: 50,     // 0=Very Direct, 100=Very Conversational
    enthusiasm: 50,     // 0=Reserved, 100=Very Enthusiastic
    empathy: 50         // 0=Neutral, 100=Highly Empathetic
  },
  traits: []            // Array of trait IDs
};

export const PERSONALITY_TRAITS = [
  { id: 'friendly', label: 'Friendly', category: 'social' },
  { id: 'professional', label: 'Professional', category: 'conduct' },
  { id: 'empathetic', label: 'Empathetic', category: 'emotional' },
  { id: 'assertive', label: 'Assertive', category: 'conduct' },
  { id: 'patient', label: 'Patient', category: 'emotional' },
  { id: 'enthusiastic', label: 'Enthusiastic', category: 'energy' },
  { id: 'calm', label: 'Calm', category: 'emotional' },
  { id: 'optimistic', label: 'Optimistic', category: 'attitude' },
  { id: 'detail_oriented', label: 'Detail-Oriented', category: 'work_style' },
  { id: 'creative', label: 'Creative', category: 'thinking' },
  { id: 'analytical', label: 'Analytical', category: 'thinking' },
  { id: 'supportive', label: 'Supportive', category: 'social' },
  { id: 'confident', label: 'Confident', category: 'attitude' },
  { id: 'humble', label: 'Humble', category: 'attitude' },
  { id: 'adaptable', label: 'Adaptable', category: 'work_style' },
  { id: 'proactive', label: 'Proactive', category: 'work_style' }
];

/**
 * Objectives Section Schema
 */
export const OBJECTIVES_SCHEMA = {
  items: []  // Array of objective strings
};

/**
 * Expertise Section Schema
 */
export const EXPERTISE_SCHEMA = {
  items: []  // Array of expertise area strings
};

/**
 * Constraints Section Schema
 */
export const CONSTRAINTS_SCHEMA = {
  items: []  // Array of constraint strings
};

/**
 * Communication Guidelines Section Schema
 */
export const COMMUNICATION_GUIDELINES_SCHEMA = {
  items: [],            // Array of guideline strings
  examplePhrases: ''    // Example phrases/expressions (optional)
};

/**
 * Behavioral Rules Section Schema
 */
export const BEHAVIORAL_RULES_SCHEMA = {
  items: []  // Array of rule strings
};

/**
 * Validation functions
 */
export const validateIdentity = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Agent name is required';
  }

  if (!data.role) {
    errors.role = 'Role selection is required';
  }

  if (!data.purpose || data.purpose.trim().length < 20) {
    errors.purpose = 'Purpose description should be at least 20 characters';
  }

  if (!data.users || data.users.trim().length === 0) {
    errors.users = 'Target users description is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePersonality = (data) => {
  const errors = {};

  if (!data.traits || data.traits.length === 0) {
    errors.traits = 'Select at least one personality trait';
  }

  if (data.traits && data.traits.length > 6) {
    errors.traits = 'Please select no more than 6 traits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate list-based sections (objectives, expertise, constraints, etc.)
 */
const validateListSection = (data, sectionName, minItems = 3) => {
  const errors = {};

  if (!data.items || !Array.isArray(data.items)) {
    errors.items = 'Items array is required';
  } else if (data.items.length < minItems) {
    errors.items = `Please add at least ${minItems} ${sectionName}`;
  } else {
    // Check that each item has content
    const emptyItems = data.items.filter(item => !item || item.trim().length < 10);
    if (emptyItems.length > 0) {
      errors.items = 'All items must have at least 10 characters';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateObjectives = (data) => validateListSection(data, 'objectives', 3);
export const validateExpertise = (data) => validateListSection(data, 'expertise areas', 3);
export const validateConstraints = (data) => validateListSection(data, 'constraints', 3);
export const validateCommunicationGuidelines = (data) => validateListSection(data, 'guidelines', 3);
export const validateBehavioralRules = (data) => validateListSection(data, 'rules', 3);

/**
 * Convert structured data to prose (for display or backend compatibility)
 */
export const identityToProbe = (data) => {
  // Defensive check: return empty string if data is missing
  if (!data) {
    return '';
  }

  const parts = [];

  if (data.name && data.role) {
    const roleLabel = IDENTITY_ROLES.find(r => r.value === data.role)?.label || data.role;
    parts.push(`You are ${data.name}, a ${roleLabel}.`);
  }

  if (data.domain) {
    parts.push(`You specialize in ${data.domain}.`);
  }

  if (data.purpose) {
    parts.push(`Your main purpose is to ${data.purpose}`);
  }

  if (data.users) {
    parts.push(`You serve ${data.users}.`);
  }

  if (data.context) {
    parts.push(data.context);
  }

  return parts.join(' ');
};

export const personalityToProse = (data) => {
  // Defensive check: return empty string if data is missing
  if (!data) {
    return '';
  }

  const parts = [];

  // Tone descriptions - check if tone object exists
  if (data.tone && typeof data.tone === 'object') {
    const toneDescriptions = [];

    if (data.tone.formality !== undefined) {
      if (data.tone.formality <= 33) {
        toneDescriptions.push('formal and professional');
      } else if (data.tone.formality >= 67) {
        toneDescriptions.push('casual and approachable');
      } else {
        toneDescriptions.push('balanced and professional yet friendly');
      }
    }

    if (data.tone.directness !== undefined) {
      if (data.tone.directness <= 33) {
        toneDescriptions.push('direct and concise');
      } else if (data.tone.directness >= 67) {
        toneDescriptions.push('conversational and engaging');
      }
    }

    if (data.tone.enthusiasm !== undefined) {
      if (data.tone.enthusiasm >= 67) {
        toneDescriptions.push('enthusiastic and energetic');
      } else if (data.tone.enthusiasm <= 33) {
        toneDescriptions.push('measured and reserved');
      }
    }

    if (data.tone.empathy !== undefined && data.tone.empathy >= 67) {
      toneDescriptions.push('highly empathetic and understanding');
    }

    if (toneDescriptions.length > 0) {
      parts.push(`Your communication style is ${toneDescriptions.join(', ')}.`);
    }
  }

  // Traits
  if (data.traits && data.traits.length > 0) {
    const traitLabels = data.traits
      .map(id => PERSONALITY_TRAITS.find(t => t.id === id)?.label)
      .filter(Boolean);

    if (traitLabels.length > 0) {
      parts.push(`Your key personality traits include being ${traitLabels.join(', ')}.`);
    }
  }

  return parts.join(' ');
};

/**
 * Convert list-based structured data to prose
 */
const listToProse = (data, prefix = '') => {
  // Defensive check: handle null/undefined data
  if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return '';
  }

  return data.items
    .filter(item => item && typeof item === 'string' && item.trim().length > 0)
    .map(item => `- ${item.trim()}`)
    .join('\n');
};

export const objectivesToProse = (data) => {
  if (!data) return '';
  const prose = listToProse(data);
  return prose ? `Your main objectives are to:\n${prose}` : '';
};

export const expertiseToProse = (data) => {
  if (!data) return '';
  const prose = listToProse(data);
  return prose ? `You have expertise in:\n${prose}` : '';
};

export const constraintsToProse = (data) => {
  if (!data) return '';
  const prose = listToProse(data);
  return prose ? `You must operate within these boundaries:\n${prose}` : '';
};

export const communicationGuidelinesToProse = (data) => {
  // Defensive check: handle null/undefined data
  if (!data) {
    return '';
  }

  const parts = [];

  const prose = listToProse(data);
  if (prose) {
    parts.push(`Communication guidelines:\n${prose}`);
  }

  if (data.examplePhrases && typeof data.examplePhrases === 'string' && data.examplePhrases.trim().length > 0) {
    parts.push(`\nExample phrases to use:\n${data.examplePhrases.trim()}`);
  }

  return parts.join('\n');
};

export const behavioralRulesToProse = (data) => {
  if (!data) return '';
  const prose = listToProse(data);
  return prose ? `You must always:\n${prose}` : '';
};

/**
 * Get default values for a section
 */
export const getDefaultData = (sectionName) => {
  switch (sectionName) {
    case 'identity':
      return { ...IDENTITY_SCHEMA };
    case 'personality':
      return { ...PERSONALITY_SCHEMA, tone: { ...PERSONALITY_SCHEMA.tone } };
    case 'objectives':
      return { ...OBJECTIVES_SCHEMA, items: [] };
    case 'expertise':
      return { ...EXPERTISE_SCHEMA, items: [] };
    case 'constraints':
      return { ...CONSTRAINTS_SCHEMA, items: [] };
    case 'communication_guidelines':
      return { ...COMMUNICATION_GUIDELINES_SCHEMA, items: [], examplePhrases: '' };
    case 'behavioral_rules':
      return { ...BEHAVIORAL_RULES_SCHEMA, items: [] };
    default:
      return null;
  }
};

