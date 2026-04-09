import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import toast from "react-hot-toast";
import { useAppSelector } from "../../../redux/store";
import {
  getRouteFullReport,
  getStopFullDetails,
  normalizeRouteFullReportData,
  type StopFullDetailsPayload,
  type StopFullDetailsPOD,
  type StopFullDetailsStop,
} from "../../../redux/apis/distrubutor/routeViewApis";
import { downloadDeliveredStopPodPdf } from "../../../utils/deliveredStopPodPdf";
import { downloadDeliveredStopCsv } from "../../../utils/deliveredStopCsv";
import {
  formatApiDateMMDDYYYYDisplay,
  formatApiDateTimeMMDDYYYY,
  formatFullDetailsDateField,
} from "../../../utils/formatApiDate";

/** Warehouse / checker images from stop (`epickOrderDetail` or snake_case from some payloads). */
function epickWarehouseImages(stop: StopFullDetailsStop): string[] {
  const raw =
    stop.epickOrderDetail?.images ??
    (stop as unknown as { epick_order_detail?: { images?: unknown } }).epick_order_detail?.images;
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
}

/** `GET /stop/:id/full-details` may omit `epickOrderDetail`; merge from route full-report when needed. */
async function enrichPayloadWithEpickFromFullReport(payload: StopFullDetailsPayload): Promise<StopFullDetailsPayload> {
  if (epickWarehouseImages(payload.stop).length > 0) return payload;
  const routeId = payload.stop.routeId;
  if (routeId == null || !Number.isFinite(routeId)) return payload;
  try {
    const reportRes = await getRouteFullReport(routeId);
    const rows = normalizeRouteFullReportData(reportRes.data?.data);
    const match = rows.find((r) => r.stop.id === payload.stop.id);
    const epick = match?.stop.epickOrderDetail;
    if (epick?.images?.length) {
      return {
        ...payload,
        stop: { ...payload.stop, epickOrderDetail: epick },
      };
    }
  } catch {
    /* optional enrich failed — keep full-details payload */
  }
  return payload;
}

type DriverVehicleMeta = {
  driverName: string;
  driverPhone: string;
  vehicleName: string;
  vinNumber: string;
};

function strOrEmpty(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

/** Pull driver + vehicle fields for this stop from full-report route row. */
async function getDriverVehicleMetaFromFullReport(routeId: number, stopId: number): Promise<DriverVehicleMeta | null> {
  if (!Number.isFinite(routeId) || !Number.isFinite(stopId)) return null;
  try {
    const reportRes = await getRouteFullReport(routeId);
    const raw = reportRes.data?.data as
      | { routes?: Array<Record<string, unknown>>; requestedRouteId?: number }
      | StopFullDetailsPayload[]
      | undefined;
    if (!raw || Array.isArray(raw) || !Array.isArray(raw.routes) || raw.routes.length === 0) return null;

    const routes = raw.routes;
    const byId = routes.find((r) => Number((r as { id?: unknown }).id) === routeId);
    const byStop = routes.find((r) => {
      const stops = (r as { stops?: Array<Record<string, unknown>> }).stops;
      return Array.isArray(stops) && stops.some((s) => Number((s as { id?: unknown }).id) === stopId);
    });
    const route = byId ?? byStop ?? routes[0];
    if (!route) return null;

    const driver = (route as { driver?: Record<string, unknown> }).driver ?? {};
    const vehicle = (route as { vehicle?: Record<string, unknown> }).vehicle ?? {};

    const first = strOrEmpty((driver as { firstName?: unknown }).firstName);
    const last = strOrEmpty((driver as { lastName?: unknown }).lastName);
    const fullName = [first, last].filter(Boolean).join(" ").trim();

    return {
      driverName: fullName || "—",
      driverPhone: strOrEmpty((driver as { phoneNumber?: unknown }).phoneNumber) || "—",
      vehicleName: strOrEmpty((vehicle as { description?: unknown }).description) || "—",
      vinNumber: strOrEmpty((vehicle as { vinNumber?: unknown }).vinNumber) || "—",
    };
  } catch {
    return null;
  }
}

/** POD signature image URL: `customerSignature` or snake_case from API. */
function podCustomerSignatureUrl(pod: StopFullDetailsPOD): string | null {
  const c = pod.customerSignature;
  if (typeof c === "string" && c.trim().length > 0) return c.trim();
  const s = (pod as unknown as { customer_signature?: string | null }).customer_signature;
  if (typeof s === "string" && s.trim().length > 0) return s.trim();
  return null;
}

function dwellMinutes(arrived: string | null | undefined, delivered: string | null | undefined): string {
  if (!arrived || !delivered) return "—";
  const a = Date.parse(arrived);
  const b = Date.parse(delivered);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "—";
  const m = Math.max(0, Math.round((b - a) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function fmtBool(v: boolean | null | undefined): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

const lab = { color: "text.secondary", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em", minWidth: { sm: 108 }, flexShrink: 0 };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75, alignItems: "baseline", py: 0.25, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
      <Typography component="span" sx={lab}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, fontSize: "0.8125rem", flex: 1, minWidth: 0 }}>
        {children}
      </Typography>
    </Box>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        px: { xs: 1.1, sm: 1.35 },
        py: { xs: 1, sm: 1.15 },
        bgcolor: (t) => (t.palette.mode === "light" ? "rgba(15, 23, 42, 0.025)" : "rgba(255,255,255,0.04)"),
        boxShadow: (t) => (t.palette.mode === "light" ? "0 1px 0 rgba(15,23,42,0.06)" : "none"),
      }}
    >
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "primary.main",
          mb: 0.85,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <Stack spacing={0}>{children}</Stack>
    </Box>
  );
}

