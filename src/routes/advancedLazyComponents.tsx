import { LazyComponentLoader } from "../utils/advancedLazyLoadUtils";

// Create lazy-loaded components with the advanced utility
  export const Dashboard = LazyComponentLoader.create(
    () => import("../pages/retailer/dashboard/Dashboard"),
    "Dashboard",
    "Loading Dashboard..."
  );

export const ExampleForm = LazyComponentLoader.create(
  () => import("../pages/exampleForm/ExampleForm"),
  "ExampleForm",
  "Loading Form..."
);

export const Profile = LazyComponentLoader.create(
  () => import("../pages/retailer/profile/Profile"),
  "Profile",
  "Loading Profile..."
);

// Preload functions for specific scenarios
export const preloadDashboard = () => LazyComponentLoader.preload("Dashboard");
export const preloadExampleForm = () => LazyComponentLoader.preload("ExampleForm");

// Preload all components
export const preloadAllComponents = () => 
  LazyComponentLoader.preloadMultiple(["Dashboard", "ExampleForm"]); 