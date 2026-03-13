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
import { getCustomerRankingSales } from '../../../redux/apis/distrubutor/reportsApis';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { formatApiDate } from '../../../utils/formatApiDate';

interface RankingRow {
  rank: number;
  account: number | string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  allCategoriesProductSales: number;
}

const PREVIEW_PAGE_SIZE = 25;

const SALES_CATEGORY_COUNT = 12;

const COST_LABELS: Record<string, string> = {
  '0': 'Avg Cost',
  '1': 'Base Cost',
  '3': 'Net Cost',
  '2': 'Avg Cost',
};

const computeAllCategoriesSales = (
  row: any,
  selectedSalesCategories: string[] | undefined,
  fallbackTotal: number,
): number => {
  const totalSales = Number(fallbackTotal) || 0;

  if (!selectedSalesCategories || selectedSalesCategories.length === 0) {
    return totalSales;
  }

  // If all categories are selected, just return the total
  if (selectedSalesCategories.length >= SALES_CATEGORY_COUNT) {
    return totalSales;
  }

  let sum = 0;
  selectedSalesCategories.forEach((code) => {
    const n = Number(code);
    if (!Number.isFinite(n) || n < 1 || n > SALES_CATEGORY_COUNT) return;
    const key = `tSales${String(n).padStart(2, '0')}`;
    const value = Number((row as any)[key]);
    if (Number.isFinite(value)) {
      sum += value;
    }
  });

  return sum;
};

function formatCurrency(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

const CustomerRankingSalesTab: React.FC = () => {
  const theme = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterValues | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const hasRunPreviewRef = useRef(false);

  const paginatedRows = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    const end = start + PREVIEW_PAGE_SIZE;
    return rows.slice(start, end);
  }, [rows, previewPage]);

  const totalPreviewPages = useMemo(
    () => Math.ceil(rows.length / PREVIEW_PAGE_SIZE) || 1,
    [rows.length],
  );

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
            row.customer?.C_ClassOfTrade ??
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

      const response = (await getCustomerRankingSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        Value_Code: Number(filters.costOption ?? '0'),
      })) as any;
      const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data?.rows ||
        response?.data ||
        response ||
        [];
      const list = Array.isArray(raw) ? raw : [];
      const filtered = applyFilters(list, filters);

      const mapped: Omit<RankingRow, 'rank'>[] = filtered.map((row: any) => {
        const account =
          row.C_Number ??
          row.Account ??
          row.CustomerNumber ??
          row.customerNumber ??
          row['customer.C_Number'] ??
          '';
        const name =
          row.C_Name ??
          row.Name ??
          row.CustomerName ??
          row.customerName ??
          row['customer.C_Name'] ??
          row['customer.c_name'] ??
          '';
        const address =
          row.C_Address ??
          row.Address ??
          row['customer.C_Address'] ??
          row['customer.c_address'] ??
          '';
        const city =
          row.C_City ?? row.City ?? row['customer.C_City'] ?? row['customer.c_city'] ?? '';
        const state =
          row.C_State ?? row.State ?? row['customer.C_State'] ?? row['customer.c_state'] ?? '';
        const zip =
          row.C_Zip ?? row.Zip ?? row['customer.C_Zip'] ?? row['customer.c_zip'] ?? '';
        const salesRaw =
          row.AllCategoriesProductSales ??
          row.allCategoriesProductSales ??
          row.TotalSales ??
          row.totalSales ??
          row.Invoice_Total ??
          row.SalesTotal ??
          row.Sales_Total ??
          row.totalSalesAmount ??
          0;
        const baseTotalSales = Number(salesRaw) || 0;
        const allCategoriesProductSales = computeAllCategoriesSales(
          row,
          filters?.selectedSalesCategories,
          baseTotalSales,
        );

        return {
          account,
          name,
          address,
          city,
          state,
          zip,
          allCategoriesProductSales,
        };
      });

      mapped.sort((a, b) => b.allCategoriesProductSales - a.allCategoriesProductSales);
      const withRank: RankingRow[] = mapped.map((r, i) => ({ ...r, rank: i + 1 }));
      setRows(withRank);

      if (withRank.length === 0) {
        toast.error('No data found for selected filters.');
      }
    } catch (error) {
      console.error('Error loading Customer Ranking Sales report:', error);
      toast.error('Failed to load Customer Ranking Sales report.');
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
        'Rank',
        'Account',
        'Name',
        'Address',
        'City',
        'State',
        'Zip',
        'All Categories Product Sales',
      ];
      const lines: string[] = [headers.join(',')];
      rows.forEach((r) => {
        const vals = [
          r.rank,
          r.account,
          r.name ?? '',
          r.address ?? '',
          r.city ?? '',
          r.state ?? '',
          r.zip ?? '',
          formatCurrency(r.allCategoriesProductSales),
        ];
        const csvRow = vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
        lines.push(csvRow);
      });
      const csvContent = lines.join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `customer-ranking-sales-${timestamp}.csv`;
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
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;

      const costLabel = COST_LABELS[filters?.costOption ?? '0'] ?? 'Avg Cost';
      const dateRangeText =
        filters?.startDate && filters?.endDate
          ? `Date Range: ${formatApiDate(filters.startDate)} thru ${formatApiDate(filters.endDate)}`
          : '';
      const headerDate = filters?.endDate
        ? formatApiDate(filters.endDate).replace(/\//g, '-')
        : formatApiDate(new Date().toISOString().slice(0, 10)).replace(/\//g, '-');

      let headerBottomY = 18;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(headerDate, margin, headerBottomY - 6);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales History (Customer Ranking - Sales)', pageWidth / 2, headerBottomY - 6, {
        align: 'center',
      });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (dateRangeText) {
        doc.text(dateRangeText, margin, headerBottomY - 2);
        headerBottomY += 2;
      }
      doc.text(costLabel, margin, headerBottomY);
      doc.text('State Jurisdiction: All State Jurisdictions', margin, headerBottomY + 4);
      headerBottomY += 10;

      const headers = [
        'Rank',
        'Account',
        'Name',
        'Address',
        'City',
        'State',
        'Zip',
        'All Categories Product Sales',
      ];
      const body: any[] = rows.map((r) => [
        r.rank,
        String(r.account),
        r.name ?? '',
        r.address ?? '',
        r.city ?? '',
        r.state ?? '',
        r.zip ?? '',
        formatCurrency(r.allCategoriesProductSales),
      ]);

      const autoTableFn = jspdfAutoTable.default ?? jspdfAutoTable.autoTable ?? jspdfAutoTable;
      autoTableFn(doc, {
        head: [headers],
        body,
        margin: { left: margin, right: margin },
        startY: headerBottomY,
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
        columnStyles: {
          7: { halign: 'right' },
        },
      });

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
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`customer-ranking-sales-${timestamp}.pdf`);
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
            sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}
          >
            Customer Ranking Sales Configuration
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
              Customer Ranking Sales Preview
            </Typography>

            {loadingPreview ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
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
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Rank</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Account</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Address</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>City</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>State</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Zip</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">
                          All Categories Product Sales
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((r, idx) => (
                        <TableRow key={`${r.rank}-${r.account}-${idx}`} hover>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.rank}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.account}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.address}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.city}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.state}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.zip}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }} align="right">
                            {formatCurrency(r.allCategoriesProductSales)}
                          </TableCell>
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

export default CustomerRankingSalesTab;
