/**
 * Prompt Validation Service
 *
 * Service layer for AI-powered prompt validation using the agent-engine validation tools.
 * Communicates with the backend via Alchemist API to access validation, suggestions,
 * consistency checking, improvement, and completeness analysis tools.
 */
import { interactWithAlchemist } from '../alchemist/alchemistService';

/**
 * Parse tool result from Alchemist response
 * The response contains the tool execution result in various possible formats
 */
const parseToolResult = (response) => {
  try {
    // Response structure: { response: "...", session_id: "..." }
    // The actual tool result is in the response field
    if (response && response.response) {
      const responseText = response.response;

      // Try to extract JSON from response text
      // Tool results might be wrapped in markdown code blocks or plain JSON
      let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      jsonMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse the entire response as JSON
      // If the LLM directly returned the tool result
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        return JSON.parse(responseText);
      }

      // If we can't parse it, return as text with error indicator
      return {
        error: 'Could not parse tool result',
        raw_response: responseText
      };
    }

    return {
      error: 'Invalid response structure',
      raw_response: response
    };
  } catch (error) {
    console.error('Error parsing tool result:', error);
    return {
      error: `Parse error: ${error.message}`,
      raw_response: response
    };
  }
};

/**
 * Create a structured message for tool invocation
 */
const createToolMessage = (toolName, parameters) => {
  return `Please use the ${toolName} tool with the following parameters:\n\n${JSON.stringify(parameters, null, 2)}`;
};

/**
 * Validate a prompt section using AI analysis
 *
 * @param {string} agentId - The agent ID
 * @param {string} sectionName - Section name (identity, objectives, etc.)
 * @param {string} content - Section content to validate
 * @param {Object} agentContext - Optional context (agent_type, industry, use_case, target_users)
 * @returns {Promise<Object>} Validation result with quality_score, issues, missing_elements, recommendations, strengths
 */
export const validatePromptSection = async (agentId, sectionName, content, agentContext = null) => {
  try {
    console.log(`Validating prompt section: ${sectionName} for agent ${agentId}`);

    // Fetch agent to get project_id
    const { getAgent } = await import('../agents/agentService');
    const agent = await getAgent(agentId);
    const projectId = agent?.project_id || null;

    const parameters = {
      section_name: sectionName,
      content: content
    };

    if (agentContext) {
      parameters.agent_context = agentContext;
    }

    const message = createToolMessage('validate_prompt_section', parameters);
    const response = await interactWithAlchemist(message, projectId);

    return parseToolResult(response);
  } catch (error) {
    console.error('Error validating prompt section:', error);
    return {
      error: error.message || 'Validation failed',
      quality_score: 0,
      issues: [{
        type: 'error',
        severity: 'critical',
        message: `Validation error: ${error.message}`,
        suggestion: 'Please try again or contact support'
      }],
      missing_elements: [],
      recommendations: [],
      strengths: []
    };
  }
};

/**
 * Get AI-generated content suggestions for a section
 *
 * @param {string} agentId - The agent ID
 * @param {string} sectionName - Section name
 * @param {Object} agentContext - Required context about the agent
 * @param {string} currentContent - Optional existing content to build upon
 * @returns {Promise<Object>} Suggestions with suggestions array, examples, best_practices
 */
export const getSectionSuggestions = async (agentId, sectionName, agentContext, currentContent = null) => {
  try {
    console.log(`Getting suggestions for section: ${sectionName} for agent ${agentId}`);

    // Fetch agent to get project_id
    const { getAgent } = await import('../agents/agentService');
    const agent = await getAgent(agentId);
    const projectId = agent?.project_id || null;

    const parameters = {
      section_name: sectionName,
      agent_context: agentContext
    };

    if (currentContent) {
      parameters.current_content = currentContent;
    }

    const message = createToolMessage('suggest_section_content', parameters);
    const response = await interactWithAlchemist(message, projectId);

    return parseToolResult(response);
  } catch (error) {
    console.error('Error getting section suggestions:', error);
    return {
      error: error.message || 'Failed to get suggestions',
      suggestions: [],
      examples: [],
      best_practices: [
        'Define clear and specific content',
        'Use concrete examples relevant to your use case',
        'Align with your agent\'s purpose and goals'
      ]
    };
  }
};

/**
 * Check consistency across all prompt sections
 *
 * @param {string} agentId - The agent ID
 * @param {Object} sections - Dictionary mapping section names to their content
 * @returns {Promise<Object>} Consistency report with score, conflicts, alignments, gaps, recommendations
 */
export const checkPromptConsistency = async (agentId, sections) => {
  try {
    console.log(`Checking prompt consistency for agent ${agentId}`);

    // Fetch agent to get project_id
    const { getAgent } = await import('../agents/agentService');
    const agent = await getAgent(agentId);
    const projectId = agent?.project_id || null;

    const parameters = {
      sections: sections
    };

    const message = createToolMessage('check_prompt_consistency', parameters);
    const response = await interactWithAlchemist(message, projectId);

    return parseToolResult(response);
  } catch (error) {
    console.error('Error checking prompt consistency:', error);
    return {
      error: error.message || 'Consistency check failed',
      overall_consistency_score: 50,
      conflicts: [],
      alignments: [],
      gaps: [],
      recommendations: ['Review sections manually for consistency']
    };
  }
};

/**
 * Get improved version of section content
 *
 * @param {string} agentId - The agent ID
 * @param {string} sectionName - Section name
 * @param {string} content - Current content to improve
 * @param {string} improvementFocus - Optional focus: clarity, specificity, completeness, conciseness
 * @param {Object} agentContext - Optional agent context
 * @returns {Promise<Object>} Improved content with changes_made, improvement_score, alternative_versions
 */
