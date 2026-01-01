import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Drawer,
  useTheme,
  Skeleton,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import TextInput from '../../../component/atoms/TextInput';
import CustomButton from '../../../component/atoms/CustomButton';
import { MultiSearchableDropdown } from '../../../component/atoms/SearchableDropdown';
import toast from 'react-hot-toast';
import {
  getAllFuturePricings,
  createFuturePricing,
  updateFuturePricing,
  deleteFuturePricing,
  inventoryItemsForUpdate,
} from '../../../redux/apis/distrubutor/productApis';
import { getListForInventory } from '../../../redux/apis/distrubutor/listApis';
import { useDebounce } from '../../../hooks/useDebounce';

interface FilterOption {
  label: string;
  value: string;
}

interface Product {
  Item_Number: number;
  Description: string;
  Price1?: number;
  Price2?: number;
  Price3?: number;
  Price4?: number;
  Price5?: number;
  Price6?: number;
  Retail1?: number;
  Retail2?: number;
  Retail3?: number;
  NetCost?: number;
  BaseCost?: number;
  Invoice_Cost?: number;
}

interface FuturePricing {
  id?: string;
  itemNumber: number;
  Description?: string;
  effectiveAt: string;
  changedFields: Record<string, number>;
  isApplied: boolean;
  changedBy: string;
  changedUserId: string | null;
}

interface FuturePricingFormData {
  effectiveAt: Dayjs | null;
  Price1: string;
  Price2: string;
  Price3: string;
  Price4: string;
  Price5: string;
  Price6: string;
  Retail1: string;
  Retail2: string;
  Retail3: string;
  NetCost: string;
  BaseCost: string;
  Invoice_Cost: string;
}

