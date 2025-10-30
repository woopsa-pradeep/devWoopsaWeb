import React from "react";
import { Box, Typography, Switch, SwitchProps } from "@mui/material";
import { styled } from "@mui/material/styles";

interface SwitchInputProps extends Omit<SwitchProps, 'onChange'> {
  label?: string;
  onChange: (checked: boolean) => void;
  sx?: any;
  isShowLabel?: boolean;
}

// iOS-style switch styling
const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.grey[400],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

const SwitchInput: React.FC<SwitchInputProps> = ({ 
  label, 
  checked, 
  onChange, 
  sx = { mb: 2.2 },
  isShowLabel = false,
  ...rest 
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <Box sx={sx}>
      
      
      <Box display="flex" alignItems="center" justifyContent={label ? "flex-start" : "space-between"} gap={label ? 1 : 0}>
        <IOSSwitch
          checked={checked}
          onChange={handleChange}
          {...rest}
        />
        {label && (
        <Typography
          fontSize={14}
          fontWeight={400}
          sx={{ opacity: "70%" }}
        >
          {label}
        </Typography>
      )}
        {isShowLabel && <Typography
          fontSize={12}
          color={checked ? "primary.main" : "text.secondary"}
          fontWeight={500}
        >
          {checked ? "Active" : "Inactive"}
        </Typography>}
      </Box>
    </Box>
  );
};

export default SwitchInput; 