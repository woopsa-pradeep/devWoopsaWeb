import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { Dayjs } from "dayjs";
import driverRouteIcon from "../../../assets/driverRoute.svg";

export interface RouteCalendarColumnProps {
  selectedDate: Dayjs;
  onSelectedDateChange: (d: Dayjs) => void;
}

/**
 * Shared calendar column (expand/collapse) for Route tab and View routes page.
 */
const RouteCalendarColumn: React.FC<RouteCalendarColumnProps> = ({ selectedDate, onSelectedDateChange }) => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const primary = theme.palette.primary.main;
  const stripBg = theme.palette.mode === "light" ? "#ffffff" : theme.palette.grey[900];
  const daySquareRadius = "10px";

  const shortSelectedLabel = useMemo(() => selectedDate.format("MMM D, YYYY"), [selectedDate]);

  const toggleCalendar = () => setCalendarCollapsed((c) => !c);

  const calendarPaper = (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: "background.paper",
        width: { xs: "100%", md: 320 },
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1.25, sm: 1.5 },
          py: { xs: 1.25, sm: 1.25 },
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: { xs: "0.95rem", sm: "1rem" },
            color: theme.palette.mode === "light" ? "#1A2038" : "text.primary",
            letterSpacing: "0.01em",
          }}
        >
          Calendar
        </Typography>
        <Tooltip title="Collapse calendar">
          <IconButton
            onClick={toggleCalendar}
            aria-label="Collapse calendar"
            size="small"
            sx={{
              p: 0.5,
              color: theme.palette.mode === "light" ? "#2c3e50" : "text.primary",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 22, fontWeight: 300 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider sx={{ borderColor: "divider" }} />
      <Box sx={{ px: { xs: 1, sm: 1.25 }, pb: { xs: 1.25, sm: 1.5 }, pt: { xs: 1, sm: 1.25 } }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={selectedDate}
            onChange={(v) => v && onSelectedDateChange(v)}
            sx={{
              width: "100%",
              maxWidth: 320,
              mx: "auto",
              "& .MuiDayCalendar-weekDayLabel": {
                color: "text.secondary",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
              },
              "& .MuiPickersDay-root": {
                fontSize: 14,
                borderRadius: daySquareRadius,
              },
              "& .MuiPickersDay-dayOutsideMonth": {
                color: "text.disabled",
              },
              "& .MuiPickersDay-root.Mui-selected": {
                borderRadius: daySquareRadius,
                backgroundColor: primary,
                color: "#fff",
                "&:hover": {
                  backgroundColor: primary,
                  opacity: 0.92,
                },
                "&:focus": {
                  backgroundColor: primary,
                },
              },
              "& .MuiPickersCalendarHeader-root": {
                pl: 0,
                pr: 0,
                mt: 0,
                mb: 0.5,
              },
              "& .MuiPickersCalendarHeader-label": {
                fontWeight: 700,
                fontSize: "0.95rem",
                color: theme.palette.mode === "light" ? "#1A2038" : "text.primary",
              },
              "& .MuiPickersArrowSwitcher-root": {
                gap: 0.25,
              },
            }}
          />
        </LocalizationProvider>
      </Box>
    </Paper>
  );

  const calendarCollapsedStrip = (
    <Tooltip title="Expand calendar" placement="right">
      <Box
        component="button"
        type="button"
        onClick={toggleCalendar}
        aria-label="Expand calendar"
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignItems: "center",
          width: 44,
          minHeight: { md: 360 },
          alignSelf: "stretch",
          flexShrink: 0,
          borderRadius: "8px",
          border: "0px solid",
          borderColor: "divider",
          borderRightWidth: 0,
          borderRightStyle: "solid",
          borderRightColor: "divider",
          bgcolor: stripBg,
          cursor: "pointer",
          p: 0,
          m: 0,
          font: "inherit",
          color: "inherit",
          textAlign: "center",
          transition: "background-color 0.2s ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            pt: 1.75,
            pb: 1,
          }}
        >
          <ChevronRightIcon
            sx={{
              fontSize: 22,
              color: theme.palette.mode === "light" ? "#2c3e50" : "text.primary",
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: calendarCollapsed ? "stretch" : "flex-start" },
        gap: { xs: 1, md: 0 },
        flexShrink: 0,
        alignSelf: { md: "stretch" },
        minHeight: { md: calendarCollapsed ? 360 : "auto" },
      }}
    >
      {!calendarCollapsed && calendarPaper}

      {calendarCollapsed && !isMdUp && (
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: 2,
          }}
        >
          <Box component="img" src={driverRouteIcon} alt="" sx={{ width: 24, height: 24, display: "block" }} />
          <Typography variant="body2" color="text.secondary">
            {shortSelectedLabel}
          </Typography>
          <Button size="small" onClick={toggleCalendar} sx={{ textTransform: "none", ml: "auto" }}>
            Show calendar
          </Button>
        </Paper>
      )}

      {calendarCollapsed && isMdUp && calendarCollapsedStrip}
    </Box>
  );
};

export default React.memo(RouteCalendarColumn);
