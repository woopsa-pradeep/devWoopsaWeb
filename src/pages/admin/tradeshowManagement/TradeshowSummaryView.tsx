import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  getTradeShowSummary,
  getTradeShowItems,
  getTradeShowVendors,
  getTradeShowRetailers,
  getInventoryAsPerTradeWeek,
} from "../../../redux/apis/distrubutor/tradeShowApis";

interface RemainItem {
  id: string | number;
  itemNumber?: string;
  name?: string;
}

interface SummaryData {
  data: Array<{
    id: number;
    itemNumber: string;
    description: string;
    discount: string;
    minQuantity: number;
    maxQuantity: number;
    disType: string;
  }>;
  vendors: Array<{
    Primary_Vendor: number;
    V_Description: string;
    V_Email?: string;
    V_Phone?: string;
    V_City?: string;
    V_State?: string;
  }>;
  retails?: {
    count: number;
    rows: Array<{ retailerId: number; retailerName: string }>;
  };
  tradeShow: {
    id: number;
    name: string;
    tradeShowDate: string;
    deliveryStartDate: string;
    deliveryEndDate: string;
    deliveryWeeks: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  weekWiseCounts?: Array<{ weekNumber: number; count: number }>;
}

const toRemainItem = (item: any): RemainItem => {
  const num =
    item.itemNumber ??
    item.inventory?.Item_Number ??
    item.itemId ??
    item.id ??
    item.code;
  const name =
    item.name ??
    item.itemName ??
    item.inventory?.Description ??
    item.inventory?.Item_Name ??
    item.item?.description ??
    item.description ??
    "—";
  return {
    id: num ?? item.id ?? item.code,
    itemNumber: num != null ? String(num) : undefined,
    name: String(name),
  };
};

const TradeshowSummaryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View All modals state
  const [viewProductsOpen, setViewProductsOpen] = useState(false);
  const [viewProductsList, setViewProductsList] = useState<any[]>([]);
  const [viewProductsLoading, setViewProductsLoading] = useState(false);
  const [viewProductsSearch, setViewProductsSearch] = useState("");
  const [viewProductsDisType, setViewProductsDisType] = useState<"PERCENT" | "FLAT" | "">("");
  const [viewProductsPage, setViewProductsPage] = useState(0);
  const [viewProductsRowsPerPage, setViewProductsRowsPerPage] = useState(10);
  const [viewProductsTotal, setViewProductsTotal] = useState(0);

  const [viewVendorsOpen, setViewVendorsOpen] = useState(false);
  const [viewVendorsList, setViewVendorsList] = useState<any[]>([]);
  const [viewVendorsLoading, setViewVendorsLoading] = useState(false);
  const [viewVendorsSearch, setViewVendorsSearch] = useState("");
  const [viewVendorsPage, setViewVendorsPage] = useState(0);
  const [viewVendorsRowsPerPage, setViewVendorsRowsPerPage] = useState(10);
  const [viewVendorsTotal, setViewVendorsTotal] = useState(0);

  const [viewRetailersOpen, setViewRetailersOpen] = useState(false);
  const [viewRetailersList, setViewRetailersList] = useState<any[]>([]);
  const [viewRetailersLoading, setViewRetailersLoading] = useState(false);
  const [viewRetailersSearch, setViewRetailersSearch] = useState("");
  const [viewRetailersPage, setViewRetailersPage] = useState(0);
  const [viewRetailersRowsPerPage, setViewRetailersRowsPerPage] = useState(10);
  const [viewRetailersTotal, setViewRetailersTotal] = useState(0);

  const [viewWeekOpen, setViewWeekOpen] = useState(false);
  const [viewWeekNumber, setViewWeekNumber] = useState<number | null>(null);
  const [viewWeekList, setViewWeekList] = useState<RemainItem[]>([]);
  const [viewWeekLoading, setViewWeekLoading] = useState(false);
  const [viewWeekPage, setViewWeekPage] = useState(0);
  const [viewWeekRowsPerPage, setViewWeekRowsPerPage] = useState(10);
  const [viewWeekTotal, setViewWeekTotal] = useState(0);

