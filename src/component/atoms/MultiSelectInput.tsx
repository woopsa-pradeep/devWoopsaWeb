import React from "react";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  SelectProps,
  OutlinedInput,
  Chip,
  Checkbox,
  FormControl,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PrimaryArrowIcon from "../../assets/icons/PrimaryArrowIcon";

type Option = {
  label: string;
  value: string;
};

type Props = Omit<SelectProps, 'multiple' | 'onChange'> & {
  label?: string;
  options: Option[];
  error?: boolean;
  helperText?: string;
  value: string[];
  onChange: (value: string[]) => void;
};

const MultiSelectInput = React.forwardRef<HTMLSelectElement, Props>(
  ({ label, options, error, helperText, value = [], onChange, ...rest }, ref) => {
    const theme = useTheme();

    const handleChange = (event: any) => {
      const selectedValues = event.target.value as string[];
      onChange(selectedValues);
    };

    const renderValue = (selected: any) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selected.map((value: string) => {
          const option = options.find(opt => opt.value === value);
          return (
            <Chip 
              key={value} 
              label={option?.label || value} 
              size="small"
              sx={{ 
                fontSize: '11px',
                height: '20px',
                '& .MuiChip-label': {
                  px: 1,
                }
              }}
            />
          );
        })}
      </Box>
    );

    return (
      <Box mb={2}>
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

        {/* Select Field */}
        <FormControl fullWidth size="small">
          <Select
            multiple
            displayEmpty
            error={error}
            inputRef={ref}
            value={value}
            onChange={handleChange}
            renderValue={renderValue}
            IconComponent={PrimaryArrowIcon}
            input={
              <OutlinedInput
                notched={false}
                sx={{
                  borderRadius: "4px",
                  paddingY: "6px",
                  paddingRight: "10px",
                  fontSize: "12px",
                  color: theme.palette.text.primary,
                  minHeight: "40px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: error
                      ? theme.palette.error.main
                      : theme.palette.divider,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              />
            }
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: "background.paper",
                  color: theme.palette.text.primary,
                  maxHeight: 300,
                  "& .MuiMenuItem-root": {
                    fontSize: "14px",
                  },
                  "& .MuiMenuItem-root.Mui-selected": {
                    backgroundColor: theme.palette.primary.main,
                    color: "#fff",
                  },
                  "& .MuiMenuItem-root:hover": {
                    backgroundColor: theme.palette.primary.main,
                    color: "white",
                  },
                },
              },
            }}
            {...rest}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox 
                  checked={value.indexOf(opt.value) > -1}
                  size="small"
                  sx={{ 
                    color: theme.palette.primary.main,
                    '&.Mui-checked': {
                      color: theme.palette.primary.main,
                    }
                  }}
                />
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

export default MultiSelectInput; 