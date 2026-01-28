import React, { useEffect, useMemo, useState } from 'react';
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
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  Radio,
  FormControlLabel,
  Pagination,
} from '@mui/material';
import {
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
import { getInventorySpotCheck } from '../../../redux/apis/distrubutor/reportsApis';
import { getListOfLossQuantityReport } from '../../../redux/apis/distrubutor/listApis';
import CustomButton from '../../../component/atoms/CustomButton';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

interface InventorySpotCheckRow {
  Item_Number: number;
  Sales_Category: number;
  Section: string;
  Location: number;
  Price_Class: number;
  OTP_Number: number;
  Description: string;
  Pack: number;
  UOM: string;
  Price1: number;
  Sequence: number;
  Basecost: number;
  NetCost: number;
  AvgCost: number;
  Invoice_Cost: number;
  Retail1: number;
  HeadingFlag: boolean;
  Primary_Vendor: number;
  PickArea: string;
  UPC_Number: string;
  classDesc: string;
  categoryDesc: string;
  otpDesc: string;
  Inventory_OnHand: number;
  iPend: number;
  Avail: number;
}

interface OptionItem {
  value: number | string;
  label: string;
}

interface FilterOptions {
  salesCategories?: OptionItem[];
  priceClasses?: OptionItem[];
  otpTypes?: OptionItem[];
  vendors?: OptionItem[];
  locations?: OptionItem[];
  sections?: OptionItem[];
  items?: OptionItem[];
  pickAreas?: OptionItem[];
}

type LayoutType = 'portrait' | 'landscape';
type SortBy = 'description' | 'item' | 'salesCategory' | 'priceClass' | 'section' | 'location' | 'sequence';

// Sort by description: space -> symbol -> number -> alphabetical
const getDescriptionSortKey = (desc: string): string => {
  const str = (desc ?? '').toString();
  if (!str) return 'zzzzzzzzzz';
  const first = str.trim().charAt(0);
  if (first === ' ') return `0_${str}`;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(first)) return `1_${str}`;
  if (/[0-9]/.test(first)) return `2_${str}`;
  if (/[a-zA-Z]/.test(first)) return `3_${str.toLowerCase()}`;
  return `4_${str}`;
};

const InventorySpotCheckTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  const [rows, setRows] = useState<InventorySpotCheckRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<InventorySpotCheckRow[]>([]);

  // Filters
  const [selectedSalesCategories, setSelectedSalesCategories] = useState<number[]>([]);
  const [selectedPriceClasses, setSelectedPriceClasses] = useState<number[]>([]);
  const [selectedOtpTypes, setSelectedOtpTypes] = useState<number[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<(number | string)[]>([]);
  const [selectedPickAreas, setSelectedPickAreas] = useState<string[]>([]);

  // Layout & preview
  const [layout, setLayout] = useState<LayoutType>('portrait');
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 500;
  const [sortBy, setSortBy] = useState<SortBy>('description');

  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load logo as data URL for PDF footer
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

  // Helper: map list API into options
  const mapArrayItems = (arr: any[], valueKey: string, labelKey: string): OptionItem[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item: any) => ({
      value: item[valueKey] ?? item.value ?? item.id ?? item,
      label:
        item[labelKey] ??
        item.label ??
        item.name ??
        String(item[valueKey] ?? item.value ?? item.id ?? item),
    }));
  };

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const response = await getListOfLossQuantityReport() as any;
      const data = response?.data?.data || response?.data || response || {};

      const options: FilterOptions = {};

      if (data.salesCategory) {
        options.salesCategories = mapArrayItems(data.salesCategory, 'Sales_Category', 'Category_Desc');
      }
      if (data.priceClass) {
        options.priceClasses = mapArrayItems(data.priceClass, 'Price_Class', 'Class_Desc');
      }
      if (data.OTP_Type) {
        options.otpTypes = mapArrayItems(data.OTP_Type, 'OTP_Number', 'OTP_Description');
      }
      if (data.manufacturerVendor) {
        options.vendors = mapArrayItems(data.manufacturerVendor, 'Primary_Vendor', 'V_Description');
      }
      if (data.section) {
        options.sections = mapArrayItems(data.section, 'section', 'section');
      }
      if (data.location) {
        options.locations = mapArrayItems(data.location, 'location', 'location');
      }
      if (data.items) {
        // Try to use Item_Number if present, otherwise fallback to Description
        options.items = data.items.map((item: any) => ({
          value: item.Item_Number ?? item.Description ?? '',
          label: item.Description ?? String(item.Item_Number ?? ''),
        }));
      }
      if (data.pickRightAreas) {
        options.pickAreas = mapArrayItems(data.pickRightAreas, 'PickArea', 'PickArea_Description');
      }

      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options for inventory spot check:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    setCurrentPage(1);
    try {
      // For now, do not send filters to backend – filter on frontend using same list API
      const response = await getInventorySpotCheck() as any;
      const data = response?.data?.data || response?.data || [];

      if (!Array.isArray(data) || data.length === 0) {
        setRows([]);
        setFilteredRows([]);
        toast.success('No inventory spot check records found');
        return;
      }

      // Store all rows
      setRows(data);

      // Compute filtered count based on current filters for a more accurate toast
      let filtered = [...data];
      if (selectedSalesCategories.length) {
        filtered = filtered.filter(row => selectedSalesCategories.includes(row.Sales_Category));
      }
      if (selectedPriceClasses.length) {
        filtered = filtered.filter(row => selectedPriceClasses.includes(row.Price_Class));
      }
      if (selectedOtpTypes.length) {
        filtered = filtered.filter(row => selectedOtpTypes.includes(row.OTP_Number));
      }
      if (selectedVendors.length) {
        filtered = filtered.filter(row => selectedVendors.includes(row.Primary_Vendor));
      }
      if (selectedSections.length) {
        filtered = filtered.filter(row => selectedSections.includes(row.Section));
      }
      if (selectedLocations.length) {
        filtered = filtered.filter(row => selectedLocations.includes(row.Location));
      }
      if (selectedItems.length) {
        filtered = filtered.filter(row => {
          const key = row.Item_Number ?? row.Description;
          return selectedItems.includes(key);
        });
      }
      if (selectedPickAreas.length) {
        filtered = filtered.filter(row => selectedPickAreas.includes(row.PickArea));
      }

      toast.success(`Loaded ${filtered.length} inventory spot check record(s) for current filters`);
    } catch (error: any) {
      console.error('Error fetching inventory spot check data:', error);
      toast.error(error?.response?.data?.message || 'Failed to load inventory spot check data');
      setRows([]);
      setFilteredRows([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Apply filters whenever rows or filter values change
  useEffect(() => {
    if (!rows.length) {
      setFilteredRows([]);
      return;
    }

    let data = [...rows];

    if (selectedSalesCategories.length) {
      data = data.filter(row => selectedSalesCategories.includes(row.Sales_Category));
    }
    if (selectedPriceClasses.length) {
      data = data.filter(row => selectedPriceClasses.includes(row.Price_Class));
    }
    if (selectedOtpTypes.length) {
      data = data.filter(row => selectedOtpTypes.includes(row.OTP_Number));
    }
    if (selectedVendors.length) {
      data = data.filter(row => selectedVendors.includes(row.Primary_Vendor));
    }
    if (selectedSections.length) {
      data = data.filter(row => selectedSections.includes(row.Section));
    }
    if (selectedLocations.length) {
      data = data.filter(row => selectedLocations.includes(row.Location));
    }
    if (selectedItems.length) {
      data = data.filter(row => {
        const key = row.Item_Number ?? row.Description;
        return selectedItems.includes(key);
      });
    }
    if (selectedPickAreas.length) {
      data = data.filter(row => selectedPickAreas.includes(row.PickArea));
    }

    // Sort (default: alphabetical by Description with custom order)
    const compareByDescription = (a: InventorySpotCheckRow, b: InventorySpotCheckRow) =>
      getDescriptionSortKey(a.Description ?? '').localeCompare(
        getDescriptionSortKey(b.Description ?? ''),
        undefined,
        { numeric: true, sensitivity: 'base' }
      );

    data.sort((a, b) => {
      if (sortBy === 'item') {
        const diff = (a.Item_Number || 0) - (b.Item_Number || 0);
        return diff !== 0 ? diff : compareByDescription(a, b);
      }
      if (sortBy === 'salesCategory') {
        const diff = (a.Sales_Category || 0) - (b.Sales_Category || 0);
        return diff !== 0 ? diff : compareByDescription(a, b);
      }
      if (sortBy === 'priceClass') {
        const diff = (a.Price_Class || 0) - (b.Price_Class || 0);
        return diff !== 0 ? diff : compareByDescription(a, b);
      }
      if (sortBy === 'section') {
        const sectionA = String(a.Section ?? '');
        const sectionB = String(b.Section ?? '');
        const cmp = sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
        return cmp !== 0 ? cmp : compareByDescription(a, b);
      }
      if (sortBy === 'location') {
        const diff = (a.Location ?? 0) - (b.Location ?? 0);
        return diff !== 0 ? diff : compareByDescription(a, b);
      }
      if (sortBy === 'sequence') {
        const diff = (a.Sequence ?? 0) - (b.Sequence ?? 0);
        return diff !== 0 ? diff : compareByDescription(a, b);
      }
      return compareByDescription(a, b);
    });

    setFilteredRows(data);
  }, [
    rows,
    selectedSalesCategories,
    selectedPriceClasses,
    selectedOtpTypes,
    selectedVendors,
    selectedSections,
    selectedLocations,
    selectedItems,
    selectedPickAreas,
    sortBy,
  ]);

  // Reset pagination when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const handleGeneratePDF = async () => {
    if (!filteredRows.length) {
      toast.error('No data to generate report');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const doc = new jsPDF(layout === 'landscape' ? 'landscape' : 'portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;

      const date = new Date();
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}-${date.getFullYear()}`;

      // Distributor / warehouse details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State,
      ]
        .filter(Boolean)
        .join(', ');
      const distributorPhone = distributor?.D_Phone || '';

      // Columns: Item, blank (fill-in), then rest. Same for both layouts.
      const commonColumns = [
        { key: 'Item_Number', label: 'Item' },
        { key: 'Description', label: 'Description' },
        { key: 'UPC_Number', label: 'UPC' },
        { key: 'Pack', label: 'Pack' },
        { key: 'UOM', label: 'UOM' },
      ];

      const qtyColumns = [
        { key: 'Inventory_OnHand', label: 'ON HAND' },
        { key: 'iPend', label: 'PENDING' },
        { key: 'Avail', label: 'AVAILABLE' },
      ];

      const landscapeExtra = [
        { key: 'Section', label: 'Section' },
        { key: 'Location', label: 'Location' },
      ];

      // Blank line column should be beside Available (after Available)
      const fillInColumn = { key: '_blank', label: '' };

      const columns =
        layout === 'landscape'
          ? [...commonColumns, ...landscapeExtra, ...qtyColumns, fillInColumn]
          : [...commonColumns, ...qtyColumns, fillInColumn];

      const headRow = columns.map(col => col.label);
      // Fill-in line: underscore string so PDF shows a blank line beside item number
      const FILL_IN_LINE = '________';
      const bodyRows = filteredRows.map(row =>
        columns.map(col => {
          if (col.key === '_blank') return FILL_IN_LINE;
          const value = (row as any)[col.key];
          if (typeof value === 'number') {
            return value.toString();
          }
          return value ?? '';
        })
      );

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      autoTableFn(doc, {
        head: [headRow],
        body: bodyRows,
        margin: { top: 28, left: margin, right: margin },
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
        },
        headStyles: {
          fontSize: 7,
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        columnStyles: {
          // Right align numeric quantity columns
          [columns.findIndex(c => c.key === 'Inventory_OnHand')]:
            { halign: 'right' },
          [columns.findIndex(c => c.key === 'iPend')]:
            { halign: 'right' },
          [columns.findIndex(c => c.key === 'Avail')]:
            { halign: 'right' },
        },
        didDrawPage: () => {
          const pageHeight = doc.internal.pageSize.getHeight();

          // Header (warehouse details)
          let y = 10;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          if (distributorName) {
            doc.text(distributorName, margin, y);
          }
          doc.setFontSize(10);
          doc.text('Inventory Spot Check', pageWidth / 2, y, { align: 'center' });
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(dateStr, pageWidth - margin, y, { align: 'right' });

          y += 4;
          if (distributorAddress) {
            doc.text(distributorAddress, margin, y);
          }
          y += 4;
          if (distributorPhone) {
            doc.text(distributorPhone, margin, y);
          }

          // Footer - "Report Generated by Woopsa" + rabbit logo (page number added after all pages exist)
          const footerY = pageHeight - 6;
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          const footerText = 'Report Generated by Woopsa';
          doc.text(footerText, margin, footerY);

          if (logoDataUrl) {
            try {
              const textWidth = doc.getTextWidth(footerText);
              doc.addImage(logoDataUrl, 'PNG', margin + textWidth + 1, footerY - 2.5, 3, 3);
            } catch (e) {
              console.warn('Failed to render footer logo:', e);
            }
          }
        },
      });

      // After all pages are created: add "Page X of Total" on every page
      const totalPagesCount = (doc.internal as { pages: unknown[] }).pages.length;
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 6;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      for (let i = 1; i <= totalPagesCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - margin, footerY, { align: 'right' });
      }

      const filename = `inventory-spot-check-${dateStr}.pdf`;
      doc.save(filename);
      toast.success(`PDF generated with ${filteredRows.length} records`);
    } catch (error) {
      console.error('Error generating Inventory Spot Check PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const renderMultiSelect = (
    label: string,
    options: OptionItem[] | undefined,
    selected: (number | string)[],
    setSelected: (values: (number | string)[]) => void,
    placeholder: string
  ) => {
    if (!options || options.length === 0) return null;

    return (
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Typography
          variant="caption"
          sx={{
            mb: 0.3,
            fontWeight: 500,
            fontSize: '0.65rem',
            display: 'block',
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selected.map(String)}
            onChange={e => {
              const values = e.target.value as string[];
              setSelected(
                values.map(v => {
                  const asNumber = Number(v);
                  return Number.isNaN(asNumber) ? v : asNumber;
                })
              );
            }}
            disabled={loadingFilters}
            displayEmpty
            renderValue={selectedValues => {
              if ((selectedValues as string[]).length === 0) {
                return (
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {placeholder}
                  </Typography>
                );
              }
              const vals = selectedValues as string[];
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {vals.slice(0, 2).map(value => {
                    const opt = options.find(o => String(o.value) === value);
                    return (
                      <Typography key={value} sx={{ fontSize: '0.7rem' }}>
                        {opt?.label || value}
                        {vals.length > 2 && value === vals[1] ? ` +${vals.length - 2}` : ''}
                      </Typography>
                    );
                  })}
                </Box>
              );
            }}
            sx={{
              fontSize: '0.75rem',
              '& .MuiOutlinedInput-root': {
                minHeight: '32px',
                height: '32px',
                '& input': {
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                },
              },
              '& .MuiSelect-select': {
                minHeight: 'auto',
                py: 0.5,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1px',
              },
              '& .MuiSelect-icon': {
                color: 'primary.main',
              },
            }}
          >
            {options.map(option => (
              <MenuItem
                key={option.value}
                value={String(option.value)}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selected.some(s => String(s) === String(option.value))}
                  size="small"
                  sx={{
                    py: 0,
                    '& .MuiSvgIcon-root': { fontSize: '1rem' },
                  }}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const columns = useMemo(
    () =>
      layout === 'landscape'
        ? [
            'Item',
            'Description',
            'UPC',
            'Pack',
            'UOM',
            'Section',
            'Location',
            'ON HAND',
            'PENDING',
            'AVAILABLE',
            '', // blank line beside Available
          ]
        : [
            'Item',
            'Description',
            'UPC',
            'Pack',
            'UOM',
            'ON HAND',
            'PENDING',
            'AVAILABLE',
            '', // blank line beside Available
          ],
    [layout]
  );

  const renderCellValue = (row: InventorySpotCheckRow, column: string): React.ReactNode => {
    switch (column) {
      case 'Item':
        return row.Item_Number;
      case '':
        // Blank line beside item number for fill-in (portrait & landscape)
        return (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              minWidth: 48,
              borderBottom: `1px solid ${theme.palette.divider}`,
              verticalAlign: 'bottom',
            }}
            aria-label="Fill in"
          />
        );
      case 'Description':
        return row.Description;
      case 'UPC':
        return row.UPC_Number;
      case 'Pack':
        return row.Pack;
      case 'UOM':
        return row.UOM;
      case 'Section':
        return row.Section;
      case 'Location':
        return row.Location;
      case 'ON HAND':
        return row.Inventory_OnHand;
      case 'PENDING':
        return row.iPend;
      case 'AVAILABLE':
        return row.Avail;
      default:
        return '';
    }
  };

  return (
    <Box
      sx={{
        height: { xs: 'auto', md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable Content Area */}
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
          <>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}
            >
              Inventory Spot Check Report Configuration
            </Typography>

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
              <Grid container spacing={3}>
                {/* Left column - layout selection */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ mb: 1.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 0.4,
                        fontWeight: 500,
                        fontSize: '0.68rem',
                        display: 'block',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Report Layout
                    </Typography>
                    <FormControl component="fieldset" size="small">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FormControlLabel
                          control={
                            <Radio
                              size="small"
                              checked={layout === 'portrait'}
                              onChange={() => setLayout('portrait')}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: '0.75rem' }}>
                              Portrait
                            </Typography>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Radio
                              size="small"
                              checked={layout === 'landscape'}
                              onChange={() => setLayout('landscape')}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: '0.75rem' }}>
                              Landscape
                            </Typography>
                          }
                        />
                      </Box>
                    </FormControl>
                  </Box>

                  <Box sx={{ mb: 1.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 0.4,
                        fontWeight: 500,
                        fontSize: '0.68rem',
                        display: 'block',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Sort By
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        sx={{
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { minHeight: 'auto', py: 0.5 },
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
                          '& .MuiSelect-icon': { color: 'primary.main' },
                        }}
                      >
                        <MenuItem value="description" sx={{ fontSize: '0.68rem' }}>
                          Alphabetical (Description)
                        </MenuItem>
                        <MenuItem value="item" sx={{ fontSize: '0.68rem' }}>
                          Item Number
                        </MenuItem>
                        <MenuItem value="salesCategory" sx={{ fontSize: '0.68rem' }}>
                          Sales Category
                        </MenuItem>
                        <MenuItem value="priceClass" sx={{ fontSize: '0.68rem' }}>
                          Price Class
                        </MenuItem>
                        <MenuItem value="section" sx={{ fontSize: '0.68rem' }}>
                          Section + Description
                        </MenuItem>
                        <MenuItem value="location" sx={{ fontSize: '0.68rem' }}>
                          Location + Description
                        </MenuItem>
                        <MenuItem value="sequence" sx={{ fontSize: '0.68rem' }}>
                          Sort number (Sequence)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {(loadingFilters || loadingData) && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress />
                      <Typography
                        variant="caption"
                        sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem', color: 'text.secondary' }}
                      >
                        {loadingFilters ? 'Loading filter options...' : 'Loading report data...'}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Right column - filters */}
                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={1.5}>
                    {renderMultiSelect(
                      'Sales Category',
                      filterOptions.salesCategories,
                      selectedSalesCategories,
                      values => setSelectedSalesCategories(values as number[]),
                      'All Sales Categories'
                    )}
                    {renderMultiSelect(
                      'Price Class',
                      filterOptions.priceClasses,
                      selectedPriceClasses,
                      values => setSelectedPriceClasses(values as number[]),
                      'All Price Classes'
                    )}
                    {renderMultiSelect(
                      'OTP Type',
                      filterOptions.otpTypes,
                      selectedOtpTypes,
                      values => setSelectedOtpTypes(values as number[]),
                      'All OTP Types'
                    )}
                    {renderMultiSelect(
                      'Vendor',
                      filterOptions.vendors,
                      selectedVendors,
                      values => setSelectedVendors(values as number[]),
                      'Vendors'
                    )}
                    {renderMultiSelect(
                      'Section',
                      filterOptions.sections,
                      selectedSections,
                      values => setSelectedSections(values as string[]),
                      'All Sections'
                    )}
                    {renderMultiSelect(
                      'Location',
                      filterOptions.locations,
                      selectedLocations,
                      values => setSelectedLocations(values as number[]),
                      'All Locations'
                    )}
                    {renderMultiSelect(
                      'Item Select',
                      filterOptions.items,
                      selectedItems,
                      values => setSelectedItems(values),
                      'All Items'
                    )}
                    {renderMultiSelect(
                      'Pick Area',
                      filterOptions.pickAreas,
                      selectedPickAreas,
                      values => setSelectedPickAreas(values as string[]),
                      'All Pick Areas'
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}

        {/* Preview table */}
        {showPreview && (
          <Paper
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>
              Inventory Spot Check Preview
            </Typography>

            {loadingData ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <LinearProgress sx={{ width: '60%' }} />
              </Box>
            ) : filteredRows.length === 0 ? (
              <Typography sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                No data available for selected filters
              </Typography>
            ) : (
              <>
                <TableContainer
                  sx={{
                    maxHeight: 'calc(100vh - 340px)',
                    overflow: 'auto',
                    position: 'relative',
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {columns.map(col => (
                          <TableCell
                            key={col}
                            sx={{
                              backgroundColor:
                                theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((row, idx) => (
                        <TableRow
                          key={`${row.Item_Number}-${row.UPC_Number}-${idx}`}
                          hover
                        >
                          {columns.map(col => (
                            <TableCell
                              key={col}
                              sx={{
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {renderCellValue(row, col)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}

                <Typography
                  variant="body2"
                  sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}
                >
                  Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of{' '}
                  {filteredRows.length} records
                </Typography>
              </>
            )}
          </Paper>
        )}
      </Box>

      {/* Sticky bottom actions */}
      <Box
        sx={{
          p: 1.5,
          pt: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        {!showPreview ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <CustomButton
              type="button"
              buttonType="primary"
              appearance="filled"
              onClick={async () => {
                await fetchData();
                setShowPreview(true);
              }}
              disabled={loadingData || loadingFilters}
              loading={loadingData}
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
                setCurrentPage(1);
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
                onClick={() => {
                  // CSV generation placeholder – identical columns as PDF
                  if (!filteredRows.length) {
                    toast.error('No data to generate CSV');
                    return;
                  }
                  const header = columns.join(',');
                  const rowsCsv = filteredRows.map(row =>
                    columns.map(col => {
                      // Blank column: export empty (renderCellValue returns React node)
                      if (col === '') {
                        return '""';
                      }
                      const v = renderCellValue(row, col);
                      const text = v == null || typeof v !== 'string' && typeof v !== 'number' ? '' : String(v);
                      return `"${text.replace(/"/g, '""')}"`;
                    }).join(',')
                  );
                  const csv = [header, ...rowsCsv].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  const date = new Date();
                  const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
                    date.getDate()
                  ).padStart(2, '0')}-${date.getFullYear()}`;
                  link.href = url;
                  link.download = `inventory-spot-check-${dateStr}.csv`;
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`CSV generated with ${filteredRows.length} records`);
                }}
                disabled={!filteredRows.length}
                icon={<PreviewIcon />}
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
                disabled={generatingPDF || filteredRows.length === 0}
                loading={generatingPDF}
                icon={<PdfIcon />}
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

export default InventorySpotCheckTab;

