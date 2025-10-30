import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';

import orderPlacedActive from '../assets/open box done.svg';
import orderPlacedInactive from '../assets/open box done inactive.svg';
import orderPackedActive from '../assets/package box.svg';
import orderPackedInactive from '../assets/package box inactive.svg';
import picklistActive from '../assets/trolley.svg';
import picklistInactive from '../assets/trolley inactive.svg';
// import outForDeliveryActive from '../assets/delivery done.svg';
// import outForDeliveryInactive from '../assets/delivery done inactive.svg';
// import deliveredActive from '../assets/donation.svg';
// import deliveredInactive from '../assets/donation inactive.svg';

const stepsMeta = [
  { label: 'Order Placed', activeIcon: orderPlacedActive, inactiveIcon: orderPlacedInactive },
  { label: 'Picklist', activeIcon: picklistActive, inactiveIcon: picklistInactive },
  { label: 'Order Packed', activeIcon: orderPackedActive, inactiveIcon: orderPackedInactive },
  // { label: 'Out for Delivery', activeIcon: outForDeliveryActive, inactiveIcon: outForDeliveryInactive },
  // { label: 'Delivered', activeIcon: deliveredActive, inactiveIcon: deliveredInactive },
];

interface OrderStatusStepperProps {
  currentStep: number;
  dates: string[];
}

const StepperWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: '30px 0 0px',
  width: '100%',
  minWidth: '320px',
  overflowX: 'auto',
  [theme.breakpoints.down('sm')]: {
    padding: '20px 0 0px',
  }
}));

const StepLine = styled(Box)<{ active?: boolean }>(({ theme }) => ({
  position: 'absolute',
  top: '46%',
  left: '2.5%',
  right: '2.5%',
  height: '2px',
  backgroundColor: '#BDBDBD',
  zIndex: 1,
  transform: 'translateY(15px)',
  [theme.breakpoints.down('sm')]: {
    top: '42%',
  }
}));

const ActiveStepLine = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '46%',
  left: '2.5%',
  height: '2px',
  backgroundColor: theme.palette.primary.main,
  zIndex: 1,
  transform: 'translateY(15px)',
  [theme.breakpoints.down('sm')]: {
    top: '42%',
  }
}));

const StepContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  position: 'relative',
  zIndex: 2,
  gap: '8px',
  [theme.breakpoints.down('sm')]: {
    gap: '4px',
  }
}));

const StepItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  flex: 1,
  position: 'relative',
  minWidth: '80px',
  [theme.breakpoints.down('sm')]: {
    minWidth: '60px',
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '8px',
  position: 'relative',
  paddingBottom: '15px',
  [theme.breakpoints.down('sm')]: {
    marginBottom: '4px',
    paddingBottom: '10px',
  }
}));

const Circle = styled(Box)<{ active: boolean }>(({ theme, active }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: '#fff',
  border: `2px solid ${active ? theme.palette.primary.main : '#BDBDBD'}`,
  position: 'absolute',
  bottom: -5,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 3,
  [theme.breakpoints.down('sm')]: {
    width: 8,
    height: 8,
  }
}));

const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ currentStep = 0, dates }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTab = useMediaQuery(theme.breakpoints.down('md'));
  
  const iconSize = isMobile ? 24 : isTab ? 30 : 36;
  const fontSize = isMobile ? '10px' : isTab ? '11px' : '14px';
  const dateSize = isMobile ? '8px' : isTab ? '10px' : '12px';

  const stepWidth = 95 / (stepsMeta.length - 1);
  const activeLineWidth =
    currentStep === 0
      ? '14%' // customize this based on design
      : `${stepWidth * currentStep}%`;

  // Add date formatting function
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      console.log(error);
      return dateString; // Fallback to original string if parsing fails
    }
  };
  

  return (
    <Box sx={{ 
      overflowX: 'auto',
      '&::-webkit-scrollbar': {
        height: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
      }
    }}>
      <StepperWrapper>
        <StepLine />
        <ActiveStepLine sx={{ width: activeLineWidth }} />
        <StepContainer>
          {stepsMeta.map((step, index) => {
            const active = index <= currentStep;
            return (
              <StepItem key={index}>
                <IconWrapper>
                  <img
                    src={active ? step.activeIcon : step.inactiveIcon}
                    alt={step.label}
                    width={iconSize}
                    height={iconSize}
                    style={{ marginBottom: isMobile ? 4 : 8, filter: active ? 'none' : 'grayscale(100%)' }}
                  />
                  <Circle active={active} />
                </IconWrapper>
                <Typography
                  fontSize={fontSize}
                  fontWeight={500}
                  sx={{
                    mt: isMobile ? 1 : 2,
                    wordBreak: 'break-word'
                  }}
                  color={active ? 'primary.main' : 'text.secondary'}
                >
                  {step.label}
                </Typography>
                <Typography 
                  fontSize={dateSize} 
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {formatDate(dates[index])}
                </Typography>
              </StepItem>
            );
          })}
        </StepContainer>
      </StepperWrapper>
    </Box>
  );
};

export default OrderStatusStepper;
