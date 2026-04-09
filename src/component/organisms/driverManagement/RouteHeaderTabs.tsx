import React from "react";
import { Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";

const RouteHeaderTabs = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      variant={isMobile ? "scrollable" : "standard"}
      scrollButtons={isMobile ? "auto" : false}
      allowScrollButtonsMobile
      textColor="primary"
      indicatorColor="primary"
      sx={{
        minHeight: 42,
        "& .MuiTabs-indicator": {
          display: "none",
        },
        "& .MuiTab-root": {
          textTransform: "none",
          fontSize: 13,
          fontWeight: 500,
          minHeight: 42,
          px: 2.2,
          py: 0.75,
          color: "text.secondary",
          borderRadius: "6px",
          minWidth: "fit-content",
          transition: "all 0.2s ease",
          "&.Mui-selected": {
            backgroundColor: "primary.main",
            color: "#fff",
          },
        },
      }}
    >
      <Tab label="Routes" />
      <Tab label="Drivers" />
      <Tab label="Vehicles" />
      <Tab label="Cancelled Orders" />
      <Tab label="Settings" />
    </Tabs>
  );
};

export default RouteHeaderTabs;
