# Role-Based Routing System

This system provides comprehensive role-based access control for your React application, ensuring that users can only access routes appropriate to their role.

## Components Created

### 1. `RoleBasedRoute.tsx`
A wrapper component that checks user permissions before rendering child components.

### 2. `routeConfig.ts`
Configuration file that defines which routes are accessible to which roles.

### 3. `useRoleBasedAccess.ts`
Custom hook that provides role-based access control functionality throughout the application.

### 4. `roleBasedRoutes.tsx`
Example implementation showing how to structure routes with role-based access.

## How It Works

### Route Configuration
Routes are defined in `routeConfig.ts` with the following structure:

```typescript
export const routeConfig: { [key: string]: RouteConfig } = {
  '/retailer/dashboard': {
    path: '/retailer/dashboard',
    allowedRoles: ['retailer'],
    redirectPath: '/admin/dashboard'
  },
  '/admin/dashboard': {
    path: '/admin/dashboard',
    allowedRoles: ['admin'],
    redirectPath: '/retailer/dashboard'
  }
};
```

### Using RoleBasedRoute Component

```tsx
import RoleBasedRoute from '../components/RoleBasedRoute';

// Wrap your route components
<RoleBasedRoute path="/retailer/dashboard">
  <Dashboard />
</RoleBasedRoute>
```

### Using the Custom Hook

```tsx
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

const MyComponent = () => {
  const { 
    role, 
    isAuthenticated, 
    canAccessRoute, 
    redirectToDashboard,
    isAdmin,
    isRetailer 
  } = useRoleBasedAccess();

  // Check if user can access a specific route
  if (!canAccessRoute('/admin/dashboard')) {
    return <div>Access Denied</div>;
  }

  return <div>Welcome {role}!</div>;
};
```

## Features

### ✅ Role-Based Access Control
- **Admin users** can only access admin routes (`/admin/*`)
- **Retailer users** can only access retailer routes (`/retailer/*`)
- **Automatic redirects** when users try to access unauthorized routes

### ✅ Authentication Integration
- Integrates with Redux auth slice
- Checks authentication status before route access
- Redirects to login if not authenticated

### ✅ Flexible Configuration
- Easy to add new routes and roles
- Configurable redirect paths
- Support for shared routes accessible to multiple roles

### ✅ Helper Functions
- `isRouteAccessible()` - Check if a route is accessible
- `getRedirectPath()` - Get appropriate redirect path
- `getAccessibleRoutes()` - Get all accessible routes for a role

## Implementation Steps

### 1. Update Your Routes
Replace your existing routes with role-based routes:

```tsx
// Instead of this:
<Route path="/dashboard" element={<Dashboard />} />

// Use this:
<Route 
  path="/retailer/dashboard" 
  element={
    <RoleBasedRoute path="/retailer/dashboard">
      <Dashboard />
    </RoleBasedRoute>
  } 
/>
```

### 2. Add Route Configuration
Add new routes to `routeConfig.ts`:

```typescript
'/retailer/new-route': {
  path: '/retailer/new-route',
  allowedRoles: ['retailer'],
  redirectPath: '/admin/dashboard'
}
```

### 3. Use the Hook for Conditional Rendering

```tsx
const { isAdmin, canAccessRoute } = useRoleBasedAccess();

return (
  <div>
    {isAdmin && <AdminOnlyComponent />}
    {canAccessRoute('/retailer/special-route') && <SpecialComponent />}
  </div>
);
```

## Security Features

- **Route Protection**: Users cannot access unauthorized routes
- **Automatic Redirects**: Users are redirected to appropriate dashboards
- **Role Validation**: All route access is validated against user role
- **Authentication Check**: Routes are protected by authentication status

## Example Usage in Components

```tsx
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

const NavigationMenu = () => {
  const { role, getCurrentUserAccessibleRoutes } = useRoleBasedAccess();
  
  const accessibleRoutes = getCurrentUserAccessibleRoutes();
  
  return (
    <nav>
      {accessibleRoutes.map(route => (
        <Link key={route} to={route}>
          {route}
        </Link>
      ))}
    </nav>
  );
};
```

## Error Handling

The system handles various scenarios:
- **Unauthenticated users**: Redirected to login
- **Invalid roles**: Redirected to default dashboard
- **Unauthorized routes**: Redirected to appropriate dashboard
- **Missing routes**: Redirected to fallback path

This system ensures that your application maintains proper security boundaries while providing a smooth user experience. 