import React, { useEffect, useState, useRef } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as ViewIcon, ThumbUp as ThumbUpIcon, Block as BlockIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
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
  confirmationId: number;
  orderNumber: number;
  categories: number[];
  categoryNames: string[];
  status: string;
  customerNumber: number;
  customerName: string;
  routes: Route[];
  orderDate: string;
  pickerId: number;
  pickerName: string;
  pickerEmail: string;
  pickerUserNumber: number | string;
  startedAt: string;
  totalLines: number;
  totalQty: number;
  scannedLines: number;
  scannedQty: number;
  outOfStockItems: number;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  flagPass?: boolean;
}

interface OverrideRequestItem {
  requestId: number;
  orderNumber: number;
  itemNumber: number;
  itemDescription: string;
  requestType: string;
  qty: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  pickerUserNumber?: number;
  userName?: string;
  userEmail?: string;
}

interface PickerItem {
  itemNumber: number;
  description: string;
  section: string;
  location: number;
  salesCategory: number;
  quantityOrdered: number;
  quantityShipped: number;
  confirmed: boolean;
}

interface PickerData {
  pickerUserId: number;
  pickerUserNumber: number;
  userName: string;
  userEmail: string;
  pickerCategories: number[];
  overrideRequests: OverrideRequestItem[];
  pickerItems: PickerItem[];
}

interface OverrideRequest {
  requestId: number;
  orderNumber: number;
  itemNumber: number;
  itemDescription: string;
  pickerId?: number;
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
  pickerId?: number;
  pickerUserNumber?: number | string;
}

interface PickerInfo {
  pickerId: number;
  pickerName: string;
  pickerEmail?: string;
  pickerUserNumber?: number | string;
  startedAt?: string;
  completedAt?: string;
  totalLines?: number;
  totalQty?: number;
  scannedLines?: number;
  scannedQty?: number;
  orderItems?: OrderItem[];
  overrideRequests?: OverrideRequest[];
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
    allPicker?: PickerInfo[];
    allPickers?: PickerInfo[];
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
  
