/**
 * Prompt Template Selector Component
 *
 * Gallery dialog for selecting and applying pre-built prompt templates
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { getAllTemplates } from '../../services/prompts/promptTemplates';

const PromptTemplateSelector = ({
  open,
  onClose,
  onSelectTemplate,
  currentSections
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const templates = getAllTemplates();

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    setPreviewTemplate(template);
  };

  const handleApply = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setPreviewTemplate(null);
    onClose();
  };

  // Check if any sections have content
  const hasContent = currentSections && Object.values(currentSections).some(
    section => section?.content && section.content.trim().length > 0
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Choose a Prompt Template
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {hasContent && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Applying a template will replace all existing content in all sections. This action cannot be undone.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a pre-built template to get started quickly. You can customize any section after applying.
        </Typography>

        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} key={template.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: 2,
                  borderColor: selectedTemplate === template.id ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleSelectTemplate(template.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4">{template.icon}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {template.name}
                      </Typography>
                    </Box>
                    {selectedTemplate === template.id && (
                      <CheckCircleIcon color="primary" />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {template.description}
                  </Typography>

                  <Chip
                    label="8 sections included"
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </CardContent>

                {selectedTemplate === template.id && (
                  <CardActions sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Show preview in future
                      }}
                    >
                      Preview
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Template Preview Section */}
        {previewTemplate && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              What's included:
            </Typography>
            <Grid container spacing={1}>
              {Object.keys(previewTemplate.sections).map((section) => (
                <Grid item xs={6} key={section}>
                  <Chip
                    label={section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    size="small"
                    icon={<CheckCircleIcon />}
                    color="success"
                    variant="outlined"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!selectedTemplate}
        >
          Apply Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptTemplateSelector;
