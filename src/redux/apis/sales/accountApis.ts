import axiosInstance from "../../../config/axios";

export const getAccountReceivablesList = async (customerId: string, params: any) => {
    const response = await axiosInstance.get(`/sales/accountReceivablesList/${customerId}`,{
        params,
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}