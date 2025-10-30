/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  IconButton, 
  Chip, 
  useTheme, 
  InputAdornment, 
  CircularProgress, 
  Button 
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { InfoOutlined, HistoryOutlined, ShoppingCart as ShoppingCartIcon, VisibilityOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ViewModeToggleSales from './ViewModeToggleSales';
import GridCard from './GridCard';
import CommonTable, { TableColumn } from './Table/CommonTable';
import cart from '../../assets/icons/cart.svg';
import TextInput from './TextInput';

// ProductImage component with error handling
const ProductImage: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      style={style}
      onError={(e) => {
        e.currentTarget.src = '/src/assets/Default-Product-Image.jpg';
      }}
    />
  );
};

interface Product {
  id: string;
  image: string;
  name: string;
  itemNumber: string;
  pack: string;
  case: string;
  size: string;
  UnitOunces: string;
  stock: 'in stock' | 'low stock' | 'out of stock';
  stockCount?: number;
  price: number;
  crvPrice: number;
  quantity: number;
  upc: string;
  category: string;
  subCategory: string;
  Tax_Rate: number;
  priceWithTax: number;
  showWithOutPrice: boolean;
  isDiscounted: boolean;
  isNewItem: boolean;
  allowToOrder: boolean;
  hasProductLimit: boolean;
  productLimit: number | null;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  productDetails?: {
    brand: string;
    category: string;
    sku: string;
    weight: string;
    dimensions: string;
    description: string;
  };
}

interface GridCardSalesProps {
  items: Product[];
  viewMode: 'table' | 'grid' | 'keyboard';
  setViewMode: (mode: 'table' | 'grid' | 'keyboard') => void;
  loading: boolean;
  filterComponent?: React.ReactNode;
  showFilters?: boolean;
  filterConfig?: any;
  // Table props
  columns?: TableColumn<any>[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  containerHeight?: string;
  headerStyle?: any;
  stickyLastColumn?: boolean;
  isNewItem?: boolean;
  isDiscounted?: boolean;
  hasQtyDiscount?: boolean;
  // Grid props
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  showPageSizeSelector?: boolean;
  showTotalItems?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  // Keyboard view props
  onProductSelect?: any;
  onProductClick?: any;
  onHistoryClick?: any;
  orderItems?: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } };
  onQuantityChange?: (id: string, change: number) => void;
  onAddToCart?: (id: string) => void;
  onQuantityInputBlur?: (id: string, quantity: number) => void;
  searchTerm?: string;
  onSearchChange?: (e: any) => void;
  onClearMasterSearch?: () => void;
  masterSearchTerm?: string;
  debouncedSearchTerm?: string;
  // Quantity discount props
  onDiscountModalOpen?: any;
  // Role and customer props
  role?: string;
  customerId?: any;
}

