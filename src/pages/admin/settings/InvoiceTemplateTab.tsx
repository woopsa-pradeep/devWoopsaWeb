import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Switch,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Grid,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Edit, ArrowBack, PictureAsPdf, Delete } from '@mui/icons-material';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JsBarcode = require('jsbarcode');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';
import CustomButton from '../../../component/atoms/CustomButton';
import TextInput from '../../../component/atoms/TextInput';
import CommonTable from '../../../component/atoms/Table/CommonTable';
import { TableColumn } from '../../../component/atoms/Table/CommonTable';
import toast from 'react-hot-toast';
import { getCustomerList } from '../../../redux/apis/distrubutor/listApis';
import {
  getInvoiceTemplates,
  getInvoiceTemplateById,
  createInvoiceTemplate,
  updateInvoiceTemplate,
  deleteInvoiceTemplate,
  getCustomerAssignInvoiceTemplates,
  bulkAddCustomerAssignInvoiceTemplates,
  bulkRemoveCustomerAssignInvoiceTemplates,
  type InvoiceTemplateApi,
  type CustomerAssignInvoiceTemplateApi,
} from '../../../redux/apis/manager/invoiceTemplateApis';
import { wrapFooterMessage } from '../../../utils/invoicePdfGenerator';

export type LogoPosition = 'left' | 'center' | 'right';

// Invoice column field definitions. Order: qty, shipped, item #, description, pack, size, upc, short #, EBT, SRP, deposit, unit price, tax, ext price, Total price.
const INVOICE_COLUMN_FIELDS = [
  { key: 'orderQty', label: 'qty' },
  { key: 'shippedQty', label: 'Shipped' },
  { key: 'itemNumber', label: 'Item #' },
  { key: 'description', label: 'Description' },
  { key: 'pack', label: 'Pack' },
  { key: 'size', label: 'Size' },
  { key: 'upc', label: 'UPC' },
  { key: 'sortNumber', label: 'Short #' },
  { key: 'ebt', label: 'EBT' },
  { key: 'retail1', label: 'SRP' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'price', label: 'Unit Price' },
  { key: 'tax', label: 'Tax' },
  { key: 'priceWithTax', label: 'Ext Price' },
  { key: 'totalPrice', label: 'Total Price' },
];

// UPC display options
const UPC_OPTIONS = [
  { value: 'barcode_case', label: 'Barcode - Case' },
  { value: 'barcode_retail', label: 'Barcode - Retail' },
  { value: 'barcode_primary', label: 'Barcode - Primary' },
  { value: 'number_case', label: 'Number - Case' },
  { value: 'number_retail', label: 'Number - Retail' },
  { value: 'number_primary', label: 'Number - Primary' },
];

const SAMPLE_CUSTOMER = { number: 2290, name: 'WOOPSA', address: '500 JAMISON TEST STREET XX 12345', phone: '1234567890', route: 10, stop: 5 };
const SAMPLE_DISTRIBUTOR = { name: 'WOOPSA TEST', address: '500 JAMISON TEST STREET XX 12345' };
const SAMPLE_DOC_NUMBER = 'INV-474537';
const SUMMARY_HEADER_HEIGHT_MM = 28;
/** Gap (mm) between QTY CATEGORY table and footer block on last page (match invoicePdfGenerator). */
const GAP_CATEGORY_TO_FOOTER_MM = 10;
/** Approximate height (mm) per row in QTY CATEGORY table for overlap check. */
const CATEGORY_TABLE_ROW_HEIGHT_MM = 6;
/** Last page: reserve bottom for QTY Category + gap + footer block + Woopsa line. */
const LAST_PAGE_CATEGORY_SUMMARY_MM = 28;
const LAST_PAGE_FOOTER_BLOCK_MM = 48;
/** Minimal gap from page bottom (match invoicePdfGenerator). */
const WOOPSA_LINE_BOTTOM_MM = 2;
const TABLE_BOTTOM_MARGIN_MM = LAST_PAGE_CATEGORY_SUMMARY_MM + GAP_CATEGORY_TO_FOOTER_MM + LAST_PAGE_FOOTER_BLOCK_MM + 1 + WOOPSA_LINE_BOTTOM_MM;
/** Bottom margin on non-last pages (no footer on these pages). */
const NON_LAST_PAGE_BOTTOM_MM = 10;
const ROW_HEIGHT_EST_MM = 5;
const GROUP_HEADER_EST_MM = 8;
const SUBTOTAL_ROW_EST_MM = 5;
/** Fixed width (mm) for Description column - must match invoicePdfGenerator.DESCRIPTION_COLUMN_WIDTH_MM */
const DESCRIPTION_COLUMN_WIDTH_MM = 50;
const formatCurrency = (n: number): string => (n != null && !Number.isNaN(n) ? `$${Number(n).toFixed(2)}` : '$0.00');
const HEADER_MSG_MAX_LENGTH = 750;
const FOOTER_MSG_MAX_LENGTH = 1000;
/** Height of full footer zone on last page (totals + report line). */
const SAMPLE_INVOICE_ITEMS_BASE = [
  { orderQty: 1, shippedQty: 1, description: 'GAME 2/129 MVP WATERMELON 30CT', itemNumber: 44077, sortNumber: 1, upc: '123456789012', pack: '2', size: '30CT', deposit: 0.5, price: 12.99, tax: 1.04, priceWithTax: 14.03, totalPrice: 14.03, retail1: 15.99, ebt: true, salesCategory: 'Cigarettes' },
  { orderQty: 2, shippedQty: 2, description: 'DUTCH 2/129 COCOA 2PKT 30CT', itemNumber: 41742, sortNumber: 2, upc: '123456789013', pack: '2', size: '30CT', deposit: 0.5, price: 11.50, tax: 0.92, priceWithTax: 12.42, totalPrice: 24.84, retail1: 13.99, ebt: false, salesCategory: 'Cigarettes' },
  { orderQty: 1, shippedQty: 1, description: 'SWISHER 2/1.39 RED 30CT', itemNumber: 44013, sortNumber: 3, upc: '123456789014', pack: '2', size: '30CT', deposit: 0.25, price: 8.99, tax: 0.72, priceWithTax: 9.71, totalPrice: 9.71, retail1: 10.99, ebt: true, salesCategory: 'Cigars' },
  { orderQty: 1, shippedQty: 1, description: 'SWISHER 2/1.39 GRAPE 30CT', itemNumber: 44018, sortNumber: 4, upc: '123456789015', pack: '2', size: '30CT', deposit: 0.25, price: 8.99, tax: 0.72, priceWithTax: 9.71, totalPrice: 9.71, retail1: 10.99, ebt: false, salesCategory: 'Cigars' },
  { orderQty: 3, shippedQty: 3, description: 'GAME 2/129 BLUE 30CT', itemNumber: 44021, sortNumber: 5, upc: '123456789021', pack: '2', size: '30CT', deposit: 0.5, price: 12.99, tax: 1.04, priceWithTax: 14.03, totalPrice: 42.09, retail1: 15.99, ebt: true, salesCategory: 'Cigarettes' },
];

const SAMPLE_INVOICE_ITEMS = (() => {
  const items: typeof SAMPLE_INVOICE_ITEMS_BASE = [];
  for (let i = 0; i < 100; i++) {
    const base = SAMPLE_INVOICE_ITEMS_BASE[i % SAMPLE_INVOICE_ITEMS_BASE.length];
    const qty = (i % 3) + 1;
    items.push({
      ...base,
      orderQty: qty,
      shippedQty: qty,
      itemNumber: base.itemNumber + i * 10,
      sortNumber: i + 1,
      upc: String((123456789012 + i) % 1e12).padStart(12, '0'),
      totalPrice: Math.round(base.priceWithTax * qty * 100) / 100,
      ebt: i % 3 !== 1,
    });
  }
  return items;
})();

export type InvoiceGroupBy = 'alphabetSalesCategory' | 'alphabet' | 'sequence' | '';

export type HeaderPageOption = 'all' | 'first' | 'firstPlusSummary';

/** Footer layout: message left + totals right (default), or message right + totals left */
export type FooterLayoutOption = 'messageLeft' | 'messageRight';

