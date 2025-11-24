/**
 * URL Content Upload Area
 * 
 * Component for scraping website content and adding it as knowledge
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider
} from '@mui/material';
import {
  Link as LinkIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ProcessingIcon,
  Language as WebIcon
} from '@mui/icons-material';
import { addUrlToKnowledgeLibrary } from '../../../services/knowledgeBase/knowledgeLibraryService';

const URLContentUploadArea = ({
  agentId,  // Required for API call
  onContentUploaded,
  onCancel,
  onButtonStateChange, // New callback for button states
  title = "Add Knowledge from URLs",
  description = "Enter website URLs to scrape content for your agent's knowledge base"
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');


  // URL validation
  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    const cleanUrl = urlInput.trim();

    if (!validateUrl(cleanUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    if (urls.find(item => item.url === cleanUrl)) {
      setError('This URL has already been added');
      return;
    }

    const newUrlItem = {
      id: Date.now().toString(),
      url: cleanUrl,
      status: 'processing', // Start as processing since we submit immediately
      title: '',
      content: '',
      error: null
    };

    setUrls(prev => [...prev, newUrlItem]);
    setUrlInput('');
    setError('');
    setSuccessMessage('');

    // Immediately process the URL
    await processUrlContent(newUrlItem);
  };

  const handleRemoveUrl = (id) => {
    setUrls(prev => prev.filter(item => item.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  };

  // Process URLs - now uses real API to add URLs to knowledge base
  const processUrlContent = async (urlItem) => {
    try {
      // Update status to processing
      setUrls(prev => prev.map(item =>
        item.id === urlItem.id
          ? { ...item, status: 'processing' }
          : item
      ));

      // Call the real API to add URL to knowledge base
      console.log(`Adding URL to knowledge base: ${urlItem.url}`);

      // Extract basic info from URL for display
      const urlObj = new URL(urlItem.url);
      const domain = urlObj.hostname;
      const title = urlItem.title || `Content from ${domain}`;

      // Call the API
      const result = await addUrlToKnowledgeLibrary(agentId, urlItem.url, {
        title: title,
        description: urlItem.description || `Web content from ${urlItem.url}`
      });

      // Update with success status
      setUrls(prev => prev.map(item =>
        item.id === urlItem.id
          ? {
              ...item,
              status: 'completed',
              title: title,
              content: `Queued for indexing`, // Success message
              knowledge_id: result.knowledge_id // Store the knowledge ID
            }
          : item
      ));

      setSuccessMessage(`URL successfully added to knowledge base and queued for indexing`);

    } catch (error) {
      // Update with error
      setUrls(prev => prev.map(item =>
        item.id === urlItem.id
          ? {
              ...item,
              status: 'error',
              error: error.message
            }
          : item
      ));
    }
  };

  // Removed mock implementation and handleScrapeAll - URLs are now processed immediately when added

  // Removed handleUpload - URLs are now processed immediately when added

  // Notify parent about button states
  React.useEffect(() => {
    if (onButtonStateChange) {
      const completedUrls = urls.filter(item => item.status === 'completed');
      const hasErrors = urls.some(item => item.status === 'error');
      onButtonStateChange({
        canClose: !processing,
        processing: processing,
        completedCount: completedUrls.length,
        totalCount: urls.length,
        hasErrors: hasErrors
      });
    }
  }, [urls, processing, onButtonStateChange]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'processing': return <ProcessingIcon color="primary" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <WebIcon color="action" />;
    }
  };

  const getStatusChip = (status, error) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: 'default' },
      'processing': { label: 'Adding...', color: 'primary' },
      'completed': { label: 'Queued for indexing', color: 'success' },
      'error': { label: 'Failed', color: 'error' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Chip 
        size="small" 
        label={config.label} 
        color={config.color}
        title={error || ''}
      />
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      {/* URL Input */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Add URLs
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="https://example.com/page"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={processing}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAddUrl}
            disabled={processing}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mt: 1 }}>
            {successMessage}
          </Alert>
        )}
      </Paper>

      {/* URLs List */}
      {urls.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2">
              URLs Added ({urls.length})
            </Typography>
          </Box>

          <List dense>
            {urls.map((urlItem, index) => (
              <React.Fragment key={urlItem.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(urlItem.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {urlItem.url}
                        </Typography>
                        {getStatusChip(urlItem.status, urlItem.error)}
                      </Box>
                    }
                    secondary={
                      urlItem.title && (
                        <Typography variant="caption" color="text.secondary">
                          {urlItem.title}
                        </Typography>
                      )
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveUrl(urlItem.id)}
                      disabled={processing}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {urlItem.status === 'processing' && (
                  <Box sx={{ px: 2, pb: 1 }}>
                    <LinearProgress size={2} />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Action buttons moved to parent dialog */}
    </Box>
  );
};

export default URLContentUploadArea;