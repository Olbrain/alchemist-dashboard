/**
 * MessageContent Component
 *
 * Renders message content with rich text support including:
 * - Markdown formatting
 * - Auto-linked URLs
 * - Attachments
 * - Code blocks with syntax highlighting
 */
import React, { useMemo } from 'react';
import { Box, Link, Typography } from '@mui/material';
import StreamingMarkdown from '../StreamingMarkdown';
import CompactAttachmentDisplay from './Attachments/CompactAttachmentDisplay';
import LinkMetadataDisplay from './Attachments/LinkMetadataDisplay';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';

const MessageContent = ({
  content,
  attachments = [],
  metadata = {},
  isUser = false,
  darkMode = false,
  fontSize = 'body2',
  isStreaming = false
}) => {

  // URL detection regex pattern
  const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

  // Check if content contains markdown patterns
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
      /\[.*\]\(.*\)/,       // Markdown links
      /\|.*\|/              // Tables
    ];

    return markdownPatterns.some(pattern => pattern.test(content));
  }, [content]);

  // Linkify plain text URLs
  const linkifyText = (text) => {
    if (!text) return null;

    const parts = text.split(urlPattern);
    const matches = text.match(urlPattern) || [];

    const result = [];
    let matchIndex = 0;

    parts.forEach((part, index) => {
      // Add the text part
      if (part) {
        result.push(
          <span key={`text-${index}`}>{part}</span>
        );
      }

      // Add the URL if there's a corresponding match
      if (matchIndex < matches.length && index < parts.length - 1) {
        const url = matches[matchIndex];
        result.push(
          <Link
            key={`link-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: darkMode ? '#81c784' : '#4caf50',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {url}
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Link>
        );
        matchIndex++;
      }
    });

    return result;
  };

  // Render content based on type
  const renderContent = () => {
    if (!content) {
      return null;
    }

    // If content contains markdown, use StreamingMarkdown component
    if (containsMarkdown) {
      return (
        <StreamingMarkdown
          content={content}
          isStreaming={isStreaming}
          darkMode={darkMode}
          fontSize={fontSize}
        />
      );
    }

    // Check if content has URLs that need to be linkified
    const hasUrls = urlPattern.test(content);

    if (hasUrls) {
      // Reset regex lastIndex after test
      urlPattern.lastIndex = 0;

      return (
        <Typography
          variant={fontSize}
          component="div"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.4
          }}
        >
          {linkifyText(content)}
        </Typography>
      );
    }

    // Plain text without URLs or markdown
    return (
      <Typography
        variant={fontSize}
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.4
        }}
      >
        {content}
      </Typography>
    );
  };

  return (
    <Box>
      {/* Render the message content */}
      {renderContent()}

      {/* Render link metadata if present */}
      {metadata && metadata.links && metadata.links.length > 0 && (
        <LinkMetadataDisplay links={metadata.links} darkMode={darkMode} />
      )}

      {/* Render attachments if present */}
      {attachments && attachments.length > 0 && (
        <CompactAttachmentDisplay attachments={attachments} />
      )}
    </Box>
  );
};

export default MessageContent;