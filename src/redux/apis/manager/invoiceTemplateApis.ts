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
  /** Optional custom column header labels (key -> display label) */
  columnHeaderNames?: Record<string, string>;
  /** 'default' = fixed column order (line-wise); 'custom' = use columnOrder for placement */
  columnPlacement?: 'default' | 'custom';
  /** When columnPlacement is 'custom': field key -> 1-based column position (e.g. itemNumber: 5, orderQty: 3) */
  columnOrder?: Record<string, number>;
  /** Extended total column = Price w/t with PPD or Price w/t without PPD * qty */
  extendedTotalBasedOn?: 'withPPD' | 'withoutPPD';
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
  showHouseCharge?: boolean;
  showPosCheck?: boolean;
  showPosCash?: boolean;
  showPosCredit?: boolean;
  showInvoiceTotal?: boolean;
  showLastBalance: boolean;
  showTotalAmountDue: boolean;
  footerSummaryLabels?: Record<string, string>;
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
  /** Optional custom column header labels (key -> display label) */
  columnHeaderNames?: Record<string, string>;
  /** 'default' = fixed column order; 'custom' = use columnOrder */
  columnPlacement?: 'default' | 'custom';
  /** When columnPlacement is 'custom': field key -> 1-based column position */
  columnOrder?: Record<string, number>;
  extendedTotalBasedOn?: 'withPPD' | 'withoutPPD';
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
  showHouseCharge?: boolean;
  showPosCheck?: boolean;
  showPosCash?: boolean;
  showPosCredit?: boolean;
  showInvoiceTotal?: boolean;
  showLastBalance?: boolean;
  showTotalAmountDue?: boolean;
  footerSummaryLabels?: Record<string, string>;
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

/** Shape of one customer in customer-by-invoice-id response (C_Number, C_Name). */
export interface CustomerByInvoiceTemplateItem {
  C_Number: number;
  C_Name: string;
}

/** GET customer-by-invoice-id/:id - get customers assigned to this invoice template (with C_Number, C_Name). */
export const getCustomersByInvoiceTemplateId = async (
  id: number
): Promise<CustomerByInvoiceTemplateItem[]> => {
  const response = await axiosInstance.get<
    ApiResponse<
      | number[]
      | { customerNumbers?: number[] }
      | Array<{ customerNumber?: number; C_Number?: number; C_Name?: string }>
    >
  >(`${BASE}/customer-by-invoice-id/${id}`);
  const data = response.data?.data;
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const first = data[0];
    if (typeof first === 'number') {
      return (data as number[]).map((n) => ({ C_Number: n, C_Name: '' }));
    }
    if (first && typeof first === 'object') {
      if ('C_Number' in first && first.C_Number != null) {
        return (data as Array<{ C_Number: number; C_Name?: string }>).map((x) => ({
          C_Number: x.C_Number,
          C_Name: x.C_Name ?? '',
        }));
      }
      if ('customerNumber' in first && first.customerNumber != null) {
        return (data as Array<{ customerNumber: number }>).map((x) => ({
          C_Number: x.customerNumber,
          C_Name: '',
        }));
      }
    }
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { customerNumbers?: number[] }).customerNumbers)) {
    return ((data as { customerNumbers: number[] }).customerNumbers).map((n) => ({ C_Number: n, C_Name: '' }));
  }
  return [];
};

/** DELETE customer-assign-delete/:customerNumber - remove customer from template (pass templateId as query). */
export const deleteCustomerFromInvoiceTemplate = async (
  customerNumber: number,
  templateId: number
): Promise<void> => {
  await axiosInstance.delete<ApiResponse<{ message?: string }>>(
    `${BASE}/customer-assign-delete/${customerNumber}`,
    { params: { templateId } }
  );
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
