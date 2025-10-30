import React from 'react';
import { Box, Typography } from '@mui/material';

interface MapImageProps {
  latitude: string;
  longitude: string;
  width?: string;
  height?: string;
  address?: string;
  onClick?: () => void;
}

const MapImage: React.FC<MapImageProps> = ({
  latitude,
  longitude,
  width = '100%',
  height = '200px',
  address,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: open Google Maps
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Create a free Google Maps iframe URL (no API key required)
  const googleMapsIframeUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=15&maptype=roadmap`;

  return (
    <Box
      onClick={handleClick}
      sx={{
        width,
        height,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          borderColor: 'rgba(255, 255, 255, 0.4)',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
          '& .map-overlay': {
            opacity: 1
          }
        }
      }}
    >
      {/* Map Container */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}
      >
        {/* Google Maps iframe */}
        <iframe
          src={googleMapsIframeUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          title="Google Maps Location"
          style={{
            border: 'none',
            borderRadius: '8px'
          }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Box>

      {/* Overlay with address and click hint */}
      <Box
        className="map-overlay"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
          color: 'white',
          padding: '20px 16px 16px',
          opacity: 0.8,
          transition: 'opacity 0.3s ease',
          zIndex: 3
        }}
      >
        {address && (
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              marginBottom: '4px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
            }}
          >
             {address}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            opacity: 0.9,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
          }}
        >
          Click to open in Google Maps
        </Typography>
      </Box>
    </Box>
  );
};

export default MapImage;
