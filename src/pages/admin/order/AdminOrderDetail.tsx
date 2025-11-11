import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { KeyboardBackspaceOutlined } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import OrderStatusStepper from "../../../components/OrderStatusStepper";
import PriceDetails from "../../../components/PriceDetails";
import {
  getOrderDeliveryStatus,
  getOrderHistoryByOrderNumber,
} from "../../../redux/apis/distrubutor/orderDistrubutorApis";
import image from "../../../assets/Default-Product-Image.jpg";

const AdminOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderHeader, setOrderHeader] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [orderDeliveryStatus, setOrderDeliveryStatus] = useState<any>({});
  const stepData = Array.isArray(orderDeliveryStatus)
    ? [...orderDeliveryStatus]
    : [];

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
        const response: any = await getOrderHistoryByOrderNumber(orderId, currentPage, pageSize);
        setOrderHistory(response?.data?.data || []);
        setOrderHeader(response?.data?.orderHeader || {});
        setTotalPages(response?.data?.totalPages || 1);
        setTotalItems(response?.data?.totalCount || 0);
      } catch (error) {
        console.error("Error fetching order history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderHistory();
    }
  }, [orderId, currentPage, pageSize]);
  const getOrderDeliveryStatusApi = async () => {
    const response: any = (await getOrderDeliveryStatus(orderId)) as any;
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
      id: "products",
      label: "Products",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={2}>
          <img
            src={
              row.isDistributorImageShow && row.distributorImage
                ? row.distributorImage
                : row.masterImage
            }
            onError={(e) => {
              e.currentTarget.src = image;
            }}
            alt={row.ItemDescription || row.inventory?.Description}
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
          <Box>
            <Typography fontSize={14} fontWeight={500}>
              {row.ItemDescription || row.inventory?.Description}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Pack: {row.Pack} Case: {row.CaseCount} Size: {row.inventory?.UOM}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { id: "Item_Number", label: "Item Number" },
    { id: "Quantity_Ordered", label: "Qty", render: (row) => `${Number(row.Quantity_Ordered).toFixed(0)}` },
    {
      id: "Price",
      label: "Price",
      align: "right",
      render: (row) => `$${Number(row.Price).toFixed(2)}`, // TODO: add tax
    },
    {
      id: "subtotal",
      label: "Subtotal",
      align: "right",
      render: (row) => `$${Number(row.Price * row.Quantity_Ordered).toFixed(2)}`,
    },
    // {
    //   id: "discount",
    //   label: "Discount",
    //   align: "right",
    //   render: (row) => `$${Number(row.OffInvoice_Amount || 0).toFixed(2)}`,
    // },
    {
      id: "totalPrice",
      label: "Total Price",
      align: "right",
      render: (row) =>
        `$${Number(row.Price * row.Quantity_Ordered - (row.OffInvoice_Amount || 0)).toFixed(2)}`,
    },
  ];

  // Calculate totals
  const subtotal = Number(orderHeader?.Total_Price) || 0;
  const discount = Number(orderHeader?.Total_Discount) || 0;
  const crv = Number(orderHeader?.Total_Deposit) || 0;
  const deliveryCharges = Number(orderHeader?.Delivery_Charge) || 0;
  const estimatedTotal = subtotal - discount + deliveryCharges;
  // const subtotal =  orderHeader?.Total_Price || 0;
  //   ? (orderHistory.map((item: any) => item.Price * item.Quantity_Ordered).reduce((acc: any, curr: any) => acc + curr, 0) - (orderHistory.map((item: any) => item.OffInvoice_Amount || 0).reduce((acc: any, curr: any) => acc + curr, 0)))
  //   : 0;
  // const discount = orderHeader?.Total_Discount || 0;
  // const crv = orderHeader?.Total_Deposit || 0;
  // const deliveryCharges = orderHeader?.Delivery_Charge || 0;
  // const estimatedTotal = subtotal - discount + deliveryCharges;
  // const subtotal = orderHistory?.length > 0
  //   ? (orderHistory.map((item: any) => item.Price * item.Quantity_Ordered).reduce((acc: any, curr: any) => acc + curr, 0) - (orderHistory.map((item: any) => item.OffInvoice_Amount || 0).reduce((acc: any, curr: any) => acc + curr, 0)))
  //   : 0;
  // const discount = orderHistory?.length > 0
  //   ? orderHistory.map((item: any) => item.OffInvoice_Amount || 0).reduce((acc: any, curr: any) => acc + curr, 0)
  //   : 0;
  // const crv = orderHistory?.length > 0
  //   ? orderHistory.map((item: any) => item.CRV || 0).reduce((acc: any, curr: any) => acc + curr, 0)
  //   : 0;
  //    const deliveryCharges = orderHistory?.length > 0
  //   ? orderHistory.map((item: any) => item.Delivery_Charges || 0).reduce((acc: any, curr: any) => acc + curr, 0)
  //   : 0;
  // const estimatedTotal = subtotal - discount + deliveryCharges;

  return (
    <Box sx={{ padding: "20px" }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <KeyboardBackspaceOutlined
          onClick={() => navigate("/admin/order")}
          sx={{ cursor: "pointer" }}
        />
        <Typography fontSize={20} fontWeight={500}>
          Order Details
        </Typography>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              mb: 3,
              borderRadius: "10px",
              height: "100%",
              boxShadow: "none",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
              borderBottom="1px solid #E0E0E0"
              p={1.5}
            >
              <Typography fontSize={16} fontWeight={500}>
                Order Number: {orderHeader?.Order_Number || "-"}
              </Typography>
              <Typography
                fontSize={14}
                color="primary.main"
                border={1}
                borderColor="primary.main"
                borderRadius={1}
                px={1}
                py={0.5}
              >
                {totalItems} Items
              </Typography>
            </Box>
            <OrderStatusStepper currentStep={currentStep} dates={dates} />{" "}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {/* Price Details */}
          <PriceDetails
            subtotal={subtotal}
            // discount={discount}
            crv={crv}
            deliveryCharges={deliveryCharges}
            estimatedTotal={estimatedTotal}
          />
        </Grid>

        <Grid size={12}>
          {/* Order Details Table */}
          <CommonTable
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            data={orderHistory}
            columns={columns}
            // containerHeight="calc(100vh - 575px)"
            loading={loading}
            filterComponent={null}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOrderDetail;
