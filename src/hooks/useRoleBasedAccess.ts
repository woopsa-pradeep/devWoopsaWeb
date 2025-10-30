import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../redux/store';
import { isRouteAccessible, getRedirectPath, getAccessibleRoutes } from '../config/routeConfig';

export const useRoleBasedAccess = () => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current route is accessible
  const isCurrentRouteAccessible = () => {
    return isRouteAccessible(location.pathname, role);
  };

  // Check if a specific route is accessible
  const canAccessRoute = (path: string) => {
    return isRouteAccessible(path, role);
  };

  // Get all accessible routes for current user
  const getCurrentUserAccessibleRoutes = () => {
    return getAccessibleRoutes(role);
  };

  // Redirect to appropriate dashboard based on role
  const redirectToDashboard = () => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'retailer') {
      navigate('/retailer/dashboard');
    } else {
      navigate('/retailer/dashboard');
    }
  };

  // Redirect to appropriate path if current route is not accessible
  const redirectIfNotAccessible = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!isCurrentRouteAccessible()) {
      const redirectPath = getRedirectPath(location.pathname, role);
      navigate(redirectPath);
    }
  };

  // Check if user is admin
  const isAdmin = () => role === 'distributor';

  // Check if user is retailer
  const isRetailer = () => role === 'retailer';

  return {
    role,
    isAuthenticated,
    isCurrentRouteAccessible,
    canAccessRoute,
    getCurrentUserAccessibleRoutes,
    redirectToDashboard,
    redirectIfNotAccessible,
    isAdmin,
    isRetailer,
  };
}; 