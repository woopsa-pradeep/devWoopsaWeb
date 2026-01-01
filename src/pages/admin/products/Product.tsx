import React, { useEffect, useState } from 'react';
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
  } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import UpdateIcon from '@mui/icons-material/Update';
import EventIcon from '@mui/icons-material/Event';
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

// Barcode cache outside component to persist across renders
const barcodeCache = new Map<string, string>();

const Product = () => {
  const navigate = useNavigate();
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
    QtyLimit: 0,
    markAsBundle: false
  });
  const [savingLimit, setSavingLimit] = useState(false);

  // Print Label states
  const [printLabelDrawerOpen, setPrintLabelDrawerOpen] = useState(false);
  const [printLabelForm, setPrintLabelForm] = useState({
    size: '4x6' as "4x3" | "4x6" | "3x6" | "3x2" | "4x4" | "2x2" | "2x3" | "3x3" | "5x3" | "6x4" | "A4" | "A4-1" | "A4-2" | "A4-3" | "A4-4",
    orientation: 'landscape' as "landscape" | "portrait",
    salesCategory: [] as FilterOption[],
    priceClass: [] as FilterOption[],
    rows: 1 as number,
    columns: 1 as number,
  });
  const [printLabelLoading, setPrintLabelLoading] = useState(false);
  const [individualPrintModalOpen, setIndividualPrintModalOpen] = useState(false);
  const [individualPrintProduct, setIndividualPrintProduct] = useState<Product | null>(null);
  const [individualPrintForm, setIndividualPrintForm] = useState({
    size: '4x6' as "4x3" | "4x6" | "3x6" | "3x2" | "4x4" | "2x2" | "2x3" | "3x3" | "5x3" | "6x4" | "A4" | "A4-1" | "A4-2" | "A4-3" | "A4-4",
    orientation: 'landscape' as "landscape" | "portrait",
    rows: 1 as number,
    columns: 1 as number,
  });
  const [individualPrintLoading, setIndividualPrintLoading] = useState(false);


  useEffect(() => {
    fetchSalesCategories();
    fetchPriceClasses();
  }, []);

  // Reset rows when column count changes for A4 layouts
  useEffect(() => {
    if (printLabelForm.size.startsWith('A4-')) {
      const columnCount = parseInt(printLabelForm.size.split('-')[1]) || 1;
      const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
      if (printLabelForm.rows > maxRows) {
        setPrintLabelForm(prev => ({ ...prev, rows: maxRows }));
      }
    }
  }, [printLabelForm.size]);

  useEffect(() => {
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
    const columnCount = isA4Column ? parseInt(size.split('-')[1]) : 1;
    
    if (size === 'A4' || isA4Column) {
      pageWidth = '8.27in';
      pageHeight = '11.69in';
    } else {
      const [width, height] = size.split('x').map(Number);
      const isLandscape = orientation === 'landscape';
      // Swap dimensions for landscape
      pageWidth = isLandscape ? `${height}in` : `${width}in`;
      pageHeight = isLandscape ? `${width}in` : `${height}in`;
    }

    // Calculate responsive sizes based on label dimensions, orientation, and rows
    const getSize = (base: number) => {
      if (isA4Column) {
        // Calculate size multiplier based on column count and rows
        // Fewer rows = larger labels (more space per label)
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
      const isLandscape = orientation === 'landscape';
      const effectiveWidth = isLandscape ? h : w;
      const effectiveHeight = isLandscape ? w : h;
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
        grid-template-columns: 1fr 1fr;
        gap: ${size === 'A4' ? '0.06in' : '0.05in'};
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
        padding: 0.1in;
        display: grid;
        grid-template-columns: ${isA4Column && columnCount === 4 ? 'repeat(4, 1fr)' : 
                                isA4Column && columnCount === 3 ? 'repeat(3, 1fr)' : 
                                isA4Column && columnCount === 2 ? 'repeat(2, 1fr)' : 
                                isA4Column && columnCount === 1 ? '1fr' : '1fr'};
        grid-template-rows: ${isA4Column ? `repeat(${rows}, 1fr)` : '1fr'};
        grid-auto-rows: 0;
        overflow: hidden;
        gap: 0.1in;
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
      const pack = product.Pack || 'N/A';
      const caseCount = product.CaseCount || 'N/A';
      const productName = (product.Description || product.Item_Name || 'N/A').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const itemNumber = product.Item_Number || 'N/A';

      // Check if it's a small size (2x2, 2x3, 3x2)
      const isSmallSize = size === '2x2' || size === '2x3' || size === '3x2';
      // Check if it's a square size (4x4, 3x3)
      const isSquareSize = size === '4x4' || size === '3x3';

      // Handle A4 column layouts
      if (isA4Column) {
        if (columnCount === 4) {
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
                    <span class="label-detail-label">ITEM NUMBER:</span>
                    <span class="label-detail-value">${itemNumber}</span>
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
                    <span class="label-detail-label">ITEM NUMBER:</span>
                    <span class="label-detail-value">${itemNumber}</span>
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
    const itemsPerPage = isA4Column ? (columnCount * rows) : 1;
    
    // For A4 columns, we need to track items across chunks to create proper pages
    const pageBuffer: Product[] = [];

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalProducts);
      const chunk = products.slice(currentIndex, endIndex);
      
      // Generate HTML without barcodes (fast)
      let chunkHTML = '';
      
      if (isA4Column) {
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
        if (isA4Column && pageBuffer.length > 0) {
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
      
      // Fetch all products using productList with high limit
      const params = {
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
      
      const res: any = await productList(params);
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
            <Tooltip title="View Details">
              <VisibilityOutlinedIcon 
                sx={{ fontSize: 20, color: 'primary.main', cursor: 'pointer' }} 
                onClick={() => {
                  setDetailProductId(row.Item_Number);
                  setDetailModalOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Edit Product">
              <EditIcon 
                sx={{ fontSize: 20, color: 'primary.main', cursor: 'pointer' }} 
                onClick={() => {
                  navigate(`/admin/product/edit/${row.Item_Number}`);
                }}
              />
            </Tooltip>
            <Tooltip title="Set Product Limit">
              <SettingsIcon 
                sx={{ fontSize: 20, color: 'secondary.main', cursor: 'pointer' }} 
                onClick={() => handleLimitClick(row)}
              />
            </Tooltip>
            <Tooltip title="Print Label">
              <PrintIcon 
                sx={{ fontSize: 20, color: 'info.main', cursor: 'pointer' }} 
                onClick={() => {
                  setIndividualPrintProduct(row);
                  setIndividualPrintModalOpen(true);
                }}
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
          <Box display="flex" gap={2}>
            <CustomButton 
              fullWidth={false}
              onClick={() => navigate('/admin/products/future-pricing')}
              icon={<EventIcon sx={{ fontSize: 20 }} />}
              iconPosition="left"
              sx={{ mt: 0 }} 
            >
              Future Pricing
            </CustomButton>
            <CustomButton 
              fullWidth={false}
              onClick={() => navigate('/admin/products/bulk-update')}
              icon={<UpdateIcon sx={{ fontSize: 20 }} />}
              iconPosition="left"
              sx={{ mt: 0 }} 
            >
              Bulk Update
            </CustomButton>
            <CustomButton 
              fullWidth={false}
              onClick={() => setPrintLabelDrawerOpen(true)}
              icon={<PrintIcon sx={{ fontSize: 20 }} />}
              iconPosition="left"
              sx={{ mt: 0 }} 
            >
              Print Label
            </CustomButton>
            <CustomButton 
              fullWidth={false}
              onClick={() => navigate('/admin/product/add')}
              icon={<AddIcon sx={{ fontSize: 20 }} />}
              iconPosition="left"
              sx={{ mt: 0 }} 
            >
              Add Product
            </CustomButton>  
          </Box>
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
            <InputLabel>Label Size</InputLabel>
            <Select
              value={printLabelForm.size}
              onChange={(e) => {
                const newSize = e.target.value as any;
                const newColumnCount = newSize.startsWith('A4-') ? parseInt(newSize.split('-')[1]) || 1 : 0;
                const maxRows = newColumnCount === 4 ? 7 : newColumnCount === 3 ? 5 : newColumnCount === 2 ? 4 : newColumnCount === 1 ? 4 : 1;
                setPrintLabelForm({
                  ...printLabelForm,
                  size: newSize,
                  rows: newColumnCount > 0 && printLabelForm.rows > maxRows ? maxRows : printLabelForm.rows,
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
              <MenuItem value="A4-1">A4 (1 Column)</MenuItem>
              <MenuItem value="A4-2">A4 (2 Columns)</MenuItem>
              <MenuItem value="A4-3">A4 (3 Columns)</MenuItem>
              <MenuItem value="A4-4">A4 (4 Columns)</MenuItem>
            </Select>
          </FormControl>

          {(printLabelForm.size.startsWith('A4-')) && (() => {
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
    </Box>
  );
};

export default Product;
