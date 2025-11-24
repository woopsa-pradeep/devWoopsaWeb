import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface StickySocialMediaProps {
  contactData?: {
    links?: Array<{
      id: string;
      name: string;
      url: string;
      logo?: string;
    }>;
  };
}

const StickySocialMedia: React.FC<StickySocialMediaProps> = ({ contactData }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Only render if social media links exist
  if (!contactData?.links || contactData.links.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toggle Button - Visible when drawer is closed */}
      {!isOpen && (
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 40,
            padding: 0,
            backgroundColor: 'rgba(0, 44, 63, 0.95)',
            borderRadius: '12px 0 0 12px',
            color: 'white',
            zIndex: 1001,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRight: 'none',
            '&:hover': {
              backgroundColor: 'rgba(0, 44, 63, 1)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              transform: 'translateY(-50%) scale(1.05)',
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}

      {/* Drawer */}
      <Box
        sx={{
          position: 'fixed',
          right: isOpen ? 0 : '-100%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          padding: '12px 8px',
          backgroundColor: 'rgba(0, 44, 63, 0.95)',
          borderRadius: '16px 0 0 16px',
          transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Toggle Button - Left side of drawer, vertically centered */}
        <IconButton
          onClick={() => setIsOpen(false)}
          sx={{
            position: 'absolute',
            left: -23,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 40,
            padding: 0,
            backgroundColor: 'rgba(0, 44, 63, 0.95)',
            borderRadius: '8px 0 0 8px',
            color: 'white',
            zIndex: 1001,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderLeft: 'none',
            '&:hover': {
              backgroundColor: 'rgba(0, 44, 63, 1)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              transform: 'translateY(-50%) scale(1.05)',
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 20 }} />
        </IconButton>
      {contactData?.links?.map((link, index) => {
        const isHovered = hoveredIndex === index;
        return (
          <Tooltip
            key={link.id}
            title={link.name}
            placement="left"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  padding: '6px 10px',
                  borderRadius: '6px',
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Box
              component="a"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                padding: 0,
                margin: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'scale(1.15) translateX(-4px)' : 'scale(1)',
                '&:active': {
                  transform: 'scale(1.05) translateX(-2px)',
                },
              }}
            >
              {link.logo ? (
                <Box
                  component="img"
                  src={link.logo}
                  alt={link.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'white',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {link.name.charAt(0)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Tooltip>
        );
      })}
      </Box>
    </>
  );
};

export default StickySocialMedia;

