import React, { useEffect, useState } from 'react';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import { getVendorList } from '../../../redux/apis/distrubutor/VendorsApis';
import { CircularProgress, Box, Typography, Paper, Grid } from '@mui/material';
import TextInput from '../../../component/atoms/TextInput';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../component/atoms/CustomButton';
import AddIcon from '@mui/icons-material/Add';

interface VendorItem {
  Primary_Vendor: number;
  V_Description: string;
  V_Addr1: string;
  V_Addr2: string;
  V_City: string;
  V_State: string;
  V_Zip: string;
  V_Phone: string;
  V_Terms: string;
  V_Email: string;
  V_FEIN: string;
}

const columns: TableColumn<VendorItem>[] = [
  { id: 'Primary_Vendor', label: 'Vendor ID', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.Primary_Vendor || "-"}</Typography>) },
  { id: 'V_Description', label: 'Company Name', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Description || "-"}</Typography>) },
  { id: 'V_Addr1', label: 'Address Line 1', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Addr1 || "-"}</Typography>) },
  { id: 'V_Addr2', label: 'Address Line 2', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Addr2 || "-"}</Typography>) },
  { id: 'V_City', label: 'City', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_City || "-"}</Typography>) },
  { id: 'V_State', label: 'State', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_State || "-"}</Typography>) },
  { id: 'V_Zip', label: 'Zip Code', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Zip || "-"}</Typography>) },
  { id: 'V_Phone', label: 'Phone', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Phone || "-"}</Typography>) },
  { id: 'V_Terms', label: 'Payment Terms', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Terms || "-"}</Typography>) },
  { id: 'V_Email', label: 'Email', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_Email || "-"}</Typography>) },
  { id: 'V_FEIN', label: 'Tax ID', render: row => ( <Typography fontSize={14} fontWeight={400} color="text.secondary">{row.V_FEIN || "-"}</Typography>) }
];

const Vendors = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = (await getVendorList({ page: currentPage, limit: pageSize, search: search })) as any;
        setData(res?.data?.vendorList || []);
        setTotalItems(res?.data?.totalCount || 0);
        setTotalPages(Math.ceil((res?.data?.totalCount || 0) / pageSize));
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
      setLoading(false);
    };
    fetchData();
  }, [currentPage, pageSize, search]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // No client-side filtering needed since we're using server-side pagination
  const displayData = data;

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, pt: { xs: 0, md: 0 } }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography fontSize={18} fontWeight={400} color="text.primary">
          Vendors
        </Typography>
        <CustomButton 
          fullWidth={false}
          onClick={() => navigate('/admin/vendor/add')}
          icon={<AddIcon sx={{ fontSize: 20 }} />}
          iconPosition="left"
          sx={{ mt: 0 }} 
        >
          Add Vendor
        </CustomButton>
      </Box>
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
        <CommonTable
          data={displayData}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          containerHeight="calc(100vh - 365px)"
        />
      )}
      </Paper>
    </Box>
  );
};

export default Vendors;
