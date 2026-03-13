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
import { getCustomerWithProfit } from '../../../redux/apis/distrubutor/reportsApis';
import { getSalesCategoryList } from '../../../redux/apis/distrubutor/listApis';
import CustomerCommonFilters, { CustomerFilterValues } from './CustomerCommonFilters';
import { formatApiDate } from '../../../utils/formatApiDate';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

interface InvoiceRow {
  invoiceDate: string;
  invoiceNumber: string;
  salesTax: number;
  deposit: number;
  delivery: number;
  other: number;
  prepaidSalesTax: number;
  invoiceTotal: number;
}

/** Per-category totals: index 0 = category 1, index 1 = category 2, ... index 11 = category 12 */
export interface CategoryTotals {
  sales: number[];
  cost: number[];
  profit: number[];
}

interface SalesCategoryItem {
  Sales_Category: number;
  Category_Desc: string;
}

interface CustomerGroup {
  customerKey: string;
  customerNumber?: string | number;
  customerName?: string;
  addressLines: string[];
  phone?: string;
  invoices: InvoiceRow[];
  totals: {
    salesTax: number;
    deposit: number;
    delivery: number;
    other: number;
    prepaidSalesTax: number;
    invoiceTotal: number;
  };
  categoryTotals: CategoryTotals;
}

const toNumber = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const PREVIEW_PAGE_SIZE = 3;

const CATEGORY_COUNT = 12;

const emptyCategoryTotals = (): CategoryTotals => ({
  sales: Array.from({ length: CATEGORY_COUNT }, () => 0),
  cost: Array.from({ length: CATEGORY_COUNT }, () => 0),
  profit: Array.from({ length: CATEGORY_COUNT }, () => 0),
});

