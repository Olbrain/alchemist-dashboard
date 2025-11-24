/**
 * Global Error Boundary with Logging Integration
 * 
 * Catches React errors and logs them to the centralized logging service
 */
import React from 'react';
import { Alert, AlertTitle, Button, Box, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import loggingClient from '../../services/logging/loggingClient';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to centralized logging service
    this.logError(error, errorInfo);
  }

  logError = async (error, errorInfo) => {
    try {
      const organizationId = localStorage.getItem('currentOrganizationId');
      if (!organizationId) {
        console.warn('No organization ID found, skipping error logging');
        return;
      }

      await loggingClient.logErrorOccurred(
        organizationId,
        error,
        'system',
        'error_boundary',
        {
          component_stack: errorInfo?.componentStack,
          error_boundary: this.props.name || 'Unknown',
          url: window.location.href,
          user_agent: navigator.userAgent,
          props: this.props.errorMetadata || {}
        }
      );
    } catch (logError) {
      console.error('Failed to log error to logging service:', logError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We're sorry, but something unexpected happened. The error has been logged and our team will investigate.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Error Details (Development Mode):
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mb: 1 }}>
                  {this.state.error?.toString()}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.8em' }}>
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                size="small"
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReset}
                size="small"
              >
                Try Again
              </Button>
            </Box>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (WrappedComponent, boundaryName) => {
  return function ErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary name={boundaryName} errorMetadata={{ componentName: WrappedComponent.name }}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for programmatic error logging
export const useErrorLogger = () => {
  const logError = async (error, context = {}) => {
    try {
      const organizationId = localStorage.getItem('currentOrganizationId');
      if (!organizationId) {
        console.warn('No organization ID found, skipping error logging');
        return;
      }

      await loggingClient.logErrorOccurred(
        organizationId,
        error,
        'system',
        'manual_error_log',
        {
          context,
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      );
    } catch (logError) {
      console.error('Failed to log error to logging service:', logError);
    }
  };

  return { logError };
};