import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Box,
  FormHelperText,
  SxProps,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Clear } from "@mui/icons-material";

interface Props {
  label?: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onStartDateChange: (date: Dayjs | null) => void;
  onEndDateChange: (date: Dayjs | null) => void;
  onClear?: () => void;
  sx?: SxProps;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: {
    start?: string;
    end?: string;
  };
  format?: string;
  isLabel?: boolean;
}

const CustomDateRangePicker: React.FC<Props> = ({
  label = "Date Range",
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  sx = { mb: 2.2 },
  error = false,
  helperText = "",
  disabled = false,
  placeholder = {
    start: "Start Date",
    end: "End Date",
  },
  format = "YYYY-MM-DD",
  isLabel = true,
}) => {
  const handleClear = () => {
    onStartDateChange(null);
    onEndDateChange(null);
    onClear?.();
  };

  // Ensure we have valid Dayjs objects or null
  const validStartDate =
    startDate && dayjs.isDayjs(startDate) ? startDate : null;
  const validEndDate = endDate && dayjs.isDayjs(endDate) ? endDate : null;

  return (
    <Box sx={sx}>
      {/* External Label */}
      {isLabel && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb="5px"
        >
          <Typography fontSize={14} fontWeight={600} sx={{ opacity: "70%" }}>
            {label}
          </Typography>
          {(validStartDate || validEndDate) && (
            <Tooltip title="Clear dates">
              <IconButton
                size="small"
                onClick={handleClear}
                disabled={disabled}
                sx={{
                  p: 0.5,
                  color: "text.secondary",
                  "&:hover": {
                    color: "error.main",
                  },
                }}
              >
                <Clear fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" gap={1} alignItems="center">
          {/* Start Date Picker */}
          <Box flex={1}>
            <DatePicker
              value={validStartDate}
              onChange={onStartDateChange}
              disabled={disabled}
              maxDate={validEndDate || undefined}
              format={format}
              slotProps={{
                day: {
                  sx: {
                    "&.Mui-selected": {
                      color: "#ffffff",
                    },
                    "&.Mui-selected:hover": {
                      color: "#ffffff",
                    },
                  },
                },

                textField: {
                  placeholder: placeholder.start,
                  fullWidth: true,
                  size: "small",
                  variant: "outlined",
                  InputProps: {
                    sx: {
                      borderRadius: "4px",
                      fontSize: "12px",
                      padding: "2px 14px",
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
                        borderColor: error ? "#d32f2f" : "#ccc",
                      },
                      "&:hover fieldset": {
                        borderColor: error ? "#d32f2f" : "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: error ? "#d32f2f" : "#1976d2",
                      },
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Separator */}
          <Typography
            fontSize={12}
            color="text.secondary"
            sx={{
              px: 1,
              userSelect: "none",
            }}
          >
            to
          </Typography>

          {/* End Date Picker */}
          <Box flex={1}>
            <DatePicker
              value={validEndDate}
              onChange={onEndDateChange}
              disabled={disabled}
              minDate={validStartDate || undefined}
              format={format}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                },
              }}
              slotProps={{
                day: {
                  sx: {
                    "&.Mui-selected": {
                      color: "#ffffff",
                    },
                    "&.Mui-selected:hover": {
                      color: "#ffffff",
                    },
                  },
                },

                textField: {
                  placeholder: placeholder.end,
                  fullWidth: true,
                  size: "small",
                  variant: "outlined",
                  InputProps: {
                    sx: {
                      borderRadius: "4px",
                      fontSize: "12px",
                      padding: "2px 14px",
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
                        borderColor: error ? "#d32f2f" : "#ccc",
                      },
                      "&:hover fieldset": {
                        borderColor: error ? "#d32f2f" : "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: error ? "#d32f2f" : "#1976d2",
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
          </Box>
        </Box>
      </LocalizationProvider>

      {error && <FormHelperText error>{helperText}</FormHelperText>}
    </Box>
  );
};

export default CustomDateRangePicker;
