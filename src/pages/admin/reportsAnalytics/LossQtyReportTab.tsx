import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Radio,
  FormControlLabel,
  FormControl,
  Checkbox,
  Select,
  MenuItem,
  Pagination,
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
import { getShortShipmentReport, getListOfLossQuantityReport } from '../../../redux/apis/distrubutor/listApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

interface LossQtyReportRow {
  Document_Number: string;
  Invoice_Date: string;
  Invoice_Number: number;
  C_Number: number;
  S_Number: number;
  Route_Number: number;
  Jurisdiction_County: number;
  Order_Number: number;
  Promo_Number: number;
  Item_Number: number;
  Quantity_Ordered: number;
  Quantity_Shipped: number;
  Loss_Qty: number;
  Unit_Code: boolean;
  OrderDetail_Code: string;
  Delivered: boolean;
  Credit_ReturnToStock: boolean;
  Price: number;
  NetCost: number;
  BaseCost: number;
  AvgCost: number;
  Invoice_Cost: number;
  OTP_Amount_State: number;
  OTP_Amount_County: number;
  OTP_Amount_City: number;
  Sales_Category: number;
  Price_Class: number;
  OTP_Number?: number;
  Ext_Price: number;
  Ext_Loss: number;
  Description: string;
  UOM: string;
  Pack: number;
  UnitOunces: number;
  Cig_Sticks: number;
  Cig_Pack: number;
  OnHand: number;
  C_Name: string;
  c_address: string;
  c_city: string;
  c_state: string;
  C_Country: string;
  c_zip: string;
  c_phone: string;
  c_Salesman: number;
  C_ClassOfTrade: string;
}

interface FilterOptions {
  salesCategories?: Array<{ value: number; label: string }>;
  priceClasses?: Array<{ value: number; label: string }>;
  otpTypes?: Array<{ value: number; label: string }>;
  manufacturers?: Array<{ value: number; label: string }>;
  locations?: Array<{ value: number; label: string }>;
  sections?: Array<{ value: string; label: string }>;
  priceSubclasses?: Array<{ value: number; label: string }>;
  pickAreas?: Array<{ value: string; label: string }>;
  itemPromotions?: Array<{ value: string; label: string }>;
  cigOtpPpdTax?: Array<{ value: string; label: string }>;
  customers?: Array<{ value: number; label: string }>;
  salesReps?: Array<{ value: number; label: string }>;
  routes?: Array<{ value: number; label: string }>;
  states?: Array<{ value: number; label: string }>;
  counties?: Array<{ value: number; label: string }>;
  cities?: Array<{ value: number; label: string }>;
  classesOfTrade?: Array<{ value: string; label: string }>;
}

const FIELD_LABELS: { [key: string]: string } = {
  Document_Number: 'Invoice #',
  Invoice_Date: 'Invoice Date',
  Invoice_Number: 'Invoice Number',
  C_Number: 'Customer #',
  S_Number: 'Sales Rep Number',
  Route_Number: 'Route Number',
  Order_Number: 'Order Number',
  Promo_Number: 'Promo Number',
  Item_Number: 'Item #',
  Quantity_Ordered: 'Quantity Ordered',
  Quantity_Shipped: 'Quantity Shipped',
  Loss_Qty: 'Loss Qty',
  Price: 'Price',
  NetCost: 'Net Cost',
  BaseCost: 'Base Cost',
  AvgCost: 'Average Cost',
  Invoice_Cost: 'Invoice Cost',
  OTP_Amount_State: 'OTP Amount State',
  OTP_Amount_County: 'OTP Amount County',
  OTP_Amount_City: 'OTP Amount City',
  Ext_Price: 'Ext Price',
  Ext_Loss: 'Ext Loss',
  Description: 'Description',
  UOM: 'UOM',
  Pack: 'Pack',
  UnitOunces: 'Unit Ounces',
  Cig_Sticks: 'Cig Sticks',
  Cig_Pack: 'Cig Pack',
  OnHand: 'On Hand',
  C_Name: 'Customer Name',
  c_address: 'Address',
  c_city: 'City',
  c_state: 'State',
  c_zip: 'Zip',
  c_phone: 'Phone',
  c_Salesman: 'Salesman',
  OTP_Number: 'OTP Number',
  Jurisdiction_County: 'Jurisdiction County',
  Sales_Category: 'Sales Category',
  Price_Class: 'Price Class',
  C_Country: 'Country',
  C_ClassOfTrade: 'Class of Trade',
};

// PDF-specific field labels (shorter names for PDF)
const PDF_FIELD_LABELS: { [key: string]: string } = {
  ...FIELD_LABELS,
  Order_Number: 'Order #',
  Quantity_Ordered: 'Ordered',
  Quantity_Shipped: 'Qty shipped',
};


// Custom alphabetical sort function: spaces -> symbols -> numbers -> letters (A-Z)
const customAlphabeticalSort = (a: string, b: string): number => {
    const aStr = (a || '').toString().trim();
    const bStr = (b || '').toString().trim();
    
    // Get first character of each string
    const aFirst = aStr.charAt(0);
    const bFirst = bStr.charAt(0);
    
    // Define character type priorities: space=0, symbol=1, number=2, letter=3
    const getCharType = (char: string): number => {
      if (!char) return 3;
      if (char === ' ') return 0;
      if (/[0-9]/.test(char)) return 2;
      if (/[a-zA-Z]/.test(char)) return 3;
      return 1; // symbol
    };
    
    const aType = getCharType(aFirst);
    const bType = getCharType(bFirst);
    
    // If different types, sort by type priority
    if (aType !== bType) {
      return aType - bType;
    }
    
    // Same type, use localeCompare for natural sorting
    return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
};

