import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const role = useSelector((state: RootState) => state.auth.role);
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted url
    return <Navigate to={role === "sales" ? "/sales-login" : "/login"} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 