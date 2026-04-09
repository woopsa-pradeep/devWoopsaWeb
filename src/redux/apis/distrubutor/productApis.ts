import axiosInstance from "../../../config/axios";


export const productList = async (params: any) => {
    return axiosInstance.post('/distrubutor/productList', params);
};

export const productListWithTax = async (params: any & { customerId?: number }) => {
    return axiosInstance.post('/distrubutor/productListWithTax', params);
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

export const getProductById = async (
  itemNumber: string
): Promise<{ data: { data: any } }> => {
  return axiosInstance.get(`/distrubutor/product/${itemNumber}`);
};

export const getProductsByOrderNumber = async (params: {
    orderNumbers: number[];
    customerId: number | null;
}) => {
    return axiosInstance.post('/distrubutor/getProductsByOrderNumber', params);
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

export const inventoryItemsForUpdate = async (params?: {
    salesCategoryId?: string[] | number[];
    priceClassId?: number[];
    filter?: string;
}) => {
    return axiosInstance.post('/distrubutor/inventoryItemsForUpdate', params || {});
};

export const bulkUpdateInventory = async (params: {
    field: Record<string, any>;
    data: Record<string, any>;
    hasBulkUpdate: boolean;
}) => {
    return axiosInstance.post('/distrubutor/bulkUpdateInventory', params);
};

// Product list by search (for dropdowns)
export const getProductListBySearch = async (params: { search: string }) => {
    return axiosInstance.get(`/list/productListBySearch?search=${params.search || ''}`);
};

// Upload image for bulk image upload (distributor/uploadImages)
export const uploadDistributorImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosInstance.post('/distrubutor/uploadImages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Bulk upload item images (multipart: field name `images`)
export const bulkUploadItemImages = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('images', file);
    });
    return axiosInstance.post('/distrubutor/bulk-upload-item-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Future Pricing APIs
export const getAllFuturePricings = async () => {
    return axiosInstance.get('/distrubutor/future-pricing');
};

export const getFuturePricingById = async (id: string) => {
    return axiosInstance.get(`/distrubutor/future-pricing/${id}`);
};

export const createFuturePricing = async (params: {
    futurePricings: Array<{
        itemNumber: number;
        effectiveAt: string;
        changedFields: Array<Record<string, number>>;
        isApplied: boolean;
        changedBy: string;
        changedUserId: string | null;
    }>;
}) => {
    return axiosInstance.post('/distrubutor/future-pricing', params);
};

export const updateFuturePricing = async (id: string, params: {
    itemNumber: number;
    effectiveAt: string;
    changedFields: Array<Record<string, number>>;
    isApplied: boolean;
    changedBy: string;
    changedUserId: string | null;
}) => {
    return axiosInstance.put(`/distrubutor/future-pricing/${id}`, params);
};

export const deleteFuturePricing = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/future-pricing/${id}`);
};

