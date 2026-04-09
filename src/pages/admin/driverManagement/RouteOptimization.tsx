import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  TextField,
  Typography,
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { useNavigate } from "react-router-dom";
import RouteMap from "../../../component/molecules/RouteMap";
import {
  createMultiDriverRoutes,
  getSettingDeliveryAddress,
  previewMultiDriverRoutes,
  STATIC_ROUTE_ORDER_INVOICE_URL,
  type CreateMultiDriverRoutesPayload,
  type PreviewMultiDriverRoutesPayload,
} from "../../../redux/apis/distrubutor/driverManagementApis";
import { getListOfDrivers, getListOfVehicles } from "../../../redux/apis/distrubutor/listApis";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import {
  clearRouteOptimizationSession,
  removeDriverVehicleAssignment,
  setActiveMapViewDriverId,
  setDraftSelectedOrdersById,
  setDriverSplit,
  setMultiPreviewRoutes,
  upsertDriverVehicleAssignment,
  type AssignedVehicleSnapshot,
  type DriverVehicleAssignment,
  type MultiDriverPreviewRoute,
  type RouteOptimizationOrderRow,
} from "../../../redux/slices/routeOptimizationSlice";
import { showErrorToast, showSuccessToast } from "../../../utils/toastUtils";
import { openRouteManifestPdf } from "../../../utils/routeManifestPdf";
// import driverRouteIcon from "../../../assets/driverRoute.svg";

type DriverOption = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  driverPicture?: string | null;
  phoneNumber?: string | null;
};

type VehicleOption = {
  id: string;
  label: string;
  description?: string;
  vinNumber?: string;
  loadCapacityLbs?: number;
  mileageHours?: string | number;
};

function assignedVehicleSnapshotFromOption(v: VehicleOption): AssignedVehicleSnapshot {
  return {
    id: v.id,
    label: v.label,
    description: v.description,
    vinNumber: v.vinNumber,
    loadCapacityLbs: v.loadCapacityLbs,
    mileageHours: v.mileageHours,
  };
}

/** Prefer Redux-stored snapshot (set on assign); fallback to live list so old sessions still work. */
function resolveAssignedVehicleOption(assigned: DriverVehicleAssignment | undefined, vehicles: VehicleOption[]): VehicleOption | undefined {
  if (!assigned) return undefined;
  if (assigned.vehicleDetail) {
    const s = assigned.vehicleDetail;
    return {
      id: s.id,
      label: s.label,
      description: s.description,
      vinNumber: s.vinNumber,
      loadCapacityLbs: s.loadCapacityLbs,
      mileageHours: s.mileageHours,
    };
  }
  return vehicles.find((v) => String(v.id) === String(assigned.truckId));
}

function driverInitialLetter(d: DriverOption): string {
  const f = d.firstName?.trim();
  if (f && f.length > 0) return f.charAt(0).toUpperCase();
  const n = d.name?.trim();
  if (n && n.length > 0) return n.charAt(0).toUpperCase();
  return "?";
}

function DriverDetailCompact({ d, vehicle }: { d: DriverOption; vehicle?: VehicleOption | null }) {
  const displayName = [d.firstName, d.lastName].filter(Boolean).join(" ").trim() || d.name;
  return (
    <Box sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.45 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, lineHeight: 1.4 }}>
          <Box component="span" sx={{ color: "text.disabled", fontWeight: 600, mr: 0.5 }}>Name</Box>
          {displayName}
        </Typography>
        <Typography sx={{ fontSize: 11, lineHeight: 1.4, wordBreak: "break-word" }}>
          <Box component="span" sx={{ color: "text.disabled", fontWeight: 600, mr: 0.5 }}>Phone</Box>
          {d.phoneNumber || "—"}
        </Typography>
      </Box>
      {vehicle ? (
        <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "text.disabled", mb: 0.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>Assigned vehicle</Typography>
          <VehicleDetailCompact v={vehicle} nested />
        </Box>
      ) : (
        <Typography sx={{ mt: 0.75, fontSize: 11, color: "text.disabled", fontStyle: "italic" }}>No vehicle assigned yet.</Typography>
      )}
    </Box>
  );
}

function VehicleDetailCompact({ v, nested }: { v: VehicleOption; nested?: boolean }) {
  const load =
    v.loadCapacityLbs != null && Number.isFinite(Number(v.loadCapacityLbs)) ? String(v.loadCapacityLbs) : "—";
  const mileage = v.mileageHours != null && v.mileageHours !== "" ? String(v.mileageHours) : "—";
  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.35,
        fontSize: 11,
        color: "text.secondary",
        lineHeight: 1.45,
        ...(nested ? {} : { mt: 0.5, pt: 0.75, borderTop: "1px dashed", borderColor: "divider" }),
      }}
    >
      <Typography sx={{ fontSize: 11, wordBreak: "break-word" }}>
        <Box component="span" sx={{ color: "text.disabled", fontWeight: 600, mr: 0.5 }}>Description</Box>
        {v.description || "—"}
      </Typography>
      <Typography sx={{ fontSize: 11 }}>
        <Box component="span" sx={{ color: "text.disabled", fontWeight: 600, mr: 0.5 }}>VIN</Box>
        {v.vinNumber || "—"}
      </Typography>
      <Typography sx={{ fontSize: 11 }}>
        <Box component="span" sx={{ color: "text.disabled", fontWeight: 600, mr: 0.5 }}>Load (lbs)</Box>
        {load}
      </Typography>
      <Typography sx={{ fontSize: 11 }}>
        <Box component="span" sx={{ color: "text.disabled", fontWeight: 600, mr: 0.5 }}>Mileage / hrs</Box>
        {mileage}
      </Typography>
    </Box>
  );
}

const MASTER_COLORS = [
  "#1E88E5",
  "#E53935",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
  "#00897B",
  "#3949AB",
  "#6D4C41",
];

type MapDriverChipAssignment = { driverId: string; driverName: string };

