import axiosInstance from "../../../config/axios";

export const createNotificationScheduler = async (params: any) => {
    return axiosInstance.post('/distrubutor/notificationSchedulers', params);
};

export const getNotificationScheduler = async (params: any) => {
    return axiosInstance.get('/distrubutor/notificationSchedulers', { params });
};

    export const getNotificationSchedulerById = async (id: string) => {
    return axiosInstance.get(`/distrubutor/notificationSchedulers/${id}`);
};

export const updateNotificationScheduler = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/notificationSchedulers/${id}`, params);
};

export const deleteNotificationScheduler = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/notificationSchedulers/${id}`);
};