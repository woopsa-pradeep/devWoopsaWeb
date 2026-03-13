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

export const cancelOverrideRequest = async (requestId: number, rejectionReason?: string) => {
    const response = await axiosInstance.post(`/distrubutor/cancelOverrideRequest/${requestId}`, {
        rejectionReason: rejectionReason || ''
    });
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

export const removeOngoingOrder = async (orderNumber: number, pickerId?: number) => {
    const url = pickerId 
        ? `/distrubutor/ongoingOrders/${orderNumber}?pickerId=${pickerId}`
        : `/distrubutor/ongoingOrders/${orderNumber}`;
    const response = await axiosInstance.delete(url);
    return response.data;
}

export const getEpickUsers = async () => {
    const response = await axiosInstance.get('/distrubutor/epickUsers');
    return response.data;
}

// PickRight areas for EPICK dropdown (when assignmentType === 'pickright_area')
export interface PickRightAreaOption {
    pickArea: string;
    pickAreaDescription: string;
}

export const getPickRightAreasForEpick = async (): Promise<{ success: boolean; data: PickRightAreaOption[] }> => {
    const response = await axiosInstance.get<{ success: boolean; data: PickRightAreaOption[] }>('/distrubutor/pickRightAreasForEpick');
    return response.data;
}

export type EpickAssignmentType = 'sales_category' | 'pickright_area';

export const createEpickUser = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    userNumber?: string | number;
    assignmentType: EpickAssignmentType;
    category?: number[];
    pickRightAreas?: string[];
    order_type?: string;
    shortby?: string;
    item_sort_by?: string;
    status?: boolean;
    isActive?: boolean;
}) => {
    const response = await axiosInstance.post('/distrubutor/createEpickUser', data);
    return response.data;
}

export const updateEpickUser = async (id: number, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    userNumber?: string;
    assignmentType?: EpickAssignmentType;
    category?: number[];
    pickRightAreas?: string[];
    order_type?: string;
    shortby?: string;
    item_sort_by?: string;
    status?: boolean;
    isActive?: boolean;
    password?: string;
}) => {
    const response = await axiosInstance.put(`/distrubutor/updateEpickUser/${id}`, data);
    return response.data;
}

export const deleteEpickUser = async (id: number) => {
    const response = await axiosInstance.delete(`/distrubutor/deleteEpickUser/${id}`);
    return response.data;
}

export const updateUserOrderPreferences = async (userId: number, data: { order_type?: string; shortby?: string }) => {
    const response = await axiosInstance.put(`/distrubutor/epickUsers/${userId}/preferences`, data);
    return response.data;
}

export const getCheckerUsers = async () => {
    const response = await axiosInstance.get('/distrubutor/checker-users');
     return response.data;
}
// Get pending override requests by order number
export const getPendingOverrideRequestsByOrderNumber = async (orderNumber: number) => {
    const response = await axiosInstance.get(`/distrubutor/pendingOverrideRequests/${orderNumber}`);
    return response.data;
}

// Get complete orders
export const getCompleteOrders = async () => {
    const response = await axiosInstance.get('/epick/getCompleteOrder');
    return response.data;
}

// Get complete order details
export const getCompleteOrderDetails = async (orderNumber: number) => {
    const response = await axiosInstance.get(`/epick/getOrderDetailsByOrderNumber/${orderNumber}`);
    return response.data;
}

// Get epick reports with pagination and optional user filter
export const getEpickReports = async (params?: { userId?: number; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = `/distrubutor/epickReports${queryString ? `?${queryString}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
}

// Get user report with date range for download
export const getUserReportWithDateRange = async (params?: { 
    userId?: number; 
    fromDate?: string; 
    toDate?: string; 
    page?: number; 
    limit?: number 
}) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = `/epick/getUserReportWithDateRange${queryString ? `?${queryString}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
}

// Get order details by order number
export const getOrderDetailsByOrderNumber = async (orderNumber: number) => {
    const response = await axiosInstance.get(`/epick/getOrderDetailsByOrderNumber/${orderNumber}`);
    return response.data;
}

// Approve/Reject all override requests for an order
export const requestAllStatusOverride = async (orderNumber: number, status: 'approved' | 'rejected', pickerId?: number) => {
    const url = pickerId 
        ? `/epick/requestAllStatusOverride/${orderNumber}?status=${status}&pickerId=${pickerId}`
        : `/epick/requestAllStatusOverride/${orderNumber}?status=${status}`;
    const response = await axiosInstance.put(url);
    return response.data;
}