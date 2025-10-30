
import axiosInstance from "../../../config/axios";

export const getCustomerOrderedProducts = async (customerId: string, params: any) => {
    const response = await axiosInstance.get(`/sales/customerOrderedProducts/${customerId}`,{
        params,
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}