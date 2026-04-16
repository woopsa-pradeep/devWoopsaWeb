import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Mirrors AutoRouteOrderRow from CreateRouteAutomatically — kept serializable for persist */
export interface RouteOptimizationOrderRow {
  id: string;
  srNo: number;
  accountNumber: string;
  customerName: string;
  customerAddress: string;
  route: string;
  stop: number;
  deliveryDay: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalBalance: number;
  futureDelivery: boolean;
  hasCustomerLocation: boolean;
  customerNumber?: number;
  customerForLocation?: {
    C_Number: number;
    C_Name?: string;
    C_Address?: string;
    C_City?: string;
    C_State?: string;
    C_Zip?: string;
    C_Phone?: string;
    C_PhoneMobile?: string;
  } | null;
  /** From order API `customerLocation` — used for map / getDeliverRouteByGoogleMap */
  customerLat?: number | null;
  customerLng?: number | null;
  /** From `Invoice_Total` — sent as `invoiceAmount` on create route stops */
  invoiceAmount?: number | null;
  /** Until API returns URLs, use `STATIC_ROUTE_ORDER_INVOICE_URL` from driverManagementApis */
  invoiceUrl?: string | null;
  /** Order_Type from API — 6 means return order */
  orderType?: number | null;
}

/** Persisted result from POST getDeliverRouteByGoogleMap — survives page refresh */
export interface GoogleMapRoutePersist {
  polyline: string;
  totalDistanceKm: number;
  lastStopToDestinationKm: number;
  totalDistanceMiles?: number;
  lastStopToDestinationMiles?: number;
}

export interface GoogleMapStopPersist {
  stopSequence: number;
  C_Number: number;
  orderNumbers: number;
  lat: number;
  lng: number;
  distanceKm: number;
  cumulativeDistanceKm: number;
  /** From API — display miles in UI */
  distanceMiles?: number;
  cumulativeDistanceMiles?: number;
}

/** Serialized vehicle row when user assigns — used for UI even if list API ids differ or list refetches. */
export interface AssignedVehicleSnapshot {
  id: string;
  label: string;
  description?: string;
  vinNumber?: string;
  loadCapacityLbs?: number;
  mileageHours?: string | number;
}

export interface DriverVehicleAssignment {
  driverId: string;
  driverName: string;
  truckId: string;
  truckLabel: string;
  split?: number;
  /** Populated when user picks a vehicle; keeps full specs for expanded driver card. */
  vehicleDetail?: AssignedVehicleSnapshot | null;
}

export interface MultiDriverPreviewRoute {
  driverId: number;
  truckId: number;
  day: string;
  totalStops: number;
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
    cumulativeKm: number;
    etaMinutes: number;
    isLastStop: boolean;
    invoiceUrl?: string | null;
    invoiceAmount?: number | null;
  }>;
}

export interface RouteOptimizationState {
  /** Full rows for orders checked on Create Route Automatically (persists across pagination). */
  draftSelectedOrdersById: Record<string, RouteOptimizationOrderRow>;
  selectedOrders: RouteOptimizationOrderRow[];
  selectedDriverId: string | null;
  selectedDriverName: string | null;
  selectedVehicleId: string | null;
  selectedVehicleLabel: string | null;
  /** Last fetched Google map route + stops (redux-persist). */
  googleMapRoute: GoogleMapRoutePersist | null;
  googleMapOptimizedStops: GoogleMapStopPersist[];
  /** Must match current orders+driver+vehicle fingerprint or stored map is ignored/cleared. */
  googleMapSnapshotKey: string | null;
  driverVehicleAssignmentsById: Record<string, DriverVehicleAssignment>;
  multiPreviewRoutes: MultiDriverPreviewRoute[];
  multiPreviewSnapshotKey: string | null;
  /** Last successful preview API result; shown again when `semanticPreviewKey` matches (e.g. user reverts split). */
  lastFetchedMultiPreview: { snapshotKey: string; routes: MultiDriverPreviewRoute[] } | null;
  activeMapViewDriverId: string | "master";
  manualSelectedDriverId: string | null;
  manualSelectedVehicleId: string | null;
  manualStops: Array<{
    stopSequence: number;
    orderNumber: number;
    C_Number: number;
    lat: number;
    lng: number;
    invoiceUrl?: string | null;
    invoiceAmount?: number | null;
  }>;
}

