import React, { useState } from "react";
import { Box, Typography, Stack,Link as MuiLink } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import logo from "../../assets/Vector.svg";
import Carousel from "../../component/atoms/Carousel";
import TextInput from "../../component/atoms/TextInput";
import CustomButton from "../../component/atoms/CustomButton";
import img1 from "../../assets/authPic1.svg";
import img2 from "../../assets/authPic2.svg";
import CommonModal from "../../component/atoms/CommonModal"; // Adjust path accordingly
import CDTLogo from "../../assets/image__1_-removebg-preview 1.svg"; // Update path
// import { useNavigate } from "react-router-dom";
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';

const warehouseSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
});

type FormType = z.infer<typeof warehouseSchema>;

const slides = [
  {
    image: img1,
    title: "Place your Order !",
    subtitle:
      "No more hassle of calling to place orders. Order directly through the app in just a few taps.",
  },
  {
    image: img2,
    title: "Track Your Delivery",
    subtitle: "Real-time updates from the kitchen to your doorstep.",
  },
];

const WarehouseSelection = () => {
  const [openModal, setOpenModal] = useState(false);

  const { redirectToDashboard } = useRoleBasedAccess();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(warehouseSchema),
  });

  const onSubmit = () => {
    setOpenModal(true); // open modal after submission
  };

  const handleConfirm = () => {
    setOpenModal(false);
    redirectToDashboard();
  };

  return (
    <Box
      display="flex"
      height="100vh"
      flexDirection={{ xs: "column", md: "row" }}
    >
      {/* Left - Warehouse Form */}
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
        {/* Logo */}
        <Box>
          <img src={logo} alt="Woopsa" style={{ height: 32 }} />
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
              Select Your Warehouse
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextInput
                label="Warehouse ID"
                placeholder="Enter your Warehouse ID"
                error={!!errors.warehouseId}
                helperText={errors.warehouseId?.message}
                {...register("warehouseId")}
              />

              <CustomButton
                loading={false}
                type="submit"
                sx={{ marginTop: "30px" }}
              >
                Find Warehouse
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

      {/* confirmation Modal */}
      <CommonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        size="sm"
        isCloseIcon={false}
      >
        <Stack
          spacing={{xs:2, sm:3}}
          alignItems="center"
          textAlign="center"
          sx={{
            width: "100%",
            maxWidth: "100%", // Ensures it doesn't overflow
            px: 1, // Padding for smaller screens
          }}
        >
          <Box
            component="img"
            src={CDTLogo}
            alt="CDT Logo"
            sx={{
              width: { xs: 140, sm: 150 }, // ✅ Bigger logo on all screens
              height: "auto",
            }}
          />

          <Typography fontSize={{xs:"12px", sm:"14px"}} color={"#7c7c7c"} sx={{ px: 1 }}>
            Kindly verify if this is the warehouse you intend to select and
            confirm your choice.
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
            onClick={handleConfirm}
            fullWidth={false}
          >
            Confirm
          </CustomButton>

          <CustomButton
            appearance="outlined"
            onClick={() => setOpenModal(false)}
            fullWidth={false}
          >
            Cancel
          </CustomButton>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default WarehouseSelection;
