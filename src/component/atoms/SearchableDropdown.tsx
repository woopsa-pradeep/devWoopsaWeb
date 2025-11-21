import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Autocomplete,
  AutocompleteProps,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";

interface Option {
  label: string;
  value: string;
  image?: string;
  description?: string;
}

interface SearchableDropdownProps extends Omit<AutocompleteProps<Option, false, false, false>, 'options' | 'renderInput' | 'onChange'> {
  label?: string;
  options: Option[];
  value: Option | null;
  onChange: (value: Option | null) => void;
  onSearchChange?: (searchValue: string) => void;
  error?: boolean;
  helperText?: string;
  sx?: any;
  placeholder?: string;
  loading?: boolean;
  noOptionsText?: string;
}

interface MultiSearchableDropdownProps extends Omit<AutocompleteProps<Option, true, false, false>, 'options' | 'renderInput' | 'onChange'> {
  label?: string;
  options: Option[];
  value: Option[];
  onChange: (value: Option[]) => void;
  onSearchChange?: (searchValue: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  error?: boolean;
  helperText?: string;
  sx?: any;
  placeholder?: string;
  loading?: boolean;
  noOptionsText?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  onSearchChange,
  error,
  helperText,
  sx = { mb: 2.2 },
  placeholder = "Search",
  loading = false,
  noOptionsText = "No options available",
  ...rest
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (event: any, newInputValue: string) => {
    setInputValue(newInputValue);
    onSearchChange?.(newInputValue);
  };

  return (
    <Box sx={sx}>
       {label && <Typography
          fontSize={14}
          fontWeight={400}
          mb={"5px"}
          sx={{ opacity: "70%" }}
        >
          {label}
        </Typography>}

      <Autocomplete
        options={options}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        disableClearable={false} 
        blurOnSelect
        selectOnFocus
        clearOnBlur
        loading={loading}
        noOptionsText={noOptionsText}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size="small"
            variant="outlined"
            error={error}
            helperText={helperText}
            inputRef={params.InputProps.ref}
            InputProps={{
              ...params.InputProps,
              ref: params.InputProps.ref,
              startAdornment: (
               <SearchIcon 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    ml: 2,
                    mr: 2,
                    fontSize: 22
                  }} 
                />
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress 
                      color="inherit" 
                      size={20} 
                      sx={{ mr: 1 }} 
                    />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontSize: "15px",
                backgroundColor: theme.palette.background.paper,
                transition: "all 0.3s ease",
                "& fieldset": {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.grey[300],
                  borderWidth: "1.5px",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: "2px",
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: "2px",
                },
                "&.Mui-focused": {
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: `0 4px 20px ${theme.palette.primary.main}20`,
                },
              },
              "& .MuiFormHelperText-root": {
                marginLeft: 0,
                fontSize: "12px",
                fontWeight: 400
              },
            }}
            inputProps={{
              ...params.inputProps,
              style: {
                padding: "10px 16px",
                paddingLeft: 0,
                fontSize: "15px",
                fontWeight: 400
              },
            }}
          />
        )}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <Box
              component="li"
              key={key || option.value}
              {...otherProps}
              sx={{
                padding: "16px",
                margin: "4px 8px",
                borderRadius: "4px",
                backgroundColor: selected 
                  ? `${theme.palette.primary.main}10`
                  : "transparent",
                color: selected 
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
                "&:hover": {
                  backgroundColor: selected 
                    ? `${theme.palette.primary.main}20`
                    : `${theme.palette.action.hover}80`,
                },
                transition: "all 0.2s ease",
              }}
            >
              <Box display="flex" alignItems="center" width="100%">
                {option.image && (
                  <Box
                    component="img"
                    src={option.image}
                    alt={option.label}
                    sx={{
                      width: 40,
                      height: 40,
                      objectFit: "contain",
                      borderRadius: "4px",
                      mr: 2,
                      border: `2px solid ${theme.palette.divider}`,
                    }}
                  />
                )}
                <Box flex={1}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={400}
                    sx={{
                      color: selected 
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      fontSize: "15px",
                    }}
                  >
                    {option.label}
                  </Typography>
                  {option.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        opacity: 0.9,
                        mt: 0.5,
                        fontSize: "13px",
                        fontWeight: 400
                      }}
                    >
                      {option.description}
                    </Typography>
                  )}
                </Box>
                {selected && (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "4px",
                      backgroundColor: theme.palette.primary.main,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ml: 2,
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 400
                    }}
                  >
                    ✓
                  </Box>
                )}
              </Box>
            </Box>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.value}
              label={option.label}
              size="medium"
              sx={{
                backgroundColor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontWeight: 400,
                borderRadius: "4px",
                height: "28px",
                fontSize: "14px",
                border: `1.5px solid ${theme.palette.primary.main}30`,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: `${theme.palette.primary.main}25`,
                },
                "& .MuiChip-deleteIcon": {
                  color: theme.palette.primary.main,
                  fontSize: "22px",
                  "&:hover": {
                    color: theme.palette.primary.dark,
                  }
                },
              }}
            />
          ))
        }
        sx={{
          "& .MuiAutocomplete-paper": {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            borderRadius: "4px",
            border: `1.5px solid ${theme.palette.divider}`,
            maxHeight: 400,
            mt: 1,
            padding: "8px",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[400],
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: theme.palette.grey[500],
              },
            },
          },
          "& .MuiAutocomplete-listbox": {
            padding: 0,
          },
        }}
        {...rest}
      />
    </Box>
  );
};

