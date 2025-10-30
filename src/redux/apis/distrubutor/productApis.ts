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