  const debouncedProductsSearch = useDebounce(viewProductsSearch, 400);
  const debouncedVendorsSearch = useDebounce(viewVendorsSearch, 400);
  const debouncedRetailersSearch = useDebounce(viewRetailersSearch, 400);

  const tradeShowId = id ? Number(id) : null;

  // Load summary (single call, no pagination for summary cards)
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getTradeShowSummary(id, { page: 1, limit: 10 })
      .then((res: any) => {
        const raw = res?.data ?? res;
        setSummaryData({
          data: raw?.data ?? [],
          vendors: raw?.vendors ?? [],
          retails: raw?.retails ?? undefined,
          tradeShow: raw?.tradeShow ?? {
            id: 0,
            name: "",
            tradeShowDate: "",
            deliveryStartDate: "",
            deliveryEndDate: "",
            deliveryWeeks: 0,
          },
          total: raw?.total,
          page: raw?.page,
          limit: raw?.limit,
          totalPages: raw?.totalPages,
          weekWiseCounts: raw?.weekWiseCounts ?? undefined,
        });
      })
      .catch((err) => {
        console.error("Failed to load trade show summary", err);
        setError("Failed to load summary");
        setSummaryData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const loadViewProducts = async () => {
    if (!tradeShowId) return;
    setViewProductsLoading(true);
    try {
      const res: any = await getTradeShowItems({
        tradeShowId,
        itemNumber: debouncedProductsSearch?.trim() || undefined,
        disType: viewProductsDisType || undefined,
        page: viewProductsPage + 1,
        limit: viewProductsRowsPerPage,
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      const total = typeof payload?.total === "number" ? payload.total : list.length;
      setViewProductsList(Array.isArray(list) ? list : []);
      setViewProductsTotal(total);
    } catch {
      setViewProductsList([]);
      setViewProductsTotal(0);
    } finally {
      setViewProductsLoading(false);
    }
  };

  const loadViewVendors = async () => {
    if (!tradeShowId) return;
    setViewVendorsLoading(true);
    try {
      const res: any = await getTradeShowVendors({
        tradeShowId,
        search: debouncedVendorsSearch?.trim() || undefined,
        page: viewVendorsPage + 1,
        limit: viewVendorsRowsPerPage,
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      const total = typeof payload?.total === "number" ? payload.total : list.length;
      setViewVendorsList(Array.isArray(list) ? list : []);
      setViewVendorsTotal(total);
    } catch {
      setViewVendorsList([]);
      setViewVendorsTotal(0);
    } finally {
      setViewVendorsLoading(false);
    }
  };

  const loadViewRetailers = async () => {
    if (!tradeShowId) return;
    setViewRetailersLoading(true);
    try {
      const res: any = await getTradeShowRetailers({
        tradeShowId,
        search: debouncedRetailersSearch?.trim() || undefined,
        page: viewRetailersPage + 1,
        limit: viewRetailersRowsPerPage,
      });
      const payload = res?.data;
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      const total = typeof payload?.total === "number" ? payload.total : list.length;
      setViewRetailersList(Array.isArray(list) ? list : []);
      setViewRetailersTotal(total);
    } catch {
      setViewRetailersList([]);
      setViewRetailersTotal(0);
    } finally {
      setViewRetailersLoading(false);
    }
  };

  const loadViewWeek = async () => {
    if (!tradeShowId || viewWeekNumber == null) return;
    setViewWeekLoading(true);
    try {
      const res: any = await getInventoryAsPerTradeWeek({
        tradeId: tradeShowId,
        weekNumber: viewWeekNumber,
        page: viewWeekPage + 1,
        limit: viewWeekRowsPerPage,
      });
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      const total = typeof payload?.total === "number" ? payload.total : list.length;
      setViewWeekList(list.map((item: any) => toRemainItem(item)));
      setViewWeekTotal(total);
    } catch {
      setViewWeekList([]);
      setViewWeekTotal(0);
    } finally {
      setViewWeekLoading(false);
    }
  };

  useEffect(() => {
    if (viewProductsOpen) setViewProductsPage(0);
  }, [debouncedProductsSearch, viewProductsDisType]);

  useEffect(() => {
    if (viewProductsOpen && tradeShowId) loadViewProducts();
  }, [viewProductsOpen, tradeShowId, debouncedProductsSearch, viewProductsDisType, viewProductsPage, viewProductsRowsPerPage]);

  useEffect(() => {
    if (viewVendorsOpen) setViewVendorsPage(0);
  }, [debouncedVendorsSearch]);

  useEffect(() => {
    if (viewVendorsOpen && tradeShowId) loadViewVendors();
  }, [viewVendorsOpen, tradeShowId, debouncedVendorsSearch, viewVendorsPage, viewVendorsRowsPerPage]);

  useEffect(() => {
    if (viewRetailersOpen) setViewRetailersPage(0);
  }, [debouncedRetailersSearch]);

  useEffect(() => {
    if (viewRetailersOpen && tradeShowId) loadViewRetailers();
  }, [viewRetailersOpen, tradeShowId, debouncedRetailersSearch, viewRetailersPage, viewRetailersRowsPerPage]);

  useEffect(() => {
    if (viewWeekOpen && tradeShowId && viewWeekNumber != null) loadViewWeek();
  }, [viewWeekOpen, tradeShowId, viewWeekNumber, viewWeekPage, viewWeekRowsPerPage]);

  const cardSx = {
    borderRadius: 2,
    overflow: "hidden",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    boxShadow: theme.palette.mode === "dark" ? "none" : "0 2px 12px rgba(0,0,0,0.06)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    "&:hover": {
      boxShadow: theme.palette.mode === "dark" ? "0 0 0 1px rgba(255,255,255,0.08)" : "0 4px 20px rgba(0,0,0,0.08)",
      borderColor: theme.palette.divider,
    },
  };

  const sectionHeaderSx = {
    fontSize: 12,
    fontWeight: 500,
    color: "text.primary",
    display: "flex",
    alignItems: "center",
    gap: 0.75,
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
        py: { xs: 1, sm: 1.25 },
        px: { xs: 0.75, sm: 1.5 },
      }}
    >
      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.25 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/tradeshow-management")}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: 12,
              color: "text.secondary",
              "&:hover": { bgcolor: theme.palette.action.hover },
            }}
          >
            Back
          </Button>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === "dark" ? "none" : "0 4px 24px rgba(0,0,0,0.06)",
            p: { xs: 1.25, sm: 1.5 },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1.5, fontSize: 13 }}>
            Summary
          </Typography>

