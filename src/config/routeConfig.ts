export interface RouteConfig {
  path: string;
  allowedRoles: string[];
  redirectPath?: string;
}

// Route configuration with role-based access
export const routeConfig: { [key: string]: RouteConfig } = {
  // Retailer routes
  '/retailer/dashboard': {
    path: '/retailer/dashboard',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/order': {
    path: '/retailer/order',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/orders/history': {
    path: '/retailer/orders/history',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/ordered-items': {
    path: '/retailer/ordered-items',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/product-catalog': {
    path: '/retailer/product-catalog',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/promo': {
    path: '/retailer/promo',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/account': {
    path: '/retailer/account',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/contact': {
    path: '/retailer/contact',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/licence': {
    path: '/retailer/licence',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/profile': {
    path: '/retailer/profile',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/cart': {
    path: '/retailer/cart',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/retailer/policies': {
    path: '/retailer/policies',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },

  // '/retailer/terms-and-conditions': {
  //   path: '/retailer/terms-and-conditions',
  //   allowedRoles: ['retailer'],
  //   redirectPath: '/admin/dashboard'
  // },
  // '/retailer/privacy-policy': {
  //   path: '/retailer/privacy-policy',
  //   allowedRoles: ['retailer'],
  //   redirectPath: '/admin/dashboard'
  // },
  // '/retailer/disclaimer': {
  //   path: '/retailer/disclaimer',
  //   allowedRoles: ['retailer'],
  //   redirectPath: '/admin/dashboard'
  // },
  // '/retailer/return-policy': {
  //   path: '/retailer/return-policy',
  //   allowedRoles: ['retailer'],
  //   redirectPath: '/admin/dashboard'
  // },
  // Admin routes
  '/admin/dashboard': {
    path: '/admin/dashboard',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailers': {
    path: '/admin/retailers',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailer/add': {
    path: '/admin/retailer/add',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailer/edit/:customerId': {
    path: '/admin/retailer/edit/:customerId',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/products': {
    path: '/admin/products',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/product/add': {
    path: '/admin/product/add',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/product/edit/:itemNumber': {
    path: '/admin/product/edit/:itemNumber',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/order': {
    path: '/admin/order',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/account': {
    path: '/admin/account',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/high-demand': {
    path: '/admin/high-demand',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/vendors': {
    path: '/admin/vendors',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/vendor/add': {
    path: '/admin/vendor/add',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/vendor/edit/:vendorId': {
    path: '/admin/vendor/edit/:vendorId',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/reports': {
    path: '/admin/reports',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/promo': {
    path: '/admin/promo',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/reports-analytics': {
    path: '/admin/reports-analytics',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/track-login-devices': {
    path: '/admin/track-login-devices',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/purchase-orders': {
    path: '/admin/purchase-orders',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/back-office': {
    path: '/admin/back-office',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/support-tickets': {
    path: '/admin/support-tickets',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/permissions': {
    path: '/admin/permissions',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/permissions/add': {
    path: '/admin/permissions/add',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/permissions/edit/:id': {
    path: '/admin/permissions/edit/:id',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/permissions/view/:id': {
    path: '/admin/permissions/view/:id',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/permissions/roles/:id': {
    path: '/admin/permissions/roles/:id',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/notifications': {
    path: '/admin/notifications',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/settings': {
    path: '/admin/settings',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },  
  '/admin/profile': {
    path: '/admin/profile',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/terms-and-conditions': {
    path: '/admin/terms-and-conditions',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/privacy-policy': {
    path: '/admin/privacy-policy',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/disclaimer': {
    path: '/admin/disclaimer',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/return-policy': {
    path: '/admin/return-policy',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/policies': {
    path: '/admin/policies',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailer-requests': {
    path: '/admin/retailer-requests',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailer-requests/add': {
    path: '/admin/retailer-requests/add',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailer-requests/edit/:id': { 
    path: '/admin/retailer-requests/edit/:id',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/retailer-requests/view/:id': {
    path: '/admin/retailer-requests/view/:id',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/order/details/:orderId': {
    path: '/admin/order/details/:orderId',
    allowedRoles: ['distributor'],
    redirectPath: '/retailer/dashboard'
  },
  '/admin/calender': {
    path: '/admin/calender',
    allowedRoles: ['distributor'],
    redirectPath: '/admin/dashboard'
  },
  '/admin/calender/view': {
    path: '/admin/calender/view',
    allowedRoles: ['distributor'],
    redirectPath: '/admin/dashboard'
  },
  '/admin/e-pick-settings': {
    path: '/admin/e-pick-settings',
    allowedRoles: ['distributor'],
    redirectPath: '/admin/dashboard'
  },
  // Sales routes
  '/sales/dashboard': {
    path: '/sales/dashboard',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/order': {
    path: '/sales/order',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },

  '/sales/return-order': {
    path: '/sales/return-order',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },

  '/sales/order-checker': {
    path: '/sales/order-checker',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },


  '/sales/order-confirmation': {
    path: '/sales/order-confirmation',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/order-confirmation/:orderId': {
    path: '/sales/order-confirmation/:orderId',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },

  '/sales/order/history': {
    path: '/sales/order/history',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/orders/history': {
    path: '/sales/orders/history',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/order/details/:orderId': {
    path: '/sales/order/details/:orderId',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/ordered-items': {
    path: '/sales/ordered-items',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/cart': {
    path: '/sales/cart',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },

  '/sales/return-cart': {
    path: '/sales/return-cart',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/retailers': {
    path: '/sales/retailers',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/calender': {
    path: '/sales/calender',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/calender/view': {
    path: '/sales/calender/view',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/account': {
    path: '/sales/account',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/promo': {
    path: '/sales/promo',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/track-login-devices': {
    path: '/sales/track-login-devices',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/policies': {
    path: '/sales/policies',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },
  '/sales/profile': {
    path: '/sales/profile',
    allowedRoles: ['sales'],
    redirectPath: '/sales/dashboard'
  },

  // Public routes

  '/login': {
    path: '/login',
    allowedRoles: ['distributor', 'retailer']
  },
  '/forgot-password': {
    path: '/forgot-password',
    allowedRoles: ['distributor', 'retailer']
  },
  '/otp-verification': {
    path: '/otp-verification',
    allowedRoles: ['distributor', 'retailer']
  },
  '/reset-password': {
    path: '/reset-password',
    allowedRoles: ['distributor', 'retailer']
  },
  '/warehouse-selection': {
    path: '/warehouse-selection',
    allowedRoles: ['distributor', 'retailer']
  },
  '/sales-login': {
    path: '/sales-login',
    allowedRoles: ['sales'],
  },
};


