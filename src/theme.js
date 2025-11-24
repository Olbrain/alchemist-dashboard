/**
 * Centralized Theme Configuration
 *
 * Single source of truth for all design tokens including:
 * - Colors (palette)
 * - Typography (fonts, sizes, weights)
 * - Spacing
 * - Shadows
 * - Border radius
 * - Component overrides
 *
 * Usage:
 * import { createAppTheme } from './theme';
 * const theme = createAppTheme('light' | 'dark');
 */

import { createTheme } from '@mui/material/styles';

/**
 * =============================================================================
 * DESIGN TOKENS
 * =============================================================================
 */

/**
 * Typography Design Tokens
 * Standardized font sizes, weights, and families
 */
export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',

  // Font Weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Font Sizes (in rem)
  sizes: {
    xs: '0.65rem',    // 10.4px - Tiny labels, badges
    sm: '0.75rem',    // 12px - Small text, captions
    base: '0.875rem', // 14px - Base body text
    md: '0.9rem',     // 14.4px - Navigation, buttons
    lg: '1rem',       // 16px - Default body
    xl: '1.125rem',   // 18px - Large text
    '2xl': '1.25rem', // 20px - Section titles
    '3xl': '1.5rem',  // 24px - Page titles
  },

  // Line Heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

/**
 * Color Design Tokens
 * Organized by purpose and mode (light/dark)
 */
export const colors = {
  // Primary brand colors
  primary: {
    dark: {
      main: '#6b7280',
      light: '#9ca3af',
      dark: '#374151',
      contrastText: '#ffffff',
    },
    light: {
      main: '#374151',
      light: '#6b7280',
      dark: '#1f2937',
      contrastText: '#ffffff',
    },
  },

  // Secondary colors
  secondary: {
    dark: {
      main: '#e0e0e0',
      light: '#f5f5f5',
      dark: '#bdbdbd',
      contrastText: '#000000',
    },
    light: {
      main: '#404040',
      light: '#606060',
      dark: '#202020',
      contrastText: '#ffffff',
    },
  },

  // Background colors
  background: {
    dark: {
      default: '#000000',
      paper: '#1a1a1a',
      elevated: '#111111',
      input: '#1f2937',
      menu: '#1f2937',
      dialog: '#1f2937',
      tableHeader: '#111827',
    },
    light: {
      default: '#ffffff',
      paper: '#fafafa',
      elevated: '#ffffff',
      input: '#ffffff',
      menu: '#ffffff',
      dialog: '#ffffff',
      tableHeader: '#f9fafb',
    },
  },

  // Text colors
  text: {
    dark: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
      disabled: '#71717a',
      label: '#d1d5db',
    },
    light: {
      primary: '#000000',
      secondary: '#666666',
      disabled: '#9ca3af',
      label: '#374151',
    },
  },

  // Border colors
  border: {
    dark: {
      default: '#333333',
      light: '#374151',
      medium: '#4b5563',
      input: '#374151',
    },
    light: {
      default: '#e0e0e0',
      light: '#e5e7eb',
      medium: '#d1d5db',
      input: '#d1d5db',
    },
  },

  // Gray scale (mode-adaptive)
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    dark: {
      300: '#333333',
      400: '#555555',
      500: '#777777',
      600: '#999999',
      700: '#bbbbbb',
      800: '#dddddd',
      900: '#ffffff',
    },
    light: {
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },

  // Semantic colors (success, warning, error, info)
  success: {
    dark: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
      contrastText: '#000000',
    },
    light: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
  },

  warning: {
    dark: {
      main: '#fbbf24',
      light: '#fcd34d',
      dark: '#f59e0b',
      contrastText: '#000000',
    },
    light: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
  },

  error: {
    dark: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
      contrastText: '#000000',
    },
    light: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
  },

  info: {
    dark: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#000000',
    },
    light: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
  },

  // Action colors
  action: {
    dark: {
      active: '#6b7280',
      hover: 'rgba(107, 114, 128, 0.08)',
      hoverAlt: 'rgba(255, 255, 255, 0.05)',
      hoverLight: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(107, 114, 128, 0.16)',
      selectedAlt: 'rgba(255, 255, 255, 0.16)',
      selectedHover: 'rgba(255, 255, 255, 0.24)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    light: {
      active: '#374151',
      hover: 'rgba(55, 65, 81, 0.04)',
      hoverAlt: 'rgba(0, 0, 0, 0.04)',
      hoverLight: 'rgba(0, 0, 0, 0.02)',
      selected: 'rgba(55, 65, 81, 0.08)',
      selectedAlt: 'rgba(0, 0, 0, 0.08)',
      selectedHover: 'rgba(0, 0, 0, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
};

/**
 * Spacing Design Tokens
 * Consistent spacing scale (multiplied by 8px base)
 */
export const spacing = {
  unit: 8, // Base unit in pixels
  scale: [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8, 12, 16], // Multipliers
};

/**
 * Border Radius Design Tokens
 * Standardized corner rounding
 */
export const borderRadius = {
  sm: 4,   // Small elements
  md: 8,   // Medium elements (default buttons)
  lg: 12,  // Large elements
  xl: 16,  // Extra large
  full: 9999, // Fully rounded (pills)
};

/**
 * Shadow Design Tokens
 * Elevation system for depth
 */
export const shadows = {
  dark: {
    xs: '0 1px 2px rgba(255, 255, 255, 0.05)',
    sm: '0 1px 3px rgba(255, 255, 255, 0.1)',
    md: '0 4px 6px rgba(255, 255, 255, 0.15)',
    lg: '0 8px 16px rgba(255, 255, 255, 0.2)',
    xl: '0 12px 24px rgba(255, 255, 255, 0.25)',
  },
  light: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.25)',
  },
};