const CustomerWithProfitTab: React.FC = () => {
  const theme = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterValues | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [salesCategoryList, setSalesCategoryList] = useState<SalesCategoryItem[]>([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const hasRunPreviewRef = useRef(false);

  const grandTotals = useMemo(() => {
    return customerGroups.reduce(
      (acc, group) => ({
        salesTax: acc.salesTax + group.totals.salesTax,
        deposit: acc.deposit + group.totals.deposit,
        delivery: acc.delivery + group.totals.delivery,
        other: acc.other + group.totals.other,
        prepaidSalesTax: acc.prepaidSalesTax + group.totals.prepaidSalesTax,
        invoiceTotal: acc.invoiceTotal + group.totals.invoiceTotal,
      }),
      {
        salesTax: 0,
        deposit: 0,
        delivery: 0,
        other: 0,
        prepaidSalesTax: 0,
        invoiceTotal: 0,
      },
    );
  }, [customerGroups]);

  /** Grand totals per sales category (1-12) across all customers */
  const categoryGrandTotals = useMemo((): CategoryTotals => {
    return customerGroups.reduce(
      (acc, group) => {
        for (let i = 0; i < CATEGORY_COUNT; i++) {
          acc.sales[i] += group.categoryTotals.sales[i];
          acc.cost[i] += group.categoryTotals.cost[i];
          acc.profit[i] += group.categoryTotals.profit[i];
        }
        return acc;
      },
      emptyCategoryTotals(),
    );
  }, [customerGroups]);

  const paginatedGroups = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE;
    const end = start + PREVIEW_PAGE_SIZE;
    return customerGroups.slice(start, end);
  }, [customerGroups, previewPage]);

  const totalPreviewPages = useMemo(
    () => Math.ceil(customerGroups.length / PREVIEW_PAGE_SIZE) || 1,
    [customerGroups.length],
  );

  const applyFilters = useCallback(
    (rows: any[], currentFilters: CustomerFilterValues): any[] => {
      return rows.filter((row) => {
        // Active / Inactive (status filter applies even when no customer is selected)
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

        // Sales Category
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
      const customerNumber =
        row.C_Number ?? row.CustomerNumber ?? row.customerNumber ?? row['customer.C_Number'];
      const customerName =
        row.C_Name ??
        row.CustomerName ??
        row.customerName ??
        row['customer.C_Name'] ??
        row['customer.c_name'];
      const address1 =
        row.C_Address ?? row.Address ?? row['customer.C_Address'] ?? row['customer.c_address'] ?? '';
      const city = row.C_City ?? row.City ?? row['customer.C_City'] ?? row['customer.c_city'] ?? '';
      const state =
        row.C_State ?? row.State ?? row['customer.C_State'] ?? row['customer.c_state'] ?? '';
      const zip = row.C_Zip ?? row.Zip ?? row['customer.C_Zip'] ?? row['customer.c_zip'] ?? '';
      const phone =
        row.C_Phone ?? row.Phone ?? row['customer.C_Phone'] ?? row['customer.c_phone'] ?? '';

      const customerKey = String(customerNumber ?? customerName ?? 'UNKNOWN');

      if (!map.has(customerKey)) {
        map.set(customerKey, {
          customerKey,
          customerNumber,
          customerName,
          addressLines: [
            address1,
            [city, state, zip].filter((p) => p).join(' '),
          ].filter((l) => l),
          phone,
          invoices: [],
          totals: {
            salesTax: 0,
            deposit: 0,
            delivery: 0,
            other: 0,
            prepaidSalesTax: 0,
            invoiceTotal: 0,
          },
          categoryTotals: emptyCategoryTotals(),
        });
      }

      const group = map.get(customerKey)!;

      const invoiceDateRaw =
        row.Invoice_Date ?? row.InvoiceDate ?? row.InvDate ?? row.Date ?? row.Invoice_DateTime;
      const invoiceNumber =
        row.Document_Number ?? row.InvoiceNumber ?? row.Invoice_Number ?? row.InvNo ?? row.Invoice_No ?? '';
      const salesTax = toNumber(
        row.totalSalesTax ??
          row.Total_Sales_Tax ??
          row.SalesTax ??
          row.TotalSalesTax ??
          row.Total_SalesTax,
      );
      const deposit = toNumber(row.Invoice_Deposit ?? row.Deposit ?? row.TotalDeposit);
      const delivery = toNumber(row.Delivery_Charge ?? row.Delivery ?? row.DeliveryCharge);
      const other = toNumber(row.Other_Charge ?? row.Other ?? row.OtherCharge);
      const prepaidSalesTax = toNumber(
        row.PrepaidTax_Amount ?? row.Prepaid_Sales_Tax ?? row.PrepaidSalesTax ?? row.Prepaid_Tax,
      );
      const invoiceTotal =
        toNumber(row.Invoice_Total ?? row.InvoiceTotal ?? row.Total ?? row.Total_Invoice);

      group.invoices.push({
        invoiceDate: invoiceDateRaw ? formatApiDate(String(invoiceDateRaw)) : '',
        invoiceNumber: String(invoiceNumber ?? ''),
        salesTax,
        deposit,
        delivery,
        other,
        prepaidSalesTax,
        invoiceTotal,
      });

      group.totals.salesTax += salesTax;
      group.totals.deposit += deposit;
      group.totals.delivery += delivery;
      group.totals.other += other;
      group.totals.prepaidSalesTax += prepaidSalesTax;
      group.totals.invoiceTotal += invoiceTotal;

      for (let i = 1; i <= CATEGORY_COUNT; i++) {
        const key = String(i).padStart(2, '0');
        const sales = toNumber((row as any)[`totalSales${key}`]);
        const cost = toNumber((row as any)[`totalCost${key}`]);
        const profit = toNumber((row as any)[`profit${key}`]);
        const idx = i - 1;
        group.categoryTotals.sales[idx] += sales;
        group.categoryTotals.cost[idx] += cost;
        group.categoryTotals.profit[idx] += profit;
      }
    });

    return Array.from(map.values());
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

      const [reportRes, categoryRes] = await Promise.all([
        getCustomerWithProfit({
          startDate: filters.startDate,
          endDate: filters.endDate,
          Value_Code: Number(filters.costOption || '0'),
        }),
        getSalesCategoryList(),
      ]);

      const catData = (categoryRes as any)?.data;
      const catList = Array.isArray(catData) ? catData : catData?.data ?? catData?.salesCategory ?? [];
      setSalesCategoryList(
        (catList || []).map((item: any) => ({
          Sales_Category: item.Sales_Category ?? 0,
          Category_Desc: item.Category_Desc ?? '',
        })),
      );

      const response = reportRes as any;
      const raw =
        response?.data?.data?.data ||
        response?.data?.data ||
        response?.data?.rows ||
        response?.data ||
        response ||
        [];

      const list = Array.isArray(raw) ? raw : [];
      const filtered = applyFilters(list, filters);
      const grouped = groupByCustomer(filtered);
      setCustomerGroups(grouped);

      if (grouped.length === 0) {
        toast.error('No data found for selected filters.');
      }
    } catch (error) {
      console.error('Error loading Customer With Profit report:', error);
      toast.error('Failed to load Customer With Profit report.');
      setShowPreview(false);
      setCustomerGroups([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [applyFilters, filters, groupByCustomer]);

  const handleGenerateCSV = useCallback(() => {
    if (customerGroups.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingReport(true);
    try {
      const headers = [
        'Customer Number',
        'Customer Name',
        'Invoice Date',
        'Invoice #',
        'Total Sales Tax',
        'Deposit',
        'Delivery',
        'Other',
        'Prepaid Sales Tax',
        'Invoice Total',
      ];
      const rows: string[] = [headers.join(',')];

      customerGroups.forEach((group) => {
        group.invoices.forEach((inv) => {
          const values = [
            group.customerNumber ?? '',
            group.customerName ?? '',
            inv.invoiceDate,
            inv.invoiceNumber,
            inv.salesTax.toFixed(2),
            inv.deposit.toFixed(2),
            inv.delivery.toFixed(2),
            inv.other.toFixed(2),
            inv.prepaidSalesTax.toFixed(2),
            inv.invoiceTotal.toFixed(2),
          ];
          const csvRow = values
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',');
          rows.push(csvRow);
        });
      });

      const csvContent = rows.join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `customer-with-profit-${timestamp}.csv`;

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
  }, [customerGroups]);

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

  const getProfitPercent = (sales: number, profit: number): string => {
    if (!Number.isFinite(sales) || sales <= 0) return '0.00';
    const pct = (profit / sales) * 100;
    return Number.isFinite(pct) ? pct.toFixed(2) : '0.00';
  };

  const handleGeneratePDF = useCallback(async () => {
    if (customerGroups.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const invoiceHeaders = [
        'Date',
        'Number',
        'Total Sales Tax',
        'Deposit',
        'Delivery',
        'Other',
        'Prepaid Sales Tax',
        'Invoice Total',
      ];

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
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

      const formatHeaderDate = (dateStr?: string) => {
        if (!dateStr) {
          const now = new Date();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const year = now.getFullYear();
          return `${month}-${day}-${year}`;
        }
        return formatApiDate(dateStr).replace(/\//g, '-');
      };

      const costLabel =
        filters?.costOption === '1'
          ? 'Base Cost'
          : filters?.costOption === '3'
          ? 'Net Cost'
          : 'Avg Cost';

      const dateRangeText =
        filters?.startDate && filters?.endDate
          ? `Date Range: ${formatApiDate(filters.startDate)} thru ${formatApiDate(
              filters.endDate,
            )} | ${costLabel}`
          : '';

      const reportDate = formatHeaderDate(filters?.endDate);

      // Header (first page)
      let headerBottomY = 16;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(reportDate, margin, headerBottomY - 4);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales History (Customer w/Profit)', pageWidth / 2, headerBottomY - 4, {
        align: 'center',
      });

      if (dateRangeText) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(dateRangeText, margin, headerBottomY);
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

      const categoryTableHeaders = ['Sales Category', 'Sales', costLabel, 'Profit', '%'];

      const buildCategoryRows = (totals: CategoryTotals) =>
        salesCategoryList
          .filter(
            (cat) =>
              cat.Sales_Category >= 1 &&
              cat.Sales_Category <= CATEGORY_COUNT &&
              (totals.sales[cat.Sales_Category - 1] ?? 0) > 0,
          )
          .map((cat) => {
            const idx = cat.Sales_Category - 1;
            const sales = totals.sales[idx] ?? 0;
            const cost = totals.cost[idx] ?? 0;
            const profit = totals.profit[idx] ?? 0;
            const pct = getProfitPercent(sales, profit);
            return [
              cat.Category_Desc,
              formatCurrency(sales),
              formatCurrency(cost),
              formatCurrency(profit),
              `${pct}%`,
            ];
          });

      let startY = headerBottomY + 2;

      for (const group of customerGroups) {
        if (startY > pageHeight - 60) {
          doc.addPage();
          startY = margin;
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `Customer ${group.customerNumber ?? ''} ${group.customerName ?? ''}`.trim(),
          margin,
          startY,
        );
        startY += 5;
        if (group.addressLines.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          group.addressLines.forEach((line) => {
            doc.text(line, margin, startY);
            startY += 4;
          });
        }
        if (group.phone) {
          doc.text(`Phone: ${group.phone}`, margin, startY);
          startY += 4;
        }
        startY += 2;

        const invoiceBody: any[] = [];
        group.invoices.forEach((inv) => {
          invoiceBody.push([
            inv.invoiceDate,
            inv.invoiceNumber,
            inv.salesTax.toFixed(2),
            inv.deposit.toFixed(2),
            inv.delivery.toFixed(2),
            inv.other.toFixed(2),
            inv.prepaidSalesTax.toFixed(2),
            inv.invoiceTotal.toFixed(2),
          ]);
        });
        invoiceBody.push([
          { content: 'CUSTOMER TOTALS:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
          formatCurrency(group.totals.salesTax),
          formatCurrency(group.totals.deposit),
          formatCurrency(group.totals.delivery),
          formatCurrency(group.totals.other),
          formatCurrency(group.totals.prepaidSalesTax),
          formatCurrency(group.totals.invoiceTotal),
        ]);

        autoTableFn(doc, {
          head: [invoiceHeaders],
          body: invoiceBody,
          margin: { left: margin, right: margin },
          styles: tableStyles,
          headStyles,
          startY,
        });
        startY = (doc as any).lastAutoTable.finalY + 4;

        const categoryRows = buildCategoryRows(group.categoryTotals);
        if (categoryRows.length > 0) {
          if (startY > pageHeight - 50) {
            doc.addPage();
            startY = margin;
          }
          autoTableFn(doc, {
            head: [categoryTableHeaders],
            body: categoryRows,
            margin: { left: margin, right: margin },
            styles: tableStyles,
            headStyles,
            startY,
          });
          startY = (doc as any).lastAutoTable.finalY + 8;
        }
      }

      if (startY > pageHeight - 50) {
        doc.addPage();
        startY = margin;
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT TOTALS (Sales Category Wise)', margin, startY);
      startY += 6;

      const reportTotalRows = buildCategoryRows(categoryGrandTotals);
      if (reportTotalRows.length > 0) {
        autoTableFn(doc, {
          head: [categoryTableHeaders],
          body: reportTotalRows,
          margin: { left: margin, right: margin },
          styles: tableStyles,
          headStyles,
          startY,
        });
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`customer-with-profit-${timestamp}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  }, [customerGroups, filters, salesCategoryList, categoryGrandTotals]);

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
            Customer With Profit Configuration
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
              Customer With Profit Preview
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
            ) : customerGroups.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No data to display for the selected filters.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {paginatedGroups.map((group) => (
                  <Box key={group.customerKey} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Customer {group.customerNumber ?? ''} {group.customerName ?? ''}
                        </Typography>
                        {group.addressLines.map((line, idx) => (
                          <Typography key={idx} sx={{ fontSize: '0.75rem' }}>
                            {line}
                          </Typography>
                        ))}
                      </Box>
                      {group.phone && (
                        <Typography sx={{ fontSize: '0.75rem' }}>Phone: {group.phone}</Typography>
                      )}
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Number</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Total Sales Tax
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Deposit
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Delivery
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Other
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Prepaid Sales Tax
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Invoice Total
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.invoices.map((inv, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{inv.invoiceDate}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{inv.invoiceNumber}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                {formatCurrency(inv.salesTax)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                {formatCurrency(inv.deposit)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                {formatCurrency(inv.delivery)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                {formatCurrency(inv.other)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                {formatCurrency(inv.prepaidSalesTax)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                {formatCurrency(inv.invoiceTotal)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              CUSTOMER TOTALS:
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              {formatCurrency(group.totals.salesTax)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              {formatCurrency(group.totals.deposit)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              {formatCurrency(group.totals.delivery)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              {formatCurrency(group.totals.other)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              {formatCurrency(group.totals.prepaidSalesTax)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderTop: `1px solid ${theme.palette.divider}` }}
                            >
                              {formatCurrency(group.totals.invoiceTotal)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {salesCategoryList.length > 0 && (() => {
                      const costLabelPreview =
                        filters?.costOption === '1'
                          ? 'Base Cost'
                          : filters?.costOption === '3'
                            ? 'Net Cost'
                            : 'Avg Cost';
                      const categoryRowsPreview = salesCategoryList
                        .filter(
                          (cat) =>
                            cat.Sales_Category >= 1 &&
                            cat.Sales_Category <= CATEGORY_COUNT &&
                            (group.categoryTotals.sales[cat.Sales_Category - 1] ?? 0) > 0,
                        )
                        .map((cat) => {
                          const idx = cat.Sales_Category - 1;
                          const sales = group.categoryTotals.sales[idx] ?? 0;
                          const cost = group.categoryTotals.cost[idx] ?? 0;
                          const profit = group.categoryTotals.profit[idx] ?? 0;
                          const pct = getProfitPercent(sales, profit);
                          return { desc: cat.Category_Desc, sales, cost, profit, pct };
                        });
                      if (categoryRowsPreview.length === 0) return null;
                      return (
                        <TableContainer sx={{ mt: 1.5 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Sales Category</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Sales</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{costLabelPreview}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Profit</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>%</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {categoryRowsPreview.map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.desc}</TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(row.sales)}</TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(row.cost)}</TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(row.profit)}</TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{row.pct}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      );
                    })()}
                  </Box>
                ))}

                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                    REPORT TOTALS
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Total Sales Tax</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Deposit</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Delivery</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Other</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Prepaid Sales Tax</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Invoice Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{formatCurrency(grandTotals.salesTax)}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{formatCurrency(grandTotals.deposit)}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{formatCurrency(grandTotals.delivery)}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{formatCurrency(grandTotals.other)}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {formatCurrency(grandTotals.prepaidSalesTax)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{formatCurrency(grandTotals.invoiceTotal)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {salesCategoryList.length > 0 && (() => {
                  const costLabelReport =
                    filters?.costOption === '1'
                      ? 'Base Cost'
                      : filters?.costOption === '3'
                        ? 'Net Cost'
                        : 'Avg Cost';
                  const reportCategoryRows = salesCategoryList
                    .filter(
                      (cat) =>
                        cat.Sales_Category >= 1 &&
                        cat.Sales_Category <= CATEGORY_COUNT &&
                        (categoryGrandTotals.sales[cat.Sales_Category - 1] ?? 0) > 0,
                    )
                    .map((cat) => {
                      const idx = cat.Sales_Category - 1;
                      const sales = categoryGrandTotals.sales[idx] ?? 0;
                      const cost = categoryGrandTotals.cost[idx] ?? 0;
                      const profit = categoryGrandTotals.profit[idx] ?? 0;
                      const pct = getProfitPercent(sales, profit);
                      return { desc: cat.Category_Desc, sales, cost, profit, pct };
                    });
                  if (reportCategoryRows.length === 0) return null;
                  return (
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                        REPORT TOTALS (Sales Category Wise)
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Sales Category</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Sales</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{costLabelReport}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Profit</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>%</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportCategoryRows.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{row.desc}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(row.sales)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(row.cost)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatCurrency(row.profit)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{row.pct}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })()}

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
              </Box>
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
                disabled={generatingReport || generatingPDF || customerGroups.length === 0}
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
                disabled={generatingReport || generatingPDF || customerGroups.length === 0}
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

export default CustomerWithProfitTab;

