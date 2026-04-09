import React, { useEffect, useState } from "react";
import CommonTable, {
  TableColumn,
} from "../../component/atoms/Table/CommonTable";
import { getAccountReceivablesRetailerList } from "../../redux/apis/retailer/accountReceivableApis";
import { Box, Typography, Paper, Grid, Tabs, Tab } from "@mui/material";
import { formatApiDate } from "../../utils/formatApiDate";
import TextInput from "../../component/atoms/TextInput";

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
        {formatApiDate(row.invoiceDate) || "-"}
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
        {formatApiDate(row.postingDate) || "-"}
      </Typography>
    ),
  },
];

const AccountReceivableRetailer = () => {
  const [data, setData] = useState<AccountReceivableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [horizontalTab, setHorizontalTab] = useState("Charges");    
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Get columns based on selected tab
  const getColumns = () => {
    return horizontalTab === "Payments" ? paymentColumns : defaultColumns;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = (await getAccountReceivablesRetailerList({
        page: currentPage,
        limit: pageSize,
        search: search,
        tab: horizontalTab.toLowerCase()
      })) as any;

      
      setData(res?.data?.accountReceivablesList || []);
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

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, search, horizontalTab]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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
      
      <Tabs
        value={horizontalTab}
          onChange={(v: any) => { setHorizontalTab(v?.target?.innerText); setCurrentPage(1); }}
        sx={{ mt: 2, minHeight: '35px !important' }}
      >
        <Tab label="Charges" sx={{
          backgroundColor: horizontalTab === "Charges" ? 'primary.main' : 'transparent',
          color: horizontalTab === "Charges" ? 'white' : 'text.secondary',
          borderRadius: '10px 10px 0 0',
          textTransform: 'none',
          // minWidth: 120,
          fontWeight: 400,
          '&.Mui-selected': {
            color: 'white',
          },
          mr: 1,
          minHeight: '35px !important',
        }} />
        <Tab label="Refunds" sx={{
          backgroundColor: horizontalTab === "Refunds" ? 'primary.main' : 'transparent',
          color: horizontalTab === "Refunds" ? 'white' : 'text.secondary',
          borderRadius: '10px 10px 0 0',
          textTransform: 'none',
          // minWidth: 120,
          fontWeight: 400,
          '&.Mui-selected': {
            color: 'white',
          },
          minHeight: '35px !important',
        }} />
        <Tab label="Payments" sx={{
          backgroundColor: horizontalTab === "Payments" ? 'primary.main' : 'transparent',
          color: horizontalTab === "Payments" ? 'white' : 'text.secondary',
          borderRadius: '10px 10px 0 0',
          textTransform: 'none',
          // minWidth: 120,
          fontWeight: 400,
          '&.Mui-selected': {
            color: 'white',
          },
          minHeight: '35px !important',
        }} />
      </Tabs>
      <Paper sx={{ boxShadow: "none", borderRadius: "0px" }}>
        <Box px={2} pt={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextInput
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ fontSize: "14px", mb: 0 }}
              />
            </Grid>
          </Grid>
        </Box>
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
          containerHeight={"calc(100vh - 402px)"}
        />
      </Paper>
    </Box>
  );
};

export default AccountReceivableRetailer;