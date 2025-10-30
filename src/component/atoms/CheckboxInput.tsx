import React from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  FormGroup,
} from "@mui/material";

interface Option {
  label: string;
  value: string;
}

interface Props {
  label?: string; // Only for multiple checkboxes
  singleLabel?: string; // ✅ For a single checkbox with inline label
  errorText?: string;
  options?: Option[];
  selectedValues?: string[];
  onChange?: (value: string, checked: boolean) => void;
  direction?: "row" | "column";
  checked?: boolean; // Add checked prop for single checkbox
  [key: string]: any;
}

const CheckboxInput = ({
  label,
  errorText,
  options,
  selectedValues = [],
  singleLabel,
  onChange,
  direction = "column", // <== default to vertical
  checked,
  ...rest
}: Props) => {
  const isMultiple = Array.isArray(options);

  return (
    <Box mb={2}>
      {isMultiple && label && (
        <Typography
          fontSize={14}
          fontWeight={600}
          mb={"5px"}
          sx={{ opacity: "70%" }}
        >
          {label}
        </Typography>
      )}

      {isMultiple ? (
        <FormGroup row={direction === "row"}>
          {options!.map((opt) => (
            <FormControlLabel
              key={opt.value}
              control={
                <Checkbox
                  size="small"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => onChange?.(opt.value, e.target.checked)}
                />
              }
              label={
                <Typography
                  fontSize={14}
                  color="#808080"
                >
                  {opt.label}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      ) : (
        <FormControlLabel
          control={
            <Checkbox 
              size="small" 
              checked={checked}
              onChange={(e) => onChange?.('', e.target.checked)}
              {...rest} 
            />
          }
          label={
            <Typography fontSize={14} color="#808080">
              {singleLabel}
            </Typography>
          }
        />
      )}

      {errorText && (
        <Typography color="error" fontSize={12} mt={0.5}>
          {errorText}
        </Typography>
      )}
    </Box>
  );
};

export default CheckboxInput;
