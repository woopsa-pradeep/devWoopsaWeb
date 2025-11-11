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
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import DashboardCard from "../../../component/atoms/dashboard/DashboardCard";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import RetailersIcon from "../../../assets/retailerGlobalActive.svg";
import ItemsIcon from "../../../assets/Menu Icon (2).svg";
import OrdersIcon from "../../../assets/orderItems.svg";
// import CurrentDueIcon from '../../../assets/currentDue.svg';
import { getDistributorDashboard } from "../../../redux/apis/dashboardApis";
import CustomDatePicker from "../../../component/atoms/CustomDatePicker";
import dayjs from "dayjs";
import LoadingSpinner from "../../../component/atoms/loader/LoadingSpinner";
import ClearIcon from "@mui/icons-material/Clear";

interface DashboardData {
  summary: {
    totalActiveCustomer: number;
    totalCustomer: number;
    totalInactiveCustomer: number;
    totalOrder: number;
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

const AdminDashboard = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["Mobile", "Web", "ERP"])
  );
  const [highDemandViewMode, setHighDemandViewMode] = useState<"table" | "graph">("table");

  useEffect(() => {
    // Only fetch if both dates are selected or if neither date is selected (initial load)
    if ((startDate && endDate) || (!startDate && !endDate)) {
      fetchDashboardData();
    }
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res: any = await getDistributorDashboard({
        fromDate: startDate?.format("YYYY-MM-DD") || "",
        toDate: endDate?.format("YYYY-MM-DD") || "",
      });
      setDashboardData(res.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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

  const handlePlatformToggle = (platformName: string) => {
    setSelectedPlatforms((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(platformName)) {
        newSelected.delete(platformName);
      } else {
        newSelected.add(platformName);
      }
      return newSelected;
    });
  };

  const summaryCards = dashboardData
    ? [
        {
          title: "Total Retailers",
          value: dashboardData.summary.totalCustomer.toString(),
          // change: '+6.2%',
          color: "success" as const,
          icon: (
            <img src={RetailersIcon} alt="retailers" width={20} height={20} />
          ),
        },
        {
          title: "Total Active Retailers",
          value: dashboardData.summary.totalActiveCustomer.toString(),
          // change: '+6.2%',
          color: "success" as const,
          icon: <img src={ItemsIcon} alt="active" width={20} height={20} />,
        },
        {
          title: "Total Inactive Retailers",
          value: dashboardData.summary.totalInactiveCustomer.toString(),
          // change: '+6.2%',
          color: "success" as const,
          icon: <img src={ItemsIcon} alt="inactive" width={20} height={20} />,
        },
        {
          title: "Total Orders",
          value: dashboardData.summary.totalOrder.toString(),
          // change: '+6.2%',
          color: "success" as const,
          icon: <img src={OrdersIcon} alt="orders" width={20} height={20 } />,
        },
        // {
        //   title: 'Current Orders',
        //   value: dashboardData.summary.totalOrder.toString(),
        //   change: '+6.2%',
        //   color: 'success' as const,
        //   icon: <img src={CurrentDueIcon} alt="current" width={28} height={28} />,
        // },
      ]
    : [];

  const pieData = dashboardData
    ? [
        {
          name: "Mobile",
          value: dashboardData.orderPlatform.Mobile,
          color: "#FF9800",
        },
        {
          name: "Web",
          value: dashboardData.orderPlatform.Web,
          color: "#4CAF50",
        },
        {
          name: "ERP",
          value: dashboardData.orderPlatform.ERP,
          color: "#3C50E0",
        },
      ].filter((item) => selectedPlatforms.has(item.name))
    : [];

  const lineData = dashboardData
    ? dashboardData.salesPersonPerformance.map((person) => ({
        name: person.salesRepName,
        Sales: person.totalSales,
        OrderCount: person.orderCount,
        TotalQuantity: person.totalQuantity,
      }))
    : [];

  const highDemandColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item Name",
      render: (row) => (
        <Box>
          <Typography fontSize={14} fontWeight={400} color="text.primary">
            {row.inventory.Description}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {row.Item_Number}
          </Typography>
        </Box>
      ),
    },
    {
      id: "popularity",
      label: "Popularity (QTY & Orders)",
      render: (row) => (
        <Box>
          <Typography fontSize={14} color="text.primary">
            Qty: {row.totalQuantityOrdered.toLocaleString()}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Orders: {row.orderCount}
          </Typography>
        </Box>
      ),
    },
    {
      id: "pack",
      label: "Pack Info",
      render: (row) => (
        <Box>
          <Typography fontSize={14} color="text.primary">
            Pack: {row.inventory.Pack}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Case: {row.inventory.CaseCount} {row.inventory.UOM}
          </Typography>
        </Box>
      ),
    },
  ];

  // Prepare data for bar chart
  const highDemandBarData = dashboardData?.highDemandProducts.map((product) => ({
    itemNumber: product.Item_Number,
    name: product.inventory.Description,
    quantity: product.totalQuantityOrdered,
    orders: product.orderCount,
    pack: product.inventory.Pack,
    caseCount: product.inventory.CaseCount,
    uom: product.inventory.UOM,
  })) || [];

  const salesPersonColumns: TableColumn[] = [
    {
      id: "name",
      label: "Sales Person",
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color="text.secondary">
          {row.salesRepName}
        </Typography>
      ),
    },
    {
      id: "sales",
      label: "Total Sales",
      render: (row) => (
        <Typography fontSize={14} color="text.secondary">
          ${row.totalSales.toLocaleString()}
        </Typography>
      ),
    },
    {
      id: "orders",
      label: "Order Count",
      render: (row) => (
        <Typography fontSize={14} color="text.secondary">
          {row.orderCount}
        </Typography>
      ),
    },
    {
      id: "quantity",
      label: "Total Quantity",
      render: (row) => (
        <Typography fontSize={14} color="text.secondary">
          {row.totalQuantity.toLocaleString()}
        </Typography>
      ),
    },
  ];

  const CustomLineTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({
    active,
    payload,
  }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: "#1A2B3C",
            color: "#fff",
            borderRadius: 2,
            px: 2,
            py: 1,
            boxShadow: 2,
          }}
        >
          <Typography fontWeight={700}>
            ${payload[0].value.toLocaleString()}
          </Typography>
          <Typography fontSize={12}>{payload[0].payload.name}</Typography>
        </Box>
      );
    }
    return null;
  };

  // Pie chart: use legend color but with low opacity

  // Get all platform data for legend (including unselected ones)
  const allPlatformData = dashboardData
    ? [
        {
          name: "Mobile",
          value: dashboardData.orderPlatform.Mobile,
          color: "#FF9800",
        },
        {
          name: "Web",
          value: dashboardData.orderPlatform.Web,
          color: "#4CAF50",
        },
        {
          name: "ERP",
          value: dashboardData.orderPlatform.ERP,
          color: "#3C50E0",
        },
      ]
    : [];



  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} />
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, md: "10px 20px" },
        background: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography fontSize={20} fontWeight={500}  width={'100%'} color="primary.main">
          Welcome to Dashboard
        </Typography>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems="center"
          gap={{ xs: 0.5, sm: 1.5 }}
          sx={{
            width: "100%",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
          }}
        >
          <CustomDatePicker
            value={startDate}
            onChange={handleStartDateChange}
            sx={{
              mb: 0,
              minWidth: 130,
              maxWidth: 150,
              "& .MuiInputBase-root": {
                height: 30,
                fontSize: 12,
                py: 0,
                px: 1,
              },
              "& .MuiOutlinedInput-input": {
                py: "4px",
                fontSize: 12,
              },
            }}
          />
          <Typography
            fontSize={13}
            fontWeight={500}
            color="text.secondary"
            mx={0.5}
            sx={{
              minWidth: 18,
              textAlign: "center",
              px: 0.5,
              display: { xs: "none", sm: "inline-block" },
            }}
          >
            to
          </Typography>
          <CustomDatePicker
            value={endDate}
            onChange={handleEndDateChange}
            sx={{
              mb: 0,
              minWidth: 130,
              maxWidth: 150,
              "& .MuiInputBase-root": {
                height: 30,
                fontSize: 12,
                py: 0,
                px: 1,
              },
              "& .MuiOutlinedInput-input": {
                py: "4px",
                fontSize: 12,
              },
            }}
          />
          {(startDate || endDate) && (
            <IconButton
              onClick={handleClearDates}
              size="small"
              sx={{
                ml: { xs: 0, sm: 0.5 },
                p: "2px",
                width: 22,
                height: 22,
                backgroundColor: theme.palette.grey[100],
                "&:hover": {
                  backgroundColor: theme.palette.grey[200],
                },
                alignSelf: "center",
              }}
            >
              <ClearIcon
                sx={{ color: theme.palette.text.secondary, fontSize: 15 }}
              />
            </IconButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={2}>
        {summaryCards.map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <DashboardCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ sm: 12, md: 7, xl: 8 }}>
          <Paper
            sx={{
              borderRadius: 3,
              boxShadow: "none",
              border: "1px solid divider",
              pb: 1,
            }}
          >
            <Box display="flex" justifyContent="space-between" px={2} pt={2} alignItems="center">
              <Typography fontSize={16} fontWeight={500}>
                High Demand Products
              </Typography>
                             <Stack direction="row" spacing={0.5}>
                 <Button
                   size="small"
                   onClick={() => setHighDemandViewMode("table")}
                   variant={highDemandViewMode === "table" ? "contained" : "outlined"}
                   sx={{
                     backgroundColor:
                       highDemandViewMode === "table"
                         ? theme.palette.primary.main
                         : "transparent",
                     color:
                       highDemandViewMode === "table" ? "#fff" : theme.palette.text.primary,
                     borderColor:
                       highDemandViewMode === "table"
                         ? theme.palette.primary.main
                         : theme.palette.divider,
                     boxShadow: "none",
                     minWidth: 60,
                     fontSize: 12,
                   }}
                 >
                   Table
                 </Button>
                 <Button
                   size="small"
                   onClick={() => setHighDemandViewMode("graph")}
                   variant={highDemandViewMode === "graph" ? "contained" : "outlined"}
                   sx={{
                     backgroundColor:
                       highDemandViewMode === "graph"
                         ? theme.palette.primary.main
                         : "transparent",
                     color:
                       highDemandViewMode === "graph" ? "#fff" : theme.palette.text.primary,
                     borderColor:
                       highDemandViewMode === "graph"
                         ? theme.palette.primary.main
                         : theme.palette.divider,
                     boxShadow: "none",
                     minWidth: 60,
                     fontSize: 12,
                   }}
                 >
                   Graph
                 </Button>
               </Stack>
            </Box>
            <Box sx={{ m: 2 }}>
              {highDemandViewMode === "table" ? (
                <CommonTable
                  padding={0}
                  data={dashboardData?.highDemandProducts || []}
                  columns={highDemandColumns}
                  currentPage={1}
                  totalPages={1}
                  totalItems={dashboardData?.highDemandProducts.length || 0}
                  stickyHeader={true}
                  pageSize={5}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  showPageSizeSelector={false}
                  showTotalItems={false}
                  showPageNumbers={false}
                  loading={loading}
                  containerHeight="320px"
                  emptyStateComponent={<Typography>No products</Typography>}
                />
                                            ) : (
                 <Box sx={{ height: 300, width: "100%" }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart
                       data={highDemandBarData}
                       margin={{ top: 30, right: 30, left: 20, bottom: -20 }}
                     >
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis
                         dataKey="itemNumber"
                         angle={-45}
                         textAnchor="end"
                         height={60}
                         interval={0}
                         tick={{
                           fontSize: 11,
                           fill: theme.palette.text.secondary,
                         }}
                       />
                       <YAxis
                         tick={{
                           fontSize: 12,
                           fill: theme.palette.text.secondary,
                         }}
                         tickFormatter={(value) => value.toLocaleString()}
                       />
                     <Tooltip
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           const data = payload[0].payload;
                           return (
                             <Box
                               sx={{
                                 background: "#1A2B3C",
                                 color: "#fff",
                                 borderRadius: 2,
                                 px: 2,
                                 py: 1,
                                 boxShadow: 2,
                                 maxWidth: 280,
                               }}
                             >
                               <Typography fontWeight={700} fontSize={14} mb={1}>
                                 {data.name}
                               </Typography>
                               <Typography fontSize={12} color="#ccc" mb={0.5}>
                                 Item Number: {data.itemNumber}
                               </Typography>
                               <Typography fontSize={12} mb={0.5}>
                                 Total Quantity: {data.quantity.toLocaleString()}
                               </Typography>
                               <Typography fontSize={12} mb={0.5}>
                                 Total Orders: {data.orders}
                               </Typography>
                               <Typography fontSize={12} mb={0.5}>
                                 Pack Size: {data.pack}
                               </Typography>
                               <Typography fontSize={12}>
                                 Case Count: {data.caseCount} {data.uom}
                               </Typography>
                             </Box>
                           );
                         }
                         return null;
                       }}
                       cursor={{ fill: "rgba(0,0,0,0.1)" }}
                     />
                      <Bar
                        dataKey="quantity"
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={80}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ sm: 12, md: 5, xl: 4 }}>
          <Paper
            sx={{
              p: 2,
              // mb: 2,
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid divider",
              height: "100%",
            }}
          >
            <Typography fontSize={16} fontWeight={500} mb={2}>
              Orders by Platform
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center">
              {/* <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={95}
                    outerRadius={110}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={4}
                    cornerRadius={12}
                    animationDuration={300}
                    animationBegin={0}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={pieTransparentColors[idx]}
                      />
                    ))}
                  </Pie>
                                     {pieData.length > 0 && (
                     <text
                       x="50%"
                       y="50%"
                       textAnchor="middle"
                       dominantBaseline="middle"
                       style={{
                         fontSize: '24px',
                         fontWeight: 'bold',
                         fill: theme.palette.text.primary
                       }}
                     >
                       {pieData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                     </text>
                   )}
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer> */}
              <ResponsiveContainer width={240} height={270}>
                <PieChart>
                  {allPlatformData.map((entry, index) => {
                    const ringWidth = 10;
                    const spacing = 4;
                    const baseInner = 55;
                    const innerRadius =
                      baseInner + index * (ringWidth + spacing);
                    const outerRadius = innerRadius + ringWidth;

                    const total =
                      allPlatformData.reduce((sum, p) => sum + p.value, 0) || 1;
                    const percent = entry.value / total;
                    const isSelected = selectedPlatforms.has(entry.name);
                    const progressColor = isSelected
                      ? entry.color
                      : theme.palette.grey[400];
                    const backgroundColor = theme.palette.grey[200]; // light gray background ring

                    const startAngle = 90;
                    const endAngle = 90 - percent * 360;

                    return (
                      <React.Fragment key={entry.name}>
                        {/* Background full ring */}
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
                        >
                          <Cell fill={backgroundColor} />
                        </Pie>

                        {/* Foreground progress arc */}
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
                        >
                          <Cell fill={progressColor} />
                        </Pie>
                      </React.Fragment>
                    );
                  })}

                  {/* Center Total */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "22px",
                      fontWeight: 500,
                      fill: theme.palette.text.primary,
                    }}
                  >
                    {pieData
                      .reduce((sum, item) => sum + item.value, 0)
                      .toLocaleString()}
                  </text>
                </PieChart>
              </ResponsiveContainer>

              <Stack
                direction="row"
                spacing={2}
                mt={2}
                flexWrap="wrap"
                justifyContent="center"
              >
                {allPlatformData.map((item) => {
                  const isSelected = selectedPlatforms.has(item.name);
                  return (
                    <Box
                      key={item.name}
                      display="flex"
                      alignItems="center"
                      mb={1}
                      sx={{
                        cursor: "pointer",
                        opacity: isSelected ? 1 : 0.4,
                        transition: "all 0.3s ease",
                        p: 0.5,
                        borderRadius: 1,
                        "&:hover": {
                          opacity: isSelected ? 1 : 0.7,
                          backgroundColor: theme.palette.action.hover,
                          transform: "scale(1.05)",
                        },
                        "&:active": {
                          transform: "scale(0.95)",
                        },
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePlatformToggle(item.name);
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: isSelected
                            ? item.color
                            : theme.palette.grey[400],
                          mr: 1,
                          border: isSelected
                            ? "2px solid transparent"
                            : "2px solid #ccc",
                          transition: "all 0.3s ease",
                        }}
                      />
                      <Typography
                        fontWeight={isSelected ? 400 : 400}
                        fontSize={14}
                        color={isSelected ? "text.primary" : "text.disabled"}
                        sx={{ transition: "all 0.3s ease" }}
                      >
                        {item.name} ({item.value.toLocaleString()})
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ sm: 12, md: 6, xl: 7 }}>
          <Paper
            sx={{
              borderRadius: 3,
              boxShadow: "none",
              border: "1px solid divider",
              pb: 1,
              // height: "100%",
            }}
          >
            <Box display="flex" justifyContent="space-between" px={2} pt={2}>
              <Typography fontSize={16} fontWeight={500}>
                Sales Person Performance
              </Typography>
              {/* <Button size="small" variant="text" onClick={() => {navigate('/admin/sales-person')}}>View All</Button> */}
            </Box>
            <Box sx={{ m: 2 }}>
              <CommonTable
                padding={0}
                data={dashboardData?.salesPersonPerformance || []}
                columns={salesPersonColumns}
                currentPage={1}
                totalPages={1}
                totalItems={dashboardData?.salesPersonPerformance.length || 0}
                stickyHeader={true}
                pageSize={5}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                showPageSizeSelector={false}
                showTotalItems={false}
                showPageNumbers={false}
                loading={loading}
                containerHeight="320px"
                emptyStateComponent={<Typography>No sales data</Typography>}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ sm: 12, md: 6, xl: 5 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid primary.divider",
                height: "100%",
            }}
          >
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography fontSize={16} fontWeight={500}>
                Sales Performance
              </Typography>
            </Box>
            <Box sx={{ width: "100%", overflowX: "auto", overflowY: "hidden" }}>
              <Box sx={{ minWidth: 700 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={lineData}
                    margin={{ left: 10, right: 10, top: 20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorSales"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.18}
                        />
                        <stop
                          offset="100%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.04}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{
                        fontSize: 13,
                        fontWeight: 400,
                        fill: theme.palette.text.primary,
                      }}
                      tickMargin={12}
                      axisLine={false}
                      tickLine={true}
                    />
                    <YAxis
                      tick={{
                        fontSize: 13,
                        fontWeight: 400,
                        fill: theme.palette.text.secondary,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      content={(props) => <CustomLineTooltip {...props} />}
                      cursor={{
                        stroke: theme.palette.primary.main,
                        strokeDasharray: "3 3",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Sales"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      fill="url(#colorSales)"
                      activeDot={{
                        r: 10,
                        fill: theme.palette.primary.main,
                        stroke: "#fff",
                        strokeWidth: 3,
                      }}
                      isAnimationActive
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
