import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { keyframes } from "@emotion/react";

const popIn = keyframes`
  0% {
    transform: scale(1);
    background-color: rgba(255, 255, 255, 0.5);
  }
  50% {
    transform: scale(1.5);
    background-color: #fff;
  }
  100% {
    transform: scale(1.2);
    background-color: #fff;
  }
`;

interface CarouselItem {
  image: string;
  title?: string;
  subtitle?: string;
  illustration?: string;
}

interface CarouselProps {
  slides: CarouselItem[];
  interval?: number;
  pauseOnHover?: boolean; // <- New prop
}

const Carousel: React.FC<CarouselProps> = ({
  slides,
  interval = 4000,
  pauseOnHover = false, // <- Default false
}) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [slides.length, interval, paused]);

  const handleDotClick = (index: number) => {
    setCurrent(index);
  };

  return (
    <Box
      flex={1}
      position="relative"
      display={{ xs: "none", md: "block" }}
      overflow="hidden"
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
      sx={{
        backgroundColor: theme.palette.primary.main,
        height: "100%",
      }}
    >
      {slides.map((slide, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            opacity: index === current ? 1 : 0,
            transition: "opacity 1s ease-in-out",
            zIndex: index === current ? 1 : 0,
            px: 2,
          }}
        >
          {slide.illustration && (
            <Box
              component="img"
              src={slide.illustration}
              alt={`illustration-${index}`}
              sx={{
                width: "100%",
                maxWidth: 300,
                mb: 2,
              }}
            />
          )}

          <Typography
            fontSize={24}
            fontWeight={600}
            color="#fff"
            marginBottom={"20px"}
          >
            {slide.title}
          </Typography>
          <Typography
            fontSize={14}
            sx={{ mb: "24px", color: "#fff", maxWidth: 400 }}
          >
            {slide.subtitle}
          </Typography>

          <Box
            component="img"
            src={slide.image}
            alt={`slide-${index}`}
            sx={{
              width: "100%",
              maxWidth: 400,
              objectFit: "contain",
              height: "auto",
            }}
          />
        </Box>
      ))}

      {/* Dots */}
      <Box
        position="absolute"
        bottom={20}
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={2}
      >
        {slides.map((_, index) => (
          <Box
            key={index}
            onClick={() => handleDotClick(index)}
            sx={{
              width: index === current ? 30 : 12,
              height: 12,
              borderRadius: "999px",
              mx: 0.5,
              cursor: "pointer",
              border:
                index === current
                  ? `1px solid ${theme.palette.primary.dark}`
                  : "1px solid #fff",
              backgroundColor:
                index === current ? "#fff" : theme.palette.primary.dark,
              opacity: index === current ? 1 : 0.5,
              transform: index === current ? "scale(1.2)" : "scale(1)",
              transition: "all 0.4s ease",
              animation: index === current ? `${popIn} 0.6s ease` : "none",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Carousel;
