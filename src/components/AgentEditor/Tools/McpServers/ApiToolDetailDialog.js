import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Api as ApiIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  CheckCircle as SuccessIcon,
  PowerSettingsNew as EnableIcon,
  PowerOff as DisableIcon,
} from '@mui/icons-material';

/**
 * ApiToolDetailDialog - Shows detailed information for API Tools
 * Displays API endpoint details, authentication, parameters, and test results
 */
const ApiToolDetailDialog = ({
  open,
  onClose,
  tool,
  isEnabled,
  isConfigured,
  onEnable,
  onConfigure,
  onDisable,
}) => {
  const theme = useTheme();

  if (!tool) return null;

  const authTypeLabels = {
    none: 'No Authentication',
    bearer: 'Bearer Token',
    api_key: 'API Key',
    basic: 'Basic Auth',
    oauth: 'OAuth 2.0'
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10]
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ApiIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {tool.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {tool.method && (
                  <Chip
                    label={tool.method}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                <Chip
                  label="API Tool"
                  size="small"
                  variant="outlined"
                />
                {tool.is_private && (
                  <Chip
                    icon={<LockIcon />}
                    label="Private"
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* Description */}
        {tool.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tool.description}
            </Typography>
          </Box>
        )}

        {/* API Details */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            API Details
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Endpoint URL
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {tool.path}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  HTTP Method
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={tool.method} size="small" color="primary" />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Authentication
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={tool.authentication === 'none' ? <LockOpenIcon /> : <LockIcon />}
                    label={authTypeLabels[tool.authentication] || tool.authentication}
                    size="small"
                    color={tool.authentication === 'none' ? 'default' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Parameters */}
        {tool.parameters && tool.parameters.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Parameters ({tool.parameters.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Example</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tool.parameters.map((param, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {param.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={param.in || param.location} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {param.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {param.example || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Test Result */}
        {tool.test_result && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Last Test Result
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: tool.test_result.success
                  ? alpha(theme.palette.success.main, 0.05)
                  : alpha(theme.palette.error.main, 0.05)
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {tool.test_result.success ? (
                  <Chip
                    icon={<SuccessIcon />}
                    label="Success"
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip label="Failed" color="error" size="small" />
                )}
                <Chip
                  label={`${tool.test_result.status_code}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${tool.test_result.response_time}ms`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {tool.test_result.error && (
                <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                  Error: {tool.test_result.error}
                </Typography>
              )}

              {tool.test_result.response_data && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Response Data:
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      maxHeight: 200,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {JSON.stringify(tool.test_result.response_data, null, 2)}
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Status */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isEnabled ? (
              <Chip
                label={isConfigured ? 'Configured & Enabled' : 'Enabled'}
                color={isConfigured ? 'success' : 'warning'}
                size="small"
              />
            ) : (
              <Chip label="Disabled" size="small" variant="outlined" />
            )}
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {!isEnabled ? (
          <Button
            variant="contained"
            startIcon={<EnableIcon />}
            onClick={() => {
              onEnable();
              onClose();
            }}
          >
            Enable Tool
          </Button>
        ) : (
          <>
            {/* API Tools don't need Configure button - authentication is set during creation */}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DisableIcon />}
              onClick={() => {
                onDisable();
                onClose();
              }}
            >
              Disable
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApiToolDetailDialog;
