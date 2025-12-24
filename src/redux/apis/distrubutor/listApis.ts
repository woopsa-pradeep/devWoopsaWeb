import axiosInstance from "../../../config/axios";

export const getSalesCategoryList = async () => {
    return axiosInstance.get('/list/salesCategoryList');
};

export const getPriceClassList = async () => {
    return axiosInstance.get('/list/priceClassList');
};

export const getProductList = async (params: any) => {
    return axiosInstance.get('/list/productList', { params });
};

export const getUserList = async () => {
    return axiosInstance.get('/list/userList');
};

export const getSalesRepList = async () => {
    return axiosInstance.get('/list/salesRepList');
};

export const getCustomerList = async () => {
    return axiosInstance.get('/list/customerList');
};

export const getRegisterCustomerList = async () => {
    return axiosInstance.get('/list/registerCustomerList');
};

export const getCustomerRouteList = async () => {
    return axiosInstance.get('/list/customerRouteList');
};
export const getListOfRoutes = async () => {
    return axiosInstance.get('/list/listOfRoutes');
};

export const getListForInventory = async () => {
    return axiosInstance.get('/list/listForInventory');
};

