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
  Select,
  MenuItem,
  FormControl,
  Switch,
  Checkbox,
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
import { getARreportsHistory, getARreports, getListOfARreports } from '../../../redux/apis/distrubutor/reportsApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

interface ARReportItem {
  Deposit_ID: number;
  Deposit_Date: string;
  Deposit_Reference: string;
  Deposit_Batch: number;
  QB_Transfer: boolean;
  QB_TransferDate: string;
  Deposit_Deleted: boolean;
  Deposit_DeleteDate: string;
  Deposit_DeleteUser: number;
  Payment_Total: number;
  Adjustment_Total: number;
  ReturnCheck_Total: number;
  custReceivables?: any[]; // Nested array
  // Flattened custReceivables fields (when data is flattened)
  P_Number?: number;
  C_Number?: number;
  C_Number_Child?: number;
  Invoice_Number?: number;
  AR_Type?: string;
  AR_SubType?: number;
  AR_POS?: boolean;
  AR_Date?: string;
  AR_CheckDate?: string;
  AR_Ref?: string;
  AR_Amount?: number;
  AR_Applied?: number;
  Workstation_ID?: number;
  User_Number?: number;
  AR_Archived?: boolean;
  AR_Reconcile?: boolean;
  AR_Batch?: number;
  C_Name?: string;
  AR_SubTypeRef?: string;
}

// Fields to exclude from checkboxes (Deposit_ID is always included)
const EXCLUDED_FIELDS = ['Deposit_ID', 'custReceivables'];

// Field sequence for display - Deposit fields first, then custReceivables fields
const FIELD_SEQUENCE: string[] = [
  // Deposit fields
  'Deposit_ID',
  'Deposit_Date',
  'Deposit_Reference',
  'Deposit_Batch',
  'QB_Transfer',
  'QB_TransferDate',
  'Deposit_Deleted',
  'Deposit_DeleteDate',
  'Deposit_DeleteUser',
  'Payment_Total',
  'Adjustment_Total',
  'ReturnCheck_Total',
  // CustReceivables fields
  'C_Number',
  'Invoice_Number',
  'AR_Type',
  'AR_Ref',
  'AR_SubTypeRef',
  'AR_POS',
  'AR_Date',
  'AR_CheckDate',
  'AR_Amount',
  'Workstation_ID',
  'User_Number',
  'AR_Batch',
  'C_Name',
];

// Field labels mapping
const FIELD_LABELS: { [key: string]: string } = {
  // Deposit fields
  Deposit_ID: 'Deposit ID',
  Deposit_Date: 'Deposit Date',
  Deposit_Reference: 'Deposit Reference',
  Deposit_Batch: 'Deposit Batch',
  QB_Transfer: 'QB Transfer',
  QB_TransferDate: 'QB Transfer Date',
  Deposit_Deleted: 'Deposit Deleted',
  Deposit_DeleteDate: 'Deposit Delete Date',
  Deposit_DeleteUser: 'Deposit Delete User',
  Payment_Total: 'Payment Total',
  Adjustment_Total: 'Adjustment Total',
  ReturnCheck_Total: 'Return Check Total',
  // CustReceivables fields
  C_Number: 'C Number',
  Invoice_Number: 'Invoice Number',
  AR_Type: 'AR Type',
  AR_POS: 'AR POS',
  AR_Date: 'AR Date',
  AR_CheckDate: 'AR Check Date',
  AR_Ref: 'AR Ref',
  AR_Amount: 'AR Amount',
  Workstation_ID: 'Workstation ID',
  User_Number: 'User Number',
  AR_Batch: 'AR Batch',
  C_Name: 'Customer Name',
  AR_SubTypeRef: 'AR Subtype',
};

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

const ARReportTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  // Report type selection
  const [reportType, setReportType] = useState<'ar-report' | 'ar-report-history'>('ar-report');
  
  // Date filters (only for AR Report) - default to 1 week ago to today
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Filter options and selected filters
  const [filterOptions, setFilterOptions] = useState<{
    typeSelect: Array<{ AR_Type: string }>;
    depositeID: Array<{ Deposit_ID: number; Deposit_Date: string; Deposit_Reference: string }>;
    transactionSource: Array<{ AR_POS: boolean }>;
    users: Array<{ UserNumber: number; UserName: string }>;
  }>({
    typeSelect: [],
    depositeID: [],
    transactionSource: [],
    users: [],
  });
  const [selectedARTypes, setSelectedARTypes] = useState<string[]>([]);
  const [selectedDepositIds, setSelectedDepositIds] = useState<number[]>([]);
  const [selectedTransactionSources, setSelectedTransactionSources] = useState<boolean[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Group By option
  const [groupBy, setGroupBy] = useState<'none' | 'ar-date' | 'ar-check-date' | 'deposit-date' | 'deposit-id' | 'qb-transfer-date' | 'deposit-delete-date'>('none');

  // Field selection states
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({});
  const [hasCustReceivables, setHasCustReceivables] = useState(false);
  const [showCustReceivables, setShowCustReceivables] = useState(false);

  // Data states
  const [reportData, setReportData] = useState<ARReportItem[]>([]);
  const [rawFetchedData, setRawFetchedData] = useState<any[]>([]); // Store raw data for re-processing
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dateChangeLoading, setDateChangeLoading] = useState(false); // Loading state for date change API calls
  
  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ARReportItem[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 500;
  
  // PDF/CSV generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch list of AR reports and filter options on mount
  useEffect(() => {
    const fetchARReportsList = async () => {
      setLoadingFilters(true);
      try {
        const response = await getListOfARreports() as any;
        const data = response?.data?.data || response?.data || {};
        setFilterOptions({
          typeSelect: data.typeSelect || [],
          depositeID: data.depositeID || [],
          transactionSource: data.transactionSource || [],
          users: data.users || [],
        });
      } catch (error) {
        console.error('Error fetching AR reports list:', error);
        toast.error('Failed to load filter options');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchARReportsList();
  }, []);

  // Load AR reports data (API doesn't support pagination - returns all data at once)
  const loadARReportsData = async (startDateStr?: string, endDateStr?: string): Promise<any[]> => {
    try {
      // API returns all data at once - no pagination support
      // If no dates provided, returns all data
      const response = await getARreports(startDateStr, endDateStr) as any;
      const data = response?.data?.data?.data || response?.data?.data || response?.data || response || [];
      const fetchedData = Array.isArray(data) ? data : [];
      return fetchedData;
    } catch (error) {
      console.error('Error loading AR reports data:', error);
      return [];
    }
  };

  // Apply frontend filters to data
  const applyFrontendFilters = useCallback((data: any[]): any[] => {
    let filteredData = [...data];
    
    // Filter by AR Types
    if (selectedARTypes.length > 0) {
      const validARTypes = selectedARTypes.filter(type => type !== 'None' && type !== 'Date');
      if (validARTypes.length > 0) {
        filteredData = filteredData.filter((deposit: any) => {
          if (!deposit.custReceivables || !Array.isArray(deposit.custReceivables)) {
            return false;
          }
          return deposit.custReceivables.some((receivable: any) => 
            validARTypes.includes(receivable.AR_Type)
          );
        });
      }
    }
    
    // Filter by Deposit IDs
    if (selectedDepositIds.length > 0) {
      filteredData = filteredData.filter((deposit: any) => 
        selectedDepositIds.includes(deposit.Deposit_ID)
      );
    }
    
    // Filter by Transaction Sources (AR_POS)
    if (selectedTransactionSources.length > 0) {
      filteredData = filteredData.filter((deposit: any) => {
        if (!deposit.custReceivables || !Array.isArray(deposit.custReceivables)) {
          return false;
        }
        return deposit.custReceivables.some((receivable: any) => {
          // Normalize AR_POS to boolean (handle null/undefined/string/number)
          const receivableAR_POS = Boolean(receivable.AR_POS === true || receivable.AR_POS === 'true' || receivable.AR_POS === 1);
          // Check if this receivable's AR_POS matches any selected boolean value
          return selectedTransactionSources.some(selected => {
            return receivableAR_POS === Boolean(selected);
          });
        });
      });
    }
    
    // Filter by User IDs
    if (selectedUserIds.length > 0) {
      filteredData = filteredData.filter((deposit: any) => {
        if (!deposit.custReceivables || !Array.isArray(deposit.custReceivables)) {
          return false;
        }
        return deposit.custReceivables.some((receivable: any) => 
          selectedUserIds.includes(receivable.User_Number)
        );
      });
    }
    
    // Filter by Deposit Date for AR Report History (frontend filtering)
    if (reportType === 'ar-report-history' && startDate && endDate) {
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');
      
      filteredData = filteredData.filter((deposit: any) => {
        if (!deposit.Deposit_Date) return false;
        
        const depositDate = new Date(deposit.Deposit_Date);
        const depositDateStr = depositDate.toISOString().split('T')[0];
        
        return depositDateStr >= startDateStr && depositDateStr <= endDateStr;
      });
    }
    
    return filteredData;
  }, [selectedARTypes, selectedDepositIds, selectedTransactionSources, selectedUserIds, reportType, startDate, endDate]);

  // Auto-fetch data when dates change (only for AR Report, not History)
  // Filters are applied on frontend, so they don't trigger API calls
  useEffect(() => {
    // Only auto-fetch for AR Report type when dates are selected
    if (reportType !== 'ar-report' || !startDate || !endDate) {
      // Reset custReceivables state if dates are not selected
      if (reportType === 'ar-report' && (!startDate || !endDate)) {
        setHasCustReceivables(false);
        setShowCustReceivables(false);
      }
      return;
    }

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(async () => {
      setDateChangeLoading(true);
      try {
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        
        // Load data (API returns all data at once)
        // Don't apply filters here - store raw data and apply filters separately
        const fetchedData = await loadARReportsData(startDateStr, endDateStr);
        
        // Check if any deposit has custReceivables (on raw data, not filtered)
        const hasReceivables = fetchedData.some((deposit: any) => 
          deposit.custReceivables && Array.isArray(deposit.custReceivables) && deposit.custReceivables.length > 0
        );
        
        setHasCustReceivables(hasReceivables);
        
        // Update toggle state based on receivables
        setShowCustReceivables(prev => {
          // If receivables found, turn on the toggle by default
          if (hasReceivables && !prev) {
            return true;
          }
          // If no receivables found, turn off the toggle
          if (!hasReceivables && prev) {
            return false;
          }
          return prev;
        });
        
        // Store raw unfiltered data - filters will be applied separately
        setRawFetchedData(fetchedData);
      } catch (error) {
        console.error('Error auto-fetching AR reports:', error);
        // Don't show error toast for auto-fetch, just reset state
        setHasCustReceivables(false);
        setShowCustReceivables(false);
      } finally {
        setDateChangeLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [reportType, startDate, endDate]);

  // Apply filters to existing data when filters change (no API call)
  useEffect(() => {
    // Only apply filters if we have raw data and preview is not shown
    // When preview is shown, filters are applied in the preview handler
    if (rawFetchedData.length === 0 || showPreview) {
      return;
    }

    // Apply filters to raw data
    const filteredData = applyFrontendFilters(rawFetchedData);
    
    // Check if any deposit has custReceivables (after filtering)
    const hasReceivables = filteredData.some((deposit: any) => 
      deposit.custReceivables && Array.isArray(deposit.custReceivables) && deposit.custReceivables.length > 0
    );
    
    // Update hasCustReceivables based on filtered data
    setHasCustReceivables(hasReceivables);
    
    // Update toggle state based on receivables
    setShowCustReceivables(prev => {
      if (hasReceivables && !prev) {
        return true;
      }
      if (!hasReceivables && prev) {
        return false;
      }
      return prev;
    });
  }, [rawFetchedData, applyFrontendFilters, showPreview]);

  // CustReceivables fields list
  const CUST_RECEIVABLES_FIELDS = [
    'C_Number',
    'Invoice_Number',
    'AR_Type',
    'AR_Ref',
    'AR_SubTypeRef',
    'AR_POS',
    'AR_Date',
    'AR_CheckDate',
    'AR_Amount',
    'Workstation_ID',
    'User_Number',
    'AR_Batch',
    'C_Name',
  ];

  // Fields that should only be shown for ar-report-history
  const HISTORY_ONLY_FIELDS = [
    'Deposit_Date',
    'Deposit_Reference',
    'Deposit_Batch',
    'QB_Transfer',
    'QB_TransferDate',
    'Deposit_Deleted',
    'Deposit_DeleteDate',
    'Deposit_DeleteUser',
    'Payment_Total',
    'Adjustment_Total',
    'ReturnCheck_Total',
  ];

  // Get available deposit fields (excluding Deposit_ID which is always included)
  const availableDepositFields = useMemo(() => {
    return FIELD_SEQUENCE.filter(field => {
      // Exclude excluded fields and custReceivables fields
      if (EXCLUDED_FIELDS.includes(field) || CUST_RECEIVABLES_FIELDS.includes(field)) {
        return false;
      }
      // For ar-report, exclude history-only fields
      if (reportType === 'ar-report' && HISTORY_ONLY_FIELDS.includes(field)) {
        return false;
      }
      return true;
    });
  }, [reportType]);

  // Get available custReceivables fields (only if toggle is enabled)
  const availableCustReceivablesFields = useMemo(() => {
    if (hasCustReceivables && showCustReceivables) {
      return CUST_RECEIVABLES_FIELDS;
    }
    return [];
  }, [hasCustReceivables, showCustReceivables]);

  // Default selected fields
  const DEFAULT_SELECTED_FIELDS = [
    'C_Number',
    'Invoice_Number',
    'AR_Type',
    'AR_Ref',
    'AR_SubTypeRef',
    'AR_Date',
    'AR_CheckDate',
    'AR_Amount',
  ];

  // Initialize all fields as selected by default, and update when availableFields change
  useEffect(() => {
    const allAvailableFields = [...availableDepositFields, ...availableCustReceivablesFields];
    if (allAvailableFields.length > 0) {
      const currentFieldKeys = Object.keys(selectedFields);
      const availableFieldKeys = allAvailableFields;
      
      // Check if we need to update (new fields added or fields removed)
      const needsUpdate = availableFieldKeys.some(field => !currentFieldKeys.includes(field)) ||
                         currentFieldKeys.some(field => !availableFieldKeys.includes(field) && !EXCLUDED_FIELDS.includes(field));
      
      if (needsUpdate || currentFieldKeys.length === 0) {
        const updatedSelectedFields: { [key: string]: boolean } = {};
        availableFieldKeys.forEach(field => {
          // Preserve existing selection if field still exists
          if (selectedFields[field] !== undefined) {
            updatedSelectedFields[field] = selectedFields[field];
          } else {
            // Set default fields to true, others to false
            updatedSelectedFields[field] = DEFAULT_SELECTED_FIELDS.includes(field);
          }
        });
        setSelectedFields(updatedSelectedFields);
      }
    }
  }, [availableDepositFields, availableCustReceivablesFields, selectedFields]);

  // Handle field toggle
  const handleFieldToggle = (field: string, checked: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  // Re-process data when toggle changes
  const reprocessData = (rawData: any[], shouldShowCustReceivables: boolean): number => {
    const sortedFetchedData = [...rawData].sort((a: any, b: any) => 
      (b.Deposit_ID || 0) - (a.Deposit_ID || 0)
    );
    
    const flattenedData: ARReportItem[] = [];
    
    if (shouldShowCustReceivables) {
      // If toggle is ON, flatten with custReceivables
      sortedFetchedData.forEach((deposit: any) => {
        if (deposit.custReceivables && Array.isArray(deposit.custReceivables) && deposit.custReceivables.length > 0) {
          // Create a row for each custReceivable
          deposit.custReceivables.forEach((receivable: any) => {
            flattenedData.push({
              ...deposit,
              P_Number: receivable.P_Number,
              C_Number: receivable.C_Number,
              C_Number_Child: receivable.C_Number_Child,
              Invoice_Number: receivable.Invoice_Number,
              AR_Type: receivable.AR_Type,
              AR_SubType: receivable.AR_SubType,
              AR_POS: receivable.AR_POS,
              AR_Date: receivable.AR_Date,
              AR_CheckDate: receivable.AR_CheckDate,
              AR_Ref: receivable.AR_Ref,
              AR_Amount: receivable.AR_Amount,
              AR_Applied: receivable.AR_Applied,
              Workstation_ID: receivable.Workstation_ID,
              User_Number: receivable.User_Number,
              AR_Archived: receivable.AR_Archived,
              AR_Reconcile: receivable.AR_Reconcile,
              AR_Batch: receivable.AR_Batch,
              C_Name: receivable.customer?.C_Name,
              AR_SubTypeRef: receivable.arDefinition?.AR_SubTypeRef,
            });
          });
        } else {
          // If no custReceivables, just add the deposit row
          flattenedData.push(deposit);
        }
      });
    } else {
      // If toggle is OFF, only show deposit-level data (one row per deposit)
      sortedFetchedData.forEach((deposit: any) => {
        flattenedData.push(deposit);
      });
    }
    
    // Sort flattened data by Deposit_ID (descending) to keep deposits grouped
    flattenedData.sort((a, b) => (b.Deposit_ID || 0) - (a.Deposit_ID || 0));
    
    setReportData(flattenedData);
    setPreviewData(flattenedData);
    setPreviewPage(0);
    
    return flattenedData.length;
  };

  // Group data based on groupBy option
  interface GroupedDataItem {
    type: 'group-header' | 'row';
    groupKey?: string;
    data?: ARReportItem;
    items?: ARReportItem[];
  }

  const groupData = useCallback((data: ARReportItem[]): GroupedDataItem[] => {
    if (groupBy === 'none') {
      return data.map(item => ({ type: 'row' as const, data: item }));
    }

    const result: GroupedDataItem[] = [];

    // Helper function to format date
    const formatDate = (dateStr: string | null | undefined): string => {
      if (!dateStr) return 'No Date';
      try {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch {
        return 'No Date';
      }
    };

    // Helper function to group by date field
    const groupByDateField = (fieldName: 'AR_Date' | 'AR_CheckDate' | 'Deposit_Date' | 'QB_TransferDate' | 'Deposit_DeleteDate', label: string) => {
      const grouped: { [key: string]: ARReportItem[] } = {};
      data.forEach(item => {
        const dateValue = (item as any)[fieldName];
        const dateKey = formatDate(dateValue);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
      });

      // Sort dates descending
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'No Date') return 1;
        if (b === 'No Date') return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      });

      sortedKeys.forEach(key => {
        result.push({ type: 'group-header', groupKey: `${label}: ${key}`, items: grouped[key] });
        grouped[key].forEach(item => {
          result.push({ type: 'row', data: item });
        });
      });
    };

    if (groupBy === 'ar-date') {
      // Group by AR_Date
      groupByDateField('AR_Date', 'AR Date');
    } else if (groupBy === 'ar-check-date') {
      // Group by AR_CheckDate
      groupByDateField('AR_CheckDate', 'AR Check Date');
    } else if (groupBy === 'deposit-date') {
      // Group by Deposit_Date
      groupByDateField('Deposit_Date', 'Deposit Date');
    } else if (groupBy === 'qb-transfer-date') {
      // Group by QB_TransferDate
      groupByDateField('QB_TransferDate', 'QB Transfer Date');
    } else if (groupBy === 'deposit-delete-date') {
      // Group by Deposit_DeleteDate
      groupByDateField('Deposit_DeleteDate', 'Deposit Delete Date');
    } else if (groupBy === 'deposit-id') {
      // Group by Deposit_ID
      const grouped: { [key: string]: ARReportItem[] } = {};
      data.forEach(item => {
        const depositKey = String(item.Deposit_ID || 'No Deposit ID');
        if (!grouped[depositKey]) {
          grouped[depositKey] = [];
        }
        grouped[depositKey].push(item);
      });

      // Sort deposit IDs descending
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'No Deposit ID') return 1;
        if (b === 'No Deposit ID') return -1;
        return Number(b) - Number(a);
      });

      sortedKeys.forEach(key => {
        const firstItem = grouped[key][0];
        const depositRef = firstItem.Deposit_Reference || 'No Reference';
        const depositDate = formatDate(firstItem.Deposit_Date);
        result.push({ 
          type: 'group-header', 
          groupKey: `Deposit ID: ${key} - ${depositRef} (${depositDate})`, 
          items: grouped[key] 
        });
        grouped[key].forEach(item => {
          result.push({ type: 'row', data: item });
        });
      });
    }

    return result;
  }, [groupBy]);

  // Handle preview
  const handlePreview = async () => {
    // Dates are required for AR Report
    if (reportType === 'ar-report' && (!startDate || !endDate)) {
      toast.error('Please select both start date and end date');
      return;
    }

    setPreviewLoading(true);
    try {
      let fetchedData: any[] = [];
      
      if (reportType === 'ar-report-history') {
        // Fetch AR Report History - no filters (only for history, not regular report)
        const response = await getARreportsHistory() as any;
        const data = response?.data?.data?.data || response?.data?.data || response?.data || response || [];
        fetchedData = Array.isArray(data) ? data : [];
        // Store raw data for history
        setRawFetchedData(fetchedData);
      } else {
        // For AR Report, use already-fetched data from useEffect (no API call needed)
        if (rawFetchedData.length === 0) {
          // Only fetch if we don't have data yet (shouldn't happen if dates are selected)
          const startDateStr = startDate!.format('YYYY-MM-DD');
          const endDateStr = endDate!.format('YYYY-MM-DD');
          fetchedData = await loadARReportsData(startDateStr, endDateStr);
          setRawFetchedData(fetchedData);
        } else {
          // Use existing fetched data
          fetchedData = rawFetchedData;
        }
      }

      // Apply frontend filters
      const filteredData = applyFrontendFilters(fetchedData);
      
      // Check if any deposit has custReceivables (after filtering)
      const hasReceivables = filteredData.some((deposit: any) => 
        deposit.custReceivables && Array.isArray(deposit.custReceivables) && deposit.custReceivables.length > 0
      );
      setHasCustReceivables(hasReceivables);
      
      // Determine toggle state: if receivables found, turn on by default (user can turn it off if needed)
      let shouldShowCustReceivables = showCustReceivables;
      if (hasReceivables && !showCustReceivables) {
        shouldShowCustReceivables = true;
        setShowCustReceivables(true);
      }
      
      // If no receivables found, turn off the toggle
      if (!hasReceivables && showCustReceivables) {
        shouldShowCustReceivables = false;
        setShowCustReceivables(false);
      }
      
      // Process and flatten the filtered data based on toggle state
      const recordCount = reprocessData(filteredData, shouldShowCustReceivables && hasReceivables);
      
      setShowPreview(true);
      setPreviewPage(0);
      
      if (filteredData.length === 0) {
        // Reset custReceivables state when no data found
        setHasCustReceivables(false);
        setShowCustReceivables(false);
        toast.success('No data found for the selected criteria');
      } else {
        toast.success(`Loaded ${recordCount} record(s)`);
      }
    } catch (error: any) {
      console.error('Error generating preview:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate preview');
      setReportData([]);
      setPreviewData([]);
      // Reset custReceivables state on error
      setHasCustReceivables(false);
      setShowCustReceivables(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Format field value for display
  const formatFieldValue = (item: ARReportItem, field: string): string => {
    const value = (item as any)[field];
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (field.includes('Date')) {
      if (value) {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      if (field.includes('Total') || field.includes('Amount')) {
        return value.toFixed(2);
      }
      return value.toString();
    }
    
    return String(value);
  };

  // Get grouped and paginated preview data
  const groupedPreviewData = useMemo(() => {
    return groupData(previewData);
  }, [previewData, groupData]);

  const paginatedPreviewData = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    const end = start + PREVIEW_PAGE_SIZE;
    return groupedPreviewData.slice(start, end);
  }, [groupedPreviewData, previewPage]);

  const totalPreviewPages = Math.ceil(groupedPreviewData.length / PREVIEW_PAGE_SIZE);

  // Get selected field keys (Deposit_ID always included)
  const getSelectedFieldKeys = useMemo(() => {
    const selected = Object.keys(selectedFields).filter(key => selectedFields[key]);
    return sortFieldsBySequence(['Deposit_ID', ...selected]);
  }, [selectedFields]);

  // Generate CSV with grouping support
  const handleGenerateCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingReport(true);
    try {
      const selectedFieldKeys = getSelectedFieldKeys;
      const headers = selectedFieldKeys.map(field => FIELD_LABELS[field] || field);
      const csvHeaders = headers.join(',');
      
      // Get grouped data
      const groupedData = groupData(reportData);
      
      const rows: string[] = [];
      groupedData.forEach(item => {
        if (item.type === 'group-header') {
          // Add group header row
          rows.push(`"${item.groupKey || ''}",${''.repeat(selectedFieldKeys.length - 1).split('').map(() => '""').join(',')}`);
        } else if (item.data) {
          // Add data row
          const row = selectedFieldKeys.map(field => {
            const value = formatFieldValue(item.data!, field);
            return `"${value.replace(/"/g, '""')}"`;
          }).join(',');
          rows.push(row);
        }
      });
      
      const csvContent = [csvHeaders, ...rows].join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ar-report-${reportType === 'ar-report-history' ? 'history' : 'report'}-${timestamp}.csv`;
      
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

  // Generate PDF with improved UI using jspdf-autotable
  const handleGeneratePDF = async () => {
    if (reportData.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const selectedFieldKeys = getSelectedFieldKeys;
      
      // Use landscape for 8+ columns, portrait for less than 8
      const numColumns = selectedFieldKeys.length;
      const orientation = numColumns >= 8 ? 'landscape' : 'portrait';
      const doc = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      let yPos = 15;
      
      // Get distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';
      
      // Headers
      const headers = selectedFieldKeys.map(field => FIELD_LABELS[field] || field);
      
      // Generate table using autoTable (v5+ uses function call instead of method)
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      
      // Common footer function with page count
      const addFooter = (pageNum: number, totalPagesCount: number) => {
        const currentPageHeight = doc.internal.pageSize.getHeight();
        const footerY = currentPageHeight - 5;
        
        // Report generated text with logo on left
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
        
        // Page count on right
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const pageText = `${pageNum} of ${totalPagesCount}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
      };
      
      // Draw header with distributor details on left
      const drawHeader = () => {
        // Distributor details on left
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        let leftY = yPos;
        
        if (distributorName) {
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
        doc.setTextColor(0, 0, 0);
        doc.text(
          reportType === 'ar-report-history' ? 'AR Report History' : 'AR Report',
          pageWidth / 2,
          yPos + 5,
          { align: 'center' }
        );
        
        // Date range and group by info on right
        let rightY = yPos;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const rightX = pageWidth - margin;
        
        if (reportType === 'ar-report' && startDate && endDate) {
          doc.text(
            `Date Range: ${startDate.format('MM/DD/YYYY')} - ${endDate.format('MM/DD/YYYY')}`,
            rightX,
            rightY,
            { align: 'right' }
          );
          rightY += 3.5;
        }
        
        if (groupBy !== 'none') {
          const groupByTextMap: { [key: string]: string } = {
            'ar-date': 'AR Date',
            'ar-check-date': 'AR Check Date',
            'deposit-date': 'Deposit Date',
            'deposit-id': 'Deposit ID',
            'qb-transfer-date': 'QB Transfer Date',
            'deposit-delete-date': 'Deposit Delete Date',
          };
          const groupByText = groupByTextMap[groupBy] || 'Grouped';
          doc.text(`Grouped by: ${groupByText}`, rightX, rightY, { align: 'right' });
        }
      };
      
      // Draw initial header
      drawHeader();
      yPos = 25;
      
      // Common table styles - smaller fonts and padding
      const tableStyles = {
        fontSize: 6.5,
        cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
        overflow: 'linebreak' as const,
        cellWidth: 'wrap' as const,
        lineColor: [200, 200, 200] as [number, number, number],
        lineWidth: 0.1,
        textColor: [0, 0, 0] as [number, number, number],
        fillColor: [255, 255, 255] as [number, number, number],
      };
      
      const headStyles = {
        fillColor: [70, 70, 70] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold' as const,
        fontSize: 7,
        lineColor: [50, 50, 50] as [number, number, number],
        lineWidth: 0.2,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      };
      
      const alternateRowStyles = {
        fillColor: [248, 248, 248] as [number, number, number],
      };
      
      // Helper function to check if we need a new page
      const checkPageBreak = (requiredHeight: number) => {
        const bottomMargin = 12;
        const availableHeight = pageHeight - yPos - bottomMargin;
        
        if (requiredHeight > availableHeight && yPos > 15) {
          doc.addPage();
          yPos = 15;
          drawHeader();
          yPos = 25;
          return true;
        }
        return false;
      };
      
      // If grouping is enabled, generate grouped tables
      if (groupBy !== 'none') {
        const groupedData = groupData(reportData);
        const groupedSections: { [key: string]: ARReportItem[] } = {};
        let currentGroupKey = '';
        
        groupedData.forEach((item) => {
          if (item.type === 'group-header') {
            currentGroupKey = item.groupKey || '';
            if (item.items) {
              groupedSections[currentGroupKey] = item.items;
            }
          }
        });
        
        // Generate grouped tables with smart page breaks
        Object.keys(groupedSections).forEach((groupKey, groupIdx) => {
          if (groupIdx > 0) {
            const groupHeaderHeight = 6;
            const tableHeaderHeight = 5;
            const minRowsHeight = 8;
            const requiredHeight = groupHeaderHeight + tableHeaderHeight + minRowsHeight;
            checkPageBreak(requiredHeight);
          }
          
          // Group header
          const groupHeaderHeight = 6;
          const headerBgColor = [235, 235, 235];
          doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
          doc.rect(margin, yPos - 1.5, pageWidth - 2 * margin, groupHeaderHeight, 'F');
          
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.2);
          doc.rect(margin, yPos - 1.5, pageWidth - 2 * margin, groupHeaderHeight, 'S');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(groupKey, margin + 2, yPos + 2);
          yPos += groupHeaderHeight + 2;
          
          // Table for this group
          const groupRows = groupedSections[groupKey].map(item => 
            selectedFieldKeys.map(field => formatFieldValue(item, field))
          );
          
          autoTableFn(doc, {
            head: [headers],
            body: groupRows,
            startY: yPos,
            margin: { left: margin, right: margin },
            styles: tableStyles,
            headStyles: headStyles,
            alternateRowStyles: alternateRowStyles,
            showHead: 'everyPage',
            showFoot: 'never',
            columnStyles: selectedFieldKeys.reduce((acc: any, field, idx) => {
              // Set all columns to auto width, with right alignment for numeric fields
              if (field.includes('Total') || field.includes('Amount') || field.includes('ID') && field !== 'Deposit_ID') {
                acc[idx] = { cellWidth: 'auto', halign: 'right' };
              } else {
                acc[idx] = { cellWidth: 'auto' };
              }
              return acc;
            }, {}),
            didDrawPage: () => {
              // Footer will be added at the end with correct total page count
            },
            didParseCell: (data: any) => {
              if (data.section === 'head') {
                data.cell.styles.fillColor = [70, 70, 70];
                data.cell.styles.textColor = [255, 255, 255];
              }
            },
          });
          
          yPos = (doc as any).lastAutoTable.finalY || yPos + 10;
          yPos += 2;
        });
      } else {
        // No grouping - generate single table
        const tableBody = reportData.map(item => 
          selectedFieldKeys.map(field => formatFieldValue(item, field))
        );
        
        autoTableFn(doc, {
          head: [headers],
          body: tableBody,
          startY: yPos,
          margin: { left: margin, right: margin },
          styles: tableStyles,
          headStyles: headStyles,
          alternateRowStyles: alternateRowStyles,
          showHead: 'everyPage',
          showFoot: 'never',
          columnStyles: selectedFieldKeys.reduce((acc: any, field, idx) => {
            // Set all columns to auto width, with right alignment for numeric fields
            if (field.includes('Total') || field.includes('Amount') || field.includes('ID') && field !== 'Deposit_ID') {
              acc[idx] = { cellWidth: 'auto', halign: 'right' };
            } else {
              acc[idx] = { cellWidth: 'auto' };
            }
            return acc;
          }, {}),
          didDrawPage: () => {
            // Footer will be added at the end with correct total page count
          },
          didParseCell: (data: any) => {
            if (data.section === 'head') {
              data.cell.styles.fillColor = [70, 70, 70];
              data.cell.styles.textColor = [255, 255, 255];
            }
          },
        });
      }
      
      // Get final page count and update all footers
      const finalPageCount = (doc as any).internal.pages.length;
      for (let i = 1; i <= finalPageCount; i++) {
        doc.setPage(i);
        addFooter(i, finalPageCount);
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ar-report-${reportType === 'ar-report-history' ? 'history' : 'report'}-${timestamp}.pdf`;
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
            AR Report Configuration
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
              {/* Report Type Selection */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Report Type
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={reportType}
                      onChange={(e) => {
                        const newReportType = e.target.value as 'ar-report' | 'ar-report-history';
                        setReportType(newReportType);
                        setReportData([]);
                        setPreviewData([]);
                        setRawFetchedData([]);
                        setShowPreview(false);
                        
                        // Set default dates (1 week) for AR Report, clear for History
                        if (newReportType === 'ar-report') {
                          setStartDate(dayjs().subtract(7, 'day'));
                          setEndDate(dayjs());
                        } else {
                          setStartDate(null);
                          setEndDate(null);
                        }
                        
                        // Reset filters when switching report types
                        setSelectedARTypes([]);
                        setSelectedDepositIds([]);
                        setSelectedTransactionSources([]);
                        setSelectedUserIds([]);
                        // Reset custReceivables toggle
                        setShowCustReceivables(false);
                        setHasCustReceivables(false);
                        // Clear selected fields when switching report types
                        setSelectedFields({});
                        
                        // Reset groupBy if current option is not valid for new report type
                        if (newReportType === 'ar-report') {
                          // AR Report doesn't support qb-transfer-date or deposit-delete-date
                          if (groupBy === 'qb-transfer-date' || groupBy === 'deposit-delete-date') {
                            setGroupBy('none');
                          }
                        } else if (newReportType === 'ar-report-history') {
                          // AR Report History doesn't support ar-date, ar-check-date, or deposit-id
                          if (groupBy === 'ar-date' || groupBy === 'ar-check-date' || groupBy === 'deposit-id') {
                            setGroupBy('none');
                          }
                        }
                      }}
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
                      <MenuItem value="ar-report" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                        AR Report
                      </MenuItem>
                      <MenuItem value="ar-report-history" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                        AR Report History
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                

                {/* Date Filters for AR Report */}
                {reportType === 'ar-report' && (
                  <>
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

                    {/* AR Type Filter */}
                    {filterOptions.typeSelect.length > 0 && (
                      <Box sx={{ mb: 1.25 }}>
                        <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          AR Type
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            multiple
                            value={selectedARTypes}
                            onChange={(e) => {
                              const values = e.target.value as string[];
                              setSelectedARTypes(values);
                            }}
                            disabled={previewLoading || loadingFilters}
                            displayEmpty
                            renderValue={(selected) => {
                              if (selected.length === 0) {
                                return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Types</Typography>;
                              }
                              return (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                      {value}
                                    </Typography>
                                  ))}
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
                            <MenuItem 
                              value="None"
                              sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                            >
                              <Checkbox
                                checked={selectedARTypes.includes('None')}
                                size="small"
                                sx={{ 
                                  py: 0,
                                  '& .MuiSvgIcon-root': { fontSize: '1rem' }
                                }}
                              />
                              <em>None</em>
                            </MenuItem>
                            <MenuItem 
                              value="Date"
                              sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                            >
                              <Checkbox
                                checked={selectedARTypes.includes('Date')}
                                size="small"
                                sx={{ 
                                  py: 0,
                                  '& .MuiSvgIcon-root': { fontSize: '1rem' }
                                }}
                              />
                              Date
                            </MenuItem>
                            {filterOptions.typeSelect.map((type) => (
                              <MenuItem 
                                key={type.AR_Type} 
                                value={type.AR_Type}
                                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                              >
                                <Checkbox
                                  checked={selectedARTypes.includes(type.AR_Type)}
                                  size="small"
                                  sx={{ 
                                    py: 0,
                                    '& .MuiSvgIcon-root': { fontSize: '1rem' }
                                  }}
                                />
                                {type.AR_Type}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {/* Deposit ID Filter */}
                    {filterOptions.depositeID.length > 0 && (
                      <Box sx={{ mb: 1.25 }}>
                        <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Deposit ID
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            multiple
                            value={selectedDepositIds.map(String)}
                            onChange={(e) => {
                              const values = e.target.value as string[];
                              setSelectedDepositIds(values.map(Number));
                            }}
                            disabled={previewLoading || loadingFilters}
                            displayEmpty
                            renderValue={(selected) => {
                              if (selected.length === 0) {
                                return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Deposits</Typography>;
                              }
                              return (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  <Typography sx={{ fontSize: '0.7rem' }}>
                                    {selected.length} selected
                                  </Typography>
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
                            {filterOptions.depositeID.map((deposit) => (
                              <MenuItem 
                                key={deposit.Deposit_ID} 
                                value={String(deposit.Deposit_ID)}
                                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                              >
                                <Checkbox
                                  checked={selectedDepositIds.includes(deposit.Deposit_ID)}
                                  size="small"
                                  sx={{ 
                                    py: 0,
                                    '& .MuiSvgIcon-root': { fontSize: '1rem' }
                                  }}
                                />
                                {deposit.Deposit_ID} - {deposit.Deposit_Reference || 'No Reference'} ({new Date(deposit.Deposit_Date).toLocaleDateString()})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {/* Transaction Source Filter */}
                    {filterOptions.transactionSource.length > 0 && (
                      <Box sx={{ mb: 1.25 }}>
                        <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Transaction Source
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            multiple
                            value={selectedTransactionSources.map(String)}
                            onChange={(e) => {
                              const values = e.target.value as string[];
                              setSelectedTransactionSources(values.map(v => v === 'true'));
                            }}
                            disabled={previewLoading || loadingFilters}
                            displayEmpty
                            renderValue={(selected) => {
                              if (selected.length === 0) {
                                return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Sources</Typography>;
                              }
                              return (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                                      {value === 'true' ? 'POS' : 'Non-POS'}
                                    </Typography>
                                  ))}
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
                            {(() => {
                              // Get unique transaction sources (true and false)
                              const uniqueSources = Array.from(
                                new Set(filterOptions.transactionSource.map(s => s.AR_POS))
                              );
                              return uniqueSources.map((arPos, idx) => (
                                <MenuItem 
                                  key={idx} 
                                  value={String(arPos)}
                                  sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                                >
                                  <Checkbox
                                    checked={selectedTransactionSources.includes(arPos)}
                                    size="small"
                                    sx={{ 
                                      py: 0,
                                      '& .MuiSvgIcon-root': { fontSize: '1rem' }
                                    }}
                                  />
                                  {arPos ? 'POS' : 'Non-POS'}
                                </MenuItem>
                              ));
                            })()}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {/* User Filter */}
                    {filterOptions.users.length > 0 && (
                      <Box sx={{ mb: 1.25 }}>
                        <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          User
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            multiple
                            value={selectedUserIds.map(String)}
                            onChange={(e) => {
                              const values = e.target.value as string[];
                              setSelectedUserIds(values.map(Number));
                            }}
                            disabled={previewLoading || loadingFilters}
                            displayEmpty
                            renderValue={(selected) => {
                              if (selected.length === 0) {
                                return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Users</Typography>;
                              }
                              return (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  <Typography sx={{ fontSize: '0.7rem' }}>
                                    {selected.length} selected
                                  </Typography>
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
                            {filterOptions.users.map((user) => (
                              <MenuItem 
                                key={user.UserNumber} 
                                value={String(user.UserNumber)}
                                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                              >
                                <Checkbox
                                  checked={selectedUserIds.includes(user.UserNumber)}
                                  size="small"
                                  sx={{ 
                                    py: 0,
                                    '& .MuiSvgIcon-root': { fontSize: '1rem' }
                                  }}
                                />
                                {user.UserName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </>
                )}
                
                {/* Date Filters for AR Report History - Frontend filtering by Deposit Date */}
                {reportType === 'ar-report-history' && (
                  <>
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
                  </>
                )}
                
                {/* Group By Option */}
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Group By
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={groupBy || 'none'}
                      onChange={(e) => {
                        const newGroupBy = e.target.value as 'none' | 'ar-date' | 'ar-check-date' | 'deposit-date' | 'deposit-id' | 'qb-transfer-date' | 'deposit-delete-date';
                        
                        // Validate that the selected option is valid for current report type
                        let isValid = true;
                        
                        if (reportType === 'ar-report') {
                          // AR Report: Only allow ar-date, ar-check-date, deposit-date, deposit-id, none
                          if (newGroupBy === 'qb-transfer-date' || newGroupBy === 'deposit-delete-date') {
                            // Invalid option for AR Report, reset to none
                            isValid = false;
                          }
                        } else if (reportType === 'ar-report-history') {
                          // AR Report History: Only allow qb-transfer-date, deposit-delete-date, deposit-date, none (deposit-id is disabled)
                          if (newGroupBy === 'ar-date' || newGroupBy === 'ar-check-date' || newGroupBy === 'deposit-id') {
                            // Invalid option for AR Report History, reset to none
                            isValid = false;
                          }
                        }
                        
                        // Set the valid groupBy value or reset to none if invalid
                        setGroupBy(isValid ? newGroupBy : 'none');
                        
                        // If invalid, don't proceed with rest of logic
                        if (!isValid) {
                          return;
                        }
                        
                        // Auto-enable custReceivables if AR Date or AR Check Date is selected
                        // These fields are only available when custReceivables is enabled
                        if (newGroupBy === 'ar-date' || newGroupBy === 'ar-check-date') {
                          if (hasCustReceivables && !showCustReceivables) {
                            setShowCustReceivables(true);
                            // Re-process data if we have raw data and preview is shown
                            if (rawFetchedData.length > 0 && showPreview) {
                              const filteredData = applyFrontendFilters(rawFetchedData);
                              reprocessData(filteredData, true);
                            }
                          }
                          // If data is not loaded yet, the grouping will work once data is loaded and has custReceivables
                        }
                      }}
                      disabled={previewLoading}
                      displayEmpty={false}
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
                      <MenuItem key="none" value="none" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                        None
                      </MenuItem>
                      <MenuItem 
                        key="ar-date"
                        value="ar-date" 
                        disabled={reportType === 'ar-report-history'}
                        sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                      >
                        AR Date
                      </MenuItem>
                      <MenuItem 
                        key="ar-check-date"
                        value="ar-check-date" 
                        disabled={reportType === 'ar-report-history'}
                        sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                      >
                        AR Check Date
                      </MenuItem>
                      <MenuItem key="deposit-date" value="deposit-date" sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}>
                        Deposit Date
                      </MenuItem>
                      <MenuItem 
                        key="qb-transfer-date" 
                        value="qb-transfer-date" 
                        disabled={reportType === 'ar-report'}
                        sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                      >
                        QB Transfer Date
                      </MenuItem>
                      <MenuItem 
                        key="deposit-delete-date" 
                        value="deposit-delete-date" 
                        disabled={reportType === 'ar-report'}
                        sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                      >
                        Deposit Delete Date
                      </MenuItem>
                      <MenuItem 
                        key="deposit-id" 
                        value="deposit-id" 
                        disabled={reportType === 'ar-report-history'}
                        sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
                      >
                        Deposit ID
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Right Column - Field Selection */}
              <Grid size={{ xs: 12, md: 9 }}>
                {/* CustReceivables Section - Separate at top */}
                {hasCustReceivables && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cust Receivables
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        backgroundColor: showCustReceivables
                          ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.06)')
                          : 'transparent',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: showCustReceivables ? 600 : 400,
                          color: showCustReceivables ? 'primary.main' : 'text.secondary',
                          transition: 'all 0.15s ease',
                          flex: 1,
                        }}
                      >
                        Show custReceivables fields
                      </Typography>
                      <Switch
                        size="small"
                        checked={showCustReceivables}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setShowCustReceivables(newValue);
                          
                          // When disabling, unselect all custReceivables fields
                          if (!newValue) {
                            setSelectedFields(prev => {
                              const updated = { ...prev };
                              CUST_RECEIVABLES_FIELDS.forEach(field => {
                                delete updated[field];
                              });
                              return updated;
                            });
                          }
                          
                          // Re-process data if we have raw data and preview is shown
                          if (rawFetchedData.length > 0 && showPreview) {
                            // Apply frontend filters before reprocessing
                            const filteredData = applyFrontendFilters(rawFetchedData);
                            reprocessData(filteredData, newValue && hasCustReceivables);
                          }
                        }}
                        disabled={previewLoading || !hasCustReceivables}
                      />
                    </Box>
                    
                    {/* CustReceivables Fields Section */}
                    {showCustReceivables && availableCustReceivablesFields.length > 0 && (
                      <Box sx={{ mt: 1.5, pl: 0.5 }}>
                        <Box sx={{ 
                          maxHeight: '200px',
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
                            {availableCustReceivablesFields.map((field) => (
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
                                  />
                                  <Typography 
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      fontWeight: selectedFields[field] ? 500 : 400,
                                      color: selectedFields[field] ? 'primary.main' : 'text.secondary',
                                      transition: 'all 0.15s ease',
                                      flex: 1,
                                      ml: 1,
                                    }}
                                  >
                                    {FIELD_LABELS[field] || field}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Regular Fields Section */}
                {availableDepositFields.length > 0 ? (
                  <>
                    <Typography variant="caption" sx={{ mb: 0.5, pl: 0.5, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Select Fields
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 0.6, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                      Deposit ID always included
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
                        {availableDepositFields.map((field) => (
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
                ) : (
                  <Typography variant="caption" sx={{ mb: 0.6, pl: 0.5, fontSize: '0.65rem', display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                    Deposit ID always included
                  </Typography>
                )}
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
              {reportType === 'ar-report-history' ? 'AR Report History' : 'AR Report'} Preview
            </Typography>
            
            {reportType === 'ar-report' && startDate && endDate && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Date Range: {startDate.format('MM/DD/YYYY')} - {endDate.format('MM/DD/YYYY')}
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
                    '& .MuiTableHead-root .MuiTableRow-root': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 100,
                    },
                  }}>
                    <TableHead>
                      <TableRow>
                        {getSelectedFieldKeys.map((field) => (
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
                          return (
                            <TableRow key={`group-${item.groupKey}-${idx}`}>
                              <TableCell
                                colSpan={getSelectedFieldKeys.length}
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
                                {item.groupKey}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={`${item.data?.Deposit_ID}-${item.data?.Invoice_Number || idx}-${idx}`} hover>
                            {getSelectedFieldKeys.map((field) => (
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
                      sx={{
                        '& .MuiPaginationItem-root.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        },
                      }}
                    />
                  </Box>
                )}

                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                  {(() => {
                    // Count only actual data rows (not group headers) in the current page
                    const dataRowsInCurrentPage = paginatedPreviewData.filter(item => item.type === 'row').length;
                    
                    // Count total data rows (not group headers) across all pages
                    const totalDataRows = groupedPreviewData.filter(item => item.type === 'row').length;
                    
                    // Calculate the range of data rows shown
                    // Count data rows before current page
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
              disabled={previewLoading || dateChangeLoading || !endDate || (reportType === 'ar-report' && !startDate)}
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
                // Keep hasCustReceivables and showCustReceivables so fields remain available
                // They will be reset when switching report types or on new preview
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

export default ARReportTab;
