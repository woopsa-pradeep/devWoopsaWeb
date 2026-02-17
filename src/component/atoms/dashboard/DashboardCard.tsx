import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
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
  const isDark = theme.palette.mode === "dark";

  const primary = theme.palette.primary.main;
  const iconGradient = `linear-gradient(135deg, ${primary}, ${alpha(primary, 0.8)})`;
  const blobBg = alpha(primary, isDark ? 0.06 : 0.04);

  const cardBg = isDark
    ? alpha(theme.palette.background.paper, 0.7)
    : theme.palette.background.paper;
  const cardBorder = isDark ? alpha(theme.palette.divider, 0.4) : "transparent";

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        backgroundColor: cardBg,
        border: isDark ? `1px solid ${cardBorder}` : "none",
        padding: 1.5,
        height: "100%",
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.2s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? `0 12px 28px ${alpha(theme.palette.common.black, 0.4)}, 0 0 0 1px ${alpha(primary, 0.25)}`
            : `0 12px 24px ${alpha(primary, 0.15)}, 0 0 0 1px ${alpha(primary, 0.1)}`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: -24,
          right: -24,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: blobBg,
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -16,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: alpha(primary, isDark ? 0.08 : 0.03),
          pointerEvents: "none",
        },
      }}
    >
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography
            fontSize={11}
            fontWeight={500}
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: 0.9,
            }}
          >
            {title}
          </Typography>
          <Typography
            fontSize={22}
            fontWeight={500}
            color="text.primary"
            sx={{
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {change && (
            <Box
              display="inline-flex"
              alignItems="center"
              gap={0.25}
              sx={{
                alignSelf: "flex-start",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: alpha(primary, 0.1),
              }}
            >
              {color === "success" ? (
                <ArrowUpwardOutlined sx={{ width: 12, height: 12, color: primary }} />
              ) : (
                <ArrowDownwardOutlined sx={{ width: 12, height: 12, color: primary }} />
              )}
              <Typography fontSize={10} fontWeight={500} color={primary}>
                {change}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            position: "relative",
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            borderRadius: "50%",
            background: iconGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(primary, 0.3)}`,
            "& > *": {
              color: "#fff !important",
              fontSize: 18,
            },
            "& img": {
              filter: "brightness(0) invert(1)",
              width: 18,
              height: 18,
            },
          }}
        >
          {icon}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardCard;
