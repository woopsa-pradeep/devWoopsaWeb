import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { ContactData } from '../../../utils/profileDataMapper';

const ContactInformation = ({ data }: { data: ContactData }) => {
  return (
    <Box sx={{ p: 1 }}>
      <Typography fontSize="18px" fontWeight={500} mb={4}>
        Contact Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Mobile Number</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.mobileNumber}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Alternate Number</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.altPhone}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Primary Email</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.email}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Additional Email</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.altEmail}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Store Timing</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.storeTiming}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactInformation;
