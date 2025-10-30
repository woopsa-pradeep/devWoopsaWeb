import React, { useState } from 'react';
import { Box, Typography, Paper, RadioGroup, TextField, Select, MenuItem, FormControl } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CustomButton from '../atoms/CustomButton';
import { useTheme } from '@mui/material/styles';
import CommonModal from '../atoms/CommonModal';
import { ReactComponent as PlaceOrderCartIcon } from '../../assets/placeOrderCartIcon.svg';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayTimeSlots {
  day: string;
  timeSlots: TimeSlot[];
}

interface ShippingDetailsProps {
  deliveryDate: string;
  shippingAddress: string;
  warehouseAddress: string;
  shippingMethod: 'delivery' | 'pickup';
  onShippingMethodChange: (method: 'delivery' | 'pickup') => void;
  onInstructionsChange: (instructions: string) => void;
  onPickupTimeChange: (time: string) => void;
  onTimeSlotChange?: (timeSlot: string) => void;
  onPlaceOrder: () => void;
  onSaveChanges?: () => void;
  loading?: boolean;
  itemLength?: number;
  timeSlots?: DayTimeSlots[];
  cutOffTime?: string;
  storePickup?: boolean;
  allowShipping?: boolean;
}

const ShippingDetails: React.FC<ShippingDetailsProps> = ({
  // deliveryDate,
  shippingAddress,
  warehouseAddress,
  shippingMethod,
  onShippingMethodChange,
  onInstructionsChange,
  onPickupTimeChange,
  onTimeSlotChange,
  onPlaceOrder,
  loading = false,
  itemLength = 0,
  timeSlots = [],
  storePickup = false,
  allowShipping = true
}) => {
  const theme = useTheme();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPickupTimeSlot, setSelectedPickupTimeSlot] = useState<string>('');

  // Get current day
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Get available time slots for current day
  const getAvailableTimeSlots = () => {
    const currentDay = getCurrentDay();
    const dayData = timeSlots.find(day => day.day === currentDay);
    return dayData ? dayData.timeSlots : [];
  };

  // Format time slot for display
  const formatTimeSlot = (slot: TimeSlot) => {
    return `${slot.startTime} - ${slot.endTime}`;
  };

  // Handle time slot selection
  const handleTimeSlotChange = (timeSlot: string) => {
    setSelectedPickupTimeSlot(timeSlot);
    // Extract the start time from the time slot (e.g., "13:00 - 14:00" -> "13:00")
    const startTime = timeSlot.split(' - ')[0];
    onPickupTimeChange(startTime);
    onTimeSlotChange?.(timeSlot);
  };

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <Paper sx={{ 
      borderRadius: 2, 
      boxShadow: 'none',
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`
    }}>
    { allowShipping && <Box>
      <Typography 
        fontSize={16} 
        fontWeight={500} 
        p={2} 
        borderBottom={1} 
        borderColor="divider"
        color="text.primary"
      >
        Shipping/Pickup Details
      </Typography>
      <Box sx={{
        // height: "calc(100vh - 770px)",
        // overflow: "auto",
      }}>
      <RadioGroup
        value={shippingMethod}
        onChange={(e) => onShippingMethodChange(e.target.value as 'delivery' | 'pickup')}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          // p: 2,
          width: '100%',
        }}
      >
        {/* Only show shipping option if allowShipping is true */}
        {allowShipping && (
          <Box 
            sx={{
              width: '100%',
              backgroundColor: shippingMethod === 'delivery' 
                ? theme.palette.mode === 'dark' 
                  ? theme.palette.primary.dark 
                  : "#E2F2FF" 
                : 'transparent',
              borderRadius: 1,
              cursor: 'pointer',
              // border: shippingMethod === 'delivery' 
              //   ? `1px solid ${theme.palette.primary.main}` 
              //   : `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.action.hover 
                  : "#E2F2FF"
              }
            }}
            onClick={() => onShippingMethodChange('delivery')}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 2,
              width: '100%'
            }}>
              <LocalShippingOutlinedIcon 
                sx={{
                  color: shippingMethod === 'delivery' ? '#ffffff' : theme.palette.text.secondary,
                  backgroundColor: shippingMethod === 'delivery' ? theme.palette.primary.main : 'transparent',
                  padding: 0.7,
                  borderRadius: '50%',
                  fontSize: '34px'
                }}
              />
              <Box>
                <Typography variant="subtitle2" color="text.primary">Shipping</Typography>
                {/* <Typography color="text.secondary" fontSize={12} display="flex" alignItems="center" gap={1}>
                  <CalendarTodayOutlinedIcon sx={{ fontSize: '10px' }} /> {deliveryDate} (Estimated delivery date)
                </Typography> */}
                <Typography color="text.secondary" fontSize={12} display="flex" alignItems="center" gap={1}>
                  <LocationOnOutlinedIcon sx={{ fontSize: '10px' }} /> Address: {shippingAddress}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Only show pickup option if storePickup is true */}
        {storePickup && (
          <Box 
            sx={{
              width: '100%',
              backgroundColor: shippingMethod === 'pickup' 
                ? theme.palette.mode === 'dark' 
                  ? theme.palette.primary.dark 
                  : '#E2F2FF' 
                : 'transparent',
              borderRadius: 1,
              cursor: 'pointer',
              // border: shippingMethod === 'pickup' 
              //   ? `1px solid ${theme.palette.primary.main}` 
              //   : `1px solid ${theme.palette.divider}`, 
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.action.hover 
                  : '#E2F2FF'
              }
            }}
            onClick={() => onShippingMethodChange('pickup')}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 2,
              width: '100%'
            }}>
              <StoreOutlinedIcon 
                sx={{
                  color: shippingMethod === 'pickup' ? '#ffffff' : theme.palette.text.secondary,
                  backgroundColor: shippingMethod === 'pickup' ? theme.palette.primary.main : 'transparent',
                  padding: 0.7,
                  borderRadius: '50%',
                  fontSize: '34px'
                }}
              />
              <Box>
                <Typography variant="subtitle2" color="text.primary">Pickup from Warehouse</Typography>
                {/* <Typography color="text.secondary" fontSize={12} display="flex" alignItems="center" gap={1}>
                  <CalendarTodayOutlinedIcon sx={{ fontSize: '10px' }} /> {deliveryDate} (Estimated pickup date)
                </Typography> */}
                <Typography color="text.secondary" fontSize={12} display="flex" alignItems="center" gap={1}>
                  <LocationOnOutlinedIcon sx={{ fontSize: '10px' }} /> Address: {warehouseAddress}
                </Typography>
                <Typography color="text.secondary" fontSize={12} display="flex" alignItems="center" gap={1}>
                  <AccessTimeOutlinedIcon sx={{ fontSize: '10px' }} /> Day: {getCurrentDay()}
                </Typography>
                {selectedPickupTimeSlot && (
                  <Typography color="text.secondary" fontSize={12} display="flex" alignItems="center" gap={1}>
                    <AccessTimeOutlinedIcon sx={{ fontSize: '10px' }} /> Time: {selectedPickupTimeSlot}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Show message if neither shipping nor pickup is available */}
        {!allowShipping && !storePickup && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error" fontSize={14}>
              No delivery options are currently available. Please contact support.
            </Typography>
          </Box>
        )}
      </RadioGroup>
      </Box>
      </Box>}
     

      {/* Time Slot Picker for Pickup */}
      {shippingMethod === 'pickup' && storePickup && (
        <Box p={"16px"}>
          <Typography sx={{color: "text.secondary"}} mb={1} fontSize={14} fontWeight={500}>
            Select Pickup Time ({getCurrentDay()})
          </Typography>
          {availableTimeSlots.length > 0 ? (
            <FormControl fullWidth size="small">
              <Select
                value={selectedPickupTimeSlot}
                onChange={(e) => handleTimeSlotChange(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? theme.palette.background.default 
                    : "#F5F5F5",
                  borderRadius: "6px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: `1px solid ${theme.palette.divider}`,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                  "& .MuiSelect-select": {
                    color: theme.palette.text.primary,
                  },
                  "& .MuiMenuItem-root": {
                    color: theme.palette.text.primary,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select a time slot
                </MenuItem>
                {availableTimeSlots.map((slot, index) => (
                  <MenuItem key={index} value={formatTimeSlot(slot)}>
                    {formatTimeSlot(slot)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography color="error" fontSize={12}>
              No time slots available for {getCurrentDay()}
            </Typography>
          )}
          {shippingMethod === 'pickup' && !selectedPickupTimeSlot && availableTimeSlots.length > 0 && (
            <Typography color="warning.main" fontSize={11} sx={{ mt: 1 }}>
              Please select a pickup time to continue
            </Typography>
          )}
        </Box>
      )}

      <Box p={"10px 16px 0px"}>
        <Typography sx={{color: "text.secondary"}} mb={1} fontSize={14} fontWeight={500}>
          {shippingMethod === 'pickup' ? 'Pickup Instructions' : 'Delivery Instructions'}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={deliveryInstructions}
          inputProps={{ maxLength: 50 }}
          sx={{
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.background.default 
              : "#F5F5F5",
            borderRadius: "6px",
            border: `1px solid ${theme.palette.divider}`,
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none"
            },
            "& .MuiInputBase-input": {
              fontSize: "14px",
              fontWeight: 400,
              color: theme.palette.text.primary,
              border: "none",
              "&:focus": {
                border: "none",
                outline: "none"
              },
              "&:hover": {
                border: "none",
                outline: "none"
              }
            },
            "&:hover": {
              borderColor: theme.palette.primary.main,
            },
            "&.Mui-focused": {
              borderColor: theme.palette.primary.main,
            }
          }}
          placeholder={shippingMethod === 'pickup' ? "Enter any special instructions for pickup" : "Enter any special instructions for delivery"}
          onChange={(e) => {
            setDeliveryInstructions(e.target.value);
            onInstructionsChange(e.target.value);
          }}
          size="small"
        />
        <Box display="flex" justifyContent="flex-end" mt={0.5}>
          <Typography fontSize={11} color="text.secondary">
            {deliveryInstructions.length}/50
          </Typography>
        </Box>
      </Box>

      <Box p={2} display="flex" gap={2} alignItems="center" justifyContent="space-between">
        <CustomButton 
          size='small' 
          sx={{borderRadius: "4px", mt: 0}}
          onClick={() => setIsConfirmModalOpen(true)}
          loading={loading}
          disabled={itemLength === 0 || (shippingMethod === 'pickup' && !selectedPickupTimeSlot)}
        >
          Place Order
        </CustomButton>
        
      </Box>

      <CommonModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        size="md"
        isCloseIcon={true}
        title="Place Order"
      >
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" >
          <PlaceOrderCartIcon style={{ width: 88, height: 90, marginBottom: 20 }} />
          <Typography fontWeight={500} fontSize={18} textAlign="center" mb={1} color="text.primary">
            Are you sure want to place your order?
          </Typography>
          <Typography color="text.secondary" fontSize={14} textAlign="center" mb={1}>
            Save your changes before placing the order
          </Typography>
          <Box display="flex" gap={2}>
            <CustomButton
              size="small"
              sx={{ minWidth: 80, borderRadius: '6px' }}
              onClick={() => setIsConfirmModalOpen(false)}
              appearance="outlined"
            >
              No
            </CustomButton>
            <CustomButton
              size="small"
              sx={{ minWidth: 80, borderRadius: '6px' }}
              onClick={() => {
                setIsConfirmModalOpen(false);
                onPlaceOrder();
              }}
              appearance="filled"
            >
              Yes
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

    </Paper>
  );
};

export default ShippingDetails; 