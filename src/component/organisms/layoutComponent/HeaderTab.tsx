import { Tabs, Tab, Box, Paper, Typography } from "@mui/material";
import React, { useState } from "react";

function StoreWholesalerTabs() {
  const [value, setValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
      {/* Tabs */}
      <Tabs value={value} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
        <Tab label="Store Details" />
        <Tab label="Wholesaler Detail" />
      </Tabs>

      {/* Content Box */}
      <Paper
        elevation={2}
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          backgroundColor: "#fff",
          maxWidth: 600,
        }}
      >
        {value === 0 && (
          <Typography variant="body1">
            {/* Replace with actual content */}
            This is the Store Details content.
          </Typography>
        )}
        {value === 1 && (
          <Typography variant="body1">
            {/* Replace with actual content */}
            This is the Wholesaler Detail content.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default StoreWholesalerTabs