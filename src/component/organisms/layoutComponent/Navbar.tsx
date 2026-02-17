import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Badge,
  TextField,
  Theme
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useSelector } from "react-redux";
import logo from "../../../assets/Vector.svg";
import { RootState } from "../../../redux/store";
import MenuIcon from "@mui/icons-material/Menu";
import { BalanceIcon, CartIcon } from "../../icons/CustomIcons";
import AvatarMenu from "./AvatarMenu";
import NotificationDrawer from "../../molecules/NotificationDrawer";
import CustomSearchDropdown from "../../atoms/CustomSearchDropdown";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch } from "../../../redux/store";
import { fetchCartItems } from "../../../redux/slices/cartSlice";
import { fetchSalesCartItems } from "../../../redux/slices/salesCartSlice";
import { getCustomerList, setSalesSession } from "../../../redux/apis/sales/profileApis";
import { setSelectedCustomer, updateSessionCustomer, setMultipleStores, logout, setAuthFromSwitchStore, setShowTradeShow } from "../../../redux/slices/authSlice";
import { fetchNotificationCount } from "../../../redux/slices/notificationSlice";
import { hasMultipleStore, switchStore } from "../../../redux/apis/retailer/dashboardApis";
import { authLogout } from "../../../redux/apis/authAPIs";
import { clearCart } from "../../../redux/slices/cartSlice";
import { clearSalesCart } from "../../../redux/slices/salesCartSlice";
import { clearDashboardData } from "../../../redux/slices/dashboardSlice";
import { clearSalesDashboardData } from "../../../redux/slices/salesDashboardSlice";
import { validateCartForCheckout } from "../../../utils/cartValidationUtils";
import Story from "../../../pages/admin/story/Story";
import Stories from "../../../pages/retailer/stories/Stories";
import { getStories } from "../../../redux/apis/retailer/stories";
import ViewStory from "../../../assets/ViewStory.svg";
  // import AddIcon from '../../../assets/AddStory.svg'
// import { showErrorToast } from "../../../utils/toastUtils";

interface NavbarProps {
  onDrawerToggle?: () => void;
  onTabChange?: (tab: number) => void;
  selectedTab: number;
  isDrawerOpen: boolean;
  }

