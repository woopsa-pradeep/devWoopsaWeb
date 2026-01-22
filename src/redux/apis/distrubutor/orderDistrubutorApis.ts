import axiosInstance from "../../../config/axios";

export const getOrderHistory = async (page: number = 1, limit: number = 10, customerId?: string, startDate?: any, endDate?: any, isDeleted?: boolean, updated?: boolean, currentStatus?: string) => {
    let url = `/distrubutor/orderHistory?page=${page}&limit=${limit}`;
    if (customerId) {
        url += `&customerNumber=${customerId}`;
    }
    if (startDate) {
        url += `&startDate=${startDate}`;
    }
    if (endDate) {
        url += `&endDate=${endDate}`;
    }
    if (isDeleted !== undefined) {
        url += `&isDeleted=${isDeleted}`;
    }
    if (updated !== undefined) {
        url += `&updated=${updated}`;
    }
    if (currentStatus) {
        url += `&currentStatus=${currentStatus}`;
    }
    const response = await axiosInstance.get(url);
    return response.data;
}

export const getOrderHistoryByOrderNumber = async (id: any, page: number = 1, limit: number = 10) => {
    const response = await axiosInstance.get(`/distrubutor/orderHistoryByOrderNumber/${id}?page=${page}&limit=${limit}`);
    return response.data;
}   

export const getOrderDeliveryStatus = async (id: any) => {
    const response = await axiosInstance.get(`/distrubutor/orderDeliveryStatus/${id}`);
    return response.data;
}

export const getOrderDetailByOrderNumberForInvoice = async (id: any) => {
    const response = await axiosInstance.get(`/distrubutor/orderDetailByOrderNumberForInvoice/${id}`);
    return response.data;
}

export const getOrderNumbers = async () => {
    const response = await axiosInstance.get('/distrubutor/order-numbers');
    return response.data;
}