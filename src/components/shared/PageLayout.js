/**
 * Standardized Page Layout Component
 * 
 * Provides consistent Left Panel + Main Panel structure for all agent-studio pages
 */
import React from 'react';
import {
  Box,
  Paper,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';

const DRAWER_WIDTH = 280;

const PageLayout = ({ 
  children, 
  leftPanel = null,
  showLeftPanel = true,
  leftPanelWidth = DRAWER_WIDTH,
  containerMaxWidth = false,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const leftPanelContent = leftPanel ? (
    <Box
      sx={{
        width: leftPanelWidth,
        height: 'calc(100vh - 64px)', // Fixed height relative to viewport
        position: 'fixed', // Fix to viewport
        top: '64px', // Below app bar
        left: 0,
        bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fafafa',
        borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb'}`,
        overflowY: 'auto', // Only scroll internal content
        zIndex: 1000, // Ensure it stays above other content
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
        '&::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.mode === 'dark' ? '#777777' : '#a8a8a8',
        },
      }}
    >
      {leftPanel}
    </Box>
  ) : null;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)', // Account for app bar height
        bgcolor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f8f9fa',
        ...sx
      }}
    >
      {/* Left Panel - Desktop */}
      {showLeftPanel && !isMobile && leftPanelContent}
      
      {/* Left Panel - Mobile Drawer */}
      {showLeftPanel && isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: leftPanelWidth,
              top: '64px', // Below app bar
              height: 'calc(100vh - 64px)',
              bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fafafa',
              borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb'}`,
            },
          }}
        >
          {leftPanel}
        </Drawer>
      )}
      
      {/* Main Content Panel */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: showLeftPanel && !isMobile ? `calc(100% - ${leftPanelWidth}px)` : '100%',
          marginLeft: showLeftPanel && !isMobile ? `${leftPanelWidth}px` : 0, // Offset for fixed panel
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.mode === 'dark' ? '#111111' : '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Mobile Menu Toggle - Only show when left panel exists */}
        {showLeftPanel && isMobile && leftPanel && (
          <Box
            sx={{
              position: 'fixed',
              top: '80px', // Below app bar
              left: 16,
              zIndex: 1200,
            }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 1,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
              onClick={handleDrawerToggle}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ☰
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Main content with proper padding */}
        <Box
          sx={{
            flexGrow: 1,
            maxWidth: containerMaxWidth || '100%',
            mx: containerMaxWidth ? 'auto' : 0,
            width: '100%',
            height: '100%',
            position: 'relative',
            mt: showLeftPanel && isMobile && leftPanel ? 4 : 0, // Extra margin for mobile menu button
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default PageLayout;