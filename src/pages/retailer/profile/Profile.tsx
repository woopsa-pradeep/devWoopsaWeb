import React from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material';
import ProfileTabs from '../../../component/organisms/profile/ProfileTabs';
import { useTheme } from '@mui/material/styles';
const Profile = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    return (
        <Box sx={{px:isSmallScreen ? 1 : 3,py:1}}>
            <Typography fontSize={"22px"} fontWeight={500}>Profile</Typography>
            <ProfileTabs />
        </Box>
    )
}

export default Profile;