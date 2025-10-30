import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getProfile, uploadProfileImage } from "../../../redux/apis/distrubutor/settingApis";
import CompanyIconActive from "../../../assets/bag.svg";
import CompanyIconInactive from "../../../assets/icons/bag-inactive.svg";
import ContactIconActive from "../../../assets/icons/phone-user-active.svg";
import ContactIconInactive from "../../../assets/icons/phone-user-inactive.svg";
import { toast } from "react-hot-toast";
import { setLogo } from "../../../redux/slices/authSlice";
import { useAppDispatch } from "../../../redux/store";
// import LicenseIconActive from "../../../assets/icons/licence-active.svg";
// import LicenseIconInactive from "../../../assets/icons/licence-inactive.svg";

const AdminProfile = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<any>(null);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response: any = await getProfile();
        setData(response?.data?.data);
      } catch (err) {
        console.log(err, "err>>>>");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
    const data:any=  await uploadProfileImage(file);

    dispatch(setLogo(data.imageUrl));
      toast.success('Image uploaded successfully');
      const response: any = await getProfile();
      setData(response?.data?.data);
    } catch (err) {
        console.log(err,'err>>>>');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }
  if (!data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <Typography color="error">Failed to load profile data.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: isSmallScreen ? 1 : 3, py: 1 }}>
      <Typography fontSize={"22px"} fontWeight={500} mb={2}>
        Profile
      </Typography>
      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        mt={3}
        gap={3}
        sx={{
          height: isSmallScreen ? "auto" : "calc(100vh - 223px)", // Full screen height on large screens
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={1}
          sx={{
            width: isSmallScreen ? "100%" : "250px !important",
            minWidth: isSmallScreen ? "auto" : "250px !important",
            borderRadius: 3,
            overflow: isSmallScreen ? "hidden" : "auto",
            height: isSmallScreen ? "auto" : "100%",
            boxShadow: "none",
          }}
        >
          <Tabs
            orientation={isSmallScreen ? "horizontal" : "vertical"}
            variant="scrollable"
            value={tab}
            onChange={handleTabChange}
            sx={{ py: isSmallScreen ? 0 : 2 }}
            TabIndicatorProps={{ style: { display: "none" } }}
          >
            <Tab
              icon={
                <img
                  src={tab === 0 ? CompanyIconActive : CompanyIconInactive}
                  alt=""
                />
              }
              iconPosition="start"
              label="Company's Details"
              sx={{
                alignItems: "center",
                textTransform: "none",
                fontWeight: 400,
                justifyContent: "flex-start",
                minHeight: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: isSmallScreen ? "auto" : "100% !important",
                px: 2,
                mt: 1,
                mb: 1,
                py: 1,
              }}
            />
            <Tab
              icon={
                <img
                  src={tab === 1 ? ContactIconActive : ContactIconInactive}
                  alt=""
                />
              }
              iconPosition="start"
              label="Contact Information"
              sx={{
                alignItems: "center",
                textTransform: "none",
                fontWeight: 400,
                justifyContent: "flex-start",
                minHeight: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: isSmallScreen ? "auto" : "100% !important",
                px: 2,
                mt: 1,
                mb: 1,
                py: 1,
              }}
            />
            {/* <Tab
              icon={
                <img
                  src={tab === 2 ? LicenseIconActive : LicenseIconInactive}
                  alt=""
                />
              }
              iconPosition="start"
              label="Distributor's License Info"
              sx={{
                alignItems: "center",
                textTransform: "none",
                fontWeight: 400,
                justifyContent: "flex-start",
                minHeight: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: isSmallScreen ? "auto" : "100% !important",
                px: 2,
                mt: 1,
                mb: 1,
                py: 1,
              }}
            /> */}
          </Tabs>
        </Paper>
        <Paper
          elevation={1}
          sx={{
            borderRadius: 3,
            p: 3,
            overflow: isSmallScreen ? "hidden" : "auto",
            height: isSmallScreen ? "auto" : "100%",
            boxShadow: "none",
          }}
        >
          {tab === 0 && (
            <Box>
              <Typography fontSize={18} fontWeight={500} mb={4}>
                Company's Details
              </Typography>
              <Box display="flex" alignItems="center" gap={4} mb={4}>
               
                <Box sx={{display:"flex",alignItems:"center",justifyContent:"center", gap:2, position: 'relative'}}>
                  <label htmlFor="distributor-image-upload" style={{ cursor: 'pointer' }}>
                    <input
                      id="distributor-image-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                      disabled={uploading}
                    />
                    <Avatar
                      src={data.image || undefined}
                      sx={{ width: 64, height: 64, opacity: uploading ? 0.5 : 1 }}
                    />
                    {uploading && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 64,
                          height: 64,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: '50%',
                        }}
                      >
                        <CircularProgress size={32} />
                      </Box>
                    )}
                  </label>
                  <Typography fontSize={18} fontWeight={400}>
                    Distributor Image
                  </Typography>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Distributor ID (DID)
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.PM_ID}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Distributor Name
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Fcontact}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Owner's Legal Name
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Lcontact}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Client ID Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.ClientID}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Guarantor (Personal)
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Fcontact}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Primary Address
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Addr1} {data.D_Addr2}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    City
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_City}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    State
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_State}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Zip
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Zip}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Alternate Address
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_OtherAddr1 || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography fontSize={18} fontWeight={500} mb={4}>
                Contact Information
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Primary Phone Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Phone}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Alternate Phone Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_OtherPhone || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    FAX Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Fax}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    IT Person
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Lcontact}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    IT Person's Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Phone}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Primary Email Address
                  </Typography>
                  <Typography fontSize={13} color="primary.main" component="a" href={`mailto:${data.D_Email}`} target="_blank" rel="noopener noreferrer">
                    {data.D_Email}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Alternate Email Address
                  </Typography>
                  <Typography fontSize={13} color="primary.main" component="a" href={`mailto:${data.D_Email}`} target="_blank" rel="noopener noreferrer">
                    {data.D_Email || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Typography fontSize={18} fontWeight={500} mb={4}>
                Distributor's License Info
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Sales TAX Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.RJR_Whole_ID}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Primary License Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.RJR_Ship_ID}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Cigarette License Expiration Date
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.RJR_Descriptor}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Other License 1
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.PO_ShipTo1 || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Other License 1 Expiration Date
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.PO_ShipTo2 || "-"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Driver's License Expiration Date
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Zip}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    EIN Number
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.ClientID}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminProfile;