const FuturePricing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [futurePricings, setFuturePricings] = useState<FuturePricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Filter states
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [localSalesCategory, setLocalSalesCategory] = useState<FilterOption[]>([]);
  const [localPriceClass, setLocalPriceClass] = useState<FilterOption[]>([]);
  const [appliedSalesCategory, setAppliedSalesCategory] = useState<FilterOption[]>([]);
  const [appliedPriceClass, setAppliedPriceClass] = useState<FilterOption[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Filter options
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<FilterOption[]>([]);
  const [priceClassOptions, setPriceClassOptions] = useState<FilterOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  
  // Form modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<FuturePricingFormData>({
    effectiveAt: null,
    Price1: '',
    Price2: '',
    Price3: '',
    Price4: '',
    Price5: '',
    Price6: '',
    Retail1: '',
    Retail2: '',
    Retail3: '',
    NetCost: '',
    BaseCost: '',
    Invoice_Cost: '',
  });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // Edit modal state
  const [editingItem, setEditingItem] = useState<FuturePricing | null>(null);
  const [editFormData, setEditFormData] = useState<FuturePricingFormData>({
    effectiveAt: null,
    Price1: '',
    Price2: '',
    Price3: '',
    Price4: '',
    Price5: '',
    Price6: '',
    Retail1: '',
    Retail2: '',
    Retail3: '',
    NetCost: '',
    BaseCost: '',
    Invoice_Cost: '',
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Helper function to normalize changedFields
  const normalizeChangedFields = (changedFields: any): Record<string, number> => {
    if (Array.isArray(changedFields) && changedFields.length > 0) {
      return changedFields.reduce((acc: Record<string, number>, obj: Record<string, number>) => {
        return { ...acc, ...obj };
      }, {});
    } else if (typeof changedFields === 'object' && changedFields !== null) {
      return changedFields as Record<string, number>;
    }
    return {};
  };

  useEffect(() => {
    fetchInventoryOptions();
    fetchFuturePricings();
  }, []);

  useEffect(() => {
    if (hasDataLoaded || appliedSalesCategory.length > 0 || appliedPriceClass.length > 0 || debouncedSearch) {
      fetchProducts();
    }
  }, [appliedSalesCategory, appliedPriceClass, debouncedSearch, hasDataLoaded]);

  useEffect(() => {
    if (filterDrawerOpen) {
      setLocalSalesCategory(appliedSalesCategory);
      setLocalPriceClass(appliedPriceClass);
    }
  }, [filterDrawerOpen, appliedSalesCategory, appliedPriceClass]);

  const fetchInventoryOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await getListForInventory() as any;
      const data = response?.data?.data || {};
      
      setSalesCategoryOptions((data.salesCategory || []).map((cat: any) => ({
        label: cat.Category_Desc,
        value: cat.Sales_Category.toString()
      })));
      
      setPriceClassOptions((data.priceClass || []).map((pc: any) => ({
        label: pc.Class_Desc || 'N/A',
        value: pc.Price_Class.toString()
      })));
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params: any = {};
      
      if (appliedSalesCategory.length > 0) {
        params.salesCategoryId = appliedSalesCategory.map(cat => cat.value);
      }
      
      if (appliedPriceClass.length > 0) {
        params.priceClassId = appliedPriceClass.map(pc => Number(pc.value));
      }
      
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      
      const res = await inventoryItemsForUpdate(params) as any;
      const items = res?.data?.data?.productList || [];
      setProducts(items);
      setHasDataLoaded(true);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error?.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [appliedSalesCategory, appliedPriceClass, debouncedSearch]);

  const fetchFuturePricings = async () => {
    setLoading(true);
    try {
      const response = await getAllFuturePricings() as any;
      const pricings = response?.data?.data?.futurePricings || [];
      const normalizedPricings = pricings.map((pricing: any) => {
        return {
          ...pricing,
          changedFields: normalizeChangedFields(pricing.changedFields),
        };
      });
      setFuturePricings(normalizedPricings);
    } catch (error) {
      console.error('Error fetching future pricings:', error);
      toast.error('Failed to load future pricings');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedSalesCategory(localSalesCategory);
    setAppliedPriceClass(localPriceClass);
    setFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setLocalSalesCategory([]);
    setLocalPriceClass([]);
    setAppliedSalesCategory([]);
    setAppliedPriceClass([]);
    setSearch('');
    setHasDataLoaded(false);
    setProducts([]);
  };

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(products.length / pageSize), [products.length, pageSize]);
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize]);
  const paginatedData = useMemo(() => {
    return products.slice(startIndex, endIndex);
  }, [products, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = new Set(paginatedData.map(item => item.Item_Number));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (itemNumber: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(itemNumber)) {
      newSelected.delete(itemNumber);
    } else {
      newSelected.add(itemNumber);
    }
    setSelectedRows(newSelected);
  };

  const handleFormChange = (field: keyof FuturePricingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditFormChange = (field: keyof FuturePricingFormData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBulkSave = async () => {
    if (!formData.effectiveAt) {
      toast.error('Please select an effective date');
      return;
    }

    const allPriceFields = ['Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6', 'Retail1', 'Retail2', 'Retail3', 'NetCost', 'BaseCost', 'Invoice_Cost'];
    const hasPrice = allPriceFields.some(
      price => formData[price as keyof FuturePricingFormData] && formData[price as keyof FuturePricingFormData] !== ''
    );

    if (!hasPrice) {
      toast.error('Please enter at least one price');
      return;
    }

    if (selectedRows.size === 0) {
      toast.error('Please select at least one product');
      return;
    }

    setSaving(true);
    try {
      const effectiveAtStr = formData.effectiveAt.format('YYYY-MM-DD');
      const changedFields: Record<string, number> = {};

      ['Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6', 'Retail1', 'Retail2', 'Retail3', 'NetCost', 'BaseCost', 'Invoice_Cost'].forEach(price => {
        const value = formData[price as keyof FuturePricingFormData];
        if (value && typeof value === 'string' && value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            changedFields[price] = numValue;
          }
        }
      });

      if (Object.keys(changedFields).length === 0) {
        toast.error('Please enter at least one valid price');
        setSaving(false);
        return;
      }

      const futurePricings = Array.from(selectedRows).map(itemNumber => {
        return {
          itemNumber: itemNumber,
          effectiveAt: effectiveAtStr,
          changedFields: [changedFields],
          isApplied: false,
          changedBy: 'admin',
          changedUserId: null,
        };
      });

      await createFuturePricing({ futurePricings });
      toast.success('Future pricing created successfully');
      setFormData({
        effectiveAt: null,
        Price1: '',
        Price2: '',
        Price3: '',
        Price4: '',
        Price5: '',
        Price6: '',
        Retail1: '',
        Retail2: '',
        Retail3: '',
        NetCost: '',
        BaseCost: '',
        Invoice_Cost: '',
      });
      setSelectedRows(new Set());
      setFormModalOpen(false);
      fetchFuturePricings();
    } catch (error: any) {
      console.error('Error creating future pricing:', error);
      toast.error(error?.response?.data?.message || 'Failed to create future pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: FuturePricing) => {
    setEditingItem(item);
    const changedFields = normalizeChangedFields(item.changedFields);
    
    setEditFormData({
      effectiveAt: item.effectiveAt ? dayjs(item.effectiveAt) : null,
      Price1: changedFields?.Price1?.toString() || '',
      Price2: changedFields?.Price2?.toString() || '',
      Price3: changedFields?.Price3?.toString() || '',
      Price4: changedFields?.Price4?.toString() || '',
      Price5: changedFields?.Price5?.toString() || '',
      Price6: changedFields?.Price6?.toString() || '',
      Retail1: changedFields?.Retail1?.toString() || '',
      Retail2: changedFields?.Retail2?.toString() || '',
      Retail3: changedFields?.Retail3?.toString() || '',
      NetCost: changedFields?.NetCost?.toString() || '',
      BaseCost: changedFields?.BaseCost?.toString() || '',
      Invoice_Cost: changedFields?.Invoice_Cost?.toString() || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem?.id) return;
    if (!editFormData.effectiveAt) {
      toast.error('Please select an effective date');
      return;
    }

    const changedFields: Record<string, number> = {};
    ['Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6', 'Retail1', 'Retail2', 'Retail3', 'NetCost', 'BaseCost', 'Invoice_Cost'].forEach(price => {
      const value = editFormData[price as keyof FuturePricingFormData];
      if (value && typeof value === 'string' && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          changedFields[price] = numValue;
        }
      }
    });

    if (Object.keys(changedFields).length === 0) {
      toast.error('Please enter at least one valid price');
      return;
    }

    setSaving(true);
    try {
      await updateFuturePricing(editingItem.id, {
        itemNumber: editingItem.itemNumber,
        effectiveAt: editFormData.effectiveAt.format('YYYY-MM-DD'),
        changedFields: [changedFields],
        isApplied: false,
        changedBy: 'admin',
        changedUserId: null,
      });
      toast.success('Future pricing updated successfully');
      setEditModalOpen(false);
      setEditingItem(null);
      fetchFuturePricings();
    } catch (error: any) {
      console.error('Error updating future pricing:', error);
      toast.error(error?.response?.data?.message || 'Failed to update future pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setSaving(true);
    try {
      await deleteFuturePricing(itemToDelete);
      toast.success('Future pricing deleted successfully');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchFuturePricings();
    } catch (error: any) {
      console.error('Error deleting future pricing:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete future pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, pt: { xs: 1, md: 1 } }}>
      {/* Header with Back Button, Search, and Filter Button */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton 
            onClick={() => navigate('/admin/products')}
            sx={{ p: 0.5 }}
          >
            <ArrowBackIcon sx={{color: 'primary.main', fontSize: 20}}/>
          </IconButton>
          <Typography fontSize={16} fontWeight={500} color="primary.main">
            Future Pricing
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, maxWidth: 400, ml: 'auto' }}>
          <TextField
            size="small"
            value={search}
            fullWidth
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
            sx={{ 
              fontSize: "14px",
              '& .MuiInputBase-root': {
                height: '36px',
              }
            }}
          />
          <CustomButton
            onClick={() => setFilterDrawerOpen(true)}
            icon={<FilterListIcon sx={{ fontSize: 18 }} />}
            iconPosition="left"
            appearance="outlined"
            fullWidth={false}
            size="small"
            sx={{ mt: 0, minWidth: 'auto' }}
          >
            Filters
          </CustomButton>
          <CustomButton
            onClick={() => {
              if (selectedRows.size === 0) {
                toast.error('Please select at least one product');
                return;
              }
              setFormModalOpen(true);
            }}
            icon={<AddIcon sx={{ fontSize: 18 }} />}
            iconPosition="left"
            appearance="filled"
            // fullWidth={false}
            size="small"
            sx={{ mt: 0, minWidth: 'auto' }}
          >
            Add Pricing
          </CustomButton>
        </Box>
      </Box>

      {/* Main Content: Products Table + Future Pricings Table */}
      <Grid container spacing={2}>
        {/* Products Table Section - 8 columns */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper 
            sx={{ 
              boxShadow: 'none', 
              borderRadius: '0px', 
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              height: 'calc(100vh - 240px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {!hasDataLoaded ? (
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography fontSize={14} color="text.secondary" mb={2}>
                  No data loaded. Please apply filters to load inventory items.
                </Typography>
                <CustomButton
                  onClick={() => setFilterDrawerOpen(true)}
                  appearance="filled"
                  fullWidth={false}
                  size="small"
                  sx={{ mt: 0 }}
                >
                  Open Filters
                </CustomButton>
              </Box>
            ) : (
              <>
                <TableContainer 
                  sx={{ 
                    flex: 1,
                    overflow: 'auto',
                    '& .MuiTableCell-root': {
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRight: `1px solid ${theme.palette.divider}`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.grey[800] 
                        : theme.palette.grey[100],
                      fontWeight: 500,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      color: theme.palette.text.primary,
                    }
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          padding="checkbox" 
                          sx={{ 
                            minWidth: 50, 
                            fontSize: '11px', 
                            fontWeight: 500,
                            position: 'sticky',
                            left: 0,
                            zIndex: 11,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? theme.palette.grey[800] 
                              : theme.palette.grey[100],
                          }}
                        >
                          <Checkbox
                            indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                            checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                            onChange={handleSelectAll}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '11px', fontWeight: 500 }}>Item Number</TableCell>
                        <TableCell sx={{ minWidth: 200, fontSize: '11px', fontWeight: 500 }}>Description</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Price 1</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Price 2</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Price 3</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Price 4</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Price 5</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Price 6</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Retail 1</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Retail 2</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Retail 3</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Net Cost</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Base Cost</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80, fontSize: '11px', fontWeight: 500 }}>Invoice Cost</TableCell>
                        <TableCell 
                          sx={{ 
                            minWidth: 80, 
                            fontSize: '11px', 
                            fontWeight: 500,
                            position: 'sticky',
                            right: 0,
                            zIndex: 11,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? theme.palette.grey[800] 
                              : theme.palette.grey[100],
                          }}
                        >
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingProducts ? (
                        Array.from({ length: 5 }).map((_, rowIndex) => (
                          <TableRow key={`skeleton-${rowIndex}`}>
                            <TableCell 
                              padding="checkbox"
                              sx={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 10,
                                backgroundColor: theme.palette.background.paper,
                              }}
                            >
                              <Skeleton variant="rectangular" width={20} height={20} />
                            </TableCell>
                            {Array.from({ length: 14 }).map((_, colIndex) => (
                              <TableCell key={colIndex}>
                                <Skeleton variant="text" width="100%" height={20} />
                              </TableCell>
                            ))}
                            <TableCell
                              sx={{
                                position: 'sticky',
                                right: 0,
                                zIndex: 10,
                                backgroundColor: theme.palette.background.paper,
                              }}
                            >
                              <Skeleton variant="rectangular" width={40} height={20} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                            <Typography fontSize={12} color="text.secondary">
                              No data available. Please adjust your filters.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((row) => (
                          <TableRow key={row.Item_Number} hover>
                            <TableCell 
                              padding="checkbox" 
                              sx={{ 
                                fontSize: '11px', 
                                p: '4px 8px',
                                position: 'sticky',
                                left: 0,
                                zIndex: 10,
                                backgroundColor: theme.palette.background.paper,
                              }}
                            >
                              <Checkbox
                                checked={selectedRows.has(row.Item_Number)}
                                onChange={() => handleSelectRow(row.Item_Number)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '11px', p: '4px 8px' }}>{row.Item_Number}</TableCell>
                            <TableCell sx={{ fontSize: '11px', p: '4px 8px' }}>{row.Description || '-'}</TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Price1 ? `$${Number(row.Price1).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Price2 ? `$${Number(row.Price2).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Price3 ? `$${Number(row.Price3).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Price4 ? `$${Number(row.Price4).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Price5 ? `$${Number(row.Price5).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Price6 ? `$${Number(row.Price6).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Retail1 ? `$${Number(row.Retail1).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Retail2 ? `$${Number(row.Retail2).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Retail3 ? `$${Number(row.Retail3).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.NetCost ? `$${Number(row.NetCost).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.BaseCost ? `$${Number(row.BaseCost).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.Invoice_Cost ? `$${Number(row.Invoice_Cost).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontSize: '11px', 
                                p: '4px 8px',
                                position: 'sticky',
                                right: 0,
                                zIndex: 10,
                                backgroundColor: theme.palette.background.paper,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRows(new Set([row.Item_Number]));
                                  setFormModalOpen(true);
                                }}
                                sx={{ color: 'primary.main', p: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination */}
                {products.length > 0 && (
                  <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontSize={11} color="text.secondary">
                      Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of {products.length} items
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <CustomButton
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        appearance="outlined"
                        size="small"
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        <ArrowBackIcon sx={{ fontSize: 16 }} />
                      </CustomButton>
                      <Typography fontSize={11}>
                        Page {currentPage} of {totalPages}
                      </Typography>
                      <CustomButton
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        appearance="outlined"
                        size="small"
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        <ArrowForwardIcon sx={{ fontSize: 16 }} />
                      </CustomButton>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* Future Pricings Table Section - 4 columns */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper 
            sx={{ 
              boxShadow: 'none', 
              borderRadius: '0px', 
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              height: 'calc(100vh - 240px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography fontSize={14} fontWeight={500}>Existing Future Pricings</Typography>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <TableContainer 
                  sx={{ 
                    flex: 1,
                    overflow: 'auto',
                    '& .MuiTableCell-root': {
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRight: `1px solid ${theme.palette.divider}`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.grey[800] 
                        : theme.palette.grey[100],
                      fontWeight: 500,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      color: theme.palette.text.primary,
                    }
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 500 }}>Item #</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 500 }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 500 }}>Prices</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 500 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {futurePricings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <Typography fontSize={12} color="text.secondary">
                              No future pricings found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        futurePricings.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ fontSize: '11px', p: '4px 8px' }}>{row.itemNumber}</TableCell>
                            <TableCell sx={{ fontSize: '11px', p: '4px 8px' }}>
                              {row.effectiveAt ? dayjs(row.effectiveAt).format('MM/DD/YY') : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '11px', p: '4px 8px' }}>
                              <Box display="flex" flexDirection="column" gap={0.25}>
                                {row.changedFields?.Price1 && <Typography fontSize={10}>P1: ${row.changedFields.Price1.toFixed(2)}</Typography>}
                                {row.changedFields?.Price2 && <Typography fontSize={10}>P2: ${row.changedFields.Price2.toFixed(2)}</Typography>}
                                {row.changedFields?.Price3 && <Typography fontSize={10}>P3: ${row.changedFields.Price3.toFixed(2)}</Typography>}
                                {row.changedFields?.Price4 && <Typography fontSize={10}>P4: ${row.changedFields.Price4.toFixed(2)}</Typography>}
                                {row.changedFields?.Price5 && <Typography fontSize={10}>P5: ${row.changedFields.Price5.toFixed(2)}</Typography>}
                                {row.changedFields?.Price6 && <Typography fontSize={10}>P6: ${row.changedFields.Price6.toFixed(2)}</Typography>}
                                {row.changedFields?.Retail1 && <Typography fontSize={10}>R1: ${row.changedFields.Retail1.toFixed(2)}</Typography>}
                                {row.changedFields?.Retail2 && <Typography fontSize={10}>R2: ${row.changedFields.Retail2.toFixed(2)}</Typography>}
                                {row.changedFields?.Retail3 && <Typography fontSize={10}>R3: ${row.changedFields.Retail3.toFixed(2)}</Typography>}
                                {row.changedFields?.NetCost && <Typography fontSize={10}>NC: ${row.changedFields.NetCost.toFixed(2)}</Typography>}
                                {row.changedFields?.BaseCost && <Typography fontSize={10}>BC: ${row.changedFields.BaseCost.toFixed(2)}</Typography>}
                                {row.changedFields?.Invoice_Cost && <Typography fontSize={10}>IC: ${row.changedFields.Invoice_Cost.toFixed(2)}</Typography>}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: '11px', p: '4px 8px' }}>
                              <Box display="flex" gap={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(row)}
                                  sx={{ color: 'primary.main', p: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(row.id || '')}
                                  sx={{ color: 'error.main', p: 0.5 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 },
            bgcolor: 'background.paper',
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography fontSize={16} fontWeight={500} color="text.primary">
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ p: 0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MultiSearchableDropdown
              options={salesCategoryOptions}
              value={localSalesCategory}
              onChange={setLocalSalesCategory}
              loading={loadingOptions}
              placeholder="Select sales categories"
              disabled={localPriceClass.length > 0}
              sx={{ mb: 0, width: '100%', fontSize: "14px" }}
            />

            <MultiSearchableDropdown
              options={priceClassOptions}
              value={localPriceClass}
              onChange={setLocalPriceClass}
              loading={loadingOptions}
              placeholder="Select sub category"
              disabled={localSalesCategory.length > 0}
              sx={{ mb: 0, width: '100%', fontSize: "14px" }}
            />
          </Box>

          <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box display="flex" gap={2}>
              <CustomButton
                onClick={handleResetFilters}
                appearance="outlined"
                fullWidth
                sx={{ fontSize: '14px', py: 1, mt: 0 }}
              >
                Reset
              </CustomButton>
              <CustomButton
                onClick={handleApplyFilters}
                appearance="filled"
                fullWidth
                loading={loadingProducts}
                sx={{ fontSize: '14px', py: 1, mt: 0 }}
              >
                Apply
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Add Future Pricing Modal */}
      <Dialog open={formModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 500 }}>Add Future Pricing</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <CustomDatePicker
                label="Effective Date"
                value={formData.effectiveAt}
                onChange={(date) => handleFormChange('effectiveAt', date)}
                disablePast={true}
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 1"
                type="number"
                value={formData.Price1}
                onChange={(e) => handleFormChange('Price1', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 2"
                type="number"
                value={formData.Price2}
                onChange={(e) => handleFormChange('Price2', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 3"
                type="number"
                value={formData.Price3}
                onChange={(e) => handleFormChange('Price3', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 4"
                type="number"
                value={formData.Price4}
                onChange={(e) => handleFormChange('Price4', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 5"
                type="number"
                value={formData.Price5}
                onChange={(e) => handleFormChange('Price5', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 6"
                type="number"
                value={formData.Price6}
                onChange={(e) => handleFormChange('Price6', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Retail 1"
                type="number"
                value={formData.Retail1}
                onChange={(e) => handleFormChange('Retail1', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Retail 2"
                type="number"
                value={formData.Retail2}
                onChange={(e) => handleFormChange('Retail2', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Retail 3"
                type="number"
                value={formData.Retail3}
                onChange={(e) => handleFormChange('Retail3', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Net Cost"
                type="number"
                value={formData.NetCost}
                onChange={(e) => handleFormChange('NetCost', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Base Cost"
                type="number"
                value={formData.BaseCost}
                onChange={(e) => handleFormChange('BaseCost', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Invoice Cost"
                type="number"
                value={formData.Invoice_Cost}
                onChange={(e) => handleFormChange('Invoice_Cost', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography fontSize={12} color="text.secondary">
                Selected: {selectedRows.size} product(s)
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => setFormModalOpen(false)}
            appearance="outlined"
            disabled={saving}
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleBulkSave}
            loading={saving}
            disabled={saving}
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Save
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 500 }}>Edit Future Pricing</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <CustomDatePicker
                label="Effective Date"
                value={editFormData.effectiveAt}
                onChange={(date) => handleEditFormChange('effectiveAt', date)}
                disablePast={true}
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 1"
                type="number"
                value={editFormData.Price1}
                onChange={(e) => handleEditFormChange('Price1', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 2"
                type="number"
                value={editFormData.Price2}
                onChange={(e) => handleEditFormChange('Price2', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 3"
                type="number"
                value={editFormData.Price3}
                onChange={(e) => handleEditFormChange('Price3', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 4"
                type="number"
                value={editFormData.Price4}
                onChange={(e) => handleEditFormChange('Price4', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 5"
                type="number"
                value={editFormData.Price5}
                onChange={(e) => handleEditFormChange('Price5', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Price 6"
                type="number"
                value={editFormData.Price6}
                onChange={(e) => handleEditFormChange('Price6', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Retail 1"
                type="number"
                value={editFormData.Retail1}
                onChange={(e) => handleEditFormChange('Retail1', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Retail 2"
                type="number"
                value={editFormData.Retail2}
                onChange={(e) => handleEditFormChange('Retail2', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Retail 3"
                type="number"
                value={editFormData.Retail3}
                onChange={(e) => handleEditFormChange('Retail3', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Net Cost"
                type="number"
                value={editFormData.NetCost}
                onChange={(e) => handleEditFormChange('NetCost', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Base Cost"
                type="number"
                value={editFormData.BaseCost}
                onChange={(e) => handleEditFormChange('BaseCost', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextInput
                label="Invoice Cost"
                type="number"
                value={editFormData.Invoice_Cost}
                onChange={(e) => handleEditFormChange('Invoice_Cost', e.target.value)}
                fullWidth
                sx={{ mb: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => setEditModalOpen(false)}
            appearance="outlined"
            disabled={saving}
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleUpdate}
            loading={saving}
            disabled={saving}
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Update
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 500 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography fontSize={14}>Are you sure you want to delete this future pricing?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <CustomButton
            onClick={() => setDeleteConfirmOpen(false)}
            appearance="outlined"
            disabled={saving}
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleDeleteConfirm}
            loading={saving}
            disabled={saving}
            fullWidth={false}
            sx={{ mt: 0 }}
          >
            Delete
          </CustomButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FuturePricing;
