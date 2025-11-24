/**
 * Agent Documents Content Component
 *
 * Manage agent's document library - upload, list, edit, delete documents
 * that agents can share with users via the file_manager tool
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Alert,
  Stack,
  InputAdornment,
  Menu,
  Divider,
  Avatar,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Upload as UploadIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  FolderZip as ZipIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { CardTitle, ListTitle, HelperText, MetricValue } from '../../utils/typography';
import { useAuth } from '../../utils/AuthContext';
import documentService from '../../services/documents/documentService';
import EmptyState from '../shared/EmptyState';

// Format icon mapping
const formatIcons = {
  'pdf': PdfIcon,
  'docx': DocIcon,
  'doc': DocIcon,
  'xlsx': ExcelIcon,
  'xls': ExcelIcon,
  'csv': ExcelIcon,
  'txt': DocIcon,
  'jpg': ImageIcon,
  'jpeg': ImageIcon,
  'png': ImageIcon,
  'gif': ImageIcon,
  'mp4': VideoIcon,
  'mp3': AudioIcon,
  'zip': ZipIcon,
  'rar': ZipIcon
};

// Category options
const categories = [
  { value: 'catalog', label: 'Catalog' },
  { value: 'manual', label: 'Manual' },
  { value: 'price_list', label: 'Price List' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'form', label: 'Form' },
  { value: 'template', label: 'Template' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' }
];

const AgentDocumentsContent = ({ agentId }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();

  // State
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    name: '',
    description: '',
    category: 'other',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editMetadata, setEditMetadata] = useState({
    name: '',
    description: '',
    category: '',
    tags: []
  });
  const [editTagInput, setEditTagInput] = useState('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuDocument, setMenuDocument] = useState(null);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Load documents
  const loadDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const docs = await documentService.listDocuments(agentId, {});

      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Load statistics
  const loadStats = React.useCallback(async () => {
    try {
      const documentStats = await documentService.getDocumentStats(agentId);
      setStats(documentStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [agentId]);

  // Load documents on mount
  useEffect(() => {
    if (agentId) {
      loadDocuments();
      loadStats();
    }
  }, [agentId, loadDocuments, loadStats]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadMetadata(prev => ({
        ...prev,
        name: prev.name || file.name
      }));
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setUploadMetadata(prev => ({
        ...prev,
        name: prev.name || file.name
      }));
      setUploadDialogOpen(true);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const metadata = {
        ...uploadMetadata,
        uploaded_by: currentUser.uid
      };

      await documentService.uploadDocument(
        agentId,
        selectedFile,
        metadata,
        (progress) => setUploadProgress(progress)
      );

      // Reset and reload
      setUploadDialogOpen(false);
      resetUploadForm();
      await loadDocuments();
      await loadStats();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadMetadata({
      name: '',
      description: '',
      category: 'other',
      tags: []
    });
    setTagInput('');
    setUploadProgress(0);
  };

  // Handle tag add (upload form)
  const handleAddTag = () => {
    if (tagInput.trim()) {
      setUploadMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Handle tag remove (upload form)
  const handleRemoveTag = (tagToRemove) => {
    setUploadMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle edit open
  const handleEditOpen = (document) => {
    setEditingDocument(document);
    setEditMetadata({
      name: document.name || '',
      description: document.description || '',
      category: document.category || 'other',
      tags: document.tags || []
    });
    setEditTagInput('');
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingDocument) return;

    try {
      await documentService.updateDocument(agentId, editingDocument.id, editMetadata);
      setEditDialogOpen(false);
      setEditingDocument(null);
      await loadDocuments();
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err.message);
    }
  };

  // Handle edit tag add
  const handleEditAddTag = () => {
    if (editTagInput.trim()) {
      setEditMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, editTagInput.trim()]
      }));
      setEditTagInput('');
    }
  };

  // Handle edit tag remove
  const handleEditRemoveTag = (tagToRemove) => {
    setEditMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle delete
  const handleDeleteOpen = (document) => {
    setDeletingDocument(document);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDocument) return;

    try {
      setDeleting(true);
      await documentService.deleteDocument(agentId, deletingDocument.id);
      setDeleteDialogOpen(false);
      setDeletingDocument(null);
      await loadDocuments();
      await loadStats();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Handle download
  const handleDownload = (document) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
    setMenuAnchor(null);
  };

  // Get format icon
  const getFormatIcon = (format) => {
    const IconComponent = formatIcons[format?.toLowerCase()] || FileIcon;
    return IconComponent;
  };

  // Format upload date
  const formatUploadDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Unknown';
    }
  };

  // No agent selected
  if (!agentId) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="No Agent Selected"
        subtitle="Please select an agent from the sidebar to manage its document library."
        useCard={true}
      />
    );
  }

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Document Library
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upload documents that your agent can share with users
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        </Box>

        {/* Stats */}
        {stats && (
          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <Box>
              <HelperText color="text.secondary">Total Documents</HelperText>
              <MetricValue fontWeight="600">{stats.total_documents}</MetricValue>
            </Box>
            <Box>
              <HelperText color="text.secondary">Total Size</HelperText>
              <MetricValue fontWeight="600">{stats.total_size_mb} MB</MetricValue>
            </Box>
          </Box>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CloudUploadIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No documents yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload documents that your agent can share with users
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload First Document
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Shares</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => {
                  const FormatIcon = getFormatIcon(doc.format);
                  return (
                    <TableRow key={doc.id} hover>
                      {/* Column 1: Document Name with Icon */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FormatIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {doc.name}
                            </Typography>
                            {doc.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                                {doc.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Column 2: File Type */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {doc.format?.toUpperCase() || 'Unknown'}
                        </Typography>
                      </TableCell>

                      {/* Column 3: Category */}
                      <TableCell>
                        <Chip
                          label={doc.category || 'other'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>

                      {/* Column 4: File Size */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {documentService.formatFileSize(doc.size_kb)}
                        </Typography>
                      </TableCell>

                      {/* Column 5: Share Count */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShareIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          <Typography variant="body2" color="text.secondary">
                            {doc.share_count || 0}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Column 6: Upload Date */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatUploadDate(doc.created_at || doc.uploaded_at)}
                        </Typography>
                      </TableCell>

                      {/* Column 7: Actions */}
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            setMenuDocument(doc);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          {!selectedFile ? (
            <Box
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: isDragging ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
              />
              <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <CardTitle gutterBottom>
                Choose a file or drag it here
              </CardTitle>
              <Typography variant="body2" color="text.secondary">
                Supported: PDF, Word, Excel, Images, Videos (Max 50MB)
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                Selected: {selectedFile.name} ({documentService.formatFileSize(Math.round(selectedFile.size / 1024))})
              </Alert>

              <TextField
                fullWidth
                label="Document Name"
                value={uploadMetadata.name}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, name: e.target.value }))}
                required
              />

              <TextField
                fullWidth
                label="Description"
                value={uploadMetadata.description}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={uploadMetadata.category}
                  label="Category"
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <TextField
                  fullWidth
                  label="Add Tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddTag} edge="end">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {uploadMetadata.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    {uploadMetadata.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        onDelete={() => handleRemoveTag(tag)}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {uploading && (
                <Box>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialogOpen(false); resetUploadForm(); }} disabled={uploading}>
            Cancel
          </Button>
          {selectedFile && (
            <Button onClick={() => setSelectedFile(null)} disabled={uploading}>
              Change File
            </Button>
          )}
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !uploadMetadata.name || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Document Name"
              value={editMetadata.name}
              onChange={(e) => setEditMetadata(prev => ({ ...prev, name: e.target.value }))}
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={editMetadata.description}
              onChange={(e) => setEditMetadata(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editMetadata.category}
                label="Category"
                onChange={(e) => setEditMetadata(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <TextField
                fullWidth
                label="Add Tags"
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEditAddTag()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleEditAddTag} edge="end">
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {editMetadata.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {editMetadata.tags.map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      size="small"
                      onDelete={() => handleEditRemoveTag(tag)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingDocument?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleDownload(menuDocument)}>
          <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Download
        </MenuItem>
        <MenuItem onClick={() => handleEditOpen(menuDocument)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteOpen(menuDocument)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Drag overlay */}
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: 3,
            borderStyle: 'dashed',
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CloudUploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" color="primary">
              Drop file to upload
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AgentDocumentsContent;
