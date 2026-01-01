import React from "react";
import AdminLayout from "../layouts/admin/AdminLayout";
import ErrorBoundaryWrapper from "../pages/error/ErrorBoundaryWrapper";
import PrivateRoute from "../components/PrivateRoute";
import RoleBasedRoute from "../components/RoleBasedRoute";

import { Dashboard, ForgotPassword, LoginOtp, Order, OTPVerification, Profile, ResetPasswordPage, WarehouseSelection, SupportTickets,OrderTablePage, OrderDetailsPage, AdminProduct, CartPage, SignUp, Login, SignupOtp, AdminTrackLoginDevices, AdminRetailer, AddRetailer, AdminPromo, AccountReceivable, Vendors, AddVendor, Permissions, AddSalesPerson, ViewSalesPerson, EditSalesPerson, RolesPermissionsPage, SalesLogin, Settings, ProductLicense, TermsAndConditions, PrivacyPolicy, Disclaimer, ReturnPolicy, Policies, AccountReceivableRetailer, SalesProfile, SalesOrder, SalesOrderTablePage, SalesOrderDetailsPage, SalesCartPage, SalesDashboard, AdminOrder, AdminOrderDetail, AdminDashboard, SalesRetailer, SalesOrderedItems, OrderedItems, AdminProfile, AccountReceivableSales, AdminNotifications,SalesCalenderPage, SalesCalenderViewPage, ProductCatalog, LandingPage, Products, RetailerRequest, AddUpdateRequest, ViewRetailerRequest, ContactUs, ContactUsRequestForm, SalesPolicies, RetailerPolicies, WebTermsConditions, WebPrivacyPolicy, WebSoftwareLicense, AdminCalender, DistributorStatusView, EpickSetting, Inventory, BulkUpdate, FuturePricing, SalesOrderConfirmation, SalesOrderConfirmationDetail, SalesReturnOrder, SalesReturnCartPage, OrderChecker, ReportsAnalytics  } from "./lazyComponents";
import { Navigate } from "react-router-dom";

// Check if user is logged in
const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Get role from localStorage or default to retailer
    const role = localStorage.getItem('role') || 'retailer';
    const dashboardPath = role === 'sales' ? '/sales/dashboard' : role === 'distributor' ? '/admin/dashboard' : '/retailer/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }
  return <>{children}</>;
};

