import React from "react";
import ViewRoutesContent from "../../../component/organisms/driverManagement/ViewRoutesContent";

/** Standalone route — URL sync. From Routes tab use embedded mode in `RouteTab` (no navigation). */
const ViewRoutesPage: React.FC = () => {
  return <ViewRoutesContent mode="page" />;
};

export default ViewRoutesPage;
