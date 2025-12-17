// src/components/dashboard/SalesProductList.tsx
import React, { useEffect, useCallback, useRef } from "react";
import { Box, Typography, IconButton, useTheme, Input } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import productImage from "../../../assets/Default-Product-Image.jpg"; // fallback image
import cart from "../../../assets/icons/cart.svg";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { fetchSalesNewItems, fetchSalesDiscountedItems, fetchSalesPromotedItems } from "../../../redux/slices/salesDashboardSlice";
import { addToCart, updateCartItem, removeFromCart } from "../../../redux/apis/sales/salesOrderApis";
import { fetchSalesCartItems } from "../../../redux/slices/salesCartSlice";
import { useNavigate } from "react-router-dom";
import { validateAddToCart, validateUpdateQuantity } from "../../../utils/cartValidationUtils";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { showErrorToast } from "../../../utils/toastUtils";
import { roundPrepaidTax } from "../../../utils/prepaidTaxUtils";

interface SalesProductListProps {
  title: string;
  type: "new" | "discounted" | "promoted";
  isTableStyle?: boolean;
  onDiscountModalOpen?: (product: any, discountData: any, quantity: number) => void;
}

const SalesProductList: React.FC<SalesProductListProps> = ({ title, type, onDiscountModalOpen }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Debouncing refs
  const inputDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const quantityChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get data from Redux store
  const { newItems, discountedItems, popularItems, loading } = useAppSelector((state: any) => state.salesDashboard);
  const cartItems = useAppSelector((state: any) => state.salesCart.items);
  const auth = useAppSelector((state: any) => state.auth);
  const { selectedCustomer } = useAppSelector((state: any) => state.auth);
  
  // Get products based on type
  const getProducts = () => {
    switch (type) {
      case "new":
        return newItems;
      case "discounted":
        return discountedItems;
      case "promoted":
        return popularItems;
      default:
        return [];
    }
  };

  const products = getProducts();

  // Check if sales user has Orders module with view permission
  const hasOrderModule = auth?.role === "sales" 
    ? auth?.module?.some((moduleItem: any) => moduleItem.module === "Orders" && moduleItem?.view === true)
    : true; // For non-sales users, always show cart (retailer, etc.)

  // Fetch data on component mount
  useEffect(() => {
    switch (type) {
      case "new":
        dispatch(fetchSalesNewItems(auth?.role || 'sales'));
        break;
      case "discounted":
        dispatch(fetchSalesDiscountedItems(auth?.role || 'sales'));
        break;
      case "promoted":
        dispatch(fetchSalesPromotedItems(auth?.role || 'sales'));
        break;
    }
  }, [dispatch, type]);

  // Get quantity for a product from cart
  const getCartQuantity = (itemNumber: string) => {
    const cartItem = cartItems.find((item: any) => item.Item_Number.toString() === itemNumber);
    return cartItem?.Product?.Qty || 0;
  };

  // Check if product has quantity discount and should open modal
  const shouldOpenDiscountModal = (product: any, currentQuantity: number, newQuantity: number) => {
    // Only open modal for first-time additions
    const isFirstTimeAdding = currentQuantity === 0;
    return product.hasQtyDiscount && 
           product.qtyDiscount && 
           onDiscountModalOpen && 
           isFirstTimeAdding && 
           newQuantity > 0;
  };

  // Helper function to calculate cart payload with prepaidTaxRate
  // New calculation: Price_With_Tax = Price_With_Tax * (1 + prepaidTaxRate)
  // Where base Price_With_Tax = price + Tax_Rate
  const calculateCartPayload = (product: any, quantity: number, finalPriceWithTax?: number) => {
    const basePrice = product.price;
    const prepaidTaxRate = product.prepaidTaxRate || 0;
    const taxRate = product.Tax_Rate || 0;
    
    let priceWithTax: number;
    let price: number;
    let prepaidTaxPerUnit: number;
    let totalPrepaidTax: number;
    
    if (finalPriceWithTax !== undefined) {
      // For discounted items, use the provided finalPriceWithTax
      priceWithTax = finalPriceWithTax;
      
      // Calculate base Price_With_Tax (before prepaid tax): finalPriceWithTax / (1 + prepaidTaxRate)
      const basePriceWithTax = prepaidTaxRate > 0 ? finalPriceWithTax / (1 + prepaidTaxRate) : finalPriceWithTax;
      
      // Calculate price from basePriceWithTax: basePriceWithTax - Tax_Rate
      price = basePriceWithTax - taxRate;
      
      // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
      prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
      // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
      totalPrepaidTax = prepaidTaxPerUnit * quantity;
    } else {
      // Standard calculation: Price_With_Tax = (price + Tax_Rate) * (1 + prepaidTaxRate)
      const basePriceWithTax = basePrice + taxRate;
      
      // Calculate final Price_With_Tax: basePriceWithTax * (1 + prepaidTaxRate)
      priceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
      price = basePrice;
      
      // Calculate prepaid tax per unit: basePriceWithTax * prepaidTaxRate
      prepaidTaxPerUnit = basePriceWithTax * prepaidTaxRate;
      // Calculate total prepaid tax: (basePriceWithTax * prepaidTaxRate) * qty
      totalPrepaidTax = prepaidTaxPerUnit * quantity;
    }
    
    // Calculate total price with tax: Price_With_Tax * qty
    const totalPriceWithTax = priceWithTax * quantity;
    
    return {
      Price: Number(price.toFixed(2)),
      Price_With_Tax: Number(priceWithTax.toFixed(2)),
      Qty: quantity,
      Tax_Rate: Number(taxRate.toFixed(2)),
      TotalPrice: Number((price * quantity).toFixed(2)),
      TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
      originalPrice: Number(basePrice.toFixed(2)),
      prepaidTaxRate: Number(prepaidTaxRate.toFixed(4)), // Pass actual prepaidTaxRate from API
      TotalprepaidTaxRate: roundPrepaidTax(totalPrepaidTax)
    };
  };

  // Apply quantity discount automatically for existing items
  const applyQuantityDiscount = (product: any, newQuantity: number) => {
    // IMPORTANT: Apply discount to BASE PRICE first, then calculate Price_With_Tax
    const basePrice = product.price;
    const prepaidTaxRate = product.prepaidTaxRate || 0;
    const taxRate = product.Tax_Rate || 0;
    const basePriceWithTax = Number(Number(basePrice + taxRate).toFixed(2));
    const originalPriceWithTax = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
    
    if (!product.hasQtyDiscount || !product.qtyDiscount) {
      return originalPriceWithTax;
    }

    let discountedBasePrice = basePrice;
    
    if (product.qtyDiscount.isCaseDiscount && newQuantity >= product.qtyDiscount.minimumQtyForCaseDiscount) {
      // Apply case discount to base price
      const discountAmount = (basePrice * product.qtyDiscount.percentageCaseDiscount) / 100;
      discountedBasePrice = basePrice - discountAmount;
    } else if (product.qtyDiscount.isQtyDiscount) {
      // Find applicable quantity discount tier
      const applicableDiscount = product.qtyDiscount.qtyDiscount
        ?.filter((discount: any) => newQuantity >= discount.minQty)
        ?.sort((a: any, b: any) => b.minQty - a.minQty)[0];
      
      if (applicableDiscount) {
        if (applicableDiscount.hasPercentageDiscount) {
          // Apply percentage discount to base price
          const discountAmount = (basePrice * applicableDiscount.perDiscount) / 100;
          discountedBasePrice = basePrice - discountAmount;
        } else {
          // Apply amount discount to base price
          discountedBasePrice = basePrice - applicableDiscount.amountDiscount;
        }
      }
    }
    
    // Ensure discounted base price doesn't go below 0
    discountedBasePrice = Math.max(0, discountedBasePrice);
    
    // Calculate Price_With_Tax from discounted base price: (discountedBasePrice + Tax_Rate) * (1 + prepaidTaxRate)
    const discountedBasePriceWithTax = discountedBasePrice + taxRate;
    return discountedBasePriceWithTax * (1 + prepaidTaxRate);
  };

  // Handle quantity change with debouncing
  const handleQuantityChange = useCallback(async (itemNumber: string, change: number) => {
    if (!selectedCustomer?.C_Number) {
      console.error('No customer selected');
      return;
    }

    // Clear any existing timeout
    if (quantityChangeDebounceRef.current) {
      clearTimeout(quantityChangeDebounceRef.current);
      quantityChangeDebounceRef.current = null;
    }

    // Set new debounced timeout
    quantityChangeDebounceRef.current = setTimeout(async () => {
      const currentQuantity = getCartQuantity(itemNumber);
      const newQuantity = currentQuantity + change;
      
      if (newQuantity <= 0) {
        // Remove from cart
        const cartItem = cartItems.find((item: any) => item.Item_Number.toString() === itemNumber);
        if (cartItem?.Product?.id) {
          try {
            await removeFromCart(cartItem.Product.id.toString(), selectedCustomer.C_Number.toString());
            dispatch(fetchSalesCartItems());
          } catch (error) {
            console.error('Failed to remove item from cart:', error);
          }
        }
        return;
      }

              // Validate quantity limit before adding/updating
        const product = products.find((p: any) => p.itemNumber === itemNumber);
        if (product) {
          const productLimitData = {
            hasProductLimit: product.hasProductLimit || false,
            productLimit: product.productLimit || null
          };

          if (currentQuantity === 0) {
            // Validate add to cart
            if (!validateAddToCart(currentQuantity, newQuantity, productLimitData, product.name)) {
              return;
            }
          } else {
            // Validate update quantity
            if (!validateUpdateQuantity(newQuantity, productLimitData, product.name)) {
              return;
            }
          }
          
          // Check if this product has quantity discount and should open modal (for both new and existing items)
          if (shouldOpenDiscountModal(product, currentQuantity, newQuantity)) {
            onDiscountModalOpen?.(product, product.qtyDiscount, newQuantity);
            return; // Don't add to cart yet, wait for modal confirmation
          }

        // Add or update cart
        try {
          const finalPrice = applyQuantityDiscount(product, newQuantity);
          // Calculate original price with tax to check if discount was applied
          const basePrice = product.price;
          const prepaidTaxRate = product.prepaidTaxRate || 0;
          const taxRate = product.Tax_Rate || 0;
          const basePriceWithTax = basePrice + taxRate;
          const originalPriceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
          const discountApplied = Math.abs(finalPrice - originalPriceWithTax) > 0.01; // Allow for floating point precision
          const payload = calculateCartPayload(product, newQuantity, discountApplied ? finalPrice : undefined);
          
          if (currentQuantity === 0) {
            // Add new item
            await addToCart(selectedCustomer.C_Number.toString(), {
              Item_Number: parseInt(itemNumber),
              ...payload
            });
          } else {
            // Update existing item with automatic discount application
            const cartItem = cartItems.find((item: any) => item.Item_Number.toString() === itemNumber);
            if (cartItem?.Product?.id) {
              await updateCartItem(cartItem.Product.id.toString(), payload, selectedCustomer.C_Number.toString());
            }
          }
          
          // Refresh cart data
          dispatch(fetchSalesCartItems());
        } catch (error) {
          console.error('Failed to update cart:', error);
        }
      }
    }, 300); // 300ms debounce
  }, [cartItems, products, onDiscountModalOpen, dispatch, selectedCustomer]);

  // Handle input change with debouncing
  const handleInputChange = useCallback(async (itemNumber: string, value: string) => {
    if (!selectedCustomer?.C_Number) {
      console.error('No customer selected');
      return;
    }

    // Clear any existing timeout
    if (inputDebounceRef.current) {
      clearTimeout(inputDebounceRef.current);
      inputDebounceRef.current = null;
    }

    // Set new debounced timeout
    inputDebounceRef.current = setTimeout(async () => {
      const newQuantity = parseInt(value) || 0;
      const currentQuantity = getCartQuantity(itemNumber);
      
      if (newQuantity === currentQuantity) return;
      
      if (newQuantity <= 0) {
        // Remove from cart
        const cartItem = cartItems.find((item: any) => item.Item_Number.toString() === itemNumber);
        if (cartItem?.Product?.id) {
          try {
            await removeFromCart(cartItem.Product.id.toString(), selectedCustomer.C_Number.toString());
            dispatch(fetchSalesCartItems());
          } catch (error) {
            console.error('Failed to remove item from cart:', error);
          }
        }
        return;
      }

      // Validate quantity limit before updating
      const product = products.find((p: any) => p.itemNumber === itemNumber);
      if (product) {
        const productLimitData = {
          hasProductLimit: product.hasProductLimit || false,
          productLimit: product.productLimit || null
        };

        if (currentQuantity === 0) {
          // Validate add to cart
          if (!validateAddToCart(currentQuantity, newQuantity, productLimitData, product.name)) {
            return;
          }
        } else {
          // Validate update quantity
          if (!validateUpdateQuantity(newQuantity, productLimitData, product.name)) {
            return;
          }
        }
        
        // Check if this product has quantity discount and should open modal (for both new and existing items)
        if (shouldOpenDiscountModal(product, currentQuantity, newQuantity)) {
          onDiscountModalOpen?.(product, product.qtyDiscount, newQuantity);
          return; // Don't add to cart yet, wait for modal confirmation
        }

        // Update cart
        try {
          if (currentQuantity === 0) {
            // Add new item
            await addToCart(selectedCustomer.C_Number.toString(), {
              Item_Number: parseInt(itemNumber),
              Price: product.price - (product.priceWithTax - applyQuantityDiscount(product, newQuantity)),
              Price_With_Tax: applyQuantityDiscount(product, newQuantity),
              Qty: newQuantity,
              Tax_Rate: product.Tax_Rate,
              TotalPrice: product.price * newQuantity,
              TotalPriceWithTax: applyQuantityDiscount(product, newQuantity) * newQuantity,
              originalPrice: product.price
            });
          } else {
            // Update existing item with automatic discount application
            const discountedPrice = applyQuantityDiscount(product, newQuantity);
            const cartItem = cartItems.find((item: any) => item.Item_Number.toString() === itemNumber);
            if (cartItem?.Product?.id) {
              await updateCartItem(cartItem.Product.id.toString(), {
                Qty: newQuantity,
                Price: product.price - (product.priceWithTax - discountedPrice),
                Price_With_Tax: discountedPrice,
                Tax_Rate: product.Tax_Rate,
                TotalPrice: product.price * newQuantity,
                TotalPriceWithTax: discountedPrice * newQuantity,
                originalPrice: product.price
              }, selectedCustomer.C_Number.toString());
            }
          }
          dispatch(fetchSalesCartItems());
        } catch (error) {
          console.error('Failed to update cart:', error);
        }
      }
    }, 500); // 500ms debounce for input
  }, [cartItems, products, onDiscountModalOpen, dispatch, selectedCustomer]);

  // Handle "View All" click
  const handleViewAll = () => {
    navigate(`/sales/order?viewAll=${type}`);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (inputDebounceRef.current) {
        clearTimeout(inputDebounceRef.current);
      }
      if (quantityChangeDebounceRef.current) {
        clearTimeout(quantityChangeDebounceRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.mode === "light" ? "#E3E4EB" : "#444"}`,
        borderRadius: "10px",
        backgroundColor: theme.palette.background.paper,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 1,
      }}
    >
      <Box
        padding={"10px 16px"}
        borderBottom={`1px solid ${theme.palette.mode === "light" ? "#E3E4EB" : "#444"}`}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontSize={16} fontWeight={500}>
            {title}
          </Typography>
          <Typography onClick={handleViewAll} sx={{fontSize: "13px", cursor: "pointer", color: "primary.main"}}>
            View All
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          padding: "0px 16px",
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
            <Typography>Loading...</Typography>
          </Box>
        ) : products.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
            <Typography color="text.secondary">No items available</Typography>
          </Box>
        ) : (
          products.slice(0, 5).map((product: any, idx: number) => {
            const cartQuantity = getCartQuantity(product.itemNumber);
            
            return (
              <Box
                key={product.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1.5}
                pt={0.5}
                pb={1}
                borderBottom={`${idx === Math.min(products.length - 1, 4) ? "none" : `1px solid ${theme.palette.mode === "light" ? "#E3E4EB" : "#444"}`}`}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  minWidth={0}
                  flex={1}
                >
                  <Box
                    component="img"
                    src={product.image || productImage}
                    alt={product.name}
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1,
                      objectFit: "contain",
                    }}
                    onError={(e: any) => {
                      e.currentTarget.src = productImage;
                    }}
                  />
                  <Box minWidth={0}>
                    <Typography
                      fontSize={13}
                      fontWeight={500}
                      noWrap
                      maxWidth={"auto"}
                      color="text.primary"
                    >
                      {product.name}
                    </Typography>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Typography fontSize={11} color={
                        product.showTheInventoryStock 
                          ? (product.Inventory_OnHand > 0 ? "green" : "red")
                          : product.showLowStock ? "orange" : "green"
                      }>
                        {product.showTheInventoryStock 
                          ? `${product.Inventory_OnHand}`
                          : product.showLowStock ? "Low Stock" : "In Stock"}
                      </Typography>
                      <Typography fontSize={11} color= "#999">
                      Pack: {product.pack || '-'} | Size: {product.size || '-'} | Case: {product.case || '-'} | Unit: {product.UnitOunces || '-' }
                      </Typography>
                    </Box>
                    <Typography fontSize={13} fontWeight={500} color="text.primary">
                      {product.showWithOutPrice ? '-' : (() => {
                        // Calculate display price: (price + Tax_Rate) * (1 + prepaidTaxRate)
                        const basePrice = product.price || 0;
                        const prepaidTaxRate = product.prepaidTaxRate || 0;
                        const taxRate = product.Tax_Rate || 0;
                        const basePriceWithTax = basePrice + taxRate;
                        const displayPrice = Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
                        return `$${displayPrice}`;
                      })()}
                    </Typography>
                  </Box>
                </Box>
                  {hasOrderModule && product.allowToOrder ? (
                    cartQuantity === 0 ? (
                    <Box 
                      component="img" 
                      src={cart} 
                      onClick={() => handleQuantityChange(product.itemNumber, 1)}
                      sx={{ 
                        cursor: "pointer", 
                        backgroundColor: "primary.main", 
                        borderRadius: "50%",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "scale(1.1)"
                        }
                      }} 
                    />
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
                        sx={{
                          color: (theme) => theme.palette.primary.main,
                          padding: '2px',
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.action.hover
                          }
                        }}
                        size="small"
                        onClick={() => handleQuantityChange(product.itemNumber, -1)}
                      >
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      
                      <Input
                        value={cartQuantity}
                        onChange={(e) => handleInputChange(product.itemNumber, e.target.value)}
                        disableUnderline
                        sx={{
                          width: '32px',
                          mx: 0.5,
                          '& input': {
                            textAlign: 'center',
                            padding: '1px',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: (theme) => theme.palette.text.primary
                          }
                        }}
                        inputProps={{
                          min: 0,
                          style: { textAlign: 'center' }
                        }}
                      />

                      <IconButton
                        sx={{
                          color: (theme) => theme.palette.primary.main,
                          padding: '2px',
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.action.hover
                          }
                        }}
                        size="small"
                        onClick={() => handleQuantityChange(product.itemNumber, 1)}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )
                  ) : !product.allowToOrder ? (
                    <Typography 
                      fontSize={12}
                      color="error"
                      sx={{ fontStyle: 'italic' }}
                    >
                      Out of Stock
                    </Typography>
                  ) : null}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default SalesProductList; 