function InvoiceHighlightCard({
  invoiceAmount,
  invoiceUrl,
}: {
  invoiceAmount: number | null | undefined;
  invoiceUrl: string | null;
}) {
  const amtStr = invoiceAmount != null ? String(invoiceAmount) : "—";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: { xs: 1.5, sm: 2 },
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
        bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.07 : 0.14),
        backgroundImage: (t) =>
          t.palette.mode === "light"
            ? "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 48%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%)",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.12 : 0.22),
            flexShrink: 0,
          }}
        >
          <ReceiptLongIcon sx={{ fontSize: 28, color: "primary.main" }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.65rem", display: "block" }}
          >
            Invoice amount
          </Typography>
          <Typography
            component="p"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              mt: 0.35,
              mb: 0,
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              color: "text.primary",
            }}
          >
            {amtStr}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "center" } }}>
        {invoiceUrl ? (
          <Button
            component="a"
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="medium"
            fullWidth
            disableElevation
            startIcon={<OpenInNewIcon sx={{ fontSize: 20 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 2,
              py: 1,
              borderRadius: 1,
              color: "white",
              boxShadow: (t) => (t.palette.mode === "light" ? "0 2px 8px rgba(15,23,42,0.12)" : "none"),
            }}
          >
            View invoice
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontStyle: "italic", py: 0.5, textAlign: { xs: "center", sm: "right" } }}>
            No document linked
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/** Smaller thumbnails in POD grid + fixed-height scroll region */
const podGridThumbSx = {
  width: 40,
  height: 40,
  objectFit: "cover" as const,
  borderRadius: 0.5,
  border: 1,
  borderColor: "divider",
  cursor: "pointer",
  display: "block",
  bgcolor: "action.hover",
  flexShrink: 0,
};

const podThumbScrollBoxSx = {
  maxHeight: 108,
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexWrap: "wrap",
  gap: 0.5,
  alignContent: "flex-start",
  pr: 0.25,
  // Show scroll when many images without growing the panel indefinitely
  WebkitOverflowScrolling: "touch",
} as const;

const modalThumbSx = {
  width: 56,
  height: 56,
  objectFit: "cover" as const,
  borderRadius: 0.5,
  border: 1,
  borderColor: "divider",
  cursor: "pointer",
  display: "block",
  bgcolor: "action.hover",
  flexShrink: 0,
};

type CompareViewMode = "compare" | "warehouse" | "driver";

function SimpleImageLightbox({
  open,
  onClose,
  title,
  imageUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string | null;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 1,
          width: "min(96vw, 1100px)",
          maxHeight: "min(92vh, 900px)",
          display: "flex",
          flexDirection: "column",
          m: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          py: 1,
          px: 1.25,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.02em" }}>{title}</Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          flex: 1,
          minHeight: 0,
          bgcolor: (t) => (t.palette.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)"),
        }}
      >
        {open && imageUrl ? (
          <Box
            component="img"
            key={imageUrl}
            src={imageUrl}
            alt=""
            sx={{
              maxWidth: "100%",
              maxHeight: "min(78vh, 760px)",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PhotoColumn({
  label,
  urls,
  idx,
  setIdx,
  emptyLabel,
  compareSlot = "single",
}: {
  label: string;
  urls: string[];
  idx: number;
  setIdx: React.Dispatch<React.SetStateAction<number>>;
  emptyLabel: string;
  /** In side-by-side mode: left column divider + padding, right column padding. */
  compareSlot?: "left" | "right" | "single";
}) {
  const has = urls.length > 0;
  const safeIdx = has ? Math.min(idx, urls.length - 1) : 0;
  const src = has ? urls[safeIdx] : null;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        borderRight: { xs: 0, sm: compareSlot === "left" ? 1 : 0 },
        borderBottom: { xs: compareSlot === "left" ? 1 : 0, sm: 0 },
        borderColor: "divider",
        pr: { xs: 0, sm: compareSlot === "left" ? 2 : 0 },
        pl: { xs: 0, sm: compareSlot === "right" ? 2 : 0 },
        pb: { xs: compareSlot === "left" ? 2 : 0, sm: 0 },
      }}
    >
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", color: "primary.main" }}>
        {label}
      </Typography>

      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: { xs: 280, sm: "min(52vh, 520px)" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (t) => (t.palette.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"),
          borderRadius: 1,
          overflow: "hidden",
          p: { xs: 1, sm: 1.5 },
        }}
      >
        {has && src ? (
          <>
            {urls.length > 1 ? (
              <IconButton
                size="medium"
                onClick={() => setIdx((i) => (i > 0 ? i - 1 : urls.length - 1))}
                sx={{
                  position: "absolute",
                  left: 12,
                  zIndex: 2,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "common.white",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
                aria-label="Previous image"
              >
                <ChevronLeftIcon />
              </IconButton>
            ) : null}
            <Box
              component="img"
              src={src}
              alt=""
              sx={{
                maxWidth: "100%",
                maxHeight: { xs: "min(48vh, 440px)", sm: "min(52vh, 520px)" },
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
            {urls.length > 1 ? (
              <IconButton
                size="medium"
                onClick={() => setIdx((i) => (i < urls.length - 1 ? i + 1 : 0))}
                sx={{
                  position: "absolute",
                  right: 12,
                  zIndex: 2,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "common.white",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
                aria-label="Next image"
              >
                <ChevronRightIcon />
              </IconButton>
            ) : null}
          </>
        ) : (
          <Typography color="text.secondary" sx={{ fontSize: "0.875rem", px: 2, textAlign: "center" }}>
            {emptyLabel}
          </Typography>
        )}
      </Box>

      {has ? (
        <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "text.secondary", textAlign: "center", fontWeight: 600 }}>
          {safeIdx + 1} / {urls.length}
        </Typography>
      ) : null}

      {has ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
            alignItems: "center",
            pt: 0.25,
            pb: 0.5,
          }}
        >
          {urls.map((u, i) => (
            <Box
              key={`${u}-${i}`}
              component="img"
              src={u}
              alt=""
              onClick={() => setIdx(i)}
              sx={{
                ...modalThumbSx,
                outline: i === safeIdx ? 2 : 0,
                outlineColor: "primary.main",
                outlineOffset: 2,
              }}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function CompareWarehouseDriverModal({
  open,
  onClose,
  warehouseUrls,
  driverUrls,
  initialWarehouseIndex,
  initialDriverIndex,
  orderNumber,
}: {
  open: boolean;
  onClose: () => void;
  warehouseUrls: string[];
  driverUrls: string[];
  initialWarehouseIndex: number;
  initialDriverIndex: number;
  orderNumber?: number;
}) {
  const [wIdx, setWIdx] = useState(0);
  const [dIdx, setDIdx] = useState(0);
  const [viewMode, setViewMode] = useState<CompareViewMode>("compare");

  const hasW = warehouseUrls.length > 0;
  const hasD = driverUrls.length > 0;

  useEffect(() => {
    if (!open) return;
    const wi = hasW ? Math.min(Math.max(0, initialWarehouseIndex), warehouseUrls.length - 1) : 0;
    const di = hasD ? Math.min(Math.max(0, initialDriverIndex), driverUrls.length - 1) : 0;
    setWIdx(wi);
    setDIdx(di);
    if (hasW && hasD) setViewMode("compare");
    else if (hasW) setViewMode("warehouse");
    else setViewMode("driver");
  }, [open, initialWarehouseIndex, initialDriverIndex, hasW, hasD, warehouseUrls.length, driverUrls.length]);

  const handleViewMode = (_e: React.MouseEvent<HTMLElement>, value: CompareViewMode | null) => {
    if (value == null) return;
    if (value === "warehouse" && !hasW) return;
    if (value === "driver" && !hasD) return;
    if (value === "compare" && (!hasW || !hasD)) return;
    setViewMode(value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 1 },
          width: { xs: "100%", sm: "min(98vw, 1440px)" },
          maxWidth: "100%",
          height: { xs: "100%", sm: "auto" },
          maxHeight: { xs: "100%", sm: "min(94vh, 920px)" },
          m: { xs: 0, sm: "auto" },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1,
          py: 1.25,
          px: { xs: 1.25, sm: 2 },
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "0.9rem", sm: "1rem" }, letterSpacing: "-0.02em" }}>
          Compare photos
          {orderNumber != null ? ` · Order #${orderNumber}` : ""}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: { xs: "space-between", sm: "flex-end" } }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={viewMode}
            exclusive
            onChange={handleViewMode}
            sx={{ flexWrap: "wrap" }}
          >
            <ToggleButton value="compare" disabled={!hasW || !hasD} sx={{ textTransform: "none", px: 1.25, fontSize: "0.75rem" }}>
              Side by side
            </ToggleButton>
            <ToggleButton value="warehouse" disabled={!hasW} sx={{ textTransform: "none", px: 1.25, fontSize: "0.75rem" }}>
              Warehouse only
            </ToggleButton>
            <ToggleButton value="driver" disabled={!hasD} sx={{ textTransform: "none", px: 1.25, fontSize: "0.75rem" }}>
              Driver only
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          pt: 2,
          pb: 2.5,
          px: { xs: 1.25, sm: 2.5 },
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {viewMode === "compare" && hasW && hasD ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 0,
              alignItems: "stretch",
            }}
          >
            <PhotoColumn
              label="Warehouse"
              urls={warehouseUrls}
              idx={wIdx}
              setIdx={setWIdx}
              emptyLabel="No warehouse images"
              compareSlot="left"
            />
            <PhotoColumn
              label="Driver"
              urls={driverUrls}
              idx={dIdx}
              setIdx={setDIdx}
              emptyLabel="No driver photos"
              compareSlot="right"
            />
          </Box>
        ) : viewMode === "warehouse" && hasW ? (
          <PhotoColumn
            label="Warehouse"
            urls={warehouseUrls}
            idx={wIdx}
            setIdx={setWIdx}
            emptyLabel="No warehouse images"
            compareSlot="single"
          />
        ) : hasD ? (
          <PhotoColumn
            label="Driver"
            urls={driverUrls}
            idx={dIdx}
            setIdx={setDIdx}
            emptyLabel="No driver photos"
            compareSlot="single"
          />
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            No photos to display.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface DeliveredStopDetailBodyProps {
  stopId: number | null;
  onClose: () => void;
  /** Extra padding for scroll region (dialog vs drawer). */
  contentSx?: object;
  /**
   * `drawer`: fullscreen map side panel — narrow width; stack details then images, no sticky image column.
   * `modal`: default split view (md+).
   */
  layoutVariant?: "modal" | "drawer";
}

/**
 * Shared delivery / POD detail: fetch `getStopFullDetails`, same layout as the former modal body + actions.
 * Used inside `DeliveredStopDetailModal` (non-maximized) and the maximize map stop drawer.
 */
export const DeliveredStopDetailBody: React.FC<DeliveredStopDetailBodyProps> = ({
  stopId,
  onClose,
  contentSx,
  layoutVariant = "modal",
}) => {
  const isDrawer = layoutVariant === "drawer";
  const wareHouseDetail = useAppSelector((s) => s.auth.wareHouseDetail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StopFullDetailsPayload | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<{
    warehouseUrls: string[];
    driverUrls: string[];
    wIdx: number;
    dIdx: number;
    orderNumber?: number;
  } | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [driverVehicleMeta, setDriverVehicleMeta] = useState<DriverVehicleMeta | null>(null);

  useEffect(() => {
    if (stopId == null) {
      setData(null);
      setError(null);
      setComparePhotos(null);
      setLightbox(null);
      setPdfLoading(false);
      setDriverVehicleMeta(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setComparePhotos(null);
    setLightbox(null);
    setDriverVehicleMeta(null);

    void (async () => {
      try {
        const res = await getStopFullDetails(stopId);
        if (cancelled) return;
        const raw = res.data?.data;
        if (!raw) {
          setError("No data returned.");
          return;
        }
        const payload = await enrichPayloadWithEpickFromFullReport(raw);
        if (cancelled) return;
        setData(payload);
        void (async () => {
          const meta = await getDriverVehicleMetaFromFullReport(payload.stop.routeId, payload.stop.id);
          if (!cancelled) setDriverVehicleMeta(meta);
        })();
      } catch (err: unknown) {
        if (cancelled) return;
        let apiMsg: string | null = null;
        if (err != null && typeof err === "object") {
          const d = (err as { response?: { data?: unknown } }).response?.data;
          if (d && typeof d === "object" && "message" in d) {
            const m = (d as { message?: unknown }).message;
            if (typeof m === "string") apiMsg = m;
          }
        }
        setError(apiMsg && apiMsg.trim() ? apiMsg : "Failed to load stop details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stopId]);

  const warehouseHeader = wareHouseDetail?.[0] ?? null;

  const handlePdf = useCallback(async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      await downloadDeliveredStopPodPdf(data, warehouseHeader);
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Could not generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  }, [data, warehouseHeader]);

  const handleCsv = useCallback(() => {
    if (!data) return;
    try {
      downloadDeliveredStopCsv(data);
      toast.success("CSV exported.");
    } catch {
      toast.error("Could not export CSV.");
    }
  }, [data]);

  const renderPodTextOnly = (pod: StopFullDetailsPOD, idx: number, total: number) => (
    <Panel key={`pod-txt-${idx}`} title={total > 1 ? `Proof of delivery · ${idx + 1} / ${total}` : "Proof of delivery"}>
      <Row label="Amount">{pod.amount != null ? Number(pod.amount).toFixed(2) : "—"}</Row>
      <Row label="Payment terms">{pod.paymentTerms}</Row>
      <Row label="Terms complete">{fmtBool(pod.paymentTermComplete)}</Row>
      <Row label="Post-delivery done">{fmtBool(pod.postDeliveryCompleted)}</Row>
      <Row label="Bundles">
        {pod.scannedBundles} / {pod.expectedBundles}
      </Row>
      <Row label="All scanned">{fmtBool(pod.allBundlesScanned)}</Row>
      <Row label="Paid by check">{fmtBool(pod.paymentInCheck)}</Row>
      {pod.paymentInCheck && pod.checkNumber ? <Row label="Check #">{pod.checkNumber}</Row> : null}
      <Row label="Signed by">{pod.signBy?.trim() || "—"}</Row>
      <Row label="Captured">{formatApiDateTimeMMDDYYYY(pod.podAt)}</Row>
      {pod.invoiceAmount != null && pod.invoiceAmount !== 0 ? <Row label="POD invoice">{String(pod.invoiceAmount)}</Row> : null}
      {pod.invoiceMessage && String(pod.invoiceMessage).trim() ? <Row label="Invoice note">{pod.invoiceMessage}</Row> : null}
      {pod.notes && String(pod.notes).trim() ? <Row label="Notes">{pod.notes}</Row> : null}
      {(Array.isArray(pod.boxBarCode) && pod.boxBarCode.length > 0) || (Array.isArray(pod.scanBarCode) && pod.scanBarCode.length > 0) ? (
        <Row label="Barcodes">
          Box {Array.isArray(pod.boxBarCode) ? pod.boxBarCode.length : 0} · Scan {Array.isArray(pod.scanBarCode) ? pod.scanBarCode.length : 0}
        </Row>
      ) : null}
    </Panel>
  );

  const renderPodImagesOnly = (pod: StopFullDetailsPOD, idx: number, total: number, stop: StopFullDetailsStop) => {
    const warehouseUrls = epickWarehouseImages(stop);
    const driverUrls = Array.isArray(pod.photos) ? pod.photos.filter((u) => typeof u === "string" && u.trim().length > 0) : [];
    const hasEpick = warehouseUrls.length > 0;
    const hasChecks = !!(pod.checkImage || pod.checkImage1);
    const signatureUrl = podCustomerSignatureUrl(pod);
    const hasSig = signatureUrl != null;
    const hasDriverPhotos = driverUrls.length > 0;
    if (!hasEpick && !hasDriverPhotos && !hasChecks && !hasSig) return null;

    const title = total > 1 ? `Proof of delivery · ${idx + 1} / ${total}` : "Proof of delivery";

    const openCompareWarehouse = (wi: number) => {
      setComparePhotos({
        warehouseUrls,
        driverUrls,
        wIdx: wi,
        dIdx: driverUrls.length ? Math.min(wi, driverUrls.length - 1) : 0,
        orderNumber: stop.orderNumber,
      });
    };
    const openCompareDriver = (di: number) => {
      setComparePhotos({
        warehouseUrls,
        driverUrls,
        wIdx: warehouseUrls.length ? Math.min(di, warehouseUrls.length - 1) : 0,
        dIdx: di,
        orderNumber: stop.orderNumber,
      });
    };

    return (
      <Panel key={`pod-img-${idx}`} title={title}>
        <Stack spacing={1}>
          {hasEpick ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 1,
                alignItems: "stretch",
                minWidth: 0,
              }}
            >
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600 }}>Warehouse</Typography>
                <Box sx={podThumbScrollBoxSx}>
                  {warehouseUrls.map((url, i) => (
                    <Box
                      key={`w-${url}-${i}`}
                      component="img"
                      src={url}
                      alt=""
                      onClick={() => openCompareWarehouse(i)}
                      sx={{ ...podGridThumbSx }}
                    />
                  ))}
                </Box>
              </Box>
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600 }}>Driver</Typography>
                {hasDriverPhotos ? (
                  <Box sx={podThumbScrollBoxSx}>
                    {driverUrls.map((url, i) => (
                      <Box
                        key={`d-${url}-${i}`}
                        component="img"
                        src={url}
                        alt=""
                        onClick={() => openCompareDriver(i)}
                        sx={{ ...podGridThumbSx }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", fontStyle: "italic", py: 0.5 }}>
                    No driver photos
                  </Typography>
                )}
              </Box>
            </Box>
          ) : hasDriverPhotos ? (
            <Box>
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 0.5, fontWeight: 600 }}>Photos</Typography>
              <Box sx={podThumbScrollBoxSx}>
                {driverUrls.map((url, i) => (
                  <Box
                    key={`d-${url}-${i}`}
                    component="img"
                    src={url}
                    alt=""
                    onClick={() => openCompareDriver(i)}
                    sx={{ ...podGridThumbSx }}
                  />
                ))}
              </Box>
            </Box>
          ) : null}

          {hasChecks ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: pod.checkImage && pod.checkImage1 ? "1fr 1fr" : "1fr" },
                gap: 0.75,
                pt: hasEpick || hasDriverPhotos ? 0.75 : 0,
                borderTop: hasEpick || hasDriverPhotos ? 1 : 0,
                borderColor: "divider",
              }}
            >
              {pod.checkImage ? (
                <Box>
                  <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 0.25 }}>Check</Typography>
                  <Box
                    component="img"
                    src={pod.checkImage}
                    alt=""
                    onClick={() => setLightbox({ url: pod.checkImage!, title: `Check · Order #${stop.orderNumber}` })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightbox({ url: pod.checkImage!, title: `Check · Order #${stop.orderNumber}` });
                      }
                    }}
                    sx={{
                      width: "100%",
                      maxHeight: 120,
                      objectFit: "contain",
                      borderRadius: 0.5,
                      border: 1,
                      borderColor: "divider",
                      cursor: "zoom-in",
                      "&:hover": { opacity: 0.92, borderColor: "primary.light" },
                    }}
                  />
                </Box>
              ) : null}
              {pod.checkImage1 ? (
                <Box>
                  <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 0.25 }}>Check (additional)</Typography>
                  <Box
                    component="img"
                    src={pod.checkImage1}
                    alt=""
                    onClick={() => setLightbox({ url: pod.checkImage1!, title: `Check (additional) · Order #${stop.orderNumber}` })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightbox({ url: pod.checkImage1!, title: `Check (additional) · Order #${stop.orderNumber}` });
                      }
                    }}
                    sx={{
                      width: "100%",
                      maxHeight: 120,
                      objectFit: "contain",
                      borderRadius: 0.5,
                      border: 1,
                      borderColor: "divider",
                      cursor: "zoom-in",
                      "&:hover": { opacity: 0.92, borderColor: "primary.light" },
                    }}
                  />
                </Box>
              ) : null}
            </Box>
          ) : null}

          {hasSig ? (
            <Box
              sx={{
                pt: hasChecks || hasEpick || hasDriverPhotos ? 0.75 : 0,
                borderTop: hasChecks || hasEpick || hasDriverPhotos ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 0.25 }}>Signature</Typography>
              <Box
                component="img"
                key={`sig-${stop.id}-${pod.id}-${signatureUrl}`}
                src={signatureUrl}
                alt=""
                onClick={() => setLightbox({ url: signatureUrl, title: `Signature · Order #${stop.orderNumber}` })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox({ url: signatureUrl, title: `Signature · Order #${stop.orderNumber}` });
                  }
                }}
                sx={{
                  width: "100%",
                  maxHeight: 140,
                  objectFit: "contain",
                  borderRadius: 0.5,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "action.hover",
                  cursor: "zoom-in",
                  "&:hover": { opacity: 0.92, borderColor: "primary.light" },
                }}
              />
            </Box>
          ) : null}
        </Stack>
      </Panel>
    );
  };

  return (
    <Box
      key={stopId ?? "closed"}
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
          px: { xs: 0, sm: 0.5 },
          ...contentSx,
        }}
      >
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        {!loading && error && (
          <Typography color="error" sx={{ fontSize: "0.8125rem" }}>
            {error}
          </Typography>
        )}
        {!loading && data && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isDrawer
                ? "1fr"
                : { xs: "1fr", md: "minmax(0, 1fr) minmax(260px, min(420px, 38vw))" },
              gap: isDrawer ? 1.5 : { xs: 1.25, md: 1.5 },
              alignItems: "start",
              minWidth: 0,
            }}
          >
            <Stack spacing={1} sx={{ minWidth: 0, width: "100%" }}>
              <Panel title="Route & stop">
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                    columnGap: { xs: 0, lg: 2.5 },
                    rowGap: 0,
                    alignItems: "start",
                  }}
                >
                  <Row label="Route">{data.stop.routeName}</Row>
                  <Row label="Day">{formatApiDateMMDDYYYYDisplay(data.stop.day)}</Row>
                  <Row label="Sequence">{data.stop.stopSequence}</Row>
                  <Row label="Order">{data.stop.orderNumber}</Row>
                  <Row label="Customer #">{data.stop.C_Number}</Row>
                  <Row label="Status">
                    <Chip size="small" label={data.stop.status} sx={{ height: 24, fontWeight: 700, fontSize: "0.7rem" }} />
                  </Row>
                  <Row label="Route started">{fmtBool(data.stop.routeStarted)}</Row>
                  <Row label="Last stop">{fmtBool(data.stop.isLastStop)}</Row>
                  <Row label="Distance">{data.stop.totalKilometers} km</Row>
                  {data.stop.notes && String(data.stop.notes).trim() ? (
                    <Box sx={{ gridColumn: { xs: "auto", lg: "1 / -1" }, width: "100%" }}>
                      <Row label="Notes">{data.stop.notes}</Row>
                    </Box>
                  ) : null}
                  <Row label="Arrived">{formatApiDateTimeMMDDYYYY(data.stop.arrivedAt)}</Row>
                  <Row label="Delivered">{formatApiDateTimeMMDDYYYY(data.stop.deliveredAt)}</Row>
                  <Row label="At stop">{dwellMinutes(data.stop.arrivedAt, data.stop.deliveredAt)}</Row>
                  <Box sx={{ gridColumn: { xs: "auto", lg: "1 / -1" }, width: "100%" }}>
                    <Row label="Stop GPS">
                      {data.stop.latitude}, {data.stop.longitude}
                    </Row>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "auto", lg: "1 / -1" }, width: "100%" }}>
                    <Row label="Approach">
                      {data.stop.startLatitude}, {data.stop.startLongitude}
                    </Row>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "auto", lg: "1 / -1" }, width: "100%" }}>
                    <Row label="Depart">
                      {data.stop.endLatitude}, {data.stop.endLongitude}
                    </Row>
                  </Box>
                </Box>
              </Panel>

              <Panel title="Invoice">
                <InvoiceHighlightCard invoiceAmount={data.stop.invoiceAmount} invoiceUrl={data.stop.invoiceUrl} />
              </Panel>

              <Panel title="Driver & vehicle">
                <Row label="Driver">{driverVehicleMeta?.driverName ?? "—"}</Row>
                <Row label="Phone">{driverVehicleMeta?.driverPhone ?? "—"}</Row>
                <Row label="Vehicle">{driverVehicleMeta?.vehicleName ?? "—"}</Row>
                <Row label="VIN">{driverVehicleMeta?.vinNumber ?? "—"}</Row>
              </Panel>

              <Panel title="Customer">
                <Row label="Name">{data.customer.C_Name}</Row>
                <Row label="Street">{data.customer.address}</Row>
                <Row label="ZIP">{data.customer.zip}</Row>
                <Row label="Phone">{data.customer.phone?.trim() || "—"}</Row>
                <Row label="Email">{data.customer.email?.trim() || "—"}</Row>
              </Panel>

              {data.stop.reSchedule ||
              data.stop.reScheduleDate ||
              data.stop.reScheduleTime ||
              (data.stop.reScheduleReason && String(data.stop.reScheduleReason).trim()) ? (
                <Panel title="Reschedule">
                  <Row label="Active">{fmtBool(data.stop.reSchedule)}</Row>
                  <Row label="Date">{formatFullDetailsDateField(data.stop.reScheduleDate)}</Row>
                  <Row label="Time">{data.stop.reScheduleTime ?? "—"}</Row>
                  <Row label="Reason">{data.stop.reScheduleReason ?? "—"}</Row>
                  {data.stop.reScheduleNotes && String(data.stop.reScheduleNotes).trim() ? (
                    <Row label="Detail">{data.stop.reScheduleNotes}</Row>
                  ) : null}
                </Panel>
              ) : null}

              {(!data.deliveryPODs || data.deliveryPODs.length === 0) && (
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>No proof-of-delivery record for this stop.</Typography>
              )}
              {data.deliveryPODs?.map((pod, idx) => renderPodTextOnly(pod, idx, data.deliveryPODs.length))}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                minWidth: 0,
                width: "100%",
                position: isDrawer ? "static" : { md: "sticky" },
                top: isDrawer ? undefined : { md: 0 },
                alignSelf: "start",
                maxHeight: isDrawer ? "none" : { md: "min(78vh, 720px)" },
                overflow: isDrawer ? "visible" : { md: "auto" },
                pr: isDrawer ? 0 : { md: 0.25 },
                pt: isDrawer ? 0.25 : 0,
                borderTop: isDrawer ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "primary.main",
                  textTransform: "uppercase",
                  pb: 0.25,
                }}
              >
                {isDrawer ? "Photos & evidence" : "Proof of delivery"}
              </Typography>
              {(!data.deliveryPODs || data.deliveryPODs.length === 0) && (
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>No images for this stop.</Typography>
              )}
              {data.deliveryPODs?.map((pod, idx) => renderPodImagesOnly(pod, idx, data.deliveryPODs.length, data.stop))}
            </Stack>
          </Box>
        )}
      </Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        flexWrap="wrap"
        useFlexGap
        sx={{
          flexShrink: 0,
          pt: isDrawer ? 1 : 1.25,
          mt: isDrawer ? 0.25 : 0.5,
          borderTop: 1,
          borderColor: "divider",
          display: { xs: "block", sm: "flex" },
          justifyContent: { xs: "center", sm: "space-between" },
          alignItems: { xs: "center", sm: "center" },
        }}
      >
        <Button onClick={onClose} color="inherit" size="small" sx={{ textTransform: "none", minWidth: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>
          Close
        </Button>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ ml: { xs: 0, sm: 3 } }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TableChartOutlinedIcon sx={{ fontSize: 18 }} />}
            disabled={!data}
            onClick={handleCsv}
            sx={{ textTransform: "none", fontWeight: 600, px: 1.25 }}
          >
            CSV
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={pdfLoading ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfIcon sx={{ fontSize: 18 }} />}
            disabled={!data || pdfLoading}
            onClick={handlePdf}
            sx={{ textTransform: "none", fontWeight: 700, px: 1.5, color: "white" }}
          >
            PDF
          </Button>
        </Stack>
      </Stack>
      <CompareWarehouseDriverModal
        open={comparePhotos != null}
        onClose={() => setComparePhotos(null)}
        warehouseUrls={comparePhotos?.warehouseUrls ?? []}
        driverUrls={comparePhotos?.driverUrls ?? []}
        initialWarehouseIndex={comparePhotos?.wIdx ?? 0}
        initialDriverIndex={comparePhotos?.dIdx ?? 0}
        orderNumber={comparePhotos?.orderNumber}
      />
      <SimpleImageLightbox
        open={lightbox != null}
        onClose={() => setLightbox(null)}
        title={lightbox?.title ?? ""}
        imageUrl={lightbox?.url ?? null}
      />
    </Box>
  );
};

export interface DeliveredStopDetailModalProps {
  open: boolean;
  stopId: number | null;
  onClose: () => void;
}

const DeliveredStopDetailModal: React.FC<DeliveredStopDetailModalProps> = ({ open, stopId, onClose }) => {
  const wareHouseDetail = useAppSelector((s) => s.auth.wareHouseDetail);
  const warehouseHeader = wareHouseDetail?.[0] ?? null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxHeight: "min(92vh, 900px)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          py: 1,
          px: 1.25,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Delivery detail
          </Typography>
          {warehouseHeader && (
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.35, lineHeight: 1.35 }}>
              {warehouseHeader.D_Name}
              {" · "}
              {[warehouseHeader.D_Addr1, [warehouseHeader.D_City, warehouseHeader.D_State].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join(" · ")}
              {warehouseHeader.D_Phone ? ` · ${warehouseHeader.D_Phone}` : ""}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ mt: -0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          px: 1.25,
          py: 1,
          "&.MuiDialogContent-root": { pt: 1 },
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DeliveredStopDetailBody stopId={open ? stopId : null} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default DeliveredStopDetailModal;
