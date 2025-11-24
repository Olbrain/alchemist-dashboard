/**
 * Prompt Progress Indicator Component
 *
 * Visual progress tracker showing completion status of all prompt sections
 */
import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { SECTION_METADATA, getAllSectionNames } from '../../services/prompts/promptBuilderService';

const PromptProgressIndicator = ({
  progress,
  sections,
  activeSection,
  onSectionClick,
  compact = false
}) => {
  const allSections = getAllSectionNames();

  if (!progress) {
    return null;
  }

  const {
    total_sections,
    completed_sections,
    total_fields,
    completed_fields,
    completion_percentage,
    all_sections_complete,
    all_fields_complete,
    total_characters,
    estimated_tokens
  } = progress;

  // Compact view - just stats and progress bar
  if (compact) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Prompt Progress
          </Typography>
          <Chip
            label={`${completed_fields || 0}/${total_fields || 0} Fields`}
            color={all_fields_complete ? 'success' : 'primary'}
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={completion_percentage}
          color={all_fields_complete ? 'success' : 'primary'}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {completion_percentage}% • {total_characters} chars • ~{estimated_tokens} tokens
        </Typography>
      </Box>
    );
  }

  // Full view - detailed section list
  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
      {/* Header with overall stats */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Build Progress
          </Typography>
          {all_fields_complete && (
            <Chip
              icon={<CheckCircleIcon />}
              label="All Complete"
              color="success"
              size="small"
            />
          )}
        </Box>

        <LinearProgress
          variant="determinate"
          value={completion_percentage}
          color={all_fields_complete ? 'success' : 'primary'}
          sx={{ height: 10, borderRadius: 5, mb: 1 }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            {completed_fields || 0} of {total_fields || 0} fields
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {completed_sections.length} of {total_sections} sections
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {total_characters.toLocaleString()} characters
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ~{estimated_tokens.toLocaleString()} tokens
          </Typography>
        </Box>
      </Box>

      {/* Section list */}
      <List dense sx={{ py: 0 }}>
        {allSections.map((sectionName, index) => {
          const metadata = SECTION_METADATA[sectionName];
          const section = sections?.[sectionName];
          const isCompleted = completed_sections.includes(sectionName);
          const isActive = activeSection === sectionName;
          // Calculate content length from object (content is now a map, not a string)
          const contentLength = section?.content
            ? JSON.stringify(section.content).length
            : 0;

          return (
            <ListItem
              key={sectionName}
              button={!!onSectionClick}
              onClick={() => onSectionClick && onSectionClick(sectionName)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? 'action.selected' : 'action.hover'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isCompleted ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : contentLength > 0 ? (
                  <CircleIcon color="primary" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      color: isCompleted ? 'success.main' : 'text.primary'
                    }}
                  >
                    {index + 1}. {metadata.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {contentLength > 0 ? `${contentLength} chars` : 'Empty'}
                    {contentLength > 0 && contentLength < metadata.minLength && (
                      <Box component="span" sx={{ color: 'warning.main', ml: 1 }}>
                        • Needs {metadata.minLength - contentLength} more
                      </Box>
                    )}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default React.memo(PromptProgressIndicator);
