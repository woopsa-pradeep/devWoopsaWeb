import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Box, FormHelperText, SxProps, Typography } from "@mui/material";
import { Dayjs } from "dayjs";

interface Props {
  label?: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  sx?: SxProps;
  error?: boolean;
  helperText?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disablePast?: boolean;
  disabled?: boolean;
}

const CustomDatePicker: React.FC<Props> = ({ label = "", value, onChange, sx = {mb: 2.2}, error = false, helperText = "", minDate, maxDate, disablePast = false, disabled = false }) => {
  return (
    <Box sx={sx}>
      {/* External Label like TextInput */}
      <Typography
        fontSize={14}
        fontWeight={600}
        mb={"5px"}
        sx={{ opacity: "70%" }}
      >
        {label}
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          value={value} 
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          disablePast={disablePast}
          disabled={disabled}
          sx={{
            "& .MuiInputBase-input": {
              fontSize: "12px",
            },
          }}
          slotProps={{
            textField: {
              label: "", // <-- Hide MUI internal label
              fullWidth: true,
              size: "small",
              variant: "outlined",
              disabled: disabled,
              InputProps: {
                sx: {
                  borderRadius: "4px",
                  fontSize: "12px",
                  padding: "6px 14px",
                  color: "text.secondary",
                },
              },
              inputProps: {
                style: {
                  padding: "15px 14px",
                  fontSize: "12px",
                },
              },
              sx: {
                fontSize: "12px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  "& fieldset": {
                    borderColor: "#ccc",
                  },
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
                "& .MuiFormHelperText-root": {
                  marginLeft: 0,
                  fontSize: "12px",
                },
              },
            },
          }}
        />
        {error && <FormHelperText error>{helperText}</FormHelperText>}
      </LocalizationProvider>
    </Box>
  );
};

export default CustomDatePicker;
