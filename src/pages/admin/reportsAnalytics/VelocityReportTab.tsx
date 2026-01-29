import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Pagination,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
  Radio,
  FormControlLabel,
  Switch,
} from '@mui/material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
import { getVelocityReportCustomer } from '../../../redux/apis/distrubutor/reportsApis';
import { getListOfLossQuantityReport } from '../../../redux/apis/distrubutor/listApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

interface VelocityReportRow {
  Document_Number: string;
  Invoice_Date: string;
  Invoice_Number: number;
  C_Number: number;
  S_Number: number;
  Route_Number: number;
  C_ClassOfTrade: string;
  Order_Number: number;
  Promo_Number: number;
  Item_Number: number;
  Quantity_Ordered: number;
  Quantity_Shipped: number;
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
  Price_Class_Price: number;
  Ext_Points: number;
  EXT_Price: number;
  Ext_AvgCost: number;
  Ext_Total_AvgCost: number;
  Ext_BaseCost: number;
  Ext_Total_BaseCost: number;
  Ext_NetCost: number;
  Ext_Total_NetCost: number;
  Ext_Invoice_Cost: number;
  Ext_Total_Invoice_Cost: number;
  EXT_Total_Price: number;
  Ext_Price: number;
  Profit: number;
  Profit_Percent: number;
  AvgCost_Profit_Percent: number;
  BaseCost_Profit_Percent: number;
  NetCost_Profit_Percent: number;
  Invoice_Cost_Profit_Percent: number;
  Description: string;
  UOM: string;
  Sales_Category: number;
  OTP_Number: number;
  Primary_Vendor: number;
  Price_Subclass: number;
  Jurisdiction_State: number;
  Jurisdiction_County: number;
  Jurisdiction_City: number;
  Location: number;
  Section: string;
  PickArea: string;
  Pack: number;
  UnitOunces: number;
  Cig_Sticks: number;
  Points: number;
  Cig_Pack: number;
  Price_Class_Number: number;
  Class_Desc: string;
  C_Name: string;
  c_address: string;
  c_city: string;
  c_state: string;
  c_zip: string;
  c_phone: string;
  c_Salesman: number;
  c_memo: string;
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

type CostType = 'Price' | 'AvgCost' | 'BaseCost' | 'NetCost' | 'Invoice_Cost';

const FIELD_LABELS: { [key: string]: string } = {
  Document_Number: 'Document Number',
  Invoice_Date: 'Invoice Date',
  Invoice_Number: 'Invoice Number',
  C_Number: 'Customer Number',
  S_Number: 'Sales Rep Number',
  Route_Number: 'Route Number',
  C_ClassOfTrade: 'Class of Trade',
  Order_Number: 'Order Number',
  Promo_Number: 'Promo Number',
  Item_Number: 'Item Number',
  Quantity_Ordered: 'Quantity Ordered',
  Quantity_Shipped: 'Quantity Shipped',
  Price: 'Price',
  NetCost: 'Net Cost',
  BaseCost: 'Base Cost',
  AvgCost: 'Average Cost',
  Invoice_Cost: 'Invoice Cost',
  Ext_AvgCost: 'Ext Avg Cost',
  Ext_Total_AvgCost: 'Ext Total Avg Cost',
  Ext_BaseCost: 'Ext Base Cost',
  Ext_Total_BaseCost: 'Ext Total Base Cost',
  Ext_NetCost: 'Ext Net Cost',
  Ext_Total_NetCost: 'Ext Total Net Cost',
  Ext_Invoice_Cost: 'Ext Invoice Cost',
  Ext_Total_Invoice_Cost: 'Ext Total Invoice Cost',
  EXT_Price: 'Ext Price',
  EXT_Total_Price: 'Ext Total Price',
  Ext_Price: 'Ext Price',
  Profit: 'Profit',
  Profit_Percent: 'Profit %',
  AvgCost_Profit_Percent: 'Avg Cost Profit %',
  BaseCost_Profit_Percent: 'Base Cost Profit %',
  NetCost_Profit_Percent: 'Net Cost Profit %',
  Invoice_Cost_Profit_Percent: 'Invoice Cost Profit %',
  Description: 'Description',
  UOM: 'UOM',
  Sales_Category: 'Sales Category',
  OTP_Number: 'OTP Number',
  Primary_Vendor: 'Primary Vendor',
  Price_Subclass: 'Price Subclass',
  Jurisdiction_State: 'Jurisdiction State',
  Jurisdiction_County: 'Jurisdiction County',
  Jurisdiction_City: 'Jurisdiction City',
  Location: 'Location',
  Section: 'Section',
  PickArea: 'Pick Area',
  Pack: 'Pack',
  UnitOunces: 'Unit Ounces',
  Cig_Sticks: 'Cig Sticks',
  Cig_Pack: 'Cig Pack',
  Price_Class_Number: 'Price Class Number',
  Class_Desc: 'Class Description',
  C_Name: 'Customer Name',
  c_address: 'Address',
  c_city: 'City',
  c_state: 'State',
  c_zip: 'Zip',
  c_phone: 'Phone',
  c_Salesman: 'Salesman',
  c_memo: 'Memo',
};

// Field groups definition - matching the report types from the system
const FIELD_GROUPS: { [key: string]: { label: string; fields: string[] } } = {
  qtyPriceCost: {
    label: '(Qty/Price/Cost)',
    fields: ['Item_Number', 'Description', 'Quantity_Ordered', 'Quantity_Shipped', 'Price', 'EXT_Price', 'EXT_Total_Price', 'AvgCost', 'Ext_AvgCost', 'Ext_Total_AvgCost', 'BaseCost', 'Ext_BaseCost', 'Ext_Total_BaseCost', 'NetCost', 'Ext_NetCost', 'Ext_Total_NetCost', 'Invoice_Cost', 'Ext_Invoice_Cost', 'Ext_Total_Invoice_Cost'],
  },
  basic: {
    label: 'Basic Report',
    fields: ['Item_Number', 'Description', 'Quantity_Shipped', 'Price', 'EXT_Price', 'EXT_Total_Price', 'C_Number', 'C_Name', 'Invoice_Date', 'Document_Number'],
  },
  priceClassDiscounts: {
    label: '(Price Class Discounts)',
    fields: ['Item_Number', 'Description', 'Price_Class_Number', 'Class_Desc', 'Price_Class_Price', 'Price', 'EXT_Price', 'EXT_Total_Price', 'Quantity_Shipped'],
  },
  price: {
    label: '(Price)',
    fields: ['Item_Number', 'Description', 'Price', 'EXT_Price', 'EXT_Total_Price', 'Price_Class_Price', 'Quantity_Shipped'],
  },
  priceCostProfit: {
    label: '(Price/Cost/Profit)',
    fields: ['Item_Number', 'Description', 'Price', 'EXT_Price', 'EXT_Total_Price', 'AvgCost', 'Ext_AvgCost', 'Ext_Total_AvgCost', 'BaseCost', 'Ext_BaseCost', 'Ext_Total_BaseCost', 'NetCost', 'Ext_NetCost', 'Ext_Total_NetCost', 'Invoice_Cost', 'Ext_Invoice_Cost', 'Ext_Total_Invoice_Cost', 'Profit', 'Profit_Percent', 'AvgCost_Profit_Percent', 'BaseCost_Profit_Percent', 'NetCost_Profit_Percent', 'Invoice_Cost_Profit_Percent'],
  },
  profitPortrait: {
    label: '(Profit-Portrait)',
    fields: ['Item_Number', 'Description', 'Quantity_Shipped', 'Price', 'EXT_Price', 'EXT_Total_Price', 'Profit', 'Profit_Percent'],
  },
  qtyPrice: {
    label: '(Qty/Price)',
    fields: ['Item_Number', 'Description', 'Quantity_Ordered', 'Quantity_Shipped', 'Price', 'EXT_Price', 'EXT_Total_Price'],
  },
  pointsItem: {
    label: '(Points: Item)',
    fields: ['Item_Number', 'Description', 'Ext_Points', 'Points', 'Quantity_Shipped', 'Price', 'EXT_Price'],
  },
  pointsSalesDetail: {
    label: '(Points: Sales Detail)',
    fields: ['Item_Number', 'Description', 'Ext_Points', 'Points', 'Document_Number', 'Invoice_Date', 'C_Number', 'C_Name', 'Quantity_Shipped', 'Price', 'EXT_Price'],
  },
  priceClassRebates: {
    label: '(Price Class Rebates)',
    fields: ['Item_Number', 'Description', 'Price_Class_Number', 'Class_Desc', 'Price_Class_Price', 'Price', 'EXT_Price', 'EXT_Total_Price', 'Quantity_Shipped', 'C_Number', 'C_Name'],
  },
  priceClassGroup: {
    label: '(Price Class Group)',
    fields: ['Price_Class_Number', 'Class_Desc', 'Item_Number', 'Description', 'Quantity_Shipped', 'Price', 'EXT_Price', 'EXT_Total_Price', 'Price_Class_Price'],
  },
  salesCategoryGroup: {
    label: '(Sales Category Group)',
    fields: ['Sales_Category', 'Item_Number', 'Description', 'Quantity_Shipped', 'Price', 'EXT_Price', 'EXT_Total_Price'],
  },
};

const VelocityReportTab: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<VelocityReportRow[]>([]);
  const [filteredData, setFilteredData] = useState<VelocityReportRow[]>([]);
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
  const [currentChunk, setCurrentChunk] = useState(0);
  const [allChunks, setAllChunks] = useState<VelocityReportRow[][]>([]);
  const CHUNK_SIZE = 1000;

