import axiosInstance from "../../../config/axios";
import { store } from "../../store";

export const getCustomerOrderedProducts = async (customerId: string, params: any) => {
    const storeDetail = store.getState().auth.storeDetail;
    const queryParams = {
        ...(params || {}),
        state: storeDetail?.C_State,
        zip: storeDetail?.C_Zip,
        jurisdiction: storeDetail?.Jurisdiction_State
    };
    
    const response = await axiosInstance.get(`/sales/customerOrderedProducts/${customerId}`,{
        params: queryParams,
        headers: {
            'customer': customerId
        }
    });
    return response.data;
}