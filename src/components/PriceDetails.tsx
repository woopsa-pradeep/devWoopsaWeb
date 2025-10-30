import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PriceDetailsProps {
  subtotal: any;
  // discount: number;
  crv: any;
  deliveryCharges: any;
  estimatedTotal: any;
}

const PriceDetails: React.FC<PriceDetailsProps> = ({
  subtotal,
  // discount,
  crv,
  deliveryCharges,
  estimatedTotal,
}) => {
  console.log(crv);
  const mutedColor = '#8e99a3';
  const PriceRow = ({ label, value, isTotal = false }: { label: string; value: any; isTotal?: boolean }) => (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center" 
      px={2}
      py={1}
    >
      <Typography color="text.secondary" fontSize={14}>
        {label}
      </Typography>
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
  // const savings = discount;

  return (
    <Paper sx={{ borderRadius: 3, height: '100%', boxShadow: 'none', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Typography fontSize={16} fontWeight={500} mb={0} borderBottom="1px solid #E0E0E0" p={2}>
        Price Details
      </Typography>
      <Box>
        <PriceRow label="Subtotal" value={subtotal} />
        {/* <PriceRow label="Discount" value={discount} /> */}
        {/* <PriceRow label="Deposit" value={crv} /> */}
        <PriceRow label="Delivery Charges" value={deliveryCharges} />
      </Box>
      <Divider sx={{ my: 1, mx: 2 }} />
      <Box mb={1}>
        <PriceRow label="Grand Total" value={estimatedTotal} isTotal />
      </Box>
      {/* {savings > 0 && (
        <Box display="flex" alignItems="center" bgcolor="#d1fae5" px={2} py={1.5} mt={0} >
          <CheckCircleIcon sx={{ color: '#10b981', mr: 1 }} />
          <Typography fontSize={15} color="#047857" fontWeight={500}
            sx={{ wordBreak: 'break-word' }}>
            You will save ${savings.toLocaleString()} on this order!
          </Typography>
        </Box>
      )} */}
    </Paper>
  );
};

export default PriceDetails; 