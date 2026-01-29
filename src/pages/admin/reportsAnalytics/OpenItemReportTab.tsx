import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
// Import jspdf-autotable as side-effect to extend jsPDF
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
const jspdfAutoTable = require('jspdf-autotable');
import { getOpenItemReport, listOfARStatementreports } from '../../../redux/apis/distrubutor/reportsApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import SearchableDropdown from '../../../component/atoms/SearchableDropdown';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

interface OpenItemReportItem {
  P_Number: number;
  C_Number: number;
  C_Number_Child: number;
  Invoice_Number: number;
  AR_Type: string;
  AR_SubType: number;
  AR_POS: boolean;
  AR_Date: string;
  AR_CheckDate: string;
  AR_Ref: string;
  AR_Amount: number;
  AR_Applied: number;
  Deposit_ID: number;
  Workstation_ID: number;
  User_Number: number;
  AR_Archived: boolean;
  AR_Reconcile: boolean;
  AR_Batch: number;
  C_Name_Child: string;
  SubType: string;
  fCharge: number;
  aging: number;
  customer?: {
    C_Number: number;
    C_Name: string;
    C_CoName: string;
    C_Address: string;
    C_City: string;
    C_State: string;
    C_Zip: string;
    C_Phone: string;
    C_Fax: string;
    C_Email: string;
    TermsCode: number;
    C_Salesman: number;
    C_StatementAccount: number;
    C_Interest: number;
    salesRep?: {
      RepName: string;
    };
    terms?: {
      DaysUntilDue: number;
      Terms: string;
    };
  };
  Cust_BillTo?: any;
  Balance?: number; // Calculated: AR_Amount - AR_Applied
}

interface CustomerOption {
  label: string;
  value: string;
  C_Number: number;
  C_Name: string;
}

interface SalesRepOption {
  label: string;
  value: string;
  S_Number: number;
  S_Desc: string;
}


// Fixed fields for the report (matching the image)
const FIXED_FIELDS = [
  'AR_Date',
  'AR_Type',
  'Invoice_Number',
  'AR_CheckDate',
  'AR_Ref',
  'AR_Amount',
  'AR_Applied',
  'Balance',
  'aging',
];

// Field labels mapping
const FIELD_LABELS: { [key: string]: string } = {
  AR_Date: 'Posting Date',
  AR_Type: 'Transaction Type',
  Invoice_Number: 'Number',
  AR_CheckDate: 'Check Date',
  AR_Ref: 'Reference',
  AR_Amount: 'Amount',
  AR_Applied: 'Applied',
  Balance: 'Balance',
  aging: 'Aging',
};

const AGING_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: '0', value: '0' },
  { label: '7', value: '7' },
  { label: '14', value: '14' },
  { label: '21', value: '21' },
  { label: '30', value: '30' },
  { label: '60', value: '60' },
  { label: '90', value: '90' },
  { label: '120', value: '120' },
];

// Custom sort function for customer names: spaces, symbols, numbers, then alphabetic
const getCustomerNameSortKey = (name: string): string => {
  if (!name) return 'zzzzzzzzzz'; // Empty names go last
  
  // Get first character
  const firstChar = name.trim().charAt(0);
  
  // Determine category
  if (firstChar === ' ') {
    return `0_${name}`; // Spaces first
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(firstChar)) {
    return `1_${name}`; // Symbols second
  } else if (/[0-9]/.test(firstChar)) {
    return `2_${name}`; // Numbers third
  } else if (/[a-zA-Z]/.test(firstChar)) {
    return `3_${name.toLowerCase()}`; // Alphabetic last (case-insensitive)
  }
  
  return `4_${name}`; // Other characters
};

// Sort customers by name with custom priority
const sortCustomersByName = (a: number, b: number, customerGroups: { [key: number]: OpenItemReportItem[] }): number => {
  const customerA = customerGroups[a]?.[0];
  const customerB = customerGroups[b]?.[0];
  
  const nameA = customerA?.customer?.C_Name || customerA?.C_Name_Child || `Customer ${a}`;
  const nameB = customerB?.customer?.C_Name || customerB?.C_Name_Child || `Customer ${b}`;
  
  const keyA = getCustomerNameSortKey(nameA);
  const keyB = getCustomerNameSortKey(nameB);
  
  return keyA.localeCompare(keyB);
};


const OpenItemReportTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  // Date filters - default to 1 month ago to today (same as AR Statement)
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Customer selection
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Sales Rep selection
  const [salesReps, setSalesReps] = useState<SalesRepOption[]>([]);
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRepOption | null>(null);

  // Suppress Fully Applied filter (same as AR Statement)
  const [suppressFullyApplied, setSuppressFullyApplied] = useState<'all' | 'suppress'>('all');

  // Aging Select filter
  const [selectedAging, setSelectedAging] = useState<string>('all');

  // Data states
  const [reportData, setReportData] = useState<OpenItemReportItem[]>([]);
  const [rawFetchedData, setRawFetchedData] = useState<OpenItemReportItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dateChangeLoading, setDateChangeLoading] = useState(false);

  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<OpenItemReportItem[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 500;

  // PDF/CSV generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch customers, sales reps, and statement codes from listOfARStatementreports
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingCustomers(true);
      try {
        const response = await listOfARStatementreports() as any;
        const responseData = response?.data?.data || response?.data;
        
        // Extract customers
        if (responseData?.customer && Array.isArray(responseData.customer)) {
          const customerOptions: CustomerOption[] = responseData.customer.map((customer: any) => ({
            label: `${customer.C_Number || ''} - ${customer.C_Name || 'Unknown'}`,
            value: String(customer.C_Number || ''),
            C_Number: customer.C_Number || 0,
            C_Name: customer.C_Name || 'Unknown',
          }));
          setCustomers(customerOptions);
        }
        
        // Extract sales reps
        if (responseData?.salesRep && Array.isArray(responseData.salesRep)) {
          const salesRepOptions: SalesRepOption[] = responseData.salesRep
            .filter((rep: any) => rep.S_Desc && rep.S_Desc.trim() !== '')
            .map((rep: any) => ({
              label: `${rep.S_Number || ''} - ${rep.S_Desc || 'Unknown'}`,
              value: String(rep.S_Number || ''),
              S_Number: rep.S_Number || 0,
              S_Desc: rep.S_Desc || 'Unknown',
            }));
          setSalesReps(salesRepOptions);
        }

      } catch (error) {
        console.error('Error fetching filter options:', error);
        toast.error('Failed to load filter options');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // Calculate balance for each transaction
  const calculateBalances = useCallback((data: OpenItemReportItem[]): OpenItemReportItem[] => {
    return data.map(item => {
      const amount = item.AR_Amount || 0;
      const applied = item.AR_Applied || 0;
      item.Balance = amount - applied;
      return item;
    });
  }, []);

  // Load Open Item Report data
  const loadOpenItemData = async (startDateStr?: string, endDateStr?: string): Promise<OpenItemReportItem[]> => {
    try {
      const response = await getOpenItemReport(startDateStr, endDateStr) as any;
      
      // Handle nested response structure
      const responseData = response?.data;
      let data: OpenItemReportItem[] = [];
      
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        data = responseData.data.data;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        data = responseData.data;
      } else if (Array.isArray(responseData)) {
        data = responseData;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      }
      
      // Calculate balances
      return calculateBalances(data);
    } catch (error) {
      console.error('Error loading Open Item Report data:', error);
      toast.error('Failed to load Open Item Report data');
      return [];
    }
  };

  // Auto-fetch data when dates change
  useEffect(() => {
    // Only auto-fetch when both dates are selected
    if (!startDate || !endDate) {
      // Reset data if dates are not selected
      setRawFetchedData([]);
      setReportData([]);
      setPreviewData([]);
      setShowPreview(false);
      return;
    }

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(async () => {
      setDateChangeLoading(true);
      try {
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        const fetchedData = await loadOpenItemData(startDateStr, endDateStr);
        setRawFetchedData(fetchedData);
      } catch (error) {
        console.error('Error auto-fetching Open Item Report data:', error);
        // Don't show error toast for auto-fetch, just reset state
        setRawFetchedData([]);
        setReportData([]);
        setPreviewData([]);
      } finally {
        setDateChangeLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, calculateBalances]);

  // Re-process data when filters change
  useEffect(() => {
    if (rawFetchedData.length === 0 || showPreview) {
      return;
    }

    let filteredData = rawFetchedData;

    // Filter by customer if selected
    if (selectedCustomer) {
      filteredData = filteredData.filter(item => item.C_Number === selectedCustomer.C_Number);
    }

    // Filter by sales rep if selected
    if (selectedSalesRep) {
      filteredData = filteredData.filter(item => {
        const customerSalesRep = item.customer?.C_Salesman;
        return customerSalesRep === selectedSalesRep.S_Number;
      });
    }

    // Filter by suppress fully applied if selected
    if (suppressFullyApplied === 'suppress') {
      filteredData = filteredData.filter(item => {
        const amount = item.AR_Amount || 0;
        const applied = item.AR_Applied || 0;
        return amount !== applied;
      });
    }

    // Filter by aging
    if (selectedAging !== 'all') {
      const agingDays = parseInt(selectedAging, 10);
      filteredData = filteredData.filter(item => {
        const itemAging = item.aging || 0;
        return itemAging >= agingDays;
      });
    }

    // Group by customer and sort transactions by type within each customer
    const customerGroups: { [key: number]: OpenItemReportItem[] } = {};
    filteredData.forEach(item => {
      if (!customerGroups[item.C_Number]) {
        customerGroups[item.C_Number] = [];
      }
      customerGroups[item.C_Number].push(item);
    });

    // Sort transactions by type within each customer group
    Object.keys(customerGroups).forEach(custNum => {
      customerGroups[Number(custNum)].sort((a, b) => {
        // First sort by AR_Type (I Invoice first, then C CASH, etc.)
        if (a.AR_Type !== b.AR_Type) {
          if (a.AR_Type === 'I') return -1;
          if (b.AR_Type === 'I') return 1;
          return a.AR_Type.localeCompare(b.AR_Type);
        }
        // Then by date
        const dateA = new Date(a.AR_Date).getTime();
        const dateB = new Date(b.AR_Date).getTime();
        return dateA - dateB;
      });
    });

    // Flatten back to array maintaining customer order (sorted by name)
    const sortedData: OpenItemReportItem[] = [];
    Object.keys(customerGroups)
      .map(Number)
      .sort((a, b) => sortCustomersByName(a, b, customerGroups))
      .forEach(custNum => {
        sortedData.push(...customerGroups[custNum]);
      });

    setReportData(sortedData);
  }, [rawFetchedData, selectedCustomer, selectedSalesRep, suppressFullyApplied, selectedAging, showPreview]);

  // Handle preview
  const handlePreview = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start date and end date');
      return;
    }

    setPreviewLoading(true);
    try {
      let fetchedData: OpenItemReportItem[] = [];
      
      // Use already-fetched data if available, otherwise fetch
      if (rawFetchedData.length > 0) {
        fetchedData = rawFetchedData;
      } else {
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        fetchedData = await loadOpenItemData(startDateStr, endDateStr);
        setRawFetchedData(fetchedData);
      }

      // Apply all filters
      let filteredData = fetchedData;
      
      if (selectedCustomer) {
        filteredData = filteredData.filter(item => item.C_Number === selectedCustomer.C_Number);
      }

      if (selectedSalesRep) {
        filteredData = filteredData.filter(item => {
          const customerSalesRep = item.customer?.C_Salesman;
          return customerSalesRep === selectedSalesRep.S_Number;
        });
      }

      // Filter by suppress fully applied if selected
      if (suppressFullyApplied === 'suppress') {
        filteredData = filteredData.filter(item => {
          const amount = item.AR_Amount || 0;
          const applied = item.AR_Applied || 0;
          return amount !== applied;
        });
      }

      if (selectedAging !== 'all') {
        const agingDays = parseInt(selectedAging, 10);
        filteredData = filteredData.filter(item => {
          const itemAging = item.aging || 0;
          return itemAging >= agingDays;
        });
      }

      // Group by customer and sort transactions by type within each customer
      const customerGroups: { [key: number]: OpenItemReportItem[] } = {};
      filteredData.forEach(item => {
        if (!customerGroups[item.C_Number]) {
          customerGroups[item.C_Number] = [];
        }
        customerGroups[item.C_Number].push(item);
      });

      // Sort transactions by type within each customer group
      Object.keys(customerGroups).forEach(custNum => {
        customerGroups[Number(custNum)].sort((a, b) => {
          if (a.AR_Type !== b.AR_Type) {
            if (a.AR_Type === 'I') return -1;
            if (b.AR_Type === 'I') return 1;
            return a.AR_Type.localeCompare(b.AR_Type);
          }
          const dateA = new Date(a.AR_Date).getTime();
          const dateB = new Date(b.AR_Date).getTime();
          return dateA - dateB;
        });
      });

      // Flatten back to array maintaining customer order (sorted by name)
      const sortedData: OpenItemReportItem[] = [];
      Object.keys(customerGroups)
        .map(Number)
        .sort((a, b) => sortCustomersByName(a, b, customerGroups))
        .forEach(custNum => {
          sortedData.push(...customerGroups[custNum]);
        });

      setReportData(sortedData);
      setPreviewData(sortedData);
      setPreviewPage(0);
      setShowPreview(true);

      if (filteredData.length === 0) {
        toast.success('No data found for the selected criteria');
      } else {
        toast.success(`Loaded ${filteredData.length} record(s)`);
      }
    } catch (error: any) {
      console.error('Error generating preview:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate preview');
      setReportData([]);
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Format field value for display
  const formatFieldValue = (item: OpenItemReportItem, field: string): string => {
    const value = (item as any)[field];

    if (value === null || value === undefined) {
      return '';
    }

    if (field.includes('Date')) {
      if (value) {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      }
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      if (field.includes('Amount') || field.includes('Applied') || field.includes('Balance')) {
        const formatted = Math.abs(value).toFixed(2);
        return value < 0 ? `-${formatted}` : formatted;
      }
      return value.toString();
    }

    // Format AR_Type with SubType (e.g., "I Invoice", "C CASH")
    if (field === 'AR_Type') {
      const type = item.AR_Type || '';
      const subType = item.SubType || '';
      if (type && subType) {
        return `${type} ${subType}`;
      }
      return type || subType || '';
    }

    return String(value);
  };

  // Get grouped preview data (by customer, sorted by transaction type)
  const groupedPreviewData = useMemo(() => {
    const groups: { [key: number]: OpenItemReportItem[] } = {};
    previewData.forEach(item => {
      if (!groups[item.C_Number]) {
        groups[item.C_Number] = [];
      }
      groups[item.C_Number].push(item);
    });

    interface GroupedItem {
      type: 'group-header' | 'row' | 'group-total';
      customerNumber?: number;
      customerData?: OpenItemReportItem;
      data?: OpenItemReportItem;
      total?: number;
    }

    const result: GroupedItem[] = [];
    Object.keys(groups)
      .map(Number)
      .sort((a, b) => sortCustomersByName(a, b, groups))
      .forEach(custNum => {
        // Sort transactions by type (I Invoice first, then C CASH, etc.)
        const sortedTransactions = groups[custNum].sort((a, b) => {
          // First sort by AR_Type (I before C)
          if (a.AR_Type !== b.AR_Type) {
            if (a.AR_Type === 'I') return -1;
            if (b.AR_Type === 'I') return 1;
            return a.AR_Type.localeCompare(b.AR_Type);
          }
          // Then by date
          const dateA = new Date(a.AR_Date).getTime();
          const dateB = new Date(b.AR_Date).getTime();
          return dateA - dateB;
        });

        const firstItem = sortedTransactions[0];
        result.push({
          type: 'group-header',
          customerNumber: custNum,
          customerData: firstItem,
        });
        sortedTransactions.forEach(item => {
          result.push({ type: 'row', data: item });
        });
        // Add customer total
        const customerTotal = sortedTransactions.reduce((sum, item) => {
          const balance = item.Balance || 0;
          return sum + balance;
        }, 0);
        result.push({
          type: 'group-total',
          customerNumber: custNum,
          total: customerTotal,
        });
      });

    return result;
  }, [previewData]);

  const paginatedPreviewData = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    const end = start + PREVIEW_PAGE_SIZE;
    return groupedPreviewData.slice(start, end);
  }, [groupedPreviewData, previewPage]);

  const totalPreviewPages = Math.ceil(groupedPreviewData.length / PREVIEW_PAGE_SIZE);

  // Generate CSV
  const handleGenerateCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingReport(true);
    try {
      const headers = FIXED_FIELDS.map(field => FIELD_LABELS[field] || field);
      const csvHeaders = headers.join(',');

      const rows: string[] = [];

      // Group by customer
      const customerGroups: { [key: number]: OpenItemReportItem[] } = {};
      reportData.forEach(item => {
        if (!customerGroups[item.C_Number]) {
          customerGroups[item.C_Number] = [];
        }
        customerGroups[item.C_Number].push(item);
      });

      Object.keys(customerGroups)
        .map(Number)
        .sort((a, b) => sortCustomersByName(a, b, customerGroups))
        .forEach(custNum => {
          // Sort transactions by type (I Invoice first, then C CASH, etc.)
          const customerItems = customerGroups[custNum].sort((a, b) => {
            if (a.AR_Type !== b.AR_Type) {
              if (a.AR_Type === 'I') return -1;
              if (b.AR_Type === 'I') return 1;
              return a.AR_Type.localeCompare(b.AR_Type);
            }
            const dateA = new Date(a.AR_Date).getTime();
            const dateB = new Date(b.AR_Date).getTime();
            return dateA - dateB;
          });
          
          const firstItem = customerItems[0];
          const customer = firstItem.customer;
          const customerName = customer?.C_Name || firstItem.C_Name_Child || `Customer ${custNum}`;
          
          // Add customer header
          rows.push(`"${customerName}",${''.repeat(FIXED_FIELDS.length - 1).split('').map(() => '""').join(',')}`);
          
          // Add transaction rows
          customerItems.forEach(item => {
            const row = FIXED_FIELDS.map(field => {
              const value = formatFieldValue(item, field);
              return `"${value.replace(/"/g, '""')}"`;
            }).join(',');
            rows.push(row);
          });

          // Add customer total
          const customerTotal = customerItems.reduce((sum, item) => {
            const balance = item.Balance || 0;
            return sum + balance;
          }, 0);
          rows.push(`"Total:","${customerTotal >= 0 ? '$' : '-$'}${Math.abs(customerTotal).toFixed(2)}",${''.repeat(FIXED_FIELDS.length - 2).split('').map(() => '""').join(',')}`);
        });

      const csvContent = [csvHeaders, ...rows].join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `open-item-report-${timestamp}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`CSV report generated successfully with ${reportData.length} records`);
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast.error('Failed to generate CSV report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Load logo as data URL
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

        img.onerror = () => {
          resolve(null);
        };

        img.src = rabbitLogo;
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Generate PDF with Open Item Report format
  const handleGeneratePDF = async () => {
    if (reportData.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const headers = FIXED_FIELDS.map(field => FIELD_LABELS[field] || field);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;
      let yPos = 15;

      // Group data by customer
      const customerGroups: { [key: number]: OpenItemReportItem[] } = {};
      reportData.forEach(item => {
        if (!customerGroups[item.C_Number]) {
          customerGroups[item.C_Number] = [];
        }
        customerGroups[item.C_Number].push(item);
      });

      // Sort transactions by type within each customer group
      Object.keys(customerGroups).forEach(custNum => {
        customerGroups[Number(custNum)].sort((a, b) => {
          // First sort by AR_Type (I Invoice first, then C CASH, etc.)
          if (a.AR_Type !== b.AR_Type) {
            if (a.AR_Type === 'I') return -1;
            if (b.AR_Type === 'I') return 1;
            return a.AR_Type.localeCompare(b.AR_Type);
          }
          // Then by date
          const dateA = new Date(a.AR_Date).getTime();
          const dateB = new Date(b.AR_Date).getTime();
          return dateA - dateB;
        });
      });

      const customerNumbers = Object.keys(customerGroups).map(Number).sort((a, b) => sortCustomersByName(a, b, customerGroups));

      // Get distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';

      // Common footer function
      const addFooter = (pageNum: number, totalPagesCount: number) => {
        const currentPageHeight = doc.internal.pageSize.getHeight();
        const footerY = currentPageHeight - 5;
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const text = 'Report Generated by Woopsa';
        doc.text(text, margin, footerY);
        if (logoDataUrl) {
          try {
            const textWidth = doc.getTextWidth(text);
            doc.addImage(logoDataUrl, 'PNG', margin + textWidth + 1, footerY - 2.5, 3, 3);
          } catch {
            // Ignore logo errors
          }
        }
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const pageText = `Page ${pageNum} of ${totalPagesCount}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
      };

      // Table styles
      const tableStyles = {
        fontSize: 7,
        cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
        overflow: 'linebreak' as const,
        cellWidth: 'auto' as const,
        lineColor: [200, 200, 200] as [number, number, number],
        lineWidth: 0.1,
        textColor: [0, 0, 0] as [number, number, number],
        fillColor: [255, 255, 255] as [number, number, number],
      };

      const headStyles = {
        fillColor: [80, 80, 80] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold' as const,
        fontSize: 7.5,
        lineColor: [60, 60, 60] as [number, number, number],
        lineWidth: 0.2,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      };

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      // Generate report for each customer
      customerNumbers.forEach((custNum, custIdx) => {
        const customerTransactions = customerGroups[custNum];
        if (customerTransactions.length === 0) return;

        const firstTransaction = customerTransactions[0];
        const customer = firstTransaction.customer;

        // New page for each customer (except first)
        if (custIdx > 0) {
          doc.addPage();
          yPos = 15;
        }

        // Format date
        const formatDate = (date: Dayjs | null) => {
          if (!date) {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const year = now.getFullYear();
            return `${month}-${day}-${year}`;
          }
          return date.format('MM-DD-YYYY');
        };
        
        const dateText = formatDate(endDate);
        const agingDays = selectedAging === 'all' ? '0' : selectedAging;

        // Report header (only on first page of first customer)
        if (custIdx === 0) {
          const headerY = yPos;
          
          // Warehouse/Distributor name on left, Report title in center, Date on right (all on same line)
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          
          // Warehouse name on left
          if (distributorName) {
            doc.text(distributorName, margin, headerY);
          }
          
          // Report title - centered (aligned with warehouse name and date)
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Open Item Report', pageWidth / 2, headerY, { align: 'center' });
          
          // Date on right (aligned with warehouse name and title)
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(dateText, pageWidth - margin, headerY, { align: 'right' });
          
          yPos = headerY + 3.5;
          
          // Warehouse address on left, Aging Days on right (second line)
          if (distributorAddress) {
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(distributorAddress, margin, yPos);
          }
          
          // Aging Days on right
          doc.text(`Aging Days: ${agingDays}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 3.5;
          
          // Warehouse phone on left (third line)
          if (distributorPhone) {
            doc.text(distributorPhone, margin, yPos);
            yPos += 3.5;
          }
          
          // Draw divider line
          yPos += 2;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 4;
        } else {
          // For subsequent customers, just add spacing
          yPos += 2;
        }

        // Customer header - name with customer number
        const customerName = customer?.C_Name || firstTransaction.C_Name_Child || `Customer ${custNum}`;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`***${customerName}`, margin, yPos);
        // Customer number on same line, right-aligned
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(String(custNum), pageWidth - margin, yPos, { align: 'right' });
        yPos += 3.5;

        // Customer address
        if (customer?.C_Address) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(customer.C_Address, margin, yPos);
          yPos += 3.5;
        }

        const cityStateZip = [customer?.C_City, customer?.C_State, customer?.C_Zip]
          .filter(Boolean)
          .join(', ');
        if (cityStateZip) {
          doc.text(cityStateZip, margin, yPos);
          yPos += 3.5;
        }

        // Contact info
        if (customer?.C_Phone) {
          doc.text(`Phone: ${customer.C_Phone}`, margin, yPos);
          yPos += 3.5;
        }
        if (customer?.C_Fax) {
          doc.text(`Fax: ${customer.C_Fax}`, margin, yPos);
          yPos += 3.5;
        }
        if (customer?.C_Email) {
          doc.text(`Email: ${customer.C_Email}`, margin, yPos);
          yPos += 3.5;
        }

        // Terms and Due Days
        const terms = customer?.terms?.Terms || 'N/A';
        const dueDays = customer?.terms?.DaysUntilDue ?? 0;
        doc.text(`Terms: ${terms}`, margin, yPos);
        yPos += 3.5;
        doc.text(`Due Days: ${dueDays}`, margin, yPos);
        yPos += 5;

        // Calculate customer total
        const customerTotal = customerTransactions.reduce((sum, item) => {
          const balance = item.Balance || 0;
          return sum + balance;
        }, 0);

        // Transaction table with total as footer
        const tableBody = customerTransactions.map(item =>
          FIXED_FIELDS.map(field => formatFieldValue(item, field))
        );

        // Add total row as footer - "Total:" in first column, amount in Balance column
        const totalRow: string[] = [];
        const balanceIndex = FIXED_FIELDS.indexOf('Balance');
        FIXED_FIELDS.forEach((field, idx) => {
          if (idx === 0) {
            // First column: "Total:"
            totalRow.push('Total:');
          } else if (idx === balanceIndex) {
            // Balance column: the total amount
            totalRow.push(`${customerTotal >= 0 ? '$' : '-$'}${Math.abs(customerTotal).toFixed(2)}`);
          } else {
            // All other columns: empty
            totalRow.push('');
          }
        });

        autoTableFn(doc, {
          head: [headers],
          body: tableBody,
          foot: [totalRow],
          startY: yPos,
          margin: { left: margin, right: margin },
          styles: tableStyles,
          headStyles: headStyles,
          footStyles: {
            fillColor: [245, 245, 245] as [number, number, number],
            textColor: [0, 0, 0] as [number, number, number],
            fontStyle: 'bold' as const,
            fontSize: 8,
            lineColor: [200, 200, 200] as [number, number, number],
            lineWidth: 0.2,
            cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
          },
          showHead: 'everyPage',
          showFoot: 'lastPage',
          didParseCell: (data: any) => {
            if (data.section === 'head') {
              data.cell.styles.fillColor = [80, 80, 80];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.section === 'body') {
              data.cell.styles.fillColor = [255, 255, 255];
              data.cell.styles.textColor = [0, 0, 0];
            } else if (data.section === 'foot') {
              // Right align the total amount in Balance column, left align "Total:" label
              if (data.column.index === FIXED_FIELDS.indexOf('Balance')) {
                data.cell.styles.halign = 'right';
              } else if (data.column.index === 0) {
                data.cell.styles.halign = 'left';
              } else {
                data.cell.styles.halign = 'left';
              }
            }
          },
          columnStyles: FIXED_FIELDS.reduce((acc: any, field, idx) => {
            if (field === 'AR_Amount' || field === 'AR_Applied' || field === 'Balance') {
              acc[idx] = { cellWidth: 'auto', halign: 'right' };
            } else {
              acc[idx] = { cellWidth: 'auto' };
            }
            return acc;
          }, {}),
        });

        yPos = (doc as any).lastAutoTable?.finalY || yPos + 10;
      });

      // Add footers to all pages
      const finalPageCount = (doc as any).internal.pages.length;
      for (let i = 1; i <= finalPageCount; i++) {
        doc.setPage(i);
        addFooter(i, finalPageCount);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `open-item-report-${timestamp}.pdf`;
      doc.save(filename);

      toast.success(`PDF report generated successfully with ${reportData.length} records`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
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
            Open Item Report Configuration
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
              {/* Left Column - Date Filters */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Start Date
                  </Typography>
                  <CustomDatePicker
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                  />
                </Box>
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    End Date
                  </Typography>
                  <CustomDatePicker
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate || undefined}
                  />
                </Box>
              </Grid>

              {/* Right Column - Filter Dropdowns */}
              <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Customer
                    </Typography>
                    <SearchableDropdown
                      options={customers}
                      value={selectedCustomer}
                      onChange={(value) => {
                        if (value) {
                          const customerOption = customers.find(c => c.value === value.value);
                          setSelectedCustomer(customerOption || null);
                        } else {
                          setSelectedCustomer(null);
                        }
                      }}
                      loading={loadingCustomers}
                      placeholder="All Customers"
                      sx={{ 
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          minHeight: '32px',
                          height: '32px',
                          '& input': {
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sales Rep
                    </Typography>
                    <SearchableDropdown
                      options={salesReps}
                      value={selectedSalesRep}
                      onChange={(value) => {
                        if (value) {
                          const salesRepOption = salesReps.find(r => r.value === value.value);
                          setSelectedSalesRep(salesRepOption || null);
                        } else {
                          setSelectedSalesRep(null);
                        }
                      }}
                      loading={loadingCustomers}
                      placeholder="All Sales Reps"
                      sx={{ 
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          minHeight: '32px',
                          height: '32px',
                          '& input': {
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Applied Status Select
                    </Typography>
                    <SearchableDropdown
                      options={[
                        { label: 'All', value: 'all' },
                        { label: 'Suppress Fully Applied', value: 'suppress' },
                      ]}
                      value={suppressFullyApplied === 'all' 
                        ? { label: 'All', value: 'all' }
                        : { label: 'Suppress Fully Applied', value: 'suppress' }}
                      onChange={(value) => {
                        if (value) {
                          setSuppressFullyApplied(value.value === 'suppress' ? 'suppress' : 'all');
                        } else {
                          setSuppressFullyApplied('all');
                        }
                      }}
                      placeholder="All"
                      sx={{ 
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          minHeight: '32px',
                          height: '32px',
                          '& input': {
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Aging Select
                    </Typography>
                    <SearchableDropdown
                      options={AGING_OPTIONS}
                      value={selectedAging === 'all' 
                        ? { label: 'All', value: 'all' }
                        : AGING_OPTIONS.find(opt => opt.value === selectedAging) || AGING_OPTIONS[0]}
                      onChange={(value) => {
                        if (value) {
                          setSelectedAging(value.value);
                        } else {
                          setSelectedAging('all');
                        }
                      }}
                      placeholder="All"
                      sx={{ 
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          minHeight: '32px',
                          height: '32px',
                          '& input': {
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Paper sx={{
            p: 2,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            backgroundColor: theme.palette.background.paper,
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Open Item Report Preview
            </Typography>

            {startDate && endDate && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Date Range: {startDate.format('MM/DD/YYYY')} - {endDate.format('MM/DD/YYYY')} | Aging Days: {selectedAging === 'all' ? '0' : selectedAging}
              </Typography>
            )}

            {previewLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : previewData.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No data available
              </Typography>
            ) : (
              <>
                <TableContainer sx={{
                  maxHeight: 'calc(100vh - 400px)',
                  overflow: 'auto',
                  position: 'relative',
                }}>
                  <Table stickyHeader size="small" sx={{
                    '& .MuiTableHead-root': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 100,
                    },
                  }}>
                    <TableHead>
                      <TableRow>
                        {FIXED_FIELDS.map((field) => (
                          <TableCell
                            key={field}
                            sx={{
                              backgroundColor: theme.palette.mode === 'dark'
                                ? '#2a2a2a'
                                : '#e0e0e0',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              position: 'sticky',
                              top: 0,
                              zIndex: 100,
                              boxShadow: theme.palette.mode === 'dark'
                                ? '0 2px 4px rgba(0, 0, 0, 0.5)'
                                : '0 2px 4px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            {FIELD_LABELS[field] || field}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPreviewData.map((item, idx) => {
                        if (item.type === 'group-header') {
                          const customer = item.customerData?.customer;
                          const customerName = customer?.C_Name || item.customerData?.C_Name_Child || `Customer ${item.customerNumber}`;
                          const customerNumber = item.customerNumber || 0;
                          return (
                            <React.Fragment key={`group-${customerNumber}-${idx}`}>
                              <TableRow>
                                <TableCell
                                  colSpan={FIXED_FIELDS.length}
                                  sx={{
                                    backgroundColor: theme.palette.mode === 'dark'
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.03)',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    py: 1,
                                    borderBottom: theme.palette.mode === 'dark'
                                      ? '2px solid rgba(255, 255, 255, 0.12)'
                                      : '2px solid rgba(0, 0, 0, 0.08)',
                                  }}
                                >
                                  {customerName} ({customerNumber})
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        }
                        if (item.type === 'group-total') {
                          const total = item.total || 0;
                          return (
                            <TableRow key={`total-${item.customerNumber}-${idx}`}>
                              <TableCell
                                colSpan={FIXED_FIELDS.length - 1}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  textAlign: 'right',
                                }}
                              >
                                Total:
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  textAlign: 'right',
                                }}
                              >
                                {total >= 0 ? '$' : '-$'}{Math.abs(total).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={`${item.data?.C_Number}-${item.data?.Invoice_Number}-${idx}`} hover>
                            {FIXED_FIELDS.map((field) => (
                              <TableCell
                                key={field}
                                sx={{
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {formatFieldValue(item.data!, field)}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {totalPreviewPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPreviewPages}
                      page={previewPage + 1}
                      onChange={(_, page) => setPreviewPage(page - 1)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}

                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                  {(() => {
                    const dataRowsInCurrentPage = paginatedPreviewData.filter(item => item.type === 'row').length;
                    const totalDataRows = groupedPreviewData.filter(item => item.type === 'row').length;
                    let dataRowsBeforeCurrentPage = 0;
                    for (let i = 0; i < previewPage * PREVIEW_PAGE_SIZE; i++) {
                      if (groupedPreviewData[i]?.type === 'row') {
                        dataRowsBeforeCurrentPage++;
                      }
                    }
                    const start = dataRowsBeforeCurrentPage + 1;
                    const end = dataRowsBeforeCurrentPage + dataRowsInCurrentPage;
                    if (totalDataRows === 0) {
                      return 'Showing 0 records';
                    }
                    return `Showing ${start}-${end} of ${totalDataRows} records`;
                  })()}
                </Typography>
              </>
            )}
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
              disabled={previewLoading || dateChangeLoading || !endDate || !startDate}
              loading={previewLoading || dateChangeLoading}
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
                setPreviewPage(0);
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
                disabled={generatingReport || generatingPDF || reportData.length === 0}
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
                disabled={generatingReport || generatingPDF || reportData.length === 0}
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
    </Box>
  );
};

export default OpenItemReportTab;