export interface InvoiceTemplate {
  id: string | number;
  name: string;
  mainTemplate?: boolean;
  groupBy: InvoiceGroupBy;
  showGroupHeader: boolean; // for alphabet+sales category: show header
  selectedColumns: { [key: string]: boolean };
  upcOption: string;
  // Header
  showDistributorDetails: boolean;
  showCustomerDetails: boolean;
  showBillTo: boolean;
  showShipTo: boolean;
  showDocNumber: boolean;
  showPageOf: boolean;
  /** Show date only (mm/dd/yyyy). Mutually exclusive with showInvoiceDateWithTime. */
  showInvoiceDate: boolean;
  /** Show date with time (mm/dd/yyyy). Mutually exclusive with showInvoiceDate. */
  showInvoiceDateWithTime: boolean;
  showRoute: boolean;
  showStop: boolean;
  showLogo: boolean;
  logoPosition: LogoPosition;
  showTerms: boolean;
  headerOnPages: HeaderPageOption;
  showHeaderMessage: boolean;
  headerMessageFirstPage: string;
  /** Selected customer IDs (multiselect); passed in payload as customer id(s). */
  selectedCustomerIds: number[];
  // Footer
  footerLayout: FooterLayoutOption;
  showFooterMessage: boolean;
  footerMessageLastPage: string;
  showSubTotal: boolean;
  showDeliveryCharge: boolean;
  showDeposit: boolean;
  showLastBalance: boolean;
  showTotalAmountDue: boolean;
  showReportGeneratedByWoopsa: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultTemplate = (): Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '',
  mainTemplate: false,
  groupBy: '',
  showGroupHeader: true,
  selectedColumns: {
    orderQty: true,
    shippedQty: true,
    itemNumber: true,
    description: true,
    pack: false,
    size: false,
    upc: true,
    sortNumber: false,
    ebt: false,
    retail1: false,
    deposit: false,
    price: true,
    tax: false,
    priceWithTax: true,
    totalPrice: true,
  },
  upcOption: 'barcode_primary',
  showDistributorDetails: true,
  showCustomerDetails: true,
  showBillTo: true,
  showShipTo: true,
  showDocNumber: true,
  showPageOf: true,
  showInvoiceDate: true,
  showInvoiceDateWithTime: false,
  showRoute: true,
  showStop: true,
  showLogo: true,
  logoPosition: 'left',
  showTerms: true,
  headerOnPages: 'all',
  showHeaderMessage: false,
  headerMessageFirstPage: '',
  selectedCustomerIds: [],
  footerLayout: 'messageLeft',
  showFooterMessage: true,
  footerMessageLastPage: '',
  showSubTotal: true,
  showDeliveryCharge: true,
  showDeposit: true,
  showLastBalance: true,
  showTotalAmountDue: true,
  showReportGeneratedByWoopsa: true,
});

/** Normalize API string values that may come as lowercase (e.g. alphabetsalescategory) to expected option values. */
function normalizeGroupBy(value: string | undefined): InvoiceGroupBy {
  if (!value) return '';
  const v = value.toLowerCase();
  if (v === 'alphabetsalescategory') return 'alphabetSalesCategory';
  if (v === 'alphabet') return 'alphabet';
  if (v === 'sequence') return 'sequence';
  return value as InvoiceGroupBy;
}

function normalizeHeaderOnPages(value: string | undefined): HeaderPageOption {
  if (!value) return 'all';
  const v = value.toLowerCase();
  if (v === 'firstplussummary') return 'firstPlusSummary';
  if (v === 'first') return 'first';
  if (v === 'all') return 'all';
  return value as HeaderPageOption;
}

function normalizeFooterLayout(value: string | undefined): FooterLayoutOption {
  if (!value) return 'messageLeft';
  const v = value.toLowerCase();
  if (v === 'messageright') return 'messageRight';
  if (v === 'messageleft') return 'messageLeft';
  return value as FooterLayoutOption;
}

