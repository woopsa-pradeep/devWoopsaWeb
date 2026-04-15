import axiosInstance from "../../../config/axios";

export interface RouteViewDriver {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  currentLatitude?: string | null;
  currentLongitude?: string | null;
}

export interface RouteViewVehicle {
  id: number;
  description: string;
  vinNumber: string;
}

export interface CreatedRouteChildSummary {
  id: number;
  routeNumber: string;
  routeGroupId: number;
  day: string;
  driverId: number;
  truckId: number;
  orderStartLat: string;
  orderStartLong: string;
  orderEndLat: string;
  orderEndLong: string;
  routeStatus: string;
  totalStops: number;
  totalKilometers: string;
  completedStops: number;
  isActive: boolean;
  totalMiles: string;
  totalDurationInMinutes: number;
  polyline?: string;
  driver: RouteViewDriver;
  vehicle: RouteViewVehicle;
}

export interface CreatedRouteGroup {
  id: number;
  groupNumber: string;
  day: string;
  totalOrders: number;
  totalRoutes: number;
  totalStops: number;
  totalKilometers: string;
  totalMiles: string;
  originLat: string;
  originLng: string;
  destinationLat: string;
  destinationLng: string;
  status: string;
  isActive: boolean;
  childRoutes: CreatedRouteChildSummary[];
}

export interface RouteFullStop {
  id: number;
  day: string;
  routeName: string;
  notes: string;
  orderNumber: number;
  totalKilometers: string;
  routeId: number;
  stopSequence: number;
  C_Number: number;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
  latitude: string;
  longitude: string;
  isLastStop: boolean;
  status: string;
  arrivedAt: string | null;
  deliveredAt: string | null;
  isActive: boolean;
  /** Encoded polyline of the driver's actual traveled GPS path to reach this stop (nullable until tracked). */
  polyline?: string | null;
  C_Name: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_Phone: string | null;
}

export interface RouteFullChild extends CreatedRouteChildSummary {
  stops: RouteFullStop[];
}

export interface RouteFullGroup extends Omit<CreatedRouteGroup, "childRoutes"> {
  childRoutes: RouteFullChild[];
}

/** Stop-level delivery status values from API */
export const StopStatus = {
  NOT_DELIVERED: "not_delivered",
  DELIVERED: "delivered",
  SKIPPED: "skipped",
  FAILED: "failed",
  RETURNED: "returned",
  IN_PROGRESS: "in_progress",
  CANCELLED: "cancelled",
} as const;

export type StopStatusValue = (typeof StopStatus)[keyof typeof StopStatus];

export function normalizeStopStatus(status: string | null | undefined): string {
  return String(status ?? "").trim().toLowerCase();
}

/** Human-readable label for chips, lists, map popups */
export function stopStatusDisplayLabel(status: string | null | undefined): string {
  const k = normalizeStopStatus(status);
  const labels: Record<string, string> = {
    [StopStatus.NOT_DELIVERED]: "Not delivered",
    [StopStatus.DELIVERED]: "Delivered",
    [StopStatus.SKIPPED]: "Skipped",
    [StopStatus.FAILED]: "Failed",
    [StopStatus.RETURNED]: "Returned",
    [StopStatus.IN_PROGRESS]: "In progress",
    [StopStatus.CANCELLED]: "Cancelled",
  };
  if (labels[k]) return labels[k];
  const raw = String(status ?? "").trim();
  return raw ? raw.replace(/_/g, " ") : "—";
}

export function isStopStatusDelivered(
  status: string | null | undefined,
  deliveredAt: string | null | undefined
): boolean {
  if (deliveredAt != null && String(deliveredAt).trim() !== "") return true;
  return normalizeStopStatus(status) === StopStatus.DELIVERED;
}

/**
 * Stop is “past” for route line coloring: delivered, cancelled, skipped, failed, returned —
 * not still pending (not_delivered / in_progress).
 */
export function isStopResolvedForRouteLine(
  status: string | null | undefined,
  deliveredAt: string | null | undefined
): boolean {
  if (isStopStatusDelivered(status, deliveredAt)) return true;
  const k = normalizeStopStatus(status);
  return (
    k === StopStatus.CANCELLED ||
    k === StopStatus.SKIPPED ||
    k === StopStatus.FAILED ||
    k === StopStatus.RETURNED
  );
}

