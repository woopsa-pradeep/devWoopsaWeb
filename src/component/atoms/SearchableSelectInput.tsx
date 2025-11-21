import React from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  AutocompleteProps,
  Paper,
  PaperProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

type Option = {
  label: string;
  value: string;
};

type Props = Omit<AutocompleteProps<Option, false, false, false>, 'options' | 'renderInput' | 'onChange' | 'value'> & {
  label?: string;
  options: Option[];
  error?: boolean;
  helperText?: string;
  marginBottom?: string;
  value?: string | number | null | undefined;
  onChange?: (event: any) => void;
  name?: string;
  disabled?: boolean;
};

const SearchableSelectInput = React.forwardRef<HTMLInputElement, Props>(
  ({ label, options, error, helperText, value: propValue, marginBottom = "2", onChange, name, disabled, ...rest }, ref) => {
    const theme = useTheme();
    const selectRef = React.useRef<HTMLDivElement>(null);
    const inputElementRef = React.useRef<HTMLInputElement | null>(null);
    const [inputValue, setInputValue] = React.useState<string>('');

    // Extract value from rest props if it exists (from field spread), otherwise use propValue
    const { value: restValue, ...restProps } = rest as any;
    const finalValue = restValue !== undefined ? restValue : propValue;
    
    // Convert value to string for internal use, handling both string and number
    const valueStr = finalValue !== null && finalValue !== undefined ? String(finalValue) : "";

    // Find the selected option based on value
    const selectedOption = React.useMemo(() => {
      if (!valueStr) return null;
      return options.find((opt) => opt.value === valueStr) || null;
    }, [valueStr, options]);

    // Update inputValue when selectedOption changes (when value is set externally)
    React.useEffect(() => {
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else if (!valueStr) {
        setInputValue('');
      }
    }, [selectedOption, valueStr]);

    // Create a ref object that always has a focus method
    React.useImperativeHandle(ref, () => {
      return {
        focus: () => {
          try {
            const currentInput = inputElementRef.current;
            if (currentInput != null && currentInput !== undefined) {
              const focusMethod = currentInput.focus;
              if (focusMethod != null && typeof focusMethod === 'function') {
                focusMethod.call(currentInput);
                return;
              }
            }
          } catch {
            // Continue to next strategy
          }
          
          try {
            const selectContainer = selectRef.current;
            if (selectContainer != null) {
              const selectElement = selectContainer.querySelector?.('input') as HTMLElement;
              if (selectElement != null && selectElement !== undefined) {
                const focusMethod = selectElement.focus;
                if (focusMethod != null && typeof focusMethod === 'function') {
                  focusMethod.call(selectElement);
                  return;
                }
              }
            }
          } catch {
            // Silently fail
          }
        },
        blur: () => {
          const currentInput = inputElementRef.current;
          if (currentInput) {
            try {
              currentInput.blur();
            } catch {
              // Ignore blur errors
            }
          }
        },
        value: valueStr || '',
        name: name || '',
        type: 'text',
      } as HTMLInputElement;
    }, [valueStr, name]);

    const handleChange = (event: any, newValue: Option | null) => {
      if (onChange) {
        const valueToSet = newValue?.value || '';
        // Update input value to show the selected option's label
        setInputValue(newValue?.label || '');
        // react-hook-form's Controller onChange accepts the value directly
        // Create a synthetic event that mimics a standard input change event
        const syntheticEvent = {
          target: {
            name: name || '',
            value: valueToSet,
          },
          currentTarget: {
            name: name || '',
            value: valueToSet,
          },
        };
        // Call onChange with the synthetic event (react-hook-form Controller handles this)
        onChange(syntheticEvent as any);
      }
    };

    const handleInputChange = (event: any, newInputValue: string) => {
      setInputValue(newInputValue);
    };

    return (
      <Box mb={marginBottom} ref={selectRef}>
        {/* Static Label */}
        {label && (
          <Typography
            fontSize={14}
            fontWeight={600}
            mb={"5px"}
            sx={{ opacity: "70%" }}
          >
            {label}
          </Typography>
        )}

        {/* Autocomplete Field */}
        <Autocomplete
          options={options}
          value={selectedOption}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={handleChange}
          getOptionLabel={(option: Option) => option.label}
          isOptionEqualToValue={(option: Option, value: Option) => option.value === value.value}
          disabled={disabled}
          size="small"
          fullWidth
          disableClearable={false}
          selectOnFocus={false}
          clearOnBlur={false}
          handleHomeEndKeys
          openOnFocus
          freeSolo={false}
          filterOptions={(options: Option[], { inputValue: filterInputValue }) => {
            // Filter options based on input value (case-insensitive)
            if (!filterInputValue || filterInputValue.trim() === '') {
              return options;
            }
            const searchTerm = filterInputValue.toLowerCase().trim();
            return options.filter((option: Option) =>
              option.label.toLowerCase().includes(searchTerm) ||
              option.value.toLowerCase().includes(searchTerm)
            );
          }}
          renderInput={(params) => {
            // Combine refs: Autocomplete's ref and our custom ref
            const combinedRef = (input: HTMLInputElement | null) => {
              // Store in our ref
              inputElementRef.current = input;
              
              // Call Autocomplete's ref (from InputProps.ref)
              if (params.InputProps?.ref) {
                if (typeof params.InputProps.ref === 'function') {
                  params.InputProps.ref(input);
                } else if (params.InputProps.ref && 'current' in params.InputProps.ref) {
                  (params.InputProps.ref as React.MutableRefObject<HTMLInputElement | null>).current = input;
                }
              }
              
              // Call our forwarded ref if it exists
              if (ref) {
                if (typeof ref === 'function') {
                  ref(input);
                } else if ('current' in ref) {
                  (ref as React.MutableRefObject<HTMLInputElement | null>).current = input;
                }
              }
            };

            return (
              <TextField
                {...params}
                inputRef={combinedRef}
                name={name}
                error={error}
                placeholder={selectedOption ? undefined : `Select ${label || "Option"}`}
                autoComplete="off"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: theme.palette.text.primary,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: error
                        ? theme.palette.error.main
                        : theme.palette.divider,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
                inputProps={{
                  ...params.inputProps,
                  style: {
                    ...params.inputProps?.style,
                    padding: "6px 12px",
                    fontSize: "12px",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                }}
              />
            );
          }}
          ListboxProps={{
            sx: {
              "& .MuiAutocomplete-option": {
                fontSize: "14px",
                "&.Mui-focused": {
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                },
                "&[aria-selected='true']": {
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                },
                "&:hover": {
                  backgroundColor: theme.palette.primary.main,
                  color: "white",
                },
              },
            },
          }}
          PaperComponent={(props: PaperProps) => (
            <Paper
              {...props}
              sx={{
                bgcolor: "background.paper",
                color: theme.palette.text.primary,
                ...(props.sx || {}),
              }}
            />
          )}
          {...restProps}
        />

        {/* Error message */}
        {error && helperText && (
          <Typography color="error" fontSize={12} mt={0.5}>
            {helperText}
          </Typography>
        )}
      </Box>
    );
  }
);

SearchableSelectInput.displayName = 'SearchableSelectInput';

export default SearchableSelectInput;

