import React from 'react';
import { Box, Typography } from '@mui/material';

// Import all product images
import product1 from '../../assets/product1.png';
import product2 from '../../assets/product2.png';
import product3 from '../../assets/product3.png';
import product4 from '../../assets/product4.png';
import product5 from '../../assets/product5.jpg';
import product6 from '../../assets/product6.png';
import product7 from '../../assets/product7.png';

const ImageTest: React.FC = () => {
  const images = [
    { name: 'Product 1', src: product1 },
    { name: 'Product 2', src: product2 },
    { name: 'Product 3', src: product3 },
    { name: 'Product 4', src: product4 },
    { name: 'Product 5', src: product5 },
    { name: 'Product 6', src: product6 },
    { name: 'Product 7', src: product7 },
  ];

  return (
    <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Image Import Test</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {images.map((image, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <Box
              component="img"
              src={image.src}
              alt={image.name}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'contain',
                borderRadius: 1,
                border: '2px solid #ddd'
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              {image.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ImageTest;
