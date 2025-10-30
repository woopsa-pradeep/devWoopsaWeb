import React from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { styled } from "@mui/material/styles";

const RotatingArrow = styled(ArrowDropDownIcon, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ open, theme }) => ({
  color: theme.palette.primary.main,
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 0.3s ease",
}));

// Extract "open" from className manually
const PrimaryArrowIcon = (props: any) => {
  const isOpen = props.className?.includes("MuiSelect-iconOpen");
  return <RotatingArrow open={isOpen} />;
};

export default PrimaryArrowIcon;
