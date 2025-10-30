import axiosInstance from "../../../config/axios";

export const getCustomerListForSalesCalender = async (params: any) => {
    const response = await axiosInstance.get(`/sales/customerCalenderList`,{
        params,
        headers: {
            'customer': params.customerId
        }
    });
    return response.data;
}

export const getCustomerOrderList = async (params: any) => {
    const response = await axiosInstance.get(`/sales/getCustomerOrderByCalenderDate?orderDate=${params.orderDate}&orderDay=${params.orderNumber}`,{});
    return response.data;
}

export const getCustomerOrderDetailInCalender = async (params: any) => {
    const response = await axiosInstance.get(`/sales/getCustomerOrderOfCurrentWeek/${params.customerId}?orderDate=${params.orderDate}`,{});
    return response.data;
}

export const getCustomerById = async (customerId: any) => {
    const response = await axiosInstance.get(`/sales/customerByIdInfoInCalender/${customerId}`);
    return response.data;
}

export const getCustomerDetails = async (customerNumber: number) => {
    const response = await axiosInstance.get(`/sales/customerDetails/${customerNumber}`);
    return response.data;
}

export const salesCallTime = async (params: any) => {
    const response = await axiosInstance.post(`/sales/sales-call-time`,params);
    return response.data;
}

export const salesCallTimeUpdate = async (params: any) => {
    const response = await axiosInstance.put(`/sales/sales-call-time/${params.id}`,params);
    return response.data;
}

export const getTheSalesmanTime = async (params: any) => {
    const response = await axiosInstance.get(`/sales/getTheSalesmanTime`,{params});
    return response.data;
}

export const addNote = async (params: any) => {
    const response = await axiosInstance.post(`/sales/sales-notes`,params);
    return response.data;
}

export const updateNote = async (params: any) => {
    const response = await axiosInstance.put(`/sales/sales-notes/${params.id}`,params);
    return response.data;
}

export const deleteNote = async (params: any) => {
    const response = await axiosInstance.delete(`/sales/sales-notes/${params.id}`);
    return response.data;
}



export const getNotes = async (params: any) => {
    const response = await axiosInstance.get(`/sales/sales-notes`,{params});
    return response.data;
}