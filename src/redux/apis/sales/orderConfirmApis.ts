import axiosInstance from "../../../config/axios";

// Get order confirmation list
export const getOrderConfirmationList = async (
  page?: number,
  limit?: number,
  startDate?: string,
  endDate?: string,
  search?: string,
  status?: string
) => {
  const queryParams = new URLSearchParams();
  
  if (page !== undefined) queryParams.append('page', page.toString());
  if (limit !== undefined) queryParams.append('limit', limit.toString());
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (search) queryParams.append('search', search);
  if (status && status !== 'all') queryParams.append('status', status);
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `/sales/order-confirmation/list?${queryString}` 
    : `/sales/order-confirmation/list`;
    
  const response = await axiosInstance.get(url);
  return response.data;
};

// Accept order (create order confirmation)
export const acceptOrder = async (orderNumber: number, currentOrderline: number) => {
  const response = await axiosInstance.post(`/sales/order-confirmation`, {
    order_Number: orderNumber,
    current_orderline: currentOrderline
  });
  return response.data;
};

// Get order details
export const getOrderConfirmationDetails = async (orderNumber: number) => {
  const response = await axiosInstance.get(`/sales/order-confirmation/details/${orderNumber}`);
  return response.data;
};

// Update order confirmation
export const updateOrderConfirmation = async (
  orderNumber: number,
  data: {
    status: string;
    current_orderline: number;
    orderDetail: Array<{
      Order_Number: number;
      Line_Number: number;
      Quantity_Ordered: number;
      Quantity_Shipped: number;
    }>;
    Bundles?: number;
  }
) => {
  const response = await axiosInstance.put(`/sales/order-confirmation/${orderNumber}`, data);
  return response.data;
};

// Restart order confirmation
export const restartOrderConfirmation = async (orderNumber: number, currentOrderline: number = 0) => {
  const response = await axiosInstance.post(`/sales/restart-order-confirmation`, {
    order_Number: orderNumber,
    current_orderline: currentOrderline
  });
  return response.data;
};

// Lock order confirmation
export const lockOrderConfirmation = async (orderNumber: number) => {
  const response = await axiosInstance.put(`/sales/lock-order-confirmation/${orderNumber}`);
  return response.data;
};