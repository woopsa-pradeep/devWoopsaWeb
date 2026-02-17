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
} from '@mui/material';
import {
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
import {
  getPoReceivingHistoryReport,
  getPoTransferAdjustmentReport,
  getPoCigOtpReport,
} from '../../../redux/apis/distrubutor/reportsApis';
import { getListOfLossQuantityReport } from '../../../redux/apis/distrubutor/listApis';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

type ReportType =
  | 'receiving-item'
  | 'receiving-po'
  | 'receiving-vendor'
  | 'receiving-cigotp'
  | 'adjustment-item'
  | 'adjustment-adj';

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

// Raw row from Receiving API (and normalized CIG/OTP PO_Details)
interface ReceivingRow {
  PO_Number: number;
  Line_Number?: number;
  Item_Number: number;
  Sales_Category?: number;
  OTP_Number?: number;
  Quantity_Recd?: number;
  qtyRecd?: number;
  Cost?: number;
  BaseCost?: number;
  NetCost?: number;
  Invoice_Cost?: number;
  AvgCost?: number;
  Total_Cig_Sticks?: number;
  Total_Pack?: number;
  qtyOz?: number;
  Ext_AvgCost?: number;
  Ext_BaseCost?: number;
  Ext_NetCost?: number;
  Ext_InvoiceCost?: number;
  Ext_POCost?: number;
  POHeader?: {
    PO_Number?: number;
    Invoice_Number?: string;
    Invoice_Date?: string;
    Date_Received?: string;
    Primary_Vendor?: number;
    Vendor?: {
      V_Description?: string;
      Primary_Vendor?: number;
      Phone?: string;
      Address?: string;
      V_Addr1?: string;
      V_City?: string;
      V_State?: string;
      V_Zip?: string;
      V_Phone?: string;
    };
    Delivery?: number;
    Charge1?: number;
    Charge2?: number;
    Discounts?: number;
  };
  Inventory?: {
    Description?: string;
    Price_Class?: number;
    section?: string;
    location?: number;
    PickArea?: string;
    Brand?: string;
    Manuf?: string;
    otpName?: string;
    UnitOunces?: number;
    Cig_Pack?: number;
    Cig_Sticks?: number;
  };
}

// CIG/OTP API response: array of POs, each with PO_Details[]
interface PoCigOtpPoDetail {
  PO_Number: number;
  Line_Number?: number;
  Item_Number: number;
  Sales_Category?: number;
  OTP_Number?: number;
  Quantity_Recd?: number;
  qtyRecd?: number;
  Cost?: number;
  BaseCost?: number;
  NetCost?: number;
  Invoice_Cost?: number;
  AvgCost?: number;
  Total_Cig_Sticks?: number;
  Total_Pack?: number;
  qtyOz?: number;
  Ext_AvgCost?: number;
  Ext_BaseCost?: number;
  Ext_NetCost?: number;
  Ext_POCost?: number;
  Ext_InvoiceCost?: number;
  Inventory?: {
    Description?: string;
    Brand?: string;
    Manuf?: string;
    otpName?: string;
    UnitOunces?: number;
    Cig_Pack?: number;
    Cig_Sticks?: number;
  };
}

interface PoCigOtpResponseItem {
  PO_Number: number;
  PO_Date?: string;
  Date_Received?: string;
  Invoice_Number?: string;
  Invoice_Date?: string;
  Primary_Vendor?: number;
  Vendor?: { Primary_Vendor?: number; V_Description?: string };
  PO_Details?: PoCigOtpPoDetail[];
}

/** Flatten CIG/OTP API response (array of POs with PO_Details) into ReceivingRow[] */
function flattenCigOtpResponse(poList: PoCigOtpResponseItem[]): ReceivingRow[] {
  const rows: ReceivingRow[] = [];
  if (!Array.isArray(poList)) return rows;
  for (const po of poList) {
    const details = po.PO_Details ?? [];
    const primaryVendor = po.Primary_Vendor ?? po.Vendor?.Primary_Vendor;
    for (const d of details) {
      rows.push({
        PO_Number: po.PO_Number,
        Line_Number: d.Line_Number,
        Item_Number: d.Item_Number,
        Sales_Category: d.Sales_Category,
        OTP_Number: d.OTP_Number,
        Quantity_Recd: d.Quantity_Recd,
        qtyRecd: d.qtyRecd ?? d.Quantity_Recd,
        Cost: d.Cost,
        BaseCost: d.BaseCost,
        NetCost: d.NetCost,
        Invoice_Cost: d.Invoice_Cost,
        AvgCost: d.AvgCost,
        Total_Cig_Sticks: d.Total_Cig_Sticks,
        Total_Pack: d.Total_Pack,
        qtyOz: d.qtyOz,
        Ext_AvgCost: d.Ext_AvgCost,
        Ext_BaseCost: d.Ext_BaseCost,
        Ext_NetCost: d.Ext_NetCost,
        Ext_InvoiceCost: d.Ext_InvoiceCost,
        Ext_POCost: d.Ext_POCost,
        POHeader: {
          PO_Number: po.PO_Number,
          Date_Received: po.Date_Received,
          Invoice_Number: po.Invoice_Number,
          Invoice_Date: po.Invoice_Date,
          Primary_Vendor: primaryVendor,
          Vendor: po.Vendor,
        },
        Inventory: d.Inventory
          ? {
              Description: d.Inventory.Description,
              Brand: d.Inventory.Brand,
              Manuf: d.Inventory.Manuf,
              otpName: d.Inventory.otpName,
              UnitOunces: d.Inventory.UnitOunces,
              Cig_Pack: d.Inventory.Cig_Pack,
              Cig_Sticks: d.Inventory.Cig_Sticks,
            }
          : undefined,
      });
    }
  }
  return rows;
}

// Raw row from Adjustment API
interface AdjustmentRow {
  PO_Number: number;
  Line_Number?: number;
  Item_Number: number;
  Sales_Category?: number;
  OTP_Number?: number;
  Quantity_Recd?: number;
  Quantity_Ordered?: number;
  Cost?: number;
  Ext_Cost?: number;
  InventoryGroupID?: number;
  POHeader?: {
    PO_Number?: number;
    Date_Received?: string;
    PO_Date?: string;
    Vendor?: { V_Description?: string };
  };
  Inventory?: {
    Item_Number?: number;
    Description?: string;
    Price_Class?: number;
    section?: string;
    location?: number;
    PickArea?: string;
  };
}

const REPORT_TYPES: { value: ReportType; label: string; section: string }[] = [
  { value: 'receiving-item', label: 'Receiving History - Item Group', section: 'receiving' },
  { value: 'receiving-po', label: 'Receiving History - PO Group', section: 'receiving' },
  { value: 'receiving-vendor', label: 'Receiving History - Vendor Group', section: 'receiving' },
  { value: 'receiving-cigotp', label: 'Receiving History - CIG/OTP', section: 'receiving' },
  { value: 'adjustment-item', label: 'Adjustment History - Item Group', section: 'adjustment' },
  { value: 'adjustment-adj', label: 'Adjustment History - ADJ Group', section: 'adjustment' },
];

/** poCigOtpReport - exact 5 group-by options */
const CIG_OTP_GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: 'Packs/sticks', label: 'grp by: Packs/sticks' },
  { value: 'OTP cost', label: 'grp by: OTP cost' },
  { value: 'PO cost', label: 'grp by: PO cost' },
  { value: 'PO Ounces', label: 'grp by: PO Ounces' },
  { value: 'Brand Ounces', label: 'grp by: Brand Ounces' },
];

/** Cost type for OTP cost / PO cost reports */
export type CostTypeKey = 'AvgCost' | 'BaseCost' | 'NetCost' | 'Invoice_Cost';
const COST_TYPE_OPTIONS: { value: CostTypeKey; costLabel: string; extLabel: string }[] = [
  { value: 'AvgCost', costLabel: 'Avg Cost', extLabel: 'Ext Avg Cost' },
  { value: 'BaseCost', costLabel: 'Base Cost', extLabel: 'Ext Base Cost' },
  { value: 'NetCost', costLabel: 'Net Cost', extLabel: 'Ext Net Cost' },
  { value: 'Invoice_Cost', costLabel: 'Invoice Cost', extLabel: 'Ext Invoice Cost' },
];

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

