import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, Typography, Box, IconButton, Chip, Input, Paper, Tooltip } from '@mui/material'
import CustomButton from '../../../component/atoms/CustomButton';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import TextInput from '../../../component/atoms/TextInput';
// import SelectInput from '../../../component/atoms/SelectInput';
import {  VisibilityOutlined, InfoOutlined, HistoryOutlined, ShoppingCart as ShoppingCartIcon, Clear, Pause } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OrderDetails from '../../../component/molecules/OrderDetails';
import ProductDetailsModal from '../../../component/molecules/ProductDetailsModal';
import img1 from '../../../assets/Default-Product-Image.jpg';
import ProductHistoryModal from '../../../component/molecules/ProductHistoryModal';
import PriceChangeModal from '../../../component/molecules/PriceChangeModal';
import InactiveItemsModal from '../../../component/molecules/InactiveItemsModal';
import QuantityDiscountModal from '../../../component/molecules/QuantityDiscountModal';
import cart from '../../../assets/icons/cart.svg';
import ViewModeToggle from '../../../component/atoms/ViewModeToggle';
import GridCard from '../../../component/atoms/GridCard';
// import LoadingSpinner from '../../../component/atoms/loader/LoadingSpinner';
import { getInventoryItems, addToCart, updateCartItem, removeFromCart, clearCart, InventoryParams, getSalesCategoryPriceClassByCustomer, getSalesCategoryByCustomer } from '../../../redux/apis/retailer/orderApis';
import { useEffect, useCallback, useRef } from 'react';
import DeleteConfirmationModal from '../../../component/atoms/DeleteConfirmationModal';
import { MultiSearchableDropdown } from '../../../component/atoms/SearchableDropdown';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { fetchCartItems } from '../../../redux/slices/cartSlice';
import { useSelector } from 'react-redux';
import { validateAddToCart, validateUpdateQuantity, validateCartForCheckout } from '../../../utils/cartValidationUtils';
import { roundPrepaidTax } from '../../../utils/prepaidTaxUtils';
import { useShowPrepaidTax, calculateDisplayPrice } from '../../../utils/prepaidTaxDisplayUtils';
import scanIcon from '../../../assets/elements.svg';

// API Response Interface
interface ApiProduct {
  Pack: number;
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  price: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  UPCList: Array<{ UPC_Number: string }>;
  SalesCategory: string;
  PriceClass: string;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  Tax_Rate: number;
  priceWithTax: number;
  isDiscounted: boolean;
  isNewItem: boolean;
  UnitOunces: any;
  // New inventory fields
  showTheInventoryStock: boolean;
  Inventory_OnHand: number;
  showWithOutPrice: boolean;
  allowToOrder: boolean;
  showLowStock: boolean;
  // Product limit fields
  hasProductLimit: boolean;
  productLimit: number | null;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  // Prepaid tax rate
  prepaidTaxRate?: number;
}

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
  allowToOrder: boolean;
  // Product limit fields
  hasProductLimit: boolean;
  productLimit: number | null;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  isDiscounted?: boolean;
  isNewItem?: boolean;
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

// Function to get the appropriate image URL based on showDistributorImage flag
// Priority: distributorImage (if showDistributorImage is true) > masterImage > dummy image
const getProductImage = (apiProduct: ApiProduct): string => {
  if (apiProduct.showDistributorImage && apiProduct.distributorImage) {
    return apiProduct.distributorImage;
  } else if (apiProduct.masterImage) {
    return apiProduct.masterImage;
  } else {
    // Fallback to dummy image
    return img1; // Using product1.png as dummy image
  }
};

// Function to transform API response to Product interface
// Maps the new API structure to the existing Product interface
const transformApiProduct = (apiProduct: ApiProduct): Product => {
  
  // Safely handle missing or undefined fields
  const itemNumber = apiProduct.Item_Number || (apiProduct as any).id || 0;
  const description = apiProduct.Description || (apiProduct as any).name || '';
  const pack = apiProduct.Pack || apiProduct.CaseCount || "";
  const caseCount = apiProduct.CaseCount || apiProduct.Pack || "";
  const uom = apiProduct.UOM || '';
  const unitOunces = apiProduct.UnitOunces || 0;
  const price = apiProduct.price || apiProduct.Price1 || 0;
  const price1 = apiProduct.Price1 || apiProduct.price || 0;
  const taxRate = apiProduct.Tax_Rate || 0;
  const priceWithTax = apiProduct.priceWithTax || price;
  const salesCategory = apiProduct.SalesCategory || '';
  const priceClass = apiProduct.PriceClass || '';
  const upcList = apiProduct.UPCList || [];
  const showTheInventoryStock = apiProduct.showTheInventoryStock || false;
  const inventoryOnHand = apiProduct.Inventory_OnHand || 0;
  const showWithOutPrice = apiProduct.showWithOutPrice || false;
  const allowToOrder = apiProduct.allowToOrder !== false; // Default to true if not specified
  const showLowStock = apiProduct.showLowStock || false;
  const hasProductLimit = apiProduct.hasProductLimit || false;
  const productLimit = apiProduct.productLimit || null;
  const hasQtyDiscount = apiProduct.hasQtyDiscount || false;
  const qtyDiscount = apiProduct.qtyDiscount || null;
  const isDiscounted = apiProduct.isDiscounted || false;
  const isNewItem = apiProduct.isNewItem || false;
  const prepaidTaxRate = apiProduct.prepaidTaxRate || 0;
  // Determine stock status based on API flags
  let stock: 'in stock' | 'low stock' | 'out of stock' = 'in stock';
  let stockCount: number | undefined;

  if (showTheInventoryStock) {
    // If showing inventory stock, only show the count
    stockCount = inventoryOnHand;
    stock = 'in stock'; // Default for display purposes, but count will be shown
  } else {
    // If not showing inventory stock, determine stock status based on showLowStock
    stock = showLowStock ? 'out of stock' : 'in stock';
  }

  return {
    id: itemNumber.toString(),
    image: getProductImage(apiProduct),
    name: description,
    itemNumber: itemNumber.toString(),
    pack: pack.toString(),
    case: caseCount.toString(),
    size: uom,
    UnitOunces: unitOunces,
    stock,
    stockCount,
    price: price, // Base price (Price from API)
    crvPrice: price1, // Using Price1 as CRV price
    quantity: 0, // Default quantity
    upc: upcList[0]?.UPC_Number,
    subCategory: priceClass, 
    category: salesCategory,
    Tax_Rate: taxRate,
    priceWithTax: priceWithTax, // Price with tax (main price for display and calculations)
    showWithOutPrice: showWithOutPrice,
    allowToOrder: allowToOrder,
    hasProductLimit: hasProductLimit,
    productLimit: productLimit,
    hasQtyDiscount: hasQtyDiscount,
    qtyDiscount: qtyDiscount,
    isDiscounted: isDiscounted,
    isNewItem: isNewItem,
    prepaidTaxRate: prepaidTaxRate,
    productDetails: {
      brand: priceClass,
      category: salesCategory,
      sku: itemNumber.toString(),
      weight: '-', // Not available in API response 
      dimensions: '-', // Not available in API response
      description: description
    }
  };
};

// Reusable ProductImage component with error handling
const ProductImage: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => {
  // const [imgSrc, setImgSrc] = useState(src);
  // const [hasError, setHasError] = useState(false);

  // const handleError = () => {
  //   if (!hasError) {
  //     setImgSrc(img1); // Fallback to dummy image
  //     setHasError(true);
  //   }
  // };

  // Reset when src changes
    // React.useEffect(() => {
    //   setImgSrc(src);
    //   setHasError(false);
    // }, [src]);

  return (
    <img 
      src={src} 
      alt={alt} 
      style={style}
      onError={(e) => {
        e.currentTarget.src = img1;
      }}
      // onError={handleError}
    />
  );
};

