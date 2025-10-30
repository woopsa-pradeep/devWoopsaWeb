import React, { useState } from "react";
import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  Typography,
  IconButton,
} from "@mui/material";
import Person from "@mui/icons-material/Person";
import { Logout } from "@mui/icons-material";
import { logout } from "../../../redux/slices/authSlice";
import { clearCart } from "../../../redux/slices/cartSlice";
import { RootState, useAppDispatch } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import { toggleTheme } from "../../../redux/slices/themeSlice";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { useSelector } from "react-redux";
import SwitchInput from "../../atoms/SwitchInput";
import { clearSalesCart } from "../../../redux/slices/salesCartSlice";
import { authLogout } from "../../../redux/apis/authAPIs";
import { clearDashboardData } from "../../../redux/slices/dashboardSlice";
import { clearSalesDashboardData } from "../../../redux/slices/salesDashboardSlice";

export default function AvatarMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useSelector((state: RootState) => state.theme.mode);
  const user = useSelector((state: RootState) => state.auth);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.log(error);
    }
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearSalesCart());
    dispatch(clearDashboardData());
    dispatch(clearSalesDashboardData());
    handleClose();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate(
      user?.role === "retailer"
        ? "/retailer/profile"
        : user?.role === "sales"
        ? "/sales/profile"
        : "/admin/profile"
    );
    handleClose();
  };

  // Only show user logo if it exists and is non-empty string, otherwise show Person Icon
  const hasLogo:any = typeof user?.logo === "string" && user.logo.trim() !== "";

  return (
    <Box>
      <IconButton onClick={handleClick} size="small" sx={{ ml: 1 }}>
        <Avatar
          alt="User Avatar"
          src={hasLogo ? user.logo || undefined : undefined}
          sx={{ width: 32, height: 32 }}
        >
          {!hasLogo && <Person fontSize="small" />}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
          },
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {/* Menu Items */}
        <MenuItem
          onClick={handleProfileClick}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Person fontSize="small" />
          <Typography fontSize={"14px"} fontWeight={400}>
            Profile
          </Typography>
        </MenuItem>
        <MenuItem
          disableRipple
          sx={{
            "&:hover": {
              backgroundColor: "transparent !important",
              color: "text.primary",
            },
            "&.Mui-focusVisible": {
              backgroundColor: "transparent !important",
              color: "text.primary",
            },
            justifyContent: "space-between",
            px: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {mode === "dark" ? (
              <Brightness7Icon fontSize="small" />
            ) : (
              <Brightness4Icon fontSize="small" />
            )}
            <Typography fontSize={14} fontWeight={400} color="text.primary">
              Mode
            </Typography>
          </Box>
          <SwitchInput
            sx={{ mb: 0 }}
            checked={mode === "dark"}
            onChange={() => dispatch(toggleTheme())}
            isShowLabel={false}
          />
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Logout fontSize="small" />
          <Typography fontSize={"14px"} fontWeight={400}>
            Logout
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
