/**
 * Project Analytics Content Component
 *
 * Shows analytics for any selected project across all organizations
 */
import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ProjectsAnalyticsSidebar from '../shared/ProjectsAnalyticsSidebar';
import ProjectAnalyticsTab from '../Project/ProjectAnalyticsTab';

const ProjectAnalyticsContent = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Projects Sidebar */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <ProjectsAnalyticsSidebar
          selectedProjectId={selectedProjectId}
          onProjectSelect={setSelectedProjectId}
        />
      </Box>

      {/* Analytics Content */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {selectedProjectId ? (
          <Box sx={{ p: 4 }}>
            <ProjectAnalyticsTab projectId={selectedProjectId} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              px: 4
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select a project from the sidebar to view analytics
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProjectAnalyticsContent;
