/**
 * Tool Discovery Panel
 * 
 * Component for discovering and managing tools through various methods
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  SettingsInputComponent as McpIcon
} from '@mui/icons-material';
import { formatFileSize, formatDate } from '../../../../utils/agentEditorHelpers';
import FileUploadArea from '../../../Alchemist/FileUpload/FileUploadArea';
import UnifiedToolBuilder from '../UnifiedToolCreation/UnifiedToolBuilder';
import { testTool, getPublicTools } from '../../../../services/tools/toolsService';
import { getAllToolConfigs, deleteToolConfiguration } from '../../../../services/tools/toolConfigurationService';
import toolManagerService from '../../../../services/tools/toolManagerService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`discovery-tabpanel-${index}`}
      aria-labelledby={`discovery-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ToolDiscoveryPanel = ({
  agentId,
  tools = [],
  testResults = {},
  onTestResults,
  onToolAdd,
  onToolDelete,
  onToolsRefresh, // New prop to refresh tools from Firestore after testing
  uploading = false,
  uploadProgress = 0,
  uploadStatus = '',
  disabled = false,
  showUploadDialog = false,
  onCloseUploadDialog = () => {},
  showMcpUploadDialog = false,
  onCloseMcpUploadDialog = () => {},
  onMcpUpload = () => {},
  showUnifiedToolDialog = false,
  onCloseUnifiedToolDialog = () => {},
  onUnifiedToolCreate = () => {},
  showEditToolDialog = false,
  onCloseEditToolDialog = () => {},
  onOpenEditToolDialog = () => {},
  onEditToolComplete = () => {},
  editingTool = null,
  loading = false // Add loading prop to prevent flash of empty state
}) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tool: null });
  const [extractedTools, setExtractedTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [testDialog, setTestDialog] = useState({ open: false, tool: null });
  const [testParameters, setTestParameters] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [importStatus, setImportStatus] = useState({ message: '', error: false });
  const [importing, setImporting] = useState(false);

  // MCP upload state
  const [mcpImportStatus, setMcpImportStatus] = useState({ message: '', error: false });
  const [mcpImporting, setMcpImporting] = useState(false);

  // Public tools state
  const [enabledPublicTools, setEnabledPublicTools] = useState([]);
  const [loadingPublicTools, setLoadingPublicTools] = useState(false);
  const [removingPublicToolId, setRemovingPublicToolId] = useState(null);

  // Load enabled public tools from tool_configs
  React.useEffect(() => {
    const loadEnabledPublicTools = async () => {
      if (agentId) {
        try {
          setLoadingPublicTools(true);

          // Get all tool configurations
          const toolConfigs = await getAllToolConfigs(agentId);

          // Get all public tools
          const allPublicTools = await getPublicTools();

          // Filter to get enabled public tools with full details
          const enabledConfigIds = toolConfigs
            .filter(config => config.enabled)
            .map(config => config.tool_id);

          const enabled = allPublicTools.filter(tool => enabledConfigIds.includes(tool.id));

          setEnabledPublicTools(enabled);
          setPublicToolsList(allPublicTools);

          console.log('Loaded enabled public tools from tool_configs:', enabled);
        } catch (error) {
          console.error('Error loading enabled public tools:', error);
        } finally {
          setLoadingPublicTools(false);
        }
      }
      loadEnabledPublicTools();
  }, [agentId]);

  // Check if a tool is an MCP config based on filename or metadata
  const isMcpConfig = (tool) => {
    const filename = tool.filename || tool.name || '';
    // Check if filename suggests it's an MCP config
    return filename.toLowerCase().includes('mcp') ||
           tool.type === 'mcp' ||
           tool.source === 'mcp' ||
           tool.upload_method === 'mcp_configuration';
  // Get test status icon based on tool test status
  const getTestStatusIcon = (tool) => {
    const testStatus = tool.test_status?.status;

    if (!testStatus || testStatus === 'not_tested') {
      // No test done - gray waiting icon
      return <HourglassEmptyIcon sx={{ color: 'text.secondary' }} />;
    }

    if (testStatus === 'pass') {
      // Test successful - green tick
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (testStatus === 'fail') {
      // Test failed - red cross
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    } else {
      // Unknown status - gray waiting icon
      return <HourglassEmptyIcon sx={{ color: 'text.secondary' }} />;
    }

  const handleUploadComplete = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setImporting(true);
    setImportStatus({ message: 'Reading OpenAPI file...', error: false });

    try {
      // Read file contents
      const fileContent = await file.text();
      setImportStatus({ message: 'Parsing OpenAPI specification...', error: false });

      // Parse JSON or YAML
      let parsedSpec;
      try {
        if (file.name.endsWith('.json')) {
          parsedSpec = JSON.parse(fileContent);
        } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          // Note: For YAML files, you might need to add a YAML parser library
          // For now, try JSON parse (OpenAPI can be JSON format even with .yaml extension)
          parsedSpec = JSON.parse(fileContent);
        } else {
          throw new Error('Unsupported file format. Please upload .json, .yaml, or .yml files');
        }
      } catch (parseError) {
        throw new Error(`Failed to parse file: ${parseError.message}`);
      }

      setImportStatus({ message: 'Importing tools to Firestore...', error: false });

      // Import tools via tool-manager
      const result = await toolManagerService.importFromOpenAPI(
        parsedSpec,
        agentId,
        'private'
      );

      // Success
      setImportStatus({
        message: `Successfully created ${result.tools_created} tool${result.tools_created !== 1 ? 's' : ''}!`,
        error: false
      });

      // Refresh tools list
      if (onToolsRefresh) {
        await onToolsRefresh();
      }

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onCloseUploadDialog();
        setToolName('');
        setExtractedTools([]);
        setSelectedTools([]);
        setImportStatus({ message: '', error: false });
        setImporting(false);
      }, 2000);

    } catch (error) {
      console.error('Error importing OpenAPI tools:', error);
      setImportStatus({
        message: error.message || 'Failed to import tools from OpenAPI specification',
        error: true
      });
      setImporting(false);
    }
  const handleMcpUploadComplete = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setMcpImporting(true);
    setMcpImportStatus({ message: 'Uploading MCP configuration...', error: false });

    try {
      // Call the MCP upload handler passed from parent
      await onMcpUpload(file);

      // Success
      setMcpImportStatus({
        message: `Successfully uploaded ${file.name}!`,
        error: false
      });

      // Refresh tools list
      if (onToolsRefresh) {
        await onToolsRefresh();
      }

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onCloseMcpUploadDialog();
        setMcpImportStatus({ message: '', error: false });
        setMcpImporting(false);
      }, 2000);

    } catch (error) {
      console.error('Error uploading MCP configuration:', error);
      setMcpImportStatus({
        message: error.message || 'Failed to upload MCP configuration',
        error: true
      });
      setMcpImporting(false);
    }
    setExtractedTools(tools);
    setSelectedTools(tools.map(tool => tool.id)); // Select all by default
  const handleToolSelection = (toolId, selected) => {
    setSelectedTools(prev => 
      selected 
        ? [...prev, toolId]
        : prev.filter(id => id !== toolId)
    );
  const handleImportSelectedTools = () => {
    const toolsToImport = extractedTools.filter(tool => selectedTools.includes(tool.id));
    console.log('Importing selected tools:', toolsToImport);
    // Here you would typically call an API to import the selected tools
    onCloseUploadDialog();
    setExtractedTools([]);
    setSelectedTools([]);
  const handleDeleteClick = (tool) => {
    setDeleteDialog({ open: true, tool });
  const handleDeleteConfirm = () => {
    if (deleteDialog.tool && onToolDelete) {
      onToolDelete(deleteDialog.tool.id, deleteDialog.tool.filename || deleteDialog.tool.name);
    }
    setDeleteDialog({ open: false, tool: null });
  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, tool: null });
  const handleUnifiedToolCreate = async (toolConfig) => {
    try {
      await onUnifiedToolCreate(toolConfig);
      onCloseUnifiedToolDialog();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error in tool creation:', error);
    }
  const handleEditToolComplete = async (toolConfig) => {
    try {
      await onEditToolComplete(toolConfig);
      onCloseEditToolDialog();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error in tool editing:', error);
    }
  const handleOpenEditToolDialog = (tool) => {
    console.log('=== EDIT TOOL CLICKED ===');
    console.log('ToolDiscoveryPanel: Raw tool data:', tool);
    console.log('Tool has url_components:', !!tool.url_components);
    console.log('url_components content:', tool.url_components);
    console.log('Tool has name:', !!tool.name, tool.name);
    console.log('Tool has method:', !!tool.method, tool.method);
    onOpenEditToolDialog(tool);
  const handleTestTool = async (tool) => {
    setTesting(true);
    setTestResult(null); // Clear previous result
    try {
      const result = await testTool(tool.id, testParameters);

      // Store result for display
      setTestResult(result);

      const newResults = {
        ...testResults,
        [tool.id]: result
      };
      onTestResults(newResults);

      // Refresh tools from Firestore to get updated test_status field
      if (onToolsRefresh) {
        await onToolsRefresh();
      }

      // Show notification - don't close dialog yet, let user review results
      // Note: Using console.log as fallback if no notification system available
      if (result.success) {
        console.log(`✓ Test passed! Response time: ${result.response_time?.toFixed(0)}ms`);
      } else {
        console.error(`✗ Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Tool test failed:', error);
      const errorResult = {
        success: false,
        status_code: 500,
        error: error.message || 'Test failed',
        response_time: 0
          // Store error result for display
      setTestResult(errorResult);

      const newResults = {
        ...testResults,
        [tool.id]: errorResult
      };
      onTestResults(newResults);

      // Also refresh on error to get any partial updates
      if (onToolsRefresh) {
        await onToolsRefresh();
      }
    } finally {
      setTesting(false);
    }
  const handleOpenTestDialog = (tool) => {
    setTestDialog({ open: true, tool });
    setTestResult(null); // Clear previous test result

    const defaultParams = {};
    const toolParameters = tool.parameters || tool.configuration?.parameters || [];
    toolParameters.forEach(param => {
      defaultParams[param.name] = param.default || param.default_value || param.example || '';
    });
    setTestParameters(defaultParams);
  const handleParameterChange = (paramName, value) => {
    setTestParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  const handleRemovePublicTool = async (toolId, toolName) => {
    try {
      setRemovingPublicToolId(toolId);
      await deleteToolConfiguration(agentId, toolId);

      // Update local state
      setEnabledPublicTools(prev => prev.filter(tool => tool.id !== toolId));

      console.log(`Successfully removed public tool: ${toolName}`);
    } catch (error) {
      console.error('Error removing public tool:', error);
      // Could show notification here if needed
    } finally {
      setRemovingPublicToolId(null);
    }
  const EmptyState = () => (
    <Box 
      sx={{ 
        textAlign: 'center', 
        py: 6,
        color: 'text.secondary'
      }}
    >
      <BuildIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        No Tools Available
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Use the buttons above to add tools from OpenAPI specifications or create custom tools manually
      </Typography>
    </Box>
  );


  const renderExtractedTools = () => (
    extractedTools.length > 0 && (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Found {extractedTools.length} Tools in Specification
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Select the tools you want to add to your agent. You can always add more later.
        </Alert>
        <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
          <FormGroup>
            {extractedTools.map((tool, index) => (
              <Box key={tool.id || index} sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedTools.includes(tool.id)}
                      onChange={(e) => handleToolSelection(tool.id, e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {tool.name}
                        </Typography>
                        <Chip 
                          label={tool.method} 
                          size="small" 
                          color={
                            tool.method === 'GET' ? 'success' :
                            tool.method === 'POST' ? 'primary' :
                            tool.method === 'PUT' ? 'warning' :
                            tool.method === 'DELETE' ? 'error' : 'default'
                          }
                        />
                        {tool.parameters && tool.parameters.length > 0 && (
                          <Chip 
                            label={`${tool.parameters.length} params`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {tool.description || 'No description available'}
                      </Typography>
                      {tool.path && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {tool.path}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                {index < extractedTools.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </FormGroup>
        </Paper>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="outlined"
            onClick={() => {
              const allSelected = selectedTools.length === extractedTools.length;
              setSelectedTools(allSelected ? [] : extractedTools.map(tool => tool.id));
            }}
          >
            {selectedTools.length === extractedTools.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleImportSelectedTools}
            disabled={selectedTools.length === 0}
            startIcon={<CheckCircleIcon />}
          >
            Import {selectedTools.length} Selected Tool{selectedTools.length !== 1 ? 's' : ''}
          </Button>
        </Box>
      </Box>
    )
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading || loadingPublicTools ? null : tools.length === 0 && enabledPublicTools.length === 0 ? (
          <EmptyState />
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Private Tools Section */}
            {tools.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="overline" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                  Private Tools ({tools.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {tools.map((tool, index) => (
                    <Box
                      key={tool.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 1,
                        px: 1.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      {/* Status Icon */}
                      <Box sx={{ flexShrink: 0 }}>
                        {getTestStatusIcon(tool)}
                      </Box>

                      {/* Tool Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                            {tool.filename || tool.name || 'Unknown Tool'}
                          </Typography>
                          {isMcpConfig(tool) && (
                            <Chip
                              icon={<McpIcon sx={{ fontSize: '0.75rem' }} />}
                              label="MCP"
                              size="small"
                              color="secondary"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                          {tool.test_status && tool.test_status.status !== 'not_tested' && (
                            <Chip
                              label={tool.test_status.status === 'pass' ? 'Pass' : 'Fail'}
                              size="small"
                              color={tool.test_status.status === 'pass' ? 'success' : 'error'}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                          {(tool.method || tool.configuration?.method) && (
                            <Chip
                              label={tool.method || tool.configuration?.method}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                        {tool.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                            {tool.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title="Test">
                          <IconButton
                            onClick={() => handleOpenTestDialog(tool)}
                            size="small"
                            disabled={disabled}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleOpenEditToolDialog(tool)}
                            size="small"
                            disabled={disabled}
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDeleteClick(tool)}
                            size="small"
                            disabled={disabled}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Enabled Public Tools Section */}
            {enabledPublicTools.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                  Public Tools ({enabledPublicTools.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {enabledPublicTools.map((tool, index) => (
                    <Box
                      key={tool.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 1,
                        px: 1.5,
                        borderRadius: 1,
                        bgcolor: 'success.50',
                        '&:hover': {
                          bgcolor: 'success.100'
                        }
                      }}
                    >
                      {/* Icon */}
                      <Box sx={{ flexShrink: 0 }}>
                        <PublicIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      </Box>

                      {/* Tool Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                            {tool.name || 'Unknown Tool'}
                          </Typography>
                          <Chip
                            label="Public"
                            size="small"
                            color="success"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </Box>
                        {tool.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                            {tool.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Remove Action */}
                      <Box sx={{ flexShrink: 0 }}>
                        <Tooltip title="Remove">
                          <IconButton
                            onClick={() => handleRemovePublicTool(tool.id, tool.name)}
                            size="small"
                            disabled={disabled || removingPublicToolId === tool.id}
                          >
                            {removingPublicToolId === tool.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* OpenAPI Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => !importing && onCloseUploadDialog()}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={importing}
      >
        <DialogTitle>Import Tools from OpenAPI Specification</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload OpenAPI 3.0+ specifications (YAML or JSON) to automatically extract and import tools
          </Alert>

          {/* Import Status */}
          {importStatus.message && (
            <Box sx={{ mb: 3 }}>
              <Alert
                severity={importStatus.error ? 'error' : 'info'}
                icon={importing && !importStatus.error ? <CircularProgress size={20} /> : undefined}
              >
                {importStatus.message}
              </Alert>
            </Box>
          )}

          <FileUploadArea
            onFilesUploaded={handleUploadComplete}
            onCancel={() => !importing && onCloseUploadDialog()}
            accept=".yaml,.yml,.json"
            maxFiles={1}
            multiple={false}
            title="Select OpenAPI Specification"
            description="Upload OpenAPI spec to extract tools automatically"
            disabled={importing}
          />
        </DialogContent>

        {importing && (
          <DialogActions>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Please wait while your OpenAPI file is being processed...
            </Typography>
          </DialogActions>
        )}

        {!importing && importStatus.error && (
          <DialogActions>
            <Button onClick={onCloseUploadDialog}>
              Close
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* MCP Config Upload Dialog */}
      <Dialog
        open={showMcpUploadDialog}
        onClose={() => !mcpImporting && onCloseMcpUploadDialog()}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={mcpImporting}
      >
        <DialogTitle>Upload MCP Configuration</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload Model Context Protocol configuration files (JSON or YAML) to configure MCP integrations
          </Alert>

          {/* Import Status */}
          {mcpImportStatus.message && (
            <Box sx={{ mb: 3 }}>
              <Alert
                severity={mcpImportStatus.error ? 'error' : 'info'}
                icon={mcpImporting && !mcpImportStatus.error ? <CircularProgress size={20} /> : undefined}
              >
                {mcpImportStatus.message}
              </Alert>
            </Box>
          )}

          <FileUploadArea
            onFilesUploaded={handleMcpUploadComplete}
            onCancel={() => !mcpImporting && onCloseMcpUploadDialog()}
            accept=".json,.yaml,.yml"
            maxFiles={1}
            multiple={false}
            title="Select MCP Configuration"
            description="Upload MCP config file (JSON or YAML)"
            disabled={mcpImporting}
          />
        </DialogContent>

        {mcpImporting && (
          <DialogActions>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Please wait while your MCP configuration is being uploaded...
            </Typography>
          </DialogActions>
        )}

        {!mcpImporting && mcpImportStatus.error && (
          <DialogActions>
            <Button onClick={onCloseMcpUploadDialog}>
              Close
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Unified Tool Builder Dialog */}
      {showUnifiedToolDialog && (
        <UnifiedToolBuilder
          open={showUnifiedToolDialog}
          onClose={onCloseUnifiedToolDialog}
          onToolCreate={handleUnifiedToolCreate}
          agentId={agentId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Tool</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.tool?.filename || deleteDialog.tool?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will also remove any deployed MCP servers using this tool.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Tool Dialog */}
      <Dialog
        open={testDialog.open}
        onClose={() => !testing && setTestDialog({ open: false, tool: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Test Tool: {testDialog.tool?.name || testDialog.tool?.filename}
            {(testDialog.tool?.method || testDialog.tool?.configuration?.method) && (
              <Chip 
                label={testDialog.tool?.method || testDialog.tool?.configuration?.method} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {testDialog.tool?.description && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {testDialog.tool.description}
            </Alert>
          )}
          
          {(testDialog.tool?.parameters?.length > 0 || testDialog.tool?.configuration?.parameters?.length > 0) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Test Parameters</Typography>
              <Grid container spacing={2}>
                {(testDialog.tool?.parameters || testDialog.tool?.configuration?.parameters || []).map((param, index) => (
                  <Grid item xs={12} sm={param.type === 'string' && param.multiline ? 12 : 6} key={index}>
                    <TextField
                      fullWidth
                      size="small"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {param.name}
                          {param.required && <span style={{ color: 'red' }}>*</span>}
                          <Chip
                            label={param.location || param.in_ || param.in || 'query'}
                            size="small"
                            color={
                              (param.location || param.in_ || param.in) === 'path' ? 'error' :
                              (param.location || param.in_ || param.in) === 'query' ? 'primary' :
                              (param.location || param.in_ || param.in) === 'header' ? 'info' : 'default'
                            }
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        </Box>
                      }
                      value={testParameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={param.example || `Enter ${param.name}`}
                      helperText={param.description}
                      required={param.required}
                      multiline={param.type === 'string' && param.description?.includes('long')}
                      rows={param.type === 'string' && param.description?.includes('long') ? 3 : 1}
                      type={
                        param.type === 'number' || param.type === 'integer' ? 'number' :
                        param.format === 'email' ? 'email' :
                        param.format === 'password' ? 'password' : 'text'
                      }
                      disabled={testing}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Test Results Display */}
          {testResult && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Test Results</Typography>

              {/* Result Status */}
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {testResult.success ? 'Test Passed!' : 'Test Failed'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Status Code: {testResult.status_code} • Response Time: {testResult.response_time?.toFixed(0)}ms
                  </Typography>
                </Box>
              </Alert>

              {/* Error Message */}
              {testResult.error && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'error.main' }}>
                    Error Message:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                      {testResult.error}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Response Data */}
              {testResult.response_data && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Response Data:
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      maxHeight: 300,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(testResult.response_data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          {testResult ? (
            // Show Run Again and Close buttons after test is complete
            <>
              <Button
                onClick={() => setTestResult(null)}
                startIcon={<PlayArrowIcon />}
              >
                Run Test Again
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                onClick={() => {
                  setTestDialog({ open: false, tool: null });
                  setTestResult(null);
                }}
                variant="contained"
              >
                Close
              </Button>
            </>
          ) : (
            // Show Cancel and Run Test buttons before/during test
            <>
              <Button
                onClick={() => setTestDialog({ open: false, tool: null })}
                disabled={testing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleTestTool(testDialog.tool)}
                variant="contained"
                disabled={testing}
                startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              >
                {testing ? 'Testing...' : 'Run Test'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>


      {/* Edit Tool Dialog */}
      <UnifiedToolBuilder
        open={showEditToolDialog}
        onClose={onCloseEditToolDialog}
        onToolCreate={handleEditToolComplete}
        agentId={agentId}
        existingTool={editingTool}
      />
    </Box>
  );
};

export default ToolDiscoveryPanel;