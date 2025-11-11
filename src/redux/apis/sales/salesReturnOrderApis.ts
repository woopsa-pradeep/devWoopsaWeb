import axiosInstance from "../../../config/axios";

export const getReturnOrderHistoryByOrderNumber = async (orderNumber: string, page: number, pageSize: number, customerId: string) => {
    const response = await axiosInstance.get(`/sales/returnOrderHistoryByOrderNumber/${orderNumber}?page=${page}&limit=${pageSize}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getReturnOrderHistory = async (customerId: string, page?: number, pageSize?: number, startDate?: string, endDate?: string, search?: string) => {
    const queryParams = new URLSearchParams();
    
    if (page !== undefined) queryParams.append('page', page.toString());
    if (pageSize !== undefined) queryParams.append('pageSize', pageSize.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (search) queryParams.append('search', search);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/sales/returnOrderHistory/${customerId}?${queryString}` : `/sales/returnOrderHistory/${customerId}`;
    const response = await axiosInstance.get(url,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const placeReturnOrder = async (customerId: string, params: any) => {
    const response = await axiosInstance.post(`/sales/placeReturnOrder/${customerId}`, params, {
        headers: {
            'customer': customerId,
            'is-web-order': 'true'
        }
    });
    return response.data;
}
export const getInventoryItems = async (customerId: string, params?: any) => {
    const response = await axiosInstance.post(`/sales/getInventoryItems/${customerId}`, params, {
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getInventoryItemsBySalesRep = async (customerId: string, params?: any) => {
    const response = await axiosInstance.post(`/sales/getInventoryItemsBySalesMan/${customerId}`, params, {
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getReturnCartItem = async (customerId: string) => {
    const response = await axiosInstance.get(`/sales/getReturnCartItems/${customerId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}

export const getSalesWarehouseProfile = async () => {
    const response = await axiosInstance.get('/sales/warehouseProfile');
    return response.data;
}
export const removeFromReturnCart = async (cartItemId: string, customerId: string) => {
    const response = await axiosInstance.delete(`/sales/returnCartItem/${cartItemId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const clearReturnCart = async (customerId: string) => {
    const response = await axiosInstance.delete(`/sales/clearReturnCart/${customerId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const updateReturnCartItem = async (cartItemId: string, params: any, customerId: string) => {
    const response = await axiosInstance.put(`/sales/returnCartItem/${cartItemId}`, params,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const addToReturnCart = async (customerId: string, params: any) => {
    const response = await axiosInstance.post(`/sales/addToReturnCart/${customerId}`, params,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}       

export const getSalesReturnOrderHistoryByProductNumber = async (productNumber: string, customerId: string) => {
    const response = await axiosInstance.get(`/sales/returnOrderHistoryByProductNumber?productNumber=${productNumber}&customerId=${customerId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getReturnOrderDeliveryStatus = async (id: any, customerId: any) => {
    const response = await axiosInstance.get(`/sales/returnOrderDeliveryStatus/${id}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}           

export const getReturnOrderPdf = async (customerId: string, orderId: string, hasPrice: boolean = true) => {
    const response = await axiosInstance.get(`/sales/returnOrderPdf/${customerId}?orderNumber=${orderId}&hasPrice=${hasPrice}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}

export const getDeliveryCharge = async (customerId: string) => {
    const response = await axiosInstance.get(`/sales/deliveryCharge/${customerId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}


export const returnPlaceOrder = async (customerId: string, params: any) => {
    const response = await axiosInstance.post(`/sales/returnPlaceOrder/${customerId}`, params, {
        headers: {
            'customer': customerId,
            'is-web-order': 'true'
        }
    });
    return response.data;
}

