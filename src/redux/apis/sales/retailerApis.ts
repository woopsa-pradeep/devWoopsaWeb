import axiosInstance from "../../../config/axios";

export const getCustomerListAsPerSalesRep = async (params: any) => {
    const response = await axiosInstance.post(
        `/sales/customerListPaginated`,
        params,
        {
            headers: {
                'customer': params.customerId
            }
        }
    );
    return response.data;
}