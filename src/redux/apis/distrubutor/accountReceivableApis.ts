import axiosInstance from "../../../config/axios";

export const getAccountReceivablesList = async (params: any) => {
    const response = await axiosInstance.get('/distrubutor/accountReceivables', { params });
    return response.data;
}
export const getAccountReceivableSummary = async () => {
    const response = await axiosInstance.get('/distrubutor/summary');
    return response.data;
}   