  // Cost type selection
  const [selectedCostType, setSelectedCostType] = useState<CostType>('AvgCost');

  // Grouping
  const [groupBy, setGroupBy] = useState<'item' | 'customer' | 'date' | 'none'>('none');

  // Field selection
  const getDefaultFields = useCallback((groupByValue: 'item' | 'customer' | 'date' | 'none'): { [key: string]: boolean } => {
    if (groupByValue === 'item') {
      const defaults: { [key: string]: boolean } = {};
      ['C_Number', 'C_Name', 'c_address', 'c_city', 'c_state', 'c_zip', 'c_phone', 'c_Salesman'].forEach(field => {
        defaults[field] = true;
      });
      return defaults;
    } else {
      return {
        Item_Number: true,
        Description: true,
        Quantity_Shipped: true,
      };
    }
  }, []);

  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>(() => 
    getDefaultFields('none')
  );
  const [selectedFieldGroup, setSelectedFieldGroup] = useState<string>('');

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  // Filter states
  const [selectedSalesCategories, setSelectedSalesCategories] = useState<number[]>([]);
  const [selectedPriceClasses, setSelectedPriceClasses] = useState<number[]>([]);
  const [selectedOTPTypes, setSelectedOTPTypes] = useState<number[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [selectedStates, setSelectedStates] = useState<number[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<number[]>([]);
  const [selectedCities, setSelectedCities] = useState<number[]>([]);
  const [selectedClassesOfTrade, setSelectedClassesOfTrade] = useState<string[]>([]);

  const hasInitialized = useRef(false);

  // Fetch filter options
  useEffect(() => {
    fetchFilterOptions();
    fetchReportData();
    hasInitialized.current = true;
  }, []);

  // Call API when dates change
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
      
      const options: FilterOptions = {};
      
      const mapArrayItems = (arr: any[], valueKey: string, labelKey: string) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((item: any) => ({
          value: item[valueKey] ?? item.value ?? item.id ?? item,
          label: item[labelKey] ?? item.label ?? item.name ?? String(item[valueKey] ?? item.value ?? item.id ?? item),
        }));
      };

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
      
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  };

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    setCurrentChunk(0);
    setAllChunks([]);
    setReportData([]);
    
    try {
      const params: any = {};
      
      if (fromDate && toDate) {
        params.startDate = fromDate.format('MM-DD-YYYY');
        params.endDate = toDate.format('MM-DD-YYYY');
      }

      const response = await getVelocityReportCustomer(params.startDate, params.endDate) as any;
      // Handle different response structures - extract the actual data array
      let rows: any[] = [];
      
      // Try different response structures - handle nested data.data.data structure
      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        rows = response.data.data.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        rows = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        rows = response.data;
      } else if (Array.isArray(response)) {
        rows = response;
      } else if (response && typeof response === 'object') {
        // If it's a single object (not an array), check if it has data property
        if (response.data && Array.isArray(response.data)) {
          rows = response.data;
        } else {
          // Single object - wrap in array only if it looks like a data row
          const hasDataRowFields = response.Item_Number || response.Document_Number || response.C_Number;
          if (hasDataRowFields) {
            rows = [response];
          }
        }
      }
      
      // Debug: Log extracted rows count
      console.log('Extracted rows count:', rows.length);
      if (rows.length > 0) {
        console.log('First row sample:', rows[0]);
      }
      
      if (!Array.isArray(rows) || rows.length === 0) {
        setReportData([]);
        setFilteredData([]);
        setAllChunks([]);
        setLoading(false);
        return;
      }

      // Filter out any non-data objects (like pagination, metadata, etc.)
      rows = rows.filter((row: any) => {
        // Only include objects that look like actual data rows
        return row && typeof row === 'object' && 
               (row.Item_Number !== undefined || row.Document_Number !== undefined || row.C_Number !== undefined) &&
               !row.pagination && // Exclude pagination objects
               !Array.isArray(row); // Exclude nested arrays
      });

