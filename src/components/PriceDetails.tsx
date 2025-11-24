import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, TextField, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';

interface PriceDetailsProps {
  subtotal: any;
  discount?: number;
  crv: any;
  deliveryCharges: any;
  estimatedTotal: any;
  deliveryCharge?: number;
  onDeliveryChargeChange?: (value: number) => void;
  allowEditDeliveryCharge?: boolean;
}

const PriceDetails: React.FC<PriceDetailsProps> = ({
  subtotal,
  discount = 0,
  crv,
  deliveryCharges,
  estimatedTotal,
  deliveryCharge,
  onDeliveryChargeChange,
  allowEditDeliveryCharge = false,
}) => {
  console.log(crv);
  const [isEditingDeliveryCharge, setIsEditingDeliveryCharge] = useState(false);
  const mutedColor = '#8e99a3';
  const PriceRow = ({ label, value, isTotal = false, onEditClick }: { label: string; value: any; isTotal?: boolean; onEditClick?: () => void }) => (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center" 
      px={2}
      py={1}
    >
      <Box display="flex" alignItems="center" gap={0.5}>
        <Typography color="text.secondary" fontSize={14}>
          {label}
        </Typography>
        {onEditClick && (
          <IconButton
            size="small"
            onClick={onEditClick}
            sx={{ 
              padding: '2px',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
          >
            <EditIcon sx={{ fontSize: '16px', color: 'primary.main' }} />
          </IconButton>
        )}
      </Box>
      <Typography 
        fontSize={isTotal ? 16 : 14} 
        fontWeight={isTotal ? 600 : 400}
        color={
          isTotal
            ? 'primary.main'
            : value === 0
              ? mutedColor
              : 'text.primary'
        }
      >
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
    </Box>
  );

  // Calculate savings as the discount value
  const savings = discount;

  return (
    <Paper sx={{ borderRadius: 3, height: '100%', boxShadow: 'none', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Typography fontSize={16} fontWeight={500} mb={0} borderBottom="1px solid #E0E0E0" p={2}>
        Price Details
      </Typography>
      <Box>
        <PriceRow label="Subtotal" value={subtotal} />
        {discount > 0 && <PriceRow label="Discount" value={discount} />}
        {/* <PriceRow label="Deposit" value={crv} /> */}
        {allowEditDeliveryCharge && onDeliveryChargeChange !== undefined && deliveryCharge !== undefined ? (
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            px={2}
            py={1}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography color="text.secondary" fontSize={14}>
                Delivery Charges
              </Typography>
              {!isEditingDeliveryCharge && (
                <IconButton
                  size="small"
                  onClick={() => setIsEditingDeliveryCharge(true)}
                  sx={{ 
                    padding: '2px',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <EditIcon sx={{ fontSize: '16px', color: 'primary.main' }} />
                </IconButton>
              )}
            </Box>
            {isEditingDeliveryCharge ? (
              <TextField
                type="number"
                value={deliveryCharge}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  onDeliveryChargeChange(Math.max(0, value));
                }}
                onBlur={() => setIsEditingDeliveryCharge(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingDeliveryCharge(false);
                  }
                }}
                inputProps={{ 
                  min: 0,
                  step: 0.01
                }}
                size="small"
                sx={{
                  flex: 1,
                  maxWidth: '100px',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  }
                }}
                autoFocus
              />
            ) : (
              <Typography 
                fontSize={14} 
                fontWeight={400}
                color={
                  (typeof deliveryCharge === 'number' ? deliveryCharge : (typeof deliveryCharges === 'string' ? parseFloat(deliveryCharges) : deliveryCharges)) === 0
                    ? mutedColor
                    : 'text.primary'
                }
              >
                ${(typeof deliveryCharge === 'number' ? deliveryCharge : (typeof deliveryCharges === 'string' ? parseFloat(deliveryCharges) : deliveryCharges)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            )}
          </Box>
        ) : (
          <PriceRow label="Delivery Charges" value={typeof deliveryCharges === 'string' ? parseFloat(deliveryCharges) : deliveryCharges} />
        )}
      </Box>
      <Divider sx={{ my: 1, mx: 2 }} />
      <Box mb={1}>
        <PriceRow label="Grand Total" value={estimatedTotal} isTotal />
      </Box>
      {savings > 0 && (
        <Box display="flex" alignItems="center" bgcolor="#d1fae5" px={2} py={1.5} mt={0} >
          <CheckCircleIcon sx={{ color: '#10b981', mr: 1 }} />
          <Typography fontSize={15} color="#047857" fontWeight={500}
            sx={{ wordBreak: 'break-word' }}>
            You will save ${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on this order!
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PriceDetails; 