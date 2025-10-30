import React from 'react';
import { Box, Typography } from '@mui/material';
import CommonModal from '../atoms/CommonModal';
import img1 from '../../assets/Default-Product-Image.jpg';
import CustomButton from '../atoms/CustomButton';
import InactiveItemsTable from './InactiveItemsTable';

interface InactiveItem {
  Description: string;
  Item_Number: number;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  Product: {
    id: number;
    Customer_Number: number;
    Item_Number: number;
    Price: string;
    Qty: number;
    TotalPrice: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface InactiveItemsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inactiveItems: InactiveItem[];
  loading?: boolean;
}

const InactiveItemsModal: React.FC<InactiveItemsModalProps> = ({
  open,
  onClose,
  onConfirm,
  inactiveItems,
  loading = false
}) => {
  const getProductImage = (item: InactiveItem): string => {
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
      title="Inactive Items Detected"
      isCloseIcon={true}
    >
      <Box>
        <Typography variant="body1" color="text.secondary" mb={3}>
          The following products are no longer active and will be removed from your cart.
        </Typography>

        <InactiveItemsTable
          items={inactiveItems}
          getProductImage={getProductImage}
        />

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <CustomButton
            onClick={onConfirm}
            size="small"
            fullWidth={false}
            loading={loading}
          >
            OK
          </CustomButton>
        </Box>
      </Box>
    </CommonModal>
  );
};

export default InactiveItemsModal;
