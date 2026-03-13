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

// Velocity Report - Sales Rep
export const getVelocityReportSalesRep = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const finalUrl = `/distrubutor/getVelocityReportSalesRep${queryString ? `?${queryString}` : ''}`;

    return axiosInstance.get(finalUrl);
};

// Velocity Report - Customer (Points: Item)
export const getCustomerVelocityReportPointsItem = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const finalUrl = `/distrubutor/getCustomerVelocityReportPointsItem${queryString ? `?${queryString}` : ''}`;

    return axiosInstance.get(finalUrl);
};

// Velocity Report - Customer (Points: Sales Detail) – same structure as Points Item
export const getCustomerVelocityReportPoints = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const finalUrl = `/distrubutor/getCustomerVelocityReportPoints${queryString ? `?${queryString}` : ''}`;

    return axiosInstance.get(finalUrl);
};

// Price Class Group Rebates Report
export const getPriceClassGroupRebatesReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const finalUrl = `/distrubutor/priceClassGroupRebatesReport${queryString ? `?${queryString}` : ''}`;

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

// Current Order Status Report
export const getCurrentOrderStatusReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/currentOrderStatusReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

// Current Order Detail Status (line items for an order)
export const getCurrentOrderDetailStatus = async (orderId: number | string) => {
    return axiosInstance.get(`/distrubutor/currentOrderDetailStatus/${orderId}`);
};

// Invoice Register report
export const getInvoiceRegister = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/invoice-register${queryString ? `?${queryString}` : ''}`;
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

export const getPoReceivingHistoryReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/poReceivingHistoryReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

export const getPoTransferAdjustmentReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/poTransferAdjustmentReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

/** Receiving History CIG/OTP report - grouping/filtering by type is done on frontend */
export const getPoCigOtpReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/poCigOtpReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

// Customer With Profit report
export const getCustomerWithProfit = async (params: { [key: string]: any } = {}) => {
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
    const finalUrl = `/distrubutor/customerWithProfit${queryString ? `?${queryString}` : ''}`;

    return axiosInstance.get(finalUrl);
};

// Customer Last Sale report
export const getCustomerLastSaleReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/customerLastSaleReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

// Customer No Sales report
export const getCustomerNoSalesReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/customerNoSalesReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

// Customer Ranking Sales report
export const getCustomerRankingSales = async (params: {
    startDate?: string;
    endDate?: string;
    Value_Code?: number;
} = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate != null && params.startDate !== '')
        queryParams.append('startDate', params.startDate);
    if (params.endDate != null && params.endDate !== '')
        queryParams.append('endDate', params.endDate);
    if (params.Value_Code !== undefined && params.Value_Code !== null)
        queryParams.append('Value_Code', String(params.Value_Code));
    const queryString = queryParams.toString();
    const finalUrl = `/distrubutor/customerRankingSales${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};

// Daily Sales report
export const getDailySalesReport = async (
    startDate?: string,
    endDate?: string
) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    const finalUrl = `/distrubutor/dailySalesReport${queryString ? `?${queryString}` : ''}`;
    return axiosInstance.get(finalUrl);
};