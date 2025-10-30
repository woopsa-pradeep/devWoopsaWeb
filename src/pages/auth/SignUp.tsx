import React from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signupThunk } from "../../redux/thunks/authThunks";
import { selectAuth } from "../../redux/slices/authSlice";
import { useAppDispatch } from "../../redux/store";
import logo from "../../assets/Vector.svg";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import TextInput from "../../component/atoms/TextInput";
import CustomButton from "../../component/atoms/CustomButton";
import Carousel from "../../component/atoms/Carousel";
import PersonIcon from "../../assets/icons/user_1.svg";
import PrimaryLink from "../../component/atoms/PrimaryLink";

const schema = z.object({
  account_number: z
    .string()
    .regex(/^\d+$/, "Account Number must be a number")
    .min(1, "Account Number is Required")
});

type SignUpForm = z.infer<typeof schema>;

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

const SignUpPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(selectAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(schema),
  });

//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearError());
//     }
//   }, [error, dispatch]);

    const onSubmit = async (data: SignUpForm) => {
    try {
      const response = await dispatch(signupThunk({
        account_number: data.account_number,
      }));
      
      
      // Check if the response was successful (not rejected)
      if (response.meta.requestStatus === 'fulfilled') {
        // The signup was successful, navigate to OTP page
        toast.success('OTP sent successfully!');
        
        // Navigate to OTP page
        setTimeout(() => {
          navigate("/signupOtp");
        }, 100);
      } else {
        // Handle error response properly
        const errorMessage = response?.payload || 'Sign up failed. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      // Handle error properly - convert to string if it's an object
      const errorMessage = typeof error === 'object' && error !== null 
        ? error.message || JSON.stringify(error) || 'An error occurred. Please try again.'
        : error || 'An error occurred. Please try again.';
      toast.error(errorMessage);
    }
  };

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
              Sign up with Woopsa
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
                    "Account Number"
                }
                placeholder={
                  "Enter your Account Number"
                }
                icon={
                  <img
                    src={PersonIcon}
                    alt="user"
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                }
                error={!!errors.account_number}
                helperText={errors.account_number?.message}
                {...register("account_number")}
              />

              <CustomButton appearance="filled" loading={loading} type="submit" sx={{ mt: 3 }}>
                Sign up
              </CustomButton>

              <Typography textAlign="center" mt={2.5} fontSize="14px">
                <span style={{ color: "#2a2a2a", fontSize: "14px" }}>
                   Already have an account?{" "}
                </span>
                <PrimaryLink
                  to="/"
                  sx={{ fontSize: "14px", color: "primary.main" }}
                >
                  Sign In
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

export default SignUpPage;
