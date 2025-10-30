import React, { useState, useEffect } from "react";
import { Box, CssBaseline, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import Navbar from "../../component/organisms/layoutComponent/Navbar";
import Sidebar from "../../component/organisms/layoutComponent/Sidebar";
import SubHeader from "../../component/organisms/layoutComponent/SubHeader";

// Import icons
import companyIcon from '../../assets/bag.svg';
import accountIcon from '../../assets/bank.svg';
import phoneIcon from '../../assets/phoneCall.svg';
import locationIcon from '../../assets/location.svg';
import routeIcon from '../../assets/route.svg';
import stopIcon from '../../assets/flag.svg';
import UserIcon from '../../assets/icons/user_1.svg';

const FULL_DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 65;
const NAVBAR_HEIGHT = 65;
const DETAILS_BAR_HEIGHT = 53;

// Define the header data for different tabs

const AdminLayout: React.FC = () => {
  const isMobile = useMediaQuery("(max-width:1199px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState<number | null>(0);

  const layout = useSelector((state: RootState) => state.layout.layout);
  const isVertical = layout === "vertical";
  const auth = useSelector((state: RootState) => state.auth);
  const headerData = {
    0: [ // Store Details
      { icon: companyIcon, label: "Company's Name", value: auth.storeDetail?.C_Name || auth.storeDetail?.C_CoName || '-' },
      { icon: accountIcon, label: "Account Number", value: auth.storeDetail?.C_Number || '-' },
      { icon: locationIcon, label: "Business Address", value: `${auth.storeDetail?.C_Address || ''}, ${auth.storeDetail?.C_City || ''}, ${auth.storeDetail?.C_State || ''}` },
      { icon: phoneIcon, label: "Phone Number", value: auth.storeDetail?.C_Phone || '-' },
      { icon: routeIcon, label: "Routes", value: String(auth.storeDetail?.Routes?.[0]?.Route_Number || '-') },
      { icon: stopIcon, label: "Stops", value: String(auth.storeDetail?.Routes?.[0]?.Stop_Number || '-') },
      { icon: UserIcon, label: "Sales Rep", value: auth.storeDetail?.salesRep?.S_Desc || '-' },

    ],
    1: [ // Distributor Details
      { icon: companyIcon, label: "Distributor's Company", value: auth.wareHouseDetail?.[0]?.D_Name || '-' },
      { icon: locationIcon, label: "Business Address", value: `${auth.wareHouseDetail?.[0]?.D_Addr1 || ''}, ${auth.wareHouseDetail?.[0]?.D_City || ''}, ${auth.wareHouseDetail?.[0]?.D_State || ''}` },
      { icon: phoneIcon, label: "Contact Number", value: auth.wareHouseDetail?.[0]?.D_Phone || '-' },
    ],
  };
  const staticHeaderDataForDistributor = {
    0: [ // Distributor Details
      { icon: companyIcon, label: "Distributor's Company", value: auth.wareHouseDetail?.[0]?.D_Name || '-' },
      // { icon: stopIcon, label: "Sales Rep", value: auth.storeDetail?.salesRep?.S_Desc || '-' },
      // { icon: routeIcon, label: "Routes", value: String(auth.storeDetail?.Routes?.[0]?.Route_Number || '-') },
      // { icon: stopIcon, label: "Stops", value: String(auth.storeDetail?.Routes?.[0]?.Stop_Number || '-') },
      { icon: phoneIcon, label: "Phone Number", value: auth.wareHouseDetail?.[0]?.D_Phone || '-' },
      { icon: locationIcon, label: "Business Address", value: `${auth.wareHouseDetail?.[0]?.D_Addr1 || ''}, ${auth.wareHouseDetail?.[0]?.D_City || ''}, ${auth.wareHouseDetail?.[0]?.D_State || ''}` },
    ],
  };
  const staticHeaderDataForSales = {
    0: [ // Store Details
      { icon: companyIcon, label: "Company's Name", value: auth.storeDetail?.C_Name || auth.storeDetail?.C_CoName || '-' },
      { icon: accountIcon, label: "Account Number", value: auth.storeDetail?.C_Number || '-' },
      { icon: locationIcon, label: "Business Address", value: `${auth.storeDetail?.C_Address || ''}, ${auth.storeDetail?.C_City || ''}, ${auth.storeDetail?.C_State || ''}` },
      { icon: phoneIcon, label: "Phone Number", value: auth.storeDetail?.C_Phone || '-' },
      { icon: routeIcon, label: "Routes", value: String(auth.storeDetail?.Routes?.[0]?.Route_Number || '-') },
      { icon: stopIcon, label: "Stops", value: String(auth.storeDetail?.Routes?.[0]?.Stop_Number || '-') },
      { icon: UserIcon, label: "Sales Rep", value: auth.storeDetail?.salesRep?.S_Desc || '-' },

    ],
    1: [ // Wholesale Details
      { icon: companyIcon, label: "Distributor's Company", value: auth.wareHouseDetail?.[0]?.D_Name || '-' },
      { icon: locationIcon, label: "Business Address", value: `${auth.wareHouseDetail?.[0]?.D_Addr1 || ''}, ${auth.wareHouseDetail?.[0]?.D_City || ''}, ${auth.wareHouseDetail?.[0]?.D_State || ''}` },
      { icon: phoneIcon, label: "Contact Number", value: auth.wareHouseDetail?.[0]?.D_Phone || '-' }, 
    ],
  };
  
  // Get the header items based on the selected tab
  const currentHeaderItems = selectedTab !== null ? auth?.role === "distributor" ? staticHeaderDataForDistributor[selectedTab as keyof typeof staticHeaderDataForDistributor] || [] : auth?.role === "sales" ? staticHeaderDataForSales[selectedTab as keyof typeof staticHeaderDataForSales] || [] : headerData[selectedTab as keyof typeof headerData] || [] : [];

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleTabChange = (tab: number) => {
    if (tab === selectedTab && isDetailsOpen) {
      // If clicking the same tab and SubHeader is open, do nothing
      return;
    }
    // If SubHeader was closed, open it
    setIsDetailsOpen(true);
    setSelectedTab(tab);
  };

  const handleSubHeaderClose = () => {
    setIsDetailsOpen(false);
    setSelectedTab(null);
  };

  // Automatically open the drawer on desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
      setCollapsed(false);
    }
  }, [isMobile]);

  const getContentHeight = () => {
    const baseHeight = `calc(100vh - ${NAVBAR_HEIGHT}px`;
    if (isDetailsOpen && selectedTab !== null) {
      return `${baseHeight} - ${DETAILS_BAR_HEIGHT}px)`;
    }
    return `${baseHeight})`;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <Navbar 
        onDrawerToggle={handleDrawerToggle} 
        onTabChange={handleTabChange}
        selectedTab={selectedTab ?? -1}
        isDrawerOpen={isMobile ? mobileOpen : collapsed}
      />
      {isVertical && selectedTab !== null && (
        <Box sx={{
          pl: isMobile ? 0 : `${collapsed ? COLLAPSED_DRAWER_WIDTH : FULL_DRAWER_WIDTH}px`,
          transition: "padding-left 0.3s ease",
          borderLeft: isMobile ? 0 : 1,
          borderColor: "divider"
        }}>
          <SubHeader 
            isOpen={isDetailsOpen} 
            onClose={handleSubHeaderClose}
            items={currentHeaderItems}
          />
        </Box>
      )}
      {!isVertical && selectedTab !== null && (
        <SubHeader 
          isOpen={isDetailsOpen} 
          onClose={handleSubHeaderClose}
          items={currentHeaderItems}
        />
      )}

      {isVertical ? (
        <Box sx={{ display: "flex", flex: 1 }}>
          <Sidebar
            variant="vertical"
            open={mobileOpen || !isMobile}
            onClose={handleDrawerToggle}
            collapsed={!mobileOpen && !isMobile && collapsed}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: "auto",
              maxHeight: getContentHeight(),
              ml: isMobile
                ? 0
                : `${collapsed ? COLLAPSED_DRAWER_WIDTH : FULL_DRAWER_WIDTH}px`,
              width: isMobile
                ? "100%"
                : `calc(100% - ${
                    collapsed ? COLLAPSED_DRAWER_WIDTH : FULL_DRAWER_WIDTH
                  }px)`,
              transition: "margin-left 0.3s ease, width 0.3s ease",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      ) : (
        <>
          <Sidebar variant="horizontal" />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: "auto",
              maxHeight: getContentHeight(),
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Box sx={{ width: "100%", maxWidth: "1500px" }}>
              <Outlet />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AdminLayout;