      if (rows.length === 0) {
        setReportData([]);
        setFilteredData([]);
        setAllChunks([]);
        setLoading(false);
        return;
      }

      if (rows.length < CHUNK_SIZE) {
        setReportData(rows);
        setAllChunks([rows]);
        setCurrentChunk(0);
        setLoading(false);
        return;
      }

      const chunks: VelocityReportRow[][] = [];
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

  // Get cost-related fields based on selected cost type
  const getCostFields = useMemo(() => {
    const costFields: { [key in CostType]: string[] } = {
      Price: ['Price', 'EXT_Price', 'EXT_Total_Price'],
      AvgCost: ['AvgCost', 'Ext_AvgCost', 'Ext_Total_AvgCost', 'AvgCost_Profit_Percent'],
      BaseCost: ['BaseCost', 'Ext_BaseCost', 'Ext_Total_BaseCost', 'BaseCost_Profit_Percent'],
      NetCost: ['NetCost', 'Ext_NetCost', 'Ext_Total_NetCost', 'NetCost_Profit_Percent'],
      Invoice_Cost: ['Invoice_Cost', 'Ext_Invoice_Cost', 'Ext_Total_Invoice_Cost', 'Invoice_Cost_Profit_Percent'],
    };
    return costFields[selectedCostType] || [];
  }, [selectedCostType]);

  // Update selected fields when cost type changes - show only Item_Number, Description, and relevant cost fields
  useEffect(() => {
    const costFields = getCostFields;
    
    // Reset to show only Item_Number, Description, and the selected cost type fields
    const updated: { [key: string]: boolean } = {
      Item_Number: true,
      Description: true,
    };
    
    // Select only the cost fields for the selected cost type
    costFields.forEach(field => {
      updated[field] = true;
    });
    
    setSelectedFields(updated);
    setSelectedFieldGroup(''); // Clear field group selection
  }, [selectedCostType, getCostFields]);

  // Apply frontend filters
  useEffect(() => {
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
        row.Price_Class_Number !== undefined && selectedPriceClasses.includes(row.Price_Class_Number)
      );
    }

    // Filter by OTP types
    if (selectedOTPTypes.length > 0) {
      filtered = filtered.filter(row => 
        row.OTP_Number !== undefined && selectedOTPTypes.includes(row.OTP_Number)
      );
    }

    // Filter by states
    if (selectedStates.length > 0) {
      filtered = filtered.filter(row => 
        row.Jurisdiction_State !== undefined && selectedStates.includes(row.Jurisdiction_State)
      );
    }

    // Filter by counties
    if (selectedCounties.length > 0) {
      filtered = filtered.filter(row => 
        row.Jurisdiction_County !== undefined && selectedCounties.includes(row.Jurisdiction_County)
      );
    }

    // Filter by cities
    if (selectedCities.length > 0) {
      filtered = filtered.filter(row => 
        row.Jurisdiction_City !== undefined && selectedCities.includes(row.Jurisdiction_City)
      );
    }

    // Filter by classes of trade
    if (selectedClassesOfTrade.length > 0) {
      filtered = filtered.filter(row => 
        row.C_ClassOfTrade !== undefined && selectedClassesOfTrade.includes(row.C_ClassOfTrade)
      );
    }

    if (selectedCustomers.length > 0) {
      filtered = filtered.filter(row => 
        selectedCustomers.includes(row.C_Number)
      );
    }

    if (selectedSalesReps.length > 0) {
      filtered = filtered.filter(row => 
        selectedSalesReps.includes(row.S_Number)
      );
    }

    if (selectedRoutes.length > 0) {
      filtered = filtered.filter(row => 
        selectedRoutes.includes(row.Route_Number)
      );
    }

