import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import moment from 'moment';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CustomButton from '../../../component/atoms/CustomButton';
import { getCustomerOrderList, getCustomerById, getCustomerOrderDetailInCalender, salesCallTime, salesCallTimeUpdate, addNote, updateNote, deleteNote } from '../../../redux/apis/sales/salesCalenderApis';
import { setSalesSession } from '../../../redux/apis/sales/profileApis';
import { setSelectedCustomer, updateSessionCustomer } from '../../../redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import toast from 'react-hot-toast';

interface CustomerData {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_OrderDay: number;
  OrderDayName: string;
  C_Phone: string;
  C_Email: string;
  C_Address: any;
  C_City: any;
  Route_Number?: any;
  Stop_Number?: any;
  'Routes.Route_Number'?: number;
  'Routes.Stop_Number'?: number;
  C_State: any;
  C_Zip: any;
  C_Country: any;
  status: string;
  time:any;
}

interface CustomerDetails {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_Email: string;
  TermsCode: number;
  C_Phone: string;
  C_Memo: string;
  C_PhoneMobile: string;
  Credit_Limit: number;
  LastBalance: number;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_Country: string;
  C_OperationHours1: number;
  C_OperationHours2: number;
  salesNotes: any[];
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

const SalesStatusView: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCustomer: currentSalesman } = useAppSelector((state: any) => state.auth);
  const state = location.state as LocationState;

  const selectedDate = state?.selectedDate;
  const customers = state?.customers || [];
  const customerDay = customers[0]?.C_OrderDay;


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [customerOrderData, setCustomerOrderData] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomerForChange] = useState<any>(null);
  const [changeLoading, setChangeLoading] = useState(false);

  // Customer details modal state
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Order details modal state
  const [openOrderDetailsModal, setOpenOrderDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [selectedCustomerForOrder, setSelectedCustomerForOrder] = useState<any>(null);

  // Add state for time picker modal
  const [timePickerModalOpen, setTimePickerModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);
  const [timeUpdateLoading, setTimeUpdateLoading] = useState(false);

  // Add state for notes modal
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [selectedCustomerForNotes, setSelectedCustomerForNotes] = useState<any>(null);

  // Add state for editing notes
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const dispatch = useAppDispatch();

  
  const fetchCustomerOrderData = async () => {
    if (!selectedDate || customers.length === 0) return;

    setLoading(true);
    try {
      // Call API for each customer with their order day
      const orderPromises: any = await getCustomerOrderList({
        orderDate: selectedDate,
        orderNumber: customerDay,
      })


      setCustomerOrderData(orderPromises?.data || []);
    } catch (error) {
      console.error('Error fetching customer order data:', error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch customer order data when component mounts or selectedDate changes
  useEffect(() => {
   

    fetchCustomerOrderData();
  }, [selectedDate, customers, customerDay]);

  const handleBackClick = () => {
    navigate('/sales/calender');
  };

  const handleChangeSalesman = (customer: any) => {
    setSelectedCustomerForChange(customer);
    setOpenDialog(true);
  };

  const handleViewCustomerDetails = async (customer: any) => {
    setDetailsLoading(true);
    setOpenDetailsModal(true);

    try {
      const response: any = await getCustomerById(customer.C_Number);
      setCustomerDetails(response.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setCustomerDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setCustomerDetails(null);
  };

  const handleViewOrderDetails = async (customer: any) => {
    setSelectedCustomerForOrder(customer);
    setOrderDetailsLoading(true);
    setOpenOrderDetailsModal(true);

    try {
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      const response: any = await getCustomerOrderDetailInCalender({
        customerId: customer.C_Number,
        orderDate: formattedDate
      });
      
      if (response.success && response.data?.orders) {
        setOrderDetails(response.data.orders);
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

  const handleCloseOrderDetailsModal = () => {
    setOpenOrderDetailsModal(false);
    setOrderDetails([]);
    setSelectedCustomerForOrder(null);
  };

  const handleConfirmChange = async () => {
    if (!selectedCustomer) return;

    setChangeLoading(true);
    try {
      const sessionResponse = await setSalesSession(selectedCustomer.C_Number.toString());
      // Update session state in Redux
      dispatch(updateSessionCustomer(selectedCustomer.C_Number.toString()));

      // Store selected customer in Redux
      dispatch(setSelectedCustomer(selectedCustomer));

      // Update store details with the response from setSalesSession
      if (sessionResponse && typeof sessionResponse === 'object' && 'data' in sessionResponse) {
        const responseData = sessionResponse as any;
        if (responseData.data?.data) {
          const storeDetails = responseData.data.data;
          // Update the store details in Redux state
          dispatch({
            type: 'auth/updateStoreDetails',
            payload: {
              C_CoName: storeDetails.C_CoName,
              C_Number: storeDetails.C_Number,
              C_Name: storeDetails.C_Name,
              C_Address: storeDetails.C_Address,
              C_City: storeDetails.C_City,
              C_State: storeDetails.C_State,
              C_Phone: storeDetails.C_Phone,
              LastBalance: Number(storeDetails.LastBalance) ,
              C_OrderDay: storeDetails.C_OrderDay,
              Routes: storeDetails.Routes,
              salesRep: storeDetails.salesRep,
              C_Zip: storeDetails.C_Zip,
              Jurisdiction_State: storeDetails.Jurisdiction_State,
            }
          });
        }
      }

      // Refresh the page after a short delay to ensure state updates are processed
      setTimeout(() => {
        window.location.reload();
      }, 100);
      // console.log('Sales session changed successfully for customer:', selectedCustomer.C_Number); 
      // You can add a success message or refresh the data here
    } catch (error) {
      console.error('Error changing sales session:', error);
      // You can add an error message here
    } finally {
      setChangeLoading(false);
      setOpenDialog(false);
      setSelectedCustomerForChange(null);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomerForChange(null);
  };

  // Handle time picker modal open
  const handleTimePickerOpen = (row: any) => {
    // Check if time exists in both old and new formats
    const hasTime = (typeof row.time === 'object' && row.time?.time) || (typeof row.time === 'string' && row.time);
    
    setSelectedRow(row);
    
    if (hasTime) {
      // If editing existing time, pre-fill the time picker
      const existingTime = typeof row.time === 'object' ? row.time.time : row.time;
      // Convert time string to Dayjs object for the time picker
      const [hours, minutes] = existingTime.split(':');
      setSelectedTime(dayjs().hour(parseInt(hours)).minute(parseInt(minutes)));
    } else {
      // If creating new time, start with null
      setSelectedTime(null);
    }
    
    setTimePickerModalOpen(true);
  };

  // Handle time picker modal close
  const handleTimePickerClose = () => {
    setTimePickerModalOpen(false);
    setSelectedRow(null);
    setSelectedTime(null);
  };

  // Notes modal handlers
  const handleOpenNotesModal = (customer: any) => {
    setSelectedCustomerForNotes(customer);
    setNoteText('');
    setNotesModalOpen(true);
  };

  const handleCloseNotesModal = () => {
    setNotesModalOpen(false);
    setSelectedCustomerForNotes(null);
    setNoteText('');
    setIsEditingNote(false);
    setEditingNoteId(null);
  };

  const handleSubmitNote = async () => {
    if (!noteText.trim() || !selectedCustomerForNotes) {
      toast.error('Please enter a note');
      return;
    }

    setNoteLoading(true);
    try {
      if (isEditingNote && editingNoteId) {
        // Update existing note
        const payload = {
          id: editingNoteId,
          note: noteText.trim()
        };

        const response: any = await updateNote(payload);
        
        if (response.success) {
          toast.success('Note updated successfully!');
          handleCloseNotesModal();
          // Refresh customer details to show updated notes
          if (customerDetails) {
            handleViewCustomerDetails({ C_Number: customerDetails.C_Number });
          }
        } else {
          toast.error(response.message || 'Failed to update note');
        }
      } else {
        // Create new note
        const payload = {
          CustomerNumber: selectedCustomerForNotes.C_Number,
          note: noteText.trim()
        };

        const response: any = await addNote(payload);
        
        if (response.success) {
          toast.success('Note added successfully!');
          handleCloseNotesModal();
          // Refresh customer details to show new note
          if (customerDetails) {
            handleViewCustomerDetails({ C_Number: customerDetails.C_Number });
          }
        } else {
          toast.error(response.message || 'Failed to add note');
        }
      }
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast.error(error.response?.data?.message || 'Failed to save note');
    } finally {
      setNoteLoading(false);
    }
  };

  // Handle edit note
  const handleEditNote = (note: any) => {
    setIsEditingNote(true);
    setEditingNoteId(note.id);
    setNoteText(note.note);
    setSelectedCustomerForNotes(customerDetails);
    setNotesModalOpen(true);
  };

  // Handle delete note
  const handleDeleteNote = async (note: any) => {
    try {
      const response: any = await deleteNote({ id: note.id });
      
      if (response.success) {
        toast.success('Note deleted successfully!');
        // Refresh customer details to show updated notes
        if (customerDetails) {
          handleViewCustomerDetails({ C_Number: customerDetails.C_Number });
        }
      } else {
        toast.error(response.message || 'Failed to delete note');
      }
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast.error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  // Handle time update
  const handleTimeUpdate = async () => {
    if (!selectedRow || !selectedTime) {
      toast.error('Please select a time');
      return;
    }

    setTimeUpdateLoading(true);
    try {
      const hasExistingTime = (typeof selectedRow.time === 'object' && selectedRow.time?.time) || (typeof selectedRow.time === 'string' && selectedRow.time);
      
      if (hasExistingTime) {
        // Update existing time using the edit API
        const timeId = typeof selectedRow.time === 'object' ? selectedRow.time.id : null;
        if (!timeId) {
          toast.error('Time ID not found for update');
          return;
        }
        
        const payload = {
          id: timeId,
          time: selectedTime.format('HH:mm')
        };

        const response: any = await salesCallTimeUpdate(payload);
        
        if (response.success) {
          toast.success('Time updated successfully!');
          handleTimePickerClose();
          // Refresh the data
          await fetchCustomerOrderData();
        } else {
          toast.error(response.message || 'Failed to update time');
        }
      } else {
        // Create new time using the create API
        const payload = {
          customer_number: selectedRow.C_Number,
          salesRepNumber: selectedRow.C_Salesman,
          time: selectedTime.format('HH:mm')
        };

        const response: any = await salesCallTime(payload);
        
        if (response.success) {
          toast.success('Time created successfully!');
          handleTimePickerClose();
          // Refresh the data
          await fetchCustomerOrderData();
        } else {
          toast.error(response.message || 'Failed to create time');
        }
      }
    } catch (error: any) {
      console.error('Error updating time:', error);
      toast.error(error.response?.data?.message || 'Failed to update time');
    } finally {
      setTimeUpdateLoading(false);
    }
  };

  // Define table columns to match the spreadsheet image
  const columns: TableColumn<CustomerData>[] = [
    {
      id: 'C_Number',
      label: 'ACC NO.',
      align: 'center',
      render: (row) => (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
          {row.C_Number}
        </Typography>
      )
    },
    {
      id: 'C_Name',
      label: 'STORE',
      align: 'left',
      render: (row) => (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
          {row.C_Name}
        </Typography>
      )
    },
    {
      id: 'address',
      label: 'ADDRESS',
      align: 'left',
      render: (row) => (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
          {row.C_State + ' ' + row.C_City + ' ' + row.C_Zip + ' ' + row.C_Country + ' ' + row.C_Address || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'Route_Number',
      label: 'ROUTE',
      align: 'center',
      render: (row) => (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
          {row['Routes.Route_Number'] || row.Route_Number || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'Stop_Number',
      label: 'STOP',
      align: 'center',
      render: (row) => (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
          {row['Routes.Stop_Number'] || row.Stop_Number || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'C_Phone',
      label: 'PHONE NO.',
      align: 'center',
      render: (row) => (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
          {row.C_Phone || 'N/A'}
        </Typography>
      )
    },
      {
        id: 'C_Email',
        label: 'EMAIL',
        align: 'center',
        render: (row) => (
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
            {row.C_Email || 'N/A'}
          </Typography>
        )
      },
      {
        id: 'time',
        label: 'TIME',
        align: 'center',
        render: (row) => {
          // Handle both old string format and new object format
          const timeValue = typeof row.time === 'object' && row.time?.time ? row.time.time : row.time;
          const hasTime = timeValue && timeValue !== '';
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Box 
                onClick={() => !hasTime && handleTimePickerOpen(row)}
                sx={{ 
                  cursor: !hasTime ? 'pointer' : 'default',
                  '&:hover': !hasTime ? { 
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: 1,
                    px: 1,
                    py: 0.5
                  } : {}
                }}
              >
                <Typography sx={{ 
                  color: !hasTime ? theme.palette.primary.main : theme.palette.text.secondary, 
                  fontSize: '0.875rem',
                  textDecoration: !hasTime ? 'underline' : 'none'
                }}>
                  {hasTime ? timeValue : 'Click to set time'}
                </Typography>
              </Box>
              
              {/* Edit Icon for existing time */}
              {hasTime && (
                <Box
                  onClick={() => handleTimePickerOpen(row)}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      borderRadius: '50%',
                      p: 0.5
                    }
                  }}
                >
                  <EditIcon 
                    sx={{ 
                      fontSize: '1rem', 
                      color: theme.palette.primary.main,
                      '&:hover': {
                        color: theme.palette.primary.dark
                      }
                    }} 
                  />
                </Box>
              )}
            </Box>
          );
        }
      },
    {
      id: 'status',
      label: 'STATUS',
      align: 'center',
      render: (row) => {
        return (
          <Chip
            label={row.status}
            size="small"
            sx={{
              backgroundColor: row.status === 'done'
                ? `${theme.palette.success.main}33`
                : `${theme.palette.warning.main}33`,
              border: `1px solid ${row.status === 'done' ? theme.palette.success.main : theme.palette.warning.main}`,
              color: row.status === 'done' ? theme.palette.success.main : theme.palette.warning.main,
              fontSize: '0.75rem',
              fontWeight: 400
            }}
          />
        );
      }
    },
    {
      id: 'actions',
      label: 'ACTIONS',
      align: 'center',
      render: (row) => {
        const isCurrentCustomer = currentSalesman?.C_Number === row.C_Number;

        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Tooltip title="View Customer Details">
              <span>
                <CustomButton
                  appearance="outlined"
                  size="small"
                  fullWidth={false}
                  icon={<VisibilityIcon sx={{ fontSize: '1.2rem' }} />}
                  onClick={() => handleViewCustomerDetails(row)}
                  sx={{
                    padding: '6px',
                    minWidth: '36px',
                    height: '36px',
                    mt: 0,
                    borderRadius: '8px',
                  }}
                >
                  {''}
                </CustomButton>
              </span>
            </Tooltip>
            <Tooltip title="View Orders">
              <span>
                <CustomButton
                  appearance="outlined"
                  size="small"
                  fullWidth={false}
                  icon={<ReceiptIcon sx={{ fontSize: '1.2rem' }} />}
                  onClick={() => handleViewOrderDetails(row)}
                  sx={{
                    padding: '6px',
                    minWidth: '36px',
                    height: '36px',
                    mt: 0,
                    borderRadius: '8px',
                  }}
                >
                  {''}
                </CustomButton>
              </span>
            </Tooltip>
            <Tooltip title="Jump Customer">
              <span>
                <CustomButton
                  appearance="filled"
                  size="small"
                  fullWidth={false}
                  icon={<SwitchAccountIcon sx={{ fontSize: '1.2rem' }} />}
                  iconPosition="left"
                  onClick={isCurrentCustomer ? undefined : () => handleChangeSalesman(row)}
                  disabled={isCurrentCustomer}
                  sx={{
                    padding: '6px',
                    minWidth: '36px',
                    height: '36px',
                    mt: 0,
                    borderRadius: '8px',
                  }}
                >
                  {''}
                </CustomButton>
              </span>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography fontSize="16px" fontWeight={500} display="flex" alignItems="center" gap={1}>
          <ArrowBackIcon onClick={handleBackClick} sx={{ cursor: 'pointer', color: theme.palette.primary.main, fontSize: '18px' }} />
          Sales Status for {moment(selectedDate).format('dddd, MMMM D, YYYY')}
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {selectedDate ? (
          <>
            <CommonTable
              data={customerOrderData}
              columns={columns}
              currentPage={currentPage}
              totalPages={Math.ceil(customerOrderData.length / pageSize)}
              totalItems={customerOrderData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 25, 50]}
              showPageSizeSelector={true}
              showTotalItems={true}
              showPageNumbers={true}
              maxPageNumbers={5}
              stickyHeader={true}
              containerHeight="500px"
              loading={loading}
              getRowStyle={(row) => {
                const isCurrentCustomer = currentSalesman?.C_Number === row.C_Number;
                return isCurrentCustomer ? {
                  backgroundColor: `${theme.palette.success.main}15`, // Light green background
                  borderLeft: `4px solid ${theme.palette.success.main}`,
                } : {};
              }}
              emptyStateComponent={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}
                >
                  {'No customers scheduled for this date.'}
                </Typography>
              }
            />
          </>
        ) : (
          <Typography
            fontSize="14px"
            color="text.secondary"
            sx={{ fontStyle: 'italic', fontSize: '14px' }}
          >
            No date selected. Please go back to the calendar and select a date.
          </Typography>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          Jump Customer
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Are you sure you want to jump to{' '}
            <strong>{selectedCustomer?.C_Name}</strong> ({selectedCustomer?.C_CoName})?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            This action will update the sales session for this customer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <CustomButton
            onClick={handleCloseDialog}
            buttonType="cancel"
            appearance="outlined"
            fullWidth={false}
            disabled={changeLoading}
            sx={{
              mt: 0,
            }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleConfirmChange}
            buttonType="primary"
            appearance="filled"
            fullWidth={false}
            icon={<CheckCircleIcon sx={{ fontSize: '1.2rem' }} />}
            iconPosition="left"
            loading={changeLoading}
            disabled={changeLoading}
            sx={{
              mt: 0,
            }}
          >
            {changeLoading ? 'Changing...' : 'Yes, Jump Customer'}
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Customer Details Modal */}
      <Dialog
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography>Customer Details</Typography>
          <CustomButton
            appearance="filled"
            buttonType="primary"
            size="small"
            fullWidth={false}
            onClick={() => handleOpenNotesModal(customerDetails)}
            sx={{ mt: 0 }}
          >
            Add Notes
          </CustomButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, px: 2 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Typography sx={{ fontSize: '0.85rem' }}>Loading customer details...</Typography>
            </Box>
          ) : customerDetails ? (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={1}>
                {/* Basic Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 600 }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Account Number</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_Number}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Company Name</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_CoName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Customer Name</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_Name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Email</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_Email || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Contact Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 600 }}>
                    Contact Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Phone</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_Phone || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Mobile</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_PhoneMobile || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Address</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {customerDetails.C_Address}, {customerDetails.C_City}, {customerDetails.C_State} {customerDetails.C_Zip} {customerDetails.C_Country}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Financial Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 600 }}>
                    Financial Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Credit Limit</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>${Number(customerDetails.Credit_Limit).toFixed(2) || '0.00'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Last Balance</Typography>
                      <Typography variant="body2" sx={{
                        color: Number(customerDetails.LastBalance) > 0 ? theme.palette.error.main : theme.palette.success.main,
                        fontSize: '0.8rem'
                      }}>
                        ${Number(customerDetails.LastBalance).toFixed(2) || '0.00'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Terms</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.terms?.Terms || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Days Until Due</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.terms?.DaysUntilDue || '0'} days</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Route Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 600 }}>
                    Route Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Route Number</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.Routes?.[0]?.Route_Number || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Stop Number</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.Routes?.[0]?.Stop_Number || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Additional Information */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 600 }}>
                    Additional Information
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Operation Hours</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {customerDetails.C_OperationHours1}:00 - {customerDetails.C_OperationHours2}:00
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Memo</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{customerDetails.C_Memo || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>

                {/* Sales Notes */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 600 }}>
                    Sales Notes
                  </Typography>
                  {customerDetails?.salesNotes && customerDetails?.salesNotes?.length > 0 ? (
                    <Box sx={{ 
                      border: `1px solid ${theme.palette.divider}`, 
                      borderRadius: 1, 
                      overflow: 'hidden',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {customerDetails.salesNotes.map((note: any,) => (
                        <Box
                          key={note.salesId}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            '&:last-child': { borderBottom: 'none' },
                            '&:hover': { backgroundColor: theme.palette.action.hover },
                            p: 1.5
                          }}
                        >
                          <Grid container spacing={1} alignItems="center">
                            <Grid size={{ xs: 10 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                {note.note}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 2 }}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                <Tooltip title="Edit Note">
                                  <span>
                                    <CustomButton
                                      appearance="outlined"
                                      size="small"
                                      fullWidth={false}
                                      icon={<EditIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => handleEditNote(note)}
                                      sx={{
                                        padding: '4px',
                                        minWidth: '28px',
                                        height: '28px',
                                        mt: 0,
                                        borderRadius: '6px',
                                      }}
                                    >
                                      {''}
                                    </CustomButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Delete Note">
                                  <span>
                                    <CustomButton
                                      appearance="outlined"
                                  
                                      size="small"
                                      fullWidth={false}
                                      icon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => handleDeleteNote(note)}
                                      sx={{
                                        padding: '4px',
                                        minWidth: '28px',
                                        height: '28px',
                                        mt: 0,
                                        borderRadius: '6px',
                                      }}
                                    >
                                      {''}
                                    </CustomButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No sales notes available for this customer.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography color="error" sx={{ fontSize: '0.85rem' }}>Failed to load customer details</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton
            onClick={handleCloseDetailsModal}
            buttonType="primary"
            appearance="filled"
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Close
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog
        open={openOrderDetailsModal}
        onClose={handleCloseOrderDetailsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography>
            Order Details - {selectedCustomerForOrder?.C_Name} ({selectedCustomerForOrder?.C_CoName})
          </Typography>
          <CustomButton
            appearance="filled"
            buttonType="primary"
            size="small"
            fullWidth={false}
            onClick={() => handleOpenNotesModal(selectedCustomerForOrder)}
            sx={{ mt: 0 }}
          >
            Add Notes
          </CustomButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
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
                            onClick={() => navigate(`/sales/order/details/${order.Order_Number}`)}
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton
            onClick={handleCloseOrderDetailsModal}
            buttonType="primary"
            appearance="filled"
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Close
          </CustomButton>
        </DialogActions>
      </Dialog>
      
      {/* Time Picker Modal */}
      <Dialog 
        open={timePickerModalOpen} 
        onClose={handleTimePickerClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedRow && ((typeof selectedRow.time === 'object' && selectedRow.time?.time) || (typeof selectedRow.time === 'string' && selectedRow.time))
            ? 'Edit Call Time'
            : 'Set Call Time'
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Customer: <strong>{selectedRow?.C_Number}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sales Rep: <strong>{selectedRow?.C_Salesman}</strong>
            </Typography>
            
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Select Time"
                value={selectedTime}
                onChange={(newTime) => setSelectedTime(newTime)}
                format="HH:mm"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                    sx: {
                      '& .MuiInputBase-input': {
                        color: selectedTime ? 'white' : 'inherit'
                      }
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton
            appearance="outlined"
            onClick={handleTimePickerClose}
            size="small"
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            appearance="filled"
            onClick={handleTimeUpdate}
            size="small"
            fullWidth={false}
            sx={{ mt: 0 }}
            disabled={!selectedTime || timeUpdateLoading}
          >
            {timeUpdateLoading 
              ? 'Updating...' 
              : (selectedRow && ((typeof selectedRow.time === 'object' && selectedRow.time?.time) || (typeof selectedRow.time === 'string' && selectedRow.time))
                  ? 'Update Time'
                  : 'Create Time'
                )
            }
          </CustomButton>
        </DialogActions>
      </Dialog>
      
      {/* Notes Modal */}
      <Dialog 
        open={notesModalOpen} 
        onClose={handleCloseNotesModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          {isEditingNote ? 'Edit Note' : 'Add Notes'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Customer: <strong>{selectedCustomerForNotes?.C_Number}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Store: <strong>{selectedCustomerForNotes?.C_Name}</strong>
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Note *
              </Typography>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton
            appearance="outlined"
            onClick={handleCloseNotesModal}
            size="small"
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            appearance="filled"
            onClick={handleSubmitNote}
            size="small"
            fullWidth={false}
            sx={{ mt: 0 }}
            disabled={!noteText.trim() || noteLoading}
            loading={noteLoading}
          >
            {noteLoading 
              ? (isEditingNote ? 'Updating...' : 'Adding...') 
              : (isEditingNote ? 'Update Note' : 'Add Note')
            }
          </CustomButton>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
};

export default SalesStatusView;