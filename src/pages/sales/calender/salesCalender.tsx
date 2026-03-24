import React from 'react';
import { Box, Container } from '@mui/material';
import SalesCalendar from '../../../component/atoms/SalesCalendar';

const SalesCalendarPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box p={{ xs: "10px", sm: "10px", md: "10px 15px" }}>
        <SalesCalendar />
      </Box>
    </Container>
  );
};

export default SalesCalendarPage;
