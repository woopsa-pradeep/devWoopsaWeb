import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Paper } from "@mui/material";
import RouteHeaderTabs from "../../../component/organisms/driverManagement/RouteHeaderTabs";

function tabIndexFromPath(pathname: string): number {
  if (pathname.includes("/driver-management/drivers")) return 1;
  if (pathname.includes("/driver-management/vehicles")) return 2;
  if (pathname.includes("/driver-management/cancelled-orders")) return 3;
  if (pathname.includes("/driver-management/settings")) return 4;
  return 0;
}

const DriverManagementLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeTab = useMemo(() => tabIndexFromPath(location.pathname), [location.pathname]);
  const isCreateRoutePage =
    location.pathname.includes("create-route-automatic") ||
    location.pathname.includes("create-route-manual") ||
    location.pathname.includes("select-driver-vehicle") ||
    location.pathname.includes("route-optimization") ||
    location.pathname.includes("manual-route-optimize") ||
    location.pathname.includes("view-route");

  const onTabChange = (v: number) => {
    if (v === 0) navigate("/admin/driver-management");
    else if (v === 1) navigate("/admin/driver-management/drivers");
    else if (v === 2) navigate("/admin/driver-management/vehicles");
    else if (v === 3) navigate("/admin/driver-management/cancelled-orders");
    else navigate("/admin/driver-management/settings");
  };

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, pt: 2 }}>
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "none",
          px: { xs: 1, sm: 2 },
          py: 1,
          mb: isCreateRoutePage ? 1.5 : 2,
        }}
      >
        <RouteHeaderTabs value={routeTab} onChange={onTabChange} />
      </Paper>
      <Outlet />
    </Box>
  );
};

export default DriverManagementLayout;
