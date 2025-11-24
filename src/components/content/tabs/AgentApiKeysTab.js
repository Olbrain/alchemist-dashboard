/**
 * Agent API Keys Tab Component
 *
 * Wrapper component for the API Keys functionality in the Agent Profile page
 */
import React from 'react';
import AgentApiKeys from '../../AgentProfile/AgentApiKeys';

const AgentApiKeysTab = ({ agentId, agent }) => {
  return (
    <AgentApiKeys agentId={agentId} agent={agent} />
  );
};

export default AgentApiKeysTab;