const LossQtyReportTab: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<LossQtyReportRow[]>([]);
  const [filteredData, setFilteredData] = useState<LossQtyReportRow[]>([]);

  // Fixed fields based on groupBy - no field selection needed
  const getFixedFields = (groupByValue: 'item' | 'customer' | 'date'): string[] => {
    if (groupByValue === 'customer') {
      // Customer grouping: Item Number/Description, Document Date/Number, Order, Ship, On Hand, Lost, Ext $$$ Lost
      return ['Item_Number', 'Description', 'Document_Number', 'Invoice_Date', 'Quantity_Ordered', 'Quantity_Shipped', 'OnHand', 'Loss_Qty', 'Ext_Loss'];
    } else if (groupByValue === 'item') {
      // Item grouping: Customer Number/Name, Document Date/Number, Order, Ship, Lost, Ext $$$ Lost
      return ['C_Number', 'C_Name', 'Document_Number', 'Invoice_Date', 'Quantity_Ordered', 'Quantity_Shipped', 'Loss_Qty', 'Ext_Loss'];
    } else {
      // Date grouping: Item #, Description, Customer #, Customer Name, Invoice #, Invoice Date, Quantity Ordered, Quantity Shipped, On Hand, Loss Qty, Ext Loss
      return ['Item_Number', 'Description', 'C_Number', 'C_Name', 'Document_Number', 'Invoice_Date', 'Quantity_Ordered', 'Quantity_Shipped', 'OnHand', 'Loss_Qty', 'Ext_Loss'];
    }
  };

  const [groupBy, setGroupBy] = useState<'item' | 'customer' | 'date'>('item');
  // Initialize dates from location.state if available (when coming from dashboard), otherwise default to today for both
  const [fromDate, setFromDate] = useState<Dayjs | null>(() => {
    const stateFrom = location.state?.fromDate;
    return stateFrom ? dayjs(stateFrom) : dayjs();
  });
  const [toDate, setToDate] = useState<Dayjs | null>(() => {
    const stateTo = location.state?.toDate;
    return stateTo ? dayjs(stateTo) : dayjs();
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Pagination state for chunked data
  const [currentChunk, setCurrentChunk] = useState(0);
  const [allChunks, setAllChunks] = useState<LossQtyReportRow[][]>([]);
  const CHUNK_SIZE = 1000; // Display 1000 rows at a time

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  // Filter states
  const [selectedSalesCategories, setSelectedSalesCategories] = useState<number[]>([]);
  const [selectedPriceClasses, setSelectedPriceClasses] = useState<number[]>([]);
  const [selectedOTPTypes, setSelectedOTPTypes] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedManufacturers, _setSelectedManufacturers] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedLocations, _setSelectedLocations] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedSections, _setSelectedSections] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPriceSubclasses, _setSelectedPriceSubclasses] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPickAreas, _setSelectedPickAreas] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedItemPromotions, _setSelectedItemPromotions] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCigOtpPpdTax, _setSelectedCigOtpPpdTax] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [selectedStates, setSelectedStates] = useState<number[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<number[]>([]);
  const [selectedCities, setSelectedCities] = useState<number[]>([]);
  const [selectedClassesOfTrade, setSelectedClassesOfTrade] = useState<string[]>([]);

  // Ref to track if we've done the initial load
  const hasInitialized = useRef(false);

  // Fetch filter options and call API once on mount
  useEffect(() => {
    fetchFilterOptions();
    // Call API once on mount (with dates if they were initialized from location.state, or without dates)
    fetchReportData();
    hasInitialized.current = true;
  }, []);

  // Call API when dates change (only after initial load)
  useEffect(() => {
    if (hasInitialized.current) {
      fetchReportData();
    }
  }, [fromDate, toDate]);


  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const response = await getListOfLossQuantityReport() as any;
      const data = response?.data?.data || response?.data || response || {};
      
      // Map the API response to our filter options structure based on actual API response
      const options: FilterOptions = {};
      
      // Helper function to map array items
      const mapArrayItems = (arr: any[], valueKey: string, labelKey: string) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((item: any) => ({
          value: item[valueKey] ?? item.value ?? item.id ?? item,
          label: item[labelKey] ?? item.label ?? item.name ?? String(item[valueKey] ?? item.value ?? item.id ?? item),
        }));
      };

      // Map based on actual API response structure
      if (data.salesCategory && Array.isArray(data.salesCategory)) {
        options.salesCategories = mapArrayItems(data.salesCategory, 'Sales_Category', 'Category_Desc');
      }
      
      if (data.priceClass && Array.isArray(data.priceClass)) {
        options.priceClasses = mapArrayItems(data.priceClass, 'Price_Class', 'Class_Desc');
      }
      
      if (data.customers && Array.isArray(data.customers)) {
        options.customers = mapArrayItems(data.customers, 'C_Number', 'C_Name');
      }
      
      if (data.salesRep && Array.isArray(data.salesRep)) {
        options.salesReps = mapArrayItems(data.salesRep, 'S_Number', 'S_Desc');
      }
      
      if (data.routes && Array.isArray(data.routes)) {
        options.routes = mapArrayItems(data.routes, 'Route_Number', 'Route_Number');
      }
      
      if (data.taxRates && Array.isArray(data.taxRates)) {
        options.states = mapArrayItems(data.taxRates, 'Jurisdiction_State', 'TaxDescription');
      }
      
      if (data.taxRateCounty && Array.isArray(data.taxRateCounty)) {
        options.counties = mapArrayItems(data.taxRateCounty, 'Jurisdiction_County', 'TaxDescription');
      }
      
      if (data.taxRateCity && Array.isArray(data.taxRateCity)) {
        options.cities = mapArrayItems(data.taxRateCity, 'Jurisdiction_City', 'TaxDescription');
      }
      
      if (data.OTP_Type && Array.isArray(data.OTP_Type)) {
        options.otpTypes = mapArrayItems(data.OTP_Type, 'OTP_Number', 'OTP_Description');
      }
      
      if (data.classOfTrade && Array.isArray(data.classOfTrade)) {
        options.classesOfTrade = mapArrayItems(data.classOfTrade, 'Trade_Code', 'Trade_Desc');
      }
      
      if (data.location && Array.isArray(data.location)) {
        options.locations = mapArrayItems(data.location, 'location', 'location');
      }
      
      if (data.manufacturerVendor && Array.isArray(data.manufacturerVendor)) {
        options.manufacturers = mapArrayItems(data.manufacturerVendor, 'Primary_Vendor', 'V_Description');
      }
      
      if (data.section && Array.isArray(data.section)) {
        options.sections = mapArrayItems(data.section, 'section', 'section');
      }
      
      if (data.pickRightAreas && Array.isArray(data.pickRightAreas)) {
        options.pickAreas = mapArrayItems(data.pickRightAreas, 'PickArea', 'PickArea_Description');
      }
      
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  };

  // Fetch report data - only use dates, no filters (filters applied on frontend)
  const fetchReportData = async () => {
    setLoading(true);
    setCurrentChunk(0);
    setAllChunks([]);
    setReportData([]);
    
    try {
      const params: any = {};
      
      // Only add dates if both are selected (optional - can call without dates)
      if (fromDate && toDate) {
        params.fromDate = fromDate.format('MM-DD-YYYY');
        params.toDate = toDate.format('MM-DD-YYYY');
      }

      const response = await getShortShipmentReport(params) as any;
      // Handle API response structure: { success: true, message: "...", data: { rows: [...] } }
      const rows = response?.data?.data?.rows || response?.data?.rows || response?.rows || [];
      
      if (rows.length === 0) {
        setReportData([]);
        setFilteredData([]);
        setAllChunks([]);
        setLoading(false);
        return;
      }

      // If data is small, use it directly
      if (rows.length < CHUNK_SIZE) {
        setReportData(rows);
        setAllChunks([rows]);
        setCurrentChunk(0);
        setLoading(false);
        return;
      }

      // For large datasets, chunk the data
      const chunks: LossQtyReportRow[][] = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        chunks.push(rows.slice(i, i + CHUNK_SIZE));
      }

      setAllChunks(chunks);
      setCurrentChunk(0);
      setReportData(chunks[0] || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Handle chunk navigation - chunk the filtered data
  const handleChunkChange = (chunkIndex: number) => {
    if (chunkIndex >= 0) {
      // Get all filtered data
      const allFiltered = filteredData.length > 0 ? filteredData : (allChunks.length > 0 ? allChunks.flat() : []);
      
      if (allFiltered.length === 0) return;
      
      // Chunk the filtered data
      const filteredChunks: LossQtyReportRow[][] = [];
      for (let i = 0; i < allFiltered.length; i += CHUNK_SIZE) {
        filteredChunks.push(allFiltered.slice(i, i + CHUNK_SIZE));
      }
      
      if (chunkIndex < filteredChunks.length) {
        setCurrentChunk(chunkIndex);
        setReportData(filteredChunks[chunkIndex]);
      }
    }
  };

  // Get current chunk of filtered data for display
  const getCurrentChunkData = useMemo(() => {
    if (filteredData.length === 0) return [];
    if (filteredData.length <= CHUNK_SIZE) return filteredData;
    
    const start = currentChunk * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    return filteredData.slice(start, end);
  }, [filteredData, currentChunk]);

  // Calculate total chunks for filtered data
  const totalChunks = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return Math.ceil(filteredData.length / CHUNK_SIZE);
  }, [filteredData]);

  // Apply frontend filters to all chunks, then re-chunk the filtered data
  useEffect(() => {
    // Get all data from all chunks
    const allData = allChunks.length > 0 ? allChunks.flat() : (reportData.length > 0 ? [...reportData] : []);
    if (allData.length === 0) {
      setFilteredData([]);
      return;
    }
    let filtered = [...allData];

    // Filter by sales categories
    if (selectedSalesCategories.length > 0) {
      filtered = filtered.filter(row => 
        row.Sales_Category !== undefined && selectedSalesCategories.includes(row.Sales_Category)
      );
    }

    // Filter by price classes
    if (selectedPriceClasses.length > 0) {
      filtered = filtered.filter(row => 
        row.Price_Class !== undefined && selectedPriceClasses.includes(row.Price_Class)
      );
    }

    // Filter by customers
    if (selectedCustomers.length > 0) {
      filtered = filtered.filter(row => 
        selectedCustomers.includes(row.C_Number)
      );
    }

    // Filter by sales reps
    if (selectedSalesReps.length > 0) {
      filtered = filtered.filter(row => 
        selectedSalesReps.includes(row.S_Number)
      );
    }

    // Filter by routes
    if (selectedRoutes.length > 0) {
      filtered = filtered.filter(row => 
        selectedRoutes.includes(row.Route_Number)
      );
    }

    // Filter by states - Note: states filter uses Jurisdiction_State (number) from taxRates
    // but data has c_state (string). We'll keep this as-is for now since c_state is the actual state code
    // If you need to filter by Jurisdiction_State, you'll need to add that field to the data
    if (selectedStates.length > 0) {
      // For now, we'll skip state filtering by jurisdiction number since c_state is a string
      // If you have a Jurisdiction_State field in the data, use that instead
      // filtered = filtered.filter(row => 
      //   row.Jurisdiction_State !== undefined && selectedStates.includes(row.Jurisdiction_State)
      // );
    }

    // Filter by cities - Note: cities filter uses Jurisdiction_City (number) from taxRateCity
    // but data has c_city (string). We'll keep this as-is for now
    if (selectedCities.length > 0) {
      // For now, we'll skip city filtering by jurisdiction number since c_city is a string
      // If you have a Jurisdiction_City field in the data, use that instead
      // filtered = filtered.filter(row => 
      //   row.Jurisdiction_City !== undefined && selectedCities.includes(row.Jurisdiction_City)
      // );
    }

    // Filter by OTP types (if OTP_Number exists)
    if (selectedOTPTypes.length > 0 && reportData.length > 0 && 'OTP_Number' in reportData[0]) {
      filtered = filtered.filter(row => 
        row.OTP_Number && selectedOTPTypes.includes(row.OTP_Number)
      );
    }

    // Filter by counties
    if (selectedCounties.length > 0) {
      filtered = filtered.filter(row => 
        row.Jurisdiction_County !== undefined && selectedCounties.includes(row.Jurisdiction_County)
      );
    }

    // Filter by classes of trade
    if (selectedClassesOfTrade.length > 0) {
      filtered = filtered.filter(row => 
        row.C_ClassOfTrade !== undefined && selectedClassesOfTrade.includes(row.C_ClassOfTrade)
      );
    }

    // Note: Additional filters (manufacturers, locations, sections, priceSubclasses, pickAreas, itemPromotions, cigOtpPpdTax)
    // would need corresponding fields in the data structure to filter properly
    // These are placeholders - adjust based on actual API response structure

    // Set filtered data (will be chunked in getGroupedData if needed)
    setFilteredData(filtered);
  }, [
    allChunks,
    reportData,
    selectedSalesCategories,
    selectedPriceClasses,
    selectedCustomers,
    selectedSalesReps,
    selectedRoutes,
    selectedStates,
    selectedCities,
    selectedOTPTypes,
    selectedManufacturers,
    selectedLocations,
    selectedSections,
    selectedPriceSubclasses,
    selectedPickAreas,
    selectedItemPromotions,
    selectedCigOtpPpdTax,
    selectedCounties,
    selectedClassesOfTrade,
  ]);


  type GroupedDataItem = 
    | { type: 'header'; key: string; level?: number; customerData?: LossQtyReportRow; itemData?: LossQtyReportRow; onHand?: number }
    | { type: 'row'; data: LossQtyReportRow }
    | { type: 'row'; subtotal: { lossQty: number; extLoss: number } }
    | { type: 'row'; grandTotal: { lossQty: number; extLoss: number } };

  const getGroupedData = useMemo((): GroupedDataItem[] => {
    // Use current chunk data for display
    const dataToGroup = getCurrentChunkData.length > 0 ? getCurrentChunkData : filteredData;
    
    const result: GroupedDataItem[] = [];

    if (groupBy === 'date') {
      // Group by Invoice_Date
      const grouped: { [key: string]: LossQtyReportRow[] } = {};

      dataToGroup.forEach(row => {
        const key = row.Invoice_Date || '';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(row);
      });

      Object.keys(grouped).sort().forEach(key => {
        // Format date for display
        const formattedDate = key ? (dayjs(key).isValid() ? dayjs(key).format('MM/DD/YYYY') : key) : key;
        result.push({ type: 'header', key: formattedDate, level: 1 });
        // Sort rows by item description first (alphabetically), then by customer name
        const rows = grouped[key].sort((a, b) => {
          const descCompare = customAlphabeticalSort(a.Description || '', b.Description || '');
          if (descCompare !== 0) return descCompare;
          return customAlphabeticalSort(a.C_Name || '', b.C_Name || '');
        });
        rows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        // Add subtotal
        const subtotal = rows.reduce((acc, row) => ({
          lossQty: acc.lossQty + (row.Loss_Qty || 0),
          extLoss: acc.extLoss + (row.Ext_Loss || 0),
        }), { lossQty: 0, extLoss: 0 });
        result.push({ type: 'row', subtotal });
      });
    } else if (groupBy === 'customer') {
      // Group by customer - include customer details in header
      const customerGrouped: { [customerKey: string]: { rows: LossQtyReportRow[]; firstRow: LossQtyReportRow } } = {};

      dataToGroup.forEach(row => {
        const customerKey = `${row.C_Number} ${row.C_Name || ''}`.trim();
        if (!customerGrouped[customerKey]) {
          customerGrouped[customerKey] = { rows: [], firstRow: row };
        }
        customerGrouped[customerKey].rows.push(row);
      });

      // Sort customers alphabetically by name first, then by number
      Object.keys(customerGrouped).sort((keyA, keyB) => {
        const customerA = customerGrouped[keyA].firstRow;
        const customerB = customerGrouped[keyB].firstRow;
        // Sort by customer name first (alphabetically)
        const nameCompare = customAlphabeticalSort(customerA.C_Name || '', customerB.C_Name || '');
        if (nameCompare !== 0) return nameCompare;
        // If names are the same, sort by customer number
        return (customerA.C_Number || 0) - (customerB.C_Number || 0);
      }).forEach(customerKey => {
        const { rows, firstRow } = customerGrouped[customerKey];
        // Customer header with details
        result.push({ 
          type: 'header', 
          key: customerKey, 
          level: 1,
          customerData: firstRow
        });
        // Sort rows by product description (alphabetically), then by invoice date
        const sortedRows = rows.sort((a, b) => {
          const productCompare = customAlphabeticalSort(a.Description || '', b.Description || '');
          if (productCompare !== 0) return productCompare;
          return (a.Invoice_Date || '').localeCompare(b.Invoice_Date || '');
        });
        sortedRows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        // Customer subtotal
        const customerSubtotal = sortedRows.reduce((acc, row) => ({
          lossQty: acc.lossQty + (row.Loss_Qty || 0),
          extLoss: acc.extLoss + (row.Ext_Loss || 0),
        }), { lossQty: 0, extLoss: 0 });
        result.push({ type: 'row', subtotal: customerSubtotal });
      });
    } else if (groupBy === 'item') {
      // Group by item/product - include On Hand in header
      const itemGrouped: { [itemKey: string]: { rows: LossQtyReportRow[]; firstRow: LossQtyReportRow; onHand: number } } = {};

      dataToGroup.forEach(row => {
        const itemKey = `${row.Item_Number} ${row.Description || ''}`.trim();
        if (!itemGrouped[itemKey]) {
          itemGrouped[itemKey] = { rows: [], firstRow: row, onHand: row.OnHand || 0 };
        }
        itemGrouped[itemKey].rows.push(row);
      });

      // Sort items alphabetically by description first, then by item number
      Object.keys(itemGrouped).sort((keyA, keyB) => {
        const itemA = itemGrouped[keyA].firstRow;
        const itemB = itemGrouped[keyB].firstRow;
        // Sort by description first (alphabetically)
        const descCompare = customAlphabeticalSort(itemA.Description || '', itemB.Description || '');
        if (descCompare !== 0) return descCompare;
        // If descriptions are the same, sort by item number
        return (itemA.Item_Number || 0) - (itemB.Item_Number || 0);
      }).forEach(itemKey => {
        const { rows, firstRow, onHand } = itemGrouped[itemKey];
        // Item header with On Hand
        result.push({ 
          type: 'header', 
          key: itemKey, 
          level: 1,
          itemData: firstRow,
          onHand: onHand
        });
        // Sort rows by customer name (alphabetically), then by invoice date
        const sortedRows = rows.sort((a, b) => {
          const customerCompare = customAlphabeticalSort(a.C_Name || '', b.C_Name || '');
          if (customerCompare !== 0) return customerCompare;
          return (a.Invoice_Date || '').localeCompare(b.Invoice_Date || '');
        });
        sortedRows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        // Item subtotal
        const itemSubtotal = sortedRows.reduce((acc, row) => ({
          lossQty: acc.lossQty + (row.Loss_Qty || 0),
          extLoss: acc.extLoss + (row.Ext_Loss || 0),
        }), { lossQty: 0, extLoss: 0 });
        result.push({ type: 'row', subtotal: itemSubtotal });
      });
    }

    // Add grand total at the end only on the last chunk (calculate from all filtered data)
    const isLastChunk = filteredData.length <= CHUNK_SIZE || currentChunk === Math.ceil(filteredData.length / CHUNK_SIZE) - 1;
    
    if (isLastChunk && filteredData.length > 0) {
      const grandTotal = filteredData.reduce((acc, row) => ({
        lossQty: acc.lossQty + (row.Loss_Qty || 0),
        extLoss: acc.extLoss + (row.Ext_Loss || 0),
      }), { lossQty: 0, extLoss: 0 });
      result.push({ type: 'row', grandTotal });
    }

    return result;
  }, [getCurrentChunkData, filteredData, groupBy, currentChunk]);

  // Get all grouped data (for CSV/PDF export - includes all filtered data, not just current chunk)
  const getAllGroupedData = useMemo((): GroupedDataItem[] => {
    const result: GroupedDataItem[] = [];

    if (groupBy === 'date') {
      const grouped: { [key: string]: LossQtyReportRow[] } = {};
      filteredData.forEach(row => {
        const key = row.Invoice_Date || '';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(row);
      });
      Object.keys(grouped).sort().forEach(key => {
        const formattedDate = key ? (dayjs(key).isValid() ? dayjs(key).format('MM/DD/YYYY') : key) : key;
        result.push({ type: 'header', key: formattedDate, level: 1 });
        // Sort rows by item description first (alphabetically), then by customer name
        const rows = grouped[key].sort((a, b) => {
          const descCompare = customAlphabeticalSort(a.Description || '', b.Description || '');
          if (descCompare !== 0) return descCompare;
          return customAlphabeticalSort(a.C_Name || '', b.C_Name || '');
        });
        rows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        const subtotal = rows.reduce((acc, row) => ({
          lossQty: acc.lossQty + (row.Loss_Qty || 0),
          extLoss: acc.extLoss + (row.Ext_Loss || 0),
        }), { lossQty: 0, extLoss: 0 });
        result.push({ type: 'row', subtotal });
      });
    } else if (groupBy === 'customer') {
      const customerGrouped: { [customerKey: string]: { rows: LossQtyReportRow[]; firstRow: LossQtyReportRow } } = {};
      filteredData.forEach(row => {
        const customerKey = `${row.C_Number} ${row.C_Name || ''}`.trim();
        if (!customerGrouped[customerKey]) {
          customerGrouped[customerKey] = { rows: [], firstRow: row };
        }
        customerGrouped[customerKey].rows.push(row);
      });
      // Sort customers alphabetically by name first, then by number
      Object.keys(customerGrouped).sort((keyA, keyB) => {
        const customerA = customerGrouped[keyA].firstRow;
        const customerB = customerGrouped[keyB].firstRow;
        // Sort by customer name first (alphabetically)
        const nameCompare = customAlphabeticalSort(customerA.C_Name || '', customerB.C_Name || '');
        if (nameCompare !== 0) return nameCompare;
        // If names are the same, sort by customer number
        return (customerA.C_Number || 0) - (customerB.C_Number || 0);
      }).forEach(customerKey => {
        const { rows, firstRow } = customerGrouped[customerKey];
        result.push({ 
          type: 'header', 
          key: customerKey, 
          level: 1,
          customerData: firstRow
        });
        const sortedRows = rows.sort((a, b) => {
          const productCompare = customAlphabeticalSort(a.Description || '', b.Description || '');
          if (productCompare !== 0) return productCompare;
          return (a.Invoice_Date || '').localeCompare(b.Invoice_Date || '');
        });
        sortedRows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        const customerSubtotal = sortedRows.reduce((acc, row) => ({
          lossQty: acc.lossQty + (row.Loss_Qty || 0),
          extLoss: acc.extLoss + (row.Ext_Loss || 0),
        }), { lossQty: 0, extLoss: 0 });
        result.push({ type: 'row', subtotal: customerSubtotal });
      });
    } else if (groupBy === 'item') {
      const itemGrouped: { [itemKey: string]: { rows: LossQtyReportRow[]; firstRow: LossQtyReportRow; onHand: number } } = {};
      filteredData.forEach(row => {
        const itemKey = `${row.Item_Number} ${row.Description || ''}`.trim();
        if (!itemGrouped[itemKey]) {
          itemGrouped[itemKey] = { rows: [], firstRow: row, onHand: row.OnHand || 0 };
        }
        itemGrouped[itemKey].rows.push(row);
      });
      // Sort items alphabetically by description first, then by item number
      Object.keys(itemGrouped).sort((keyA, keyB) => {
        const itemA = itemGrouped[keyA].firstRow;
        const itemB = itemGrouped[keyB].firstRow;
        // Sort by description first (alphabetically)
        const descCompare = customAlphabeticalSort(itemA.Description || '', itemB.Description || '');
        if (descCompare !== 0) return descCompare;
        // If descriptions are the same, sort by item number
        return (itemA.Item_Number || 0) - (itemB.Item_Number || 0);
      }).forEach(itemKey => {
        const { rows, firstRow, onHand } = itemGrouped[itemKey];
        result.push({ 
          type: 'header', 
          key: itemKey, 
          level: 1,
          itemData: firstRow,
          onHand: onHand
        });
        const sortedRows = rows.sort((a, b) => {
          const customerCompare = customAlphabeticalSort(a.C_Name || '', b.C_Name || '');
          if (customerCompare !== 0) return customerCompare;
          return (a.Invoice_Date || '').localeCompare(b.Invoice_Date || '');
        });
        sortedRows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        const itemSubtotal = sortedRows.reduce((acc, row) => ({
          lossQty: acc.lossQty + (row.Loss_Qty || 0),
          extLoss: acc.extLoss + (row.Ext_Loss || 0),
        }), { lossQty: 0, extLoss: 0 });
        result.push({ type: 'row', subtotal: itemSubtotal });
      });
    }

    // Add grand total at the end
    const grandTotal = filteredData.reduce((acc, row) => ({
      lossQty: acc.lossQty + (row.Loss_Qty || 0),
      extLoss: acc.extLoss + (row.Ext_Loss || 0),
    }), { lossQty: 0, extLoss: 0 });
    
    if (filteredData.length > 0) {
      result.push({ type: 'row', grandTotal });
    }

    return result;
  }, [filteredData, groupBy]);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleGenerateCSV = () => {
    setGeneratingReport(true);
    try {
      // Use fixed fields based on groupBy
      const fixedFields = getFixedFields(groupBy);
      const headers = fixedFields;
      const csvHeaders = headers.map(h => FIELD_LABELS[h] || h).join(',');

      const rows: string[] = [csvHeaders];

      // Add main header row with distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';
      
      const mainHeader = [
        distributorName || '',
        distributorAddress || '',
        distributorPhone || '',
        'Lost Sales Report',
        `Generated on: ${dayjs().format('MM/DD/YYYY')}`,
        fromDate && toDate ? `Date Range: ${fromDate.format('MM/DD/YYYY')} to ${toDate.format('MM/DD/YYYY')}` : '',
        `Report by: ${groupBy === 'item' ? 'Item' : groupBy === 'customer' ? 'Customer' : 'Date'}`
      ].filter(Boolean).join(' | ');
      rows.push(`"${mainHeader}"`);
      rows.push(''); // Empty row separator

      getAllGroupedData.forEach(item => {
        if (item.type === 'header') {
          // Format header based on groupBy
          let headerRow = '';
          if (groupBy === 'customer' && item.customerData) {
            const cust = item.customerData;
            const address = [cust.c_address, cust.c_city, cust.c_state, cust.c_zip].filter(Boolean).join(' ');
            headerRow = `Customer # ${cust.C_Number} - ${cust.C_Name || ''} ${address}`;
            rows.push(`"${headerRow}"`);
          } else if (groupBy === 'item' && item.itemData) {
            const leftPart = `Item # ${item.itemData.Item_Number} - ${item.itemData.Description || ''}`;
            const onHandText = item.onHand !== undefined ? `On Hand: ${item.onHand.toFixed(2)}` : '';
            // Show On Hand on the right side with spacing
            headerRow = onHandText ? `${leftPart} | ${onHandText}` : leftPart;
            rows.push(`"${headerRow}"`);
          } else {
            headerRow = item.key;
            rows.push(`"${headerRow}"`);
          }
        } else if (item.type === 'row' && 'data' in item) {
          const row = headers.map(header => {
            const value = (item.data as any)[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') {
              if (header.includes('Date')) {
                return dayjs(value).format('MM/DD/YYYY');
              } else if (header === 'Ext_Loss' || header.includes('Price') || header.includes('Cost')) {
                return value.toFixed(2);
              }
              return value.toString();
            }
            if (header.includes('Date') && typeof value === 'string') {
              return dayjs(value).format('MM/DD/YYYY');
            }
            return String(value);
          });
          rows.push(row.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
        } else if (item.type === 'row' && 'subtotal' in item) {
          rows.push(`"Total Lost Qty: ${item.subtotal.lossQty.toFixed(2)}, Ext lost: ${item.subtotal.extLoss.toFixed(2)}"`);
        } else if (item.type === 'row' && 'grandTotal' in item) {
          rows.push(`"Total Lost Qty: ${item.grandTotal.lossQty.toFixed(2)}, Total Ext Lost: ${item.grandTotal.extLoss.toFixed(2)}"`);
        }
      });

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `loss-qty-report-${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV downloaded successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to generate CSV');
    } finally {
      setGeneratingReport(false);
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
            const logoPath = rabbitLogo;
            if (typeof rabbitLogo === 'string' && !rabbitLogo.startsWith('data:') && !rabbitLogo.startsWith('http')) {
              const response = await fetch(logoPath);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
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
                  resolve(reader.result);
                } else {
                  resolve(null);
                }
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            } else {
              resolve(null);
            }
          } catch (fetchError) {
            console.error('Error fetching logo:', fetchError);
            resolve(null);
          }
        };
        
        // Set image source
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

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      // Load logo first before generating PDF
      const logoDataUrl = await loadLogoAsDataUrl();
      
      // Use fixed fields based on groupBy
      const pdfFieldKeys = getFixedFields(groupBy);
      const totalColumns = pdfFieldKeys.length;
      // Use portrait for customer grouping, otherwise use column-based logic
      const orientation = groupBy === 'customer' ? 'portrait' : (totalColumns <= 8 ? 'portrait' : 'landscape');
      
      const margin = 10;
      const date = dayjs().format('MM/DD/YYYY');
      let yPosition = 10;
      
      // Create doc with correct orientation
      const doc = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Get distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';
      
      // Main Header: Left - Distributor Details
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let leftY = yPosition;
      if (distributorName) {
        doc.setFont('helvetica', 'bold');
        doc.text(distributorName, margin, leftY);
        leftY += 4;
      }
      if (distributorAddress) {
        doc.setFont('helvetica', 'normal');
        doc.text(distributorAddress, margin, leftY);
        leftY += 4;
      }
      if (distributorPhone) {
        doc.text(distributorPhone, margin, leftY);
      }
      
      // Middle - Report Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Lost Sales Report', pageWidth / 2, yPosition + 4, { align: 'center' });
      
      // Right - Generated on, Date range, Report by
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let rightY = yPosition;
      doc.text(`Generated on: ${date}`, pageWidth - margin, rightY, { align: 'right' });
      rightY += 4;
      if (fromDate && toDate) {
        doc.text(`Date Range: ${fromDate.format('MM/DD/YYYY')} to ${toDate.format('MM/DD/YYYY')}`, pageWidth - margin, rightY, { align: 'right' });
        rightY += 4;
      }
      doc.text(`Report by: ${groupBy === 'item' ? 'Item' : groupBy === 'customer' ? 'Customer' : 'Date'}`, pageWidth - margin, rightY, { align: 'right' });
      
      yPosition = Math.max(leftY, rightY) + 8;
      
      const finalDoc = doc;

      // Table headers - use PDF-specific labels
      const headers = pdfFieldKeys.map((key: string) => PDF_FIELD_LABELS[key] || FIELD_LABELS[key] || key);

      // Table data
      const tableData: any[][] = [];

      getAllGroupedData.forEach(item => {
        if (item.type === 'header' && item.key) {
          let leftContent = item.key;
          
          if (groupBy === 'customer' && item.customerData) {
            const cust = item.customerData;
            const address = [cust.c_address, cust.c_city, cust.c_state, cust.c_zip].filter(Boolean).join(' ');
            leftContent = `Customer # ${cust.C_Number} - ${cust.C_Name || ''} ${address}`;
          } else if (groupBy === 'item' && item.itemData) {
            // For item grouping, show On Hand on the right side
            const itemDesc = item.itemData.Description || '';
            const leftPart = `Item # ${item.itemData.Item_Number} - ${itemDesc}`;
            const onHandText = item.onHand !== undefined ? `On Hand: ${item.onHand.toFixed(2)}` : '';
            // Format with On Hand on the right
            leftContent = onHandText ? `${leftPart} | ${onHandText}` : leftPart;
          } else if (groupBy === 'date') {
            leftContent = item.key;
          }
          
          // Single cell spanning all columns
          tableData.push([{ 
            content: leftContent, 
            colSpan: headers.length, 
            styles: { 
              fontStyle: 'bold', 
              fillColor: [200, 200, 200],
              textColor: [0, 0, 0],
              halign: groupBy === 'item' && item.itemData && item.onHand !== undefined ? 'left' : 'left',
            } 
          }]);
        } else if (item.type === 'row' && 'data' in item) {
          const row = item.data;
          const rowData: any[] = [];
          
          // Add field values in the same order as headers
          pdfFieldKeys.forEach((field: string) => {
            const value = (row as any)[field];
            let displayValue = '';
            if (value !== null && value !== undefined) {
              if (typeof value === 'number') {
                if (field.includes('Date')) {
                  displayValue = dayjs(value).format('MM/DD/YYYY');
                } else if (
                  field.includes('Price') || 
                  field.includes('Cost') || 
                  field === 'Ext_Loss' || 
                  field.includes('Amount')
                ) {
                  displayValue = value.toFixed(2);
                } else {
                  displayValue = value.toString();
                }
              } else if (typeof value === 'boolean') {
                displayValue = value ? 'Yes' : 'No';
              } else if (field.includes('Date') && typeof value === 'string') {
                displayValue = dayjs(value).format('MM/DD/YYYY');
              } else {
                displayValue = String(value);
              }
            }
            rowData.push(displayValue);
          });
          
          tableData.push(rowData);
        } else if (item.type === 'row' && 'subtotal' in item) {
          tableData.push([{ 
            content: `Total Lost Qty: ${item.subtotal.lossQty.toFixed(2)}, Ext lost: ${item.subtotal.extLoss.toFixed(2)}`, 
            colSpan: headers.length, 
            styles: { fontStyle: 'bold' } 
          }]);
        } else if (item.type === 'row' && 'grandTotal' in item) {
          tableData.push([{ 
            content: `Total Lost Qty: ${item.grandTotal.lossQty.toFixed(2)}, Total Ext Lost: ${item.grandTotal.extLoss.toFixed(2)}`, 
            colSpan: headers.length, 
            styles: { 
              fontStyle: 'bold',
              fillColor: [220, 220, 220],
              textColor: [0, 0, 0],
            } 
          }]);
        }
      });

      // Generate table using autoTable (v5+ uses function call instead of method)
      // Handle both default export and named export
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      
      autoTableFn(finalDoc, {
        head: [headers],
        body: tableData,
        startY: yPosition, // Start position for first page (with header)
        margin: { 
          left: margin, 
          right: margin,
          top: 5, // Smaller top margin for pages 2+ (will be overridden by startY on first page)
          bottom: 15 // Bottom margin for all pages to provide space for footer
        },
        styles: { fontSize: 7 },
        headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
        columnStyles: pdfFieldKeys.reduce((acc: { [key: number]: { fontSize?: number; overflow?: string; cellPadding?: number } }, field: string, index: number) => {
          // Auto width - let jspdf-autotable calculate automatically
          // Only set styling properties, not cellWidth
          if (field === 'C_Name' || field === 'Description') {
            acc[index] = { 
              fontSize: 6,
              overflow: 'linebreak',
              cellPadding: 2,
            };
          } else {
            acc[index] = {
              overflow: 'ellipsize',
            };
          }
          return acc;
        }, {} as { [key: number]: { fontSize?: number; overflow?: string; cellPadding?: number } }),
        didDrawPage: (data: any) => {
          // Only show main header on first page
          if (data.pageNumber === 1) {
            const headerY = 10;
            
            // Left - Distributor Details
            finalDoc.setFontSize(8);
            finalDoc.setFont('helvetica', 'normal');
            let leftY = headerY;
            if (distributorName) {
              finalDoc.setFont('helvetica', 'bold');
              finalDoc.text(distributorName, margin, leftY);
              leftY += 4;
            }
            if (distributorAddress) {
              finalDoc.setFont('helvetica', 'normal');
              finalDoc.text(distributorAddress, margin, leftY);
              leftY += 4;
            }
            if (distributorPhone) {
              finalDoc.text(distributorPhone, margin, leftY);
            }
            
            // Middle - Report Title
            finalDoc.setFontSize(14);
            finalDoc.setFont('helvetica', 'bold');
            finalDoc.text('Lost Sales Report', finalDoc.internal.pageSize.getWidth() / 2, headerY + 4, { align: 'center' });
            
            // Right - Generated on, Date range, Report by
            finalDoc.setFontSize(8);
            finalDoc.setFont('helvetica', 'normal');
            let rightY = headerY;
            finalDoc.text(`Generated on: ${date}`, finalDoc.internal.pageSize.getWidth() - margin, rightY, { align: 'right' });
            rightY += 4;
            if (fromDate && toDate) {
              finalDoc.text(`Date Range: ${fromDate.format('MM/DD/YYYY')} to ${toDate.format('MM/DD/YYYY')}`, finalDoc.internal.pageSize.getWidth() - margin, rightY, { align: 'right' });
              rightY += 4;
            }
            finalDoc.text(`Report by: ${groupBy === 'item' ? 'Item' : groupBy === 'customer' ? 'Customer' : 'Date'}`, finalDoc.internal.pageSize.getWidth() - margin, rightY, { align: 'right' });
          } else {
            // For pages 2+, set a smaller top margin by adjusting the page's Y position
            // This ensures the table starts higher on subsequent pages
            finalDoc.setPage(data.pageNumber);
            // The margin.top setting should handle this, but we ensure it here
          }
        },
      });

      // Footer with "Report Generated by Woopsa" on left and "Page X of Y" on right
      const pageCount = (finalDoc as any).internal.getNumberOfPages();
      const finalPageWidth = finalDoc.internal.pageSize.getWidth();
      for (let i = 1; i <= pageCount; i++) {
        finalDoc.setPage(i);
        const currentPageHeight = finalDoc.internal.pageSize.getHeight();
        const footerY = currentPageHeight - 5;
        
        // Add "Report Generated by Woopsa" with logo on the left
        finalDoc.setFontSize(6);
        finalDoc.setFont('helvetica', 'normal');
        finalDoc.setTextColor(100, 100, 100);
        const footerText = 'Report Generated by Woopsa';
        finalDoc.text(footerText, margin, footerY);
        
        // Add logo beside text
        if (logoDataUrl) {
          try {
            const textWidth = finalDoc.getTextWidth(footerText);
            finalDoc.addImage(logoDataUrl, 'PNG', margin + textWidth + 1, footerY - 2.5, 3, 3);
          } catch {
            try {
              const textWidth = finalDoc.getTextWidth(footerText);
              finalDoc.addImage(logoDataUrl, 'SVG', margin + textWidth + 1, footerY - 2.5, 3, 3);
            } catch {
              // Ignore logo errors
            }
          }
        }
        
        // Add page number on the right
        finalDoc.setFontSize(7);
        finalDoc.setFont('helvetica', 'normal');
        finalDoc.setTextColor(100, 100, 100);
        const pageText = `${i} of ${pageCount}`;
        finalDoc.text(pageText, finalPageWidth - margin, footerY, { align: 'right' });
      }

      finalDoc.save(`loss-qty-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
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
            Loss Quantity Report Configuration
          </Typography>
        )}

        {!showPreview ? (
          <Paper sx={{ 
            p: 0.75, 
            borderRadius: 1,
            mb: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}>
            <Grid container spacing={3}>
              {/* Left Side - Filters, Date, Grouping (Stacked Vertically) */}
              <Grid size={{ xs: 12, md: 3 }}>
                {/* Date Range */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Date Range
                  </Typography>
                  <Box sx={{ mb: 0.5 }}>
                    <CustomDatePicker
                      label="From Date"
                      value={fromDate}
                      onChange={setFromDate}
                      sx={{ 
                        mb: 1,
                        '& .MuiInputBase-root': {
                          height: '32px',
                          fontSize: '0.7rem',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.7rem',
                          py: 0.75,
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.7rem',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1rem',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <CustomDatePicker
                      label="To Date"
                      value={toDate}
                      onChange={setToDate}
                      sx={{ 
                        mb: 0,
                        '& .MuiInputBase-root': {
                          height: '32px',
                          fontSize: '0.7rem',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.7rem',
                          py: 0.75,
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.7rem',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1rem',
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Grouping */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Group By
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'item'}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Item Number</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => setGroupBy('item')}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'customer'}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Customer</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => setGroupBy('customer')}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'date'}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Date</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => setGroupBy('date')}
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Right Column - Filter Dropdowns */}
              <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={1.5}>
                  {/* Sales Category Filter */}
                  {filterOptions.salesCategories && filterOptions.salesCategories.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Categories</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const category = filterOptions.salesCategories?.find(cat => cat.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {category?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-root': {
                            minHeight: '32px',
                            height: '32px',
                            '& input': {
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                            },
                          },
                          '& .MuiSelect-select': {
                            minHeight: 'auto',
                            py: 0.5,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '1px',
                          },
                          '& .MuiSelect-icon': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {filterOptions.salesCategories.map((category) => (
                          <MenuItem 
                            key={category.value} 
                            value={String(category.value)}
                            sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                          >
                            <Checkbox
                              checked={selectedSalesCategories.includes(category.value)}
                              size="small"
                              sx={{ 
                                py: 0,
                                '& .MuiSvgIcon-root': { fontSize: '1rem' }
                              }}
                            />
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {/* Price Class Filter */}
                  {filterOptions.priceClasses && filterOptions.priceClasses.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Price Classes</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const priceClass = filterOptions.priceClasses?.find(pc => pc.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {priceClass?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-root': {
                            minHeight: '32px',
                            height: '32px',
                            '& input': {
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                            },
                          },
                          '& .MuiSelect-select': {
                            minHeight: 'auto',
                            py: 0.5,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '1px',
                          },
                          '& .MuiSelect-icon': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {filterOptions.priceClasses.map((priceClass) => (
                          <MenuItem 
                            key={priceClass.value} 
                            value={String(priceClass.value)}
                            sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                          >
                            <Checkbox
                              checked={selectedPriceClasses.includes(priceClass.value)}
                              size="small"
                              sx={{ 
                                py: 0,
                                '& .MuiSvgIcon-root': { fontSize: '1rem' }
                              }}
                            />
                            {priceClass.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {/* Customer Filter */}
                  {filterOptions.customers && filterOptions.customers.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Customer
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedCustomers.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedCustomers(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Customers</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const customer = filterOptions.customers?.find(c => c.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {customer?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-root': {
                            minHeight: '32px',
                            height: '32px',
                            '& input': {
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                            },
                          },
                          '& .MuiSelect-select': {
                            minHeight: 'auto',
                            py: 0.5,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '1px',
                          },
                          '& .MuiSelect-icon': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {filterOptions.customers.map((customer) => (
                          <MenuItem 
                            key={customer.value} 
                            value={String(customer.value)}
                            sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                          >
                            <Checkbox
                              checked={selectedCustomers.includes(customer.value)}
                              size="small"
                              sx={{ 
                                py: 0,
                                '& .MuiSvgIcon-root': { fontSize: '1rem' }
                              }}
                            />
                            {customer.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {/* Sales Reps Filter */}
                  {filterOptions.salesReps && filterOptions.salesReps.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Sales Reps
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedSalesReps.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedSalesReps(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Sales Reps</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const rep = filterOptions.salesReps?.find(r => r.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {rep?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.salesReps.map((rep) => (
                          <MenuItem key={rep.value} value={String(rep.value)} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedSalesReps.includes(rep.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {rep.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {filterOptions.routes && filterOptions.routes.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Routes
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedRoutes.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedRoutes(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Routes</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const route = filterOptions.routes?.find(r => r.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {route?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.routes.map((route) => (
                          <MenuItem key={route.value} value={String(route.value)} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedRoutes.includes(route.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {route.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {filterOptions.states && filterOptions.states.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        States
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedStates.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedStates(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All States</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const state = filterOptions.states?.find(s => s.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {state?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.states.map((state) => (
                          <MenuItem key={state.value} value={String(state.value)} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedStates.includes(state.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {state.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {filterOptions.cities && filterOptions.cities.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Cities
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedCities.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedCities(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Cities</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const city = filterOptions.cities?.find(c => c.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {city?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.cities.map((city) => (
                          <MenuItem key={city.value} value={String(city.value)} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedCities.includes(city.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {city.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {filterOptions.otpTypes && filterOptions.otpTypes.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        OTP Types
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedOTPTypes.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedOTPTypes(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All OTP Types</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const otp = filterOptions.otpTypes?.find(o => o.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {otp?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.otpTypes.map((otp) => (
                          <MenuItem key={otp.value} value={String(otp.value)} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedOTPTypes.includes(otp.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {otp.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {filterOptions.classesOfTrade && filterOptions.classesOfTrade.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Class of Trade
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedClassesOfTrade}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedClassesOfTrade(values);
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Classes of Trade</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const cot = filterOptions.classesOfTrade?.find(c => c.value === value);
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {cot?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.classesOfTrade.map((cot) => (
                          <MenuItem key={cot.value} value={cot.value} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedClassesOfTrade.includes(cot.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {cot.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}

                  {filterOptions.counties && filterOptions.counties.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Counties
                      </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedCounties.map(String)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedCounties(values.map(Number));
                        }}
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Counties</Typography>;
                          }
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.slice(0, 2).map((value) => {
                                const county = filterOptions.counties?.find(c => c.value === Number(value));
                                return (
                                  <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                    {county?.label || value}
                                    {selected.length > 2 && value === selected[1] ? ` +${selected.length - 2}` : ''}
                                  </Typography>
                                );
                              })}
                            </Box>
                          );
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto' },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        {filterOptions.counties.map((county) => (
                          <MenuItem key={county.value} value={String(county.value)} sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                            <Checkbox checked={selectedCounties.includes(county.value)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }} />
                            {county.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    </Grid>
                  )}
                </Grid>
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
            {/* Main Page Header */}
            <Box sx={{ 
              mb: 2, 
              pb: 1.5, 
              borderBottom: `2px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              {/* Left: Distributor Details */}
              <Box sx={{ flex: 1 }}>
                {(() => {
                  const distributor = wareHouseDetail?.[0];
                  const distributorName = distributor?.D_Name || '';
                  const distributorAddress = [
                    distributor?.D_Addr1,
                    distributor?.D_City,
                    distributor?.D_State
                  ].filter(Boolean).join(', ');
                  const distributorPhone = distributor?.D_Phone || '';
                  
                  return (
                    <>
                      {distributorName && (
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>
                          {distributorName}
                        </Typography>
                      )}
                      {distributorAddress && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.3 }}>
                          {distributorAddress}
                        </Typography>
                      )}
                      {distributorPhone && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {distributorPhone}
                        </Typography>
                      )}
                    </>
                  );
                })()}
              </Box>
              
              {/* Middle: Report Title */}
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
                  Lost Sales Report
                </Typography>
              </Box>
              
              {/* Right: Generated on, Date range, Report by */}
              <Box sx={{ flex: 1, textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.3 }}>
                  Generated on: {dayjs().format('MM/DD/YYYY')}
                </Typography>
                {fromDate && toDate && (
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.3 }}>
                    Date Range: {fromDate.format('MM/DD/YYYY')} to {toDate.format('MM/DD/YYYY')}
                  </Typography>
                )}
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Report by: {groupBy === 'item' ? 'Item' : groupBy === 'customer' ? 'Customer' : 'Date'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.813rem', mt: 0 }}>
                Preview Data ({filteredData.length} rows)
                {totalChunks > 1 && (
                  <Typography component="span" sx={{ ml: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                    (Chunk {currentChunk + 1} of {totalChunks})
                  </Typography>
                )}
              </Typography>
              {totalChunks > 1 && (
                <Pagination
                  count={totalChunks}
                  page={currentChunk + 1}
                  onChange={(_, page) => handleChunkChange(page - 1)}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
            <TableContainer 
              sx={{ 
                maxHeight: '60vh', 
                overflow: 'auto',
                overflowX: 'auto',
                overflowY: 'auto',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                ...(groupBy === 'date' ? {
                  width: '100%',
                  '& table': {
                    tableLayout: 'auto !important',
                    width: 'auto !important',
                    minWidth: 'auto !important',
                  },
                } : {}),
              }}
            >
              <Table 
                stickyHeader 
                size="small" 
                sx={{ 
                  ...(groupBy === 'date' 
                    ? {
                        tableLayout: 'auto',
                        width: 'auto',
                        minWidth: 'auto',
                      }
                    : {
                        minWidth: 'max-content',
                      }
                  ),
                }}
              >
                <TableHead>
                  <TableRow>
                    {getFixedFields(groupBy).map(field => (
                      <TableCell 
                        key={field}
                        sx={{
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...(groupBy === 'date' ? {
                            // No width constraints - fully auto
                            width: 'auto',
                            minWidth: 'auto',
                            maxWidth: 'none',
                            whiteSpace: (field === 'C_Name' || field === 'Description') ? 'normal' : 'nowrap',
                            paddingLeft: '8px',
                            paddingRight: '8px',
                          } : {}),
                        }}
                      >
                        {FIELD_LABELS[field] || field}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getGroupedData.map((item, idx) => {
                    const fixedFields = getFixedFields(groupBy);
                    const totalCols = fixedFields.length;
                    
                    if (item.type === 'header') {
                      let leftContent = item.key;
                      
                      if (groupBy === 'customer' && item.customerData) {
                        const cust = item.customerData;
                        const address = [cust.c_address, cust.c_city, cust.c_state, cust.c_zip].filter(Boolean).join(' ');
                        leftContent = `Customer # ${cust.C_Number} - ${cust.C_Name || ''} ${address}`;
                      } else if (groupBy === 'item' && item.itemData) {
                        // For item grouping, show On Hand on the right side
                        const itemDesc = item.itemData.Description || '';
                        leftContent = `Item # ${item.itemData.Item_Number} - ${itemDesc}`;
                      } else if (groupBy === 'date') {
                        // Date grouping - keep as is
                        leftContent = item.key;
                      }
                      
                      return (
                        <TableRow key={`header-${idx}`}>
                          <TableCell
                            colSpan={totalCols}
                            sx={{ 
                              fontWeight: 600, 
                              backgroundColor: theme.palette.action.hover,
                              pl: 1,
                              fontSize: '0.813rem',
                              py: 1,
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '100%',
                            }}>
                              <Box component="span" sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}>
                                {leftContent}
                              </Box>
                              {groupBy === 'item' && item.itemData && item.onHand !== undefined && (
                                <Box component="span" sx={{ 
                                  ml: 2,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}>
                                  On Hand: {item.onHand.toFixed(2)}
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    } else if (item.type === 'row' && 'data' in item) {
                      const row = item.data;
                      return (
                        <TableRow key={`row-${idx}`}>
                          {fixedFields.map(field => {
                            const value = (row as any)[field];
                            // Format the value based on type
                            let displayValue = value;
                            if (value === null || value === undefined) {
                              displayValue = '';
                            } else if (typeof value === 'number') {
                              // Format numbers appropriately
                              if (field.includes('Date')) {
                                displayValue = dayjs(value).format('MM/DD/YYYY');
                              } else if (
                                field.includes('Price') || 
                                field.includes('Cost') || 
                                field === 'Ext_Loss' || 
                                field.includes('Amount')
                              ) {
                                displayValue = value.toFixed(2);
                              } else {
                                displayValue = value.toString();
                              }
                            } else if (typeof value === 'boolean') {
                              displayValue = value ? 'Yes' : 'No';
                            } else if (field.includes('Date') && typeof value === 'string') {
                              displayValue = dayjs(value).format('MM/DD/YYYY');
                            } else {
                              displayValue = String(value);
                            }
                            return (
                              <TableCell 
                                key={field} 
                                align={typeof value === 'number' && !field.includes('Date') ? 'right' : 'left'}
                                sx={
                                  groupBy === 'date' 
                                    ? {
                                        // Completely auto width - NO constraints at all for date grouping
                                        fontSize: '0.75rem',
                                        width: 'auto',
                                        minWidth: 'auto',
                                        maxWidth: 'none',
                                        whiteSpace: (field === 'C_Name' || field === 'Description') ? 'normal' : 'nowrap',
                                        paddingLeft: '8px',
                                        paddingRight: '8px',
                                        boxSizing: 'border-box',
                                        overflow: 'visible',
                                        textOverflow: 'clip',
                                      }
                                    : field === 'C_Name' || field === 'Description' 
                                      ? {
                                          minWidth: 200,
                                          maxWidth: 300,
                                          fontSize: '0.75rem',
                                        } 
                                      : (field === 'Document_Number' || field === 'Invoice_Date' || field === 'Quantity_Ordered' || field === 'Quantity_Shipped' || field === 'Loss_Qty' || field === 'Ext_Loss') 
                                        ? {
                                            minWidth: 80,
                                            maxWidth: 120,
                                          } 
                                        : {}
                                }
                              >
                                {displayValue}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    } else if (item.type === 'row' && 'subtotal' in item) {
                      return (
                        <TableRow key={`subtotal-${idx}`}>
                          <TableCell
                            colSpan={totalCols}
                            sx={{ fontWeight: 600 }}
                          >
                            Total Lost Qty: {item.subtotal.lossQty.toFixed(2)}, Ext lost: {item.subtotal.extLoss.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    } else if (item.type === 'row' && 'grandTotal' in item) {
                      return (
                        <TableRow key={`grandtotal-${idx}`}>
                          <TableCell
                            colSpan={totalCols}
                            sx={{ fontWeight: 700, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', fontSize: '0.813rem', py: 1.5 }}
                          >
                            Total Lost Qty: {item.grandTotal.lossQty.toFixed(2)}, Total Ext Lost: {item.grandTotal.extLoss.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* Action Buttons at Bottom - Like InventoryReportTab */}
      <Box
        sx={{
          width: '100%',
          px: 2,
          py: 1.5,
          pt: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        {!showPreview ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <CustomButton
              type="button"
              buttonType="primary"
              appearance="filled"
              onClick={handlePreview}
              disabled={loading || filteredData.length === 0}
              loading={loading}
              icon={<PreviewIcon />}
              iconPosition="left"
              fullWidth={false}
              sx={{ minWidth: 180, mt: 0 }}
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
              }}
              fullWidth={false}
              sx={{ minWidth: 180, mt: 0 }}
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
                sx={{ minWidth: 180, mt: 0 }}
              >
                Generate CSV
              </CustomButton>
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
                sx={{ minWidth: 180, mt: 0 }}
              >
                {generatingPDF ? 'Generating PDF...' : 'Generate PDF'}
              </CustomButton>
            </Box>
          </>
        )}
      </Box>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default LossQtyReportTab;
