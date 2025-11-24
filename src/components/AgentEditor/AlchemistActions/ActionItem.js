/**
 * Action Item Component
 * 
 * Displays individual Alchemist action with expandable details
 */
import React, { useState } from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Collapse,
  Box,
  Typography,
  Divider,
  IconButton,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  Psychology as PsychologyIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

const ActionItem = ({ action, isLast = false }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  if (!action) return null;

  const {
    action_id,
    tool_name,
    action_type,
    action_data = {},
    context = {},
    display_info = {},
    metadata = {}
  } = action;

  const {
    status = 'unknown',
    input = {},
    output = null,
    duration_ms,
    error,
    started_at,
    completed_at
  } = action_data;

  const {
    title = tool_name || 'Unknown Action',
    description = 'No description available',
    category = 'general',
    icon = 'PlayArrowIcon',
    importance = 'low'
  } = display_info;

  const timestamp = metadata.timestamp?.toDate?.() || new Date(metadata.timestamp) || new Date();

  // Get appropriate icon component
  const getActionIcon = () => {
    const iconMap = {
      'EditIcon': EditIcon,
      'RefreshIcon': RefreshIcon,
      'CheckCircleIcon': CheckCircleIcon,
      'VisibilityIcon': VisibilityIcon,
      'BuildIcon': BuildIcon,
      'PsychologyIcon': PsychologyIcon,
      'PlayArrowIcon': PlayArrowIcon
    };
    
    const IconComponent = iconMap[icon] || PlayArrowIcon;
    return <IconComponent />;
  // Get status icon and color
  const getStatusInfo = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircleIcon />,
          color: 'success',
          bgColor: theme.palette.mode === 'dark' ? '#1b5e20' : '#e8f5e8'
        };
      case 'failed':
        return {
          icon: <ErrorIcon />,
          color: 'error',
          bgColor: theme.palette.mode === 'dark' ? '#b71c1c' : '#ffebee'
        };
      case 'started':
        return {
          icon: <ScheduleIcon />,
          color: 'warning',
          bgColor: theme.palette.mode === 'dark' ? '#e65100' : '#fff3e0'
        };
      default:
        return {
          icon: <InfoIcon />,
          color: 'default',
          bgColor: theme.palette.background.default
        };
  // Get category color
  const getCategoryColor = () => {
    const categoryColors = {
      'configuration': 'primary',
      'validation': 'secondary',
      'information': 'info',
      'processing': 'warning',
      'general': 'default'
    };
    return categoryColors[category] || 'default';
  };

  const statusInfo = getStatusInfo();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Format duration
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  return (
    <>
      <ListItem
        sx={{
          borderLeft: 4,
          borderLeftColor: `${statusInfo.color}.main`,
          bgcolor: expanded ? statusInfo.bgColor : 'transparent',
          '&:hover': {
            bgcolor: theme.palette.action.hover
          },
          transition: 'background-color 0.2s',
          alignItems: 'flex-start',
          py: 2
        }}
      >
        {/* Action Icon */}
        <ListItemIcon sx={{ mt: 0.5 }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: `${getCategoryColor()}.main`,
              color: `${getCategoryColor()}.contrastText`
            }}
          >
            {getActionIcon()}
          </Avatar>
        </ListItemIcon>

        {/* Main Content */}
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {title}
              </Typography>
              
              {/* Status Chip */}
              <Chip
                icon={statusInfo.icon}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                size="small"
                color={statusInfo.color}
                variant="outlined"
              />
              
              {/* Category Chip */}
              <Chip
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                size="small"
                color={getCategoryColor()}
                variant="filled"
                sx={{ opacity: 0.8 }}
              />
              
              {/* Importance indicator */}
              {importance === 'high' && (
                <Tooltip title="High importance">
                  <WarningIcon color="error" fontSize="small" />
                </Tooltip>
              )}
            </Box>
                secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Timestamp */}
                <Typography variant="caption" color="text.secondary">
                  <AccessTimeIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </Typography>
                
                {/* Duration */}
                {duration_ms && (
                  <Typography variant="caption" color="text.secondary">
                    <SpeedIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                    {formatDuration(duration_ms)}
                  </Typography>
                )}
                
                {/* Tool name if different from title */}
                {tool_name && tool_name !== title && (
                  <Typography variant="caption" color="text.secondary">
                    Tool: {tool_name}
                  </Typography>
                )}
              </Box>
            </Box>
              />

        {/* Expand Button */}
        <IconButton
          onClick={handleExpandClick}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
            mt: 1
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </ListItem>

      {/* Expanded Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2, pb: 2 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Grid container spacing={2}>
                {/* Action Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Action Details
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold', display: 'inline' }}>
                      ID: 
                    </Typography>
                    <Typography variant="body2" component="dd" sx={{ display: 'inline', ml: 1, fontFamily: 'monospace' }}>
                      {action_id}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold', display: 'inline' }}>
                      Type: 
                    </Typography>
                    <Typography variant="body2" component="dd" sx={{ display: 'inline', ml: 1 }}>
                      {action_type}
                    </Typography>
                  </Box>
                  
                  {started_at && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold', display: 'inline' }}>
                        Started: 
                      </Typography>
                      <Typography variant="body2" component="dd" sx={{ display: 'inline', ml: 1 }}>
                        {format(new Date(started_at), 'PPp')}
                      </Typography>
                    </Box>
                  )}
                  
                  {completed_at && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold', display: 'inline' }}>
                        Completed: 
                      </Typography>
                      <Typography variant="body2" component="dd" sx={{ display: 'inline', ml: 1 }}>
                        {format(new Date(completed_at), 'PPp')}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Context */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Context
                  </Typography>
                  
                  {context.user_message && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold' }}>
                        User Message:
                      </Typography>
                      <Typography variant="body2" component="dd" sx={{ mt: 0.5, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        "{context.user_message}"
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold', display: 'inline' }}>
                      Conversation Turn: 
                    </Typography>
                    <Typography variant="body2" component="dd" sx={{ display: 'inline', ml: 1 }}>
                      {context.conversation_turn || 0}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" component="dt" sx={{ fontWeight: 'bold', display: 'inline' }}>
                      Execution Order: 
                    </Typography>
                    <Typography variant="body2" component="dd" sx={{ display: 'inline', ml: 1 }}>
                      {metadata.execution_order || 0}
                    </Typography>
                  </Box>
                </Grid>

                {/* Input/Output */}
                {(Object.keys(input).length > 0 || output || error) && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Input */}
                    {Object.keys(input).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Input
                        </Typography>
                        <Box 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'background.default', 
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'divider',
                            overflow: 'auto',
                            maxHeight: 200
                          }}
                        >
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                            {JSON.stringify(input, null, 2)}
                          </pre>
                        </Box>
                      </Box>
                    )}
                    
                    {/* Output */}
                    {output && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Output
                        </Typography>
                        <Box 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'background.default', 
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'divider',
                            overflow: 'auto',
                            maxHeight: 200
                          }}
                        >
                          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                            {typeof output === 'object' ? JSON.stringify(output, null, 2) : output}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {/* Error */}
                    {error && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          Error
                        </Typography>
                        <Box 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'error.light', 
                            color: 'error.contrastText',
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'error.main'
                          }}
                        >
                          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                            {error}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Collapse>

      {!isLast && <Divider variant="inset" component="li" />}
    </>
  );
};

export default ActionItem;