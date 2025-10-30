
import axiosInstance from "../../../config/axios";

export const getUserList = async () => {
    return axiosInstance.get('/distrubutor/userList');
};

export const createUser = async (params: any) => {
    return axiosInstance.post('/distrubutor/createUser', params);
};

export const updateUser = async (id: any, params: any) => {
    return axiosInstance.put(`/distrubutor/updateUser/${id}`, params);
};

export const createRolePermissions = async (params: any) => {
    return axiosInstance.post('/distrubutor/createRolePermissions', params);
};

export const updateRolePermissions = async (params: any) => {
    return axiosInstance.put(`/distrubutor/updateRolePermissions`, params);
};

export const getUserRolePermissions = async (params: any) => {
    return axiosInstance.get(`/distrubutor/getUserRolePermissions/${params}`);
};

export const setUserLimits = async (params: any) => {
    return axiosInstance.put(`/distrubutor/setUserLimits/${params.id}`, params);
};

