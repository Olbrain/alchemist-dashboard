/**
 * Request Body Builder
 * 
 * Component for configuring request bodies for POST/PUT/PATCH operations.
 * Supports JSON schema definition and example payloads.
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button,
  Tooltip,
  FormHelperText
} from '@mui/material';
import {
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const CONTENT_TYPES = [
  { value: 'application/json', label: 'JSON', description: 'JSON data (most common)' },
  { value: 'application/xml', label: 'XML', description: 'XML data' },
  { value: 'application/x-www-form-urlencoded', label: 'Form Data', description: 'Form-encoded data' },
  { value: 'multipart/form-data', label: 'Multipart', description: 'File uploads and form data' },
  { value: 'text/plain', label: 'Plain Text', description: 'Raw text data' },
  { value: 'text/xml', label: 'Text XML', description: 'XML as plain text' }
];

const JSON_SCHEMA_TEMPLATES = {
  object: {
    type: 'object',
    properties: {
      example_field: {
        type: 'string',
        description: 'Example field'
      }
    },
    required: ['example_field']
  },
  array: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    }
  },
  simple: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      value: { type: 'number' },
      active: { type: 'boolean' }
    }
  }
};

const EXAMPLE_PAYLOADS = {
  'application/json': {
    simple: JSON.stringify({ message: "Hello", value: 123, active: true }, null, 2),
    object: JSON.stringify({ 
      user: { name: "John Doe", email: "john@example.com" },
      preferences: { theme: "dark", notifications: true }
    }, null, 2),
    array: JSON.stringify([
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" }
    ], null, 2)
  },
  'application/xml': `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <message>Hello</message>
  <value>123</value>
  <active>true</active>
</request>`,
  'application/x-www-form-urlencoded': 'name=John+Doe&email=john%40example.com&active=true',
  'text/plain': 'This is plain text data for the request body'
};

const RequestBodyBuilder = ({ 
  requestBody, 
  method = 'POST', 
  onChange, 
  errors = {} 
}) => {
  const [schemaExpanded, setSchemaExpanded] = useState(false);
  const [exampleExpanded, setExampleExpanded] = useState(false);

  const handleToggleEnabled = (enabled) => {
    onChange({
      ...requestBody,
      enabled,
      // Reset content if disabling
      schema: enabled ? requestBody.schema : {},
      example: enabled ? requestBody.example : null
    });
  };

  const handleContentTypeChange = (contentType) => {
    onChange({
      ...requestBody,
      content_type: contentType,
      // Update example based on content type
      example: contentType in EXAMPLE_PAYLOADS ? 
        JSON.parse(EXAMPLE_PAYLOADS[contentType].simple || '{}') : 
        requestBody.example
    });
  };

  const handleSchemaChange = (schemaText) => {
    try {
      const schema = JSON.parse(schemaText);
      onChange({
        ...requestBody,
        schema
      });
    } catch (error) {
      // Invalid JSON, keep as string for user to fix
      console.warn('Invalid JSON schema:', error);
    }
  };

  const handleExampleChange = (exampleText) => {
    try {
      let example;
      if (requestBody.content_type === 'application/json') {
        example = JSON.parse(exampleText);
      } else {
        example = exampleText;
      }
      onChange({
        ...requestBody,
        example
      });
    } catch (error) {
      // Invalid JSON, keep as string for user to fix
      console.warn('Invalid JSON example:', error);
    }
  };

  const loadSchemaTemplate = (templateName) => {
    const template = JSON_SCHEMA_TEMPLATES[templateName];
    onChange({
      ...requestBody,
      schema: template
    });
  };

  const loadExampleTemplate = (templateName) => {
    const example = EXAMPLE_PAYLOADS[requestBody.content_type]?.[templateName];
    if (example) {
      onChange({
        ...requestBody,
        example: requestBody.content_type === 'application/json' ? JSON.parse(example) : example
      });
    }
  };

  const formatJsonString = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return typeof obj === 'string' ? obj : String(obj);
    }
  };

  const isJsonContentType = requestBody.content_type === 'application/json';
  const methodSupportsBody = ['POST', 'PUT', 'PATCH'].includes(method);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CodeIcon />
        Request Body Configuration
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Configure the request body for {method} operations. Define the structure and provide examples.
      </Typography>

      {/* Method Warning */}
      {!methodSupportsBody && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <WarningIcon sx={{ mr: 1 }} />
          <strong>{method} requests typically don't have request bodies.</strong> 
          Consider using query parameters or switching to POST/PUT/PATCH.
        </Alert>
      )}

      {/* Enable Request Body */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={requestBody.enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              disabled={!methodSupportsBody}
            />
          }
          label={
            <Box>
              <Typography variant="subtitle1">Enable Request Body</Typography>
              <Typography variant="body2" color="textSecondary">
                Include a request body with this API call
              </Typography>
            </Box>
          }
        />

        {requestBody.enabled && (
          <Box sx={{ mt: 3 }}>
            {/* Content Type Selection */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Content Type</InputLabel>
                  <Select
                    value={requestBody.content_type}
                    onChange={(e) => handleContentTypeChange(e.target.value)}
                    label="Content Type"
                  >
                    {CONTENT_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="body2">{type.label}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {CONTENT_TYPES.find(t => t.value === requestBody.content_type)?.description}
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={requestBody.required}
                      onChange={(e) => onChange({ ...requestBody, required: e.target.checked })}
                    />
                  }
                  label="Required Request Body"
                />
                <FormHelperText>
                  Whether the request body is mandatory for this API call
                </FormHelperText>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Schema Definition */}
      {requestBody.enabled && isJsonContentType && (
        <Accordion 
          expanded={schemaExpanded} 
          onChange={() => setSchemaExpanded(!schemaExpanded)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon />
              <Typography variant="subtitle1">JSON Schema Definition</Typography>
              <Tooltip title="Define the structure and validation rules for the request body">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Define the JSON schema for request body validation:
              </Typography>
              
              {/* Template Buttons */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.keys(JSON_SCHEMA_TEMPLATES).map(template => (
                  <Button
                    key={template}
                    size="small"
                    variant="outlined"
                    onClick={() => loadSchemaTemplate(template)}
                    startIcon={<AddIcon />}
                  >
                    {template} template
                  </Button>
                ))}
              </Box>

              <TextField
                fullWidth
                multiline
                rows={12}
                label="JSON Schema"
                value={formatJsonString(requestBody.schema)}
                onChange={(e) => handleSchemaChange(e.target.value)}
                sx={{ fontFamily: 'monospace' }}
                helperText="JSON Schema v4 specification for request body validation"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Example Payload */}
      {requestBody.enabled && (
        <Accordion 
          expanded={exampleExpanded} 
          onChange={() => setExampleExpanded(!exampleExpanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PreviewIcon />
              <Typography variant="subtitle1">Example Payload</Typography>
              <Tooltip title="Provide an example request body for documentation and testing">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Provide an example {requestBody.content_type} payload:
              </Typography>

              {/* Example Template Buttons */}
              {isJsonContentType && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.keys(EXAMPLE_PAYLOADS[requestBody.content_type]).map(template => (
                    <Button
                      key={template}
                      size="small"
                      variant="outlined"
                      onClick={() => loadExampleTemplate(template)}
                      startIcon={<AddIcon />}
                    >
                      {template} example
                    </Button>
                  ))}
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={8}
                label="Example Payload"
                value={
                  isJsonContentType 
                    ? formatJsonString(requestBody.example) 
                    : (requestBody.example || '')
                }
                onChange={(e) => handleExampleChange(e.target.value)}
                sx={{ fontFamily: 'monospace' }}
                helperText={`Example ${requestBody.content_type} data for documentation and testing`}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Validation Errors */}
      {errors.request_body && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.request_body}
        </Alert>
      )}

      {/* Info Box */}
      {requestBody.enabled && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon fontSize="small" />
            <Typography variant="subtitle2">Request Body Summary</Typography>
          </Box>
          <Typography variant="body2">
            <strong>Content-Type:</strong> {requestBody.content_type}<br/>
            <strong>Required:</strong> {requestBody.required ? 'Yes' : 'No'}<br/>
            <strong>Schema Defined:</strong> {Object.keys(requestBody.schema).length > 0 ? 'Yes' : 'No'}<br/>
            <strong>Example Provided:</strong> {requestBody.example ? 'Yes' : 'No'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default RequestBodyBuilder;