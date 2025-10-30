// src/components/dashboard/DashboardCard.tsx
import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
} from "@mui/icons-material";

interface DashboardCardProps {
  title: string;
  value: string;
  change?: string;
  color?: "success" | "error" | "warning";
  icon?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  color,
  icon,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.mode === "light" ? "#E3E4EB" : "#444"}`,
        backgroundColor: theme.palette.background.paper,
        borderRadius: "10px",
        padding: "20px",
        height: "auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "10px",
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box
          sx={{
            padding: 1,
            backgroundColor:
              theme.palette.mode === "light" ? "#F5F7FB" : "#333",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Typography fontSize={16} color="text.secondary">
          {title}
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between" gap={"10px"}>
        <Typography
          fontSize={18}
          fontWeight={500}
          color={theme.palette.text.primary}
        >
          {value}
        </Typography>
        {change && (
          <Typography
            fontSize={13}
            color={
              color === "success"
                ? "green"
                : color === "error"
                  ? "red"
                  : theme.palette.warning.main
            }
            display={"flex"}
            alignItems={"center"}
            fontWeight={400}
            gap={"5px"}
          >
            {change}
            <span style={{display: "flex", alignItems: "center"}}>
              {color === "success" ? (
                <ArrowUpwardOutlined
                  fontWeight={400}
                  sx={{ width: "13px", height: "13px" }}
                />
              ) : (
                <ArrowDownwardOutlined
                  fontWeight={400}
                  sx={{ width: "13px", height: "13px" }}
                />
              )}
            </span>
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DashboardCard;
