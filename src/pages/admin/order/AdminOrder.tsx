import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Typography, useMediaQuery, Paper, IconButton, CircularProgress, SelectChangeEvent, Drawer, Button } from "@mui/material";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import { VisibilityOutlined,
   Print as PrintIcon,
  //  Receipt as ReceiptIcon
   } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getOrderHistory, getOrderDetailByOrderNumberForInvoice, getOrderForPickListConfirmation, getCreateInvoice, getCustomerInvoiceTemplate } from "../../../redux/apis/distrubutor/orderDistrubutorApis";
import { getCustomerList } from "../../../redux/apis/distrubutor/listApis";
import { makePickListPrinted, makeBulkPickListPrinted } from "../../../redux/apis/distrubutor/settingApis";
import CustomAutoComplete from '../../../component/atoms/CustomAutoComplete';
import CustomDateRangePicker from "../../../component/atoms/CustomDateRangePicker";
import SelectInput from "../../../component/atoms/SelectInput";
import { MultiSearchableDropdown } from "../../../component/atoms/SearchableDropdown";
import { generatePicklistPDF, generateBulkPicklistPDF, type PicklistOrderData } from "../../../utils/picklistPdfGenerator";
import { generateInvoicePDF, apiTemplateToInvoiceConfig, type InvoiceOrderData } from "../../../utils/invoicePdfGenerator";
import type { InvoiceTemplateApi } from "../../../redux/apis/manager/invoiceTemplateApis";
import toast from 'react-hot-toast';

