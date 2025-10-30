import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import CommonModal from '../atoms/CommonModal';
import img1 from '../../assets/Default-Product-Image.jpg';
import { getProductById } from '../../redux/apis/distrubutor/productApis';

interface ProductDetails {
  Item_Number: number;
  Description: string;
  Pack: number;
  UOM: string;
  BaseCost: number;
  NetCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  Price1: number;
  Price2: number;
  Price3: number;
  Price4: number;
  Price5: number;
  Price6: number;
  CaseCount: number;
  CaseWeight: number;
  Primary_Vendor: number;
  Manufacturer: number;
  I_Inactive: boolean;
  UPCList: Array<{ UPC_Number: string }>;
  Sales_Category: number;
  Price_Class: number;
  Price_Subclass: number;
  DepositAmount: number;
  MSA_Category_Code: string;
  Item_Image?: string;
  Section: string;
  Location: number;
  Vendor_ItemNumberAlpha?: string;
  PickArea: string;
  Track_ExpirationDate: boolean;
  Track_LotRef: boolean;
  ItemExpiryDate: string;
  UnitOunces: number;
  inventoryOnHand: number;
  masterImage?:string;
  // New nested objects
  SalesCategory?: {
    Category_Desc: string;
  };
  PriceClass?: {
    Class_Desc: string;
  };
  primaryVendor?: {
    V_Description: string;
  };
  manufacturerVendor?: {
    V_Description: string;
  };
}

const LabelValue = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ mb: 2 }}>
    <Typography fontSize={12} color="text.secondary" fontWeight={400} sx={{ mb: 0.5 }}>
      {label}
    </Typography>
    <Typography fontSize={13} fontWeight={500} sx={{ lineHeight: 1.4 }}>
      {value ?? '-'}
    </Typography>
  </Box>
);

const PriceRow = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
    <Typography fontSize={13} fontWeight={400} color="text.secondary">{label}</Typography>
    <Typography fontSize={13} fontWeight={500}>${value ? parseFloat(value).toFixed(2) : '0.00'}</Typography>
  </Box>
);

const DistrubutorProductDetailModal = ({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
}) => {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      setLoading(true);
      getProductById(productId)
        .then((res: any) => {
          setProduct(res?.data?.data || null);
        })
        .finally(() => setLoading(false));
    } else {
      setProduct(null);
    }
  }, [open, productId]);

  return (
    <CommonModal open={open} onClose={onClose} title="Product Details" size="xxl">
      {loading ? (
        <Box minHeight={300} display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : product ? (
        <Box sx={{ p: 3 }}>
          <Grid container spacing={4}>
            {/* Left Side – Image & Price */}
            <Grid size={{xs:12, sm:4, md:3}}> 
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Box
                  component="img"
                  src={product?.masterImage || img1}
                  onError={(e: any) => {
                    e.currentTarget.src = img1;
                  }}
                  alt={product?.Description}
                  sx={{
                    width: '100%',
                    height: 220,
                    objectFit: 'contain',
                    borderRadius: 1,
                    mb: 3,
                    border: '1px solid #f0f0f0'
                  }}
                />
                
                <Box sx={{ mb: 2 }}>
                  <Typography fontSize={14} fontWeight={600} color="text.primary" mb={2}>
                    Prices
                  </Typography>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <PriceRow
                      key={i}
                      label={`Price ${i}`}
                      value={Number((product as any)[`Price${i}`]).toFixed(2)}
                    />
                  ))}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <PriceRow label="Base Cost" value={Number(product.BaseCost).toFixed(2)} />
                  <PriceRow label="Net Cost" value={Number(product.NetCost).toFixed(2)} />
                  <PriceRow label="MFG Invoice Cost" value={Number(product.Invoice_Cost).toFixed(2)} />
                  <PriceRow label="AVG Cost" value={Number(product.AvgCost).toFixed(2)} />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <PriceRow label="Deposit Amount" value={Number(product.DepositAmount).toFixed(2)} />
              </Paper>
            </Grid>

            {/* Right Side – Detail Fields */}
            <Grid size={{xs:12, sm:8, md:9}}>
              {/* First Box - Product Header */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  px: 3, 
                  py: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 3
                }}
              >
                <Typography fontSize={16} fontWeight={500} color="text.primary" mb={0.5}>
                  {product.Description || '-'}
                </Typography>
                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                <Box sx={{display:'flex', alignItems:'center', gap:1}}>
                <Typography fontSize={13} color="text.secondary">
                  Item number
                </Typography>
                <Typography fontSize={13} color="text.secondary" fontWeight={600}>{Number(product.Item_Number)}</Typography>
                </Box>
                <Box sx={{display:'flex', alignItems:'center', gap:1}}>
                <Typography fontSize={13} color="text.secondary">QTY</Typography>
                <Typography fontSize={13} color="text.secondary" fontWeight={600}>{Number(product.inventoryOnHand) || '-'}</Typography>
                </Box>
                </Box>
                <Typography fontSize={15} fontWeight={500} color="text.primary" mb={0.5}>
                  ${Number(product.Price1).toFixed(2) || '0.00'}
                </Typography>
                <Typography
                  fontSize={13}
                  color={product.I_Inactive ? '#F34E4E' : '#1BA856'}
                  fontWeight={500}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: product.I_Inactive ? '#F34E4E' : '#1BA856',
                      mr: 1
                    }} 
                  />
                  {product.I_Inactive ? 'Out of Stock' : 'In Stock'}
                </Typography>
              </Paper>

              {/* Second Box - Product Attributes */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  px: 3, 
                  py: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Typography fontSize={14} fontWeight={600} color="text.primary" mb={2}>
                  Product Attributes
                </Typography>
                <Grid container spacing={2}>
                  {[
                    ['Size', product.UOM],
                    ['Pack', product.Pack],
                    ['Unit Ounces / ML', product.UnitOunces],
                    ['Case Count', product.CaseCount],
                    ['Case Weight', product.CaseWeight],
                    ['Primary UPC', product.UPCList?.[0]?.UPC_Number || '-'],
                    ['Case UPC', product.UPCList?.[1]?.UPC_Number || '-'],
                    ['Retail UPC', product.UPCList?.[2]?.UPC_Number || '-'],
                    ['Vendor Number', product.Primary_Vendor],
                    ['Primary Supplier', product.primaryVendor?.V_Description || '-'],
                    ['Primary Supplier Item Number', product?.Vendor_ItemNumberAlpha || '-'],
                    ['Manufacturer', product.manufacturerVendor?.V_Description || '-'],
                    ['Sales Category', product.SalesCategory?.Category_Desc || '-'],
                    ['Sub Category', product.PriceClass?.Class_Desc || '-'],
                    ['Other Tax Level', '-'],
                    ['MSA Category Codes', product.MSA_Category_Code],
                    ['Section Reference', product.Section],
                    ['Location Reference', product.Location],
                  ].map(([label, value], idx) => (
                    <Grid size={{xs:12, sm:6, md:4}} key={idx}>
                      <LabelValue label={label as string} value={value} />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box minHeight={200} display="flex" justifyContent="center" alignItems="center">
          <Typography fontSize={13}>No product data found.</Typography>
        </Box>
      )}
    </CommonModal>
  );
};

export default DistrubutorProductDetailModal;
