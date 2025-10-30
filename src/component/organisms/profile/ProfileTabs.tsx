import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, useTheme, useMediaQuery, Paper } from "@mui/material";
import CompanyDetails from "./CompanyDetails";
import ContactInformation from "./ContactInformation";
import CustomerLicense from "./CustomerLicense";
import CompanyIconActive from "../../../assets/bag.svg";
import CompanyIconInactive from "../../../assets/icons/bag-inactive.svg";
import ContactIconActive from "../../../assets/icons/phone-user-active.svg";
import ContactIconInactive from "../../../assets/icons/phone-user-inactive.svg";
import LicenseIconActive from "../../../assets/icons/licence-active.svg";
import LicenseIconInactive from "../../../assets/icons/licence-inactive.svg";
import { getRetailerProfile } from "../../../redux/apis/profileAPIs";
import { 
  ApiProfileResponse, 
  mapApiToCompanyDetails, 
  mapApiToContactData, 
  mapApiToLicenseData 
} from "../../../utils/profileDataMapper";

const ProfileTabs = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery("(max-width:1199px)");
    const [value, setValue] = useState(0);
    const [profileData, setProfileData] = useState<ApiProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
  
    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const data: any = await getRetailerProfile();
          setProfileData(data?.data as ApiProfileResponse);
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);

    // Map API data to component data
    const companyDetailsData = profileData ? mapApiToCompanyDetails(profileData) : null;
    const contactData = profileData ? mapApiToContactData(profileData) : null;
    const licenseData = profileData ? mapApiToLicenseData(profileData) : null;

  const tabStyle = {
    alignItems: "center",
    textTransform: "none",
    fontWeight: 400,
    justifyContent: "flex-start",
    minHeight: "auto", // Let height be defined by content
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: isSmallScreen ? "auto" : "100% !important",
    px: 2,
    mt: 1,
    mb: 1,
    py: 1,
    "&.Mui-selected": {
      color: theme.palette.primary.main,
      fontWeight: 500,
      borderLeft: isSmallScreen
        ? "none"
        : `4px solid ${theme.palette.primary.main}`,
      borderBottom: isSmallScreen
        ? `2px solid ${theme.palette.primary.main}`
        : "none",
    },
  };

  return (
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
          boxShadow: "none"
        }}
      >
        <Tabs
          orientation={isSmallScreen ? "horizontal" : "vertical"}
          variant="scrollable"
          value={value}
          onChange={handleChange}
          sx={{ py: isSmallScreen ? 0 : 2,  }}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          <Tab
            icon={
              <img
                src={value === 0 ? CompanyIconActive : CompanyIconInactive}
                alt=""
              />
            }
            iconPosition="start"
            label="Company's Details"
            sx={tabStyle}
          />
          <Tab
            icon={
              <img
                src={value === 1 ? ContactIconActive : ContactIconInactive}
                alt=""
              />
            }
            iconPosition="start"
            label="Contact Information"
            sx={tabStyle}
          />
          <Tab
            icon={
              <img
                src={value === 2 ? LicenseIconActive : LicenseIconInactive}
                alt=""
              />
            }
            iconPosition="start"
            label="License Info"
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
          boxShadow: "none",
          overflow: isSmallScreen ? "hidden" : "auto",
          height: isSmallScreen ? "auto" : "100%",
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            Loading...
          </Box>
        ) : (
          <>
            {value === 0 && companyDetailsData && <CompanyDetails data={companyDetailsData} />}
            {value === 1 && contactData && <ContactInformation data={contactData} />}
            {value === 2 && licenseData && <CustomerLicense data={licenseData} />}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ProfileTabs;