const initialState: RouteOptimizationState = {
  draftSelectedOrdersById: {},
  selectedOrders: [],
  selectedDriverId: null,
  selectedDriverName: null,
  selectedVehicleId: null,
  selectedVehicleLabel: null,
  googleMapRoute: null,
  googleMapOptimizedStops: [],
  googleMapSnapshotKey: null,
  driverVehicleAssignmentsById: {},
  multiPreviewRoutes: [],
  multiPreviewSnapshotKey: null,
  lastFetchedMultiPreview: null,
  activeMapViewDriverId: "master",
  manualSelectedDriverId: null,
  manualSelectedVehicleId: null,
  manualStops: [],
};

const routeOptimizationSlice = createSlice({
  name: "routeOptimization",
  initialState,
  reducers: {
    setDraftSelectedOrdersById: (state, action: PayloadAction<Record<string, RouteOptimizationOrderRow>>) => {
      state.draftSelectedOrdersById = action.payload ?? {};
    },
    /** Refresh stored rows when a page loads (e.g. updated location flags) without dropping other pages' selections. */
    mergeDraftSelectedOrdersFromRows: (state, action: PayloadAction<RouteOptimizationOrderRow[]>) => {
      const rows = action.payload ?? [];
      for (const row of rows) {
        if (state.draftSelectedOrdersById[row.id]) {
          state.draftSelectedOrdersById[row.id] = row;
        }
      }
    },
    setRouteOptimizationOrders: (state, action: PayloadAction<RouteOptimizationOrderRow[]>) => {
      const rows = action.payload ?? [];
      const prev = state.selectedOrders;

      /** Same order IDs as last session → keep driver/vehicle picks when user returns from driver step to orders and clicks Optimize again. */
      const sameOrderIdSet = (() => {
        if (prev.length !== rows.length) return false;
        const a = [...prev].map((r) => r.id).sort();
        const b = [...rows].map((r) => r.id).sort();
        return a.length === b.length && a.every((id, i) => id === b[i]);
      })();

      state.selectedOrders = rows;
      /** Keep draft selections in sync so Create Route tables still show checkboxes after Back from driver/vehicle or optimize screens. */
      const draft: Record<string, RouteOptimizationOrderRow> = {};
      for (const r of rows) {
        draft[r.id] = r;
      }
      state.draftSelectedOrdersById = draft;

      if (!sameOrderIdSet) {
        state.googleMapRoute = null;
        state.googleMapOptimizedStops = [];
        state.googleMapSnapshotKey = null;
        state.multiPreviewRoutes = [];
        state.multiPreviewSnapshotKey = null;
        state.lastFetchedMultiPreview = null;
        state.activeMapViewDriverId = "master";
        state.driverVehicleAssignmentsById = {};
        state.manualSelectedDriverId = null;
        state.manualSelectedVehicleId = null;
        state.manualStops = [];
      }
      /** Same orders as before: keep map preview, polylines, driver/vehicle, splits — back/optimize without changes. */
    },
    setGoogleMapResult: (
      state,
      action: PayloadAction<{
        route: GoogleMapRoutePersist;
        optimizedStops: GoogleMapStopPersist[];
        snapshotKey: string;
      }>
    ) => {
      state.googleMapRoute = action.payload.route;
      state.googleMapOptimizedStops = action.payload.optimizedStops ?? [];
      state.googleMapSnapshotKey = action.payload.snapshotKey;
    },
    clearGoogleMapResult: (state) => {
      state.googleMapRoute = null;
      state.googleMapOptimizedStops = [];
      state.googleMapSnapshotKey = null;
    },
    upsertDriverVehicleAssignment: (
      state,
      action: PayloadAction<{
        driverId: string;
        driverName: string;
        truckId: string;
        truckLabel: string;
        vehicleDetail?: AssignedVehicleSnapshot | null;
      }>
    ) => {
      const { driverName, truckId, truckLabel, vehicleDetail } = action.payload;
      const driverId = String(action.payload.driverId);
      const prev = state.driverVehicleAssignmentsById[driverId];
      state.driverVehicleAssignmentsById[driverId] = {
        driverId,
        driverName,
        truckId,
        truckLabel,
        split: prev?.split,
        vehicleDetail: vehicleDetail !== undefined ? vehicleDetail : prev?.vehicleDetail,
      };
    },
    setDriverSplit: (
      state,
      action: PayloadAction<{ driverId: string; split: number | undefined }>
    ) => {
      const id = String(action.payload.driverId);
      let curr = state.driverVehicleAssignmentsById[id];
      if (!curr) {
        const key = Object.keys(state.driverVehicleAssignmentsById).find((k) => String(k) === id);
        if (!key) return;
        curr = state.driverVehicleAssignmentsById[key];
      }
      curr.split = action.payload.split;
    },
    removeDriverVehicleAssignment: (state, action: PayloadAction<string>) => {
      const id = String(action.payload);
      if (state.driverVehicleAssignmentsById[id]) {
        delete state.driverVehicleAssignmentsById[id];
        return;
      }
      const key = Object.keys(state.driverVehicleAssignmentsById).find((k) => String(k) === id);
      if (key) delete state.driverVehicleAssignmentsById[key];
    },
    clearDriverVehicleAssignments: (state) => {
      state.driverVehicleAssignmentsById = {};
    },
    setMultiPreviewRoutes: (
      state,
      action: PayloadAction<{
        routes: MultiDriverPreviewRoute[];
        snapshotKey: string;
      }>
    ) => {
      const routes = action.payload.routes ?? [];
      const snapshotKey = action.payload.snapshotKey;
      state.multiPreviewRoutes = routes;
      state.multiPreviewSnapshotKey = snapshotKey;
      state.lastFetchedMultiPreview = { snapshotKey, routes };
      state.activeMapViewDriverId = "master";
    },
    clearMultiPreviewRoutes: (state) => {
      state.multiPreviewRoutes = [];
      state.multiPreviewSnapshotKey = null;
      state.lastFetchedMultiPreview = null;
      state.activeMapViewDriverId = "master";
    },
    setActiveMapViewDriverId: (state, action: PayloadAction<string | "master">) => {
      state.activeMapViewDriverId = action.payload;
    },
    setManualSelectedDriverId: (state, action: PayloadAction<string | null>) => {
      state.manualSelectedDriverId = action.payload;
    },
    setManualSelectedVehicleId: (state, action: PayloadAction<string | null>) => {
      state.manualSelectedVehicleId = action.payload;
    },
    setManualStops: (
      state,
      action: PayloadAction<
        Array<{
          stopSequence: number;
          orderNumber: number;
          C_Number: number;
          lat: number;
          lng: number;
          invoiceUrl?: string | null;
          invoiceAmount?: number | null;
        }>
      >
    ) => {
      state.manualStops = action.payload ?? [];
    },
    clearManualRouteDraft: (state) => {
      state.manualSelectedDriverId = null;
      state.manualSelectedVehicleId = null;
      state.manualStops = [];
    },
    setRouteOptimizationDriver: (
      state,
      action: PayloadAction<{ id: string; name: string } | null>
    ) => {
      if (!action.payload) {
        state.selectedDriverId = null;
        state.selectedDriverName = null;
        state.selectedVehicleId = null;
        state.selectedVehicleLabel = null;
        return;
      }
      state.selectedDriverId = action.payload.id;
      state.selectedDriverName = action.payload.name;
      state.selectedVehicleId = null;
      state.selectedVehicleLabel = null;
    },
    setRouteOptimizationVehicle: (
      state,
      action: PayloadAction<{ id: string; label: string } | null>
    ) => {
      if (!action.payload) {
        state.selectedVehicleId = null;
        state.selectedVehicleLabel = null;
        return;
      }
      state.selectedVehicleId = action.payload.id;
      state.selectedVehicleLabel = action.payload.label;
    },
    clearRouteOptimizationSession: (state) => {
      state.draftSelectedOrdersById = {};
      state.selectedOrders = [];
      state.selectedDriverId = null;
      state.selectedDriverName = null;
      state.selectedVehicleId = null;
      state.selectedVehicleLabel = null;
      state.googleMapRoute = null;
      state.googleMapOptimizedStops = [];
      state.googleMapSnapshotKey = null;
      state.driverVehicleAssignmentsById = {};
      state.multiPreviewRoutes = [];
      state.multiPreviewSnapshotKey = null;
      state.lastFetchedMultiPreview = null;
      state.activeMapViewDriverId = "master";
      state.manualSelectedDriverId = null;
      state.manualSelectedVehicleId = null;
      state.manualStops = [];
    },
  },
});

export const {
  setDraftSelectedOrdersById,
  mergeDraftSelectedOrdersFromRows,
  setRouteOptimizationOrders,
  setGoogleMapResult,
  clearGoogleMapResult,
  upsertDriverVehicleAssignment,
  setDriverSplit,
  removeDriverVehicleAssignment,
  clearDriverVehicleAssignments,
  setMultiPreviewRoutes,
  clearMultiPreviewRoutes,
  setActiveMapViewDriverId,
  setManualSelectedDriverId,
  setManualSelectedVehicleId,
  setManualStops,
  clearManualRouteDraft,
  setRouteOptimizationDriver,
  setRouteOptimizationVehicle,
  clearRouteOptimizationSession,
} = routeOptimizationSlice.actions;

export default routeOptimizationSlice.reducer;
