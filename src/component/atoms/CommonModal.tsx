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
              borderRadius: 2,
              p: { xs: "16px 24px 24px", sm: "16px 24px 24px" },
              outline: 'none',
              overflowY: 'auto',
              maxHeight: '90vh',
              transition: 'all 0.3s ease',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
          {title && (
            <Typography fontSize={18} fontWeight={500} color="primary.main">
              {title}
            </Typography>
          )}
          {isCloseIcon && (
            <IconButton
              onClick={onClose}
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
