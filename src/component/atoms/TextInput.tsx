import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  TextFieldProps,
  SxProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LockOpenIcon from "../../assets/icons/unlock.svg";
import LockIcon from "../../assets/icons/lock.svg";

type Props = TextFieldProps & {
  label?: string;
  icon?: React.ReactNode;
  error?: boolean;
  helperText?: string;
  sx?: SxProps;
};

const TextInput = React.forwardRef<HTMLInputElement, Props>(
  (
    { label, icon, error, helperText, type, sx = { mb: 2.2 }, ...rest },
    ref
  ) => {
    const theme = useTheme();
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    const handleToggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <Box sx={sx}>
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

        {/* Styled TextField */}
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          error={error}
          helperText={helperText}
          inputRef={ref}
          type={actualType}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {isPassword ? (
                  <IconButton
                    onClick={handleToggleVisibility}
                    sx={{
                      color: theme.palette.primary.main,
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? (
                      <img
                        src={LockOpenIcon}
                        alt="user"
                        style={{
                          width: 24,
                          height: 24,
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <img
                        src={LockIcon}
                        alt="user"
                        style={{
                          width: 24,
                          height: 24,
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </IconButton>
                ) : (
                  icon
                )}
              </InputAdornment>
            ),
            sx: {
              borderRadius: "5px",
              fontSize: "14px",
              color: theme.palette.text.primary,
              paddingRight: icon ? "8px" : "0",
            },
          }}
          inputProps={{
            style: {
              // Responsive padding: less on lg and up, more on xs/sm/md
              padding: "13px 12px",
              fontSize: "12px",
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px",
              "& fieldset": {
                borderColor: error
                  ? theme.palette.error.main
                  : theme.palette.grey[300],
              },
              "&:hover fieldset": {
                borderColor: theme.palette.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
              },
              // Responsive input padding
              "& input": {
                padding: {
                  xs: "12px 12px",
                  sm: "12px 12px",
                  md: "12px 12px",
                  lg: "12px",
                  xl: "12px",
                },
                fontSize: {
                  xs: "13px",
                  sm: "13px",
                  md: "13px",
                  lg: "12px",
                  xl: "12px",
                },
              },
            },
            "& .MuiFormHelperText-root": {
              marginLeft: 0,
              fontSize: "12px",
            },
          }}
          {...rest}
        />
      </Box>
    );
  }
);

export default TextInput;
