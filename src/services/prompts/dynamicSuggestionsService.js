/**
 * Dynamic Suggestions Service
 *
 * Service layer for generating contextual quick-add suggestions for the prompt builder.
 * Provides a hybrid approach: curated templates for fast display + AI-powered customization
 * based on agent type, industry, use case, and target users.
 */
import { getTemplateSuggestions } from './suggestionTemplates';

// Get API base URL from environment
// IMPORTANT: This service now uses the dedicated AI Builder service for suggestions
// Fall back to agent-engine if AI_STUDIO_URL is not set (for backward compatibility during migration)
const API_BASE_URL = process.env.REACT_APP_AGENT_BUILDER_AI_SERVICE_URL

/**
 * In-memory cache for AI-generated suggestions
 * Key format: `${agentId}_${sectionName}`
 * Since backend fetches all completed sections from Firestore,
 * cache is per-agent and per-section
 */
const suggestionsCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/**
 * Generate cache key from agent ID and section
 */
const getCacheKey = (agentId, sectionName) => {
  return `${agentId}_${sectionName}`;
};

/**
 * Get cached suggestions if available and not expired
 */
const getCachedSuggestions = (cacheKey) => {
  const cached = suggestionsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached suggestions for ${cacheKey}`);
    return cached.suggestions;
  }
  return null;
};

/**
 * Cache suggestions
 */
const cacheSuggestions = (cacheKey, suggestions) => {
  suggestionsCache.set(cacheKey, {
    suggestions,
    timestamp: Date.now()
  });
};

/**
 * Get dynamic suggestions for a section with hybrid approach
 *
 * Strategy:
 * 1. Return template suggestions immediately for fast display
 * 2. Check cache for AI-enhanced suggestions
 * 3. If not cached, call API to generate AI suggestions
 * 4. Return AI suggestions when available, fallback to templates on error
 *
 * @param {string} agentId - The agent ID (not used in current implementation but kept for API consistency)
 * @param {string} sectionName - Section name (objectives, expertise, constraints, communication_guidelines, behavioral_rules)
 * @param {Object} agentContext - Agent context {agent_type, industry, use_case, target_users}
 * @param {number} count - Number of suggestions to request (default: 6)
 * @returns {Promise<Object>} Suggestions result with suggestions array and metadata
 */
export const getDynamicSuggestions = async (agentId, sectionName, agentContext, count = 6) => {
  try {
    console.log(`Getting dynamic suggestions for agent ${agentId}, section ${sectionName}`);

    // Get template suggestions as immediate fallback
    const templateSuggestions = getTemplateSuggestions(
      agentContext?.agent_type || 'general',
      sectionName
    );

    // If no agent ID, just return templates
    if (!agentId) {
      return {
        suggestions: templateSuggestions,
        source: 'template',
        fallback_suggestions: [],
        context_used: agentContext
      };
    }

    // Check cache first
    const cacheKey = getCacheKey(agentId, sectionName);
    const cachedSuggestions = getCachedSuggestions(cacheKey);

    if (cachedSuggestions) {
      return {
        suggestions: cachedSuggestions,
        source: 'cached',
        fallback_suggestions: templateSuggestions,
        context_used: agentContext
      };
    }

    // Call API to generate contextual suggestions
    // API will fetch all completed sections from Firestore using agent_id
    const response = await fetch(`${API_BASE_URL}/api/prompts/generate-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        section_name: sectionName,
        count: count
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const result = await response.json();

    // If AI generation succeeded, cache and return
    if (result.status === 'success' && result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
      cacheSuggestions(cacheKey, result.suggestions);
      return {
        suggestions: result.suggestions,
        source: 'ai',
        fallback_suggestions: templateSuggestions,
        context_used: agentContext
      };
    }

    // If AI failed, return templates
    console.warn(`AI suggestions failed for ${sectionName}, using templates`);
    return {
      suggestions: templateSuggestions,
      source: 'template_fallback',
      fallback_suggestions: [],
      context_used: agentContext,
      error: result.message || 'AI generation failed'
    };

  } catch (error) {
    console.error('Error getting dynamic suggestions:', error);

    // On any error, return template suggestions
    const templateSuggestions = getTemplateSuggestions(
      agentContext?.agent_type || 'general',
      sectionName
    );

    return {
      suggestions: templateSuggestions,
      source: 'template_error_fallback',
      fallback_suggestions: [],
      context_used: agentContext,
      error: error.message || 'Failed to get suggestions'
    };
  }
};

/**
 * Get template-only suggestions (fast, no AI call)
 * Useful for immediate display while AI suggestions load
 *
 * @param {string} agentType - Agent type (customer_service, sales, technical, content, general)
 * @param {string} sectionName - Section name
 * @returns {Array<string>} Array of suggestion strings
 */
export const getTemplateSuggestionsOnly = (agentType, sectionName) => {
  return getTemplateSuggestions(agentType || 'general', sectionName);
};

/**
 * Preload suggestions for multiple sections
 * Useful for warming up the cache when agent is loaded
 *
 * @param {string} agentId - The agent ID
 * @param {Array<string>} sectionNames - Array of section names to preload
 * @param {Object} agentContext - Agent context
 * @returns {Promise<Object>} Object mapping section names to suggestions
 */
export const preloadSuggestions = async (agentId, sectionNames, agentContext) => {
  try {
    console.log(`Preloading suggestions for ${sectionNames.length} sections`);

    // Load all sections in parallel
    const loadPromises = sectionNames.map(sectionName =>
      getDynamicSuggestions(agentId, sectionName, agentContext)
        .then(result => ({ sectionName, result }))
        .catch(error => ({ sectionName, error: error.message }))
    );

    const results = await Promise.all(loadPromises);

    // Convert to object mapping
    const suggestionsMap = {};
    results.forEach(({ sectionName, result, error }) => {
      if (error) {
        console.error(`Failed to preload ${sectionName}:`, error);
      } else {
        suggestionsMap[sectionName] = result;
      }
    });

    return suggestionsMap;
  } catch (error) {
    console.error('Error preloading suggestions:', error);
    return {};
  }
};

/**
 * Clear cache for specific section or all sections
 *
 * @param {string} agentId - Optional agent ID
 * @param {string} sectionName - Optional section name, if omitted clears all for agent
 */
export const clearSuggestionsCache = (agentId = null, sectionName = null) => {
  if (agentId && sectionName) {
    const cacheKey = getCacheKey(agentId, sectionName);
    suggestionsCache.delete(cacheKey);
    console.log(`Cleared cache for ${cacheKey}`);
  } else if (agentId) {
    // Clear all sections for this agent
    const keysToDelete = [];
    for (const key of suggestionsCache.keys()) {
      if (key.startsWith(`${agentId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => suggestionsCache.delete(key));
    console.log(`Cleared ${keysToDelete.length} cache entries for agent ${agentId}`);
  } else {
    suggestionsCache.clear();
    console.log('Cleared all suggestions cache');
  }
};

/**
 * Check if suggestions are cached
 *
 * @param {string} agentId - Agent ID
 * @param {string} sectionName - Section name
 * @returns {boolean} True if cached and not expired
 */
export const areSuggestionsCached = (agentId, sectionName) => {
  const cacheKey = getCacheKey(agentId, sectionName);
  return getCachedSuggestions(cacheKey) !== null;
};

/**
 * Get cache statistics
 *
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  return {
    size: suggestionsCache.size,
    keys: Array.from(suggestionsCache.keys()),
    ttl_ms: CACHE_TTL
  };
};
