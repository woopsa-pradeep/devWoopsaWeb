import axiosInstance from "../../../config/axios";

export interface GetSalesTradeShowItemsParams {
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

const customerHeader = (customerId: string) => ({ headers: { customer: customerId } });

/** GET /api/sales/getTradeShow - get current trade show (call when entering tab) */
export const getSalesTradeShow = async () => {
  const response = await axiosInstance.get("/sales/getTradeShow");
  return response.data;
};

/** POST /api/sales/getTradeShowItems/:customerId - get trade show product list for customer */
export const getSalesTradeShowItems = async (customerId: string, payload: GetSalesTradeShowItemsParams) => {
  const response = await axiosInstance.post(`/sales/getTradeShowItems/${customerId}`, payload, customerHeader(customerId));
  return response.data;
};

/** POST /api/sales/addToTradeShowCart/:customerId - add item to trade show cart */
export const addToSalesTradeShowCart = async (customerId: string, params: any) => {
  const response = await axiosInstance.post(`/sales/addToTradeShowCart/${customerId}`, params, customerHeader(customerId));
  return response.data;
};

/** GET /api/sales/getTradeShowCartItems/:customerId?tradeShowId=:tradeShowId - get trade show cart items */
export const getSalesTradeShowCartItems = async (customerId: string, tradeShowId: string | number) => {
  const url = `/sales/getTradeShowCartItems/${customerId}?tradeShowId=${tradeShowId}`;
  const response = await axiosInstance.get(url, customerHeader(customerId));
  return response.data;
};

/** PUT /api/sales/updateTradeShowCartItem/:cartItemId - update trade show cart item (customer in header) */
export const updateSalesTradeShowCartItem = async (cartItemId: string | number, customerId: string, params: any) => {
  const response = await axiosInstance.put(`/sales/updateTradeShowCartItem/${cartItemId}`, params, customerHeader(customerId));
  return response.data;
};

/** DELETE /api/sales/removeFromTradeShowCart/:cartItemId - remove item from trade show cart */
export const removeFromSalesTradeShowCart = async (cartItemId: string | number, customerId: string) => {
  const response = await axiosInstance.delete(`/sales/removeFromTradeShowCart/${cartItemId}`, customerHeader(customerId));
  return response.data;
};

/** DELETE /api/sales/clearTradeShowCart/:customerId - clear trade show cart */
export const clearSalesTradeShowCart = async (customerId: string) => {
  const response = await axiosInstance.delete(`/sales/clearTradeShowCart/${customerId}`, customerHeader(customerId));
  return response.data;
};

/** POST /api/sales/placeTradeShowOrder/:customerId - place trade show order */
export const placeSalesTradeShowOrder = async (customerId: string, params: any) => {
  const response = await axiosInstance.post(`/sales/placeTradeShowOrder/${customerId}`, params, {
    headers: { customer: customerId, "is-web-order": "true" },
  });
  return response.data;
};
