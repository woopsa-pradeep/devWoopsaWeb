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
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Speed as SpeedIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import InventoryReportTab from './InventoryReportTab';
import CustomerReportTab from './CustomerReportTab';
import InventoryLabelTab from './InventoryLabelTab';
import LossQtyReportTab from './LossQtyReportTab';
import InventorySpotCheckTab from './InventorySpotCheckTab';
import ReceivingHistoryAdjustmentTab from './ReceivingHistoryAdjustmentTab';
import ARReportTab from './ARReportTab';
import ARStatementTab from './ARStatementTab';
import VelocityReportTab from './VelocityReportTab';
import ARUndepositeTab from './ARUndepositeTab';
import OpenItemReportTab from './OpenItemReportTab';
import AgingReportTab from './AgingReportTab';

const ReportsAnalytics: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [arExpanded, setArExpanded] = useState(false);
  const [tab, setTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'loss-qty') return 3;
    if (tabParam === 'inventory-spot-check') return 5;
    if (tabParam === 'receiving-adjustment') return 11;
    // Check if any AR tab is selected
    if (tabParam === 'ar-report') return 6;
    if (tabParam === 'ar-statement') return 7;
    if (tabParam === 'ar-undeposite') return 8;
    if (tabParam === 'ar-open-item') return 9;
    if (tabParam === 'ar-aging') return 10;
    return 0;
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'loss-qty') {
      setTab(3);
    } else if (tabParam === 'inventory-spot-check') {
      setTab(5);
    } else if (tabParam === 'receiving-adjustment') {
      setTab(11);
    } else if (tabParam === 'ar-report') {
      setTab(6);
      setArExpanded(true);
    } else if (tabParam === 'ar-statement') {
      setTab(7);
      setArExpanded(true);
    } else if (tabParam === 'ar-undeposite') {
      setTab(8);
      setArExpanded(true);
    } else if (tabParam === 'ar-open-item') {
      setTab(9);
      setArExpanded(true);
    } else if (tabParam === 'ar-aging') {
      setTab(10);
      setArExpanded(true);
    }
  }, [searchParams]);

  // Auto-expand AR when an AR tab is selected
  useEffect(() => {
    if (tab >= 6 && tab <= 10) {
      setArExpanded(true);
    }
  }, [tab]);

  // Auto-expand Inventory when an Inventory tab is selected
  useEffect(() => {
    if (tab === 0 || tab === 5) {
      setInventoryExpanded(true);
    }
  }, [tab]);


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
      case 4:
        return <VelocityReportTab />;
      case 5:
        return <InventorySpotCheckTab />;
      case 11:
        return <ReceivingHistoryAdjustmentTab />;
      case 6:
        return <ARReportTab />;
      case 7:
        return <ARStatementTab />;
      case 8:
        return <ARUndepositeTab />;
      case 9:
        return <OpenItemReportTab />;
      case 10:
        return <AgingReportTab />;
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

        <Box
          sx={{
            flexGrow: 1,
            height: isMobile ? 'auto' : 'calc(100% - 56px)',
            overflow: 'auto',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {/* Inventory Expandable Group */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              onClick={() => setInventoryExpanded(!inventoryExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                minHeight: 48,
                height: 48,
                px: sidebarOpen ? 2 : 1,
                mx: sidebarOpen ? 0.5 : 0,
                borderRadius: 1.5,
                cursor: 'pointer',
                color: (tab === 0 || tab === 5) ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: (tab === 0 || tab === 5)
                  ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                  : 'transparent',
                fontWeight: (tab === 0 || tab === 5) ? 600 : 400,
                borderLeft: (tab === 0 || tab === 5) && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 1.5 : 0, flex: 1 }}>
                <InventoryIcon sx={{ fontSize: 20 }} />
                {sidebarOpen && (
                  <Typography sx={{ textTransform: 'none', fontSize: '0.875rem' }}>
                    Inventory
                  </Typography>
                )}
              </Box>
              {sidebarOpen && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInventoryExpanded(!inventoryExpanded);
                  }}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {inventoryExpanded ? (
                    <ExpandLess sx={{ fontSize: 18 }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              )}
            </Box>

            {inventoryExpanded && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  ml: sidebarOpen ? 3 : 0,
                  mt: 0.25,
                  gap: 0.25,
                }}
              >
                <Box
                  onClick={() => {
                    setTab(0);
                    setSearchParams({});
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 0 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 0
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 0 ? 600 : 400,
                    borderLeft: tab === 0 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Inventory Report
                    </Typography>
                  )}
                </Box>
                <Box
                  onClick={() => {
                    setTab(5);
                    setSearchParams({ tab: 'inventory-spot-check' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 5 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 5
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 5 ? 600 : 400,
                    borderLeft: tab === 5 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Inventory Spot Check
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Regular Tabs */}
          <Tabs
            orientation={isMobile ? "horizontal" : "vertical"}
            variant={isMobile ? "scrollable" : "standard"}
            value={tab >= 1 && tab <= 4 ? tab - 1 : false}
            onChange={(_, v) => {
              const newTab = v + 1;
              setTab(newTab);
              if (newTab === 3) {
                setSearchParams({ tab: 'loss-qty' });
              } else {
                setSearchParams({});
              }
            }}
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: 0.5,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                alignItems: sidebarOpen ? 'stretch' : 'center',
              },
            }}
            TabIndicatorProps={{ style: { display: "none" } }}
          >
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
            <Tab
              label={sidebarOpen ? "Velocity Report" : ""}
              icon={<SpeedIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              sx={{
                alignItems: "center",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                textTransform: "none",
                minHeight: 48,
                height: 48,
                width: sidebarOpen ? 'auto' : '100%',
                fontWeight: tab === 4 ? 500 : 400,
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

          {/* AR Expandable Tab */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              onClick={() => setArExpanded(!arExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                minHeight: 48,
                height: 48,
                px: sidebarOpen ? 2 : 1,
                mx: sidebarOpen ? 0.5 : 0,
                borderRadius: 1.5,
                cursor: 'pointer',
                color: (tab >= 6 && tab <= 10) ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: (tab >= 6 && tab <= 10) 
                  ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                  : 'transparent',
                fontWeight: (tab >= 6 && tab <= 10) ? 600 : 400,
                borderLeft: (tab >= 6 && tab <= 10) && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 1.5 : 0, flex: 1 }}>
                <AccountBalanceIcon sx={{ fontSize: 20 }} />
                {sidebarOpen && (
                  <Typography sx={{ textTransform: 'none', fontSize: '0.875rem' }}>
                    AR
                  </Typography>
                )}
              </Box>
              {sidebarOpen && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArExpanded(!arExpanded);
                  }}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {arExpanded ? (
                    <ExpandLess sx={{ fontSize: 18 }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              )}
            </Box>

            {/* Nested AR Tabs */}
            {arExpanded && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  ml: sidebarOpen ? 3 : 0,
                  mt: 0.25,
                  gap: 0.25,
                }}
              >
                <Box
                  onClick={() => {
                    setTab(6);
                    setSearchParams({ tab: 'ar-report' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 6 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 6
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 6 ? 600 : 400,
                    borderLeft: tab === 6 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <AccountBalanceIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      AR Deposite
                    </Typography>
                  )}
                </Box>
                <Box
                  onClick={() => {
                    setTab(7);
                    setSearchParams({ tab: 'ar-statement' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 7 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 7
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 7 ? 600 : 400,
                    borderLeft: tab === 7 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      AR Statement
                    </Typography>
                  )}
                </Box>
                <Box
                  onClick={() => {
                    setTab(8);
                    setSearchParams({ tab: 'ar-undeposite' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 8 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 8
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 8 ? 600 : 400,
                    borderLeft: tab === 8 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      AR Undeposite
                    </Typography>
                  )}
                </Box>
                <Box
                  onClick={() => {
                    setTab(9);
                    setSearchParams({ tab: 'ar-open-item' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 9 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 9
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 9 ? 600 : 400,
                    borderLeft: tab === 9 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Open Item Report
                    </Typography>
                  )}
                </Box>
                <Box
                  onClick={() => {
                    setTab(10);
                    setSearchParams({ tab: 'ar-aging' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? 32 : 48,
                    py: sidebarOpen ? 0.25 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? 'auto' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 10 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 10
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 10 ? 600 : 400,
                    borderLeft: tab === 10 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Aging Report
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* PO Report - Last tab below AR */}
          <Box
            onClick={() => {
              setTab(11);
              setSearchParams({ tab: 'receiving-adjustment' });
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              minHeight: 48,
              height: 48,
              px: sidebarOpen ? 2 : 1,
              mx: sidebarOpen ? 0.5 : 0,
              borderRadius: 1.5,
              cursor: 'pointer',
              color: tab === 11 ? theme.palette.primary.main : theme.palette.text.secondary,
              backgroundColor: tab === 11
                ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                : 'transparent',
              fontWeight: tab === 11 ? 600 : 400,
              borderLeft: tab === 11 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 1.5 : 0 }}>
              <HistoryIcon sx={{ fontSize: 20 }} />
              {sidebarOpen && (
                <Typography sx={{ textTransform: 'none', fontSize: '0.875rem' }}>
                  PO Report
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
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
