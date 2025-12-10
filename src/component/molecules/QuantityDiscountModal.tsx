import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  // Divider,
} from '@mui/material';
import CustomButton from '../atoms/CustomButton';
import CommonModal from '../atoms/CommonModal';

interface QtyDiscountItem {
  minQty: number;
  perDiscount: number;
  amountDiscount: number;
  hasPercentageDiscount: boolean;
}

interface QtyDiscountData {
  allowToDiscount: boolean;
  hasCaseDiscount: boolean;
  hasQtyDiscount: boolean;
  isCaseDiscount: boolean;
  isQtyDiscount: boolean;
  percentageCaseDiscount: number;
  minimumQtyForCaseDiscount: number;
  qtyDiscount: QtyDiscountItem[];
  price: number;
}

interface QuantityDiscountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedDiscount: any) => void;
  onNoDiscount: () => void;
  product: any | null;
  qtyDiscountData: QtyDiscountData | null;
}

const QuantityDiscountModal: React.FC<QuantityDiscountModalProps> = ({
  open,
  onClose,
  onConfirm,
  onNoDiscount,
  product,
  qtyDiscountData,
}) => {

  useEffect(() => {
    // Reset when modal opens
  }, [open]);

  // Helper function to get the product name and price with prepaid tax
  const getProductInfo = () => {
    if (!product) return { name: 'Product', priceWithTax: 0 };
    
    // Calculate price with prepaid tax: (price + Tax_Rate) * (1 + prepaidTaxRate)
    const calculatePriceWithPrepaidTax = (basePrice: number, prepaidTaxRate: number = 0, taxRate: number = 0) => {
      const basePriceWithTax = Number(Number(basePrice + taxRate).toFixed(2));
      return Number(Number(basePriceWithTax * (1 + prepaidTaxRate)).toFixed(2));
    };
    
    // Handle cart item structure
    if (product.Description && product.Product) {
      // Use originalPrice if available (for cart items), otherwise use Price or price
      const basePrice = Number(product.Product.originalPrice) || Number(product.Product.Price) || Number(product.price) || 0;
      const prepaidTaxRate = Number(product.prepaidTaxRate) || 0;
      const taxRate = Number(product.Product.Tax_Rate) || 0;
      // Always calculate from base price to ensure prepaid tax is included
      const priceWithTax = calculatePriceWithPrepaidTax(basePrice, prepaidTaxRate, taxRate);
      
      return {
        name: product.Description,
        priceWithTax: priceWithTax
      };
    }
    
    // Handle regular product structure
    const basePrice = Number(product.price) || 0;
    const prepaidTaxRate = Number(product.prepaidTaxRate) || 0;
    const taxRate = Number(product.Tax_Rate) || 0;
    // Always calculate from base price to ensure prepaid tax is included
    const calculatedPriceWithTax = calculatePriceWithPrepaidTax(basePrice, prepaidTaxRate, taxRate);
    
    return {
      name: product.name || 'Product',
      priceWithTax: calculatedPriceWithTax
    };
  };

  const productInfo = getProductInfo();

  const handleCaseDiscountApply = () => {
    if (!qtyDiscountData || !product) return;
    
    const discountAmount = (productInfo.priceWithTax * qtyDiscountData.percentageCaseDiscount) / 100;
    const finalPrice = productInfo.priceWithTax - discountAmount;
    
    const discountData = {
      type: 'case',
      quantity: qtyDiscountData.minimumQtyForCaseDiscount,
      discountPercentage: qtyDiscountData.percentageCaseDiscount,
      discountAmount,
      finalPrice: Math.max(0, finalPrice),
      minQty: qtyDiscountData.minimumQtyForCaseDiscount
    };
    
    onConfirm(discountData);
    onClose();
  };

  const handleTierDiscountAdd = (discount: QtyDiscountItem) => {
    if (!product) return;
    
    let finalPrice = productInfo.priceWithTax;
    if (discount.hasPercentageDiscount) {
      const discountAmount = (productInfo.priceWithTax * discount.perDiscount) / 100;
      finalPrice = productInfo.priceWithTax - discountAmount;
    } else {
      finalPrice = productInfo.priceWithTax - discount.amountDiscount;
    }
    
    const discountData = {
      type: 'quantity',
      quantity: discount.minQty,
      discount: discount,
      finalPrice: Math.max(0, finalPrice),
      minQty: discount.minQty
    };
    
    onConfirm(discountData);
    onClose();
  };

  const renderCaseDiscount = () => {
    if (!qtyDiscountData || !qtyDiscountData.isCaseDiscount) return null;
    
    const finalPrice = productInfo.priceWithTax - (productInfo.priceWithTax * qtyDiscountData.percentageCaseDiscount / 100);
    
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
          Case Discount Available
        </Typography>
        
        <Box sx={{ 
          p: 1.5, 
          bgcolor: 'primary.50', 
          borderRadius: 1.5, 
          border: '1px solid',
          borderColor: 'primary.200',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Current Price:</Typography>
            <Typography variant="caption" fontWeight="600" color="text.primary">${productInfo.priceWithTax.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Min Qty:</Typography>
            <Typography variant="caption" fontWeight="600">{qtyDiscountData.minimumQtyForCaseDiscount} cases</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Discount:</Typography>
            <Typography variant="caption" fontWeight="600" color="success.main">{qtyDiscountData.percentageCaseDiscount}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Final Price:</Typography>
            <Typography variant="caption" fontWeight="600" color="primary.main">${finalPrice.toFixed(2)}</Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <CustomButton
            onClick={onNoDiscount}
            buttonType="cancel"
            appearance="outlined"
            size="small"
            fullWidth={false}
          >
            No Discount
          </CustomButton>
          <CustomButton
            onClick={handleCaseDiscountApply}
            size="small"
            fullWidth={false}
          >
            Apply Discount
          </CustomButton>
        </Box>
      </Box>
    );
  };

  const renderQuantityDiscount = () => {
    if (!qtyDiscountData || !qtyDiscountData.isQtyDiscount) return null;
    
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
          Quantity Discount Tiers
        </Typography>
        
        <Box sx={{ 
          p: 1.5, 
          bgcolor: 'grey.50', 
          borderRadius: 1.5, 
          border: '1px solid',
          borderColor: 'divider',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">Current Price:</Typography>
            <Typography variant="caption" fontWeight="600" color="text.primary">${productInfo.priceWithTax.toFixed(2)}</Typography>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ py: 0.5, px: 1, fontWeight: 600, fontSize: '0.75rem' }}>Qty</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontWeight: 600, fontSize: '0.75rem' }}>Discount</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontWeight: 600, fontSize: '0.75rem' }}>Price</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qtyDiscountData.qtyDiscount.map((discount, index) => {
                let finalPrice = productInfo.priceWithTax;
                let discountText = '';
                
                if (discount.hasPercentageDiscount) {
                  const discountAmount = (productInfo.priceWithTax * discount.perDiscount) / 100;
                  finalPrice = productInfo.priceWithTax - discountAmount;
                  discountText = `${discount.perDiscount}%`;
                } else {
                  finalPrice = productInfo.priceWithTax - discount.amountDiscount;
                  discountText = `$${discount.amountDiscount.toFixed(2)}`;
                }

                return (
                  <TableRow 
                    key={index}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 1.5, px: 1 }}>
                      <Chip 
                        label={discount.minQty} 
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: '20px',
                          bgcolor: 'primary.main', 
                          color: 'white' 
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Chip 
                        label={discount.hasPercentageDiscount ? "%" : "$"} 
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: '20px',
                          minWidth: '24px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography variant="caption" color="success.main" fontWeight="600">
                        {discountText}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Typography variant="caption" fontWeight="600" color="primary.main">
                        ${Math.max(0, finalPrice).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <CustomButton
                        size="small"
                        appearance="outlined"
                        onClick={() => handleTierDiscountAdd(discount)}
                        fullWidth={false}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1.5,
                          py: 0.25,
                          fontSize: '0.7rem',
                          mt: 0,
                          height: '24px'
                        }}
                      >
                        Add
                      </CustomButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CustomButton
            onClick={onNoDiscount}
            buttonType="cancel"
            appearance="outlined"
            size="small"
            fullWidth={false}
          >
            No Discount
          </CustomButton>
        </Box>
      </Box>
    );
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      maxWidth={600}
      title={`Discount Options - ${productInfo.name}`}
      sx={{ p: 1.5 }}
    >
      <Box>
        {qtyDiscountData && product && (qtyDiscountData.isCaseDiscount ? renderCaseDiscount() : renderQuantityDiscount())}
      </Box>
    </CommonModal>
  );
};

export default QuantityDiscountModal;
