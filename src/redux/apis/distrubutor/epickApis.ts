import axiosInstance from "../../../config/axios";

export const createEpickSetting = async (data: any) => {
    const response = await axiosInstance.post('/distrubutor/epick-settings', data);
    return response.data;
}

export const getAllEpickSettings = async (data: any) => {
    const response = await axiosInstance.get('/distrubutor/epick-settings', data);
    return response.data;
}

export const getEpickSettingById = async (id: string) => {
    const response = await axiosInstance.get(`/distrubutor/epick-settings/${id}`);
    return response.data;
}

export const updateEpickSetting = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/distrubutor/epick-settings/${id}`, data);
    return response.data;
}

export const deleteEpickSetting = async (id: string) => {
    const response = await axiosInstance.delete(`/distrubutor/epick-settings/${id}`);
    return response.data;   
}