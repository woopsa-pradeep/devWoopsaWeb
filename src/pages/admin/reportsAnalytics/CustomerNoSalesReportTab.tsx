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
import { getCustomerNoSalesReport } from '../../../redux/apis/distrubutor/reportsApis';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { formatApiDate } from '../../../utils/formatApiDate';

interface NoSalesRow {
  customerNumber?: number | string;
  customerName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  lastInvoiceDate?: string;
  lastInvoiceNumber?: string | number;
  lastInvoiceTotal?: string | number;
}

const PREVIEW_PAGE_SIZE = 25;

const CustomerNoSalesReportTab: React.FC = () => {
  const theme = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterValues | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rows, setRows] = useState<NoSalesRow[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const hasRunPreviewRef = useRef(false);

  const applyFilters = useCallback(
    (data: any[], currentFilters: CustomerFilterValues): any[] => {
      return data.filter((row) => {
        // Active / Inactive
        const inactiveRaw =
          row.C_Inactive ??
          row['customer.C_Inactive'] ??
          row.customer?.C_Inactive ??
          row.customer?.c_inactive;
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
            row.customer?.C_Number;
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
            row['customer.S_Number'] ??
            row.customer?.S_Number;
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
            : row.customer?.Route_Number !== undefined
            ? [row.customer.Route_Number]
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
            row.customer?.Jurisdiction_State;
          if (!currentFilters.selectedJurisdictionState.includes(String(js ?? ''))) return false;
        }

        // Jurisdiction County
        if (currentFilters.selectedJurisdictionCounty.length > 0) {
          const jc =
            row.taxRateCounty?.Jurisdiction_County ??
            row.Jurisdiction_County ??
            row.CountyTax?.Jurisdiction_County ??
            row['customer.Jurisdiction_County'] ??
            row.customer?.Jurisdiction_County;
          if (!currentFilters.selectedJurisdictionCounty.includes(String(jc ?? ''))) return false;
        }

        // Jurisdiction City
        if (currentFilters.selectedJurisdictionCity.length > 0) {
          const jcity =
            row.taxRateCity?.Jurisdiction_City ??
            row.Jurisdiction_City ??
            row.CityTax?.Jurisdiction_City ??
            row['customer.Jurisdiction_City'] ??
            row.customer?.Jurisdiction_City;
          if (!currentFilters.selectedJurisdictionCity.includes(String(jcity ?? ''))) {
            return false;
          }
        }

        return true;
      });
    },
    [],
  );

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

      const response = (await getCustomerNoSalesReport(
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

      const mapped: NoSalesRow[] = filtered.map((row: any) => {
        const customerNumber =
          row.C_Number ?? row.CustomerNumber ?? row.customerNumber ?? row['customer.C_Number'];
        const customerName =
          row.C_Name ??
          row.CustomerName ??
          row.customerName ??
          row['customer.C_Name'] ??
          row['customer.c_name'];
        const address =
          row.C_Address ??
          row.Address ??
          row['customer.C_Address'] ??
          row['customer.c_address'] ??
          '';
        const city = row.C_City ?? row.City ?? row['customer.C_City'] ?? row['customer.c_city'] ?? '';
        const state =
          row.C_State ?? row.State ?? row['customer.C_State'] ?? row['customer.c_state'] ?? '';
        const zip = row.C_Zip ?? row.Zip ?? row['customer.C_Zip'] ?? row['customer.c_zip'] ?? '';
        const phone =
          row.C_Phone ?? row.Phone ?? row['customer.C_Phone'] ?? row['customer.c_phone'] ?? '';

        const lastInvoiceDateRaw =
          row.Invoice_Date ??
          row.LastInvoiceDate ??
          row.Last_Invoice_Date ??
          row.invoiceDate ??
          row.lastInvoiceDate;
        const lastInvoiceNumber =
          row.Invoice_Number ??
          row.InvoiceNumber ??
          row.Document_Number ??
          row.Order_Number ??
          row.LastInvoiceNumber ??
          row.lastInvoiceNumber;
        const lastInvoiceTotalRaw =
          row.Invoice_Total ??
          row.InvoiceTotal ??
          row.LastInvoiceTotal ??
          row.lastInvoiceTotal;

        const lastInvoiceDate = lastInvoiceDateRaw
          ? formatApiDate(String(lastInvoiceDateRaw).slice(0, 10))
          : '';
        const lastInvoiceTotal =
          lastInvoiceTotalRaw !== undefined &&
          lastInvoiceTotalRaw !== null &&
          lastInvoiceTotalRaw !== ''
            ? Number(lastInvoiceTotalRaw).toFixed(2)
            : '';

        return {
          customerNumber,
          customerName,
          address,
          city,
          state,
          zip,
          phone,
          lastInvoiceDate,
          lastInvoiceNumber,
          lastInvoiceTotal,
        };
      });

      setRows(mapped);

      if (mapped.length === 0) {
        toast.error('No data found for selected filters.');
      }
    } catch (error) {
      console.error('Error loading Customer No Sales report:', error);
      toast.error('Failed to load Customer No Sales report.');
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
        'Customer Number',
        'Customer Name',
        'Address',
        'City',
        'State',
        'Zip',
        'Phone',
        'Last Invoice Date',
        'Last Invoice Number',
        'Last Invoice Total',
      ];
      const lines: string[] = [headers.join(',')];

      rows.forEach((r) => {
        const vals = [
          r.customerNumber ?? '',
          r.customerName ?? '',
          r.address ?? '',
          r.city ?? '',
          r.state ?? '',
          r.zip ?? '',
          r.phone ?? '',
          r.lastInvoiceDate ?? '',
          r.lastInvoiceNumber ?? '',
          r.lastInvoiceTotal ?? '',
        ];
        const csvRow = vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
        lines.push(csvRow);
      });

      const csvContent = lines.join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `customer-no-sales-${timestamp}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV report generated successfully');
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast.error('Failed to generate CSV report');
    } finally {
      setGeneratingReport(false);
    }
  }, [rows]);

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

  const handleGeneratePDF = useCallback(async () => {
    if (rows.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const headers = [
        'Customer Number / Name',
        'Address',
        'City',
        'State',
        'Zip',
        'Phone',
        'Last Invoice Date',
        'Last Invoice Number',
        'Last Invoice Total',
      ];

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;

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

      const dateRangeText =
        filters?.startDate && filters?.endDate
          ? `Date Range: ${formatApiDate(filters.startDate)} thru ${formatApiDate(
              filters.endDate,
            )}`
          : '';

      const headerDate = filters?.endDate
        ? formatApiDate(filters.endDate).replace(/\//g, '-')
        : formatApiDate(new Date().toISOString().slice(0, 10)).replace(/\//g, '-');

      let headerBottomY = 16;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(headerDate, margin, headerBottomY - 4);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales History (Customer No Sales)', pageWidth / 2, headerBottomY - 4, {
        align: 'center',
      });

      if (dateRangeText) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${dateRangeText}`, margin, headerBottomY);
        headerBottomY += 4;
      }

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
            // ignore
          }
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const pageText = `Page ${pageNum} of ${totalPagesCount}`;
        doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
      };

      const body: any[] = rows.map((r) => [
        `${r.customerNumber ?? ''} ${r.customerName ?? ''}`.trim(),
        r.address ?? '',
        r.city ?? '',
        r.state ?? '',
        r.zip ?? '',
        r.phone ?? '',
        r.lastInvoiceDate ?? '',
        r.lastInvoiceNumber ?? '',
        r.lastInvoiceTotal ?? '',
      ]);

      autoTableFn(doc, {
        head: [headers],
        body,
        margin: { left: margin, right: margin },
        styles: tableStyles,
        headStyles,
        showHead: 'everyPage',
        startY: headerBottomY + 2,
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`customer-no-sales-${timestamp}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  }, [filters, rows]);

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
            sx={{
              fontWeight: 500,
              fontSize: '0.813rem',
              mb: 1,
              mt: 0,
            }}
          >
            Customer No Sales Report Configuration
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
              Customer No Sales Preview
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
                          Customer Number / Name
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Address</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>City</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>State</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Zip</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Phone</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          Last Invoice Date
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          Last Invoice Number
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          Last Invoice Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((r, idx) => (
                        <TableRow key={`${r.customerNumber}-${idx}`} hover>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {`${r.customerNumber ?? ''} ${r.customerName ?? ''}`.trim()}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.address}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.city}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.state}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.zip}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.phone}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{r.lastInvoiceDate}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{r.lastInvoiceNumber}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{r.lastInvoiceTotal}</TableCell>
                        </TableRow>
                      ))}
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

export default CustomerNoSalesReportTab;

