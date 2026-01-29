import React, { useState, useMemo, useCallback, useEffect } from 'react';
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

interface TransactionRow {
  type: 'transaction' | 'subtype-total' | 'deposit-total' | 'deposit-header' | 'history-total';
  Deposit_ID?: number;
  Deposit_Date?: string;
  Deposit_Reference?: string;
  Type?: string;
  Subtype?: string;
  Reference?: string;
  Customer_Number?: number;
  Customer_Name?: string;
  User?: number;
  Lane_ID?: number;
  Check_Date?: string;
  Posting_Date?: string;
  Amount?: number;
  Payment_Total?: number;
  Adjustment_Total?: number;
  ReturnCheck_Total?: number;
  label?: string;
}

// Format amounts: positive normal, negative in parentheses
const formatAmount = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const numValue = Number(value);
  if (isNaN(numValue)) return '';
  if (numValue < 0) {
    return `(${Math.abs(numValue).toFixed(2)})`;
  }
  return numValue.toFixed(2);
};

// Format date
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

const ARReportTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  // Report type selection
  const [reportType, setReportType] = useState<'ar-report' | 'ar-report-history'>('ar-report');
  
  // Date filters - default to 1 week ago to today
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Filter states
  const [selectedARTypes, setSelectedARTypes] = useState<string[]>([]);
  const [selectedDepositIds, setSelectedDepositIds] = useState<number[]>([]);
  const [selectedTransactionSources, setSelectedTransactionSources] = useState<boolean[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  
  // Filter options
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
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Data states
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<TransactionRow[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 500;
  
  // PDF/CSV generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load AR reports data
  const loadARReportsData = useCallback(async (startDateStr?: string, endDateStr?: string): Promise<any[]> => {
    try {
      const response = await getARreports(startDateStr, endDateStr) as any;
      const data = response?.data?.data?.data || response?.data?.data || response?.data || response || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading AR reports data:', error);
      return [];
    }
  }, []);

  // Load filter options from getListOfARreports API
  const loadFilterOptions = useCallback(async () => {
    if (reportType !== 'ar-report') return;
    
    setLoadingFilters(true);
    try {
      const response = await getListOfARreports() as any;
      console.log('getListOfARreports response:', response);
      console.log('getListOfARreports data:', response?.data);
      
      const responseData = response?.data?.data || response?.data || response || {};
      
      const options = {
        typeSelect: [] as Array<{ AR_Type: string }>,
        depositeID: [] as Array<{ Deposit_ID: number; Deposit_Date: string; Deposit_Reference: string }>,
        transactionSource: [] as Array<{ AR_POS: boolean }>,
        users: [] as Array<{ UserNumber: number; UserName: string }>,
      };

      // Extract typeSelect
      if (responseData?.typeSelect && Array.isArray(responseData.typeSelect)) {
        options.typeSelect = responseData.typeSelect.map((type: any) => ({
          AR_Type: type.AR_Type || type
        })).sort((a: { AR_Type: string }, b: { AR_Type: string }) => a.AR_Type.localeCompare(b.AR_Type));
      }

      // Extract depositeID
      if (responseData?.depositeID && Array.isArray(responseData.depositeID)) {
        options.depositeID = responseData.depositeID.map((deposit: any) => ({
          Deposit_ID: deposit.Deposit_ID || deposit.DepositID || deposit,
          Deposit_Date: deposit.Deposit_Date || deposit.DepositDate || '',
          Deposit_Reference: deposit.Deposit_Reference || deposit.DepositReference || '',
        })).sort((a: { Deposit_ID: number }, b: { Deposit_ID: number }) => (b.Deposit_ID || 0) - (a.Deposit_ID || 0));
      }

      // Extract transactionSource
      if (responseData?.transactionSource && Array.isArray(responseData.transactionSource)) {
        options.transactionSource = responseData.transactionSource.map((source: any) => ({
          AR_POS: source.AR_POS !== undefined ? source.AR_POS : source
        }));
      }

      // Extract users
      if (responseData?.users && Array.isArray(responseData.users)) {
        options.users = responseData.users.map((user: any) => ({
          UserNumber: user.UserNumber || user.User_Number || 0,
          UserName: user.UserName || user.User_Name || `User ${user.UserNumber || user.User_Number || ''}`,
        })).sort((a: { UserNumber: number }, b: { UserNumber: number }) => (a.UserNumber || 0) - (b.UserNumber || 0));
      }

      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  }, [reportType]);

  // Load filter options when component mounts or when switching to AR Report
  useEffect(() => {
    if (reportType === 'ar-report') {
      loadFilterOptions();
    } else {
      // Clear filter options when switching to history
      setFilterOptions({
        typeSelect: [],
        depositeID: [],
        transactionSource: [],
        users: [],
      });
    }
  }, [reportType, loadFilterOptions]);

  // Auto-update date filters when Deposit IDs are selected
  useEffect(() => {
    if (selectedDepositIds.length === 0) {
      // If no deposits selected, don't modify dates (keep user's selection)
      return;
    }

    // Get selected deposits from filter options
    const selectedDeposits = filterOptions.depositeID.filter(deposit => 
      selectedDepositIds.includes(deposit.Deposit_ID)
    );

    if (selectedDeposits.length === 0) {
      return;
    }

    // Extract dates and convert to dayjs
    const depositDates = selectedDeposits
      .map(deposit => {
        if (!deposit.Deposit_Date) return null;
        return dayjs(deposit.Deposit_Date);
      })
      .filter((date): date is Dayjs => date !== null);

    if (depositDates.length === 0) {
      return;
    }

    // Find earliest and latest dates
    const sortedDates = depositDates.sort((a, b) => a.valueOf() - b.valueOf());
    const earliestDate = sortedDates[0];
    const latestDate = sortedDates[sortedDates.length - 1];

    // If only one deposit selected, set both dates to the same date
    if (selectedDeposits.length === 1) {
      setStartDate(earliestDate);
      setEndDate(earliestDate);
    } else {
      // If multiple deposits selected, set start to earliest and end to latest
      setStartDate(earliestDate);
      setEndDate(latestDate);
    }
  }, [selectedDepositIds, filterOptions.depositeID]);

  // Process data for AR Report History (simple table format)
  const processHistoryData = useCallback((data: any[]): TransactionRow[] => {
    // Filter by date if dates are selected
    let filteredData = [...data];
    if (startDate && endDate) {
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');
      
      filteredData = filteredData.filter((deposit: any) => {
        if (!deposit.Deposit_Date) return false;
        const depositDate = new Date(deposit.Deposit_Date);
        const depositDateStr = depositDate.toISOString().split('T')[0];
        return depositDateStr >= startDateStr && depositDateStr <= endDateStr;
      });
    }
    
    // Sort by Deposit Date descending, then Deposit ID descending
    filteredData.sort((a: any, b: any) => {
      const dateA = new Date(a.Deposit_Date || 0).getTime();
      const dateB = new Date(b.Deposit_Date || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.Deposit_ID || 0) - (a.Deposit_ID || 0);
    });

    // Calculate totals
    let totalPayments = 0;
    let totalAdjustments = 0;
    let totalReturnChecks = 0;

    const rows: TransactionRow[] = filteredData.map((deposit: any) => {
      const paymentTotal = deposit.Payment_Total || 0;
      const adjustmentTotal = deposit.Adjustment_Total || 0;
      const returnCheckTotal = deposit.ReturnCheck_Total || 0;

      totalPayments += paymentTotal;
      totalAdjustments += adjustmentTotal;
      totalReturnChecks += returnCheckTotal;

      return {
        type: 'transaction' as const,
        Deposit_ID: deposit.Deposit_ID,
        Deposit_Date: deposit.Deposit_Date,
        Deposit_Reference: deposit.Deposit_Reference,
        Payment_Total: paymentTotal,
        Adjustment_Total: adjustmentTotal,
        ReturnCheck_Total: returnCheckTotal,
      };
    });

    // Add total row at the end
    rows.push({
      type: 'history-total' as const,
      label: 'Total:',
      Payment_Total: totalPayments,
      Adjustment_Total: totalAdjustments,
      ReturnCheck_Total: totalReturnChecks,
    });

    return rows;
  }, [startDate, endDate]);

  // Apply filters to data
  const applyFilters = useCallback((data: any[]): any[] => {
    let filtered = [...data];

    // Filter by Deposit ID
    if (selectedDepositIds.length > 0) {
      filtered = filtered.filter((deposit: any) => selectedDepositIds.includes(deposit.Deposit_ID));
    }

    // Filter by AR Type, Transaction Source, and User (from custReceivables)
    if (selectedARTypes.length > 0 || selectedTransactionSources.length > 0 || selectedUserIds.length > 0) {
      filtered = filtered.map((deposit: any) => {
        if (!deposit.custReceivables || !Array.isArray(deposit.custReceivables)) {
          return deposit;
        }

        const filteredReceivables = deposit.custReceivables.filter((receivable: any) => {
          // Filter by AR Type
          if (selectedARTypes.length > 0) {
            const arType = receivable.AR_Type;
            if (!selectedARTypes.includes(arType)) {
              return false;
            }
          }

          // Filter by Transaction Source (AR_POS)
          if (selectedTransactionSources.length > 0) {
            const arPos = receivable.AR_POS;
            if (!selectedTransactionSources.includes(arPos)) {
              return false;
            }
          }

          // Filter by User
          if (selectedUserIds.length > 0) {
            const userId = receivable.User_Number;
            if (!selectedUserIds.includes(userId)) {
              return false;
            }
          }

          return true;
        });

        return {
          ...deposit,
          custReceivables: filteredReceivables,
        };
      }).filter((deposit: any) => {
        // Remove deposits with no matching receivables
        return !deposit.custReceivables || deposit.custReceivables.length > 0;
      });
    }

    return filtered;
  }, [selectedARTypes, selectedDepositIds, selectedTransactionSources, selectedUserIds]);

  // Process data for AR Report (detailed with transactions grouped by Deposit ID and subtype)
  const processReportData = useCallback((data: any[]): TransactionRow[] => {
    const rows: TransactionRow[] = [];
    
    // Apply filters
    const filteredData = applyFilters(data);
    
    // Sort by Deposit Date descending, then Deposit ID descending
    const sortedData = [...filteredData].sort((a: any, b: any) => {
      const dateA = new Date(a.Deposit_Date || 0).getTime();
      const dateB = new Date(b.Deposit_Date || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.Deposit_ID || 0) - (a.Deposit_ID || 0);
    });

    // Group by Deposit Date
    const depositsByDate: { [key: string]: any[] } = {};
    sortedData.forEach((deposit: any) => {
      const dateKey = deposit.Deposit_Date ? formatDate(deposit.Deposit_Date) : 'No Date';
      if (!depositsByDate[dateKey]) {
        depositsByDate[dateKey] = [];
      }
      depositsByDate[dateKey].push(deposit);
    });

    // Process each date group
    Object.keys(depositsByDate).sort((a, b) => {
      if (a === 'No Date') return 1;
      if (b === 'No Date') return -1;
      return new Date(b).getTime() - new Date(a).getTime();
    }).forEach((dateKey) => {
      const deposits = depositsByDate[dateKey];
      
      // Group deposits by Deposit ID
      const depositsById: { [key: number]: any[] } = {};
      deposits.forEach((deposit: any) => {
        const id = deposit.Deposit_ID;
        if (!depositsById[id]) {
          depositsById[id] = [];
        }
        depositsById[id].push(deposit);
      });

      // Process each deposit ID
      Object.keys(depositsById)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach((depositId, depositIndex) => {
          const depositGroup = depositsById[depositId];
          const firstDeposit = depositGroup[0];
          
          // Add deposit header
          rows.push({
            type: 'deposit-header',
            Deposit_ID: depositId,
            Deposit_Date: firstDeposit.Deposit_Date,
            Deposit_Reference: firstDeposit.Deposit_Reference,
            label: `Deposit ID: ${depositId}`,
          });

          let lastSubtype = '';
          
          // Process each deposit in the group (in case of duplicates)
          depositGroup.forEach((deposit: any) => {
            if (!deposit.custReceivables || !Array.isArray(deposit.custReceivables) || deposit.custReceivables.length === 0) {
              return;
            }

            // Group transactions by subtype
            const transactionsBySubtype: { [key: string]: any[] } = {};
            deposit.custReceivables.forEach((receivable: any) => {
              const subtype = receivable.arDefinition?.AR_SubTypeRef || receivable.AR_SubTypeRef || 'UNKNOWN';
              if (!transactionsBySubtype[subtype]) {
                transactionsBySubtype[subtype] = [];
              }
              transactionsBySubtype[subtype].push(receivable);
            });

            // Process each subtype
            Object.keys(transactionsBySubtype).sort().forEach((subtype) => {
              const transactions = transactionsBySubtype[subtype];
              let subtypeTotal = 0;

              // Add spacing before new subtype (except first)
              if (subtype !== lastSubtype && lastSubtype !== '') {
                rows.push({
                  type: 'transaction',
                  Deposit_ID: depositId,
                  Type: '',
                  Subtype: '',
                  Reference: '',
                  Amount: undefined,
                  label: '', // Empty row for spacing
                } as TransactionRow);
              }

              // Add transaction rows
              transactions.forEach((receivable: any) => {
                const amount = receivable.AR_Amount || 0;
                subtypeTotal += amount;

                rows.push({
                  type: 'transaction',
                  Deposit_ID: depositId,
                  Type: receivable.AR_Type || 'C',
                  Subtype: subtype,
                  Reference: receivable.AR_Ref || '',
                  Customer_Number: receivable.C_Number,
                  Customer_Name: receivable.customer?.C_Name || '',
                  User: receivable.User_Number,
                  Lane_ID: receivable.Workstation_ID,
                  Check_Date: receivable.AR_CheckDate,
                  Posting_Date: receivable.AR_Date,
                  Amount: amount,
                });
              });

              // Add subtype total
              rows.push({
                type: 'subtype-total',
                label: `Total ${subtype}:`,
                Amount: subtypeTotal,
              });
              
              lastSubtype = subtype;
            });
          });

          // Add deposit total
          const depositTotal = firstDeposit.Payment_Total || 0;
          rows.push({
            type: 'deposit-total',
            label: 'Total:',
            Amount: depositTotal,
          });
          
          // Add divider after deposit (except last)
          if (depositIndex < Object.keys(depositsById).length - 1) {
            rows.push({
              type: 'transaction',
              Deposit_ID: depositId,
              Type: '',
              Subtype: '',
              Reference: '',
              Amount: undefined,
              label: '', // Empty row for spacing
            } as TransactionRow);
          }
        });
    });

    return rows;
  }, [applyFilters]);



  // Handle preview
  const handlePreview = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start date and end date');
      return;
    }

    setPreviewLoading(true);
    try {
      let fetchedData: any[] = [];
      
      if (reportType === 'ar-report-history') {
        // Fetch AR Report History
        const response = await getARreportsHistory() as any;
        const data = response?.data?.data?.data || response?.data?.data || response?.data || response || [];
        fetchedData = Array.isArray(data) ? data : [];
      } else {
        // Fetch AR Report with date range
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        fetchedData = await loadARReportsData(startDateStr, endDateStr);
      }

      // Process data based on report type
      let processedData: TransactionRow[] = [];
      if (reportType === 'ar-report-history') {
        processedData = processHistoryData(fetchedData);
      } else {
        processedData = processReportData(fetchedData);
      }
      
      setPreviewData(processedData);
      setPreviewPage(0);
      setShowPreview(true);
      
      if (processedData.length === 0) {
        toast.success('No data found for the selected criteria');
      } else {
        toast.success(`Loaded ${processedData.length} record(s)`);
      }
    } catch (error: any) {
      console.error('Error generating preview:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate preview');
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Get paginated preview data
  const paginatedPreviewData = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    const end = start + PREVIEW_PAGE_SIZE;
    return previewData.slice(start, end);
  }, [previewData, previewPage]);

  const totalPreviewPages = Math.ceil(previewData.length / PREVIEW_PAGE_SIZE);

  // Generate CSV
  const handleGenerateCSV = () => {
    if (previewData.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingReport(true);
    try {
      const rows: string[] = [];
      
      if (reportType === 'ar-report-history') {
        // History report headers
        const headers = ['Deposit Date', 'Deposit ID', 'Deposit Reference', 'Payments', 'Adjustments', 'Returned Checks'];
        rows.push(headers.join(','));
        
        previewData.forEach(row => {
          if (row.type === 'transaction') {
            const csvRow = [
              formatDate(row.Deposit_Date),
              row.Deposit_ID?.toString() || '',
              row.Deposit_Reference || '',
              formatAmount(row.Payment_Total),
              formatAmount(row.Adjustment_Total),
              formatAmount(row.ReturnCheck_Total),
            ];
            rows.push(csvRow.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
          } else if (row.type === 'history-total') {
            const csvRow = [
              row.label || 'Total:',
              '',
              '',
              formatAmount(row.Payment_Total),
              formatAmount(row.Adjustment_Total),
              formatAmount(row.ReturnCheck_Total),
            ];
            rows.push(csvRow.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
          }
        });
      } else {
        // Detailed report headers
        const headers = ['Type', 'Subtype', 'Reference', 'Customer Number / Name', 'User', 'Lane/ID', 'Check Date', 'Posting Date', 'Amount'];
        rows.push(headers.join(','));
        
        previewData.forEach(row => {
          if (row.type === 'deposit-header') {
            rows.push(`"Deposit ID: ${row.Deposit_ID} - ${row.Deposit_Reference || ''} (${formatDate(row.Deposit_Date)})"`);
          } else if (row.type === 'transaction') {
            const customerInfo = row.Customer_Number 
              ? `${row.Customer_Number} - ${row.Customer_Name || ''}`.trim()
              : '';
            const csvRow = [
              row.Type || '',
              row.Subtype || '',
              row.Reference || '',
              customerInfo,
              row.User?.toString() || '',
              row.Lane_ID?.toString() || '',
              formatDate(row.Check_Date),
              formatDate(row.Posting_Date),
              formatAmount(row.Amount),
            ];
            rows.push(csvRow.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
          } else if (row.type === 'subtype-total' || row.type === 'deposit-total') {
            rows.push(`"${row.label || ''}",,,,,,,,"${formatAmount(row.Amount)}"`);
          }
        });
      }
      
      const csvContent = rows.join('\n');
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
      
      toast.success(`CSV report generated successfully`);
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

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (previewData.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      
      // Use portrait for all reports
      const doc = new jsPDF('portrait', 'mm', 'a4');
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
      
      // Generate table using autoTable
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      
      // Common footer function
      const addFooter = (pageNum: number, totalPagesCount: number) => {
        const footerY = pageHeight - 5;
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
        doc.text(`${pageNum} of ${totalPagesCount}`, pageWidth - margin, footerY, { align: 'right' });
      };
      
      // Draw header
      const drawHeader = () => {
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
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(
          reportType === 'ar-report-history' ? 'A/R Deposit History' : 'A/R Deposits',
          pageWidth / 2,
          yPos + 5,
          { align: 'center' }
        );
        
        if (startDate && endDate) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
          doc.text(
            `Date: ${startDate.format('MM/DD/YYYY')} - ${endDate.format('MM/DD/YYYY')}`,
            pageWidth - margin,
            yPos,
            { align: 'right' }
          );
        }
      };
      
      drawHeader();
      yPos = 25;
      
      const tableStyles = {
        fontSize: 6.5,
        cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
        overflow: 'linebreak' as const,
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
      };
      
      if (reportType === 'ar-report-history') {
        // History report - simple table
        const headers = [['Deposit Date', 'Deposit ID', 'Deposit Reference', 'Payments', 'Adjustments', 'Returned Checks']];
        const body: any[] = [];
        
        previewData.forEach(row => {
          if (row.type === 'transaction') {
            body.push([
              formatDate(row.Deposit_Date),
              row.Deposit_ID?.toString() || '',
              row.Deposit_Reference || '',
              formatAmount(row.Payment_Total),
              formatAmount(row.Adjustment_Total),
              formatAmount(row.ReturnCheck_Total),
            ]);
          } else if (row.type === 'history-total') {
            body.push([{
              content: row.label || 'Total:',
              colSpan: 3,
              styles: { halign: 'right', fontStyle: 'bold' }
            }, {
              content: formatAmount(row.Payment_Total),
              styles: { halign: 'right', fontStyle: 'bold' }
            }, {
              content: formatAmount(row.Adjustment_Total),
              styles: { halign: 'right', fontStyle: 'bold' }
            }, {
              content: formatAmount(row.ReturnCheck_Total),
              styles: { halign: 'right', fontStyle: 'bold' }
            }]);
          }
        });
          
        autoTableFn(doc, {
          head: headers,
          body: body,
          startY: yPos,
          margin: { left: margin, right: margin },
          styles: tableStyles,
          headStyles: headStyles,
          showHead: 'everyPage',
        });
              } else {
        // Detailed report - process row by row
        const body: any[] = [];
        previewData.forEach(row => {
          if (row.type === 'deposit-header') {
            const depositDate = formatDate(row.Deposit_Date);
            body.push([{
              content: `Deposit Date: ${depositDate} | Deposit ID: ${row.Deposit_ID} - ${row.Deposit_Reference || ''}`,
              colSpan: 9,
              styles: { fillColor: [235, 235, 235], fontStyle: 'bold' }
            }]);
          } else if (row.type === 'transaction' && row.Type && row.Subtype) {
            // Skip spacing rows (empty transaction rows)
            const customerInfo = row.Customer_Number 
              ? `${row.Customer_Number} - ${row.Customer_Name || ''}`.trim()
              : '';
            body.push([
              row.Type || '',
              row.Subtype || '',
              row.Reference || '',
              customerInfo,
              row.User?.toString() || '',
              row.Lane_ID?.toString() || '',
              formatDate(row.Check_Date),
              formatDate(row.Posting_Date),
              formatAmount(row.Amount),
            ]);
          } else if (row.type === 'subtype-total' || row.type === 'deposit-total') {
            body.push([{
              content: row.label || '',
              colSpan: 8,
              styles: { halign: 'right', fontStyle: 'bold' }
            }, {
              content: formatAmount(row.Amount),
              styles: { halign: 'right', fontStyle: 'bold' }
            }]);
          }
        });
        
        const headers = [['Type', 'Subtype', 'Reference', 'Customer Number / Name', 'User', 'Lane/ID', 'Check Date', 'Posting Date', 'Amount']];
        
        autoTableFn(doc, {
          head: headers,
          body: body,
          startY: yPos,
          margin: { left: margin, right: margin },
          styles: tableStyles,
          headStyles: headStyles,
          showHead: 'everyPage',
        });
      }
      
      // Add footers
      const finalPageCount = (doc as any).internal.pages.length;
      for (let i = 1; i <= finalPageCount; i++) {
        doc.setPage(i);
        addFooter(i, finalPageCount);
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ar-report-${reportType === 'ar-report-history' ? 'history' : 'report'}-${timestamp}.pdf`;
      doc.save(filename);
      
      toast.success(`PDF report generated successfully`);
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
            p: 2, 
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: reportType === 'ar-report' ? 3 : 4 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
                    Report Type
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={reportType}
                      onChange={(e) => {
                        const newReportType = e.target.value as 'ar-report' | 'ar-report-history';
                        setReportType(newReportType);
                        setPreviewData([]);
                        setShowPreview(false);
                        setStartDate(dayjs());
                        setEndDate(dayjs());
                        // Reset filters
                        setSelectedARTypes([]);
                        setSelectedDepositIds([]);
                        setSelectedTransactionSources([]);
                        setSelectedUserIds([]);
                      }}
                      disabled={previewLoading}
                      sx={{
                        fontSize: '0.7rem',
                        height: '32px',
                        '& .MuiSelect-select': {
                          py: 0.5,
                          minHeight: 'auto !important',
                          fontSize: '0.7rem',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            '& .MuiMenuItem-root': {
                              fontSize: '0.7rem',
                              py: 0.5,
                              minHeight: 'auto',
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="ar-report" sx={{ fontSize: '0.7rem', py: 0.5 }}>AR Report</MenuItem>
                      <MenuItem value="ar-report-history" sx={{ fontSize: '0.7rem', py: 0.5 }}>AR Report History</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
                    Start Date
                  </Typography>
                  <CustomDatePicker
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    disabled={selectedDepositIds.length > 0}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
                    End Date
                  </Typography>
                  <CustomDatePicker
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate || undefined}
                    disabled={selectedDepositIds.length > 0}
                  />
                </Box>
              </Grid>

              {/* Filters - Only for AR Report */}
              {reportType === 'ar-report' && (
                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={2}>
                    {/* AR Type Filter */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
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
                                return <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>All Types</Typography>;
                              }
                              return <Typography sx={{ fontSize: '0.7rem' }}>{selected.length} selected</Typography>;
                            }}
                            sx={{
                              fontSize: '0.7rem',
                              height: '32px',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                minHeight: 'auto !important',
                                fontSize: '0.7rem',
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '1px',
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  '& .MuiMenuItem-root': {
                                    fontSize: '0.7rem',
                                    py: 0.5,
                                    minHeight: 'auto',
                                  },
                                },
                              },
                            }}
                          >
                            {filterOptions.typeSelect.map((type) => (
                              <MenuItem key={type.AR_Type} value={type.AR_Type} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Checkbox checked={selectedARTypes.includes(type.AR_Type)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }} />
                                <Typography sx={{ fontSize: '0.7rem' }}>{type.AR_Type}</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    {/* Deposit ID Filter */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
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
                                return <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>All Deposits</Typography>;
                              }
                              return <Typography sx={{ fontSize: '0.7rem' }}>{selected.length} selected</Typography>;
                            }}
                            sx={{
                              fontSize: '0.7rem',
                              height: '32px',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                minHeight: 'auto !important',
                                fontSize: '0.7rem',
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '1px',
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  '& .MuiMenuItem-root': {
                                    fontSize: '0.7rem',
                                    py: 0.5,
                                    minHeight: 'auto',
                                  },
                                },
                              },
                            }}
                          >
                            {filterOptions.depositeID.map((deposit) => (
                              <MenuItem key={deposit.Deposit_ID} value={String(deposit.Deposit_ID)} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Checkbox checked={selectedDepositIds.includes(deposit.Deposit_ID)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }} />
                                <Typography sx={{ fontSize: '0.7rem' }}>{deposit.Deposit_ID} - {deposit.Deposit_Reference || 'No Ref'} ({formatDate(deposit.Deposit_Date)})</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    {/* Transaction Source Filter */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
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
                                return <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>All Sources</Typography>;
                              }
                              return <Typography sx={{ fontSize: '0.7rem' }}>{selected.length} selected</Typography>;
                            }}
                            sx={{
                              fontSize: '0.7rem',
                              height: '32px',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                minHeight: 'auto !important',
                                fontSize: '0.7rem',
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '1px',
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  '& .MuiMenuItem-root': {
                                    fontSize: '0.7rem',
                                    py: 0.5,
                                    minHeight: 'auto',
                                  },
                                },
                              },
                            }}
                          >
                            {filterOptions.transactionSource.map((source, idx) => (
                              <MenuItem key={idx} value={String(source.AR_POS)} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Checkbox checked={selectedTransactionSources.includes(source.AR_POS)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }} />
                                <Typography sx={{ fontSize: '0.7rem' }}>{source.AR_POS ? 'POS' : 'Non-POS'}</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    {/* User Filter */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem', display: 'block' }}>
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
                                return <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>All Users</Typography>;
                              }
                              return <Typography sx={{ fontSize: '0.7rem' }}>{selected.length} selected</Typography>;
                            }}
                            sx={{
                              fontSize: '0.7rem',
                              height: '32px',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                minHeight: 'auto !important',
                                fontSize: '0.7rem',
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '1px',
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  '& .MuiMenuItem-root': {
                                    fontSize: '0.7rem',
                                    py: 0.5,
                                    minHeight: 'auto',
                                  },
                                },
                              },
                            }}
                          >
                            {filterOptions.users.map((user) => (
                              <MenuItem key={user.UserNumber} value={String(user.UserNumber)} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Checkbox checked={selectedUserIds.includes(user.UserNumber)} size="small" sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }} />
                                <Typography sx={{ fontSize: '0.7rem' }}>{user.UserName}</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              )}
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
              {reportType === 'ar-report-history' ? 'A/R Deposit History' : 'A/R Deposits'} Preview
            </Typography>
            
            {startDate && endDate && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Date: {startDate.format('MM/DD/YYYY')} - {endDate.format('MM/DD/YYYY')}
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
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {reportType === 'ar-report-history' ? (
                          <>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Deposit Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Deposit ID</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Deposit Reference</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }} align="right">Payments</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }} align="right">Adjustments</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }} align="right">Returned Checks</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Subtype</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Reference</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Customer Number / Name</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>User</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Lane/ID</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Check Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }}>Posting Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600 }} align="right">Amount</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPreviewData.map((row, idx) => {
                        // Deposit header
                        if (row.type === 'deposit-header') {
                          const depositDate = formatDate(row.Deposit_Date);
                          return (
                            <TableRow key={`header-${row.Deposit_ID}-${idx}`}>
                              <TableCell
                                colSpan={reportType === 'ar-report-history' ? 6 : 9}
                                sx={{
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  py: 1,
                                  pl: 2,
                                }}
                              >
                                Deposit Date: {depositDate} | Deposit ID: {row.Deposit_ID} - {row.Deposit_Reference || ''}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        // Spacing row (empty Type and Subtype)
                        if (row.type === 'transaction' && !row.Type && !row.Subtype && row.label === '') {
                          return (
                            <TableRow key={`spacer-${idx}`}>
                              <TableCell
                                colSpan={reportType === 'ar-report-history' ? 6 : 9}
                                sx={{ py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}
                              >
                                &nbsp;
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        // Transaction row
                        if (row.type === 'transaction') {
                          if (reportType === 'ar-report-history') {
                            return (
                              <TableRow key={`row-${row.Deposit_ID}-${idx}`} hover>
                                <TableCell>{formatDate(row.Deposit_Date)}</TableCell>
                                <TableCell>{row.Deposit_ID}</TableCell>
                                <TableCell>{row.Deposit_Reference || ''}</TableCell>
                                <TableCell align="right">{formatAmount(row.Payment_Total)}</TableCell>
                                <TableCell align="right">{formatAmount(row.Adjustment_Total)}</TableCell>
                                <TableCell align="right">{formatAmount(row.ReturnCheck_Total)}</TableCell>
                              </TableRow>
                            );
                          } else {
                            const customerInfo = row.Customer_Number 
                              ? `${row.Customer_Number} - ${row.Customer_Name || ''}`.trim()
                              : '';
                            return (
                              <TableRow key={`row-${row.Deposit_ID}-${idx}`} hover>
                                <TableCell>{row.Type || ''}</TableCell>
                                <TableCell>{row.Subtype || ''}</TableCell>
                                <TableCell>{row.Reference || ''}</TableCell>
                                <TableCell>{customerInfo}</TableCell>
                                <TableCell>{row.User || ''}</TableCell>
                                <TableCell>{row.Lane_ID || ''}</TableCell>
                                <TableCell>{formatDate(row.Check_Date)}</TableCell>
                                <TableCell>{formatDate(row.Posting_Date)}</TableCell>
                                <TableCell align="right">{formatAmount(row.Amount)}</TableCell>
                              </TableRow>
                            );
                          }
                        }
                        
                        // History total row
                        if (row.type === 'history-total') {
                          return (
                            <TableRow key={`history-total-${idx}`}>
                              <TableCell
                                colSpan={3}
                                align="right"
                                sx={{ fontWeight: 600, pl: 2 }}
                              >
                                {row.label || 'Total:'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatAmount(row.Payment_Total)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatAmount(row.Adjustment_Total)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatAmount(row.ReturnCheck_Total)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        // Subtype total or deposit total
                        if (row.type === 'subtype-total' || row.type === 'deposit-total') {
                          return (
                            <TableRow key={`total-${idx}`}>
                              <TableCell
                                colSpan={reportType === 'ar-report-history' ? 5 : 8}
                                align="right"
                                sx={{ fontWeight: 600, pl: 2 }}
                              >
                                {row.label || ''}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatAmount(row.Amount)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return null;
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
                  Showing {previewPage * PREVIEW_PAGE_SIZE + 1}-{Math.min((previewPage + 1) * PREVIEW_PAGE_SIZE, previewData.length)} of {previewData.length} records
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
              disabled={previewLoading || !startDate || !endDate}
              loading={previewLoading}
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
                disabled={generatingReport || generatingPDF || previewData.length === 0}
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
                disabled={generatingReport || generatingPDF || previewData.length === 0}
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
