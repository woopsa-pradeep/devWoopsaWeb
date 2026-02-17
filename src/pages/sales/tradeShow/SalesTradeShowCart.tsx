import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Grid, Tooltip, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import CommonTable from "../../../component/atoms/Table/CommonTable";
import { TableColumn } from "../../../component/atoms/Table/CommonTable";
import DeleteConfirmationModal from "../../../component/atoms/DeleteConfirmationModal";
import OrderCelebration from "../../../component/atoms/OrderCelebration";
import ShippingDetails from "../../../component/molecules/ShippingDetails";
import PriceDetails from "../../../components/PriceDetails";
import product1 from "../../../assets/Default-Product-Image.jpg";
import deleteIcon from "../../../assets/icons/delete.svg";
import {
  getSalesTradeShow,
  getSalesTradeShowCartItems,
  updateSalesTradeShowCartItem,
  removeFromSalesTradeShowCart,
  clearSalesTradeShowCart,
  placeSalesTradeShowOrder,
} from "../../../redux/apis/sales/salesTradeShowApis";
import { getDeliveryCharge, getSalesWarehouseProfile } from "../../../redux/apis/sales/salesOrderApis";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../../redux/store";
import { setSalesTradeShowCartCount } from "../../../redux/slices/salesTradeShowCartSlice";
import toast from "react-hot-toast";
import { roundPrepaidTax } from "../../../utils/prepaidTaxUtils";
import { useShowPrepaidTax, calculateDisplayPrice } from "../../../utils/prepaidTaxDisplayUtils";

interface CartItemType {
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  price: number;
  Tax_Rate: number;
  showWithOutPrice?: boolean;
  prepaidTaxRate?: number;
  showDistributorImage?: boolean;
  distributorImage?: string | null;
  masterImage?: string;
  UnitOunces?: string;
  minQuantity?: number;
  maxQuantity?: number;
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
  };
}

