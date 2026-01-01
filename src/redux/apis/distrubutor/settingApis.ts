import axiosInstance from "../../../config/axios";

export const updateWarehouseSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateWarehouseSetting', data);
};

export const getWarehouseSetting = async () => {
    return axiosInstance.get('/distrubutor/warehouseSetting');
};


export const getHomeSetting = async () => {
    return axiosInstance.get('/distrubutor/homeSetting');
};

export const updateHomeSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateHomeSetting', data);
};

export const getProfile = async () => {
    return axiosInstance.get('/distrubutor/profile');
};

// New API functions for different settings tabs
export const updateSalesRepSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateSalesRepSetting', data);
};

export const updateItemGlobalSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateItemGlobalSetting', data);
};

export const updateRetailerSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateRetailerSetting', data);
};

export const updateWarehouseProfileSetting = async (data: any) => {
    return axiosInstance.put('/distrubutor/updateWarehouseProfileSetting', data);
};

export const uploadProfileImage = async (data: any) => {
    const formData = new FormData();
    formData.append('image', data);
    const response:any= await axiosInstance.post('/distrubutor/uploadWarehouseImage', formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    return response?.data?.data;
};
export const setCustomerLimit = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/setCustomerLimit/${id}`, data);
};

export const createContactUs = async (data: any) => {
    return axiosInstance.post('/distrubutor/contact-us', data);
};

export const getAllContactUs = async () => {
    return axiosInstance.get('/distrubutor/contact-us');
};

export const updateContactUs = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/contact-us/${id}`, data);
};

export const deleteContactUs = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/contact-us/${id}`);
};

export const createEmailManagement = async (data: any) => {
    return axiosInstance.post('/distrubutor/email-configs', data);
};

export const getEmailManagement = async () => {
    const response:any = await axiosInstance.get('/distrubutor/email-configs');
    return response?.data?.data;
};

export const updateEmailManagement = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/email-configs/${id}`, data);
};


export const testEmailManagement = async (data: any) => {
    return axiosInstance.post('/distrubutor/email-configs/test', data);
};

export const createErpUser = async (data: any) => {
    return axiosInstance.post('/distrubutor/createErpUser', data);
};

export const updateErpUser = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/updateErpUser/${id}`, data);
};

export const getErpUsers = async () => {
    return axiosInstance.get('/distrubutor/erp-users');
};

export const getErpUser = async (id: string) => {
    return axiosInstance.get(`/distrubutor/erpuser/${id}`);
};

// Picklist Template APIs
export const getPicklistTemplate = async () => {
    const response: any = await axiosInstance.get('/distrubutor/picklists');
    return response?.data;
};

export const savePicklistTemplate = async (data: any) => {
    const response: any = await axiosInstance.post('/distrubutor/picklists', data);
    return response?.data;
};

export const updatePicklistTemplate = async (id: string, data: any) => {
    const response: any = await axiosInstance.put(`/distrubutor/picklists/${id}`, data);
    return response?.data;
};

// Mark picklist as printed
export const makePickListPrinted = async (orderNumber: string) => {
    const response: any = await axiosInstance.put(`/distrubutor/makePickListPrinted/${orderNumber}`);
    return response?.data;
};