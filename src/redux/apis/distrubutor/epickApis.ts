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

// Pending Override Requests APIs
export const getPendingOverrideRequests = async () => {
    const response = await axiosInstance.get('/distrubutor/pendingOverrideRequests');
    return response.data;
}

export const approveOverrideRequest = async (requestId: number) => {
    const response = await axiosInstance.post(`/distrubutor/approveOverrideRequest/${requestId}`);
    return response.data;
}

export const cancelOverrideRequest = async (requestId: number) => {
    const response = await axiosInstance.post(`/distrubutor/cancelOverrideRequest/${requestId}`);
    return response.data;
}

export const getApprovedOverrideRequests = async () => {
    const response = await axiosInstance.get('/distrubutor/approvedOverrideRequests');
    return response.data;
}

export const getCancelledOverrideRequests = async () => {
    const response = await axiosInstance.get('/distrubutor/cancelledOverrideRequests');
    return response.data;
}

export const getOngoingOrders = async () => {
    const response = await axiosInstance.get('/distrubutor/ongoingOrders');
    return response.data;
}

export const removeOngoingOrder = async (orderNumber: number) => {
    const response = await axiosInstance.delete(`/distrubutor/ongoingOrders/${orderNumber}`);
    return response.data;
}

export const getEpickUsers = async () => {
    const response = await axiosInstance.get('/distrubutor/epickUsers');
    return response.data;
}

export const updateUserOrderPreferences = async (userId: number, data: { order_type?: string; shortby?: string }) => {
    const response = await axiosInstance.put(`/distrubutor/users/${userId}/orderPreferences`, data);
    return response.data;
}