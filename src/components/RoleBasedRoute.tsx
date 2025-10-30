import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../redux/store';
import { isRouteAccessible, getRedirectPath } from '../config/routeConfig';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  path: string;
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  path,
  fallbackPath
}) => {
  const { role } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const loginPath = role === "sales" ? "/sales-login" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If no role is set, redirect to appropriate dashboard
  if (!role) {
    const defaultPath = fallbackPath || '/retailer/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  // Check if user's role is allowed for this route
  const hasAccess = isRouteAccessible(path, role);

  if (!hasAccess) {
    // Get the appropriate redirect path based on role and route
    const redirectPath = getRedirectPath(path, role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute; 