import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  getCustomerRouteStopDisplay,
  getRouteFullReport,
  normalizeRouteFullReportData,
  normalizeStopStatus,
  StopStatus,
  type StopFullDetailsPayload,
  type StopFullDetailsPOD,
  type StopFullDetailsStop,
} from "../../../redux/apis/distrubutor/routeViewApis";
import { formatApiDateMMDDYYYYDisplay, formatApiDateTimeMMDDYYYY } from "../../../utils/formatApiDate";

type ImageLinkItem = { label: string; url: string };

function humanizeImageLabel(label: string): string {
  if (label === "customerSignature") return "Signature";
  if (label === "checkImage") return "Check (front)";
  if (label === "checkImage1") return "Check (additional)";
  const m = /^photos \((\d+)\)$/.exec(label);
  if (m) return `Photo ${m[1]}`;
  return label;
}

function partitionImageLinks(links: ImageLinkItem[]) {
  const signature = links.filter((l) => l.label === "customerSignature");
  const checks = links.filter((l) => l.label === "checkImage" || l.label === "checkImage1");
  const photos = links.filter((l) => l.label.startsWith("photos"));
  return { signature, checks, photos };
}

function isLikelyImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url) || /\/image\//i.test(url);
}

function ImagePreviewCard({ title, url }: { title: string; url: string }) {
  const [loadError, setLoadError] = useState(false);
  const tryImg = isLikelyImageUrl(url) && !loadError;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.25, color: "text.primary" }}>
          {title}
        </Typography>
        {tryImg ? (
          <Box
            component="img"
            src={url}
            alt=""
            onError={() => setLoadError(true)}
            sx={{
              display: "block",
              width: "100%",
              maxHeight: 220,
              objectFit: "contain",
              borderRadius: 1,
              bgcolor: "action.hover",
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, fontSize: "0.8125rem" }}>
            No inline preview for this file. Use the button below to open it.
          </Typography>
        )}
        <Button
          size="small"
          variant="outlined"
          component={Link}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
          sx={{ mt: tryImg ? 1.25 : 0, textTransform: "none", fontWeight: 500 }}
        >
          Open in new tab
        </Button>
      </CardContent>
    </Card>
  );
}

function escapeCsvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Collect POD image URLs with stable labels for the modal + CSV. */
function collectPodImageLinks(pods: StopFullDetailsPOD[]): ImageLinkItem[] {
  const out: ImageLinkItem[] = [];
  for (const pod of pods) {
    if (pod.customerSignature?.trim()) {
      out.push({ label: "customerSignature", url: pod.customerSignature.trim() });
    }
    if (pod.checkImage?.trim()) {
      out.push({ label: "checkImage", url: pod.checkImage.trim() });
    }
    if (pod.checkImage1?.trim()) {
      out.push({ label: "checkImage1", url: pod.checkImage1.trim() });
    }
    const photos = Array.isArray(pod.photos) ? pod.photos : [];
    photos.forEach((p, i) => {
      if (p && String(p).trim()) {
        out.push({ label: `photos (${i + 1})`, url: String(p).trim() });
      }
    });
  }
  return out;
}

/** One URL each for signature / checks; photos flattened in order across all PODs on the stop. */
function getPodImageFieldsForCsv(pods: StopFullDetailsPOD[]): {
  signature: string;
  checkImage: string;
  checkImage1: string;
  photos: string[];
} {
  let signature = "";
  let checkImage = "";
  let checkImage1 = "";
  const photosFlat: string[] = [];
  for (const pod of pods) {
    if (!signature && pod.customerSignature?.trim()) signature = pod.customerSignature.trim();
    if (!checkImage && pod.checkImage?.trim()) checkImage = pod.checkImage.trim();
    if (!checkImage1 && pod.checkImage1?.trim()) checkImage1 = pod.checkImage1.trim();
    const ph = Array.isArray(pod.photos) ? pod.photos : [];
    for (const p of ph) {
      if (p && String(p).trim()) photosFlat.push(String(p).trim());
    }
  }
  return { signature, checkImage, checkImage1, photos: photosFlat };
}

function maxPhotoColumnCount(rows: StopFullDetailsPayload[]): number {
  let max = 0;
  for (const r of rows) {
    const { photos } = getPodImageFieldsForCsv(r.deliveryPODs ?? []);
    max = Math.max(max, photos.length);
  }
  return max;
}

