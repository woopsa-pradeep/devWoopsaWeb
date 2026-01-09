// AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Stack,
  Button,
  IconButton,
  Fade,
  Grow,
  // useMediaQuery,
  alpha,
} from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import DashboardCard from "../../../component/atoms/dashboard/DashboardCard";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import RetailersIcon from "../../../assets/retailerGlobalActive.svg";
import ItemsIcon from "../../../assets/Menu Icon (2).svg";
import OrdersIcon from "../../../assets/orderItems.svg";
import { getDistributorDashboard, getEpickDashboard } from "../../../redux/apis/dashboardApis";
import CustomDatePicker from "../../../component/atoms/CustomDatePicker";
import dayjs from "dayjs";
import LoadingSpinner from "../../../component/atoms/loader/LoadingSpinner";
import ClearIcon from "@mui/icons-material/Clear";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import PersonIcon from "@mui/icons-material/Person";
// import TrendingUpIcon from "@mui/icons-material/TrendingUp";
// import StoreIcon from "@mui/icons-material/Store";
// import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
// import PeopleIcon from "@mui/icons-material/People";

interface DashboardData {
  summary: {
    totalActiveCustomer: number;
    totalCustomer: number;
    totalInactiveCustomer: number;
    totalOrder: number;
  };
  orderByUser: {
    sales: number;
    retailer: number;
  };
  orderPlatform: {
    Mobile: number;
    Web: number;
    ERP: number;
  };
  highDemandProducts: Array<{
    Item_Number: number;
    totalQuantityOrdered: number;
    orderCount: number;
    inventory: {
      Item_Number: number;
      Description: string;
      Pack: number;
      CaseCount: number;
      UOM: string;
    };
  }>;
  salesPersonPerformance: Array<{
    salesRepNumber: number;
    salesRepName: string;
    totalSales: number;
    orderCount: number;
    totalQuantity: number;
  }>;
}

interface EpickDashboardData {
  orderStatistics: {
    totalOrders: number;
    totalOrdersFromHeader: number;
    totalCompletedOrders: number;
    completedByEpick: number;
    pendingFromEpick: number;
    totalCheckerOrders: number;
    ordersCompletedByChecker: number;
  };
  scanningStatistics: {
    totalScannedItems: number;
    totalScannedLines: number;
    totalTimeSeconds: number;
    totalTimeFormatted: string;
  };
  overrideRequestStatistics: {
    totalRequests: number;
    totalAcceptedRequests: number;
    totalRejectedRequests: number;
  };
  pickerWiseOrders: Array<{
    pickerId: number;
    pickerName: string;
    totalCompletedOrders: number;
    averageOrderTime: {
      averageTimeSeconds: number;
      averageTimeFormatted: string;
    };
    averageTimePerQuantity: {
      secondsPerQty: number;
      formatted: string;
    };
    totalScannedQuantity: number;
    totalOverrideRequests: number;
  }>;
  averageOrderTime: {
    averageTimeSeconds: number;
    averageTimeFormatted: string;
    averageTimePerQuantity: {
      secondsPerQty: number;
      formatted: string;
    };
  };
  dateRange: {
    fromDate: string;
    toDate: string;
  };
}

