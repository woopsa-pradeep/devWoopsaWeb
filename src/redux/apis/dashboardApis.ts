import axiosInstance from "../../config/axios";
import { store } from "../store";

export const getDiscountedItems = async (role: string, c_number: string) => {
    const storeDetail = store.getState().auth.storeDetail;
    const queryParams = new URLSearchParams();
    queryParams.append('role', role);
    queryParams.append('customerNumber', c_number);
    if (storeDetail?.C_State) queryParams.append('state', storeDetail.C_State);
    if (storeDetail?.C_Zip) queryParams.append('zip', storeDetail.C_Zip);
    if (storeDetail?.Jurisdiction_State) queryParams.append('jurisdiction', storeDetail.Jurisdiction_State);
    
    const response = await axiosInstance.get(`/dashboard/discountedItems?${queryParams.toString()}`);
    return response.data;
};

export const getNewItem = async (role: string, c_number: string) => {
    const storeDetail = store.getState().auth.storeDetail;
    const queryParams = new URLSearchParams();
    queryParams.append('role', role);
    queryParams.append('customerNumber', c_number);
    if (storeDetail?.C_State) queryParams.append('state', storeDetail.C_State);
    if (storeDetail?.C_Zip) queryParams.append('zip', storeDetail.C_Zip);
    if (storeDetail?.Jurisdiction_State) queryParams.append('jurisdiction', storeDetail.Jurisdiction_State);
    
    const response = await axiosInstance.get(`/dashboard/newItem?${queryParams.toString()}`);
    return response.data;
};

export const getPopularItems = async (role: string, c_number: string) => {
    const storeDetail = store.getState().auth.storeDetail;
    const queryParams = new URLSearchParams();
    queryParams.append('role', role);
    queryParams.append('c_number', c_number);
    if (storeDetail?.C_State) queryParams.append('state', storeDetail.C_State);
    if (storeDetail?.C_Zip) queryParams.append('zip', storeDetail.C_Zip);
    if (storeDetail?.Jurisdiction_State) queryParams.append('jurisdiction', storeDetail.Jurisdiction_State);
    
    const response = await axiosInstance.get(`/dashboard/popularItems?${queryParams.toString()}`);
    return response.data;
};

export const getDistributorDashboard = async (params: { fromDate?: string; toDate?: string }) => {
    const response = await axiosInstance.post('/dashboard/distributorDashboard', params);
    return response.data;
};

export const getPromotedItems = async (role: string, c_number: string) => {
    const storeDetail = store.getState().auth.storeDetail;
    const queryParams = new URLSearchParams();
    queryParams.append('role', role);
    queryParams.append('customerNumber', c_number);
    if (storeDetail?.C_State) queryParams.append('state', storeDetail.C_State);
    if (storeDetail?.C_Zip) queryParams.append('zip', storeDetail.C_Zip);
    if (storeDetail?.Jurisdiction_State) queryParams.append('jurisdiction', storeDetail.Jurisdiction_State);
    
    const response = await axiosInstance.get(`/dashboard/promotedItems?${queryParams.toString()}`);
    return response.data;
};


export const getTopProducts =async () => {
    const response = await axiosInstance.get(`/dashboard/topProductForSales`);
    return response.data;
}