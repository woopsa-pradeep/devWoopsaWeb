// OTPVerification.tsx
import React, { useEffect } from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  verifyOtpThunk,
} from "../../redux/thunks/authThunks";
import { selectAuth, clearError } from "../../redux/slices/authSlice";
import { useAppDispatch } from "../../redux/store";
import toast from "react-hot-toast";
import CustomButton from "../../component/atoms/CustomButton";
import PrimaryLink from "../../component/atoms/PrimaryLink";
import logo from "../../assets/Vector.svg";
import Carousel from "../../component/atoms/Carousel";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import OTPInputBoxes from "../../component/atoms/OTPInputBoxes";
import { useRoleBasedAccess } from "../../hooks/useRoleBasedAccess";
import { resendOtp } from "../../redux/apis/authAPIs";

const otpSchema = z.object({
  otp: z.string().min(4, "OTP must be 4 digits").max(4, "OTP must be 4 digits"),
});

type OTPForm = z.infer<typeof otpSchema>;

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
];

const OTPVerification = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, emailPhone, isAuthenticated } =
    useSelector(selectAuth);
  const { redirectToDashboard } = useRoleBasedAccess();
  
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [canResend, setCanResend] = React.useState(true);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      redirectToDashboard();
    }
  }, [isAuthenticated, redirectToDashboard]);

  useEffect(() => {
    if (!emailPhone) {
      navigate("/login");
    }
  }, [emailPhone, navigate]);

  // Timer effect for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendTimer]);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OTPForm) => {
    if (!emailPhone) {
      toast.error("Email/Phone not found. Please login again.");
      navigate("/login");
      return;
    }

    const response = await dispatch(
      verifyOtpThunk({
        email_phone: emailPhone,
        otp: data.otp,
      })
    );
    console.log("response", response);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      if (!emailPhone) {
        toast.error("Email/Phone not found. Please login again.");
        navigate("/login");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(emailPhone);

      const response: any = await resendOtp({
        email_phone: emailPhone,
        isEmail,
      });
      if (response.success) {
        toast.success("OTP sent successfully");
        // Start 1 minute timer
        setResendTimer(60);
        setCanResend(false);
      } else {
        toast.error("Failed to send OTP");
      }
    } catch (error: any) {
      console.log("error", error);
      toast.error('something went wrong ,try to login with password or contact support!');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignInWithPassword = () => {
    navigate("/loginPassword");
  };

  return (
    <Box
      display="flex"
      height="100vh"
      flexDirection={{ xs: "column", md: "row" }}
    >
      {/* Left Section */}
      <Box
        flex={1}
        bgcolor="#fff"
        display="flex"
        flexDirection="column"
        justifyContent={{ xs: "center", md: "start" }}
        px={{ xs: 2, sm: 4 }}
        py={4}
        height="100vh"
        overflow={"auto"}
      >
        {/* Logo */}
        <Box display="flex" alignItems="center" gap={2} justifyContent="space-between">
          <img src={logo} alt="Woopsa" style={{ height: 32 }} onClick={() => navigate("/")}/>
          <PrimaryLink to="/">
            Go to Home
          </PrimaryLink>
        </Box>

        {/* OTP Form */}
        <Box
          display="flex"
          justifyContent={{ xs: "center", md: "start" }}
          flex={1}
          paddingLeft={{ md: 0, lg: "75px" }}
          alignItems="center"
        >
          <Box width="100%" maxWidth="450px">
            <Typography fontSize={22} fontWeight={600} color="#2a2a2a" mb={2.5}>
              Verify your Account
            </Typography>
            <Typography fontSize={18} fontWeight={400} color="#2a2a2a" mb={2.5}>
              Enter the 4-digit code{" "}
            </Typography>
            <Typography
              mb={1.5}
              sx={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontSize: "12px",
                color: "#848484",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              We have sent a four-digit One Time Password on your registered
              Email{" "}
              <Box component="span" sx={{ fontWeight: 700, display: "inline" }}>
                {emailPhone ? `${emailPhone.split('@')[0].slice(0, 2)}${'X'.repeat(emailPhone.split('@')[0].length - 2)}@${emailPhone.split('@')[1]}` : ''}
              </Box>
              , Please enter the code and verify.
            </Typography>

            <PrimaryLink to="/login" state={{ isUpdate: true }}>
              Change email ?
            </PrimaryLink>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <OTPInputBoxes
                length={4}
                onChange={(value) => setValue("otp", value)} // this will sync with form
              />
              <input type="hidden" {...register("otp")} />
              {errors.otp && (
                <Typography fontSize="12px" color="red" mt={1}>
                  {errors.otp.message}
                </Typography>
              )}

              <CustomButton
                appearance="filled"
                loading={loading}
                type="submit"
                sx={{ marginTop: "30px" }}
              >
                Verify
              </CustomButton>
              <Box mt={1.7} display="flex" justifyContent="space-between">
                <Typography fontSize="12px" color="#4f4f4f">
                  Didn't get any code yet?{" "}
                  {canResend ? (
                    <MuiLink
                      component="button"
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      sx={{
                        border: "none",
                        background: "none",
                        cursor: resendLoading ? "not-allowed" : "pointer",
                        color: resendLoading ? "#ccc" : "primary.main",
                        "&:hover": { textDecoration: resendLoading ? "none" : "underline" },
                      }}
                    >
                      {resendLoading ? "Sending..." : "Resend code"}
                    </MuiLink>
                  ) : (
                    <span style={{ color: "#ccc" }}>
                      Resend code in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </Typography>

                <Typography fontSize="12px" color="#4f4f4f">
                  Sign In with{" "}
                  <MuiLink
                    component="button"
                    type="button"
                    onClick={handleSignInWithPassword}
                    sx={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "primary.main",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Password
                  </MuiLink>
                </Typography>
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
    </Box>
  );
};

export default OTPVerification;
