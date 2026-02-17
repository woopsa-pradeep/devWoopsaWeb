import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Tabs, Tab, Paper, useTheme, useMediaQuery, CircularProgress, Alert, Snackbar, TextField, InputAdornment } from '@mui/material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import { fetchLoginDevices, updateLoginDevice, fetchRetailerSignUpRequests, updateRetailerSignUpRequest } from '../../../redux/apis/distrubutor/loginDeviceApis';
import SwitchInput from '../../../component/atoms/SwitchInput';
import DeleteConfirmationModal from '../../../component/atoms/DeleteConfirmationModal';
import { DevicesOutlined, LoginOutlined, Search } from '@mui/icons-material';
import { useDebounce } from '../../../hooks/useDebounce';
import dayjs from 'dayjs';

const createSignInColumns = (onToggle: (row: any, field: string, value: boolean) => void): TableColumn<any>[] => [
  { 
    id: 'customerNumber', 
    label: 'Customer Id', 
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }} 
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.customer?.C_Number || '-'}
      </Typography>
    ) 
  },
  { 
    id: 'customerName', 
    label: 'Customer Name',
    sortable: true,
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.customer?.C_Name || '-'}
      </Typography>
    ) 
  },
  {
    id:'createdAt',
    label: 'Created At',
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {dayjs(row?.createdAt).format('MM/DD/YYYY HH:mm') || '-'}
      </Typography>
    ) 
  },
  {
    id: 'isAllow',
    label: 'Approved?',
    render: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwitchInput
          checked={row?.isAllow ?? false}
          onChange={() => onToggle(row, 'isAllow', !(row?.isAllow ?? false))}
          isShowLabel={false}
          disabled={row?.isAllowLoading || row?.isLoading}
          sx={{ mb: 0 }}
        />
        {(row?.isAllowLoading || row?.isLoading) && (
          <CircularProgress size={16} sx={{ color: 'primary.main' }} />
        )}
      </Box>
    ),
  },
];

const createDeviceColumns = (onToggle: (row: any, field: string, value: boolean) => void): TableColumn<any>[] => [
  { 
    id: 'customerNumber', 
    label: 'Customer Id', 
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.customer?.C_Number || '-'}
      </Typography>
    ) 
  },
  { 
    id: 'customerName', 
    label: 'Customer Name',
    sortable: true,
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.customer?.C_Name || '-'}
      </Typography>
    ) 
  },
  { 
    id: 'deviceType', 
    label: 'Device Type', 
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.deviceType || '-'}
      </Typography>
    ) 
  },
  { 
    id: 'deviceName', 
    label: 'Device Name', 
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.deviceName || '-'}
      </Typography>
    ) 
  },
  { 
    id: 'deviceId', 
    label: 'Device ID', 
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {row?.deviceId || '-'}
      </Typography>
    ) 
  },
  {
    id:'createdAt',
    label: 'Created At',
    render: (row) => (
      <Typography 
        color="text.secondary" 
        fontSize={{ xs: 12, sm: 14 }}
        sx={{ wordBreak: 'break-word' }}
      >
        {dayjs(row?.createdAt).format('MM/DD/YYYY HH:mm') || '-'}
      </Typography>
    ) 
  },
  {
    id: 'isAllow',
    label: 'Approved?',
    render: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwitchInput
          checked={row.isAllow}
          onChange={() => onToggle(row, 'isAllow', !row.isAllow)}
          isShowLabel={false}
          disabled={row?.isAllowLoading || row?.isLoading}
          sx={{mb:0}}
        />
        {(row?.isAllowLoading || row?.isLoading) && (
          <CircularProgress size={16} sx={{ color: 'primary.main' }} />
        )}
      </Box>
    ),
  },
  {
    id: 'sessionActive',
    label: 'User Session Active?',
    render: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwitchInput
          checked={row.sessionActive}
          onChange={() => onToggle(row, 'sessionActive', !row.sessionActive)}
          isShowLabel={false}
          disabled={row?.sessionActiveLoading || row?.isLoading}
          sx={{mb:0}}
        />
        {(row?.sessionActiveLoading || row?.isLoading) && (
          <CircularProgress size={16} sx={{ color: 'primary.main' }} />
        )}
      </Box>
    ),
  },
];