          {loading ? (
            <Typography color="text.secondary" sx={{ py: 2, fontSize: 12, textAlign: "center" }}>
              Loading summary...
            </Typography>
          ) : error ? (
            <Typography color="error" sx={{ py: 2, fontSize: 12, textAlign: "center" }}>
              {error}
            </Typography>
          ) : summaryData ? (
            <Stack spacing={1.5}>
              {/* Hero: Trade Show info */}
              <Card variant="outlined" sx={{ ...cardSx, bgcolor: theme.palette.mode === "dark" ? "grey.800" : "primary.50", borderColor: theme.palette.primary.main + "30" }}>
                <CardContent sx={{ py: 1, px: { xs: 1.25, sm: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                    <CalendarTodayOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    <Typography sx={sectionHeaderSx}>Trade Show</Typography>
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontSize: 11 }}>Name</Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: 12 }}>{summaryData.tradeShow.name || "—"}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontSize: 11 }}>Trade Show Date</Typography>
                      <Typography sx={{ fontSize: 12 }}>{summaryData.tradeShow.tradeShowDate ? dayjs(summaryData.tradeShow.tradeShowDate).format("MM/DD/YYYY") : "—"}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontSize: 11 }}>Delivery</Typography>
                      <Typography sx={{ fontSize: 12 }}>
                        {summaryData.tradeShow.deliveryStartDate && summaryData.tradeShow.deliveryEndDate
                          ? `${dayjs(summaryData.tradeShow.deliveryStartDate).format("MM/DD/YYYY")} – ${dayjs(summaryData.tradeShow.deliveryEndDate).format("MM/DD/YYYY")}`
                          : "—"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontSize: 11 }}>Weeks</Typography>
                      <Chip size="small" label={`${summaryData.tradeShow.deliveryWeeks ?? 0} weeks`} variant="outlined" sx={{ fontWeight: 500, fontSize: 11 }} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Products card — no count outside, View All icon */}
              <Card variant="outlined" sx={cardSx}>
                <Box sx={{ px: { xs: 1.25, sm: 1.5 }, py: 1, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Inventory2OutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    <Typography sx={sectionHeaderSx}>Products</Typography>
                  </Stack>
                  <Tooltip title="View all products">
                    <IconButton size="small" color="primary" onClick={() => { setViewProductsPage(0); setViewProductsOpen(true); }} sx={{ bgcolor: theme.palette.primary.main + "14" }}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ maxHeight: 280, overflow: "auto", overflowX: "auto" }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 400 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Item #</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Discount</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Min / Max</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(summaryData.data ?? []).map((row) => (
                        <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                          <TableCell sx={{ fontSize: 11 }}>{row.itemNumber ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{row.description ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{row.discount ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{row.minQuantity ?? "—"} / {row.maxQuantity ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{row.disType ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Card>

              {/* Vendors card */}
              <Card variant="outlined" sx={cardSx}>
                <Box sx={{ px: { xs: 1.25, sm: 1.5 }, py: 1, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <BusinessOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    <Typography sx={sectionHeaderSx}>Vendors</Typography>
                  </Stack>
                  <Tooltip title="View all vendors">
                    <IconButton size="small" color="primary" onClick={() => { setViewVendorsPage(0); setViewVendorsOpen(true); }} sx={{ bgcolor: theme.palette.primary.main + "14" }}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ maxHeight: 240, overflow: "auto", overflowX: "auto" }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 320 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Contact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(summaryData.vendors ?? []).map((v, idx) => (
                        <TableRow key={v.Primary_Vendor ?? idx} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                          <TableCell sx={{ fontSize: 11 }}>{v.Primary_Vendor ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{v.V_Description ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{[v.V_Email, v.V_Phone].filter(Boolean).join(" · ") || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Card>

              {/* Retailers card — always show so View All is available */}
              <Card variant="outlined" sx={cardSx}>
                <Box sx={{ px: { xs: 1.25, sm: 1.5 }, py: 1, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <StorefrontOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    <Typography sx={sectionHeaderSx}>Retailers</Typography>
                  </Stack>
                  <Tooltip title="View all retailers">
                    <IconButton size="small" color="primary" onClick={() => { setViewRetailersPage(0); setViewRetailersOpen(true); }} sx={{ bgcolor: theme.palette.primary.main + "14" }}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ maxHeight: 240, overflow: "auto", overflowX: "auto" }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 280 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(summaryData.retails?.rows ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ fontSize: 11, color: "text.secondary", py: 1, textAlign: "center" }}>No retailers in summary. Use View All to see full list.</TableCell>
                        </TableRow>
                      ) : (summaryData.retails?.rows ?? []).map((r, idx) => (
                        <TableRow key={r.retailerId ?? idx} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                          <TableCell sx={{ fontSize: 11 }}>{r.retailerId ?? "—"}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{r.retailerName ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Card>

              {/* Delivery by Week — with Start Date, End Date, count, View */}
              {(summaryData.weekWiseCounts?.length ?? 0) > 0 && (
                <Card variant="outlined" sx={cardSx}>
                  <Box sx={{ px: { xs: 1.25, sm: 1.5 }, py: 1, borderBottom: 1, borderColor: "divider" }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <LocalShippingOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                      <Typography sx={sectionHeaderSx}>Delivery by Week</Typography>
                    </Stack>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Week</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Start Date</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>End Date</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Products</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11, py: 0.75 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(summaryData.weekWiseCounts ?? []).map((w) => {
                        const hasDates = summaryData.tradeShow?.deliveryStartDate && summaryData.tradeShow?.deliveryEndDate;
                        const deliveryStart = hasDates ? dayjs(summaryData.tradeShow!.deliveryStartDate) : null;
                        const deliveryEnd = hasDates ? dayjs(summaryData.tradeShow!.deliveryEndDate) : null;
                        const weekStart = deliveryStart ? deliveryStart.add((w.weekNumber - 1) * 7, "day") : null;
                        const weekEnd = weekStart && deliveryEnd
                          ? (deliveryEnd.isBefore(weekStart.add(6, "day")) ? deliveryEnd : weekStart.add(6, "day"))
                          : null;
                        return (
                          <TableRow key={w.weekNumber} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                            <TableCell sx={{ fontSize: 11 }}>Week {w.weekNumber}</TableCell>
                            <TableCell sx={{ fontSize: 11 }}>{weekStart ? weekStart.format("MM/DD/YYYY") : "—"}</TableCell>
                            <TableCell sx={{ fontSize: 11 }}>{weekEnd ? weekEnd.format("MM/DD/YYYY") : "—"}</TableCell>
                            <TableCell><Chip size="small" label={w.count ?? 0} variant="outlined" /></TableCell>
                            <TableCell>
                              <Tooltip title="View products in this week">
                                <IconButton size="small" color="primary" onClick={() => { setViewWeekPage(0); setViewWeekNumber(w.weekNumber); setViewWeekOpen(true); }} sx={{ bgcolor: theme.palette.primary.main + "14" }}>
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </Stack>
          ) : null}
        </Paper>
      </Box>

      {/* View All Products modal */}
      <Dialog open={viewProductsOpen} onClose={() => setViewProductsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}>
        <DialogTitle sx={{ fontSize: 13, fontWeight: 500, borderBottom: 1, borderColor: "divider", py: 1, px: 1.5, bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>View All Products</DialogTitle>
        <DialogContent sx={{ p: 1.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.5, pt: 0.5 }} flexWrap="wrap" alignItems="center">
            <TextField size="small" placeholder="Search by item #" value={viewProductsSearch} onChange={(e) => setViewProductsSearch(e.target.value)} sx={{ minWidth: { xs: "100%", sm: 140 }, maxWidth: 180, "& .MuiInputBase-input": { fontSize: 11, py: 0.5 } }} inputProps={{ style: { fontSize: 11 } }} />
            <FormControl size="small" sx={{ minWidth: 90, "& .MuiSelect-select": { fontSize: 11, py: 0.5 } }}>
              <Select value={viewProductsDisType} onChange={(e) => setViewProductsDisType((e.target.value as "PERCENT" | "FLAT") || "")} displayEmpty>
                <MenuItem value="">All types</MenuItem>
                <MenuItem value="PERCENT">PERCENT</MenuItem>
                <MenuItem value="FLAT">FLAT</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {viewProductsLoading ? <Typography sx={{ py: 2, fontSize: 11, textAlign: "center", color: "text.secondary" }}>Loading...</Typography> : (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Item #</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Discount</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Min</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Max</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewProductsList.map((row: any, idx: number) => (
                    <TableRow key={row.id ?? idx}>
                      <TableCell sx={{ fontSize: 11 }}>{row.itemNumber ?? row.inventory?.Item_Number ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.description ?? row.inventory?.Description ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.discount ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.minQuantity ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.maxQuantity ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.disType ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination size="small" component="div" count={viewProductsTotal} page={viewProductsPage} onPageChange={(_, p) => setViewProductsPage(p)} rowsPerPage={viewProductsRowsPerPage} onRowsPerPageChange={(e) => { setViewProductsRowsPerPage(parseInt(e.target.value, 10)); setViewProductsPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Rows:" sx={{ borderTop: 1, borderColor: "divider" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider", py: 1, px: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => setViewProductsOpen(false)} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View All Vendors modal */}
      <Dialog open={viewVendorsOpen} onClose={() => setViewVendorsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}>
        <DialogTitle sx={{ fontSize: 13, fontWeight: 500, borderBottom: 1, borderColor: "divider", py: 1, px: 1.5, bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>View All Vendors</DialogTitle>
        <DialogContent sx={{ p: 1.5 }}>
          <TextField size="small" placeholder="Search by vendor name or ID" value={viewVendorsSearch} onChange={(e) => setViewVendorsSearch(e.target.value)} sx={{ mb: 1.5, pt: 0.5, minWidth: { xs: "100%", sm: 140 }, maxWidth: 200, "& .MuiInputBase-input": { fontSize: 11, py: 0.5 } }} inputProps={{ style: { fontSize: 11 } }} />
          {viewVendorsLoading ? <Typography sx={{ py: 2, fontSize: 11, textAlign: "center", color: "text.secondary" }}>Loading...</Typography> : (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewVendorsList.map((v: any, idx: number) => (
                    <TableRow key={v.id ?? v.vendorId ?? idx}>
                      <TableCell sx={{ fontSize: 11 }}>{v.vendorId ?? v.vendor?.Primary_Vendor ?? v.id ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.vendorName ?? v.vendor?.V_Description ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.vendor?.V_Email ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.vendor?.V_Phone ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.vendor?.V_City ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{v.vendor?.V_State ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination size="small" component="div" count={viewVendorsTotal} page={viewVendorsPage} onPageChange={(_, p) => setViewVendorsPage(p)} rowsPerPage={viewVendorsRowsPerPage} onRowsPerPageChange={(e) => { setViewVendorsRowsPerPage(parseInt(e.target.value, 10)); setViewVendorsPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Rows:" sx={{ borderTop: 1, borderColor: "divider" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider", py: 1, px: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => setViewVendorsOpen(false)} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View All Retailers modal */}
      <Dialog open={viewRetailersOpen} onClose={() => setViewRetailersOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}>
        <DialogTitle sx={{ fontSize: 13, fontWeight: 500, borderBottom: 1, borderColor: "divider", py: 1, px: 1.5, bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>View All Retailers</DialogTitle>
        <DialogContent sx={{ p: 1.5 }}>
          <TextField size="small" placeholder="Search by retailer name or ID" value={viewRetailersSearch} onChange={(e) => setViewRetailersSearch(e.target.value)} sx={{ mb: 1.5, pt: 0.5, minWidth: { xs: "100%", sm: 140 }, maxWidth: 200, "& .MuiInputBase-input": { fontSize: 11, py: 0.5 } }} inputProps={{ style: { fontSize: 11 } }} />
          {viewRetailersLoading ? <Typography sx={{ py: 2, fontSize: 11, textAlign: "center", color: "text.secondary" }}>Loading...</Typography> : (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewRetailersList.map((r: any, idx: number) => (
                    <TableRow key={r.id ?? r.retailerId ?? idx}>
                      <TableCell sx={{ fontSize: 11 }}>{r.retailerId ?? r.retailer?.C_Number ?? r.id ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.retailerName ?? r.retailer?.C_Name ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.retailer?.C_Email ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.retailer?.C_Phone ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.retailer?.C_City ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.retailer?.C_State ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination size="small" component="div" count={viewRetailersTotal} page={viewRetailersPage} onPageChange={(_, p) => setViewRetailersPage(p)} rowsPerPage={viewRetailersRowsPerPage} onRowsPerPageChange={(e) => { setViewRetailersRowsPerPage(parseInt(e.target.value, 10)); setViewRetailersPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Rows:" sx={{ borderTop: 1, borderColor: "divider" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider", py: 1, px: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => setViewRetailersOpen(false)} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Week Products modal */}
      <Dialog open={viewWeekOpen} onClose={() => { setViewWeekOpen(false); setViewWeekNumber(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}>
        <DialogTitle sx={{ fontSize: 13, fontWeight: 500, borderBottom: 1, borderColor: "divider", py: 1, px: 1.5, bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>Week {viewWeekNumber ?? ""} — Products</DialogTitle>
        <DialogContent sx={{ p: 1.5 }}>
          {viewWeekLoading ? <Typography sx={{ py: 2, fontSize: 11, textAlign: "center", color: "text.secondary" }}>Loading...</Typography> : (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Product ID</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Product Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewWeekList.map((item, idx) => (
                    <TableRow key={item.id ?? idx}>
                      <TableCell sx={{ fontSize: 11 }}>{item.itemNumber ?? item.id}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{item.name ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination size="small" component="div" count={viewWeekTotal} page={viewWeekPage} onPageChange={(_, p) => setViewWeekPage(p)} rowsPerPage={viewWeekRowsPerPage} onRowsPerPageChange={(e) => { setViewWeekRowsPerPage(parseInt(e.target.value, 10)); setViewWeekPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Rows:" sx={{ borderTop: 1, borderColor: "divider" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider", py: 1, px: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => { setViewWeekOpen(false); setViewWeekNumber(null); }} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradeshowSummaryView;
