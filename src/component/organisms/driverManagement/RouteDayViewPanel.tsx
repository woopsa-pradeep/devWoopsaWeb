import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Portal,
  Select,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import MenuIcon from "@mui/icons-material/Menu";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import Tooltip from "@mui/material/Tooltip";
import toast from "react-hot-toast";
import dayjs, { Dayjs } from "dayjs";
import RouteMap, { type LiveMapMarker, type OptimizedStop, type RouteData } from "../../molecules/RouteMap";
import {
  concatEncodedPolylines,
  decodePolyline,
  distancePointToPolylineMeters,
  haversineKm,
  pathLengthKm,
  splitPolylineAtNearestPoint,
} from "../../../utils/polylineEncode";
import {
  CreatedRouteGroup,
  RouteFullChild,
  RouteFullGroup,
  RouteFullStop,
  StopStatus,
  coordsFromDriverLatLongApiResponse,
  getDriverLatLong,
  getRouteFullReport,
  getRouteFullStops,
  isStopResolvedForRouteLine,
  normalizeRouteFullReportData,
  normalizeStopStatus,
  type StopFullDetailsPayload,
  stopStatusDisplayLabel,
  stopStatusSidebarHex,
} from "../../../redux/apis/distrubutor/routeViewApis";
import DeliveredStopDetailModal, { DeliveredStopDetailBody } from "./DeliveredStopDetailModal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { getSettingDeliveryAddress } from "../../../redux/apis/distrubutor/driverManagementApis";
import { openRouteManifestPdf } from "../../../utils/routeManifestPdf";
import { downloadRouteFullStopsPodPdf } from "../../../utils/deliveredStopPodPdf";
import { downloadRouteFullStopsCsv } from "../../../utils/deliveredStopCsv";
import { useAppSelector } from "../../../redux/store";

function splitPolylineByRatio(polyline: string, ratio: number): { done: string | null; remaining: string | null } {
  const points = decodePolyline(polyline);
  if (points.length < 2) return { done: null, remaining: null };
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped <= 0) return { done: null, remaining: polyline };
  if (clamped >= 1) return { done: polyline, remaining: null };
  const cutIdx = Math.max(1, Math.min(points.length - 1, Math.round(clamped * (points.length - 1))));
  const donePts = points.slice(0, cutIdx + 1);
  const remPts = points.slice(cutIdx);
  return {
    done: donePts.length >= 2 ? childEncode(donePts) : null,
    remaining: remPts.length >= 2 ? childEncode(remPts) : null,
  };
}

function childEncode(points: [number, number][]): string {
  if (points.length < 2) return "";
  let prevLat = 0;
  let prevLng = 0;
  let encoded = "";
  for (const [lat, lng] of points) {
    const lat5 = Math.round(lat * 1e5);
    const lng5 = Math.round(lng * 1e5);
    encoded += encodeSigned(lat5 - prevLat);
    encoded += encodeSigned(lng5 - prevLng);
    prevLat = lat5;
    prevLng = lng5;
  }
  return encoded;
}

function encodeSigned(n: number): string {
  let v = n < 0 ? ~(n << 1) : n << 1;
  let out = "";
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}

const VIEW_MASTER_COLORS = [
  "#1E88E5",
  "#E53935",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
  "#00897B",
  "#3949AB",
  "#6D4C41",
];

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return m[s] ?? s.replace(/_/g, " ");
};

const statusColor = (
  s: string
): "default" | "primary" | "success" | "warning" | "error" | "info" => {
  if (s === "in_progress") return "warning";
  if (s === "completed") return "success";
  if (s === "not_started") return "default";
  return "info";
};

const KM_TO_MI = 0.621371;
/** Live driver GPS polling (GET …/drivers/:id/lat-long) when today is selected or a route is in progress. */
const LIVE_DRIVER_POLL_MS = 20_000;
/** When zoomed in on the map, poll more often so the truck feels live at street scale. */
const LIVE_DRIVER_POLL_ZOOMED_MS = 20_000;
const ZOOM_THRESHOLD_FOR_FAST_DRIVER_POLL = 14;

function childRouteIsInProgress(c: RouteFullChild): boolean {
  return String(c.routeStatus ?? "").trim().toLowerCase() === "in_progress";
}

function childRouteIsCompleted(c: RouteFullChild): boolean {
  return String(c.routeStatus ?? "").trim().toLowerCase() === "completed";
}

/** When all routes are completed, skip 20s driver GPS polling; refresh still loads positions via getRouteFullStops + one-shot getDriverLatLong. */
function shouldPollDriverLatLongFromDetail(detail: RouteFullGroup, selectedDate: Dayjs): boolean {
  if (!detail.childRoutes?.length) return false;
  const allCompleted = detail.childRoutes.every((c) => childRouteIsCompleted(c));
  if (allCompleted) return false;
  const selDay = selectedDate.startOf("day");
  const todayDay = dayjs().startOf("day");
  const isCalendarToday = selDay.isSame(todayDay, "day");
  const anyInProgress = detail.childRoutes.some(childRouteIsInProgress);
  return isCalendarToday || anyInProgress;
}

/** Drivers to poll when live GPS interval is active — excludes completed routes (no truck tracking needed). */
function buildLivePollDriverIds(detail: RouteFullGroup, selectedDate: Dayjs): number[] {
  if (!detail.childRoutes?.length) return [];
  if (!shouldPollDriverLatLongFromDetail(detail, selectedDate)) return [];
  const ids: number[] = [];
  const seen: Record<number, true> = {};
  for (const c of detail.childRoutes) {
    if (childRouteIsCompleted(c)) continue;
    const id = c.driver.id;
    if (!seen[id]) {
      seen[id] = true;
      ids.push(id);
    }
  }
  return ids;
}
/** Completed / resolved legs on the map (matches map palette “delivered” gray) */
const LEG_LINE_DELIVERED = "#9CA3AF";
const LEG_LINE_PENDING = "#3388ff";

function routeColorByChildId(children: RouteFullChild[], childId: number): string {
  const sorted = [...children].sort((a, b) => a.id - b.id);
  const idx = sorted.findIndex((c) => c.id === childId);
  if (idx < 0) return LEG_LINE_PENDING;
  return VIEW_MASTER_COLORS[idx % VIEW_MASTER_COLORS.length];
}

function isStopResolvedForRoute(s: RouteFullStop): boolean {
  return isStopResolvedForRouteLine(s.status, s.deliveredAt);
}

/** Full-report export: delivered stops only (same rules as delivery-report table). */
function filterDeliveredFullReportStops(stops: StopFullDetailsPayload[]): StopFullDetailsPayload[] {
  return stops
    .filter((r) => {
      if (r.stop.deliveredAt) return true;
      return normalizeStopStatus(r.stop.status) === StopStatus.DELIVERED;
    })
    .sort((a, b) => a.stop.stopSequence - b.stop.stopSequence);
}

/** Latest resolved stop by sequence (delivered, cancelled, skipped, …) — gray line snaps here. */
function getLastResolvedStopBySequence(stops: RouteFullStop[]): RouteFullStop | null {
  const sorted = [...stops].sort((a, b) => a.stopSequence - b.stopSequence);
  let last: RouteFullStop | null = null;
  for (const s of sorted) {
    if (isStopResolvedForRoute(s)) last = s;
  }
  return last;
}

/**
 * Gray = path to last resolved stop (snapped to polyline); colored = remaining pending work.
 * Falls back to vertex ratio split if coordinates are missing or snap fails.
 */
function splitPolylineForResolvedRouteProgress(
  polyline: string,
  stops: RouteFullStop[]
): { done: string | null; remaining: string | null } {
  const total = stops.length;
  const d = stops.filter(isStopResolvedForRoute).length;
  if (total === 0) return { done: null, remaining: polyline };
  if (d <= 0) return { done: null, remaining: polyline };
  if (d >= total) return { done: polyline, remaining: null };
  const lastStop = getLastResolvedStopBySequence(stops);
  if (!lastStop) return { done: null, remaining: polyline };
  const lat = parseFloat(lastStop.latitude);
  const lng = parseFloat(lastStop.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return splitPolylineByRatio(polyline, d / total);
  }
  const split = splitPolylineAtNearestPoint(polyline, lat, lng);
  if (split.done && split.remaining) return split;
  return splitPolylineByRatio(polyline, d / total);
}

/** Max distance from truck GPS to the “pending” polyline to treat as on-route (typical GPS + map drift). */
const TRUCK_ON_ROUTE_MAX_M = 500;

/**
 * Gray = path through resolved stops, then along the route to the live truck when it sits on the pending leg.
 * Pending work after the truck stays the route color.
 */
function pickRoutePolylineSplit(
  polyline: string,
  stops: RouteFullStop[],
  truckLat: number | null,
  truckLng: number | null
): { done: string | null; remaining: string | null } {
  const d = stops.filter(isStopResolvedForRoute).length;
  const total = stops.length;
  if (total === 0) return { done: null, remaining: polyline };

  const resolvedSplit = splitPolylineForResolvedRouteProgress(polyline, stops);

  if (d >= total) {
    return { done: polyline, remaining: null };
  }

  const truckOk =
    truckLat != null && truckLng != null && Number.isFinite(truckLat) && Number.isFinite(truckLng);
  if (!truckOk || !resolvedSplit.done || !resolvedSplit.remaining) {
    return resolvedSplit;
  }

  const distM = distancePointToPolylineMeters(resolvedSplit.remaining, truckLat, truckLng);
  if (!Number.isFinite(distM) || distM > TRUCK_ON_ROUTE_MAX_M) {
    return resolvedSplit;
  }

  const truckSplit = splitPolylineAtNearestPoint(resolvedSplit.remaining, truckLat, truckLng);
  if (truckSplit.done && truckSplit.remaining) {
    const mergedDone = concatEncodedPolylines(resolvedSplit.done, truckSplit.done);
    if (mergedDone) {
      return { done: mergedDone, remaining: truckSplit.remaining };
    }
  }
  if (truckSplit.done && !truckSplit.remaining) {
    const mergedDone = concatEncodedPolylines(resolvedSplit.done, truckSplit.done);
    if (mergedDone) {
      return { done: mergedDone, remaining: null };
    }
  }

  return resolvedSplit;
}

