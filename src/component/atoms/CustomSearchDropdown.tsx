import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  InputAdornment,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ClearIcon from '@mui/icons-material/Clear';

interface Option {
  label: string;
  value: string;
}

interface CustomSearchDropdownProps {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  sx?: any;
  // When true, clicking/focusing the field clears the current label
  // and opens the dropdown with an empty search so user can type immediately.
  clearOnFocus?: boolean;
}

const CustomSearchDropdown: React.FC<CustomSearchDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search",
  loading = false,
  disabled = false,
  sx = {},
  clearOnFocus = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = options.filter(option => {
      const labelLower = (option.label ?? '').toLowerCase();
      const valueLower = (option.value ?? '').toLowerCase();
      
      // Search in both label and value
      return labelLower.includes(searchLower) || valueLower.includes(searchLower);
    });

    // Sort by relevance - exact matches first, then partial matches
    const sorted = filtered.sort((a, b) => {
      const aLabel = (a.label ?? '').toLowerCase();
      const bLabel = (b.label ?? '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Exact match gets highest priority
      if (aLabel === searchLower && bLabel !== searchLower) return -1;
      if (bLabel === searchLower && aLabel !== searchLower) return 1;

      // Starts with search term gets second priority
      if (aLabel.startsWith(searchLower) && !bLabel.startsWith(searchLower)) return -1;
      if (bLabel.startsWith(searchLower) && !aLabel.startsWith(searchLower)) return 1;

      // Contains search term gets third priority
      if (aLabel.includes(searchLower) && !bLabel.includes(searchLower)) return -1;
      if (bLabel.includes(searchLower) && !aLabel.includes(searchLower)) return 1;

      // Alphabetical order for same relevance
      return aLabel.localeCompare(bLabel);
    });

    setFilteredOptions(sorted);
    setHighlightedIndex(-1);
  }, [searchTerm, options]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: Option) => {
    onChange(option);
    setSearchTerm(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchTerm(newValue);
    
    if (!isOpen && newValue) {
      setIsOpen(true);
    }
    
    // Allow clearing the input completely
    if (!newValue) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      if (clearOnFocus) {
        // Clear label so user can start typing immediately
        setSearchTerm('');
      } else if (value) {
        // Default behavior: show current value when focusing
        setSearchTerm(value.label);
      }
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay closing to allow for option selection
    setTimeout(() => {
      // Check if the dropdown is still open and if we're not clicking on View All
      if (isOpen) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        // Don't reset showAllOptions here to maintain the state
        // Only reset to selected value if search term is empty and we have a value
        // But allow clearing completely if user intentionally cleared the input
        if (!searchTerm.trim() && value && searchTerm !== '') {
          setSearchTerm(value.label);
        }
      }
    }, 200);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        if (clearOnFocus) {
          setSearchTerm('');
        }
        inputRef.current?.focus();
      }
    }
  };

  // Handle clear input
  const handleClearInput = () => {
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        // Don't reset showAllOptions to maintain the state
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    if (value) {
      setSearchTerm(value.label);
    }
  }, [value]);

  // Get the options to display
  const displayOptions = searchTerm.trim() ? filteredOptions : options;

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', ...sx }}>
      <TextField
        ref={inputRef}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        size="small"
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : searchTerm ? (
                                 <IconButton
                   onClick={handleClearInput}
                   size="small"
                   disabled={disabled}
                 >
                   <ClearIcon sx={{ fontSize: '16px' }} />
                 </IconButton>
              ) : (
                <IconButton
                  onClick={handleDropdownToggle}
                  size="small"
                  disabled={disabled}
                >
                  {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              )}
            </InputAdornment>
          ),
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "18px",
            height: 35,
            fontSize: "12px",
            backgroundColor: (theme) => theme.palette.primary.main,
            color: "#fff",
            "& input": {
              color: "#fff",
              "&::placeholder": {
                color: "#fff",
                opacity: 0.7
              }
            },
            "& .MuiSvgIcon-root": {
              color: "#fff"
            },
            "& .MuiIconButton-root": {
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)"
              }
            },
            "& fieldset": {
              border: "1px solid",
              borderColor: (theme) => theme.palette.primary.main,
            },
            "&:hover fieldset": {
              borderColor: (theme) => theme.palette.primary.main,
            },
            "&.Mui-focused fieldset": {
              borderColor: (theme) => theme.palette.primary.main,
            }
          }
        }}
      />
      
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 300,
            overflow: 'auto',
            backgroundColor: (theme) => theme.palette.background.paper,
            color: (theme) => theme.palette.text.primary,
            border: '1px solid',
            borderColor: (theme) => theme.palette.divider,
            borderRadius: 1,
            mt: 0.5
          }}
        >
          <List dense>
             {/* Options List */}
             {displayOptions.length > 0 ? (
               displayOptions.map((option, index) => (
                 <ListItem
                   key={option.value}
                   onClick={() => handleOptionSelect(option)}
                   onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking
                   sx={{
                     cursor: 'pointer',
                     backgroundColor: highlightedIndex === index ? (theme) => theme.palette.action.selected : 'transparent',
                     '&:hover': {
                       backgroundColor: (theme) => theme.palette.action.hover
                     }
                   }}
                 >
                   <ListItemText
                     primary={option.label}
                     primaryTypographyProps={{
                       fontSize: '12px'
                     }}
                   />
                 </ListItem>
               ))
             ) : (
               <Box sx={{ p: 2, textAlign: 'center' }}>
                 <Typography variant="body2" color="text.secondary">
                   No results found
                 </Typography>
               </Box>
             )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default CustomSearchDropdown; 