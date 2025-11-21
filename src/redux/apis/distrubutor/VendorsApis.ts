import axiosInstance from "../../../config/axios";

export const getVendorList = async (params: any) => {
    const response = await axiosInstance.get('/distrubutor/vendorList', { params });
    return response.data;
}

export const listOfVendorsCreate = async () => {
    const response = await axiosInstance.get('/list/listOfVendorsCreate');
    return response.data;
}
    
export const createVendor = async (data: any) => {
    const response = await axiosInstance.post('/distrubutor/create-vendor', data);
    return response.data;
}