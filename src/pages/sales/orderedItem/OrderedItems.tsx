import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux';
import { Box, Typography, IconButton } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Check as CheckIcon, Close as CloseIcon, Info as InfoIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { getCustomerOrderedProducts } from '../../../redux/apis/sales/orderedItemsApis';
import { fetchSalesCartItems } from '../../../redux/slices/salesCartSlice';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import SelectInput from '../../../component/atoms/SelectInput';
import TextInput from '../../../component/atoms/TextInput';
import image from '../../../assets/Default-Product-Image.jpg';
import { useAppDispatch } from '../../../redux/store';
import { addToCart, updateCartItem } from '../../../redux/apis/sales/salesOrderApis';
import QuantityDiscountModal from '../../../component/molecules/QuantityDiscountModal';
import { calculateTotalPrepaidTax, roundAmount } from '../../../utils/prepaidTaxUtils';
import { useShowPrepaidTax, calculateDisplayPrice } from '../../../utils/prepaidTaxDisplayUtils';

// Interface for the ordered item data
interface OrderedItem {
  Order_Number: number;
  Order_Date: string;
  Invoice_Total: number;
  Order_Source: string;
  Line_Number: number;
  Item_Number: number;
  Quantity_Ordered: number;
  Quantity_Shipped: number;
  Price: number;
  ItemDescription: string;
  CaseCount: number;
  Pack: number;
  Description: string;
  ALT_Description2: string;
  UOM: string;
  Price1: number;
  Price2: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  eCommerce: boolean;
  I_Inactive: boolean;
  Date_Created: string;
  OTP_Number: number;
  SalesCategory: string;
  PriceClass: string;
  UPCList: any[];
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  totalOrder?: number;
  hasProductLimit?: boolean;
  productLimit?: number | null;
  ProductInActive?: boolean;
  // Additional properties for cart functionality
  price?: number;
  priceWithTax?: number;
  Tax_Rate?: number;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  UnitOunces?: string;
  // Prepaid tax rate
  prepaidTaxRate?: number;
}

