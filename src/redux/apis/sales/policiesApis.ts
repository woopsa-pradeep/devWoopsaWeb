import axiosInstance from "../../../config/axios";

export const getPolicies = async () => {
    try {
        const response = await axiosInstance.get('/sales/policies');
        return response.data;
    } catch (error) {
        console.error('Error fetching policies:', error);
        throw error;
    }
};