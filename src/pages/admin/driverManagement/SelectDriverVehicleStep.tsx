import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { getListOfDrivers, getListOfVehicles } from "../../../redux/apis/distrubutor/listApis";
import {
  clearDriverVehicleAssignments,
  setDriverSplit,
  setManualSelectedDriverId,
  setManualSelectedVehicleId,
  upsertDriverVehicleAssignment,
  type AssignedVehicleSnapshot,
  type DriverVehicleAssignment,
} from "../../../redux/slices/routeOptimizationSlice";
import {
  computeDefaultOrderSplits,
  indexAssignmentsByDriverId,
  normalizeDriverId,
  readStoredSplit,
  sameDriverIdSet,
} from "../../../utils/routeOptimizationSplitUtils";
import { showErrorToast } from "../../../utils/toastUtils";

const PAGE_BG_LIGHT = "#F4F7F9";

type DriverOption = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  driverPicture?: string | null;
};

type VehicleOption = {
  id: string;
  label: string;
  description?: string;
  vinNumber?: string;
  loadCapacityLbs?: number;
  mileageHours?: string | number;
};

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
    nameFromParts || String(r?.name ?? r?.Name ?? r?.driverName ?? r?.Full_Name ?? `Driver ${i + 1}`);
  const pic = r?.driverPicture ?? r?.driver_picture ?? null;
  return {
    id: String(id),
    name,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phoneNumber: r?.phoneNumber ?? r?.phone_number ?? null,
    driverPicture: pic == null || pic === "" ? null : String(pic),
  };
}

/** Relative API paths like `/uploads/...` need host without `/api`. */
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

function driverInitials(d: DriverOption): string {
  const a = (d.firstName || "").trim().charAt(0);
  const b = (d.lastName || "").trim().charAt(0);
  if (a || b) return `${a}${b}`.toUpperCase();
  return (d.name || "?").trim().charAt(0).toUpperCase() || "?";
}

function vehicleDisplayName(v: VehicleOption): string {
  return String(v.description || v.label || "").trim() || "Vehicle";
}

function formatVehicleMeta(v: VehicleOption): string {
  const vin = v.vinNumber?.trim() || "—";
  const lbs = v.loadCapacityLbs != null && Number.isFinite(Number(v.loadCapacityLbs)) ? `${v.loadCapacityLbs} lbs` : "—";
  const mh = v.mileageHours != null && v.mileageHours !== "" ? String(v.mileageHours) : "—";
  return `${vin} · ${lbs} · ${mh}`;
}

function snapshotToVehicleOption(s: AssignedVehicleSnapshot): VehicleOption {
  return {
    id: String(s.id),
    label: s.label,
    description: s.description,
    vinNumber: s.vinNumber,
    loadCapacityLbs: s.loadCapacityLbs,
    mileageHours: s.mileageHours,
  };
}

/** Include selected truck in options when API list omits it (date filter, inactive, etc.). */
function mergeVehiclesWithSelected(
  list: VehicleOption[],
  selectedId: string | undefined,
  assignment: DriverVehicleAssignment | undefined
): VehicleOption[] {
  if (!selectedId) return list;
  const sid = String(selectedId);
  if (list.some((x) => String(x.id) === sid)) return list;
  const snap = assignment?.vehicleDetail;
  if (snap && String(snap.id) === sid) {
    return [...list, snapshotToVehicleOption(snap)];
  }
  if (assignment?.truckId != null && String(assignment.truckId) === sid) {
    return [
      ...list,
      {
        id: String(assignment.truckId),
        label: assignment.truckLabel || `Vehicle ${assignment.truckId}`,
        description: assignment.truckLabel,
        vinNumber: assignment.vehicleDetail?.vinNumber,
        loadCapacityLbs: assignment.vehicleDetail?.loadCapacityLbs,
        mileageHours: assignment.vehicleDetail?.mileageHours,
      },
    ];
  }
  return [
    ...list,
    {
      id: sid,
      label: `Selected (id ${sid})`,
      description: "Not in current list",
    },
  ];
}

function filterVehiclesAssignedToOtherDrivers(
  list: VehicleOption[],
  vehicleByDriverId: Record<string, string>,
  currentDriverId: string
): VehicleOption[] {
  const assignedToOthers = new Set(
    Object.entries(vehicleByDriverId)
      .filter(([driverId, vehicleId]) => driverId !== currentDriverId && String(vehicleId).length > 0)
      .map(([, vehicleId]) => String(vehicleId))
  );
  return list.filter((v) => !assignedToOthers.has(String(v.id)));
}

