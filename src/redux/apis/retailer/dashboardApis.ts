import axiosInstance from "../../../config/axios";

export const getBannerListRetailer = async () => {
    const response = await axiosInstance.get('/retailer/getBannerList');
    return response.data;
}