import React from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import logo from "../../assets/Vector.svg";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import TextInput from "../../component/atoms/TextInput";
import CustomButton from "../../component/atoms/CustomButton";
import Carousel from "../../component/atoms/Carousel";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../redux/apis/authAPIs";
import PrimaryLink from "../../component/atoms/PrimaryLink";

const schema = z
  .object({
    password: z.string().min(6, "Minimum 6 characters"),
    confirm_password: z.string().min(6, "Minimum 6 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ResetForm = z.infer<typeof schema>;

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

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const token = useLocation().search.split("token=")[1];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetForm) => {
    try {
      const response = await resetPassword({token: String(token), newPassword: data.password}) as any;
          if(response.success) {
            toast.success(response.message);
            navigate("/login");
          } else {
            toast.error(response.response.data.message);
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Something went wrong");
        }
  };

  return (
    <Box
      display="flex"
      height="100vh"
      flexDirection={{ xs: "column", md: "row" }}
    >
      {/* Left - Reset Password Form */}
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

        {/* Form */}
        <Box
          display="flex"
          justifyContent={{ xs: "center", md: "start" }}
          flex={1}
          paddingLeft={{ md: 0, lg: "75px" }}
          alignItems="center"
        >
          <Box width="100%" maxWidth="450px">
            <Typography fontSize={22} fontWeight={600} color="#2a2a2a" mb={2.5}>
              Reset Your Password
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
              Create a new password for your account.
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextInput
                type="password"
                label="New Password"
                placeholder="Enter new password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register("password")}
              />

              <TextInput
                type="password"
                label="Confirm Password"
                placeholder="Re-enter new password"
                error={!!errors.confirm_password}
                helperText={errors.confirm_password?.message}
                {...register("confirm_password")}
              />

              <CustomButton appearance="filled" type="submit" sx={{ mt: 3 }}>
                Reset Password
              </CustomButton>
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

export default ResetPasswordPage;
