import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import product1 from '../../assets/Default-Product-Image.jpg';

interface Product {
  id: string;
  Item_Number: number;
  name: string;
  Description: string;
  totalPrice?: string;
  price?: number;
  priceWithTax?: number;
  discount?: string;
  stock: string;
  stockCount?: number;
  size: string;
  UOM?: string;
  image: string;
  masterImage?: string;
  distributorImage?: string;
  showDistributorImage?: boolean;
  isNewItem?: boolean;
  isDiscounted?: boolean;
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  allowToOrder?: boolean;
  showWithOutPrice?: boolean;
  Tax_Rate?: number;
  prepaidTaxRate?: number;
  hasProductLimit?: boolean;
  productLimit?: number | null;
  Inventory_OnHand?: number;
  showTheInventoryStock?: boolean;
  showLowStock?: boolean;
}

interface FrequentlyBoughtTogetherProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  loading?: boolean;
}

const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  products,
  onAddProduct,
  onProductClick,
  loading = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280; // Width of product card + gap
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };
  const getProductImage = (product: Product): string => {
    if (product.showDistributorImage && product.distributorImage) {
      return product.distributorImage;
    } else if (product.masterImage && product.masterImage !== "https://woopsacdn.blob.core.windows.net/product-images/undefined.jpg") {
      return product.masterImage;
    } else if (product.image) {
      return product.image;
    } else {
      return product1;
    }
  };

  const getDisplayPrice = (product: Product): string => {
    if (product.showWithOutPrice) return '-';
    
    if (product.priceWithTax !== undefined) {
      return `$${Number(product.priceWithTax).toFixed(2)}`;
    }
    
    if (product.price !== undefined) {
      // Calculate price with tax if Tax_Rate and prepaidTaxRate are available
      const basePrice = Number(product.price || 0);
      const prepaidTaxRate = Number(product.prepaidTaxRate || 0);
      const taxRate = Number(product.Tax_Rate || 0);
      const basePriceWithTax = basePrice + taxRate;
      const finalPrice = basePriceWithTax * (1 + prepaidTaxRate);
      return `$${Number(finalPrice).toFixed(2)}`;
    }
    
    return product.totalPrice || '-';
  };

  const getStockStatus = (product: Product): string => {
    if (product.showTheInventoryStock && product.Inventory_OnHand !== undefined) {
      return product.Inventory_OnHand.toString();
    }
    return product.showLowStock ? 'Out of Stock' : 'In Stock';
  };

  if (loading) {
    return (
      <Paper sx={{ borderRadius: 2, boxShadow: 'none', p: 1.5 }}>
        <Typography fontSize={13} fontWeight={600} borderBottom={1} borderColor="divider" pb={1} mb={1}>
          Bought Together Products
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      </Paper>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ borderRadius: 2, boxShadow: 'none', p: 1.5, position: 'relative' }}>
      <Typography fontSize={13} fontWeight={600} borderBottom={1} borderColor="divider" pb={1} mb={1}>
        Bought Together Products
      </Typography>
      <Box sx={{ position: 'relative' }}>
        {/* Left Arrow */}
        {showLeftArrow && (
          <IconButton
            onClick={() => scroll('left')}
            sx={{
              position: 'absolute',
              left: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}

        {/* Scrollable Container */}
        <Box
          ref={scrollContainerRef}
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none', // Firefox
            '&::-webkit-scrollbar': {
              display: 'none', // Chrome, Safari
            },
            px: showLeftArrow || showRightArrow ? 3 : 0,
          }}
        >
          {products.map((product) => {
            const isDisabled = !product.allowToOrder;
            
            return (
              <Box
                key={product.id || product.Item_Number}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  minWidth: 260,
                  maxWidth: 260,
                  border: '1px solid',
                  borderColor: isDisabled ? 'error.light' : 'divider',
                  borderRadius: 1,
                  backgroundColor: isDisabled ? 'action.disabledBackground' : 'background.paper',
                  opacity: isDisabled ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  cursor: onProductClick ? 'pointer' : 'default',
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: isDisabled ? 'error.light' : 'primary.main',
                    boxShadow: isDisabled ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                  },
                }}
                onClick={(e) => {
                  // Only trigger if clicking on the card itself, not the add button
                  if (onProductClick && !(e.target as HTMLElement).closest('button')) {
                    onProductClick(product);
                  }
                }}
              >
                {/* New Item Badge */}
                {product.isNewItem && (
                  <Chip
                    label="NEW"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: '#4caf50',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      height: '18px',
                      zIndex: 2,
                    }}
                  />
                )}

                {/* Discount Badge */}
                {(product.isDiscounted || product.hasQtyDiscount) && (
                  <Chip
                    label={product.hasQtyDiscount ? "QTY DISCOUNT" : "DISCOUNT"}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: product.isNewItem ? 26 : 6,
                      right: 6,
                      backgroundColor: '#ff3b30',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      height: '18px',
                      zIndex: 2,
                    }}
                  />
                )}

                <Box
                  component="img"
                  src={getProductImage(product)}
                  alt={product.name || product.Description}
                  onError={(e) => {
                    e.currentTarget.src = product1;
                  }}
                  sx={{
                    width: 52,
                    height: 52,
                    objectFit: 'contain',
                    mr: 1.5,
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                />
                <Box flex={1} sx={{ minWidth: 0 }}>
                  <Typography
                    fontWeight={500}
                    fontSize={13}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3,
                      mb: 0.5,
                    }}
                  >
                    {product.name || product.Description}
                  </Typography>
                  <Typography color="text.secondary" fontSize={10.5} sx={{ mb: 0.25 }}>
                    {getStockStatus(product)} • {product.size || product.UOM || 'Size: N/A'}
                  </Typography>
                  <Typography color="primary" fontSize={12} fontWeight={600}>
                    {getDisplayPrice(product)}
                  </Typography>
                  {product.discount && (
                    <Typography color="error" fontSize={10} sx={{ textDecoration: 'line-through' }}>
                      {product.discount}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: isDisabled ? 'error.light' : 'divider',
                    borderRadius: 2,
                    p: 0.4,
                    ml: 0.75,
                    backgroundColor: isDisabled ? 'action.disabledBackground' : 'background.paper',
                  }}
                >
                  <IconButton
                    size="small"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        onAddProduct(product);
                      }
                    }}
                    sx={{
                      p: 0.4,
                      '&:hover': {
                        backgroundColor: isDisabled ? 'transparent' : 'primary.light',
                        color: isDisabled ? 'inherit' : 'primary.main',
                      },
                    }}
                  >
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Right Arrow */}
        {showRightArrow && (
          <IconButton
            onClick={() => scroll('right')}
            sx={{
              position: 'absolute',
              right: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default FrequentlyBoughtTogether;
