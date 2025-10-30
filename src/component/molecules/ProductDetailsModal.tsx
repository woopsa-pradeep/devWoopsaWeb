import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  // useTheme,
} from '@mui/material';
import CommonModal from '../atoms/CommonModal';
import img1 from '../../assets/Default-Product-Image.jpg';

interface ProductDetailsModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    name: string;
    image: string;
    itemNumber: string;
    pack: string;
    case: string;
    size: string;
    UnitOunces: string;
    price: number;
    Tax_Rate: number;
    upc?: string;
    crv?: string;
    category?: string;
    subCategory?: string;
    stock?: string;
  } | null;
}

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <Box sx={{ mb: 1 }}>
    <Typography fontSize="11.5px" color="text.secondary">
      {label}
    </Typography>
    <Typography fontSize="12.5px" color="text.primary" fontWeight={400} sx={{ lineHeight: 1.3 }}>
      {value ?? '-'}
    </Typography>
  </Box>
);

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ open, onClose, product }) => {
  if (!product) return null;
  return (
    <CommonModal open={open} onClose={onClose} size="lg" title="Product Details">
      <Box sx={{ p: 1 }}>
        <Grid container spacing={2}>
          {/* Image & Price Block */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                p: 1,
                bgcolor: '#fafafa',
              }}
            >
              <Box
                component="img"
                src={product.image || img1}
                onError={(e: any) => {
                  e.currentTarget.src = img1;
                }}
                alt={product.name}
                sx={{
                  width: '100%',
                  // height: 160,
                  maxHeight: '250px',
                  objectFit: 'contain',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: '#fff',
                }}
              />
              <Typography fontSize="13px" color="text.primary" mb={0.5}>
                ${(product.price + (product.Tax_Rate || 0)).toFixed(2)}
              </Typography>
              
            </Box>
          </Grid>

          {/* Detail Fields */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <Typography
              fontSize="13.5px"
              fontWeight={500}
              color="text.primary"
              mb={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              lineHeight={1.3}
            >
              {product.name}
              <Chip
                label={product.stock ?? 'Unknown'}
                size="small"
                sx={{
                  fontSize: '10px',
                  height: 20,
                  px: 1,
                  backgroundColor:
                    product.stock === 'in stock' ? '#E6F4EA' : '#FDEAEA',
                  color:
                    product.stock === 'in stock' ? '#1BA856' : '#F34E4E',
                  textTransform: 'capitalize',
                  borderRadius: 1,
                }}
              />
            </Typography>

            <Grid container spacing={1}>
              {[
                ['Pack', product.pack],
                ['Size', product.size],
                ['Item #', product.itemNumber],
                ['Unit', product.UnitOunces],
                ['Case', product.case],
                ['UPC', product.upc || '-'],
                ['Category', product.category || '-'],
                ['Subcategory', product.subCategory || '-'],
                // ['CRV', product.crv || '-'],
                // ['Retail', '-'],
              ].map(([label, value], index) => (
                <Grid size={{ xs: 6, sm: 4 }} key={index}>
                  <Field label={label as string} value={value as string} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </CommonModal>
  );
};

export default ProductDetailsModal;
