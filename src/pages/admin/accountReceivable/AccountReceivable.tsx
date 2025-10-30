import React, { useEffect, useState } from "react";
import CommonTable, {
  TableColumn,
} from "../../../component/atoms/Table/CommonTable";
import {
  // getAccountReceivableSummary,
  getAccountReceivablesList,
} from "../../../redux/apis/distrubutor/accountReceivableApis";
import { getCustomerList } from "../../../redux/apis/distrubutor/listApis";
import CustomAutoComplete from "../../../component/atoms/CustomAutoComplete";
import {
  CircularProgress,
  Box,
  Typography,
  Paper,
  // Grid,
  Tabs,
  Tab,
} from "@mui/material";
import dayjs from "dayjs";
// import charges from "../../../assets/totalCharges.svg";
// import credit from "../../../assets/totalCredit.svg";
// import payment from "../../../assets/totalPayment.svg";
import currentDue from "../../../assets/currentDue.svg";

interface AccountReceivableItem {
  type: string;
  invoiceNumber: string;
  invoiceAmount: string;
  invoiceDue: string;
  invoiceDate: string;
  // Payment tab fields
  subType?: string;
  reference?: string;
  amount?: string;
  applied?: string;
  balance?: string;
  postingDate?: string;
}

interface CustomerOption {
  label: string;
  value: string;
}

interface CustomerDropdownOption extends CustomerOption {
  fullData: CustomerInfo;
}

interface CustomerInfo {
  C_Number: number;
  C_Name: string;
  C_CoName: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Zip: string;
  C_Phone: string;
  C_Email: string;
}

// Helper function to convert amount to positive
const toPositiveAmount = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.abs(num || 0).toString();
};

// Columns for Charges and Refunds tabs
const defaultColumns: TableColumn<AccountReceivableItem>[] = [
  {
    id: "type",
    label: "Types",
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        {row.type || "-"}
      </Typography>
    ),
  },
  {
    id: "invoiceNumber",
    label: "Invoice Number",
    align: 'center',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        {row.invoiceNumber || "-"}
      </Typography>
    ),
  },
  {
    id: "reference",
    label: "Reference",
    align: 'center',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
       {row.reference || "-"}
      </Typography>
    ),
  },
  {
    id: "invoiceAmount",
    label: "Invoice Amount",
    align: 'right',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        $ {Number(toPositiveAmount(row.invoiceAmount)).toFixed(2)}
      </Typography>
    ),
  },
  {
    id: "invoiceDue",
    label: "Invoice Due",
    align: 'right',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        $ {Number(toPositiveAmount(row.invoiceDue)).toFixed(2)}
      </Typography>
    ),
  },
  {
    id: "invoiceDate",
    label: "Invoice Date",
    align: 'center',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        {row.invoiceDate ? dayjs(row.invoiceDate).format("YYYY/MM/DD") : "-"}
      </Typography>
    ),
  },
];

// Columns for Payments tab
const paymentColumns: TableColumn<AccountReceivableItem>[] = [
  {
    id: "subType",
    label: "Sub Types",
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        {row.subType || "-"}
      </Typography>
    ),
  },
  {
    id: "reference",
    label: "Reference",
    align: 'center',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        {row.reference || "-"}
      </Typography>
    ),
  },
  {
    id: "amount",
    label: "Amount",
    align: 'right',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        $ {Number(toPositiveAmount(row?.amount || 0)).toFixed(2)}
      </Typography>
    ),
  },
  {
    id: "applied",
    label: "Applied",
    align: 'right',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        $ {Number(toPositiveAmount(row?.applied || 0)).toFixed(2)}
      </Typography>
    ),
  },
  {
    id: "balance",
    label: "Balance",
    align: 'right',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        $ {Number(toPositiveAmount(row?.balance || 0)).toFixed(2)}
      </Typography>
    ),
  },
  {
    id: "postingDate",
    label: "Posting Date",
    align: 'center',
    render: (row) => (
      <Typography fontSize={14} fontWeight={400} color="text.secondary">
        {row.postingDate ? dayjs(row.postingDate).format("YYYY/MM/DD") : "-"}
      </Typography>
    ),
  },
];

