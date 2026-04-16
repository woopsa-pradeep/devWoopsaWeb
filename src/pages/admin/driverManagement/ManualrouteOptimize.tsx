import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import RouteMap, { type OptimizedStop } from "../../../component/molecules/RouteMap";
import {
  createManualRoute,
  getSettingDeliveryAddress,
  STATIC_ROUTE_ORDER_INVOICE_URL,
} from "../../../redux/apis/distrubutor/driverManagementApis";
import { getListOfDrivers, getListOfVehicles } from "../../../redux/apis/distrubutor/listApis";
import { showErrorToast, showSuccessToast } from "../../../utils/toastUtils";
import { encodePolyline, pathLengthKm } from "../../../utils/polylineEncode";
import { openRouteManifestPdf } from "../../../utils/routeManifestPdf";
import {
  clearManualRouteDraft,
  type RouteOptimizationOrderRow,
  setManualSelectedDriverId,
  setManualSelectedVehicleId,
  setManualStops as setPersistedManualStops,
  setDraftSelectedOrdersById,
} from "../../../redux/slices/routeOptimizationSlice";

type DriverOption = { id: string; name: string; phone?: string | null; driverPicture?: string | null };
type VehicleOption = {
  id: string;
  label: string;
  vin?: string;
  description?: string;
  loadCapacityLbs?: number;
  mileageHours?: string | number;
};
type ManualMapStop = {
  stopSequence: number;
  orderNumber: number;
  C_Number: number;
  lat: number;
  lng: number;
  invoiceUrl: string | null;
  invoiceAmount: number | null;
};

/** Redux-persist may omit `invoiceUrl` / `invoiceAmount`; normalize before compare. */
function normalizeManualStopsFromStore(
  stops: Array<{
    stopSequence: number;
    orderNumber: number;
    C_Number: number;
    lat: number;
    lng: number;
    invoiceUrl?: string | null;
    invoiceAmount?: number | null;
  }>
): ManualMapStop[] {
  return stops.map((s) => ({
    stopSequence: s.stopSequence,
    orderNumber: Number(s.orderNumber),
    C_Number: Number(s.C_Number),
    lat: Number(s.lat),
    lng: Number(s.lng),
    invoiceUrl: s.invoiceUrl ?? null,
    invoiceAmount: s.invoiceAmount ?? null,
  }));
}

function areStopsEqual(a: ManualMapStop[], b: ManualMapStop[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (
      a[i].stopSequence !== b[i].stopSequence ||
      a[i].orderNumber !== b[i].orderNumber ||
      a[i].C_Number !== b[i].C_Number ||
      a[i].lat !== b[i].lat ||
      a[i].lng !== b[i].lng ||
      a[i].invoiceUrl !== b[i].invoiceUrl ||
      a[i].invoiceAmount !== b[i].invoiceAmount
    )
      return false;
  }
  return true;
}

function parseDeliveryLatLngFromSettings(data: any): { origin: { lat: number; lng: number }; destination: { lat: number; lng: number } } | null {
  const startLatNum = Number.parseFloat(String(data?.deliveryStartLat ?? ""));
  const startLongNum = Number.parseFloat(String(data?.deliveryStartLong ?? ""));
  const endLatNum = Number.parseFloat(String(data?.deliveryEndLat ?? ""));
  const endLongNum = Number.parseFloat(String(data?.deliveryEndLong ?? ""));
  if (![startLatNum, startLongNum, endLatNum, endLongNum].every(Number.isFinite)) return null;
  return { origin: { lat: startLatNum, lng: startLongNum }, destination: { lat: endLatNum, lng: endLongNum } };
}

function resolveAssetUrl(src: string | null | undefined): string | null {
  if (!src || !String(src).trim()) return null;
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const api = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const origin = api.replace(/\/api\/?$/, "");
  return s.startsWith("/") ? `${origin}${s}` : `${origin}/${s}`;
}

