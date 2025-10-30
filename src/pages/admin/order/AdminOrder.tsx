import React, { useState, useEffect } from "react";
import { Box, Typography, useMediaQuery, Paper } from "@mui/material";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import { VisibilityOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getOrderHistory } from "../../../redux/apis/distrubutor/orderDistrubutorApis";
import { getCustomerList } from "../../../redux/apis/distrubutor/listApis";
import CustomAutoComplete from '../../../component/atoms/CustomAutoComplete';
import CustomDateRangePicker from "../../../component/atoms/CustomDateRangePicker";

const AdminOrder = () => {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStartDate, setSelectedStartDate] = useState<any>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<any>(null);

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/order/details/${orderId}`);
  };

  const columns: TableColumn<any>[] = [
    { id: "Order_Number", label: "Order Number", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Number}</Typography>
      </Box>
    )  },
    { id: "Order_Date", label: "Date", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Date}</Typography>
      </Box>
    )  },
    { id: "customerName", label: "Customer Name", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.customerName}</Typography>
      </Box>
    )  },
    { id: "address", label: "Address", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.address || "-"}</Typography>
      </Box>
    )  },
    { id: "route", label: "Route", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.route || "-"}</Typography>
      </Box>
    )  },
    { id: "stop", label: "Stop", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.stop || "-"}</Typography>
      </Box>
    )  },
    { id: "totalQuantityOrdered", label: "Item (Qty)", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{Number(row.totalQuantityOrdered).toFixed(0)}</Typography>
      </Box>
    )  },
    { id: "Order_Source_Name", label: "Platforms", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Source_Name}</Typography>
      </Box>
    )  },
    {
      id: "history",
      label: "Order History",
      render: (row) => (
        <VisibilityOutlined 
          sx={{ cursor: "pointer", color: "primary.main" }} 
          onClick={() => handleViewOrder(row.Order_Number)}
        />
      ),
    },
  ];

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response: any = await getCustomerList();
      setCustomers(response?.data?.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch data with pagination
  const fetchData = async (page: number, size: number, customerId: string, startDate: any, endDate: any) => {
    setLoading(true);
    try {
      const response: any = await getOrderHistory(page, size, customerId, startDate, endDate);
      setData(response?.data?.orderList || []);
      setTotalItems(response?.data?.totalCount || 0);
      setTotalPages(response?.data?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle customer selection
  const handleCustomerChange = (newValue: any) => {
    setSelectedCustomer(newValue);
    setCurrentPage(1); // Reset to first page when changing customer
  };

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch data when page, pageSize, or customer changes
  useEffect(() => {
    fetchData(currentPage, pageSize, selectedCustomer?.C_Number || '', selectedStartDate, selectedEndDate);
  }, [currentPage, pageSize, selectedCustomer, selectedStartDate, selectedEndDate]);

  return (
    <Box sx={{ padding: "10px 20px" }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Filter Bar */}
        <Box display={useMediaQuery("(max-width: 600px)") ? "block" : "flex"} justifyContent="space-between" alignItems="center" mb={1} px={2}>
          <Box display="flex" gap={2} flexWrap="wrap" width={useMediaQuery("(max-width: 600px)") ? "100%" : "300px"}>
            <CustomAutoComplete
              fullWidth
              options={customers}
              getOptionLabel={(option) => option.C_Name || option.C_CoName || ''}
              value={selectedCustomer}
              onChange={handleCustomerChange}
              label="Search Customer"
              size="small"
              placeholder="Type to search customers..."
            />
          </Box>

          <CustomDateRangePicker 
            startDate={selectedStartDate}
            endDate={selectedEndDate}
            onStartDateChange={setSelectedStartDate}
            onEndDateChange={setSelectedEndDate}
            isLabel={false}
            sx={{mb: 0, width: {xs: "100%", md: "auto"}}}
          />
        </Box>

        {/* Table */}
        <CommonTable
          data={data}
          containerHeight="calc(100vh - 380px)"
          columns={columns}
          // Pagination props
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          // Optional pagination customization
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSizeSelector={true}
          showTotalItems={true}
          showPageNumbers={true}
          maxPageNumbers={5}
          // Other props
          loading={loading}
          filterComponent={null}
        />
      </Paper>
    </Box>
  );
};

export default AdminOrder;