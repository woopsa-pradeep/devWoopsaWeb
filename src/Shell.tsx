import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { routes } from "./routes/routes";
import { useSelector } from "react-redux";
import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";
import type { RootState } from "./redux/store";
import { useAppDispatch } from "./redux/store";
import { getTheme } from "./theme/theme";
import { useEffect } from "react";
import GlobalPopup from "./component/atoms/GlobalPopup";
import { hideGlobalPopup } from "./redux/slices/globalPopupSlice";
import { setSelectedCustomer, updateSessionCustomer } from "./redux/slices/authSlice";
import { setSalesSession, getCustomerList } from "./redux/apis/sales/profileApis";
import { onMessageListener } from "./firebase-messaging";
import { initializeFirebaseOnStartup, isFirebaseMessagingAvailable } from "./utils/firebaseWrapper";
import { notificationFallback, showBrowserNotification } from "./utils/notificationFallback";
// import { initializeFCMAndSendToken, isFCMSupported } from "./utils/fcmUtils";
import { fetchNotifications } from "./redux/slices/notificationSlice";
import { getContactUsData } from "./redux/apis/landingPageApis";
import { setFavicon } from "./utils/faviconUtils";

function Shell() {
  const mode = useSelector((state: RootState) => state.theme.mode);
  const theme = getTheme(mode);
  const globalPopup = useSelector((state: RootState) => state.globalPopup);
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  // Create router outside of render to prevent recreation
  const router = React.useMemo(() => createBrowserRouter(routes), []);

  // Initialize Firebase Cloud Messaging on startup
  useEffect(() => {
    initializeFirebaseOnStartup().catch((error) => {
      console.warn('Failed to initialize Firebase on startup:', error);
    });
  }, []);

  // Fetch contact us data and set favicon on app load
  useEffect(() => {
    const fetchAndSetFavicon = async () => {
      try {
        const contactData = await getContactUsData();
        const logoUrl = contactData?.logo;
        // Set favicon - if logo exists use it, otherwise use default
        setFavicon(logoUrl);
      } catch (error) {
        console.warn('Failed to fetch contact us data for favicon:', error);
        // On error, use default favicon
        setFavicon(null);
      }
    };

    fetchAndSetFavicon();
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!auth?.isAuthenticated) return;

    try {
      // Check if Firebase messaging is available
      if (isFirebaseMessagingAvailable()) {
        // Set up the Firebase message listener with callback
        const unsubscribe = onMessageListener((payload: any) => {
          handleNotification(payload);
        });

        return () => {
          // Cleanup the listener when component unmounts
          if (unsubscribe && typeof unsubscribe === 'function') {
            try {
              unsubscribe();
            } catch (error) {
              console.warn('Error cleaning up Firebase message listener:', error);
            }
          }
        };
      } else {
        // Use fallback notification system
        console.log('Using fallback notification system');
        const unsubscribe = notificationFallback.addListener((notification) => {
          handleNotification({
            notification: {
              title: notification.title,
              body: notification.body
            }
          });
        });

        return () => {
          notificationFallback.removeListener(unsubscribe);
        };
      }
    } catch (error) {
      console.warn('Notification system not available:', error);
      // Return empty cleanup function if notification system fails
      return () => {};
    }
  }, [auth?.isAuthenticated, auth?.role, dispatch]);

  // Handle notifications from either Firebase or fallback
  const handleNotification = (payload: any) => {
    try {
      // Extract notification data
      const notification = payload?.notification;
      const title = notification?.title || 'New Notification';
      const body = notification?.body || 'You have a new message';
      
      // Fetch updated notifications for retailer users to keep the list in sync
      if (auth?.role === 'retailer') {
        dispatch(fetchNotifications());
      }
      
      // Show browser notification if supported
      showBrowserNotification(title, body);
      
      // Show toast notification at bottom right
      toast.custom(
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '20px',
          background: '#ffffff',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          minWidth: '380px',
          position: 'relative',
          animation: 'slideDown 0.3s ease-out',
          transform: 'translateY(0)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}>
          <div style={{
            background: '#3C7795',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            marginRight: '16px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(74,144,226,0.3)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '500', 
              marginBottom: '6px',
              color: '#1a1a1a',
              fontSize: '16px',
              letterSpacing: '0.3px'
            }}>{title}</div>
            <div style={{ 
              fontSize: '14px',
              color: '#666666',
              lineHeight: '1.4'
            }}>{body}</div>
          </div>
          <button 
            onClick={() => toast.dismiss()} 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              padding: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#666666">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <style>
            {`
              @keyframes slideDown {
                from {
                  transform: translateY(-100%);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}
          </style>
        </div>,
        {
          duration: 5000,
          position: 'top-center',
          style: {
            marginTop: '20px'
          }
        }
      );
    } catch (error) {
      console.warn('Error handling notification:', error);
    }
  };

  const handleGlobalPopupConfirm = async (customerId: any) => {
    if (auth?.role === "sales" && customerId) {
      try {
        // Call the session API
        await setSalesSession(customerId.toString());
        
        // Get the customer list to find the selected customer
        const res: any = await getCustomerList();
        const customers = res?.data?.data || [];
        const selectedCustomer = customers.find((customer: any) => 
          customer.C_Number.toString() === customerId.toString()
        );
        
        if (selectedCustomer) {
          // Update session state in Redux
          dispatch(updateSessionCustomer(selectedCustomer.C_Number.toString()));
          // Set the selected customer in Redux
          dispatch(setSelectedCustomer(selectedCustomer));
          
          // Check current path and handle navigation
          const currentPath = window.location.pathname;
          
          // Add a small delay to ensure Redux state updates are processed
          setTimeout(() => {
            if (currentPath === '/sales/dashboard') {
              // If already on sales dashboard, refresh the page
              window.location.reload();
            } else {
              // If not on sales dashboard, redirect to it
              window.location.href = '/sales/dashboard';
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error setting sales session:', error);
      }
    }
  };

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            textRendering: "optimizeLegibility",
          },
        }}
      />
      <RouterProvider router={router} />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 5000,
          
        }}
      />
      <GlobalPopup
        open={globalPopup.isOpen}
        onClose={() => dispatch(hideGlobalPopup())}
        title={globalPopup.title}
        message={globalPopup.message}
        buttonText={globalPopup.buttonText}
        customerId={globalPopup.customerId}
        onConfirm={handleGlobalPopupConfirm}
      />
    </ThemeProvider>
  );
}

export default Shell;
