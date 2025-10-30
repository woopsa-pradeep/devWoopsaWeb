import axiosInstance from "../../../config/axios";

export const getProductCatalog = async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/retailer/product-catalogs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
}

export const addProductCatalog = async (data: any) => {
    const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('attachment', data.attachment);

    const response = await axiosInstance.post('/retailer/product-catalogs', formData,{
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export const updateProductCatalog = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/retailer/product-catalogs/${id}`, data);
    return response.data;
}