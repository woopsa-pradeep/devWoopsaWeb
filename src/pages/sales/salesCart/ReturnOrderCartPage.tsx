import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Grid, Tooltip, Typography, Button } from "@mui/material";
// import FrequentlyBoughtTogether from "../../../component/molecules/FrequentlyBoughtTogether";
import ShippingDetails from "../../../component/molecules/ShippingDetails";
import PriceDetails from "../../../components/PriceDetails";
import product1 from "../../../assets/Default-Product-Image.jpg";
// import product2 from "../../../assets/product2.png";
// import product3 from "../../../assets/product3.png";
import CommonTable from "../../../component/atoms/Table/CommonTable";
import { TableColumn } from "../../../component/atoms/Table/CommonTable";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import deleteIcon from "../../../assets/icons/delete.svg";
import { updateCartItem, removeFromCart, getSalesWarehouseProfile, getDeliveryCharge, addToCart, clearCart as clearCartApi } from '../../../redux/apis/sales/salesOrderApis';
import DeleteConfirmationModal from '../../../component/atoms/DeleteConfirmationModal';
import PriceChangeModal from '../../../component/molecules/PriceChangeModal';
import InactiveItemsModal from '../../../component/molecules/InactiveItemsModal';
import OrderCelebration from '../../../component/atoms/OrderCelebration';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../redux/store';
import {  clearSalesCart, fetchSalesReturnCartItems } from '../../../redux/slices/salesCartSlice';
import toast from 'react-hot-toast';
import { validateUpdateQuantity, validateCartForCheckout } from '../../../utils/cartValidationUtils';
import { returnPlaceOrder } from "../../../redux/apis/sales/salesReturnOrderApis";

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

