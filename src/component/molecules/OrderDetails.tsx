import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import deleteIcon from '../../assets/icons/delete.svg';
import CustomButton from '../atoms/CustomButton';
import DeleteConfirmationModal from '../atoms/DeleteConfirmationModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useShowPrepaidTax, calculateDisplayPrice } from '../../utils/prepaidTaxDisplayUtils';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  priceWithTax: number; // Main price for display and calculations
  originalPrice: number; // Original base price without tax
  placedBySalesPerson: boolean;
  showWithOutPrice?: boolean;
  // Quantity discount fields
  hasQtyDiscount?: boolean;
  qtyDiscount?: any;
  // For display price calculation
  basePrice?: number;
  taxRate?: number;
  prepaidTaxRate?: number;
}

interface OrderDetailsProps {
  items: OrderItem[];
  onQuantityChange: (id: string, change: number) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  onContinue: () => void;
  // Quantity discount props
  onDiscountModalOpen?: (product: any, discountData: any) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  items,
  onQuantityChange,
  onRemoveItem,
  onClear,
  onContinue,
  onDiscountModalOpen
}) => {
  // Get showWithPerpaidTax setting
  const { showWithPerpaidTax } = useShowPrepaidTax();
  const auth = useSelector((state: RootState) => state.auth);
  
  // Calculate total using display price
  const total = items.reduce((sum, item) => {
    if (item.showWithOutPrice) return sum;
    
    const quantity = Number(item.quantity) || 0;
    
    // If we have base price components, calculate display price
    if (item.basePrice !== undefined && item.taxRate !== undefined && item.prepaidTaxRate !== undefined) {
      const basePrice = Number(item.basePrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const prepaidTaxRate = Number(item.prepaidTaxRate) || 0;
      const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
      const itemTotal = displayPrice * quantity;
      if (isNaN(itemTotal) || !isFinite(itemTotal)) {
        // Fallback if calculation results in NaN
        const priceWithTax = Number(item.priceWithTax) || 0;
        return sum + (priceWithTax * quantity);
      }
      return sum + itemTotal;
    }
    
    // Fallback to priceWithTax if base components not available
    const priceWithTax = Number(item.priceWithTax) || 0;
    const itemTotal = priceWithTax * quantity;
    if (isNaN(itemTotal) || !isFinite(itemTotal)) {
      return sum;
    }
    return sum + itemTotal;
  }, 0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<OrderItem | null>(null);
  const [editingQuantities, setEditingQuantities] = useState<{ [key: string]: string }>({});

  const handleDeleteClick = (item: OrderItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onRemoveItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  // Handle quantity change with discount logic
  const handleQuantityChange = (id: string, change: number) => {
    const item = items.find(item => item.id === id);
    if (!item) return;

    const currentQuantity = item.quantity;
    // const newQuantity = currentQuantity + change;

    // Check if this is the first time adding this product and if it has quantity discount
    const isFirstTimeAdding = currentQuantity === 0;
    if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount && onDiscountModalOpen) {
      // Open discount modal automatically for first-time additions
      onDiscountModalOpen(item, item.qtyDiscount);
      return; // Don't add to cart yet, wait for modal confirmation
    }

    // If not a discount case, proceed with normal quantity change
    onQuantityChange(id, change);
  };

  // Handle quantity input blur with discount logic
  const handleQuantityInputBlur = (item: OrderItem, newQuantity: number) => {
    const currentQuantity = item.quantity;

    // Only call onQuantityChange if the quantity has actually changed
    if (newQuantity !== currentQuantity) {
      // Check if this is the first time adding this product and if it has quantity discount
      const isFirstTimeAdding = currentQuantity === 0;
      if (isFirstTimeAdding && item.hasQtyDiscount && item.qtyDiscount && onDiscountModalOpen) {
        // Open discount modal automatically for first-time additions
        onDiscountModalOpen(item, item.qtyDiscount);
        return; // Don't add to cart yet, wait for modal confirmation
      }

      // If not a discount case, proceed with normal quantity change
      const difference = newQuantity - currentQuantity;
      onQuantityChange(item.id, difference);
    }

    setEditingQuantities(prev => {
      const newState = { ...prev };
      delete newState[item.id];
      return newState;
    });
  };

  // Clear editing state when items change (e.g., after API updates)
  useEffect(() => {
    setEditingQuantities({});
  }, [items]);

  return (
    <Box
      sx={{
        bgcolor: 'common.white',
        borderRadius: { xs: '0', sm: '8px' },
        overflow: 'hidden',
        height: { xs: 'auto', sm: 'calc(100vh - 230px)' },
        p: { xs: "4px 2px 0px", sm: "10px 10px 0px" },
        display: 'flex',
        flexDirection: 'column',
        boxShadow: { xs: 'none', sm: 1 },
        width: '100%',
        maxWidth: { xs: '100vw', sm: 420, md: 480 },
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          bgcolor: 'rgba(39, 158, 130, 1)',
          color: 'white',
          p: { xs: 0.5, sm: 1 },
          borderRadius: { xs: 0, sm: '8px 8px 0 0' },
        }}
      >
        <Typography fontSize={{ xs: "13px", sm: "14px" }} fontWeight={500}>
          Order Details
        </Typography>
      </Box>

      <Box
        sx={{
          px: { xs: 0.25, sm: 0.5 },
          py: { xs: 0.5, sm: 1 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 1.5,
              minHeight: { xs: 120, sm: 160 },
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: 'text.secondary' }} />
            <Typography fontSize={{ xs: "11px", sm: "12px" }} fontWeight={400} color="text.secondary">
              Your cart is empty
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                mb: 0.5,
                pr: { xs: 0, sm: 0.5 },
                maxHeight: { xs: 220, sm: 'none' },
              }}
            >
              {items.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    mb: index === items.length - 1 ? 0 : 0.5,
                    pb: index === items.length - 1 ? 0 : 0.5,
                    pr: 0,
                    borderBottom: index === items.length - 1 ? 'none' : '1px solid #E0E0E0',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    },
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: { xs: 0.5, sm: 1 },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: { xs: '11px', sm: '12px' },
                          fontWeight: 400,
                          color: 'text.primary',
                          mb: 0.1,
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '9px', sm: '10px' },
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.25,
                          flexWrap: 'wrap',
                        }}
                      >
                        {item.id}
                        {auth?.role === "retailer" && item.placedBySalesPerson ? (
                          <Chip
                            label={"Added by Sales Person"}
                            size="small"
                            sx={{
                              height: { xs: '15px', sm: '16px' },
                              fontSize: { xs: '8px', sm: '9px' },
                              fontWeight: 400,
                              ml: 0.25,
                              px: 0.5,
                            }}
                          />
                        ) : auth?.role === "retailer" && item.placedBySalesPerson === true ? (
                          <Chip
                            label={"Added by Sales Person"}
                            size="small"
                            sx={{
                              height: { xs: '15px', sm: '16px' },
                              fontSize: { xs: '8px', sm: '9px' },
                              fontWeight: 400,
                              ml: 0.25,
                              px: 0.5,
                            }}
                          />
                        ) : auth?.role === "sales" && item.placedBySalesPerson === false ? (
                          <Chip
                            label={"Added by Retailer"}
                            size="small"
                            sx={{
                              height: { xs: '15px', sm: '16px' },
                              fontSize: { xs: '8px', sm: '9px' },
                              fontWeight: 400,
                              ml: 0.25,
                              px: 0.5,
                            }}
                          />
                        ) : null}
                      </Typography>
                    </Box>

                    <IconButton
                      onClick={() => handleDeleteClick(item)}
                      sx={{
                        padding: { xs: '1px', sm: '2px' },
                        '&:hover': {
                          backgroundColor: 'error.lighter',
                          '& svg': {
                            color: 'error.main',
                          },
                        },
                        ml: 0.25,
                      }}
                    >
                      <img src={deleteIcon} alt="delete" style={{ width: 12, height: 12 }} />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: { xs: 0.5, sm: 1 },
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: (theme) => theme.palette.background.paper,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: "5px",
                        padding: { xs: "0px 1px", sm: "1px 2px" },
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: (theme) => theme.palette.primary.main,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                        },
                        minWidth: 0,
                      }}
                    >
                      <IconButton
                        sx={{
                          color: (theme) => theme.palette.primary.main,
                          padding: { xs: '1px', sm: '1px' },
                          '&:hover': {
                            backgroundColor: (theme) => `${theme.palette.primary.light}80`,
                          },
                          '&.Mui-disabled': {
                            color: 'text.disabled',
                          },
                        }}
                        size="small"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon sx={{ fontSize: { xs: 13, sm: 14 } }} />
                      </IconButton>

                      <input
                        type="text"
                        value={editingQuantities[item.id] !== undefined ? editingQuantities[item.id] : item.quantity}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setEditingQuantities(prev => ({
                            ...prev,
                            [item.id]: value
                          }));
                        }}
                        onBlur={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          handleQuantityInputBlur(item, newQuantity);
                        }}
                        data-product-id={item.id}
                        style={{
                          width: '22px',
                          textAlign: 'center',
                          border: 'none',
                          outline: 'none',
                          padding: '1px',
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          backgroundColor: 'transparent',
                          color: 'inherit',
                          margin: '0 1px',
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={1}
                        maxLength={4}
                      />

                      <IconButton
                        sx={{
                          color: (theme) => theme.palette.primary.main,
                          padding: { xs: '1px', sm: '1px' },
                          '&:hover': {
                            backgroundColor: (theme) => `${theme.palette.primary.light}80`,
                          },
                        }}
                        size="small"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        <AddIcon sx={{ fontSize: { xs: 13, sm: 14 } }} />
                      </IconButton>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 0.5, sm: 1 },
                        minWidth: 0,
                        flex: 1,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: '11px', sm: '12px' },
                          fontWeight: 500,
                          color: "primary.main",
                          minWidth: { xs: '40px', sm: '60px' },
                          textAlign: 'right',
                          wordBreak: 'break-all',
                        }}
                      >
                        {item.showWithOutPrice ? '-' : (() => {
                          // If we have base price components, calculate display price
                          if (item.basePrice !== undefined && item.taxRate !== undefined && item.prepaidTaxRate !== undefined) {
                            const basePrice = Number(item.basePrice) || 0;
                            const taxRate = Number(item.taxRate) || 0;
                            const prepaidTaxRate = Number(item.prepaidTaxRate) || 0;
                            const quantity = Number(item.quantity) || 0;
                            const displayPrice = calculateDisplayPrice(basePrice, taxRate, prepaidTaxRate, showWithPerpaidTax);
                            const totalPrice = displayPrice * quantity;
                            if (isNaN(totalPrice) || !isFinite(totalPrice)) {
                              // Fallback if calculation results in NaN
                              const priceWithTax = Number(item.priceWithTax) || 0;
                              return `$${Number(Number(priceWithTax * quantity).toFixed(2))}`;
                            }
                            return `$${Number(Number(totalPrice).toFixed(2))}`;
                          }
                          // Fallback to priceWithTax if base components not available
                          const priceWithTax = Number(item.priceWithTax) || 0;
                          const quantity = Number(item.quantity) || 0;
                          const totalPrice = priceWithTax * quantity;
                          if (isNaN(totalPrice) || !isFinite(totalPrice)) {
                            return '$0.00';
                          }
                          return `$${Number(Number(totalPrice).toFixed(2))}`;
                        })()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                pt: { xs: 0.5, sm: 1 },
                mt: { xs: 0.5, sm: 0 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: "#E3E4EB",
                  p: { xs: 0.5, sm: 0.75 },
                  borderRadius: '4px',
                  mb: 0.25,
                }}
              >
                <Typography fontWeight={400} fontSize={{ xs: "11px", sm: "12px" }} color="primary.main">
                  Total Qty
                </Typography>
                <Typography fontWeight={500} fontSize={{ xs: "11px", sm: "12px" }} color="primary.main">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: "#E3E4EB",
                  p: { xs: 0.5, sm: 0.75 },
                  borderRadius: '4px',
                  mt: 0.25,
                  mb: 0.5,
                }}
              >
                <Typography fontWeight={400} fontSize={{ xs: "11px", sm: "12px" }} color="primary.main">
                  Total
                </Typography>
                <Typography fontWeight={500} fontSize={{ xs: "11px", sm: "12px" }} color="primary.main">
                  {items.some(item => item.showWithOutPrice) ? '-' : `$${Number(Number(total).toFixed(2))}`}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 0.5, sm: 1 },
                  flexDirection: { xs: 'column', sm: 'row' },
                  mt: { xs: 0.5, sm: 0 },
                  mb: { xs: 0.5, sm: 0 },
                }}
              >
                <CustomButton
                  onClick={onContinue}
                  fullWidth
                  size='small'
                  sx={{
                    borderRadius: "4px",
                    marginTop: { xs: "0px", sm: "8px" },
                    fontSize: { xs: "12px", sm: "13px" },
                    py: 0.3,
                  }}
                >
                  Continue
                </CustomButton>
                <CustomButton
                  onClick={onClear}
                  fullWidth
                  size='small'
                  buttonType='cancel'
                  appearance='outlined'
                  sx={{
                    borderRadius: "4px",
                    marginTop: { xs: "0px", sm: "8px" },
                    fontSize: { xs: "12px", sm: "13px" },
                    py: 0.3,
                  }}
                >
                  Clear
                </CustomButton>
              </Box>
            </Box>
          </>
        )}
      </Box>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Item"
        message="Are you sure you want to remove this item from your order?"
        itemName={itemToDelete?.name}
      />
    </Box>
  );
};

export default OrderDetails;