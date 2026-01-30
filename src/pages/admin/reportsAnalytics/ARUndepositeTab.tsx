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
import { getARUndepositeFund, getListOfARreports } from '../../../redux/apis/distrubutor/reportsApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
import { formatApiDate } from '../../../utils/formatApiDate';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

interface ARUndepositeItem {
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
  SubType: string;
  RepName?: string;
  DaysUntilDue?: number;
  Terms?: string;
  fCharge: number;
  customer?: {
    C_Name: string;
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
  };
}

interface DisplayRow {
  type: 'transaction' | 'group-header' | 'group-total';
  data?: ARUndepositeItem;
  groupKey?: string;
  groupLabel?: string;
  total?: number;
}

// Fixed fields matching the image
const FIXED_FIELDS = [
  'AR_Type',
  'SubType',
  'AR_Ref',
  'Customer_Info',
  'User_Number',
  'Workstation_ID',
  'AR_POS',
  'AR_CheckDate',
  'AR_Amount',
];

const FIELD_LABELS: { [key: string]: string } = {
  AR_Type: 'Type',
  SubType: 'Subtype',
  AR_Ref: 'Reference',
  Customer_Info: 'Customer Number / Name',
  User_Number: 'User',
  Workstation_ID: 'Lane/ID',
  AR_POS: 'POS',
  AR_CheckDate: 'Check Date',
  AR_Amount: 'Amount',
};

const GROUP_BY_OPTIONS = [
  { label: 'Group by Type', value: 'type' },
  { label: 'Group by Check Date', value: 'checkDate' },
];

const ARUndepositeTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  // Date filters - default to 1 week ago to today
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Filter states
  const [selectedARTypes, setSelectedARTypes] = useState<string[]>([]);
  const [selectedTransactionSources, setSelectedTransactionSources] = useState<boolean[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Group By selection
  const [groupBy, setGroupBy] = useState<'type' | 'checkDate'>('type');

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    typeSelect: Array<{ AR_Type: string }>;
    transactionSource: Array<{ AR_POS: boolean }>;
    users: Array<{ UserNumber: number; UserName: string }>;
  }>({
    typeSelect: [],
    transactionSource: [],
    users: [],
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Data states
  const [rawFetchedData, setRawFetchedData] = useState<ARUndepositeItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dateChangeLoading, setDateChangeLoading] = useState(false);

  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<DisplayRow[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const PREVIEW_PAGE_SIZE = 500;

  // PDF/CSV generation states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load filter options from getListOfARreports API
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const response = await getListOfARreports() as any;
        const responseData = response?.data?.data || response?.data || response || {};
        
      const options = {
        typeSelect: [] as Array<{ AR_Type: string }>,
        transactionSource: [] as Array<{ AR_POS: boolean }>,
        users: [] as Array<{ UserNumber: number; UserName: string }>,
      };

        // Extract typeSelect
        if (responseData?.typeSelect && Array.isArray(responseData.typeSelect)) {
          options.typeSelect = responseData.typeSelect.map((type: any) => ({
            AR_Type: type.AR_Type || type
          })).sort((a: { AR_Type: string }, b: { AR_Type: string }) => a.AR_Type.localeCompare(b.AR_Type));
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
    };
    loadFilterOptions();
  }, []);

  // Load AR Undeposite Fund data
  const loadARUndepositeData = async (startDateStr?: string, endDateStr?: string): Promise<ARUndepositeItem[]> => {
    try {
      const response = await getARUndepositeFund(startDateStr, endDateStr) as any;
      console.log('AR Undeposite Fund API Response (full):', response);
      console.log('AR Undeposite Fund API Response.data:', response?.data);
      console.log('AR Undeposite Fund API Response.data.data:', response?.data?.data);
      
      // Match the pattern used in ARReportTab
      // For response structure: { success: true, data: [...] }
      // axios returns: response.data = { success: true, data: [...] }
      // So we need: response.data.data = [...]
      const data = response?.data?.data?.data || response?.data?.data || response?.data || response || [];
      console.log('Extracted AR Undeposite Fund data:', data, 'Length:', Array.isArray(data) ? data.length : 0, 'Is Array:', Array.isArray(data));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading AR Undeposite Fund data:', error);
      toast.error('Failed to load AR Undeposite Fund data');
      return [];
    }
  };

  // Auto-fetch data when dates change
  useEffect(() => {
    if (!startDate || !endDate) {
        setRawFetchedData([]);
        setPreviewData([]);
        setShowPreview(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setDateChangeLoading(true);
      try {
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        const fetchedData = await loadARUndepositeData(startDateStr, endDateStr);
        setRawFetchedData(fetchedData);
      } catch (error) {
        console.error('Error auto-fetching AR Undeposite Fund data:', error);
        setRawFetchedData([]);
        setPreviewData([]);
      } finally {
        setDateChangeLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate]);

  // Apply filters and group data
  const processData = useCallback((data: ARUndepositeItem[]): DisplayRow[] => {
    console.log('processData called with data length:', data.length);
    let filteredData = [...data];
    console.log('Initial filteredData length:', filteredData.length);

    // Filter by AR Type
    if (selectedARTypes.length > 0) {
      filteredData = filteredData.filter(item => selectedARTypes.includes(item.AR_Type));
      console.log('After AR Type filter:', filteredData.length);
    }

    // Filter by Transaction Source (AR_POS)
    if (selectedTransactionSources.length > 0) {
      filteredData = filteredData.filter(item => selectedTransactionSources.includes(item.AR_POS));
    }

    // Filter by User
    if (selectedUserIds.length > 0) {
      filteredData = filteredData.filter(item => selectedUserIds.includes(item.User_Number));
    }

    // Group data based on groupBy selection
    const groups: { [key: string]: ARUndepositeItem[] } = {};

    filteredData.forEach(item => {
      let groupKey: string;

      if (groupBy === 'type') {
        // Group by Type and SubType together (e.g., "C CASH", "C CHECK", "R N/A")
        const subtype = item.SubType || 'N/A';
        groupKey = `${item.AR_Type || 'Unknown'}_${subtype}`;
      } else {
        // Group by Check Date
        const checkDate = item.AR_CheckDate ? formatApiDate(item.AR_CheckDate) : 'No Date';
        groupKey = checkDate;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    // Sort groups and items within groups
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'type') {
        // Sort by Type first, then by SubType
        const [typeA, subtypeA] = a.split('_');
        const [typeB, subtypeB] = b.split('_');
        if (typeA !== typeB) {
          return typeA.localeCompare(typeB);
        }
        return (subtypeA || '').localeCompare(subtypeB || '');
      } else {
        // Sort dates descending
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      }
    });

    // Build display rows with grouping
    const displayRows: DisplayRow[] = [];

    sortedGroupKeys.forEach(groupKey => {
      const items = groups[groupKey];
      
      // Sort items within group by Check Date (or Posting Date) ascending - oldest first, then new; then by Amount
      items.sort((a, b) => {
        const dateA = new Date(a.AR_CheckDate || a.AR_Date || 0).getTime();
        const dateB = new Date(b.AR_CheckDate || b.AR_Date || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (b.AR_Amount || 0) - (a.AR_Amount || 0);
      });

      // Add group header
      let groupLabel: string;
      let totalLabel: string;
      
      if (groupBy === 'type') {
        // For type grouping, show Type and Subtype in header (e.g., "C CASH"), Subtype only in total
        const firstItem = items[0];
        const type = firstItem?.AR_Type || '';
        const subtype = firstItem?.SubType || 'N/A';
        groupLabel = `${type} ${subtype}`;
        totalLabel = `Total: ${subtype}`;
      } else {
        // For check date grouping
        groupLabel = groupKey;
        totalLabel = `Total: ${groupKey}`;
      }
      
      displayRows.push({
        type: 'group-header',
        groupKey,
        groupLabel,
      });

      // Add transaction rows
      items.forEach(item => {
        displayRows.push({
          type: 'transaction',
          data: item,
        });
      });

      // Add group total
      const groupTotal = items.reduce((sum, item) => sum + (item.AR_Amount || 0), 0);
      displayRows.push({
        type: 'group-total',
        groupKey,
        groupLabel: totalLabel,
        total: groupTotal,
      });
    });

    return displayRows;
  }, [selectedARTypes, selectedTransactionSources, selectedUserIds, groupBy]);

  // Re-process data when filters or groupBy change
  useEffect(() => {
    if (rawFetchedData.length === 0 || showPreview) {
      console.log('Skipping data processing - rawFetchedData length:', rawFetchedData.length, 'showPreview:', showPreview);
      return;
    }

    console.log('Processing data - rawFetchedData length:', rawFetchedData.length);
    const processedRows = processData(rawFetchedData);
    console.log('Processed rows length:', processedRows.length);
    setPreviewData(processedRows);
  }, [rawFetchedData, processData, showPreview]);

  // Handle preview
  const handlePreview = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start date and end date');
      return;
    }

    setPreviewLoading(true);
    try {
      let fetchedData: ARUndepositeItem[] = [];
      
      if (rawFetchedData.length > 0) {
        fetchedData = rawFetchedData;
      } else {
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');
        fetchedData = await loadARUndepositeData(startDateStr, endDateStr);
        setRawFetchedData(fetchedData);
      }

      const processedRows = processData(fetchedData);
      setPreviewData(processedRows);
      setPreviewPage(0);
      setShowPreview(true);

      const transactionCount = processedRows.filter(row => row.type === 'transaction').length;
      if (transactionCount === 0) {
        toast.success('No data found for the selected criteria');
      } else {
        toast.success(`Loaded ${transactionCount} record(s)`);
      }
    } catch (error: any) {
      console.error('Error generating preview:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate preview');
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Format field value for display
  const formatFieldValue = (item: ARUndepositeItem, field: string): string => {
    if (field === 'Customer_Info') {
      const customerName = item.customer?.C_Name || '';
      return item.C_Number ? `${item.C_Number} ${customerName}`.trim() : customerName || '';
    }

    const value = (item as any)[field];

    if (value === null || value === undefined) {
      return '';
    }

    if (field.includes('Date')) {
      if (value) return formatApiDate(String(value));
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      if (field.includes('Amount')) {
        const formatted = Math.abs(value).toFixed(2);
        return value < 0 ? `-${formatted}` : formatted;
      }
      return value.toString();
    }

    return String(value);
  };

  // Format amount for display
  const formatAmount = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const numValue = Number(value);
    if (isNaN(numValue)) return '';
    if (numValue < 0) {
      return `(${Math.abs(numValue).toFixed(2)})`;
    }
    return numValue.toFixed(2);
  };

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
      const headers = FIXED_FIELDS.map(field => FIELD_LABELS[field] || field);
      const csvHeaders = headers.join(',');

      const rows: string[] = [csvHeaders];

      previewData.forEach(row => {
        if (row.type === 'group-header') {
          rows.push(`"",${''.repeat(FIXED_FIELDS.length - 1).split('').map(() => '""').join(',')}`);
        } else if (row.type === 'transaction' && row.data) {
          const csvRow = FIXED_FIELDS.map(field => {
            const value = formatFieldValue(row.data!, field);
            return `"${value.replace(/"/g, '""')}"`;
          }).join(',');
          rows.push(csvRow);
        } else if (row.type === 'group-total') {
          const totalText = row.groupLabel || 'Total:';
          rows.push(`"${totalText}",${''.repeat(FIXED_FIELDS.length - 2).split('').map(() => '""').join(',')},"${formatAmount(row.total)}"`);
        }
      });

      const csvContent = rows.join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ar-undeposite-fund-${timestamp}.csv`;

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
      const headers = FIXED_FIELDS.map(field => FIELD_LABELS[field] || field);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
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

      // Report header
      const headerY = yPos;
      
      // Warehouse/Distributor details on left
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      let leftY = headerY;
      
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
        leftY += 3.5;
      }
      
      // Report title - centered (aligned with warehouse name and date)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('A/R Undeposited Funds (Group by Type)', pageWidth / 2, headerY, { align: 'center' });
      
      // Date on right
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth - margin, headerY, { align: 'right' });
      
      yPos = Math.max(leftY, headerY + 4) + 2;

      // Draw divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

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

      // Build table body with grouping
      const tableBody: any[] = [];
      
      previewData.forEach(row => {
        if (row.type === 'group-header') {
          // Group header row kept for spacing; label hidden per request
          tableBody.push([{
            content: '',
            colSpan: FIXED_FIELDS.length,
            styles: { fillColor: [235, 235, 235], fontStyle: 'bold', fontSize: 8 }
          }]);
        } else if (row.type === 'transaction' && row.data) {
          // Transaction row
          const item = row.data;
          tableBody.push([
            item.AR_Type || '',
            item.SubType || 'N/A',
            item.AR_Ref || '',
            item.C_Number ? `${item.C_Number} ${item.customer?.C_Name || ''}`.trim() : (item.customer?.C_Name || ''),
            item.User_Number?.toString() || '',
            item.Workstation_ID?.toString() || '',
            item.AR_POS ? 'Yes' : 'No',
            item.AR_CheckDate ? formatApiDate(item.AR_CheckDate) : '',
            formatAmount(item.AR_Amount),
          ]);
        } else if (row.type === 'group-total') {
          // Group total row
          tableBody.push([{
            content: row.groupLabel || 'Total:',
            colSpan: FIXED_FIELDS.length - 1,
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] }
          }, {
            content: formatAmount(row.total),
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] }
          }]);
        }
      });

      autoTableFn(doc, {
        head: [headers],
        body: tableBody,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: tableStyles,
        headStyles: headStyles,
        showHead: 'everyPage',
        didParseCell: (data: any) => {
          if (data.section === 'head') {
            data.cell.styles.fillColor = [80, 80, 80];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.section === 'body') {
            // Check if this is a group header or total row
            if (data.row.raw && data.row.raw[0] && typeof data.row.raw[0] === 'object' && data.row.raw[0].colSpan) {
              // Group header or total row - styles already set
              return;
            }
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [0, 0, 0];
          }
        },
        columnStyles: FIXED_FIELDS.reduce((acc: any, field, idx) => {
          if (field === 'AR_Amount') {
            acc[idx] = { cellWidth: 'auto', halign: 'right' };
          } else {
            acc[idx] = { cellWidth: 'auto' };
          }
          return acc;
        }, {}),
      });

      // Add footers to all pages
      const finalPageCount = (doc as any).internal.pages.length;
      for (let i = 1; i <= finalPageCount; i++) {
        doc.setPage(i);
        addFooter(i, finalPageCount);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ar-undeposite-fund-${timestamp}.pdf`;
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
            AR Undeposited Funds Configuration
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
              {/* Left Column - Date Filters and Group By */}
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
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Group By
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as 'type' | 'checkDate')}
                      disabled={previewLoading || loadingFilters}
                      sx={{
                        fontSize: '0.75rem',
                        height: '32px',
                        '& .MuiSelect-select': {
                          py: 0.5,
                          minHeight: 'auto !important',
                          fontSize: '0.75rem',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: '1px',
                        },
                      }}
                    >
                      {GROUP_BY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem', py: 0.5 }}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Right Column - Filter Dropdowns */}
              <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={1.5}>
                  {/* AR Type Filter */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Grid>

                  {/* Transaction Source Filter */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  </Grid>

                  {/* User Filter */}
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
              A/R Undeposited Funds Preview
            </Typography>

            {startDate && endDate && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Date Range: {startDate.format('MM/DD/YYYY')} - {endDate.format('MM/DD/YYYY')} | Group By: {groupBy === 'type' ? 'Type' : 'Check Date'}
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
                            {groupBy === 'type' && field === 'AR_Type' ? '' : (FIELD_LABELS[field] || field)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPreviewData.map((row, idx) => {
                        if (row.type === 'group-header') {
                          return (
                            <TableRow key={`group-${row.groupKey}-${idx}`}>
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
                                {/* Group header row kept for spacing; label hidden per request */}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        if (row.type === 'group-total') {
                          return (
                            <TableRow key={`total-${row.groupKey}-${idx}`}>
                              <TableCell
                                colSpan={FIXED_FIELDS.length - 1}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  textAlign: 'right',
                                  backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                }}
                              >
                                {row.groupLabel}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  textAlign: 'right',
                                  backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                }}
                              >
                                {formatAmount(row.total)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={`${row.data?.P_Number}-${idx}`} hover>
                            {FIXED_FIELDS.map((field) => (
                              <TableCell
                                key={field}
                                sx={{
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {formatFieldValue(row.data!, field)}
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
                    const dataRowsInCurrentPage = paginatedPreviewData.filter(row => row.type === 'transaction').length;
                    const totalDataRows = previewData.filter(row => row.type === 'transaction').length;
                    let dataRowsBeforeCurrentPage = 0;
                    for (let i = 0; i < previewPage * PREVIEW_PAGE_SIZE; i++) {
                      if (previewData[i]?.type === 'transaction') {
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

export default ARUndepositeTab;
