import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Avatar, 
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import CommonModal from '../atoms/CommonModal';

interface Promo {
  id: number;
  bannerTitle: string;
  bannerDescription: string;
  inventors: string[];
  inventoryItems: any[];
  startDate: string;
  endDate: string;
  image_url?: string;
  status?: boolean;
}

interface PromoViewModalProps {
  promo: Promo | null;
  open: boolean;
  onClose: () => void;
}

const PromoViewModal: React.FC<PromoViewModalProps> = ({
  promo,
  open,
  onClose
}) => {
  const theme = useTheme();

  if (!promo) return null;

  return (
    <CommonModal open={open} onClose={onClose} size="lg" title="Promo Details">
      <Box sx={{ width: '100%' }}>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Banner Image */}
          <Box sx={{ flex: { md: '0 0 250px' } }}>
            <Avatar
              src={promo.image_url}
              alt={promo.bannerTitle}
              variant="rounded"
              sx={{
                width: '100%',
                height: 160,
                borderRadius: 1,
                // boxShadow: theme.shadows[2]
              }}
            />
          </Box>

          {/* Details */}
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={18} fontWeight={400} color="text.primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
              {promo.bannerTitle}
              <Chip
            label={promo.status ? 'Active' : 'Inactive'}
            sx={promo.status ? { backgroundColor: "rgb(102, 153, 255, 0.5  )" } : { backgroundColor: 'rgb(255, 102, 102, 0.5)', borderRadius: 1 }}
            size="small"
          />
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12}}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <DescriptionIcon fontSize="small" sx={{ color: 'primary.main', mt: 0.5 }} />
                  <Box>
                    <Typography fontSize={14} fontWeight={400} color="text.primary">Description</Typography>
                    <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
                      {promo.bannerDescription}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6}}>    
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <CalendarIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography fontSize={14} fontWeight={400} color="text.primary">Start Date</Typography>
                    <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
                      {dayjs(promo.startDate).format('MMMM DD, YYYY')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6}}>    
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <CalendarIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography fontSize={14} fontWeight={400} color="text.primary">End Date</Typography>
                    <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
                      {dayjs(promo.endDate).format('MMMM DD, YYYY')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6}}>    
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <InventoryIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography fontSize={14} fontWeight={400} color="text.primary">Products</Typography>
                    <Typography fontSize={14} color="text.secondary" sx={{ mt: 0.5 }}>
                      {promo.inventoryItems?.length || 0} items selected
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Products List */}
        {promo.inventoryItems && promo.inventoryItems.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography fontSize={14} fontWeight={500} color="text.primary" gutterBottom>
              Selected Products
            </Typography>
            
            <Grid container spacing={1.5}>
              {promo?.inventoryItems?.map((itemNumber, index) => (
                <Grid size={{ xs: 12, sm: 6}} key={index}>
                  <Box
                    sx={{
                      p: 1.5,
                      height: '100%',
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: theme.shadows[2],
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Typography fontSize={14} fontWeight={400} color="text.secondary">
                      {itemNumber}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </CommonModal>
  );
};

export default PromoViewModal;