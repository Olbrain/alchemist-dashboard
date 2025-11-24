/**
 * usePromptBuilder Hook - Embed Mode Stub
 *
 * Returns empty prompt builder state for embed mode.
 * Firestore real-time listeners not supported in whitelabel embed.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  updatePromptField,
  markSectionComplete,
  getPromptProgress,
  exportCombinedPrompt,
  validateSectionContent,
  getAllSectionNames
} from '../services/prompts/promptBuilderService';
import {
  validatePromptSection,
  getSectionSuggestions,
  checkPromptConsistency,
  improveSectionContent,
  analyzePromptCompleteness,
  getQuickValidationStatus
} from '../services/prompts/promptValidationService';

const usePromptBuilder = (agentId) => {
  const [sections, setSections] = useState({});
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('identity'); // Default to first section

  // AI Validation state
  const [validationResults, setValidationResults] = useState({});
  const [validating, setValidating] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [checkingConsistency, setCheckingConsistency] = useState(false);
  const [completenessReport, setCompletenessReport] = useState(null);
  const [analyzingCompleteness, setAnalyzingCompleteness] = useState(false);

  // Auto-save timeout refs
  const autoSaveTimeouts = useRef({});
  const validationCache = useRef({});

  /**
   * Set up real-time listener for prompt sections
   * Automatically updates UI when Firestore data changes
   */
  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // EMBED MODE: Firestore real-time listeners not supported
    // Return empty state immediately
    setLoading(false);
    setSections({});
    return () => {}; // No cleanup needed

    /* DISABLED: Firestore real-time listener for embed mode
    const promptsCollection = collection(db, Collections.AGENTS, agentId, 'prompts');

    const unsubscribe = onSnapshot(
      promptsCollection,
      (snapshot) => {
        try {
          // Build sections object from snapshot
          const sectionsData = {};
          const sectionsRawData = {}; // Keep original Firestore data for field completion tracking

          snapshot.forEach((doc) => {
            const sectionData = doc.data();

            // Store raw data with field objects
            sectionsRawData[doc.id] = sectionData;

            // Transform content: {field: {value, completed}} → {field: value}
            const content = sectionData.content || {};
            const transformedContent = {};

            Object.entries(content).forEach(([key, fieldObj]) => {
              // Handle new format {value, completed} and old flat format
              if (fieldObj && typeof fieldObj === 'object' && 'value' in fieldObj) {
                transformedContent[key] = fieldObj.value;
              } else {
                transformedContent[key] = fieldObj; // Backward compatibility
              }
            });

            sectionsData[doc.id] = {
              ...sectionData,
              content: transformedContent // Flattened for forms
            };
          });

          setSections(sectionsData);

          // Calculate progress from field-level completion
          const allSectionNames = getAllSectionNames();
          const completedSections = [];
          const pendingSections = [];
          let totalCharacters = 0;
          let completedFieldsCount = 0;
          let totalFieldsCount = 0;

          allSectionNames.forEach((sectionName) => {
            const section = sectionsData[sectionName];
            const rawSection = sectionsRawData[sectionName];

            // Track section-level completion
            if (section?.completed) {
              completedSections.push(sectionName);
            } else {
              pendingSections.push(sectionName);
            }

            // Count field-level completion
            const content = rawSection?.content || {};
            Object.entries(content).forEach(([fieldName, fieldObj]) => {
              totalFieldsCount++;
              if (fieldObj && typeof fieldObj === 'object' && fieldObj.completed) {
                completedFieldsCount++;
              }
            });

            // Calculate character count
            if (section?.content) {
              const contentStr = JSON.stringify(section.content);
              totalCharacters += contentStr.length;
            }
          });

          const completionPercentage = totalFieldsCount > 0
            ? Math.round((completedFieldsCount / totalFieldsCount) * 100)
            : 0;

          setProgress({
            total_sections: allSectionNames.length,
            completed_sections: completedSections,
            pending_sections: pendingSections,
            total_fields: totalFieldsCount,
            completed_fields: completedFieldsCount,
            completion_percentage: completionPercentage,
            all_sections_complete: completedSections.length === allSectionNames.length,
            all_fields_complete: completedFieldsCount === totalFieldsCount && totalFieldsCount > 0,
            total_characters: totalCharacters,
            estimated_tokens: Math.ceil(totalCharacters / 4)
          });

          // Set active section to first pending, or first if all complete
          if (pendingSections.length > 0 && !activeSection) {
            setActiveSection(pendingSections[0]);
          } else if (!activeSection) {
            setActiveSection(allSectionNames[0]);
          }

          setLoading(false);
        } catch (err) {
          console.error('Error processing prompt sections:', err);
          setError(err.message || 'Failed to process prompt sections');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to prompt sections:', err);
        setError(err.message || 'Failed to load prompt sections');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
    */ // End of disabled Firestore code
  }, [agentId, activeSection]);

  /**
   * Update a single field in a section (calls backend API directly)
   */
  const updateField = useCallback(async (sectionName, fieldName, fieldValue, debounce = true) => {
    if (!agentId) return;

    try {
      // Update local state immediately
      setSections(prev => {
        const currentContent = prev[sectionName]?.content || '{}';
        let contentObj = {};
        try {
          contentObj = typeof currentContent === 'string' ? JSON.parse(currentContent) : currentContent;
        } catch (e) {
          contentObj = {};
        }

        contentObj[fieldName] = fieldValue;

        return {
          ...prev,
          [sectionName]: {
            ...prev[sectionName],
            content: JSON.stringify(contentObj),
            updated_at: new Date()
          }
        };
      });

      // Create unique key for this field's timeout
      const timeoutKey = `${sectionName}.${fieldName}`;

      // Clear existing timeout for this field
      if (autoSaveTimeouts.current[timeoutKey]) {
        clearTimeout(autoSaveTimeouts.current[timeoutKey]);
      }

      const saveField = async () => {
        try {
          setSaving(true);
          await updatePromptField(agentId, sectionName, fieldName, fieldValue);

          // Refresh progress after save
          const progressData = await getPromptProgress(agentId);
          setProgress(progressData);
        } catch (err) {
          console.error(`Error saving field ${sectionName}.${fieldName}:`, err);
          setError(`Failed to save ${fieldName}: ${err.message}`);
        } finally {
          setSaving(false);
        }
      };

      if (debounce) {
        // Debounced save (for text inputs)
        autoSaveTimeouts.current[timeoutKey] = setTimeout(saveField, 1000);
      } else {
        // Immediate save (for selects, checkboxes)
        await saveField();
      }
    } catch (err) {
      console.error(`Error updating field ${sectionName}.${fieldName}:`, err);
      setError(err.message || 'Failed to update field');
      setSaving(false);
    }
  }, [agentId]);

  /**
   * Update entire section content (legacy support - for AI suggestions that provide full content)
   */
  const updateSection = useCallback(async (sectionName, content) => {
    if (!agentId) return;

    try {
      // Parse content to extract fields
      let contentObj = {};
      try {
        contentObj = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        console.error('Invalid content format:', e);
        return;
      }

      // Update each field separately
      for (const [fieldName, fieldValue] of Object.entries(contentObj)) {
        await updateField(sectionName, fieldName, fieldValue, false);
      }
    } catch (err) {
      console.error('Error updating section:', err);
      setError(err.message || 'Failed to update section');
    }
  }, [agentId, updateField]);

  /**
   * Mark a section as complete/incomplete
   */
  const toggleSectionComplete = useCallback(async (sectionName) => {
    if (!agentId) return;

    try {
      setSaving(true);
      setError(null);

      const currentSection = sections[sectionName];
      const newCompletedState = !currentSection.completed;

      // Validate before marking as complete
      if (newCompletedState) {
        const validation = validateSectionContent(sectionName, currentSection.content);
        if (!validation.canComplete) {
          setError(validation.warning || 'Section content is insufficient');
          setSaving(false);
          return;
        }
      }

      await markSectionComplete(agentId, sectionName, newCompletedState);

      // Update local state
      setSections(prev => ({
        ...prev,
        [sectionName]: {
          ...prev[sectionName],
          completed: newCompletedState,
          completed_at: newCompletedState ? new Date() : null
        }
      }));

      // Refresh progress
      const progressData = await getPromptProgress(agentId);
      setProgress(progressData);
    } catch (err) {
      console.error('Error toggling section complete:', err);
      setError(err.message || 'Failed to update section status');
    } finally {
      setSaving(false);
    }
  }, [agentId, sections]);

  /**
   * Get combined prompt export
   */
  const getCombinedPrompt = useCallback(async () => {
    if (!agentId) return '';

    try {
      return await exportCombinedPrompt(agentId);
    } catch (err) {
      console.error('Error exporting combined prompt:', err);
      setError(err.message || 'Failed to export prompt');
      return '';
    }
  }, [agentId]);

  /**
   * Validate a section
   */
  const validateSection = useCallback((sectionName, content) => {
    return validateSectionContent(sectionName, content);
  }, []);

  /**
   * Navigate to next pending section
   */
  const goToNextPending = useCallback(() => {
    if (!progress || !activeSection) return;

    const currentIndex = progress.pending_sections.indexOf(activeSection);
    if (currentIndex >= 0 && currentIndex < progress.pending_sections.length - 1) {
      setActiveSection(progress.pending_sections[currentIndex + 1]);
    }
  }, [progress, activeSection]);

  /**
   * Navigate to previous section
   */
  const goToPrevious = useCallback(() => {
    const allSections = getAllSectionNames();
    const currentIndex = allSections.indexOf(activeSection);

    if (currentIndex > 0) {
      setActiveSection(allSections[currentIndex - 1]);
    }
  }, [activeSection]);

  /**
   * Navigate to next section
   */
  const goToNext = useCallback(() => {
    const allSections = getAllSectionNames();
    const currentIndex = allSections.indexOf(activeSection);

    if (currentIndex < allSections.length - 1) {
      setActiveSection(allSections[currentIndex + 1]);
    }
  }, [activeSection]);

  /**
   * Refresh progress
   */
  const refreshProgress = useCallback(async () => {
    if (!agentId) return;

    try {
      const progressData = await getPromptProgress(agentId);
      setProgress(progressData);
    } catch (err) {
      console.error('Error refreshing progress:', err);
    }
  }, [agentId]);

  /**
   * Validate a specific section using AI
   */
  const validateSectionWithAI = useCallback(async (sectionName, agentContext = null) => {
    if (!agentId || !sections[sectionName]) return null;

    const content = sections[sectionName].content;

    // Check quick validation status first
    const quickStatus = getQuickValidationStatus(sectionName, content);
    if (!quickStatus.canValidate) {
      return {
        ...quickStatus,
        quality_score: 0,
        issues: [{
          type: 'empty_content',
          severity: 'critical',
          message: quickStatus.message,
          suggestion: 'Add content to this section before validation'
        }],
        missing_elements: [],
        recommendations: [],
        strengths: []
      };
    }

    // Check cache first
    const cacheKey = `${sectionName}_${content.length}`;
    if (validationCache.current[cacheKey]) {
      console.log(`Using cached validation for ${sectionName}`);
      return validationCache.current[cacheKey];
    }

    try {
      setValidating(true);
      const result = await validatePromptSection(agentId, sectionName, content, agentContext);

      // Cache result
      validationCache.current[cacheKey] = result;

      // Store in state
      setValidationResults(prev => ({
        ...prev,
        [sectionName]: result
      }));

      return result;
    } catch (err) {
      console.error(`Error validating section ${sectionName}:`, err);
      return {
        error: err.message,
        quality_score: 0,
        issues: [],
        missing_elements: [],
        recommendations: [],
        strengths: []
      };
    } finally {
      setValidating(false);
    }
  }, [agentId, sections]);

  /**
   * Get suggestions for a section
   */
  const getSuggestionsForSection = useCallback(async (sectionName, agentContext) => {
    if (!agentId || !agentContext) return null;

    const currentContent = sections[sectionName]?.content || null;

    try {
      setLoadingSuggestions(true);
      const result = await getSectionSuggestions(agentId, sectionName, agentContext, currentContent);

      setSuggestions(prev => ({
        ...prev,
        [sectionName]: result
      }));

      return result;
    } catch (err) {
      console.error(`Error getting suggestions for ${sectionName}:`, err);
      return {
        error: err.message,
        suggestions: [],
        examples: [],
        best_practices: []
      };
    } finally {
      setLoadingSuggestions(false);
    }
  }, [agentId, sections]);

  /**
   * Check consistency across all sections
   */
  const checkAllSectionsConsistency = useCallback(async () => {
    if (!agentId) return null;

    try {
      setCheckingConsistency(true);

      // Only check populated sections
      const sectionsToCheck = {};
      Object.entries(sections).forEach(([name, data]) => {
        if (data.content && data.content.trim()) {
          sectionsToCheck[name] = data.content;
        }
      });

      if (Object.keys(sectionsToCheck).length < 2) {
        return {
          error: 'Need at least 2 sections to check consistency',
          overall_consistency_score: 100,
          conflicts: [],
          alignments: [],
          gaps: [],
          recommendations: []
        };
      }

      const result = await checkPromptConsistency(agentId, sectionsToCheck);
      setConsistencyReport(result);

      return result;
    } catch (err) {
      console.error('Error checking consistency:', err);
      return {
        error: err.message,
        overall_consistency_score: 50,
        conflicts: [],
        alignments: [],
        gaps: [],
        recommendations: []
      };
    } finally {
      setCheckingConsistency(false);
    }
  }, [agentId, sections]);

  /**
   * Improve section content using AI
   */
  const improveSectionWithAI = useCallback(async (sectionName, improvementFocus = null, agentContext = null) => {
    if (!agentId || !sections[sectionName]) return null;

    const content = sections[sectionName].content;

    if (!content || !content.trim()) {
      return {
        error: 'Cannot improve empty content',
        improved_content: '',
        changes_made: [],
        improvement_score: 0,
        alternative_versions: []
      };
    }

    try {
      setValidating(true);
      const result = await improveSectionContent(agentId, sectionName, content, improvementFocus, agentContext);

      return result;
    } catch (err) {
      console.error(`Error improving section ${sectionName}:`, err);
      return {
        error: err.message,
        improved_content: content,
        changes_made: [],
        improvement_score: 0,
        alternative_versions: []
      };
    } finally {
      setValidating(false);
    }
  }, [agentId, sections]);

  /**
   * Analyze overall completeness
   */
  const analyzeOverallCompleteness = useCallback(async (agentContext = null) => {
    if (!agentId) return null;

    try {
      setAnalyzingCompleteness(true);

      // Prepare sections content
      const sectionsContent = {};
      Object.entries(sections).forEach(([name, data]) => {
        sectionsContent[name] = data.content || '';
      });

      const result = await analyzePromptCompleteness(agentId, sectionsContent, agentContext);
      setCompletenessReport(result);

      return result;
    } catch (err) {
      console.error('Error analyzing completeness:', err);
      return {
        error: err.message,
        completeness_score: 0,
        readiness_level: 'unknown',
        completed_sections: [],
        incomplete_sections: [],
        overall_quality_score: 0,
        strengths: [],
        critical_gaps: [],
        next_steps: [],
        estimated_time_to_complete: 'Unknown'
      };
    } finally {
      setAnalyzingCompleteness(false);
    }
  }, [agentId, sections]);

  /**
   * Clear validation results for a section
   */
  const clearValidationForSection = useCallback((sectionName) => {
    setValidationResults(prev => {
      const newResults = { ...prev };
      delete newResults[sectionName];
      return newResults;
    });

    // Clear cache entries for this section
    Object.keys(validationCache.current).forEach(key => {
      if (key.startsWith(`${sectionName}_`)) {
        delete validationCache.current[key];
      }
    });
  }, []);

  /**
   * Clear all validation results
   */
  const clearAllValidation = useCallback(() => {
    setValidationResults({});
    setSuggestions({});
    setConsistencyReport(null);
    setCompletenessReport(null);
    validationCache.current = {};
  }, []);

  // Cleanup auto-save timeouts on unmount
  useEffect(() => {
    const timeouts = autoSaveTimeouts.current;
    return () => {
      Object.values(timeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return {
    // State
    sections,
    progress,
    loading,
    saving,
    error,
    activeSection,

    // AI Validation State
    validationResults,
    validating,
    suggestions,
    loadingSuggestions,
    consistencyReport,
    checkingConsistency,
    completenessReport,
    analyzingCompleteness,

    // Actions
    setActiveSection,
    updateField,
    updateSection,
    toggleSectionComplete,
    getCombinedPrompt,
    validateSection,
    refreshProgress,

    // AI Validation Actions
    validateSectionWithAI,
    getSuggestionsForSection,
    checkAllSectionsConsistency,
    improveSectionWithAI,
    analyzeOverallCompleteness,
    clearValidationForSection,
    clearAllValidation,

    // Navigation
    goToNextPending,
    goToPrevious,
    goToNext,

    // Computed values
    isComplete: progress?.all_sections_complete || false,
    completionPercentage: progress?.completion_percentage || 0,
    totalSections: progress?.total_sections || 0,
    completedCount: progress?.completed_sections?.length || 0
  };
};

export default usePromptBuilder;
