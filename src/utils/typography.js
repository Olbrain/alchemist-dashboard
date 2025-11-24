/**
 * Typography Component Wrappers
 *
 * Semantic typography components for consistent visual hierarchy
 *
 * Usage:
 * import { PageTitle, SectionTitle, CardTitle, HelperText } from '../utils/typography';
 * <PageTitle>Organizations</PageTitle>
 * <SectionTitle>Team Members</SectionTitle>
 * <CardTitle>Pricing Plan</CardTitle>
 * <HelperText>Last updated 2 hours ago</HelperText>
 */

import React from 'react';
import { Typography } from '@mui/material';

/**
 * PageTitle - Main heading at the top of a page
 * Usage: Page titles like "Organizations", "Projects", "Settings"
 * Replaces: h2, h3 when used for page titles
 */
export const PageTitle = (props) => (
  <Typography variant="pageTitle" {...props} />
);

/**
 * SectionTitle - Major section headings
 * Usage: Tab names, major content groupings within a page
 * Replaces: h3, h4 when used for section headers
 */
export const SectionTitle = (props) => (
  <Typography variant="sectionTitle" {...props} />
);

/**
 * CardTitle - Card headers, dialog titles
 * Usage: Headers inside cards, modal/dialog titles
 * Replaces: h4, h5, h6 when used for card/dialog titles
 */
export const CardTitle = (props) => (
  <Typography variant="cardTitle" {...props} />
);

/**
 * ListTitle - List item titles, form group titles
 * Usage: Titles for individual list items, form section headers
 * Replaces: h5, h6, body1+fontWeight when used for list/form titles
 */
export const ListTitle = (props) => (
  <Typography variant="listTitle" {...props} />
);

/**
 * HelperText - Small helper text, timestamps, metadata
 * Usage: Helper text below inputs, timestamps, status descriptions
 * Replaces: caption, body2 when used for helper/secondary text
 * Note: Automatically applies text.secondary color
 */
export const HelperText = (props) => (
  <Typography variant="helperText" {...props} />
);

/**
 * EmptyStateText - Text for empty states and informational messages
 * Usage: "No items found", "No data available", "Nothing here yet"
 * Replaces: h6 when used for non-heading informational messages
 * Note: Automatically applies text.secondary color, medium weight for emphasis
 */
export const EmptyStateText = (props) => (
  <Typography variant="emptyStateText" {...props} />
);

/**
 * MetricValue - Large numeric values for metrics and statistics
 * Usage: Dashboard stats, analytics numbers, large data displays
 * Replaces: h3, h4 when used for displaying metric/stat values
 * Note: No default color - use color prop for semantic colors (primary, success, error, etc.)
 */
export const MetricValue = (props) => (
  <Typography variant="metricValue" {...props} />
);

/**
 * PageDescription - Descriptive text below page title
 * Usage: Brief description or instruction below page heading
 * Replaces: body1, body2 with color="text.secondary"
 */
export const PageDescription = ({ children, ...props }) => (
  <Typography variant="body1" color="text.secondary" {...props}>
    {children}
  </Typography>
);

/**
 * SectionDescription - Descriptive text below section title
 * Usage: Brief description below section headers
 * Replaces: body2 with color="text.secondary"
 */
export const SectionDescription = ({ children, ...props }) => (
  <Typography variant="body2" color="text.secondary" {...props}>
    {children}
  </Typography>
);

// Export all components
const typography = {
  PageTitle,
  SectionTitle,
  CardTitle,
  ListTitle,
  HelperText,
  EmptyStateText,
  MetricValue,
  PageDescription,
  SectionDescription,
};

export default typography;
