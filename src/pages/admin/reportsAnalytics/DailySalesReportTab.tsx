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
import CustomerCommonFilters, { CustomerFilterValues } from './CustomerCommonFilters';
import { getDailySalesReport } from '../../../redux/apis/distrubutor/reportsApis';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { formatApiDate } from '../../../utils/formatApiDate';

interface DailySalesRow {
  documentDate: string;
  totalCategorySales: number;
  totalSalesTax: number;
  deposit: number;
  delivery: number;
  other: number;
  prepaidSalesTax: number;
  invoiceTotal: number;
  transactions: number | '';
}

const PREVIEW_PAGE_SIZE = 50;

function formatCurrency(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

const DailySalesReportTab: React.FC = () => {
  const theme = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterValues | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rows, setRows] = useState<DailySalesRow[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const hasRunPreviewRef = useRef(false);

  const applyFilters = useCallback(
    (data: any[], currentFilters: CustomerFilterValues): any[] => {
      return data.filter((row) => {
        const customer = row.customer ?? row.Customer ?? row.customerInfo;

        // Active / Inactive
        const inactiveRaw =
          row.C_Inactive ??
          row['customer.C_Inactive'] ??
          customer?.C_Inactive ??
          customer?.c_inactive;
        const inactive = inactiveRaw === true || inactiveRaw === 'true' || inactiveRaw === 1;
        if (currentFilters.activeFilter === 'active' && inactive) return false;
        if (currentFilters.activeFilter === 'inactive' && !inactive) return false;

        // Customer
        if (currentFilters.selectedCustomers.length > 0) {
          const cNumber =
            row.C_Number ??
            row.CustomerNumber ??
            row.customerNumber ??
            row['customer.C_Number'] ??
            customer?.C_Number;
          if (!currentFilters.selectedCustomers.includes(Number(cNumber))) return false;
        }

        // Sales Rep
        if (currentFilters.selectedSalesReps.length > 0) {
          const salesRepNumber =
            row.salesRep?.S_Number ??
            row.SalesRep_Number ??
            row.C_Salesman ??
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

        // Route
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
          if (!routes.some((r: any) => currentFilters.selectedRoutes.includes(Number(r)))) {
            return false;
          }
        }

        // Class of Trade
        if (currentFilters.selectedClassOfTrade.length > 0) {
          const tradeCode =
            row.classOfTrade?.Trade_Code ??
            row.Trade_Code ??
            row.ClassOfTradeCode ??
            row.C_ClassOfTrade ??
            row['customer.C_ClassOfTrade'] ??
            customer?.C_ClassOfTrade ??
            '';
          if (!currentFilters.selectedClassOfTrade.includes(String(tradeCode))) return false;
        }

        // Jurisdiction State
        if (currentFilters.selectedJurisdictionState.length > 0) {
          const js =
            row.taxRate?.Jurisdiction_State ??
            row.Jurisdiction_State ??
            row.StateTax?.Jurisdiction_State ??
            row['customer.Jurisdiction_State'] ??
            customer?.Jurisdiction_State;
          if (!currentFilters.selectedJurisdictionState.includes(String(js ?? ''))) return false;
        }

        // Jurisdiction County
        if (currentFilters.selectedJurisdictionCounty.length > 0) {
          const jc =
            row.taxRateCounty?.Jurisdiction_County ??
            row.Jurisdiction_County ??
            row.CountyTax?.Jurisdiction_County ??
            row['customer.Jurisdiction_County'] ??
            customer?.Jurisdiction_County;
          if (!currentFilters.selectedJurisdictionCounty.includes(String(jc ?? ''))) return false;
        }

        // Jurisdiction City
        if (currentFilters.selectedJurisdictionCity.length > 0) {
          const jcity =
            row.taxRateCity?.Jurisdiction_City ??
            row.Jurisdiction_City ??
            row.CityTax?.Jurisdiction_City ??
            row['customer.Jurisdiction_City'] ??
            customer?.Jurisdiction_City;
          if (!currentFilters.selectedJurisdictionCity.includes(String(jcity ?? ''))) {
            return false;
          }
        }

        return true;
      });
    },
    [],
  );

  const grandTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        totalCategorySales: acc.totalCategorySales + (r.totalCategorySales ?? 0),
        totalSalesTax: acc.totalSalesTax + (r.totalSalesTax ?? 0),
        deposit: acc.deposit + (r.deposit ?? 0),
        delivery: acc.delivery + (r.delivery ?? 0),
        other: acc.other + (r.other ?? 0),
        prepaidSalesTax: acc.prepaidSalesTax + (r.prepaidSalesTax ?? 0),
        invoiceTotal: acc.invoiceTotal + (r.invoiceTotal ?? 0),
        transactions: acc.transactions + (typeof r.transactions === 'number' ? r.transactions : 0),
      }),
      {
        totalCategorySales: 0,
        totalSalesTax: 0,
        deposit: 0,
        delivery: 0,
        other: 0,
        prepaidSalesTax: 0,
        invoiceTotal: 0,
        transactions: 0,
      },
    );
  }, [rows]);

  const paginatedRows = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    const end = start + PREVIEW_PAGE_SIZE;
    return rows.slice(start, end);
  }, [rows, previewPage]);

  const totalPreviewPages = useMemo(
    () => Math.ceil(rows.length / PREVIEW_PAGE_SIZE) || 1,
    [rows.length],
  );

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

      const response = (await getDailySalesReport(
        filters.startDate,
        filters.endDate,
      )) as any;
      const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data?.rows ||
        response?.data ||
        response ||
        [];
      const list = Array.isArray(raw) ? raw : [];
      const filtered = applyFilters(list, filters);

      const mapped: DailySalesRow[] = filtered.map((row: any) => {
        const docDateRaw =
          row.Document_Date ??
          row.Invoice_Date ??
          row.Order_Date ??
          row.DocumentNumber ??
          row.Document_Number ??
          row.Order_Number ??
          row.Invoice_Number ??
          row.InvoiceNumber ??
          row.Reference ??
          '';
        const documentDate =
          typeof docDateRaw === 'string'
            ? docDateRaw
            : docDateRaw != null
              ? String(docDateRaw)
              : '';
        const num = (v: any) => (v !== undefined && v !== null && v !== '' ? Number(v) : 0);
        // Total Category Sales = sum of totalSales01 through totalSales12
        const totalCategorySales = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
          (sum, i) => sum + num((row as any)[`totalSales${String(i).padStart(2, '0')}`]),
          0,
        );
        const totalSalesTax = num(
          row.TotalSalesTax ??
            row.totalSalesTax ??
            row.Sales_Tax ??
            row.stax_State,
        );
        const deposit = num(
          row.Invoice_Deposit ?? row.invoice_deposit ?? row.Deposit ?? row.deposit,
        );
        const delivery = num(
          row.Delivery_Charge ?? row.delivery_charge ?? row.Delivery ?? row.delivery,
        );
        const other = num(
          row.Other_Charge ?? row.other_charge ?? row.Other ?? row.other,
        );
        // Prepaid Sales Tax: prefer PrepaidTax_Amount when present, then other aliases.
        const prepaidSalesTax = num(
          row.PrepaidTax_Amount ?? row.PrepaidSalesTax ?? row.prepaidTax,
        );
        // Invoice Total = totalCost
        const invoiceTotal = num(
          row.totalCost ??
            row.TotalCost ??
            row.InvoiceTotal ??
            row.Invoice_Total ??
            row.invoiceTotal,
        );
        const transactions =
          row.Transactions ?? row.transactions ?? row.iCount ?? row.Count ?? '';

        return {
          documentDate,
          totalCategorySales,
          totalSalesTax,
          deposit,
          delivery,
          other,
          prepaidSalesTax,
          invoiceTotal,
          transactions: typeof transactions === 'number' ? transactions : transactions === '' ? '' : Number(transactions) || '',
        };
      });

      setRows(mapped);
      if (mapped.length === 0) {
        toast.error('No data found for selected filters.');
      }
    } catch (error) {
      console.error('Error loading Daily Sales report:', error);
      toast.error('Failed to load Daily Sales report.');
      setShowPreview(false);
      setRows([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [filters, applyFilters]);

  const handleGenerateCSV = useCallback(() => {
    if (rows.length === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingReport(true);
    try {
      const headers = [
        'Document Date',
        'Total Category Sales',
        'Total Sales Tax',
        'Deposit',
        'Delivery',
        'Other',
        'Prepaid Sales Tax',
        'Invoice Total',
        'Transactions',
      ];
      const lines: string[] = [headers.join(',')];
      rows.forEach((r) => {
        const vals = [
          r.documentDate,
          formatCurrency(r.totalCategorySales),
          formatCurrency(r.totalSalesTax),
          formatCurrency(r.deposit),
          formatCurrency(r.delivery),
          formatCurrency(r.other),
          formatCurrency(r.prepaidSalesTax),
          formatCurrency(r.invoiceTotal),
          r.transactions === '' ? '' : r.transactions,
        ];
        const csvRow = vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
        lines.push(csvRow);
      });
      lines.push('');
      lines.push(
        [
          'Grand Total',
          formatCurrency(grandTotals.totalCategorySales),
          formatCurrency(grandTotals.totalSalesTax),
          formatCurrency(grandTotals.deposit),
          formatCurrency(grandTotals.delivery),
          formatCurrency(grandTotals.other),
          formatCurrency(grandTotals.prepaidSalesTax),
          formatCurrency(grandTotals.invoiceTotal),
          grandTotals.transactions,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      const csvContent = lines.join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `daily-sales-report-${timestamp}.csv`;
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
  }, [rows, grandTotals]);

  const loadLogoAsDataUrl = async (): Promise<string | null> => {
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
        img.src = rabbitLogo;
      });
    } catch {
      return null;
    }
  };

  const handleGeneratePDF = useCallback(async () => {
    if (rows.length === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;

      const dateRangeText =
        filters?.startDate && filters?.endDate
          ? `Date Range: ${formatApiDate(filters.startDate)} thru ${formatApiDate(
              filters.endDate,
            )} | DETAIL`
          : '';
      const headerDate = filters?.endDate
        ? formatApiDate(filters.endDate).replace(/\//g, '-')
        : formatApiDate(new Date().toISOString().slice(0, 10)).replace(/\//g, '-');

      let headerBottomY = 14;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(headerDate, margin, headerBottomY - 4);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales History (Daily Totals)', pageWidth / 2, headerBottomY - 4, {
        align: 'center',
      });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (dateRangeText) {
        doc.text(dateRangeText, margin, headerBottomY);
        headerBottomY += 5;
      }

      const headers = [
        'Document Date',
        'Total Category Sales',
        'Total Sales Tax',
        'Deposit',
        'Delivery',
        'Other',
        'Prepaid Sales Tax',
        'Invoice Total',
        'Transactions',
      ];
      const body: any[] = rows.map((r) => [
        r.documentDate,
        formatCurrency(r.totalCategorySales),
        formatCurrency(r.totalSalesTax),
        formatCurrency(r.deposit),
        formatCurrency(r.delivery),
        formatCurrency(r.other),
        formatCurrency(r.prepaidSalesTax),
        formatCurrency(r.invoiceTotal),
        r.transactions === '' ? '' : String(r.transactions),
      ]);

      const autoTableFn = jspdfAutoTable.default ?? jspdfAutoTable.autoTable ?? jspdfAutoTable;
      autoTableFn(doc, {
        head: [headers],
        body,
        margin: { left: margin, right: margin },
        startY: headerBottomY + 2,
        styles: {
          fontSize: 7,
          cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [80, 80, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        showHead: 'everyPage',
      });

      let finalY = (doc as any).lastAutoTable?.finalY ?? headerBottomY + 10;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, finalY + 2, pageWidth - margin, finalY + 2);
      finalY += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total Category Sales (Grand Total): ${formatCurrency(grandTotals.totalCategorySales)}`,
        margin,
        finalY,
      );
      doc.text(
        `Total Sales Tax (Grand Total): ${formatCurrency(grandTotals.totalSalesTax)}`,
        margin,
        finalY + 5,
      );
      doc.text(
        `Deposit (Grand Total): ${formatCurrency(grandTotals.deposit)}`,
        margin,
        finalY + 10,
      );
      doc.text(
        `Delivery (Grand Total): ${formatCurrency(grandTotals.delivery)}`,
        margin,
        finalY + 15,
      );
      doc.text(
        `Other (Grand Total): ${formatCurrency(grandTotals.other)}`,
        margin,
        finalY + 20,
      );
      doc.text(
        `Prepaid Sales Tax (Grand Total): ${formatCurrency(grandTotals.prepaidSalesTax)}`,
        margin,
        finalY + 25,
      );
      doc.text(
        `Invoice Total (Grand Total): ${formatCurrency(grandTotals.invoiceTotal)}`,
        margin,
        finalY + 30,
      );
      doc.text(
        `Transactions (Grand Total): ${grandTotals.transactions}`,
        margin,
        finalY + 35,
      );

      const totalPages = doc.getNumberOfPages();
      const footerY = doc.internal.pageSize.getHeight() - 5;
      const footerText = 'Report Generated by Woopsa';
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(footerText, margin, footerY);
        if (logoDataUrl) {
          try {
            const tw = doc.getTextWidth(footerText);
            doc.addImage(logoDataUrl, 'PNG', margin + tw + 1, footerY - 2.5, 3, 3);
          } catch {
            // ignore
          }
        }
        doc.setFontSize(7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, {
          align: 'right',
        });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`daily-sales-report-${timestamp}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  }, [filters, rows, grandTotals]);

  return (
    <Box
      sx={{
        height: { xs: 'auto', md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          minHeight: 0,
          p: 2,
          pb: 0.5,
        }}
      >
        {!showPreview && (
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}
          >
            Daily Sales Report Configuration
          </Typography>
        )}

        {!showPreview ? (
          <Paper
            sx={{
              p: 0.75,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(0,0,0,0.01)',
            }}
          >
            <CustomerCommonFilters
              key={`filter-${showPreview ? 'p' : (hasRunPreviewRef.current ? 'restore' : 'new')}`}
              initialValues={!showPreview && hasRunPreviewRef.current && filters ? filters : undefined}
              onFiltersChange={setFilters}
              hideSalesCategory
              hideCostSelect
            />
          </Paper>
        ) : (
          <Paper
            sx={{
              p: 2,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Daily Sales Preview
            </Typography>

            {loadingPreview ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 200,
                }}
              >
                <CircularProgress />
              </Box>
            ) : rows.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No data to display for the selected filters.
              </Typography>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          Document Date
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Total Category Sales
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Total Sales Tax
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Deposit
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Delivery
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Other
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Prepaid Sales Tax
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Invoice Total
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          Transactions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((r, idx) => (
                        <TableRow key={`${r.documentDate}-${idx}`} hover>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.documentDate}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.totalCategorySales)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.totalSalesTax)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.deposit)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.delivery)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.other)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.prepaidSalesTax)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.invoiceTotal)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {r.transactions === '' ? '' : r.transactions}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Total Category Sales (Grand Total):{' '}
                    {formatCurrency(grandTotals.totalCategorySales)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Total Sales Tax (Grand Total): {formatCurrency(grandTotals.totalSalesTax)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Deposit (Grand Total): {formatCurrency(grandTotals.deposit)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Delivery (Grand Total): {formatCurrency(grandTotals.delivery)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Other (Grand Total): {formatCurrency(grandTotals.other)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Prepaid Sales Tax (Grand Total):{' '}
                    {formatCurrency(grandTotals.prepaidSalesTax)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Invoice Total (Grand Total): {formatCurrency(grandTotals.invoiceTotal)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Transactions (Grand Total): {grandTotals.transactions}
                  </Typography>
                </Box>

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
              </>
            )}
          </Paper>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          pt: 0.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: showPreview ? 'space-between' : 'flex-end',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        {!showPreview ? (
          <CustomButton
            type="button"
            buttonType="primary"
            appearance="filled"
            onClick={handlePreview}
            disabled={loadingPreview || !filters?.startDate || !filters?.endDate}
            loading={loadingPreview}
            icon={<PreviewIcon />}
            iconPosition="left"
            fullWidth={false}
            sx={{ minWidth: 180, mt: 0 }}
          >
            Preview
          </CustomButton>
        ) : (
          <>
            <CustomButton
              type="button"
              buttonType="cancel"
              appearance="outlined"
              onClick={() => setShowPreview(false)}
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
                disabled={generatingReport || generatingPDF || rows.length === 0}
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
                disabled={generatingReport || generatingPDF || rows.length === 0}
                loading={generatingPDF}
                icon={!generatingPDF ? <PdfIcon /> : undefined}
                iconPosition="left"
                fullWidth={false}
                sx={{ minWidth: 180, mt: 0 }}
              >
                Generate PDF
              </CustomButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default DailySalesReportTab;
