import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../component/atoms/loader/LoadingSpinner';

/**
 * A utility function to create lazy-loaded components with a consistent loading UI
 * 
 * @param importFn The import function for the component
 * @param loadingMessage The message to display while loading
 * @param fullScreen Whether to display the loading spinner full screen
 * @returns A component that lazy loads the specified component
 */
export const lazyLoad = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  loadingMessage = 'Loading...',
  fullScreen = true
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={<LoadingSpinner fullScreen={fullScreen} message={loadingMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * A higher-order component that wraps a component with lazy loading
 * 
 * @param Component The component to wrap
 * @param loadingMessage The message to display while loading
 * @param fullScreen Whether to display the loading spinner full screen
 * @returns A component that lazy loads the specified component
 */
export const withLazyLoading = (
  Component: React.ComponentType<any>,
  loadingMessage = 'Loading...',
  fullScreen = true
) => {
  return (props: any) => (
    <Suspense fallback={<LoadingSpinner fullScreen={fullScreen} message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
}; 