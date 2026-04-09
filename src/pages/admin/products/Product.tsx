import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Grid,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModulePermission } from '../../../hooks/useModulePermission';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import { useDebounce } from '../../../hooks/useDebounce';
import { createProductLimit, productList, productListWithTax, updateProductImageByImageId, updateProductLimit, uploadProductImage, getProductById, bulkUploadItemImages } from '../../../redux/apis/distrubutor/productApis';
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
import { getSalesCategoryList, getPriceClassList, getCustomerList } from '../../../redux/apis/distrubutor/listApis';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import EditIcon from '@mui/icons-material/Edit';
import SwitchInput from '../../../component/atoms/SwitchInput';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DistrubutorProductDetailModal from '../../../component/molecules/DistrubutorProductDetailModal';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import UpdateIcon from '@mui/icons-material/Update';
import EventIcon from '@mui/icons-material/Event';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
// import ViewListIcon from '@mui/icons-material/ViewList';
// import ViewModuleIcon from '@mui/icons-material/ViewModule';
// import ToggleButton from '@mui/material/ToggleButton';
// import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
import Pagination from '@mui/material/Pagination';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import AssessmentIcon from '@mui/icons-material/Assessment';
import LossQtyReportModal from '../../../component/molecules/LossQtyReportModal';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JsBarcode = require('jsbarcode');

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
  QtyLimit?: { id: string; QtyLimit: number; markAsBundle?: boolean };
  UPCList?: Array<{ UPC_Number: string }>;
  markAsBundle?: boolean;
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
  markAsBundle?: boolean;
}

const BULK_IMAGE_MAX_COUNT = 30;
const BULK_IMAGE_MAX_BYTES = 1024 * 1024;

const getBulkImageFilenameStem = (name: string) => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
};

/** Stem must be the item number only (digits), e.g. 12345.jpg */
const isValidBulkImageItemNumberName = (fileName: string) => {
  const stem = getBulkImageFilenameStem(fileName);
  return stem.length > 0 && /^\d+$/.test(stem);
};

// Barcode cache outside component to persist across renders
const barcodeCache = new Map<string, string>();

const Product = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAdd, canEdit, canView } = useModulePermission('Product');
  const isSalesMode = location.pathname.startsWith('/sales');
  const productBasePath = isSalesMode ? '/sales/product' : '/admin/product';

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
  
  // Filter states for I_Inactive and ShortOrderForm
  const [shortOrderForm, setShortOrderForm] = useState<boolean>(true);
  const [iInactive, setIInactive] = useState<boolean | null>(false);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

  
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
    QtyLimit: 0,
    markAsBundle: false
  });
  const [savingLimit, setSavingLimit] = useState(false);

  // Print Label states
  const [printLabelDrawerOpen, setPrintLabelDrawerOpen] = useState(false);
  const [printLabelForm, setPrintLabelForm] = useState({
    size: '4x6' as "4x3" | "4x6" | "3x6" | "3x2" | "4x4" | "2x2" | "2x3" | "3x3" | "5x3" | "6x4" | "A4" | "A4-1" | "A4-2" | "A4-3" | "A4-4" | "A4-30" | "A4-5160",
    orientation: 'landscape' as "landscape" | "portrait",
    salesCategory: [] as FilterOption[],
    priceClass: [] as FilterOption[],
    rows: 1 as number,
    columns: 1 as number,
  });
  const [printLabelLoading, setPrintLabelLoading] = useState(false);
  const [printLabelSelectedCustomer, setPrintLabelSelectedCustomer] = useState<string>('');
  const [printLabelCustomerOptions, setPrintLabelCustomerOptions] = useState<FilterOption[]>([]);
  const [loadingPrintLabelCustomers, setLoadingPrintLabelCustomers] = useState(false);
  const [individualPrintModalOpen, setIndividualPrintModalOpen] = useState(false);
  const [individualPrintProduct, setIndividualPrintProduct] = useState<Product | null>(null);
  const [individualPrintForm, setIndividualPrintForm] = useState({
    size: '4x6' as "4x3" | "4x6" | "3x6" | "3x2" | "4x4" | "2x2" | "2x3" | "3x3" | "5x3" | "6x4" | "A4" | "A4-1" | "A4-2" | "A4-3" | "A4-4" | "A4-30" | "A4-5160",
    orientation: 'landscape' as "landscape" | "portrait",
    rows: 1 as number,
    columns: 1 as number,
  });
  const [individualPrintLoading, setIndividualPrintLoading] = useState(false);

  // Loss Qty Report Modal state
  const [lossQtyReportModalOpen, setLossQtyReportModalOpen] = useState(false);

  // Bulk Image Modal state
  const [bulkImageModalOpen, setBulkImageModalOpen] = useState(false);
  const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);
  const [bulkImageSubmitting, setBulkImageSubmitting] = useState(false);
  const bulkImageFileInputRef = useRef<HTMLInputElement>(null);

  // Detailed view state
  // For now only table view - detailed view tab commented below
  const [viewMode] = useState<'table' | 'detailed'>('table');
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: { [section: string]: boolean } }>({});
  
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedCurrentPage, setDetailedCurrentPage] = useState(1);
  const [detailedPageSize, setDetailedPageSize] = useState(10);
  const [detailedTotalItems, setDetailedTotalItems] = useState(0);
  const [detailedTotalPages, setDetailedTotalPages] = useState(0);
  


  const defaultFilters = {
  iInactive: false,
  shortOrderForm: true,
};


  useEffect(() => {
    fetchSalesCategories();
    fetchPriceClasses();
    fetchPrintLabelCustomers();
  }, []);

  const fetchPrintLabelCustomers = async () => {
    setLoadingPrintLabelCustomers(true);
    try {
      const response = await getCustomerList() as any;
      const customerList = response?.data?.data || [];
      setPrintLabelCustomerOptions(customerList?.map((cust: { C_Number: number; C_Name: string }) => ({
        label: `${cust.C_Number} - ${cust.C_Name}`,
        value: cust.C_Number.toString()
      })) || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingPrintLabelCustomers(false);
    }
  };

  // Reset rows when column count changes for A4 layouts
  useEffect(() => {
    if (printLabelForm.size === 'A4-30' || printLabelForm.size === 'A4-5160') {
      // A4-30 and A4-5160 are fixed at 10 rows, no need to reset
      return;
    }
    if (printLabelForm.size.startsWith('A4-')) {
      const columnCount = parseInt(printLabelForm.size.split('-')[1]) || 1;
      const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
      if (printLabelForm.rows > maxRows) {
        setPrintLabelForm(prev => ({ ...prev, rows: maxRows }));
      }
    }
  }, [printLabelForm.size]);

  useEffect(() => {
    if (individualPrintForm.size === 'A4-30' || individualPrintForm.size === 'A4-5160') {
      // A4-30 and A4-5160 are fixed at 10 rows, no need to reset
      return;
    }
    if (individualPrintForm.size.startsWith('A4-')) {
      const columnCount = parseInt(individualPrintForm.size.split('-')[1]) || 1;
      const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
      if (individualPrintForm.rows > maxRows) {
        setIndividualPrintForm(prev => ({ ...prev, rows: maxRows }));
      }
    }
  }, [individualPrintForm.size]);

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
    if (viewMode === 'detailed') {
      setDetailedCurrentPage(1);
    }
  }, [debouncedSearch, salesCategory, priceClass, viewMode, iInactive, shortOrderForm]);

  useEffect(() => {
  if (viewMode === 'table') {
    let ignore = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
  search: debouncedSearch,
  page: currentPage,
  limit: pageSize,
  salesCategoryId: salesCategory.map(cat => Number(cat.value)),
  priceClassId: priceClass.map(pc => Number(pc.value)),
};
        if (isAllSelected) {
          params.all = true;
        } else {
          params.ShortOrderForm = shortOrderForm;
          params.I_Inactive = iInactive;
        }

        const res = await productList(params) as any;
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
  }
}, [currentPage, pageSize, debouncedSearch, salesCategory, priceClass, viewMode, iInactive, shortOrderForm, isAllSelected]);


  // Store detailed product data with full details
const [detailedProductsWithFullData, setDetailedProductsWithFullData] =
  useState<{ [key: string]: any }>({});

  const [loadingFullDetails, setLoadingFullDetails] = useState<{ [key: string]: boolean }>({});

  // Fetch product list with pagination and filters
  useEffect(() => {
    if (viewMode === 'detailed') {
      let ignore = false;
      const fetchDetailedProducts = async () => {
        setDetailedLoading(true);
        try {
          const params: any = {
         search: debouncedSearch || '',
         page: detailedCurrentPage,
        limit: detailedPageSize,
        salesCategoryId: salesCategory.map(cat => Number(cat.value)),
        priceClassId: priceClass.map(pc => Number(pc.value)),
        };
          if (isAllSelected) {
            params.all = true;
          } else {
            params.ShortOrderForm = shortOrderForm;
            params.I_Inactive = iInactive;
          }

          const res = await productList(params) as any;
          const list = res?.data?.data?.finalProductList || [];
          const total = res?.data?.data?.totalCount || 0;
          
          if (!ignore) {
            setDetailedData(list);
            setDetailedTotalItems(total);
            setDetailedTotalPages(Math.ceil(total / detailedPageSize));
            setDetailedProductsWithFullData([]); // Clear previous full data
          }
        } catch (error) {
          console.error('Error fetching detailed products:', error);
          toast.error('Failed to load detailed products');
          if (!ignore) {
            setDetailedData([]);
          }
        } finally {
          if (!ignore) setDetailedLoading(false);
        }
      };
      fetchDetailedProducts();
      return () => { ignore = true; };
    }
  }, [ detailedCurrentPage,detailedPageSize, debouncedSearch, salesCategory, priceClass, viewMode, iInactive, shortOrderForm, isAllSelected]);


  // Fetch full details for each product in the current page
  useEffect(() => {
  if (!detailedData.length) return;

  setExpandedSections(prev => {
    const next = { ...prev };

    detailedData.forEach(item => {
      const cardId = `card-${item.Item_Number}`;
      if (!next[cardId]) {
        next[cardId] = {
          pricing: false,
          cost: false,
          product: false,
          inventory: false,
          caseDimensions: false,
          quantity: false,
          vendor: false,
          jurisdiction: false,
          flags: false,
          additional: false,
          dates: false,
        };
      }
    });

    return next;
  });
}, [detailedData]);

