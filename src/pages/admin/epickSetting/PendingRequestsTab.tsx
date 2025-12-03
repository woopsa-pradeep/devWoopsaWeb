import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import {
  getPendingOverrideRequests,
  approveOverrideRequest,
  cancelOverrideRequest,
  getApprovedOverrideRequests,
  getCancelledOverrideRequests,
} from '../../../redux/apis/distrubutor/epickApis';
import moment from 'moment';

interface OverrideRequest {
  requestId: number;
  orderNumber: number;
  itemNumber: number;
  itemDescription: string;
  pickerUserNumber?: number;
  userId?: number;
  userName: string;
  userEmail: string;
  note: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

const PendingRequestsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<OverrideRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<OverrideRequest[]>([]);
  const [cancelledRequests, setCancelledRequests] = useState<OverrideRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  
  // Confirmation modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Fetch pending override requests
  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const response: any = await getPendingOverrideRequests();
      console.log('Pending Requests API Response:', response);
      
      let requestsData = [];
      if (response?.data && Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data;
      }
      
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      showErrorToast('Failed to fetch pending requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch approved override requests
  const fetchApprovedRequests = async () => {
    setLoadingRequests(true);
    try {
      const response: any = await getApprovedOverrideRequests();
      console.log('Approved Requests API Response:', response);
      
      let requestsData = [];
      if (response?.data && Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data;
      }
      
      setApprovedRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch approved requests:', error);
      showErrorToast('Failed to fetch approved requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch cancelled override requests
  const fetchCancelledRequests = async () => {
    setLoadingRequests(true);
    try {
      const response: any = await getCancelledOverrideRequests();
      console.log('Cancelled Requests API Response:', response);
      
      let requestsData = [];
      if (response?.data && Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data;
      }
      
      setCancelledRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch cancelled requests:', error);
      showErrorToast('Failed to fetch cancelled requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      fetchPendingRequests();
    } else if (newValue === 1) {
      fetchApprovedRequests();
    } else if (newValue === 2) {
      fetchCancelledRequests();
    }
  };

  // Open approve confirmation modal
  const handleOpenApproveModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setApproveModalOpen(true);
  };

  // Open reject confirmation modal
  const handleOpenRejectModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setRejectModalOpen(true);
  };

  // Handle approve request (after confirmation)
  const handleApproveRequest = async () => {
    if (!selectedRequestId) return;
    
    setProcessingRequestId(selectedRequestId);
    setApproveModalOpen(false);
    try {
      await approveOverrideRequest(selectedRequestId);
      showSuccessToast('Request approved successfully!');
      await fetchPendingRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      showErrorToast('Failed to approve request');
    } finally {
      setProcessingRequestId(null);
      setSelectedRequestId(null);
    }
  };

  // Handle cancel/reject request (after confirmation)
  const handleCancelRequest = async () => {
    if (!selectedRequestId) return;
    
    setProcessingRequestId(selectedRequestId);
    setRejectModalOpen(false);
    try {
      await cancelOverrideRequest(selectedRequestId);
      showSuccessToast('Request cancelled successfully!');
      await fetchPendingRequests();
    } catch (error) {
      console.error('Failed to cancel request:', error);
      showErrorToast('Failed to cancel request');
    } finally {
      setProcessingRequestId(null);
      setSelectedRequestId(null);
    }
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY') : 'N/A';
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 0) return pendingRequests;
    if (activeTab === 1) return approvedRequests;
    return cancelledRequests;
  };

  const currentData = getCurrentData();

  // Table columns
  const columns: TableColumn<OverrideRequest>[] = [
    {
      id: 'requestId',
      label: 'Request ID',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.requestId}
        </Typography>
      ),
    },
    {
      id: 'orderNumber',
      label: 'Order Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.orderNumber}
        </Typography>
      ),
    },
    {
      id: 'itemNumber',
      label: 'Item Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.itemNumber}
        </Typography>
      ),
    },
    {
      id: 'itemDescription',
      label: 'Item Description',
      minWidth: 200,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
          title={row.itemDescription}
        >
          {row.itemDescription}
        </Typography>
      ),
    },
    {
      id: 'pickerUserNumber',
      label: 'Picker User',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerUserNumber || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'userName',
      label: 'User',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.userName}
        </Typography>
      ),
    },
    {
      id: 'userEmail',
      label: 'Email',
      minWidth: 180,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.userEmail}
        </Typography>
      ),
    },
    {
      id: 'note',
      label: 'Note',
      minWidth: 200,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
          title={row.note}
        >
          {row.note || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
    ...(activeTab === 0 ? [{
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'center' as const,
      render: (row: OverrideRequest) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="Approve">
            <IconButton
              size="small"
              onClick={() => handleOpenApproveModal(row.requestId)}
              disabled={processingRequestId === row.requestId}
              color="success"
              sx={{ padding: '4px' }}
            >
              <ApproveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton
              size="small"
              onClick={() => handleOpenRejectModal(row.requestId)}
              disabled={processingRequestId === row.requestId}
              color="error"
              sx={{ padding: '4px' }}
            >
              <RejectIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }] : []),
  ];

  // Fetch pending requests on mount
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      {/* Horizontal Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 400,
              minHeight: 48,
            },
            '& .Mui-selected': {
              fontWeight: 500,
            },
          }}
        >
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {/* Common Table */}
      <CommonTable
        data={currentData}
        columns={columns}
        currentPage={1}
        totalPages={1}
        totalItems={currentData.length}
        pageSize={currentData.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        loading={loadingRequests}
        isPagination={false}
        stickyLastColumn={activeTab === 0}
        containerHeight="calc(100vh - 350px)"
        emptyStateComponent={
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography color="text.secondary">No requests found</Typography>
          </Box>
        }
      />

      {/* Approve Confirmation Modal */}
      <CommonModal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        size="sm"
        title="Confirm Approval"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to approve this override request? This action cannot be undone.
          </Typography>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => setApproveModalOpen(false)}
              disabled={processingRequestId !== null}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="primary"
              onClick={handleApproveRequest}
              loading={processingRequestId !== null}
              sx={{ minWidth: 100 }}
            >
              Approve
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Reject Confirmation Modal */}
      <CommonModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        size="sm"
        title="Confirm Rejection"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to reject this override request? This action cannot be undone.
          </Typography>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => setRejectModalOpen(false)}
              disabled={processingRequestId !== null}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="delete"
              onClick={handleCancelRequest}
              loading={processingRequestId !== null}
              sx={{ minWidth: 100 }}
            >
              Reject
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default PendingRequestsTab;
