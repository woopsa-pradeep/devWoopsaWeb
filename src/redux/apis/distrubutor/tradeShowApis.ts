import axiosInstance from "../../../config/axios";

// Fetch all trade shows (active and past) with pagination (default limit: 100)
export const getTradeShowList = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  const response = await axiosInstance.get(
    `/distrubutor/trade-shows?${q.toString()}`
  );
  return response.data;
};

// Get single trade show by id (for edit mode step 0)
export const getTradeShowById = async (tradeShowId: number | string) => {
  const response = await axiosInstance.get(
    `/distrubutor/trade-shows/${tradeShowId}`
  );
  return response.data;
};

// Get vendor IDs already assigned to trade show (for edit mode step 1)
export const getTradeShowVendorIdsForEdit = async (
  tradeShowId: number | string
) => {
  const response = await axiosInstance.get(
    `/distrubutor/trade-show-vendorsIds/${tradeShowId}`
  );
  return response.data;
};

// Get items already assigned to trade show (for edit mode step 2)
export const getTradeShowItemForEdit = async (
  tradeShowId: number | string
) => {
  const response = await axiosInstance.get(
    `/distrubutor/trade-show-item-for-edit/${tradeShowId}`
  );
  return response.data;
};

// Get retailers already assigned to trade show (for edit mode step 3)
export const getTradeShowRetailerForEdit = async (
  tradeShowId: number | string
) => {
  const response = await axiosInstance.get(
    `/distrubutor/trade-show-retailer-for-edit/${tradeShowId}`
  );
  return response.data;
};

// Create a new trade show
export const createTradeShow = async (payload: {
  name: string;
  tradeShowDate: string;
  deliveryStartDate: string;
  deliveryEndDate: string;
  deliveryWeeks: number;
}) => {
  const response = await axiosInstance.post(
    "/distrubutor/trade-shows",
    payload
  );
  return response.data;
};

// Deactivate a trade show (DELETE deactive/:id)
export const deactivateTradeShow = async (id: number | string) => {
  const response = await axiosInstance.delete(`/distrubutor/deactive/${id}`);
  return response.data;
};

// Update existing trade show
export const updateTradeShow = async (
  id: number | string,
  payload: {
    name: string;
    tradeShowDate: string;
    deliveryStartDate: string;
    deliveryEndDate: string;
    deliveryWeeks: number;
  }
) => {
  const response = await axiosInstance.put(
    `/distrubutor/trade-shows/${id}`,
    payload
  );
  return response.data;
};

// List all vendors that can be attached to a tradeshow
export const getVendorsForTradeShow = async () => {
  const response = await axiosInstance.get(
    "/list/listOfVendorForTradeShow"
  );
  return response.data;
};

// Bulk-attach vendors to a tradeshow
export interface TradeShowVendorPayload {
  Primary_Vendor: number;
  V_Description: string;
}

export const bulkAssignVendorsToTradeShow = async (
  tradeShowId: number | string,
  vendorIds: TradeShowVendorPayload[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/trade-show-vendors/bulk",
    {
      tradeShowId,
      vendorIds,
    }
  );
  return response.data;
};

// Bulk-remove vendors from a tradeshow (e.g. when user goes back to vendor step and deselects some)
export const deleteBulkTradeShowVendors = async (
  tradeShowId: number | string,
  vendorIds: number[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/deleteBulkTradeShowVendors",
    { tradeShowId, vendorIds }
  );
  return response.data;
};

