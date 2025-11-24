/**
 * Tiledesk Integration Content (Main Container)
 *
 * Routes between authentication and dashboard based on auth state
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import TiledeskAuthStorage from './components/TiledeskAuthStorage';
import TiledeskAuth from './TiledeskAuth';
import TiledeskDashboard from './TiledeskDashboard';
import { PageTitle, PageDescription } from '../../../utils/typography';

const TiledeskIntegrationContent = ({ agentId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = TiledeskAuthStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
    setLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header - Only show if not authenticated */}
      {!isAuthenticated && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Box
              component="img"
              src="/img/integrations/tiledesk-logo.png"
              alt="Tiledesk"
              sx={{ width: 32, height: 32, objectFit: 'contain', mr: 1, borderRadius: '4px' }}
            />
            <PageTitle>Tiledesk Integration</PageTitle>
          </Box>
          <PageDescription>
            Connect your agent as an external bot in Tiledesk for live chat support
          </PageDescription>
        </Box>
      )}

      {/* Content - Auth or Dashboard */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isAuthenticated ? (
          <TiledeskDashboard agentId={agentId} onLogout={handleLogout} />
        ) : (
          <TiledeskAuth onAuthSuccess={handleAuthSuccess} />
        )}
      </Box>
    </Box>
  );
};

export default TiledeskIntegrationContent;
