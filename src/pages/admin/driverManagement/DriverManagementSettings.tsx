import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showErrorToast, showSuccessToast } from "../../../utils/toastUtils";
import { getSettingDeliveryAddress, updateDistributorSetting } from "../../../redux/apis/distrubutor/driverManagementApis";

const GOOGLE_GEOCODE_KEY = "AIzaSyB0EMh-6Rx6OhZYEh0gR0yAvk2J8_NnCyw";

const stateSchema = z
  .string()
  .min(2, "State is required")
  .max(2, "State must be 2 letters")
  .regex(/^[A-Z]{2}$/, "State must be 2 uppercase letters (e.g., GJ)");

const zipSchema = z
  .string()
  .min(3, "Zip is required")
  .max(10, "Zip is too long");

const formSchema = z.object({
  startAddress: z.string().min(1, "Address is required"),
  startCity: z.string().min(1, "City is required"),
  startState: stateSchema,
  startZip: zipSchema,
  startCountry: z.string().optional(),
  startLat: z.number().nullable(),
  startLong: z.number().nullable(),

  endAddress: z.string().min(1, "Address is required"),
  endCity: z.string().min(1, "City is required"),
  endState: stateSchema,
  endZip: zipSchema,
  endCountry: z.string().optional(),
  endLat: z.number().nullable(),
  endLong: z.number().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type GeocodeResult = {
  status: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  error_message?: string;
};

async function geocodeAddress(address: string, city: string, state: string, zip: string) {
  const q = `${address}, ${city}, ${state}, ${zip}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_GEOCODE_KEY}`;
  const res = await fetch(url);
  const data = (await res.json()) as GeocodeResult;

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(data.error_message || "Unable to get latitude/longitude for this address.");
  }
  const loc = data.results[0]?.geometry?.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    throw new Error("Geocode response missing location.");
  }
  return { lat: loc.lat, lng: loc.lng };
}

function pickComponent(
  components: NonNullable<GeocodeResult["results"]>[number]["address_components"],
  type: string
) {
  return components?.find((c) => c.types?.includes(type));
}