    // Note: Counties, States, Cities, OTP Types, and Classes of Trade filters
    // may need adjustment based on actual API response structure
    // These filters are included but may not work until the data structure is confirmed

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
    selectedCounties,
    selectedClassesOfTrade,
  ]);

  // Get current chunk data
  const getCurrentChunkData = useMemo(() => {
    if (filteredData.length === 0) return [];
    if (filteredData.length <= CHUNK_SIZE) return filteredData;
    
    const start = currentChunk * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    return filteredData.slice(start, end);
  }, [filteredData, currentChunk]);

  const totalChunks = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return Math.ceil(filteredData.length / CHUNK_SIZE);
  }, [filteredData]);

  const handleChunkChange = (chunkIndex: number) => {
    if (chunkIndex >= 0 && chunkIndex < totalChunks) {
      setCurrentChunk(chunkIndex);
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
      return;
    }

    const group = FIELD_GROUPS[groupKey];
    if (group) {
      // Get cost fields for the selected cost type
      const costFieldsForSelectedType = getCostFields;
      
      // Define all possible cost fields (excluding Price which is separate)
      // Note: Profit and Profit_Percent are generic profit fields, not cost-specific
      const allCostFields = [
        'AvgCost', 'Ext_AvgCost', 'Ext_Total_AvgCost', 'AvgCost_Profit_Percent',
        'BaseCost', 'Ext_BaseCost', 'Ext_Total_BaseCost', 'BaseCost_Profit_Percent',
        'NetCost', 'Ext_NetCost', 'Ext_Total_NetCost', 'NetCost_Profit_Percent',
        'Invoice_Cost', 'Ext_Invoice_Cost', 'Ext_Total_Invoice_Cost', 'Invoice_Cost_Profit_Percent',
      ];
      
      // Generic profit fields (always included if in group, regardless of cost type)
      const genericProfitFields = ['Profit', 'Profit_Percent'];
      
      // Define price fields
      const priceFields = ['Price', 'EXT_Price', 'EXT_Total_Price', 'Price_Class_Price'];
      
      // Define quantity fields
      const quantityFields = ['Quantity_Ordered', 'Quantity_Shipped'];
      
      const newSelectedFields: { [key: string]: boolean } = {
        Item_Number: true,
        Description: true,
      };
      
      group.fields.forEach(field => {
        if (field !== 'Item_Number' && field !== 'Description') {
          // Generic profit fields are always included if in the group
          if (genericProfitFields.includes(field)) {
            newSelectedFields[field] = true;
          }
          // If this field is a cost field (not price), only include it if it matches the selected cost type
          else if (allCostFields.includes(field)) {
            // Only add if it's in the cost fields for the selected type
            if (costFieldsForSelectedType.includes(field)) {
              newSelectedFields[field] = true;
            }
          } else if (priceFields.includes(field)) {
            // Price fields are always included if in the group
            newSelectedFields[field] = true;
          } else if (quantityFields.includes(field)) {
            // Quantity fields are always included if in the group
            newSelectedFields[field] = true;
          } else {
            // For all other non-cost fields, add them as normal
            newSelectedFields[field] = true;
          }
        }
      });
      
      setSelectedFields(newSelectedFields);
    }
  };

  // Get ordered selected fields
  const orderedSelectedFields = useMemo(() => {
    const allSelectedKeys = Object.keys(selectedFields).filter(key => selectedFields[key]);
    const itemNumberSelected = allSelectedKeys.includes('Item_Number');
    const descriptionSelected = allSelectedKeys.includes('Description');
    const quantityOrderedSelected = allSelectedKeys.includes('Quantity_Ordered');
    const quantityShippedSelected = allSelectedKeys.includes('Quantity_Shipped');
    
    // Separate quantity fields from other fields
    const otherFields = allSelectedKeys.filter(key => 
      key !== 'Item_Number' && 
      key !== 'Description' && 
      key !== 'Quantity_Ordered' && 
      key !== 'Quantity_Shipped'
    );
    
    const ordered: string[] = [];
    if (itemNumberSelected) {
      ordered.push('Item_Number');
    }
    if (descriptionSelected) {
      ordered.push('Description');
    }
    // Always place quantity fields together, right after Description
    if (quantityOrderedSelected) {
      ordered.push('Quantity_Ordered');
    }
    if (quantityShippedSelected) {
      ordered.push('Quantity_Shipped');
    }
    // Then add all other fields
    ordered.push(...otherFields);
    
    return ordered;
  }, [selectedFields]);

  // Get available fields from data
  const availableFields = useMemo(() => {
    // Try to get first row from reportData or allChunks
    let firstRow: any = null;
    if (reportData.length > 0) {
      firstRow = reportData[0];
    } else if (allChunks.length > 0 && allChunks[0]?.length > 0) {
      firstRow = allChunks[0][0];
    }
    
    if (!firstRow || typeof firstRow !== 'object') return [];
    
    const excludedFields = [
      'Item_Number',
      'Description',
      'S_Number',
      'Promo_Number',
      'Unit_Code',
      'OrderDetail_Code',
      'OTP_Amount_State',
      'Delivered',
      'Credit_ReturnToStock',
      'OTP_Amount_County',
      'OTP_Amount_City',
      'Cig_Sticks',
      'data', // Exclude API response wrapper fields
      'pagination', // Exclude pagination field
    ];
    
    return Object.keys(firstRow).filter(key => 
      !excludedFields.includes(key) && 
      key !== 'data' && 
      key !== 'pagination' &&
      typeof firstRow[key as keyof typeof firstRow] !== 'function' // Exclude functions
    );
  }, [reportData, allChunks]);

  // Get grouped data
  type GroupedDataItem = 
    | { type: 'header'; key: string; level?: number; customerData?: Partial<VelocityReportRow> }
    | { type: 'row'; data: VelocityReportRow }
    | { type: 'row'; subtotal: { quantityShipped: number; extPrice: number } };

  const getGroupedData = useMemo((): GroupedDataItem[] => {
    const dataToGroup = getCurrentChunkData.length > 0 ? getCurrentChunkData : filteredData;
    
    if (groupBy === 'none') {
      return dataToGroup.map(row => ({ type: 'row' as const, data: row }));
    }

    const result: GroupedDataItem[] = [];

    if (groupBy === 'date') {
      const grouped: { [key: string]: VelocityReportRow[] } = {};
      dataToGroup.forEach(row => {
        const key = row.Invoice_Date || '';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(row);
      });

      Object.keys(grouped).sort().forEach(key => {
        const formattedDate = key ? (dayjs(key).isValid() ? dayjs(key).format('MM/DD/YYYY') : key) : key;
        result.push({ type: 'header', key: formattedDate, level: 1 });
        const rows = grouped[key].sort((a, b) => {
          const customerCompare = (a.C_Name || '').localeCompare(b.C_Name || '');
          if (customerCompare !== 0) return customerCompare;
          return (a.Description || '').localeCompare(b.Description || '');
        });
        rows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        const subtotal = rows.reduce((acc, row) => ({
          quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
          extPrice: acc.extPrice + (row.EXT_Price || 0),
        }), { quantityShipped: 0, extPrice: 0 });
        result.push({ type: 'row', subtotal });
      });
    } else if (groupBy === 'customer') {
      const customerGrouped: { [customerKey: string]: VelocityReportRow[] } = {};
      dataToGroup.forEach(row => {
        const customerKey = `${row.C_Number} - ${row.C_Name}`;
        if (!customerGrouped[customerKey]) {
          customerGrouped[customerKey] = [];
        }
        customerGrouped[customerKey].push(row);
      });

      Object.keys(customerGrouped).sort().forEach(customerKey => {
        // Get customer data from first row in the group
        const firstRow = customerGrouped[customerKey][0];
        const customerData: Partial<VelocityReportRow> = {
          C_Number: firstRow.C_Number,
          C_Name: firstRow.C_Name,
          Route_Number: firstRow.Route_Number,
          c_address: firstRow.c_address,
          c_city: firstRow.c_city,
          c_state: firstRow.c_state,
          c_zip: firstRow.c_zip,
          c_phone: firstRow.c_phone,
          c_Salesman: firstRow.c_Salesman,
          c_memo: firstRow.c_memo,
          C_ClassOfTrade: firstRow.C_ClassOfTrade,
        };
        result.push({ type: 'header', key: customerKey, level: 1, customerData });
        const rows = customerGrouped[customerKey].sort((a, b) => {
          const productCompare = (a.Description || '').localeCompare(b.Description || '');
          if (productCompare !== 0) return productCompare;
          return (a.Invoice_Date || '').localeCompare(b.Invoice_Date || '');
        });
        rows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        const customerSubtotal = rows.reduce((acc, row) => ({
          quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
          extPrice: acc.extPrice + (row.EXT_Price || 0),
        }), { quantityShipped: 0, extPrice: 0 });
        result.push({ type: 'row', subtotal: customerSubtotal });
      });
    } else if (groupBy === 'item') {
      const itemGrouped: { [itemKey: string]: VelocityReportRow[] } = {};
      dataToGroup.forEach(row => {
        const itemKey = `${row.Item_Number} - ${row.Description}`;
        if (!itemGrouped[itemKey]) {
          itemGrouped[itemKey] = [];
        }
        itemGrouped[itemKey].push(row);
      });

      Object.keys(itemGrouped).sort().forEach(itemKey => {
        result.push({ type: 'header', key: itemKey, level: 1 });
        const rows = itemGrouped[itemKey].sort((a, b) => {
          const customerCompare = (a.C_Name || '').localeCompare(b.C_Name || '');
          if (customerCompare !== 0) return customerCompare;
          return (a.Invoice_Date || '').localeCompare(b.Invoice_Date || '');
        });
        rows.forEach(row => {
          result.push({ type: 'row', data: row });
        });
        const itemSubtotal = rows.reduce((acc, row) => ({
          quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
          extPrice: acc.extPrice + (row.EXT_Price || 0),
        }), { quantityShipped: 0, extPrice: 0 });
        result.push({ type: 'row', subtotal: itemSubtotal });
      });
    }

    return result;
  }, [getCurrentChunkData, filteredData, groupBy]);

  // Helper to load logo as data URL
  const loadLogoAsDataUrl = async (): Promise<string | null> => {
    try {
      return new Promise<string | null>((resolve) => {
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

  const handleGenerateCSV = () => {
    setGeneratingReport(true);
    try {
      const headers = orderedSelectedFields;
      const csvHeaders = headers.map(h => FIELD_LABELS[h] || h).join(',');

      const rows: string[] = [csvHeaders];

      // Use grouped data for CSV
      const getAllGroupedDataForCSV = (): void => {
        if (groupBy === 'none') {
          return;
        }

        if (groupBy === 'date') {
          const grouped: { [key: string]: VelocityReportRow[] } = {};
          filteredData.forEach(row => {
            const key = row.Invoice_Date || '';
            if (!grouped[key]) {
              grouped[key] = [];
            }
            grouped[key].push(row);
          });

          Object.keys(grouped).sort().forEach(key => {
            const formattedDate = key ? (dayjs(key).isValid() ? dayjs(key).format('MM/DD/YYYY') : key) : key;
            rows.push(`"=== ${formattedDate} ==="`);
            grouped[key].forEach(row => {
              const rowData = headers.map(header => {
                const value = (row as any)[header];
                if (value === null || value === undefined) {
                  return '';
                }
                if (typeof value === 'number') {
                  if (header.includes('Date')) {
                    return dayjs(value).format('MM/DD/YYYY');
                  } else if (header.includes('Percent')) {
                    return `${value.toFixed(2)}%`;
                  } else {
                    return value.toString();
                  }
                } else if (typeof value === 'boolean') {
                  return value ? 'Yes' : 'No';
                } else if (header.includes('Date') && typeof value === 'string') {
                  return dayjs(value).format('MM/DD/YYYY');
                } else {
                  return String(value);
                }
              });
              rows.push(rowData.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            });
            const subtotal = grouped[key].reduce((acc, row) => ({
              quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
              extPrice: acc.extPrice + (row.EXT_Price || 0),
            }), { quantityShipped: 0, extPrice: 0 });
            rows.push(`"Subtotal - Quantity Shipped: ${subtotal.quantityShipped} | Extended Price: $${subtotal.extPrice.toFixed(2)}"`);
          });
          return;
        } else if (groupBy === 'customer') {
          const customerGrouped: { [customerKey: string]: VelocityReportRow[] } = {};
          filteredData.forEach(row => {
            const customerKey = `${row.C_Number} - ${row.C_Name}`;
            if (!customerGrouped[customerKey]) {
              customerGrouped[customerKey] = [];
            }
            customerGrouped[customerKey].push(row);
          });

          Object.keys(customerGrouped).sort().forEach(customerKey => {
            // Don't show header row - customer details already contain all info
            // Add customer details
            const firstRow = customerGrouped[customerKey][0];
            const customerDetailsParts: string[] = [];
            if (firstRow.C_Number) customerDetailsParts.push(`Customer Number: ${firstRow.C_Number}`);
            if (firstRow.C_Name) customerDetailsParts.push(`Customer Name: ${firstRow.C_Name}`);
            if (firstRow.Route_Number !== undefined && firstRow.Route_Number !== null) customerDetailsParts.push(`Route Number: ${firstRow.Route_Number}`);
            if (firstRow.c_address) customerDetailsParts.push(`Address: ${firstRow.c_address}`);
            if (firstRow.c_city) customerDetailsParts.push(`City: ${firstRow.c_city}`);
            if (firstRow.c_state) customerDetailsParts.push(`State: ${firstRow.c_state}`);
            if (firstRow.c_zip) customerDetailsParts.push(`Zip: ${firstRow.c_zip}`);
            if (firstRow.c_phone) customerDetailsParts.push(`Phone: ${firstRow.c_phone}`);
            if (firstRow.c_Salesman) customerDetailsParts.push(`Salesman: ${firstRow.c_Salesman}`);
            if (firstRow.C_ClassOfTrade) customerDetailsParts.push(`Class of Trade: ${firstRow.C_ClassOfTrade}`);
            if (firstRow.c_memo) customerDetailsParts.push(`Memo: ${firstRow.c_memo}`);
            const customerDetails = customerDetailsParts.join(' | ');
            rows.push(`"${customerDetails}"`);
            customerGrouped[customerKey].forEach(row => {
              const rowData = headers.map(header => {
                const value = (row as any)[header];
                if (value === null || value === undefined) {
                  return '';
                }
                if (typeof value === 'number') {
                  if (header.includes('Date')) {
                    return dayjs(value).format('MM/DD/YYYY');
                  } else if (header.includes('Percent')) {
                    return `${value.toFixed(2)}%`;
                  } else {
                    return value.toString();
                  }
                } else if (typeof value === 'boolean') {
                  return value ? 'Yes' : 'No';
                } else if (header.includes('Date') && typeof value === 'string') {
                  return dayjs(value).format('MM/DD/YYYY');
                } else {
                  return String(value);
                }
              });
              rows.push(rowData.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            });
            const customerSubtotal = customerGrouped[customerKey].reduce((acc, row) => ({
              quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
              extPrice: acc.extPrice + (row.EXT_Price || 0),
            }), { quantityShipped: 0, extPrice: 0 });
            rows.push(`"Subtotal - Quantity Shipped: ${customerSubtotal.quantityShipped} | Extended Price: $${customerSubtotal.extPrice.toFixed(2)}"`);
          });
          return;
        } else if (groupBy === 'item') {
          const itemGrouped: { [itemKey: string]: VelocityReportRow[] } = {};
          filteredData.forEach(row => {
            const itemKey = `${row.Item_Number} - ${row.Description}`;
            if (!itemGrouped[itemKey]) {
              itemGrouped[itemKey] = [];
            }
            itemGrouped[itemKey].push(row);
          });

          Object.keys(itemGrouped).sort().forEach(itemKey => {
            rows.push(`"=== ${itemKey} ==="`);
            itemGrouped[itemKey].forEach(row => {
              const rowData = headers.map(header => {
                const value = (row as any)[header];
                if (value === null || value === undefined) {
                  return '';
                }
                if (typeof value === 'number') {
                  if (header.includes('Date')) {
                    return dayjs(value).format('MM/DD/YYYY');
                  } else if (header.includes('Percent')) {
                    return value.toFixed(2);
                  } else {
                    return value.toString();
                  }
                } else if (typeof value === 'boolean') {
                  return value ? 'Yes' : 'No';
                } else if (header.includes('Date') && typeof value === 'string') {
                  return dayjs(value).format('MM/DD/YYYY');
                } else {
                  return String(value);
                }
              });
              rows.push(rowData.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            });
            const itemSubtotal = itemGrouped[itemKey].reduce((acc, row) => ({
              quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
              extPrice: acc.extPrice + (row.EXT_Price || 0),
            }), { quantityShipped: 0, extPrice: 0 });
            rows.push(`"Subtotal - Quantity Shipped: ${itemSubtotal.quantityShipped} | Extended Price: $${itemSubtotal.extPrice.toFixed(2)}"`);
          });
          return;
        }
      };

      getAllGroupedDataForCSV();

      // If no grouping, add rows normally
      if (groupBy === 'none') {
        filteredData.forEach(row => {
        const rowData = headers.map(header => {
          const value = (row as any)[header];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'number') {
            if (header.includes('Date')) {
              return dayjs(value).format('MM/DD/YYYY');
            } else if (header.includes('Percent')) {
              return `${value.toFixed(2)}%`;
            } else {
              return value.toString();
            }
          } else if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
          } else if (header.includes('Date') && typeof value === 'string') {
            return dayjs(value).format('MM/DD/YYYY');
          } else {
            return String(value);
          }
        });
        rows.push(rowData.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        });
      }

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `velocity-report-${dayjs().format('YYYY-MM-DD')}.csv`);
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

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      
      const pdfFieldKeys = orderedSelectedFields;
      const totalColumns = pdfFieldKeys.length;
      const orientation = totalColumns <= 8 ? 'portrait' : 'landscape';
      
      const doc = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let yPosition = 10;

      // Get distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';

      // Draw header with distributor details on left
      let leftY = yPosition;
      
      if (distributorName) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(distributorName, margin, leftY);
        leftY += 3.5;
      }
      
      if (distributorAddress) {
        doc.setFont('helvetica', 'normal');
        doc.text(distributorAddress, margin, leftY);
        leftY += 3.5;
      }
      
      if (distributorPhone) {
        doc.text(distributorPhone, margin, leftY);
      }

      // Title - centered
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Velocity Report - Customer', pageWidth / 2, yPosition + 5, { align: 'center' });

      // Date and other info on right
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const date = dayjs().format('MM/DD/YYYY');
      let rightY = yPosition;
      doc.text(`Generated on: ${date}`, pageWidth - margin, rightY, { align: 'right' });
      rightY += 3.5;

      // Date range on right
      if (fromDate && toDate) {
        doc.setFontSize(7);
        doc.text(`Date Range: ${fromDate.format('MM/DD/YYYY')} to ${toDate.format('MM/DD/YYYY')}`, pageWidth - margin, rightY, { align: 'right' });
        rightY += 3.5;
      }

      // Cost type on right
      doc.text(`Cost Type: ${selectedCostType === 'Price' ? 'Price' : selectedCostType === 'AvgCost' ? 'Avg Cost' : selectedCostType === 'BaseCost' ? 'Base Cost' : selectedCostType === 'NetCost' ? 'Net Cost' : 'Invoice Cost'}`, pageWidth - margin, rightY, { align: 'right' });
      
      yPosition = Math.max(leftY, rightY) + 8;

      // Table headers
      const headers = pdfFieldKeys.map(key => FIELD_LABELS[key] || key);
      
      // Calculate column widths - auto-fit to page width
      const availableWidth = pageWidth - (margin * 2);
      
      // Define minimum and preferred widths for specific fields
      const fieldWidths: { [key: string]: { min: number; preferred: number } } = {
        'Item_Number': { min: 20, preferred: 25 },
        'Description': { min: 30, preferred: 50 },
        'Invoice_Date': { min: 20, preferred: 25 },
        'Document_Number': { min: 20, preferred: 25 },
        'C_Number': { min: 20, preferred: 25 },
        'C_Name': { min: 30, preferred: 40 },
      };
      
      // Calculate widths for each column
      const colWidths: number[] = [];
      let totalPreferredWidth = 0;
      const preferredWidths: number[] = [];
      
      pdfFieldKeys.forEach(field => {
        const fieldConfig = fieldWidths[field];
        if (fieldConfig) {
          preferredWidths.push(fieldConfig.preferred);
          totalPreferredWidth += fieldConfig.preferred;
        } else {
          // Default width for other fields
          const defaultWidth = orientation === 'portrait' ? 25 : 30;
          preferredWidths.push(defaultWidth);
          totalPreferredWidth += defaultWidth;
        }
      });
      
      // If total preferred width exceeds available width, scale down proportionally
      if (totalPreferredWidth > availableWidth) {
        const scaleFactor = availableWidth / totalPreferredWidth;
        pdfFieldKeys.forEach((field, index) => {
          const fieldConfig = fieldWidths[field];
          const scaledWidth = preferredWidths[index] * scaleFactor;
          // Ensure minimum width is respected
          const minWidth = fieldConfig?.min || 15;
          colWidths.push(Math.max(scaledWidth, minWidth));
        });
      } else {
        // If total preferred width is less than available, distribute remaining space
        const remainingWidth = availableWidth - totalPreferredWidth;
        const extraPerColumn = remainingWidth / totalColumns;
        pdfFieldKeys.forEach((field, index) => {
          colWidths.push(preferredWidths[index] + extraPerColumn);
        });
      }
      
      // Ensure total doesn't exceed available width (safety check)
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
      if (totalWidth > availableWidth) {
        const finalScaleFactor = availableWidth / totalWidth;
        colWidths.forEach((width, index) => {
          colWidths[index] = width * finalScaleFactor;
        });
      }

      // Table data - use grouped data for all filtered data
      const getAllGroupedDataForPDF = (): GroupedDataItem[] => {
        if (groupBy === 'none') {
          return filteredData.map(row => ({ type: 'row' as const, data: row }));
        }

        const result: GroupedDataItem[] = [];

        if (groupBy === 'date') {
          const grouped: { [key: string]: VelocityReportRow[] } = {};
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
            grouped[key].forEach(row => {
              result.push({ type: 'row', data: row });
            });
            const subtotal = grouped[key].reduce((acc, row) => ({
              quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
              extPrice: acc.extPrice + (row.EXT_Price || 0),
            }), { quantityShipped: 0, extPrice: 0 });
            result.push({ type: 'row', subtotal });
          });
        } else if (groupBy === 'customer') {
          const customerGrouped: { [customerKey: string]: VelocityReportRow[] } = {};
          filteredData.forEach(row => {
            const customerKey = `${row.C_Number} - ${row.C_Name}`;
            if (!customerGrouped[customerKey]) {
              customerGrouped[customerKey] = [];
            }
            customerGrouped[customerKey].push(row);
          });

          Object.keys(customerGrouped).sort().forEach(customerKey => {
            // Get customer data from first row in the group
            const firstRow = customerGrouped[customerKey][0];
            const customerData: Partial<VelocityReportRow> = {
              C_Number: firstRow.C_Number,
              C_Name: firstRow.C_Name,
              Route_Number: firstRow.Route_Number,
              c_address: firstRow.c_address,
              c_city: firstRow.c_city,
              c_state: firstRow.c_state,
              c_zip: firstRow.c_zip,
              c_phone: firstRow.c_phone,
              c_Salesman: firstRow.c_Salesman,
              c_memo: firstRow.c_memo,
              C_ClassOfTrade: firstRow.C_ClassOfTrade,
            };
            result.push({ type: 'header', key: customerKey, level: 1, customerData });
            customerGrouped[customerKey].forEach(row => {
              result.push({ type: 'row', data: row });
            });
            const customerSubtotal = customerGrouped[customerKey].reduce((acc, row) => ({
              quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
              extPrice: acc.extPrice + (row.EXT_Price || 0),
            }), { quantityShipped: 0, extPrice: 0 });
            result.push({ type: 'row', subtotal: customerSubtotal });
          });
        } else if (groupBy === 'item') {
          const itemGrouped: { [itemKey: string]: VelocityReportRow[] } = {};
          filteredData.forEach(row => {
            const itemKey = `${row.Item_Number} - ${row.Description}`;
            if (!itemGrouped[itemKey]) {
              itemGrouped[itemKey] = [];
            }
            itemGrouped[itemKey].push(row);
          });

          Object.keys(itemGrouped).sort().forEach(itemKey => {
            result.push({ type: 'header', key: itemKey, level: 1 });
            itemGrouped[itemKey].forEach(row => {
              result.push({ type: 'row', data: row });
            });
            const itemSubtotal = itemGrouped[itemKey].reduce((acc, row) => ({
              quantityShipped: acc.quantityShipped + (row.Quantity_Shipped || 0),
              extPrice: acc.extPrice + (row.EXT_Price || 0),
            }), { quantityShipped: 0, extPrice: 0 });
            result.push({ type: 'row', subtotal: itemSubtotal });
          });
        }

        return result;
      };

      const tableData: any[][] = [];

      getAllGroupedDataForPDF().forEach(item => {
        if (item.type === 'header' && item.key) {
          // If grouping by customer, show customer details
          if (groupBy === 'customer' && item.customerData) {
            const cd = item.customerData;
            const customerDetailsParts: string[] = [];
            
            if (cd.C_Number) customerDetailsParts.push(`Customer Number: ${cd.C_Number}`);
            if (cd.C_Name) customerDetailsParts.push(`Customer Name: ${cd.C_Name}`);
            if (cd.Route_Number !== undefined && cd.Route_Number !== null) customerDetailsParts.push(`Route Number: ${cd.Route_Number}`);
            
            // Combine all address details into one line
            const addressParts: string[] = [];
            if (cd.c_address) addressParts.push(cd.c_address);
            if (cd.c_city) addressParts.push(cd.c_city);
            if (cd.c_state) addressParts.push(cd.c_state);
            if (cd.c_zip) addressParts.push(cd.c_zip);
            if (addressParts.length > 0) {
              customerDetailsParts.push(`Address: ${addressParts.join(', ')}`);
            }
            
            if (cd.c_phone) customerDetailsParts.push(`Phone: ${cd.c_phone}`);
            
            // Format line by line (one detail per line)
            const customerDetails = customerDetailsParts.join('\n');
            
            // Don't show header row - customer details already contain all info
            tableData.push([{ 
              content: customerDetails, 
              colSpan: headers.length, 
              styles: { 
                fontStyle: 'normal', 
                fillColor: [240, 240, 240],
                fontSize: 8,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
              } 
            }]);
          } else {
            tableData.push([{ 
              content: `=== ${item.key} ===`, 
              colSpan: headers.length, 
              styles: { 
                fontStyle: 'bold', 
                fillColor: [200, 200, 200],
              } 
            }]);
          }
        } else if (item.type === 'row' && 'data' in item) {
          const row = item.data;
        const rowData: any[] = [];
        
        pdfFieldKeys.forEach(field => {
          const value = (row as any)[field];
          let displayValue = '';
          if (value !== null && value !== undefined) {
            if (typeof value === 'number') {
              if (field.includes('Date')) {
                displayValue = dayjs(value).format('MM/DD/YYYY');
              } else if (
                field.includes('Price') || 
                field.includes('Cost') || 
                field.includes('Profit') ||
                field.includes('Amount')
              ) {
                displayValue = value.toFixed(2);
              } else if (field.includes('Percent')) {
                displayValue = `${value.toFixed(2)}%`;
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
            content: `Subtotal - Quantity Shipped: ${item.subtotal.quantityShipped} | Extended Price: $${item.subtotal.extPrice.toFixed(2)}`, 
            colSpan: headers.length, 
            styles: { fontStyle: 'bold' } 
          }]);
        }
      });

      // Generate table - ensure table width matches sum of column widths
      const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      
      autoTableFn(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        tableWidth: totalTableWidth,
        styles: { 
          fontSize: 7,
          overflow: 'linebreak',
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [25, 118, 210], 
          textColor: 255, 
          fontStyle: 'bold',
          overflow: 'linebreak',
        },
        columnStyles: colWidths.reduce((acc, width, index) => {
          acc[index] = { 
            cellWidth: width,
            overflow: 'linebreak',
          };
          return acc;
        }, {} as { [key: number]: { cellWidth: number; overflow: string } }),
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const currentPageHeight = doc.internal.pageSize.getHeight();
        const footerY = currentPageHeight - 5;
        
        // Add "Report Generated by Woopsa" with logo
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const footerText = 'Report Generated by Woopsa';
        doc.text(footerText, margin, footerY);
        
        // Add logo beside text
        if (logoDataUrl) {
          try {
            const textWidth = doc.getTextWidth(footerText);
            doc.addImage(logoDataUrl, 'PNG', margin + textWidth + 1, footerY - 2.5, 3, 3);
          } catch {
            try {
              const textWidth = doc.getTextWidth(footerText);
              doc.addImage(logoDataUrl, 'SVG', margin + textWidth + 1, footerY - 2.5, 3, 3);
            } catch {
              // Ignore logo errors
            }
          }
        }
        
        // Add page number
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const pageText = `${i} of ${pageCount}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
      }

      doc.save(`velocity-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
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
            Velocity Report Configuration
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
              {/* Left Side - Filters, Date, Cost Selection */}
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

                {/* Cost Select */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Cost Select
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedCostType}
                      onChange={(e) => setSelectedCostType(e.target.value as CostType)}
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
                      <MenuItem value="Price" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Price</MenuItem>
                      <MenuItem value="AvgCost" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Avg Cost</MenuItem>
                      <MenuItem value="BaseCost" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Base Cost</MenuItem>
                      <MenuItem value="NetCost" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Net Cost</MenuItem>
                      <MenuItem value="Invoice_Cost" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Invoice Cost</MenuItem>
                    </Select>
                  </FormControl>
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
                          checked={groupBy === 'none'}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>None</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => setGroupBy('none')}
                    />
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

                {/* Filters - Similar to LossQtyReportTab */}
                {/* Sales Category Filter */}
                {filterOptions.salesCategories && filterOptions.salesCategories.length > 0 && (
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
                        disabled={loadingFilters}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected.length === 0) {
                            return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Sales Categories</Typography>;
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
                  </Box>
                )}

                {filterOptions.priceClasses && filterOptions.priceClasses.length > 0 && (
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
                  </Box>
                )}

                {filterOptions.customers && filterOptions.customers.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* Sales Reps Filter */}
                {filterOptions.salesReps && filterOptions.salesReps.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* Routes Filter */}
                {filterOptions.routes && filterOptions.routes.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* States Filter */}
                {filterOptions.states && filterOptions.states.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* Counties Filter */}
                {filterOptions.counties && filterOptions.counties.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* Cities Filter */}
                {filterOptions.cities && filterOptions.cities.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* OTP Types Filter */}
                {filterOptions.otpTypes && filterOptions.otpTypes.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}

                {/* Classes of Trade Filter */}
                {filterOptions.classesOfTrade && filterOptions.classesOfTrade.length > 0 && (
                  <Box sx={{ mb: 1.25 }}>
                    <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Box>
                )}
              </Grid>

              {/* Right Column - Field Selection */}
              <Grid size={{ xs: 12, md: 9 }}>
                {/* Field Group Dropdown */}
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Field Group
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ pl: 0.5 }}>
                    <Select
                      value={selectedFieldGroup}
                      onChange={(e) => handleFieldGroupChange(e.target.value)}
                      disabled={loading}
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
                          {group.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ mt: 0.4, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                    Selecting a group will auto-select all fields in that group. You can still edit individual fields.
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Fields
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
                            sx={{
                              flexShrink: 0,
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
                    {orderedSelectedFields.map(field => (
                      <TableCell key={field}>{FIELD_LABELS[field] || field}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getGroupedData.map((item, idx) => {
                    const selectedFieldsCount = orderedSelectedFields.length;
                    const totalCols = selectedFieldsCount;
                    
                    if (item.type === 'header') {
                      const isLevel2 = item.level === 2;
                      
                      // For customer grouping, show only customer details (no header row)
                      if (groupBy === 'customer' && item.customerData) {
                        const customerData = item.customerData;
                        return (
                          <React.Fragment key={`header-${idx}`}>
                            {/* Customer Details Row */}
                            <TableRow>
                              <TableCell
                                colSpan={totalCols}
                                sx={{ 
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.02)' 
                                    : 'rgba(0,0,0,0.01)',
                                  py: 0.75,
                                  px: 1,
                                  fontSize: '0.75rem',
                                  lineHeight: 1.6,
                                  borderTop: idx > 0 ? `2px solid ${theme.palette.divider}` : 'none',
                                }}
                              >
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                  {customerData.C_Number && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Customer Number:
                                      </Typography>{' '}
                                      <Typography component="span" sx={{ fontWeight: 500 }}>
                                        {customerData.C_Number}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.C_Name && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Customer Name:
                                      </Typography>{' '}
                                      <Typography component="span" sx={{ fontWeight: 500 }}>
                                        {customerData.C_Name}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.Route_Number !== undefined && customerData.Route_Number !== null && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Route Number:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.Route_Number}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_address && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Address:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.c_address}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_city && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        City:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.c_city}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_state && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        State:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.c_state}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_zip && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Zip:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.c_zip}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_phone && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Phone:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.c_phone}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_Salesman && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Salesman:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.c_Salesman}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.C_ClassOfTrade && (
                                    <Box>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Class of Trade:
                                      </Typography>{' '}
                                      <Typography component="span">
                                        {customerData.C_ClassOfTrade}
                                      </Typography>
                                    </Box>
                                  )}
                                  {customerData.c_memo && (
                                    <Box sx={{ width: '100%', mt: 0.5 }}>
                                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Memo:
                                      </Typography>{' '}
                                      <Typography component="span" sx={{ whiteSpace: 'pre-line' }}>
                                        {customerData.c_memo}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      }
                      
                      // Default header display for other grouping types
                      return (
                        <TableRow key={`header-${idx}`}>
                          <TableCell
                            colSpan={totalCols}
                            sx={{ 
                              fontWeight: isLevel2 ? 500 : 600, 
                              backgroundColor: isLevel2 
                                ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                                : theme.palette.action.hover,
                              pl: isLevel2 ? 4 : 1,
                              fontSize: isLevel2 ? '0.75rem' : '0.813rem',
                            }}
                          >
                            {isLevel2 ? '  └─ ' : '=== '}{item.key}{isLevel2 ? '' : ' ==='}
                          </TableCell>
                        </TableRow>
                      );
                    } else if (item.type === 'row' && 'data' in item) {
                      const row = item.data;
                      return (
                        <TableRow key={`row-${idx}`}>
                          {orderedSelectedFields.map(field => {
                            const value = (row as any)[field];
                            let displayValue = value;
                            if (value === null || value === undefined) {
                              displayValue = '';
                            } else if (typeof value === 'number') {
                              if (field.includes('Date')) {
                                displayValue = dayjs(value).format('MM/DD/YYYY');
                              } else if (
                                field.includes('Price') || 
                                field.includes('Cost') || 
                                field.includes('Profit') ||
                                field.includes('Amount')
                              ) {
                                displayValue = `$${value.toFixed(2)}`;
                              } else if (field.includes('Percent')) {
                                displayValue = `${value.toFixed(2)}%`;
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
                              <TableCell key={field}>{displayValue}</TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    } else if (item.type === 'row' && 'subtotal' in item) {
                      return (
                        <TableRow key={`subtotal-${idx}`}>
                          <TableCell
                            colSpan={totalCols}
                            sx={{ 
                              fontWeight: 600,
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(0,0,0,0.03)',
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.813rem' }}>
                                Subtotal:
                              </Typography>
                              <Typography component="span" sx={{ fontSize: '0.813rem' }}>
                                Quantity Shipped: <strong>{item.subtotal.quantityShipped}</strong>
                              </Typography>
                              <Typography component="span" sx={{ fontSize: '0.813rem' }}>
                                | Extended Price: <strong>${item.subtotal.extPrice.toFixed(2)}</strong>
                              </Typography>
                            </Box>
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

      {/* Action Buttons at Bottom */}
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
              onClick={() => setShowPreview(true)}
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

export default VelocityReportTab;
