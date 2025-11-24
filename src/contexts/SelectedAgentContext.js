/**
 * Selected Agent Context
 *
 * Provides global state for the currently selected agent
 * Used by MainContainer to set the selected agent and Layout to access it
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';

const SelectedAgentContext = createContext();

export const useSelectedAgent = () => {
  const context = useContext(SelectedAgentContext);
  if (!context) {
    throw new Error('useSelectedAgent must be used within a SelectedAgentProvider');
  }
  return context;
};

export const SelectedAgentProvider = ({ children }) => {
  const [selectedAgentId, setSelectedAgentIdState] = useState(null);
  const { currentUser, currentProject } = useAuth();

  // Set selected agent (no Firestore persistence)
  const setSelectedAgentId = useCallback((agentId) => {
    console.log('🤖 Setting selected agent:', agentId);
    setSelectedAgentIdState(agentId);
  }, []);

  // Clear agent when user logs out
  useEffect(() => {
    if (!currentUser) {
      setSelectedAgentIdState(null);
    }
  }, [currentUser]);

  // Clear selected agent when project changes
  useEffect(() => {
    if (currentProject) {
      console.log('🔄 Project changed to:', currentProject, '- Clearing selected agent');
      setSelectedAgentIdState(null);
    }
  }, [currentProject]);

  const value = {
    selectedAgentId,
    setSelectedAgentId
  };

  return (
    <SelectedAgentContext.Provider value={value}>
      {children}
    </SelectedAgentContext.Provider>
  );
};
