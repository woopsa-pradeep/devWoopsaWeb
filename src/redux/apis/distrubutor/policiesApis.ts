import axiosInstance from "../../../config/axios";

export const getPolicies = async () => {
    try {
        const response = await axiosInstance.get('/distrubutor/policies');
        return response.data; // Return the actual data, not the full response
    } catch (error) {
        console.error('Error fetching policies:', error);
        throw error;
    }
};

export const updateRefundPolicies = async (data: any) => {
    try {
        const response = await axiosInstance.put('/distrubutor/policies/refund', data);
        return response.data;
    } catch (error) {
        console.error('Error updating refund policies:', error);
        throw error;
    }
};