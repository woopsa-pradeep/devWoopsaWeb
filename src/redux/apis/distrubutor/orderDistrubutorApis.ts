import axiosInstance from "../../../config/axios";
import type { InvoiceTemplateApi } from "../manager/invoiceTemplateApis";
import dayjs from "dayjs";

/** Format date for API as YYYY-MM-DD so the selected calendar date is sent exactly (no timezone shift). */
function toDateOnlyString(value: any): string {
    if (value == null) return "";
    const d = dayjs(value);
    return d.isValid() ? d.format("YYYY-MM-DD") : "";
}

export const getOrderHistory = async (page: number = 1, limit: number = 10, customerId?: string, startDate?: any, endDate?: any, isDeleted?: boolean, updated?: boolean, currentStatus?: string) => {
    let url = `/distrubutor/orderHistory?page=${page}&limit=${limit}`;
    if (customerId) {
        url += `&customerNumber=${customerId}`;
    }
    const startStr = toDateOnlyString(startDate);
    if (startStr) {
        url += `&startDate=${encodeURIComponent(startStr)}`;
    }
    const endStr = toDateOnlyString(endDate);
    if (endStr) {
        url += `&endDate=${encodeURIComponent(endStr)}`;
    }
    if (isDeleted !== undefined) {
        url += `&isDeleted=${isDeleted}`;
    }
    if (updated !== undefined) {
        url += `&updated=${updated}`;
    }
    if (currentStatus) {
        url += `&currentStatus=${currentStatus}`;
    }
    const response = await axiosInstance.get(url);
    return response.data;
}

export const getOrderHistoryByOrderNumber = async (id: any, page: number = 1, limit: number = 10) => {
    const response = await axiosInstance.get(`/distrubutor/orderHistoryByOrderNumber/${id}?page=${page}&limit=${limit}`);
    return response.data;
}   

export const getOrderDeliveryStatus = async (id: any) => {
    const response = await axiosInstance.get(`/distrubutor/orderDeliveryStatus/${id}`);
    return response.data;
}

export const getOrderDetailByOrderNumberForInvoice = async (id: any) => {
    const response = await axiosInstance.get(`/distrubutor/orderDetailByOrderNumberForInvoice/${id}`);
    return response.data;
};

/** GET /distrubutor/createInvoice/:orderNumber - create invoice on backend (then generate PDF with assigned template). */
export const getCreateInvoice = async (orderNumber: string) => {
    const response = await axiosInstance.get(`/distrubutor/createInvoice/${orderNumber}`);
    return response.data;
};

/** API response: { success, message, data } with template in data. */
interface CustomerInvoiceTemplateResponse {
    success: boolean;
    message: string;
    data: InvoiceTemplateApi;
}

/** GET /distrubutor/customer-invoice-template/:customerNumber - get invoice template assigned to customer. */
export const getCustomerInvoiceTemplate = async (customerNumber: number): Promise<InvoiceTemplateApi | null> => {
    const response = await axiosInstance.get<CustomerInvoiceTemplateResponse>(`/distrubutor/customer-invoice-template/${customerNumber}`);
    const raw = response.data;
    // Support both { success, message, data } and raw template at top level
    const template = raw?.data ?? (raw && typeof raw === 'object' && ('selectedColumns' in raw || 'groupBy' in raw) ? raw : null);
    return template ?? null;
};

export const getOrderNumbers = async () => {
    const response = await axiosInstance.get('/distrubutor/order-numbers');
    return response.data;
};

export const postOrderNumbersByCustomerIds = async (customerId: (string | number)[]) => {
    const response = await axiosInstance.post('/distrubutor/order-numbers-by-customer', { customerId });
    return response.data;
};

export const getOrderForPickListConfirmation = async (params: { isDeleted?: boolean; updated?: boolean; currentStatus?: string; startDate?: any; endDate?: any }) => {
    const sp = new URLSearchParams();
    if (params.isDeleted !== undefined) sp.set('isDeleted', String(params.isDeleted));
    if (params.updated !== undefined) sp.set('updated', String(params.updated));
    if (params.currentStatus) sp.set('currentStatus', params.currentStatus);
    const startStr = toDateOnlyString(params.startDate);
    if (startStr) sp.set('startDate', startStr);
    const endStr = toDateOnlyString(params.endDate);
    if (endStr) sp.set('endDate', endStr);
    const query = sp.toString();
    const url = `/distrubutor/orderForPickListConfirmation${query ? `?${query}` : ''}`;
    const response = await axiosInstance.get(url);
    return response.data;
}