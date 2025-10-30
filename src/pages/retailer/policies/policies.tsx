import React from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material';
import RetailerPoliciesTabs from '../../../component/organisms/policies/RetailerPoliciesTabs';
import { useTheme } from '@mui/material/styles';

const Policies = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    
    return (
        <Box sx={{px:isSmallScreen ? 1 : 3,py:1}}>
            <Typography fontSize={"22px"} fontWeight={500}>Policies</Typography>
            <RetailerPoliciesTabs />    
        </Box>
    )
}

export default Policies