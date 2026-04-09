/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Chip, 
  useTheme, 
  InputAdornment, 
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { InfoOutlined, HistoryOutlined, ShoppingCart as ShoppingCartIcon, VisibilityOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import GridCard from './GridCard';
import CommonTable, { TableColumn } from './Table/CommonTable';
import { useShowPrepaidTax, calculateDisplayPrice } from '../../utils/prepaidTaxDisplayUtils';
import SalesKeyboardView from './SalesKeyboardView';

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
  // Prepaid tax rate
  prepaidTaxRate?: number;
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
  // Return order flag - disables qty discount functionality
  isReturnOrder?: boolean;
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
  customerId,
  isReturnOrder = false
}) => {
  const theme = useTheme();
  const [quantityInput, setQuantityInput] = useState<{ [key: string]: string }>({});

  const { showWithPerpaidTax } = useShowPrepaidTax();

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
      price: item.showWithOutPrice ? undefined : (() => {
        // Calculate display price based on showWithPerpaidTax setting
        const basePrice = item.price || 0;
        const prepaidTaxRate = item.prepaidTaxRate || 0;
        const taxRate = item.Tax_Rate || 0;
        return calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
      })(),
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
            // Skip qty discount for return orders
            if (!isReturnOrder && item.hasQtyDiscount && item.qtyDiscount && onDiscountModalOpen) {
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
      return (
        <SalesKeyboardView
          items={items}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          masterSearchTerm={masterSearchTerm}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={onPageChange}
          orderItems={orderItems}
          onQuantityChange={onQuantityChange}
          onHistoryClick={onHistoryClick}
          onDiscountModalOpen={onDiscountModalOpen}
          isReturnOrder={isReturnOrder}
        />
      );
    
    default:
      return null;
  }
};

export default GridCardSales;