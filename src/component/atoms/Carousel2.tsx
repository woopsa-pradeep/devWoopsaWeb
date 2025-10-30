import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, useTheme, keyframes } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import image1 from "../../assets/authPic1.svg";
import image2 from "../../assets/authPic2.svg";
import PrimaryLink from "./PrimaryLink";

const mockImages = [
  {
    image: image1,
    alt: "Scorpio Banner 1",
  },
  {
    image: image2,
    alt: "Scorpio Banner 2",
  },
  {
    image: image1,
    alt: "Scorpio Banner 3",
  },
];

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

interface CarouselSectionProps {
  title?: string;
  hideNav?: boolean;
  swipeInterval?: number; // in milliseconds, e.g., 3000
  pauseOnHover?: boolean; // new prop
}

const Carousel2: React.FC<CarouselSectionProps> = ({
  title,
  hideNav,
  swipeInterval = 3000,
  pauseOnHover = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const theme = useTheme();

  // Autoplay with pause handling
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, swipeInterval);
    return () => clearInterval(interval);
  }, [currentIndex, swipeInterval, paused]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? mockImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === mockImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50) prevSlide();
    else if (deltaX < -50) nextSlide();
    touchStartX.current = null;
  };

  const handleMouseEnter = () => {
    if (pauseOnHover) setPaused(true);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) setPaused(false);
  };

  const getOffset = (index: number) => {
    const diff = index - currentIndex;
    if (diff === -1 || (currentIndex === 0 && index === mockImages.length - 1)) return -100;
    if (diff === 1 || (currentIndex === mockImages.length - 1 && index === 0)) return 100;
    if (diff === 0) return 0;
    return 9999; // hide all others
  };

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.mode === "light" ? "#E3E4EB" : "#444"}`,
        borderRadius: "10px",
        backgroundColor: theme.palette.background.paper,
        display: "flex",
        flexDirection: "column",
        pb: 2,
        gap: 1,
        width: "100%",
      }}
    >
      {title && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding={"10px 16px"}
          borderBottom={`1px solid ${theme.palette.mode === "light" ? "#E3E4EB" : "#444"}`}
        >
          <Typography fontSize={16} fontWeight={600}>
            {title}
          </Typography>
          <PrimaryLink to={""} sx={{ fontSize: "14px" }}>
            See All
          </PrimaryLink>
        </Box>
      )}

      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: "relative",
          height: 250,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {mockImages.map((item, idx) => {
          const translateX = getOffset(idx);
          const scale = translateX === 0 ? 1 : 0.9;
          const zIndex = translateX === 0 ? 2 : 1;
          const opacity = translateX === 9999 ? 0 : translateX === 0 ? 1 : 0.6;

          return (
            <Box
              key={idx}
              component="img"
              src={item.image}
              alt={item.alt}
              position="absolute"
              bgcolor={"primary.main"}
              sx={{
                width: "85%",
                height: 220,
                objectFit: "contain",
                transition: "all 0.5s ease",
                transform: `translateX(${translateX}%) scale(${scale})`,
                zIndex,
                opacity,
                borderRadius: 2,
              }}
            />
          );
        })}

        {!hideNav && (
          <>
            <IconButton
              onClick={prevSlide}
              sx={{
                position: "absolute",
                top: "50%",
                left: 8,
                transform: "translateY(-50%)",
                zIndex: 3,
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={nextSlide}
              sx={{
                position: "absolute",
                top: "50%",
                right: 8,
                transform: "translateY(-50%)",
                zIndex: 3,
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        )}
      </Box>

      {/* Clickable Dots */}
      <Box display="flex" justifyContent="center" mt={1}>
        {mockImages.map((_, index) => (
          <Box
            key={`dot-${index}`}
            onClick={() => goToSlide(index)}
            sx={{
              width: index === currentIndex ? 30 : 12,
              height: 12,
              borderRadius: "999px",
              mx: 0.5,
              border:
                index === currentIndex
                  ? `1px solid ${theme.palette.primary.main}`
                  : "1px solid #fff",
              backgroundColor:
                index === currentIndex ? theme.palette.primary.main : theme.palette.primary.dark,
              opacity: index === currentIndex ? 1 : 0.5,
              transform: index === currentIndex ? "scale(1.2)" : "scale(1)",
              transition: "all 0.4s ease",
              animation: index === currentIndex ? `${popIn} 0.6s ease-in-out` : "none",
              cursor: "pointer",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Carousel2;
