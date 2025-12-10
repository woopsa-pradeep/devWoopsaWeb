import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Paper
} from '@mui/material';
import img1 from '../../assets/Default-Product-Image.jpg';

interface PriceChangeItem {
  Description: string;
  Item_Number: number;
  oldPrice: number;
  newPrice: number;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  prepaidTaxRate?: number;
  Product: {
    id: number;
    Customer_Number: number;
    Item_Number: number;
    Price: string;
    Qty: number;
    TotalPrice: string;
    Tax_Rate?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface PriceChangeTableProps {
  items: PriceChangeItem[];
  getProductImage: (item: PriceChangeItem) => string;
}

const PriceChangeTable: React.FC<PriceChangeTableProps> = ({
  items,
  getProductImage
}) => {
  const getPriceChangeColor = (oldPrice: number, newPrice: number) => {
    return newPrice > oldPrice ? 'error.main' : 'success.main';
  };

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    return newPrice > oldPrice ? '↗' : '↘';
  };

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Product</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Item Number</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Old Price</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>New Price</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Change</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            // Calculate prices with prepaid tax: (price + Tax_Rate) * (1 + prepaidTaxRate)
            const calculatePriceWithPrepaidTax = (basePrice: number) => {
              const prepaidTaxRate = item.prepaidTaxRate || 0;
              const taxRate = Number(item.Product.Tax_Rate || 0);
              const basePriceWithTax = basePrice + taxRate;
              return basePriceWithTax * (1 + prepaidTaxRate);
            };
            
            const oldPriceWithTax = calculatePriceWithPrepaidTax(item.oldPrice);
            const newPriceWithTax = calculatePriceWithPrepaidTax(item.newPrice);
            
            const priceChangeColor = getPriceChangeColor(oldPriceWithTax, newPriceWithTax);
            const priceChangeIcon = getPriceChangeIcon(oldPriceWithTax, newPriceWithTax);
            const priceDifference = newPriceWithTax - oldPriceWithTax;
            const priceChangePercent = ((priceDifference / oldPriceWithTax) * 100).toFixed(1);

            return (
              <TableRow
                key={item.Item_Number}
                hover
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      component="img"
                      src={getProductImage(item)}
                      alt={item.Description}
                      onError={(e) => {
                        e.currentTarget.src = img1;
                      }}
                      sx={{
                        width: 40,
                        height: 40,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Box>
                      <Typography fontSize="14px" fontWeight={500}>
                        {item.Description}
                      </Typography>
                      <Typography fontSize="12px" color="text.secondary">
                        Qty: {item.Product.Qty}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography fontSize="14px" color="text.secondary">
                    {item.Item_Number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize="14px" color="text.secondary">
                    ${oldPriceWithTax.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize="14px" fontWeight={500}>
                    ${newPriceWithTax.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      fontSize="14px"
                      fontWeight={500}
                      color={priceChangeColor}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {priceChangeIcon} ${Math.abs(priceDifference).toFixed(2)}
                    </Typography>
                    <Typography
                      fontSize="12px"
                      color={priceChangeColor}
                      sx={{
                        backgroundColor: `${priceChangeColor}20`,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {priceChangePercent}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PriceChangeTable; 