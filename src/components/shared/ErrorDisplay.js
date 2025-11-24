/**
 * ErrorDisplay Component
 *
 * Specialized component for displaying errors with smart error message extraction
 * and common error handling patterns.
 *
 * Usage:
 *   <ErrorDisplay
 *     error={axiosError}
 *     variant="fullPage"
 *     onRetry={() => retryFunction()}
 *   />
 */

import React from 'react';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import StatusMessage from './StatusMessage';

/**
 * Extract user-friendly error message from various error formats
 */
const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  // Axios error with response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Handle common HTTP status codes
    switch (status) {
      case 401:
        return data?.message || data?.detail || 'Authentication failed. Your API key may be invalid or expired.';
      case 403:
        return data?.message || data?.detail || 'You don\'t have permission to access this resource.';
      case 404:
        return data?.message || data?.detail || 'The requested resource was not found.';
      case 500:
        return data?.message || data?.detail || 'A server error occurred. Please try again later.';
      case 503:
        return data?.message || data?.detail || 'Service temporarily unavailable. Please try again later.';
      default:
        return data?.message || data?.detail || data?.error || `Request failed with status ${status}`;
    }
  }

  // Axios error without response (network error)
  if (error.request) {
    return 'Network error. Please check your connection and try again.';
  }

  // Error object with message
  if (error.message) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

/**
 * Get error title based on error type
 */
const getErrorTitle = (error) => {
  if (!error) return 'Error';

  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 401:
        return 'Authentication Failed';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 500:
        return 'Server Error';
      case 503:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }

  if (error.request) {
    return 'Connection Error';
  }

  return 'Error';
};

/**
 * Get error code string
 */
const getErrorCode = (error) => {
  if (error?.response?.status) {
    return `Error code: ${error.response.status}`;
  }
  if (error?.code) {
    return `Error code: ${error.code}`;
  }
  return null;
};

/**
 * ErrorDisplay Component
 *
 * @param {object} error - Error object (Axios error, Error, or string)
 * @param {string} variant - Layout variant: 'fullPage', 'content', 'inline'
 * @param {string} title - Custom title (optional, auto-generated from error)
 * @param {string} message - Custom message (optional, auto-generated from error)
 * @param {function} onRetry - Retry function (adds retry button)
 * @param {function} onReload - Reload function (adds reload button)
 * @param {Array} actions - Additional action buttons
 * @param {object} sx - Additional sx styling
 */
const ErrorDisplay = ({
  error,
  variant = 'content',
  title,
  message,
  onRetry,
  onReload,
  actions = [],
  sx = {}
}) => {
  const errorTitle = title || getErrorTitle(error);
  const errorMessage = message || getErrorMessage(error);
  const errorCode = getErrorCode(error);

  // Determine error type for styling
  const errorType = error?.response?.status === 401 ? 'auth' : 'error';

  // Build action buttons
  const errorActions = [...actions];

  if (onRetry) {
    errorActions.push({
      label: 'Try Again',
      onClick: onRetry,
      variant: 'contained',
      icon: <RefreshIcon />
    });
  }

  if (onReload) {
    errorActions.push({
      label: 'Reload Page',
      onClick: onReload,
      variant: 'outlined',
      icon: <RefreshIcon />
    });
  }

  return (
    <StatusMessage
      type={errorType}
      title={errorTitle}
      message={errorMessage}
      code={errorCode}
      variant={variant}
      actions={errorActions}
      sx={sx}
    />
  );
};

export default ErrorDisplay;
