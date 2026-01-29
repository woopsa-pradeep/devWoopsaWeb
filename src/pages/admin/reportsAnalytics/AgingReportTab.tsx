import React, { useState, useMemo, useEffect } from 'react';
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
  FormControl,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
const jspdfAutoTable = require('jspdf-autotable');
import { getAgingReport, listOfARStatementreports } from '../../../redux/apis/distrubutor/reportsApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

export interface AgingReportItem {
  C_Number: number;
  C_Name: string;
  C_Salesman: number;
  Route_Number: number | null;
  C_CoName: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  BT_Number: number;
  BT_Name: string | null;
  RepName: string;
  DaysUntilDue: number;
  Terms: string;
  fCharge: number;
  netAmount: number;
  current: number;
  over7: number;
  over14: number;
  over30: number;
  over60: number;
}

interface SalesRepOption {
  label: string;
  value: string;
  S_Number: number;
  S_Desc: string;
}

interface RouteOption {
  label: string;
  value: string;
  Route_Number: number;
  Route_Description: string;
}

type ReportType = 'normal' | 'groupBySalesRep';

function formatMoney(val: number): string {
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return val < 0 ? `(${formatted})` : `$${formatted}`;
}

const REPORT_TYPE_OPTIONS = [
  { label: 'Standard Report', value: 'normal' },
  { label: 'Group by Sales rep', value: 'groupBySalesRep' },
];

const AgingReportTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  const [salesReps, setSalesReps] = useState<SalesRepOption[]>([]);
  const [selectedSalesReps, setSelectedSalesReps] = useState<SalesRepOption[]>([]);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<RouteOption[]>([]);

  const [reportType, setReportType] = useState<ReportType>('normal');

  const [reportData, setReportData] = useState<AgingReportItem[]>([]);
  const [rawFetchedData, setRawFetchedData] = useState<AgingReportItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Fetch sales reps and routes from listOfARStatementreports (same as AR Statement)
  useEffect(() => {
    const fetchFilters = async () => {
      setLoadingFilters(true);
      try {
        const response = (await listOfARStatementreports()) as { data?: { data?: { salesRep?: unknown[]; route?: unknown[] }; salesRep?: unknown[]; route?: unknown[] }; salesRep?: unknown[]; route?: unknown[] };
        const responseData = (response?.data?.data ?? response?.data ?? response) as { salesRep?: unknown[]; route?: unknown[] } | undefined;

        if (responseData?.salesRep && Array.isArray(responseData.salesRep)) {
          const salesRepOptions: SalesRepOption[] = (responseData.salesRep as { S_Number?: number; S_Desc?: string }[])
            .filter((rep: { S_Desc?: string }) => rep.S_Desc?.trim?.())
            .map((rep: { S_Number?: number; S_Desc?: string }) => ({
              label: `${rep.S_Number ?? ''} - ${rep.S_Desc ?? 'Unknown'}`,
              value: String(rep.S_Number ?? ''),
              S_Number: rep.S_Number ?? 0,
              S_Desc: rep.S_Desc ?? 'Unknown',
            }));
          setSalesReps(salesRepOptions);
        }

        if (responseData?.route && Array.isArray(responseData.route)) {
          const routeOptions: RouteOption[] = (responseData.route as { Route_Number?: number; Route_Description?: string }[]).map(
            (route: { Route_Number?: number; Route_Description?: string }) => ({
              label: `${route.Route_Number ?? ''} - ${route.Route_Description ?? 'Unknown'}`,
              value: String(route.Route_Number ?? ''),
              Route_Number: route.Route_Number ?? 0,
              Route_Description: route.Route_Description ?? 'Unknown',
            })
          );
          setRoutes(routeOptions);
        }
      } catch (error) {
        console.error('Error fetching Aging Report filter options:', error);
        toast.error('Failed to load filter options');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, []);

  const filteredData = useMemo(() => {
    let data = rawFetchedData;
    if (selectedSalesReps.length > 0) {
      const repNumbers = selectedSalesReps.map((s) => s.S_Number);
      data = data.filter((r) => repNumbers.includes(r.C_Salesman));
    }
    if (selectedRoutes.length > 0) {
      const routeNumbers = selectedRoutes.map((r) => r.Route_Number);
      data = data.filter((r) => r.Route_Number != null && routeNumbers.includes(r.Route_Number));
    }
    return data;
  }, [rawFetchedData, selectedSalesReps, selectedRoutes]);

  const displayData = useMemo(() => {
    return filteredData;
  }, [filteredData]);

  const groupedBySalesRep = useMemo(() => {
    if (reportType !== 'groupBySalesRep') return [];
    const groups: { salesman: number; repName: string; rows: AgingReportItem[] }[] = [];
    const bySalesman: Record<number, AgingReportItem[]> = {};
    displayData.forEach((row) => {
      if (!bySalesman[row.C_Salesman]) {
        bySalesman[row.C_Salesman] = [];
      }
      bySalesman[row.C_Salesman].push(row);
    });
    (Object.keys(bySalesman) as unknown as number[]).sort((a, b) => a - b).forEach((salesman) => {
      const rows = bySalesman[salesman];
      const repName = rows[0]?.RepName ?? '';
      groups.push({ salesman, repName, rows });
    });
    return groups;
  }, [reportType, displayData]);

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start date and end date');
      return;
    }
    setPreviewLoading(true);
    try {
      const startStr = startDate.format('YYYY-MM-DD');
      const endStr = endDate.format('YYYY-MM-DD');
      const res = (await getAgingReport(startStr, endStr)) as { data?: AgingReportItem[] | { data?: AgingReportItem[] } };
      let list: AgingReportItem[] = [];
      const resData = res?.data;
      if (Array.isArray(resData)) {
        list = resData;
      } else if (resData && typeof resData === 'object' && Array.isArray((resData as { data?: AgingReportItem[] }).data)) {
        list = (resData as { data: AgingReportItem[] }).data;
      }
      setRawFetchedData(list);
      setShowPreview(true);
      let filtered = list;
      if (selectedSalesReps.length > 0) {
        const repNumbers = selectedSalesReps.map((s) => s.S_Number);
        filtered = filtered.filter((r) => repNumbers.includes(r.C_Salesman));
      }
      if (selectedRoutes.length > 0) {
        const routeNums = selectedRoutes.map((rt) => rt.Route_Number);
        filtered = filtered.filter((r) => r.Route_Number != null && routeNums.includes(r.Route_Number));
      }
      const filteredCount = filtered.length;
      if (filteredCount === 0) {
        toast.success('No data found for the selected criteria');
      } else {
        toast.success(`Loaded ${filteredCount} record(s)`);
      }
    } catch (err: unknown) {
      console.error('Error loading Aging Report:', err);
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load Aging Report');
      setRawFetchedData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    setReportData(displayData);
  }, [displayData]);

  const handleGenerateCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingReport(true);
    try {
      const headers = ['Customer Name', 'Rep', 'Current', 'Over 7', 'Over 14', 'Over 30', 'Over 60', 'Total Due'];
      const rows: string[][] = [headers];

      if (reportType === 'groupBySalesRep') {
        groupedBySalesRep.forEach((grp) => {
          rows.push([`Rep ${grp.salesman} — ${grp.repName}`, '', '', '', '', '', '', '']);
          grp.rows.forEach((r) => {
            rows.push([
              `${r.C_Number} - ${r.C_Name}`,
              String(r.C_Salesman),
              formatMoney(r.current),
              formatMoney(r.over7),
              formatMoney(r.over14),
              formatMoney(r.over30),
              formatMoney(r.over60),
              formatMoney(r.netAmount),
            ]);
          });
          const totCurrent = grp.rows.reduce((s, r) => s + r.current, 0);
          const tot7 = grp.rows.reduce((s, r) => s + r.over7, 0);
          const tot14 = grp.rows.reduce((s, r) => s + r.over14, 0);
          const tot30 = grp.rows.reduce((s, r) => s + r.over30, 0);
          const tot60 = grp.rows.reduce((s, r) => s + r.over60, 0);
          const totNet = grp.rows.reduce((s, r) => s + r.netAmount, 0);
          rows.push([
            `Total Customers: ${grp.rows.length}`,
            '',
            formatMoney(totCurrent),
            formatMoney(tot7),
            formatMoney(tot14),
            formatMoney(tot30),
            formatMoney(tot60),
            formatMoney(totNet),
          ]);
        });
      } else {
        reportData.forEach((r) => {
          rows.push([
            `${r.C_Number} - ${r.C_Name}`,
            String(r.C_Salesman),
            formatMoney(r.current),
            formatMoney(r.over7),
            formatMoney(r.over14),
            formatMoney(r.over30),
            formatMoney(r.over60),
            formatMoney(r.netAmount),
          ]);
        });
      }

      const csvContent = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const filename = `ar-aging-report-${dayjs().format('YYYY-MM-DD')}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('CSV report generated successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate CSV');
    } finally {
      setGeneratingReport(false);
    }
  };

  const loadLogoAsDataUrl = (): Promise<string | null> => {
    return new Promise((resolve) => {
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
  };

  const handleGeneratePDF = async () => {
    if (reportData.length === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      let yPos = 12;

      const title = reportType === 'groupBySalesRep'
        ? 'A/R Company Aging Report (Sales Rep Group)'
        : 'A/R Company Aging Report (Over 7)';
      const dateStr = startDate && endDate ? `${startDate.format('MM-DD-YYYY')} - ${endDate.format('MM-DD-YYYY')}` : dayjs().format('MM-DD-YYYY');

      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State,
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';

      const drawHeader = (startY: number) => {
        let leftY = startY;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
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

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, pageWidth / 2, startY + 4, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(dateStr, pageWidth - margin, startY + 4, { align: 'right' });
      };

      drawHeader(yPos);
      yPos += 14;

      const headers = ['Customer Name', 'Rep', 'Current', 'Over 7', 'Over 14', 'Over 30', 'Over 60', 'Total Due'];
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      const grandTotCurrent = reportData.reduce((s, r) => s + r.current, 0);
      const grandTot7 = reportData.reduce((s, r) => s + r.over7, 0);
      const grandTot14 = reportData.reduce((s, r) => s + r.over14, 0);
      const grandTot30 = reportData.reduce((s, r) => s + r.over30, 0);
      const grandTot60 = reportData.reduce((s, r) => s + r.over60, 0);
      const grandTotNet = reportData.reduce((s, r) => s + r.netAmount, 0);
      const grandTotalRow = [
        'Grand Total',
        '',
        formatMoney(grandTotCurrent),
        formatMoney(grandTot7),
        formatMoney(grandTot14),
        formatMoney(grandTot30),
        formatMoney(grandTot60),
        formatMoney(grandTotNet),
      ];
      const grandTotalHeadersOnly = ['Current', 'Over 7', 'Over 14', 'Over 30', 'Over 60', 'Total Due'];
      const grandTotalRowOnly = [
        formatMoney(grandTotCurrent),
        formatMoney(grandTot7),
        formatMoney(grandTot14),
        formatMoney(grandTot30),
        formatMoney(grandTot60),
        formatMoney(grandTotNet),
      ];

      if (reportType === 'groupBySalesRep') {
        const minSpaceForGroup = 20;
        groupedBySalesRep.forEach((grp, gIdx) => {
          const lastFinalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos;
          if (gIdx > 0) {
            const spaceNeeded = 10;
            if (lastFinalY + spaceNeeded > pageHeight - minSpaceForGroup) {
              (doc as unknown as { addPage: (o?: string, f?: string) => void }).addPage('portrait', 'a4');
              yPos = 12;
              drawHeader(yPos);
              yPos += 14;
            } else {
              yPos = lastFinalY + 6;
            }
          }

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(`Sales Rep ${grp.salesman} — ${grp.repName}`, margin, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 5;

          const body = grp.rows.map((r) => [
            `${r.C_Number} - ${r.C_Name}`,
            String(r.C_Salesman),
            formatMoney(r.current),
            formatMoney(r.over7),
            formatMoney(r.over14),
            formatMoney(r.over30),
            formatMoney(r.over60),
            formatMoney(r.netAmount),
          ]);
          const totCurrent = grp.rows.reduce((s, r) => s + r.current, 0);
          const tot7 = grp.rows.reduce((s, r) => s + r.over7, 0);
          const tot14 = grp.rows.reduce((s, r) => s + r.over14, 0);
          const tot30 = grp.rows.reduce((s, r) => s + r.over30, 0);
          const tot60 = grp.rows.reduce((s, r) => s + r.over60, 0);
          const totNet = grp.rows.reduce((s, r) => s + r.netAmount, 0);
          body.push([
            `Total Customers: ${grp.rows.length}`,
            '',
            formatMoney(totCurrent),
            formatMoney(tot7),
            formatMoney(tot14),
            formatMoney(tot30),
            formatMoney(tot60),
            formatMoney(totNet),
          ]);

          autoTableFn(doc, {
            head: [headers],
            body,
            startY: yPos,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7 },
            headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
          });
          yPos = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos;
        });

        const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos;
        let grandTotalStartY = finalY + 6;
        if (grandTotalStartY > pageHeight - 25) {
          (doc as unknown as { addPage: (o?: string, f?: string) => void }).addPage('portrait', 'a4');
          yPos = 12;
          drawHeader(yPos);
          grandTotalStartY = yPos + 14;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Grand Total', margin, grandTotalStartY - 2);
          grandTotalStartY += 3;
          autoTableFn(doc, {
            head: [grandTotalHeadersOnly],
            body: [grandTotalRowOnly],
            startY: grandTotalStartY,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, fontStyle: 'bold' },
            headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
          });
        } else {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Grand Total', margin, grandTotalStartY - 2);
          grandTotalStartY += 3;
          autoTableFn(doc, {
            head: [grandTotalHeadersOnly],
            body: [grandTotalRowOnly],
            startY: grandTotalStartY,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7, fontStyle: 'bold' },
            headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
          });
        }
      } else {
        const body = reportData.map((r) => [
          `${r.C_Number} - ${r.C_Name}`,
          String(r.C_Salesman),
          formatMoney(r.current),
          formatMoney(r.over7),
          formatMoney(r.over14),
          formatMoney(r.over30),
          formatMoney(r.over60),
          formatMoney(r.netAmount),
        ]);
        body.push(grandTotalRow);
        const bodyRowCount = body.length;
        autoTableFn(doc, {
          head: [headers],
          body,
          startY: yPos,
          margin: { left: margin, right: margin },
          styles: { fontSize: 7 },
          headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
          didParseCell: (data: { section: string; row: { index: number }; cell: { styles: { fontStyle?: string } } }) => {
            if (data.section === 'body' && data.row.index === bodyRowCount - 1) {
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });
      }

      const totalPages = (doc as unknown as { internal: { pages: unknown[] } }).internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 6;
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('Report Generated by Woopsa', margin, footerY);
        if (logoDataUrl) {
          try {
            const tw = doc.getTextWidth('Report Generated by Woopsa');
            doc.addImage(logoDataUrl, 'PNG', margin + tw + 1, footerY - 2.5, 3, 3);
          } catch {
            /* no-op */
          }
        }
        doc.text(`Page ${i}`, pageWidth - margin, footerY, { align: 'right' });
      }

      doc.save(`ar-aging-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Box sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, p: 2, pb: 0.5 }}>
        {!showPreview && (
          <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
            A/R Aging Report Configuration
          </Typography>
        )}

        {!showPreview ? (
          <Paper
            sx={{
              p: 0.75,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Report Type
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ minHeight: 32, '& .MuiSelect-select': { py: 0.75, fontSize: '0.75rem' } }}>
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType((e.target.value as ReportType) ?? 'normal')}
                      sx={{ minHeight: 32 }}
                    >
                      {REPORT_TYPE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Start Date
                  </Typography>
                  <CustomDatePicker value={startDate} onChange={(d) => setStartDate(d)} />
                </Box>
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="caption" sx={{ mb: 0.4, fontWeight: 500, fontSize: '0.68rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    End Date
                  </Typography>
                  <CustomDatePicker value={endDate} onChange={(d) => setEndDate(d)} minDate={startDate ?? undefined} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sales Reps
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ minHeight: 32, '& .MuiSelect-select': { py: 0.75, fontSize: '0.75rem' } }}>
                      <Select
                        multiple
                        value={selectedSalesReps.map((s) => s.value)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedSalesReps(salesReps.filter((s) => values.includes(s.value)));
                        }}
                        displayEmpty
                        disabled={loadingFilters}
                        renderValue={(selected) => {
                          if (selected.length === 0) return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Sales Reps</Typography>;
                          return <Typography sx={{ fontSize: '0.75rem' }}>{selected.length} selected</Typography>;
                        }}
                        sx={{ minHeight: 32 }}
                        MenuProps={{
                          PaperProps: {
                            sx: { maxHeight: 300, '& .MuiMenuItem-root': { fontSize: '0.75rem', py: 0.5 } },
                          },
                        }}
                      >
                        {salesReps.map((rep) => (
                          <MenuItem key={rep.S_Number} value={rep.value} sx={{ fontSize: '0.75rem', py: 0.5 }}>
                            <Checkbox size="small" checked={selectedSalesReps.some((s) => s.value === rep.value)} sx={{ py: 0, mr: 1, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }} />
                            {rep.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Typography variant="caption" sx={{ mb: 0.3, fontWeight: 500, fontSize: '0.65rem', display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Routes
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ minHeight: 32, '& .MuiSelect-select': { py: 0.75, fontSize: '0.75rem' } }}>
                      <Select
                        multiple
                        value={selectedRoutes.map((r) => r.value)}
                        onChange={(e) => {
                          const values = e.target.value as string[];
                          setSelectedRoutes(routes.filter((r) => values.includes(r.value)));
                        }}
                        displayEmpty
                        disabled={loadingFilters}
                        renderValue={(selected) => {
                          if (selected.length === 0) return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>All Routes</Typography>;
                          return <Typography sx={{ fontSize: '0.75rem' }}>{selected.length} selected</Typography>;
                        }}
                        sx={{ minHeight: 32 }}
                        MenuProps={{
                          PaperProps: {
                            sx: { maxHeight: 300, '& .MuiMenuItem-root': { fontSize: '0.75rem', py: 0.5 } },
                          },
                        }}
                      >
                        {routes.map((route) => (
                          <MenuItem key={route.Route_Number} value={route.value} sx={{ fontSize: '0.75rem', py: 0.5 }}>
                            <Checkbox size="small" checked={selectedRoutes.some((r) => r.value === route.value)} sx={{ py: 0, mr: 1, '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }} />
                            {route.label}
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
          <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', backgroundColor: theme.palette.background.paper }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              A/R Company Aging Report {reportType === 'groupBySalesRep' ? '(Sales Rep Group)' : '(Over 7)'}
            </Typography>
            {startDate && endDate && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Date Range: {startDate.format('MM/DD/YYYY')} - {endDate.format('MM/DD/YYYY')}
              </Typography>
            )}

            {previewLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : displayData.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No data available</Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto', position: 'relative' }}>
                <Table stickyHeader size="small" sx={{ '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 100 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 100 }}>Customer Name</TableCell>
                      <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Rep</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Current</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Over 7</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Over 14</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Over 30</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Over 60</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Total Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportType === 'groupBySalesRep' ? (
                      <>
                        {groupedBySalesRep.map((grp) => (
                          <React.Fragment key={grp.salesman}>
                            <TableRow>
                              <TableCell colSpan={8} sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', fontWeight: 500, fontSize: '0.75rem', py: 0.75, borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.secondary' }}>
                                Rep {grp.salesman} — {grp.repName}
                              </TableCell>
                            </TableRow>
                            {grp.rows.map((r) => (
                              <TableRow key={`${r.C_Number}-${r.C_Name}`} hover>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{r.C_Number} - {r.C_Name}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{r.C_Salesman}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.current)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over7)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over14)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over30)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over60)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.netAmount)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', fontWeight: 600 }}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>Total Customers: {grp.rows.length}</TableCell>
                              <TableCell />
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(grp.rows.reduce((s, r) => s + r.current, 0))}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(grp.rows.reduce((s, r) => s + r.over7, 0))}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(grp.rows.reduce((s, r) => s + r.over14, 0))}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(grp.rows.reduce((s, r) => s + r.over30, 0))}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(grp.rows.reduce((s, r) => s + r.over60, 0))}</TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(grp.rows.reduce((s, r) => s + r.netAmount, 0))}</TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </>
                    ) : (
                      displayData.map((r) => (
                        <TableRow key={`${r.C_Number}-${r.C_Name}`} hover>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.C_Number} - {r.C_Name}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{r.C_Salesman}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.current)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over7)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over14)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over30)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.over60)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{formatMoney(r.netAmount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </Box>

      <Box sx={{ p: 1.5, pt: 1, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        {!showPreview ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <CustomButton
              type="button"
              buttonType="primary"
              appearance="filled"
              onClick={handlePreview}
              disabled={previewLoading || !endDate || !startDate}
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
            <CustomButton type="button" buttonType="cancel" appearance="outlined" onClick={() => { setShowPreview(false); }} fullWidth={false} sx={{ minWidth: 180, mt: 0 }}>
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

export default AgingReportTab;