/** Stops list / chips — explicit brand colors */
export const STOP_STATUS_COLOR_SIDEBAR: Record<string, string> = {
  [StopStatus.NOT_DELIVERED]: "#9CA3AF",
  [StopStatus.DELIVERED]: "#22C55E",
  [StopStatus.SKIPPED]: "#F59E0B",
  [StopStatus.FAILED]: "#EF4444",
  [StopStatus.RETURNED]: "#8B5CF6",
  [StopStatus.IN_PROGRESS]: "#3B82F6",
  [StopStatus.CANCELLED]: "#EF4444",
};

/** Map pins — pending = orange; delivered = gray; terminal outcomes match sidebar accents */
export const STOP_STATUS_COLOR_MAP: Record<string, string> = {
  [StopStatus.NOT_DELIVERED]: "#f97316",
  [StopStatus.DELIVERED]: "#9CA3AF",
  [StopStatus.SKIPPED]: "#F59E0B",
  [StopStatus.FAILED]: "#EF4444",
  [StopStatus.RETURNED]: "#8B5CF6",
  [StopStatus.IN_PROGRESS]: "#3B82F6",
  [StopStatus.CANCELLED]: "#EF4444",
};

function stopStatusPaletteKey(
  status: string | null | undefined,
  deliveredAt: string | null | undefined
): string {
  if (isStopStatusDelivered(status, deliveredAt)) return StopStatus.DELIVERED;
  const k = normalizeStopStatus(status);
  if (k && k in STOP_STATUS_COLOR_SIDEBAR) return k;
  return StopStatus.NOT_DELIVERED;
}

export function stopStatusSidebarHex(
  status: string | null | undefined,
  deliveredAt: string | null | undefined
): string {
  return STOP_STATUS_COLOR_SIDEBAR[stopStatusPaletteKey(status, deliveredAt)] ?? "#9CA3AF";
}

export function stopStatusMapHex(
  status: string | null | undefined,
  deliveredAt: string | null | undefined
): string {
  return STOP_STATUS_COLOR_MAP[stopStatusPaletteKey(status, deliveredAt)] ?? "#f97316";
}

