// OTPVerification.tsx
import React, { useState } from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import { loginWithOtpThunk } from "../../redux/thunks/authThunks";
import { selectAuth } from "../../redux/slices/authSlice";
// import { useAppDispatch } from "../../redux/store";
import toast from "react-hot-toast";
import CustomButton from "../../component/atoms/CustomButton";
import logo from "../../assets/Vector.svg";
import Carousel from "../../component/atoms/Carousel";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import OTPInputBoxes from "../../component/atoms/OTPInputBoxes";
import { verifyRetailerOtp } from "../../redux/apis/authAPIs";
import Lottie from "lottie-react";
import animationData from "../../assets/gifs/Animation - 1750941933596.json";
import CommonModal from "../../component/atoms/CommonModal";
import PrimaryLink from "../../component/atoms/PrimaryLink";

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

const SignupOtp = () => {
  // const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, signUpData } = useSelector(selectAuth);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Redirect if no signup data is available
  React.useEffect(() => {
    if (!signUpData && !loading) {
      toast.error("Please complete the signup process first.");
      navigate("/signup");
    }
  }, [signUpData, loading, navigate]);

  // Show loading or redirect if no data
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!signUpData) {
    return null; // Will redirect via useEffect
  }

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OTPForm) => {
    const response = await verifyRetailerOtp({
      email_phone: signUpData?.email,
      account_number: signUpData?.c_number,
      otp: data.otp,
    }) as any;
    if(response?.success){
      toast.success(response?.message);
      setShowSuccessModal(true);
      // Show modal for 5 seconds then redirect
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/login");
      }, 5000);
    } else {
      toast.error(response?.message);
    }
  };

  // const handleResendOtp = () => {
  //   if (!signUpData?.email) {
  //     toast.error("Email/Phone not found. Please login again.");
  //     navigate("/login");
  //     return;
  //   }

  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   const isEmail = emailRegex.test(signUpData?.email);
  //   console.log(signUpData,"isEmail", isEmail);

  //   dispatch(loginWithOtpThunk({
  //     email_phone: signUpData?.email,
  //     isEmail,
  //   }));
  // };

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
            {signUpData?.email && <Typography
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
              We have sent a four-digit One Time Password on your registered Email{" "}
              
              <Box component="span" sx={{ fontWeight: 700, display: "inline" }}>
                {signUpData?.email?.split('@')[0].slice(0, 2) + 'X'.repeat(signUpData?.email?.split('@')[0].length - 2) + '@' + signUpData?.email?.split('@')[1]}      
              </Box>
              , Please enter the code and verify.
            </Typography>}
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
                disabled={loading}
              >
                Verify
              </CustomButton>
              {/* <Box mt={1.7}>
                <Typography fontSize="12px" color="#4f4f4f">
                  Didn't get any code yet?{" "}
                  <MuiLink 
                    component="button" 
                    onClick={handleResendOtp}
                    sx={{ 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Resend code
                  </MuiLink>
                </Typography>
              </Box> */}
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

      {/* Success Modal */}
      <CommonModal
        open={showSuccessModal}
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-description"
        onClose={() => setShowSuccessModal(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 400,
            textAlign: 'center',
            outline: 'none',
          }}
        >
          {/* Lottie Animation */}
          <Box sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}>
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>

          {/* Success Message */}
          <Typography
            id="success-modal-title"
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              mb: 2,
            }}
          >
            You're Almost There!
          </Typography>

          <Typography
            id="success-modal-description"
            sx={{
              color: '#666',
              fontSize: '14px',
              lineHeight: 1.5,
              mb: 3,
            }}
          >
            We have received your request for account creation, we will share the credentials at your registered email address soon!
          </Typography>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default SignupOtp;                             

