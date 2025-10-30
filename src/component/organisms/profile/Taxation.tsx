import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

interface TaxData {
  salesTaxNumber: string;
  cigaretteLicense: string;
  cigaretteLicenseExpirationDate: string;
  otherLicense1: string;
  otherLicense1ExpirationDate: string;
  invoiceFormat: string;
}

const Taxation = ({ data }: { data: TaxData }) => {
  return (
    <Box sx={{ p: 1 }}>
      <Typography fontSize="18px" fontWeight={500} mb={4}>
        Taxation Details
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
          <Typography fontSize="14px" fontWeight={400}>Invoice Format</Typography>
          <Typography fontSize="13px" fontWeight={400} color="text.secondary">
            {data.invoiceFormat}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Taxation;
