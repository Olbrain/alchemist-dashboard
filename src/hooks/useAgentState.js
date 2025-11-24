/**
 * useAgentState Hook
 *
 * Custom hook for managing agent state and related operations
 * Uses ApiDataAccess for data fetching in embed mode
 */
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import dataAccess from '../services/data/DataAccessFactory';


export const useAgentState = (providedAgentId = null) => {
  const { agentId: routeAgentId } = useParams();
  const agentId = providedAgentId || routeAgentId;
  const { currentUser } = useAuth();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const unsubscribeRef = useRef(null);

  // Load agent data via API with polling subscription
  useEffect(() => {
    if (!currentUser || !agentId) {
      setLoading(false);
      return;
    }

    console.log(`Setting up API polling for agent ${agentId}`);
    setLoading(true);
    setError('');

    try {
      // Use ApiDataAccess subscription (5-second polling)
      unsubscribeRef.current = dataAccess.subscribeToAgent(agentId, (agentData) => {
        console.log('Agent data received from API:', agentData);

        if (agentData) {
          // Process agent data for UI compatibility
          const processedAgent = {
            id: agentData.id || agentData.agent_id,
            ...agentData,
            // Extract fields from basic_info if they exist
            name: agentData.basic_info?.name || agentData.name,
            description: agentData.basic_info?.description || agentData.description
          };

          console.log('Processed agent data:', processedAgent);
          setAgent(processedAgent);
          setError('');
        } else {
          console.warn('Agent not found');
          setAgent(null);
          setError('Agent not found');
        }

        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up agent subscription:', err);
      setError('Failed to initialize agent data');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up agent subscription');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser, agentId]);

  // Update agent data locally (optimistic updates)
  const updateAgentLocal = (updates) => {
    setAgent(prevAgent => prevAgent ? { ...prevAgent, ...updates } : null);
  };

  // Set saving state
  const setSavingState = (isSaving) => {
    setSaving(isSaving);
  };

  // Set error state
  const setErrorState = (errorMessage) => {
    setError(errorMessage);
  };

  // Clear error
  const clearError = () => {
    setError('');
  };

  return {
    agent,
    agentId,
    loading,
    error,
    saving,
    updateAgentLocal,
    setSaving: setSavingState,
    setError: setErrorState,
    clearError
  };
};

export default useAgentState;