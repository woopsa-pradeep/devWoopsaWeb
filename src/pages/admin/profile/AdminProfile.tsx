import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Grid,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  getProfile,
  uploadProfileImage,
  updateProfile,
} from "../../../redux/apis/distrubutor/settingApis";
import CompanyIconActive from "../../../assets/bag.svg";
import CompanyIconInactive from "../../../assets/icons/bag-inactive.svg";
import ContactIconActive from "../../../assets/icons/phone-user-active.svg";
import ContactIconInactive from "../../../assets/icons/phone-user-inactive.svg";
import { toast } from "react-hot-toast";
import { setLogo } from "../../../redux/slices/authSlice";
import { useAppDispatch } from "../../../redux/store";
// import LicenseIconActive from "../../../assets/icons/licence-active.svg";
// import LicenseIconInactive from "../../../assets/icons/licence-inactive.svg";
import { useForm } from "react-hook-form";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

type ProfileFormValues = {
  D_Fcontact: string;
  D_Lcontact: string;
  D_Addr1: string;
  D_City: string;
  D_State: string;
  D_Zip: string;
  D_Phone: string;
  D_Email: string;
  D_Fax: string;
  D_OtherAddr1?: string;
  D_OtherPhone: string;
  // RJR_Whole_ID: string;
  // RJR_Ship_ID: string;
  // RJR_Descriptor: string;
  // PO_ShipTo1: string;
  // PO_ShipTo2: string;
  ClientID: string;
};

