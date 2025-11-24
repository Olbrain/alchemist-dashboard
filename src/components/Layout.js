import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Person as PersonIcon,
  AutoAwesome as AlchemistIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import InvitationBadge from './shared/InvitationBadge';
import UniversalAssistant from './shared/UniversalAssistant';
// import AppBarProjectSelector from './shared/AppBarProjectSelector'; // REMOVED: Component deleted
import { logUserLogout } from '../services/auth/authService';
import { getProjectOrganizationId } from '../utils/projectHelpers';
import { getDataAccess } from '../services/data/DataAccessFactory';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentProject, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const theme = useTheme();

  // Show the app bar on all pages except landing page for unauthenticated users
  const showFullAppBar = !(location.pathname === '/' && !currentUser);

  // Hide organization-related UI during onboarding (profile-only flow)
  const isOnboardingPage = location.pathname === '/onboarding';

  // Fetch organization data when currentProject changes
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!currentProject) {
        setOrganizationData(null);
        return;
      }

      try {
        // Get organization_id from project document
        const orgId = await getProjectOrganizationId(currentProject);

        if (!orgId) {
          console.warn('No organization_id found for project:', currentProject);
          setOrganizationData(null);
          return;
        }

        // Fetch organization data using DataAccess
        const dataAccess = getDataAccess();
        const orgData = await dataAccess.getOrganization(orgId);

        if (orgData) {
          setOrganizationData({
            id: orgId,
            ...orgData
          });
          console.log('✅ Loaded organization data:', orgData?.basic_info?.name);
        } else {
          console.warn('Organization not found:', orgId);
          setOrganizationData(null);
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setOrganizationData(null);
      }
    };

    fetchOrganizationData();
  }, [currentProject]);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    try {
      // Log logout activity before actually logging out
      try {
        await logUserLogout('user_initiated');
      } catch (logError) {
        console.error('Failed to log logout activity:', logError);
      }
      
      await logout();
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  
  return (
    <>
      {showFullAppBar && (
        <AppBar 
          position="fixed" 
          elevation={0}
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #000000 0%, #111111 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb'}`,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(10px)'
          }}
        >
        <Toolbar sx={{ 
          py: 1.5, 
          px: { xs: 2, sm: 3, md: 4 },
          width: '100%'
        }}>
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: theme.palette.text.primary,
              textDecoration: 'none',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                color: theme.palette.primary.main
              }
            }}
          >
            {/* Show organization logo and name when authenticated and data is loaded */}
            {currentUser && !isOnboardingPage && organizationData ? (
              <>
                <Avatar
                  src={organizationData?.basic_info?.logo_url}
                  alt={organizationData?.basic_info?.name || 'Organization'}
                  sx={{
                    width: 28,
                    height: 28,
                    marginRight: '0.75rem',
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {!organizationData?.basic_info?.logo_url && (
                    organizationData?.basic_info?.name?.charAt(0)?.toUpperCase() || <BusinessIcon sx={{ fontSize: 16 }} />
                  )}
                </Avatar>
                {organizationData?.basic_info?.name || 'Organization'}
              </>
            ) : (
              <>
                <svg
                  width="28"
                  height="28"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    marginRight: '0.75rem',
                    filter: 'drop-shadow(0 1px 2px rgba(99, 102, 241, 0.3))'
                  }}
                >
                  <path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z"></path>
                </svg>
                Olbrain
              </>
            )}
          </Typography>

          {currentUser ? (
            <>
              {/* Project Selector - Only show when user is authenticated and not on onboarding */}
              {/* {!isOnboardingPage && (
                <Box sx={{ mr: 2 }}>
                  <AppBarProjectSelector />
                </Box>
              )} */}
              {/* REMOVED: AppBarProjectSelector component deleted */}

              <Stack direction="row" spacing={1.5} sx={{
                display: { xs: 'none', md: 'flex' },
                mr: 3,
                alignItems: 'center',
                '& > *': {
                  height: '40px'
                }
              }}>
                {/* Temporarily commented out theme toggle
                <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                  <IconButton
                    onClick={toggleTheme}
                    color="inherit"
                    size="medium"
                    sx={{
                      width: 40,
                      height: 40,
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
                      border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '& svg': {
                        fontSize: '18px'
                      },
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e9ecef',
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-1px)',
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 4px 12px rgba(99, 102, 241, 0.2)' 
                          : '0 4px 12px rgba(99, 102, 241, 0.15)'
                      }
                    }}
                  >
                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
                */}

                {/* Show onboarding status during profile setup */}
                {isOnboardingPage && (
                  <Chip
                    label="Profile Setup"
                    variant="outlined"
                    sx={{
                      height: 40,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                {/* Alchemist Assistant Button */}
                {currentUser && (
                  <Tooltip title="Chat with Alchemist">
                    <IconButton
                      onClick={() => setAssistantOpen(!assistantOpen)}
                      size="medium"
                      sx={{
                        width: 40,
                        height: 40,
                        color: theme.palette.text.primary,
                        bgcolor: assistantOpen
                          ? alpha(theme.palette.primary.main, 0.1)
                          : theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
                        border: `1px solid ${assistantOpen ? theme.palette.primary.main : theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '& svg': {
                          fontSize: '20px'
                        },
                        '&:hover': {
                          bgcolor: assistantOpen
                            ? alpha(theme.palette.primary.main, 0.2)
                            : theme.palette.mode === 'dark' ? '#2a2a2a' : '#e9ecef',
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 12px rgba(99, 102, 241, 0.2)'
                            : '0 4px 12px rgba(99, 102, 241, 0.15)'
                        }
                      }}
                    >
                      <AlchemistIcon />
                    </IconButton>
                  </Tooltip>
                )}

                <NotificationDropdown />

                <InvitationBadge />

                <IconButton
                  size="medium"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  sx={{
                    width: 40,
                    height: 40,
                    color: theme.palette.text.primary,
                    bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e9ecef',
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-1px)',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(99, 102, 241, 0.2)' 
                        : '0 4px 12px rgba(99, 102, 241, 0.15)'
                    }
                  }}
                >
                  {currentUser.photoURL ? (
                    <Avatar 
                      src={currentUser.photoURL} 
                      alt={currentUser.email}
                      sx={{ 
                        width: 30, 
                        height: 30,
                        border: `2px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`
                      }}
                    />
                  ) : (
                    <AccountCircleIcon sx={{ fontSize: '24px' }} />
                  )}
                </IconButton>
              </Stack>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    mt: 1.5,
                    minWidth: 240,
                    maxWidth: 280,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                      : '0 12px 40px rgba(0, 0, 0, 0.15)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                    bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                    backdropFilter: 'blur(10px)',
                    '& .MuiList-root': {
                      py: 1
                    }
                  }
                }}
              >
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: theme.palette.mode === 'dark' ? '#252525' : '#f8f9fa',
                  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  {currentUser.photoURL ? (
                    <Avatar 
                      src={currentUser.photoURL} 
                      alt={currentUser.email}
                      sx={{ 
                        width: 36, 
                        height: 36,
                        border: `2px solid ${theme.palette.primary.main}`
                      }}
                    />
                  ) : (
                    <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 700, 
                      lineHeight: 1.2,
                      color: theme.palette.text.primary
                    }}>
                      {currentUser.displayName || 'User'}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {currentUser.email}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mx: 1, my: 1 }} />
                <MenuItem 
                  onClick={handleLogout}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    borderRadius: 1.5,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Typography color="error" sx={{ fontWeight: 500 }}>Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Temporarily commented out theme toggle
              <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton
                  onClick={toggleTheme}
                  color="inherit"
                  size="medium"
                  sx={{
                    width: 40,
                    height: 40,
                    color: theme.palette.text.primary,
                    bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '& svg': {
                      fontSize: '18px'
                    },
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e9ecef',
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-1px)',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(99, 102, 241, 0.2)' 
                        : '0 4px 12px rgba(99, 102, 241, 0.15)'
                    }
                  }}
                >
                  {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
              */}
              
              <Button
                component={Link}
                to="/login"
                color="inherit"
                variant="text"
                sx={{ 
                  height: 40,
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e1e5e9'}`,
                  color: theme.palette.text.primary,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e9ecef',
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 12px rgba(99, 102, 241, 0.2)' 
                      : '0 4px 12px rgba(99, 102, 241, 0.15)'
                  }
                }}
              >
                Login
              </Button>
              
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                sx={{ 
                  height: 40,
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.main,
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }
                }}
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Toolbar>
        </AppBar>
      )}
      
      <Box
        sx={{
          pt: showFullAppBar ? '64px' : 0, // Add top padding for fixed header
          minHeight: '100vh',
          width: '100%',
          maxWidth: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>

      {/* Universal Assistant Drawer */}
      {currentUser && (
        <UniversalAssistant
          open={assistantOpen}
          onToggle={() => setAssistantOpen(!assistantOpen)}
        />
      )}
    </>
  );
};

export default Layout;
