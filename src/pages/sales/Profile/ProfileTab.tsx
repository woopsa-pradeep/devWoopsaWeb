import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Grid, Typography, useTheme, useMediaQuery, Alert, CircularProgress } from '@mui/material';
import TextInput from '../../../component/atoms/TextInput';
import userIcon from '../../../assets/icons/user_1.svg';
import lockIcon from '../../../assets/icons/lock.svg';
// import TextInput from '../../../component/atoms/TextInput';
// import userIcon from '../../../assets/icons/user_1.svg';
// import lockIcon from '../../../assets/icons/lock.svg';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getProfile, changePassword } from '../../../redux/apis/sales/profileApis';
import CustomButton from '../../../component/atoms/CustomButton';
// import toast from 'react-hot-toast';
import { toast } from 'react-hot-toast';

const changePasswordSchema = z.object({
  old_password: z.string().min(6, 'Current password is required'),
  new_password: z.string().min(6, 'New password is required'),
  confirm_password: z.string().min(6, 'Confirm password is required'),
}).superRefine((data, ctx) => {
  if (data.confirm_password !== data.new_password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Confirm password must match new password',
      path: ['confirm_password'],
    });
  }
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  salesRepNumber: string;
  salesRep: {
    S_Number: number;
    S_Desc: string;
  };
};

const ProfileTab = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });
  const [changePwdSuccess, setChangePwdSuccess] = useState<string | null>(null);
  const [changePwdError, setChangePwdError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const res: any = await getProfile();
        setProfileData(res.data?.data);
      } catch (err: any) {
        console.log(err);
        setProfileError('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const onSubmit = async (data: ChangePasswordForm) => {
    setChangePwdSuccess(null);
    setChangePwdError(null);
    
    
      const res:any = await changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      if(res.data.success){
        toast.success(res?.data?.message || 'Password changed successfully');
        setChangePwdSuccess(res?.data?.message || 'Password changed successfully');
        reset();
      } else {
        const errorMessage = res?.data?.message || 'Failed to change password';
        toast.error(errorMessage);
        setChangePwdError(errorMessage);
      }

      
  };

  const tabStyle = {
    alignItems: 'center',
    textTransform: 'none',
    fontWeight: 400,
    justifyContent: 'flex-start',
    minHeight: 'auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: isSmallScreen ? 'auto' : '100% !important',
    px: 2,
    mt: 1,
    mb: 1,
    py: 1,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 500,
      borderLeft: isSmallScreen ? 'none' : `4px solid ${theme.palette.primary.main}`,
      borderBottom: isSmallScreen ? `2px solid ${theme.palette.primary.main}` : 'none',
    },
  };

  return (
    <Box
      display="flex"
      flexDirection={isSmallScreen ? 'column' : 'row'}
      mt={3}
      gap={3}
      sx={{
        height: isSmallScreen ? 'auto' : 'calc(100vh - 223px)',
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={1}
        sx={{
          width: isSmallScreen ? '100%' : '250px !important',
          minWidth: isSmallScreen ? 'auto' : '250px !important',
          borderRadius: 3,
          overflow: isSmallScreen ? 'hidden' : 'auto',
          height: isSmallScreen ? 'auto' : '100%',
          boxShadow: 'none',
        }}
      >
        <Tabs
          orientation={isSmallScreen ? 'horizontal' : 'vertical'}
          variant="scrollable"
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ py: isSmallScreen ? 0 : 2 }}
          TabIndicatorProps={{ style: { display: 'none' } }}
        >
          <Tab
            icon={<img src={userIcon} alt="Profile" style={{ width: 24, height: 24 }} />}
            iconPosition="start"
            label="Profile"
            sx={tabStyle}
          />
          <Tab
            icon={<img src={lockIcon} alt="Change Password" style={{ width: 24, height: 24 }} />}
            iconPosition="start"
            label="Change Password"
            sx={tabStyle}
          />
        </Tabs>
      </Paper>
      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          borderRadius: 3,
          p: 3,
          boxShadow: 'none',
          overflow: isSmallScreen ? 'hidden' : 'auto',
          height: isSmallScreen ? 'auto' : '100%',
        }}
      >
        {tab === 0 && (
          <Box sx={{ p: 1 }}>
            <Typography fontSize={18} fontWeight={500} mb={4}>
              Profile
            </Typography>
            {profileLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={120}>
                <CircularProgress />
              </Box>
            ) : profileError ? (
              <Alert severity="error">{profileError}</Alert>
            ) : profileData ? (
              <Grid container spacing={3}>
                <Grid size={{xs:12, sm:6, md:4}}>
                  <Typography fontSize={14} fontWeight={400}>First Name</Typography>
                  <Typography fontSize={13} fontWeight={400} color="text.secondary">{profileData.firstName}</Typography>
                </Grid>
                <Grid size={{xs:12, sm:6, md:4}}>
                  <Typography fontSize={14} fontWeight={400}>Last Name</Typography>
                  <Typography fontSize={13} fontWeight={400} color="text.secondary">{profileData.lastName}</Typography>
                </Grid>
                <Grid size={{xs:12, sm:6, md:4}}>
                  <Typography fontSize={14} fontWeight={400}>Email</Typography>
                  <Typography fontSize={13} fontWeight={400} color="text.secondary">{profileData.email}</Typography>
                </Grid>
                <Grid size={{xs:12, sm:6, md:4}}>
                  <Typography fontSize={14} fontWeight={400}>Role</Typography>
                  <Typography fontSize={13} fontWeight={400} color="text.secondary">{profileData.role}</Typography>
                </Grid>
                <Grid size={{xs:12, sm:6, md:4}}>
                  <Typography fontSize={14} fontWeight={400}>Sales Rep Number</Typography>
                  <Typography fontSize={13} fontWeight={400} color="text.secondary">{profileData.salesRepNumber}</Typography>
                </Grid>
                <Grid size={{xs:12, sm:6, md:4}}>
                  <Typography fontSize={14} fontWeight={400}>Sales Rep</Typography>
                  <Typography fontSize={13} fontWeight={400} color="text.secondary">{profileData.salesRep?.S_Desc}</Typography>
                </Grid>
              </Grid>
            ) : null}
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ p: 1, maxWidth: 400 }}>
            <Typography fontSize={18} fontWeight={500} mb={4}>
              Change Password
            </Typography>
            {changePwdSuccess && <Alert severity="success" sx={{ mb: 2 }}>{changePwdSuccess}</Alert>}
            {changePwdError && <Alert severity="error" sx={{ mb: 2 }}>{changePwdError}</Alert>}
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextInput
                label="Current Password"
                type="password"
                {...register('old_password')}
                error={!!errors.old_password}
                helperText={errors.old_password?.message}
              />
              <TextInput
                label="New Password"
                type="password"
                {...register('new_password')}
                error={!!errors.new_password}
                helperText={errors.new_password?.message}
              />
              <TextInput
                label="Confirm Password"
                type="password"
                {...register('confirm_password')}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password?.message}
              />
              <CustomButton
                type="submit"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </CustomButton>
            </form>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ProfileTab;