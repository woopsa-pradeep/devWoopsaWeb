import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Grid,
//   Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  CircularProgress,
  Pagination,
  Switch,
  Radio,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
// Import jspdf-autotable as side-effect to extend jsPDF
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JsBarcode = require('jsbarcode');
import { inventoryForReport } from '../../../redux/apis/distrubutor/productApis';
import { getSalesCategoryList, getPriceClassList } from '../../../redux/apis/distrubutor/listApis';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

interface UPCItem {
  myKey?: number;
  UPC_Number: string;
  Status: number;
  Priority?: number;
}

interface SalesCategory {
  Sales_Category: number;
  Category_Desc: string;
}

interface Vendor {
  Primary_Vendor: number;
  V_Description: string;
}

interface PriceClass {
  Price_Class: number;
  Class_Desc: string;
}

interface PriceSubclass {
  Price_Subclass: number;
  Subclass_Def: string;
}

interface Product {
  Pack: number;
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  Price2: number;
  Price3?: number;
  Price4?: number;
  Price5?: number;
  Price6?: number;
  Retail1?: number;
  Retail2?: number;
  Retail3?: number;
  UnitOunces: number;
  OTP_Number: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  Inventory_OnHand?: number;
  I_Inactive?: boolean;
  I_Discontinued?: boolean;
  MSA_Category_Code?: string;
  Section?: string;
  Location?: number;
  MinimumStockAvailability?: number;
  Vendor_ItemNumberAlpha?: string;
  Sequence?: number;
  SalesCategory: SalesCategory | string;
  PriceClass: PriceClass | string;
  PriceSubclass?: PriceSubclass;
  primaryVendor?: Vendor;
  manufacturerVendor?: Vendor;
  UPCList: UPCItem[];
}

// Fields to exclude from checkboxes (Item_Number and Description are always included, so excluded from selection)
const EXCLUDED_FIELDS = ['Item_Number', 'Description', 'QtyLimit', 'distributorImage', 'imageId', 'masterImage', 'showDistributorImage', 'UPCList', 'SalesCategory_Number', 'PriceClass_Number', 'PriceSubclass_Number', 'PrimaryVendor_Number', 'ManufacturerVendor_Number'];

// Field display sequence (order matters)
const FIELD_SEQUENCE: string[] = [
  'Item_Number',
  'Description',
  'UOM',
  'Pack',
  'UnitOunces',
  'CaseCount',
  'SalesCategory_Desc',
  'PriceClass_Desc',
  'OTP_Number',
  'PriceSubclass_Desc',
  'Section',
  'Location',
  'MSA_Category_Code',
  'PrimaryVendor_Desc',
  'Vendor_ItemNumberAlpha',
  'ManufacturerVendor_Desc',
  'Price1',
  'Price2',
  'Price3',
  'Price4',
  'Price5',
  'Price6',
  'NetCost',
  'BaseCost',
  'Invoice_Cost',
  'AvgCost',
  'Retail1',
  'Retail2',
  'Retail3',
  'Primary_UPC',
  'Retail_UPC',
  'Case_UPC',
  'Inventory_OnHand',
  'Sequence',
  'MinimumStockAvailability',
];