useEffect(() => {
  if (viewMode !== 'detailed') return;

  Object.entries(expandedCards).forEach(([cardId, isOpen]) => {
    if (!isOpen) return;

    const itemNumber = cardId.replace('card-', '');

    if (
      detailedProductsWithFullData[itemNumber] ||
      loadingFullDetails[itemNumber]
    ) {
      return;
    }

    setLoadingFullDetails(prev => ({
      ...prev,
      [itemNumber]: true,
    }));

    getProductById(itemNumber)
      .then(res => {
        const data = res?.data?.data;
        if (data) {
          setDetailedProductsWithFullData(prev => ({
            ...prev,
            [itemNumber]: data,
          }));
        }
      })
      .finally(() => {
        setLoadingFullDetails(prev => {
          const copy = { ...prev };
          delete copy[itemNumber];
          return copy;
        });
      });
  });
}, [expandedCards, viewMode]);

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

  const handleBulkImageModalOpen = () => {
    setBulkImageFiles([]);
    setBulkImageModalOpen(true);
  };

  const validateAndMergeBulkImageFiles = (
    incoming: File[],
    existing: File[]
  ): File[] => {
    const next = [...existing];
    const existingItemNumbers = new Set(
      existing.map((file) => getBulkImageFilenameStem(file.name))
    );
    const rejected: string[] = [];

    for (const f of incoming) {
      const itemNumber = getBulkImageFilenameStem(f.name);
      if (next.length >= BULK_IMAGE_MAX_COUNT) {
        rejected.push(`${f.name}: max ${BULK_IMAGE_MAX_COUNT} images allowed`);
      } else if (f.size > BULK_IMAGE_MAX_BYTES) {
        rejected.push(`${f.name}: must be 1 MB or smaller`);
      } else if (!isValidBulkImageItemNumberName(f.name)) {
        rejected.push(`${f.name}: name must be the item number only (e.g. 12345.jpg)`);
      } else if (existingItemNumbers.has(itemNumber)) {
        rejected.push(`${f.name}: duplicate item number (${itemNumber})`);
      } else {
        next.push(f);
        existingItemNumbers.add(itemNumber);
      }
    }

    if (rejected.length) {
      toast.error(rejected.slice(0, 5).join(' · ') + (rejected.length > 5 ? ' …' : ''));
    }
    return next;
  };

  const handleBulkImageFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const incoming = Array.from(list);
    const next = validateAndMergeBulkImageFiles(incoming, bulkImageFiles);
    setBulkImageFiles(next);
    e.target.value = '';
  };

  const handleBulkImagePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      toast.error('Preview blocked by browser popup settings.');
    }
    // Revoke URL after a short delay to avoid leaking object URLs.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleBulkImageRemoveFile = (index: number) => {
    setBulkImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkImageSubmit = async () => {
    if (bulkImageFiles.length === 0) {
      toast.error('Select at least one image.');
      return;
    }
    for (const f of bulkImageFiles) {
      if (f.size > BULK_IMAGE_MAX_BYTES) {
        toast.error(`${f.name} exceeds 1 MB.`);
        return;
      }
      if (!isValidBulkImageItemNumberName(f.name)) {
        toast.error(`Invalid file name: ${f.name}. Use the item number only (e.g. 12345.jpg).`);
        return;
      }
    }
    setBulkImageSubmitting(true);
    try {
      await bulkUploadItemImages(bulkImageFiles);
      toast.success('Bulk images uploaded successfully.');
      setBulkImageModalOpen(false);
      setBulkImageFiles([]);
      refreshProducts(currentPage);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Bulk image upload failed.');
    } finally {
      setBulkImageSubmitting(false);
    }
  };

  const refreshProducts = async (pageToUse?: number) => {
    setLoading(true);
    try {
      const page = pageToUse !== undefined ? pageToUse : currentPage;
      const params: any = {
  search: debouncedSearch,
  page: page,
  limit: pageSize,
  salesCategoryId: salesCategory.map(cat => Number(cat.value)),
  priceClassId: priceClass.map(pc => Number(pc.value)),
      };
      if (isAllSelected) {
        params.all = true;
      } else {
        params.ShortOrderForm = shortOrderForm;
        params.I_Inactive = iInactive;
      }

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
        QtyLimit: product.QtyLimit.QtyLimit,
        markAsBundle: product.QtyLimit.markAsBundle ?? product.markAsBundle ?? false
      });
    } else {
      setLimitModalData({
        Item_Number: product.Item_Number,
        QtyLimit: 0,
        markAsBundle: product.markAsBundle ?? false
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

  // Generate barcode image data URL - non-blocking with cache
  const generateBarcodeImage = (upc: string): string | null => {
    try {
      if (!upc || upc === 'N/A' || upc.trim() === '') {
        return null;
      }

      // Clean UPC value
      const upcValue = upc.toString().trim().replace(/\D/g, '');
      if (upcValue.length < 8) {
        return null;
      }

      // Check cache first - instant return
      if (barcodeCache.has(upcValue)) {
        return barcodeCache.get(upcValue)!;
      }

      // Generate synchronously but with optimized settings
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 60;
      
      JsBarcode(canvas, upcValue, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: false,
        fontSize: 0,
        margin: 3,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const dataUrl = canvas.toDataURL('image/png');
      barcodeCache.set(upcValue, dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate barcode:', error);
      return null;
    }
  };

  // Generate label HTML for a product - simple and fast
  // const generateLabelHTML = (product: Product, _size: string, _orientation: string) => {
  //   // Get product image - use distributor if showDistributorImage is true, else master, else default
  //   let productImage = img;
  //   if (product.showDistributorImage && product.distributorImage) {
  //     productImage = product.distributorImage;
  //   } else if (product.masterImage) {
  //     productImage = product.masterImage;
  //   } else if (product.Item_Image) {
  //     productImage = product.Item_Image;
  //   }

  //   const upc = product.UPCList?.[0]?.UPC_Number || product.Item_Number || '';
  //   const price = product.Price1 ? Number(product.Price1).toFixed(2) : '0.00';
  //   const pack = product.Pack || 'N/A';
  //   const caseCount = product.CaseCount || 'N/A';
  //   const productName = (product.Description || product.Item_Name || 'N/A').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  //   const itemNumber = product.Item_Number || 'N/A';

  //   // Generate barcode (cached, so fast)
  //   const barcodeImage = generateBarcodeImage(upc);

  //   return `
  //     <div class="label-container">
  //       <div class="label-content">
  //         <div class="label-image-section">
  //           <img src="${productImage}" alt="${productName}" class="label-image" onerror="this.onerror=null; this.src='${img}';" />
  //         </div>
  //         <div class="label-info-section">
  //           <div class="label-description">${productName}</div>
  //           <div class="label-details-grid">
  //             <div class="label-detail-item">
  //               <span class="label-detail-value">${itemNumber}</span>
  //             </div>
  //             <div class="label-detail-item">
  //               <span class="label-detail-value">${pack} Pack</span>
  //             </div>
  //             <div class="label-detail-item">
  //               <span class="label-detail-value">${caseCount} Case</span>
  //             </div>
  //             <div class="label-detail-item price-item">
  //               <span class="label-detail-value price-value">$${price}</span>
  //             </div>
  //           </div>
  //           ${barcodeImage ? `
  //           <div class="label-barcode-section">
  //             <img src="${barcodeImage}" alt="Barcode" class="label-barcode" />
  //           </div>
  //           ` : ''}
  //         </div>
  //       </div>
  //     </div>
  //   `;
  // };

  // Generate and print labels - optimized for performance with chunking
  const generateAndPrintLabels = (products: Product[], size: string, orientation: string, rows: number = 1) => {
    // Handle A4 sizes differently
    let pageWidth, pageHeight;
    const isA4Column = size.startsWith('A4-');
    const isA430 = size === 'A4-30';
    const isA45160 = size === 'A4-5160';
    const columnCount = isA430 || isA45160 ? 3 : (isA4Column ? parseInt(size.split('-')[1]) : 1);
    
    if (size === 'A4' || isA4Column) {
      if (isA45160) {
        // Avery 5160 uses US Letter size (8.5 x 11 inches)
        pageWidth = '8.5in';
        pageHeight = '11in';
      } else {
        // Standard A4 size
        pageWidth = '8.27in';
        pageHeight = '11.69in';
      }
    } else {
      const [width, height] = size.split('x').map(Number);
      const minDim = Math.min(width, height);
      const maxDim = Math.max(width, height);
      const isLandscape = orientation === 'landscape';
      // Portrait = tall page (min × max); landscape = wide page (max × min). Fixes 4×3 where W>H in the size string.
      pageWidth = isLandscape ? `${maxDim}in` : `${minDim}in`;
      pageHeight = isLandscape ? `${minDim}in` : `${maxDim}in`;
    }

    // Calculate responsive sizes based on label dimensions, orientation, and rows
    const getSize = (base: number) => {
      if (isA4Column || isA430 || isA45160) {
        // Calculate size multiplier based on column count and rows
        // Fewer rows = larger labels (more space per label)
        if (isA430 || isA45160) {
          // A4-30 and A4-5160: 3 columns x 10 rows, very compact labels
          return `${base * 0.35}px`;
        }
        const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
        const rowMultiplier = maxRows / rows; // More rows selected = smaller multiplier
        
        if (columnCount === 4) return `${base * 0.4 * rowMultiplier}px`;
        if (columnCount === 3) return `${base * 0.5 * rowMultiplier}px`;
        if (columnCount === 2) return `${base * 0.7 * rowMultiplier}px`;
        if (columnCount === 1) return `${base * 1.2 * rowMultiplier}px`;
        return `${base * 1.5 * rowMultiplier}px`;
      }
      if (size === 'A4') return `${base * 1.5}px`;
      const [w, h] = size.split('x').map(Number);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const isLandscape = orientation === 'landscape';
      const effectiveWidth = isLandscape ? maxDim : minDim;
      const effectiveHeight = isLandscape ? minDim : maxDim;
      const area = effectiveWidth * effectiveHeight;
      
      if (area >= 24) return `${base * 1.1}px`; // 4x6, 3x6
      if (area >= 12) return `${base}px`; // 4x3
      return `${base * 0.85}px`; // smaller sizes
    };

    // Generate CSS styles once
    const styles = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page {
        size: ${pageWidth} ${pageHeight};
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        .label-container {
          page-break-after: always;
          page-break-inside: avoid;
          break-after: page;
          break-inside: avoid;
          margin: 0;
        }
        .label-container:last-child {
          page-break-after: auto;
          break-after: auto;
        }
      }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background: white;
      }
      .label-container {
        width: ${pageWidth};
        height: ${pageHeight};
        margin: 0;
        background: white;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
      }
      .label-content {
        display: flex;
        flex-direction: row;
        height: 100%;
        width: 100%;
        padding: ${size === 'A4' ? '0.1in' : '0.08in'};
        gap: ${size === 'A4' ? '0.12in' : '0.1in'};
        background: #ffffff;
      }
      .label-content.label-small {
        flex-direction: column;
        padding: ${size === 'A4' ? '0.08in' : '0.06in'};
        gap: ${size === 'A4' ? '0.06in' : '0.05in'};
      }
      .label-content.label-square {
        gap: ${size === 'A4' ? '0.1in' : '0.08in'};
      }
      .label-image-section {
        width: ${orientation === 'landscape' ? '40%' : '38%'};
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        padding: ${size === 'A4' ? '0.05in' : '0.04in'};
        flex-shrink: 0;
      }
      .label-square .label-image-section {
        width: 35%;
        height: 50%;
      }
      .label-left-section {
        width: ${orientation === 'landscape' ? '35%' : '32%'};
        display: flex;
        flex-direction: column;
        gap: ${size === 'A4' ? '0.06in' : '0.05in'};
        flex-shrink: 0;
      }
      .label-image {
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .label-info-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${size === 'A4' ? '0.08in' : '0.06in'};
        min-width: 0;
      }
      .label-small .label-info-section {
        gap: ${size === 'A4' ? '0.05in' : '0.04in'};
      }
      .label-description {
        font-size: ${getSize(20)};
        font-weight: 900;
        color: #000000;
        line-height: 1.2;
        word-wrap: break-word;
        overflow-wrap: break-word;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: ${size === 'A4' ? '0.06in' : '0.05in'};
      }
      .label-small .label-description {
        font-size: ${getSize(12)};
        margin-bottom: ${size === 'A4' ? '0.04in' : '0.03in'};
      }
      .label-details-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.28fr) 1fr;
        column-gap: ${size === 'A4' ? '0.14in' : '0.12in'};
        row-gap: ${size === 'A4' ? '0.06in' : '0.05in'};
        flex: 1;
      }
      .label-small .label-details-grid {
        grid-template-columns: 1fr;
        gap: ${size === 'A4' ? '0.03in' : '0.02in'};
      }
      .label-detail-item {
        display: flex;
        flex-direction: column;
        gap: ${size === 'A4' ? '0.02in' : '0.015in'};
        padding: ${size === 'A4' ? '0.04in' : '0.03in'};
        background: #ffffff;
      }
      .label-small .label-detail-item {
        flex-direction: row;
        justify-content: space-between;
        padding: ${size === 'A4' ? '0.02in' : '0.015in'};
        gap: ${size === 'A4' ? '0.05in' : '0.04in'};
      }
      .label-detail-item.price-item {
        grid-column: 1 / -1;
        background: #ffffff;
        justify-content: flex-start;
      }
      .label-detail-label {
        font-size: ${getSize(9)};
        font-weight: 700;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .label-detail-value {
        font-size: ${getSize(12)};
        font-weight: 700;
        color: #000000;
        word-break: break-word;
      }
      .label-detail-value.label-item-number-highlight {
        font-size: ${getSize(20)};
        font-weight: 900;
        letter-spacing: 0.5px;
        line-height: 1.1;
      }
      .label-small .label-detail-value {
        font-size: ${getSize(8)};
      }
      .label-detail-value.price-value {
        font-size: ${getSize(24)};
        color: #dc2626;
        font-weight: 900;
        letter-spacing: 0.5px;
      }
      .label-small .label-detail-value.price-value {
        font-size: ${getSize(14)};
      }
      .label-barcode-section {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        padding: ${size === 'A4' ? '0.05in' : '0.04in'};
        margin-top: auto;
      }
      .label-square .label-barcode-section {
        flex: 1;
        margin-top: 0;
      }
      .label-small .label-barcode-section {
        padding: ${size === 'A4' ? '0.03in' : '0.02in'};
      }
      .label-barcode {
        max-width: 100%;
        width: 100%;
        height: auto;
        display: block;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      /* A4 Multi-column layouts */
      .label-container-a4-multi {
        width: ${pageWidth};
        height: ${pageHeight};
        margin: 0;
        padding: ${isA45160 ? '0.5in 0.15in' : isA430 ? '0.2in 0.15in' : '0.1in'};
        display: grid;
        grid-template-columns: ${isA430 || isA45160 ? 'repeat(3, 1fr)' :
                                isA4Column && columnCount === 4 ? 'repeat(4, 1fr)' : 
                                isA4Column && columnCount === 3 ? 'repeat(3, 1fr)' : 
                                isA4Column && columnCount === 2 ? 'repeat(2, 1fr)' : 
                                isA4Column && columnCount === 1 ? '1fr' : '1fr'};
        grid-template-rows: ${isA430 || isA45160 ? 'repeat(10, 1fr)' : (isA4Column ? `repeat(${rows}, 1fr)` : '1fr')};
        grid-auto-rows: 0;
        overflow: hidden;
        ${isA45160 ? 'column-gap: 0.08in; row-gap: 0;' : isA430 ? 'column-gap: 0.05in; row-gap: 0;' : 'gap: 0.1in;'};
        page-break-after: always;
        page-break-inside: avoid;
        box-sizing: border-box;
        align-content: stretch;
      }
      .label-container-a4-multi > * {
        min-height: 0;
        overflow: hidden;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .label-item-a4-4 {
        border: 1px solid #ccc;
        padding: 0.05in;
        display: flex;
        flex-direction: column;
        gap: 0.03in;
        font-size: ${getSize(8)}px;
        height: 100%;
        justify-content: space-between;
      }
      .label-item-a4-4 .label-item-number {
        font-weight: bold;
        font-size: ${getSize(9)}px;
      }
      .label-item-a4-4 .label-item-description {
        font-size: ${getSize(7)}px;
        display: flex;
        flex-wrap: wrap;
        line-height: 1.2;
      }
      .label-item-a4-4 .label-item-details {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 0.02in;
        font-size: ${getSize(7)}px;
      }
      .label-item-a4-4 .label-item-barcode {
        max-height: 0.4in;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
      }
      .label-item-a4-30 {
        border: none;
        padding: 0.02in;
        display: flex;
        flex-direction: column;
        gap: 0.02in;
        font-size: ${getSize(6)}px;
        height: 100%;
        width: 100%;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .label-item-a4-5160 {
        border: none;
        padding: 0.02in 0.02in 0 0;
        display: flex;
        flex-direction: column;
        gap: 0;
        font-size: ${getSize(6)}px;
        height: 100%;
        width: 100%;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .label-item-a4-5160 .label-item-header {
        line-height: 1.2;
        margin-bottom: 0.02in;
      }
      .label-item-a4-5160 .label-item-number {
        font-weight: bold;
        font-size: ${getSize(5)}px;
        line-height: 1.2;
        white-space: nowrap;
        display: inline;
        margin-right: 0.03in;
      }
      .label-item-a4-5160 .label-item-description {
        font-size: ${getSize(5)}px;
        line-height: 1.2;
        word-break: break-word;
        overflow-wrap: break-word;
        display: inline;
      }
      .label-item-a4-5160 .label-item-barcode {
        width: 100%;
        max-height: 0.3in;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        margin-top: auto;
        padding-bottom: 0;
        margin-bottom: 0;
      }
      .label-item-a4-5160 .label-item-barcode img {
        max-height: 0.3in;
        width: 100%;
        height: auto;
        object-fit: contain;
        display: block;
      }
      .label-item-a4-30 .label-item-header {
        line-height: 1.2;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .label-item-a4-30 .label-item-number {
        font-weight: bold;
        font-size: ${getSize(8)}px;
        line-height: 1.2;
        white-space: nowrap;
        flex-shrink: 0;
        margin-right: 0.05in;
      }
      .label-item-a4-30 .label-item-description {
        font-size: ${getSize(6)}px;
        line-height: 1.2;
        word-break: break-word;
        overflow-wrap: break-word;
        flex: 1 1 auto;
        min-width: 0;
      }
      .label-item-a4-30 .label-item-header::after {
        content: '';
        flex-basis: 100%;
        width: 0;
        height: 0;
      }
      .label-item-a4-30 .label-item-barcode {
        width: 100%;
        max-height: 0.3in;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
      }
      .label-item-a4-30 .label-item-barcode img {
        max-height: 0.3in;
        width: 100%;
        height: auto;
        object-fit: contain;
      }
      .label-item-a4-3 {
        border: 1px solid #ccc;
        padding: 0.06in;
        display: flex;
        flex-direction: column;
        gap: 0.04in;
        font-size: ${getSize(10)}px;
        height: 100%;
        justify-content: space-between;
      }
      .label-item-a4-3 .label-item-number {
        font-weight: bold;
        font-size: ${getSize(11)}px;
      }
      .label-item-a4-3 .label-item-description {
        font-size: ${getSize(9)}px;
        display: flex;
        flex-wrap: wrap;
        line-height: 1.2;
      }
      .label-item-a4-3 .label-item-details {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 0.03in;
        font-size: ${getSize(9)}px;
      }
      .label-item-a4-3 .label-item-price {
        font-weight: bold;
        color: #dc2626;
        font-size: ${getSize(12)}px;
      }
      .label-item-a4-3 .label-item-barcode {
        max-height: 0.5in;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
      }
      .label-item-a4-2 {
        border: 1px solid #ccc;
        padding: 0.08in;
        display: flex;
        flex-direction: row;
        gap: 0.1in;
        font-size: ${getSize(12)}px;
        height: 100%;
        box-sizing: border-box;
      }
      .label-item-a4-2 .label-item-image {
        width: 38%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .label-item-a4-2 .label-item-image img {
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .label-item-a4-2 .label-item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.05in;
        min-width: 0;
      }
      .label-item-a4-2 .label-item-barcode {
        max-height: 0.6in;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
      }
      .label-item-a4-2 .label-item-number-row {
        font-weight: bold;
        font-size: ${getSize(13)}px;
        margin-bottom: 0.03in;
      }
      .label-item-a4-2 .label-item-description {
        font-size: ${getSize(11)}px;
        line-height: 1.2;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 0.03in;
      }
      .label-item-a4-2 .label-item-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.04in;
        font-size: ${getSize(10)}px;
      }
      .label-item-a4-2 .label-item-details > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .label-item-a4-2 .label-item-details > div:not(.label-item-price) span:first-child {
        font-weight: 700;
        color: #6c757d;
        text-transform: uppercase;
        font-size: ${getSize(9)}px;
      }
      .label-item-a4-2 .label-item-details > div:not(.label-item-price) span:last-child {
        font-weight: 700;
        color: #000000;
        font-size: ${getSize(12)}px;
      }
      .label-item-a4-2 .label-item-price {
        grid-column: 1 / -1;
        font-weight: bold;
        color: #dc2626;
        font-size: ${getSize(18)}px;
        font-weight: 900;
        text-align: left;
      }
      .label-item-a4-1 {
        border: 1px solid #ccc;
        padding: 0.1in;
        display: flex;
        flex-direction: row;
        gap: 0.12in;
        font-size: ${getSize(14)}px;
        height: 100%;
        box-sizing: border-box;
      }
      .label-item-a4-1 .label-item-image {
        width: 40%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .label-item-a4-1 .label-item-image img {
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .label-item-a4-1 .label-item-info-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.06in;
        min-width: 0;
      }
      .label-item-a4-1 .label-item-barcode {
        max-height: 0.8in;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
      }
      .label-item-a4-1 .label-item-number-row {
        font-weight: bold;
        font-size: ${getSize(15)}px;
        margin-bottom: 0.04in;
      }
      .label-item-a4-1 .label-item-description {
        font-size: ${getSize(13)}px;
        line-height: 1.3;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 0.04in;
      }
      .label-item-a4-1 .label-item-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.05in;
        font-size: ${getSize(12)}px;
      }
      .label-item-a4-1 .label-item-details > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .label-item-a4-1 .label-item-details > div:not(.label-item-price) span:first-child {
        font-weight: 700;
        color: #6c757d;
        text-transform: uppercase;
        font-size: ${getSize(11)}px;
      }
      .label-item-a4-1 .label-item-details > div:not(.label-item-price) span:last-child {
        font-weight: 700;
        color: #000000;
        font-size: ${getSize(14)}px;
      }
      .label-item-a4-1 .label-item-price {
        grid-column: 1 / -1;
        font-weight: bold;
        color: #dc2626;
        font-size: ${getSize(24)}px;
        font-weight: 900;
        text-align: left;
      }
    `;

    // Open window first
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    // Write document structure immediately
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Product Labels</title>
        <style>${styles}</style>
      </head>
      <body>
    `);
    printWindow.document.close();

    // Defer barcode generation to prevent blocking - generate labels first, then add barcodes
    const generateLabelWithoutBarcode = (product: Product) => {
      let productImage = img;
      if (product.showDistributorImage && product.distributorImage) {
        productImage = product.distributorImage;
      } else if (product.masterImage) {
        productImage = product.masterImage;
      } else if (product.Item_Image) {
        productImage = product.Item_Image;
      }

      const upc = product.UPCList?.[0]?.UPC_Number || product.Item_Number || '';
      const price = product.Price1 ? Number(product.Price1).toFixed(2) : '0.00';
      const pack = product.Pack || '-';
      const caseCount = product.CaseCount || '-';
      const productName = (product.Description || product.Item_Name || '-').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const itemNumber = product.Item_Number || '-';

      // Check if it's a small size (2x2, 2x3, 3x2)
      const isSmallSize = size === '2x2' || size === '2x3' || size === '3x2';
      // Check if it's a square size (4x4, 3x3)
      const isSquareSize = size === '4x4' || size === '3x3';

      // Handle A4 column layouts
      if (isA4Column || isA430 || isA45160) {
        if (isA430) {
          // A4-30: 3 columns x 10 rows, very compact address label style - item number and description side by side, barcode below
          return `
            <div class="label-item-a4-30" data-upc="${upc}">
              <div class="label-item-header">
                <div class="label-item-number">${itemNumber}</div>
                <div class="label-item-description">${productName}</div>
              </div>
              <div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>
            </div>
          `;
        } else if (isA45160) {
          // A4-5160: 3 columns x 10 rows, Avery 5160 label style - item number and description side by side, barcode below
          return `
            <div class="label-item-a4-5160" data-upc="${upc}">
              <div class="label-item-header">
                <div class="label-item-number">${itemNumber}</div>
                <div class="label-item-description">${productName}</div>
              </div>
              <div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>
            </div>
          `;
        } else if (columnCount === 4) {
          // 4 columns: small font, itemNumber, description (flex), pack, case, small barcode
          return `
            <div class="label-item-a4-4" data-upc="${upc}">
              <div class="label-item-number">${itemNumber}</div>
              <div class="label-item-description">${productName}</div>
              <div class="label-item-details">
                <span>P: ${pack}</span>
                <span>C: ${caseCount}</span>
              </div>
              <div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>
            </div>
          `;
        } else if (columnCount === 3) {
          // 3 columns: with price, adjusted font size
          return `
            <div class="label-item-a4-3" data-upc="${upc}">
              <div class="label-item-number">${itemNumber}</div>
              <div class="label-item-description">${productName}</div>
              <div class="label-item-details">
                <span>P: ${pack}</span>
                <span>C: ${caseCount}</span>
                <span class="label-item-price">$${price}</span>
              </div>
              <div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>
            </div>
          `;
        } else if (columnCount === 2) {
          // 2 columns: same as 4x6 landscape style but size adjusted
          return `
            <div class="label-item-a4-2" data-upc="${upc}">
              <div class="label-item-image">
                <img src="${productImage}" alt="${productName}" onerror="this.onerror=null; this.src='${img}';" />
              </div>
              <div class="label-item-info">
                <div class="label-item-description">${productName}</div>
                <div class="label-item-number-row">${itemNumber}</div>
                <div class="label-item-details">
                  <div><span>PACK:</span><span>${pack}</span></div>
                  <div><span>CASE:</span><span>${caseCount}</span></div>
                  <div class="label-item-price">$${price}</div>
                </div>
                <div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>
              </div>
            </div>
          `;
        } else if (columnCount === 1) {
          // 1 column: same as 4x6 landscape style but size adjusted
          return `
            <div class="label-item-a4-1" data-upc="${upc}">
              <div class="label-item-image">
                <img src="${productImage}" alt="${productName}" onerror="this.onerror=null; this.src='${img}';" />
              </div>
              <div class="label-item-info-wrapper">
                <div class="label-item-description">${productName}</div>
                <div class="label-item-number-row">${itemNumber}</div>
                <div class="label-item-details">
                  <div><span>PACK:</span><span>${pack}</span></div>
                  <div><span>CASE:</span><span>${caseCount}</span></div>
                  <div class="label-item-price">$${price}</div>
                </div>
                <div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>
              </div>
            </div>
          `;
        }
      }

      if (isSmallSize) {
        // Small sizes: No image, no labels, small font
        return `
          <div class="label-container" data-upc="${upc}">
            <div class="label-content label-small">
              <div class="label-info-section">
                <div class="label-description">${productName}</div>
                <div class="label-details-grid">
                  <div class="label-detail-item">
                    <span class="label-detail-value">${itemNumber}</span>
                  </div>
                  <div class="label-detail-item">
                    <span class="label-detail-value">${pack}</span>
                  </div>
                  <div class="label-detail-item">
                    <span class="label-detail-value">${caseCount}</span>
                  </div>
                  <div class="label-detail-item price-item">
                    <span class="label-detail-value price-value">$${price}</span>
                  </div>
                </div>
                <div class="label-barcode-section" data-barcode-placeholder="${upc}"></div>
              </div>
            </div>
          </div>
        `;
      } else if (isSquareSize) {
        // Square sizes: Image on left (smaller height), barcode beside image, info on right
        return `
          <div class="label-container" data-upc="${upc}">
            <div class="label-content label-square">
              <div class="label-left-section">
                <div class="label-image-section">
                  <img src="${productImage}" alt="${productName}" class="label-image" onerror="this.onerror=null; this.src='${img}';" />
                </div>
                <div class="label-barcode-section" data-barcode-placeholder="${upc}"></div>
              </div>
              <div class="label-info-section">
                <div class="label-description">${productName}</div>
                <div class="label-details-grid">
                  <div class="label-detail-item">
                    <span class="label-detail-value label-item-number-highlight">${itemNumber}</span>
                  </div>
                  <div class="label-detail-item">
                    <span class="label-detail-label">PACK:</span>
                    <span class="label-detail-value">${pack}</span>
                  </div>
                  <div class="label-detail-item">
                    <span class="label-detail-label">CASE:</span>
                    <span class="label-detail-value">${caseCount}</span>
                  </div>
                  <div class="label-detail-item price-item">
                    <span class="label-detail-value price-value">$${price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Normal sizes: Full layout with image and barcode
        return `
          <div class="label-container" data-upc="${upc}">
            <div class="label-content">
              <div class="label-image-section">
                <img src="${productImage}" alt="${productName}" class="label-image" onerror="this.onerror=null; this.src='${img}';" />
              </div>
              <div class="label-info-section">
                <div class="label-description">${productName}</div>
                <div class="label-details-grid">
                  <div class="label-detail-item">
                    <span class="label-detail-value label-item-number-highlight">${itemNumber}</span>
                  </div>
                  <div class="label-detail-item">
                    <span class="label-detail-label">PACK:</span>
                    <span class="label-detail-value">${pack}</span>
                  </div>
                  <div class="label-detail-item">
                    <span class="label-detail-label">CASE:</span>
                    <span class="label-detail-value">${caseCount}</span>
                  </div>
                  <div class="label-detail-item price-item">
                    <span class="label-detail-value price-value">$${price}</span>
                  </div>
                </div>
                <div class="label-barcode-section" data-barcode-placeholder="${upc}"></div>
              </div>
            </div>
          </div>
        `;
      }
    };

    // Process in optimized chunks - generate HTML first (fast), barcodes later (slow)
    // For large batches (5k+), use larger chunks but yield more frequently
    const CHUNK_SIZE = products.length > 1000 ? 50 : products.length > 500 ? 25 : 10;
    let currentIndex = 0;
    const totalProducts = products.length;
    // Calculate items per page: columns * rows
    const itemsPerPage = isA430 || isA45160 ? 30 : (isA4Column ? (columnCount * rows) : 1);
    
    // For A4 columns, we need to track items across chunks to create proper pages
    const pageBuffer: Product[] = [];

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalProducts);
      const chunk = products.slice(currentIndex, endIndex);
      
      // Generate HTML without barcodes (fast)
      let chunkHTML = '';
      
      if (isA4Column || isA430 || isA45160) {
        // Add chunk items to page buffer
        pageBuffer.push(...chunk);
        
        // Process complete pages from buffer
        while (pageBuffer.length >= itemsPerPage) {
          const pageItems = pageBuffer.splice(0, itemsPerPage);
          chunkHTML += `<div class="label-container-a4-multi">`;
          // Add exactly itemsPerPage items
          for (let j = 0; j < pageItems.length; j++) {
            chunkHTML += generateLabelWithoutBarcode(pageItems[j]);
          }
          chunkHTML += `</div>`;
        }
      } else {
        // Regular labels
        for (let i = 0; i < chunk.length; i++) {
          chunkHTML += generateLabelWithoutBarcode(chunk[i]);
        }
      }
      
      // Append to document immediately
      if (printWindow && printWindow.document && printWindow.document.body) {
        printWindow.document.body.insertAdjacentHTML('beforeend', chunkHTML);
      }
      
      currentIndex = endIndex;
      
      // Continue processing if more chunks remain
      if (currentIndex < totalProducts) {
        // Yield to browser for better performance with large batches
        setTimeout(processChunk, 0);
      } else {
        // Process any remaining items in buffer (last incomplete page)
        if ((isA4Column || isA430 || isA45160) && pageBuffer.length > 0) {
          let finalPageHTML = `<div class="label-container-a4-multi">`;
          for (let j = 0; j < pageBuffer.length; j++) {
            finalPageHTML += generateLabelWithoutBarcode(pageBuffer[j]);
          }
          finalPageHTML += `</div>`;
          
          if (printWindow && printWindow.document && printWindow.document.body) {
            printWindow.document.body.insertAdjacentHTML('beforeend', finalPageHTML);
          }
        }
        // All labels generated, now add barcodes asynchronously in batches
        const addBarcodes = () => {
          // Find all barcode placeholders (support both regular and A4 column layouts)
          const barcodePlaceholders = printWindow?.document?.querySelectorAll('[data-barcode-placeholder]');
          if (!barcodePlaceholders || barcodePlaceholders.length === 0) {
            setTimeout(() => {
              if (printWindow) {
                printWindow.print();
              }
            }, 300);
            return;
          }

          let barcodeIndex = 0;
          const BATCH_SIZE = 10; // Process 10 barcodes at a time
          
          const addBarcodeBatch = () => {
            if (barcodeIndex >= barcodePlaceholders.length) {
              setTimeout(() => {
                if (printWindow) {
                  printWindow.print();
                }
              }, 300);
              return;
            }

            // Process a batch of barcodes
            const endBatch = Math.min(barcodeIndex + BATCH_SIZE, barcodePlaceholders.length);
            for (let i = barcodeIndex; i < endBatch; i++) {
              const placeholder = barcodePlaceholders[i] as HTMLElement;
              const upc = placeholder.getAttribute('data-barcode-placeholder') || '';
              
              if (upc) {
                const barcodeImage = generateBarcodeImage(upc);
                if (barcodeImage) {
                  placeholder.innerHTML = `<img src="${barcodeImage}" alt="Barcode" class="label-barcode" />`;
                  placeholder.removeAttribute('data-barcode-placeholder');
                }
              }
            }

            barcodeIndex = endBatch;
            
            // Yield to browser for better performance
            setTimeout(addBarcodeBatch, 0);
          };

          // Start adding barcodes after a short delay
          setTimeout(addBarcodeBatch, 50);
        };

        // Start adding barcodes after a short delay
        setTimeout(addBarcodes, 50);
      }
    };

    // Start processing - yield immediately
    setTimeout(processChunk, 0);
  };

  // Handle print labels (bulk) - optimized for performance
  const handlePrintLabels = async () => {
    try {
      setPrintLabelLoading(true);
      toast.loading('Fetching products...', { id: 'fetch-products' });
      
      // Fetch all products using productList or productListWithTax (with tax when customer selected)
      const params: Record<string, unknown> = {
        search: '',
        page: 1,
        limit: 100000, // Very high limit to get all products
        salesCategoryId: printLabelForm.salesCategory.length > 0 
          ? printLabelForm.salesCategory.map(cat => Number(cat.value))
          : [],
        priceClassId: printLabelForm.priceClass.length > 0
          ? printLabelForm.priceClass.map(pc => Number(pc.value))
          : [],
      };
      if (isAllSelected) {
        params.all = true;
      } else {
        params.I_Inactive = iInactive;
        params.ShortOrderForm = shortOrderForm;
      }
      if (printLabelSelectedCustomer) {
        params.customerId = Number(printLabelSelectedCustomer);
      }
      const apiCall = printLabelSelectedCustomer ? productListWithTax : productList;
      const res: any = await apiCall(params);
      const allProducts: Product[] = res?.data?.data?.finalProductList || [];
      
      if (!Array.isArray(allProducts) || allProducts.length === 0) {
        toast.error('No products found', { id: 'fetch-products' });
        return;
      }

      // Products are already filtered by the API based on salesCategoryId and priceClassId
      if (allProducts.length === 0) {
        toast.error('No products match the selected filters', { id: 'fetch-products' });
        return;
      }

      toast.success(`Generating ${allProducts.length} labels...`, { id: 'fetch-products' });
      
      // Close drawer immediately to free UI
      setPrintLabelDrawerOpen(false);
      setPrintLabelLoading(false);
      
      // Dismiss toast immediately
      toast.dismiss('fetch-products');
      
      // Multiple yields to ensure UI is completely free before starting
      setTimeout(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              generateAndPrintLabels(
                allProducts,
                printLabelForm.size,
                printLabelForm.orientation,
                printLabelForm.rows
              );
            });
          }, 0);
        });
      }, 100);
    } catch (error: any) {
      console.error('Failed to generate labels:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate labels', { id: 'fetch-products' });
      setPrintLabelLoading(false);
    }
  };

  // Handle individual product print
  const handleIndividualPrint = () => {
    if (!individualPrintProduct) return;
    try {
      setIndividualPrintLoading(true);
      
      // Close modal immediately to free UI
      setIndividualPrintModalOpen(false);
      setIndividualPrintLoading(false);
      
      // Multiple yields before starting generation
      setTimeout(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              generateAndPrintLabels(
                [individualPrintProduct],
                individualPrintForm.size,
                individualPrintForm.orientation,
                individualPrintForm.rows
              );
              toast.success('Label generated successfully');
            });
          }, 0);
        });
      }, 100);
    } catch (error: any) {
      console.error('Failed to generate label:', error);
      toast.error('Failed to generate label');
      setIndividualPrintLoading(false);
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
            {canView && (
              <Tooltip title="View Details">
                <VisibilityOutlinedIcon 
                  sx={{ fontSize: 20, color: 'primary.main', cursor: 'pointer' }} 
                  onClick={() => {
                    setDetailProductId(row.Item_Number);
                    setDetailModalOpen(true);
                  }}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Edit Product">
                <EditIcon 
                  sx={{ fontSize: 20, color: 'primary.main', cursor: 'pointer' }} 
                  onClick={() => {
                    navigate(`${productBasePath}/edit/${row.Item_Number}`);
                  }}
                />
              </Tooltip>
            )}
            {!isSalesMode && canEdit && (
              <Tooltip title="Set Product Limit">
                <SettingsIcon 
                  sx={{ fontSize: 20, color: 'secondary.main', cursor: 'pointer' }} 
                  onClick={() => handleLimitClick(row)}
                />
              </Tooltip>
            )}
            {!isSalesMode && (
              <Tooltip title="Print Label">
                <PrintIcon 
                  sx={{ fontSize: 20, color: 'info.main', cursor: 'pointer' }} 
                  onClick={() => {
                    setIndividualPrintProduct(row);
                    setIndividualPrintModalOpen(true);
                  }}
                />
              </Tooltip>
            )}
          </Box>
        )
      }
    },
  ];
  
  // Get product image based on showDistributorImage flag
  const getProductImage = (item: any) => {
    if (item.showDistributorImage && item.distributorImage) {
      return item.distributorImage;
    } else if (item.masterImage) {
      return item.masterImage;
    } else if (item.Item_Image) {
      return item.Item_Image;
    }
    return img;
  };

  // Helper function to format display values
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (value === '') return '-';
    if (value === 0 || value === '0') return '0';
    return String(value);
  };

  const isInactive = (value: any): boolean => {
  return value === true || value === 1 || value === '1';
};

// const isAll = iInactive === null;


  // Render detailed view card with full product details
  const renderDetailedCard = (item: any, index: number) => {
    // Find full details if available
     const cardId = `card-${item.Item_Number}`;
   const productData =
  detailedProductsWithFullData[item.Item_Number] || item;

const isLoading = loadingFullDetails[item.Item_Number];

const inactive =
  iInactive !== null
    ? iInactive
    : isInactive(productData.I_Inactive);

    // All cards closed by default - only open when user clicks
    const isCardExpanded = expandedCards[cardId] || false;
    
    // Initialize expanded sections for this card if not exists (all closed by default)
     const sectionExpanded = expandedSections[cardId] || {};
    
    return (
        <Accordion
        key={item.Item_Number || index}
        expanded={isCardExpanded}
        onChange={(_, expanded) => {
          setExpandedCards(prev => ({ ...prev, [cardId]: expanded }));
        }}
        sx={{ 
          mb: 1.5, 
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '&:before': { display: 'none' },
          transition: 'all 0.3s ease-in-out',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50',
            px: 1.5,
            py: 1,
            minHeight: 56,
            '&.Mui-expanded': { minHeight: 56 },
          }}
        >
          <Box display="flex" alignItems="center" gap={{ xs: 1, md: 2 }} width="100%" sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            {isLoading && <CircularProgress size={20} />}
            <Box
              sx={{
                width: { xs: 60, md: 100 },
                height: { xs: 60, md: 100 },
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                cursor: 'pointer',
                '&:hover .edit-overlay': { opacity: 1 }
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Open the same modal as table view
                const productForModal: Product = {
                  id: String(item.Item_Number),
                  Item_Number: String(item.Item_Number),
                  Item_Image: '',
                  Item_Name: productData.Description,
                  Description: productData.Description,
                  Pack: String(productData.Pack),
                  CaseCount: String(productData.CaseCount),
                  UOM: productData.UOM,
                  UnitOunces: String(productData.UnitOunces || 0),
                  Price1: productData.Price1,
                  Price2: productData.Price2,
                  BaseCost: productData.BaseCost,
                  Invoice_Cost: productData.Invoice_Cost,
                  orderQty: 0,
                  shippedQty: 0,
                  qtyShipped: 0,
                  qtyOrder: 0,
                  AvgCost: productData.AvgCost,
                  priceWithoutTax: 0,
                  taxAmount: 0,
                  totalPrice: 0,
                  extendedPrice: 0,
                  salesTaxApplies: false,
                  showDistributorImage: productData.showDistributorImage || false,
                  distributorImage: productData.distributorImage || '',
                  masterImage: productData.masterImage || '',
                  imageId: productData.imageId,
                  PriceClass: productData.PriceClass?.Class_Desc || productData.PriceClass || '',
                  SalesCategory: productData.SalesCategory?.Category_Desc || productData.SalesCategory || '',
                };
                setSelectedProduct(productForModal);
                setShowDistributorImage(!!productData.showDistributorImage);
                setModalOpen(true);
                setFile(null);
              }}
            >
              <img
                src={getProductImage(productData)}
                alt={productData.Description || 'Product'}
                onError={(e) => {
                  e.currentTarget.src = img;
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
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
                <AddPhotoAlternateIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Box flex={1} minWidth={0} sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <Box display="flex" gap={{ xs: 0.5, md: 1 }} mb={0.5} flexWrap="wrap" sx={{ maxWidth: '100%' }}>
                <Chip label={`#${productData.Item_Number}`} size="small" sx={{ height: 20, fontSize: 12, fontWeight: 600 }} />
                <Chip 
                  label={formatValue(productData.SalesCategory?.Category_Desc || productData.SalesCategory)}
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: 10 }}
                />
                <Chip 
                  label={formatValue(productData.PriceClass?.Class_Desc || productData.PriceClass)}
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: 10 }}
                />
               <Chip
               label={inactive ? 'Inactive' : 'Active'}
               size="small"
              color={inactive ? 'error' : 'success'}
              sx={{ height: 20, fontSize: 10 }}
              />

              </Box>
              <Typography 
                fontSize={{ xs: 12, md: 14 }} 
                fontWeight={500} 
                color="primary.main" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, md: 1 },
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {formatValue(productData.Description)}
              </Typography>
              
            </Box>
            <Box display="flex" gap={{ xs: 0.25, md: 0.5 }} flexShrink={0}>
              {/* <Tooltip title="View Details">
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailProductId(String(item.Item_Number));
                    setDetailModalOpen(true);
                  }}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip> */}
              {canEdit && (
                <Tooltip title="Edit Product">
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${productBasePath}/edit/${item.Item_Number}`);
                    }}
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider',
                      p: { xs: 0.5, md: 1 }
                    }}
                  >
                    <EditIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                  </IconButton>
                </Tooltip>
              )}
              {!isSalesMode && canEdit && (
                <Tooltip title="Set Product Limit">
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const productForLimit: Product = {
                      id: String(item.Item_Number),
                      Item_Number: String(item.Item_Number),
                      Item_Image: '',
                      Item_Name: productData.Description,
                      Description: productData.Description,
                      Pack: String(productData.Pack),
                      CaseCount: String(productData.CaseCount),
                      UOM: productData.UOM,
                      UnitOunces: String(productData.UnitOunces || 0),
                      Price1: productData.Price1,
                      Price2: productData.Price2,
                      BaseCost: productData.BaseCost,
                      Invoice_Cost: productData.Invoice_Cost,
                      orderQty: 0,
                      shippedQty: 0,
                      qtyShipped: 0,
                      qtyOrder: 0,
                      AvgCost: productData.AvgCost,
                      priceWithoutTax: 0,
                      taxAmount: 0,
                      totalPrice: 0,
                      extendedPrice: 0,
                      salesTaxApplies: false,
                      showDistributorImage: productData.showDistributorImage || false,
                      distributorImage: productData.distributorImage || '',
                      masterImage: productData.masterImage || '',
                      imageId: productData.imageId,
                      PriceClass: productData.PriceClass?.Class_Desc || productData.PriceClass || '',
                      SalesCategory: productData.SalesCategory?.Category_Desc || productData.SalesCategory || '',
                      QtyLimit: productData.QtyLimit,
                      markAsBundle: productData.markAsBundle,
                    };
                    handleLimitClick(productForLimit);
                  }}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    p: { xs: 0.5, md: 1 }
                  }}
                >
                  <SettingsIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </IconButton>
              </Tooltip>
              )}
              {!isSalesMode && (
                <Tooltip title="Print Label">
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const productForPrint: Product = {
                      id: String(item.Item_Number),
                      Item_Number: String(item.Item_Number),
                      Item_Image: '',
                      Item_Name: productData.Description,
                      Description: productData.Description,
                      Pack: String(productData.Pack),
                      CaseCount: String(productData.CaseCount),
                      UOM: productData.UOM,
                      UnitOunces: String(productData.UnitOunces || 0),
                      Price1: productData.Price1,
                      Price2: productData.Price2,
                      BaseCost: productData.BaseCost,
                      Invoice_Cost: productData.Invoice_Cost,
                      orderQty: 0,
                      shippedQty: 0,
                      qtyShipped: 0,
                      qtyOrder: 0,
                      AvgCost: productData.AvgCost,
                      priceWithoutTax: 0,
                      taxAmount: 0,
                      totalPrice: 0,
                      extendedPrice: 0,
                      salesTaxApplies: false,
                      showDistributorImage: productData.showDistributorImage || false,
                      distributorImage: productData.distributorImage || '',
                      masterImage: productData.masterImage || '',
                      imageId: productData.imageId,
                      PriceClass: productData.PriceClass?.Class_Desc || productData.PriceClass || '',
                      SalesCategory: productData.SalesCategory?.Category_Desc || productData.SalesCategory || '',
                      UPCList: productData.UPCList,
                    };
                    setIndividualPrintProduct(productForPrint);
                    setIndividualPrintModalOpen(true);
                  }}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    p: { xs: 0.5, md: 1 }
                  }}
                >
                  <PrintIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
                </IconButton>
              </Tooltip>
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 0.5, md: 1 }, maxWidth: '100%', overflow: 'hidden' }}>
          <Grid container spacing={{ xs: 1, md: 1.5 }} sx={{ maxWidth: '100%', margin: 0 }}>
           
            {/* Cost Information
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.cost === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], cost: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Cost Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Weight Rate:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.I_WeightRate)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}

            {/* Item Classification */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.product === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], product: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Item Classification
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Case Count:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.CaseCount)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Case Weight:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.CaseWeight)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Case Discount:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {Number(productData.CaseDiscount_Pct || 0).toFixed(2)}
                      </Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Reorder Level:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Reorder_Level)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Reorder Qty:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Reorder_Qty)}</Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Inactive:</Typography>
                      <Chip 
                        label={productData.I_Inactive ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.I_Inactive ? 'error' : 'success'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">On Hand:</Typography>
                      <Typography 
                        fontSize={11} 
                        fontWeight={500}
                        color={productData.inventoryOnHand >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatValue(productData.inventoryOnHand ?? productData.Inventory_OnHand)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Price Book Include:</Typography>
                      <Chip 
                        label={productData.PriceBook_Include ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.PriceBook_Include ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">eCommerce:</Typography>
                      <Chip 
                        label={productData.eCommerce ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.eCommerce ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                  
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">OTP Number:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.OTP_Number)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Sequence:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Sequence)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price Subclass:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Price_Subclass)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">I Cube:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.I_Cube)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Heading Flag:</Typography>
                      <Chip 
                        label={productData.HeadingFlag ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.HeadingFlag ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Discontinued:</Typography>
                      <Chip 
                        label={productData.I_Discontinued ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.I_Discontinued ? 'error' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">EBT:</Typography>
                      <Chip 
                        label={productData.EBT ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.EBT ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cases Per Pallet:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.CasesPerPallet)}</Typography>
                    </Box>
                    {productData.UPCList && productData.UPCList.length > 0 && (
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography fontSize={11} color="text.secondary">UPC Numbers:</Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {productData.UPCList.map((upc: any, idx: number) => (
                            <Chip 
                              key={idx}
                              label={upc.UPC_Number} 
                              size="small" 
                              sx={{ fontSize: 9, height: 18 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Inventory & Location */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.inventory === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], inventory: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Inventory Size & Location
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Size:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.UOM)}</Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">On Hand:</Typography>
                      <Typography 
                        fontSize={11} 
                        fontWeight={500}
                        color={productData.inventoryOnHand >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatValue(productData.inventoryOnHand ?? productData.Inventory_OnHand)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">On Hand Maximum:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.OnHand_Maximum)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Section:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Section)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Section 2:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Section2)}</Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig Pack:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_Pack)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Location:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Location)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Location 2:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Location2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Pick Area:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.PickArea)}</Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Unit Ounces:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.UnitOunces)}</Typography>
                    </Box>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">ROQ Method:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.ROQ_Method)}</Typography>
                    </Box> */}
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Minimum Stock Availability:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MinimumStockAvailability)}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

             {/* Vendor & Manufacturer */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.vendor === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], vendor: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Vendor & Manufacturer
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Primary Vendor:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.primaryVendor?.V_Description || productData.Primary_Vendor)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Manufacturer:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.manufacturerVendor?.V_Description || productData.Manufacturer)}
                      </Typography>
                    </Box>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Vendor Item (Legacy):</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.Vendor_ItemNumberLegacy)}
                      </Typography>
                    </Box> */}
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Vendor Item:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.Vendor_ItemNumberAlpha)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Brand ID:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Brand_ID)}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>


             {/* Pricing Information */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex', maxWidth: '100%' }}>
              <Accordion
                expanded={sectionExpanded.pricing === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], pricing: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  maxWidth: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Pricing Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price 1:</Typography>
                      <Typography fontSize={11} fontWeight={500} color="primary.main">
                        ${Number(productData.Price1 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price 2:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Price2 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price 3:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Price3 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price 4:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Price4 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price 5:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Price5 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Price 6:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Price6 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail 1:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Retail1 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail 2:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Retail2 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail 3:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Retail3 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail % 1:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {Number(productData.RetailPct1 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail % 2:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {Number(productData.RetailPct2 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Retail % 3:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {Number(productData.RetailPct3 || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Base Cost:</Typography>
                      <Typography fontSize={11} fontWeight={500}>
                        ${Number(productData.BaseCost || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Net Cost:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.NetCost || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Invoice Cost:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Invoice_Cost || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Average Cost:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.AvgCost || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Unit Price:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Unit_Price || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Deposit Amount:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.DepositAmount || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Unit Upcharge:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        ${Number(productData.Unit_Upcharge || 0).toFixed(2)}
                      </Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Sales Tax Select:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.I_SalesTaxSelect)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Never Discount:</Typography>
                      <Chip 
                        label={productData.I_NeverDiscount ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.I_NeverDiscount ? 'warning' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Breakable:</Typography>
                      <Chip 
                        label={productData.Breakable ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.Breakable ? 'warning' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Add On Deposit Item Number:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.AddOnDeposit_Item_Number)}</Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Is Include Deposit QB:</Typography>
                      <Chip 
                        label={productData.IsIncludeDeposit_QB ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.IsIncludeDeposit_QB ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">eCommerce Update Tag:</Typography>
                      <Chip 
                        label={productData.eCommerce_UpdateTag ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.eCommerce_UpdateTag ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">eCommerce FTP Host ID:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.eCommerce_FTP_HostID)}</Typography>
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Non Merchandise Code Select:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.NonMerchandiseCodeSelect)}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Case Dimensions */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.caseDimensions === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], caseDimensions: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    MSA -NACS
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Project Identifier:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Project_Identifier)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">NACS:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.NACS)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">NACS Unit:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.NACS_Unit)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">MSA Category:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MSA_Category_Code)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">MSA Description:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MSA_Description)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">MSA Component:</Typography>
                      <Chip 
                        label={productData.MSA_Component ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.MSA_Component ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">MSA Promotion:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MSA_Promotion)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">MSA Promotion Code:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MSA_Promotion_Code)}</Typography>
                    </Box>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Case Length:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.CaseLength)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Case Width:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.CaseWidth)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Case Height:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.CaseHeight)}</Typography>
                    </Box> */}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Quantity Limits
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.quantity === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], quantity: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Quantity Limits
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Min QTY:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MinimumQTY)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Max QTY:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MaximumQTY)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Customer Limit Qty:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Customer_LimitQty)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Customer Limit Days:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Customer_LimitDays)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Max Customer Order Qty:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MaximumCustomerOrderQty)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Max Customer Order Days:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.MaximumCustomerOrderDays)}</Typography>
                    </Box>
                    {productData.QtyLimit && (
                      <Box 
                        mt={0.5} 
                        p={0.75} 
                        bgcolor={(theme) => theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'info.light'} 
                        borderRadius={0.5}
                      >
                        <Typography fontSize={10} color="text.secondary">Product Limit:</Typography>
                        <Typography fontSize={11} fontWeight={500}>
                          {productData.QtyLimit.QtyLimit} {productData.QtyLimit.markAsBundle ? '(Bundle)' : ''}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}

           
            {/* Jurisdiction & Cigarette */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.jurisdiction === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], jurisdiction: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                     Cigarette
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Jurisdiction State:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Jurisdiction_State)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Jurisdiction County:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Jurisdiction_County)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Jurisdiction City:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Jurisdiction_City)}</Typography>
                    </Box> */}
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Special Tax Units:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.SpecialTaxUnits)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig Total:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_Total)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig Pack:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_Pack)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig Sticks:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_Sticks)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig Prem Disc Code:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_PremDisc_Code)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig Promo Code:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_Promo_Code)}</Typography>
                    </Box>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Cig UPC Ref:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Cig_Upc_Ref)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Points:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Points)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">PM Exclude:</Typography>
                      <Chip 
                        label={productData.PM_Exclude ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.PM_Exclude ? 'warning' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Image Flag:</Typography>
                      <Chip 
                        label={productData.ImageFlag ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.ImageFlag ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Use Master Image:</Typography>
                      <Chip 
                        label={productData.UseMasterImage ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.UseMasterImage ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Is Add On Deposit Inventory:</Typography>
                      <Chip 
                        label={productData.IsAddOnDeposit_Inventory ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.IsAddOnDeposit_Inventory ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box> */}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Flags & Status
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.flags === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], flags: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Flags & Status
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={0.75}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Web Allow:</Typography>
                      <Chip 
                        label={productData.ShortOrderForm ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.ShortOrderForm ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Case Discounts:</Typography>
                      <Chip 
                        label={productData.Case_Discounts ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.Case_Discounts ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}

            {/* Additional Information */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.additional === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], additional: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Additional Item Info
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                   
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Taxable At Retail:</Typography>
                      <Chip 
                        label={productData.TaxableAtRetail ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.TaxableAtRetail ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Return Status:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.I_ReturnStatus)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Track Expiration:</Typography>
                      <Chip 
                        label={productData.Track_ExpirationDate ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.Track_ExpirationDate ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Frozen:</Typography>
                      <Chip 
                        label={productData.FrozenFlag ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.FrozenFlag ? 'info' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Cooler:</Typography>
                      <Chip 
                        label={productData.CoolerFlag ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.CoolerFlag ? 'info' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">HazMat:</Typography>
                      <Chip 
                        label={productData.HazMatFlag ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.HazMatFlag ? 'warning' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Track Lot Ref:</Typography>
                      <Chip 
                        label={productData.Track_LotRef ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.Track_LotRef ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                     <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Exclusion Group ID:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.ExclusionGroup_ID)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Item Group ID:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Item_GroupID)}</Typography>
                    </Box>
                    {/* <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Standard Unit:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.StandardUnitDescription)}</Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Non Merchandise Code:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.NonMerchandiseCode)}</Typography>
                    </Box>
                   
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Lot ID:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.Lot_ID)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontSize={11} color="text.secondary">Bump To Minimum:</Typography>
                      <Typography fontSize={11} fontWeight={400}>{formatValue(productData.BumpToMinimum)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">No Retail Rounding:</Typography>
                      <Chip 
                        label={productData.NoRetailRounding ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.NoRetailRounding ? 'warning' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">I Prepaid Status:</Typography>
                      <Chip 
                        label={productData.I_PrepaidStatus ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.I_PrepaidStatus ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    
                    {productData.AltDesc && (
                      <Box>
                        <Typography fontSize={11} color="text.secondary">Alt Description:</Typography>
                        <Typography fontSize={11} fontWeight={400}>{productData.AltDesc}</Typography>
                      </Box>
                    )}
                    {productData.ALT_Description2 && (
                      <Box>
                        <Typography fontSize={11} color="text.secondary">Alt Description 2:</Typography>
                        <Typography fontSize={11} fontWeight={400}>{productData.ALT_Description2}</Typography>
                      </Box>
                    )}
                    {productData.Item_Message && (
                      <Box>
                        <Typography fontSize={11} color="text.secondary">Item Message:</Typography>
                        <Typography fontSize={11} fontWeight={400}>{productData.Item_Message}</Typography>
                      </Box>
                    )} */}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Dates & Tracking */}
            {/* <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <Accordion
                expanded={sectionExpanded.dates === true}
                onChange={(_, expanded) => {
                  setExpandedSections(prev => ({
                    ...prev,
                    [cardId]: { ...prev[cardId], dates: expanded }
                  }));
                }}
                sx={{ 
                  boxShadow: 'none', 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  '&:before': { display: 'none' },
                  transition: 'all 0.3s ease-in-out',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} 
                  sx={{ 
                    px: 1, 
                    py: 0.5, 
                    minHeight: 36, 
                    '&.Mui-expanded': { minHeight: 36 },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Typography fontSize={12} fontWeight={500} color="primary.main">
                    Dates & Tracking
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pb: 1, pt: 0.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Date Created:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {productData.Date_Created ? new Date(productData.Date_Created).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Last Changed:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {productData.Date_LastChange ? new Date(productData.Date_LastChange).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Price/Cost Modified:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {productData.PriceCostModifiedDate ? new Date(productData.PriceCostModifiedDate).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Item Expiry Date:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {productData.ItemExpiryDate ? new Date(productData.ItemExpiryDate).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Inactive Date:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {productData.Inactive_Date ? new Date(productData.Inactive_Date).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Catch Weight:</Typography>
                      <Chip 
                        label={productData.CatchWeight_Capture ? 'Yes' : 'No'} 
                        size="small" 
                        color={productData.CatchWeight_Capture ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: 9 }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Date Created User:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.Date_CreatedUser)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Date Last Change User:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.Date_LastChangeUser)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={11} color="text.secondary">Price Cost Modified User:</Typography>
                      <Typography fontSize={11} fontWeight={400}>
                        {formatValue(productData.PriceCostModifiedUser)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid> */}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, pt: { xs: 1, md: 0 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between" 
        mb={2}
        gap={{ xs: 2, md: 0 }}
        sx={{ width: '100%' }}
      >
          <Typography 
            fontSize={{ xs: 16, md: 18 }} 
            fontWeight={400} 
            color="text.primary"
            sx={{ mb: { xs: 1, md: 0 } }}
          >
            Products Management
          </Typography>
          <Box 
            display="flex" 
            gap={{ xs: 1, md: 2 }} 
            alignItems="center"
            flexWrap="wrap"
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            {/* View tab commented - showing only table view for now
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode !== null) {
                  setViewMode(newMode);
                }
              }}
              size="small"
              sx={{ 
                '& .MuiToggleButton-root': {
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1, md: 1.5 },
                }
              }}
            >
              <ToggleButton value="table">
                <ViewListIcon sx={{ fontSize: { xs: 16, md: 18 }, mr: 0.5 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Table</Box>
              </ToggleButton>
              <ToggleButton value="detailed">
                <ViewModuleIcon sx={{ fontSize: { xs: 16, md: 18 }, mr: 0.5 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Detailed</Box>
              </ToggleButton>
            </ToggleButtonGroup>
            */}
            {!isSalesMode && (
              <>
                <CustomButton 
                  fullWidth={false}
                  onClick={() => navigate('/admin/products/future-pricing')}
                  icon={<EventIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  iconPosition="left"
                  sx={{ 
                    mt: 0,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    px: { xs: 1, md: 1.5 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0.5, md: 1 }
                    }
                  }} 
                >
                  <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Future Pricing</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>Pricing</Box>
                </CustomButton>
                <CustomButton 
                  fullWidth={false}
                  onClick={() => navigate('/admin/products/bulk-update')}
                  icon={<UpdateIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  iconPosition="left"
                  sx={{ 
                    mt: 0,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    px: { xs: 1, md: 1.5 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0.5, md: 1 }
                    }
                  }} 
                >
                  <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Bulk Update</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>Update</Box>
                </CustomButton>
                <CustomButton 
                  fullWidth={false}
                  onClick={handleBulkImageModalOpen}
                  icon={<ImageIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  iconPosition="left"
                  sx={{ 
                    mt: 0,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    px: { xs: 1, md: 1.5 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0.5, md: 1 }
                    }
                  }} 
                >
                  <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Bulk Image</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>Images</Box>
                </CustomButton>
                <CustomButton 
                  fullWidth={false}
                  onClick={() => setPrintLabelDrawerOpen(true)}
                  icon={<PrintIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  iconPosition="left"
                  sx={{ 
                    mt: 0,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    px: { xs: 1, md: 1.5 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0.5, md: 1 }
                    }
                  }} 
                >
                  <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Print Label</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>Print</Box>
                </CustomButton>
              </>
            )}
            {/* <CustomButton 
              fullWidth={false}
              onClick={() => setLossQtyReportModalOpen(true)}
              icon={<AssessmentIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
              iconPosition="left"
              sx={{ 
                mt: 0,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1, md: 1.5 },
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.5, md: 1 }
                }
              }} 
            >
              <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Loss Qty Report</Box>
              <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>Report</Box>
            </CustomButton> */}
            {canAdd && (
              <CustomButton 
                fullWidth={false}
                onClick={() => navigate(`${productBasePath}/add`)}
                icon={<AddIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                iconPosition="left"
                sx={{ 
                  mt: 0,
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1, md: 1.5 },
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0.5, md: 1 }
                  }
                }} 
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Product</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
              </CustomButton>
            )}  
          </Box>
      </Box>
      <Paper sx={{ boxShadow: 'none', borderRadius: '0px', maxWidth: '100%', overflow: 'hidden' }}>
      <Box px={{ xs: 1, md: 2 }} pt={{ xs: 1, md: 2 }} sx={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Grid container spacing={{ xs: 1, md: 2 }} sx={{ maxWidth: '100%', margin: 0 }}>
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
          <Grid size={{ xs: 12, sm: 12, md: 12 }}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
      <Typography fontSize={13} color="text.secondary" sx={{ mr: 0.5 }}>
      Filters:
     </Typography>

     {/* ALL */}
   <Chip
  label="All"
  onClick={() => {
    setIsAllSelected(prev => {
      const next = !prev;

      if (next) {
        // When All is selected → show everything
        setIInactive(null);
        setShortOrderForm(false);
      } else {
        // When All is unselected → restore defaults
        setIInactive(defaultFilters.iInactive);
        setShortOrderForm(defaultFilters.shortOrderForm);
      }

      setCurrentPage(1);
      if (viewMode === 'detailed') setDetailedCurrentPage(1);

      return next;
    });
  }}
   color={isAllSelected ? 'primary' : 'default'}
   variant={isAllSelected ? 'filled' : 'outlined'}
   sx={{
    fontSize: '12px',
    height: '28px',
    color: isAllSelected ? 'white' : 'inherit',
  }}
/>


  {/* ACTIVE */}
   <Chip
   label="Active"
   onClick={() => {
    setIsAllSelected(false);
    setIInactive(false);
    setCurrentPage(1);
    if (viewMode === 'detailed') setDetailedCurrentPage(1);
  }}
   variant={!isAllSelected && iInactive === false ? 'filled' : 'outlined'}
   sx={{
    fontSize: '12px',
    height: '28px',
    color: !isAllSelected && iInactive === false ? 'white' : 'inherit',
    bgcolor: !isAllSelected && iInactive === false ? 'primary.main' : 'transparent',
    '&:hover': { bgcolor: !isAllSelected && iInactive === false ? 'primary.dark' : undefined },
  }}
/>

  {/* INACTIVE */}
   <Chip
   label="Inactive"
   onClick={() => {
    setIsAllSelected(false);
    setIInactive(true);
    setCurrentPage(1);
    if (viewMode === 'detailed') setDetailedCurrentPage(1);
  }}
   variant={!isAllSelected && iInactive === true ? 'filled' : 'outlined'}
   sx={{
    fontSize: '12px',
    height: '28px',
    color: !isAllSelected && iInactive === true ? 'white' : 'inherit',
    bgcolor: !isAllSelected && iInactive === true ? 'primary.main' : 'transparent',
    '&:hover': { bgcolor: !isAllSelected && iInactive === true ? 'primary.dark' : undefined },
  }}
/>

    {/* WEB ALLOW */}
   <Chip
    label="Web Allow"
    onClick={() => {
    setIsAllSelected(false);
    setShortOrderForm(prev => !prev);
    setCurrentPage(1);
    if (viewMode === 'detailed') setDetailedCurrentPage(1);
    }}
    variant={!isAllSelected && shortOrderForm ? 'filled' : 'outlined'}
    sx={{
    fontSize: '12px',
    height: '28px',
    color: !isAllSelected && shortOrderForm ? 'white' : 'inherit',
    bgcolor: !isAllSelected && shortOrderForm ? 'primary.main' : 'transparent',
    '&:hover': { bgcolor: !isAllSelected && shortOrderForm ? 'primary.dark' : undefined },
    }}
   />
     </Box>
     </Grid>
     </Grid>
      </Box>
      {viewMode === 'table' ? (
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
      ) : (
        <Box 
          sx={{ 
            maxWidth: '100%', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            mt: 1,
            height: 'calc(100vh - 280px)',
            '@media (max-width: 1024px)': {
              height: 'calc(100vh - 240px)',
            },
            '@media (max-width: 600px)': {
              height: 'calc(100vh - 200px)',
            },
          }}
        >
          <Box 
            px={{ xs: 1, md: 2 }} 
            pb={{ xs: 1, md: 2 }} 
            sx={{ 
              maxWidth: '100%', 
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#555',
              },
            }}
          >
            {detailedLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
              </Box>
            ) : detailedData.length > 0 ? (
              <>
                {detailedData.map((item, index) => renderDetailedCard(item, index))}
              </>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="text.secondary">No products found</Typography>
              </Box>
            )}
          </Box>
          {!detailedLoading && detailedData.length > 0 && (
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                py: { xs: 1, md: 1.5 },
                px: { xs: 1, md: 2 },
                zIndex: 10,
                boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
                maxWidth: '100%',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Box 
                display="flex" 
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={{ xs: 1, sm: 0 }}
                sx={{ maxWidth: '100%' }}
              >
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ maxWidth: '100%' }}>
                  <FormControl size="small" sx={{ minWidth: { xs: 60, md: 70 } }}>
                    <Select
                      value={detailedPageSize}
                      onChange={(e) => {
                        setDetailedPageSize(Number(e.target.value));
                        setDetailedCurrentPage(1);
                      }}
                      sx={{ 
                        bgcolor: 'background.paper',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        height: { xs: '28px', md: '32px' },
                        '& .MuiSelect-select': {
                          py: 0.5,
                          color: 'text.primary',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                      }}
                      displayEmpty
                    >
                      <MenuItem value={10} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>10</MenuItem>
                      <MenuItem value={25} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>25</MenuItem>
                      <MenuItem value={50} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>50</MenuItem>
                      <MenuItem value={100} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>100</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography fontSize={{ xs: 10, md: 12 }} color="text.secondary" sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                    Showing {((detailedCurrentPage - 1) * detailedPageSize) + 1}-{Math.min(detailedCurrentPage * detailedPageSize, detailedTotalItems)} of {detailedTotalItems} items
                  </Typography>
                </Box>
                   <Pagination
                    count={detailedTotalPages}
                    page={detailedCurrentPage}
                    onChange={(_, page) => setDetailedCurrentPage(page)}
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                    sx={{
                      "& .MuiPaginationItem-root": {
                        bgcolor: "background.paper",
                        fontSize: { xs: "0.7rem", md: "0.875rem" },
                        minWidth: { xs: "28px", md: "32px" },
                        height: { xs: "28px", md: "32px" },
                        border: "1px solid",
                        borderColor: "divider",
                        color: "text.primary",
                      },

                      "& .MuiPaginationItem-root.Mui-selected": {
                        bgcolor: "primary.main",
                        color: "#ffffff",
                        borderColor: "primary.main",
                      },

                      "& .MuiPaginationItem-root.Mui-selected:hover": {
                        bgcolor: "primary.dark",
                        color: "#ffffff",
                        borderColor: "primary.dark",
                      },

                      "& .MuiPaginationItem-root:not(.Mui-selected):hover": {
                        bgcolor: "background.paper",
                        color: "grey",
                        borderColor: "primary.main",
                      },
                    }}
                  />
              </Box>
            </Box>
          )}
        </Box>
      )}
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
                      <Typography fontSize={13} fontWeight={400} color="text.primary">{formatValue(selectedProduct.UPCList?.[0]?.UPC_Number)}</Typography>
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
            
            {/* Mark As Bundle Switch */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14 }}>Mark As Bundle</Typography>
                <SwitchInput
                  checked={limitModalData.markAsBundle ?? false}
                  onChange={(checked) => setLimitModalData(prev => ({
                    ...prev,
                    markAsBundle: checked
                  }))}
                  sx={{ mb: 0 }}
                  isShowLabel={false}
                />
              </Box>
            </Grid>
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

      {/* Bulk Image Modal */}
      <CommonModal
        open={bulkImageModalOpen}
        onClose={() => setBulkImageModalOpen(false)}
        title="Bulk Image Upload"
        size="lg"
      >
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" component="div">
              Please upload at most {BULK_IMAGE_MAX_COUNT} images. Each file must be under 1 MB. Name each file using
              only the item number before the extension (for example <strong>12345.jpg</strong>).
            </Typography>
          </Alert>
          <input
            ref={bulkImageFileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleBulkImageFileInputChange}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <CustomButton
              appearance="outlined"
              fullWidth={false}
              icon={<AddPhotoAlternateIcon />}
              iconPosition="left"
              sx={{ mt: 0 }}
              onClick={() => bulkImageFileInputRef.current?.click()}
            >
              Select images
            </CustomButton>
            <Typography variant="body2" color="text.secondary">
              {bulkImageFiles.length} / {BULK_IMAGE_MAX_COUNT} selected
            </Typography>
          </Box>
          {bulkImageFiles.length > 0 && (
            <Box
              sx={{
                maxHeight: 280,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                mb: 2,
              }}
            >
              {bulkImageFiles.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 0.75,
                    px: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }} title={file.name}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </Typography>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleBulkImagePreview(file)}
                    aria-label="Preview file"
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleBulkImageRemoveFile(index)} aria-label="Remove file">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <CustomButton appearance="outlined" onClick={() => setBulkImageModalOpen(false)} fullWidth={false}>
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleBulkImageSubmit}
              disabled={bulkImageSubmitting || bulkImageFiles.length === 0}
              icon={bulkImageSubmitting ? <CircularProgress size={20} /> : null}
              fullWidth={false}
            >
              {bulkImageSubmitting ? 'Uploading...' : 'Upload Images'}
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      <DistrubutorProductDetailModal 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        productId={detailProductId || ''} 
      />

      {/* Print Label Drawer */}
      <Drawer
        anchor="right"
        open={printLabelDrawerOpen}
        onClose={() => {
          if (!printLabelLoading) {
            setPrintLabelDrawerOpen(false);
          }
        }}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, p: 3 }
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography fontSize={18} fontWeight={500}>Print Labels</Typography>
          <IconButton
            onClick={() => {
              if (!printLabelLoading) {
                setPrintLabelDrawerOpen(false);
              }
            }}
            disabled={printLabelLoading}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display="flex" flexDirection="column" gap={3}>
          <FormControl fullWidth>
            <InputLabel>Customer</InputLabel>
            <Select
              value={printLabelSelectedCustomer}
              onChange={(e) => setPrintLabelSelectedCustomer(e.target.value)}
              label="Customer"
              disabled={loadingPrintLabelCustomers}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {printLabelCustomerOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Label Size</InputLabel>
            <Select
              value={printLabelForm.size}
              onChange={(e) => {
                const newSize = e.target.value as any;
                if (newSize === 'A4-30' || newSize === 'A4-5160') {
                  setPrintLabelForm({
                    ...printLabelForm,
                    size: newSize,
                    rows: 10, // Fixed at 10 rows for A4-30 and A4-5160
                  });
                } else {
                  const newColumnCount = newSize.startsWith('A4-') ? parseInt(newSize.split('-')[1]) || 1 : 0;
                  const maxRows = newColumnCount === 4 ? 7 : newColumnCount === 3 ? 5 : newColumnCount === 2 ? 4 : newColumnCount === 1 ? 4 : 1;
                  setPrintLabelForm({
                    ...printLabelForm,
                    size: newSize,
                    rows: newColumnCount > 0 && printLabelForm.rows > maxRows ? maxRows : printLabelForm.rows,
                  });
                }
              }}
              label="Label Size"
            >
              <MenuItem value="4x3">4x3</MenuItem>
              <MenuItem value="4x6">4x6</MenuItem>
              <MenuItem value="3x6">3x6</MenuItem>
              <MenuItem value="3x2">3x2</MenuItem>
              <MenuItem value="4x4">4x4</MenuItem>
              <MenuItem value="2x2">2x2</MenuItem>
              <MenuItem value="2x3">2x3</MenuItem>
              <MenuItem value="3x3">3x3</MenuItem>
              <MenuItem value="5x3">5x3</MenuItem>
              <MenuItem value="6x4">6x4</MenuItem>
              <MenuItem value="A4">A4</MenuItem>
              <MenuItem value="A4-1">A4 (1 Column)</MenuItem>
              <MenuItem value="A4-2">A4 (2 Columns)</MenuItem>
              <MenuItem value="A4-3">A4 (3 Columns)</MenuItem>
              <MenuItem value="A4-4">A4 (4 Columns)</MenuItem>
              <MenuItem value="A4-30">A4 (30 Labels - 3x10)</MenuItem>
              <MenuItem value="A4-5160">Avery 5160 (30 Labels - 3x10)</MenuItem>
            </Select>
          </FormControl>

          {(printLabelForm.size.startsWith('A4-') && printLabelForm.size !== 'A4-30' && printLabelForm.size !== 'A4-5160') && (() => {
            const columnCount = parseInt(printLabelForm.size.split('-')[1]) || 1;
            const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
            const rowOptions = [];
            for (let i = 1; i <= maxRows; i++) {
              rowOptions.push(i);
            }
            const currentRows = Math.min(printLabelForm.rows, maxRows);
            
            return (
              <FormControl fullWidth>
                <InputLabel>Rows per Page</InputLabel>
                <Select
                  value={currentRows}
                  onChange={(e) =>
                    setPrintLabelForm({
                      ...printLabelForm,
                      rows: Number(e.target.value),
                    })
                  }
                  label="Rows per Page"
                >
                  {rowOptions.map(row => (
                    <MenuItem key={row} value={row}>{row}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })()}

          <FormControl fullWidth>
            <InputLabel>Display Orientation</InputLabel>
            <Select
              value={printLabelForm.orientation}
              onChange={(e) =>
                setPrintLabelForm({
                  ...printLabelForm,
                  orientation: e.target.value as any,
                })
              }
              label="Display Orientation"
            >
              <MenuItem value="portrait">Portrait</MenuItem>
              <MenuItem value="landscape">Landscape</MenuItem>
            </Select>
          </FormControl>

          <MultiSearchableDropdown
            options={salesCategoryOptions}
            value={printLabelForm.salesCategory}
            onChange={(options) => {
              setPrintLabelForm({
                ...printLabelForm,
                salesCategory: options
              });
            }}
            loading={loadingSalesCategory}
            placeholder="Select sales categories (All if empty)"
            sx={{ mb: 0, width: '100%', fontSize: "14px" }}
          />

          <MultiSearchableDropdown
            options={priceClassOptions}
            value={printLabelForm.priceClass}
            onChange={(options) => {
              setPrintLabelForm({
                ...printLabelForm,
                priceClass: options
              });
            }}
            loading={loadingPriceClass}
            placeholder="Select sub category (All if empty)"
            sx={{ mb: 0, width: '100%', fontSize: "14px" }}
          />

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <CustomButton
              appearance="outlined"
              onClick={() => {
                setPrintLabelDrawerOpen(false);
              }}
              fullWidth={false}
              disabled={printLabelLoading}
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handlePrintLabels}
              fullWidth={false}
              loading={printLabelLoading}
              disabled={printLabelLoading}
              sx={{ mt: 0 }}
            >
              Generate Labels
            </CustomButton>
          </Box>
        </Box>
      </Drawer>

      {/* Individual Product Print Modal */}
      <CommonModal
        open={individualPrintModalOpen}
        onClose={() => {
          if (!individualPrintLoading) {
            setIndividualPrintModalOpen(false);
          }
        }}
        title="Print Product Label"
        size="sm"
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth>
            <InputLabel>Label Size</InputLabel>
            <Select
              value={individualPrintForm.size}
              onChange={(e) => {
                const newSize = e.target.value as any;
                const newColumnCount = newSize.startsWith('A4-') ? parseInt(newSize.split('-')[1]) || 1 : 0;
                const maxRows = newColumnCount === 4 ? 7 : newColumnCount === 3 ? 5 : newColumnCount === 2 ? 4 : newColumnCount === 1 ? 4 : 1;
                setIndividualPrintForm({
                  ...individualPrintForm,
                  size: newSize,
                  rows: newColumnCount > 0 && individualPrintForm.rows > maxRows ? maxRows : individualPrintForm.rows,
                });
              }}
              label="Label Size"
            >
              <MenuItem value="4x3">4x3</MenuItem>
              <MenuItem value="4x6">4x6</MenuItem>
              <MenuItem value="3x6">3x6</MenuItem>
              <MenuItem value="3x2">3x2</MenuItem>
              <MenuItem value="4x4">4x4</MenuItem>
              <MenuItem value="2x2">2x2</MenuItem>
              <MenuItem value="2x3">2x3</MenuItem>
              <MenuItem value="3x3">3x3</MenuItem>
              <MenuItem value="5x3">5x3</MenuItem>
              <MenuItem value="6x4">6x4</MenuItem>
              <MenuItem value="A4">A4</MenuItem>
              {/* <MenuItem value="A4-1">A4 (1 Column)</MenuItem>
              <MenuItem value="A4-2">A4 (2 Columns)</MenuItem>
              <MenuItem value="A4-3">A4 (3 Columns)</MenuItem>
              <MenuItem value="A4-4">A4 (4 Columns)</MenuItem> */}
            </Select>
          </FormControl>

          {(individualPrintForm.size.startsWith('A4-')) && (() => {
            const columnCount = parseInt(individualPrintForm.size.split('-')[1]) || 1;
            const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
            const rowOptions = [];
            for (let i = 1; i <= maxRows; i++) {
              rowOptions.push(i);
            }
            const currentRows = Math.min(individualPrintForm.rows, maxRows);
            
            return (
              <FormControl fullWidth>
                <InputLabel>Rows per Page</InputLabel>
                <Select
                  value={currentRows}
                  onChange={(e) =>
                    setIndividualPrintForm({
                      ...individualPrintForm,
                      rows: Number(e.target.value),
                    })
                  }
                  label="Rows per Page"
                >
                  {rowOptions.map(row => (
                    <MenuItem key={row} value={row}>{row}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })()}

          <FormControl fullWidth>
            <InputLabel>Display Orientation</InputLabel>
            <Select
              value={individualPrintForm.orientation}
              onChange={(e) =>
                setIndividualPrintForm({
                  ...individualPrintForm,
                  orientation: e.target.value as any,
                })
              }
              label="Display Orientation"
            >
              <MenuItem value="portrait">Portrait</MenuItem>
              <MenuItem value="landscape">Landscape</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <CustomButton
              appearance="outlined"
              onClick={() => {
                setIndividualPrintModalOpen(false);
              }}
              fullWidth={false}
              disabled={individualPrintLoading}
              sx={{ mt: 0 }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleIndividualPrint}
              fullWidth={false}
              loading={individualPrintLoading}
              disabled={individualPrintLoading}
              sx={{ mt: 0 }}
            >
              Generate Label
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Loss Qty Report Modal */}
      <LossQtyReportModal
        open={lossQtyReportModalOpen}
        onClose={() => setLossQtyReportModalOpen(false)}
        groupBy="item"
      />
    </Box>
  );
};

export default Product;
