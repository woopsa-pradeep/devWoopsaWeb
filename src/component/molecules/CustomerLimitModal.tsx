import React, { useEffect } from 'react';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CommonModal from '../atoms/CommonModal';
import TextInput from '../atoms/TextInput';
import CustomButton from '../atoms/CustomButton';
import { customerLimitSchema, CustomerLimitFormData } from '../../pages/admin/retailer/customerLimitSchema';

interface CustomerLimitModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  initialData?: {
    maxOrderLimit?: number;
    minOrderAmount?: number;
  };
  onSubmit: (data: CustomerLimitFormData) => Promise<void>;
  loading?: boolean;
}

const CustomerLimitModal: React.FC<CustomerLimitModalProps> = ({
  open,
  onClose,
  customerId,
  customerName,
  initialData,
  onSubmit,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerLimitFormData>({
    resolver: zodResolver(customerLimitSchema),
    defaultValues: {
      maxOrderLimit: initialData?.maxOrderLimit || 0,
      minOrderAmount: initialData?.minOrderAmount || 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        maxOrderLimit: initialData.maxOrderLimit || 0,
        minOrderAmount: initialData.minOrderAmount || 0,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: CustomerLimitFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting customer limit:', error);
    }
  };

  return (
    <CommonModal 
      open={open} 
      onClose={onClose} 
      title="Set Customer Limit" 
      size="sm"
    >
      <Box>
        {/* Customer Info */}
        <Box mb={3}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={1}>
            Customer ID
          </Typography>
          <Typography fontSize={14} fontWeight={500} color="text.primary" mb={2}>
            {customerId}
          </Typography>
          <Typography fontSize={12} fontWeight={400} color="text.secondary" mb={1}>
            Customer Name
          </Typography>
          <Typography fontSize={14} fontWeight={500} color="text.primary">
            {customerName}
          </Typography>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={2}>
            {/* Max Order Limit */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="maxOrderLimit"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="Max Order Limit"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    error={!!errors.maxOrderLimit}
                    helperText={errors.maxOrderLimit?.message}
                    fullWidth
                    inputProps={{ 
                      min: 0,
                      step: 1
                    }}
                  />
                )}
              />
            </Grid>
            
            {/* Min Order Amount */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="minOrderAmount"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="Min Order Amount ($)"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    error={!!errors.minOrderAmount}
                    helperText={errors.minOrderAmount?.message}
                    fullWidth
                    inputProps={{ 
                      min: 0,
                      step: 0.01
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
            <CustomButton 
              appearance="outlined" 
              onClick={onClose} 
              fullWidth={false}
              disabled={loading}
            >
              Cancel
            </CustomButton>
            <CustomButton 
              type="submit"
              disabled={loading}
              icon={loading ? <CircularProgress size={20} /> : null}
              fullWidth={false}
            >
              {loading ? 'Saving...' : 'Save'}
            </CustomButton>
          </Box>
        </form>
      </Box>
    </CommonModal>
  );
};

export default CustomerLimitModal; 