const GridCardSales: React.FC<GridCardSalesProps> = ({
  items,
  viewMode,
  setViewMode,
  loading,
  filterComponent,
  showFilters = true,
  filterConfig,
  columns,
  currentPage = 1,
  totalPages = 0,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  containerHeight = "calc(100vh - 200px)",
  headerStyle,
  stickyLastColumn = false,
  xs = 12,
  sm = 6,
  md = 4,
  lg = 3,
  xl = 2,
  spacing = 2,
  showPageSizeSelector = true,
  showTotalItems = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  onProductSelect,
  onProductClick,
  onHistoryClick,
  orderItems = {},
  onQuantityChange,
  onAddToCart,
  onQuantityInputBlur,
  searchTerm = '',
  onSearchChange,
  onClearMasterSearch,
  masterSearchTerm = '',
  debouncedSearchTerm = '',
  onDiscountModalOpen,
  isNewItem,
  isDiscounted,
  hasQtyDiscount,
  role,
  customerId
}) => {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quantityInput, setQuantityInput] = useState<{ [key: string]: string }>({});
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingQuantity, setIsSubmittingQuantity] = useState(false);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(-1);
    setFocusedProductId(null);
  }, [items]);

  // Handle keyboard navigation for keyboard view
  useEffect(() => {
    if (viewMode !== 'keyboard') return;

    let keyRepeatTimer: NodeJS.Timeout | null = null;
    let isKeyRepeating = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'keyboard') return;

      // If a quantity input is focused, only handle Escape key globally
      if (focusedProductId) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setFocusedProductId(null);
          setQuantityInput(prev => ({ ...prev, [focusedProductId]: '' }));
          // Keep search term, just focus search input
          searchInputRef.current?.focus();
          return;
        }
        return;
      }

      // Handle key repeat (long press)
      if (e.repeat && !isKeyRepeating) {
        isKeyRepeating = true;
        
        // Clear any existing timer
        if (keyRepeatTimer) {
          clearTimeout(keyRepeatTimer);
        }
        
        // Set a timer to handle long press behavior
        keyRepeatTimer = setTimeout(() => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            // Jump to last item
            setSelectedIndex(items.length - 1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Jump to first item
            setSelectedIndex(0);
          }
        }, 300); // 300ms delay for long press
      }

      // Handle initial key press
      if (!e.repeat) {
        isKeyRepeating = false;
        
        // Clear any existing timer
        if (keyRepeatTimer) {
          clearTimeout(keyRepeatTimer);
          keyRepeatTimer = null;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex(prev => {
              const newIndex = prev < items.length - 1 ? prev + 1 : 0;
              
              // If we're at the last item and there are more pages, go to next page
              if (newIndex === 0 && prev === items.length - 1 && totalPages && currentPage && currentPage < totalPages) {
                if (onPageChange) {
                  onPageChange(currentPage + 1);
                }
              }
              
              return newIndex;
            });
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex(prev => {
              const newIndex = prev > 0 ? prev - 1 : items.length - 1;
              
              // If we're at the first item and there are previous pages, go to previous page
              if (newIndex === items.length - 1 && prev === 0 && totalPages && currentPage && currentPage > 1) {
                if (onPageChange) {
                  onPageChange(currentPage - 1);
                }
              }
              
              return newIndex;
            });
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < items.length) {
              const product = items[selectedIndex];
              handleProductEnter(product);
            }
            break;
          case 'Escape':
            e.preventDefault();
            if (focusedProductId) {
              // If quantity input is focused, just hide it and keep search term
              setFocusedProductId(null);
              setQuantityInput(prev => ({ ...prev, [focusedProductId]: '' }));
              // Keep search term, just focus search input
              searchInputRef.current?.focus();
            } else {
              // If no quantity input is focused, clear search and reset selection
              setSelectedIndex(-1);
              // Clear search term
              if (onSearchChange) {
                onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
              }
              searchInputRef.current?.focus();
            }
            break;
          case 'Tab':
            // Allow normal tab navigation
            break;
          case 'S':
          case 's':
            // Shortcut to focus search - but don't prevent default so the character gets typed
            setSelectedIndex(-1);
            setFocusedProductId(null);
            searchInputRef.current?.focus();
            // Don't prevent default - let the character be typed into the search input
            break;
          // case 'G':
          // case 'g':
          //   // Shortcut to focus page input for pagination
          //   if (viewMode === 'keyboard' && totalPages && totalPages > 1) {
          //     e.preventDefault();
          //     setSelectedIndex(-1);
          //     setFocusedProductId(null);
          //     // Focus the page input after a short delay
          //     setTimeout(() => {
          //       const pageInput = document.querySelector('input[type="number"]') as HTMLInputElement;
          //       if (pageInput) {
          //         pageInput.focus();
          //         pageInput.select();
          //       }
          //     }, 100);
          //   }
          //   break;
          case 'Home':
            // Jump to first item
            e.preventDefault();
            setSelectedIndex(0);
            break;
          case 'End':
            // Jump to last item
            e.preventDefault();
            setSelectedIndex(items.length - 1);
            break;
          default:
            // If any other key is pressed, focus on search input
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
              searchInputRef.current?.focus();
            }
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Reset key repeat state when key is released
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        isKeyRepeating = false;
        if (keyRepeatTimer) {
          clearTimeout(keyRepeatTimer);
          keyRepeatTimer = null;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (keyRepeatTimer) {
        clearTimeout(keyRepeatTimer);
      }
    };
  }, [viewMode, items, selectedIndex, focusedProductId, totalPages, currentPage, onPageChange]);

  // Add a separate useEffect to handle scrolling when selectedIndex changes
  useEffect(() => {
    if (viewMode === 'keyboard' && selectedIndex >= 0 && selectedIndex < items.length) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        scrollToProduct(selectedIndex);
      });
    }
  }, [selectedIndex, viewMode, items]);

  const scrollToProduct = (index: number) => {
    if (productListRef.current) {
      const productElements = productListRef.current.querySelectorAll('[data-product-index]');
      const targetElement = productElements[index] as HTMLElement;
      if (targetElement) {
        const container = productListRef.current;
        const currentScrollTop = container.scrollTop;
        
        // Get the element's position relative to the container
        const elementTop = targetElement.offsetTop;
        const elementBottom = elementTop + targetElement.clientHeight;
        const containerHeight = container.clientHeight;
        
        // Check if element is visible
        const isVisible = elementTop >= currentScrollTop && 
                         elementBottom <= currentScrollTop + containerHeight;
        
        if (!isVisible) {
          let newScrollTop = currentScrollTop;
          
          // If element is above current view, scroll up just enough to show it
          if (elementTop < currentScrollTop) {
            // Only add margin if the element would be cut off at the top
            if (elementTop < 10) {
              newScrollTop = 0; // Go to very top for first few items
            } else {
              newScrollTop = elementTop; // No margin - just scroll to element position
            }
          }
          // If element is below current view, scroll down just enough to show it
          else if (elementBottom > currentScrollTop + containerHeight) {
            newScrollTop = elementBottom - containerHeight;
          }
          
          // Ensure we don't scroll beyond bounds
          newScrollTop = Math.max(0, Math.min(newScrollTop, container.scrollHeight - containerHeight));
          
          // Only scroll if position actually changed
          if (newScrollTop !== currentScrollTop) {
            container.scrollTop = newScrollTop; // Direct assignment - no smooth scrolling
          }
        }
      }
    }
  };

  const handleProductEnter = (product: Product) => {
    if (!product.allowToOrder) return;

    // Check if this is the first time adding this product and if it has quantity discount
    const currentQty = orderItems[product.id]?.quantity || 0;
    const isFirstTimeAdding = currentQty === 0;
    
    if (isFirstTimeAdding && product.hasQtyDiscount && product.qtyDiscount && onDiscountModalOpen) {
      // Open discount modal automatically for first-time additions
      onDiscountModalOpen(product, product.qtyDiscount);
      return; // Don't add to cart yet, wait for modal confirmation
    }

    // Move cursor directly to quantity input field
    setFocusedProductId(product.id);
    
    // For first time adding, show empty input. For existing items, show current quantity
    const inputValue = currentQty > 0 ? currentQty.toString() : '';
    setQuantityInput(prev => ({ 
      ...prev, 
      [product.id]: inputValue
    }));
    
    // Focus the quantity input after a brief delay to ensure DOM is updated
    setTimeout(() => {
      const quantityInputElement = document.querySelector(`[data-product-id="${product.id}"] input`) as HTMLInputElement;
      if (quantityInputElement) {
        quantityInputElement.focus();
        quantityInputElement.select();
      }
    }, 50);
  };

  const handleQuantitySubmit = (product: Product, quantity: number) => {
    if (!product.allowToOrder) return;

    setIsSubmittingQuantity(true);

    try {
      if (quantity <= 0) {
        // Remove from cart - handle both 0 and negative quantities
        if (onQuantityChange) {
          onQuantityChange(product.id, -orderItems[product.id]?.quantity || 0);
        }
        
        // Clear quantity input and remove focus after removal
        setQuantityInput(prev => ({ ...prev, [product.id]: '' }));
        setFocusedProductId(null);
        
        // Ensure the selected product remains selected for continued navigation
        const currentIndex = items.findIndex(item => item.id === product.id);
        if (currentIndex !== -1) {
          setSelectedIndex(currentIndex);
        }
        
        return; // Exit early after removal
      }
      
      // Check if this is the first time adding this product and if it has quantity discount
      const currentQty = orderItems[product.id]?.quantity || 0;
      const isFirstTimeAdding = currentQty === 0;
      
      if (isFirstTimeAdding && product.hasQtyDiscount && product.qtyDiscount && onDiscountModalOpen) {
        // Open discount modal automatically
        onDiscountModalOpen(product, product.qtyDiscount);
        // Clear quantity input and remove focus
        setQuantityInput(prev => ({ ...prev, [product.id]: '' }));
        setFocusedProductId(null);
        return; // Don't add to cart yet, wait for modal confirmation
      }
      
      // Add or update in cart
      const difference = quantity - currentQty;
      if (difference !== 0 && onQuantityChange) {
        // This is where the API call happens!
        onQuantityChange(product.id, difference);
      }

      // Clear quantity input and remove focus
      setQuantityInput(prev => ({ ...prev, [product.id]: '' }));
      setFocusedProductId(null);
      
      // Ensure the selected product remains selected for continued navigation
      const currentIndex = items.findIndex(item => item.id === product.id);
      if (currentIndex !== -1) {
        setSelectedIndex(currentIndex);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Keep the quantity input focused if there's an error
      setFocusedProductId(product.id);
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsSubmittingQuantity(false);
      }, 100);
    }
  };

  const handleQuantityInputKeyDown = (e: React.KeyboardEvent, product: Product) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if product is allowed to be ordered
      if (!product.allowToOrder) {
        return;
      }
      
      const quantity = parseInt(quantityInput[product.id] || '0');
      if (quantity >= 0) {
        // This triggers the API call via handleQuantitySubmit -> onQuantityChange
        // Allow 0 to remove item from cart
        handleQuantitySubmit(product, quantity);
        // After submitting, the focus will be cleared and user can navigate with arrow keys
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if product is allowed to be ordered
      if (!product.allowToOrder) {
        return;
      }
      
      // Only update local state, don't call API
      const currentQty = parseInt(quantityInput[product.id] || '0');
      const newQty = Math.max(1, currentQty + 1);
      setQuantityInput(prev => ({ ...prev, [product.id]: newQty.toString() }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if product is allowed to be ordered
      if (!product.allowToOrder) {
        return;
      }
      
      // Only update local state, don't call API
      const currentQty = parseInt(quantityInput[product.id] || '0');
      const newQty = Math.max(0, currentQty - 1);
      setQuantityInput(prev => ({ ...prev, [product.id]: newQty.toString() }));
    } else if (e.key === 'Tab') {
      // Allow tab navigation
      return;
    } else if (e.key === 'S' || e.key === 's') {
      // Shortcut to focus search - handle both uppercase and lowercase
      e.preventDefault();
      e.stopPropagation();
      setQuantityInput(prev => ({ ...prev, [product.id]: '' }));
      setFocusedProductId(null);
      searchInputRef.current?.focus();
    } else {
      // Only allow numbers and backspace/delete
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
      const isNumber = /^[0-9]$/.test(e.key);
      if (!isNumber && !allowedKeys.includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  const getGridItems = () => {
    return items.map((item: Product) => ({
      id: item.id,
      title: item.name || "-",
      subtitle: `Pack: ${item.pack} | Size: ${item.size}`,
      description: `Case: ${item.case} | Unit: ${item.UnitOunces} | Item : ${item.itemNumber}`,
      avatarText: item.name.charAt(0).toUpperCase(),
      avatarImage: item.image,
      tags: [item.stock],
      upc: item.upc,
      stockCount: item.stockCount,
      stock: item.stock,
      price: item.showWithOutPrice ? undefined : item.priceWithTax,
      discount: item.crvPrice,
      productDetails: item.productDetails,
      isNewItem: item.isNewItem || false,
      isDiscounted: item.isDiscounted || false,
      hasQtyDiscount: item.hasQtyDiscount || false,
      actions: [
        {
          icon: <InfoOutlined />,
          tooltip: 'View Details',
          onClick: () => onProductClick?.(item)
        },
        {
          icon: <HistoryOutlined />,
          tooltip: 'View History',
          onClick: () => onHistoryClick?.(item)
        }
      ],
      customActions: !item.allowToOrder ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "fit-content",
            padding: "4px 8px",
            backgroundColor: "grey.300",
            borderRadius: "6px",
            cursor: "not-allowed",
          }}
        >
          <Typography 
            sx={{ 
              color: "grey.600", 
              fontSize: "12px", 
              fontWeight: 400 
            }}
          >
            Out of Stock
          </Typography>
        </Box>
      ) : (orderItems[item.id]?.quantity || 0) === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "fit-content",
            padding: "4px 8px",
            backgroundColor: "primary.main",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: "primary.dark"
            }
          }}
          onClick={() => {
            // Check if product has quantity discount for first-time addition
            if (item.hasQtyDiscount && item.qtyDiscount && onDiscountModalOpen) {
              onDiscountModalOpen(item, item.qtyDiscount);
            } else {
              onAddToCart?.(item.id);
            }
          }}
        >
          <ShoppingCartIcon 
            sx={{ 
              color: "white",
              fontSize: "16px",
              mr: 1
            }} 
          />
          <Typography 
            sx={{ 
              color: "white", 
              fontSize: "12px", 
              fontWeight: 400 
            }}
          >
            Add to Cart
          </Typography>
        </Box>
      ) : (
        <Box 
          sx={{
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: 1.5,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            padding: "2px 4px",
            width: 'fit-content',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            '&:hover': {
              borderColor: (theme) => theme.palette.primary.main,
            }
          }}
        >
          <RemoveIcon 
            onClick={() => {
              // Check if item is allowed to be ordered
              if (!item.allowToOrder) {
                return;
              }
              onQuantityChange?.(item.id, -1);
            }} 
            sx={{ 
              fontSize: "16px", 
              color: "primary.main",
              cursor: "pointer"
            }} 
          />
          <input
            type="text"
            value={quantityInput[item.id] !== undefined ? quantityInput[item.id] : (orderItems[item.id]?.quantity || 0)}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow numbers
              if (value === '' || /^\d+$/.test(value)) {
                // Check if item is allowed to be ordered
                if (!item.allowToOrder) {
                  return;
                }
                
                // Update local state for immediate visual feedback
                setQuantityInput(prev => ({
                  ...prev,
                  [item.id]: value
                }));
              }
            }}
            onKeyDown={(e:any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const newQuantity = parseInt(quantityInput[item.id] || e.target.value) || 0;
                if (newQuantity >= 0) {
                  onQuantityInputBlur?.(item.id, newQuantity);
                  // Clear the local input state after submission
                  setQuantityInput((prev: any) => ({ ...prev, [item.id]: undefined }));
                }
              }
            }}
            onBlur={(e) => {
              const newQuantity = parseInt(quantityInput[item.id] || e.target.value) || 0;
              if (newQuantity >= 0) {
                onQuantityInputBlur?.(item.id, newQuantity);
                // Clear the local input state after blur
                setQuantityInput((prev: any) => ({ ...prev, [item.id]: undefined }));
              }
            }}
            style={{
              width: '40px',
              textAlign: 'center',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: theme.palette.text.primary,
            }}
          />
          <AddIcon 
            onClick={() => {
              // Check if item is allowed to be ordered
              if (!item.allowToOrder) {
                return;
              }
              onQuantityChange?.(item.id, 1);
            }} 
            sx={{ 
              fontSize: "16px", 
              color: "primary.main",
              cursor: "pointer"  
            }}
          />
        </Box>
      )
    }));
  };

  // Keyboard view component
  const KeyboardView = () => (
    <Box sx={{ height: "calc(100vh - 180px)", display: 'flex', flexDirection: 'column' , backgroundColor: 'background.paper', borderRadius: '10px'}}>
      {/* Header with Search and View Toggle */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
        p: 2,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px 10px 0 0'
      }}>
        {/* Search Bar */}
        <Box sx={{ flex: 1, maxWidth: '400px' }}>
          <TextInput
            ref={searchInputRef}
            placeholder={
              masterSearchTerm
                ? `Banner search: ${masterSearchTerm}`
                : 'Search products (type to search, ↑↓ to navigate, Enter to select)'
            }
            value={searchTerm}
            onChange={onSearchChange}
            autoFocus
            fullWidth
            size="small"
            sx={{mb: 0}}
          />
        </Box>
        
        {/* View Mode Toggle */}
        <ViewModeToggleSales viewMode={viewMode} setViewMode={setViewMode} />
      </Box>
  
      {searchTerm && (
        <Box
          ref={productListRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'background.paper',
            p: 1
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Typography>Loading products...</Typography>
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Typography color="textSecondary">
                No products found. Try a different search term.
              </Typography>
            </Box>
          ) : (
            <>
              {items?.map((product, index) => (
                <Box
                  key={product.id}
                  data-product-index={index}
                  data-product-id={product.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedIndex === index ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    },
                    '&:last-child': {
                      borderBottom: 'none'
                    },
                    position: 'relative'
                  }}
                  onClick={() => setSelectedIndex(index)}
                >
                  {/* Product Image - Hidden in keyboard view for better performance */}
                  {/* <Box sx={{ position: 'relative', mr: 2 }}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: '8px' }}
                    />
                    {product.isDiscounted && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          left: -6,
                          backgroundColor: '#ff3b30',
                          color: 'white',
                          padding: '2px 8px',
                          transform: 'rotate(-45deg)',
                          fontSize: '10px',
                          fontWeight: 600,
                          borderRadius: '2px'
                        }}
                      >
                        SALE
                      </Box>
                    )}
                  </Box> */}
  
                                     {/* Product Info - Two Lines */}
                   <Box sx={{ flex: 1, minWidth: 0 }}>
                     <Typography
                       variant="body2"
                       sx={{
                         fontWeight: 500,
                         color: 'text.primary',
                         fontSize: '13px',
                         lineHeight: 1.2,
                         mb: 0.5
                       }}
                     >
                       {product.name}
                     </Typography>
                     <Typography
                       variant="body2"
                       sx={{
                         color: 'text.secondary',
                         fontSize: '12px',
                         lineHeight: 1.2
                       }}
                     >
                     {product.itemNumber} | Pack: {product.pack} | Size: {product.size} | Case: {product.case} | Unit: {product.UnitOunces}
                     </Typography>
                   </Box>

                   {/* History Button */}
                   <Box sx={{ mr: 1, minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <IconButton 
                       size="small" 
                       sx={{ 
                         color: "primary.main",
                         p: 0.5,
                       }} 
                       onClick={() => onHistoryClick?.(product)}
                     >
                       <VisibilityOutlined sx={{ fontSize: 16 }} />
                     </IconButton>
                   </Box>

                   {/* Stock Status */}
                   <Box sx={{ mr: 1, minWidth: 60 }}>
                    {product.stockCount !== undefined ? (
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'text.secondary',
                          fontSize: '12px'
                        }}
                      >
                        Stock: {product.stockCount}
                      </Typography>
                    ) : (
                      <Chip
                        label={product.stock}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontSize: '10px',
                          height: '20px',
                          color: product.stock === 'in stock' ? 'success.main' : 'error.main',
                          bgcolor: product.stock === 'in stock' ? 'success.light' : 'error.light'
                        }}
                      />
                    )}
                  </Box>
  
                  {/* Price */}
                  <Box sx={{ mr: 1, minWidth: 70, textAlign: 'right' }}>
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: 'text.primary',
                        fontSize: '13px'
                      }}
                    >
                      {product.showWithOutPrice ? '-' : `$${Number(product.priceWithTax).toFixed(2)}`}
                    </Typography>
                  </Box>
  
                  {/* Quantity Input / Add Button */}
                  <Box sx={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {!product.allowToOrder ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'error.main'
                        }}
                      >
                        Out of Stock
                      </Typography>
                    ) : focusedProductId === product.id ? (
                                             <TextField
                         autoFocus
                         size="small"
                         type="text"
                         inputProps={{
                           inputMode: 'numeric',
                           pattern: '[0-9]*',
                           min: 1
                         }}
                         value={quantityInput[product.id] || ''}
                                                 onChange={(e) => {
                           const value = e.target.value;
                           // Only allow numbers
                           if (value === '' || /^\d+$/.test(value)) {
                             // Check if product is allowed to be ordered
                             if (!product.allowToOrder) {
                               return;
                             }
                             
                             // Only update local state, don't call API
                             setQuantityInput((prev) => ({
                               ...prev,
                               [product.id]: value
                             }));
                           }
                         }}
                        onKeyDown={(e) => handleQuantityInputKeyDown(e, product)}
                        onBlur={() => {
                          // Don't auto-submit on blur in keyboard view
                          // Only submit when Enter is pressed
                        }}
                        placeholder="Qty"
                        sx={{
                          width: 60,
                          '& .MuiInputBase-root': {
                            fontSize: '12px',
                            fontWeight: 500,
                            height: '32px'
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isSubmittingQuantity && focusedProductId === product.id && (
                                <CircularProgress size={12} sx={{ color: 'primary.main' }} />
                              )}
                              <Typography 
                                variant="caption" 
                                sx={{
                                  color: 'text.secondary'
                                }}
                              >
                                qty
                              </Typography>
                            </Box>
                          )
                        }}
                      />
                                         ) : (orderItems[product.id]?.quantity || 0) === 0 ? (
                       <Box
                         sx={{
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "flex-end",
                           width: "100%",
                           padding: "5px"
                         }}
                       >
                         <Box 
                           component="img" 
                           src={cart}
                           onClick={() => {
                             // Check if product is allowed to be ordered
                             if (!product.allowToOrder) {
                               return;
                             }
                             
                             // Check if product has quantity discount for first-time addition
                             if (product.hasQtyDiscount && product.qtyDiscount && onDiscountModalOpen) {
                               onDiscountModalOpen(product, product.qtyDiscount);
                             } else {
                               // Just focus the input, don't add to cart automatically
                               setFocusedProductId(product.id);
                               setQuantityInput(prev => ({ ...prev, [product.id]: '' }));
                             }
                           }}
                           sx={{ 
                             cursor: "pointer", 
                             backgroundColor: "primary.main", 
                             borderRadius: "50%",
                             width: "32px",
                             height: "32px",
                             padding: "2px",
                             transition: "transform 0.2s ease-in-out",
                             "&:hover": {
                               transform: "scale(1.1)"
                             }
                           }} 
                         />
                       </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                        
                        <Box
                          sx={{
                            backgroundColor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            padding: '4px 8px',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              fontSize: '12px',
                              color: 'text.primary'
                            }}
                          >
                            {orderItems[product.id]?.quantity}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  
  
                </Box>
              ))}
            </>
          )}
        </Box>
      )}
  
      {/* Pagination Component for Keyboard Mode */}
      {viewMode === 'keyboard' && totalPages && totalPages > 1 && (
        <Box
          sx={{
            py: 2,
            px: 2,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* Page Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Page {currentPage || 1} of {totalPages || 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({totalItems || 0} total items)
            </Typography>
          </Box>

          {/* Page Size Selector */}
          {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Show:
            </Typography>
            <select
              value={pageSize || 10}
              onChange={(e) => {
                const newPageSize = parseInt(e.target.value);
                if (onPageSizeChange) {
                  onPageSizeChange(newPageSize);
                }
              }}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </Box> */}



          {/* Pagination Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => {
                if (onPageChange && currentPage && currentPage > 1) {
                  onPageChange(currentPage - 1);
                }
              }}
              sx={{ minWidth: '40px', p: 1 }}
            >
              &lt;
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              disabled={currentPage >= (totalPages || 1)}
              onClick={() => {
                if (onPageChange && currentPage && currentPage < (totalPages || 1)) {
                  onPageChange(currentPage + 1);
                }
              }}
              sx={{ minWidth: '40px', p: 1 }}
            >
              &gt;
            </Button>
          </Box>
        </Box>
      )}
  
      <Box
        sx={{
          mt: 1,
          py: 1,
          px: 2,
          backgroundColor: 'background.paper',
          borderRadius: '0 0 10px 10px',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          <strong>Quick Order Guide:</strong> Type to search &nbsp;→&nbsp; use <kbd>↑</kbd>/<kbd>↓</kbd> to navigate &nbsp;→&nbsp; <kbd>Enter</kbd> to select &nbsp;→&nbsp; type quantity &nbsp;→&nbsp; <kbd>Enter</kbd> to confirm &nbsp;→&nbsp; use <kbd>↑</kbd>/<kbd>↓</kbd> to continue navigating &nbsp;→&nbsp; <kbd>Esc</kbd> to exit quantity input.
          {totalPages && totalPages > 1 && (
            <> &nbsp;→&nbsp; Press <kbd>G</kbd> to go to specific page &nbsp;→&nbsp; Use <kbd>↑</kbd>/<kbd>↓</kbd> at list edges to navigate pages</>
          )}
          &nbsp;→&nbsp; Hold <kbd>↑</kbd>/<kbd>↓</kbd> for 300ms to jump to first/last &nbsp;→&nbsp; Press <kbd>Home</kbd>/<kbd>End</kbd> to jump to first/last
        </Typography>
      </Box>
    </Box>
  );
  

  // Render based on view mode
  switch (viewMode) {
    case 'table':
      return (
        <CommonTable
          data={items}
          columns={columns || []}
          stickyLastColumn={stickyLastColumn}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange || (() => {})}
          onPageSizeChange={onPageSizeChange || (() => {})}
          loading={loading}
          filterComponent={filterComponent}
          containerHeight={containerHeight}
          headerStyle={headerStyle}
        />
      );
    
    case 'grid':
      return (
        <Paper sx={{ p: 2, borderRadius: "10px", boxShadow: "none" }}>
          <GridCard 
            items={getGridItems()}
            showFilters={showFilters}
            filterConfig={filterConfig}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showViewToggle={true}
            loading={loading}
            filterComponent={filterComponent}
            // xs={xs}
            // sm={sm}
            // md={md}
            // lg={lg}
            // xl={xl}
            spacing={spacing}
            containerHeight={containerHeight}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            showPageSizeSelector={showPageSizeSelector}
            showTotalItems={showTotalItems}
            showPageNumbers={showPageNumbers}
            maxPageNumbers={maxPageNumbers}
            showMenuIcons={false}
            role={role}
            customerId={customerId}
          />
        </Paper>
      );
    
    case 'keyboard':
      return <KeyboardView />;
    
    default:
      return null;
  }
};

export default GridCardSales;