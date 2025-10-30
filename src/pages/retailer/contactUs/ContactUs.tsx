// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";
import { Grid, Paper, Typography, Box, Avatar } from "@mui/material";
import { useSelector } from "react-redux";

const ContactUs = () => {
  const user  = useSelector((state: any) => state.auth);
  const wareHouseDetail = user.wareHouseDetail;
  return (
    <Box sx={{ p: "0px 20px", bgcolor: "background.default" }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 400, mb: 2, color: "text.primary" }}
      >
        Contact Us
      </Typography>

      <Grid container spacing={2}>
        {/* Company Details Card */}
       
        {/* Warehouse Card */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={1}
            sx={{
              borderRadius: 3,
              p: 2.5,
              height: "100%",
              bgcolor: "background.paper",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{ fontSize: "16px", fontWeight: 400, mb: 2, color: "text.primary" }}
            >
              Our Warehouse
            </Typography>

            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
            >
              {wareHouseDetail[0].D_Logo ? (
              <Box
                component="img"
                src={wareHouseDetail[0].D_Logo}
                alt="CDT Logo"
                sx={{
                  width: 50,
                  height: 50,
                  objectFit: "contain",
                  borderRadius: "50%",
                  border: "1px solid #E0E0E0",
                  padding: "2px",
                }}
              />) : (
                <Avatar 
                  sx={{
                    width: 50,
                    height: 50,
                    border: "1px solid #E0E0E0",
                    padding: "2px",
                    backgroundColor: "primary.main",
                  }}
                />
              )}
              <Typography color="text.primary" fontWeight={500} fontSize={14}>
                {wareHouseDetail[0].D_Name}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Typography fontSize={"13px"}  color="text.secondary">
                  Phone
                </Typography>
                <Typography
                  fontSize={"13px"}
                  color="primary.main"
                  sx={{ wordBreak: "break-word" }}
                >
                  {wareHouseDetail[0].D_Phone || "-"} 
                </Typography>
              </Grid>
              {/* <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Typography fontSize={"13px"}  color="text.secondary">
                  Connect on WhatsApp
                </Typography>
                <Typography
                  fontSize={"13px"}
                  color="text.primary"
                  sx={{ wordBreak: "break-word", mb: 1 }}
                >
                  8643431510
                </Typography>
              </Grid> */}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Typography fontSize={"13px"}  color="text.secondary">
                  Email Address
                </Typography>
                {wareHouseDetail[0].D_Email ? (
                  <Typography
                    component="a" 
                    href={`mailto:${wareHouseDetail[0].D_Email}`}
                    fontSize={"13px"}
                    color="primary.main"
                    sx={{ 
                      wordBreak: "break-word",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline"
                      }
                    }}
                  >
                    {wareHouseDetail[0].D_Email}
                  </Typography>
                ) : (
                  <Typography
                    fontSize={"13px"}
                    color="primary.main"
                    sx={{ wordBreak: "break-word" }}
                  >
                    -
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Typography fontSize={"13px"}  color="text.secondary">
                  Visit our Location
                </Typography>
                <Typography
                  fontSize={"13px"}
                  color="text.primary"
                  sx={{ wordBreak: "break-word" }}
                >
                  {`${wareHouseDetail[0].D_Addr1}, ${wareHouseDetail[0].D_City}, ${wareHouseDetail[0].D_State}` || "-"} 
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3  }}>
                <Typography fontSize={"13px"}  color="text.secondary">
                  Technical Support Email
                </Typography>
                <Typography
                  component="a" 
                  href={`mailto:support@woopsamarketplace.com`} 
                  fontSize={"13px"}
                  color="primary.main"
                  sx={{ wordBreak: "break-word",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline"
                    }
                  }}
                >
                  support@woopsamarketplace.com
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactUs;
