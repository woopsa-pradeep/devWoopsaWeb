import axiosInstance from "../../config/axios"; // adjust path as needed

export const getBannerData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/bannerList");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const getSpecialOffersData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/specialItems");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const getPromotionalData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/promotedItems");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};


export const getNewArrivalsData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/newItem");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const getPopularProductsData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/popularItems");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const getAdvertisementData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/adverstismentImage");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const getProductCategory = async () => {
  try {
    const response :any = await axiosInstance.get("/home/productCategory");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

export const getContactUsData = async () => {
  try {
    const response :any = await axiosInstance.get("/home/contactUs");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};
export const getProductByCategoryList = async (priceClass?: string, salesCategory?: string, page?: number, limit?: number) => {   
    try {
        const params = new URLSearchParams();
        if (priceClass) params.append('priceClass', priceClass);
        if (salesCategory) params.append('salesCategory', salesCategory);
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        
        const response :any = await axiosInstance.get(`/home/productByCategoryList?${params.toString()}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching profile data:", error);
        throw error;
    }
};

export const getProductList = async (payload: {
    page?: number;
    limit?: number;
    salesCategoryId?: any;
    search?: string;
    masterSearch?: string; // Add masterSearch parameter for banner product searches
    priceClassId?: any;
}) => {
    try {
        const defaultPayload = {
            page: 1,
            limit: 10,
            salesCategoryId: '',
            search: '',
            masterSearch: '', // Add default value for masterSearch
            priceClassId: '',
            ...payload
        };
        
        const response :any = await axiosInstance.post("/home/productList", defaultPayload);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching profile data:", error);
        throw error;
    }
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
  const response = await axiosInstance.post("/home/retailer-requests", formData, {
      headers: {
          'Content-Type': 'multipart/form-data'
      }
  });
  return response.data;
};
export const getWebPriceClass = async () => {
  try {
    const response :any = await axiosInstance.get("/home/webPriceClass");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};