function dwellMinutesFromStop(s: RouteFullStop): number | null {
  if (!s.arrivedAt || !s.deliveredAt) return null;
  const a = Date.parse(s.arrivedAt);
  const d = Date.parse(s.deliveredAt);
  if (!Number.isFinite(a) || !Number.isFinite(d)) return null;
  return Math.max(0, (d - a) / 60000);
}

function formatDwellForUi(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatShortTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Master vs per-route map — same idea as RouteOptimization map chips (view routes only). */
function ViewRouteMapChips({
  childRoutes,
  active,
  onChange,
}: {
  childRoutes: RouteFullChild[];
  active: "master" | number;
  onChange: (v: "master" | number) => void;
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const sorted = [...childRoutes].sort((a, b) => a.id - b.id);
  if (sorted.length < 2) return null;

  if (isCompact) {
    const sel = active === "master" ? "master" : String(active);
    return (
      <FormControl
        size="small"
        sx={{
          position: "absolute",
          left: 8,
          top: 10,
          zIndex: 1190,
          width: { xs: "calc(100% - 96px)", sm: "min(260px, calc(100% - 96px))" },
          maxWidth: 280,
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Select
          value={sel}
          onChange={(e) => {
            const v = String(e.target.value);
            if (v === "master") onChange("master");
            else onChange(Number(v));
          }}
          displayEmpty
          inputProps={{ "aria-label": "Map view" }}
          sx={{ fontSize: 12, fontWeight: 600, height: 34, "& .MuiSelect-select": { py: 0.65 } }}
        >
          <MenuItem value="master" sx={{ fontSize: 12 }}>
            Master (all routes)
          </MenuItem>
          {sorted.map((c, idx) => (
            <MenuItem
              key={c.id}
              value={String(c.id)}
              sx={{ fontSize: 12, color: VIEW_MASTER_COLORS[idx % VIEW_MASTER_COLORS.length] }}
            >
              {`${c.driver.firstName} ${c.driver.lastName}`.trim() || c.routeNumber}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={0.5}
      useFlexGap
      flexWrap="wrap"
      sx={{ position: "absolute", left: 8, top: 10, zIndex: 1190, maxWidth: { xs: "100%", md: "calc(100% - 120px)" }, pr: 1 }}
    >
      <Chip
        label="Master"
        size="small"
        onClick={() => onChange("master")}
        color={active === "master" ? "primary" : "default"}
        variant={active === "master" ? "filled" : "outlined"}
        sx={{
          fontWeight: 600,
          fontSize: "0.7rem",
          ...(active === "master" ? { color: "#fff", "& .MuiChip-label": { color: "#fff" } } : {}),
        }}
      />
      {sorted.map((c, idx) => {
        const driverLabel = `${c.driver.firstName} ${c.driver.lastName}`.trim();
        return (
          <Chip
            key={c.id}
            label={driverLabel || c.routeNumber}
            size="small"
            onClick={() => onChange(c.id)}
            title={c.routeNumber}
            sx={{
              fontWeight: 600,
              fontSize: "0.65rem",
              borderColor: VIEW_MASTER_COLORS[idx % VIEW_MASTER_COLORS.length],
              color: active === c.id ? "#fff" : VIEW_MASTER_COLORS[idx % VIEW_MASTER_COLORS.length],
              bgcolor: active === c.id ? VIEW_MASTER_COLORS[idx % VIEW_MASTER_COLORS.length] : "transparent",
            }}
            variant={active === c.id ? "filled" : "outlined"}
          />
        );
      })}
    </Stack>
  );
}

interface RouteDayViewPanelProps {
  routeGroups: CreatedRouteGroup[];
  selectedDate: Dayjs;
  onRefresh: () => void;
  listLoading?: boolean;
  hideTitleRow?: boolean;
  /** Standalone page: restore selection after refresh */
  initialGroupId?: number | null;
  initialChildRouteId?: number | null;
  onSelectionSync?: (sel: { groupId: number; childRouteId: number }) => void;
  /** Called after route-full-stops load succeeds (refresh, date change, group change) — e.g. refetch delivery report table. */
  onRouteStopsLoaded?: () => void;
}

const chipDenseSx = {
  height: 22,
  fontSize: "0.65rem",
  fontWeight: 500,
  "& .MuiChip-label": { px: 0.75 },
} as const;

interface RouteGroupsInnerProps {
  routeGroups: CreatedRouteGroup[];
  selectedChildRouteId: number | null;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number) => void;
  setSelectedChildRouteId: (id: number) => void;
  setViewMapTarget?: (t: "master" | number) => void;
  onPickRoute?: () => void;
}

/** Compact chips for route group column — weight ≤500 */
const groupMetaChipSx = {
  height: 20,
  maxWidth: "100%",
  "& .MuiChip-label": {
    px: 0.45,
    fontSize: "0.6rem",
    fontWeight: 500,
    lineHeight: 1.2,
  },
} as const;

const childRowChipSx = {
  height: 21,
  "& .MuiChip-label": { px: 0.5, fontSize: "0.625rem", fontWeight: 500 },
} as const;

const RouteGroupsInner: React.FC<RouteGroupsInnerProps> = ({
  routeGroups,
  selectedChildRouteId,
  selectedGroupId,
  setSelectedGroupId,
  setSelectedChildRouteId,
  setViewMapTarget,
  onPickRoute,
}) => {
  const theme = useTheme();
  const totalChildRoutes = useMemo(
    () => routeGroups.reduce((n, g) => n + (g.childRoutes?.length ?? 0), 0),
    [routeGroups]
  );

  const prevSelectedGroupRef = useRef<number | null>(null);
  const [expandedPanelId, setExpandedPanelId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedGroupId == null) return;
    if (prevSelectedGroupRef.current !== selectedGroupId) {
      setExpandedPanelId(selectedGroupId);
      prevSelectedGroupRef.current = selectedGroupId;
    }
  }, [selectedGroupId]);

  return (
    <>
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Route groups ({routeGroups.length})
      </Typography>
      <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 400, lineHeight: 1.3, mt: 0.1, mb: 0.5 }}>
        {totalChildRoutes} driver route{totalChildRoutes === 1 ? "" : "s"} total
      </Typography>
      <Stack spacing={0.65} sx={{ width: "100%" }}>
        {routeGroups.map((group) => {
          const children = group.childRoutes ?? [];
          const isGroupActive = group.id === selectedGroupId;
          const isExpanded = expandedPanelId === group.id;

          return (
            <Accordion
              key={group.id}
              disableGutters
              elevation={0}
              expanded={isExpanded}
              onChange={(_, next) => setExpandedPanelId(next ? group.id : null)}
              sx={{
                width: "100%",
                borderRadius: "8px !important",
                border: "1px solid",
                borderColor: isGroupActive ? "primary.light" : "divider",
                borderLeftWidth: 2,
                borderLeftStyle: "solid",
                borderLeftColor: "primary.main",
                bgcolor: "background.paper",
                overflow: "hidden",
                boxShadow: "none",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: "text.secondary" }} />}
                aria-controls={`route-group-${group.id}`}
                id={`route-group-h-${group.id}`}
                sx={{
                  px: { xs: 0.45, sm: 0.5 },
                  py: { xs: 0.35, sm: 0.4 },
                  minHeight: 0,
                  "& .MuiAccordionSummary-content": { my: 0.5, overflow: "hidden" },
                }}
              >
                <Stack sx={{ width: "100%", minWidth: 0 }} spacing={0.35}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "flex-start" }}
                    justifyContent="space-between"
                    gap={0.5}
                    sx={{ width: "100%" }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 400,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          lineHeight: 1.2,
                        }}
                      >
                        Route group
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "text.primary",
                          lineHeight: 1.25,
                          mt: 0.1,
                          wordBreak: "break-word",
                        }}
                        title={group.groupNumber}
                      >
                        {group.groupNumber}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{
                        gap: 0.35,
                        flexShrink: 0,
                        justifyContent: { xs: "flex-start", sm: "flex-end" },
                        maxWidth: { sm: "46%" },
                      }}
                    >
                      <Chip
                        size="small"
                        label={`${group.totalRoutes ?? children.length} route${(group.totalRoutes ?? children.length) === 1 ? "" : "s"}`}
                        sx={groupMetaChipSx}
                      />
                      <Chip size="small" label={`${group.totalStops} stops`} variant="outlined" sx={groupMetaChipSx} />
                      <Chip
                        size="small"
                        label={statusLabel(group.status)}
                        color={statusColor(group.status)}
                        sx={groupMetaChipSx}
                      />
                    </Stack>
                  </Stack>
                  <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 400, lineHeight: 1.25 }}>
                    {group.totalMiles} mi
                  </Typography>
                </Stack>
              </AccordionSummary>

              <AccordionDetails
                id={`route-group-${group.id}`}
                sx={{
                  px: { xs: 0.45, sm: 0.5 },
                  pt: 0,
                  pb: { xs: 0.45, sm: 0.5 },
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: (t) => alpha(theme.palette.background.default, t.palette.mode === "light" ? 0.45 : 0.15),
                }}
              >
                <Box
                  sx={{
                    pl: 0.65,
                    ml: 0.25,
                    borderLeft: "1px solid",
                    borderColor: "divider",
                    pt: 0.1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      mb: 0.35,
                    }}
                  >
                    Driver routes ({children.length})
                  </Typography>
                  <Stack spacing={0.35} sx={{ width: "100%" }}>
                    {children.map((child) => {
                      const isSel = child.id === selectedChildRouteId && group.id === selectedGroupId;
                      const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
                        new Date(child.day + "T12:00:00")
                      );
                      return (
                        <Paper
                          key={child.id}
                          elevation={0}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedGroupId(group.id);
                              setSelectedChildRouteId(child.id);
                              setViewMapTarget?.(child.id);
                              onPickRoute?.();
                            }
                          }}
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setSelectedChildRouteId(child.id);
                            setViewMapTarget?.(child.id);
                            onPickRoute?.();
                          }}
                          sx={{
                            p: { xs: 0.4, sm: 0.45 },
                            borderRadius: 0.75,
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: isSel ? "primary.main" : "divider",
                            bgcolor: isSel
                              ? (t: any) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.07 : 0.12)
                              : "background.paper",
                            transition: "border-color 0.15s, background 0.15s",
                            "&:hover": {
                              borderColor: "primary.light",
                              bgcolor: (t: any) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.03 : 0.06),
                            },
                            "&:focus-visible": {
                              outline: "2px solid",
                              outlineColor: "primary.main",
                              outlineOffset: 1,
                            },
                          }}
                        >
                          <Stack direction="row" spacing={0.5} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: 0.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                color: "primary.main",
                                flexShrink: 0,
                              }}
                            >
                              <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{ fontSize: "0.75rem", fontWeight: 500, lineHeight: 1.25 }}
                                title={child.routeNumber}
                              >
                                {`${child.driver.firstName} ${child.driver.lastName}`.trim() || child.routeNumber}
                              </Typography>
                              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 400, lineHeight: 1.25, mt: 0.1 }}>
                                {dayName} · {child.routeNumber}
                              </Typography>
                              <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ mt: 0.25, gap: 0.35 }}>
                                <Chip
                                  size="small"
                                  label={statusLabel(child.routeStatus)}
                                  color={statusColor(child.routeStatus)}
                                  sx={{ ...chipDenseSx, ...childRowChipSx }}
                                />
                                <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 400 }}>
                                  {child.totalStops} stops
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </>
  );
};

