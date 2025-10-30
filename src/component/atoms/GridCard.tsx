import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  SvgIconProps,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Grid,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import TextInput from './TextInput';
import ViewModeToggle from './ViewModeToggle';
import Pagination from './Pagination';
import img1 from '../../assets/Default-Product-Image.jpg';
import { MultiSearchableDropdown } from './SearchableDropdown';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getOrderHistoryByProductNumber } from '../../redux/apis/retailer/orderApis';
import { getSalesOrderHistoryByProductNumber } from '../../redux/apis/sales/salesOrderApis';
import CustomButton from './CustomButton';

interface HistoryItem {
  orderHeader: {
    Order_Date: string;
  };
  Order_Number: string;
  Invoice_Number?: string;
  status: string;
  Total_Amount: number;
  Quantity_Ordered: number;
  Price: number;
  User_ID?: string;
  Order_Source?: string;
  OTP_Amount_State?: any;
}

const STATUS_STYLES = {
  'in stock': {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#2e7d32',
    border: '1px solid rgba(76, 175, 80, 0.3)',
  },
  'low stock': {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#d32f2f',
    border: '1px solid rgba(244, 67, 54, 0.3)',
  },
  'out of stock': {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#d32f2f',
    border: '1px solid rgba(244, 67, 54, 0.3)',
  },
  Active: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#2e7d32',
    border: '1px solid rgba(76, 175, 80, 0.3)',
  },
  Inactive: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#d32f2f',
    border: '1px solid rgba(244, 67, 54, 0.3)',
  },
  Pending: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    color: '#f57c00',
    border: '1px solid rgba(255, 152, 0, 0.3)',
  },
};

export interface GridCardItem {
  id: string | number;
  _id?: number;
  title: string;
  subtitle: string;
  description: string;
  avatarText: string;
  avatarImage?: string;
  tags?: string[];
  stockCount?: number;
  stock?: 'in stock' | 'low stock' | 'out of stock';
  actions?: {
    icon: React.ReactNode;
    tooltip: string;
    onClick: (item: GridCardItem) => void;
  }[];
  customActions?: React.ReactNode;
  upc?: string;
  price?: number;
  discount?: number;
  isDiscounted?: boolean;
  isNewItem?: boolean;
  hasQtyDiscount?: boolean;
  productDetails?: {
    brand?: string;
    category?: string;
    weight?: string;
    dimensions?: string;
    sku?: string;
    description?: string;
  };
}

export interface FilterConfig {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  salesCategory: { label: string; value: string }[];
  setSalesCategory: (salesCategory: { label: string; value: string }[]) => void;
  priceClass: { label: string; value: string }[];
  setPriceClass: (priceClass: { label: string; value: string }[]) => void;
  salesCategoryOptions: { label: string; value: string }[];
  priceClassOptions: { label: string; value: string }[];
}

interface GridCardProps {
  items: GridCardItem[];
  onItemClick?: (item: GridCardItem) => void;
  spacing?: number;
  showFilters?: boolean;
  filterConfig?: FilterConfig;
  filterComponent?: React.ReactNode;
  viewMode?: 'grid' | 'table';
  setViewMode?: (mode: 'grid' | 'table') => void;
  showViewToggle?: boolean;
  containerHeight?: string | number;
  containerStyle?: React.CSSProperties;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showTotalItems?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  loading?: boolean;
  // New props for grid modal
  showMenuIcons?: boolean;
  role?: string;
  customerId?: any;
}

