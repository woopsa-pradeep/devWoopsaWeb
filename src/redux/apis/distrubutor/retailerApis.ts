import axiosInstance from "../../../config/axios";

export const customerList = async (params: any  ) => {
    const response = await axiosInstance.get("/distrubutor/customerList", { params });
    return response.data;
};


export const setCustomerLimit = async (id:string,params: any  ) => {
    const formData = new FormData();    
    Object.entries(params).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value as File);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            // Handle arrays and objects by converting to JSON string
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value as string);
        }   
    });
    const response = await axiosInstance.put(`/distrubutor/setCustomerLimit/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const createRetailerRequest = async (params: any  ) => {
    const formData = new FormData();    
    Object.entries(params).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value as File);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            // Handle arrays and objects by converting to JSON string
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value as string);
        }   
    });
    const response = await axiosInstance.post("/distrubutor/retailer-requests", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getAllRetailerRequests = async (params: any  ) => {
    const response = await axiosInstance.get("/distrubutor/retailer-requests", { params });
    return response.data;
};

export const getRetailerRequestById = async (id:string,params: any  ) => {
    const response = await axiosInstance.get(`/distrubutor/retailer-requests/${id}`, { params });
    return response.data;
};

export const updateRetailerRequest = async (id:string,params: any  ) => {
    const formData = new FormData();    
    Object.entries(params).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value as File);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            // Handle arrays and objects by converting to JSON string
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value as string);
        }   
    });
    const response = await axiosInstance.put(`/distrubutor/retailer-requests/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteRetailerRequest = async (id:string) => {
    const response = await axiosInstance.delete(`/distrubutor/retailer-requests/${id}`);
    return response.data;
};

export const updateRetailerRequestStatus = async (id: string, data?: { status?: string; notes?: string }) => {
    const response = await axiosInstance.put(`/distrubutor/retailer-requests/${id}`, data);
    return response.data;
};

export const listOfCustomersCreate = async () => {
    const response = await axiosInstance.get("/list/listOfCustomersCreate");
    return response.data;
};

export const createCustomer = async (params: any) => {
    const response = await axiosInstance.post("/distrubutor/createCustomer", params);
    return response.data;
};
    