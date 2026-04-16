import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import {
  mergeDraftSelectedOrdersFromRows,
  setDraftSelectedOrdersById,
  setRouteOptimizationOrders,
  type RouteOptimizationOrderRow,
} from "../../../redux/slices/routeOptimizationSlice";
import { createRetailerLocation, getAllOrderForDriver } from "../../../redux/apis/distrubutor/driverManagementApis";
import { getListOfRoutes } from "../../../redux/apis/distrubutor/listApis";
import type { AutoRouteOrderRow } from "./CreateRouteAutomatically";
import { calculateReturnInvoiceTotal, invoiceAmountFromApi, invoiceUrlFromApi } from "./CreateRouteAutomatically";
import { showErrorToast, showSuccessToast } from "../../../utils/toastUtils";

const FUTURE_ROW_BG_LIGHT = "#FFF4D1";
const FUTURE_ROW_BG_DARK = "rgba(255, 193, 7, 0.14)";
// const LEGEND_YELLOW = "#FFCD1B";
const PAGE_BG_LIGHT = "#F4F7F9";

function toIsoDateString(v: unknown): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
}

function isFutureDate(v: unknown): boolean {
  if (!v) return false;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function pickCustomerLatLng(cl: unknown): { customerLat: number | null; customerLng: number | null } {
  if (!cl || typeof cl !== "object") return { customerLat: null, customerLng: null };
  const o = cl as Record<string, unknown>;
  const latRaw = o.lat ?? o.latitude ?? o.Lat ?? o.Latitude;
  const lngRaw = o.lng ?? o.long ?? o.longitude ?? o.Lng ?? o.Longitude;
  const n = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const x = typeof v === "number" ? v : Number.parseFloat(String(v));
    return Number.isFinite(x) ? x : null;
  };
  return { customerLat: n(latRaw), customerLng: n(lngRaw) };
}

function buildAddressLine(row: AutoRouteOrderRow | null): string {
  const c = row?.customerForLocation;
  return [c?.C_Address, c?.C_City, c?.C_State, c?.C_Zip].filter(Boolean).join(", ");
}

function parseLatLongInput(value: string): { lat: number; long: number } | null {
  const parts = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = Number.parseFloat(parts[0]);
  const long = Number.parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(long)) return null;
  return { lat, long };
}