const OrderedItems = () => {
  const { selectedCustomer } = useSelector((state: any) => state.auth);
  const dispatch = useAppDispatch();
  
  // Get showWithPerpaidTax setting
  const { showWithPerpaidTax } = useShowPrepaidTax();
  
  const [data, setData] = useState<OrderedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('1week');
  
  // Cart state
  const [cartItemsData, setCartItemsData] = useState<{ [key: string]: any }>({});
  const [cartLoading, setCartLoading] = useState<{ [key: string]: boolean }>({});
  const [cartError, setCartError] = useState<string | null>(null);
  
  // Add orderItems state for quantity management
  const [orderItems, setOrderItems] = useState<{ [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } }>({});
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Bulk add state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Quantity discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] = useState<OrderedItem | null>(null);
  const [selectedDiscountData, setSelectedDiscountData] = useState<any>(null);

  // Date filter options
  const dateFilterOptions = [
    { label: 'All Time', value: '' },
    { label: 'Last 1 Week', value: '1week' },
    { label: 'Last 2 Weeks', value: '2week' },
    { label: 'Last 3 Weeks', value: '3week' },
    { label: 'Last 4 Weeks', value: '4week' },
    { label: 'Last 5 Weeks', value: '5week' },
    { label: 'Last 6 Weeks', value: '6week' },
    { label: 'Last 7 Weeks', value: '7week' },
    { label: 'Last 8 Weeks', value: '8week' },
    { label: 'Last 9 Weeks', value: '9week' },
    { label: 'Last 10 Weeks', value: '10week' },
    { label: 'Last 11 Weeks', value: '11week' },
    { label: 'Last 12 Weeks', value: '12week' },
  ];

  // Debounce search term to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search term changes
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load cart items on component mount and when selectedCustomer changes
  const loadCartItems = useCallback(async () => {
    if (!selectedCustomer?.C_Number) {
      // console.log('No selected customer, skipping cart load');  
      return;
    }
    
    try {
      // console.log('Loading sales cart items for customer:', selectedCustomer.C_Number);
      const result = await dispatch(fetchSalesCartItems(selectedCustomer.C_Number.toString()));
      if (fetchSalesCartItems.fulfilled.match(result)) {
        const response = result.payload;
        if (response) {
          // console.log('Sales cart response:', response);
          const cartItems: { [key: string]: any } = {};
          
          response?.finalCartItems?.forEach((item: any) => {
            const itemId = item.Item_Number.toString();
            // Use the same data structure as sales Order component
            const quantity = item.Product?.Qty || 0;
            const productId = item.Product?.id || 0;
            const price = parseFloat(item.Product?.Price_With_Tax) || parseFloat(item.Product?.Price) || item.price || 0;
            const priceWithTax = item.Product?.Price_With_Tax || item.priceWithTax || 0;
            const taxRate = item.Product?.Tax_Rate || item.Tax_Rate || 0;
            
            // console.log(`Processing sales cart item ${itemId}:`, {
            //   originalItem: item,
            //   mappedData: { quantity, productId, price, priceWithTax, taxRate }
            // });
            
            cartItems[itemId] = {
              quantity: quantity,
              productId: productId,
              price: price,
              priceWithTax: priceWithTax,
              Tax_Rate: taxRate
            };
          });
          
          // console.log('Processed sales cart items:', cartItems);
          setCartItemsData(cartItems);
        } else {
          // console.log('No sales cart response data');
          setCartItemsData({});
        }
      } else {
        // console.log('Sales cart fetch not fulfilled:', result);
        setCartItemsData({});
      }
    } catch (error) {
      console.error('Failed to load sales cart items:', error);
      setCartItemsData({});
    }
  }, [dispatch, selectedCustomer?.C_Number]);

  // Load cart items on mount and when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer?.C_Number) {
      loadCartItems();
    }
  }, [loadCartItems, selectedCustomer?.C_Number]);

  // Helper function to calculate cart payload with prepaidTaxRate
  // New calculation: Price_With_Tax = Price_With_Tax * (1 + prepaidTaxRate)
  // Where base Price_With_Tax = price + Tax_Rate
  const calculateCartPayload = (product: OrderedItem, quantity: number, finalPriceWithTax?: number) => {
    // Convert all values to numbers to prevent string operations
    const basePrice = Number(product.price || product.Price || 0);
    const prepaidTaxRate = Number(product.prepaidTaxRate || 0);
    const taxRate = Number(product.Tax_Rate || 0);
    const qty = Number(quantity) || 0;
    
    let priceWithTax: number;
    let price: number;
    let totalPrepaidTax: number;
    
    if (finalPriceWithTax !== undefined) {
      // For discounted items, use the provided finalPriceWithTax (with our rounding rule)
      priceWithTax = roundAmount(Number(finalPriceWithTax) || 0);
      
      // Calculate base Price_With_Tax (before prepaid tax): finalPriceWithTax / (1 + prepaidTaxRate)
      const basePriceWithTax = prepaidTaxRate > 0 ? priceWithTax / (1 + prepaidTaxRate) : priceWithTax;
      
      // Calculate price from basePriceWithTax: basePriceWithTax - Tax_Rate
      price = basePriceWithTax - taxRate;
      
      // Prepaid tax: round per-unit first, then multiply by qty
      totalPrepaidTax = calculateTotalPrepaidTax(basePriceWithTax, prepaidTaxRate, qty);
    } else {
      // Standard calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = basePrice + taxRate;
      
      // Calculate final Price_With_Tax: basePriceWithTax * (1 + prepaidTaxRate)
      priceWithTax = roundAmount(basePriceWithTax * (1 + prepaidTaxRate));
      price = basePrice;
      
      // Prepaid tax: round per-unit first, then multiply by qty
      totalPrepaidTax = calculateTotalPrepaidTax(basePriceWithTax, prepaidTaxRate, qty);
    }
    
    // Always round unit Price_With_Tax first, then multiply
    const unitPriceWithTax = roundAmount(priceWithTax);
    const totalPriceWithTax = unitPriceWithTax * qty;
    
    return {
      Price: Number(Number(price).toFixed(2)),
      Price_With_Tax: unitPriceWithTax,
      Qty: Number(qty),
      Tax_Rate: Number(Number(taxRate).toFixed(2)),
      TotalPrice: Number(Number(price * qty).toFixed(2)),
      TotalPriceWithTax: Number(Number(totalPriceWithTax).toFixed(2)),
      originalPrice: Number(Number(basePrice).toFixed(2)),
      prepaidTaxRate: Number(Number(prepaidTaxRate).toFixed(4)), // Pass actual prepaidTaxRate from API
      TotalprepaidTaxRate: Number(totalPrepaidTax.toFixed(2))
    };
  };

  // Ensure orderItems are populated on component mount if cart data is already available
  useEffect(() => {
    // This runs once when component mounts
    if (Object.keys(cartItemsData).length > 0) {
      // console.log('Sales component mounted with existing cart data, populating orderItems');
      const initialOrderItems: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } } = {};
      
      Object.keys(cartItemsData).forEach(itemId => {
        const cartItem = cartItemsData[itemId];
        if (cartItem?.quantity > 0) {
          initialOrderItems[itemId] = {
            quantity: cartItem.quantity,
            Description: "",
            price: cartItem.price || 0,
            productId: cartItem.productId || 0,
            placedBySalesPerson: false
          };
        }
      });
      
      if (Object.keys(initialOrderItems).length > 0) {
        // console.log('Setting initial sales orderItems on mount from existing cart data:', initialOrderItems);
        setOrderItems(initialOrderItems);
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // Synchronize orderItems with cart data whenever cart data changes
  useEffect(() => {
    if (Object.keys(cartItemsData).length > 0) {
      // console.log('Synchronizing sales orderItems with cart data:', cartItemsData);
      
      setOrderItems(prev => {
        const updatedOrderItems = { ...prev };
        
        // For each item in cart, ensure orderItems has the cart quantity
        Object.keys(cartItemsData).forEach(itemId => {
          const cartItem = cartItemsData[itemId];
          if (cartItem?.quantity > 0) {
            // Always update orderItems with cart quantity if it's different or missing
            if (!updatedOrderItems[itemId] || updatedOrderItems[itemId].quantity !== cartItem.quantity) {
              updatedOrderItems[itemId] = {
                quantity: cartItem.quantity,
                Description: updatedOrderItems[itemId]?.Description || "",
                price: cartItem.price || 0,
                productId: cartItem.productId || 0,
                placedBySalesPerson: updatedOrderItems[itemId]?.placedBySalesPerson || false
              };
              // console.log(`Updated sales orderItems for item ${itemId} with cart quantity: ${cartItem.quantity}`);
            }
          }
        });
        
        // console.log('Final synchronized sales orderItems:', updatedOrderItems);
        return updatedOrderItems;
      });
    }
  }, [cartItemsData]); // This will run every time cartItemsData changes

  // Force re-initialization when component mounts or data changes
  useEffect(() => {
    if (data.length > 0 && Object.keys(cartItemsData).length > 0) {
      // console.log('Re-initializing sales orderItems after data load');
      const initialOrderItems: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } } = {};
      
      // For each item in cart, initialize orderItems with cart quantity
      Object.keys(cartItemsData).forEach(itemId => {
        const cartItem = cartItemsData[itemId];
        if (cartItem?.quantity > 0) {
          initialOrderItems[itemId] = {
            quantity: cartItem.quantity,
            Description: "",
            price: cartItem.price || 0,
            productId: cartItem.productId || 0,
            placedBySalesPerson: false
          };
        }
      });
      
      if (Object.keys(initialOrderItems).length > 0) {
        setOrderItems(prev => ({ ...prev, ...initialOrderItems }));
      }
    }
  }, [data, cartItemsData]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      setOrderItems({});
    };
  }, []);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handle discount confirmation
  const handleDiscountConfirm = (discountInfo: any) => {
    if (selectedDiscountProduct && discountInfo) {
      try {
        // Apply the discount and add the specified quantity to cart
        const product = selectedDiscountProduct;
        
        // Use the exact discount quantity, not the manually typed quantity
        const quantity = discountInfo.minQty;
        
        // Calculate discounted price
        // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
        // Convert all values to numbers to prevent string operations
        const basePrice = Number(product.price || product.Price || 0);
        const prepaidTaxRate = Number(product.prepaidTaxRate || 0);
        const taxRate = Number(product.Tax_Rate || 0);
        
        let discountedBasePrice = basePrice;
        if (discountInfo.type === 'case') {
          // Case discount: apply percentage discount to base price
          const discountPercentage = Number(discountInfo.discountPercentage || 0);
          const discountAmount = (basePrice * discountPercentage) / 100;
          discountedBasePrice = basePrice - discountAmount;
        } else if (discountInfo.type === 'quantity') {
          // Quantity discount: apply based on discount tier to base price
          if (discountInfo.discount.hasPercentageDiscount) {
            const perDiscount = Number(discountInfo.discount.perDiscount || 0);
            const discountAmount = (basePrice * perDiscount) / 100;
            discountedBasePrice = basePrice - discountAmount;
          } else {
            // Apply amount discount to base price
            const amountDiscount = Number(discountInfo.discount.amountDiscount || 0);
            discountedBasePrice = basePrice - amountDiscount;
          }
        }
        
        // Ensure discounted base price doesn't go below 0
        discountedBasePrice = Math.max(0, discountedBasePrice);
        
        // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
        const basePriceWithTax = discountedBasePrice + taxRate;
        const discountedPrice = roundAmount(basePriceWithTax * (1 + prepaidTaxRate));
        
        // Update local state with discounted price
        setOrderItems(prev => ({
          ...prev,
          [product.Item_Number.toString()]: {
            quantity: quantity,
            Description: product.Description || "",
            price: discountedPrice, // Use discounted price
            productId: prev[product.Item_Number.toString()]?.productId || 0,
            placedBySalesPerson: false
          }
        }));
        
        // Add to cart via API with discounted price
        setTimeout(async () => {
          try {
            const payload = calculateCartPayload(product, quantity, discountedPrice);
            await addToCart(selectedCustomer?.C_Number?.toString() || '', {
              Item_Number: product.Item_Number,
              ...payload
            });
            
            // Refresh cart data
            await loadCartItems();
            
            showToast(`Discount applied! Added ${quantity} ${product.Description} to cart with discounted price.`, 'success');
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
  // const handleDiscountModalOpen = (product: any, discountData: any) => {
  //   setSelectedDiscountProduct(product);
  //   setSelectedDiscountData(discountData);
  //   setDiscountModalOpen(true);
  // };

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
          [product.Item_Number.toString()]: {
            quantity: quantity,
            Description: product.Description || "",
            price: product.priceWithTax || product.price || 0, // Use original price (no discount)
            productId: prev[product.Item_Number.toString()]?.productId || 0,
            placedBySalesPerson: false
          }
        }));
        
        // Add to cart via API with original price
        setTimeout(async () => {
          try {
            const payload = calculateCartPayload(product, quantity);
            await addToCart(selectedCustomer?.C_Number?.toString() || '', {
              Item_Number: product.Item_Number,
              ...payload
            });
            
            // Refresh cart data
            await loadCartItems();
            
            showToast(`Added ${quantity} ${product.Description} to cart without discount.`, 'success');
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

  const fetchOrderedItems = useCallback(async () => {
    if (!selectedCustomer?.C_Number) return;

    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      // Add search term if provided
      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      // Add date filter if provided
      if (dateFilter) {
        params.filter = dateFilter;
      }

      const res: any = await getCustomerOrderedProducts(selectedCustomer.C_Number, params);
      
      if (res?.data) {
        setData(res?.data?.data);
        setTotalItems(res?.data?.totalCount || 0);
        setTotalPages(Math.ceil((res?.data?.totalCount || 0) / pageSize));
      } else {
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error('Error fetching ordered items:', err);
      setError(err?.message || 'Failed to fetch ordered items');
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer?.C_Number, currentPage, pageSize, debouncedSearchTerm, dateFilter]);

  useEffect(() => {
    fetchOrderedItems();
  }, [fetchOrderedItems]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Don't reset page here, let the debounced effect handle it
  };

  const handleDateFilterChange = (e: any) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle initializing quantity when cart icon is clicked
  const handleInitializeQuantity = (item: any) => {
    // Check if product is inactive
    if (item.ProductInActive) {
      showToast('Product is not available', 'error');
      return;
    }
    
    // Check if quantity ordered is 0 or negative
    const quantityOrdered = item.totalOrder || item.Quantity_Ordered || 0;
    if (quantityOrdered <= 0) {
      showToast('Quantity ordered is 0 or negative, cannot add to cart', 'error');
      return;
    }
    
    const itemId = item.Item_Number.toString();
    const isInCart = cartItemsData[itemId];
    
    // If item is in cart, use cart quantity; otherwise use ordered quantity
    const finalQuantity = isInCart 
      ? (cartItemsData[itemId]?.quantity || quantityOrdered)
      : quantityOrdered;
    
    setOrderItems(prev => ({
      ...prev,
      [itemId]: {
        quantity: finalQuantity,
        Description: item.Description || "",
        price: item.price || 0,
        productId: isInCart ? cartItemsData[itemId]?.productId || 0 : 0,
        placedBySalesPerson: false
      }
    }));
  };

  // Handle quantity changes with +/- buttons
  const handleQuantityChange = (itemId: string, change: number) => {
    // Get the current quantity from orderItems (if editing) or cart (if in cart)
    const currentQuantity = orderItems[itemId]?.quantity !== undefined 
      ? orderItems[itemId].quantity 
      : (cartItemsData[itemId]?.quantity || 0);
    
    const newQuantity = currentQuantity + change;
    
    if (newQuantity >= 0) {
      // Check product limit if applicable
      const item = data.find(item => item.Item_Number.toString() === itemId);
      if (item?.hasProductLimit && item?.productLimit !== null && item?.productLimit !== undefined) {
        const currentCartQuantity = cartItemsData[itemId]?.quantity || 0;
        const newTotalQuantity = currentCartQuantity + newQuantity;
        
        if (newTotalQuantity > item.productLimit) {
          showToast(`Cannot add more than ${item.productLimit} items. Current cart: ${currentCartQuantity}, trying to set: ${newQuantity}`, 'error');
          return;
        }
      }
      
      // Remove the manual discount checking - let handleAddToCart handle it
      setOrderItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity,
          // Preserve existing data or set defaults
          Description: prev[itemId]?.Description || "",
          price: prev[itemId]?.price || 0,
          productId: prev[itemId]?.productId || cartItemsData[itemId]?.productId || 0,
          placedBySalesPerson: prev[itemId]?.placedBySalesPerson || false
        }
      }));
    }
  };

  // Handle direct quantity input changes
  const handleQuantityInputChange = (itemId: string, value: string) => {
    // Allow empty string for clearing input - set to 0
    if (value === '') {
      setOrderItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: 0,
          // Preserve existing data or set defaults
          Description: prev[itemId]?.Description || "",
          price: prev[itemId]?.price || 0,
          productId: prev[itemId]?.productId || cartItemsData[itemId]?.productId || 0,
          placedBySalesPerson: prev[itemId]?.placedBySalesPerson || false
        }
      }));
      return;
    }
    
    const numericValue = parseInt(value, 10);
    
    // Check if it's a valid number
    if (isNaN(numericValue) || numericValue < 0) {
      return;
    }
    
    // Check product limit if applicable
    const item = data.find(item => item.Item_Number.toString() === itemId);
    if (item?.hasProductLimit && item?.productLimit !== null && item?.productLimit !== undefined) {
      const currentCartQuantity = cartItemsData[itemId]?.quantity || 0;
      const newTotalQuantity = currentCartQuantity + numericValue;
      
      if (newTotalQuantity > item.productLimit) {
        showToast(`Cannot add more than ${item.productLimit} items. Current cart: ${currentCartQuantity}, trying to set: ${numericValue}`, 'error');
        return;
      }
    }
    
    setOrderItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: numericValue,
        // Preserve existing data or set defaults
        Description: prev[itemId]?.Description || "",
        price: prev[itemId]?.price || 0,
        productId: prev[itemId]?.productId || cartItemsData[itemId]?.productId || 0,
        placedBySalesPerson: prev[itemId]?.placedBySalesPerson || false
      }
    }));
  };

  // Handle adding item to cart with Quantity_Ordered
  const handleAddToCart = async (item: any) => {
    const itemId = item.Item_Number.toString();
    const quantityOrdered = orderItems[itemId]?.quantity || item.totalOrder || item.Quantity_Ordered || 0;
    
    // Check if product is inactive
    if (item.ProductInActive) {
      showToast('Product is not available', 'error');
      return;
    }
    
    // Check product limit if applicable
    if (item.hasProductLimit && item.productLimit !== null && item.productLimit !== undefined) {
      const currentCartQuantity = cartItemsData[itemId]?.quantity || 0;
      const newTotalQuantity = currentCartQuantity + quantityOrdered;
      
      if (newTotalQuantity > item.productLimit) {
        const errorMessage = `Cannot add more than ${item.productLimit} items. Current cart: ${currentCartQuantity}, trying to add: ${quantityOrdered}`;
        showToast(errorMessage, 'error');
        return;
      }
    }
    
    // Check if this is the first time adding this product and if it has quantity discount
    const isFirstTimeAdding = !cartItemsData[itemId]?.productId;
    if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount) {
      // Open discount modal automatically for first-time additions
      setSelectedDiscountProduct(item);
      setSelectedDiscountData(item.qtyDiscount);
      setDiscountModalOpen(true);
      
      // Show toast message about discount modal
      showToast(`Quantity discount available for ${item.Description}! Please review discount options.`, 'info');
      return; // Don't add to cart yet, wait for modal confirmation
    }
    
    // Check if item is already in cart
    const existingCartItem = cartItemsData[itemId];
    
    // Set loading state for this specific item
    setCartLoading(prev => ({ ...prev, [itemId]: true }));
    setCartError(null);

    try {
      // Check if quantity discount should be applied for existing items
      // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
      // Convert all values to numbers to prevent string operations
      const basePrice = Number(item.price || item.Price || 0);
      const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
      const taxRate = Number(item.Tax_Rate || 0);
      const qtyOrdered = Number(quantityOrdered) || 0;
      
      let discountedBasePrice = basePrice;
      let discountApplied = false;
      
      if (item.hasQtyDiscount && item.qtyDiscount) {
        const minQtyForCaseDiscount = Number(item.qtyDiscount.minimumQtyForCaseDiscount || 0);
        if (item.qtyDiscount.isCaseDiscount && qtyOrdered >= minQtyForCaseDiscount) {
          // Apply case discount to base price
          const percentageCaseDiscount = Number(item.qtyDiscount.percentageCaseDiscount || 0);
          const discountAmount = (basePrice * percentageCaseDiscount) / 100;
          discountedBasePrice = basePrice - discountAmount;
          discountApplied = true;
        } else if (item.qtyDiscount.isQtyDiscount) {
          // Find applicable quantity discount tier
          const applicableDiscount = item.qtyDiscount.qtyDiscount
            .filter((discount: any) => qtyOrdered >= Number(discount.minQty || 0))
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
      
      const payload = calculateCartPayload(item, qtyOrdered, discountApplied ? finalPriceWithTax : undefined);
      if (existingCartItem?.productId) {
        // Update existing cart item
        await updateCartItem(existingCartItem.productId.toString(), payload, selectedCustomer?.C_Number?.toString() || '');
        showToast('Cart item updated successfully!', 'success');
      } else {
        // Add new item to cart
        await addToCart(selectedCustomer?.C_Number?.toString() || '', {
          Item_Number: item.Item_Number,
          ...payload
        });
        showToast('Item added to cart successfully!', 'success');
      }
      
      // Update local state with discounted price if discount was applied
      if (discountApplied) {
        setOrderItems(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            price: finalPriceWithTax
          }
        }));
      }
      
      // Refresh cart data
      await loadCartItems();
      
      // Keep the quantity in orderItems for cart items, don't clear it
      // This allows editing the quantity even after adding to cart
      
    } catch (error: any) {
      console.error('Failed to update cart:', error);
      setCartError(error?.message || 'Failed to update cart');
      showToast('Failed to update cart.', 'error');
    } finally {
      setCartLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };


  // Handle bulk add to cart
  const handleBulkAddToCart = async () => {
    if (selectedItems.size === 0) {
      showToast('Please select items to add to cart', 'info');
      return;
    }

    setBulkLoading(true);
    setCartError(null);

    try {
      const selectedItemsArray = Array.from(selectedItems);
      let successCount = 0;
      let errorCount = 0;

      // Process each selected item
      for (const itemId of selectedItemsArray) {
        const item = data.find(item => item.Item_Number.toString() === itemId) as any;
        if (!item) continue;

        // Check if product is inactive
        if (item.ProductInActive) {
          showToast(`Product ${item.Description} is not available`, 'error');
          errorCount++;
          continue;
        }

        try {
          const existingCartItem = cartItemsData[itemId];
          
          // Initialize quantity for the item if not already set
          if (!orderItems[itemId]) {
            const quantityOrdered = existingCartItem?.productId 
              ? (existingCartItem.quantity || item.totalOrder || item.Quantity_Ordered || 0)
              : (item.totalOrder || item.Quantity_Ordered || 0);
            
            // Check product limit if applicable
            if (item.hasProductLimit && item.productLimit !== null && item.productLimit !== undefined) {
              const currentCartQuantity = existingCartItem?.quantity || 0;
              const newTotalQuantity = currentCartQuantity + quantityOrdered;
              
              if (newTotalQuantity > item.productLimit) {
                const errorMessage = `Cannot add more than ${item.productLimit} items for ${item.Description}. Current cart: ${currentCartQuantity}, trying to add: ${quantityOrdered}`;
                showToast(errorMessage, 'error');
                errorCount++;
                continue;
              }
            }
            
            // Check if this is the first time adding this product and if it has quantity discount
            const isFirstTimeAdding = !existingCartItem?.productId;
            if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount) {
              // For bulk operations, we'll skip items with quantity discounts and show a message
              showToast(`Skipping ${item.Description} - quantity discount available. Please add individually to review discount options.`, 'info');
              errorCount++;
              continue;
            }
            
            setOrderItems(prev => ({
              ...prev,
              [itemId]: {
                quantity: quantityOrdered,
                Description: item.Description || "",
                price: item.price || 0,
                productId: existingCartItem?.productId || 0,
                placedBySalesPerson: false
              }
            }));
          }

          if (existingCartItem?.productId) {
            // Update existing cart item
            const quantityToUpdate = orderItems[itemId]?.quantity || existingCartItem.quantity || item.Quantity_Ordered;
            
            // Check if quantity discount should be applied
            let finalPrice = item.priceWithTax || item.price || 0;
            // let discountApplied = false;
            
            if (item.hasQtyDiscount && item.qtyDiscount) {
              if (item.qtyDiscount.isCaseDiscount && quantityToUpdate >= item.qtyDiscount.minimumQtyForCaseDiscount) {
                // Apply case discount
                const discountAmount = (finalPrice * item.qtyDiscount.percentageCaseDiscount) / 100;
                finalPrice = finalPrice - discountAmount;
                // discountApplied = true;
              } else if (item.qtyDiscount.isQtyDiscount) {
                // Find applicable quantity discount tier
                const applicableDiscount = item.qtyDiscount.qtyDiscount
                  .filter((discount: any) => quantityToUpdate >= discount.minQty)
                  .sort((a: any, b: any) => b.minQty - a.minQty)[0];
                
                if (applicableDiscount) {
                  if (applicableDiscount.hasPercentageDiscount) {
                    const discountAmount = (finalPrice * applicableDiscount.perDiscount) / 100;
                    finalPrice = finalPrice - discountAmount;
                  } else {
                    finalPrice = finalPrice - applicableDiscount.amountDiscount;
                  }
                  // discountApplied = true;
                }
              }
            }
            
            // Ensure price doesn't go below 0 and apply consistent rounding for Price_With_Tax
            finalPrice = Math.max(0, finalPrice);
            const unitPriceWithTax = roundAmount(finalPrice);
            const totalPriceWithTax = unitPriceWithTax * quantityToUpdate;
            
            await updateCartItem(existingCartItem.productId, {
              Qty: quantityToUpdate,
              Price: item.price - (item.priceWithTax - unitPriceWithTax) || 0,
              Price_With_Tax: unitPriceWithTax, // Use rounded discounted price
              Tax_Rate: item.Tax_Rate || 0,
              TotalPrice: (item.price || 0) * quantityToUpdate,
              TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
              originalPrice: item.price || 0
            }, selectedCustomer?.C_Number?.toString() || '');
            successCount++;
          } else {
            // Add new item to cart
            const quantityToAdd = orderItems[itemId]?.quantity || item.Quantity_Ordered;
            
            // Check if quantity discount should be applied
            let finalPrice = item.priceWithTax || item.price || 0;
            // let discountApplied = false;
            
            if (item.hasQtyDiscount && item.qtyDiscount) {
              if (item.qtyDiscount.isCaseDiscount && quantityToAdd >= item.qtyDiscount.minimumQtyForCaseDiscount) {
                // Apply case discount
                const discountAmount = (finalPrice * item.qtyDiscount.percentageCaseDiscount) / 100;
                finalPrice = finalPrice - discountAmount;
                // discountApplied = true;
              } else if (item.qtyDiscount.isQtyDiscount) {
                // Find applicable quantity discount tier
                const applicableDiscount = item.qtyDiscount.qtyDiscount
                  .filter((discount: any) => quantityToAdd >= discount.minQty)
                  .sort((a: any, b: any) => b.minQty - a.minQty)[0];
                
                if (applicableDiscount) {
                  if (applicableDiscount.hasPercentageDiscount) {
                    const discountAmount = (finalPrice * applicableDiscount.perDiscount) / 100;
                    finalPrice = finalPrice - discountAmount;
                  } else {
                    finalPrice = finalPrice - applicableDiscount.amountDiscount;
                  }
                  // discountApplied = true;
                }
              }
            }
            
            // Ensure price doesn't go below 0 and apply consistent rounding for Price_With_Tax
            finalPrice = Math.max(0, finalPrice);
            const unitPriceWithTaxAdd = roundAmount(finalPrice);
            const totalPriceWithTaxAdd = unitPriceWithTaxAdd * quantityToAdd;
            
            await addToCart(selectedCustomer?.C_Number?.toString() || '', {
              Item_Number: item.Item_Number,
              Price: item.price - (item.priceWithTax - unitPriceWithTaxAdd) || 0,
              Price_With_Tax: unitPriceWithTaxAdd, // Use rounded discounted price
              Qty: quantityToAdd,
              Tax_Rate: item.Tax_Rate || 0,
              TotalPrice: (item.price || 0) * quantityToAdd,
              TotalPriceWithTax: Number(totalPriceWithTaxAdd.toFixed(2)),
              originalPrice: item.price || 0
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to add item ${itemId} to cart:`, error);
          errorCount++;
        }
      }

      // Refresh cart data
      await loadCartItems();
      
      // Show results
      if (successCount > 0 && errorCount === 0) {
        showToast(`Successfully processed ${successCount} items!`, 'success');
      } else if (successCount > 0 && errorCount > 0) {
        showToast(`Processed ${successCount} items, ${errorCount} failed`, 'warning');
      } else if (successCount === 0 && errorCount > 0) {
        showToast('Failed to process items', 'error');
      } else {
        showToast('No items to process', 'info');
      }

      // Clear selection and orderItems after bulk add
      setSelectedItems(new Set());
      setOrderItems({});
      
    } catch (error: any) {
      console.error('Failed to bulk add items to cart:', error);
      setCartError(error?.message || 'Failed to add items to cart');
      showToast('Failed to add items to cart.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle select all items
  const handleSelectAll = () => {
    if (selectedItems.size === data.length) {
      // If all are selected, deselect all
      setSelectedItems(new Set());
      // Also clear any quantity inputs
      setOrderItems({});
    } else {
      // Select all items (excluding inactive products, items with quantity discounts, and items with 0 or negative quantity ordered)
      const activeItems = data.filter(item => !item.ProductInActive);
      const itemsWithPositiveQuantity = activeItems.filter(item => {
        const quantityOrdered = item.totalOrder || item.Quantity_Ordered || 0;
        return quantityOrdered > 0;
      });
      const itemsWithoutDiscounts = itemsWithPositiveQuantity.filter(item => !item.hasQtyDiscount);
      const itemsWithDiscounts = itemsWithPositiveQuantity.filter(item => item.hasQtyDiscount);
      const itemsWithZeroOrNegativeQuantity = activeItems.filter(item => {
        const quantityOrdered = item.totalOrder || item.Quantity_Ordered || 0;
        return quantityOrdered <= 0;
      });
      
      if (itemsWithDiscounts.length > 0) {
        showToast(`${itemsWithDiscounts.length} item(s) have quantity discounts and will be skipped. Please add them individually to review discount options.`, 'info');
      }
      
      if (itemsWithZeroOrNegativeQuantity.length > 0) {
        showToast(`${itemsWithZeroOrNegativeQuantity.length} item(s) have 0 or negative quantity ordered and will be skipped.`, 'info');
      }
      
      const allItemIds = itemsWithoutDiscounts.map(item => item.Item_Number.toString());
      setSelectedItems(new Set(allItemIds));
      
      // Initialize quantities for all selected items
      const newOrderItems: { [key: string]: { quantity: number; price: number; Description: string; productId: number; placedBySalesPerson: boolean } } = {};
      itemsWithoutDiscounts.forEach(item => {
        const itemId = item.Item_Number.toString();
        const quantityOrdered = item.totalOrder || item.Quantity_Ordered || 0;
        newOrderItems[itemId] = {
          quantity: quantityOrdered,
          Description: item.Description || "",
          price: item.price || 0,
          productId: 0,
          placedBySalesPerson: false
        };
      });
      setOrderItems(newOrderItems);
    }
  };

  // Function to clear quantity input for a specific item
  const handleClearQuantity = (itemId: string) => {
    setOrderItems(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Table columns configuration
  const columns: TableColumn<OrderedItem>[] = [
   
    {
      id: 'Item_Number',
      label: 'Item Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize="14px" color="textSecondary">
          {row.Item_Number}
        </Typography>
      ),
    },
    {
      id: 'Product',
      label: 'Product',
      minWidth: 200,
      render: (row) => (
                 <Box display="flex" alignItems="center" gap={2}>
           <img 
             src={row.showDistributorImage && row.distributorImage ? row.distributorImage : row.masterImage} 
             onError={(e) => {
               e.currentTarget.src = image;
             }}
             alt={row.Description} 
             style={{ width: 40, height: 40, objectFit: 'contain' }} 
           />
          <Box>
            <Typography fontSize={14} fontWeight={400}>{row.Description}</Typography>
            <Typography fontSize={12} color="text.secondary">
              Pack: {row.Pack || "-"} Case: {row.CaseCount || "-"} Size: {row.UOM || "-"} Unit: {row.UnitOunces || "-"}
            </Typography>
            {/* Product status indicators */}
            {row.ProductInActive && (
              <Typography fontSize="11px" color="error.main" fontWeight={500}>
                ⚠️ Product Not Available
              </Typography>
            )}
            {row.hasProductLimit && row.productLimit !== null && (
              <Typography fontSize="11px" color="warning.main" fontWeight={500}>
                📦 Limit: {row.productLimit} items
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'totalOrder',
      label: 'Quantity Ordered',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Typography fontSize="14px" color="textSecondary">
          {row.totalOrder || row.Quantity_Ordered || 0}
        </Typography>
      ),
    },
    {
      id: 'priceWithTax',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      render: (row) => {
        // Calculate display price based on showWithPerpaidTax setting
        const basePrice = Number(row.price || row.Price || 0);
        const taxRate = Number(row.Tax_Rate || 0);
        const prepaidTaxRate = Number(row.prepaidTaxRate || 0);
        const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
        
        return (
          <Typography fontSize="14px" color="textSecondary">
            ${displayPrice}
          </Typography>
        );
      },
    },
    {
      id: 'cart',
      label: 'Actions',
      minWidth: 160,
      align: 'right',
      render: (row) => {
        const itemId = row.Item_Number.toString();
        const isInCart = cartItemsData[itemId];
        const isLoading = cartLoading[itemId];
        const quantityOrdered = row.totalOrder || row.Quantity_Ordered || 0;
        let currentQuantity = 0;
        
        if (orderItems[itemId]?.quantity !== undefined) {
          currentQuantity = orderItems[itemId].quantity;
        } else if (isInCart && cartItemsData[itemId]?.quantity > 0) {
          currentQuantity = cartItemsData[itemId].quantity;
        }
        
        if (isInCart && currentQuantity === 0) {
          const cartQuantity = cartItemsData[itemId]?.quantity;
          if (cartQuantity > 0) {
            currentQuantity = cartQuantity;
          }
        }
        
        return (
          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
            {quantityOrdered <= 0 ? (
              // Quantity ordered is 0 or negative - show disabled state
              <Box 
                sx={{
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  opacity: 0.6
                }}
              >
                <InfoIcon sx={{ fontSize: 12 }} />
                <Typography fontSize="10px" fontWeight={500}>
                  N/A
                </Typography>
              </Box>
            ) : isInCart ? (
              // Item in cart - show quantity controls with input
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1}
                sx={{
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: '6px',
                  padding: '4px 8px'
                }}
              >
                <Typography 
                  fontSize="10px" 
                  color="success.main"
                  fontWeight={600}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  CART
                </Typography>
                
                <Box sx={{ width: '1px', height: '16px', backgroundColor: 'success.main', mx: 0.5 }} />
                
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(row.Item_Number.toString(), -1)}
                  disabled={isLoading}
                  sx={{ 
                    color: 'error.main',
                    padding: '2px',
                    minWidth: '18px',
                    minHeight: '18px'
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 10 }} />
                </IconButton>
                
                <input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => handleQuantityInputChange(row.Item_Number.toString(), e.target.value)}
                  min="0"
                  style={{
                    width: '40px',
                    height: '20px',
                    textAlign: 'center',
                    border: '1px solid #4caf50',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#4caf50',
                    outline: 'none',
                    padding: '0 2px',
                    WebkitAppearance: 'textfield',
                    MozAppearance: 'textfield'
                  }}
                />
                
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(row.Item_Number.toString(), 1)}
                  disabled={isLoading}
                  sx={{ 
                    color: 'success.main',
                    padding: '2px',
                    minWidth: '18px',
                    minHeight: '18px'
                  }}
                >
                  <AddIcon sx={{ fontSize: 10 }}/>
                </IconButton>
                
                <Box sx={{ width: '1px', height: '16px', backgroundColor: 'success.main', mx: 0.5 }} />
                
                <IconButton
                  size="small"
                  onClick={() => handleAddToCart(row)}
                  disabled={isLoading}
                  sx={{ 
                    color: 'success.main',
                    padding: '4px',
                    minWidth: '20px',
                    minHeight: '20px'
                  }}
                >
                  <CheckIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ) : currentQuantity > 0 ? (
              // Quantity input active - show controls with input
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: '6px',
                  padding: '4px 8px'
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(row.Item_Number.toString(), -1)}
                  disabled={isLoading}
                  sx={{ 
                    color: 'error.main',
                    padding: '2px',
                    minWidth: '18px',
                    minHeight: '18px'
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 10 }} />
                </IconButton>
                
                <input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => handleQuantityInputChange(row.Item_Number.toString(), e.target.value)}
                  min="0"
                  style={{
                    width: '40px',
                    height: '20px',
                    textAlign: 'center',
                    border: '1px solid #1976d2',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1976d2',
                    outline: 'none',
                    padding: '0 2px',
                    WebkitAppearance: 'textfield',
                    MozAppearance: 'textfield'
                  }}
                />
                
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(row.Item_Number.toString(), 1)}
                  disabled={isLoading}
                  sx={{ 
                    color: 'success.main',
                    padding: '2px',
                    minWidth: '18px',
                    minHeight: '18px'
                  }}
                >
                  <AddIcon sx={{ fontSize: 10 }} />
                </IconButton>
                
                <Box sx={{ width: '1px', height: '16px', backgroundColor: 'primary.main', mx: 0.5 }} />
                
                <IconButton
                  size="small"
                  onClick={() => handleAddToCart(row)}
                  disabled={isLoading}
                  sx={{ 
                    padding: '4px',
                    minWidth: '20px',
                    minHeight: '20px',
                    color: 'primary.main'
                  }}
                >
                  <CheckIcon sx={{ fontSize: 12 }} />
                </IconButton>
                
                <IconButton
                  size="small"
                  onClick={() => handleClearQuantity(row.Item_Number.toString())}
                  disabled={isLoading}
                  sx={{ 
                    color: 'error.main',
                    padding: '2px',
                    minWidth: '18px',
                    minHeight: '18px'
                  }}
                >
                  <CloseIcon sx={{ fontSize: 10 }} />
                </IconButton>
              </Box>
            ) : row.ProductInActive ? (
              // Inactive product - show disabled state
              <Box 
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'grey.500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <InfoIcon sx={{ fontSize: 12 }} />
                <Typography fontSize="10px" fontWeight={500}>
                  N/A
                </Typography>
              </Box>
            ) : (
              // Default state - show add button
              <Box 
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'primary.main',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { 
                    backgroundColor: 'primary.light',
                    color: 'primary.dark'
                  },
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleInitializeQuantity(row)}
              >
                <ShoppingCartIcon sx={{ fontSize: 12 }} />
                <Typography fontSize="10px" fontWeight={600}>
                  ADD
                </Typography>
              </Box>
            )}
            
            {isLoading && (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  border: '1px solid',
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
          </Box>
        );
      },
    },
  ];

  return (
    <Box p={{ xs: "10px", sm: "10px", md: "10px 15px" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={2}
      >
        <Typography fontSize="22px" fontWeight={500}>
          Ordered Items
        </Typography>
        
        {/* Bulk Actions */}
        <Box display="flex" gap={2} alignItems="center">
          {data.length > 0 && (
            <>
              <Typography fontSize="14px" color="textSecondary">
                {selectedItems.size} of {data.length} selected
              </Typography>
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {selectedItems.size === data.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleBulkAddToCart}
                disabled={selectedItems.size === 0 || bulkLoading}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: selectedItems.size === 0 || bulkLoading ? '#ccc' : '#1976d2',
                  color: 'white',
                  cursor: selectedItems.size === 0 || bulkLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {bulkLoading ? (
                  <>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon fontSize="small" />
                    Add Selected to Cart ({selectedItems.size})
                  </>
                )}
              </button>
            </>
          )}
        </Box>
      </Box>

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
        </Box>
      )}

      {/* Cart Error Message */}
      {cartError && (
        <Box 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: 'warning.light', 
            color: 'warning.contrastText', 
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography>{cartError}</Typography>
          <IconButton 
            size="small" 
            onClick={() => setCartError(null)}
            sx={{ color: 'warning.contrastText' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {toastMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: toastMessage.type === 'success' ? 'success.main' : toastMessage.type === 'error' ? 'error.main' : toastMessage.type === 'warning' ? 'warning.main' : 'info.main',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Typography fontSize="14px" fontWeight={600}>{toastMessage.message}</Typography>
                     {toastMessage.type === 'success' && <CheckIcon fontSize="small" />}
           {toastMessage.type === 'error' && <CloseIcon fontSize="small" />}
           {toastMessage.type === 'warning' && <InfoIcon fontSize="small" />}
           {toastMessage.type === 'info' && <InfoIcon fontSize="small" />}
        </Box>
      )}

      <CommonTable
        data={data}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
        filterComponent={
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mb={2} width="100%">
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
              <TextInput
                placeholder="Search by Item Number"
                value={searchTerm}
                fullWidth={false}
                onChange={handleSearchChange}
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 200px' }, 
                  marginBottom: "0px !important"
                }}
              />
              <SelectInput
                options={dateFilterOptions}
                value={dateFilter}
                onChange={handleDateFilterChange}
                
                // sx={{ 
                //   flex: { xs: '1 1 100%', sm: '1 1 200px' }, 
                //   marginBottom: "0px !important"
                // }}
              />
            </Box>
          </Box>
        }
        containerHeight="calc(100vh - 380px)"
        headerStyle={{
          fontWeight: 600,
        }}
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
     </Box>
   );
 };

export default OrderedItems;