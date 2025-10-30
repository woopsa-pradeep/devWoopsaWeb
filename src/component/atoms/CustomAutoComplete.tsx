import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface CustomAutoCompleteProps {
  options: any[];
  value: any;
  onChange: (value: any) => void;
  getOptionLabel: (option: any) => string;
  placeholder?: string;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  error?: boolean;
  helperText?: string;
  required?: boolean;
  clearable?: boolean;
  searchable?: boolean;
}

const CustomAutoComplete: React.FC<CustomAutoCompleteProps> = ({
  options,
  value,
  onChange,
  getOptionLabel,
  placeholder = 'Select option',
  label,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'medium',
  error = false,
  helperText,
  required = false,
  clearable = true,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input value when value prop changes
  useEffect(() => {
    if (value) {
      setInputValue(getOptionLabel(value));
    } else {
      setInputValue('');
    }
  }, [value, getOptionLabel]);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    if (!searchable || !searchTerm) return true;
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle option selection
  const handleOptionSelect = (option: any) => {
    onChange(option);
    setInputValue(getOptionLabel(option));
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle clear
  const handleClear = () => {
    onChange(null);
    setInputValue('');
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === 'ArrowDown') {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle focus
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle input click
  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleInputClick}
        placeholder={placeholder}
        label={label}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        error={error}
        helperText={helperText}
        required={required}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} />}
              {clearable && value && !loading && (
                <ClearIcon
                  onClick={handleClear}
                  sx={{ cursor: 'pointer', color: 'text.secondary' }}
                />
              )}
              <KeyboardArrowDownIcon
                sx={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  color: 'text.secondary',
                }}
              />
            </InputAdornment>
          ),
        }}
      />
      
      {isOpen && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 300,
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mt: 0.5,
          }}
        >
          {filteredOptions.length > 0 ? (
            <List sx={{ p: 0 }}>
              {filteredOptions.map((option, index) => (
                <ListItem
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: highlightedIndex === index ? 'action.hover' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    py: 1,
                    px: 2,
                  }}
                >
                  <ListItemText
                    primary={getOptionLabel(option)}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      color: 'text.primary',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'No options found' : 'No options available'}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default CustomAutoComplete;
