import React from "react";
import {
  Button,
  CircularProgress,
  SxProps,
  Theme,
  useTheme,
  Box,
} from "@mui/material";

type ButtonType = "primary" | "cancel" | "delete";
type ButtonAppearance = "filled" | "outlined";
type ButtonSize = "small" | "medium" | "large";
type IconPosition = "left" | "right" | "top" | "bottom";

interface CustomButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: (e: any) => void;
  buttonType?: ButtonType;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  sx?: SxProps<Theme>;
}

const getVariantStyles = (
  theme: Theme,
  buttonType: ButtonType,
  appearance: ButtonAppearance
): SxProps<Theme> => {
  const isLight = theme.palette.mode === "light";

  const base = {
    borderRadius: "4px",
    fontWeight: 400,
    textTransform: "none",
    boxShadow: "none",
    border: "2px solid transparent",
    fontSize: {xs:"14px", sm:"16px"},
    lineHeight: "1.5rem",
    mt: 3,
    "&:hover": {
      boxShadow: "none",
    },
  };

  const variants = {
    primary: {
      filled: {
        backgroundColor: theme.palette.primary.main,
        border: "2px solid transparent",
        color: "#fff",
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          boxShadow: "none",
        },
      },
      outlined: {
        border: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: "#fff",
          boxShadow: "none",
        },
      },
    },
    cancel: {
      filled: {
        border: "2px solid transparent",
        backgroundColor: isLight
          ? theme.palette.grey[300]
          : theme.palette.grey[700],
        color: theme.palette.text.secondary,
        "&:hover": {
          backgroundColor: isLight
            ? theme.palette.grey[400]
            : theme.palette.grey[600],
            boxShadow: "none",
        },
      },
      outlined: {
        border: `2px solid ${theme.palette.grey[400]}`,
        color: theme.palette.text.secondary,
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: theme.palette.grey[200],
          boxShadow: "none",
        },
      },
    },
    delete: {
      filled: {
        border: "2px solid transparent",
        backgroundColor: theme.palette.error.main,
        color: "#fff",
        "&:hover": {
          backgroundColor: theme.palette.error.dark,
          boxShadow: "none",
        },
      },
      outlined: {
        border: `2px solid ${theme.palette.error.main}`,
        color: theme.palette.error.main,
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: theme.palette.error.main,
          color: "#fff",
          boxShadow: "none",
        },
      },
    },
  };

  return {
    ...base,
    ...(variants[buttonType][appearance] ?? {}),
  };
};

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  buttonType = "primary",
  appearance = "filled",
  size = "small",
  loading = false,
  fullWidth = true,
  disabled = false,
  icon,
  iconPosition = "left",
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const variantStyle = getVariantStyles(theme, buttonType, appearance);

  const isVertical = iconPosition === "top" || iconPosition === "bottom";

  const content = (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection={isVertical ? "column" : "row"}
      gap={0.5}
    >
      {iconPosition === "top" && icon}
      {iconPosition === "left" && icon}
      {loading ? <CircularProgress size={24} color="inherit" /> : children}
      {iconPosition === "right" && icon}
      {iconPosition === "bottom" && icon}
    </Box>
  );

  return (
    <Button
      type={props.type || "button"}
      fullWidth={fullWidth}
      size={size}
      variant={appearance === "outlined" ? "outlined" : "contained"}
      disabled={loading || disabled}
      onClick={props.onClick}
      sx={[variantStyle, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {content}
    </Button>
  );
};

export default CustomButton;
