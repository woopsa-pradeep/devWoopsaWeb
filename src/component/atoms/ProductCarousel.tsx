import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CustomButton from './CustomButton';
import DefaultProductImage from '../../assets/Default-Product-Image.jpg';

interface Product {
  id: string;
  name: string;
  image: string;
  pack?: number;
  uom?: string;
  caseCount?: number;
  category?: string;
  itemNumber?: string;
}

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  speed?: number;
  onProductClick?: (product: Product) => void;
  my?: string | number;
  itemsPerView?: number;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  products,
  onProductClick,
  my = 3,
  itemsPerView = 7
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  // Smooth continuous auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || products.length <= itemsPerView) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        setScrollOffset(prev => {
          const maxOffset = (products.length - itemsPerView) * (140 + 8); // 140px width + 8px gap
          if (prev >= maxOffset) {
            return 0; // Loop back to start
          }
          return prev + 1; // Move 1px at a time for smooth movement
        });
      }, 10); // Update every 50ms for smooth animation (20fps)
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, products.length, itemsPerView]);

  // Reset inactivity timer and restart auto-scroll
  const resetAutoScroll = () => {
    setIsAutoScrolling(false);
    
    // Clear existing timers
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set inactivity timer to resume auto-scroll after 5 seconds
    inactivityTimerRef.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 5000);
  };

  // Update last interaction time
  const updateInteractionTime = () => {
    lastInteractionTime.current = Date.now();
  };

  const handlePrevious = () => {
    updateInteractionTime();
    resetAutoScroll();
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setScrollOffset(prev => Math.max(0, prev - (140 + 8)));
  };

  const handleNext = () => {
    updateInteractionTime();
    resetAutoScroll();
    const maxIndex = Math.max(0, products.length - itemsPerView);
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
    setScrollOffset(prev => Math.min((products.length - itemsPerView) * (140 + 8), prev + (140 + 8)));
  };

  const handleProductClick = (product: Product) => {
    updateInteractionTime();
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < products.length - itemsPerView;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ my: my }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1rem', md: '1.2rem' },
              fontWeight: 500,
              color: 'primary.main',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.7rem', md: '0.8rem' },
                fontWeight: 400
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Navigation Arrows */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'transparent',
              color: canGoPrevious ? '#666' : '#ccc',
              '&:hover': {
                backgroundColor: 'transparent',
                color: canGoPrevious ? '#3C7795' : '#ccc'
              },
              '&.Mui-disabled': {
                backgroundColor: 'transparent',
                color: '#ccc'
              }
            }}
          >
            {/* Previous Arrow Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </IconButton>

          <IconButton
            onClick={handleNext}
            disabled={!canGoNext}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: 'transparent',
              color: canGoNext ? '#3C7795' : '#ccc',
              '&:hover': {
                backgroundColor: 'transparent',
                color: canGoNext ? '#2980b9' : '#ccc'
              },
              '&.Mui-disabled': {
                backgroundColor: 'transparent',
                color: '#ccc'
              }
            }}
          >
            {/* Next Arrow Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          boxShadow: 'none'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            py: 0.5,
            transform: `translateX(-${scrollOffset}px)`,
            transition: isAutoScrolling ? 'none' : 'transform 0.3s ease-in-out'
          }}
        >
          {products?.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="product-card-new"
              onClick={() => handleProductClick(product)}
              style={{
                flexShrink: 0,
                width: '140px',
                height: '100%'
              }}
            >
              {/* Product Image Section */}
              <div className="product-image-new">
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.src = DefaultProductImage;
                  }}
                />
              </div>

              {/* Product Content */}
              <div className="product-content-new">
                <div className="category-tag">{product.category || 'PRODUCT'}</div>
                <h3 className="product-title">{product.name}</h3>
                <div className="product-specs">
                  <div className="spec-left">
                    <div className="spec-item">Pack: {product.pack || 1}</div>
                    <div className="spec-item">Case: {product.caseCount || 1}</div>
                  </div>
                  <div className="spec-right">
                    <div className="spec-item">Size: {product.uom || 'EACH'}</div>
                    <div className="spec-item">Item: {product.itemNumber || product.id}</div>
                  </div>
                </div>
                <CustomButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  buttonType="primary"
                  appearance="filled"
                  size="small"
                  fullWidth={true}
                  sx={{
                    mt: 0.7,
                    // fontSize: '0.8rem',
                    py: 0,
                    px: 1,
                    borderRadius: '4px',
                    maxHeight: '16px'
                  }}
                >
                  View Details
                </CustomButton>
              </div>
            </div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ProductCarousel;
