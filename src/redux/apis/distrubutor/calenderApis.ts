import axiosInstance from "../../../config/axios";

export const getCustomerListForDistrubutorCalender = async (params: any) => {
    const payload: any = {};
    
    // Add filter parameters as arrays if provided
    if (params.salesRepNumber && params.salesRepNumber.length > 0) {
        payload.salesRepNumber = params.salesRepNumber;
    }
    if (params.routeNumber && params.routeNumber.length > 0) {
        payload.routeNumber = params.routeNumber;
    }
    
    const response = await axiosInstance.post('/distrubutor/customerCalenderList', payload);
    return response.data;
}

export const getCustomerOrderList = async (params: any) => {
    const queryParams = new URLSearchParams();
    
    // Add required parameters
    queryParams.append('orderDate', params.orderDate);
    queryParams.append('orderDay', params.orderDay);
    queryParams.append('page', params.page);
    queryParams.append('limit', params.limit);
    
    const response = await axiosInstance.get(`/distrubutor/getCustomerOrderByCalenderDate?${queryParams.toString()}`);
    return response.data;
}

export const getCustomerOrderDetailInCalender = async (params: any) => {
    const response = await axiosInstance.get(`/distrubutor/customerOrderOfCurrentWeek/${params.customerId}?orderDate=${params.orderDate}`,{});
    return response.data;
}   

export const getCustomerById = async (customerId: any) => {
    const response = await axiosInstance.get(`/distrubutor/customerByIdInfoInCalender/${customerId}`);
    return response.data;
}