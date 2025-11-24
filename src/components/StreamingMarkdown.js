import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/styles';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import './StreamingMarkdown.css';
import 'katex/dist/katex.min.css';

const StreamingMarkdown = ({ 
  content, 
  isStreaming = false, 
  darkMode = false,
  fontSize = 'body2' 
}) => {
  
  // Buffer incomplete markdown blocks during streaming to prevent rendering errors
  const processedContent = useMemo(() => {
    if (!isStreaming) return content;
    
    // During streaming, handle incomplete code blocks and other structures
    let processed = content;
    
    // Count open code blocks
    const codeBlockMarkers = (content.match(/```/g) || []).length;
    const isCodeBlockOpen = codeBlockMarkers % 2 !== 0;
    
    // If code block is incomplete during streaming, temporarily close it
    if (isCodeBlockOpen && isStreaming) {
      processed += '\n```';
    }
    
    // Handle incomplete tables (basic detection)
    const lines = processed.split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine && lastLine.includes('|') && !lastLine.trim().endsWith('|')) {
      // Incomplete table row, add closing pipe for better rendering
      processed = processed.replace(lastLine, lastLine + ' |');
    }
    
    return processed;
  }, [content, isStreaming]);

  // Custom copy to clipboard functionality
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  // Custom components for enhanced rendering
  const components = useMemo(() => ({
    // Enhanced code blocks with copy functionality
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      
      if (!inline && language) {
        return (
          <Box 
            sx={{ 
              position: 'relative', 
              mb: 2,
              '& pre': { 
                margin: 0,
                borderRadius: 1,
                fontSize: '0.875rem'
              }
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                px: 2,
                py: 1,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderBottom: '1px solid',
                borderColor: darkMode ? '#4a5568' : '#e2e8f0'
              }}
            >
              <Typography variant="caption" sx={{ 
                color: darkMode ? '#a0aec0' : '#4a5568',
                fontWeight: 500,
                textTransform: 'uppercase',
                fontSize: '0.75rem'
              }}>
                {language}
              </Typography>
              <Tooltip title="Copy code">
                <IconButton 
                  size="small" 
                  onClick={() => copyToClipboard(codeString)}
                  sx={{ 
                    color: darkMode ? '#a0aec0' : '#4a5568',
                    '&:hover': {
                      backgroundColor: darkMode ? '#4a5568' : '#e2e8f0'
                    }
                  }}
                >
                  <CopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <SyntaxHighlighter
              style={darkMode ? atomOneDark : atomOneLight}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </Box>
        );
      }
      
      // Inline code
      return (
        <code 
          className={className} 
          style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            color: darkMode ? '#e53e3e' : '#d53f8c',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.875em',
            fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },

    // Enhanced headings with better spacing
    h1: ({ children }) => (
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          mb: 3, 
          mt: 4, 
          fontWeight: 700,
          borderBottom: '2px solid',
          borderColor: darkMode ? '#4a5568' : '#e2e8f0',
          pb: 1
        }}
      >
        {children}
      </Typography>
    ),

    h2: ({ children }) => (
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 2, 
          mt: 3, 
          fontWeight: 600,
          borderBottom: '1px solid',
          borderColor: darkMode ? '#4a5568' : '#e2e8f0',
          pb: 0.5
        }}
      >
        {children}
      </Typography>
    ),

    h3: ({ children }) => (
      <Typography 
        variant="h6" 
        component="h3" 
        sx={{ mb: 2, mt: 3, fontWeight: 600 }}
      >
        {children}
      </Typography>
    ),

    h4: ({ children }) => (
      <Typography 
        variant="subtitle1" 
        component="h4" 
        sx={{ mb: 1, mt: 2, fontWeight: 600 }}
      >
        {children}
      </Typography>
    ),

    h5: ({ children }) => (
      <Typography 
        variant="subtitle2" 
        component="h5" 
        sx={{ mb: 1, mt: 2, fontWeight: 600 }}
      >
        {children}
      </Typography>
    ),

    h6: ({ children }) => (
      <Typography 
        variant="body1" 
        component="h6" 
        sx={{ mb: 1, mt: 2, fontWeight: 600 }}
      >
        {children}
      </Typography>
    ),

    // Enhanced paragraphs
    p: ({ children }) => (
      <Typography 
        variant={fontSize} 
        component="p" 
        sx={{ 
          mb: 2, 
          lineHeight: 1.7,
          color: darkMode ? '#e2e8f0' : '#2d3748'
        }}
      >
        {children}
      </Typography>
    ),

    // Enhanced lists
    ul: ({ children }) => (
      <Box
        component="ul"
        sx={{
          mb: 2,
          pl: 3,
          '& li': {
            mb: 0.5,
            lineHeight: 1.6,
            fontSize: fontSize === 'body1' ? '1rem' : '0.875rem'  // Match paragraph font size
          },
          '& li::marker': {
            color: darkMode ? '#81c784' : '#4caf50'
          }
        }}
      >
        {children}
      </Box>
    ),

    ol: ({ children }) => (
      <Box
        component="ol"
        sx={{
          mb: 2,
          pl: 3,
          '& li': {
            mb: 0.5,
            lineHeight: 1.6,
            fontSize: fontSize === 'body1' ? '1rem' : '0.875rem'  // Match paragraph font size
          },
          '& li::marker': {
            color: darkMode ? '#81c784' : '#4caf50',
            fontWeight: 600
          }
        }}
      >
        {children}
      </Box>
    ),

    // Enhanced blockquotes
    blockquote: ({ children }) => (
      <Box 
        component="blockquote" 
        sx={{ 
          borderLeft: '4px solid',
          borderColor: darkMode ? '#81c784' : '#4caf50',
          backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
          pl: 3,
          py: 2,
          my: 2,
          fontStyle: 'italic',
          '& p': {
            mb: 0
          }
        }}
      >
        {children}
      </Box>
    ),

    // Enhanced links
    a: ({ href, children }) => (
      <Typography 
        component="a" 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ 
          color: darkMode ? '#81c784' : '#4caf50',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        {children}
      </Typography>
    ),

    // Horizontal rule
    hr: () => (
      <Box 
        component="hr" 
        sx={{ 
          border: 'none',
          height: '2px',
          backgroundColor: darkMode ? '#4a5568' : '#e2e8f0',
          my: 3
        }} 
      />
    )
  }), [darkMode, fontSize, copyToClipboard]);

  // Detect if content likely contains markdown
  const containsMarkdown = useMemo(() => {
    if (!content) return false;
    
    const markdownPatterns = [
      /^#{1,6}\s+/m,        // Headers
      /\*\*.*\*\*/,         // Bold
      /\*.*\*/,             // Italic
      /```[\s\S]*```/,      // Code blocks
      /`[^`]+`/,            // Inline code
      /^\s*[-*+]\s+/m,      // Unordered lists
      /^\s*\d+\.\s+/m,      // Ordered lists
      /^\s*>\s+/m,          // Blockquotes
      /\[.*\]\(.*\)/,       // Links
      /\|.*\|/              // Tables
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }, [content]);

  // If no markdown detected, render as plain text with preserved formatting
  if (!containsMarkdown) {
    return (
      <Typography 
        variant={fontSize} 
        component="div" 
        sx={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: 1.7,
          color: darkMode ? '#e2e8f0' : '#2d3748'
        }}
      >
        {content}
      </Typography>
    );
  }

  // Render as markdown
  return (
    <Box className={`streaming-markdown ${darkMode ? 'dark' : 'light'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </Box>
  );
};

export default StreamingMarkdown;