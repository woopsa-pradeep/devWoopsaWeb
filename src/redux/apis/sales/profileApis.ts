import axiosInstance from "../../../config/axios";

export const getProfile = async () => {
    return axiosInstance.get('/sales/profile');
};

export const changePassword = async (data: any) => {
    return axiosInstance.post('/sales/changePassword', data);
};

export const getCustomerList = async () => {
    return axiosInstance.get('/sales/customerList');
};

export const setSalesSession = async (customerId: string) => {
    return axiosInstance.post(`/sales/setSalesSession/${customerId}`);
};

export const getBannerList = async (customerId: string) => {
    return axiosInstance.get('/sales/bannerList', { headers: { "customer" : customerId } });
};