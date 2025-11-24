/**
 * Activity Analytics Page
 * 
 * Standalone page wrapper for the ActivityAnalytics component
 * Provides proper page layout and navigation context for organization-wide activity analytics
 */

import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../components/shared/PageLayout';
import DashboardSidebar from '../components/shared/DashboardSidebar';
import ActivityAnalytics from '../components/Activity/ActivityAnalytics';
import { PageTitle, PageDescription } from '../utils/typography';

const ActivityAnalyticsPage = () => {
  return (
    <PageLayout 
      leftPanel={<DashboardSidebar />}
      leftPanelWidth={280}
    >
      <Box sx={{ 
        height: '100%',
        p: 3,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Page Header Section */}
        <Box sx={{ mb: 4 }}>
          {/* Breadcrumb Navigation */}
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              component={RouterLink}
              to="/"
              underline="hover"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <HomeIcon fontSize="small" />
              Dashboard
            </Link>
            <Typography 
              color="text.primary" 
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <TimelineIcon fontSize="small" />
              Activity Analytics
            </Typography>
          </Breadcrumbs>

          {/* Page Title */}
          <PageTitle component="h1" gutterBottom>
            📈 Activity Analytics
          </PageTitle>
          <PageDescription>
            Comprehensive insights into your organization's activity and performance metrics
          </PageDescription>
        </Box>

        {/* Activity Analytics Component */}
        <Box sx={{ flex: 1 }}>
          <ActivityAnalytics />
        </Box>
      </Box>
    </PageLayout>
  );
};

export default ActivityAnalyticsPage;