function downloadDeliveryTableCsv(rows: StopFullDetailsPayload[], routeId: number) {
  const maxPhotos = maxPhotoColumnCount(rows);
  const imageHeaders = [
    "signature",
    "check_image",
    "check_image_1",
    ...Array.from({ length: maxPhotos }, (_, i) => `Delivery_photo ${i + 1}`),
  ];
  const headers = [
    "Customer Number",
    "Customer Name",
    "Address",
    "City",
    "State",
    "Zip",
    "Route",
    "Stop",
    "Invoice Date",
    "Delivered Date",
    "invoiceAmount",
    "Paid Amount",
    "Payment Terms",
    ...imageHeaders,
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const pod = r.deliveryPODs?.[0] ?? null;
    const { customerRoute, customerStop } = getCustomerRouteStopDisplay(r.customer, r.stop);
    const { signature, checkImage, checkImage1, photos } = getPodImageFieldsForCsv(r.deliveryPODs ?? []);
    const photoCells = Array.from({ length: maxPhotos }, (_, i) => escapeCsvCell(photos[i] ?? ""));
    lines.push(
      [
        escapeCsvCell(r.stop.C_Number),
        escapeCsvCell(r.customer.C_Name),
        escapeCsvCell(r.customer.address),
        escapeCsvCell(r.customer.city ?? ""),
        escapeCsvCell(r.customer.state ?? ""),
        escapeCsvCell(r.customer.zip),
        escapeCsvCell(customerRoute),
        escapeCsvCell(customerStop),
        escapeCsvCell(invoiceDateCsvValue(r.stop)),
        escapeCsvCell(deliveredAtCsvValue(r.stop.deliveredAt)),
        escapeCsvCell(r.stop.invoiceAmount),
        escapeCsvCell(pod?.amount),
        escapeCsvCell(pod?.paymentTerms),
        escapeCsvCell(signature),
        escapeCsvCell(checkImage),
        escapeCsvCell(checkImage1),
        ...photoCells,
      ].join(",")
    );
  }
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `route-${routeId}-delivery-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));
}

/** CSV: empty cell when no timestamp; otherwise same formatted string as UI (no em dash). */
function deliveredAtCsvValue(deliveredAt: string | null | undefined): string {
  const d = formatApiDateTimeMMDDYYYY(deliveredAt);
  return d === "—" ? "" : d;
}

/** `orderDetail` invoice / order date — calendar display, no TZ shift. */
function invoiceDateRaw(stop: StopFullDetailsStop): string | undefined {
  const od = stop.orderDetail;
  if (!od) return undefined;
  const raw =
    od.Invoice_Date ??
    od.Order_Date ??
    od.invoiceDate ??
    od.orderDate;
  if (raw == null || String(raw).trim() === "") return undefined;
  return String(raw).trim();
}

function invoiceDateDisplay(stop: StopFullDetailsStop): string {
  const raw = invoiceDateRaw(stop);
  if (raw == null) return "—";
  return formatApiDateMMDDYYYYDisplay(raw);
}

function invoiceDateCsvValue(stop: StopFullDetailsStop): string {
  const raw = invoiceDateRaw(stop);
  if (raw == null) return "";
  const d = formatApiDateMMDDYYYYDisplay(raw);
  return d === "—" ? "" : d;
}

function isStopDeliveredRow(r: StopFullDetailsPayload): boolean {
  if (r.stop.deliveredAt) return true;
  return normalizeStopStatus(r.stop.status) === StopStatus.DELIVERED;
}

export interface RouteFullReportDeliveryTableProps {
  routeId: number;
  /** Increment when route stops (or list) refresh so full-report is refetched — keeps delivery rows in sync. */
  refreshKey?: number;
}

const TABLE_COL_HEADERS = [
  "Customer Number",
  "Customer Name",
  "Address",
  "City",
  "State",
  "Zip",
  "Route",
  "Stop",
  "Invoice Date",
  "Delivered Date",
  "Invoice Amount",
  "Paid Amount",
  "Payment Terms",
  "Images",
] as const;

const RouteFullReportDeliveryTable: React.FC<RouteFullReportDeliveryTableProps> = ({ routeId, refreshKey = 0 }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StopFullDetailsPayload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLinks, setModalLinks] = useState<ImageLinkItem[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  /** Opaque fills only — semi-transparent `action.hover` lets scrolled cells show through the sticky column. */
  const stickyImageHeadSx = useMemo(
    () => ({
      position: "sticky" as const,
      right: 0,
      top: 0,
      zIndex: 6,
      isolation: "isolate" as const,
      backgroundColor: theme.palette.background.paper,
      borderLeft: `1px solid ${theme.palette.divider}`,
      boxShadow:
        theme.palette.mode === "light" ? "-8px 0 20px rgba(15, 23, 42, 0.1)" : "-8px 0 24px rgba(0, 0, 0, 0.55)",
      fontWeight: 600,
      fontSize: "0.75rem",
      whiteSpace: "nowrap" as const,
    }),
    [theme]
  );

  const stickyImageBodySx = useMemo(
    () => ({
      position: "sticky" as const,
      right: 0,
      zIndex: 5,
      isolation: "isolate" as const,
      backgroundColor: theme.palette.background.paper,
      borderLeft: `1px solid ${theme.palette.divider}`,
      boxShadow:
        theme.palette.mode === "light" ? "-8px 0 20px rgba(15, 23, 42, 0.08)" : "-8px 0 24px rgba(0, 0, 0, 0.5)",
      // Solid hover (matches row hover visually) — avoids invoice/text bleeding through on horizontal scroll
      ".MuiTableRow-root:hover &": {
        backgroundColor: theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[800],
      },
    }),
    [theme]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRouteFullReport(routeId);
      const normalized = normalizeRouteFullReportData(res.data?.data);
      const sorted = [...normalized].sort((a, b) => a.stop.stopSequence - b.stop.stopSequence);
      setRows(sorted);
    } catch {
      setRows([]);
      setError("Could not load route full report.");
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    if (routeId == null || !Number.isFinite(routeId)) return;
    void load();
  }, [routeId, load, refreshKey]);

  /** Table + CSV: delivered stops only (same rules as sidebar). */
  const visibleRows = useMemo(() => rows.filter(isStopDeliveredRow), [rows]);

  const hasDelivered = visibleRows.length > 0;

  const handleOpenImages = (stopLabel: string, pods: StopFullDetailsPOD[]) => {
    const links = collectPodImageLinks(pods);
    if (!links.length) return;
    setModalTitle(stopLabel);
    setModalLinks(links);
    setModalOpen(true);
  };

  const handleDownloadCsv = () => {
    if (!visibleRows.length) return;
    downloadDeliveryTableCsv(visibleRows, routeId);
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: { xs: 1.5, sm: 2 },
          p: 3,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={28} />
      </Paper>
    );
  }

  if (error) {
    return null;
  }

  if (!hasDelivered || visibleRows.length === 0) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mt: { xs: 1.5, sm: 2 },
          width: "100%",
          borderRadius: 2,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          p: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
            Delivery report
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDownloadCsv}
            sx={{ textTransform: "none", alignSelf: { xs: "flex-end", sm: "center" } }}
          >
            Download CSV
          </Button>
        </Box>

        <TableContainer sx={{ maxHeight: 480, width: "100%", overflow: "auto" }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                {TABLE_COL_HEADERS.slice(0, -1).map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {h}
                  </TableCell>
                ))}
                <TableCell sx={stickyImageHeadSx}>{TABLE_COL_HEADERS[TABLE_COL_HEADERS.length - 1]}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((r) => {
                const pod = r.deliveryPODs?.[0] ?? null;
                const { customerRoute, customerStop } = getCustomerRouteStopDisplay(r.customer, r.stop);
                const imgLinks = collectPodImageLinks(r.deliveryPODs ?? []);
                const stopLabel = `${r.customer.C_Name || "Stop"} · #${r.stop.stopSequence}`;
                return (
                  <TableRow key={r.stop.id} hover>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{r.stop.C_Number}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{r.customer.C_Name}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem", maxWidth: 160 }}>{r.customer.address}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{r.customer.city ?? "—"}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{r.customer.state ?? "—"}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{r.customer.zip}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{customerRoute}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{customerStop}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {invoiceDateDisplay(r.stop)}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {formatApiDateTimeMMDDYYYY(r.stop.deliveredAt)}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{formatMoney(r.stop.invoiceAmount)}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{formatMoney(pod?.amount)}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{pod?.paymentTerms ?? "—"}</TableCell>
                    <TableCell sx={{ ...stickyImageBodySx, fontSize: "0.8125rem", minWidth: 120 }}>
                      {imgLinks.length > 0 ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ImageOutlinedIcon sx={{ fontSize: 18 }} />}
                          onClick={() => handleOpenImages(stopLabel, r.deliveryPODs ?? [])}
                          sx={{ textTransform: "none", whiteSpace: "nowrap", py: 0.5 }}
                        >
                          View ({imgLinks.length})
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            pr: 1,
            pb: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6, fontWeight: 600 }}>
              Delivery images
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.25, lineHeight: 1.35 }}>
              {modalTitle}
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={() => setModalOpen(false)} size="small" sx={{ mt: -0.5 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 2 }}>
          {(() => {
            const { signature, checks, photos } = partitionImageLinks(modalLinks);
            const sections: { key: string; sectionTitle: string; items: ImageLinkItem[] }[] = [];
            if (signature.length) sections.push({ key: "sig", sectionTitle: "Signature", items: signature });
            if (checks.length) sections.push({ key: "chk", sectionTitle: "Check images", items: checks });
            if (photos.length) sections.push({ key: "ph", sectionTitle: "Delivery photos", items: photos });

            return (
              <Stack spacing={3}>
                {sections.map((sec, si) => (
                  <Box key={sec.key}>
                    {si > 0 && <Divider sx={{ mb: 3 }} />}
                    <Typography
                      variant="overline"
                      sx={{
                        display: "block",
                        color: "primary.main",
                        fontWeight: 700,
                        letterSpacing: 1,
                        mb: 1.5,
                      }}
                    >
                      {sec.sectionTitle}
                    </Typography>
                    <Stack spacing={1.5}>
                      {sec.items.map((item, idx) => (
                        <ImagePreviewCard
                          key={`${sec.key}-${item.label}-${idx}`}
                          title={
                            sec.items.length > 1 && item.label === "customerSignature"
                              ? `Signature (${idx + 1})`
                              : humanizeImageLabel(item.label)
                          }
                          url={item.url}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RouteFullReportDeliveryTable;
