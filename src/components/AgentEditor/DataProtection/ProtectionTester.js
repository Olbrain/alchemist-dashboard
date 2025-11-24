/**
 * Protection Tester
 * 
 * Component for testing data protection rules with real-time preview
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

// Comprehensive test cases for different scenarios
const TEST_CASES = [
  {
    name: 'Account Opening',
    input: 'I want to open a new account. My PAN is ABCDE1234F, Aadhaar is 1234 5678 9012, phone +91 98765 43210, and email customer@bank.com.',
    category: 'account_opening'
  },
  {
    name: 'Transaction Inquiry',
    input: 'I need to check a transaction. My account number is 123456789012, card number 4111-1111-1111-1234, and the transaction ID was TXN202409031234.',
    category: 'transaction'
  },
  {
    name: 'Customer Support',
    input: 'Hi, I am calling about my credit card 5555-4444-3333-2222. My registered phone is +91 98765 43210 and my customer ID is CUST987654321.',
    category: 'support'
  },
  {
    name: 'Loan Application',
    input: 'I want to apply for a loan. My details: PAN FGHIJ5678K, Aadhaar 9876 5432 1098, salary account 987654321098, phone +91 87654 32109.',
    category: 'loan'
  },
  {
    name: 'Fund Transfer',
    input: 'I want to transfer money from my account 111222333444 to beneficiary account 555666777888 using IFSC SBIN0001234.',
    category: 'transfer'
  },
  {
    name: 'Card Services',
    input: 'My card 6011-1111-1111-1117 is blocked. My phone number is +91 99887 76655 and email is user@gmail.com. Please help.',
    category: 'card_services'
  },
  {
    name: 'Complex Banking Scenario',
    input: 'Customer ID CUST123456, account 789012345678, card 4000-0000-0000-0002, PAN KLMNO9012P, phone +91 94567 89012, wants to know about transaction REF789456123 from 15/08/2024.',
    category: 'complex'
  }
];

// Enhanced comprehensive patterns for testing
const TEST_PATTERNS = {
  pan_number: { regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g, label: 'PAN Number' },
  aadhaar_number: { regex: /\d{4}\s?\d{4}\s?\d{4}/g, label: 'Aadhaar Number' },
  credit_card: { regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, label: 'Credit Card' },
  phone_number: { regex: /(\+\d{1,3}[\s.-]?)?\(?(\d{3,4})\)?[\s.-]?(\d{3,4})[\s.-]?(\d{3,4})/g, label: 'Phone Number' },
  email: { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: 'Email' },
  bank_account: { regex: /\b\d{8,20}\b/g, label: 'Bank Account' },
  customer_id: { regex: /CUST\d{6,10}/g, label: 'Customer ID' },
  transaction_id: { regex: /(TXN|REF)\d{8,15}/g, label: 'Transaction ID' },
  ifsc_code: { regex: /[A-Z]{4}0[A-Z0-9]{6}/g, label: 'IFSC Code' },
  upi_id: { regex: /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/g, label: 'UPI ID' },
  passport: { regex: /[A-Z]\d{8}/g, label: 'Passport' }
};

const ProtectionTester = ({ 
  config, 
  disabled = false,
  comprehensiveMode = false
}) => {
  const theme = useTheme();
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [detectionStats, setDetectionStats] = useState({});

  // Auto-test when config changes
  useEffect(() => {
    if (testInput.trim()) {
      runProtectionTest();
    }
  }, [config]);

  // Run protection test
  const runProtectionTest = async () => {
    if (!testInput.trim() || disabled) return;

    setIsProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const results = [];
      const stats = { total_patterns: 0, active_patterns: 0, matches_found: 0 };
      
      // Test each enabled pattern
      Object.entries(TEST_PATTERNS).forEach(([key, pattern]) => {
        stats.total_patterns++;
        
        // In comprehensive mode, all patterns are considered enabled
        if (comprehensiveMode || config.pii_patterns[key]) {
          stats.active_patterns++;
          const matches = [...testInput.matchAll(pattern.regex)];
          
          matches.forEach((match, index) => {
            stats.matches_found++;
            const originalText = match[0];
            const maskedText = applyMasking(originalText, config.masking_strategy);
            
            results.push({
              id: `${key}_${index}`,
              pattern: key,
              label: pattern.label,
              original: originalText,
              masked: maskedText,
              position: match.index,
              confidence: 0.95, // Simulated confidence
              context: 'user_response' // Default context
            });
          });
        }
      });

      // Test custom patterns
      config.pii_patterns.custom_patterns?.forEach((customPattern, patternIndex) => {
        stats.total_patterns++;
        stats.active_patterns++;
        
        try {
          const regex = new RegExp(customPattern.pattern, 'g');
          const matches = [...testInput.matchAll(regex)];
          
          matches.forEach((match, index) => {
            stats.matches_found++;
            const originalText = match[0];
            const maskedText = applyMasking(originalText, config.masking_strategy);
            
            results.push({
              id: `custom_${patternIndex}_${index}`,
              pattern: `custom_${patternIndex}`,
              label: customPattern.name,
              original: originalText,
              masked: maskedText,
              position: match.index,
              confidence: 0.90, // Slightly lower for custom patterns
              context: 'user_response'
            });
          });
        } catch (error) {
          console.error('Invalid custom pattern:', customPattern.pattern);
        }
      });

      setTestResults(results);
      setDetectionStats(stats);
    } catch (error) {
      console.error('Protection test error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply masking based on strategy
  const applyMasking = (text, strategy) => {
    const method = strategy.default_method;
    
    switch (method) {
      case 'redact':
        return '[REDACTED]';
      case 'mask':
        const showLast = strategy.show_last_digits || 0;
        const char = strategy.replacement_char || '*';
        if (text.length <= showLast) return text;
        return char.repeat(Math.max(4, text.length - showLast)) + text.slice(-showLast);
      case 'tokenize':
        return `[TOKEN_${Math.random().toString(36).substr(2, 8).toUpperCase()}]`;
      case 'encrypt':
        return `[ENC_${btoa(text).slice(0, 12)}]`;
      default:
        return text;
    }
  };

  // Generate protected text
  const generateProtectedText = () => {
    let protectedText = testInput;
    
    // Sort results by position (descending) to avoid position shifts
    const sortedResults = [...testResults].sort((a, b) => b.position - a.position);
    
    sortedResults.forEach(result => {
      const contextMethod = config.masking_strategy.context_rules?.[result.context] || config.masking_strategy.default_method;
      const maskedText = applyMasking(result.original, { ...config.masking_strategy, default_method: contextMethod });
      protectedText = protectedText.slice(0, result.position) + maskedText + protectedText.slice(result.position + result.original.length);
    });
    
    return protectedText;
  };

  // Load sample test case
  const loadSample = (sample) => {
    setTestInput(sample.input);
    setSelectedSample(sample.name);
    runProtectionTest();
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  // Get severity color based on matches found
  const getSeverityInfo = () => {
    const count = testResults.length;
    if (count === 0) return { color: 'success', label: 'No Issues', icon: <CheckCircleIcon /> };
    if (count <= 2) return { color: 'warning', label: 'Low Risk', icon: <WarningIcon /> };
    return { color: 'error', label: 'High Risk', icon: <ErrorIcon /> };
  };

  const severityInfo = getSeverityInfo();

  return (
    <Box>
      {/* Test Input Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Test Input"
            placeholder="Enter text containing potential PII to test protection rules..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            disabled={disabled || isProcessing}
            variant="outlined"
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              startIcon={<PlayArrowIcon />}
              variant="contained"
              onClick={runProtectionTest}
              disabled={disabled || isProcessing || !testInput.trim()}
            >
              {isProcessing ? 'Testing...' : 'Run Test'}
            </Button>
            
            <Button
              startIcon={<ClearIcon />}
              variant="outlined"
              onClick={() => {
                setTestInput('');
                setTestResults([]);
                setSelectedSample('');
              }}
              disabled={disabled || isProcessing}
            >
              Clear
            </Button>

            <Tooltip title="Copy protected text to clipboard">
              <IconButton
                onClick={() => copyToClipboard(generateProtectedText())}
                disabled={disabled || testResults.length === 0}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Sample Test Cases */}
          <Typography variant="subtitle1" gutterBottom>
            Sample Test Cases
          </Typography>
          <List dense>
            {TEST_CASES.map((sample, index) => (
              <ListItem
                key={index}
                button
                selected={selectedSample === sample.name}
                onClick={() => loadSample(sample)}
                disabled={disabled || isProcessing}
                sx={{ 
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <ListItemText
                  primary={sample.name}
                  secondary={`${sample.category} • ${sample.input.length} chars`}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>

      {/* Processing Indicator */}
      {isProcessing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyzing text for sensitive data patterns...
          </Typography>
        </Box>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {/* Results Summary */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Chip
                  icon={severityInfo.icon}
                  label={severityInfo.label}
                  color={severityInfo.color}
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Typography variant="body2">
                  <strong>{testResults.length}</strong> sensitive data instances detected
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  {detectionStats.active_patterns}/{detectionStats.total_patterns} patterns active
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Detection Results Table */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Detection Results ({testResults.length} matches)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Pattern</TableCell>
                      <TableCell>Original Text</TableCell>
                      <TableCell>Protected Text</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <Chip label={result.label} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              p: 0.5,
                              borderRadius: 0.5,
                              color: 'error.main'
                            }}
                          >
                            {result.original}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              p: 0.5,
                              borderRadius: 0.5,
                              color: 'success.main'
                            }}
                          >
                            {result.masked}
                          </Typography>
                        </TableCell>
                        <TableCell>{result.position}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${(result.confidence * 100).toFixed(0)}%`}
                            size="small"
                            color={result.confidence > 0.9 ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          {/* Protected Output */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Protected Output Preview
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                  position: 'relative'
                }}
              >
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => copyToClipboard(generateProtectedText())}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                {generateProtectedText()}
              </Paper>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* No Results State */}
      {!isProcessing && testInput && testResults.length === 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            No Sensitive Data Detected
          </Typography>
          <Typography variant="body2">
            The input text does not contain any patterns that match your current protection rules.
          </Typography>
        </Alert>
      )}

      {/* Configuration Status */}
      {!config.enabled && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Data Protection Disabled
          </Typography>
          <Typography variant="body2">
            Enable data protection in the main settings to test protection rules.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ProtectionTester;