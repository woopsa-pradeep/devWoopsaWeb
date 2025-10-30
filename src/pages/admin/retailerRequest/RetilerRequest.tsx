import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,

  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import CommonTable from '../../../component/atoms/Table/CommonTable';
import CustomButton from '../../../component/atoms/CustomButton';
import CommonModal from '../../../component/atoms/CommonModal';
import SelectInput from '../../../component/atoms/SelectInput';
import { getAllRetailerRequests, deleteRetailerRequest, updateRetailerRequestStatus } from '../../../redux/apis/distrubutor/retailerApis';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';

// Search and filter schema
const searchFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  business_type: z.string().optional(),
  credit_limit_requested: z.string().optional(),
});

type SearchFilterType = z.infer<typeof searchFilterSchema>;

interface RetailerRequest {
  id: string;
  business_name: string;
  dba_name?: string;
  business_type: string;
  primary_contact: string;
  email?: string;
  phone?: string;
  physical_city: string;
  physical_state: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  credit_limit_requested: boolean;
  createdAt: string;      
  updatedAt: string;
}

const RetilerRequest: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Helper function to format dates safely
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    
    // Try different date parsing approaches
    let date = moment(dateString);
    
    // If moment fails, try parsing as ISO string
    if (!date.isValid()) {
      // console.log(`Moment failed, trying new Date(): ${dateString}`);
      date = moment(new Date(dateString));
    }
    
    // If still invalid, try parsing as timestamp
    if (!date.isValid()) {
      // console.log(`new Date() failed, trying parseInt: ${dateString}`);
      date = moment(parseInt(dateString));
    }
    
    // If still invalid, try parsing as moment with different formats
    if (!date.isValid()) {
      // console.log(`parseInt failed, trying moment with different formats: ${dateString}`);
      date = moment(dateString, ['YYYY-MM-DDTHH:mm:ss.SSSZ', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']);
    }
    
    const result = date.isValid() ? date.format('MMM DD, YYYY') : `Invalid: ${dateString}`;
    // console.log(`Date formatting result: ${result}`);
    
    return result;
  };
  
  // State management
  const [requests, setRequests] = useState<RetailerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<RetailerRequest | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Form for search and filters
  const { register, watch, setValue } = useForm<SearchFilterType>({
    resolver: zodResolver(searchFilterSchema),
  });

  const searchQuery = watch('search');
  const statusFilter = watch('status');
  const businessTypeFilter = watch('business_type');
  const creditLimitFilter = watch('credit_limit_requested');

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch data
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchQuery || undefined,
        status: statusFilter || undefined,
        business_type: businessTypeFilter || undefined,
        credit_limit_requested: creditLimitFilter || undefined,
      };
      
      const response = await getAllRetailerRequests(params);
      
      const requests = (response as any)?.data.retailerRequests || [];
      
      setRequests(requests);
      setTotalItems((response as any)?.data.pagination.total || 0);
    } catch (error) {
      toast.error('Failed to fetch retailer requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery, statusFilter, businessTypeFilter, creditLimitFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handle actions
  const handleAddNew = () => {
    navigate('/admin/retailer-requests/add');
  };

  const handleView = (request: RetailerRequest) => {
    // Dispatch the selected request to Redux store
    dispatch({ type: 'retailerRequest/setSelectedRequest', payload: request });
    navigate(`/admin/retailer-requests/view/${request.id}`);
  };

  const handleDelete = (request: RetailerRequest) => {
    setSelectedRequest(request);
    setDeleteModalOpen(true);
  };

  const handleStatusUpdate = (request: RetailerRequest) => {
    setSelectedRequest(request);
    setStatusModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    
    try {
      await deleteRetailerRequest(selectedRequest.id);
      toast.success('Retailer request deleted successfully');
      setDeleteModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to delete retailer request');
      console.error('Error deleting request:', error);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedRequest) return;
    
    try {
      setStatusUpdateLoading(true);
      await updateRetailerRequestStatus(selectedRequest.id, { status });
      toast.success(`Status updated to ${status} successfully`);
      setStatusModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      id: 'business_name',
      label: 'Business Name',
      minWidth: 200,
      render: (row: RetailerRequest) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {row.business_name}
          </Typography>
          {row.dba_name && (
            <Typography variant="caption" color="text.secondary">
              DBA: {row.dba_name}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'business_type',
      label: 'Business Type',
      minWidth: 120,
      render: (row: RetailerRequest) => (
        <Chip 
          label={row.business_type.replace('_', ' ')} 
          size="small" 
          variant="outlined"
        />
      ),
    },
    {
      id: 'primary_contact',
      label: 'Primary Contact',
      minWidth: 150,
    },
    {
      id: 'contact_info',
      label: 'Contact Info',
      minWidth: 180,
      render: (row: RetailerRequest) => (
        <Box>
          {row.email && (
            <Typography variant="body2" display="block">
              {row.email}
            </Typography>
          )}
          {row.phone && (
            <Typography variant="body2" color="text.secondary">
              {row.phone}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'location',
      label: 'Location',
      minWidth: 120,
      render: (row: RetailerRequest) => (
        <Typography variant="body2">
          {row.physical_city}, {row.physical_state}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (row: RetailerRequest) => {
        const statusColors = {
          PENDING: 'warning',
          APPROVED: 'success',
          REJECTED: 'error',
          UNDER_REVIEW: 'info',
        } as const;
        
        return (
          <Chip 
            label={row.status.replace('_', ' ')} 
            color={statusColors[row.status]}
            size="small"
          />
        );
      },
    },
    
    {
      id: 'created_at',
      label: 'Created',
      minWidth: 120,
      render: (row: RetailerRequest) => (
        <Typography variant="body2">
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'updated_at',
      label: 'Updated',
      minWidth: 120,
      render: (row: RetailerRequest) => (
        <Typography variant="body2">
          {formatDate(row.updatedAt)}
        </Typography>
      ),
    },
 
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      render: (row: RetailerRequest) => (
                <Box display="flex" gap={1}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleView(row)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Update Status">
            <IconButton size="small" onClick={() => handleStatusUpdate(row)}>
              <ApproveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Filter options
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Under Review', value: 'REVIEW' },
  ];

  const businessTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Sole Proprietorship', value: 'SOLE_PROP' },
    { label: 'Partnership', value: 'PARTNERSHIP' },
    { label: 'LLC', value: 'LLC' },
    { label: 'Corporation', value: 'CORP' },
    { label: 'Other', value: 'OTHER' },
  ];


  return (
    <Box sx={{ px: { xs: 1, md: 2 }, py: { xs: 1, md: 1 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} >
              <Typography variant="h5" fontWeight={400} fontSize={{ xs: '0.875rem', md: '1.125rem' }}>
        Retailer Requests
      </Typography>
        <CustomButton
          onClick={handleAddNew}
          icon={<AddIcon />}
          iconPosition="left"
          sx={{mt: 0}}
          fullWidth={false}
        >
          Add New Request
        </CustomButton>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 ,lg:3, xl:3 }}> 
            <TextField
              {...register('search')}
              placeholder="Search business name, contact, email..."
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 ,lg:3, xl:3 }}>
            <SelectInput
              options={statusOptions}
              value={statusFilter || ''}
              onChange={(e) => setValue('status', e.target.value as string)}
                marginBottom="0"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 ,lg:3, xl:3 }}>
            <SelectInput
              options={businessTypeOptions}
              value={businessTypeFilter || ''}
              onChange={(e) => setValue('business_type', e.target.value as string)}
              marginBottom="0"
            />
          </Grid>
         
          <Grid size={{ xs: 12, md: 6 ,lg:3, xl:3 }}>
            <CustomButton
              onClick={() => {
                setValue('search', '');
                setValue('status', '');
                setValue('business_type', '');
                setValue('credit_limit_requested', '');
              }}
              buttonType="cancel"
              sx={{mt:0}}
              fullWidth={false}
            >
              Clear Filters
            </CustomButton>
          </Grid>
        </Grid>
      </Box>

      {/* Table */}
      <CommonTable
        data={requests}
        columns={columns}
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
        showPageSizeSelector={true}
        showTotalItems={true}
        showPageNumbers={true}
        maxPageNumbers={5}
        stickyHeader={true}

        emptyStateComponent={
          <Box textAlign="center" py={4}>
            <Typography variant="body1" fontWeight={500} color="text.secondary" mb={1}>
              No retailer requests found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || statusFilter || businessTypeFilter || creditLimitFilter
                ? 'Try adjusting your search criteria' 
                : 'Get started by adding your first retailer request'
              }
            </Typography>
          </Box>
        }
      />

      {/* Delete Confirmation Modal */}
      <CommonModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Retailer Request"
        size="sm"
      >
        <Box p={2}>
          <Typography mb={2}>
            Are you sure you want to delete the retailer request for{' '}
            <strong>{selectedRequest?.business_name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            This action cannot be undone.
          </Typography>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              onClick={() => setDeleteModalOpen(false)}
              buttonType="cancel"
              fullWidth={false}
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={confirmDelete}
              buttonType="delete"
              fullWidth={false}
            >
              Delete
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Status Update Modal */}
      <CommonModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Request Status"
        size="sm"
        sx={{
          "& .MuiPaper-root": {
            background: "transparent",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            borderRadius: 8,
          },
        }}
      >
        <Box
          p={0.5}
          sx={{
            width: "100%",
            maxWidth: 320,
            minWidth: 0,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={500}
            color="text.primary"
            mb={0.5}
            sx={{ fontSize: "0.98rem", textAlign: "left" }}
          >
            {selectedRequest?.business_name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            mb={0.5}
            sx={{ fontSize: "0.82rem", textAlign: "left", display: "block" }}
          >
            Status:{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 500,
                color:
                  selectedRequest?.status === "APPROVED"
                    ? "success.main"
                    : selectedRequest?.status === "REJECTED"
                    ? "error.main"
                    : selectedRequest?.status === "UNDER_REVIEW"
                    ? "warning.main"
                    : "text.secondary",
                textTransform: "capitalize",
                ml: 0.5,
              }}
            >
              {selectedRequest?.status
                ? selectedRequest.status.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())
                : "N/A"}
            </Box>
          </Typography>
          <Box
            display="flex"
            gap={1}
            mt={1}
            mb={0.5}
            flexWrap="nowrap"
            justifyContent="flex-start"
          >
            <CustomButton
              onClick={() => updateStatus("APPROVED")}
              buttonType="primary"
              fullWidth={false}
              loading={statusUpdateLoading}
              sx={{
                minWidth: 56,
                height: 28,
                fontWeight: 400,
                fontSize: "0.85rem",
                borderRadius: 1,
                px: 1,
                py: 0.1,
                bgcolor: "transparent",
                color: "primary.main",
                border: "1px solid",
                borderColor: "primary.light",
                boxShadow: "none",
                "&:hover": { bgcolor: "rgba(56, 182, 255, 0.08)" },
              }}
            >
              Approve
            </CustomButton>
            <CustomButton
              onClick={() => updateStatus("REJECTED")}
              buttonType="delete"
              fullWidth={false}
              loading={statusUpdateLoading}
              sx={{
                minWidth: 56,
                height: 28,
                fontWeight: 400,
                fontSize: "0.85rem",
                borderRadius: 1,
                px: 1,
                py: 0.1,
                bgcolor: "transparent",
                color: "error.main",
                border: "1px solid",
                borderColor: "error.light",
                boxShadow: "none",
                "&:hover": { bgcolor: "rgba(255, 56, 56, 0.08)" },
              }}
            >
              Reject
            </CustomButton>
            <CustomButton
              onClick={() => updateStatus("UNDER_REVIEW")}
              buttonType="primary"
              fullWidth={false}
              loading={statusUpdateLoading}
              sx={{
                minWidth: 56,
                height: 28,
                fontWeight: 400,
                fontSize: "0.85rem",
                borderRadius: 1,
                px: 1,
                py: 0.1,
                bgcolor: "transparent",
                color: "warning.dark",
                border: "1px solid",
                borderColor: "warning.light",
                boxShadow: "none",
                "&:hover": { bgcolor: "rgba(255, 193, 7, 0.08)" },
              }}
            >
              Review
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default RetilerRequest;