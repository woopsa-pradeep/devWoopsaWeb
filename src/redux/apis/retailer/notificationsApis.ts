import axiosInstance from "../../../config/axios";

export const getNotificationList = async () => {
    const response = await axiosInstance.get('/retailer/notificationList');
    return response.data;
}

export const readAllNotification = async () => {
    const response = await axiosInstance.get('/retailer/readAllNotification');
    return response.data;
}

export const readNotification = async (id: string) => {
    const response = await axiosInstance.get(`/retailer/readNotification/${id}`);
    return response.data;
}

export const deleteNotification = async (id: string) => {
    const response = await axiosInstance.get(`/retailer/deleteNotification/${id}`);
    return response.data;
}

export const deleteAllNotification = async () => {
    const response = await axiosInstance.get('/retailer/deleteAllNotification');
    return response.data;
}

export const putFcmToken = async (fcmToken: string) => {
    const response = await axiosInstance.put('/retailer/fcmToken',  {fcmToken} );
    return response.data;
}