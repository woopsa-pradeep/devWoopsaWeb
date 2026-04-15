import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Visibility as ViewIcon, Download as DownloadIcon } from '@mui/icons-material';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import CommonModal from '../../../component/atoms/CommonModal';
import CustomButton from '../../../component/atoms/CustomButton';
import CustomDatePicker from '../../../component/atoms/CustomDatePicker';
import { showErrorToast, showSuccessToast } from '../../../utils/toastUtils';
import {
  getEpickReports,
  getEpickUsers,
  getCompleteOrderDetails,
  getUserReportWithDateRange,
  getOrderDetailsByOrderNumber,
} from '../../../redux/apis/distrubutor/epickApis';
import moment from 'moment';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require('jspdf-autotable');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from '../../../assets/Rabbit.svg';

interface EpickUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  order_type: string;
  shortby: string;
  userNumber: number;
  isActive: boolean;
  status: boolean;
}

interface Picker {
  id: number;
  userNumber: number;
  name: string;
  email: string;
}

interface Customer {
  customerNumber: number;
  customerName: string;
  route: number;
  stop: number;
}

interface EpickReport {
  orderNumber: number;
  customerNumber: number;
  pickerUserNumber?: number;
  pickerId?: number;
  picker: Picker;
  customer: Customer;
  startedAt: string;
  completedAt: string;
  pickerName?: string;
  pickerEmail?: string;
  checkerSummary?: {
    totalCheckerActions?: number;
    totalQtyDeltaByChecker?: number;
    totalBundlesDeltaByChecker?: number;
    photoActionsCount?: number;
    lastCheckerActionAt?: string;
    checkerUserIds?: number[];
  };
  checkerActionLogs?: CheckerActionLog[];
}

interface OverrideRequest {
  requestId: number;
  orderNumber: number;
  itemNumber: number;
  itemDescription: string;
  pickerId?: number;
  pickerUserNumber: number;
  userName: string;
  userEmail: string;
  note: string | null;
  status?: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  qty?: number;
}

interface OrderItem {
  lineNumber: number;
  itemNumber: number;
  itemDescription: string;
  quantityOrdered: number;
  quantityShipped: number;
  pack: number;
  caseCount: number;
  uom: string;
  section: string | null;
  location: string | null;
  price: number;
  netCost: number;
  invoiceCost: number;
  confirmed: boolean;
  upcList: Array<{
    UPC_Number: string;
  }>;
  masterImage: string;
  distributorImage: string | null;
  isDistributorImageShow: boolean;
  pickerId?: number;
  pickerUserNumber?: number | string;
}

interface PickerInfo {
  pickerId: number;
  pickerName: string;
  pickerEmail?: string;
  pickerUserNumber?: number | string;
  startedAt?: string;
  completedAt?: string;
  totalLines?: number;
  totalQty?: number;
  scannedLines?: number;
  scannedQty?: number;
  orderItems?: OrderItem[];
  overrideRequests?: OverrideRequest[];
}

interface CompleteOrderDetails {
  orderInfo: {
    orderNumber: number;
    orderDate: string;
    invoiceNumber: number;
    bundles: number;
    totes: number;
    pickerId: number | null;
    pickerName: string | null;
    confirmed: boolean;
    invoiceTotal: number | null;
    customer: {
      customerNumber: number;
      customerName: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      route: number | null;
      stop: number | null;
    };
    startedAt: string;
    completedAt: string;
    allPicker?: PickerInfo[];
    allPickers?: PickerInfo[];
  };
  orderItems: OrderItem[];
  overrideRequests: OverrideRequest[];
  summary: {
    totalItemsOrdered: number;
    totalItemsShipped: number;
    totalItems: number;
  };
  salesCategorySummary?: Array<{
    salesCategory: number;
    salesCategoryName: string;
    totalItems: number;
    totalQty: number;
    scannedQty: number;
  }>;
  checkerSummary?: {
    totalQtyDeltaByChecker?: number;
    totalBundlesDeltaByChecker?: number;
    photoActionsCount?: number;
    lastCheckerActionAt?: string;
    checkerUserIds?: number[];
  };
  checkerActionLogs?: CheckerActionLog[];
}

interface CheckerActionLog {
  id: number;
  checkerUserId: number;
  actionType: string;
  itemNumber: number | null;
  lineNumber: number | null;
  boxId: number | null;
  deltaQty: number;
  deltaBundles: number;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}


