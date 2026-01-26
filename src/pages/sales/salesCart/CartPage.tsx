import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Grid, Tooltip, Typography, Button } from "@mui/material";
import FrequentlyBoughtTogether from "../../../component/molecules/FrequentlyBoughtTogether";
import ShippingDetails from "../../../component/molecules/ShippingDetails";
import PriceDetails from "../../../components/PriceDetails";
import ProductDetailsModal from "../../../component/molecules/ProductDetailsModal";
import product1 from "../../../assets/Default-Product-Image.jpg";
// import product2 from "../../../assets/product2.png";
// import product3 from "../../../assets/product3.png";
import CommonTable from "../../../component/atoms/Table/CommonTable";
import { TableColumn } from "../../../component/atoms/Table/CommonTable";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import deleteIcon from "../../../assets/icons/delete.svg";
import { updateCartItem, removeFromCart, placeOrder, getSalesWarehouseProfile, getDeliveryCharge, addToCart, clearCart as clearCartApi, getRecommendations, getInventoryItems } from '../../../redux/apis/sales/salesOrderApis';
import DeleteConfirmationModal from '../../../component/atoms/DeleteConfirmationModal';
import PriceChangeModal from '../../../component/molecules/PriceChangeModal';
import InactiveItemsModal from '../../../component/molecules/InactiveItemsModal';
import OrderCelebration from '../../../component/atoms/OrderCelebration';
import QuantityDiscountModal from '../../../component/molecules/QuantityDiscountModal';
import SalesCategoryWisePriceModal from '../../../component/molecules/SalesCategoryWisePriceModal';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../redux/store';
import { fetchSalesCartItems, clearSalesCart } from '../../../redux/slices/salesCartSlice';
import toast from 'react-hot-toast';
import { validateUpdateQuantity, validateCartForCheckout } from '../../../utils/cartValidationUtils';
import { roundPrepaidTax } from '../../../utils/prepaidTaxUtils';
import { useShowPrepaidTax, calculateDisplayPrice } from '../../../utils/prepaidTaxDisplayUtils';

// Interface for cart item from API
interface CartItem {
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  price: number;
  priceWithTax?: number;
  Tax_Rate: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  isPriceChanged: boolean;
  oldPrice: number;
  newPrice: number;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  itemInActive?: boolean; // Add this field
  // New inventory fields
  showTheInventoryStock?: boolean;
  Inventory_OnHand?: number;
  showWithOutPrice?: boolean;
  allowToOrder?: boolean;
  showLowStock?: boolean;
  hasProductLimit?: boolean; // Add this field
  productLimit?: number | null; // Add this field
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  // Prepaid tax rate
  prepaidTaxRate?: number;
  Product: {
    id: number;
    Customer_Number: number;
    Item_Number: number;
    Price: number;
    Tax_Rate: number;
    Price_With_Tax: number;
    TotalPriceWithTax: number;
    Qty: number;
    TotalPrice: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    originalPrice: number;
  };
}

interface WarehouseProfile {
  timeSlots: Array<{
    day: string;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
    }>;
  }>;
  cutOffTime: string;
  storePickup: boolean;
  allowShipping: boolean;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [shippingMethod, setShippingMethod] = useState<"delivery" | "pickup">("delivery");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [clearCartModalOpen, setClearCartModalOpen] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [priceChangeModalOpen, setPriceChangeModalOpen] = useState(false);
  const [priceChangeItems, setPriceChangeItems] = useState<any[]>([]);
  const [inactiveItemsModalOpen, setInactiveItemsModalOpen] = useState(false);
  const [inactiveItems, setInactiveItems] = useState<any[]>([]);
  const [inactiveItemsLoading, setInactiveItemsLoading] = useState(false);
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  console.log(pickupTime,'pickupTime');
  const [showCelebration, setShowCelebration] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [warehouseProfileLoading, setWarehouseProfileLoading] = useState(false);
  const [warehouseProfile, setWarehouseProfile] = useState<WarehouseProfile | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  // Quantity discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] = useState<CartItem | null>(null);
  const [selectedDiscountData, setSelectedDiscountData] = useState<any>(null);

  // Sales category wise price modal state
  const [salesCategoryModalOpen, setSalesCategoryModalOpen] = useState(false);

  // Debounced input state
  const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
  const debounceTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Recommended products state
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const prevCartIdsRef = useRef<Set<string>>(new Set());

  // Product details modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Get cart state from Redux
  const { items: cartItems, userLimitMinOrderAmount, totalAmountWithTax, totalAmount } = useSelector((state: RootState) => state.salesCart) as any;
  const { selectedCustomer, allowDiscount, discountLimit, allowDeliveryCharge, storeDetail, wareHouseDetail
  } = useSelector((state: RootState) => state.auth);


