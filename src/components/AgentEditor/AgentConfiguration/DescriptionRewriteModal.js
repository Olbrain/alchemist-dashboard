/**
 * Description Rewrite Modal
 *
 * Modal component for AI-powered agent description generation using GPT-5
 * Allows users to generate multiple description variations and select the best one
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  IconButton,
  Divider,
  Chip,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { generateAgentDescription, createAgentDescription } from '../../../services/ai/openaiService';

const DescriptionRewriteModal = ({
  open,
  onClose,
  currentDescription,
  agentName,
  agentType,
  onDescriptionSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedDescriptions, setGeneratedDescriptions] = useState([]);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setGeneratedDescriptions([]);
      setSelectedDescription('');
      setError(null);
      setEditMode(false);
      setEditedDescription('');
      setCopySuccess(false);
      // Auto-generate on open if no current description
      if (!currentDescription || currentDescription.trim() === '') {
        handleCreateDescription();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Generate improved descriptions based on current description
  const handleGenerateDescriptions = async () => {
    setLoading(true);
    setError(null);
    setGeneratedDescriptions([]);
    setSelectedDescription('');

    try {
      const result = await generateAgentDescription({
        currentDescription: currentDescription || '',
        agentName: agentName || 'Untitled Agent',
        agentType: agentType || 'general_assistant'
      });

      if (result.success && result.descriptions.length > 0) {
        setGeneratedDescriptions(result.descriptions);
        setSelectedDescription(result.descriptions[0]); // Auto-select first option
      } else {
        setError('No descriptions were generated. Please try again.');
      }
    } catch (err) {
      console.error('Error generating descriptions:', err);
      setError(err.message || 'Failed to generate descriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create new description from scratch
  const handleCreateDescription = async () => {
    setLoading(true);
    setError(null);
    setGeneratedDescriptions([]);
    setSelectedDescription('');

    try {
      const result = await createAgentDescription({
        agentName: agentName || 'Untitled Agent',
        agentType: agentType || 'general_assistant'
      });

      if (result.success && result.description) {
        setGeneratedDescriptions([result.description]);
        setSelectedDescription(result.description);
      } else {
        setError('Failed to create description. Please try again.');
      }
    } catch (err) {
      console.error('Error creating description:', err);
      setError(err.message || 'Failed to create description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle description selection
  const handleSelect = () => {
    const descriptionToUse = editMode ? editedDescription : selectedDescription;
    if (descriptionToUse) {
      onDescriptionSelect(descriptionToUse);
      onClose();
    }
  };

  // Copy description to clipboard
  const handleCopy = (description) => {
    navigator.clipboard.writeText(description).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Enable edit mode for selected description
  const handleEditToggle = () => {
    if (!editMode) {
      setEditedDescription(selectedDescription);
    }
    setEditMode(!editMode);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">
              AI Description Generator
            </Typography>
            <Chip
              label="GPT-5"
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
          {/* Current Description Section */}
          {currentDescription && (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    {currentDescription}
                  </Typography>
                </Paper>
              </Box>
              <Divider />
            </>
          )}

          {/* Action Buttons */}
          {!loading && !generatedDescriptions.length && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', py: 2 }}>
              {currentDescription ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleGenerateDescriptions}
                    size="large"
                  >
                    Improve Description
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleCreateDescription}
                  >
                    Generate New
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleCreateDescription}
                  size="large"
                >
                  Generate Description
                </Button>
              )}
            </Box>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating AI-powered descriptions...
              </Typography>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Generated Descriptions */}
          {!loading && generatedDescriptions.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Generated Descriptions ({generatedDescriptions.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={currentDescription ? handleGenerateDescriptions : handleCreateDescription}
                >
                  Regenerate
                </Button>
              </Box>

              {/* Edit Mode */}
              {editMode ? (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Edit the selected description..."
                    variant="outlined"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleEditToggle}
                    >
                      Save Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setEditMode(false);
                        setEditedDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <RadioGroup
                  value={selectedDescription}
                  onChange={(e) => setSelectedDescription(e.target.value)}
                >
                  {generatedDescriptions.map((description, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 2,
                        cursor: 'pointer',
                        border: selectedDescription === description ? 2 : 1,
                        borderColor: selectedDescription === description ? 'primary.main' : 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => setSelectedDescription(description)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <FormControlLabel
                          value={description}
                          control={<Radio size="small" />}
                          label=""
                          sx={{ m: 0 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            {description}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {selectedDescription === description && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditToggle();
                              }}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(description);
                            }}
                            title="Copy"
                          >
                            {copySuccess ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : (
                              <CopyIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </RadioGroup>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSelect}
          disabled={!selectedDescription && !editedDescription}
          startIcon={<CheckCircleIcon />}
        >
          Use Selected Description
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DescriptionRewriteModal;