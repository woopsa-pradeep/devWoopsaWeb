import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Paper } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import TextInput from '../../../component/atoms/TextInput';
import { MultiSearchableDropdown } from '../../../component/atoms/SearchableDropdown';
import { getCustomerListAsPerSalesRep } from '../../../redux/apis/sales/retailerApis';
import { getCustomerRouteList } from '../../../redux/apis/distrubutor/listApis';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useDebounce } from '../../../hooks/useDebounce';
import RetailerViewModal from '../../../component/molecules/RetailerViewModal';
import { useSelector } from 'react-redux';

function ActionMenu({ row, onView }: { row: any; onView: (row: any) => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleView = () => {
    onView(row);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleView} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><VisibilityIcon fontSize="small"/> View</MenuItem>
      </Menu>
    </>
  );
}

const Retailer = () => {
  const [search, setSearch] = useState('');
  const [selectedRoutes, setSelectedRoutes] = useState<{ label: string; value: string }[]>([]);
  const [selectedStops, setSelectedStops] = useState<{ label: string; value: string }[]>([]);
  const debouncedSearch = useDebounce(search, 400);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null);
  const [routeOptions, setRouteOptions] = useState<{ label: string; value: string }[]>([]);
  const [stopOptions, setStopOptions] = useState<{ label: string; value: string }[]>([]);
  const { selectedCustomer } = useSelector((state: any) => state.auth);

  // Fetch route and stop data
  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const response: any = await getCustomerRouteList();
        const data: any = response?.data?.data;
        
        if (data?.route) {
          const routes = data.route.map((route: any) => ({
            label: `${route.Route_Number}`,
            value: route.Route_Number.toString()
          }));
          setRouteOptions(routes);
        }
        
        if (data?.stop) {
          const stops = data.stop.map((stop: any) => ({
            label: `${stop.Stop_Number}`,
            value: stop.Stop_Number.toString()
          }));
          setStopOptions(stops);
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
      }
    };

    fetchRouteData();
  }, []);

  useEffect(() => {
    const fetchRetailers = async () => {
      setLoading(true);
      try {
        const params = {
          search: debouncedSearch,
          page: currentPage,
          limit: pageSize,
          customerId: selectedCustomer?.C_Number,
          routes: selectedRoutes.map(route => route.value) || [],
          stopNumber: selectedStops.map(stop => stop.value) || []
        };
        const res = await getCustomerListAsPerSalesRep(params) as any;
        setRetailers(res?.data?.customers || []);
        setTotalItems(res?.data?.pagination?.totalCount || 0);
        setTotalPages(Math.ceil((res?.data?.pagination?.totalCount || 0) / pageSize));
      } catch (error) {
        console.error('Error fetching retailers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetailers();
  }, [currentPage, pageSize, debouncedSearch, selectedRoutes, selectedStops]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleRouteChange = (value: { label: string; value: string }[]) => {
    setSelectedRoutes(value);
    setCurrentPage(1);
  };

  const handleStopChange = (value: { label: string; value: string }[]) => {
    setSelectedStops(value);
    setCurrentPage(1);
  };

  const onViewRetailer = (retailer: any) => {
    setSelectedRetailer(retailer);
    setViewModalOpen(true);
  };

  const columns: TableColumn<any>[] = [
    { id: 'C_Number', label: 'Customer ID', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_Number || "-"}</Typography> },
    { id: 'C_Name', label: 'Customer Name', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_Name || "-"}</Typography> },
    { id: 'C_PhoneMobile', label: 'Phone number', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_PhoneMobile || "-"}</Typography> },
    { id: 'C_Email', label: 'Email address', render: (row) => <Typography color="text.secondary" fontSize={14}>{row.C_Email || "-"}</Typography> },
    {
      id: 'C_Inactive',
      label: 'Status',
      render: (row) => (
        <Box
          sx={{
            color: !row.C_Inactive ? 'rgb(8, 194, 33)' : 'rgb(255, 102, 102)',
            bgcolor: !row.C_Inactive ? 'rgba(10, 255, 112, 0.1)' : 'rgba(255, 102, 102, 0.1)',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 400,
            display: 'inline-block',
          }}
        >
          {!row.C_Inactive ? 'Active' : 'Inactive'}
        </Box>
      ),
    },
    {
      id: 'web_order',
      label: 'Web Order',
      render: (row) => {
        return (
          <Box p={1} height={30} width={30} display="flex" alignItems="center" justifyContent="center" sx={{bgcolor: row?.orderStats?.Web ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)', borderRadius: 2}}>
            <Typography color={row?.orderStats?.Web ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)'} fontSize={14}>{row?.orderStats?.Web || "0"}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'mobile_order',
      label: 'Mobile Order',
      render: (row) => {
        return (
          <Box p={1} height={30} width={30} display="flex" alignItems="center" justifyContent="center" sx={{bgcolor: row?.orderStats?.Mobile ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)', borderRadius: 2}}>
            <Typography color={row?.orderStats?.Mobile ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)'} fontSize={14}>{row?.orderStats?.Mobile || "0"}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'ERP Order',
      label: 'ERP Order',
      render: (row) => {
        return (
          <Box p={1} height={30} width={30} display="flex" alignItems="center" justifyContent="center" sx={{bgcolor: row?.orderStats?.ERP ? 'rgba(41, 230, 130, 0.2)' : 'rgba(243, 78, 78, 0.2)', borderRadius: 2}}>
            <Typography color={row?.orderStats?.ERP ? 'rgba(39, 158, 130, 1)' : 'rgba(243, 78, 78, 1)'} fontSize={14}>{row?.orderStats?.ERP || "0"}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => <ActionMenu row={row} onView={onViewRetailer} />,
    },
  ];

  return (
    <Box sx={{ p: 3, pt: 0 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} mt={0}>
        <Typography fontSize={18} fontWeight={400} color="text.primary">Retailers</Typography>
      </Box>
      <Paper
        sx={{ mb: 2, boxShadow: 'none', borderRadius: '0px' }}
      >
      <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          sx={{
            width: '100%',
            '@media (max-width:600px)': {
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 1.5,
            },
          }}
        >
          <Box flex={1} minWidth={180}>
            <TextInput
              placeholder="Search Customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: '100%' }}
            />
          </Box>
          <Box flex={1} minWidth={180}>
            <MultiSearchableDropdown
              options={routeOptions}
              value={selectedRoutes}
              onChange={handleRouteChange}
              placeholder="Select routes"
              sx={{ width: '100%' }}
            />
          </Box>
          <Box flex={1} minWidth={180}>
            <MultiSearchableDropdown
              options={stopOptions}
              value={selectedStops}
              onChange={handleStopChange}
              placeholder="Select stops"
              sx={{ width: '100%' }}
            />
          </Box>
        </Box>
      </Box>
      <CommonTable
        data={retailers}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
        containerHeight="calc(100vh - 393px)"
      />
      </Paper>
      
      <RetailerViewModal
        retailer={selectedRetailer}
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
    </Box>
  );
};

export default Retailer;