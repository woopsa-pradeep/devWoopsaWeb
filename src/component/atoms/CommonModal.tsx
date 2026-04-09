import React from 'react';
import {
  Modal,
  Box,
  IconButton,
  SxProps,
  Theme,
  Fade,
  Backdrop,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CommonModalProps {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  width?: string | number;
  maxWidth?: string | number;
  minWidth?: string | number;
  sx?: SxProps<Theme>;
  isCloseIcon?: boolean;
  title?: string;
  children: React.ReactNode;
  /** Tighter padding and title spacing for data-dense forms */
  dense?: boolean;
}

const sizeMap = {
  xs: 300,
  sm: 400,
  md: 500,
  lg: 700,
  xl: 900,
  xxl: 1200,
};

const CommonModal: React.FC<CommonModalProps> = ({
  open,
  onClose,
  size = 'md',
  width,
  maxWidth,
  title,
  minWidth,
  sx = [],
  isCloseIcon = true,
  children,
  dense = false,
}) => {
  const modalWidth = width ?? sizeMap[size];

  return (
    <Modal
      open={open}
      // onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 300,
      }}
    >
      <Fade in={open} timeout={300}>
        <Box
          sx={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: modalWidth,
              maxWidth: maxWidth ?? '95vw',
              minWidth: minWidth ?? 280,
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: dense ? 1.5 : 2,
              p: dense
                ? { xs: '8px 12px 12px', sm: '10px 16px 14px' }
                : { xs: "16px 24px 24px", sm: "16px 24px 24px" },
              outline: 'none',
              overflowY: 'auto',
              maxHeight: '90vh',
              transition: 'all 0.3s ease',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={dense ? 1 : 2}
            sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, pb: dense ? 0.25 : 0 }}
          >
          {title && (
            <Typography fontSize={dense ? 16 : 18} fontWeight={dense ? 600 : 500} color="primary.main" lineHeight={1.2}>
              {title}
            </Typography>
          )}
          {isCloseIcon && (
            <IconButton
              onClick={onClose}
              size={dense ? 'small' : 'medium'}
              sx={{ p: dense ? 0.5 : 1 }}
            >
              <CloseIcon sx={{ color: "primary.main" }} fontSize="small" />
            </IconButton>
          )}
          </Box>
          {children}
        </Box>
      </Fade>
    </Modal>
  );
};

export default CommonModal;
