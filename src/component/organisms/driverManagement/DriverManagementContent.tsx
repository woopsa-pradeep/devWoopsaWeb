import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Divider,
  FormHelperText,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dayjs, { Dayjs } from "dayjs";
import CommonTable from "../../atoms/Table/CommonTable";
import CommonModal from "../../atoms/CommonModal";
import CustomButton from "../../atoms/CustomButton";
import CustomDatePicker from "../../atoms/CustomDatePicker";
import TextInput from "../../atoms/TextInput";
import SelectInput from "../../atoms/SelectInput";
import SwitchInput from "../../atoms/SwitchInput";
import { showErrorToast, showSuccessToast } from "../../../utils/toastUtils";
import {
  getDrivers,
  createDriver,
  updateDriver,
  getVehicles,
  createVehicle,
  updateVehicle,
} from "../../../redux/apis/distrubutor/driverManagementApis";
import { uploadImages } from "../../../redux/apis/distrubutor/retailerApis";
import RouteTab from "./RouteTab";

interface DriverData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  password?: string;
  isActive: boolean;
  driverLicenseNo?: string | null;
  licenseExpirationDate?: string | null;
  licenseClass?: "A" | "B" | "C" | "D" | null;
  driverPicture?: string | null;
  dotMedicalCertificate?: string | null;
}

interface VehicleData {
  id?: number;
  description?: string;
  loadCapacityLbs?: number;
  truckType?: string;
  licenseRegistrationNumber?: string;
  vinNumber?: string;
  engineType?: "gasoline" | "electric" | "diesel";
  lastServiceDate?: string;
  lastOilChangeDate?: string;
  nextOilChangeAfterMonths?: number;
  mileageHours?: number;
  insurancePolicyNumber?: string;
  insuranceCarrier?: string;
  insuranceExpirationDate?: string;
  conditionStatus?: string;
  physicalNotes?: string;
  isActive: boolean;
}

const driverSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, "Password must be at least 6 characters"),
  driverLicenseNo: z.string().min(1, "Driver license number is required"),
  licenseExpirationDate: z
    .string()
    .min(1, "License expiration date is required")
    .refine((val) => {
      return dayjs(val).isValid();
    }, { message: "License expiration date must be a valid date" }),
  licenseClass: z.enum(["A", "B", "C", "D"]).optional(),
  driverPicture: z.string().min(1, "Driver picture is required"),
  dotMedicalCertificate: z.string().min(1, "DOT medical certificate is required"),
  isActive: z.boolean(),
});

const vehicleSchema = z.object({
  description: z.string().optional(),
  loadCapacityLbs: z.number({ invalid_type_error: "Must be number" }).positive("Must be positive").optional(),
  truckType: z.string().optional(),
  licenseRegistrationNumber: z.string().optional(),
  vinNumber: z.string().optional(),
  engineType: z.enum(["gasoline", "electric", "diesel"]).optional(),
  lastServiceDate: z
    .string()
    .min(1, "Last service date is required")
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Last service date must be in ISO format (YYYY-MM-DD)",
    }),
  lastOilChangeDate: z
    .string()
    .min(1, "Last oil change date is required")
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Last oil change date must be in ISO format (YYYY-MM-DD)",
    }),
  nextOilChangeAfterMonths: z.number().positive("Must be positive").optional(),
  mileageHours: z.number().positive().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceCarrier: z.string().optional(),
  insuranceExpirationDate: z
    .string()
    .min(1, "Insurance expiration date is required")
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Insurance expiration date must be in ISO format (YYYY-MM-DD)",
    }),
  conditionStatus: z.string().optional(),
  physicalNotes: z.string().optional(),
  isActive: z.boolean(),
});

type DriverFormData = z.infer<typeof driverSchema>;
type VehicleFormData = z.infer<typeof vehicleSchema>;