export const improveSectionContent = async (agentId, sectionName, content, improvementFocus = null, agentContext = null) => {
  try {
    console.log(`Improving section content: ${sectionName} for agent ${agentId}`);

    // Fetch agent to get project_id
    const { getAgent } = await import('../agents/agentService');
    const agent = await getAgent(agentId);
    const projectId = agent?.project_id || null;

    const parameters = {
      section_name: sectionName,
      current_content: content
    };

    if (improvementFocus) {
      parameters.improvement_focus = improvementFocus;
    }

    if (agentContext) {
      parameters.agent_context = agentContext;
    }

    const message = createToolMessage('improve_section_content', parameters);
    const response = await interactWithAlchemist(message, projectId);

    return parseToolResult(response);
  } catch (error) {
    console.error('Error improving section content:', error);
    return {
      error: error.message || 'Improvement failed',
      improved_content: content,
      changes_made: [],
      improvement_score: 0,
      alternative_versions: []
    };
  }
};

/**
 * Analyze overall prompt completeness and readiness
 *
 * @param {string} agentId - The agent ID
 * @param {Object} sections - Dictionary mapping section names to their content
 * @param {Object} agentContext - Optional agent context
 * @returns {Promise<Object>} Completeness report with scores, status, gaps, and next steps
 */
export const analyzePromptCompleteness = async (agentId, sections, agentContext = null) => {
  try {
    console.log(`Analyzing prompt completeness for agent ${agentId}`);

    // Fetch agent to get project_id
    const { getAgent } = await import('../agents/agentService');
    const agent = await getAgent(agentId);
    const projectId = agent?.project_id || null;

    const parameters = {
      sections: sections
    };

    if (agentContext) {
      parameters.agent_context = agentContext;
    }

    const message = createToolMessage('analyze_prompt_completeness', parameters);
    const response = await interactWithAlchemist(message, projectId);

    return parseToolResult(response);
  } catch (error) {
    console.error('Error analyzing prompt completeness:', error);
    return {
      error: error.message || 'Completeness analysis failed',
      completeness_score: 0,
      readiness_level: 'unknown',
      completed_sections: [],
      incomplete_sections: [],
      overall_quality_score: 0,
      strengths: [],
      critical_gaps: [],
      next_steps: ['Review configuration manually'],
      estimated_time_to_complete: 'Unknown'
    };
  }
};

/**
 * Validate multiple sections in batch
 *
 * @param {string} agentId - The agent ID
 * @param {Object} sectionsToValidate - Object mapping section names to content
 * @param {Object} agentContext - Optional agent context
 * @returns {Promise<Object>} Object mapping section names to validation results
 */
export const batchValidateSections = async (agentId, sectionsToValidate, agentContext = null) => {
  try {
    console.log(`Batch validating ${Object.keys(sectionsToValidate).length} sections for agent ${agentId}`);

    // Validate sections in parallel
    const validationPromises = Object.entries(sectionsToValidate).map(([sectionName, content]) => {
      return validatePromptSection(agentId, sectionName, content, agentContext)
        .then(result => ({ sectionName, result }));
    });

    const results = await Promise.all(validationPromises);

    // Convert array to object
    const validationResults = {};
    results.forEach(({ sectionName, result }) => {
      validationResults[sectionName] = result;
    });

    return validationResults;
  } catch (error) {
    console.error('Error in batch validation:', error);
    return {};
  }
};

/**
 * Get quick validation status (lightweight check without full AI analysis)
 *
 * @param {string} sectionName - Section name
 * @param {string} content - Section content
 * @returns {Object} Quick validation result
 */
export const getQuickValidationStatus = (sectionName, content) => {
  // Basic length and structure checks
  const contentLength = content ? content.trim().length : 0;

  // Minimum lengths per section (from SECTION_METADATA)
  const minLengths = {
    identity: 50,
    objectives: 50,
    expertise: 50,
    constraints: 50,
    personality: 50,
    communication_guidelines: 50,
    behavioral_rules: 50
  };

  const minLength = minLengths[sectionName] || 50;

  if (contentLength === 0) {
    return {
      status: 'empty',
      canValidate: false,
      message: 'Section is empty'
    };
  }

  if (contentLength < minLength) {
    return {
      status: 'too_short',
      canValidate: true,
      message: `Content is shorter than minimum ${minLength} characters`,
      currentLength: contentLength,
      minLength: minLength
    };
  }

  return {
    status: 'ready',
    canValidate: true,
    message: 'Ready for AI validation',
    currentLength: contentLength
  };
};

/**
 * Format validation issues for display
 *
 * @param {Array} issues - Array of issue objects
 * @returns {Object} Categorized issues
 */
export const categorizeValidationIssues = (issues) => {
  const categorized = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  if (!issues || !Array.isArray(issues)) {
    return categorized;
  }

  issues.forEach(issue => {
    const severity = issue.severity || 'medium';
    if (categorized[severity]) {
      categorized[severity].push(issue);
    }
  });

  return categorized;
};

/**
 * Get validation summary text
 *
 * @param {Object} validationResult - Validation result object
 * @returns {string} Human-readable summary
 */
export const getValidationSummary = (validationResult) => {
  if (!validationResult) {
    return 'Not validated';
  }

  if (validationResult.error) {
    return `Validation error: ${validationResult.error}`;
  }

  const score = validationResult.quality_score || 0;
  const issueCount = validationResult.issues ? validationResult.issues.length : 0;

  if (score >= 90) {
    return `Excellent (${score}/100)`;
  } else if (score >= 75) {
    return `Good (${score}/100) - ${issueCount} suggestions`;
  } else if (score >= 50) {
    return `Needs improvement (${score}/100) - ${issueCount} issues`;
  } else {
    return `Requires attention (${score}/100) - ${issueCount} issues`;
  }
};
