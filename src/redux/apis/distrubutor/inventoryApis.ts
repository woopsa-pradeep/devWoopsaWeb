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

export const getInventoryById = async (itemNumber: string) => {
    const response = await axiosInstance.get(`/distrubutor/inventory/${itemNumber}`);
    return response.data;
}

export const updateInventory = async (itemNumber: string, data: any) => {
    const response = await axiosInstance.put(`/distrubutor/edit-inventory/${itemNumber}`, data);
    return response.data;
}

export const updateUPC = async (upcId: number, data: { upcNumber: string }) => {
    const response = await axiosInstance.put(`/distrubutor/edit-upc-number/${upcId}`, data);
    return response.data;
}