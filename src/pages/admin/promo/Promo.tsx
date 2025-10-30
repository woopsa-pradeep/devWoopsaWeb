import React from 'react';
import { Box } from '@mui/material';
import { Typography } from '@mui/material';
import PromoTabs from '../../../component/organisms/promo/PromoTabs';

const Promo = () => {
  return (
    <Box sx={{px: {xs: 1, md: 2}}}>
      <Typography sx={{ fontWeight: 400, fontSize: 20, color: "text.primary", mb: 2 }}>Promo Management</Typography>
      <PromoTabs />
    </Box>
  );
};

export default Promo;