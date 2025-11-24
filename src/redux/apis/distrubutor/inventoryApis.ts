import axiosInstance from "../../../config/axios";


export const createInventory = async (data: any) => {
    const response = await axiosInstance.post('/distrubutor/create-inventory', data);
    return response.data;
}

export const getListForInventory = async () => {
    const response = await axiosInstance.get('/list/listForInventory');
    return response.data;
}
export const checkUPC = async (upc: string) => {
    const response = await axiosInstance.get(`/distrubutor/check-upc/${upc}`);
    return response.data;
}
