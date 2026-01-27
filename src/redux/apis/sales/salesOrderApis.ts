import axiosInstance from "../../../config/axios";
import { store } from "../../store";

export const getOrderHistoryByOrderNumber = async (orderNumber: string, page: number, pageSize: number, customerId: string) => {
    const response = await axiosInstance.get(`/sales/orderHistoryByOrderNumber/${orderNumber}?page=${page}&limit=${pageSize}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getOrderHistory = async (customerId: string, page?: number, limit?: number, startDate?: string, endDate?: string, search?: string) => {
    const queryParams = new URLSearchParams();
    
    if (page !== undefined) queryParams.append('page', page.toString());
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (search) queryParams.append('search', search);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/sales/orderHistory/${customerId}?${queryString}` : `/sales/orderHistory/${customerId}`;
    const response = await axiosInstance.get(url,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const placeOrder = async (customerId: string, params: any) => {
    const response = await axiosInstance.post(`/sales/placeOrder/${customerId}`, params, {
        headers: {
            'customer': customerId,
            'is-web-order': 'true'
        }
    });
    return response.data;
}
export const getInventoryItems = async (customerId: string, params?: any) => {
    const storeDetail = store.getState().auth.storeDetail;
    const payload = {
        ...(params || {}),
        state: storeDetail?.C_State,
        zip: storeDetail?.C_Zip,
        jurisdiction: storeDetail?.Jurisdiction_State
    };
    
    const response = await axiosInstance.post(`/sales/getInventoryItems/${customerId}`, payload, {
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getInventoryItemsBySalesRep = async (customerId: string, params?: any) => {
    const storeDetail = store.getState().auth.storeDetail;
    const payload = {
        ...(params || {}),
        state: storeDetail?.C_State,
        zip: storeDetail?.C_Zip,
        jurisdiction: storeDetail?.Jurisdiction_State
    };
    
    const response = await axiosInstance.post(`/sales/getInventoryItemsBySalesMan/${customerId}`, payload, {
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getCartItem = async (customerId: string) => {
    const response = await axiosInstance.get(`/sales/cartItem/${customerId}`,{
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
export const removeFromCart = async (cartItemId: string, customerId: string) => {
    const response = await axiosInstance.delete(`/sales/cartItem/${cartItemId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const clearCart = async (customerId: string) => {
    const response = await axiosInstance.delete(`/sales/clearCart/${customerId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const updateCartItem = async (cartItemId: string, params: any, customerId: string) => {
    const response = await axiosInstance.put(`/sales/cartItem/${cartItemId}`, params,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const addToCart = async (customerId: string, params: any) => {
    const response = await axiosInstance.post(`/sales/addToCart/${customerId}`, params,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}       

export const getSalesOrderHistoryByProductNumber = async (productNumber: string, customerId: string) => {
    const response = await axiosInstance.get(`/sales/orderHistoryByProductNumber?productNumber=${productNumber}&customerId=${customerId}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}
export const getOrderDeliveryStatus = async (id: any, customerId: any) => {
    const response = await axiosInstance.get(`/sales/orderDeliveryStatus/${id}`,{
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}           

export const getOrderPdf = async (customerId: string, orderId: string, hasPrice: boolean = true, invoiceGenerated: boolean = false) => {
    const params = new URLSearchParams();
    params.append('orderNumber', orderId);
    params.append('hasPrice', hasPrice.toString());
    if (invoiceGenerated) {
        params.append('invoiceGenerated', 'true');
    }
    const response = await axiosInstance.get(`/sales/orderPdf/${customerId}?${params.toString()}`,{
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

export const getInventoryShowPrepaidTax = async () => {
    const response = await axiosInstance.get('/sales/getInventoryShowPrepaidTax');
    return response.data;
}

export const getSalesCategoryPriceClassByCustomer = async (customerId: string | number) => {
    const response = await axiosInstance.get(`/sales/getSalesCategoryPriceClassByCustomer/${customerId}`, {
        headers: {
            'customer': customerId.toString()
        }
    });
    return response.data;
}

export const getSalesCategoryByCustomer = async (customerId: string | number) => {
    const response = await axiosInstance.get(`/sales/getSalesCategoryByCustomer/${customerId}`, {
        headers: {
            'customer': customerId.toString()
        }
    });
    return response.data;
}