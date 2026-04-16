import axiosInstance from "../../../config/axios";

// Drivers
export const getDrivers = async (params?: { page?: number; limit?: number }) => {
  return axiosInstance.get("/distrubutor/drivers", { params });
};

export const createDriver = async (data: any) => {
  return axiosInstance.post("/distrubutor/drivers", data);
};

export const updateDriver = async (id: number | string, data: any) => {
  return axiosInstance.put(`/distrubutor/drivers/${id}`, data);
};

// Vehicles
export const getVehicles = async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
  return axiosInstance.get("/distrubutor/vehicles", { params });
};

export const createVehicle = async (data: any) => {
  return axiosInstance.post("/distrubutor/vehicles", data);
};

export const updateVehicle = async (id: number | string, data: any) => {
  return axiosInstance.put(`/distrubutor/vehicles/${id}`, data);
};

// Delivery start/end settings
export const getSettingDeliveryAddress = async () => {
  return axiosInstance.get("/distrubutor/setting-delivery-address");
};

export const updateDistributorSetting = async (data: any) => {
  return axiosInstance.put("/distrubutor/setting", data);
};

// Orders (for driver route creation)
export const getAllOrderForDriver = async (params?: { page?: number; limit?: number; routeNumber?: string; orderType?: string }) => {
  return axiosInstance.get("/distrubutor/getAllOrderForDriver", { params });
};

/** Placeholder until `getAllOrderForDriver` returns per-order `invoiceUrl` (same key name for future API). */
export const STATIC_ROUTE_ORDER_INVOICE_URL = "https://s3.amazonaws.com/invoices/139165.pdf";

export type CreateRetailerLocationPayload = {
  C_Number: number;
  lat?: number | null;
  long?: number | null;
  City?: string | null;
  Country?: string | null;
  Address?: string | null;
  State?: string | null;
  Zip?: string | null;
};

export const createRetailerLocation = async (data: CreateRetailerLocationPayload) => {
  return axiosInstance.post("/distrubutor/retailer-location", data);
};

export type DeliverRouteGoogleMapStopPayload = {
  stopSequence: number;
  C_Number: number;
  lat: number;
  lng: number;
  orderNumbers: number;
};

/**
 * `origin` / `destination` must match GET `/distrubutor/setting-delivery-address`:
 * - `origin` = **start** point (`deliveryStartLat` / `deliveryStartLong`)
 * - `destination` = **end** point (`deliveryEndLat` / `deliveryEndLong`)
 */
export type DeliverRouteGoogleMapPayload = {
  routeNumber: string;
  day: string;
  driverId: number;
  truckId: number;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  stops: DeliverRouteGoogleMapStopPayload[];
};

export const getDeliverRouteByGoogleMap = async (payload: DeliverRouteGoogleMapPayload) => {
  return axiosInstance.post("/distrubutor/getDeliverRouteByGoogleMap", payload);
};

export type PreviewMultiDriverRoutesPayload = {
  day: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  drivers: Array<{ driverId: number; truckId: number; split: number }>;
  orders: Array<{ orderNumber: number; C_Number: number; lat: number; lng: number }>;
};

export const previewMultiDriverRoutes = async (payload: PreviewMultiDriverRoutesPayload) => {
  return axiosInstance.post("/driver/previewMultiDriverRoutes", payload);
};

export type CreateMultiDriverRoutesPayload = {
  day: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  previewedRoutes: Array<{
    driverId: number;
    truckId: number;
    totalKilometers: number;
    totalMiles: number;
    totalDurationInMinutes: number;
    polyline: string;
    stops: Array<{
      stopSequence: number;
      orderNumber: number;
      C_Number: number;
      latitude: number;
      longitude: number;
      startLatitude: number;
      startLongitude: number;
      endLatitude: number;
      endLongitude: number;
      distanceKm: number;
      isLastStop: boolean;
      invoiceUrl: string | null;
      invoiceAmount: number | null;
      type: "regular" | "return";
    }>;
  }>;
};

export const createMultiDriverRoutes = async (payload: CreateMultiDriverRoutesPayload) => {
  return axiosInstance.post("/driver/createMultiDriverRoutes", payload);
};

export type CreateManualRoutePayload = {
  day: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  driverId: number;
  truckId: number;
  orders: Array<{
    stopSequence: number;
    orderNumber: number;
    C_Number: number;
    lat: number;
    lng: number;
    invoiceUrl: string | null;
    invoiceAmount: number | null;
    type: "regular" | "return";
  }>;
};

export const createManualRoute = async (payload: CreateManualRoutePayload) => {
  return axiosInstance.post("/distrubutor/create-manual-route", payload);
};

/** Cancelled route stops (GET `/distrubutor/cancelled-stops`) */
export const getCancelledStops = async (params?: { page?: number; limit?: number }) => {
  return axiosInstance.get("/distrubutor/cancelled-stops", { params });
};

export type CancelStopPayload = {
  allowReDeliver: boolean;
  orderNumber: number;
};

/** POST `/distrubutor/cancel-stop/:stopId` */
export const postCancelStop = async (stopId: number | string, payload: CancelStopPayload) => {
  return axiosInstance.put(`/distrubutor/cancel-stop/${stopId}`, payload);
};

