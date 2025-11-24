/**
 * OpenAI Service for AI-powered features
 *
 * Provides integration with OpenAI GPT-5 for generating agent descriptions
 * and other AI-enhanced functionality through the agent-engine backend
 */
import { api } from '../config/apiConfig';

/**
 * Generate improved agent descriptions using GPT-5
 *
 * @param {Object} params - Parameters for description generation
 * @param {string} params.currentDescription - The current agent description
 * @param {string} params.agentName - Name of the agent
 * @param {string} params.agentType - Type/personality of the agent
 * @returns {Promise<Object>} Generated descriptions and metadata
 */
export const generateAgentDescription = async ({
  currentDescription,
  agentName,
  agentType = 'general_assistant'
}) => {
  try {
    const response = await api.post('/api/agents/generate-description', {
      current_description: currentDescription,
      agent_name: agentName,
      agent_type: agentType,
      model: 'gpt-5',
      temperature: 0.7,
      variations: 3
    });

    return {
      success: true,
      descriptions: response.data.descriptions || [],
      metadata: response.data.metadata || {}
    };
  } catch (error) {
    console.error('Error generating agent description:', error);

    // Handle specific error cases
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in and try again.');
    } else if (error.response?.status === 503) {
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }

    // Generic error message
    throw new Error(
      error.response?.data?.message ||
      'Failed to generate description. Please try again.'
    );
  }
};

/**
 * Enhance an existing description with specific improvements
 *
 * @param {Object} params - Parameters for description enhancement
 * @param {string} params.description - The description to enhance
 * @param {string[]} params.improvements - List of improvements to apply
 * @returns {Promise<Object>} Enhanced description
 */
export const enhanceAgentDescription = async ({
  description,
  improvements = ['clarity', 'conciseness', 'professionalism']
}) => {
  try {
    const response = await api.post('/api/agents/enhance-description', {
      description,
      improvements,
      model: 'gpt-5',
      temperature: 0.5
    });

    return {
      success: true,
      enhancedDescription: response.data.enhanced_description,
      changes: response.data.changes || []
    };
  } catch (error) {
    console.error('Error enhancing agent description:', error);
    throw new Error(
      error.response?.data?.message ||
      'Failed to enhance description. Please try again.'
    );
  }
};

/**
 * Generate a description from scratch based on agent configuration
 *
 * @param {Object} params - Parameters for description creation
 * @param {string} params.agentName - Name of the agent
 * @param {string} params.agentType - Type/personality template
 * @param {string[]} params.capabilities - List of agent capabilities
 * @param {string} params.industry - Industry or domain
 * @returns {Promise<Object>} Generated description
 */
export const createAgentDescription = async ({
  agentName,
  agentType,
  capabilities = [],
  industry = 'general'
}) => {
  try {
    const response = await api.post('/api/agents/create-description', {
      agent_name: agentName,
      agent_type: agentType,
      capabilities,
      industry,
      model: 'gpt-5',
      temperature: 0.8
    });

    return {
      success: true,
      description: response.data.description,
      keywords: response.data.keywords || []
    };
  } catch (error) {
    console.error('Error creating agent description:', error);
    throw new Error(
      error.response?.data?.message ||
      'Failed to create description. Please try again.'
    );
  }
};