import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  useMediaQuery, 
  Tabs, 
  Tab,
} from '@mui/material';
import { VpnKey as PinIcon, PendingActions as PendingIcon, ShoppingCart as OngoingOrdersIcon, Settings as OrderPreferencesIcon } from '@mui/icons-material';
import PinSettingsTab from './PinSettingsTab';
import PendingRequestsTab from './PendingRequestsTab';
import OngoingOrdersTab from './OngoingOrdersTab';
import OrderPreferencesTab from './OrderPreferencesTab';

const EpickSetting = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [activeTab, setActiveTab] = useState(0);

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
            <Tab
              label="Pin Settings"
              icon={<PinIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              sx={{
                alignItems: "center",
                justifyContent: "flex-start",
                textTransform: "none",
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
              }}
            />
            <Tab
              label="Manager Override"
              icon={<PendingIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              sx={{
                alignItems: "center",
                justifyContent: "flex-start",
                textTransform: "none",
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
              }}
            />
            <Tab
              label="Ongoing Orders"
              icon={<OngoingOrdersIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              sx={{
                alignItems: "center",
                justifyContent: "flex-start",
                textTransform: "none",
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
              }}
            />
            <Tab
              label="Order Preferences"
              icon={<OrderPreferencesIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              sx={{
                alignItems: "center",
                justifyContent: "flex-start",
                textTransform: "none",
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
              }}
            />
          </Tabs>
        </Paper>

        {/* Right Content - Form or Requests */}
        <Paper sx={{ flexGrow: 1, borderRadius: 3, boxShadow: "none", position: "relative", height: "100%", overflow: "auto" }}>
          <Box sx={{ position: "relative", height: "100%" }}>
            {/* Header - Only show for Pin Settings tab */}
            {activeTab === 0 && (
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
                  Pin Settings
                </Typography>
              </Box>
            )}

            {/* Content based on active tab */}
            {activeTab === 0 ? (
              <PinSettingsTab />
            ) : activeTab === 1 ? (
              <PendingRequestsTab />
            ) : activeTab === 2 ? (
              <OngoingOrdersTab />
            ) : (
              <OrderPreferencesTab />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default EpickSetting; 