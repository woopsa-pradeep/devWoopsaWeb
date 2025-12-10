import React from 'react';
import { Box, Typography } from '@mui/material';
import CommonModal from '../atoms/CommonModal';
import img1 from '../../assets/product1.png';
import PriceChangeTable from './PriceChangeTable';
import CustomButton from '../atoms/CustomButton';

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

interface PriceChangeModalProps {
  open: boolean;
  onClose: () => void;
  priceChangeItems: PriceChangeItem[];
}

const PriceChangeModal: React.FC<PriceChangeModalProps> = ({
  open,
  onClose,
  priceChangeItems
}) => {
  const getProductImage = (item: PriceChangeItem): string => {
    if (item.showDistributorImage && item.distributorImage) {
      return item.distributorImage;
    } else if (item.masterImage) {
      return item.masterImage;
    } else {
      return img1;
    }
  };

  return (
    <CommonModal 
      open={open} 
      onClose={onClose} 
      size="xl" 
      title="Price Changes Detected"
      isCloseIcon={false}
    >
      <Box>
        <Typography variant="body1" color="text.secondary" mb={3}>
          The following products have price changes. Prices will be automatically updated.
        </Typography>

        <PriceChangeTable
          items={priceChangeItems}
          getProductImage={getProductImage}
        />

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

export default PriceChangeModal; 