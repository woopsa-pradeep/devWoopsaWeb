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
  pickerUserNumber: number;
  picker: Picker;
  customer: Customer;
  startedAt: string;
  completedAt: string;
}

interface OverrideRequest {
  requestId: number;
  orderNumber: number;
  itemNumber: number;
  itemDescription: string;
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
  };
  orderItems: OrderItem[];
  overrideRequests: OverrideRequest[];
  summary: {
    totalItemsOrdered: number;
    totalItemsShipped: number;
    totalItems: number;
  };
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
      
      let reportsData: EpickReport[] = [];
      let total = 0;
      
      if (response?.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          reportsData = response.data.data;
          total = response.data.totalCount || 0;
        } else if (Array.isArray(response.data)) {
          reportsData = response.data;
        }
      }
      
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

      // Right side: Picker and Customer details
      const pickerName = order.picker 
        ? `${order.picker.firstName || ''} ${order.picker.lastName || ''}`.trim() || order.picker.email || 'N/A'
        : 'N/A';
      const customerName = order.customer?.C_Name || order.customer?.customerName || 'N/A';
      const customerNumber = order.customer?.C_Number || order.customer?.customerNumber || 'N/A';
      const routeInfo = order.customer?.Routes?.[0]
        ? `Route: ${order.customer.Routes[0].Route_Number || ''}, Stop: ${order.customer.Routes[0].Stop_Number || ''}`
        : '';

      const orderRightX = pageWidth - margin;
      let rightY = orderRightY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Picker:', orderRightX, rightY, { align: 'right' });
      rightY += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(pickerName, orderRightX, rightY, { align: 'right' });
      rightY += 6;

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

      // Process order items for category summary
      const categoryGroups: { [key: string]: any[] } = {};

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

      // Sales Category Summary
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Dark divider before Sales Category Summary
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

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

        // Right side: Picker and Customer details
        const pickerName = order.picker 
          ? `${order.picker.firstName || ''} ${order.picker.lastName || ''}`.trim() || order.picker.email || 'N/A'
          : 'N/A';
        const customerName = order.customer?.C_Name || order.customer?.customerName || 'N/A';
        const customerNumber = order.customer?.C_Number || order.customer?.customerNumber || 'N/A';
        const routeInfo = order.customer?.Routes?.[0]
          ? `Route: ${order.customer.Routes[0].Route_Number || ''}, Stop: ${order.customer.Routes[0].Stop_Number || ''}`
          : '';

        const orderRightX = pageWidth - margin;
        let rightY = orderRightY;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Picker:', orderRightX, rightY, { align: 'right' });
        rightY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(pickerName, orderRightX, rightY, { align: 'right' });
        rightY += 6;

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
        const pickerName = order.picker 
          ? `${order.picker.firstName || ''} ${order.picker.lastName || ''}`.trim() || order.picker.email || 'N/A'
          : 'N/A';
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
            {row.picker?.name || 'N/A'}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            #{row.picker?.userNumber || 'N/A'}
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
          {row.picker?.email || 'N/A'}
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
    {
      id: 'pickerUserNumber',
      label: 'Picker User #',
      minWidth: 120,
      render: (row) => (
        <Typography fontSize={14} fontWeight={400}>
          {row.pickerUserNumber}
        </Typography>
      ),
    },
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
        size="xl"
        title="Order Details"
      >
        <Box>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography>Loading order details...</Typography>
            </Box>
          ) : !orderDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <Typography color="text.secondary">No order details found</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ maxHeight: '70vh', overflow: 'auto', pr: 2 }}>
                {/* Order Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography fontSize={16} fontWeight={600} sx={{ mb: 2 }}>
                    Order Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
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
                    <Typography fontSize={13} color="text.secondary">
                      Picker ID: <strong>{orderDetails.orderInfo.pickerId || 'N/A'}</strong>
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Picker Name: <strong>{orderDetails.orderInfo.pickerName || 'N/A'}</strong>
                    </Typography>
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
                  
                  <Typography fontSize={14} fontWeight={600} sx={{ mb: 1, mt: 2 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
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
                      <Typography fontSize={14} fontWeight={600} sx={{ mb: 1, mt: 2 }}>
                        Summary
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
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

                <Divider sx={{ my: 3 }} />

                {/* Override Requests Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography fontSize={16} fontWeight={600} sx={{ mb: 2 }}>
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
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                      <Typography color="text.secondary">No override requests found</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Order Items Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography fontSize={16} fontWeight={600} sx={{ mb: 2 }}>
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
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                      <Typography color="text.secondary">No order items found</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
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

