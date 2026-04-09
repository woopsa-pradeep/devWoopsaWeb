export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  check: string;
}

// Separate navigation configs for different roles
export const retailerNavigationConfig: NavigationItem[] = [
  {
    name: "Dashboard",
    path: "/retailer/dashboard",
    icon: "dashboard",
    check: "retailer",
  },
  {
    name: "Order",
    path: "/retailer/order",
    icon: "order",
    check: "retailer",
  },
  {
    name: "Order History",
    path: "/retailer/orders/history",
    icon: "order-history",
    check: "retailer",
  },
  {
    name: "Ordered Items",
    path: "/retailer/ordered-items",
    icon: "ordered-items",
    check: "retailer",
  },
  // {
  //   name: "Promo",
  //   path: "/retailer/promo",
  //   icon: "promo",
  //   check: "retailer",
  // },
  {
    name: "Account Receivable",
    path: "/retailer/account",
    icon: "account",
    check: "retailer",
  },
  {
    name: "Product Catalog",
    path: "/retailer/product-catalog",
    icon: "product-catalog",
    check: "retailer",
  },
  {
    name: "Trade Show",
    path: "/retailer/trade-show",
    icon: "tradeshow-management",
    check: "retailer",
  },
  {
    name: "Contact Us",
    path: "/retailer/contact",
    icon: "contactUs",
    check: "retailer",
  },
  {
    name: "Product License" ,
    path: "/retailer/licence",
    icon: "file",
    check: "retailer",
  },
  {
    name: "Policies",
    path: "/retailer/policies",
    icon: "policies",
    check: "retailer",
  },

  // {
  //   name: "Terms & Conditions",
  //   path: "/retailer/terms-and-conditions",
  //   icon: "terms-and-conditions",
  //   check: "retailer",
  // },
  // {
  //   name: "Privacy Policy",
  //   path: "/retailer/privacy-policy",
  //   icon: "privacy-policy",
  //   check: "retailer",
  // },
  // {
  //   name: "Disclaimer",
  //   path: "/retailer/disclaimer",
  //   icon: "disclaimer",
  //   check: "retailer",
  // },
  // {
  //   name: "Return Policy",
  //   path: "/retailer/return-policy",
  //   icon: "return-policy",
  //   check: "retailer",
  // },
  // {
  //   name: "Cart",
  //   path: "/retailer/cart",
  //   icon: "cart",
  //   check: "retailer",
  // },
  // {
  //   name: "Profile",
  //   path: "/retailer/profile",
  //   icon: "profile",
  //   check: "retailer",
  // },
];

export const adminNavigationConfig: NavigationItem[] = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: "dashboard",
    check: "distributor",
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: "products",
    check: "distributor",
  },
  {
    name: "Retailers",
    path: "/admin/retailers",
    icon: "customers",
    check: "distributor",
  },
  {
    name: "Vendors",
    path: "/admin/vendors",
    icon: "vendors",
    check: "distributor",
  },
  // {
  //   name: "Inventory",
  //   path: "/admin/inventory",
  //   icon: "inventory",
  //   check: "distributor",
  // },
  {
    name: "Orders",
    path: "/admin/order",
    icon: "orders",
    check: "distributor",
  },
  {
    name: "Account Receivable",
    path: "/admin/account",
    icon: "account",
    check: "distributor",
  },
  {
    name: "Promo & Marketing",
    path: "/admin/promo",
    icon: "promo",
    check: "distributor",
  },
  // {
  //   name: "Tradeshow Management",
  //   path: "/admin/tradeshow-management",
  //   icon: "tradeshow-management",
  //   check: "distributor",
  // },
  {
    name: "Reports & Analytics",
    path: "/admin/reports-analytics",
    icon: "reports-analytics",
    check: "distributor",
  },
  // {
  //   name: "Purchase Orders",
  //   path: "/admin/purchase-orders",
  //   icon: "purchase-orders",
  //   check: "distributor",
  // },
  {
    name: "Track Login Devices",
    path: "/admin/track-login-devices",
    icon: "track-login-devices",
    check: "distributor",
  },
  {
    name: "User Management",
    path: "/admin/permissions",
    icon: "user-management",
    check: "distributor",
  },
  {
    name: "Notifications",
    path: "/admin/notifications",
    icon: "notifications",
    check: "distributor",
  },
  {
    name: "Support Tickets",
    path: "/admin/support-tickets",
    icon: "SupportTicketsIcon",
    check: "distributor",
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: "settings",
    check: "distributor",
  },
  {
    name: "Policies",
    path: "/admin/policies",
    icon: "policies",
    check: "distributor",
  },
  {
    name: "Retailer Requests",
    path: "/admin/retailer-requests",
    icon: "retailer-requests",
    check: "distributor",
  },
  {
    name: "Calendar",
    path: "/admin/calender",
    icon: "CalendarMonthIcon",
    check: "distributor",
  },
  {
    name: "E-pick",
    path: "/admin/e-pick-settings",
    icon: "e-pick-settings",
    check: "distributor",
  },
  {
    name: "Driver Management",
    path: "/admin/driver-management",
    icon: "driver-management",
    check: "distributor",
  },
  
  
  // {
  //   name: "Terms & Conditions",
  //   path: "/admin/terms-and-conditions",
  //   icon: "terms-and-conditions",
  //   check: "admin",
  // },
  // {
  //   name: "Privacy Policy",
  //   path: "/admin/privacy-policy",
  //   icon: "privacy-policy",
  //   check: "admin",
  // },
  // {
  //   name: "Disclaimer",
  //   path: "/admin/disclaimer",
  //   icon: "disclaimer",
  //   check: "admin",
  // },
  // {
  //   name: "Return Policy",
  //   path: "/admin/return-policy",
  //   icon: "return-policy",
  //   check: "admin",
  // },
];

