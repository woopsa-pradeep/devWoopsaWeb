import React from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ProfileTab from './ProfileTab';

const Profile = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    return (
        <Box sx={{px:isSmallScreen ? 1 : 3,py:1}}>
            <Typography fontSize={"22px"} fontWeight={500}>Profile</Typography>
            <ProfileTab />
        </Box>
    )
}

export default Profile;