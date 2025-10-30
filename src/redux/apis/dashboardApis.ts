import axiosInstance from "../../config/axios";

export const getDiscountedItems = async (role: string,c_number: string) => {
    const response = await axiosInstance.get(`/dashboard/discountedItems?role=${role}&customerNumber=${c_number}`);
    return response.data;
};

export const getNewItem = async (role: string,c_number: string) => {
    const response = await axiosInstance.get(`/dashboard/newItem?role=${role}&customerNumber=${c_number}`);
    return response.data;
};

export const getPopularItems = async (role: string,c_number: string) => {
    const response = await axiosInstance.get(`/dashboard/popularItems?role=${role}&c_number=${c_number}`);
    return response.data;
};

export const getDistributorDashboard = async (params: { fromDate?: string; toDate?: string }) => {
    const response = await axiosInstance.post('/dashboard/distributorDashboard', params);
    return response.data;
};

export const getPromotedItems = async (role: string,c_number: string) => {
    const response = await axiosInstance.get(`/dashboard/promotedItems?role=${role}&customerNumber=${c_number}`);
    return response.data;
};


export const getTopProducts =async () => {
    const response = await axiosInstance.get(`/dashboard/topProductForSales`);
    return response.data;
}