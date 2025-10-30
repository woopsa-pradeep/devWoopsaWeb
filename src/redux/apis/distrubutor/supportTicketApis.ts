import axiosInstance from "../../../config/axios";

export const getSupportTicketList = async (status: string) => {
    const data = await axiosInstance.get(`/distrubutor/supportTicket/${status}`);
    return data.data;
};

export const updateSupportTicket = async (id: string, data: any) => {
    return axiosInstance.put(`/distrubutor/supportTicket/${id}`, data);
};

