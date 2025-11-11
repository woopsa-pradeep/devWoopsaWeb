import React, { useState, useEffect } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { KeyboardBackspaceOutlined, SearchOutlined, VisibilityOutlined } from "@mui/icons-material";
import TextInput from "../../../component/atoms/TextInput";
import { useNavigate } from "react-router-dom";
import { getReturnOrderHistory } from "../../../redux/apis/sales/salesReturnOrderApis";
import CustomDateRangePicker from "../../../component/atoms/CustomDateRangePicker";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

const ReturnOrderTablePage = () => {
  const navigate = useNavigate();
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);
  const [selectedStartDate, setSelectedStartDate] = useState<Dayjs | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Dayjs | null>(null);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const handleViewOrder = (orderId: string) => {
    navigate(`/sales/return-order/details/${orderId}`);
  };

  const columns: TableColumn<any>[] = [
    { id: "Order_Number", label: "Return Order Number", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Number}</Typography>
      </Box>
    )  },
    { id: "Order_Date", label: "Date", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Date}</Typography>
      </Box>
    )  },
    { id: "totalQuantity", label: "Item (Qty)", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{Number(row.totalQuantity).toFixed(0)}</Typography>
      </Box>
    )  },
    { id: "Order_Source", label: "Platforms", render: (row) => (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Source}</Typography>
      </Box>
    )  },
    {
      id: "history",
      label: "Return Order History",
      render: (row) => (
        <VisibilityOutlined 
          sx={{ cursor: "pointer", color: "primary.main" }} 
          onClick={() => handleViewOrder(row.Order_Number)}
        />
      ),
    },
  ];

  // Fetch data with pagination
  const fetchData = async (page: number, size: number, startDate: Dayjs | null, endDate: Dayjs | null, search: string) => {
    setLoading(true);
    try {
      // Format dates for API payload - only if valid Dayjs objects
      const formattedStartDate = startDate && dayjs.isDayjs(startDate) ? startDate.format('YYYY-MM-DD') : '';
      const formattedEndDate = endDate && dayjs.isDayjs(endDate) ? endDate.format('YYYY-MM-DD') : '';
      
      const customerId = selectedCustomer?.C_Number;
      
      if (!customerId) {
        console.error('Customer ID not found');
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
        return;
      }
      
      const response: any = await getReturnOrderHistory(
        customerId.toString(),
        page,
        size,
        formattedStartDate,
        formattedEndDate,
        search
      );
      setData(response?.data?.data || []);
      setTotalItems(response?.data?.totalCount || 0);
      setTotalPages(response?.data?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching return order history:', error);
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

  // Fetch data when page or pageSize changes
  useEffect(() => {
    if (selectedCustomer?.C_Number) {
      fetchData(currentPage, pageSize, selectedStartDate, selectedEndDate, search);
    }
  }, [currentPage, pageSize, selectedStartDate, selectedEndDate, search, selectedCustomer]);

  // Reset pagination when search or date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStartDate, selectedEndDate]);

  return (
    <Box sx={{ padding: "10px 20px" }}>
      <Box display="flex" alignItems="center" gap={1} fontSize={20} fontWeight={500} mb={2}>
        <KeyboardBackspaceOutlined 
          onClick={() => navigate("/sales/return-order")}
          sx={{ cursor: "pointer", width: 24, height: 24 }}
        />
        <Typography fontSize={20} fontWeight={500}>Return Order History</Typography>
      </Box>
      {/* Filter Bar */}
      <Box display={useMediaQuery("(max-width: 600px)") ? "block" : "flex"} justifyContent="space-between" alignItems="center" mb={1} mt={2}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextInput
            placeholder="Search"
            icon={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{mb: 0, width: {xs: "100%", md: "auto"}}}
          />

          <CustomDateRangePicker 
            startDate={selectedStartDate}
            endDate={selectedEndDate}
            onStartDateChange={setSelectedStartDate}
            onEndDateChange={setSelectedEndDate}
            isLabel={false}
            sx={{mb: 0, width: {xs: "100%", md: "auto"}}}
          />
        </Box>
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
    </Box>
  );
};

export default ReturnOrderTablePage;



