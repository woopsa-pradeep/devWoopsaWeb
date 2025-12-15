import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Pagination,
  Switch,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  Radio,
  FormControlLabel,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
import { customerForReport } from '../../../redux/apis/distrubutor/reportsApis';
import { getSalesRepList, getListOfRoutes } from '../../../redux/apis/distrubutor/listApis';
import { listOfCustomersCreate } from '../../../redux/apis/distrubutor/retailerApis';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

interface SalesRep {
  S_Number: number;
  S_Desc: string;
}

interface Route {
  Route_Number: number;
  Route_Desc?: string;
}

interface Terms {
  TermsCode: number;
  Terms: string;
}

interface ClassOfTrade {
  Trade_Code: string;
  Trade_Desc: string;
}

interface TaxRate {
  Jurisdiction_State?: number;
  Jurisdiction_City?: number;
  Jurisdiction_County?: number;
  TaxDescription?: string;
}

interface Customer {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_Country: string;
  Jurisdiction_State?: number; // Legacy support
  Jurisdiction_City?: number; // Legacy support
  Jurisdiction_County?: number; // Legacy support
  taxRate?: TaxRate;
  taxRateCity?: TaxRate;
  taxRateCounty?: TaxRate;
  C_Phone: string;
  C_Email: string;
  C_Fax: string;
  C_SalesTaxNumber: string;
  C_CigtLicenseNumber: string;
  C_Memo: string;
  C_PricingAccount: number;
  Credit_Limit: number;
  ExpDate_SalesTax: string;
  ExpDate_CigtTax: string;
  C_Inactive: boolean;
  Delivery_Amount: number;
  C_OtherLicenseNumber: string;
  ExpDate_OtherTax: string;
  C_OrderDay: number;
  C_RetailRounding: string;
  C_FEIN: string;
  C_OperationHours1: number;
  C_OperationHours2: number;
  C_PhoneMobile: string;
  Delivery_ID: number;
  C_OrderDaySequence: number;
  LastBalance: number;
  LastInvoiceNumber: number;
  LastInvoiceAmount: number;
  LastInvoiceDate?: string;
  LastPaymentDate: string;
  LastPaymentAmount: number;
  C_OtherLicenseNumber2: string;
  ExpDate_OtherTax2: string;
  C_OtherLicenseNumber3: string;
  ExpDate_OtherTax3: string;
  salesRep?: SalesRep;
  terms?: Terms;
  classOfTrade?: ClassOfTrade;
  Routes?: Array<{
    Route_Number: number;
    Stop_Number: number;
  }>;
}

// Fields to exclude from checkboxes (C_Number and C_Name are always included)
const EXCLUDED_FIELDS = ['C_Number', 'C_Name', 'salesRep', 'terms', 'classOfTrade', 'SalesRep_Number', 'TermsCode', 'Trade_Code', 'C_RetailRounding', 'C_Memo'];

// Field display sequence (order matters)
const FIELD_SEQUENCE: string[] = [
  'C_Number',
  'C_Name',
  'C_CoName',
  'C_Address',
  'C_City',
  'C_State',
  'C_Zip',
  'C_Country',
  'C_Phone',
  'C_Email',
  'C_Fax',
  'C_PhoneMobile',
  'C_SalesTaxNumber',
  'C_CigtLicenseNumber',
  'C_OtherLicenseNumber',
  'C_OtherLicenseNumber2',
  'C_OtherLicenseNumber3',
  'C_FEIN',
  'C_PricingAccount',
  'Credit_Limit',
  'LastBalance',
  'LastInvoiceNumber',
  'LastInvoiceAmount',
  'LastInvoiceDate',
  'LastPaymentDate',
  'LastPaymentAmount',
  'Delivery_Amount',
  'Delivery_ID',
  'C_OrderDay',
  'C_OrderDaySequence',
  'C_OperationHours1',
  'C_OperationHours2',
  'Jurisdiction_State',
  'Jurisdiction_City',
  'Jurisdiction_County',
  'ExpDate_SalesTax',
  'ExpDate_CigtTax',
  'ExpDate_OtherTax',
  'ExpDate_OtherTax2',
  'ExpDate_OtherTax3',
  'SalesRep_Desc',
  'Terms',
  'Trade_Desc',
];