export const salesNavigationConfig: NavigationItem[] = [

  {
    name: "Dashboard",
    path: "/sales/dashboard",
    icon: "dashboard",
    check: "sales",
  },
  {
    name: "Orders",
    path: "/sales/order",
    icon: "order",
    check: "sales",
  },
  {
    name: "Trade Show",
    path: "/sales/trade-show",
    icon: "tradeshow-management",
    check: "sales",
  },
  {
    name: "Return Orders",
    path: "/sales/return-order",
    icon: "order",
    check: "sales",
  },
  {
    name: "Order Confirmation",
    path: "/sales/order-confirmation",
    icon: "order",
    check: "sales",
  },
  {
    name: "Ordered Items",
    path: "/sales/ordered-items", 
    icon: "ordered-items",
    check: "sales",
  },
  {
    name: "Order History",
    path: "/sales/orders/history",
    icon: "order-history",
    check: "sales",
  },
{
  name: "Order Checker",
  path: "/sales/order-checker",
  icon: "order",
  check: "sales",
},
  {
    name: "Calendar",
    path: "/sales/calender",
    icon: "CalendarMonthIcon",
    check: "sales",
  },

  {
    name: "Retailers",
    path: "/sales/retailers",
    icon: "customers",
    check: "sales",
  },
  {
    name: "Account Receivable",
    path: "/sales/account",
    icon: "account",
    check: "sales",
  },
  {
    name: "Product",
    path: "/sales/product",
    icon: "products",
    check: "sales",
  },
  {
    name: "Vendor",
    path: "/sales/vendor",
    icon: "vendors",
    check: "sales",
  },
  {
    name: "Epick",
    path: "/sales/epick",
    icon: "e-pick-settings",
    check: "sales",
  },
  {
    name: "Track Login Device",
    path: "/sales/track-login-devices",
    icon: "track-login-devices",
    check: "sales",
  },
  {
    name: "Promo & marketing",
    path: "/sales/promo",
    icon: "promo",
    check: "sales",
  },
  {
    name: "Policies",
    path: "/sales/policies",
    icon: "policies",
    check: "sales",
  },

];

// Function to get navigation config based on user role
export const getNavigationConfig = (role: string | null): NavigationItem[] => {
  switch (role) {
    case 'distributor':
      return adminNavigationConfig;
    case 'retailer':
      return retailerNavigationConfig;
    case 'sales':
      return salesNavigationConfig;
    default:
      return retailerNavigationConfig; // Default fallback
  }
};

// Legacy export for backward compatibility
export const navigationConfig: NavigationItem[] = [
  ...retailerNavigationConfig,
  ...adminNavigationConfig,
  ...salesNavigationConfig,
];

export const isParentActive = (currentPath: string, itemPath: string): boolean => {
  if (currentPath === itemPath) return true;
  return currentPath.startsWith(itemPath + '/');
}; 