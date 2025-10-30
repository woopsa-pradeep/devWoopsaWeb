import axiosInstance from "../../../config/axios";

export const getAccountReceivablesRetailerList = async (params: any) => {
    const response = await axiosInstance.get('/retailer/accountReceivables', { params });
    return response.data;
}