// Public routes - accessible without authentication
export const publicRoutes = [
  {
    path: "/",
    element: <AuthCheck><LandingPage /></AuthCheck>,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    path: "/products",
    element: <Products />,
  },
  {
    path: "/contact-us",
    element: <ContactUsRequestForm />,
  },
  {
    path: "/signup",
    element: <SignUp />,
    // errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/signupOtp",
    element: <SignupOtp />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/loginPassword",
    element: <Login />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/login",
    element: <LoginOtp />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/otp-verification",
    element: <OTPVerification />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/sales-login",
    element: <SalesLogin />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/privacy-policy",
    element: <WebPrivacyPolicy />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/terms-conditions",
    element: <WebTermsConditions />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  {
    path: "/software-license",
    element: <WebSoftwareLicense />,
    errorElement: <ErrorBoundaryWrapper />,
  },
  
];

// Retailer routes - only accessible to retailers
export const retailerRoutes = [
  {
    path: "/retailer",
    element: (
      <PrivateRoute>
        <RoleBasedRoute path="/retailer/dashboard">
          <AdminLayout />
        </RoleBasedRoute>
      </PrivateRoute>
    ),
    children: [
      {
        errorElement: <ErrorBoundaryWrapper />,
        children: [
          {
            path: "dashboard/",
            element: (
              <RoleBasedRoute path="/retailer/dashboard">
                <Dashboard />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order",
            element: (
              <RoleBasedRoute path="/retailer/order">
                <Order />
              </RoleBasedRoute>
            ),
          },
          {
            path: "orders/history",
            element: (
              <RoleBasedRoute path="/retailer/orders/history">
                <OrderTablePage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order/history",
            element: (
              <RoleBasedRoute path="/retailer/order">
                <OrderTablePage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order/details/:orderId",
            element: (
              <RoleBasedRoute path="/retailer/order">
                <OrderDetailsPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "ordered-items",
            element: (
              <RoleBasedRoute path="/retailer/ordered-items">
                <OrderedItems />
              </RoleBasedRoute>
            ),
          },
          {
            path: "cart",
            element: (
              <RoleBasedRoute path="/retailer/cart">
                <CartPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "policies",
            element: (
              <RoleBasedRoute path="/retailer/policies">
                <RetailerPolicies />  
              </RoleBasedRoute>
            ),
          },
          {
            path: "promo",
            element: (
              <RoleBasedRoute path="/retailer/promo">
                <div>Promo Page</div>
              </RoleBasedRoute>
            ),
          },
          {
            path: "account",
            element: (
              <RoleBasedRoute path="/retailer/account">
                <AccountReceivableRetailer />
              </RoleBasedRoute>
            ),
          },
          
          {
            path: "licence",
            element: (
              <RoleBasedRoute path="/retailer/licence">
                <ProductLicense />
              </RoleBasedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <RoleBasedRoute path="/retailer/profile">
                <Profile />
              </RoleBasedRoute>
            ),
          },
          {
            path: "terms-and-conditions",
            element: (
              <RoleBasedRoute path="/retailer/terms-and-conditions">
                <TermsAndConditions />
              </RoleBasedRoute>
            ),
          },
          {
            path: "privacy-policy",
            element: (
              <RoleBasedRoute path="/retailer/privacy-policy">
                <PrivacyPolicy />
              </RoleBasedRoute>
            ),
          },
          {
            path: "disclaimer",
            element: (
              <RoleBasedRoute path="/retailer/disclaimer">
                <Disclaimer />
              </RoleBasedRoute>
            ),
          },
          {
            path: "contact",
            element: (
              <RoleBasedRoute path="/retailer/contact">
                <ContactUs />
              </RoleBasedRoute>
            ),
          },
          {
            path: "return-policy",
            element: (
              <RoleBasedRoute path="/retailer/return-policy">
                <ReturnPolicy />
              </RoleBasedRoute>
            ),
          },
          {
            path: "product-catalog",
            element: (
              <RoleBasedRoute path="/retailer/product-catalog">
                <ProductCatalog />
              </RoleBasedRoute>
            ),
          },

        ],
      },
    ],
  },
];

// Admin routes - only accessible to admins
export const adminRoutes = [
  {
    path: "/admin",
    element: (
      <PrivateRoute>
        <RoleBasedRoute path="/admin/dashboard">
          <AdminLayout />
        </RoleBasedRoute>
      </PrivateRoute>
    ),
    children: [
      {
        errorElement: <ErrorBoundaryWrapper />,
        children: [
          {
            path: "dashboard/",
            element: (
              <RoleBasedRoute path="/admin/dashboard">
                <AdminDashboard />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailers",
            element: (
              <RoleBasedRoute path="/admin/retailers">
                <AdminRetailer />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailer/add",
            element: (
              <RoleBasedRoute path="/admin/retailer/add">
                <AddRetailer />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailer/edit/:customerId",
            element: (
              <RoleBasedRoute path="/admin/retailer/edit/:customerId">
                <AddRetailer />
              </RoleBasedRoute>
            ),
          },
          {
            path: "products",
            element: (
              <RoleBasedRoute path="/admin/products">
                <AdminProduct />
              </RoleBasedRoute>
            ),
          },
          {
            path: "products/bulk-update",
            element: (
              <RoleBasedRoute path="/admin/products/bulk-update">
                <BulkUpdate />
              </RoleBasedRoute>
            ),
          },
          {
            path: "products/future-pricing",
            element: (
              <RoleBasedRoute path="/admin/products/future-pricing">
                <FuturePricing />
              </RoleBasedRoute>
            ),
          },
          {
            path: "product/add",
            element: (
              <RoleBasedRoute path="/admin/product/add">
                <Inventory />
              </RoleBasedRoute>
            ),
          },
          {
            path: "product/edit/:itemNumber",
            element: (
              <RoleBasedRoute path="/admin/product/edit/:itemNumber">
                <Inventory />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order",
            element: (
              <RoleBasedRoute path="/admin/order">
                <AdminOrder />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order/details/:orderId",
            element: (
              <RoleBasedRoute path="/admin/order/details/:orderId">
                <AdminOrderDetail />
              </RoleBasedRoute>
            ),
          },
          {
            path: "account",
            element: (
              <RoleBasedRoute path="/admin/account">
                <AccountReceivable />
              </RoleBasedRoute>
            ),
          },
          {
            path: "high-demand",
            element: (
              <RoleBasedRoute path="/admin/high-demand">
                <div>High-demand Products</div>
              </RoleBasedRoute>
            ),
          },
          {
            path: "vendors",
            element: (
              <RoleBasedRoute path="/admin/vendors">
                <Vendors />
              </RoleBasedRoute>
            ),
          },
          {
            path: "vendor/add",
            element: (
              <RoleBasedRoute path="/admin/vendor/add">
                <AddVendor />
              </RoleBasedRoute>
            ),
          },
          {
            path: "vendor/edit/:vendorId",
            element: (
              <RoleBasedRoute path="/admin/vendor/edit/:vendorId">
                <AddVendor />
              </RoleBasedRoute>
            ),
          },
          {
            path: "reports",
            element: (
              <RoleBasedRoute path="/admin/reports">
                <div>Reports</div>
              </RoleBasedRoute>
            ),
          },
          {
            path: "support-tickets",
            element: (
              <RoleBasedRoute path="/admin/support-tickets">
                <SupportTickets />
              </RoleBasedRoute>
            ),
          },
          {
            path: "promo",
            element: (
              <RoleBasedRoute path="/admin/promo">
                <AdminPromo />
              </RoleBasedRoute>
            ),
          },  
          {
            path: "reports-analytics",
            element: (
              <RoleBasedRoute path="/admin/reports-analytics">
                <ReportsAnalytics />
              </RoleBasedRoute>
            ),
          },
          {
            path: "track-login-devices",
            element: (
              <RoleBasedRoute path="/admin/track-login-devices">
                <AdminTrackLoginDevices />
              </RoleBasedRoute>
            ),
          },
          {
            path: "purchase-orders",
            element: (
              <RoleBasedRoute path="/admin/purchase-orders">
                <div>Purchase Orders & Receiving</div>
              </RoleBasedRoute>
            ),
          },
          {
            path: "back-office",
            element: (
              <RoleBasedRoute path="/admin/back-office">
                <div>Back Office</div>
              </RoleBasedRoute>
            ),
          },
          {
            path: "permissions",
            element: (
              <RoleBasedRoute path="/admin/permissions">
                <Permissions />
              </RoleBasedRoute>
            ),
          },
          {
            path: "permissions/add",
            element: (
              <RoleBasedRoute path="/admin/permissions/add">
                <AddSalesPerson />
              </RoleBasedRoute>
            ),
          },

          {
            path: "permissions/view/:id",
            element: (
              <RoleBasedRoute path="/admin/permissions/view/:id">
                <ViewSalesPerson />
              </RoleBasedRoute>
            ),
          },
          {
            path: "permissions/edit/:id",
            element: (
              <RoleBasedRoute path="/admin/permissions/edit/:id">
                <EditSalesPerson />
              </RoleBasedRoute>
            ),
          },
          {
            path: "permissions/roles/:id",
            element: (
              <RoleBasedRoute path="/admin/permissions/roles/:id">
                <RolesPermissionsPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <RoleBasedRoute path="/admin/settings">
                <Settings />
              </RoleBasedRoute>
            ),
          },
          {
            path: "terms-and-conditions",
            element: (
              <RoleBasedRoute path="/admin/terms-and-conditions">
                <TermsAndConditions />
              </RoleBasedRoute>
            ),
          },    
          {
            path: "privacy-policy",
            element: (
              <RoleBasedRoute path="/admin/privacy-policy">
                <PrivacyPolicy />
              </RoleBasedRoute>
            ),
          },    
          {
            path: "disclaimer",
            element: (
              <RoleBasedRoute path="/admin/disclaimer">
                <Disclaimer />
              </RoleBasedRoute>
            ),
          },    
          {
            path: "return-policy",
            element: (
              <RoleBasedRoute path="/admin/return-policy">
                <ReturnPolicy />
              </RoleBasedRoute>
            ),
          },  
          {
            path: "policies",
            element: (
              <RoleBasedRoute path="/admin/policies">
                <Policies />
              </RoleBasedRoute>
            ),
          },  
       
          {
            path: "profile",
            element: (
              <RoleBasedRoute path="/admin/profile">
                <AdminProfile />
              </RoleBasedRoute>
            ),
          },  
          {
            path: "notifications",
            element: (
              <RoleBasedRoute path="/admin/notifications">
                <AdminNotifications />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailer-requests",
            element: (
              <RoleBasedRoute path="/admin/retailer-requests">
                <RetailerRequest />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailer-requests/add",
            element: (
              <RoleBasedRoute path="/admin/retailer-requests/add">
                <AddUpdateRequest />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailer-requests/edit/:id",
            element: (
              <RoleBasedRoute path="/admin/retailer-requests/edit/:id">
                <AddUpdateRequest />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailer-requests/view/:id",
            element: (
              <RoleBasedRoute path="/admin/retailer-requests/view/:id">
                <ViewRetailerRequest />
              </RoleBasedRoute>
            ),
          },
          {
            path: "calender",
            element: (
              <RoleBasedRoute path="/admin/calender">
                <AdminCalender />
              </RoleBasedRoute>
            ),
          },
          {
            path: "calender/view",
            element: (
              <RoleBasedRoute path="/admin/calender/view">
                <DistributorStatusView />
              </RoleBasedRoute>
            ),
          },
          {
            path: "e-pick-settings",
            element: (
              <RoleBasedRoute path="/admin/e-pick-settings">
                <EpickSetting />
              </RoleBasedRoute>
            ),
          },  
        ],
      },
    ],
  },
];

// Sales routes - only accessible to sales
export const salesRoutes = [
  {
    path: "/sales",
    element: (
      <PrivateRoute>
        <RoleBasedRoute path="/sales/dashboard">
          <AdminLayout />
        </RoleBasedRoute>
      </PrivateRoute> 
    ),
    children: [
      {
        errorElement: <ErrorBoundaryWrapper />,
        children: [
          {
            path: "dashboard/", 
            element: (
              <RoleBasedRoute path="/sales/dashboard">
                <SalesDashboard />
              </RoleBasedRoute>
            ),
          }, 
          {
            path: "order",
            element: (
              <RoleBasedRoute path="/sales/order">
                <SalesOrder />
              </RoleBasedRoute>
            ),
          },
          {
            path: "return-order",
            element: (
              <RoleBasedRoute path="/sales/return-order">
                <SalesReturnOrder />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order-confirmation",
            element: (
              <RoleBasedRoute path="/sales/order-confirmation">
                <SalesOrderConfirmation />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order-confirmation/:orderId",
            element: (
              <RoleBasedRoute path="/sales/order-confirmation/:orderId">
                <SalesOrderConfirmationDetail />
              </RoleBasedRoute>
            ),
          },
          {
            path: "ordered-items",
            element: (
              <RoleBasedRoute path="/sales/ordered-items">
                <SalesOrderedItems />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order/history",
            element: (
              <RoleBasedRoute path="/sales/order/history">
                <SalesOrderTablePage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "orders/history",
            element: (
              <RoleBasedRoute path="/sales/orders/history">
                <SalesOrderTablePage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order/details/:orderId",
            element: (
              <RoleBasedRoute path="/sales/order/details/:orderId">
                <SalesOrderDetailsPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "cart",
            element: (
              <RoleBasedRoute path="/sales/cart">
                <SalesCartPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "return-cart",
            element: (
              <RoleBasedRoute path="/sales/return-cart">
                <SalesReturnCartPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "order-checker",
            element: (
              <RoleBasedRoute path="/sales/order-checker">
                <OrderChecker />
              </RoleBasedRoute>
            ),
          },
          {
            path: "retailers",
            element: (
              <RoleBasedRoute path="/sales/retailers">
                <SalesRetailer />
              </RoleBasedRoute>
            ),
          },
          {
            path: "calender",
            element: (
              <RoleBasedRoute path="/sales/calender">
                <SalesCalenderPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "calender/view",
            element: (
              <RoleBasedRoute path="/sales/calender/view">
                <SalesCalenderViewPage />
              </RoleBasedRoute>
            ),
          },
          {
            path: "track-login-devices",
            element: (
              <RoleBasedRoute path="/sales/track-login-devices">
                <div>Track Login Devices</div>
              </RoleBasedRoute>
            ),
          },
          {
            path: "account",
            element: (
              <RoleBasedRoute path="/sales/account">
                <AccountReceivableSales /> 
              </RoleBasedRoute>
            ),
          },

          {
            path: "policies",
            element: (
              <RoleBasedRoute path="/sales/policies">
                <SalesPolicies />
              </RoleBasedRoute>
            ),
          },  
          {
            path: "profile",
            element: (
              <RoleBasedRoute path="/sales/profile">
                <SalesProfile />
              </RoleBasedRoute>
            ),
          },

            ],
      },
    ],
  },
];

// Shared routes - accessible to both roles
export const sharedRoutes = [
  {
    path: "/warehouse-selection",
    element: (
      <PrivateRoute>
        <RoleBasedRoute path="/warehouse-selection">
          <WarehouseSelection />
        </RoleBasedRoute>
      </PrivateRoute>
    ),
    errorElement: <ErrorBoundaryWrapper />,
  },
];

// Combine all routes
export const routes = [
  ...publicRoutes,
  ...retailerRoutes,
  ...adminRoutes,
  ...salesRoutes,
  ...sharedRoutes,
];
