import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import deleteIcon from "../../../assets/icons/delete.svg";
import CustomButton from "../../../component/atoms/CustomButton";
import DeleteConfirmationModal from "../../../component/atoms/DeleteConfirmationModal";
import { useShowPrepaidTax, calculateDisplayPrice } from "../../../utils/prepaidTaxDisplayUtils";

export interface TradeShowOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  priceWithTax: number;
  originalPrice: number;
  placedBySalesPerson?: boolean;
  showWithOutPrice?: boolean;
  basePrice?: number;
  taxRate?: number;
  prepaidTaxRate?: number;
}

interface TradeShowOrderDetailsProps {
  items: TradeShowOrderItem[];
  onQuantityChange: (id: string, change: number) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  onContinue: () => void;
}

const TradeShowOrderDetails: React.FC<TradeShowOrderDetailsProps> = ({
  items,
  onQuantityChange,
  onRemoveItem,
  onClear,
  onContinue,
}) => {
  const { showWithPerpaidTax } = useShowPrepaidTax();

  const total = items.reduce((sum, item) => {
    if (item.showWithOutPrice) return sum;
    const quantity = Number(item.quantity) || 0;
    if (item.basePrice !== undefined && item.taxRate !== undefined && item.prepaidTaxRate !== undefined) {
      const displayPrice = calculateDisplayPrice(item.basePrice, item.taxRate, item.prepaidTaxRate, showWithPerpaidTax);
      return sum + displayPrice * quantity;
    }
    const priceWithTax = Number(item.priceWithTax) || 0;
    return sum + priceWithTax * quantity;
  }, 0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TradeShowOrderItem | null>(null);
  const [editingQuantities, setEditingQuantities] = useState<{ [key: string]: string }>({});

  const handleDeleteClick = (item: TradeShowOrderItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onRemoveItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleQuantityInputBlur = (item: TradeShowOrderItem, newQuantity: number) => {
    if (newQuantity !== item.quantity) {
      const difference = newQuantity - item.quantity;
      onQuantityChange(item.id, difference);
    }
    setEditingQuantities((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  useEffect(() => {
    setEditingQuantities({});
  }, [items]);

  return (
    <Box
      sx={{
        bgcolor: "common.white",
        borderRadius: { xs: "0", sm: "8px" },
        overflow: "hidden",
        height: { xs: "auto", sm: "calc(100vh - 230px)" },
        p: { xs: "4px 2px 0px", sm: "10px 10px 0px" },
        display: "flex",
        flexDirection: "column",
        boxShadow: { xs: "none", sm: 1 },
        width: "100%",
        maxWidth: { xs: "100vw", sm: 420, md: 480 },
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          bgcolor: "rgba(39, 158, 130, 1)",
          color: "white",
          p: { xs: 0.5, sm: 1 },
          borderRadius: { xs: 0, sm: "8px 8px 0 0" },
        }}
      >
        <Typography fontSize={{ xs: "13px", sm: "14px" }} fontWeight={500}>
          Trade Show
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 0.25, sm: 0.5 }, py: { xs: 0.5, sm: 1 }, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {items.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160, gap: 1.5 }}>
            <ShoppingCartIcon sx={{ fontSize: 36, color: "text.secondary" }} />
            <Typography fontSize="12px" fontWeight={400} color="text.secondary">
              Your trade show cart is empty
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, overflowY: "auto", mb: 0.5, pr: { sm: 0.5 }, maxHeight: { xs: 220, sm: "none" } }}>
              {items.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    mb: index === items.length - 1 ? 0 : 0.5,
                    pb: index === items.length - 1 ? 0 : 0.5,
                    borderBottom: index === items.length - 1 ? "none" : "1px solid #E0E0E0",
                    borderRadius: "4px",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 400, color: "text.primary", wordBreak: "break-word" }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ fontSize: "10px", color: "primary.main" }}>{item.id}</Typography>
                    </Box>
                    <IconButton onClick={() => handleDeleteClick(item)} sx={{ p: "2px" }}>
                      <img src={deleteIcon} alt="delete" style={{ width: 12, height: 12 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "5px",
                        padding: "1px 2px",
                        minWidth: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => onQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 1}
                        sx={{ color: "primary.main" }}
                      >
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <input
                        type="text"
                        value={editingQuantities[item.id] !== undefined ? editingQuantities[item.id] : item.quantity}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          setEditingQuantities((prev) => ({ ...prev, [item.id]: value }));
                        }}
                        onBlur={(e) => {
                          const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                          handleQuantityInputBlur(item, newQuantity);
                        }}
                        style={{
                          width: "22px",
                          textAlign: "center",
                          border: "none",
                          outline: "none",
                          padding: "1px",
                          fontSize: "0.75rem",
                          backgroundColor: "transparent",
                          color: "inherit",
                          margin: "0 1px",
                        }}
                        inputMode="numeric"
                      />
                      <IconButton size="small" onClick={() => onQuantityChange(item.id, 1)} sx={{ color: "primary.main" }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "primary.main", textAlign: "right" }}>
                      {item.showWithOutPrice
                        ? "-"
                        : (() => {
                            if (item.basePrice !== undefined && item.taxRate !== undefined && item.prepaidTaxRate !== undefined) {
                              const displayPrice = calculateDisplayPrice(
                                item.basePrice,
                                item.taxRate,
                                item.prepaidTaxRate,
                                showWithPerpaidTax
                              );
                              return `$${Number((displayPrice * item.quantity).toFixed(2))}`;
                            }
                            return `$${Number((item.priceWithTax * item.quantity).toFixed(2))}`;
                          })()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1, mt: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#E3E4EB", p: 0.75, borderRadius: "4px", mb: 0.5 }}>
                <Typography fontWeight={400} fontSize="12px" color="primary.main">
                  Total Qty
                </Typography>
                <Typography fontWeight={500} fontSize="12px" color="primary.main">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#E3E4EB", p: 0.75, borderRadius: "4px", mb: 0.5 }}>
                <Typography fontWeight={400} fontSize="12px" color="primary.main">
                  Total
                </Typography>
                <Typography fontWeight={500} fontSize="12px" color="primary.main">
                  {items.some((i) => i.showWithOutPrice) ? "-" : `$${Number(total.toFixed(2))}`}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" }, mt: 0.5 }}>
                <CustomButton onClick={onContinue} fullWidth size="small" sx={{ borderRadius: "4px", fontSize: "13px", py: 0.3 }}>
                  Continue
                </CustomButton>
                <CustomButton
                  onClick={onClear}
                  fullWidth
                  size="small"
                  buttonType="cancel"
                  appearance="outlined"
                  sx={{ borderRadius: "4px", fontSize: "13px", py: 0.3 }}
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
        message="Are you sure you want to remove this item from your trade show cart?"
        itemName={itemToDelete?.name}
      />
    </Box>
  );
};

export default TradeShowOrderDetails;
