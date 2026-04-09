import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import RouteCalendarColumn from "./RouteCalendarColumn";
import RouteDayViewPanel from "./RouteDayViewPanel";
import RouteFullReportDeliveryTable from "./RouteFullReportDeliveryTable";
import { CreatedRouteGroup, getCreatedRoutes } from "../../../redux/apis/distrubutor/routeViewApis";

const VIEW_ROUTE_PARAM = "view-route";
const GROUP_ID_PARAM = "groupId";
const ROUTE_ID_PARAM = "routeId";

export type ViewRoutesContentProps =
  | {
      /** Inline on Routes tab — no route change, no URL sync */
      mode: "embedded";
      selectedDate: Dayjs;
      onDateChange: (d: Dayjs) => void;
      onClose: () => void;
    }
  | {
      /** Standalone page with URL query sync */
      mode: "page";
    };

const ViewRoutesContent: React.FC<ViewRoutesContentProps> = (props) => {
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);

  const [urlDate, setUrlDate] = useState<Dayjs>(() => {
    const raw = searchParams.get("date");
    if (raw && dayjs(raw).isValid()) return dayjs(raw);
    return dayjs();
  });

  const urlGroupId = useMemo(() => {
    const raw = searchParams.get(GROUP_ID_PARAM);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const urlChildRouteId = useMemo(() => {
    const raw = searchParams.get(ROUTE_ID_PARAM);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  /** Selected child route for full-report table — synced from URL (page) and from RouteDayViewPanel (all modes). */
  const [reportRouteId, setReportRouteId] = useState<number | null>(null);
  /** Bumps when route-full-stops reloads so delivery report refetches full-report (new deliveries after refresh). */
  const [fullReportRefreshKey, setFullReportRefreshKey] = useState(0);

  const bumpFullReportRefresh = useCallback(() => {
    setFullReportRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (props.mode === "embedded") return;
    const raw = searchParams.get("date");
    if (raw && dayjs(raw).isValid()) {
      const next = dayjs(raw);
      setUrlDate((prev) => (next.isSame(prev, "day") ? prev : next));
    }
  }, [searchParams, props.mode]);

  const selectedDate = props.mode === "embedded" ? props.selectedDate : urlDate;

  const setSelectedDate = useCallback(
    (d: Dayjs) => {
      if (props.mode === "embedded") {
        props.onDateChange(d);
      } else {
        setUrlDate(d);
        setSearchParams(
          {
            [VIEW_ROUTE_PARAM]: "1",
            date: d.format("YYYY-MM-DD"),
          },
          { replace: true }
        );
      }
    },
    [props, setSearchParams]
  );

  const handleRouteSelectionSync = useCallback(
    (sel: { groupId: number; childRouteId: number }) => {
      setReportRouteId(sel.childRouteId);
      if (props.mode !== "page") return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(VIEW_ROUTE_PARAM, "1");
          next.set("date", selectedDate.format("YYYY-MM-DD"));
          next.set(GROUP_ID_PARAM, String(sel.groupId));
          next.set(ROUTE_ID_PARAM, String(sel.childRouteId));
          return next;
        },
        { replace: true }
      );
    },
    [props.mode, selectedDate, setSearchParams]
  );

  useEffect(() => {
    if (props.mode === "page") {
      setReportRouteId(urlChildRouteId);
    }
  }, [props.mode, urlChildRouteId]);

  useEffect(() => {
    if (isLgUp) setCalendarDrawerOpen(false);
  }, [isLgUp]);

  const [routeGroups, setRouteGroups] = useState<CreatedRouteGroup[]>([]);
  const [routesListLoading, setRoutesListLoading] = useState(false);

  const loadRoutesForDate = useCallback(async () => {
    setRoutesListLoading(true);
    try {
      const res = await getCreatedRoutes(selectedDate.format("YYYY-MM-DD"));
      setRouteGroups(res.data?.data ?? []);
    } catch {
      setRouteGroups([]);
    } finally {
      setRoutesListLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadRoutesForDate();
  }, [loadRoutesForDate]);

  useEffect(() => {
    if (routeGroups.length === 0) setReportRouteId(null);
  }, [routeGroups.length]);

  useEffect(() => {
    if (props.mode !== "embedded") return;
    setReportRouteId(null);
  }, [props.mode, selectedDate]);

  useEffect(() => {
    if (props.mode === "embedded") return;
    if (searchParams.get(VIEW_ROUTE_PARAM) === "1") return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(VIEW_ROUTE_PARAM, "1");
        if (!next.get("date")) next.set("date", dayjs().format("YYYY-MM-DD"));
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams, props.mode]);

  const formattedTitle = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(selectedDate.toDate());

  const shortDateLabel = selectedDate.format("MMM D, YYYY");

  const onMobileCalendarChange = (d: Dayjs) => {
    setSelectedDate(d);
    setCalendarDrawerOpen(false);
  };

  const handleBack = () => {
    if (props.mode === "embedded") {
      props.onClose();
    } else {
      navigate("/admin/driver-management");
    }
  };

  return (
    <Box sx={{ width: "100%", pb: { xs: props.mode === "embedded" ? 0 : 2, sm: props.mode === "embedded" ? 0 : 2.5 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Button
        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
        onClick={handleBack}
        size="small"
        sx={{ mb: 1, textTransform: "none", fontWeight: 500, fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: 0.5 }}
      >
        <Typography
        variant="body2"
        sx={{ fontWeight: 500,color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" }, lineHeight: 1.35 }}
      >
        View routes
      </Typography>
      </Button>

      
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 1, sm: 1.25 }, fontSize: "0.8125rem", fontWeight: 400 }}
      >
        {formattedTitle}
      </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: { xs: 1.5, lg: 2.5 },
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        {props.mode === "page" && !isLgUp && (
          <Button
            fullWidth
            variant="outlined"
            size="medium"
            startIcon={<CalendarMonthOutlinedIcon />}
            onClick={() => setCalendarDrawerOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              py: 1,
              borderRadius: 2,
              justifyContent: "flex-start",
              borderColor: "divider",
            }}
          >
            Calendar · {shortDateLabel}
          </Button>
        )}

        {props.mode === "page" && isLgUp && (
          <Box
            sx={{
              width: 320,
              flexShrink: 0,
              position: "sticky",
              top: 8,
              alignSelf: "flex-start",
            }}
          >
            <RouteCalendarColumn selectedDate={selectedDate} onSelectedDateChange={setSelectedDate} />
          </Box>
        )}

        {props.mode === "page" && (
          <Drawer
            anchor="left"
            open={calendarDrawerOpen && !isLgUp}
            onClose={() => setCalendarDrawerOpen(false)}
            PaperProps={{ sx: { width: "min(100vw - 24px, 340px)", borderRadius: 2 } }}
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
              }}
            >
              <Typography sx={{ fontWeight: 500, fontSize: "0.9375rem" }}>Select date</Typography>
              <IconButton size="small" onClick={() => setCalendarDrawerOpen(false)} aria-label="Close calendar">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ p: 1 }}>
              <RouteCalendarColumn selectedDate={selectedDate} onSelectedDateChange={onMobileCalendarChange} />
            </Box>
          </Drawer>
        )}

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            borderRadius: 2,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            p: { xs: 1.25, sm: 1.5, lg: 2 },
            minHeight: { xs: props.mode === "embedded" ? 320 : 200, md: props.mode === "embedded" ? 360 : 240 },
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: (t) =>
              t.palette.mode === "light" ? "0 1px 2px rgba(15, 23, 42, 0.05), 0 4px 24px rgba(15, 23, 42, 0.04)" : "none",
          }}
        >
          {routesListLoading && routeGroups.length > 0 && (
            <LinearProgress
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 3,
                height: 2,
                borderRadius: "2px 2px 0 0",
              }}
            />
          )}

          {routesListLoading && routeGroups.length === 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {!routesListLoading && routeGroups.length === 0 && (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ fontSize: "0.8125rem", fontWeight: 400 }}>
                No routes for this date.
              </Typography>
            </Box>
          )}

          {routeGroups.length > 0 && (
            <RouteDayViewPanel
              routeGroups={routeGroups}
              selectedDate={selectedDate}
              onRefresh={loadRoutesForDate}
              listLoading={routesListLoading}
              hideTitleRow
              initialGroupId={props.mode === "page" ? urlGroupId : null}
              initialChildRouteId={props.mode === "page" ? urlChildRouteId : null}
              onSelectionSync={handleRouteSelectionSync}
              onRouteStopsLoaded={bumpFullReportRefresh}
            />
          )}
        </Paper>
      </Box>

      {reportRouteId != null && routeGroups.length > 0 && (
        <RouteFullReportDeliveryTable routeId={reportRouteId} refreshKey={fullReportRefreshKey} />
      )}
    </Box>
  );
};

export default ViewRoutesContent;