const DriverManagementContent: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const location = useLocation();
  const routeTab = useMemo(() => {
    if (location.pathname.includes("/driver-management/drivers")) return 1;
    if (location.pathname.includes("/driver-management/vehicles")) return 2;
    return 0;
  }, [location.pathname]);
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverViewModalOpen, setDriverViewModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
  const [driverImagePreview, setDriverImagePreview] = useState<string | null>(null);
  const [driverCertificatePreview, setDriverCertificatePreview] = useState<string | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const certificateInputRef = React.useRef<HTMLInputElement | null>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleViewModalOpen, setVehicleViewModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const driverForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      driverLicenseNo: "",
      licenseExpirationDate: "",
      licenseClass: undefined,
      driverPicture: "",
      dotMedicalCertificate: "",
      isActive: true,
    },
  });

  const vehicleForm = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      description: "",
      loadCapacityLbs: undefined,
      truckType: "",
      licenseRegistrationNumber: "",
      vinNumber: "",
      lastServiceDate: "",
      lastOilChangeDate: "",
      nextOilChangeAfterMonths: undefined,
      mileageHours: undefined,
      insurancePolicyNumber: "",
      insuranceCarrier: "",
      insuranceExpirationDate: "",
      conditionStatus: "",
      physicalNotes: "",
      isActive: true,
    },
  });

  const compactInputStyle = { padding: "10px 12px", fontSize: "13px" };
  const comfyFieldProps = {
    size: "small" as const,
    sx: { mb: 0 },
    inputProps: { style: compactInputStyle },
  };

  const openDriverEditModal = (row: DriverData) => {
    setSelectedDriver(row);
    setDriverModalOpen(true);
  };

  const openVehicleEditModal = (row: VehicleData) => {
    setSelectedVehicle(row);
    vehicleForm.reset({
      description: row.description ?? "",
      loadCapacityLbs: row.loadCapacityLbs ?? undefined,
      truckType: row.truckType ?? "",
      licenseRegistrationNumber: row.licenseRegistrationNumber ?? "",
      vinNumber: row.vinNumber ?? "",
      engineType: row.engineType ?? undefined,
      lastServiceDate: row.lastServiceDate ?? "",
      lastOilChangeDate: row.lastOilChangeDate ?? "",
      nextOilChangeAfterMonths: row.nextOilChangeAfterMonths ?? undefined,
      mileageHours: row.mileageHours ?? undefined,
      insurancePolicyNumber: row.insurancePolicyNumber ?? "",
      insuranceCarrier: row.insuranceCarrier ?? "",
      insuranceExpirationDate: row.insuranceExpirationDate ?? "",
      conditionStatus: row.conditionStatus ?? "",
      physicalNotes: row.physicalNotes ?? "",
      isActive: row.isActive ?? true,
    });
    setVehicleModalOpen(true);
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const response: any = await getDrivers();
      const resData = response?.data?.data || {};
      const driverList = resData.drivers || resData.rows || resData.data || [];
      setDrivers(driverList);
    } catch (error) {
      console.log(error);
      showErrorToast("Failed to fetch drivers");
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const response: any = await getVehicles();
      const resData = response?.data?.data || {};
      const vehicleList = resData.vehicles || resData.rows || resData.data || [];
      setVehicles(vehicleList);
    } catch (error) {
      console.log(error);
      showErrorToast("Failed to fetch vehicles");
    } finally {
      setVehiclesLoading(false);
    }
  };

  useEffect(() => {
    if (routeTab === 1) fetchDrivers();
    if (routeTab === 2) fetchVehicles();
  }, [routeTab]);

  useEffect(() => {
    if (!selectedDriver) {
      driverForm.reset({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        driverLicenseNo: "",
        licenseExpirationDate: "",
        licenseClass: undefined,
        driverPicture: "",
        dotMedicalCertificate: "",
        isActive: true,
      });
      setDriverImagePreview(null);
      setDriverCertificatePreview(null);
      return;
    }

    driverForm.reset({
      firstName: selectedDriver.firstName ?? "",
      lastName: selectedDriver.lastName ?? "",
      email: selectedDriver.email ?? "",
      phoneNumber: selectedDriver.phoneNumber ?? "",
      password: selectedDriver.password ?? "",
      driverLicenseNo: selectedDriver.driverLicenseNo ?? "",
      licenseExpirationDate: selectedDriver.licenseExpirationDate ?? "",
      licenseClass: selectedDriver.licenseClass ?? undefined,
      driverPicture: selectedDriver.driverPicture ?? "",
      dotMedicalCertificate: selectedDriver.dotMedicalCertificate ?? "",
      isActive: selectedDriver.isActive ?? true,
    });
    setDriverImagePreview(selectedDriver.driverPicture ?? null);
    setDriverCertificatePreview(selectedDriver.dotMedicalCertificate ?? null);
  }, [selectedDriver, driverForm]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
      <Paper sx={{ borderRadius: 2, boxShadow: "none", overflow: "hidden", backgroundColor: routeTab === 0 ? "transparent" : "background.paper" }}>
        {(routeTab === 1 || routeTab === 2) && (
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              pb: 0,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {routeTab === 1 ? (
              <CustomButton
                onClick={() => {
                  setSelectedDriver(null);
                  driverForm.reset();
                  setDriverModalOpen(true);
                }}
                fullWidth={false}
                sx={{ mr: 2, mb: 0, mt: 0, height: "30px" }}
              >
                Add Driver
              </CustomButton>
            ) : (
              <CustomButton
                onClick={() => {
                  setSelectedVehicle(null);
                  vehicleForm.reset({
                    description: "",
                    loadCapacityLbs: undefined,
                    truckType: "",
                    licenseRegistrationNumber: "",
                    vinNumber: "",
                    engineType: undefined,
                    lastServiceDate: "",
                    lastOilChangeDate: "",
                    nextOilChangeAfterMonths: undefined,
                    mileageHours: undefined,
                    insurancePolicyNumber: "",
                    insuranceCarrier: "",
                    insuranceExpirationDate: "",
                    conditionStatus: "",
                    physicalNotes: "",
                    isActive: true,
                  });
                  setVehicleModalOpen(true);
                }}
                fullWidth={false}
                sx={{ mr: 2, mb: 0, mt: 0, height: "30px" }}
              >
                Add Vehicle
              </CustomButton>
            )}
          </Box>
        )}

        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            px: routeTab === 0 ? 0 : { xs: 1, sm: 1.5 },
            pt: routeTab === 0 ? 0 : { xs: 1, sm: 1.5 },
            pb: routeTab === 0 ? 0 : { xs: 1, sm: 1.5 },
          }}
        >
          {routeTab === 0 && <RouteTab />}

          {routeTab === 1 && (
            <CommonTable
              data={drivers}
              columns={[
                { id: "id", label: "Driver ID" },
                { id: "driverName", label: "Driver Name", render: (row: any) => `${row.firstName ?? ""} ${row.lastName ?? ""}` },
                { id: "driverLicenseNo", label: "Driving License" },
                { id: "phoneNumber", label: "Phone" },
                { id: "licenseClass", label: "Permit Class", render: (row: any) => (row.licenseClass ? `${row.licenseClass}` : "-") },
                {
                  id: "actions",
                  label: "Action",
                  align: "right",
                  render: (row: any) => (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedDriver(row);
                          setDriverViewModalOpen(true);
                        }}
                        sx={{ color: "primary.main" }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDriverEditModal(row)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              currentPage={1}
              totalPages={1}
              totalItems={drivers.length}
              pageSize={10}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              loading={driversLoading}
              isPagination={false}
              showPageSizeSelector={false}
              showTotalItems={false}
              showPageNumbers={false}
              containerHeight={isMobile ? "420px" : "calc(100vh - 360px)"}
              emptyStateComponent={<Typography>No drivers found</Typography>}
              padding={"0px 16px 16px"}
            />
          )}

          {routeTab === 2 && (
            <CommonTable
              data={vehicles}
              columns={[
                { id: "id", label: "Vehicle ID" },
                { id: "description", label: "Description" },
                { id: "licenseRegistrationNumber", label: "License No" },
                { id: "loadCapacityLbs", label: "Load Capacity (lbs)", render: (row: any) => (row.loadCapacityLbs ? `${row.loadCapacityLbs} lbs` : "-") },
                {
                  id: "actions",
                  label: "Action",
                  align: "right",
                  render: (row: any) => (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedVehicle(row);
                          setVehicleViewModalOpen(true);
                        }}
                        sx={{ color: "primary.main" }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openVehicleEditModal(row)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ),
                },
              ]}
              currentPage={1}
              totalPages={1}
              totalItems={vehicles.length}
              pageSize={10}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              loading={vehiclesLoading}
              isPagination={false}
              showPageSizeSelector={false}
              showTotalItems={false}
              showPageNumbers={false}
              containerHeight={isMobile ? "420px" : "calc(100vh - 360px)"}
              padding={"0px 16px 16px"}
              emptyStateComponent={<Typography>No vehicles found</Typography>}
            />
          )}
        </Box>
      </Paper>

      <CommonModal dense open={driverViewModalOpen} onClose={() => setDriverViewModalOpen(false)} title="View Driver" size="md">
        <Box sx={{ py: 0.25 }}>
          <Box
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              mb: 2,
            }}
          >
            <Box
              sx={{
                height: 72,
                background: "linear-gradient(135deg, #2E6F8E 0%, #4D8FB3 100%)",
              }}
            />
            <Box sx={{ px: 1.5, pb: 1.5, mt: -4.5, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    backgroundColor: "#E9EEF2",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedDriver?.driverPicture ? (
                    <Box component="img" src={selectedDriver.driverPicture} alt="Driver" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageOutlinedIcon sx={{ color: "text.secondary", fontSize: 30 }} />
                  )}
                </Box>
                <Box sx={{ pb: 0.5 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.15 }}>
                    {`${selectedDriver?.firstName || "-"} ${selectedDriver?.lastName || ""}`.trim()}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Driver profile
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 10,
                  bgcolor: selectedDriver?.isActive ? "#E8F6ED" : "#FDECEC",
                  color: selectedDriver?.isActive ? "#2E7D32" : "#C62828",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {selectedDriver?.isActive ? "ACTIVE" : "INACTIVE"}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
            {[
              { label: "Email", value: selectedDriver?.email },
              { label: "Phone Number", value: selectedDriver?.phoneNumber },
              { label: "Driver License No", value: selectedDriver?.driverLicenseNo },
              { label: "License Class", value: selectedDriver?.licenseClass },
              { label: "License Expiration Date", value: selectedDriver?.licenseExpirationDate },
            ].map((item) => (
              <Box key={item.label} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25 }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.25, textTransform: "uppercase", letterSpacing: 0.4 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{item.value || "-"}</Typography>
              </Box>
            ))}

            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25, gridColumn: "1 / -1" }}>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.75, textTransform: "uppercase", letterSpacing: 0.4 }}>DOT Medical Certificate</Typography>
              {selectedDriver?.dotMedicalCertificate ? (
                <CustomButton
                  appearance="outlined"
                  fullWidth={false}
                  sx={{ mt: 0 }}
                  onClick={() => window.open(selectedDriver.dotMedicalCertificate || "", "_blank")}
                >
                  View Certificate
                </CustomButton>
              ) : (
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>-</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CommonModal>

      <CommonModal dense open={vehicleViewModalOpen} onClose={() => setVehicleViewModalOpen(false)} title="View Vehicle" size="md">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1, py: 0.25 }}>
          {[
            { label: "Description", value: selectedVehicle?.description },
            { label: "Truck Type", value: selectedVehicle?.truckType },
            { label: "License Registration No", value: selectedVehicle?.licenseRegistrationNumber },
            { label: "VIN Number", value: selectedVehicle?.vinNumber },
            { label: "Load Capacity (lbs)", value: selectedVehicle?.loadCapacityLbs },
            { label: "Mileage Hours", value: selectedVehicle?.mileageHours },
            { label: "Last Service Date", value: selectedVehicle?.lastServiceDate },
            { label: "Last Oil Change Date", value: selectedVehicle?.lastOilChangeDate },
            { label: "Engine Type", value: selectedVehicle?.engineType },
            { label: "Insurance Policy Number", value: selectedVehicle?.insurancePolicyNumber },
            { label: "Insurance Carrier", value: selectedVehicle?.insuranceCarrier },
            { label: "Insurance Expiration Date", value: selectedVehicle?.insuranceExpirationDate },
            { label: "Condition Status", value: selectedVehicle?.conditionStatus },
            { label: "Status", value: selectedVehicle?.isActive ? "Active" : "Inactive" },
          ].map((item) => (
            <Box key={item.label} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25 }}>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.25, textTransform: "uppercase", letterSpacing: 0.4 }}>{item.label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{item.value?.toString() || "-"}</Typography>
            </Box>
          ))}

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25, gridColumn: "1 / -1" }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.4 }}>Physical Notes</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {selectedVehicle?.physicalNotes || "-"}
            </Typography>
          </Box>
        </Box>
      </CommonModal>

      <CommonModal dense open={driverModalOpen} onClose={() => setDriverModalOpen(false)} title={selectedDriver ? "Edit driver" : "Add driver"} size="lg">
        <form
          onSubmit={driverForm.handleSubmit(async (formData) => {
            try {
              if (!selectedDriver && !formData.password) {
                showErrorToast("Password is required for new driver");
                return;
              }

              const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                driverLicenseNo: formData.driverLicenseNo,
                licenseExpirationDate: formData.licenseExpirationDate,
                licenseClass: formData.licenseClass,
                driverPicture: formData.driverPicture,
                dotMedicalCertificate: formData.dotMedicalCertificate,
                isActive: formData.isActive,
              };

              if (formData.password) payload.password = formData.password;
              if (selectedDriver?.id) {
                await updateDriver(selectedDriver.id, payload);
                showSuccessToast("Driver updated successfully");
              } else {
                await createDriver(payload);
                showSuccessToast("Driver created successfully");
              }

              await fetchDrivers();
              setDriverModalOpen(false);
              setSelectedDriver(null);
              driverForm.reset();
            } catch (error: any) {
              showErrorToast(error?.response?.data?.message || "Failed to save driver");
            }
          })}
        >
          <Box sx={{ maxHeight: "min(78vh, 720px)", display: "flex", flexDirection: "column" }}>
            <Box sx={{ overflowY: "auto", pr: 0.5, pb: 1 }}>
              {true ? (
                <Box>
                  <Box
                    sx={{
                      height: 3,
                      borderRadius: 0.5,
                      background: "linear-gradient(90deg, #2E6F8E 0%, #4D8FB3 100%)",
                      mb: 1.25,
                    }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25, flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Box
                        onClick={() => imageInputRef.current?.click()}
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "10px",
                          backgroundColor: "action.hover",
                          border: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {driverImagePreview ? (
                          <Box component="img" src={driverImagePreview} alt="Driver" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <ImageOutlinedIcon sx={{ color: "text.secondary", fontSize: 28 }} />
                        )}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", letterSpacing: 0.3, textTransform: "uppercase" }}>
                          Driver photo
                        </Typography>
                        <Typography
                          sx={{ fontSize: 13, color: "primary.main", cursor: "pointer", fontWeight: 600, lineHeight: 1.2 }}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          Upload image
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Typography fontSize={13} fontWeight={600}>Active</Typography>
                      <SwitchInput checked={driverForm.watch("isActive")} onChange={(checked) => driverForm.setValue("isActive", checked)} isShowLabel={false} sx={{ m: 0 }} />
                    </Box>
                    <input
                      ref={imageInputRef}
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res: any = await uploadImages(file);
                          const imageUrl = res?.data?.url || res?.url || res?.data || "";
                          driverForm.setValue("driverPicture", imageUrl, { shouldValidate: true });
                          setDriverImagePreview(imageUrl);
                        } catch {
                          showErrorToast("Image upload failed");
                        }
                      }}
                    />
                  </Box>
                  {driverForm.formState.errors.driverPicture?.message && <FormHelperText error sx={{ mt: 0.5 }}>{driverForm.formState.errors.driverPicture.message}</FormHelperText>}

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, columnGap: 1.25, rowGap: 1 }}>
                    <TextInput label="First Name *" error={!!driverForm.formState.errors.firstName} helperText={driverForm.formState.errors.firstName?.message} sx={{ mb: 0 }} {...driverForm.register("firstName")} />
                    <TextInput label="Last Name *" error={!!driverForm.formState.errors.lastName} helperText={driverForm.formState.errors.lastName?.message} sx={{ mb: 0 }} {...driverForm.register("lastName")} />
                    <TextInput label="Driver License No *" error={!!driverForm.formState.errors.driverLicenseNo} helperText={driverForm.formState.errors.driverLicenseNo?.message} sx={{ mb: 0 }} {...driverForm.register("driverLicenseNo")} />
                    <CustomDatePicker
                      label="Expiration Date *"
                      value={driverForm.watch("licenseExpirationDate") ? dayjs(driverForm.watch("licenseExpirationDate")) : null}
                      onChange={(date: Dayjs | null) => driverForm.setValue("licenseExpirationDate", date ? date.format("YYYY-MM-DD") : "")}
                      error={!!driverForm.formState.errors.licenseExpirationDate}
                      helperText={driverForm.formState.errors.licenseExpirationDate?.message}
                      sx={{ mb: 0 }}
                    />
                    <SelectInput
                      label="License Class"
                      value={driverForm.watch("licenseClass") ?? ""}
                      onChange={(e) => driverForm.setValue("licenseClass", e.target.value as any)}
                      options={[
                        { label: "Class A", value: "A" },
                        { label: "Class B", value: "B" },
                        { label: "Class C", value: "C" },
                        { label: "Class D", value: "D" },
                      ]}
                      marginBottom="0"
                    />
                    <TextInput label="Email ID *" error={!!driverForm.formState.errors.email} helperText={driverForm.formState.errors.email?.message} sx={{ mb: 0 }} {...driverForm.register("email")} />
                    <TextInput label="Phone Number *" error={!!driverForm.formState.errors.phoneNumber} helperText={driverForm.formState.errors.phoneNumber?.message} sx={{ mb: 0 }} {...driverForm.register("phoneNumber")} />
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "4px" }}>
                        <Typography fontSize={13} fontWeight={600} sx={{ opacity: 0.75 }}>
                          DOT medical certificate *
                        </Typography>
                        <IconButton
                          size="small"
                          sx={{ p: 0.25, color: "primary.main" }}
                          disabled={!driverCertificatePreview}
                          onClick={() => {
                            if (driverCertificatePreview) window.open(driverCertificatePreview, "_blank");
                          }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextInput
                        label=""
                        value={driverCertificatePreview ? driverCertificatePreview.substring(driverCertificatePreview.lastIndexOf("/") + 1) : ""}
                        sx={{ mb: 0 }}
                        icon={<AttachFileIcon sx={{ color: "text.secondary", cursor: "pointer" }} onClick={() => certificateInputRef.current?.click()} />}
                      />
                      {driverForm.formState.errors.dotMedicalCertificate?.message && <FormHelperText error>{driverForm.formState.errors.dotMedicalCertificate.message}</FormHelperText>}
                    </Box>
                    <TextInput label="Password *" type="password" error={!!driverForm.formState.errors.password} helperText={driverForm.formState.errors.password?.message} sx={{ mb: 0 }} {...driverForm.register("password")} />
                    <input
                      ref={certificateInputRef}
                      hidden
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res: any = await uploadImages(file);
                          const fileUrl = res?.data?.url || res?.url || res?.data || "";
                          driverForm.setValue("dotMedicalCertificate", fileUrl, { shouldValidate: true });
                          setDriverCertificatePreview(fileUrl);
                        } catch {
                          showErrorToast("File upload failed");
                        }
                      }}
                    />
                   
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3.5, pt: 1 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextInput label="First Name *" error={!!driverForm.formState.errors.firstName} helperText={driverForm.formState.errors.firstName?.message} {...comfyFieldProps} {...driverForm.register("firstName")} />
                    <TextInput label="Last Name *" error={!!driverForm.formState.errors.lastName} helperText={driverForm.formState.errors.lastName?.message} {...comfyFieldProps} {...driverForm.register("lastName")} />
                    <TextInput label="Driver License No *" error={!!driverForm.formState.errors.driverLicenseNo} helperText={driverForm.formState.errors.driverLicenseNo?.message} {...comfyFieldProps} {...driverForm.register("driverLicenseNo")} />
                    <CustomDatePicker
                      label="Expiration Date *"
                      value={driverForm.watch("licenseExpirationDate") ? dayjs(driverForm.watch("licenseExpirationDate")) : null}
                      onChange={(date: Dayjs | null) => driverForm.setValue("licenseExpirationDate", date ? date.format("YYYY-MM-DD") : "")}
                      disablePast
                      error={!!driverForm.formState.errors.licenseExpirationDate}
                      helperText={driverForm.formState.errors.licenseExpirationDate?.message}
                      sx={{ mb: 0 }}
                    />
                    <FormControl fullWidth size="medium" sx={{ mb: 0 }}>
                      <InputLabel>License Class</InputLabel>
                      <Select value={driverForm.watch("licenseClass") ?? ""} label="License Class" onChange={(e) => driverForm.setValue("licenseClass", e.target.value as any)}>
                        <MenuItem value="A">Class A</MenuItem>
                        <MenuItem value="B">Class B</MenuItem>
                        <MenuItem value="C">Class C</MenuItem>
                        <MenuItem value="D">Class D</MenuItem>
                      </Select>
                    </FormControl>
                    <TextInput label="Email Id *" error={!!driverForm.formState.errors.email} helperText={driverForm.formState.errors.email?.message} {...comfyFieldProps} {...driverForm.register("email")} />
                    <TextInput label="Phone Number *" error={!!driverForm.formState.errors.phoneNumber} helperText={driverForm.formState.errors.phoneNumber?.message} {...comfyFieldProps} {...driverForm.register("phoneNumber")} />
                    <TextInput label="Password *" type="password" error={!!driverForm.formState.errors.password} helperText={driverForm.formState.errors.password?.message} {...comfyFieldProps} {...driverForm.register("password")} />
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "rgba(0, 0, 0, 0.6)" }}>Driver Picture *</Typography>
                    <Box
                      sx={{
                        width: 200,
                        height: 250,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        backgroundColor: "#fafafa",
                        cursor: "pointer",
                        mx: "auto",
                      }}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {!driverImagePreview ? (
                        <Typography fontSize={14} color="text.secondary" textAlign="center" px={2}>Click to upload image</Typography>
                      ) : (
                        <Box component="img" src={driverImagePreview || ""} alt="Driver" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <input
                        ref={imageInputRef}
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const res: any = await uploadImages(file);
                            const imageUrl = res?.data?.url || res?.url || res?.data || "";
                            driverForm.setValue("driverPicture", imageUrl, { shouldValidate: true });
                            setDriverImagePreview(imageUrl);
                          } catch {
                            showErrorToast("Image upload failed");
                          }
                        }}
                      />
                    </Box>
                    {driverForm.formState.errors.driverPicture?.message && (
                      <FormHelperText error sx={{ mt: 0.5 }}>
                        {driverForm.formState.errors.driverPicture?.message}
                      </FormHelperText>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "rgba(0, 0, 0, 0.6)" }}>DOT Medical Certificate *</Typography>
                        <IconButton
                          size="small"
                          sx={{ p: 0.25, color: "primary.main" }}
                          disabled={!driverCertificatePreview}
                          onClick={() => {
                            if (driverCertificatePreview) window.open(driverCertificatePreview, "_blank");
                          }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <CustomButton appearance="outlined" fullWidth sx={{ mt: 0 }} onClick={() => certificateInputRef.current?.click()}>
                        UPLOAD FILE
                      </CustomButton>
                      <input
                        ref={certificateInputRef}
                        hidden
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const res: any = await uploadImages(file);
                            const fileUrl = res?.data?.url || res?.url || res?.data || "";
                            driverForm.setValue("dotMedicalCertificate", fileUrl, { shouldValidate: true });
                            setDriverCertificatePreview(fileUrl);
                          } catch {
                            showErrorToast("File upload failed");
                          }
                        }}
                      />
                      {driverCertificatePreview && (
                        <Typography fontSize={13} sx={{ color: "primary.main", cursor: "pointer", textDecoration: "underline", mt: 0.5 }} onClick={() => window.open(driverCertificatePreview || "", "_blank")}>
                          {(driverCertificatePreview || "").substring((driverCertificatePreview || "").lastIndexOf("/") + 1)}
                        </Typography>
                      )}
                      {driverForm.formState.errors.dotMedicalCertificate?.message && (
                        <FormHelperText error sx={{ mt: 0.25 }}>
                          {driverForm.formState.errors.dotMedicalCertificate?.message}
                        </FormHelperText>
                      )}
                    </Box>
                    <Box sx={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
                      <Typography fontSize={14} fontWeight={500}>Driver Is Active</Typography>
                      <SwitchInput checked={driverForm.watch("isActive")} onChange={(checked) => driverForm.setValue("isActive", checked)} isShowLabel={false} sx={{ m: 0 }} />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                backgroundColor: "background.paper",
                borderTop: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                pt: 1,
                mt: 0.5,
              }}
            >
              <CustomButton appearance="outlined" onClick={() => setDriverModalOpen(false)} fullWidth={false} sx={{ minWidth: 88 }}>
                Cancel
              </CustomButton>
              <CustomButton appearance="filled" type="submit" fullWidth={false} sx={{ minWidth: 100 }}>
                {selectedDriver ? "Save" : "Add driver"}
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>

      <CommonModal dense open={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} title={selectedVehicle ? "Edit vehicle" : "Add vehicle"} size="lg">
        <form
          onSubmit={vehicleForm.handleSubmit(async (data) => {
            try {
              const payload = {
                description: data.description,
                loadCapacityLbs: data.loadCapacityLbs,
                truckType: data.truckType,
                licenseRegistrationNumber: data.licenseRegistrationNumber,
                vinNumber: data.vinNumber,
                engineType: data.engineType,
                lastServiceDate: data.lastServiceDate,
                lastOilChangeDate: data.lastOilChangeDate,
                nextOilChangeAfterMonths: data.nextOilChangeAfterMonths,
                mileageHours: data.mileageHours,
                insurancePolicyNumber: data.insurancePolicyNumber,
                insuranceCarrier: data.insuranceCarrier,
                insuranceExpirationDate: data.insuranceExpirationDate,
                conditionStatus: data.conditionStatus,
                physicalNotes: data.physicalNotes,
                isActive: data.isActive,
              };
              if (selectedVehicle?.id !== undefined && selectedVehicle?.id !== null) {
                await updateVehicle(selectedVehicle.id, payload);
                showSuccessToast("Vehicle updated successfully");
              } else {
                await createVehicle(payload);
                showSuccessToast("Vehicle created successfully");
              }

              await fetchVehicles();
              setVehicleModalOpen(false);
              setSelectedVehicle(null);
            } catch (error: any) {
              showErrorToast(error?.response?.data?.message || "Failed to save vehicle");
            }
          })}
        >
          <Box sx={{ maxHeight: "min(78vh, 720px)", display: "flex", flexDirection: "column" }}>
            <Box sx={{ overflowY: "auto", pr: 0.5, pb: 1 }}>
            <Box
              sx={{
                height: 3,
                borderRadius: 0.5,
                background: "linear-gradient(90deg, #2E6F8E 0%, #4D8FB3 100%)",
                mb: 1.25,
              }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 1.5, rowGap: 1.25, alignItems: "start" }}>
              <TextInput label="Description" {...comfyFieldProps} {...vehicleForm.register("description")} />
              <TextInput label="Truck Type" {...comfyFieldProps} {...vehicleForm.register("truckType")} />
              <TextInput label="License Registration No" {...comfyFieldProps} {...vehicleForm.register("licenseRegistrationNumber")} />
              <TextInput label="VIN Number" {...comfyFieldProps} {...vehicleForm.register("vinNumber")} />
              <TextInput type="number" label="Load Capacity (lbs)" error={!!vehicleForm.formState.errors.loadCapacityLbs} helperText={vehicleForm.formState.errors.loadCapacityLbs?.message} {...comfyFieldProps} inputProps={{ min: 0, step: 1, style: compactInputStyle }} {...vehicleForm.register("loadCapacityLbs", { valueAsNumber: true, min: 0 })} />
              <TextInput type="number" label="Mileage Hours" error={!!vehicleForm.formState.errors.mileageHours} helperText={vehicleForm.formState.errors.mileageHours?.message} {...comfyFieldProps} inputProps={{ min: 0, step: 1, style: compactInputStyle }} {...vehicleForm.register("mileageHours", { valueAsNumber: true, min: 0 })} />
              <CustomDatePicker
                label="Last Service Date *"
                value={vehicleForm.watch("lastServiceDate") ? dayjs(vehicleForm.watch("lastServiceDate")) : null}
                onChange={(d) => vehicleForm.setValue("lastServiceDate", d ? d.format("YYYY-MM-DD") : "")}
                error={!!vehicleForm.formState.errors.lastServiceDate}
                helperText={vehicleForm.formState.errors.lastServiceDate?.message}
                sx={{ mb: 0 }}
              />
              <CustomDatePicker
                label="Last Oil Change *"
                value={vehicleForm.watch("lastOilChangeDate") ? dayjs(vehicleForm.watch("lastOilChangeDate")) : null}
                onChange={(d) => vehicleForm.setValue("lastOilChangeDate", d ? d.format("YYYY-MM-DD") : "")}
                error={!!vehicleForm.formState.errors.lastOilChangeDate}
                helperText={vehicleForm.formState.errors.lastOilChangeDate?.message}
                sx={{ mb: 0 }}
              />
              <FormControl fullWidth size="small" sx={{ mb: 0 }}>
                <InputLabel>Engine Type</InputLabel>
                <Select value={vehicleForm.watch("engineType") ?? ""} label="Engine Type" onChange={(e) => vehicleForm.setValue("engineType", e.target.value as any)}>
                  <MenuItem value="gasoline">Gasoline</MenuItem>
                  <MenuItem value="diesel">Diesel</MenuItem>
                  <MenuItem value="electric">Electric</MenuItem>
                </Select>
                {vehicleForm.formState.errors.engineType && (
                  <FormHelperText error>{vehicleForm.formState.errors.engineType?.message as string}</FormHelperText>
                )}
              </FormControl>
              <Box sx={{ gridColumn: "1 / -1", pt: 0.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "text.secondary", textTransform: "uppercase" }}>
                  Insurance
                </Typography>
                <Divider sx={{ mt: 0.5, mb: 1 }} />
              </Box>
              <TextInput label="Policy Number " {...comfyFieldProps} {...vehicleForm.register("insurancePolicyNumber")} />
              <TextInput label="Carrier" {...comfyFieldProps} {...vehicleForm.register("insuranceCarrier")} />
              <Box sx={{ width: "100%" }}>
                <CustomDatePicker
                  label="Expiration *"
                  value={vehicleForm.watch("insuranceExpirationDate") ? dayjs(vehicleForm.watch("insuranceExpirationDate")) : null}
                  onChange={(d) => vehicleForm.setValue("insuranceExpirationDate", d ? d.format("YYYY-MM-DD") : "")}
                  error={!!vehicleForm.formState.errors.insuranceExpirationDate}
                  helperText={vehicleForm.formState.errors.insuranceExpirationDate?.message}
                  sx={{ mb: 0 }}
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1", pt: 0.25 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "text.secondary", textTransform: "uppercase" }}>
                  Condition & notes
                </Typography>
                <Divider sx={{ mt: 0.5, mb: 1 }} />
              </Box>
              <Box sx={{ width: "100%" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Condition Status</InputLabel>
                  <Select value={vehicleForm.watch("conditionStatus") ?? ""} label="Condition Status" onChange={(e) => vehicleForm.setValue("conditionStatus", e.target.value)}>
                    <MenuItem value="Good">Good</MenuItem>
                    <MenuItem value="Needs Repair">Needs Repair</MenuItem>
                    <MenuItem value="Excellent">Excellent</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                label="Physical Notes"
                multiline
                rows={2}
                size="small"
                fullWidth
                value={vehicleForm.watch("physicalNotes") ?? ""}
                onChange={(e) => vehicleForm.setValue("physicalNotes", e.target.value)}
                sx={{
                  gridColumn: "1 / -1",
                  "& .MuiInputBase-input": { fontSize: "13px", py: 1 },
                }}
              />
              <Box sx={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Vehicle active</Typography>
                <SwitchInput checked={vehicleForm.watch("isActive")} onChange={(checked) => vehicleForm.setValue("isActive", checked)} isShowLabel={false} sx={{ m: 0 }} />
              </Box>
            </Box>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                backgroundColor: "background.paper",
                borderTop: "1px solid",
                borderColor: "divider",
                pt: 1,
                mt: 0.5,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <CustomButton appearance="outlined" onClick={() => setVehicleModalOpen(false)} sx={{ minWidth: 88 }}>
                Cancel
              </CustomButton>
              <CustomButton type="submit" sx={{ minWidth: 100 }}>
                {selectedVehicle ? "Save" : "Add vehicle"}
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>
    </Box>
  );
};

export default DriverManagementContent;
