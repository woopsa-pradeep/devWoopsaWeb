import { Link as RouterLink, To } from "react-router-dom";
import { Link, LinkProps, useTheme, SxProps, Theme } from "@mui/material";

interface PrimaryLinkProps extends LinkProps {
  to: To;
  state?: any; // Add support for react-router state
  replace?: boolean;
  reloadDocument?: boolean;
}

const PrimaryLink = ({
  to,
  state,
  replace,
  reloadDocument,
  sx,
  className,
  children,
  ...props
}: PrimaryLinkProps) => {
  const theme = useTheme();

  const defaultSx: SxProps<Theme> = {
    color: theme.palette.primary.main,
    fontSize: "12px",
    fontWeight: 400,
    textDecoration: "none",
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  };

  const mergedSx: SxProps<Theme> = Array.isArray(sx)
    ? [defaultSx, ...sx]
    : [defaultSx, sx];

  return (
    <Link
      component={RouterLink}
      to={to}
      state={state}
      replace={replace}
      reloadDocument={reloadDocument}
      underline="none"
      sx={mergedSx}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PrimaryLink;
