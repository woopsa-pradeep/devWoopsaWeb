import axiosInstance from "../../../config/axios";
import { getDeviceHeaders } from "../../../utils/deviceUtils";
// import { getDeviceHeaders } from "../../../utils/deviceHeaders";

export const getBannerListRetailer = async () => {
    const response = await axiosInstance.get('/retailer/getBannerList');
    return response.data;
}
export const hasMultipleStore = async (email: string) => {
    const response = await axiosInstance.get(`/retailer/hasmultipleStore/?email=${email}`);
    return response.data;
}

export const switchStore = async (retailerId: string) => {
    const response = await axiosInstance.put(`/retailer/switchStore/${retailerId}`, {}, {
        headers: getDeviceHeaders()
    });
    return response.data;
}