const ReceivingHistoryAdjustmentTab: React.FC = () => {
  const theme = useTheme();
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);

  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [reportType, setReportType] = useState<ReportType>('receiving-item');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  const [receivingRows, setReceivingRows] = useState<ReceivingRow[]>([]);
  const [adjustmentRows, setAdjustmentRows] = useState<AdjustmentRow[]>([]);

  const [selectedSalesCategories, setSelectedSalesCategories] = useState<number[]>([]);
  const [selectedPriceClasses, setSelectedPriceClasses] = useState<number[]>([]);
  const [selectedOtpTypes, setSelectedOtpTypes] = useState<number[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<(number | string)[]>([]);
  const [selectedPickAreas, setSelectedPickAreas] = useState<string[]>([]);

  const [showPreview, setShowPreview] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [cigOtpReportGroupBy, setCigOtpReportGroupBy] = useState<string>(CIG_OTP_GROUP_OPTIONS[0].value);
  const [costTypeForOtpPoReport, setCostTypeForOtpPoReport] = useState<CostTypeKey>('AvgCost');

  const isReceiving = reportType.startsWith('receiving');

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

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const response = (await getListOfLossQuantityReport()) as any;
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
        options.items = (data.items as any[]).map((item: any) => ({
          value: item.Item_Number ?? item.Description ?? '',
          label: item.Description ?? String(item.Item_Number ?? ''),
        }));
      }
      if (data.pickRightAreas) {
        options.pickAreas = mapArrayItems(data.pickRightAreas, 'PickArea', 'PickArea_Description');
      }
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const applyFilters = useMemo(() => {
    const filterReceiving = (rows: ReceivingRow[]): ReceivingRow[] => {
      let data = [...rows];
      if (selectedSalesCategories.length) {
        data = data.filter((r) => r.Sales_Category != null && selectedSalesCategories.includes(r.Sales_Category));
      }
      if (selectedPriceClasses.length && data.length) {
        data = data.filter(
          (r) =>
            r.Inventory?.Price_Class != null && selectedPriceClasses.includes(r.Inventory.Price_Class)
        );
      }
      if (selectedOtpTypes.length) {
        data = data.filter((r) => r.OTP_Number != null && selectedOtpTypes.includes(r.OTP_Number));
      }
      if (selectedVendors.length) {
        data = data.filter(
          (r) =>
            r.POHeader?.Primary_Vendor != null && selectedVendors.includes(r.POHeader.Primary_Vendor)
        );
      }
      if (selectedSections.length) {
        data = data.filter(
          (r) => r.Inventory?.section != null && selectedSections.includes(r.Inventory.section)
        );
      }
      if (selectedLocations.length) {
        data = data.filter(
          (r) =>
            r.Inventory?.location != null && selectedLocations.includes(r.Inventory.location)
        );
      }
      if (selectedItems.length) {
        data = data.filter((r) => selectedItems.includes(r.Item_Number));
      }
      if (selectedPickAreas.length) {
        data = data.filter(
          (r) => r.Inventory?.PickArea != null && selectedPickAreas.includes(r.Inventory.PickArea)
        );
      }
      return data;
    };
    const filterAdjustment = (rows: AdjustmentRow[]): AdjustmentRow[] => {
      let data = [...rows];
      if (selectedSalesCategories.length) {
        data = data.filter((r) => r.Sales_Category != null && selectedSalesCategories.includes(r.Sales_Category));
      }
      if (selectedPriceClasses.length) {
        data = data.filter(
          (r) =>
            r.Inventory?.Price_Class != null && selectedPriceClasses.includes(r.Inventory.Price_Class)
        );
      }
      if (selectedOtpTypes.length) {
        data = data.filter((r) => r.OTP_Number != null && selectedOtpTypes.includes(r.OTP_Number));
      }
      if (selectedVendors.length) {
        data = data.filter((r) => {
          const pv = (r as any).POHeader?.Primary_Vendor;
          if (pv == null) return true;
          return selectedVendors.includes(pv);
        });
      }
      if (selectedSections.length) {
        data = data.filter(
          (r) => r.Inventory?.section != null && selectedSections.includes(r.Inventory.section)
        );
      }
      if (selectedLocations.length) {
        data = data.filter(
          (r) =>
            r.Inventory?.location != null && selectedLocations.includes(r.Inventory.location)
        );
      }
      if (selectedItems.length) {
        data = data.filter((r) => selectedItems.includes(r.Item_Number));
      }
      if (selectedPickAreas.length) {
        data = data.filter(
          (r) => r.Inventory?.PickArea != null && selectedPickAreas.includes(r.Inventory.PickArea)
        );
      }
      return data;
    };
    return { filterReceiving, filterAdjustment };
  }, [
    selectedSalesCategories,
    selectedPriceClasses,
    selectedOtpTypes,
    selectedVendors,
    selectedSections,
    selectedLocations,
    selectedItems,
    selectedPickAreas,
  ]);

  const filteredReceivingRows = useMemo(() => {
    return applyFilters.filterReceiving(receivingRows);
  }, [receivingRows, applyFilters]);

  const filteredAdjustmentRows = useMemo(() => {
    return applyFilters.filterAdjustment(adjustmentRows);
  }, [adjustmentRows, applyFilters]);

  const getReceivingGroupKey = (row: ReceivingRow): string | number => {
    switch (reportType) {
      case 'receiving-item':
        return row.Item_Number;
      case 'receiving-po':
        return row.PO_Number;
      case 'receiving-vendor':
        return row.POHeader?.Primary_Vendor ?? '';
      case 'receiving-cigotp':
        // Frontend grouping by selected CIG/OTP report type (no groupBy in API)
        switch (cigOtpReportGroupBy) {
          case 'Packs/sticks':
            return row.PO_Number;
          case 'OTP cost':
            return row.OTP_Number ?? '';
          case 'PO cost':
            return row.PO_Number;
          case 'PO Ounces':
            return row.PO_Number;
          case 'Brand Ounces':
            return row.Inventory?.Brand ?? 'N/A';
          default:
            return row.OTP_Number ?? row.Item_Number;
        }
      default:
        return row.Item_Number;
    }
  };

  const getAdjustmentGroupKey = (row: AdjustmentRow): string | number => {
    switch (reportType) {
      case 'adjustment-item':
        return row.Item_Number;
      case 'adjustment-adj':
        return row.PO_Number; // ADJ Number
      default:
        return row.Item_Number;
    }
  };

  const receivingGrouped = useMemo(() => {
    const groups = new Map<string | number, ReceivingRow[]>();
    filteredReceivingRows.forEach((row) => {
      const key = getReceivingGroupKey(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });
    return Array.from(groups.entries()).map(([key, rows]) => ({ key, rows }));
  }, [filteredReceivingRows, reportType, cigOtpReportGroupBy]);

  const adjustmentGrouped = useMemo(() => {
    const groups = new Map<string | number, AdjustmentRow[]>();
    filteredAdjustmentRows.forEach((row) => {
      const key = getAdjustmentGroupKey(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });
    return Array.from(groups.entries()).map(([key, rows]) => ({ key, rows }));
  }, [filteredAdjustmentRows, reportType]);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start date and end date');
      return;
    }
    setLoadingData(true);
    const startStr = startDate.format('YYYY-MM-DD');
    const endStr = endDate.format('YYYY-MM-DD');
    try {
      if (isReceiving) {
        if (reportType === 'receiving-cigotp') {
          const response = (await getPoCigOtpReport(startStr, endStr)) as any;
          const raw = response?.data;
          const data = Array.isArray(raw?.data?.data) ? raw.data.data : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          const flatRows = flattenCigOtpResponse(data as PoCigOtpResponseItem[]);
          setReceivingRows(flatRows);
          setAdjustmentRows([]);
          toast.success(
            `Loaded ${flatRows.length} CIG/OTP report record(s) (${cigOtpReportGroupBy})`
          );
        } else {
          const response = (await getPoReceivingHistoryReport(startStr, endStr)) as any;
          // API returns { success, message, data: { data: [...] } } - array at response.data.data
          const raw = response?.data;
          const data = Array.isArray(raw?.data?.data) ? raw.data.data : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setReceivingRows(Array.isArray(data) ? data : []);
          setAdjustmentRows([]);
          toast.success(
            `Loaded ${Array.isArray(data) ? data.length : 0} receiving history record(s) for date range`
          );
        }
      } else {
        const response = (await getPoTransferAdjustmentReport(startStr, endStr)) as any;
        const raw = response?.data;
        const data = Array.isArray(raw?.data?.data) ? raw.data.data : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setAdjustmentRows(Array.isArray(data) ? data : []);
        setReceivingRows([]);
        toast.success(
          `Loaded ${Array.isArray(data) ? data.length : 0} adjustment record(s) for date range`
        );
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error(error?.response?.data?.message ?? 'Failed to load report data');
      setReceivingRows([]);
      setAdjustmentRows([]);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (d: string | undefined): string => {
    if (!d) return '';
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format('MM/DD/YYYY') : d;
  };

  const receivingColumns = [
    'P/O #',
    'Posting Date',
    'Invoice #',
    'Invoice Date',
    'Item',
    'Description',
    'Received',
    'PO Cost',
    'Ext Cost',
  ];

  // Receiving History (PO Group) - 5 columns: Item, Description, Received, PO Cost, Ext Cost
  const receivingColumnsPoGroup = ['Item', 'Description', 'Received', 'PO Cost', 'Ext Cost'];

  // Receiving History (Cigarettes - Packs/Sticks) - exact columns per report image
  const isPacksSticks =
    reportType === 'receiving-cigotp' && cigOtpReportGroupBy === 'Packs/sticks';
  const isOtpCost =
    reportType === 'receiving-cigotp' && cigOtpReportGroupBy === 'OTP cost';
  const isPoCost =
    reportType === 'receiving-cigotp' && cigOtpReportGroupBy === 'PO cost';
  const isPoOunces =
    reportType === 'receiving-cigotp' && cigOtpReportGroupBy === 'PO Ounces';
  const isBrandOunces =
    reportType === 'receiving-cigotp' && cigOtpReportGroupBy === 'Brand Ounces';
  const isReceivingItemGroup = reportType === 'receiving-item';
  const isReceivingPoGroup = reportType === 'receiving-po';
  const isReceivingVendorGroup = reportType === 'receiving-vendor';
  const isAdjustmentItemGroup = reportType === 'adjustment-item';
  const isAdjustmentAdjGroup = reportType === 'adjustment-adj';
  // Adjustments (ADJ Group) - 5 columns: Item, Description, Received, ADJ Cost, Ext Cost
  const adjustmentColumnsAdjGroup = ['Item', 'Description', 'Received', 'ADJ Cost', 'Ext Cost'];
  const receivingColumnsPacksSticks = [
    'P/O #',
    'Posted',
    'Invoice',
    'Item #',
    'Description',
    'Received',
    'Pack',
    'Sticks',
    'TOT Sticks',
    'TOT PACKS 20s/25s',
  ];

  const getPacksSticksRowValues = (r: ReceivingRow) => {
    const cigPack = r.Inventory?.Cig_Pack ?? 0;
    const totSticks = r.Total_Cig_Sticks ?? 0;
    const pack20 = cigPack === 20 ? totSticks / 20 : 0;
    const pack25 = cigPack === 25 ? totSticks / 25 : 0;
    return {
      pack: r.Inventory?.Cig_Pack ?? '',
      sticks: r.Inventory?.Cig_Sticks ?? '',
      totSticks,
      pack20,
      pack25,
      pack20s25s: `${Math.round(pack20).toLocaleString()} / ${Math.round(pack25).toLocaleString()}`,
    };
  };

  const costTypeLabels = useMemo(() => {
    const opt = COST_TYPE_OPTIONS.find((o) => o.value === costTypeForOtpPoReport);
    return { costLabel: opt?.costLabel ?? 'Avg Cost', extLabel: opt?.extLabel ?? 'Ext Avg Cost' };
  }, [costTypeForOtpPoReport]);

  // Receiving History (OTP Cost) - columns with selected cost type (PDF/CSV: PO posted, PO #, etc.)
  const receivingColumnsOtpCost = useMemo(
    () => [
      'PO posted',
      'PO #',
      'Invoice Date / Number',
      'Supplier',
      'Item',
      'Description',
      'OTP',
      'Received',
      costTypeLabels.costLabel,
      costTypeLabels.extLabel,
    ],
    [costTypeLabels]
  );

  const formatExtCost = (n: number): string =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Receiving History (PO Cost) - columns with selected cost type
  const receivingColumnsPoCost = useMemo(
    () => ['Item', 'Description', 'OTP', 'Received', costTypeLabels.costLabel, costTypeLabels.extLabel],
    [costTypeLabels]
  );

  // Receiving History (PO Ounces) - exact columns per report image
  const receivingColumnsPoOunces = [
    'Item',
    'Description',
    'OTP',
    'Brand Family',
    'Manufacturer',
    'Received',
    'Ounces',
    'Ext Ounces',
  ];

  // Receiving History (Brand Ounces) - 9 columns per report image: PO Number/Posted, Invoice Number/Date, Supplier, Manufacturer, Item #, Brand Family, Received, Ounces, Ext Ounces
  const receivingColumnsBrandOunces = [
    'Purchase Order Number / Posted',
    'Invoice Number / Date',
    'Supplier',
    'Manufacturer',
    'Item #',
    'Brand Family',
    'Received',
    'Ounces',
    'Ext Ounces',
  ];

  const getReceivingRowExtOunces = (r: ReceivingRow): number => {
    const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
    const oz = r.qtyOz ?? r.Inventory?.UnitOunces ?? 0;
    return oz * qty;
  };

  const adjustmentColumns = [
    'Number',
    'Posting Date',
    'Item',
    'Description',
    'Adjusted',
    'ADJ Cost',
    'Ext Cost',
  ];

  // Adjustments (Item Group) - single-line header
  const adjustmentColumnsItemGroup = [
    'ADJ #',
    'posting date',
    'item',
    'description',
    'adjusted',
    'ADJ cost',
    'Ext cost',
  ];

  const getReceivingRowExtCost = (r: ReceivingRow): number => {
    const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
    const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
    return r.Ext_POCost ?? r.Ext_AvgCost ?? qty * cost;
  };

  /** Unit cost by type (for OTP cost / PO cost reports) */
  const getReceivingRowCost = (r: ReceivingRow, costType: CostTypeKey): number => {
    switch (costType) {
      case 'AvgCost':
        return r.AvgCost ?? 0;
      case 'BaseCost':
        return r.BaseCost ?? 0;
      case 'NetCost':
        return r.NetCost ?? 0;
      case 'Invoice_Cost':
        return r.Invoice_Cost ?? 0;
      default:
        return r.AvgCost ?? 0;
    }
  };

  /** Extended cost by type (for OTP cost / PO cost reports) */
  const getReceivingRowExtCostByType = (r: ReceivingRow, costType: CostTypeKey): number => {
    const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
    const cost = getReceivingRowCost(r, costType);
    switch (costType) {
      case 'AvgCost':
        return r.Ext_AvgCost ?? qty * cost;
      case 'BaseCost':
        return r.Ext_BaseCost ?? qty * cost;
      case 'NetCost':
        return r.Ext_NetCost ?? qty * cost;
      case 'Invoice_Cost':
        return r.Ext_InvoiceCost ?? qty * cost;
      default:
        return r.Ext_AvgCost ?? qty * cost;
    }
  };

  const receivingGrandTotal = useMemo(() => {
    let received = 0;
    let extCost = 0;
    let totSticks = 0;
    let pack20 = 0;
    let pack25 = 0;
    let extOunces = 0;
    filteredReceivingRows.forEach((r) => {
      const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
      received += qty;
      extCost += (isOtpCost || isPoCost)
        ? getReceivingRowExtCostByType(r, costTypeForOtpPoReport)
        : getReceivingRowExtCost(r);
      if (isPacksSticks) {
        const v = getPacksSticksRowValues(r);
        totSticks += v.totSticks;
        pack20 += v.pack20;
        pack25 += v.pack25;
      }
      if (isPoOunces || isBrandOunces) {
        extOunces += getReceivingRowExtOunces(r);
      }
    });
    return {
      received,
      extCost,
      totSticks,
      pack20,
      pack25,
      pack20s25s: `${Math.round(pack20).toLocaleString()} / ${Math.round(pack25).toLocaleString()}`,
      extOunces,
    };
  }, [filteredReceivingRows, isPacksSticks, isPoOunces, isBrandOunces, isOtpCost, isPoCost, costTypeForOtpPoReport]);

  const adjustmentGrandTotal = useMemo(() => {
    let adjusted = 0;
    let extCost = 0;
    filteredAdjustmentRows.forEach((r) => {
      const qty = r.Quantity_Recd ?? 0;
      const ext = r.Ext_Cost ?? (r.Cost ?? 0) * qty;
      adjusted += qty;
      extCost += ext;
    });
    return { adjusted, extCost };
  }, [filteredAdjustmentRows]);

  const receivingTableRows = useMemo(() => {
    const all: (
      | { type: 'row'; row: ReceivingRow }
      | { type: 'groupHeader'; label: string }
      | {
          type: 'poCostGroupHeader';
          poNumber: number;
          dateReceived?: string;
          invoiceDate?: string;
          vendorName?: string;
          invoiceNumber?: string;
        }
      | {
          type: 'poGroupHeader';
          poNumber: number;
          postingDate?: string;
          vendorName?: string;
          invoiceNumber?: string;
          invoiceDate?: string;
          delivery: number;
          charge1: number;
          charge2: number;
          discounts: number;
          received: number;
          extCost: number;
        }
      | {
          type: 'itemTotal';
          received: number;
          extCost: number;
          totSticks?: number;
          pack20?: number;
          pack25?: number;
          pack20s25s?: string;
          poNumber?: number;
          vendorName?: string;
          extOunces?: number;
        }
      | {
          type: 'vendorGroupHeader';
          vendorId?: number | string;
          phone?: string;
          vendorName?: string;
          address?: string;
        }
      | { type: 'vendorTotal'; received: number; extCost: number }
      | { type: 'grandTotal' }
    )[] = [];
    receivingGrouped.forEach(({ key, rows }) => {
      if (isReceivingVendorGroup && rows[0]) {
        const r = rows[0];
        const v = r.POHeader?.Vendor;
        const vendorId = r.POHeader?.Primary_Vendor ?? key;
        const vendorName = v?.V_Description ?? '';
        const phone = v?.V_Phone ?? v?.Phone ?? '';
        const addressParts = [
          v?.V_Addr1 ?? v?.Address,
          [v?.V_City, v?.V_State, v?.V_Zip].filter(Boolean).join(' '),
        ].filter(Boolean);
        const address = addressParts.length ? addressParts.join(', ') : '';
        all.push({
          type: 'vendorGroupHeader',
          vendorId,
          phone,
          vendorName,
          address,
        });
        let vendorReceived = 0;
        let vendorExtCost = 0;
        const byPo = new Map<number, ReceivingRow[]>();
        rows.forEach((row) => {
          const po = row.PO_Number;
          if (!byPo.has(po)) byPo.set(po, []);
          byPo.get(po)!.push(row);
        });
        byPo.forEach((poRows) => {
          let poReceived = 0;
          let poExtCost = 0;
          poRows.forEach((row) => {
            const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
            all.push({ type: 'row', row });
            poReceived += qty;
            poExtCost += getReceivingRowExtCost(row);
          });
          vendorReceived += poReceived;
          vendorExtCost += poExtCost;
          all.push({ type: 'itemTotal', received: poReceived, extCost: poExtCost });
        });
        all.push({ type: 'vendorTotal', received: vendorReceived, extCost: vendorExtCost });
        return;
      }
      if (isOtpCost) {
        const otpName = rows[0]?.Inventory?.otpName ?? '';
        all.push({ type: 'groupHeader', label: `OTP: ${key} ${otpName}`.trim() });
      }
      if ((isPoCost || isPoOunces) && !isBrandOunces && rows[0]) {
        const r = rows[0];
        all.push({
          type: 'poCostGroupHeader',
          poNumber: r.PO_Number,
          dateReceived: r.POHeader?.Date_Received,
          invoiceDate: r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received,
          vendorName: r.POHeader?.Vendor?.V_Description,
          invoiceNumber: r.POHeader?.Invoice_Number,
        });
      }
      let groupReceived = 0;
      let groupExtCost = 0;
      let groupTotSticks = 0;
      let groupPack20 = 0;
      let groupPack25 = 0;
      let groupExtOunces = 0;
      rows.forEach((row) => {
        const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
        groupReceived += qty;
        groupExtCost += (isOtpCost || isPoCost)
          ? getReceivingRowExtCostByType(row, costTypeForOtpPoReport)
          : getReceivingRowExtCost(row);
        if (isPacksSticks) {
          const v = getPacksSticksRowValues(row);
          groupTotSticks += v.totSticks;
          groupPack20 += v.pack20;
          groupPack25 += v.pack25;
        }
        if (isPoOunces || isBrandOunces) {
          groupExtOunces += getReceivingRowExtOunces(row);
        }
      });
      if (isReceivingPoGroup && rows[0]) {
        const r = rows[0];
        all.push({
          type: 'poGroupHeader',
          poNumber: r.PO_Number,
          postingDate: r.POHeader?.Date_Received,
          vendorName: r.POHeader?.Vendor?.V_Description,
          invoiceNumber: r.POHeader?.Invoice_Number,
          invoiceDate: r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received,
          delivery: r.POHeader?.Delivery ?? 0,
          charge1: r.POHeader?.Charge1 ?? 0,
          charge2: r.POHeader?.Charge2 ?? 0,
          discounts: r.POHeader?.Discounts ?? 0,
          received: groupReceived,
          extCost: groupExtCost,
        });
      }
      rows.forEach((row) => {
        all.push({ type: 'row', row });
      });
      all.push({
        type: 'itemTotal',
        received: groupReceived,
        extCost: groupExtCost,
        ...(isPacksSticks && {
          totSticks: groupTotSticks,
          pack20: groupPack20,
          pack25: groupPack25,
          pack20s25s: `${Math.round(groupPack20).toLocaleString()} / ${Math.round(groupPack25).toLocaleString()}`,
          poNumber: rows[0]?.PO_Number,
          vendorName: rows[0]?.POHeader?.Vendor?.V_Description ?? '',
        }),
        ...((isPoOunces || isBrandOunces) && { extOunces: groupExtOunces }),
      });
    });
    all.push({ type: 'grandTotal' });
    return all;
  }, [receivingGrouped, isPacksSticks, isOtpCost, isPoCost, isPoOunces, isBrandOunces, isReceivingPoGroup, isReceivingVendorGroup, costTypeForOtpPoReport]);

  const adjustmentTableRows = useMemo(() => {
    type AdjRow =
      | { type: 'row'; row: AdjustmentRow }
      | { type: 'itemTotal'; adjusted: number; extCost: number }
      | { type: 'grandTotal' }
      | { type: 'adjGroupHeader'; adjNumber: number; postingDate?: string; extCost: number };
    const all: AdjRow[] = [];
    adjustmentGrouped.forEach(({ key, rows }) => {
      let groupAdjusted = 0;
      let groupExtCost = 0;
      rows.forEach((row) => {
        const qty = row.Quantity_Recd ?? 0;
        const ext = row.Ext_Cost ?? (row.Cost ?? 0) * qty;
        groupAdjusted += qty;
        groupExtCost += ext;
      });
      if (reportType === 'adjustment-adj') {
        all.push({
          type: 'adjGroupHeader',
          adjNumber: Number(key),
          postingDate: rows[0]?.POHeader?.Date_Received ?? rows[0]?.POHeader?.PO_Date,
          extCost: groupExtCost,
        });
      }
      rows.forEach((row) => {
        all.push({ type: 'row', row });
      });
      all.push({ type: 'itemTotal', adjusted: groupAdjusted, extCost: groupExtCost });
    });
    all.push({ type: 'grandTotal' });
    return all;
  }, [adjustmentGrouped, reportType]);

  const totalReceivingDetailRows = receivingTableRows.filter((x) => x.type === 'row').length;
  const totalAdjustmentDetailRows = adjustmentTableRows.filter((x) => x.type === 'row').length;
  const displayRows = isReceiving ? receivingTableRows : adjustmentTableRows;

  const reportTitleForPdf = isReceiving
    ? reportType === 'receiving-cigotp'
      ? isPacksSticks
        ? 'Receiving History (Cigarettes - Packs/Sticks)'
        : isOtpCost
          ? 'Receiving History (OTP Cost)'
          : isPoCost
            ? 'Receiving History (PO Cost)'
            : isPoOunces
              ? 'Receiving History (PO Ounces)'
              : isBrandOunces
                ? 'Receiving History (Brand Ounces)'
                : `Receiving History - CIG/OTP (${CIG_OTP_GROUP_OPTIONS.find((o) => o.value === cigOtpReportGroupBy)?.label ?? cigOtpReportGroupBy})`
      : reportType === 'receiving-item'
        ? 'Receiving History (Item Group)'
        : reportType === 'receiving-po'
          ? 'Receiving History (PO Group)'
          : reportType === 'receiving-vendor'
            ? 'Receiving History (Vendor Group)'
            : (REPORT_TYPES.find((r) => r.value === reportType)?.label ?? 'Receiving History')
    : reportType === 'adjustment-item'
      ? 'Adjustments (Item Group)'
      : reportType === 'adjustment-adj'
        ? 'Adjustments (ADJ Group)'
        : (REPORT_TYPES.find((r) => r.value === reportType)?.label ?? 'Adjustments');

  const handleGeneratePDF = async () => {
    const rowCount = isReceiving ? filteredReceivingRows.length : filteredAdjustmentRows.length;
    if (rowCount === 0) {
      toast.error('No data to generate report');
      return;
    }
    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const dateStr = dayjs().format('MM/DD/YYYY');
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

      const tableMarginTop = isOtpCost || isPoCost || isPoOunces || isBrandOunces || isReceivingItemGroup || isReceivingPoGroup || isReceivingVendorGroup || isAdjustmentItemGroup || isAdjustmentAdjGroup ? 26 : 22;

      if (isReceiving) {
        const headRow = isPacksSticks
          ? receivingColumnsPacksSticks
          : isOtpCost
            ? receivingColumnsOtpCost
            : isPoCost
              ? receivingColumnsPoCost
              : isPoOunces
                ? receivingColumnsPoOunces
                : isBrandOunces
                  ? receivingColumnsBrandOunces
                  : isReceivingPoGroup
                    ? receivingColumnsPoGroup
                    : isReceivingVendorGroup
                      ? receivingColumns
                      : receivingColumns;
        const receivingColCount = headRow.length;
        const bodyRows: (string[] | Array<{ content: string; colSpan: number }>)[] = [];
        const dividerRowIndices: number[] = [];
        receivingTableRows.forEach((item, idx) => {
          if (item.type === 'groupHeader') {
            const gh = item as { type: 'groupHeader'; label: string };
            bodyRows.push([{ content: gh.label, colSpan: receivingColCount }]);
            return;
          }
          if (item.type === 'poCostGroupHeader') {
            const ph = item as {
              type: 'poCostGroupHeader';
              poNumber: number;
              dateReceived?: string;
              invoiceDate?: string;
              vendorName?: string;
              invoiceNumber?: string;
            };
            bodyRows.push([{ content: `Purchase Order: ${ph.poNumber}`, colSpan: receivingColCount }]);
            bodyRows.push([{ content: `Date Received: ${formatDate(ph.dateReceived)}`, colSpan: receivingColCount }]);
            bodyRows.push([{ content: `Invoice Date: ${formatDate(ph.invoiceDate)}`, colSpan: receivingColCount }]);
            bodyRows.push([{ content: ph.vendorName ?? '', colSpan: receivingColCount }]);
            bodyRows.push([{ content: `Invoice Number: ${ph.invoiceNumber ?? ''}`, colSpan: receivingColCount }]);
            return;
          }
          if (item.type === 'poGroupHeader') {
            const ph = item as {
              type: 'poGroupHeader';
              poNumber: number;
              postingDate?: string;
              vendorName?: string;
              invoiceNumber?: string;
              invoiceDate?: string;
              delivery: number;
              charge1: number;
              charge2: number;
              discounts: number;
              received: number;
              extCost: number;
            };
            bodyRows.push([{ content: `PO Number: ${ph.poNumber}  Posting Date: ${formatDate(ph.postingDate)}`, colSpan: receivingColCount }]);
            bodyRows.push([{ content: ph.vendorName ?? '', colSpan: receivingColCount }]);
            bodyRows.push([{ content: `Invoice Number: ${ph.invoiceNumber ?? ''}  Invoice Date: ${formatDate(ph.invoiceDate)}`, colSpan: receivingColCount }]);
            bodyRows.push([{ content: `Delivery: ${ph.delivery.toFixed(2)}  Charge 1: ${ph.charge1.toFixed(2)}  Charge 2: ${ph.charge2.toFixed(2)}  Discounts: ${ph.discounts.toFixed(2)}`, colSpan: receivingColCount }]);
            bodyRows.push([{ content: `Recd ${ph.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}  PO TOTAL: ${formatExtCost(ph.extCost)}`, colSpan: receivingColCount }]);
            return;
          }
          if (item.type === 'vendorGroupHeader') {
            const vh = item as {
              type: 'vendorGroupHeader';
              vendorId?: number | string;
              phone?: string;
              vendorName?: string;
              address?: string;
            };
            bodyRows.push([{ content: `Vendor: ${vh.vendorId ?? ''}  Phone: ${vh.phone ?? ''}`.trim(), colSpan: receivingColCount }]);
            bodyRows.push([{ content: vh.vendorName ?? '', colSpan: receivingColCount }]);
            if (vh.address) {
              bodyRows.push([{ content: vh.address, colSpan: receivingColCount }]);
            }
            return;
          }
          if (item.type === 'row') {
            const r = item.row;
            if (isReceivingVendorGroup) {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
              const extCost = getReceivingRowExtCost(r);
              bodyRows.push([
                String(r.PO_Number ?? ''),
                formatDate(r.POHeader?.Date_Received),
                String(r.POHeader?.Invoice_Number ?? ''),
                formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received),
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : String(qty),
                cost.toFixed(2),
                formatExtCost(extCost),
              ]);
            } else if (isReceivingPoGroup) {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
              const extCost = getReceivingRowExtCost(r);
              bodyRows.push([
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : String(qty),
                cost.toFixed(2),
                formatExtCost(extCost),
              ]);
            } else if (isBrandOunces) {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const oz = r.qtyOz ?? r.Inventory?.UnitOunces ?? 0;
              const extOz = getReceivingRowExtOunces(r);
              const poPosted = [String(r.PO_Number ?? ''), formatDate(r.POHeader?.Date_Received)].filter(Boolean).join(' ');
              const invNumDate = [r.POHeader?.Invoice_Number ?? '', formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received)].filter(Boolean).join(' ');
              bodyRows.push([
                poPosted,
                invNumDate,
                r.POHeader?.Vendor?.V_Description ?? '',
                r.Inventory?.Manuf ?? 'Unassigned',
                String(r.Item_Number ?? ''),
                r.Inventory?.Brand ?? 'N/A',
                typeof qty === 'number' ? qty.toFixed(2) : String(qty),
                String(Number(oz).toFixed(2)),
                String(extOz.toFixed(2)),
              ]);
            } else if (isPoOunces) {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const oz = r.qtyOz ?? r.Inventory?.UnitOunces ?? 0;
              const extOz = getReceivingRowExtOunces(r);
              bodyRows.push([
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                String(r.OTP_Number ?? ''),
                r.Inventory?.Brand ?? '',
                r.Inventory?.Manuf ?? '',
                typeof qty === 'number' ? qty.toFixed(2) : String(qty),
                String(Number(oz).toFixed(2)),
                String(extOz.toFixed(2)),
              ]);
            } else if (isPoCost) {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const cost = getReceivingRowCost(r, costTypeForOtpPoReport);
              const extCost = getReceivingRowExtCostByType(r, costTypeForOtpPoReport);
              bodyRows.push([
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                String(r.OTP_Number ?? ''),
                typeof qty === 'number' ? qty.toFixed(2) : String(qty),
                cost.toFixed(2),
                formatExtCost(extCost),
              ]);
            } else if (isOtpCost) {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const cost = getReceivingRowCost(r, costTypeForOtpPoReport);
              const extCost = getReceivingRowExtCostByType(r, costTypeForOtpPoReport);
              const invoiceDateNum = [
                    formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received),
                    r.POHeader?.Invoice_Number ?? '',
                  ]
                    .filter(Boolean)
                    .join(' ');
              bodyRows.push([
                formatDate(r.POHeader?.Date_Received),
                String(r.PO_Number ?? ''),
                invoiceDateNum,
                r.POHeader?.Vendor?.V_Description ?? '',
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                String(r.OTP_Number ?? ''),
                typeof qty === 'number' ? qty.toFixed(2) : String(qty),
                cost.toFixed(2),
                formatExtCost(extCost),
              ]);
            } else if (isPacksSticks) {
              const v = getPacksSticksRowValues(r);
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              bodyRows.push([
                String(r.PO_Number ?? ''),
                formatDate(r.POHeader?.Date_Received),
                String(r.POHeader?.Invoice_Number ?? ''),
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                typeof qty === 'number' ? qty.toFixed(2) : String(qty),
                String(v.pack),
                String(v.sticks),
                v.totSticks.toLocaleString(),
                v.pack20s25s,
              ]);
            } else {
              const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
              const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
              const extCost = getReceivingRowExtCost(r);
              bodyRows.push([
                String(r.PO_Number ?? ''),
                formatDate(r.POHeader?.Date_Received),
                String(r.POHeader?.Invoice_Number ?? ''),
                formatDate(r.POHeader?.Date_Received),
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : String(qty),
                cost.toFixed(2),
                formatExtCost(extCost),
              ]);
            }
          } else if (item.type === 'itemTotal') {
            const it = item as {
              received?: number;
              extCost: number;
              totSticks?: number;
              pack20s25s?: string;
              poNumber?: number;
              vendorName?: string;
            };
            if (isReceivingVendorGroup) {
              bodyRows.push([
                'PO Totals:',
                '',
                '',
                '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(it.extCost ?? 0),
              ]);
            } else if (isReceivingPoGroup) {
              bodyRows.push([
                'PO Totals:',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(it.extCost ?? 0),
              ]);
            } else if (isBrandOunces) {
              bodyRows.push([
                '',
                '',
                '',
                '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                (it as { extOunces?: number }).extOunces != null ? Number((it as { extOunces?: number }).extOunces).toFixed(2) : '0.00',
              ]);
            } else if (isPoOunces) {
              bodyRows.push([
                '',
                '',
                '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                (it as any).extOunces != null ? Number((it as any).extOunces).toFixed(2) : '0.00',
              ]);
            } else if (isPoCost) {
              bodyRows.push([
                '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(it.extCost ?? 0),
              ]);
            } else if (isOtpCost) {
              bodyRows.push([
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(it.extCost ?? 0),
              ]);
            } else if (isPacksSticks) {
              bodyRows.push([
                'PO Total',
                String(it.poNumber ?? ''),
                it.vendorName ?? '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                '',
                (it.totSticks ?? 0).toLocaleString(),
                it.pack20s25s ?? '0 / 0',
              ]);
            } else {
              bodyRows.push([
                'Item Totals:',
                '',
                '',
                '',
                '',
                '',
                (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(it.extCost ?? 0),
              ]);
            }
            const nextItem = receivingTableRows[idx + 1];
            const skipDividerBeforeVendorTotal =
              isReceivingVendorGroup && nextItem?.type === 'vendorTotal';
            if (!skipDividerBeforeVendorTotal) {
              bodyRows.push([{ content: '', colSpan: receivingColCount }]);
              dividerRowIndices.push(bodyRows.length - 1);
            }
          } else if (item.type === 'vendorTotal') {
            const vt = item as { type: 'vendorTotal'; received: number; extCost: number };
            bodyRows.push([
              'VENDOR Totals:',
              '',
              '',
              '',
              '',
              '',
              vt.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              '',
              formatExtCost(vt.extCost),
            ]);
            bodyRows.push([{ content: '', colSpan: receivingColCount }]);
            dividerRowIndices.push(bodyRows.length - 1);
          } else {
            const g = receivingGrandTotal as {
              received: number;
              extCost: number;
              totSticks?: number;
              pack20s25s?: string;
            };
            if (isReceivingVendorGroup) {
              bodyRows.push([
                'GRAND TOTAL:',
                '',
                '',
                '',
                '',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(g.extCost),
              ]);
            } else if (isReceivingPoGroup) {
              bodyRows.push([
                'GRAND TOTAL:',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(g.extCost),
              ]);
            } else if (isBrandOunces) {
              bodyRows.push([
                'GRAND TOTALS',
                '',
                '',
                '',
                '',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                (g as { extOunces?: number }).extOunces != null ? Number((g as { extOunces?: number }).extOunces).toFixed(2) : '0.00',
              ]);
            } else if (isPoOunces) {
              bodyRows.push([
                'GRAND TOTALS',
                '',
                '',
                '',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                (g as any).extOunces != null ? Number((g as any).extOunces).toFixed(2) : '0.00',
              ]);
            } else if (isPoCost) {
              bodyRows.push([
                'GRAND TOTALS',
                '',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(g.extCost),
              ]);
            } else if (isOtpCost) {
              bodyRows.push([
                'GRAND TOTALS',
                '',
                '',
                '',
                '',
                '',
                'Received',
                Number(g.received).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                'Ext',
                formatExtCost(g.extCost),
              ]);
            } else if (isPacksSticks) {
              bodyRows.push([
                'GRAND TOTALS',
                '',
                '',
                '',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                '',
                (g.totSticks ?? 0).toLocaleString(),
                g.pack20s25s ?? '0 / 0',
              ]);
            } else {
              bodyRows.push([
                'GRAND TOTAL:',
                '',
                '',
                '',
                '',
                '',
                '',
                g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(g.extCost),
              ]);
            }
          }
        });
        const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
        const receivingRowStyles: Record<number, object> = {};
        dividerRowIndices.forEach((idx) => {
          receivingRowStyles[idx] = { fillColor: [200, 200, 200], minCellHeight: 2, cellPadding: 0 };
        });
        autoTableFn(doc, {
          head: [headRow],
          body: bodyRows,
          margin: { top: tableMarginTop, left: margin, right: margin },
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fontSize: 7, fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
          rowStyles: receivingRowStyles,
          columnStyles: { 0: { cellWidth: 24 } },
        });
      } else {
        const adjustmentColCount = isAdjustmentAdjGroup ? 5 : 7;
        const headRow = isAdjustmentItemGroup
          ? [adjustmentColumnsItemGroup]
          : isAdjustmentAdjGroup
            ? [adjustmentColumnsAdjGroup]
            : [adjustmentColumns];
        const bodyRows: (string[] | Array<{ content: string; colSpan: number }>)[] = [];
        const dividerRowIndices: number[] = [];
        adjustmentTableRows.forEach((item) => {
          if (item.type === 'adjGroupHeader') {
            const ah = item as { type: 'adjGroupHeader'; adjNumber: number; postingDate?: string; extCost: number };
            bodyRows.push([
              {
                content: `ADJ Number ${ah.adjNumber}  Posting Date: ${formatDate(ah.postingDate)}  INVENTORY ADJUSTMENT  ADJ TOTAL: ${formatExtCost(ah.extCost)}`,
                colSpan: adjustmentColCount,
              },
            ]);
            return;
          }
          if (item.type === 'row') {
            const r = item.row;
            const qty = r.Quantity_Recd ?? 0;
            const ext = r.Ext_Cost ?? (r.Cost ?? 0) * qty;
            if (isAdjustmentAdjGroup) {
              bodyRows.push([
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : String(qty),
                (r.Cost ?? 0).toFixed(2),
                formatExtCost(ext),
              ]);
            } else {
              bodyRows.push([
                String(r.PO_Number ?? ''),
                formatDate(r.POHeader?.Date_Received),
                String(r.Item_Number ?? ''),
                r.Inventory?.Description ?? '',
                typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : String(qty),
                (r.Cost ?? 0).toFixed(2),
                formatExtCost(ext),
              ]);
            }
          } else if (item.type === 'itemTotal') {
            const totalLabel = isAdjustmentAdjGroup ? 'ADJ Totals:' : 'Item Totals:';
            if (isAdjustmentAdjGroup) {
              bodyRows.push([
                totalLabel,
                '',
                item.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(item.extCost),
              ]);
            } else {
              bodyRows.push([
                totalLabel,
                '',
                '',
                '',
                item.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(item.extCost),
              ]);
            }
            bodyRows.push([{ content: '', colSpan: adjustmentColCount }]);
            dividerRowIndices.push(bodyRows.length - 1);
          } else {
            if (isAdjustmentAdjGroup) {
              bodyRows.push([
                'GRAND TOTAL:',
                '',
                adjustmentGrandTotal.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(adjustmentGrandTotal.extCost),
              ]);
            } else {
              bodyRows.push([
                'GRAND TOTAL:',
                '',
                '',
                '',
                adjustmentGrandTotal.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                '',
                formatExtCost(adjustmentGrandTotal.extCost),
              ]);
            }
          }
        });
        const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
        const adjustmentRowStyles: Record<number, object> = {};
        dividerRowIndices.forEach((idx) => {
          adjustmentRowStyles[idx] = { fillColor: [200, 200, 200], minCellHeight: 2, cellPadding: 0 };
        });
        autoTableFn(doc, {
          head: headRow,
          body: bodyRows,
          margin: { top: tableMarginTop, left: margin, right: margin },
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fontSize: 7, fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
          rowStyles: adjustmentRowStyles,
          columnStyles: { 0: { cellWidth: 24 } },
        });
      }

      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 6;
      const totalPagesCount = (doc.internal as { pages: unknown[] }).pages?.length ?? 1;

      const drawHeaderOnPage = () => {
        const hTop = 8;
        const hLineHeight = 4;
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        let leftY = hTop;
        if (distributorName) {
          doc.text(distributorName, margin, leftY);
          leftY += hLineHeight;
        }
        if (distributorAddress) {
          doc.text(distributorAddress, margin, leftY);
          leftY += hLineHeight;
        }
        if (distributorPhone) {
          doc.text(`Phone: ${distributorPhone}`, margin, leftY);
        }
        doc.setFontSize(10);
        doc.text(reportTitleForPdf, pageWidth / 2, hTop + hLineHeight, { align: 'center' });
        doc.setFontSize(7);
        doc.text(`Date Generated: ${dateStr}`, pageWidth - margin, hTop, { align: 'right' });
      };

      const drawFooterOnPage = (pageNum: number) => {
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('Report Generated by Woopsa', margin, footerY);
        if (logoDataUrl) {
          try {
            const textWidth = doc.getTextWidth('Report Generated by Woopsa');
            doc.addImage(logoDataUrl, 'PNG', margin + textWidth + 1, footerY - 2.5, 3, 3);
          } catch {
            // ignore logo render errors
          }
        }
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${pageNum} of ${totalPagesCount}`, pageWidth - margin, footerY, { align: 'right' });
      };

      for (let i = 1; i <= totalPagesCount; i++) {
        doc.setPage(i);
        drawHeaderOnPage();
        drawFooterOnPage(i);
      }
      const filename = isReceiving
        ? `receiving-history-${dateStr}.pdf`
        : `adjustments-${dateStr}.pdf`;
      doc.save(filename);
      toast.success(`PDF generated with ${rowCount} records`);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
            onChange={(e) => {
              const values = (e.target.value as string[]).map((v) => {
                const n = Number(v);
                return Number.isNaN(n) ? v : n;
              });
              setSelected(values);
            }}
            disabled={loadingFilters}
            displayEmpty
            renderValue={(selectedValues) => {
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
                  {vals.slice(0, 2).map((value) => {
                    const opt = options.find((o) => String(o.value) === value);
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
              '& .MuiOutlinedInput-root': { minHeight: '32px', height: '32px' },
              '& .MuiSelect-select': { minHeight: 'auto', py: 0.5 },
              '& .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
            }}
          >
            {options.map((option) => (
              <MenuItem
                key={String(option.value)}
                value={String(option.value)}
                sx={{ fontSize: '0.68rem', py: 0.25, minHeight: 'auto' }}
              >
                <Checkbox
                  checked={selected.some((s) => String(s) === String(option.value))}
                  size="small"
                  sx={{ py: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const reportTitle = isReceiving
    ? reportType === 'receiving-cigotp'
      ? isPacksSticks
        ? 'Receiving History (Cigarettes - Packs/Sticks)'
        : isOtpCost
          ? 'Receiving History (OTP Cost)'
          : isPoCost
            ? 'Receiving History (PO Cost)'
            : isPoOunces
              ? 'Receiving History (PO Ounces)'
              : isBrandOunces
                ? 'Receiving History (Brand Ounces)'
                : `Receiving History - CIG/OTP (${CIG_OTP_GROUP_OPTIONS.find((o) => o.value === cigOtpReportGroupBy)?.label ?? cigOtpReportGroupBy})`
      : reportType === 'receiving-item'
        ? 'Receiving History (Item Group)'
        : reportType === 'receiving-po'
          ? 'Receiving History (PO Group)'
          : reportType === 'receiving-vendor'
            ? 'Receiving History (Vendor Group)'
            : (REPORT_TYPES.find((r) => r.value === reportType)?.label ?? 'Receiving History')
    : reportType === 'adjustment-item'
      ? 'Adjustments (Item Group)'
      : reportType === 'adjustment-adj'
        ? 'Adjustments (ADJ Group)'
        : (REPORT_TYPES.find((r) => r.value === reportType)?.label ?? 'Adjustments');

  return (
    <Box
      sx={{
        height: { xs: 'auto', md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, p: 2, pb: 0.5 }}>
        {!showPreview && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.813rem', mb: 1, mt: 0 }}>
              Receiving History / Transfer & Adjustment Report
            </Typography>
            <Paper
              sx={{
                p: 0.75,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                backgroundColor:
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              }}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
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
                    Date Range
                  </Typography>
                  <CustomDatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    sx={{ mb: 1.5 }}
                  />
                  <CustomDatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate || undefined}
                    sx={{ mb: 1.5 }}
                  />

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
                    Receiving History Reports (Posted)
                  </Typography>
                  <FormControl component="fieldset" size="small" fullWidth>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {REPORT_TYPES.filter((r) => r.section === 'receiving').map((r) => (
                        <FormControlLabel
                          key={r.value}
                          control={
                            <Radio
                              size="small"
                              checked={reportType === r.value}
                              onChange={() => setReportType(r.value)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.75rem' }}>{r.label}</Typography>}
                        />
                      ))}
                    </Box>
                  </FormControl>

                  {reportType === 'receiving-cigotp' && (
                    <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          mb: 0.5,
                          fontWeight: 500,
                          fontSize: '0.68rem',
                          display: 'block',
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Report type (poCigOtpReport)
                      </Typography>
                      <Select
                        value={cigOtpReportGroupBy}
                        onChange={(e) => setCigOtpReportGroupBy(e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {CIG_OTP_GROUP_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {(isOtpCost || isPoCost) && (
                    <FormControl size="small" fullWidth>
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
                        Cost type (OTP cost / PO cost)
                      </Typography>
                      <Select
                        value={costTypeForOtpPoReport}
                        onChange={(e) => setCostTypeForOtpPoReport(e.target.value as CostTypeKey)}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {COST_TYPE_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                            {opt.costLabel} / {opt.extLabel}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      mb: 0.4,
                      mt: 1,
                      fontWeight: 500,
                      fontSize: '0.68rem',
                      display: 'block',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Transfer/Adjustment Reports (Posted)
                  </Typography>
                  <FormControl component="fieldset" size="small" fullWidth>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {REPORT_TYPES.filter((r) => r.section === 'adjustment').map((r) => (
                        <FormControlLabel
                          key={r.value}
                          control={
                            <Radio
                              size="small"
                              checked={reportType === r.value}
                              onChange={() => setReportType(r.value)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.75rem' }}>{r.label}</Typography>}
                        />
                      ))}
                    </Box>
                  </FormControl>

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

                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={1.5}>
                    {renderMultiSelect(
                      'Sales Category',
                      filterOptions.salesCategories,
                      selectedSalesCategories,
                      (v) => setSelectedSalesCategories(v as number[]),
                      'All Sales Categories'
                    )}
                    {renderMultiSelect(
                      'Price Class',
                      filterOptions.priceClasses,
                      selectedPriceClasses,
                      (v) => setSelectedPriceClasses(v as number[]),
                      'All Price Classes'
                    )}
                    {renderMultiSelect(
                      'OTP Type',
                      filterOptions.otpTypes,
                      selectedOtpTypes,
                      (v) => setSelectedOtpTypes(v as number[]),
                      'All OTP Types'
                    )}
                    {renderMultiSelect(
                      'Vendor',
                      filterOptions.vendors,
                      selectedVendors,
                      (v) => setSelectedVendors(v as number[]),
                      'Vendors'
                    )}
                    {renderMultiSelect(
                      'Section',
                      filterOptions.sections,
                      selectedSections,
                      (v) => setSelectedSections(v as string[]),
                      'All Sections'
                    )}
                    {renderMultiSelect(
                      'Location',
                      filterOptions.locations,
                      selectedLocations,
                      (v) => setSelectedLocations(v as number[]),
                      'All Locations'
                    )}
                    {renderMultiSelect(
                      'Item Select',
                      filterOptions.items,
                      selectedItems,
                      (v) => setSelectedItems(v),
                      'All Items'
                    )}
                    {renderMultiSelect(
                      'Pick Area',
                      filterOptions.pickAreas,
                      selectedPickAreas,
                      (v) => setSelectedPickAreas(v as string[]),
                      'All Pick Areas'
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}

        {showPreview && (
          <Paper
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {(() => {
              const distributor = wareHouseDetail?.[0];
              const wholesaleName = distributor?.D_Name || '';
              const wholesaleAddress = [
                distributor?.D_Addr1,
                distributor?.D_City,
                distributor?.D_State,
              ]
                .filter(Boolean)
                .join(', ');
              const wholesalePhone = distributor?.D_Phone || '';
              const dateGenerated = dayjs().format('MM/DD/YYYY');
              return (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 1.5,
                      pb: 1,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                      {wholesaleName && (
                        <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {wholesaleName}
                        </Typography>
                      )}
                      {wholesaleAddress && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {wholesaleAddress}
                        </Typography>
                      )}
                      {wholesalePhone && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          Phone: {wholesalePhone}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: '0 0 auto' }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {reportTitle}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', textAlign: 'right', minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Date Generated: {dateGenerated}
                      </Typography>
                    </Box>
                  </Box>
                  {startDate && endDate && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                      Date Range: {startDate.format('MM/DD/YYYY')} thru {endDate.format('MM/DD/YYYY')}
                    </Typography>
                  )}
                </>
              );
            })()}
            {loadingData ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <LinearProgress sx={{ width: '60%' }} />
              </Box>
            ) : (isReceiving ? totalReceivingDetailRows : totalAdjustmentDetailRows) === 0 ? (
              <Typography sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                No data available for selected filters and date range
              </Typography>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      {isPacksSticks ? (
                        <>
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Purchase Order Number / Posted
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Invoice
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Item # Description
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Received
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              *** Cigarettes ***
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              TOT Sticks
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              TOT PACKS 20s / 25s
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>P/O #</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Posted</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Invoice</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Item #</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Description</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Received</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Pack</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Sticks</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>TOT Sticks</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>20s / 25s</TableCell>
                          </TableRow>
                        </>
                      ) : isPoCost ? (
                        <TableRow>
                          {receivingColumnsPoCost.map((col) => (
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
                      ) : isPoOunces ? (
                        <TableRow>
                          {receivingColumnsPoOunces.map((col) => (
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
                      ) : isBrandOunces ? (
                        <>
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Purchase Order
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Invoice
                            </TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Supplier</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Manufacturer</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Item #</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Brand Family</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Received</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Ounces</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Ext Ounces</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Number / Posted</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Number / Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                          </TableRow>
                        </>
                      ) : isOtpCost ? (
                        <>
                          <TableRow>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              PO posted
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              PO #
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Invoice
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Supplier
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Item
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Description
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              OTP
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Received
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Avg Cost
                            </TableCell>
                            <TableCell
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Ext Cost
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Date / Number</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                          </TableRow>
                        </>
                      ) : isReceivingItemGroup ? (
                        <>
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Purchase Order
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Invoice
                            </TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Item</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Description</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Received</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>PO Cost</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Ext Cost</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Number</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Posting Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Number</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                          </TableRow>
                        </>
                      ) : isReceivingVendorGroup ? (
                        <>
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Purchase Order
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              sx={{
                                backgroundColor:
                                  theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Invoice
                            </TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Item</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Description</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Received</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>PO Cost</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontWeight: 600, fontSize: '0.75rem' }}>Ext Cost</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Number</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Posting Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Number</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }}>Date</TableCell>
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                            <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0', fontSize: '0.7rem' }} />
                          </TableRow>
                        </>
                      ) : isReceivingPoGroup ? (
                        <TableRow>
                          {receivingColumnsPoGroup.map((col) => (
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
                      ) : isAdjustmentAdjGroup ? (
                        <TableRow>
                          {adjustmentColumnsAdjGroup.map((col) => (
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
                      ) : isAdjustmentItemGroup ? (
                        <TableRow>
                          {adjustmentColumnsItemGroup.map((col) => (
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
                      ) : (
                        <TableRow>
                          {(isReceiving ? receivingColumns : adjustmentColumns).map((col) => (
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
                      )}
                    </TableHead>
                    <TableBody>
                      {displayRows.map((item, idx) => {
                        if (item.type === 'groupHeader') {
                          const gh = item as { type: 'groupHeader'; label: string };
                          return (
                            <TableRow key={`gh-${idx}`} sx={{ backgroundColor: theme.palette.action.selected }}>
                              <TableCell colSpan={10} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {gh.label}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        if (item.type === 'vendorGroupHeader') {
                          const vh = item as {
                            type: 'vendorGroupHeader';
                            vendorId?: number | string;
                            phone?: string;
                            vendorName?: string;
                            address?: string;
                          };
                          return (
                            <React.Fragment key={`vgrp-${idx}`}>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={9} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                  Vendor: {vh.vendorId ?? ''}  Phone: {vh.phone ?? ''}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={9} sx={{ fontSize: '0.75rem' }}>
                                  {vh.vendorName ?? ''}
                                </TableCell>
                              </TableRow>
                              {vh.address ? (
                                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell colSpan={9} sx={{ fontSize: '0.75rem' }}>
                                    {vh.address}
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </React.Fragment>
                          );
                        }
                        if (item.type === 'poGroupHeader') {
                          const ph = item as {
                            type: 'poGroupHeader';
                            poNumber: number;
                            postingDate?: string;
                            vendorName?: string;
                            invoiceNumber?: string;
                            invoiceDate?: string;
                            delivery: number;
                            charge1: number;
                            charge2: number;
                            discounts: number;
                            received: number;
                            extCost: number;
                          };
                          return (
                            <React.Fragment key={`pogrp-${idx}`}>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={5} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                  PO Number: {ph.poNumber}  Posting Date: {formatDate(ph.postingDate)}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={5} sx={{ fontSize: '0.75rem' }}>
                                  {ph.vendorName ?? ''}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={5} sx={{ fontSize: '0.75rem' }}>
                                  Invoice Number: {ph.invoiceNumber ?? ''}  Invoice Date: {formatDate(ph.invoiceDate)}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={5} sx={{ fontSize: '0.75rem' }}>
                                  Delivery: {ph.delivery.toFixed(2)}  Charge 1: {ph.charge1.toFixed(2)}  Charge 2: {ph.charge2.toFixed(2)}  Discounts: {ph.discounts.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={5} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                  Recd {ph.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}  PO TOTAL: {formatExtCost(ph.extCost)}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        }
                        if (item.type === 'poCostGroupHeader') {
                          const ph = item as {
                            type: 'poCostGroupHeader';
                            poNumber: number;
                            dateReceived?: string;
                            invoiceDate?: string;
                            vendorName?: string;
                            invoiceNumber?: string;
                          };
                          const poColSpan = isPoOunces ? 8 : 6;
                          return (
                            <React.Fragment key={`pogh-${idx}`}>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={poColSpan} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                  Purchase Order: {ph.poNumber}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={poColSpan} sx={{ fontSize: '0.75rem' }}>
                                  Date Received: {formatDate(ph.dateReceived)}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={poColSpan} sx={{ fontSize: '0.75rem' }}>
                                  Invoice Date: {formatDate(ph.invoiceDate)}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={poColSpan} sx={{ fontSize: '0.75rem' }}>
                                  {ph.vendorName ?? ''}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell colSpan={poColSpan} sx={{ fontSize: '0.75rem' }}>
                                  Invoice Number: {ph.invoiceNumber ?? ''}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        }
                        if (item.type === 'adjGroupHeader') {
                          const ah = item as {
                            type: 'adjGroupHeader';
                            adjNumber: number;
                            postingDate?: string;
                            extCost: number;
                          };
                          const colSpan = isAdjustmentAdjGroup ? 5 : 7;
                          return (
                            <TableRow key={`adjh-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                              <TableCell colSpan={colSpan} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                ADJ Number {ah.adjNumber}  Posting Date: {formatDate(ah.postingDate)}  INVENTORY ADJUSTMENT  ADJ TOTAL: {formatExtCost(ah.extCost)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        if (item.type === 'row') {
                          const r = (item as { type: 'row'; row: ReceivingRow | AdjustmentRow }).row;
                          if (isReceiving) {
                            const row = r as ReceivingRow;
                            if (isPoCost) {
                              const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                              const cost = getReceivingRowCost(row, costTypeForOtpPoReport);
                              const extCost = getReceivingRowExtCostByType(row, costTypeForOtpPoReport);
                              return (
                                <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.OTP_Number ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toFixed(2) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{cost.toFixed(2)}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatExtCost(extCost)}</TableCell>
                                </TableRow>
                              );
                            }
                            if (isOtpCost) {
                              const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                              const cost = getReceivingRowCost(row, costTypeForOtpPoReport);
                              const extCost = getReceivingRowExtCostByType(row, costTypeForOtpPoReport);
                              const invoiceDateNum = [
                                    formatDate(row.POHeader?.Invoice_Date ?? row.POHeader?.Date_Received),
                                    row.POHeader?.Invoice_Number ?? '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ');
                              return (
                                <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {formatDate(row.POHeader?.Date_Received)}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.PO_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{invoiceDateNum}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.POHeader?.Vendor?.V_Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.OTP_Number ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toFixed(2) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{cost.toFixed(2)}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatExtCost(extCost)}</TableCell>
                                </TableRow>
                              );
                            }
                            if (isPacksSticks) {
                              const v = getPacksSticksRowValues(row);
                              const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                              return (
                                <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.PO_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {formatDate(row.POHeader?.Date_Received)}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.POHeader?.Invoice_Number ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toFixed(2) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{v.pack}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{v.sticks}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {v.totSticks.toLocaleString()}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{v.pack20s25s}</TableCell>
                                </TableRow>
                              );
                            }
                            if (isPoOunces) {
                              const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                              const oz = row.qtyOz ?? row.Inventory?.UnitOunces ?? 0;
                              const extOz = getReceivingRowExtOunces(row);
                              return (
                                <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.otpName ?? row.OTP_Number ?? 'N/A'}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Inventory?.Brand ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Inventory?.Manuf ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toFixed(2) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{Number(oz).toFixed(2)}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{extOz.toFixed(2)}</TableCell>
                                </TableRow>
                              );
                            }
                            if (isBrandOunces) {
                              const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                              const oz = row.qtyOz ?? row.Inventory?.UnitOunces ?? 0;
                              const extOz = getReceivingRowExtOunces(row);
                              const poPosted = [row.PO_Number, formatDate(row.POHeader?.Date_Received)].filter(Boolean).join(' ');
                              const invNumDate = [row.POHeader?.Invoice_Number, formatDate(row.POHeader?.Invoice_Date ?? row.POHeader?.Date_Received)].filter(Boolean).join(' ');
                              return (
                                <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{poPosted}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{invNumDate}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.POHeader?.Vendor?.V_Description ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Inventory?.Manuf ?? 'Unassigned'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Inventory?.Brand ?? 'N/A'}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toFixed(2) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{Number(oz).toFixed(2)}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{extOz.toFixed(2)}</TableCell>
                                </TableRow>
                              );
                            }
                            if (isReceivingPoGroup) {
                              const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                              const cost = row.Cost ?? row.NetCost ?? row.BaseCost ?? row.AvgCost ?? 0;
                              const extCost = getReceivingRowExtCost(row);
                              return (
                                <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{cost.toFixed(2)}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatExtCost(extCost)}</TableCell>
                                </TableRow>
                              );
                            }
                            const qty = row.qtyRecd ?? row.Quantity_Recd ?? 0;
                            const cost = row.Cost ?? row.NetCost ?? row.BaseCost ?? row.AvgCost ?? 0;
                            const extCost = getReceivingRowExtCost(row);
                            return (
                              <TableRow key={`rec-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{row.PO_Number}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {formatDate(row.POHeader?.Date_Received)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {row.POHeader?.Invoice_Number ?? ''}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {formatDate(row.POHeader?.Invoice_Date ?? row.POHeader?.Date_Received)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {row.Inventory?.Description ?? ''}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{cost.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{formatExtCost(extCost)}</TableCell>
                              </TableRow>
                            );
                          } else {
                            const row = r as AdjustmentRow;
                            const qty = row.Quantity_Recd ?? 0;
                            const ext = row.Ext_Cost ?? (row.Cost ?? 0) * qty;
                            if (isAdjustmentAdjGroup) {
                              return (
                                <TableRow key={`adj-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {row.Inventory?.Description ?? ''}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    {typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{(row.Cost ?? 0).toFixed(2)}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatExtCost(ext)}</TableCell>
                                </TableRow>
                              );
                            }
                            return (
                              <TableRow key={`adj-${idx}-${row.PO_Number}-${row.Line_Number}`} hover>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{row.PO_Number}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {formatDate(row.POHeader?.Date_Received)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{row.Item_Number}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {row.Inventory?.Description ?? ''}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>
                                  {(row.Cost ?? 0).toFixed(2)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{formatExtCost(ext)}</TableCell>
                              </TableRow>
                            );
                          }
                        }
                        if (item.type === 'itemTotal') {
                          const it = item as {
                            type: 'itemTotal';
                            received?: number;
                            adjusted?: number;
                            extCost: number;
                            totSticks?: number;
                            pack20s25s?: string;
                            poNumber?: number;
                            vendorName?: string;
                          };
                          if (isReceiving) {
                            if (isReceivingVendorGroup) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>PO Totals:</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {formatExtCost(it.extCost ?? 0)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (isReceivingPoGroup) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>PO Totals:</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {formatExtCost(it.extCost ?? 0)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (isBrandOunces) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem' }} colSpan={6} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {((it as { extOunces?: number }).extOunces ?? 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (isPoOunces) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {((it as { extOunces?: number }).extOunces ?? 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (isPoCost) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {formatExtCost(it.extCost ?? 0)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (isOtpCost) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {formatExtCost(it.extCost ?? 0)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            if (isPacksSticks) {
                              return (
                                <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>PO Total</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{it.poNumber ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{it.vendorName ?? ''}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem' }} />
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {(it.totSticks ?? 0).toLocaleString()}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                    {it.pack20s25s ?? '0 / 0'}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            return (
                              <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Item Totals:</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                  {(it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                  {formatExtCost(it.extCost ?? 0)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isAdjustmentAdjGroup) {
                            return (
                              <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>ADJ Totals:</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                  {(it.adjusted ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                  {formatExtCost(it.extCost ?? 0)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return (
                            <TableRow key={`total-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Item Totals:</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                {(it.adjusted ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                {formatExtCost(it.extCost ?? 0)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        if (item.type === 'vendorTotal') {
                          const vt = item as { type: 'vendorTotal'; received: number; extCost: number };
                          return (
                            <TableRow key={`vtotal-${idx}`} sx={{ backgroundColor: theme.palette.action.hover }}>
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>VENDOR Totals:</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                {vt.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                                {formatExtCost(vt.extCost)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        const grand = isReceiving ? receivingGrandTotal : adjustmentGrandTotal;
                        if (isReceiving) {
                          const g = grand as {
                            received: number;
                            extCost: number;
                            totSticks?: number;
                            pack20s25s?: string;
                          };
                          if (isPoCost) {
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTALS</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {formatExtCost(g.extCost)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isOtpCost) {
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTALS</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Received</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {Number(g.received).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Ext</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {formatExtCost(g.extCost)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isPacksSticks) {
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTALS</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {(g.totSticks ?? 0).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.pack20s25s ?? '0 / 0'}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isReceivingVendorGroup) {
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTAL:</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {formatExtCost(g.extCost)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isReceivingPoGroup) {
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTAL:</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {formatExtCost(g.extCost)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isPoOunces) {
                            const gExt = (grand as { extOunces?: number }).extOunces ?? 0;
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTALS</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {gExt.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          if (isBrandOunces) {
                            const gExt = (grand as { extOunces?: number }).extOunces ?? 0;
                            return (
                              <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTALS</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }} />
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                  {gExt.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return (
                            <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTAL:</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                {g.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                {formatExtCost(g.extCost)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        if (isAdjustmentAdjGroup) {
                          return (
                            <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTAL:</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                {adjustmentGrandTotal.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} />
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                                {formatExtCost(adjustmentGrandTotal.extCost)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={`grand-${idx}`} sx={{ backgroundColor: theme.palette.primary.main + '20' }}>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>GRAND TOTAL:</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }} />
                            <TableCell sx={{ fontSize: '0.75rem' }} />
                            <TableCell sx={{ fontSize: '0.75rem' }} />
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                              {adjustmentGrandTotal.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }} />
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}>
                              {formatExtCost(adjustmentGrandTotal.extCost)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography
                  variant="body2"
                  sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}
                >
                  {isReceiving ? totalReceivingDetailRows : totalAdjustmentDetailRows} record(s)
                </Typography>
              </>
            )}
            <Box
              sx={{
                mt: 2,
                pt: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Report Generated by Woopsa
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

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
              disabled={loadingData || loadingFilters || !startDate || !endDate}
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
                onClick={() => {
                  const rowCount = isReceiving ? filteredReceivingRows.length : filteredAdjustmentRows.length;
                  if (rowCount === 0) {
                    toast.error('No data to generate CSV');
                    return;
                  }
                  const columns = isReceiving
                    ? isPacksSticks
                      ? receivingColumnsPacksSticks
                      : isOtpCost
                        ? receivingColumnsOtpCost
                        : isPoCost
                          ? receivingColumnsPoCost
                          : isPoOunces
                            ? receivingColumnsPoOunces
                            : isBrandOunces
                              ? receivingColumnsBrandOunces
                              : isReceivingPoGroup
                                ? receivingColumnsPoGroup
                                : isReceivingVendorGroup
                                  ? receivingColumns
                                  : receivingColumns
                    : isAdjustmentItemGroup
                      ? adjustmentColumnsItemGroup
                      : isAdjustmentAdjGroup
                        ? adjustmentColumnsAdjGroup
                        : adjustmentColumns;
                  const header = columns.join(',');
                  const rowsCsv: string[] = [];
                  if (isReceiving) {
                    receivingTableRows.forEach((item) => {
                      if (item.type === 'groupHeader') {
                        const gh = item as { type: 'groupHeader'; label: string };
                        rowsCsv.push(`"${gh.label.replace(/"/g, '""')}",,,,,,,,,`);
                        return;
                      }
                      if (item.type === 'poCostGroupHeader') {
                        const ph = item as {
                          type: 'poCostGroupHeader';
                          poNumber: number;
                          dateReceived?: string;
                          invoiceDate?: string;
                          vendorName?: string;
                          invoiceNumber?: string;
                        };
                        const poCsvEmpty = isPoOunces ? ',,,,,,,' : ',,,,,'; // 8 cols vs 6 cols
                        rowsCsv.push(`"Purchase Order: ${ph.poNumber}"${poCsvEmpty}`);
                        rowsCsv.push(`"Date Received: ${formatDate(ph.dateReceived)}"${poCsvEmpty}`);
                        rowsCsv.push(`"Invoice Date: ${formatDate(ph.invoiceDate)}"${poCsvEmpty}`);
                        rowsCsv.push(`"${(ph.vendorName ?? '').replace(/"/g, '""')}"${poCsvEmpty}`);
                        rowsCsv.push(`"Invoice Number: ${ph.invoiceNumber ?? ''}"${poCsvEmpty}`);
                        return;
                      }
                      if (item.type === 'poGroupHeader') {
                        const ph = item as {
                          type: 'poGroupHeader';
                          poNumber: number;
                          postingDate?: string;
                          vendorName?: string;
                          invoiceNumber?: string;
                          invoiceDate?: string;
                          delivery: number;
                          charge1: number;
                          charge2: number;
                          discounts: number;
                          received: number;
                          extCost: number;
                        };
                        rowsCsv.push(`"PO Number: ${ph.poNumber}  Posting Date: ${formatDate(ph.postingDate)}",,,,`);
                        rowsCsv.push(`"${(ph.vendorName ?? '').replace(/"/g, '""')}",,,,`);
                        rowsCsv.push(`"Invoice Number: ${ph.invoiceNumber ?? ''}  Invoice Date: ${formatDate(ph.invoiceDate)}",,,,`);
                        rowsCsv.push(`"Delivery: ${ph.delivery.toFixed(2)}  Charge 1: ${ph.charge1.toFixed(2)}  Charge 2: ${ph.charge2.toFixed(2)}  Discounts: ${ph.discounts.toFixed(2)}",,,,`);
                        rowsCsv.push(`"Recd ${ph.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}  PO TOTAL: ${formatExtCost(ph.extCost)}",,,,`);
                        return;
                      }
                      if (item.type === 'vendorGroupHeader') {
                        const vh = item as {
                          type: 'vendorGroupHeader';
                          vendorId?: number | string;
                          phone?: string;
                          vendorName?: string;
                          address?: string;
                        };
                        rowsCsv.push(`"Vendor: ${vh.vendorId ?? ''}  Phone: ${(vh.phone ?? '').replace(/"/g, '""')}",,,,,,,,`);
                        rowsCsv.push(`"${(vh.vendorName ?? '').replace(/"/g, '""')}",,,,,,,,`);
                        if (vh.address) {
                          rowsCsv.push(`"${vh.address.replace(/"/g, '""')}",,,,,,,,`);
                        }
                        return;
                      }
                      if (item.type === 'vendorTotal') {
                        const vt = item as { type: 'vendorTotal'; received: number; extCost: number };
                        rowsCsv.push(
                          [
                            '"VENDOR Totals:"',
                            '',
                            '',
                            '',
                            '',
                            '',
                            vt.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                            '',
                            formatExtCost(vt.extCost),
                          ].join(',')
                        );
                        return;
                      }
                      if (item.type === 'row') {
                        const r = item.row;
                        if (isReceivingVendorGroup) {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
                          const extCost = getReceivingRowExtCost(r);
                          rowsCsv.push(
                            [
                              r.PO_Number,
                              formatDate(r.POHeader?.Date_Received),
                              r.POHeader?.Invoice_Number ?? '',
                              formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received),
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty,
                              cost.toFixed(2),
                              formatExtCost(extCost),
                            ].join(',')
                          );
                        } else if (isReceivingPoGroup) {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
                          const extCost = getReceivingRowExtCost(r);
                          rowsCsv.push(
                            [
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty,
                              cost.toFixed(2),
                              formatExtCost(extCost),
                            ].join(',')
                          );
                        } else if (isBrandOunces) {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const oz = r.qtyOz ?? r.Inventory?.UnitOunces ?? 0;
                          const extOz = getReceivingRowExtOunces(r);
                          const poPosted = [r.PO_Number, formatDate(r.POHeader?.Date_Received)].filter(Boolean).join(' ');
                          const invNumDate = [r.POHeader?.Invoice_Number ?? '', formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received)].filter(Boolean).join(' ');
                          rowsCsv.push(
                            [
                              `"${String(poPosted).replace(/"/g, '""')}"`,
                              `"${String(invNumDate).replace(/"/g, '""')}"`,
                              `"${(r.POHeader?.Vendor?.V_Description ?? '').replace(/"/g, '""')}"`,
                              `"${(r.Inventory?.Manuf ?? 'Unassigned').replace(/"/g, '""')}"`,
                              r.Item_Number,
                              `"${(r.Inventory?.Brand ?? 'N/A').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toFixed(2) : qty,
                              Number(oz).toFixed(2),
                              extOz.toFixed(2),
                            ].join(',')
                          );
                        } else if (isPoOunces) {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const oz = r.qtyOz ?? r.Inventory?.UnitOunces ?? 0;
                          const extOz = getReceivingRowExtOunces(r);
                          rowsCsv.push(
                            [
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              `"${(r.Inventory?.otpName ?? r.OTP_Number ?? 'N/A').toString().replace(/"/g, '""')}"`,
                              `"${(r.Inventory?.Brand ?? '').replace(/"/g, '""')}"`,
                              `"${(r.Inventory?.Manuf ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toFixed(2) : qty,
                              Number(oz).toFixed(2),
                              extOz.toFixed(2),
                            ].join(',')
                          );
                        } else if (isPoCost) {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const cost = getReceivingRowCost(r, costTypeForOtpPoReport);
                          const extCost = getReceivingRowExtCostByType(r, costTypeForOtpPoReport);
                          rowsCsv.push(
                            [
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              r.OTP_Number ?? '',
                              typeof qty === 'number' ? qty.toFixed(2) : qty,
                              cost.toFixed(2),
                              formatExtCost(extCost),
                            ].join(',')
                          );
                        } else if (isOtpCost) {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const cost = getReceivingRowCost(r, costTypeForOtpPoReport);
                          const extCost = getReceivingRowExtCostByType(r, costTypeForOtpPoReport);
                          const invoiceDateNum = [
                                formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received),
                                r.POHeader?.Invoice_Number ?? '',
                              ]
                                .filter(Boolean)
                                .join(' ');
                          rowsCsv.push(
                            [
                              formatDate(r.POHeader?.Date_Received),
                              r.PO_Number,
                              `"${invoiceDateNum.replace(/"/g, '""')}"`,
                              `"${(r.POHeader?.Vendor?.V_Description ?? '').replace(/"/g, '""')}"`,
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              r.OTP_Number ?? '',
                              typeof qty === 'number' ? qty.toFixed(2) : qty,
                              cost.toFixed(2),
                              formatExtCost(extCost),
                            ].join(',')
                          );
                        } else if (isPacksSticks) {
                          const v = getPacksSticksRowValues(r);
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          rowsCsv.push(
                            [
                              r.PO_Number,
                              formatDate(r.POHeader?.Date_Received),
                              `"${(r.POHeader?.Invoice_Number ?? '').replace(/"/g, '""')}"`,
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toFixed(2) : qty,
                              v.pack,
                              v.sticks,
                              v.totSticks.toLocaleString(),
                              v.pack20s25s,
                            ].join(',')
                          );
                        } else {
                          const qty = r.qtyRecd ?? r.Quantity_Recd ?? 0;
                          const cost = r.Cost ?? r.NetCost ?? r.BaseCost ?? r.AvgCost ?? 0;
                          const extCost = getReceivingRowExtCost(r);
                          rowsCsv.push(
                            [
                              r.PO_Number,
                              formatDate(r.POHeader?.Date_Received),
                              r.POHeader?.Invoice_Number ?? '',
                              formatDate(r.POHeader?.Invoice_Date ?? r.POHeader?.Date_Received),
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty,
                              cost.toFixed(2),
                              formatExtCost(extCost),
                            ].join(',')
                          );
                        }
                      } else if (item.type === 'itemTotal') {
                        const it = item as {
                          received?: number;
                          extCost: number;
                          totSticks?: number;
                          pack20s25s?: string;
                          poNumber?: number;
                          vendorName?: string;
                        };
                        if (isReceivingVendorGroup) {
                          rowsCsv.push(
                            [
                              '"PO Totals:"',
                              '',
                              '',
                              '',
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(it.extCost ?? 0),
                            ].join(',')
                          );
                        } else if (isReceivingPoGroup) {
                          rowsCsv.push(
                            [
                              '"PO Totals:"',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(it.extCost ?? 0),
                            ].join(',')
                          );
                        } else if (isBrandOunces) {
                          rowsCsv.push(
                            [
                              '',
                              '',
                              '',
                              '',
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              (it as { extOunces?: number }).extOunces != null
                                ? Number((it as { extOunces?: number }).extOunces).toFixed(2)
                                : '0.00',
                            ].join(',')
                          );
                        } else if (isPoOunces) {
                          rowsCsv.push(
                            [
                              '',
                              '',
                              '',
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              (it as { extOunces?: number }).extOunces != null
                                ? Number((it as { extOunces?: number }).extOunces).toFixed(2)
                                : '0.00',
                            ].join(',')
                          );
                        } else if (isPoCost) {
                          rowsCsv.push(
                            [
                              '',
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(it.extCost ?? 0),
                            ].join(',')
                          );
                        } else if (isOtpCost) {
                          rowsCsv.push(
                            [
                              '',
                              '',
                              '',
                              '',
                              '',
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(it.extCost ?? 0),
                            ].join(',')
                          );
                        } else if (isPacksSticks) {
                          rowsCsv.push(
                            [
                              '"PO Total"',
                              it.poNumber ?? '',
                              `"${(it.vendorName ?? '').replace(/"/g, '""')}"`,
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              '',
                              (it.totSticks ?? 0).toLocaleString(),
                              it.pack20s25s ?? '0 / 0',
                            ].join(',')
                          );
                        } else {
                          rowsCsv.push(
                            [
                              '"Item Totals:"',
                              '',
                              '',
                              '',
                              '',
                              '',
                              (it.received ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(it.extCost ?? 0),
                            ].join(',')
                          );
                        }
                      } else {
                        const g = receivingGrandTotal as {
                          received: number;
                          extCost: number;
                          totSticks?: number;
                          pack20s25s?: string;
                        };
                        if (isReceivingVendorGroup) {
                          rowsCsv.push(
                            [
                              '"GRAND TOTAL:"',
                              '',
                              '',
                              '',
                              '',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(g.extCost),
                            ].join(',')
                          );
                        } else if (isReceivingPoGroup) {
                          rowsCsv.push(
                            [
                              '"GRAND TOTAL:"',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(g.extCost),
                            ].join(',')
                          );
                        } else if (isBrandOunces) {
                          const gExt = (g as { extOunces?: number }).extOunces ?? 0;
                          rowsCsv.push(
                            [
                              '"GRAND TOTALS"',
                              '',
                              '',
                              '',
                              '',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              gExt.toFixed(2),
                            ].join(',')
                          );
                        } else if (isPoOunces) {
                          const gExt = (g as { extOunces?: number }).extOunces ?? 0;
                          rowsCsv.push(
                            [
                              '"GRAND TOTALS"',
                              '',
                              '',
                              '',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              gExt.toFixed(2),
                            ].join(',')
                          );
                        } else if (isPoCost) {
                          rowsCsv.push(
                            [
                              '"GRAND TOTALS"',
                              '',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(g.extCost),
                            ].join(',')
                          );
                        } else if (isOtpCost) {
                          rowsCsv.push(
                            [
                              '"GRAND TOTALS"',
                              '',
                              '',
                              '',
                              '',
                              '',
                              'Received',
                              Number(g.received).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                              'Ext',
                              formatExtCost(g.extCost),
                            ].join(',')
                          );
                        } else if (isPacksSticks) {
                          rowsCsv.push(
                            [
                              '"GRAND TOTALS"',
                              '',
                              '',
                              '',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              '',
                              (g.totSticks ?? 0).toLocaleString(),
                              g.pack20s25s ?? '0 / 0',
                            ].join(',')
                          );
                        } else {
                          rowsCsv.push(
                            [
                              '"GRAND TOTAL:"',
                              '',
                              '',
                              '',
                              '',
                              '',
                              g.received.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                              '',
                              formatExtCost(g.extCost),
                            ].join(',')
                          );
                        }
                      }
                    });
                  } else {
                    adjustmentTableRows.forEach((item) => {
                      if (item.type === 'adjGroupHeader') {
                        const ah = item as { type: 'adjGroupHeader'; adjNumber: number; postingDate?: string; extCost: number };
                        rowsCsv.push(
                          `"ADJ Number ${ah.adjNumber}  Posting Date: ${formatDate(ah.postingDate)}  INVENTORY ADJUSTMENT  ADJ TOTAL: ${formatExtCost(ah.extCost).replace(/"/g, '""')}",,,,`
                        );
                        return;
                      }
                      if (item.type === 'row') {
                        const r = item.row;
                        const qty = r.Quantity_Recd ?? 0;
                        const ext = r.Ext_Cost ?? (r.Cost ?? 0) * qty;
                        if (isAdjustmentAdjGroup) {
                          rowsCsv.push(
                            [
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty,
                              (r.Cost ?? 0).toFixed(2),
                              `"${formatExtCost(ext).replace(/"/g, '""')}"`,
                            ].join(',')
                          );
                        } else {
                          rowsCsv.push(
                            [
                              r.PO_Number,
                              formatDate(r.POHeader?.Date_Received),
                              r.Item_Number,
                              `"${(r.Inventory?.Description ?? '').replace(/"/g, '""')}"`,
                              typeof qty === 'number' ? qty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : qty,
                              (r.Cost ?? 0).toFixed(2),
                              `"${formatExtCost(ext).replace(/"/g, '""')}"`,
                            ].join(',')
                          );
                        }
                      } else if (item.type === 'itemTotal') {
                        const totalLabel = isAdjustmentAdjGroup ? 'ADJ Totals:' : 'Item Totals:';
                        if (isAdjustmentAdjGroup) {
                          rowsCsv.push(
                            `"${totalLabel}",,${item.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })},,"${formatExtCost(item.extCost).replace(/"/g, '""')}"`
                          );
                        } else {
                          rowsCsv.push(
                            `"${totalLabel}",,,,${item.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })},,"${formatExtCost(item.extCost).replace(/"/g, '""')}"`
                          );
                        }
                      } else {
                        if (isAdjustmentAdjGroup) {
                          rowsCsv.push(
                            `"GRAND TOTAL:",,${adjustmentGrandTotal.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })},,"${formatExtCost(adjustmentGrandTotal.extCost).replace(/"/g, '""')}"`
                          );
                        } else {
                          rowsCsv.push(
                            `"GRAND TOTAL:",,,,${adjustmentGrandTotal.adjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })},,"${formatExtCost(adjustmentGrandTotal.extCost).replace(/"/g, '""')}"`
                          );
                        }
                      }
                    });
                  }
                  const csv = [header, ...rowsCsv].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  const dateStr = dayjs().format('MM-DD-YYYY');
                  link.href = url;
                  link.download = `${isReceiving ? 'receiving-history' : 'adjustments'}-${dateStr}.csv`;
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toast.success(`CSV generated with ${rowCount} records`);
                }}
                disabled={(isReceiving ? filteredReceivingRows.length : filteredAdjustmentRows.length) === 0}
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
                disabled={
                  generatingPDF ||
                  (isReceiving ? filteredReceivingRows.length : filteredAdjustmentRows.length) === 0
                }
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

export default ReceivingHistoryAdjustmentTab;
