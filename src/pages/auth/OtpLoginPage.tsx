import React, { useState, useEffect } from "react";
import { Box, Typography, Link as MuiLink, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithOtpThunk } from "../../redux/thunks/authThunks";
import { selectAuth, clearError } from "../../redux/slices/authSlice";
import { useAppDispatch } from "../../redux/store";
import logo from "../../assets/Vector.svg";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import TextInput from "../../component/atoms/TextInput";
import PrimaryLink from "../../component/atoms/PrimaryLink";
import CustomButton from "../../component/atoms/CustomButton";
import Carousel from "../../component/atoms/Carousel";
import { useLocation } from "react-router-dom";
import PersonIcon from "../../assets/icons/user_1.svg";
import CommonModal from "../../component/atoms/CommonModal";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";
import { clearSalesCart } from "../../redux/slices/salesCartSlice";
import { clearDashboardData } from "../../redux/slices/dashboardSlice";
import { clearSalesDashboardData } from "../../redux/slices/salesDashboardSlice";

const schema = z.object({
  email_phone: z
    .string()
    .min(1, "Email is required")
    .refine(
      (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,15}$/;
        return emailRegex.test(value) || phoneRegex.test(value);
      },
      { message: "Must be a valid email" }
    ),
});

type OtpForm = z.infer<typeof schema>;

const slides = [
  {
    image: img1,
    title: "Place Your Order!",
    subtitle:
      "No more hassle of calling to place orders. Order directly through the app in just a few taps.",
  },
  {
    image: img2,
    title: "Track Your Delivery",
    subtitle: "Real-time updates from the kitchen to your doorstep.",
  },
  {
    image: img1,
    title: "Place Your Order!",
    subtitle:
      "No more hassle of calling to place orders. Order directly through the app in just a few taps.",
  },
];

const OtpLoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, otpSent } = useSelector(selectAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpForm>({
    resolver: zodResolver(schema),
  });
  const [ageConfirmModal, setAgeConfirmModal] = useState(true);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

  useEffect(() => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearSalesCart());
    dispatch(clearDashboardData());
    dispatch(clearSalesDashboardData());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (otpSent) {
      navigate("/otp-verification");
    }
  }, [otpSent, navigate]);

  const handleAgeConfirm = () => {
    setAgeConfirmModal(false);
    setIsAgeConfirmed(true);
  };

  const onSubmit = (data: OtpForm) => {
    if (!isAgeConfirmed) {
      toast.error("You must confirm your age before logging in.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(data.email_phone);

    dispatch(loginWithOtpThunk({
      email_phone: data.email_phone,
      isEmail,
    }));
  };

  const location = useLocation();
  const isUpdate = location.state?.isUpdate === true;
  return (
    <Box
      display="flex"
      height="100vh"
      flexDirection={{ xs: "column", md: "row" }}
    >
      {/* Left - OTP Form */}
      <Box
        flex={1}
        bgcolor="#fff"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        px={{ xs: 2, sm: 4 }}
        py={4}
        height="100vh"
        overflow={"auto"}
      >
        {/* Logo Top Left */}
        <Box display="flex" alignItems="center" gap={2} justifyContent="space-between">
          <img src={logo} alt="Woopsa" style={{ height: 32 }} onClick={() => navigate("/")}/>
          <PrimaryLink to="/">
            Go to Home
          </PrimaryLink>
        </Box>

        {/* Form Centered */}
        <Box
          display="flex"
          justifyContent={{ xs: "center", md: "start" }}
          flex={1}
          paddingLeft={{ md: 0, lg: "75px" }}
          alignItems="center"
        >
          <Box width="100%" maxWidth="450px">
            <Typography fontSize={22} fontWeight={600} color="#2a2a2a" mb={2.5}>
              Sign in with Woopsa
            </Typography>
            {/* <Typography
              mb={2}
              sx={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontSize: "12px",
                color: "#848484",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              {isUpdate
                ? "Change your email or phone number. We'll send a new OTP to verify your identity."
                : "Enter your registered email or phone number. We'll send you a one-time password (OTP) to verify your identity."}
            </Typography> */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextInput
                label={
                  isUpdate
                    ? "Change Email"
                    : "Email"
                }
                placeholder={
                  isUpdate
                    ? "Change your Email"
                    : "Enter your Email"
                }
                icon={
                  <img
                    src={PersonIcon}
                    alt="user"
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                }
                error={!!errors.email_phone}
                helperText={errors.email_phone?.message}
                {...register("email_phone")}
              />

              <CustomButton appearance="filled" loading={loading} type="submit" sx={{ mt: 3 }}>
                Sign in
              </CustomButton>
<Box display="flex" justifyContent="space-between" alignItems="center" mt={2.5} gap={2}>
              <Typography textAlign="center" fontSize="14px">
                <span style={{ color: "#2a2a2a", fontSize: "14px" }}>
                  Don't have an account?{" "}
                </span>
                <PrimaryLink
                  to="/signup"
                  sx={{ fontSize: "14px", color: "primary.main" }}
                >
                  Sign up
                </PrimaryLink>
              </Typography>
              
              <PrimaryLink to="/sales-login" sx={{ fontSize: "14px", color: "primary.main" }}>
                Sales Login
              </PrimaryLink>
              </Box>
            </form>
          </Box>
        </Box>

        {/* Footer */}
        <Typography
          textAlign={{ xs: "center", md: "start" }}
          paddingLeft={{ md: 0, lg: "75px" }}
          mt={1}
          fontSize="14px"
          color="#1C1C1C"
        >
          Stuck? Don’t worry, we’ve got your back (
          <MuiLink
            href="mailto:support@woopsamarketplace.com"
            sx={{
              color: "primary.main",
              fontWeight: 400,
              textDecoration: "none",
              fontSize: "14px",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            support@woopsamarketplace.com
          </MuiLink>
          )
        </Typography>
      </Box>

      {/* Right - Carousel */}
      <Carousel slides={slides} />
      <CommonModal
        open={ageConfirmModal}
        onClose={() => {}}
        size="sm"
        isCloseIcon={false}
      >
        <Stack
          spacing={{ xs: 2, sm: 3 }}
          alignItems="center"
          textAlign="center"
          sx={{
            width: "100%",
            maxWidth: "100%",
            px: 1,
          }}
        >
          <Box
            component="img"
            src={logo} // or CDTLogo if you use another logo
            alt="Woopsa Logo"
            sx={{
              width: { xs: 140, sm: 150 },
              height: "auto",
            }}
          />
          <Typography
            fontSize={{ xs: "12px", sm: "14px" }}
            color={"#7c7c7c"}
            sx={{ px: 1 }}
          >
            You must be 21 years old to access this application. Please verify
            your age.
          </Typography>
        </Stack>

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
          gap={2}
        >
          <CustomButton
            appearance="filled"
            onClick={handleAgeConfirm}
            fullWidth={false}
          >
            I am Over 21
          </CustomButton>

          <CustomButton
            appearance="outlined"
            onClick={() => {
              setAgeConfirmModal(false);
              toast.error("You must be over 21 to access this application.");
            }}
            fullWidth={false}
          >
            Cancel
          </CustomButton>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default OtpLoginPage;