const GridCard: React.FC<GridCardProps> = ({
  items,
  onItemClick,
  spacing = 2,
  showFilters = false,
  filterConfig,
  filterComponent,
  viewMode,
  setViewMode,
  showViewToggle = false,
  containerHeight = 'auto',
  containerStyle,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showTotalItems = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  loading = false,
  showMenuIcons = true,
  role: propRole,
  customerId: propCustomerId,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const auth = useSelector((state: any) => state.auth);
  
  // Determine role and customerId from props, Redux state, or URL context
  const currentRole = propRole || auth?.role;
  const currentCustomerId = propCustomerId || auth?.selectedCustomer?.C_Number;
  
  // Determine if we're in sales context based on URL path
  const isSalesContext = location.pathname.includes('/sales/');
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = React.useState<GridCardItem | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalItem, setModalItem] = React.useState<GridCardItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, item: GridCardItem) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedItem(item);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleActionClick = (action: (item: GridCardItem) => void) => {
    if (selectedItem) {
      action(selectedItem);
    }
    handleActionMenuClose();
  };

  const handleCardClick = (item: GridCardItem) => {
    console.log(item);
    if (viewMode === 'grid' && !showMenuIcons) {
      setModalItem(item);
      setModalOpen(true);
    } else if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalItem(null);
    setHistory([]);
    setHistoryError(null);
    setHistoryLoading(false);
  };

  const fetchHistory = useCallback(async (itemNumber: string) => {
    if (!itemNumber) return;
    
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      let response: any;
      
      // Determine which API to call based on role and context
      const shouldUseSalesAPI = (currentRole === 'sales' || isSalesContext) && currentCustomerId;
      
      if (shouldUseSalesAPI) {
        // Call sales API with customer ID
        response = await getSalesOrderHistoryByProductNumber(itemNumber, currentCustomerId.toString());
      } else {
        // Call retailer API (default for retailer role or when no sales context)
        response = await getOrderHistoryByProductNumber(itemNumber);
      }

      if (response?.success) {
        const historyData = response?.data || [];
        setHistory(historyData);
      } else {
        setHistoryError(response?.message || 'Failed to fetch order history');
        setHistory([]);
      }
    } catch (err: any) {
      console.error('Error fetching order history:', err);
      setHistoryError(err?.response?.data?.message || 'Failed to fetch order history. Please try again.');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [currentRole, currentCustomerId, isSalesContext]);

  // Fetch history when modal opens
  useEffect(() => {
    if (modalOpen && modalItem?.id) {
      // Extract item number from the item ID or use a property if available
      const itemNumber = modalItem.id.toString();
      fetchHistory(itemNumber);
    }
  }, [modalOpen, modalItem, fetchHistory]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const defaultFilterComponent = showFilters && filterConfig ? (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={{ xs: 1, sm: 2 }}
      mb={2}
      sx={{
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1, sm: 1.5 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        <TextInput
          placeholder="Search by name"
          value={filterConfig.searchTerm}
          onChange={(e: any) => filterConfig.setSearchTerm(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 200 },
            marginBottom: '0px !important',
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        />
        <MultiSearchableDropdown
          options={filterConfig.salesCategoryOptions}
          value={filterConfig.salesCategory}
          onChange={(options) => filterConfig.setSalesCategory(options)}
          sx={{
            minWidth: { xs: 120, sm: 160 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        />
        <MultiSearchableDropdown
          options={filterConfig.priceClassOptions}
          value={filterConfig.priceClass}
          onChange={(options) => filterConfig.setPriceClass(options)}
          sx={{
            minWidth: { xs: 120, sm: 160 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        />
      </Box>
      {showViewToggle && viewMode && setViewMode && (
        <Box sx={{ mt: { xs: 1, sm: 0 } }}>
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
        </Box>
      )}
    </Box>
  ) : null;

  const finalFilterComponent = filterComponent || defaultFilterComponent;

  if (!items || items.length === 0) {
    return (
      <Box>
        {finalFilterComponent}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: { xs: '120px', sm: '180px', md: '200px' },
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            borderRadius: { xs: '10px', sm: '14px', md: '16px' },
            px: { xs: 1, sm: 2 },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
            }}
          >
            No data available
          </Typography>
        </Box>
      </Box>
    );
  }
console.log(modalItem);
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {finalFilterComponent}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          maxHeight: containerHeight,
          position: 'relative',
          padding: { xs: '0px 0px 8px 0px', sm: '0px 10px 10px 0px' },
          ...containerStyle,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing,
            width: '100%',
            justifyContent: 'flex-start',
          }}
        >
          {items?.map((item) => (
            <Box
              key={item.id}
              sx={{
                width: 'calc(20% - 8px)',
                minWidth: '180px',
                maxWidth: '220px',
                flexGrow: 1,
                flexBasis: '180px',
              }}
            >
              <Card
                sx={{
                  cursor: 'default',
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: { xs: '10px', sm: '12px' },
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    '& .product-image': {
                      transform: 'scale(1.05)',
                    },
                    '& .hover-overlay': {
                      opacity: 1,
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: { xs: '2px', sm: '3px' },
                    background: theme.palette.primary.main,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 1,
                  },
                }}
              >
                {/* Product Image Section */}
                <Box
                  onClick={() => (viewMode === 'grid' && !showMenuIcons) && handleCardClick(item)}
                  sx={{
                    position: 'relative',
                    height: { xs: '120px', sm: '160px' },
                    overflow: 'hidden',
                    cursor: (viewMode === 'grid' && !showMenuIcons) ? 'pointer' : 'default',
                  }}
                >
                  <Box
                    component="img"
                    src={item.avatarImage}
                    alt={item.title}
                    className="product-image"
                    onError={(e) => {
                      e.currentTarget.src = img1;
                    }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transition: 'transform 0.3s ease',
                    }}
                  />

                  {/* Advanced Discount Badge */}
                  {(item.isDiscounted || item.hasQtyDiscount) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: { xs: 6, sm: 10, md: 12 },
                        left: { xs: -10, sm: -14, md: -18 },
                        width: { xs: '60px', sm: '75px', md: '90px' },
                        height: { xs: '16px', sm: '18px', md: '22px' },
                        background: '#ff3b30',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                        fontWeight: 600,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        transform: 'rotate(-45deg)',
                        zIndex: 10,
                        animation: 'badgeFloat 3s ease-in-out infinite',
                        borderRadius: '2px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: 0,
                          height: 0,
                          borderLeft: { xs: '8px', sm: '10px', md: '12px' } + ' solid transparent',
                          borderRight: { xs: '8px', sm: '10px', md: '12px' } + ' solid transparent',
                          borderTop: { xs: '8px', sm: '10px', md: '12px' } + ' solid #d32f2f',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                          borderRadius: '2px',
                          animation: 'shimmer 2s ease-in-out infinite',
                        },
                        '@keyframes badgeFloat': {
                          '0%, 100%': {
                            transform: 'rotate(-45deg) translateY(0px)',
                          },
                          '50%': {
                            transform: 'rotate(-45deg) translateY(-3px)',
                          },
                        },
                        '@keyframes shimmer': {
                          '0%': { transform: 'translateX(-100%)' },
                          '100%': { transform: 'translateX(100%)' },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          zIndex: 2,
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          animation: 'textPulse 2s ease-in-out infinite',
                          '@keyframes textPulse': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' },
                          },
                        }}
                      >
                        SALE
                      </Box>
                    </Box>
                  )}

                  {/* New Item Badge - Beautiful vertical badge on right side */}
                  {item.isNewItem && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: { xs: 40, sm: 48, md: 56 },
                        right: { xs: -2, sm: -3, md: -4 },
                        width: { xs: '20px', sm: '24px', md: '28px' },
                        height: { xs: '40px', sm: '48px', md: '56px' },
                        background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #4caf50 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        zIndex: 10,
                        animation: 'newBadgeFloat 3s ease-in-out infinite',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
                          borderRadius: '4px 4px 0 0',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                          borderRadius: '4px',
                          animation: 'newShimmer 2s ease-in-out infinite',
                        },
                        '@keyframes newBadgeFloat': {
                          '0%, 100%': {
                            transform: 'translateY(0px)',
                          },
                          '50%': {
                            transform: 'translateY(-3px)',
                          },
                        },
                        '@keyframes newShimmer': {
                          '0%': { transform: 'translateY(-100%)' },
                          '100%': { transform: 'translateY(100%)' },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          zIndex: 2,
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          animation: 'newTextPulse 2s ease-in-out infinite',
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          '@keyframes newTextPulse': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' },
                          },
                        }}
                      >
                        NEW
                      </Box>
                    </Box>
                  )}

                  {/* 3-dot menu */}
                  {showMenuIcons && item.actions && item.actions.length > 0 && (
                    <IconButton
                      className="menu-button"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionMenuOpen(e, item);
                      }}
                      sx={{
                        position: 'absolute',
                        top: { xs: 4, sm: 6, md: 8 },
                        right: { xs: 4, sm: 6, md: 8 },
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: theme.palette.primary.main,
                        zIndex: 10,
                        '&:hover': {
                          opacity: 1,
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        },
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}

                  {/* Hover Overlay with Product Details */}
                  <Box
                    className="hover-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      cursor: 'pointer',
                      padding: { xs: 1, sm: 2 },
                      pointerEvents: 'none',
                      '& .menu-button': {
                        pointerEvents: 'auto',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: { xs: '8px', sm: '12px' },
                        borderRadius: '8px',
                        backdropFilter: 'blur(4px)',
                        maxWidth: '80%',
                      }}
                    >
                       <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      display: 'block',
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {item.subtitle}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.4,
                      mb: { xs: 1, sm: 2 },
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.description}
                  </Typography>
                      {/* {item.productDetails && (
                        <Box>
                          {item.productDetails.brand && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                color: 'white',
                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                fontWeight: 400,
                              }}
                            >
                              Name: {item.productDetails.description}
                            </Typography>
                          )}
                          {item.productDetails.category && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                color: 'white',
                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                fontWeight: 400,
                              }}
                            >
                              Category: {item.productDetails.category}
                            </Typography>
                          )}
                          {item.productDetails.sku && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                color: 'white',
                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                fontWeight: 400,
                              }}
                            >
                              {item.upc}
                            </Typography>
                          )}
                        </Box>
                      )} */}
                    </Box>
                  </Box>
                </Box>

                {/* Content Section */}
                <CardContent
                  onClick={() => (viewMode === 'grid' && !showMenuIcons) && handleCardClick(item)}
                  sx={{
                    p: { xs: 1, sm: 2 },
                    pb: { xs: '10px !important', sm: '16px !important' },
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    cursor: (viewMode === 'grid' && !showMenuIcons) ? 'pointer' : 'default',
                  }}
                >
                  {/* Stock Status Badge - Top Right of Content */}
                 
                  {/* Product Title */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      lineHeight: 1.3,
                      // maxWidth: '75%',
                      mb: 0.5,
                      // overflow: 'hidden',
                      // textOverflow: 'ellipsis',
                      // whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* Product Subtitle */}
                  {/* <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      display: 'block',
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {item.subtitle}
                  </Typography> */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                  {/* Price Information */}
                  {(item.price || item.discount) && (
                    <Box>
                      {item.price && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            fontWeight: 500,
                            color: theme.palette.primary.main,
                          }}
                        >
                          ${item.price.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                   {(item.stockCount !== undefined || (item.tags && item.tags.length > 0) || item.stock) && (
                    <Box
                    >
                      {item.stockCount !== undefined ? (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                            backgroundColor: 'background.paper',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            borderRadius: '10px',
                            px: 1,
                            py: 0.25,
                          }}
                        >
                          {item.stockCount}
                        </Typography>
                      ) : (
                        <Chip
                          label={(item.stock || (item.tags && item.tags[0]) || '').toString()}
                          size="small"
                          sx={{
                            height: { xs: '16px', sm: '20px' },
                            fontSize: { xs: '0.55rem', sm: '0.6rem' },
                            fontWeight: 500,
                            borderRadius: '10px',
                            textTransform: 'capitalize',
                            ...(STATUS_STYLES[(item.stock || (item.tags && item.tags[0]) || '') as keyof typeof STATUS_STYLES] || {}),
                          }}
                        />
                      )}
                    </Box>
                  )}
</Box>
                  {/* Product Description */}
                  {/* <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.4,
                      mb: { xs: 1, sm: 2 },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      flexGrow: 1,
                    }}
                  >
                    {item.description}
                  </Typography> */}

                  {/* Custom actions at bottom */}
                  {item.customActions && (
                    <Box 
                      onClick={(e) => e.stopPropagation()}
                      sx={{ mt: 'auto', pt: 1 }}
                    >
                      {item.customActions}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[8],
              borderRadius: '8px',
              minWidth: 150,
            },
          }}
        >
          {selectedItem?.actions?.map((action, index) => (
            <MenuItem
              key={index}
              onClick={() => handleActionClick(action.onClick)}
              sx={{
                py: 0.75,
                pl: 1.5,
                pr: 0.5,
                color: theme.palette.primary.main,
                opacity: 1,
                '&:hover': {
                  opacity: 0.7,
                  backgroundColor: `${theme.palette.primary.main}15`,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {React.cloneElement(action.icon as React.ReactElement<SvgIconProps>, {
                  sx: {
                    opacity: 1,
                    fontSize: '1rem',
                  },
                })}
                <Typography sx={{ fontSize: '0.75rem' }}>
                  {action.tooltip}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Pagination Component */}
      {onPageChange && onPageSizeChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          showPageSizeSelector={showPageSizeSelector}
          showTotalItems={showTotalItems}
          showPageNumbers={showPageNumbers}
          maxPageNumbers={maxPageNumbers}
          disabled={loading}
          loading={loading}
        />
      )}

      {/* Grid Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Product Details & History
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {modalItem && (
            <>
              {/* Product Details Section - Matching ProductDetailsModal structure */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  {/* Image & Price Block */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        p: 1,
                        bgcolor: '#fafafa',
                      }}
                    >
                      <Box
                        component="img"
                        src={modalItem.avatarImage || img1}
                        onError={(e: any) => {
                          e.currentTarget.src = img1;
                        }}
                        alt={modalItem.title}
                        sx={{
                          width: '100%',
                          maxHeight: '250px',
                          objectFit: 'contain',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: '#fff',
                        }}
                      />
                      {modalItem.price && (
                        <Typography fontSize="13px" color="text.primary" mb={0.5}>
                          ${modalItem.price.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Detail Fields */}
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Typography
                      fontSize="13.5px"
                      fontWeight={500}
                      color="text.primary"
                      mb={1}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      lineHeight={1.3}
                    >
                      {modalItem.title}
                      {modalItem.stock && (
                        <Chip
                          label={modalItem.stock}
                          size="small"
                          sx={{
                            fontSize: '10px',
                            height: 20,
                            px: 1,
                            backgroundColor:
                              modalItem.stock === 'in stock' ? '#E6F4EA' : '#FDEAEA',
                            color:
                              modalItem.stock === 'in stock' ? '#1BA856' : '#F34E4E',
                            textTransform: 'capitalize',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </Typography>

                    <Grid container spacing={1}>
                      {[
                        ['Pack', modalItem.subtitle?.split('|')[0]?.replace('Pack:', '').trim() || '-'],
                        ['Size', modalItem.subtitle?.split('|')[1]?.replace('Size:', '').trim() || '-'],
                        ['Item #', modalItem.description?.split('|')[2]?.replace('Item :', '').trim() || modalItem.id],
                        ['Unit', modalItem.description?.split('|')[3]?.replace('Unit:', '').trim() || '-'],
                        ['Case', modalItem.description?.split('|')[0]?.replace('Case:', '').trim() || '-'],
                        ['UPC', modalItem.upc || '-'],
                        ['Category', modalItem.productDetails?.category || '-'],
                        ['Subcategory', modalItem.productDetails?.brand || '-'],
                      ].map(([label, value], index) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={index}>
                          <Box sx={{ mb: 1 }}>
                            <Typography fontSize="11.5px" color="text.secondary">
                              {label as string}
                            </Typography>
                            <Typography fontSize="12.5px" color="text.primary" fontWeight={400} sx={{ lineHeight: 1.3 }}>
                              {value as string}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </Box>

              {/* History Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryOutlined fontSize="small" />
                  Order History
                </Typography>
                
                {/* Loading State */}
                {historyLoading && (
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress size={40} />
                  </Box>
                )}

                {/* Error State */}
                {historyError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {historyError}
                  </Alert>
                )}

                {/* No Data Message */}
                {!historyLoading && !historyError && history.length === 0 && (
                  <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    py={4}
                    sx={{ 
                      color: 'text.secondary',
                      backgroundColor: theme.palette.background.default,
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="h6" gutterBottom fontWeight={500}>
                      No Order History
                    </Typography>
                    <Typography variant="body2">
                      This product has no previous orders.
                    </Typography>
                  </Box>
                )}

                {/* History Table */}
                {!historyLoading && !historyError && history.length > 0 && (
                  <TableContainer sx={{
                    maxHeight: "300px",
                    overflow: "auto",
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ 
                            backgroundColor: 'primary.main', 
                            color: '#fff', 
                            fontSize: "12px", 
                            fontWeight: 500, 
                            padding: "8px 12px",
                            minWidth: 120
                          }}>
                            Order Number
                          </TableCell>
                          <TableCell sx={{ 
                            backgroundColor: 'primary.main', 
                            color: '#fff', 
                            fontSize: "12px", 
                            fontWeight: 500, 
                            padding: "8px 12px",
                            minWidth: 100
                          }}>
                            Order Date
                          </TableCell>
                          <TableCell sx={{ 
                            backgroundColor: 'primary.main', 
                            color: '#fff', 
                            fontSize: "12px", 
                            fontWeight: 500, 
                            padding: "8px 12px",
                            minWidth: 80
                          }}>
                            Qty
                          </TableCell>
                          <TableCell sx={{ 
                            backgroundColor: 'primary.main', 
                            color: '#fff', 
                            fontSize: "12px", 
                            fontWeight: 500, 
                            padding: "8px 12px",
                            minWidth: 80
                          }}>
                            Price
                          </TableCell>
                          <TableCell sx={{ 
                            backgroundColor: 'primary.main', 
                            color: '#fff', 
                            fontSize: "12px", 
                            fontWeight: 500, 
                            padding: "8px 12px",
                            minWidth: 100
                          }}>
                            Total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {history.map((item, index) => (
                          <TableRow 
                            key={index}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'action.hover' 
                              },
                              '&:nth-of-type(odd)': { 
                                backgroundColor: 'action.hover' 
                              }
                            }}
                          >
                            <TableCell sx={{ 
                              fontSize: "12px", 
                              color: "text.primary", 
                              padding: "8px 12px",
                              fontWeight: 500
                            }}>
                              {item.Order_Number || '-'}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "12px", 
                              color: "text.secondary", 
                              padding: "8px 12px"
                            }}>
                              {formatDate(item?.orderHeader?.Order_Date || '-')}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "12px", 
                              color: "text.secondary", 
                              padding: "8px 12px",
                            }}>
                              {item.Quantity_Ordered || 0}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "12px", 
                              color: "text.secondary", 
                              padding: "8px 12px"
                            }}>
                              {formatCurrency(item.Price + (item.OTP_Amount_State || 0))}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "12px", 
                              color: "text.primary", 
                              padding: "8px 12px",
                            }}>
                              {formatCurrency((item.Price + (item.OTP_Amount_State || 0)) * item.Quantity_Ordered)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <CustomButton 
            onClick={handleModalClose}
            buttonType="primary"
            appearance="filled"
            fullWidth={false}
          >
            Close
          </CustomButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GridCard;