interface StopsInnerProps {
  detailLoading: boolean;
  detailError: string | null;
  stopsSorted: RouteFullStop[];
  chipDense: typeof chipDenseSx;
  onDeliveredStopClick?: (stop: RouteFullStop) => void;
  /** Master map: one section per driver; when set, replaces flat `stopsSorted` list. */
  masterSections?: Array<{ routeId: number; driverLabel: string; stops: RouteFullStop[] }> | null;
  listTitle?: string;
  /** Right side of the list title row (e.g. collapse control); uses space-between with the title. */
  listTitleAction?: React.ReactNode;
  highlightedStopId?: number | null;
  onStopRowSelect?: (stop: RouteFullStop) => void;
}

const StopsInner: React.FC<StopsInnerProps> = ({
  detailLoading,
  detailError,
  stopsSorted,
  chipDense,
  onDeliveredStopClick,
  masterSections = null,
  listTitle = "Stops in this route",
  listTitleAction,
  highlightedStopId = null,
  onStopRowSelect,
}) => (
  <>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 0.75,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "text.secondary",
          minWidth: 0,
        }}
      >
        {listTitle}
      </Typography>
      {listTitleAction != null ? <Box sx={{ flexShrink: 0 }}>{listTitleAction}</Box> : null}
    </Box>
    {detailLoading && (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    )}
    {!detailLoading && detailError && (
      <Typography color="error" sx={{ fontSize: "0.8125rem", fontWeight: 400 }}>
        {detailError}
      </Typography>
    )}
    {!detailLoading &&
      !detailError &&
      (!masterSections || masterSections.length === 0) &&
      stopsSorted.length === 0 && (
      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", fontWeight: 400 }}>No stops for this route.</Typography>
    )}
    {!detailLoading &&
      !detailError &&
      masterSections &&
      masterSections.length > 0 &&
      !masterSections.some((sec) => sec.stops.length > 0) && (
        <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", fontWeight: 400 }}>No stops to show.</Typography>
      )}
    {!detailLoading && !detailError && masterSections && masterSections.some((sec) => sec.stops.length > 0) && (
      <Stack spacing={1.25} sx={{ overflow: "auto", pr: 0.25, flex: 1, pb: 0.25 }}>
        {masterSections.map((sec) =>
          sec.stops.length === 0 ? null : (
            <Box key={sec.routeId}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "primary.main", mb: 0.5, letterSpacing: "0.02em" }}>
                {sec.driverLabel}
              </Typography>
              <Stack spacing={0.5}>
                {sec.stops.map((s, idx) => {
                  const dwellM = dwellMinutesFromStop(s);
                  const statusHex = stopStatusSidebarHex(s.status, s.deliveredAt);
                  const badgeBg = alpha(statusHex, 0.18);
                  const badgeFg = statusHex;
                  const isDeliveredOnly = normalizeStopStatus(s.status) === StopStatus.DELIVERED;
                  const openPod = isDeliveredOnly && onDeliveredStopClick;
                  const rowSelect = openPod
                    ? () => onDeliveredStopClick!(s)
                    : onStopRowSelect
                      ? () => onStopRowSelect(s)
                      : undefined;
                  const isHi = highlightedStopId != null && s.id === highlightedStopId;
                  return (
                    <Paper
                      key={s.id}
                      id={onStopRowSelect ? `max-stop-${s.id}` : undefined}
                      variant="outlined"
                      onClick={rowSelect}
                      role={rowSelect ? "button" : undefined}
                      tabIndex={rowSelect ? 0 : undefined}
                      onKeyDown={
                        rowSelect
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                rowSelect();
                              }
                            }
                          : undefined
                      }
                      sx={{
                        p: { xs: 0.65, sm: 0.75 },
                        borderRadius: 1.25,
                        bgcolor: "background.paper",
                        borderColor: isHi ? "primary.main" : s.isLastStop ? "primary.light" : "divider",
                        cursor: rowSelect ? "pointer" : "default",
                        transition: "box-shadow 0.15s, border-color 0.15s",
                        boxShadow: isHi ? (t: any) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.35)}` : undefined,
                        ...(openPod
                          ? {
                              "&:hover": {
                                borderColor: "primary.main",
                                boxShadow: (t: any) => `0 0 0 1px ${alpha(t.palette.primary.main, 0.35)}`,
                              },
                            }
                          : onStopRowSelect
                            ? {
                                "&:hover": {
                                  borderColor: "primary.light",
                                  boxShadow: (t: any) => `0 0 0 1px ${alpha(t.palette.primary.main, 0.2)}`,
                                },
                              }
                            : {}),
                      }}
                    >
                      <Stack direction="row" spacing={0.75} alignItems="flex-start">
                        <Typography
                          sx={{
                            minWidth: 20,
                            height: 20,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            fontWeight: 500,
                            bgcolor: badgeBg,
                            color: badgeFg,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.35 }}>{s.C_Name}</Typography>
                          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 400, lineHeight: 1.35, mt: 0.15 }}>
                            {[s.C_Address, s.C_City, s.C_State, s.C_Zip].filter(Boolean).join(", ")}
                          </Typography>
                          <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 500, lineHeight: 1.3, mt: 0.2 }}>
                            Invoice #{s.orderNumber}
                          </Typography>
                          <Stack direction="row" spacing={0.35} flexWrap="wrap" sx={{ mt: 0.4, gap: 0.35 }}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={stopStatusDisplayLabel(s.status)}
                              sx={{
                                ...chipDense,
                                height: 20,
                                borderColor: statusHex,
                                color: statusHex,
                                bgcolor: alpha(statusHex, 0.08),
                                "& .MuiChip-label": { color: statusHex, fontWeight: 600 },
                              }}
                            />
                            {s.isLastStop && (
                              <Chip
                                size="small"
                                color="primary"
                                label="Last"
                                sx={{
                                  ...chipDense,
                                  height: 20,
                                  color: "#fff",
                                  "& .MuiChip-label": { color: "#fff" },
                                }}
                              />
                            )}
                          </Stack>
                          {(s.arrivedAt || s.deliveredAt) && (
                            <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 400, mt: 0.35, lineHeight: 1.35 }}>
                              {s.arrivedAt ? `Started ${formatShortTime(s.arrivedAt)}` : ""}
                              {s.arrivedAt && s.deliveredAt ? " · " : ""}
                              {s.deliveredAt ? `Delivered ${formatShortTime(s.deliveredAt)}` : ""}
                              {dwellM != null ? ` · At stop ${formatDwellForUi(dwellM)}` : ""}
                            </Typography>
                          )}
                          {openPod && (
                            <Typography sx={{ fontSize: "0.62rem", color: "primary.main", fontWeight: 600, mt: 0.5 }}>
                              View POD details — tap stop
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          )
        )}
      </Stack>
    )}
    {!detailLoading && !detailError && !masterSections && stopsSorted.length > 0 && (
      <Stack spacing={0.5} sx={{ overflow: "auto", pr: 0.25, flex: 1, pb: 0.25 }}>
        {stopsSorted.map((s, idx) => {
          const dwellM = dwellMinutesFromStop(s);
          const statusHex = stopStatusSidebarHex(s.status, s.deliveredAt);
          const badgeBg = alpha(statusHex, 0.18);
          const badgeFg = statusHex;
          const isDeliveredOnly = normalizeStopStatus(s.status) === StopStatus.DELIVERED;
          const openPod = isDeliveredOnly && onDeliveredStopClick;
          const rowSelect = openPod
            ? () => onDeliveredStopClick!(s)
            : onStopRowSelect
              ? () => onStopRowSelect(s)
              : undefined;
          const isHi = highlightedStopId != null && s.id === highlightedStopId;
          return (
          <Paper
            key={s.id}
            id={onStopRowSelect ? `max-stop-${s.id}` : undefined}
            variant="outlined"
            onClick={rowSelect}
            role={rowSelect ? "button" : undefined}
            tabIndex={rowSelect ? 0 : undefined}
            onKeyDown={
              rowSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      rowSelect();
                    }
                  }
                : undefined
            }
            sx={{
              p: { xs: 0.65, sm: 0.75 },
              borderRadius: 1.25,
              bgcolor: "background.paper",
              borderColor: isHi ? "primary.main" : s.isLastStop ? "primary.light" : "divider",
              cursor: rowSelect ? "pointer" : "default",
              transition: "box-shadow 0.15s, border-color 0.15s",
              boxShadow: isHi ? (t: any) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.35)}` : undefined,
              ...(openPod
                ? {
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: (t: any) => `0 0 0 1px ${alpha(t.palette.primary.main, 0.35)}`,
                    },
                  }
                : onStopRowSelect
                  ? {
                      "&:hover": {
                        borderColor: "primary.light",
                        boxShadow: (t: any) => `0 0 0 1px ${alpha(t.palette.primary.main, 0.2)}`,
                      },
                    }
                  : {}),
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="flex-start">
              <Typography
                sx={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  bgcolor: badgeBg,
                  color: badgeFg,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.35 }}>{s.C_Name}</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 400, lineHeight: 1.35, mt: 0.15 }}>
                  {[s.C_Address, s.C_City, s.C_State, s.C_Zip].filter(Boolean).join(", ")}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 500, lineHeight: 1.3, mt: 0.2 }}>
                  Invoice #{s.orderNumber}
                </Typography>
                <Stack direction="row" spacing={0.35} flexWrap="wrap" sx={{ mt: 0.4, gap: 0.35 }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={stopStatusDisplayLabel(s.status)}
                    sx={{
                      ...chipDense,
                      height: 20,
                      borderColor: statusHex,
                      color: statusHex,
                      bgcolor: alpha(statusHex, 0.08),
                      "& .MuiChip-label": { color: statusHex, fontWeight: 600 },
                    }}
                  />
                  {s.isLastStop && (
                    <Chip
                      size="small"
                      color="primary"
                      label="Last"
                      sx={{
                        ...chipDense,
                        height: 20,
                        color: "#fff",
                        "& .MuiChip-label": { color: "#fff" },
                      }}
                    />
                  )}
                </Stack>
                {(s.arrivedAt || s.deliveredAt) && (
                  <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 400, mt: 0.35, lineHeight: 1.35 }}>
                    {s.arrivedAt ? `Started ${formatShortTime(s.arrivedAt)}` : ""}
                    {s.arrivedAt && s.deliveredAt ? " · " : ""}
                    {s.deliveredAt ? `Delivered ${formatShortTime(s.deliveredAt)}` : ""}
                    {dwellM != null ? ` · At stop ${formatDwellForUi(dwellM)}` : ""}
                  </Typography>
                )}
                {openPod && (
                  <Typography sx={{ fontSize: "0.62rem", color: "primary.main", fontWeight: 600, mt: 0.5 }}>
                    View POD details — tap stop
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        );
        })}
      </Stack>
    )}
  </>
);

