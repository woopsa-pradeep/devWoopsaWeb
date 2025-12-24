import axiosInstance from "../../../config/axios";

export const productList = async (params: any) => {
    return axiosInstance.post('/distrubutor/productList', params);
};

export const uploadProductImage = async (formData: FormData) => {
    return axiosInstance.post('/distrubutor/uploadProductImage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const updateProductImageByImageId = async (imageId: string, formData: FormData) => {
    return axiosInstance.put(`/distrubutor/updateProductImage/${imageId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const getProductById = async (itemNumber: string) => {
    return axiosInstance.get(`/distrubutor/product/${itemNumber}`);
};

export const createProductLimit = async (params: any) => {
    return axiosInstance.post('/distrubutor/itemLimits', params);
};


export const updateProductLimit = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/itemLimits/${id}`, params);
};

export const inventoryForReport = async (onDownloadProgress?: (progressEvent: any) => void) => {
    return axiosInstance.get('/distrubutor/inventoryForReport', {
        timeout: 1800000, // 30 minutes timeout for this long-running request
        ...(onDownloadProgress && { onDownloadProgress }),
        // Increase maxContentLength and maxBodyLength for large responses
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    } as any);
};

export const inventoryItemsForUpdate = async (params: {
    salesCategoryId?: string[];
    priceClassId?: number[];
    filter?: string;
}) => {
    return axiosInstance.post('/distrubutor/inventoryItemsForUpdate', params);
};

export const bulkUpdateInventory = async (params: {
    field: Record<string, any>;
    data: Record<string, any>;
    hasBulkUpdate: boolean;
}) => {
    return axiosInstance.post('/distrubutor/bulkUpdateInventory', params);
};

