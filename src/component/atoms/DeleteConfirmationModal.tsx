import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box
} from '@mui/material';
import CustomButton from './CustomButton';

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  showCancelButton?: boolean;
  buttonText?: string;
  buttonType?: "delete" | "cancel";
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName,
  showCancelButton = true,
  buttonText = "Delete",
  buttonType = "delete"
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {title}
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body1" color="text.secondary" fontSize={14}>
          {message}
        </Typography>
        {itemName && (
          <Box mt={1}>
            <Typography variant="body2" fontWeight={500} color="error.main">
              Item: {itemName}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        {showCancelButton && (
        <CustomButton
          onClick={onClose}
          buttonType="cancel"
          appearance="outlined"
          size="small"
          fullWidth={false}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </CustomButton>
        )}
        <CustomButton
          onClick={() => {
            onConfirm();
            onClose();
          }}
          buttonType={buttonType}
          fullWidth={false}
          sx={{ minWidth: 100 }}
          size="small"
        >
          {buttonText}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal; 