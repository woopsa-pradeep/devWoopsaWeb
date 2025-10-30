import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Paper,
  Chip
} from '@mui/material';
import img1 from '../../assets/Default-Product-Image.jpg';

interface InactiveItem {
  Description: string;
  Item_Number: number;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  Product: {
    id: number;
    Customer_Number: number;
    Item_Number: number;
    Price: string;
    Qty: number;
    TotalPrice: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface InactiveItemsTableProps {
  items: InactiveItem[];
  getProductImage: (item: InactiveItem) => string;
}

const InactiveItemsTable: React.FC<InactiveItemsTableProps> = ({
  items,
  getProductImage
}) => {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Product</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Item Number</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Quantity</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.Item_Number}
              hover
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    component="img"
                    src={getProductImage(item)}
                    alt={item.Description}
                    onError={(e) => {
                      e.currentTarget.src = img1;
                    }}
                    sx={{
                      width: 40,
                      height: 40,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                  <Box>
                    <Typography fontSize="14px" fontWeight={500}>
                      {item.Description}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="text.secondary">
                  {item.Item_Number}
                </Typography>
              </TableCell>
              {/* <TableCell>
                <Typography fontSize="14px" color="text.secondary">
                  ${parseFloat(item.Product.Price).toFixed(2)}
                </Typography>
              </TableCell> */}
              <TableCell>
                <Typography fontSize="14px" color="text.secondary">
                  {item.Product.Qty}
                </Typography>
              </TableCell>
              {/* <TableCell>
                <Typography fontSize="14px" color="text.secondary">
                  ${parseFloat(item.Product.TotalPrice).toFixed(2)}
                </Typography>
              </TableCell> */}
              <TableCell>
                <Chip
                  label="Inactive"
                  color="error"
                  size="small"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InactiveItemsTable;
