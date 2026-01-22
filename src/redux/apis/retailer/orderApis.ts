import axiosInstance from "../../../config/axios";
import { store } from "../../store";

// Type definition for inventory API parameters
export interface InventoryParams {
  page: number;
  limit: number;
  search?: string;
  masterSearch?: string;
  salesCategoryId?: string[];
  priceClassId?: string[];
  state?: string;
  zip?: string;
  jurisdiction?: string;
}

export const getInventoryItems = async (params: InventoryParams) => {
    const storeDetail = store.getState().auth.storeDetail;
    const payload = {
        ...params,
        state: storeDetail?.C_State,
        zip: storeDetail?.C_Zip,
        jurisdiction: storeDetail?.Jurisdiction_State
    };
    
    const response = await axiosInstance.post('/retailer/getInventory', payload);
    return response.data;
}

// Cart CRUD Routes
export const addToCart = async (params: any) => {
    const response = await axiosInstance.post('/retailer/cart/add', params);
    return response.data;
}

export const getCartItems = async () => {
    const response = await axiosInstance.get('/retailer/cart/items');
    return response.data;
}

export const getWarehouseProfile = async () => {
    const response = await axiosInstance.get('/retailer/warehouseProfile');
    return response.data;
}

export const updateCartItem = async (id: any, params: any) => {
    const response = await axiosInstance.put(`/retailer/cart/items/${id}`, params);
    return response.data;
}

export const removeFromCart = async (id: any) => {
    const response = await axiosInstance.delete(`/retailer/cart/items/${id}`);
    return response.data;
}

export const clearCart = async () => {
    const response = await axiosInstance.delete('/retailer/cart/clear');
    return response.data;
}

export const getDeliveryCharge = async () => {
    const response = await axiosInstance.get('/retailer/deliveryCharge');
    return response.data;
}

export const placeOrder = async (params: any) => {
    const response = await axiosInstance.post('/retailer/placeOrder', params, {
        headers: {
            'is-web-order': 'true'
        }
    });
    return response.data;
}

export const getOrderHistoryByProductNumber = async (id: any) => {
    const response = await axiosInstance.get(`/retailer/orderHistoryByProductNumber/${id}`);
    return response.data;
}

export const getOrderHistory = async (page: number = 1, limit: number = 10, startDate: string, endDate: string, search: string) => {
    const response = await axiosInstance.get(`/retailer/orderHistory?page=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search}`);
    return response.data;
}

export const getOrderHistoryByOrderNumber = async (
  id: any, 
  page: number = 1, 
  limit: number = 10, 
  startDate: string = '', 
  endDate: string = '', 
  search: string = ''
) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (search) params.append('search', search);
  
  // Debug: Log the final URL and parameters
  const finalUrl = `/retailer/orderHistoryByOrderNumber/${id}?${params.toString()}`;
  
  const response = await axiosInstance.get(finalUrl);
  return response.data;
}

export const getOrderedProducts = async (params: any) => {
    const storeDetail = store.getState().auth.storeDetail;
    const payload = {
        ...(params || {}),
        state: storeDetail?.C_State,
        zip: storeDetail?.C_Zip,
        jurisdiction: storeDetail?.Jurisdiction_State
    };
    
    const response = await axiosInstance.post('/retailer/orderedProducts', payload);
    return response.data;
}

export const getOrderDeliveryStatus = async (id: any) => {
    const response = await axiosInstance.get(`/retailer/orderDeliveryStatus/${id}`);
    return response.data;
}
export const getOrderPdf = async (id: any, hasPrice: boolean = true, invoiceGenerated: boolean = false) => {
    const params = new URLSearchParams();
    params.append('orderNumber', id.toString());
    params.append('hasPrice', hasPrice.toString());
    if (invoiceGenerated) {
        params.append('invoiceGenerated', 'true');
    }
    const response = await axiosInstance.get(`/retailer/orderPdf?${params.toString()}`);
    return response.data;
}

// Recommendation API
const RECOMMENDER_API_BASE_URL = process.env.REACT_APP_RECOMMENDER_API_URL || 'https://apibytogether.woopsa.app';
const RECOMMENDER_API_KEY = process.env.REACT_APP_RECOMMENDER_API_KEY || 'secret-api-key';

export const getRecommendations = async (userId: string | null, cartItemNumbers: string[]) => {
    try {
        const response = await fetch(`${RECOMMENDER_API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': RECOMMENDER_API_KEY
            },
            body: JSON.stringify({
                user_id: userId || null,
                cart: cartItemNumbers
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data; // Array of item numbers
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}
export const getInventoryShowPrepaidTax = async () => {
    const response = await axiosInstance.get('/retailer/getInventoryShowPrepaidTax');
    return response.data;
}

export const getSalesCategoryPriceClassByCustomer = async (customerId: string | number) => {
    const response = await axiosInstance.get(`/retailer/getSalesCategoryPriceClassByCustomer/${customerId}`);
    return response.data;
}

export const getSalesCategoryByCustomer = async (customerId: string | number) => {
    const response = await axiosInstance.get(`/retailer/getSalesCategoryByCustomer/${customerId}`);
    return response.data;
}






 