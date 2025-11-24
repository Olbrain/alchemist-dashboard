/**
 * API to MCP Wizard Component
 *
 * Multi-step wizard for creating MCP servers from private APIs
 * Steps:
 * 1. API Input - Upload OpenAPI spec or enter API details
 * 2. Test Endpoints - Test API endpoints with credentials
 * 3. Configure MCP - Configure MCP server details
 * 4. Review & Save - Review and save the configuration
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon
} from '@mui/icons-material';

// Step components (to be created)
import ApiInputStep from './ApiInputStep';
import ApiTestingStep from './ApiTestingStep';
import McpConfigStep from './McpConfigStep';
import ReviewStep from './ReviewStep';

const steps = [
  'API Input',
  'Test Endpoints',
  'Configure MCP',
  'Review & Save'
];

const ApiToMcpWizard = ({ open, onClose, onSave, agentId }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Wizard state
  const [wizardData, setWizardData] = useState({
    // Step 1: API Input
    inputMethod: 'upload', // 'upload', 'url', 'manual'
    openApiSpec: null,
    apiUrl: '',
    parsedEndpoints: [],

    // Step 2: Test Endpoints
    authType: 'none', // 'none', 'bearer', 'api_key', 'basic', 'oauth'
    credentials: {},
    selectedEndpoints: [],
    testResults: {},

    // Step 3: Configure MCP
    mcpName: '',
    mcpDescription: '',
    mcpCategory: 'custom',
    mcpIcon: '',

    // Step 4: Generated config
    generatedConfig: null
  });

  const handleNext = () => {
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  const handleStepComplete = (stepData) => {
    setWizardData((prev) => ({ ...prev, ...stepData }));
    handleNext();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      await onSave(wizardData.generatedConfig);

      // Reset wizard
      setWizardData({
        inputMethod: 'upload',
        openApiSpec: null,
        apiUrl: '',
        parsedEndpoints: [],
        authType: 'none',
        credentials: {},
        selectedEndpoints: [],
        testResults: {},
        mcpName: '',
        mcpDescription: '',
        mcpCategory: 'custom',
        mcpIcon: '',
        generatedConfig: null
      });
      setActiveStep(0);

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save MCP server');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (activeStep > 0) {
      // Confirm before closing if user has made progress
      if (window.confirm('Are you sure you want to close? Your progress will be lost.')) {
        setActiveStep(0);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ApiInputStep
            data={wizardData}
            onComplete={handleStepComplete}
            onError={setError}
            agentId={agentId}
          />
        );
      case 1:
        return (
          <ApiTestingStep
            data={wizardData}
            onComplete={handleStepComplete}
            onError={setError}
            onBack={handleBack}
            agentId={agentId}
          />
        );
      case 2:
        return (
          <McpConfigStep
            data={wizardData}
            onComplete={handleStepComplete}
            onError={setError}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ReviewStep
            data={wizardData}
            onSave={handleSave}
            saving={saving}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  const canGoBack = activeStep > 0 && activeStep < 3;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: '800px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span">
            Create MCP from API
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleClose}
            color="inherit"
          >
            Cancel
          </Button>
          {canGoBack && (
            <Button
              onClick={handleBack}
              startIcon={<BackIcon />}
              variant="outlined"
            >
              Back
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ApiToMcpWizard;