async function reverseGeocodeLatLng(lat: number, lng: number) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
    `${lat},${lng}`
  )}&key=${GOOGLE_GEOCODE_KEY}`;
  const res = await fetch(url);
  const data = (await res.json()) as GeocodeResult;

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(data.error_message || "Unable to get address for this lat/long.");
  }

  const results = data.results ?? [];
  const nonPlusCode = results.filter((r) => !(r as any)?.types?.includes("plus_code"));
  const bestForAddress = nonPlusCode[0] ?? results[0];

  // Pick components from any result (some lat/lng resolve zip in a different result)
  const allComponents = results.flatMap((r) => r.address_components ?? []);
  const city = pickComponent(allComponents, "locality")?.long_name ?? "";
  const state = pickComponent(allComponents, "administrative_area_level_1")?.short_name ?? "";
  const zip = pickComponent(allComponents, "postal_code")?.long_name ?? "";
  const country = pickComponent(allComponents, "country")?.short_name ?? "";
  const address = bestForAddress?.formatted_address ?? results[0]?.formatted_address ?? "";

  return {
    address,
    city,
    state,
    zip,
    country,
  };
}

const DriverManagementSettings: React.FC = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [startGeoLoading, setStartGeoLoading] = useState(false);
  const [endGeoLoading, setEndGeoLoading] = useState(false);
  const [lastLoadedValues, setLastLoadedValues] = useState<FormValues | null>(null);

  const [startMode, setStartMode] = useState<"address" | "latlng">("address");
  const [endMode, setEndMode] = useState<"address" | "latlng">("address");

  const lastStartLatLngReqRef = useRef<string>("");
  const lastEndLatLngReqRef = useRef<string>("");
  const lastStartAddrReqRef = useRef<string>("");
  const lastEndAddrReqRef = useRef<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isValid, dirtyFields },
    reset,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      startAddress: "",
      startCity: "",
      startState: "",
      startZip: "",
      startCountry: "",
      startLat: null,
      startLong: null,
      endAddress: "",
      endCity: "",
      endState: "",
      endZip: "",
      endCountry: "",
      endLat: null,
      endLong: null,
    },
  });

  const startLat = watch("startLat");
  const startLong = watch("startLong");
  const endLat = watch("endLat");
  const endLong = watch("endLong");
  const startAddress = watch("startAddress");
  const startCity = watch("startCity");
  const startState = watch("startState");
  const startZip = watch("startZip");
  const endAddress = watch("endAddress");
  const endCity = watch("endCity");
  const endState = watch("endState");
  const endZip = watch("endZip");

  const startLocationDirty = useMemo(() => {
    return !!(
      dirtyFields.startAddress ||
      dirtyFields.startCity ||
      dirtyFields.startState ||
      dirtyFields.startZip
    );
  }, [dirtyFields.startAddress, dirtyFields.startCity, dirtyFields.startState, dirtyFields.startZip]);

  const endLocationDirty = useMemo(() => {
    return !!(
      dirtyFields.endAddress ||
      dirtyFields.endCity ||
      dirtyFields.endState ||
      dirtyFields.endZip
    );
  }, [dirtyFields.endAddress, dirtyFields.endCity, dirtyFields.endState, dirtyFields.endZip]);

  const startLatLngDirty = useMemo(() => {
    return !!(dirtyFields.startLat || dirtyFields.startLong);
  }, [dirtyFields.startLat, dirtyFields.startLong]);

  const endLatLngDirty = useMemo(() => {
    return !!(dirtyFields.endLat || dirtyFields.endLong);
  }, [dirtyFields.endLat, dirtyFields.endLong]);

  const canSave = useMemo(() => {
    return (
      isValid &&
      typeof startLat === "number" &&
      typeof startLong === "number" &&
      typeof endLat === "number" &&
      typeof endLong === "number"
    );
  }, [endLat, endLong, isValid, startLat, startLong]);

  const pageBg = theme.palette.mode === "light" ? "#F4F7F9" : "background.default";
  const cardBg = theme.palette.mode === "light" ? "#FFFFFF" : theme.palette.background.paper;
  const borderColor = theme.palette.mode === "light" ? "#E4E9EF" : "divider";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await getSettingDeliveryAddress();
        const data = res?.data?.data ?? res?.data ?? {};

        const startAddr = data?.deliveryStartAddress ?? {};
        const endAddr = data?.deliveryEndAddress ?? {};
        const startLatNum =
          typeof data?.deliveryStartLat === "number"
            ? data.deliveryStartLat
            : typeof data?.deliveryStartLat === "string"
              ? Number.parseFloat(data.deliveryStartLat)
              : null;
        const startLongNum =
          typeof data?.deliveryStartLong === "number"
            ? data.deliveryStartLong
            : typeof data?.deliveryStartLong === "string"
              ? Number.parseFloat(data.deliveryStartLong)
              : null;
        const endLatNum =
          typeof data?.deliveryEndLat === "number"
            ? data.deliveryEndLat
            : typeof data?.deliveryEndLat === "string"
              ? Number.parseFloat(data.deliveryEndLat)
              : null;
        const endLongNum =
          typeof data?.deliveryEndLong === "number"
            ? data.deliveryEndLong
            : typeof data?.deliveryEndLong === "string"
              ? Number.parseFloat(data.deliveryEndLong)
              : null;

        const nextValues: FormValues = {
          startAddress: startAddr?.address ?? "",
          startCity: startAddr?.city ?? "",
          startState: (startAddr?.state ?? "").toString().toUpperCase(),
          startZip: startAddr?.zip ?? "",
          startCountry: startAddr?.country ?? "",
          startLat: Number.isFinite(startLatNum as number) ? (startLatNum as number) : null,
          startLong: Number.isFinite(startLongNum as number) ? (startLongNum as number) : null,

          endAddress: endAddr?.address ?? "",
          endCity: endAddr?.city ?? "",
          endState: (endAddr?.state ?? "").toString().toUpperCase(),
          endZip: endAddr?.zip ?? "",
          endCountry: endAddr?.country ?? "",
          endLat: Number.isFinite(endLatNum as number) ? (endLatNum as number) : null,
          endLong: Number.isFinite(endLongNum as number) ? (endLongNum as number) : null,
        };

        setLastLoadedValues(nextValues);
        reset(nextValues);
        setIsEditing(false);

        const startHasLatLng = typeof nextValues.startLat === "number" && typeof nextValues.startLong === "number";
        const startHasAddr = !!nextValues.startAddress || !!nextValues.startCity || !!nextValues.startState || !!nextValues.startZip;
        setStartMode(startHasLatLng && !startHasAddr ? "latlng" : "address");

        const endHasLatLng = typeof nextValues.endLat === "number" && typeof nextValues.endLong === "number";
        const endHasAddr = !!nextValues.endAddress || !!nextValues.endCity || !!nextValues.endState || !!nextValues.endZip;
        setEndMode(endHasLatLng && !endHasAddr ? "latlng" : "address");
      } catch {
        // Non-blocking; page still usable with manual entry
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reset]);

  const onGetStartLatLong = async () => {
    const ok = await trigger(["startAddress", "startCity", "startState", "startZip"]);
    if (!ok) return;
    setStartGeoLoading(true);
    try {
      const { startAddress, startCity, startState, startZip } = getValues();
      const loc = await geocodeAddress(startAddress, startCity, startState, startZip);
      setValue("startLat", loc.lat, { shouldValidate: true });
      setValue("startLong", loc.lng, { shouldValidate: true });
      showSuccessToast("Starting point latitude/longitude updated");
    } catch (err: any) {
      showErrorToast(err?.message || "Failed to get latitude/longitude.");
    } finally {
      setStartGeoLoading(false);
    }
  };

  const onGetEndLatLong = async () => {
    const ok = await trigger(["endAddress", "endCity", "endState", "endZip"]);
    if (!ok) return;
    setEndGeoLoading(true);
    try {
      const { endAddress, endCity, endState, endZip } = getValues();
      const loc = await geocodeAddress(endAddress, endCity, endState, endZip);
      setValue("endLat", loc.lat, { shouldValidate: true });
      setValue("endLong", loc.lng, { shouldValidate: true });
      showSuccessToast("Ending point latitude/longitude updated");
    } catch (err: any) {
      showErrorToast(err?.message || "Failed to get latitude/longitude.");
    } finally {
      setEndGeoLoading(false);
    }
  };

  // Auto geocode: once all 4 fields are filled, fetch lat/long (only if missing)
  useEffect(() => {
    if (loading) return;
    if (!isEditing) return;
    if (startMode !== "address") return;
    if (typeof startLat === "number" && typeof startLong === "number") return;
    if (!startLocationDirty) return; // don't geocode just by entering edit mode
    const ready = !!startAddress?.trim() && !!startCity?.trim() && /^[A-Z]{2}$/.test(startState || "") && !!startZip?.trim();
    if (!ready) return;

    const t = window.setTimeout(async () => {
      if (startGeoLoading) return;
      const reqKey = `${startAddress}|${startCity}|${startState}|${startZip}`.toLowerCase();
      if (lastStartAddrReqRef.current === reqKey) return;
      lastStartAddrReqRef.current = reqKey;
      setStartGeoLoading(true);
      try {
        const loc = await geocodeAddress(startAddress, startCity, startState, startZip);
        setValue("startLat", loc.lat, { shouldValidate: true, shouldDirty: false });
        setValue("startLong", loc.lng, { shouldValidate: true, shouldDirty: false });
      } catch {
        // silent: user can still use manual button if needed
      } finally {
        setStartGeoLoading(false);
      }
    }, 650);
    return () => window.clearTimeout(t);
  }, [
    loading,
    isEditing,
    startMode,
    startLocationDirty,
    startAddress,
    startCity,
    startState,
    startZip,
    setValue,
    startLat,
    startLong,
    startGeoLoading,
  ]);

  useEffect(() => {
    if (loading) return;
    if (!isEditing) return;
    if (endMode !== "address") return;
    if (typeof endLat === "number" && typeof endLong === "number") return;
    if (!endLocationDirty) return; // don't geocode just by entering edit mode
    const ready = !!endAddress?.trim() && !!endCity?.trim() && /^[A-Z]{2}$/.test(endState || "") && !!endZip?.trim();
    if (!ready) return;

    const t = window.setTimeout(async () => {
      if (endGeoLoading) return;
      const reqKey = `${endAddress}|${endCity}|${endState}|${endZip}`.toLowerCase();
      if (lastEndAddrReqRef.current === reqKey) return;
      lastEndAddrReqRef.current = reqKey;
      setEndGeoLoading(true);
      try {
        const loc = await geocodeAddress(endAddress, endCity, endState, endZip);
        setValue("endLat", loc.lat, { shouldValidate: true, shouldDirty: false });
        setValue("endLong", loc.lng, { shouldValidate: true, shouldDirty: false });
      } catch {
        // silent: user can still use manual button if needed
      } finally {
        setEndGeoLoading(false);
      }
    }, 650);
    return () => window.clearTimeout(t);
  }, [
    loading,
    isEditing,
    endMode,
    endLocationDirty,
    endAddress,
    endCity,
    endState,
    endZip,
    setValue,
    endLat,
    endLong,
    endGeoLoading,
  ]);

  // Auto reverse geocode: when user edits lat/long, fetch address fields
  useEffect(() => {
    if (loading) return;
    if (!isEditing) return;
    if (startMode !== "latlng") return;
    if (!startLatLngDirty) return;
    if (!(typeof startLat === "number" && Number.isFinite(startLat))) return;
    if (!(typeof startLong === "number" && Number.isFinite(startLong))) return;

    const t = window.setTimeout(async () => {
      if (startGeoLoading) return;
      const reqKey = `${startLat.toFixed(6)},${startLong.toFixed(6)}`;
      if (lastStartLatLngReqRef.current === reqKey) return;
      lastStartLatLngReqRef.current = reqKey;
      setStartGeoLoading(true);
      try {
        const r = await reverseGeocodeLatLng(startLat, startLong);
        setValue("startAddress", r.address, { shouldValidate: true, shouldDirty: false });
        setValue("startCity", r.city, { shouldValidate: true, shouldDirty: false });
        setValue("startState", (r.state || "").toUpperCase().slice(0, 2), { shouldValidate: true, shouldDirty: false });
        setValue("startZip", r.zip, { shouldValidate: true, shouldDirty: false });
        setValue("startCountry", r.country, { shouldValidate: true, shouldDirty: false });
      } catch {
        // silent; user can still edit manually
      } finally {
        setStartGeoLoading(false);
      }
    }, 650);
    return () => window.clearTimeout(t);
  }, [loading, isEditing, startMode, startLatLngDirty, startLat, startLong, setValue, startGeoLoading]);

  useEffect(() => {
    if (loading) return;
    if (!isEditing) return;
    if (endMode !== "latlng") return;
    if (!endLatLngDirty) return;
    if (!(typeof endLat === "number" && Number.isFinite(endLat))) return;
    if (!(typeof endLong === "number" && Number.isFinite(endLong))) return;

    const t = window.setTimeout(async () => {
      if (endGeoLoading) return;
      const reqKey = `${endLat.toFixed(6)},${endLong.toFixed(6)}`;
      if (lastEndLatLngReqRef.current === reqKey) return;
      lastEndLatLngReqRef.current = reqKey;
      setEndGeoLoading(true);
      try {
        const r = await reverseGeocodeLatLng(endLat, endLong);
        setValue("endAddress", r.address, { shouldValidate: true, shouldDirty: false });
        setValue("endCity", r.city, { shouldValidate: true, shouldDirty: false });
        setValue("endState", (r.state || "").toUpperCase().slice(0, 2), { shouldValidate: true, shouldDirty: false });
        setValue("endZip", r.zip, { shouldValidate: true, shouldDirty: false });
        setValue("endCountry", r.country, { shouldValidate: true, shouldDirty: false });
      } catch {
        // silent; user can still edit manually
      } finally {
        setEndGeoLoading(false);
      }
    }, 650);
    return () => window.clearTimeout(t);
  }, [loading, isEditing, endMode, endLatLngDirty, endLat, endLong, setValue, endGeoLoading]);

  const onSubmit = async (values: FormValues) => {
    if (!isEditing) return;
    try {
      const payload = {
        deliveryStartAddress: {
          address: values.startAddress,
          city: values.startCity,
          state: values.startState,
          zip: values.startZip,
          country: values.startCountry ?? "",
        },
        deliveryEndAddress: {
          address: values.endAddress,
          city: values.endCity,
          state: values.endState,
          zip: values.endZip,
          country: values.endCountry ?? "",
        },
        deliveryStartLat: typeof values.startLat === "number" ? values.startLat : null,
        deliveryStartLong: typeof values.startLong === "number" ? values.startLong : null,
        deliveryEndLat: typeof values.endLat === "number" ? values.endLat : null,
        deliveryEndLong: typeof values.endLong === "number" ? values.endLong : null,
      };

      await updateDistributorSetting(payload);
      showSuccessToast("Settings saved");
      setLastLoadedValues(values);
      setIsEditing(false);
    } catch (err: any) {
      showErrorToast(err?.message || "Failed to save settings.");
    }
  };

  return (
    <Box sx={{ width: "100%", bgcolor: pageBg, pb: 3 }}>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.05rem", sm: "1.2rem" },
          color: "text.primary",
          mb: 0.5,
        }}
      >
        Trip Start &amp; End Points
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Set default starting and ending points for all routes created from this point forward. Changes do not affect previously created routes.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor,
          bgcolor: cardBg,
          overflow: "hidden",
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: { xs: 1.5, sm: 2 } }}>
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "text.secondary" }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading saved settings…</Typography>
            </Box>
          )}

          {/* Starting Point */}
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "text.secondary", mb: 1 }}>
            Starting Point
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <ToggleButtonGroup
              exclusive
              value={startMode}
              size="small"
              onChange={(_, v) => {
                if (!v) return;
                setStartMode(v);
                lastStartAddrReqRef.current = "";
                lastStartLatLngReqRef.current = "";
              }}
              disabled={!isEditing}
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontSize: 12,
                  px: 1.5,
                  borderRadius: "8px !important",
                },
              }}
            >
              <ToggleButton value="address">Address</ToggleButton>
              <ToggleButton value="latlng">Lat/Long</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Address"
              {...register("startAddress")}
              error={!!errors.startAddress}
              helperText={errors.startAddress?.message}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || startMode !== "address"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnOutlinedIcon sx={{ color: "text.disabled", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                register("startAddress").onChange(e);
                if (startMode === "address") {
                  setValue("startLat", null, { shouldValidate: true, shouldDirty: false });
                  setValue("startLong", null, { shouldValidate: true, shouldDirty: false });
                  lastStartAddrReqRef.current = "";
                }
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="City"
              {...register("startCity")}
              error={!!errors.startCity}
              helperText={errors.startCity?.message}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || startMode !== "address"}
              onChange={(e) => {
                register("startCity").onChange(e);
                if (startMode === "address") {
                  setValue("startLat", null, { shouldValidate: true, shouldDirty: false });
                  setValue("startLong", null, { shouldValidate: true, shouldDirty: false });
                  lastStartAddrReqRef.current = "";
                }
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="State"
              {...register("startState", {
                onChange: (e) => {
                  const v = (e.target.value || "").toString().toUpperCase().slice(0, 2);
                  setValue("startState", v, { shouldValidate: true });
                  if (startMode === "address") {
                    setValue("startLat", null, { shouldValidate: true, shouldDirty: false });
                    setValue("startLong", null, { shouldValidate: true, shouldDirty: false });
                    lastStartAddrReqRef.current = "";
                  }
                },
              })}
              error={!!errors.startState}
              helperText={errors.startState?.message}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: 2 }}
              disabled={!isEditing || startMode !== "address"}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="Zip"
              {...register("startZip")}
              error={!!errors.startZip}
              helperText={errors.startZip?.message}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || startMode !== "address"}
              onChange={(e) => {
                register("startZip").onChange(e);
                if (startMode === "address") {
                  setValue("startLat", null, { shouldValidate: true, shouldDirty: false });
                  setValue("startLong", null, { shouldValidate: true, shouldDirty: false });
                  lastStartAddrReqRef.current = "";
                }
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="Latitude"
              value={typeof startLat === "number" ? String(startLat) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setValue("startLat", v === "" ? null : Number.parseFloat(v), { shouldValidate: true, shouldDirty: true });
              }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || startMode !== "latlng"}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="Longitude"
              value={typeof startLong === "number" ? String(startLong) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setValue("startLong", v === "" ? null : Number.parseFloat(v), { shouldValidate: true, shouldDirty: true });
              }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || startMode !== "latlng"}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            {startMode === "address" && !(typeof startLat === "number" && typeof startLong === "number") && (
              <Button
                type="button"
                variant="outlined"
                onClick={onGetStartLatLong}
                disabled={!isEditing || startGeoLoading}
                sx={{ textTransform: "none", borderRadius: "8px", borderColor: primary, "&:hover": { borderColor: primary, bgcolor: "action.hover" } }}
              >
                {startGeoLoading ? "Getting Lat/Long..." : "Get Lat/Long"}
              </Button>
            )}
            {startMode === "latlng" && (typeof startLat === "number" && typeof startLong === "number") && (
              <Button
                type="button"
                variant="outlined"
                onClick={async () => {
                  if (!isEditing) return;
                  if (!(typeof startLat === "number" && typeof startLong === "number")) return;
                  setStartGeoLoading(true);
                  try {
                    const r = await reverseGeocodeLatLng(startLat, startLong);
                    setValue("startAddress", r.address, { shouldValidate: true, shouldDirty: false });
                    setValue("startCity", r.city, { shouldValidate: true, shouldDirty: false });
                    setValue("startState", (r.state || "").toUpperCase().slice(0, 2), { shouldValidate: true, shouldDirty: false });
                    setValue("startZip", r.zip, { shouldValidate: true, shouldDirty: false });
                    setValue("startCountry", r.country, { shouldValidate: true, shouldDirty: false });
                    showSuccessToast("Starting point address updated");
                  } catch (err: any) {
                    showErrorToast(err?.message || "Failed to get address from lat/long.");
                  } finally {
                    setStartGeoLoading(false);
                  }
                }}
                disabled={!isEditing || startGeoLoading}
                sx={{ textTransform: "none", borderRadius: "8px", borderColor: primary, "&:hover": { borderColor: primary, bgcolor: "action.hover" } }}
              >
                {startGeoLoading ? "Getting Address..." : "Get Address"}
              </Button>
            )}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Lat: <b>{typeof startLat === "number" ? startLat.toFixed(6) : "—"}</b> &nbsp; Long:{" "}
              <b>{typeof startLong === "number" ? startLong.toFixed(6) : "—"}</b>
            </Typography>
          </Box>

          {/* Ending Point */}
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "text.secondary", mt: 3, mb: 1 }}>
            Ending Point
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <ToggleButtonGroup
              exclusive
              value={endMode}
              size="small"
              onChange={(_, v) => {
                if (!v) return;
                setEndMode(v);
                lastEndAddrReqRef.current = "";
                lastEndLatLngReqRef.current = "";
              }}
              disabled={!isEditing}
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontSize: 12,
                  px: 1.5,
                  borderRadius: "8px !important",
                },
              }}
            >
              <ToggleButton value="address">Address</ToggleButton>
              <ToggleButton value="latlng">Lat/Long</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Address"
              {...register("endAddress")}
              error={!!errors.endAddress}
              helperText={errors.endAddress?.message}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || endMode !== "address"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnOutlinedIcon sx={{ color: "text.disabled", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                register("endAddress").onChange(e);
                if (endMode === "address") {
                  setValue("endLat", null, { shouldValidate: true, shouldDirty: false });
                  setValue("endLong", null, { shouldValidate: true, shouldDirty: false });
                  lastEndAddrReqRef.current = "";
                }
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="City"
              {...register("endCity")}
              error={!!errors.endCity}
              helperText={errors.endCity?.message}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || endMode !== "address"}
              onChange={(e) => {
                register("endCity").onChange(e);
                if (endMode === "address") {
                  setValue("endLat", null, { shouldValidate: true, shouldDirty: false });
                  setValue("endLong", null, { shouldValidate: true, shouldDirty: false });
                  lastEndAddrReqRef.current = "";
                }
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="State"
              {...register("endState", {
                onChange: (e) => {
                  const v = (e.target.value || "").toString().toUpperCase().slice(0, 2);
                  setValue("endState", v, { shouldValidate: true });
                  if (endMode === "address") {
                    setValue("endLat", null, { shouldValidate: true, shouldDirty: false });
                    setValue("endLong", null, { shouldValidate: true, shouldDirty: false });
                    lastEndAddrReqRef.current = "";
                  }
                },
              })}
              error={!!errors.endState}
              helperText={errors.endState?.message}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: 2 }}
              disabled={!isEditing || endMode !== "address"}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="Zip"
              {...register("endZip")}
              error={!!errors.endZip}
              helperText={errors.endZip?.message}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || endMode !== "address"}
              onChange={(e) => {
                register("endZip").onChange(e);
                if (endMode === "address") {
                  setValue("endLat", null, { shouldValidate: true, shouldDirty: false });
                  setValue("endLong", null, { shouldValidate: true, shouldDirty: false });
                  lastEndAddrReqRef.current = "";
                }
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="Latitude"
              value={typeof endLat === "number" ? String(endLat) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setValue("endLat", v === "" ? null : Number.parseFloat(v), { shouldValidate: true, shouldDirty: true });
              }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || endMode !== "latlng"}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
            <TextField
              size="small"
              fullWidth
              label="Longitude"
              value={typeof endLong === "number" ? String(endLong) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setValue("endLong", v === "" ? null : Number.parseFloat(v), { shouldValidate: true, shouldDirty: true });
              }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing || endMode !== "latlng"}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: theme.palette.mode === "light" ? "#FAFBFC" : undefined } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            {endMode === "address" && !(typeof endLat === "number" && typeof endLong === "number") && (
              <Button
                type="button"
                variant="outlined"
                onClick={onGetEndLatLong}
                disabled={!isEditing || endGeoLoading}
                sx={{ textTransform: "none", borderRadius: "8px", borderColor: primary, "&:hover": { borderColor: primary, bgcolor: "action.hover" } }}
              >
                {endGeoLoading ? "Getting Lat/Long..." : "Get Lat/Long"}
              </Button>
            )}
            {endMode === "latlng" && (typeof endLat === "number" && typeof endLong === "number") && (
              <Button
                type="button"
                variant="outlined"
                onClick={async () => {
                  if (!isEditing) return;
                  if (!(typeof endLat === "number" && typeof endLong === "number")) return;
                  setEndGeoLoading(true);
                  try {
                    const r = await reverseGeocodeLatLng(endLat, endLong);
                    setValue("endAddress", r.address, { shouldValidate: true, shouldDirty: false });
                    setValue("endCity", r.city, { shouldValidate: true, shouldDirty: false });
                    setValue("endState", (r.state || "").toUpperCase().slice(0, 2), { shouldValidate: true, shouldDirty: false });
                    setValue("endZip", r.zip, { shouldValidate: true, shouldDirty: false });
                    setValue("endCountry", r.country, { shouldValidate: true, shouldDirty: false });
                    showSuccessToast("Ending point address updated");
                  } catch (err: any) {
                    showErrorToast(err?.message || "Failed to get address from lat/long.");
                  } finally {
                    setEndGeoLoading(false);
                  }
                }}
                disabled={!isEditing || endGeoLoading}
                sx={{ textTransform: "none", borderRadius: "8px", borderColor: primary, "&:hover": { borderColor: primary, bgcolor: "action.hover" } }}
              >
                {endGeoLoading ? "Getting Address..." : "Get Address"}
              </Button>
            )}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Lat: <b>{typeof endLat === "number" ? endLat.toFixed(6) : "—"}</b> &nbsp; Long:{" "}
              <b>{typeof endLong === "number" ? endLong.toFixed(6) : "—"}</b>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, mt: 2.5, flexWrap: "wrap" }}>
            {!isEditing ? (
              <Button
                type="button"
                variant="contained"
                disableElevation
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  bgcolor: primary,
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": { bgcolor: primary, opacity: 0.94 },
                }}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={!canSave}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    bgcolor: primary,
                    color: "#fff",
                    fontWeight: 600,
                    "&:hover": { bgcolor: primary, opacity: 0.94 },
                    "&.Mui-disabled": {
                      bgcolor: theme.palette.mode === "light" ? "rgba(60, 119, 149, 0.35)" : "rgba(60, 119, 149, 0.25)",
                      color: "rgba(255,255,255,0.9)",
                    },
                  }}
                >
                  Save Settings
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    if (lastLoadedValues) reset(lastLoadedValues);
                    setIsEditing(false);
                  }}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    borderColor: borderColor,
                    color: "text.primary",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: theme.palette.mode === "light" ? "#D8E6F2" : "divider",
          bgcolor: theme.palette.mode === "light" ? "#EEF6FF" : "rgba(238, 246, 255, 0.06)",
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 12 }}>
          <b>Note:</b> These settings will apply to all new routes created after saving. Existing routes will continue to use their original start/end points.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DriverManagementSettings;

