import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Paper } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import CommonTable, { TableColumn } from '../../../component/atoms/Table/CommonTable';
import TextInput from '../../../component/atoms/TextInput';
import { customerList } from '../../../redux/apis/distrubutor/retailerApis';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import { useDebounce } from '../../../hooks/useDebounce';
import RetailerViewModal from '../../../component/molecules/RetailerViewModal';
import CustomerLimitModal from '../../../component/molecules/CustomerLimitModal';
import { setCustomerLimit } from '../../../redux/apis/distrubutor/settingApis';
import { CustomerLimitFormData } from './customerLimitSchema';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../component/atoms/CustomButton';

function ActionMenu({ row, onView, onSetLimit, onEdit }: { row: any; onView: (row: any) => void; onSetLimit: (row: any) => void; onEdit: (row: any) => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleView = () => {
    onView(row);
    handleClose();
  };

  const handleSetLimit = () => {
    onSetLimit(row);
    handleClose();
  };

  const handleEdit = () => {
    onEdit(row);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleView} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><VisibilityIcon fontSize="small"/> View</MenuItem>
        <MenuItem onClick={handleEdit} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><EditIcon fontSize="small" sx={{ color: 'primary.main' }}/> Edit</MenuItem>
        {row?.isRegisterCustomer && <MenuItem onClick={handleSetLimit} sx={{ fontSize: 14, gap: 1, color: 'text.primary' }}><SettingsIcon fontSize="small"/> Set Limit</MenuItem>}
      </Menu>
    </>
  );
}

const Retailer = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [selectedLimitRetailer, setSelectedLimitRetailer] = useState<any>(null);
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch,
        page: currentPage,
        limit: pageSize
      };
      const res = await customerList(params) as any;
      setRetailers(res?.data?.customerList || []);
      setTotalItems(res?.data?.totalCount || 0);
      setTotalPages(Math.ceil((res?.data?.totalCount || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching retailers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, [currentPage, pageSize, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const onViewRetailer = (retailer: any) => {
    setSelectedRetailer(retailer);
    setViewModalOpen(true);
  };

  const onSetLimitRetailer = (retailer: any) => {
    setSelectedLimitRetailer(retailer);
    setLimitModalOpen(true);
  };

  const onEditRetailer = (retailer: any) => {
    navigate(`/admin/retailer/edit/${retailer.C_Number}`);
  };

  const handleLimitSubmit = async (data: CustomerLimitFormData) => {
    if (!selectedLimitRetailer) return;
    
    setSavingLimit(true);
    try {
      await setCustomerLimit(selectedLimitRetailer.C_Number, data);
      toast.success('Customer limit updated successfully!');
      await fetchRetailers(); // Fetch updated data after successful limit update
      setLimitModalOpen(false);
      setSelectedLimitRetailer(null);
    } catch (error) {
      console.error('Failed to update customer limit:', error);
      toast.error('Failed to update customer limit');
    } finally {
      setSavingLimit(false);
    }
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
      render: (row) => <ActionMenu row={row} onView={onViewRetailer} onSetLimit={onSetLimitRetailer} onEdit={onEditRetailer} />,
    },
  ];

  return (
    <Box sx={{ p: 3, pt: 0 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} mt={0}>
        <Typography fontSize={18} fontWeight={400} color="text.primary">Retailers</Typography>
        <CustomButton 
          fullWidth={false}
          onClick={() => navigate('/admin/retailer/add')}
          icon={<AddIcon sx={{ fontSize: 20 }} />}
          iconPosition="left"
          sx={{ mt: 0 }} 
        >
          Add Retailer
        </CustomButton>
      </Box>
      <Paper
        sx={{ mb: 2, boxShadow: 'none', borderRadius: '0px' }}
      >
      <Box display="flex" alignItems="center" justifyContent="space-between" p={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextInput
            placeholder="Search Customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 220 }}
          />
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
      
      <CustomerLimitModal
        open={limitModalOpen}
        onClose={() => {
          setLimitModalOpen(false);
          setSelectedLimitRetailer(null);
        }}
        customerId={selectedLimitRetailer?.C_Number || ''}
        customerName={selectedLimitRetailer?.C_Name || ''}
        initialData={{
          maxOrderLimit: selectedLimitRetailer?.customerLimit?.maxOrderLimit,
          minOrderAmount: selectedLimitRetailer?.customerLimit?.minOrderAmount,
        }}
        onSubmit={handleLimitSubmit}
        loading={savingLimit}
      />
    </Box>
  );
};

export default Retailer;