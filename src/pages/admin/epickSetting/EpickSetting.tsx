import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  useMediaQuery, 
  Tabs, 
  Tab,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Settings as SettingsIcon, ShoppingCart as OngoingOrdersIcon, Settings as OrderPreferencesIcon, Assessment as ReportsIcon, PersonAdd as CreateUserIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useSubModulePermission } from '../../../hooks/useModulePermission';
import PinSettingsTab from './PinSettingsTab';
import OngoingOrdersTab from './OngoingOrdersTab';
import OrderPreferencesTab from './OrderPreferencesTab';
import EpickReportsTab from './EpickReportsTab';
import CheckerUsersTab from './CheckerUsersTab';
import CreateEpickUserTab from './CreateEpickUserTab';

const tabStyle = (theme: Theme) => ({
  alignItems: "center" as const,
  justifyContent: "flex-start" as const,
  textTransform: "none" as const,
  minHeight: { xs: 35, md: 48 },
  fontWeight: 400,
  gap: { xs: 0.3, md: 1 },
  margin: '4px 8px',
  transition: 'all 0.2s ease-in-out',
  "&.Mui-selected": {
    color: theme.palette.primary.main,
    fontWeight: 500,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
});

const EpickSetting = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 899px)");
  const { role } = useSelector((state: RootState) => state.auth);
  const isSales = role === 'sales';
  const isDistributor = role === 'distributor';

  // Sub-module permissions for Epick (full canAdd/canEdit/canView)
  const settingsPerms = useSubModulePermission('Epick', 'Settings');
  const ongoingOrdersPerms = useSubModulePermission('Epick', 'Ongoing Orders');
  const orderPreferencesPerms = useSubModulePermission('Epick', 'Order Preferences');
  const reportsPerms = useSubModulePermission('Epick', 'Reports');
  const createUserPerms = useSubModulePermission('Epick', 'Create User');

  const subModulePermsMap: Record<string, { canAdd: boolean; canEdit: boolean; canView: boolean }> = {
    settings: settingsPerms,
    orders: ongoingOrdersPerms,
    orderPreferences: orderPreferencesPerms,
    reports: reportsPerms,
    createUser: createUserPerms,
  };

  const allTabs = useMemo(() => [
    { id: 'settings', label: 'Settings', icon: SettingsIcon, content: <PinSettingsTab canAdd={settingsPerms.canAdd} canEdit={settingsPerms.canEdit} />, showHeader: true },
    { id: 'orders', label: 'Orders', icon: OngoingOrdersIcon, content: <OngoingOrdersTab canAdd={ongoingOrdersPerms.canAdd} canEdit={ongoingOrdersPerms.canEdit} />, showHeader: false },
    { id: 'orderPreferences', label: 'Order Preferences', icon: OrderPreferencesIcon, content: <OrderPreferencesTab canEdit={orderPreferencesPerms.canEdit} />, showHeader: false },
    { id: 'reports', label: 'E-pick Reports', icon: ReportsIcon, content: <EpickReportsTab />, showHeader: false },
    { id: 'createUser', label: 'Create Epick User', icon: CreateUserIcon, content: <CreateEpickUserTab canAdd={createUserPerms.canAdd} canEdit={createUserPerms.canEdit} />, showHeader: false },
  ], [settingsPerms, ongoingOrdersPerms, orderPreferencesPerms, createUserPerms]);

  const visibleTabs = useMemo(() => {
    let tabs = allTabs;
    if (isSales) {
      tabs = tabs.filter(t => t.id === 'orders' || t.id === 'reports');
    }
    // For sales: filter by sub-module permissions; distributor: show all
    if (!isDistributor) {
      tabs = tabs.filter(t => subModulePermsMap[t.id]?.canView !== false);
    }
    return tabs;
  }, [isSales, isDistributor, allTabs, subModulePermsMap]);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (activeTab >= visibleTabs.length) {
      setActiveTab(0);
    }
  }, [visibleTabs.length, activeTab]);

  return (
    <Box sx={{ px: { xs: 1, md: 2 } }}>
      <Typography sx={{ fontWeight: 400, fontSize: 20, color: "text.primary", mb: 2 }}>
        Epick Settings
      </Typography>
      
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} mt={2} gap={3} height="calc(100vh - 210px)">
        {/* Left Sidebar - Tabs */}
        <Paper sx={{ width: { xs: "100%", md: 250 }, borderRadius: 3, boxShadow: "none" }}>
          <Tabs
            orientation={isMobile ? "horizontal" : "vertical"}
            variant={isMobile ? "scrollable" : "standard"}
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ py: { xs: 1, md: 2 } }}
            TabIndicatorProps={{ style: { display: "none" } }}
          >
            {visibleTabs.map((tab) => (
              <Tab
                key={tab.id}
                label={tab.label}
                icon={<tab.icon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                sx={tabStyle(theme)}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Right Content - Form or Requests */}
        <Paper sx={{ flexGrow: 1, borderRadius: 3, boxShadow: "none", position: "relative", height: "100%", overflow: "auto" }}>
          <Box sx={{ position: "relative", height: "100%" }}>
            {/* Header - Only show for Pin Settings tab (distributor only) */}
            {visibleTabs[activeTab]?.showHeader && (
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "primary.main",
                borderRadius: "8px 8px 0 0",
                padding: "12px 20px",
                marginBottom: 2
              }}>
                <Typography sx={{ fontWeight: 500, fontSize: 16, color: "white" }}>
                  Settings
                </Typography>
              </Box>
            )}

            {/* Content based on active tab */}
            {visibleTabs[activeTab]?.content ?? <CheckerUsersTab />}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default EpickSetting; 