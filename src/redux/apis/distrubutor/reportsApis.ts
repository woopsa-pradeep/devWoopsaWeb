import axiosInstance from "../../../config/axios";

export const customerForReport = async () => {
    return axiosInstance.get('/distrubutor/customerForReport');
};

export const getARreportsHistory = async () => {
    return axiosInstance.get('/distrubutor/getARreportsHistory');
};

export const getListOfARreports = async () => {
    return axiosInstance.get('/list/listOfARreports');
};

export const getARreports = async (
    startDate?: string, 
    endDate?: string
) => {
    const params = new URLSearchParams();
    // Always include date parameters, even if empty
    params.append('startDate', startDate || '');
    params.append('endDate', endDate || '');
    
    // Note: API doesn't support pagination - returns all data
    // Filters are applied on frontend, not sent to API
    
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getARreports?${queryString}`;
    
    // Debug: Log the final URL
    console.log('AR Reports API URL:', finalUrl);
    console.log('AR Reports API Params:', params.toString());
    
    return axiosInstance.get(finalUrl);
};

export const listOfARStatementreports = async () => {
    return axiosInstance.get('/list/listOfARStatementreports');
};

export const getArStatementReport = async (
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 50000
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getArStatementReport?${queryString}`;
    
    return axiosInstance.get(finalUrl);
};

export const getVelocityReportCustomer = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getVelocityReportCustomer${queryString ? `?${queryString}` : ''}`;
    
    return axiosInstance.get(finalUrl);
};