const Navbar: React.FC<NavbarProps> = ({ onDrawerToggle, onTabChange, selectedTab, isDrawerOpen }) => {
  const mode = useSelector((state: RootState) => state.theme.mode);
  const layout = useSelector((state: RootState) => state.layout.layout);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const auth = useSelector((state: RootState) => state.auth);
  const cart = useSelector((state: RootState) => auth?.role === "retailer" ? state.cart : state.salesCart);
  const retailerTradeShowCart = useSelector((state: RootState) => state.retailerTradeShowCart);
  const salesTradeShowCart = useSelector((state: RootState) => state.salesTradeShowCart);
  const notification = useSelector((state: RootState) => state.notification);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnTradeShowRoute = location.pathname.startsWith("/retailer/trade-show");
  const isOnSalesTradeShowRoute = location.pathname.startsWith("/sales/trade-show");
  const retailerCartCount = isOnTradeShowRoute ? retailerTradeShowCart.count : cart.count;
  const salesCartCount = isOnSalesTradeShowRoute ? salesTradeShowCart.count : cart.count;
  const displayCartCount = auth?.role === "retailer" ? retailerCartCount : auth?.role === "sales" ? salesCartCount : cart.count;
  const dispatch = useAppDispatch();
  const currentCustomerId = useSelector((state: RootState) => state.auth.isSessionActive?.currentCustomerId);
  // State for customer list and loading
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [isCustomerListLoaded, setIsCustomerListLoaded] = useState(false);
  const [hasUserManuallySelected, setHasUserManuallySelected] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storiesModalOpen, setStoriesModalOpen] = useState(false);
  const [storiesCount, setStoriesCount] = useState(0);

  // Function to fetch stories count
  const fetchStoriesCount = async () => {
    try {
      const response = await getStories();
      const stories = (response as any)?.data || response || [];
      const activeStories = stories.filter((story: any) => story.isActive);
      setStoriesCount(activeStories.length);
    } catch (error) {
      console.error('Error fetching stories count:', error);
      setStoriesCount(0);
    }
  };

  // Fetch cart items and notification count on component mount
  // Only fetch regular retailer cart when NOT on trade show route (avoid conflict with trade show cart)
  useEffect(() => {
    if (auth?.role === "retailer") {
      if (!isOnTradeShowRoute) {
        dispatch(fetchCartItems());
      }
      // Fetch stories count
      fetchStoriesCount();
      
      // Check for multiple stores after login or after store switch
      // Get emailPhone from auth state or localStorage (for after page reload)
      const emailPhone = auth?.emailPhone || localStorage.getItem('emailPhone');
      if (auth?.isAuthenticated && emailPhone) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(emailPhone);
        if (isEmail) {
          // Always call hasMultipleStore to refresh the store list
          // This ensures dropdown is visible after store switch
          hasMultipleStore(emailPhone).then((response: any) => {
            if (response?.success && response?.data) {
              const hasMultiple = response.data.hasMultipleStore;
              const stores = response.data.stores || [];
              dispatch(setMultipleStores({
                hasMultipleStore: hasMultiple,
                stores: stores
              }));
            } else {
              // If response is not successful, clear the stores
              dispatch(setMultipleStores({
                hasMultipleStore: false,
                stores: []
              }));
            }
          }).catch((error) => {
            console.error('Error fetching multiple stores:', error);
            // On error, don't clear stores - keep existing state
          });
        }
      }
    } else if (auth?.role === "sales") {
      if (!isOnSalesTradeShowRoute) {
        dispatch(fetchSalesCartItems());
      }
    }
    
    // Fetch notification count for retailer users only
    if (auth?.role === "retailer") {
      dispatch(fetchNotificationCount());
    }
  }, [dispatch, auth?.role, auth?.isAuthenticated, auth?.emailPhone, isOnTradeShowRoute, isOnSalesTradeShowRoute]);

  // Fetch customer list for sales users
  useEffect(() => {
    if (auth?.role === "sales") {
      setCustomerLoading(true);
      getCustomerList().then((res: any) => {
        const customers = res?.data?.data || [];
        setCustomerList(customers);
        setIsCustomerListLoaded(true);
        
        // If currentCustomerId exists, find and select that customer
        if (currentCustomerId) {
          const currentCustomer = customers.find((customer: any) => customer.C_Number.toString() === currentCustomerId.toString());
          if (currentCustomer) {
            dispatch(setSelectedCustomer(currentCustomer));
            
            // Update store details for the current customer
            setSalesSession(currentCustomer.C_Number.toString()).then((sessionResponse: any) => {
              if (sessionResponse && typeof sessionResponse === 'object' && 'data' in sessionResponse) {
                const responseData = sessionResponse as any;
                const sessionData = responseData.data?.data ?? responseData.data;
                if (sessionData) {
                  const storeDetails = sessionData;
                  dispatch({
                    type: 'auth/updateStoreDetails',
                    payload: {
                      C_CoName: storeDetails.C_CoName,
                      C_Name: storeDetails.C_Name,
                      C_Number: storeDetails.C_Number,
                      C_Address: storeDetails.C_Address,
                      C_City: storeDetails.C_City,
                      C_State: storeDetails.C_State,
                      C_Phone: storeDetails.C_Phone,
                      LastBalance: storeDetails.LastBalance,
                      C_OrderDay: storeDetails.C_OrderDay,
                      Routes: storeDetails.Routes,
                      salesRep: storeDetails.salesRep,
                      C_Zip: storeDetails.C_Zip,
                      Jurisdiction_State: storeDetails.Jurisdiction_State,
                    }
                  });
                  if (typeof storeDetails.showTradeShow === 'boolean') {
                    dispatch(setShowTradeShow(storeDetails.showTradeShow));
                  }
                }
              }
            }).catch((error: any) => {
              console.error('Error updating store details for initial customer:', error);
            });
          }
        }
        
        setCustomerLoading(false);
      }).catch((err: any) => {
        console.log(err);
        setCustomerLoading(false);
        setIsCustomerListLoaded(true);
      });
    }
  }, [auth?.role, dispatch, currentCustomerId]);

  // Handle customer selection when currentCustomerId changes after customer list is loaded
  useEffect(() => {
    if (auth?.role === "sales" && currentCustomerId && isCustomerListLoaded && customerList.length > 0 && !hasUserManuallySelected) {
      const currentCustomer = customerList.find((customer: any) => customer.C_Number.toString() === currentCustomerId.toString());
      if (currentCustomer && (!auth.selectedCustomer || auth.selectedCustomer.C_Number.toString() !== currentCustomerId.toString())) {
        dispatch(setSelectedCustomer(currentCustomer));
        
        // Update store details for the auto-selected customer
        setSalesSession(currentCustomer.C_Number.toString()).then((sessionResponse: any) => {
          if (sessionResponse && typeof sessionResponse === 'object' && 'data' in sessionResponse) {
            const responseData = sessionResponse as any;
            const sessionData = responseData.data?.data ?? responseData.data;
            if (sessionData) {
              const storeDetails = sessionData;
              dispatch({
                type: 'auth/updateStoreDetails',
                payload: {
                  C_CoName: storeDetails.C_CoName,
                  C_Name: storeDetails.C_Name,
                  C_Number: storeDetails.C_Number,
                  C_Address: storeDetails.C_Address,
                  C_City: storeDetails.C_City,
                  C_State: storeDetails.C_State,
                  C_Phone: storeDetails.C_Phone,
                  LastBalance: storeDetails.LastBalance,
                  C_OrderDay: storeDetails.C_OrderDay,
                  Routes: storeDetails.Routes,
                  salesRep: storeDetails.salesRep,
                  C_Zip: storeDetails.C_Zip,
                  Jurisdiction_State: storeDetails.Jurisdiction_State,
                }
              });
              if (typeof storeDetails.showTradeShow === 'boolean') {
                dispatch(setShowTradeShow(storeDetails.showTradeShow));
              }
            }
          }
        }).catch((error: any) => {
          console.error('Error updating store details for auto-selected customer:', error);
        });
      }
    }
  }, [currentCustomerId, isCustomerListLoaded, customerList, auth?.role, auth.selectedCustomer, hasUserManuallySelected, dispatch]);

  // Reset manual selection flag when currentCustomerId changes (new login)
  useEffect(() => {
    if (currentCustomerId) {
      setHasUserManuallySelected(false);
    }
  }, [currentCustomerId]);

  // Handle store selection for retailer
  const handleStoreSelect = async (selectedOption: any) => {
    if (selectedOption && auth?.role === "retailer") {
      try {
        const selectedStore = auth.stores?.find(store => store.C_Number.toString() === selectedOption.value);
        if (!selectedStore) {
          console.error('Selected store not found in stores list');
          return;
        }
        
        // Check if user is trying to switch to the same store
        const currentStoreNumber = auth.storeDetail?.C_Number;
        const selectedStoreNumber = selectedStore.C_Number;
        
        console.log('Store switch attempt:', {
          currentStoreNumber,
          selectedStoreNumber,
          currentStoreString: currentStoreNumber?.toString(),
          selectedStoreString: selectedStoreNumber.toString()
        });
        
        // Compare as numbers or strings to handle type mismatches
        if (currentStoreNumber && (
          currentStoreNumber.toString() === selectedStoreNumber.toString() ||
          Number(currentStoreNumber) === Number(selectedStoreNumber)
        )) {
          // Already on this store, no need to switch
          console.log('Already on selected store, skipping switch');
          return;
        }
        
        // Save emailPhone before logout (it will be cleared)
        const savedEmailPhone = auth.emailPhone || localStorage.getItem('emailPhone');
        
        if (!savedEmailPhone) {
          console.error('EmailPhone not found, cannot switch store');
          return;
        }
        
        console.log('Calling switchStore API with retailerId:', selectedStore.C_Number.toString());
        
        // Call switchStore API
        const switchResponse: any = await switchStore(selectedStore.C_Number.toString());
        
        console.log('SwitchStore API response:', switchResponse);
        
        // Check if switch was successful
        if (!switchResponse?.success) {
          console.error('Switch store API failed - success is false:', switchResponse);
          return;
        }
        
        if (!switchResponse?.data) {
          console.error('Switch store API failed - no data in response:', switchResponse);
          return;
        }
        
        // Call logout function
        try {
          await authLogout();
        } catch (error) {
          console.log('Logout error (non-critical):', error);
        }
        
        // Clear Redux state
        dispatch(logout());
        dispatch(clearCart());
        dispatch(clearSalesCart());
        dispatch(clearDashboardData());
        dispatch(clearSalesDashboardData());
        
        // Handle switchStore response like verifyOtp (only for retailer)
        // The response structure should be: { success: true, data: { token, role, wareHouseDetail, storeDetail, logo } }
        const authData = switchResponse.data;
        console.log('Setting auth from switchStore response:', { 
          hasToken: !!authData.token, 
          hasStoreDetail: !!authData.storeDetail,
          storeDetailCNumber: authData.storeDetail?.C_Number,
          authDataKeys: Object.keys(authData || {})
        });
        
        // Validate required fields
        if (!authData.token) {
          console.error('SwitchStore response missing token');
          return;
        }
        
        if (!authData.storeDetail) {
          console.error('SwitchStore response missing storeDetail');
          return;
        }
        
        // Set auth state from switchStore response (same as verifyOtp) - sets token and auth data once
        dispatch(setAuthFromSwitchStore({ authData, emailPhone: savedEmailPhone }));
        
        // Small delay to ensure localStorage and Redux state are updated before reload
        setTimeout(() => {
          console.log('Reloading page after store switch...');
          window.location.reload();
        }, 100);
      } catch (error) {
        console.error('Error switching store:', error);
      }
    }
  };

  // Handle customer selection
  const handleCustomerSelect = async (selectedOption: any) => {
    if (selectedOption) {
      try {
        // Find the customer object from the list
        const selectedCustomer = customerList?.find(customer => customer.C_Number.toString() === selectedOption.value);
        
        if (selectedCustomer) {
          // Set flag to indicate user has manually selected a customer
          setHasUserManuallySelected(true);
          
          // Call setSalesSession API
          const sessionResponse = await setSalesSession(selectedCustomer?.C_Number.toString());
          
          // Update session state in Redux
          dispatch(updateSessionCustomer(selectedCustomer.C_Number.toString()));
          
          // Store selected customer in Redux
          dispatch(setSelectedCustomer(selectedCustomer));
          
          // Update store details with the response from setSalesSession
          if (sessionResponse && typeof sessionResponse === 'object' && 'data' in sessionResponse) {
            const responseData = sessionResponse as any;
            const sessionData = responseData.data?.data ?? responseData.data;
            if (sessionData) {
              const storeDetails = sessionData;
              dispatch({
                type: 'auth/updateStoreDetails',
                payload: {
                  C_CoName: storeDetails.C_CoName,
                  C_Name: storeDetails.C_Name,
                  C_Number: storeDetails.C_Number,
                  C_Address: storeDetails.C_Address,
                  C_City: storeDetails.C_City,
                  C_State: storeDetails.C_State,
                  C_Phone: storeDetails.C_Phone,
                  LastBalance: Number(storeDetails.LastBalance),
                  C_OrderDay: storeDetails.C_OrderDay,
                  Routes: storeDetails.Routes,
                  salesRep: storeDetails.salesRep,
                  C_Zip: storeDetails.C_Zip,
                  Jurisdiction_State: storeDetails.Jurisdiction_State,
                }
              });
              if (typeof storeDetails.showTradeShow === 'boolean') {
                dispatch(setShowTradeShow(storeDetails.showTradeShow));
              }
            }
          }
          
          // When sales user changes retailer, redirect to dashboard
          if (auth?.role === "sales") {
            navigate("/sales/dashboard");
          }
        }else{

          setSalesSession(selectedCustomer .C_Number.toString()).then((sessionResponse: any) => {

            if (sessionResponse && typeof sessionResponse === 'object' && 'data' in sessionResponse) {

              const responseData = sessionResponse as any;

              const sessionData = responseData.data?.data ?? responseData.data;
              if (sessionData) {

                const storeDetails = sessionData;

                dispatch({

                  type: 'auth/updateStoreDetails',

                  payload: {

                    C_CoName: storeDetails.C_CoName,

                    C_Name: storeDetails.C_Name,

                    C_Number: storeDetails.C_Number,

                    C_Address: storeDetails.C_Address,

                    C_City: storeDetails.C_City,

                    C_State: storeDetails.C_State,

                    C_Phone: storeDetails.C_Phone,

                    LastBalance: storeDetails.LastBalance,

                    C_OrderDay: storeDetails.C_OrderDay, 

                    Routes: storeDetails.Routes,

                    salesRep: storeDetails.salesRep,

                    C_Zip: storeDetails.C_Zip,

                    Jurisdiction_State: storeDetails.Jurisdiction_State,

                  }

                });
                if (typeof storeDetails.showTradeShow === 'boolean') {
                  dispatch(setShowTradeShow(storeDetails.showTradeShow));
                }
              }

            }

          }).catch((error: any) => {

            console.error('Error updating store details for initial customer:', error);

          });


        }
      } catch (error) {
        console.error('Error setting sales session:', error);
      }
    }
  };

  // Convert customer list to dropdown options
  const customerOptions = customerList?.map(customer => ({
    label: customer.C_Name,
    value: customer.C_Number.toString()
  }));

  // Convert store list to dropdown options
  const storeOptions = auth.stores?.map(store => ({
    label: store.C_CoName,
    value: store.C_Number.toString()
  })) || [];

  // Get selected store option
  // Use selectedStore if available, otherwise find current store from storeDetail
  const selectedStoreOption = auth.selectedStore ? {
    label: auth.selectedStore.C_CoName,
    value: auth.selectedStore.C_Number.toString()
  } : (auth.storeDetail?.C_Number && auth.stores && auth.stores.length > 0) ? (() => {
    const currentStore = auth.stores.find(store => 
      store.C_Number.toString() === auth.storeDetail?.C_Number?.toString()
    );
    return currentStore ? {
      label: currentStore.C_CoName,
      value: currentStore.C_Number.toString()
    } : undefined;
  })() : undefined;

  // // Custom filter function for Autocomplete to search from any position
  // const filterOptions = (options: any[], { inputValue }: { inputValue: string }) => {
  //   if (!inputValue || inputValue.trim() === '') return options;
    
  //   const searchTerm = inputValue.toLowerCase().trim();
  //   return options.filter(option => 
  //     option.label.toLowerCase().includes(searchTerm)
  //   );
  // };

  // Get selected customer option
  const selectedCustomerOption = auth.selectedCustomer ? {
    label: auth.selectedCustomer.C_Name,
    value: auth.selectedCustomer.C_Number.toString()
  } : (currentCustomerId && isCustomerListLoaded && customerList.length > 0) ? customerOptions?.find(option => option.value === currentCustomerId.toString()) : undefined;

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Static tabs configuration
  const staticTabs = [
    { label: "Store Details", value: 0 },
    { label: "Distributor Details", value: 1 }
  ];
  const staticTabsForDistributor = [
    { label: "Distributor Details", value: 0 }
  ];

  const staticTabsForSales = [
    { label: "Store Details", value: 0 },
    { label: "Distributor Details", value: 1 }
  ];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (value?: number) => {
    setAnchorEl(null);
    if (typeof value === 'number') {
      onTabChange?.(value);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    onTabChange?.(newValue);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: "text.primary",
        boxShadow: "none",
      }}
      elevation={1}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          // pl: 0.3,
          minHeight: 65,
          gap: isMobile ? 0 : 2,
          position: "relative",
          "&:after": {
            content: '""',
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: "1px",
            backgroundColor: mode === "dark" ? "#444" : "rgba(0, 0, 0, 0.12)",
            zIndex: 1,
          },
        }}
        style={{ backgroundColor: theme.palette.background.paper }}
      >
        {/* Left Section */}
        <Box
          width={isTablet ? "auto" : "236px"}
          sx={{
            height: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {!isTablet && (
            <Box
              component="img"
              src={logo}
              alt="Woopsa"
              sx={{
                height: 30,
              }}
            />
          )}

          {layout === "vertical" && (
            <IconButton
              color="primary"
              edge="start"
              onClick={onDrawerToggle}
              sx={{
                border: "1px solid",
                borderRadius: "8px",
                padding: 0.5,
                height: 32,
                width: 32,
                ml: isTablet ? 0.3 : 0,
              }}
            >
              {isDrawerOpen ?   <MoreVertIcon sx={{ fontSize: 20 }} /> :<MenuIcon sx={{ fontSize: 20 }} />}  
            </IconButton>
          )}
        </Box>

        {/* Tabs/Menu Section */}
        <Box sx={{ position: "relative", flex: 1, ml: 1 }}>
          {isMobile ? (
            // Mobile Menu View
            <Box display="flex" alignItems="center" justifyContent="flex-end" width="100%" sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton
                onClick={handleClick}
                sx={{
                  color: "primary.main",
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    minWidth: 180,
                    mt: 1,
                  }
                }}
              >
                {(auth?.role === "distributor" ? staticTabsForDistributor : auth?.role === "sales" ? staticTabsForSales : staticTabs).map((tab) => (
                  <MenuItem 
                    key={tab.value}
                    onClick={() => handleClose(tab.value)}
                    selected={selectedTab === tab.value}
                    sx={{
                      fontSize: "14px",
                      py: 1,
                    }}
                  >
                    {tab.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          ) : (
            // Desktop/Tablet Tab View
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant="standard"
              sx={{
                minHeight: 65,
                zIndex: 1200,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 400,
                  minHeight: 65,
                  px: { xs: 2, md: 3 },
                  minWidth: { xs: "auto", md: 100 },
                  color: "text.secondary",
                  "&.Mui-selected": {
                    color: "primary.main",
                    fontWeight: 500,
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                  zIndex: 1,
                },
              }}
            >
              {(auth?.role === "distributor" ? staticTabsForDistributor : auth?.role === "sales" && auth?.module?.some((moduleItem: any) => moduleItem.module === "Dashboard" && moduleItem?.view === true) ? staticTabsForSales : auth?.role === "retailer" ? staticTabs : []).map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  sx={{
                    "&.Mui-selected": {
                      fontWeight: 500,
                      zIndex: 1200,
                    },
                  }}
                />
              ))}
            </Tabs>
          )}
        </Box>

        {/* Right Section */}
        <Box
          display="flex"
          alignItems="center"
          gap={isMobile ? 0 : 1}
          sx={{
            ml: "auto",
            // "& > *": {
            //   display: { xs: "none", sm: "flex" },
            // },
            // "& > :last-child": {
            //   display: "flex", // Always show AvatarMenu
            // },
          }}
        >
          {/* Balance Box */}
          {(
            // Show for: 
            // - Not distributor: show.
            // - For "sales": only show if Dashboard module present with view=true.
            // - Never for distributor.
            auth?.role !== "distributor" && (
              auth?.role !== "sales" ||
              (
                Array.isArray(auth?.module) &&
                auth?.module.some(
                  (moduleItem: any) =>
                    moduleItem.module === "Dashboard" && moduleItem?.view === true
                )
              )
            )
          ) && (
            <>
              <Box
                sx={{
                  height: 40,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: "18px",
                  pl: 0.5,
                  pr: 2,
                  bgcolor: "background.paper",
                  display: { xs: "none", lg: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(17, 197, 17, 0.2)"
                          : "rgba(17, 197, 17, 0.2)",
                      borderRadius: "50%",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BalanceIcon />
                  </Box>
                  <Typography fontSize={"14px"} fontWeight={400} color="text.secondary">
                    Outstanding balance <span style={{ fontWeight: 600, color: "primary.secondary" }}>${ Number(auth?.storeDetail?.LastBalance).toFixed(2) || '0'}</span>
                  </Typography>
                </Box>
              </Box>
              {/* Days to Order Box */}
              <Box
                sx={{
                  height: 40,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: "20px",
                  pl: 0.5,
                  pr: 2,
                  bgcolor: "background.paper",
                  display: { xs: "none", lg: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {(() => {
                    // 0 = N/A, 8 = Other, 1=Monday ... 7=Sunday
                    const orderDayRaw = auth?.storeDetail?.C_OrderDay;
                    const orderDay = typeof orderDayRaw === 'number'
                      ? orderDayRaw
                      : parseInt(orderDayRaw || '0', 10);

                    let daysLeft: number | string = 'N/A';
                    let isOrderDayToday = false;
                    if (orderDay === 0) {
                      daysLeft = 'NA';
                    } else if (orderDay === 8) {
                      daysLeft = 'OT';
                    } else if (orderDay >= 1 && orderDay <= 7) {
                      const today = new Date();
                      const todayDay = today.getDay(); // 0=Sunday, ..., 6=Saturday
                      const ourTodayDay = todayDay === 0 ? 7 : todayDay;
                      const diff = (orderDay - ourTodayDay + 7) % 7;
                      if (diff === 0) {
                        isOrderDayToday = true;
                      } else {
                        daysLeft = diff;
                      }
                    }

                    // Determine color based on daysLeft
                    let borderColor = "#FFCD1B"; // default yellow
                    let bgColor = "transparent";
                    if (typeof daysLeft === "number") {
                      if (daysLeft >= 5 && daysLeft <= 7) {
                        borderColor = "#11C511"; // green
                        bgColor = "rgba(17, 197, 17, 0.15)";
                      } else if (daysLeft >= 3 && daysLeft <= 4) {
                        borderColor = "#FFCD1B"; // yellow
                        bgColor = "rgba(255, 205, 27, 0.15)";
                      } else if (daysLeft === 2) {
                        borderColor = "#FF9800"; // orange
                        bgColor = "rgba(255, 152, 0, 0.15)";
                      } else if (daysLeft <= 1) {
                        borderColor = "#FF3333"; // red
                        bgColor = "rgba(255, 51, 51, 0.15)";
                      }
                    } else if (isOrderDayToday) {
                      borderColor = "#11C511";
                      bgColor = "rgba(17, 197, 17, 0.15)";
                    }

                    // Map orderDay to day name
                    const dayNames = {
                      1: "Monday",
                      2: "Tuesday",
                      3: "Wednesday",
                      4: "Thursday",
                      5: "Friday",
                      6: "Saturday",
                      7: "Sunday"
                    };
                    let orderDayText = "";
                    if (orderDay >= 1 && orderDay <= 7) {
                      orderDayText = dayNames[orderDay as keyof typeof dayNames];
                    } else if (orderDay === 8) {
                      orderDayText = "Other";
                    } else {
                      orderDayText = "";
                    }

                    return (
                      <>
                        {!isOrderDayToday && <Box
                          sx={{
                            border: `2px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            borderRadius: "50%",
                            minWidth: 30,
                            minHeight: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "text.secondary",
                            lineHeight: 1,
                          }}
                        >
                            {daysLeft}
                        </Box>}
                        <Typography fontSize={"14px"} fontWeight={400} color="text.secondary" ml={isOrderDayToday ? 1 : 0}>
                          {isOrderDayToday
                            ? `  Today is your order day.`
                            : orderDay === 0
                              ? "No order day set."
                              : orderDay === 8
                                ? "Order day: Other."
                                : daysLeft !== 'N/A'
                                  ? `Days to go to place the order${orderDayText ? ` (${orderDayText})` : ""}.`
                                  : "Days to go to place the order."
                          }
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
              </Box>
            </>
          )}
          {auth?.role === "sales" && auth?.module?.some((moduleItem: any) => moduleItem.module === "Dashboard" && moduleItem?.view === true) && (
            <Box sx={{ minWidth: { xs: 150, md: 200 } }}>
              {isCustomerListLoaded ? (
                <CustomSearchDropdown
                options={customerOptions}
                value={selectedCustomerOption || null}
                onChange={handleCustomerSelect}
                placeholder="Select Retailer"
                loading={customerLoading}
              />
              ) : (
                <TextField 
                  placeholder="Loading..."
                  size="small"
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "18px",
                      height: 35,
                      fontSize: "12px",
                      backgroundColor: (theme: Theme) => theme.palette.primary.main,
                      color: "#fff",
                      "& input": {
                        color: "#fff",
                        "&::placeholder": {
                          color: "#fff",
                          opacity: 0.7
                        }
                      },
                      "& fieldset": {
                        border: "1px solid",
                        borderColor: (theme: Theme) => theme.palette.primary.main,
                      }
                    }
                  }}
                />
              )}
            </Box>
          )}
          {/* Store Dropdown for Retailer with Multiple Stores */}
          {auth?.role === "retailer" && auth?.hasMultipleStore && storeOptions.length > 0 && (
            <Box sx={{ minWidth: { xs: 150, md: 200 } }}>
              <CustomSearchDropdown
                options={storeOptions}
                value={selectedStoreOption || null}
                onChange={handleStoreSelect}
                placeholder="Select Store"
                loading={false}
              />
            </Box>
          )}
          {/* Notification Icon */}
          {auth?.role === "retailer" && (
            <IconButton 
              color="primary" 
              onClick={handleNotificationClick}
              sx={{ 
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(60, 119, 149, 0.08)',
                },
              }}
            >
              <Badge
                badgeContent={notification?.unreadCount || 0}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '18px',
                    minWidth: '18px',
                    borderRadius: '9px',
                    fontWeight: 600,
                  },
                }}
              >
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          )}

          {/* Stories Icon - Only for Retailer */}
          {auth?.role === "retailer" && (
            <IconButton 
              color="primary" 
              onClick={() => setStoriesModalOpen(true)}
              sx={{ 
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(60, 119, 149, 0.08)',
                },
              }}
            >
              <Badge
                badgeContent={storiesCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '18px',
                    minWidth: '18px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    display: storiesCount > 0 ? 'flex' : 'none',
                  },
                }}
              >
                <img src={ViewStory} alt="View Stories" style={{ width: 24, height: 24 }} />
              </Badge>
            </IconButton>
          )}

          {/* Add Story Button - Only for Distributor */}
        

          {/* Cart Icon */}
          {auth?.role !== "distributor" && (() => {
            // For sales users, check if they have the "Orders" module with view permission
            if (auth?.role === "sales") {
              const hasOrderModule = auth?.module?.some(
                (moduleItem: any) => moduleItem.module === "Orders" && moduleItem?.view === true
              );
              // Hide cart if sales user doesn't have Order module
              if (!hasOrderModule) {
                return null;
              }
            }
            
            // Check if user is already on a cart page (regular cart or trade show cart)
            const isOnCartPage = auth?.role === "retailer"
              ? location.pathname === "/retailer/cart" || location.pathname.includes("/retailer/trade-show/cart")
              : location.pathname.includes('/sales/cart') || location.pathname.includes('/sales/return-cart') || location.pathname.includes('/sales/trade-show/cart');

            return (
              <IconButton
                color="primary"
                onClick={() => {
                  if (auth?.role === "retailer" && isOnTradeShowRoute) {
                    navigate("/retailer/trade-show/cart");
                    return;
                  }
                  if (auth?.role === "sales" && isOnSalesTradeShowRoute) {
                    navigate("/sales/trade-show/cart");
                    return;
                  }
                  // Transform cart items to match the validation function interface (regular cart)
                  const cartItemsForValidation = cart.items.map((item: any) => ({
                    id: item.Description,
                    quantity: item.Product.Qty,
                    price: item.price,
                    priceWithTax: item.priceWithTax || item.price,
                    hasProductLimit: item.hasProductLimit || false,
                    productLimit: item.productLimit || null
                  }));

                  const validationData = {
                    userLimitMinOrderAmount: cart.userLimitMinOrderAmount,
                    totalAmountWithTax: cart.totalAmountWithTax,
                    totalAmount: cart.totalAmount
                  };

                  if (validateCartForCheckout(cartItemsForValidation, validationData)) {
                    if (auth?.role === "retailer") {
                      navigate('/retailer/cart');
                    } else if (auth?.role === "sales") {
                      const isOnReturnOrderPage = location.pathname.includes('/sales/return-order');
                      navigate(isOnReturnOrderPage ? '/sales/return-cart' : '/sales/cart');
                    } else {
                      navigate('/sales/cart');
                    }
                  }
                }}
                disabled={isOnCartPage}
                sx={{
                  opacity: isOnCartPage ? 0.5 : 1,
                  cursor: isOnCartPage ? 'not-allowed' : 'pointer',
                }}
              >
                <CartIcon count={displayCartCount} />
              </IconButton>
            );
          })()}

          <AvatarMenu />
        </Box>
      </Toolbar>

      {/* Notification Drawer */}
      {auth?.role === "retailer" && (
        <NotificationDrawer
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
        />
      )}

      {/* Story Modal */}
      {auth?.role === "distributor" && (
        <Story
          open={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
        />
      )}

      {/* Stories Modal */}
      {auth?.role === "retailer" && (
        <Stories
          open={storiesModalOpen}
          onClose={() => {
            setStoriesModalOpen(false);
            fetchStoriesCount(); // Refresh stories count when modal closes
          }}
        />
      )}
    </AppBar>
  );
};

export default Navbar;
