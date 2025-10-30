import React from 'react';
import { Box } from '@mui/material';
import { Typography } from '@mui/material';
import SettingsTabs from '../../../component/organisms/setting/SettingsTab';

const Settings = () => {
  return (
    <Box sx={{px: {xs: 1, md: 2}}}>
      <Typography sx={{ fontWeight: 400, fontSize: 20, color: "text.primary", mb: 2 }}>Settings</Typography>
      <SettingsTabs />
    </Box>
  );
};

export default Settings;