import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
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
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
import { getCustomerVelocityReportPointsItem } from '../../../redux/apis/distrubutor/reportsApis';
import CustomerCommonFilters, { CustomerFilterValues } from './CustomerCommonFilters';
import { formatApiDate } from '../../../utils/formatApiDate';
import jsPDF from 'jspdf';

/** Sort description: space first, then symbol, then number, then alphabetical. */
function descriptionSortOrder(a: string, b: string): number {
  const cat = (ch: string): number => {
    if (ch === ' ' || ch === '') return 0;
    if (/[0-9]/.test(ch)) return 2;
    if (/[A-Za-z]/.test(ch)) return 3;
    return 1;
  };
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ca = a[i] ?? '';
    const cb = b[i] ?? '';
    const diff = cat(ca) - cat(cb);
    if (diff !== 0) return diff;
    if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true });
  }
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

interface PointsItemRow {
  itemNumber: string;
  description: string;
  pack: string;
  size: string;
  invoiceDate: string;
  invoiceNumber: string;
  shipped: number;
  points: number;
  extPoints: number;
}

interface CustomerGroup {
  customerKey: string;
  customerNumber?: number | string;
  customerName?: string;
  addressLines: string[];
  phone?: string;
  rows: PointsItemRow[];
  totalShipped: number;
  totalExtPoints: number;
}

const PREVIEW_PAGE_SIZE = 5;
const ROWS_CHUNK_SIZE = 50;

function formatShipped(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  const n = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `(${n.replace(/-/, '')})` : n;
}

function formatExtPoints(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const n = Math.round(value).toLocaleString('en-US');
  return value < 0 ? `(${n.replace(/-/, '')})` : n;
}