const Order = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const theme = useTheme();
  const dispatch = useAppDispatch();
  const [data, setData] = useState([]);
  
  // Get dashboard data from Redux store
  const dashboardData = useAppSelector((state: any) => state.dashboard);
  // Get cart validation data from Redux store
  const cartValidationData = useAppSelector((state: any) => state.cart);
  // Get auth data from Redux store
  const auth = useSelector((state: any) => state.auth);
  
  // Get showWithPerpaidTax setting
  const { showWithPerpaidTax } = useShowPrepaidTax();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [masterSearchTerm, setMasterSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Add ref to track if cart has been loaded
  const cartLoadedRef = useRef(false);
  // Add ref to track pending API calls to prevent redundant calls
  const pendingApiCallRef = useRef<{ [key: string]: boolean }>({});
  // Add debounce timer ref for quantity changes
  const quantityDebounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  // Add debounce timer ref for manual quantity input changes
  const manualInputDebounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Debounce search term to prevent too many API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search term changes
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize search parameters from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    const masterSearchQuery = searchParams.get('masterSearch');
    const viewAllQuery = searchParams.get('viewAll');
    
    // Set search parameters immediately
    if (searchQuery && searchQuery.trim() !== '') {
      setSearchTerm(searchQuery);
      setDebouncedSearchTerm(searchQuery);
    }
    
    if (masterSearchQuery) {
      setMasterSearchTerm(masterSearchQuery);
    }
    
    if (viewAllQuery) {
      setViewAllType(viewAllQuery);
    }
    
    setIsInitialized(true);
  }, []); // Only run on mount
  const [salesCategory, setSalesCategory] = useState<{ label: string; value: string }[]>([]);
  const [priceClass, setPriceClass] = useState<{ label: string; value: string }[]>([]);
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const [priceClassOptions, setPriceClassOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingSalesCategory, setLoadingSalesCategory] = useState(false);
  const [loadingPriceClass, setLoadingPriceClass] = useState(false);
  const [userSalesCategory, setUserSalesCategory] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<{ [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } }>({});
  const [cartItemsData, setCartItemsData] = useState<{ [key: string]: Product }>({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' >('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [priceChangeModalOpen, setPriceChangeModalOpen] = useState(false);
  const [priceChangeItems, setPriceChangeItems] = useState<any[]>([]);
  const [inactiveItemsModalOpen, setInactiveItemsModalOpen] = useState(false);
  const [inactiveItems, setInactiveItems] = useState<any[]>([]);
  const [inactiveItemsLoading, setInactiveItemsLoading] = useState(false);
  
  // Quantity discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] = useState<Product | null>(null);
  const [selectedDiscountData, setSelectedDiscountData] = useState<any>(null);
  const [viewAllType, setViewAllType] = useState<string | null>(null);
  // QR Code scanning state
  const [isQrScanning, setIsQrScanning] = useState(false);
  // QR scanning disabled modal
  const [qrDisabledModalOpen, setQrDisabledModalOpen] = useState(false);
  const [qrDisabledMessage, setQrDisabledMessage] = useState('');
  
  // Add loading state for individual products
  const [productLoadingStates, setProductLoadingStates] = useState<{ [key: string]: boolean }>({});
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Helper function to set loading state for a specific product
  const setProductLoading = (productId: string, isLoading: boolean) => {
    setProductLoadingStates(prev => ({
      ...prev,
      [productId]: isLoading
    }));
  };

  // Helper function to check if a product is currently loading
  const isProductLoading = (productId: string) => {
    return productLoadingStates[productId] || false;
  };

  // Helper function to calculate cart payload with prepaidTaxRate
  // New calculation: Price_With_Tax = Price_With_Tax * (1 + prepaidTaxRate)
  // Where base Price_With_Tax = price + Tax_Rate
  const calculateCartPayload = (product: Product, quantity: number, finalPriceWithTax?: number) => {
    // Convert all values to numbers to prevent string operations
    const basePrice = Number(product.price) || 0;
    const prepaidTaxRate = Number(product.prepaidTaxRate) || 0;
    const taxRate = Number(product.Tax_Rate) || 0;
    const qty = Number(quantity) || 0;
    
    let priceWithTax: number;
    let price: number;
    let prepaidTaxPerUnit: number;
    let totalPrepaidTax: number;
    
    if (finalPriceWithTax !== undefined) {
      // For discounted items, use the provided finalPriceWithTax
      priceWithTax = Number(finalPriceWithTax) || 0;
      
      // Calculate base Price_With_Tax (before prepaid tax): finalPriceWithTax / (1 + prepaidTaxRate)
      const basePriceWithTax = prepaidTaxRate > 0 ? priceWithTax / (1 + prepaidTaxRate) : priceWithTax;
      
      // Calculate price from basePriceWithTax: basePriceWithTax - Tax_Rate
      price = basePriceWithTax - taxRate;
      
      // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
      prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
      // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
      totalPrepaidTax = prepaidTaxPerUnit * qty;
    } else {
      // Standard calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = basePrice + taxRate;
      
      // Calculate final Price_With_Tax: basePriceWithTax * (1 + prepaidTaxRate)
      priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
      price = basePrice;
      
      // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
      prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
      // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
      totalPrepaidTax = prepaidTaxPerUnit * qty;
    }
    
    // Calculate total price with tax: Price_With_Tax * qty
    const totalPriceWithTax = priceWithTax * qty;
    
    return {
      Price: Number(Number(price).toFixed(2)),
      Price_With_Tax: Number(Number(priceWithTax).toFixed(2)),
      Qty: Number(qty),
      Tax_Rate: Number(Number(taxRate).toFixed(2)),
      TotalPrice: Number(Number(price * qty).toFixed(2)),
      TotalPriceWithTax: Number(Number(totalPriceWithTax).toFixed(2)),
      originalPrice: Number(Number(basePrice).toFixed(2)),
      prepaidTaxRate: Number(Number(prepaidTaxRate).toFixed(4)), // Pass actual prepaidTaxRate from API
      TotalprepaidTaxRate: roundPrepaidTax(totalPrepaidTax)
    };
  };

  // Handle manual quantity input changes with debouncing
  const handleManualQuantityChange = (id: string, newQuantity: number) => {
    const item: any = data.find((item: any) => item.id === id) || cartItemsData[id];
    if (!item) return;

    // Check if item is allowed to be ordered
    if (!item.allowToOrder) {
      return;
    }

    // Reset QR scanning when cart is manually modified
    resetQrScanning();

    // Update local state immediately for better UX
    setOrderItems(prev => ({
      ...prev,
      [id]: {
        quantity: newQuantity,
        Description: item.name,
        price: item.priceWithTax, // Use priceWithTax as main price
        productId: prev[id]?.productId || 0,
        placedBySalesPerson: item?.Product?.placedBySalesPerson || false
      }
    }));

    // Clear any existing debounce timer for this item
    if (manualInputDebounceRef.current[id]) {
      clearTimeout(manualInputDebounceRef.current[id]);
    }

    // Set a new debounce timer to trigger API call after user stops typing
    manualInputDebounceRef.current[id] = setTimeout(async () => {
      // Prevent redundant API calls
      if (pendingApiCallRef.current[id] || isProductLoading(id)) {
        return;
      }

      // Call the blur handler to process the quantity change
      await handleQuantityInputBlur(id, newQuantity);
    }, 1000); // 1 second delay after user stops typing
  };
  
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleHistoryClick = (product: Product) => {
    setSelectedHistoryProduct(product);
    setIsHistoryModalOpen(true);
  };



  const handleDiscountConfirm = (discountInfo: any) => {
    if (selectedDiscountProduct && discountInfo) {
      try {
        // Apply the discount and add the specified quantity to cart
        const product = selectedDiscountProduct;
        
        // Use the quantity that was manually typed by user, or fall back to minimum discount quantity
        const currentQuantity = orderItems[product.id]?.quantity || 0;
        const quantity = currentQuantity > 0 ? currentQuantity : discountInfo.minQty;
        
        // Calculate discounted price
        // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
        const basePrice = product.price;
        const prepaidTaxRate = product.prepaidTaxRate || 0;
        const taxRate = product.Tax_Rate || 0;
        
        let discountedBasePrice = basePrice;
        if (discountInfo.type === 'case') {
          // Case discount: apply percentage discount to base price
          const discountAmount = (basePrice * discountInfo.discountPercentage) / 100;
          discountedBasePrice = basePrice - discountAmount;
        } else if (discountInfo.type === 'quantity') {
          // Quantity discount: apply based on discount tier to base price
          if (discountInfo.discount.hasPercentageDiscount) {
            const discountAmount = (basePrice * discountInfo.discount.perDiscount) / 100;
            discountedBasePrice = basePrice - discountAmount;
          } else {
            // Apply amount discount to base price
            discountedBasePrice = basePrice - discountInfo.discount.amountDiscount;
          }
        }
        
        // Ensure discounted base price doesn't go below 0
        discountedBasePrice = Math.max(0, discountedBasePrice);
        
        // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
        const basePriceWithTax = Number(Number(discountedBasePrice + taxRate).toFixed(2));
        const discountedPrice = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
        
        // Update local state with discounted price
        setOrderItems(prev => ({
          ...prev,
          [product.id]: {
            quantity: quantity,
            Description: product.name,
            price: discountedPrice, // Use discounted price
            productId: prev[product.id]?.productId || 0,
            placedBySalesPerson: false
          }
        }));
        
        // Add to cart via API with discounted price
        setTimeout(async () => {
          try {
            const payload = calculateCartPayload(product, quantity, discountedPrice);
            await addToCart({
              Item_Number: parseInt(product.id),
              ...payload
            });
            
            // Refresh cart data
            cartLoadedRef.current = false;
            await loadCartItems();
            
            showToast(`Discount applied! Added ${quantity} ${product.name} to cart with discounted price.`, 'success');
          } catch (error) {
            console.error('Failed to add discounted item to cart:', error);
            showToast('Failed to add discounted item to cart. Please try again.', 'error');
          }
        }, 300);
        
        // Close the modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
      } catch (error) {
        console.error('Error applying discount:', error);
        showToast('Failed to apply discount. Please try again.', 'error');
      }
    }
  };

  // Function to handle opening discount modal
  const handleDiscountModalOpen = (product: any, discountData: any) => {
    setSelectedDiscountProduct(product);
    setSelectedDiscountData(discountData);
    setDiscountModalOpen(true);
  };

  // Function to handle no discount selection - add 1 quantity without discount
  const handleNoDiscount = async () => {
    if (selectedDiscountProduct) {
      try {
        const product = selectedDiscountProduct;
        
        // Add 1 quantity without discount
        const quantity = 1;
        
        // Update local state
        setOrderItems(prev => ({
          ...prev,
          [product.id]: {
            quantity: quantity,
            Description: product.name,
            price: product.priceWithTax, // Use original price (no discount)
            productId: prev[product.id]?.productId || 0,
            placedBySalesPerson: false
          }
        }));
        
        // Add to cart via API with original price
        setTimeout(async () => {
          try {
            const payload = calculateCartPayload(product, quantity);
            await addToCart({
              Item_Number: parseInt(product.id),
              ...payload
            });
            
            // Refresh cart data
            cartLoadedRef.current = false;
            await loadCartItems();
            
            showToast(`Added ${quantity} ${product.name} to cart without discount.`, 'success');
          } catch (error) {
            console.error('Failed to add item to cart:', error);
            showToast('Failed to add item to cart. Please try again.', 'error');
          }
        }, 300);
        
        // Close the modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
      } catch (error) {
        console.error('Error adding item without discount:', error);
        showToast('Failed to add item to cart. Please try again.', 'error');
      }
    }
  };

  const getInventoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // If viewAll mode is active, use dashboard data from Redux store (no API call)
    if (viewAllType) {
      let dashboardItems: any[] = [];
      
      switch (viewAllType) {
        case 'new':
          dashboardItems = dashboardData.newItems || [];
          break;
        case 'discounted':
          dashboardItems = dashboardData.discountedItems || [];
          break;
        case 'popular':
          dashboardItems = dashboardData.popularItems || [];
          break;
        default:
          dashboardItems = [];
      }
      
      // Dashboard data is already transformed, just ensure it has the correct structure
      const transformedDashboardData: any = dashboardItems.map((item: any) => {
        // Dashboard data is already in Product format, but ensure stockCount is set correctly
        return {
          ...item,
          stockCount: item.showTheInventoryStock ? item.Inventory_OnHand : undefined
        };
      });
      
      setData(transformedDashboardData);
      setTotalItems(dashboardItems.length);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    
    // Only call main API if not in viewAll mode (normal order page access)
    try {
      const params: InventoryParams = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
        masterSearch: masterSearchTerm,
        salesCategoryId: salesCategory.map(cat => cat.value),
        priceClassId: priceClass.map(pc => pc.value),
        salesCategory: userSalesCategory
      } as any;
      
      const response:any = await getInventoryItems(params);
      
      // Transform API response to match Product interface
      const transformedData = (response?.data?.finalProductList || []).map((apiProduct: ApiProduct) => 
        transformApiProduct(apiProduct)
      );
      
      setData(transformedData);
      setTotalItems(response?.data?.totalCount || 0);
      setTotalPages(Math.ceil(response?.data?.totalCount / pageSize) || 0);
    } catch (error) {
      console.log(error);
      setError('Failed to load inventory data. Please try again.');
      // Set empty data on error
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, masterSearchTerm, salesCategory, priceClass, viewAllType, dashboardData, userSalesCategory]);

  // Load cart items on component mount
  const loadCartItems = useCallback(async () => {
    // Prevent multiple calls if already loaded
    if (cartLoadedRef.current) {
      return;
    }
    
    try {
      const result = await dispatch(fetchCartItems());
      if (fetchCartItems.fulfilled.match(result)) {
        const response = result.payload;
        if (response) {
          const cartItems: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } } = {};
          const cartItemsData: { [key: string]: Product } = {};
          
          // Check for price changes
          const itemsWithPriceChanges = response?.finalCartItems?.filter((item: any) => item.isPriceChanged);
          
          if (itemsWithPriceChanges && itemsWithPriceChanges.length > 0) {
            setPriceChangeItems(itemsWithPriceChanges);
            setPriceChangeModalOpen(true);
          }
          
          // Check for inactive items
          const itemsWithInactiveStatus = response?.finalCartItems?.filter((item: any) => item.itemInActive);
          
          if (itemsWithInactiveStatus && itemsWithInactiveStatus.length > 0) {
            setInactiveItems(itemsWithInactiveStatus);
            setInactiveItemsModalOpen(true);
          }
          
          response?.finalCartItems?.forEach((item: any) => {
            // Create a product object from the cart item data
            const productData = {
              Pack: item.CaseCount || 1,
              Description: item.Description,
              Item_Number: item.Item_Number,
              CaseCount: item.CaseCount || 1,
              UOM: item.UOM || '',
              Price1: item.Price1 || item.price || 0,
              price: item.price || item.Price1 || 0,
              BaseCost: item.BaseCost || 0,
              Invoice_Cost: item.Invoice_Cost || 0,
              AvgCost: item.AvgCost || 0,
              NetCost: item.NetCost || 0,
              UPCList: [],
              SalesCategory: '',
              PriceClass: '',
              showDistributorImage: item.showDistributorImage || false,
              distributorImage: item.distributorImage,
              masterImage: item.masterImage,
              Tax_Rate: item.Product?.Tax_Rate || 0,
              priceWithTax: item.Product?.Price_With_Tax || 0,
              TotalPrice: item.Product?.TotalPrice || 0,
              TotalPriceWithTax: item.Product?.TotalPriceWithTax || 0,
              UnitOunces: item.UnitOunces || 0,
              // New inventory fields
              showTheInventoryStock: item.showTheInventoryStock || false,
              Inventory_OnHand: item.Inventory_OnHand || 0,
              showWithOutPrice: item.showWithOutPrice || false,
              allowToOrder: item.allowToOrder !== false, // Default to true if not specified
              showLowStock: item.showLowStock || false,
              // Product limit fields
              hasProductLimit: item.hasProductLimit || false,
              productLimit: item.productLimit || null,
              // Quantity discount fields
              hasQtyDiscount: item.hasQtyDiscount || false,
              qtyDiscount: item.qtyDiscount || null,
              isDiscounted: item.isDiscounted || false,
              isNewItem: item.isNewItem || false,
              // Prepaid tax rate
              prepaidTaxRate: item.prepaidTaxRate || 0
            };
            
            const product = transformApiProduct(productData);
            const itemId = item.Item_Number.toString();
            
            cartItems[itemId] = {
              quantity: item.Product?.Qty || 0,
              price: parseFloat(item.Product?.Price_With_Tax) || parseFloat(item.Product?.Price) || item.price || 0,
              Description: item.Description || "",
              productId: item.Product?.id || 0,
              placedBySalesPerson: item.Product?.placedBySalesPerson || false
            };
            
            cartItemsData[itemId] = product;
          });
          
          setOrderItems(cartItems);
          setCartItemsData(cartItemsData);
          cartLoadedRef.current = true; // Mark as loaded
        }
      }
    } catch (error) {
      console.error('Failed to load cart items:', error);
      // Fallback to persisted cart data if server request fails
      const persistedCartItems = cartValidationData.items || [];
      if (persistedCartItems.length > 0) {
        const cartItems: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } } = {};
        const cartItemsData: { [key: string]: Product } = {};
        
        persistedCartItems.forEach((item: any) => {
          const productData = {
            Pack: item.CaseCount || 1,
            Description: item.Description,
            Item_Number: item.Item_Number,
            CaseCount: item.CaseCount || 1,
            UOM: item.UOM || '',
            UnitOunces: item.UnitOunces || 0,
            Price1: item.Price1 || item.price || 0,
            price: item.price || item.Price1 || 0,
            BaseCost: item.BaseCost || 0,
            Invoice_Cost: item.Invoice_Cost || 0,
            AvgCost: item.AvgCost || 0,
            NetCost: item.NetCost || 0,
            UPCList: [],
            SalesCategory: '',
            PriceClass: '',
            showDistributorImage: item.showDistributorImage || false,
            distributorImage: item.distributorImage,
            masterImage: item.masterImage,
            Tax_Rate: item.Product?.Tax_Rate || 0, 
            priceWithTax: item.Product?.Price_With_Tax || 0,
            TotalPrice: item.Product?.TotalPrice || 0,
            TotalPriceWithTax: item.Product?.TotalPriceWithTax || 0,
            showTheInventoryStock: item.showTheInventoryStock || false,
            Inventory_OnHand: item.Inventory_OnHand || 0,
            showWithOutPrice: item.showWithOutPrice || false,
            allowToOrder: item.allowToOrder !== false,
            showLowStock: item.showLowStock || false,
            // Product limit fields
            hasProductLimit: item.hasProductLimit || false,
            productLimit: item.productLimit || null,
            // Quantity discount fields
            hasQtyDiscount: item.hasQtyDiscount || false,
            qtyDiscount: item.qtyDiscount || null,
            isDiscounted: item.isDiscounted || false,
            isNewItem: item.isNewItem || false,
            // Prepaid tax rate
            prepaidTaxRate: item.prepaidTaxRate || 0
          };
          
          const product = transformApiProduct(productData);
          const itemId = item.Item_Number.toString();
          
          cartItems[itemId] = {
            quantity: item.Product?.Qty || 0,
            price: parseFloat(item.Product?.Price_With_Tax) || parseFloat(item.Product?.Price) || item.price || 0,
            Description: item.Description || "",
            productId: item.Product?.id || 0,
            placedBySalesPerson: item.Product?.placedBySalesPerson || false
          };
          
          cartItemsData[itemId] = product;
        });
        
        setOrderItems(cartItems);
        setCartItemsData(cartItemsData);
        cartLoadedRef.current = true; // Mark as loaded
      }
    }
  }, []); // Remove dispatch dependency since it's stable

  // Load cart items on mount only once
  useEffect(() => {
    if (!cartLoadedRef.current) {
      loadCartItems();
    }
    
    // Cleanup function to reset ref on unmount
    return () => {
      cartLoadedRef.current = false;
      // Clear all pending debounce timers
      Object.values(quantityDebounceRef.current).forEach(timer => clearTimeout(timer));
      quantityDebounceRef.current = {};
      // Clear all manual input debounce timers
      Object.values(manualInputDebounceRef.current).forEach(timer => clearTimeout(timer));
      manualInputDebounceRef.current = {};
      pendingApiCallRef.current = {};
      // Clear all loading states
      setProductLoadingStates({});
    };
  }, []); // Empty dependency array - only run on mount

  // Sync with persisted cart data when it becomes available (only if local state is empty)
  useEffect(() => {
    if (cartValidationData.items && cartValidationData.items.length > 0 && Object.keys(orderItems).length === 0 && !cartLoadedRef.current) {
      const cartItems: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } } = {};
      const cartItemsData: { [key: string]: Product } = {};
      
      cartValidationData.items.forEach((item: any) => {
        const productData = {
          Pack: item.CaseCount || 1,
          Description: item.Description,
          Item_Number: item.Item_Number,
          CaseCount: item.CaseCount || 1,
          UOM: item.UOM || '',
          UnitOunces: item.UnitOunces || 0,
          Price1: item.Price1 || item.price || 0,
          price: item.price || item.Price1 || 0,
          BaseCost: item.BaseCost || 0,
          Invoice_Cost: item.Invoice_Cost || 0,
          AvgCost: item.AvgCost || 0,
          NetCost: item.NetCost || 0,
          UPCList: [],
          SalesCategory: '',
          PriceClass: '',
          showDistributorImage: item.showDistributorImage || false,
          distributorImage: item.distributorImage,
          masterImage: item.masterImage,
          Tax_Rate: item.Product?.Tax_Rate || 0, 
          priceWithTax: item.Product?.Price_With_Tax || 0,
          TotalPrice: item.Product?.TotalPrice || 0,
          TotalPriceWithTax: item.Product?.TotalPriceWithTax || 0,
          showTheInventoryStock: item.showTheInventoryStock || false,
          Inventory_OnHand: item.Inventory_OnHand || 0,
          showWithOutPrice: item.showWithOutPrice || false,
          allowToOrder: item.allowToOrder !== false,
          showLowStock: item.showLowStock || false,
          // Product limit fields
          hasProductLimit: item.hasProductLimit || false,
          productLimit: item.productLimit || null,
          // Quantity discount fields
          hasQtyDiscount: item.hasQtyDiscount || false,
          qtyDiscount: item.qtyDiscount || null,
          isDiscounted: item.isDiscounted || false,
          isNewItem: item.isNewItem || false
        };
        
        const product = transformApiProduct(productData);
        const itemId = item.Item_Number.toString();
        
        cartItems[itemId] = {
          quantity: item.Product?.Qty || 0,
          price: parseFloat(item.Product?.Price_With_Tax) || parseFloat(item.Product?.Price) || item.price || 0,
          Description: item.Description || "",
          productId: item.Product?.id || 0,
          placedBySalesPerson: item.Product?.placedBySalesPerson || false
        };
        
        cartItemsData[itemId] = product;
      });
      
      setOrderItems(cartItems);
      setCartItemsData(cartItemsData);
      cartLoadedRef.current = true; // Mark as loaded
    }
  }, [cartValidationData.items]); // Only depend on cartValidationData.items

  // Handle URL search parameters when location changes (for navigation)
  useEffect(() => {
    if (isInitialized) {
      const searchParams = new URLSearchParams(location.search);
      const searchQuery = searchParams.get('search');
      const masterSearchQuery = searchParams.get('masterSearch');
      const viewAllQuery = searchParams.get('viewAll');
      
      // Handle search parameter - only set if it's not empty
      if (searchQuery && searchQuery.trim() !== '') {
        setSearchTerm(searchQuery);
        setDebouncedSearchTerm(searchQuery);
      } else if (searchQuery === null) {
        // If search parameter is not present, keep current search term
        // Don't clear it
      } else {
        // If search parameter is empty string, clear the search
        setSearchTerm('');
        setDebouncedSearchTerm('');
      }
      
      // Handle masterSearch parameter
      if (masterSearchQuery) {
        setMasterSearchTerm(masterSearchQuery);
      } else {
        setMasterSearchTerm('');
      }
      
      // Handle viewAll parameter
      if (viewAllQuery) {
        setViewAllType(viewAllQuery);
        // Clear other search parameters when in viewAll mode
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setMasterSearchTerm('');
      } else {
        setViewAllType(null);
      }
    }
  }, [location.search, isInitialized]);

  // Trigger API call when search parameters change (only if not in viewAll mode)
  useEffect(() => {
    if (isInitialized && !viewAllType) {
      getInventoryData();
    }
  }, [debouncedSearchTerm, masterSearchTerm, isInitialized, getInventoryData]);

  // Trigger data update when dashboard data changes (only in viewAll mode)
  useEffect(() => {
    if (isInitialized && viewAllType) {
      getInventoryData();
    }
  }, [dashboardData, viewAllType, isInitialized, getInventoryData]);

  // Fetch filter options on mount using getSalesCategoryPriceClassByCustomer
  useEffect(() => {
    const customerId = auth?.storeDetail?.C_Number || auth?.selectedCustomer?.C_Number;
    if (!customerId) {
      console.log('Retailer Order: Skipping filter API call - customer ID not available');
      return;
    }
    
    const fetchFilterOptions = async () => {
      setLoadingSalesCategory(true);
      setLoadingPriceClass(true);
      try {
        const response = await getSalesCategoryPriceClassByCustomer(customerId) as any;
        console.log('Retailer Order - getSalesCategoryPriceClassByCustomer response:', response);
        
        // Populate sales category options
        const salesCategories = response?.data?.salesCategories || [];
        setSalesCategoryOptions(salesCategories?.map((cat: any) => {
          return {
            label: cat.Category_Desc,
            value: cat.Sales_Category.toString()
          }
        }));
        
        // Populate price class options
        const priceClasses = response?.data?.priceClasses || [];
        setPriceClassOptions(priceClasses?.map((pc: any) => {
          return {
            label: pc.Class_Desc,
            value: pc.Price_Class.toString()
          }
        }));
      } catch (error) {
        console.error('Retailer Order - Error fetching filter options:', error);
      } finally {
        setLoadingSalesCategory(false);
        setLoadingPriceClass(false);
      }
    };
    
    fetchFilterOptions();
  }, [auth?.storeDetail?.C_Number, auth?.selectedCustomer?.C_Number]);

  // Fetch user sales categories for API payload
  useEffect(() => {
    const customerId = auth?.storeDetail?.C_Number || auth?.selectedCustomer?.C_Number;
    if (!customerId) {
      return;
    }
    const fetchUserSalesCategory = async () => {
      try {
        const response = await getSalesCategoryByCustomer(customerId) as any;
        console.log('Retailer Order - getSalesCategoryByCustomer response:', response);
        const categories = response?.data || [];
        setUserSalesCategory(categories);
      } catch (error) {
        console.error('Retailer Order - Error fetching user sales categories:', error);
      }
    };
    fetchUserSalesCategory();
  }, [auth?.storeDetail?.C_Number, auth?.selectedCustomer?.C_Number]);

  // Optimized quantity change handler with debouncing
  const handleQuantityChange = async (id: string, change: number) => {
    const item:any = data.find((item:any) => item.id === id) || cartItemsData[id];
    if (!item) return;

    // Check if item is allowed to be ordered
    if (!item.allowToOrder) {
      return;
    }

    // Check if product is already loading
    if (isProductLoading(id)) {
      return;
    }

    // Reset QR scanning when cart is manually modified
    resetQrScanning();

    const currentItem = orderItems[id];
    const newQuantity = (currentItem?.quantity || 0) + change;
    
    if (newQuantity <= 0) {
      // Remove item from cart
      setProductLoading(id, true);
      try {
        const productId = currentItem?.productId;
        if (productId) {
          await removeFromCart(productId);
        }
        setOrderItems(prev => {
          const {...rest} = prev;
          delete rest[id];
          return rest;
        });
        setCartItemsData(prev => {
          const {...rest} = prev;
          delete rest[id];
          return rest;
        });
        
        // Clear any pending debounce for this item
        if (quantityDebounceRef.current[id]) {
          clearTimeout(quantityDebounceRef.current[id]);
          delete quantityDebounceRef.current[id];
        }

        // Clear any pending manual input debounce for this item
        if (manualInputDebounceRef.current[id]) {
          clearTimeout(manualInputDebounceRef.current[id]);
          delete manualInputDebounceRef.current[id];
        }
        
        // Refresh cart data from server to ensure consistency
        cartLoadedRef.current = false;
        await loadCartItems();
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
      } finally {
        setProductLoading(id, false);
      }
      return;
    }

    // Validate quantity limit before updating
    const productLimitData = {
      hasProductLimit: item.hasProductLimit,
      productLimit: item.productLimit
    };
    if (!validateUpdateQuantity(newQuantity, productLimitData, item.name)) {
      return;
    }

    // Update local state immediately for better UX
    setOrderItems(prev => ({
      ...prev,
      [id]: {
        quantity: newQuantity,
        Description: item.name,
        price: item.priceWithTax, // Use priceWithTax as main price
        productId: currentItem?.productId || 0,
        placedBySalesPerson: item?.Product?.placedBySalesPerson
      }
    }));

    // Clear any existing debounce timer for this item
    if (quantityDebounceRef.current[id]) {
      clearTimeout(quantityDebounceRef.current[id]);
    }

    // Clear any pending manual input debounce for this item
    if (manualInputDebounceRef.current[id]) {
      clearTimeout(manualInputDebounceRef.current[id]);
      delete manualInputDebounceRef.current[id];
    }

    // Set a new debounce timer to prevent rapid API calls
    quantityDebounceRef.current[id] = setTimeout(async () => {
      // Prevent redundant API calls
      if (pendingApiCallRef.current[id] || isProductLoading(id)) {
        return;
      }
      
      pendingApiCallRef.current[id] = true;
      setProductLoading(id, true);
      
      try {
        // Check if quantity discount should be applied
        // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
        // Convert all values to numbers to prevent string operations
        const basePrice = Number(item.price || 0);
        const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
        const taxRate = Number(item.Tax_Rate || 0);
        const qty = Number(newQuantity) || 0;
        
        let discountedBasePrice = basePrice;
        let discountApplied = false;
        
        if (item.hasQtyDiscount && item.qtyDiscount) {
          const minQtyForCaseDiscount = Number(item.qtyDiscount.minimumQtyForCaseDiscount || 0);
          if (item.qtyDiscount.isCaseDiscount && qty >= minQtyForCaseDiscount) {
            // Apply case discount to base price
            const percentageCaseDiscount = Number(item.qtyDiscount.percentageCaseDiscount || 0);
            const discountAmount = (basePrice * percentageCaseDiscount) / 100;
            discountedBasePrice = basePrice - discountAmount;
            discountApplied = true;
          } else if (item.qtyDiscount.isQtyDiscount) {
            // Find applicable quantity discount tier
            const applicableDiscount = item.qtyDiscount.qtyDiscount
              .filter((discount: any) => qty >= Number(discount.minQty || 0))
              .sort((a: any, b: any) => Number(b.minQty || 0) - Number(a.minQty || 0))[0];
            
            if (applicableDiscount) {
              if (applicableDiscount.hasPercentageDiscount) {
                // Apply percentage discount to base price
                const perDiscount = Number(applicableDiscount.perDiscount || 0);
                const discountAmount = (basePrice * perDiscount) / 100;
                discountedBasePrice = basePrice - discountAmount;
              } else {
                // Apply amount discount to base price
                const amountDiscount = Number(applicableDiscount.amountDiscount || 0);
                discountedBasePrice = basePrice - amountDiscount;
              }
              discountApplied = true;
            }
          }
        }
        
        // Ensure discounted base price doesn't go below 0
        discountedBasePrice = Math.max(0, discountedBasePrice);
        
        // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
        const basePriceWithTax = Number(Number(discountedBasePrice + taxRate).toFixed(2));
        const finalPriceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
        
        const payload = calculateCartPayload(item, qty, discountApplied ? finalPriceWithTax : undefined);
        if (currentItem?.productId) {
          // Update existing item
          await updateCartItem(currentItem.productId, payload);
        } else {
          // Add new item
          await addToCart({
            Item_Number: parseInt(id),
            ...payload
          });
        }
        
        // Update local state with discounted price if discount was applied
        if (discountApplied) {
          setOrderItems(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              price: finalPriceWithTax
            }
          }));
        }
        
        // Refresh cart data from server to ensure consistency
        cartLoadedRef.current = false;
        await loadCartItems();
      } catch (error) {
        console.error('Failed to update cart:', error);
        // Revert local state on error
        setOrderItems(prev => {
          if (currentItem) {
            return { ...prev, [id]: currentItem };
          } else {
            const {...rest} = prev;
            delete rest[id];
            return rest;
          }
        });
      } finally {
        delete pendingApiCallRef.current[id];
        setProductLoading(id, false);
      }
    }, 300); // 300ms debounce delay
  };

  const handleAddToCart = (id: string) => {
    const item:any = data.find((item:any) => item.id === id) || cartItemsData[id];
    if (!item) return;

    // Check if item is allowed to be ordered
    if (!item.allowToOrder) {
      return;
    }

    // Check if product is already loading
    if (isProductLoading(id)) {
      return;
    }

    // Reset QR scanning when cart is manually modified
    resetQrScanning();

    const currentQuantity = orderItems[id]?.quantity || 0;
    
    // Validate adding to cart
    const productLimitData = {
      hasProductLimit: item.hasProductLimit,
      productLimit: item.productLimit
    };
    if (!validateAddToCart(currentQuantity, 1, productLimitData, item.name)) {
      return;
    }

    // Use the new handleKeyboardProductSelect function with setTimeout
    handleKeyboardProductSelect(item, 1);
    
    // Focus the input after a short delay to ensure DOM is updated
    setTimeout(() => {
      const input = document.querySelector(`input[data-product-id="${id}"]`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  };

  // Optimized quantity input blur handler
  const handleQuantityInputBlur = async (id: string, newQuantity: number) => {
    const item:any = data.find((item:any) => item.id === id) || cartItemsData[id];
    if (!item) return;

    // Check if item is allowed to be ordered
    if (!item.allowToOrder) {
      return;
    }

    // Check if product is already loading
    if (isProductLoading(id)) {
      return;
    }

    const currentQuantity = orderItems[id]?.quantity || 0;
    
    // If quantity hasn't changed, don't make API call
    if (newQuantity === currentQuantity) {
      return;
    }

    // Reset QR scanning when cart is manually modified
    resetQrScanning();

    // Clear any pending debounce for this item
    if (quantityDebounceRef.current[id]) {
      clearTimeout(quantityDebounceRef.current[id]);
      delete quantityDebounceRef.current[id];
    }

    // Clear any pending manual input debounce for this item
    if (manualInputDebounceRef.current[id]) {
      clearTimeout(manualInputDebounceRef.current[id]);
      delete manualInputDebounceRef.current[id];
    }

    // Prevent redundant API calls
    if (pendingApiCallRef.current[id]) {
      return;
    }
    
    pendingApiCallRef.current[id] = true;
    setProductLoading(id, true);

    try {
      if (newQuantity <= 0) {
        const productId = orderItems[id]?.productId;
        if (productId) {
          await removeFromCart(productId);
        }
        setOrderItems(prev => {
          const {...rest} = prev;
          delete rest[id];
          return rest;
        });
        setCartItemsData(prev => {
          const {...rest} = prev;
          delete rest[id];
          return rest;
        });
        
        // Refresh cart data from server to ensure consistency
        cartLoadedRef.current = false;
        await loadCartItems();
        return; // Exit early for removal
      } else {
        // Validate quantity limit before updating
        const productLimitData = {
          hasProductLimit: item.hasProductLimit,
          productLimit: item.productLimit
        };
        if (!validateUpdateQuantity(newQuantity, productLimitData, item.name)) {
          // Revert to previous quantity
          setOrderItems(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              quantity: currentQuantity
            }
          }));
          return;
        }

        // Check if this is the first time adding this product and if it has quantity discount
        const isFirstTimeAdding = currentQuantity === 0;
        if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount) {
          // Open discount modal automatically for first-time additions
          setSelectedDiscountProduct(item);
          setSelectedDiscountData(item.qtyDiscount);
          setDiscountModalOpen(true);
          
          // Show toast message about discount modal
          showToast(`Quantity discount available for ${item.name}! Please review discount options.`, 'info');
          
          // Update local state with the new quantity but don't make API call yet
          setOrderItems(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              quantity: newQuantity
            }
          }));
          
          // Clean up and return early - wait for modal confirmation
          delete pendingApiCallRef.current[id];
          setProductLoading(id, false);
          return;
        }
        
        // Check if quantity discount should be applied for existing items
        // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
        // Convert all values to numbers to prevent string operations
        const basePrice = Number(item.price || 0);
        const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
        const taxRate = Number(item.Tax_Rate || 0);
        const qty = Number(newQuantity) || 0;
        
        let discountedBasePrice = basePrice;
        let discountApplied = false;
        
        if (item.hasQtyDiscount && item.qtyDiscount) {
          const minQtyForCaseDiscount = Number(item.qtyDiscount.minimumQtyForCaseDiscount || 0);
          if (item.qtyDiscount.isCaseDiscount && qty >= minQtyForCaseDiscount) {
            // Apply case discount to base price
            const percentageCaseDiscount = Number(item.qtyDiscount.percentageCaseDiscount || 0);
            const discountAmount = (basePrice * percentageCaseDiscount) / 100;
            discountedBasePrice = basePrice - discountAmount;
            discountApplied = true;
          } else if (item.qtyDiscount.isQtyDiscount) {
            // Find applicable quantity discount tier
            const applicableDiscount = item.qtyDiscount.qtyDiscount
              .filter((discount: any) => qty >= Number(discount.minQty || 0))
              .sort((a: any, b: any) => Number(b.minQty || 0) - Number(a.minQty || 0))[0];
            
            if (applicableDiscount) {
              if (applicableDiscount.hasPercentageDiscount) {
                // Apply percentage discount to base price
                const perDiscount = Number(applicableDiscount.perDiscount || 0);
                const discountAmount = (basePrice * perDiscount) / 100;
                discountedBasePrice = basePrice - discountAmount;
              } else {
                // Apply amount discount to base price
                const amountDiscount = Number(applicableDiscount.amountDiscount || 0);
                discountedBasePrice = basePrice - amountDiscount;
              }
              discountApplied = true;
            }
          }
        }
        
        // Ensure discounted base price doesn't go below 0
        discountedBasePrice = Math.max(0, discountedBasePrice);
        
        // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
        const basePriceWithTax = Number(Number(discountedBasePrice + taxRate).toFixed(2));
        const finalPriceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
        
        const currentItem = orderItems[id];
        const payload = calculateCartPayload(item, qty, discountApplied ? finalPriceWithTax : undefined);
        if (currentItem?.productId) {
          await updateCartItem(currentItem.productId, payload);
        } else {
          await addToCart({
            Item_Number: parseInt(id),
            ...payload
          });
        }
        
        // Update local state with discounted price if discount was applied
        if (discountApplied) {
          setOrderItems(prev => ({
            ...prev,
            [id]: {
              ...prev[id],
              price: finalPriceWithTax
            }
          }));
        }
      }
      
      // Refresh cart data from server to ensure consistency
      cartLoadedRef.current = false;
      await loadCartItems();
    } catch (error) {
      console.error('Failed to update cart:', error);
      // Revert on error
      setOrderItems(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: currentQuantity
        }
      }));
    } finally {
      delete pendingApiCallRef.current[id];
      setProductLoading(id, false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    // Reset QR scanning when cart is manually modified
    resetQrScanning();
    
    // Check if product is already loading
    if (isProductLoading(id)) {
      return;
    }
    
    setProductLoading(id, true);
    
    try {
      const productId = orderItems[id]?.productId;
      if (productId) {
        await removeFromCart(productId);
      }
      setOrderItems(prev => {
        const {...rest} = prev;
        delete rest[id];
        return rest;
      });
      setCartItemsData(prev => {
        const {...rest} = prev;
        delete rest[id];
        return rest;
      });
      
      // Clear any pending debounce for this item
      if (quantityDebounceRef.current[id]) {
        clearTimeout(quantityDebounceRef.current[id]);
        delete quantityDebounceRef.current[id];
      }
      
      // Refresh cart data from server to ensure consistency
      cartLoadedRef.current = false;
      await loadCartItems();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    } finally {
      setProductLoading(id, false);
    }
  };

  const handleClearOrder = () => {
    setClearModalOpen(true);
  };

  const handleConfirmClear = async () => {
    // Reset QR scanning when cart is manually modified
    resetQrScanning();
    
    try {
      await clearCart();
      setOrderItems({});
      setCartItemsData({});
      setClearModalOpen(false);
      
      // Clear all pending debounce timers
      Object.values(quantityDebounceRef.current).forEach(timer => clearTimeout(timer));
      quantityDebounceRef.current = {};
      // Clear all manual input debounce timers
      Object.values(manualInputDebounceRef.current).forEach(timer => clearTimeout(timer));
      manualInputDebounceRef.current = {};
      pendingApiCallRef.current = {};
      
      // Refresh cart data from server to ensure consistency
      cartLoadedRef.current = false;
      await loadCartItems();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const handlePriceChangeClose = async () => {
    try {
      // Update all items with new prices automatically
      for (const item of priceChangeItems) {
        // Get the product data to check for discounts
        const productData = cartItemsData[item.Item_Number?.toString()] || data.find((p: any) => p.id === item.Item_Number?.toString());
        
        let finalPrice = item.newPrice;
        // let discountApplied = false;
        
        // Check if quantity discount should be applied to the new price
        if (productData?.hasQtyDiscount && productData?.qtyDiscount) {
          const currentQuantity = item.Product?.Qty || 0;
          
          if (productData.qtyDiscount.isCaseDiscount && currentQuantity >= productData.qtyDiscount.minimumQtyForCaseDiscount) {
            // Apply case discount to new price
            const discountAmount = (item.newPrice * productData.qtyDiscount.percentageCaseDiscount) / 100;
            finalPrice = item.newPrice - discountAmount;
            // discountApplied = true;
          } else if (productData.qtyDiscount.isQtyDiscount) {
            // Find applicable quantity discount tier for new price
            const applicableDiscount = productData.qtyDiscount.qtyDiscount
              .filter((discount: any) => currentQuantity >= discount.minQty)
              .sort((a: any, b: any) => b.minQty - a.minQty)[0];
            
            if (applicableDiscount) {
              if (applicableDiscount.hasPercentageDiscount) {
                const discountAmount = (item.newPrice * applicableDiscount.perDiscount) / 100;
                finalPrice = item.newPrice - discountAmount;
              } else {
                finalPrice = item.newPrice - applicableDiscount.amountDiscount;
              }
              // discountApplied = true;
            }
          }
        }
        
        // Ensure price doesn't go below 0
        finalPrice = Math.max(0, finalPrice);
        
        // Calculate payload using the same product data
        if (productData) {
          // Calculate price with prepaid tax: (basePrice * prepaidTaxRate) + basePrice + Tax_Rate
          // newPrice from API is the base price, so we need to calculate full price with prepaid tax
          const basePrice = Number(Number(finalPrice).toFixed(2));
          const prepaidTaxRate = Number(productData.prepaidTaxRate || 0);
          const taxRate = Number(item.Product.Tax_Rate || 0);
        const basePriceWithTax = Number(Number(basePrice + taxRate).toFixed(2));
        const priceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
          
          const payload = calculateCartPayload(productData, item.Product.Qty, priceWithTax);
          await updateCartItem(item.Product.id, {
            ...payload,
            originalPrice: item.newPrice // Keep original new price for reference
          });
        }
      }
      
      // Refresh cart items and update Redux state
      cartLoadedRef.current = false;
      await loadCartItems();
      setPriceChangeModalOpen(false);
      
      // Show success message if discounts were applied
      const itemsWithDiscounts = priceChangeItems.filter((item: any) => {
        const filterProductData = cartItemsData[item.Item_Number?.toString()] || data.find((p: any) => p.id === item.Item_Number?.toString());
        return filterProductData?.hasQtyDiscount && filterProductData?.qtyDiscount;
      });
      
      if (itemsWithDiscounts.length > 0) {
        showToast(`Price changes applied with automatic discounts for ${itemsWithDiscounts.length} item(s)`, 'success');
      } else {
        showToast('Price changes applied successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to update price changes:', error);
      setPriceChangeModalOpen(false);
      showToast('Failed to update price changes. Please try again.', 'error');
    }
  };

  const handleInactiveItemsClose = async () => {
    setInactiveItemsLoading(true);
    try {
      // Remove all inactive items from cart
      for (const item of inactiveItems) {
        if (item.Product?.id) {
          await removeFromCart(item.Product.id);
        }
      }
      
      // Refresh cart items and update Redux state
      cartLoadedRef.current = false;
      await loadCartItems();
      setInactiveItemsModalOpen(false);
      
      // Show success message
      showToast(`Removed ${inactiveItems.length} inactive item(s) from cart`, 'success');
    } catch (error) {
      console.error('Failed to remove inactive items:', error);
      setInactiveItemsModalOpen(false);
      showToast('Failed to remove inactive items. Please try again.', 'error');
    } finally {
      setInactiveItemsLoading(false);
    }
  };

  const handleInactiveItemsModalClose = () => {
    setInactiveItemsModalOpen(false);
  };

  const handleContinueOrder = () => {
    // Validate cart before proceeding
    const cartItems = Object.entries(orderItems).map(([id, item]) => {
      const productData = cartItemsData[id];
      return {
        id,
        quantity: item.quantity,
        price: item.price,
        priceWithTax: item.price,
        hasProductLimit: productData?.hasProductLimit || false,
        productLimit: productData?.productLimit || null,
        originalPrice: item.price || 0
      };
    });

    const validationData = {
      userLimitMinOrderAmount: cartValidationData.userLimitMinOrderAmount,
      totalAmountWithTax: cartValidationData.totalAmountWithTax,
      totalAmount: cartValidationData.totalAmount
    };

    if (!validateCartForCheckout(cartItems, validationData)) {
      return;
    }

    // Redirect to cart page
    navigate('/retailer/cart');
  };

  // QR Code scanning functions
  const handleQrScanToggle = () => {
    const newScanningState = !isQrScanning;
    setIsQrScanning(newScanningState);
    if (isQrScanning) {
      // Clear QR scan state when turning off
      setIsCapturingUPC(false);
      setUpcBuffer('');
      if (processingTimeout) {
        clearTimeout(processingTimeout);
        setProcessingTimeout(null);
      }
      // Show modal when QR scanning is disabled
      setQrDisabledMessage('Barcode scanning disabled');
      setQrDisabledModalOpen(true);
    } else {
      showToast('Barcode scanning enabled - press any key to start scanning', 'info');
    }
  };

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };
  


  // QR code scanning state - simplified approach
  const [isCapturingUPC, setIsCapturingUPC] = useState(false);
  const [upcBuffer, setUpcBuffer] = useState('');
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Function to reset QR scanning when cart is manually modified

   const resetQrScanning = () => {
    if (isQrScanning) {
      setIsQrScanning(false);
      setIsCapturingUPC(false);
      setUpcBuffer('');
      if (processingTimeout) {
        clearTimeout(processingTimeout);
        setProcessingTimeout(null);
      }
      // Show modal message that QR scanning is disabled
      setQrDisabledMessage('Barcode scanning disabled - cart was manually modified');
      setQrDisabledModalOpen(true);
    }
  };

  // Handle keyboard input for QR scanner (when QR scanning is active)
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isQrScanning) return;

    // Prevent default behavior for all keys when QR scanning
    e.preventDefault();

    if (!isCapturingUPC) {
      // Start capturing mode
      setIsCapturingUPC(true);
      setUpcBuffer('');
      showToast('Barcode scanning active - scan now', 'info');
      return;
    }

    // Handle different keys
    if (e.key === 'Enter') {
      // Process the current buffer
      if (upcBuffer.length >= 8) {
        processQrCode(upcBuffer);
        setIsCapturingUPC(false);
        setUpcBuffer('');
        if (processingTimeout) {
          clearTimeout(processingTimeout);
          setProcessingTimeout(null);
        }
      } else {
        showToast('Invalid UPC code length', 'error');
        setIsCapturingUPC(false);
        setUpcBuffer('');
      }
    } else if (e.key === 'Escape') {
      // Cancel scanning
      setIsCapturingUPC(false);
      setUpcBuffer('');
      if (processingTimeout) {
        clearTimeout(processingTimeout);
        setProcessingTimeout(null);
      }
      showToast('Barcode scanning cancelled', 'info');
    } else if (/^[0-9]$/.test(e.key)) {
      // Add numeric character to buffer
      const newBuffer = upcBuffer + e.key;
      setUpcBuffer(newBuffer);
      
      // Clear existing timeout
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
      
      // Set new timeout for auto-processing
      const timeout = setTimeout(() => {
        if (newBuffer.length >= 8) {
          processQrCode(newBuffer);
          setIsCapturingUPC(false);
          setUpcBuffer('');
          setProcessingTimeout(null);
        }
      }, 300); // Reduced timeout for faster response
      
      setProcessingTimeout(timeout);
    }
  }, [isQrScanning, isCapturingUPC, upcBuffer, processingTimeout]);

  // Process the scanned UPC code
  const processQrCode = async (upcCode: string) => {
    try {
      showToast(`Processing UPC: ${upcCode}...`, 'info');
      
      // Search for product by UPC
      const params: InventoryParams = {
        page: 1,
        limit: 100, // Increased limit to search more products
        search: upcCode, // Use the UPC code as search term
        masterSearch: '',
        salesCategoryId: [],
        priceClassId: [],
        salesCategory: userSalesCategory
      } as any;
      
      const response: any = await getInventoryItems(params);
      
      const products = (response?.data?.finalProductList || []).map((apiProduct: ApiProduct) => 
        transformApiProduct(apiProduct)
      );
      
      
      // Find product with matching UPC - try exact match first, then partial matches
      let matchingProduct = products.find((product: Product) => 
        product.upc === upcCode
      );
      
      
      // If no exact match, try partial matches
      if (!matchingProduct) {
        matchingProduct = products.find((product: Product) => 
          product.upc?.includes(upcCode) ||
          upcCode.includes(product.upc || '')
        );
      }
      
      if (!matchingProduct) {
        showToast(`Product not found with UPC: ${upcCode}`, 'error');
        return;
      }

      // Check if product is allowed to be ordered
      if (!matchingProduct.allowToOrder) {
        showToast(`Product ${matchingProduct.name} is not available for ordering`, 'error');
        return;
      }

      // Check if product is already in cart
      const existingItem = orderItems[matchingProduct.id];
      const currentQuantity = existingItem?.quantity || 0;
      const newQuantity = currentQuantity + 1;

      // Validate adding to cart - but allow QR scanned items to bypass some restrictions
      const productLimitData = {
        hasProductLimit: matchingProduct.hasProductLimit,
        productLimit: matchingProduct.productLimit
      };
      if (!validateAddToCart(currentQuantity, 1, productLimitData, matchingProduct.name)) {
        // For QR scanned items, we'll still add them but show a warning
        showToast(`Added ${matchingProduct.name} to cart (quantity limit exceeded)`, 'info');
      }

      // Clear any pending manual input debounce for this item
      if (manualInputDebounceRef.current[matchingProduct.id]) {
        clearTimeout(manualInputDebounceRef.current[matchingProduct.id]);
        delete manualInputDebounceRef.current[matchingProduct.id];
      }
      
      // For barcode scanning, automatically apply discounts without opening modal
      // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
      const basePrice = matchingProduct.price || 0;
      const prepaidTaxRate = matchingProduct.prepaidTaxRate || 0;
      const taxRate = matchingProduct.Tax_Rate || 0;
      
      let discountedBasePrice = basePrice;
      let discountApplied = false;
      let discountMessage = '';
      
      if (matchingProduct.hasQtyDiscount && matchingProduct.qtyDiscount) {
        if (matchingProduct.qtyDiscount.isCaseDiscount && newQuantity >= matchingProduct.qtyDiscount.minimumQtyForCaseDiscount) {
          // Apply case discount to base price
          const discountAmount = (basePrice * matchingProduct.qtyDiscount.percentageCaseDiscount) / 100;
          discountedBasePrice = basePrice - discountAmount;
          discountApplied = true;
          discountMessage = `Case discount applied: ${matchingProduct.qtyDiscount.percentageCaseDiscount}% off`;
        } else if (matchingProduct.qtyDiscount.isQtyDiscount) {
          // Find applicable quantity discount tier
          const applicableDiscount = matchingProduct.qtyDiscount.qtyDiscount
            .filter((discount: any) => newQuantity >= discount.minQty)
            .sort((a: any, b: any) => b.minQty - a.minQty)[0];
          
          if (applicableDiscount) {
            if (applicableDiscount.hasPercentageDiscount) {
              // Apply percentage discount to base price
              const discountAmount = (basePrice * applicableDiscount.perDiscount) / 100;
              discountedBasePrice = basePrice - discountAmount;
              discountMessage = `Quantity discount applied: ${applicableDiscount.perDiscount}% off`;
            } else {
              // Apply amount discount to base price
              discountedBasePrice = basePrice - applicableDiscount.amountDiscount;
              discountMessage = `Quantity discount applied: $${applicableDiscount.amountDiscount} off`;
            }
            discountApplied = true;
          }
        }
      }
      
      // Ensure discounted base price doesn't go below 0
      discountedBasePrice = Math.max(0, discountedBasePrice);
      
      // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = Number(Number(discountedBasePrice + taxRate).toFixed(2));
      let finalPrice = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
      
      // Ensure price doesn't go below 0
      finalPrice = Number(Number(Math.max(0, finalPrice)).toFixed(2));
      
      // Update local state immediately for better UX
      setOrderItems(prev => ({
        ...prev,
        [matchingProduct.id]: {
          quantity: newQuantity,
          Description: matchingProduct.name,
          price: finalPrice, // Use final price (with discount if applicable)
          productId: existingItem?.productId || 0,
          placedBySalesPerson: matchingProduct?.productDetails?.placedBySalesPerson
        }
      }));

      // Add to cart or update existing item
      try {
        const payload = calculateCartPayload(matchingProduct, newQuantity, discountApplied ? finalPrice : undefined);
        if (existingItem?.productId) {
          // Update existing item
          await updateCartItem(existingItem.productId, payload);
        } else {
          // Add new item
          await addToCart({
            Item_Number: parseInt(matchingProduct.id),
            ...payload
          });
        }
        
        // Refresh cart data from server to ensure consistency
        cartLoadedRef.current = false;
        await loadCartItems();
        
        // Show toast success message with discount info if applicable
        if (discountApplied) {
          showToast(`${discountMessage} - Added ${matchingProduct.name} to cart (Qty: ${newQuantity})`, 'success');
        } else {
          showToast(`Added ${matchingProduct.name} to cart (Qty: ${newQuantity})`, 'success');
        }
        
      } catch (error) {
        console.error('Failed to add product to cart:', error);
        showToast('Failed to add product to cart. Please try again.', 'error');
        
        // Revert local state on error
        setOrderItems(prev => {
          if (existingItem) {
            return { ...prev, [matchingProduct.id]: existingItem };
          } else {
            const {...rest} = prev;
            delete rest[matchingProduct.id];
            return rest;
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to process QR code:', error);
      showToast('Failed to search for product. Please try again.', 'error');
    }
  };

  // Add keyboard event listener for QR scanning
  useEffect(() => {
    if (isQrScanning) {
      document.addEventListener('keypress', handleKeyPress);
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keypress', handleKeyPress);
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isQrScanning, handleKeyPress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [processingTimeout]);

  // Wrapper function for OrderDetails quantity changes - optimized to prevent redundant calls
  const handleOrderDetailsQuantityChange = (id: string, change: number) => {
    // Reset QR scanning when cart is manually modified
    resetQrScanning();
    
    const currentQuantity = orderItems[id]?.quantity || 0;
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 0) {
      // Check if this is the first time adding this product and if it has quantity discount
      const isFirstTimeAdding = currentQuantity === 0;
      const item = data.find((item:any) => item.id === id) || cartItemsData[id];
      
      if (isFirstTimeAdding && item?.hasQtyDiscount && item?.qtyDiscount) {
        // Open discount modal automatically for first-time additions
        setSelectedDiscountProduct(item);
        setSelectedDiscountData(item.qtyDiscount);
        setDiscountModalOpen(true);
        
        // Show toast message about discount modal
        showToast(`Quantity discount available for ${item.name}! Please review discount options.`, 'info');
        return; // Don't add to cart yet, wait for modal confirmation
      }
      
      // Clear any pending manual input debounce for this item
      if (manualInputDebounceRef.current[id]) {
        clearTimeout(manualInputDebounceRef.current[id]);
        delete manualInputDebounceRef.current[id];
      }
      
      // Update local state immediately for better UX
      setOrderItems(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: newQuantity
        }
      }));
      
      // Use the same debounced API call logic
      handleQuantityChange(id, change);
    }
  };

  // Handle keyboard product selection with setTimeout
  const handleKeyboardProductSelect = (product: Product, quantity: number) => {
    // Reset QR scanning when cart is manually modified
    resetQrScanning();
    
    // Check if product is allowed to be ordered
    if (!product.allowToOrder) {
      return;
    }

    // Check if product is already loading
    if (isProductLoading(product.id)) {
      return;
    }
    
    const currentQuantity = orderItems[product.id]?.quantity || 0;
    const newQuantity = currentQuantity + quantity;
    
    if (newQuantity <= 0) {
      // Remove item from cart
      handleRemoveItem(product.id);
      return;
    }

    // Validate quantity limit before updating
    const productLimitData = {
      hasProductLimit: product.hasProductLimit,
      productLimit: product.productLimit
    };
    if (!validateUpdateQuantity(newQuantity, productLimitData, product.name)) {
      return;
    }

    // Check if this is the first time adding this product and if it has quantity discount
    const isFirstTimeAdding = currentQuantity === 0;
    if (isFirstTimeAdding && product.hasQtyDiscount && product.qtyDiscount) {
      // Clear any pending manual input debounce for this item
      if (manualInputDebounceRef.current[product.id]) {
        clearTimeout(manualInputDebounceRef.current[product.id]);
        delete manualInputDebounceRef.current[product.id];
      }
      
      // Open discount modal automatically
      setSelectedDiscountProduct(product);
      setSelectedDiscountData(product.qtyDiscount);
      setDiscountModalOpen(true);
      return; // Don't add to cart yet, wait for modal confirmation
    }

    // Update local state immediately for better UX
    setOrderItems(prev => ({
      ...prev,
      [product.id]: {
        quantity: newQuantity,
        Description: product.name,
        price: product.priceWithTax,
        productId: prev[product.id]?.productId || 0,
        placedBySalesPerson: false // Default to false for retailer orders
      }
    }));

    // Use setTimeout to delay API call
    setTimeout(async () => {
      try {
        const currentItem = orderItems[product.id];
        const payload = calculateCartPayload(product, newQuantity);
        if (currentItem?.productId) {
          // Update existing item
          await updateCartItem(currentItem.productId, payload);
        } else {
          // Add new item
          await addToCart({
            Item_Number: parseInt(product.id),
            ...payload
          });
        }
        
        // Refresh cart data from server to ensure consistency
        cartLoadedRef.current = false;
        await loadCartItems();
      } catch (error) {
        console.error('Failed to update cart:', error);
        // Revert local state on error
        setOrderItems(prev => {
          if (orderItems[product.id]) {
            return { ...prev, [product.id]: orderItems[product.id] };
          } else {
            const {...rest} = prev;
            delete rest[product.id];
            return rest;
          }
        });
      }
    }, 300); // 300ms delay
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle search input change - clear master search when user types
  const handleSearchChange = (e: any) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    // Clear master search when user starts typing
    if (newSearchTerm.trim() !== '' && masterSearchTerm) {
      setMasterSearchTerm('');
    }
  };

  // Clear master search
  const handleClearMasterSearch = () => {
    setMasterSearchTerm('');
  };

  const columns: TableColumn<any>[] = [
    {
      id: 'itemNumber',
      label: 'Item #',
      minWidth: 60,
      render: (row) => (
        <Typography fontSize={"14px"} color="textSecondary">
          {row.itemNumber}
        </Typography>
      ),
    },
    {
      id: 'products',
      label: 'Products',
      minWidth: 300,
      render: (row) => (
        <Tooltip title={row.name} placement="top">
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={() => handleProductClick(row)}
        >
          <Box sx={{ position: 'relative' }}>
            <ProductImage 
              src={row.image} 
              alt={row.name} 
              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: "4px"}}
            />
            {(row.isDiscounted || row.hasQtyDiscount) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -2,
                  left: -4,
                  backgroundColor: '#ff3b30',
                  color: 'white',
                  padding: '0px 6px',
                  transform: 'rotate(-45deg) translateX(-15%)',
                  fontSize: '8px',
                  fontWeight: 500,
                  letterSpacing: '1px',
                  width: '40px',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  animation: 'sparkle 2s infinite, wiggle 1s ease-in-out infinite',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: -3,
                    top: '50%',
                    width: '3px',
                    height: '1px',
                    backgroundColor: '#ff3b30'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: -3,
                    top: '50%',
                    width: '3px',
                    height: '1px',
                    backgroundColor: '#ff3b30'
                  },
                  '@keyframes sparkle': {
                    '0%': { filter: 'brightness(100%)' },
                    '50%': { filter: 'brightness(120%)' },
                    '100%': { filter: 'brightness(100%)' }
                  },
                  '@keyframes wiggle': {
                    '0%': { transform: 'rotate(-45deg) translateX(-15%)' },
                    '25%': { transform: 'rotate(-47deg) translateX(-15%)' },
                    '75%': { transform: 'rotate(-43deg) translateX(-15%)' },
                    '100%': { transform: 'rotate(-45deg) translateX(-15%)' }
                  }
                }}
              >
                SALE
              </Box>
            )}
          </Box>
          <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>  
          <Typography
                  fontSize={"13px"}
                  fontWeight={400}
                  sx={{
                    maxWidth: '90%',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'normal', // Allow multiline
                    wordBreak: 'break-word', // Allow breaks anywhere if needed
                    lineHeight: 1.3,
                  }}
                >
                  {row.name}
                </Typography>
                {row.isNewItem && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: '4px',
                  py: '0.5px',
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, #e0ffea 0%, #baffc9 100%)',
                  border: '1.5px solid #27ae60',
                  color: '#219150',
                  fontSize: '10px',
                  fontWeight: 500,
                  boxShadow: '0 1px 4px 0 #baffc955',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                    zIndex: 0,
                  },
                  animation: 'newPulse 1.5s infinite',
                  '@keyframes newPulse': {
                    '0%':   { boxShadow: '0 0 0 0 #baffc955' },
                    '70%':  { boxShadow: '0 0 0 6px #baffc900' },
                    '100%': { boxShadow: '0 0 0 0 #baffc955' }
                  }
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>New</span>
              </Box>
            )}
            </Box>
            <Typography fontSize={"11px"} color="textSecondary">
              Pack: {row.pack} | Size: {row.size} | Case: {row.case} | Unit: {row.UnitOunces}
            </Typography>

                {/* <Typography fontSize={"11px"} display="block" color="textSecondary">
              
                </Typography>  */}
          </Box>
        </Box>
        </Tooltip>
      ),
    },
    {
      id: 'stock',
      label: 'Stock',
      minWidth: 100,
      render: (row:any) => {
        // If stockCount is defined, show only the count
        if (row.stockCount !== undefined) {
          return (
            <Typography fontSize="12px" color="textSecondary">
              {row.stockCount ? row.stockCount : 0  }
            </Typography>
          );
        }
        
        // Otherwise show the stock status chip
        return (
          <Chip
            label={row.stock}
            sx={{ 
              textTransform: 'capitalize', 
              fontSize: "10px", 
              borderRadius: "4px",
              height: "auto",
              padding: "5px",
              color: row.stock === 'in stock' ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)',
              bgcolor: row.stock === 'in stock' ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)'
            }}
          />
        );
      },
    },
    // {
    //   id: 'price',
    //   label: 'Price',
    //   minWidth: 100,
    //   align: 'right',
    //   render: (row) =>  (
    //     <Typography fontSize={"14px"} color="textSecondary">
    //       {row.showWithOutPrice ? '-' : `$${Number(row.price).toFixed(2)}`}  
    //     </Typography>
    //   ),
    // },
    // {
    //   id: 'Tax_Rate',
    //   label: 'Tax Rate',
    //   minWidth: 100,
    //   align: 'right',
    //   render: (row) => (
    //     <Typography fontSize={"14px"} color="textSecondary">
    //       {row.showWithOutPrice ? '-' : `$${Number(row.Tax_Rate).toFixed(2)}` || '$0'} 
    //     </Typography>
    //   ),
    // }, 
    {
      id: 'priceWithTax',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      render: (row) => {
        if (row.showWithOutPrice) {
          return (
            <Typography fontSize={"14px"} color="textSecondary">
              -
            </Typography>
          );
        }
        
        // Calculate display price based on showWithPerpaidTax setting
        const basePrice = Number(row.price || 0);
        const prepaidTaxRate = Number(row.prepaidTaxRate || 0);
        const taxRate = Number(row.Tax_Rate || 0);
        const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
        
        return (
          <Typography fontSize={"14px"} color="textSecondary">
            ${displayPrice}
          </Typography>
        );
      },
    },
    // {
    //   id: 'crvPrice',
    //   label: 'Discount State-wise',
    //   minWidth: 120,
    //   align: 'left',
    //   render: (row) => (
    //     <Typography fontSize={"14px"} color="textSecondary">
    //       {`$${row.crvPrice.toLocaleString()}`}
    //     </Typography>
    //   ),
    // },
    {
      id: 'history',
      label: 'History',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <IconButton size="small" sx={{ color: "primary.main" }} onClick={() => handleHistoryClick(row)}>
          <VisibilityOutlined />
        </IconButton>
      ),
    },
    {
      id: 'quantity',
      label: 'Quantity',
      minWidth: 100,
      align: 'right',
      render: (row) => 
        !row.allowToOrder ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
              padding: "5px"
            }}
          >
            <Typography fontSize="12px" color="textSecondary">
              Out of Stock 
            </Typography>
          </Box>
        ) : (orderItems[row.id]?.quantity || 0) === 0 ? (
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
              onClick={() => !isProductLoading(row.id) && handleAddToCart(row.id)}
              sx={{ 
                cursor: isProductLoading(row.id) ? "not-allowed" : "pointer", 
                backgroundColor: isProductLoading(row.id) ? "grey.400" : "primary.main", 
                borderRadius: "50%",
                transition: "transform 0.2s ease-in-out",
                opacity: isProductLoading(row.id) ? 0.6 : 1,
                "&:hover": {
                  transform: isProductLoading(row.id) ? "none" : "scale(1.1)"
                }
              }} 
            />

          </Box>
        ) : (
          <Box display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap={1}
          >
          <Box
            sx={{
              backgroundColor: (theme) => theme.palette.background.paper,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              padding: "2px 4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              width: 'fit-content',
              
              '&:hover': {
                borderColor: (theme) => theme.palette.primary.main,
              },
              animation: "fadeIn 0.3s ease-in",
              "@keyframes fadeIn": {
                "0%": {
                  opacity: 0,
                  transform: "scale(0.9)"
                },
                "100%": {
                  opacity: 1,
                  transform: "scale(1)"
                }
              }
            }}
          >
            <IconButton
              disabled={isProductLoading(row.id)}
              sx={{
                color: (theme) => theme.palette.primary.main,
                padding: '2px',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.action.hover
                },
                '&:disabled': {
                  color: 'grey.400',
                  cursor: 'not-allowed'
                }
              }}
              size="small" 
              onClick={() => handleQuantityChange(row.id, -1)}
            >
              <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <Input
              value={orderItems[row.id]?.quantity || 0}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value) || 0;
                if (newQuantity >= 0) {
                  // Use the new debounced function for manual input changes
                  handleManualQuantityChange(row.id, newQuantity);
                }
              }}
              onBlur={(e) => {
                if (e && e.target && e.target.value !== undefined) {
                  const newQuantity = parseInt(e.target.value) || 0;
                  if (newQuantity >= 0) {
                    handleQuantityInputBlur(row.id, newQuantity);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;
                  if (target && target.value !== undefined) {
                    const newQuantity = parseInt(target.value) || 0;
                    if (newQuantity >= 0) {
                      handleQuantityInputBlur(row.id, newQuantity);
                    }
                  }
                }
              }}
              disabled={isProductLoading(row.id)}
              disableUnderline
              sx={{
                width: '32px',
                mx: 0.5,
                '& input': {
                  textAlign: 'center',
                  padding: '1px',
                  fontSize: '0.8125rem',
                  fontWeight: 400,
                  color: (theme) => theme.palette.text.primary
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  color: 'grey.400'
                }
              }}
              inputProps={{
                min: 0,
                style: { textAlign: 'center' }
              }}
            />

            <IconButton
              disabled={isProductLoading(row.id)}
              sx={{
                color: (theme) => theme.palette.primary.main,
                padding: '2px',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.action.hover
                },
                '&:disabled': {
                  color: 'grey.400',
                  cursor: 'not-allowed'
                }
              }}
              size="small"
              onClick={() => handleQuantityChange(row.id, 1)}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          </Box>
        )
    },
  ];

  // Use data directly from API - no client-side filtering needed
  // The API handles filtering and pagination
  const paginatedData = data;
  
  // Show message when no data is available
  const gridItems = paginatedData.map((item:any) => ({
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
      const basePrice = Number(item.price || 0);
      const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
      const taxRate = Number(item.Tax_Rate || 0);
      return calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
    })() as number | undefined, 
    discount: item.crvPrice,
    isDiscounted: item.isDiscounted || false,
    isNewItem: item.isNewItem || false,
    hasQtyDiscount: item.hasQtyDiscount || false,
    productDetails: item.productDetails,
    actions: [
      {
        icon: <InfoOutlined  />,
        tooltip: 'View Details',
        onClick: () => handleProductClick(item)
      },
      {
        icon: <HistoryOutlined  />,
        tooltip: 'View History',
        onClick: () => handleHistoryClick(item)
      }
    ],
    customActions: !item.allowToOrder ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "fit-content",
          padding: "8px",
          backgroundColor: "grey.300",
          borderRadius: "8px",
          cursor: "not-allowed",
        }}
      >
        <Typography 
          sx={{ 
            color: "grey.600", 
            fontSize: "0.75rem", 
            fontWeight: 600 
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
          padding: "8px",
          backgroundColor: isProductLoading(item.id) ? "grey.400" : "primary.main",
          borderRadius: "8px",
          cursor: isProductLoading(item.id) ? "not-allowed" : "pointer",
          transition: "all 0.2s ease-in-out",
          opacity: isProductLoading(item.id) ? 0.6 : 1,
          "&:hover": {
            backgroundColor: isProductLoading(item.id) ? "grey.400" : "primary.dark",
            transform: isProductLoading(item.id) ? "none" : "translateY(-1px)",
            boxShadow: isProductLoading(item.id) ? "none" : "0 2px 4px rgba(0,0,0,0.1)"
          }
        }}
        onClick={() => !isProductLoading(item.id) && handleAddToCart(item.id)}
      >
        <ShoppingCartIcon 
          sx={{ 
            color: "white",
            fontSize: "20px",
            mr: 1
          }} 
        />
        <Typography 
          sx={{ 
            color: "white", 
            fontSize: "0.75rem", 
            fontWeight: 600 
          }}
        >
          {isProductLoading(item.id) ? 'Adding...' : 'Add to Cart'}
        </Typography>

      </Box>
    ) : (
      <Box
        display="flex"
        alignItems="center"
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          borderRadius: 1.5,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "2px 4px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          width: 'fit-content',
          '&:hover': {
            borderColor: (theme) => theme.palette.primary.main,
          }
        }}
      >
        <IconButton
          disabled={isProductLoading(item.id)}
          sx={{
            color: (theme) => theme.palette.primary.main,
            padding: '2px',
            '&:hover': {
              backgroundColor: (theme) => theme.palette.action.hover
            },
            '&:disabled': {
              color: 'grey.400',
              cursor: 'not-allowed'
            }
          }}
          size="small"
          onClick={() => handleQuantityChange(item.id, -1)}
        >
          <RemoveIcon sx={{ fontSize: 16 }} />
        </IconButton>
        
        <Input
          value={orderItems[item.id]?.quantity || 0}
          onChange={(e) => {
            const newQuantity = parseInt(e.target.value) || 0;
            if (newQuantity >= 0) {
              // Use the new debounced function for manual input changes
              handleManualQuantityChange(item.id, newQuantity);
            }
          }}
          onBlur={(e) => {
            if (e && e.target && e.target.value !== undefined) {
              const newQuantity = parseInt(e.target.value) || 0;
              if (newQuantity >= 0) {
                handleQuantityInputBlur(item.id, newQuantity);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const target = e.target as HTMLInputElement;
              if (target && target.value !== undefined) {
                const newQuantity = parseInt(target.value) || 0;
                if (newQuantity >= 0) {
                  handleQuantityInputBlur(item.id, newQuantity);
                }
              }
            }
          }}
          data-product-id={item.id}
          disabled={isProductLoading(item.id)}
          disableUnderline
          sx={{
            width: '32px',
            mx: 0.5,
            '& input': {
              textAlign: 'center',
              padding: '1px',
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: (theme) => theme.palette.text.primary
            },
            '&.Mui-disabled': {
              backgroundColor: 'transparent',
              color: 'grey.400'
            }
          }}
          inputProps={{
            min: 0,
            style: { textAlign: 'center' }
          }}
        />

        <IconButton
          disabled={isProductLoading(item.id)}
          sx={{
            color: (theme) => theme.palette.primary.main,
            padding: '2px',
            '&:hover': {
              backgroundColor: (theme) => theme.palette.action.hover
            },
            '&:disabled': {
              color: 'grey.400',
              cursor: 'not-allowed'
            }
          }}
          size="small"
          onClick={() => handleQuantityChange(item.id, 1)}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    )
  }));

  const filterConfig = {
    searchTerm,
    setSearchTerm,
    salesCategory,
    setSalesCategory,
    priceClass,
    setPriceClass,
    salesCategoryOptions,
    priceClassOptions,
  };

  return (
    <Box p={{ xs: "10px", sm: "10px", md: "0px 15px" }}> 
      <Box
        display={"flex"}
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent={"space-between"}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={{xs: 1, md: 2}}
        flexWrap="wrap"
        gap={2}
      >
          {/* <Typography fontSize={"18px"} fontWeight={400}>
            {viewAllType ? `${viewAllType.charAt(0).toUpperCase() + viewAllType.slice(1)} Items` : 'Order'}
          </Typography> */}
        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' } }}>
          {viewAllType && (
            <CustomButton 
              fullWidth={false} 
              sx={{marginTop: "0px", borderRadius: "4px", minWidth: "200px", fontSize: { xs: "12px", sm: "13px" }, py: 0.3}}
              size='small'
              onClick={() => navigate("/retailer/dashboard")}
            >
              Back to Dashboard
            </CustomButton>
          )}
          {/* <CustomButton fullWidth={true} sx={{ minWidth: '200px', marginTop: "0px", borderRadius: "4px", fontSize: { xs: "12px", sm: "13px" }, py: 0.3}} size='small' onClick={() => navigate("/retailer/order/history")}>
            Order History
          </CustomButton> */}
          {/* <CustomButton
            onClick={handleQrScanToggle}
            fullWidth={true}
            size='small'
            sx={{
              minWidth: '200px',
              marginTop: "0px", 
              borderRadius: "4px",
              fontSize: { xs: "12px", sm: "13px" },
              py: 0.3,
              ...(isQrScanning && {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }),
                ...(isQrScanning && {
                animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 1 }
            }})
            }}
          >
            <img src={scanIcon} alt="Scan" width={16} height={16} style={{marginRight: '10px'}} />
            {isQrScanning ? 'Stop Scan' : 'Barcode Scan'}
          </CustomButton> */}
        </Box>
      </Box>
      
      {/* Show loading spinner when loading is true */}
      {/* {loading && (
        <LoadingSpinner 
          message="Loading inventory items..." 
          fullScreen={false}
        />
      )} */}
      
      {/* Error Message */}
      {error && (
        <Box 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: 'error.light', 
            color: 'error.contrastText', 
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography>{error}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <CustomButton 
              size="small" 
              onClick={getInventoryData}
              sx={{ 
                color: 'error.contrastText', 
                borderColor: 'error.contrastText',
                '&:hover': { bgcolor: 'error.dark' }
              }}
            >
              Retry
            </CustomButton>
            <IconButton 
              size="small" 
              onClick={() => setError(null)}
              sx={{ color: 'error.contrastText' }}
            >
              <RemoveIcon />
            </IconButton>
          </Box>
        </Box>
      )}
      
        <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 9 }}>

         {
           viewMode === 'table' ? 
           <CommonTable
            data={paginatedData}
            columns={columns}   
            currentPage={viewAllType ? 1 : currentPage}
            totalPages={viewAllType ? 1 : totalPages}
            totalItems={totalItems}
            stickyLastColumn={true}
            pageSize={viewAllType ? totalItems : pageSize}
            onPageChange={viewAllType ? (() => {}) : handlePageChange}
            onPageSizeChange={viewAllType ? (() => {}) : handlePageSizeChange}
            loading={loading}
            filterComponent={!viewAllType ? (
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={2} mb={2} width="100%">
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, md: 1, lg: 1 },
                    width: '100%',
                    // flexWrap: 'wrap',
                    // flex: 1
                  }}
                >
                  <TextInput
                    placeholder={masterSearchTerm ? `Banner search: ${masterSearchTerm}` : "Search product"}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ 
                      flex: { xs: '1 1 100%', sm: '1 1 200px' }, 
                      marginBottom: "0px !important",
                      ...(masterSearchTerm && {
                        '& .MuiInputBase-root': {
                          // borderColor: 'primary.main',
                          borderWidth: '2px',
                          // backgroundColor: 'primary.light',
                          // opacity: 0.1
                        }
                      })
                    }}
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                          {searchTerm !== debouncedSearchTerm && (
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                  '0%': { transform: 'rotate(0deg)' },
                                  '100%': { transform: 'rotate(360deg)' }
                                }
                              }}
                            />
                          )}
                          {masterSearchTerm && (
                            <IconButton
                              size="small"
                              onClick={handleClearMasterSearch}
                              sx={{ 
                                color: 'primary.main',
                                p: 0.5,
                                ml: 1,
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  opacity: 0.8
                                }
                              }}
                            >
                              <Clear sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      )
                    }}
                  />
                  <MultiSearchableDropdown
                    options={salesCategoryOptions}
                    value={salesCategory}
                    onChange={(options) => setSalesCategory(options)}
                    loading={loadingSalesCategory}
                    placeholder="Select sales categories"
                    sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' }, marginBottom: "0px !important" }}
                  />
                  <MultiSearchableDropdown
                    options={priceClassOptions}
                    value={priceClass}
                    onChange={(options) => setPriceClass(options)}
                    loading={loadingPriceClass}
                    placeholder="Select sub category"
                    sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' }, marginBottom: "0px !important" }}
                  />
                </Box>
                <Tooltip title={isQrScanning ? "Stop Scan" : "Barcode Scan"} placement="top">
                <Box sx={{ display: 'flex',backgroundColor: '#3C7795', borderRadius: '10px',p:1, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleQrScanToggle}>
                  {isQrScanning ?  <Pause sx={{color: 'white'}} width={15} height={15}/> : <img src={scanIcon} alt="Scan" width={24} height={24} />}
                </Box>
              </Tooltip>
                <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-start', md: 'center' } }}>
                  <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                </Box>
              </Box>
            ) : (
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {viewAllType} Items ({totalItems} items)
                </Typography>
                <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
              </Box>
            )}
            containerHeight="calc(100vh - 200px)"
            headerStyle={{
              fontWeight: 500,
            }}
          />
         : 
          <Paper sx={{ p: 2, borderRadius: "10px", boxShadow: "none" }}>      
          <GridCard 
            items={gridItems} 
            showFilters={!viewAllType}
            filterConfig={filterConfig}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showViewToggle={true}
            loading={loading}
            showMenuIcons={false}
            filterComponent={!viewAllType ? (
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={2} mb={2} width="100%">
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, md: 1, lg: 1 },
                    width: '100%',
                    // flexWrap: 'wrap',
                    // flex: 1
                  }}>     
                  <TextInput
                    placeholder={masterSearchTerm ? `Banner search: ${masterSearchTerm}` : "Search product"}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ 
                      flex: { xs: '1 1 100%', sm: '1 1 200px' }, 
                      marginBottom: "0px !important",
                      ...(masterSearchTerm && {
                        '& .MuiInputBase-root': {
                          // borderColor: 'primary.main',
                          borderWidth: '2px',
                          // backgroundColor: 'primary.light',
                          // opacity: 0.1
                        }
                      })
                    }}
                  />
                  <MultiSearchableDropdown
                    options={salesCategoryOptions}
                    value={salesCategory}
                    onChange={(options) => setSalesCategory(options)}
                    loading={loadingSalesCategory}
                    placeholder="Select sales categories"
                    sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' }, marginBottom: "0px !important" }}
                  />
                  <MultiSearchableDropdown
                    options={priceClassOptions}
                    value={priceClass}
                    onChange={(options) => setPriceClass(options)}
                    loading={loadingPriceClass}
                    placeholder="Select sub category"
                    sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' }, marginBottom: "0px !important" }}
                  />
                </Box>
                <Tooltip title={isQrScanning ? "Stop Scan" : "Barcode Scan"} placement="top">
                <Box sx={{ display: 'flex',backgroundColor: '#3C7795', borderRadius: '10px',p:1, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleQrScanToggle}>
                  {isQrScanning ?  <Pause sx={{color: 'white'}} width={15} height={15}/> : <img src={scanIcon} alt="Scan" width={24} height={24} />}
                </Box>
              </Tooltip>
                <Box sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, display: 'flex', gap: 1 }}>
                  <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                </Box>
              </Box>
            ) : (
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {viewAllType} Items ({totalItems} items)
                </Typography>
                <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
              </Box>
            )}
            // xs={12}
            // sm={6}
            // md={3}
            // lg={4}
            // xl={2.4}  
            spacing={2}
            containerHeight="calc(100vh - 200px)"
            currentPage={viewAllType ? 1 : currentPage}
            totalPages={viewAllType ? 1 : totalPages}
            totalItems={totalItems}
            pageSize={viewAllType ? totalItems : pageSize}
            onPageChange={viewAllType ? (() => {}) : handlePageChange}
            onPageSizeChange={viewAllType ? (() => {}) : handlePageSizeChange}
            showPageSizeSelector={!viewAllType}
            showTotalItems={!viewAllType}
            showPageNumbers={!viewAllType}
            maxPageNumbers={5}
            role={auth?.role}
            customerId={auth?.selectedCustomer?.C_Number}
          />
          </Paper>
}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <OrderDetails
            items={Object.entries(orderItems).map(([id, item]) => {
              // Try to get product data from cartItemsData first, then from data array
              const productData = cartItemsData[id] || data.find((p: any) => p.id === id);
              // Get base price components for display price calculation
              const basePrice = Number(productData?.price) || 0;
              const taxRate = Number(productData?.Tax_Rate) || 0;
              const prepaidTaxRate = Number(productData?.prepaidTaxRate) || 0;
              
              return {
                id,
                name: item.Description,
                quantity: item.quantity,
                price: item.price,
                priceWithTax: item.price, // Use the price as priceWithTax since it's already the main price
                placedBySalesPerson: item?.placedBySalesPerson,
                showWithOutPrice: productData?.showWithOutPrice,
                // Add quantity discount fields
                hasQtyDiscount: productData?.hasQtyDiscount,
                qtyDiscount: productData?.qtyDiscount,
                originalPrice: Number(productData?.price) || 0,
                // Base price components for display price calculation
                basePrice,
                taxRate,
                prepaidTaxRate
              };
            })}
            onQuantityChange={handleOrderDetailsQuantityChange}
            onRemoveItem={handleRemoveItem}
            onClear={handleClearOrder}
            onContinue={handleContinueOrder}
            onDiscountModalOpen={handleDiscountModalOpen}
          />
        </Grid>
      </Grid>
      


      <ProductDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
      <ProductHistoryModal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        product={selectedHistoryProduct}
      />
      
      {/* Price Change Modal */}
      <PriceChangeModal
        open={priceChangeModalOpen}
        onClose={handlePriceChangeClose}
        priceChangeItems={priceChangeItems}
      />
      
      {/* Inactive Items Modal */}
      <InactiveItemsModal
        open={inactiveItemsModalOpen}
        onClose={handleInactiveItemsModalClose}
        onConfirm={handleInactiveItemsClose}
        inactiveItems={inactiveItems}
        loading={inactiveItemsLoading}
      />
      
      {/* Quantity Discount Modal */}
      <QuantityDiscountModal
        open={discountModalOpen}
        onClose={() => {
          setDiscountModalOpen(false);
          setSelectedDiscountProduct(null);
          setSelectedDiscountData(null);
        }}
        onConfirm={handleDiscountConfirm}
        onNoDiscount={handleNoDiscount}
        product={selectedDiscountProduct}
        qtyDiscountData={selectedDiscountData}
       />
      
      {/* Clear Cart Confirmation Modal */}
      <DeleteConfirmationModal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear Cart"
        message="Are you sure you want to clear all items from your cart?"
      />
      
      {/* QR Scanning Disabled Modal */}
      <DeleteConfirmationModal
        open={qrDisabledModalOpen}
        onClose={() => setQrDisabledModalOpen(false)}
        onConfirm={() => setQrDisabledModalOpen(false)}
        title="Barcode Scanning Disabled"
        message={qrDisabledMessage}
        buttonText="OK"
        showCancelButton={false}
        buttonType="cancel"
      />
      
      {/* Toast Notification */}
      {toastMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            p: 2,
            borderRadius: 1,
            boxShadow: 3,
            minWidth: 300,
            maxWidth: 400,
            backgroundColor: toastMessage.type === 'success' ? 'success.main' : 
                           toastMessage.type === 'error' ? 'error.main' : 'info.main',
            color: 'white',
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              '0%': {
                transform: 'translateX(100%)',
                opacity: 0
              },
              '100%': {
                transform: 'translateX(0)',
                opacity: 1
              }
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {toastMessage.message}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default Order