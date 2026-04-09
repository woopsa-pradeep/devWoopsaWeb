import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../../redux/store";
import { clearRouteOptimizationSession } from "../../../redux/slices/routeOptimizationSlice";
import subtractHexIcon from "../../../assets/Subtract.svg";
import driverRouteIcon from "../../../assets/driverRoute.svg";
import CustomButton from "../../atoms/CustomButton";
import RouteCalendarColumn from "./RouteCalendarColumn";
import ViewRoutesContent from "./ViewRoutesContent";
import { showErrorToast } from "../../../utils/toastUtils";

/** True when selected calendar day is strictly before today (local). Today and future are allowed. */
function isBeforeToday(d: Dayjs): boolean {
  return d.startOf("day").isBefore(dayjs().startOf("day"));
}

const RouteTab: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [tripSettingsOpen, setTripSettingsOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"auto" | "manual">("auto");
  const [viewRoutesOpen, setViewRoutesOpen] = useState(() => searchParams.get("view-route") === "1");

  useEffect(() => {
    const isOpenFromUrl = searchParams.get("view-route") === "1";
    setViewRoutesOpen(isOpenFromUrl);
    if (isOpenFromUrl) {
      const rawDate = searchParams.get("date");
      if (rawDate && dayjs(rawDate).isValid()) {
        const d = dayjs(rawDate);
        setSelectedDate((prev) => (prev.isSame(d, "day") ? prev : d));
      }
    }
  }, [searchParams]);

  const openViewRoutes = useCallback(() => {
    setViewRoutesOpen(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view-route", "1");
      next.set("date", selectedDate.format("YYYY-MM-DD"));
      return next;
    });
  }, [selectedDate, setSearchParams]);

  const closeViewRoutes = useCallback(() => {
    setViewRoutesOpen(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("view-route");
      next.delete("date");
      return next;
    });
  }, [setSearchParams]);

  /** Keep `date` in the URL in sync when the calendar changes while View Routes is open. */
  const handleSelectedDateChange = useCallback(
    (d: Dayjs) => {
      setSelectedDate(d);
      if (searchParams.get("view-route") === "1") {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("view-route", "1");
          next.set("date", d.format("YYYY-MM-DD"));
          return next;
        });
      }
    },
    [searchParams, setSearchParams],
  );

  const formattedHeaderDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).format(selectedDate.toDate());
  }, [selectedDate]);

  const weekdayName = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(selectedDate.toDate());
  }, [selectedDate]);

  const primary = theme.palette.primary.main;

  const handleTripSettingsOkay = () => {
    if (isBeforeToday(selectedDate)) {
      showErrorToast("Please select a valid date. You cannot choose a previous date.");
      return;
    }
    setTripSettingsOpen(false);
    dispatch(clearRouteOptimizationSession());
    navigate(createMode === "manual" ? "/admin/driver-management/create-route-manual" : "/admin/driver-management/create-route-automatic", {
      state: { routeDate: selectedDate.format("YYYY-MM-DD") },
    });
  };

  const openCreateRouteAutomatic = () => {
    if (isBeforeToday(selectedDate)) {
      showErrorToast("Please select a valid date. You cannot choose a previous date.");
      return;
    }
    setCreateMode("auto");
    setTripSettingsOpen(true);
  };

  const handleCreateRouteManually = () => {
    if (isBeforeToday(selectedDate)) {
      showErrorToast("Please select a valid date. You cannot choose a previous date.");
      return;
    }
    setCreateMode("manual");
    setTripSettingsOpen(true);
  };

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 1,
      }}
    >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 2 },
            alignItems: { md: "stretch" },
            width: "100%",
            height: {xs:"auto",md:"calc(100vh - 240px)"},
          }}
        >
        <RouteCalendarColumn selectedDate={selectedDate} onSelectedDateChange={handleSelectedDateChange} />

        {viewRoutesOpen ? (
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: { xs: 400, md: 480 } }}>
            <ViewRoutesContent
              mode="embedded"
              selectedDate={selectedDate}
              onDateChange={handleSelectedDateChange}
              onClose={closeViewRoutes}
            />
          </Box>
        ) : (
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: 280, md: 360 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1,
              px: { xs: 1.5, sm: 2 },
              pt: { xs: 1.5, sm: 2 },
              pb: 1,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.mode === "light" ? "#1A2038" : "text.primary",
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                Route Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {formattedHeaderDate}
              </Typography>
            </Box>
            {!isBeforeToday(selectedDate) && <Typography
              component="button"
              type="button"
              onClick={openViewRoutes}
              sx={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: primary,
                fontWeight: 500,
                fontSize: 14,
                fontFamily: "inherit",
                p: 0,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View routes
            </Typography>}
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 2, sm: 3 },
              py: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={driverRouteIcon}
                alt=""
                sx={{ width: 60, height: 60, display: "block" }}
              />
            </Box>
            <Typography
              sx={{
                fontWeight: 600,
                color: "text.primary",
                fontSize: { xs: 15, sm: 16 },
                mb: 0.5,
              }}
            >
             { isBeforeToday(selectedDate) ? `${weekdayName}'s Routes` : "Plan Your Routes" }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360 }}>
            { isBeforeToday(selectedDate) ? "Review the path, stops, and timing for your scheduled routes" : "Build, manage, and optimize routes for " + weekdayName }
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
                width: "100%",
                justifyContent: "center",
              }}
            >
              {isBeforeToday(selectedDate) ? <CustomButton
                buttonType="primary"
                appearance="filled"
                fullWidth={false}
                onClick={() => setViewRoutesOpen(true)}
                sx={{ mt: 0, minHeight: 44, fontWeight: 500, fontSize: 14, borderRadius: "8px" }}
              >
                View routes
              </CustomButton> : 
              <>
              <CustomButton
                buttonType="primary"
                appearance="filled"
                fullWidth={false}
                onClick={openCreateRouteAutomatic}
                sx={{ mt: 0, minHeight: 44, fontWeight: 500, fontSize: 14, borderRadius: "8px" }}
              >
                Create route automatic
              </CustomButton>
              <CustomButton
                buttonType="primary"
                appearance="outlined"
                fullWidth={false}
                onClick={handleCreateRouteManually}
                sx={{ mt: 0, minHeight: 44, fontWeight: 500, fontSize: 14, borderRadius: "8px" }}
              >
                Create route manually
              </CustomButton>
              </> }
            </Box>
          </Box>
        </Paper>
        )}
      </Box>

      <Dialog
        open={tripSettingsOpen}
        onClose={() => setTripSettingsOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            px: { xs: 2, sm: 3 },
            py: { xs: 2.5, sm: 3 },
            bgcolor: "background.paper",
            backgroundImage: "none",
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 1, pb: 1, px: { xs: 0.5, sm: 1 } }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box
              component="img"
              src={subtractHexIcon}
              alt=""
              sx={{ width: { xs: 40, sm: 45 }, height: "auto", display: "block" }}
            />
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              color: theme.palette.mode === "light" ? "#1A2038" : "text.primary",
              mb: 1.5,
            }}
          >
            Trip Settings Reminder
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "light" ? "#4A4A4A" : "text.secondary",
              lineHeight: 1.6,
              maxWidth: 360,
              mx: "auto",
            }}
          >
            Make sure the start and end point for trips are set as per your requirements. You can configure these in the
            Settings tab.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "center",
            gap: 1.5,
            px: { xs: 1, sm: 2 },
            pb: 2,
            pt: 0,
            "& > button": { m: 0 },
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setTripSettingsOpen(false);
              navigate("/admin/driver-management/settings");
            }}
            sx={{
              borderRadius: 2,
              py: 1.25,
              textTransform: "none",
              borderColor: primary,
              color: "text.primary",
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "transparent",
              "&:hover": {
                borderColor: primary,
                bgcolor: theme.palette.mode === "dark" ? "grey.800" : "action.hover",
              },
            }}
          >
            Go To Settings
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleTripSettingsOkay}
            disableElevation
            sx={{
              borderRadius: 2,
              py: 1.25,
              textTransform: "none",
              bgcolor: primary,
              color: "#fff",
              "&:hover": { bgcolor: primary, opacity: 0.92 },
            }}
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteTab;
