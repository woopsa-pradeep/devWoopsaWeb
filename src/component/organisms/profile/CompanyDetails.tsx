import React from 'react';
import { Box, Typography, Avatar, Grid } from '@mui/material';
import { CompanyDetailsData } from '../../../utils/profileDataMapper';

const CompanyDetails = ({ data }: { data: CompanyDetailsData }) => {

  return (
    <Box sx={{p:1}}>
        <Typography fontSize={"18px"} fontWeight={500} mb={4}>Company's Details</Typography>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar src={data?.logo} sx={{ width: 64, height: 64 }} />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Account Number</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.accountNumber}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Store Name</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.storeName}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Sales Rep</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.salesRep}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Company's Name</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.companyName}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Primary Address</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.primaryAddress}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>City</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.city}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>County</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.county}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>State</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.state}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Zip</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.zip}</Typography>
        </Grid>
        <Grid size={{xs:12,sm:6, md:4}}>
          <Typography fontSize={"14px"} fontWeight={400}>Country</Typography>
          <Typography fontSize={"13px"} fontWeight={400} color='text.secondary'>{data.country}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyDetails;