/** Map API template to local InvoiceTemplate (without selectedCustomerIds; load those separately). */
function apiTemplateToLocal(api: InvoiceTemplateApi): InvoiceTemplate {
  return {
    id: api.id,
    name: api.name,
    mainTemplate: api.mainTemplate,
    groupBy: normalizeGroupBy(api.groupBy),
    showGroupHeader: api.showGroupHeader ?? true,
    selectedColumns: { ...defaultTemplate().selectedColumns, ...(api.selectedColumns ?? {}) },
    upcOption: api.upcOption || 'barcode_primary',
    showDistributorDetails: api.showDistributorDetails ?? true,
    showCustomerDetails: api.showCustomerDetails ?? true,
    showBillTo: api.showBillTo ?? true,
    showShipTo: api.showShipTo ?? true,
    showDocNumber: api.showDocNumber ?? true,
    showPageOf: api.showPageOf ?? true,
    showInvoiceDate: api.showInvoiceDate ?? true,
    showInvoiceDateWithTime: api.showInvoiceDateWithTime ?? false,
    showRoute: api.showRoute ?? true,
    showStop: api.showStop ?? true,
    showLogo: api.showLogo ?? true,
    logoPosition: (api.logoPosition as LogoPosition) || 'left',
    showTerms: api.showTerms ?? true,
    headerOnPages: normalizeHeaderOnPages(api.headerOnPages),
    showHeaderMessage: api.showHeaderMessage ?? false,
    headerMessageFirstPage: api.headerMessageFirstPage || '',
    selectedCustomerIds: [],
    footerLayout: normalizeFooterLayout(api.footerLayout),
    showFooterMessage: api.showFooterMessage ?? true,
    footerMessageLastPage: api.footerMessageLastPage || '',
    showSubTotal: api.showSubTotal ?? true,
    showDeliveryCharge: api.showDeliveryCharge ?? true,
    showDeposit: api.showDeposit ?? true,
    showLastBalance: api.showLastBalance ?? true,
    showTotalAmountDue: api.showTotalAmountDue ?? true,
    showReportGeneratedByWoopsa: api.showReportGeneratedByWoopsa ?? true,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

const InvoiceTemplateTab: React.FC = () => {
  const theme = useTheme();
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form state (single template being edited)
  const [name, setName] = useState('');
  const [groupBy, setGroupBy] = useState<InvoiceGroupBy>('');
  const [showGroupHeader, setShowGroupHeader] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<{ [key: string]: boolean }>(() => ({
    ...defaultTemplate().selectedColumns,
  }));
  const [upcOption, setUpcOption] = useState(defaultTemplate().upcOption);
  const [showDistributorDetails, setShowDistributorDetails] = useState(true);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [showBillTo, setShowBillTo] = useState(true);
  const [showShipTo, setShowShipTo] = useState(true);
  const [showDocNumber, setShowDocNumber] = useState(true);
  const [showPageOf, setShowPageOf] = useState(true);
  const [showInvoiceDate, setShowInvoiceDate] = useState(true);
  const [showInvoiceDateWithTime, setShowInvoiceDateWithTime] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [showStop, setShowStop] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('left');
  const [showTerms, setShowTerms] = useState(true);
  const [headerOnPages, setHeaderOnPages] = useState<HeaderPageOption>('all');
  const [showHeaderMessage, setShowHeaderMessage] = useState(false);
  const [headerMessageFirstPage, setHeaderMessageFirstPage] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [customerList, setCustomerList] = useState<{ C_Number: number; C_Name: string }[]>([]);
  const [customerListLoading, setCustomerListLoading] = useState(false);
  const [footerLayout, setFooterLayout] = useState<FooterLayoutOption>('messageLeft');
  const [showFooterMessage, setShowFooterMessage] = useState(true);
  const [footerMessageLastPage, setFooterMessageLastPage] = useState('');
  const [showSubTotal, setShowSubTotal] = useState(true);
  const [showDeliveryCharge, setShowDeliveryCharge] = useState(true);
  const [showDeposit, setShowDeposit] = useState(true);
  const [showLastBalance, setShowLastBalance] = useState(true);
  const [showTotalAmountDue, setShowTotalAmountDue] = useState(true);
  const [showReportGeneratedByWoopsa, setShowReportGeneratedByWoopsa] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await getInvoiceTemplates({ page: 1, limit: 100 });
      const list = res?.data?.data ?? [];
      setTemplates(list.map((t: InvoiceTemplateApi) => apiTemplateToLocal(t)));
    } catch (err) {
      console.error('Error loading invoice templates:', err);
      toast.error('Failed to load invoice templates');
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const generateBarcodeDataUrl = (text: string): string | null => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, { format: 'CODE128', width: 2, height: 40, displayValue: false, margin: 2 });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return null;
    }
  };

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
        img.onerror = async () => {
          try {
            const response = await fetch(typeof rabbitLogo === 'string' ? rabbitLogo : (rabbitLogo as string));
            if (response.ok) {
              const blob = await response.blob();
              const reader = new FileReader();
              reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            } else resolve(null);
          } catch {
            resolve(null);
          }
        };
        img.src = typeof rabbitLogo === 'string' ? rabbitLogo : (rabbitLogo as string);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  const addInvoiceHeaderToPage = (doc: jsPDF, pageNum: number, totalPages: number, logoDataUrl: string | null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    // "left" = 20% logo | 35% distributor | 45% tables. "center" (beside distributor) = 35% distributor (left) | 20% logo | 45% tables.
    const logoColWidth = contentWidth * 0.2;
    const distColWidth = contentWidth * 0.35;
    const logoW = Math.min(25, logoColWidth - 4);
    const logoH = 18;
    let distStartX: number;
    let logoStartX: number;
    let rightStartX: number;
    let rightTableWidth: number;
    if (logoPosition === 'center') {
      distStartX = margin;
      logoStartX = margin + distColWidth + 4;
      rightStartX = margin + distColWidth + logoColWidth + 8;
      rightTableWidth = pageWidth - margin - rightStartX;
    } else {
      logoStartX = margin;
      distStartX = margin + logoColWidth + 4;
      rightStartX = margin + logoColWidth + distColWidth + 8;
      rightTableWidth = pageWidth - margin - rightStartX;
    }
    let headerStartY = 6;
    if (showPageOf) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 6, {
        align: 'right',
      });
      headerStartY = 10;
    }
    let leftBottom = headerStartY;
    if (showLogo && logoDataUrl && logoPosition === 'left') {
      try {
        doc.addImage(logoDataUrl, 'PNG', logoStartX, headerStartY, logoW, logoH);
        leftBottom = headerStartY + logoH + 2;
      } catch {
        leftBottom = headerStartY + 4;
      }
    }
    let centerY = headerStartY;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', distStartX, centerY);
    centerY += 6;
    if (showDistributorDetails) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(SAMPLE_DISTRIBUTOR.name, distStartX, centerY);
      centerY += 5;
      doc.setFontSize(7);
      if (SAMPLE_DISTRIBUTOR.address) {
        SAMPLE_DISTRIBUTOR.address.split(', ').forEach((line: string) => {
          doc.text(line.trim(), distStartX, centerY);
          centerY += 4;
        });
      }
    }
    if (logoPosition === 'center' && showLogo && logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', logoStartX, headerStartY, logoW, logoH);
        leftBottom = Math.max(leftBottom, headerStartY + logoH + 2);
      } catch {
        // ignore
      }
    }
    if (logoPosition === 'center') {
      leftBottom = Math.max(leftBottom, centerY);
    }
    let tablesStartY = headerStartY;
    if (logoPosition === 'right' && showLogo && logoDataUrl) {
      try {
        const logoRightX = pageWidth - margin - logoW;
        doc.addImage(logoDataUrl, 'PNG', logoRightX, headerStartY, logoW, logoH);
        tablesStartY = headerStartY + logoH + 2;
      } catch {
        // ignore
      }
    }
    const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
    const greyHead = { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'normal', fontSize: 5 };
    const dateStr = (() => {
      const now = new Date();
      return `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    })();
    const cellW3 = rightTableWidth / 3;
    const tableMargin = { left: rightStartX, right: margin };
    const tableStyle = { fontSize: 5, cellPadding: 1 };
    autoTableFn(doc, {
      startY: tablesStartY,
      head: [['CUSTOMER NO', 'INVOICE#:', 'INVOICE DATE:']],
      body: [[String(SAMPLE_CUSTOMER.number), SAMPLE_DOC_NUMBER, dateStr]],
      columnStyles: { 0: { cellWidth: cellW3 }, 1: { cellWidth: cellW3 }, 2: { cellWidth: cellW3 } },
      styles: tableStyle,
      headStyles: greyHead,
      margin: tableMargin,
      tableWidth: rightTableWidth,
    });
    let tablesY = (doc as any).lastAutoTable.finalY + 0.5;
    autoTableFn(doc, {
      startY: tablesY,
      head: [['TERMS:', 'CUSTOMER LICENCE#', 'VIA']],
      body: [['', '', '']],
      columnStyles: { 0: { cellWidth: cellW3 }, 1: { cellWidth: cellW3 }, 2: { cellWidth: cellW3 } },
      styles: tableStyle,
      headStyles: greyHead,
      margin: tableMargin,
      tableWidth: rightTableWidth,
    });
    tablesY = (doc as any).lastAutoTable.finalY + 0.5;
    autoTableFn(doc, {
      startY: tablesY,
      head: [['SALES PERSON', 'ROUTE NUMBER', 'STOP NUMBER']],
      body: [['HOUSE', showRoute ? String(SAMPLE_CUSTOMER.route) : '', showStop ? String(SAMPLE_CUSTOMER.stop) : '']],
      columnStyles: { 0: { cellWidth: cellW3 }, 1: { cellWidth: cellW3 }, 2: { cellWidth: cellW3 } },
      styles: tableStyle,
      headStyles: greyHead,
      margin: tableMargin,
      tableWidth: rightTableWidth,
    });
    const tablesBottom = (doc as any).lastAutoTable.finalY;
    const headerBlockBottom = Math.max(leftBottom, centerY, tablesBottom) + 4;
    let billShipStartY = headerBlockBottom;
    if (showHeaderMessage && headerMessageFirstPage && pageNum === 1) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const plainMsg = headerMessageFirstPage.replace(/<[^>]*>/g, '').trim().slice(0, HEADER_MSG_MAX_LENGTH);
      const headerMsgMaxWidth = contentWidth - 2;
      const wrapByWidth = (text: string, maxW: number, maxLines: number): string[] => {
        const out: string[] = [];
        doc.setFontSize(7);
        const words = text.split(/\s+/).filter(Boolean);
        let current = '';
        for (const w of words) {
          const next = current ? `${current} ${w}` : w;
          if (doc.getTextWidth(next) <= maxW) {
            current = next;
          } else {
            if (current) {
              out.push(current);
              if (out.length >= maxLines) return out;
            }
            current = w;
          }
        }
        if (current) out.push(current);
        return out;
      };
      const headerMsgLines: string[] = [];
      plainMsg.split(/\n/).forEach((para: string) => {
        wrapByWidth(para.trim(), headerMsgMaxWidth, 3 - headerMsgLines.length).forEach((l) => {
          if (headerMsgLines.length < 3) headerMsgLines.push(l);
        });
      });
      headerMsgLines.slice(0, 3).forEach((line: string) => {
        doc.text(line, margin, billShipStartY);
        billShipStartY += 3.5;
      });
      billShipStartY += 2;
    }
    const showBillShipBlock = showCustomerDetails && (showBillTo || showShipTo);
    if (showBillShipBlock) {
      const tableWidth = pageWidth - margin * 2;
      const lines: string[] = [SAMPLE_CUSTOMER.name || ''];
      (SAMPLE_CUSTOMER.address || '')
        .trim()
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean)
        .forEach((p: string) => lines.push(p));
      if (SAMPLE_CUSTOMER.phone) lines.push(`PHONE: ${SAMPLE_CUSTOMER.phone}`);
      const cellContent = lines.join('\n');
      const headCols: string[] = [];
      const bodyCols: string[] = [];
      if (showBillTo) {
        headCols.push('BILL TO');
        bodyCols.push(cellContent);
      }
      if (showShipTo) {
        headCols.push('SHIP TO');
        bodyCols.push(cellContent);
      }
      const colCount = headCols.length;
      const colWidth = tableWidth / colCount;
      const columnStyles: Record<number, { cellWidth: number }> = {};
      for (let i = 0; i < colCount; i++) columnStyles[i] = { cellWidth: colWidth };
      autoTableFn(doc, {
        startY: billShipStartY,
        head: [headCols],
        body: [bodyCols],
        columnStyles,
        styles: { fontSize: 6, cellPadding: 2 },
        headStyles: {
          fillColor: [70, 70, 90],
          textColor: [255, 255, 255],
          fontStyle: 'normal',
          fontSize: 6,
        },
        margin: { left: margin, right: margin },
        tableWidth,
      });
    }
    const headerBottom = showBillShipBlock
      ? (doc as any).lastAutoTable.finalY
      : billShipStartY + 4;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, headerBottom + 2, pageWidth - margin, headerBottom + 2);
    return headerBottom + 6;
  };

  const addInvoiceSummaryHeaderToPage = (doc: jsPDF, pageNum: number, totalPages: number, logoDataUrl: string | null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const colWidth = (pageWidth - margin * 2) / 3;
    const leftX = margin;
    const midX = margin + colWidth;
    const rightX = margin + colWidth * 2;
    const smallLogoW = 12;
    const smallLogoH = 9;
    const summaryStartY = showPageOf ? 8 : 5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (showPageOf) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 5, {
        align: 'right',
      });
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
    }

    const drawSummaryLogo = (x: number) => {
      const logoX = logoPosition === 'left' && x === leftX ? x : x + (colWidth - smallLogoW) / 2;
      if (showLogo && logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, summaryStartY - 1, smallLogoW, smallLogoH);
        } catch {
          doc.text('[Logo]', logoX, summaryStartY + 3);
        }
      }
    };

    const drawSummaryDistributor = (x: number) => {
      if (showDistributorDetails) {
        doc.text(SAMPLE_DISTRIBUTOR.name, x, summaryStartY + 3, { align: 'left' });
      }
    };

    const drawSummaryCustomer = (x: number) => {
      const rightEdge = x + colWidth;
      let y = summaryStartY + 3;
      if (showCustomerDetails) {
        doc.text(`${SAMPLE_CUSTOMER.number}, ${SAMPLE_CUSTOMER.name}`, rightEdge, y, { align: 'right' });
        y += 5;
      }
      if (showDocNumber) {
        doc.text(`Invoice: ${SAMPLE_DOC_NUMBER}`, rightEdge, y, { align: 'right' });
      }
    };

    const summaryPos = logoPosition === 'right' ? 'left' : logoPosition;
    if (summaryPos === 'center') {
      drawSummaryDistributor(leftX);
      drawSummaryLogo(midX);
      drawSummaryCustomer(rightX);
    } else {
      drawSummaryLogo(leftX);
      drawSummaryDistributor(midX);
      drawSummaryCustomer(rightX);
    }

    const lineY = summaryStartY + smallLogoH + 4;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, lineY, pageWidth - margin, lineY);
    return lineY + 6;
  };

  const addInvoiceFooterToPage = (
    doc: jsPDF,
    logoDataUrl: string | null,
    isLastPage: boolean,
    _categoryTableBottomY?: number
  ) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    // Footer at bottom: footer block and Woopsa line always at page bottom (match invoicePdfGenerator).
    const woopsaY = pageHeight - WOOPSA_LINE_BOTTOM_MM;
    const gapFooterToWoopsaMM = 1;
    const footerBlockMaxTop = woopsaY - gapFooterToWoopsaMM - LAST_PAGE_FOOTER_BLOCK_MM;
    const footerBlockTop = footerBlockMaxTop;
    if (isLastPage) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(margin, footerBlockTop - 2, pageWidth - margin, footerBlockTop - 2);
    }
    if (isLastPage) {
      const contentWidth = pageWidth - margin * 2;
      const summaryWidth = contentWidth * 0.25;
      const messageWidth = contentWidth * 0.75;
      const messageLeft = footerLayout === 'messageLeft';
      const summaryX = messageLeft ? margin + messageWidth + 4 : margin + 2;
      const summaryAlign = messageLeft ? 'right' : 'left';
      const summaryTextX = messageLeft ? pageWidth - margin : summaryX;
      const messageX = messageLeft ? margin : margin + summaryWidth + 4;
      const footerBlockHeight = Math.min(LAST_PAGE_FOOTER_BLOCK_MM, Math.max(0, woopsaY - gapFooterToWoopsaMM - footerBlockTop));
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, footerBlockTop, contentWidth, footerBlockHeight, 'F');
      let summaryY = footerBlockTop + 5;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const sampleNetInvoice = 52.28;
      const sampleDeliveryCharge = 5.0;
      const sampleDeposit = 2.0;
      const sampleInvoiceTotal = sampleNetInvoice + sampleDeliveryCharge + sampleDeposit;
      const sampleLastBalance = 10;
      const sampleTotalDue = sampleInvoiceTotal - sampleLastBalance;
      if (showSubTotal) {
        doc.text(`Net Invoice: ${formatCurrency(sampleNetInvoice)}`, summaryTextX, summaryY, { align: summaryAlign });
        summaryY += 4;
      }
      if (showDeliveryCharge) {
        doc.text(`Delivery Charge: ${formatCurrency(sampleDeliveryCharge)}`, summaryTextX, summaryY, { align: summaryAlign });
        summaryY += 4;
      }
      if (showDeposit) {
        doc.text(`Deposit: ${formatCurrency(sampleDeposit)}`, summaryTextX, summaryY, { align: summaryAlign });
        summaryY += 4;
      }
      doc.text(`Invoice Total: ${formatCurrency(sampleInvoiceTotal)}`, summaryTextX, summaryY, { align: summaryAlign });
      summaryY += 4;
      if (showLastBalance) {
        doc.text(`Last Balance: ${formatCurrency(sampleLastBalance)}`, summaryTextX, summaryY, { align: summaryAlign });
        summaryY += 4;
      }
      if (showTotalAmountDue) {
        doc.text(`Total Due: ${formatCurrency(sampleTotalDue)}`, summaryTextX, summaryY, { align: summaryAlign });
      }
      if (showFooterMessage && footerMessageLastPage) {
        const plainMsg = footerMessageLastPage.replace(/<[^>]*>/g, '').trim().slice(0, FOOTER_MSG_MAX_LENGTH);
        const msgLines = wrapFooterMessage(doc, plainMsg, messageWidth - 2, 7);
        const messageAlign = messageLeft ? 'left' : 'right';
        const messageTextX = messageLeft ? messageX : pageWidth - margin;
        let msgY = footerBlockTop + 4;
        msgLines.forEach((line: string) => {
          doc.text(line, messageTextX, msgY, { align: messageAlign as 'left' | 'right' });
          msgY += 3.5;
        });
      }
    }
    // Bottom line: left = hardcoded message, right = "Report generated by Woopsa" + logo
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const leftMsg = 'This is a computer-generated invoice.';
    doc.text(leftMsg, margin, woopsaY);
    if (showReportGeneratedByWoopsa) {
      doc.setTextColor(120, 120, 120);
      const text = 'Report generated by Woopsa';
      const logoW = 4;
      const logoH = 3.5;
      const rightX = pageWidth - margin;
      const textEndX = rightX - logoW - 2;
      doc.text(text, textEndX, woopsaY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', rightX - logoW, woopsaY - logoH, logoW, logoH);
        } catch {
          // ignore
        }
      }
    }
  };

  const descriptionSortOrder = (a: string, b: string): number => {
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
  };

  const getCategorySummary = (items: typeof SAMPLE_INVOICE_ITEMS): Array<{ category: string; qty: number; extended: number }> => {
    const map: Record<string, { qty: number; extended: number }> = {};
    items.forEach((item) => {
      const cat = item.salesCategory || 'Other';
      if (!map[cat]) map[cat] = { qty: 0, extended: 0 };
      map[cat].qty += Number(item.shippedQty) || Number(item.orderQty) || 0;
      map[cat].extended += Number(item.totalPrice) || 0;
    });
    return Object.keys(map)
      .sort()
      .map((category) => ({ category, qty: map[category].qty, extended: map[category].extended }));
  };

  const buildGroupSubtotalRow = (
    keys: string[],
    groupLabel: string,
    items: typeof SAMPLE_INVOICE_ITEMS
  ): string[] => {
    const orderQtySum = items.reduce((s, i) => s + (Number(i.orderQty) || 0), 0);
    const shippedQtySum = items.reduce((s, i) => s + (Number(i.shippedQty) || 0), 0);
    const totalPriceSum = items.reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
    return keys.map((key) => {
      if (key === 'description') return groupLabel;
      if (key === 'orderQty') return String(Math.round(orderQtySum));
      if (key === 'shippedQty') return String(Math.round(shippedQtySum));
      if (key === 'totalPrice') return totalPriceSum.toFixed(2);
      if (key === 'pack' || key === 'size' || key === 'deposit' || key === 'ebt') return '';
      return '';
    });
  };

  const groupInvoiceItems = (items: typeof SAMPLE_INVOICE_ITEMS): Array<{ key: string; label?: string; items: typeof SAMPLE_INVOICE_ITEMS }> => {
    if (!groupBy) return [{ key: 'all', items: [...items].sort((a, b) => a.sortNumber - b.sortNumber) }];
    if (groupBy === 'sequence') {
      const map: Record<string, typeof SAMPLE_INVOICE_ITEMS> = {};
      items.forEach((item) => {
        const k = String(item.sortNumber);
        if (!map[k]) map[k] = [];
        map[k].push(item);
      });
      return Object.keys(map)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => ({ key, items: map[key] }));
    }
    if (groupBy === 'alphabet') {
      const sorted = [...items].sort((a, b) =>
        descriptionSortOrder((a.description || '').trim(), (b.description || '').trim())
      );
      return [{ key: 'all', items: sorted }];
    }
    if (groupBy === 'alphabetSalesCategory') {
      const byCat: Record<string, typeof SAMPLE_INVOICE_ITEMS> = {};
      items.forEach((item) => {
        const cat = item.salesCategory || 'Other';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(item);
      });
      const result: Array<{ key: string; label?: string; items: typeof SAMPLE_INVOICE_ITEMS }> = [];
      Object.keys(byCat)
        .sort()
        .forEach((cat) => {
          const list = byCat[cat].sort((a, b) =>
            descriptionSortOrder((a.description || '').trim(), (b.description || '').trim())
          );
          if (showGroupHeader) result.push({ key: cat, label: cat, items: list });
          else result.push({ key: cat, items: list });
        });
      return result;
    }
    return [{ key: 'all', items: [...items].sort((a, b) => a.sortNumber - b.sortNumber) }];
  };

  const generatePDF = async () => {
    setGeneratingPdf(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const selectedKeys = INVOICE_COLUMN_FIELDS.filter((f) => selectedColumns[f.key]).map((f) => f.key);
      const upcColIndex = selectedKeys.indexOf('upc');
      const showUpcAsBarcode = upcOption.startsWith('barcode');
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const headerHeight = addInvoiceHeaderToPage(doc, 1, 1, logoDataUrl);
      const tableMarginTopNewPages =
        headerOnPages === 'all'
          ? headerHeight
          : headerOnPages === 'firstPlusSummary'
            ? SUMMARY_HEADER_HEIGHT_MM
            : margin;
      let yPos = headerHeight + 2;
      const grouped = groupInvoiceItems(SAMPLE_INVOICE_ITEMS);
      const headerLabels = selectedKeys.map((k) => INVOICE_COLUMN_FIELDS.find((f) => f.key === k)?.label || k);
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
      const descriptionColIndex = selectedKeys.indexOf('description');
      const columnStyles: Record<number, { cellWidth: number }> = {};
      if (descriptionColIndex >= 0) {
        columnStyles[descriptionColIndex] = { cellWidth: DESCRIPTION_COLUMN_WIDTH_MM };
      }
      const itemsTableWidth = pageWidth - margin * 2;

      const estimateTotalPages = (): number => {
        let pages = 1;
        let y = headerHeight + 2;
        const minYLast = pageHeight - TABLE_BOTTOM_MARGIN_MM;
        const hasGroupHeader =
          (groupBy === 'alphabetSalesCategory' && showGroupHeader) || (groupBy === 'sequence' && showGroupHeader);
        const showGroupSubtotal = groupBy === 'alphabetSalesCategory' || groupBy === 'sequence';
        grouped.forEach((group, groupIdx) => {
          if (groupIdx > 0) y += 4;
          if (hasGroupHeader) {
            if (y + GROUP_HEADER_EST_MM > minYLast) {
              pages += 1;
              y = tableMarginTopNewPages + 2;
            }
            y += GROUP_HEADER_EST_MM;
          }
          const rowsH = group.items.length * ROW_HEIGHT_EST_MM;
          if (y + rowsH > minYLast) {
            let remaining = rowsH;
            while (remaining > 0) {
              const space = minYLast - y;
              if (space <= 0) {
                pages += 1;
                y = tableMarginTopNewPages + 2;
                continue;
              }
              const rowsFit = Math.floor(space / ROW_HEIGHT_EST_MM);
              remaining -= rowsFit * ROW_HEIGHT_EST_MM;
              if (remaining > 0) {
                pages += 1;
                y = tableMarginTopNewPages + 2;
              } else {
                y += rowsFit * ROW_HEIGHT_EST_MM;
              }
            }
          } else {
            y += rowsH;
          }
          if (showGroupSubtotal) {
            if (y + SUBTOTAL_ROW_EST_MM > minYLast) {
              pages += 1;
              y = tableMarginTopNewPages + 2;
            }
            y += SUBTOTAL_ROW_EST_MM + 4;
          } else {
            y += 4;
          }
        });
        return pages;
      };

      const totalPagesEstimate = estimateTotalPages();
      const getMinYBeforeFooter = (): number => {
        const currentPage = doc.getNumberOfPages();
        const marginBottom =
          currentPage === totalPagesEstimate ? TABLE_BOTTOM_MARGIN_MM : NON_LAST_PAGE_BOTTOM_MM;
        return pageHeight - marginBottom;
      };

      grouped.forEach((group, groupIdx) => {
        if (groupIdx > 0) yPos += 4;
        let minYBeforeFooter = getMinYBeforeFooter();
        if (groupBy === 'alphabetSalesCategory' && showGroupHeader && group.label != null) {
          if (yPos > minYBeforeFooter) {
            doc.addPage('a4', 'landscape');
            const currentP = doc.getNumberOfPages();
            if (headerOnPages === 'all') {
              yPos = addInvoiceHeaderToPage(doc, currentP, totalPagesEstimate, logoDataUrl) + 2;
            } else if (headerOnPages === 'firstPlusSummary') {
              yPos = addInvoiceSummaryHeaderToPage(doc, currentP, totalPagesEstimate, logoDataUrl) + 2;
            } else {
              yPos = tableMarginTopNewPages + 2;
            }
            minYBeforeFooter = getMinYBeforeFooter();
          }
          doc.setFillColor(240, 245, 250);
          doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 6, 1, 1, 'FD');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Sales Category: ${group.label}`, margin + 3, yPos + 1);
          yPos += 8;
        }
        if (groupBy === 'sequence' && showGroupHeader) {
          minYBeforeFooter = getMinYBeforeFooter();
          if (yPos > minYBeforeFooter) {
            doc.addPage('a4', 'landscape');
            const currentP = doc.getNumberOfPages();
            if (headerOnPages === 'all') {
              yPos = addInvoiceHeaderToPage(doc, currentP, totalPagesEstimate, logoDataUrl) + 2;
            } else if (headerOnPages === 'firstPlusSummary') {
              yPos = addInvoiceSummaryHeaderToPage(doc, currentP, totalPagesEstimate, logoDataUrl) + 2;
            } else {
              yPos = tableMarginTopNewPages + 2;
            }
            minYBeforeFooter = getMinYBeforeFooter();
          }
          doc.setFillColor(240, 245, 250);
          doc.roundedRect(margin, yPos - 3, pageWidth - margin * 2, 6, 1, 1, 'FD');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Sequence: ${group.key}`, margin + 3, yPos + 1);
          yPos += 8;
        }
        minYBeforeFooter = getMinYBeforeFooter();
        if (yPos > minYBeforeFooter) {
          doc.addPage('a4', 'landscape');
          const currentP = doc.getNumberOfPages();
          if (headerOnPages === 'all') {
            yPos = addInvoiceHeaderToPage(doc, currentP, totalPagesEstimate, logoDataUrl) + 2;
          } else if (headerOnPages === 'firstPlusSummary') {
            yPos = addInvoiceSummaryHeaderToPage(doc, currentP, totalPagesEstimate, logoDataUrl) + 2;
          } else {
            yPos = tableMarginTopNewPages + 2;
          }
          minYBeforeFooter = getMinYBeforeFooter();
        }
        const marginBottomThisPage =
          doc.getNumberOfPages() === totalPagesEstimate ? TABLE_BOTTOM_MARGIN_MM : NON_LAST_PAGE_BOTTOM_MM;
        const itemRows = group.items.map((item: (typeof SAMPLE_INVOICE_ITEMS)[0]) =>
          selectedKeys.map((key) => {
            if (key === 'ebt') return item.ebt ? 'E' : '';
            if (key === 'upc' && showUpcAsBarcode) return ''; // drawn in didDrawCell
            const v = (item as Record<string, unknown>)[key];
            return v !== null && v !== undefined ? String(v) : '';
          })
        );
        const body: string[][] = [...itemRows];
        if ((groupBy === 'alphabetSalesCategory' || groupBy === 'sequence') && group.items.length > 0) {
          const groupLabel = groupBy === 'alphabetSalesCategory' ? (group.label ?? group.key) : `Sequence: ${group.key}`;
          body.push(buildGroupSubtotalRow(selectedKeys, groupLabel, group.items));
        }
        const currentGroupItems = group.items;
        const subtotalRowIndex = body.length - 1;
        const hasSubtotalRow = (groupBy === 'alphabetSalesCategory' || groupBy === 'sequence') && body.length > group.items.length;
        autoTableFn(doc, {
          head: [headerLabels],
          body,
          startY: yPos,
          tableWidth: itemsTableWidth,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [240, 240, 240], fontSize: 7, textColor: [0, 0, 0], fontStyle: 'normal' },
          columnStyles: Object.keys(columnStyles).length > 0 ? columnStyles : undefined,
          rowStyles: hasSubtotalRow ? { [subtotalRowIndex]: { fillColor: [220, 220, 220] } } : undefined,
          margin: {
            left: margin,
            right: margin,
            top: tableMarginTopNewPages,
            bottom: marginBottomThisPage,
          },
          didDrawCell: (data: { section: string; row: { index: number }; column: { index: number }; cell: { x: number; y: number; width: number; height: number } }) => {
            if (data.section === 'body' && data.row.index < currentGroupItems.length && upcColIndex >= 0 && data.column.index === upcColIndex && showUpcAsBarcode) {
              const item = currentGroupItems[data.row.index];
              const upc = item?.upc;
              if (upc) {
                const barcodeDataUrl = generateBarcodeDataUrl(upc);
                if (barcodeDataUrl) {
                  try {
                    const w = Math.min(data.cell.width - 1, 38);
                    const h = Math.min(data.cell.height - 1, 18);
                    doc.addImage(barcodeDataUrl, 'PNG', data.cell.x + 0.5, data.cell.y + 0.5, w, h);
                  } catch {
                    doc.setFontSize(6);
                    doc.text(upc, data.cell.x + 1, data.cell.y + data.cell.height / 2 + 1);
                  }
                }
              }
            }
          },
        });
        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
      });

      let categoryTableBottomY: number | undefined;
      const pagesBeforeCategory = doc.getNumberOfPages();
      if (pagesBeforeCategory > 0) {
        doc.setPage(pagesBeforeCategory);
        const lastTableY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos;
        const categorySummary = getCategorySummary(SAMPLE_INVOICE_ITEMS);
        const totalQty = categorySummary.reduce((s, c) => s + c.qty, 0);
        const totalExtended = categorySummary.reduce((s, c) => s + c.extended, 0);
        if (categorySummary.length > 0) {
          const footerZoneTopY = pageHeight - WOOPSA_LINE_BOTTOM_MM - 1 - LAST_PAGE_FOOTER_BLOCK_MM - GAP_CATEGORY_TO_FOOTER_MM;
          const categoryRows = categorySummary.length + 1;
          const estimatedCategoryTableHeight = 6 + categoryRows * CATEGORY_TABLE_ROW_HEIGHT_MM;
          const categoryStartY = lastTableY + 6;
          const wouldOverlapFooter = categoryStartY + estimatedCategoryTableHeight > footerZoneTopY;

          let startY: number;
          if (wouldOverlapFooter) {
            doc.addPage('a4', 'landscape');
            const newPageNum = doc.getNumberOfPages();
            if (headerOnPages === 'all') {
              startY = addInvoiceHeaderToPage(doc, newPageNum, newPageNum, logoDataUrl) + 2;
            } else if (headerOnPages === 'firstPlusSummary') {
              startY = addInvoiceSummaryHeaderToPage(doc, newPageNum, newPageNum, logoDataUrl) + 2;
            } else {
              startY = tableMarginTopNewPages + 2;
            }
          } else {
            startY = categoryStartY;
          }

          const categoryTableWidth = Math.min(itemsTableWidth, 120);
          const catCol1 = categoryTableWidth * 0.6;
          const catCol2 = categoryTableWidth * 0.2;
          const catCol3 = categoryTableWidth * 0.2;
          const categoryHead = [['QTY CATEGORY', 'QTY', 'EXTEN']];
          const categoryBody = categorySummary.map(({ category, qty, extended }) => [
            category,
            qty.toFixed(2),
            formatCurrency(extended),
          ]);
          categoryBody.push(['TOTAL', totalQty.toFixed(2), formatCurrency(totalExtended)]);
          autoTableFn(doc, {
            startY,
            head: categoryHead,
            body: categoryBody,
            columnStyles: { 0: { cellWidth: catCol1 }, 1: { cellWidth: catCol2 }, 2: { cellWidth: catCol3 } },
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [220, 220, 220], fontSize: 7, textColor: [0, 0, 0], fontStyle: 'normal' },
            margin: { left: margin, right: margin },
            tableWidth: categoryTableWidth,
          });
          categoryTableBottomY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        }
      }
      // Use page count after category table (it may have added a page if table didn't fit)
      const totalPages = doc.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addInvoiceFooterToPage(doc, logoDataUrl, i === totalPages, i === totalPages ? categoryTableBottomY : undefined);
        if (headerOnPages === 'first' && i > 1) {
          // no header on 2nd+ pages
        } else if (headerOnPages === 'firstPlusSummary' && i > 1) {
          addInvoiceSummaryHeaderToPage(doc, i, totalPages, logoDataUrl);
        } else {
          addInvoiceHeaderToPage(doc, i, totalPages, logoDataUrl);
        }
      }
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`invoice-template-preview-${timestamp}.pdf`);
      setShowPreview(true);
      toast.success('PDF downloaded');
      setTimeout(() => setShowPreview(false), 3000);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (view === 'edit') {
      setCustomerListLoading(true);
      getCustomerList()
        .then((res: unknown) => {
          const data = (res as { data?: { data?: { C_Number: number; C_Name: string }[] } })?.data?.data ?? [];
          setCustomerList(Array.isArray(data) ? data : []);
        })
        .catch(() => setCustomerList([]))
        .finally(() => setCustomerListLoading(false));
    }
  }, [view]);

  const resetForm = () => {
    const def = defaultTemplate();
    setName(def.name);
    setGroupBy(def.groupBy);
    setShowGroupHeader(def.showGroupHeader);
    setSelectedColumns({ ...def.selectedColumns });
    setUpcOption(def.upcOption);
    setShowDistributorDetails(def.showDistributorDetails);
    setShowCustomerDetails(def.showCustomerDetails);
    setShowBillTo(def.showBillTo);
    setShowShipTo(true); // Ship To compulsory
    setShowDocNumber(def.showDocNumber);
    setShowPageOf(def.showPageOf);
    setShowInvoiceDate(def.showInvoiceDate);
    setShowInvoiceDateWithTime(def.showInvoiceDateWithTime);
    setShowRoute(def.showRoute);
    setShowStop(def.showStop);
    setShowLogo(def.showLogo);
    setLogoPosition(def.logoPosition);
    setShowTerms(def.showTerms);
    setHeaderOnPages(def.headerOnPages);
    setShowHeaderMessage(def.showHeaderMessage);
    setHeaderMessageFirstPage(def.headerMessageFirstPage);
    setSelectedCustomerIds(def.selectedCustomerIds ?? []);
    setFooterLayout(def.footerLayout ?? 'messageLeft');
    setShowFooterMessage(def.showFooterMessage);
    setFooterMessageLastPage(def.footerMessageLastPage);
    setShowSubTotal(def.showSubTotal);
    setShowDeliveryCharge(def.showDeliveryCharge);
    setShowDeposit(def.showDeposit);
    setShowLastBalance(def.showLastBalance);
    setShowTotalAmountDue(def.showTotalAmountDue);
    setShowReportGeneratedByWoopsa(def.showReportGeneratedByWoopsa);
  };

  const handleAdd = () => {
    setEditingId(null);
    resetForm();
    setName('Invoice Template ' + (templates.length + 1));
    setView('edit');
  };

  const handleEdit = async (template: InvoiceTemplate) => {
    const id = template.id;
    setEditingId(id);
    setSaving(true);
    try {
      const templateId = typeof id === 'number' ? id : parseInt(String(id), 10);
      if (Number.isNaN(templateId)) {
        setName(template.name);
        setGroupBy(template.groupBy);
        setShowGroupHeader(template.showGroupHeader);
        setSelectedColumns({ ...template.selectedColumns });
        setUpcOption(template.upcOption);
        setShowDistributorDetails(template.showDistributorDetails);
        setShowCustomerDetails(template.showCustomerDetails);
        setShowBillTo(template.showBillTo);
        setShowShipTo(true); // Ship To compulsory
        setShowDocNumber(template.showDocNumber);
        setShowPageOf(template.showPageOf);
        setShowInvoiceDate(template.showInvoiceDate);
        setShowInvoiceDateWithTime(template.showInvoiceDateWithTime);
        setShowRoute(template.showRoute);
        setShowStop(template.showStop);
        setShowLogo(template.showLogo);
        setLogoPosition(template.logoPosition ?? 'left');
        setShowTerms(template.showTerms);
        setHeaderOnPages(template.headerOnPages ?? 'all');
        setShowHeaderMessage(template.showHeaderMessage ?? false);
        setHeaderMessageFirstPage(template.headerMessageFirstPage || '');
        setSelectedCustomerIds(template.selectedCustomerIds ?? []);
        setFooterLayout(template.footerLayout ?? 'messageLeft');
        setShowFooterMessage(template.showFooterMessage);
        setFooterMessageLastPage(template.footerMessageLastPage || '');
        setShowSubTotal(template.showSubTotal);
        setShowDeliveryCharge(template.showDeliveryCharge);
        setShowDeposit(template.showDeposit);
        setShowLastBalance(template.showLastBalance);
        setShowTotalAmountDue(template.showTotalAmountDue);
        setShowReportGeneratedByWoopsa(template.showReportGeneratedByWoopsa);
        setView('edit');
        return;
      }
      const [templateRes, assignRes] = await Promise.all([
        getInvoiceTemplateById(templateId),
        getCustomerAssignInvoiceTemplates({ templateId, limit: 500, page: 1 }),
      ]);
      const apiTemplate = templateRes?.data;
      const assignments: CustomerAssignInvoiceTemplateApi[] = assignRes?.data?.data ?? [];
      const customerNumbers = assignments.map((a: CustomerAssignInvoiceTemplateApi) => a.customerNumber);
      if (apiTemplate) {
        const local = apiTemplateToLocal(apiTemplate);
        local.selectedCustomerIds = customerNumbers;
        setName(local.name);
        setGroupBy(local.groupBy);
        setShowGroupHeader(local.showGroupHeader);
        setSelectedColumns({ ...local.selectedColumns });
        setUpcOption(local.upcOption);
        setShowDistributorDetails(local.showDistributorDetails);
        setShowCustomerDetails(local.showCustomerDetails);
        setShowBillTo(local.showBillTo);
        setShowShipTo(true); // Ship To compulsory
        setShowDocNumber(local.showDocNumber);
        setShowPageOf(local.showPageOf);
        setShowInvoiceDate(local.showInvoiceDate);
        setShowInvoiceDateWithTime(local.showInvoiceDateWithTime);
        setShowRoute(local.showRoute);
        setShowStop(local.showStop);
        setShowLogo(local.showLogo);
        setLogoPosition(local.logoPosition ?? 'left');
        setShowTerms(local.showTerms);
        setHeaderOnPages(local.headerOnPages ?? 'all');
        setShowHeaderMessage(local.showHeaderMessage ?? false);
        setHeaderMessageFirstPage(local.headerMessageFirstPage || '');
        setSelectedCustomerIds(customerNumbers);
        setFooterLayout(local.footerLayout ?? 'messageLeft');
        setShowFooterMessage(local.showFooterMessage);
        setFooterMessageLastPage(local.footerMessageLastPage || '');
        setShowSubTotal(local.showSubTotal);
        setShowDeliveryCharge(local.showDeliveryCharge);
        setShowDeposit(local.showDeposit);
        setShowLastBalance(local.showLastBalance);
        setShowTotalAmountDue(local.showTotalAmountDue);
        setShowReportGeneratedByWoopsa(local.showReportGeneratedByWoopsa);
      }
      setView('edit');
    } catch (err) {
      console.error('Error loading template for edit:', err);
      toast.error('Failed to load template');
    } finally {
      setSaving(false);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setEditingId(null);
    loadTemplates();
  };

  const handleColumnToggle = (key: string, checked: boolean) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSaveTemplate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Please enter a template name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        groupBy,
        showGroupHeader,
        selectedColumns: { ...selectedColumns },
        upcOption,
        showDistributorDetails,
        showCustomerDetails,
        showBillTo,
        showShipTo: true,
        showDocNumber,
        showPageOf,
        showInvoiceDate,
        showInvoiceDateWithTime,
        showRoute,
        showStop,
        showLogo,
        logoPosition,
        showTerms,
        headerOnPages,
        showHeaderMessage,
        headerMessageFirstPage: headerMessageFirstPage.trim(),
        footerLayout,
        showFooterMessage,
        footerMessageLastPage: footerMessageLastPage.trim(),
        showSubTotal,
        showDeliveryCharge,
        showDeposit,
        showLastBalance,
        showTotalAmountDue,
        showReportGeneratedByWoopsa,
      };
      let templateId: number;
      if (editingId != null && typeof editingId === 'number') {
        await updateInvoiceTemplate(editingId, payload);
        templateId = editingId;
      } else {
        const createRes = await createInvoiceTemplate(payload);
        templateId = createRes?.data?.id ?? 0;
        if (!templateId) {
          toast.error('Failed to create template');
          return;
        }
      }
      const targetCustomerIds = selectedCustomerIds ?? [];
      const assignRes = await getCustomerAssignInvoiceTemplates({ templateId, limit: 500, page: 1 });
      const current: CustomerAssignInvoiceTemplateApi[] = assignRes?.data?.data ?? [];
      const currentNumbers = new Set(current.map((a: CustomerAssignInvoiceTemplateApi) => a.customerNumber));
      const toAdd = targetCustomerIds.filter((c) => !currentNumbers.has(c));
      const toRemove = current.filter((a: CustomerAssignInvoiceTemplateApi) => !targetCustomerIds.includes(a.customerNumber));
      if (toRemove.length > 0) {
        await bulkRemoveCustomerAssignInvoiceTemplates(
          toRemove.map((a) => ({ customerNumber: a.customerNumber, templateId }))
        );
      }
      if (toAdd.length > 0) {
        await bulkAddCustomerAssignInvoiceTemplates(
          toAdd.map((customerNumber) => ({ customerNumber, templateId }))
        );
      }
      toast.success(editingId != null ? 'Invoice template updated' : 'Invoice template saved');
      handleBackToList();
    } catch (error: unknown) {
      console.error('Error saving invoice template:', error);
      const msg = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (template: InvoiceTemplate) => {
    const id = template.id;
    const templateId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (Number.isNaN(templateId)) return;
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteInvoiceTemplate(templateId);
      toast.success('Invoice template deleted');
      loadTemplates();
    } catch (err) {
      console.error('Error deleting invoice template:', err);
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumn<InvoiceTemplate>[] = [
    { id: 'name', label: 'Template Name', minWidth: 200 },
    {
      id: 'updatedAt',
      label: 'Updated',
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'right',
      render: (row) => (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <IconButton size="small" onClick={() => handleEdit(row)} sx={{ color: 'primary.main' }} title="Edit">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteTemplate(row)}
            disabled={deletingId === row.id}
            sx={{ color: 'error.main' }}
            title="Delete"
          >
            {deletingId === row.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
          </IconButton>
        </Box>
      ),
    },
  ];

  if (view === 'list') {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0, pr: 2 }}>
          <CustomButton onClick={handleAdd} fullWidth={false} sx={{ minWidth: 180, height: 30 }} disabled={templatesLoading}>
            Add Invoice Template
          </CustomButton>
        </Box>
        {templatesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
        <CommonTable
          data={templates}
          columns={columns}
          currentPage={1}
          totalPages={1}
          totalItems={templates.length}
          pageSize={10}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          showPageSizeSelector={false}
          showTotalItems={false}
          showPageNumbers={false}
          isPagination={false}
          containerHeight="calc(100vh - 350px)"
          emptyStateComponent={
            <Typography color="text.secondary">No invoice templates. Click &quot;Add Invoice Template&quot; to create one.</Typography>
          }
        />
        )}
      </Box>
    );
  }

  const columnLabels = INVOICE_COLUMN_FIELDS.filter((f) => selectedColumns[f.key]).map((f) => f.label);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, p: 2, pt: 0 }}>
        {showPreview && (
          <Paper
            sx={{
              p: 1.5,
              mb: 1.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              PDF preview generated
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 2 }}
            >
              The PDF has been generated and downloaded. Check your downloads folder.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowPreview(false)}
              sx={{ textTransform: 'none' }}
            >
              Back to configuration
            </Button>
          </Paper>
        )}

        {!showPreview && (
          <>
            {/* Top bar: back + template name (like picklist header area) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                my: 2,
                flexWrap: 'wrap',
              }}
            >
              <IconButton
                onClick={handleBackToList}
                sx={{ color: 'primary.main' }}
                size="medium"
                aria-label="Back"
              >
                <ArrowBack />
              </IconButton>
              <TextField
                size="small"
                label="Template name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Invoice"
                sx={{
                  minWidth: 260,
                  '& .MuiInputBase-root': {
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              />
            </Box>

            {/* Main configuration card - layout similar to PicklistTemplateTab */}
            <Paper
              sx={{
                p: 1.5,
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
                {/* Left column: Group by + UPC */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ mb: 1.5 }}>
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
                      Group By
                    </Typography>
                    <RadioGroup
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as InvoiceGroupBy)}
                    >
                      <FormControlLabel
                        value=""
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: '0.7rem' }}>None</Typography>}
                      />
                      <FormControlLabel
                        value="alphabetSalesCategory"
                        control={<Radio size="small" />}
                        label={
                          <Typography sx={{ fontSize: '0.7rem' }}>
                            Alphabet + Sales Category
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        value="alphabet"
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Alphabet</Typography>}
                      />
                      {/* <FormControlLabel
                        value="sequence"
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: '0.7rem' }}>Sequence</Typography>}
                      /> */}
                    </RadioGroup>
                    {groupBy === 'alphabetSalesCategory' && (
                      <Box sx={{ mt: 0.5 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showGroupHeader}
                              onChange={(e) => setShowGroupHeader(e.target.checked)}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: '0.7rem' }}>
                              Show group header
                            </Typography>
                          }
                        />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
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
                      UPC Option
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={upcOption}
                        onChange={(e) => setUpcOption(e.target.value)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {UPC_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.68rem' }}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {showLogo && (
                    <Box sx={{ mb: 1.5 }}>
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
                        Logo position
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={logoPosition}
                          onChange={(e) => setLogoPosition(e.target.value as LogoPosition)}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          <MenuItem value="left" sx={{ fontSize: '0.68rem' }}>Left (logo left, distributor center)</MenuItem>
                          <MenuItem value="center" sx={{ fontSize: '0.68rem' }}>Beside distributor (logo and distributor together)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                  <Box sx={{ mb: 1.5 }}>
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
                      Header on
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={headerOnPages}
                        onChange={(e) => setHeaderOnPages(e.target.value as HeaderPageOption)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {/* <MenuItem value="all" sx={{ fontSize: '0.68rem' }}>All pages</MenuItem> */}
                        <MenuItem value="first" sx={{ fontSize: '0.68rem' }}>1st page only</MenuItem>
                        <MenuItem value="firstPlusSummary" sx={{ fontSize: '0.68rem' }}>1st page + summary header from 2nd</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
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
                      Customer
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        displayEmpty
                        value={selectedCustomerIds}
                        onChange={(e) => setSelectedCustomerIds((e.target.value as number[]).filter((id): id is number => typeof id === 'number'))}
                        renderValue={(ids) => {
                          if (ids.length === 0) return 'Select customers';
                          return ids
                            .map((id) => customerList.find((c) => c.C_Number === id)?.C_Name ?? id)
                            .join(', ');
                        }}
                        disabled={customerListLoading}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {customerListLoading && (
                          <MenuItem disabled sx={{ fontSize: '0.68rem' }}>Loading...</MenuItem>
                        )}
                        {customerList.map((cust) => (
                          <MenuItem key={cust.C_Number} value={cust.C_Number} sx={{ fontSize: '0.68rem' }}>
                            <Checkbox size="small" checked={selectedCustomerIds.indexOf(cust.C_Number) > -1} />
                            <ListItemText primary={`${cust.C_Name} (${cust.C_Number})`} primaryTypographyProps={{ fontSize: '0.68rem' }} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                {/* Right column: columns + header/footer options */}
                <Grid size={{ xs: 12, md: 9 }}>
                  {/* Columns */}
                  <Typography
                    variant="caption"
                    sx={{
                      mb: 0.5,
                      pl: 0.5,
                      fontWeight: 500,
                      fontSize: '0.68rem',
                      display: 'block',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Columns
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      mb: 0.6,
                      pl: 0.5,
                      fontSize: '0.65rem',
                      display: 'block',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    {columnLabels.length} fields selected
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 'calc(100vh - 260px)',
                      overflowY: 'auto',
                      pr: 0.5,
                    }}
                  >
                    <Grid container spacing={0.4}>
                      {INVOICE_COLUMN_FIELDS.map((field) => (
                        <Grid
                          size={{ xs: 12, sm: 6, md: 6, lg: 4 }}
                          key={field.key}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 0.35,
                              px: 0.5,
                              borderRadius: 0.75,
                              transition: 'all 0.15s ease',
                              backgroundColor: selectedColumns[field.key]
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(25, 118, 210, 0.12)'
                                  : 'rgba(25, 118, 210, 0.06)'
                                : 'transparent',
                            }}
                          >
                            <Switch
                              size="small"
                              checked={selectedColumns[field.key] || false}
                              onChange={(e) =>
                                handleColumnToggle(field.key, e.target.checked)
                              }
                              sx={{ flexShrink: 0 }}
                            />
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: selectedColumns[field.key] ? 500 : 400,
                                color: selectedColumns[field.key]
                                  ? 'primary.main'
                                  : 'text.secondary',
                                flex: 1,
                                ml: 0.5,
                              }}
                            >
                              {field.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* Header options */}
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 0.5,
                        pl: 0.5,
                        fontWeight: 500,
                        fontSize: '0.68rem',
                        display: 'block',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Header
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showDistributorDetails}
                              onChange={(e) => setShowDistributorDetails(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Distributor details</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showCustomerDetails}
                              onChange={(e) => setShowCustomerDetails(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Customer details</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showBillTo}
                              onChange={(e) => setShowBillTo(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Bill To</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showDocNumber}
                              onChange={(e) => setShowDocNumber(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Invoice number</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showPageOf}
                              onChange={(e) => setShowPageOf(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Page of</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showInvoiceDate}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setShowInvoiceDate(on);
                                if (on) setShowInvoiceDateWithTime(false);
                              }}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Invoice date</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showInvoiceDateWithTime}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setShowInvoiceDateWithTime(on);
                                if (on) setShowInvoiceDate(false);
                              }}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Invoice date with time</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showRoute}
                              onChange={(e) => setShowRoute(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Route</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showStop}
                              onChange={(e) => setShowStop(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Stop</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showLogo}
                              onChange={(e) => setShowLogo(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Logo</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showTerms}
                              onChange={(e) => setShowTerms(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Terms</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showHeaderMessage}
                              onChange={(e) => setShowHeaderMessage(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Header message (1st page)</Typography>}
                        />
                      </Grid>
                      {showHeaderMessage && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextInput
                            value={headerMessageFirstPage}
                            onChange={(e) => setHeaderMessageFirstPage(e.target.value)}
                            placeholder="Optional message (max 750 characters)"
                            multiline
                            rows={6}
                            inputProps={{ maxLength: HEADER_MSG_MAX_LENGTH }}
                            sx={{ mb: 1 }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Footer options */}
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 0.5,
                        pl: 0.5,
                        fontWeight: 500,
                        fontSize: '0.68rem',
                        display: 'block',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Footer
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth size="small">
                          <Typography sx={{ fontSize: '0.65rem', mb: 0.5, color: 'text.secondary' }}>Footer layout</Typography>
                          <Select
                            size="small"
                            value={footerLayout}
                            onChange={(e) => setFooterLayout(e.target.value as FooterLayoutOption)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            <MenuItem value="messageLeft" sx={{ fontSize: '0.68rem' }}>Message left, totals right</MenuItem>
                            <MenuItem value="messageRight" sx={{ fontSize: '0.68rem' }}>Message right, totals left</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showFooterMessage}
                              onChange={(e) => setShowFooterMessage(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Footer message</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showSubTotal}
                              onChange={(e) => setShowSubTotal(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Sub total</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showDeliveryCharge}
                              onChange={(e) => setShowDeliveryCharge(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Delivery charge</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showDeposit}
                              onChange={(e) => setShowDeposit(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Deposit (CRV)</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showLastBalance}
                              onChange={(e) => setShowLastBalance(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Last balance</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={showTotalAmountDue}
                              onChange={(e) => setShowTotalAmountDue(e.target.checked)}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.7rem' }}>Total amount due</Typography>}
                        />
                      </Grid>
                      {showFooterMessage && (
                        <Grid size={{ xs: 12 }}>
                          <TextInput
                            value={footerMessageLastPage}
                            onChange={(e) => setFooterMessageLastPage(e.target.value)}
                            placeholder="Optional footer text (max 1000 characters)"
                            multiline
                            rows={6}
                            inputProps={{ maxLength: FOOTER_MSG_MAX_LENGTH }}
                            sx={{ mb: 1 }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Box>

      {/* Sticky footer: Cancel | Generate PDF Preview | Save */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Button variant="text" onClick={handleBackToList} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={generatingPdf ? <CircularProgress size={16} /> : <PictureAsPdf />} onClick={generatePDF} disabled={generatingPdf} sx={{ textTransform: 'none' }}>{generatingPdf ? 'Generating...' : 'Generate PDF Preview'}</Button>
          <Button variant="contained" onClick={handleSaveTemplate} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ textTransform: 'none', minWidth: 160, color: 'white' }}>{saving ? 'Saving...' : 'Save template'}</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceTemplateTab;
