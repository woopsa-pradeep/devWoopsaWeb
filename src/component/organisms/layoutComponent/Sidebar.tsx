import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { getNavigationConfig, isParentActive } from "../../../config/navigationConfig";
import DashboardIcon from "../../../assets/dashboard.svg";
import OrderIcon from "../../../assets/icons/order.svg";
import PromoIcon from "../../../assets/icons/promo.svg";
import AccountReceivableIcon from "../../../assets/icons/account.svg";
import ContactIcon from "../../../assets/icons/contactUs.svg";
import ProductLicenceIcon from "../../../assets/Menu Icon.svg";
import CustomersIcon from "../../../assets/Menu Icon (6).svg";
import ProductsIcon from "../../../assets/Menu Icon (5).svg";
import VendorsIcon from "../../../assets/Menu Icon (1).svg";
import ReportsIcon from "../../../assets/Menu Icon (2).svg";
import PurchaseOrdersIcon from "../../../assets/Menu Icon (3).svg";
import BackOfficeIcon from "../../../assets/Menu Icon (4).svg";
import SettingsIcon from "../../../assets/Menu Icon (4).svg";
import TrackDevicesIcon from "../../../assets/trackdevice.svg";
import UserManagementIcon from "../../../assets/usermanagement.svg";
import PoliciesIcon from "../../../assets/policies.svg";
import OrderedItemsIcon from "../../../assets/orderItems.svg";
import OrderHistoryIcon from "../../../assets/orderHistory.svg";
import NotificationsIcon from "../../../assets/notification 7.svg";
import CalendarMonthIcon from "../../../assets/calender.svg";
import SupportTicketsIcon from "../../../assets/support.svg"; 
import ProductCatalogueIcon from "../../../assets/productCatalogue.svg";
import LinkIcon from "../../../assets/link.svg";
import RetailerRequestsIcon from "../../../assets/icons/licence-active.svg";
import EpickSettingIcon from "../../../assets/epick_setting.svg";
import InventoryIcon from "../../../assets/itemsGlobal.svg";
import ReportsAnalyticsIcon from "../../../assets/Menu Icon.svg";

const iconMap: { [key: string]: string } = {
  dashboard: DashboardIcon,
  order: OrderIcon,
  promo: PromoIcon,
  "tradeshow-management": PromoIcon,
  account: AccountReceivableIcon,
  contactUs: ContactIcon,
  file: ProductLicenceIcon,
  customers: CustomersIcon,
  products: ProductsIcon,
  orders: OrderIcon,
  vendors: VendorsIcon,
  reports: ReportsIcon,
  "purchase-orders": PurchaseOrdersIcon,
  "back-office": BackOfficeIcon,
  "track-login-devices": TrackDevicesIcon,
  settings: SettingsIcon,
  "user-management": UserManagementIcon,
  "terms-and-conditions": ProductLicenceIcon,
  "privacy-policy": ProductLicenceIcon,
  "disclaimer": ProductLicenceIcon,
  "return-policy": ProductLicenceIcon,
  policies: PoliciesIcon,
  "ordered-items": OrderedItemsIcon,
  "order-history": OrderHistoryIcon,
  retailers: CustomersIcon,
  notifications: NotificationsIcon,
  CalendarMonthIcon: CalendarMonthIcon,
  SupportTicketsIcon: SupportTicketsIcon,
  "product-catalog": ProductCatalogueIcon,
  "links": LinkIcon,
  "retailer-requests": RetailerRequestsIcon,
  "e-pick-settings": EpickSettingIcon,
  "inventory": InventoryIcon,
  "reports-analytics": ReportsAnalyticsIcon,
  "driver-management": UserManagementIcon,
  orderChecker: OrderIcon,
};

