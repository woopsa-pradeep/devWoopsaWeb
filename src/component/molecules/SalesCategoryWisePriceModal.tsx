import React from 'react';
import { Box, Typography } from '@mui/material';
import CommonModal from '../atoms/CommonModal';
import CustomButton from '../atoms/CustomButton';
import { useShowPrepaidTax } from '../../utils/prepaidTaxDisplayUtils';

interface CartItem {
  Description: string;
  Item_Number: number;
  salesCategory?: string;
  showWithOutPrice?: boolean;
  prepaidTaxRate?: number;
  Product: {
    id: number;
    Price: number | string;
    Tax_Rate: number | string;
    Qty: number;
    TotalPrice: number | string;
    TotalPriceWithTax: number | string;
  };
}

interface SalesCategoryWisePriceModalProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
}

interface CategoryGroup {
  categoryName: string;
  total: number;
}

const SalesCategoryWisePriceModal: React.FC<SalesCategoryWisePriceModalProps> = ({
  open,
  onClose,
  cartItems
}) => {
  const { showWithPerpaidTax } = useShowPrepaidTax();

  // Group items by salesCategory and calculate totals
  const groupByCategory = (items: CartItem[]): CategoryGroup[] => {
    const categoryMap = new Map<string, CartItem[]>();
    
    items.forEach(item => {
      const category = item.salesCategory || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    });

    // Convert to array and calculate totals
    const categories: CategoryGroup[] = [];
    categoryMap.forEach((items, categoryName) => {
      let total = 0;
      
      items.forEach(item => {
        if (!item.showWithOutPrice) {
          if (showWithPerpaidTax) {
            // Include prepaid tax in total (use TotalPriceWithTax)
            const totalPriceWithTax = Number(item.Product.TotalPriceWithTax || 0);
            total += totalPriceWithTax;
          } else {
            // Exclude prepaid tax from total
            const basePrice = Number(item.Product.Price || 0);
            const taxRate = Number(item.Product.Tax_Rate || 0);
            const qty = Number(item.Product.Qty || 0);
            const priceWithoutPrepaidTax = basePrice + taxRate;
            total += priceWithoutPrepaidTax * qty;
          }
        }
      });

      categories.push({
        categoryName,
        total: Number(Number(total).toFixed(2))
      });
    });

    // Sort by category name
    return categories.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  };

  const categoryGroups = groupByCategory(cartItems);
  const grandTotal = categoryGroups.reduce((sum, group) => sum + group.total, 0);

  return (
    <CommonModal 
      open={open} 
      onClose={onClose} 
      size="md" 
      title="Sales Category Wise Price"
    >
      <Box>
        {categoryGroups.length === 0 ? (
          <Typography fontSize={14} color="text.secondary" textAlign="center" py={3}>
            No items in cart
          </Typography>
        ) : (
          <Box>
            {categoryGroups.map((group) => (
              <Box 
                key={group.categoryName}
                display="flex" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{ 
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography fontSize={14} fontWeight={500}>
                  {group.categoryName}
                </Typography>
                <Typography fontSize={14} fontWeight={500}>
                  ${group.total.toFixed(2)}
                </Typography>
              </Box>
            ))}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ 
                pt: 2,
                mt: 1,
                borderTop: '2px solid',
                borderColor: 'primary.main'
              }}
            >
              <Typography fontSize={14} fontWeight={500}>
                Grand Total
              </Typography>
              <Typography fontSize={14} fontWeight={500}>
                ${grandTotal.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <CustomButton
            onClick={onClose}
            size="small"
            fullWidth={false}
          >
            OK
          </CustomButton>
        </Box>
      </Box>
    </CommonModal>
  );
};

export default SalesCategoryWisePriceModal;