const AdminProfile = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<any>(null);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const handleTabChange = (_: any, newValue: number) => setTab(newValue);
  const [editMode, setEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      D_Fcontact: "",
      D_Lcontact: "",
      D_Addr1: "",
      D_City: "",
      D_State: "",
      D_Zip: "",
      D_Phone: "",
      D_Email: "",
      D_Fax: "",
      D_OtherAddr1: "",
      D_OtherPhone: "",
      // RJR_Whole_ID: "",
      // RJR_Ship_ID: "",
      // RJR_Descriptor: "",
      // PO_ShipTo1: "",
      // PO_ShipTo2: "",
      ClientID: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response: any = await getProfile();
        setData(response?.data?.data);
      } catch (err) {
        console.log(err, "err>>>>");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (data) {
      reset({
        D_Fcontact: data.D_Fcontact ?? "",
        D_Lcontact: data.D_Lcontact ?? "",
        D_Addr1: data.D_Addr1 ?? "",
        D_City: data.D_City ?? "",
        D_State: data.D_State ?? "",
        D_Zip: data.D_Zip ?? "",
        D_Phone: data.D_Phone ?? "",
        D_Email: data.D_Email ?? "",
        D_Fax: data.D_Fax ?? "",
        ClientID: String(data.ClientID ?? ""),
        D_OtherAddr1: data.D_OtherAddr1 ?? "",
        D_OtherPhone: data.D_OtherPhone ?? "",
        // RJR_Whole_ID: data.RJR_Whole_ID ?? "",
        // RJR_Ship_ID: data.RJR_Ship_ID ?? "",
        // RJR_Descriptor: data.RJR_Descriptor ?? "",
        // PO_ShipTo1: data.PO_ShipTo1 ?? "",
        // PO_ShipTo2: data.PO_ShipTo2 ?? "",
      });
    }
  }, [data, reset]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const data: any = await uploadProfileImage(file);

      dispatch(setLogo(data.imageUrl));
      toast.success("Image uploaded successfully");
      const response: any = await getProfile();
      setData(response?.data?.data);
    } catch (err) {
      console.log(err, "err>>>>");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }
  if (!data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <Typography color="error">Failed to load profile data.</Typography>
      </Box>
    );
  }

  const onSubmit = async (formValues: ProfileFormValues) => {
    try {
      const payload = {
        ...formValues,

        ClientID: String(formValues.ClientID),
      };

      delete (payload as any).PM_ID;

      const cleanPayload = {
        ...payload,
        D_OtherAddr1: payload.D_OtherAddr1 || null,
        D_OtherPhone: payload.D_OtherPhone || null,
        D_Fax: payload.D_Fax || null,
      };

      console.log("Submitting payload ", cleanPayload);

      await updateProfile(cleanPayload);

      toast.success("Profile updated successfully");
      setEditMode(false);

      const response: any = await getProfile();
      setData(response?.data?.data);
    } catch (error: any) {
      console.error("Update error:", error?.response?.data);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <Box sx={{ px: isSmallScreen ? 1 : 3, py: 1 }}>
      <Typography fontSize={"22px"} fontWeight={500} mb={2}>
        Profile
      </Typography>
      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        mt={3}
        gap={3}
        sx={{
          height: isSmallScreen ? "auto" : "calc(100vh - 223px)",
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={1}
          sx={{
            width: isSmallScreen ? "100%" : "250px !important",
            minWidth: isSmallScreen ? "auto" : "250px !important",
            borderRadius: 3,
            overflow: isSmallScreen ? "hidden" : "auto",
            height: isSmallScreen ? "auto" : "100%",
            boxShadow: "none",
          }}
        >
          <Tabs
            orientation={isSmallScreen ? "horizontal" : "vertical"}
            variant="scrollable"
            value={tab}
            onChange={handleTabChange}
            sx={{ py: isSmallScreen ? 0 : 2 }}
            TabIndicatorProps={{ style: { display: "none" } }}
          >
            <Tab
              icon={
                <img
                  src={tab === 0 ? CompanyIconActive : CompanyIconInactive}
                  alt=""
                />
              }
              iconPosition="start"
              label="Company's Details"
              sx={{
                alignItems: "center",
                textTransform: "none",
                fontWeight: 400,
                justifyContent: "flex-start",
                minHeight: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: isSmallScreen ? "auto" : "100% !important",
                px: 2,
                mt: 1,
                mb: 1,
                py: 1,
              }}
            />
            <Tab
              icon={
                <img
                  src={tab === 1 ? ContactIconActive : ContactIconInactive}
                  alt=""
                />
              }
              iconPosition="start"
              label="Contact Information"
              sx={{
                alignItems: "center",
                textTransform: "none",
                fontWeight: 400,
                justifyContent: "flex-start",
                minHeight: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: isSmallScreen ? "auto" : "100% !important",
                px: 2,
                mt: 1,
                mb: 1,
                py: 1,
              }}
            />
            {/* <Tab
              icon={
                <img
                  src={tab === 2 ? LicenseIconActive : LicenseIconInactive}
                  alt=""
                />
              }
              iconPosition="start"
              label="Distributor's License Info"
              sx={{
                alignItems: "center",
                textTransform: "none",
                fontWeight: 400,
                justifyContent: "flex-start",
                minHeight: "auto",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: isSmallScreen ? "auto" : "100% !important",
                px: 2,
                mt: 1,
                mb: 1,
                py: 1,
              }}
            /> */}
          </Tabs>
        </Paper>
        <Paper
          elevation={1}
          sx={{
            borderRadius: 3,
            p: 3,
            overflow: isSmallScreen ? "hidden" : "auto",
            height: isSmallScreen ? "auto" : "100%",
            boxShadow: "none",
          }}
        >
          {tab === 0 && (
            <Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={3}
                pb={1}
              >
                <Typography fontSize={18} fontWeight={500}>
                  Company's Details
                </Typography>

                {!editMode ? (
                  <EditIcon
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontSize: 22,
                    }}
                    onClick={() => setEditMode(true)}
                  />
                ) : (
                  <Box display="flex" gap={1}>
                    <SaveIcon
                      sx={{
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        color: isSubmitting ? "grey.400" : "success.main",
                      }}
                      onClick={
                        !isSubmitting ? handleSubmit(onSubmit) : undefined
                      }
                    />
                    <CloseIcon
                      sx={{ cursor: "pointer", color: "error.main" }}
                      onClick={() => {
                        reset(data);
                        setEditMode(false);
                      }}
                    />
                  </Box>
                )}
              </Box>

              <Box
                display="flex"
                alignItems="center"
                gap={3}
                mb={5}
                flexWrap="wrap"
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 72,
                    height: 72,
                  }}
                >
                  <label htmlFor="distributor-image-upload">
                    <input
                      id="distributor-image-upload"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                      disabled={!editMode || uploading}
                    />

                    <Avatar
                      src={data.image || undefined}
                      sx={{
                        width: 72,
                        height: 72,
                        cursor: editMode ? "pointer" : "default",
                        opacity: uploading ? 0.6 : 1,
                      }}
                    />

                    {editMode && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 24,
                          height: 24,
                          bgcolor: "primary.main",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid white",
                        }}
                      >
                        <EditIcon sx={{ fontSize: 14, color: "#fff" }} />
                      </Box>
                    )}
                  </label>

                  {uploading && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(255,255,255,0.6)",
                        borderRadius: "50%",
                      }}
                    >
                      <CircularProgress size={28} />
                    </Box>
                  )}
                </Box>

                <Typography fontSize={16} fontWeight={500}>
                  Distributor Image
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Distributor ID (DID)
                  </Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.PM_ID}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Distributor Name
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.D_Fcontact}
                      helperText={errors.D_Fcontact?.message}
                      {...register("D_Fcontact", {
                        required: "Distributor name is required",
                        minLength: {
                          value: 3,
                          message: "Minimum 3 characters required",
                        },
                      })}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_Fcontact}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Owner's Legal Name
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("D_Lcontact")}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_Lcontact}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Client ID Number
                  </Typography>

                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.ClientID}
                      helperText={errors.ClientID?.message}
                      {...register("ClientID", {
                        required: "Client ID is required",
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Client ID must be numeric",
                        },
                      })}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.ClientID}
                    </Typography>
                  )}
                </Grid>

                {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Guarantor (Personal)
                  </Typography>

                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("D_Fcontact")}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_Fcontact}
                    </Typography>
                  )}
                </Grid> */}

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Primary Address
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.D_Addr1}
                      helperText={errors.D_Addr1?.message}
                      {...register("D_Addr1", {
                        required: "Primary address is required",
                      })}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_Addr1}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>City</Typography>

                  {editMode ? (
                    <TextField size="small" fullWidth {...register("D_City")} />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_City}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    State
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.D_State}
                      helperText={errors.D_State?.message}
                      {...register("D_State", {
                        required: "State is required",
                        pattern: {
                          value: /^[A-Z]{2}$/,
                          message:
                            "State must be 2 uppercase letters (e.g. CA, NY)",
                        },
                      })}
                    />
                  ) : (
                    <Typography fontSize={13}>{data.D_State}</Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Zip
                  </Typography>
                  {editMode ? (
                    <TextField size="small" fullWidth {...register("D_Zip")} />
                  ) : (
                    <Typography fontSize={13}>{data.D_Zip}</Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14} fontWeight={400}>
                    Alternate Address
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("D_OtherAddr1")}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_OtherAddr1 || "-"}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              {/* HEADER WITH ICONS */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={4}
              >
                <Typography fontSize={18} fontWeight={500}>
                  Contact Information
                </Typography>

                {!editMode ? (
                  <EditIcon
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontSize: 22,
                    }}
                    onClick={() => setEditMode(true)}
                  />
                ) : (
                  <Box display="flex" gap={1}>
                    <SaveIcon
                      sx={{
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        color: isSubmitting ? "grey.400" : "success.main",
                      }}
                      onClick={
                        !isSubmitting ? handleSubmit(onSubmit) : undefined
                      }
                    />
                    <CloseIcon
                      sx={{
                        cursor: "pointer",
                        color: "error.main",
                      }}
                      onClick={() => {
                        reset(data);
                        setEditMode(false);
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* FORM */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Primary Phone Number</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.D_Phone}
                      helperText={errors.D_Phone?.message}
                      {...register("D_Phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Enter a valid 10-digit phone number",
                        },
                      })}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_Phone}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Alternate Phone Number</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.D_OtherPhone}
                      helperText={errors.D_OtherPhone?.message}
                      {...register("D_OtherPhone", {
                        validate: (value) =>
                          !value ||
                          /^[0-9]{10}$/.test(value) ||
                          "Invalid phone number",
                      })}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_OtherPhone || "-"}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>FAX Number</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      error={!!errors.D_Fax}
                      helperText={errors.D_Fax?.message}
                      {...register("D_Fax")}
                    />
                  ) : (
                    <Typography fontSize={13} color="text.secondary">
                      {data.D_Fax}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>IT Person</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Lcontact || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>IT Person's Number</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {data.D_Phone || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Primary Email Address</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      type="email"
                      error={!!errors.D_Email}
                      helperText={errors.D_Email?.message}
                      {...register("D_Email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Enter a valid email address",
                        },
                      })}
                    />
                  ) : (
                    <Typography
                      fontSize={13}
                      color="primary.main"
                      component="a"
                      href={`mailto:${data.D_Email}`}
                    >
                      {data.D_Email}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Alternate Email Address</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      type="email"
                      {...register("D_Email")}
                    />
                  ) : (
                    <Typography fontSize={13} color="primary.main">
                      {data.D_Email || "-"}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* {tab === 2 && (
            <Box>
              <Typography fontSize={18} fontWeight={500} mb={4}>
                Distributor's License Info
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Sales TAX Number</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("RJR_Whole_ID")}
                    />
                  ) : (
                    <Typography fontSize={13}>{data.RJR_Whole_ID}</Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Primary License Number</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("RJR_Ship_ID")}
                    />
                  ) : (
                    <Typography fontSize={13}>{data.RJR_Ship_ID}</Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>
                    Cigarette License Expiration Date
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      {...register("RJR_Descriptor")}
                    />
                  ) : (
                    <Typography fontSize={13}>{data.RJR_Descriptor}</Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>Other License 1</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("PO_ShipTo1")}
                    />
                  ) : (
                    <Typography fontSize={13}>
                      {data.PO_ShipTo1 || "-"}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>
                    Other License 1 Expiration Date
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      {...register("PO_ShipTo2")}
                    />
                  ) : (
                    <Typography fontSize={13}>
                      {data.PO_ShipTo2 || "-"}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>
                    Driver's License Expiration Date
                  </Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      {...register("D_Zip")}
                    />
                  ) : (
                    <Typography fontSize={13}>{data.D_Zip}</Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={14}>EIN Number</Typography>
                  {editMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      {...register("ClientID")}
                    />
                  ) : (
                    <Typography fontSize={13}>{data.ClientID}</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )} */}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminProfile;