// List items for Products & Discounts step (inventory by selected vendor IDs)
export const getInventoryAsPerVendorIds = async (payload: {
  salesCategoryId: number[];
  ids: number[];
  priceClassId: number[];
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await axiosInstance.post(
    "/distrubutor/getInventoryAsPerVendorIds",
    {
      ...payload,
      search: payload.search ?? "",
      limit: payload.limit ?? 100,
    }
  );
  return response.data;
};

// Bulk-assign items with discounts to a tradeshow (salesCategory, priceClass, description sent in payload but not shown in UI)
export interface TradeShowItemPayload {
  itemNumber: string;
  discount: string;
  minQuantity: number;
  maxQuantity: number;
  disType: "PERCENT" | "FLAT";
  salesCategory?: number;
  priceClass?: number;
  description?: string;
}

/** Response item from POST trade-show-items/bulk */
export interface TradeShowItemResponse {
  id: number;
  tradeShowId: number;
  itemNumber: string;
  discount: string;
  minQuantity: number;
  maxQuantity: number;
  disType: "PERCENT" | "FLAT";
  description?: string;
  salesCategory?: number;
  priceClass?: number;
  vendorId?: number;
}

export interface BulkAssignItemsResponse {
  success: boolean;
  count: number;
  items: TradeShowItemResponse[];
}

export const bulkAssignItemsToTradeShow = async (
  tradeShowId: number | string,
  items: TradeShowItemPayload[]
): Promise<BulkAssignItemsResponse> => {
  const response = await axiosInstance.post<BulkAssignItemsResponse>(
    "/distrubutor/trade-show-items/bulk",
    {
      tradeShowId,
      items,
    }
  );
  return response.data;
};

/** Payload for PUT trade-show-items/bulk (id required; other fields optional for partial update) */
export interface TradeShowItemBulkUpdatePayload {
  id: number;
  tradeShowId?: number;
  itemNumber?: string;
  discount?: string;
  minQuantity?: number;
  maxQuantity?: number;
  disType?: "PERCENT" | "FLAT";
  description?: string;
  salesCategory?: number;
  priceClass?: number;
  vendorId?: number;
}

export const bulkUpdateTradeShowItems = async (
  items: TradeShowItemBulkUpdatePayload[]
) => {
  const response = await axiosInstance.put(
    "/distrubutor/trade-show-items/bulk",
    { items }
  );
  return response.data;
};

// Update a single trade show item
export const updateTradeShowItem = async (
  id: number | string,
  payload: TradeShowItemPayload
) => {
  const response = await axiosInstance.put(
    `/distrubutor/trade-show-items/${id}`,
    payload
  );
  return response.data;
};

// Delete a trade show item
export const deleteTradeShowItem = async (id: number | string) => {
  const response = await axiosInstance.delete(
    `/distrubutor/trade-show-items/${id}`
  );
  return response.data;
};

// Bulk-remove trade show items (e.g. when user goes back to Products step and removes some)
export const deleteBulkTradeShowItems = async (
  tradeShowId: number | string,
  itemNumbers: string[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/deleteBulkTradeShowItems",
    { tradeShowId, itemNumbers }
  );
  return response.data;
};

// List class of trade options (for customer filter in Select Retailers step)
export const getListOfClassOfTrade = async () => {
  const response = await axiosInstance.get("/list/listOfClassOfTrade");
  return response.data;
};

// List customers for Select Retailers step (trade show) — POST with cot, search, pagination
export const getCustomerListForTradeShow = async (params: {
  cot?: string[];
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await axiosInstance.post(
    "/distrubutor/customer-list-for-trade-show",
    {
      cot: params.cot ?? [],
      search: params.search ?? "",
      page: params.page ?? 1,
      limit: params.limit ?? 100,
    }
  );
  return response.data;
};

// Bulk-assign retailers to a tradeshow
export interface TradeShowRetailerPayload {
  id: number;
  name: string;
}

export const bulkAssignRetailersToTradeShow = async (
  tradeShowId: number | string,
  retailerIds: TradeShowRetailerPayload[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/trade-show-retailers/bulk",
    { tradeShowId, retailerIds }
  );
  return response.data;
};

// Delete a trade show retailer
export const deleteTradeShowRetailer = async (id: number | string) => {
  const response = await axiosInstance.delete(
    `/distrubutor/trade-show-retailers/${id}`
  );
  return response.data;
};

// Bulk-remove trade show retailers (e.g. when user goes back to Retailers step and removes some)
export const deleteBulkTradeShowRetailers = async (
  tradeShowId: number | string,
  retailerIds: number[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/deleteBulkTradeShowRetailers",
    { tradeShowId, retailerIds }
  );
  return response.data;
};

// Get remaining items for delivery (to assign to weeks) with pagination — POST
export const getRemainItemInDelivery = async (
  tradeShowId: number | string,
  params?: {
    page?: number;
    limit?: number;
    salesCategory?: number[];
    priceClass?: number[];
  }
) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const payload: Record<string, unknown> = { tradeShowId, page, limit };
  if (params?.salesCategory?.length) payload.salesCategory = params.salesCategory;
  if (params?.priceClass?.length) payload.priceClass = params.priceClass;
  const response = await axiosInstance.post(
    "/distrubutor/remain-item-in-delivery",
    payload
  );
  return response.data;
};

// Get inventory per trade week (for Add Products in Delivery Schedule)
export const getInventoryAsPerTradeWeek = async (params: {
  tradeId: number | string;
  weekNumber: number;
  page?: number;
  limit?: number;
  // search?: string;
}) => {
  const q = new URLSearchParams();
  q.set("tradeId", String(params.tradeId));
  q.set("weekNumber", String(params.weekNumber));
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  // if (params.search != null) q.set("search", String(params.search));
  const response = await axiosInstance.get(
    `/distrubutor/getInventoryAsPerTradeWeek?${q.toString()}`
  );
  return response.data;
};

// Bulk-assign delivery products to weeks (Save & Close in Delivery Schedule)
export interface TradeShowDeliveryItem {
  itemNumber: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  deliveryType: string;
}

export const bulkAssignTradeShowDeliveryProducts = async (
  tradeShowId: number | string,
  deliveries: TradeShowDeliveryItem[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/trade-show-delivery-products/bulk",
    { tradeShowId, deliveries }
  );
  return response.data;
};

// Delete a trade show delivery product
export const deleteTradeShowDeliveryProduct = async (id: number | string) => {
  const response = await axiosInstance.delete(
    `/distrubutor/trade-show-delivery-products/${id}`
  );
  return response.data;
};

// Bulk-remove trade show delivery products (e.g. when user goes back to Delivery step and removes some)
export const deleteBulkTradeShowDeliveryProducts = async (
  tradeShowId: number | string,
  itemNumbers: string[]
) => {
  const response = await axiosInstance.post(
    "/distrubutor/deleteBulkTradeShowDeliveryProducts",
    { tradeShowId, itemNumbers }
  );
  return response.data;
};

// Get trade show summary (products, vendors, retailers, trade show, week counts) — no pagination; show first page only
export const getTradeShowSummary = async (
  tradeShowId: number | string,
  params?: { page?: number; limit?: number }
) => {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const query = q.toString();
  const response = await axiosInstance.get(
    `/distrubutor/getTradeShowSummary/${tradeShowId}${query ? `?${query}` : ""}`
  );
  return response.data;
};

// List trade show items (for View All products in Summary) — query: tradeShowId, itemNumber (search), disType (filter)
export const getTradeShowItems = async (params: {
  tradeShowId: number | string;
  itemNumber?: string;
  disType?: "PERCENT" | "FLAT";
  page?: number;
  limit?: number;
}) => {
  const q = new URLSearchParams();
  q.set("tradeShowId", String(params.tradeShowId));
  if (params.itemNumber != null && params.itemNumber !== "") q.set("itemNumber", params.itemNumber);
  if (params.disType != null) q.set("disType", params.disType);
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  const response = await axiosInstance.get(
    `/distrubutor/trade-show-items?${q.toString()}`
  );
  return response.data;
};

// List trade show retailers (for View All retailers in Summary) — pagination: page, limit
export const getTradeShowRetailers = async (params: {
  tradeShowId: number | string;
  retailerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const q = new URLSearchParams();
  q.set("tradeShowId", String(params.tradeShowId));
  if (params.retailerId != null) q.set("retailerId", String(params.retailerId));
  if (params.search != null && params.search !== "") q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  const response = await axiosInstance.get(
    `/distrubutor/trade-show-retailers?${q.toString()}`
  );
  return response.data;
};

// List trade show vendors (for View All vendors in Summary) — pagination: page, limit
export const getTradeShowVendors = async (params: {
  tradeShowId: number | string;
  vendorId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const q = new URLSearchParams();
  q.set("tradeShowId", String(params.tradeShowId));
  if (params.vendorId != null) q.set("vendorId", String(params.vendorId));
  if (params.search != null && params.search !== "") q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  const response = await axiosInstance.get(
    `/distrubutor/trade-show-vendors?${q.toString()}`
  );
  return response.data;
};