const AdminOrder = () => {
  const navigate = useNavigate();
  const wareHouseDetail = useSelector((state: { auth?: { wareHouseDetail?: Array<{ D_Logo?: string }> } }) => state.auth?.wareHouseDetail);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStartDate, setSelectedStartDate] = useState<any>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<any>(null);
  const [printingOrder, setPrintingOrder] = useState<string | null>(null);
  const [printingInvoiceOrder, setPrintingInvoiceOrder] = useState<string | null>(null);
  console.log("printingInvoiceOrder", printingInvoiceOrder);
  // Bulk picklist drawer
  type Option = { label: string; value: string };
  const [bulkPicklistDrawerOpen, setBulkPicklistDrawerOpen] = useState(false);
  const [bulkPicklistOrderNumberOptions, setBulkPicklistOrderNumberOptions] = useState<Option[]>([]);
  const [selectedBulkOrderNumbers, setSelectedBulkOrderNumbers] = useState<Option[]>([]);
  const [bulkPrintLoading, setBulkPrintLoading] = useState(false);
  const [bulkOrderNumbersLoading, setBulkOrderNumbersLoading] = useState(false);
  
  // Filter state
  const [filterType, setFilterType] = useState<string>('currentStatus'); // 'isDeleted', 'updated', 'currentStatus', or ''
  const [currentStatus, setCurrentStatus] = useState<string>('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleViewOrder = (orderId: string, isConfirmed?: boolean) => {
    navigate(`/admin/order/details/${orderId}`, {
      state: { isConfirmed }
    });
  };

  // Transform API invoice response to picklist order data (shared for single and bulk print)
  const invoiceResponseToOrderData = (invoiceData: any, orderNumber: string, isReprint: boolean): PicklistOrderData | null => {
    const orderHeader = invoiceData?.orderHeader;
    if (!orderHeader) return null;
    const orderDetails = orderHeader.orderDetails || [];
    const distributor = orderHeader.distributor || {};
    const customer = orderHeader.customer || {};
    const items = orderDetails.map((item: any, index: number) => {
      const upc = item.inventory?.UPCList?.[0]?.UPC_Number || item.UPC_Number || item.UPC || item.inventory?.UPC || '';
      const description = item.inventory?.Description || item.ItemDescription || item.Description || item.Item_Description || '';
      const size = item.inventory?.UOM || item.UOM || item.Size || '';
      const lineNumber = item.Line_Number != null ? Number(item.Line_Number) : index + 1;
      const orderedQty = item.Quantity_Ordered != null ? Number(item.Quantity_Ordered) : (item.QuantityOrdered != null ? Number(item.QuantityOrdered) : 0);
      const itemNumber = item.Item_Number != null ? String(item.Item_Number) : (item.ItemNumber != null ? String(item.ItemNumber) : (item.inventory?.Item_Number != null ? String(item.inventory.Item_Number) : ''));
      const pack = item.Pack != null ? Number(item.Pack) : (item.inventory?.Pack != null ? Number(item.inventory.Pack) : (item.CaseCount != null ? Number(item.CaseCount) : (item.inventory?.CaseCount != null ? Number(item.inventory.CaseCount) : 1)));
      const unitCost = item.Price != null ? Number(item.Price) : (item.inventory?.Price != null ? Number(item.inventory.Price) : 0);
      const otpAmountState = item.OTP_Amount_State != null ? Number(item.OTP_Amount_State) : 0;
      const prepaidTaxAmount = item.PrepaidTax_Amount != null ? Number(item.PrepaidTax_Amount) : 0;
      const extendedCost = (unitCost + otpAmountState) * orderedQty + prepaidTaxAmount;
      const retail = item.Retail != null ? Number(item.Retail) : (item.Retail_Price != null ? Number(item.Retail_Price) : (item.inventory?.Retail != null ? Number(item.inventory.Retail) : (item.Price != null ? Number(item.Price) : 0)));
      const sequence = item.Sequence != null ? Number(item.Sequence) : (item.inventory?.Sequence != null ? Number(item.inventory.Sequence) : (item.Line_Number != null ? Number(item.Line_Number) : index + 1));
      const salesCategory = item.inventory?.SalesCategory?.Category_Desc || item.Sales_Category_Desc || item.SalesCategory || (item.Sales_Category != null ? String(item.Sales_Category) : '') || '';
      const priceClass = item.inventory?.PriceClass?.Class_Desc || item.Price_Class_Desc || item.PriceClass || item.Price_Class || item.inventory?.Price_Class_Desc || '';
      const section = item.inventory?.Section || item.Section || item.inventory?.Section2 || '';
      const location = item.inventory?.Location !== undefined && item.inventory?.Location !== null ? (item.inventory.Location === 0 ? '' : String(item.inventory.Location)) : (item.Location !== undefined && item.Location !== null ? (item.Location === 0 ? '' : String(item.Location)) : (item.inventory?.Location2 !== undefined && item.inventory?.Location2 !== null ? (item.inventory.Location2 === 0 ? '' : String(item.inventory.Location2)) : ''));
      const vendorItem = item.inventory?.Vendor_ItemNumberAlpha || item.inventory?.Vendor_Item || item.Vendor_Item || item.VendorItem || item.inventory?.VendorItem || '';
      return { lineNumber, orderedQty, scannedQty: '', itemNumber, description: String(description || ''), pack, size: String(size || ''), upc: String(upc || ''), onhand: 0, salesCategory: String(salesCategory), priceClass: String(priceClass), unitCost, extendedCost, retail, section: String(section), location: String(location), vendorItem: String(vendorItem), sequence };
    });
    const totals = { totalPieces: items.reduce((s: number, i: any) => s + (i.orderedQty || 0), 0), totalCartons: items.length, totalLines: items.length, totalExtendedCost: items.reduce((s: number, i: any) => s + (i.extendedCost || 0), 0) };
    const customerRoute = customer.Routes?.length > 0 ? customer.Routes[0].Route_Number ?? 0 : (customer.Route ?? 0);
    const customerStop = customer.Routes?.length > 0 ? customer.Routes[0].Stop_Number ?? 0 : (customer.Stop ?? 0);
    const fullAddress = [customer.C_Address, customer.C_City, customer.C_State, customer.C_Zip].filter(Boolean).join(', ');
    const distributorAddress = [distributor.D_Addr1, distributor.D_Addr2, distributor.D_City, distributor.D_State, distributor.D_Zip].filter(Boolean).join(', ');
    return {
      customer: { number: orderHeader.C_Number ?? customer.C_Number ?? 0, name: customer.C_Name || customer.C_CoName || '', address: fullAddress || customer.C_Address || '', route: customerRoute, stop: customerStop },
      distributor: { name: distributor.D_Name || '', address: distributorAddress || distributor.D_Addr1 || '' },
      invoiceNumber: orderHeader.Invoice_Number || orderHeader.InvoiceNumber || String(orderHeader.Order_Number || orderNumber),
      isReprint,
      orderNumber: String(orderHeader.Order_Number || orderNumber),
      orderDate: orderHeader.Order_Date || '',
      invoiceDate: orderHeader.Invoice_Date || orderHeader.InvoiceDate || orderHeader.Order_Date || '',
      items,
      totals: { totalPieces: totals.totalPieces, totalCartons: totals.totalCartons, totalLines: totals.totalLines },
    };
  };

  // Transform createInvoice API response to invoice PDF order data (invoice only – do not use orderDetailByOrderNumberForInvoice)
  const createInvoiceResponseToOrderData = (createInvoiceData: any, orderNumber: string): InvoiceOrderData | null => {
    const header = createInvoiceData?.invoiceHeader;
    if (!header) return null;
    const invoiceItems = createInvoiceData?.invoiceItems || [];
    const customer = header.customer || {};
    let subTotal = 0;
    const items = invoiceItems.map((item: any, index: number) => {
      const upc = item.inventory?.UPCList?.[0]?.UPC_Number || item.UPC_Number || item.UPC || '';
      const orderQty = item.Quantity_Ordered != null ? Number(item.Quantity_Ordered) : 0;
      const shippedQty = item.Quantity_Shipped != null ? Number(item.Quantity_Shipped) : 0;
      // Out-of-stock: show message when shipped < ordered (treat missing Quantity_Shipped as 0 so message always shows when nothing shipped).
      const outOfStockNote = orderQty > 0 && shippedQty < orderQty;
      // Description: ItemDescription → Item_Message → inventory.Description. When outOfStockNote, PDF shows this + "*This item was out of stock" below (small font).
      const itemDesc = (item.ItemDescription != null && String(item.ItemDescription).trim() !== '') ? String(item.ItemDescription).trim() : '';
      const itemMsg = (item.Item_Message != null && String(item.Item_Message).trim() !== '') ? String(item.Item_Message).trim() : '';
      const invDesc = item.inventory?.Description || item.Description || '';
      const description = invDesc || itemDesc || itemMsg || '';
      const itemNumber = item.Item_Number != null ? String(item.Item_Number) : (item.inventory?.Item_Number != null ? String(item.inventory.Item_Number) : '');
      const sortNumber = item.inventory?.Sequence != null ? Number(item.inventory.Sequence) : index + 1;
      const price = item.Price != null ? Number(item.Price) : 0;
      const unitPrice = item.inventory?.Unit_Price != null ? Number(item.inventory.Unit_Price) : (item.Unit_Price != null ? Number(item.Unit_Price) : price);
      const otpAmountState = item.OTP_Amount_State != null ? Number(item.OTP_Amount_State) : 0;
      const prepaidTaxAmount = item.PrepaidTax_Amount != null ? Number(item.PrepaidTax_Amount) : 0;
      // Frontend-only (not from backend): Price w/t with PPD, Price w/t without PPD, Total PPD, Extended total.
      // Price w/t = price + OTP_Amount_State + PrepaidTax_Amount (per unit)
      const priceWithTax = price + otpAmountState + prepaidTaxAmount;
      // Total Price = price w/t * qty
      const totalPrice = priceWithTax * shippedQty;
      const priceWithTaxWithoutPPD = price + otpAmountState;
      const taxPerUnit = otpAmountState + prepaidTaxAmount;
      subTotal += totalPrice;
      const retail1 = item.inventory?.Retail1 != null ? Number(item.inventory.Retail1) : price;
      const salesCategory = item.inventory?.SalesCategory?.Category_Desc || item.Sales_Category_Desc || (item.Sales_Category != null ? String(item.Sales_Category) : '');
      // Deposit (CRV): DepositAmount per unit; line deposit = Quantity_Shipped * DepositAmount
      const depositAmount = item.DepositAmount != null ? Number(item.DepositAmount) : 0;
      const deposit = shippedQty * depositAmount;
      // Pack (item.Pack); Size = UOM from inventory or item
      const pack = item.Pack != null ? (typeof item.Pack === 'number' ? item.Pack : Number(item.Pack)) : undefined;
      const size = (item.inventory?.UOM != null && String(item.inventory.UOM).trim() !== '') ? String(item.inventory.UOM).trim() : (item.UOM != null ? String(item.UOM) : undefined);
      return {
        orderQty,
        shippedQty,
        description: String(description || ''),
        outOfStockNote,
        itemNumber,
        sortNumber,
        upc: String(upc || ''),
        pack,
        size,
        price,
        unitPrice,
        tax: taxPerUnit * shippedQty,
        prepaidTaxAmount,
        priceWithTax,
        priceWithTaxWithPPD: priceWithTax,
        priceWithTaxWithoutPPD,
        totalPrice,
        retail1,
        ebt: item.EBT === true || item.EBT === 1,
        salesCategory,
        deposit,
      };
    });
    const route = header.Route_Number != null ? Number(header.Route_Number) : 0;
    const stop = header.Stop_Number != null ? Number(header.Stop_Number) : 0;
    const fullAddress = [customer.C_Address, customer.C_City, customer.C_State, customer.C_Zip].filter(Boolean).join(', ');
    const billTo = customer.billTo != null && typeof customer.billTo === 'object'
      ? (() => {
          const b = customer.billTo as { C_Name?: string; C_CoName?: string; C_Address?: string; C_City?: string; C_State?: string; C_Zip?: string; C_Phone?: string };
          const addr = [b.C_Address, b.C_City, b.C_State, b.C_Zip].filter(Boolean).join(', ');
          return { name: b.C_Name || b.C_CoName || '', address: addr || (b.C_Address || ''), phone: b.C_Phone || '' };
        })()
      : undefined;
    const totalPrepaidTax = items.reduce((sum: number, i: { prepaidTaxAmount?: number; shippedQty: number }) => sum + (Number(i.prepaidTaxAmount ?? 0) * (Number(i.shippedQty) || 0)), 0);
    const deliveryCharge = header.Delivery_Charge != null ? Number(header.Delivery_Charge) : 0;
    const depositTotal = items.reduce((sum: number, i: { deposit?: number }) => sum + (Number(i.deposit) || 0), 0);
    // Prefer backend-provided previousBalance when available; fall back to customer's LastBalance.
    const lastBalance =
      createInvoiceData?.previousBalance != null
        ? Number(createInvoiceData.previousBalance)
        : customer.LastBalance != null
          ? Number(customer.LastBalance)
          : 0;
    const houseCharge = header.HouseChargeApplied != null ? Number(header.HouseChargeApplied) : (header.POS_House != null ? Number(header.POS_House) : 0);
    const posCheck = header.POS_Check != null ? Number(header.POS_Check) : 0;
    const posCash = header.POS_Cash != null ? Number(header.POS_Cash) : 0;
    const posCredit = header.POS_Credit != null ? Number(header.POS_Credit) : 0;
    const baseTotal = subTotal + deliveryCharge + depositTotal;
    // Invoice total = base only; house charge, POS_Check, POS_Cash, POS_Credit are display-only (not in total).
    const invoiceTotal = header.Invoice_Total != null ? Number(header.Invoice_Total) : baseTotal;
    // Last balance: if negative then subtract from total; if positive then add to total.
    const totalAmountDue = lastBalance >= 0 ? invoiceTotal + lastBalance : invoiceTotal - lastBalance;
    const invoiceNum = header.Invoice_Number ?? header.LastInvoiceNumber ?? header.Order_Number;
    const invoiceDate = header.Invoice_Date || header.Order_Date || '';
    const salesPerson = header.salesRep?.S_Desc != null ? String(header.salesRep.S_Desc) : '';
    const customerLicense = customer.C_CigtLicenseNumber ?? customer.C_SalesTaxNumber ?? '';
    const termsCode = customer?.terms?.Terms || undefined;
    return {
      customer: {
        number: header.C_Number ?? customer.C_Number ?? 0,
        name: customer.C_Name || customer.C_CoName || '',
        address: fullAddress || customer.C_Address || '',
        route,
        stop,
        phone: customer.C_Phone || customer.C_PhoneMobile || '',
        state: customer.C_State != null ? String(customer.C_State).trim() : undefined,
      },
      distributor: { name: '', address: '' },
      invoiceNumber: String(invoiceNum ?? orderNumber),
      orderNumber: String(header.Order_Number ?? orderNumber),
      orderDate: header.Order_Date || '',
      invoiceDate,
      salesPerson: salesPerson || undefined,
      customerLicense: customerLicense || undefined,
      termsCode,
      billTo,
      via: header.DeliveryType?.Delivery_Description ?? undefined,
      items,
      totals: { subTotal, deliveryCharge, deposit: depositTotal, lastBalance, invoiceTotal, totalAmountDue, totalPrepaidTax, houseCharge, posCheck, posCash, posCredit },
    };
  };

  // Handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle sort direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data based on current sort field and direction
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      // Handle Picklist column - sort by Picklist_Printed
      let actualField = sortField;
      if (sortField === 'Picklist') {
        actualField = 'Picklist_Printed';
      }
      
      let aValue = a[actualField];
      let bValue = b[actualField];
      
      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // Handle boolean values (for Picklist_Printed)
      if (sortField === 'Picklist') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }
      
      // Handle numeric values
      if (actualField === 'totalQuantityOrdered' || actualField === 'route' || actualField === 'stop') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      
      // Handle date values
      if (actualField === 'Order_Date') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Convert to string for comparison if not numeric/date/boolean
      if (typeof aValue !== 'number') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const handlePrintPicklist = async (orderNumber: string, picklistPrinted: boolean = false) => {
    setPrintingOrder(orderNumber);
    try {
      const response: any = await getOrderDetailByOrderNumberForInvoice(orderNumber);
      const invoiceData = response?.data;
      if (!invoiceData?.orderHeader) {
        toast.error('Failed to fetch order details');
        return;
      }
      const isReprint = picklistPrinted || invoiceData.orderHeader.IsReprint || false;
      const orderData = invoiceResponseToOrderData(invoiceData, orderNumber, isReprint);
      if (!orderData) {
        toast.error('Failed to build picklist data');
        return;
      }
      await generatePicklistPDF(orderData);
      if (!picklistPrinted) {
        try {
          await makePickListPrinted(orderNumber);
        } catch (printError: any) {
          console.error('Error marking picklist as printed:', printError);
        }
      }
      toast.success('Picklist PDF generated successfully');
    } catch (error: any) {
      console.error('Error generating picklist PDF:', error);
      toast.error(error?.message || 'Failed to generate picklist PDF');
    } finally {
      setPrintingOrder(null);
    }
  };

  const handleGenerateInvoice = async (orderNumber: string) => {
    setPrintingInvoiceOrder(orderNumber);
    try {
      const res: any = await getCreateInvoice(orderNumber);
      const createInvoiceData = res?.data ?? res;
      if (!createInvoiceData?.invoiceHeader) {
        toast.error('Failed to create invoice or invalid response');
        return;
      }
      const customerNumber = createInvoiceData.invoiceHeader.C_Number ?? createInvoiceData.invoiceHeader.customer?.C_Number;
      let template: InvoiceTemplateApi | null = null;
      if (customerNumber != null) {
        const num = typeof customerNumber === 'number' ? customerNumber : parseInt(String(customerNumber), 10);
        if (!Number.isNaN(num)) template = (await getCustomerInvoiceTemplate(num)) as InvoiceTemplateApi | null;
      }
      if (!template) {
        toast.error('No invoice template assigned to this customer. Assign a template in Settings > Invoice Template.');
        return;
      }
      // Ensure template has expected shape so PDF matches customer template (all fields used)
      const isValidTemplate =
        typeof template === 'object' &&
        template !== null &&
        ('selectedColumns' in template || 'groupBy' in template);
      if (!isValidTemplate) {
        toast.error('Invalid invoice template data. Please reassign the template in Settings > Invoice Template.');
        return;
      }
      const orderData = createInvoiceResponseToOrderData(createInvoiceData, orderNumber);
      if (!orderData) {
        toast.error('Failed to build invoice data');
        return;
      }
      const config = apiTemplateToInvoiceConfig(template);
      const warehouseLogoUrl = wareHouseDetail?.[0]?.D_Logo ?? undefined;
      await generateInvoicePDF(orderData, config, { print: true, warehouseLogoUrl });
      toast.success('Invoice print dialog opened');
    } catch (error: any) {
      console.error('Error generating invoice PDF:', error);
      toast.error(error?.message || 'Failed to generate invoice PDF');
    } finally {
      setPrintingInvoiceOrder(null);
    }
  };
  console.log("handleGenerateInvoice", handleGenerateInvoice);
  const selectedOrderNumbers = selectedBulkOrderNumbers.map((o) => o.value);

  const handleBulkPicklistPrint = async () => {
    if (!selectedOrderNumbers.length) {
      toast.error('Please select at least one order');
      return;
    }
    setBulkPrintLoading(true);
    try {
      const orderDataList: PicklistOrderData[] = [];
      for (const orderNum of selectedOrderNumbers) {
        const response: any = await getOrderDetailByOrderNumberForInvoice(orderNum);
        const invoiceData = response?.data;
        if (!invoiceData?.orderHeader) {
          toast.error(`Failed to fetch order ${orderNum}`);
          continue;
        }
        const orderData = invoiceResponseToOrderData(invoiceData, orderNum, false);
        if (orderData) orderDataList.push(orderData);
      }
      if (orderDataList.length === 0) {
        toast.error('No valid order data to print');
        return;
      }
      await generateBulkPicklistPDF(orderDataList);
      try {
        await makeBulkPickListPrinted(selectedOrderNumbers);
      } catch (markError: any) {
        console.error('Error marking bulk picklist as printed:', markError);
      }
      toast.success(`Bulk picklist generated (${orderDataList.length} order(s)) in one document.`);
      setBulkPicklistDrawerOpen(false);
      setSelectedBulkOrderNumbers([]);
    } catch (error: any) {
      console.error('Error generating bulk picklist:', error);
      toast.error(error?.message || 'Failed to generate bulk picklist PDF');
    } finally {
      setBulkPrintLoading(false);
    }
  };

  const columns: TableColumn<any>[] = [
    { 
      id: "Order_Number", 
      label: "Order Number", 
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Number}</Typography>
        </Box>
      )  
    },
    { 
      id: "Order_Date", 
      label: "Date", 
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Date}</Typography>
        </Box>
      )  
    },
    { 
      id: "customerName", 
      label: "Customer Name", 
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.customerName}</Typography>
        </Box>
      )  
    },
    { 
      id: "address", 
      label: "Address", 
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.address || "-"}</Typography>
        </Box>
      )  
    },
    { 
      id: "route", 
      label: "Route", 
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.route || "-"}</Typography>
        </Box>
      )  
    },
    { 
      id: "stop", 
      label: "Stop", 
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.stop || "-"}</Typography>
        </Box>
      )  
    },
    { 
      id: "totalQuantityOrdered", 
      label: "Item (Qty)", 
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{Number(row.totalQuantityOrdered).toFixed(0)}</Typography>
        </Box>
      )  
    },
    { 
      id: "Order_Source_Name", 
      label: "Platforms", 
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.Order_Source_Name}</Typography>
        </Box>
      )  
    },
    {
      id: "isConfirmed",
      label: "isConfirmed",
      sortable: true,
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={12} fontWeight={400} color="text.secondary">{row.isConfirmed ? "Yes" : "No"}</Typography>
        </Box>
      )  
    },
    {
      id: "Picklist",
      label: "Picklist",
      sortable: true,
      render: (row) => {
        const hidePicklist = (row.Invoice_Number != null && row.Invoice_Number > 0) || row.isConfirmed === true;
        if (hidePicklist) {
          return <Typography fontSize={12} color="text.secondary">—</Typography>;
        }
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
            <IconButton
              size="small"
              onClick={() => handlePrintPicklist(row.Order_Number, row.Picklist_Printed)}
              disabled={printingOrder === row.Order_Number}
              sx={{ p: 0.5 }}
              title={row.Picklist_Printed ? "Reprint Picklist" : "Print Picklist"}
            >
              {printingOrder === row.Order_Number ? (
                <CircularProgress size={16} />
              ) : (
                <PrintIcon sx={{ fontSize: 18, color: "primary.main", cursor: "pointer" }} />
              )}
            </IconButton>
            {row.Picklist_Printed && (
              <Typography fontSize={10} fontWeight={400} color="text.secondary">
                Picklist Printed
              </Typography>
            )}
          </Box>
        );
      },
    },
    // {
    //   id: "Invoice",
    //   label: "Invoice",
    //   render: (row) => {
    //     const showInvoice = row.Invoice_Number != null && row.Invoice_Number > 0;
    //     if (!showInvoice) {
    //       return <Typography fontSize={12} color="text.secondary">—</Typography>;
    //     }
    //     return (
    //       <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
    //         <IconButton
    //           size="small"
    //           onClick={() => handleGenerateInvoice(row.Order_Number)}
    //           disabled={printingInvoiceOrder === row.Order_Number}
    //           sx={{ p: 0.5 }}
    //           title="Generate Invoice"
    //         >
    //           {printingInvoiceOrder === row.Order_Number ? (
    //             <CircularProgress size={16} />
    //           ) : (
    //             <ReceiptIcon sx={{ fontSize: 18, color: "primary.main", cursor: "pointer" }} />
    //           )}
    //         </IconButton>
    //       </Box>
    //     );
    //   },
    // },
    {
      id: "actions",
      label: "Actions",
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityOutlined 
            sx={{ cursor: "pointer", color: "primary.main" }} 
            onClick={() => handleViewOrder(row.Order_Number, row.isConfirmed)}
          />
        </Box>
      ),
    },
  ];

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response: any = await getCustomerList();
      setCustomers(response?.data?.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch data with pagination
  const fetchData = async (page: number, size: number, customerId: string, startDate: any, endDate: any, filterType: string, currentStatus: string) => {
    setLoading(true);
    try {
      // Determine which filter to send based on filterType
      let isDeleted: boolean | undefined = undefined;
      let updated: boolean | undefined = undefined;
      let status: string | undefined = undefined;
      
      if (filterType === 'isDeleted') {
        isDeleted = true;
      } else if (filterType === 'updated') {
        updated = true;
      } else if (filterType === 'currentStatus' && currentStatus) {
        status = currentStatus; // Pass 'all' or any other selected status
        isDeleted = false;
        updated = false;
      }
      
      const response: any = await getOrderHistory(page, size, customerId, startDate, endDate, isDeleted, updated, status);
      setData(response?.data?.orderList || []);
      setTotalItems(response?.data?.totalCount || 0);
      setTotalPages(response?.data?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle customer selection
  const handleCustomerChange = (newValue: any) => {
    setSelectedCustomer(newValue);
    setCurrentPage(1); // Reset to first page when changing customer
  };

  // Handle filter changes
  const handleFilterTypeChange = (event: SelectChangeEvent<unknown>) => {
    const newFilterType = event.target.value as string;
    setFilterType(newFilterType);
    // Reset currentStatus when switching away from currentStatus filter
    if (newFilterType !== 'currentStatus') {
      setCurrentStatus('all');
    }
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleCurrentStatusChange = (event: SelectChangeEvent<unknown>) => {
    setCurrentStatus(event.target.value as string);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Build same filter params as orderHistory (used for main list and for picklist order numbers)
  const pickListFilterParams = useMemo(() => {
    let isDeleted: boolean | undefined;
    let updated: boolean | undefined;
    let status: string | undefined;
    if (filterType === 'isDeleted') {
      isDeleted = true;
    } else if (filterType === 'updated') {
      updated = true;
    } else if (filterType === 'currentStatus' && currentStatus) {
      status = currentStatus;
      isDeleted = false;
      updated = false;
    }
    return {
      isDeleted,
      updated,
      currentStatus: status,
      startDate: selectedStartDate,
      endDate: selectedEndDate,
    };
  }, [filterType, currentStatus, selectedStartDate, selectedEndDate]);

  // Fetch order number options from orderForPickListConfirmation with same filters as main list
  useEffect(() => {
    if (!bulkPicklistDrawerOpen) return;
    setBulkOrderNumbersLoading(true);
    getOrderForPickListConfirmation(pickListFilterParams)
      .then((res: any) => {
        const orderList = res?.data?.orderList ?? res?.orderList ?? res?.data ?? [];
        const list = Array.isArray(orderList) ? orderList : [];
        const options: Option[] = list.map((item: any) => {
          const num = item?.Order_Number ?? item?.order_Number ?? item;
          const customerName = item?.customer?.C_Name ?? item?.customer?.C_CoName ?? item?.C_Name ?? '';
          const label = customerName ? `${num} - ${customerName}` : String(num);
          return { label, value: String(num) };
        });
        setBulkPicklistOrderNumberOptions(options);
      })
      .catch(() => setBulkPicklistOrderNumberOptions([]))
      .finally(() => setBulkOrderNumbersLoading(false));
  }, [bulkPicklistDrawerOpen, pickListFilterParams]);

  // Fetch data when page, pageSize, customer, or filters change
  useEffect(() => {
    fetchData(currentPage, pageSize, selectedCustomer?.C_Number || '', selectedStartDate, selectedEndDate, filterType, currentStatus);
  }, [currentPage, pageSize, selectedCustomer, selectedStartDate, selectedEndDate, filterType, currentStatus]);

  return (
    <Box sx={{ padding: "10px 20px" }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Filter Bar */}
        <Box display="flex" flexDirection="column" gap={2} mb={1} px={2}>
          {/* First Row: Customer, Filters, and Date Range */}
          <Box display={useMediaQuery("(max-width: 600px)") ? "block" : "flex"} justifyContent="space-between" alignItems="center" gap={2}>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <CustomAutoComplete
                fullWidth={false}
                options={customers}
                getOptionLabel={(option) => {
                  const name = option.C_Name || option.C_CoName || '';
                  const number = option.C_Number ? ` (${option.C_Number})` : '';
                  return `${name}${number}`;
                }}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                label="Search Customer"
                size="small"
                placeholder="Type to search customers..."
              />
              
              {/* First Dropdown: Filter Type */}
              <SelectInput
                options={[
                  { label: 'All', value: '' },
                  { label: 'Deleted', value: 'isDeleted' },
                  { label: 'Updated', value: 'updated' },
                  { label: 'Current', value: 'currentStatus' },
                ]}
                value={filterType}
                onChange={handleFilterTypeChange}
                marginBottom="0"
              />
              
              {/* Second Dropdown: Current Status (only shown when Current Status is selected) */}
              {filterType === 'currentStatus' && (
                <SelectInput
                  options={[
                    { label: 'All Orders', value: 'all' },
                    { label: 'Orders in Progress', value: 'recordLocks' },
                    { label: 'Order Confirmation', value: 'orderConfirmation' },
                    { label: 'Invoiced', value: 'invoices' },
                    { label: 'Non Invoiced', value: 'non_invoices' },
                    { label: 'Picklist', value: 'picklist' },
                    { label: 'Epick Confirmed', value: 'EpickStatusFromPicker' },
                  ]}
                  value={currentStatus}
                  onChange={handleCurrentStatusChange}
                  marginBottom="0"
                />
              )}
            </Box>
<Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <CustomDateRangePicker 
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              onStartDateChange={setSelectedStartDate}
              onEndDateChange={setSelectedEndDate}
              isLabel={false}
              sx={{mb: 0, width: {xs: "100%", md: "auto"}}}
            />

            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => setBulkPicklistDrawerOpen(true)}
            >
              Print bulk picklist
            </Button>
            </Box>
          </Box>

          
        </Box>

        {/* Table */}
        <CommonTable
          data={sortedData}
          containerHeight="calc(100vh - 380px)"
          columns={columns}
          // Pagination props
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          // Optional pagination customization
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSizeSelector={true}
          showTotalItems={true}
          showPageNumbers={true}
          stickyLastThreeColumns={true}
          stickyFirstColumn={true}
          maxPageNumbers={5}
          // Other props
          loading={loading}
          filterComponent={null}
          // Sorting props
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Paper>

      <Drawer
        anchor="right"
        open={bulkPicklistDrawerOpen}
        onClose={() => !bulkPrintLoading && setBulkPicklistDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">Print bulk picklist</Typography>
          <MultiSearchableDropdown
            label="Order numbers"
            options={bulkPicklistOrderNumberOptions}
            value={selectedBulkOrderNumbers}
            onChange={setSelectedBulkOrderNumbers}
            placeholder="Search order numbers..."
            loading={bulkOrderNumbersLoading}
            noOptionsText="No order numbers"
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleBulkPicklistPrint}
              disabled={bulkPrintLoading || selectedOrderNumbers.length === 0}
              startIcon={bulkPrintLoading ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
              sx={{ color: 'white' }}
            >
              {bulkPrintLoading ? 'Generating…' : 'Picklist print'}
            </Button>
            <Button variant="outlined" onClick={() => setBulkPicklistDrawerOpen(false)} disabled={bulkPrintLoading}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default AdminOrder;