interface SidebarProps {
  variant: "horizontal" | "vertical";
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  variant,
  open = true,
  onClose,
  collapsed = false,
}) => {
  const isMobile = useMediaQuery("(max-width:1199px)");
  const location = useLocation();
  const mode = useSelector((state: RootState) => state.theme.mode);
  const { role, module, showTradeShow, priceBook } = useSelector((state: RootState) => state.auth);
  // Get role-based navigation config
  const salesNavigationConfig = getNavigationConfig(role).filter((item) => item.check === "sales");
  const filterByRoleModule = salesNavigationConfig.filter((item) =>
    ["Policies", "Trade Show", "Price Book"].includes(item.name) ||
    module?.some((moduleItem: any) => moduleItem.module === item.name && moduleItem?.view === true)
  );
  let navigationConfig = role === "sales" ? filterByRoleModule : getNavigationConfig(role);
  // For retailer and sales: show "Trade Show" tab only when showTradeShow is true
  if ((role === "retailer" || role === "sales") && !showTradeShow) {
    navigationConfig = navigationConfig.filter((item) => item.name !== "Trade Show");
  }
  // For sales and retailer: show Price Book nav only when priceBook is true
  if ((role === "sales" || role === "retailer") && priceBook !== true) {
    navigationConfig = navigationConfig.filter(
      (item) => item.name !== "Price Book" && item.name !== "Price Book Cart"
    );
  }
  const drawerContent = (
    <>
      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <List
        sx={{
          p: 0,
          display: variant === "horizontal" ? "flex" : "block",
          flexDirection: variant === "horizontal" ? "row" : "column",
        }}
      >
        {navigationConfig.map((item, index) => {
          const selected = isParentActive(location.pathname, item.path);
          return (
            <ListItem
              key={item.name}
              disablePadding
              sx={{
                width: variant === "horizontal" ? "auto" : "100%",
                display: "flex",
                justifyContent:
                  variant === "horizontal" ? "center" : "flex-start",
                marginTop: index === 0 ? isMobile ? 0 : 1 : 0,
                borderLeft: selected ? `3px solid ${mode === "dark" ? "#444" : "#3C7795"}` : "none",
                borderRadius: "0 10px 10px 0",
              }}
            >
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? "center" : "initial",
                  px: collapsed ? 2 : 3,
                  color: selected ? "primary.main" : "text.secondary",
                  flexDirection: "row",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed || variant === "horizontal" ? 0 : 2,
                    justifyContent: "center",
                    color: selected ? "primary.main" : "inherit",
                  }}
                >
                  <img 
                    src={iconMap[item.icon]} 
                    alt={item.name} 
                    style={{ width: 20, height: 20 }} 
                  />
                </ListItemIcon>
                {!collapsed && variant !== "horizontal" && (
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontWeight: selected ? 500 : 400,
                    }}
                    sx={{fontSize: "16px", fontWeight: selected ? 500 : 400}}
                  />
                )}

                {variant === "horizontal" && (
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: 12,
                      mt: 0.5,
                      textAlign: "center",
                      fontWeight: selected ? 500 : 400,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  if (variant === "horizontal") {
    return (
      <Box
        sx={{
          width: "100%",
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          height: 48,
          display: "flex",
          alignItems: "center",
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            maxWidth: "1500px",
            overflow:"auto",
            mx: "auto",
          }}
        >
          {navigationConfig.map((item) => {
            const selected = isParentActive(location.pathname, item.path);

            return (
              <Box
                key={item.name}
                component={Link}
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textDecoration: "none",
                  color: selected ? "primary.main" : "text.secondary",
                  fontWeight: selected ? 600 : 400,
                  bgcolor: selected ? "action.selected" : "transparent",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    color: "primary.main",
                  },
                }}
              >
                <img 
                  src={iconMap[item.icon]} 
                  alt={item.name} 
                  style={{ width: 20, height: 20 }} 
                />
                <Box
                  component="span"
                  sx={{
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  const drawerWidth = collapsed ? 65 : 260;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          top: isMobile ? 0 : 65,
          height: `${isMobile ? "100vh" : "calc(100% - 65px)"}`,
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: "width 0.3s ease-in-out",
          borderRight: `${mode === "dark" ? `1px solid #444`: "none"}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
