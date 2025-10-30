import axiosInstance from "../../../config/axios";

export const getProductCatalog = async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/distrubutor/product-catalogs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
}

export const addProductCatalog = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    
    // Only append attachment if it exists
    if (data.attachment) {
        formData.append('attachment', data.attachment);
    }
    
    // Only append link if it exists
    if (data.link) {
        formData.append('link', data.link);
    }

    const response = await axiosInstance.post('/distrubutor/product-catalogs', formData,{
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export const updateProductCatalog = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/distrubutor/product-catalogs/${id}`, data);
    return response.data;
}


export const deleteProductCatalog = async (id: string) => {
    const response = await axiosInstance.delete(`/distrubutor/product-catalogs/${id}`);
    return response.data;
}
