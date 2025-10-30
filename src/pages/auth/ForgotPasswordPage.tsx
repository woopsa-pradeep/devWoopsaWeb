import React, { useState } from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import logo from "../../assets/Vector.svg";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import PersonIcon from "../../assets/icons/user_1.svg";
import TextInput from "../../component/atoms/TextInput";
import PrimaryLink from "../../component/atoms/PrimaryLink";
import CustomButton from "../../component/atoms/CustomButton";
import Carousel from "../../component/atoms/Carousel";
import { forgotPassword } from "../../redux/apis/authAPIs";
import { useNavigate } from "react-router-dom";

// ✅ Email only schema
const schema = z.object({
  email: z
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

type ForgotPasswordForm = z.infer<typeof schema>;

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

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      const response = await forgotPassword(data) as any;
      if(response.success) {
        toast.success(response.message);
        // navigate("/reset-password");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      height="100vh"
      flexDirection={{ xs: "column", md: "row" }}
    >
      {/* Left - Form Section */}
      <Box
        flex={1}
        bgcolor="#fff"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        px={{ xs: 2, sm: 4 }}
        py={4}
        height="100vh"
        overflow="auto"
      >
        {/* Logo */}
        <Box display="flex" alignItems="center" gap={2} justifyContent="space-between">
          <img src={logo} alt="Woopsa" style={{ height: 32 }} onClick={() => navigate("/")}/>
          <PrimaryLink to="/">
            Go to Home
          </PrimaryLink>
        </Box>

        {/* Centered Form */}
        <Box
          display="flex"
          justifyContent={{ xs: "center", md: "start" }}
          flex={1}
          paddingLeft={{ md: 0, lg: "75px" }}
          alignItems="center"
        >
          <Box width="100%" maxWidth="450px">
            <Typography fontSize={22} fontWeight={600} color="#2a2a2a" mb={2.5}>
              Forgot Password
            </Typography>

            <Typography
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
              Enter your registered email address. We’ll send you a link to
              reset your password.
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextInput
                label="Email"
                placeholder="Enter your Email"
                icon={
                  <img
                    src={PersonIcon}
                    alt="user"
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                }
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register("email")}
              />

              <CustomButton appearance="filled" type="submit" sx={{ mt: 3 }} loading={isLoading}>
                Send Reset Link
              </CustomButton>

              <Typography textAlign="center" mt={2.5} fontSize="14px">
                <span style={{ color: "#2a2a2a" }}>
                  Remembered your password?{" "}
                </span>
                <PrimaryLink
                  to="/login"
                  sx={{ fontSize: "14px", color: "primary.main" }}
                >
                  Back to Login
                </PrimaryLink>
              </Typography>
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

export default ForgotPasswordPage;
