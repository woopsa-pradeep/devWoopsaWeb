import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, useMediaQuery, Paper, IconButton, CircularProgress, SelectChangeEvent } from "@mui/material";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import { VisibilityOutlined, Print as PrintIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getOrderHistory, getOrderDetailByOrderNumberForInvoice } from "../../../redux/apis/distrubutor/orderDistrubutorApis";
import { getCustomerList } from "../../../redux/apis/distrubutor/listApis";
import { makePickListPrinted } from "../../../redux/apis/distrubutor/settingApis";
import CustomAutoComplete from '../../../component/atoms/CustomAutoComplete';
import CustomDateRangePicker from "../../../component/atoms/CustomDateRangePicker";
import SelectInput from "../../../component/atoms/SelectInput";
import { generatePicklistPDF } from "../../../utils/picklistPdfGenerator";
import toast from 'react-hot-toast';

const AdminOrder = () => {
  const navigate = useNavigate();
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
      // Fetch order details
      const response: any = await getOrderDetailByOrderNumberForInvoice(orderNumber);
      const invoiceData = response?.data;
      
      if (!invoiceData || !invoiceData.orderHeader) {
        toast.error('Failed to fetch order details');
        return;
      }

      const orderHeader = invoiceData.orderHeader;
      const orderDetails = orderHeader.orderDetails || [];
      const distributor = orderHeader.distributor || {};
      const customer = orderHeader.customer || {};
      
      // Determine if this is a reprint based on Picklist_Printed flag from order list
      const isReprint = picklistPrinted || orderHeader.IsReprint || false;

      // Get template - will use default (most recently updated) template
      // TODO: In future, this will come from API based on order configuration or user selection
      // For now, it uses the template saved in Settings > Picklist Template

      // Transform order data to match picklist format
      const items = orderDetails.map((item: any, index: number) => {
        // Get UPC from inventory if available
        const upc = item.inventory?.UPCList?.[0]?.UPC_Number || 
                   item.UPC_Number || 
                   item.UPC || 
                   item.inventory?.UPC || 
                   '';
        
        // Get description - prioritize inventory.Description, then ItemDescription
        const description = item.inventory?.Description || 
                           item.ItemDescription || 
                           item.Description || 
                           item.Item_Description || 
                           '';
        
        // Get size/UOM - from inventory.UOM
        const size = item.inventory?.UOM || 
                    item.UOM || 
                    item.Size || 
                    '';
        
        // Get on hand from inventory (commented out for now - may come in future API updates)
        // const onhand = item.inventory?.OnHand || 
        //               item.OnHand || 
        //               item.Inventory_OnHand || 
        //               item.inventory?.On_Hand || 
        //               0;
        const onhand = 0; // Temporarily set to 0 until API provides this field
        
        // Ensure proper type conversion
        const lineNumber = item.Line_Number !== undefined && item.Line_Number !== null 
          ? Number(item.Line_Number) 
          : index + 1;
        
        const orderedQty = item.Quantity_Ordered !== undefined && item.Quantity_Ordered !== null
          ? Number(item.Quantity_Ordered)
          : (item.QuantityOrdered !== undefined && item.QuantityOrdered !== null
            ? Number(item.QuantityOrdered)
            : 0);
        
        const itemNumber = item.Item_Number !== undefined && item.Item_Number !== null
          ? String(item.Item_Number)
          : (item.ItemNumber !== undefined && item.ItemNumber !== null
            ? String(item.ItemNumber)
            : (item.inventory?.Item_Number !== undefined && item.inventory?.Item_Number !== null
              ? String(item.inventory.Item_Number)
              : ''));
        
        const pack = item.Pack !== undefined && item.Pack !== null
          ? Number(item.Pack)
          : (item.inventory?.Pack !== undefined && item.inventory?.Pack !== null
            ? Number(item.inventory.Pack)
            : (item.CaseCount !== undefined && item.CaseCount !== null
              ? Number(item.CaseCount)
              : (item.inventory?.CaseCount !== undefined && item.inventory?.CaseCount !== null
                ? Number(item.inventory.CaseCount)
                : 1)));
        
        // Unit cost = Price (as per user requirement)
        const unitCost = item.Price !== undefined && item.Price !== null
          ? Number(item.Price)
          : (item.inventory?.Price !== undefined && item.inventory?.Price !== null
            ? Number(item.inventory.Price)
            : 0);
        
        // Extended cost = (Price + OTP_Amount_State) * Quantity_Ordered + PrepaidTax_Amount
        const otpAmountState = item.OTP_Amount_State !== undefined && item.OTP_Amount_State !== null
          ? Number(item.OTP_Amount_State)
          : 0;
        const prepaidTaxAmount = item.PrepaidTax_Amount !== undefined && item.PrepaidTax_Amount !== null
          ? Number(item.PrepaidTax_Amount)
          : 0;
        const extendedCost = (unitCost + otpAmountState) * orderedQty + prepaidTaxAmount;
        
        const retail = item.Retail !== undefined && item.Retail !== null
          ? Number(item.Retail)
          : (item.Retail_Price !== undefined && item.Retail_Price !== null
            ? Number(item.Retail_Price)
            : (item.inventory?.Retail !== undefined && item.inventory?.Retail !== null
              ? Number(item.inventory.Retail)
              : (item.Price !== undefined && item.Price !== null
                ? Number(item.Price)
                : 0)));
        
        // Sequence - may come from backend in future, for now use Line_Number
        const sequence = item.Sequence !== undefined && item.Sequence !== null
          ? Number(item.Sequence)
          : (item.inventory?.Sequence !== undefined && item.inventory?.Sequence !== null
            ? Number(item.inventory.Sequence)
            : (item.Line_Number !== undefined && item.Line_Number !== null
              ? Number(item.Line_Number)
              : index + 1));
        
        // Sales Category - from inventory.SalesCategory.Category_Desc
        const salesCategory = item.inventory?.SalesCategory?.Category_Desc || 
                            item.Sales_Category_Desc || 
                            item.SalesCategory || 
                            (item.Sales_Category !== undefined && item.Sales_Category !== null 
                              ? String(item.Sales_Category) 
                              : '') ||
                            '';
        
        // Price Class - from inventory.PriceClass.Class_Desc
        const priceClass = item.inventory?.PriceClass?.Class_Desc || 
                          item.Price_Class_Desc || 
                          item.PriceClass || 
                          item.Price_Class || 
                          item.inventory?.Price_Class_Desc ||
                          '';
        
        // Section - from inventory.Section
        const section = item.inventory?.Section || 
                       item.Section || 
                       item.inventory?.Section2 ||
                       '';
        
        // Location - from inventory.Location (may be 0, convert to string)
        const location = item.inventory?.Location !== undefined && item.inventory?.Location !== null
          ? (item.inventory.Location === 0 ? '' : String(item.inventory.Location))
          : (item.Location !== undefined && item.Location !== null
            ? (item.Location === 0 ? '' : String(item.Location))
            : (item.inventory?.Location2 !== undefined && item.inventory?.Location2 !== null
              ? (item.inventory.Location2 === 0 ? '' : String(item.inventory.Location2))
              : ''));
        
        // Vendor Item - from inventory.Vendor_ItemNumberAlpha
        const vendorItem = item.inventory?.Vendor_ItemNumberAlpha || 
                          item.inventory?.Vendor_Item || 
                          item.Vendor_Item || 
                          item.VendorItem || 
                          item.inventory?.VendorItem ||
                          '';
        
        return {
          lineNumber,
          orderedQty,
          scannedQty: '', // Empty for manual entry
          itemNumber,
          description: String(description || ''),
          pack,
          size: String(size || ''),
          upc: String(upc || ''),
          onhand: Number(onhand || 0),
          salesCategory: String(salesCategory),
          priceClass: String(priceClass),
          unitCost,
          extendedCost,
          retail,
          section: String(section),
          location: String(location),
          vendorItem: String(vendorItem),
          sequence,
        };
      });

      const totals = {
        totalPieces: items.reduce((sum: number, item: any) => sum + (item.orderedQty || 0), 0),
        totalCartons: items.length,
        totalLines: items.length,
        totalExtendedCost: items.reduce((sum: number, item: any) => sum + (item.extendedCost || 0), 0),
      };

      // Get customer route and stop from Routes array
      const customerRoute = customer.Routes && customer.Routes.length > 0 
        ? customer.Routes[0].Route_Number || 0 
        : (customer.Route || 0);
      const customerStop = customer.Routes && customer.Routes.length > 0 
        ? customer.Routes[0].Stop_Number || 0 
        : (customer.Stop || 0);
      
      // Build customer address from components
      const customerAddress = customer.C_Address || '';
      const customerCity = customer.C_City || '';
      const customerState = customer.C_State || '';
      const customerZip = customer.C_Zip || '';
      const fullAddress = [customerAddress, customerCity, customerState, customerZip]
        .filter(Boolean)
        .join(', ');
      
      // Build distributor address from components
      const distributorAddr1 = distributor.D_Addr1 || '';
      const distributorAddr2 = distributor.D_Addr2 || '';
      const distributorCity = distributor.D_City || '';
      const distributorState = distributor.D_State || '';
      const distributorZip = distributor.D_Zip || '';
      const distributorAddressParts = [distributorAddr1, distributorAddr2, distributorCity, distributorState, distributorZip]
        .filter(Boolean);
      const distributorAddress = distributorAddressParts.join(', ');
      
      const orderData = {
        customer: {
          number: orderHeader.C_Number || customer.C_Number || 0,
          name: customer.C_Name || customer.C_CoName || '',
          address: fullAddress || customer.C_Address || '',
          phone: customer.C_Phone || '',
          route: customerRoute,
          stop: customerStop,
        },
        distributor: {
          name: distributor.D_Name || '',
          address: distributorAddress || distributor.D_Addr1 || '',
        },
        // Invoice_Number may not be present in current API, use Order_Number as fallback
        invoiceNumber: orderHeader.Invoice_Number || 
                      orderHeader.InvoiceNumber || 
                      String(orderHeader.Order_Number || orderNumber),
        isReprint: isReprint,
        orderNumber: String(orderHeader.Order_Number || orderNumber),
        orderDate: orderHeader.Order_Date || '',
        // Invoice_Date may not be present in current API, use Order_Date as fallback
        invoiceDate: orderHeader.Invoice_Date || 
                    orderHeader.InvoiceDate || 
                    orderHeader.Order_Date || 
                    '',
        items,
        totals,
      };

      // Generate PDF using template (no template name = uses default/most recent)
      // Generate PDF
      await generatePicklistPDF(orderData);
      
      // Mark picklist as printed only if it hasn't been printed before
      if (!picklistPrinted) {
        try {
          await makePickListPrinted(orderNumber);
        } catch (printError: any) {
          console.error('Error marking picklist as printed:', printError);
          // Don't show error to user if PDF was generated successfully
          // The picklist was printed, just the status update failed
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
      render: (row) => (
        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
          <IconButton
            size="small"
            onClick={() => handlePrintPicklist(row.Order_Number, row.Picklist_Printed)}
            disabled={row.isConfirmed === true || printingOrder === row.Order_Number}
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
      ),
    },
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

            <CustomDateRangePicker 
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              onStartDateChange={setSelectedStartDate}
              onEndDateChange={setSelectedEndDate}
              isLabel={false}
              sx={{mb: 0, width: {xs: "100%", md: "auto"}}}
            />
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
          stickyLastTwoColumns={true}
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
    </Box>
  );
};

export default AdminOrder;