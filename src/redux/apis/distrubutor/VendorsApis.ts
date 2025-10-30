import axiosInstance from "../../../config/axios";

export const getVendorList = async (params: any) => {
    const response = await axiosInstance.get('/distrubutor/vendorList', { params });
    return response.data;
}