import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { LicenseData } from '../../../utils/profileDataMapper';

const CustomerLicense = ({ data }: { data: LicenseData }) => {
  return (
    <Box sx={{ p: 1 }}>
      <Typography fontSize="18px" fontWeight={500} mb={4}>
        Customer License Info
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Sales TAX Number</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.salesTaxNumber}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Cigarette License</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.cigaretteLicense}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Cigarette License Expiration Date</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.cigaretteLicenseExpirationDate}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Other License 1</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.otherLicense1}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Other License 1 Expiration Date</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.otherLicense1ExpirationDate}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Driver's License</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.taxCode}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Driver's License Expiration Date</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.taxCodeCountry}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Terms</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.taxCodeCity}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Invoice Format</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.invoiceFormat}
          </Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize="14px" fontWeight={400}>Credit Limit</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.invoiceFormat}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerLicense;
