import React, { useState } from "react";
import { Box, Typography, Link as MuiLink, Stack } from "@mui/material";
import PersonIcon from "../../assets/icons/user_1.svg";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../redux/store";
// import { selectAuth } from "../../redux/slices/authSlice";
import { loginUser } from "../../redux/thunks/authThunks";
import toast from "react-hot-toast";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import logo from "../../assets/Vector.svg";
import TextInput from "../../component/atoms/TextInput";
import PrimaryLink from "../../component/atoms/PrimaryLink";
import CustomButton from "../../component/atoms/CustomButton";
import Carousel from "../../component/atoms/Carousel";
import { useNavigate } from "react-router-dom";
import CommonModal from "../../component/atoms/CommonModal";
import { RootState } from "../../redux/store";

const emailOrPhoneSchema = z
  .string()
  .min(1, "Required")
  .refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/; // Customize phone pattern based on country
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    {
      message: "Must be a valid email or phone number",
    }
  );

const schema = z.object({
  email_phone: emailOrPhoneSchema,
  password: z.string().min(6, "Minimum 6 characters"),
});

type LoginForm = z.infer<typeof schema>;

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

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [ageConfirmModal, setAgeConfirmModal] = useState(true);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const {role} = useSelector((state: RootState) => state.auth);
  const handleAgeConfirm = () => {
    setAgeConfirmModal(false);
    setIsAgeConfirmed(true);
  };
  // const { loading } = useSelector(selectAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    if (!isAgeConfirmed) {
      toast.error("You must confirm your age before logging in.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isEmail = emailRegex.test(data.email_phone);

    const payload = {
      ...data,
      isEmail,
    };
    
    try {
      await dispatch(loginUser(payload)).unwrap();
      toast.success("Login successful!");
      navigate(`/${role}/dashboard`);
    } catch (error: any) {
      toast.error(error || "Login failed");
    }
  };

  // Only the JSX return part has significant changes
  return (
    <>
      <Box
        display="flex"
        height="100vh"
        flexDirection={{ xs: "column", md: "row" }}
      >
        {/* Left - Login Form */}
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
              <Typography
                fontSize={22}
                fontWeight={600}
                color="#2a2a2a"
                mb={2.5}
              >
                Sign In to Woopsa
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
                  error={!!errors.email_phone}
                  helperText={errors.email_phone?.message}
                  {...register("email_phone")}
                />
                <TextInput
                  type="password"
                  label="Password"
                  placeholder="Enter your Password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register("password")}
                />

                {/* Links */}
                <Box display="flex" justifyContent="space-between" mt={-1}>
                  <PrimaryLink to="/forgot-password">
                    Forgot Password ?
                  </PrimaryLink>
                  <PrimaryLink to="/">Or Login with OTP</PrimaryLink>
                </Box>

                {/* Submit Button */}
                <CustomButton
                  appearance="filled"
                  loading={false}
                  type="submit"
                  sx={{ marginTop: "30px" }}
                >
                  Sign In
                </CustomButton>
                {/* Signup Link */}
                <Typography textAlign="center" mt={2.5} fontSize="14px">
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

        {/* Right - Image Carousel (unchanged) */}
        <Carousel slides={slides} />
      </Box>
      <CommonModal
        open={ageConfirmModal}
        onClose={() => {}}
        size="sm"
        isCloseIcon={false}
      >
        <Stack
          spacing={3}
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
            alt="CDT Logo"
            sx={{
              width: { xs: 120, sm: 150 },
              height: "auto",
            }}
          />
          <Typography fontSize={"14px"} color={"#7c7c7c"} sx={{ px: 1 }}>
            You must be 21 years old to access this application. Please verify
            your age.
          </Typography>
        </Stack>

        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="center"
          alignItems="center"
          width="100%"
          gap={2}
        >
          <CustomButton
           appearance="filled"
            onClick={handleAgeConfirm}
            sx={{ py: "6px", px: 3, fontWeight: 300 }}
            fullWidth={false}
          >
            I am Over 21
          </CustomButton>

          <CustomButton
            appearance="outlined"
            onClick={() => {
              setAgeConfirmModal(false)
              toast.error("You must be over 21 to access this application.");
            }}
            sx={{ py: "6px", px: 3 }}
            fullWidth={false}
          >
            Cancel
          </CustomButton>
        </Box>
      </CommonModal>
    </>
  );
};

export default LoginPage;