const EpickReportsTab: React.FC = () => {
  const [reports, setReports] = useState<EpickReport[]>([]);
  const [users, setUsers] = useState<EpickUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // View details modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<CompleteOrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Single order PDF download state
  const [downloadingOrder, setDownloadingOrder] = useState<number | null>(null);

  // Download report modal states
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadUserId, setDownloadUserId] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState<string>('none');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Summary report modal states
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryUserId, setSummaryUserId] = useState<number | ''>('');
  const [summaryDateFilter, setSummaryDateFilter] = useState<string>('none');
  const [summaryStartDate, setSummaryStartDate] = useState<Dayjs | null>(null);
  const [summaryEndDate, setSummaryEndDate] = useState<Dayjs | null>(null);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  // Request report modal states
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestUserId, setRequestUserId] = useState<number | ''>('');
  const [requestDateFilter, setRequestDateFilter] = useState<string>('none');
  const [requestStartDate, setRequestStartDate] = useState<Dayjs | null>(null);
  const [requestEndDate, setRequestEndDate] = useState<Dayjs | null>(null);
  const [downloadingRequest, setDownloadingRequest] = useState(false);

  // Fetch epick users for filter dropdown
  const fetchEpickUsers = async () => {
    try {
      const response: any = await getEpickUsers();
      console.log('Epick Users API Response:', response);
      
      let usersData = [];
      if (response?.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response?.users && Array.isArray(response.users)) {
        usersData = response.users;
      } else if (response?.data && Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch epick users:', error);
      showErrorToast('Failed to fetch epick users');
    }
  };

  // Fetch epick reports
  const fetchEpickReports = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; userId?: number } = {
        page: currentPage,
        limit: pageSize,
      };
      
      if (selectedUserId) {
        params.userId = selectedUserId;
      }

      const response: any = await getEpickReports(params);
      console.log('Epick Reports API Response:', response);
      
      let ordersData: any[] = [];
      let total = 0;
      
      if (response?.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data;
          total = response.data.totalCount || 0;
        } else if (Array.isArray(response.data)) {
          ordersData = response.data;
        }
      }
      
      // Transform data to show picker-wise: if order has allPickers, create one row per picker
      const reportsData: EpickReport[] = [];
      
      ordersData.forEach((order: any) => {
        const allPickers = order.allPickers || order.allPicker;
        const customer = order.customer || {};
        
        if (allPickers && Array.isArray(allPickers) && allPickers.length > 0) {
          // Create one row per picker
          allPickers.forEach((picker: any) => {
            reportsData.push({
              orderNumber: order.orderNumber,
              customerNumber: customer.customerNumber || customer.C_Number || 0,
              pickerId: picker.pickerId,
              pickerUserNumber: picker.pickerUserNumber,
              pickerName: picker.pickerName,
              pickerEmail: picker.pickerEmail,
              picker: {
                id: picker.pickerId,
                userNumber: picker.pickerUserNumber,
                name: picker.pickerName || '',
                email: picker.pickerEmail || '',
              },
              customer: {
                customerNumber: customer.customerNumber || customer.C_Number || 0,
                customerName: customer.customerName || customer.C_Name || 'N/A',
                route: customer.route || customer.Routes?.[0]?.Route_Number || null,
                stop: customer.stop || customer.Routes?.[0]?.Stop_Number || null,
              },
              startedAt: picker.startedAt || order.startedAt || '',
              completedAt: picker.completedAt || order.completedAt || '',
              checkerSummary: order.checkerSummary,
              checkerActionLogs: order.checkerActionLogs || [],
            });
          });
        } else {
          // Single picker or no picker info - use order level data
          const picker = Array.isArray(order.picker) ? order.picker[0] : order.picker || {};
          reportsData.push({
            orderNumber: order.orderNumber,
            customerNumber: customer.customerNumber || customer.C_Number || 0,
            pickerId: picker.id || order.pickerId,
            pickerUserNumber: picker.userNumber || order.pickerUserNumber,
            pickerName: picker.name || order.pickerName,
            pickerEmail: picker.email || order.pickerEmail,
            picker: {
              id: picker.id || order.pickerId || 0,
              userNumber: picker.userNumber || order.pickerUserNumber || 0,
              name: picker.name || order.pickerName || 'N/A',
              email: picker.email || order.pickerEmail || '',
            },
            customer: {
              customerNumber: customer.customerNumber || customer.C_Number || 0,
              customerName: customer.customerName || customer.C_Name || 'N/A',
              route: customer.route || customer.Routes?.[0]?.Route_Number || null,
              stop: customer.stop || customer.Routes?.[0]?.Stop_Number || null,
            },
            startedAt: order.startedAt || '',
            completedAt: order.completedAt || '',
            checkerSummary: order.checkerSummary,
            checkerActionLogs: order.checkerActionLogs || [],
          });
        }
      });
      
      setReports(reportsData);
      setTotalCount(total);
    } catch (error) {
      console.error('Failed to fetch epick reports:', error);
      showErrorToast('Failed to fetch epick reports');
    } finally {
      setLoading(false);
    }
  };

  // Handle user filter change
  const handleUserFilterChange = (event: any) => {
    const userId = event.target.value;
    setSelectedUserId(userId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY HH:mm') : 'N/A';
  };

  // Calculate duration
  const calculateDuration = (startedAt: string, completedAt: string): string => {
    if (!startedAt || !completedAt) return 'N/A';
    const start = moment(startedAt);
    const end = moment(completedAt);
    if (!start.isValid() || !end.isValid()) return 'N/A';
    
    const duration = moment.duration(end.diff(start));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Fetch order details
  const fetchOrderDetails = async (orderNumber: number) => {
    setLoadingDetails(true);
    try {
      const response: any = await getCompleteOrderDetails(orderNumber);
      console.log('Order Details API Response:', response);
      
      if (response?.data) {
        setOrderDetails(response.data);
        setViewModalOpen(true);
      } else {
        showErrorToast('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      showErrorToast('Failed to fetch order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle view icon click
  const handleViewClick = (orderNumber: number) => {
    fetchOrderDetails(orderNumber);
  };

  // Generate PDF for a single order
  const handleDownloadSingleOrder = async (orderNumber: number) => {
    setDownloadingOrder(orderNumber);
    try {
      const response: any = await getOrderDetailsByOrderNumber(orderNumber);
      
      if (!response?.data) {
        showErrorToast('No data available to download');
        return;
      }

      const order = response.data;
      const distributor = order.distributor || {};
      const logoUrl = order.logo;
      
      // Get allPickers once at the start to avoid redeclaration
      // Check both orderInfo.allPickers and top-level allPickers
      const allPickers = order.orderInfo?.allPickers || order.orderInfo?.allPicker || order.allPickers || order.allPicker;
      
      // Get order info - prefer orderInfo structure
      const orderInfo = order.orderInfo || order;

      // Load logos - distributor logo for header, rabbit logo for footer
      const [distributorLogoDataUrl, rabbitLogoDataUrl] = await Promise.all([
        logoUrl ? loadLogoAsDataUrl(logoUrl) : Promise.resolve(null),
        loadLogoAsDataUrl(), // Rabbit logo for footer
      ]);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      // Header Section: Logo (left, if exists) and Distributor Details (right)
      let distributorY = margin;
      let logoY = margin;

      // Add logo on left side - only if distributor logo exists
      if (distributorLogoDataUrl && distributorLogoDataUrl.startsWith('data:')) {
        try {
          const logoWidth = 30;
          const logoHeight = 10;
          const formatMatch = distributorLogoDataUrl.match(/data:image\/(\w+);/);
          const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
          try {
            doc.addImage(distributorLogoDataUrl, format, margin, logoY, logoWidth, logoHeight);
            logoY += logoHeight + 2;
          } catch {
            logoY = margin;
          }
        } catch {
          logoY = margin;
        }
      }

      // Distributor details on right side (always shown)
      const distributorX = pageWidth - margin;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (distributor.D_Name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(distributor.D_Name, distributorX, distributorY, { align: 'right' });
        distributorY += 5;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (distributor.D_Addr1) {
        doc.text(distributor.D_Addr1, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      if (distributor.D_Addr2) {
        doc.text(distributor.D_Addr2, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      const cityStateZip = `${distributor.D_City || ''}${distributor.D_State ? `, ${distributor.D_State}` : ''} ${distributor.D_Zip || ''}`.trim();
      if (cityStateZip) {
        doc.text(cityStateZip, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      
      // Phone - clickable link
      if (distributor.D_Phone) {
        const phoneText = distributor.D_Phone;
        const textWidth = doc.getTextWidth(phoneText);
        doc.setTextColor(0, 102, 204);
        doc.text(phoneText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `tel:${distributor.D_Phone}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }
      
      // Email - clickable link
      if (distributor.D_Email) {
        const emailText = distributor.D_Email;
        const textWidth = doc.getTextWidth(emailText);
        doc.setTextColor(0, 102, 204);
        doc.text(emailText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `mailto:${distributor.D_Email}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }

      yPosition = Math.max(logoY, distributorY) + 8;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Order Header Section: Three-column layout (Left: Order Info, Center: Picking Time, Right: Picker & Customer)
      const orderLeftY = yPosition;
      const orderRightY = yPosition;
      const centerX = pageWidth / 2;

      // Left side: Order details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`Order #${orderInfo.orderNumber || order.orderNumber || ''}`, margin, orderLeftY);
      let leftY = orderLeftY + 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Calculate totals - prefer API summary when available, otherwise fall back
      let totalQty = 0;
      let scannedQty = 0;
      let totalLines = 0;
      let scannedLines = 0;
      let overrideRequestCount = 0;
      
      const orderSummary = (order as any).summary || (orderInfo as any).summary;
      
      if (orderSummary) {
        // Use summary from API response (Epick order details)
        totalQty = orderSummary.totalItemsOrdered ?? 0;
        scannedQty = orderSummary.totalItemsShipped ?? orderSummary.scannedQty ?? 0;
        totalLines = orderSummary.totalLines ?? 0;
        scannedLines = orderSummary.scannedLines ?? 0;
        // Prefer explicit overrideRequests array when present
        const overrideRequests = (order as any).overrideRequests || (orderInfo as any).overrideRequests;
        overrideRequestCount = Array.isArray(overrideRequests)
          ? overrideRequests.length
          : orderSummary.overrideRequestCount ?? 0;
      } else if (allPickers && Array.isArray(allPickers) && allPickers.length > 0) {
        allPickers.forEach((picker: any) => {
          totalQty += picker.totalQty || 0;
          scannedQty += picker.scannedQty || 0;
          totalLines += picker.totalLines || 0;
          scannedLines += picker.scannedLines || 0;
          if (picker.overrideRequests && Array.isArray(picker.overrideRequests)) {
            overrideRequestCount += picker.overrideRequests.length;
          }
        });
      } else {
        // Fallback to order-level data
        totalQty = typeof order.totalQty === 'string' ? parseFloat(order.totalQty) || 0 : (order.totalQty || 0);
        scannedQty = typeof order.scannedQty === 'string' ? parseFloat(order.scannedQty) || 0 : (order.scannedQty || 0);
        totalLines = order.totalLines || 0;
        scannedLines = order.scannedLines || 0;
        overrideRequestCount = order.overrideRequestCount || (order.overrideRequests?.length || 0);
      }
      
      const orderLeftInfo = [
        `Total Qty Ordered: ${totalQty}`,
        `Scanned Qty: ${scannedQty}`,
        `Total Lines: ${totalLines}`,
        `Scanned Lines: ${scannedLines}`,
        `Out of Stock Items: ${order.OutOfStockItem || order.outOfStockItems || 0}`,
        `Override Requests: ${overrideRequestCount}`,
      ];

      orderLeftInfo.forEach((text) => {
        doc.text(text, margin, leftY);
        leftY += 4;
      });

      // Center: Picking Time (only time value, centered)
      // Calculate total picking time from all pickers
      let pickingTime = 'N/A';
      if (allPickers && Array.isArray(allPickers) && allPickers.length > 0) {
        // Calculate total time from all pickers
        let totalSeconds = 0;
        allPickers.forEach((picker: any) => {
          if (picker.startedAt && picker.completedAt) {
            const start = moment(picker.startedAt);
            const end = moment(picker.completedAt);
            if (start.isValid() && end.isValid()) {
              totalSeconds += end.diff(start, 'seconds');
            }
          }
        });
         if (totalSeconds > 0) {
         pickingTime = formatSecondsToTime(totalSeconds);
   }
   } else if (orderInfo.startedAt && orderInfo.completedAt) {
    const start = moment(orderInfo.startedAt);
    const end = moment(orderInfo.completedAt);

    if (start.isValid() && end.isValid()) {
    const totalSeconds = end.diff(start, 'seconds');
    pickingTime = formatSecondsToTime(totalSeconds);
    } else {
    pickingTime = 'N/A';
     }
   } else {
  pickingTime = 'N/A';
}
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(pickingTime, centerX, orderLeftY + 8, { align: 'center' });

      // Right side: Picker(s) and Customer details
      const customer = orderInfo.customer || order.customer || {};
      const customerName = customer.C_Name || customer.customerName || 'N/A';
      const customerNumber = customer.C_Number || customer.customerNumber || 'N/A';
      const routeInfo = customer.Routes?.[0]
        ? `Route: ${customer.Routes[0].Route_Number || ''}, Stop: ${customer.Routes[0].Stop_Number || ''}`
        : (customer.route && customer.stop ? `Route: ${customer.route}, Stop: ${customer.stop}` : '');

      const orderRightX = pageWidth - margin;
      let rightY = orderRightY;
      
      // Handle multiple pickers if allPickers exists, otherwise use single picker
      if (allPickers && Array.isArray(allPickers) && allPickers.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Pickers (${allPickers.length}):`, orderRightX, rightY, { align: 'right' });
        rightY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        allPickers.forEach((picker: any, index: number) => {
          const pickerName = picker.pickerName || 
            (picker.firstName && picker.lastName ? `${picker.firstName} ${picker.lastName}`.trim() : '') ||
            picker.email || 
            'N/A';
          doc.text(`${index + 1}. ${pickerName}`, orderRightX, rightY, { align: 'right' });
          rightY += 4;
          if (picker.pickerUserNumber) {
            doc.text(`   User #${picker.pickerUserNumber}`, orderRightX, rightY, { align: 'right' });
            rightY += 3;
          }
        });
        rightY += 2;
      } else {
        // Single picker (backward compatibility)
        const pickerName = order.picker 
          ? `${order.picker.firstName || ''} ${order.picker.lastName || ''}`.trim() || order.picker.email || 'N/A'
          : 'N/A';
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Picker:', orderRightX, rightY, { align: 'right' });
        rightY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(pickerName, orderRightX, rightY, { align: 'right' });
        rightY += 6;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer:', orderRightX, rightY, { align: 'right' });
      rightY += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(customerName, orderRightX, rightY, { align: 'right' });
      rightY += 4;
      doc.text(`#${customerNumber}`, orderRightX, rightY, { align: 'right' });
      rightY += 4;
      if (routeInfo) {
        doc.text(routeInfo, orderRightX, rightY, { align: 'right' });
      } else {
        doc.text('Route: N/A, Stop: N/A', orderRightX, rightY, { align: 'right' });
      }

      yPosition = Math.max(leftY, rightY) + 8;

      // Checker Action Logs (single order detail report)
      const checkerActionLogs = Array.isArray(order.checkerActionLogs) ? order.checkerActionLogs : [];
      if (checkerActionLogs.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`Checker Action Logs (${checkerActionLogs.length})`, margin, yPosition);
        yPosition += 5;

        const checkerHeaders = ['Checker', 'Type', 'Item #', 'Line #', 'Pre Qty', 'New Qty', 'dBundle'];
        const checkerData: any[][] = checkerActionLogs.map((log: any) => ([
          log.checkerUserId ?? 'N/A',
          log.actionType ? String(log.actionType).replace(/_/g, ' ').toUpperCase() : 'N/A',
          log.itemNumber ?? 'N/A',
          log.lineNumber ?? 'N/A',
          log.meta?.previousQty ?? 'N/A',
          log.meta?.newQty ?? 'N/A',
          log.deltaBundles ?? 0,
        ]));

        const tableWidth = pageWidth - (margin * 2);
        autoTableFn(doc, {
          head: [checkerHeaders],
          body: checkerData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          tableWidth: tableWidth,
          styles: {
            fontSize: 7,
            cellPadding: 1.6,
            lineWidth: 0.1,
            lineColor: [220, 220, 220],
            textColor: [50, 50, 50],
          },
          headStyles: {
            fillColor: [60, 60, 60],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            lineWidth: 0.1,
            fontSize: 7,
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          columnStyles: {
            0: { cellWidth: tableWidth * 0.10, halign: 'center' },
            1: { cellWidth: tableWidth * 0.26, halign: 'left' },
            2: { cellWidth: tableWidth * 0.12, halign: 'center' },
            3: { cellWidth: tableWidth * 0.10, halign: 'center' },
            4: { cellWidth: tableWidth * 0.14, halign: 'center' },
            5: { cellWidth: tableWidth * 0.14, halign: 'center' },
            6: { cellWidth: tableWidth * 0.14, halign: 'center' },
          },
          didDrawPage: (data: any) => {
            addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
      }

      // Process order items for category summary (aggregated across all pickers)
      const categoryGroups: { [key: string]: any[] } = {};

      // Group by Picker if allPickers exists
      if (allPickers && Array.isArray(allPickers) && allPickers.length > 0) {
        // Process each picker
        allPickers.forEach((picker: any, pickerIndex: number) => {
          // Use picker's own orderItems and overrideRequests if available, otherwise filter by pickerId
          const pickerItems = picker.orderItems || order.orderItems?.filter((item: any) => 
            item.pickerId === picker.pickerId
          ) || [];

          // Use picker's overrideRequests if it exists and has items, otherwise filter from order.overrideRequests
          const pickerRequests = (picker.overrideRequests && picker.overrideRequests.length > 0)
            ? picker.overrideRequests
            : order.overrideRequests?.filter((req: any) => {
                // Match by pickerId - this is the primary matching criteria
                if (req.pickerId !== undefined && picker.pickerId !== undefined) {
                  return req.pickerId === picker.pickerId;
                }
                // Fallback to pickerUserNumber matching if pickerId is not available
                return req.pickerUserNumber === picker.pickerUserNumber;
              }) || [];

          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = margin;
          }

          // Picker Header - Clear section heading
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = margin;
          }
          
          // Dark divider before picker section
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(1);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 6;
          
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text(`Picker ${pickerIndex + 1}: ${picker.pickerName || 'N/A'}`, margin, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`ID: ${picker.pickerId} | User #: ${picker.pickerUserNumber || 'N/A'}`, margin, yPosition);
          yPosition += 4;
          if (picker.pickerEmail) {
            doc.text(`Email: ${picker.pickerEmail}`, margin, yPosition);
            yPosition += 4;
          }
          if (picker.startedAt) {
            doc.text(`Started: ${moment(picker.startedAt).format('MM/DD/YYYY HH:mm')}`, margin, yPosition);
            yPosition += 4;
          }
          if (picker.completedAt) {
            doc.text(`Completed: ${moment(picker.completedAt).format('MM/DD/YYYY HH:mm')}`, margin, yPosition);
            yPosition += 4;
          }
          if (picker.totalLines !== undefined || picker.scannedLines !== undefined) {
            doc.text(`Lines: ${picker.scannedLines || 0}/${picker.totalLines || 0} | Qty: ${picker.scannedQty || 0}/${picker.totalQty || 0}`, margin, yPosition);
            yPosition += 4;
          }

          // Divider
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 6;

          // Order Items Table for this picker
          if (pickerItems.length > 0) {
            const orderItemsHeaders = ['Line #', 'Item #', 'Description', 'Qty Ordered', 'Qty Shipped'];
            const orderItemsData: any[][] = [];

            pickerItems.forEach((item: any) => {
              const lineNumber = item.Line_Number || item.lineNumber || '';
              const itemNumber = item.Item_Number || item.itemNumber || '';
              const description = item.inventory?.Description || item.itemDescription || item.ItemDescription || '';
              const qtyOrdered = item.Quantity_Ordered || item.quantityOrdered || 0;
              const qtyShipped = item.Quantity_Shipped || item.quantityShipped || 0;

              orderItemsData.push([
                lineNumber.toString(),
                itemNumber.toString(),
                description,
                qtyOrdered.toString(),
                qtyShipped.toString(),
              ]);

              // Group by sales category
              const categoryName = 
                item.inventory?.SalesCategory?.Category_Desc ||
                item.inventory?.salesCategory?.Category_Desc ||
                item.salesCategory?.Category_Desc ||
                item.SalesCategory?.Category_Desc ||
                item.salesCategory ||
                item.SalesCategory ||
                'Uncategorized';
              
              if (!categoryGroups[categoryName]) {
                categoryGroups[categoryName] = [];
              }
              categoryGroups[categoryName].push(item);
            });

            // Calculate full width for table
            const tableWidth = pageWidth - (margin * 2);
            
            autoTableFn(doc, {
              head: [orderItemsHeaders],
              body: orderItemsData,
              startY: yPosition,
              margin: { left: margin, right: margin },
              tableWidth: tableWidth,
              styles: { 
                fontSize: 8, 
                cellPadding: 2, 
                lineWidth: 0.1,
                lineColor: [220, 220, 220],
                textColor: [50, 50, 50]
              },
              headStyles: { 
                fillColor: [60, 60, 60], 
                textColor: [255, 255, 255], 
                fontStyle: 'bold', 
                lineWidth: 0.1,
                fontSize: 8
              },
              alternateRowStyles: { fillColor: [250, 250, 250] },
              columnStyles: {
                0: { cellWidth: tableWidth * 0.08, halign: 'center' }, // Line #
                1: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Item #
                2: { cellWidth: tableWidth * 0.55, halign: 'left' }, // Description
                3: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Qty Ordered
                4: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Qty Shipped
              },
              didDrawPage: (data: any) => {
                addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
              },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 8;
          }

          // Override Requests Table for this picker
          if (pickerRequests.length > 0) {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = margin;
            }

            // Create a map of itemNumber to description from all orderItems
            const itemDescriptionMap: { [key: number]: string } = {};
            // Check picker's items first
            if (pickerItems && Array.isArray(pickerItems)) {
              pickerItems.forEach((item: any) => {
                const itemNum = item.Item_Number || item.itemNumber;
                if (itemNum && !itemDescriptionMap[itemNum]) {
                  const desc = item.inventory?.Description || item.itemDescription || item.ItemDescription || 'N/A';
                  itemDescriptionMap[itemNum] = desc;
                }
              });
            }
            // Also check all order items as fallback
            const allOrderItems = order.orderItems || orderInfo.orderItems || [];
            if (Array.isArray(allOrderItems)) {
              allOrderItems.forEach((item: any) => {
                const itemNum = item.Item_Number || item.itemNumber;
                if (itemNum && !itemDescriptionMap[itemNum]) {
                  const desc = item.inventory?.Description || item.itemDescription || item.ItemDescription || 'N/A';
                  itemDescriptionMap[itemNum] = desc;
                }
              });
            }

            const overrideHeaders = ['Item #', 'Description', 'Status', 'Note', 'Rejection Reason'];
            const overrideData: any[][] = [];

            pickerRequests.forEach((override: any) => {
              const itemNumber = override.itemNumber || '';
              const description = override.itemDescription || itemDescriptionMap[itemNumber] || 'N/A';
              const status = override.status || 'N/A';
              const note = override.note || 'N/A';
              const rejectionReason = override.rejectionReason || '';

              overrideData.push([
                itemNumber.toString(),
                description,
                status.toUpperCase(),
                note,
                rejectionReason || '-',
              ]);
            });

            const tableWidth = pageWidth - (margin * 2);

            autoTableFn(doc, {
              head: [overrideHeaders],
              body: overrideData,
              startY: yPosition,
              margin: { left: margin, right: margin },
              tableWidth: tableWidth,
              styles: { 
                fontSize: 8, 
                cellPadding: 2, 
                lineWidth: 0.1,
                lineColor: [220, 220, 220],
                textColor: [50, 50, 50]
              },
              headStyles: { 
                fillColor: [60, 60, 60], 
                textColor: [255, 255, 255], 
                fontStyle: 'bold', 
                lineWidth: 0.1,
                fontSize: 8
              },
              alternateRowStyles: { fillColor: [250, 250, 250] },
              columnStyles: {
                0: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Item #
                1: { cellWidth: tableWidth * 0.30, halign: 'left' }, // Description
                2: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Status
                3: { cellWidth: tableWidth * 0.23, halign: 'left' }, // Note
                4: { cellWidth: tableWidth * 0.23, halign: 'left' }, // Rejection Reason
              },
              didDrawPage: (data: any) => {
                addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
              },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
          }

          // Add spacing between pickers
          yPosition += 8;
        });
      } else {
        // Original logic for single picker (backward compatibility)
        // Order Items Table
        if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
          const orderItemsHeaders = ['Line #', 'Item #', 'Description', 'Qty Ordered', 'Qty Shipped'];
          const orderItemsData: any[][] = [];

          order.orderItems.forEach((item: any) => {
            const lineNumber = item.Line_Number || item.lineNumber || '';
            const itemNumber = item.Item_Number || item.itemNumber || '';
            const description = item.inventory?.Description || item.itemDescription || item.ItemDescription || '';
            const qtyOrdered = item.Quantity_Ordered || item.quantityOrdered || 0;
            const qtyShipped = item.Quantity_Shipped || item.quantityShipped || 0;

            orderItemsData.push([
              lineNumber.toString(),
              itemNumber.toString(),
              description,
              qtyOrdered.toString(),
              qtyShipped.toString(),
            ]);

            // Group by sales category
            const categoryName = 
              item.inventory?.SalesCategory?.Category_Desc ||
              item.inventory?.salesCategory?.Category_Desc ||
              item.salesCategory?.Category_Desc ||
              item.SalesCategory?.Category_Desc ||
              item.salesCategory ||
              item.SalesCategory ||
              'Uncategorized';
            
            if (!categoryGroups[categoryName]) {
              categoryGroups[categoryName] = [];
            }
            categoryGroups[categoryName].push(item);
          });

          // Calculate full width for table
          const tableWidth = pageWidth - (margin * 2);
          
          autoTableFn(doc, {
            head: [orderItemsHeaders],
            body: orderItemsData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            tableWidth: tableWidth,
            styles: { 
              fontSize: 8, 
              cellPadding: 2, 
              lineWidth: 0.1,
              lineColor: [220, 220, 220],
              textColor: [50, 50, 50]
            },
            headStyles: { 
              fillColor: [60, 60, 60], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold', 
              lineWidth: 0.1,
              fontSize: 8
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              0: { cellWidth: tableWidth * 0.08, halign: 'center' }, // Line #
              1: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Item #
              2: { cellWidth: tableWidth * 0.55, halign: 'left' }, // Description
              3: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Qty Ordered
              4: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Qty Shipped
            },
            didDrawPage: (data: any) => {
              addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Override Requests Table
        if (order.overrideRequests && Array.isArray(order.overrideRequests) && order.overrideRequests.length > 0) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          // Create a map of itemNumber to description from orderItems
          const itemDescriptionMap: { [key: number]: string } = {};
          if (order.orderItems && Array.isArray(order.orderItems)) {
            order.orderItems.forEach((item: any) => {
              const itemNum = item.Item_Number || item.itemNumber;
              if (itemNum && !itemDescriptionMap[itemNum]) {
                const desc = item.inventory?.Description || item.itemDescription || item.ItemDescription || 'N/A';
                itemDescriptionMap[itemNum] = desc;
              }
            });
          }

          const overrideHeaders = ['Item #', 'Description', 'Status', 'Note', 'Rejection Reason'];
          const overrideData: any[][] = [];

          order.overrideRequests.forEach((override: any) => {
            const itemNumber = override.itemNumber || '';
            const description = override.itemDescription || itemDescriptionMap[itemNumber] || 'N/A';
            const status = override.status || 'N/A';
            const note = override.note || 'N/A';
            const rejectionReason = override.rejectionReason || '';

            overrideData.push([
              itemNumber.toString(),
              description,
              status.toUpperCase(),
              note,
              rejectionReason || '-',
            ]);
          });

          const tableWidth = pageWidth - (margin * 2);

          autoTableFn(doc, {
            head: [overrideHeaders],
            body: overrideData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            tableWidth: tableWidth,
            styles: { 
              fontSize: 8, 
              cellPadding: 2, 
              lineWidth: 0.1,
              lineColor: [220, 220, 220],
              textColor: [50, 50, 50]
            },
            headStyles: { 
              fillColor: [60, 60, 60], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold', 
              lineWidth: 0.1,
              fontSize: 8
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              0: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Item #
              1: { cellWidth: tableWidth * 0.30, halign: 'left' }, // Description
              2: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Status
              3: { cellWidth: tableWidth * 0.23, halign: 'left' }, // Note
              4: { cellWidth: tableWidth * 0.23, halign: 'left' }, // Rejection Reason
            },
            didDrawPage: (data: any) => {
              addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Sales Category Summary
      // Use salesCategorySummary from API if available, otherwise calculate from items
      const categorySummaryData: any[][] = [];
      
      if (order.salesCategorySummary && Array.isArray(order.salesCategorySummary) && order.salesCategorySummary.length > 0) {
        // Use API data directly
        const sortedCategories = [...order.salesCategorySummary].sort((a, b) => 
          (a.salesCategoryName || '').localeCompare(b.salesCategoryName || '')
        );
        
        sortedCategories.forEach((category) => {
          categorySummaryData.push([
            category.salesCategoryName || 'Uncategorized',
            category.totalItems.toString(),
            category.totalQty.toString(),
            category.scannedQty.toString(),
          ]);
        });
      } else {
        // Fallback: Calculate from order items (backward compatibility)
        // Rebuild categoryGroups from all orderItems if we grouped by picker
        if (allPickers && Array.isArray(allPickers) && allPickers.length > 0) {
          const allCategoryGroups: { [key: string]: any[] } = {};
          // Collect items from all pickers
          allPickers.forEach((picker: any) => {
            if (picker.orderItems && Array.isArray(picker.orderItems)) {
              picker.orderItems.forEach((item: any) => {
                const categoryName = 
                  item.inventory?.SalesCategory?.Category_Desc ||
                  item.inventory?.salesCategory?.Category_Desc ||
                  item.salesCategory?.Category_Desc ||
                  item.SalesCategory?.Category_Desc ||
                  item.salesCategory ||
                  item.SalesCategory ||
                  'Uncategorized';
                
                if (!allCategoryGroups[categoryName]) {
                  allCategoryGroups[categoryName] = [];
                }
                allCategoryGroups[categoryName].push(item);
              });
            }
          });
          // Also include items from top-level orderItems if they exist (and weren't already included)
          const allOrderItems = order.orderItems || orderInfo.orderItems || [];
          allOrderItems.forEach((item: any) => {
            const categoryName = 
              item.inventory?.SalesCategory?.Category_Desc ||
              item.inventory?.salesCategory?.Category_Desc ||
              item.salesCategory?.Category_Desc ||
              item.SalesCategory?.Category_Desc ||
              item.salesCategory ||
              item.SalesCategory ||
              'Uncategorized';
            
            if (!allCategoryGroups[categoryName]) {
              allCategoryGroups[categoryName] = [];
            }
            allCategoryGroups[categoryName].push(item);
          });
          // Merge into categoryGroups
          Object.keys(allCategoryGroups).forEach(key => {
            if (!categoryGroups[key]) {
              categoryGroups[key] = [];
            }
            categoryGroups[key].push(...allCategoryGroups[key]);
          });
        }

        const sortedCategories = Object.keys(categoryGroups).sort();
        
        sortedCategories.forEach((categoryName) => {
          const categoryItems = categoryGroups[categoryName];
          const totalItems = categoryItems.length;
          const totalQty = categoryItems.reduce((sum, item) => {
            return sum + Number(item.Quantity_Ordered || item.quantityOrdered || 0);
          }, 0);
          const scannedQty = categoryItems.reduce((sum, item) => {
            return sum + Number(item.Quantity_Shipped || item.quantityShipped || 0);
          }, 0);
          
          categorySummaryData.push([
            categoryName,
            totalItems.toString(),
            totalQty.toString(),
            scannedQty.toString(),
          ]);
        });
      }

      // Sales Category Summary Section
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Dark divider before Sales Category Summary
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      if (categorySummaryData.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Category Summary', margin, yPosition);
        yPosition += 6;

        const categoryTableHeaders = ['Sales Category', 'Total Items', 'Total Qty', 'Scanned Qty'];
        const tableWidth = pageWidth - (margin * 2);

        autoTableFn(doc, {
          head: [categoryTableHeaders],
          body: categorySummaryData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          tableWidth: tableWidth,
          styles: { 
            fontSize: 9, 
            cellPadding: 2.5, 
            lineWidth: 0.1,
            lineColor: [220, 220, 220],
            textColor: [50, 50, 50]
          },
          headStyles: { 
            fillColor: [60, 60, 60], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold', 
            lineWidth: 0.1,
            fontSize: 9
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          columnStyles: {
            0: { cellWidth: tableWidth * 0.50, halign: 'left' }, // Sales Category
            1: { cellWidth: tableWidth * 0.17, halign: 'center' }, // Total Items
            2: { cellWidth: tableWidth * 0.17, halign: 'center' }, // Total Qty
            3: { cellWidth: tableWidth * 0.16, halign: 'center' }, // Scanned Qty
          },
          didDrawPage: (data: any) => {
            addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      // Save PDF
      const fileName = `Epick-Order-${order.orderNumber || 'Order'}-${moment().format('YYYY-MM-DD')}.pdf`;
      doc.save(fileName);
      
      showSuccessToast('Order PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download order PDF:', error);
      showErrorToast('Failed to download order PDF');
    } finally {
      setDownloadingOrder(null);
    }
  };

  // Format date helper (for modal)
  const formatDateModal = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY') : 'N/A';
  };

  // Format datetime helper (for modal)
  const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('MM/DD/YYYY HH:mm') : 'N/A';
  };

  // Format currency helper
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    const today = dayjs();
    
    switch (value) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = today.subtract(1, 'day');
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'lastWeek':
        const weekAgo = today.subtract(7, 'day');
        setStartDate(weekAgo);
        setEndDate(today);
        break;
      case 'lastMonth':
        const monthAgo = today.subtract(1, 'month');
        setStartDate(monthAgo);
        setEndDate(today);
        break;
      case 'customize':
        // Keep existing dates or set to null
        break;
      default:
        setStartDate(null);
        setEndDate(null);
        break;
    }
  };

  // Helper to load logo as data URL
  const loadLogoAsDataUrl = async (logoUrl?: string): Promise<string | null> => {
    try {
      return new Promise<string | null>((resolve) => {
        if (!logoUrl) {
          // For local rabbit logo
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.error('Error converting logo to data URL:', error);
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          if (typeof rabbitLogo === 'string') {
            img.src = rabbitLogo;
          } else {
            img.src = rabbitLogo as string;
          }
          return;
        }

        // For URL-based logos
        const img1 = new Image();
        img1.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img1.width;
            canvas.height = img1.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img1, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch {
            tryMethod2();
          }
        };
        img1.onerror = () => tryMethod2();
        
        const tryMethod2 = () => {
          const img2 = new Image();
          img2.crossOrigin = 'anonymous';
          img2.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img2.width;
              canvas.height = img2.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img2, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };
          img2.onerror = () => resolve(null);
          img2.src = logoUrl;
        };
        
        img1.src = logoUrl;
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Helper function to add footer with logo and "Report Generated by Woopsa" to each page
  const addFooterToPage = (doc: jsPDF, logoDataUrl?: string, pageNum?: number, totalPages?: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const footerY = pageHeight - 8;
    const margin = 10;
    
    // Left side: "Report Generated by Woopsa" + logo
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const text = 'Report Generated by Woopsa';
    doc.text(text, margin, footerY);
    
    if (logoDataUrl) {
      try {
        const logoWidth = 4;
        const logoHeight = 4;
        const textWidth = doc.getTextWidth(text);
        const logoX = margin + textWidth + 1.5;
        const logoY = footerY - 3;
        
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch {
          try {
            doc.addImage(logoDataUrl, 'JPEG', logoX, logoY, logoWidth, logoHeight);
          } catch {
            try {
              doc.addImage(logoDataUrl, 'SVG', logoX, logoY, logoWidth, logoHeight);
            } catch {
              doc.addImage(logoDataUrl, logoX, logoY, logoWidth, logoHeight);
            }
          }
        }
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Right side: Page number
    if (pageNum !== undefined && totalPages !== undefined) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const pageText = `Page ${pageNum} of ${totalPages}`;
      doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
    }
  };

  // Format date to mm-dd-yyyy
//   const formatDateToMMDDYYYY = (dateString: string): string => {
//     if (!dateString) return '';
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) {
//         const parts = dateString.split(/[-/]/);
//         if (parts.length === 3) {
//           const year = parts[0].length === 4 ? parts[0] : parts[2];
//           const month = parts[0].length === 4 ? parts[1] : parts[0];
//           const day = parts[0].length === 4 ? parts[2] : parts[1];
//           return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
//         }
//         return dateString;
//       }
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const day = String(date.getDate()).padStart(2, '0');
//       const year = date.getFullYear();
//       return `${month}-${day}-${year}`;
//     } catch {
//       return dateString;
//     }
//   };

  // Format seconds to HH:MM:SS
  const formatSecondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle download report - Generate PDF
  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const params: {
        userId?: number;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
      } = {};

      if (downloadUserId) {
        params.userId = downloadUserId;
      }

      if (dateFilter !== 'none' && startDate && endDate) {
        params.fromDate = startDate.format('YYYY-MM-DD');
        params.toDate = endDate.format('YYYY-MM-DD');
      }

      // For download, we might want to get all records, so set a high limit
      params.limit = 10000;
      params.page = 1;

      const response: any = await getUserReportWithDateRange(params);
      
      if (!response?.data?.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        showErrorToast('No data available to download');
        return;
      }

      const reportData = response.data.data;
      const summary = response.data.summary || {};
      const distributor = response.data.distributor || {};
      const logoUrl = response.data.logo;

      // Load logos - distributor logo for header, rabbit logo for footer
      const [distributorLogoDataUrl, rabbitLogoDataUrl] = await Promise.all([
        logoUrl ? loadLogoAsDataUrl(logoUrl) : Promise.resolve(null),
        loadLogoAsDataUrl(), // Rabbit logo for footer
      ]);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      // Header Section: Logo (left, if exists) and Distributor Details (right)
      let distributorY = margin;
      let logoY = margin;

      // Add logo on left side - only if distributor logo exists
      if (distributorLogoDataUrl && distributorLogoDataUrl.startsWith('data:')) {
        try {
          const logoWidth = 30;
          const logoHeight = 10;
          const formatMatch = distributorLogoDataUrl.match(/data:image\/(\w+);/);
          const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
          try {
            doc.addImage(distributorLogoDataUrl, format, margin, logoY, logoWidth, logoHeight);
            logoY += logoHeight + 2;
          } catch {
            // Logo couldn't be added, continue without it
            logoY = margin;
          }
        } catch {
          // Logo processing failed, continue without it
          logoY = margin;
        }
      }

      // Distributor details on right side (always shown)
      const distributorX = pageWidth - margin;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      // Distributor name
      if (distributor.D_Name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(distributor.D_Name, distributorX, distributorY, { align: 'right' });
        distributorY += 5;
      }
      
      // Address lines
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (distributor.D_Addr1) {
        doc.text(distributor.D_Addr1, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      if (distributor.D_Addr2) {
        doc.text(distributor.D_Addr2, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      const cityStateZip = `${distributor.D_City || ''}${distributor.D_State ? `, ${distributor.D_State}` : ''} ${distributor.D_Zip || ''}`.trim();
      if (cityStateZip) {
        doc.text(cityStateZip, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      
      // Phone - clickable link
      if (distributor.D_Phone) {
        const phoneText = distributor.D_Phone;
        const textWidth = doc.getTextWidth(phoneText);
        doc.setTextColor(0, 102, 204);
        doc.text(phoneText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `tel:${distributor.D_Phone}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }
      
      // Email - clickable link
      if (distributor.D_Email) {
        const emailText = distributor.D_Email;
        const textWidth = doc.getTextWidth(emailText);
        doc.setTextColor(0, 102, 204);
        doc.text(emailText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `mailto:${distributor.D_Email}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }

      yPosition = Math.max(logoY, distributorY) + 8;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Process all order items for category summary (aggregated from all orders)
      const allOrderItemsForCategory: any[] = [];
      const categoryGroups: { [key: string]: any[] } = {};

      // Process each order
      reportData.forEach((order: any) => {
        // Get allPickers for this order once at the start
        const orderAllPickers = order.allPickers || order.allPicker;
        
        // Check if we need a new page before starting a new order
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Order Header Section: Three-column layout (Left: Order Info, Center: Picking Time, Right: Picker & Customer)
        const orderLeftY = yPosition;
        const orderRightY = yPosition;
        const centerX = pageWidth / 2;

        // Left side: Order details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`Order #${order.orderNumber || ''}`, margin, orderLeftY);
        let leftY = orderLeftY + 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const orderLeftInfo = [
          `Total Qty Ordered: ${order.totalQty || 0}`,
          `Scanned Qty: ${order.scannedQty || 0}`,
          `Total Lines: ${order.totalLines || 0}`,
          `Scanned Lines: ${order.scannedLines || 0}`,
          `Out of Stock Items: ${order.OutOfStockItem || 0}`,
          `Override Requests: ${order.overrideRequestCount || 0}`,
        ];

        orderLeftInfo.forEach((text) => {
          doc.text(text, margin, leftY);
          leftY += 4;
        });

        // Center: Picking Time (only time value, centered)
        const pickingTime = order.pickingTimeFormatted || 'N/A';
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(pickingTime, centerX, orderLeftY + 8, { align: 'center' });

        // Right side: Picker(s) and Customer details
        const customerName = order.customer?.C_Name || order.customer?.customerName || 'N/A';
        const customerNumber = order.customer?.C_Number || order.customer?.customerNumber || 'N/A';
        const routeInfo = order.customer?.Routes?.[0]
          ? `Route: ${order.customer.Routes[0].Route_Number || ''}, Stop: ${order.customer.Routes[0].Stop_Number || ''}`
          : '';

        const orderRightX = pageWidth - margin;
        let rightY = orderRightY;
        
        // Handle multiple pickers if allPickers exists, otherwise use single picker
        if (orderAllPickers && Array.isArray(orderAllPickers) && orderAllPickers.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`Pickers (${orderAllPickers.length}):`, orderRightX, rightY, { align: 'right' });
          rightY += 5;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          orderAllPickers.forEach((picker: any, index: number) => {
            const pickerName = picker.pickerName || 
              (picker.firstName && picker.lastName ? `${picker.firstName} ${picker.lastName}`.trim() : '') ||
              picker.email || 
              'N/A';
            doc.text(`${index + 1}. ${pickerName}`, orderRightX, rightY, { align: 'right' });
            rightY += 4;
            if (picker.pickerUserNumber) {
              doc.text(`   User #${picker.pickerUserNumber}`, orderRightX, rightY, { align: 'right' });
              rightY += 3;
            }
          });
          rightY += 2;
        } else {
          // Single picker (backward compatibility)
          const pickerName = order.picker 
            ? `${order.picker.firstName || ''} ${order.picker.lastName || ''}`.trim() || order.picker.email || 'N/A'
            : 'N/A';
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Picker:', orderRightX, rightY, { align: 'right' });
          rightY += 5;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(pickerName, orderRightX, rightY, { align: 'right' });
          rightY += 6;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer:', orderRightX, rightY, { align: 'right' });
        rightY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(customerName, orderRightX, rightY, { align: 'right' });
        rightY += 4;
        doc.text(`#${customerNumber}`, orderRightX, rightY, { align: 'right' });
        rightY += 4;
        if (routeInfo) {
          doc.text(routeInfo, orderRightX, rightY, { align: 'right' });
        } else {
          // Show route/stop even if empty
          doc.text('Route: N/A, Stop: N/A', orderRightX, rightY, { align: 'right' });
        }

        yPosition = Math.max(leftY, rightY) + 8;

        // Checker Action Logs
        const checkerActionLogs = Array.isArray(order.checkerActionLogs) ? order.checkerActionLogs : [];
        if (checkerActionLogs.length > 0) {
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text(`Checker Action Logs (${checkerActionLogs.length})`, margin, yPosition);
          yPosition += 5;

          const checkerHeaders = ['Checker', 'Type', 'Item #', 'Line #', 'Pre Qty', 'New Qty', 'dBundle'];
          const checkerData: any[][] = checkerActionLogs.map((log: any) => ([
            log.checkerUserId ?? 'N/A',
            log.actionType ? String(log.actionType).replace(/_/g, ' ').toUpperCase() : 'N/A',
            log.itemNumber ?? 'N/A',
            log.lineNumber ?? 'N/A',
            log.meta?.previousQty ?? 'N/A',
            log.meta?.newQty ?? 'N/A',
            log.deltaBundles ?? 0,
          ]));

          const tableWidth = pageWidth - (margin * 2);
          autoTableFn(doc, {
            head: [checkerHeaders],
            body: checkerData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            tableWidth: tableWidth,
            styles: {
              fontSize: 7,
              cellPadding: 1.6,
              lineWidth: 0.1,
              lineColor: [220, 220, 220],
              textColor: [50, 50, 50],
            },
            headStyles: {
              fillColor: [60, 60, 60],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              lineWidth: 0.1,
              fontSize: 7,
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              0: { cellWidth: tableWidth * 0.10, halign: 'center' },
              1: { cellWidth: tableWidth * 0.26, halign: 'left' },
              2: { cellWidth: tableWidth * 0.12, halign: 'center' },
              3: { cellWidth: tableWidth * 0.10, halign: 'center' },
              4: { cellWidth: tableWidth * 0.14, halign: 'center' },
              5: { cellWidth: tableWidth * 0.14, halign: 'center' },
              6: { cellWidth: tableWidth * 0.14, halign: 'center' },
            },
            didDrawPage: (data: any) => {
              addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Order Items Table
        if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
          const orderItemsHeaders = ['Line #', 'Item #', 'Description', 'Qty Ordered', 'Qty Shipped'];
          const orderItemsData: any[][] = [];

          order.orderItems.forEach((item: any) => {
            const lineNumber = item.Line_Number || item.lineNumber || '';
            const itemNumber = item.Item_Number || item.itemNumber || '';
            const description = item.inventory?.Description || item.itemDescription || item.ItemDescription || '';
            const qtyOrdered = item.Quantity_Ordered || item.quantityOrdered || 0;
            const qtyShipped = item.Quantity_Shipped || item.quantityShipped || 0;

            orderItemsData.push([
              lineNumber.toString(),
              itemNumber.toString(),
              description,
              qtyOrdered.toString(),
              qtyShipped.toString(),
            ]);

            // Collect for category summary
            allOrderItemsForCategory.push(item);
            
            // Group by sales category
            const categoryName = 
              item.inventory?.SalesCategory?.Category_Desc ||
              item.inventory?.salesCategory?.Category_Desc ||
              item.salesCategory ||
              item.SalesCategory ||
              'Uncategorized';
            
            if (!categoryGroups[categoryName]) {
              categoryGroups[categoryName] = [];
            }
            categoryGroups[categoryName].push(item);
          });

          // Calculate full width for table (page width minus margins)
          const tableWidth = pageWidth - (margin * 2);
          
          autoTableFn(doc, {
            head: [orderItemsHeaders],
            body: orderItemsData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            tableWidth: tableWidth,
            styles: { 
              fontSize: 8, 
              cellPadding: 2, 
              lineWidth: 0.1,
              lineColor: [220, 220, 220],
              textColor: [50, 50, 50]
            },
            headStyles: { 
              fillColor: [60, 60, 60], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold', 
              lineWidth: 0.1,
              fontSize: 8
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              0: { cellWidth: tableWidth * 0.08, halign: 'center' }, // Line #
              1: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Item #
              2: { cellWidth: tableWidth * 0.55, halign: 'left' }, // Description
              3: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Qty Ordered
              4: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Qty Shipped
            },
            didDrawPage: (data: any) => {
              addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Override Requests Table
        if (order.overrideRequests && Array.isArray(order.overrideRequests) && order.overrideRequests.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          const overrideHeaders = ['Item #', 'Qty', 'Status', 'Note', 'Rejection Reason'];
          const overrideData: any[][] = [];

          order.overrideRequests.forEach((override: any) => {
            const itemNumber = override.itemNumber || '';
            const qty = override.qty || 0;
            const status = override.status || 'N/A';
            const note = override.note || 'N/A';
            const rejectionReason = override.rejectionReason || '';

            overrideData.push([
              itemNumber.toString(),
              qty.toString(),
              status.toUpperCase(),
              note,
              rejectionReason || '-',
            ]);
          });

          // Calculate full width for table
          const tableWidth = pageWidth - (margin * 2);

          autoTableFn(doc, {
            head: [overrideHeaders],
            body: overrideData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            tableWidth: tableWidth,
            styles: { 
              fontSize: 8, 
              cellPadding: 2, 
              lineWidth: 0.1,
              lineColor: [220, 220, 220],
              textColor: [50, 50, 50]
            },
            headStyles: { 
              fillColor: [60, 60, 60], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold', 
              lineWidth: 0.1,
              fontSize: 8
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              0: { cellWidth: tableWidth * 0.15, halign: 'center' }, // Item #
              1: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Qty
              2: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Status
              3: { cellWidth: tableWidth * 0.30, halign: 'left' }, // Note
              4: { cellWidth: tableWidth * 0.33, halign: 'left' }, // Rejection Reason
            },
            didDrawPage: (data: any) => {
              addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Divider between orders (light gray for order separators)
        if (yPosition < pageHeight - 20) {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
        }
      });

      // Dark divider before Sales Category Summary (after last order)
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Sales Category Summary (aggregated from all orders)
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      const sortedCategories = Object.keys(categoryGroups).sort();
      const categorySummaryData: any[][] = [];

      sortedCategories.forEach((categoryName) => {
        const categoryItems = categoryGroups[categoryName];
        const totalItems = categoryItems.length;
        const totalQty = categoryItems.reduce((sum, item) => {
          return sum + Number(item.Quantity_Ordered || item.quantityOrdered || 0);
        }, 0);
        const scannedQty = categoryItems.reduce((sum, item) => {
          return sum + Number(item.Quantity_Shipped || item.quantityShipped || 0);
        }, 0);
        
        categorySummaryData.push([
          categoryName,
          totalItems.toString(),
          totalQty.toString(),
          scannedQty.toString(),
        ]);
      });

      if (categorySummaryData.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Category Summary', margin, yPosition);
        yPosition += 6;

        const categoryTableHeaders = ['Sales Category', 'Total Items', 'Total Qty', 'Scanned Qty'];

        // Calculate full width for table
        const tableWidth = pageWidth - (margin * 2);

        autoTableFn(doc, {
          head: [categoryTableHeaders],
          body: categorySummaryData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          tableWidth: tableWidth,
          styles: { 
            fontSize: 9, 
            cellPadding: 2.5, 
            lineWidth: 0.1,
            lineColor: [220, 220, 220],
            textColor: [50, 50, 50]
          },
          headStyles: { 
            fillColor: [60, 60, 60], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold', 
            lineWidth: 0.1,
            fontSize: 9
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          columnStyles: {
            0: { cellWidth: tableWidth * 0.50, halign: 'left' }, // Sales Category
            1: { cellWidth: tableWidth * 0.17, halign: 'center' }, // Total Items
            2: { cellWidth: tableWidth * 0.17, halign: 'center' }, // Total Qty
            3: { cellWidth: tableWidth * 0.16, halign: 'center' }, // Scanned Qty
          },
          didDrawPage: (data: any) => {
            addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Final Summary Section
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Dark divider above Final Summary
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(1);
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 3;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('Final Summary', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const totalOrders = summary.totalOrders || reportData.length;
      const totalPickingTime = summary.totalPickingTimeFormatted || 
        (summary.totalPickingTimeSeconds ? formatSecondsToTime(summary.totalPickingTimeSeconds) : 'N/A');
      const avgPickingTime = summary.averagePickingTimeSeconds 
        ? formatSecondsToTime(summary.averagePickingTimeSeconds)
        : 'N/A';

      const finalSummaryData = [
        ['Total Orders', totalOrders.toString()],
        ['Total Picking Time', totalPickingTime],
        ['Average Picking Time', avgPickingTime],
      ];

      finalSummaryData.forEach(([label, value], index) => {
        doc.setFont('helvetica', index === finalSummaryData.length - 1 ? 'bold' : 'normal');
        doc.setFontSize(index === finalSummaryData.length - 1 ? 11 : 10);
        doc.text(label, margin, yPosition);
        doc.text(value, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
      });

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      // Save PDF
      const fileName = `Epick-Report-${downloadUserId || 'all'}-${dateFilter}-${moment().format('YYYY-MM-DD')}.pdf`;
      doc.save(fileName);
      
      showSuccessToast('Report downloaded successfully');
      setDownloadModalOpen(false);
      // Reset form
      setDownloadUserId('');
      setDateFilter('none');
      setStartDate(null);
      setEndDate(null);
    } catch (error) {
      console.error('Failed to download report:', error);
      showErrorToast('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  // Handle Summary Report - Generate PDF with orderwise summary table
  const handleDownloadSummaryReport = async () => {
    setDownloadingSummary(true);
    try {
      const params: {
        userId?: number;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
      } = {};

      if (summaryUserId) {
        params.userId = summaryUserId;
      }

      if (summaryDateFilter !== 'none' && summaryStartDate && summaryEndDate) {
        params.fromDate = summaryStartDate.format('YYYY-MM-DD');
        params.toDate = summaryEndDate.format('YYYY-MM-DD');
      }

      params.limit = 10000;
      params.page = 1;

      const response: any = await getUserReportWithDateRange(params);
      
      if (!response?.data?.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        showErrorToast('No data available to download');
        return;
      }

      const reportData = response.data.data;
      const distributor = response.data.distributor || {};
      const logoUrl = response.data.logo;

      // Load logos
      const [distributorLogoDataUrl, rabbitLogoDataUrl] = await Promise.all([
        logoUrl ? loadLogoAsDataUrl(logoUrl) : Promise.resolve(null),
        loadLogoAsDataUrl(),
      ]);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let yPosition = margin;

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      // Header Section
      let distributorY = margin;
      let logoY = margin;

      if (distributorLogoDataUrl && distributorLogoDataUrl.startsWith('data:')) {
        try {
          const logoWidth = 30;
          const logoHeight = 10;
          const formatMatch = distributorLogoDataUrl.match(/data:image\/(\w+);/);
          const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
          try {
            doc.addImage(distributorLogoDataUrl, format, margin, logoY, logoWidth, logoHeight);
            logoY += logoHeight + 2;
          } catch {
            logoY = margin;
          }
        } catch {
          logoY = margin;
        }
      }

      const distributorX = pageWidth - margin;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (distributor.D_Name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(distributor.D_Name, distributorX, distributorY, { align: 'right' });
        distributorY += 5;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (distributor.D_Addr1) {
        doc.text(distributor.D_Addr1, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      if (distributor.D_Addr2) {
        doc.text(distributor.D_Addr2, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      const cityStateZip = `${distributor.D_City || ''}${distributor.D_State ? `, ${distributor.D_State}` : ''} ${distributor.D_Zip || ''}`.trim();
      if (cityStateZip) {
        doc.text(cityStateZip, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      
      if (distributor.D_Phone) {
        const phoneText = distributor.D_Phone;
        const textWidth = doc.getTextWidth(phoneText);
        doc.setTextColor(0, 102, 204);
        doc.text(phoneText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `tel:${distributor.D_Phone}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }
      
      if (distributor.D_Email) {
        const emailText = distributor.D_Email;
        const textWidth = doc.getTextWidth(emailText);
        doc.setTextColor(0, 102, 204);
        doc.text(emailText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `mailto:${distributor.D_Email}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }

      yPosition = Math.max(logoY, distributorY) + 8;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Summary Report', margin, yPosition);
      yPosition += 10;

      // Prepare summary table data
      const summaryHeaders = ['Order #', 'Picker', 'Customer', 'Time', 'Override Requests', 'Total Items', 'Total Qty', 'Scanned Qty'];
      const summaryData: any[][] = [];

      reportData.forEach((order: any) => {
        // Handle multiple pickers if allPicker exists, otherwise use single picker
        let pickerName = 'N/A';
        if (order.allPicker && Array.isArray(order.allPicker) && order.allPicker.length > 0) {
          const pickerNames = order.allPicker.map((p: any, idx: number) => {
            const name = p.pickerName || 
              (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}`.trim() : '') ||
              p.email || 
              `Picker ${idx + 1}`;
            return name;
          });
          pickerName = pickerNames.join(', ');
        } else if (order.picker) {
          pickerName = `${order.picker.firstName || ''} ${order.picker.lastName || ''}`.trim() || order.picker.email || 'N/A';
        }
        const customerName = order.customer?.C_Name || order.customer?.customerName || 'N/A';
        const pickingTime = order.pickingTimeFormatted || 'N/A';
        const totalOverrideRequests = order.overrideRequestCount || 0;
        
        // Calculate from orderItems array
        const orderItems = order.orderItems || [];
        const totalItems = orderItems.length;
        const totalQty = orderItems.reduce((sum: number, item: any) => {
          return sum + Number(item.Quantity_Ordered || item.quantityOrdered || 0);
        }, 0);
        const scannedQty = orderItems.reduce((sum: number, item: any) => {
          return sum + Number(item.Quantity_Shipped || item.quantityShipped || 0);
        }, 0);

        summaryData.push([
          order.orderNumber?.toString() || 'N/A',
          pickerName,
          customerName,
          pickingTime,
          totalOverrideRequests.toString(),
          totalItems.toString(),
          totalQty.toString(),
          scannedQty.toString(),
        ]);
      });

      const tableWidth = pageWidth - (margin * 2);

      autoTableFn(doc, {
        head: [summaryHeaders],
        body: summaryData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        tableWidth: tableWidth,
        styles: { 
          fontSize: 8, 
          cellPadding: 2, 
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
          textColor: [50, 50, 50]
        },
        headStyles: { 
          fillColor: [60, 60, 60], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          lineWidth: 0.1,
          fontSize: 8
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Order #
          1: { cellWidth: tableWidth * 0.15, halign: 'left' }, // Picker
          2: { cellWidth: tableWidth * 0.20, halign: 'left' }, // Customer
          3: { cellWidth: tableWidth * 0.12, halign: 'center' }, // Time
          4: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Total Override Requests
          5: { cellWidth: tableWidth * 0.10, halign: 'center' }, // Total Items
          6: { cellWidth: tableWidth * 0.11, halign: 'center' }, // Total Qty
          7: { cellWidth: tableWidth * 0.11, halign: 'center' }, // Scanned Qty
        },
        didDrawPage: (data: any) => {
          addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
        },
      });

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      // Save PDF
      const fileName = `Epick-Summary-Report-${summaryUserId || 'all'}-${summaryDateFilter}-${moment().format('YYYY-MM-DD')}.pdf`;
      doc.save(fileName);
      
      showSuccessToast('Summary report downloaded successfully');
      setSummaryModalOpen(false);
      setSummaryUserId('');
      setSummaryDateFilter('none');
      setSummaryStartDate(null);
      setSummaryEndDate(null);
    } catch (error) {
      console.error('Failed to download summary report:', error);
      showErrorToast('Failed to download summary report');
    } finally {
      setDownloadingSummary(false);
    }
  };

  // Handle Request Report - Generate PDF with note-wise grouped override requests
  const handleDownloadRequestReport = async () => {
    setDownloadingRequest(true);
    try {
      const params: {
        userId?: number;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
      } = {};

      if (requestUserId) {
        params.userId = requestUserId;
      }

      if (requestDateFilter !== 'none' && requestStartDate && requestEndDate) {
        params.fromDate = requestStartDate.format('YYYY-MM-DD');
        params.toDate = requestEndDate.format('YYYY-MM-DD');
      }

      params.limit = 10000;
      params.page = 1;

      const response: any = await getUserReportWithDateRange(params);
      
      if (!response?.data?.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        showErrorToast('No data available to download');
        return;
      }

      const reportData = response.data.data;
      const distributor = response.data.distributor || {};
      const logoUrl = response.data.logo;

      // Load logos
      const [distributorLogoDataUrl, rabbitLogoDataUrl] = await Promise.all([
        logoUrl ? loadLogoAsDataUrl(logoUrl) : Promise.resolve(null),
        loadLogoAsDataUrl(),
      ]);

      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      // Header Section
      let distributorY = margin;
      let logoY = margin;

      if (distributorLogoDataUrl && distributorLogoDataUrl.startsWith('data:')) {
        try {
          const logoWidth = 30;
          const logoHeight = 10;
          const formatMatch = distributorLogoDataUrl.match(/data:image\/(\w+);/);
          const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
          try {
            doc.addImage(distributorLogoDataUrl, format, margin, logoY, logoWidth, logoHeight);
            logoY += logoHeight + 2;
          } catch {
            logoY = margin;
          }
        } catch {
          logoY = margin;
        }
      }

      const distributorX = pageWidth - margin;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (distributor.D_Name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(distributor.D_Name, distributorX, distributorY, { align: 'right' });
        distributorY += 5;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (distributor.D_Addr1) {
        doc.text(distributor.D_Addr1, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      if (distributor.D_Addr2) {
        doc.text(distributor.D_Addr2, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      const cityStateZip = `${distributor.D_City || ''}${distributor.D_State ? `, ${distributor.D_State}` : ''} ${distributor.D_Zip || ''}`.trim();
      if (cityStateZip) {
        doc.text(cityStateZip, distributorX, distributorY, { align: 'right' });
        distributorY += 4;
      }
      
      if (distributor.D_Phone) {
        const phoneText = distributor.D_Phone;
        const textWidth = doc.getTextWidth(phoneText);
        doc.setTextColor(0, 102, 204);
        doc.text(phoneText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `tel:${distributor.D_Phone}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }
      
      if (distributor.D_Email) {
        const emailText = distributor.D_Email;
        const textWidth = doc.getTextWidth(emailText);
        doc.setTextColor(0, 102, 204);
        doc.text(emailText, distributorX, distributorY, { align: 'right' });
        doc.link(distributorX - textWidth, distributorY - 3, textWidth, 4, { url: `mailto:${distributor.D_Email}` });
        doc.setTextColor(60, 60, 60);
        distributorY += 4;
      }

      yPosition = Math.max(logoY, distributorY) + 8;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Request Report', margin, yPosition);
      yPosition += 10;

      // Collect all override requests and group by note
      const noteGroups: { [key: string]: any[] } = {};
      // Create a map of itemNumber to description from all order items
      const itemDescriptionMap: { [key: number]: string } = {};

      reportData.forEach((order: any) => {
        // Build item description map from order items
        if (order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach((item: any) => {
            const itemNum = item.Item_Number || item.itemNumber;
            if (itemNum && !itemDescriptionMap[itemNum]) {
              const desc = item.inventory?.Description || item.itemDescription || item.ItemDescription || 'N/A';
              itemDescriptionMap[itemNum] = desc;
            }
          });
        }

        if (order.overrideRequests && Array.isArray(order.overrideRequests)) {
          order.overrideRequests.forEach((request: any) => {
            // Only process approved requests
            if (request.status === 'approved') {
              const note = request.note || 'No Note';
              if (!noteGroups[note]) {
                noteGroups[note] = [];
              }
              noteGroups[note].push(request);
            }
          });
        }
      });

      // Process each note group
      const sortedNotes = Object.keys(noteGroups).sort();
      
      sortedNotes.forEach((note, noteIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        // Note header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(note, margin, yPosition);
        yPosition += 8;

        // Group by itemNumber within this note
        const itemGroups: { [key: string]: { itemNumber: number; description: string; totalQty: number } } = {};

        noteGroups[note].forEach((request: any) => {
          const itemNumber = request.itemNumber || '';
          // Try to get description from request first, then from map, then 'N/A'
          const description = request.itemDescription || itemDescriptionMap[itemNumber] || 'N/A';
          const qty = request.qty || 0;

          if (!itemGroups[itemNumber]) {
            itemGroups[itemNumber] = {
              itemNumber: itemNumber,
              description: description,
              totalQty: 0,
            };
          }
          itemGroups[itemNumber].totalQty += qty;
        });

        // Create table data for this note
        const requestHeaders = ['Item Number', 'Description', 'Total Qty'];
        const requestData: any[][] = [];

        const sortedItems = Object.keys(itemGroups).sort((a, b) => Number(a) - Number(b));
        sortedItems.forEach((itemKey) => {
          const item = itemGroups[itemKey];
          requestData.push([
            item.itemNumber.toString(),
            item.description,
            item.totalQty.toString(),
          ]);
        });

        if (requestData.length > 0) {
          const tableWidth = pageWidth - (margin * 2);

          autoTableFn(doc, {
            head: [requestHeaders],
            body: requestData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            tableWidth: tableWidth,
            styles: { 
              fontSize: 8, 
              cellPadding: 2, 
              lineWidth: 0.1,
              lineColor: [220, 220, 220],
              textColor: [50, 50, 50]
            },
            headStyles: { 
              fillColor: [60, 60, 60], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold', 
              lineWidth: 0.1,
              fontSize: 8
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
              0: { cellWidth: tableWidth * 0.20, halign: 'center' }, // Item Number
              1: { cellWidth: tableWidth * 0.60, halign: 'left' }, // Description
              2: { cellWidth: tableWidth * 0.20, halign: 'center' }, // Total Qty
            },
            didDrawPage: (data: any) => {
              addFooterToPage(doc, rabbitLogoDataUrl || undefined, data.pageNumber, doc.getNumberOfPages());
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;

          // Add divider between note sections (except for last one)
          if (noteIndex < sortedNotes.length - 1) {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = margin;
            } else {
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.5);
              doc.line(margin, yPosition, pageWidth - margin, yPosition);
              yPosition += 8;
            }
          }
        }
      });

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooterToPage(doc, rabbitLogoDataUrl || undefined, i, totalPages);
      }

      // Save PDF
      const fileName = `Epick-Request-Report-${requestUserId || 'all'}-${requestDateFilter}-${moment().format('YYYY-MM-DD')}.pdf`;
      doc.save(fileName);
      
      showSuccessToast('Request report downloaded successfully');
      setRequestModalOpen(false);
      setRequestUserId('');
      setRequestDateFilter('none');
      setRequestStartDate(null);
      setRequestEndDate(null);
    } catch (error) {
      console.error('Failed to download request report:', error);
      showErrorToast('Failed to download request report');
    } finally {
      setDownloadingRequest(false);
    }
  };

  // Handle date filter change for summary report
  const handleSummaryDateFilterChange = (value: string) => {
    setSummaryDateFilter(value);
    const today = dayjs();
    
    switch (value) {
      case 'today':
        setSummaryStartDate(today);
        setSummaryEndDate(today);
        break;
      case 'yesterday':
        const yesterday = today.subtract(1, 'day');
        setSummaryStartDate(yesterday);
        setSummaryEndDate(yesterday);
        break;
      case 'lastWeek':
        const weekAgo = today.subtract(7, 'day');
        setSummaryStartDate(weekAgo);
        setSummaryEndDate(today);
        break;
      case 'lastMonth':
        const monthAgo = today.subtract(1, 'month');
        setSummaryStartDate(monthAgo);
        setSummaryEndDate(today);
        break;
      case 'customize':
        break;
      default:
        setSummaryStartDate(null);
        setSummaryEndDate(null);
        break;
    }
  };

  // Handle date filter change for request report
  const handleRequestDateFilterChange = (value: string) => {
    setRequestDateFilter(value);
    const today = dayjs();
    
    switch (value) {
      case 'today':
        setRequestStartDate(today);
        setRequestEndDate(today);
        break;
      case 'yesterday':
        const yesterday = today.subtract(1, 'day');
        setRequestStartDate(yesterday);
        setRequestEndDate(yesterday);
        break;
      case 'lastWeek':
        const weekAgo = today.subtract(7, 'day');
        setRequestStartDate(weekAgo);
        setRequestEndDate(today);
        break;
      case 'lastMonth':
        const monthAgo = today.subtract(1, 'month');
        setRequestStartDate(monthAgo);
        setRequestEndDate(today);
        break;
      case 'customize':
        break;
      default:
        setRequestStartDate(null);
        setRequestEndDate(null);
        break;
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchEpickUsers();
  }, []);

  useEffect(() => {
    fetchEpickReports();
  }, [currentPage, pageSize, selectedUserId]);

  // Table columns
  const columns: TableColumn<EpickReport>[] = [
    {
      id: 'orderNumber',
      label: 'Order Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.orderNumber}
        </Typography>
      ),
    },
    {
      id: 'picker',
      label: 'Picker',
      minWidth: 150,
      render: (row) => (
        <Box>
          <Typography fontSize={14} fontWeight={400}>
            {row.pickerName || row.picker?.name || 'N/A'}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            ID: {row.pickerId || row.picker?.id || 'N/A'} | User #: {row.pickerUserNumber || row.picker?.userNumber || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'pickerEmail',
      label: 'Picker Email',
      minWidth: 180,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerEmail || row.picker?.email || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      minWidth: 150,
      render: (row) => (
        <Box>
          <Typography fontSize={14} fontWeight={400}>
            {row.customer?.customerName || 'N/A'}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            #{row.customer?.customerNumber || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'route',
      label: 'Route',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.customer?.route || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'stop',
      label: 'Stop',
      minWidth: 80,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.customer?.stop || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'startedAt',
      label: 'Started At',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDate(row.startedAt)}
        </Typography>
      ),
    },
    {
      id: 'completedAt',
      label: 'Completed At',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDate(row.completedAt)}
        </Typography>
      ),
    },
    {
      id: 'duration',
      label: 'Duration',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {calculateDuration(row.startedAt, row.completedAt)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleViewClick(row.orderNumber)}
              color="primary"
              sx={{ padding: '4px' }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton
              size="small"
              onClick={() => handleDownloadSingleOrder(row.orderNumber)}
              color="primary"
              disabled={downloadingOrder === row.orderNumber}
              sx={{ padding: '4px' }}
            >
              {downloadingOrder === row.orderNumber ? (
                <CircularProgress size={16} />
              ) : (
                <DownloadIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Order items table columns
  const orderItemsColumns: TableColumn<OrderItem>[] = [
    {
      id: 'lineNumber',
      label: 'Line #',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.lineNumber}
        </Typography>
      ),
    },
    {
      id: 'itemNumber',
      label: 'Item #',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.itemNumber}
        </Typography>
      ),
    },
    {
      id: 'itemDescription',
      label: 'Item Description',
      minWidth: 250,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 250, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
          title={row.itemDescription}
        >
          {row.itemDescription}
        </Typography>
      ),
    },
    {
      id: 'quantityOrdered',
      label: 'Qty Ordered',
      minWidth: 110,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.quantityOrdered}
        </Typography>
      ),
    },
    {
      id: 'quantityShipped',
      label: 'Qty Shipped',
      minWidth: 110,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.quantityShipped}
        </Typography>
      ),
    },
    {
      id: 'pack',
      label: 'Pack',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pack}
        </Typography>
      ),
    },
    {
      id: 'caseCount',
      label: 'Case Count',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.caseCount}
        </Typography>
      ),
    },
    {
      id: 'uom',
      label: 'UOM',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.uom}
        </Typography>
      ),
    },
    {
      id: 'section',
      label: 'Section',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.section || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'location',
      label: 'Location',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.location || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'price',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCurrency(row.price)}
        </Typography>
      ),
    },
    {
      id: 'netCost',
      label: 'Net Cost',
      minWidth: 100,
      align: 'right',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCurrency(row.netCost)}
        </Typography>
      ),
    },
    {
      id: 'invoiceCost',
      label: 'Invoice Cost',
      minWidth: 120,
      align: 'right',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatCurrency(row.invoiceCost)}
        </Typography>
      ),
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Chip 
          label={row.confirmed ? 'Yes' : 'No'} 
          size="small"
          color={row.confirmed ? 'success' : 'default'}
        />
      ),
    },
  ];

  // Override requests table columns (for modal - read-only with status)
  const overrideRequestsViewColumns: TableColumn<OverrideRequest>[] = [
    {
      id: 'requestId',
      label: 'Request ID',
      minWidth: 100,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.requestId}
        </Typography>
      ),
    },
    {
      id: 'orderNumber',
      label: 'Order Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.orderNumber}
        </Typography>
      ),
    },
    {
      id: 'itemNumber',
      label: 'Item Number',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.itemNumber}
        </Typography>
      ),
    },
    {
      id: 'itemDescription',
      label: 'Item Description',
      minWidth: 200,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
          title={row.itemDescription}
        >
          {row.itemDescription}
        </Typography>
      ),
    },
    // {
    //   id: 'pickerUserNumber',
    //   label: 'Picker User #',
    //   minWidth: 120,
    //   render: (row) => (
    //     <Typography fontSize={14} fontWeight={400}>
    //       {row.pickerUserNumber}
    //     </Typography>
    //   ),
    // },
    {
      id: 'userName',
      label: 'User Name',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.userName}
        </Typography>
      ),
    },
    {
      id: 'userEmail',
      label: 'Email',
      minWidth: 180,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.userEmail}
        </Typography>
      ),
    },
    {
      id: 'note',
      label: 'Note',
      minWidth: 200,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
          title={row.note || ''}
        >
          {row.note || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'rejectionReason',
      label: 'Rejection Reason',
      minWidth: 200,
      render: (row) => (
        <Typography 
          fontSize={14} 
          fontWeight={400}
          sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
          title={row.rejectionReason || ''}
        >
          {row.rejectionReason || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDateTime(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'qty',
      label: 'Qty',
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.qty || 0}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Chip 
          label={row.status ? row.status.toUpperCase() : 'N/A'} 
          size="small"
          color={
            row.status === 'approved' ? 'success' :
            row.status === 'rejected' ? 'error' :
            row.status === 'pending' ? 'warning' : 'default'
          }
        />
      ),
    },
  ];

  const getCheckerMetaValue = (row: CheckerActionLog, key: string): string | number => {
    if (!row.meta || typeof row.meta !== 'object' || Array.isArray(row.meta)) return 'N/A';
    const value = (row.meta as Record<string, unknown>)[key];
    return value === null || value === undefined || value === '' ? 'N/A' : String(value);
  };

  const checkerActionLogsColumns: TableColumn<CheckerActionLog>[] = [
    {
      id: 'createdAt',
      label: 'Action At',
      minWidth: 150,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {formatDateTime(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'checkerUserId',
      label: 'Checker User ID',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.checkerUserId}
        </Typography>
      ),
    },
    {
      id: 'actionType',
      label: 'Action Type',
      minWidth: 140,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.actionType ? row.actionType.replace(/_/g, ' ').toUpperCase() : 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'itemNumber',
      label: 'Item #',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.itemNumber ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'lineNumber',
      label: 'Line #',
      minWidth: 90,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.lineNumber ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'boxId',
      label: 'Box ID',
      minWidth: 90,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.boxId ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'deltaQty',
      label: 'Delta Qty',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.deltaQty ?? 0}
        </Typography>
      ),
    },
    {
      id: 'deltaBundles',
      label: 'Delta Bundles',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.deltaBundles ?? 0}
        </Typography>
      ),
    },
    {
      id: 'previousQty',
      label: 'Previous Qty',
      minWidth: 110,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'previousQty')}</Typography>,
    },
    {
      id: 'newQty',
      label: 'New Qty',
      minWidth: 100,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'newQty')}</Typography>,
    },
    {
      id: 'totalQtyShipped',
      label: 'Total Qty Shipped',
      minWidth: 130,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'totalQtyShipped')}</Typography>,
    },
    {
      id: 'sourceBoxId',
      label: 'Source Box',
      minWidth: 100,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'sourceBoxId')}</Typography>,
    },
    {
      id: 'destinationBoxId',
      label: 'Destination Box',
      minWidth: 120,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'destinationBoxId')}</Typography>,
    },
    {
      id: 'containerType',
      label: 'Container Type',
      minWidth: 120,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'containerType')}</Typography>,
    },
    {
      id: 'totalImages',
      label: 'Total Images',
      minWidth: 100,
      align: 'center',
      render: (row) => <Typography fontSize={14} fontWeight={400}>{getCheckerMetaValue(row, 'totalImages')}</Typography>,
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
      {/* Filter Section */}
      <Box sx={{ pl: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel id="user-filter-label">Filter by User</InputLabel>
          <Select
            labelId="user-filter-label"
            id="user-filter"
            value={selectedUserId}
            label="Filter by User"
            onChange={handleUserFilterChange}
            sx={{
              fontSize: '14px',
            }}
          >
            <MenuItem value="">
              <em>All Users</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { md: 'column', lg: 'row' }, justifyContent: { md: 'center', lg: 'flex-end' }, alignItems: { md: 'center', lg: 'flex-start' }, mr: { md: 0, lg: 2 } }}>
          <CustomButton
            appearance="filled"
            buttonType="primary"
            onClick={() => setDownloadModalOpen(true)}
            icon={<DownloadIcon />}
            iconPosition="left"
            sx={{ minWidth: 150, mt: 0 }}
            fullWidth={false}
          >
            Report
          </CustomButton>
          <CustomButton
            appearance="filled"
            buttonType="primary"
            onClick={() => setSummaryModalOpen(true)}
            icon={<DownloadIcon />}
            iconPosition="left"
            sx={{ minWidth: 150, mt: 0 }}
            fullWidth={false}
          >
            Summary Report
          </CustomButton>
          <CustomButton
            appearance="filled"
            buttonType="primary"
            onClick={() => setRequestModalOpen(true)}
            icon={<DownloadIcon />}
            iconPosition="left"
            sx={{ minWidth: 150, mt: 0 }}
            fullWidth={false}
          >
            Request Report
          </CustomButton>
        </Box>
      </Box>

      {/* Table */}
      <CommonTable
        data={reports}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 25, 50, 100]}
        showPageSizeSelector={true}
        showTotalItems={true}
        showPageNumbers={true}
        maxPageNumbers={5}
        stickyLastColumn={true}
        loading={loading}
        isPagination={true}
        containerHeight="calc(100vh - 400px)"
        emptyStateComponent={
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography color="text.secondary">No reports found</Typography>
          </Box>
        }
      />

      {/* View Order Details Modal */}
      <CommonModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setOrderDetails(null);
        }}
        size="xxl"
        title="Order Details"
      >
        <Box sx={{ p: 0 }}>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={2}>
              <Typography>Loading order details...</Typography>
            </Box>
          ) : !orderDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={2}>
              <Typography color="text.secondary">No order details found</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ maxHeight: '80vh', overflow: 'auto' }}>
                {/* Order Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
                    Order Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                    <Typography fontSize={13} color="text.secondary">
                      Order Number: <strong>{orderDetails.orderInfo.orderNumber}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Order Date: <strong>{formatDateModal(orderDetails.orderInfo.orderDate)}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Invoice Number: <strong>{orderDetails.orderInfo.invoiceNumber || 'N/A'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Invoice Total: <strong>{formatCurrency(orderDetails.orderInfo.invoiceTotal)}</strong>
                    </Typography>
                    {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker) && (orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.length > 0 ? (
                      <>
                        <Typography fontSize={13} color="text.secondary" sx={{ gridColumn: '1 / -1', mb: 0.5 }}>
                          <strong>Pickers ({(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.length}):</strong>
                        </Typography>
                        {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.map((picker, index) => (
                          <Box key={picker.pickerId || index} sx={{ gridColumn: '1 / -1', pl: 1, mb: 0.5, pb: 0.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                            <Typography fontSize={13} color="text.secondary">
                              Picker {index + 1}: <strong>{picker.pickerName || 'N/A'}</strong>
                            </Typography>
                            <Typography fontSize={12} color="text.secondary">
                              ID: {picker.pickerId} | User #: {picker.pickerUserNumber || 'N/A'} | Email: {picker.pickerEmail || 'N/A'}
                            </Typography>
                            {picker.startedAt && (
                              <Typography fontSize={12} color="text.secondary">
                                Started: {formatDateTime(picker.startedAt)} | Completed: {picker.completedAt ? formatDateTime(picker.completedAt) : 'N/A'}
                              </Typography>
                            )}
                            {(picker.totalLines !== undefined || picker.scannedLines !== undefined) && (
                              <Typography fontSize={12} color="text.secondary">
                                Lines: {picker.scannedLines || 0}/{picker.totalLines || 0} | Qty: {picker.scannedQty || 0}/{picker.totalQty || 0}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </>
                    ) : (
                      <>
                        <Typography fontSize={13} color="text.secondary">
                          Picker ID: <strong>{orderDetails.orderInfo.pickerId || 'N/A'}</strong>
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          Picker Name: <strong>{orderDetails.orderInfo.pickerName || 'N/A'}</strong>
                        </Typography>
                      </>
                    )}
                    <Typography fontSize={13} color="text.secondary">
                      Bundles: <strong>{orderDetails.orderInfo.bundles}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Totes: <strong>{orderDetails.orderInfo.totes}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Confirmed: <strong>{orderDetails.orderInfo.confirmed ? 'Yes' : 'No'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Started At: <strong>{formatDateTime(orderDetails.orderInfo.startedAt)}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Completed At: <strong>{formatDateTime(orderDetails.orderInfo.completedAt)}</strong>
                    </Typography>
                  </Box>
                  
                  <Typography fontSize={15} fontWeight={600} sx={{ mb: 1, mt: 1.5 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                    <Typography fontSize={13} color="text.secondary">
                      Customer Number: <strong>{orderDetails.orderInfo.customer.customerNumber}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Customer Name: <strong>{orderDetails.orderInfo.customer.customerName}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                      Address: <strong>{orderDetails.orderInfo.customer.address}, {orderDetails.orderInfo.customer.city}, {orderDetails.orderInfo.customer.state} {orderDetails.orderInfo.customer.zip}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Route: <strong>
                        {orderDetails.orderInfo.customer.route && orderDetails.orderInfo.customer.stop 
                          ? `R${orderDetails.orderInfo.customer.route}-S${orderDetails.orderInfo.customer.stop}`
                          : 'N/A'}
                      </strong>
                    </Typography>
                  </Box>

                  {/* Summary */}
                  {orderDetails.summary && (
                    <>
                      <Typography fontSize={15} fontWeight={600} sx={{ mb: 1, mt: 1.5 }}>
                        Summary
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1 }}>
                        <Typography fontSize={13} color="text.secondary">
                          Total Items Ordered: <strong>{orderDetails.summary.totalItemsOrdered}</strong>
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          Total Items Shipped: <strong>{orderDetails.summary.totalItemsShipped}</strong>
                        </Typography>
                        <Typography fontSize={13} color="text.secondary">
                          Total Items: <strong>{orderDetails.summary.totalItems}</strong>
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Checker Action Logs */}
                <Box sx={{ mb: 2 }}>
                  <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
                    Checker Action Logs ({orderDetails.checkerActionLogs?.length || 0})
                  </Typography>
                  {orderDetails.checkerSummary && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1 }}>
                      <Typography fontSize={13} color="text.secondary">
                        Qty Delta: <strong>{orderDetails.checkerSummary.totalQtyDeltaByChecker ?? 0}</strong>
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
                        Bundles Delta: <strong>{orderDetails.checkerSummary.totalBundlesDeltaByChecker ?? 0}</strong>
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
                        Photo Actions: <strong>{orderDetails.checkerSummary.photoActionsCount ?? 0}</strong>
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
                        Last Checker Action: <strong>{formatDateTime(orderDetails.checkerSummary.lastCheckerActionAt || '')}</strong>
                      </Typography>
                      <Typography fontSize={13} color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                        Checker Users: <strong>
                          {orderDetails.checkerSummary.checkerUserIds && orderDetails.checkerSummary.checkerUserIds.length > 0
                            ? orderDetails.checkerSummary.checkerUserIds.join(', ')
                            : 'N/A'}
                        </strong>
                      </Typography>
                    </Box>
                  )}
                  {orderDetails.checkerActionLogs && orderDetails.checkerActionLogs.length > 0 ? (
                    <CommonTable
                      data={orderDetails.checkerActionLogs}
                      columns={checkerActionLogsColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={orderDetails.checkerActionLogs.length}
                      pageSize={orderDetails.checkerActionLogs.length}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      loading={false}
                      isPagination={false}
                      stickyLastColumn={true}
                      containerHeight="auto"
                      emptyStateComponent={
                        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                          <Typography color="text.secondary">No checker action logs found</Typography>
                        </Box>
                      }
                    />
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                      <Typography color="text.secondary">No checker action logs found</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Group by Picker if allPickers or allPicker exists */}
                {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker) && (orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.length > 0 ? (
                  <>
                    {(orderDetails.orderInfo.allPickers || orderDetails.orderInfo.allPicker)!.map((picker, pickerIndex) => {
                      // Use picker's own orderItems and overrideRequests if available, otherwise filter by pickerId
                      const pickerItems = picker.orderItems || orderDetails.orderItems?.filter((item) => 
                        item.pickerId === picker.pickerId
                      ) || [];
                      
                      // Use picker's overrideRequests if it exists and has items, otherwise filter from orderDetails
                      const pickerRequests = (picker.overrideRequests && picker.overrideRequests.length > 0) 
                        ? picker.overrideRequests 
                        : orderDetails.overrideRequests?.filter((req) => {
                            // Match by pickerId - this is the primary matching criteria
                            if (req.pickerId !== undefined && picker.pickerId !== undefined) {
                              return req.pickerId === picker.pickerId;
                            }
                            // Fallback to pickerUserNumber matching if pickerId is not available
                            return req.pickerUserNumber === picker.pickerUserNumber;
                          }) || [];

                      return (
                        <Box key={picker.pickerId || pickerIndex} sx={{ mb: 2 }}>
                          {/* Picker Header Section */}
                          <Box sx={{ 
                            p: 1, 
                            mb: 1.5, 
                            borderLeft: '3px solid',
                            borderColor: 'primary.main'
                          }}>
                            <Typography fontSize={16} fontWeight={600} sx={{ mb: 0.25 }}>
                              Picker {pickerIndex + 1}: {picker.pickerName || 'N/A'}
                            </Typography>
                            <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.25 }}>
                              ID: {picker.pickerId} | User #: {picker.pickerUserNumber || 'N/A'} | Email: {picker.pickerEmail || 'N/A'}
                            </Typography>
                            {picker.startedAt && (
                              <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.25 }}>
                                Started: {formatDateTime(picker.startedAt)} | Completed: {picker.completedAt ? formatDateTime(picker.completedAt) : 'N/A'}
                              </Typography>
                            )}
                            {(picker.totalLines !== undefined || picker.scannedLines !== undefined) && (
                              <Typography fontSize={12} color="text.secondary">
                                Lines: {picker.scannedLines || 0}/{picker.totalLines || 0} | Qty: {picker.scannedQty || 0}/{picker.totalQty || 0}
                              </Typography>
                            )}
                          </Box>

                          {/* Override Requests for this picker */}
                          <Box sx={{ mb: 2 }}>
                            <Typography fontSize={14} fontWeight={600} sx={{ mb: 1 }}>
                              Override Requests ({pickerRequests.length})
                            </Typography>
                            {pickerRequests.length > 0 ? (
                              <CommonTable
                                data={pickerRequests}
                                columns={overrideRequestsViewColumns}
                                currentPage={1}
                                totalPages={1}
                                totalItems={pickerRequests.length}
                                pageSize={pickerRequests.length}
                                onPageChange={() => {}}
                                onPageSizeChange={() => {}}
                                loading={false}
                                isPagination={false}
                                stickyLastColumn={true}
                                containerHeight="auto"
                                emptyStateComponent={
                                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                                    <Typography color="text.secondary">No override requests found</Typography>
                                  </Box>
                                }
                              />
                            ) : (
                              <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                                <Typography color="text.secondary">No override requests found for this picker</Typography>
                              </Box>
                            )}
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          {/* Order Items for this picker */}
                          <Box sx={{ mb: 2 }}>
                            <Typography fontSize={14} fontWeight={600} sx={{ mb: 1 }}>
                              Order Items ({pickerItems.length})
                            </Typography>
                            {pickerItems.length > 0 ? (
                              <CommonTable
                                data={pickerItems}
                                columns={orderItemsColumns}
                                currentPage={1}
                                totalPages={1}
                                totalItems={pickerItems.length}
                                pageSize={pickerItems.length}
                                onPageChange={() => {}}
                                onPageSizeChange={() => {}}
                                loading={false}
                                isPagination={false}
                                stickyLastColumn={true}
                                containerHeight="auto"
                                emptyStateComponent={
                                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                                    <Typography color="text.secondary">No order items found</Typography>
                                  </Box>
                                }
                              />
                            ) : (
                              <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                                <Typography color="text.secondary">No order items found for this picker</Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Override Requests Table - All */}
                    <Box sx={{ mb: 2 }}>
                      <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
                        Override Requests ({orderDetails.overrideRequests?.length || 0})
                      </Typography>
                      {orderDetails.overrideRequests && orderDetails.overrideRequests.length > 0 ? (
                        <CommonTable
                          data={orderDetails.overrideRequests}
                          columns={overrideRequestsViewColumns}
                          currentPage={1}
                          totalPages={1}
                          totalItems={orderDetails.overrideRequests.length}
                          pageSize={orderDetails.overrideRequests.length}
                          onPageChange={() => {}}
                          onPageSizeChange={() => {}}
                          loading={false}
                          isPagination={false}
                          stickyLastColumn={true}
                          containerHeight="auto"
                          emptyStateComponent={
                            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                              <Typography color="text.secondary">No override requests found</Typography>
                            </Box>
                          }
                        />
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                          <Typography color="text.secondary">No override requests found</Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Order Items Table - All */}
                    <Box sx={{ mb: 2 }}>
                      <Typography fontSize={15} fontWeight={600} sx={{ mb: 1 }}>
                        Order Items ({orderDetails.orderItems?.length || 0})
                      </Typography>
                      {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
                        <CommonTable
                          data={orderDetails.orderItems}
                          columns={orderItemsColumns}
                          currentPage={1}
                          totalPages={1}
                          totalItems={orderDetails.orderItems.length}
                          pageSize={orderDetails.orderItems.length}
                          onPageChange={() => {}}
                          onPageSizeChange={() => {}}
                          loading={false}
                          isPagination={false}
                          stickyLastColumn={true}
                          containerHeight="auto"
                          emptyStateComponent={
                            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                              <Typography color="text.secondary">No order items found</Typography>
                            </Box>
                          }
                        />
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                          <Typography color="text.secondary">No order items found</Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Box>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 1.5 }}>
                <CustomButton
                  appearance="outlined"
                  buttonType="cancel"
                  onClick={() => {
                    setViewModalOpen(false);
                    setOrderDetails(null);
                  }}
                  fullWidth={false}
                  sx={{ minWidth: 100 }}
                >
                  Close
                </CustomButton>
              </Box>
            </Box>
          )}
        </Box>
      </CommonModal>

      {/* Download Report Modal */}
      <CommonModal
        open={downloadModalOpen}
        onClose={() => {
          setDownloadModalOpen(false);
          setDownloadUserId('');
          setDateFilter('none');
          setStartDate(null);
          setEndDate(null);
        }}
        size={dateFilter === 'customize' ? 'lg' : 'md'}
        title="Download Report"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* User Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel id="download-user-label">Select User</InputLabel>
            <Select
              labelId="download-user-label"
              id="download-user"
              value={downloadUserId}
              label="Select User"
              onChange={(e) => setDownloadUserId(e.target.value as number | '')}
              sx={{
                fontSize: '14px',
              }}
            >
              <MenuItem value="">
                <em>All Users</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Filter Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel id="date-filter-label">Date Filter</InputLabel>
            <Select
              labelId="date-filter-label"
              id="date-filter"
              value={dateFilter}
              label="Date Filter"
              onChange={(e) => handleDateFilterChange(e.target.value)}
              sx={{
                fontSize: '14px',
              }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="customize">Customize Date</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Range */}
          {dateFilter === 'customize' && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <CustomDatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      // If end date is before new start date, update end date
                      if (date && endDate && endDate.isBefore(date)) {
                        setEndDate(date);
                      }
                    }}
                    sx={{ mb: 0 }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 0 }}>
                    <Typography
                      fontSize={14}
                      fontWeight={600}
                      mb={"5px"}
                      sx={{ opacity: "70%" }}
                    >
                      End Date
                    </Typography>
                    <DatePicker
                      value={endDate}
                      onChange={(date: Dayjs | null) => setEndDate(date)}
                      minDate={startDate || undefined}
                      slotProps={{
                        textField: {
                          label: "",
                          fullWidth: true,
                          size: "small",
                          variant: "outlined",
                          sx: {
                            fontSize: "12px",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              "& fieldset": {
                                borderColor: "#ccc",
                              },
                              "&:hover fieldset": {
                                borderColor: "#1976d2",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#1976d2",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </LocalizationProvider>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setDownloadModalOpen(false);
                setDownloadUserId('');
                setDateFilter('none');
                setStartDate(null);
                setEndDate(null);
              }}
              fullWidth={false}
              sx={{ minWidth: 100, mt: 0 }}
              disabled={downloading}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="primary"
              onClick={handleDownloadReport}
              fullWidth={false}
              sx={{ minWidth: 120, mt: 0 }}
              disabled={downloading || (dateFilter === 'customize' && (!startDate || !endDate))}
              loading={downloading}
            >
              Download
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Summary Report Modal */}
      <CommonModal
        open={summaryModalOpen}
        onClose={() => {
          setSummaryModalOpen(false);
          setSummaryUserId('');
          setSummaryDateFilter('none');
          setSummaryStartDate(null);
          setSummaryEndDate(null);
        }}
        size={summaryDateFilter === 'customize' ? 'lg' : 'md'}
        title="Download Summary Report"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* User Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel id="summary-user-label">Select User</InputLabel>
            <Select
              labelId="summary-user-label"
              id="summary-user"
              value={summaryUserId}
              label="Select User"
              onChange={(e) => setSummaryUserId(e.target.value as number | '')}
              sx={{
                fontSize: '14px',
              }}
            >
              <MenuItem value="">
                <em>All Users</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Filter Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel id="summary-date-filter-label">Date Filter</InputLabel>
            <Select
              labelId="summary-date-filter-label"
              id="summary-date-filter"
              value={summaryDateFilter}
              label="Date Filter"
              onChange={(e) => handleSummaryDateFilterChange(e.target.value)}
              sx={{
                fontSize: '14px',
              }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="customize">Customize Date</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Range */}
          {summaryDateFilter === 'customize' && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <CustomDatePicker
                    label="Start Date"
                    value={summaryStartDate}
                    onChange={(date) => {
                      setSummaryStartDate(date);
                      if (date && summaryEndDate && summaryEndDate.isBefore(date)) {
                        setSummaryEndDate(date);
                      }
                    }}
                    sx={{ mb: 0 }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 0 }}>
                    <Typography
                      fontSize={14}
                      fontWeight={600}
                      mb={"5px"}
                      sx={{ opacity: "70%" }}
                    >
                      End Date
                    </Typography>
                    <DatePicker
                      value={summaryEndDate}
                      onChange={(date: Dayjs | null) => setSummaryEndDate(date)}
                      minDate={summaryStartDate || undefined}
                      slotProps={{
                        textField: {
                          label: "",
                          fullWidth: true,
                          size: "small",
                          variant: "outlined",
                          sx: {
                            fontSize: "12px",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              "& fieldset": {
                                borderColor: "#ccc",
                              },
                              "&:hover fieldset": {
                                borderColor: "#1976d2",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#1976d2",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </LocalizationProvider>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setSummaryModalOpen(false);
                setSummaryUserId('');
                setSummaryDateFilter('none');
                setSummaryStartDate(null);
                setSummaryEndDate(null);
              }}
              fullWidth={false}
              sx={{ minWidth: 100, mt: 0 }}
              disabled={downloadingSummary}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="primary"
              onClick={handleDownloadSummaryReport}
              fullWidth={false}
              sx={{ minWidth: 120, mt: 0 }}
              disabled={downloadingSummary || (summaryDateFilter === 'customize' && (!summaryStartDate || !summaryEndDate))}
              loading={downloadingSummary}
            >
              Download
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>

      {/* Request Report Modal */}
      <CommonModal
        open={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setRequestUserId('');
          setRequestDateFilter('none');
          setRequestStartDate(null);
          setRequestEndDate(null);
        }}
        size={requestDateFilter === 'customize' ? 'lg' : 'md'}
        title="Download Request Report"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* User Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel id="request-user-label">Select User</InputLabel>
            <Select
              labelId="request-user-label"
              id="request-user"
              value={requestUserId}
              label="Select User"
              onChange={(e) => setRequestUserId(e.target.value as number | '')}
              sx={{
                fontSize: '14px',
              }}
            >
              <MenuItem value="">
                <em>All Users</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Filter Selection */}
          <FormControl size="small" fullWidth>
            <InputLabel id="request-date-filter-label">Date Filter</InputLabel>
            <Select
              labelId="request-date-filter-label"
              id="request-date-filter"
              value={requestDateFilter}
              label="Date Filter"
              onChange={(e) => handleRequestDateFilterChange(e.target.value)}
              sx={{
                fontSize: '14px',
              }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="customize">Customize Date</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Range */}
          {requestDateFilter === 'customize' && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <CustomDatePicker
                    label="Start Date"
                    value={requestStartDate}
                    onChange={(date) => {
                      setRequestStartDate(date);
                      if (date && requestEndDate && requestEndDate.isBefore(date)) {
                        setRequestEndDate(date);
                      }
                    }}
                    sx={{ mb: 0 }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 0 }}>
                    <Typography
                      fontSize={14}
                      fontWeight={600}
                      mb={"5px"}
                      sx={{ opacity: "70%" }}
                    >
                      End Date
                    </Typography>
                    <DatePicker
                      value={requestEndDate}
                      onChange={(date: Dayjs | null) => setRequestEndDate(date)}
                      minDate={requestStartDate || undefined}
                      slotProps={{
                        textField: {
                          label: "",
                          fullWidth: true,
                          size: "small",
                          variant: "outlined",
                          sx: {
                            fontSize: "12px",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                              "& fieldset": {
                                borderColor: "#ccc",
                              },
                              "&:hover fieldset": {
                                borderColor: "#1976d2",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "#1976d2",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </LocalizationProvider>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <CustomButton
              appearance="outlined"
              buttonType="cancel"
              onClick={() => {
                setRequestModalOpen(false);
                setRequestUserId('');
                setRequestDateFilter('none');
                setRequestStartDate(null);
                setRequestEndDate(null);
              }}
              fullWidth={false}
              sx={{ minWidth: 100, mt: 0 }}
              disabled={downloadingRequest}
            >
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              buttonType="primary"
              onClick={handleDownloadRequestReport}
              fullWidth={false}
              sx={{ minWidth: 120, mt: 0 }}
              disabled={downloadingRequest || (requestDateFilter === 'customize' && (!requestStartDate || !requestEndDate))}
              loading={downloadingRequest}
            >
              Download
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default EpickReportsTab;