const TrackLoginDevices = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // 0: Sign In Request, 1: Device Request
  const [verticalTab, setVerticalTab] = useState(0);
  // 0: Pending, 1: Approved
  const [horizontalTab, setHorizontalTab] = useState(0);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: '',
    message: '',
    field: '',
    value: false,
    row: null as any,
  });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Handle switch toggle with confirmation
  const handleToggle = (row: any, field: string, value: boolean) => {
    const fieldLabels = {
      isAllow: 'Approval Status',
      sessionActive: 'Session Status'
    };
    
    const action = value ? 'enable' : 'disable';
    const fieldLabel = fieldLabels[field as keyof typeof fieldLabels] || field;
    
    setConfirmationModal({
      open: true,
      title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} ${fieldLabel.toLowerCase()} for this ${verticalTab === 1 ? 'device' : 'sign-up request'}?`,
      field,
      value,
      row,
    });
  };

  // Handle confirmation modal confirm
  const handleConfirmToggle = async () => {
    const { field, value, row } = confirmationModal;
    
    // Set loading state for the specific field of the specific row
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === row.id 
          ? { 
              ...device, 
              [`${field}Loading`]: true,
              isLoading: true // Keep general loading for backward compatibility
            } 
          : device
      )
    );

    try {
      if (verticalTab === 1) { // Device Request
        await updateLoginDevice(row.id, { [field]: value });
      } else { // Sign In Request
        await updateRetailerSignUpRequest(row.id, { [field]: value });
      }
      
      setSnackbar({
        open: true,
        message: `${field === 'isAllow' ? 'Approval' : 'Session'} status updated successfully`,
        severity: 'success',
      });
      
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to update status. Please try again.',
        severity: 'error',
      });
      
      // Reset loading state for the specific field
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === row.id 
            ? { 
                ...device, 
                [`${field}Loading`]: false,
                isLoading: false 
              } 
            : device
        )
      );
    } finally {
      setConfirmationModal(prev => ({ ...prev, open: false }));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pending = horizontalTab === 0;
      const isAllow = horizontalTab === 1;
      if (verticalTab === 1) { // Device Request
        const response = await fetchLoginDevices({
          pending,
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm,
        }) as any;
        setDevices(
          response?.data?.data?.deviceList?.map((item: any) => ({
            ...item,
            isLoading: false,
            isAllowLoading: false,
            sessionActiveLoading: false,
          })) || []
        );
        setTotalItems(response?.data?.data?.totalCount || 0);
        setTotalPages(Math.ceil((response?.data?.data?.totalCount || 0) / pageSize));
      } else { // Sign In Request
        const response = await fetchRetailerSignUpRequests({
            isAllow,
          page: currentPage,
          limit: pageSize,
          search: debouncedSearchTerm,
        }) as any;
        setDevices(
          response?.data?.data?.retailerListWithCustomer?.map((item: any) => ({
            ...item,
            isLoading: false,
            isAllowLoading: false,
          })) || []
        );
        setTotalItems(response?.data?.data?.totalCount || 0);
        setTotalPages(Math.ceil((response?.data?.data?.totalCount || 0) / pageSize));
      }
    } finally {
      setLoading(false);
    }
  }, [verticalTab, horizontalTab, currentPage, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data based on current sort field and direction
  const sortedData = useMemo(() => {
    if (!sortField) return devices;
    
    return [...devices].sort((a, b) => {
      let aValue = a?.customer?.C_Name || '';
      let bValue = b?.customer?.C_Name || '';
      
      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [devices, sortField, sortDirection]);

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100%', 
      flexDirection: 'column',
      px: { xs: 0.5, sm: 1, md: 2 },
      py: { xs: 1, sm: 2 }
    }}>
      <Typography 
        fontSize={{ xs: 16, sm: 18, md: 20 }} 
        fontWeight={400} 
        color="text.primary" 
        mb={{ xs: 2, sm: 3 }} 
        sx={{ wordBreak: 'break-word' }}
      >
        Track Login Devices
      </Typography>   
      
      <Box sx={{ 
        display: 'flex', 
        // height: '95%', 
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 2, lg: 3 }
      }}>
        {/* Vertical Tabs - Responsive */}
        <Box sx={{ 
          width: { xs: '100%', lg: 280 },
          minWidth: { xs: '100%', lg: 280 },
          // borderRight: { xs: 0, lg: 1 }, 
          // borderBottom: { xs: 1, lg: 0 },
          borderRadius: { xs: 2, lg: 2 }, 
          borderColor: 'divider', 
          bgcolor: 'background.paper', 
          py: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 1 }
        }}>
          <Tabs
            orientation={isTablet ? "horizontal" : "vertical"}
            value={verticalTab} 
            onChange={(_, v) => { 
              setVerticalTab(v); 
              setHorizontalTab(0); // Reset horizontal tab to Pending
              setCurrentPage(1);
              setSortField(null); // Reset sort when switching tabs
              setSortDirection('asc');
            }}
            sx={{
              '& .MuiTabs-indicator': {
                display: 'block'
              },
              '& .MuiTabs-flexContainer': {
                flexDirection: { xs: 'row', lg: 'column' },
                gap: { xs: 1, lg: 0 }
              }
            }}
          >
            <Tab 
              icon={<LoginOutlined sx={{fontSize: { xs: 20, sm: 22}}} />}
              iconPosition="start"
              label={isSmallMobile ? "Sign Up" : "Sign Up Request"} 
              sx={{ 
                alignItems: 'center', 
                textAlign: 'left',
                justifyContent: 'flex-start', 
                fontWeight: 400, 
                fontSize: { xs: 13, sm: 14, md: 15 }, 
                mb: { xs: 0, lg: 1 }, 
                textTransform: 'none', 
                minHeight: { xs: '40px', md: '50px' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 }
              }} 
            />
            <Tab 
              icon={<DevicesOutlined sx={{fontSize: { xs: 20, sm: 22}}} />}
              iconPosition="start"
              label={isSmallMobile ? "Devices" : "Device Request"} 
              sx={{ 
                alignItems: 'center', 
                textAlign: 'left',
                justifyContent: 'flex-start', 
                fontWeight: 400, 
                fontSize: { xs: 13, sm: 14, md: 15 }, 
                textTransform: 'none', 
                minHeight: { xs: '40px', md: '50px' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 }
              }} 
            />
          </Tabs>
        </Box>
        
        {/* Main Content Area */}
        <Box sx={{ 
          flex: 1, 
          width: '100%',
          minWidth: 0 // Prevents flex item from overflowing
        }}>
          <Paper sx={{ 
            boxShadow: 'none', 
            borderRadius: 2, 
            width: '100%', 
            overflow: 'hidden',
          }}>
            {/* Tabs and Search Bar Container */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              mt: { xs: 1, sm: 2 },
              borderBottom: 1,
              borderColor: 'divider',
              gap: { xs: 1, sm: 2 }
            }}>
              {/* Horizontal Tabs */}
              <Tabs
                value={horizontalTab}
                onChange={(_, v) => { 
                  setHorizontalTab(v); 
                  setCurrentPage(1);
                  setSortField(null); // Reset sort when switching tabs
                  setSortDirection('asc');
                }}
                sx={{ 
                  minHeight: { xs: '30px !important', sm: '35px !important' },
                  '& .MuiTabs-flexContainer': {
                    gap: { xs: 0.5, sm: 1 }
                  }
                }}
                variant={isSmallMobile ? "fullWidth" : "standard"}
              >
                <Tab 
                  label="Pending" 
                  sx={{
                    backgroundColor: horizontalTab === 0 ? 'primary.main' : 'transparent',
                    borderRadius: { xs: '6px 6px 0 0', sm: '8px 8px 0 0' },
                    textTransform: 'none',
                    fontWeight: 400,
                    fontSize: { xs: 13, sm: 14 },
                    '&.Mui-selected': {
                      color: 'white',
                    },
                    minHeight: { xs: '30px !important', sm: '35px !important' },
                    px: { xs: 1, sm: 2 },
                  }} 
                />
                <Tab 
                  label="Approved" 
                  sx={{
                    backgroundColor: horizontalTab === 1 ? 'primary.main' : 'transparent',
                    borderRadius: { xs: '6px 6px 0 0', sm: '8px 8px 0 0' },
                    textTransform: 'none',
                    fontWeight: 400,
                    fontSize: { xs: 13, sm: 14 },
                    '&.Mui-selected': {
                      color: 'white',
                    },
                    minHeight: { xs: '30px !important', sm: '35px !important' },
                    px: { xs: 1, sm: 2 }, 
                  }} 
                />
              </Tabs>
              
              {/* Search Bar */}
              <TextField
                placeholder={`Search by Customer Number`}
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                sx={{
                  width: { xs: '100%', sm: '250px', md: '300px' },
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            {/* Table */}
            <CommonTable
              data={sortedData}
              columns={verticalTab === 1 ? createDeviceColumns(handleToggle) : createSignInColumns(handleToggle)}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
              containerHeight={isMobile ? "calc(100vh - 400px)" : "calc(100vh - 360px)"}
              padding={isSmallMobile ? "8px" : "16px"}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </Paper>
        </Box>
      </Box>

      {/* Confirmation Modal */}
      <DeleteConfirmationModal
        open={confirmationModal.open}
        onClose={() => setConfirmationModal(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirmToggle}
        title={confirmationModal.title}
        message={confirmationModal.message}
        buttonText="Confirm"
        buttonType="delete"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrackLoginDevices;