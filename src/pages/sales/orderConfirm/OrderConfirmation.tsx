import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Drawer, IconButton, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { KeyboardBackspaceOutlined, SearchOutlined, ArrowForward, FilterList, LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import TextInput from '../../../component/atoms/TextInput';
import CustomButton from '../../../component/atoms/CustomButton';
// import CustomDateRangePicker from '../../../component/atoms/CustomDateRangePicker';
import SelectInput from '../../../component/atoms/SelectInput';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import {
  fetchOrderConfirmationList,
  acceptOrderThunk,
  restartOrderConfirmationThunk,
  lockOrderConfirmationThunk,
  setCurrentPage,
  setPageSize,
} from '../../../redux/slices/orderConfirmSlice';
import { getProfile } from '../../../redux/apis/sales/profileApis';
import toast from 'react-hot-toast';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    orderList,
    listLoading,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    acceptLoading,
    restartLoading,
    lockLoading,
  } = useAppSelector((state) => state.orderConfirm);

  // Filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Search state (applied immediately)
  const [search, setSearch] = useState('');
  
  // Applied filters (used for API calls) - date and status only
  const [appliedStartDate, setAppliedStartDate] = useState<Dayjs | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Dayjs | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string>('all');
  
  // Local filter state (for drawer inputs - not applied until Apply is clicked)
  const [localStartDate, setLocalStartDate] = useState<Dayjs | null>(null);
  const [localEndDate, setLocalEndDate] = useState<Dayjs | null>(null);
  const [localStatus, setLocalStatus] = useState<string>('all');
  
  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'continue' | 'accept' | 'restart';
    orderNumber: number;
    status?: string;
  } | null>(null);

  // Current user's sales ID
  const [currentSalesId, setCurrentSalesId] = useState<number | null>(null);

  // Fetch current user's profile to get sales ID
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res: any = await getProfile();
        if (res?.data?.data?.id) {
          setCurrentSalesId(res.data.data.id);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Fetch order list when applied filters change
  useEffect(() => {
    const formattedStartDate = appliedStartDate && dayjs.isDayjs(appliedStartDate) ? appliedStartDate.format('YYYY-MM-DD') : '';
    const formattedEndDate = appliedEndDate && dayjs.isDayjs(appliedEndDate) ? appliedEndDate.format('YYYY-MM-DD') : '';
    
    dispatch(
      fetchOrderConfirmationList({
        page: currentPage,
        limit: pageSize,
        startDate: formattedStartDate || undefined,
        endDate: formattedEndDate || undefined,
        search: search || undefined,
        status: appliedStatus !== 'all' ? appliedStatus : undefined,
      })
    );
  }, [dispatch, currentPage, pageSize, appliedStartDate, appliedEndDate, search, appliedStatus]);

  // Reset pagination when filters change
  useEffect(() => {
    dispatch(setCurrentPage(1));
  }, [search, appliedStartDate, appliedEndDate, appliedStatus, dispatch]);

  // Handle page change
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    dispatch(setPageSize(size));
  };

  // Handle status change (local state for drawer)
  const handleStatusChange = (e: any) => {
    const value = e.target.value;
    if (typeof value === 'string') {
      setLocalStatus(value);
    }
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setAppliedStartDate(localStartDate);
    setAppliedEndDate(localEndDate);
    setAppliedStatus(localStatus);
    setFilterDrawerOpen(false);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setLocalStatus('all');
    setAppliedStartDate(null);
    setAppliedEndDate(null);
    setAppliedStatus('all');
    setFilterDrawerOpen(false);
  };

  // Sync local filters with applied filters when drawer opens
  useEffect(() => {
    if (filterDrawerOpen) {
      setLocalStartDate(appliedStartDate);
      setLocalEndDate(appliedEndDate);
      setLocalStatus(appliedStatus);
    }
  }, [filterDrawerOpen, appliedStartDate, appliedEndDate, appliedStatus]);

  // Open confirmation modal for action buttons
  const handleOpenConfirmModal = (type: 'continue' | 'accept' | 'restart', orderNumber: number, status?: string) => {
    setPendingAction({ type, orderNumber, status });
    setConfirmModalOpen(true);
  };

  // Handle confirmed action - call API and navigate
  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    const { type, orderNumber } = pendingAction;

    try {
      if (type === 'accept') {
        // Call accept API for accept
        await dispatch(acceptOrderThunk({ orderNumber, currentOrderline: 0 })).unwrap();
        toast.success('Order accepted successfully');
        // Note: Redux data will be cleared when navigating to detail page and when leaving it
        navigate(`/sales/order-confirmation/${orderNumber}`);
      } else if (type === 'continue') {
        // Call lock API when status is pending (continue)
        await dispatch(lockOrderConfirmationThunk(orderNumber)).unwrap();
        toast.success('Order locked successfully');
        // Refresh the order list
        dispatch(
          fetchOrderConfirmationList({
            page: currentPage,
            limit: pageSize,
            startDate: appliedStartDate && dayjs.isDayjs(appliedStartDate) ? appliedStartDate.format('YYYY-MM-DD') : undefined,
            endDate: appliedEndDate && dayjs.isDayjs(appliedEndDate) ? appliedEndDate.format('YYYY-MM-DD') : undefined,
            search: search || undefined,
            status: appliedStatus !== 'all' ? appliedStatus : undefined,
          })
        );
        // Note: Redux data will be cleared when navigating to detail page and when leaving it
        navigate(`/sales/order-confirmation/${orderNumber}?mode=continue`);
      } else if (type === 'restart') {
        // Call restart API
        await dispatch(restartOrderConfirmationThunk({ orderNumber, currentOrderline: 0 })).unwrap();
        toast.success('Order restarted successfully');
        // Refresh the order list
        dispatch(
          fetchOrderConfirmationList({
            page: currentPage,
            limit: pageSize,
            startDate: appliedStartDate && dayjs.isDayjs(appliedStartDate) ? appliedStartDate.format('YYYY-MM-DD') : undefined,
            endDate: appliedEndDate && dayjs.isDayjs(appliedEndDate) ? appliedEndDate.format('YYYY-MM-DD') : undefined,
            search: search || undefined,
            status: appliedStatus !== 'all' ? appliedStatus : undefined,
          })
        );
        // Navigate to detail page with restart mode
        navigate(`/sales/order-confirmation/${orderNumber}?mode=restart`);
      }

      setConfirmModalOpen(false);
      setPendingAction(null);
    } catch (error: any) {
      toast.error(error || `Failed to ${type} order`);
      setConfirmModalOpen(false);
    }
  };

  // Get confirmation message based on status
  const getConfirmMessage = (): string => {
    if (!pendingAction) return '';
    
    if (pendingAction.status === 'confirmed') {
      return 'This order is already confirmed from ERP and cannot be modified.';
    } else if (pendingAction.status === 'pending') {
      return 'Choose an action for this pending order:';
    } else if (pendingAction.status === 'in-progress') {
      return 'This order is in progress. Continue working on it?';
    } else if (pendingAction.status === 'completed') {
      return 'Are you sure you want to restart this completed order? This will reset the scanning progress.';
    } else {
      return 'Are you sure you want to accept this order?';
    }
  };

  // Get confirmation title based on status
  const getConfirmTitle = (): string => {
    if (!pendingAction) return 'Order Actions';
    
    if (pendingAction.status === 'confirmed') {
      return 'Order Confirmed';
    } else if (pendingAction.status === 'pending') {
      return 'Pending Order';
    } else if (pendingAction.status === 'in-progress') {
      return 'Order In Progress';
    } else if (pendingAction.status === 'completed') {
      return 'Restart Order';
    } else {
      return 'Accept Order';
    }
  };

  // Table columns for order list
  const columns: TableColumn<any>[] = [
    {
      id: 'Order_Number',
      label: 'Order #',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {row.Order_Number}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'Order_Date',
      label: 'Date',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {dayjs(row.Order_Date).format('MM/DD/YYYY')}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'customerName',
      label: 'Customer',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {row.customerName}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'totalQuantityOrdered',
      label: 'Item (Qty)',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {Number(row.totalQuantityOrdered).toFixed(0)}
          </Typography>
        </Box>
      ),
    },
    
    {
      id: 'totalShipped',
      label: 'Scanned (Qty)',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {Number(row.totalShipped).toFixed(0)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        // Check if ERP confirmed and status is pending - treat as confirmed
        const isERPConfirmed = row.erpConfirmStatus === 'Confirmed from ERP';
        const orderStatus = row.isOrderConfirmed?.status;
        const effectiveStatus = isERPConfirmed && orderStatus === 'pending' ? 'confirmed' : row.status;
        
        return (
          <Chip
            label={effectiveStatus}
            size="small"
            color={
              effectiveStatus === 'completed' || effectiveStatus === 'confirmed'
                ? 'success'
                : effectiveStatus === 'pending'
                ? 'warning'
                : 'default'
            }
            sx={{ fontSize: '0.75rem' }}
          />
        );
      },
    },
    {
      id: 'Order_Source_Name',
      label: 'Platform',
      align: 'center',
      render: (row) => (
        // <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {row.Order_Source_Name}
          </Typography>
        // </Box>
      ),
    },
    {
      id: 'Invoice_Generated',
      label: 'Invoice Generated',
      align: 'center',
      render: (row) => (
        // <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={row.Invoice_Generated ? 'Yes' : 'No'}
            size="small"
            color={row.Invoice_Generated ? 'success' : 'default'}
            sx={{ fontSize: '0.75rem' }}
          />
        // </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => {
        // Check if order is pending or completed with isOrderConfirmed
        const orderStatus = row.isOrderConfirmed?.status;
        const isERPConfirmed = row.erpConfirmStatus === 'Confirmed from ERP';
        // If ERP confirmed and status is pending, treat as confirmed
        const isConfirmed = isERPConfirmed && orderStatus === 'pending';
        const isPending = orderStatus === 'pending' && !isConfirmed;
        const isCompleted = orderStatus === 'completed';
        const isInProgress = orderStatus === 'in-progress';
        const isInvoiceGenerated = row.Invoice_Generated === true;
        const isLocked = row.isLocked === true;
        const orderSalesId = row.isOrderConfirmed?.sales_id;
        
        // Check if current user can access this order
        // If in-progress: only allow if sales_id matches current user's ID
        // If locked: only allow if sales_id exists and matches current user's ID
        // If confirmed: disable action (order is already confirmed)
        // Otherwise: allow access (for pending, completed, or not locked orders)
        const canAccessOrder = 
          isConfirmed
            ? false // Confirmed orders cannot be accessed
            : isInProgress 
              ? (orderSalesId && currentSalesId && orderSalesId === currentSalesId) // In-progress: must match sales_id
              : isLocked 
                ? (orderSalesId && currentSalesId && orderSalesId === currentSalesId) // Locked: must match sales_id if available
                : true; // Not in-progress and not locked: allow access
        
        // Determine which action to show in modal based on status
        let modalType: 'continue' | 'accept' | 'restart' = 'accept';
        if (isPending) {
          modalType = 'continue';
        } else if (isInProgress) {
          modalType = 'continue';
        } else if (isCompleted) {
          modalType = 'restart';
        }
        
        return (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={0.5}>
            <CustomButton
              size="small"
              appearance="outlined"
              onClick={() => handleOpenConfirmModal(modalType, row.Order_Number, isConfirmed ? 'confirmed' : orderStatus)}
              disabled={isInvoiceGenerated || (!isConfirmed && !canAccessOrder)}
              sx={{ 
                mt: 0, 
                height: 28, 
                width: 28,
                minWidth: 28,
                p: 0,
                '&:hover': {
                  backgroundColor: isConfirmed ? 'action.hover' : 'action.hover',
                },
                '&.Mui-disabled': {
                  opacity: isConfirmed ? 0.6 : 0.3,
                }
              }}
              fullWidth={false}
            >
              {isLocked && !isInProgress ? (
                <LockOutlined sx={{ fontSize: 18 }} />
              ) : (
                <ArrowForward sx={{ fontSize: 18 }} />
              )}
            </CustomButton>
            {isInvoiceGenerated && (
              <Typography fontSize={10} fontWeight={400} color="text.secondary">
                Invoice Generated
              </Typography>
            )}
            {isConfirmed && (
              <Typography fontSize={10} fontWeight={400} color="success.main">
                Confirmed
              </Typography>
            )}
          </Box>
        );
      },
    },
  ];

  // Get unique sales reps from order list for header display

  return (
    <Box sx={{ padding: '10px 20px' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyboardBackspaceOutlined
            onClick={() => window.history.back()}
            sx={{ cursor: 'pointer', width: 24, height: 24 }}
          />
          <Typography fontSize={20} fontWeight={500}>
            Order Confirmation
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2} flex={1} justifyContent="flex-end">
          <TextInput
            placeholder="Search orders..."
            icon={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 0, width: { xs: '200px', md: '300px' } }}
          />
          <IconButton
            onClick={() => setFilterDrawerOpen(true)}
            sx={{
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '4px',
              padding: '8px',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <FilterList />
          </IconButton>
        </Box>
      </Box>


      {/* Table */}
      <CommonTable
        data={orderList}
        containerHeight="calc(100vh - 380px)"
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 25, 50, 100]}
        showPageSizeSelector={true}
        showTotalItems={true}
        showPageNumbers={true}
        maxPageNumbers={5}
        loading={listLoading}
        filterComponent={null}
      />

      {/* Confirmation Modal */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setPendingAction(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {getConfirmTitle()}
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" color="text.secondary" fontSize={14}>
            {getConfirmMessage()}
          </Typography>
          {pendingAction && (
            <Box mt={1}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                Order Number: {pendingAction.orderNumber}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => {
              setConfirmModalOpen(false);
              setPendingAction(null);
            }}
            buttonType="cancel"
            appearance="outlined"
            size="small"
            fullWidth={false}
            sx={{ minWidth: 100 }}
            disabled={acceptLoading || restartLoading || lockLoading}
          >
            Cancel
          </CustomButton>
          
          {/* Show all buttons for pending status */}
          {pendingAction?.status === 'pending' && (
            <>
              <CustomButton
                onClick={async () => {
                  if (!pendingAction) return;
                  try {
                    // Call lock API when status is pending
                    await dispatch(lockOrderConfirmationThunk(pendingAction.orderNumber)).unwrap();
                    toast.success('Order locked successfully');
                    // Refresh the order list
                    dispatch(
                      fetchOrderConfirmationList({
                        page: currentPage,
                        limit: pageSize,
                        startDate: appliedStartDate && dayjs.isDayjs(appliedStartDate) ? appliedStartDate.format('YYYY-MM-DD') : undefined,
                        endDate: appliedEndDate && dayjs.isDayjs(appliedEndDate) ? appliedEndDate.format('YYYY-MM-DD') : undefined,
                        search: search || undefined,
                        status: appliedStatus !== 'all' ? appliedStatus : undefined,
                      })
                    );
                    navigate(`/sales/order-confirmation/${pendingAction.orderNumber}?mode=continue`);
                    setConfirmModalOpen(false);
                    setPendingAction(null);
                  } catch (error: any) {
                    toast.error(error || 'Failed to continue order');
                  }
                }}
                appearance="filled"
                fullWidth={false}
                sx={{ minWidth: 100 }}
                size="small"
                loading={lockLoading}
                disabled={acceptLoading || restartLoading || lockLoading}
              >
                Continue
              </CustomButton>
              <CustomButton
                onClick={async () => {
                  if (!pendingAction) return;
                  try {
                    await dispatch(restartOrderConfirmationThunk({ orderNumber: pendingAction.orderNumber, currentOrderline: 0 })).unwrap();
                    toast.success('Order restarted successfully');
                    dispatch(
                      fetchOrderConfirmationList({
                        page: currentPage,
                        limit: pageSize,
                        startDate: appliedStartDate && dayjs.isDayjs(appliedStartDate) ? appliedStartDate.format('YYYY-MM-DD') : undefined,
                        endDate: appliedEndDate && dayjs.isDayjs(appliedEndDate) ? appliedEndDate.format('YYYY-MM-DD') : undefined,
                        search: search || undefined,
                        status: appliedStatus !== 'all' ? appliedStatus : undefined,
                      })
                    );
                    navigate(`/sales/order-confirmation/${pendingAction.orderNumber}?mode=restart`);
                    setConfirmModalOpen(false);
                    setPendingAction(null);
                  } catch (error: any) {
                    toast.error(error || 'Failed to restart order');
                  }
                }}
                appearance="outlined"
                fullWidth={false}
                sx={{ minWidth: 100 }}
                size="small"
                loading={restartLoading}
                disabled={acceptLoading || restartLoading || lockLoading}
              >
                Restart
              </CustomButton>
            </>
          )}
          
          {/* Show Continue button for in-progress status */}
          {pendingAction?.status === 'in-progress' && (
            <CustomButton
              onClick={() => {
                if (!pendingAction) return;
                // Navigate directly to continue the in-progress order
                navigate(`/sales/order-confirmation/${pendingAction.orderNumber}?mode=continue`);
                setConfirmModalOpen(false);
                setPendingAction(null);
              }}
              appearance="filled"
              fullWidth={false}
              sx={{ minWidth: 100 }}
              size="small"
              disabled={acceptLoading || restartLoading || lockLoading}
            >
              Continue
            </CustomButton>
          )}
          
          {/* Show buttons for completed status */}
          {pendingAction?.status === 'completed' && (
            <>
              <CustomButton
                onClick={() => {
                  if (!pendingAction) return;
                  navigate(`/sales/order-confirmation/${pendingAction.orderNumber}?mode=review`);
                  setConfirmModalOpen(false);
                  setPendingAction(null);
                }}
                appearance="outlined"
                fullWidth={false}
                sx={{ minWidth: 100 }}
                size="small"
                disabled={restartLoading || lockLoading}
              >
                Review
              </CustomButton>
              <CustomButton
                onClick={handleConfirmAction}
                appearance="filled"
                fullWidth={false}
                sx={{ minWidth: 100 }}
                size="small"
                loading={restartLoading}
                disabled={restartLoading || lockLoading}
              >
                Restart
              </CustomButton>
            </>
          )}
          
          {/* Show button for accept (default) */}
          {pendingAction?.type === 'accept' && !pendingAction?.status && (
            <CustomButton
              onClick={handleConfirmAction}
              appearance="filled"
              fullWidth={false}
              sx={{ minWidth: 100 }}
              size="small"
              loading={acceptLoading}
              disabled={acceptLoading || restartLoading || lockLoading}
            >
              OK
            </CustomButton>
          )}
          
          {/* Show Review and Close buttons for confirmed status */}
          {pendingAction?.status === 'confirmed' && (
            <>
              <CustomButton
                onClick={() => {
                  setConfirmModalOpen(false);
                  setPendingAction(null);
                }}
                appearance="outlined"
                fullWidth={false}
                sx={{ minWidth: 100 }}
                size="small"
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={() => {
                  if (!pendingAction) return;
                  navigate(`/sales/order-confirmation/${pendingAction.orderNumber}?mode=review`);
                  setConfirmModalOpen(false);
                  setPendingAction(null);
                }}
                appearance="filled"
                fullWidth={false}
                sx={{ minWidth: 100 }}
                size="small"
              >
                Review
              </CustomButton>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '400px' },
            p: 3,
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterDrawerOpen(false)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <KeyboardBackspaceOutlined />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Filter Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {/* Date Range Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Date Range
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box display="flex" flexDirection="column" gap={2}>
                  {/* Start Date */}
                  <DatePicker
                    label="Start Date"
                    value={localStartDate && dayjs.isDayjs(localStartDate) ? localStartDate : null}
                    onChange={(date: Dayjs | null) => setLocalStartDate(date)}
                    maxDate={localEndDate && dayjs.isDayjs(localEndDate) ? localEndDate : undefined}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        variant: 'outlined',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '4px',
                          },
                          '& .MuiInputBase-input': {
                            fontSize: '12px !important',
                            padding: '8.5px 14px',
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '12px',
                          },
                        },
                        inputProps: {
                          style: {
                            fontSize: '12px',
                          },
                        },
                      },
                      popper: {
                        sx: {
                          '& .MuiPickersCalendarHeader-root': {
                            fontSize: '12px',
                          },
                          '& .MuiPickersDay-root': {
                            fontSize: '12px',
                            width: '32px',
                            height: '32px',
                          },
                          '& .MuiDayCalendar-weekContainer': {
                            fontSize: '12px',
                          },
                          '& .MuiPickersCalendarHeader-label': {
                            fontSize: '12px',
                          },
                          '& .MuiPickersArrowSwitcher-root': {
                            fontSize: '12px',
                          },
                        },
                      },
                    }}
                  />
                  {/* End Date */}
                  <DatePicker
                    label="End Date"
                    value={localEndDate && dayjs.isDayjs(localEndDate) ? localEndDate : null}
                    onChange={(date: Dayjs | null) => setLocalEndDate(date)}
                    minDate={localStartDate && dayjs.isDayjs(localStartDate) ? localStartDate : undefined}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        variant: 'outlined',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '4px',
                          },
                          '& .MuiInputBase-input': {
                            fontSize: '12px !important',
                            padding: '8.5px 14px',
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '12px',
                          },
                        },
                        inputProps: {
                          style: {
                            fontSize: '12px',
                          },
                        },
                      },
                      popper: {
                        sx: {
                          '& .MuiPickersCalendarHeader-root': {
                            fontSize: '12px',
                          },
                          '& .MuiPickersDay-root': {
                            fontSize: '12px',
                            width: '32px',
                            height: '32px',
                          },
                          '& .MuiDayCalendar-weekContainer': {
                            fontSize: '12px',
                          },
                          '& .MuiPickersCalendarHeader-label': {
                            fontSize: '12px',
                          },
                          '& .MuiPickersArrowSwitcher-root': {
                            fontSize: '12px',
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>

            {/* Status Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Status
              </Typography>
              <SelectInput
                label=""
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Completed', value: 'completed' },
                ]}
                value={localStatus}
                onChange={handleStatusChange as any}
                marginBottom="0"
              />
            </Box>
          </Box>

          {/* Drawer Footer with Action Buttons */}
          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" gap={2}>
              <CustomButton
                onClick={handleResetFilters}
                appearance="outlined"
                fullWidth
                size="medium"
              >
                Reset
              </CustomButton>
              <CustomButton
                onClick={handleApplyFilters}
                appearance="filled"
                fullWidth
                size="medium"
              >
                Apply
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default OrderConfirmation;
