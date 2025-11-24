/**
 * Advanced Features
 *
 * Main component for the Advanced tab in Agent Editor
 * Uses the feature registry system for maintainable feature management
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Container
} from '@mui/material';

import AdvancedFeatureCard from './AdvancedFeatureCard';
import featureRegistry from './FeatureRegistry';

const AdvancedFeatures = ({
  agent,
  onAgentUpdate,
  disabled = false,
  onNotification
}) => {
  const [openModal, setOpenModal] = useState(null);

  const handleConfigure = (featureId) => {
    setOpenModal(featureId);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  const handleFeatureToggle = (featureId, enabled) => {
    let updatedAgent;

    if (enabled) {
      // Get default configuration and update agent
      const defaultConfig = featureRegistry.getDefaultConfig(featureId);
      updatedAgent = featureRegistry.updateAgentWithFeature(featureId, agent, defaultConfig);
    } else {
      // Disable feature
      updatedAgent = featureRegistry.disableFeature(featureId, agent);
    }

    onAgentUpdate(updatedAgent);

    if (onNotification) {
      const feature = featureRegistry.getFeature(featureId);
      onNotification({
        message: `${feature.title} ${enabled ? 'enabled' : 'disabled'} successfully`,
        severity: enabled ? 'success' : 'info',
        timestamp: Date.now()
      });
    }
  };

  const handleSave = (featureId, configuration) => {
    const updatedAgent = featureRegistry.updateAgentWithFeature(featureId, agent, configuration);
    onAgentUpdate(updatedAgent);

    if (onNotification) {
      const feature = featureRegistry.getFeature(featureId);
      onNotification({
        message: `${feature.title} configured successfully`,
        severity: 'success',
        timestamp: Date.now()
      });
    }

    handleCloseModal();
  };

  // Get features from registry
  const availableFeatures = featureRegistry.getAvailableFeatures();

  // Get enabled features count
  const enabledCount = featureRegistry.getEnabledFeaturesCount(agent);

  // Render active modal
  const renderModal = () => {
    if (!openModal) return null;

    const ModalComponent = featureRegistry.getModal(openModal);
    if (!ModalComponent) return null;

    return (
      <ModalComponent
        open={true}
        onClose={handleCloseModal}
        onSave={handleSave}
        agent={agent}
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Advanced Features
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Configure advanced AI agent capabilities for enhanced security, performance, and user experience.
          {enabledCount > 0 && ` (${enabledCount} feature${enabledCount !== 1 ? 's' : ''} enabled)`}
        </Typography>

      </Box>

      {/* Available Features */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Available Features
        </Typography>
        <Grid container spacing={3}>
          {availableFeatures.map((feature) => {
            const featureStatus = featureRegistry.getFeatureStatus(feature.id, agent);

            return (
              <Grid item xs={12} md={6} key={feature.id}>
                <AdvancedFeatureCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  enabled={featureStatus.enabled}
                  status={featureStatus.status}
                  statusColor={featureStatus.statusColor}
                  onConfigure={() => handleConfigure(feature.id)}
                  onToggle={(enabled) => handleFeatureToggle(feature.id, enabled)}
                  disabled={disabled}
                  comingSoon={feature.comingSoon}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>


      {/* Configuration Modals */}
      {renderModal()}
    </Container>
  );
};

export default AdvancedFeatures;