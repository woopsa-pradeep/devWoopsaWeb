// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Stack,
  Button,
  IconButton,
  Fade,
  Grow,
  // useMediaQuery,
  alpha,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  ResponsiveContainer,
  // AreaChart,
  // Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import DashboardCard from "../../../component/atoms/dashboard/DashboardCard";
import DashboardTable, {
  TableColumn,
} from "../../../component/atoms/dashboard/DashboardTable";
import RetailersIcon from "../../../assets/retailerGlobalActive.svg";
import ItemsIcon from "../../../assets/Menu Icon (2).svg";
import OrdersIcon from "../../../assets/orderItems.svg";
import { getDistributorDashboard, getEpickDashboard, getHighDemandItems } from "../../../redux/apis/dashboardApis";
import { getShortShipmentReport } from "../../../redux/apis/distrubutor/listApis";
import { getCurrentOrderStatusReport, getCurrentOrderDetailStatus, getInvoiceRegister } from "../../../redux/apis/distrubutor/reportsApis";
import { useNavigate } from "react-router-dom";
import CustomDatePicker from "../../../component/atoms/CustomDatePicker";
import dayjs from "dayjs";
import LoadingSpinner from "../../../component/atoms/loader/LoadingSpinner";
import ClearIcon from "@mui/icons-material/Clear";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CommonModal from "../../../component/atoms/CommonModal";
import { PictureAsPdf as PdfIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import jsPDF from "jspdf";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jspdfAutoTable = require("jspdf-autotable");
// eslint-disable-next-line @typescript-eslint/no-require-imports
import rabbitLogo from "../../../assets/Rabbit.svg";
import toast from "react-hot-toast";
// import TrendingUpIcon from "@mui/icons-material/TrendingUp";
// import StoreIcon from "@mui/icons-material/Store";
// import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
// import PeopleIcon from "@mui/icons-material/People";

interface DashboardData {
  summary: {
    totalActiveCustomer: number;
    totalCustomer: number;
    totalInactiveCustomer: number;
    totalOrder: number;
  };
  returnOrder?: number;
  orderByUser: {
    sales: number;
    retailer: number;
  };
  orderPlatform: {
    Mobile: number;
    Web: number;
    ERP: number;
  };
  highDemandProducts: Array<{
    Item_Number: number;
    totalQuantityOrdered: number;
    orderCount: number;
    inventory: {
      Item_Number: number;
      Description: string;
      Pack: number;
      CaseCount: number;
      UOM: string;
    };
  }>;
  result: Array<{
    S_Number: number;
    S_Desc: string;
    totalOrders: number;
    totalInvoiceTotal: number;
  }>;
  userPerformance?: Array<{
    userName: string;
    order_Count: number;
    totalInvoiceTotal: number;
  }>;
}

interface EpickDashboardData {
  orderStatistics: {
    totalOrders: number;
    totalOrdersFromHeader: number;
    totalCompletedOrders: number;
    completedByEpick: number;
    pendingFromEpick: number;
    totalCheckerOrders: number;
    ordersCompletedByChecker: number;
  };
  scanningStatistics: {
    totalScannedItems: number;
    totalScannedLines: number;
    totalTimeSeconds: number;
    totalTimeFormatted: string;
  };
  overrideRequestStatistics: {
    totalRequests: number;
    totalAcceptedRequests: number;
    totalRejectedRequests: number;
  };
  pickerWiseOrders: Array<{
    pickerId: number;
    pickerName: string;
    totalCompletedOrders: number;
    averageOrderTime: {
      averageTimeSeconds: number;
      averageTimeFormatted: string;
    };
    averageTimePerQuantity: {
      secondsPerQty: number;
      formatted: string;
    };
    totalScannedQuantity: number;
    totalScannedLines?: number;
    totalOverrideRequests: number;
    totalRequests?: number;
    totalAcceptedRequests?: number;
    totalRejectedRequests?: number;
    totalTimeFormatted?: string;
  }>;
  averageOrderTime: {
    averageTimeSeconds: number;
    averageTimeFormatted: string;
    averageTimePerQuantity: {
      secondsPerQty: number;
      formatted: string;
    };
  };
  dateRange: {
    fromDate: string;
    toDate: string;
  };
}

interface CurrentOrderStatusReportOrder {
  Order_Number: number;
  Invoice_Number?: number;
  Invoice_Date?: string;
  Invoice_Total?: number;
  Picklist_Printed?: boolean;
  Order_Date?: string;
  Delivery_Date?: string;
  Order_Source?: number;
  C_Number?: number;
  S_Number?: number;
  Route_Number?: number;
  Stop_Number?: number;
  Invoice_Number_Legacy?: number;
  Document_Number?: string;
  total_item_quantity?: number;
  total_line_number?: number;
  customer?: { C_Number?: number; C_Name?: string; C_CoName?: string; C_Address?: string; C_City?: string; C_State?: string; C_Zip?: string; C_PhoneMobile?: string };
  salesRep?: { S_Number?: number; S_Desc?: string };
  repName?: string;
  sourceName?: string;
}

interface CurrentOrderStatusReport {
  invoices: CurrentOrderStatusReportOrder[];
  non_invoices: CurrentOrderStatusReportOrder[];
  picklist: CurrentOrderStatusReportOrder[];
  orderConfirmation: CurrentOrderStatusReportOrder[];
  recordLocks: CurrentOrderStatusReportOrder[];
}

const AdminDashboard = () => {
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [epickData, setEpickData] = useState<EpickDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [epickLoading, setEpickLoading] = useState(false);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["Mobile", "Web", "ERP", "Return Order"])
  );
  const [costType, setCostType] = useState<string>("base");
  const [highDemandViewMode, setHighDemandViewMode] = useState<"table" | "graph">("table");
  const [pickerViewMode, setPickerViewMode] = useState<"table" | "graph">("table");
  const [salesPerformanceViewMode, setSalesPerformanceViewMode] = useState<"table" | "graph">("table");
  const [lossQtyViewMode, setLossQtyViewMode] = useState<"table" | "graph">("table");
  const [lossQtyFullData, setLossQtyFullData] = useState<any[]>([]);
  const [lossQtyLoading, setLossQtyLoading] = useState(false);
  const [lossQtyModalOpen, setLossQtyModalOpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [lossQtyModalPage, setLossQtyModalPage] = useState(1);
  const [lossQtyModalPageSize, setLossQtyModalPageSize] = useState(50);
  const wareHouseDetail = useSelector((state: RootState) => state.auth.wareHouseDetail);
  const [userPerformanceViewMode, setUserPerformanceViewMode] = useState<"table" | "graph">("table");
  const [currentOrderStatusData, setCurrentOrderStatusData] = useState<CurrentOrderStatusReport | null>(null);
  const [currentOrderStatusLoading, setCurrentOrderStatusLoading] = useState(false);
  const [currentOrderStatusViewMode, setCurrentOrderStatusViewMode] = useState<Partial<Record<keyof CurrentOrderStatusReport, "table" | "graph">>>({});
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [orderDetailModalData, setOrderDetailModalData] = useState<any[]>([]);
  const [invoiceRegisterData, setInvoiceRegisterData] = useState<any[]>([]);
  const [invoiceRegisterLoading, setInvoiceRegisterLoading] = useState(false);
  const [orderDetailModalLoading, setOrderDetailModalLoading] = useState(false);
  const [orderDetailModalOrderId, setOrderDetailModalOrderId] = useState<number | string | null>(null);
  const navigate = useNavigate();
  const [averageTimePerQtyViewMode, setAverageTimePerQtyViewMode] = useState<"table" | "graph">("graph");
  const [scannedQtyViewMode, setScannedQtyViewMode] = useState<"table" | "graph">("graph");
  const [scanningStatsViewMode, setScanningStatsViewMode] = useState<"table" | "graph">("graph");
  const [overrideStatsViewMode, setOverrideStatsViewMode] = useState<"table" | "graph">("graph");
  const [highDemandFullData, setHighDemandFullData] = useState<any[]>([]);
  const [highDemandLoading, setHighDemandLoading] = useState(false);
  const [highDemandModalOpen, setHighDemandModalOpen] = useState(false);
  const [highDemandModalPage, setHighDemandModalPage] = useState(1);
  const [highDemandModalPageSize, setHighDemandModalPageSize] = useState(50);
  const [generatingHighDemandPDF, setGeneratingHighDemandPDF] = useState(false);
  const [highDemandSortField, setHighDemandSortField] = useState<string | null>('quantity');
  const [highDemandSortDirection, setHighDemandSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if ((startDate && endDate) || (!startDate && !endDate)) {
      fetchDashboardData();
    }
  }, [startDate, endDate, costType]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setEpickLoading(true);
      const [dashboardRes, epickRes]: any = await Promise.all([
        getDistributorDashboard({
          fromDate: startDate?.format("YYYY-MM-DD") || "",
          toDate: endDate?.format("YYYY-MM-DD") || "",
          costType: costType,
        }),
        getEpickDashboard({
          fromDate: startDate?.format("YYYY-MM-DD") || "",
          toDate: endDate?.format("YYYY-MM-DD") || "",
        }),
      ]);
      setDashboardData(dashboardRes.data);
      setEpickData(epickRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setEpickLoading(false);
    }
  };

  const fetchLossQtyData = async () => {
    try {
      setLossQtyLoading(true);
      const params: any = {};
      
      // Only add dates if both are selected
      if (startDate && endDate) {
        params.fromDate = startDate.format("MM-DD-YYYY");
        params.toDate = endDate.format("MM-DD-YYYY");
      }
      
      const response = await getShortShipmentReport(params) as any;
      
      // Handle API response structure: { success: true, message: "...", data: { rows: [...] } }
      const rows = response?.data?.data?.rows || response?.data?.rows || response?.rows || [];
      // Store full data; merging by product is done in lossQtyMergedData useMemo
      setLossQtyFullData(rows);
    } catch (error) {
      console.error("Error fetching loss quantity data:", error);
    } finally {
      setLossQtyLoading(false);
    }
  };
  useEffect(() => {
    fetchLossQtyData();
  }, [startDate, endDate]);

  const fetchCurrentOrderStatus = async () => {
    try {
      setCurrentOrderStatusLoading(true);
      const start = startDate?.format("YYYY-MM-DD") || "";
      const end = endDate?.format("YYYY-MM-DD") || "";
      const response = await getCurrentOrderStatusReport(start, end) as any;
      const raw = response?.data?.data ?? response?.data ?? response ?? {};
      setCurrentOrderStatusData({
        invoices: Array.isArray(raw.invoices) ? raw.invoices : [],
        non_invoices: Array.isArray(raw.non_invoices) ? raw.non_invoices : [],
        picklist: Array.isArray(raw.picklist) ? raw.picklist : [],
        orderConfirmation: Array.isArray(raw.orderConfirmation) ? raw.orderConfirmation : [],
        recordLocks: Array.isArray(raw.recordLocks) ? raw.recordLocks : [],
      });
    } catch (error) {
      console.error("Error fetching current order status:", error);
      setCurrentOrderStatusData(null);
    } finally {
      setCurrentOrderStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentOrderStatus();
  }, [startDate, endDate]);

  const handleOpenOrderDetail = async (orderId: number | string) => {
    setOrderDetailModalOrderId(orderId);
    setOrderDetailModalOpen(true);
    setOrderDetailModalData([]);
    setOrderDetailModalLoading(true);
    try {
      const response = await getCurrentOrderDetailStatus(orderId) as any;
      const items = response?.data?.data ?? response?.data ?? response ?? [];
      setOrderDetailModalData(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching order detail:", error);
      toast.error("Failed to load order details");
      setOrderDetailModalData([]);
    } finally {
      setOrderDetailModalLoading(false);
    }
  };

  const handleCloseOrderDetailModal = () => {
    setOrderDetailModalOpen(false);
    setOrderDetailModalOrderId(null);
    setOrderDetailModalData([]);
  };

  // Format amount for Invoice Register: negative in parentheses, 2 decimals
  const formatInvoiceAmount = (n: number): string => {
    const x = Number(n) || 0;
    if (x < 0) return `(${Math.abs(x).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Generate Invoice Register PDF and open print dialog (all users or filtered by userName)
  const generateInvoiceRegisterPDFAndPrint = async (data: any[], filterByUserName?: string | null) => {
    const rows = filterByUserName ? data.filter((r: any) => (r.userName ?? "") === filterByUserName) : data;
    if (rows.length === 0) {
      toast.error("No invoice register data to generate report");
      return;
    }

    const logoDataUrl = await loadLogoAsDataUrl();
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const distributor = wareHouseDetail?.[0];
    const distributorName = distributor?.D_Name || "";
    const distributorAddress = [
      distributor?.D_Addr1,
      distributor?.D_City,
      distributor?.D_State,
    ]
      .filter(Boolean)
      .join(", ");
    const distributorPhone = distributor?.D_Phone || "";

    const addFirstPageHeader = (_pageNum: number) => {
      const rightX = pageWidth - margin;
      let leftY = 8;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      // Left: warehouse / company details only
      if (distributorName) {
        doc.setFont("helvetica", "bold");
        doc.text(distributorName, margin, leftY);
        leftY += 4;
      }
      if (distributorAddress) {
        doc.setFont("helvetica", "normal");
        doc.text(distributorAddress, margin, leftY);
        leftY += 4;
      }
      if (distributorPhone) doc.text(distributorPhone, margin, leftY);

      // Right: date, title, Lane / User (all dates MM/DD/YYYY)
      const reportDate = dayjs().format("MM/DD/YYYY");
      doc.setFontSize(8);
      doc.text(reportDate, rightX, 8, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Register (User Totals)", rightX, 13, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const scopeText = filterByUserName ? `User = ${filterByUserName}` : "User = All";
      doc.text(scopeText, rightX, 18, { align: "right" });
    };

    const addFooterToPage = (_pageNum: number) => {
      const footerY = pageHeight - 8;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const text = "Report generated by Woopsa";
      doc.text(text, margin, footerY);
      if (logoDataUrl) {
        try {
          const tw = doc.getTextWidth(text);
          doc.addImage(logoDataUrl, "PNG", margin + tw + 1.5, footerY - 3, 4, 4);
        } catch {
          // ignore
        }
      }
    };

    const headers = [
      "doc #",
      "Date",
      "User",
      "Lane",
      "Customer Number / Name",
      "Amount",
      "Cash",
      "Check",
      "Credit",
      "Other",
      "House Charge",
    ];

    const groupByUser = new Map<string, any[]>();
    for (const r of rows) {
      const key = r.userName ?? String(r.User_ID ?? "");
      if (!groupByUser.has(key)) groupByUser.set(key, []);
      groupByUser.get(key)!.push(r);
    }

    type TableCell = string | number | { content: string; colSpan?: number; styles?: Record<string, unknown> };
    const bodyRows: TableCell[][] = [];
    const totalsRowIndices: number[] = [];
    let grandAmount = 0,
      grandCash = 0,
      grandCheck = 0,
      grandCredit = 0,
      grandOther = 0,
      grandHouse = 0;

    const custName = (r: any) => {
      const num = r.C_Number ?? r["customer.C_Number"];
      const name = r["customer.C_Name"] ?? "";
      return name ? `${num || ""} ${name}`.trim() : (num ?? "-") + "";
    };

    const userSectionRowIndices: number[] = [];
    for (const [userName, userRows] of Array.from(groupByUser.entries())) {
      userSectionRowIndices.push(bodyRows.length);
      bodyRows.push([
        {
          content: `USER: ${userName || "-"}`,
          colSpan: 11,
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
      ]);
      let sumAmount = 0,
        sumCash = 0,
        sumCheck = 0,
        sumCredit = 0,
        sumOther = 0,
        sumHouse = 0;
      for (const r of userRows) {
        const amt = Number(r.Invoice_Total) || 0;
        const cash = Number(r.POS_Cash) || 0;
        const check = Number(r.POS_Check) || 0;
        const credit = Number(r.POS_Credit) || 0;
        const other = Number(r.POS_Other) || 0;
        const house = Number(r.POS_House) || 0;
        sumAmount += amt;
        sumCash += cash;
        sumCheck += check;
        sumCredit += credit;
        sumOther += other;
        sumHouse += house;
        const dateStr = r.Invoice_Date ? dayjs(r.Invoice_Date).format("MM/DD/YYYY") : "-";
        bodyRows.push([
          r.Document_Number ?? r.Order_Number ?? "-",
          dateStr,
          r.userName ?? r.User_ID ?? "-",
          r.Workstation_ID ?? r.workstationName ?? "-",
          custName(r),
          formatInvoiceAmount(amt),
          formatInvoiceAmount(cash),
          formatInvoiceAmount(check),
          formatInvoiceAmount(credit),
          formatInvoiceAmount(other),
          formatInvoiceAmount(house),
        ]);
      }
      grandAmount += sumAmount;
      grandCash += sumCash;
      grandCheck += sumCheck;
      grandCredit += sumCredit;
      grandOther += sumOther;
      grandHouse += sumHouse;
      totalsRowIndices.push(bodyRows.length);
      bodyRows.push([
        "TOTALS:",
        "",
        "",
        "",
        "",
        formatInvoiceAmount(sumAmount),
        formatInvoiceAmount(sumCash),
        formatInvoiceAmount(sumCheck),
        formatInvoiceAmount(sumCredit),
        formatInvoiceAmount(sumOther),
        formatInvoiceAmount(sumHouse),
      ]);
    }

    if (!filterByUserName) {
      totalsRowIndices.push(bodyRows.length);
      bodyRows.push([
        "REPORT TOTALS:",
        "",
        "",
        "",
        "",
        formatInvoiceAmount(grandAmount),
        formatInvoiceAmount(grandCash),
        formatInvoiceAmount(grandCheck),
        formatInvoiceAmount(grandCredit),
        formatInvoiceAmount(grandOther),
        formatInvoiceAmount(grandHouse),
      ]);
    }

    let firstPageHeaderDone = false;
    const firstPageHeaderHeight = 28;

    const tableWidth = pageWidth - 2 * margin;
    // Column width % for landscape: enough width for REPORT TOTALS (e.g. 2,600,325.85) without wrapping
    const colPct = [11, 10, 10, 5, 17, 12, 7, 7, 7, 7, 7]; // Amount 12% so REPORT TOTALS (e.g. 2,600,325.85) fits
    const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;
    autoTableFn(doc, {
      head: [headers],
      body: bodyRows,
      startY: firstPageHeaderHeight,
      margin: { left: margin, right: margin },
      tableWidth,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: (tableWidth * colPct[0]) / 100, overflow: "ellipsize" },
        1: { cellWidth: (tableWidth * colPct[1]) / 100 },
        2: { cellWidth: (tableWidth * colPct[2]) / 100 },
        3: { cellWidth: (tableWidth * colPct[3]) / 100 },
        4: { cellWidth: (tableWidth * colPct[4]) / 100, overflow: "linebreak" },
        5: { cellWidth: (tableWidth * colPct[5]) / 100, halign: "right" },
        6: { cellWidth: (tableWidth * colPct[6]) / 100, halign: "right" },
        7: { cellWidth: (tableWidth * colPct[7]) / 100, halign: "right" },
        8: { cellWidth: (tableWidth * colPct[8]) / 100, halign: "right" },
        9: { cellWidth: (tableWidth * colPct[9]) / 100, halign: "right" },
        10: { cellWidth: (tableWidth * colPct[10]) / 100, halign: "right" },
      },
      didParseCell: (data: any) => {
        if (data.section === "head") {
          if (data.column.index >= 5) data.cell.styles.halign = "right";
          return;
        }
        if (data.section !== "body") return;
        if (totalsRowIndices.includes(data.row.index)) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [0, 0, 0];
          if (data.column.index === 0) data.cell.styles.overflow = "hidden";
        }
        if (userSectionRowIndices.includes(data.row.index)) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
      didDrawPage: (data: any) => {
        if (data.pageNumber === 1 && !firstPageHeaderDone) {
          addFirstPageHeader(1);
          firstPageHeaderDone = true;
        }
        doc.setFontSize(7);
        doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 8, { align: "right" });
        addFooterToPage(data.pageNumber);
      },
      showHead: "everyPage",
    });

    doc.autoPrint();
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        try {
          printWindow.print();
        } catch {
          // ignore
        }
        URL.revokeObjectURL(url);
      };
    } else {
      URL.revokeObjectURL(url);
      doc.save(`invoice-register-${dayjs().format("YYYY-MM-DD")}.pdf`);
    }
  };

  // View Report: fetch invoice register, generate PDF for all users, open print (no modal)
  const handleViewInvoiceRegisterReport = async () => {
    setInvoiceRegisterLoading(true);
    try {
      const start = startDate?.format("YYYY-MM-DD") ?? "";
      const end = endDate?.format("YYYY-MM-DD") ?? "";
      const response = (await getInvoiceRegister(start, end)) as any;
      const items = response?.data?.data ?? response?.data ?? response ?? [];
      const data = Array.isArray(items) ? items : [];
      setInvoiceRegisterData(data);
      if (data.length === 0) {
        toast.error("No invoice register data for the selected date range");
        return;
      }
      await generateInvoiceRegisterPDFAndPrint(data, null);
    } catch (error) {
      console.error("Error fetching invoice register:", error);
      toast.error("Failed to load invoice register");
    } finally {
      setInvoiceRegisterLoading(false);
    }
  };

  // View report for a single user (filter on frontend, then generate PDF and print)
  const handleViewInvoiceReportForUser = async (userName: string) => {
    const getData = async (): Promise<any[]> => {
      if (invoiceRegisterData.length > 0) {
        return invoiceRegisterData;
      }
      const start = startDate?.format("YYYY-MM-DD") ?? "";
      const end = endDate?.format("YYYY-MM-DD") ?? "";
      const response = (await getInvoiceRegister(start, end)) as any;
      const items = response?.data?.data ?? response?.data ?? response ?? [];
      const data = Array.isArray(items) ? items : [];
      setInvoiceRegisterData(data);
      return data;
    };
    setInvoiceRegisterLoading(true);
    try {
      const data = await getData();
      const filtered = data.filter((r: any) => (r.userName ?? "") === userName);
      if (filtered.length === 0) {
        toast.error(`No invoice data found for user "${userName}"`);
        return;
      }
      await generateInvoiceRegisterPDFAndPrint(data, userName);
    } catch (error) {
      console.error("Error generating user invoice report:", error);
      toast.error("Failed to generate report");
    } finally {
      setInvoiceRegisterLoading(false);
    }
  };

  // Merge loss qty by product (Item_Number): one row per product with summed Loss_Qty and Ext_Loss
  const lossQtyMergedData = useMemo(() => {
    const map = new Map<string, { Description: string; Item_Number: string; Loss_Qty: number; Ext_Loss: number }>();
    for (const row of lossQtyFullData) {
      const key = String(row.Item_Number ?? '');
      const lossQty = Number(row.Loss_Qty) || 0;
      const extLoss = Number(row.Ext_Loss) || 0;
      const existing = map.get(key);
      if (existing) {
        existing.Loss_Qty += lossQty;
        existing.Ext_Loss += extLoss;
      } else {
        map.set(key, {
          Description: row.Description ?? '-',
          Item_Number: row.Item_Number ?? '',
          Loss_Qty: lossQty,
          Ext_Loss: extLoss,
        });
      }
    }
    return Array.from(map.values());
  }, [lossQtyFullData]);

  // Top 10 from merged data (by Loss_Qty descending)
  const lossQtyData = useMemo(
    () => [...lossQtyMergedData].sort((a, b) => (b.Loss_Qty || 0) - (a.Loss_Qty || 0)).slice(0, 10),
    [lossQtyMergedData]
  );

  const handleLossQtyGenerateReport = () => {
    navigate('/admin/reports-analytics?tab=loss-qty', {
      state: {
        fromDate: startDate?.format("YYYY-MM-DD"),
        toDate: endDate?.format("YYYY-MM-DD"),
      },
    });
  };

  const handleLossQtyViewAll = () => {
    setLossQtyModalPage(1); // Reset to first page when opening modal
    setLossQtyModalOpen(true);
  };

  // Get paginated data for modal (merged by product, sorted by Loss_Qty descending)
  const getPaginatedLossQtyData = () => {
    const sorted = [...lossQtyMergedData].sort((a, b) => (b.Loss_Qty || 0) - (a.Loss_Qty || 0));
    const startIndex = (lossQtyModalPage - 1) * lossQtyModalPageSize;
    const endIndex = startIndex + lossQtyModalPageSize;
    return sorted.slice(startIndex, endIndex);
  };

  const lossQtyModalTotalPages = Math.ceil(lossQtyMergedData.length / lossQtyModalPageSize);

  const handleLossQtyModalPageChange = (page: number) => {
    setLossQtyModalPage(page);
  };

  const handleLossQtyModalPageSizeChange = (newPageSize: number) => {
    setLossQtyModalPageSize(newPageSize);
    setLossQtyModalPage(1); // Reset to first page when changing page size
  };

  const fetchHighDemandItems = async () => {
    try {
      setHighDemandLoading(true);
      
      const params: any = {};
      
      // Add dates if both are selected (format: MM-DD-YYYY)
      if (startDate && endDate) {
        params.fromDate = startDate.format("MM-DD-YYYY");
        params.toDate = endDate.format("MM-DD-YYYY");
      }
      
      const response = await getHighDemandItems(params) as any;
      
      // Handle API response structure
      const items = response?.data?.data || response?.data || response || [];
      
      // Ensure items is an array (don't sort here - let getSortedHighDemandData handle it)
      const itemsArray = Array.isArray(items) ? items : [];
      
      setHighDemandFullData(itemsArray);
    } catch (error) {
      console.error("Error fetching high demand items:", error);
      toast.error("Failed to fetch high demand items");
    } finally {
      setHighDemandLoading(false);
    }
  };

  const handleHighDemandViewAll = async () => {
    setHighDemandModalPage(1); // Reset to first page when opening modal
    setHighDemandSortField('quantity'); // Reset to default sort
    setHighDemandSortDirection('desc'); // Reset to descending
    setHighDemandModalOpen(true);
    await fetchHighDemandItems();
  };

  // Get sorted high demand data (used for both display and PDF)
  const getSortedHighDemandData = () => {
    if (!highDemandFullData || highDemandFullData.length === 0) {
      return [];
    }
    
    const sortField = highDemandSortField || 'quantity';
    const sortDirection = highDemandSortDirection || 'desc';
    
    return [...highDemandFullData].sort((a: any, b: any) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;
      
      // Get values based on sort field
      switch (sortField) {
        case 'quantity':
          aValue = Number(a.totalQuantityOrdered) || 0;
          bValue = Number(b.totalQuantityOrdered) || 0;
          break;
        case 'orders':
          aValue = Number(a.orderCount) || 0;
          bValue = Number(b.orderCount) || 0;
          break;
        case 'item':
          aValue = (a.inventory?.Description || '').toLowerCase();
          bValue = (b.inventory?.Description || '').toLowerCase();
          break;
        case 'itemNumber':
          aValue = Number(a.Item_Number || a.inventory?.Item_Number) || 0;
          bValue = Number(b.Item_Number || b.inventory?.Item_Number) || 0;
          break;
        default:
          aValue = Number(a.totalQuantityOrdered) || 0;
          bValue = Number(b.totalQuantityOrdered) || 0;
      }
      
      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = (aValue as number) - (bValue as number);
      }
      
      // Apply sort direction
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };

  // Handle sort change
  const handleHighDemandSort = (field: string) => {
    if (highDemandSortField === field) {
      // Toggle direction if same field
      setHighDemandSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default descending
      setHighDemandSortField(field);
      setHighDemandSortDirection('desc');
    }
    setHighDemandModalPage(1); // Reset to first page when sorting changes
  };

  // Get paginated data for modal
  const getPaginatedHighDemandData = () => {
    const sorted = getSortedHighDemandData();
    const startIndex = (highDemandModalPage - 1) * highDemandModalPageSize;
    const endIndex = startIndex + highDemandModalPageSize;
    return sorted.slice(startIndex, endIndex);
  };

  const highDemandModalTotalPages = Math.ceil(highDemandFullData.length / highDemandModalPageSize);

  const handleHighDemandModalPageChange = (page: number) => {
    setHighDemandModalPage(page);
  };

  const handleHighDemandModalPageSizeChange = (newPageSize: number) => {
    setHighDemandModalPageSize(newPageSize);
    setHighDemandModalPage(1); // Reset to first page when changing page size
  };

  // Load logo as data URL for PDF
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
        
        img.onerror = async () => {
          try {
            const logoPath = typeof rabbitLogo === 'string' ? rabbitLogo : rabbitLogo;
            if (typeof logoPath === 'string' && !logoPath.startsWith('data:') && !logoPath.startsWith('http')) {
              const response = await fetch(logoPath);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    resolve(reader.result);
                  } else {
                    resolve(null);
                  }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
                return;
              }
            }
            resolve(null);
          } catch (fetchError) {
            console.error('Error fetching logo:', fetchError);
            resolve(null);
          }
        };
        
        if (typeof rabbitLogo === 'string') {
          img.src = rabbitLogo;
        } else {
          img.src = rabbitLogo as string;
        }
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Generate PDF for Loss Quantity Report (uses merged data by product)
  const handleGenerateLossQtyPDF = async () => {
    if (lossQtyMergedData.length === 0) {
      toast.error('No data to generate PDF');
      return;
    }

    setGeneratingPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // Get distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';

      // Header Section: Distributor Details on Left
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let leftY = yPosition;
      
      if (distributorName) {
        doc.setFont('helvetica', 'bold');
        doc.text(distributorName, margin, leftY);
        leftY += 4;
      }
      
      if (distributorAddress) {
        doc.setFont('helvetica', 'normal');
        doc.text(distributorAddress, margin, leftY);
        leftY += 4;
      }
      
      if (distributorPhone) {
        doc.text(distributorPhone, margin, leftY);
      }

      // Title - Centered
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Loss Quantity Report', pageWidth / 2, yPosition + 4, { align: 'center' });

      // Date Range - Right
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let rightY = yPosition;
      const date = dayjs().format('MM/DD/YYYY');
      doc.text(`Generated on: ${date}`, pageWidth - margin, rightY, { align: 'right' });
      rightY += 4;
      
      if (startDate && endDate) {
        doc.text(
          `Date Range: ${startDate.format('MM/DD/YYYY')} to ${endDate.format('MM/DD/YYYY')}`,
          pageWidth - margin,
          rightY,
          { align: 'right' }
        );
      }

      yPosition = 30;

      // Calculate totals from merged data
      const totalLossQty = lossQtyMergedData.reduce((sum, item) => sum + (item.Loss_Qty || 0), 0);
      const totalExtLoss = lossQtyMergedData.reduce((sum, item) => sum + (item.Ext_Loss || 0), 0);

      // Summary totals before table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', margin, yPosition);
      yPosition += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Loss Qty: ${totalLossQty.toLocaleString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Ext Lost: $${totalExtLoss.toFixed(2)}`, margin, yPosition);
      yPosition += 8;

      // Prepare table data from merged data: Item, Loss Qty, Ext Lost (sorted by Loss_Qty descending)
      const tableData = [...lossQtyMergedData]
        .sort((a, b) => (b.Loss_Qty || 0) - (a.Loss_Qty || 0))
        .map((row) => [
          `${row.Description || '-'} (Item #${row.Item_Number || '-'})`,
          (row.Loss_Qty || 0).toString(),
          `$${(row.Ext_Loss || 0).toFixed(2)}`
        ]);

      const headers = [['Item', 'Loss Qty', 'Ext Lost']];

      // Handle both default export and named export
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      const availableWidth = pageWidth - (margin * 2);
      const itemColumnWidth = availableWidth - 70; // Leave space for Loss Qty and Ext Lost columns
      
      autoTableFn(doc, {
        head: headers,
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: itemColumnWidth, overflow: 'linebreak', halign: 'left' },
          1: { cellWidth: 35, halign: 'right' },
          2: { cellWidth: 35, halign: 'right' }
        },
        didParseCell: (data: any) => {
          // Set header alignment per column: Item left, Loss Qty and Ext Lost right
          if (data.section === 'head') {
            if (data.column.index === 0) {
              data.cell.styles.halign = 'left';
            } else {
              data.cell.styles.halign = 'right';
            }
          }
          // Body cells alignment is handled by columnStyles
        },
        didDrawPage: (data: any) => {
          // Add footer on each page
          const footerY = pageHeight - 5;
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
              // Ignore logo errors
            }
          }
          
          doc.setFontSize(7);
          doc.text(`Page ${data.pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
        },
        showHead: 'everyPage',
      });

      // Add totals row at the end
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', margin, finalY + 5);
      doc.text(totalLossQty.toLocaleString(), margin + 100, finalY + 5, { align: 'right' });
      doc.text(`$${totalExtLoss.toFixed(2)}`, pageWidth - margin, finalY + 5, { align: 'right' });

      const timestamp = dayjs().format('YYYY-MM-DD');
      const filename = `loss-quantity-report-${timestamp}.pdf`;
      doc.save(filename);

      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Generate PDF for High Demand Items Report
  const handleGenerateHighDemandPDF = async () => {
    if (highDemandFullData.length === 0) {
      toast.error('No data to generate PDF');
      return;
    }

    setGeneratingHighDemandPDF(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // Get distributor details
      const distributor = wareHouseDetail?.[0];
      const distributorName = distributor?.D_Name || '';
      const distributorAddress = [
        distributor?.D_Addr1,
        distributor?.D_City,
        distributor?.D_State
      ].filter(Boolean).join(', ');
      const distributorPhone = distributor?.D_Phone || '';

      // Header Section: Distributor Details on Left
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let leftY = yPosition;
      
      if (distributorName) {
        doc.setFont('helvetica', 'bold');
        doc.text(distributorName, margin, leftY);
        leftY += 4;
      }
      
      if (distributorAddress) {
        doc.setFont('helvetica', 'normal');
        doc.text(distributorAddress, margin, leftY);
        leftY += 4;
      }
      
      if (distributorPhone) {
        doc.text(distributorPhone, margin, leftY);
      }

      // Title - Centered
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('High Demand Products Report', pageWidth / 2, yPosition + 4, { align: 'center' });

      // Date Range - Right
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let rightY = yPosition;
      const date = dayjs().format('MM/DD/YYYY');
      doc.text(`Generated on: ${date}`, pageWidth - margin, rightY, { align: 'right' });
      rightY += 4;
      
      if (startDate && endDate) {
        doc.text(
          `Date Range: ${startDate.format('MM/DD/YYYY')} to ${endDate.format('MM/DD/YYYY')}`,
          pageWidth - margin,
          rightY,
          { align: 'right' }
        );
      }

      yPosition = 30;

      // Get sorted data (by quantity ordered descending)
      const sortedData = getSortedHighDemandData();

      // Calculate totals
      const totalQuantity = sortedData.reduce((sum, item) => sum + (item.totalQuantityOrdered || 0), 0);
      const totalOrders = sortedData.reduce((sum, item) => sum + (item.orderCount || 0), 0);

      // Summary totals before table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', margin, yPosition);
      yPosition += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Quantity Ordered: ${totalQuantity.toLocaleString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Orders: ${totalOrders.toLocaleString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Items: ${sortedData.length}`, margin, yPosition);
      yPosition += 8;

      // Prepare table data with columns: Item, Item Number, Quantity Ordered, Order Count, Pack, Case Count
      const tableData = sortedData.map((row: any) => [
        row.inventory?.Description || '-',
        (row.Item_Number || row.inventory?.Item_Number || '-').toString(),
        (row.totalQuantityOrdered || 0).toString(),
        (row.orderCount || 0).toString(),
        (row.inventory?.Pack || '-').toString(),
        `${row.inventory?.CaseCount || '-'} ${row.inventory?.UOM || ''}`.trim()
      ]);

      const headers = [['Item Name', 'Item Number', 'Quantity Ordered', 'Order Count', 'Pack', 'Case Count']];

      // Handle both default export and named export
      const autoTableFn = jspdfAutoTable.default || jspdfAutoTable.autoTable || jspdfAutoTable;

      const availableWidth = pageWidth - (margin * 2);
      const columnWidths = [
        availableWidth * 0.35, // Item Name
        availableWidth * 0.15, // Item Number
        availableWidth * 0.15, // Quantity Ordered
        availableWidth * 0.12, // Order Count
        availableWidth * 0.10, // Pack
        availableWidth * 0.13, // Case Count
      ];
      
      autoTableFn(doc, {
        head: headers,
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7 },
        headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: columnWidths[0], overflow: 'linebreak', halign: 'left' },
          1: { cellWidth: columnWidths[1], halign: 'center' },
          2: { cellWidth: columnWidths[2], halign: 'right' },
          3: { cellWidth: columnWidths[3], halign: 'right' },
          4: { cellWidth: columnWidths[4], halign: 'center' },
          5: { cellWidth: columnWidths[5], halign: 'left' },
        },
        didParseCell: (data: any) => {
          // Set header alignment per column
          if (data.section === 'head') {
            if (data.column.index === 0 || data.column.index === 5) {
              data.cell.styles.halign = 'left';
            } else if (data.column.index === 1 || data.column.index === 4) {
              data.cell.styles.halign = 'center';
            } else {
              data.cell.styles.halign = 'right';
            }
          }
        },
        didDrawPage: (data: any) => {
          // Add footer on each page
          const footerY = pageHeight - 5;
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
              // Ignore logo errors
            }
          }
          
          doc.setFontSize(7);
          doc.text(`Page ${data.pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
        },
        showHead: 'everyPage',
      });

      // Add totals row at the end
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', margin, finalY + 5);
      doc.text(totalQuantity.toLocaleString(), margin + columnWidths[0] + columnWidths[1] + 5, finalY + 5, { align: 'right' });
      doc.text(totalOrders.toLocaleString(), margin + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, finalY + 5, { align: 'right' });

      const timestamp = dayjs().format('YYYY-MM-DD');
      const filename = `high-demand-products-report-${timestamp}.pdf`;
      doc.save(filename);

      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingHighDemandPDF(false);
    }
  };

  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: dayjs.Dayjs | null) => {
    setEndDate(date);
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
  //   setActiveTab(newValue);
  // };

  // Sales/Retailer Summary Cards
  const summaryCards = dashboardData
    ? [
        {
          title: "Total Retailers",
          value: dashboardData.summary.totalCustomer.toString(),
          color: "success" as const,
          icon: <img src={RetailersIcon} alt="retailers" width={20} height={20} />,
        },
        {
          title: "Total Active Retailers",
          value: dashboardData.summary.totalActiveCustomer.toString(),
          color: "success" as const,
          icon: <img src={ItemsIcon} alt="active" width={20} height={20} />,
        },
        {
          title: "Total Inactive Retailers",
          value: dashboardData.summary.totalInactiveCustomer.toString(),
          color: "success" as const,
          icon: <img src={ItemsIcon} alt="inactive" width={20} height={20} />,
        },
        {
          title: "Total Orders",
          value: dashboardData.summary.totalOrder.toString(),
          color: "success" as const,
          icon: <img src={OrdersIcon} alt="orders" width={20} height={20} />,
        },
      ]
    : [];

  // Epick Summary Cards
  const epickCards = epickData
    ? [
        {
          title: "Total Epick Orders",
          value: epickData.orderStatistics.totalOrders.toString(),
          color: "success" as const,
          icon: <img src={OrdersIcon} alt="orders" width={20} height={20} />,
        },
        {
          title: "Completed by Epick",
          value: epickData.orderStatistics.completedByEpick.toString(),
          color: "success" as const,
          icon: <CheckCircleIcon sx={{ width: 20, height: 20, color: theme.palette.success.main }} />,
        },
        {
          title: "Pending from Epick",
          value: epickData.orderStatistics.pendingFromEpick.toString(),
          color: "warning" as const,
          icon: <PendingIcon sx={{ width: 20, height: 20, color: theme.palette.warning.main }} />,
        },
        {
          title: "Average Order Time",
          value: epickData.averageOrderTime.averageTimeFormatted,
          color: "success" as const,
          icon: <AccessTimeIcon sx={{ width: 20, height: 20, color: theme.palette.info.main }} />,
        },
        {
          title: "Orders Ready for Checker",
          value: epickData?.orderStatistics.totalCheckerOrders?.toString(),
          color: "warning" as const,
          icon: <PersonIcon sx={{ width: 20, height: 20, color: theme.palette.warning.main }} />,
        },
        {
          title: "Completed by Checker",
          value: epickData?.orderStatistics.ordersCompletedByChecker?.toString(),
          color: "success" as const,
          icon: <CheckCircleIcon sx={{ width: 20, height: 20, color: theme.palette.success.main }} />,
        },
      ]
    : [];

  // Chart Data Preparation
  const allPlatformData = dashboardData
    ? [
        { name: "Mobile", value: dashboardData.orderPlatform.Mobile, color: "#FF9800" },
        { name: "Web", value: dashboardData.orderPlatform.Web, color: "#4CAF50" },
        { name: "ERP", value: dashboardData.orderPlatform.ERP, color: "#3C50E0" },
        { name: "Return Order", value: dashboardData.returnOrder || 0, color: "#F44336" },
      ]
    : [];

  const platformData = allPlatformData.filter((item) => selectedPlatforms.has(item.name));

  const handlePlatformToggle = (platformName: string) => {
    setSelectedPlatforms((prev: Set<string>) => {
      const newSelected = new Set(prev);
      if (newSelected.has(platformName)) {
        newSelected.delete(platformName);
      } else {
        newSelected.add(platformName);
      }
      return newSelected;
    });
  };

  const salesPersonData = dashboardData
    ? [...(dashboardData?.result || [])]
        .sort((a, b) => (b.totalInvoiceTotal || 0) - (a.totalInvoiceTotal || 0))
        .map((person) => ({
          name: person.S_Desc,
          Sales: person.totalInvoiceTotal,
          Orders: person.totalOrders,
        }))
    : [];

  const highDemandBarData = dashboardData?.highDemandProducts.map((product) => ({
    name: product.inventory.Description.length > 20 
      ? product.inventory.Description.substring(0, 20) + "..." 
      : product.inventory.Description,
    fullName: product.inventory.Description,
    quantity: product.totalQuantityOrdered,
    orders: product.orderCount,
    itemNumber: product.Item_Number,
    pack: product.inventory.Pack,
    caseCount: product.inventory.CaseCount,
    uom: product.inventory.UOM,
  })) || [];

  const pickerBarData = epickData?.pickerWiseOrders.map((picker: any) => ({
    name: picker.pickerName,
    completedOrders: picker.totalCompletedOrders,
    averageTime: picker.averageOrderTime.averageTimeSeconds / 3600, // Convert to hours
    averageTimeFormatted: picker.averageOrderTime.averageTimeFormatted,
    averageTimePerQty: picker.averageTimePerQuantity.secondsPerQty,
    averageTimePerQtyFormatted: picker.averageTimePerQuantity.formatted,
    scannedQuantity: picker.totalScannedQuantity,
    scannedLines: picker.totalScannedLines || 0,
    overrideRequests: picker.totalOverrideRequests || 0,
    totalRequests: picker.totalRequests || picker.totalOverrideRequests || 0,
    acceptedRequests: picker.totalAcceptedRequests || 0,
    rejectedRequests: picker.totalRejectedRequests || 0,
    totalTimeFormatted: picker.totalTimeFormatted || "00:00:00",
  })) || [];

  // Table Columns
  const highDemandColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item Name",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.inventory.Description}
        </Typography>
      ),
    },
    {
      id: "itemNumber",
      label: "Item Number",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Item_Number}
        </Typography>
      ),
    },
    {
      id: "quantity",
      label: "Quantity Ordered",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="primary.main">
          {row.totalQuantityOrdered.toLocaleString()}
        </Typography>
      ),
    },
    {
      id: "orders",
      label: "Order Count",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.orderCount}
        </Typography>
      ),
    },
    {
      id: "pack",
      label: "Pack",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.inventory.Pack}
        </Typography>
      ),
    },
    {
      id: "caseCount",
      label: "Case Count",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.inventory.CaseCount} {row.inventory.UOM}
        </Typography>
      ),
    },
  ];

  const currentOrderStatusLimit = 10;
  const CURRENT_ORDER_STATUS_SECTIONS: { key: keyof CurrentOrderStatusReport; label: string }[] = [
    { key: "invoices", label: "Invoiced" },
    { key: "non_invoices", label: "Non Invoiced" },
    { key: "picklist", label: "Picklist" },
    { key: "orderConfirmation", label: "Order Confirmed" },
    { key: "recordLocks", label: "Order in Progress" },
  ];

  const currentOrderStatusColumns: TableColumn[] = [
    {
      id: "Order_Number",
      label: "Order #",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.Order_Number ?? row.Document_Number ?? "-"}
        </Typography>
      ),
    },
    {
      id: "total_item_quantity",
      label: "Total Qty",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.total_item_quantity != null ? Number(row.total_item_quantity) : "-"}
        </Typography>
      ),
    },
    {
      id: "total_line_number",
      label: "Total Lines",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.total_line_number != null ? Number(row.total_line_number) : "-"}
        </Typography>
      ),
    },
    {
      id: "Order_Date",
      label: "Date",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Order_Date ?? "-"}
        </Typography>
      ),
    },
    {
      id: "customer",
      label: "Customer",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.customer?.C_Name ?? "-"}
        </Typography>
      ),
    },
    {
      id: "repName",
      label: "Sales Rep",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.salesRep?.S_Desc ?? row.repName ?? "-"}
        </Typography>
      ),
    },
    {
      id: "action",
      label: "Action",
      align: "center",
      render: (row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenOrderDetail(row.Order_Number ?? row.Document_Number);
          }}
          sx={{ color: theme.palette.primary.main }}
          title="View order details"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const orderDetailModalColumns: TableColumn[] = [
    {
      id: "Line_Number",
      label: "Line #",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Line_Number ?? "-"}
        </Typography>
      ),
    },
    {
      id: "Item_Number",
      label: "Item #",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Item_Number ?? "-"}
        </Typography>
      ),
    },
    {
      id: "description",
      label: "Description",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.inventory?.Description ?? "-"}
        </Typography>
      ),
    },
    {
      id: "Quantity_Ordered",
      label: "Qty Ordered",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Quantity_Ordered ?? "-"}
        </Typography>
      ),
    },
    {
      id: "Quantity_Shipped",
      label: "Qty Shipped",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Quantity_Shipped ?? "-"}
        </Typography>
      ),
    },
    {
      id: "Price",
      label: "Price",
      render: (row) => {
        const price = Number(row.Price ?? 0) + Number(row.OTP_Amount_State ?? 0) + Number(row.PrepaidTax_Amount ?? 0);
        return (
          <Typography fontSize={12} color="text.secondary">
            {`$${price.toFixed(2)}`}
          </Typography>
        );
      },
    },
    {
      id: "TotalPrice",
      label: "Total",
      render: (row) => {
        const unitPrice = Number(row.Price ?? 0) + Number(row.OTP_Amount_State ?? 0) + Number(row.PrepaidTax_Amount ?? 0);
        const qty = Number(row.Quantity_Ordered ?? 0);
        const total = unitPrice * qty;
        return (
          <Typography fontSize={12} fontWeight={500} color="text.secondary">
            {`$${total.toFixed(2)}`}
          </Typography>
        );
      },
    },
  ];

  const salesPersonColumns: TableColumn[] = [
    {
      id: "name",
      label: "Sales Person",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.S_Desc}
        </Typography>
      ),
    },
    {
      id: "sales",
      label: "Total Sales",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.secondary">
          ${row.totalInvoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      id: "orders",
      label: "Order Count",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.totalOrders}
        </Typography>
      ),
    },
  ];

  const pickerColumns: TableColumn[] = [
    {
      id: "name",
      label: "Picker Name",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
          <Typography fontSize={12} fontWeight={500} color="text.primary">
            {row.pickerName}
          </Typography>
        </Box>
      ),
    },
    {
      id: "completedOrders",
      label: "Completed Orders",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="success.main">
          {row.totalCompletedOrders}
        </Typography>
      ),
    },
    {
      id: "averageTime",
      label: "Average Time",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
          <Typography fontSize={12} fontWeight={500} color="text.secondary">
            {row.averageOrderTime.averageTimeFormatted}
          </Typography>
        </Box>
      ),
    },
    {
      id: "averageTimePerQty",
      label: "Avg Time/Qty",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
          <Typography fontSize={12} fontWeight={500} color="text.secondary">
            {row.averageTimePerQuantity.formatted}
          </Typography>
        </Box>
      ),
    },
    {
      id: "scannedQuantity",
      label: "Scanned Quantity",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="primary.main">
          {row.totalScannedQuantity.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </Typography>
      ),
    },
    {
      id: "scannedLines",
      label: "Scanned Lines",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="info.main">
          {row.totalScannedLines?.toLocaleString() || 0}
        </Typography>
      ),
    },
    {
      id: "totalTime",
      label: "Total Time",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTimeIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
          <Typography fontSize={12} fontWeight={500} color="text.secondary">
            {row.totalTimeFormatted || "00:00:00"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "overrideRequests",
      label: "Total Override Requests",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color={row.totalOverrideRequests > 0 ? "warning.main" : "text.secondary"}>
          {row.totalOverrideRequests || 0}
        </Typography>
      ),
    },
    {
      id: "acceptedRequests",
      label: "Accepted Requests",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="success.main">
          {row.totalAcceptedRequests || 0}
        </Typography>
      ),
    },
    {
      id: "rejectedRequests",
      label: "Rejected Requests",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="error.main">
          {row.totalRejectedRequests || 0}
        </Typography>
      ),
    },
  ];

  const averageTimePerQtyColumns: TableColumn[] = [
    {
      id: "name",
      label: "Picker Name",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
              }}
            />
            <Typography fontSize={12} fontWeight={500} color="text.primary">
              {row.pickerName}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "averageTimePerQty",
      label: "Average Time Per Quantity",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <AccessTimeIcon sx={{ fontSize: 14, color: color }} />
            <Typography fontSize={12} fontWeight={500} color={color}>
              {row.averageTimePerQuantity.formatted}
            </Typography>
          </Box>
        );
      },
    },
  ];

  const scannedQtyColumns: TableColumn[] = [
    {
      id: "name",
      label: "Picker Name",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
              }}
            />
            <Typography fontSize={12} fontWeight={500} color="text.primary">
              {row.pickerName}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "scannedQuantity",
      label: "Scanned Quantity",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Typography fontSize={12} fontWeight={500} color={color}>
            {row.totalScannedQuantity.toLocaleString()}
          </Typography>
        );
      },
    },
    {
      id: "overrideRequests",
      label: "Override Requests",
      render: (row, rowIdx) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ];
        const color = colors[rowIdx % colors.length];
        return (
          <Typography fontSize={12} fontWeight={500} color={alpha(color, 0.8)}>
            {row.totalOverrideRequests.toLocaleString()}
          </Typography>
        );
      },
    },
  ];

  const scanningStatsColumns: TableColumn[] = [
    {
      id: "metric",
      label: "Metric",
      render: (row: any) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.metric}
        </Typography>
      ),
    },
    {
      id: "value",
      label: "Value",
      render: (row: any) => (
        <Typography fontSize={12} fontWeight={500} color="text.secondary">
          {row.value}
        </Typography>
      ),
    },
  ];

  const overrideStatsColumns: TableColumn[] = [
    {
      id: "type",
      label: "Request Type",
      render: (row: any) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.type}
        </Typography>
      ),
    },
    {
      id: "count",
      label: "Count",
      render: (row: any) => (
        <Typography fontSize={12} fontWeight={500} color={row.color}>
          {row.count.toLocaleString()}
        </Typography>
      ),
    },
  ];

  const lossQtyColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item",
      render: (row) => (
        <Box>
          <Typography fontSize={12} fontWeight={500} color="text.primary">
            {row.Description || '-'}
          </Typography>
          <Typography fontSize={11} color="text.secondary">
            #{row.Item_Number}
          </Typography>
        </Box>
      ),
    },
    {
      id: "lossQty",
      label: "Loss Qty",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="error.main">
          {row.Loss_Qty || 0}
        </Typography>
      ),
    },
    {
      id: "extLoss",
      label: "Ext Lost",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="error.main">
          ${(row.Ext_Loss || 0).toFixed(2)}
        </Typography>
      ),
    },
  ];

  const lossQtyModalColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item",
      render: (row) => (
        <Box>
          <Typography fontSize={12} fontWeight={500} color="text.primary">
            {row.Description || '-'}
          </Typography>
          <Typography fontSize={11} color="text.secondary">
            #{row.Item_Number}
          </Typography>
        </Box>
      ),
    },
    {
      id: "lossQty",
      label: "Loss Qty",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="error.main">
          {row.Loss_Qty || 0}
        </Typography>
      ),
    },
    {
      id: "extLoss",
      label: "Ext Lost",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="error.main">
          ${(row.Ext_Loss || 0).toFixed(2)}
        </Typography>
      ),
    },
  ];

  const highDemandModalColumns: TableColumn[] = [
    {
      id: "item",
      label: "Item Name",
      sortable: true,
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.inventory?.Description || '-'}
        </Typography>
      ),
    },
    {
      id: "itemNumber",
      label: "Item Number",
      sortable: true,
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.Item_Number || row.inventory?.Item_Number || '-'}
        </Typography>
      ),
    },
    {
      id: "quantity",
      label: "Quantity Ordered",
      sortable: true,
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="primary.main">
          {row.totalQuantityOrdered?.toLocaleString() || 0}
        </Typography>
      ),
    },
    {
      id: "orders",
      label: "Order Count",
      sortable: true,
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.orderCount || 0}
        </Typography>
      ),
    },
    {
      id: "pack",
      label: "Pack",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.inventory?.Pack || '-'}
        </Typography>
      ),
    },
    {
      id: "caseCount",
      label: "Case Count",
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {row.inventory?.CaseCount || '-'} {row.inventory?.UOM || ''}
        </Typography>
      ),
    },
  ];

  const userPerformanceColumns: TableColumn[] = [
    {
      id: "userName",
      label: "User Name",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.primary">
          {row.userName}
        </Typography>
      ),
    },
    {
      id: "totalSales",
      label: "Total Sales",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="primary.main">
          ${(row.totalInvoiceTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      id: "orderCount",
      label: "Order Count",
      render: (row) => (
        <Typography fontSize={12} fontWeight={500} color="text.secondary">
          {row.order_Count || 0}
        </Typography>
      ),
    },
    {
      id: "viewReport",
      label: "View",
      render: (row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleViewInvoiceReportForUser(row.userName ?? "");
          }}
          disabled={invoiceRegisterLoading}
          sx={{ p: 0.5 }}
          title="View report for this user"
        >
          <VisibilityIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        </IconButton>
      ),
    },
  ];

  const lossQtyBarData = lossQtyData.map((row) => ({
    name: row.Description?.length > 20 
      ? row.Description.substring(0, 20) + "..." 
      : row.Description || `Item ${row.Item_Number}`,
    fullName: row.Description || `Item ${row.Item_Number}`,
    lossQty: row.Loss_Qty || 0,
    extLoss: row.Ext_Loss || 0,
    itemNumber: row.Item_Number,
  }));

  // User Performance Data
  const userPerformanceData = dashboardData?.userPerformance
    ? [...dashboardData.userPerformance]
        .sort((a, b) => (b.totalInvoiceTotal || 0) - (a.totalInvoiceTotal || 0))
    : [];

  const userPerformanceBarData = userPerformanceData.map((user) => ({
    name: user.userName?.length > 20 
      ? user.userName.substring(0, 20) + "..." 
      : user.userName || "Unknown",
    fullName: user.userName || "Unknown",
    totalSales: user.totalInvoiceTotal || 0,
    orderCount: user.order_Count || 0,
  }));

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={8}
          sx={{
            p: 1,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
            border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
            borderRadius: 1.5,
          }}
        >
          <Typography fontSize={11} fontWeight={500} mb={0.5}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} fontSize={10} color={entry.color}>
              {entry.name}: {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };


  if (loading && !dashboardData) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return (
    <Box
      sx={{
        p: { sm: 1, md: 1.5 },
        background: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Tabs Header */}
      <Fade in={true} timeout={500}>
        <Box
          mb={1}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button
              onClick={() => setActiveTab(0)}
              sx={{
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                backgroundColor: activeTab === 0 ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : 'transparent'),
                color: activeTab === 0 ? '#fff' : theme.palette.text.secondary,
                minWidth: 'auto',
                boxShadow: 'none',
                border: theme.palette.mode === 'dark' && activeTab !== 0 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                '&:hover': {
                  backgroundColor: activeTab === 0 ? theme.palette.primary.dark : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08),
                  boxShadow: 'none',
                },
              }}
            >
              Sales & Retailer
            </Button>
            <Button
              onClick={() => setActiveTab(1)}
              sx={{
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                backgroundColor: activeTab === 1 ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : 'transparent'),
                color: activeTab === 1 ? '#fff' : theme.palette.text.secondary,
                minWidth: 'auto',
                boxShadow: 'none',
                border: theme.palette.mode === 'dark' && activeTab !== 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                '&:hover': {
                  backgroundColor: activeTab === 1 ? theme.palette.primary.dark : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08),
                  boxShadow: 'none',
                },
              }}
            >
              Epick Dashboard
            </Button>
          </Box>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems="center"
            gap={1}
          >
            <CustomDatePicker
              value={startDate}
              onChange={handleStartDateChange}
              sx={{
                minWidth: { xs: "100%", sm: 120 },
                "& .MuiInputBase-root": {
                  height: 34,
                  fontSize: 12,
                  ...(theme.palette.mode === "dark" && {
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    "& fieldset": { borderColor: alpha(theme.palette.divider, 0.5) },
                    "&:hover fieldset": { borderColor: alpha(theme.palette.divider, 0.8) },
                  }),
                },
              }}
            />
            <Typography
              fontSize={12}
              fontWeight={500}
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              to
            </Typography>
            <CustomDatePicker
              value={endDate}
              onChange={handleEndDateChange}
              sx={{
                minWidth: { xs: "100%", sm: 120 },
                "& .MuiInputBase-root": {
                  height: 34,
                  fontSize: 12,
                  ...(theme.palette.mode === "dark" && {
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    "& fieldset": { borderColor: alpha(theme.palette.divider, 0.5) },
                    "&:hover fieldset": { borderColor: alpha(theme.palette.divider, 0.8) },
                  }),
                },
              }}
            />
            {(startDate || endDate) && (
              <IconButton
                onClick={handleClearDates}
                size="small"
                sx={{
                  backgroundColor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.5) : theme.palette.action.hover,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.8) : theme.palette.action.selected,
                  },
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Fade>

      {/* Tab Content */}
      <Fade in={activeTab === 0} timeout={400} style={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Box
          sx={{
            borderRadius: 1.5,
            ...(theme.palette.mode === "dark"
              ? { background: alpha(theme.palette.background.paper, 0.15) }
              : { background: alpha(theme.palette.primary.main, 0.02) }),
          }}
        >
          {/* Summary Cards */}
          <Grid container spacing={1.5} mb={1.5}>
            {summaryCards.map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <DashboardCard {...card} />
              </Grid>
            ))}
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={1.5} mb={1.5}>
            {/* Current Order Status – Invoices, Non-Invoices, Picklist, Epick Completed, Record Locks */}
            {CURRENT_ORDER_STATUS_SECTIONS.map((section, sectionIndex) => {
              const sectionList = (currentOrderStatusData?.[section.key] ?? []).slice(0, currentOrderStatusLimit);
              const sectionBarData = sectionList.map((order: CurrentOrderStatusReportOrder) => ({
                name: String(order.Document_Number ?? order.Order_Number ?? ""),
                orderNumber: order.Order_Number,
                documentNumber: order.Document_Number,
                fullLabel: `Order ${order.Document_Number ?? order.Order_Number} - ${order.customer?.C_Name ?? ""}`,
                value: order.total_item_quantity != null ? Number(order.total_item_quantity) : 0,
                totalLineNumber: order.total_line_number != null ? Number(order.total_line_number) : 0,
              }));
              // Y-axis is based only on first 10 orders' quantities; scale and ticks are integers only
              const chartValues = sectionBarData.map((d) => d.value);
              const first10Values = chartValues.slice(0, 10);
              const hasNegativeInFirst10 = first10Values.some((v) => v < 0);
              const dataMin = chartValues.length ? Math.min(...chartValues) : 0;
              const dataMax = chartValues.length ? Math.max(...chartValues) : 0;
              const yAxisMin = dataMin < 0 ? Math.floor(dataMin) : 0;
              const yAxisMax = dataMax > 0 ? Math.ceil(dataMax) : 0;
              // Nice upper bound slightly above max (e.g. 134 -> 140), so axis scale matches actual data
              const niceCeil = (n: number) => (n <= 0 ? 0 : (Math.ceil(n / 10) * 10) || 10);
              const niceFloor = (n: number) => (n >= 0 ? 0 : (Math.floor(n / 10) * 10));
              const paddingPct = 0.1;
              const range = yAxisMax - yAxisMin || 1;
              const topBound = niceCeil(yAxisMax + range * paddingPct);
              const bottomBound = hasNegativeInFirst10 ? niceFloor(yAxisMin - range * paddingPct) : 0;
              const yAxisDomain = [bottomBound, topBound] as [number, number];
              const [domainMin, domainMax] = yAxisDomain;
              // Integer-only ticks; 0 on baseline when no negative in first 10
              const yAxisTicks =
                !hasNegativeInFirst10
                  ? (() => {
                      const t = [0, topBound];
                      const step = topBound <= 0 ? 0 : Math.max(1, Math.ceil((topBound - 0) / 4));
                      for (let v = step; v < topBound; v += step) t.push(v);
                      const rounded = t.map((v) => Math.round(v));
                      return rounded.filter((v, i) => rounded.indexOf(v) === i).sort((a, b) => a - b);
                    })()
                  : domainMin < 0 && domainMax > 0
                    ? (() => {
                        const t = [domainMin, 0, domainMax];
                        const step = Math.max(1, Math.ceil((domainMax - domainMin) / 5));
                        for (let v = domainMin + step; v < domainMax; v += step) t.push(v);
                        const rounded = t.map((v) => Math.round(v));
                        return rounded.filter((v, i) => rounded.indexOf(v) === i).sort((a, b) => a - b);
                      })()
                    : undefined;
              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={section.key}>
                  <Grow in={true} timeout={800 + sectionIndex * 100}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        background: theme.palette.mode === "dark"
                          ? alpha(theme.palette.background.paper, 0.85)
                          : theme.palette.background.paper,
                        border: theme.palette.mode === "dark" ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : "none",
                        boxShadow: theme.palette.mode === "light"
                          ? `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}`
                          : "none",
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontSize={12} fontWeight={500} color="text.primary">
                          Order Status – {section.label}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            onClick={() => setCurrentOrderStatusViewMode((prev) => ({ ...prev, [section.key]: "graph" }))}
                            variant={(currentOrderStatusViewMode[section.key] ?? "table") === "graph" ? "contained" : "outlined"}
                            sx={{
                              textTransform: "none",
                              minWidth: 65,
                              fontSize: 11,
                              py: 0.5,
                              "&.MuiButton-contained": { color: "#fff" },
                            }}
                          >
                            Chart
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setCurrentOrderStatusViewMode((prev) => ({ ...prev, [section.key]: "table" }))}
                            variant={(currentOrderStatusViewMode[section.key] ?? "table") === "table" ? "contained" : "outlined"}
                            sx={{
                              textTransform: "none",
                              minWidth: 65,
                              fontSize: 11,
                              py: 0.5,
                              "&.MuiButton-contained": { color: "#fff" },
                            }}
                          >
                            Table
                          </Button>
                        </Stack>
                      </Box>
                      {(currentOrderStatusViewMode[section.key] ?? "table") === "table" ? (
                        <DashboardTable
                          padding={0}
                          data={sectionList}
                          columns={currentOrderStatusColumns}
                          currentPage={1}
                          totalPages={1}
                          totalItems={sectionList.length}
                          stickyHeader={true}
                          stickyLastColumn={true}
                          pageSize={sectionList.length}
                          onPageChange={() => {}}
                          onPageSizeChange={() => {}}
                          showPageSizeSelector={false}
                          showTotalItems={false}
                          showPageNumbers={false}
                          loading={currentOrderStatusLoading}
                          containerHeight="300px"
                          emptyStateComponent={<Typography>No orders</Typography>}
                        />
                      ) : (
                        <Box sx={{ height: 320, width: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={sectionBarData}
                              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                              <XAxis
                                dataKey="name"
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                              />
                              <YAxis
                                width={28}
                                domain={yAxisDomain}
                                ticks={yAxisTicks}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                                tickFormatter={(v) => String(Math.round(Number(v)))}
                                allowDecimals={false}
                                axisLine={{ strokeWidth: 1 }}
                              />
                              {yAxisMin <= 0 && yAxisMax >= 0 && (
                                <ReferenceLine
                                  y={0}
                                  stroke={theme.palette.divider}
                                  strokeWidth={1.5}
                                  strokeOpacity={0.9}
                                />
                              )}
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                      <Paper
                                        elevation={8}
                                        sx={{
                                          p: 1,
                                          background:
                                            theme.palette.mode === "dark"
                                              ? alpha(theme.palette.background.paper, 0.95)
                                              : theme.palette.background.paper,
                                          border: theme.palette.mode === "dark" ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : "none",
                                          borderRadius: 2,
                                          maxWidth: 280,
                                        }}
                                      >
                                        <Typography fontSize={12} fontWeight={500} mb={1}>
                                          Order {d.documentNumber ?? d.orderNumber}
                                        </Typography>
                                        <Typography fontSize={11} color="text.secondary">
                                          Total Qty: {d.value ?? 0} · Lines: {d.totalLineNumber ?? 0}
                                        </Typography>
                                        <Typography fontSize={11} color="text.secondary">
                                          Click bar to view order details
                                        </Typography>
                                      </Paper>
                                    );
                                  }
                                  return null;
                                }}
                                cursor={{ fill: "rgba(0,0,0,0.1)" }}
                              />
                              <Bar
                                dataKey="value"
                                fill={theme.palette.primary.main}
                                radius={[4, 4, 0, 0]}
                                style={{ cursor: "pointer" }}
                              >
                                {sectionBarData.map((_entry, index) => (
                                  <Cell
                                    key={`cell-${section.key}-${index}`}
                                    onClick={() => handleOpenOrderDetail(sectionBarData[index].orderNumber)}
                                    style={{ cursor: "pointer" }}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </Paper>
                  </Grow>
                </Grid>
              );
            })}

            {/* Platform Orders */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Grow in={true} timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    height: '100%',
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                    mb={1}
                  >
                    <Typography 
                      fontSize={12} 
                      fontWeight={500} 
                      color="text.primary"
                      sx={{
                        fontSize: { lg: 12 },
                      }}
                    >
                      <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>
                        Orders by Platform
                      </Box>
                      <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>
                        Platform
                      </Box>
                    </Typography>
                    {dashboardData?.orderByUser && (
                      <Box
                        sx={{
                          display: { xs: 'block', xl: 'flex' },
                          flexDirection: { xl: 'row' },
                          gap: { xl: 1 },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            background: alpha(theme.palette.success.main, 0.1),
                            border: `1px solid ${theme.palette.success.main}`,
                            mb: { xs: 0.75, xl: 0 },
                          }}
                        >
                          <Typography fontSize={12} fontWeight={500}>
                            Sales
                          </Typography>
                          <Typography fontSize={12} fontWeight={500} color="success.main">
                            {dashboardData.orderByUser.sales}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            background: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${theme.palette.info.main}`,
                          }}
                        >
                          <Typography fontSize={12} fontWeight={500}>
                            Retailer
                          </Typography>
                          <Typography fontSize={12} fontWeight={500} color="info.main">
                            {dashboardData.orderByUser.retailer}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ height: 220, width: "100%", mb: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        {allPlatformData.map((entry, index) => {
                          const total = allPlatformData.reduce((sum, p) => sum + p.value, 0) || 1;
                          const percent = entry.value / total;
                          const ringWidth = 8;
                          const spacing = 3;
                          const baseInner = 40;
                          const innerRadius = baseInner + index * (ringWidth + spacing);
                          const outerRadius = innerRadius + ringWidth;
                          const startAngle = 90;
                          const endAngle = 90 - percent * 360;
                          const isSelected = selectedPlatforms.has(entry.name);
                          const progressColor = isSelected ? entry.color : theme.palette.grey[400];
                          const backgroundColor = alpha(theme.palette.divider, 0.2);

                          return (
                            <React.Fragment key={entry.name}>
                              <Pie
                                data={[{ value: 1 }]}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                                isAnimationActive={false}
                                onClick={() => handlePlatformToggle(entry.name)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Cell fill={backgroundColor} />
                              </Pie>
                              <Pie
                                data={[{ value: entry.value }]}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                cornerRadius={ringWidth / 2}
                                stroke="none"
                                paddingAngle={0}
                                isAnimationActive
                                onClick={() => handlePlatformToggle(entry.name)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Cell fill={progressColor} />
                              </Pie>
                            </React.Fragment>
                          );
                        })}
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: "18px",
                            fontWeight: 500,
                            fill: theme.palette.text.primary,
                          }}
                        >
                          {platformData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    {allPlatformData.map((item) => {
                      const isSelected = selectedPlatforms.has(item.name);
                      return (
                        <Box
                          key={item.name}
                          onClick={() => handlePlatformToggle(item.name)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            background: isSelected ? alpha(item.color, 0.15) : alpha(theme.palette.divider, 0.1),
                            border: `1px solid ${isSelected ? item.color : theme.palette.divider}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            mb: { lg: 0.75 },
                            '&:hover': {
                              background: isSelected ? alpha(item.color, 0.2) : alpha(item.color, 0.1),
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: isSelected ? item.color : theme.palette.text.disabled,
                            }}
                          />
                          <Typography 
                            fontSize={12} 
                            fontWeight={500}
                            color={isSelected ? item.color : theme.palette.text.secondary}
                          >
                            {item.name} ({item.value.toLocaleString()})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          

          <Grid container spacing={1.5} mb={1.5}>
            {/* Sales Performance - Full Width */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Grow in={true} timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Box>
                        <Typography fontSize={12} fontWeight={500} color="text.primary">
                          Sales Performance
                        </Typography>
                        {/* <Box display="flex" gap={1} mt={0.5}>
                          <Button
                            size="small"
                            onClick={handleViewInvoiceRegisterReport}
                            sx={{
                              textTransform: 'none',
                              fontSize: 11,
                              px: 0,
                              py: 0.25,
                              minWidth: 'auto',
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            View Report →
                          </Button>
                        </Box> */}
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                          background: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        <Typography fontSize={12} fontWeight={500} color="text.secondary">
                          Total Sales:
                        </Typography>
                        <Typography fontSize={12} fontWeight={500} color="primary.main">
                          ${(dashboardData?.result?.reduce((sum, item) => sum + (item.totalInvoiceTotal || 0), 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                          background: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${theme.palette.success.main}`,
                        }}
                      >
                        <Typography fontSize={12} fontWeight={500} color="text.secondary">
                          Total Orders:
                        </Typography>
                        <Typography fontSize={12} fontWeight={500} color="success.main">
                          {(dashboardData?.result?.reduce((sum, item) => sum + (item.totalOrders || 0), 0) || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={costType}
                          onChange={(e) => setCostType(e.target.value)}
                          sx={{
                            fontSize: 11,
                            height: 28,
                            '& .MuiSelect-select': {
                              py: 0.5,
                            },
                          }}
                        >
                          <MenuItem value="base">Base Cost</MenuItem>
                          <MenuItem value="avg">Avg Cost</MenuItem>
                          <MenuItem value="net">Net Cost</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        onClick={() => setSalesPerformanceViewMode("graph")}
                        variant={salesPerformanceViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setSalesPerformanceViewMode("table")}
                        variant={salesPerformanceViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {salesPerformanceViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={[...(dashboardData?.result || [])].sort((a, b) => (b.totalInvoiceTotal || 0) - (a.totalInvoiceTotal || 0))}
                      columns={salesPersonColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={dashboardData?.result?.length || 0}
                      stickyHeader={true}
                      pageSize={dashboardData?.result?.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={loading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No sales data</Typography>}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        width: "100%", 
                        // height: 280,
                        overflowX: "auto",
                        overflowY: "hidden",
                        "&::-webkit-scrollbar": {
                          height: 6,
                        },
                        "&::-webkit-scrollbar-track": {
                          background: alpha(theme.palette.divider, 0.1),
                          borderRadius: 3,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: alpha(theme.palette.primary.main, 0.3),
                          borderRadius: 3,
                          "&:hover": {
                            background: alpha(theme.palette.primary.main, 0.5),
                          },
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height={340} minWidth={Math.max(600, salesPersonData.length * 80)}>
                        <ComposedChart data={salesPersonData} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
                          <defs>
                            <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={1} />
                              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.3)}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            interval={0}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            width={60}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            width={50}
                          />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const salesData = payload.find(p => p.dataKey === 'Sales');
                              const ordersData = payload.find(p => p.dataKey === 'Orders');
                              return (
                                <Paper
                                  elevation={8}
                                  sx={{
                                    p: 1,
                                    background: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.background.paper, 0.95)
                                      : theme.palette.background.paper,
                                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                                    borderRadius: 2,
                                  }}
                                >
                                  <Typography fontSize={12} fontWeight={500} mb={1}>
                                    {salesData?.payload.name}
                                  </Typography>
                                  <Typography fontSize={11} mb={0.5}>
                                    <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                      Sales: 
                                    </Box>{' '}
                                    ${salesData?.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Typography>
                                  <Typography fontSize={11}>
                                    <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                                      Orders: 
                                    </Box>{' '}
                                    {ordersData?.value?.toLocaleString()}
                                  </Typography>
                                </Paper>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="Sales" 
                          fill="url(#salesBarGradient)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="Orders" 
                          stroke={theme.palette.success.main}
                          strokeWidth={2.5}
                          dot={{ fill: theme.palette.success.main, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* User Performance Report */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Grow in={true} timeout={1600}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Box>
                        <Typography fontSize={12} fontWeight={500} color="text.primary">
                          User Performance
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Button
                            size="small"
                            onClick={handleViewInvoiceRegisterReport}
                            disabled={invoiceRegisterLoading}
                            sx={{
                              textTransform: 'none',
                              fontSize: 11,
                              px: 0,
                              py: 0.25,
                              minWidth: 'auto',
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {invoiceRegisterLoading ? 'Loading...' : 'View Report →'}
                          </Button>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                          background: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        <Typography fontSize={12} fontWeight={500} color="text.secondary">
                          Total Sales:
                        </Typography>
                        <Typography fontSize={12} fontWeight={500} color="primary.main">
                          ${(dashboardData?.userPerformance?.reduce((sum, item) => sum + (item.totalInvoiceTotal || 0), 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                          background: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${theme.palette.success.main}`,
                        }}
                      >
                        <Typography fontSize={12} fontWeight={500} color="text.secondary">
                          Total Orders:
                        </Typography>
                        <Typography fontSize={12} fontWeight={500} color="success.main">
                          {(dashboardData?.userPerformance?.reduce((sum, item) => sum + (item.order_Count || 0), 0) || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserPerformanceViewMode("graph");
                        }}
                        variant={userPerformanceViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserPerformanceViewMode("table");
                        }}
                        variant={userPerformanceViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {userPerformanceViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={userPerformanceData}
                      columns={userPerformanceColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={userPerformanceData.length}
                      stickyHeader={true}
                      pageSize={userPerformanceData.length}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={loading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No user performance data</Typography>}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        width: "100%", 
                        // height: 280,
                        overflowX: "auto",
                        overflowY: "hidden",
                        "&::-webkit-scrollbar": {
                          height: 6,
                        },
                        "&::-webkit-scrollbar-track": {
                          background: alpha(theme.palette.divider, 0.1),
                          borderRadius: 3,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: alpha(theme.palette.primary.main, 0.3),
                          borderRadius: 3,
                          "&:hover": {
                            background: alpha(theme.palette.primary.main, 0.5),
                          },
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height={340} minWidth={Math.max(600, userPerformanceBarData.length * 80)}>
                        <ComposedChart data={userPerformanceBarData} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
                          <defs>
                            <linearGradient id="userSalesBarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={1} />
                              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.3)}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            interval={0}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            width={60}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            width={50}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const salesData = payload.find(p => p.dataKey === 'totalSales');
                                const ordersData = payload.find(p => p.dataKey === 'orderCount');
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                                      borderRadius: 2,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={500} mb={1}>
                                      {salesData?.payload.fullName}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                        Total Sales: 
                                      </Box>{' '}
                                      ${salesData?.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                    <Typography fontSize={11}>
                                      <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                                        Order Count: 
                                      </Box>{' '}
                                      {ordersData?.value?.toLocaleString()}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            yAxisId="left"
                            dataKey="totalSales" 
                            fill="url(#userSalesBarGradient)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="orderCount" 
                            stroke={theme.palette.success.main}
                            strokeWidth={2.5}
                            dot={{ fill: theme.palette.success.main, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          {/* High Demand Products */}
          <Grid container spacing={1.5} mb={1.5}>
            <Grid size={{ xs: 12 }}>
              <Grow in={true} timeout={1200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                    <Box>
                      <Typography fontSize={12} fontWeight={500} color="text.primary">
                        High Demand Products
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHighDemandViewAll();
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: 11,
                            px: 0,
                            py: 0.25,
                            minWidth: 'auto',
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: 'transparent',
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          View All →
                        </Button>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setHighDemandViewMode("graph")}
                        variant={highDemandViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setHighDemandViewMode("table")}
                        variant={highDemandViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {highDemandViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={dashboardData?.highDemandProducts || []}
                      columns={highDemandColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={dashboardData?.highDemandProducts.length || 0}
                      stickyHeader={true}
                      pageSize={dashboardData?.highDemandProducts.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={loading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No products</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 320, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={highDemandBarData} layout="vertical">
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.5)}
                          />
                          <XAxis type="number" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={130}
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                                      borderRadius: 2,
                                      maxWidth: 280,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={500} mb={1}>
                                      {data.fullName}
                                    </Typography>
                                    <Typography fontSize={11} color="text.secondary" mb={0.5}>
                                      Item Number: {data.itemNumber}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Total Quantity: {data.quantity.toLocaleString()}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Total Orders: {data.orders}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Pack: {data.pack}
                                    </Typography>
                                    <Typography fontSize={11}>
                                      Case Count: {data.caseCount} {data.uom}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                            cursor={{ fill: "rgba(0,0,0,0.1)" }}
                          />
                          <Bar 
                            dataKey="quantity" 
                            fill={theme.palette.primary.main}
                            radius={[0, 6, 6, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>
          {/* Loss Quantity Report */}
          <Grid size={{ xs: 12, md: 8 }}>
              <Grow in={true} timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    height: '100%',
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                    <Box>
                      <Typography fontSize={12} fontWeight={500} color="text.primary">
                        Loss Quantity Report (Top 10)
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLossQtyViewAll();
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: 11,
                            px: 0,
                            py: 0.25,
                            minWidth: 'auto',
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: 'transparent',
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          View All →
                        </Button>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLossQtyGenerateReport();
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: 11,
                            px: 0,
                            py: 0.25,
                            minWidth: 'auto',
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: 'transparent',
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Generate Report →
                        </Button>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLossQtyViewMode("graph");
                        }}
                        variant={lossQtyViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLossQtyViewMode("table");
                        }}
                        variant={lossQtyViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {lossQtyViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={lossQtyData}
                      columns={lossQtyColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={lossQtyData.length}
                      stickyHeader={true}
                      pageSize={lossQtyData.length}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={lossQtyLoading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No loss quantity data</Typography>}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        width: "100%", 
                        // height: 280,
                        overflowX: "auto",
                        overflowY: "hidden",
                        "&::-webkit-scrollbar": {
                          height: 6,
                        },
                        "&::-webkit-scrollbar-track": {
                          background: alpha(theme.palette.divider, 0.1),
                          borderRadius: 3,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: alpha(theme.palette.error.main, 0.3),
                          borderRadius: 3,
                          "&:hover": {
                            background: alpha(theme.palette.error.main, 0.5),
                          },
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height={280} minWidth={Math.max(600, lossQtyBarData.length * 80)}>
                        <BarChart data={lossQtyBarData} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
                          <defs>
                            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={theme.palette.error.main} stopOpacity={1} />
                              <stop offset="100%" stopColor={theme.palette.error.dark} stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.3)}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="itemNumber" 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            interval={0}
                          />
                          <YAxis 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 9 }}
                            axisLine={false}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                            width={60}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: `1px solid ${theme.palette.error.main}`,
                                      borderRadius: 2,
                                      maxWidth: 280,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={500} mb={1} color="error.main">
                                      {data.fullName}
                                    </Typography>
                                    <Typography fontSize={11} color="text.secondary" mb={0.5}>
                                      Item #{data.itemNumber}
                                    </Typography>
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        mb: 0.5,
                                        p: 0.75,
                                        borderRadius: 1,
                                        background: alpha(theme.palette.error.main, 0.1),
                                      }}
                                    >
                                      <Typography fontSize={11} fontWeight={500}>
                                        Loss Qty:
                                      </Typography>
                                      <Typography fontSize={11} fontWeight={500} color="error.main">
                                        {data.lossQty}
                                      </Typography>
                                    </Box>
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        p: 0.75,
                                        borderRadius: 1,
                                        background: alpha(theme.palette.error.main, 0.1),
                                      }}
                                    >
                                      <Typography fontSize={11} fontWeight={500}>
                                        Ext Loss:
                                      </Typography>
                                      <Typography fontSize={11} fontWeight={500} color="error.main">
                                        ${data.extLoss.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                            cursor={{ fill: alpha(theme.palette.error.main, 0.1) }}
                          />
                          <Bar 
                            dataKey="extLoss" 
                            fill="url(#lossGradient)"
                            radius={[4, 4, 0, 0]}
                          >
                            {lossQtyBarData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index % 2 === 0 
                                  ? theme.palette.error.main 
                                  : alpha(theme.palette.error.main, 0.8)
                                } 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
        </Box>
      </Fade>

      {/* Epick Tab Content */}
      <Fade in={activeTab === 1} timeout={400} style={{ display: activeTab === 1 ? 'block' : 'none' }}>
        <Box>
          {/* Epick Summary Cards */}
          <Grid container spacing={1.5} mb={1.5}>
            {epickCards.map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <DashboardCard {...card} />
              </Grid>
            ))}
          </Grid>

          {/* Picker Performance */}
          <Grid container spacing={1.5} mb={1.5}>
            <Grid size={{ xs: 12 }}>
              <Grow in={true} timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontSize={12} fontWeight={500} color="text.primary">
                      Picker Performance
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setPickerViewMode("graph")}
                        variant={pickerViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPickerViewMode("table")}
                        variant={pickerViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {pickerViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={epickData?.pickerWiseOrders || []}
                      columns={pickerColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.pickerWiseOrders.length || 0}
                      stickyHeader={true}
                      pageSize={epickData?.pickerWiseOrders.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No picker data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 320, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pickerBarData}>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={alpha(theme.palette.divider, 0.5)}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            axisLine={false}
                          />
                          <YAxis 
                            tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            axisLine={false}
                            tickFormatter={(value) => value.toLocaleString()}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                                      borderRadius: 2,
                                      maxWidth: 300,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={500} mb={1}>
                                      {data.name}
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Completed Orders: <strong>{data.completedOrders}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Avg Time: <strong>{data.averageTimeFormatted}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Avg Time/Qty: <strong>{data.averageTimePerQtyFormatted}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Total Time: <strong>{data.totalTimeFormatted}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Scanned Qty: <strong>{data.scannedQuantity.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Scanned Lines: <strong>{data.scannedLines.toLocaleString()}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Total Override Requests: <strong>{data.overrideRequests}</strong>
                                    </Typography>
                                    <Typography fontSize={11} mb={0.5}>
                                      Accepted: <strong style={{ color: theme.palette.success.main }}>{data.acceptedRequests}</strong>
                                    </Typography>
                                    <Typography fontSize={11}>
                                      Rejected: <strong style={{ color: theme.palette.error.main }}>{data.rejectedRequests}</strong>
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                            iconType="rect"
                          />
                          <Bar 
                            dataKey="completedOrders" 
                            fill={theme.palette.success.main}
                            radius={[6, 6, 0, 0]}
                            name="Completed Orders"
                          />
                          <Bar 
                            dataKey="scannedQuantity" 
                            fill={theme.palette.primary.main}
                            radius={[6, 6, 0, 0]}
                            name="Scanned Quantity"
                          />
                          <Bar 
                            dataKey="overrideRequests" 
                            fill={theme.palette.warning.main}
                            radius={[6, 6, 0, 0]}
                            name="Override Requests"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          {/* Donut Charts Section */}
          <Grid container spacing={1.5} mb={1.5}>
            {/* Average Time Per Quantity Donut Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontSize={12} fontWeight={500} color="text.primary">
                      Average Time Per Quantity
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setAverageTimePerQtyViewMode("graph")}
                        variant={averageTimePerQtyViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setAverageTimePerQtyViewMode("table")}
                        variant={averageTimePerQtyViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {averageTimePerQtyViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={epickData?.pickerWiseOrders || []}
                      columns={averageTimePerQtyColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.pickerWiseOrders.length || 0}
                      stickyHeader={true}
                      pageSize={epickData?.pickerWiseOrders.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No picker data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={epickData?.pickerWiseOrders.map((picker) => ({
                              name: picker.pickerName,
                              value: picker.averageTimePerQuantity.secondsPerQty,
                              pickerId: picker.pickerId,
                              formatted: picker.averageTimePerQuantity.formatted,
                            })) || []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {(epickData?.pickerWiseOrders || []).map((picker, index) => {
                              const colors = [
                                theme.palette.primary.main,
                                theme.palette.success.main,
                                theme.palette.warning.main,
                                theme.palette.error.main,
                                theme.palette.info.main,
                              ];
                              return (
                                <Cell key={picker.pickerId} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Pie>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "16px",
                              fontWeight: 500,
                              fill: theme.palette.text.primary,
                            }}
                          >
                            Time/Qty
                          </text>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as any;
                                const picker = epickData?.pickerWiseOrders.find(
                                  (p) => p.pickerId === data.pickerId
                                );
                                if (picker) {
                                  return (
                                    <Paper
                                      elevation={8}
                                      sx={{
                                        p: 1,
                                        background: theme.palette.mode === 'dark' 
                                          ? alpha(theme.palette.background.paper, 0.95)
                                          : theme.palette.background.paper,
                                        border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                                        borderRadius: 2,
                                      }}
                                    >
                                      <Typography fontSize={12} fontWeight={500} mb={0.5}>
                                        {picker.pickerName}
                                      </Typography>
                                      <Typography fontSize={11} color="text.secondary">
                                        Time/Qty: {picker.averageTimePerQuantity.formatted}
                                      </Typography>
                                    </Paper>
                                  );
                                }
                              }
                              return null;
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* Scanned Quantity & Override Requests Donut Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontSize={12} fontWeight={500} color="text.primary">
                      Scanned Quantity & Override Requests
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setScannedQtyViewMode("graph")}
                        variant={scannedQtyViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setScannedQtyViewMode("table")}
                        variant={scannedQtyViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {scannedQtyViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={epickData?.pickerWiseOrders || []}
                      columns={scannedQtyColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.pickerWiseOrders.length || 0}
                      stickyHeader={true}
                      pageSize={epickData?.pickerWiseOrders.length || 0}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No picker data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {/* Outer ring for Scanned Quantity */}
                          <Pie
                            data={epickData?.pickerWiseOrders.map((picker) => ({
                              name: picker.pickerName,
                              value: picker.totalScannedQuantity,
                              pickerId: picker.pickerId,
                              type: 'scanned',
                            })) || []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {(epickData?.pickerWiseOrders || []).map((picker, index) => {
                              const colors = [
                                theme.palette.primary.main,
                                theme.palette.success.main,
                                theme.palette.warning.main,
                                theme.palette.error.main,
                                theme.palette.info.main,
                              ];
                              return (
                                <Cell key={`scanned-${picker.pickerId}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Pie>
                          
                          {/* Inner ring for Override Requests */}
                          <Pie
                            data={epickData?.pickerWiseOrders.map((picker) => ({
                              name: picker.pickerName,
                              value: picker.totalOverrideRequests,
                              pickerId: picker.pickerId,
                              type: 'override',
                            })) || []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={6}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {(epickData?.pickerWiseOrders || []).map((picker, index) => {
                              const colors = [
                                theme.palette.primary.main,
                                theme.palette.success.main,
                                theme.palette.warning.main,
                                theme.palette.error.main,
                                theme.palette.info.main,
                              ];
                              return (
                                <Cell key={`override-${picker.pickerId}`} fill={alpha(colors[index % colors.length], 0.7)} />
                              );
                            })}
                          </Pie>
                          
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              fill: theme.palette.text.primary,
                            }}
                          >
                            Qty & Overrides
                          </text>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as any;
                                const picker = epickData?.pickerWiseOrders?.find(
                                  (p) => p.pickerId === data.pickerId
                                );
                                const isScanned = data.type === "scanned";
                                const label = isScanned ? "Scanned Quantity" : "Override Requests";
                                const value = Number(data.value) ?? 0;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1.25,
                                      minWidth: 160,
                                      background: theme.palette.mode === "dark"
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: theme.palette.mode === "dark" ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : "none",
                                      borderRadius: 1.5,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={500} color="text.primary" mb={0.5}>
                                      {picker?.pickerName ?? data.name ?? "—"}
                                    </Typography>
                                    <Typography fontSize={11} color="text.secondary">
                                      {label}
                                    </Typography>
                                    <Typography fontSize={12} fontWeight={500} color="primary.main">
                                      {value.toLocaleString()}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            content={() => (
                              <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" sx={{ paddingTop: 1, fontSize: 11 }}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background: theme.palette.primary.main,
                                    }}
                                  />
                                  <Typography component="span" fontSize={11} color="text.primary">
                                    Scanned Quantity
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background: alpha(theme.palette.primary.main, 0.55),
                                    }}
                                  />
                                  <Typography component="span" fontSize={11} color="text.primary">
                                    Override Requests
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>

          {/* Scanning Statistics & Override Request Statistics */}
          <Grid container spacing={1.5} mt={1.5} mb={1.5}>
            {/* Scanning Statistics Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1400}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontSize={12} fontWeight={500} color="text.primary">
                      Scanning Statistics
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setScanningStatsViewMode("graph")}
                        variant={scanningStatsViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setScanningStatsViewMode("table")}
                        variant={scanningStatsViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {scanningStatsViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={epickData?.scanningStatistics ? [
                        {
                          id: 1,
                          metric: "Total Scanned Items",
                          value: epickData.scanningStatistics.totalScannedItems.toLocaleString(),
                        },
                        {
                          id: 2,
                          metric: "Total Scanned Lines",
                          value: epickData.scanningStatistics.totalScannedLines.toLocaleString(),
                        },
                        {
                          id: 3,
                          metric: "Total Scanning Time",
                          value: epickData.scanningStatistics.totalTimeFormatted,
                        },
                      ] : []}
                      columns={scanningStatsColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.scanningStatistics ? 3 : 0}
                      stickyHeader={true}
                      pageSize={3}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No scanning data</Typography>}
                    />
                  ) : (
                    <>
                      <Box sx={{ height: 300, width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={epickData?.scanningStatistics ? [
                              {
                                name: "Scanned Items",
                                value: epickData.scanningStatistics.totalScannedItems,
                                color: theme.palette.primary.main,
                              },
                              {
                                name: "Scanned Lines",
                                value: epickData.scanningStatistics.totalScannedLines,
                                color: theme.palette.success.main,
                              },
                            ] : []}
                          >
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke={alpha(theme.palette.divider, 0.5)}
                              vertical={false}
                            />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                              axisLine={false}
                              tickFormatter={(value) => value.toLocaleString()}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="value" 
                              radius={[6, 6, 0, 0]}
                            >
                              {epickData?.scanningStatistics ? [
                                <Cell key="items" fill={theme.palette.primary.main} />,
                                <Cell key="lines" fill={theme.palette.success.main} />,
                              ] : []}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          mt: 1.5,
                        }}
                      >
                        {epickData?.scanningStatistics && (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                background: alpha(theme.palette.primary.main, 0.1),
                                border: `1px solid ${theme.palette.primary.main}`,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: theme.palette.primary.main,
                                }}
                              />
                              <Typography fontSize={12} fontWeight={500} flex={1}>
                                Total Scanned Items
                              </Typography>
                              <Typography fontSize={12} fontWeight={500} color={theme.palette.primary.main}>
                                {epickData.scanningStatistics.totalScannedItems.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                background: alpha(theme.palette.success.main, 0.1),
                                border: `1px solid ${theme.palette.success.main}`,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: theme.palette.success.main,
                                }}
                              />
                              <Typography fontSize={12} fontWeight={500} flex={1}>
                                Total Scanned Lines
                              </Typography>
                              <Typography fontSize={12} fontWeight={500} color={theme.palette.success.main}>
                                {epickData.scanningStatistics.totalScannedLines.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                background: alpha(theme.palette.info.main, 0.1),
                                border: `1px solid ${theme.palette.info.main}`,
                              }}
                            >
                              <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                              <Typography fontSize={12} fontWeight={500} flex={1}>
                                Total Scanning Time
                              </Typography>
                              <Typography fontSize={12} fontWeight={500} color={theme.palette.info.main}>
                                {epickData.scanningStatistics.totalTimeFormatted}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </>
                  )}
                </Paper>
              </Grow>
            </Grid>

            {/* Override Request Statistics Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grow in={true} timeout={1600}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontSize={12} fontWeight={500} color="text.primary">
                      Override Request Statistics
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setOverrideStatsViewMode("graph")}
                        variant={overrideStatsViewMode === "graph" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Chart
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setOverrideStatsViewMode("table")}
                        variant={overrideStatsViewMode === "table" ? "contained" : "outlined"}
                        sx={{
                          textTransform: 'none',
                          minWidth: 65,
                          fontSize: 11,
                          py: 0.5,
                          '&.MuiButton-contained': {
                            color: '#fff',
                          },
                        }}
                      >
                        Table
                      </Button>
                    </Stack>
                  </Box>
                  {overrideStatsViewMode === "table" ? (
                    <DashboardTable
                      padding={0}
                      data={epickData?.overrideRequestStatistics ? [
                        {
                          id: 1,
                          type: "Total Requests",
                          count: epickData.overrideRequestStatistics.totalRequests,
                          color: theme.palette.warning.main,
                        },
                        {
                          id: 2,
                          type: "Accepted Requests",
                          count: epickData.overrideRequestStatistics.totalAcceptedRequests,
                          color: theme.palette.success.main,
                        },
                        {
                          id: 3,
                          type: "Rejected Requests",
                          count: epickData.overrideRequestStatistics.totalRejectedRequests,
                          color: theme.palette.error.main,
                        },
                      ] : []}
                      columns={overrideStatsColumns}
                      currentPage={1}
                      totalPages={1}
                      totalItems={epickData?.overrideRequestStatistics ? 3 : 0}
                      stickyHeader={true}
                      pageSize={3}
                      onPageChange={() => {}}
                      onPageSizeChange={() => {}}
                      showPageSizeSelector={false}
                      showTotalItems={false}
                      showPageNumbers={false}
                      loading={epickLoading}
                      containerHeight="300px"
                      emptyStateComponent={<Typography>No override data</Typography>}
                    />
                  ) : (
                    <Box sx={{ height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={epickData?.overrideRequestStatistics ? [
                              {
                                name: "Accepted",
                                value: epickData.overrideRequestStatistics.totalAcceptedRequests,
                                color: theme.palette.success.main,
                              },
                              {
                                name: "Rejected",
                                value: epickData.overrideRequestStatistics.totalRejectedRequests,
                                color: theme.palette.error.main,
                              },
                            ].filter(item => item.value > 0) : []}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={8}
                            stroke="none"
                            paddingAngle={2}
                            isAnimationActive
                          >
                            {epickData?.overrideRequestStatistics ? [
                              <Cell key="accepted" fill={theme.palette.success.main} />,
                              <Cell key="rejected" fill={theme.palette.error.main} />,
                            ] : []}
                          </Pie>
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "16px",
                              fontWeight: 500,
                              fill: theme.palette.text.primary,
                            }}
                          >
                            Requests
                          </text>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as any;
                                return (
                                  <Paper
                                    elevation={8}
                                    sx={{
                                      p: 1,
                                      background: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.95)
                                        : theme.palette.background.paper,
                                      border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.4)}` : 'none',
                                      borderRadius: 2,
                                    }}
                                  >
                                    <Typography fontSize={12} fontWeight={500} mb={0.5}>
                                      {data.name}
                                    </Typography>
                                    <Typography fontSize={11} color="text.secondary">
                                      Requests: {data.value.toLocaleString()}
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Loss Quantity View All Modal */}
      <CommonModal
        open={lossQtyModalOpen}
        onClose={() => setLossQtyModalOpen(false)}
        size="xl"
        title="Loss Quantity Report - Full Data"
        maxWidth="95vw"
      >
        <Box>
          {/* Summary Totals and PDF Download Button */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={1}
            flexWrap="wrap"
            gap={1}
          >
            <Box display="flex" gap={1} flexWrap="wrap">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${theme.palette.error.main}`,
                }}
              >
                <Typography fontSize={12} fontWeight={500} color="text.secondary">
                  Total Loss Qty:
                </Typography>
                <Typography fontSize={12} fontWeight={500} color="error.main">
                  {lossQtyMergedData.reduce((sum, item) => sum + (item.Loss_Qty || 0), 0).toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${theme.palette.error.main}`,
                }}
              >
                <Typography fontSize={12} fontWeight={500} color="text.secondary">
                  Total Ext Lost:
                </Typography>
                <Typography fontSize={12} fontWeight={500} color="error.main">
                  ${lossQtyMergedData.reduce((sum, item) => sum + (item.Ext_Loss || 0), 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={!generatingPDF ? <PdfIcon /> : undefined}
              onClick={handleGenerateLossQtyPDF}
              disabled={generatingPDF || lossQtyMergedData.length === 0}
              sx={{
                textTransform: 'none',
                minWidth: 150,
                color: '#fff',
              }}
            >
              {generatingPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </Box>
          <DashboardTable
            padding={0}
            data={getPaginatedLossQtyData()}
            columns={lossQtyModalColumns}
            currentPage={lossQtyModalPage}
            totalPages={lossQtyModalTotalPages}
            totalItems={lossQtyMergedData.length}
            stickyHeader={true}
            pageSize={lossQtyModalPageSize}
            onPageChange={handleLossQtyModalPageChange}
            onPageSizeChange={handleLossQtyModalPageSizeChange}
            pageSizeOptions={[25, 50, 100, 200]}
            showPageSizeSelector={true}
            showTotalItems={true}
            showPageNumbers={true}
            loading={lossQtyLoading}
            containerHeight="70vh"
            emptyStateComponent={<Typography>No loss quantity data</Typography>}
          />
        </Box>
      </CommonModal>

      {/* High Demand Items View All Modal */}
      <CommonModal
        open={highDemandModalOpen}
        onClose={() => setHighDemandModalOpen(false)}
        size="xl"
        title="High Demand Products - Full Data"
        maxWidth="95vw"
      >
        <Box>
          {/* Summary Totals */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={1}
            flexWrap="wrap"
            gap={1}
          >
            <Box display="flex" gap={1} flexWrap="wrap">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${theme.palette.primary.main}`,
                }}
              >
                <Typography fontSize={12} fontWeight={500} color="text.secondary">
                  Total Quantity:
                </Typography>
                <Typography fontSize={12} fontWeight={500} color="primary.main">
                  {highDemandFullData.reduce((sum, item) => sum + (item.totalQuantityOrdered || 0), 0).toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${theme.palette.success.main}`,
                }}
              >
                <Typography fontSize={12} fontWeight={500} color="text.secondary">
                  Total Orders:
                </Typography>
                <Typography fontSize={12} fontWeight={500} color="success.main">
                  {highDemandFullData.reduce((sum, item) => sum + (item.orderCount || 0), 0).toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${theme.palette.info.main}`,
                }}
              >
                <Typography fontSize={12} fontWeight={500} color="text.secondary">
                  Total Items:
                </Typography>
                <Typography fontSize={12} fontWeight={500} color="info.main">
                  {highDemandFullData.length}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={!generatingHighDemandPDF ? <PdfIcon /> : undefined}
              onClick={handleGenerateHighDemandPDF}
              disabled={generatingHighDemandPDF || highDemandFullData.length === 0}
              sx={{
                textTransform: 'none',
                minWidth: 150,
                color: '#fff',
              }}
            >
              {generatingHighDemandPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </Box>
          <DashboardTable
            padding={0}
            data={getPaginatedHighDemandData()}
            columns={highDemandModalColumns}
            currentPage={highDemandModalPage}
            totalPages={highDemandModalTotalPages}
            totalItems={highDemandFullData.length}
            stickyHeader={true}
            pageSize={highDemandModalPageSize}
            onPageChange={handleHighDemandModalPageChange}
            onPageSizeChange={handleHighDemandModalPageSizeChange}
            pageSizeOptions={[25, 50, 100, 200]}
            showPageSizeSelector={true}
            showTotalItems={true}
            showPageNumbers={true}
            loading={highDemandLoading}
            containerHeight="70vh"
            emptyStateComponent={<Typography>No high demand products data</Typography>}
            sortField={highDemandSortField}
            sortDirection={highDemandSortDirection}
            onSort={handleHighDemandSort}
          />
        </Box>
      </CommonModal>

      {/* Order Detail Modal (Current Order Status line items) */}
      <CommonModal
        open={orderDetailModalOpen}
        onClose={handleCloseOrderDetailModal}
        size="lg"
        title={orderDetailModalOrderId != null ? `Order #${orderDetailModalOrderId} - Line Items` : "Order Details"}
        maxWidth="90vw"
      >
        <Box>
          {!orderDetailModalLoading && orderDetailModalData.length > 0 && (
            <Box
              display="flex"
              flexWrap="wrap"
              gap={2}
              alignItems="center"
              mb={1.5}
              px={0.5}
              py={1}
              sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.06), borderRadius: 1 }}
            >
              <Typography fontSize={13} fontWeight={600} color="text.primary">
                Total Qty Ordered:{" "}
                <Box component="span" color="primary.main">
                  {orderDetailModalData.reduce((s, row) => s + Number(row.Quantity_Ordered ?? 0), 0)}
                </Box>
              </Typography>
              <Typography fontSize={13} fontWeight={600} color="text.primary">
                Total Qty Shipped:{" "}
                <Box component="span" color="primary.main">
                  {orderDetailModalData.reduce((s, row) => s + Number(row.Quantity_Shipped ?? 0), 0)}
                </Box>
              </Typography>
              <Typography fontSize={13} fontWeight={600} color="text.primary">
                Total Price:{" "}
                <Box component="span" color="primary.main">
                  $
                  {orderDetailModalData
                    .reduce((s, row) => {
                      const unitPrice =
                        Number(row.Price ?? 0) + Number(row.OTP_Amount_State ?? 0) + Number(row.PrepaidTax_Amount ?? 0);
                      return s + unitPrice * Number(row.Quantity_Ordered ?? 0);
                    }, 0)
                    .toFixed(2)}
                </Box>
              </Typography>
            </Box>
          )}
          {orderDetailModalLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <LoadingSpinner />
            </Box>
          ) : (
            <DashboardTable
              padding={0}
              data={orderDetailModalData}
              columns={orderDetailModalColumns}
              currentPage={1}
              totalPages={1}
              totalItems={orderDetailModalData.length}
              stickyHeader={true}
              pageSize={orderDetailModalData.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
              showPageSizeSelector={false}
              showTotalItems={true}
              showPageNumbers={false}
              loading={false}
              containerHeight="60vh"
              emptyStateComponent={<Typography>No line items for this order</Typography>}
            />
          )}
        </Box>
      </CommonModal>

    </Box>
  );
};

export default AdminDashboard;