function darkenHexColor(hex: string, factor: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return hex;
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Inline style fragment for Leaflet stop marker divs */
export function stopStatusMapMarkerBackgroundStyle(
  status: string | null | undefined,
  deliveredAt: string | null | undefined
): string {
  const base = stopStatusMapHex(status, deliveredAt);
  const darker = darkenHexColor(base, 0.88);
  return `background:linear-gradient(145deg,${base} 0%,${darker} 100%);`;
}

export type RouteViewApiEnvelope<T> = { success: boolean; message: string; data: T };

export const getCreatedRoutes = async (fromDate: string) => {
  return axiosInstance.get<RouteViewApiEnvelope<CreatedRouteGroup[]>>("/distrubutor/created-routes", {
    params: { fromDate },
  });
};

export const getRouteFullStops = async (routeGroupId: number) => {
  return axiosInstance.get<RouteViewApiEnvelope<RouteFullGroup>>(`/distrubutor/route-full-stops/${routeGroupId}`);
};

/** GET `/distrubutor/drivers/:id/lat-long` — live GPS (polled from the route day view). */
export type DriverLatLongPayload = {
  driverId?: number;
  latitude?: string | number | null;
  longitude?: string | number | null;
  lat?: string | number | null;
  lng?: string | number | null;
  /** API returns numbers (e.g. `23.6039467`) */
  currentLatitude?: string | number | null;
  currentLongitude?: string | number | null;
  updatedAt?: string;
  source?: string;
};

export function parseDriverLatLongPayload(raw: unknown): { lat: number; lng: number } | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as DriverLatLongPayload;
  const latRaw = o.latitude ?? o.lat ?? o.currentLatitude;
  const lngRaw = o.longitude ?? o.lng ?? o.currentLongitude;
  if (latRaw === undefined || latRaw === null || lngRaw === undefined || lngRaw === null) return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Axios response: `res.data` is `{ success, message, data }` or the inner payload only. */
export function coordsFromDriverLatLongApiResponse(res: { data: unknown }): { lat: number; lng: number } | null {
  const body = res.data;
  if (body == null || typeof body !== "object") return null;
  const d = body as Record<string, unknown>;
  if ("data" in d && d.data != null && typeof d.data === "object" && !Array.isArray(d.data)) {
    const inner = parseDriverLatLongPayload(d.data);
    if (inner) return inner;
  }
  return parseDriverLatLongPayload(body);
}

export const getDriverLatLong = async (driverId: number) => {
  return axiosInstance.get(`/distrubutor/drivers/${driverId}/lat-long`);
};

/** Optional order metadata on full-report / full-details stop (API may nest under `orderDetail`). */
export interface StopFullDetailsOrderDetail {
  Order_Number?: number;
  Invoice_Date?: string;
  Order_Date?: string;
  Order_Source?: number;
  /** Some payloads use camelCase */
  invoiceDate?: string;
  orderDate?: string;
}

/** Warehouse / checker photos for an order (e.g. full-report `epickOrderDetail`). */
export interface StopFullDetailsEpickOrderDetail {
  images?: string[];
  orderNumber?: number;
}

/** `/distrubutor/stop/:id/full-details` — delivered stop POD / customer payload */
export interface StopFullDetailsStop {
  id: number;
  day: string;
  routeName: string;
  notes: string;
  invoiceUrl: string | null;
  invoiceAmount: number;
  routeStarted: boolean;
  orderNumber: number;
  totalKilometers: string;
  routeId: number;
  stopSequence: number;
  cancelledReason: string | null;
  C_Number: number;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
  latitude: string;
  longitude: string;
  isLastStop: boolean;
  status: string;
  reSchedule: boolean;
  reScheduleDate: string | null;
  reScheduleTime: string | null;
  reScheduleReason: string | null;
  reScheduleNotes: string | null;
  reScheduleCreatedAt: string | null;
  reScheduleUpdatedAt: string | null;
  cancelledAt: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orderDetail?: StopFullDetailsOrderDetail | null;
  epickOrderDetail?: StopFullDetailsEpickOrderDetail | null;
}

/** Per full-report / customer payload: route + stop numbers for display (e.g. Route_Number / Stop_Number). */
export interface CustomerRouteStopLine {
  Route_Number?: number;
  Stop_Number?: number;
}

export interface StopFullDetailsCustomer {
  C_Name: string;
  email: string;
  phone: string;
  address: string;
  /** Street line from full-report; optional when API omits fields */
  city?: string;
  state?: string;
  zip: string;
  /** From full-report customer object: `[{ Route_Number, Stop_Number }]` */
  routes?: CustomerRouteStopLine[];
}

export interface StopFullDetailsPOD {
  id: number;
  amount: number;
  routeId: number;
  routeStopId: number;
  driverId: number;
  orderNumber: number;
  C_Number: number;
  boxBarCode: unknown[];
  scanBarCode: unknown[];
  invoiceUrl: string | null;
  invoiceAmount: number;
  invoiceMessage: string | null;
  paymentTermComplete: boolean;
  postDeliveryCompleted: boolean;
  scannedBundles: number;
  expectedBundles: number;
  allBundlesScanned: boolean;
  orderStatus: string;
  paymentTerms: string;
  paymentInCheck: boolean;
  checkNumber: string | null;
  checkImage: string | null;
  checkImage1: string | null;
  customerSignature: string | null;
  signBy: string | null;
  photos: string[];
  notes: string | null;
  podAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StopFullDetailsPayload {
  stop: StopFullDetailsStop;
  customer: StopFullDetailsCustomer;
  deliveryPODs: StopFullDetailsPOD[];
}

const ROUTE_STOP_EMPTY = "—";

/**
 * Customer route / stop from full-report `customer.routes[]` (`Route_Number`, `Stop_Number`).
 * Uses the line whose `Stop_Number` matches this stop's `stopSequence`, else the first line.
 * If `routes` is missing, empty, or a number is absent on the chosen line, show "—" only (no fallback to stop fields).
 */
export function getCustomerRouteStopDisplay(
  customer: StopFullDetailsCustomer,
  stop: StopFullDetailsStop
): { customerRoute: string; customerStop: string } {
  const lines = customer.routes;
  if (!lines?.length) {
    return { customerRoute: ROUTE_STOP_EMPTY, customerStop: ROUTE_STOP_EMPTY };
  }
  const seq = Number(stop.stopSequence);
  const match =
    lines.find((l) => l.Stop_Number != null && Number(l.Stop_Number) === seq) ?? lines[0];
  const rn = match?.Route_Number;
  const sn = match?.Stop_Number;
  return {
    customerRoute: rn != null ? String(rn) : ROUTE_STOP_EMPTY,
    customerStop: sn != null ? String(sn) : ROUTE_STOP_EMPTY,
  };
}

/** One stop: modal + single-stop PDF/CSV always use this (not full-report). */
export const getStopFullDetails = async (stopId: number) => {
  return axiosInstance.get<RouteViewApiEnvelope<StopFullDetailsPayload>>(`/distrubutor/stop/${stopId}/full-details`);
};

/** `GET /distrubutor/route/:routeId/full-report` — nested routes + stops with embedded customer + deliveryPODs */
export interface RouteFullReportCustomerApi {
  C_Name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  /** e.g. `[{ "Route_Number": 1000, "Stop_Number": 5 }]` */
  routes?: Array<Record<string, unknown>>;
}

export interface RouteFullReportApiData {
  requestedRouteId: number;
  routes: Array<{
    id: number;
    stops?: Array<Record<string, unknown>>;
  }>;
}

export const getRouteFullReport = async (routeId: number) => {
  return axiosInstance.get<RouteViewApiEnvelope<RouteFullReportApiData | StopFullDetailsPayload[]>>(
    `/distrubutor/route/${routeId}/full-report`
  );
};

function parseCustomerRouteLines(
  routes: RouteFullReportCustomerApi["routes"] | undefined
): CustomerRouteStopLine[] | undefined {
  if (!Array.isArray(routes) || routes.length === 0) return undefined;
  const out: CustomerRouteStopLine[] = [];
  for (const item of routes) {
    const o = item as Record<string, unknown>;
    const rnRaw = o.Route_Number ?? o.route_number;
    const snRaw = o.Stop_Number ?? o.stop_number;
    const line: CustomerRouteStopLine = {};
    if (rnRaw != null && rnRaw !== "") {
      const n = Number(rnRaw);
      if (Number.isFinite(n)) line.Route_Number = n;
    }
    if (snRaw != null && snRaw !== "") {
      const n = Number(snRaw);
      if (Number.isFinite(n)) line.Stop_Number = n;
    }
    if (line.Route_Number != null || line.Stop_Number != null) out.push(line);
  }
  return out.length ? out : undefined;
}

function mapFullReportCustomer(api: RouteFullReportCustomerApi | undefined): StopFullDetailsCustomer {
  if (!api) {
    return { C_Name: "", email: "", phone: "", address: "", city: "", state: "", zip: "" };
  }
  return {
    C_Name: String(api.C_Name ?? ""),
    email: String(api.email ?? ""),
    phone: String(api.phone ?? "").trim() || " ",
    address: String(api.address ?? "").trim(),
    city: String(api.city ?? "").trim(),
    state: String(api.state ?? "").trim(),
    zip: String(api.zip ?? ""),
    routes: parseCustomerRouteLines(api.routes),
  };
}

function mapFullReportStopToPayload(raw: Record<string, unknown>): StopFullDetailsPayload | null {
  const { customer, deliveryPODs, ...stopRest } = raw as Record<string, unknown> & {
    customer?: RouteFullReportCustomerApi;
    deliveryPODs?: unknown;
  };
  return {
    stop: stopRest as unknown as StopFullDetailsStop,
    customer: mapFullReportCustomer(customer),
    deliveryPODs: Array.isArray(deliveryPODs) ? (deliveryPODs as StopFullDetailsPOD[]) : [],
  };
}

/** Turns full-report `data` into `StopFullDetailsPayload[]` (same shape as per-stop full-details). */
export function normalizeRouteFullReportData(data: unknown): StopFullDetailsPayload[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as StopFullDetailsPayload[];
  if (typeof data !== "object") return [];
  const d = data as RouteFullReportApiData & { stops?: StopFullDetailsPayload[] };
  if (Array.isArray(d.stops)) {
    return d.stops;
  }
  if (Array.isArray(d.routes) && d.routes.length > 0) {
    const wantId = d.requestedRouteId;
    const route =
      wantId != null ? d.routes.find((r) => r.id === wantId) ?? d.routes[0] : d.routes[0];
    const stops = route.stops ?? [];
    return stops
      .map((s) => mapFullReportStopToPayload(s as Record<string, unknown>))
      .filter((p): p is StopFullDetailsPayload => p != null);
  }
  return [];
}
