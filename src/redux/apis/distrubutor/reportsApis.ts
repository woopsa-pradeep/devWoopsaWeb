import axiosInstance from "../../../config/axios";

export const customerForReport = async () => {
    return axiosInstance.get('/distrubutor/customerForReport');
};