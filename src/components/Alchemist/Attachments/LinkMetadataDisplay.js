import React from 'react';
import { Box, Chip, Typography, Stack } from '@mui/material';
import {
  OpenInNew,
  Description,
  Link as LinkIcon,
  Code,
  MenuBook,
  School,
  GitHub as GitHubIcon,
  VideoLibrary,
  Article
} from '@mui/icons-material';

/**
 * Display component for link metadata in Alchemist messages
 * Shows URLs as context-aware clickable chips instead of full URLs
 */
const LinkMetadataDisplay = ({ links, darkMode }) => {
  if (!links || !Array.isArray(links) || links.length === 0) {
    return null;
  }

  // Get icon based on URL type
  const getIconForType = (type) => {
    const iconMap = {
      'github': <GitHubIcon fontSize="small" />,
      'documentation': <MenuBook fontSize="small" />,
      'api': <Code fontSize="small" />,
      'tutorial': <School fontSize="small" />,
      'youtube': <VideoLibrary fontSize="small" />,
      'wikipedia': <Article fontSize="small" />,
      'knowledge_base': <Description fontSize="small" />,
      'external': <LinkIcon fontSize="small" />
    };
    return iconMap[type] || <OpenInNew fontSize="small" />;
  };

  // Get color based on URL type
  const getColorForType = (type) => {
    const colorMap = {
      'github': darkMode ? '#8b949e' : '#24292f',
      'documentation': darkMode ? '#58a6ff' : '#0969da',
      'api': darkMode ? '#79c0ff' : '#0969da',
      'tutorial': darkMode ? '#a371f7' : '#8250df',
      'youtube': '#ff0000',
      'wikipedia': darkMode ? '#c9d1d9' : '#000000',
      'knowledge_base': darkMode ? '#7ee787' : '#1a7f37',
      'external': darkMode ? '#81c784' : '#4caf50'
    };
    return colorMap[type] || (darkMode ? '#81c784' : '#4caf50');
  };

  // Group links by type for better organization
  const groupedLinks = links.reduce((acc, link) => {
    const type = link.type || 'external';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(link);
    return acc;
  }, {});

  // Type labels for sections
  const typeLabels = {
    'knowledge_base': 'Knowledge Base',
    'documentation': 'Documentation',
    'github': 'Repositories',
    'api': 'API References',
    'tutorial': 'Guides & Tutorials',
    'youtube': 'Videos',
    'wikipedia': 'Articles',
    'external': 'External Links'
  };

  // Handle link click
  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: 1,
        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
      }}
    >
      {Object.keys(groupedLinks).length === 1 ? (
        // Single type - don't show type label
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {links.map((link, index) => (
            <Chip
              key={index}
              icon={getIconForType(link.type)}
              label={link.text}
              onClick={() => handleLinkClick(link.url)}
              variant="outlined"
              size="small"
              sx={{
                cursor: 'pointer',
                color: getColorForType(link.type),
                borderColor: getColorForType(link.type),
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: getColorForType(link.type),
                  opacity: 0.85
                },
                '& .MuiChip-icon': {
                  color: getColorForType(link.type)
                },
                transition: 'all 0.2s ease',
                mb: 1
              }}
            />
          ))}
        </Stack>
      ) : (
        // Multiple types - show grouped by type
        <Stack spacing={1.5}>
          {Object.entries(groupedLinks).map(([type, typeLinks]) => (
            <Box key={type}>
              <Typography
                variant="caption"
                sx={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                  mb: 0.5,
                  display: 'block'
                }}
              >
                {typeLabels[type] || 'Links'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {typeLinks.map((link, index) => (
                  <Chip
                    key={index}
                    icon={getIconForType(link.type)}
                    label={link.text}
                    onClick={() => handleLinkClick(link.url)}
                    variant="outlined"
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      color: getColorForType(link.type),
                      borderColor: getColorForType(link.type),
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: getColorForType(link.type),
                        opacity: 0.85
                      },
                      '& .MuiChip-icon': {
                        color: getColorForType(link.type)
                      },
                      transition: 'all 0.2s ease',
                      mb: 1
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default LinkMetadataDisplay;