// Helper function to sort fields by sequence
const sortFieldsBySequence = (fields: string[]): string[] => {
  return [...fields].sort((a, b) => {
    const indexA = FIELD_SEQUENCE.indexOf(a);
    const indexB = FIELD_SEQUENCE.indexOf(b);
    // If field not in sequence, put it at the end
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

// Field groups definition
const FIELD_GROUPS: { [key: string]: { label: string; fields: string[] } } = {
  upc: {
    label: 'UPC Group',
    fields: ['Primary_UPC', 'Retail_UPC', 'Case_UPC'],
  },
  price: {
    label: 'Price Group',
    fields: ['Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6'],
  },
  retail: {
    label: 'Retail Group',
    fields: ['Retail1', 'Retail2', 'Retail3'],
  },
  cost: {
    label: 'Cost Group',
    fields: ['BaseCost', 'Invoice_Cost', 'AvgCost', 'NetCost'],
  },
  vendor: {
    label: 'Vendor Group',
    fields: ['PrimaryVendor_Desc', 'ManufacturerVendor_Desc', 'Vendor_ItemNumberAlpha'],
  },
  category: {
    label: 'Category Group',
    fields: ['SalesCategory_Desc', 'PriceClass_Desc', 'PriceSubclass_Desc'],
  },
  location: {
    label: 'Location Group',
    fields: ['Section', 'Location', 'MSA_Category_Code'],
  },
  inventory: {
    label: 'Inventory Group',
    fields: ['Inventory_OnHand', 'MinimumStockAvailability', 'Sequence'],
  },
  product: {
    label: 'Product Details Group',
    fields: ['UOM', 'Pack', 'UnitOunces', 'CaseCount', 'OTP_Number'],
  },
};

// Field labels mapping
const FIELD_LABELS: { [key: string]: string } = {
  Pack: 'Pack',
  Description: 'Description',
  Item_Number: 'Item Number',
  CaseCount: 'Case Count',
  UOM: 'Size',
  Price1: 'Price 1',
  Price2: 'Price 2',
  Price3: 'Price 3',
  Price4: 'Price 4',
  Price5: 'Price 5',
  Price6: 'Price 6',
  Retail1: 'Retail 1',
  Retail2: 'Retail 2',
  Retail3: 'Retail 3',
  UnitOunces: 'Unit Ounces',
  OTP_Number: 'OTP Number',
  BaseCost: 'Base Cost',
  Invoice_Cost: 'Invoice Cost',
  AvgCost: 'Average Cost',
  NetCost: 'Net Cost',
  Inventory_OnHand: 'Inventory On Hand',
  MSA_Category_Code: 'MSA Category Code',
  Section: 'Section',
  Location: 'Location',
  Primary_UPC: 'Primary UPC',
  Retail_UPC: 'Retail UPC',
  Case_UPC: 'Case UPC',
  SalesCategory_Number: 'Sales Category Number',
  SalesCategory_Desc: 'Sales Category',
  PriceClass_Number: 'Price Class Number',
  PriceClass_Desc: 'Price Class',
  PriceSubclass_Number: 'Price Subclass Number',
  PriceSubclass_Desc: 'Price Subclass',
  PrimaryVendor_Number: 'Primary Vendor Number',
  PrimaryVendor_Desc: 'Vendor',
  ManufacturerVendor_Number: 'Manufacturer Vendor Number',
  ManufacturerVendor_Desc: 'Manufacturer',
  MinimumStockAvailability: 'Minimum Stock Availability',
  Vendor_ItemNumberAlpha: 'Vendor Item Number',
  Sequence: 'Sequence',
};

const InventoryReportTab: React.FC = () => {
  const theme = useTheme();

  // Active/Inactive filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Sales Category and Price Class filters
  const [selectedSalesCategories, setSelectedSalesCategories] = useState<number[]>([]);
  const [selectedPriceClasses, setSelectedPriceClasses] = useState<number[]>([]);
  const [salesCategoryOptions, setSalesCategoryOptions] = useState<SalesCategory[]>([]);
  const [priceClassOptions, setPriceClassOptions] = useState<PriceClass[]>([]);
  const [loadingSalesCategories, setLoadingSalesCategories] = useState(false);
  const [loadingPriceClasses, setLoadingPriceClasses] = useState(false);

  // Toggle states for report fields
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({});
  const [selectedFieldGroup, setSelectedFieldGroup] = useState<string>('');

  // Grouping options
  const [groupBySalesCategory, setGroupBySalesCategory] = useState(false);
  const [groupByPriceClass, setGroupByPriceClass] = useState(false);
  const [groupByOTPNumber, setGroupByOTPNumber] = useState(false);
  const [groupByPrimaryVendor, setGroupByPrimaryVendor] = useState(false);
  const [groupByManufacturerVendor, setGroupByManufacturerVendor] = useState(false);

  // Report generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Product[]>([]);
  
  // 8 Week Report UPC Type selection (default: Retail UPC)
  const [upcType8Week, setUpcType8Week] = useState<'retail' | 'primary' | 'case' | 'item'>('retail');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, stage: '' });
  const [sortOption, setSortOption] = useState<'atoz' | 'itemNumber' | 'sequence'>('atoz');
  const [originalFilteredData, setOriginalFilteredData] = useState<Product[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 100; // Show 100 rows at a time in preview
  const [fullFilteredData, setFullFilteredData] = useState<Product[]>([]); // Store full dataset for CSV/PDF generation
  const [reportType, setReportType] = useState<'standard' | '4week' | '8week'>('standard');

  // Fetch total count and filter options on mount
  useEffect(() => {
    fetchTotalCount();
    fetchSalesCategories();
    fetchPriceClasses();
  }, []);

  const fetchSalesCategories = async () => {
    setLoadingSalesCategories(true);
    try {
      const response = await getSalesCategoryList() as any;
      const categories = response?.data?.data || response?.data || [];
      setSalesCategoryOptions(categories);
    } catch (error) {
      console.error('Error fetching sales categories:', error);
      toast.error('Failed to load sales categories');
    } finally {
      setLoadingSalesCategories(false);
    }
  };

  const fetchPriceClasses = async () => {
    setLoadingPriceClasses(true);
    try {
      const response = await getPriceClassList() as any;
      const priceClasses = response?.data?.data || response?.data || [];
      setPriceClassOptions(priceClasses);
    } catch (error) {
      console.error('Error fetching price classes:', error);
      toast.error('Failed to load price classes');
    } finally {
      setLoadingPriceClasses(false);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const res = await inventoryForReport();
      const products: any = (res as any)?.data || res || [];
      return Array.isArray(products) ? products.length : 0;
    } catch (error) {
      console.error('Error fetching total count:', error);
      return 0;
    }
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleFieldGroupChange = (groupKey: string) => {
    setSelectedFieldGroup(groupKey);
    
    if (groupKey === '') {
      // Clear all fields except Item_Number and Description (always included)
      setSelectedFields({});
      return;
    }

    const group = FIELD_GROUPS[groupKey];
    if (group) {
      // Auto-select all fields in the group
      const newSelectedFields: { [key: string]: boolean } = {};
      group.fields.forEach(field => {
        newSelectedFields[field] = true;
      });
      setSelectedFields(newSelectedFields);
    }
  };

  // Helper function to get UPCs by status
  const getUPCsByStatus = (product: Product, status: number): string => {
    if (!product.UPCList || !Array.isArray(product.UPCList)) return '';
    const upcs = product.UPCList
      .filter(upc => upc.Status === status)
      .map(upc => upc.UPC_Number);
    return upcs.join(', ');
  };

  // Helper function to get nested object value
  const getNestedValue = (product: Product, field: string): string => {
    if (field === 'SalesCategory_Number') {
      if (typeof product.SalesCategory === 'object' && product.SalesCategory?.Sales_Category) {
        return product.SalesCategory.Sales_Category.toString();
      }
      return '';
    }
    if (field === 'SalesCategory_Desc') {
      if (typeof product.SalesCategory === 'object' && product.SalesCategory?.Category_Desc) {
        return product.SalesCategory.Category_Desc;
      }
      if (typeof product.SalesCategory === 'string') {
        return product.SalesCategory;
      }
      return '';
    }
    if (field === 'PriceClass_Number') {
      if (typeof product.PriceClass === 'object' && product.PriceClass?.Price_Class) {
        return product.PriceClass.Price_Class.toString();
      }
      return '';
    }
    if (field === 'PriceClass_Desc') {
      if (typeof product.PriceClass === 'object' && product.PriceClass?.Class_Desc) {
        return product.PriceClass.Class_Desc;
      }
      if (typeof product.PriceClass === 'string') {
        return product.PriceClass;
      }
      return '';
    }
    if (field === 'PriceSubclass_Number') {
      return product.PriceSubclass?.Price_Subclass?.toString() || '';
    }
    if (field === 'PriceSubclass_Desc') {
      return product.PriceSubclass?.Subclass_Def || '';
    }
    if (field === 'PrimaryVendor_Number') {
      return product.primaryVendor?.Primary_Vendor?.toString() || '';
    }
    if (field === 'PrimaryVendor_Desc') {
      return product.primaryVendor?.V_Description || '';
    }
    if (field === 'ManufacturerVendor_Number') {
      return product.manufacturerVendor?.Primary_Vendor?.toString() || '';
    }
    if (field === 'ManufacturerVendor_Desc') {
      return product.manufacturerVendor?.V_Description || '';
    }
    if (field === 'Primary_UPC') {
      return getUPCsByStatus(product, 0);
    }
    if (field === 'Retail_UPC') {
      return getUPCsByStatus(product, 1);
    }
    if (field === 'Case_UPC') {
      return getUPCsByStatus(product, 2);
    }
    return (product as any)[field]?.toString() || '';
  };

  // Sorting functions
  const sortByAtoZ = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      const descAOriginal = a.Description || '';
      const descBOriginal = b.Description || '';
      const descA = descAOriginal.trim();
      const descB = descBOriginal.trim();
      
      // Check for leading spaces
      const aHasLeadingSpace = descAOriginal.length > 0 && descAOriginal.trimStart() !== descAOriginal;
      const bHasLeadingSpace = descBOriginal.length > 0 && descBOriginal.trimStart() !== descBOriginal;
      
      // Items with leading spaces come first
      // If one has leading spaces and the other doesn't, the one with spaces comes first
      if (aHasLeadingSpace && !bHasLeadingSpace) return -1;
      if (!aHasLeadingSpace && bHasLeadingSpace) return 1;
      
      // If both have leading spaces or both don't, continue with normal comparison
      
      // If both or neither have leading spaces, continue with normal comparison
      // Helper function to get sort priority
      // 0 = symbolic, 1 = numeric, 2 = alphabetical
      const getCharType = (char: string): number => {
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(char)) return 0; // Symbolic
        if (/[0-9]/.test(char)) return 1; // Numeric
        if (/[a-zA-Z]/.test(char)) return 2; // Alphabetical
        return 3; // Other (spaces, etc.)
      };
      
      // Compare character by character
      const minLength = Math.min(descA.length, descB.length);
      for (let i = 0; i < minLength; i++) {
        const charA = descA[i];
        const charB = descB[i];
        const typeA = getCharType(charA);
        const typeB = getCharType(charB);
        
        // First compare by type (symbolic < numeric < alphabetical)
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        
        // If same type, compare characters
        if (typeA === 0 || typeA === 1) {
          // For symbolic and numeric, compare by character code
          if (charA !== charB) {
            return charA.localeCompare(charB);
          }
        } else if (typeA === 2) {
          // For alphabetical, case-insensitive comparison
          const lowerA = charA.toLowerCase();
          const lowerB = charB.toLowerCase();
          if (lowerA !== lowerB) {
            return lowerA.localeCompare(lowerB);
          }
        }
      }
      
      // If all characters match up to minLength, shorter string comes first
      return descA.length - descB.length;
    });
  };

  const sortByItemNumber = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      const numA = a.Item_Number || 0;
      const numB = b.Item_Number || 0;
      return numA - numB;
    });
  };

  const sortBySequence = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      const seqA = a.Sequence || 0;
      const seqB = b.Sequence || 0;
      return seqA - seqB;
    });
  };

  const applySorting = useCallback((products: Product[]): Product[] => {
    if (sortOption === 'itemNumber') {
      return sortByItemNumber(products);
    }
    if (sortOption === 'sequence') {
      return sortBySequence(products);
    }
    // Default: AtoZ
    return sortByAtoZ(products);
  }, [sortOption]);

  // Helper to get grouped data for preview/display
  interface GroupedRow {
    type: 'header' | 'product' | 'spacer';
    category?: string;
    priceClass?: string;
    otpNumber?: number;
    primaryVendor?: string;
    manufacturerVendor?: string;
    product?: Product;
  }

  const getGroupedDataForDisplay = (products: Product[]): GroupedRow[] => {
    const result: GroupedRow[] = [];

    // If only Sales Category grouping is selected
    if (groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.SalesCategory === 'object') {
          return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
        }
        return p.SalesCategory && String(p.SalesCategory).trim() !== '';
      });
      
      const grouped = validProducts.reduce((acc, product) => {
        let category = 'Unknown';
        if (typeof product.SalesCategory === 'object') {
          category = product.SalesCategory?.Category_Desc || 'Unknown';
        } else if (typeof product.SalesCategory === 'string') {
          category = product.SalesCategory;
        }
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedCategories = Object.keys(grouped).sort();

      sortedCategories.forEach(category => {
        // Add category header
        result.push({ type: 'header', category });
        // Add products for this category
        grouped[category].forEach(product => {
          result.push({ type: 'product', product });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });
    }
    // If only Price Class grouping is selected
    else if (!groupBySalesCategory && groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.PriceClass === 'object') {
          return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
        }
        return p.PriceClass && String(p.PriceClass).trim() !== '';
      });
      
      const grouped = validProducts.reduce((acc, product) => {
        let priceClass = 'Unknown';
        if (typeof product.PriceClass === 'object') {
          priceClass = product.PriceClass?.Class_Desc || 'Unknown';
        } else if (typeof product.PriceClass === 'string') {
          priceClass = product.PriceClass;
        }
        if (!acc[priceClass]) {
          acc[priceClass] = [];
        }
        acc[priceClass].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedPriceClasses = Object.keys(grouped).sort();

      sortedPriceClasses.forEach(priceClass => {
        // Add price class header
        result.push({ type: 'header', priceClass });
        // Add products for this price class
        grouped[priceClass].forEach(product => {
          result.push({ type: 'product', product });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });
    }
    // If only OTP Number grouping is selected
    else if (!groupBySalesCategory && !groupByPriceClass && groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.OTP_Number != null);
      
      const grouped = validProducts.reduce((acc, product) => {
        const otpNumber = product.OTP_Number;
        if (!acc[otpNumber]) {
          acc[otpNumber] = [];
        }
        acc[otpNumber].push(product);
        return acc;
      }, {} as { [key: number]: Product[] });

      const sortedOTPNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      sortedOTPNumbers.forEach(otpNumber => {
        // Add OTP number header
        result.push({ type: 'header', otpNumber });
        // Add products for this OTP number
        grouped[otpNumber].forEach(product => {
          result.push({ type: 'product', product });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });
    }
    // If only Primary Vendor grouping is selected
    else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.primaryVendor?.V_Description);
      
      const grouped = validProducts.reduce((acc, product) => {
        const vendorName = product.primaryVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedVendors = Object.keys(grouped).sort();

      sortedVendors.forEach(vendorName => {
        // Add vendor header
        result.push({ type: 'header', primaryVendor: vendorName });
        // Add products for this vendor
        grouped[vendorName].forEach(product => {
          result.push({ type: 'product', product });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });
    }
    // If only Manufacturer Vendor grouping is selected
    else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.manufacturerVendor?.V_Description);
      
      const grouped = validProducts.reduce((acc, product) => {
        const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedVendors = Object.keys(grouped).sort();

      sortedVendors.forEach(vendorName => {
        // Add vendor header
        result.push({ type: 'header', manufacturerVendor: vendorName });
        // Add products for this vendor
        grouped[vendorName].forEach(product => {
          result.push({ type: 'product', product });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });
    }
    // Regular flat report (no grouping)
    else {
      products.forEach(product => {
        result.push({ type: 'product', product });
      });
    }

    return result;
  };

  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const getProductRow = (product: Product, headers: string[]): string => {
    return headers.map(header => {
      let value = '';
      if (header === 'Item_Number') {
        value = product.Item_Number?.toString() || '';
      } else if (header === 'Description') {
        value = product.Description || '';
      } else {
        value = getNestedValue(product, header);
      }
      return escapeCSVValue(value);
    }).join(',');
  };

  const generateCSV = (products: Product[], fields: string[], groupByCategory: boolean, groupByPriceClass: boolean, groupByOTP: boolean, groupByPrimaryVendor: boolean, groupByManufacturerVendor: boolean) => {
    // Always include Item_Number and Description
    const headers = ['Item_Number', 'Description', ...fields.filter(f => f !== 'Item_Number' && f !== 'Description')];
    const csvHeaders = headers.map(h => FIELD_LABELS[h] || h).join(',');

    // If only Sales Category grouping is selected
    if (groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      // Filter out products without SalesCategory
      const validProducts = products.filter(p => {
        if (typeof p.SalesCategory === 'object') {
          return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
        }
        return p.SalesCategory && String(p.SalesCategory).trim() !== '';
      });
      
      // Group by SalesCategory
      const grouped = validProducts.reduce((acc, product) => {
        let category = 'Unknown';
        if (typeof product.SalesCategory === 'object') {
          category = product.SalesCategory?.Category_Desc || 'Unknown';
        } else if (typeof product.SalesCategory === 'string') {
          category = product.SalesCategory;
        }
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      // Sort categories alphabetically
      const sortedCategories = Object.keys(grouped).sort();

      const rows: string[] = [csvHeaders];
      sortedCategories.forEach(category => {
        // Add category header
        rows.push(`"=== ${category} ==="`);
        // Add products for this category
        grouped[category].forEach(product => {
          rows.push(getProductRow(product, headers));
        });
        // Add empty row between categories
        rows.push('');
      });

      return rows.join('\n');
    }

    // If only Price Class grouping is selected
    if (!groupByCategory && groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      // Filter out products without PriceClass
      const validProducts = products.filter(p => {
        if (typeof p.PriceClass === 'object') {
          return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
        }
        return p.PriceClass && String(p.PriceClass).trim() !== '';
      });
      
      // Group by PriceClass
      const grouped = validProducts.reduce((acc, product) => {
        let priceClass = 'Unknown';
        if (typeof product.PriceClass === 'object') {
          priceClass = product.PriceClass?.Class_Desc || 'Unknown';
        } else if (typeof product.PriceClass === 'string') {
          priceClass = product.PriceClass;
        }
        if (!acc[priceClass]) {
          acc[priceClass] = [];
        }
        acc[priceClass].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      // Sort price classes alphabetically
      const sortedPriceClasses = Object.keys(grouped).sort();

      const rows: string[] = [csvHeaders];
      sortedPriceClasses.forEach(priceClass => {
        // Add price class header
        rows.push(`"=== ${priceClass} ==="`);
        // Add products for this price class
        grouped[priceClass].forEach(product => {
          rows.push(getProductRow(product, headers));
        });
        // Add empty row between price classes
        rows.push('');
      });

      return rows.join('\n');
    }

    // If only OTP Number grouping is selected
    if (!groupByCategory && !groupByPriceClass && groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      // Filter out products without OTP_Number
      const validProducts = products.filter(p => p.OTP_Number != null);
      
      // Group by OTP_Number
      const grouped = validProducts.reduce((acc, product) => {
        const otpNumber = product.OTP_Number;
        if (!acc[otpNumber]) {
          acc[otpNumber] = [];
        }
        acc[otpNumber].push(product);
        return acc;
      }, {} as { [key: number]: Product[] });

      // Sort OTP numbers numerically
      const sortedOTPNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      const rows: string[] = [csvHeaders];
      sortedOTPNumbers.forEach(otpNumber => {
        // Add OTP number header
        rows.push(`"=== OTP Number: ${otpNumber} ==="`);
        // Add products for this OTP number
        grouped[otpNumber].forEach(product => {
          rows.push(getProductRow(product, headers));
        });
        // Add empty row between OTP numbers
        rows.push('');
      });

      return rows.join('\n');
    }

    // If only Primary Vendor grouping is selected
    if (!groupByCategory && !groupByPriceClass && !groupByOTP && groupByPrimaryVendor && !groupByManufacturerVendor) {
      // Filter out products without Primary Vendor
      const validProducts = products.filter(p => p.primaryVendor?.V_Description);
      
      // Group by Primary Vendor
      const grouped = validProducts.reduce((acc, product) => {
        const vendorName = product.primaryVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      // Sort vendors alphabetically
      const sortedVendors = Object.keys(grouped).sort();

      const rows: string[] = [csvHeaders];
      sortedVendors.forEach(vendorName => {
        // Add vendor header
        rows.push(`"=== ${vendorName} ==="`);
        // Add products for this vendor
        grouped[vendorName].forEach(product => {
          rows.push(getProductRow(product, headers));
        });
        // Add empty row between vendors
        rows.push('');
      });

      return rows.join('\n');
    }

    // If only Manufacturer Vendor grouping is selected
    if (!groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && groupByManufacturerVendor) {
      // Filter out products without Manufacturer Vendor
      const validProducts = products.filter(p => p.manufacturerVendor?.V_Description);
      
      // Group by Manufacturer Vendor
      const grouped = validProducts.reduce((acc, product) => {
        const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      // Sort vendors alphabetically
      const sortedVendors = Object.keys(grouped).sort();

      const rows: string[] = [csvHeaders];
      sortedVendors.forEach(vendorName => {
        // Add vendor header
        rows.push(`"=== ${vendorName} ==="`);
        // Add products for this vendor
        grouped[vendorName].forEach(product => {
          rows.push(getProductRow(product, headers));
        });
        // Add empty row between vendors
        rows.push('');
      });

      return rows.join('\n');
    }

    // Regular flat report (no grouping)
    const csvRows = products.map(product => getProductRow(product, headers));
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to add footer with logo and "Report Generated by Woopsa" to each page (only in blank space)
  const addFooterToPage = (doc: jsPDF, logoDataUrl?: string) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = pageHeight - 5; // 5mm from bottom - in blank space only
    
    // Add "Report Generated by Woopsa" text
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const text = 'Report Generated by Woopsa';
    const textWidth = doc.getTextWidth(text);
    
    // Center the footer content
    const totalWidth = textWidth + 6; // text + logo width + spacing
    const startX = (pageWidth - totalWidth) / 2;
    
    doc.text(text, startX, footerY);
    
    // Add logo (small size - 4mm height)
    if (logoDataUrl) {
      try {
        const logoWidth = 4;
        const logoHeight = 4;
        const logoX = startX + textWidth + 1.5; // 1.5mm spacing after text
        const logoY = footerY - 3; // Adjust vertical position to align with text
        
        // Try PNG first, then SVG, then auto-detect
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch {
          try {
            doc.addImage(logoDataUrl, 'SVG', logoX, logoY, logoWidth, logoHeight);
          } catch {
            // Auto-detect format
            doc.addImage(logoDataUrl, logoX, logoY, logoWidth, logoHeight);
          }
        }
      } catch (error) {
        // If logo fails to load, just show text
        console.error('Error adding logo to PDF:', error);
      }
    } else {
      console.warn('Logo data URL is null, footer will show text only');
    }
  };

  // Helper to load logo as data URL
  const loadLogoAsDataUrl = async (): Promise<string | null> => {
    try {
      // Try multiple approaches to load the logo
      return new Promise<string | null>((resolve) => {
        // First try: Direct image load from import
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width || 40;
              canvas.height = img.height || 33;
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              console.log('Logo loaded successfully via image');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Error converting logo to canvas:', error);
            resolve(null);
          }
        };
        
        img.onerror = async () => {
          // Fallback: Try fetching as blob/URL
          try {
            // Try the imported path first
            const logoPath = rabbitLogo;
            if (typeof rabbitLogo === 'string' && !rabbitLogo.startsWith('data:') && !rabbitLogo.startsWith('http')) {
              // If it's a relative path, try to fetch it
              const response = await fetch(logoPath);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    console.log('Logo loaded successfully via fetch');
                    resolve(reader.result);
                  } else {
                    resolve(null);
                  }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
                return;
              }
            }
            
            // Last resort: try public path
            const publicResponse = await fetch('/Rabbit.svg');
            if (publicResponse.ok) {
              const blob = await publicResponse.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  console.log('Logo loaded successfully via public path');
                  resolve(reader.result);
                } else {
                  resolve(null);
                }
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            } else {
              console.error('Could not load logo from any source');
              resolve(null);
            }
          } catch (fetchError) {
            console.error('Error fetching logo:', fetchError);
            resolve(null);
          }
        };
        
        // Set image source - handle both string paths and data URLs
        if (typeof rabbitLogo === 'string') {
          img.src = rabbitLogo;
        } else {
          img.src = rabbitLogo as string;
        }
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  const generatePDF = async (products: Product[], fields: string[], groupByCategory: boolean, groupByPriceClass: boolean, groupByOTP: boolean, groupByPrimaryVendor: boolean, groupByManufacturerVendor: boolean) => {
    // Load logo first before generating PDF
    const logoDataUrl = await loadLogoAsDataUrl();

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10; // Side margins for A4 portrait
    let yPosition = 10; // Start from top
    
    // Common footer callback for all pages
    const footerCallback = () => {
      addFooterToPage(doc, logoDataUrl || undefined);
    };

    // Title - Top Left
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');   
    doc.text('Inventory Report', margin, yPosition);

    // Date - Top Right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const date = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;
    doc.text(`Generated on: ${date}`, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 8; // Small space after header

    // Always include Item_Number and Description
    const headers = ['Item_Number', 'Description', ...fields.filter(f => f !== 'Item_Number' && f !== 'Description')];
    const headerLabels = headers.map(h => FIELD_LABELS[h] || h);

    // Prepare table data
    const tableData: any[][] = [];

    // Helper to get cell value
    const getCellValue = (product: Product, header: string): string => {
      if (header === 'Item_Number') {
        return product.Item_Number?.toString() || '-';
      } else if (header === 'Description') {
        return product.Description || '-';
      } else {
        const value = getNestedValue(product, header);
        return value || '-';
      }
    };

    // If only Sales Category grouping is selected
    if (groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.SalesCategory === 'object') {
          return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
        }
        return p.SalesCategory && String(p.SalesCategory).trim() !== '';
      });
      
      const grouped = validProducts.reduce((acc, product) => {
        let category = 'Unknown';
        if (typeof product.SalesCategory === 'object') {
          category = product.SalesCategory?.Category_Desc || 'Unknown';
        } else if (typeof product.SalesCategory === 'string') {
          category = product.SalesCategory;
        }
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedCategories = Object.keys(grouped).sort();

      sortedCategories.forEach(category => {
        // Add category header row
        tableData.push([`=== ${category} ===`, ...Array(headerLabels.length - 1).fill('')]);
        // Add products for this category
        grouped[category].forEach(product => {
          tableData.push(headers.map(header => getCellValue(product, header)));
        });
        // Add empty row
        tableData.push(Array(headerLabels.length).fill(''));
      });
    }
    // If only Price Class grouping is selected
    else if (!groupByCategory && groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.PriceClass === 'object') {
          return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
        }
        return p.PriceClass && String(p.PriceClass).trim() !== '';
      });
      
      const grouped = validProducts.reduce((acc, product) => {
        let priceClass = 'Unknown';
        if (typeof product.PriceClass === 'object') {
          priceClass = product.PriceClass?.Class_Desc || 'Unknown';
        } else if (typeof product.PriceClass === 'string') {
          priceClass = product.PriceClass;
        }
        if (!acc[priceClass]) {
          acc[priceClass] = [];
        }
        acc[priceClass].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedPriceClasses = Object.keys(grouped).sort();

      sortedPriceClasses.forEach(priceClass => {
        // Add price class header row
        tableData.push([`=== ${priceClass} ===`, ...Array(headerLabels.length - 1).fill('')]);
        // Add products for this price class
        grouped[priceClass].forEach(product => {
          tableData.push(headers.map(header => getCellValue(product, header)));
        });
        // Add empty row
        tableData.push(Array(headerLabels.length).fill(''));
      });
    }
    // If only OTP Number grouping is selected
    else if (!groupByCategory && !groupByPriceClass && groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.OTP_Number != null);
      
      const grouped = validProducts.reduce((acc, product) => {
        const otpNumber = product.OTP_Number;
        if (!acc[otpNumber]) {
          acc[otpNumber] = [];
        }
        acc[otpNumber].push(product);
        return acc;
      }, {} as { [key: number]: Product[] });

      const sortedOTPNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      sortedOTPNumbers.forEach(otpNumber => {
        // Add OTP number header row
        tableData.push([`=== OTP Number: ${otpNumber} ===`, ...Array(headerLabels.length - 1).fill('')]);
        // Add products for this OTP number
        grouped[otpNumber].forEach(product => {
          tableData.push(headers.map(header => getCellValue(product, header)));
        });
        // Add empty row
        tableData.push(Array(headerLabels.length).fill(''));
      });
    }
    // If only Primary Vendor grouping is selected
    else if (!groupByCategory && !groupByPriceClass && !groupByOTP && groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.primaryVendor?.V_Description);
      
      const grouped = validProducts.reduce((acc, product) => {
        const vendorName = product.primaryVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedVendors = Object.keys(grouped).sort();

      sortedVendors.forEach(vendorName => {
        // Add vendor header row
        tableData.push([`=== ${vendorName} ===`, ...Array(headerLabels.length - 1).fill('')]);
        // Add products for this vendor
        grouped[vendorName].forEach(product => {
          tableData.push(headers.map(header => getCellValue(product, header)));
        });
        // Add empty row
        tableData.push(Array(headerLabels.length).fill(''));
      });
    }
    // If only Manufacturer Vendor grouping is selected
    else if (!groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.manufacturerVendor?.V_Description);
      
      const grouped = validProducts.reduce((acc, product) => {
        const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });

      const sortedVendors = Object.keys(grouped).sort();

      sortedVendors.forEach(vendorName => {
        // Add vendor header row
        tableData.push([`=== ${vendorName} ===`, ...Array(headerLabels.length - 1).fill('')]);
        // Add products for this vendor
        grouped[vendorName].forEach(product => {
          tableData.push(headers.map(header => getCellValue(product, header)));
        });
        // Add empty row
        tableData.push(Array(headerLabels.length).fill(''));
      });
    }
    // Regular flat report (no grouping)
    else {
      products.forEach(product => {
        tableData.push(headers.map(header => getCellValue(product, header)));
      });
    }

    // Generate table using autoTable (v5+ uses function call instead of method)
    // Handle both default export and named export
    const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
    
    // Calculate column widths based on number of columns
    const totalColumns = headerLabels.length;
    const availableWidth = pageWidth - (margin * 2); // 190mm for A4 portrait
    
    // Define column widths: Item_Number (smaller), Description (larger), others (equal)
    const columnWidths: (number | 'auto')[] = [];
    if (totalColumns === 2) {
      // Item_Number and Description only
      columnWidths.push(30, availableWidth - 30);
    } else if (totalColumns === 3) {
      // Item_Number, Description, and 1 other
      columnWidths.push(25, (availableWidth - 25) * 0.6, (availableWidth - 25) * 0.4);
    } else if (totalColumns === 4) {
      // Item_Number, Description, and 2 others
      columnWidths.push(22, (availableWidth - 22) * 0.5, (availableWidth - 22) * 0.25, (availableWidth - 22) * 0.25);
    } else if (totalColumns === 5) {
      // Item_Number, Description, and 3 others
      columnWidths.push(20, (availableWidth - 20) * 0.45, (availableWidth - 20) * 0.18, (availableWidth - 20) * 0.18, (availableWidth - 20) * 0.19);
    } else if (totalColumns === 6) {
      // Item_Number, Description, and 4 others
      columnWidths.push(18, (availableWidth - 18) * 0.4, (availableWidth - 18) * 0.15, (availableWidth - 18) * 0.15, (availableWidth - 18) * 0.15, (availableWidth - 18) * 0.15);
    } else {
      // 7+ columns - distribute evenly but keep Item_Number and Description proportional
      const otherColsWidth = (availableWidth - 20) / totalColumns;
      columnWidths.push(20, otherColsWidth * 1.5, ...Array(totalColumns - 2).fill(otherColsWidth));
    }
    
    autoTableFn(doc, {
      head: [headerLabels],
      body: tableData,
      startY: yPosition,
      columnStyles: headerLabels.reduce((acc, _, index) => {
        acc[index] = { cellWidth: columnWidths[index] || 'auto' };
        return acc;
      }, {} as { [key: number]: { cellWidth: number | 'auto' } }),
      styles: { 
        fontSize: 6, 
        cellPadding: 1.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        textColor: [0, 0, 0],
        font: 'helvetica',
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 6,
        cellPadding: 1.5,
        halign: 'left',
      },
      alternateRowStyles: { 
        fillColor: [250, 250, 250] 
      },
      margin: { top: 5, left: margin, right: margin, bottom: 8 },
      tableWidth: availableWidth,
      showHead: 'everyPage',
      didDrawPage: footerCallback,
      didParseCell: (data: any) => {
        // Style category/price class header rows
        if (data.row.raw && data.row.raw[0] && data.row.raw[0].toString().startsWith('===')) {
          // Style all cells in the header row
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontSize = 8;
          data.cell.styles.halign = 'left';
          // Merge cells for header row
          if (data.column.index === 0) {
            data.cell.colSpan = headerLabels.length;
          } else {
            data.cell.text = '';
          }
        }
      },
      willDrawCell: (data: any) => {
        // Add top padding to header only on first page and center vertically
        if (data.section === 'head' && data.row.index === 0) {
          // Check if this is the first page by comparing Y position
          // First page header will be at yPosition (around 13mm), subsequent pages at top (around 5mm)
          const cellY = data.cell.y || 0;
          const isFirstPage = cellY >= yPosition - 2; // Allow 2mm tolerance
          
          // Convert cellPadding to object if it's a number
          if (typeof data.cell.styles.cellPadding === 'number') {
            const paddingValue = data.cell.styles.cellPadding;
            data.cell.styles.cellPadding = {
              top: isFirstPage ? 4 : paddingValue,
              right: paddingValue,
              bottom: isFirstPage ? 4 : paddingValue,
              left: paddingValue,
            };
          } else {
            // It's already an object, just update top and bottom for first page
            data.cell.styles.cellPadding = {
              ...data.cell.styles.cellPadding,
              top: isFirstPage ? 4 : 2,
              bottom: isFirstPage ? 4 : 2,
            };
          }
          
          // Center text vertically in header cells
          data.cell.styles.valign = 'middle';
        }
      },
    });

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooterToPage(doc, logoDataUrl || undefined);
    }

    return doc;
  };

  // Barcode cache to avoid regenerating the same barcode multiple times
  const barcodeCache = new Map<string, string>();
  
  // Helper function to generate barcode image data URL - optimized for speed and quality
  const generateBarcodeImage = (upc: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!upc || upc.trim() === '') {
        resolve(null);
        return;
      }
      
      const upcValue = upc.trim();
      
      // Check cache first
      if (barcodeCache.has(upcValue)) {
        resolve(barcodeCache.get(upcValue)!);
        return;
      }
      
      try {
        // Create a canvas element with optimized dimensions for PDF
        const canvas = document.createElement('canvas');
        
        // Optimized canvas size for faster rendering and good quality
        canvas.width = 200;
        canvas.height = 50;
        
        // Use CODE128 for all UPCs - most flexible and fast
        const format = 'CODE128';
        
        // Generate barcode with optimized settings for speed and clarity
        JsBarcode(canvas, upcValue, {
          format: format,
          width: 1.5, // Slightly thinner for faster rendering
          height: 40,
          displayValue: false,
          margin: 1,
          background: '#ffffff',
          lineColor: '#000000',
        });
        
        // Convert to data URL
        try {
          // Use PNG for barcodes (no compression artifacts)
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          if (dataUrl && dataUrl !== 'data:,') {
            // Cache the result
            barcodeCache.set(upcValue, dataUrl);
            resolve(dataUrl);
          } else {
            console.warn('Barcode generation returned empty data URL for UPC:', upcValue);
            resolve(null);
          }
        } catch (error) {
          console.error('Error converting barcode canvas to data URL:', error);
          resolve(null);
        }
      } catch (error) {
        console.error('Error generating barcode:', error, 'UPC:', upc);
        resolve(null);
      }
    });
  };

  // Generate 4 Week Order Form PDF
  const generate4WeekOrderFormPDF = async (products: Product[], groupByCategory: boolean, groupByPriceClass: boolean, groupByOTP: boolean, groupByPrimaryVendor: boolean, groupByManufacturerVendor: boolean) => {
    // Load logo first
    const logoDataUrl = await loadLogoAsDataUrl();
    
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10; // Left and right margins
    let yPosition = 15;

    // Header - Only on first page
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Form 4 Week', margin, yPosition);
    
    // Date - Top Right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const date = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getFullYear()}`;
    doc.text(date, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 8;
    
    // Customer field - full width
    doc.setFontSize(10);
    doc.text('Customer:', margin, yPosition);
    // Draw a full-width box for customer input (from after "Customer:" label to right margin)
    doc.setDrawColor(200, 200, 200);
    const customerLabelWidth = 25; // Approximate width of "Customer:" text
    const customerInputX = margin + customerLabelWidth;
    const customerInputWidth = pageWidth - margin - customerInputX;
    doc.rect(customerInputX, yPosition - 4, customerInputWidth, 6);
    
    yPosition += 10;

    // Table headers - use full available width (210mm - 20mm margins = 190mm)
    // Order: Item Number, Description, Size, Price, Retail, Week 1, Week 2, Week 3, Week 4
    const headers = ['Item', 'Description', 'Size', 'Price', 'Retail', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const availableWidth = pageWidth - (margin * 2); // 190mm
    // Base widths for fixed columns (excluding description): Item + Size + Price + Retail + 4 Weeks
    // Calculation: Item(12) + Description(?) + Size(12) + Price(14) + Retail(14) + Week1(14) + Week2(14) + Week3(14) + Week4(14) = 190
    // 12 + ? + 12 + 14*6 = 12 + ? + 12 + 84 = 108 + ? = 190, so ? = 82mm
    const fixedWidthTotal = 12 + 12 + (14 * 6); // Item + Size + (Price + Retail + 4 Weeks) = 108mm
    const descriptionWidth = availableWidth - fixedWidthTotal; // 190 - 108 = 82mm
    const colWidths = [12, descriptionWidth, 12, 14, 14, 14, 14, 14, 14]; // Total: exactly 190mm
    const startX = margin;
    const endX = pageWidth - margin; // Right edge should match left margin
    const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);

    // Draw header row
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let xPos = startX;
    headers.forEach((header, idx) => {
      doc.rect(xPos, yPosition - 5, colWidths[idx], 6);
      // For week headers, ensure they stay on one line by using smaller font or no wrapping
      if (header.startsWith('Week')) {
        doc.setFontSize(7);
        doc.text(header, xPos + 1, yPosition - 1.5, { maxWidth: colWidths[idx] - 2 });
        doc.setFontSize(8);
      } else {
        doc.text(header, xPos + 2, yPosition - 1, { maxWidth: colWidths[idx] - 4 });
      }
      xPos += colWidths[idx];
    });
    
    yPosition += 5;

    // Table data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // Helper function to render a product row (defined first so it can be used in grouping logic)
    function renderProductRow(product: Product) {
      // Check if we need a new page - use more of the page space
      if (yPosition > pageHeight - 10) {
        doc.addPage();
        yPosition = 15;
        
        // Redraw headers on new page (no customer field on subsequent pages)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        xPos = startX;
        headers.forEach((header, hIdx) => {
          doc.rect(xPos, yPosition - 5, colWidths[hIdx], 6);
          // For week headers, ensure they stay on one line
          if (header.startsWith('Week')) {
            doc.setFontSize(7);
            doc.text(header, xPos + 1, yPosition - 1.5, { maxWidth: colWidths[hIdx] - 2 });
            doc.setFontSize(8);
          } else {
            doc.text(header, xPos + 2, yPosition - 1, { maxWidth: colWidths[hIdx] - 4 });
          }
          xPos += colWidths[hIdx];
        });
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      const itemNumber = product.Item_Number?.toString() || '';
      const description = product.Description || '';
      const size = product.UOM || '';
      const price = product.Price1?.toFixed(2) || '0.00';
      const retail = product.Retail1?.toFixed(2) || '';
      
      // Calculate description height - split text into lines to determine row height
      doc.setFontSize(7);
      const descriptionLines = doc.splitTextToSize(description, colWidths[1] - 2);
      const lineHeight = 3.5; // Height per line in mm
      const descriptionHeight = descriptionLines.length * lineHeight;
      const minRowHeight = 5;
      const rowHeight = Math.max(minRowHeight, descriptionHeight + 1); // Add 1mm padding
      
      // Draw row - Order: Item Number, Description, Size, Price, Retail, Week 1, Week 2, Week 3, Week 4
      xPos = startX;
      const rowData = [itemNumber, description, size, price, retail, '', '', '', ''];
      
      rowData.forEach((cell, cellIdx) => {
        const cellTop = yPosition - 4;
        doc.rect(xPos, cellTop, colWidths[cellIdx], rowHeight);
        
        if (cell) {
          if (cellIdx === 1) { // Description column - center vertically, multi-line support
            // Calculate vertical center for multi-line text
            const totalTextHeight = descriptionLines.length * lineHeight;
            const cellCenterY = cellTop + (rowHeight / 2);
            const textStartY = cellCenterY - (totalTextHeight / 2) + (lineHeight / 2);
            
            // Draw description with proper line breaks, centered vertically
            let lineY = textStartY;
            descriptionLines.forEach((line: string) => {
              doc.text(line, xPos + 1, lineY, { maxWidth: colWidths[cellIdx] - 2, align: 'left' });
              lineY += lineHeight;
            });
          } else {
            // Center text vertically in all other cells
            const textY = cellTop + (rowHeight / 2) + 0.5;
            doc.text(cell, xPos + 1, textY, { maxWidth: colWidths[cellIdx] - 2, align: 'left' });
          }
        } else {
          // Draw a line at the bottom of the cell for empty cells (week columns)
          doc.setDrawColor(150, 150, 150);
          doc.line(xPos + 1, cellTop + rowHeight - 0.5, xPos + colWidths[cellIdx] - 1, cellTop + rowHeight - 0.5);
          doc.setDrawColor(200, 200, 200);
        }
        xPos += colWidths[cellIdx];
      });
      
      // Verify table ends at right margin (Week 4 should align with page edge)
      const currentTableEnd = startX + totalTableWidth;
      if (Math.abs(currentTableEnd - endX) > 0.1) {
        // This shouldn't happen, but if it does, we've calculated wrong
        console.warn(`Table width mismatch: expected ${endX}, got ${currentTableEnd}`);
      }
      
      yPosition += rowHeight;
    }
    
    // Helper function to draw a grouping header row
    const drawGroupHeader = (headerText: string) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 10) {
        doc.addPage();
        yPosition = 15;
        
        // Redraw headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        xPos = startX;
        headers.forEach((header, hIdx) => {
          doc.rect(xPos, yPosition - 5, colWidths[hIdx], 6);
          if (header.startsWith('Week')) {
            doc.setFontSize(7);
            doc.text(header, xPos + 1, yPosition - 1.5, { maxWidth: colWidths[hIdx] - 2 });
            doc.setFontSize(8);
          } else {
            doc.text(header, xPos + 2, yPosition - 1, { maxWidth: colWidths[hIdx] - 4 });
          }
          xPos += colWidths[hIdx];
        });
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      // Draw group header row - lighter background, not black
      const headerHeight = 5;
      const headerTop = yPosition - 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setFillColor(245, 245, 245); // Very light gray background
      doc.rect(startX, headerTop, totalTableWidth, headerHeight, 'F');
      doc.setDrawColor(220, 220, 220); // Light gray border
      doc.rect(startX, headerTop, totalTableWidth, headerHeight);
      doc.setTextColor(100, 100, 100); // Dark gray text, not black
      doc.text(headerText, startX + 2, headerTop + 3.5);
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      yPosition += headerHeight + 1; // Add small gap after header
    };
    
    // Group products if grouping is selected
    let productsToRender: Product[] = [];
    let groupedData: { [key: string]: Product[] } | { [key: number]: Product[] } = {};
    let groupKeys: string[] | number[] = [];
    
    if (groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.SalesCategory === 'object') {
          return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
        }
        return p.SalesCategory && String(p.SalesCategory).trim() !== '';
      });
      
      groupedData = validProducts.reduce((acc, product) => {
        let category = 'Unknown';
        if (typeof product.SalesCategory === 'object') {
          category = product.SalesCategory?.Category_Desc || 'Unknown';
        } else if (typeof product.SalesCategory === 'string') {
          category = product.SalesCategory;
        }
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else if (!groupByCategory && groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.PriceClass === 'object') {
          return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
        }
        return p.PriceClass && String(p.PriceClass).trim() !== '';
      });
      
      groupedData = validProducts.reduce((acc, product) => {
        let priceClass = 'Unknown';
        if (typeof product.PriceClass === 'object') {
          priceClass = product.PriceClass?.Class_Desc || 'Unknown';
        } else if (typeof product.PriceClass === 'string') {
          priceClass = product.PriceClass;
        }
        if (!acc[priceClass]) {
          acc[priceClass] = [];
        }
        acc[priceClass].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else if (!groupByCategory && !groupByPriceClass && groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.OTP_Number != null);
      
      groupedData = validProducts.reduce((acc, product) => {
        const otpNumber = product.OTP_Number;
        if (!acc[otpNumber]) {
          acc[otpNumber] = [];
        }
        acc[otpNumber].push(product);
        return acc;
      }, {} as { [key: number]: Product[] });
      
      groupKeys = Object.keys(groupedData).map(Number).sort((a, b) => a - b);
    } else if (!groupByCategory && !groupByPriceClass && !groupByOTP && groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.primaryVendor?.V_Description);
      
      groupedData = validProducts.reduce((acc, product) => {
        const vendorName = product.primaryVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else if (!groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.manufacturerVendor?.V_Description);
      
      groupedData = validProducts.reduce((acc, product) => {
        const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else {
      // No grouping - render all products directly
      productsToRender = products;
    }
    
    // Render grouped or ungrouped products
    if (groupKeys.length > 0) {
      groupKeys.forEach((groupKey) => {
        const groupProducts = (groupedData as any)[groupKey];
        let headerText = '';
        
        if (groupByCategory) {
          headerText = `=== ${groupKey} ===`;
        } else if (groupByPriceClass) {
          headerText = `=== ${groupKey} ===`;
        } else if (groupByOTP) {
          headerText = `=== OTP Number: ${groupKey} ===`;
        } else if (groupByPrimaryVendor) {
          headerText = `=== ${groupKey} ===`;
        } else if (groupByManufacturerVendor) {
          headerText = `=== ${groupKey} ===`;
        }
        
        drawGroupHeader(headerText);
        
        groupProducts.forEach((product: Product) => {
          renderProductRow(product);
        });
        
        // Add spacer after group
        yPosition += 2;
      });
    } else {
      // No grouping - render all products
      productsToRender.forEach((product) => {
        renderProductRow(product);
      });
    }

    // Add footer to all pages
    const totalPages4Week = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages4Week; i++) {
      doc.setPage(i);
      addFooterToPage(doc, logoDataUrl || undefined);
    }

    return doc;
  };

  // Generate 8 Week Order Form PDF with UPC Barcodes
  const generate8WeekOrderFormPDF = async (products: Product[], groupByCategory: boolean, groupByPriceClass: boolean, groupByOTP: boolean, groupByPrimaryVendor: boolean, groupByManufacturerVendor: boolean, upcType: 'retail' | 'primary' | 'case' | 'item' = 'retail') => {
    // Load logo first
    const logoDataUrl = await loadLogoAsDataUrl();
    
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = 15;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Form 8 Week W/UPC', pageWidth / 2, yPosition, { align: 'center' });
    
    // Date - Top Left
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const date = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getFullYear()}`;
    doc.text(date, margin, yPosition);
    
    // Page number - Top Right
    doc.setFontSize(8);
    doc.text('Page 1', pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 10;

    // Table headers - Calculate column widths similar to 4-week form
    const availableWidth = pageWidth - (margin * 2); // 190mm
    const fixedWidthTotal = 35 + 100; // UPC + Description = 135mm
    const weekColWidth = (availableWidth - fixedWidthTotal) / 8; // Remaining width divided by 8 weeks
    const colWidths = [35, 100, weekColWidth, weekColWidth, weekColWidth, weekColWidth, weekColWidth, weekColWidth, weekColWidth, weekColWidth]; // UPC, Description, 8 Weeks
    const startX = margin;

    // Draw header row
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let xPos = startX;
    
    // UPC Number header
    doc.rect(xPos, yPosition - 5, colWidths[0], 6);
    doc.text('UPC Number', xPos + 2, yPosition - 1, { maxWidth: colWidths[0] - 4 });
    xPos += colWidths[0];
    
    // Description header
    doc.rect(xPos, yPosition - 5, colWidths[1], 6);
    doc.text('Description', xPos + 2, yPosition - 1, { maxWidth: colWidths[1] - 4 });
    xPos += colWidths[1];
    
    // Week headers (W1, W2, ..., W8)
    for (let i = 0; i < 8; i++) {
      doc.rect(xPos, yPosition - 5, colWidths[2 + i], 6);
      doc.setFontSize(7);
      doc.text(`W${i + 1}`, xPos + 1, yPosition - 1.5, { maxWidth: colWidths[2 + i] - 2 });
      doc.setFontSize(8);
      xPos += colWidths[2 + i];
    }
    
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // Helper function to draw a grouping header row
    const drawGroupHeader = (headerText: string) => {
      // Check if we need a new page - leave enough space for footer (18mm from bottom)
      if (yPosition > pageHeight - 18) {
        doc.addPage();
        yPosition = 15;
        
        // Redraw headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        xPos = startX;
        
        doc.rect(xPos, yPosition - 5, colWidths[0], 6);
        doc.text('UPC Number', xPos + 2, yPosition - 1, { maxWidth: colWidths[0] - 4 });
        xPos += colWidths[0];
        
        doc.rect(xPos, yPosition - 5, colWidths[1], 6);
        doc.text('Description', xPos + 2, yPosition - 1, { maxWidth: colWidths[1] - 4 });
        xPos += colWidths[1];
        
        // Week headers (W1, W2, ..., W8)
        for (let i = 0; i < 8; i++) {
          doc.rect(xPos, yPosition - 5, colWidths[2 + i], 6);
          doc.setFontSize(7);
          doc.text(`W${i + 1}`, xPos + 1, yPosition - 1.5, { maxWidth: colWidths[2 + i] - 2 });
          doc.setFontSize(8);
          xPos += colWidths[2 + i];
        }
        
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      // Draw group header row - lighter background, not black
      const headerHeight = 5;
      const headerTop = yPosition - 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setFillColor(245, 245, 245); // Very light gray background
      const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      doc.rect(startX, headerTop, totalTableWidth, headerHeight, 'F');
      doc.setDrawColor(220, 220, 220); // Light gray border
      doc.rect(startX, headerTop, totalTableWidth, headerHeight);
      doc.setTextColor(100, 100, 100); // Dark gray text, not black
      doc.text(headerText, startX + 2, headerTop + 3.5);
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      yPosition += headerHeight + 1; // Add small gap after header
    };
    
    // Helper function to render a product row
    async function renderProductRow(product: Product) {
      // Check if we need a new page - leave enough space for footer (18mm from bottom)
      // This ensures footer (5mm from bottom + 4mm logo height + padding) doesn't get overwritten
      if (yPosition > pageHeight - 18) {
        doc.addPage();
        yPosition = 15;
        
        // Redraw headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        xPos = startX;
        
        doc.rect(xPos, yPosition - 5, colWidths[0], 6);
        doc.text('UPC Number', xPos + 2, yPosition - 1, { maxWidth: colWidths[0] - 4 });
        xPos += colWidths[0];
        
        doc.rect(xPos, yPosition - 5, colWidths[1], 6);
        doc.text('Description', xPos + 2, yPosition - 1, { maxWidth: colWidths[1] - 4 });
        xPos += colWidths[1];
        
        // Week headers (W1, W2, ..., W8)
        for (let i = 0; i < 8; i++) {
          doc.rect(xPos, yPosition - 5, colWidths[2 + i], 6);
          doc.setFontSize(7);
          doc.text(`W${i + 1}`, xPos + 1, yPosition - 1.5, { maxWidth: colWidths[2 + i] - 2 });
          doc.setFontSize(8);
          xPos += colWidths[2 + i];
        }
        
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }

      // Get UPC/Item Number based on selected type - take only the first one if multiple exist
      let upcValue = '';
      if (upcType === 'retail') {
        // Get first Retail UPC (Status 1)
        if (product.UPCList && Array.isArray(product.UPCList)) {
          const retailUPC = product.UPCList.find(upc => upc.Status === 1);
          upcValue = retailUPC ? retailUPC.UPC_Number.trim() : '';
        }
      } else if (upcType === 'primary') {
        // Get first Primary UPC (Status 0)
        if (product.UPCList && Array.isArray(product.UPCList)) {
          const primaryUPC = product.UPCList.find(upc => upc.Status === 0);
          upcValue = primaryUPC ? primaryUPC.UPC_Number.trim() : '';
        }
      } else if (upcType === 'case') {
        // Get first Case UPC (Status 2)
        if (product.UPCList && Array.isArray(product.UPCList)) {
          const caseUPC = product.UPCList.find(upc => upc.Status === 2);
          upcValue = caseUPC ? caseUPC.UPC_Number.trim() : '';
        }
      } else if (upcType === 'item') {
        upcValue = product.Item_Number?.toString() || '';
      }
      
      const description = product.Description || '';
      
      // Check if we have a UPC/Item Number barcode - if yes, increase row height to match preview
      const hasBarcode = upcValue && upcValue.trim() !== '';
      
      // Calculate description height for row height
      doc.setFontSize(7);
      const descriptionLines = doc.splitTextToSize(description, colWidths[1] - 2);
      const lineHeight = 3.5;
      const descriptionHeight = descriptionLines.length * lineHeight;
      
      // Row height: 12mm if barcode exists (to match preview), otherwise based on description
      const minRowHeight = hasBarcode ? 12 : 5;
      const rowHeight = Math.max(minRowHeight, descriptionHeight + 1);
      
      // Draw row starting from proper position - use consistent cellTop
      xPos = startX;
      const cellTop = yPosition - 4;
      
      // UPC Number column with barcode
      doc.rect(xPos, cellTop, colWidths[0], rowHeight);
      if (upcValue) {
        // Get barcode from cache (should already be generated)
        const barcodeImage = barcodeCache.has(upcValue) 
          ? barcodeCache.get(upcValue)! 
          : await generateBarcodeImage(upcValue);
        if (barcodeImage) {
          try {
            // Add barcode image - match preview size: maxWidth 120px (≈32mm), maxHeight 40px (≈10.5mm)
            // Center both horizontally and vertically in the cell
            const barcodeWidth = Math.min(colWidths[0] - 2, 32); // Max 32mm width (≈120px)
            const barcodeHeight = Math.min(10.5, rowHeight - 2); // Max 10.5mm height (≈40px)
            const barcodeX = xPos + 1 + ((colWidths[0] - 2 - barcodeWidth) / 2); // Center horizontally
            const barcodeY = cellTop + (rowHeight / 2) - (barcodeHeight / 2); // Center vertically
            doc.addImage(barcodeImage, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
          } catch (error) {
            console.error('Error adding barcode image to PDF:', error);
            // Fallback to text with asterisks - centered
            doc.text(`*${upcValue}*`, xPos + 2, cellTop + (rowHeight / 2) + 0.5, { maxWidth: colWidths[0] - 4, align: 'center' });
          }
        } else {
          // Fallback to text with asterisks - centered
          doc.text(`*${upcValue}*`, xPos + 2, cellTop + (rowHeight / 2) + 0.5, { maxWidth: colWidths[0] - 4, align: 'center' });
        }
      } else {
        // Show asterisks if no UPC/Item Number - centered
        doc.text('*', xPos + 2, cellTop + (rowHeight / 2) + 0.5, { align: 'center' });
      }
      xPos += colWidths[0];
      
      // Description column - center vertically, proper alignment
      doc.rect(xPos, cellTop, colWidths[1], rowHeight);
      if (descriptionLines.length === 1) {
        // Single line - center vertically in middle of cell
        doc.text(description, xPos + 1, cellTop + (rowHeight / 2) + 0.5, { maxWidth: colWidths[1] - 2, align: 'left' });
      } else {
        // Multi-line - center vertically in middle of cell
        const totalTextHeight = descriptionLines.length * lineHeight;
        const cellCenterY = cellTop + (rowHeight / 2);
        const textStartY = cellCenterY - (totalTextHeight / 2) + (lineHeight / 2);
        let lineY = textStartY;
        descriptionLines.forEach((line: string) => {
          doc.text(line, xPos + 1, lineY, { maxWidth: colWidths[1] - 2, align: 'left' });
          lineY += lineHeight;
        });
      }
      xPos += colWidths[1];
      
      // Week columns (8 columns) - simple cells with line at bottom
      for (let i = 0; i < 8; i++) {
        doc.rect(xPos, cellTop, colWidths[2 + i], rowHeight);
        // Draw a line at the bottom of the cell for input
        doc.setDrawColor(150, 150, 150);
        doc.line(xPos + 1, cellTop + rowHeight - 0.5, xPos + colWidths[2 + i] - 1, cellTop + rowHeight - 0.5);
        doc.setDrawColor(200, 200, 200);
        xPos += colWidths[2 + i];
      }
      
      yPosition += rowHeight;
    }
    
    // Group products if grouping is selected
    let productsToRender: Product[] = [];
    let groupedData: { [key: string]: Product[] } | { [key: number]: Product[] } = {};
    let groupKeys: string[] | number[] = [];
    
    if (groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.SalesCategory === 'object') {
          return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
        }
        return p.SalesCategory && String(p.SalesCategory).trim() !== '';
      });
      
      groupedData = validProducts.reduce((acc, product) => {
        let category = 'Unknown';
        if (typeof product.SalesCategory === 'object') {
          category = product.SalesCategory?.Category_Desc || 'Unknown';
        } else if (typeof product.SalesCategory === 'string') {
          category = product.SalesCategory;
        }
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else if (!groupByCategory && groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => {
        if (typeof p.PriceClass === 'object') {
          return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
        }
        return p.PriceClass && String(p.PriceClass).trim() !== '';
      });
      
      groupedData = validProducts.reduce((acc, product) => {
        let priceClass = 'Unknown';
        if (typeof product.PriceClass === 'object') {
          priceClass = product.PriceClass?.Class_Desc || 'Unknown';
        } else if (typeof product.PriceClass === 'string') {
          priceClass = product.PriceClass;
        }
        if (!acc[priceClass]) {
          acc[priceClass] = [];
        }
        acc[priceClass].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else if (!groupByCategory && !groupByPriceClass && groupByOTP && !groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.OTP_Number != null);
      
      groupedData = validProducts.reduce((acc, product) => {
        const otpNumber = product.OTP_Number;
        if (!acc[otpNumber]) {
          acc[otpNumber] = [];
        }
        acc[otpNumber].push(product);
        return acc;
      }, {} as { [key: number]: Product[] });
      
      groupKeys = Object.keys(groupedData).map(Number).sort((a, b) => a - b);
    } else if (!groupByCategory && !groupByPriceClass && !groupByOTP && groupByPrimaryVendor && !groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.primaryVendor?.V_Description);
      
      groupedData = validProducts.reduce((acc, product) => {
        const vendorName = product.primaryVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else if (!groupByCategory && !groupByPriceClass && !groupByOTP && !groupByPrimaryVendor && groupByManufacturerVendor) {
      const validProducts = products.filter(p => p.manufacturerVendor?.V_Description);
      
      groupedData = validProducts.reduce((acc, product) => {
        const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(product);
        return acc;
      }, {} as { [key: string]: Product[] });
      
      groupKeys = Object.keys(groupedData).sort();
    } else {
      // No grouping - render all products directly
      productsToRender = products;
    }
    
    // Helper function to get UPC value from product
    const getUPCValue = (product: Product): string => {
      if (upcType === 'retail') {
        if (product.UPCList && Array.isArray(product.UPCList)) {
          const retailUPC = product.UPCList.find(upc => upc.Status === 1);
          return retailUPC ? retailUPC.UPC_Number.trim() : '';
        }
      } else if (upcType === 'primary') {
        if (product.UPCList && Array.isArray(product.UPCList)) {
          const primaryUPC = product.UPCList.find(upc => upc.Status === 0);
          return primaryUPC ? primaryUPC.UPC_Number.trim() : '';
        }
      } else if (upcType === 'case') {
        if (product.UPCList && Array.isArray(product.UPCList)) {
          const caseUPC = product.UPCList.find(upc => upc.Status === 2);
          return caseUPC ? caseUPC.UPC_Number.trim() : '';
        }
      } else if (upcType === 'item') {
        return product.Item_Number?.toString() || '';
      }
      return '';
    };
    
    // Pre-generate barcodes in smaller batches to prevent browser hang
    // Process in chunks of 15 products at a time with small delays between batches
    const allProducts = groupKeys.length > 0 
      ? (groupKeys.flatMap(key => (groupedData as any)[key]) as Product[])
      : productsToRender;
    
    const BATCH_SIZE = 15; // Process 15 barcodes at a time
    const BATCH_DELAY = 10; // 10ms delay between batches to let browser breathe
    
    // Extract unique UPC values first (avoid duplicates)
    const uniqueUPCs = new Set<string>();
    allProducts.forEach(product => {
      const upcValue = getUPCValue(product);
      if (upcValue && !barcodeCache.has(upcValue)) {
        uniqueUPCs.add(upcValue);
      }
    });
    
    const upcArray = Array.from(uniqueUPCs);
    
    // Process barcodes in batches
    for (let i = 0; i < upcArray.length; i += BATCH_SIZE) {
      const batch = upcArray.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(upc => generateBarcodeImage(upc));
      await Promise.all(batchPromises);
      
      // Small delay between batches to prevent browser freezing
      if (i + BATCH_SIZE < upcArray.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    // Now render products (barcodes are cached, so rendering is fast)
    if (groupKeys.length > 0) {
      for (const groupKey of groupKeys) {
        const groupProducts = (groupedData as any)[groupKey];
        let headerText = '';
        
        if (groupByCategory) {
          headerText = `=== ${groupKey} ===`;
        } else if (groupByPriceClass) {
          headerText = `=== ${groupKey} ===`;
        } else if (groupByOTP) {
          headerText = `=== OTP Number: ${groupKey} ===`;
        } else if (groupByPrimaryVendor) {
          headerText = `=== ${groupKey} ===`;
        } else if (groupByManufacturerVendor) {
          headerText = `=== ${groupKey} ===`;
        }
        
        drawGroupHeader(headerText);
        
        // Render products with periodic yields to prevent browser freezing
        for (let idx = 0; idx < groupProducts.length; idx++) {
          await renderProductRow(groupProducts[idx]);
          
          // Yield control to browser every 20 products to prevent freezing
          if (idx > 0 && idx % 20 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        // Add spacer after group
        yPosition += 2;
      }
    } else {
      // No grouping - render all products with periodic yields
      for (let idx = 0; idx < productsToRender.length; idx++) {
        await renderProductRow(productsToRender[idx]);
        
        // Yield control to browser every 20 products to prevent freezing
        if (idx > 0 && idx % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    // Add footer to all pages
    const totalPages8Week = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages8Week; i++) {
      doc.setPage(i);
      addFooterToPage(doc, logoDataUrl || undefined);
    }

    return doc;
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setLoadingProgress({ loaded: 0, total: 0, stage: 'Fetching data...' });
    setPreviewPage(0);
    
    try {
      // Fetch all products with proper response handling
      setLoadingProgress({ loaded: 0, total: 0, stage: 'Downloading data from server...' });
      
      // Track download progress
      const res = await inventoryForReport((progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setLoadingProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            stage: `Downloading... ${percentCompleted}%`,
          });
        } else {
          setLoadingProgress({
            loaded: progressEvent.loaded,
            total: 0,
            stage: `Downloading... ${(progressEvent.loaded / 1024 / 1024).toFixed(2)} MB`,
          });
        }
      });
      
      // Extract data from axios response
      let products: Product[] = [];
      if (res && typeof res === 'object') {
        if ('data' in res && Array.isArray((res as any).data)) {
          products = (res as any).data;
        } else if (Array.isArray(res)) {
          products = res as Product[];
        }
      }

      if (!Array.isArray(products) || products.length === 0) {
        toast.error('No products found to preview');
        setPreviewLoading(false);
        return;
      }

      setLoadingProgress({ loaded: products.length, total: products.length, stage: `Processing ${products.length} products...` });

      // Optimized filtering - combine all filters in one pass for better performance
      setLoadingProgress({ loaded: 0, total: products.length, stage: 'Applying filters...' });
      
      let filteredProducts = products;
      
      // Apply all filters in a single pass for better performance
      filteredProducts = products.filter(p => {
        // Active/Inactive filter
        if (activeFilter === 'active' && p.I_Inactive) return false;
        if (activeFilter === 'inactive' && !p.I_Inactive) return false;
        
        // Sales Category filter
        if (selectedSalesCategories.length > 0) {
          let categoryNumber: number | undefined;
          if (typeof p.SalesCategory === 'object' && p.SalesCategory?.Sales_Category) {
            categoryNumber = p.SalesCategory.Sales_Category;
          }
          if (categoryNumber === undefined || !selectedSalesCategories.includes(categoryNumber)) {
            return false;
          }
        }
        
        // Price Class filter
        if (selectedPriceClasses.length > 0) {
          let priceClassNumber: number | undefined;
          if (typeof p.PriceClass === 'object' && p.PriceClass?.Price_Class) {
            priceClassNumber = p.PriceClass.Price_Class;
          }
          if (priceClassNumber === undefined || !selectedPriceClasses.includes(priceClassNumber)) {
            return false;
          }
        }
        
        // Grouping filters
        if (groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          if (typeof p.SalesCategory === 'object') {
            if (!p.SalesCategory?.Category_Desc || p.SalesCategory.Category_Desc.trim() === '') return false;
          } else if (!p.SalesCategory || String(p.SalesCategory).trim() === '') {
            return false;
          }
        } else if (!groupBySalesCategory && groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          if (typeof p.PriceClass === 'object') {
            if (!p.PriceClass?.Class_Desc || p.PriceClass.Class_Desc.trim() === '') return false;
          } else if (!p.PriceClass || String(p.PriceClass).trim() === '') {
            return false;
          }
        } else if (!groupBySalesCategory && !groupByPriceClass && groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          if (p.OTP_Number == null) return false;
        } else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && groupByPrimaryVendor && !groupByManufacturerVendor) {
          if (!p.primaryVendor?.V_Description) return false;
        } else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && groupByManufacturerVendor) {
          if (!p.manufacturerVendor?.V_Description) return false;
        }
        
        return true;
      });

      // Store original filtered data (before sorting and limiting)
      setOriginalFilteredData(filteredProducts);

      // Apply sorting with progress - use chunked processing for large datasets
      setLoadingProgress({ loaded: 0, total: filteredProducts.length, stage: 'Sorting data...' });
      
      // For large datasets, use chunked processing to avoid blocking
      let sortedProducts: Product[];
      if (filteredProducts.length > 10000) {
        // For very large datasets, process in chunks
        sortedProducts = await new Promise<Product[]>((resolve) => {
          setTimeout(() => {
            const sorted = applySorting(filteredProducts);
            setLoadingProgress({ loaded: filteredProducts.length, total: filteredProducts.length, stage: 'Finalizing...' });
            resolve(sorted);
          }, 0);
        });
      } else {
        // For smaller datasets, use requestAnimationFrame
        sortedProducts = await new Promise<Product[]>((resolve) => {
          requestAnimationFrame(() => {
            const sorted = applySorting(filteredProducts);
            resolve(sorted);
          });
        });
      }

      // Store full sorted filtered data for CSV/PDF generation and preview
      setFullFilteredData(sortedProducts);
      setPreviewData(sortedProducts);
      setShowPreview(true);
      
      toast.success(`Preview loaded with ${sortedProducts.length} products`);
    } catch (error: any) {
      console.error('Error loading preview:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      let errorMessage = 'Failed to load preview';
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The dataset is very large. Please try again or contact support.';
      } else if (error?.response?.status === 413) {
        errorMessage = 'Response too large. Please contact support to optimize the data.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setPreviewLoading(false);
      setLoadingProgress({ loaded: 0, total: 0, stage: '' });
    }
  };

  const handleGenerateCSV = async () => {
    setGeneratingReport(true);
    try {
      // Use full sorted data if available, otherwise sort the original filtered data
      const finalData = fullFilteredData.length > 0 ? fullFilteredData : applySorting(originalFilteredData);
      
      if (finalData.length === 0) {
        toast.error('No data to generate report');
        return;
      }

      let csvContent: string;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];

      if (reportType === '4week') {
        // Generate 4 Week Order Form CSV with grouping support
        const headers = ['Item', 'Description', 'Size', 'Price', 'Retail', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const csvHeaders = headers.join(',');
        const rows: string[] = [csvHeaders];
        
        // Group products if grouping is selected
        let groupedData: { [key: string]: Product[] } | { [key: number]: Product[] } = {};
        let groupKeys: string[] | number[] = [];
        
        if (groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => {
            if (typeof p.SalesCategory === 'object') {
              return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
            }
            return p.SalesCategory && String(p.SalesCategory).trim() !== '';
          });
          
          groupedData = validProducts.reduce((acc, product) => {
            let category = 'Unknown';
            if (typeof product.SalesCategory === 'object') {
              category = product.SalesCategory?.Category_Desc || 'Unknown';
            } else if (typeof product.SalesCategory === 'string') {
              category = product.SalesCategory;
            }
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        } else if (!groupBySalesCategory && groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => {
            if (typeof p.PriceClass === 'object') {
              return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
            }
            return p.PriceClass && String(p.PriceClass).trim() !== '';
          });
          
          groupedData = validProducts.reduce((acc, product) => {
            let priceClass = 'Unknown';
            if (typeof product.PriceClass === 'object') {
              priceClass = product.PriceClass?.Class_Desc || 'Unknown';
            } else if (typeof product.PriceClass === 'string') {
              priceClass = product.PriceClass;
            }
            if (!acc[priceClass]) {
              acc[priceClass] = [];
            }
            acc[priceClass].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        } else if (!groupBySalesCategory && !groupByPriceClass && groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => p.OTP_Number != null);
          
          groupedData = validProducts.reduce((acc, product) => {
            const otpNumber = product.OTP_Number;
            if (!acc[otpNumber]) {
              acc[otpNumber] = [];
            }
            acc[otpNumber].push(product);
            return acc;
          }, {} as { [key: number]: Product[] });
          
          groupKeys = Object.keys(groupedData).map(Number).sort((a, b) => a - b);
        } else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => p.primaryVendor?.V_Description);
          
          groupedData = validProducts.reduce((acc, product) => {
            const vendorName = product.primaryVendor?.V_Description || 'Unknown';
            if (!acc[vendorName]) {
              acc[vendorName] = [];
            }
            acc[vendorName].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        } else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => p.manufacturerVendor?.V_Description);
          
          groupedData = validProducts.reduce((acc, product) => {
            const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
            if (!acc[vendorName]) {
              acc[vendorName] = [];
            }
            acc[vendorName].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        }
        
        // Render grouped or ungrouped products
        if (groupKeys.length > 0) {
          groupKeys.forEach((groupKey) => {
            const groupProducts = (groupedData as any)[groupKey];
            let headerText = '';
            
            if (groupBySalesCategory) {
              headerText = `=== ${groupKey} ===`;
            } else if (groupByPriceClass) {
              headerText = `=== ${groupKey} ===`;
            } else if (groupByOTPNumber) {
              headerText = `=== OTP Number: ${groupKey} ===`;
            } else if (groupByPrimaryVendor) {
              headerText = `=== ${groupKey} ===`;
            } else if (groupByManufacturerVendor) {
              headerText = `=== ${groupKey} ===`;
            }
            
            // Add group header
            rows.push(`"${headerText}"`);
            
            // Add products for this group
            groupProducts.forEach((product: Product) => {
              const itemNumber = product.Item_Number?.toString() || '';
              const description = product.Description || '';
              const size = product.UOM || '';
              const price = product.Price1?.toFixed(2) || '0.00';
              const retail = product.Retail1?.toFixed(2) || '';
              const row = [
                escapeCSVValue(itemNumber),
                escapeCSVValue(description),
                escapeCSVValue(size),
                escapeCSVValue(price),
                escapeCSVValue(retail),
                '', // Week 1
                '', // Week 2
                '', // Week 3
                '', // Week 4
              ].join(',');
              rows.push(row);
            });
            
            // Add empty row between groups
            rows.push('');
          });
        } else {
          // No grouping - render all products
          finalData.forEach(product => {
            const itemNumber = product.Item_Number?.toString() || '';
            const description = product.Description || '';
            const size = product.UOM || '';
            const price = product.Price1?.toFixed(2) || '0.00';
            const retail = product.Retail1?.toFixed(2) || '';
            const row = [
              escapeCSVValue(itemNumber),
              escapeCSVValue(description),
              escapeCSVValue(size),
              escapeCSVValue(price),
              escapeCSVValue(retail),
              '', // Week 1
              '', // Week 2
              '', // Week 3
              '', // Week 4
            ].join(',');
            rows.push(row);
          });
        }
        
        csvContent = rows.join('\n');
        filename = `order-form-4week-${timestamp}.csv`;
      } else if (reportType === '8week') {
        // Generate 8 Week Order Form CSV with grouping support
        const headers = ['UPC Number', 'Description', 'Date 1', 'Date 2', 'Date 3', 'Date 4', 'Date 5', 'Date 6', 'Date 7', 'Date 8'];
        const csvHeaders = headers.join(',');
        const rows: string[] = [csvHeaders];
        
        // Group products if grouping is selected
        let groupedData: { [key: string]: Product[] } | { [key: number]: Product[] } = {};
        let groupKeys: string[] | number[] = [];
        
        if (groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => {
            if (typeof p.SalesCategory === 'object') {
              return p.SalesCategory?.Category_Desc && p.SalesCategory.Category_Desc.trim() !== '';
            }
            return p.SalesCategory && String(p.SalesCategory).trim() !== '';
          });
          
          groupedData = validProducts.reduce((acc, product) => {
            let category = 'Unknown';
            if (typeof product.SalesCategory === 'object') {
              category = product.SalesCategory?.Category_Desc || 'Unknown';
            } else if (typeof product.SalesCategory === 'string') {
              category = product.SalesCategory;
            }
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        } else if (!groupBySalesCategory && groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => {
            if (typeof p.PriceClass === 'object') {
              return p.PriceClass?.Class_Desc && p.PriceClass.Class_Desc.trim() !== '';
            }
            return p.PriceClass && String(p.PriceClass).trim() !== '';
          });
          
          groupedData = validProducts.reduce((acc, product) => {
            let priceClass = 'Unknown';
            if (typeof product.PriceClass === 'object') {
              priceClass = product.PriceClass?.Class_Desc || 'Unknown';
            } else if (typeof product.PriceClass === 'string') {
              priceClass = product.PriceClass;
            }
            if (!acc[priceClass]) {
              acc[priceClass] = [];
            }
            acc[priceClass].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        } else if (!groupBySalesCategory && !groupByPriceClass && groupByOTPNumber && !groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => p.OTP_Number != null);
          
          groupedData = validProducts.reduce((acc, product) => {
            const otpNumber = product.OTP_Number;
            if (!acc[otpNumber]) {
              acc[otpNumber] = [];
            }
            acc[otpNumber].push(product);
            return acc;
          }, {} as { [key: number]: Product[] });
          
          groupKeys = Object.keys(groupedData).map(Number).sort((a, b) => a - b);
        } else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && groupByPrimaryVendor && !groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => p.primaryVendor?.V_Description);
          
          groupedData = validProducts.reduce((acc, product) => {
            const vendorName = product.primaryVendor?.V_Description || 'Unknown';
            if (!acc[vendorName]) {
              acc[vendorName] = [];
            }
            acc[vendorName].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        } else if (!groupBySalesCategory && !groupByPriceClass && !groupByOTPNumber && !groupByPrimaryVendor && groupByManufacturerVendor) {
          const validProducts = finalData.filter(p => p.manufacturerVendor?.V_Description);
          
          groupedData = validProducts.reduce((acc, product) => {
            const vendorName = product.manufacturerVendor?.V_Description || 'Unknown';
            if (!acc[vendorName]) {
              acc[vendorName] = [];
            }
            acc[vendorName].push(product);
            return acc;
          }, {} as { [key: string]: Product[] });
          
          groupKeys = Object.keys(groupedData).sort();
        }
        
        // Render grouped or ungrouped products
        if (groupKeys.length > 0) {
          groupKeys.forEach((groupKey) => {
            const groupProducts = (groupedData as any)[groupKey];
            let headerText = '';
            
            if (groupBySalesCategory) {
              headerText = `=== ${groupKey} ===`;
            } else if (groupByPriceClass) {
              headerText = `=== ${groupKey} ===`;
            } else if (groupByOTPNumber) {
              headerText = `=== OTP Number: ${groupKey} ===`;
            } else if (groupByPrimaryVendor) {
              headerText = `=== ${groupKey} ===`;
            } else if (groupByManufacturerVendor) {
              headerText = `=== ${groupKey} ===`;
            }
            
            // Add group header
            rows.push(`"${headerText}"`);
            
            // Add products for this group
            groupProducts.forEach((product: Product) => {
              // Get UPC/Item Number based on selected type - take only the first one if multiple exist
              let upcValue = '';
              if (upcType8Week === 'retail') {
                // Get first Retail UPC (Status 1)
                if (product.UPCList && Array.isArray(product.UPCList)) {
                  const retailUPC = product.UPCList.find(upc => upc.Status === 1);
                  upcValue = retailUPC ? retailUPC.UPC_Number.trim() : '';
                }
              } else if (upcType8Week === 'primary') {
                // Get first Primary UPC (Status 0)
                if (product.UPCList && Array.isArray(product.UPCList)) {
                  const primaryUPC = product.UPCList.find(upc => upc.Status === 0);
                  upcValue = primaryUPC ? primaryUPC.UPC_Number.trim() : '';
                }
              } else if (upcType8Week === 'case') {
                // Get first Case UPC (Status 2)
                if (product.UPCList && Array.isArray(product.UPCList)) {
                  const caseUPC = product.UPCList.find(upc => upc.Status === 2);
                  upcValue = caseUPC ? caseUPC.UPC_Number.trim() : '';
                }
              } else if (upcType8Week === 'item') {
                upcValue = product.Item_Number?.toString() || '';
              }
              const description = product.Description || '';
              const row = [
                escapeCSVValue(upcValue ? `*${upcValue}*` : '*'),
                escapeCSVValue(description),
                '', // Week 1
                '', // Week 2
                '', // Week 3
                '', // Week 4
                '', // Week 5
                '', // Week 6
                '', // Week 7
                '', // Week 8
              ].join(',');
              rows.push(row);
            });
            
            // Add empty row between groups
            rows.push('');
          });
        } else {
          // No grouping - render all products
          finalData.forEach(product => {
            // Get UPC/Item Number based on selected type - take only the first one if multiple exist
            let upcValue = '';
            if (upcType8Week === 'retail') {
              // Get first Retail UPC (Status 1)
              if (product.UPCList && Array.isArray(product.UPCList)) {
                const retailUPC = product.UPCList.find(upc => upc.Status === 1);
                upcValue = retailUPC ? retailUPC.UPC_Number.trim() : '';
              }
            } else if (upcType8Week === 'primary') {
              // Get first Primary UPC (Status 0)
              if (product.UPCList && Array.isArray(product.UPCList)) {
                const primaryUPC = product.UPCList.find(upc => upc.Status === 0);
                upcValue = primaryUPC ? primaryUPC.UPC_Number.trim() : '';
              }
            } else if (upcType8Week === 'case') {
              // Get first Case UPC (Status 2)
              if (product.UPCList && Array.isArray(product.UPCList)) {
                const caseUPC = product.UPCList.find(upc => upc.Status === 2);
                upcValue = caseUPC ? caseUPC.UPC_Number.trim() : '';
              }
            } else if (upcType8Week === 'item') {
              upcValue = product.Item_Number?.toString() || '';
            }
            const description = product.Description || '';
            const row = [
              escapeCSVValue(upcValue ? `*${upcValue}*` : '*'),
              escapeCSVValue(description),
              '', // Week 1
              '', // Week 2
              '', // Week 3
              '', // Week 4
              '', // Week 5
              '', // Week 6
              '', // Week 7
              '', // Week 8
            ].join(',');
            rows.push(row);
          });
        }
        
        csvContent = rows.join('\n');
        filename = `order-form-8week-upc-${timestamp}.csv`;
      } else {
        // Standard CSV report
        const selectedFieldKeys = sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]));
        csvContent = generateCSV(finalData, selectedFieldKeys, groupBySalesCategory, groupByPriceClass, groupByOTPNumber, groupByPrimaryVendor, groupByManufacturerVendor);
        filename = `inventory-report-${timestamp}.csv`;
      }
      
      downloadCSV(csvContent, filename);
      
      toast.success(`CSV report generated successfully with ${finalData.length} products`);
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast.error('Failed to generate CSV report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGeneratePDF = async () => {
    // Set loading state immediately to show spinner
    setGeneratingPDF(true);
    
    // Small delay to ensure UI updates before heavy processing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      // Use full sorted data if available, otherwise sort the original filtered data
      const finalData = fullFilteredData.length > 0 ? fullFilteredData : applySorting(originalFilteredData);
      
      if (finalData.length === 0) {
        toast.error('No data to generate report');
        setGeneratingPDF(false);
        return;
      }

      let doc: jsPDF;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];

      if (reportType === '4week') {
        // Generate 4 Week Order Form
        doc = await generate4WeekOrderFormPDF(finalData, groupBySalesCategory, groupByPriceClass, groupByOTPNumber, groupByPrimaryVendor, groupByManufacturerVendor);
        filename = `order-form-4week-${timestamp}.pdf`;
      } else if (reportType === '8week') {
        // Generate 8 Week Order Form with UPC (async)
        doc = await generate8WeekOrderFormPDF(finalData, groupBySalesCategory, groupByPriceClass, groupByOTPNumber, groupByPrimaryVendor, groupByManufacturerVendor, upcType8Week);
        filename = `order-form-8week-upc-${timestamp}.pdf`;
      } else {
        // Standard inventory report
        const selectedFieldKeys = sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]));
        doc = await generatePDF(finalData, selectedFieldKeys, groupBySalesCategory, groupByPriceClass, groupByOTPNumber, groupByPrimaryVendor, groupByManufacturerVendor);
        filename = `inventory-report-${timestamp}.pdf`;
      }
      
      // Download PDF
      doc.save(filename);
      
      toast.success(`PDF report generated successfully with ${finalData.length} products`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Get all available fields from a sample product structure (in sequence order)
  const getAllFields = (): string[] => {
    return FIELD_SEQUENCE.filter(field => !EXCLUDED_FIELDS.includes(field));
  };

  const availableFields = getAllFields();

  // Memoize grouped data for preview to avoid recalculating on every render
  const groupedDataForPreview = useMemo(() => {
    if (previewData.length === 0) return [];
    return getGroupedDataForDisplay(previewData);
  }, [previewData, groupBySalesCategory, groupByPriceClass, groupByOTPNumber, groupByPrimaryVendor, groupByManufacturerVendor]);

  // Component to display barcode in preview table
  const BarcodeCell: React.FC<{ product: Product }> = ({ product }) => {
    const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Get UPC/Item Number based on selected type - take only the first one if multiple exist
    let upcValue = '';
    if (upcType8Week === 'retail') {
      // Get first Retail UPC (Status 1)
      if (product.UPCList && Array.isArray(product.UPCList)) {
        const retailUPC = product.UPCList.find(upc => upc.Status === 1);
        upcValue = retailUPC ? retailUPC.UPC_Number.trim() : '';
      }
    } else if (upcType8Week === 'primary') {
      // Get first Primary UPC (Status 0)
      if (product.UPCList && Array.isArray(product.UPCList)) {
        const primaryUPC = product.UPCList.find(upc => upc.Status === 0);
        upcValue = primaryUPC ? primaryUPC.UPC_Number.trim() : '';
      }
    } else if (upcType8Week === 'case') {
      // Get first Case UPC (Status 2)
      if (product.UPCList && Array.isArray(product.UPCList)) {
        const caseUPC = product.UPCList.find(upc => upc.Status === 2);
        upcValue = caseUPC ? caseUPC.UPC_Number.trim() : '';
      }
    } else if (upcType8Week === 'item') {
      upcValue = product.Item_Number?.toString() || '';
    }
    
    useEffect(() => {
      if (upcValue) {
        setLoading(true);
        generateBarcodeImage(upcValue)
          .then((image) => {
            setBarcodeImage(image);
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error generating barcode for preview:', error);
            setBarcodeImage(null);
            setLoading(false);
          });
      } else {
        setBarcodeImage(null);
        setLoading(false);
      }
    }, [upcValue, upcType8Week]);
    
    if (!upcValue) {
      return <span>*</span>;
    }
    
    if (loading) {
      return <span>Loading...</span>;
    }
    
    if (barcodeImage) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40px' }}>
          <img 
            src={barcodeImage} 
            alt={`Barcode ${upcValue}`}
            onError={(e) => {
              console.error('Error loading barcode image:', e);
              e.currentTarget.style.display = 'none';
            }}
            style={{ 
              maxWidth: '120px', 
              maxHeight: '40px',
              height: 'auto',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    }
    
    return <span>{`*${upcValue}*`}</span>;
  };

  return (
    <Box sx={{ 
      height: { xs: "auto", md: '100%' }, 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Scrollable Content Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        minHeight: 0,
        p: 2,
        pb: 0.5,
      }}>
        {!showPreview && (
          <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
            Inventory Report Configuration
          </Typography>
        )}

        {!showPreview ? (
          <Paper sx={{ 
            p: 0.75, 
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}>
            <Grid container spacing={3}>
              {/* Left Side - Status, Grouping, Sort By (Stacked Vertically) */}
              <Grid size={{ xs: 12, md: 3 }}>
                {/* Report Type */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Report Type
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as 'standard' | '4week' | '8week')}
                      disabled={previewLoading}
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
                      <MenuItem value="standard" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Standard Report</MenuItem>
                      <MenuItem value="4week" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>4 Week Order Form</MenuItem>
                      <MenuItem value="8week" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>8 Week Order Form (W/UPC)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* 8 Week Report UPC Type Selection */}
                {reportType === '8week' && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Barcode Type
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={upcType8Week}
                        onChange={(e) => setUpcType8Week(e.target.value as 'retail' | 'primary' | 'case' | 'item')}
                        disabled={previewLoading}
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
                        <MenuItem value="retail" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Retail UPC</MenuItem>
                        <MenuItem value="primary" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Primary UPC</MenuItem>
                        <MenuItem value="case" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Case UPC</MenuItem>
                        <MenuItem value="item" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Item Number</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Status */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
                      disabled={previewLoading}
                      sx={{
                        fontSize: '0.75rem',  
                        // height: '24px',
                        '& .MuiSelect-select': {
                          // py: 0.25,
                          // px: 0.75,
                          minHeight: 'auto',
                          // lineHeight: 1.2,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                        '& .MuiSelect-icon': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <MenuItem value="all" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>All Items</MenuItem>
                      <MenuItem value="active" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Active Items</MenuItem>
                      <MenuItem value="inactive" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Inactive Items</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Sales Category Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sales Category
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedSalesCategories.map(String)}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedSalesCategories(values.map(Number));
                      }}
                      disabled={previewLoading || loadingSalesCategories}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Categories</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const category = salesCategoryOptions.find(cat => cat.Sales_Category === Number(value));
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {category?.Category_Desc || value}
                                  {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                </Typography>
                              );
                            })}
                          </Box>
                        );
                      }}
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
                      {salesCategoryOptions.map((category) => (
                        <MenuItem 
                          key={category.Sales_Category} 
                          value={String(category.Sales_Category)}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedSalesCategories.includes(category.Sales_Category)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {category.Category_Desc}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Price Class Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Price Class
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedPriceClasses.map(String)}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedPriceClasses(values.map(Number));
                      }}
                      disabled={previewLoading || loadingPriceClasses}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Price Classes</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const priceClass = priceClassOptions.find(pc => pc.Price_Class === Number(value));
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {priceClass?.Class_Desc || value}
                                  {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                </Typography>
                              );
                            })}
                          </Box>
                        );
                      }}
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
                      {priceClassOptions.map((priceClass) => (
                        <MenuItem 
                          key={priceClass.Price_Class} 
                          value={String(priceClass.Price_Class)}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedPriceClasses.includes(priceClass.Price_Class)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {priceClass.Class_Desc}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Grouping */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Grouping
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBySalesCategory}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Sales Category</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          if (groupBySalesCategory) {
                            setGroupBySalesCategory(false);
                          } else {
                            setGroupBySalesCategory(true);
                            setGroupByPriceClass(false);
                            setGroupByOTPNumber(false);
                            setGroupByPrimaryVendor(false);
                            setGroupByManufacturerVendor(false);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupByPriceClass}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Price Class</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          if (groupByPriceClass) {
                            setGroupByPriceClass(false);
                          } else {
                            setGroupByPriceClass(true);
                            setGroupBySalesCategory(false);
                            setGroupByOTPNumber(false);
                            setGroupByPrimaryVendor(false);
                            setGroupByManufacturerVendor(false);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupByOTPNumber}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>OTP Number</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          if (groupByOTPNumber) {
                            setGroupByOTPNumber(false);
                          } else {
                            setGroupByOTPNumber(true);
                            setGroupBySalesCategory(false);
                            setGroupByPriceClass(false);
                            setGroupByPrimaryVendor(false);
                            setGroupByManufacturerVendor(false);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupByPrimaryVendor}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Vendor</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          if (groupByPrimaryVendor) {
                            setGroupByPrimaryVendor(false);
                          } else {
                            setGroupByPrimaryVendor(true);
                            setGroupBySalesCategory(false);
                            setGroupByPriceClass(false);
                            setGroupByOTPNumber(false);
                            setGroupByManufacturerVendor(false);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupByManufacturerVendor}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Manufacturer</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          if (groupByManufacturerVendor) {
                            setGroupByManufacturerVendor(false);
                          } else {
                            setGroupByManufacturerVendor(true);
                            setGroupBySalesCategory(false);
                            setGroupByPriceClass(false);
                            setGroupByOTPNumber(false);
                            setGroupByPrimaryVendor(false);
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Sort By */}
                <Box>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sort By
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={sortOption === 'atoz'}
                          onChange={() => {
                            setSortOption('atoz');
                            if (showPreview && originalFilteredData.length > 0) {
                              const sorted = sortByAtoZ(originalFilteredData);
                              setPreviewData(sorted);
                            }
                          }}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>A to Z</Typography>
                        </Box>
                      }
                      sx={{ m: 0, alignItems: 'flex-start' }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={sortOption === 'itemNumber'}
                          onChange={() => {
                            setSortOption('itemNumber');
                            if (showPreview && originalFilteredData.length > 0) {
                              const sorted = sortByItemNumber(originalFilteredData);
                              setPreviewData(sorted);
                            }
                          }}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Item Number</Typography>
                        </Box>
                      }
                      sx={{ m: 0, alignItems: 'flex-start' }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={sortOption === 'sequence'}
                          onChange={() => {
                            setSortOption('sequence');
                            if (showPreview && originalFilteredData.length > 0) {
                              const sorted = sortBySequence(originalFilteredData);
                              setPreviewData(sorted);
                            }
                          }}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Sequence</Typography>
                        </Box>
                      }
                      sx={{ m: 0, alignItems: 'flex-start' }}
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Right Column - Field Selection */}
              <Grid size={{ xs: 12, md: 9 }}>
                {reportType === 'standard' && (
                  <>
                {/* Field Group Dropdown */}
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Field Group
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ pl: 0.5 }}>
                    <Select
                      value={selectedFieldGroup}
                      onChange={(e) => handleFieldGroupChange(e.target.value)}
                      disabled={previewLoading}
                      displayEmpty
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
                        <em>Select a field group (or select individual fields below)</em>
                      </MenuItem>
                      {Object.entries(FIELD_GROUPS).map(([key, group]) => (
                        <MenuItem 
                          key={key} 
                          value={key}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          {group.label} ({group.fields.length} fields)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ mt: 0.4, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                    Selecting a group will auto-select all fields in that group. Individual fields will be disabled.
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Fields
                </Typography>
                <Typography variant="caption" sx={{ mb: 0.6, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                  Item Number & Description always included
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
                    {availableFields.map((field) => (
                      <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3}} key={field}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 0.35,
                            px: 0.5,
                            borderRadius: 0.75,
                            transition: 'all 0.15s ease',
                            backgroundColor: selectedFields[field] 
                              ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.06)')
                              : 'transparent',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.03)' 
                                : 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          
                          <Switch
                            size="small"
                            checked={selectedFields[field] || false}
                            onChange={(e) => handleFieldToggle(field, e.target.checked)}
                            disabled={previewLoading || selectedFieldGroup !== ''}
                            sx={{
                              flexShrink: 0,
                              // '& .MuiSwitch-switchBase': {
                              //   padding: '3px',
                              // },
                              // '& .MuiSwitch-thumb': {
                              //   width: 16,
                              //   height: 16,
                              //   boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                              // },
                              // '& .MuiSwitch-track': {
                              //   borderRadius: 10,
                              //   height: 20,
                              //   opacity: 0.3,
                              // },
                              // '& .MuiSwitch-switchBase.Mui-checked': {
                              //   '& + .MuiSwitch-track': {
                              //     opacity: 1,
                              //   },
                              // },
                            }}
                          />
                          <Typography 
                            sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: selectedFields[field] ? 500 : 400,
                              color: selectedFields[field] ? 'primary.main' : 'text.secondary',
                              transition: 'all 0.15s ease',
                              flex: 1,
                            }}
                          >
                            {FIELD_LABELS[field] || field}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                </>
                )}
                {reportType !== 'standard' && (
                  <Box sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    fontSize: '0.875rem',
                  }}>
                    {reportType === '4week' 
                      ? '4 Week Order Form will include: Item, Size, Description, List Price, Retail, and Week 1-4 columns'
                      : '8 Week Order Form will include: UPC Number (with barcode), Description, and 8 Date columns'}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        ) : (
          /* Preview Table */
          <Paper sx={{ 
            p: 1.5, 
            mb: 1.5, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 1px 3px rgba(0,0,0,0.2)' 
              : '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
              Preview Data ({previewData.length} products)
            </Typography>
            {previewLoading && loadingProgress.stage && (
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {loadingProgress.stage}
                  </Typography>
                </Box>
                {loadingProgress.total > 0 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={(loadingProgress.loaded / loadingProgress.total) * 100} 
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                )}
              </Box>
            )}
            <TableContainer sx={{ 
              maxHeight: '60vh', 
              overflow: 'auto',
              overflowX: 'auto',
              overflowY: 'auto',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}>
              <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
                <TableHead>
                  <TableRow>
                    {reportType === '4week' ? (
                      // 4 Week Order Form columns
                      <>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Item
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Description
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Size
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Price
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Retail
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 1
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 2
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 3
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 4
                        </TableCell>
                      </>
                    ) : reportType === '8week' ? (
                      // 8 Week Order Form columns
                      <>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          UPC Number
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Description
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 1
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 2
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 3
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 4
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 5
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 6
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 7
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Week 8
                        </TableCell>
                      </>
                    ) : (
                      // Standard report columns
                      <>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Item Number
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          backgroundColor: theme.palette.primary.main,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          py: 0.75,
                          px: 1,
                        }}>
                          Description
                        </TableCell>
                        {sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]))
                          .map((field) => (
                            <TableCell 
                              key={field}
                              sx={{ 
                                fontWeight: 500,
                                backgroundColor: theme.palette.primary.main,
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                py: 0.75,
                                px: 1,
                              }}
                            >
                              {FIELD_LABELS[field] || field}
                            </TableCell>
                          ))}
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // For preview, limit the displayed rows to improve performance
                    const displayData = groupedDataForPreview.length > PREVIEW_PAGE_SIZE 
                      ? groupedDataForPreview.slice(previewPage * PREVIEW_PAGE_SIZE, (previewPage + 1) * PREVIEW_PAGE_SIZE)
                      : groupedDataForPreview;
                    
                    return displayData.map((row, idx) => {
                    if (row.type === 'header') {
                      let headerText = '';
                      if (row.category) {
                        headerText = `=== ${row.category} ===`;
                      } else if (row.priceClass) {
                        headerText = `=== ${row.priceClass} ===`;
                      } else if (row.otpNumber !== undefined) {
                        headerText = `=== OTP Number: ${row.otpNumber} ===`;
                      } else if (row.primaryVendor) {
                        headerText = `=== ${row.primaryVendor} ===`;
                      } else if (row.manufacturerVendor) {
                        headerText = `=== ${row.manufacturerVendor} ===`;
                      }
                      return (
                        <TableRow key={`header-${idx}`}>
                          <TableCell 
                            colSpan={
                              reportType === '4week' ? 9 : 
                              reportType === '8week' ? 10 : 
                              (Object.keys(selectedFields).filter(key => selectedFields[key]).length + 2)
                            }
                            sx={{ 
                              fontWeight: 500, 
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(25, 118, 210, 0.2)' 
                                : 'rgba(25, 118, 210, 0.12)',
                              color: theme.palette.primary.main,
                              fontSize: '0.75rem',
                              py: 0.75,
                              px: 1,
                              borderLeft: `3px solid ${theme.palette.primary.main}`,
                            }}
                          >
                            {headerText}
                          </TableCell>
                        </TableRow>
                      );
                    } else if (row.type === 'spacer') {
                      return (
                        <TableRow key={`spacer-${idx}`}>
                          <TableCell 
                            colSpan={
                              reportType === '4week' ? 9 : 
                              reportType === '8week' ? 10 : 
                              (Object.keys(selectedFields).filter(key => selectedFields[key]).length + 2)
                            }
                            sx={{ py: 0.25, border: 'none', backgroundColor: 'transparent' }}
                          />
                        </TableRow>
                      );
                    } else if (row.type === 'product' && row.product) {
                      const product = row.product;
                      return (
                        <TableRow 
                          key={`product-${idx}`} 
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          {reportType === '4week' ? (
                            // 4 Week Order Form columns
                            <>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Item_Number || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Description || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.UOM || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Price1?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Retail1?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 1 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 2 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 3 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 4 - empty for input */}
                              </TableCell>
                            </>
                          ) : reportType === '8week' ? (
                            // 8 Week Order Form columns
                            <>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                <BarcodeCell product={product} />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Description || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 1 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 2 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 3 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 4 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 5 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 6 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 7 - empty for input */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {/* Week 8 - empty for input */}
                              </TableCell>
                            </>
                          ) : (
                            // Standard report columns
                            <>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Item_Number || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                {product.Description || '-'}
                              </TableCell>
                              {sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]))
                                .map((field) => {
                                  const value = getNestedValue(product, field);
                                  return (
                                    <TableCell key={field} sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                      {value || '-'}
                                    </TableCell>
                                  );
                                })}
                            </>
                          )}
                        </TableRow>
                      );
                    }
                    return null;
                  });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
            {(() => {
              // Count only actual products (not headers/spacers) for pagination
              const actualProductCount = previewData.length;
              const totalPages = Math.ceil(groupedDataForPreview.length / PREVIEW_PAGE_SIZE);
              const totalRows = groupedDataForPreview.length;
              const start = previewPage * PREVIEW_PAGE_SIZE + 1;
              const end = Math.min((previewPage + 1) * PREVIEW_PAGE_SIZE, totalRows);
              
              return (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mt: 1,
                  flexWrap: 'wrap',
                  gap: 2,
                }}>
                  <Box>
                    {totalRows > PREVIEW_PAGE_SIZE && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block' }}>
                        Showing {start}-{end} of {actualProductCount} products
                      </Typography>
                    )}
                  </Box>
                  {totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={previewPage + 1}
                      onChange={(_, page) => {
                        setPreviewPage(page - 1);
                        // Scroll to top of table when page changes
                        const tableContainer = document.querySelector('[class*="MuiTableContainer-root"]');
                        if (tableContainer) {
                          tableContainer.scrollTop = 0;
                        }
                      }}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .Mui-selected': {
                          color: '#ffffff',
                          
                        },
                        // '& .MuiPaginationItem-text': {
                        //     color: '#ffffff !important',
                        //   },
                        // Covers other situations (icon buttons) as fallback
                        '& .MuiPaginationItem-root.Mui-selected': {
                          color: '#ffffff !important',
                        },
                      }}
                    />
                  )}
                </Box>
              );
            })()}
          </Paper>
        )}
      </Box>

      {/* Sticky Action Buttons at Bottom */}
      <Box sx={{ 
        p: 1.5,
        pt: 1,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0,
      }}>
        {!showPreview ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <CustomButton
              type="button"
              buttonType="primary"
              appearance="filled"
              onClick={handlePreview}
              disabled={previewLoading}
              loading={previewLoading}
              icon={<PreviewIcon />}
              iconPosition="left"
              fullWidth={false}
              sx={{ minWidth: 180, mt:0 }}
            >
              Preview
            </CustomButton>
          </Box>
        ) : (
          <>
            <CustomButton
              type="button"
              buttonType="cancel"
              appearance="outlined"
              onClick={() => {
                setShowPreview(false);
                setPreviewPage(0);
                setFullFilteredData([]); // Clear full data to free memory
                setSelectedFieldGroup(''); // Reset field group selection
              }}
              fullWidth={false}
              sx={{ minWidth: 180, mt:0 }}
            >
              Back to Configuration
            </CustomButton>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <CustomButton
                type="button"
                buttonType="primary"
                appearance="filled"
                onClick={handleGenerateCSV}
                disabled={generatingReport || generatingPDF}
                loading={generatingReport}
                icon={<FileDownloadIcon />}
                iconPosition="left"
                fullWidth={false}
                sx={{ minWidth: 180, mt:0 }}
              >
                Generate CSV
              </CustomButton>
              {(() => {
                // For order forms, always show PDF button. For standard report, only show if <= 6 fields
                if (reportType === '4week' || reportType === '8week') {
                  return (
                    <CustomButton
                      type="button"
                      buttonType="primary"
                      appearance="filled"
                      onClick={handleGeneratePDF}
                      disabled={generatingReport || generatingPDF}
                      loading={generatingPDF}
                      icon={!generatingPDF ? <PdfIcon /> : undefined}
                      iconPosition="left"
                      fullWidth={false}
                      sx={{ minWidth: 180, mt:0 }}
                    >
                      {generatingPDF ? 'Generating PDF...' : `Generate ${reportType === '4week' ? '4 Week' : '8 Week'} PDF`}
                    </CustomButton>
                  );
                } else {
                  const selectedCount = Object.keys(selectedFields).filter(key => selectedFields[key]).length;
                  const totalFields = selectedCount + 2; // Item_Number + Description are always included
                  return totalFields <= 6 && (
                    <CustomButton
                      type="button"
                      buttonType="primary"
                      appearance="filled"
                      onClick={handleGeneratePDF}
                      disabled={generatingReport || generatingPDF}
                      loading={generatingPDF}
                      icon={!generatingPDF ? <PdfIcon /> : undefined}
                      iconPosition="left"
                      fullWidth={false}
                      sx={{ minWidth: 180, mt:0 }}
                    >
                      {generatingPDF ? 'Generating PDF...' : 'Generate PDF'}
                    </CustomButton>
                  );
                }
              })()}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default InventoryReportTab;

