import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface Product {
  id: string;
  name: string;
  totalPrice: string;
  discount?: string;
  stock: string;
  size: string;
  image: string;
}

interface FrequentlyBoughtTogetherProps {
  products: Product[];
  onAddProduct: (productId: string) => void;
}

const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  products,
  onAddProduct,
}) => {
  return (
    <Paper sx={{ borderRadius: 2,  boxShadow: 'none' }}>
      <Typography fontSize={16} fontWeight={500} borderBottom={1} borderColor="divider" p={2}>
        Frequently Bought Together
      </Typography>
      <Grid container spacing={2} sx={{p: 2}}>
        {products.map((product) => (
          <Grid size={{xs: 12, sm: 6, md: 4}} key={product.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box
                component="img"
                src={product.image}
                alt={product.name}
                sx={{
                  width: 60,
                  height: 60,
                  objectFit: 'contain',
                  mr: 2,
                  borderRadius: 1,
                }}
              />
              <Box flex={1}>
                <Typography  fontWeight={500} fontSize={14}>
                  {product.name}
                </Typography>
                <Typography color="text.secondary" fontSize={12}>
                  {product.stock} • Size: {product.size}
                </Typography>
                <Typography color="primary" fontSize={12} fontWeight={500}>
                  ${product.totalPrice}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 0.5
              }}>
                <RemoveIcon 
                  sx={{ fontSize: 16, cursor: 'pointer', color: 'text.secondary' }}
                  onClick={() => onAddProduct(product.id)}
                />
                <Typography fontSize={14}>1</Typography>
                <AddIcon
                  sx={{ fontSize: 16, cursor: 'pointer', color: 'text.secondary' }}
                  onClick={() => onAddProduct(product.id)}
                />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default FrequentlyBoughtTogether; 