const shippingAddress = `${storeDetail?.C_Address}, ${storeDetail?.C_City}, ${storeDetail?.C_State}, ${storeDetail?.C_Zip}`;
const warehouseAddress = `${wareHouseDetail?.[0]?.D_Addr1 || ''} ,${wareHouseDetail?.[0]?.D_City || ''} ,${wareHouseDetail?.[0]?.D_State || ''}`;

  // State for discount amounts per item
  const [itemDiscounts, setItemDiscounts] = useState<{ [key: number]: number }>({});

  // Get showWithPerpaidTax setting
  const { showWithPerpaidTax } = useShowPrepaidTax();

  const loadWarehouseProfile = async () => {
    setWarehouseProfileLoading(true);
    try {
      const response: any = await getSalesWarehouseProfile();
      console.log('Warehouse profile response:', response);
      if (response?.data) {
        console.log('Setting warehouse profile:', response.data);
        setWarehouseProfile(response.data.warehouseProfile);
      }
    } catch (error) {
      console.error('Failed to load warehouse profile:', error);
      // Set default values if API fails
      setWarehouseProfile({
        timeSlots: [],
        cutOffTime: "23:00:00",
        storePickup: false,
        allowShipping: true
      });
    } finally {
      setWarehouseProfileLoading(false);
    }
  }

  // Load cart items
  const loadCartItems = useCallback(async () => {
    try {
      const result = await dispatch(fetchSalesCartItems());
      if (fetchSalesCartItems.fulfilled.match(result)) {
        const response = result.payload;
        if (response) {
          // Check for price changes
          const itemsWithPriceChanges = response?.finalCartItems?.filter((item: any) => item.isPriceChanged);
          
          if (itemsWithPriceChanges && itemsWithPriceChanges.length > 0) {
            setPriceChangeItems(itemsWithPriceChanges);
            setPriceChangeModalOpen(true);
          }

          // Check for inactive items
          const itemsWithInactive = response?.finalCartItems?.filter((item: any) => item.itemInActive);
          
          if (itemsWithInactive && itemsWithInactive.length > 0) {
            setInactiveItems(itemsWithInactive);
            setInactiveItemsModalOpen(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cart items:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  useEffect(() => {
    loadWarehouseProfile();
  }, []);

  // Load recommended products
  const loadRecommendedProducts = useCallback(async () => {
    if (cartItems.length === 0 || !selectedCustomer) {
      setRecommendedProducts([]);
      return;
    }

    setRecommendationsLoading(true);
    try {
      // Get user ID from selected customer
      const userId = selectedCustomer?.C_Number?.toString() || null;
      
      // Get cart item numbers
      const cartItemNumbers = cartItems.map((item: CartItem) => item.Item_Number.toString());
      
      // Fetch recommendations
      const recommendedItemNumbers = await getRecommendations(userId, cartItemNumbers);
      
      if (!recommendedItemNumbers || recommendedItemNumbers.length === 0) {
        setRecommendedProducts([]);
        return;
      }

      // Fetch product details for recommended items using masterSearch
      const masterSearch = recommendedItemNumbers.join(',');
      const params = {
        page: 1,
        limit: recommendedItemNumbers.length,
        masterSearch: masterSearch,
      };
      
      const response: any = await getInventoryItems(selectedCustomer.C_Number.toString(), params);
      
      if (response?.data?.finalProductList) {
        // Transform API products to match FrequentlyBoughtTogether Product interface
        const transformedProducts = response.data.finalProductList.map((apiProduct: any) => ({
          id: apiProduct.Item_Number?.toString() || '',
          Item_Number: apiProduct.Item_Number || 0,
          name: apiProduct.Description || '',
          Description: apiProduct.Description || '',
          price: apiProduct.price || apiProduct.Price1 || 0,
          priceWithTax: apiProduct.priceWithTax || 0,
          stock: apiProduct.showLowStock ? 'Out of Stock' : 'In Stock',
          stockCount: apiProduct.Inventory_OnHand || 0,
          size: apiProduct.UOM || '',
          UOM: apiProduct.UOM || '',
          image: apiProduct.masterImage || product1,
          masterImage: apiProduct.masterImage,
          distributorImage: apiProduct.distributorImage,
          showDistributorImage: apiProduct.showDistributorImage || false,
          isNewItem: apiProduct.isNewItem || false,
          isDiscounted: apiProduct.isDiscounted || false,
          hasQtyDiscount: apiProduct.hasQtyDiscount || false,
          qtyDiscount: apiProduct.qtyDiscount || null,
          allowToOrder: apiProduct.allowToOrderSalesRep !== false,
          showWithOutPrice: apiProduct.showWithOutPriceToSalesRep || false,
          Tax_Rate: apiProduct.Tax_Rate || 0,
          prepaidTaxRate: apiProduct.prepaidTaxRate || 0,
          hasProductLimit: apiProduct.hasProductLimit || false,
          productLimit: apiProduct.productLimit || null,
          Inventory_OnHand: apiProduct.Inventory_OnHand || 0,
          showTheInventoryStock: apiProduct.showTheInventoryStockToSalesRep || false,
          showLowStock: apiProduct.showLowStockToSalesRep || false,
        }));
        
        setRecommendedProducts(transformedProducts);
      } else {
        setRecommendedProducts([]);
      }
    } catch (error) {
      console.error('Failed to load recommended products:', error);
      setRecommendedProducts([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [cartItems, selectedCustomer]);

  // Load recommendations when cart gains new items (avoid quantity-only updates)
  useEffect(() => {
    const currentIds = new Set<string>(cartItems.map((item: CartItem) => String(item.Item_Number)));
    let hasNewItem = false;

    currentIds.forEach((id) => {
      if (!prevCartIdsRef.current.has(id)) {
        hasNewItem = true;
      }
    });

    if (hasNewItem || (currentIds.size > 0 && prevCartIdsRef.current.size === 0)) {
      loadRecommendedProducts();
    }

    prevCartIdsRef.current = currentIds;
  }, [cartItems, loadRecommendedProducts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Reset discounts when cart items change
  useEffect(() => {
    // Remove discounts for items that are no longer in cart
    const currentItemIds = new Set(cartItems.map((item: CartItem) => item.Product.id));
    setItemDiscounts(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (!currentItemIds.has(Number(key))) {
          delete updated[Number(key)];
        }
      });
      return updated;
    });
  }, [cartItems]);

  // F9 key listener for sales category modal
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F9') {
        event.preventDefault();
        setSalesCategoryModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  

  // Helper function to calculate cart payload with prepaidTaxRate
  // New calculation: Price_With_Tax = Price_With_Tax * (1 + prepaidTaxRate)
  // Where base Price_With_Tax = price + Tax_Rate
  const calculateCartPayload = (item: CartItem, quantity: number, finalPriceWithTax?: number) => {
    // Convert all values to numbers to prevent string operations
    const basePrice = Number(item.Product.originalPrice || item.price || 0);
    const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
    const taxRate = Number(item.Product.Tax_Rate || 0);
    const qty = Number(quantity) || 0;
    
    // Validate that we have valid numbers
    if (isNaN(basePrice) || isNaN(taxRate) || isNaN(prepaidTaxRate) || isNaN(qty)) {
      console.error('Invalid price values:', { basePrice, taxRate, prepaidTaxRate, qty });
      throw new Error('Invalid price values in cart item');
    }
    
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
      priceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
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

  // Handle quantity change
  const handleQuantityChange = async (item: CartItem, change: number) => {
    console.log('handleQuantityChange called:', { item, change });
    const newQuantity = Number(item.Product.Qty) + Number(change);
    console.log('New quantity:', newQuantity);
    
    if (newQuantity <= 0) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
      return;
    }

    // Create product limit data for validation
    const productLimitData = {
      hasProductLimit: item.hasProductLimit || false,
      productLimit: item.productLimit || null
    };

    // Validate quantity limit before updating
    if (!validateUpdateQuantity(newQuantity, productLimitData, item.Description)) {
      return;
    }

    // Check if this is the first time adding this product and if it has quantity discount
    const isFirstTimeAdding = Number(item.Product.Qty) === 0;
    if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount) {
      // Open discount modal automatically for first-time additions
      setSelectedDiscountProduct(item);
      setSelectedDiscountData(item.qtyDiscount);
      setDiscountModalOpen(true);
      
      // Show toast message about discount modal
      toast.success(`Quantity discount available for ${item.Description}! Please review discount options.`);
      return; // Don't update cart yet, wait for modal confirmation
    }

    try {
      // Check if quantity discount should be applied
      // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
      // Convert all values to numbers to prevent string operations
      const basePrice = Number(item.Product.originalPrice || item.price || 0);
      const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
      const taxRate = Number(item.Product.Tax_Rate || 0);
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

      console.log('Item Product ID:', item.Product?.id);
      console.log('Item Product:', item.Product);
      console.log('Item:', item);
      console.log('Selected Customer:', selectedCustomer?.C_Number);
      
      if (!item.Product?.id) {
        console.error('Product ID is missing!');
        toast.error('Product ID is missing. Cannot update quantity.');
        return;
      }
      
      if (!selectedCustomer?.C_Number) {
        console.error('Customer number is missing!');
        toast.error('Customer number is missing. Cannot update quantity.');
        return;
      }
      
      let payload;
      try {
        payload = calculateCartPayload(item, qty, discountApplied ? finalPriceWithTax : undefined);
        console.log('Updating cart item with payload:', payload);
      } catch (payloadError: any) {
        console.error('Error calculating payload:', payloadError);
        toast.error(payloadError?.message || 'Error calculating cart payload. Please try again.');
        return;
      }
      
      if (item.Product?.id) {
        // Update existing item
        await updateCartItem(item.Product.id.toString(), payload, selectedCustomer.C_Number.toString());
        console.log('Cart item updated');
      } else {
        // Add new item
        await addToCart(selectedCustomer.C_Number.toString(), {
          Item_Number: item.Item_Number,
          ...payload
        });
        console.log('New item added to cart');
      }
      console.log('Refreshing cart...');
      await loadCartItems(); // Refresh cart from server
      console.log('Cart refreshed successfully');
      toast.success('Quantity updated successfully!');
    } catch (error: any) {
      console.error('Failed to update quantity - Full error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.response?.status);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update quantity. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Debounced input handler
  const handleDebouncedQuantityChange = useCallback((item: CartItem, newQuantity: number) => {
    // Clear existing timeout for this item
    if (debounceTimeouts.current[item.Product.id]) {
      clearTimeout(debounceTimeouts.current[item.Product.id]);
    }

    // Update local input value immediately for UI responsiveness
    setInputValues(prev => ({
      ...prev,
      [item.Product.id]: newQuantity
    }));

    // Set new timeout for API call
    debounceTimeouts.current[item.Product.id] = setTimeout(async () => {
      await handleQuantityInputChange(item, newQuantity);
    }, 1000); // 1 second delay
  }, []);

  // Handle quantity input change
  const handleQuantityInputChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
      return;
    }

    // Create product limit data for validation
    const productLimitData = {
      hasProductLimit: item.hasProductLimit || false,
      productLimit: item.productLimit || null
    };

    // Validate quantity limit before updating
    if (!validateUpdateQuantity(newQuantity, productLimitData, item.Description)) {
      return;
    }

    // Check if this is the first time adding this product and if it has quantity discount
    const isFirstTimeAdding = item.Product.Qty === 0;
    if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount) {
      // Open discount modal automatically for first-time additions
      setSelectedDiscountProduct(item);
      setSelectedDiscountData(item.qtyDiscount);
      setDiscountModalOpen(true);
      
      // Show toast message about discount modal
      toast.success(`Quantity discount available for ${item.Description}! Please review discount options.`);
      return; // Don't update cart yet, wait for modal confirmation
    }

    try {
      // Check if quantity discount should be applied
      // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
      // Convert all values to numbers to prevent string operations
      const basePrice = Number(item.Product.originalPrice || item.price || 0);
      const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
      const taxRate = Number(item.Product.Tax_Rate || 0);
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

      console.log('Item Product ID:', item.Product?.id);
      console.log('Item Product:', item.Product);
      console.log('Item:', item);
      console.log('Selected Customer:', selectedCustomer?.C_Number);
      
      if (!item.Product?.id) {
        console.error('Product ID is missing!');
        toast.error('Product ID is missing. Cannot update quantity.');
        return;
      }
      
      if (!selectedCustomer?.C_Number) {
        console.error('Customer number is missing!');
        toast.error('Customer number is missing. Cannot update quantity.');
        return;
      }
      
      let payload;
      try {
        payload = calculateCartPayload(item, qty, discountApplied ? finalPriceWithTax : undefined);
        console.log('Updating cart item with payload:', payload);
      } catch (payloadError: any) {
        console.error('Error calculating payload:', payloadError);
        toast.error(payloadError?.message || 'Error calculating cart payload. Please try again.');
        return;
      }
      
      if (item.Product?.id) {
        // Update existing item
        await updateCartItem(item.Product.id.toString(), payload, selectedCustomer.C_Number.toString());
        console.log('Cart item updated');
      } else {
        // Add new item
        await addToCart(selectedCustomer.C_Number.toString(), {
          Item_Number: item.Item_Number,
          ...payload
        });
        console.log('New item added to cart');
      }
      console.log('Refreshing cart...');
      await loadCartItems(); // Refresh cart from server
      console.log('Cart refreshed successfully');
      toast.success('Quantity updated successfully!');
    } catch (error: any) {
      console.error('Failed to update quantity - Full error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.response?.status);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update quantity. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Handle delete item
  const handleDeleteItem = async (item: CartItem) => {
    try {
      await removeFromCart(item.Product.id.toString(), selectedCustomer?.C_Number?.toString() || '');
      await loadCartItems(); // Refresh cart from server
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  // Handle clear all cart items
  const handleClearAllCartItems = async () => {
    try {
      await clearCartApi(selectedCustomer?.C_Number?.toString() || '');
      await dispatch(clearSalesCart());
      setClearCartModalOpen(false);
      toast.success('All items have been removed from your cart.');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart. Please try again.');
    }
  };

  // Handle price change modal close
  const handlePriceChangeClose = async () => {
    try {
      // Update all items with new prices automatically
      for (const item of priceChangeItems) {
        // Get the cart item data to check for discounts
        const cartItem = cartItems.find((cartItem: CartItem) => cartItem.Item_Number === item.Item_Number);
        
        let finalPrice = Number(item.newPrice);
        // let discountApplied = false;

        // Check if quantity discount should be applied to the new price
        if (cartItem?.hasQtyDiscount && cartItem?.qtyDiscount) {
          const currentQuantity = item.Product?.Qty || 0;
          
          if (cartItem.qtyDiscount.isCaseDiscount && currentQuantity >= cartItem.qtyDiscount.minimumQtyForCaseDiscount) {
            // Apply case discount to new price
            const discountAmount = (Number(item.newPrice) * cartItem.qtyDiscount.percentageCaseDiscount) / 100;
            finalPrice = Number(item.newPrice) - discountAmount;
            // discountApplied = true;
          } else if (cartItem.qtyDiscount.isQtyDiscount) {
            // Find applicable quantity discount tier for new price
            const applicableDiscount = cartItem.qtyDiscount.qtyDiscount
              .filter((discount: any) => currentQuantity >= discount.minQty)
              .sort((a: any, b: any) => b.minQty - a.minQty)[0];
            
            if (applicableDiscount) {
              if (applicableDiscount.hasPercentageDiscount) {
                const discountAmount = (Number(item.newPrice) * cartItem.qtyDiscount.perDiscount) / 100;
                finalPrice = Number(item.newPrice) - discountAmount;
              } else {
                finalPrice = Number(item.newPrice) - applicableDiscount.amountDiscount;
              }
              // discountApplied = true;
            }
          }
        }
        
        // Ensure price doesn't go below 0
        finalPrice = Math.max(0, finalPrice);
        
        // Calculate price with prepaid tax: (basePrice + Tax_Rate) * (1 + prepaidTaxRate)
        // newPrice from API is the base price, so we need to calculate full price with prepaid tax
        const basePrice = Number(Number(finalPrice).toFixed(2));
        const prepaidTaxRate = Number(cartItem?.prepaidTaxRate || 0);
        const taxRate = Number(item.Product.Tax_Rate || 0);
        const basePriceWithTax = Number(Number(basePrice + taxRate).toFixed(2));
        const priceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
        
        const payload = calculateCartPayload(cartItem, item.Product.Qty, priceWithTax);
        await updateCartItem(item.Product.id.toString(), {
          ...payload,
          originalPrice: Number(Number(item.newPrice).toFixed(2)) // Keep original new price for reference
        }, selectedCustomer?.C_Number?.toString() || '');
      }
      
      // Refresh cart items and update Redux state
      await loadCartItems();
      setPriceChangeModalOpen(false);
      
      // Show success message if discounts were applied
      const itemsWithDiscounts = priceChangeItems.filter((item: any) => {
        const cartItem = cartItems.find((cartItem: CartItem) => cartItem.Item_Number === item.Item_Number);
        return cartItem?.hasQtyDiscount && cartItem?.qtyDiscount;
      });
      
      if (itemsWithDiscounts.length > 0) {
        toast.success(`Price changes applied with automatic discounts for ${itemsWithDiscounts.length} item(s)`);
      } else {
        toast.success('Price changes applied successfully');
      }
    } catch (error) {
      console.error('Failed to update price changes:', error);
      setPriceChangeModalOpen(false);
      toast.error('Failed to update price changes. Please try again.');
    }
  };

  // Handle inactive items modal close
  const handleInactiveItemsClose = async () => {
    setInactiveItemsLoading(true);
    try {
      // Remove all inactive items from cart
      for (const item of inactiveItems) {
        await removeFromCart(item.Product.id.toString(), selectedCustomer?.C_Number?.toString() || '');
      }
      
      // Refresh cart items and update Redux state
      await loadCartItems();
      setInactiveItemsModalOpen(false);
      toast.success('Inactive items have been removed from your cart.');
    } catch (error) {
      console.error('Failed to remove inactive items:', error);
      setInactiveItemsModalOpen(false);
    } finally {
      setInactiveItemsLoading(false);
    }
  };

  // Handle inactive items modal close without removing items
  const handleInactiveItemsModalClose = () => {
    setInactiveItemsModalOpen(false);
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    setPlaceOrderLoading(true);
    try {
      // Refresh cart items from server before placing order
      const result = await dispatch(fetchSalesCartItems());
      if (!fetchSalesCartItems.fulfilled.match(result)) {
        toast.error('Failed to refresh cart items. Please try again.');
        setPlaceOrderLoading(false);
        return;
      }
      
      // Get fresh cart items from API response
      const freshCartItems = result.payload?.finalCartItems || cartItems;
      
      // Validate cart before placing order
      const cartItemsForValidation = freshCartItems.map((item: CartItem) => ({
        id: item.Description,
        quantity: item.Product.Qty,
        price: item.Product.Price,
        priceWithTax: item.Product.Price_With_Tax,
        hasProductLimit: item.hasProductLimit || false,
        productLimit: item.productLimit || null
      }));

      const validationData = {
        userLimitMinOrderAmount: result.payload?.userLimitMinOrderAmount || userLimitMinOrderAmount,
        totalAmountWithTax: result.payload?.totalAmountWithTax || totalAmountWithTax,
        totalAmount: result.payload?.totalAmount || totalAmount
      };

      if (!validateCartForCheckout(cartItemsForValidation, validationData)) {
        setPlaceOrderLoading(false);
        return;
      }

      // Prepare order payload using fresh cart items from API
      // Use actual cart item values which already include discounts
      const orderPayload = freshCartItems.map((item: any) => {
        const discountPerUnit = itemDiscounts[item.Product.id] || 0;
        const totalPrice = Number(item.Product.TotalPrice) || 0;
        const qty = Number(item.Product.Qty || 1);
        const totalDiscount = discountPerUnit * qty;
        const discountPrice = qty > 0 ? (totalPrice - totalDiscount) / qty : 0;
        
        // Use values directly from cart item Product (already includes discounts)
        const price = Number(item.Product.Price || 0);
        const priceWithTax = Number(item.Product.Price_With_Tax || 0);
        const totalPriceWithTax = Number(item.Product.TotalPriceWithTax || 0);
        const taxRate = Number(item.Product.Tax_Rate || 0);
        // Calculate prepaid tax amount for 1 unit: (price + taxRate) * prepaidTaxRate
        const prepaidTaxRatePercent = Number(item.prepaidTaxRate || 0);
        const basePriceWithTax = price + taxRate;
        const prepaidTaxAmount = basePriceWithTax * prepaidTaxRatePercent;
        
        return {
          Customer_Number: item.Product.Customer_Number,
          Item_Number: item.Item_Number,
          Price: Number(price.toFixed(2)),  
          Price_With_Tax: Number(priceWithTax.toFixed(2)),
          Qty: qty,
          Tax_Rate: Number(taxRate.toFixed(2)),
          TotalPrice: Number(totalPrice.toFixed(2)),
          TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
          prepaidTaxRate: roundPrepaidTax(prepaidTaxAmount), // Calculated prepaid tax amount for item
          discountPrice: Number(Math.max(0, discountPrice).toFixed(2)),
          id: item.Product.id
        };
      });

      const totalDiscount = calculateTotalDiscount();
      const hasDiscount = totalDiscount > 0;

      const payload = {
        Delivery_Charge: Number(deliveryCharge).toFixed(2),
        ...(hasDiscount && {
          discountAmount: Number(totalDiscount).toFixed(2),
          hasDiscount: true
        }),
        orderPlayload: orderPayload,
        shippingMethod: shippingMethod,
        pickupTime: shippingMethod === 'pickup' ? selectedTimeSlot : null,
        deliveryInstructions: deliveryInstructions,
        selectedTimeSlot: shippingMethod === 'pickup' ? selectedTimeSlot : null,
        // Additional shipping details
        shippingDetails: {
          method: shippingMethod,
          pickupTime: shippingMethod === 'pickup' ? selectedTimeSlot : null,
          instructions: deliveryInstructions,
          warehouseAddress: warehouseAddress,
          shippingAddress: shippingAddress,
          selectedTimeSlot: shippingMethod === 'pickup' ? selectedTimeSlot : null
        }
      };

      // Call place order API
      const response: any = await placeOrder(selectedCustomer?.C_Number?.toString() || '', payload);
      if(response?.success){
        setOrderNumber(response?.data?.orderHeader?.Order_Number);
        setShowCelebration(true);
        await dispatch(clearSalesCart());
      }else{
        toast.error(response?.message || 'Failed to place order. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to place order:', error);
      toast.error(error?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlaceOrderLoading(false);
    }
  };

  // Handle save changes
  // const handleSaveChanges = () => {
  //   // This can be used to save shipping preferences or other changes
  //   console.log('Saving changes...');
  // };

  useEffect(() => {
    const fetchDeliveryCharge = async () => {
      const response: any = await getDeliveryCharge(selectedCustomer?.C_Number?.toString() || '');
      setDeliveryCharge(response.data);
    }
    fetchDeliveryCharge();
  }, []);

  // Calculate total discount amount (discount per unit * quantity for each item)
  const calculateTotalDiscount = () => {
    return cartItems.reduce((sum: number, item: CartItem) => {
      const discountPerUnit = itemDiscounts[item.Product.id] || 0;
      const qty = item.Product.Qty || 1;
      return sum + (discountPerUnit * qty);
    }, 0);
  };

  // Handle discount input change
  const handleDiscountChange = (itemId: number, discountValue: string, maxDiscount: number) => {
    const discountPerUnit = parseFloat(discountValue) || 0;
    const currentTotalDiscount = calculateTotalDiscount();
    const currentItemDiscountPerUnit = itemDiscounts[itemId] || 0;
    const item = cartItems.find((item: CartItem) => item.Product.id === itemId);
    const qty = item?.Product?.Qty || 1;
    const currentItemTotalDiscount = currentItemDiscountPerUnit * qty;
    const newItemTotalDiscount = discountPerUnit * qty;
    const newTotalDiscount = currentTotalDiscount - currentItemTotalDiscount + newItemTotalDiscount;

    // Validate discount is not negative
    if (discountPerUnit < 0) {
      toast.error('Discount cannot be negative');
      return;
    }

    // Validate discount per unit doesn't exceed product's price per unit (without tax)
    if (discountPerUnit > maxDiscount) {
      toast.error(`Discount cannot exceed product's price of $${maxDiscount.toFixed(2)} per unit`);
      return;
    }

    // Validate discount limit
    if (discountLimit !== null && newTotalDiscount > discountLimit) {
      toast.error(`Total discount cannot exceed $${discountLimit}. Current total: $${currentTotalDiscount.toFixed(2)}`);
      return;
    }

    setItemDiscounts(prev => ({
      ...prev,
      [itemId]: discountPerUnit
    }));
  };

  // Calculate price details
  const calculatePriceDetails = () => {
    // Calculate subtotal with discounts applied per item
    let subtotal: number;
    let totalPrepaidTax = 0;
    
    if (showWithPerpaidTax) {
      // Current behavior: include prepaid tax in subtotal
      subtotal = Number(cartItems.reduce((sum: any, item: any) => {
        const discountPerUnit = itemDiscounts[item.Product.id] || 0;
        const qty = item.Product.Qty || 1;
        const totalDiscount = discountPerUnit * qty;
        const itemTotal = item.showWithOutPrice ? 0 : (Number(item.Product.TotalPriceWithTax) - totalDiscount);
        return sum + itemTotal;
      }, 0).toFixed(2));
    } else {
      // New behavior: exclude prepaid tax from subtotal, calculate it separately
      subtotal = Number(cartItems.reduce((sum: any, item: any) => {
        if (item.showWithOutPrice) return sum;
        const discountPerUnit = itemDiscounts[item.Product.id] || 0;
        const basePrice = Number(item.Product.Price || 0);
        const taxRate = Number(item.Product.Tax_Rate || 0);
        const qty = item.Product.Qty || 1;
        const priceWithoutPrepaidTax = basePrice + taxRate;
        const itemTotal = (priceWithoutPrepaidTax * qty) - (discountPerUnit * qty);
        return sum + itemTotal;
      }, 0).toFixed(2));
      
      // Calculate total prepaid tax separately
      totalPrepaidTax = Number(cartItems.reduce((sum: any, item: any) => {
        if (item.showWithOutPrice) return sum;
        const basePrice = Number(item.Product.Price || 0);
        const taxRate = Number(item.Product.Tax_Rate || 0);
        const prepaidTaxRate = Number(item.prepaidTaxRate || 0);
        const qty = Number(item.Product.Qty || 0);
        const basePriceWithTax = basePrice + taxRate;
        const prepaidTaxAmount = basePriceWithTax * prepaidTaxRate;
        return sum + (prepaidTaxAmount * qty);
      }, 0).toFixed(2));
    }
    
    const discount = calculateTotalDiscount();
    const crv = Number(0).toFixed(2); // No CRV for now
    const deliveryCharges = Number(deliveryCharge).toFixed(2); // No delivery charges for now
    const estimatedTotal = Number((subtotal + Number(crv) + Number(deliveryCharges) + (showWithPerpaidTax ? 0 : totalPrepaidTax)).toFixed(2));

    return {
      subtotal,
      discount,
      crv,
      deliveryCharges,
      estimatedTotal,
      prepaidTax: totalPrepaidTax,
      showPrepaidTax: !showWithPerpaidTax && totalPrepaidTax > 0,
    };
  };

  // Get product image
  const getProductImage = (item: CartItem): string => {
    if (item.showDistributorImage && item.distributorImage) {
      return item.distributorImage;
    } else if (item.masterImage && item.masterImage !== "https://woopsacdn.blob.core.windows.net/product-images/undefined.jpg") {
      return item.masterImage;
    } else {
      return product1; // Fallback image
    }
  };

  // Mock data for frequently bought together products
  // const frequentlyBoughtProducts = [
  //   {
  //     id: "1",
  //     name: "Clew 3 MG Citrus",
  //     totalPrice: "1254.0",
  //     stock: "In Stock",
  //     discount: "0",
  //     size: "5/SLV",
  //     image: product1,
  //   },
  //   {
  //     id: "2",
  //     name: "Clew 3 MG Citrus",
  //     totalPrice: "1254.0",
  //     stock: "In Stock",
  //     discount: "0",
  //     size: "5/SLV",
  //     image: product2,
  //   },
  //   {
  //     id: "3",
  //     name: "Clew 3 MG Citrus",
  //     totalPrice: "1254.0",
  //     stock: "In Stock",
  //     discount: "0",
  //     size: "5/SLV",
  //     image: product3,
  //   },
  // ];

  const columns: TableColumn<CartItem>[] = [
    {
      id: "itemNumber",
      label: "Item #",
      render: (row) => (
        <Typography fontSize={"14px"} color="textSecondary">
          {row.Item_Number}
        </Typography>
      ),
    },
    {
      id: "products",
      label: "Products",
      render: (row) => (
        <Tooltip title={row.Description} placement="top"> 
        <Box display="flex" alignItems="center" gap={2} justifyContent="flex-start">
          <img
            src={getProductImage(row)}
            alt={row.Description}
            style={{ width: 40, height: 40, objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.src = product1;
            }}
          />
          <Box>
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
                  {row.Description}
                </Typography>
            {/* <Typography fontSize={12} color="text.secondary">
              Pack: {row.CaseCount} Case: {row.CaseCount} Size: {row.UOM} Unit: {row.UOM}
            </Typography> */}
          </Box>
        </Box>
        </Tooltip>
      ),
    },
    {
      id: "stock",
      label: "Stock",
      render: (row) => {
        // If showing inventory stock, show only the count
        if (row.showTheInventoryStock) {
          return (
            <Typography fontSize={12} fontWeight={400} color="text.secondary">
              {row.Inventory_OnHand}
            </Typography>
          );
        }
        
        // Otherwise show stock status based on showLowStock
        const stockStatus = row.showLowStock ? 'Out of Stock' : 'In Stock';
        return (
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {stockStatus}
          </Typography>
        );
      },
    },
    {
      id: "price",
      label: "Price",
      render: (row) => {
        if (row.showWithOutPrice) {
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={12} fontWeight={400} color="text.secondary">
                -
              </Typography>
            </Box>
          );
        }
        
        const basePrice = Number(row.Product.Price || 0);
        const taxRate = Number(row.Product.Tax_Rate || 0);
        const prepaidTaxRate = Number(row.prepaidTaxRate || 0);
        const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
        
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={12} fontWeight={400} color="text.secondary">
              ${displayPrice}
            </Typography>
          </Box>
        );
      },
    },
    ...(allowDiscount ? [{
      id: "discount",
      label: "Discount",
      render: (row: CartItem) => {
        const currentDiscountPerUnit = itemDiscounts[row.Product.id] || 0;
        const currentTotalDiscount = calculateTotalDiscount();
        const qty = row.Product.Qty || 1;
        // Product's price per unit without tax (max discount per unit)
        const productPricePerUnit = row.showWithOutPrice ? 0 : Number(row.Product.TotalPrice) / qty || 0;
        // Remaining discount for the entire order
        const remainingDiscountForOrder = discountLimit !== null ? Math.max(0, discountLimit - currentTotalDiscount) : null;
        // Max discount per unit this item can have: min of (product price per unit, (current discount * qty + remaining) / qty)
        const currentItemTotalDiscount = currentDiscountPerUnit * qty;
        const maxDiscountFromOrderLimit = remainingDiscountForOrder !== null 
          ? (currentItemTotalDiscount + remainingDiscountForOrder) / qty 
          : productPricePerUnit;
        const maxDiscountForThisItem = Math.min(productPricePerUnit, maxDiscountFromOrderLimit);
        
        return (
          <Box display="flex" flexDirection="column" gap={0.5}>
            <input
              type="number"
              min="0"
              step="0.01"
              max={maxDiscountForThisItem}
              value={itemDiscounts[row.Product.id] || ''}
              onChange={(e) => handleDiscountChange(row.Product.id, e.target.value, maxDiscountForThisItem)}
              placeholder="0.00"
              style={{
                width: '90px',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
              }}
              disabled={row.showWithOutPrice}
            />
            {discountLimit !== null && remainingDiscountForOrder !== null && (
              <Typography fontSize={9} color="text.secondary" sx={{ lineHeight: 1 }}>
                Remaining: ${remainingDiscountForOrder.toFixed(2)}
              </Typography>
            )}
          </Box>
        );
      },
    }] : []),
    ...(allowDiscount ? [{
      id: "discountPrice",
      label: "Discount Price",
      render: (row: CartItem) => {
        const discountPerUnit = itemDiscounts[row.Product.id] || 0;
        const totalPrice = row.showWithOutPrice ? 0 : Number(row.Product.TotalPrice) || 0;
        const totalPriceWithTax = row.showWithOutPrice ? 0 : Number(row.Product.TotalPriceWithTax) || 0;
        const qty = row.Product.Qty || 1;
        // Total discount = discount per unit * quantity
        const totalDiscount = discountPerUnit * qty;
        // Discount price per unit (without tax)
        const discountPrice = qty > 0 ? (totalPrice - totalDiscount) / qty : 0;
        // Discount price per unit (with tax)
        const discountPriceWithTax = qty > 0 ? (totalPriceWithTax - totalDiscount) / qty : 0;
        // Calculate tax amount per unit: (TotalPriceWithTax - TotalPrice) / qty
        const totalTax = totalPriceWithTax - totalPrice;
        const taxAmountPerUnit = qty > 0 ? totalTax / qty : 0;
        
        return (
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={12} fontWeight={400} color="text.secondary">
              {row.showWithOutPrice ? '-' : `$${Math.max(0, discountPrice).toFixed(2)}`}
            </Typography>
            {taxAmountPerUnit > 0 && !row.showWithOutPrice && (
              <>
                <Typography fontSize={11} color="text.secondary" sx={{ opacity: 0.7 }}>
                  Tax: ${taxAmountPerUnit.toFixed(2)}
                </Typography>
                <Typography fontSize={11} color="text.secondary" sx={{ opacity: 0.7 }}>
                  w/tax: ${Math.max(0, discountPriceWithTax).toFixed(2)}
                </Typography>
              </>
            )}
          </Box>
        );
      },
    }] : []),
    {
      id: "totalPrice",
      label: "Total Price",
      render: (row) => {
        if (row.showWithOutPrice) {
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={12} fontWeight={400} color="text.secondary">
                -
              </Typography>
            </Box>
          );
        }
        
        const discountPerUnit = itemDiscounts[row.Product.id] || 0;
        const basePrice = Number(row.Product.Price || 0);
        const taxRate = Number(row.Product.Tax_Rate || 0);
        const prepaidTaxRate = Number(row.prepaidTaxRate || 0);
        const qty = Number(row.Product.Qty || 1);
        const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
        const totalPrice = displayPrice * qty;
        const totalDiscount = discountPerUnit * qty;
        const discountedTotal = Math.max(0, totalPrice - totalDiscount);
        
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={12} fontWeight={400} color="text.secondary">
              ${discountedTotal.toFixed(2)}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "action",
      label: "",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={2} justifyContent="space-between">
          <Box 
            sx={{
              backgroundColor: (theme) => theme.palette.background.paper,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              padding: "2px 4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              width: 'fit-content',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
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
            <RemoveIcon 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Remove clicked for item:', row);
                handleQuantityChange(row, -1);
              }}
              sx={{ 
                fontSize: "16px", 
                color: "primary.main",
                cursor: "pointer"
              }} 
            />
            <input
              type="text"
              value={inputValues[row.Product.id] !== undefined ? inputValues[row.Product.id] : row.Product.Qty}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value) || 0;
                if (newQuantity >= 0) {
                  handleDebouncedQuantityChange(row, newQuantity);
                }
              }}
              style={{
                width: '40px',
                textAlign: 'center',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: 'inherit',
              }}
            />
            <AddIcon 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add clicked for item:', row);
                handleQuantityChange(row, 1);
              }}
              sx={{ 
                fontSize: "16px", 
                color: "primary.main",
                cursor: "pointer"  
              }}
            />
          </Box>
          <Box 
            component={"img"}
            src={deleteIcon}
            sx={{
              width: '16px',
              height: '16px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
          />
        </Box>
      ),
    },
  ];

  // const handleAddProduct = (productId: string) => {
  //   console.log("Adding product:", productId);
  //   // Navigate to order page to add more products
  //   navigate('/sales/order');
  // };

  const priceDetails = calculatePriceDetails();

  // Quantity discount modal handlers
  const handleDiscountConfirm = (discountInfo: any) => {
    if (selectedDiscountProduct && discountInfo) {
      try {
        // Apply the discount and add the specified quantity to cart
        const item: any = selectedDiscountProduct;
        
        // Use the quantity that was manually typed by user, or fall back to minimum discount quantity
        const currentQuantity = item.Product?.Qty || 0;
        const quantity = currentQuantity > 0 ? currentQuantity : discountInfo.minQty;
        
        // Calculate discounted price
        // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
        const basePrice = Number(item.Product.originalPrice) || item.price || 0;
        const prepaidTaxRate = item.prepaidTaxRate || 0;
        const taxRate = Number(item.Product.Tax_Rate || 0);
        
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
        
        // Add to cart via API with discounted price
        setTimeout(async () => {
          try {
            const payload = calculateCartPayload(item, quantity, discountedPrice);
            if (item.Product?.id) {
              // Update existing item
              await updateCartItem(item.Product.id.toString(), payload, selectedCustomer?.C_Number?.toString() || '');
            } else {
              // Add new item
              await addToCart(selectedCustomer?.C_Number?.toString() || '', {
                Item_Number: item.Item_Number,
                ...payload
              });
            }
            
            // Refresh cart data
            await loadCartItems();
            
            toast.success(`Discount applied! Updated ${item.Description} quantity to ${quantity} with discounted price.`);
          } catch (error) {
            console.error('Failed to update discounted item in cart:', error);
            toast.error('Failed to update discounted item in cart. Please try again.');
          }
        }, 300);
        
        // Close the modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
      } catch (error) {
        console.error('Error applying discount:', error);
        toast.error('Failed to apply discount. Please try again.');
      }
    }
  };

  // Function to handle opening discount modal
  // const handleDiscountModalOpen = (item: CartItem, discountData: any) => {
  //   setSelectedDiscountProduct(item);
  //   setSelectedDiscountData(discountData);
  //   setDiscountModalOpen(true);
  // };

  // Handle clicking on recommended product to view details
  const handleRecommendedProductClick = (product: any) => {
    // Transform recommended product to match ProductDetailsModal interface
    const productForModal = {
      name: product.name || product.Description || '',
      image: product.image || product.masterImage || product1,
      itemNumber: product.Item_Number?.toString() || product.id || '',
      pack: product.size || product.UOM || '',
      case: product.size || product.UOM || '',
      size: product.size || product.UOM || '',
      UnitOunces: product.UOM || '',
      price: product.price || product.priceWithTax || 0,
      Tax_Rate: product.Tax_Rate || 0,
      upc: '',
      crv: '',
      category: '',
      subCategory: '',
      stock: product.stock || 'in stock',
    };
    setSelectedProduct(productForModal);
    setIsProductModalOpen(true);
  };

  // Handle adding recommended product to cart
  const handleAddRecommendedProduct = async (product: any) => {
    if (!product.allowToOrder) {
      toast.error('This item cannot be ordered.');
      return;
    }

    if (!selectedCustomer?.C_Number) {
      toast.error('Please select a customer first.');
      return;
    }

    try {
      // Check if this is the first time adding this product and if it has quantity discount
      if (product.hasQtyDiscount && product.qtyDiscount) {
        // Open discount modal automatically for first-time additions
        setSelectedDiscountProduct({
          ...product,
          Product: {
            id: 0,
            Customer_Number: selectedCustomer.C_Number,
            Item_Number: product.Item_Number,
            Price: product.price || 0,
            Tax_Rate: product.Tax_Rate || 0,
            Price_With_Tax: product.priceWithTax || 0,
            TotalPriceWithTax: product.priceWithTax || 0,
            Qty: 0,
            TotalPrice: product.price || 0,
            isActive: true,
            createdAt: '',
            updatedAt: '',
            originalPrice: product.price || 0,
          },
        } as CartItem);
        setSelectedDiscountData(product.qtyDiscount);
        setDiscountModalOpen(true);
        
        toast.success(`Quantity discount available for ${product.name || product.Description}! Please review discount options.`);
        return; // Don't add to cart yet, wait for modal confirmation
      }

      // Calculate cart payload
      const basePrice = Number(product.price || 0);
      const prepaidTaxRate = Number(product.prepaidTaxRate || 0);
      const taxRate = Number(product.Tax_Rate || 0);
      const qty = 1;

      // Calculate Price_With_Tax: (price + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = basePrice + taxRate;
      const priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
      const totalPriceWithTax = priceWithTax * qty;

      const payload = {
        Item_Number: product.Item_Number,
        Price: Number(Number(basePrice).toFixed(2)),
        Price_With_Tax: Number(Number(priceWithTax).toFixed(2)),
        Qty: qty,
        Tax_Rate: Number(Number(taxRate).toFixed(2)),
        TotalPrice: Number(Number(basePrice * qty).toFixed(2)),
        TotalPriceWithTax: Number(Number(totalPriceWithTax).toFixed(2)),
        originalPrice: Number(Number(basePrice).toFixed(2)),
        prepaidTaxRate: Number(Number(prepaidTaxRate).toFixed(4)),
        TotalprepaidTaxRate: Number(Number((basePriceWithTax * prepaidTaxRate * qty).toFixed(2))),
      };

      await addToCart(selectedCustomer.C_Number.toString(), payload);
      await loadCartItems(); // Refresh cart from server
      toast.success(`Added ${product.name || product.Description} to cart!`);
    } catch (error: any) {
      console.error('Failed to add recommended product to cart:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add product to cart. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Function to handle no discount selection - add 1 quantity without discount
  const handleNoDiscount = async () => {
    if (selectedDiscountProduct) {
      try {
        const item: any = selectedDiscountProduct;
        
        // Add 1 quantity without discount
        const quantity = 1;
        
        // Add to cart via API with original price
        setTimeout(async () => {
          try {
            const payload = calculateCartPayload(item, quantity);
            if (item.Product?.id) {
              // Update existing item
              await updateCartItem(item.Product.id.toString(), payload, selectedCustomer?.C_Number?.toString() || '');
            } else {
              // Add new item
              await addToCart(selectedCustomer?.C_Number?.toString() || '', {
                Item_Number: item.Item_Number,
                ...payload
              });
            }
            
            // Refresh cart data
            await loadCartItems();
            
            toast.success(`Added ${quantity} ${item.Description} to cart without discount.`);
          } catch (error) {
            console.error('Failed to add item to cart:', error);
            toast.error('Failed to add item to cart. Please try again.');
          }
        }, 300);
        
        // Close the modal
        setDiscountModalOpen(false);
        setSelectedDiscountProduct(null);
        setSelectedDiscountData(null);
      } catch (error) {
        console.error('Error adding item without discount:', error);
        toast.error('Failed to add item to cart. Please try again.');
      }
    }
  };

  return (
    <Box sx={{ p: 2, pt: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography
          fontSize={20}
          fontWeight={500}
          color="text.primary"
        >
          My Cart
        </Typography>
        <Box display="flex" gap={1}>
          {cartItems.length > 0 && (
            <>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setSalesCategoryModalOpen(true)}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5
                }}
              >
                Sales Category Wise Price
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setClearCartModalOpen(true)}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5
                }}
              >
                Remove All Items
              </Button>
            </>
          )}
        </Box>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={3}>
            {recommendedProducts.length > 0 && (
              <Grid size={12}>
                <FrequentlyBoughtTogether
                  products={recommendedProducts}
                  onAddProduct={handleAddRecommendedProduct}
                  onProductClick={handleRecommendedProductClick}
                  loading={recommendationsLoading}
                />
              </Grid>
            )}
            <Grid size={12}>
              <CommonTable
                currentPage={1}
                stickyLastColumn={true}
                totalPages={1}
                totalItems={cartItems.length}
                pageSize={10}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                data={cartItems}
                columns={columns}
                isPagination={false}
                loading={false}
                containerHeight="calc(100vh - 300px)"
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Grid container spacing={3}>
            {cartItems.length > 0 && cartItems.some((item: any) => !item.showWithOutPrice) && (
            <Grid size={12}>
              <PriceDetails 
                {...priceDetails} 
                deliveryCharge={deliveryCharge}
                onDeliveryChargeChange={allowDeliveryCharge ? setDeliveryCharge : undefined}
                allowEditDeliveryCharge={allowDeliveryCharge || false}
                prepaidTax={priceDetails.prepaidTax}
                showPrepaidTax={priceDetails.showPrepaidTax}
              />
            </Grid>
            )}
            <Grid size={12}>
            <ShippingDetails
                deliveryDate="16 June"
                shippingAddress={shippingAddress}
                warehouseAddress={warehouseAddress}
                shippingMethod={shippingMethod}
                onShippingMethodChange={setShippingMethod}
                onInstructionsChange={setDeliveryInstructions}
                onPickupTimeChange={setPickupTime}
                onPlaceOrder={handlePlaceOrder}
                loading={placeOrderLoading || warehouseProfileLoading}
                itemLength={cartItems.length}
                timeSlots={warehouseProfile?.timeSlots || []}
                cutOffTime={warehouseProfile?.cutOffTime || "23:00:00"}
                storePickup={warehouseProfile?.storePickup || false}
                onTimeSlotChange={setSelectedTimeSlot}
                allowShipping={warehouseProfile?.allowShipping || false}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          if (itemToDelete) {
            handleDeleteItem(itemToDelete);
          }
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        title="Remove Item"
        message={`Are you sure you want to remove "${itemToDelete?.Description}" from your cart?`}
      />

      {/* Clear All Cart Items Confirmation Modal */}
      <DeleteConfirmationModal
        open={clearCartModalOpen}
        onClose={() => setClearCartModalOpen(false)}
        onConfirm={handleClearAllCartItems}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart? This action cannot be undone."
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

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Order Celebration */}
      <OrderCelebration
        open={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          navigate(`/sales/order/details/${orderNumber}`);
        }}
        // orderNumber={orderNumber}
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

      {/* Sales Category Wise Price Modal */}
      <SalesCategoryWisePriceModal
        open={salesCategoryModalOpen}
        onClose={() => setSalesCategoryModalOpen(false)}
        cartItems={cartItems}
      />
    </Box>
  );
};

export default CartPage;
