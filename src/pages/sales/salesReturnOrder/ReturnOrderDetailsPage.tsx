import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { KeyboardBackspaceOutlined, PrintOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import OrderStatusStepper from '../../../components/OrderStatusStepper';
import PriceDetails from '../../../components/PriceDetails';
import { getReturnOrderDeliveryStatus, getReturnOrderHistoryByOrderNumber, getReturnOrderPdf } from '../../../redux/apis/sales/salesReturnOrderApis';
import image from '../../../assets/Default-Product-Image.jpg'; 
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import toast from 'react-hot-toast';
import CustomButton from '../../../component/atoms/CustomButton';

const ReturnOrderDetailsPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderHeader, setOrderHeader] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [orderDeliveryStatus, setOrderDeliveryStatus] = useState<any>({});
  const stepData = Array.isArray(orderDeliveryStatus) ? [...orderDeliveryStatus] : [];
  // Separate loading states for each button
  const [pdfLoadingWithPrice, setPdfLoadingWithPrice] = useState(false);
  const [pdfLoadingWithoutPrice, setPdfLoadingWithoutPrice] = useState(false);
  // Sort it safely
  const sortedSteps = stepData.sort((a: any, b: any) => a.no - b.no);
  
  // Find current active step
  const currentStep = sortedSteps?.reduce(
    (acc: any, item: any) => (item.active ? item.no : acc),
    0
  );

  // Format time into readable format (e.g., 'July 16th 2025')
  const dates = stepData?.map((step: any) => step.time);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      setLoading(true);
      try {
        const response: any = await getReturnOrderHistoryByOrderNumber(
          orderId || '', 
          currentPage, 
          pageSize,
          selectedCustomer?.C_Number?.toString() || ''
        );
        setOrderHistory(response?.data?.data || []);
        setOrderHeader(response?.data?.orderHeader || {});
        setTotalPages(response?.data?.totalPages || 1);
        setTotalItems(response?.data?.totalCount || 0);
      } catch (error) {
        console.error('Error fetching return order history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderHistory();
    }
  }, [orderId, currentPage, pageSize]);
  const getOrderDeliveryStatusApi = async () => {
    const response: any = await getReturnOrderDeliveryStatus(orderId, selectedCustomer?.C_Number) as any;
    setOrderDeliveryStatus(response?.data);   
  };
  useEffect(() => {
    if (orderId) {
      getOrderDeliveryStatusApi();
    }
  }, [orderId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const columns: TableColumn<any>[] = [
    { 
      id: 'products', 
      label: 'Products',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={2}>
          <img 
            src={row.isDistributorImageShow && row.distributorImage ? row.distributorImage : row.masterImage} 
            onError={(e) => {
              e.currentTarget.src = image;
            }}
            alt={row.inventory.Description} 
            style={{ width: 40, height: 40, objectFit: 'contain' }} 
          />
          <Box>
            <Typography fontSize={14} fontWeight={400}>{row.inventory.Description}</Typography>
            <Typography fontSize={12} color="text.secondary">
              Pack: {row.Pack} Case: {row.CaseCount} Size: {row.inventory?.UOM}
            </Typography>
          </Box>
        </Box>
      )
    },
    { id: 'Item_Number', label: 'Item Number' },
    { id: 'Quantity_Ordered', label: 'Qty', render: (row) => `${Number(row.Quantity_Ordered).toFixed(0)}` },
    { id: 'Price', label: 'Price', render: (row) => row.showWithOutPrice ? '-' : `$${Number(row.Price).toFixed(2)}`, align: 'right' },  
    { 
      id: 'totalPrice', 
      label: 'Total Price', 
      render: (row) => row.showWithOutPrice ? '-' : `$${Number((row.Price * row.Quantity_Ordered) - (row.OffInvoice_Amount || 0)).toFixed(2)}`, align: 'right'
    },
  ];

  const subtotal = Number(orderHeader?.Total_Price) || 0;
  const discount = Number(orderHeader?.Total_Discount) || 0;
  const crv = Number(orderHeader?.Total_Deposit) || 0;
  const deliveryCharges = Number(orderHeader?.Delivery_Charge) || 0;
  const estimatedTotal = subtotal - discount + deliveryCharges;    

  // Separate handlers for each button to manage their own loading state
  const handlePrintOrderWithPrice = async () => {
    setPdfLoadingWithPrice(true);
    try {
      const response: any = await getReturnOrderPdf(selectedCustomer?.C_Number?.toString() || '', orderId || '', true);
      if (response?.success && response?.data?.pdfUrl) {
        const pdfUrl = response?.data?.pdfUrl;
        try {
          const pdfResponse = await fetch(pdfUrl, {
            method: "GET",
            credentials: "include",
          });
          if (!pdfResponse.ok) throw new Error("Failed to fetch PDF file.");
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = response?.data?.fileName || `return-order-${orderId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("Return Order PDF downloaded successfully.");
        } catch (err) {
          console.log(err, "err");
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
          toast("PDF opened in a new tab (direct download not supported by server).", { icon: "⚠️" });
        }
      } else {
        toast.error("Failed to download return order PDF.");
      }
    } catch (error) {
      console.log(error, "error");
      toast.error("Failed to download return order PDF.");
    } finally {
      setPdfLoadingWithPrice(false);
    }
  };

  const handlePrintOrderWithoutPrice = async () => {
    setPdfLoadingWithoutPrice(true);
    try {
      const response: any = await getReturnOrderPdf(selectedCustomer?.C_Number?.toString() || '', orderId || '', false);
      console.log(response, "response");
      if (response?.success && response?.data?.pdfUrl) {
        const pdfUrl = response?.data?.pdfUrl;
        try {
          const pdfResponse = await fetch(pdfUrl, {
            method: "GET",
            credentials: "include",
          });
          if (!pdfResponse.ok) throw new Error("Failed to fetch PDF file.");
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = response?.data?.fileName || `return-order-${orderId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("Return Order PDF downloaded successfully.");
        } catch (err) {
          console.log(err, "err");
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
          toast("PDF opened in a new tab (direct download not supported by server).", { icon: "⚠️" });
        }
      } else {
        toast.error("Failed to download return order PDF.");
      }
    } catch (error) {
      console.log(error, "error");
      toast.error("Failed to download return order PDF.");
    } finally {
      setPdfLoadingWithoutPrice(false);
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <KeyboardBackspaceOutlined 
          onClick={() => navigate('/sales/return-order/history')}
          sx={{ cursor: 'pointer' }}
        />
        <Typography fontSize={20} fontWeight={500}>Return Order Details</Typography>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid size={{xs:12, md: 8}}>
        <Paper sx={{ mb: 3, borderRadius: "10px", height: "100%", boxShadow: "none" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} borderBottom="1px solid #E0E0E0" p={1.5}>

          <Typography fontSize={16} fontWeight={500}>
            Return Order Number: {orderHeader?.Order_Number || '-'}  
          </Typography>
          <Typography fontSize={14} color="primary.main" border={1} borderColor="primary.main" borderRadius={1} px={1} py={0.5}>
            {totalItems} Items
          </Typography>
       </Box>
       <OrderStatusStepper
  currentStep={currentStep}
  dates={dates}
/>      </Paper>
        </Grid>
        <Grid size={{xs:12, md: 4}}>
          {/* Price Details */}
          <PriceDetails
            subtotal={subtotal}
            crv={crv}
            deliveryCharges={deliveryCharges}
            estimatedTotal={estimatedTotal}
          />
        </Grid>

        <Grid size={12}>

          {/* Order Details Table */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <CustomButton
              fullWidth={false}
              sx={{ mt: 0, mb: 2, minWidth: 140, position: "relative" }}
              icon={<PrintOutlined />}
              size="small"
              onClick={handlePrintOrderWithoutPrice}
              disabled={pdfLoadingWithPrice || pdfLoadingWithoutPrice}
              loading={pdfLoadingWithoutPrice}
              children="Without Price"

            />
              
            <CustomButton
              fullWidth={false}
              sx={{ mt: 0, mb: 2, minWidth: 140, position: "relative" }}
              icon={<PrintOutlined />}
              size="small"
              onClick={handlePrintOrderWithPrice}
              disabled={pdfLoadingWithPrice || pdfLoadingWithoutPrice}
              loading={pdfLoadingWithPrice}
              children="With Price"
            />
            
            </Box>
          <CommonTable
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            data={orderHistory}
            columns={columns}
            loading={loading}
            filterComponent={null}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReturnOrderDetailsPage;

