import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Label as LabelIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Speed as SpeedIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Event as EventIcon,
  Block as BlockIcon,
  Leaderboard as LeaderboardIcon,
  CalendarToday as CalendarTodayIcon,
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import InventoryReportTab from './InventoryReportTab';
import CustomerReportTab from './CustomerReportTab';
import CustomerWithProfitTab from './CustomerWithProfitTab';
import CustomerLastSaleReportTab from './CustomerLastSaleReportTab';
import CustomerNoSalesReportTab from './CustomerNoSalesReportTab';
import CustomerRankingSalesTab from './CustomerRankingSalesTab';
import DailySalesReportTab from './DailySalesReportTab';
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
import VelocityReportSalesRepTab from './VelocityReportSalesRepTab';
import CustomerVelocityReportPointsItemTab from './CustomerVelocityReportPointsItemTab';
import CustomerVelocityReportPointsTab from './CustomerVelocityReportPointsTab';
import PriceClassGroupRebatesReportTab from './PriceClassGroupRebatesReportTab';

const ReportsAnalytics: React.FC = () => {
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [velocityExpanded, setVelocityExpanded] = useState(false);
  const [arExpanded, setArExpanded] = useState(false);
  const [tab, setTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'customer') return 1;
    if (tabParam === 'customer-with-profit') return 12;
    if (tabParam === 'customer-last-sale') return 13;
    if (tabParam === 'customer-no-sales') return 14;
    if (tabParam === 'customer-ranking-sales') return 15;
    if (tabParam === 'daily-sales') return 16;
    if (tabParam === 'customer-velocity-sales-rep') return 17;
    if (tabParam === 'customer-velocity-points-item') return 18;
    if (tabParam === 'customer-velocity-points') return 19;
    if (tabParam === 'price-class-group-rebates') return 20;
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

  // Sync expanded groups from URL/tab, keeping accordion behavior
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'customer') {
      setTab(1);
    } else if (tabParam === 'customer-with-profit') {
      setTab(12);
    } else if (tabParam === 'customer-last-sale') {
      setTab(13);
    } else if (tabParam === 'customer-no-sales') {
      setTab(14);
    } else if (tabParam === 'customer-ranking-sales') {
      setTab(15);
    } else if (tabParam === 'daily-sales') {
      setTab(16);
    } else if (tabParam === 'customer-velocity-sales-rep') {
      setTab(17);
    } else if (tabParam === 'customer-velocity-points-item') {
      setTab(18);
    } else if (tabParam === 'customer-velocity-points') {
      setTab(19);
    } else if (tabParam === 'price-class-group-rebates') {
      setTab(20);
    } else if (tabParam === 'loss-qty') {
      setTab(3);
    } else if (tabParam === 'inventory-spot-check') {
      setTab(5);
    } else if (tabParam === 'receiving-adjustment') {
      setTab(11);
    } else if (tabParam === 'ar-report') {
      setTab(6);
    } else if (tabParam === 'ar-statement') {
      setTab(7);
    } else if (tabParam === 'ar-undeposite') {
      setTab(8);
    } else if (tabParam === 'ar-open-item') {
      setTab(9);
    } else if (tabParam === 'ar-aging') {
      setTab(10);
    } else if (tabParam === 'velocity') {
      setTab(4);
    }
  }, [searchParams]);

  // Auto-expand correct group from active tab; only one open at a time
  useEffect(() => {
    if (tab === 0 || tab === 5) {
      setInventoryExpanded(true);
      setCustomerExpanded(false);
      setVelocityExpanded(false);
      setArExpanded(false);
    } else if (tab === 1 || (tab >= 12 && tab <= 16)) {
      setInventoryExpanded(false);
      setCustomerExpanded(true);
      setVelocityExpanded(false);
      setArExpanded(false);
    } else if (tab === 4 || (tab >= 17 && tab <= 20)) {
      setInventoryExpanded(false);
      setCustomerExpanded(false);
      setVelocityExpanded(true);
      setArExpanded(false);
    } else if (tab >= 6 && tab <= 10) {
      setInventoryExpanded(false);
      setCustomerExpanded(false);
      setVelocityExpanded(false);
      setArExpanded(true);
    }
  }, [tab]);


  const sidebarWidth = sidebarOpen ? 250 : 72;

  const isCustomerGroupActive = tab === 1 || (tab >= 12 && tab <= 16);
  const isVelocityGroupActive = tab === 4 || (tab >= 17 && tab <= 20);

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
      case 12:
        return <CustomerWithProfitTab />;
      case 13:
        return <CustomerLastSaleReportTab />;
      case 14:
        return <CustomerNoSalesReportTab />;
      case 15:
        return <CustomerRankingSalesTab />;
      case 16:
        return <DailySalesReportTab />;
      case 17:
        return <VelocityReportSalesRepTab />;
      case 18:
        return <CustomerVelocityReportPointsItemTab />;
      case 19:
        return <CustomerVelocityReportPointsTab />;
      case 20:
        return <PriceClassGroupRebatesReportTab />;
      default:
        return <InventoryReportTab />;
    }
  };

  // Each expandable sub-menu (Inventory, Customer, AR) has its own small height + scroll
  const SUBMENU_INNER_MAX_HEIGHT = 220;

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      mt={2}
      gap={3}
      sx={{
        height: { xs: 'auto', md: '98%' },
        minHeight: { xs: 0, md: 0 },
        px: { xs: 1, md: 2 },
      }}
    >
      {/* Left Sidebar - normal height; inner sub-menus have their own scroll */}
      <Paper
        elevation={1}
        sx={{
          width: { xs: "100%", md: sidebarWidth },
          minWidth: { xs: "100%", md: sidebarWidth },
          maxWidth: { xs: "100%", md: sidebarWidth },
          borderRadius: 2,
          // Ensure the sidebar is always scrollable and tabs never get hidden
          // even when the browser height is reduced (e.g. DevTools open).
          height: { xs: "auto", md: '100%' },
          minHeight: { xs: 0, md: 0 },
          maxHeight: { xs: 'calc(100vh - 140px)', md: '100%' },
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          overflow: { xs: 'auto', md: 'auto' },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            flexShrink: 0,
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

          {/* Sub-tab menu area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
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
              onClick={() => {
                const next = !inventoryExpanded;
                setInventoryExpanded(next);
                if (next) {
                  setCustomerExpanded(false);
                  setVelocityExpanded(false);
                  setArExpanded(false);
                }
              }}
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
                    const next = !inventoryExpanded;
                    setInventoryExpanded(next);
                    if (next) {
                      setCustomerExpanded(false);
                      setVelocityExpanded(false);
                      setArExpanded(false);
                    }
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
                  maxHeight: SUBMENU_INNER_MAX_HEIGHT,
                  overflowY: 'auto',
                  overflowX: 'hidden',
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

          {/* Customer Expandable Group */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              onClick={() => {
                const next = !customerExpanded;
                setCustomerExpanded(next);
                if (next) {
                  setInventoryExpanded(false);
                  setVelocityExpanded(false);
                  setArExpanded(false);
                }
              }}
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
                color: isCustomerGroupActive ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: isCustomerGroupActive
                  ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                  : 'transparent',
                fontWeight: isCustomerGroupActive ? 600 : 400,
                borderLeft: isCustomerGroupActive && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 1.5 : 0, flex: 1 }}>
                <PeopleIcon sx={{ fontSize: 20 }} />
                {sidebarOpen && (
                  <Typography sx={{ textTransform: 'none', fontSize: '0.875rem' }}>
                    Customer
                  </Typography>
                )}
              </Box>
              {sidebarOpen && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !customerExpanded;
                    setCustomerExpanded(next);
                    if (next) {
                      setInventoryExpanded(false);
                      setVelocityExpanded(false);
                      setArExpanded(false);
                    }
                  }}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {customerExpanded ? (
                    <ExpandLess sx={{ fontSize: 18 }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              )}
            </Box>

            {customerExpanded && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  ml: sidebarOpen ? 3 : 0,
                  mt: 0.25,
                  gap: 0.25,
                  maxHeight: SUBMENU_INNER_MAX_HEIGHT,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                <Box
                  onClick={() => {
                    setTab(1);
                    setSearchParams({ tab: 'customer' });
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
                    color: tab === 1 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 1
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 1 ? 600 : 400,
                    borderLeft: tab === 1 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Basic
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(12);
                    setSearchParams({ tab: 'customer-with-profit' });
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
                    color: tab === 12 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 12
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 12 ? 600 : 400,
                    borderLeft: tab === 12 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      With Profit
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(13);
                    setSearchParams({ tab: 'customer-last-sale' });
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
                    color: tab === 13 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 13
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 13 ? 600 : 400,
                    borderLeft: tab === 13 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <EventIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Last Sale
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(14);
                    setSearchParams({ tab: 'customer-no-sales' });
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
                    color: tab === 14 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 14
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 14 ? 600 : 400,
                    borderLeft: tab === 14 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <BlockIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      No Sales
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(15);
                    setSearchParams({ tab: 'customer-ranking-sales' });
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
                    color: tab === 15 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 15
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 15 ? 600 : 400,
                    borderLeft: tab === 15 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <LeaderboardIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Ranking Sales
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(16);
                    setSearchParams({ tab: 'daily-sales' });
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
                    color: tab === 16 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 16
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 16 ? 600 : 400,
                    borderLeft: tab === 16 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <CalendarTodayIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Daily Sales
                    </Typography>
                  )}
                </Box>

              </Box>
            )}
          </Box>

          {/* Velocity Expandable Group */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              mt: 0.5,
            }}
          >
            <Box
              onClick={() => {
                const next = !velocityExpanded;
                setVelocityExpanded(next);
                if (next) {
                  setInventoryExpanded(false);
                  setCustomerExpanded(false);
                  setArExpanded(false);
                }
              }}
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
                color: isVelocityGroupActive ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: isVelocityGroupActive
                  ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                  : 'transparent',
                fontWeight: isVelocityGroupActive ? 600 : 400,
                borderLeft: isVelocityGroupActive && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 1.5 : 0, flex: 1 }}>
                <SpeedIcon sx={{ fontSize: 20 }} />
                {sidebarOpen && (
                  <Typography sx={{ textTransform: 'none', fontSize: '0.875rem' }}>
                    Velocity
                  </Typography>
                )}
              </Box>
              {sidebarOpen && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !velocityExpanded;
                    setVelocityExpanded(next);
                    if (next) {
                      setInventoryExpanded(false);
                      setCustomerExpanded(false);
                      setArExpanded(false);
                    }
                  }}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {velocityExpanded ? (
                    <ExpandLess sx={{ fontSize: 18 }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              )}
            </Box>

            {velocityExpanded && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  ml: sidebarOpen ? 3 : 0,
                  mt: 0.25,
                  gap: 0.25,
                  maxHeight: SUBMENU_INNER_MAX_HEIGHT,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                <Box
                  onClick={() => {
                    setTab(4);
                    setSearchParams({ tab: 'velocity' });
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
                    color: tab === 4 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 4
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 4 ? 600 : 400,
                    borderLeft: tab === 4 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <SpeedIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Basic
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(17);
                    setSearchParams({ tab: 'customer-velocity-sales-rep' });
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
                    color: tab === 17 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 17
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 17 ? 600 : 400,
                    borderLeft: tab === 17 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <SpeedIcon sx={{ fontSize: 16 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1 }}>
                      Sales Rep
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(18);
                    setSearchParams({ tab: 'customer-velocity-points-item' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: sidebarOpen ? 'flex-start' : 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? undefined : 48,
                    py: sidebarOpen ? 0.5 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? '100%' : '100%',
                    maxWidth: sidebarOpen ? '100%' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 18 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 18
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 18 ? 600 : 400,
                    borderLeft: tab === 18 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    flexShrink: 0,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <SpeedIcon sx={{ fontSize: 16, mt: sidebarOpen ? 0.15 : 0, flexShrink: 0 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1, flex: 1, minWidth: 0, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      Customer (Points: Item)
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(19);
                    setSearchParams({ tab: 'customer-velocity-points' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: sidebarOpen ? 'flex-start' : 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? undefined : 48,
                    py: sidebarOpen ? 0.5 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? '100%' : '100%',
                    maxWidth: sidebarOpen ? '100%' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 19 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 19
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 19 ? 600 : 400,
                    borderLeft: tab === 19 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    flexShrink: 0,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <SpeedIcon sx={{ fontSize: 16, mt: sidebarOpen ? 0.15 : 0, flexShrink: 0 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1, flex: 1, minWidth: 0, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      Customer (Points: Sales Detail)
                    </Typography>
                  )}
                </Box>

                <Box
                  onClick={() => {
                    setTab(20);
                    setSearchParams({ tab: 'price-class-group-rebates' });
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: sidebarOpen ? 'flex-start' : 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: sidebarOpen ? 32 : 48,
                    height: sidebarOpen ? undefined : 48,
                    py: sidebarOpen ? 0.5 : 0,
                    px: sidebarOpen ? 1.5 : 0,
                    width: sidebarOpen ? '100%' : '100%',
                    maxWidth: sidebarOpen ? '100%' : '100%',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    color: tab === 20 ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: tab === 20
                      ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                      : 'transparent',
                    fontWeight: tab === 20 ? 600 : 400,
                    borderLeft: tab === 20 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease-in-out',
                    flexShrink: 0,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <SpeedIcon sx={{ fontSize: 16, mt: sidebarOpen ? 0.15 : 0, flexShrink: 0 }} />
                  {sidebarOpen && (
                    <Typography sx={{ textTransform: 'none', fontSize: '0.75rem', ml: 1, flex: 1, minWidth: 0, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      Price Class Group Rebates
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Other Reports (Inventory Label, Loss Qty) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              mt: 0.5,
              gap: 0.25,
            }}
          >
            <Box
              onClick={() => {
                setTab(2);
                setSearchParams({});
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                minHeight: 40,
                px: sidebarOpen ? 2 : 1,
                mx: sidebarOpen ? 0.5 : 0,
                borderRadius: 1.5,
                cursor: 'pointer',
                color: tab === 2 ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: tab === 2
                  ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                  : 'transparent',
                fontWeight: tab === 2 ? 600 : 400,
                borderLeft: tab === 2 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <LabelIcon sx={{ fontSize: 18 }} />
              {sidebarOpen && (
                <Typography sx={{ textTransform: 'none', fontSize: '0.8rem', ml: 1.25 }}>
                  Inventory Label
                </Typography>
              )}
            </Box>

            <Box
              onClick={() => {
                setTab(3);
                setSearchParams({ tab: 'loss-qty' });
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                minHeight: 40,
                px: sidebarOpen ? 2 : 1,
                mx: sidebarOpen ? 0.5 : 0,
                borderRadius: 1.5,
                cursor: 'pointer',
                color: tab === 3 ? theme.palette.primary.main : theme.palette.text.secondary,
                backgroundColor: tab === 3
                  ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)')
                  : 'transparent',
                fontWeight: tab === 3 ? 600 : 400,
                borderLeft: tab === 3 && sidebarOpen ? `3px solid ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <TrendingDownIcon sx={{ fontSize: 18 }} />
              {sidebarOpen && (
                <Typography sx={{ textTransform: 'none', fontSize: '0.8rem', ml: 1.25 }}>
                  Loss Qty Report
                </Typography>
              )}
            </Box>

          </Box>

          {/* AR Expandable Tab */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              onClick={() => {
                const next = !arExpanded;
                setArExpanded(next);
                if (next) {
                  setInventoryExpanded(false);
                  setCustomerExpanded(false);
                  setVelocityExpanded(false);
                }
              }}
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
                    const next = !arExpanded;
                    setArExpanded(next);
                    if (next) {
                      setInventoryExpanded(false);
                      setCustomerExpanded(false);
                      setVelocityExpanded(false);
                    }
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
                  maxHeight: SUBMENU_INNER_MAX_HEIGHT,
                  overflowY: 'auto',
                  overflowX: 'hidden',
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
