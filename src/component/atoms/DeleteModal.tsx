import React from 'react';
import { Box, Typography } from '@mui/material';
import CommonModal from './CommonModal';
import CustomButton from './CustomButton';

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  itemName?: string;
  loading?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  message,
  itemName,
  loading = false,
}) => {
  return (
    <CommonModal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Delete ${itemName}`}
    >
        
      <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>

      <Box display="flex" gap={2}>
        <CustomButton
          appearance="outlined"
          buttonType="cancel"
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </CustomButton>
        <CustomButton
          appearance="filled"
          onClick={onConfirm}
          loading={loading}
          buttonType="delete"
          sx={{ minWidth: 100 }}
        >
          Delete
        </CustomButton>
      </Box>
    </CommonModal>
  );
};

export default DeleteModal;