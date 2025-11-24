import React from 'react';
import { Box, Container } from '@mui/material';
import DistributorCalendar from '../../../component/atoms/DistributorCalendar';

const DistributorCalendarPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box p={{ xs: "10px", sm: "10px", md: "10px 15px" }}>
        {/* <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Typography fontSize="22px" fontWeight={500}>
            Distributor Calendar
          </Typography>
        </Box> */}
        
        <DistributorCalendar />
      </Box>
    </Container>
  );
};

export default DistributorCalendarPage;