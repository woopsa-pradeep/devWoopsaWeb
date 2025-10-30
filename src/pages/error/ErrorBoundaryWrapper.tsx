import React from 'react';
import { Outlet, useRouteError } from 'react-router-dom';
import ErrorFallback from './ErrorFallback';

/**
 * A wrapper component that automatically handles errors for all child routes
 * This eliminates the need to add errorElement to each route individually
 */
const ErrorBoundaryWrapper: React.FC = () => {
  const error = useRouteError();
  
  // If there's an error, render the ErrorFallback component
  if (error) {
    return <ErrorFallback />;
  }
  
  // Otherwise, render the child routes
  return <Outlet />;
};

export default ErrorBoundaryWrapper; 