/**
 * Transition Design Tokens
 * Animation timings and easings
 */
export const transitions = {
  duration: {
    fastest: '0.1s',
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  standard: 'all 0.2s ease-in-out',
  color: 'background-color 0.3s ease, color 0.3s ease',
};

/**
 * =============================================================================
 * THEME CREATION FUNCTION
 * =============================================================================
 */

/**
 * Creates a Material-UI theme with all design tokens
 * @param {string} mode - 'light' or 'dark'
 * @returns {Theme} Material-UI theme object
 */
export const createAppTheme = (mode) => {
  const isDark = mode === 'dark';
  const modeKey = isDark ? 'dark' : 'light';

  return createTheme({
    palette: {
      mode,
      primary: colors.primary[modeKey],
      secondary: colors.secondary[modeKey],
      background: {
        default: colors.background[modeKey].default,
        paper: colors.background[modeKey].paper,
      },
      text: {
        primary: colors.text[modeKey].primary,
        secondary: colors.text[modeKey].secondary,
        disabled: colors.text[modeKey].disabled,
      },
      divider: colors.border[modeKey].default,
      action: {
        active: colors.action[modeKey].active,
        hover: colors.action[modeKey].hover,
        selected: colors.action[modeKey].selected,
        disabled: colors.action[modeKey].disabled,
        disabledBackground: colors.action[modeKey].disabledBackground,
      },
      grey: {
        50: colors.grey[50],
        100: colors.grey[100],
        200: colors.grey[200],
        300: colors.grey[modeKey][300],
        400: colors.grey[modeKey][400],
        500: colors.grey[modeKey][500],
        600: colors.grey[modeKey][600],
        700: colors.grey[modeKey][700],
        800: colors.grey[modeKey][800],
        900: colors.grey[modeKey][900],
      },
      success: colors.success[modeKey],
      warning: colors.warning[modeKey],
      error: colors.error[modeKey],
      info: colors.info[modeKey],
    },

    typography: {
      fontFamily: typography.fontFamily,
      h1: {
        fontWeight: typography.weights.bold,
        color: colors.text[modeKey].primary
      },
      h2: {
        fontWeight: typography.weights.semibold,
        color: colors.text[modeKey].primary
      },
      h3: {
        fontWeight: typography.weights.semibold,
        color: colors.text[modeKey].primary
      },
      h4: {
        fontWeight: typography.weights.semibold,
        color: colors.text[modeKey].primary
      },
      h5: {
        fontWeight: typography.weights.semibold,
        color: colors.text[modeKey].primary
      },
      h6: {
        fontWeight: typography.weights.semibold,
        color: colors.text[modeKey].primary
      },
      body1: {
        color: colors.text[modeKey].primary
      },
      body2: {
        color: colors.text[modeKey].secondary
      },
      caption: {
        color: colors.text[modeKey].secondary
      },
      overline: {
        color: colors.text[modeKey].secondary
      },

      // ===== SEMANTIC TYPOGRAPHY VARIANTS =====
      // Use these for consistent visual hierarchy across the app

      // Page-level titles (main heading at top of page)
      pageTitle: {
        fontSize: typography.sizes['3xl'],      // 24px
        fontWeight: typography.weights.bold,    // 700
        lineHeight: typography.lineHeights.tight, // 1.25
        color: colors.text[modeKey].primary,
      },

      // Major section headings (tabs, major groupings)
      sectionTitle: {
        fontSize: typography.sizes['2xl'],      // 20px
        fontWeight: typography.weights.semibold, // 600
        lineHeight: typography.lineHeights.tight, // 1.25
        color: colors.text[modeKey].primary,
      },

      // Card headers, dialog titles
      cardTitle: {
        fontSize: typography.sizes.xl,          // 18px
        fontWeight: typography.weights.semibold, // 600
        lineHeight: typography.lineHeights.normal, // 1.5
        color: colors.text[modeKey].primary,
      },

      // List item titles, form group titles
      listTitle: {
        fontSize: typography.sizes.lg,          // 16px
        fontWeight: typography.weights.semibold, // 600
        lineHeight: typography.lineHeights.normal, // 1.5
        color: colors.text[modeKey].primary,
      },

      // Helper text, timestamps, metadata
      helperText: {
        fontSize: typography.sizes.sm,          // 12px
        fontWeight: typography.weights.regular, // 400
        lineHeight: typography.lineHeights.normal, // 1.5
        color: colors.text[modeKey].secondary,
      },

      // Empty state messages, informational text
      emptyStateText: {
        fontSize: typography.sizes.xl,          // 18px
        fontWeight: typography.weights.medium,  // 500
        lineHeight: typography.lineHeights.normal, // 1.5
        color: colors.text[modeKey].secondary,
      },

      // Large metric/stat values (dashboard cards, analytics)
      metricValue: {
        fontSize: typography.sizes['3xl'],      // 24px
        fontWeight: typography.weights.bold,    // 700
        lineHeight: typography.lineHeights.tight, // 1.25
        // No default color - allows color prop for semantic colors (success, error, primary)
      },
    },

    shape: {
      borderRadius: borderRadius.md,
    },

    components: {
      // Global baseline styles
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.background[modeKey].default,
            color: colors.text[modeKey].primary,
            transition: transitions.color,
          },
        },
      },

      // Card Components
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: colors.background[modeKey].elevated,
            border: `1px solid ${colors.border[modeKey].default}`,
            boxShadow: shadows[modeKey].sm,
            transition: transitions.standard,
            '&:hover': {
              boxShadow: shadows[modeKey].md,
            },
          },
        },
      },

      // Paper Components
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: colors.background[modeKey].elevated,
            color: colors.text[modeKey].primary,
          },
        },
      },

      // AppBar
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.background[modeKey].default,
            color: colors.text[modeKey].primary,
            borderBottom: `1px solid ${colors.border[modeKey].default}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      },

      // IconButton
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: colors.action[modeKey].hoverLight,
            },
          },
        },
      },

      // Button Components
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: typography.weights.semibold,
            borderRadius: borderRadius.md,
          },
          containedPrimary: {
            backgroundColor: colors.primary[modeKey].main,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: colors.primary[modeKey].dark,
            },
            '&:disabled': {
              backgroundColor: isDark ? '#374151' : '#d1d5db',
              color: isDark ? '#6b7280' : '#9ca3af',
            },
          },
          outlined: {
            borderColor: colors.border[modeKey].input,
            color: colors.text[modeKey].primary,
            '&:hover': {
              borderColor: colors.border[modeKey].medium,
              backgroundColor: colors.action[modeKey].hoverAlt,
            },
          },
        },
      },

      // Input Components
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: colors.background[modeKey].input,
              '& fieldset': {
                borderColor: colors.border[modeKey].input,
              },
              '&:hover fieldset': {
                borderColor: colors.border[modeKey].medium,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.text[modeKey].primary,
              },
            },
            '& .MuiInputLabel-root': {
              color: colors.text[modeKey].label,
            },
            '& .MuiOutlinedInput-input': {
              color: colors.text[modeKey].primary,
            },
          },
        },
      },

      // List Components
      MuiListItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: colors.action[modeKey].hoverAlt,
            },
          },
        },
      },

      // Menu Components
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.background[modeKey].menu,
            border: `1px solid ${colors.border[modeKey].light}`,
          },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: colors.text[modeKey].primary,
            '&:hover': {
              backgroundColor: colors.action[modeKey].hover,
            },
            '&.Mui-selected': {
              backgroundColor: colors.action[modeKey].selectedAlt,
              '&:hover': {
                backgroundColor: colors.action[modeKey].selectedHover,
              },
            },
          },
        },
      },

      // Chip Components
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            color: colors.text[modeKey].primary,
          },
          filled: {
            '&.MuiChip-colorPrimary': {
              backgroundColor: colors.text[modeKey].primary,
              color: colors.background[modeKey].default,
            },
            '&.MuiChip-colorSecondary': {
              backgroundColor: colors.secondary[modeKey].main,
              color: colors.secondary[modeKey].contrastText,
            },
            '&.MuiChip-colorSuccess': {
              backgroundColor: colors.success[modeKey].main,
              color: colors.success[modeKey].contrastText,
            },
            '&.MuiChip-colorWarning': {
              backgroundColor: colors.warning[modeKey].main,
              color: colors.warning[modeKey].contrastText,
            },
            '&.MuiChip-colorError': {
              backgroundColor: colors.error[modeKey].main,
              color: colors.error[modeKey].contrastText,
            },
            '&.MuiChip-colorInfo': {
              backgroundColor: colors.info[modeKey].main,
              color: colors.info[modeKey].contrastText,
            },
          },
        },
      },

      // Dialog Components
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.background[modeKey].dialog,
            color: colors.text[modeKey].primary,
          },
        },
      },

      // Divider
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: colors.border[modeKey].light,
          },
        },
      },

      // Tooltip
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#374151' : '#1f2937',
            color: '#ffffff',
          },
        },
      },

      // Tab Components
      MuiTab: {
        styleOverrides: {
          root: {
            color: isDark ? '#9ca3af' : '#6b7280',
            '&.Mui-selected': {
              color: colors.text[modeKey].primary,
            },
          },
        },
      },

      // Table Components
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${colors.border[modeKey].light}`,
            color: colors.text[modeKey].primary,
          },
          head: {
            backgroundColor: colors.background[modeKey].tableHeader,
            color: colors.text[modeKey].primary,
            fontWeight: typography.weights.semibold,
          },
        },
      },

      // Switch Components
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: colors.text[modeKey].primary,
              '& + .MuiSwitch-track': {
                backgroundColor: colors.text[modeKey].primary,
              },
            },
          },
          track: {
            backgroundColor: colors.border[modeKey].input,
          },
        },
      },

      // Checkbox Components
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? '#9ca3af' : '#6b7280',
            '&.Mui-checked': {
              color: colors.text[modeKey].primary,
            },
          },
        },
      },

      // Radio Components
      MuiRadio: {
        styleOverrides: {
          root: {
            color: isDark ? '#9ca3af' : '#6b7280',
            '&.Mui-checked': {
              color: colors.text[modeKey].primary,
            },
          },
        },
      },
    },
  });
};

// Default export
export default createAppTheme;