const CreateRouteManually: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const draftSelectedOrdersById = useAppSelector((s) => s.routeOptimization.draftSelectedOrdersById);
  const primary = theme.palette.primary.main;
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("regular");
  const [routeOptions, setRouteOptions] = useState<string[]>([]);
  const [pendingRows, setPendingRows] = useState<AutoRouteOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRankById, setSelectedRankById] = useState<Record<string, number>>({});
  const [selectionCounter, setSelectionCounter] = useState(0);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationTarget, setLocationTarget] = useState<AutoRouteOrderRow | null>(null);
  const [locationLatLongInput, setLocationLatLongInput] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  const routePlanningDateOverride = useMemo(() => {
    const st = (location.state as { routeDate?: string } | null)?.routeDate;
    return st && /^\d{4}-\d{2}-\d{2}$/.test(st) ? st : null;
  }, [location.state]);


  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const res = await getListOfRoutes();
        const body = (res as any)?.data?.data ?? (res as any)?.data ?? {};
        const fromWithoutStop = Array.isArray(body?.routesWithoutStop) ? body.routesWithoutStop : [];
        const fromWithStop = Array.isArray(body?.routesWithStop) ? body.routesWithStop : [];
        const parsedWithoutStop = fromWithoutStop
          .map((r: any) => String(r?.Route_Number ?? r?.routeNumber ?? r?.route ?? "").trim())
          .filter((r: string) => !!r);
        const parsedWithStopFallback = fromWithStop
          .map((r: any) => String(r?.Route_Number ?? r?.routeNumber ?? r?.Stop_Number ?? r?.stopNumber ?? "").trim())
          .filter((r: string) => !!r);
        const parsed: string[] = parsedWithoutStop.length > 0 ? parsedWithoutStop : parsedWithStopFallback;
        if (!alive) return;
        setRouteOptions(Array.from(new Set(parsed)).sort());
      } catch {
        if (alive) setRouteOptions([]);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setLoading(true);
        const res = await getAllOrderForDriver({
          page: page + 1,
          limit: rowsPerPage,
          routeNumber: routeFilter || undefined,
          orderType: orderTypeFilter || undefined,
        });
        const payload = (res as any)?.data?.data ?? (res as any)?.data;
        const list = payload?.data ?? (Array.isArray(payload) ? payload : []);
        const pagination = payload?.pagination ?? {};
        const mapped: AutoRouteOrderRow[] = (Array.isArray(list) ? list : []).map((o: any, idx: number) => {
          const customer = o?.customer ?? null;
          const customerLocation = o?.customerLocation;
          const hasCustomerLocation =
            !!customerLocation && typeof customerLocation === "object" && Object.keys(customerLocation).length > 0;
          const { customerLat, customerLng } = pickCustomerLatLng(customerLocation);
          const orderNumber = o?.Order_Number ?? o?.orderNumber ?? idx + 1;
          const orderDate = o?.Order_Date ?? o?.orderDate;
          const routeNumber = o?.Route_Number ?? o?.routeNumber ?? "";
          const stopNumber = o?.Stop_Number ?? o?.stopNumber ?? 0;
          const cNumber = customer?.C_Number ?? o?.C_Number;
          const apiOrderType = o?.Order_Type ?? o?.orderType ?? null;
          return {
            id: String(orderNumber),
            srNo: Number(orderNumber),
            accountNumber: String(cNumber ?? ""),
            customerName: String(customer?.C_Name ?? ""),
            customerAddress: String(
              [customer?.C_Address, customer?.C_City, customer?.C_State, customer?.C_Zip].filter(Boolean).join(", ")
            ),
            route: String(routeNumber || ""),
            stop: Number(stopNumber || 0),
            deliveryDay: routePlanningDateOverride ?? toIsoDateString(orderDate),
            invoiceNumber: String(o?.Invoice_Number ?? ""),
            invoiceDate: toIsoDateString(orderDate),
            totalBalance: apiOrderType === 6 ? calculateReturnInvoiceTotal(o) : Number(o?.Invoice_Total ?? 0),
            futureDelivery: isFutureDate(orderDate),
            hasCustomerLocation,
            customerNumber: typeof cNumber === "number" ? cNumber : Number(cNumber),
            customerForLocation: customer,
            customerLat,
            customerLng,
            invoiceAmount: invoiceAmountFromApi(o),
            invoiceUrl: invoiceUrlFromApi(o),
            orderType: apiOrderType != null ? Number(apiOrderType) : null,
          };
        });
        if (!alive) return;
        setPendingRows(mapped);
        setTotalRecords(Number(pagination?.totalRecords ?? mapped.length));
        dispatch(mergeDraftSelectedOrdersFromRows(mapped));
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [page, rowsPerPage, dispatch, routePlanningDateOverride, routeFilter, orderTypeFilter]);

  const sourceRows = pendingRows;

  const selectedRows = useMemo(() => {
    return Object.values(draftSelectedOrdersById).sort((a, b) => {
      if (a.stop !== b.stop) return a.stop - b.stop;
      const aRank = selectedRankById[a.id] ?? Number.MAX_SAFE_INTEGER;
      const bRank = selectedRankById[b.id] ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return a.srNo - b.srNo;
    });
  }, [draftSelectedOrdersById, selectedRankById]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sourceRows.filter((row) => {
      if (!q) return true;
      const blob = [String(row.srNo), row.accountNumber, row.customerName, row.customerAddress, row.route, row.invoiceNumber]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [sourceRows, search]);

  const eligibleFilteredRows = useMemo(() => filteredRows, [filteredRows]);
  const allSelected = eligibleFilteredRows.length > 0 && eligibleFilteredRows.every((r) => !!draftSelectedOrdersById[r.id]);
  const someSelected = eligibleFilteredRows.some((r) => !!draftSelectedOrdersById[r.id]);

  const toggleAll = () => {
    const next: Record<string, RouteOptimizationOrderRow> = { ...draftSelectedOrdersById };
    if (allSelected) {
      eligibleFilteredRows.forEach((r) => {
        delete next[r.id];
      });
      dispatch(setDraftSelectedOrdersById(next));
    } else {
      const rankNext = { ...selectedRankById };
      let counter = selectionCounter;
      eligibleFilteredRows.forEach((r) => {
        next[r.id] = r;
        if (rankNext[r.id] == null) {
          counter += 1;
          rankNext[r.id] = counter;
        }
      });
      setSelectionCounter(counter);
      setSelectedRankById(rankNext);
      dispatch(setDraftSelectedOrdersById(next));
    }
  };

  const toggleOne = (id: string) => {
    const row = sourceRows.find((x) => x.id === id);
    if (!row) return;
    const turningOn = !draftSelectedOrdersById[id];
    const next: Record<string, RouteOptimizationOrderRow> = { ...draftSelectedOrdersById };
    if (!turningOn) {
      delete next[id];
      dispatch(setDraftSelectedOrdersById(next));
      return;
    }
    next[id] = row;
    setSelectionCounter((prev) => {
      const nextCounter = prev + 1;
      setSelectedRankById((rank) => ({ ...rank, [id]: nextCounter }));
      return nextCounter;
    });
    dispatch(setDraftSelectedOrdersById(next));
  };

  const hasAnySelection = selectedRows.length > 0;
  const handleOptimizeClick = () => {
    if (!hasAnySelection) return;
    const missing = selectedRows.find((r) => !r.hasCustomerLocation);
    if (missing) {
      showErrorToast("Please set the location for selected orders.");
      return;
    }
    dispatch(setRouteOptimizationOrders(selectedRows));
    navigate("/admin/driver-management/select-driver-vehicle", {
      state: {
        nextPath: "/admin/driver-management/manual-route-optimize",
        returnPath: "/admin/driver-management/create-route-manual",
        routeDate: routePlanningDateOverride ?? selectedRows[0]?.deliveryDay,
      },
    });
  };

  const closeLocationDialog = () => {
    setLocationDialogOpen(false);
    setLocationTarget(null);
    setLocationLatLongInput("");
  };

  const openLocationDialogForRow = (row: AutoRouteOrderRow) => {
    setLocationTarget(row);
    const defaultLatLong =
      row.customerLat != null && row.customerLng != null
        ? `${row.customerLat}, ${row.customerLng}`
        : "";
    setLocationLatLongInput(defaultLatLong);
    setLocationDialogOpen(true);
  };

  const handleOpenInGoogleMaps = () => {
    const c = locationTarget?.customerForLocation;
    const queryText =
      [c?.C_Address, c?.C_City, c?.C_State, c?.C_Zip].filter(Boolean).join(", ") ||
      locationLatLongInput.trim() ||
      "United States";
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSetLocation = async () => {
    const row = locationTarget;
    const c = row?.customerForLocation;
    const cNumber = row?.customerNumber;

    if (!row || !c || !cNumber || Number.isNaN(Number(cNumber))) {
      showErrorToast("Missing customer details to set location.");
      return;
    }

    const parsedLatLong = parseLatLongInput(locationLatLongInput);
    if (!parsedLatLong) {
      showErrorToast("Enter valid latitude/longitude in format: lat, long");
      return;
    }

    setSavingLocation(true);
    try {
      await createRetailerLocation({
        C_Number: Number(cNumber),
        lat: parsedLatLong.lat,
        long: parsedLatLong.long,
        City: c.C_City ?? null,
        Country: "United States",
        Address: c.C_Address ?? null,
        State: c.C_State ?? null,
        Zip: String(c.C_Zip ?? ""),
      });
      showSuccessToast("Customer location saved.");
      closeLocationDialog();

      const res = await getAllOrderForDriver({
        page: page + 1,
        limit: rowsPerPage,
        routeNumber: routeFilter || undefined,
        orderType: orderTypeFilter || undefined,
      });
      const payload = (res as any)?.data?.data ?? (res as any)?.data;
      const list = payload?.data ?? (Array.isArray(payload) ? payload : []);
      const pagination = payload?.pagination ?? {};
      const mapped: AutoRouteOrderRow[] = (Array.isArray(list) ? list : []).map((o: any, idx: number) => {
        const customer = o?.customer ?? null;
        const customerLocation = o?.customerLocation;
        const hasCustomerLocation =
          !!customerLocation && typeof customerLocation === "object" && Object.keys(customerLocation).length > 0;
        const { customerLat, customerLng } = pickCustomerLatLng(customerLocation);
        const orderNumber = o?.Order_Number ?? o?.orderNumber ?? idx + 1;
        const orderDate = o?.Order_Date ?? o?.orderDate;
        const routeNumber = o?.Route_Number ?? o?.routeNumber ?? "";
        const stopNumber = o?.Stop_Number ?? o?.stopNumber ?? 0;
        const cNumberInner = customer?.C_Number ?? o?.C_Number;
        const apiOrderType = o?.Order_Type ?? o?.orderType ?? null;
        return {
          id: String(orderNumber),
          srNo: Number(orderNumber),
          accountNumber: String(cNumberInner ?? ""),
          customerName: String(customer?.C_Name ?? ""),
          customerAddress: String(
            [customer?.C_Address, customer?.C_City, customer?.C_State, customer?.C_Zip].filter(Boolean).join(", ")
          ),
          route: String(routeNumber || ""),
          stop: Number(stopNumber || 0),
          deliveryDay: routePlanningDateOverride ?? toIsoDateString(orderDate),
          invoiceNumber: String(o?.Invoice_Number ?? ""),
          invoiceDate: toIsoDateString(orderDate),
          totalBalance: apiOrderType === 6 ? calculateReturnInvoiceTotal(o) : Number(o?.Invoice_Total ?? 0),
          futureDelivery: isFutureDate(orderDate),
          hasCustomerLocation,
          customerNumber: typeof cNumberInner === "number" ? cNumberInner : Number(cNumberInner),
          customerForLocation: customer,
          customerLat,
          customerLng,
          invoiceAmount: invoiceAmountFromApi(o),
          invoiceUrl: invoiceUrlFromApi(o),
          orderType: apiOrderType != null ? Number(apiOrderType) : null,
        };
      });
      setPendingRows(mapped);
      setTotalRecords(Number(pagination?.totalRecords ?? mapped.length));
      dispatch(mergeDraftSelectedOrdersFromRows(mapped));
    } catch (e: any) {
      showErrorToast(e?.message || "Failed to set customer location.");
    } finally {
      setSavingLocation(false);
    }
  };

  const futureBg = theme.palette.mode === "light" ? FUTURE_ROW_BG_LIGHT : FUTURE_ROW_BG_DARK;
  const pageBg = theme.palette.mode === "light" ? PAGE_BG_LIGHT : "background.default";
  const headerBg = primary;
  const rowBorder = theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const cardBg = theme.palette.mode === "light" ? "#FFFFFF" : theme.palette.background.paper;

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", pb: 3, bgcolor: pageBg, borderRadius: 0, boxSizing: "border-box" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
          mb: 0,
          pb: 0,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1.25 }}>
          <Button
            onClick={() => navigate("/admin/driver-management")}
            sx={{
              textTransform: "none",
              p: 0,
              minWidth: 0,
              mb: 0,
              mt: 0,
              color: "color.primary",
              fontWeight: 500,
              fontSize: 14,
              justifyContent: "flex-start",
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            ← Back
          </Button>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: { xs: "0.875rem", sm: "1rem" },
              color: theme.palette.mode === "light" ? "#1A2D3D" : "text.primary",
              mb: 0,
              mt: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Create Route Manually
          </Typography>
        </Box>
        {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
          <Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: LEGEND_YELLOW, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500 }}>
            Scheduled for future delivery dates
          </Typography>
        </Box> */}
      </Box>

      <Paper
        elevation={0}
        sx={{
          mt: 0,
          borderRadius: "0px 8px 8px 8px",
          border: "1px solid",
          borderColor: theme.palette.mode === "light" ? "#E4E9EF" : "divider",
          bgcolor: cardBg,
          overflow: "hidden",
          boxShadow:
            theme.palette.mode === "light"
              ? "0px 2px 12px rgba(15, 35, 55, 0.06)"
              : "0px 2px 12px rgba(0, 0, 0, 0.35)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "stretch", lg: "center" },
            justifyContent: { xs: "flex-start", lg: "space-between" },
            gap: { xs: 1.5, lg: 2 },
            px: { xs: 1.5, sm: 2 },
            pt: { xs: 1.5, sm: 1.75 },
            pb: { xs: 1.25, sm: 1.5 },
            bgcolor: cardBg,
          }}
        >
          <Box sx={{ width: { xs: "100%", lg: "auto" } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search Orders"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined,
                },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", width: { xs: "100%", lg: "auto" } }}>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 170 }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
              <InputLabel id="route-filter-label">Route</InputLabel>
              <Select
                labelId="route-filter-label"
                label="Route"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value as string)}
                sx={{ borderRadius: "8px" }}
              >
                <MenuItem value="">All</MenuItem>
                {routeOptions.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
              <InputLabel id="order-type-filter-label">Order Type</InputLabel>
              <Select
                labelId="order-type-filter-label"
                label="Order Type"
                value={orderTypeFilter}
                onChange={(e) => {
                  setOrderTypeFilter(e.target.value as string);
                  setPage(0);
                }}
                sx={{ borderRadius: "8px" }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="return">Return</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              disableElevation
              onClick={handleOptimizeClick}
              disabled={!hasAnySelection}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                px: 2.5,
                py: 1,
                fontWeight: 600,
                bgcolor: headerBg,
                color: "#fff",
                alignSelf: { xs: "stretch", lg: "center" },
                minWidth: { xs: "100%", lg: 116 },
                "&:hover": { bgcolor: headerBg, opacity: 0.94 },
                "&.Mui-disabled": {
                  bgcolor: theme.palette.mode === "light" ? "rgba(60, 119, 149, 0.35)" : "rgba(60, 119, 149, 0.25)",
                  color: "rgba(255,255,255,0.9)",
                },
              }}
            >
              Next  
            </Button>
          </Box>
        </Box>

        <TableContainer
          sx={{
            overflow: "auto",
            borderTop: `1px solid ${rowBorder}`,
            height: { xs: "min(46vh, 360px)", sm: "calc(100vh - 420px)" },
            overflowY: "auto",
            bgcolor: cardBg,
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: 1100,
              borderCollapse: "separate",
              "& .MuiTableCell-head": {
                py: 1.125,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              },
              "& .MuiTableCell-body": {
                py: 1,
                fontSize: 13,
                borderBottom: `1px solid ${rowBorder}`,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{ py: 1, bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}` }}
                >
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    sx={{ color: "rgba(255,255,255,0.7)", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#fff" } }}
                  />
                </TableCell>
                {[
                  "SR NO.",
                  "Account Number",
                  "Customer Name",
                  "Customer Address",
                  "Route",
                  "Stop",
                  "Delivery Day",
                  "Invoice Number",
                  "Invoice Date",
                  "Total Balance",
                  "Action",
                ].map((label) => (
                  <TableCell
                    key={label}
                    sx={{
                      py: 1,
                      bgcolor: headerBg,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${headerBg}`,
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <CircularProgress size={18} />
                      Loading orders...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id} hover sx={{ bgcolor: row.futureDelivery ? futureBg : cardBg }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={!!draftSelectedOrdersById[row.id]}
                        onChange={() => toggleOne(row.id)}
                        sx={{ color: "action.active", "&.Mui-checked": { color: headerBg } }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{row.srNo}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{row.accountNumber}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{row.customerAddress}</TableCell>
                    <TableCell>{row.route}</TableCell>
                    <TableCell align="center">{row.stop}</TableCell>
                    <TableCell>{row.deliveryDay}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{row.invoiceNumber}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{row.invoiceDate}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {formatMoney(row.totalBalance)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", bgcolor: row.futureDelivery ? futureBg : cardBg }}>
                      {!row.hasCustomerLocation ? (
                        <Tooltip title="Customer location missing">
                          <IconButton
                            size="small"
                            onClick={() => openLocationDialogForRow(row)}
                            sx={{ color: theme.palette.warning.main }}
                          >
                            <ReportProblemOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            borderTop: `1px solid ${rowBorder}`,
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            px: { xs: 1.25, sm: 1.5 },
            py: 0.5,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
            Selected: {selectedRows.length}
          </Typography>
          <TablePagination
            component="div"
            count={totalRecords}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              ml: { xs: 0, sm: "auto" },
              width: { xs: "100%", sm: "auto" },
              "& .MuiTablePagination-toolbar": {
                px: { xs: 0, sm: 1 },
                minHeight: { xs: 38, sm: 44 },
                flexWrap: "wrap",
                justifyContent: { xs: "space-between", sm: "flex-end" },
                gap: 0.5,
              },
              "& .MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: { xs: 12, sm: 13 },
                m: 0,
              },
            }}
          />
        </Box>
      </Paper>
      <Dialog open={locationDialogOpen} onClose={savingLocation ? undefined : closeLocationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Set customer location?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            This customer has no saved location. Open map, copy latitude/longitude, paste below, then save.
          </Typography>
          {!!locationTarget?.customerForLocation && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                {locationTarget.customerForLocation.C_Name ?? "Customer"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                {buildAddressLine(locationTarget)}
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="Lat, Long"
              size="small"
              fullWidth
              value={locationLatLongInput}
              onChange={(e) => setLocationLatLongInput(e.target.value)}
              placeholder="lat, long"
            />
            <Button
              variant="outlined"
              onClick={handleOpenInGoogleMaps}
              sx={{ textTransform: "none", borderRadius: "8px", boxShadow: "none", whiteSpace: "nowrap" }}
            >
              Open Map
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeLocationDialog}
            disabled={savingLocation}
            sx={{ textTransform: "none", borderRadius: "8px", boxShadow: "none" }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSetLocation}
            disabled={savingLocation}
            sx={{ color: "#fff", fontWeight: 500, fontSize: 14, borderRadius: "8px", boxShadow: "none", textTransform: "none" }}
          >
            {savingLocation ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "#fff" }} />
                Saving...
              </Box>
            ) : (
              "Set location"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateRouteManually;
