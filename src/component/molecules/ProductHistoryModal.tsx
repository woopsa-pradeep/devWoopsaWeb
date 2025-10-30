import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  CircularProgress,
  // Alert,
  // Chip,
  // IconButton,
} from '@mui/material';
// import { Refresh as RefreshIcon } from '@mui/icons-material';
import CommonModal from '../atoms/CommonModal';
import img1 from '../../assets/Default-Product-Image.jpg';
import { getOrderHistoryByProductNumber } from '../../redux/apis/retailer/orderApis';
import { getSalesOrderHistoryByProductNumber } from '../../redux/apis/sales/salesOrderApis';

interface HistoryItem {
  orderHeader: {
    Order_Date: string;
  };
  Order_Number: string;
  Invoice_Number?: string;
  status: string;
  Total_Amount: number;
  Quantity_Ordered: number;
  Price: number;
  User_ID?: string;
  Order_Source?: string;
  OTP_Amount_State?: any;
}

interface ProductHistoryModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    image: string;
    price: number;
    itemNumber: string;
    size?: string;
    UnitOunces?: string;
    pack?: string;
    Tax_Rate: number;
    productDetails?: {
      description: string;
    };
  } | null;
  role?: string;
  customerId?: any;
}

const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({
  open,
  onClose,
  product,
  role,
  customerId
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchHistory = useCallback(async () => {
    if (!product?.itemNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response: any;
      if (role === 'sales' && customerId) {
        response = await getSalesOrderHistoryByProductNumber(product.itemNumber, customerId);
      } else {
        response = await getOrderHistoryByProductNumber(product.itemNumber);
      }

      if (response?.success) {
        const historyData = response?.data || [];
        setHistory(historyData);
      } else {
        setError(response?.message || 'Failed to fetch order history');
        setHistory([]);
      }
    } catch (err: any) {
      console.error('Error fetching order history:', err);
      setError(err?.response?.data?.message || 'Failed to fetch order history. Please try again.');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [product?.itemNumber, role, customerId]);

  // Fetch data when modal opens or product changes
  useEffect(() => {
    if (open && product?.itemNumber) {
      fetchHistory();
    }
  }, [open, product?.itemNumber, fetchHistory]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setHistory([]);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  // const handleRefresh = () => {
  //   fetchHistory();
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status?.toLowerCase()) {
  //     case 'completed':
  //     case 'complete':
  //       return { bg: '#C8E6C9', color: '#2E7D32' };
  //     case 'pending':
  //       return { bg: '#FFECB3', color: '#FF9800' };
  //     case 'cancelled':
  //     case 'canceled':
  //       return { bg: '#FFCDD2', color: '#D32F2F' };
  //     case 'processing':
  //       return { bg: '#E3F2FD', color: '#1976D2' };
  //     default:
  //       return { bg: '#F5F5F5', color: '#757575' };
  //   }
  // };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (!product) return null;
console.log(product);
  return (
    <CommonModal open={open} onClose={onClose} size="lg" title='Product History'>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Grid container spacing={2} alignItems="start">
            <Grid>
              <Box
                component="img"
                src={product.image}
                onError={(e) => {
                  e.currentTarget.src = img1;
                }}
                alt={product.name}
                sx={{
                  width: 60,
                  height: 80,
                  objectFit: 'contain',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 0.5
                }}
              />
             
            </Grid>
            
            <Grid>
              <Typography fontWeight={500} fontSize="16px" mb={0.5}>
                {product.name}
              </Typography>
              <Typography fontSize="14px" color="text.secondary" mb={0.5} fontWeight={500} >
                {product.itemNumber}
              </Typography>
              <Typography fontSize="14px" color="text.secondary">
                Current Price: <span style={{ fontWeight: 600 }}>{formatCurrency(product.price + (product.Tax_Rate || 0))}</span>
              </Typography>
            </Grid>
          </Grid>
          
          {/* <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            sx={{ 
              color: 'primary.main',
            }}
          >
            <RefreshIcon />
          </IconButton> */}
        </Box>

        {/* Error Message */}
        {/* {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )} */}

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={40} />
          </Box>
        )}

        {/* No Data Message */}
        {!loading && !error && history.length === 0 && (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            py={4}
            sx={{ color: 'text.secondary' }}
          >
            <Typography variant="h6" gutterBottom>
              No Order History
            </Typography>
            <Typography variant="body2">
              This product has no previous orders.
            </Typography>
          </Box>
        )}

        {/* Table */}
        {!loading && !error && history.length > 0 && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={500} fontSize="16px">
                Order History
              </Typography>
            </Box>
            
            <TableContainer sx={{
              maxHeight: "400px",
              overflow: "auto",
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: 'primary.main', 
                      color: '#fff', 
                      fontSize: "12px", 
                      fontWeight: 600, 
                      padding: "8px 12px",
                      minWidth: 120
                    }}>
                      Order Number
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: 'primary.main', 
                      color: '#fff', 
                      fontSize: "12px", 
                      fontWeight: 600, 
                      padding: "8px 12px",
                      minWidth: 100
                    }}>
                      Order Date
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: 'primary.main', 
                      color: '#fff', 
                      fontSize: "12px", 
                      fontWeight: 600, 
                      padding: "8px 12px",
                      minWidth: 80
                    }}>
                      Qty
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: 'primary.main', 
                      color: '#fff', 
                      fontSize: "12px", 
                      fontWeight: 600, 
                      padding: "8px 12px",
                      minWidth: 80
                    }}>
                      Price
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: 'primary.main', 
                      color: '#fff', 
                      fontSize: "12px", 
                      fontWeight: 600, 
                      padding: "8px 12px",
                      minWidth: 100
                    }}>
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item, index) => {
                    // const statusColors = getStatusColor(item.status);
                    return (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'action.hover' 
                          },
                          '&:nth-of-type(odd)': { 
                            backgroundColor: 'action.hover' 
                          }
                        }}
                      >
                        <TableCell sx={{ 
                          fontSize: "12px", 
                          color: "text.primary", 
                          padding: "8px 12px",
                          fontWeight: 500
                        }}>
                          {item.Order_Number || '-'}
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: "12px", 
                          color: "text.secondary", 
                          padding: "8px 12px"
                        }}>
                          {formatDate(item?.orderHeader?.Order_Date || '-')}
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: "12px", 
                          color: "text.secondary", 
                          padding: "8px 12px",
                        }}>
                          {item.Quantity_Ordered || 0}
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: "12px", 
                          color: "text.secondary", 
                          padding: "8px 12px"
                        }}>
                          {formatCurrency(item.Price + (item.OTP_Amount_State || 0))}
                        </TableCell>
                        <TableCell sx={{ 
                          fontSize: "12px", 
                          color: "text.primary", 
                          padding: "8px 12px",
                        }}>
                          {formatCurrency((item.Price + (item.OTP_Amount_State || 0)) * item.Quantity_Ordered)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </CommonModal>
  );
};

export default ProductHistoryModal;