const RouteDayViewPanel: React.FC<RouteDayViewPanelProps> = ({
  routeGroups,
  selectedDate,
  onRefresh,
  listLoading,
  hideTitleRow = false,
  initialGroupId = null,
  initialChildRouteId = null,
  onSelectionSync,
  onRouteStopsLoaded,
}) => {
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RouteFullGroup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedChildRouteId, setSelectedChildRouteId] = useState<number | null>(null);
  const [mapMaximized, setMapMaximized] = useState(false);
  const [maximizeStopsDrawerOpen, setMaximizeStopsDrawerOpen] = useState(false);
  const [mapHighlightedStopId, setMapHighlightedStopId] = useState<number | null>(null);
  /** Master = all drivers in group on map (colors); number = one child route polyline */
  const [viewMapTarget, setViewMapTarget] = useState<"master" | number>("master");
  const lastUrlGroupRef = useRef<number | null>(null);
  const lastUrlChildRef = useRef<number | null>(null);
  const [detailRefreshTick, setDetailRefreshTick] = useState(0);
  const [podDetailStopId, setPodDetailStopId] = useState<number | null>(null);
  /** Fullscreen + POD: hide middle "Stops on map" column so detail uses full panel width. */
  const [maximizeStopsListCollapsed, setMaximizeStopsListCollapsed] = useState(false);
  const [routeReportLoading, setRouteReportLoading] = useState(false);
  /** Fresh coords from GET `/distrubutor/drivers/:id/lat-long` when viewing today; keyed by driver id. */
  const [liveDriverLatLng, setLiveDriverLatLng] = useState<Record<number, { lat: number; lng: number }>>({});
  /** From RouteMap `onViewportChange`; used to speed up polling when the user zooms in. */
  const [mapZoomLevel, setMapZoomLevel] = useState<number | null>(null);
  const warehouseHeader = useAppSelector((s) => s.auth.wareHouseDetail?.[0] ?? null);

  /** Live GPS interval: today or in-progress routes, but never when every route is completed; completed child routes are omitted from the poll list. */
  const livePollDriverIds = useMemo(() => {
    if (!detail?.childRoutes?.length) return [];
    return buildLivePollDriverIds(detail, selectedDate);
  }, [detail, selectedDate]);

  /** Stable while driver set unchanged — avoids resetting the poll interval when `detail` refreshes (new object, same drivers). */
  const livePollDriverIdsKey = useMemo(() => {
    if (livePollDriverIds.length === 0) return "";
    return [...livePollDriverIds].sort((a, b) => a - b).join(",");
  }, [livePollDriverIds]);

  const livePollDriverIdsRef = useRef(livePollDriverIds);
  livePollDriverIdsRef.current = livePollDriverIds;

  const onRouteStopsLoadedRef = useRef(onRouteStopsLoaded);
  onRouteStopsLoadedRef.current = onRouteStopsLoaded;

  /** True while POD modal or maximize stop drawer is open — avoid `detailLoading` so refetches do not flash spinners / feel like overlays closed. */
  const stopOverlayUiOpenRef = useRef(false);
  stopOverlayUiOpenRef.current = podDetailStopId != null || maximizeStopsDrawerOpen;

  useEffect(() => {
    setLiveDriverLatLng({});
    setMapZoomLevel(null);
  }, [selectedGroupId]);

  useEffect(() => {
    if (!mapMaximized) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mapMaximized]);

  useEffect(() => {
    if (!mapMaximized) {
      setMaximizeStopsDrawerOpen(false);
      setMapHighlightedStopId(null);
    }
  }, [mapMaximized]);

  useEffect(() => {
    if (!maximizeStopsDrawerOpen || mapHighlightedStopId == null) return;
    const t = window.setTimeout(() => {
      document.getElementById(`max-stop-${mapHighlightedStopId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [maximizeStopsDrawerOpen, mapHighlightedStopId]);

  /** If POD modal was open then user enters fullscreen map, show the same detail in the expanded drawer instead of losing it. */
  useEffect(() => {
    if (mapMaximized && podDetailStopId != null) {
      setMaximizeStopsDrawerOpen(true);
    }
  }, [mapMaximized, podDetailStopId]);

  useEffect(() => {
    if (podDetailStopId == null) setMaximizeStopsListCollapsed(false);
  }, [podDetailStopId]);

  const driverLocationPollMs = useMemo(() => {
    if (mapZoomLevel == null) return LIVE_DRIVER_POLL_MS;
    return mapZoomLevel >= ZOOM_THRESHOLD_FOR_FAST_DRIVER_POLL ? LIVE_DRIVER_POLL_ZOOMED_MS : LIVE_DRIVER_POLL_MS;
  }, [mapZoomLevel]);

  useEffect(() => {
    if (livePollDriverIdsKey === "") {
      setLiveDriverLatLng({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      const ids = livePollDriverIdsRef.current;
      if (ids.length === 0) return;

      const stopsPromise =
        selectedGroupId != null
          ? getRouteFullStops(selectedGroupId)
              .then((res) => res.data.data as RouteFullGroup)
              .catch(() => null)
          : Promise.resolve(null);

      const entriesPromise = Promise.all(
        ids.map(async (driverId) => {
          try {
            const res = await getDriverLatLong(driverId);
            const coords = coordsFromDriverLatLongApiResponse(res);
            return coords ? ([driverId, coords] as const) : null;
          } catch {
            return null;
          }
        })
      );

      const [detailData, entries] = await Promise.all([stopsPromise, entriesPromise]);
      if (cancelled) return;

      if (detailData != null) {
        setDetail(detailData);
        onRouteStopsLoadedRef.current?.();
      }

      setLiveDriverLatLng((prev) => {
        const next: Record<number, { lat: number; lng: number }> = {};
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i];
          const e = entries[i];
          if (e) next[id] = e[1];
          else if (prev[id]) next[id] = prev[id];
        }
        return next;
      });
    };
    void run();
    const id = window.setInterval(() => void run(), driverLocationPollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [livePollDriverIdsKey, selectedGroupId, driverLocationPollMs]);

  useEffect(() => {
    if (initialGroupId == null) lastUrlGroupRef.current = null;
  }, [initialGroupId]);

  useEffect(() => {
    if (initialChildRouteId == null) lastUrlChildRef.current = null;
  }, [initialChildRouteId]);

  useEffect(() => {
    if (isLgUp) setMobileDrawerOpen(false);
  }, [isLgUp]);

  useEffect(() => {
    if (!routeGroups.length) {
      setSelectedGroupId(null);
      return;
    }
    setSelectedGroupId((prev) => {
      if (initialGroupId != null && routeGroups.some((g) => g.id === initialGroupId)) {
        if (lastUrlGroupRef.current !== initialGroupId) {
          lastUrlGroupRef.current = initialGroupId;
          return initialGroupId;
        }
      }
      if (prev != null && routeGroups.some((g) => g.id === prev)) return prev;
      return routeGroups[0].id;
    });
  }, [routeGroups, initialGroupId]);

  useEffect(() => {
    if (selectedGroupId == null) return;
    let cancelled = false;
    (async () => {
      const silentRefresh = stopOverlayUiOpenRef.current;
      if (!silentRefresh) setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await getRouteFullStops(selectedGroupId);
        if (!cancelled) {
          const nextDetail = res.data.data as RouteFullGroup;
          setDetail(nextDetail);
          onRouteStopsLoadedRef.current?.();

          const pollIds = buildLivePollDriverIds(nextDetail, selectedDate);
          if (pollIds.length === 0 && nextDetail.childRoutes.length > 0) {
            const allIds = Array.from(new Set(nextDetail.childRoutes.map((c) => c.driver.id)));
            void (async () => {
              const entries = await Promise.all(
                allIds.map(async (driverId) => {
                  try {
                    const r = await getDriverLatLong(driverId);
                    const coords = coordsFromDriverLatLongApiResponse(r);
                    return coords ? ([driverId, coords] as const) : null;
                  } catch {
                    return null;
                  }
                })
              );
              if (cancelled) return;
              setLiveDriverLatLng((prev) => {
                const next: Record<number, { lat: number; lng: number }> = {};
                for (let i = 0; i < allIds.length; i++) {
                  const id = allIds[i];
                  const e = entries[i];
                  if (e) next[id] = e[1];
                  else if (prev[id]) next[id] = prev[id];
                }
                return next;
              });
            })();
          }
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setDetailError("Could not load route stops.");
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, detailRefreshTick, selectedDate]);

  const handleRefreshAll = useCallback(() => {
    onRefresh();
    if (selectedGroupId != null) setDetailRefreshTick((v) => v + 1);
  }, [onRefresh, selectedGroupId]);

  const handleViewStopMarkerClick = useCallback((stopId: number) => {
    setMaximizeStopsDrawerOpen(true);
    setMapHighlightedStopId(stopId);
  }, []);

  useEffect(() => {
    if (!detail?.childRoutes?.length) {
      setSelectedChildRouteId(null);
      return;
    }
    setSelectedChildRouteId((prev) => {
      if (initialChildRouteId != null && detail.childRoutes.some((c) => c.id === initialChildRouteId)) {
        if (lastUrlChildRef.current !== initialChildRouteId) {
          lastUrlChildRef.current = initialChildRouteId;
          return initialChildRouteId;
        }
      }
      if (prev != null && detail.childRoutes.some((c) => c.id === prev)) return prev;
      return detail.childRoutes[0].id;
    });
  }, [detail, initialChildRouteId]);

  useEffect(() => {
    if (!onSelectionSync) return;
    if (selectedGroupId == null || selectedChildRouteId == null) return;
    onSelectionSync({ groupId: selectedGroupId, childRouteId: selectedChildRouteId });
  }, [selectedGroupId, selectedChildRouteId, onSelectionSync]);

  useEffect(() => {
    if (!detail?.childRoutes?.length) return;
    if (detail.childRoutes.length < 2) {
      setViewMapTarget(detail.childRoutes[0].id);
    }
  }, [detail]);

  const selectedChild = useMemo(() => {
    if (!detail || selectedChildRouteId == null) return null;
    return detail.childRoutes.find((c) => c.id === selectedChildRouteId) ?? null;
  }, [detail, selectedChildRouteId]);

  const masterStopSections = useMemo(() => {
    if (!detail?.childRoutes?.length) return null;
    if (detail.childRoutes.length < 2 || viewMapTarget !== "master") return null;
    return [...detail.childRoutes].sort((a, b) => a.id - b.id).map((child) => ({
      routeId: child.id,
      driverLabel: `${child.driver.firstName} ${child.driver.lastName}`.trim() || child.routeNumber,
      stops: [...(child.stops ?? [])].sort((a, b) => a.stopSequence - b.stopSequence),
    }));
  }, [detail, viewMapTarget]);

  const stopsForMapDrawerFlat = useMemo(() => {
    if (!detail?.childRoutes?.length) return [];
    if (detail.childRoutes.length >= 2 && viewMapTarget === "master") return [];
    const child = detail.childRoutes.find((c) => c.id === viewMapTarget) ?? selectedChild;
    if (!child?.stops?.length) return [];
    return [...child.stops].sort((a, b) => a.stopSequence - b.stopSequence);
  }, [detail, viewMapTarget, selectedChild]);

  const stopsSorted = useMemo(() => {
    if (!selectedChild?.stops?.length) return [];
    return [...selectedChild.stops].sort((a, b) => a.stopSequence - b.stopSequence);
  }, [selectedChild]);

  const showAllStopsPdfCsv = useMemo(
    () =>
      (selectedChild?.stops ?? []).filter(
        (s) => normalizeStopStatus(s.status) === StopStatus.DELIVERED
      ).length >= 2,
    [selectedChild]
  );

  const routeMapPayload = useMemo((): {
    route: RouteData;
    optimizedStops: OptimizedStop[];
    extraPolylines: Array<{ polyline: string; color: string }>;
    segmentRouteColor: string;
    liveMarkers: LiveMapMarker[];
  } | null => {
    if (!detail?.childRoutes?.length) return null;
    const nChildren = detail.childRoutes.length;

    if (nChildren >= 2 && viewMapTarget === "master") {
      const segments: Array<{ polyline: string; color: string }> = [];
      const markers: LiveMapMarker[] = [];
      const optimizedAll: OptimizedStop[] = [];
      const sortedChildren = [...detail.childRoutes].sort((a, b) => a.id - b.id);
      sortedChildren.forEach((child, idx) => {
        const stops = [...(child.stops ?? [])].sort((a, b) => a.stopSequence - b.stopSequence);
        if (stops.length === 0 || !child.polyline) return;
        const color = VIEW_MASTER_COLORS[idx % VIEW_MASTER_COLORS.length];

        const live = liveDriverLatLng[child.driver.id];
        const drvLat = live ? live.lat : Number(child.driver.currentLatitude);
        const drvLng = live ? live.lng : Number(child.driver.currentLongitude);
        const drvOk = Number.isFinite(drvLat) && Number.isFinite(drvLng);

        const split = pickRoutePolylineSplit(
          child.polyline,
          stops,
          drvOk ? drvLat : null,
          drvOk ? drvLng : null
        );
        const resolvedCount = stops.filter(isStopResolvedForRoute).length;
        if (split.done && !split.remaining) {
          segments.push({ polyline: child.polyline, color: LEG_LINE_DELIVERED });
        } else if (!split.done && split.remaining) {
          segments.push({ polyline: child.polyline, color });
        } else if (split.done && split.remaining) {
          segments.push({
            polyline: split.done,
            color: resolvedCount > 0 ? LEG_LINE_DELIVERED : color,
          });
          segments.push({ polyline: split.remaining, color });
        } else {
          segments.push({ polyline: child.polyline, color });
        }

        let cumKm = 0;
        const optimizedStops: OptimizedStop[] = stops.map((s, i) => {
          const lat = parseFloat(s.latitude);
          const lng = parseFloat(s.longitude);
          let legKm = 0;
          if (i > 0) {
            const prev = stops[i - 1];
            const plat = parseFloat(prev.latitude);
            const plng = parseFloat(prev.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(plat) && Number.isFinite(plng)) {
              legKm = haversineKm(plat, plng, lat, lng);
              cumKm += legKm;
            }
          }
          const dwellM = dwellMinutesFromStop(s);
          const cn = String(s.C_Name ?? "").trim();
          return {
            stopSequence: s.stopSequence,
            C_Number: s.C_Number,
            orderNumbers: s.orderNumber,
            lat,
            lng,
            distanceKm: legKm,
            cumulativeDistanceKm: cumKm,
            distanceMiles: legKm * KM_TO_MI,
            cumulativeDistanceMiles: cumKm * KM_TO_MI,
            arrivedAt: s.arrivedAt,
            deliveredAt: s.deliveredAt,
            stopStatus: s.status,
            dwellMinutes: dwellM,
            routeLabel: child.routeNumber,
            customerName: cn || undefined,
            stopId: s.id,
          };
        });
        optimizedAll.push(...optimizedStops);
        if (drvOk) {
          markers.push({
            lat: drvLat,
            lng: drvLng,
            label: `${child.routeNumber} - ${child.driver.firstName} ${child.driver.lastName}`.trim(),
            color,
            routeNumber: child.routeNumber,
            driverName: `${child.driver.firstName} ${child.driver.lastName}`.trim(),
            driverPhone: child.driver.phoneNumber,
            vehicleDescription: child.vehicle.description,
            vehicleVin: child.vehicle.vinNumber,
          });
        }
      });
      if (segments.length === 0) return null;
      return {
        route: {
          polyline: segments[0].polyline,
          totalDistanceKm: pathLengthKm(decodePolyline(segments[0].polyline)),
          lastStopToDestinationKm: 0,
        },
        optimizedStops: optimizedAll,
        extraPolylines: segments.slice(1),
        segmentRouteColor: segments[0].color,
        liveMarkers: markers,
      };
    }

    const childForMap =
      viewMapTarget !== "master"
        ? detail.childRoutes.find((c) => c.id === viewMapTarget) ?? selectedChild
        : selectedChild;
    if (!childForMap?.stops?.length) return null;
    const stopsForMap = [...childForMap.stops].sort((a, b) => a.stopSequence - b.stopSequence);
    if (!childForMap.polyline) return null;
    const routeColor = routeColorByChildId(detail.childRoutes, childForMap.id);
    let cumKm = 0;
    const optimizedStops: OptimizedStop[] = stopsForMap.map((s, i) => {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      let legKm = 0;
      if (i > 0) {
        const prev = stopsForMap[i - 1];
        const plat = parseFloat(prev.latitude);
        const plng = parseFloat(prev.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(plat) && Number.isFinite(plng)) {
          legKm = haversineKm(plat, plng, lat, lng);
          cumKm += legKm;
        }
      }
      const dwellM = dwellMinutesFromStop(s);
      const cn = String(s.C_Name ?? "").trim();
      return {
        stopSequence: s.stopSequence,
        C_Number: s.C_Number,
        orderNumbers: s.orderNumber,
        lat,
        lng,
        distanceKm: legKm,
        cumulativeDistanceKm: cumKm,
        distanceMiles: legKm * KM_TO_MI,
        cumulativeDistanceMiles: cumKm * KM_TO_MI,
        arrivedAt: s.arrivedAt,
        deliveredAt: s.deliveredAt,
        stopStatus: s.status,
        dwellMinutes: dwellM,
        routeLabel: childForMap.routeNumber,
        customerName: cn || undefined,
        stopId: s.id,
      };
    });

    const truckLive = liveDriverLatLng[childForMap.driver.id];
    const truckLat = truckLive ? truckLive.lat : Number(childForMap.driver.currentLatitude);
    const truckLng = truckLive ? truckLive.lng : Number(childForMap.driver.currentLongitude);
    const truckOk = Number.isFinite(truckLat) && Number.isFinite(truckLng);

    const split = pickRoutePolylineSplit(
      childForMap.polyline,
      stopsForMap,
      truckOk ? truckLat : null,
      truckOk ? truckLng : null
    );
    if (!split.done && !split.remaining) return null;

    const resolvedStopCount = stopsForMap.filter(isStopResolvedForRoute).length;

    let routePolyline = childForMap.polyline;
    let extraPolylines: Array<{ polyline: string; color: string }> = [];
    let segmentColor = routeColor;

    if (split.done && !split.remaining) {
      routePolyline = childForMap.polyline;
      extraPolylines = [];
      segmentColor = LEG_LINE_DELIVERED;
    } else if (!split.done && split.remaining) {
      routePolyline = childForMap.polyline;
      extraPolylines = [];
      segmentColor = routeColor;
    } else if (split.done && split.remaining) {
      routePolyline = split.done;
      extraPolylines = [{ polyline: split.remaining, color: routeColor }];
      segmentColor = resolvedStopCount > 0 ? LEG_LINE_DELIVERED : routeColor;
    } else {
      return null;
    }

    return {
      route: {
        polyline: routePolyline,
        totalDistanceKm: pathLengthKm(decodePolyline(childForMap.polyline)),
        lastStopToDestinationKm: 0,
      },
      optimizedStops,
      extraPolylines,
      segmentRouteColor: segmentColor,
      liveMarkers: truckOk
        ? [
            {
              lat: truckLat,
              lng: truckLng,
              label: `${childForMap.routeNumber} - ${childForMap.driver.firstName} ${childForMap.driver.lastName}`.trim(),
              color: routeColor,
              routeNumber: childForMap.routeNumber,
              driverName: `${childForMap.driver.firstName} ${childForMap.driver.lastName}`.trim(),
              driverPhone: childForMap.driver.phoneNumber,
              vehicleDescription: childForMap.vehicle.description,
              vehicleVin: childForMap.vehicle.vinNumber,
            },
          ]
        : [],
    };
  }, [detail, viewMapTarget, selectedChild, liveDriverLatLng]);

  const formattedTitleDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(selectedDate.toDate()),
    [selectedDate]
  );

  const driverName = selectedChild
    ? `${selectedChild.driver.firstName} ${selectedChild.driver.lastName}`.trim()
    : "—";

  const primary = theme.palette.primary.main;

  const handleMapViewChange = useCallback(
    (v: "master" | number) => {
      setViewMapTarget(v);
      if (v !== "master" && detail) {
        const ch = detail.childRoutes.find((c) => c.id === v);
        if (ch) {
          setSelectedChildRouteId(v);
          setSelectedGroupId(detail.id);
        }
      }
    },
    [detail]
  );

  const sectionHeading = {
    fontSize: "0.65rem",
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
  };

  const chipDense = chipDenseSx;

  const printManifest = useCallback(
    async (scope: "selected" | "all") => {
      if (!detail?.childRoutes?.length) return;
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
      const source =
        scope === "selected" && selectedChild
          ? [selectedChild]
          : [...detail.childRoutes].sort((a, b) => a.id - b.id);
      await openRouteManifestPdf({
        title: scope === "selected" ? "Route Manifest (Selected)" : "Route Manifest (All Driver Routes)",
        warehouse,
        drivers: source.map((child) => ({
          driverName: `${child.driver.firstName} ${child.driver.lastName}`.trim() || "Driver",
          driverPhone: child.driver.phoneNumber ?? null,
          vehicleLabel: child.vehicle.description || `Vehicle ${child.vehicle.id}`,
          vehicleVin: child.vehicle.vinNumber,
          vehicleDescription: child.vehicle.description,
          dayLabel: child.day || selectedDate.format("YYYY-MM-DD"),
          totalStops: child.totalStops,
          totalMiles: child.totalMiles,
          totalDurationInMinutes: child.totalDurationInMinutes,
          estimatedTimeNote: true,
          stops: [...(child.stops ?? [])]
            .sort((a, b) => a.stopSequence - b.stopSequence)
            .map((s) => ({
              stopSequence: s.stopSequence,
              customerName: s.C_Name,
              customerAddress: [s.C_Address, s.C_City, s.C_State, s.C_Zip].filter(Boolean).join(", "),
              invoiceNumber: s.orderNumber,
              orderNumber: s.orderNumber,
              phone: s.C_Phone ?? "",
              note: "",
            })),
        })),
      });
    },
    [detail, selectedChild, selectedDate]
  );

  /** Master map → all driver manifests; one driver on map → that driver only (matches map chips). */
  const printManifestFromMapView = useCallback(() => {
    void printManifest(viewMapTarget === "master" ? "all" : "selected");
  }, [printManifest, viewMapTarget]);

  const printManifestDisabled =
    !detail?.childRoutes?.length || (viewMapTarget !== "master" && !selectedChild);

  const loadRouteFullReportStops = useCallback(async (): Promise<StopFullDetailsPayload[] | null> => {
    if (selectedChildRouteId == null) return null;
    const res = await getRouteFullReport(selectedChildRouteId);
    const stops = normalizeRouteFullReportData(res.data?.data);
    if (!stops.length) {
      toast.error("No stop details in route report.");
      return null;
    }
    return stops;
  }, [selectedChildRouteId]);

  const handleDownloadRouteFullPdf = useCallback(async () => {
    if (selectedChildRouteId == null) return;
    setRouteReportLoading(true);
    try {
      const stops = await loadRouteFullReportStops();
      if (!stops) return;
      const delivered = filterDeliveredFullReportStops(stops);
      if (!delivered.length) {
        toast.error("No delivered stops to include in the PDF.");
        return;
      }
      await downloadRouteFullStopsPodPdf(delivered, warehouseHeader);
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Could not load route report or generate PDF.");
    } finally {
      setRouteReportLoading(false);
    }
  }, [selectedChildRouteId, warehouseHeader, loadRouteFullReportStops]);

  const handleDownloadRouteFullCsv = useCallback(async () => {
    if (selectedChildRouteId == null) return;
    setRouteReportLoading(true);
    try {
      const stops = await loadRouteFullReportStops();
      if (!stops) return;
      const delivered = filterDeliveredFullReportStops(stops);
      if (!delivered.length) {
        toast.error("No delivered stops to include in the CSV.");
        return;
      }
      downloadRouteFullStopsCsv(delivered);
      toast.success("CSV downloaded.");
    } catch {
      toast.error("Could not load route report or export CSV.");
    } finally {
      setRouteReportLoading(false);
    }
  }, [selectedChildRouteId, loadRouteFullReportStops]);

  /** Fullscreen: 55% map / 45% panel only when POD detail is open; list-only uses a fixed ~400px panel like the old drawer. */
  const maximizeWideDetailSplit = maximizeStopsDrawerOpen && podDetailStopId != null;

  const mapPaperInner = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...(mapMaximized ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : {}),
      }}
    >
      {detail && !detailLoading && detail.childRoutes.length >= 2 && (
        <ViewRouteMapChips childRoutes={detail.childRoutes} active={viewMapTarget} onChange={handleMapViewChange} />
      )}
      {mapMaximized && detail && !detailLoading && (
        <Tooltip title={maximizeStopsDrawerOpen ? "Hide stop list" : "Show stop list"}>
          <span>
            <IconButton
              aria-label={maximizeStopsDrawerOpen ? "Hide stop list" : "Show stop list"}
              onClick={() => {
                setMaximizeStopsDrawerOpen((v) => {
                  if (v) {
                    setMapHighlightedStopId(null);
                    setPodDetailStopId(null);
                  }
                  return !v;
                });
              }}
              sx={{
                position: "absolute",
                top: 10,
                right: 48,
                zIndex: 1200,
                bgcolor: "background.paper",
                boxShadow: 1,
                p: 0.7,
              }}
            >
              <MenuIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Tooltip title={mapMaximized ? "Minimize map" : "Maximize map"}>
        <span>
          <IconButton
            aria-label="toggle map size"
            onClick={() => setMapMaximized((v) => !v)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1200,
              bgcolor: "background.paper",
              boxShadow: 1,
              p: 0.7,
            }}
          >
            {mapMaximized ? <CloseFullscreenIcon sx={{ fontSize: 17 }} /> : <OpenInFullIcon sx={{ fontSize: 17 }} />}
          </IconButton>
        </span>
      </Tooltip>
      {detailLoading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            inset: 0,
            zIndex: 5,
            bgcolor: (t) => alpha(t.palette.background.paper, 0.75),
          }}
        >
          <CircularProgress size={28} />
        </Box>
      )}
      {/* Keep RouteMap mounted while detail reloads so layer/zoom are not reset on refresh (overlay covers map during loading). */}
      {routeMapPayload && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            flex: mapMaximized ? 1 : undefined,
            minHeight: mapMaximized ? 0 : undefined,
            // minHeight: mapMaximized ? { xs: "min(64vh, 600px)", lg: "min(74vh, 680px)" } : { xs: 240, lg: 360 },
          }}
        >
          <RouteMap
            key={`map-${selectedChildRouteId}-${routeMapPayload.route.polyline.slice(0, 24)}-${routeMapPayload.extraPolylines.length}`}
            route={routeMapPayload.route}
            optimizedStops={routeMapPayload.optimizedStops}
            routeColor={routeMapPayload.segmentRouteColor}
            extraPolylines={routeMapPayload.extraPolylines}
            liveMarkers={routeMapPayload.liveMarkers}
            height="100%"
            width="100%"
            showInfoPanel={false}
            viewMode
            mapViewIdentityKey={
              selectedGroupId != null
                ? `group-${selectedGroupId}-target-${String(viewMapTarget)}`
                : `target-${String(viewMapTarget)}`
            }
            onViewportChange={({ zoom }) => setMapZoomLevel(zoom)}
            onViewStopMarkerClick={mapMaximized ? handleViewStopMarkerClick : undefined}
            highlightedStopId={mapMaximized ? mapHighlightedStopId : null}
          />
        </Box>
      )}
      {!detailLoading && !routeMapPayload && !detailError && (
        <Box
          sx={{
            minHeight: mapMaximized ? { xs: "min(50vh, 400px)", lg: "min(58vh, 480px)" } : 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            px: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", fontWeight: 400, textAlign: "center" }}>
            No coordinates to show on the map.
          </Typography>
        </Box>
      )}
    </Box>
  );

  const paperShellLg = {
    borderRadius: 2,
    border: 1,
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: (t: typeof theme) => (t.palette.mode === "light" ? "0 1px 3px rgba(15,23,42,0.06)" : "0 1px 3px rgba(0,0,0,0.2)"),
  };

  return (
    <>
    <Stack spacing={{ xs: 1, sm: 1.25 }} sx={{ width: "100%", minHeight: { xs: 240, sm: 280 } }}>
      {hideTitleRow ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
            flexWrap: "wrap",
            minHeight: 36,
          }}
        >
          {!isLgUp && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FormatListBulletedIcon sx={{ fontSize: 18 }} />}
              onClick={() => setMobileDrawerOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.8125rem",
                borderRadius: 2,
                py: 0.75,
                px: 1.25,
                flexShrink: 0,
              }}
            >
              Routes &amp; stops
            </Button>
          )}
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={0.75}
            alignItems="center"
            justifyContent={{ xs: "flex-start", sm: "flex-end" }}
            sx={{
              flex: 1,
              minWidth: { xs: "100%", sm: "min(100%, 560px)" },
              maxWidth: "100%",
            }}
          >
            <Tooltip
              title={
                viewMapTarget === "master"
                  ? "Print manifests for every driver route in this group"
                  : "Print manifest for the driver selected on the map"
              }
            >
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={printManifestDisabled}
                  onClick={printManifestFromMapView}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.75rem",
                    flexShrink: 0,
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    textAlign: "center",
                    lineHeight: 1.25,
                    py: 0.75,
                  }}
                >
                  Print manifest
                </Button>
              </span>
            </Tooltip>
            {showAllStopsPdfCsv && (
              <>
                <Tooltip title="Uses route full-report: same delivery PDF as one stop, one stop per page">
                  <span style={{ display: "inline-flex", flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!selectedChild || routeReportLoading}
                      onClick={handleDownloadRouteFullPdf}
                      startIcon={
                        routeReportLoading ? <CircularProgress size={12} color="inherit" /> : <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                      }
                      sx={{
                        textTransform: "none",
                        fontSize: "0.75rem",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {routeReportLoading ? "Working…" : "Delivered stops — PDF"}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Uses route full-report: same columns as single-stop CSV, all stops in one file">
                  <span style={{ display: "inline-flex", flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!selectedChild || routeReportLoading}
                      onClick={handleDownloadRouteFullCsv}
                      startIcon={
                        routeReportLoading ? <CircularProgress size={12} color="inherit" /> : <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
                      }
                      sx={{
                        textTransform: "none",
                        fontSize: "0.75rem",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {routeReportLoading ? "Working…" : "Delivered stops — CSV"}
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
            {selectedChild && !isLgUp && (
              <Chip
                size="small"
                label={`${selectedChild.driver.firstName} ${selectedChild.driver.lastName}`.trim() || selectedChild.routeNumber}
                sx={{ fontWeight: 500, fontSize: "0.7rem", maxWidth: "min(100%, 200px)", flexShrink: 0 }}
              />
            )}
            <Tooltip title="Refresh list">
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                <IconButton
                  onClick={handleRefreshAll}
                  disabled={!!listLoading}
                  size="small"
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1.5,
                    color: "text.primary",
                    p: 0.5,
                  }}
                  aria-label="Refresh routes"
                >
                  {listLoading ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ flexShrink: 0, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: "1rem", lineHeight: 1.35 }}>
              View routes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: "0.8125rem", fontWeight: 400 }}>
              {formattedTitleDate}
            </Typography>
          </Box>
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={0.75}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ minWidth: { xs: "100%", sm: "auto" }, maxWidth: "100%" }}
          >
            <Tooltip
              title={
                viewMapTarget === "master"
                  ? "Print manifests for every driver route in this group"
                  : "Print manifest for the driver selected on the map"
              }
            >
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={printManifestDisabled}
                  onClick={printManifestFromMapView}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.75rem",
                    flexShrink: 0,
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    textAlign: "center",
                    lineHeight: 1.25,
                    py: 0.75,
                  }}
                >
                  Print manifest
                </Button>
              </span>
            </Tooltip>
            {showAllStopsPdfCsv && (
              <>
                <Tooltip title="Uses route full-report: same delivery PDF as one stop, one stop per page">
                  <span style={{ display: "inline-flex", flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!selectedChild || routeReportLoading}
                      onClick={handleDownloadRouteFullPdf}
                      startIcon={
                        routeReportLoading ? <CircularProgress size={12} color="inherit" /> : <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                      }
                      sx={{ textTransform: "none", fontSize: "0.75rem", flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      {routeReportLoading ? "Working…" : "Delivered stops — PDF"}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Uses route full-report: same columns as single-stop CSV, all stops in one file">
                  <span style={{ display: "inline-flex", flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!selectedChild || routeReportLoading}
                      onClick={handleDownloadRouteFullCsv}
                      startIcon={
                        routeReportLoading ? <CircularProgress size={12} color="inherit" /> : <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
                      }
                      sx={{ textTransform: "none", fontSize: "0.75rem", flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      {routeReportLoading ? "Working…" : "Delivered stops — CSV"}
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
            <Tooltip title="Refresh list">
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                <IconButton
                  onClick={handleRefreshAll}
                  disabled={!!listLoading}
                  size="small"
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, color: "text.primary", p: 0.5 }}
                  aria-label="Refresh routes"
                >
                  {listLoading ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      )}

      <Drawer
        anchor="left"
        open={mobileDrawerOpen && !isLgUp}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: false }}
        PaperProps={{
          sx: {
            width: "min(100vw - 16px, 400px)",
            maxWidth: "100%",
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.04 : 0.08),
          }}
        >
          <Typography sx={{ fontWeight: 500, fontSize: "0.9375rem" }}>Route details</Typography>
          <IconButton size="small" onClick={() => setMobileDrawerOpen(false)} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ overflow: "auto", flex: 1, p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 0.5, sm: 0.65 },
              ...paperShellLg,
              bgcolor: (t) => (t.palette.mode === "light" ? alpha(primary, 0.03) : alpha(theme.palette.primary.main, 0.06)),
            }}
          >
            <RouteGroupsInner
              routeGroups={routeGroups}
              selectedChildRouteId={selectedChildRouteId}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              setSelectedChildRouteId={setSelectedChildRouteId}
              setViewMapTarget={setViewMapTarget}
              onPickRoute={() => setMobileDrawerOpen(false)}
            />
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              flex: 1,
              minHeight: 160,
              display: "flex",
              flexDirection: "column",
              ...paperShellLg,
            }}
          >
            <StopsInner
              detailLoading={detailLoading}
              detailError={detailError}
              stopsSorted={stopsSorted}
              chipDense={chipDense}
              onDeliveredStopClick={(stop) => setPodDetailStopId(stop.id)}
            />
          </Paper>
        </Box>
      </Drawer>

      {mapMaximized ? (
        <Portal>
          <Paper
            elevation={24}
            sx={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              maxWidth: "100vw",
              maxHeight: "100vh",
              zIndex: (t) => t.zIndex.modal,
              borderRadius: 0,
              border: 0,
              overflow: "hidden",
              bgcolor: "grey.100",
              display: "flex",
              flexDirection: "column",
              boxShadow: (t) => (t.palette.mode === "light" ? "0 8px 32px rgba(15,23,42,0.2)" : "0 8px 32px rgba(0,0,0,0.45)"),
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  flex: {
                    xs:
                      maximizeStopsDrawerOpen && maximizeWideDetailSplit
                        ? "1 1 55%"
                        : maximizeStopsDrawerOpen
                          ? "1 1 auto"
                          : "1 1 auto",
                    md:
                      maximizeStopsDrawerOpen && maximizeWideDetailSplit
                        ? "0 0 55%"
                        : maximizeStopsDrawerOpen
                          ? "1 1 0%"
                          : "1 1 auto",
                  },
                  width: {
                    md:
                      maximizeStopsDrawerOpen && maximizeWideDetailSplit
                        ? "55%"
                        : "auto",
                  },
                  maxWidth: {
                    md:
                      maximizeStopsDrawerOpen && maximizeWideDetailSplit
                        ? "55%"
                        : "none",
                  },
                  flexGrow: { md: maximizeStopsDrawerOpen && !maximizeWideDetailSplit ? 1 : undefined },
                  minHeight: {
                    xs: maximizeStopsDrawerOpen && maximizeWideDetailSplit ? "min(52vh, 55%)" : 0,
                    md: 0,
                  },
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {mapPaperInner}
              </Box>
              {maximizeStopsDrawerOpen && (
                <Box
                  sx={{
                    flex: {
                      xs: maximizeWideDetailSplit ? "1 1 45%" : "0 0 auto",
                      md: maximizeWideDetailSplit ? "0 0 45%" : "0 0 auto",
                    },
                    width: {
                      md: maximizeWideDetailSplit ? "45%" : "min(100vw - 16px, 400px)",
                      xs: "100%",
                    },
                    maxWidth: {
                      md: maximizeWideDetailSplit ? "45%" : "min(100vw - 16px, 400px)",
                      xs: "100%",
                    },
                    minWidth: 0,
                    minHeight: { xs: maximizeWideDetailSplit ? "min(45vh, 380px)" : 0, md: 0 },
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                    borderLeftWidth: { xs: 0, md: 1 },
                    borderLeftStyle: "solid",
                    borderLeftColor: (t) => t.palette.divider,
                    borderTopWidth: { xs: 1, md: 0 },
                    borderTopStyle: "solid",
                    borderTopColor: (t) => t.palette.divider,
                    overflow: { xs: maximizeWideDetailSplit ? "auto" : "hidden", md: "hidden" },
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.04 : 0.08),
                      flexShrink: 0,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                      {podDetailStopId != null && (
                        <IconButton
                          size="small"
                          onClick={() => setPodDetailStopId(null)}
                          aria-label="Back to stop list"
                          sx={{ flexShrink: 0 }}
                        >
                          <ArrowBackIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Typography sx={{ fontWeight: 500, fontSize: "0.9375rem" }} noWrap component="span">
                        {podDetailStopId != null ? "Delivery detail" : "Stops"}
                      </Typography>
                    </Stack>
                    {podDetailStopId != null && maximizeStopsListCollapsed && (
                      <Tooltip title="Show stop list" placement="bottom">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => setMaximizeStopsListCollapsed(false)}
                            aria-label="Show stop list"
                            sx={{ flexShrink: 0 }}
                          >
                            <KeyboardDoubleArrowRightIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setMaximizeStopsDrawerOpen(false);
                        setMapHighlightedStopId(null);
                        setPodDetailStopId(null);
                      }}
                      aria-label="Close stop list"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: {
                        xs: "column",
                        md: podDetailStopId != null ? "row" : "column",
                      },
                      minHeight: { xs: podDetailStopId != null ? "min(36vh, 280px)" : 0, md: 0 },
                      overflow: { xs: podDetailStopId != null ? "auto" : "hidden", md: "hidden" },
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <Box
                      sx={{
                        flex: podDetailStopId != null ? { xs: "none", md: undefined } : 1,
                        width: { xs: "100%", md: podDetailStopId != null ? 280 : "100%" },
                        minWidth: 0,
                        maxWidth: { md: podDetailStopId != null ? 300 : "none" },
                        flexShrink: 0,
                        maxHeight: {
                          xs: podDetailStopId != null ? "min(32vh, 260px)" : "none",
                          md: "none",
                        },
                        minHeight: { xs: podDetailStopId != null ? 120 : 0, md: 0 },
                        overflow: "auto",
                        borderRightWidth: { md: podDetailStopId != null && !maximizeStopsListCollapsed ? 1 : 0 },
                        borderRightStyle: "solid",
                        borderRightColor: (t) => t.palette.divider,
                        borderBottomWidth: { xs: podDetailStopId != null && !maximizeStopsListCollapsed ? 1 : 0, md: 0 },
                        borderBottomStyle: "solid",
                        borderBottomColor: (t) => t.palette.divider,
                        p: 1.5,
                        display: podDetailStopId != null && maximizeStopsListCollapsed ? "none" : "flex",
                        flexDirection: "column",
                      }}
                    >
                      <StopsInner
                        detailLoading={detailLoading}
                        detailError={detailError}
                        stopsSorted={stopsForMapDrawerFlat}
                        masterSections={masterStopSections}
                        listTitle={masterStopSections ? "All driver stops" : "Stops on map"}
                        listTitleAction={
                          podDetailStopId != null && !maximizeStopsListCollapsed ? (
                            <Tooltip title="Hide stop list" placement="bottom">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setMaximizeStopsListCollapsed(true)}
                                  aria-label="Hide stop list"
                                  sx={{ p: 0.35 }}
                                >
                                  <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : undefined
                        }
                        chipDense={chipDense}
                        onDeliveredStopClick={(stop) => setPodDetailStopId(stop.id)}
                        highlightedStopId={mapHighlightedStopId}
                        onStopRowSelect={(s) => setMapHighlightedStopId(s.id)}
                      />
                    </Box>
                    {podDetailStopId != null && (
                      <Box
                        sx={{
                          flex: { xs: "1 1 auto", md: 1 },
                          minWidth: 0,
                          width: maximizeStopsListCollapsed ? "100%" : undefined,
                          minHeight: { xs: "min(48vh, 420px)", md: 0 },
                          display: "flex",
                          flexDirection: "column",
                          overflow: { xs: "auto", md: "hidden" },
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        {warehouseHeader && (
                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              color: "text.secondary",
                              lineHeight: 1.35,
                              px: 1.5,
                              pt: 1.25,
                              flexShrink: 0,
                            }}
                          >
                            {warehouseHeader.D_Name}
                            {" · "}
                            {[warehouseHeader.D_Addr1, [warehouseHeader.D_City, warehouseHeader.D_State].filter(Boolean).join(", ")]
                              .filter(Boolean)
                              .join(" · ")}
                            {warehouseHeader.D_Phone ? ` · ${warehouseHeader.D_Phone}` : ""}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            flex: 1,
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            px: 1.5,
                            pb: 1.5,
                            pt: warehouseHeader ? 0.75 : 1.25,
                          }}
                        >
                          <DeliveredStopDetailBody
                            stopId={podDetailStopId}
                            onClose={() => setPodDetailStopId(null)}
                            layoutVariant="drawer"
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Portal>
      ) : (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 1.25, lg: 2 }} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
          {isLgUp && (
            <>
              <Paper
                elevation={0}
                sx={{
                  flex: { lg: "0 0 min(280px, 32%)" },
                  minWidth: { lg: 220 },
                  maxWidth: { lg: 340 },
                  width: "100%",
                  p: { xs: 0.5, sm: 0.65 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  maxHeight: { lg: "min(72vh, 520px)" },
                  overflow: "auto",
                  ...paperShellLg,
                  bgcolor: (t) => (t.palette.mode === "light" ? alpha(primary, 0.03) : alpha(theme.palette.primary.main, 0.06)),
                }}
              >
                <RouteGroupsInner
                  routeGroups={routeGroups}
                  selectedChildRouteId={selectedChildRouteId}
                  selectedGroupId={selectedGroupId}
                  setSelectedGroupId={setSelectedGroupId}
                  setSelectedChildRouteId={setSelectedChildRouteId}
                  setViewMapTarget={setViewMapTarget}
                />
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  flex: { lg: "1 1 240px" },
                  minWidth: 0,
                  p: { xs: 0.75, sm: 1 },
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: { lg: "min(72vh, 520px)" },
                  overflow: "hidden",
                  ...paperShellLg,
                }}
              >
                <StopsInner
                  detailLoading={detailLoading}
                  detailError={detailError}
                  stopsSorted={stopsSorted}
                  chipDense={chipDense}
                  onDeliveredStopClick={(stop) => setPodDetailStopId(stop.id)}
                />
              </Paper>
            </>
          )}

          <Stack
            spacing={1.25}
            sx={{
              flex: { lg: "1 1 min(360px, 44%)" },
              minWidth: 0,
              width: "100%",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                overflow: "hidden",
                position: "relative",
                bgcolor: "grey.100",
                height: { xs: 280, sm: 320, lg: 420 },
                boxShadow: (t) => (t.palette.mode === "light" ? "0 2px 8px rgba(15,23,42,0.08)" : "0 2px 12px rgba(0,0,0,0.25)"),
              }}
            >
              {mapPaperInner}
            </Paper>

            {selectedChild && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.125, sm: 1.25 },
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.02 : 0.06),
                  boxShadow: (t) => (t.palette.mode === "light" ? "0 1px 3px rgba(15,23,42,0.06)" : "0 1px 3px rgba(0,0,0,0.2)"),
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1.25, sm: 2 }}
                  divider={
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" }, borderColor: "divider" }} />
                  }
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ ...sectionHeading, mb: 0.35 }}>Driver</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                      <PersonOutlineIcon sx={{ fontSize: 18, color: "primary.main", opacity: 0.9 }} />
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.35 }}>{driverName}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35 }}>
                      <PhoneOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 400 }}>
                        {selectedChild.driver.phoneNumber ?? "—"}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 400, mt: 0.35 }}>
                      {selectedChild.vehicle.description}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ ...sectionHeading, mb: 0.35 }}>Planned route</Typography>
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mt: 0.25, lineHeight: 1.35 }}>
                      {stopsSorted.length} total stops
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 400, mt: 0.35, lineHeight: 1.4 }}>
                      {statusLabel(selectedChild.routeStatus)} — scheduled for execution.
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 400, mt: 0.5, lineHeight: 1.4 }}>
                      {selectedChild.routeNumber} · {selectedChild.totalMiles} mi
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Stack>
      )}
    </Stack>

    <DeliveredStopDetailModal
      open={podDetailStopId != null && !mapMaximized}
      stopId={podDetailStopId}
      onClose={() => setPodDetailStopId(null)}
    />
    </>
  );
};

export default RouteDayViewPanel;