// Helper function to match dynamic routes (e.g., /admin/product/edit/:itemNumber)
const matchDynamicRoute = (actualPath: string, routePattern: string): boolean => {
  // Convert route pattern to regex
  const pattern = routePattern.replace(/:[^/]+/g, '[^/]+');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(actualPath);
};

// Helper function to find matching route config (handles dynamic routes)
const findRouteConfig = (path: string): RouteConfig | null => {
  // First try exact match
  if (routeConfig[path]) {
    return routeConfig[path];
  }
  
  // Then try to match dynamic routes
  for (const [routePattern, config] of Object.entries(routeConfig)) {
    if (matchDynamicRoute(path, routePattern)) {
      return config;
    }
  }
  
  return null;
};

// Helper function to check if a route is accessible for a given role
export const isRouteAccessible = (path: string, role: string | null): boolean => {
  const config = findRouteConfig(path);
  if (!config) return false;
  return config.allowedRoles.includes(role || '');
};

// Helper function to get redirect path for a route and role
export const getRedirectPath = (path: string, role: string | null): string => {
  const config = findRouteConfig(path);
  if (!config) {
    // Default redirects based on role
    if (role === 'distributor') return '/admin/dashboard';
    if (role === 'retailer') return '/retailer/dashboard';
    if (role === 'sales') return '/sales/dashboard';
    return '/retailer/dashboard';
  }
  
  return config.redirectPath || (role === 'distributor' ? '/admin/dashboard' : role === 'sales' ? '/sales/dashboard' : '/retailer/dashboard');
};

// Helper function to get all accessible routes for a role
export const getAccessibleRoutes = (role: string | null): string[] => {
  if (!role) return [];
  
  return Object.entries(routeConfig)
    .filter(([_, config]) => config.allowedRoles.includes(role))
    .map(([path, _]) => path);
}; 