const AccountReceivable = () => {
  const [data, setData] = useState<AccountReceivableItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [horizontalTab, setHorizontalTab] = useState("Charges");
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // const [summary, setSummary] = useState<any>({});
  const [currentDueCount, setCurrentDueCount] = useState(0);
  
  // Customer dropdown states
  const [customers, setCustomers] = useState<CustomerDropdownOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState<CustomerInfo | null>(null);

  // Get columns based on selected tab
  const getColumns = () => {
    return horizontalTab === "Payments" ? paymentColumns : defaultColumns;
  };

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
      const response: any = await getCustomerList();
      const customerOptions: CustomerDropdownOption[] = (response?.data?.data || []).map((customer: any) => ({
        label: customer.C_Name || customer.name || 'Unknown Customer',
        value: customer.C_Number?.toString() || customer.id?.toString() || '',
        fullData: customer // Store the full customer data
      }));
      setCustomers(customerOptions);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // const getSummary = async () => {
  //   const res = (await getAccountReceivableSummary()) as any;
  //   console.log(res);
  //   setSummary(res?.data);
  // };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = (await getAccountReceivablesList({
        page: currentPage,
        limit: pageSize,
        // search: search,
        tab: horizontalTab.toLowerCase(),
        C_Number: selectedCustomer?.value || "", // Add cNumber parameter
      })) as any;

      setData(res?.data?.accountReceivablesList || []);
      setCurrentDueCount(Math.abs(res?.data?.currentDue || 0));
      setTotalItems(res?.data?.totalCount || 0);
      setTotalPages(Math.ceil((res?.data?.totalCount || 0) / pageSize));
    } catch (err) {
      console.log(err);
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    }
    setLoading(false);
  };

  // useEffect(() => {
  //   getSummary();
  // }, []);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, horizontalTab, selectedCustomer]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleCustomerChange = (customer: any) => {
    setSelectedCustomer(customer);
    // Find and set the full customer info
    if (customer) {
      const fullCustomerData = customers.find(c => c.value === customer.value)?.fullData;
      setSelectedCustomerInfo(fullCustomerData || null);
    } else {
      setSelectedCustomerInfo(null);
    }
    setCurrentPage(1); // Reset to first page when changing customer
  };

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography fontSize={18} fontWeight={400} color="text.primary">
          Account Receivables
        </Typography>
      </Box>

 {/* Customer Information Display */}
 {selectedCustomerInfo && (
        <Paper 
          sx={{ 
            boxShadow: "none", 
            borderRadius: "8px",
            mt: 2, 
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            p: 1.5
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11px' }}>
                Customer Name:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {selectedCustomerInfo.C_Name}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11px' }}>
                Company:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {selectedCustomerInfo.C_CoName || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11px' }}>
                City,State,ZIP:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {selectedCustomerInfo.C_City},{selectedCustomerInfo.C_State} {selectedCustomerInfo.C_Zip}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11px' }}>
                Phone:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {selectedCustomerInfo.C_Phone}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11px' }}>
                Address:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {selectedCustomerInfo.C_Address}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11px' }}>
                Email:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {selectedCustomerInfo.C_Email}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
      {/* <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 100,
            }}
          >
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
              <img src={charges} alt="charges" />
              <Typography fontSize={16} fontWeight={400} color="text.secondary">
                Total Charges
              </Typography>
            </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <Typography fontSize={18} fontWeight={500} color="text.primary">
                  $ {toPositiveAmount(summary?.totalCharges)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 100,
            }}
          >
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
              <img src={credit} alt="credit" />
              <Typography fontSize={16} fontWeight={400} color="text.secondary">
                Total Credits
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <Typography fontSize={18} fontWeight={500} color="text.primary">
                $ {toPositiveAmount(summary?.totalCredit)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 100,
            }}
          >
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
              <img src={payment} alt="payment" />
              <Typography fontSize={16} fontWeight={400} color="text.secondary">
                Total Payments
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <Typography fontSize={18} fontWeight={500} color="text.primary">
                $ {toPositiveAmount(summary?.totalPayments)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid> */}

      <Tabs
        value={horizontalTab}
        onChange={(v: any) => {
          setHorizontalTab(v?.target?.innerText);
          setCurrentPage(1);
        }}
        sx={{ mt: 2, minHeight: "35px !important" }}
      >
        <Tab
          label="Charges"
          sx={{
            backgroundColor:
              horizontalTab === "Charges" ? "primary.main" : "transparent",
            color: horizontalTab === "Charges" ? "white" : "text.secondary",
            borderRadius: "10px 10px 0 0",
            textTransform: "none",
            // minWidth: 120,
            fontWeight: 400,
            "&.Mui-selected": {
              color: "white",
            },
            mr: 1,
            minHeight: "35px !important",
          }}
        />
        <Tab
          label="Refunds"
          sx={{
            backgroundColor:
              horizontalTab === "Refunds" ? "primary.main" : "transparent",
            color: horizontalTab === "Refunds" ? "white" : "text.secondary",
            borderRadius: "10px 10px 0 0",
            textTransform: "none",
            // minWidth: 120,
            fontWeight: 400,
            "&.Mui-selected": {
              color: "white",
            },
            minHeight: "35px !important",
          }}
        />
        <Tab
          label="Payments"
          sx={{
            backgroundColor:
              horizontalTab === "Payments" ? "primary.main" : "transparent",
            color: horizontalTab === "Payments" ? "white" : "text.secondary",
            borderRadius: "10px 10px 0 0",
            textTransform: "none",
            // minWidth: 120,
            fontWeight: 400,
            "&.Mui-selected": {
              color: "white",
            },
            minHeight: "35px !important",
          }}
        />
      </Tabs>
      
     
      
      <Paper sx={{ boxShadow: "none", borderRadius: "10px" }}>
        <Box px={2} pt={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box sx={{ display: 'flex', gap: 2, flex: 1, mr: 2 }}>
              
          
                             <CustomAutoComplete
                 options={customers}
                 value={selectedCustomer}
                 onChange={handleCustomerChange}
                 getOptionLabel={(option) => option.label || ''}
                 placeholder="Search and select customer..."
                 loading={customerLoading}
                 fullWidth={false}
                 size="small"
               />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                background: 'paper.main',
                borderRadius: '24px',
                px: 1,
                py: 1,
                boxShadow: '0 1px 4px rgba(20, 20, 43, 0.06)',
                border: '1px solid',
                borderColor: 'divider',
                minWidth: 0,
                gap: 1,
                width: 'fit-content',
              }}
            >
              {/* Red Icon */}
              <img src={currentDue} alt="currentDue" />
              <Typography fontSize={14} fontWeight={400} color="text.secondary" mr={0.5}>
                Current Due
              </Typography>
              <Typography fontSize={16} fontWeight={500} color="text.primary">
                $ {currentDueCount}
              </Typography>
            </Box>
          </Box>
        </Box>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={200}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <CommonTable
              data={data}
              columns={getColumns()}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
              containerHeight={"calc(100vh - 520px)"}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AccountReceivable;