  // Accordion states for pending tab
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderPickerData, setOrderPickerData] = useState<Record<number, PickerData[]>>({});
  const [loadingOrderData, setLoadingOrderData] = useState<Record<number, boolean>>({});
  const [expandedRequestAccordion, setExpandedRequestAccordion] = useState<string | null>(null);
  const [expandedItemAccordion, setExpandedItemAccordion] = useState<string | null>(null);
  
  // Ref to track current orderPickerData to avoid stale closures
  const orderPickerDataRef = useRef<Record<number, PickerData[]>>({});
  
  // Keep ref in sync with state
  useEffect(() => {
    orderPickerDataRef.current = orderPickerData;
  }, [orderPickerData]);
  
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
  const [selectedPickerIdForAll, setSelectedPickerIdForAll] = useState<number | null>(null);
  
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

  // Fetch override requests for an order
  const fetchOverrideRequests = async (orderNumber: number, isInitialLoad: boolean = false) => {
    // Only show loading state on initial load, not during polling updates
    // Use ref to get current state value to avoid stale closures
    const hasExistingData = orderPickerDataRef.current[orderNumber] && orderPickerDataRef.current[orderNumber].length > 0;
    if (isInitialLoad || !hasExistingData) {
      setLoadingOrderData(prev => ({ ...prev, [orderNumber]: true }));
    }
    try {
      const response: any = await getPendingOverrideRequestsByOrderNumber(orderNumber);
      console.log('Override Requests API Response:', response);
      
      let pickerDataList: PickerData[] = [];
      if (response?.data && Array.isArray(response.data)) {
        // API already returns data in PickerData format
        pickerDataList = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        pickerDataList = response.data.data;
      }
      
      setOrderPickerData(prev => ({ ...prev, [orderNumber]: pickerDataList }));
    } catch (error) {
      console.error('Failed to fetch override requests:', error);
      // Only show error toast on initial load, not during silent polling updates
      if (isInitialLoad || !hasExistingData) {
        showErrorToast('Failed to fetch override requests');
      }
    } finally {
      if (isInitialLoad || !hasExistingData) {
        setLoadingOrderData(prev => ({ ...prev, [orderNumber]: false }));
      }
    }
  };

  // Handle accordion expand/collapse
  const handleAccordionChange = (orderNumber: number, isExpanded: boolean) => {
    if (isExpanded) {
      setExpandedOrder(orderNumber);
      // Fetch data if not already loaded
      if (!orderPickerData[orderNumber]) {
        fetchOverrideRequests(orderNumber, true); // Initial load
      }
    } else {
      setExpandedOrder(null);
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
    if (!selectedRequestId || !expandedOrder) return;
    
    setProcessingRequestId(selectedRequestId);
    setApproveModalOpen(false);
    try {
      await approveOverrideRequest(selectedRequestId);
      showSuccessToast('Request approved successfully!');
      await fetchOverrideRequests(expandedOrder, false); // Refresh existing data
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
    if (!selectedRequestId || !expandedOrder) return;
    
    setProcessingRequestId(selectedRequestId);
    setRejectModalOpen(false);
    try {
      await cancelOverrideRequest(selectedRequestId, rejectionReason);
      showSuccessToast('Request rejected successfully!');
      await fetchOverrideRequests(expandedOrder, false); // Refresh existing data
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject request:', error);
      showErrorToast('Failed to reject request');
    } finally {
      setProcessingRequestId(null);
      setSelectedRequestId(null);
    }
  };

  // Handle approve all requests for a picker
  const handleApproveAll = async () => {
    if (!expandedOrder || !selectedPickerIdForAll) return;
    
    setProcessingAllRequests(true);
    setApproveAllModalOpen(false);
    try {
      await requestAllStatusOverride(expandedOrder, 'approved', selectedPickerIdForAll);
      showSuccessToast('All requests approved successfully!');
      await fetchOverrideRequests(expandedOrder, false); // Refresh existing data
    } catch (error) {
      console.error('Failed to approve all requests:', error);
      showErrorToast('Failed to approve all requests');
    } finally {
      setProcessingAllRequests(false);
      setSelectedPickerIdForAll(null);
    }
  };

  // Handle reject all requests for a picker
  const handleRejectAll = async () => {
    if (!expandedOrder || !selectedPickerIdForAll) return;
    
    setProcessingAllRequests(true);
    setRejectAllModalOpen(false);
    try {
      await requestAllStatusOverride(expandedOrder, 'rejected', selectedPickerIdForAll);
      showSuccessToast('All requests rejected successfully!');
      await fetchOverrideRequests(expandedOrder, false); // Refresh existing data
    } catch (error) {
      console.error('Failed to reject all requests:', error);
      showErrorToast('Failed to reject all requests');
    } finally {
      setProcessingAllRequests(false);
      setSelectedPickerIdForAll(null);
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
    setExpandedOrder(null);
  };

  // State for delete modal
  const [deleteType, setDeleteType] = useState<'all' | 'picker'>('all');
  const [selectedPickerIdForDelete, setSelectedPickerIdForDelete] = useState<number | null>(null);

  // Handle delete confirmation modal open
  const handleOpenDeleteModal = (orderNumber: number, customerName: string) => {
    setSelectedOrderNumber(orderNumber);
    setSelectedOrderName(customerName);
    setDeleteType('all');
    setSelectedPickerIdForDelete(null);
    setDeleteModalOpen(true);
    
    // Fetch picker data if not already loaded (for picker selection dropdown)
    if (!orderPickerData[orderNumber]) {
      fetchOverrideRequests(orderNumber, false);
    }
  };

  // Handle remove ongoing order
  const handleRemoveOrder = async () => {
    if (!selectedOrderNumber) return;
    
    // Validate picker selection if delete type is 'picker'
    if (deleteType === 'picker' && !selectedPickerIdForDelete) {
      showErrorToast('Please select a picker to remove');
      return;
    }
    
    setProcessingOrderNumber(selectedOrderNumber);
    setDeleteModalOpen(false);
    try {
      const pickerIdToDelete = deleteType === 'picker' ? selectedPickerIdForDelete : undefined;
      await removeOngoingOrder(selectedOrderNumber, pickerIdToDelete || undefined);
      showSuccessToast(deleteType === 'picker' 
        ? 'Picker removed from order successfully!' 
        : 'Ongoing order removed successfully!');
      await fetchOngoingOrders(true);
    } catch (error) {
      console.error('Failed to remove ongoing order:', error);
      showErrorToast('Failed to remove ongoing order');
    } finally {
      setProcessingOrderNumber(null);
      setSelectedOrderNumber(null);
      setSelectedOrderName('');
      setDeleteType('all');
      setSelectedPickerIdForDelete(null);
    }
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
    // {
    //   id: 'pickerUserNumber',
    //   label: 'Picker User #',
    //   minWidth: 120,
    //   render: (row) => (
    //     <Typography fontSize={14} fontWeight={400}>
    //       {row.pickerUserNumber}
    //     </Typography>
    //   ),
    // },
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

  // Completed tab columns
  const completedColumns: TableColumn<CompleteOrder>[] = [
    {
      id: 'orderNumber',
      label: 'Order#',
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

  // Real-time polling for ongoing orders (Pending tab)
  useEffect(() => {
    if (activeTab === 0) {
      fetchOngoingOrders(true);
      
      const interval = setInterval(() => {
        fetchOngoingOrders(false);
      }, POLLING_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Real-time polling for expanded order data
  useEffect(() => {
    if (activeTab === 0 && expandedOrder) {
      const interval = setInterval(() => {
        fetchOverrideRequests(expandedOrder, false); // Polling update, not initial load
      }, POLLING_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [activeTab, expandedOrder]);

  // Real-time polling for complete orders (Completed tab)
  useEffect(() => {
    if (activeTab === 1) {
      fetchCompleteOrders(true);
      
      const interval = setInterval(() => {
        fetchCompleteOrders(false);
      }, POLLING_INTERVAL);

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

      {/* Pending Tab Content - Accordion Structure */}
      {activeTab === 0 && (
        <Box sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto', pr: 0.5 }}>
          {loadingPending ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography color="text.secondary" fontSize={12}>Loading orders...</Typography>
            </Box>
          ) : ongoingOrders.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography color="text.secondary" fontSize={12}>No ongoing orders found</Typography>
            </Box>
          ) : (
            ongoingOrders.map((order) => (
              <Accordion
                key={order.orderNumber}
                expanded={expandedOrder === order.orderNumber}
                onChange={(_, isExpanded) => handleAccordionChange(order.orderNumber, isExpanded)}
                sx={{ 
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease',
                  '&.Mui-expanded': {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    borderColor: 'primary.light',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: 18 }} />}
                  sx={{
                    px: 1,
                    py: 0.75,
                    minHeight: 40,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&.Mui-expanded': {
                      minHeight: 40,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: 1 }}>
                    <Tooltip title="Remove Order">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteModal(order.orderNumber, order.customerName);
                        }}
                        disabled={processingOrderNumber === order.orderNumber}
                        color="error"
                        sx={{ 
                          padding: '3px',
                          mr: 0.5,
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    {order.flagPass && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'error.main',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 100 }}>
                      <Typography fontWeight={500} fontSize={12} color="primary.main">
                        Order #{order.orderNumber}
                      </Typography>
                      <Typography fontSize={9} color="text.secondary">
                        {formatDate(order.orderDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 180, flex: 1 }}>
                      <Typography fontWeight={500} fontSize={11}>
                        {order.customerName}
                      </Typography>
                      {order.customerNumber && (
                        <Typography fontSize={9} color="text.secondary">
                          #{order.customerNumber}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ minWidth: 150 }}>
                      {order.categoryNames && order.categoryNames.length > 0 ? (
                        order.categoryNames.map((cat, index) => (
                          <Chip 
                            key={index} 
                            label={cat} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: 9,
                              height: 18,
                              borderColor: 'divider',
                              fontWeight: 400,
                            }}
                          />
                        ))
                      ) : (
                        <Typography fontSize={9} color="text.secondary">N/A</Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-end', minWidth: 90 }}>
                      <Chip 
                        label={order.status ? order.status.replace('_', ' ').toUpperCase() : 'N/A'} 
                        size="small"
                        color={
                          order.status === 'completed' ? 'success' :
                          order.status === 'in_progress' ? 'warning' : 'default'
                        }
                        sx={{ 
                          fontWeight: 500,
                          fontSize: 9,
                          height: 18,
                        }}
                      />
                      {order.pickerName && (
                        <Typography fontSize={9} color="text.secondary">
                          {order.pickerName}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  px: 1, 
                  py: 1, 
                  bgcolor: 'grey.50', 
                  transition: 'all 0.3s ease',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                    '&:hover': {
                      background: 'rgba(0,0,0,0.3)',
                    },
                  },
                }}>
                  {loadingOrderData[order.orderNumber] ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                      <Typography color="text.secondary" fontSize={12}>Loading...</Typography>
                    </Box>
                  ) : !orderPickerData[order.orderNumber] || orderPickerData[order.orderNumber].length === 0 ? (
                    <Box 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography color="text.secondary" fontSize={12}>
                        No override requests available
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {orderPickerData[order.orderNumber].map((picker) => (
                        <Box 
                          key={picker.pickerUserId} 
                          sx={{ 
                            p: 1,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.3s ease',
                          }}
                        >
                        {/* Picker Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75, pb: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box>
                            <Typography fontWeight={500} fontSize={11} color="primary.main">
                              {picker.userName}
                            </Typography>
                            <Typography fontSize={9} color="text.secondary" sx={{ mt: 0.25 }}>
                              User #{picker.pickerUserNumber} • {picker.userEmail}
                            </Typography>
                          </Box>
                          <Chip 
                            label={`${picker.overrideRequests?.length || 0} Request${(picker.overrideRequests?.length || 0) !== 1 ? 's' : ''}`} 
                            size="small" 
                            color="warning"
                            sx={{ 
                              fontWeight: 500,
                              fontSize: 9,
                              height: 20,
                            }}
                          />
                        </Box>

                        {/* Override Requests Accordion */}
                        <Accordion
                          expanded={expandedRequestAccordion === `${order.orderNumber}-${picker.pickerUserId}`}
                          onChange={(_, isExpanded) => {
                            setExpandedRequestAccordion(isExpanded ? `${order.orderNumber}-${picker.pickerUserId}` : null);
                          }}
                          sx={{ 
                            mb: 0.75,
                            boxShadow: 'none',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:before': { display: 'none' },
                            '&.Mui-expanded': {
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }
                          }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: 16 }} />}
                            sx={{
                              px: 0.75,
                              py: 0.5,
                              minHeight: 32,
                              '&.Mui-expanded': {
                                minHeight: 32,
                              },
                              '& .MuiAccordionSummary-content': {
                                margin: '4px 0',
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                              <Typography fontWeight={500} fontSize={11} color="text.primary">
                                Override Requests ({picker.overrideRequests?.length || 0})
                              </Typography>
                              {picker.overrideRequests && picker.overrideRequests.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                  <CustomButton
                                    buttonType="primary"
                                    appearance="filled"
                                    onClick={() => {
                                      setSelectedPickerIdForAll(picker.pickerUserId);
                                      setApproveAllModalOpen(true);
                                    }}
                                    disabled={processingAllRequests}
                                    size="small"
                                    fullWidth={false}
                                    sx={{ minWidth: 70, height: 24, fontSize: 10,mt: 0 }}
                                  >
                                    Approve All
                                  </CustomButton>
                                  <CustomButton
                                    buttonType="delete"
                                    appearance="filled"
                                    onClick={() => {
                                      setSelectedPickerIdForAll(picker.pickerUserId);
                                      setRejectAllModalOpen(true);
                                    }}
                                    disabled={processingAllRequests}
                                    size="small"
                                    fullWidth={false}
                                    sx={{ minWidth: 70, height: 24, fontSize: 10,mt: 0 }}
                                  >
                                    Reject All
                                  </CustomButton>
                                </Box>
                              )}
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0.75, py: 0.5 }}>
                            {!picker.overrideRequests || picker.overrideRequests.length === 0 ? (
                              <Box 
                                sx={{ 
                                  p: 1, 
                                  borderRadius: 1,
                                  bgcolor: 'grey.100',
                                  textAlign: 'center',
                                }}
                              >
                                <Typography color="text.secondary" fontSize={10}>No override requests</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {picker.overrideRequests.map((req) => (
                                  <Box 
                                    key={req.requestId} 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 0.75,
                                      p: 0.75, 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      bgcolor: 'background.paper',
                                      transition: 'all 0.3s ease',
                                      minHeight: 36,
                                      '&:hover': {
                                        borderColor: 'primary.light',
                                        bgcolor: 'action.hover',
                                      }
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 0.75,
                                        flex: 1,
                                        minWidth: 0,
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        '&::-webkit-scrollbar': {
                                          height: '3px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                          background: 'transparent',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                          background: 'rgba(0,0,0,0.2)',
                                          borderRadius: '2px',
                                          '&:hover': {
                                            background: 'rgba(0,0,0,0.3)',
                                          },
                                        },
                                      }}
                                    >
                                      <Typography fontSize={10} fontWeight={500} color="text.primary" sx={{ flexShrink: 0 }}>
                                        #{req.itemNumber}
                                      </Typography>
                                      <Typography fontSize={10} fontWeight={400} sx={{ minWidth: 120, flexShrink: 0 }}>
                                        {req.itemDescription}
                                      </Typography>
                                      <Chip 
                                        label={req.requestType.toUpperCase()} 
                                        size="small" 
                                        color={req.requestType === 'scan' ? 'info' : 'warning'}
                                        sx={{ 
                                          fontWeight: 500,
                                          fontSize: 8,
                                          height: 16,
                                          flexShrink: 0,
                                        }}
                                      />
                                      {req.qty > 0 && (
                                        <Chip 
                                          label={`Qty: ${req.qty}`}
                                          size="small"
                                          variant="outlined"
                                          sx={{ 
                                            fontSize: 8,
                                            height: 16,
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}
                                      {req.note && (
                                        <Typography fontSize={9} color="text.secondary" sx={{ fontStyle: 'italic', flexShrink: 0, minWidth: 100 }}>
                                          Note: {req.note}
                                        </Typography>
                                      )}
                                      <Typography fontSize={9} color="text.secondary" sx={{ flexShrink: 0, minWidth: 120 }}>
                                        {formatDateTime(req.createdAt)}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                      <Tooltip title="Approve">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenApproveModal(req.requestId)}
                                          disabled={processingRequestId === req.requestId}
                                          sx={{ 
                                            bgcolor: 'success.light',
                                            color: 'success.contrastText',
                                            '&:hover': { 
                                              bgcolor: 'success.main',
                                            },
                                            transition: 'all 0.3s ease',
                                            width: 24,
                                            height: 24,
                                            padding: 0,
                                          }}
                                        >
                                          <ThumbUpIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Reject">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenRejectModal(req.requestId)}
                                          disabled={processingRequestId === req.requestId}
                                          sx={{ 
                                            bgcolor: 'error.light',
                                            color: 'error.contrastText',
                                            '&:hover': { 
                                              bgcolor: 'error.main',
                                            },
                                            transition: 'all 0.3s ease',
                                            width: 24,
                                            height: 24,
                                            padding: 0,
                                          }}
                                        >
                                          <BlockIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </AccordionDetails>
                        </Accordion>

                        {/* Picker Items Accordion - Only show if items exist */}
                        {picker.pickerItems && picker.pickerItems.length > 0 && (
                          <Accordion
                            expanded={expandedItemAccordion === `${order.orderNumber}-${picker.pickerUserId}`}
                            onChange={(_, isExpanded) => {
                              setExpandedItemAccordion(isExpanded ? `${order.orderNumber}-${picker.pickerUserId}` : null);
                            }}
                            sx={{ 
                              boxShadow: 'none',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              '&:before': { display: 'none' },
                              '&.Mui-expanded': {
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }
                            }}
                          >
                            <AccordionSummary 
                              expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: 16 }} />}
                              sx={{
                                px: 0.75,
                                py: 0.5,
                                minHeight: 32,
                                '&.Mui-expanded': {
                                  minHeight: 32,
                                },
                                '& .MuiAccordionSummary-content': {
                                  margin: '4px 0',
                                }
                              }}
                            >
                              <Typography fontWeight={500} fontSize={11} color="text.primary">
                                Picker Items ({picker.pickerItems.length})
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0.75, py: 0.5 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {picker.pickerItems.map((item) => (
                                  <Box 
                                    key={item.itemNumber} 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between',
                                      p: 0.75, 
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      bgcolor: 'grey.50',
                                    }}
                                  >
                                    <Box>
                                      <Typography fontSize={10} fontWeight={500}>
                                        #{item.itemNumber} - {item.description}
                                      </Typography>
                                      <Typography fontSize={9} color="text.secondary" sx={{ mt: 0.25 }}>
                                        Section: {item.section} | Location: {item.location} | Ordered: {item.quantityOrdered} | Shipped: {item.quantityShipped}
                                      </Typography>
                                    </Box>
                                    <Chip 
                                      label={item.confirmed ? 'Confirmed' : 'Pending'} 
                                      size="small" 
                                      color={item.confirmed ? 'success' : 'default'}
                                      sx={{ 
                                        fontSize: 9,
                                        height: 18,
                                        fontWeight: 500,
                                      }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Box>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
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
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteType('all');
          setSelectedPickerIdForDelete(null);
        }}
        size="sm"
        title="Remove Ongoing Order"
      >
        <Box>
          {selectedOrderName && (
            <Typography fontSize={14} fontWeight={500} color="text.primary" sx={{ mb: 2 }}>
              Order: {selectedOrderNumber} - {selectedOrderName}
            </Typography>
          )}
          
          <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
            <RadioGroup
              value={deleteType}
              onChange={(e) => {
                setDeleteType(e.target.value as 'all' | 'picker');
                if (e.target.value === 'all') {
                  setSelectedPickerIdForDelete(null);
                }
              }}
            >
              <FormControlLabel 
                value="all" 
                control={<Radio />} 
                label={
                  <Typography fontSize={14}>
                    Remove all pickers (Delete entire order)
                  </Typography>
                }
              />
              <FormControlLabel 
                value="picker" 
                control={<Radio />} 
                label={
                  <Typography fontSize={14}>
                    Remove specific picker
                  </Typography>
                }
              />
            </RadioGroup>
          </FormControl>

          {deleteType === 'picker' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="picker-select-label">Select Picker</InputLabel>
              <Select
                labelId="picker-select-label"
                value={selectedPickerIdForDelete || ''}
                onChange={(e) => setSelectedPickerIdForDelete(e.target.value as number)}
                label="Select Picker"
                disabled={processingOrderNumber !== null}
              >
                {(() => {
                  // Only show pickers from orderPickerData (actual pickers working on the order)
                  const pickersFromData = selectedOrderNumber && orderPickerData[selectedOrderNumber]
                    ? orderPickerData[selectedOrderNumber]
                    : [];
                  
                  // Filter out invalid pickers (must have userId, userName, and valid userNumber)
                  const validPickers = pickersFromData.filter(picker => 
                    picker.pickerUserId && 
                    picker.userName && 
                    picker.pickerUserNumber && 
                    picker.pickerUserNumber > 0
                  );
                  
                  if (validPickers.length > 0) {
                    return validPickers.map((picker) => (
                      <MenuItem key={picker.pickerUserId} value={picker.pickerUserId}>
                        {picker.userName} (User #{picker.pickerUserNumber})
                      </MenuItem>
                    ));
                  } else {
                    return <MenuItem disabled>No pickers available</MenuItem>;
                  }
                })()}
              </Select>
            </FormControl>
          )}

          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            {deleteType === 'picker'
              ? 'Are you sure you want to remove this picker from the ongoing order? This will make the order available for this picker again.'
              : 'Are you sure you want to remove this ongoing order? This will remove ALL pickers and make it available again in the order list.'}
          </Typography>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteType('all');
                setSelectedPickerIdForDelete(null);
              }}
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
              disabled={deleteType === 'picker' && !selectedPickerIdForDelete}
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
        onClose={() => {
          setApproveAllModalOpen(false);
          setSelectedPickerIdForAll(null);
        }}
        size="sm"
        title="Confirm Approve All"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to approve all override requests for this picker? This action cannot be undone.
          </Typography>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setApproveAllModalOpen(false);
                setSelectedPickerIdForAll(null);
              }}
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
        onClose={() => {
          setRejectAllModalOpen(false);
          setSelectedPickerIdForAll(null);
        }}
        size="sm"
        title="Confirm Reject All"
      >
        <Box>
          <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to reject all override requests for this picker? This action cannot be undone.
          </Typography>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setRejectAllModalOpen(false);
                setSelectedPickerIdForAll(null);
              }}
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
        size="xxl"
        title="Order Details"
      >
        <Box sx={{ p: 0 }}>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={2}>
              <Typography>Loading order details...</Typography>
            </Box>
          ) : !orderDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={2}>
              <Typography color="text.secondary">No order details found</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ maxHeight: '80vh', overflow: 'auto' }}>
                {/* Order Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
                    Order Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
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
                    {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker) && (orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.length > 0 ? (
                      <>
                        <Typography fontSize={13} color="text.secondary" sx={{ gridColumn: '1 / -1', mb: 0.5 }}>
                          <strong>Pickers ({(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.length}):</strong>
                        </Typography>
                        {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.map((picker, index) => (
                          <Box key={picker.pickerId || index} sx={{ gridColumn: '1 / -1', pl: 1, mb: 0.5, pb: 0.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                            <Typography fontSize={13} color="text.secondary">
                              Picker {index + 1}: <strong>{picker.pickerName || 'N/A'}</strong>
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                              ID: {picker.pickerId} | User #: {picker.pickerUserNumber || 'N/A'} | Email: {picker.pickerEmail || 'N/A'}
                            </Typography>
                            {picker.startedAt && (
                              <Typography fontSize={12} color="text.secondary">
                                Started: {formatDateTime(picker.startedAt)} | Completed: {picker.completedAt ? formatDateTime(picker.completedAt) : 'N/A'}
                              </Typography>
                            )}
                            {(picker.totalLines !== undefined || picker.scannedLines !== undefined) && (
                              <Typography fontSize={12} color="text.secondary">
                                Lines: {picker.scannedLines || 0}/{picker.totalLines || 0} | Qty: {picker.scannedQty || 0}/{picker.totalQty || 0}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </>
                    ) : (
                      <>
                        <Typography fontSize={13} color="text.secondary">
                          Picker ID: <strong>{orderDetails.orderInfo.pickerId || 'N/A'}</strong>
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          Picker Name: <strong>{orderDetails.orderInfo.pickerName || 'N/A'}</strong>
                        </Typography>
                      </>
                    )}
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
                  
                  <Typography fontSize={15} fontWeight={600} sx={{ mb: 1, mt: 1.5 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
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
                      <Typography fontSize={15} fontWeight={600} sx={{ mb: 1, mt: 1.5 }}>
                        Summary
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1 }}>
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

                <Divider sx={{ my: 1.5 }} />

                {/* Group by Picker if allPickers or allPicker exists */}
                {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker) && (orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.length > 0 ? (
                  <>
                    {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.map((picker, pickerIndex) => {
                      // Use picker's own orderItems and overrideRequests if available, otherwise filter by pickerId
                      const pickerItems = picker.orderItems || orderDetails.orderItems?.filter((item) => 
                        item.pickerId === picker.pickerId
                      ) || [];
                      
                      // Use picker's overrideRequests if it exists and has items, otherwise filter from orderDetails
                      const pickerRequests = (picker.overrideRequests && picker.overrideRequests.length > 0) 
                        ? picker.overrideRequests 
                        : orderDetails.overrideRequests?.filter((req) => {
                            // Match by pickerId - this is the primary matching criteria
                            if (req.pickerId !== undefined && picker.pickerId !== undefined) {
                              return req.pickerId === picker.pickerId;
                            }
                            // Fallback to pickerUserNumber matching if pickerId is not available
                            return req.pickerUserNumber === picker.pickerUserNumber;
                          }) || [];

                      return (
                        <Box key={picker.pickerId || pickerIndex} sx={{ mb: 2 }}>
                          {/* Picker Header Section */}
                          <Box sx={{ 
                            p: 1, 
                            mb: 1.5, 
                            borderLeft: '3px solid',
                            borderColor: 'primary.main'
                          }}>
                            <Typography fontSize={16} fontWeight={600} sx={{ mb: 0.25 }}>
                              Picker {pickerIndex + 1}: {picker.pickerName || 'N/A'}
                            </Typography>
                            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.25 }}>
                              ID: {picker.pickerId} | User #: {picker.pickerUserNumber || 'N/A'} | Email: {picker.pickerEmail || 'N/A'}
                            </Typography>
                            {picker.startedAt && (
                              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.25 }}>
                                Started: {formatDateTime(picker.startedAt)} | Completed: {picker.completedAt ? formatDateTime(picker.completedAt) : 'N/A'}
                              </Typography>
                            )}
                            {(picker.totalLines !== undefined || picker.scannedLines !== undefined) && (
                              <Typography fontSize={12} color="text.secondary">
                                Lines: {picker.scannedLines || 0}/{picker.totalLines || 0} | Qty: {picker.scannedQty || 0}/{picker.totalQty || 0}
                              </Typography>
                            )}
                          </Box>

                          {/* Override Requests for this picker */}
                          <Box sx={{ mb: 2 }}>
                            <Typography fontSize={14} fontWeight={600} sx={{ mb: 1 }}>
                              Override Requests ({pickerRequests.length})
                            </Typography>
                            {pickerRequests.length > 0 ? (
                              <CommonTable
                                data={pickerRequests}
                                columns={overrideRequestsViewColumns}
                                currentPage={1}
                                totalPages={1}
                                totalItems={pickerRequests.length}
                                pageSize={pickerRequests.length}
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
                              <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                                <Typography color="text.secondary">No override requests found for this picker</Typography>
                              </Box>
                            )}
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          {/* Order Items for this picker */}
                          <Box sx={{ mb: 2 }}>
                            <Typography fontSize={14} fontWeight={600} sx={{ mb: 1 }}>
                              Order Items ({pickerItems.length})
                            </Typography>
                            {pickerItems.length > 0 ? (
                              <CommonTable
                                data={pickerItems}
                                columns={orderItemsColumns}
                                currentPage={1}
                                totalPages={1}
                                totalItems={pickerItems.length}
                                pageSize={pickerItems.length}
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
                              <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                                <Typography color="text.secondary">No order items found for this picker</Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Override Requests Table - All */}
                    <Box sx={{ mb: 2 }}>
                      <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
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
                        <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                          <Typography color="text.secondary">No override requests found</Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Order Items Table - All */}
                    <Box sx={{ mb: 2 }}>
                      <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
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
                        <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                          <Typography color="text.secondary">No order items found</Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Box>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 1.5 }}>
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


