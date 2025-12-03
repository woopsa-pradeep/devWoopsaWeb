import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import {
  getOngoingOrders,
  removeOngoingOrder,
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
}

const OngoingOrdersTab: React.FC = () => {
  const [ongoingOrders, setOngoingOrders] = useState<OngoingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrderNumber, setProcessingOrderNumber] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);
  const [selectedOrderName, setSelectedOrderName] = useState<string>('');

  // Fetch ongoing orders
  const fetchOngoingOrders = async () => {
    setLoading(true);
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
      showErrorToast('Failed to fetch ongoing orders');
    } finally {
      setLoading(false);
    }
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
      await fetchOngoingOrders();
    } catch (error) {
      console.error('Failed to remove ongoing order:', error);
      showErrorToast('Failed to remove ongoing order');
    } finally {
      setProcessingOrderNumber(null);
      setSelectedOrderNumber(null);
      setSelectedOrderName('');
    }
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY') : 'N/A';
  };

  // Format routes helper
  const formatRoutes = (routes: Route[]): string => {
    if (!routes || routes.length === 0) return 'N/A';
    return routes.map(r => `R${r.Route_Number}-S${r.Stop_Number}`).join(', ');
  };

  // Table columns
  const columns: TableColumn<OngoingOrder>[] = [
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
      label: 'Customer Number',
      minWidth: 120,
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
      id: 'progress',
      label: 'Progress',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.scannedLines}/{row.totalLines} lines, {row.scannedQty.toFixed(1)}/{row.totalQty.toFixed(1)} qty
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
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center">
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


  // Fetch ongoing orders on mount
  useEffect(() => {
    fetchOngoingOrders();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      <CommonTable
        data={ongoingOrders}
        columns={columns}
        currentPage={1}
        totalPages={1}
        totalItems={ongoingOrders.length}
        pageSize={ongoingOrders.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        loading={loading}
        isPagination={false}
        stickyLastColumn={true}
        containerHeight="calc(100vh - 300px)"
        emptyStateComponent={
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography color="text.secondary">No ongoing orders found</Typography>
          </Box>
        }
      />

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
    </Box>
  );
};

export default OngoingOrdersTab;

