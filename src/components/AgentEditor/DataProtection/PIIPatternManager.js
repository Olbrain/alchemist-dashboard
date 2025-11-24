/**
 * PII Pattern Manager
 * 
 * Component for managing PII detection patterns including built-in and custom patterns
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Switch,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Paper,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  CreditCard as CreditCardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountBalance as AccountBalanceIcon,
  ContactMail as ContactMailIcon,
  FlightTakeoff as FlightTakeoffIcon,
  PersonPin as PersonPinIcon,
  Code as CodeIcon,
  Science as TestTubeIcon
} from '@mui/icons-material';

// Built-in PII pattern definitions
const BUILTIN_PATTERNS = {
  pan_number: {
    label: 'PAN Number',
    description: 'Indian Permanent Account Number',
    icon: <BadgeIcon />,
    example: 'ABCDE1234F',
    regex: '[A-Z]{5}[0-9]{4}[A-Z]{1}',
    category: 'Government ID'
  },
  aadhaar_number: {
    label: 'Aadhaar Number',
    description: 'Indian Unique Identification Number',
    icon: <PersonPinIcon />,
    example: '1234 5678 9012',
    regex: '\\d{4}\\s?\\d{4}\\s?\\d{4}',
    category: 'Government ID'
  },
  credit_card: {
    label: 'Credit Card',
    description: 'Credit/Debit card numbers',
    icon: <CreditCardIcon />,
    example: '4111-1111-1111-1111',
    regex: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b',
    category: 'Financial'
  },
  ssn: {
    label: 'Social Security Number',
    description: 'US Social Security Number',
    icon: <BadgeIcon />,
    example: '123-45-6789',
    regex: '\\b\\d{3}-?\\d{2}-?\\d{4}\\b',
    category: 'Government ID'
  },
  phone_number: {
    label: 'Phone Number',
    description: 'Phone numbers in various formats',
    icon: <PhoneIcon />,
    example: '+91 98765 43210',
    regex: '(\\+\\d{1,3}[\\s.-]?)?\\(?\\d{3,4}\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}',
    category: 'Contact'
  },
  email: {
    label: 'Email Address',
    description: 'Email addresses',
    icon: <EmailIcon />,
    example: 'user@example.com',
    regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    category: 'Contact'
  },
  bank_account: {
    label: 'Bank Account',
    description: 'Bank account numbers',
    icon: <AccountBalanceIcon />,
    example: '1234567890123456',
    regex: '\\b\\d{8,20}\\b',
    category: 'Financial'
  },
  passport: {
    label: 'Passport Number',
    description: 'Passport identification numbers',
    icon: <FlightTakeoffIcon />,
    example: 'A12345678',
    regex: '[A-Z]\\d{8}',
    category: 'Government ID'
  }
};

const PIIPatternManager = ({ 
  patterns, 
  onPatternsChange, 
  disabled = false 
}) => {
  const [customPatternDialog, setCustomPatternDialog] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);
  const [customPattern, setCustomPattern] = useState({
    name: '',
    pattern: '',
    description: '',
    enabled: true
  });
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState({});

  // Handle built-in pattern toggle
  const handleBuiltinToggle = (patternKey, enabled) => {
    const newPatterns = {
      ...patterns,
      [patternKey]: enabled
    };
    onPatternsChange(newPatterns);
  };

  // Handle custom pattern creation/editing
  const handleCustomPatternSave = () => {
    try {
      // Validate regex pattern
      new RegExp(customPattern.pattern);
      
      const customPatterns = [...(patterns.custom_patterns || [])];
      
      if (editingPattern !== null) {
        // Edit existing pattern
        customPatterns[editingPattern] = customPattern;
      } else {
        // Add new pattern
        customPatterns.push(customPattern);
      }
      
      const newPatterns = {
        ...patterns,
        custom_patterns: customPatterns
      };
      
      onPatternsChange(newPatterns);
      handleCloseDialog();
    } catch (error) {
      // Handle regex validation error
      console.error('Invalid regex pattern:', error);
    }
  };

  // Handle custom pattern deletion
  const handleCustomPatternDelete = (index) => {
    const customPatterns = [...(patterns.custom_patterns || [])];
    customPatterns.splice(index, 1);
    
    const newPatterns = {
      ...patterns,
      custom_patterns: customPatterns
    };
    
    onPatternsChange(newPatterns);
  };

  // Handle custom pattern editing
  const handleCustomPatternEdit = (index) => {
    setEditingPattern(index);
    setCustomPattern(patterns.custom_patterns[index]);
    setCustomPatternDialog(true);
  };

  // Close dialog and reset form
  const handleCloseDialog = () => {
    setCustomPatternDialog(false);
    setEditingPattern(null);
    setCustomPattern({
      name: '',
      pattern: '',
      description: '',
      enabled: true
    });
  };

  // Test patterns against input
  const handleTestPatterns = () => {
    const results = {};
    
    // Test built-in patterns
    Object.entries(BUILTIN_PATTERNS).forEach(([key, config]) => {
      if (patterns[key]) {
        const regex = new RegExp(config.regex, 'gi');
        const matches = testInput.match(regex);
        results[key] = matches ? matches.length : 0;
      }
    });
    
    // Test custom patterns
    patterns.custom_patterns?.forEach((pattern, index) => {
      try {
        const regex = new RegExp(pattern.pattern, 'gi');
        const matches = testInput.match(regex);
        results[`custom_${index}`] = matches ? matches.length : 0;
      } catch (error) {
        results[`custom_${index}`] = 'Invalid regex';
      }
    });
    
    setTestResults(results);
  };

  // Group patterns by category
  const getPatternsByCategory = () => {
    const categories = {};
    
    Object.entries(BUILTIN_PATTERNS).forEach(([key, config]) => {
      if (!categories[config.category]) {
        categories[config.category] = [];
      }
      categories[config.category].push({ key, ...config, enabled: patterns[key] || false });
    });
    
    return categories;
  };

  const patternCategories = getPatternsByCategory();

  return (
    <Card>
      <CardHeader
        title="PII Pattern Configuration"
        subheader="Configure which types of personally identifiable information to detect"
        action={
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => setCustomPatternDialog(true)}
            disabled={disabled}
          >
            Add Custom Pattern
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Built-in Patterns */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Built-in Patterns
            </Typography>
            
            {Object.entries(patternCategories).map(([category, categoryPatterns]) => (
              <Accordion key={category} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {category} ({categoryPatterns.filter(p => p.enabled).length}/{categoryPatterns.length} enabled)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {categoryPatterns.map((pattern) => (
                      <Grid item xs={12} sm={6} key={pattern.key}>
                        <Paper 
                          variant="outlined" 
                          sx={{ p: 2, height: '100%' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            {pattern.icon}
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2">
                                  {pattern.label}
                                </Typography>
                                <Switch
                                  checked={pattern.enabled}
                                  onChange={(e) => handleBuiltinToggle(pattern.key, e.target.checked)}
                                  disabled={disabled}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {pattern.description}
                              </Typography>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 0.5, borderRadius: 0.5 }}>
                                Example: {pattern.example}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>

          {/* Custom Patterns & Testing */}
          <Grid item xs={12} md={4}>
            {/* Custom Patterns */}
            <Typography variant="h6" gutterBottom>
              Custom Patterns
            </Typography>
            
            {patterns.custom_patterns?.length > 0 ? (
              <List>
                {patterns.custom_patterns.map((pattern, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <CodeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={pattern.name}
                      secondary={pattern.description}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit Pattern">
                        <IconButton 
                          size="small" 
                          onClick={() => handleCustomPatternEdit(index)}
                          disabled={disabled}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Pattern">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleCustomPatternDelete(index)}
                          disabled={disabled}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No custom patterns defined. Click "Add Custom Pattern" to create one.
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Pattern Tester */}
            <Typography variant="h6" gutterBottom>
              Test Patterns
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Test Input"
              placeholder="Enter text to test pattern detection..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              disabled={disabled}
              sx={{ mb: 2 }}
            />
            
            <Button
              startIcon={<TestTubeIcon />}
              variant="outlined"
              fullWidth
              onClick={handleTestPatterns}
              disabled={disabled || !testInput.trim()}
              sx={{ mb: 2 }}
            >
              Test Patterns
            </Button>
            
            {Object.keys(testResults).length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detection Results:
                </Typography>
                {Object.entries(testResults).map(([key, count]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      {key.startsWith('custom_') 
                        ? patterns.custom_patterns[parseInt(key.split('_')[1])]?.name 
                        : BUILTIN_PATTERNS[key]?.label
                      }:
                    </Typography>
                    <Chip 
                      label={count} 
                      size="small" 
                      color={count > 0 ? 'success' : 'default'}
                    />
                  </Box>
                ))}
              </Paper>
            )}
          </Grid>
        </Grid>
      </CardContent>

      {/* Custom Pattern Dialog */}
      <Dialog 
        open={customPatternDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPattern !== null ? 'Edit Custom Pattern' : 'Add Custom Pattern'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pattern Name"
                value={customPattern.name}
                onChange={(e) => setCustomPattern(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Employee ID"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={customPattern.description}
                onChange={(e) => setCustomPattern(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this pattern detects"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Regular Expression"
                value={customPattern.pattern}
                onChange={(e) => setCustomPattern(prev => ({ ...prev, pattern: e.target.value }))}
                placeholder="e.g., EMP[0-9]{6}"
                helperText="Enter a valid JavaScript regular expression"
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Tips:</strong>
                  <br />• Use \d for digits, \w for word characters, \s for whitespace
                  <br />• Use {'{n}'} for exact count, {'{n,m}'} for range
                  <br />• Use \b for word boundaries
                  <br />• Test your pattern with the pattern tester
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleCustomPatternSave}
            variant="contained"
            disabled={!customPattern.name || !customPattern.pattern}
          >
            {editingPattern !== null ? 'Update' : 'Add'} Pattern
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PIIPatternManager;