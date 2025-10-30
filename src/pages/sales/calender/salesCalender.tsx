import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import SalesCalendar from '../../../component/atoms/SalesCalendar';

const SalesCalendarPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box p={{ xs: "10px", sm: "10px", md: "10px 15px" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Typography fontSize="22px" fontWeight={500}>
            Sales Calendar
          </Typography>
        </Box>
        
        <SalesCalendar />
      </Box>
    </Container>
  );
};

export default SalesCalendarPage;
