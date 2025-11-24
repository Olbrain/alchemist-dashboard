import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Settings as ConfigureIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Science as TestIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';

/**
 * McpServerCard - Clean, spacious card design inspired by Agent List
 * Features progressive disclosure with hover-reveal actions
 */
const McpServerCard = ({
  server,
  isEnabled = false,
  isConfigured = false,
  onEnable,
  onConfigure,
  onDisable,
  onViewDetails,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      ecommerce: '#4CAF50',
      payments: '#2196F3',
      crm: '#FF9800',
      marketing: '#9C27B0',
      email: '#00BCD4',
      sms: '#E91E63',
      analytics: '#795548',
      support: '#607D8B',
      other: '#9E9E9E'
    };
    return colors[category] || colors.other;
  };

  const getIconDisplay = () => {
    if (server.icon_type === 'url') {
      return (
        <Avatar
          src={server.icon}
          alt={server.name}
          sx={{ width: 64, height: 64 }}
          imgProps={{
            style: {
              objectFit: 'contain',
              padding: '4px'
            }
          }}
        />
      );
    } else if (server.icon) {
      return (
        <Avatar
          src={`/mcp_servers/${server.id}/${server.icon}`}
          alt={server.name}
          sx={{ width: 64, height: 64 }}
          imgProps={{
            style: {
              objectFit: 'contain',
              padding: '4px'
            }
          }}
        />
      );
    }
    return (
      <Avatar sx={{ width: 64, height: 64, bgcolor: getCategoryColor(server.category), fontSize: '1.5rem' }}>
        {server.name.charAt(0)}
      </Avatar>
    );
  };

  const handleCardClick = (e) => {
    // Don't trigger if clicking on buttons
    if (e.target.closest('button')) return;
    if (onViewDetails) {
      onViewDetails(server);
    }
  };

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    handleMenuClose();
    action();
  };

  return (
    <Card
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onViewDetails ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: onViewDetails ? 'translateY(-4px)' : 'none',
          borderColor: theme.palette.primary.main,
        }
      }}
    >
      {/* Header Section with Icon */}
      <Box
        sx={{
          height: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          p: 3,
        }}
      >
        {getIconDisplay()}

        {server.category && (
          <Chip
            label={server.category}
            size="small"
            sx={{
              bgcolor: getCategoryColor(server.category),
              color: 'white',
              fontSize: '0.7rem',
              height: 20,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          />
        )}

        {/* Overflow Menu */}
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s',
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'background.paper',
            }
          }}
        >
          <MoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content Section */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: 2.5,
          '&:last-child': { pb: 2.5 }
        }}
      >
        {/* Server Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {server.name}
          </Typography>
          {server.is_private && (
            <PrivateIcon
              sx={{
                fontSize: '1rem',
                color: 'text.secondary'
              }}
            />
          )}
        </Box>

        {/* Description - 2 lines */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.875rem',
            lineHeight: 1.5,
            textAlign: 'center',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 42, // Reserve space for 2 lines
          }}
        >
          {server.description || 'No description available'}
        </Typography>

        {/* Metadata */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mt: 'auto',
          }}
        >
          {isEnabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isConfigured ? theme.palette.success.main : theme.palette.warning.main,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {isConfigured ? 'Configured' : 'Enabled'}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Action Footer - Hover Reveal */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 2.5,
          pt: 0,
          borderTop: isHovered ? `1px solid ${theme.palette.divider}` : '1px solid transparent',
          opacity: isHovered ? 1 : 0.7,
          transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {!isEnabled ? (
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onEnable();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Enable
          </Button>
        ) : (
          <>
            {server.installation && !server.is_private && (
              <Button
                variant="outlined"
                size="medium"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure();
                }}
                startIcon={<ConfigureIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isConfigured ? 'Configure' : 'Setup'}
              </Button>
            )}
            <Button
              variant="outlined"
              size="medium"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDisable();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 90,
              }}
            >
              Disable
            </Button>
          </>
        )}
      </Box>

      {/* Overflow Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleMenuAction(() => onViewDetails(server))}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {isEnabled && (
          <MenuItem onClick={() => handleMenuAction(() => console.log('Test server'))}>
            <TestIcon fontSize="small" sx={{ mr: 1 }} />
            Test Connection
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default McpServerCard;
