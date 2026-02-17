import axiosInstance from "../../../config/axios";

export interface GetTradeShowItemsParams {
  page: number;
  limit: number;
  search?: string;
  masterSearch?: string;
  salesCategoryId?: string[];
  priceClassId?: string[];
  salesCategory?: number[];
  state?: string;
  tradeShowId: number;
}

/** GET /api/retailer/tradeShow - get current trade show (returns tradeShowId) */
export const getRetailerTradeShow = async () => {
  const response = await axiosInstance.get("/retailer/tradeShow");
  return response.data;
};

/** POST /api/retailer/getTradeShowItems - get trade show product list */
export const getTradeShowItems = async (payload: GetTradeShowItemsParams) => {
  const response = await axiosInstance.post("/retailer/getTradeShowItems", payload);
  return response.data;
};

/** POST /api/retailer/tradeshow/add - add item to trade show cart */
export const addToTradeShowCart = async (params: any) => {
  const response = await axiosInstance.post("/retailer/tradeshow/add", params);
  return response.data;
};

/** GET /api/retailer/tradeShow/items/:tradeshowId - get trade show cart items */
export const getTradeShowCartItems = async (tradeShowId: string | number) => {
  const response = await axiosInstance.get(`/retailer/tradeShow/items/${tradeShowId}`);
  return response.data;
};

/** PUT /api/retailer/tradeshow/items/:id - update trade show cart item */
export const updateTradeShowCartItem = async (id: string | number, params: any) => {
  const response = await axiosInstance.put(`/retailer/tradeshow/items/${id}`, params);
  return response.data;
};

/** DELETE /api/retailer/tradeshow/items/:id - remove trade show cart item */
export const removeTradeShowCartItem = async (id: string | number) => {
  const response = await axiosInstance.delete(`/retailer/tradeshow/items/${id}`);
  return response.data;
};

/** DELETE /api/retailer/tradeshow/clear - clear trade show cart */
export const clearTradeShowCart = async () => {
  const response = await axiosInstance.delete("/retailer/tradeshow/clear");
  return response.data;
};

/** POST /api/retailer/placeTradeShowOrder - place trade show order (payload same as placeOrder) */
export const placeTradeShowOrder = async (params: any) => {
  const response = await axiosInstance.post("/retailer/placeTradeShowOrder", params, {
    headers: { "is-web-order": "true" },
  });
  return response.data;
};
