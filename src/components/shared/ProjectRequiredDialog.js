/**
 * Project Required Dialog
 * 
 * Informative dialog that explains why projects are required before creating agents
 * and provides clear options for the user to proceed or cancel.
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  SmartToy as AgentIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const ProjectRequiredDialog = ({ 
  open, 
  onClose, 
  onCreateProject,
  title = "Project Required",
  loading = false 
}) => {
  const theme = useTheme();

  const handleCreateProject = () => {
    onCreateProject?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box 
            sx={{ 
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}
          >
            <ProjectIcon />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1, pb: 3 }}>
        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
          Before creating an agent, you need to create a project first. Projects help 
          organize and manage your AI agents by grouping related agents together.
        </Typography>
        
        {/* Visual flow illustration */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2,
            p: 3,
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderRadius: 2,
            mb: 2
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <ProjectIcon 
              sx={{ 
                fontSize: 40, 
                color: theme.palette.primary.main,
                mb: 1 
              }} 
            />
            <Typography variant="body2" fontWeight={600}>
              Create Project
            </Typography>
          </Box>
          
          <ArrowForwardIcon 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: 24 
            }} 
          />
          
          <Box sx={{ textAlign: 'center' }}>
            <AgentIcon 
              sx={{ 
                fontSize: 40, 
                color: theme.palette.secondary.main,
                mb: 1 
              }} 
            />
            <Typography variant="body2" fontWeight={600}>
              Create Agents
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Would you like to create a project now?
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button 
          onClick={handleCancel}
          disabled={loading}
          sx={{ px: 3 }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleCreateProject}
          disabled={loading}
          startIcon={<ProjectIcon />}
          sx={{ 
            px: 3,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.shadows[4]
            }
          }}
        >
          Create Project First
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectRequiredDialog;