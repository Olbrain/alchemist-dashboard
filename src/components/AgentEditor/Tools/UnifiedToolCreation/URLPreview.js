/**
 * URL Preview Component
 * 
 * Shows real-time preview of the constructed URL from components and parameters.
 */
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Link as LinkIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const URLPreview = ({ 
  urlComponents, 
  parameters = [], 
  showDetails = false 
}) => {
  const buildPreviewURL = () => {
    if (!urlComponents.host) {
      return 'https://HOST/ENDPOINT';
    }

    let url = urlComponents.protocol + '://' + urlComponents.host;
    
    // Add port if specified and not default
    if (urlComponents.port) {
      const defaultPorts = { 'https': 443, 'http': 80 };
      if (urlComponents.port !== defaultPorts[urlComponents.protocol]) {
        url += ':' + urlComponents.port;
      }
    }
    
    // Add base path
    if (urlComponents.base_path) {
      url += urlComponents.base_path;
    }
    
    // Add endpoint
    url += urlComponents.endpoint || '/';
    
    return url;
  };

  const buildPreviewWithParams = () => {
    let url = buildPreviewURL();
    
    // Show path parameters as placeholders
    const pathParams = parameters.filter(p => p.location === 'path');
    pathParams.forEach(param => {
      url = url.replace(`{${param.name}}`, `<span style="background: #1976d2; color: white; padding: 2px 4px; border-radius: 4px;">{${param.name}}</span>`);
    });
    
    // Add query parameters
    const queryParams = parameters.filter(p => p.location === 'query');
    if (queryParams.length > 0) {
      const queryString = queryParams.map(param => 
        `${param.name}=<span style="background: #1976d2; color: white; padding: 2px 4px; border-radius: 4px;">{${param.name}}</span>`
      ).join('&');
      url += '?' + queryString;
    }
    
    return url;
  };

  const getParametersByLocation = (location) => {
    return parameters.filter(p => p.location === location);
  };

  const previewURL = buildPreviewURL();
  const hasParameters = parameters.length > 0;

  return (
    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LinkIcon />
        <Typography variant="h6">URL Preview</Typography>
      </Box>

      {/* Basic URL Preview */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Base URL:
        </Typography>
        <Paper 
          sx={{ 
            p: 1, 
            fontFamily: 'monospace', 
            bgcolor: 'background.default',
            wordBreak: 'break-all',
            fontSize: '0.9rem'
          }}
        >
          {previewURL}
        </Paper>
      </Box>

      {/* URL with Parameters */}
      {hasParameters && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            With Parameters:
          </Typography>
          <Paper 
            sx={{ 
              p: 1, 
              fontFamily: 'monospace', 
              bgcolor: 'background.default',
              wordBreak: 'break-all',
              fontSize: '0.9rem'
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: buildPreviewWithParams() }} />
          </Paper>
        </Box>
      )}

      {/* Detailed Breakdown */}
      {showDetails && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            URL Components:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 80 }}>Protocol:</Typography>
              <Chip label={urlComponents.protocol} size="small" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 80 }}>Host:</Typography>
              <Chip label={urlComponents.host || 'Not set'} size="small" />
            </Box>
            {urlComponents.port && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 80 }}>Port:</Typography>
                <Chip label={urlComponents.port} size="small" />
              </Box>
            )}
            {urlComponents.base_path && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 80 }}>Base Path:</Typography>
                <Chip label={urlComponents.base_path} size="small" />
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 80 }}>Endpoint:</Typography>
              <Chip label={urlComponents.endpoint || '/'} size="small" />
            </Box>
          </Box>

          {hasParameters && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Parameters by Location:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {['path', 'query', 'header', 'body'].map(location => {
                  const locationParams = getParametersByLocation(location);
                  if (locationParams.length === 0) return null;

                  return (
                    <Box key={location} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80, textTransform: 'capitalize' }}>
                        {location}:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {locationParams.map((param, index) => (
                          <Chip 
                            key={index}
                            label={param.name}
                            size="small"
                            color={param.required ? 'primary' : 'default'}
                          />
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </>
      )}

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon fontSize="small" />
          <Typography variant="body2">
            This URL will be constructed dynamically when the tool is executed. 
            No parameter replacement needed!
          </Typography>
        </Box>
      </Alert>
    </Paper>
  );
};

export default URLPreview;