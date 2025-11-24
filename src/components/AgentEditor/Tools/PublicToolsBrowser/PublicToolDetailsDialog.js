/**
 * Public Tool Details Dialog
 *
 * Comprehensive details view for public tool suites
 * Shows suite information, individual tools, and configuration options
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const PublicToolDetailsDialog = ({
  open,
  onClose,
  tool,
  isConfigured,
  isEnabled,
  onEnableTool,
  onToggleEnabled,
  onOpenConfig,
  isToggling = false,
  disabled = false
}) => {
  if (!tool) return null;

  const hasConfigSchema = tool.configuration_schema && Object.keys(tool.configuration_schema).length > 0;
  const hasIndividualTools = tool.tools && tool.tools.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {tool.icon && (
              <Box
                component="img"
                src={tool.icon}
                alt={tool.name}
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" component="div">
                  {tool.name}
                </Typography>
                {isConfigured && isEnabled && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Enabled"
                    color="success"
                    size="small"
                  />
                )}
                {isConfigured && !isEnabled && (
                  <Chip
                    label="Disabled"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {tool.description || 'No description available'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ mt: -1, mr: -1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent sx={{ pt: 3 }}>
        {/* Suite Information Card */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InfoIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight="600">
                Suite Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Suite ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {tool.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type
                </Typography>
                <Chip
                  label={tool.type || 'integration_suite'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              {hasIndividualTools && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Individual Tools
                  </Typography>
                  <Typography variant="body1">
                    {tool.tools.length} tool{tool.tools.length !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
              )}
              {hasConfigSchema && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Configuration
                  </Typography>
                  <Typography variant="body1">
                    Required
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Individual Tools List */}
        {hasIndividualTools && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BuildIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="600">
                  Individual Tools ({tool.tools.length})
                </Typography>
              </Box>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  maxHeight: 400,
                  '& .MuiTableCell-root': {
                    py: 1.5
                  }
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '30%' }}>Tool Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tool.tools.map((individualTool, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {individualTool.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {individualTool.description || 'No description'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Configuration Requirements */}
        {hasConfigSchema && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SettingsIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="600">
                  Configuration Requirements
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This tool suite requires configuration before it can be enabled. Click "Configure" to set up the required parameters.
              </Alert>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Required Configuration Fields:
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.keys(tool.configuration_schema).map((key) => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Enable/Disable Status */}
        {isConfigured && (
          <Card variant="outlined" sx={{ bgcolor: isEnabled ? 'success.50' : 'grey.50' }}>
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={() => onToggleEnabled(tool.id, tool.name, isEnabled)}
                    disabled={disabled || isToggling}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="500">
                      {isEnabled ? 'Tool Suite Enabled' : 'Tool Suite Disabled'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isEnabled
                        ? 'All tools in this suite are available for your agent'
                        : 'Enable to make these tools available for your agent'}
                    </Typography>
                  </Box>
                }
                labelPlacement="end"
                sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
              />
            </CardContent>
          </Card>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <Divider />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Box sx={{ flex: 1 }} />
        {hasConfigSchema && (
          <Button
            variant="outlined"
            onClick={() => {
              onOpenConfig(tool);
              onClose();
            }}
            startIcon={<SettingsIcon />}
            disabled={disabled}
          >
            Configure
          </Button>
        )}
        {!isConfigured && !hasConfigSchema && (
          <Button
            variant="contained"
            onClick={() => {
              onEnableTool(tool.id, tool.name);
            }}
            startIcon={isToggling ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            disabled={disabled || isToggling}
          >
            {isToggling ? 'Enabling...' : 'Enable Tool'}
          </Button>
        )}
        {isConfigured && (
          <Button
            variant="contained"
            onClick={() => onToggleEnabled(tool.id, tool.name, isEnabled)}
            disabled={disabled || isToggling}
            color={isEnabled ? 'inherit' : 'primary'}
          >
            {isToggling ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {isEnabled ? 'Disabling...' : 'Enabling...'}
              </>
            ) : (
              isEnabled ? 'Disable' : 'Enable'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PublicToolDetailsDialog;
