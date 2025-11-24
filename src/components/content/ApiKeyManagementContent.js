/**
 * API Key Management Content Component
 *
 * Comprehensive API key management dashboard with organization, project, and agent level keys
 * Integrates with usage tracking from agent-launcher/agent-template/core/usage_aggregator.py
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  VpnKey as VpnKeyIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  RotateRight as RegenerateIcon,
  Block as RevokeIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as RevokedIcon,
  Schedule as ExpiredIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/AuthContext';
import apiKeyService from '../../services/apiKeys/apiKeyService';
import CreateKeyDialog from '../dialogs/CreateKeyDialog';
import KeyDetailsDialog from '../dialogs/KeyDetailsDialog';
import EmptyState from '../shared/EmptyState';

const ApiKeyManagementContent = ({ agentId, agent }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();

  // State management
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [apiKeys, setApiKeys] = useState([]);

  // Pagination
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(10);

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [keyDetailsOpen, setKeyDetailsOpen] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpenKeyId, setMenuOpenKeyId] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: '',
    keyId: null,
    keyName: ''
  });

  // Status configuration
  const statusConfig = {
    active: {
      color: 'success',
      icon: <ActiveIcon fontSize="small" />,
      label: 'Active'
    },
    revoked: {
      color: 'error',
      icon: <RevokedIcon fontSize="small" />,
      label: 'Revoked'
    },
    expired: {
      color: 'warning',
      icon: <ExpiredIcon fontSize="small" />,
      label: 'Expired'
    },
    deleted: {
      color: 'default',
      icon: <DeleteIcon fontSize="small" />,
      label: 'Deleted'
    }
  };

  const loadApiKeyData = React.useCallback(async (isInitial = false) => {
    if (!agentId) return;

    try {
      if (isInitial) {
        setInitialLoading(true);
      }
      setError(null);

      // Load agent-specific keys only
      const result = await apiKeyService.getAgentApiKeys(agentId);
      if (result.success) {
        setApiKeys(result.keys);
      } else {
        setApiKeys([]);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('Error loading API key data:', err);
      console.error('Agent ID:', agentId);
      setError('Failed to load API key data. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (currentUser && agentId) {
      loadApiKeyData(true);
    }
  }, [currentUser, agentId, loadApiKeyData]);

  const handleCreateKey = () => {
    setCreateDialogOpen(true);
  };

  const handleKeyAction = async (keyId, action) => {
    try {
      switch (action) {
        case 'regenerate':
          await apiKeyService.regenerateApiKey(keyId, agentId);
          break;
        case 'revoke':
          await apiKeyService.revokeApiKey(keyId, agentId);
          break;
        case 'delete':
          await apiKeyService.deleteApiKey(keyId, agentId);
          break;
        default:
          break;
      }
      await loadApiKeyData(false);
    } catch (err) {
      console.error(`Error performing ${action} on key ${keyId}:`, err);
      setError(`Failed to ${action} API key. Please try again.`);
    }
  };

  const handleKeyCreated = async (result) => {
    if (result.success) {
      // Don't close the dialog - let user copy the key first
      // Dialog will close when user clicks "Done" button
      await loadApiKeyData(false);  // Still refresh the list in background
    }
  };

  const handleMenuOpen = (event, keyId) => {
    setAnchorEl(event.currentTarget);
    setMenuOpenKeyId(keyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOpenKeyId(null);
  };

  const handleMenuAction = async (keyId, action) => {
    handleMenuClose();
    if (action === 'view') {
      const key = apiKeys.find(k => k.id === keyId);
      setSelectedKey(key);
      setKeyDetailsOpen(true);
    } else if (action === 'revoke' || action === 'delete') {
      // Show confirmation dialog for destructive actions
      const key = apiKeys.find(k => k.id === keyId);
      setConfirmDialog({
        open: true,
        action,
        keyId,
        keyName: key?.name || 'Unnamed Key'
      });
    } else {
      // Regenerate doesn't need confirmation
      await handleKeyAction(keyId, action);
    }
  };

  const handleConfirmAction = async () => {
    const { keyId, action } = confirmDialog;
    setConfirmDialog({ open: false, action: '', keyId: null, keyName: '' });
    await handleKeyAction(keyId, action);
  };

  const handleCancelAction = () => {
    setConfirmDialog({ open: false, action: '', keyId: null, keyName: '' });
  };

  const getFilteredKeys = () => {
    return apiKeys;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return '—';
    }
  };

  // Show empty state if no agent is selected
  if (!agentId) {
    return (
      <EmptyState
        icon={VpnKeyIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to manage API keys."
        useCard={true}
      />
    );
  }

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="body1" color="text.secondary" fontWeight="500">
          Loading API key management...
        </Typography>
      </Box>
    );
  }

  const filteredKeys = getFilteredKeys();
  const paginatedKeys = filteredKeys.slice(
    tablePage * tableRowsPerPage,
    tablePage * tableRowsPerPage + tableRowsPerPage
  );

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content Card */}
      <Card sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="body1" fontWeight="700" gutterBottom>
                API Keys for {agent?.name || agent?.basic_info?.name || 'Agent'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage API keys for this agent
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateKey}
              size="small"
            >
              Create Key
            </Button>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, pt: 2, position: 'relative' }}>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <VpnKeyIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Total Keys
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="700">
                    {filteredKeys.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ActiveIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Active Keys
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="700">
                    {filteredKeys.filter(k => k.status === 'active').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RevokedIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Revoked Keys
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="700">
                    {filteredKeys.filter(k => k.status === 'revoked').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ExpiredIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Expired Keys
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="700">
                    {filteredKeys.filter(k => k.status === 'expired').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* API Keys Table */}
          <Card>
            <CardContent>
              <Typography variant="body1" fontWeight="600" gutterBottom>
                API Keys
              </Typography>

              {paginatedKeys.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    No API keys found. Create your first key to get started.
                  </Typography>
                </Alert>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Key Prefix</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Last Used</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedKeys.map((key) => {
                          const status = statusConfig[key.status] || statusConfig.active;
                          return (
                            <TableRow key={key.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="500">
                                  {key.name || 'Unnamed Key'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontFamily="monospace">
                                  {key.key_prefix || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={status.icon}
                                  label={status.label}
                                  size="small"
                                  color={status.color}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(key.created_at)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(key.last_used)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={(event) => handleMenuOpen(event, key.id)}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                                <Menu
                                  anchorEl={anchorEl}
                                  open={menuOpenKeyId === key.id}
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
                                  <MenuItem onClick={() => handleMenuAction(key.id, 'view')}>
                                    <ListItemIcon>
                                      <VisibilityIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>View Details</ListItemText>
                                  </MenuItem>
                                  {key.status === 'active' && (
                                    <>
                                      <MenuItem onClick={() => handleMenuAction(key.id, 'regenerate')}>
                                        <ListItemIcon>
                                          <RegenerateIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Regenerate</ListItemText>
                                      </MenuItem>
                                      <MenuItem onClick={() => handleMenuAction(key.id, 'revoke')}>
                                        <ListItemIcon>
                                          <RevokeIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Revoke</ListItemText>
                                      </MenuItem>
                                    </>
                                  )}
                                  <MenuItem onClick={() => handleMenuAction(key.id, 'delete')}>
                                    <ListItemIcon>
                                      <DeleteIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Delete</ListItemText>
                                  </MenuItem>
                                </Menu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredKeys.length}
                    rowsPerPage={tableRowsPerPage}
                    page={tablePage}
                    onPageChange={(event, newPage) => setTablePage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setTableRowsPerPage(parseInt(event.target.value, 10));
                      setTablePage(0);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Card>

      {/* Create Key Dialog */}
      <CreateKeyDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onKeyCreated={handleKeyCreated}
        agentContext={{
          id: agentId,
          name: agent?.name || agent?.basic_info?.name,
          basic_info: agent?.basic_info,
          organization_id: agent?.organization_id,
          project_id: agent?.project_id
        }}
      />

      {/* Key Details Dialog */}
      <KeyDetailsDialog
        open={keyDetailsOpen}
        onClose={() => setKeyDetailsOpen(false)}
        apiKey={selectedKey}
        onKeyAction={handleKeyAction}
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAction}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm {confirmDialog.action === 'revoke' ? 'Revoke' : 'Delete'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {confirmDialog.action === 'delete'
              ? 'This action cannot be undone. The API key will be permanently deleted.'
              : 'This will immediately disable the API key.'}
          </Alert>
          <Typography>
            {confirmDialog.action === 'revoke' && (
              <>
                Are you sure you want to revoke the API key <strong>"{confirmDialog.keyName}"</strong>?
                It will stop working immediately but can be regenerated if needed.
              </>
            )}
            {confirmDialog.action === 'delete' && (
              <>
                Are you sure you want to permanently delete the API key <strong>"{confirmDialog.keyName}"</strong>?
                This action cannot be undone and all data will be lost.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color="error"
            variant="contained"
          >
            {confirmDialog.action === 'revoke' ? 'Revoke' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiKeyManagementContent;