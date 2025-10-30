import React, { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface AdvertisementBannerProps {
  images?: string[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  width?: string | number;
  height?: string | number;
  my?: string | number;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({
  images = [],
  autoPlay = true,
  autoPlayInterval = 4000,
  width = '100%',
  height = 400,
  my = 10
}) => {
  // Don't render if no images are provided
  if (!images || images.length === 0) {
    return null;
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        my: my,
        '& img': {
          width: '100%',
          height: '100%',
          display: 'block'
        }
      }}
    >
      {/* Main Image */}
      <Box
        component="img"
        src={images[currentImageIndex]}
        alt={`Advertisement ${currentImageIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: 'all 0.3s ease'
        }}
      />

      {/* Carousel Controls - Only show if multiple images */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <IconButton
            onClick={prevImage}
            sx={{
              position: 'absolute',
              left: 15,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                transform: 'translateY(-50%) scale(1.1)'
              },
              width: 44,
              height: 44,
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <ChevronLeft />
          </IconButton>

          {/* Next Button */}
          <IconButton
            onClick={nextImage}
            sx={{
              position: 'absolute',
              right: 15,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                transform: 'translateY(-50%) scale(1.1)'
              },
              width: 44,
              height: 44,
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <ChevronRight />
          </IconButton>

          {/* Image Indicators */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 15,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              zIndex: 10
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: index === currentImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: index === currentImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    transform: 'scale(1.2)'
                  }
                }}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AdvertisementBanner;
