import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Grid,
  } from '@mui/material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import { useDebounce } from '../../../hooks/useDebounce';
import { createProductLimit, productList, updateProductImageByImageId, updateProductLimit, uploadProductImage} from '../../../redux/apis/distrubutor/productApis';
import TextInput from '../../../component/atoms/TextInput';
import { MultiSearchableDropdown } from '../../../component/atoms/SearchableDropdown';
import img from '../../../assets/Default-Product-Image.jpg';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import { FormControlLabel } from '@mui/material';
import { CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { getSalesCategoryList, getPriceClassList } from '../../../redux/apis/distrubutor/listApis';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import EditIcon from '@mui/icons-material/Edit';
import SwitchInput from '../../../component/atoms/SwitchInput';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DistrubutorProductDetailModal from '../../../component/molecules/DistrubutorProductDetailModal';
import SettingsIcon from '@mui/icons-material/Settings';

interface Product {
  id: string;
  Item_Number: string;
  Item_Image: string;
  Item_Name: string;
  Description: string;
  Pack: string;
  CaseCount: string;
  UOM: string;
  UnitOunces: string;
  Price1: number;
  Price2: number;
  BaseCost: number;
  Invoice_Cost: number;
  orderQty: number;
  shippedQty: number;
  qtyShipped: number;
  qtyOrder: number;
  AvgCost: number;
  priceWithoutTax: number;
  taxAmount: number;
  totalPrice: number;
  extendedPrice: number;
  salesTaxApplies: boolean;
  showDistributorImage: boolean;
  distributorImage: string;
  masterImage: string;
  imageId: any;
  PriceClass: string;
  SalesCategory: string;
  QtyLimit?: { id: string; QtyLimit: number };
  UPCList?: Array<{ UPC_Number: string }>;
}

interface FilterOption {
  label: string;
  value: string;
}

// Add interface for Limit modal data
interface LimitModalData {
  id?: string;
  Item_Number: string;
  QtyLimit: number;
}

const Product = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [salesCategory, setSalesCategory] = useState<FilterOption[]>([]);
  const [priceClass, setPriceClass] = useState<FilterOption[]>([]);
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<FilterOption[]>([]);
  const [priceClassOptions, setPriceClassOptions] = useState<FilterOption[]>([]);
  const [loadingSalesCategory, setLoadingSalesCategory] = useState(false);
  const [loadingPriceClass, setLoadingPriceClass] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showDistributorImage, setShowDistributorImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  // Add new state for Limit modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalData, setLimitModalData] = useState<LimitModalData>({
    Item_Number: '',
    QtyLimit: 0
  });
  const [savingLimit, setSavingLimit] = useState(false);

  useEffect(() => {
    fetchSalesCategories();
    fetchPriceClasses();
  }, []);

  const fetchSalesCategories = async () => {
    setLoadingSalesCategory(true);
    try {
      const response = await getSalesCategoryList() as any;
      const categories = response?.data?.data || [];
      setSalesCategoryOptions(categories?.map((cat: any) => {
        return {
          label: cat.Category_Desc,
          value: cat.Sales_Category
        }
      }));
    } catch (error) {
      console.error('Error fetching sales categories:', error);
      toast.error('Failed to load sales categories');
    } finally {
      setLoadingSalesCategory(false);
    }
  };

  const fetchPriceClasses = async () => {
    setLoadingPriceClass(true);
    try {
      const response = await getPriceClassList() as any;
      const priceClasses = response?.data?.data || [];
      setPriceClassOptions(priceClasses?.map((pc: any) => {
        return {
          label: pc.Class_Desc,
          value: pc.Price_Class
        }
      }));
    } catch (error) {
      console.error('Error fetching price classes:', error);
      toast.error('Failed to load price classes');
    } finally {
      setLoadingPriceClass(false);
    }
  };

  // Reset data and page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, salesCategory, priceClass]);

  useEffect(() => {
    let ignore = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          search: debouncedSearch,
          page: currentPage,
          limit: pageSize,
          salesCategoryId: salesCategory.map(cat => Number(cat.value)),
          priceClassId: priceClass.map(pc => Number(pc.value)),
        };
        const res = await productList(params) as any;
        // Adjust this line based on your API response structure
        const list = res?.data?.data?.finalProductList || [];
        const total = res?.data?.data?.totalCount || 0;
        
        if (!ignore) {
          setData(list);
          setTotalItems(total);
          setTotalPages(Math.ceil(total / pageSize));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchProducts();
    return () => { ignore = true; };
  }, [currentPage, pageSize, debouncedSearch, salesCategory, priceClass]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleUpload = async () => {
    if (!selectedProduct) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('image', file);
      }
      formData.append('product_number', selectedProduct.Item_Number);
      formData.append('isAllow', String(showDistributorImage));
      const res = selectedProduct?.imageId ? await updateProductImageByImageId(selectedProduct.imageId, formData) as any : await uploadProductImage(formData) as any;
      if(res?.data?.success) {
      toast.success(res?.data?.data?.message || 'Image uploaded successfully!');
      setModalOpen(false);
      refreshProducts(currentPage);
      }
    } catch (err) {
      console.log(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const refreshProducts = async (pageToUse?: number) => {
    setLoading(true);
    try {
      const page = pageToUse !== undefined ? pageToUse : currentPage;
      const params = {
        search: debouncedSearch,
        page: page,
        limit: pageSize,
        salesCategoryId: salesCategory.map(cat => Number(cat.value)),
        priceClassId: priceClass.map(pc => Number(pc.value)),
      };
      const res = await productList(params) as any;
      const list = res?.data?.data?.finalProductList || [];
      const total = res?.data?.data?.totalCount || 0;
      setData(list);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / pageSize));
      if (pageToUse !== undefined) {
        setCurrentPage(page);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle Limit modal open
  const handleLimitClick = (product: Product) => {
    if (product.QtyLimit && typeof product.QtyLimit === 'object') {
      setLimitModalData({
        id: product.QtyLimit.id,
        Item_Number: product.Item_Number,
        QtyLimit: product.QtyLimit.QtyLimit
      });
    } else {
      setLimitModalData({
        Item_Number: product.Item_Number,
        QtyLimit: 0
      });
    }
    setLimitModalOpen(true);
  };

  // Add function to handle Limit save
  const handleLimitSave = async (id?: string) => {
    setSavingLimit(true);
    try {
      if(id) {
        await updateProductLimit(id, limitModalData);
      } else {
        await createProductLimit(limitModalData);
      }
      // Add your API call here to save the limit data
      
      toast.success('Product limit updated successfully!');
      setLimitModalOpen(false);
      refreshProducts(currentPage); // Refresh the product list
    } catch (error) {
      console.error('Failed to update product limit:', error);
      toast.error('Failed to update product limit');
    } finally {
      setSavingLimit(false);
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      id: 'Item_Number',
      label: 'Product ID',
      minWidth: 120,
      render: (row: Product) => (
        <Typography fontSize="14px" fontWeight={500} color="primary.main">
          {row.Item_Number || "-"}
        </Typography>
      ),
    },
    { 
      id: 'products', 
      label: 'Products',
      minWidth: 150,
      render: (row) => (
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedProduct(row);
            setShowDistributorImage(!!row.showDistributorImage);
            setModalOpen(true); 
            setFile(null);
          }}
        >
          <img 
            src={row.showDistributorImage ? row.distributorImage : (row.masterImage || row.Item_Image || img)} 
            alt={row.Item_Name} 
            onError={(e) => {
              e.currentTarget.src = img;
            }}
            style={{ width: 40, height: 40, objectFit: 'contain' }} 
          />
          <Box>
          <Typography
                  fontSize={"13px"}
                  fontWeight={400}
                  sx={{
                    maxWidth: '90%',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'normal', // Allow multiline
                    wordBreak: 'break-word', // Allow breaks anywhere if needed
                    lineHeight: 1.3,
                  }}
                >
                  {row.Description}
                </Typography>
            {/* <Typography fontSize={14} fontWeight={400} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" maxWidth="150px">{row.Description}</Typography> */}
            <Box>
              <Typography fontSize={12} color="text.secondary">
                {row.UOM && `Size: ${row.UOM}`} {" "} {row.UnitOunces && `Unit: ${row.UnitOunces}`} {" "}
                {row.Pack && `Pack: ${row.Pack}`}{" "} {row.CaseCount && `Case: ${row.CaseCount}`}
              </Typography>
                {/* <Typography fontSize={12} color="text.secondary">
                </Typography> */}
            </Box>
          </Box>
        </Box>
      )
    },
    {
      id: 'Price1',
      label: 'Price1',
      minWidth: 100,
      align: 'right',
      render: (row: Product) => (
        <Typography fontSize="14px" fontWeight={400} color="text.secondary">
          ${Number(row.Price1 || "0").toFixed(2)}
        </Typography>
      ),
    },
    // {
    //   id: 'Price2',
    //   label: 'Price2',
    //   minWidth: 100,
    //   align: 'center',
    //   render: (row: Product) => (
    //     <Typography fontSize="14px" fontWeight={400} color="primary.main">
    //       ${row.Price2 || "0"}
    //     </Typography>
    //   ),
    // },
    {
      id: 'BaseCost',
      label: 'Base Cost',
      minWidth: 100,
      align: 'right',
      render: (row: Product) => (
        <Typography fontSize="14px" fontWeight={400} color="text.secondary">
          ${Number(row.BaseCost || "0").toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'Invoice_Cost',
      label: 'Invoice Cost',
      minWidth: 100,
      align: 'right',
      render: (row: Product) => (
          <Typography fontSize="14px" fontWeight={400} color="text.secondary">
            ${Number(row.Invoice_Cost || "0").toFixed(2)}
          </Typography>
          
      ),
    },
    {
      id: 'AvgCost',
      label: 'Average Cost',
      minWidth: 140,
      align: 'right',
      render: (row: Product) => (
        <Typography fontSize="14px" fontWeight={400} color="text.secondary">
          ${Number(row.AvgCost || "0").toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'SalesCategory',
      label: 'Sales Category',
      minWidth: 140,
      render: (row: Product) => (
        <Typography fontSize="14px" fontWeight={400} color="text.secondary">
          {row.SalesCategory || "-"}  
        </Typography>
      ),
    },
    {
      id: 'PriceClass',
      label: 'Sub Category', 
      minWidth: 140,
      render: (row: Product) => (
        <Typography fontSize="14px" fontWeight={400} color="text.secondary">
          {row.PriceClass || "-"}
        </Typography>
      ),
    },
    // {
    //   id: 'qtyOrder',
    //   label: 'Order QTY',
    //   minWidth: 120,
    //   align: 'right',
    //   render: (row: Product) => (
    //     <Typography fontSize="14px" color="text.secondary">
    //       {row.qtyOrder || '-'}
    //     </Typography>
    //   ),
    // },
    // {
    //   id: 'shippedQty',
    //   label: 'Shipped QTY',
    //   minWidth: 120,
    //   align: 'right',
    //   render: (row: Product) => (
    //     <Typography fontSize="14px" fontWeight={500} color="primary.main">
    //       {row.shippedQty || '-'}
    //     </Typography>
    //   ),
    // },
    {
      id: 'Action',
      label: 'Action',
      minWidth: 120,
      render: (row: any) => {
        return (
          <Box display="flex" gap={1}>
            <VisibilityOutlinedIcon 
              sx={{ fontSize: 20, color: 'primary.main', cursor: 'pointer' }} 
              onClick={() => {
                setDetailProductId(row.Item_Number);
                setDetailModalOpen(true);
              }}
            />
            <Tooltip title="Set Product Limit">
              <SettingsIcon 
                sx={{ fontSize: 20, color: 'secondary.main', cursor: 'pointer' }} 
                onClick={() => handleLimitClick(row)}
              />
            </Tooltip>
          </Box>
        )
      }
    },
  ];
  
  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography fontSize={18} fontWeight={400} color="text.primary">Products Management</Typography>
      </Box>
      <Paper sx={{ boxShadow: 'none', borderRadius: '0px' }}>
      <Box px={2} pt={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4}}>
            <TextInput
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ fontSize: "14px", mb: 0, width: '100%' }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4}}>
            <MultiSearchableDropdown
              options={salesCategoryOptions}
              value={salesCategory}
              onChange={(options) => { setSalesCategory(options) } }
              loading={loadingSalesCategory}
              placeholder="Select sales categories"
              sx={{ mb: 0, width: '100%', fontSize: "14px" }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4}}>
            <MultiSearchableDropdown
              options={priceClassOptions}
              value={priceClass}
              onChange={(options) => setPriceClass(options)}
              loading={loadingPriceClass}
              placeholder="Select sub category"
              sx={{ mb: 0, width: '100%', fontSize: "14px" }}
            />
          </Grid>
        </Grid>
      </Box>
      <CommonTable
        data={data}
        columns={columns}
        // Pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Optional pagination customization
        pageSizeOptions={[10, 25, 50, 100]}
        showPageSizeSelector={true}
        showTotalItems={true}
        showPageNumbers={true}
        maxPageNumbers={5}
        // Other props
        loading={loading}
        containerHeight="calc(100vh - 362px)"
        stickyHeader={true}
      />
      {/* <PaginationExample /> */}
      </Paper>
      <CommonModal open={modalOpen} onClose={() => setModalOpen(false)} title="Product Details" size="lg">
        {selectedProduct && (
          <Box>
            <Grid container spacing={3}>
              {/* Product Details Section */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 1, borderRadius: 1, boxShadow: 'none' }}>
                  <Typography fontSize={16} fontWeight={500} mb={2}>Product Information</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                      <Typography fontSize={12} fontWeight={400} color="text.secondary">Description</Typography>
                      <Typography fontSize={13} fontWeight={400} color="text.primary">{selectedProduct.Description}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                      <Typography fontSize={12} fontWeight={400} color="text.secondary">Item Number</Typography>
                      <Typography fontSize={13} fontWeight={400} color="text.primary">{selectedProduct.Item_Number}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                      <Typography fontSize={12} fontWeight={400} color="text.secondary">UPC Number</Typography>
                      <Typography fontSize={13} fontWeight={400} color="text.primary">{selectedProduct.UPCList?.[0]?.UPC_Number || 'N/A'}</Typography>
                    </Grid>
                    {/* <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">Pack Size</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.primary">{selectedProduct.Pack || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">Case Count</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.primary">{selectedProduct.CaseCount || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                      <Typography fontSize={14} fontWeight={400} color="text.secondary">Size (UOM)</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.primary">{selectedProduct.UOM || 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg:4 }}>
                        <Typography fontSize={14} fontWeight={400} color="text.secondary">Unit</Typography>
                      <Typography fontSize={14} fontWeight={400} color="text.primary">{selectedProduct.UnitOunces || 'N/A'}</Typography>
                    </Grid> */}
                  </Grid>
                </Paper>
              </Grid>
              {/* Images Section */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 1, borderRadius: 1, boxShadow: 'none' }}>
                  <Box display="flex" gap={4} flexWrap="wrap">
                    <Box position="relative">
                      <Typography fontSize={14} fontWeight={500} mb={1}>Distributor Image</Typography>
                      <Box
                        sx={{
                          width: 200, 
                          height: 200, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            '& .edit-overlay': { opacity: 1 }
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (file) setFile(file);
                          };
                          input.click();
                        }}
                      >
                        {file || selectedProduct.distributorImage ? (
                          <>
                            <img
                              src={file ? URL.createObjectURL(file) : selectedProduct.distributorImage}
                              alt="Distributor"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <Box
                              className="edit-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                bgcolor: 'rgba(0,0,0,0.4)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <Tooltip title="Edit Image">
                                <EditIcon sx={{ fontSize: 32 }} />
                              </Tooltip>
                            </Box>
                          </>
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.secondary'
                            }}
                          >
                            <AddPhotoAlternateIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body2">Click to upload</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography fontSize={14} fontWeight={500} mb={1}>Master Image</Typography>
                      <Box
                        sx={{
                          width: 200,
                          height: 200,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={selectedProduct.masterImage || selectedProduct.Item_Image || img}
                          onError={(e) => {
                            e.currentTarget.src = img;
                          }}
                          alt="Master"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2} mt={3} ml={2}>
                    <FormControlLabel
                      control={
                        <SwitchInput
                          checked={showDistributorImage}
                          onChange={(checked: any) => setShowDistributorImage(checked)}
                          sx={{ mb: 0 }}
                          label="Show Distributor Image"
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" ml={1}>
                          <Chip
                            label={showDistributorImage ? "Distributor" : "Master"}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </Box>
                </Paper>
              </Grid>

              
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
              <CustomButton appearance="outlined" onClick={() => setModalOpen(false)} fullWidth={false}>
                Cancel
              </CustomButton>
              <CustomButton 
                onClick={handleUpload}
                disabled={uploading}
                icon={uploading ? <CircularProgress size={20} /> : null}
                fullWidth={false}
               >
                {uploading ? 'Uploading...' : 'Save Changes'}
              </CustomButton>
            </Box>
          </Box>
        )}
      </CommonModal>
      {/* Add Limit Modal */}
      <CommonModal 
        open={limitModalOpen} 
        onClose={() => setLimitModalOpen(false)} 
        title="Set Product Limit" 
        size="sm"
      >
        <Box>
          <Grid container>
            {/* Item Number (Read-only) */}
            <Grid size={{ xs: 12 }}>
              <TextInput
                label="Item Number"
                value={limitModalData.Item_Number}
                disabled
                fullWidth
              />
            </Grid>
            
            {/* Limit Input */}
            <Grid size={{ xs: 12 }}>
              <TextInput
                label="Limit"
                type="number"
                value={limitModalData.QtyLimit}
                onChange={(e) => setLimitModalData(prev => ({
                  ...prev,
                  QtyLimit: Number(e.target.value) || 0
                }))}
                fullWidth
                inputProps={{ 
                  min: 0,
                  step: 1
                }}
              />
            </Grid>
            
            {/* Use Default Switch */}
            {/* <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14 }}>Use Default</Typography>
                <SwitchInput
                  checked={limitModalData.useDefault}
                  onChange={(checked) => setLimitModalData(prev => ({
                    ...prev,
                    useDefault: checked
                  }))}
                  sx={{ mb: 0 }}
                  isShowLabel={false}
                />
              </Box>
            </Grid> */}
          </Grid>

          {/* Action Buttons */}
          <Box display="flex" justifyContent="flex-end" mt={0} gap={2}>
            <CustomButton 
              appearance="outlined" 
              onClick={() => setLimitModalOpen(false)} 
              fullWidth={false}
            >
              Cancel
            </CustomButton>
            <CustomButton 
              onClick={() => handleLimitSave(limitModalData.id)}
              disabled={savingLimit}
              icon={savingLimit ? <CircularProgress size={20} /> : null}
              fullWidth={false}
            >
              {savingLimit ? 'Saving...' : 'Save'}
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
      <DistrubutorProductDetailModal 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        productId={detailProductId || ''} 
      />
    </Box>
  );
};

export default Product;
