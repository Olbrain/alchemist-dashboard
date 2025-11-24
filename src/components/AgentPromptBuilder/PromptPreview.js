/**
 * Prompt Preview Component
 *
 * Read-only preview of the complete combined prompt
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Collapse,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { SECTION_METADATA } from '../../services/prompts/promptBuilderService';

const PromptPreview = ({
  sections,
  onExport,
  loading = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [combinedPrompt, setCombinedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate combined prompt when sections change
  useEffect(() => {
    if (!sections) return;

    let prompt = '';
    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      const metadata = SECTION_METADATA[sectionName];
      if (sectionData.content && sectionData.content.trim()) {
        prompt += `## ${metadata.title}\n\n`;
        prompt += `${sectionData.content.trim()}\n\n`;
      }
    });

    setCombinedPrompt(prompt.trim());
  }, [sections]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle download as file
  const handleDownload = () => {
    const blob = new Blob([combinedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-prompt-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Count stats
  const charCount = combinedPrompt.length;
  const tokenEstimate = Math.ceil(charCount / 4);
  const lineCount = combinedPrompt.split('\n').length;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.default',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Prompt Preview
          </Typography>
          {charCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {charCount.toLocaleString()} chars • ~{tokenEstimate.toLocaleString()} tokens • {lineCount} lines
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {expanded && charCount > 0 && (
            <>
              <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download as file">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {onExport && (
                <Tooltip title="Refresh preview">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onExport(); }}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : charCount === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No prompt content yet. Start filling out the sections above.
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'grey.300',
                  maxHeight: 500,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {combinedPrompt}
              </Box>

              {/* Actions below preview */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default React.memo(PromptPreview);
