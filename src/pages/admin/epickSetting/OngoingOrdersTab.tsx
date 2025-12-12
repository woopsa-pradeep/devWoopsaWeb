import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Chip,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as ViewIcon, Settings as OverrideIcon, ArrowBack as ArrowBackIcon, ThumbUp as ThumbUpIcon, Block as BlockIcon } from '@mui/icons-material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import {
  getOngoingOrders,
  removeOngoingOrder,
  getPendingOverrideRequestsByOrderNumber,
  getCompleteOrders,
  getCompleteOrderDetails,
  approveOverrideRequest,
  cancelOverrideRequest,
  requestAllStatusOverride,
} from '../../../redux/apis/distrubutor/epickApis';
import moment from 'moment';

interface Route {
  Route_Number: number;
  Stop_Number: number;
}

interface OngoingOrder {
  orderNumber: number;
  customerNumber: number;
  customerName: string;
  routes: Route[];
  orderDate: string;
  pickerId: number;
  pickerName: string;
  pickerEmail: string;
  pickerUserNumber: number;
  startedAt: string;
  totalLines: number;
  totalQty: number;
  scannedLines: number;
  scannedQty: number;
  outOfStockItems: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  flagPass?: boolean;
}

interface OverrideRequest {
  requestId: number;
  orderNumber: number;
  itemNumber: number;
  itemDescription: string;
  pickerUserNumber: number;
  userName: string;
  userEmail: string;
  note: string | null;
  status?: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  qty?: string | number;
}

interface CompleteOrder {
  orderNumber: number;
  orderDate: string;
  invoiceNumber: number;
  bundles: number;
  totes: number;
  pickerId: number;
  confirmed: boolean;
  invoiceTotal: number | null;
  customer: {
    customerNumber: number;
    customerName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    route: number;
    stop: number;
  };
  overrideRequests: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    total: number;
  };
  checkerStatus: {
    isReadyForChecker: boolean;
    status: string;
    startedAt: string;
    completedAt: string;
  };
}

interface OrderItem {
  lineNumber: number;
  itemNumber: number;
  itemDescription: string;
  quantityOrdered: number;
  quantityShipped: number;
  pack: number;
  caseCount: number;
  uom: string;
  section: string | null;
  location: string | null;
  price: number;
  netCost: number;
  invoiceCost: number;
  confirmed: boolean;
  upcList: Array<{
    UPC_Number: string;
  }>;
  masterImage: string;
  distributorImage: string | null;
  isDistributorImageShow: boolean;
}

interface CompleteOrderDetails {
  orderInfo: {
    orderNumber: number;
    orderDate: string;
    invoiceNumber: number;
    bundles: number;
    totes: number;
    pickerId: number | null;
    pickerName: string | null;
    confirmed: boolean;
    invoiceTotal: number | null;
    customer: {
      customerNumber: number;
      customerName: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      route: number | null;
      stop: number | null;
    };
    startedAt: string;
    completedAt: string;
  };
  orderItems: OrderItem[];
  overrideRequests: OverrideRequest[];
  summary: {
    totalItemsOrdered: number;
    totalItemsShipped: number;
    totalItems: number;
  };
}

const OngoingOrdersTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Completed
  
  // Pending tab states
  const [ongoingOrders, setOngoingOrders] = useState<OngoingOrder[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [processingOrderNumber, setProcessingOrderNumber] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);
  const [selectedOrderName, setSelectedOrderName] = useState<string>('');
  
  // Override requests view states (for pending tab)
  const [showOverrideRequests, setShowOverrideRequests] = useState(false);
  const [selectedOrderNumberForOverride, setSelectedOrderNumberForOverride] = useState<number | null>(null);
  const [overrideRequests, setOverrideRequests] = useState<OverrideRequest[]>([]);
  const [loadingOverride, setLoadingOverride] = useState(false);
  
  // Approve/Reject modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Approve/Reject All modal states
  const [approveAllModalOpen, setApproveAllModalOpen] = useState(false);
  const [rejectAllModalOpen, setRejectAllModalOpen] = useState(false);
  const [processingAllRequests, setProcessingAllRequests] = useState(false);
  
  // Completed tab states
  const [completeOrders, setCompleteOrders] = useState<CompleteOrder[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  
  // View details modal states (for completed tab)
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<CompleteOrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch ongoing orders (Pending tab)
  const fetchOngoingOrders = async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoadingPending(true);
    }
    try {
      const response: any = await getOngoingOrders();
      console.log('Ongoing Orders API Response:', response);
      
      let ordersData = [];
      if (response?.data?.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response?.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      }
      
      setOngoingOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch ongoing orders:', error);
      if (showLoading) {
        showErrorToast('Failed to fetch ongoing orders');
      }
    } finally {
      if (showLoading) {
        setLoadingPending(false);
      }
    }
  };

  // Fetch complete orders (Completed tab)
  const fetchCompleteOrders = async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoadingCompleted(true);
    }
    try {
      const response: any = await getCompleteOrders();
      console.log('Complete Orders API Response:', response);
      
      let ordersData = [];
      if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      }
      
      setCompleteOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch complete orders:', error);
      if (showLoading) {
        showErrorToast('Failed to fetch complete orders');
      }
    } finally {
      if (showLoading) {
        setLoadingCompleted(false);
      }
    }
  };

  // Fetch override requests for pending tab
  const fetchOverrideRequests = async (orderNumber: number, showLoading: boolean = true, setView: boolean = true) => {
    if (showLoading) {
      setLoadingOverride(true);
    }
    if (setView) {
      setSelectedOrderNumberForOverride(orderNumber);
    }
    try {
      const response: any = await getPendingOverrideRequestsByOrderNumber(orderNumber);
      console.log('Override Requests API Response:', response);
      
      let requestsData = [];
      if (response?.data && Array.isArray(response.data)) {
        requestsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data;
      }
      
      setOverrideRequests(requestsData);
      if (setView) {
        setShowOverrideRequests(true);
      }
    } catch (error) {
      console.error('Failed to fetch override requests:', error);
      if (showLoading) {
        showErrorToast('Failed to fetch override requests');
      }
    } finally {
      if (showLoading) {
        setLoadingOverride(false);
      }
    }
  };

  // Handle back button click
  const handleBackToOrders = () => {
    setShowOverrideRequests(false);
    setSelectedOrderNumberForOverride(null);
    setOverrideRequests([]);
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
    if (!selectedRequestId || !selectedOrderNumberForOverride) return;
    
    setProcessingRequestId(selectedRequestId);
    setApproveModalOpen(false);
    try {
      await approveOverrideRequest(selectedRequestId);
      showSuccessToast('Request approved successfully!');
      // Refresh override requests (with loading since it's a user action)
      await fetchOverrideRequests(selectedOrderNumberForOverride, true, false);
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
    if (!selectedRequestId || !selectedOrderNumberForOverride) return;
    
    setProcessingRequestId(selectedRequestId);
    setRejectModalOpen(false);
    try {
      await cancelOverrideRequest(selectedRequestId, rejectionReason);
      showSuccessToast('Request rejected successfully!');
      // Refresh override requests (with loading since it's a user action)
      await fetchOverrideRequests(selectedOrderNumberForOverride, true, false);
      setRejectionReason(''); // Reset rejection reason
    } catch (error) {
      console.error('Failed to reject request:', error);
      showErrorToast('Failed to reject request');
    } finally {
      setProcessingRequestId(null);
      setSelectedRequestId(null);
    }
  };

  // Handle approve all requests
  const handleApproveAll = async () => {
    if (!selectedOrderNumberForOverride) return;
    
    setProcessingAllRequests(true);
    setApproveAllModalOpen(false);
    try {
      await requestAllStatusOverride(selectedOrderNumberForOverride, 'approved');
      showSuccessToast('All requests approved successfully!');
      // Refresh override requests
      await fetchOverrideRequests(selectedOrderNumberForOverride, true, false);
    } catch (error) {
      console.error('Failed to approve all requests:', error);
      showErrorToast('Failed to approve all requests');
    } finally {
      setProcessingAllRequests(false);
    }
  };

  // Handle reject all requests
  const handleRejectAll = async () => {
    if (!selectedOrderNumberForOverride) return;
    
    setProcessingAllRequests(true);
    setRejectAllModalOpen(false);
    try {
      await requestAllStatusOverride(selectedOrderNumberForOverride, 'rejected');
      showSuccessToast('All requests rejected successfully!');
      // Refresh override requests
      await fetchOverrideRequests(selectedOrderNumberForOverride, true, false);
    } catch (error) {
      console.error('Failed to reject all requests:', error);
      showErrorToast('Failed to reject all requests');
    } finally {
      setProcessingAllRequests(false);
    }
  };

  // Fetch order details for completed tab
  const fetchOrderDetails = async (orderNumber: number) => {
    setLoadingDetails(true);
    try {
      const response: any = await getCompleteOrderDetails(orderNumber);
      console.log('Order Details API Response:', response);
      
      if (response?.data) {
        setOrderDetails(response.data);
        setViewModalOpen(true);
      } else {
        showErrorToast('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      showErrorToast('Failed to fetch order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset override requests view when switching tabs
    setShowOverrideRequests(false);
    setSelectedOrderNumberForOverride(null);
    setOverrideRequests([]);
    // Don't call API here - useEffect will handle it
  };

  // Handle delete confirmation modal open
  const handleOpenDeleteModal = (orderNumber: number, customerName: string) => {
    setSelectedOrderNumber(orderNumber);
    setSelectedOrderName(customerName);
    setDeleteModalOpen(true);
  };

  // Handle remove ongoing order
  const handleRemoveOrder = async () => {
    if (!selectedOrderNumber) return;
    
    setProcessingOrderNumber(selectedOrderNumber);
    setDeleteModalOpen(false);
    try {
      await removeOngoingOrder(selectedOrderNumber);
      showSuccessToast('Ongoing order removed successfully!');
      await fetchOngoingOrders(true);
    } catch (error) {
      console.error('Failed to remove ongoing order:', error);
      showErrorToast('Failed to remove ongoing order');
    } finally {
      setProcessingOrderNumber(null);
      setSelectedOrderNumber(null);
      setSelectedOrderName('');
    }
  };

  // Handle override icon click (pending tab)
  const handleOverrideClick = (orderNumber: number) => {
    fetchOverrideRequests(orderNumber, true, true);
  };

  // Handle view icon click (completed tab)
  const handleViewClick = (orderNumber: number) => {
    fetchOrderDetails(orderNumber);
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY') : 'N/A';
  };

  // Format datetime helper
  const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY HH:mm') : 'N/A';
  };

  // Format routes helper
  const formatRoutes = (routes: Route[]): string => {
    if (!routes || routes.length === 0) return 'N/A';
    return routes.map(r => `R${r.Route_Number}-S${r.Stop_Number}`).join(', ');
  };

  // Format currency helper
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  // Order items table columns
  const orderItemsColumns: TableColumn<OrderItem>[] = [
    {
      id: 'lineNumber',
      label: 'Line #',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.lineNumber}
        </Typography>
      ),
    },
    {
      id: 'itemNumber',
      label: 'Item #',
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
      minWidth: 250,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 250, 
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
      id: 'quantityOrdered',
      label: 'Qty Ordered',
      minWidth: 110,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.quantityOrdered}
        </Typography>
      ),
    },
    {
      id: 'quantityShipped',
      label: 'Qty Shipped',
      minWidth: 110,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.quantityShipped}
        </Typography>
      ),
    },
    {
      id: 'pack',
      label: 'Pack',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pack}
        </Typography>
      ),
    },
    {
      id: 'caseCount',
      label: 'Case Count',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.caseCount}
        </Typography>
      ),
    },
    {
      id: 'uom',
      label: 'UOM',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.uom}
        </Typography>
      ),
    },
    {
      id: 'section',
      label: 'Section',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.section || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'location',
      label: 'Location',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.location || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'price',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCurrency(row.price)}
        </Typography>
      ),
    },
    {
      id: 'netCost',
      label: 'Net Cost',
      minWidth: 100,
      align: 'right',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCurrency(row.netCost)}
        </Typography>
      ),
    },
    {
      id: 'invoiceCost',
      label: 'Invoice Cost',
      minWidth: 120,
      align: 'right',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCurrency(row.invoiceCost)}
        </Typography>
      ),
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Chip 
          label={row.confirmed ? 'Yes' : 'No'} 
          size="small"
          color={row.confirmed ? 'success' : 'default'}
        />
      ),
    },
  ];

  // Override requests table columns (for pending tab with actions)
  const overrideRequestsColumns: TableColumn<OverrideRequest>[] = [
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
      id: 'qty',
      label: 'Qty',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const qtyValue = row.qty;
        if (qtyValue === undefined || qtyValue === null) {
          return (
            <Typography fontSize={14} fontWeight={400}>
              N/A
            </Typography>
          );
        }
        const qtyNum = typeof qtyValue === 'string' ? Number(qtyValue) : qtyValue;
        return (
          <Typography fontSize={14} fontWeight={400}>
            {qtyNum === 0 || qtyValue === "0" || qtyValue === 0 ? 'N/A' : String(qtyValue)}
          </Typography>
        );
      },
    },
    {
      id: 'pickerUserNumber',
      label: 'Picker User #',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerUserNumber}
        </Typography>
      ),
    },
    {
      id: 'userName',
      label: 'User Name',
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
          title={row.note || ''}
        >
          {row.note || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDateTime(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 140,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={1}>
          <Tooltip title="Approve">
            <IconButton
              size="medium"
              onClick={() => handleOpenApproveModal(row.requestId)}
              disabled={processingRequestId === row.requestId}
              sx={{ 
                padding: '8px',
                bgcolor: 'success.light',
                color: 'success.contrastText',
                '&:hover': {
                  bgcolor: 'success.main',
                  transform: 'scale(1.1)',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ThumbUpIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton
              size="medium"
              onClick={() => handleOpenRejectModal(row.requestId)}
              disabled={processingRequestId === row.requestId}
              sx={{ 
                padding: '8px',
                bgcolor: 'error.light',
                color: 'error.contrastText',
                '&:hover': {
                  bgcolor: 'error.main',
                  transform: 'scale(1.1)',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <BlockIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Override requests table columns (for completed tab modal - read-only with status)
  const overrideRequestsViewColumns: TableColumn<OverrideRequest>[] = [
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
      id: 'qty',
      label: 'Qty',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const qtyValue = row.qty;
        if (qtyValue === undefined || qtyValue === null) {
          return (
            <Typography fontSize={14} fontWeight={400}>
              N/A
            </Typography>
          );
        }
        const qtyNum = typeof qtyValue === 'string' ? Number(qtyValue) : qtyValue;
        return (
          <Typography fontSize={14} fontWeight={400}>
            {qtyNum === 0 || qtyValue === "0" || qtyValue === 0 ? 'N/A' : String(qtyValue)}
          </Typography>
        );
      },
    },
    {
      id: 'pickerUserNumber',
      label: 'Picker User #',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerUserNumber}
        </Typography>
      ),
    },
    {
      id: 'userName',
      label: 'User Name',
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
          title={row.note || ''}
        >
          {row.note || 'N/A'}
        </Typography>
      ),
    },
   
    {
      id: 'rejectionReason',
      label: 'Rejection Reason',
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
          title={row.rejectionReason || ''}
        >
          {row.rejectionReason || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDateTime(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Chip 
          label={row.status ? row.status.toUpperCase() : 'N/A'} 
          size="small"
          color={
            row.status === 'approved' ? 'success' :
            row.status === 'rejected' ? 'error' :
            row.status === 'pending' ? 'warning' : 'default'
          }
        />
      ),
    },
  ];

  // Pending tab columns
  const pendingColumns: TableColumn<OngoingOrder>[] = [
    {
      id: 'orderNumber',
      label: 'Order#',
      // minWidth: 120,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          {row.flagPass && (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'error.main',
                flexShrink: 0,
              }}
            />
          )}
          <Typography 
            fontSize={14} 
            fontWeight={400}
            sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => handleOverrideClick(row.orderNumber)}
          >
            {row.orderNumber}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'customerName',
      label: 'Customer Name',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.customerName}
        </Typography>
      ),
    },
    {
      id: 'customerNumber',
      label: 'Customer#',
      // minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.customerNumber}
        </Typography>
      ),
    },
    {
      id: 'routes',
      label: 'Routes',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatRoutes(row.routes)}
        </Typography>
      ),
    },
    {
      id: 'pickerName',
      label: 'Picker Name',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerName}
        </Typography>
      ),
    },
    {
      id: 'pickerUserNumber',
      label: 'Picker User #',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerUserNumber}
        </Typography>
      ),
    },
    {
      id: 'outOfStockItems',
      label: 'Out of Stock',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400} color={row.outOfStockItems > 0 ? 'error.main' : 'text.secondary'}>
          {row.outOfStockItems}
        </Typography>
      ),
    },
    {
      id: 'orderDate',
      label: 'Date',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDate(row.orderDate)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="View Override Requests">
            <IconButton
              size="small"
              onClick={() => handleOverrideClick(row.orderNumber)}
              color="primary"
              sx={{ padding: '4px' }}
            >
              <OverrideIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove Order">
            <IconButton
              size="small"
              onClick={() => handleOpenDeleteModal(row.orderNumber, row.customerName)}
              disabled={processingOrderNumber === row.orderNumber}
              color="error"
              sx={{ padding: '4px' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Completed tab columns
  const completedColumns: TableColumn<CompleteOrder>[] = [
    {
      id: 'orderNumber',
      label: 'Order#',
      // minWidth: 120,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          onClick={() => handleViewClick(row.orderNumber)}
        >
          {row.orderNumber}
        </Typography>
      ),
    },
    {
      id: 'customerName',
      label: 'Customer Name',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.customer.customerName}
        </Typography>
      ),
    },
    {
      id: 'customerNumber',
      label: 'Customer#',
      // minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.customer.customerNumber}
        </Typography>
      ),
    },
    {
      id: 'route',
      label: 'Route',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          R{row.customer.route}-S{row.customer.stop}
        </Typography>
      ),
    },
    {
      id: 'pickerId',
      label: 'Picker ID',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerId}
        </Typography>
      ),
    },
    {
      id: 'bundles',
      label: 'Bundles',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.bundles}
        </Typography>
      ),
    },
    {
      id: 'totes',
      label: 'Totes',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.totes}
        </Typography>
      ),
    },
    {
      id: 'overrideRequests',
      label: 'Override Requests',
      minWidth: 150,
      render: (row) => (
        <Box>
          <Chip 
            label={`Total: ${row.overrideRequests.total}`} 
            size="small" 
            sx={{ mr: 0.5, mb: 0.5 }}
          />
          {row.overrideRequests.pending > 0 && (
            <Chip 
              label={`Pending: ${row.overrideRequests.pending}`} 
              size="small" 
              color="warning"
              sx={{ mr: 0.5 }}
            />
          )}
        </Box>
      ),
    },
    {
      id: 'orderDate',
      label: 'Date',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDate(row.orderDate)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleViewClick(row.orderNumber)}
              color="primary"
              sx={{ padding: '4px' }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Polling interval in milliseconds (5 seconds)
  const POLLING_INTERVAL = 5000;

  // Real-time polling for ongoing orders (Pending tab - main view)
  useEffect(() => {
    if (activeTab === 0 && !showOverrideRequests) {
      // Initial fetch with loading
      fetchOngoingOrders(true);
      
      // Set up polling interval (without loading spinner)
      const interval = setInterval(() => {
        fetchOngoingOrders(false);
      }, POLLING_INTERVAL);

      // Cleanup interval on unmount or when conditions change
      return () => clearInterval(interval);
    }
  }, [activeTab, showOverrideRequests]);

  // Real-time polling for override requests (Pending tab - override requests view)
  useEffect(() => {
    if (activeTab === 0 && showOverrideRequests && selectedOrderNumberForOverride) {
      // Set up polling interval (without loading spinner and without setting view)
      const interval = setInterval(() => {
        if (selectedOrderNumberForOverride) {
          fetchOverrideRequests(selectedOrderNumberForOverride, false, false);
        }
      }, POLLING_INTERVAL);

      // Cleanup interval on unmount or when conditions change
      return () => clearInterval(interval);
    }
  }, [activeTab, showOverrideRequests, selectedOrderNumberForOverride]);

  // Real-time polling for complete orders (Completed tab)
  useEffect(() => {
    if (activeTab === 1) {
      // Initial fetch with loading
      fetchCompleteOrders(true);
      
      // Set up polling interval (without loading spinner)
      const interval = setInterval(() => {
        fetchCompleteOrders(false);
      }, POLLING_INTERVAL);

      // Cleanup interval on unmount or when conditions change
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* Pending Tab Content */}
      {activeTab === 0 && !showOverrideRequests && (
        <CommonTable
          data={ongoingOrders}
          columns={pendingColumns}
          currentPage={1}
          totalPages={1}
          totalItems={ongoingOrders.length}
          pageSize={ongoingOrders.length}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          loading={loadingPending}
          isPagination={false}
          stickyLastColumn={true}
          containerHeight="calc(100vh - 350px)"
          emptyStateComponent={
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography color="text.secondary">No ongoing orders found</Typography>
            </Box>
          }
        />
      )}

      {/* Override Requests View (Pending Tab) */}
      {activeTab === 0 && showOverrideRequests && (
        <Box>
          {/* Header with Back Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={handleBackToOrders}
                // sx={{ 
                //   border: '1px solid',
                //   borderColor: 'divider',
                //   '&:hover': {
                //     bgcolor: 'action.hover',
                //   }
                // }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography sx={{ fontWeight: 500, fontSize: 16, color: "text.primary" }}>
                Override Requests - Order #{selectedOrderNumberForOverride}
              </Typography>
            </Box>
            
            {/* Approve All / Reject All Buttons */}
            {overrideRequests.length > 0 && (
              <Box sx={{ display: 'flex',justifyContent: 'flex-end', gap: 1 , width: '100%'}}>
                <CustomButton
                  buttonType="primary"
                  appearance="filled"
                  onClick={() => setApproveAllModalOpen(true)}
                  disabled={processingAllRequests}
                  size="small"
                  fullWidth={false}
                  sx={{ minWidth: 100, mt: 0 }}
                >
                  Approve All
                </CustomButton>
                <CustomButton
                  buttonType="delete"
                  appearance="filled"
                  onClick={() => setRejectAllModalOpen(true)}
                  disabled={processingAllRequests}
                  size="small"
                  fullWidth={false}
                  sx={{ minWidth: 100, mt: 0 }}
                >
                  Reject All
                </CustomButton>
              </Box>
            )}
          </Box>

          {/* Override Requests Table */}
          <CommonTable
            data={overrideRequests}
            columns={overrideRequestsColumns}
            currentPage={1}
            totalPages={1}
            totalItems={overrideRequests.length}
            pageSize={overrideRequests.length}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            loading={loadingOverride}
            isPagination={false}
            stickyLastColumn={true}
            stickyFirstThreeColumns={true}
            containerHeight="calc(100vh - 350px)"
            emptyStateComponent={
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <Typography color="text.secondary">No override requests found</Typography>
              </Box>
            }
          />
        </Box>
      )}

      {/* Completed Tab Content */}
      {activeTab === 1 && (
        <CommonTable
          data={completeOrders}
          columns={completedColumns}
          currentPage={1}
          totalPages={1}
          totalItems={completeOrders.length}
          pageSize={completeOrders.length}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          loading={loadingCompleted}
          isPagination={false}
          stickyLastColumn={true}
          stickyFirstThreeColumns={true}
          containerHeight="calc(100vh - 350px)"
          emptyStateComponent={
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography color="text.secondary">No completed orders found</Typography>
            </Box>
          }
        />
      )}

      {/* Remove Order Confirmation Modal */}
      <CommonModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        size="sm"
        title="Remove Ongoing Order"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to remove this ongoing order? This will make it available again in the order list.
          </Typography>
          {selectedOrderName && (
            <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
              Order: {selectedOrderNumber} - {selectedOrderName}
            </Typography>
          )}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => setDeleteModalOpen(false)}
              disabled={processingOrderNumber !== null}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="delete"
              onClick={handleRemoveOrder}
              loading={processingOrderNumber !== null}
              sx={{ minWidth: 100 }}
            >
              Remove
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

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
          {selectedRequestId && (
            <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
              Request ID: {selectedRequestId}
            </Typography>
          )}
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
        onClose={() => {
          setRejectModalOpen(false);
          setRejectionReason('');
        }}
        size="sm"
        title="Confirm Rejection"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to reject this override request? This action cannot be undone.
          </Typography>
          {selectedRequestId && (
            <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
              Request ID: {selectedRequestId}
            </Typography>
          )}
          <TextField
            fullWidth
            label="Rejection Reason"
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            disabled={processingRequestId !== null}
          />
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReason('');
              }}
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

      {/* Approve All Confirmation Modal */}
      <CommonModal
        open={approveAllModalOpen}
        onClose={() => setApproveAllModalOpen(false)}
        size="sm"
        title="Confirm Approve All"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to approve all override requests for this order? This action will approve all {overrideRequests.length} pending request(s) and cannot be undone.
          </Typography>
          {selectedOrderNumberForOverride && (
            <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
              Order Number: {selectedOrderNumberForOverride}
            </Typography>
          )}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => setApproveAllModalOpen(false)}
              disabled={processingAllRequests}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="primary"
              onClick={handleApproveAll}
              loading={processingAllRequests}
              sx={{ minWidth: 100 }}
            >
              Approve All
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Reject All Confirmation Modal */}
      <CommonModal
        open={rejectAllModalOpen}
        onClose={() => setRejectAllModalOpen(false)}
        size="sm"
        title="Confirm Reject All"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to reject all override requests for this order? This action will reject all {overrideRequests.length} pending request(s) and cannot be undone.
          </Typography>
          {selectedOrderNumberForOverride && (
            <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
              Order Number: {selectedOrderNumberForOverride}
            </Typography>
          )}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => setRejectAllModalOpen(false)}
              disabled={processingAllRequests}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="delete"
              onClick={handleRejectAll}
              loading={processingAllRequests}
              sx={{ minWidth: 100 }}
            >
              Reject All
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* View Order Details Modal (Completed Tab) */}
      <CommonModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setOrderDetails(null);
        }}
        size="xl"
        title="Order Details"
      >
        <Box>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography>Loading order details...</Typography>
            </Box>
          ) : !orderDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography color="text.secondary">No order details found</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ maxHeight: '70vh', overflow: 'auto', pr: 2 }}>
                {/* Order Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography fontSize={16} fontWeight={600} sx={{ mb: 2 }}>
                    Order Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <Typography fontSize={13} color="text.secondary">
                      Order Number: <strong>{orderDetails.orderInfo.orderNumber}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Order Date: <strong>{formatDate(orderDetails.orderInfo.orderDate)}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Invoice Number: <strong>{orderDetails.orderInfo.invoiceNumber || 'N/A'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Invoice Total: <strong>{formatCurrency(orderDetails.orderInfo.invoiceTotal)}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Picker ID: <strong>{orderDetails.orderInfo.pickerId || 'N/A'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Picker Name: <strong>{orderDetails.orderInfo.pickerName || 'N/A'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Bundles: <strong>{orderDetails.orderInfo.bundles}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Totes: <strong>{orderDetails.orderInfo.totes}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Confirmed: <strong>{orderDetails.orderInfo.confirmed ? 'Yes' : 'No'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Started At: <strong>{formatDateTime(orderDetails.orderInfo.startedAt)}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Completed At: <strong>{formatDateTime(orderDetails.orderInfo.completedAt)}</strong>
                    </Typography>
                  </Box>
                  
                  <Typography fontSize={14} fontWeight={600} sx={{ mb: 1, mt: 2 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <Typography fontSize={13} color="text.secondary">
                      Customer Number: <strong>{orderDetails.orderInfo.customer.customerNumber}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Customer Name: <strong>{orderDetails.orderInfo.customer.customerName}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                      Address: <strong>{orderDetails.orderInfo.customer.address}, {orderDetails.orderInfo.customer.city}, {orderDetails.orderInfo.customer.state} {orderDetails.orderInfo.customer.zip}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Route: <strong>
                        {orderDetails.orderInfo.customer.route && orderDetails.orderInfo.customer.stop 
                          ? `R${orderDetails.orderInfo.customer.route}-S${orderDetails.orderInfo.customer.stop}`
                          : 'N/A'}
                      </strong>
                    </Typography>
                  </Box>

                  {/* Summary */}
                  {orderDetails.summary && (
                    <>
                      <Typography fontSize={14} fontWeight={600} sx={{ mb: 1, mt: 2 }}>
                        Summary
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
                        <Typography fontSize={13} color="text.secondary">
                          Total Items Ordered: <strong>{orderDetails.summary.totalItemsOrdered}</strong>
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          Total Items Shipped: <strong>{orderDetails.summary.totalItemsShipped}</strong>
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          Total Items: <strong>{orderDetails.summary.totalItems}</strong>
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Override Requests Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography fontSize={16} fontWeight={600} sx={{ mb: 2 }}>
                    Override Requests ({orderDetails.overrideRequests?.length || 0})
                  </Typography>
                  {orderDetails.overrideRequests && orderDetails.overrideRequests.length > 0 ? (
                    <CommonTable
                      data={orderDetails.overrideRequests}
                      columns={overrideRequestsViewColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={orderDetails.overrideRequests.length}
                      pageSize={orderDetails.overrideRequests.length}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      loading={false}
                      isPagination={false}
                      stickyLastColumn={true}
                      containerHeight="auto"
                      emptyStateComponent={
                        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                          <Typography color="text.secondary">No override requests found</Typography>
                        </Box>
                      }
                    />
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                      <Typography color="text.secondary">No override requests found</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Order Items Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography fontSize={16} fontWeight={600} sx={{ mb: 2 }}>
                    Order Items ({orderDetails.orderItems?.length || 0})
                  </Typography>
                  {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
                    <CommonTable
                      data={orderDetails.orderItems}
                      columns={orderItemsColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={orderDetails.orderItems.length}
                      pageSize={orderDetails.orderItems.length}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      loading={false}
                      isPagination={false}
                      stickyLastColumn={true}
                      containerHeight="auto"
                      emptyStateComponent={
                        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                          <Typography color="text.secondary">No order items found</Typography>
                        </Box>
                      }
                    />
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                      <Typography color="text.secondary">No order items found</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <CustomButton
                  appearance="outlined"
                  buttonType="cancel"
                  onClick={() => {
                    setViewModalOpen(false);
                    setOrderDetails(null);
                  }}
                  fullWidth={false}
                  sx={{ minWidth: 100 }}
                >
                  Close
                </CustomButton>
              </Box>
            </Box>
          )}
        </Box>
      </CommonModal>
    </Box>
  );
};

export default OngoingOrdersTab;
