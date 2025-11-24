/**
 * OpenAPI Tool Extractor
 * 
 * Component for extracting individual tools from OpenAPI specifications
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Api as ApiIcon,
  Functions as FunctionsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const OpenApiToolExtractor = ({ 
  onToolsExtracted,
  apiSpecContent = null 
}) => {
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  // Extract tools from OpenAPI specification
  const extractToolsFromSpec = useCallback(async (specContent) => {
    if (!specContent) return [];

    setExtracting(true);
    setExtractionError('');

    try {
      let parsedSpec;
      
      // Parse the specification (JSON or YAML)
      if (typeof specContent === 'string') {
        try {
          parsedSpec = JSON.parse(specContent);
        } catch (jsonError) {
          // If it's not JSON, it might be YAML - for now we'll handle JSON only
          throw new Error('Currently only JSON OpenAPI specifications are supported. Please convert your YAML to JSON.');
        }
      } else {
        parsedSpec = specContent;
      }

      // Validate OpenAPI spec structure
      if (!parsedSpec.paths) {
        throw new Error('Invalid OpenAPI specification: missing paths object');
      }

      const extractedTools = [];
      let toolIdCounter = 0;

      // Extract tools from each path and method
      for (const [path, pathItem] of Object.entries(parsedSpec.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
          // Skip non-HTTP methods
          if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method.toLowerCase())) {
            continue;
          }

          const toolId = `tool_${++toolIdCounter}`;
          
          // Extract tool information
          const tool = {
            id: toolId,
            name: operation.operationId || `${method.toUpperCase()} ${path}`,
            description: operation.summary || operation.description || `${method.toUpperCase()} request to ${path}`,
            method: method.toUpperCase(),
            path: path,
            parameters: extractParameters(operation.parameters || [], pathItem.parameters || []),
            requestBody: extractRequestBody(operation.requestBody),
            responses: extractResponses(operation.responses || {}),
            tags: operation.tags || [],
            deprecated: operation.deprecated || false,
            security: operation.security || parsedSpec.security || [],
            servers: operation.servers || parsedSpec.servers || []
          };

          // Add authentication info if available
          if (parsedSpec.components?.securitySchemes) {
            tool.securitySchemes = parsedSpec.components.securitySchemes;
          }

          extractedTools.push(tool);
        }
      }

      console.log('Extracted tools from OpenAPI spec:', extractedTools);
      
      if (onToolsExtracted) {
        onToolsExtracted(extractedTools);
      }

      return extractedTools;

    } catch (error) {
      console.error('Error extracting tools from OpenAPI spec:', error);
      setExtractionError(error.message);
      return [];
    } finally {
      setExtracting(false);
    }
  }, [onToolsExtracted]);

  // Extract parameters from OpenAPI parameter objects
  const extractParameters = (operationParams = [], pathParams = []) => {
    const allParams = [...pathParams, ...operationParams];
    
    return allParams.map(param => ({
      name: param.name,
      in: param.in, // query, header, path, cookie
      description: param.description || '',
      required: param.required || param.in === 'path', // Path params are always required
      schema: param.schema || {},
      example: param.example || param.schema?.example,
      type: param.schema?.type || 'string',
      format: param.schema?.format,
      enum: param.schema?.enum,
      deprecated: param.deprecated || false
    }));
  };

  // Extract request body information
  const extractRequestBody = (requestBody) => {
    if (!requestBody) return null;

    const content = requestBody.content || {};
    const mediaTypes = Object.keys(content);
    
    if (mediaTypes.length === 0) return null;

    // Prioritize JSON content types
    const preferredMediaType = mediaTypes.find(type => type.includes('json')) || mediaTypes[0];
    const mediaTypeObj = content[preferredMediaType];

    return {
      description: requestBody.description || '',
      required: requestBody.required || false,
      mediaType: preferredMediaType,
      schema: mediaTypeObj.schema || {},
      example: mediaTypeObj.example || mediaTypeObj.schema?.example,
      examples: mediaTypeObj.examples || {}
    };
  };

  // Extract response information
  const extractResponses = (responses) => {
    const extractedResponses = [];

    for (const [statusCode, response] of Object.entries(responses)) {
      extractedResponses.push({
        statusCode: statusCode,
        description: response.description || '',
        headers: response.headers || {},
        content: response.content || {},
        links: response.links || {}
      });
    }

    return extractedResponses;
  };

  // Effect to extract tools when API spec content is provided
  React.useEffect(() => {
    if (apiSpecContent) {
      extractToolsFromSpec(apiSpecContent);
    }
  }, [apiSpecContent, extractToolsFromSpec]);

  // Render extraction status
  if (extracting) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={24} sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Extracting tools from OpenAPI specification...
        </Typography>
      </Box>
    );
  }

  if (extractionError) {
    return (
      <Alert severity="error" icon={<WarningIcon />} sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
          Failed to extract tools from specification:
        </Typography>
        <Typography variant="body2">
          {extractionError}
        </Typography>
      </Alert>
    );
  }

  return null; // Component is primarily for processing, UI is handled by parent
};

// Utility function to get method color
export const getMethodColor = (method) => {
  switch (method?.toUpperCase()) {
    case 'GET': return 'success';
    case 'POST': return 'primary';
    case 'PUT': return 'warning';
    case 'PATCH': return 'info';
    case 'DELETE': return 'error';
    default: return 'default';
  }
};

// Utility function to get parameter type color
export const getParameterTypeColor = (paramType) => {
  switch (paramType) {
    case 'path': return 'error';
    case 'query': return 'primary';
    case 'header': return 'info';
    case 'cookie': return 'warning';
    default: return 'default';
  }
};

// Utility function to format tool summary
export const formatToolSummary = (tool) => {
  const paramCount = tool.parameters?.length || 0;
  const responseCount = tool.responses?.length || 0;
  const hasRequestBody = !!tool.requestBody;
  
  return {
    paramCount,
    responseCount,
    hasRequestBody,
    complexity: paramCount > 3 ? 'high' : paramCount > 1 ? 'medium' : 'low',
    tags: tool.tags || [],
    deprecated: tool.deprecated || false
  };
};

export default OpenApiToolExtractor;