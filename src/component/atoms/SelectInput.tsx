import React from "react";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  SelectProps,
  OutlinedInput,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PrimaryArrowIcon from "../../assets/icons/PrimaryArrowIcon";

type Option = {
  label: string;
  value: string;
};

type Props = SelectProps & {
  label?: string;
  options: Option[];
  error?: boolean;
  helperText?: string;
  marginBottom?: string;
};

const SelectInput = React.forwardRef<HTMLSelectElement, Props>(
  ({ label, options, error, helperText, value = "", marginBottom = "2", ...rest }, ref) => {
    const theme = useTheme();
    // const isPlaceholder = value === "";

    return (
      <Box mb={marginBottom}>
        {/* Static Label */}
     {label &&       <Typography
            fontSize={14}
            fontWeight={600}
            mb={"5px"}
            sx={{opacity:"70%"}}
          >
            {label}
          </Typography>}

        {/* Select Field */}
        <Select
          fullWidth
          size="small"
          displayEmpty
          error={error}
          inputRef={ref}
          value={value}
          defaultValue={options.length > 0 ? options[0].value : ""}
          IconComponent={PrimaryArrowIcon} // ✅ Set custom icon
          input={
            <OutlinedInput
              notched={false}
              sx={{
                borderRadius: "4px",
                paddingY: "3px",
                paddingRight: "10px", // 👈 space for dropdown icon
                fontSize: "12px",
                color:  theme.palette.text.primary,
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

                // ✅ Apply font styles directly to MenuItem elements
                "& .MuiMenuItem-root": {
                  fontSize: "14px", // 👈 set your desired size here
                },

                // ✅ Hover and selected states
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
          <MenuItem value="" disabled>
            {`Select ${label || "Option"}`}
          </MenuItem>
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

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

export default SelectInput;
