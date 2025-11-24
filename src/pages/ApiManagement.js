/**
 * API Management Page
 * 
 * Centralized management of all API keys across the organization
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  ListItemText,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Delete as RevokeIcon,
  Visibility as ViewIcon,
  TrendingUp as AnalyticsIcon,
  Security as SecurityIcon,
  Key as KeyIcon,
  SmartToy as AgentIcon
} from '@mui/icons-material';

import PageLayout from '../components/shared/PageLayout';
import DashboardSidebar from '../components/shared/DashboardSidebar';
import apiKeyService from '../services/apiKeys/apiKeyService';
import { useAuth } from '../utils/AuthContext';
import { PageTitle, PageDescription, CardTitle, MetricValue } from '../utils/typography';

const ApiManagement = () => {
  const { currentUser, currentOrganization } = useAuth();
  const [keys, setKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [selectedKeys, setSelectedKeys] = useState([]);
  
  // Bulk operations
  const [bulkRevokeDialogOpen, setBulkRevokeDialogOpen] = useState(false);
  const [bulkRevoking, setBulkRevoking] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (currentOrganization) {
      loadApiKeys();
      loadStats();
    }
  }, [currentOrganization]);

  useEffect(() => {
    // Apply filters
    let filtered = keys;

    if (searchTerm) {
      filtered = filtered.filter(key => 
        key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.agent_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(key => key.status === statusFilter);
    }

    if (agentFilter !== 'all') {
      filtered = filtered.filter(key => key.agent_id === agentFilter);
    }

    setFilteredKeys(filtered);
  }, [keys, searchTerm, statusFilter, agentFilter]);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const result = await apiKeyService.getOrganizationApiKeys(currentOrganization.id);
      if (result.success) {
        setKeys(result.keys);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await apiKeyService.getOrganizationKeyStats(currentOrganization.id);
      if (result.success) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleRefresh = async () => {
    await loadApiKeys();
    await loadStats();
    showSnackbar('Data refreshed successfully', 'success');
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) {
      return;
    }

    try {
      const result = await apiKeyService.revokeApiKey(keyId);
      if (result.success) {
        await loadApiKeys();
        await loadStats();
        showSnackbar('API key revoked successfully', 'success');
      } else {
        showSnackbar(result.error, 'error');
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const handleBulkRevoke = async () => {
    setBulkRevoking(true);
    try {
      const result = await apiKeyService.bulkRevokeKeys(selectedKeys);
      if (result.success) {
        await loadApiKeys();
        await loadStats();
        setSelectedKeys([]);
        setBulkRevokeDialogOpen(false);
        showSnackbar(result.message, 'success');
      } else {
        showSnackbar(result.error, 'error');
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setBulkRevoking(false);
    }
  };

  const handleSelectKey = (keyId) => {
    setSelectedKeys(prev => 
      prev.includes(keyId) 
        ? prev.filter(id => id !== keyId)
        : [...prev, keyId]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeys(
      selectedKeys.length === filteredKeys.length 
        ? []
        : filteredKeys.map(key => key.id)
    );
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const getUniqueAgents = () => {
    const agents = [...new Set(keys.map(key => key.agent_id))];
    return agents.map(agentId => ({ id: agentId, name: `Agent ${agentId.slice(-8)}` }));
  };

  if (loading) {
    return (
      <PageLayout leftPanel={<DashboardSidebar />} leftPanelWidth={280}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout leftPanel={<DashboardSidebar />} leftPanelWidth={280}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <PageTitle component="h1" gutterBottom>
            API Key Management
          </PageTitle>
          <PageDescription>
            Manage all API keys across your organization
          </PageDescription>
        </Box>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <KeyIcon color="primary" />
                  <Box>
                    <MetricValue>
                      {stats.total || 0}
                    </MetricValue>
                    <Typography variant="body2" color="text.secondary">
                      Total Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SecurityIcon color="success" />
                  <Box>
                    <MetricValue>
                      {stats.active || 0}
                    </MetricValue>
                    <Typography variant="body2" color="text.secondary">
                      Active Keys
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AnalyticsIcon color="info" />
                  <Box>
                    <MetricValue>
                      {stats.totalCalls?.toLocaleString() || 0}
                    </MetricValue>
                    <Typography variant="body2" color="text.secondary">
                      Total API Calls
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AgentIcon color="secondary" />
                  <Box>
                    <MetricValue>
                      {getUniqueAgents().length}
                    </MetricValue>
                    <Typography variant="body2" color="text.secondary">
                      Connected Agents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Search API keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="revoked">Revoked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Agent</InputLabel>
                  <Select
                    value={agentFilter}
                    label="Agent"
                    onChange={(e) => setAgentFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Agents</MenuItem>
                    {getUniqueAgents().map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {selectedKeys.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RevokeIcon />}
                      onClick={() => setBulkRevokeDialogOpen(true)}
                    >
                      Revoke ({selectedKeys.length})
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* API Keys Table */}
        <Card>
          <CardContent>
            <CardTitle component="h2" gutterBottom>
              API Keys ({filteredKeys.length})
            </CardTitle>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedKeys.length === filteredKeys.length && filteredKeys.length > 0}
                        indeterminate={selectedKeys.length > 0 && selectedKeys.length < filteredKeys.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No API keys found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeys.map((key) => (
                      <TableRow key={key.id} selected={selectedKeys.includes(key.id)}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedKeys.includes(key.id)}
                            onChange={() => handleSelectKey(key.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {key.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {key.agent_id.slice(-8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={key.status}
                            size="small"
                            color={getStatusColor(key.status)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(key.total_calls || 0).toLocaleString()} calls
                          </Typography>
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
                        <TableCell>
                          <Typography variant="body2">
                            {key.created_by_name || 'Unknown User'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Revoke Key">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRevokeKey(key.id)}
                              disabled={key.status !== 'active'}
                            >
                              <RevokeIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Bulk Revoke Dialog */}
        <Dialog open={bulkRevokeDialogOpen} onClose={() => setBulkRevokeDialogOpen(false)}>
          <DialogTitle>Revoke Multiple API Keys</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to revoke {selectedKeys.length} API key{selectedKeys.length > 1 ? 's' : ''}?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. The revoked keys will stop working immediately.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleBulkRevoke}
              disabled={bulkRevoking}
              startIcon={bulkRevoking ? <CircularProgress size={16} /> : <RevokeIcon />}
            >
              {bulkRevoking ? 'Revoking...' : 'Revoke Keys'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

export default ApiManagement;