const MultiSearchableDropdown: React.FC<MultiSearchableDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  onSearchChange,
  onOpen,
  onClose,
  error,
  helperText,
  sx = { mb: 2.2 },
  placeholder = "Search",
  loading = false,
  noOptionsText = "No options available",
  ...rest
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState("");
console.log('Options:', options);
  const handleInputChange = (event: any, newInputValue: string) => {
    setInputValue(newInputValue);
    onSearchChange?.(newInputValue);
  };

  return (
    <Box sx={sx}>
       {label && <Typography
          fontSize={14}
          fontWeight={400}
          mb={"5px"}
          sx={{ opacity: "70%" }}
        >
          {label}
        </Typography>}

      <Autocomplete
        multiple
        options={options?.length > 0 ? options : []}
        value={value}
        onChange={(_, newValue) => onChange(newValue || [])}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onOpen={onOpen}
        onClose={onClose}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        disableClearable={false} 
        blurOnSelect={false}
        selectOnFocus
        clearOnBlur={false}
        freeSolo={false}
        openOnFocus={true}
        disableCloseOnSelect={true}
        loading={loading}
        noOptionsText={noOptionsText}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={value.length === 0 ? placeholder : ""}
            size="small"
            variant="outlined"
            error={error}
            helperText={helperText}
            inputRef={params.InputProps.ref}
            InputProps={{
              ...params.InputProps,
              ref: params.InputProps.ref,
              startAdornment: (
                <>
                  {params.InputProps.startAdornment}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: value.length > 0 ? '36px' : '100%',
                    minHeight: '36px',
                    alignSelf: value.length > 0 ? 'flex-start' : 'center',
                    flexShrink: 0,
                    mt: value.length > 0 ? '4px' : 0
                  }}>
                    <SearchIcon 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        ml: 2,
                        mr: 2,
                        fontSize: 18
                      }} 
                    />
                  </Box>
                </>
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress 
                      color="inherit" 
                      size={20} 
                      sx={{ mr: 1 }} 
                    />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontSize: "13px",
                backgroundColor: theme.palette.background.paper,
                transition: "all 0.3s ease",
                minHeight: "44px",
                padding: "4px",
                alignItems: "flex-start",
                "& .MuiAutocomplete-inputRoot": {
                  flexWrap: "wrap",
                  alignItems: "center",
                },
                "& .MuiAutocomplete-tag": {
                  margin: "4px",
                },
                "& .MuiInputBase-input": {
                  alignSelf: "center",
                },
                "& .MuiAutocomplete-input": {
                  alignSelf: "center",
                },
                "& fieldset": {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.grey[300],
                  borderWidth: "1.5px",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: "2px",
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: "2px",
                },
                "&.Mui-focused": {
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: `0 4px 20px ${theme.palette.primary.main}20`,
                },
              },
              "& .MuiFormHelperText-root": {
                marginLeft: 0,
                fontSize: "12px",
                fontWeight: 400
              },
            }}
            inputProps={{
              ...params.inputProps,
              style: {
                padding: "2px 8px",
                paddingLeft: 0,
                fontSize: "13px",
                fontWeight: 400
              },
            }}
          />
        )}
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <Box
              component="li"
              key={key || option.value}
              {...otherProps}
              sx={{
                padding: "16px",
                margin: "4px 8px",
                borderRadius: "4px",
                backgroundColor: selected 
                  ? `${theme.palette.primary.main}10`
                  : "transparent",
                color: selected 
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
                "&:hover": {
                  backgroundColor: selected 
                    ? `${theme.palette.primary.main}20`
                    : `${theme.palette.action.hover}80`,
                },
                transition: "all 0.2s ease",
              }}
            >
              <Box display="flex" alignItems="center" width="100%">
                {option.image && (
                  <Box
                    component="img"
                    src={option.image}
                    alt={option.label}
                    sx={{
                      width: 40,
                      height: 40,
                      objectFit: "contain",
                      borderRadius: "4px",
                      mr: 2,
                      border: `2px solid ${theme.palette.divider}`,
                    }}
                  />
                )}
                <Box flex={1}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={400}
                    sx={{
                      color: selected 
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      fontSize: "15px",
                    }}
                  >
                    {option.label}
                  </Typography>
                  {option.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        opacity: 0.9,
                        mt: 0.5,
                        fontSize: "13px",
                        fontWeight: 400
                      }}
                    >
                      {option.description}
                    </Typography>
                  )}
                </Box>
                {selected && (
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "4px",
                      backgroundColor: theme.palette.primary.main,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ml: 2,
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 400
                    }}
                  >
                    ✓
                  </Box>
                )}
              </Box>
            </Box>
          );
        }}
        renderTags={(value, getTagProps) => {
          const maxRows = 6;
          const chipHeight = 28; // height of each chip
          const chipMargin = 8; // 4px top + 4px bottom margin
          const maxHeight = maxRows * (chipHeight + chipMargin);
          const hasMoreThanMaxRows = value.length > maxRows;
          
          return (
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                gap: '4px',
                maxHeight: hasMoreThanMaxRows ? `${maxHeight}px` : 'none',
                overflowY: hasMoreThanMaxRows ? 'auto' : 'visible',
                overflowX: 'hidden',
                width: '100%',
                alignItems: 'flex-start',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.grey[400],
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: theme.palette.grey[500],
                  },
                },
              }}
            >
              {value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.value}
                  label={option.label}
                  size="medium"
                  deleteIcon={<span style={{ fontSize: '22px', fontWeight: 400 }}>×</span>}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    fontSize: "14px",
                    height: "28px",
                    margin: "4px",
                    fontWeight: 400,
                    borderRadius: "4px",
                    border: `1.5px solid ${theme.palette.grey[300]}`,
                    transition: "all 0.2s ease",
                    '& .MuiChip-label': {
                      padding: '0 12px',
                    },
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.error.main,
                      }
                    },
                    "&:hover": {
                      backgroundColor: theme.palette.grey[200],
                      borderColor: theme.palette.grey[400],
                    }
                  }}
                />
              ))}
            </Box>
          );
        }}
        sx={{
          "& .MuiAutocomplete-paper": {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            borderRadius: "4px",
            border: `1.5px solid ${theme.palette.divider}`,
            maxHeight: 400,
            mt: 1,
            padding: "8px",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[400],
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: theme.palette.grey[500],
              },
            },
          },
          "& .MuiAutocomplete-listbox": {
            padding: 0,
          },
          "& .MuiAutocomplete-inputRoot": {
            flexWrap: "wrap",
            "& .MuiAutocomplete-tag": {
              margin: "4px",
            },
          },
        }}
        {...rest}
      />
    </Box>
  );
};

export default SearchableDropdown;
export { MultiSearchableDropdown }; 