const CustomerVelocityReportPointsItemTab: React.FC = () => {
  const theme = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterValues | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const hasRunPreviewRef = useRef(false);

  const grandTotalShipped = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalShipped, 0),
    [groups],
  );
  const grandTotalExtPoints = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalExtPoints, 0),
    [groups],
  );

  const paginatedGroups = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    return groups.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [groups, previewPage]);

  const paginatedGroupsWithChunkedRows = useMemo(() => {
    return paginatedGroups.map((g) => ({
      ...g,
      rowsChunk: g.rows.slice(0, ROWS_CHUNK_SIZE),
      totalRowCount: g.rows.length,
      hasMoreRows: g.rows.length > ROWS_CHUNK_SIZE,
    }));
  }, [paginatedGroups]);

  const totalPreviewPages = useMemo(
    () => Math.ceil(groups.length / PREVIEW_PAGE_SIZE) || 1,
    [groups.length],
  );

  const applyFilters = useCallback(
    (rows: any[], currentFilters: CustomerFilterValues): any[] => {
      return rows.filter((row) => {
        const customer = row.customer ?? row.Customer ?? row.customerInfo;
        const inactiveRaw =
          row.C_Inactive ?? row['customer.C_Inactive'] ?? customer?.C_Inactive ?? customer?.c_inactive;
        const inactive = inactiveRaw === true || inactiveRaw === 'true' || inactiveRaw === 1;
        if (currentFilters.activeFilter === 'active' && inactive) return false;
        if (currentFilters.activeFilter === 'inactive' && !inactive) return false;
        if (currentFilters.selectedCustomers.length > 0) {
          const cNumber =
            row.C_Number ?? row.CustomerNumber ?? row.customerNumber ?? row['customer.C_Number'] ?? customer?.C_Number;
          if (!currentFilters.selectedCustomers.includes(Number(cNumber))) return false;
        }
        if (currentFilters.selectedSalesReps.length > 0) {
          const salesRepNumber =
            row.salesRep?.S_Number ??
            row.SalesRep_Number ??
            row.C_Salesman ??
            row.c_Salesman ??
            row.SalesRep ??
            row.S_Number ??
            row['orderHeaders.S_Number'] ??
            customer?.c_Salesman ??
            customer?.C_Salesman ??
            customer?.S_Number;
          if (
            salesRepNumber === undefined ||
            !currentFilters.selectedSalesReps.includes(Number(salesRepNumber))
          ) {
            return false;
          }
        }
        if (currentFilters.selectedRoutes.length > 0) {
          const routes = Array.isArray(row.Routes)
            ? row.Routes.map((r: any) => r.Route_Number)
            : row.Route_Number !== undefined
            ? [row.Route_Number]
            : row['orderHeaders.Route_Number'] !== undefined
            ? [row['orderHeaders.Route_Number']]
            : customer?.Route_Number !== undefined
            ? [customer.Route_Number]
            : [];
          if (!routes.some((r: any) => currentFilters.selectedRoutes.includes(Number(r)))) return false;
        }
        if (currentFilters.selectedClassOfTrade.length > 0) {
          const tradeCode = row.classOfTrade?.Trade_Code ?? row.Trade_Code ?? row.C_ClassOfTrade ?? row['customer.C_ClassOfTrade'] ?? customer?.C_ClassOfTrade ?? '';
          if (!currentFilters.selectedClassOfTrade.includes(String(tradeCode))) return false;
        }
        if (currentFilters.selectedJurisdictionState.length > 0) {
          const js = row.taxRate?.Jurisdiction_State ?? row.Jurisdiction_State ?? row['customer.Jurisdiction_State'] ?? customer?.Jurisdiction_State;
          if (!currentFilters.selectedJurisdictionState.includes(String(js ?? ''))) return false;
        }
        if (currentFilters.selectedJurisdictionCounty.length > 0) {
          const jc = row.taxRateCounty?.Jurisdiction_County ?? row.Jurisdiction_County ?? row['customer.Jurisdiction_County'] ?? customer?.Jurisdiction_County;
          if (!currentFilters.selectedJurisdictionCounty.includes(String(jc ?? ''))) return false;
        }
        if (currentFilters.selectedJurisdictionCity.length > 0) {
          const jcity =
            row.taxRateCity?.Jurisdiction_City ??
            row.Jurisdiction_City ??
            row['customer.Jurisdiction_City'] ??
            customer?.Jurisdiction_City;
          if (!currentFilters.selectedJurisdictionCity.includes(String(jcity ?? ''))) {
            return false;
          }
        }

        if (currentFilters.selectedSalesCategories.length > 0) {
          const categoryCode =
            row.Sales_Category ?? row.SalesCategory ?? row.CategoryCode ?? row.Category;
          if (
            categoryCode !== undefined &&
            !currentFilters.selectedSalesCategories.includes(String(categoryCode))
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [],
  );

  const groupByCustomer = useCallback((rows: any[]): CustomerGroup[] => {
    const map = new Map<string, CustomerGroup>();
    rows.forEach((row) => {
      const cust = row.customer ?? row.Customer ?? row.customerInfo ?? {};
      const customerNumber = row.C_Number ?? row.CustomerNumber ?? row.customerNumber ?? row['customer.C_Number'] ?? cust?.C_Number;
      const customerName = row.C_Name ?? row.CustomerName ?? row.customerName ?? cust?.C_Name ?? cust?.c_name ?? '';
      const address1 = row.C_Address ?? row.c_address ?? cust?.C_Address ?? cust?.c_address ?? '';
      const city = row.C_City ?? row.c_city ?? cust?.C_City ?? cust?.c_city ?? '';
      const state = row.C_State ?? row.c_state ?? cust?.C_State ?? cust?.c_state ?? '';
      const zip = row.C_Zip ?? row.c_zip ?? cust?.C_Zip ?? cust?.c_zip ?? '';
      const phone = row.C_Phone ?? row.c_phone ?? cust?.C_Phone ?? cust?.c_phone ?? '';
      const key = String(customerNumber ?? customerName ?? 'UNKNOWN');

      if (!map.has(key)) {
        map.set(key, {
          customerKey: key,
          customerNumber,
          customerName,
          addressLines: [[address1].filter(Boolean).join(''), [city, state, zip].filter(Boolean).join(' ')].filter((l) => l.trim()),
          phone,
          rows: [],
          totalShipped: 0,
          totalExtPoints: 0,
        });
      }

      const group = map.get(key)!;
      const itemNumber = row.Item_Number ?? row.ItemNumber ?? row.Item ?? '';
      const description = row.Description ?? row.Item_Description ?? row.ItemDescription ?? row.description ?? '';
      const pack = row.Pack ?? row.pack ?? '';
      const size = row.UOM ?? row.UOM_Size ?? row.Size ?? row.size ?? '';
      const invoiceDateRaw = row.Invoice_Date ?? row.InvoiceDate ?? row.Order_Date ?? row.Document_Date ?? '';
      const invoiceDate = invoiceDateRaw != null && invoiceDateRaw !== '' ? formatApiDate(String(invoiceDateRaw)) : '';
      const invoiceNumber = row.Document_Number ?? row.Invoice_Number ?? row.InvoiceNumber ?? row.Order_Number ?? '';
      const shipped = Number(row.Quantity_Shipped ?? row.Shipped ?? row.Qty_Shipped ?? 0) || 0;
      const points = Number(row.Points ?? row.points ?? 0) || 0;
      const extPoints = shipped * points;

      group.rows.push({
        itemNumber: String(itemNumber ?? ''),
        description: String(description ?? ''),
        pack: pack != null ? String(pack) : '',
        size: size != null ? String(size) : '',
        invoiceDate,
        invoiceNumber: String(invoiceNumber ?? ''),
        shipped,
        points,
        extPoints,
      });
      group.totalShipped += shipped;
      group.totalExtPoints += extPoints;
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const numA = Number(a.customerNumber);
      const numB = Number(b.customerNumber);
      if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
      if (Number.isFinite(numA)) return -1;
      if (Number.isFinite(numB)) return 1;
      return String(a.customerKey).localeCompare(String(b.customerKey), undefined, { numeric: true });
    });
    list.forEach((g) => {
      g.rows.sort((a, b) => descriptionSortOrder((a.description || '').trim(), (b.description || '').trim()));
    });
    return list;
  }, []);

  const handlePreview = useCallback(async () => {
    if (!filters) {
      toast.error('Please configure filters first.');
      return;
    }
    if (!filters.startDate || !filters.endDate) {
      toast.error('Please select Start Date and End Date.');
      return;
    }
    try {
      setLoadingPreview(true);
      setPreviewPage(0);
      setShowPreview(true);
      hasRunPreviewRef.current = true;
      const response = (await getCustomerVelocityReportPointsItem(filters.startDate, filters.endDate)) as any;
      const raw = response?.data?.data?.data ?? response?.data?.data ?? response?.data?.rows ?? response?.data ?? response ?? [];
      const list = Array.isArray(raw) ? raw : [];
      const filtered = applyFilters(list, filters);
      const grouped = groupByCustomer(filtered);
      setGroups(grouped);
      if (grouped.length === 0) toast.error('No data found for selected filters.');
    } catch (error) {
      console.error('Error loading Velocity Report - Customer (Points: Item):', error);
      toast.error('Failed to load report.');
      setShowPreview(false);
      setGroups([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [filters, applyFilters, groupByCustomer]);

  const handleGenerateCSV = useCallback(() => {
    if (groups.length === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingReport(true);
    try {
      const headers = ['Customer #', 'Customer Name', 'Phone', 'Item', 'Description', 'Pack', 'UOM/Size', 'Invoice Date', 'Invoice Number', 'Shipped', 'Points', 'Ext Points'];
      const lines: string[] = [headers.join(',')];
      groups.forEach((g) => {
        g.rows.forEach((r) => {
          lines.push(
            [g.customerNumber ?? '', g.customerName ?? '', g.phone ?? '', r.itemNumber, r.description, r.pack, r.size, r.invoiceDate, r.invoiceNumber, formatShipped(r.shipped), r.points, formatExtPoints(r.extPoints)]
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(','),
          );
        });
        lines.push([g.customerNumber ?? '', g.customerName ?? '', '', 'Customer Totals:', '', '', '', '', '', formatShipped(g.totalShipped), '', formatExtPoints(g.totalExtPoints)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
      });
      lines.push('');
      lines.push(['GRAND TOTAL', '', '', '', '', '', '', '', '', formatShipped(grandTotalShipped), '', formatExtPoints(grandTotalExtPoints)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `velocity-report-customer-points-item-${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('CSV report generated successfully');
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast.error('Failed to generate CSV report');
    } finally {
      setGeneratingReport(false);
    }
  }, [groups, grandTotalShipped, grandTotalExtPoints]);

  const loadLogoAsDataUrl = useCallback(async (): Promise<string | null> => {
    try {
      return await new Promise<string | null>((resolve) => {
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
              resolve(canvas.toDataURL('image/png'));
            } else resolve(null);
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = typeof rabbitLogo === 'string' ? rabbitLogo : (rabbitLogo as string);
      });
    } catch {
      return null;
    }
  }, []);

  const handleGeneratePDF = useCallback(async () => {
    if (groups.length === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const dateRangeText =
        filters?.startDate && filters?.endDate
          ? `Date Range: ${formatApiDate(filters.startDate)} thru ${formatApiDate(filters.endDate)} | DETAIL`
          : '';
      const headerDate = filters?.endDate ? formatApiDate(filters.endDate).replace(/\//g, '-') : formatApiDate(new Date().toISOString().slice(0, 10)).replace(/\//g, '-');

      const autoTableFn = jspdfAutoTable.default ?? jspdfAutoTable.autoTable ?? jspdfAutoTable;
      const tableHeaders = ['Item', 'Description', 'Pack', 'UOM/Size', 'Invoice Date', 'Invoice Number', 'Shipped', 'Points', 'Ext Points'];

      let startY = 14;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(headerDate, margin, startY - 4);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Velocity Report - Customer (Points: Item)', pageWidth / 2, startY - 4, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (dateRangeText) {
        doc.text(dateRangeText, margin, startY);
        startY += 6;
      } else startY += 2;

      const footerY = pageHeight - 5;
      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const footerText = 'Report Generated by Woopsa';
        doc.text(footerText, margin, footerY);
        if (logoDataUrl) {
          try {
            doc.addImage(logoDataUrl, 'PNG', margin + doc.getTextWidth(footerText) + 1, footerY - 2.5, 3, 3);
          } catch {
            // ignore
          }
        }
        doc.setFontSize(7);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      };

      const minYBeforeNewPage = pageHeight - 40;

      for (const group of groups) {
        if (startY > minYBeforeNewPage) {
          doc.addPage('a4', 'landscape');
          startY = margin;
        }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Customer ${group.customerNumber ?? ''}`, margin, startY);
        startY += 4;
        if (group.phone) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text(`Phone ${group.phone}`, margin, startY);
          startY += 4;
        }
        if (group.customerName) {
          doc.text(group.customerName, margin, startY);
          startY += 4;
        }
        group.addressLines.forEach((line) => {
          doc.text(line, margin, startY);
          startY += 4;
        });
        startY += 2;

        const body: (string | number | Record<string, unknown>)[][] = group.rows.map((r) => [
          r.itemNumber,
          r.description,
          r.pack,
          r.size,
          r.invoiceDate,
          r.invoiceNumber,
          formatShipped(r.shipped),
          r.points,
          formatExtPoints(r.extPoints),
        ]);
        body.push([
          {
            content: 'Customer Totals:',
            colSpan: 6,
            styles: { fontStyle: 'bold', fillColor: [245, 245, 245] },
          },
          formatShipped(group.totalShipped),
          '',
          formatExtPoints(group.totalExtPoints),
        ]);

        autoTableFn(doc, {
          head: [tableHeaders],
          body,
          startY,
          margin: { left: margin, right: margin },
          styles: { fontSize: 6, cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 }, overflow: 'linebreak' },
          headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6 },
          showHead: 'everyPage',
        });
        startY = (doc as any).lastAutoTable.finalY + 6;
      }

      if (startY > minYBeforeNewPage) {
        doc.addPage('a4', 'landscape');
        startY = margin;
      }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, startY + 2, pageWidth - margin, startY + 2);
      startY += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`GRAND TOTAL: Shipped ${formatShipped(grandTotalShipped)}  |  Ext Points ${formatExtPoints(grandTotalExtPoints)}`, margin, startY);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }
      doc.save(`velocity-report-customer-points-item-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  }, [groups, grandTotalShipped, grandTotalExtPoints, filters, loadLogoAsDataUrl]);

  return (
    <Box sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, p: 2, pb: 0.5 }}>
        {!showPreview && (
          <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
            Velocity Report - Customer (Points: Item) Configuration
          </Typography>
        )}
        {!showPreview ? (
          <Paper sx={{ p: 0.75, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <CustomerCommonFilters
              key={`filter-${showPreview ? 'p' : hasRunPreviewRef.current ? 'restore' : 'new'}`}
              initialValues={!showPreview && hasRunPreviewRef.current && filters ? filters : undefined}
              onFiltersChange={setFilters}
              hideSalesCategory
              hideCostSelect
            />
          </Paper>
        ) : (
          <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Velocity Report - Customer (Points: Item) Preview
            </Typography>
            {loadingPreview ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : groups.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No data to display for the selected filters.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {paginatedGroupsWithChunkedRows.map((group) => (
                  <Box key={group.customerKey} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Customer {group.customerNumber ?? ''}</Typography>
                      {group.phone && <Typography sx={{ fontSize: '0.75rem' }}>Phone {group.phone}</Typography>}
                      {group.customerName && <Typography sx={{ fontSize: '0.75rem' }}>{group.customerName}</Typography>}
                      {group.addressLines.map((line, idx) => (
                        <Typography key={idx} sx={{ fontSize: '0.75rem' }}>{line}</Typography>
                      ))}
                    </Box>
                    {group.hasMoreRows && (
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.5 }}>
                        Showing first {ROWS_CHUNK_SIZE} of {group.totalRowCount} rows in preview. Use PDF or CSV for full data.
                      </Typography>
                    )}
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Item</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Pack</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">UOM/Size</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Invoice Date</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Invoice Number</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Shipped</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Points</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Ext Points</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.rowsChunk.map((r, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{r.itemNumber}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{r.description}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{r.pack}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{r.size}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{r.invoiceDate}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{r.invoiceNumber}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{formatShipped(r.shipped)}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{r.points}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{formatExtPoints(r.extPoints)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderTop: `1px solid ${theme.palette.divider}`,
                              }}
                            >
                              Customer Totals:
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderTop: `1px solid ${theme.palette.divider}`,
                              }}
                              align="right"
                            >
                              {formatShipped(group.totalShipped)}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderTop: `1px solid ${theme.palette.divider}`,
                              }}
                              align="right"
                            >
                              {/* blank under Points column for totals row */}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderTop: `1px solid ${theme.palette.divider}`,
                              }}
                              align="right"
                            >
                              {formatExtPoints(group.totalExtPoints)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))}
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>GRAND TOTAL</Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>Shipped: {formatShipped(grandTotalShipped)}  |  Ext Points: {formatExtPoints(grandTotalExtPoints)}</Typography>
                </Box>
                {totalPreviewPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination count={totalPreviewPages} page={previewPage + 1} onChange={(_, page) => setPreviewPage(page - 1)} color="primary" size="small" />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        )}
      </Box>
      <Box sx={{ p: 2, pt: 0.5, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: showPreview ? 'space-between' : 'flex-end', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {!showPreview ? (
          <CustomButton type="button" buttonType="primary" appearance="filled" onClick={handlePreview} disabled={loadingPreview || !filters?.startDate || !filters?.endDate} loading={loadingPreview} icon={<PreviewIcon />} iconPosition="left" fullWidth={false} sx={{ minWidth: 180, mt: 0 }}>Preview</CustomButton>
        ) : (
          <>
            <CustomButton type="button" buttonType="cancel" appearance="outlined" onClick={() => setShowPreview(false)} fullWidth={false} sx={{ minWidth: 180, mt: 0 }}>Back to Configuration</CustomButton>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <CustomButton type="button" buttonType="primary" appearance="filled" onClick={handleGenerateCSV} disabled={generatingReport || generatingPDF || groups.length === 0} loading={generatingReport} icon={<FileDownloadIcon />} iconPosition="left" fullWidth={false} sx={{ minWidth: 180, mt: 0 }}>Generate CSV</CustomButton>
              <CustomButton type="button" buttonType="primary" appearance="filled" onClick={handleGeneratePDF} disabled={generatingReport || generatingPDF || groups.length === 0} loading={generatingPDF} icon={!generatingPDF ? <PdfIcon /> : undefined} iconPosition="left" fullWidth={false} sx={{ minWidth: 180, mt: 0 }}>Generate PDF</CustomButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default CustomerVelocityReportPointsItemTab;
