import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  LinearProgress,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person as IdentityIcon,
  TrackChanges as ObjectivesIcon,
  School as ExpertiseIcon,
  Block as ConstraintsIcon,
  Psychology as PersonalityIcon,
  Chat as CommunicationIcon,
  Rule as BehavioralIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';

/**
 * Sidebar component for Prompt Builder section navigation
 * Matches McpServerSidebar design pattern (280px width)
 */
const PromptSectionSidebar = ({
  activeSection,
  onSectionChange,
  sectionStatus = {}, // { sectionId: { completed: boolean, progress: number } }
  progress = null, // { completed_sections: [], total_sections: 7 }
  completionPercentage = 0,
  isComplete = false,
  saving = false,
}) => {
  const theme = useTheme();

  const sections = [
    {
      id: 'identity',
      label: 'Identity',
      icon: <IdentityIcon />,
      description: 'Agent name, role, character'
    },
    {
      id: 'objectives',
      label: 'Objectives',
      icon: <ObjectivesIcon />,
      description: 'Primary goals and outcomes'
    },
    {
      id: 'expertise',
      label: 'Expertise',
      icon: <ExpertiseIcon />,
      description: 'Specialization and domains'
    },
    {
      id: 'constraints',
      label: 'Constraints',
      icon: <ConstraintsIcon />,
      description: 'Limitations and boundaries'
    },
    {
      id: 'personality',
      label: 'Personality',
      icon: <PersonalityIcon />,
      description: 'Traits, tone, style'
    },
    {
      id: 'communication_guidelines',
      label: 'Communication Guidelines',
      icon: <CommunicationIcon />,
      description: 'Response structure'
    },
    {
      id: 'behavioral_rules',
      label: 'Behavioral Rules',
      icon: <BehavioralIcon />,
      description: 'Protocols and procedures'
    }
  ];

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            mb: 0.5,
          }}
        >
          Prompt Builder
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            display: 'block',
            mt: 0.5,
          }}
        >
          Build your agent's system prompt
        </Typography>

        {/* Progress Indicator */}
        {progress && (
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {progress.completed_sections.length}/{progress.total_sections} Complete
              </Typography>
              {saving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircularProgress size={10} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Saving...
                  </Typography>
                </Box>
              )}
              {!saving && isComplete && (
                <CompleteIcon sx={{ fontSize: '1rem', color: theme.palette.success.main }} />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              color={isComplete ? 'success' : 'primary'}
              sx={{ height: 3, borderRadius: 2 }}
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Navigation List */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? '#555555' : '#c1c1c1',
          borderRadius: '3px',
        },
      }}>
        <List sx={{ px: 1.5, py: 0 }}>
          {sections.map((section) => {
            const isSelected = activeSection === section.id;
            const isCompleted = sectionStatus[section.id]?.completed || false;

            return (
              <ListItem key={section.id} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSectionChange(section.id)}
                  sx={{
                    borderRadius: 2,
                    mx: 0.5,
                    py: 0.75,
                    px: 1.25,
                    minHeight: 0,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                      '&:hover': {
                        bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
                        transform: 'translateX(2px)',
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.08),
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary,
                      minWidth: 36,
                      transition: 'color 0.2s ease-in-out'
                    }}
                  >
                    {section.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={section.label}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.85rem',
                      color: isSelected ? theme.palette.primary.main : 'inherit'
                    }}
                  />

                  {isCompleted && (
                    <CompleteIcon
                      sx={{
                        fontSize: '1.2rem',
                        color: theme.palette.success.main,
                        ml: 0.5,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default PromptSectionSidebar;