// Helper function to sort fields by sequence
const sortFieldsBySequence = (fields: string[]): string[] => {
  return [...fields].sort((a, b) => {
    const indexA = FIELD_SEQUENCE.indexOf(a);
    const indexB = FIELD_SEQUENCE.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

// Field labels mapping
const FIELD_LABELS: { [key: string]: string } = {
  C_Number: 'Customer Number',
  C_Name: 'Customer Name',
  C_CoName: 'C/O Name',
  C_Address: 'Address',
  C_City: 'City',
  C_State: 'State',
  C_Zip: 'Zip',
  C_Country: 'Country',
  C_Phone: 'Phone',
  C_Email: 'Email',
  C_Fax: 'Fax',
  C_PhoneMobile: 'Mobile Phone',
  C_SalesTaxNumber: 'Sales Tax Number',
  C_CigtLicenseNumber: 'Cigarette License Number',
  C_OtherLicenseNumber: 'Other License Number',
  C_OtherLicenseNumber2: 'Other License Number 2',
  C_OtherLicenseNumber3: 'Other License Number 3',
  C_FEIN: 'FEIN',
  C_PricingAccount: 'Pricing Account',
  Credit_Limit: 'Credit Limit',
  LastBalance: 'Last Balance',
  LastInvoiceNumber: 'Last Invoice Number',
  LastInvoiceAmount: 'Last Invoice Amount',
  LastInvoiceDate: 'Last Invoice Date',
  LastPaymentDate: 'Last Payment Date',
  LastPaymentAmount: 'Last Payment Amount',
  Delivery_Amount: 'Delivery Amount',
  Delivery_ID: 'Delivery ID',
  C_OrderDay: 'Order Day',
  C_OrderDaySequence: 'Order Day Sequence',
  C_OperationHours1: 'Opening Hours',
  C_OperationHours2: 'Closing Hours',
  Jurisdiction_State: 'Jurisdiction State',
  Jurisdiction_City: 'Jurisdiction City',
  Jurisdiction_County: 'Jurisdiction County',
  ExpDate_SalesTax: 'Sales Tax Exp Date',
  ExpDate_CigtTax: 'Cigarette Tax Exp Date',
  ExpDate_OtherTax: 'Other Tax Exp Date',
  ExpDate_OtherTax2: 'Other Tax Exp Date 2',
  ExpDate_OtherTax3: 'Other Tax Exp Date 3',
  SalesRep_Desc: 'Sales Rep',
  Terms: 'Terms',
  Trade_Desc: 'Class of Trade',
};

const CustomerReportTab: React.FC = () => {
  const theme = useTheme();

  // Active/Inactive filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Sales Rep and Route filters
  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [salesRepOptions, setSalesRepOptions] = useState<SalesRep[]>([]);
  const [routeOptions, setRouteOptions] = useState<Route[]>([]);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // New filters: Class of Trade, Jurisdiction State, County, City
  const [selectedClassOfTrade, setSelectedClassOfTrade] = useState<string[]>([]);
  const [selectedJurisdictionState, setSelectedJurisdictionState] = useState<string[]>([]);
  const [selectedJurisdictionCounty, setSelectedJurisdictionCounty] = useState<string[]>([]);
  const [selectedJurisdictionCity, setSelectedJurisdictionCity] = useState<string[]>([]);
  const [classOfTradeOptions, setClassOfTradeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [jurisdictionStateOptions, setJurisdictionStateOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [jurisdictionCountyOptions, setJurisdictionCountyOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [jurisdictionCityOptions, setJurisdictionCityOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Toggle states for report fields
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({});

  // Report generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Customer[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0, stage: '' });
  const [sortOption, setSortOption] = useState<'name' | 'number'>('name');
  const [originalFilteredData, setOriginalFilteredData] = useState<Customer[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 100;
  const [fullFilteredData, setFullFilteredData] = useState<Customer[]>([]);

  // Group By option (only one at a time)
  const [groupBy, setGroupBy] = useState<'route' | 'salesRep' | 'state' | 'city' | ''>('');

  // Fetch filter options on mount
  useEffect(() => {
    fetchSalesReps();
    fetchRoutes();
    fetchDropdownData();
  }, []);

  const fetchSalesReps = async () => {
    setLoadingSalesReps(true);
    try {
      const response = await getSalesRepList() as any;
      const salesReps = response?.data?.data || response?.data || [];
      setSalesRepOptions(salesReps);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      toast.error('Failed to load sales reps');
    } finally {
      setLoadingSalesReps(false);
    }
  };

  const fetchRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const response = await getListOfRoutes() as any;
      const responseData = response?.data?.data || response?.data || {};
      
      // Handle the new API structure with routesWithStop and routesWithoutStop
      let routes: Route[] = [];
      
      if (responseData.routesWithoutStop && Array.isArray(responseData.routesWithoutStop)) {
        // Add routes without stop numbers
        routes = responseData.routesWithoutStop.map((route: { Route_Number: number }) => ({
          Route_Number: route.Route_Number,
          Route_Desc: `Route ${route.Route_Number}`,
        }));
      } else if (Array.isArray(responseData)) {
        // Fallback: if responseData is directly an array
        routes = responseData.map((route: any) => ({
          Route_Number: route.Route_Number || route.route_Number || 0,
          Route_Desc: route.Route_Desc || route.route_Desc || `Route ${route.Route_Number || route.route_Number || ''}`,
        })).filter((route: Route) => route.Route_Number > 0);
      }
      
      // If routesWithStop exists, we could also include those, but for filtering we mainly need Route_Number
      // The routesWithStop array has Stop_Number which is different from Route_Number
      
      setRouteOptions(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
      setRouteOptions([]); // Set empty array on error to prevent map errors
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      const response = await listOfCustomersCreate() as any;
      const data = response?.data || {};
      
      // Set Class of Trade options
      if (data.classOfTrade) {
        setClassOfTradeOptions(data.classOfTrade.map((item: any) => ({
          label: item.Trade_Desc || '',
          value: item.Trade_Code || '',
        })));
      }
      
      // Set Jurisdiction State options (from taxRate)
      if (data.taxRate) {
        setJurisdictionStateOptions(data.taxRate.map((item: any) => ({
          label: item.TaxDescription || '',
          value: String(item.Jurisdiction_State ?? 0),
        })));
      }
      
      // Set Jurisdiction County options (from taxRateCounty)
      if (data.taxRateCounty) {
        setJurisdictionCountyOptions(data.taxRateCounty.map((item: any) => ({
          label: item.TaxDescription || '',
          value: String(item.Jurisdiction_County ?? 0),
        })));
      }
      
      // Set Jurisdiction City options (from taxRateCity)
      if (data.taxRateCity) {
        setJurisdictionCityOptions(data.taxRateCity.map((item: any) => ({
          label: item.TaxDescription || '',
          value: String(item.Jurisdiction_City ?? 0),
        })));
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  // Helper function to get nested object value
  const getNestedValue = (customer: Customer, field: string): string => {
    if (field === 'SalesRep_Number') {
      return customer.salesRep?.S_Number?.toString() || '';
    }
    if (field === 'SalesRep_Desc') {
      return customer.salesRep?.S_Desc || '';
    }
    if (field === 'TermsCode') {
      return customer.terms?.TermsCode?.toString() || '';
    }
    if (field === 'Terms') {
      return customer.terms?.Terms || '';
    }
    if (field === 'Trade_Code') {
      return customer.classOfTrade?.Trade_Code || '';
    }
    if (field === 'Trade_Desc') {
      return customer.classOfTrade?.Trade_Desc || '';
    }
    // Handle new nested jurisdiction fields
    if (field === 'Jurisdiction_State') {
      // Try new nested structure first, then fallback to legacy
      if (customer.taxRate?.Jurisdiction_State !== undefined) {
        return customer.taxRate.Jurisdiction_State.toString();
      }
      return customer.Jurisdiction_State?.toString() || '';
    }
    if (field === 'Jurisdiction_City') {
      // Try new nested structure first, then fallback to legacy
      if (customer.taxRateCity?.Jurisdiction_City !== undefined) {
        return customer.taxRateCity.Jurisdiction_City.toString();
      }
      return customer.Jurisdiction_City?.toString() || '';
    }
    if (field === 'Jurisdiction_County') {
      // Try new nested structure first, then fallback to legacy
      if (customer.taxRateCounty?.Jurisdiction_County !== undefined) {
        return customer.taxRateCounty.Jurisdiction_County.toString();
      }
      return customer.Jurisdiction_County?.toString() || '';
    }
    const value = (customer as any)[field];
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Handle date fields - format ISO date strings to readable format
    const dateFields = ['ExpDate_SalesTax', 'ExpDate_CigtTax', 'ExpDate_OtherTax', 'ExpDate_OtherTax2', 'ExpDate_OtherTax3', 'LastPaymentDate', 'LastInvoiceDate'];
    if (dateFields.includes(field) && typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        }
      } catch {
        // If date parsing fails, return as is
      }
    }
    
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return value.toString();
  };

  // Sorting functions
  const sortByName = (customers: Customer[]): Customer[] => {
    return [...customers].sort((a, b) => {
      const nameA = (a.C_Name || '').trim().toLowerCase();
      const nameB = (b.C_Name || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const sortByNumber = (customers: Customer[]): Customer[] => {
    return [...customers].sort((a, b) => {
      const numA = a.C_Number || 0;
      const numB = b.C_Number || 0;
      return numA - numB;
    });
  };

  const applySorting = useCallback((customers: Customer[]): Customer[] => {
    if (sortOption === 'number') {
      return sortByNumber(customers);
    }
    return sortByName(customers);
  }, [sortOption]);

  // Helper to get grouped data for preview/display
  interface GroupedRow {
    type: 'header' | 'customer' | 'spacer';
    route?: number;
    salesRep?: { number: number; desc: string };
    state?: string;
    city?: string;
    customer?: Customer;
  }

  const getGroupedDataForDisplay = (customers: Customer[]): GroupedRow[] => {
    const result: GroupedRow[] = [];

    // If State grouping is selected
    if (groupBy === 'state') {
      const validCustomers = customers.filter(c => c.C_State && c.C_State.trim() !== '');
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const state = customer.C_State.trim();
        if (!acc[state]) {
          acc[state] = [];
        }
        acc[state].push(customer);
        return acc;
      }, {} as { [key: string]: Customer[] });

      const sortedStates = Object.keys(grouped).sort();

      sortedStates.forEach(state => {
        result.push({ type: 'header', state });
        grouped[state].forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        result.push({ type: 'spacer' });
      });

      const customersWithoutState = customers.filter(c => !c.C_State || c.C_State.trim() === '');
      if (customersWithoutState.length > 0) {
        result.push({ type: 'header', state: 'No State' });
        customersWithoutState.forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        result.push({ type: 'spacer' });
      }
    }
    // If City grouping is selected
    else if (groupBy === 'city') {
      const validCustomers = customers.filter(c => c.C_City && c.C_City.trim() !== '');
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const city = customer.C_City.trim();
        if (!acc[city]) {
          acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
      }, {} as { [key: string]: Customer[] });

      const sortedCities = Object.keys(grouped).sort();

      sortedCities.forEach(city => {
        result.push({ type: 'header', city });
        grouped[city].forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        result.push({ type: 'spacer' });
      });

      const customersWithoutCity = customers.filter(c => !c.C_City || c.C_City.trim() === '');
      if (customersWithoutCity.length > 0) {
        result.push({ type: 'header', city: 'No City' });
        customersWithoutCity.forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        result.push({ type: 'spacer' });
      }
    }
    // If Route grouping is selected
    else if (groupBy === 'route') {
      const validCustomers = customers.filter(c => 
        c.Routes && Array.isArray(c.Routes) && c.Routes.length > 0
      );
      
      // Group by Route_Number
      const grouped = validCustomers.reduce((acc, customer) => {
        if (customer.Routes && Array.isArray(customer.Routes)) {
          customer.Routes.forEach(route => {
            const routeNum = route.Route_Number;
            if (!acc[routeNum]) {
              acc[routeNum] = [];
            }
            // Only add customer once per route (avoid duplicates if customer has multiple routes)
            if (!acc[routeNum].find(c => c.C_Number === customer.C_Number)) {
              acc[routeNum].push(customer);
            }
          });
        }
        return acc;
      }, {} as { [key: number]: Customer[] });

      const sortedRoutes = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      sortedRoutes.forEach(routeNum => {
        // Add route header
        result.push({ type: 'header', route: routeNum });
        // Add customers for this route
        grouped[routeNum].forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });

      // Add customers without routes at the end
      const customersWithoutRoutes = customers.filter(c => 
        !c.Routes || !Array.isArray(c.Routes) || c.Routes.length === 0
      );
      if (customersWithoutRoutes.length > 0) {
        result.push({ type: 'header', route: -1 }); // -1 indicates "No Route"
        customersWithoutRoutes.forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        result.push({ type: 'spacer' });
      }
    }
    // If Sales Rep grouping is selected
    else if (groupBy === 'salesRep') {
      const validCustomers = customers.filter(c => c.salesRep?.S_Number);
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const salesRepNum = customer.salesRep?.S_Number;
        if (salesRepNum !== undefined) {
          if (!acc[salesRepNum]) {
            acc[salesRepNum] = [];
          }
          acc[salesRepNum].push(customer);
        }
        return acc;
      }, {} as { [key: number]: Customer[] });

      const sortedSalesReps = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      sortedSalesReps.forEach(salesRepNum => {
        const salesRep = salesRepOptions.find(sr => sr.S_Number === salesRepNum);
        // Add sales rep header
        result.push({ 
          type: 'header', 
          salesRep: { 
            number: salesRepNum, 
            desc: salesRep?.S_Desc || `Sales Rep ${salesRepNum}` 
          } 
        });
        // Add customers for this sales rep
        grouped[salesRepNum].forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        // Add spacer
        result.push({ type: 'spacer' });
      });

      // Add customers without sales rep at the end
      const customersWithoutSalesRep = customers.filter(c => !c.salesRep?.S_Number);
      if (customersWithoutSalesRep.length > 0) {
        result.push({ 
          type: 'header', 
          salesRep: { number: -1, desc: 'No Sales Rep' } 
        });
        customersWithoutSalesRep.forEach(customer => {
          result.push({ type: 'customer', customer });
        });
        result.push({ type: 'spacer' });
      }
    }
    // No grouping selected - flat list
    // Regular flat report (no grouping)
    else {
      customers.forEach(customer => {
        result.push({ type: 'customer', customer });
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

  const getCustomerRow = (customer: Customer, headers: string[]): string => {
    return headers.map(header => {
      let value = '';
      if (header === 'C_Number') {
        value = customer.C_Number?.toString() || '';
      } else if (header === 'C_Name') {
        value = customer.C_Name || '';
      } else {
        value = getNestedValue(customer, header);
      }
      return escapeCSVValue(value);
    }).join(',');
  };

  const generateCSV = (customers: Customer[], fields: string[], groupBy: 'route' | 'salesRep' | 'state' | 'city' | '') => {
    const headers = ['C_Number', 'C_Name', ...fields.filter(f => f !== 'C_Number' && f !== 'C_Name')];
    const csvHeaders = headers.map(h => FIELD_LABELS[h] || h).join(',');

    // If State grouping is selected
    if (groupBy === 'state') {
      const validCustomers = customers.filter(c => c.C_State && c.C_State.trim() !== '');
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const state = customer.C_State.trim();
        if (!acc[state]) {
          acc[state] = [];
        }
        acc[state].push(customer);
        return acc;
      }, {} as { [key: string]: Customer[] });

      const sortedStates = Object.keys(grouped).sort();
      const rows: string[] = [csvHeaders];

      sortedStates.forEach(state => {
        rows.push(`"=== State: ${state} ==="`);
        grouped[state].forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      });

      const customersWithoutState = customers.filter(c => !c.C_State || c.C_State.trim() === '');
      if (customersWithoutState.length > 0) {
        rows.push('"=== No State ==="');
        customersWithoutState.forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      }

      return rows.join('\n');
    }

    // If City grouping is selected
    else if (groupBy === 'city') {
      const validCustomers = customers.filter(c => c.C_City && c.C_City.trim() !== '');
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const city = customer.C_City.trim();
        if (!acc[city]) {
          acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
      }, {} as { [key: string]: Customer[] });

      const sortedCities = Object.keys(grouped).sort();
      const rows: string[] = [csvHeaders];

      sortedCities.forEach(city => {
        rows.push(`"=== City: ${city} ==="`);
        grouped[city].forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      });

      const customersWithoutCity = customers.filter(c => !c.C_City || c.C_City.trim() === '');
      if (customersWithoutCity.length > 0) {
        rows.push('"=== No City ==="');
        customersWithoutCity.forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      }

      return rows.join('\n');
    }

    // If Route grouping is selected
    else if (groupBy === 'route') {
      const validCustomers = customers.filter(c => 
        c.Routes && Array.isArray(c.Routes) && c.Routes.length > 0
      );
      
      const grouped = validCustomers.reduce((acc, customer) => {
        if (customer.Routes && Array.isArray(customer.Routes)) {
          customer.Routes.forEach(route => {
            const routeNum = route.Route_Number;
            if (!acc[routeNum]) {
              acc[routeNum] = [];
            }
            if (!acc[routeNum].find(c => c.C_Number === customer.C_Number)) {
              acc[routeNum].push(customer);
            }
          });
        }
        return acc;
      }, {} as { [key: number]: Customer[] });

      const sortedRoutes = Object.keys(grouped).map(Number).sort((a, b) => a - b);
      const rows: string[] = [csvHeaders];

      sortedRoutes.forEach(routeNum => {
        const route = routeOptions.find(r => r.Route_Number === routeNum);
        rows.push(`"=== Route: ${route?.Route_Desc || `Route ${routeNum}`} ==="`);
        grouped[routeNum].forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      });

      const customersWithoutRoutes = customers.filter(c => 
        !c.Routes || !Array.isArray(c.Routes) || c.Routes.length === 0
      );
      if (customersWithoutRoutes.length > 0) {
        rows.push('"=== No Route ==="');
        customersWithoutRoutes.forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      }

      return rows.join('\n');
    }

    // If only Sales Rep grouping is selected
    if (groupBy === 'salesRep') {
      const validCustomers = customers.filter(c => c.salesRep?.S_Number);
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const salesRepNum = customer.salesRep?.S_Number;
        if (salesRepNum !== undefined) {
          if (!acc[salesRepNum]) {
            acc[salesRepNum] = [];
          }
          acc[salesRepNum].push(customer);
        }
        return acc;
      }, {} as { [key: number]: Customer[] });

      const sortedSalesReps = Object.keys(grouped).map(Number).sort((a, b) => a - b);
      const rows: string[] = [csvHeaders];

      sortedSalesReps.forEach(salesRepNum => {
        const salesRep = salesRepOptions.find(sr => sr.S_Number === salesRepNum);
        rows.push(`"=== Sales Rep: ${salesRep?.S_Desc || `Sales Rep ${salesRepNum}`} ==="`);
        grouped[salesRepNum].forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      });

      const customersWithoutSalesRep = customers.filter(c => !c.salesRep?.S_Number);
      if (customersWithoutSalesRep.length > 0) {
        rows.push('"=== No Sales Rep ==="');
        customersWithoutSalesRep.forEach(customer => {
          rows.push(getCustomerRow(customer, headers));
        });
        rows.push('');
      }

      return rows.join('\n');
    }

    // If both Route and Sales Rep grouping are selected
    // Note: Only one grouping at a time, so Route+SalesRep combination removed
    // Regular flat report (no grouping)
    else {
      const csvRows = customers.map(customer => getCustomerRow(customer, headers));
      return [csvHeaders, ...csvRows].join('\n');
    }
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
    const footerY = pageHeight - 6; // 6mm from bottom - reduced padding
    
    // Add "Report Generated by Woopsa" text
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const text = 'Report Generated by Woopsa';
    const textWidth = doc.getTextWidth(text);
    
    // Center the footer content
    const totalWidth = textWidth + 7; // text + logo width + spacing
    const startX = (pageWidth - totalWidth) / 2;
    
    // Add text with slight vertical adjustment
    doc.text(text, startX, footerY);
    
    // Add logo (small size - 4mm height) with padding
    if (logoDataUrl) {
      try {
        const logoWidth = 4;
        const logoHeight = 4;
        const logoPaddingTop = 0.5; // Padding top for logo
        const logoSpacing = 1.5; // Spacing between text and logo
        const logoX = startX + textWidth + logoSpacing;
        const logoY = footerY - 3.5 + logoPaddingTop; // Adjust vertical position with padding
        
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

  const generatePDF = async (customers: Customer[], fields: string[], groupBy: 'route' | 'salesRep' | 'state' | 'city' | '') => {
    // Load logo first before generating PDF
    const logoDataUrl = await loadLogoAsDataUrl();

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPosition = 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Report', margin, yPosition);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const date = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;
    doc.text(`Generated on: ${date}`, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 8;

    const headers = ['C_Number', 'C_Name', ...fields.filter(f => f !== 'C_Number' && f !== 'C_Name')];
    const headerLabels = headers.map(h => FIELD_LABELS[h] || h);

    const getCellValue = (customer: Customer, header: string): string => {
      if (header === 'C_Number') {
        return customer.C_Number?.toString() || '-';
      } else if (header === 'C_Name') {
        return customer.C_Name || '-';
      } else {
        const value = getNestedValue(customer, header);
        return value || '-';
      }
    };

    const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
    
    // Calculate column widths based on number of columns
    const totalColumns = headerLabels.length;
    const availableWidth = pageWidth - (margin * 2); // 190mm for A4 portrait
    
    // Define column widths: C_Number (smaller), C_Name (larger), others (equal)
    const columnWidths: (number | 'auto')[] = [];
    if (totalColumns === 2) {
      // C_Number and C_Name only
      columnWidths.push(30, availableWidth - 30);
    } else if (totalColumns === 3) {
      // C_Number, C_Name, and 1 other
      columnWidths.push(25, (availableWidth - 25) * 0.6, (availableWidth - 25) * 0.4);
    } else if (totalColumns === 4) {
      // C_Number, C_Name, and 2 others
      columnWidths.push(22, (availableWidth - 22) * 0.5, (availableWidth - 22) * 0.25, (availableWidth - 22) * 0.25);
    } else if (totalColumns === 5) {
      // C_Number, C_Name, and 3 others
      columnWidths.push(20, (availableWidth - 20) * 0.45, (availableWidth - 20) * 0.18, (availableWidth - 20) * 0.18, (availableWidth - 20) * 0.19);
    } else if (totalColumns === 6) {
      // C_Number, C_Name, and 4 others
      columnWidths.push(18, (availableWidth - 18) * 0.4, (availableWidth - 18) * 0.15, (availableWidth - 18) * 0.15, (availableWidth - 18) * 0.15, (availableWidth - 18) * 0.15);
    } else {
      // 7+ columns - distribute evenly but keep C_Number and C_Name proportional
      const otherColsWidth = (availableWidth - 20) / totalColumns;
      columnWidths.push(20, otherColsWidth * 1.5, ...Array(totalColumns - 2).fill(otherColsWidth));
    }
    
    const getColumnStyles = () => {
      return headerLabels.reduce((acc, _, index) => {
        acc[index] = { cellWidth: columnWidths[index] || 'auto' };
        return acc;
      }, {} as { [key: number]: { cellWidth: number | 'auto' } });
    };
    
    // Common footer callback for all pages
    const footerCallback = () => {
      addFooterToPage(doc, logoDataUrl || undefined);
    };

    // If State grouping is selected
    if (groupBy === 'state') {
      const validCustomers = customers.filter(c => c.C_State && c.C_State.trim() !== '');
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const state = customer.C_State.trim();
        if (!acc[state]) {
          acc[state] = [];
        }
        acc[state].push(customer);
        return acc;
      }, {} as { [key: string]: Customer[] });

      const sortedStates = Object.keys(grouped).sort();

      sortedStates.forEach(state => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`State: ${state}`, margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        grouped[state].forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
      });

      const customersWithoutState = customers.filter(c => !c.C_State || c.C_State.trim() === '');
      if (customersWithoutState.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('No State', margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        customersWithoutState.forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });
      }
    }
    // If City grouping is selected
    else if (groupBy === 'city') {
      const validCustomers = customers.filter(c => c.C_City && c.C_City.trim() !== '');
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const city = customer.C_City.trim();
        if (!acc[city]) {
          acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
      }, {} as { [key: string]: Customer[] });

      const sortedCities = Object.keys(grouped).sort();

      sortedCities.forEach(city => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`City: ${city}`, margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        grouped[city].forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
      });

      const customersWithoutCity = customers.filter(c => !c.C_City || c.C_City.trim() === '');
      if (customersWithoutCity.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('No City', margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        customersWithoutCity.forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });
      }
    }
    // If Route grouping is selected
    else if (groupBy === 'route') {
      const validCustomers = customers.filter(c => 
        c.Routes && Array.isArray(c.Routes) && c.Routes.length > 0
      );
      
      const grouped = validCustomers.reduce((acc, customer) => {
        if (customer.Routes && Array.isArray(customer.Routes)) {
          customer.Routes.forEach(route => {
            const routeNum = route.Route_Number;
            if (!acc[routeNum]) {
              acc[routeNum] = [];
            }
            if (!acc[routeNum].find(c => c.C_Number === customer.C_Number)) {
              acc[routeNum].push(customer);
            }
          });
        }
        return acc;
      }, {} as { [key: number]: Customer[] });

      const sortedRoutes = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      sortedRoutes.forEach(routeNum => {
        const route = routeOptions.find(r => r.Route_Number === routeNum);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Route: ${route?.Route_Desc || `Route ${routeNum}`}`, margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        grouped[routeNum].forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
      });

      const customersWithoutRoutes = customers.filter(c => 
        !c.Routes || !Array.isArray(c.Routes) || c.Routes.length === 0
      );
      if (customersWithoutRoutes.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('No Route', margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        customersWithoutRoutes.forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });
      }
    }
    // If Sales Rep grouping is selected
    else if (groupBy === 'salesRep') {
      const validCustomers = customers.filter(c => c.salesRep?.S_Number);
      
      const grouped = validCustomers.reduce((acc, customer) => {
        const salesRepNum = customer.salesRep?.S_Number;
        if (salesRepNum !== undefined) {
          if (!acc[salesRepNum]) {
            acc[salesRepNum] = [];
          }
          acc[salesRepNum].push(customer);
        }
        return acc;
      }, {} as { [key: number]: Customer[] });

      const sortedSalesReps = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      sortedSalesReps.forEach(salesRepNum => {
        const salesRep = salesRepOptions.find(sr => sr.S_Number === salesRepNum);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Sales Rep: ${salesRep?.S_Desc || `Sales Rep ${salesRepNum}`}`, margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        grouped[salesRepNum].forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
      });

      const customersWithoutSalesRep = customers.filter(c => !c.salesRep?.S_Number);
      if (customersWithoutSalesRep.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('No Sales Rep', margin, yPosition);
        yPosition += 5;

        const tableData: any[][] = [];
        customersWithoutSalesRep.forEach(customer => {
          tableData.push(headers.map(header => getCellValue(customer, header)));
        });

        autoTableFn(doc, {
          head: [headerLabels],
          body: tableData,
          startY: yPosition,
          columnStyles: getColumnStyles(),
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
          margin: { top: 5, left: margin, right: margin, bottom: 12 },
          tableWidth: availableWidth,
          showHead: 'everyPage',
          didDrawPage: footerCallback,
        });
      }
    }
    // Regular flat report (no grouping) - when groupBy is empty
    else {
      const tableData: any[][] = [];
      customers.forEach(customer => {
        tableData.push(headers.map(header => getCellValue(customer, header)));
      });

      autoTableFn(doc, {
        head: [headerLabels],
        body: tableData,
        startY: yPosition,
        columnStyles: getColumnStyles(),
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
        margin: { top: 5, left: margin, right: margin, bottom: 12 },
        tableWidth: availableWidth,
        showHead: 'everyPage',
      });
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
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
      setLoadingProgress({ loaded: 0, total: 0, stage: 'Downloading data from server...' });
      
      const res = await customerForReport();
      console.log(res);
      let customers: Customer[] = [];
      if (res?.data && typeof res?.data === 'object') {
        if ('data' in res?.data && Array.isArray((res?.data as any).data)) {
          customers = (res?.data as any).data;
        } else if (Array.isArray(res?.data)) {
          customers = res?.data as Customer[];
        }
      }

      if (!Array.isArray(customers) || customers.length === 0) {
        toast.error('No customers found to preview');
        setPreviewLoading(false);
        return;
      }

      setLoadingProgress({ loaded: customers.length, total: customers.length, stage: `Processing ${customers.length} customers...` });

      setLoadingProgress({ loaded: 0, total: customers.length, stage: 'Applying filters...' });
      
      let filteredCustomers = customers;
      
      filteredCustomers = customers.filter(c => {
        // Active/Inactive filter
        if (activeFilter === 'active' && c.C_Inactive) return false;
        if (activeFilter === 'inactive' && !c.C_Inactive) return false;
        
        // Sales Rep filter
        if (selectedSalesReps.length > 0) {
          const salesRepNumber = c.salesRep?.S_Number;
          if (salesRepNumber === undefined || !selectedSalesReps.includes(salesRepNumber)) {
            return false;
          }
        }
        
        // Route filter
        if (selectedRoutes.length > 0) {
          if (c.Routes && Array.isArray(c.Routes) && c.Routes.length > 0) {
            const customerRouteNumbers = c.Routes.map(r => r.Route_Number);
            const hasMatchingRoute = customerRouteNumbers.some(routeNum => selectedRoutes.includes(routeNum));
            if (!hasMatchingRoute) {
              return false;
            }
          } else {
            // If customer has no routes and routes are selected, exclude them
            return false;
          }
        }
        
        // Class of Trade filter
        if (selectedClassOfTrade.length > 0) {
          const customerTradeCode = c.classOfTrade?.Trade_Code;
          if (!customerTradeCode || !selectedClassOfTrade.includes(customerTradeCode)) {
            return false;
          }
        }
        
        // Jurisdiction State filter
        if (selectedJurisdictionState.length > 0) {
          const customerJurisdictionState = c.taxRate?.Jurisdiction_State !== undefined 
            ? String(c.taxRate.Jurisdiction_State) 
            : (c.Jurisdiction_State !== undefined ? String(c.Jurisdiction_State) : '0');
          if (!selectedJurisdictionState.includes(customerJurisdictionState)) {
            return false;
          }
        }
        
        // Jurisdiction County filter
        if (selectedJurisdictionCounty.length > 0) {
          const customerJurisdictionCounty = c.taxRateCounty?.Jurisdiction_County !== undefined 
            ? String(c.taxRateCounty.Jurisdiction_County) 
            : (c.Jurisdiction_County !== undefined ? String(c.Jurisdiction_County) : '0');
          if (!selectedJurisdictionCounty.includes(customerJurisdictionCounty)) {
            return false;
          }
        }
        
        // Jurisdiction City filter
        if (selectedJurisdictionCity.length > 0) {
          const customerJurisdictionCity = c.taxRateCity?.Jurisdiction_City !== undefined 
            ? String(c.taxRateCity.Jurisdiction_City) 
            : (c.Jurisdiction_City !== undefined ? String(c.Jurisdiction_City) : '0');
          if (!selectedJurisdictionCity.includes(customerJurisdictionCity)) {
            return false;
          }
        }
        
        return true;
      });

      setOriginalFilteredData(filteredCustomers);

      setLoadingProgress({ loaded: 0, total: filteredCustomers.length, stage: 'Sorting data...' });
      
      let sortedCustomers: Customer[];
      if (filteredCustomers.length > 10000) {
        sortedCustomers = await new Promise<Customer[]>((resolve) => {
          setTimeout(() => {
            const sorted = applySorting(filteredCustomers);
            setLoadingProgress({ loaded: filteredCustomers.length, total: filteredCustomers.length, stage: 'Finalizing...' });
            resolve(sorted);
          }, 0);
        });
      } else {
        sortedCustomers = await new Promise<Customer[]>((resolve) => {
          requestAnimationFrame(() => {
            const sorted = applySorting(filteredCustomers);
            resolve(sorted);
          });
        });
      }

      setFullFilteredData(sortedCustomers);
      setPreviewData(sortedCustomers);
      setShowPreview(true);
      
      toast.success(`Preview loaded with ${sortedCustomers.length} customers`);
    } catch (error: any) {
      console.error('Error loading preview:', error);
      
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
      const finalData = fullFilteredData.length > 0 ? fullFilteredData : applySorting(originalFilteredData);
      
      if (finalData.length === 0) {
        toast.error('No data to generate report');
        return;
      }

      const selectedFieldKeys = sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]));
      const csvContent = generateCSV(finalData, selectedFieldKeys, groupBy);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `customer-report-${timestamp}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast.success(`CSV report generated successfully with ${finalData.length} customers`);
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast.error('Failed to generate CSV report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    
    try {
      const finalData = fullFilteredData.length > 0 ? fullFilteredData : applySorting(originalFilteredData);
      
      if (finalData.length === 0) {
        toast.error('No data to generate report');
        setGeneratingPDF(false);
        return;
      }

      const selectedFieldKeys = sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]));
      const totalFields = selectedFieldKeys.length + 2; // C_Number + C_Name are always included
      
      if (totalFields > 6) {
        toast.error('PDF generation is limited to 6 fields or less. Please select fewer fields.');
        setGeneratingPDF(false);
        return;
      }

      const doc = await generatePDF(finalData, selectedFieldKeys, groupBy);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `customer-report-${timestamp}.pdf`;
      
      doc.save(filename);
      
      toast.success(`PDF report generated successfully with ${finalData.length} customers`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getAllFields = (): string[] => {
    return FIELD_SEQUENCE.filter(field => !EXCLUDED_FIELDS.includes(field));
  };

  const availableFields = getAllFields();

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
        {!showPreview && (
          <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
            Customer Report Configuration
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
              <Grid size={{ xs: 12, md: 3 }}>
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
                      <MenuItem value="all" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>All Customers</MenuItem>
                      <MenuItem value="active" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Active Customers</MenuItem>
                      <MenuItem value="inactive" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>Inactive Customers</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Sales Rep Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sales Rep
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedSalesReps.map(String)}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedSalesReps(values.map(Number));
                      }}
                      disabled={previewLoading || loadingSalesReps}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Sales Reps</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const salesRep = salesRepOptions.find(sr => sr.S_Number === Number(value));
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {salesRep?.S_Desc || value}
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
                      {salesRepOptions.map((salesRep) => (
                        <MenuItem 
                          key={salesRep.S_Number} 
                          value={String(salesRep.S_Number)}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedSalesReps.includes(salesRep.S_Number)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {salesRep.S_Desc}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Route Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Route
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedRoutes.map(String)}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedRoutes(values.map(Number));
                      }}
                      disabled={previewLoading || loadingRoutes}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Routes</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const route = Array.isArray(routeOptions) ? routeOptions.find(r => r.Route_Number === Number(value)) : undefined;
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {route?.Route_Desc || `Route ${value}`}
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
                      {Array.isArray(routeOptions) && routeOptions.map((route) => (
                        <MenuItem 
                          key={route.Route_Number} 
                          value={String(route.Route_Number)}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedRoutes.includes(route.Route_Number)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {route.Route_Desc || `Route ${route.Route_Number}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Class of Trade Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Class of Trade
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedClassOfTrade}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedClassOfTrade(values);
                      }}
                      disabled={previewLoading || loadingDropdowns}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Class of Trade</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const classOfTrade = classOfTradeOptions.find(ct => ct.value === value);
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {classOfTrade?.label || value}
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
                      {classOfTradeOptions.map((classOfTrade) => (
                        <MenuItem 
                          key={classOfTrade.value} 
                          value={classOfTrade.value}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedClassOfTrade.includes(classOfTrade.value)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {classOfTrade.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Jurisdiction State Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Jurisdiction State
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedJurisdictionState}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedJurisdictionState(values);
                      }}
                      disabled={previewLoading || loadingDropdowns}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Jurisdiction States</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const jurisdiction = jurisdictionStateOptions.find(j => j.value === value);
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {jurisdiction?.label || value}
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
                      {jurisdictionStateOptions.map((jurisdiction) => (
                        <MenuItem 
                          key={jurisdiction.value} 
                          value={jurisdiction.value}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedJurisdictionState.includes(jurisdiction.value)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {jurisdiction.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Jurisdiction County Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Jurisdiction County
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedJurisdictionCounty}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedJurisdictionCounty(values);
                      }}
                      disabled={previewLoading || loadingDropdowns}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Jurisdiction Counties</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const jurisdiction = jurisdictionCountyOptions.find(j => j.value === value);
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {jurisdiction?.label || value}
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
                      {jurisdictionCountyOptions.map((jurisdiction) => (
                        <MenuItem 
                          key={jurisdiction.value} 
                          value={jurisdiction.value}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedJurisdictionCounty.includes(jurisdiction.value)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {jurisdiction.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Jurisdiction City Filter */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Jurisdiction City
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={selectedJurisdictionCity}
                      onChange={(e) => {
                        const values = e.target.value as string[];
                        setSelectedJurisdictionCity(values);
                      }}
                      disabled={previewLoading || loadingDropdowns}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Jurisdiction Cities</Typography>;
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.slice(0, 2).map((value) => {
                              const jurisdiction = jurisdictionCityOptions.find(j => j.value === value);
                              return (
                                <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                  {jurisdiction?.label || value}
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
                      {jurisdictionCityOptions.map((jurisdiction) => (
                        <MenuItem 
                          key={jurisdiction.value} 
                          value={jurisdiction.value}
                          sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                        >
                          <Checkbox
                            checked={selectedJurisdictionCity.includes(jurisdiction.value)}
                            size="small"
                            sx={{ 
                              py: 0,
                              '& .MuiSvgIcon-root': { fontSize: '1rem' }
                            }}
                          />
                          {jurisdiction.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Group By */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Group By
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'route'}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Route</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          setGroupBy(groupBy === 'route' ? '' : 'route');
                          if (showPreview && originalFilteredData.length > 0) {
                            const sorted = applySorting(originalFilteredData);
                            setPreviewData(sorted);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'salesRep'}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Sales Rep</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          setGroupBy(groupBy === 'salesRep' ? '' : 'salesRep');
                          if (showPreview && originalFilteredData.length > 0) {
                            const sorted = applySorting(originalFilteredData);
                            setPreviewData(sorted);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'state'}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>State</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          setGroupBy(groupBy === 'state' ? '' : 'state');
                          if (showPreview && originalFilteredData.length > 0) {
                            const sorted = applySorting(originalFilteredData);
                            setPreviewData(sorted);
                          }
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={groupBy === 'city'}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>City</Typography>}
                      sx={{ m: 0 }}
                      onClick={() => {
                        if (!previewLoading) {
                          setGroupBy(groupBy === 'city' ? '' : 'city');
                          if (showPreview && originalFilteredData.length > 0) {
                            const sorted = applySorting(originalFilteredData);
                            setPreviewData(sorted);
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
                          checked={sortOption === 'name'}
                          onChange={() => {
                            setSortOption('name');
                            if (showPreview && originalFilteredData.length > 0) {
                              const sorted = sortByName(originalFilteredData);
                              setFullFilteredData(sorted);
                              setPreviewData(sorted);
                            }
                          }}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Name</Typography>}
                      sx={{ m: 0 }}
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          size="small"
                          checked={sortOption === 'number'}
                          onChange={() => {
                            setSortOption('number');
                            if (showPreview && originalFilteredData.length > 0) {
                              const sorted = sortByNumber(originalFilteredData);
                              setFullFilteredData(sorted);
                              setPreviewData(sorted);
                            }
                          }}
                          disabled={previewLoading}
                          sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.7rem', fontWeight: 400 }}>Number</Typography>}
                      sx={{ m: 0 }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 9 }}>
                <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Fields
                </Typography>
                <Typography variant="caption" sx={{ mb: 0.6, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                  Customer Number & Customer Name always included
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
                            disabled={previewLoading}
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
              Preview Data ({previewData.length} customers)
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
                    <TableCell sx={{ 
                      fontWeight: 500,
                      backgroundColor: theme.palette.primary.main,
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      py: 0.75,
                      px: 1,
                    }}>
                      Customer Number
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 500,
                      backgroundColor: theme.palette.primary.main,
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      py: 0.75,
                      px: 1,
                    }}>
                      Customer Name
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // Get grouped data if grouping is enabled
                    const groupedRows = (groupBy !== '') 
                      ? getGroupedDataForDisplay(previewData)
                      : previewData.map(c => ({ type: 'customer' as const, customer: c }));

                    // Calculate pagination for grouped rows
                    const totalCols = 2 + Object.keys(selectedFields).filter(key => selectedFields[key]).length;
                    const displayRows = groupedRows.length > PREVIEW_PAGE_SIZE 
                      ? groupedRows.slice(previewPage * PREVIEW_PAGE_SIZE, (previewPage + 1) * PREVIEW_PAGE_SIZE)
                      : groupedRows;
                    
                    return displayRows.map((row, idx) => {
                      if (row.type === 'header') {
                        let headerText = '';
                        if (row.route !== undefined) {
                          if (row.route === -1) {
                            headerText = '=== No Route ===';
                          } else {
                            const route = Array.isArray(routeOptions) ? routeOptions.find(r => r.Route_Number === row.route) : undefined;
                            headerText = `=== Route: ${route?.Route_Desc || `Route ${row.route}`} ===`;
                          }
                        } else if (row.salesRep) {
                          if (row.salesRep.number === -1) {
                            headerText = '=== No Sales Rep ===';
                          } else {
                            headerText = `=== Sales Rep: ${row.salesRep.desc} ===`;
                          }
                        } else if (row.state !== undefined) {
                          headerText = `=== State: ${row.state} ===`;
                        } else if (row.city !== undefined) {
                          headerText = `=== City: ${row.city} ===`;
                        }
                        
                        return (
                          <TableRow key={`header-${idx}`}>
                            <TableCell 
                              colSpan={totalCols}
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                py: 0.75,
                                px: 1,
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(25, 118, 210, 0.2)' 
                                  : 'rgba(25, 118, 210, 0.1)',
                                color: theme.palette.primary.main,
                                borderBottom: `2px solid ${theme.palette.primary.main}`,
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
                              colSpan={totalCols}
                              sx={{ py: 0.25, border: 'none', backgroundColor: 'transparent' }}
                            />
                          </TableRow>
                        );
                      } else if (row.type === 'customer' && row.customer) {
                        const customer = row.customer;
                        return (
                          <TableRow 
                            key={`customer-${customer.C_Number}-${idx}`} 
                            hover
                            sx={{
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.05)' 
                                  : 'rgba(0, 0, 0, 0.02)',
                              },
                            }}
                          >
                            <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                              {customer.C_Number || '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                              {customer.C_Name || '-'}
                            </TableCell>
                            {sortFieldsBySequence(Object.keys(selectedFields).filter(key => selectedFields[key]))
                              .map((field) => {
                                const value = getNestedValue(customer, field);
                                return (
                                  <TableCell key={field} sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                                    {value || '-'}
                                  </TableCell>
                                );
                              })}
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
              const groupedRows = (groupBy !== '') 
                ? getGroupedDataForDisplay(previewData)
                : previewData.map(c => ({ type: 'customer' as const, customer: c }));
              const totalPages = Math.ceil(groupedRows.length / PREVIEW_PAGE_SIZE);
              const start = previewPage * PREVIEW_PAGE_SIZE + 1;
              const end = Math.min((previewPage + 1) * PREVIEW_PAGE_SIZE, groupedRows.length);
              
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
                    {groupedRows.length > PREVIEW_PAGE_SIZE && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block' }}>
                        Showing {start}-{end} of {groupedRows.length} rows ({previewData.length} customers)
                      </Typography>
                    )}
                  </Box>
                  {totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={previewPage + 1}
                      onChange={(_, page) => {
                        setPreviewPage(page - 1);
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
                setFullFilteredData([]);
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
                const selectedCount = Object.keys(selectedFields).filter(key => selectedFields[key]).length;
                const totalFields = selectedCount + 2;
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
              })()}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default CustomerReportTab;

