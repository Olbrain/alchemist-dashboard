/**
 * List Item Form - Reusable Component
 *
 * Generic component for managing arrays of text items (objectives, capabilities, etc.)
 * Features two-column layout: selected items on left, available options on right
 * Supports dynamic AI-powered suggestions with loading states
 */
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  Grid,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';

const ListItemForm = ({
  title,
  description,
  items = [],
  onChange,
  disabled = false,
  placeholder = 'Enter item...',
  minItems = 3,
  validation,
  suggestions = [],
  loadingSuggestions = false
}) => {
  const [localItems, setLocalItems] = useState(items.length > 0 ? items : ['']);

  // Handle item change
  const handleItemChange = (index, value) => {
    const updatedItems = [...localItems];
    updatedItems[index] = value;
    setLocalItems(updatedItems);

    // Filter out empty items for validation
    const nonEmptyItems = updatedItems.filter(item => item && item.trim().length > 0);
    if (onChange) {
      onChange(nonEmptyItems);
    }
  };

  // Add new item
  const handleAddItem = () => {
    const updatedItems = [...localItems, ''];
    setLocalItems(updatedItems);
  };

  // Remove item
  const handleRemoveItem = (index) => {
    const updatedItems = localItems.filter((_, i) => i !== index);
    setLocalItems(updatedItems.length > 0 ? updatedItems : ['']);

    const nonEmptyItems = updatedItems.filter(item => item && item.trim().length > 0);
    if (onChange) {
      onChange(nonEmptyItems);
    }
  };

  // Add suggestion
  const handleAddSuggestion = (suggestion) => {
    // Check if suggestion already exists (case-insensitive)
    const isDuplicate = localItems.some(
      item => item && item.trim().toLowerCase() === suggestion.trim().toLowerCase()
    );

    if (isDuplicate) {
      // Skip adding duplicate - suggestion already exists
      return;
    }

    // Find first empty field or add new
    const emptyIndex = localItems.findIndex(item => !item || item.trim().length === 0);
    if (emptyIndex >= 0) {
      handleItemChange(emptyIndex, suggestion);
    } else {
      const updatedItems = [...localItems, suggestion];
      setLocalItems(updatedItems);
      const nonEmptyItems = updatedItems.filter(item => item && item.trim().length > 0);
      if (onChange) {
        onChange(nonEmptyItems);
      }
    }
  };

  const validItemsCount = localItems.filter(item => item && item.trim().length >= 10).length;
  const isValid = validation ? validation.isValid : validItemsCount >= minItems;

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Section Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Chip
          icon={isValid ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          label={isValid ? 'Complete' : 'Incomplete'}
          color={isValid ? 'success' : 'default'}
          size="small"
          sx={{ height: 22 }}
        />
        <Chip
          label={`${validItemsCount}/${minItems}+ items`}
          size="small"
          color={validItemsCount >= minItems ? 'success' : 'default'}
          variant="outlined"
          sx={{ height: 22 }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Selected Items */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Your Items
            </Typography>

            {/* Item List */}
            <Box sx={{ mb: 2 }}>
              {localItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'flex-start' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 24,
                      mt: 1.5,
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveItem(index)}
                    disabled={disabled || localItems.length === 1}
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* Add Item Button */}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              disabled={disabled}
              size="small"
            >
              Add Custom Item
            </Button>

            {/* Validation Error */}
            {validation && !validation.isValid && validation.errors.items && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, borderLeft: 3, borderColor: 'warning.main' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  {validation.errors.items}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Quick Add Options */}
        {(suggestions.length > 0 || loadingSuggestions) && (
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 16 }
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Quick Add Options
                  </Typography>
                  {loadingSuggestions && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircularProgress size={14} />
                      <AIIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  {loadingSuggestions
                    ? 'Loading personalized suggestions...'
                    : 'Click any option below to add it to your list'}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {loadingSuggestions ? (
                    // Show skeletons while loading
                    Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        variant="rectangular"
                        height={48}
                        sx={{ borderRadius: 1 }}
                      />
                    ))
                  ) : (
                    // Show actual suggestions
                    suggestions.map((suggestion, index) => {
                      const isAlreadyAdded = localItems.some(
                        item => item && item.trim().toLowerCase() === suggestion.trim().toLowerCase()
                      );

                      return (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          onClick={() => handleAddSuggestion(suggestion)}
                          disabled={disabled || isAlreadyAdded}
                          sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            py: 1,
                            px: 1.5,
                            opacity: isAlreadyAdded ? 0.5 : 1,
                            '&:hover': {
                              bgcolor: 'primary.lighter'
                            }
                          }}
                        >
                          {suggestion}
                        </Button>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default React.memo(ListItemForm);
