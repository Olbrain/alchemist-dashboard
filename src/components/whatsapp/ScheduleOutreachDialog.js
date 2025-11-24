import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import whatsappTemplateService from '../../services/whatsapp/whatsappTemplateService';
import * as whatsappOutreachService from '../../services/whatsapp/whatsappOutreachService';

export default function ScheduleOutreachDialog({ open, onClose, agentId, contacts, createNotification }) {
  const [formData, setFormData] = useState({
    outreach_type: 'immediate',
    target_type: 'specific',
    contact_ids: [],
    tags: [],
    template_selection: 'agent_decide', // 'agent_decide' or template ID
    agent_instructions: '',
    scheduled_time: null,
    recurrence_frequency: '',
    recurrence_end_date: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [submitting, setSubmitting] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load tags and templates
  useEffect(() => {
    if (open && agentId) {
      extractTags();
      loadApprovedTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agentId]);

  const extractTags = () => {
    const tags = new Set();
    contacts.forEach(contact => {
      if (contact.tags) {
        contact.tags.forEach(tag => tags.add(tag));
      }
    });
    setAllTags(Array.from(tags));
  };

  const loadApprovedTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const allTemplates = await whatsappTemplateService.getTemplates(agentId);
      const approved = allTemplates.filter(t => t.status === 'approved');
      setTemplates(approved);
    } catch (error) {
      console.error('Error loading templates:', error);
      createNotification('warning', 'Failed to load templates. You can still use agent-based selection.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSubmit = async () => {
    // Template validation
    if (!formData.template_selection) {
      createNotification('error', 'Please select a template option');
      return;
    }

    // Agent Instructions validation (only when "Let Agent Decide")
    if (formData.template_selection === 'agent_decide' && !formData.agent_instructions.trim()) {
      createNotification('error', 'Please provide agent instructions for the agent to select a template');
      return;
    }

    if (formData.target_type === 'specific' && formData.contact_ids.length === 0) {
      createNotification('error', 'Please select at least one contact');
      return;
    }

    if (formData.target_type === 'tags' && formData.tags.length === 0) {
      createNotification('error', 'Please select at least one tag');
      return;
    }

    if (formData.outreach_type === 'scheduled' && !formData.scheduled_time) {
      createNotification('error', 'Please select a scheduled time');
      return;
    }

    if (formData.outreach_type === 'recurring') {
      if (!formData.scheduled_time) {
        createNotification('error', 'Please select a start time for recurring outreach');
        return;
      }
      if (!formData.recurrence_frequency) {
        createNotification('error', 'Please select a recurrence frequency');
        return;
      }
    }

    setSubmitting(true);
    try {
      const taskData = {
        outreach_type: formData.outreach_type,
        timezone: formData.timezone
      };

      // Add template_id if specific template selected, otherwise add agent_instructions
      if (formData.template_selection !== 'agent_decide') {
        taskData.template_id = formData.template_selection;
      } else {
        taskData.agent_instructions = formData.agent_instructions;
      }

      // Add targeting
      if (formData.target_type === 'specific') {
        taskData.contact_ids = formData.contact_ids;
        taskData.tags = [];
      } else {
        taskData.contact_ids = [];
        taskData.tags = formData.tags;
      }

      // Add scheduling info
      if (formData.outreach_type === 'scheduled' || formData.outreach_type === 'recurring') {
        const scheduledDate = formData.scheduled_time;
        taskData.scheduled_time = {
          hour: scheduledDate.getHours(),
          minute: scheduledDate.getMinutes(),
          day: scheduledDate.getDate(),
          month: scheduledDate.getMonth() + 1,
          year: scheduledDate.getFullYear()
        };
      }

      // Add recurrence info
      if (formData.outreach_type === 'recurring') {
        taskData.recurrence_frequency = formData.recurrence_frequency;
        if (formData.recurrence_end_date) {
          const endDate = formData.recurrence_end_date;
          taskData.recurrence_end_date = {
            hour: endDate.getHours(),
            minute: endDate.getMinutes(),
            day: endDate.getDate(),
            month: endDate.getMonth() + 1,
            year: endDate.getFullYear()
          };
        }
      }

      await whatsappOutreachService.createOutreachTask(agentId, taskData);

      createNotification('success', 'Outreach task scheduled successfully');
      onClose();
    } catch (error) {
      console.error('Error scheduling outreach:', error);
      createNotification('error', error.message || 'Failed to schedule outreach');
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetedContactsCount = () => {
    if (formData.target_type === 'specific') {
      return formData.contact_ids.length;
    } else {
      return contacts.filter(c =>
        c.tags && c.tags.some(tag => formData.tags.includes(tag))
      ).length;
    }
  };

  // Helper function to format datetime for input
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Schedule Outreach Campaign</DialogTitle>
      <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Outreach Type */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Outreach Type</FormLabel>
              <RadioGroup
                row
                value={formData.outreach_type}
                onChange={(e) => setFormData({ ...formData, outreach_type: e.target.value })}
              >
                <FormControlLabel value="immediate" control={<Radio />} label="Immediate" />
                <FormControlLabel value="scheduled" control={<Radio />} label="Scheduled" />
                <FormControlLabel value="recurring" control={<Radio />} label="Recurring" />
              </RadioGroup>
            </FormControl>

            {/* Scheduling */}
            {(formData.outreach_type === 'scheduled' || formData.outreach_type === 'recurring') && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={formData.outreach_type === 'recurring' ? 'Start Time' : 'Scheduled Time'}
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.scheduled_time)}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value ? new Date(e.target.value) : null })}
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: formatDateTimeLocal(new Date())
                  }}
                />

                {formData.outreach_type === 'recurring' && (
                  <>
                    <FormControl fullWidth required>
                      <InputLabel>Recurrence Frequency</InputLabel>
                      <Select
                        value={formData.recurrence_frequency}
                        label="Recurrence Frequency"
                        onChange={(e) => setFormData({ ...formData, recurrence_frequency: e.target.value })}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="End Date (Optional)"
                      type="datetime-local"
                      value={formatDateTimeLocal(formData.recurrence_end_date)}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value ? new Date(e.target.value) : null })}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: formatDateTimeLocal(formData.scheduled_time || new Date())
                      }}
                    />
                  </>
                )}
              </Box>
            )}

            {/* Target Selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Target Contacts</FormLabel>
              <RadioGroup
                row
                value={formData.target_type}
                onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
              >
                <FormControlLabel value="specific" control={<Radio />} label="Specific Contacts" />
                <FormControlLabel value="tags" control={<Radio />} label="By Tags" />
              </RadioGroup>
            </FormControl>

            {formData.target_type === 'specific' ? (
              <Autocomplete
                multiple
                options={contacts}
                getOptionLabel={(option) => `${option.name} (${option.phone_number})`}
                value={contacts.filter(c => formData.contact_ids.includes(c.id))}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, contact_ids: newValue.map(c => c.id) });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Contacts"
                    placeholder="Choose contacts"
                    required
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            ) : (
              <Autocomplete
                multiple
                options={allTags}
                value={formData.tags}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, tags: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Tags"
                    placeholder="Choose tags"
                    required
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            )}

            {getTargetedContactsCount() > 0 && (
              <Alert severity="info">
                This outreach will target {getTargetedContactsCount()} contact(s)
              </Alert>
            )}

            {/* Template Selection */}
            <FormControl fullWidth required>
              <InputLabel>Select Template</InputLabel>
              <Select
                value={formData.template_selection}
                label="Select Template"
                disabled={loadingTemplates}
                onChange={(e) => setFormData({
                  ...formData,
                  template_selection: e.target.value,
                  agent_instructions: e.target.value !== 'agent_decide' ? '' : formData.agent_instructions
                })}
              >
                <MenuItem value="agent_decide">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>🤖 Let Agent Decide</Typography>
                  </Box>
                </MenuItem>
                {templates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
              {loadingTemplates && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Loading templates...
                </Typography>
              )}
            </FormControl>

            {/* Template Preview - Show only when specific template selected */}
            {formData.template_selection !== 'agent_decide' && (
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Template Preview
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {templates.find(t => t.id === formData.template_selection)?.body || ''}
                </Typography>
              </Box>
            )}

            {/* Agent Instructions - Show only when "Let Agent Decide" */}
            {formData.template_selection === 'agent_decide' && (
              <TextField
                label="Agent Instructions"
                multiline
                rows={4}
                value={formData.agent_instructions}
                onChange={(e) => setFormData({ ...formData, agent_instructions: e.target.value })}
                required
                placeholder="e.g., Reach out to these contacts about our new product launch. Be friendly and professional. Mention the special discount we're offering."
                helperText="The agent will select the most appropriate template based on your instructions"
              />
            )}

            <Alert severity="info">
              {formData.template_selection === 'agent_decide'
                ? 'The agent will analyze your instructions and automatically select the most appropriate approved template for each contact.'
                : 'The selected template will be sent to all targeted contacts. Each message will be tracked in the outreach logs.'}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Schedule Outreach'}
          </Button>
        </DialogActions>
      </Dialog>
  );
}
