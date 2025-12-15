import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { productList } from '../../../redux/apis/distrubutor/productApis';
import { MultiSearchableDropdown } from '../../../component/atoms/SearchableDropdown';
import { getSalesCategoryList, getPriceClassList, getCustomerList } from '../../../redux/apis/distrubutor/listApis';
import img from '../../../assets/Default-Product-Image.jpg';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useTheme } from '@mui/material';
import Switch from '@mui/material/Switch';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JsBarcode = require('jsbarcode');
// eslint-disable-next-line @typescript-eslint/no-require-imports
let html2canvas: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  html2canvas = require('html2canvas');
} catch (_e) {
  console.log(_e);
  console.warn('html2canvas not available, PDF download will use alternative method');
}
import jsPDF from 'jspdf';

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

interface Customer {
  C_Number: number;
  C_Name: string;
  C_CoName?: string;
}

interface LabelFieldOptions {
  image: boolean;
  itemNumber: boolean;
  description: boolean;
  pack: boolean;
  caseCount: boolean;
  price: boolean;
  barcode: boolean;
  customerName: boolean;
  customerNumber: boolean;
}

// Barcode cache outside component to persist across renders
const barcodeCache = new Map<string, string>();

const InventoryLabelTab = () => {
  const theme = useTheme();
  const [salesCategory, setSalesCategory] = useState<FilterOption[]>([]);
  const [priceClass, setPriceClass] = useState<FilterOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<FilterOption[]>([]);
  const [priceClassOptions, setPriceClassOptions] = useState<FilterOption[]>([]);
  const [customerOptions, setCustomerOptions] = useState<FilterOption[]>([]);
  const [loadingSalesCategory, setLoadingSalesCategory] = useState(false);
  const [loadingPriceClass, setLoadingPriceClass] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Label form state
  const [labelForm, setLabelForm] = useState({
    size: '4x6' as "4x3" | "4x6" | "3x6" | "3x2" | "4x4" | "2x2" | "2x3" | "3x3" | "5x3" | "6x4" | "A4" | "A4-1" | "A4-2" | "A4-3" | "A4-4",
    orientation: 'landscape' as "landscape" | "portrait",
    rows: 1 as number,
    columns: 1 as number,
  });

  // Field selection state - all true by default, customer fields false
  const [fieldOptions, setFieldOptions] = useState<LabelFieldOptions>({
    image: true,
    itemNumber: true,
    description: true,
    pack: true,
    caseCount: true,
    price: true,
    barcode: true,
    customerName: false,
    customerNumber: false,
  });

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSalesCategories();
    fetchPriceClasses();
    fetchCustomers();
  }, []);

  // Reset rows when column count changes for A4 layouts and set orientation to portrait
  useEffect(() => {
    if (labelForm.size.startsWith('A4-')) {
      const columnCount = parseInt(labelForm.size.split('-')[1]) || 1;
      const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
      setLabelForm(prev => ({
        ...prev,
        rows: prev.rows > maxRows ? maxRows : prev.rows,
        orientation: 'portrait' // A4 columns always use portrait
      }));
    }
  }, [labelForm.size]);

  // Helper function to determine if image should be available for current size
  const isImageAvailableForSize = (size: string): boolean => {
    // Small sizes where image doesn't fit well
    const smallSizes = ['2x2', '2x3', '3x2'];
    if (smallSizes.includes(size)) {
      return false;
    }
    // A4-4 columns are too small for images
    if (size === 'A4-4') {
      return false;
    }
    return true;
  };

  // Auto-disable image when switching to sizes that don't support it
  useEffect(() => {
    if (!isImageAvailableForSize(labelForm.size) && fieldOptions.image) {
      setFieldOptions(prev => ({ ...prev, image: false }));
    }
  }, [labelForm.size]);

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

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await getCustomerList() as any;
      const customerList = response?.data?.data || [];
      setCustomerOptions(customerList?.map((cust: Customer) => {
        return {
          label: `${cust.C_Number} - ${cust.C_Name}`,
          value: cust.C_Number.toString()
        }
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Generate barcode image data URL - size-dependent
  const generateBarcodeImage = (upc: string, size: string = labelForm.size, orientation: string = labelForm.orientation): string | null => {
    try {
      if (!upc || upc === 'N/A' || upc.trim() === '') {
        return null;
      }

      // Clean UPC value
      const upcValue = upc.toString().trim().replace(/\D/g, '');
      if (upcValue.length < 8) {
        return null;
      }

      // Calculate barcode dimensions based on label size
      let barcodeHeight = 40;
      let barcodeWidth = 1.5;
      let canvasWidth = 200;
      let canvasHeight = 60;

      // Check if A4 column layout
      const isA4Column = size.startsWith('A4-');
      if (isA4Column) {
        const columnCount = parseInt(size.split('-')[1]) || 1;
        if (columnCount === 4) {
          barcodeHeight = 20;
          barcodeWidth = 1.2;
          canvasWidth = 150;
          canvasHeight = 30;
        } else if (columnCount === 3) {
          barcodeHeight = 28;
          barcodeWidth = 1.3;
          canvasWidth = 170;
          canvasHeight = 40;
        } else if (columnCount === 2) {
          barcodeHeight = 35;
          barcodeWidth = 1.4;
          canvasWidth = 180;
          canvasHeight = 50;
        } else if (columnCount === 1) {
          barcodeHeight = 45;
          barcodeWidth = 1.5;
          canvasWidth = 200;
          canvasHeight = 60;
        }
      } else if (size === 'A4') {
        barcodeHeight = 50;
        barcodeWidth = 1.6;
        canvasWidth = 220;
        canvasHeight = 70;
      } else {
        // Calculate based on label dimensions
        const [w, h] = size.split('x').map(Number);
        const isLandscape = orientation === 'landscape';
        const effectiveWidth = isLandscape ? h : w;
        const effectiveHeight = isLandscape ? w : h;
        const area = effectiveWidth * effectiveHeight;
        
        // Scale barcode based on label area
        if (area >= 24) {
          // Large labels (4x6, 6x4, etc.)
          barcodeHeight = 50;
          barcodeWidth = 1.6;
          canvasWidth = 220;
          canvasHeight = 70;
        } else if (area >= 12) {
          // Medium labels (4x3, 3x4, etc.)
          barcodeHeight = 40;
          barcodeWidth = 1.5;
          canvasWidth = 200;
          canvasHeight = 60;
        } else {
          // Small labels (2x2, 2x3, 3x2, etc.)
          barcodeHeight = 25;
          barcodeWidth = 1.2;
          canvasWidth = 150;
          canvasHeight = 35;
        }
      }

      // Create cache key that includes size for different barcode sizes
      const cacheKey = `${upcValue}_${size}_${orientation}`;
      if (barcodeCache.has(cacheKey)) {
        return barcodeCache.get(cacheKey)!;
      }

      // Generate synchronously but with optimized settings
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      JsBarcode(canvas, upcValue, {
        format: 'CODE128',
        width: barcodeWidth,
        height: barcodeHeight,
        displayValue: false,
        fontSize: 0,
        margin: 3,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const dataUrl = canvas.toDataURL('image/png');
      barcodeCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate barcode:', error);
      return null;
    }
  };

  // Get customer info for selected customer
  const getCustomerInfo = (): { names: string[]; numbers: string[] } => {
    if (!selectedCustomer) return { names: [], numbers: [] };
    
    const option = customerOptions.find(opt => opt.value === selectedCustomer);
    if (option) {
      const parts = option.label.split(' - ');
      return {
        names: [parts[1] || option.label],
        numbers: [parts[0] || selectedCustomer]
      };
    }

    return {
      names: [],
      numbers: [selectedCustomer]
    };
  };

  // Generate label HTML for a product (without barcode for A4 columns)
  const generateLabelWithoutBarcode = (product: Product, size: string, isA4Column: boolean, columnCount: number, orientation: string = labelForm.orientation) => {
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

    // Get customer info
    const customerInfo = getCustomerInfo();
    const customerNameText = customerInfo.names.length > 0 ? customerInfo.names.join(', ') : '';
    const customerNumberText = customerInfo.numbers.length > 0 ? customerInfo.numbers.join(', ') : '';

    // Handle A4 column layouts
    if (isA4Column) {
      if (columnCount === 4) {
        // 4 columns: compact layout
        let content = '';
        if (fieldOptions.itemNumber) {
          content += `<div class="label-item-number">${itemNumber}</div>`;
        }
        if (fieldOptions.description) {
          content += `<div class="label-item-description">${productName}</div>`;
        }
        let details = '';
        if (fieldOptions.pack || fieldOptions.caseCount) {
          details = '<div class="label-item-details">';
          if (fieldOptions.pack) details += `<span>P: ${pack}</span>`;
          if (fieldOptions.caseCount) details += `<span>C: ${caseCount}</span>`;
          details += '</div>';
        }
        if (fieldOptions.customerName && customerNameText) {
          content += `<div style="font-size: 0.7em; color: #666;">${customerNameText}</div>`;
        }
        if (fieldOptions.customerNumber && customerNumberText) {
          content += `<div style="font-size: 0.7em; color: #666;">#${customerNumberText}</div>`;
        }
        return `
          <div class="label-item-a4-4" data-upc="${upc}">
            ${content}
            ${details}
            ${fieldOptions.barcode ? `<div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>` : ''}
          </div>
        `;
      } else if (columnCount === 3) {
        // 3 columns: with price
        let content = '';
        if (fieldOptions.itemNumber) {
          content += `<div class="label-item-number">${itemNumber}</div>`;
        }
        if (fieldOptions.description) {
          content += `<div class="label-item-description">${productName}</div>`;
        }
        let details = '';
        if (fieldOptions.pack || fieldOptions.caseCount || fieldOptions.price) {
          details = '<div class="label-item-details">';
          if (fieldOptions.pack) details += `<span>P: ${pack}</span>`;
          if (fieldOptions.caseCount) details += `<span>C: ${caseCount}</span>`;
          if (fieldOptions.price) details += `<span class="label-item-price">$${price}</span>`;
          details += '</div>';
        }
        if (fieldOptions.customerName && customerNameText) {
          content += `<div style="font-size: 0.8em; color: #666;">${customerNameText}</div>`;
        }
        if (fieldOptions.customerNumber && customerNumberText) {
          content += `<div style="font-size: 0.8em; color: #666;">#${customerNumberText}</div>`;
        }
        return `
          <div class="label-item-a4-3" data-upc="${upc}">
            ${content}
            ${details}
            ${fieldOptions.barcode ? `<div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>` : ''}
          </div>
        `;
      } else if (columnCount === 2) {
        // 2 columns: with image
        let imageSection = '';
        if (fieldOptions.image) {
          imageSection = `
            <div class="label-item-image">
              <img src="${productImage}" alt="${productName}" onerror="this.onerror=null; this.src='${img}';" />
            </div>
          `;
        }
        let infoContent = '';
        if (fieldOptions.description) {
          infoContent += `<div class="label-item-description">${productName}</div>`;
        }
        if (fieldOptions.itemNumber) {
          infoContent += `<div class="label-item-number-row">${itemNumber}</div>`;
        }
        let details = '';
        if (fieldOptions.pack || fieldOptions.caseCount || fieldOptions.price) {
          details = '<div class="label-item-details">';
          if (fieldOptions.pack) details += `<div><span>PACK:</span><span>${pack}</span></div>`;
          if (fieldOptions.caseCount) details += `<div><span>CASE:</span><span>${caseCount}</span></div>`;
          if (fieldOptions.price) details += `<div class="label-item-price">$${price}</div>`;
          details += '</div>';
        }
        if (fieldOptions.customerName && customerNameText) {
          infoContent += `<div style="font-size: 0.85em; color: #666; margin-top: 0.02in;">${customerNameText}</div>`;
        }
        if (fieldOptions.customerNumber && customerNumberText) {
          infoContent += `<div style="font-size: 0.85em; color: #666;">#${customerNumberText}</div>`;
        }
        return `
          <div class="label-item-a4-2" data-upc="${upc}">
            ${imageSection}
            <div class="label-item-info">
              ${infoContent}
              ${details}
              ${fieldOptions.barcode ? `<div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>` : ''}
            </div>
          </div>
        `;
      } else if (columnCount === 1) {
        // 1 column: full layout with image
        let imageSection = '';
        if (fieldOptions.image) {
          imageSection = `
            <div class="label-item-image">
              <img src="${productImage}" alt="${productName}" onerror="this.onerror=null; this.src='${img}';" />
            </div>
          `;
        }
        let infoContent = '';
        if (fieldOptions.description) {
          infoContent += `<div class="label-item-description">${productName}</div>`;
        }
        if (fieldOptions.itemNumber) {
          infoContent += `<div class="label-item-number-row">${itemNumber}</div>`;
        }
        let details = '';
        if (fieldOptions.pack || fieldOptions.caseCount || fieldOptions.price) {
          details = '<div class="label-item-details">';
          if (fieldOptions.pack) details += `<div><span>PACK:</span><span>${pack}</span></div>`;
          if (fieldOptions.caseCount) details += `<div><span>CASE:</span><span>${caseCount}</span></div>`;
          if (fieldOptions.price) details += `<div class="label-item-price">$${price}</div>`;
          details += '</div>';
        }
        if (fieldOptions.customerName && customerNameText) {
          infoContent += `<div style="font-size: 0.9em; color: #666; margin-top: 0.03in;">${customerNameText}</div>`;
        }
        if (fieldOptions.customerNumber && customerNumberText) {
          infoContent += `<div style="font-size: 0.9em; color: #666;">#${customerNumberText}</div>`;
        }
        return `
          <div class="label-item-a4-1" data-upc="${upc}">
            ${imageSection}
            <div class="label-item-info-wrapper">
              ${infoContent}
              ${details}
              ${fieldOptions.barcode ? `<div class="label-item-barcode" data-barcode-placeholder="${upc}"></div>` : ''}
            </div>
          </div>
        `;
      }
    }

    // Regular label layout (non-A4 columns)
    const barcodeImage = fieldOptions.barcode ? generateBarcodeImage(upc, size, orientation) : null;
    let detailsHTML = '';
    if (fieldOptions.itemNumber) {
      detailsHTML += `<div class="label-detail-item">
        <span class="label-detail-label">ITEM NUMBER:</span>
        <span class="label-detail-value">${itemNumber}</span>
      </div>`;
    }
    if (fieldOptions.pack) {
      detailsHTML += `<div class="label-detail-item">
        <span class="label-detail-label">PACK:</span>
        <span class="label-detail-value">${pack}</span>
      </div>`;
    }
    if (fieldOptions.caseCount) {
      detailsHTML += `<div class="label-detail-item">
        <span class="label-detail-label">CASE:</span>
        <span class="label-detail-value">${caseCount}</span>
      </div>`;
    }
    if (fieldOptions.price) {
      detailsHTML += `<div class="label-detail-item price-item">
        <span class="label-detail-value price-value">$${price}</span>
      </div>`;
    }
    if (fieldOptions.customerName && customerNameText) {
      detailsHTML += `<div class="label-detail-item">
        <span class="label-detail-label">CUSTOMER:</span>
        <span class="label-detail-value">${customerNameText}</span>
      </div>`;
    }
    if (fieldOptions.customerNumber && customerNumberText) {
      detailsHTML += `<div class="label-detail-item">
        <span class="label-detail-label">CUSTOMER #:</span>
        <span class="label-detail-value">${customerNumberText}</span>
      </div>`;
    }

    return `
      <div class="label-container" data-upc="${upc}">
        <div class="label-content">
          ${fieldOptions.image ? `
          <div class="label-image-section">
            <img src="${productImage}" alt="${productName}" class="label-image" onerror="this.onerror=null; this.src='${img}';" />
          </div>
          ` : ''}
          <div class="label-info-section">
            ${fieldOptions.description ? `<div class="label-description">${productName}</div>` : ''}
            <div class="label-details-grid">
              ${detailsHTML}
            </div>
            ${barcodeImage ? `
            <div class="label-barcode-section">
              <img src="${barcodeImage}" alt="Barcode" class="label-barcode" />
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  };

  // Generate and print labels
  const generateAndPrintLabels = async (products: Product[], size: string, orientation: string, rows: number = 1, downloadAsPDF: boolean = false) => {
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
        const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
        const rowMultiplier = maxRows / rows;
        
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
      
      // More aggressive scaling for smaller labels
      if (area >= 24) return `${base * 1.1}px`;  // Large labels (4x6, 6x4, etc.)
      if (area >= 18) return `${base * 1.0}px`;  // Medium-large (3x6, 4x4, etc.)
      if (area >= 12) return `${base * 0.9}px`;   // Medium (4x3, 3x4, etc.)
      if (area >= 9) return `${base * 0.75}px`;   // Small-medium (3x3, etc.)
      return `${base * 0.65}px`;                  // Small labels (2x2, 2x3, 3x2, etc.)
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
      .label-image-section {
        width: ${orientation === 'landscape' ? '40%' : '38%'};
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        padding: ${size === 'A4' ? '0.05in' : '0.04in'};
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
      .label-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${size === 'A4' ? '0.06in' : '0.05in'};
        flex: 1;
      }
      .label-detail-item {
        display: flex;
        flex-direction: column;
        gap: ${size === 'A4' ? '0.02in' : '0.015in'};
        padding: ${size === 'A4' ? '0.04in' : '0.03in'};
        background: #ffffff;
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
      .label-detail-value.price-value {
        font-size: ${getSize(24)};
        color: #dc2626;
        font-weight: 900;
        letter-spacing: 0.5px;
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

    // Calculate items per page: columns * rows
    const itemsPerPage = isA4Column ? (columnCount * rows) : 1;
    
    // For A4 columns, we need to track items across chunks to create proper pages
    const pageBuffer: Product[] = [];

    if (downloadAsPDF) {
      // Generate PDF
      if (!html2canvas) {
        toast.error('PDF generation requires html2canvas. Please install it: npm install html2canvas');
        return;
      }

      try {
        const pdf = new jsPDF({
          orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
          unit: 'in',
          format: size === 'A4' || isA4Column ? 'a4' : [parseFloat(pageWidth), parseFloat(pageHeight)]
        });

        // Create a temporary container for labels
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = pageWidth;
        tempContainer.style.height = pageHeight;
        tempContainer.style.background = '#ffffff';
        document.body.appendChild(tempContainer);

        // Generate HTML for all labels
        let allLabelsHTML = '';
        
        if (isA4Column) {
          // Group products into pages
          for (let i = 0; i < products.length; i += itemsPerPage) {
            const pageItems = products.slice(i, i + itemsPerPage);
            allLabelsHTML += `<div class="label-container-a4-multi">`;
            pageItems.forEach(product => {
              allLabelsHTML += generateLabelWithoutBarcode(product, size, isA4Column, columnCount);
            });
            allLabelsHTML += `</div>`;
          }
        } else {
          products.forEach(product => {
            allLabelsHTML += generateLabelWithoutBarcode(product, size, isA4Column, columnCount);
          });
        }

        tempContainer.innerHTML = `
          <style>${styles}</style>
          ${allLabelsHTML}
        `;

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Add barcodes for A4 columns
        if (isA4Column && fieldOptions.barcode) {
          const barcodePlaceholders = tempContainer.querySelectorAll('[data-barcode-placeholder]');
          for (let i = 0; i < barcodePlaceholders.length; i++) {
            const placeholder = barcodePlaceholders[i] as HTMLElement;
            const upc = placeholder.getAttribute('data-barcode-placeholder') || '';
            if (upc) {
              const barcodeImage = generateBarcodeImage(upc, size, orientation);
              if (barcodeImage) {
                placeholder.innerHTML = `<img src="${barcodeImage}" alt="Barcode" class="label-barcode" />`;
                placeholder.removeAttribute('data-barcode-placeholder');
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Convert each page to canvas and add to PDF
        const pageContainers = isA4Column 
          ? tempContainer.querySelectorAll('.label-container-a4-multi')
          : tempContainer.querySelectorAll('.label-container');
        
        for (let i = 0; i < pageContainers.length; i++) {
          const pageContainer = pageContainers[i] as HTMLElement;
          
          if (i > 0) {
            pdf.addPage();
          }

          const canvas = await html2canvas(pageContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: pageContainer.offsetWidth,
            height: pageContainer.offsetHeight
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }

        // Clean up
        document.body.removeChild(tempContainer);

        // Save PDF
        pdf.save(`inventory-labels-${new Date().getTime()}.pdf`);
        toast.success('PDF downloaded successfully!');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try printing instead.');
      }
    } else {
      // Print labels
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
          <title>Inventory Labels</title>
          <style>${styles}</style>
        </head>
        <body>
      `);
      printWindow.document.close();

      // Process in optimized chunks - generate HTML first (fast), barcodes later (slow)
      const CHUNK_SIZE = products.length > 1000 ? 50 : products.length > 500 ? 25 : 10;
      let currentIndex = 0;
      const totalProducts = products.length;

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
              chunkHTML += generateLabelWithoutBarcode(pageItems[j], size, isA4Column, columnCount);
            }
            chunkHTML += `</div>`;
          }
        } else {
          // Regular labels
          for (let i = 0; i < chunk.length; i++) {
            chunkHTML += generateLabelWithoutBarcode(chunk[i], size, isA4Column, columnCount);
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
              finalPageHTML += generateLabelWithoutBarcode(pageBuffer[j], size, isA4Column, columnCount);
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
                  const barcodeImage = generateBarcodeImage(upc, size, orientation);
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
    }
  };

  // Handle generate labels
  const handleGenerateLabels = async (downloadAsPDF: boolean = false) => {
    try {
      setGenerating(true);
      toast.loading('Fetching products...', { id: 'fetch-products' });
      
      // Fetch all products using productList with high limit
      const params = {
        search: '', // Can be enhanced with search functionality later
        page: 1,
        limit: 100000,
        salesCategoryId: salesCategory.length > 0 
          ? salesCategory.map(cat => Number(cat.value))
          : [],
        priceClassId: priceClass.length > 0
          ? priceClass.map(pc => Number(pc.value))
          : [],
      };
      
      const res: any = await productList(params);
      const allProducts: Product[] = res?.data?.data?.finalProductList || [];
      
      if (!Array.isArray(allProducts) || allProducts.length === 0) {
        toast.error('No products found', { id: 'fetch-products' });
        return;
      }

      toast.success(`Generating ${allProducts.length} labels...`, { id: 'fetch-products' });
      
      setGenerating(false);
      
      // Dismiss toast immediately
      toast.dismiss('fetch-products');
      
      // Multiple yields to ensure UI is completely free before starting
      setTimeout(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              generateAndPrintLabels(
                allProducts,
                labelForm.size,
                labelForm.orientation,
                labelForm.rows,
                downloadAsPDF
              );
            });
          }, 0);
        });
      }, 100);
    } catch (error: any) {
      console.error('Failed to generate labels:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate labels', { id: 'fetch-products' });
      setGenerating(false);
    }
  };

  return (
    <Box sx={{ 
      height: { xs: "auto", md: '100%' }, 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        minHeight: 0,
        p: 2,
        pb: 0.5,
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
          Inventory Label Configuration
        </Typography>

        <Paper sx={{ 
          p: 0.75, 
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              {/* Sales Category Filter */}
              <Box sx={{ mb: 1.25 }}>
                <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sales Category
                </Typography>
                <MultiSearchableDropdown
                  options={salesCategoryOptions}
                  value={salesCategory}
                  onChange={(options) => { setSalesCategory(options) } }
                  loading={loadingSalesCategory}
                  placeholder="Select sales categories"
                  sx={{ 
                    mb: 0, 
                    width: '100%', 
                    fontSize: '0.75rem',
                    '& .MuiInputBase-root': {
                      minHeight: 'auto',
                      fontSize: '0.75rem',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '1px',
                    },
                  }}
                />
              </Box>

              {/* Price Class Filter */}
              <Box sx={{ mb: 1.25 }}>
                <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Price Class
                </Typography>
                <MultiSearchableDropdown
                  options={priceClassOptions}
                  value={priceClass}
                  onChange={(options) => setPriceClass(options)}
                  loading={loadingPriceClass}
                  placeholder="Select sub category"
                  sx={{ 
                    mb: 0, 
                    width: '100%', 
                    fontSize: '0.75rem',
                    '& .MuiInputBase-root': {
                      minHeight: 'auto',
                      fontSize: '0.75rem',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '1px',
                    },
                  }}
                />
              </Box>

              {/* Customer Filter */}
              <Box sx={{ mb: 1.25 }}>
                <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Customer
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    disabled={loadingCustomers || generating}
                    sx={{
                      fontSize: '0.75rem',
                      '& .MuiSelect-select': {
                        minHeight: 'auto',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '1px',
                      },
                      '& .MuiSelect-icon': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                      <em>None</em>
                    </MenuItem>
                    {customerOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Label Size */}
              <Box sx={{ mb: 1.25 }}>
                <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Label Size
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={labelForm.size}
                    onChange={(e) => {
                      const newSize = e.target.value as any;
                      const newColumnCount = newSize.startsWith('A4-') ? parseInt(newSize.split('-')[1]) || 1 : 0;
                      const maxRows = newColumnCount === 4 ? 7 : newColumnCount === 3 ? 5 : newColumnCount === 2 ? 4 : newColumnCount === 1 ? 4 : 1;
                      const isA4Column = newSize.startsWith('A4-');
                      setLabelForm({
                        ...labelForm,
                        size: newSize,
                        rows: newColumnCount > 0 && labelForm.rows > maxRows ? maxRows : labelForm.rows,
                        orientation: isA4Column ? 'portrait' : labelForm.orientation,
                      });
                    }}
                    disabled={generating}
                    sx={{
                      fontSize: '0.75rem',
                      '& .MuiSelect-select': {
                        minHeight: 'auto',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '1px',
                      },
                      '& .MuiSelect-icon': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <MenuItem value="4x3" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>4x3</MenuItem>
                    <MenuItem value="4x6" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>4x6</MenuItem>
                    <MenuItem value="3x6" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>3x6</MenuItem>
                    <MenuItem value="3x2" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>3x2</MenuItem>
                    <MenuItem value="4x4" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>4x4</MenuItem>
                    <MenuItem value="2x2" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>2x2</MenuItem>
                    <MenuItem value="2x3" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>2x3</MenuItem>
                    <MenuItem value="3x3" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>3x3</MenuItem>
                    <MenuItem value="5x3" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>5x3</MenuItem>
                    <MenuItem value="6x4" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>6x4</MenuItem>
                    <MenuItem value="A4" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>A4</MenuItem>
                    <MenuItem value="A4-1" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>A4 (1 Column)</MenuItem>
                    <MenuItem value="A4-2" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>A4 (2 Columns)</MenuItem>
                    <MenuItem value="A4-3" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>A4 (3 Columns)</MenuItem>
                    <MenuItem value="A4-4" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>A4 (4 Columns)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Rows per Page (only for A4 columns) */}
              {(labelForm.size.startsWith('A4-')) && (
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rows per Page
                  </Typography>
                  {(() => {
                    const columnCount = parseInt(labelForm.size.split('-')[1]) || 1;
                    const maxRows = columnCount === 4 ? 7 : columnCount === 3 ? 5 : 4;
                    const rowOptions = [];
                    for (let i = 1; i <= maxRows; i++) {
                      rowOptions.push(i);
                    }
                    const currentRows = Math.min(labelForm.rows, maxRows);
                    
                    return (
                      <FormControl fullWidth size="small">
                        <Select
                          value={currentRows}
                          onChange={(e) =>
                            setLabelForm({
                              ...labelForm,
                              rows: Number(e.target.value),
                            })
                          }
                          disabled={generating}
                          sx={{
                            fontSize: '0.75rem',
                            '& .MuiSelect-select': {
                              minHeight: 'auto',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderWidth: '1px',
                            },
                            '& .MuiSelect-icon': {
                              color: 'primary.main',
                            },
                          }}
                        >
                          {rowOptions.map(row => (
                            <MenuItem key={row} value={row} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>{row}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  })()}
                </Box>
              )}

              {/* Display Orientation */}
              <Box>
                <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Display Orientation
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={labelForm.orientation}
                    onChange={(e) =>
                      setLabelForm({
                        ...labelForm,
                        orientation: e.target.value as any,
                      })
                    }
                    disabled={labelForm.size.startsWith('A4-') || generating}
                    sx={{
                      fontSize: '0.75rem',
                      '& .MuiSelect-select': {
                        minHeight: 'auto',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '1px',
                      },
                      '& .MuiSelect-icon': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <MenuItem value="portrait" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Portrait</MenuItem>
                    <MenuItem value="landscape" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Landscape</MenuItem>
                  </Select>
                </FormControl>
                {labelForm.size.startsWith('A4-') && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontStyle: 'italic', mt: 0.5, display: 'block' }}>
                    A4 columns always use portrait orientation
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 9 }}>
              <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Fields
              </Typography>
              <Typography variant="caption" sx={{ mb: 0.6, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                Size: {labelForm.size}
              </Typography>
              <Box sx={{ 
                maxHeight: 'calc(100vh - 260px)',
                overflowY: 'auto',
                pr: 0.5,
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  borderRadius: '2px',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                  },
                },
              }}>
                <Grid container spacing={0.4}>
                  {[
                    { 
                      key: 'image', 
                      label: 'Image',
                      disabled: !isImageAvailableForSize(labelForm.size),
                      tooltip: !isImageAvailableForSize(labelForm.size) ? 'Image not available for small sizes' : undefined
                    },
                    { key: 'itemNumber', label: 'Item Number' },
                    { key: 'description', label: 'Description' },
                    { key: 'pack', label: 'Pack' },
                    { key: 'caseCount', label: 'Case Count' },
                    { key: 'price', label: 'Price' },
                    { key: 'barcode', label: 'Barcode' },
                    { key: 'customerName', label: 'Customer Name', disabled: !selectedCustomer },
                    { key: 'customerNumber', label: 'Customer Number', disabled: !selectedCustomer },
                  ].map((field) => (
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3}} key={field.key}>
                      <Tooltip 
                        title={field.tooltip || (field.disabled ? `${field.label} is not available for this size` : '')} 
                        placement="top"
                        arrow
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 0.35,
                            px: 0.5,
                            borderRadius: 0.75,
                            transition: 'all 0.15s ease',
                            backgroundColor: fieldOptions[field.key as keyof LabelFieldOptions]
                              ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.06)')
                              : 'transparent',
                            opacity: field.disabled ? 0.5 : 1,
                            cursor: field.disabled ? 'not-allowed' : 'default',
                            '&:hover': {
                              backgroundColor: field.disabled 
                                ? 'transparent'
                                : (theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.03)' 
                                  : 'rgba(0, 0, 0, 0.02)'),
                            },
                          }}
                        >
                          <Switch
                            size="small"
                            checked={fieldOptions[field.key as keyof LabelFieldOptions] || false}
                            onChange={(e) => {
                              if (!field.disabled) {
                                setFieldOptions(prev => ({ ...prev, [field.key]: e.target.checked }));
                              }
                            }}
                            disabled={field.disabled || generating}
                            sx={{
                              flexShrink: 0,
                            }}
                          />
                          <Typography 
                            sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: fieldOptions[field.key as keyof LabelFieldOptions] ? 500 : 400,
                              color: field.disabled 
                                ? 'text.disabled'
                                : (fieldOptions[field.key as keyof LabelFieldOptions] ? 'primary.main' : 'text.secondary'),
                              transition: 'all 0.15s ease',
                              flex: 1,
                            }}
                          >
                            {field.label}
                            {field.disabled && (
                              <Typography component="span" sx={{ fontSize: '0.65rem', ml: 0.5, fontStyle: 'italic', color: 'text.disabled' }}>
                                (Not available)
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box sx={{ 
        p: 1.5,
        pt: 1,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0,
      }}>
        <CustomButton
          onClick={() => handleGenerateLabels(false)}
          fullWidth={false}
          loading={generating}
          disabled={generating}
          icon={<PrintIcon sx={{ fontSize: 20 }} />}
          iconPosition="left"
          sx={{ minWidth: 180, mt: 0 }}
        >
          Print Labels
        </CustomButton>
        <CustomButton
          onClick={() => handleGenerateLabels(true)}
          fullWidth={false}
          loading={generating}
          disabled={generating}
          icon={<PictureAsPdfIcon sx={{ fontSize: 20 }} />}
          iconPosition="left"
          sx={{ minWidth: 180, mt: 0 }}
        >
          Download PDF
        </CustomButton>
      </Box>
    </Box>
  );
};

export default InventoryLabelTab;

