import React from 'react';
import { Box, Typography } from '@mui/material';
import CommonModal from './CommonModal';
import CustomButton from './CustomButton';

interface GlobalPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
  customerId?: any;
  onConfirm?: (customerId: any) => void;
}

const GlobalPopup: React.FC<GlobalPopupProps> = ({
  open,
  onClose,
  title = "Notification",
  message,
  buttonText = "OK",
  customerId,
  onConfirm
}) => {
  
  const handleConfirm = () => {
    if (onConfirm && customerId) {
      onConfirm(customerId);
    }
    onClose();
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      isCloseIcon={false}
    >
      <Box >
        <Typography 
          fontSize={14} 
          color="text.secondary" 
          sx={{ mb: 2, lineHeight: 1.5 }}
        >
          {message}
        </Typography>

        <Box display="flex" justifyContent="flex-end">
          <CustomButton
            onClick={handleConfirm}
            size="small"
            fullWidth={false}
          >
            {buttonText}
          </CustomButton>
        </Box>
      </Box>
    </CommonModal>
  );
};

export default GlobalPopup; 