const AdminDashboard = () => {
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [epickData, setEpickData] = useState<EpickDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [epickLoading, setEpickLoading] = useState(false);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["Mobile", "Web", "ERP"])
  );
  const [highDemandViewMode, setHighDemandViewMode] = useState<"table" | "graph">("table");
  const [pickerViewMode, setPickerViewMode] = useState<"table" | "graph">("table");
  const [salesPerformanceViewMode, setSalesPerformanceViewMode] = useState<"table" | "graph">("table");
  const [averageTimePerQtyViewMode, setAverageTimePerQtyViewMode] = useState<"table" | "graph">("graph");
  const [scannedQtyViewMode, setScannedQtyViewMode] = useState<"table" | "graph">("graph");
  const [scanningStatsViewMode, setScanningStatsViewMode] = useState<"table" | "graph">("graph");
  const [overrideStatsViewMode, setOverrideStatsViewMode] = useState<"table" | "graph">("graph");

  useEffect(() => {
    if ((startDate && endDate) || (!startDate && !endDate)) {
      fetchDashboardData();
    }
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setEpickLoading(true);
      const [dashboardRes, epickRes]: any = await Promise.all([
        getDistributorDashboard({
          fromDate: startDate?.format("YYYY-MM-DD") || "",
          toDate: endDate?.format("YYYY-MM-DD") || "",
        }),
        getEpickDashboard({
          fromDate: startDate?.format("YYYY-MM-DD") || "",
          toDate: endDate?.format("YYYY-MM-DD") || "",
        }),
      ]);
      setDashboardData(dashboardRes.data);
      setEpickData(epickRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setEpickLoading(false);
    }
  };

  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: dayjs.Dayjs | null) => {
    setEndDate(date);
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
  //   setActiveTab(newValue);
  // };

  // Sales/Retailer Summary Cards
  const summaryCards = dashboardData
    ? [
        {
          title: "Total Retailers",
          value: dashboardData.summary.totalCustomer.toString(),
          color: "success" as const,
          icon: <img src={RetailersIcon} alt="retailers" width={20} height={20} />,
        },
        {
          title: "Total Active Retailers",
          value: dashboardData.summary.totalActiveCustomer.toString(),
          color: "success" as const,
          icon: <img src={ItemsIcon} alt="active" width={20} height={20} />,
        },
        {
          title: "Total Inactive Retailers",
          value: dashboardData.summary.totalInactiveCustomer.toString(),
          color: "success" as const,
          icon: <img src={ItemsIcon} alt="inactive" width={20} height={20} />,
        },
        {
          title: "Total Orders",
          value: dashboardData.summary.totalOrder.toString(),
          color: "success" as const,
          icon: <img src={OrdersIcon} alt="orders" width={20} height={20} />,
        },
      ]
    : [];

  // Epick Summary Cards
  const epickCards = epickData
    ? [
        {
          title: "Total Epick Orders",
          value: epickData.orderStatistics.totalOrders.toString(),
          color: "success" as const,
          icon: <img src={OrdersIcon} alt="orders" width={20} height={20} />,
        },
        {
          title: "Completed by Epick",
          value: epickData.orderStatistics.completedByEpick.toString(),
          color: "success" as const,
          icon: <CheckCircleIcon sx={{ width: 20, height: 20, color: theme.palette.success.main }} />,
        },
        {
          title: "Pending from Epick",
          value: epickData.orderStatistics.pendingFromEpick.toString(),
          color: "warning" as const,
          icon: <PendingIcon sx={{ width: 20, height: 20, color: theme.palette.warning.main }} />,
        },
        {
          title: "Average Order Time",
          value: epickData.averageOrderTime.averageTimeFormatted,
          color: "success" as const,
          icon: <AccessTimeIcon sx={{ width: 20, height: 20, color: theme.palette.info.main }} />,
        },
        {
          title: "Orders Ready for Checker",
          value: epickData?.orderStatistics.totalCheckerOrders?.toString(),
          color: "warning" as const,
          icon: <PersonIcon sx={{ width: 20, height: 20, color: theme.palette.warning.main }} />,
        },
        {
          title: "Completed by Checker",
          value: epickData?.orderStatistics.ordersCompletedByChecker?.toString(),
          color: "success" as const,
          icon: <CheckCircleIcon sx={{ width: 20, height: 20, color: theme.palette.success.main }} />,
        },
      ]
    : [];

  // Chart Data Preparation
  const allPlatformData = dashboardData
    ? [
        { name: "Mobile", value: dashboardData.orderPlatform.Mobile, color: "#FF9800" },
        { name: "Web", value: dashboardData.orderPlatform.Web, color: "#4CAF50" },
        { name: "ERP", value: dashboardData.orderPlatform.ERP, color: "#3C50E0" },
      ]
    : [];

  const platformData = allPlatformData.filter((item) => selectedPlatforms.has(item.name));

  const handlePlatformToggle = (platformName: string) => {
    setSelectedPlatforms((prev: Set<string>) => {
      const newSelected = new Set(prev);
      if (newSelected.has(platformName)) {
        newSelected.delete(platformName);
      } else {
        newSelected.add(platformName);
      }
      return newSelected;
    });
  };

  const salesPersonData = dashboardData
    ? dashboardData.salesPersonPerformance.map((person) => ({
        name: person.salesRepName,
        Sales: person.totalSales,
        Orders: person.orderCount,
        Quantity: person.totalQuantity,
      }))
    : [];

  const highDemandBarData = dashboardData?.highDemandProducts.map((product) => ({
    name: product.inventory.Description.length > 20 
      ? product.inventory.Description.substring(0, 20) + "..." 
      : product.inventory.Description,
    fullName: product.inventory.Description,
    quantity: product.totalQuantityOrdered,
    orders: product.orderCount,
    itemNumber: product.Item_Number,
    pack: product.inventory.Pack,
    caseCount: product.inventory.CaseCount,
    uom: product.inventory.UOM,
  })) || [];

  const pickerBarData = epickData?.pickerWiseOrders.map((picker) => ({
    name: picker.pickerName,
    completedOrders: picker.totalCompletedOrders,
    averageTime: picker.averageOrderTime.averageTimeSeconds / 3600, // Convert to hours
    averageTimeFormatted: picker.averageOrderTime.averageTimeFormatted,
  })) || [];

  // Table Columns
  const highDemandColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item Name",
      render: (row) => (
        <Typography fontSize={13} fontWeight={500} color="text.primary">
          {row.inventory.Description}
        </Typography>
      ),
    },
    {
      id: "itemNumber",
      label: "Item Number",
      render: (row) => (
        <Typography fontSize={13} color="text.secondary">
          {row.Item_Number}
        </Typography>
      ),
    },
    {
      id: "quantity",
      label: "Quantity Ordered",
      render: (row) => (
        <Typography fontSize={13} fontWeight={500} color="primary.main">
          {row.totalQuantityOrdered.toLocaleString()}
        </Typography>
      ),
    },
    {
      id: "orders",
      label: "Order Count",
      render: (row) => (
        <Typography fontSize={13} color="text.secondary">
          {row.orderCount}
        </Typography>
      ),
    },
    {
      id: "pack",
      label: "Pack",
      render: (row) => (
        <Typography fontSize={13} color="text.secondary">
          {row.inventory.Pack}
        </Typography>
      ),
    },
    {
      id: "caseCount",
      label: "Case Count",
      render: (row) => (
        <Typography fontSize={13} color="text.secondary">
          {row.inventory.CaseCount} {row.inventory.UOM}
        </Typography>
      ),
    },
  ];

  const salesPersonColumns: TableColumn[] = [
    {
      id: "name",
      label: "Sales Person",
      render: (row) => (
        <Typography fontSize={13} fontWeight={500} color="text.primary">
          {row.salesRepName}
        </Typography>
      ),
    },
    {
      id: "sales",
      label: "Total Sales",
      render: (row) => (
        <Typography fontSize={13} fontWeight={500} color="text.secondary">
          ${row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      id: "orders",
      label: "Order Count",
      render: (row) => (
        <Typography fontSize={13} color="text.secondary">
          {row.orderCount}
        </Typography>
      ),
    },
    {
      id: "quantity",
      label: "Total Quantity",
      render: (row) => (
        <Typography fontSize={13} color="text.secondary">
          {row.totalQuantity.toLocaleString()}
        </Typography>
      ),
    },
  ];

  const pickerColumns: TableColumn[] = [
    {
      id: "name",
      label: "Picker Name",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
          <Typography fontSize={13} fontWeight={500} color="text.primary">
            {row.pickerName}
          </Typography>
        </Box>
      ),
    },
    {
      id: "completedOrders",
      label: "Completed Orders",
      render: (row) => (
        <Typography fontSize={13} fontWeight={500} color="success.main">
          {row.totalCompletedOrders}
        </Typography>
      ),
    },
    {
      id: "averageTime",
      label: "Average Time",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
          <Typography fontSize={13} fontWeight={500} color="text.secondary">
            {row.averageOrderTime.averageTimeFormatted}
          </Typography>
        </Box>
      ),
    },
  ];

  const averageTimePerQtyColumns: TableColumn[] = [
    {
      id: "name",
      label: "Picker Name",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
              }}
            />
            <Typography fontSize={13} fontWeight={500} color="text.primary">
              {row.pickerName}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "averageTimePerQty",
      label: "Average Time Per Quantity",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: color }} />
            <Typography fontSize={13} fontWeight={500} color={color}>
              {row.averageTimePerQuantity.formatted}
            </Typography>
          </Box>
        );
      },
    },
  ];

  const scannedQtyColumns: TableColumn[] = [
    {
      id: "name",
      label: "Picker Name",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
              }}
            />
            <Typography fontSize={13} fontWeight={500} color="text.primary">
              {row.pickerName}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "scannedQuantity",
      label: "Scanned Quantity",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Typography fontSize={13} fontWeight={500} color={color}>
            {row.totalScannedQuantity.toLocaleString()}
          </Typography>
        );
      },
    },
    {
      id: "overrideRequests",
      label: "Override Requests",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Typography fontSize={13} fontWeight={500} color={alpha(color, 0.8)}>
            {row.totalOverrideRequests.toLocaleString()}
          </Typography>
        );
      },
    },
  ];

  const scanningStatsColumns: TableColumn[] = [
    {
      id: "metric",
      label: "Metric",
      render: (row: any) => (
        <Typography fontSize={13} fontWeight={500} color="text.primary">
          {row.metric}
        </Typography>
      ),
    },
    {
      id: "value",
      label: "Value",
      render: (row: any) => (
        <Typography fontSize={13} fontWeight={500} color="text.secondary">
          {row.value}
        </Typography>
      ),
    },
  ];

  const overrideStatsColumns: TableColumn[] = [
    {
      id: "type",
      label: "Request Type",
      render: (row: any) => (
        <Typography fontSize={13} fontWeight={500} color="text.primary">
          {row.type}
        </Typography>
      ),
    },
    {
      id: "count",
      label: "Count",
      render: (row: any) => (
        <Typography fontSize={13} fontWeight={500} color={row.color}>
          {row.count.toLocaleString()}
        </Typography>
      ),
    },
  ];

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={8}
          sx={{
            p: 1,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1.5,
          }}
        >
          <Typography fontSize={11} fontWeight={500} mb={0.5}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} fontSize={10} color={entry.color}>
              {entry.name}: {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };


  if (loading && !dashboardData) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return (
    <Box
      sx={{
        p: { sm: 1, md: 1.5 },
        background: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Tabs Header */}
      <Fade in={true} timeout={500}>
        <Box
          mb={2}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
            pb: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Button
              onClick={() => setActiveTab(0)}
              sx={{
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                px: 2,
                py: 0.75,
                borderRadius: 2,
                backgroundColor: activeTab === 0 ? theme.palette.primary.main : 'transparent',
                color: activeTab === 0 ? '#fff' : theme.palette.text.secondary,
                minWidth: 'auto',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: activeTab === 0 ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.08),
                  boxShadow: 'none',
                },
              }}
            >
              Sales & Retailer
            </Button>
            <Button
              onClick={() => setActiveTab(1)}
              sx={{
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                px: 2,
                py: 0.75,
                borderRadius: 2,
                backgroundColor: activeTab === 1 ? theme.palette.primary.main : 'transparent',
                color: activeTab === 1 ? '#fff' : theme.palette.text.secondary,
                minWidth: 'auto',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: activeTab === 1 ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.08),
                  boxShadow: 'none',
                },
              }}
            >
              Epick Dashboard
            </Button>
          </Box>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems="center"
            gap={1}
          >
            <CustomDatePicker
              value={startDate}
              onChange={handleStartDateChange}
              sx={{
                minWidth: { xs: "100%", sm: 120 },
                "& .MuiInputBase-root": {
                  height: 34,
                  fontSize: 12,
                },
              }}
            />
            <Typography
              fontSize={12}
              fontWeight={500}
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              to
            </Typography>
            <CustomDatePicker
              value={endDate}
              onChange={handleEndDateChange}
              sx={{
                minWidth: { xs: "100%", sm: 120 },
                "& .MuiInputBase-root": {
                  height: 34,
                  fontSize: 12,
                },
              }}
            />
            {(startDate || endDate) && (
              <IconButton
                onClick={handleClearDates}
                size="small"
                sx={{
                  backgroundColor: theme.palette.action.hover,
                  "&:hover": {
                    backgroundColor: theme.palette.action.selected,
                  },
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Fade>

      {/* Tab Content */}
      <Fade in={activeTab === 0} timeout={400} style={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={2}>
            {summaryCards.map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <DashboardCard {...card} />
              </Grid>
            ))}
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={2} mb={2}>
            {/* Platform Orders */}
            

            {/* Sales Performance */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Grow in={true} timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    height: '100%',
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      Sales Performance
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setSalesPerformanceViewMode("graph")}
                        variant={salesPerformanceViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSalesPerformanceViewMode("table")}
                        variant={salesPerformanceViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {salesPerformanceViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={dashboardData?.salesPersonPerformance || []}
                      columns={salesPersonColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={dashboardData?.salesPersonPerformance.length || 0}
                      stickyHeader={true}
                      pageSize={dashboardData?.salesPersonPerformance.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={loading}
                      containerHeight="260px"
                      emptyStateComponent={<Typography>No sales data</Typography>}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={salesPersonData}>
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={alpha(theme.palette.divider, 0.5)}
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                          axisLine={false}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Sales"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                          fill="url(#salesGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grow>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Grow in={true} timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    height: '100%',
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                    mb={1.5}
                  >
                    <Typography 
                      fontSize={14} 
                      fontWeight={500} 
                      color="text.primary"
                      sx={{
                        fontSize: { lg: 14 },
                      }}
                    >
                      <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>
                        Orders by Platform
                      </Box>
                      <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>
                        Platform
                      </Box>
                    </Typography>
                    {dashboardData?.orderByUser && (
                      <Box
                        sx={{
                          display: { xs: 'block', xl: 'flex' },
                          flexDirection: { xl: 'row' },
                          gap: { xl: 1 },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            background: alpha(theme.palette.success.main, 0.1),
                            border: `1px solid ${theme.palette.success.main}`,
                            mb: { xs: 0.75, xl: 0 },
                          }}
                        >
                          <Typography fontSize={12} fontWeight={500}>
                            Sales
                          </Typography>
                          <Typography fontSize={13} fontWeight={500} color="success.main">
                            {dashboardData.orderByUser.sales}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            background: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${theme.palette.info.main}`,
                          }}
                        >
                          <Typography fontSize={12} fontWeight={500}>
                            Retailer
                          </Typography>
                          <Typography fontSize={13} fontWeight={500} color="info.main">
                            {dashboardData.orderByUser.retailer}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ height: 220, width: "100%", mb: 1.5 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        {allPlatformData.map((entry, index) => {
                          const total = allPlatformData.reduce((sum, p) => sum + p.value, 0) || 1;
                          const percent = entry.value / total;
                          const ringWidth = 8;
                          const spacing = 3;
                          const baseInner = 40;
                          const innerRadius = baseInner + index * (ringWidth + spacing);
                          const outerRadius = innerRadius + ringWidth;
                          const startAngle = 90;
                          const endAngle = 90 - percent * 360;
                          const isSelected = selectedPlatforms.has(entry.name);
                          const progressColor = isSelected ? entry.color : theme.palette.grey[400];
                          const backgroundColor = alpha(theme.palette.divider, 0.2);

                          return (
                            <React.Fragment key={entry.name}>
                              <Pie
                                data={[{ value: 1 }]}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                                isAnimationActive={false}
                                onClick={() => handlePlatformToggle(entry.name)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Cell fill={backgroundColor} />
                              </Pie>
                              <Pie
                                data={[{ value: entry.value }]}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                cornerRadius={ringWidth / 2}
                                stroke="none"
                                paddingAngle={0}
                                isAnimationActive
                                onClick={() => handlePlatformToggle(entry.name)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Cell fill={progressColor} />
                              </Pie>
                            </React.Fragment>
                          );
                        })}
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: "18px",
                            fontWeight: 500,
                            fill: theme.palette.text.primary,
                          }}
                        >
                          {platformData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    {allPlatformData.map((item) => {
                      const isSelected = selectedPlatforms.has(item.name);
                      return (
                        <Box
                          key={item.name}
                          onClick={() => handlePlatformToggle(item.name)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            background: isSelected ? alpha(item.color, 0.15) : alpha(theme.palette.divider, 0.1),
                            border: `1px solid ${isSelected ? item.color : theme.palette.divider}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            mb: { lg: 0.75 },
                            '&:hover': {
                              background: isSelected ? alpha(item.color, 0.2) : alpha(item.color, 0.1),
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: isSelected ? item.color : theme.palette.text.disabled,
                            }}
                          />
                          <Typography 
                            fontSize={12} 
                            fontWeight={500}
                            color={isSelected ? item.color : theme.palette.text.secondary}
                          >
                            {item.name} ({item.value.toLocaleString()})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </Grow>
            </Grid>
          </Grid>


          {/* High Demand Products */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Grow in={true} timeout={1200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      High Demand Products
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setHighDemandViewMode("graph")}
                        variant={highDemandViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setHighDemandViewMode("table")}
                        variant={highDemandViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {highDemandViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={dashboardData?.highDemandProducts || []}
                      columns={highDemandColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={dashboardData?.highDemandProducts.length || 0}
                      stickyHeader={true}
                      pageSize={dashboardData?.highDemandProducts.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={loading}
                      containerHeight="350px"
                      emptyStateComponent={<Typography>No products</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 320, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={highDemandBarData} layout="vertical">
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.5)}
                          />
                          <XAxis type="number" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={130}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1.5,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 2,
                                      maxWidth: 280,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={600} mb={1}>
                                      {data.fullName}
                                    </Typography>
                                    <Typography fontSize={11} color="text.secondary" mb={0.5}>
                                      Item Number: {data.itemNumber}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Total Quantity: {data.quantity.toLocaleString()}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Total Orders: {data.orders}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Pack: {data.pack}
                                    </Typography>
                                    <Typography fontSize={11}>
                                      Case Count: {data.caseCount} {data.uom}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                            cursor={{ fill: "rgba(0,0,0,0.1)" }}
                          />
                          <Bar 
                            dataKey="quantity" 
                            fill={theme.palette.primary.main}
                            radius={[0, 6, 6, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Epick Tab Content */}
      <Fade in={activeTab === 1} timeout={400} style={{ display: activeTab === 1 ? 'block' : 'none' }}>
        <Box>
          {/* Epick Summary Cards */}
          <Grid container spacing={2} mb={2}>
            {epickCards.map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <DashboardCard {...card} />
              </Grid>
            ))}
          </Grid>

          {/* Picker Performance */}
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12 }}>
              <Grow in={true} timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      Picker Performance
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setPickerViewMode("graph")}
                        variant={pickerViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPickerViewMode("table")}
                        variant={pickerViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {pickerViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={epickData?.pickerWiseOrders || []}
                      columns={pickerColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.pickerWiseOrders.length || 0}
                      stickyHeader={true}
                      pageSize={epickData?.pickerWiseOrders.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="350px"
                      emptyStateComponent={<Typography>No picker data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 320, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pickerBarData}>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.5)}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            axisLine={false}
                          />
                          <YAxis 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            axisLine={false}
                            tickFormatter={(value) => value.toLocaleString()}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="completedOrders" 
                            fill={theme.palette.success.main}
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          {/* Donut Charts Section */}
          <Grid container spacing={2}>
            {/* Average Time Per Quantity Donut Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      Average Time Per Quantity
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setAverageTimePerQtyViewMode("graph")}
                        variant={averageTimePerQtyViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setAverageTimePerQtyViewMode("table")}
                        variant={averageTimePerQtyViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {averageTimePerQtyViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={epickData?.pickerWiseOrders || []}
                      columns={averageTimePerQtyColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.pickerWiseOrders.length || 0}
                      stickyHeader={true}
                      pageSize={epickData?.pickerWiseOrders.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="350px"
                      emptyStateComponent={<Typography>No picker data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={epickData?.pickerWiseOrders.map((picker) => ({
                              name: picker.pickerName,
                              value: picker.averageTimePerQuantity.secondsPerQty,
                              pickerId: picker.pickerId,
                              formatted: picker.averageTimePerQuantity.formatted,
                            })) || []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {(epickData?.pickerWiseOrders || []).map((picker, index) => {
                              const colors = [
                                theme.palette.primary.main,
                                theme.palette.success.main,
                                theme.palette.warning.main,
                                theme.palette.error.main,
                                theme.palette.info.main,
                              ];
                              return (
                                <Cell key={picker.pickerId} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Pie>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "16px",
                              fontWeight: 500,
                              fill: theme.palette.text.primary,
                            }}
                          >
                            Time/Qty
                          </text>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as any;
                                const picker = epickData?.pickerWiseOrders.find(
                                  (p) => p.pickerId === data.pickerId
                                );
                                if (picker) {
                                  return (
                                    <Paper
                                      elevation={8}
                                      sx={{
                                        p: 1.5,
                                        background: theme.palette.mode === 'dark' 
                                          ? alpha(theme.palette.background.paper, 0.95)
                                          : theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                      }}
                                    >
                                      <Typography fontSize={12} fontWeight={600} mb={0.5}>
                                        {picker.pickerName}
                                      </Typography>
                                      <Typography fontSize={11} color="text.secondary">
                                        Time/Qty: {picker.averageTimePerQuantity.formatted}
                                      </Typography>
                                    </Paper>
                                  );
                                }
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* Scanned Quantity & Override Requests Donut Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      Scanned Quantity & Override Requests
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setScannedQtyViewMode("graph")}
                        variant={scannedQtyViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setScannedQtyViewMode("table")}
                        variant={scannedQtyViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {scannedQtyViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={epickData?.pickerWiseOrders || []}
                      columns={scannedQtyColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.pickerWiseOrders.length || 0}
                      stickyHeader={true}
                      pageSize={epickData?.pickerWiseOrders.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="350px"
                      emptyStateComponent={<Typography>No picker data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {/* Outer ring for Scanned Quantity */}
                          <Pie
                            data={epickData?.pickerWiseOrders.map((picker) => ({
                              name: picker.pickerName,
                              value: picker.totalScannedQuantity,
                              pickerId: picker.pickerId,
                              type: 'scanned',
                            })) || []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {(epickData?.pickerWiseOrders || []).map((picker, index) => {
                              const colors = [
                                theme.palette.primary.main,
                                theme.palette.success.main,
                                theme.palette.warning.main,
                                theme.palette.error.main,
                                theme.palette.info.main,
                              ];
                              return (
                                <Cell key={`scanned-${picker.pickerId}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Pie>
                          
                          {/* Inner ring for Override Requests */}
                          <Pie
                            data={epickData?.pickerWiseOrders.map((picker) => ({
                              name: picker.pickerName,
                              value: picker.totalOverrideRequests,
                              pickerId: picker.pickerId,
                              type: 'override',
                            })) || []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={6}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {(epickData?.pickerWiseOrders || []).map((picker, index) => {
                              const colors = [
                                theme.palette.primary.main,
                                theme.palette.success.main,
                                theme.palette.warning.main,
                                theme.palette.error.main,
                                theme.palette.info.main,
                              ];
                              return (
                                <Cell key={`override-${picker.pickerId}`} fill={alpha(colors[index % colors.length], 0.7)} />
                              );
                            })}
                          </Pie>
                          
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              fill: theme.palette.text.primary,
                            }}
                          >
                            Qty & Overrides
                          </text>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as any;
                                const picker = epickData?.pickerWiseOrders.find(
                                  (p) => p.pickerId === data.pickerId
                                );
                                if (picker) {
                                  return (
                                    <Paper
                                      elevation={8}
                                      sx={{
                                        p: 1.5,
                                        background: theme.palette.mode === 'dark' 
                                          ? alpha(theme.palette.background.paper, 0.95)
                                          : theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                      }}
                                    >
                                      <Typography fontSize={12} fontWeight={600} mb={0.5}>
                                        {picker.pickerName}
                                      </Typography>
                                      <Typography fontSize={11} color="text.secondary">
                                        {data.type === 'scanned' ? 'Scanned Qty' : 'Override Requests'}: {data.value.toLocaleString()}
                                      </Typography>
                                    </Paper>
                                  );
                                }
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          {/* Scanning Statistics & Override Request Statistics */}
          <Grid container spacing={2} mt={2}>
            {/* Scanning Statistics Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1400}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      Scanning Statistics
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setScanningStatsViewMode("graph")}
                        variant={scanningStatsViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setScanningStatsViewMode("table")}
                        variant={scanningStatsViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {scanningStatsViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={epickData?.scanningStatistics ? [
                        {
                          id: 1,
                          metric: "Total Scanned Items",
                          value: epickData.scanningStatistics.totalScannedItems.toLocaleString(),
                        },
                        {
                          id: 2,
                          metric: "Total Scanned Lines",
                          value: epickData.scanningStatistics.totalScannedLines.toLocaleString(),
                        },
                        {
                          id: 3,
                          metric: "Total Scanning Time",
                          value: epickData.scanningStatistics.totalTimeFormatted,
                        },
                      ] : []}
                      columns={scanningStatsColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.scanningStatistics ? 3 : 0}
                      stickyHeader={true}
                      pageSize={3}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="350px"
                      emptyStateComponent={<Typography>No scanning data</Typography>}
                    />
                  ) : (
                    <>
                      <Box sx={{ height: 300, width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={epickData?.scanningStatistics ? [
                              {
                                name: "Scanned Items",
                                value: epickData.scanningStatistics.totalScannedItems,
                                color: theme.palette.primary.main,
                              },
                              {
                                name: "Scanned Lines",
                                value: epickData.scanningStatistics.totalScannedLines,
                                color: theme.palette.success.main,
                              },
                            ] : []}
                          >
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke={alpha(theme.palette.divider, 0.5)}
                              vertical={false}
                            />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                              axisLine={false}
                              tickFormatter={(value) => value.toLocaleString()}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="value" 
                              radius={[6, 6, 0, 0]}
                            >
                              {epickData?.scanningStatistics ? [
                                <Cell key="items" fill={theme.palette.primary.main} />,
                                <Cell key="lines" fill={theme.palette.success.main} />,
                              ] : []}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          mt: 1.5,
                        }}
                      >
                        {epickData?.scanningStatistics && (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                background: alpha(theme.palette.primary.main, 0.1),
                                border: `1px solid ${theme.palette.primary.main}`,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: theme.palette.primary.main,
                                }}
                              />
                              <Typography fontSize={12} fontWeight={500} flex={1}>
                                Total Scanned Items
                              </Typography>
                              <Typography fontSize={12} fontWeight={500} color={theme.palette.primary.main}>
                                {epickData.scanningStatistics.totalScannedItems.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                background: alpha(theme.palette.success.main, 0.1),
                                border: `1px solid ${theme.palette.success.main}`,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: theme.palette.success.main,
                                }}
                              />
                              <Typography fontSize={12} fontWeight={500} flex={1}>
                                Total Scanned Lines
                              </Typography>
                              <Typography fontSize={12} fontWeight={500} color={theme.palette.success.main}>
                                {epickData.scanningStatistics.totalScannedLines.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                background: alpha(theme.palette.info.main, 0.1),
                                border: `1px solid ${theme.palette.info.main}`,
                              }}
                            >
                              <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                              <Typography fontSize={12} fontWeight={500} flex={1}>
                                Total Scanning Time
                              </Typography>
                              <Typography fontSize={12} fontWeight={500} color={theme.palette.info.main}>
                                {epickData.scanningStatistics.totalTimeFormatted}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* Override Request Statistics Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1600}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={14} fontWeight={500} color="text.primary">
                      Override Request Statistics
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => setOverrideStatsViewMode("graph")}
                        variant={overrideStatsViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setOverrideStatsViewMode("table")}
                        variant={overrideStatsViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {overrideStatsViewMode === "table" ? (
                    <CommonTable
                      padding={0}
                      data={epickData?.overrideRequestStatistics ? [
                        {
                          id: 1,
                          type: "Total Requests",
                          count: epickData.overrideRequestStatistics.totalRequests,
                          color: theme.palette.warning.main,
                        },
                        {
                          id: 2,
                          type: "Accepted Requests",
                          count: epickData.overrideRequestStatistics.totalAcceptedRequests,
                          color: theme.palette.success.main,
                        },
                        {
                          id: 3,
                          type: "Rejected Requests",
                          count: epickData.overrideRequestStatistics.totalRejectedRequests,
                          color: theme.palette.error.main,
                        },
                      ] : []}
                      columns={overrideStatsColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.overrideRequestStatistics ? 3 : 0}
                      stickyHeader={true}
                      pageSize={3}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="350px"
                      emptyStateComponent={<Typography>No override data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={epickData?.overrideRequestStatistics ? [
                              {
                                name: "Total Requests",
                                value: epickData.overrideRequestStatistics.totalRequests,
                                color: theme.palette.warning.main,
                              },
                              {
                                name: "Accepted",
                                value: epickData.overrideRequestStatistics.totalAcceptedRequests,
                                color: theme.palette.success.main,
                              },
                              {
                                name: "Rejected",
                                value: epickData.overrideRequestStatistics.totalRejectedRequests,
                                color: theme.palette.error.main,
                              },
                            ].filter(item => item.value > 0) : []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {epickData?.overrideRequestStatistics ? [
                              <Cell key="total" fill={theme.palette.warning.main} />,
                              <Cell key="accepted" fill={theme.palette.success.main} />,
                              <Cell key="rejected" fill={theme.palette.error.main} />,
                            ] : []}
                          </Pie>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "16px",
                              fontWeight: 500,
                              fill: theme.palette.text.primary,
                            }}
                          >
                            Requests
                          </text>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as any;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1.5,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 2,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={600} mb={0.5}>
                                      {data.name}
                                    </Typography>
                                    <Typography fontSize={11} color="text.secondary">
                                      Requests: {data.value.toLocaleString()}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Box>
  );
};

export default AdminDashboard;