const ReturnOrderCartPage: React.FC = () => {
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

  // Debounced input state
  const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
  const debounceTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Get cart state from Redux
  const { items: cartItems, userLimitMinOrderAmount, totalAmountWithTax, totalAmount } = useSelector((state: RootState) => state.salesCart) as any;
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);
  const shippingAddress = `${selectedCustomer?.C_Name || 'Customer'}`;
  const warehouseAddress = `Warehouse Address`;


  console.log(cartItems,'cartItems---------->');
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
      const result = await dispatch(fetchSalesReturnCartItems());
      console.log(result,'result');
      if (fetchSalesReturnCartItems.fulfilled.match(result)) {
        const response = result.payload;
        console.log(response,'response');
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
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
      TotalprepaidTaxRate: Number(Number(totalPrepaidTax).toFixed(2))
    };
  };

  // Handle quantity change
  const handleQuantityChange = async (item: CartItem, change: number) => {
    const newQuantity = item.Product.Qty + change;
    
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

    try {
      // For return orders, no quantity discounts - use regular price
      const payload = calculateCartPayload(item, newQuantity);
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
      await loadCartItems(); // Refresh cart from server
    } catch (error) {
      console.error('Failed to update quantity:', error);
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

    try {
      // For return orders, no quantity discounts - use regular price
      const payload = calculateCartPayload(item, newQuantity);
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
      await loadCartItems(); // Refresh cart from server
    } catch (error) {
      console.error('Failed to update quantity:', error);
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
        
        // let finalPrice = Number(item.newPrice);
        // let discountApplied = false;

        // For return orders, no quantity discounts - use regular price
        const basePrice = Number(item.newPrice);
        const prepaidTaxRate = cartItem?.prepaidTaxRate || 0;
        const taxRate = Number(cartItem?.Product?.Tax_Rate) || 0;
        // Create product object for calculateCartPayload
        const productForPayload = {
          ...cartItem,
          Product: {
            ...cartItem?.Product,
            originalPrice: basePrice,
            Tax_Rate: taxRate
          },
          price: basePrice,
          prepaidTaxRate: prepaidTaxRate
        };
        
        const payload = calculateCartPayload(productForPayload, item.Product.Qty);
        
        await updateCartItem(item.Product.id.toString(), payload, selectedCustomer?.C_Number?.toString() || '');
      }
      
      // Refresh cart items and update Redux state
      await loadCartItems();
      setPriceChangeModalOpen(false);
      
      toast.success('Price changes applied successfully');
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
    // Validate cart before placing order
    const cartItemsForValidation = cartItems.map((item: CartItem) => ({
      id: item.Description,
      quantity: item.Product.Qty,
      price: item.Product.Price,
      priceWithTax: item.Product.Price_With_Tax,
      hasProductLimit: item.hasProductLimit || false,
      productLimit: item.productLimit || null
    }));

    const validationData = {
      userLimitMinOrderAmount,
      totalAmountWithTax,
      totalAmount
    };

    if (!validateCartForCheckout(cartItemsForValidation, validationData)) {
      return;
    }

    setPlaceOrderLoading(true);
    try {
      // Prepare order payload
      const orderPayload = cartItems.map((item: any) => {
        // For return orders, Qty should always be negative
        const qty = Math.abs(item.Product.Qty) * -1;
        
        // Use values directly from cart item Product (already includes discounts)
        const price = Number(item.Product.Price || 0);
        const priceWithTax = Number(item.Product.Price_With_Tax || 0);
        const totalPrice = Number(item.Product.TotalPrice || 0);
        const totalPriceWithTax = Number(item.Product.TotalPriceWithTax || 0);
        const taxRate = Number(item.Product.Tax_Rate || 0);
        // Use TotalprepaidTaxRate directly from cart (already calculated correctly)
        const prepaidTaxRateValue = Number(item.Product.TotalprepaidTaxRate || 0);
        
        return {
          Customer_Number: item.Product.Customer_Number,
          Item_Number: item.Item_Number,
          Price: Number(price.toFixed(2)),  
          Price_With_Tax: Number(priceWithTax.toFixed(2)),
          Qty: qty,
          Tax_Rate: Number(taxRate.toFixed(2)),
          TotalPrice: Number(totalPrice.toFixed(2)),
          TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
          prepaidTaxRate: Number(prepaidTaxRateValue.toFixed(2)), // Use TotalprepaidTaxRate from cart
          originalPrice: Number(item.Product.originalPrice || price).toFixed(2),
          id: item.Product.id
        };
      });

      const payload = {
        Delivery_Charge: Number(deliveryCharge).toFixed(2),  
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
      const response: any = await returnPlaceOrder(selectedCustomer?.C_Number?.toString() || '', payload);
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

  // Calculate price details
  const calculatePriceDetails = () => {
    const subtotal = Number(cartItems.reduce((sum: any, item: any) => sum + (item.Product.Price_With_Tax * item.Product.Qty), 0).toFixed(2));
    //  const discount = 0; // No discount for now
    const crv = Number(0).toFixed(2); // No CRV for now
    const deliveryCharges = Number(deliveryCharge).toFixed(2); // No delivery charges for now
    const estimatedTotal = Number((subtotal + Number(crv) + Number(deliveryCharges)).toFixed(2));

    return {
      subtotal,
      // discount,
      crv,
      deliveryCharges,
      estimatedTotal,
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
            <Typography fontSize={12} color="text.secondary">
              Pack: {row.CaseCount} Case: {row.CaseCount} Size: {row.UOM} Unit: {row.UOM}
            </Typography>
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
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {row.showWithOutPrice ? '-' : `$${row.Product.Price_With_Tax}`} 
          </Typography>
        </Box>
      ),
    },
    {
      id: "totalPrice",
      label: "Total Price",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">
            {row.showWithOutPrice ? '-' : `$${row.Product.TotalPriceWithTax}`}
          </Typography>
        </Box>
      ),
    },
    // {
    //   id: "discount",
    //   label: "Discount",
    //   render: (row) => (
    //     <Box display="flex" alignItems="center" gap={1}>
    //       <Typography fontSize={12} fontWeight={400} color="text.secondary">
    //         {row.showWithOutPrice ? '-' : (row.isPriceChanged ? `$${(row.oldPrice - row.newPrice).toFixed(2)}` : "$0.00")}
    //       </Typography>
    //     </Box>
    //   ),
    // },
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
              onClick={() => handleQuantityChange(row, -1)}
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
              onClick={() => handleQuantityChange(row, 1)}
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
        {cartItems.length > 0 && (
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
        )}
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={3}>
            {/* <Grid size={12}>
              <FrequentlyBoughtTogether
                products={frequentlyBoughtProducts}
                onAddProduct={handleAddProduct}
              />
            </Grid> */}
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
              <PriceDetails {...priceDetails} />
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
    </Box>
  );
};

export default ReturnOrderCartPage;
