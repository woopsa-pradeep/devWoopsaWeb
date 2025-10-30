import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  preloadDashboard, 
  preloadExampleForm 
} from '../../../routes/advancedLazyComponents';

/**
 * A component that preloads components based on the current route
 * This can be added to your main layout to improve navigation performance
 */
const PreloadManager: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Preload components based on the current route
    const preloadComponents = () => {
      const path = location.pathname;
      
      if (path.includes('/dashboard')) {
        // If we're on the dashboard, preload the warehouse and form
        preloadExampleForm();
      } else if (path.includes('/warehouse')) {
        // If we're on the warehouse, preload the dashboard and form
        preloadDashboard();
        preloadExampleForm();
      } else if (path.includes('/form')) {
        // If we're on the form, preload the dashboard and warehouse
        preloadDashboard();
      } else {
        // If we're on the home page or another page, preload all components
        preloadDashboard();
        preloadExampleForm();
      }
    };
    
    // Preload components after a short delay to avoid blocking initial render
    const timeoutId = setTimeout(preloadComponents, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
  
  // This component doesn't render anything
  return null;
};

export default PreloadManager; 