import axiosInstance from "../../../config/axios";

export const customerForReport = async () => {
    return axiosInstance.get('/distrubutor/customerForReport');
};

export const getARreportsHistory = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getARreportsHistory${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
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

export const getARUndepositeFund = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getARUndepositeFund${queryString ? `?${queryString}` : ''}`;
    
    return axiosInstance.get(finalUrl);
};

export const getOpenItemReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getOpenItemReport${queryString ? `?${queryString}` : ''}`;
    
    return axiosInstance.get(finalUrl);
};

export const getAgingReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const finalUrl = `/distrubutor/getAgingReport${queryString ? `?${queryString}` : ''}`;
    
    return axiosInstance.get(finalUrl);
};

// Inventory Spot Check report
export const getInventorySpotCheck = async (params: { [key: string]: any } = {}) => {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    if (v !== undefined && v !== null && v !== '') {
                        queryParams.append(key, String(v));
                    }
                });
            } else {
                queryParams.append(key, String(value));
            }
        }
    });

    const queryString = queryParams.toString();
    const finalUrl = `/distrubutor/getInventorySpotCheck${queryString ? `?${queryString}` : ''}`;

    return axiosInstance.get(finalUrl);
};