const ManualrouteOptimize: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedOrders = useAppSelector((s) => s.routeOptimization.selectedOrders);
  const persistedManualSelectedDriverId = useAppSelector((s) => s.routeOptimization.manualSelectedDriverId);
  const persistedManualSelectedVehicleId = useAppSelector((s) => s.routeOptimization.manualSelectedVehicleId);
  const persistedManualStops = useAppSelector((s) => s.routeOptimization.manualStops);

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(persistedManualSelectedDriverId ?? "");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(persistedManualSelectedVehicleId ?? "");
  const [loading, setLoading] = useState(false);
  const [mapMaximized, setMapMaximized] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [stopOrderDirection, setStopOrderDirection] = useState<"asc" | "desc">("asc");
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [pendingDriver, setPendingDriver] = useState<DriverOption | null>(null);
  const [expandedDriverDetailId, setExpandedDriverDetailId] = useState<string | null>(null);
  const [expandedVehicleDetailId, setExpandedVehicleDetailId] = useState<string | null>(null);
  const [originDestination, setOriginDestination] = useState<{ origin: { lat: number; lng: number }; destination: { lat: number; lng: number } } | null>(null);
  const [warehouseDetail, setWarehouseDetail] = useState<{ start: string; end: string }>({ start: "-", end: "-" });
  const [manualStops, setManualStops] = useState<ManualMapStop[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  /** Previous step in the flow: driver & vehicle selection (after orders, before this screen). */
  const goBackToDriverVehicle = () => {
    const next: Record<string, RouteOptimizationOrderRow> = {};
    selectedOrders.forEach((o) => {
      next[o.id] = o;
    });
    dispatch(setDraftSelectedOrdersById(next));
    const routeDate = selectedOrders[0]?.deliveryDay;
    navigate("/admin/driver-management/select-driver-vehicle", {
      state: {
        nextPath: "/admin/driver-management/manual-route-optimize",
        returnPath: "/admin/driver-management/create-route-manual",
        routeDate: routeDate || undefined,
      },
    });
  };

  useEffect(() => {
    const invoiceForOrder = (o: (typeof selectedOrders)[number]) => ({
      invoiceUrl: o.invoiceUrl != null && String(o.invoiceUrl).trim() ? String(o.invoiceUrl) : STATIC_ROUTE_ORDER_INVOICE_URL,
      invoiceAmount:
        o.invoiceAmount != null && Number.isFinite(Number(o.invoiceAmount))
          ? Number(o.invoiceAmount)
          : Number.isFinite(Number(o.totalBalance))
            ? Number(o.totalBalance)
            : null,
    });
    const baseStops: ManualMapStop[] = selectedOrders.map((o, idx) => ({
      stopSequence: idx + 1,
      orderNumber: Number(o.srNo),
      C_Number: Number(o.customerNumber ?? 0),
      lat: Number(o.customerLat ?? 0),
      lng: Number(o.customerLng ?? 0),
      ...invoiceForOrder(o),
    }));
    if (persistedManualStops.length === selectedOrders.length && persistedManualStops.length > 0) {
      const byOrder = new Map(selectedOrders.map((o) => [Number(o.srNo), o] as const));
      const enriched: ManualMapStop[] = persistedManualStops.map((s) => {
        const ord = byOrder.get(Number(s.orderNumber));
        const inv = ord ? invoiceForOrder(ord) : { invoiceUrl: STATIC_ROUTE_ORDER_INVOICE_URL, invoiceAmount: null };
        return {
          stopSequence: s.stopSequence,
          orderNumber: Number(s.orderNumber),
          C_Number: Number(s.C_Number),
          lat: Number(s.lat),
          lng: Number(s.lng),
          invoiceUrl: s.invoiceUrl ?? inv.invoiceUrl,
          invoiceAmount: s.invoiceAmount ?? inv.invoiceAmount,
        };
      });
      setManualStops((prev) => (areStopsEqual(prev, enriched) ? prev : enriched));
      return;
    }
    setManualStops((prev) => (areStopsEqual(prev, baseStops) ? prev : baseStops));
  }, [selectedOrders]);

  useEffect(() => {
    dispatch(setManualSelectedDriverId(selectedDriverId || null));
  }, [dispatch, selectedDriverId]);

  useEffect(() => {
    dispatch(setManualSelectedVehicleId(selectedVehicleId || null));
  }, [dispatch, selectedVehicleId]);

  useEffect(() => {
    if (!areStopsEqual(manualStops, normalizeManualStopsFromStore(persistedManualStops))) {
      dispatch(setPersistedManualStops(manualStops));
    }
  }, [dispatch, manualStops, persistedManualStops]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [dRes, vRes, sRes] = await Promise.all([getListOfDrivers(), getListOfVehicles(), getSettingDeliveryAddress()]);
        const dBody = (dRes as any)?.data?.data ?? (dRes as any)?.data ?? [];
        const vBody = (vRes as any)?.data?.data ?? (vRes as any)?.data ?? [];
        const sBody = (sRes as any)?.data?.data ?? (sRes as any)?.data ?? {};
        if (!alive) return;
        setDrivers((Array.isArray(dBody) ? dBody : []).map((d: any, i: number) => ({
          id: String(d?.id ?? d?.Driver_ID ?? i + 1),
          name: String([d?.firstName, d?.lastName].filter(Boolean).join(" ") || d?.name || `Driver ${i + 1}`),
          phone: d?.phoneNumber ?? null,
          driverPicture: d?.driverPicture ?? d?.driver_picture ?? null,
        })));
        setVehicles((Array.isArray(vBody) ? vBody : []).map((v: any, i: number) => ({
          id: String(v?.id ?? v?.Vehicle_ID ?? i + 1),
          label: String(v?.description ?? `Vehicle ${i + 1}`),
          vin: String(v?.vinNumber ?? ""),
          description: String(v?.description ?? ""),
          loadCapacityLbs:
            v?.loadCapacityLbs == null || v?.loadCapacityLbs === ""
              ? undefined
              : Number.isFinite(Number(v?.loadCapacityLbs))
                ? Number(v?.loadCapacityLbs)
                : undefined,
          mileageHours: v?.mileageHours ?? undefined,
        })));
        setOriginDestination(parseDeliveryLatLngFromSettings(sBody));
        const startAddr = sBody?.deliveryStartAddress ?? {};
        const endAddr = sBody?.deliveryEndAddress ?? {};
        const startText = [startAddr?.address, startAddr?.city, startAddr?.state, startAddr?.zip].filter(Boolean).join(", ");
        const endText = [endAddr?.address, endAddr?.city, endAddr?.state, endAddr?.zip].filter(Boolean).join(", ");
        setWarehouseDetail({ start: startText || "-", end: endText || "-" });
      } catch (e: any) {
        showErrorToast(e?.message || "Failed to load manual route data.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || null,
    [vehicles, selectedVehicleId]
  );

  const stopPanelRows = useMemo(() => {
    const byOrder = new Map<number, (typeof selectedOrders)[number]>();
    selectedOrders.forEach((o) => byOrder.set(Number(o.srNo), o));
    return manualStops.map((s, idx) => ({
      ...s,
      idx,
      routeLabel: byOrder.get(Number(s.orderNumber))?.route ?? "—",
      customerName: byOrder.get(Number(s.orderNumber))?.customerName ?? "Customer",
      customerAddress: byOrder.get(Number(s.orderNumber))?.customerAddress ?? "—",
    }));
  }, [manualStops, selectedOrders]);

  const mapPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (originDestination) pts.push([originDestination.origin.lat, originDestination.origin.lng]);
    manualStops.forEach((s) => pts.push([Number(s.lat), Number(s.lng)]));
    if (originDestination) pts.push([originDestination.destination.lat, originDestination.destination.lng]);
    return pts.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  }, [originDestination, manualStops]);

  const mapRouteData = useMemo(() => {
    const polyline = mapPoints.length >= 2 ? encodePolyline(mapPoints) : "";
    const totalKm = pathLengthKm(mapPoints);
    return {
      polyline,
      totalDistanceKm: totalKm,
      totalDistanceMiles: totalKm * 0.621371,
      lastStopToDestinationKm: 0,
      lastStopToDestinationMiles: 0,
    };
  }, [mapPoints]);

  const mapStops = useMemo<OptimizedStop[]>(
    () =>
      manualStops.map((s, idx) => ({
        stopSequence: idx + 1,
        C_Number: Number(s.C_Number),
        orderNumbers: Number(s.orderNumber),
        lat: Number(s.lat),
        lng: Number(s.lng),
        distanceKm: 0,
        cumulativeDistanceKm: 0,
      })),
    [manualStops]
  );

  const confirmedRow = useMemo(() => {
    const d = drivers.find((x) => String(x.id) === String(selectedDriverId));
    const v = vehicles.find((x) => String(x.id) === String(selectedVehicleId));
    return {
      route: selectedOrders.length ? `R-${selectedOrders[0]?.route || "Manual"}` : "—",
      driver: d?.name || "—",
      vehicle: v?.label || "—",
      stops: `${manualStops.length} Stops`,
      miles: `${Number(mapRouteData.totalDistanceMiles ?? 0).toFixed(2)} mi`,
    };
  }, [drivers, vehicles, selectedDriverId, selectedVehicleId, selectedOrders, manualStops.length, mapRouteData.totalDistanceMiles]);

  const onDropIndex = (targetIndex: number) => {
    if (!dragEnabled || draggingIndex == null || draggingIndex === targetIndex) return;
    setManualStops((prev) => {
      const copy = [...prev];
      const [dragged] = copy.splice(draggingIndex, 1);
      copy.splice(targetIndex, 0, dragged);
      return copy.map((s, i) => ({ ...s, stopSequence: i + 1 }));
    });
    setDraggingIndex(null);
  };

  const handleStopOrderDirection = (direction: "asc" | "desc") => {
    if (direction === stopOrderDirection) return;
    setManualStops((prev) => [...prev].reverse().map((s, i) => ({ ...s, stopSequence: i + 1 })));
    setStopOrderDirection(direction);
    setDraggingIndex(null);
  };

  const handleDriverPick = (d: DriverOption) => {
    setPendingDriver(d);
    setVehicleModalOpen(true);
  };

  const handleVehiclePick = (driverId: string, vehicleId: string) => {
    setSelectedDriverId(driverId);
    setSelectedVehicleId(vehicleId);
    setVehicleModalOpen(false);
    setPendingDriver(null);
  };

  const clearDriverVehicle = () => {
    setSelectedDriverId("");
    setSelectedVehicleId("");
  };

  const handleCreate = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      showErrorToast("Please select one driver and one vehicle.");
      return;
    }
    if (!originDestination) {
      showErrorToast("Start/End location is missing in settings.");
      return;
    }
    const day = String(selectedOrders[0]?.deliveryDay ?? "").trim();
    if (!day) {
      showErrorToast("Route day is missing.");
      return;
    }
    setCreateSubmitting(true);
    try {
      await createManualRoute({
        day,
        origin: originDestination.origin,
        destination: originDestination.destination,
        driverId: Number(selectedDriverId),
        truckId: Number(selectedVehicleId),
        orders: manualStops.map((s, idx) => {
          const ord = selectedOrders.find((o) => Number(o.srNo) === Number(s.orderNumber));
          return {
            stopSequence: idx + 1,
            orderNumber: Number(s.orderNumber),
            C_Number: Number(s.C_Number),
            lat: Number(s.lat),
            lng: Number(s.lng),
            invoiceUrl: s.invoiceUrl ?? STATIC_ROUTE_ORDER_INVOICE_URL,
            invoiceAmount: s.invoiceAmount ?? null,
            type: ord?.orderType === 6 ? "return" as const : "regular" as const,
          };
        }),
      });
      setCreateOpen(false);
      dispatch(clearManualRouteDraft());
      showSuccessToast("Manual route created successfully.");
      navigate("/admin/driver-management");
    } catch (e: any) {
      showErrorToast(e?.response?.data?.message ?? e?.message ?? "Failed to create manual route.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handlePrintManifest = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      showErrorToast("Please assign driver and vehicle before printing manifest.");
      return;
    }
    const selectedDriver = drivers.find((x) => String(x.id) === String(selectedDriverId));
    const selectedVehicleRow = vehicles.find((x) => String(x.id) === String(selectedVehicleId));
    const byOrder = new Map<number, (typeof selectedOrders)[number]>();
    selectedOrders.forEach((o) => byOrder.set(Number(o.srNo), o));

    await openRouteManifestPdf({
      title: "Manual Route Manifest",
      warehouse: warehouseDetail,
      drivers: [
        {
          driverName: selectedDriver?.name || "Driver",
          driverPhone: selectedDriver?.phone ?? null,
          vehicleLabel: selectedVehicleRow?.label ?? "Vehicle",
          vehicleVin: selectedVehicleRow?.vin,
          vehicleDescription: selectedVehicleRow?.description,
          dayLabel: selectedOrders[0]?.deliveryDay ?? "",
          totalStops: manualStops.length,
          stops: manualStops.map((s, i) => {
            const o = byOrder.get(Number(s.orderNumber));
            return {
              stopSequence: i + 1,
              customerName: o?.customerName ?? "Customer",
              customerAddress: o?.customerAddress ?? "",
              invoiceNumber: s.orderNumber,
              orderNumber: s.orderNumber,
              phone: o?.customerForLocation?.C_Phone ?? o?.customerForLocation?.C_PhoneMobile ?? "",
              note: "",
            };
          }),
        },
      ],
    });
  };

  if (!selectedOrders.length) {
    return (
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography sx={{ mb: 1 }}>No selected orders found.</Typography>
        <Button variant="contained" onClick={() => navigate("/admin/driver-management/create-route-manual")} sx={{ textTransform: "none" }}>
          Go to Create Route Manually
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: "100%", bgcolor: theme.palette.mode === "light" ? "#F4F7F9" : "background.default", pb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
        <Typography sx={{ fontWeight: 600 }}>Manual Route Optimize</Typography>
        <Button variant="outlined" onClick={goBackToDriverVehicle} sx={{ textTransform: "none" }}>
          Back to drivers
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: mapMaximized ? "1fr" : { xs: "1fr", lg: "240px 1fr 300px" },
          gap: 1.25,
          minWidth: 0,
          alignItems: "stretch",
        }}
      >
        {!mapMaximized && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              p: 1.2,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              height: { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" },
              maxHeight: { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" },
              overflow: "hidden",
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 1, flexShrink: 0 }}>Driver Select (single)</Typography>
            {loading ? (
              <CircularProgress size={22} />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 0.25,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {drivers.map((d) => (
                  <Box
                    key={d.id}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: selectedDriverId === d.id ? "primary.main" : "divider",
                      bgcolor: selectedDriverId === d.id ? "rgba(60, 119, 149, 0.06)" : "background.paper",
                      overflow: "visible",
                    }}
                  >
                    <Box sx={{ p: 1.1 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.1 }}>
                        <Avatar src={resolveAssetUrl(d.driverPicture) || undefined} sx={{ width: 30, height: 30, fontSize: 14 }}>
                          {d.name?.charAt(0) ?? "D"}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{d.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.2 }}>
                            {selectedDriverId === d.id && selectedVehicle ? selectedVehicle.label : "No vehicle assigned yet"}
                          </Typography>
                        </Box>
                        {selectedDriverId === d.id && selectedVehicleId ? (
                          <IconButton size="small" onClick={clearDriverVehicle} sx={{ p: 0.45, color: "error.main" }}>
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        ) : null}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 0.75,
                          flexWrap: "nowrap",
                          mt: 1,
                          pt: 1,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setExpandedDriverDetailId((cur) => (cur === d.id ? null : d.id))}
                          endIcon={<ExpandMoreIcon sx={{ transform: expandedDriverDetailId === d.id ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />}
                          sx={{ textTransform: "none", fontSize: 10.5, px: 0.4, minWidth: 0, flex: "1 1 auto" }}
                        >
                          {expandedDriverDetailId === d.id ? "Hide" : "View"}
                        </Button>
                        <Button
                          variant="contained"
                          disableElevation
                          size="small"
                          onClick={() => handleDriverPick(d)}
                          sx={{
                            color: "#fff",
                            textTransform: "none",
                            fontSize: 10,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            px: 1,
                          }}
                        >
                          {selectedDriverId === d.id && selectedVehicleId ? "Change vehicle" : "Assign vehicle"}
                        </Button>
                      </Box>
                      <Collapse in={expandedDriverDetailId === d.id} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                          <Typography sx={{ fontSize: 11 }}><strong>Name</strong> {d.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: "text.secondary" }}><strong>Phone</strong> {d.phone || "—"}</Typography>
                          <Typography sx={{ fontSize: 10.5, color: "text.secondary", mt: 0.6 }}>
                            <strong>Assigned vehicle</strong> {selectedDriverId === d.id && selectedVehicle ? selectedVehicle.label : "—"}
                          </Typography>
                          {selectedDriverId === d.id && selectedVehicle ? (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>
                                <strong>Description</strong> {selectedVehicle.description || "—"}
                              </Typography>
                              <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>
                                <strong>VIN</strong> {selectedVehicle.vin || "—"}
                              </Typography>
                              <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>
                                <strong>Load (lbs)</strong> {selectedVehicle.loadCapacityLbs ?? "—"}
                              </Typography>
                              <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>
                                <strong>Mileage / hrs</strong> {selectedVehicle.mileageHours ?? "—"}
                              </Typography>
                            </Box>
                          ) : null}
                        </Box>
                      </Collapse>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateRows: mapMaximized ? "minmax(0, 1fr)" : "minmax(0, 1fr) auto",
            gap: 1.25,
            minWidth: 0,
            minHeight: 0,
            width: "100%",
            height: mapMaximized ? { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" } : { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" },
            maxHeight: mapMaximized ? { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" } : { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              overflow: "hidden",
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              position: "relative",
            }}
          >
            <IconButton onClick={() => setMapMaximized((v) => !v)} sx={{ position: "absolute", top: 8, right: 8, zIndex: 1200, bgcolor: "background.paper", boxShadow: 1, p: 0.7 }}>
              {mapMaximized ? <CloseFullscreenIcon sx={{ fontSize: 17 }} /> : <OpenInFullIcon sx={{ fontSize: 17 }} />}
            </IconButton>
            {mapRouteData.polyline ? (
              <RouteMap
                route={mapRouteData}
                optimizedStops={mapStops}
                height="100%"
                width="100%"
                showInfoPanel={false}
              />
            ) : (
              <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>No map data</Typography>
              </Box>
            )}
          </Paper>

          {!mapMaximized && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                overflow: "hidden",
                minHeight: 0,
                height: "auto",
              }}
            >
              <Box sx={{ px: 1.25, py: 0.85, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontWeight: 700, fontSize: 11.5, color: "primary.main", letterSpacing: "0.02em" }}>Confirmed Routes</Typography>
              </Box>
              <Box sx={{ px: 1.25, py: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box sx={{ overflowX: "auto", width: "100%", minWidth: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 90px 90px", minWidth: 580, border: "1px solid", borderColor: "divider", borderRadius: 1.25, overflow: "hidden" }}>
                    {["Route", "Driver", "Vehicle", "Stops", "Miles"].map((h) => (
                      <Box key={h} sx={{ bgcolor: "primary.main", color: "#fff", px: 1.25, py: 0.65, fontSize: 10.5, fontWeight: 700 }}>{h}</Box>
                    ))}
                    <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor: "divider" }}>{confirmedRow.route}</Box>
                    <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor: "divider" }}>{confirmedRow.driver}</Box>
                    <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor: "divider" }}>{confirmedRow.vehicle}</Box>
                    <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor: "divider" }}>{confirmedRow.stops}</Box>
                    <Box sx={{ px: 1.25, py: 0.8, fontSize: 11.5, borderTop: "1px solid", borderColor: "divider" }}>{confirmedRow.miles}</Box>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flexShrink: 0 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePrintManifest}
                    disabled={!selectedDriverId || !selectedVehicleId}
                    sx={{ textTransform: "none", borderRadius: "8px", fontSize: 11.5, py: 0.45, px: 1.25 }}
                  >
                    Print Manifest
                  </Button>
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={() => setCreateOpen(true)}
                    disabled={!selectedDriverId || !selectedVehicleId || createSubmitting}
                    sx={{ textTransform: "none", borderRadius: "8px", color: "#fff", fontSize: 11.5, py: 0.45, px: 1.25 }}
                  >
                    Create Route(s)
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>

        {!mapMaximized && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              height: { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" },
              maxHeight: { xs: "calc(100vh - 260px)", lg: "calc(100vh - 210px)" },
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 1.25, py: 0.9, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 12 }}>Stops in this Route (Master)</Typography>
                <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>{stopPanelRows.length} Stops</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Button
                  size="small"
                  variant={stopOrderDirection === "asc" ? "contained" : "outlined"}
                  disableElevation
                  onClick={() => handleStopOrderDirection("asc")}
                  sx={{ textTransform: "none", minWidth: 40, px: 1, fontSize: 10.5, borderRadius: 1.25, color: stopOrderDirection === "asc" ? "#fff" : "primary.main" }}
                >
                  Asc
                </Button>
                <Button
                  size="small"
                  variant={stopOrderDirection === "desc" ? "contained" : "outlined"}
                  disableElevation
                  onClick={() => handleStopOrderDirection("desc")}
                  sx={{ textTransform: "none", minWidth: 48, px: 1, fontSize: 10.5, borderRadius: 1.25, color: stopOrderDirection === "desc" ? "#fff" : "primary.main" }}
                >
                  Desc
                </Button>
                <IconButton size="small" onClick={() => setDragEnabled((v) => !v)} color={dragEnabled ? "primary" : "default"}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                p: 1,
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {stopPanelRows.map((s, idx) => (
                <Box
                  key={`${s.orderNumber}-${idx}`}
                  draggable={dragEnabled}
                  onDragStart={() => setDraggingIndex(idx)}
                  onDragOver={(e) => dragEnabled && e.preventDefault()}
                  onDrop={() => onDropIndex(idx)}
                  sx={{
                    border: "1px solid",
                    borderColor: draggingIndex === idx ? "primary.main" : "divider",
                    borderRadius: 1,
                    p: 0.9,
                    cursor: dragEnabled ? "grab" : "default",
                    bgcolor: dragEnabled ? "action.hover" : "background.paper",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 0.75,
                  }}
                >
                  {dragEnabled ? (
                    <DragIndicatorIcon
                      sx={{
                        fontSize: 20,
                        color: "text.secondary",
                        flexShrink: 0,
                        mt: 0.15,
                        cursor: "grab",
                        "&:active": { cursor: "grabbing" },
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 11.5 }}>{idx + 1}. {s.customerName}</Typography>
                    <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>{s.customerAddress}</Typography>
                    <Typography sx={{ fontSize: 10.5, color: "text.disabled" }}>
                      Route {s.routeLabel || "—"}  •  Order #{s.orderNumber}  •  C#{s.C_Number}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      <Dialog open={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>Select a Vehicle</DialogTitle>
        <Typography sx={{ px: 3, pt: 0.5, pb: 0.5, fontSize: 13, color: "text.secondary" }}>
          {pendingDriver ? `Choose a vehicle for ${pendingDriver.name}` : "Choose a vehicle"}
        </Typography>
        <DialogContent sx={{ pt: 0.5, px: 2 }}>
          {vehicles.length === 0 ? (
            <Typography sx={{ color: "text.secondary", py: 2, fontSize: 12 }}>No vehicles available.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {vehicles.map((v) => {
                const expanded = expandedVehicleDetailId === v.id;
                return (
                  <Box key={v.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                    <Box sx={{ p: 1.1, pb: 0.8 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <LocalShippingIcon sx={{ fontSize: 22, color: "primary.main", mt: 0.1 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{v.label}</Typography>
                          <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.3 }}>VIN {v.vin || "—"}</Typography>
                        </Box>
                        <Button
                          variant="contained"
                          disableElevation
                          size="small"
                          onClick={() => pendingDriver && handleVehiclePick(pendingDriver.id, v.id)}
                          sx={{color: "#fff", textTransform: "none", fontSize: 10.5, borderRadius: 1.5 }}
                        >
                          Select
                        </Button>
                      </Box>
                      <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setExpandedVehicleDetailId((cur) => (cur === v.id ? null : v.id))}
                          endIcon={<ExpandMoreIcon sx={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />}
                          sx={{ textTransform: "none", fontSize: 11.5, px: 0.5 }}
                        >
                          {expanded ? "Hide specs" : "All vehicle specs"}
                        </Button>
                      </Box>
                    </Box>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 1.1, pb: 1.1, pt: 0, bgcolor: "action.hover", borderTop: "1px solid", borderColor: "divider" }}>
                        <Typography sx={{ fontSize: 11 }}><strong>Description</strong> {v.description || v.label || "—"}</Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}><strong>VIN</strong> {v.vin || "—"}</Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}><strong>Load (lbs)</strong> {v.loadCapacityLbs ?? "—"}</Typography>
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}><strong>Mileage / hrs</strong> {v.mileageHours ?? "—"}</Typography>
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

      <Dialog
        open={createOpen}
        onClose={createSubmitting ? undefined : () => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>Create this route?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.55 }}>
            You are about to save a manual route using the stop order shown on this page
            {manualStops.length > 0
              ? ` (${manualStops.length} ${manualStops.length === 1 ? "stop" : "stops"})`
              : ""}
            , your selected driver and vehicle, and the start and end locations from delivery settings.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createSubmitting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" disableElevation onClick={handleCreate} disabled={createSubmitting} sx={{ color: "#fff", textTransform: "none", borderRadius: "8px" }}>
            {createSubmitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Create route"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualrouteOptimize;