/** Google Maps–style chips on md+; compact `Select` below md to save map space. */
function MapDriverViewChips({
  assignments,
  activeMapViewDriverId,
  onSelectMaster,
  onSelectDriver,
  primary,
}: {
  assignments: MapDriverChipAssignment[];
  activeMapViewDriverId: string;
  onSelectMaster: () => void;
  onSelectDriver: (driverId: string) => void;
  primary: string;
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  if (isCompact) {
    const selectValue = activeMapViewDriverId === "master" ? "master" : activeMapViewDriverId;
    return (
      <FormControl
        size="small"
        sx={{
          position: "absolute",
          left: 8,
          top: 10,
          zIndex: 1200,
          width: { xs: "calc(100% - 96px)", sm: "min(260px, calc(100% - 96px))" },
          maxWidth: 280,
          bgcolor: "rgba(255,255,255,0.98)",
          borderRadius: 1,
          boxShadow: "0 1px 4px rgba(60, 64, 67, 0.25)",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.12)" },
        }}
      >
        <Select
          value={selectValue}
          onChange={(e) => {
            const v = String(e.target.value);
            if (v === "master") onSelectMaster();
            else onSelectDriver(v);
          }}
          displayEmpty
          inputProps={{ "aria-label": "Route view" }}
          sx={{
            fontSize: 12,
            fontWeight: 600,
            height: 34,
            "& .MuiSelect-select": { py: 0.65, display: "flex", alignItems: "center" },
          }}
        >
          <MenuItem value="master" sx={{ fontSize: 12 }}>
            Master
          </MenuItem>
          {assignments.map((a, idx) => (
            <MenuItem key={a.driverId} value={a.driverId} sx={{ fontSize: 12, color: MASTER_COLORS[idx % MASTER_COLORS.length] }}>
              {a.driverName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  const chipBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    flexShrink: 0,
    pl: 0.65,
    pr: 0.85,
    py: 0.35,
    border: "1px solid",
    borderRadius: 999,
    bgcolor: "#fff",
    boxShadow: "0 1px 2px rgba(60, 64, 67, 0.22)",
    cursor: "pointer",
    font: "inherit",
    textAlign: "left" as const,
    minHeight: 26,
    maxWidth: { xs: 148, sm: 168 },
    transition: "box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease",
    "&:hover": {
      boxShadow: "0 1px 4px rgba(60, 64, 67, 0.28)",
    },
    "&:focus-visible": {
      outline: "2px solid rgba(26, 115, 232, 0.55)",
      outlineOffset: 2,
    },
  };

  return (
    <Box
      sx={{
        position: "absolute",
        left: 8,
        top: 10,
        zIndex: 1200,
        display: "flex",
        flexWrap: { xs: "nowrap", md: "wrap" },
        alignItems: "center",
        gap: 0.65,
        maxWidth: { xs: "calc(100% - 108px)", sm: "min(72%, 560px)" },
        overflowX: { xs: "auto", md: "visible" },
        overflowY: "hidden",
        py: 0.25,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: 5 },
        "&::-webkit-scrollbar-thumb": { borderRadius: 3, bgcolor: "rgba(0,0,0,0.2)" },
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onSelectMaster}
        sx={{
          ...chipBase,
          borderColor: activeMapViewDriverId === "master" ? primary : "#dadce0",
          color: activeMapViewDriverId === "master" ? primary : "#202124",
          "& .MuiSvgIcon-root": {
            color: activeMapViewDriverId === "master" ? primary : "#5f6368",
          },
        }}
      >
        <LayersOutlinedIcon sx={{ fontSize: 15, flexShrink: 0 }} />
        <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Master
        </Typography>
      </Box>
      {assignments.map((a, idx) => {
        const accent = MASTER_COLORS[idx % MASTER_COLORS.length];
        const selected = activeMapViewDriverId === a.driverId;
        return (
          <Box
            key={a.driverId}
            component="button"
            type="button"
            onClick={() => onSelectDriver(a.driverId)}
            sx={{
              ...chipBase,
              borderColor: selected ? accent : "#dadce0",
              color: selected ? accent : "#202124",
              "& .MuiSvgIcon-root": {
                color: selected ? accent : "#5f6368",
              },
            }}
          >
            <LocalShippingOutlinedIcon sx={{ fontSize: 15, flexShrink: 0 }} />
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.driverName}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function unwrapListArray(res: unknown): any[] {
  const r = res as any;
  const body = r?.data ?? r;
  if (Array.isArray(body)) return body;
  const list = body?.data;
  if (Array.isArray(list)) return list;
  if (list && Array.isArray(list.data)) return list.data;
  if (body && Array.isArray(body.rows)) return body.rows;
  return [];
}

function mapDriverRow(r: any, i: number): DriverOption {
  const id = r?.id ?? r?.Driver_ID ?? r?.driver_id ?? r?.D_Number ?? r?.Employee_ID ?? r?.userId ?? i;
  const firstName = String(r?.firstName ?? "").trim();
  const lastName = String(r?.lastName ?? "").trim();
  const nameFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
  const name =
    nameFromParts ||
    String(r?.name ?? r?.Name ?? r?.driverName ?? r?.Full_Name ?? `Driver ${i + 1}`);
  return {
    id: String(id),
    name,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    driverPicture: r?.driverPicture ?? r?.driver_picture ?? null,
    phoneNumber: r?.phoneNumber ?? r?.phone_number ?? null,
  };
}

function resolveAssetUrl(src: string | null | undefined): string | null {
  if (!src || !String(src).trim()) return null;
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const api = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const origin = api.replace(/\/api\/?$/, "");
  return s.startsWith("/") ? `${origin}${s}` : `${origin}/${s}`;
}

function mapVehicleRow(r: any, i: number): VehicleOption {
  const id = r?.id ?? r?.Vehicle_ID ?? r?.vehicle_id ?? r?.V_Number ?? r?.vehicleNumber ?? i;
  const desc = String(r?.description ?? r?.Description ?? "").trim();
  const vin = String(r?.vinNumber ?? r?.VIN ?? r?.vin ?? "").trim();
  const label = desc || (vin ? `VIN ${vin}` : `Vehicle ${i + 1}`);
  const rawLoad = r?.loadCapacityLbs ?? r?.LoadCapacityLbs;
  const loadCapacityLbs =
    rawLoad == null || rawLoad === "" ? undefined : Number.isFinite(Number(rawLoad)) ? Number(rawLoad) : undefined;
  const mh = r?.mileageHours ?? r?.MileageHours;
  return {
    id: String(id),
    label,
    description: desc || undefined,
    vinNumber: vin || undefined,
    loadCapacityLbs,
    mileageHours: mh == null || mh === "" ? undefined : mh,
  };
}

function formatRouteLabel(route: string): string {
  const s = String(route ?? "").trim();
  if (!s || s === "0") return "Unassigned";
  if (/^r-/i.test(s)) return `R-${s.slice(2)}`;
  return `R-${s}`;
}

function parseDeliveryLatLngFromSettings(data: any): { origin: { lat: number; lng: number }; destination: { lat: number; lng: number } } | null {
  const startLatNum = typeof data?.deliveryStartLat === "number" ? data.deliveryStartLat : Number.parseFloat(String(data?.deliveryStartLat ?? ""));
  const startLongNum = typeof data?.deliveryStartLong === "number" ? data.deliveryStartLong : Number.parseFloat(String(data?.deliveryStartLong ?? ""));
  const endLatNum = typeof data?.deliveryEndLat === "number" ? data.deliveryEndLat : Number.parseFloat(String(data?.deliveryEndLat ?? ""));
  const endLongNum = typeof data?.deliveryEndLong === "number" ? data.deliveryEndLong : Number.parseFloat(String(data?.deliveryEndLong ?? ""));
  if (![startLatNum, startLongNum, endLatNum, endLongNum].every((n) => Number.isFinite(n))) return null;
  return {
    origin: { lat: startLatNum, lng: startLongNum },
    destination: { lat: endLatNum, lng: endLongNum },
  };
}

function parseMultiPreviewRoutes(res: unknown): MultiDriverPreviewRoute[] {
  const r = res as any;
  const raw = r?.data?.data ?? r?.data ?? {};
  const routes = raw?.routes ?? [];
  return (Array.isArray(routes) ? routes : []).map((x: any) => ({
    driverId: Number(x.driverId ?? 0),
    truckId: Number(x.truckId ?? 0),
    day: String(x.day ?? ""),
    totalStops: Number(x.totalStops ?? 0),
    totalKilometers: Number(x.totalKilometers ?? 0),
    totalMiles: Number(x.totalMiles ?? 0),
    totalDurationInMinutes: Number(x.totalDurationInMinutes ?? 0),
    polyline: String(x.polyline ?? ""),
    stops: (Array.isArray(x.stops) ? x.stops : []).map((s: any) => ({
      stopSequence: Number(s.stopSequence ?? 0),
      orderNumber: Number(s.orderNumber ?? 0),
      C_Number: Number(s.C_Number ?? s.c_number ?? 0),
      latitude: Number(s.latitude ?? s.lat ?? 0),
      longitude: Number(s.longitude ?? s.lng ?? s.long ?? 0),
      startLatitude: Number(s.startLatitude ?? s.latitude ?? s.lat ?? 0),
      startLongitude: Number(s.startLongitude ?? s.longitude ?? s.lng ?? s.long ?? 0),
      endLatitude: Number(s.endLatitude ?? s.latitude ?? s.lat ?? 0),
      endLongitude: Number(s.endLongitude ?? s.longitude ?? s.lng ?? s.long ?? 0),
      distanceKm: Number(s.distanceKm ?? 0),
      cumulativeKm: Number(s.cumulativeKm ?? 0),
      etaMinutes: Number(s.etaMinutes ?? 0),
      isLastStop: Boolean(s.isLastStop),
      invoiceUrl:
        s.invoiceUrl != null && String(s.invoiceUrl).trim() ? String(s.invoiceUrl).trim() : null,
      invoiceAmount:
        s.invoiceAmount != null && Number.isFinite(Number(s.invoiceAmount)) ? Number(s.invoiceAmount) : null,
    })),
  }));
}

function toHourMinuteText(minutes: number | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const RouteOptimization: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const primary = theme.palette.primary.main;

  const {
    selectedOrders,
    driverVehicleAssignmentsById,
    multiPreviewRoutes,
    multiPreviewSnapshotKey,
    lastFetchedMultiPreview,
    activeMapViewDriverId,
  } = useAppSelector((s) => s.routeOptimization);

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [expandedDriverDetailId, setExpandedDriverDetailId] = useState<string | null>(null);
  const [expandedVehicleDetailId, setExpandedVehicleDetailId] = useState<string | null>(null);
  const [pendingDriver, setPendingDriver] = useState<DriverOption | null>(null);
  const [pendingSplitInput, setPendingSplitInput] = useState<string>("0");
  const [mapLoading, setMapLoading] = useState(false);
  const [mapMaximized, setMapMaximized] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  /** ISO date (YYYY-MM-DD) from Create Route Automatically calendar — carried on selected orders as `deliveryDay`. */
  const listQueryDate = useMemo(
    () => String(selectedOrders[0]?.deliveryDay ?? "").trim(),
    [selectedOrders],
  );

  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const res = await getListOfDrivers(listQueryDate ? { date: listQueryDate } : undefined);
      setDrivers(unwrapListArray(res).map(mapDriverRow));
    } catch (e: any) {
      showErrorToast(e?.message || "Failed to load drivers.");
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, [listQueryDate]);

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const res = await getListOfVehicles(listQueryDate ? { date: listQueryDate } : undefined);
      setVehicles(unwrapListArray(res).map(mapVehicleRow));
    } catch (e: any) {
      showErrorToast(e?.message || "Failed to load vehicles.");
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, [listQueryDate]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  useEffect(() => {
    if (vehicleModalOpen) loadVehicles();
  }, [vehicleModalOpen, loadVehicles]);

  useEffect(() => {
    if (vehicleModalOpen) setExpandedVehicleDetailId(null);
  }, [vehicleModalOpen, pendingDriver?.id]);

  const routeLabels = useMemo(() => {
    if (selectedOrders.length === 0) return [] as string[];
    const uniq = new Set<string>();
    selectedOrders.forEach((o) => {
      uniq.add(formatRouteLabel(String(o?.route ?? "")));
    });
    return Array.from(uniq);
  }, [selectedOrders]);

  const routeLabel = useMemo(() => {
    if (routeLabels.length === 0) return "—";
    if (routeLabels.length === 1) return routeLabels[0];
    return `${routeLabels[0]} +${routeLabels.length - 1}`;
  }, [routeLabels]);

  const assignments = useMemo(() => Object.values(driverVehicleAssignmentsById), [driverVehicleAssignmentsById]);
  const assignmentsOrdered = useMemo(() => {
    const driverIdx = new Map<string, number>();
    drivers.forEach((d, i) => driverIdx.set(d.id, i));
    return [...assignments].sort((a, b) => (driverIdx.get(a.driverId) ?? 999) - (driverIdx.get(b.driverId) ?? 999));
  }, [assignments, drivers]);

  const splitByDriverId = useMemo(() => {
    const totalOrders = selectedOrders.length;
    const out: Record<string, number> = {};
    let remaining = totalOrders;
    assignmentsOrdered.forEach((a, idx) => {
      const isLast = idx === assignmentsOrdered.length - 1;
      if (isLast) {
        out[a.driverId] = Math.max(0, remaining);
        return;
      }
      const raw = typeof a.split === "number" ? Math.floor(a.split) : 0;
      const n = Math.max(0, Math.min(raw, remaining));
      out[a.driverId] = n;
      remaining -= n;
    });
    return out;
  }, [assignmentsOrdered, selectedOrders.length]);

  /**
   * Fingerprint for preview cache: orders + driver count + ordered splits (API slot order).
   * Omits driverId and truckId so swapping drivers or vehicles while keeping the same count and split pattern keeps the map visible.
   * Adding/removing drivers or changing splits changes the key → map hides until "Render map" again.
   */
  const semanticPreviewKey = useMemo(() => {
    const day = String(selectedOrders[0]?.deliveryDay ?? "").trim();
    const orderPart = selectedOrders
      .map((o) => `${o.id}:${o.srNo}:${o.customerLat}:${o.customerLng}:${o.customerNumber ?? 0}`)
      .join("|");
    const n = assignmentsOrdered.length;
    const splitSlots = assignmentsOrdered.map((a) => String(splitByDriverId[a.driverId] ?? 0)).join("|");
    return `${day}|${orderPart}|n=${n}|${splitSlots}`;
  }, [selectedOrders, assignmentsOrdered, splitByDriverId]);

  /** Routes to show on the map: cache when semantic key matches last fetch (split revert restores without API). Legacy fallback: persisted multiPreviewRoutes before lastFetched existed. */
  const displayMultiPreviewRoutes = useMemo(() => {
    if (lastFetchedMultiPreview && lastFetchedMultiPreview.snapshotKey === semanticPreviewKey) {
      return lastFetchedMultiPreview.routes;
    }
    if (multiPreviewRoutes.length > 0 && multiPreviewSnapshotKey === semanticPreviewKey) {
      return multiPreviewRoutes;
    }
    return [];
  }, [lastFetchedMultiPreview, semanticPreviewKey, multiPreviewRoutes, multiPreviewSnapshotKey]);

  const mapShown = displayMultiPreviewRoutes.length > 0;

  /** Keep preview routes aligned to current driver slot order so colors remain stable per driver. */
  const orderedPreviewRoutes = useMemo(() => {
    if (!displayMultiPreviewRoutes.length) return [] as MultiDriverPreviewRoute[];
    return assignmentsOrdered
      .map((a, idx) => {
        return (
          displayMultiPreviewRoutes.find((r) => String(r.driverId) === String(a.driverId)) ??
          displayMultiPreviewRoutes[idx] ??
          null
        );
      })
      .filter((r): r is MultiDriverPreviewRoute => !!r);
  }, [assignmentsOrdered, displayMultiPreviewRoutes]);

  const goToCreateRouteAutomatic = () => {
    const next: Record<string, RouteOptimizationOrderRow> = {};
    selectedOrders.forEach((o) => {
      next[o.id] = o;
    });
    dispatch(setDraftSelectedOrdersById(next));
    navigate("/admin/driver-management/create-route-automatic", {
      state: listQueryDate ? { routeDate: listQueryDate } : undefined,
    });
  };

  /** Previous step in the flow: driver & vehicle selection (after orders, before this screen). */
  const goBackToDriverVehicle = () => {
    const next: Record<string, RouteOptimizationOrderRow> = {};
    selectedOrders.forEach((o) => {
      next[o.id] = o;
    });
    dispatch(setDraftSelectedOrdersById(next));
    navigate("/admin/driver-management/select-driver-vehicle", {
      state: {
        nextPath: "/admin/driver-management/route-optimization",
        returnPath: "/admin/driver-management/create-route-automatic",
        routeDate: listQueryDate || undefined,
      },
    });
  };

  const handleCreateRoutesClick = () => {
    if (!mapShown || !displayMultiPreviewRoutes.length) {
      showErrorToast("Render preview map first, then create routes.");
      return;
    }
    setCreateConfirmOpen(true);
  };

  const submitCreateRoutes = async () => {
    if (!displayMultiPreviewRoutes.length) return;
    const day = listQueryDate;
    if (!day) {
      showErrorToast("Day is missing for create routes request.");
      return;
    }

    setCreateSubmitting(true);
    try {
      const settingsRes = await getSettingDeliveryAddress();
      const settingsData = (settingsRes as any)?.data?.data ?? (settingsRes as any)?.data ?? {};
      const od = parseDeliveryLatLngFromSettings(settingsData);
      if (!od) {
        showErrorToast("Delivery start/end coordinates are missing in settings.");
        return;
      }

      const orderByNumber = new Map<number, RouteOptimizationOrderRow>();
      selectedOrders.forEach((o) => orderByNumber.set(Number(o.srNo), o));

      const payload: CreateMultiDriverRoutesPayload = {
        day,
        origin: od.origin,
        destination: od.destination,
        previewedRoutes: displayMultiPreviewRoutes.map((r, idx) => {
          const a = assignmentsOrdered[idx];
          return {
          driverId: a ? Number(a.driverId) : r.driverId,
          truckId: a ? Number(a.truckId) : r.truckId,
          totalKilometers: r.totalKilometers,
          totalMiles: r.totalMiles,
          totalDurationInMinutes: r.totalDurationInMinutes,
          polyline: r.polyline,
          stops: r.stops.map((s) => {
            const ord = orderByNumber.get(Number(s.orderNumber));
            const invoiceUrl =
              (s.invoiceUrl != null && String(s.invoiceUrl).trim() ? String(s.invoiceUrl).trim() : null) ??
              (ord?.invoiceUrl != null && String(ord.invoiceUrl).trim() ? String(ord.invoiceUrl) : null) ??
              STATIC_ROUTE_ORDER_INVOICE_URL;
            const rawAmt: unknown = s.invoiceAmount ?? ord?.invoiceAmount ?? ord?.totalBalance;
            const invoiceAmount =
              rawAmt == null || rawAmt === ""
                ? null
                : Number.isFinite(Number(rawAmt))
                  ? Number(rawAmt)
                  : null;
            return {
            stopSequence: s.stopSequence,
            orderNumber: s.orderNumber,
            C_Number: s.C_Number,
            latitude: s.latitude,
            longitude: s.longitude,
            startLatitude: s.startLatitude,
            startLongitude: s.startLongitude,
            endLatitude: s.endLatitude,
            endLongitude: s.endLongitude,
            distanceKm: s.distanceKm,
            isLastStop: s.isLastStop,
            invoiceUrl,
            invoiceAmount,
          };
          }),
        };
        }),
      };

      await createMultiDriverRoutes(payload);
      setCreateConfirmOpen(false);
      showSuccessToast("Routes created successfully.");
      dispatch(clearRouteOptimizationSession());
      navigate("/admin/driver-management");
    } catch (e: any) {
      showErrorToast(e?.response?.data?.message ?? e?.message ?? "Failed to create routes.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDriverClick = (d: DriverOption) => {
    setPendingDriver(d);
    setVehicleModalOpen(true);
  };

  const pendingAssignment = pendingDriver ? driverVehicleAssignmentsById[pendingDriver.id] : undefined;
  useEffect(() => {
    const s = pendingAssignment?.split;
    setPendingSplitInput(String(typeof s === "number" ? Math.max(0, Math.floor(s)) : 0));
  }, [pendingDriver, pendingAssignment?.split]);

  const usedVehicleIdsByOtherDrivers = useMemo(() => {
    const set = new Set<string>();
    if (!pendingDriver) return set;
    assignments.forEach((a) => {
      if (a.driverId !== pendingDriver.id) set.add(a.truckId);
    });
    return set;
  }, [assignments, pendingDriver]);

  const vehicleOptionsForPendingDriver = useMemo(() => {
    return vehicles.filter((v) => !usedVehicleIdsByOtherDrivers.has(v.id));
  }, [vehicles, usedVehicleIdsByOtherDrivers]);

  const handleVehiclePick = (v: VehicleOption) => {
    if (!pendingDriver) return;
    const parsedSplit = Number.parseInt(pendingSplitInput, 10);
    const split = Number.isFinite(parsedSplit) ? Math.max(0, parsedSplit) : 0;
    dispatch(
      upsertDriverVehicleAssignment({
        driverId: pendingDriver.id,
        driverName: pendingDriver.name,
        truckId: v.id,
        truckLabel: v.label,
        vehicleDetail: assignedVehicleSnapshotFromOption(v),
      })
    );
    dispatch(setDriverSplit({ driverId: pendingDriver.id, split }));
    setVehicleModalOpen(false);
    setPendingDriver(null);
  };

  const handleRemoveVehicleForPendingDriver = () => {
    if (!pendingDriver) return;
    dispatch(removeDriverVehicleAssignment(pendingDriver.id));
    setVehicleModalOpen(false);
    setPendingDriver(null);
  };

  const handleRemoveAssignedDriver = (driverId: string) => {
    dispatch(removeDriverVehicleAssignment(driverId));
  };

  const handleSplitChange = (driverId: string, rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    const split = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    dispatch(setDriverSplit({ driverId, split }));

    /**
     * Last driver row is read-only (isAutoSplit) but its count is implied by others.
     * Without persisting that last value in Redux, wizard restore sees a missing split and resets to 5,6.
     */
    if (assignmentsOrdered.length < 2) return;
    const lastA = assignmentsOrdered[assignmentsOrdered.length - 1];
    if (String(driverId) === String(lastA.driverId)) return;

    let usedNonLast = 0;
    for (let i = 0; i < assignmentsOrdered.length - 1; i++) {
      const a = assignmentsOrdered[i];
      const s =
        String(a.driverId) === String(driverId)
          ? split
          : typeof a.split === "number"
            ? Math.floor(a.split)
            : 0;
      usedNonLast += s;
    }
    const lastSplit = Math.max(0, selectedOrders.length - usedNonLast);
    dispatch(setDriverSplit({ driverId: lastA.driverId, split: lastSplit }));
  };

  /** Modal split field: keep local state in sync and update Redux when this driver already has a vehicle (otherwise split is applied on vehicle pick). */
  // const handlePendingSplitInputChange = (rawValue: string) => {
  //   setPendingSplitInput(rawValue);
  //   if (!pendingDriver) return;
  //   if (!driverVehicleAssignmentsById[pendingDriver.id]) return;
  //   const parsed = Number.parseInt(rawValue, 10);
  //   const split = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  //   dispatch(setDriverSplit({ driverId: pendingDriver.id, split }));
  // };

  const canRenderMap = selectedOrders.length > 0 && assignmentsOrdered.length > 0;

  const handleRenderMap = async () => {
    if (!selectedOrders.length) {
      showErrorToast("No orders selected for this route.");
      return;
    }
    if (!assignmentsOrdered.length) {
      showErrorToast("Select at least one driver and vehicle before loading the map.");
      return;
    }

    const missingCoord = selectedOrders.find(
      (o) => o.customerLat == null || o.customerLng == null || !Number.isFinite(o.customerLat) || !Number.isFinite(o.customerLng)
    );
    if (missingCoord) {
      showErrorToast("Every selected order needs customer latitude/longitude. Set location first.");
      return;
    }

    if (!listQueryDate) {
      showErrorToast("Delivery day is missing on selected orders.");
      return;
    }

    setMapLoading(true);
    try {
      const settingsRes = await getSettingDeliveryAddress();
      const settingsData = (settingsRes as any)?.data?.data ?? (settingsRes as any)?.data ?? {};
      const od = parseDeliveryLatLngFromSettings(settingsData);
      if (!od) {
        showErrorToast("Delivery start/end coordinates are missing in settings.");
        return;
      }

      const payload: PreviewMultiDriverRoutesPayload = {
        day: listQueryDate,
        origin: od.origin,
        destination: od.destination,
        drivers: assignmentsOrdered.map((a) => ({
          driverId: Number(a.driverId),
          truckId: Number(a.truckId),
          split: Number(splitByDriverId[a.driverId] ?? 0),
        })),
        orders: selectedOrders.map((o) => ({
          orderNumber: Number(o.srNo),
          C_Number: Number(o.customerNumber ?? 0),
          lat: Number(o.customerLat),
          lng: Number(o.customerLng),
        })),
      };

      const res = await previewMultiDriverRoutes(payload);
      const routes = parseMultiPreviewRoutes(res).filter((r) => !!r.polyline);
      if (!routes.length) {
        showErrorToast("No routes returned from previewMultiDriverRoutes.");
        return;
      }
      dispatch(setMultiPreviewRoutes({ routes, snapshotKey: semanticPreviewKey }));
      dispatch(setActiveMapViewDriverId("master"));
      showSuccessToast("Multi-driver route preview loaded.");
    } catch (e: any) {
      showErrorToast(e?.response?.data?.message ?? e?.message ?? "Failed to preview routes.");
    } finally {
      setMapLoading(false);
    }
  };

  /** Hide refresh when preview already matches current orders/splits or we cannot fetch. */
  const previewInSyncWithForm =
    (lastFetchedMultiPreview?.snapshotKey === semanticPreviewKey) ||
    (multiPreviewSnapshotKey === semanticPreviewKey && multiPreviewRoutes.length > 0);
  const refreshMapDisabled = !canRenderMap || mapLoading || previewInSyncWithForm;

  const activeRoute = useMemo(() => {
    if (!mapShown) return null;
    if (activeMapViewDriverId === "master") return null;
    const byId = displayMultiPreviewRoutes.find((r) => String(r.driverId) === String(activeMapViewDriverId));
    if (byId) return byId;
    const slotIdx = assignmentsOrdered.findIndex((a) => a.driverId === activeMapViewDriverId);
    return slotIdx >= 0 ? displayMultiPreviewRoutes[slotIdx] ?? null : null;
  }, [mapShown, activeMapViewDriverId, displayMultiPreviewRoutes, assignmentsOrdered]);

  const mapRouteData = useMemo(() => {
    if (!mapShown) return null;
    if (activeMapViewDriverId === "master") {
      const first = orderedPreviewRoutes[0];
      if (!first) return null;
      return {
        polyline: first.polyline,
        totalDistanceKm: first.totalKilometers,
        lastStopToDestinationKm: 0,
        totalDistanceMiles: first.totalMiles,
      };
    }
    if (!activeRoute) return null;
    return {
      polyline: activeRoute.polyline,
      totalDistanceKm: activeRoute.totalKilometers,
      lastStopToDestinationKm: 0,
      totalDistanceMiles: activeRoute.totalMiles,
    };
  }, [mapShown, activeMapViewDriverId, orderedPreviewRoutes, activeRoute]);

  const mapStops = useMemo(() => {
    if (!mapShown) return [];
    const normalizeStops = (route: MultiDriverPreviewRoute) =>
      route.stops.map((s) => ({
        stopSequence: s.stopSequence,
        C_Number: s.C_Number,
        orderNumbers: s.orderNumber,
        lat: s.latitude,
        lng: s.longitude,
        distanceKm: s.distanceKm,
        cumulativeDistanceKm: s.cumulativeKm,
        distanceMiles: Number(s.distanceKm) * 0.621371,
        cumulativeDistanceMiles: Number(s.cumulativeKm) * 0.621371,
        etaMinutes: s.etaMinutes,
      }));

    if (activeMapViewDriverId === "master") {
      return orderedPreviewRoutes.flatMap((route) => normalizeStops(route));
    }
    if (!activeRoute) return [];
    return normalizeStops(activeRoute);
  }, [mapShown, activeMapViewDriverId, orderedPreviewRoutes, activeRoute]);

  const extraPolylines = useMemo(() => {
    if (!mapShown || activeMapViewDriverId !== "master" || orderedPreviewRoutes.length < 2) return [];
    return orderedPreviewRoutes.slice(1).map((r, idx) => ({
      polyline: r.polyline,
      color: MASTER_COLORS[(idx + 1) % MASTER_COLORS.length],
    }));
  }, [mapShown, activeMapViewDriverId, orderedPreviewRoutes]);

  /** Slot colors follow current assignments so they stay correct after driver/vehicle swaps without refetching preview. */
  const driverColorById = useMemo(() => {
    const map: Record<string, string> = {};
    assignmentsOrdered.forEach((a, idx) => {
      map[String(a.driverId)] = MASTER_COLORS[idx % MASTER_COLORS.length];
    });
    return map;
  }, [assignmentsOrdered]);

  const activeRouteColor = useMemo(() => {
    if (!mapShown || activeMapViewDriverId === "master") return MASTER_COLORS[0];
    return driverColorById[String(activeMapViewDriverId)] ?? MASTER_COLORS[0];
  }, [mapShown, activeMapViewDriverId, driverColorById]);

  const confirmedRows = useMemo(() => {
    return assignmentsOrdered.map((a, idx) => {
      const rr =
        displayMultiPreviewRoutes.find((r) => String(r.driverId) === a.driverId) ?? displayMultiPreviewRoutes[idx];
      const isAutoSplit = idx === assignmentsOrdered.length - 1;
      const splitValue = splitByDriverId[a.driverId] ?? 0;
      return {
        driverId: a.driverId,
        route: routeLabel,
        driver: a.driverName,
        vehicle: a.truckLabel,
        splitValue,
        isAutoSplit,
        totalStops: rr ? `${rr.totalStops} Stops` : "—",
        totalMiles: rr ? `${Number(rr.totalMiles ?? 0).toFixed(2)} mi` : "—",
        totalDuration: rr ? toHourMinuteText(rr.totalDurationInMinutes) : "—",
      };
    });
  }, [assignmentsOrdered, displayMultiPreviewRoutes, routeLabel, splitByDriverId]);

  const stopPanelRows = useMemo(() => {
    const orderByNumber = new Map<number, (typeof selectedOrders)[number]>();
    selectedOrders.forEach((o) => orderByNumber.set(Number(o.srNo), o));

    if (!mapShown || !mapStops.length) {
      return selectedOrders.map((o, idx) => ({
        id: `${o.id}-${idx}`,
        customerName: o.customerName || "Customer",
        customerAddress: o.customerAddress || "—",
        routeLabel: formatRouteLabel(String(o.route ?? "")),
        customerNumber: o.customerNumber ?? null,
        orderNumber: o.srNo,
        distanceText: "",
      }));
    }
    return mapStops.map((s, idx) => ({
      id: `${s.orderNumbers}-${idx}`,
      customerName: orderByNumber.get(Number(s.orderNumbers))?.customerName || `Customer #${s.C_Number}`,
      customerAddress: orderByNumber.get(Number(s.orderNumbers))?.customerAddress || "—",
      routeLabel: formatRouteLabel(String(orderByNumber.get(Number(s.orderNumbers))?.route ?? "")),
      customerNumber: s.C_Number,
      orderNumber: s.orderNumbers,
      distanceText: Number.isFinite(s.distanceKm) ? `${(s.distanceKm * 0.621371).toFixed(2)} mi` : "",
    }));
  }, [mapShown, mapStops, selectedOrders]);

  const handlePrintManifest = async () => {
    if (!displayMultiPreviewRoutes.length || !assignmentsOrdered.length) {
      showErrorToast("Render map and assign drivers before printing manifest.");
      return;
    }
    let warehouse = { start: "-", end: "-" };
    try {
      const settingsRes = await getSettingDeliveryAddress();
      const sBody = (settingsRes as any)?.data?.data ?? (settingsRes as any)?.data ?? {};
      const startAddr = sBody?.deliveryStartAddress ?? {};
      const endAddr = sBody?.deliveryEndAddress ?? {};
      warehouse = {
        start: [startAddr?.address, startAddr?.city, startAddr?.state, startAddr?.zip].filter(Boolean).join(", ") || "-",
        end: [endAddr?.address, endAddr?.city, endAddr?.state, endAddr?.zip].filter(Boolean).join(", ") || "-",
      };
    } catch {
      warehouse = { start: "-", end: "-" };
    }
    const orderByNumber = new Map<number, (typeof selectedOrders)[number]>();
    selectedOrders.forEach((o) => orderByNumber.set(Number(o.srNo), o));
    const driverById = new Map(drivers.map((d) => [String(d.id), d] as const));
    const vehicleById = new Map(vehicles.map((v) => [String(v.id), v] as const));

    const manifestDrivers = assignmentsOrdered.map((a, idx) => {
      const rr =
        displayMultiPreviewRoutes.find((r) => String(r.driverId) === String(a.driverId)) ??
        displayMultiPreviewRoutes[idx];
      const d = driverById.get(String(a.driverId));
      const v = vehicleById.get(String(a.truckId));
      return {
        driverName: a.driverName,
        driverPhone: d?.phoneNumber ?? null,
        vehicleLabel: a.truckLabel,
        vehicleVin: v?.vinNumber,
        vehicleDescription: v?.description,
        dayLabel: listQueryDate,
        totalStops: rr?.totalStops ?? 0,
        totalMiles: rr ? Number(rr.totalMiles ?? 0).toFixed(2) : null,
        totalDurationInMinutes: rr?.totalDurationInMinutes ?? null,
        estimatedTimeNote: true,
        stops: (rr?.stops ?? []).map((s) => {
          const o = orderByNumber.get(Number(s.orderNumber));
          return {
            stopSequence: s.stopSequence,
            customerName: o?.customerName ?? `Customer #${s.C_Number}`,
            customerAddress: o?.customerAddress ?? "",
            invoiceNumber: s.orderNumber,
            orderNumber: s.orderNumber,
            phone: o?.customerForLocation?.C_Phone ?? o?.customerForLocation?.C_PhoneMobile ?? "",
            note: "",
          };
        }),
      };
    });

    await openRouteManifestPdf({
      title: "Route Optimization Manifest",
      warehouse,
      drivers: manifestDrivers,
    });
  };

  const pageBg = theme.palette.mode === "light" ? "#F4F7F9" : "background.default";
  const cardBg = theme.palette.mode === "light" ? "#FFFFFF" : theme.palette.background.paper;
  const borderColor = theme.palette.mode === "light" ? "#E4E9EF" : "divider";

  if (selectedOrders.length === 0) {
    return (
      <Box sx={{ width: "100%", bgcolor: pageBg, pb: 3, px: { xs: 1, sm: 0 } }}>
        <Typography sx={{ fontWeight: 500, fontSize: { xs: "1rem", sm: "1.125rem" }, mb: 2 }}>Route Optimization</Typography>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor }}>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            No orders selected. Choose orders on Create Route Automatically, then tap Optimize.
          </Typography>
          <Button variant="contained" onClick={goToCreateRouteAutomatic} sx={{ textTransform: "none", borderRadius: "8px", bgcolor: primary, color: "#fff" }}>
            Go to Create Route Automatically
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", bgcolor: pageBg, pb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25, gap: 1 }}>
        <Typography sx={{ fontWeight: 500, fontSize: { xs: "0.98rem", sm: "1.08rem" }, letterSpacing: "-0.01em" }}>
          Route Optimization
        </Typography>
        <Button variant="outlined" onClick={goBackToDriverVehicle} sx={{ textTransform: "none", borderRadius: "8px", borderColor: primary, color: primary, py: 0.5, px: 1.2, fontSize: 12, minWidth: 0 }}>
          Back to drivers
        </Button>
      </Box>

      {mapMaximized ? (
        <Paper elevation={0} sx={{ borderRadius: 1.5, border: "1px solid", borderColor, bgcolor: cardBg, overflow: "hidden", minWidth: 0, height: { xs: "calc(100vh - 350px)", lg: "calc(100vh - 300px)" } }}>
          {!mapShown ? (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2, textAlign: "center", gap: 1.2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Map preview (multi-driver)</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", maxWidth: 420 }}>
                Assign vehicles to one or more drivers. A vehicle cannot be assigned to two drivers at the same time.
              </Typography>
              <Button variant="contained" disableElevation disabled={!canRenderMap || mapLoading} onClick={handleRenderMap} sx={{ textTransform: "none", borderRadius: "8px", px: 2, py: 0.55, bgcolor: primary, color: "#fff", fontSize: 12, minHeight: 0 }}>
                {mapLoading ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><CircularProgress size={14} sx={{ color: "#fff" }} />Loading map…</Box> : "Render map"}
              </Button>
            </Box>
          ) : mapRouteData ? (
            <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
              <MapDriverViewChips
                assignments={assignmentsOrdered}
                activeMapViewDriverId={activeMapViewDriverId}
                onSelectMaster={() => dispatch(setActiveMapViewDriverId("master"))}
                onSelectDriver={(id) => dispatch(setActiveMapViewDriverId(id))}
                primary={primary}
              />
              {!refreshMapDisabled && (
                <Tooltip title="Refresh route map">
                  <span>
                    <IconButton aria-label="Refresh map" onClick={handleRenderMap} sx={{ position: "absolute", top: 10, right: 52, zIndex: 1200, bgcolor: "background.paper", boxShadow: 1, p: 0.7 }}>
                      {mapLoading ? <CircularProgress size={18} color="primary" /> : <RefreshIcon sx={{ fontSize: 17 }} />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title={mapMaximized ? "Minimize map" : "Maximize map"}>
                <span>
                  <IconButton aria-label="toggle map size" onClick={() => setMapMaximized((v) => !v)} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1200, bgcolor: "background.paper", boxShadow: 1, p: 0.7 }}>
                    <CloseFullscreenIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <RouteMap route={mapRouteData} routeColor={activeRouteColor} optimizedStops={mapStops} extraPolylines={extraPolylines} height="100%" width="100%" showInfoPanel={false} />
            </Box>
          ) : null}
        </Paper>
      ) : (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "220px 1fr 280px" }, gap: 1.25 }}>
        <Paper elevation={0} sx={{ borderRadius: 1.5, border: "1px solid", borderColor, bgcolor: cardBg, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* <Box sx={{ px: 1.25, py: 0.9, borderBottom: "1px solid", borderColor }}>
            <Typography sx={{ fontWeight: 700, fontSize: 11.5, color: "text.secondary", letterSpacing: "0.02em" }}>Routes</Typography>
          </Box>
          <Box sx={{ px: 0.75, py: 0.5 }}>
            <Box
              sx={{
                borderRadius: 1.25,
                border: "1px solid",
                borderColor: "divider",
                overflow: "auto",
                height: 140,
                p: 0.55,
                display: "flex",
                flexDirection: "column",
                gap: 0.45,
              }}
            >
              {(routeLabels.length ? routeLabels : [routeLabel]).map((r, idx) => (
                <Box
                  key={`${r}-${idx}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 0.9,
                    py: 0.55,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: primary,
                    bgcolor: theme.palette.mode === "light" ? "rgba(60, 119, 149, 0.10)" : "rgba(60, 119, 149, 0.22)",
                  }}
                >
                  <Box component="img" src={driverRouteIcon} alt="" sx={{ width: 15, height: 15 }} />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, minWidth: 0, flex: 1 }} noWrap title={r}>
                    {r}
                  </Typography>
                  <ChevronRightIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                </Box>
              ))}
            </Box>
          </Box> */}
          <Box sx={{ px: 1.25, py: 0.9, borderTop: "1px solid", borderBottom: "1px solid", borderColor }}>
            <Typography sx={{ fontWeight: 700, fontSize: 11.5, color: "text.secondary", letterSpacing: "0.02em" }}>Driver Select (multi)</Typography>
          </Box>
          <Box
            sx={{
              px: 0.75,
              py: 0.4,
              overflow: "auto",
              flex: 1,
              maxHeight: { xs: "calc(100vh - 350px)", lg: "calc(100vh - 350px)" },
            }}
          >
            {loadingDrivers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={28} /></Box>
            ) : (
              drivers.map((d) => {
                const assigned = driverVehicleAssignmentsById[d.id];
                const assignedVehicle = assigned ? resolveAssignedVehicleOption(assigned, vehicles) : undefined;
                const expanded = expandedDriverDetailId === d.id;
                const initial = driverInitialLetter(d);
                const driverPic = resolveAssetUrl(d.driverPicture);
                return (
                  <Box
                    key={d.id}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: assigned ? primary : "divider",
                      bgcolor: assigned ? "rgba(60, 119, 149, 0.06)" : "background.paper",
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ p: 1.25, pb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.15 }}>
                        <Avatar
                          src={driverPic || undefined}
                          sx={{
                            width: 30,
                            height: 30,
                            fontSize: 14,
                            // fontWeight: 600,
                            // flexShrink: 0,
                            // bgcolor: assigned ? "rgba(60, 119, 149, 0.2)" : "action.selected",
                            // color: assigned ? primary : "text.primary",
                          }}
                        >
                          {initial}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 0.5 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1, color: "text.primary" }}>{d.name}</Typography>
                            {assigned ? (
                              <Tooltip title="Remove driver assignment">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveAssignedDriver(d.id);
                                  }}
                                  sx={{ mt: -0.8, mr: -0.5, p: 0.45, color: "error.main", "&:hover": { color: "error.main", bgcolor: "rgba(211, 47, 47, 0.08)" } }}
                                >
                                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                          </Box>
                          <Typography
                            sx={{ fontSize: 11, color: "text.secondary", mt: 0.1 }}
                            noWrap
                            title={assigned ? assigned.truckLabel : undefined}
                          >
                            {assigned ? assigned.truckLabel : "No vehicle assigned yet"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          mt: 1.15,
                          pt: 1.15,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Button
                          variant="text"
                          color="inherit"
                          size="small"
                          onClick={() => setExpandedDriverDetailId((cur) => (cur === d.id ? null : d.id))}
                          endIcon={
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 16,
                                color: "text.secondary",
                                transform: expanded ? "rotate(180deg)" : "none",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          }
                          sx={{
                            textTransform: "none",
                            fontSize: 11,
                            fontWeight: 500,
                            color: "text.secondary",
                            px: 0.5,
                            py: 0.25,
                            minWidth: 0,
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          {expanded ? "Hide" : "View"}
                        </Button>
                        <Button
                          variant="contained"
                          disableElevation
                          size="small"
                          onClick={() => handleDriverClick(d)}
                          sx={{
                            textTransform: "none",
                            fontSize: 10,
                            fontWeight: 500,
                            py: 0.55,
                            borderRadius: 1.5,
                            boxShadow: "none",
                            bgcolor: primary,
                            color: "#fff",
                            "&:hover": { bgcolor: primary, opacity: 0.92 },
                          }}
                        >
                          {assigned ? "Change vehicle" : "Assign vehicle"}
                        </Button>
                      </Box>
                    </Box>

                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          px: 1.25,
                          pb: 1.25,
                          pt: 0,
                          bgcolor: theme.palette.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.04)",
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <DriverDetailCompact d={d} vehicle={assignedVehicle ?? null} />
                      </Box>
                    </Collapse>
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateRows: { xs: "320px auto", lg: "390px auto" }, gap: 1.25, minWidth: 0 }}>
          <Paper elevation={0} sx={{ borderRadius: 1.5, border: "1px solid", borderColor, bgcolor: cardBg, overflow: "hidden", minWidth: 0, height: { xs: 320, lg: 390 } }}>
            {!mapShown ? (
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2, textAlign: "center", gap: 1.2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Map preview (multi-driver)</Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary", maxWidth: 420 }}>
                  Assign vehicles to one or more drivers. A vehicle cannot be assigned to two drivers at the same time.
                </Typography>
                <Button variant="contained" disableElevation disabled={!canRenderMap || mapLoading} onClick={handleRenderMap} sx={{ textTransform: "none", borderRadius: "8px", px: 2, py: 0.55, bgcolor: primary, color: "#fff", fontSize: 12, minHeight: 0 }}>
                  {mapLoading ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}><CircularProgress size={14} sx={{ color: "#fff" }} />Loading map…</Box> : "Render map"}
                </Button>
              </Box>
            ) : mapRouteData ? (
              <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                <MapDriverViewChips
                  assignments={assignmentsOrdered}
                  activeMapViewDriverId={activeMapViewDriverId}
                  onSelectMaster={() => dispatch(setActiveMapViewDriverId("master"))}
                  onSelectDriver={(id) => dispatch(setActiveMapViewDriverId(id))}
                  primary={primary}
                />
                {!refreshMapDisabled && (
                  <Tooltip title="Refresh route map">
                    <span>
                      <IconButton aria-label="Refresh map" onClick={handleRenderMap} sx={{ position: "absolute", top: 10, right: 52, zIndex: 1200, bgcolor: "background.paper", boxShadow: 1, p: 0.7 }}>
                        {mapLoading ? <CircularProgress size={18} color="primary" /> : <RefreshIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                <Tooltip title={mapMaximized ? "Minimize map" : "Maximize map"}>
                  <span>
                    <IconButton aria-label="toggle map size" onClick={() => setMapMaximized((v) => !v)} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1200, bgcolor: "background.paper", boxShadow: 1, p: 0.7 }}>
                      <OpenInFullIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <RouteMap route={mapRouteData} routeColor={activeRouteColor} optimizedStops={mapStops} extraPolylines={extraPolylines} height="100%" width="100%" showInfoPanel={false} />
              </Box>
            ) : null}
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 1.5, border: "1px solid", borderColor, bgcolor: cardBg, overflow: "hidden" }}>
            <Box sx={{ px: 1.25, py: 0.85, borderBottom: "1px solid", borderColor }}>
              <Typography sx={{ fontWeight: 700, fontSize: 11.5, color: primary, letterSpacing: "0.02em" }}>Confirmed Routes</Typography>
            </Box>
            <Box sx={{ px: 1.25, py: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Box sx={{ overflowX: "auto", width: "100%", minWidth: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "80px 1fr 120px 72px 72px 85px 72px", minWidth: 700, border: "1px solid", borderColor, borderRadius: 1.25, overflow: "hidden" }}>
                  {["Route", "Driver", "Vehicle", "Split", "Stops", "Miles", "Duration"].map((h) => <Box key={h} sx={{ bgcolor: primary, color: "#fff", px: 1.25, py: 0.65, fontSize: 10.5, fontWeight: 700 }}>{h}</Box>)}
                  {(confirmedRows.length ? confirmedRows : [{ route: routeLabel, driver: "—", vehicle: "—", splitValue: 0, isAutoSplit: true, totalStops: "—", totalMiles: "—", totalDuration: "—", driverId: "" }]).map((r, idx) => (
                    <React.Fragment key={idx}>
                      <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor }}>{r.route}</Box>
                      <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor }}>{r.driver}</Box>
                      <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor }}>{r.vehicle}</Box>
                      <Box sx={{ px: 1.0, py: 0.45, fontSize: 11.5, borderTop: "1px solid", borderColor }}>
                        {r.driverId ? (
                          r.isAutoSplit ? (
                            <Typography sx={{ fontSize: 11.5, fontWeight: 700 }}>{r.splitValue}</Typography>
                          ) : (
                            <TextField
                              size="small"
                              type="number"
                              value={r.splitValue}
                              onChange={(e) => handleSplitChange(r.driverId, e.target.value)}
                              inputProps={{ min: 0, style: { fontSize: 11, padding: "3px 6px" } }}
                              sx={{ width: 58, "& .MuiInputBase-root": { height: 24 } }}
                            />
                          )
                        ) : (
                          "—"
                        )}
                      </Box>
                      <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor }}>{r.totalStops}</Box>
                      <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor }}>{r.totalMiles}</Box>
                      <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor }}>{r.totalDuration}</Box>
                    </React.Fragment>
                  ))}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flexShrink: 0 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrintManifest}
                  disabled={!mapShown}
                  sx={{ textTransform: "none", borderRadius: "8px", borderColor: primary, color: "color.primary", fontSize: 11.5, py: 0.45, px: 1.25 }}
                >
                  Print Manifest
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={handleCreateRoutesClick}
                  disabled={!mapShown || createSubmitting}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    bgcolor: primary,
                    color: "#fff",
                    fontSize: 11.5,
                    py: 0.45,
                    px: 1.25,
                    "&.Mui-disabled": {
                      bgcolor: theme.palette.mode === "light" ? "rgba(60, 119, 149, 0.35)" : "rgba(60, 119, 149, 0.25)",
                      color: "rgba(255,255,255,0.9)",
                    },
                  }}
                >
                  Create Route(s)
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 1.5, border: "1px solid", borderColor, bgcolor: cardBg, overflow: "auto", display: "flex", flexDirection: "column", height: { xs: "calc(100vh - 350px)", lg: "calc(100vh - 300px)" } }}>
          <Box sx={{ px: 1.25, py: 0.85, borderBottom: "1px solid", borderColor }}>
            <Typography sx={{ fontWeight: 700, fontSize: 11.5, color: "text.secondary", letterSpacing: "0.02em" }}>
              Stops in this Route {activeMapViewDriverId === "master" ? "(Master)" : "(Driver)"}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: "text.disabled", mt: 0.35 }}>{stopPanelRows.length} Stops</Typography>
          </Box>
          <Box sx={{ px: 1.25, py: 0.9, display: "flex", flexDirection: "column", gap: 0.9, overflow: "auto", flex: 1, }}>
            {stopPanelRows.map((s, idx) => (
              <React.Fragment key={s.id}>
                <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                  <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "#E9F5FF", border: "1px solid", borderColor: "#AFD2E5", display: "flex", alignItems: "center", justifyContent: "center", color: primary, fontWeight: 700, fontSize: 10 }}>{idx + 1}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1.2 }}>
                      {s.customerName}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: "text.secondary", lineHeight: 1.25 }}>
                      {s.customerAddress}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: "text.disabled", lineHeight: 1.2 }}>
                      {s.routeLabel ? `${s.routeLabel}  •  ` : ""}
                      Order #{s.orderNumber}
                      {s.customerNumber ? `  •  C#${s.customerNumber}` : ""}
                      {s.distanceText ? `  •  ${s.distanceText}` : ""}
                    </Typography>
                  </Box>
                </Box>
                {idx < stopPanelRows.length - 1 && (
                  <Box sx={{ my: 0.6 }}>
                    <div style={{ borderBottom: `1px solid ${borderColor}`, opacity: 0.5 }} />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>
      </Box>
      )}

      <Dialog open={createConfirmOpen} onClose={createSubmitting ? undefined : () => setCreateConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>Create Routes?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Are you sure you want to create routes for the selected drivers?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateConfirmOpen(false)} disabled={createSubmitting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" disableElevation onClick={submitCreateRoutes} disabled={createSubmitting} sx={{ textTransform: "none", borderRadius: "8px", bgcolor: primary, color: "#fff" }}>
            {createSubmitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Confirm Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>Select a Vehicle</DialogTitle>
        <Typography sx={{ px: 3, pt: 0.5, pb: 0.5, fontSize: 13, color: "text.secondary" }}>
          {pendingDriver ? `Choose a vehicle for ${pendingDriver.name}` : "Choose a vehicle"}
        </Typography>
        <DialogContent sx={{ pt: 0.5, px: 2 }}>
          {pendingDriver && (
            <Box sx={{ mb: 1, p: 0.75, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>
              <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: "text.disabled", mb: 0.35, letterSpacing: "0.02em" }}>Driver</Typography>
              <DriverDetailCompact
                d={pendingDriver}
                vehicle={pendingAssignment ? resolveAssignedVehicleOption(pendingAssignment, vehicles) ?? null : null}
              />
            </Box>
          )}
          {/* <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.35 }}>Split (orders for this driver)</Typography>
            <TextField
              size="small"
              type="number"
              value={pendingSplitInput}
              onChange={(e) => handlePendingSplitInputChange(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ width: 140, "& .MuiInputBase-input": { fontSize: 12, py: 0.65 } }}
            />
          </Box> */}
          {!!pendingAssignment && (
            <Box sx={{ mb: 1, p: 0.75, borderRadius: 1, border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Current: {pendingAssignment.truckLabel}</Typography>
              <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleRemoveVehicleForPendingDriver} sx={{ textTransform: "none", fontSize: 11 }}>
                Remove
              </Button>
            </Box>
          )}
          {loadingVehicles ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
          ) : vehicleOptionsForPendingDriver.length === 0 ? (
            <Typography sx={{ color: "text.secondary", py: 2, fontSize: 12 }}>No vehicles available (already assigned to other drivers).</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", letterSpacing: "0.04em", textTransform: "uppercase" }}>Available vehicles</Typography>
              {vehicleOptionsForPendingDriver.map((v) => {
                const vExpanded = expandedVehicleDetailId === v.id;
                return (
                  <Box
                    key={v.id}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ p: 1.15, pb: 0.85 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <LocalShippingIcon sx={{ fontSize: 22, color: primary, mt: 0.15, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{v.label}</Typography>
                          {v.vinNumber ? (
                            <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.35 }} noWrap title={v.vinNumber}>
                              VIN {v.vinNumber}
                            </Typography>
                          ) : null}
                        </Box>
                        <Button
                          variant="contained"
                          disableElevation
                          size="small"
                          onClick={() => handleVehiclePick(v)}
                          sx={{
                            textTransform: "none",
                            fontSize: 12,
                            fontWeight: 600,
                            px: 1.5,
                            py: 0.55,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            bgcolor: primary,
                            color: "#fff",
                            "&:hover": { bgcolor: primary, opacity: 0.92 },
                          }}
                        >
                          Select
                        </Button>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                        <Button
                          variant="text"
                          color="inherit"
                          size="small"
                          onClick={() => setExpandedVehicleDetailId((cur) => (cur === v.id ? null : v.id))}
                          endIcon={
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 20,
                                color: "text.secondary",
                                transform: vExpanded ? "rotate(180deg)" : "none",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          }
                          sx={{
                            textTransform: "none",
                            fontSize: 12,
                            fontWeight: 500,
                            color: "text.secondary",
                            px: 0.5,
                            py: 0.25,
                            minWidth: 0,
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          {vExpanded ? "Hide specs" : "All vehicle specs"}
                        </Button>
                      </Box>
                    </Box>
                    <Collapse in={vExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 1.15, pb: 1.15, pt: 0, bgcolor: "action.hover", borderTop: "1px solid", borderColor: "divider" }}>
                        <VehicleDetailCompact v={v} />
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVehicleModalOpen(false)} sx={{ textTransform: "none" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteOptimization;