const SalesTradeShowCart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const selectedCustomer = auth?.selectedCustomer;
  const customerId = selectedCustomer?.C_Number?.toString() ?? "";
  const addresses = auth;
  const shippingAddress = `${addresses?.storeDetail?.C_Address ?? ""}, ${addresses?.storeDetail?.C_City ?? ""}, ${addresses?.storeDetail?.C_State ?? ""}, ${addresses?.storeDetail?.C_Zip ?? ""}`;
  const warehouseAddress = `${addresses?.wareHouseDetail?.[0]?.D_Addr1 ?? ""}, ${addresses?.wareHouseDetail?.[0]?.D_City ?? ""}, ${addresses?.wareHouseDetail?.[0]?.D_State ?? ""}`;

  const { showWithPerpaidTax } = useShowPrepaidTax();

  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [warehouseProfile, setWarehouseProfile] = useState<any>(null);
  const [warehouseProfileLoading, setWarehouseProfileLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [, setPickupTime] = useState("10:00");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clearCartModalOpen, setClearCartModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItemType | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tradeShowId, setTradeShowId] = useState<number | null>(null);

  const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
  const debounceTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await getSalesTradeShow();
        const id = res?.data?.data?.id ?? res?.data?.id ?? res?.data?.tradeShowId;
        if (!cancelled) {
          if (id != null) setTradeShowId(Number(id));
          else setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadCart = useCallback(async () => {
    if (!customerId || tradeShowId == null) {
      if (!customerId) setCartItems([]);
      setLoading(false);
      return;
    }
    try {
      const response: any = await getSalesTradeShowCartItems(customerId, tradeShowId);
      const items = response?.data?.finalCartItems ?? response?.finalCartItems ?? response?.data ?? [];
      setCartItems(Array.isArray(items) ? items : []);
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, tradeShowId]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    dispatch(setSalesTradeShowCartCount(cartItems.length));
  }, [dispatch, cartItems.length]);

  useEffect(() => {
    if (customerId) getDeliveryCharge(customerId).then((res: any) => setDeliveryCharge(res?.data ?? 0));
  }, [customerId]);

  useEffect(() => {
    setWarehouseProfileLoading(true);
    getSalesWarehouseProfile()
      .then((res: any) => {
        const profile = res?.data?.warehouseProfile ?? res?.warehouseProfile ?? res?.data;
        setWarehouseProfile(profile ?? { timeSlots: [], cutOffTime: "23:00:00", storePickup: false, allowShipping: true });
        if (profile && !profile.allowShipping && profile.storePickup) setShippingMethod("pickup");
      })
      .finally(() => setWarehouseProfileLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const getProductImage = (item: CartItemType): string => {
    if (item.showDistributorImage && item.distributorImage) return item.distributorImage;
    if (item.masterImage && item.masterImage !== "https://woopsacdn.blob.core.windows.net/product-images/undefined.jpg") return item.masterImage;
    return product1;
  };

  const calculatePriceDetails = () => {
    let subtotal: number;
    let totalPrepaidTax = 0;

    if (showWithPerpaidTax) {
      subtotal = Number(Number(cartItems.reduce((sum, item) => sum + Number(item.Product.Price_With_Tax ?? 0) * Number(item.Product.Qty ?? 0), 0)).toFixed(2));
    } else {
      subtotal = Number(Number(cartItems.reduce((sum, item) => {
        const basePrice = Number(item.Product.Price ?? 0);
        const taxRate = Number(item.Product.Tax_Rate ?? 0);
        const qty = Number(item.Product.Qty ?? 0);
        const priceWithoutPrepaidTax = basePrice + taxRate;
        return sum + priceWithoutPrepaidTax * qty;
      }, 0)).toFixed(2));
      totalPrepaidTax = Number(Number(cartItems.reduce((sum, item) => {
        const basePrice = Number(item.Product.Price ?? 0);
        const taxRate = Number(item.Product.Tax_Rate ?? 0);
        const prepaidTaxRate = Number(item.prepaidTaxRate ?? 0);
        const qty = Number(item.Product.Qty ?? 0);
        const basePriceWithTax = basePrice + taxRate;
        const prepaidTaxAmount = basePriceWithTax * prepaidTaxRate;
        return sum + prepaidTaxAmount * qty;
      }, 0)).toFixed(2));
    }

    const crv = Number(Number(0).toFixed(2));
    const deliveryCharges = Number(Number(deliveryCharge || 0).toFixed(2));
    const estimatedTotal = Number(Number(subtotal + crv + deliveryCharges + (showWithPerpaidTax ? 0 : totalPrepaidTax)).toFixed(2));

    return {
      subtotal,
      crv,
      deliveryCharges,
      estimatedTotal,
      prepaidTax: totalPrepaidTax,
      showPrepaidTax: !showWithPerpaidTax && totalPrepaidTax > 0,
    };
  };

  const handleQuantityChange = async (item: CartItemType, change: number) => {
    if (!customerId) return;
    const minQty = item.minQuantity ?? 1;
    const maxQty = item.maxQuantity ?? 999999;
    let newQty = item.Product.Qty + change;
    if (newQty > 0) newQty = Math.min(maxQty, Math.max(minQty, newQty));
    if (newQty <= 0) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
      return;
    }
    try {
      const price = Number(item.Product.Price ?? 0);
      const taxRate = Number(item.Product.Tax_Rate ?? 0);
      const prepaidTaxRate = Number(item.prepaidTaxRate ?? 0);
      const basePriceWithTax = price + taxRate;
      const priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
      await updateSalesTradeShowCartItem(item.Product.id, customerId, {
        Price: Number(price.toFixed(2)),
        Price_With_Tax: Number(priceWithTax.toFixed(2)),
        Qty: newQty,
        Tax_Rate: Number(taxRate.toFixed(2)),
        TotalPrice: Number((price * newQty).toFixed(2)),
        TotalPriceWithTax: Number((priceWithTax * newQty).toFixed(2)),
        prepaidTaxRate: Number(prepaidTaxRate.toFixed(4)),
      });
      await loadCart();
      toast.success("Quantity updated.");
    } catch {
      toast.error("Failed to update quantity.");
    }
  };

  const handleQuantityInputChange = useCallback(async (item: CartItemType, newQuantity: number) => {
    if (!customerId) return;
    const minQty = item.minQuantity ?? 1;
    const maxQty = item.maxQuantity ?? 999999;
    if (newQuantity <= 0) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
      return;
    }
    const clampedQty = Math.min(maxQty, Math.max(minQty, newQuantity));
    try {
      const price = Number(item.Product.Price ?? 0);
      const taxRate = Number(item.Product.Tax_Rate ?? 0);
      const prepaidTaxRate = Number(item.prepaidTaxRate ?? 0);
      const basePriceWithTax = price + taxRate;
      const priceWithTax = basePriceWithTax * (1 + prepaidTaxRate);
      await updateSalesTradeShowCartItem(item.Product.id, customerId, {
        Price: Number(price.toFixed(2)),
        Price_With_Tax: Number(priceWithTax.toFixed(2)),
        Qty: clampedQty,
        Tax_Rate: Number(taxRate.toFixed(2)),
        TotalPrice: Number((price * clampedQty).toFixed(2)),
        TotalPriceWithTax: Number((priceWithTax * clampedQty).toFixed(2)),
        prepaidTaxRate: Number(prepaidTaxRate.toFixed(4)),
      });
      await loadCart();
    } catch {
      toast.error("Failed to update quantity.");
    }
  }, [customerId, loadCart]);

  const handleDebouncedQuantityChange = useCallback((item: CartItemType, newQuantity: number) => {
    if (debounceTimeouts.current[item.Product.id]) clearTimeout(debounceTimeouts.current[item.Product.id]);
    setInputValues((prev) => ({ ...prev, [item.Product.id]: newQuantity }));
    debounceTimeouts.current[item.Product.id] = setTimeout(() => {
      handleQuantityInputChange(item, newQuantity);
    }, 1000);
  }, [handleQuantityInputChange]);

  const handleDeleteItem = async (item: CartItemType) => {
    if (!customerId) return;
    try {
      await removeFromSalesTradeShowCart(item.Product.id, customerId);
      setItemToDelete(null);
      setDeleteModalOpen(false);
      await loadCart();
      toast.success("Item removed.");
    } catch {
      toast.error("Failed to remove item.");
    }
  };

  const handleClearCart = async () => {
    if (!customerId) return;
    try {
      await clearSalesTradeShowCart(customerId);
      setClearCartModalOpen(false);
      setCartItems([]);
      dispatch(setSalesTradeShowCartCount(0));
      toast.success("Cart cleared.");
    } catch {
      toast.error("Failed to clear cart.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerId) {
      toast.error("No customer selected.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    setPlaceOrderLoading(true);
    try {
      const orderPayload = cartItems.map((item: any) => {
        const price = Number(item.Product.Price ?? 0);
        const priceWithTax = Number(item.Product.Price_With_Tax ?? 0);
        const totalPrice = Number(item.Product.TotalPrice ?? 0);
        const totalPriceWithTax = Number(item.Product.TotalPriceWithTax ?? 0);
        const taxRate = Number(item.Product.Tax_Rate ?? 0);
        const qty = Number(item.Product.Qty ?? 1);
        const prepaidTaxRatePercent = Number(item.prepaidTaxRate ?? 0);
        const basePriceWithTax = price + taxRate;
        const prepaidTaxAmount = basePriceWithTax * prepaidTaxRatePercent;
        return {
          Customer_Number: item.Product.Customer_Number ?? selectedCustomer?.C_Number,
          Item_Number: item.Item_Number,
          Price: Number(price.toFixed(2)),
          Price_With_Tax: Number(priceWithTax.toFixed(2)),
          Qty: qty,
          Tax_Rate: Number(taxRate.toFixed(2)),
          TotalPrice: Number(totalPrice.toFixed(2)),
          TotalPriceWithTax: Number(totalPriceWithTax.toFixed(2)),
          prepaidTaxRate: roundPrepaidTax(prepaidTaxAmount),
          id: item.Product.id,
        };
      });

      const payload = {
        tradeShowId,
        Delivery_Charge: Number(Number(deliveryCharge || 0).toFixed(2)),
        orderPlayload: orderPayload,
        shippingMethod,
        pickupTime: shippingMethod === "pickup" ? selectedTimeSlot : null,
        deliveryInstructions,
        selectedTimeSlot: shippingMethod === "pickup" ? selectedTimeSlot : null,
        shippingDetails: {
          method: shippingMethod,
          pickupTime: shippingMethod === "pickup" ? selectedTimeSlot : null,
          instructions: deliveryInstructions,
          warehouseAddress,
          shippingAddress,
          selectedTimeSlot: shippingMethod === "pickup" ? selectedTimeSlot : null,
        },
      };

      const response: any = await placeSalesTradeShowOrder(customerId, payload);
      if (response?.success) {
        setShowCelebration(true);
        setCartItems([]);
        dispatch(setSalesTradeShowCartCount(0));
        toast.success("Trade show order placed successfully!");
      } else {
        toast.error(response?.message ?? "Failed to place order.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to place order.");
    } finally {
      setPlaceOrderLoading(false);
    }
  };

  const columns: TableColumn<CartItemType>[] = [
    {
      id: "itemNumber",
      label: "Item #",
      render: (row) => (
        <Typography fontSize="14px" color="textSecondary">
          {row.Item_Number}
        </Typography>
      ),
    },
    {
      id: "products",
      label: "Products",
      render: (row) => (
        <Tooltip title={row.Description} placement="top">
          <Box display="flex" alignItems="center" gap={1} justifyContent="flex-start">
            <img
              src={getProductImage(row)}
              alt={row.Description}
              style={{ width: 30, height: 30, objectFit: "contain" }}
              onError={(e) => { e.currentTarget.src = product1; }}
            />
            <Box>
              <Typography
                fontSize="13px"
                fontWeight={400}
                sx={{
                  maxWidth: "90%",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.3,
                }}
              >
                {row.Description}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ),
    },
    {
      id: "stock",
      label: "Stock",
      render: () => (
        <Typography fontSize={12} fontWeight={400} color="text.secondary">
          In Stock
        </Typography>
      ),
    },
    {
      id: "price",
      label: "Price",
      render: (row) => {
        if (row.showWithOutPrice) {
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={12} fontWeight={400} color="text.secondary">-</Typography>
            </Box>
          );
        }
        const basePrice = Number(row.Product.Price ?? 0);
        const taxRate = Number(row.Product.Tax_Rate ?? 0);
        const prepaidTaxRate = Number(row.prepaidTaxRate ?? 0);
        const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={12} fontWeight={400} color="text.secondary">${displayPrice}</Typography>
          </Box>
        );
      },
    },
    {
      id: "totalPrice",
      label: "Total Price",
      render: (row) => {
        if (row.showWithOutPrice) {
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={12} fontWeight={400} color="text.secondary">-</Typography>
            </Box>
          );
        }
        const basePrice = Number(row.Product.Price ?? 0);
        const taxRate = Number(row.Product.Tax_Rate ?? 0);
        const prepaidTaxRate = Number(row.prepaidTaxRate ?? 0);
        const qty = Number(row.Product.Qty ?? 0);
        const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
        const totalPrice = displayPrice * qty;
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={12} fontWeight={400} color="text.secondary">
              ${Number(Number(totalPrice).toFixed(2))}
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
              width: "fit-content",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              "&:hover": { borderColor: (theme) => theme.palette.primary.main },
              animation: "fadeIn 0.3s ease-in",
              "@keyframes fadeIn": {
                "0%": { opacity: 0, transform: "scale(0.9)" },
                "100%": { opacity: 1, transform: "scale(1)" },
              },
            }}
          >
            <RemoveIcon
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuantityChange(row, -1);
              }}
              sx={{ fontSize: "16px", color: "primary.main", cursor: "pointer" }}
            />
            <input
              type="text"
              value={inputValues[row.Product.id] !== undefined ? inputValues[row.Product.id] : row.Product.Qty}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value, 10) || 0;
                const maxQty = row.maxQuantity ?? 999999;
                if (newQuantity >= 0 && newQuantity <= maxQty) handleDebouncedQuantityChange(row, newQuantity);
              }}
              style={{
                width: "40px",
                textAlign: "center",
                border: "none",
                outline: "none",
                fontSize: "14px",
                backgroundColor: "transparent",
                color: "inherit",
              }}
            />
            <AddIcon
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if ((row.Product.Qty ?? 0) < (row.maxQuantity ?? 999999)) handleQuantityChange(row, 1);
              }}
              sx={{
                fontSize: "16px",
                color: "primary.main",
                cursor: (row.Product.Qty ?? 0) >= (row.maxQuantity ?? 999999) ? "not-allowed" : "pointer",
                opacity: (row.Product.Qty ?? 0) >= (row.maxQuantity ?? 999999) ? 0.5 : 1,
              }}
            />
          </Box>
          <Box
            component="img"
            src={deleteIcon}
            sx={{ width: "16px", height: "16px", cursor: "pointer" }}
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
          />
        </Box>
      ),
    },
  ];

  const priceDetails = calculatePriceDetails();

  if (!customerId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Please select a customer to view the trade show cart.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/sales/trade-show")}>
          Back to Trade Show
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 2, pt: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography fontSize={20} fontWeight={500} color="text.primary">
              Trade Show Cart
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => navigate("/sales/trade-show")}
              sx={{ textTransform: "none", fontSize: "12px", px: 2, py: 0.5 }}
            >
              Back to Trade Show
            </Button>
          </Box>
          <Box display="flex" gap={1}>
            {cartItems.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setClearCartModalOpen(true)}
                sx={{ textTransform: "none", fontSize: "12px", px: 2, py: 0.5 }}
              >
                Remove All Items
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={3}>
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
                  loading={loading}
                  containerHeight="calc(100vh - 300px)"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Grid container spacing={3}>
              {cartItems[0]?.showWithOutPrice === false && (
                <Grid size={12}>
                  <PriceDetails {...priceDetails} />
                </Grid>
              )}
              <Grid size={12}>
                <ShippingDetails
                  deliveryDate=""
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
                  cutOffTime={warehouseProfile?.cutOffTime ?? "23:00:00"}
                  storePickup={warehouseProfile?.storePickup ?? false}
                  allowShipping={warehouseProfile?.allowShipping ?? false}
                  onTimeSlotChange={setSelectedTimeSlot}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
          onConfirm={() => {
            if (itemToDelete) handleDeleteItem(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          title="Remove Item"
          message={`Are you sure you want to remove "${itemToDelete?.Description}" from your cart?`}
        />

        <DeleteConfirmationModal
          open={clearCartModalOpen}
          onClose={() => setClearCartModalOpen(false)}
          onConfirm={handleClearCart}
          title="Clear Cart"
          message="Are you sure you want to remove all items from your cart? This action cannot be undone."
        />
      </Box>

      <OrderCelebration
        open={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          navigate("/sales/trade-show");
        }}
      />
    </>
  );
};

export default SalesTradeShowCart;