export type SelectDriverVehicleLocationState = {
  nextPath: string;
  returnPath: string;
  routeDate?: string;
};

const SelectDriverVehicleStep: React.FC = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const selectedOrders = useAppSelector((s) => s.routeOptimization.selectedOrders);
  const driverVehicleAssignmentsById = useAppSelector((s) => s.routeOptimization.driverVehicleAssignmentsById);
  const persistedManualSelectedDriverId = useAppSelector((s) => s.routeOptimization.manualSelectedDriverId);
  const persistedManualSelectedVehicleId = useAppSelector((s) => s.routeOptimization.manualSelectedVehicleId);

  const navState = location.state as SelectDriverVehicleLocationState | null;

  const nextPath = navState?.nextPath ?? "/admin/driver-management/route-optimization";
  const returnPath =
    navState?.returnPath ??
    (nextPath.includes("manual-route-optimize")
      ? "/admin/driver-management/create-route-manual"
      : "/admin/driver-management/create-route-automatic");
  const routeDate = navState?.routeDate?.trim() || String(selectedOrders[0]?.deliveryDay ?? "").trim();
  const isManualRoute = nextPath.includes("manual-route-optimize");

  const primary = theme.palette.primary.main;
  const pageBg = theme.palette.mode === "light" ? PAGE_BG_LIGHT : "background.default";
  const headerBg = primary;
  const rowBorder = theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const cardBg = theme.palette.mode === "light" ? "#FFFFFF" : theme.palette.background.paper;

  const [activeStep, setActiveStep] = useState(0);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [vehicleByDriverId, setVehicleByDriverId] = useState<Record<string, string>>({});
  /** Restore checkbox + vehicle picks once when returning from optimize (Redux still holds assignments). */
  const hydratedFromReduxRef = useRef(false);

  const orderedSelectedDrivers = useMemo(() => {
    const idx = new Map<string, number>();
    drivers.forEach((d, i) => idx.set(d.id, i));
    return Array.from(selectedDriverIds).sort((a, b) => (idx.get(a) ?? 0) - (idx.get(b) ?? 0));
  }, [drivers, selectedDriverIds]);

  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const res = await getListOfDrivers(routeDate ? { date: routeDate } : undefined);
      setDrivers(unwrapListArray(res).map(mapDriverRow));
    } catch (e: any) {
      showErrorToast(e?.message || "Failed to load drivers.");
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, [routeDate]);

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const res = await getListOfVehicles(routeDate ? { date: routeDate } : undefined);
      setVehicles(unwrapListArray(res).map(mapVehicleRow));
    } catch (e: any) {
      showErrorToast(e?.message || "Failed to load vehicles.");
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, [routeDate]);

  const persistManualSelection = useCallback(() => {
    if (!isManualRoute) return;
    const firstSelectedDriverId = orderedSelectedDrivers[0] ?? null;
    const firstSelectedVehicleId = firstSelectedDriverId ? vehicleByDriverId[firstSelectedDriverId] ?? null : null;
    dispatch(setManualSelectedDriverId(firstSelectedDriverId));
    dispatch(setManualSelectedVehicleId(firstSelectedVehicleId));
  }, [dispatch, isManualRoute, orderedSelectedDrivers, vehicleByDriverId]);

  const handleBackToReturn = useCallback(() => {
    persistManualSelection();
    navigate(returnPath, { state: routeDate ? { routeDate } : undefined });
  }, [navigate, persistManualSelection, returnPath, routeDate]);

  useEffect(() => {
    loadDrivers();
    loadVehicles();
  }, [loadDrivers, loadVehicles]);

  useEffect(() => {
    if (hydratedFromReduxRef.current) return;
    // Fresh wizard session: user already picking drivers/vehicles — don't overwrite with Redux.
    if (selectedDriverIds.size > 0 || Object.keys(vehicleByDriverId).length > 0) {
      hydratedFromReduxRef.current = true;
      return;
    }
    if (isManualRoute && persistedManualSelectedDriverId) {
      const manualDriverId = String(persistedManualSelectedDriverId);
      hydratedFromReduxRef.current = true;
      setSelectedDriverIds(new Set([manualDriverId]));
      if (persistedManualSelectedVehicleId) {
        setVehicleByDriverId({ [manualDriverId]: String(persistedManualSelectedVehicleId) });
        setActiveStep(1);
      }
      return;
    }
    const assignments = driverVehicleAssignmentsById;
    const driverIds = Object.keys(assignments);
    if (driverIds.length === 0) return;
    hydratedFromReduxRef.current = true;
    setSelectedDriverIds(new Set(driverIds));
    const nextVehicles: Record<string, string> = {};
    for (const driverId of driverIds) {
      const truckId = assignments[driverId]?.truckId;
      if (truckId != null && String(truckId).length > 0) {
        nextVehicles[driverId] = String(truckId);
      }
    }
    setVehicleByDriverId(nextVehicles);
    const allHaveVehicles = driverIds.every((id) => assignments[id]?.truckId != null && String(assignments[id].truckId).length > 0);
    if (allHaveVehicles) setActiveStep(1);
  }, [
    driverVehicleAssignmentsById,
    isManualRoute,
    persistedManualSelectedDriverId,
    persistedManualSelectedVehicleId,
    selectedDriverIds,
    vehicleByDriverId,
  ]);

  const hasOrders = selectedOrders.length > 0;

  const toggleDriver = (id: string) => {
    setSelectedDriverIds((prev) => {
      if (isManualRoute) {
        if (prev.has(id)) {
          setVehicleByDriverId((v) => {
            const copy = { ...v };
            delete copy[id];
            return copy;
          });
          return new Set();
        }
        return new Set([id]);
      }
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setVehicleByDriverId((v) => {
          const copy = { ...v };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllDrivers = () => {
    if (isManualRoute) return;
    if (drivers.length === 0) return;
    if (selectedDriverIds.size === drivers.length) {
      setSelectedDriverIds(new Set());
      setVehicleByDriverId({});
    } else {
      setSelectedDriverIds(new Set(drivers.map((d) => d.id)));
    }
  };

  const setVehicleForDriver = (driverId: string, vehicleId: string) => {
    setVehicleByDriverId((prev) => ({ ...prev, [driverId]: vehicleId }));
  };

  const handleNextFromDrivers = () => {
    if (!hasOrders) return;
    if (selectedDriverIds.size === 0) {
      showErrorToast(isManualRoute ? "Select one driver." : "Select at least one driver.");
      return;
    }
    persistManualSelection();
    setActiveStep(1);
  };

  const handleFinish = () => {
    if (!hasOrders) return;
    for (const driverId of orderedSelectedDrivers) {
      if (!vehicleByDriverId[driverId]) {
        showErrorToast("Choose a vehicle for each selected driver.");
        return;
      }
    }

    /** Manual route uses a single driver only — no multi-driver order split (Route Optimization only). */
    const snapById = !isManualRoute
      ? indexAssignmentsByDriverId(driverVehicleAssignmentsById)
      : {};
    const selectedIdsNorm = orderedSelectedDrivers.map(normalizeDriverId);

    dispatch(clearDriverVehicleAssignments());
    for (const driverId of orderedSelectedDrivers) {
      const d = drivers.find((x) => x.id === driverId);
      const vid = vehicleByDriverId[driverId];
      const v = vehicles.find((x) => String(x.id) === String(vid));
      if (!d || !v) {
        showErrorToast("Invalid driver or vehicle selection.");
        return;
      }
      dispatch(
        upsertDriverVehicleAssignment({
          driverId: d.id,
          driverName: d.name,
          truckId: v.id,
          truckLabel: v.label,
          vehicleDetail: assignedVehicleSnapshotFromOption(v),
        })
      );
    }

    if (!isManualRoute) {
      const driverSetUnchanged =
        selectedIdsNorm.length > 0 && sameDriverIdSet(Object.keys(snapById), selectedIdsNorm);

      let sumSplits = 0;
      const splitsToRestore: Record<string, number> = {};
      let allSplitsReadable = true;

      if (driverSetUnchanged) {
        for (const id of selectedIdsNorm) {
          const sp = readStoredSplit(snapById[id]?.split);
          if (sp == null) {
            allSplitsReadable = false;
            break;
          }
          splitsToRestore[id] = sp;
          sumSplits += sp;
        }
      }

      const canRestoreSplits =
        driverSetUnchanged &&
        allSplitsReadable &&
        sumSplits === selectedOrders.length;

      if (canRestoreSplits) {
        selectedIdsNorm.forEach((id) => {
          dispatch(setDriverSplit({ driverId: id, split: splitsToRestore[id] }));
        });
      } else {
        const splits = computeDefaultOrderSplits(selectedOrders.length, orderedSelectedDrivers.length);
        orderedSelectedDrivers.forEach((driverId, idx) => {
          const s = splits[idx];
          if (s != null && Number.isFinite(s)) {
            dispatch(setDriverSplit({ driverId: normalizeDriverId(driverId), split: s }));
          }
        });
      }
    }

    if (isManualRoute && orderedSelectedDrivers.length > 0) {
      const firstId = orderedSelectedDrivers[0];
      const firstVid = vehicleByDriverId[firstId];
      dispatch(setManualSelectedDriverId(firstId));
      dispatch(setManualSelectedVehicleId(firstVid || null));
    }

    navigate(nextPath);
  };

  const allDriversSelected = drivers.length > 0 && selectedDriverIds.size === drivers.length;
  const someDriversSelected = selectedDriverIds.size > 0 && !allDriversSelected;

  const steps = ["Drivers", "Vehicles"];

  if (!hasOrders) {
    return (
      <Box sx={{ p: 1.5, bgcolor: pageBg, minHeight: 200 }}>
        <Paper sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${rowBorder}` }}>
          <Typography sx={{ fontWeight: 500, fontSize: 12, mb: 0.5 }}>No orders in session</Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 400, mb: 1.5, lineHeight: 1.45 }}>
            Select orders on the create route screen first, then use Optimize again.
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate(returnPath, { state: routeDate ? { routeDate } : undefined })}
            sx={{ textTransform: "none", fontSize: 11, fontWeight: 500, py: 0.5, px: 1.5 }}
          >
            Back to create route
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        pb: 2,
        bgcolor: pageBg,
        borderRadius: 0,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1.5,
          border: `1px solid ${rowBorder}`,
          bgcolor: cardBg,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 1.25, sm: 1.75 },
            py: 1.25,
            borderBottom: `1px solid ${rowBorder}`,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "flex-start" },
            justifyContent: "space-between",
            gap: 1.25,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 500, fontSize: { xs: 13, sm: 14 }, color: "text.primary", lineHeight: 1.35 }}>
              Driver &amp; vehicle
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 400, mt: 0.25, lineHeight: 1.4 }}>
              {isManualRoute
                ? "Select one driver, then assign one vehicle. Scroll horizontally on small screens."
                : "Select drivers, then assign a vehicle each. Scroll horizontally on small screens."}
            </Typography>
          </Box>
          <Stepper
            activeStep={activeStep}
            sx={{
              minWidth: { md: 220 },
              width: { xs: "100%", md: "auto" },
              py: 0,
              "& .MuiStepLabel-label": { fontSize: 11, fontWeight: 500, mt: 0.25 },
              "& .MuiStepLabel-label.Mui-active": { fontWeight: 500 },
              "& .MuiStepLabel-label.Mui-completed": { fontWeight: 500 },
              "& .MuiStepIcon-root": { fontSize: isXs ? "1.1rem" : "1.15rem" },
              "& .MuiStepIcon-root.Mui-active": { color: headerBg },
              "& .MuiStepIcon-root.Mui-completed": { color: headerBg },
              "& .MuiStepIcon-root.Mui-active .MuiStepIcon-text": { fill: "#fff" },
              "& .MuiStepIcon-root.Mui-completed .MuiStepIcon-text": { fill: "#fff" },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {activeStep === 0 && (
          <>
            <Box
              sx={{
                px: 1.25,
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.75,
              }}
            >
              <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 400 }}>
                {selectedDriverIds.size} selected
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBackToReturn}
                  sx={{ textTransform: "none", fontSize: 11, fontWeight: 500, py: 0.35, minHeight: 28 }}
                >
                  Back to Orders
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleNextFromDrivers}
                  disabled={selectedDriverIds.size === 0 || loadingDrivers}
                  sx={{ fontSize: 11, fontWeight: 500, py: 0.35, minHeight: 28, bgcolor: headerBg, color: "#fff", textTransform: "none" }}
                >
                  Next
                </Button>
              </Box>
            </Box>
            <TableContainer
              sx={{
                borderTop: `1px solid ${rowBorder}`,
                maxHeight: { xs: "min(52vh, 420px)", sm: "calc(100vh - 320px)" },
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: isXs ? 320 : 400,
                  "& .MuiTableCell-root": {
                    py: 0.5,
                    px: 1,
                    fontSize: 11,
                    fontWeight: 500,
                    borderColor: rowBorder,
                    lineHeight: 1.35,
                  },
                  "& .MuiTableCell-head": {
                    py: 0.65,
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      padding="checkbox"
                      sx={{ bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}` }}
                    >
                      <Checkbox
                        size="small"
                        checked={allDriversSelected}
                        indeterminate={someDriversSelected}
                        onChange={toggleAllDrivers}
                        disabled={isManualRoute}
                        sx={{ p: 0.35, color: "rgba(255,255,255,0.75)", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#fff" } }}
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}` }}>Photo</TableCell>
                    <TableCell sx={{ bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}` }}>Full name</TableCell>
                    <TableCell sx={{ bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}` }}>Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingDrivers ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 2.5 }}>
                        <CircularProgress size={20} />
                      </TableCell>
                    </TableRow>
                  ) : drivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 2, color: "text.secondary", fontWeight: 400 }}>
                        No drivers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    drivers.map((d) => {
                      const pic = resolveAssetUrl(d.driverPicture ?? undefined);
                      return (
                        <TableRow key={d.id} hover selected={selectedDriverIds.has(d.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={selectedDriverIds.has(d.id)}
                              onChange={() => toggleDriver(d.id)}
                              sx={{ p: 0.35, color: "action.active", "&.Mui-checked": { color: headerBg } }}
                            />
                          </TableCell>
                          <TableCell sx={{ width: 44, px: 0.5 }}>
                            <Avatar
                              src={pic || undefined}
                              alt=""
                              sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 500 }}
                            >
                              {driverInitials(d)}
                            </Avatar>
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>{d.name || "—"}</TableCell>
                          <TableCell sx={{ maxWidth: 140 }}>{d.phoneNumber || "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {activeStep === 1 && (
          <>
            <Box
              sx={{
                px: 1.25,
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.75,
              }}
            >
              <Button
                size="small"
                variant="text"
                onClick={() => setActiveStep(0)}
                sx={{ textTransform: "none", fontSize: 11, fontWeight: 500, minHeight: 28, py: 0.35 }}
              >
                ← Drivers
              </Button>
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBackToReturn}
                  sx={{ textTransform: "none", fontSize: 11, fontWeight: 500, py: 0.35, minHeight: 28 }}
                >
                  Back to Orders
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleFinish}
                  disabled={loadingVehicles || orderedSelectedDrivers.length === 0}
                  sx={{ fontSize: 11, fontWeight: 500, py: 0.35, minHeight: 28, bgcolor: headerBg, color: "#fff", textTransform: "none" }}
                >
                  Optimize
                </Button>
              </Box>
            </Box>
            <TableContainer
              sx={{
                borderTop: `1px solid ${rowBorder}`,
                maxHeight: { xs: "min(52vh, 480px)", sm: "calc(100vh - 320px)" },
                overflowX: "auto",
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: { xs: 280, sm: 480 },
                  "& .MuiTableCell-root": {
                    py: 0.65,
                    px: 1,
                    fontSize: 11,
                    fontWeight: 500,
                    borderColor: rowBorder,
                    verticalAlign: "top",
                  },
                  "& .MuiTableCell-head": {
                    py: 0.65,
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}` }}>Driver</TableCell>
                    <TableCell sx={{ bgcolor: headerBg, color: "#fff", borderBottom: `1px solid ${headerBg}`, minWidth: { xs: 200, sm: 260 } }}>
                      Vehicle
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingVehicles ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 2.5 }}>
                        <CircularProgress size={20} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderedSelectedDrivers.map((driverId) => {
                      const d = drivers.find((x) => x.id === driverId);
                      if (!d) return null;
                      const pic = resolveAssetUrl(d.driverPicture ?? undefined);
                      const vid = vehicleByDriverId[driverId];
                      const assignment = driverVehicleAssignmentsById[String(driverId)];
                      const vehiclesAvailableForDriver = filterVehiclesAssignedToOtherDrivers(
                        vehicles,
                        vehicleByDriverId,
                        driverId
                      );
                      const vehiclesForSelect = mergeVehiclesWithSelected(
                        vehiclesAvailableForDriver,
                        vid,
                        assignment
                      );
                      return (
                        <TableRow key={driverId} hover>
                          <TableCell sx={{ maxWidth: { xs: 140, sm: 220 } }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                              <Avatar src={pic || undefined} sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                                {driverInitials(d)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.35 }}>{d.name || "—"}</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 400, color: "text.secondary", lineHeight: 1.35 }}>
                                  Phone: {d.phoneNumber || "—"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              minWidth: { xs: 200, sm: 260 },
                              maxWidth: 420,
                              position: "relative",
                              verticalAlign: "top",
                            }}
                          >
                            <FormControl
                              fullWidth
                              size="small"
                              variant="outlined"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  fontSize: 11,
                                  fontWeight: 500,
                                  minHeight: 36,
                                  "& .MuiSelect-select": {
                                    py: 0.75,
                                    pr: 3,
                                    display: "flex",
                                    alignItems: "center",
                                  },
                                },
                                "& .MuiInputLabel-root": { fontSize: 11, fontWeight: 500 },
                              }}
                            >
                              <InputLabel id={`veh-${driverId}`} shrink>
                                Vehicle
                              </InputLabel>
                              <Select
                                labelId={`veh-${driverId}`}
                                label="Vehicle"
                                notched
                                value={vid ?? ""}
                                onChange={(e) => setVehicleForDriver(driverId, String(e.target.value))}
                                displayEmpty
                                renderValue={(selected) => {
                                  if (selected === "" || selected == null) {
                                    return (
                                      <Box component="span" sx={{ fontSize: 11, fontWeight: 400, color: "text.disabled" }}>
                                        Select vehicle
                                      </Box>
                                    );
                                  }
                                  const v = vehiclesForSelect.find((x) => String(x.id) === String(selected));
                                  if (!v) {
                                    return (
                                      <Box component="span" sx={{ fontSize: 11, fontWeight: 500, color: "text.secondary" }}>
                                        Vehicle #{String(selected)}
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        width: "100%",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {vehicleDisplayName(v)}
                                    </Box>
                                  );
                                }}
                                MenuProps={{
                                  disableAutoFocus: true,
                                  MenuListProps: {
                                    dense: true,
                                    sx: { py: 0.5, "& .MuiMenuItem-root": { minHeight: 0 } },
                                  },
                                  PaperProps: {
                                    elevation: 4,
                                    sx: {
                                      maxHeight: "min(42vh, 280px)",
                                      maxWidth: { xs: "min(calc(100vw - 24px), 360px)", sm: 360 },
                                      mt: 0.5,
                                      borderRadius: 1,
                                    },
                                  },
                                  anchorOrigin: { vertical: "bottom", horizontal: "left" },
                                  transformOrigin: { vertical: "top", horizontal: "left" },
                                }}
                              >
                                <MenuItem value="">
                                  <em style={{ fontSize: 11, fontWeight: 400 }}>Select vehicle</em>
                                </MenuItem>
                                {vehiclesForSelect.map((v) => (
                                  <MenuItem
                                    key={v.id}
                                    value={v.id}
                                    sx={{
                                      alignItems: "flex-start",
                                      py: 0.45,
                                      px: 1,
                                      whiteSpace: "normal",
                                    }}
                                  >
                                    <Box sx={{ width: "100%", minWidth: 0 }}>
                                      <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3 }}>
                                        {vehicleDisplayName(v)}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          fontSize: 10,
                                          fontWeight: 400,
                                          color: "text.secondary",
                                          lineHeight: 1.3,
                                          mt: 0.15,
                                        }}
                                      >
                                        {formatVehicleMeta(v)}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {nextPath.includes("manual-route-optimize") && orderedSelectedDrivers.length > 1 && (
              <Box
                sx={{
                  px: 1.25,
                  py: 1,
                  bgcolor: theme.palette.mode === "light" ? "rgba(255, 193, 7, 0.1)" : "rgba(255, 193, 7, 0.08)",
                  borderTop: `1px solid ${rowBorder}`,
                }}
              >
                <Typography sx={{ fontSize: 10, fontWeight: 400, color: "text.secondary", lineHeight: 1.45 }}>
                  Manual route uses one driver/vehicle: the first row applies on the next screen.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SelectDriverVehicleStep;
