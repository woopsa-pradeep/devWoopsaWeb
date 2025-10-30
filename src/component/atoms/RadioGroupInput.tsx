import React from "react";
import {
  Box,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from "@mui/material";

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  options: Option[];
  errorText?: string;
  [key: string]: any;
}

const RadioGroupInput = ({ label, options, errorText, ...rest }: Props) => {
  return (
    <Box mb={2}>
      <FormControl component="fieldset" error={!!errorText}>
        <Typography
          component="legend"
          fontSize={14}
          fontWeight={600}
          mb={"5px"}
          sx={{ opacity: "70%" }}
        >
          {label}
        </Typography>
        <RadioGroup row {...rest}>
          {options.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio size="small" />}
              label={
                <Typography fontSize={14} color="#808080">
                  {opt.label}
                </Typography>
              }
            />
          ))}
        </RadioGroup>
        {errorText && (
          <Typography color="error" fontSize={12} mt={0.5}>
            {errorText}
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default RadioGroupInput;
