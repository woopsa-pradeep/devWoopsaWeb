import axiosInstance from '../../../config/axios';

const BASE = '/distrubutor';

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Invoice template as returned by API (id is number) */
export interface InvoiceTemplateApi {
  id: number;
  name: string;
  mainTemplate?: boolean;
  groupBy: string;
  showGroupHeader: boolean;
  selectedColumns: Record<string, boolean>;
  upcOption: string;
  showDistributorDetails: boolean;
  showCustomerDetails: boolean;
  showBillTo?: boolean;
  showShipTo?: boolean;
  showDocNumber: boolean;
  showPageOf: boolean;
  showInvoiceDate: boolean;
  showInvoiceDateWithTime: boolean;
  showRoute: boolean;
  showStop: boolean;
  showLogo: boolean;
  logoPosition: string;
  showTerms: boolean;
  headerOnPages: string;
  showHeaderMessage: boolean;
  headerMessageFirstPage: string;
  footerLayout: string;
  showFooterMessage: boolean;
  footerMessageLastPage: string;
  showSubTotal: boolean;
  showDeliveryCharge: boolean;
  showDeposit?: boolean;
  showLastBalance: boolean;
  showTotalAmountDue: boolean;
  showReportGeneratedByWoopsa: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload for create/update invoice template */
export interface InvoiceTemplatePayload {
  name: string;
  mainTemplate?: boolean;
  groupBy?: string;
  showGroupHeader?: boolean;
  selectedColumns?: Record<string, boolean>;
  upcOption?: string;
  showDistributorDetails?: boolean;
  showCustomerDetails?: boolean;
  showBillTo?: boolean;
  showShipTo?: boolean;
  showDocNumber?: boolean;
  showPageOf?: boolean;
  showInvoiceDate?: boolean;
  showInvoiceDateWithTime?: boolean;
  showRoute?: boolean;
  showStop?: boolean;
  showLogo?: boolean;
  logoPosition?: string;
  showTerms?: boolean;
  headerOnPages?: string;
  showHeaderMessage?: boolean;
  headerMessageFirstPage?: string;
  footerLayout?: string;
  showFooterMessage?: boolean;
  footerMessageLastPage?: string;
  showSubTotal?: boolean;
  showDeliveryCharge?: boolean;
  showDeposit?: boolean;
  showLastBalance?: boolean;
  showTotalAmountDue?: boolean;
  showReportGeneratedByWoopsa?: boolean;
}

/** Customer assign invoice template (assignment) */
export interface CustomerAssignInvoiceTemplateApi {
  id: number;
  customerNumber: number;
  templateId: number;
  createdAt: string;
  updatedAt: string;
}

/** Paginated list response */
export interface PaginatedData<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Invoice Templates ---

export const getInvoiceTemplates = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  mainTemplate?: boolean;
}) => {
  const response = await axiosInstance.get<ApiResponse<PaginatedData<InvoiceTemplateApi>>>(
    `${BASE}/invoice-templates`,
    { params }
  );
  return response.data;
};

export const getInvoiceTemplateById = async (id: number) => {
  const response = await axiosInstance.get<ApiResponse<InvoiceTemplateApi>>(
    `${BASE}/invoice-templates/${id}`
  );
  return response.data;
};

export const createInvoiceTemplate = async (payload: InvoiceTemplatePayload) => {
  const response = await axiosInstance.post<ApiResponse<InvoiceTemplateApi>>(
    `${BASE}/invoice-templates`,
    payload
  );
  return response.data;
};

export const updateInvoiceTemplate = async (id: number, payload: Partial<InvoiceTemplatePayload>) => {
  const response = await axiosInstance.put<ApiResponse<InvoiceTemplateApi>>(
    `${BASE}/invoice-templates/${id}`,
    payload
  );
  return response.data;
};

export const deleteInvoiceTemplate = async (id: number) => {
  const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `${BASE}/invoice-templates/${id}`
  );
  return response.data;
};

// --- Customer Assign Invoice Templates ---

export const getCustomerAssignInvoiceTemplates = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  customerNumber?: number;
  templateId?: number;
}) => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedData<CustomerAssignInvoiceTemplateApi>>
  >(`${BASE}/customer-assign-invoice-templates`, { params });
  return response.data;
};

export const getCustomerAssignInvoiceTemplateById = async (id: number) => {
  const response = await axiosInstance.get<ApiResponse<CustomerAssignInvoiceTemplateApi>>(
    `${BASE}/customer-assign-invoice-templates/${id}`
  );
  return response.data;
};

export const createCustomerAssignInvoiceTemplate = async (data: {
  customerNumber: number;
  templateId: number;
}) => {
  const response = await axiosInstance.post<ApiResponse<CustomerAssignInvoiceTemplateApi>>(
    `${BASE}/customer-assign-invoice-templates`,
    data
  );
  return response.data;
};

export const updateCustomerAssignInvoiceTemplate = async (
  id: number,
  data: { customerNumber?: number; templateId?: number }
) => {
  const response = await axiosInstance.put<ApiResponse<CustomerAssignInvoiceTemplateApi>>(
    `${BASE}/customer-assign-invoice-templates/${id}`,
    data
  );
  return response.data;
};

export const deleteCustomerAssignInvoiceTemplate = async (id: number) => {
  const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `${BASE}/customer-assign-invoice-templates/${id}`
  );
  return response.data;
};

export const bulkAddCustomerAssignInvoiceTemplates = async (assignments: Array<{
  customerNumber: number;
  templateId: number;
}>) => {
  const response = await axiosInstance.post<
    ApiResponse<{ message: string; data: CustomerAssignInvoiceTemplateApi[]; count: number }>
  >(`${BASE}/customer-assign-invoice-templates/bulk-add`, { assignments });
  return response.data;
};

export const bulkRemoveCustomerAssignInvoiceTemplates = async (assignments: Array<{
  customerNumber: number;
  templateId: number;
}>) => {
  const response = await axiosInstance.post<
    ApiResponse<{ message: string; count: number }>
  >(`${BASE}/customer-assign-invoice-templates/bulk-remove`, { assignments });
  return response.data;
};

/** Get the invoice template to use for a given customer: assigned template or main template. */
export const getInvoiceTemplateForCustomer = async (
  customerNumber: number
): Promise<InvoiceTemplateApi | null> => {
  try {
    const assignRes = await getCustomerAssignInvoiceTemplates({
      customerNumber,
      limit: 1,
      page: 1,
    });
    const list = assignRes?.data?.data ?? [];
    if (list.length > 0) {
      const templateRes = await getInvoiceTemplateById(list[0].templateId);
      return templateRes?.data ?? null;
    }
    const templatesRes = await getInvoiceTemplates({ mainTemplate: true, limit: 1, page: 1 });
    const mainList = templatesRes?.data?.data ?? [];
    return mainList.length > 0 ? mainList[0] : null;
  } catch {
    return null;
  }
};
