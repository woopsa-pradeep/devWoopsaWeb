    import axiosInstance from "../../../config/axios";

export const createPromo = async (params: any) => {
    return axiosInstance.post('/distrubutor/createBanner', params, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updatePromo = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/updateBanner/${id}`, params, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getPromoList = async (params: any) => {
    return axiosInstance.get('/distrubutor/getBannerList', { params });
};

export const deletePromo = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/deleteBanner/${id}`);
};



// web view

export const createWebView = async (params: any) => {
    const formData = new FormData();
    formData.append('image', params.image);
    formData.append('section', params.section);
    return axiosInstance.post('/distrubutor/webviews', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const createWebViewForSection = async (params: any) => {
    const formData = new FormData();
    formData.append('image', params.image);
    formData.append('section', params.section);
    formData.append('productsList', JSON.stringify(params.productsList));
    return axiosInstance.post('/distrubutor/webviews', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getWebView = async () => {
    const response = await axiosInstance.get('/distrubutor/webviews');
    return response.data;
};

export const updateWebView = async (id: string, params: any) => {    
    const formData = new FormData();
    formData.append('image', params.image);
    return axiosInstance.put(`/distrubutor/webviews/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getWebViewById = async (id: string) => {
    return axiosInstance.get(`/distrubutor/webviews/${id}`);
};

export const deleteWebView = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/webviews/${id}`);
};

export const getProductListBySearch = async (params: any) => {
    return axiosInstance.get(`/list/productListBySearch?search=${params.search}`);
};

// Associate products with web view image
export const associateProductsWithWebView = async (webViewId: string, productIds: number[]) => {
    return axiosInstance.post(`/distrubutor/webviews/products-update/${webViewId}`, {
        productIds
    });
};

// Get products associated with a web view image
export const getProductsByWebView = async (webViewId: string) => {
    return axiosInstance.get(`/distrubutor/webviews/${webViewId}/products`);
};


// WebPriceClass CRUD routes
export const createWebPriceClass = async (params: any) => {
    return axiosInstance.post('/distrubutor/web-price-classes', params, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
export const getAllWebPriceClasses = async (page: number, limit: number) => {
    return axiosInstance.get(`/distrubutor/web-price-classes?page=${page}&limit=${limit}`);
};
export const getWebPriceClassById = async (id: string) => {
    return axiosInstance.get(`/distrubutor/web-price-classes/${id}`);
};
export const updateWebPriceClass = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/web-price-classes/${id}`, params, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
export const deleteWebPriceClass = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/web-price-classes/${id}`);
};

// WebCategory CRUD routes  
export const createWebCategory = async (params: any) => {
    return axiosInstance.post('/distrubutor/web-categories', params, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
export const getAllWebCategories = async (page: number, limit: number) => {
    return axiosInstance.get(`/distrubutor/web-categories?page=${page}&limit=${limit}`);
};
export const getWebCategoryById = async (id: string) => {
    return axiosInstance.get(`/distrubutor/web-categories/${id}`);
};
export const updateWebCategory = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/web-categories/${id}`, params, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
export const deleteWebCategory = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/web-categories/${id}`);
};      



export const getQuickLinks = async () => {
    const response :any = await axiosInstance.get('/distrubutor/web-quick-links');
    return response.data;
};

export const createQuickLink = async (params: any) => {
    return axiosInstance.post('/distrubutor/web-quick-links', params);
};

export const updateQuickLink = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/web-quick-links/${id}`, params);
};

export const deleteQuickLink = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/web-quick-links/${id}`);
};  


export const createLocation = async (params: any) => {
    return axiosInstance.post('/distrubutor/web-locations', params);
};

export const getAllLocations = async () => {
    const response = await axiosInstance.get('/distrubutor/web-locations');
    return response.data;
};

export const updateLocation = async (id: string, params: any) => {
    return axiosInstance.put(`/distrubutor/web-locations/${id}`, params);
};

export const deleteLocation = async (id: string) => {
    return axiosInstance.delete(`/distrubutor/web-locations/${id}`);
};

export const createEmailMarketing = async (params: any) => {
    return axiosInstance.post('/distrubutor/email-marketing', params);
};

export const getAllEmailMarketing = async () => {
    const response:any = await axiosInstance.get('/distrubutor/email-marketing');
    return response.data.data;
};

export const getEmailForCampaign = async (payload: any) => {
    const response:any = await axiosInstance.post(`/list/listOfCustomerForEmail`,payload);
    return response.data.data;
};


export const getCustomerRouteList =async () => {
    const response:any = await axiosInstance.get(`/list/customerRouteList`);
    return response.data.data;
}


export const uploadAttachment = async (params: any) => {
    const formData = new FormData();
    formData.append('attachment', params.attachment);
    return axiosInstance.post('/distrubutor/uploadAttachment', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};


export const sendDraftEmail = async (id: string) => {
    return axiosInstance.post(`/distrubutor/email-marketing/${id}/send`);
};  


