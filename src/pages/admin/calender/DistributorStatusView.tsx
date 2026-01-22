import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import moment from 'moment';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CustomButton from '../../../component/atoms/CustomButton';
import CommonModal from '../../../component/atoms/CommonModal';
import { getCustomerOrderList, getCustomerById, getCustomerOrderDetailInCalender, getCustomerTotalOrderByCustomer } from '../../../redux/apis/distrubutor/calenderApis';

interface CustomerData {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_OrderDay: number;
  OrderDayName: string;
  C_Phone: string;
  C_PhoneMobile: string;
  C_Email: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_Country: string;
  C_Salesman: number;
  'Routes.Route_Number': number;
  'Routes.Stop_Number': number;
  status: string;
}

interface CustomerDetails {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_Phone: string;
  C_PhoneMobile: string;
  C_Email: string;
  C_Memo: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_Country: string;
  TermsCode: number;
  Credit_Limit: number;
  LastBalance: number;
  C_OperationHours1: number;
  C_OperationHours2: number;
  Routes: Array<{
    Route_Number: number;
    Stop_Number: number;
  }>;
  terms: {
    Terms: string;
    DaysUntilDue: number;
  };
}

interface LocationState {
  selectedDate: string;
  customers: CustomerData[];
}

const DistributorStatusView: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const selectedDate = state?.selectedDate;
  const customers = state?.customers || [];
  const customerDay = customers[0]?.C_OrderDay;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [customerOrderData, setCustomerOrderData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Customer details modal state
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);

  // Order details modal state
  const [openOrderDetailsModal, setOpenOrderDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [selectedCustomerForOrder, setSelectedCustomerForOrder] = useState<any>(null);
  const [customerTotalOrder, setCustomerTotalOrder] = useState<any>(null);

  // Fetch customer order data
  const fetchCustomerOrderData = async (page: number = currentPage, limit: number = pageSize) => {
    if (!selectedDate || !customerDay) return;

    try {
      setLoading(true);
      const params: any = {
        orderDate: selectedDate,
        orderDay: customerDay,
        page: page,
        limit: limit
      };

      const response: any = await getCustomerOrderList(params);

      if (response.success && response.data) {
        // Handle paginated response structure
        if (response.data.data && Array.isArray(response.data.data)) {
          setCustomerOrderData(response.data.data);
          setTotalItems(response.data.total || 0);
          setTotalPages(response.data.totalPages || 0);
        } else if (Array.isArray(response.data)) {
          // Fallback for non-paginated response
          setCustomerOrderData(response.data);
          setTotalItems(response.data.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching customer order data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details
  const fetchCustomerDetails = async (customerId: number) => {
    try {
      const response: any = await getCustomerById(customerId);
      
      if (response.success && response.data) {
        setCustomerDetails(response.data);
        setOpenDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
    }
  };

  // Fetch order details for a customer
  const fetchOrderDetails = async (customerId: number) => {
    try {
      setOrderDetailsLoading(true);
      const response: any = await getCustomerOrderDetailInCalender({
        customerId: customerId,
        orderDate: selectedDate
      });
      
      if (response.success && response.data) {
        // Extract orders array from response.data.orders
        setOrderDetails(response.data.orders || []);
        setSelectedCustomerForOrder(customers.find(c => c.C_Number === customerId));
        setOpenOrderDetailsModal(true);
      } else {
        setOrderDetails([]);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setOrderDetails([]);
    } finally {
      setOrderDetailsLoading(false);
    }
  };
  const getCustomerTotalOrderByCustomerApi = async () => {
    const params: any = {
      orderDate: selectedDate,
      orderDay: customerDay,
    };
    try {
      const response: any = await getCustomerTotalOrderByCustomer(params);
      if (response.success && response.data) {
        setCustomerTotalOrder(response.data);
      }
    } catch (error) {
      console.error('Error fetching customer total order by customer:', error);
    }
  };
  useEffect(() => {
    fetchCustomerOrderData();
    getCustomerTotalOrderByCustomerApi();
  }, [selectedDate, customerDay]);

  console.log('customerTotalOrder', customerTotalOrder);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchCustomerOrderData(newPage, pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    fetchCustomerOrderData(1, newPageSize);
  };

  const columns: TableColumn[] = [
    {
      id: 'C_Number',
      label: 'Customer ',
      minWidth: 80,
      align: 'center',
    },
    {
      id: 'C_Name',
      label: 'Customer Name',
      minWidth: 160,
      align: 'left',
    },
    {
      id: 'C_CoName',
      label: 'Company',
      minWidth: 140,
      align: 'left',
      render: (row: any) => row.C_CoName || '-',
    },
    {
      id: 'C_Phone',
      label: 'Phone',
      minWidth: 110,
      align: 'left',
    },
    {
      id: 'C_PhoneMobile',
      label: 'Mobile',
      minWidth: 110,
      align: 'left',
      render: (row: any) => row.C_PhoneMobile || '-',
    },
    {
      id: 'Routes.Route_Number',
      label: 'Route',
      minWidth: 60,
      align: 'center',
      render: (row: any) => row['Routes.Route_Number'] || '-',
    },
    {
      id: 'Routes.Stop_Number',
      label: 'Stop',
      minWidth: 60,
      align: 'center',
      render: (row: any) => row['Routes.Stop_Number'] || '-',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 80,
      align: 'center',
      render: (row: any) => {
        const status = row.status?.toLowerCase();
        const isDone = status === 'done' || status === 'completed';
        return (
          <Chip 
            label={row.status?.toUpperCase() || 'UNKNOWN'} 
            size="small"
            sx={{
              backgroundColor: isDone
                ? `${theme.palette.success.main}33`
                : `${theme.palette.warning.main}33`,
              border: `1px solid ${isDone ? theme.palette.success.main : theme.palette.warning.main}`,
              color: isDone ? theme.palette.success.main : theme.palette.warning.main,
              fontSize: '0.75rem',
              fontWeight: 400
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'center',
      render: (row: any) => (
        <Box display="flex" gap={0.5} justifyContent="center">
          <Tooltip title="View Customer Details">
            <VisibilityIcon 
              fontSize="small" 
              onClick={() => fetchCustomerDetails(row.C_Number)}
              sx={{ cursor: 'pointer' , color: 'primary.main', fontSize: '18px'}}
            />
          </Tooltip>
          <Tooltip title="View Order Details">
            <ReceiptIcon 
              fontSize="small" 
              onClick={() => fetchOrderDetails(row.C_Number)}
              sx={{ cursor: 'pointer' , color: 'primary.main', fontSize: '18px'}}
            />
          </Tooltip>
        </Box>
      ),
    },
  ];


  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <ArrowBackIcon onClick={() => navigate('/admin/calender')} sx={{ cursor: 'pointer' , color: 'primary.main', fontSize: '20px' }}/>
        <Typography variant="h6" fontWeight={500} color="text.secondary">
          Distributor Calendar View
        </Typography>
      </Box>

      {/* Date and Summary */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" color="primary" fontWeight={500}>
              {moment(selectedDate).format('MMMM DD, YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order Day: {customers[0]?.OrderDayName || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
              <Chip 
                label={`${customerTotalOrder?.total} Customers`} 
                color="primary" 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${customerTotalOrder?.pendingCount} Pending`} 
                color="warning" 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${customerTotalOrder?.doneCount} Completed`} 
                color="success" 
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${customerTotalOrder?.customerOrder} Customers Ordered`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Customer Orders Table */}
      <Paper elevation={1}>
        <Box p={1.5}>
          <Typography variant="subtitle1" fontWeight={500} color="primary" gutterBottom>
            Customer Orders
          </Typography>
          <CommonTable
            columns={columns}
            data={customerOrderData}
            loading={loading}
            isPagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 25, 50, 100]}
            getRowStyle={(row) => {
              const status = row.status?.toLowerCase();
              if (status === 'done' || status === 'completed') {
                return {
                  backgroundColor: `${theme.palette.success.main}33`, // Light green background
                  borderLeft: `4px solid ${theme.palette.success.main}`,
                };
              }
              // Pending rows should be white (no background color)
              return {};
            }}
          />

        </Box>
      </Paper>

      {/* Customer Details Modal */}
      <CommonModal 
        open={openDetailsModal} 
        onClose={() => setOpenDetailsModal(false)}
        size="lg"
        title="Customer Details"
      >
        {customerDetails && (
          <Box>
            {/* Header Section */}
            <Box sx={{ p: 1.5, mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={500} color="primary" gutterBottom>
                {customerDetails.C_Name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer {customerDetails.C_Number}
              </Typography>
              {customerDetails.C_Memo && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                  {customerDetails.C_Memo}
                </Typography>
              )}
            </Box>

            {/* Information Sections */}
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="primary" fontWeight={500} gutterBottom>
                    Basic Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Company Name
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.C_CoName || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.C_Email}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Terms Code
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.TermsCode}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Contact Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="primary" fontWeight={500} gutterBottom>
                    Contact Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.C_Phone}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Mobile
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.C_PhoneMobile}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Operation Hours
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.C_OperationHours1}:00 - {customerDetails.C_OperationHours2}:00
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Address Information */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="primary" fontWeight={500} gutterBottom>
                    Address Information
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {customerDetails.C_Address}, {customerDetails.C_City}, {customerDetails.C_State} {customerDetails.C_Zip}, {customerDetails.C_Country}
                  </Typography>
                </Box>
              </Grid>

              {/* Financial Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="primary" fontWeight={500} gutterBottom>
                    Financial Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Credit Limit
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        ${customerDetails.Credit_Limit?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Balance
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        color={customerDetails.LastBalance < 0 ? 'error.main' : 'success.main'}
                      >
                        ${customerDetails.LastBalance?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Terms
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {customerDetails.terms?.Terms} ({customerDetails.terms?.DaysUntilDue} days)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Route Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" color="primary" fontWeight={500} gutterBottom>
                    Route Information
                  </Typography>
                  {customerDetails.Routes && customerDetails.Routes.length > 0 ? (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {customerDetails.Routes.map((route, index) => (
                        <Box key={index} sx={{ 
                          p: 1, 
                          border: '1px solid', 
                          borderColor: 'divider', 
                          borderRadius: 0.5,
                          background: 'rgba(0,0,0,0.02)'
                        }}>
                          <Typography variant="caption" color="text.secondary">
                            Route {route.Route_Number} - Stop {route.Stop_Number}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No route information available
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <CustomButton 
                onClick={() => setOpenDetailsModal(false)}
                fullWidth={false}
                size="small"
              >
                Close
              </CustomButton>
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* Order Details Modal */}
      <CommonModal 
        open={openOrderDetailsModal} 
        onClose={() => setOpenOrderDetailsModal(false)}
        size="lg"
        title={`Order Details - ${selectedCustomerForOrder?.C_Name} (${selectedCustomerForOrder?.C_CoName})`}
      >
        {orderDetailsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Loading order details...</Typography>
          </Box>
        ) : orderDetails.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Orders for {moment(selectedDate).format('MMMM D, YYYY')}
            </Typography>
            <Box sx={{ 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: 1, 
              overflow: 'hidden',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {/* Table Header - Sticky */}
              <Box sx={{
                position: 'sticky',
                top: 0,
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                zIndex: 1
              }}>
                <Grid container sx={{ 
                  p: 1, 
                  backgroundColor: '#3c7795',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Typography variant="subtitle2" color="white" sx={{ fontWeight: 600 }}>
                      Order Number
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Typography variant="subtitle2" color="white" sx={{ fontWeight: 600 }}>
                      Order Date
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Typography variant="subtitle2" color="white" sx={{ fontWeight: 600 }}>
                      Total Price
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Typography variant="subtitle2" color="white" sx={{ fontWeight: 600 }}>
                      Total Quantity
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2.4 }}>
                    <Typography variant="subtitle2" color="white" sx={{ fontWeight: 600 }}>
                      Action
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Table Body */}
              {orderDetails.map((order, index) => (
                <Box
                  key={index}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <Grid container spacing={1} alignItems="center" sx={{ p: 1.5 }}>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Typography variant="body2" fontWeight={500}>
                        #{order.Order_Number}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Typography variant="body2">
                        {moment(order.Order_Date).format('MMM DD, YYYY')}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Typography variant="body2" color="primary.main" fontWeight={500}>
                        ${order.totals?.totalPrice?.toFixed(2) || '0.00'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <Typography variant="body2">
                        {order.totals?.totalQty || 0} items
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.4 }}>
                      <CustomButton
                        appearance="outlined"
                        size="small"
                        fullWidth={false}
                        icon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                        onClick={() => navigate(`/admin/order/details/${order.Order_Number}`, {
                          state: { fromCalendar: true, calendarState: state }
                        })}
                        sx={{
                          padding: '4px 8px',
                          minWidth: 'auto',
                          height: '28px',
                          fontSize: '0.75rem',
                          mt: 0
                        }}
                      >
                        View
                      </CustomButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No orders found for this customer on the selected date.
            </Typography>
          </Box>
        )}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <CustomButton 
            onClick={() => setOpenOrderDetailsModal(false)}
            fullWidth={false}
            size="small"
          >
            Close
          </CustomButton>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default DistributorStatusView;
