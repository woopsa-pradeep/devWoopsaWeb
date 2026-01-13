import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  IconButton,
  Tabs,
  Tab,
  useMediaQuery,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Label as LabelIcon,
  TrendingDown as TrendingDownIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import InventoryReportTab from './InventoryReportTab';
import CustomerReportTab from './CustomerReportTab';
import InventoryLabelTab from './InventoryLabelTab';
import LossQtyReportTab from './LossQtyReportTab';

const ReportsAnalytics: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'loss-qty') return 3;
    return 0;
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'loss-qty') {
      setTab(3);
    }
  }, [searchParams]);


  const sidebarWidth = sidebarOpen ? 250 : 72;

  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (tab) {
      case 0:
        return <InventoryReportTab />;
      case 1:
        return <CustomerReportTab />;
      case 2:
        return <InventoryLabelTab />;
      case 3:
        return <LossQtyReportTab />;
      default:
        return <InventoryReportTab />;
    }
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      mt={2}
      gap={3}
      sx={{
        height: { xs: 'auto', md: 'calc(100vh - 200px)' },
        px: { xs: 1, md: 2 }
      }}
    >
      {/* Left Sidebar - Tabs (Collapsible) */}
      <Paper 
        elevation={1}
        sx={{
          width: { xs: "100%", md: sidebarWidth },
          minWidth: { xs: "100%", md: sidebarWidth },
          maxWidth: { xs: "100%", md: sidebarWidth },
          borderRadius: 2,
          height: { xs: "auto", md: '100%' },
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          overflow: 'hidden',
        }}
      >
        {/* Header with Toggle Button */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            p: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            minHeight: 56,
          }}
        >
          {sidebarOpen && (
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Reports
            </Typography>
          )}
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="small"
            sx={{
              ml: sidebarOpen ? 'auto' : 0,
              width: 32,
              height: 32,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: theme.palette.primary.main,
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {sidebarOpen ? (
              <ChevronLeft sx={{ fontSize: 18 }} />
            ) : (
              <ChevronRight sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>

        <Tabs
          orientation={isMobile ? "horizontal" : "vertical"}
          variant={isMobile ? "scrollable" : "standard"}
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            if (v === 3) {
              setSearchParams({ tab: 'loss-qty' });
            } else {
              setSearchParams({});
            }
          }}
          sx={{
            flexGrow: 1,
            height: isMobile ? 'auto' : 'calc(100% - 56px)',
            '& .MuiTabs-flexContainer': {
              gap: 0.5,
              p: 1,
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              alignItems: sidebarOpen ? 'stretch' : 'center',
            },
          }}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          <Tab
            label={sidebarOpen ? "Inventory" : ""}
            icon={<InventoryIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            sx={{
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              textTransform: "none",
              minHeight: 48,
              height: 48,
              width: sidebarOpen ? 'auto' : '100%',
              fontWeight: tab === 0 ? 500 : 400,
              gap: sidebarOpen ? 1.5 : 0,
              px: sidebarOpen ? 2 : 0,
              mx: sidebarOpen ? 0.5 : 0,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease-in-out',
              '& .MuiTab-iconWrapper': {
                margin: sidebarOpen ? '0' : '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.16)'
                  : 'rgba(25, 118, 210, 0.08)',
                fontWeight: 600,
                borderLeft: sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.2)'
                    : 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          />
          <Tab
            label={sidebarOpen ? "Customer" : ""}
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            sx={{
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              textTransform: "none",
              minHeight: 48,
              height: 48,
              width: sidebarOpen ? 'auto' : '100%',
              fontWeight: tab === 1 ? 500 : 400,
              gap: sidebarOpen ? 1.5 : 0,
              px: sidebarOpen ? 2 : 0,
              mx: sidebarOpen ? 0.5 : 0,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease-in-out',
              '& .MuiTab-iconWrapper': {
                margin: sidebarOpen ? '0' : '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.16)'
                  : 'rgba(25, 118, 210, 0.08)',
                fontWeight: 600,
                borderLeft: sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.2)'
                    : 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          />
          <Tab
            label={sidebarOpen ? "Inventory Label" : ""}
            icon={<LabelIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            sx={{
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              textTransform: "none",
              minHeight: 48,
              height: 48,
              width: sidebarOpen ? 'auto' : '100%',
              fontWeight: tab === 2 ? 500 : 400,
              gap: sidebarOpen ? 1.5 : 0,
              px: sidebarOpen ? 2 : 0,
              mx: sidebarOpen ? 0.5 : 0,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease-in-out',
              '& .MuiTab-iconWrapper': {
                margin: sidebarOpen ? '0' : '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.16)'
                  : 'rgba(25, 118, 210, 0.08)',
                fontWeight: 600,
                borderLeft: sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.2)'
                    : 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          />
          <Tab
            label={sidebarOpen ? "Loss Qty Report" : ""}
            icon={<TrendingDownIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            sx={{
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              textTransform: "none",
              minHeight: 48,
              height: 48,
              width: sidebarOpen ? 'auto' : '100%',
              fontWeight: tab === 3 ? 500 : 400,
              gap: sidebarOpen ? 1.5 : 0,
              px: sidebarOpen ? 2 : 0,
              mx: sidebarOpen ? 0.5 : 0,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease-in-out',
              '& .MuiTab-iconWrapper': {
                margin: sidebarOpen ? '0' : '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.16)'
                  : 'rgba(25, 118, 210, 0.08)',
                fontWeight: 600,
                borderLeft: sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.2)'
                    : 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          />
        </Tabs>
      </Paper>

      {/* Right Content - Tab Content */}
      <Paper sx={{
        flexGrow: 1,
        minWidth: 0,
        borderRadius: 3,
        boxShadow: "none",
        height: { xs: "auto", md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {renderTabContent()}
      </Paper>
    </Box>
  );
};

export default ReportsAnalytics;
