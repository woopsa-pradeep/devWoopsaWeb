import React from "react";
import { Box, Typography } from "@mui/material";

const NoModulePermission: React.FC = () => {

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100%"
      minHeight="60vh"
      textAlign="center"
      px={2}
    >
      <Typography variant="h5" fontWeight={600} mb={1}>
        No Module Permissions
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3} maxWidth={480}>
        You don't have access to any modules in this application. Please contact your administrator to request the necessary permissions.
      </Typography>
    </Box>
  );
};

export default NoModulePermission;

